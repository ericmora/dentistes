package entitlements

import "time"

type Subscription struct {
	Status           string
	PlanKey          string
	CurrentPeriodEnd *time.Time
	TrialEndsAt      *time.Time
}

type Override struct {
	FeatureKey string
	Enabled    bool
	ExpiresAt  *time.Time
}

type Result struct {
	TenantStatus       string          `json:"tenant_status"`
	SubscriptionStatus string          `json:"subscription_status"`
	PlanKey            string          `json:"plan_key"`
	Features           map[string]bool `json:"features"`
	BlockedReason      string          `json:"blocked_reason,omitempty"`
}

func Compute(tenantStatus string, tenantTrialEnds *time.Time, sub Subscription, catalog, planFeatures []string, overrides []Override, now time.Time) Result {
	res := Result{
		TenantStatus:       tenantStatus,
		SubscriptionStatus: sub.Status,
		PlanKey:            sub.PlanKey,
		Features:           make(map[string]bool, len(catalog)),
	}
	for _, key := range catalog {
		res.Features[key] = false
	}

	if tenantStatus == "SUSPENDED" || tenantStatus == "CANCELED" {
		res.BlockedReason = "tenant_" + lower(tenantStatus)
		return res
	}

	billingActive := false
	if sub.Status != "" {
		switch sub.Status {
		case "ACTIVE":
			billingActive = true
		case "TRIALING":
			billingActive = sub.TrialEndsAt == nil || sub.TrialEndsAt.After(now)
		}
	} else if tenantStatus == "TRIAL" && tenantTrialEnds != nil && tenantTrialEnds.After(now) {
		billingActive = true
	}
	if !billingActive {
		res.BlockedReason = "subscription_inactive"
		return res
	}

	for _, key := range planFeatures {
		res.Features[key] = true
	}
	for _, o := range overrides {
		if o.ExpiresAt != nil && !o.ExpiresAt.After(now) {
			continue
		}
		if _, known := res.Features[o.FeatureKey]; known {
			res.Features[o.FeatureKey] = o.Enabled
		} else if o.Enabled {
			res.Features[o.FeatureKey] = true
		}
	}
	return res
}

func lower(s string) string {
	out := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			c += 'a' - 'A'
		}
		out[i] = c
	}
	return string(out)
}
