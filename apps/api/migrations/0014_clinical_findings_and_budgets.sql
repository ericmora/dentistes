-- Migration 0014: Clinical Findings (Hallazgos del Odontograma) & Multi-Option Treatment Budgets (Presupuestos por Tratamientos y Alternativas)

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;

CREATE TABLE clinical_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    tooth_number VARCHAR(20) NOT NULL DEFAULT 'General',
    surfaces JSONB NOT NULL DEFAULT '[]'::jsonb,
    pathology_code VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    diagnosis VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_BUDGET', 'ACCEPTED', 'INVOICED', 'DISCARDED')),
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clinical_findings_patient ON clinical_findings(tenant_id, patient_id, status);
CREATE TRIGGER clinical_findings_updated_at BEFORE UPDATE ON clinical_findings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE clinical_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_findings FORCE ROW LEVEL SECURITY;
CREATE POLICY clinical_findings_tenant ON clinical_findings FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

CREATE TABLE patient_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    series VARCHAR(10) NOT NULL DEFAULT 'PRE',
    budget_number INT NOT NULL,
    title VARCHAR(180) NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    validity_days INT NOT NULL DEFAULT 30 CHECK (validity_days > 0),
    valid_until DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PRESENTED' CHECK (status IN ('DRAFT', 'PRESENTED', 'ACCEPTED', 'PARTIAL', 'REJECTED', 'EXPIRED', 'INVOICED')),
    findings_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    min_estimate_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    max_estimate_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    accepted_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT NOT NULL DEFAULT '',
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, series, budget_number)
);
CREATE INDEX idx_patient_budgets_patient ON patient_budgets(tenant_id, patient_id, status);
CREATE TRIGGER patient_budgets_updated_at BEFORE UPDATE ON patient_budgets FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE patient_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_budgets FORCE ROW LEVEL SECURITY;
CREATE POLICY patient_budgets_tenant ON patient_budgets FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
