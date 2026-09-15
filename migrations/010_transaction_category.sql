-- Denormalizes the school's category onto transactionskano at payment
-- confirmation time, the same idea already attempted for `lga` (see
-- schoolkano_payments.lga) — except that column is never actually
-- populated anywhere in the codebase, so this is done directly via a
-- schoolskano lookup in the webhook instead of repeating that dead pattern.
--
-- Nullable and additive on purpose: this table is also the ledger a future
-- external-partner payments-gateway service will write into (see
-- ../../gesms and ../PAYMENTS_GATEWAY.md at the Gombe/ project root), and
-- those payers won't have a schoolskano row to derive a category from —
-- their rows simply leave category NULL, same as source/payer_name already
-- do for that case.
ALTER TABLE transactionskano
  ADD COLUMN IF NOT EXISTS category TEXT;
