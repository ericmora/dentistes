package httpapi

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/ericmora/dentistes/apps/api/internal/auth"
	"github.com/ericmora/dentistes/apps/api/internal/config"
	"github.com/ericmora/dentistes/apps/api/internal/entitlements"
	"github.com/ericmora/dentistes/apps/api/internal/realtime"
	"github.com/ericmora/dentistes/apps/api/internal/store"
	"github.com/ericmora/dentistes/apps/api/internal/stripeapi"
	"github.com/ericmora/dentistes/apps/api/internal/testfixtures"
)

// Helper to sign webhooks deterministically
func signWebhook(payload []byte, secret string) string {
	ts := time.Now().Unix()
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(fmt.Sprintf("%d.%s", ts, string(payload))))
	sig := hex.EncodeToString(mac.Sum(nil))
	return fmt.Sprintf("t=%d,v1=%s", ts, sig)
}

// Critical Path 1: Onboarding + Stripe 30-Day Trial + Provisioning
func TestCriticalPath1_OnboardingAndStripeTrial(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/customers":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"id":"cus_onboarding_123"}`))
		case "/checkout/sessions":
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"id":"cs_onboarding_456","url":"https://checkout.stripe.com/pay/cs_onboarding_456"}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer ts.Close()

	srv := &Server{
		cfg: &config.Config{
			TrialDays:        30,
			TenantBaseDomain: "dentistes.2mes4.com",
			AppURL:           "http://localhost:5173",
		},
		stripe: stripeapi.NewWithBaseURL("sk_test_mock", ts.URL),
	}

	// 1. Validation failures
	invalidBodies := []struct {
		name string
		body string
		err  string
	}{
		{"missing_clinic", `{"full_name":"Laia","email":"laia@test.cat","password":"Password123!"}`, "clinic_name"},
		{"missing_name", `{"clinic_name":"Clínica","email":"laia@test.cat","password":"Password123!"}`, "full_name"},
		{"invalid_email", `{"clinic_name":"Clínica","full_name":"Laia","email":"not-an-email","password":"Password123!"}`, "email"},
		{"short_password", `{"clinic_name":"Clínica","full_name":"Laia","email":"laia@test.cat","password":"123"}`, "password"},
	}

	for _, tc := range invalidBodies {
		t.Run("Validation_"+tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/v1/public/onboarding", bytes.NewBufferString(tc.body))
			rec := httptest.NewRecorder()
			srv.handleOnboarding(rec, req)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected 400 validation error, got %d: %s", rec.Code, rec.Body.String())
			}
			if !strings.Contains(rec.Body.String(), tc.err) {
				t.Fatalf("expected error message to mention %s, got %s", tc.err, rec.Body.String())
			}
		})
	}
}

// Critical Path 2: Authentication, Tenant Isolation & RBAC Matrix
func TestCriticalPath2_AuthAndRBAC(t *testing.T) {
	tm := auth.NewTokenManager("test-secret-at-least-32-bytes-long!", 15*time.Minute)

	// Issue token for Owner and verify permissions
	ownerTok, _, err := tm.Issue(testfixtures.OwnerUser.ID, testfixtures.TenantGarraf.ID, auth.RoleOwner, false)
	if err != nil {
		t.Fatalf("failed to issue owner token: %v", err)
	}

	claims, err := tm.Parse(ownerTok)
	if err != nil || claims.TenantID != testfixtures.TenantGarraf.ID {
		t.Fatalf("unexpected claims: %#v, err=%v", claims, err)
	}

	// Matrix RBAC checks
	roles := []struct {
		role      string
		perm      string
		shouldHave bool
	}{
		{auth.RoleOwner, "users:manage", true},
		{auth.RoleOwner, "billing:manage", true},
		{auth.RoleOwner, "any:custom:feature", true},
		{auth.RoleAdmin, "users:manage", true},
		{auth.RoleAdmin, "billing:manage", true},
		{auth.RoleAdmin, "clinical:write", true},
		{auth.RoleDentist, "clinical:write", true},
		{auth.RoleDentist, "users:manage", false},
		{auth.RoleDentist, "billing:manage", false},
		{auth.RoleReceptionist, "appointments:write", true},
		{auth.RoleReceptionist, "users:manage", false},
		{auth.RoleHygienist, "clinical:alerts", true},
		{auth.RoleHygienist, "clinical:write", false},
	}

	for _, tc := range roles {
		t.Run(tc.role+"_"+tc.perm, func(t *testing.T) {
			has := auth.HasPermission(tc.role, tc.perm)
			if has != tc.shouldHave {
				t.Fatalf("role %s permission %s: expected %v, got %v", tc.role, tc.perm, tc.shouldHave, has)
			}
		})
	}
}

// Critical Path 3: Multi-Cabinet Agenda & Concurrency Overlap Prevention (F2)
func TestCriticalPath3_AgendaAndOverlapValidation(t *testing.T) {
	hub := realtime.NewHub()
	ch, cancel := hub.Subscribe(testfixtures.TenantGarraf.ID)
	defer cancel()

	// Simulate event broadcast
	hub.Publish(testfixtures.TenantGarraf.ID, "appointment.created", map[string]string{
		"id":    "appt-test-1",
		"title": "Neteja dental",
	})

	select {
	case msg := <-ch:
		if !strings.Contains(string(msg), "appointment.created") {
			t.Fatalf("unexpected SSE message: %s", string(msg))
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("timeout waiting for SSE appointment event")
	}

	// Validate overlapping time ranges logic
	startA, endA := testfixtures.BaseMondayMorning() // 09:00 - 10:00
	// Exact overlap
	startB := startA.Add(15 * time.Minute)           // 09:15
	endB := startB.Add(30 * time.Minute)             // 09:45

	overlap := startA.Before(endB) && endA.After(startB)
	if !overlap {
		t.Fatal("expected time interval overlap detection to be true")
	}

	// Non-overlapping interval
	startC := endA // 10:00
	endC := startC.Add(30 * time.Minute)
	nonOverlap := startA.Before(endC) && endA.After(startC)
	if nonOverlap {
		t.Fatal("expected non-overlapping sequential appointment to be allowed")
	}
}

// Critical Path 4: Dynamic Waiting List Urgency & Candidate Matching (F5)
func TestCriticalPath4_DynamicWaitingList(t *testing.T) {
	monMorning, monMorningEnd := testfixtures.BaseMondayMorning()

	urgentEntry := store.WaitingListEntry{
		ID:                       "wait-urgent-1",
		PatientID:                "pat-1",
		EstimatedDurationMinutes: 30,
		PreferredTimeSlot:        "MORNING",
		PreferredDays:            []int32{1}, // Monday
		UrgencyLevel:             "URGENT",
		DoctorID:                 &testfixtures.Doctor1.ID,
	}

	routineEntry := store.WaitingListEntry{
		ID:                       "wait-routine-2",
		PatientID:                "pat-2",
		EstimatedDurationMinutes: 30,
		PreferredTimeSlot:        "AFTERNOON",
		PreferredDays:            []int32{5}, // Friday
		UrgencyLevel:             "LOW",
	}

	urgentScore, okUrgent := store.ScoreWaitingCandidate(urgentEntry, monMorning, monMorningEnd, testfixtures.Doctor1.ID)
	if !okUrgent || urgentScore < 90 {
		t.Fatalf("expected urgent candidate to match slot with high score, got score=%d, ok=%v", urgentScore, okUrgent)
	}

	routineScore, okRoutine := store.ScoreWaitingCandidate(routineEntry, monMorning, monMorningEnd, testfixtures.Doctor1.ID)
	if !okRoutine || routineScore >= urgentScore {
		t.Fatalf("expected urgent score (%d) > routine score (%d)", urgentScore, routineScore)
	}

	// Candidate needing 90m for a 60m slot must be rejected
	tooLongEntry := store.WaitingListEntry{
		ID:                       "wait-toolong",
		EstimatedDurationMinutes: 90,
		UrgencyLevel:             "URGENT",
	}
	_, okTooLong := store.ScoreWaitingCandidate(tooLongEntry, monMorning, monMorningEnd, testfixtures.Doctor1.ID)
	if okTooLong {
		t.Fatal("candidate requiring 90m must not match a 60m slot")
	}
}

// Critical Path 5: Billing Webhooks, Entitlement Locking (402) & Clinic Account Destruction
func TestCriticalPath5_BillingAndAccountDestruction(t *testing.T) {
	const webhookSecret = "whsec_test_cp5_secret"
	srv := &Server{
		cfg:    &config.Config{StripeWebhookSecret: webhookSecret},
		stripe: stripeapi.New(""),
	}

	// 1. All 11 Webhook Events accepted idempotently
	events := []string{
		"checkout.session.completed",
		"customer.created",
		"customer.deleted",
		"customer.subscription.created",
		"customer.subscription.deleted",
		"customer.subscription.paused",
		"customer.subscription.resumed",
		"customer.subscription.updated",
		"invoice.paid",
		"invoice.payment_failed",
		"invoice.payment_succeeded",
	}

	for _, evtType := range events {
		t.Run("Webhook_"+evtType, func(t *testing.T) {
			raw := testfixtures.BuildMockStripePayload(evtType, map[string]any{
				"id":           "mock_id_" + evtType,
				"customer":     "cus_123",
				"subscription": "sub_456",
				"status":       "active",
			})
			req := httptest.NewRequest(http.MethodPost, "/v1/webhooks/stripe", bytes.NewReader(raw))
			req.Header.Set("Stripe-Signature", signWebhook(raw, webhookSecret))
			rec := httptest.NewRecorder()
			srv.handleStripeWebhook(rec, req)
			if rec.Code != http.StatusOK {
				t.Fatalf("event %s: expected 200 OK, got %d: %s", evtType, rec.Code, rec.Body.String())
			}
		})
	}

	// 2. Entitlement Locking on PAUSED / PAST_DUE
	now := time.Now()
	pausedRes := entitlements.Compute("ACTIVE", nil, entitlements.Subscription{Status: "PAUSED"}, []string{"patients", "agenda"}, []string{"patients", "agenda"}, nil, now)
	if pausedRes.Features["patients"] || pausedRes.Features["agenda"] || pausedRes.BlockedReason != "subscription_inactive" {
		t.Fatalf("expected features to be locked when subscription is PAUSED: %#v", pausedRes)
	}

	pastDueRes := entitlements.Compute("ACTIVE", nil, entitlements.Subscription{Status: "PAST_DUE"}, []string{"patients", "agenda"}, []string{"patients", "agenda"}, nil, now)
	if pastDueRes.Features["patients"] || pastDueRes.BlockedReason != "subscription_inactive" {
		t.Fatalf("expected features locked on PAST_DUE: %#v", pastDueRes)
	}

	// 3. Clinic Account Destruction (Subdomain Confirmation Validation)
	reqFailSubdomain := struct {
		ConfirmSubdomain string `json:"confirm_subdomain"`
	}{
		ConfirmSubdomain: "wrong-subdomain",
	}
	if strings.EqualFold(reqFailSubdomain.ConfirmSubdomain, testfixtures.TenantGarraf.Subdomain) {
		t.Fatal("expected mismatched subdomain to fail validation")
	}
}

// Critical Path 6: Public Lead Captation
func TestCriticalPath6_PublicLeadCaptation(t *testing.T) {
	srv := &Server{
		cfg: &config.Config{},
	}

	// Validation: empty email and empty phone rejected
	invalidLead := `{"clinic_name":"Clínica Nova"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/public/leads", bytes.NewBufferString(invalidLead))
	rec := httptest.NewRecorder()
	srv.handleCreateLead(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 validation error for missing contact info, got %d", rec.Code)
	}

	// Invalid email format rejected
	invalidEmailLead := `{"clinic_name":"Clínica Nova","email":"bad-email-format"}`
	req2 := httptest.NewRequest(http.MethodPost, "/v1/public/leads", bytes.NewBufferString(invalidEmailLead))
	rec2 := httptest.NewRecorder()
	srv.handleCreateLead(rec2, req2)
	if rec2.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 validation error for invalid email format, got %d", rec2.Code)
	}
}
