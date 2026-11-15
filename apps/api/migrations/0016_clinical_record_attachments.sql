-- Migration 0016: Add attachments JSONB (clinical photos, radiographs/X-rays, and documents) to clinical_records

ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;
