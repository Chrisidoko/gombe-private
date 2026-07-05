-- Add Gombe State-specific profile fields to schoolskano.
-- All additions use IF NOT EXISTS so this is safe to re-run.

ALTER TABLE schoolskano
  ADD COLUMN IF NOT EXISTS vc_name                  TEXT,
  ADD COLUMN IF NOT EXISTS gsm_no                   TEXT,
  ADD COLUMN IF NOT EXISTS site_type                TEXT,
  ADD COLUMN IF NOT EXISTS total_students           INTEGER,
  ADD COLUMN IF NOT EXISTS enrollment_snapshot_date DATE,
  ADD COLUMN IF NOT EXISTS graduated_count          INTEGER,
  ADD COLUMN IF NOT EXISTS lab_status               TEXT,
  ADD COLUMN IF NOT EXISTS library_status           TEXT,
  ADD COLUMN IF NOT EXISTS board_members            JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS academic_staff           JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS non_academic_staff       JSONB NOT NULL DEFAULT '[]'::jsonb;
