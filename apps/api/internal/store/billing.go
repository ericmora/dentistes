package store

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

func (s *Store) GetPlanByKey(ctx context.Context, tx pgx.Tx, key string) (*Plan, error) {
	var p Plan
	var stripePrice *string
	err := tx.QueryRow(ctx, `select key, name, description, price_monthly_cents, currency, stripe_price_id, is_active
		from plans where key = $1`, key).
		Scan(&p.Key, &p.Name, &p.Description, &p.PriceMonthlyCents, &p.Currency, &stripePrice, &p.IsActive)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if stripePrice != nil {
		p.StripePriceID = *stripePrice
	}
	features, err := s.PlanFeatures(ctx, tx, p.Key)
	if err != nil {
		return nil, err
	}
	p.Features = features
	return &p, nil
}

func (s *Store) GetPlanByStripePrice(ctx context.Context, tx pgx.Tx, priceID string) (*Plan, error) {
	var p Plan
	err := tx.QueryRow(ctx, `select key, name, description, price_monthly_cents, currency, coalesce(stripe_price_id, ''), is_active
		from plans where stripe_price_id = $1`, priceID).
		Scan(&p.Key, &p.Name, &p.Description, &p.PriceMonthlyCents, &p.Currency, &p.StripePriceID, &p.IsActive)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *Store) ListPlans(ctx context.Context, tx pgx.Tx, onlyActive bool) ([]Plan, error) {
	query := `select p.key, p.name, p.description, p.price_monthly_cents, p.currency, coalesce(p.stripe_price_id, ''), p.is_active,
			coalesce(array_agg(pf.feature_key) filter (where pf.feature_key is not null), '{}') as features
		from plans p
		left join plan_features pf on pf.plan_key = p.key`
	if onlyActive {
		query += " where p.is_active = true"
	}
	query += " group by p.key order by p.sort_order, p.key"
	rows, err := tx.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Plan{}
	for rows.Next() {
		var p Plan
		if err := rows.Scan(&p.Key, &p.Name, &p.Description, &p.PriceMonthlyCents, &p.Currency, &p.StripePriceID, &p.IsActive, &p.Features); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) UpdatePlan(ctx context.Context, tx pgx.Tx, key string, priceCents int, stripePriceID string, isActive bool) error {
	_, err := tx.Exec(ctx, `update plans set price_monthly_cents = $2, stripe_price_id = nullif($3, ''), is_active = $4 where key = $1`,
		key, priceCents, stripePriceID, isActive)
	return err
}

func (s *Store) UpsertTenantFeature(ctx context.Context, tx pgx.Tx, tenantID, featureKey string, enabled bool, expiresAt *string) error {
	_, err := tx.Exec(ctx, `insert into tenant_features (tenant_id, feature_key, enabled, expires_at)
		values ($1, $2, $3, $4::timestamptz)
		on conflict (tenant_id, feature_key) do update set enabled = excluded.enabled, expires_at = excluded.expires_at, updated_at = now()`,
		tenantID, featureKey, enabled, expiresAt)
	return err
}
