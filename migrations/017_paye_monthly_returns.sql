-- PAYE moves off the annual notice to a monthly return. Each month the school
-- lists its staff with gross pay and the PAYE it deducted. Operator 1 reviews
-- the return against the PAYE the platform expects from the bands, Operator 2
-- approves it, and the school pays it like a notice line.
--
-- One row per return covers both review and payment:
--   pending_review -> recommended -> unpaid -> paid
--   (waived instead of unpaid when nothing is due; rejected at either review,
--   after which the school files that month again)
CREATE TABLE IF NOT EXISTS paye_returns (
  id                 SERIAL PRIMARY KEY,
  school_id          VARCHAR     NOT NULL,
  period             DATE        NOT NULL CHECK (EXTRACT(DAY FROM period) = 1),
  filing_due_date    DATE        NOT NULL,
  source             TEXT        NOT NULL DEFAULT 'school'
                     CHECK (source IN ('school', 'operator_estimate')),
  status             TEXT        NOT NULL DEFAULT 'pending_review'
                     CHECK (status IN ('pending_review', 'recommended', 'rejected', 'unpaid', 'paid', 'waived')),
  declared_paye      NUMERIC     NOT NULL CHECK (declared_paye >= 0),
  expected_paye      NUMERIC     CHECK (expected_paye >= 0),
  total_gross        NUMERIC     CHECK (total_gross >= 0),
  staff_count        INTEGER     CHECK (staff_count >= 0),
  note               TEXT,
  submitted_by       TEXT,
  recommended_by     TEXT,
  recommended_at     TIMESTAMPTZ,
  reviewed_by        TEXT,
  reviewed_at        TIMESTAMPTZ,
  rejection_reason   TEXT,
  payment_due_date   DATE,
  revenue_subhead_id INTEGER     NOT NULL REFERENCES revenue_subheads(id),
  reference          TEXT        UNIQUE,
  credo_reference    TEXT,
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One live return per school per month; a rejected one can be filed again.
CREATE UNIQUE INDEX IF NOT EXISTS paye_returns_live_period_key
  ON paye_returns (school_id, period)
  WHERE status <> 'rejected';

CREATE INDEX IF NOT EXISTS paye_returns_status_idx ON paye_returns (status);

-- Staff names are copied from the school's People list (or added to it at
-- filing), not linked by id, because People is stored as JSON on schoolskano.
CREATE TABLE IF NOT EXISTS paye_return_staff (
  id            SERIAL PRIMARY KEY,
  return_id     INTEGER NOT NULL REFERENCES paye_returns(id) ON DELETE CASCADE,
  staff_name    TEXT    NOT NULL,
  staff_group   TEXT    NOT NULL CHECK (staff_group IN ('academic', 'non_academic')),
  role          TEXT,
  gross_pay     NUMERIC NOT NULL CHECK (gross_pay >= 0),
  paye_deducted NUMERIC NOT NULL CHECK (paye_deducted >= 0),
  expected_paye NUMERIC NOT NULL CHECK (expected_paye >= 0)
);

CREATE INDEX IF NOT EXISTS paye_return_staff_return_idx ON paye_return_staff (return_id);

-- The Sub-Head stays under GIRS for reports, but annual notices no longer
-- include it.
ALTER TABLE revenue_subheads
  DROP CONSTRAINT IF EXISTS revenue_subheads_charge_type_check;

ALTER TABLE revenue_subheads
  ADD CONSTRAINT revenue_subheads_charge_type_check
  CHECK (charge_type IN ('fee_schedule', 'annual_fixed', 'annual_premises', 'declared', 'manual', 'assessment', 'monthly_return'));

UPDATE revenue_subheads SET charge_type = 'monthly_return' WHERE code = 'GIRS_PAYE';

-- PAYE lines already on notices that were never declared go; anything with a
-- declaration or an amount is left alone.
DELETE FROM annual_notice_lines l
USING revenue_subheads s
WHERE s.id = l.revenue_subhead_id
  AND s.code = 'GIRS_PAYE'
  AND l.status = 'awaiting_declaration'
  AND l.reference IS NULL
  AND NOT EXISTS (SELECT 1 FROM tax_declarations d WHERE d.line_id = l.id)
  AND NOT EXISTS (SELECT 1 FROM notice_objections o WHERE o.line_id = l.id);
