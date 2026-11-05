-- Bulk (Ministry) assessments give schools a number of days to pay, counted
-- from Operator 2's approval, instead of a fixed date. A fixed date could pass
-- while the assessment waited for review and reach schools already overdue.
-- Replaces the due_date column from 019, which never held a value.
ALTER TABLE schoolkano_bulk_assessments
  ADD COLUMN IF NOT EXISTS payment_days INTEGER CHECK (payment_days BETWEEN 1 AND 365);

ALTER TABLE schoolkano_bulk_assessments
  DROP COLUMN IF EXISTS due_date;
