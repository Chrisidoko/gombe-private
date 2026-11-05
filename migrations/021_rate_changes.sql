-- Operator 2 sets the annual notice rates directly from the Rates page. Every
-- change is kept here, so there's a record of who changed which rate, from
-- what, to what, and when. A rate still applies from its year onward.
CREATE TABLE IF NOT EXISTS revenue_rate_changes (
  id                SERIAL PRIMARY KEY,
  subhead_id        INTEGER     NOT NULL REFERENCES revenue_subheads(id),
  year              INTEGER     NOT NULL,
  premises_category CHAR(1),
  location_type     TEXT,
  old_amount        NUMERIC,
  new_amount        NUMERIC     NOT NULL CHECK (new_amount >= 0),
  note              TEXT,
  changed_by        TEXT        NOT NULL,
  changed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS revenue_rate_changes_changed_at_idx
  ON revenue_rate_changes (changed_at DESC);
