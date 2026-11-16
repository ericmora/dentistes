-- Migration 0020: Master catalog for clinical findings and default treatment protocols per tenant

CREATE TABLE IF NOT EXISTS findings_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(60) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category VARCHAR(60) NOT NULL DEFAULT 'GENERAL',
    default_severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (default_severity IN ('LOW', 'MEDIUM', 'HIGH')),
    color_code VARCHAR(30) NOT NULL DEFAULT '#0D9488',
    default_treatment_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_findings_catalog_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_findings_catalog_tenant ON findings_catalog(tenant_id) WHERE deleted_at IS NULL;

CREATE TRIGGER findings_catalog_updated_at BEFORE UPDATE ON findings_catalog FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE findings_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings_catalog FORCE ROW LEVEL SECURITY;
CREATE POLICY findings_catalog_tenant ON findings_catalog FOR ALL
    USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

-- Seed default findings and protocols for existing tenants
INSERT INTO findings_catalog (tenant_id, code, name, description, category, default_severity, color_code, default_treatment_codes, is_active)
SELECT t.id, f.code, f.name, f.description, f.category, f.default_severity, f.color_code, f.default_treatment_codes::jsonb, true
FROM tenants t
CROSS JOIN (
    VALUES
    ('CARIES_ESMALTE', 'Caries superficial / esmalte', 'Lesión cariosa incipiente o limitada al esmalte sin compromiso pulpar', 'CONSERVADORA', 'LOW', '#3B82F6', '["OBTURACION_SIMPLE"]'),
    ('CARIES_PROFUNDA', 'Caries profunda con pulpitis', 'Afectación dentinaria profunda con inflamación o necrosis pulpar', 'ENDODONCIA', 'HIGH', '#8B5CF6', '["ENDODONCIA_MULTIRRADICULAR", "OBTURACION_COMPLEJA", "CORONA"]'),
    ('FRACTURA_DENTAL', 'Fractura coronal dental', 'Rotura traumática de estructura dental con o sin afección cuspídea', 'CONSERVADORA', 'MEDIUM', '#F59E0B', '["OBTURACION_COMPLEJA", "CORONA"]'),
    ('RESTO_RADICULAR', 'Resto radicular / Destrucción severa', 'Pieza no restaurable por pérdida masiva de tejido biológico', 'CIRUGIA', 'HIGH', '#EA580C', '["EXTRACCION_QUIRURGICA", "IMPLANTE", "CORONA"]'),
    ('DIENTE_INCLUIDO', 'Diente incluido / Cordal impactado', 'Tercer molar o pieza retenida que requiere abordaje quirúrgico', 'CIRUGIA', 'MEDIUM', '#F97316', '["EXTRACCION_QUIRURGICA"]'),
    ('GINGIVITIS', 'Gingivitis y cálculo supragingival', 'Inflamación de tejidos blandos y depósitos de sarro', 'PREVENCION', 'LOW', '#06B6D4', '["LIMPIEZA"]'),
    ('PERIODONTITIS', 'Periodontitis activa (Bolsas periodontales)', 'Pérdida de inserción ósea y presencia de bolsas > 4mm', 'PERIODONCIA', 'HIGH', '#10B981', '["CURETAJE_CUADRANTE", "MANTENIMIENTO_PERIODONTAL"]'),
    ('EDENTULISMO_UNITARIO', 'Ausencia de pieza dental (Edentulismo)', 'Pérdida de pieza dentaria que precisa rehabilitación prostodóncica', 'CIRUGIA', 'MEDIUM', '#0F172A', '["IMPLANTE", "CORONA"]'),
    ('BRUXISMO', 'Bruxismo / Desgaste oclusal severo', 'Parafunción masticatoria con atrición dental y sobrecarga articular', 'ESTETICA', 'MEDIUM', '#6366F1', '["FERULA_DESCARGA"]'),
    ('ABSCESO_PERIAPICAL', 'Infección / Absceso periapical', 'Proceso infeccioso agudo con exudado periapical o flemón', 'ENDODONCIA', 'HIGH', '#EF4444', '["URGENCIA", "ENDODONCIA_MULTIRRADICULAR", "OBTURACION_COMPLEJA"]'),
    ('TINCION_ESTETICA', 'Tinción dental / Deseo de aclaramiento', 'Decoloración o pigmentación dental susceptible de blanqueamiento', 'ESTETICA', 'LOW', '#F59E0B', '["LIMPIEZA", "BLANQUEAMIENTO"]'),
    ('PREVENCION_SELLADO', 'Fisuras profundas en riesgo', 'Anatomía oclusal retentiva con alto riesgo de caries', 'CONSERVADORA', 'LOW', '#60A5FA', '["SELLADOR"]')
) AS f(code, name, description, category, default_severity, color_code, default_treatment_codes)
ON CONFLICT (tenant_id, code) DO NOTHING;
