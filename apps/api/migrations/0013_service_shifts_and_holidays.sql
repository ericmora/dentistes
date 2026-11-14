-- Migration 0013: Service shifts, holidays and date-specific overrides

CREATE TABLE clinic_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_full_day BOOLEAN NOT NULL DEFAULT true,
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_holiday_tenant_date UNIQUE (tenant_id, date)
);
CREATE INDEX idx_holidays_tenant ON clinic_holidays(tenant_id, date);

ALTER TABLE clinic_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_holidays FORCE ROW LEVEL SECURITY;
CREATE POLICY clinic_holidays_tenant ON clinic_holidays FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

CREATE TABLE service_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    cabinet_id UUID NOT NULL REFERENCES cabinets(id) ON DELETE RESTRICT,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 = Monday .. 7 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    doctor_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    categories JSONB NOT NULL DEFAULT '[]'::jsonb, -- Empty means all treatment categories allowed
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_shift_time CHECK (end_time > start_time)
);
CREATE INDEX idx_shifts_tenant ON service_shifts(tenant_id, day_of_week);

ALTER TABLE service_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_shifts FORCE ROW LEVEL SECURITY;
CREATE POLICY service_shifts_tenant ON service_shifts FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

CREATE TABLE shift_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    override_date DATE NOT NULL,
    shift_id UUID REFERENCES service_shifts(id) ON DELETE CASCADE,
    is_cancelled BOOLEAN NOT NULL DEFAULT false,
    custom_start_time TIME,
    custom_end_time TIME,
    custom_doctor_ids JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_shift_overrides_tenant ON shift_overrides(tenant_id, override_date);

ALTER TABLE shift_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_overrides FORCE ROW LEVEL SECURITY;
CREATE POLICY shift_overrides_tenant ON shift_overrides FOR ALL USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
