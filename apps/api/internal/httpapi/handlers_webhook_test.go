package httpapi

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/ericmora/dentistes/apps/api/internal/config"
	"github.com/ericmora/dentistes/apps/api/internal/stripeapi"
)

func signTestWebhook(payload []byte, secret string) string {
	ts := time.Now().Unix()
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(fmt.Sprintf("%d.%s", ts, string(payload))))
	sig := hex.EncodeToString(mac.Sum(nil))
	return fmt.Sprintf("t=%d,v1=%s", ts, sig)
}

func TestHandleStripeWebhookSignatureValidation(t *testing.T) {
	srv := &Server{
		cfg:    &config.Config{StripeWebhookSecret: "whsec_test_secret"},
		stripe: stripeapi.New(""),
	}

	payload := []byte(`{"id":"evt_1","type":"customer.created","data":{"object":{"id":"cus_1"}}}`)
	req := httptest.NewRequest(http.MethodPost, "/v1/webhooks/stripe", bytes.NewReader(payload))
	req.Header.Set("Stripe-Signature", "t=123,v1=deadbeef")
	rec := httptest.NewRecorder()
	srv.handleStripeWebhook(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid signature, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestHandleStripeWebhookDisabledWithoutSecret(t *testing.T) {
	srv := &Server{
		cfg:    &config.Config{StripeWebhookSecret: ""},
		stripe: stripeapi.New(""),
	}
	req := httptest.NewRequest(http.MethodPost, "/v1/webhooks/stripe", bytes.NewBufferString(`{}`))
	rec := httptest.NewRecorder()
	srv.handleStripeWebhook(rec, req)
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 when webhook secret missing, got %d", rec.Code)
	}
}

func TestHandleStripeWebhookAcceptsAllConfiguredEvents(t *testing.T) {
	const testSecret = "whsec_test_only_123456"
	srv := &Server{
		cfg:    &config.Config{StripeWebhookSecret: testSecret},
		stripe: stripeapi.New(""),
	}

	events := []struct {
		typ string
		obj any
	}{
		{"checkout.session.completed", map[string]any{"id": "cs_1", "customer": "cus_1", "subscription": "sub_1"}},
		{"customer.created", map[string]any{"id": "cus_1", "email": "clinic@example.com"}},
		{"customer.deleted", map[string]any{"id": "cus_1", "deleted": true}},
		{"customer.subscription.created", map[string]any{"id": "sub_1", "status": "trialing"}},
		{"customer.subscription.deleted", map[string]any{"id": "sub_1", "status": "canceled"}},
		{"customer.subscription.paused", map[string]any{"id": "sub_1", "status": "paused"}},
		{"customer.subscription.resumed", map[string]any{"id": "sub_1", "status": "active"}},
		{"customer.subscription.updated", map[string]any{"id": "sub_1", "status": "active"}},
		{"invoice.paid", map[string]any{"id": "in_1", "status": "paid", "subscription": "sub_1"}},
		{"invoice.payment_failed", map[string]any{"id": "in_2", "status": "open", "subscription": "sub_1"}},
		{"invoice.payment_succeeded", map[string]any{"id": "in_3", "status": "paid", "parent": map[string]any{"subscription_details": map[string]any{"subscription": "sub_1"}}}},
	}

	for _, tc := range events {
		t.Run(tc.typ, func(t *testing.T) {
			raw, err := json.Marshal(map[string]any{
				"id":   "evt_" + tc.typ,
				"type": tc.typ,
				"data": map[string]any{"object": tc.obj},
			})
			if err != nil {
				t.Fatal(err)
			}
			req := httptest.NewRequest(http.MethodPost, "/v1/webhooks/stripe", bytes.NewReader(raw))
			req.Header.Set("Stripe-Signature", signTestWebhook(raw, testSecret))
			rec := httptest.NewRecorder()
			srv.handleStripeWebhook(rec, req)
			if rec.Code != http.StatusOK {
				t.Fatalf("event %s: expected 200, got %d: %s", tc.typ, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestInvoiceSubscriptionIDExtraction(t *testing.T) {
	var legacy stripeapi.Invoice
	if err := json.Unmarshal([]byte(`{"id":"in_1","subscription":"sub_legacy"}`), &legacy); err != nil {
		t.Fatal(err)
	}
	if legacy.SubscriptionID() != "sub_legacy" {
		t.Fatalf("expected sub_legacy, got %q", legacy.SubscriptionID())
	}

	var modern stripeapi.Invoice
	if err := json.Unmarshal([]byte(`{"id":"in_2","parent":{"subscription_details":{"subscription":"sub_modern"}}}`), &modern); err != nil {
		t.Fatal(err)
	}
	if modern.SubscriptionID() != "sub_modern" {
		t.Fatalf("expected sub_modern, got %q", modern.SubscriptionID())
	}
}
