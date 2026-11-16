-- Migration 0018: Specialties master table with logical delete and matching cabinets/treatments
CREATE TABLE IF NOT EXISTS specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(60) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    color_code VARCHAR(30) NOT NULL DEFAULT '#0D9488',
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_specialties_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_specialties_tenant ON specialties(tenant_id) WHERE deleted_at IS NULL;

CREATE TRIGGER specialties_updated_at BEFORE UPDATE ON specialties FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties FORCE ROW LEVEL SECURITY;
CREATE POLICY specialties_tenant ON specialties FOR ALL
    USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

-- Seed default specialties for all existing tenants
INSERT INTO specialties (tenant_id, code, name, description, color_code, is_active)
SELECT t.id, s.code, s.name, s.description, s.color_code, true
FROM tenants t
CROSS JOIN (
    VALUES
    ('PREVENCION', 'Diagnóstico y Prevención', 'Revisiones, diagnósticos y limpiezas preventivas', '#0EA5E9'),
    ('CONSERVADORA', 'Odontología Conservadora', 'Obturaciones, empastes simples y restauraciones', '#3B82F6'),
    ('ENDODONCIA', 'Endodoncia', 'Tratamientos de conductos radiculares', '#8B5CF6'),
    ('CIRUGIA', 'Cirugía e Implantes', 'Extracciones dentales, cirugía oral e implantología', '#F97316'),
    ('IMPLANTES', 'Implantología', 'Implantes dentales, cirugías guiadas y osteointegración', '#0F172A'),
    ('PERIODONCIA', 'Periodoncia', 'Tratamientos periodontales, raspados y curetajes', '#10B981'),
    ('PROTESIS', 'Prótesis Dental', 'Prótesis fijas, removibles y sobre implantes', '#D97706'),
    ('ORTODONCIA', 'Ortodoncia', 'Brackets, ortodoncia invisible y alineadores', '#EC4899'),
    ('ESTETICA', 'Estética Dental', 'Blanqueamientos, carillas y estética dental', '#F59E0B'),
    ('ODONTOPEDIATRIA', 'Odontopediatría', 'Odontología y atención infantil especializada', '#06B6D4'),
    ('HIGIENE', 'Higiene Dental', 'Profilaxis bucodental y mantenimientos', '#14B8A6'),
    ('GENERAL', 'General', 'Procedimientos y consultas generales', '#64748B')
) AS s(code, name, description, color_code)
ON CONFLICT (tenant_id, code) DO NOTHING;
