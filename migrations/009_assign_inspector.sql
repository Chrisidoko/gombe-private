-- Let an admin assign an inspector to a school at approval time.
-- Informational only for now — does not restrict inspector visibility/actions.
ALTER TABLE schoolskano
  ADD COLUMN IF NOT EXISTS assigned_inspector_name  TEXT,
  ADD COLUMN IF NOT EXISTS assigned_inspector_email TEXT;
