-- The yearly single demand notice. Operator 1 prepares a batch, Operator 2
-- approves it, and only then do schools see their notice and the 30 days start.
--
-- Each line is paid on its own so a school can pay what it accepts while
-- disputing the rest, and so each payment reaches the ledger under its own
-- Sub-Head. Unpaid lines are never copied forward: they stay on their original
-- notice and are read back as arrears, so they can't be charged twice.
--
-- Line amounts are stored rather than looked up, so a later rate change can't
-- alter a notice already issued.
CREATE TABLE IF NOT EXISTS annual_notice_batches (
  id                SERIAL PRIMARY KEY,
  year              INTEGER     NOT NULL,
  source            TEXT        NOT NULL DEFAULT 'operator'
                    CHECK (source IN ('operator', 'school_approval')),
  status            TEXT        NOT NULL DEFAULT 'pending_approval'
                    CHECK (status IN ('pending_approval', 'approved', 'rejected')),
  created_by        TEXT,
  reviewed_by       TEXT,
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS annual_notices (
  id             SERIAL PRIMARY KEY,
  batch_id       INTEGER     NOT NULL REFERENCES annual_notice_batches(id),
  school_id      VARCHAR     NOT NULL,
  year           INTEGER     NOT NULL,
  notice_number  TEXT        UNIQUE,
  status         TEXT        NOT NULL DEFAULT 'pending_approval'
                 CHECK (status IN ('pending_approval', 'issued', 'rejected')),
  issued_at      TIMESTAMPTZ,
  due_date       DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One live notice per school per year; a rejected one can be prepared again.
CREATE UNIQUE INDEX IF NOT EXISTS annual_notices_school_year_key
  ON annual_notices (school_id, year)
  WHERE status <> 'rejected';

CREATE INDEX IF NOT EXISTS idx_annual_notices_batch ON annual_notices (batch_id);

CREATE TABLE IF NOT EXISTS annual_notice_lines (
  id                  SERIAL PRIMARY KEY,
  notice_id           INTEGER     NOT NULL REFERENCES annual_notices(id),
  revenue_subhead_id  INTEGER     NOT NULL REFERENCES revenue_subheads(id),
  -- NULL until the school's declaration is approved (Income Tax and PAYE)
  amount              NUMERIC     CHECK (amount >= 0),
  status              TEXT        NOT NULL
                      CHECK (status IN ('awaiting_declaration', 'unpaid', 'paid')),
  due_date            DATE,
  reference           TEXT        UNIQUE,
  credo_reference     TEXT,
  paid_at             TIMESTAMPTZ,
  UNIQUE (notice_id, revenue_subhead_id)
);

CREATE INDEX IF NOT EXISTS idx_annual_notice_lines_credo
  ON annual_notice_lines (credo_reference);
