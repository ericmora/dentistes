package store

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

func (s *Store) CreateTenant(ctx context.Context, tx pgx.Tx, name, subdomain string, trialEndsAt time.Time) (*Tenant, error) {
	return s.CreateTenantWithBilling(ctx, tx, name, subdomain, "ES", "EUR", "", trialEndsAt)
}

func (s *Store) CreateTenantWithBilling(ctx context.Context, tx pgx.Tx, name, subdomain, countryCode, currency, taxID string, trialEndsAt time.Time) (*Tenant, error) {
	if countryCode == "" {
		countryCode = "ES"
	}
	if currency == "" {
		currency = "EUR"
	}
	var t Tenant
	err := tx.QueryRow(ctx, `insert into tenants (name, subdomain, billing_country_code, billing_currency, tax_id, status, trial_ends_at)
		values ($1, $2, $3, $4, nullif($5, ''), 'TRIAL', $6)
		returning id, name, subdomain, billing_country_code, billing_currency, coalesce(tax_id, ''), status, trial_ends_at, created_at`,
		name, subdomain, countryCode, currency, taxID, trialEndsAt).
		Scan(&t.ID, &t.Name, &t.Subdomain, &t.BillingCountryCode, &t.BillingCurrency, &t.TaxID, &t.Status, &t.TrialEndsAt, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (s *Store) GetTenantByID(ctx context.Context, tx pgx.Tx, id string) (*Tenant, error) {
	var t Tenant
	err := tx.QueryRow(ctx, `select id, name, subdomain, billing_country_code, billing_currency, coalesce(tax_id, ''), status, trial_ends_at, created_at
		from tenants where id = $1`, id).
		Scan(&t.ID, &t.Name, &t.Subdomain, &t.BillingCountryCode, &t.BillingCurrency, &t.TaxID, &t.Status, &t.TrialEndsAt, &t.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (s *Store) GetTenantBySubdomain(ctx context.Context, tx pgx.Tx, subdomain string) (*Tenant, error) {
	var t Tenant
	err := tx.QueryRow(ctx, `select id, name, subdomain, billing_country_code, billing_currency, coalesce(tax_id, ''), status, trial_ends_at, created_at
		from tenants where subdomain = $1`, subdomain).
		Scan(&t.ID, &t.Name, &t.Subdomain, &t.BillingCountryCode, &t.BillingCurrency, &t.TaxID, &t.Status, &t.TrialEndsAt, &t.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (s *Store) UpdateTenantStatus(ctx context.Context, tx pgx.Tx, id, status string) error {
	_, err := tx.Exec(ctx, "update tenants set status = $2 where id = $1", id, status)
	return err
}

func (s *Store) ListTenants(ctx context.Context, tx pgx.Tx) ([]TenantSummary, error) {
	rows, err := tx.Query(ctx, `select t.id, t.name, t.subdomain, t.status, t.trial_ends_at, t.created_at
		from tenants t
		order by t.created_at desc`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []TenantSummary{}
	for rows.Next() {
		var t TenantSummary
		if err := rows.Scan(&t.ID, &t.Name, &t.Subdomain, &t.Status, &t.TrialEndsAt, &t.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}
