-- Annual notices are now only started by Operator 1, never automatically on
-- school approval. A prepared batch is a draft that Operator 1 can check and
-- adjust per school before sending it to Operator 2. Operator 2 returning a
-- batch puts it back to draft, with the reason in rejection_reason.
ALTER TABLE annual_notice_batches
  DROP CONSTRAINT IF EXISTS annual_notice_batches_status_check;

ALTER TABLE annual_notice_batches
  ADD CONSTRAINT annual_notice_batches_status_check
  CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected'));

ALTER TABLE annual_notice_batches ALTER COLUMN status SET DEFAULT 'draft';

-- A changed amount keeps the standard rate beside it, with who changed it and
-- why, so Operator 2 and the Tax Audit can see every adjustment. An amount of
-- 0 means the item doesn't apply to that school; it's issued as nothing due.
ALTER TABLE annual_notice_lines
  ADD COLUMN IF NOT EXISTS standard_amount   NUMERIC CHECK (standard_amount >= 0),
  ADD COLUMN IF NOT EXISTS adjustment_reason TEXT,
  ADD COLUMN IF NOT EXISTS adjusted_by       TEXT,
  ADD COLUMN IF NOT EXISTS adjusted_at       TIMESTAMPTZ;

-- Fixed-rate lines issued before this change were at the standard rate.
-- Declared lines (Income Tax) have no standard amount.
UPDATE annual_notice_lines l
SET standard_amount = l.amount
FROM revenue_subheads s
WHERE s.id = l.revenue_subhead_id
  AND s.charge_type IN ('annual_fixed', 'annual_premises')
  AND l.standard_amount IS NULL AND l.amount IS NOT NULL;
