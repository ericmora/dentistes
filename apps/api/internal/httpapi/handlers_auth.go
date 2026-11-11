package httpapi

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/ericmora/dentistes/apps/api/internal/auth"
	"github.com/ericmora/dentistes/apps/api/internal/store"
)

var (
	errInvalidCredentials = errors.New("invalid credentials")
	errNoMembership       = errors.New("no tenant membership")
)

type userPayload struct {
	ID              string `json:"id"`
	Email           string `json:"email"`
	FullName        string `json:"full_name"`
	IsPlatformAdmin bool   `json:"is_platform_admin"`
}

type membershipPayload struct {
	TenantID     string `json:"tenant_id"`
	TenantName   string `json:"tenant_name"`
	Subdomain    string `json:"subdomain"`
	Role         string `json:"role"`
	TenantStatus string `json:"tenant_status"`
}

type tenantPayload struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Subdomain   string     `json:"subdomain"`
	Status      string     `json:"status"`
	TrialEndsAt *time.Time `json:"trial_ends_at,omitempty"`
}

type authResponse struct {
	AccessToken  string              `json:"access_token"`
	TokenType    string              `json:"token_type"`
	ExpiresIn    int                 `json:"expires_in"`
	RefreshToken string              `json:"refresh_token,omitempty"`
	User         userPayload         `json:"user"`
	Memberships  []membershipPayload `json:"memberships"`
	ActiveTenant *tenantPayload      `json:"active_tenant,omitempty"`
}

func toUserPayload(u *store.User) userPayload {
	return userPayload{ID: u.ID, Email: u.Email, FullName: u.FullName, IsPlatformAdmin: u.IsPlatformAdmin}
}

func toMembershipPayloads(in []store.Membership) []membershipPayload {
	out := make([]membershipPayload, 0, len(in))
	for _, m := range in {
		out = append(out, membershipPayload{
			TenantID:     m.TenantID,
			TenantName:   m.TenantName,
			Subdomain:    m.Subdomain,
			Role:         m.Role,
			TenantStatus: m.TenantStatus,
		})
	}
	return out
}

func toTenantPayload(t *store.Tenant) *tenantPayload {
	if t == nil {
		return nil
	}
	return &tenantPayload{ID: t.ID, Name: t.Name, Subdomain: t.Subdomain, Status: t.Status, TrialEndsAt: t.TrialEndsAt}
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email     string `json:"email"`
		Password  string `json:"password"`
		TenantID  string `json:"tenant_id"`
		Subdomain string `json:"subdomain"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "email and password are required", nil)
		return
	}

	var user *store.User
	err := s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		u, err := s.store.GetUserByEmail(r.Context(), tx, email)
		if errors.Is(err, store.ErrNotFound) {
			return errInvalidCredentials
		}
		if err != nil {
			return err
		}
		user = u
		return nil
	})
	if errors.Is(err, errInvalidCredentials) {
		writeError(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "invalid email or password", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	ok, err := auth.VerifyPassword(req.Password, user.PasswordHash)
	if err != nil || !ok {
		writeError(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", "invalid email or password", nil)
		return
	}
	if !user.IsActive {
		writeError(w, http.StatusForbidden, "USER_DISABLED", "user is disabled", nil)
		return
	}

	var resp *authResponse
	err = s.db.WithUser(r.Context(), user.ID, func(tx pgx.Tx) error {
		memberships, err := s.store.ListMembershipsForUser(r.Context(), tx, user.ID)
		if err != nil {
			return err
		}
		tenantID, role := selectMembership(memberships, req.TenantID, req.Subdomain)
		if tenantID == "" && !user.IsPlatformAdmin {
			return errNoMembership
		}
		_ = s.store.TouchLastLogin(r.Context(), tx, user.ID)
		resp, err = s.buildAuth(r.Context(), tx, w, user, memberships, tenantID, role, isNative(r))
		return err
	})
	if errors.Is(err, errNoMembership) {
		writeError(w, http.StatusForbidden, "NO_MEMBERSHIP", "user has no active tenant membership", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (s *Server) handleRefresh(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	_ = decodeJSON(r, &req)
	token := req.RefreshToken
	if token == "" {
		if c, err := r.Cookie("dentistes_rt"); err == nil {
			token = c.Value
		}
	}
	if token == "" {
		writeError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "missing refresh token", nil)
		return
	}
	native := req.RefreshToken != "" || isNative(r)
	hash := auth.HashRefreshToken(token)

	var userID, tenantID string
	err := s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		uid, tid, expiresAt, revoked, err := s.store.GetSessionByHash(r.Context(), tx, hash)
		if errors.Is(err, store.ErrNotFound) {
			return errInvalidCredentials
		}
		if err != nil {
			return err
		}
		if revoked || expiresAt.Before(time.Now()) {
			return errInvalidCredentials
		}
		if err := s.store.DeleteSessionByHash(r.Context(), tx, hash); err != nil {
			return err
		}
		userID, tenantID = uid, tid
		return nil
	})
	if errors.Is(err, errInvalidCredentials) {
		s.clearRefreshCookie(w)
		writeError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "invalid refresh token", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}

	var resp *authResponse
	err = s.db.WithUser(r.Context(), userID, func(tx pgx.Tx) error {
		user, err := s.store.GetUserByID(r.Context(), tx, userID)
		if err != nil || !user.IsActive {
			return errInvalidCredentials
		}
		memberships, err := s.store.ListMembershipsForUser(r.Context(), tx, userID)
		if err != nil {
			return err
		}
		role := ""
		if tenantID != "" {
			m, err := s.store.GetMembership(r.Context(), tx, userID, tenantID)
			if err != nil {
				return errInvalidCredentials
			}
			role = m.Role
		} else if !user.IsPlatformAdmin {
			return errInvalidCredentials
		}
		resp, err = s.buildAuth(r.Context(), tx, w, user, memberships, tenantID, role, native)
		return err
	})
	if errors.Is(err, errInvalidCredentials) {
		s.clearRefreshCookie(w)
		writeError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "invalid refresh token", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (s *Server) handleLogout(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	_ = decodeJSON(r, &req)
	token := req.RefreshToken
	if token == "" {
		if c, err := r.Cookie("dentistes_rt"); err == nil {
			token = c.Value
		}
	}
	if token != "" {
		hash := auth.HashRefreshToken(token)
		_ = s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
			return s.store.DeleteSessionByHash(r.Context(), tx, hash)
		})
	}
	s.clearRefreshCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleSwitchTenant(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	var req struct {
		TenantID string `json:"tenant_id"`
	}
	if err := decodeJSON(r, &req); err != nil || req.TenantID == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "tenant_id is required", nil)
		return
	}
	tx := txFrom(r.Context())
	m, err := s.store.GetMembership(r.Context(), tx, claims.Subject, req.TenantID)
	if err != nil {
		writeError(w, http.StatusForbidden, "NO_MEMBERSHIP", "user is not a member of that tenant", nil)
		return
	}
	user, err := s.store.GetUserByID(r.Context(), tx, claims.Subject)
	if err != nil || !user.IsActive {
		writeError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "invalid session", nil)
		return
	}
	memberships, err := s.store.ListMembershipsForUser(r.Context(), tx, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	resp, err := s.buildAuth(r.Context(), tx, w, user, memberships, m.TenantID, m.Role, isNative(r))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (s *Server) buildAuth(ctx context.Context, tx pgx.Tx, w http.ResponseWriter, user *store.User, memberships []store.Membership, tenantID, role string, native bool) (*authResponse, error) {
	access, exp, err := s.tokens.Issue(user.ID, tenantID, role, user.IsPlatformAdmin)
	if err != nil {
		return nil, err
	}
	plain, hash, err := auth.NewRefreshToken()
	if err != nil {
		return nil, err
	}
	refreshExp := time.Now().Add(s.cfg.RefreshTTL)
	if err := s.store.CreateSession(ctx, tx, user.ID, tenantID, hash, "", "", refreshExp); err != nil {
		return nil, err
	}
	s.setRefreshCookie(w, plain, refreshExp)

	resp := &authResponse{
		AccessToken: access,
		TokenType:   "Bearer",
		ExpiresIn:   int(time.Until(exp).Seconds()),
		User:        toUserPayload(user),
		Memberships: toMembershipPayloads(memberships),
	}
	if native {
		resp.RefreshToken = plain
	}
	for _, m := range memberships {
		if m.TenantID == tenantID {
			resp.ActiveTenant = &tenantPayload{ID: m.TenantID, Name: m.TenantName, Subdomain: m.Subdomain, Status: m.TenantStatus}
			break
		}
	}
	return resp, nil
}

func selectMembership(memberships []store.Membership, tenantID, subdomain string) (string, string) {
	if tenantID != "" {
		for _, m := range memberships {
			if m.TenantID == tenantID {
				return m.TenantID, m.Role
			}
		}
		return "", ""
	}
	if subdomain != "" {
		for _, m := range memberships {
			if strings.EqualFold(m.Subdomain, subdomain) {
				return m.TenantID, m.Role
			}
		}
		return "", ""
	}
	if len(memberships) > 0 {
		return memberships[0].TenantID, memberships[0].Role
	}
	return "", ""
}

func isNative(r *http.Request) bool {
	return strings.EqualFold(r.Header.Get("X-Client"), "native")
}

func (s *Server) setRefreshCookie(w http.ResponseWriter, token string, expires time.Time) {
	c := &http.Cookie{
		Name:     "dentistes_rt",
		Value:    token,
		Path:     "/v1/auth",
		Domain:   s.cfg.CookieDomain,
		HttpOnly: true,
		Secure:   s.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		Expires:  expires,
		MaxAge:   int(time.Until(expires).Seconds()),
	}
	http.SetCookie(w, c)
}

func (s *Server) clearRefreshCookie(w http.ResponseWriter) {
	c := &http.Cookie{
		Name:     "dentistes_rt",
		Value:    "",
		Path:     "/v1/auth",
		Domain:   s.cfg.CookieDomain,
		HttpOnly: true,
		Secure:   s.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	}
	http.SetCookie(w, c)
}
