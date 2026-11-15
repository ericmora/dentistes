-- Migration 0014: Add equipment, allowed_categories and allowed_treatments to cabinets

ALTER TABLE cabinets ADD COLUMN IF NOT EXISTS equipment TEXT DEFAULT '';
ALTER TABLE cabinets ADD COLUMN IF NOT EXISTS allowed_categories JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cabinets ADD COLUMN IF NOT EXISTS allowed_treatments JSONB DEFAULT '[]'::jsonb;
