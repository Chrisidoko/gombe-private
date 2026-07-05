-- Inspector site assessments (structured ratings from field visits)
CREATE TABLE IF NOT EXISTS inspector_assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       VARCHAR        NOT NULL,
  school_name     VARCHAR        NOT NULL,
  inspector_name  VARCHAR        NOT NULL,
  inspector_email VARCHAR        NOT NULL,

  -- Facilities
  lab_workshop_rating  VARCHAR(20) CHECK (lab_workshop_rating  IN ('adequate', 'not_adequate')),
  lab_workshop_note    TEXT,
  library_rating       VARCHAR(20) CHECK (library_rating        IN ('adequate', 'not_adequate')),
  library_note         TEXT,

  -- Staff disposition
  academic_staff_rating     VARCHAR(30) CHECK (academic_staff_rating     IN ('full_complement', 'partial_presence', 'insufficient')),
  academic_staff_note       TEXT,
  non_academic_staff_rating VARCHAR(30) CHECK (non_academic_staff_rating IN ('full_complement', 'partial_presence', 'insufficient')),
  non_academic_staff_note   TEXT,

  visited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspector_assessments_school_id    ON inspector_assessments(school_id);
CREATE INDEX IF NOT EXISTS idx_inspector_assessments_inspector_email ON inspector_assessments(inspector_email);
CREATE INDEX IF NOT EXISTS idx_inspector_assessments_visited_at   ON inspector_assessments(visited_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE inspector_assessments TO gmbprivateuser;
