-- Run this migration once against your PostgreSQL database
-- It creates the table that stores pending academic change requests from approved schools

CREATE TABLE IF NOT EXISTS academic_change_requests (
  id            SERIAL PRIMARY KEY,
  school_id     TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'approved' | 'rejected'
  current_snapshot  JSONB NOT NULL,                -- snapshot of approved academic data at submission time
  requested_changes JSONB NOT NULL,                -- the proposed new academic data
  rejection_reason  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Only one pending request per school at a time is enforced in the API,
-- but this index speeds up lookups by school_id + status
CREATE INDEX IF NOT EXISTS idx_acr_school_status
  ON academic_change_requests (school_id, status);
