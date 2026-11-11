package httpapi

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"

	"github.com/ericmora/dentistes/apps/api/internal/store"
)

func (s *Server) handleAdminListTenants(w http.ResponseWriter, r *http.Request) {
	var tenants []store.TenantSummary
	err := s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		var err error
		if tenants, err = s.store.ListTenants(r.Context(), tx); err != nil {
			return err
		}
		for i := range tenants {
			if _, err := tx.Exec(r.Context(), "select set_config('app.current_tenant_id', $1, true)", tenants[i].ID); err != nil {
				return err
			}
			sub, err := s.store.GetSubscription(r.Context(), tx, tenants[i].ID)
			if errors.Is(err, store.ErrNotFound) {
				continue
			}
			if err != nil {
				return err
			}
			tenants[i].SubscriptionStatus = sub.Status
			tenants[i].PlanKey = sub.PlanKey
			tenants[i].CurrentPeriodEnd = sub.CurrentPeriodEnd
			tenants[i].StripeCustomerID = sub.StripeCustomerID
		}
		return nil
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"tenants": tenants})
}

func (s *Server) handleAdminSetTenantStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Status string `json:"status"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	status := strings.ToUpper(strings.TrimSpace(req.Status))
	switch status {
	case "TRIAL", "ACTIVE", "SUSPENDED", "CANCELED":
	default:
		writeError(w, http.StatusBadRequest, "VALIDATION", "invalid status", nil)
		return
	}
	err := s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		if _, err := s.store.GetTenantByID(r.Context(), tx, id); err != nil {
			return err
		}
		return s.store.UpdateTenantStatus(r.Context(), tx, id, status)
	})
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "tenant not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": status})
}

func (s *Server) handleAdminListFeatures(w http.ResponseWriter, r *http.Request) {
	var features []store.Feature
	err := s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		var err error
		features, err = s.store.ListFeatureCatalog(r.Context(), tx)
		return err
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"features": features})
}

func (s *Server) handleAdminSetFeature(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "id")
	var req struct {
		FeatureKey string  `json:"feature_key"`
		Enabled    bool    `json:"enabled"`
		ExpiresAt  *string `json:"expires_at"`
	}
	if err := decodeJSON(r, &req); err != nil || req.FeatureKey == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", "feature_key is required", nil)
		return
	}
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		if _, err := time.Parse(time.RFC3339, *req.ExpiresAt); err != nil {
			writeError(w, http.StatusBadRequest, "VALIDATION", "expires_at must be RFC3339", nil)
			return
		}
	}
	var expires *string
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		expires = req.ExpiresAt
	}
	err := s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		if _, err := s.store.GetTenantByID(r.Context(), tx, tenantID); err != nil {
			return err
		}
		catalog, err := s.store.ListFeatureCatalog(r.Context(), tx)
		if err != nil {
			return err
		}
		found := false
		for _, f := range catalog {
			if f.Key == req.FeatureKey {
				found = true
				break
			}
		}
		if !found {
			return store.ErrNotFound
		}
		if _, err := tx.Exec(r.Context(), "select set_config('app.current_tenant_id', $1, true)", tenantID); err != nil {
			return err
		}
		return s.store.UpsertTenantFeature(r.Context(), tx, tenantID, req.FeatureKey, req.Enabled, expires)
	})
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "tenant or feature not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"tenant_id": tenantID, "feature_key": req.FeatureKey, "enabled": req.Enabled})
}

func (s *Server) handleAdminListPlans(w http.ResponseWriter, r *http.Request) {
	var plans []store.Plan
	err := s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		var err error
		plans, err = s.store.ListPlans(r.Context(), tx, false)
		return err
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"plans": plans})
}

func (s *Server) handleAdminUpdatePlan(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")
	var req struct {
		PriceMonthlyCents int    `json:"price_monthly_cents"`
		StripePriceID     string `json:"stripe_price_id"`
		IsActive          bool   `json:"is_active"`
	}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	if req.PriceMonthlyCents < 0 {
		writeError(w, http.StatusBadRequest, "VALIDATION", "price must be >= 0", nil)
		return
	}
	err := s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		if _, err := s.store.GetPlanByKey(r.Context(), tx, key); err != nil {
			return err
		}
		return s.store.UpdatePlan(r.Context(), tx, key, req.PriceMonthlyCents, req.StripePriceID, req.IsActive)
	})
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "plan not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"key": key})
}

func (s *Server) handleAdminGetTenantFeatures(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "id")
	var catalog []store.Feature
	var effective map[string]bool
	var overrides []store.Override
	err := s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		if _, err := s.store.GetTenantByID(r.Context(), tx, tenantID); err != nil {
			return err
		}
		if _, err := tx.Exec(r.Context(), "select set_config('app.current_tenant_id', $1, true)", tenantID); err != nil {
			return err
		}
		ent, err := s.loadEntitlementsForTenant(r.Context(), tx, tenantID)
		if err != nil {
			return err
		}
		catalog = ent.Catalog
		effective = ent.Result.Features
		overrides, err = s.store.TenantFeatureOverrides(r.Context(), tx, tenantID)
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
	writeJSON(w, http.StatusOK, map[string]any{
		"features":  catalog,
		"effective": effective,
		"overrides": overrides,
	})
}

func (s *Server) handleAdminListDomains(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "id")
	var domains []store.TenantDomain
	err := s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		if _, err := s.store.GetTenantByID(r.Context(), tx, tenantID); err != nil {
			return err
		}
		var err error
		domains, err = s.store.ListTenantDomains(r.Context(), tx, tenantID)
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
	writeJSON(w, http.StatusOK, map[string]any{"domains": domains})
}

func (s *Server) handleAdminProvisionTenant(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "id")
	err := s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		tenant, err := s.store.GetTenantByID(r.Context(), tx, tenantID)
		if err != nil {
			return err
		}
		domains, err := s.store.ListTenantDomains(r.Context(), tx, tenantID)
		if err != nil {
			return err
		}
		if len(domains) == 0 {
			if _, err := s.store.CreateTenantDomain(r.Context(), tx, tenantID, tenant.Subdomain+"."+s.cfg.TenantBaseDomain, "tenant-"+tenant.Subdomain+"-tls"); err != nil {
				return err
			}
		}
		return s.store.ResetTenantDomainProvisioning(r.Context(), tx, tenantID)
	})
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "tenant not found", nil)
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]string{"status": "PENDING"})
}
