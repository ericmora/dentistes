package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"

	"github.com/ericmora/dentistes/apps/api/internal/fiscal"
	"github.com/ericmora/dentistes/apps/api/internal/store"
)

func detectCountryFromRequest(r *http.Request) string {
	if c := strings.TrimSpace(r.URL.Query().Get("country_code")); len(c) == 2 {
		return strings.ToUpper(c)
	}
	if c := strings.TrimSpace(r.Header.Get("CF-IPCountry")); len(c) == 2 {
		return strings.ToUpper(c)
	}
	if c := strings.TrimSpace(r.Header.Get("X-Vercel-IP-Country")); len(c) == 2 {
		return strings.ToUpper(c)
	}
	return "ES"
}

func (s *Server) handlePublicFiscalConfigs(w http.ResponseWriter, r *http.Request) {
	var list []store.RegionalFiscalConfig
	err := s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		var err error
		list, err = s.store.ListRegionalFiscalConfigs(r.Context(), tx)
		return err
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not list regional configs", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": list})
}

func (s *Server) handlePublicFiscalCapabilities(w http.ResponseWriter, r *http.Request) {
	countryCode := detectCountryFromRequest(r)
	var config *store.RegionalFiscalConfig
	_ = s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		var err error
		config, err = s.store.GetRegionalFiscalConfig(r.Context(), tx, countryCode)
		if errors.Is(err, store.ErrNotFound) {
			return nil
		}
		return err
	})

	caps := fiscal.ResolveCapabilities("", config, nil)
	writeJSON(w, http.StatusOK, caps)
}

func (s *Server) handleTenantFiscalCapabilities(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	if claims == nil || claims.TenantID == "" {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized", nil)
		return
	}

	tx := txFrom(r.Context())
	tenant, err := s.store.GetTenantByID(r.Context(), tx, claims.TenantID)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "tenant not found", nil)
		return
	}

	countryCode := tenant.BillingCountryCode
	if countryCode == "" {
		countryCode = "ES"
	}

	cfg, _ := s.store.GetRegionalFiscalConfig(r.Context(), tx, countryCode)
	flag, _ := s.store.GetTenantFeatureFlag(r.Context(), tx, tenant.ID, fiscal.FlagElectronicInvoicing)

	caps := fiscal.ResolveCapabilities(tenant.ID, cfg, flag)
	writeJSON(w, http.StatusOK, caps)
}

type waitlistRequest struct {
	FeatureKey string `json:"feature_key"`
	Notes      string `json:"notes"`
}

func (s *Server) handleTenantJoinFiscalWaitlist(w http.ResponseWriter, r *http.Request) {
	claims := claimsFrom(r.Context())
	if claims == nil || claims.TenantID == "" {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized", nil)
		return
	}

	var req waitlistRequest
	_ = decodeJSON(r, &req)

	flagKey := req.FeatureKey
	if flagKey == "" {
		flagKey = fiscal.FlagElectronicInvoicing
	}

	tx := txFrom(r.Context())
	tenant, err := s.store.GetTenantByID(r.Context(), tx, claims.TenantID)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "tenant not found", nil)
		return
	}

	flag := store.TenantFeatureFlag{
		TenantID:     tenant.ID,
		FlagKey:      flagKey,
		IsEnabled:    false,
		RolloutStage: "WAITLIST",
		Metadata: map[string]any{
			"requested_by": claims.Subject,
			"country_code": tenant.BillingCountryCode,
			"notes":        req.Notes,
		},
	}

	if err := s.store.UpsertTenantFeatureFlag(r.Context(), tx, flag); err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "could not join waitlist", nil)
		return
	}

	cfg, _ := s.store.GetRegionalFiscalConfig(r.Context(), tx, tenant.BillingCountryCode)
	caps := fiscal.ResolveCapabilities(tenant.ID, cfg, &flag)
	writeJSON(w, http.StatusOK, caps)
}
