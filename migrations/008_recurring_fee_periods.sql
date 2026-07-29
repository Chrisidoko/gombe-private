-- Adds year-based recurrence support to schoolkano_payments so annual fees
-- (Monitoring & Evaluation, Annual Renewal of Registration) can be paid again
-- each year, while one-time fees keep their original "pay once" guarantee.
--
-- fee_year is NULL for one-time fees and the calendar year for annual fees.
-- The old (school_id, fee_id) uniqueness is replaced with one that also keys
-- on fee_year, treating NULL as a fixed value (0) so one-time fees still
-- can't get duplicate rows.

ALTER TABLE schoolkano_payments
  ADD COLUMN IF NOT EXISTS fee_year INTEGER;

DO $$
DECLARE
  found_constraint text;
BEGIN
  SELECT tc.constraint_name INTO found_constraint
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  WHERE tc.table_name = 'schoolkano_payments'
    AND tc.constraint_type = 'UNIQUE'
  GROUP BY tc.constraint_name
  HAVING array_agg(kcu.column_name::text ORDER BY kcu.column_name) = ARRAY['fee_id', 'school_id']::text[];

  IF found_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE schoolkano_payments DROP CONSTRAINT %I', found_constraint);
  END IF;
END $$;

DROP INDEX IF EXISTS schoolkano_payments_school_id_fee_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS schoolkano_payments_school_fee_period_key
  ON schoolkano_payments (school_id, fee_id, COALESCE(fee_year, 0));
