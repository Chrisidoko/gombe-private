-- Personal Income Tax is now declared as the year's total income. The platform
-- works out the tax from the bands in src/lib/pitBands.ts and stores it in
-- amount, which Operator 1 and 2 approve as before. PAYE declarations keep
-- declaring the tax amount itself, so declared_income stays empty for them.
ALTER TABLE tax_declarations
  ADD COLUMN IF NOT EXISTS declared_income NUMERIC CHECK (declared_income >= 0);
