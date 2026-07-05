-- Migrate courses column from text[] to jsonb so each entry can carry
-- { name: string, accredited: boolean } instead of a plain string.
-- Safe to run on a fresh Gombe DB (no existing rows to transform).
-- If the column is already jsonb (from a prior schema dump), the DO block is a no-op.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name  = 'schoolskano'
      AND column_name = 'courses'
      AND data_type   = 'ARRAY'
  ) THEN
    ALTER TABLE schoolskano
      ALTER COLUMN courses TYPE jsonb
      USING to_jsonb(courses);
  END IF;
END $$;
