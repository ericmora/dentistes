package store

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
)

func (s *Store) GetRegionalFiscalConfig(ctx context.Context, tx pgx.Tx, countryCode string) (*RegionalFiscalConfig, error) {
	var c RegionalFiscalConfig
	err := tx.QueryRow(ctx, `select country_code, country_name, currency_code, tax_authority_name,
		fiscal_document_name, tax_id_label, tax_id_regex, compliance_status, requires_partner,
		partner_provider_key, adapter_class, default_vat_rate, retention_years, updated_at
		from regional_fiscal_configs where country_code = $1`, countryCode).
		Scan(&c.CountryCode, &c.CountryName, &c.CurrencyCode, &c.TaxAuthorityName,
			&c.FiscalDocumentName, &c.TaxIDLabel, &c.TaxIDRegex, &c.ComplianceStatus, &c.RequiresPartner,
			&c.PartnerProviderKey, &c.AdapterClass, &c.DefaultVATRate, &c.RetentionYears, &c.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (s *Store) ListRegionalFiscalConfigs(ctx context.Context, tx pgx.Tx) ([]RegionalFiscalConfig, error) {
	rows, err := tx.Query(ctx, `select country_code, country_name, currency_code, tax_authority_name,
		fiscal_document_name, tax_id_label, tax_id_regex, compliance_status, requires_partner,
		partner_provider_key, adapter_class, default_vat_rate, retention_years, updated_at
		from regional_fiscal_configs order by country_code asc`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []RegionalFiscalConfig
	for rows.Next() {
		var c RegionalFiscalConfig
		if err := rows.Scan(&c.CountryCode, &c.CountryName, &c.CurrencyCode, &c.TaxAuthorityName,
			&c.FiscalDocumentName, &c.TaxIDLabel, &c.TaxIDRegex, &c.ComplianceStatus, &c.RequiresPartner,
			&c.PartnerProviderKey, &c.AdapterClass, &c.DefaultVATRate, &c.RetentionYears, &c.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, rows.Err()
}

func (s *Store) GetTenantFeatureFlag(ctx context.Context, tx pgx.Tx, tenantID, flagKey string) (*TenantFeatureFlag, error) {
	var f TenantFeatureFlag
	var rawMeta []byte
	err := tx.QueryRow(ctx, `select tenant_id, flag_key, is_enabled, rollout_stage, metadata, updated_at
		from tenant_feature_flags where tenant_id = $1 and flag_key = $2`, tenantID, flagKey).
		Scan(&f.TenantID, &f.FlagKey, &f.IsEnabled, &f.RolloutStage, &rawMeta, &f.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	f.Metadata = make(map[string]any)
	if len(rawMeta) > 0 {
		_ = json.Unmarshal(rawMeta, &f.Metadata)
	}
	return &f, nil
}

func (s *Store) UpsertTenantFeatureFlag(ctx context.Context, tx pgx.Tx, f TenantFeatureFlag) error {
	metaBytes, err := json.Marshal(f.Metadata)
	if err != nil {
		metaBytes = []byte("{}")
	}
	_, err = tx.Exec(ctx, `insert into tenant_feature_flags (tenant_id, flag_key, is_enabled, rollout_stage, metadata, updated_at)
		values ($1, $2, $3, $4, $5, now())
		on conflict (tenant_id, flag_key) do update set
			is_enabled = excluded.is_enabled,
			rollout_stage = excluded.rollout_stage,
			metadata = excluded.metadata,
			updated_at = now()`,
		f.TenantID, f.FlagKey, f.IsEnabled, f.RolloutStage, metaBytes)
	return err
}

func (s *Store) GetPlanPrice(ctx context.Context, tx pgx.Tx, planKey, currency, interval string) (*PlanPrice, error) {
	var p PlanPrice
	err := tx.QueryRow(ctx, `select id, plan_key, currency, interval, amount_cents, stripe_price_id, created_at, updated_at
		from plan_prices where plan_key = $1 and currency = $2 and interval = $3`,
		planKey, currency, interval).
		Scan(&p.ID, &p.PlanKey, &p.Currency, &p.Interval, &p.AmountCents, &p.StripePriceID, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}
