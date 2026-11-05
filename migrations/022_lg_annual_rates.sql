-- Local Government's Tenement Rate, Shop & Kiosk and Directional Signage
-- Permits move from Other Fees onto the Single Demand Notice, with rates set
-- by Operator 2 on the Rates page. They start at 0 until the Ministry gives
-- the amounts; a rate of 0 leaves the item off notices. Local Government
-- Penalty stays in Other Fees.
UPDATE revenue_subheads
SET charge_type = 'annual_fixed'
WHERE code IN ('LG_TENEMENT', 'LG_SHOP_KIOSK', 'LG_DIRECTIONAL');

INSERT INTO revenue_rates (subhead_id, year, amount)
SELECT s.id, 2026, 0
FROM revenue_subheads s
WHERE s.code IN ('LG_TENEMENT', 'LG_SHOP_KIOSK', 'LG_DIRECTIONAL')
  AND NOT EXISTS (SELECT 1 FROM revenue_rates r WHERE r.subhead_id = s.id);
