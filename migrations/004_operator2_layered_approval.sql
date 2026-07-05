-- Migration 004: Operator2 layered approval workflow
-- Adds columns to support a two-level operator approval chain for:
--   1. Bulk (Ministry) Assessments
--   2. Self Assessments (evaluations)
--   3. Demand Notices (other fees)

-- ── 1. schoolkano_bulk_assessments ──────────────────────────────────────────
-- New status values: 'pending_approval' | 'approved' | 'rejected'
-- (legacy rows that were immediately sent retain status='sent')
ALTER TABLE schoolkano_bulk_assessments
  ADD COLUMN IF NOT EXISTS reviewed_by       VARCHAR,
  ADD COLUMN IF NOT EXISTS reviewed_at       TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejection_reason  TEXT;

-- ── 2. schoolskano_assessments (self-assessments) ───────────────────────────
-- op1_recommendation is set when Operator 1 reviews a pending submission.
-- Status 'under_review' = Op1 has made a recommendation, waiting for Op2.
ALTER TABLE schoolskano_assessments
  ADD COLUMN IF NOT EXISTS op1_recommendation  VARCHAR,  -- 'recommend_approve' | 'recommend_reject'
  ADD COLUMN IF NOT EXISTS op1_note            TEXT;

-- ── 3. pending_demand_notices (staging table for Other Fees) ─────────────────
-- Operator 1 submits a demand notice here; it only becomes a live invoice
-- after Operator 2 approves it.
CREATE TABLE IF NOT EXISTS pending_demand_notices (
  id                SERIAL PRIMARY KEY,
  school_id         VARCHAR        NOT NULL,
  school_name       VARCHAR,
  school_email      VARCHAR,
  title             VARCHAR        NOT NULL,
  amount            NUMERIC        NOT NULL,
  narration         TEXT,
  status            VARCHAR        NOT NULL DEFAULT 'pending_approval',
  -- status values: 'pending_approval' | 'approved' | 'rejected'
  submitted_by      VARCHAR        DEFAULT 'operator',
  reviewed_by       VARCHAR,
  reviewed_at       TIMESTAMP,
  rejection_reason  TEXT,
  invoice_id        INTEGER,       -- set on approval to link resulting invoice
  created_at        TIMESTAMP      DEFAULT NOW()
);
