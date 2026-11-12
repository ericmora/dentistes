package httpapi

import (
	"errors"
	"net/http"
	"net/mail"
	"regexp"
	"strings"

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
	var req onboardingRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	s.executeOnboarding(w, r, req)
}

func (s *Server) handlePublicTenant(w http.ResponseWriter, r *http.Request) {
	subdomain := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("subdomain")))
	host := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("host")))
	if host == "" && subdomain != "" {
		host = subdomain + "." + s.cfg.TenantBaseDomain
	}
	if host == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "subdomain or host is required", nil)
		return
	}
	var tenant *store.PublicTenant
	err := s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		var err error
		tenant, err = s.store.GetPublicTenantByHostname(r.Context(), tx, host)
		return err
	})
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "tenant not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"tenant": tenant})
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

type leadRequest struct {
	ContactName string `json:"contact_name"`
	ClinicName  string `json:"clinic_name"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Interest    string `json:"interest"`
	Lang        string `json:"lang"`
	Notes       string `json:"notes"`
	Source      string `json:"source"`
	UTMSource   string `json:"utm_source"`
	UTMMedium   string `json:"utm_medium"`
	UTMCampaign string `json:"utm_campaign"`
}

func validateLeadRequest(req leadRequest, ip string) (store.NewLead, string) {
	contact := strings.TrimSpace(req.ContactName)
	clinic := strings.TrimSpace(req.ClinicName)
	email := strings.ToLower(strings.TrimSpace(req.Email))
	phone := strings.TrimSpace(req.Phone)
	notes := strings.TrimSpace(req.Notes)
	source := strings.TrimSpace(req.Source)
	if source == "" {
		source = "landing"
	}

	if len(contact) < 2 {
		return store.NewLead{}, "contact_name is required"
	}
	if len(clinic) < 2 {
		return store.NewLead{}, "clinic_name is required"
	}
	if _, err := mail.ParseAddress(email); err != nil {
		return store.NewLead{}, "invalid email"
	}
	if len(phone) > 30 {
		return store.NewLead{}, "phone is too long"
	}
	if len(notes) > 2000 {
		return store.NewLead{}, "notes must be at most 2000 characters"
	}

	interest := strings.ToUpper(strings.TrimSpace(req.Interest))
	switch interest {
	case "":
		interest = "DEMO"
	case "DEMO", "TRIAL", "MIGRATION", "OTHER":
	default:
		return store.NewLead{}, "invalid interest"
	}

	lang := strings.ToLower(strings.TrimSpace(req.Lang))
	switch lang {
	case "":
		lang = "ca"
	case "es", "en", "ca":
	default:
		lang = "ca"
	}

	return store.NewLead{
		ContactName: contact,
		ClinicName:  clinic,
		Email:       email,
		Phone:       phone,
		Interest:    interest,
		Lang:        lang,
		Notes:       notes,
		Source:      trimMax(source, 80),
		UTMSource:   trimMax(strings.TrimSpace(req.UTMSource), 100),
		UTMMedium:   trimMax(strings.TrimSpace(req.UTMMedium), 100),
		UTMCampaign: trimMax(strings.TrimSpace(req.UTMCampaign), 100),
		IP:          ip,
	}, ""
}

func trimMax(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max]
}

func (s *Server) handleCreateLead(w http.ResponseWriter, r *http.Request) {
	var req leadRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	input, errMsg := validateLeadRequest(req, clientIP(r))
	if errMsg != "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", errMsg, nil)
		return
	}

	var lead *store.Lead
	err := s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		var err error
		lead, err = s.store.CreateLead(r.Context(), tx, input)
		return err
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not save lead", nil)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"lead": lead,
	})
}
