-- Organises all collections under Heads and Sub-Heads, per the Gombe State
-- director's request, so reports can show what each MDA generated per month
-- and year.
--
-- transactionskano only stores the Sub-Head; the Head is always derived from
-- it, so the two can't disagree. Nullable on purpose: payments-gateway also
-- writes to this table and external partners have no Sub-Head — same reasoning
-- as category/source (see 010_transaction_category.sql).
--
-- charge_type says how a Sub-Head gets billed:
--   fee_schedule    — Compliance Standing fee, linked through fee_id
--   annual_fixed    — annual notice line, flat amount from revenue_rates
--   annual_premises — annual notice line, amount depends on the school's
--                     premises_category and location_type
--   declared        — annual notice line, amount from the school's approved
--                     tax declaration, so it has no revenue_rates row
--   manual          — raised by Operator 1 through Other Fees
--   assessment      — set by Operator 2's bulk assessment approval
--
-- Amounts live in revenue_rates per year, so a rate change is a new row and
-- never rewrites what an earlier notice charged.

CREATE TABLE IF NOT EXISTS revenue_heads (
  id          SERIAL PRIMARY KEY,
  code        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS revenue_subheads (
  id           SERIAL PRIMARY KEY,
  head_id      INTEGER NOT NULL REFERENCES revenue_heads(id),
  code         TEXT    NOT NULL UNIQUE,
  name         TEXT    NOT NULL,
  charge_type  TEXT    NOT NULL CHECK (charge_type IN
    ('fee_schedule', 'annual_fixed', 'annual_premises', 'declared', 'manual', 'assessment')),
  fee_id       INTEGER UNIQUE,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  active       BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS revenue_rates (
  id                 SERIAL PRIMARY KEY,
  subhead_id         INTEGER NOT NULL REFERENCES revenue_subheads(id),
  year               INTEGER NOT NULL,
  premises_category  CHAR(1) CHECK (premises_category IN ('A', 'B', 'C')),
  location_type      TEXT    CHECK (location_type IN ('urban', 'rural')),
  amount             NUMERIC NOT NULL CHECK (amount >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS revenue_rates_subhead_year_key
  ON revenue_rates (subhead_id, year, COALESCE(premises_category, ''), COALESCE(location_type, ''));

-- ── Heads ───────────────────────────────────────────────────────────────────
INSERT INTO revenue_heads (code, name, sort_order) VALUES
  ('GIRS',      'Gombe State Internal Revenue Service',                 1),
  ('TRADE',     'Ministry of Trade and Tourism',                        2),
  ('ENV',       'Ministry of Environment and Forestry',                 3),
  ('GOSUPDA',   'Gombe State Urban Planning and Development Agency',    4),
  ('FIRE',      'Fire Service Directorate',                             5),
  ('EDUCATION', 'Ministry of Education and Higher Education',           6),
  ('LG',        'Local Government',                                     7)
ON CONFLICT (code) DO NOTHING;

-- ── Sub-Heads ───────────────────────────────────────────────────────────────
INSERT INTO revenue_subheads (head_id, code, name, charge_type, fee_id, sort_order)
SELECT h.id, v.code, v.name, v.charge_type, v.fee_id, v.sort_order
FROM (VALUES
  ('GIRS',      'GIRS_PIT',            'Personal Income Tax',                'declared',        NULL::integer, 1),
  ('GIRS',      'GIRS_PAYE',           'Pay As You Earn (PAYE)',             'declared',        NULL,          2),
  ('GIRS',      'GIRS_DEV_LEVY',       'Development Levy',                   'annual_fixed',    NULL,          3),
  ('GIRS',      'GIRS_STAFF_LEVY',     'Staff Development Levy',             'annual_fixed',    NULL,          4),
  ('GIRS',      'GIRS_PENALTY',        'Penalty',                            'manual',          NULL,          5),

  ('TRADE',     'TRADE_PREMISES_REG',  'Registration of Business Premises',  'annual_premises', NULL,          1),
  ('TRADE',     'TRADE_PREMISES_REN',  'Renewal of Business Premises',       'annual_premises', NULL,          2),
  ('TRADE',     'TRADE_PENALTY',       'Penalty',                            'manual',          NULL,          3),

  ('ENV',       'ENV_GASEOUS',         'Gaseous Emissions',                  'annual_fixed',    NULL,          1),
  ('ENV',       'ENV_PENALTY',         'Penalty',                            'manual',          NULL,          2),

  ('GOSUPDA',   'GOSUPDA_SIGNAGE',     'Signage',                            'annual_fixed',    NULL,          1),
  ('GOSUPDA',   'GOSUPDA_PENALTY',     'Penalty',                            'manual',          NULL,          2),

  ('FIRE',      'FIRE_INSPECTION',     'Fire Service Inspection Fee',        'annual_fixed',    NULL,          1),
  ('FIRE',      'FIRE_PENALTY',        'Penalty',                            'manual',          NULL,          2),

  ('EDUCATION', 'EDU_APPLICATION',     'Application Form',                   'fee_schedule',    1,             1),
  ('EDUCATION', 'EDU_GUIDELINE',       'Guideline Booklet',                  'fee_schedule',    2,             2),
  ('EDUCATION', 'EDU_REGISTRATION',    'Registration',                       'fee_schedule',    3,             3),
  ('EDUCATION', 'EDU_CERTIFICATION',   'Certification',                      'fee_schedule',    4,             4),
  ('EDUCATION', 'EDU_INSPECTION',      'Inspection',                         'fee_schedule',    5,             5),
  ('EDUCATION', 'EDU_RENEWAL',         'Annual Renewal',                     'fee_schedule',    6,             6),
  ('EDUCATION', 'EDU_ASSESSMENT',      'Ministry Assessment',                'assessment',      NULL,          7),
  ('EDUCATION', 'EDU_OTHER',           'Other Ministry Charges',             'manual',          NULL,          8),
  ('EDUCATION', 'EDU_PENALTY',         'Penalty',                            'manual',          NULL,          9),

  -- No rates supplied yet — billed through Other Fees until they are.
  ('LG',        'LG_TENEMENT',         'Tenement Rate',                      'manual',          NULL,          1),
  ('LG',        'LG_SHOP_KIOSK',       'Shop & Kiosk',                       'manual',          NULL,          2),
  ('LG',        'LG_DIRECTIONAL',      'Directional Signage Permits',        'manual',          NULL,          3),
  ('LG',        'LG_PENALTY',          'Penalty',                            'manual',          NULL,          4)
) AS v (head_code, code, name, charge_type, fee_id, sort_order)
JOIN revenue_heads h ON h.code = v.head_code
ON CONFLICT (code) DO NOTHING;

-- ── 2026 rates (the 2025 GIRS notice amounts, carried forward) ──────────────
INSERT INTO revenue_rates (subhead_id, year, premises_category, location_type, amount)
SELECT s.id, 2026, v.premises_category, v.location_type, v.amount
FROM (VALUES
  ('GIRS_DEV_LEVY',      NULL::char(1), NULL::text, 20000),
  ('GIRS_STAFF_LEVY',    NULL,          NULL,        5000),
  ('ENV_GASEOUS',        NULL,          NULL,       10000),
  ('GOSUPDA_SIGNAGE',    NULL,          NULL,       10000),
  ('FIRE_INSPECTION',    NULL,          NULL,       20000),

  ('TRADE_PREMISES_REG', 'A',           'urban',   100000),
  ('TRADE_PREMISES_REG', 'B',           'urban',    50000),
  ('TRADE_PREMISES_REG', 'C',           'urban',    30000),
  ('TRADE_PREMISES_REG', 'A',           'rural',    50000),
  ('TRADE_PREMISES_REG', 'B',           'rural',    30000),
  ('TRADE_PREMISES_REG', 'C',           'rural',    20000),

  ('TRADE_PREMISES_REN', 'A',           'urban',   100000),
  ('TRADE_PREMISES_REN', 'B',           'urban',    50000),
  ('TRADE_PREMISES_REN', 'C',           'urban',    30000),
  ('TRADE_PREMISES_REN', 'A',           'rural',    50000),
  ('TRADE_PREMISES_REN', 'B',           'rural',    30000),
  ('TRADE_PREMISES_REN', 'C',           'rural',    20000)
) AS v (code, premises_category, location_type, amount)
JOIN revenue_subheads s ON s.code = v.code
ON CONFLICT (subhead_id, year, COALESCE(premises_category, ''), COALESCE(location_type, ''))
DO NOTHING;

-- ── Link charges and the ledger to Sub-Heads ────────────────────────────────
ALTER TABLE pending_demand_notices
  ADD COLUMN IF NOT EXISTS revenue_subhead_id INTEGER REFERENCES revenue_subheads(id);

ALTER TABLE schoolkano_invoices
  ADD COLUMN IF NOT EXISTS revenue_subhead_id INTEGER REFERENCES revenue_subheads(id);

ALTER TABLE transactionskano
  ADD COLUMN IF NOT EXISTS revenue_subhead_id INTEGER REFERENCES revenue_subheads(id);

CREATE INDEX IF NOT EXISTS idx_transactionskano_revenue_subhead
  ON transactionskano (revenue_subhead_id, paid_at);

-- Backfill what can be determined for certain: Compliance Standing fees by
-- their payment reference, and invoices that came from a bulk assessment.
-- Earlier Other Fees payments can't be classified from a free-text title, so
-- they stay NULL and report as unmapped.
UPDATE transactionskano t
SET revenue_subhead_id = s.id
FROM schoolkano_payments p
JOIN revenue_subheads s ON s.fee_id = p.fee_id
WHERE p.reference = t.reference
  AND t.revenue_subhead_id IS NULL;

UPDATE schoolkano_invoices i
SET revenue_subhead_id = s.id
FROM revenue_subheads s
WHERE s.code = 'EDU_ASSESSMENT'
  AND i.bulk_assessment_id IS NOT NULL
  AND i.revenue_subhead_id IS NULL;

UPDATE transactionskano t
SET revenue_subhead_id = i.revenue_subhead_id
FROM schoolkano_invoices i
WHERE i.invoice_number = t.reference
  AND i.revenue_subhead_id IS NOT NULL
  AND t.revenue_subhead_id IS NULL;

-- ── School details that set the Business Premises rate ──────────────────────
-- location_type is declared by the school and confirmed at approval;
-- premises_category is assigned at approval. Kept apart from schoolskano.tier
-- so moving a school between assessment tiers can't silently change its tax.
ALTER TABLE schoolskano
  ADD COLUMN IF NOT EXISTS location_type      TEXT    CHECK (location_type IN ('urban', 'rural')),
  ADD COLUMN IF NOT EXISTS premises_category  CHAR(1) CHECK (premises_category IN ('A', 'B', 'C'));
