-- 0009_multi_currency_and_latam_fiscal.sql
-- Geolocalització, Multidivisa i Compliment Fiscal a LATAM (RQ-029, RQ-030, RQ-031)

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_country_code CHAR(2) NOT NULL DEFAULT 'ES';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_currency CHAR(3) NOT NULL DEFAULT 'EUR' CHECK (billing_currency IN ('EUR', 'MXN', 'USD'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);

-- Catàleg de configuracions fiscals regionals per país (ISO 3166-1 alpha-2)
CREATE TABLE IF NOT EXISTS regional_fiscal_configs (
    country_code CHAR(2) PRIMARY KEY,
    country_name VARCHAR(100) NOT NULL,
    currency_code CHAR(3) NOT NULL,
    tax_authority_name VARCHAR(100) NOT NULL,
    fiscal_document_name VARCHAR(100) NOT NULL,
    tax_id_label VARCHAR(30) NOT NULL,
    tax_id_regex VARCHAR(255) NOT NULL,
    compliance_status VARCHAR(30) NOT NULL CHECK (
        compliance_status IN ('ACTIVE_DIRECT', 'ACTIVE_PARTNER', 'COMING_SOON', 'INTERNAL_ONLY')
    ),
    requires_partner BOOLEAN NOT NULL DEFAULT FALSE,
    partner_provider_key VARCHAR(50),
    adapter_class VARCHAR(100) NOT NULL,
    default_vat_rate NUMERIC(5,2) DEFAULT 0.00,
    retention_years INT NOT NULL DEFAULT 5,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Overrides i Feature Flags específics per clínica (Tenant)
CREATE TABLE IF NOT EXISTS tenant_feature_flags (
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    flag_key VARCHAR(80) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    rollout_stage VARCHAR(30) DEFAULT 'GA',
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, flag_key)
);

ALTER TABLE tenant_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_feature_flags FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tenant_feature_flags' AND policyname = 'tenant_feature_flags_isolation'
    ) THEN
        CREATE POLICY tenant_feature_flags_isolation ON tenant_feature_flags
            USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
    END IF;
END $$;

-- Preus multidivisa fixos per pla
CREATE TABLE IF NOT EXISTS plan_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_key TEXT NOT NULL REFERENCES plans(key) ON DELETE CASCADE,
    currency CHAR(3) NOT NULL CHECK (currency IN ('EUR', 'MXN', 'USD')),
    interval VARCHAR(10) NOT NULL CHECK (interval IN ('month', 'year')),
    amount_cents INTEGER NOT NULL,
    stripe_price_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (plan_key, currency, interval)
);

-- Seed de configuracions fiscals segons la Matriu LATAM + Espanya
INSERT INTO regional_fiscal_configs (
    country_code, country_name, currency_code, tax_authority_name,
    fiscal_document_name, tax_id_label, tax_id_regex,
    compliance_status, requires_partner, partner_provider_key,
    adapter_class, default_vat_rate, retention_years
) VALUES
    ('ES', 'Espanya', 'EUR', 'AEAT', 'VeriFactu / TicketBAI', 'NIF', '^[A-Z0-9]{8,10}$', 'ACTIVE_DIRECT', false, NULL, 'VeriFactuAdapter', 0.00, 5),
    ('CO', 'Colòmbia', 'COP', 'DIAN', 'Factura Electrónica de Venta (FEV)', 'NIT', '^[0-9]{9,10}$', 'ACTIVE_DIRECT', false, NULL, 'DianColombiaAdapter', 0.00, 5),
    ('CL', 'Xile', 'CLP', 'SII', 'DTE / Boleta Electrònica', 'RUT', '^[0-9]{7,9}-[0-9kK]$', 'ACTIVE_DIRECT', false, NULL, 'SiiChileAdapter', 0.00, 6),
    ('AR', 'Argentina', 'ARS', 'ARCA', 'Factura Electrónica (CAE)', 'CUIT', '^[0-9]{11}$', 'ACTIVE_DIRECT', false, NULL, 'ArcaArgentinaAdapter', 0.00, 5),
    ('CR', 'Costa Rica', 'CRC', 'Ministerio de Hacienda', 'Factura Electrónica', 'Cédula/NIF', '^[0-9]{9,12}$', 'ACTIVE_DIRECT', false, NULL, 'MhCostaRicaAdapter', 0.00, 5),
    ('EC', 'Equador', 'USD', 'SRI', 'Comprobante Electrónico', 'RUC', '^[0-9]{13}$', 'ACTIVE_DIRECT', false, NULL, 'SriEcuadorAdapter', 0.00, 7),
    ('DO', 'República Dominicana', 'DOP', 'DGII', 'e-CF', 'RNC', '^[0-9]{9,11}$', 'ACTIVE_DIRECT', false, NULL, 'DgiiDominicanaAdapter', 0.00, 10),
    ('UY', 'Uruguai', 'UYU', 'DGI', 'CFE', 'RUT', '^[0-9]{12}$', 'ACTIVE_DIRECT', false, NULL, 'DgiUruguayAdapter', 0.00, 5),
    ('SV', 'El Salvador', 'USD', 'Ministerio de Hacienda', 'DTE', 'NIT', '^[0-9]{14}$', 'ACTIVE_DIRECT', false, NULL, 'MhElSalvadorAdapter', 0.00, 5),
    ('MX', 'Mèxic', 'MXN', 'SAT', 'CFDI 4.0', 'RFC', '^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$', 'COMING_SOON', true, 'finkok_mx', 'SatMexicoAdapter', 0.00, 5),
    ('PE', 'Perú', 'PEN', 'SUNAT', 'CPE (Factura / Boleta)', 'RUC', '^[0-9]{11}$', 'COMING_SOON', true, 'nubefact_pe', 'SunatPeruAdapter', 0.00, 5),
    ('GT', 'Guatemala', 'GTQ', 'SAT', 'FEL', 'NIT', '^[0-9]{4,10}-?[0-9kK]?$', 'COMING_SOON', true, 'infile_gt', 'SatGuatemalaAdapter', 0.00, 4),
    ('PA', 'Panamà', 'PAB', 'DGI', 'SFEP', 'RUC', '^[0-9A-Z-]{5,20}$', 'COMING_SOON', true, 'pac_pa', 'DgiPanamaAdapter', 0.00, 5),
    ('BO', 'Bolívia', 'BOB', 'SIN', 'SIAT en Línia', 'NIT', '^[0-9]{7,12}$', 'INTERNAL_ONLY', false, NULL, 'GenericReceiptAdapter', 0.00, 5),
    ('PY', 'Paraguai', 'PYG', 'DNIT', 'SIFEN (KuDE)', 'RUC', '^[0-9]{6,9}-[0-9]$', 'INTERNAL_ONLY', false, NULL, 'GenericReceiptAdapter', 0.00, 5),
    ('BR', 'Brasil', 'BRL', 'Receita Federal', 'NFS-e', 'CNPJ', '^[0-9]{14}$', 'INTERNAL_ONLY', true, NULL, 'GenericReceiptAdapter', 0.00, 5)
ON CONFLICT (country_code) DO UPDATE SET
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    tax_authority_name = EXCLUDED.tax_authority_name,
    fiscal_document_name = EXCLUDED.fiscal_document_name,
    tax_id_label = EXCLUDED.tax_id_label,
    tax_id_regex = EXCLUDED.tax_id_regex,
    compliance_status = EXCLUDED.compliance_status,
    requires_partner = EXCLUDED.requires_partner,
    partner_provider_key = EXCLUDED.partner_provider_key,
    adapter_class = EXCLUDED.adapter_class,
    default_vat_rate = EXCLUDED.default_vat_rate,
    retention_years = EXCLUDED.retention_years,
    updated_at = NOW();

-- Seed de preus multidivisa fixos per al pla 'base'
INSERT INTO plan_prices (plan_key, currency, interval, amount_cents) VALUES
    ('base', 'EUR', 'month', 4900),
    ('base', 'EUR', 'year', 47000),
    ('base', 'MXN', 'month', 99900),
    ('base', 'MXN', 'year', 959000),
    ('base', 'USD', 'month', 4900),
    ('base', 'USD', 'year', 47000)
ON CONFLICT (plan_key, currency, interval) DO UPDATE SET
    amount_cents = EXCLUDED.amount_cents,
    updated_at = now();

GRANT SELECT ON regional_fiscal_configs TO dentistes_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_feature_flags TO dentistes_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON plan_prices TO dentistes_app;
