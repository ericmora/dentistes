package httpapi

import (
	"errors"
	"net/http"
	"net/mail"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/ericmora/dentistes/apps/api/internal/auth"
	"github.com/ericmora/dentistes/apps/api/internal/store"
)

var subdomainRe = regexp.MustCompile(`^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`)

var reservedSubdomains = map[string]bool{
	"www": true, "app": true, "admin": true, "api": true, "mail": true,
	"status": true, "docs": true, "support": true, "billing": true,
}

var errConflict = errors.New("conflict")

func (s *Server) handlePublicPlans(w http.ResponseWriter, r *http.Request) {
	var plans []store.Plan
	var catalog []store.Feature
	err := s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		var err error
		if plans, err = s.store.ListPlans(r.Context(), tx, true); err != nil {
			return err
		}
		catalog, err = s.store.ListFeatureCatalog(r.Context(), tx)
		return err
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"plans": plans, "feature_catalog": catalog})
}

func (s *Server) handleSignup(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TenantName string `json:"tenant_name"`
		Subdomain  string `json:"subdomain"`
		Email      string `json:"email"`
		Password   string `json:"password"`
		FullName   string `json:"full_name"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	req.TenantName = strings.TrimSpace(req.TenantName)
	req.Subdomain = strings.ToLower(strings.TrimSpace(req.Subdomain))
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.FullName = strings.TrimSpace(req.FullName)

	if len(req.TenantName) < 2 {
		writeError(w, http.StatusBadRequest, "VALIDATION", "tenant_name is required", nil)
		return
	}
	if !subdomainRe.MatchString(req.Subdomain) || reservedSubdomains[req.Subdomain] {
		writeError(w, http.StatusBadRequest, "VALIDATION", "invalid or reserved subdomain", nil)
		return
	}
	if _, err := mail.ParseAddress(req.Email); err != nil {
		writeError(w, http.StatusBadRequest, "VALIDATION", "invalid email", nil)
		return
	}
	if len(req.Password) < 10 {
		writeError(w, http.StatusBadRequest, "VALIDATION", "password must be at least 10 characters", nil)
		return
	}
	if len(req.FullName) < 2 {
		writeError(w, http.StatusBadRequest, "VALIDATION", "full_name is required", nil)
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}

	trialEnds := time.Now().AddDate(0, 0, s.cfg.TrialDays)
	var resp *authResponse
	err = s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		if _, err := s.store.GetUserByEmail(r.Context(), tx, req.Email); err == nil {
			return errConflict
		} else if !errors.Is(err, store.ErrNotFound) {
			return err
		}
		if _, err := s.store.GetTenantBySubdomain(r.Context(), tx, req.Subdomain); err == nil {
			return errConflict
		} else if !errors.Is(err, store.ErrNotFound) {
			return err
		}
		user, err := s.store.CreateUser(r.Context(), tx, req.Email, hash, req.FullName, false)
		if err != nil {
			return err
		}
		tenant, err := s.store.CreateTenant(r.Context(), tx, req.TenantName, req.Subdomain, trialEnds)
		if err != nil {
			return err
		}
		if _, err := tx.Exec(r.Context(), "select set_config('app.current_tenant_id', $1, true)", tenant.ID); err != nil {
			return err
		}
		if _, err := tx.Exec(r.Context(), "select set_config('app.current_user_id', $1, true)", user.ID); err != nil {
			return err
		}
		if _, err := s.store.CreateMembership(r.Context(), tx, tenant.ID, user.ID, "OWNER"); err != nil {
			return err
		}
		if err := s.store.CreateTrialSubscription(r.Context(), tx, tenant.ID, "starter", trialEnds); err != nil {
			return err
		}
		memberships := []store.Membership{{
			TenantID: tenant.ID, UserID: user.ID, Role: "OWNER",
			TenantName: tenant.Name, Subdomain: tenant.Subdomain, TenantStatus: tenant.Status,
		}}
		resp, err = s.buildAuth(r.Context(), tx, w, user, memberships, tenant.ID, "OWNER", isNative(r))
		return err
	})
	if errors.Is(err, errConflict) {
		writeError(w, http.StatusConflict, "CONFLICT", "email or subdomain already exists", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusCreated, resp)
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	tx := txFrom(r.Context())
	user, err := s.store.GetUserByID(r.Context(), tx, claims.Subject)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "invalid session", nil)
		return
	}
	memberships, err := s.store.ListMembershipsForUser(r.Context(), tx, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	ent, err := s.entitlementsFor(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"user":            toUserPayload(user),
		"memberships":     toMembershipPayloads(memberships),
		"active_tenant":   toTenantPayload(ent.Tenant),
		"role":            claims.Role,
		"permissions":     auth.PermissionsFor(claims.Role),
		"features":        ent.Result.Features,
		"feature_catalog": ent.Catalog,
		"entitlements":    ent.Result,
		"billing":         ent.Subscription,
	})
}
