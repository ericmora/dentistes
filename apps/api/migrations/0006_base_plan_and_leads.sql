INSERT INTO features (key, name, description) VALUES
    ('digital_signature', 'Signatura digital', 'Consentiments informats signats biomètricament')
ON CONFLICT (key) DO NOTHING;

INSERT INTO plans (key, name, description, price_monthly_cents, currency, is_active, sort_order)
VALUES (
    'base',
    'Pla Base Essencial',
    'Tarifa plana per clínica amb usuaris i pacients il·limitats',
    1850,
    'USD',
    true,
    10
)
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly_cents = EXCLUDED.price_monthly_cents,
    currency = EXCLUDED.currency,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;

UPDATE plans SET is_active = false WHERE key IN ('starter', 'clinic', 'enterprise');

INSERT INTO plan_features (plan_key, feature_key) VALUES
    ('base', 'patients'),
    ('base', 'agenda'),
    ('base', 'odontogram'),
    ('base', 'clinical_history'),
    ('base', 'waiting_list'),
    ('base', 'billing_pdf'),
    ('base', 'reports')
ON CONFLICT DO NOTHING;

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_name VARCHAR(150) NOT NULL,
    clinic_name VARCHAR(150) NOT NULL,
    email CITEXT NOT NULL,
    phone VARCHAR(30) NOT NULL DEFAULT '',
    interest VARCHAR(30) NOT NULL DEFAULT 'DEMO' CHECK (interest IN ('DEMO', 'TRIAL', 'MIGRATION', 'OTHER')),
    lang VARCHAR(5) NOT NULL DEFAULT 'ca',
    notes TEXT NOT NULL DEFAULT '',
    source VARCHAR(80) NOT NULL DEFAULT 'landing',
    utm_source VARCHAR(100) NOT NULL DEFAULT '',
    utm_medium VARCHAR(100) NOT NULL DEFAULT '',
    utm_campaign VARCHAR(100) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'ARCHIVED')),
    ip INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_status_created ON leads(status, created_at DESC);
CREATE INDEX idx_leads_email ON leads(email);
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON leads TO dentistes_app;
