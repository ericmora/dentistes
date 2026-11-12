package stripeapi

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestVerifyWebhook(t *testing.T) {
	const secret = "whsec_test_secret_12345"
	payload := []byte(`{"id":"evt_1","type":"customer.created"}`)
	now := time.Now().Unix()

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(fmt.Sprintf("%d.%s", now, string(payload))))
	sig := hex.EncodeToString(mac.Sum(nil))

	// Valid signature
	validHeader := fmt.Sprintf("t=%d,v1=%s", now, sig)
	if err := VerifyWebhook(payload, validHeader, secret); err != nil {
		t.Fatalf("expected valid signature, got error: %v", err)
	}

	// Empty secret or header
	if err := VerifyWebhook(payload, "", secret); err == nil {
		t.Fatal("expected error for empty signature header")
	}
	if err := VerifyWebhook(payload, validHeader, ""); err == nil {
		t.Fatal("expected error for empty secret")
	}

	// Malformed header
	if err := VerifyWebhook(payload, "invalid_header", secret); err == nil {
		t.Fatal("expected error for malformed header")
	}

	// Expired timestamp (> 5 minutes)
	expiredHeader := fmt.Sprintf("t=%d,v1=%s", now-600, sig)
	if err := VerifyWebhook(payload, expiredHeader, secret); err == nil {
		t.Fatal("expected error for expired timestamp")
	}

	// Invalid signature mismatch
	invalidSigHeader := fmt.Sprintf("t=%d,v1=deadbeef1234", now)
	if err := VerifyWebhook(payload, invalidSigHeader, secret); err == nil {
		t.Fatal("expected error for mismatched signature")
	}
}

func TestParseEvent(t *testing.T) {
	payload := []byte(`{"id":"evt_123","type":"invoice.paid","data":{"object":{"id":"in_123"}}}`)
	evt, err := ParseEvent(payload)
	if err != nil {
		t.Fatalf("unexpected parse error: %v", err)
	}
	if evt.ID != "evt_123" || evt.Type != "invoice.paid" {
		t.Fatalf("unexpected event: %#v", evt)
	}

	// Invalid json
	if _, err := ParseEvent([]byte("not-json")); err == nil {
		t.Fatal("expected error for invalid event JSON")
	}
}

func TestSubscriptionHelpers(t *testing.T) {
	sub := Subscription{
		ID:       "sub_1",
		Customer: "cus_1",
		Status:   "active",
		Items: struct {
			Data []struct {
				Price struct {
					ID string `json:"id"`
				} `json:"price"`
			} `json:"data"`
		}{
			Data: []struct {
				Price struct {
					ID string `json:"id"`
				} `json:"price"`
			}{
				{Price: struct {
					ID string `json:"id"`
				}{ID: "price_abc"}},
			},
		},
		CurrentPeriodEnd: 1700000000,
	}

	if sub.PriceID() != "price_abc" {
		t.Fatalf("expected price_abc, got %q", sub.PriceID())
	}
	pe := sub.PeriodEnd()
	if pe == nil || pe.Unix() != 1700000000 {
		t.Fatalf("unexpected period end: %v", pe)
	}

	emptySub := Subscription{}
	if emptySub.PriceID() != "" {
		t.Fatal("expected empty price ID for empty subscription items")
	}
	if emptySub.PeriodEnd() != nil {
		t.Fatal("expected nil period end for zero CurrentPeriodEnd")
	}
}

func TestStripeClientMethodsWithMockServer(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodPost && r.URL.Path == "/customers":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"id":"cus_new_123"}`))
		case r.Method == http.MethodPost && r.URL.Path == "/checkout/sessions":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"id":"cs_new_456","url":"https://checkout.stripe.com/pay/cs_new_456"}`))
		case r.Method == http.MethodGet && r.URL.Path == "/checkout/sessions/cs_new_456":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"id":"cs_new_456","customer":"cus_new_123","subscription":"sub_789","status":"complete"}`))
		case r.Method == http.MethodGet && r.URL.Path == "/subscriptions/sub_789":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"id":"sub_789","customer":"cus_new_123","status":"trialing"}`))
		case r.Method == http.MethodPost && r.URL.Path == "/subscriptions/sub_789":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"id":"sub_789","customer":"cus_new_123","cancel_at_period_end":true}`))
		case r.Method == http.MethodDelete && r.URL.Path == "/subscriptions/sub_789":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"id":"sub_789","customer":"cus_new_123","status":"canceled"}`))
		case r.Method == http.MethodGet && r.URL.Path == "/invoices":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"data":[{"id":"in_1","number":"INV-001","status":"paid","amount_paid":1850,"invoice_pdf":"https://stripe.com/inv.pdf"}]}`))
		case r.Method == http.MethodPost && r.URL.Path == "/products":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"id":"prod_123","name":"Test Product"}`))
		case r.Method == http.MethodPost && r.URL.Path == "/products/prod_123":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"id":"prod_123","name":"Updated Product"}`))
		case r.Method == http.MethodGet && r.URL.Path == "/prices/price_123":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"id":"price_123","unit_amount":1850,"currency":"usd","active":true}`))
		case r.Method == http.MethodPost && r.URL.Path == "/prices":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"id":"price_new_999","unit_amount":1850,"currency":"usd","active":true}`))
		case r.Method == http.MethodPost && r.URL.Path == "/prices/price_123":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"id":"price_123","active":false}`))
		case r.Method == http.MethodPost && r.URL.Path == "/billing_portal/sessions":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"url":"https://billing.stripe.com/session/abc"}`))
		case r.URL.Path == "/error-endpoint":
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error":{"message":"Stripe simulated error","type":"invalid_request_error"}}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	client := NewWithBaseURL("sk_test_mock", ts.URL)
	if !client.Enabled() {
		t.Fatal("expected client to be enabled")
	}

	ctx := context.Background()

	// CreateCustomer
	cusID, err := client.CreateCustomer(ctx, "test@clinic.cat", "Clínica Test", "tenant-1")
	if err != nil || cusID != "cus_new_123" {
		t.Fatalf("unexpected customer result: cusID=%s, err=%v", cusID, err)
	}

	// CreateCheckout
	checkoutURL, err := client.CreateCheckout(ctx, CheckoutParams{
		CustomerID:              cusID,
		PriceID:                 "price_123",
		TrialPeriodDays:         30,
		SuccessURL:              "https://app.test/success",
		CancelURL:               "https://app.test/cancel",
		TenantID:                "tenant-1",
		PaymentMethodCollection: "always",
	})
	if err != nil || checkoutURL == "" {
		t.Fatalf("unexpected checkout result: checkoutURL=%s, err=%v", checkoutURL, err)
	}

	// GetCheckoutSession
	cs, err := client.GetCheckoutSession(ctx, "cs_new_456")
	if err != nil || cs.Subscription != "sub_789" {
		t.Fatalf("unexpected GetCheckoutSession result: %#v, err=%v", cs, err)
	}

	// GetSubscription
	sub, err := client.GetSubscription(ctx, "sub_789")
	if err != nil || sub.Status != "trialing" {
		t.Fatalf("unexpected GetSubscription result: %#v, err=%v", sub, err)
	}

	// SetCancelAtPeriodEnd
	subCancel, err := client.SetCancelAtPeriodEnd(ctx, "sub_789", true)
	if err != nil || !subCancel.CancelAtPeriodEnd {
		t.Fatalf("unexpected SetCancelAtPeriodEnd result: %#v, err=%v", subCancel, err)
	}

	// CancelSubscriptionNow
	subCanceled, err := client.CancelSubscriptionNow(ctx, "sub_789")
	if err != nil || subCanceled.Status != "canceled" {
		t.Fatalf("unexpected CancelSubscriptionNow result: %#v, err=%v", subCanceled, err)
	}

	// ListInvoices
	invs, err := client.ListInvoices(ctx, cusID, 10)
	if err != nil || len(invs) != 1 || invs[0].Number != "INV-001" {
		t.Fatalf("unexpected ListInvoices result: %#v, err=%v", invs, err)
	}

	// CreatePortal
	portalURL, err := client.CreatePortal(ctx, cusID, "https://app.test/billing")
	if err != nil || portalURL != "https://billing.stripe.com/session/abc" {
		t.Fatalf("unexpected CreatePortal result: %s, err=%v", portalURL, err)
	}

	// Products and Prices
	prodID, err := client.CreateProduct(ctx, "Base Plan", "Base dental subscription", "base", true)
	if err != nil || prodID != "prod_123" {
		t.Fatalf("unexpected CreateProduct: prodID=%s, err=%v", prodID, err)
	}

	if err := client.UpdateProduct(ctx, "prod_123", "Updated Base Plan", "New desc", true); err != nil {
		t.Fatalf("unexpected UpdateProduct: %v", err)
	}

	price, err := client.GetPrice(ctx, "price_123")
	if err != nil || price.UnitAmount != 1850 || !price.Active {
		t.Fatalf("unexpected GetPrice: %#v, err=%v", price, err)
	}

	newPriceID, err := client.CreatePrice(ctx, prodID, "usd", "base", 1850)
	if err != nil || newPriceID != "price_new_999" {
		t.Fatalf("unexpected CreatePrice: %s, err=%v", newPriceID, err)
	}

	if err := client.DeactivatePrice(ctx, "price_123"); err != nil {
		t.Fatalf("unexpected DeactivatePrice: %v", err)
	}

	// SubscriptionID
	invDirect := Invoice{Subscription: "sub_direct"}
	if invDirect.SubscriptionID() != "sub_direct" {
		t.Fatal("expected sub_direct")
	}
	invNested := Invoice{}
	invNested.Parent.SubscriptionDetails.Subscription = "sub_nested"
	if invNested.SubscriptionID() != "sub_nested" {
		t.Fatal("expected sub_nested")
	}

	// ListInvoices limit bounds
	_, _ = client.ListInvoices(ctx, cusID, 0)
	_, _ = client.ListInvoices(ctx, cusID, 999)

	// boolString
	if boolString(false) != "false" || boolString(true) != "true" {
		t.Fatal("boolString failed")
	}

	// Error path
	errClient := NewWithBaseURL("sk_test_mock", ts.URL+"/error-endpoint")
	_, err = errClient.GetSubscription(ctx, "sub_fail")
	if err == nil {
		t.Fatal("expected error from error endpoint")
	}

	// Disabled client checks
	nilClient := New("")
	if nilClient.Enabled() {
		t.Fatal("expected empty secret key client to be disabled")
	}
}
