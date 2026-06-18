-- Add proprietor NIN and property type to the schools table.
-- proprietor_nin: 11-digit National Identification Number of the proprietor.
-- property_type: describes whether the premises are rented, owned, leased, etc.

ALTER TABLE schoolskano
  ADD COLUMN IF NOT EXISTS proprietor_nin  VARCHAR(11),
  ADD COLUMN IF NOT EXISTS property_type   VARCHAR(50);
