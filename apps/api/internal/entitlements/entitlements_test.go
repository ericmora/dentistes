package entitlements

import (
	"testing"
	"time"
)

func TestComputeTenantCanceledAndTrialNoSub(t *testing.T) {
	now := time.Now()
	// Canceled tenant
	res := Compute("CANCELED", nil, Subscription{Status: "ACTIVE"}, []string{"patients"}, []string{"patients"}, nil, now)
	if res.BlockedReason != "tenant_canceled" || res.Features["patients"] {
		t.Fatalf("expected tenant_canceled, got %#v", res)
	}

	// Trialing with nil TrialEndsAt (unlimited/open trial)
	resTrial := Compute("ACTIVE", nil, Subscription{Status: "TRIALING", TrialEndsAt: nil}, []string{"patients"}, []string{"patients"}, nil, now)
	if !resTrial.Features["patients"] || resTrial.BlockedReason != "" {
		t.Fatalf("expected features enabled for trialing with nil end date: %#v", resTrial)
	}

	// Legacy/onboarding tenant trial before subscription creation
	future := now.Add(time.Hour)
	resTenantTrial := Compute("TRIAL", &future, Subscription{Status: ""}, []string{"patients"}, []string{"patients"}, nil, now)
	if !resTenantTrial.Features["patients"] {
		t.Fatalf("expected tenant trial active without subscription: %#v", resTenantTrial)
	}

	// Unknown feature override
	resOverride := Compute("ACTIVE", nil, Subscription{Status: "ACTIVE"}, []string{"patients"}, []string{"patients"}, []Override{{FeatureKey: "custom_experimental", Enabled: true}}, now)
	if !resOverride.Features["custom_experimental"] {
		t.Fatalf("expected custom override enabled: %#v", resOverride)
	}
}

func TestComputeBlocksSuspendedTenant(t *testing.T) {
	now := time.Now()
	res := Compute("SUSPENDED", nil, Subscription{Status: "ACTIVE", PlanKey: "clinic"}, []string{"patients", "agenda"}, []string{"patients", "agenda"}, nil, now)
	if res.Features["patients"] || res.Features["agenda"] {
		t.Fatalf("expected all features blocked, got %#v", res.Features)
	}
	if res.BlockedReason != "tenant_suspended" {
		t.Fatalf("unexpected reason %q", res.BlockedReason)
	}
}

func TestComputeTrialExpired(t *testing.T) {
	now := time.Now()
	past := now.Add(-time.Hour)
	res := Compute("TRIAL", &past, Subscription{Status: "TRIALING", PlanKey: "starter", TrialEndsAt: &past}, []string{"patients"}, []string{"patients"}, nil, now)
	if res.Features["patients"] {
		t.Fatal("expected features blocked after trial expiration")
	}
	if res.BlockedReason != "subscription_inactive" {
		t.Fatalf("unexpected reason %q", res.BlockedReason)
	}
}

func TestComputeAppliesPlanAndOverrides(t *testing.T) {
	now := time.Now()
	future := now.Add(24 * time.Hour)
	past := now.Add(-time.Minute)
	res := Compute(
		"ACTIVE", nil,
		Subscription{Status: "ACTIVE", PlanKey: "starter"},
		[]string{"patients", "agenda", "odontogram"},
		[]string{"patients", "agenda"},
		[]Override{
			{FeatureKey: "odontogram", Enabled: true, ExpiresAt: &future},
			{FeatureKey: "agenda", Enabled: false},
			{FeatureKey: "patients", Enabled: false, ExpiresAt: &past},
		},
		now,
	)
	if !res.Features["odontogram"] {
		t.Fatal("expected addon feature enabled")
	}
	if res.Features["agenda"] {
		t.Fatal("expected override to disable agenda")
	}
	if !res.Features["patients"] {
		t.Fatal("expected expired override to be ignored")
	}
}

func TestComputePastDueIsBlocked(t *testing.T) {
	now := time.Now()
	res := Compute("ACTIVE", nil, Subscription{Status: "PAST_DUE", PlanKey: "clinic"}, []string{"patients"}, []string{"patients"}, nil, now)
	if res.Features["patients"] || res.BlockedReason != "subscription_inactive" {
		t.Fatalf("expected past due blocked, got %#v", res)
	}
}

func TestComputeCanceledDuringTrialIsBlocked(t *testing.T) {
	now := time.Now()
	future := now.Add(24 * time.Hour)
	res := Compute("TRIAL", &future, Subscription{Status: "CANCELED", PlanKey: "starter"}, []string{"patients"}, []string{"patients"}, nil, now)
	if res.Features["patients"] || res.BlockedReason != "subscription_inactive" {
		t.Fatalf("expected canceled subscription to block even during trial, got %#v", res)
	}
}
