package store

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type ClinicBudgetSettings struct {
	LogoURL                       string `json:"logo_url"`
	ClinicContactLine             string `json:"clinic_contact_line"`
	BudgetDefaultValidityDays     int    `json:"budget_default_validity_days"`
	BudgetDefaultSeries           string `json:"budget_default_series"`
	BudgetWarningDaysBeforeExpiry int    `json:"budget_warning_days_before_expiry"`
	BudgetValidityTerms           string `json:"budget_validity_terms"`
	BudgetAutoExpire              bool   `json:"budget_auto_expire"`
	CustomMarginsEnabled          bool   `json:"custom_margins_enabled"`
	MarginTopMm                   int    `json:"margin_top_mm"`
	MarginBottomMm                int    `json:"margin_bottom_mm"`
	MarginLeftMm                  int    `json:"margin_left_mm"`
	MarginRightMm                 int    `json:"margin_right_mm"`
	HideHeaderLogoOnPrint         bool   `json:"hide_header_logo_on_print"`
	AutoApproveAbsences           bool   `json:"auto_approve_absences"`
}

func DefaultClinicBudgetSettings() ClinicBudgetSettings {
	return ClinicBudgetSettings{
		LogoURL:                       "",
		ClinicContactLine:             "",
		BudgetDefaultValidityDays:     30,
		BudgetDefaultSeries:           "PRE",
		BudgetWarningDaysBeforeExpiry: 7,
		BudgetValidityTerms:           "Presupuesto válido durante el periodo de vigencia indicado. Los importes reflejados incluyen los materiales y controles clínicos especificados para cada alternativa de tratamiento.",
		BudgetAutoExpire:              true,
		CustomMarginsEnabled:          false,
		MarginTopMm:                   15,
		MarginBottomMm:                15,
		MarginLeftMm:                  15,
		MarginRightMm:                 15,
		HideHeaderLogoOnPrint:         false,
		AutoApproveAbsences:           false,
	}
}

func NormalizeClinicBudgetSettings(in ClinicBudgetSettings) ClinicBudgetSettings {
	def := DefaultClinicBudgetSettings()
	out := ClinicBudgetSettings{
		LogoURL:                       strings.TrimSpace(in.LogoURL),
		ClinicContactLine:             strings.TrimSpace(in.ClinicContactLine),
		BudgetDefaultValidityDays:     in.BudgetDefaultValidityDays,
		BudgetDefaultSeries:           strings.ToUpper(strings.TrimSpace(in.BudgetDefaultSeries)),
		BudgetWarningDaysBeforeExpiry: in.BudgetWarningDaysBeforeExpiry,
		BudgetValidityTerms:           strings.TrimSpace(in.BudgetValidityTerms),
		BudgetAutoExpire:              in.BudgetAutoExpire,
		CustomMarginsEnabled:          in.CustomMarginsEnabled,
		MarginTopMm:                   in.MarginTopMm,
		MarginBottomMm:                in.MarginBottomMm,
		MarginLeftMm:                  in.MarginLeftMm,
		MarginRightMm:                 in.MarginRightMm,
		HideHeaderLogoOnPrint:         in.HideHeaderLogoOnPrint,
		AutoApproveAbsences:           in.AutoApproveAbsences,
	}
	if out.BudgetDefaultValidityDays < 1 || out.BudgetDefaultValidityDays > 365 {
		out.BudgetDefaultValidityDays = def.BudgetDefaultValidityDays
	}
	if out.BudgetDefaultSeries == "" {
		out.BudgetDefaultSeries = def.BudgetDefaultSeries
	}
	if len(out.BudgetDefaultSeries) > 10 {
		out.BudgetDefaultSeries = out.BudgetDefaultSeries[:10]
	}
	if out.BudgetWarningDaysBeforeExpiry < 1 || out.BudgetWarningDaysBeforeExpiry > 90 {
		out.BudgetWarningDaysBeforeExpiry = def.BudgetWarningDaysBeforeExpiry
	}
	if out.BudgetValidityTerms == "" {
		out.BudgetValidityTerms = def.BudgetValidityTerms
	}
	if out.MarginTopMm < 0 || out.MarginTopMm > 150 {
		out.MarginTopMm = def.MarginTopMm
	}
	if out.MarginBottomMm < 0 || out.MarginBottomMm > 150 {
		out.MarginBottomMm = def.MarginBottomMm
	}
	if out.MarginLeftMm < 0 || out.MarginLeftMm > 150 {
		out.MarginLeftMm = def.MarginLeftMm
	}
	if out.MarginRightMm < 0 || out.MarginRightMm > 150 {
		out.MarginRightMm = def.MarginRightMm
	}
	return out
}

func (s *Store) GetClinicBudgetSettings(ctx context.Context, tx pgx.Tx, tenantID string) (ClinicBudgetSettings, error) {
	var raw []byte
	err := tx.QueryRow(ctx, `select coalesce(config, '{}'::jsonb) from tenants where id = $1`, tenantID).Scan(&raw)
	if errors.Is(err, pgx.ErrNoRows) {
		return DefaultClinicBudgetSettings(), ErrNotFound
	}
	if err != nil {
		return DefaultClinicBudgetSettings(), err
	}
	if len(raw) == 0 {
		return DefaultClinicBudgetSettings(), nil
	}
	var parsed ClinicBudgetSettings
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return DefaultClinicBudgetSettings(), nil
	}
	return NormalizeClinicBudgetSettings(parsed), nil
}

func (s *Store) UpdateClinicBudgetSettings(ctx context.Context, tx pgx.Tx, tenantID string, in ClinicBudgetSettings) (ClinicBudgetSettings, error) {
	norm := NormalizeClinicBudgetSettings(in)
	payload, err := json.Marshal(norm)
	if err != nil {
		return norm, err
	}
	var updatedRaw []byte
	err = tx.QueryRow(ctx, `update tenants
		set config = coalesce(config, '{}'::jsonb) || $2::jsonb
		where id = $1
		returning config`, tenantID, string(payload)).Scan(&updatedRaw)
	if errors.Is(err, pgx.ErrNoRows) {
		return norm, ErrNotFound
	}
	if err != nil {
		return norm, err
	}
	var out ClinicBudgetSettings
	if err := json.Unmarshal(updatedRaw, &out); err != nil {
		return norm, nil
	}
	return NormalizeClinicBudgetSettings(out), nil
}

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
	_ = s.SeedDefaultSpecialties(ctx, tx, t.ID)
	_ = s.SeedDefaultTreatments(ctx, tx, t.ID)
	_ = s.SeedDefaultFindings(ctx, tx, t.ID)
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
