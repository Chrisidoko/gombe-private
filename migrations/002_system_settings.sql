-- System-wide key/value settings controlled by operators.
-- Each row is one setting; the key is the primary key so upserts are safe.

CREATE TABLE IF NOT EXISTS system_settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT         NOT NULL,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- assessment_window_open: 'true' lets schools file self-assessments,
-- 'false' locks the page with an informational overlay.
-- Starts closed so schools cannot submit before the ministry is ready.
INSERT INTO system_settings (key, value)
VALUES ('assessment_window_open', 'false')
ON CONFLICT (key) DO NOTHING;
