-- Credo's initialize returns its own transaction reference (credoReference/
-- transRef), separate from our own stable bill reference already stored in
-- `reference`/`bill_reference` — verify() needs Credo's reference
-- specifically, so it has to be persisted somewhere between initialize and
-- the return-page verify call. Mirrors payments-gateway's
-- partner_payments.gateway_reference column for the same reason.
ALTER TABLE schoolkano_payments
  ADD COLUMN IF NOT EXISTS credo_reference TEXT;

ALTER TABLE schoolkano_invoices
  ADD COLUMN IF NOT EXISTS credo_reference TEXT;
