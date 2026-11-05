-- The payment due date Operator 1 sets on a bulk (Ministry) assessment. It was
-- collected by the form but never stored, so invoices created on approval had
-- no due date. Operator 2's approval copies it onto each school's invoice.
ALTER TABLE schoolkano_bulk_assessments
  ADD COLUMN IF NOT EXISTS due_date DATE;
