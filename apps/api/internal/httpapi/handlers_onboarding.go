package httpapi

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/mail"
	"strings"
	"time"
	"unicode"

	"github.com/jackc/pgx/v5"

	"github.com/ericmora/dentistes/apps/api/internal/auth"
	"github.com/ericmora/dentistes/apps/api/internal/store"
	"github.com/ericmora/dentistes/apps/api/internal/stripeapi"
)

type onboardingRequest struct {
	ClinicName         string `json:"clinic_name"`
	TenantName         string `json:"tenant_name"`
	Subdomain          string `json:"subdomain"`
	FullName           string `json:"full_name"`
	Email              string `json:"email"`
	Password           string `json:"password"`
	CabinetsCount      int    `json:"cabinets_count"`
	Locale             string `json:"locale"`
	PlanKey            string `json:"plan_key"`
	CountryCode        string `json:"country_code"`
	BillingCountryCode string `json:"billing_country_code"`
	Currency           string `json:"currency"`
	BillingCurrency    string `json:"billing_currency"`
	TaxID              string `json:"tax_id"`
}

type validatedOnboarding struct {
	ClinicName    string
	Subdomain     string
	FullName      string
	Email         string
	Password      string
	CabinetsCount int
	Locale        string
	CountryCode   string
	Currency      string
	TaxID         string
	Timezone      string
	PlanKey       string
}

var accentReplacements = strings.NewReplacer(
	"à", "a", "á", "a", "â", "a", "ä", "a", "ã", "a",
	"è", "e", "é", "e", "ê", "e", "ë", "e",
	"ì", "i", "í", "i", "î", "i", "ï", "i",
	"ò", "o", "ó", "o", "ô", "o", "ö", "o", "õ", "o",
	"ù", "u", "ú", "u", "û", "u", "ü", "u",
	"ñ", "n", "ç", "c", "·", "-",
)

func slugifySubdomain(name string) string {
	s := strings.ToLower(strings.TrimSpace(name))
	s = accentReplacements.Replace(s)
	var b strings.Builder
	prevDash := false
	for _, r := range s {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
			prevDash = false
		case unicode.IsSpace(r) || r == '-' || r == '_' || r == '.':
			if b.Len() > 0 && !prevDash {
				b.WriteByte('-')
				prevDash = true
			}
		}
		if b.Len() >= 48 {
			break
		}
	}
	out := strings.Trim(b.String(), "-")
	if len(out) < 2 {
		return "clinica"
	}
	return out
}

func localeDefaults(raw string) (locale, currency, timezone string) {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "es", "es-es":
		return "es-ES", "USD", "Europe/Madrid"
	case "es-mx", "mx":
		return "es-MX", "USD", "America/Mexico_City"
	case "en", "en-gb", "en-us":
		return "en-GB", "USD", "Europe/London"
	default:
		return "ca-ES", "USD", "Europe/Madrid"
	}
}

func defaultCountryAndCurrency(locale string) (country, currency string) {
	switch strings.ToLower(strings.TrimSpace(locale)) {
	case "es-mx", "mx":
		return "MX", "MXN"
	case "es-co", "co":
		return "CO", "USD"
	case "es-pe", "pe":
		return "PE", "USD"
	case "es-cl", "cl":
		return "CL", "USD"
	case "en", "en-us":
		return "US", "USD"
	case "es", "es-es", "ca", "ca-es":
		return "ES", "EUR"
	default:
		return "ES", "EUR"
	}
}

func validateOnboardingRequest(req onboardingRequest) (validatedOnboarding, string) {
	clinic := strings.TrimSpace(req.ClinicName)
	if clinic == "" {
		clinic = strings.TrimSpace(req.TenantName)
	}
	if len(clinic) < 2 {
		return validatedOnboarding{}, "clinic_name is required"
	}

	sub := strings.ToLower(strings.TrimSpace(req.Subdomain))
	if sub == "" {
		sub = slugifySubdomain(clinic)
	}
	if !subdomainRe.MatchString(sub) || reservedSubdomains[sub] {
		return validatedOnboarding{}, "invalid or reserved subdomain"
	}

	fullName := strings.TrimSpace(req.FullName)
	if len(fullName) < 2 {
		return validatedOnboarding{}, "full_name is required"
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if _, err := mail.ParseAddress(email); err != nil {
		return validatedOnboarding{}, "invalid email"
	}

	if len(req.Password) < 10 {
		return validatedOnboarding{}, "password must be at least 10 characters"
	}

	cabinets := req.CabinetsCount
	if cabinets <= 0 {
		cabinets = 1
	}
	if cabinets > 20 {
		return validatedOnboarding{}, "cabinets_count must be between 1 and 20"
	}

	planKey := strings.ToLower(strings.TrimSpace(req.PlanKey))
	if planKey == "" {
		planKey = "base"
	}

	country := strings.ToUpper(strings.TrimSpace(req.CountryCode))
	if country == "" {
		country = strings.ToUpper(strings.TrimSpace(req.BillingCountryCode))
	}
	curr := strings.ToUpper(strings.TrimSpace(req.Currency))
	if curr == "" {
		curr = strings.ToUpper(strings.TrimSpace(req.BillingCurrency))
	}

	defCountry, defCurr := defaultCountryAndCurrency(req.Locale)
	if country == "" {
		country = defCountry
	}
	if curr == "" {
		curr = defCurr
	}

	if curr != "EUR" && curr != "MXN" && curr != "USD" {
		return validatedOnboarding{}, "currency must be EUR, MXN or USD"
	}

	loc, _, tz := localeDefaults(req.Locale)
	return validatedOnboarding{
		ClinicName:    clinic,
		Subdomain:     sub,
		FullName:      fullName,
		Email:         email,
		Password:      req.Password,
		CabinetsCount: cabinets,
		Locale:        loc,
		CountryCode:   country,
		Currency:      curr,
		TaxID:         strings.TrimSpace(req.TaxID),
		Timezone:      tz,
		PlanKey:       planKey,
	}, ""
}

var (
	errPlanNotFound      = errors.New("plan not found")
	errPlanNotConfigured = errors.New("plan has no stripe price configured")
)

func (s *Server) handleOnboarding(w http.ResponseWriter, r *http.Request) {
	var req onboardingRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_BODY", "invalid JSON body", nil)
		return
	}
	s.executeOnboarding(w, r, req)
}

func (s *Server) executeOnboarding(w http.ResponseWriter, r *http.Request, req onboardingRequest) {
	in, errMsg := validateOnboardingRequest(req)
	if errMsg != "" {
		writeError(w, http.StatusBadRequest, "VALIDATION", errMsg, nil)
		return
	}
	if !s.stripe.Enabled() {
		writeError(w, http.StatusServiceUnavailable, "STRIPE_DISABLED", "Stripe must be configured to activate the 30-day trial", nil)
		return
	}

	hash, err := auth.HashPassword(in.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "INTERNAL", "internal error", nil)
		return
	}

	cfgBytes, _ := json.Marshal(map[string]any{
		"locale":         in.Locale,
		"currency":       in.Currency,
		"timezone":       in.Timezone,
		"cabinets_count": in.CabinetsCount,
	})

	trialEnds := time.Now().AddDate(0, 0, s.cfg.TrialDays)
	var resp *authResponse
	var checkoutURL string
	var hostname string

	err = s.db.WithTx(r.Context(), func(tx pgx.Tx) error {
		if _, err := s.store.GetUserByEmail(r.Context(), tx, in.Email); err == nil {
			return errConflict
		} else if !errors.Is(err, store.ErrNotFound) {
			return err
		}
		if _, err := s.store.GetTenantBySubdomain(r.Context(), tx, in.Subdomain); err == nil {
			return errConflict
		} else if !errors.Is(err, store.ErrNotFound) {
			return err
		}

		plan, err := s.store.GetPlanByKey(r.Context(), tx, in.PlanKey)
		if errors.Is(err, store.ErrNotFound) || (plan != nil && !plan.IsActive) {
			return errPlanNotFound
		}
		if err != nil {
			return err
		}
		stripePriceID := plan.StripePriceID
		if planPrice, err := s.store.GetPlanPrice(r.Context(), tx, plan.Key, in.Currency, "month"); err == nil && planPrice != nil && planPrice.StripePriceID != nil && *planPrice.StripePriceID != "" {
			stripePriceID = *planPrice.StripePriceID
		}
		if stripePriceID == "" {
			return errPlanNotConfigured
		}

		user, err := s.store.CreateUser(r.Context(), tx, in.Email, hash, in.FullName, false)
		if err != nil {
			return err
		}
		tenant, err := s.store.CreateTenantWithBilling(r.Context(), tx, in.ClinicName, in.Subdomain, in.CountryCode, in.Currency, in.TaxID, trialEnds)
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
		if err := s.store.CreateCabinets(r.Context(), tx, tenant.ID, in.CabinetsCount); err != nil {
			return err
		}
		if err := s.store.SeedDefaultTreatments(r.Context(), tx, tenant.ID); err != nil {
			return err
		}
		if err := s.store.UpdateTenantConfig(r.Context(), tx, tenant.ID, string(cfgBytes)); err != nil {
			return err
		}
		hostname = in.Subdomain + "." + s.cfg.TenantBaseDomain
		if _, err := s.store.CreateTenantDomain(r.Context(), tx, tenant.ID, hostname, "tenant-"+in.Subdomain+"-tls"); err != nil {
			return err
		}

		customerID, err := s.stripe.CreateCustomer(r.Context(), in.Email, in.ClinicName, tenant.ID)
		if err != nil {
			return err
		}
		checkoutURL, err = s.stripe.CreateCheckout(r.Context(), stripeapi.CheckoutParams{
			CustomerID:              customerID,
			PriceID:                 stripePriceID,
			TenantID:                tenant.ID,
			SuccessURL:              s.cfg.AppURL + "/onboarding/complete?session_id={CHECKOUT_SESSION_ID}",
			CancelURL:               s.cfg.AppURL + "/onboarding?checkout=cancel",
			TrialPeriodDays:         s.cfg.TrialDays,
			PaymentMethodCollection: "always",
		})
		if err != nil {
			return err
		}
		if err := s.store.CreatePendingSubscription(r.Context(), tx, tenant.ID, plan.Key, customerID); err != nil {
			return err
		}

		memberships := []store.Membership{{
			TenantID: tenant.ID, UserID: user.ID, Role: "OWNER",
			TenantName: tenant.Name, Subdomain: tenant.Subdomain, TenantStatus: tenant.Status,
		}}
		resp, err = s.buildAuth(r.Context(), tx, w, user, memberships, tenant.ID, "OWNER", isNative(r))
		return err
	})

	switch {
	case errors.Is(err, errConflict):
		writeError(w, http.StatusConflict, "CONFLICT", "email or subdomain already exists", nil)
		return
	case errors.Is(err, errPlanNotFound):
		writeError(w, http.StatusBadRequest, "UNKNOWN_PLAN", "unknown or inactive plan", nil)
		return
	case errors.Is(err, errPlanNotConfigured):
		writeError(w, http.StatusBadRequest, "PLAN_NOT_CONFIGURED", "plan has no Stripe price configured", map[string]any{"plan": in.PlanKey})
		return
	case err != nil:
		slog.Error("onboarding failed", "error", err)
		writeError(w, http.StatusBadGateway, "ONBOARDING_FAILED", "could not complete onboarding with Stripe", nil)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"access_token":  resp.AccessToken,
		"token_type":    resp.TokenType,
		"expires_in":    resp.ExpiresIn,
		"refresh_token": resp.RefreshToken,
		"user":          resp.User,
		"memberships":   resp.Memberships,
		"active_tenant": resp.ActiveTenant,
		"checkout_url":  checkoutURL,
		"hostname":      hostname,
	})
}
