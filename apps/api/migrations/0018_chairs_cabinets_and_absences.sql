-- Migration 0018: Dental Chairs (Butacas Físicas), Cabinets as Medical Teams (Doctor + Assistant + Chair) and Staff Absences (Vacaciones y Bajas)

CREATE TABLE IF NOT EXISTS dental_chairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color_code VARCHAR(7) DEFAULT '#0D9488',
    equipment TEXT DEFAULT '',
    allowed_categories JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dental_chairs_tenant ON dental_chairs(tenant_id);

ALTER TABLE dental_chairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dental_chairs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dental_chairs_tenant ON dental_chairs;
CREATE POLICY dental_chairs_tenant ON dental_chairs FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

-- Backfill existing cabinets into dental_chairs
INSERT INTO dental_chairs (id, tenant_id, name, color_code, equipment, allowed_categories, is_active, created_at)
SELECT id, tenant_id, name, coalesce(color_code, '#0D9488'), coalesce(equipment, ''), coalesce(allowed_categories, '[]'::jsonb), is_active, created_at
FROM cabinets
ON CONFLICT (id) DO NOTHING;

-- Extend cabinets to reference dental_chairs, doctor, and assistant
ALTER TABLE cabinets ADD COLUMN IF NOT EXISTS chair_id UUID REFERENCES dental_chairs(id) ON DELETE SET NULL;
ALTER TABLE cabinets ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE cabinets ADD COLUMN IF NOT EXISTS assistant_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Backfill chair_id on cabinets
UPDATE cabinets SET chair_id = id WHERE chair_id IS NULL;

-- Extend memberships role check to include ASSISTANT
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_role_check;
ALTER TABLE memberships ADD CONSTRAINT memberships_role_check CHECK (role IN ('OWNER', 'ADMIN', 'DENTIST', 'HYGIENIST', 'ASSISTANT', 'RECEPTIONIST'));

-- Extend appointments to include assistant_id
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS assistant_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Staff absences table
CREATE TABLE IF NOT EXISTS staff_absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    absence_type VARCHAR(30) NOT NULL CHECK (absence_type IN ('VACATION', 'SICK_LEAVE', 'PERSONAL')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    auto_rescheduled_count INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_absence_range CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_staff_absences_tenant ON staff_absences(tenant_id, user_id, start_date, end_date);

ALTER TABLE staff_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_absences FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS staff_absences_tenant ON staff_absences;
CREATE POLICY staff_absences_tenant ON staff_absences FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
