-- Migration 0011: Add is_forced flag and notes to appointments for overbooking/sobrecitas and gap optimization

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_forced BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT;
