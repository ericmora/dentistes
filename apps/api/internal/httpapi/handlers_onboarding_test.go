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
