package store

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

func (s *Store) ListFeatureCatalog(ctx context.Context, tx pgx.Tx) ([]Feature, error) {
	rows, err := tx.Query(ctx, "select key, name, description from features order by key")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Feature{}
	for rows.Next() {
		var f Feature
		if err := rows.Scan(&f.Key, &f.Name, &f.Description); err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

func (s *Store) AllFeatureKeys(ctx context.Context, tx pgx.Tx) ([]string, error) {
	rows, err := tx.Query(ctx, "select key from features order by key")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []string{}
	for rows.Next() {
		var key string
		if err := rows.Scan(&key); err != nil {
			return nil, err
		}
		out = append(out, key)
	}
	return out, rows.Err()
}

func (s *Store) PlanFeatures(ctx context.Context, tx pgx.Tx, planKey string) ([]string, error) {
	rows, err := tx.Query(ctx, "select feature_key from plan_features where plan_key = $1", planKey)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []string{}
	for rows.Next() {
		var key string
		if err := rows.Scan(&key); err != nil {
			return nil, err
		}
		out = append(out, key)
	}
	return out, rows.Err()
}

func (s *Store) TenantFeatureOverrides(ctx context.Context, tx pgx.Tx, tenantID string) ([]Override, error) {
	rows, err := tx.Query(ctx, `select feature_key, enabled, expires_at
		from tenant_features where tenant_id = $1`, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Override{}
	for rows.Next() {
		var o Override
		if err := rows.Scan(&o.FeatureKey, &o.Enabled, &o.ExpiresAt); err != nil {
			return nil, err
		}
		out = append(out, o)
	}
	return out, rows.Err()
}

type Override struct {
	FeatureKey string
	Enabled    bool
	ExpiresAt  *time.Time
}

func (s *Store) GetSubscription(ctx context.Context, tx pgx.Tx, tenantID string) (*Subscription, error) {
	var sub Subscription
	err := tx.QueryRow(ctx, `select tenant_id, coalesce(plan_key, ''), status,
			coalesce(stripe_customer_id, ''), coalesce(stripe_subscription_id, ''),
			current_period_end, cancel_at_period_end, trial_ends_at
		from subscriptions where tenant_id = $1`, tenantID).
		Scan(&sub.TenantID, &sub.PlanKey, &sub.Status, &sub.StripeCustomerID, &sub.StripeSubscriptionID,
			&sub.CurrentPeriodEnd, &sub.CancelAtPeriodEnd, &sub.TrialEndsAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

func (s *Store) CreateTrialSubscription(ctx context.Context, tx pgx.Tx, tenantID, planKey string, trialEndsAt time.Time) error {
	_, err := tx.Exec(ctx, `insert into subscriptions (tenant_id, plan_key, status, trial_ends_at)
		values ($1, $2, 'TRIALING', $3)
		on conflict (tenant_id) do update set plan_key = excluded.plan_key, status = 'TRIALING', trial_ends_at = excluded.trial_ends_at`,
		tenantID, planKey, trialEndsAt)
	return err
}

func (s *Store) CreatePendingSubscription(ctx context.Context, tx pgx.Tx, tenantID, planKey, customerID string) error {
	_, err := tx.Exec(ctx, `insert into subscriptions (tenant_id, plan_key, status, stripe_customer_id)
		values ($1, $2, 'INCOMPLETE', nullif($3, ''))
		on conflict (tenant_id) do update set
			plan_key = excluded.plan_key,
			status = 'INCOMPLETE',
			stripe_customer_id = coalesce(nullif(excluded.stripe_customer_id, ''), subscriptions.stripe_customer_id)`,
		tenantID, planKey, customerID)
	return err
}

func (s *Store) UpsertSubscription(ctx context.Context, tx pgx.Tx, tenantID, planKey, status, customerID, subscriptionID string, periodEnd *time.Time, cancelAtPeriodEnd bool, trialEndsAt *time.Time) error {
	_, err := tx.Exec(ctx, `insert into subscriptions (tenant_id, plan_key, status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end, trial_ends_at)
		values ($1, nullif($2, ''), $3, nullif($4, ''), nullif($5, ''), $6, $7, $8)
		on conflict (tenant_id) do update set
			plan_key = coalesce(nullif(excluded.plan_key, ''), subscriptions.plan_key),
			status = excluded.status,
			stripe_customer_id = coalesce(nullif(excluded.stripe_customer_id, ''), subscriptions.stripe_customer_id),
			stripe_subscription_id = coalesce(nullif(excluded.stripe_subscription_id, ''), subscriptions.stripe_subscription_id),
			current_period_end = coalesce(excluded.current_period_end, subscriptions.current_period_end),
			cancel_at_period_end = excluded.cancel_at_period_end,
			trial_ends_at = coalesce(excluded.trial_ends_at, subscriptions.trial_ends_at)`,
		tenantID, planKey, status, customerID, subscriptionID, periodEnd, cancelAtPeriodEnd, trialEndsAt)
	return err
}

func (s *Store) SetStripeCustomer(ctx context.Context, tx pgx.Tx, tenantID, customerID string) error {
	_, err := tx.Exec(ctx, "update subscriptions set stripe_customer_id = $2 where tenant_id = $1", tenantID, customerID)
	return err
}

func (s *Store) TenantByStripeCustomer(ctx context.Context, tx pgx.Tx, customerID string) (string, error) {
	var tenantID string
	err := tx.QueryRow(ctx, `select tenant_id from subscriptions where stripe_customer_id = $1`, customerID).Scan(&tenantID)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return tenantID, err
}

func (s *Store) SetSubscriptionStatusByCustomer(ctx context.Context, tx pgx.Tx, customerID, status string) error {
	_, err := tx.Exec(ctx, "update subscriptions set status = $2 where stripe_customer_id = $1", customerID, status)
	return err
}
