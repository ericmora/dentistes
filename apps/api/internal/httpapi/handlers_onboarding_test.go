package httpapi

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/ericmora/dentistes/apps/api/internal/config"
	"github.com/ericmora/dentistes/apps/api/internal/stripeapi"
)

func TestSlugifySubdomain(t *testing.T) {
	cases := map[string]string{
		"Clínica Dental Garraf": "clinica-dental-garraf",
		"  Centre Odontològic · Vilanova ": "centre-odontologic-vilanova",
		"A": "clinica",
	}
	for input, expected := range cases {
		if got := slugifySubdomain(input); got != expected {
			t.Fatalf("slugifySubdomain(%q) = %q, want %q", input, got, expected)
		}
	}
}

func TestValidateOnboardingRequestMinimal(t *testing.T) {
	in, errMsg := validateOnboardingRequest(onboardingRequest{
		ClinicName: "Clínica Vilanova",
		FullName:   "Dra. Laia Serra",
		Email:      "LAIA@VILANOVA.CAT",
		Password:   "super-secret-10",
	})
	if errMsg != "" {
		t.Fatalf("unexpected validation error: %s", errMsg)
	}
	if in.Subdomain != "clinica-vilanova" || in.CabinetsCount != 1 || in.Locale != "ca-ES" || in.PlanKey != "base" {
		t.Fatalf("unexpected defaults: %#v", in)
	}
}

func TestHandleOnboardingRequiresStripe(t *testing.T) {
	srv := &Server{
		cfg:    &config.Config{TrialDays: 30},
		stripe: stripeapi.New(""),
	}
	body := `{"clinic_name":"Clínica Test","full_name":"Laia Serra","email":"laia@test.com","password":"password-1234"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/public/onboarding", bytes.NewBufferString(body))
	rec := httptest.NewRecorder()
	srv.handleOnboarding(rec, req)
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 STRIPE_DISABLED, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestStripeCheckoutSets30DayTrialAndCardCollection(t *testing.T) {
	var received url.Values
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/checkout/sessions" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		if err := r.ParseForm(); err != nil {
			t.Fatal(err)
		}
		received = r.PostForm
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"url":"https://checkout.stripe.com/c/pay/cs_test_123"}`))
	}))
	defer ts.Close()

	client := stripeapi.NewWithBaseURL("sk_test_mock", ts.URL)
	checkoutURL, err := client.CreateCheckout(context.Background(), stripeapi.CheckoutParams{
		CustomerID:              "cus_123",
		PriceID:                 "price_base",
		TenantID:                "tenant_1",
		SuccessURL:              "https://app.test/onboarding/complete?session_id={CHECKOUT_SESSION_ID}",
		CancelURL:               "https://app.test/onboarding?checkout=cancel",
		TrialPeriodDays:         30,
		PaymentMethodCollection: "always",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.Contains(checkoutURL, "cs_test_123") {
		t.Fatalf("unexpected url: %s", checkoutURL)
	}
	if received.Get("subscription_data[trial_period_days]") != "30" {
		t.Fatalf("expected trial_period_days=30, got %q", received.Get("subscription_data[trial_period_days]"))
	}
	if received.Get("payment_method_collection") != "always" {
		t.Fatalf("expected payment_method_collection=always, got %q", received.Get("payment_method_collection"))
	}
}

func TestStripeInvoicesAndCancel(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.Method == http.MethodGet && strings.HasPrefix(r.URL.Path, "/invoices"):
			_, _ = w.Write([]byte(`{"data":[{"id":"in_123","number":"INV-0001","status":"paid","amount_paid":1850,"amount_due":0,"currency":"usd","created":1762900000,"hosted_invoice_url":"https://invoice.stripe.com/i/123","invoice_pdf":"https://pay.stripe.com/invoice/123/pdf"}]}`))
		case r.Method == http.MethodPost && r.URL.Path == "/subscriptions/sub_123":
			_, _ = w.Write([]byte(`{"id":"sub_123","customer":"cus_123","status":"trialing","cancel_at_period_end":true}`))
		case r.Method == http.MethodDelete && r.URL.Path == "/subscriptions/sub_123":
			_, _ = w.Write([]byte(`{"id":"sub_123","customer":"cus_123","status":"canceled","cancel_at_period_end":false}`))
		default:
			t.Fatalf("unexpected request: %s %s", r.Method, r.URL.Path)
		}
	}))
	defer ts.Close()

	client := stripeapi.NewWithBaseURL("sk_test_mock", ts.URL)
	invoices, err := client.ListInvoices(context.Background(), "cus_123", 10)
	if err != nil || len(invoices) != 1 || invoices[0].InvoicePDF == "" {
		t.Fatalf("unexpected invoices result: %#v, err=%v", invoices, err)
	}
	sub, err := client.SetCancelAtPeriodEnd(context.Background(), "sub_123", true)
	if err != nil || !sub.CancelAtPeriodEnd {
		t.Fatalf("expected cancel_at_period_end=true, got %#v, err=%v", sub, err)
	}
	canceled, err := client.CancelSubscriptionNow(context.Background(), "sub_123")
	if err != nil || canceled.Status != "canceled" {
		t.Fatalf("expected canceled subscription, got %#v, err=%v", canceled, err)
	}
}

func TestValidateOnboardingRequestMultiCurrency(t *testing.T) {
	// MX with explicit MXN and Tax ID
	in, errMsg := validateOnboardingRequest(onboardingRequest{
		ClinicName:  "Dental Satélite",
		FullName:    "Dr. Roberto Gómez",
		Email:       "roberto@satelite.mx",
		Password:    "password-secreta-10",
		CountryCode: "MX",
		Currency:    "MXN",
		TaxID:       "GOMR800101ABC",
	})
	if errMsg != "" {
		t.Fatalf("unexpected validation error: %s", errMsg)
	}
	if in.CountryCode != "MX" || in.Currency != "MXN" || in.TaxID != "GOMR800101ABC" {
		t.Fatalf("unexpected validated fields: %#v", in)
	}

	// Invalid currency rejected
	_, errMsgInvalidCurr := validateOnboardingRequest(onboardingRequest{
		ClinicName: "Dental London",
		FullName:   "Dr. John Doe",
		Email:      "john@london.co.uk",
		Password:   "password-secreta-10",
		Currency:   "GBP",
	})
	if errMsgInvalidCurr != "currency must be EUR, MXN or USD" {
		t.Fatalf("expected currency validation error, got: %s", errMsgInvalidCurr)
	}

	// Automatic resolution from locale
	inMx, _ := validateOnboardingRequest(onboardingRequest{
		ClinicName: "Dental Monterrey",
		FullName:   "Dra. Maria López",
		Email:      "maria@monterrey.mx",
		Password:   "password-secreta-10",
		Locale:     "es-mx",
	})
	if inMx.CountryCode != "MX" || inMx.Currency != "MXN" {
		t.Fatalf("expected MX/MXN for es-mx locale, got country=%s, curr=%s", inMx.CountryCode, inMx.Currency)
	}

	inCo, _ := validateOnboardingRequest(onboardingRequest{
		ClinicName: "Dental Bogotá",
		FullName:   "Dr. Carlos Ruiz",
		Email:      "carlos@bogota.co",
		Password:   "password-secreta-10",
		Locale:     "es-co",
	})
	if inCo.CountryCode != "CO" || inCo.Currency != "USD" {
		t.Fatalf("expected CO/USD for es-co locale, got country=%s, curr=%s", inCo.CountryCode, inCo.Currency)
	}
}

func TestDetectCountryFromRequest(t *testing.T) {
	// 1. Query param takes highest precedence
	req1 := httptest.NewRequest(http.MethodGet, "/v1/public/fiscal-capabilities?country_code=mx", nil)
	req1.Header.Set("CF-IPCountry", "ES")
	if c := detectCountryFromRequest(req1); c != "MX" {
		t.Fatalf("expected MX from query param, got %s", c)
	}

	// 2. CF-IPCountry header
	req2 := httptest.NewRequest(http.MethodGet, "/v1/public/fiscal-capabilities", nil)
	req2.Header.Set("CF-IPCountry", "CO")
	if c := detectCountryFromRequest(req2); c != "CO" {
		t.Fatalf("expected CO from CF-IPCountry, got %s", c)
	}

	// 3. X-Vercel-IP-Country header
	req3 := httptest.NewRequest(http.MethodGet, "/v1/public/fiscal-capabilities", nil)
	req3.Header.Set("X-Vercel-IP-Country", "PE")
	if c := detectCountryFromRequest(req3); c != "PE" {
		t.Fatalf("expected PE from X-Vercel-IP-Country, got %s", c)
	}

	// 4. Default fallback
	req4 := httptest.NewRequest(http.MethodGet, "/v1/public/fiscal-capabilities", nil)
	if c := detectCountryFromRequest(req4); c != "ES" {
		t.Fatalf("expected fallback ES, got %s", c)
	}
}
