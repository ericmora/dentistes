-- Migration 0012: Add availability and blocked intervals per day of week to cabinets

ALTER TABLE cabinets ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '[]'::jsonb;
