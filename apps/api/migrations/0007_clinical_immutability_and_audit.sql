CREATE OR REPLACE FUNCTION prevent_clinical_record_mutation() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'clinical_records is append-only; use amends_entry_id instead';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clinical_records_no_update ON clinical_records;
CREATE TRIGGER clinical_records_no_update
    BEFORE UPDATE ON clinical_records
    FOR EACH ROW EXECUTE FUNCTION prevent_clinical_record_mutation();

DROP TRIGGER IF EXISTS clinical_records_no_delete ON clinical_records;
CREATE TRIGGER clinical_records_no_delete
    BEFORE DELETE ON clinical_records
    FOR EACH ROW EXECUTE FUNCTION prevent_clinical_record_mutation();

CREATE TABLE clinical_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    resource VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clinical_access_tenant_patient ON clinical_access_logs(tenant_id, patient_id, created_at DESC);

ALTER TABLE clinical_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_access_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY clinical_access_logs_tenant ON clinical_access_logs FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

GRANT SELECT, INSERT ON clinical_access_logs TO dentistes_app;
