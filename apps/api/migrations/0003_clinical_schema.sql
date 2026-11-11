CREATE TABLE cabinets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color_code VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cabinets_tenant ON cabinets(tenant_id);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    treatment_type VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED'
        CHECK (status IN ('SCHEDULED', 'WHATSAPP_SENT', 'CONFIRMED', 'WAITING_ROOM', 'IN_CABINET', 'COMPLETED', 'NO_SHOW', 'CANCELLED')),
    cancellation_reason TEXT,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_duration CHECK (end_time > start_time)
);
CREATE INDEX idx_appointments_range ON appointments(tenant_id, cabinet_id, start_time, end_time);
CREATE INDEX idx_appointments_patient ON appointments(tenant_id, patient_id);
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE clinical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    entry_type VARCHAR(30) NOT NULL CHECK (entry_type IN ('NOTE', 'DIAGNOSIS', 'PROCEDURE', 'PRESCRIPTION')),
    content TEXT NOT NULL,
    amends_entry_id UUID REFERENCES clinical_records(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clinical_patient ON clinical_records(tenant_id, patient_id);

CREATE TABLE odontograms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INITIAL', 'CURRENT', 'HISTORICAL')),
    teeth_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_odontograms_patient ON odontograms(tenant_id, patient_id, type);
CREATE INDEX idx_odontograms_teeth_gin ON odontograms USING GIN (teeth_data);
CREATE TRIGGER odontograms_updated_at BEFORE UPDATE ON odontograms FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE waiting_list_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    treatment_type VARCHAR(50) NOT NULL,
    estimated_duration_minutes INT NOT NULL DEFAULT 30,
    preferred_time_slot VARCHAR(20) NOT NULL DEFAULT 'ANY' CHECK (preferred_time_slot IN ('ANY', 'MORNING', 'AFTERNOON')),
    preferred_days INT[] DEFAULT '{1,2,3,4,5}',
    urgency_level VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (urgency_level IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'OFFERED', 'SCHEDULED', 'EXPIRED', 'CANCELLED')),
    hold_expires_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_waiting_list_lookup ON waiting_list_entries(tenant_id, status, urgency_level);

CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    meta_message_id VARCHAR(100) UNIQUE,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payload_text TEXT NOT NULL,
    intent_detected VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_whatsapp_appointment ON whatsapp_messages(tenant_id, appointment_id);

CREATE TABLE treatments_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    default_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    estimated_minutes INT NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX idx_treatments_tenant ON treatments_catalog(tenant_id);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    series VARCHAR(10) NOT NULL DEFAULT 'FAC',
    invoice_number INT NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('DRAFT', 'ISSUED', 'PAID', 'PARTIAL', 'CANCELLED')),
    verification_hash VARCHAR(64) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, series, invoice_number)
);
CREATE INDEX idx_invoices_patient ON invoices(tenant_id, patient_id);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER', 'FINANCING')),
    transaction_reference VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_invoice ON payments(tenant_id, invoice_id);

ALTER TABLE cabinets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabinets FORCE ROW LEVEL SECURITY;
CREATE POLICY cabinets_tenant ON cabinets FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments FORCE ROW LEVEL SECURITY;
CREATE POLICY appointments_tenant ON appointments FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_records FORCE ROW LEVEL SECURITY;
CREATE POLICY clinical_records_tenant ON clinical_records FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE odontograms ENABLE ROW LEVEL SECURITY;
ALTER TABLE odontograms FORCE ROW LEVEL SECURITY;
CREATE POLICY odontograms_tenant ON odontograms FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE waiting_list_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list_entries FORCE ROW LEVEL SECURITY;
CREATE POLICY waiting_list_tenant ON waiting_list_entries FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages FORCE ROW LEVEL SECURITY;
CREATE POLICY whatsapp_messages_tenant ON whatsapp_messages FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE treatments_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments_catalog FORCE ROW LEVEL SECURITY;
CREATE POLICY treatments_catalog_tenant ON treatments_catalog FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
CREATE POLICY invoices_tenant ON invoices FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
CREATE POLICY payments_tenant ON payments FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dentistes_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dentistes_app;
