-- Income Tax and PAYE amounts come from the school's own declaration, reviewed
-- by Operator 1 and approved by Operator 2. If a school doesn't declare by the
-- notice's due date, Operator 1 enters an estimate that follows the same
-- approval. The platform only records these figures; it doesn't calculate tax.
--
-- 'waived' is for a line that ends up with nothing to pay: a zero declaration,
-- or an objection upheld in full. It's separate from 'paid' because no money
-- moved, so it never reaches the ledger.
ALTER TABLE annual_notice_lines
  DROP CONSTRAINT IF EXISTS annual_notice_lines_status_check;

ALTER TABLE annual_notice_lines
  ADD CONSTRAINT annual_notice_lines_status_check
  CHECK (status IN ('awaiting_declaration', 'unpaid', 'paid', 'waived'));

CREATE TABLE IF NOT EXISTS tax_declarations (
  id               SERIAL PRIMARY KEY,
  line_id          INTEGER     NOT NULL REFERENCES annual_notice_lines(id),
  school_id        VARCHAR     NOT NULL,
  amount           NUMERIC     NOT NULL CHECK (amount >= 0),
  evidence_url     TEXT,
  note             TEXT,
  source           TEXT        NOT NULL DEFAULT 'school'
                   CHECK (source IN ('school', 'operator_estimate')),
  status           TEXT        NOT NULL DEFAULT 'pending_review'
                   CHECK (status IN ('pending_review', 'recommended', 'approved', 'rejected')),
  submitted_by     TEXT,
  recommended_by   TEXT,
  recommended_at   TIMESTAMPTZ,
  reviewed_by      TEXT,
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One live declaration per line; a rejected one can be submitted again.
CREATE UNIQUE INDEX IF NOT EXISTS tax_declarations_active_line_key
  ON tax_declarations (line_id)
  WHERE status <> 'rejected';

-- Section 90(1) objections. While one is pending the line can't be paid.
CREATE TABLE IF NOT EXISTS notice_objections (
  id              SERIAL PRIMARY KEY,
  line_id         INTEGER     NOT NULL REFERENCES annual_notice_lines(id),
  school_id       VARCHAR     NOT NULL,
  grounds         TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'upheld', 'dismissed')),
  previous_amount NUMERIC,
  revised_amount  NUMERIC     CHECK (revised_amount >= 0),
  decision_note   TEXT,
  decided_by      TEXT,
  decided_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS notice_objections_pending_line_key
  ON notice_objections (line_id)
  WHERE status = 'pending';
