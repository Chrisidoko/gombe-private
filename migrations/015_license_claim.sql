-- Separates what a school says about its licence from whether it's active.
-- (The database calls it a licence; schools see it as the certificate.)
--
-- license_claim is the school's own answer: it holds an Active or Expired
-- certificate issued before this portal, or None. license_status is now set
-- only by Admin confirming an existing licence at approval, or by the
-- Certificate fee being paid, so a school can't activate itself.
ALTER TABLE schoolskano
  ADD COLUMN IF NOT EXISTS license_claim TEXT
  CHECK (license_claim IN ('Active', 'Expired', 'None'));

-- Until now schools set license_status themselves. Keep those answers as
-- claims, then clear the status of any school not yet approved so Admin
-- decides at approval. Approved schools keep their status.
UPDATE schoolskano
SET license_claim = license_status
WHERE license_claim IS NULL
  AND license_status IN ('Active', 'Expired');

UPDATE schoolskano
SET license_status = NULL
WHERE approval_status IS DISTINCT FROM 'approved'
  AND license_status IS NOT NULL;
