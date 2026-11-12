package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5"

	"github.com/ericmora/dentistes/apps/api/internal/auth"
	"github.com/ericmora/dentistes/apps/api/internal/config"
	"github.com/ericmora/dentistes/apps/api/internal/db"
	"github.com/ericmora/dentistes/apps/api/internal/entitlements"
	"github.com/ericmora/dentistes/apps/api/internal/realtime"
	"github.com/ericmora/dentistes/apps/api/internal/store"
	"github.com/ericmora/dentistes/apps/api/internal/stripeapi"
)

type ctxKey string

const (
	ctxClaims   ctxKey = "claims"
	ctxTx       ctxKey = "tx"
	ctxEntCache ctxKey = "ent-cache"
	errRollback        = "rollback"
)

var errRollbackErr = errors.New(errRollback)

type Server struct {
	cfg     *config.Config
	db      *db.DB
	store   *store.Store
	tokens  *auth.TokenManager
	stripe  *stripeapi.Client
	limiter *rateLimiter
	hub     *realtime.Hub
}

func New(cfg *config.Config, database *db.DB, tokens *auth.TokenManager) *Server {
	return &Server{
		cfg:     cfg,
		db:      database,
		store:   store.New(),
		tokens:  tokens,
		stripe:  stripeapi.NewWithBaseURL(cfg.StripeSecretKey, cfg.StripeAPIBase),
		limiter: newRateLimiter(30, time.Minute),
		hub:     realtime.NewHub(),
	}
}

func (s *Server) Router() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID, middleware.RealIP, middleware.Recoverer, s.securityHeaders, s.cors)

	r.Get("/health", s.handleHealth)
	r.Get("/live", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "alive"})
	})

	r.Route("/v1", func(r chi.Router) {
		r.Get("/public/plans", s.handlePublicPlans)
		r.Get("/public/tenant", s.handlePublicTenant)
		r.With(s.rateLimit).Post("/public/signup", s.handleSignup)
		r.With(s.rateLimit).Post("/public/onboarding", s.handleOnboarding)
		r.With(s.rateLimit).Post("/public/leads", s.handleCreateLead)
		r.With(s.rateLimit).Post("/auth/login", s.handleLogin)
		r.Post("/auth/refresh", s.handleRefresh)
		r.Post("/auth/logout", s.handleLogout)
		r.Post("/webhooks/stripe", s.handleStripeWebhook)

		r.Group(func(r chi.Router) {
			r.Use(s.authenticate)
			r.Method(http.MethodPost, "/auth/switch-tenant", s.userTx(http.HandlerFunc(s.handleSwitchTenant)))

			r.Group(func(r chi.Router) {
				r.Use(s.tenantTx)
				r.Get("/me", s.handleMe)
				r.Get("/billing/subscription", s.handleSubscription)
				r.With(s.requirePermission("billing:manage")).Get("/billing/invoices", s.handleListInvoices)
				r.With(s.requirePermission("billing:manage")).Post("/billing/checkout", s.handleCheckout)
				r.With(s.requirePermission("billing:manage")).Post("/billing/confirm-checkout", s.handleConfirmCheckout)
				r.With(s.requirePermission("billing:manage")).Post("/billing/cancel", s.handleCancelSubscription)
				r.With(s.requirePermission("billing:manage")).Post("/billing/resume", s.handleResumeSubscription)
				r.With(s.requirePermission("billing:manage")).Post("/billing/portal", s.handlePortal)
				r.With(s.requirePermission("settings:manage")).Post("/clinic/cancel", s.handleCancelClinicAccount)

				r.Route("/patients", func(r chi.Router) {
					r.Use(s.requireFeature("patients"))
					r.With(s.requirePermission("patients:read")).Get("/", s.handleListPatients)
					r.With(s.requirePermission("patients:write")).Post("/", s.handleCreatePatient)
					r.With(s.requirePermission("patients:read")).Get("/{id}", s.handleGetPatient)
					r.With(s.requirePermission("patients:write")).Patch("/{id}", s.handleUpdatePatient)

					r.Group(func(r chi.Router) {
						r.Use(s.requireFeature("clinical_history"))
						r.With(s.requirePermission("clinical:read")).Get("/{id}/clinical-records", s.handleListClinicalRecords)
						r.With(s.requirePermission("clinical:write")).Post("/{id}/clinical-records", s.handleCreateClinicalRecord)
					})

					r.Group(func(r chi.Router) {
						r.Use(s.requireFeature("odontogram"))
						r.With(s.requirePermission("clinical:read")).Get("/{id}/odontograms", s.handleListOdontograms)
						r.With(s.requirePermission("clinical:write")).Put("/{id}/odontograms/{type}", s.handleUpsertOdontogram)
					})
				})

				r.Route("/users", func(r chi.Router) {
					r.Use(s.requirePermission("users:manage"))
					r.Get("/", s.handleListUsers)
					r.Post("/", s.handleCreateUser)
					r.Patch("/{id}", s.handleUpdateUser)
				})

				r.Route("/cabinets", func(r chi.Router) {
					r.Use(s.requireFeature("agenda"))
					r.With(s.requirePermission("appointments:read")).Get("/", s.handleListCabinets)
					r.With(s.requirePermission("settings:manage")).Post("/", s.handleCreateCabinet)
				})

				r.With(s.requireFeature("agenda"), s.requirePermission("appointments:read")).Get("/doctors", s.handleListDoctors)

				r.Route("/appointments", func(r chi.Router) {
					r.Use(s.requireFeature("agenda"))
					r.With(s.requirePermission("appointments:read")).Get("/", s.handleListAppointments)
					r.With(s.requirePermission("appointments:write")).Post("/", s.handleCreateAppointment)
					r.With(s.requirePermission("appointments:write")).Put("/{id}", s.handleUpdateAppointment)
					r.With(s.requirePermission("appointments:write")).Patch("/{id}/status", s.handleUpdateAppointmentStatus)
				})

				r.Route("/waiting-list", func(r chi.Router) {
					r.Use(s.requireFeature("waiting_list"))
					r.With(s.requirePermission("appointments:read")).Get("/", s.handleListWaitingList)
					r.With(s.requirePermission("appointments:write")).Post("/", s.handleCreateWaitingListEntry)
					r.With(s.requirePermission("appointments:read")).Get("/matches", s.handleMatchWaitingList)
					r.With(s.requirePermission("appointments:write")).Post("/{id}/hold", s.handleHoldWaitingListEntry)
					r.With(s.requirePermission("appointments:write")).Patch("/{id}/status", s.handleUpdateWaitingListStatus)
				})
			})

			r.With(s.requirePermission("appointments:read")).Get("/appointments/stream", s.handleAppointmentStream)

			r.Route("/admin", func(r chi.Router) {
				r.Use(s.requirePlatformAdmin)
				r.Get("/tenants", s.handleAdminListTenants)
				r.Post("/tenants/{id}/status", s.handleAdminSetTenantStatus)
				r.Get("/features", s.handleAdminListFeatures)
				r.Get("/tenants/{id}/features", s.handleAdminGetTenantFeatures)
				r.Get("/tenants/{id}/domains", s.handleAdminListDomains)
				r.Post("/tenants/{id}/provision", s.handleAdminProvisionTenant)
				r.Put("/tenants/{id}/features", s.handleAdminSetFeature)
				r.Get("/plans", s.handleAdminListPlans)
				r.Put("/plans/{key}", s.handleAdminUpdatePlan)
				r.Get("/leads", s.handleAdminListLeads)
				r.Patch("/leads/{id}", s.handleAdminUpdateLeadStatus)
			})
		})
	})

	return r
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	if err := s.db.Health(ctx); err != nil {
		writeError(w, http.StatusServiceUnavailable, "DB_UNAVAILABLE", "database unavailable", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		w.Header().Set("Cache-Control", "no-store")
		if s.cfg.CookieSecure {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			for _, allowed := range s.cfg.CORSOrigins {
				if allowed == origin {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Add("Vary", "Origin")
					w.Header().Set("Access-Control-Allow-Credentials", "true")
					w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
					w.Header().Set("Access-Control-Allow-Headers", "Authorization,Content-Type,X-Client")
					w.Header().Set("Access-Control-Max-Age", "600")
					break
				}
			}
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) rateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !s.limiter.allow(clientIP(r)) {
			writeError(w, http.StatusTooManyRequests, "RATE_LIMITED", "too many requests, try again later", nil)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func (s *Server) authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rawToken := ""
		header := r.Header.Get("Authorization")
		if strings.HasPrefix(header, "Bearer ") {
			rawToken = strings.TrimPrefix(header, "Bearer ")
		} else if q := r.URL.Query().Get("access_token"); q != "" && r.URL.Path == "/v1/appointments/stream" {
			rawToken = q
		}
		if rawToken == "" {
			writeError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "missing bearer token", nil)
			return
		}
		claims, err := s.tokens.Parse(rawToken)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "invalid or expired token", nil)
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), ctxClaims, claims)))
	})
}

func (s *Server) requirePlatformAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims := claimsFrom(r.Context())
		if claims == nil || !claims.PlatformAdmin {
			writeError(w, http.StatusForbidden, "FORBIDDEN", "platform admin required", nil)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) tenantTx(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims := claimsFrom(r.Context())
		if claims == nil || claims.TenantID == "" {
			writeError(w, http.StatusForbidden, "NO_TENANT", "no active tenant for this session", nil)
			return
		}
		err := s.db.WithTenant(r.Context(), claims.TenantID, claims.Subject, func(tx pgx.Tx) error {
			membership, err := s.store.GetMembership(r.Context(), tx, claims.Subject, claims.TenantID)
			if err != nil {
				writeError(w, http.StatusForbidden, "NO_MEMBERSHIP", "user is not an active member of this tenant", nil)
				return errRollbackErr
			}
			claims.Role = membership.Role
			ctx := context.WithValue(r.Context(), ctxTx, tx)
			ctx = context.WithValue(ctx, ctxEntCache, &entCache{})
			rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(rec, r.WithContext(ctx))
			if rec.status >= http.StatusBadRequest {
				return errRollbackErr
			}
			return nil
		})
		if errors.Is(err, errRollbackErr) {
			return
		}
		if err != nil {
			slog.Error("tenant transaction failed", "error", err)
			writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		}
	})
}

func (s *Server) userTx(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims := claimsFrom(r.Context())
		if claims == nil {
			writeError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "invalid session", nil)
			return
		}
		err := s.db.WithUser(r.Context(), claims.Subject, func(tx pgx.Tx) error {
			ctx := context.WithValue(r.Context(), ctxTx, tx)
			rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(rec, r.WithContext(ctx))
			if rec.status >= http.StatusBadRequest {
				return errRollbackErr
			}
			return nil
		})
		if errors.Is(err, errRollbackErr) {
			return
		}
		if err != nil {
			slog.Error("user transaction failed", "error", err)
			writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		}
	})
}

func (s *Server) requirePermission(permission string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := claimsFrom(r.Context())
			if claims == nil || !auth.HasPermission(claims.Role, permission) {
				writeError(w, http.StatusForbidden, "FORBIDDEN", "missing permission: "+permission, nil)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func (s *Server) requireFeature(feature string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ent, err := s.entitlementsFor(r.Context())
			if err != nil {
				writeError(w, http.StatusInternalServerError, "INTERNAL", "could not resolve entitlements", nil)
				return
			}
			if !ent.Result.Features[feature] {
				writeError(w, http.StatusPaymentRequired, "FEATURE_NOT_ENTITLED", "feature not available for this subscription", map[string]any{
					"feature": feature,
					"reason":  ent.Result.BlockedReason,
					"plan":    ent.Result.PlanKey,
				})
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

type entContext struct {
	Result       entitlements.Result
	Catalog      []store.Feature
	Subscription *store.Subscription
	Tenant       *store.Tenant
}

type entCache struct {
	once sync.Once
	val  *entContext
	err  error
}

func (s *Server) entitlementsFor(ctx context.Context) (*entContext, error) {
	cache, _ := ctx.Value(ctxEntCache).(*entCache)
	if cache == nil {
		cache = &entCache{}
	}
	cache.once.Do(func() {
		cache.val, cache.err = s.loadEntitlements(ctx)
	})
	return cache.val, cache.err
}

func (s *Server) loadEntitlements(ctx context.Context) (*entContext, error) {
	claims := claimsFrom(ctx)
	return s.loadEntitlementsForTenant(ctx, txFrom(ctx), claims.TenantID)
}

func (s *Server) loadEntitlementsForTenant(ctx context.Context, tx pgx.Tx, tenantID string) (*entContext, error) {
	tenant, err := s.store.GetTenantByID(ctx, tx, tenantID)
	if err != nil {
		return nil, err
	}
	catalog, err := s.store.ListFeatureCatalog(ctx, tx)
	if err != nil {
		return nil, err
	}
	keys := make([]string, 0, len(catalog))
	for _, f := range catalog {
		keys = append(keys, f.Key)
	}
	sub, err := s.store.GetSubscription(ctx, tx, tenantID)
	if err != nil && !errors.Is(err, store.ErrNotFound) {
		return nil, err
	}
	planKey := ""
	if sub != nil {
		planKey = sub.PlanKey
	}
	planFeatures := []string{}
	if planKey != "" {
		if planFeatures, err = s.store.PlanFeatures(ctx, tx, planKey); err != nil {
			return nil, err
		}
	}
	overrides, err := s.store.TenantFeatureOverrides(ctx, tx, tenantID)
	if err != nil {
		return nil, err
	}
	subInput := entitlements.Subscription{}
	if sub != nil {
		subInput = entitlements.Subscription{
			Status:           sub.Status,
			PlanKey:          sub.PlanKey,
			CurrentPeriodEnd: sub.CurrentPeriodEnd,
			TrialEndsAt:      sub.TrialEndsAt,
		}
	}
	converted := make([]entitlements.Override, 0, len(overrides))
	for _, o := range overrides {
		converted = append(converted, entitlements.Override{FeatureKey: o.FeatureKey, Enabled: o.Enabled, ExpiresAt: o.ExpiresAt})
	}
	result := entitlements.Compute(tenant.Status, tenant.TrialEndsAt, subInput, keys, planFeatures, converted, time.Now())
	return &entContext{Result: result, Catalog: catalog, Subscription: sub, Tenant: tenant}, nil
}

func claimsFrom(ctx context.Context) *auth.Claims {
	c, _ := ctx.Value(ctxClaims).(*auth.Claims)
	return c
}

func txFrom(ctx context.Context) pgx.Tx {
	tx, _ := ctx.Value(ctxTx).(pgx.Tx)
	return tx
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

type apiError struct {
	Code    string         `json:"code"`
	Message string         `json:"message"`
	Details map[string]any `json:"details,omitempty"`
}

func writeError(w http.ResponseWriter, status int, code, message string, details map[string]any) {
	writeJSON(w, status, map[string]any{"error": apiError{Code: code, Message: message, Details: details}})
}

func decodeJSON(r *http.Request, dst any) error {
	dec := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
}

type rateLimiter struct {
	mu     sync.Mutex
	hits   map[string][]time.Time
	max    int
	window time.Duration
}

func newRateLimiter(max int, window time.Duration) *rateLimiter {
	return &rateLimiter{hits: map[string][]time.Time{}, max: max, window: window}
}

func (l *rateLimiter) allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	kept := l.hits[key][:0]
	for _, t := range l.hits[key] {
		if now.Sub(t) < l.window {
			kept = append(kept, t)
		}
	}
	if len(kept) >= l.max {
		l.hits[key] = kept
		return false
	}
	l.hits[key] = append(kept, now)
	return true
}
