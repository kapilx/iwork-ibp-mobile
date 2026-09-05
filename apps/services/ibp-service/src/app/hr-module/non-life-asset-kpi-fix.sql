-- =============================================================================
-- non-life-asset-kpi-fix.sql
--
-- Replaces the non_life_asset_kpi query wholesale to fix:
--   1. non-existent column pae.endorsement_sub_asset_count
--   2. syntax error from subquery in FROM (SELECT ###policyId###::INTEGER ...)
--
-- New approach: each CTE aggregates on a single policy_id via WHERE clause
-- and returns exactly one row, so a plain CROSS JOIN replaces the old subquery.
--
-- IDEMPOTENT: WHERE ... AND query LIKE '%endorsement_sub_asset_count%'
--             ensures the UPDATE only fires if the old bad query is still present.
-- =============================================================================

BEGIN;

UPDATE admin_reports
SET query =
'WITH asset_kpi AS (
  SELECT
    COUNT(DISTINCT pam.id)            AS total_assets,
    COALESCE(SUM(pam.sum_insured), 0) AS total_sum_insured,
    COALESCE(SUM(pam.premium), 0)     AS asset_total_premium
  FROM policy_asset_endorsement_map pam
  WHERE pam.policy_id = ###policyId###
    AND (pam.endorsement_deletion_batch_id IS NULL OR pam.endorsement_deletion_batch_id = 0)
),
sub_asset_kpi AS (
  SELECT
    COUNT(DISTINCT psam.id) AS total_sub_assets
  FROM policy_sub_asset_endorsement_map psam
  WHERE psam.policy_id = ###policyId###
    AND (psam.endorsement_deletion_batch_id IS NULL OR psam.endorsement_deletion_batch_id = 0)
),
endorsement_kpi AS (
  SELECT
    COUNT(pae.id)                                 AS total_endorsements,
    COALESCE(SUM(pae.endorsement_asset_count), 0) AS endorsement_asset_count
  FROM policy_asset_endorsement pae
  WHERE pae.policy_id = ###policyId###
)
SELECT
  COALESCE(ak.total_assets, 0)            AS "totalAssets",
  COALESCE(sak.total_sub_assets, 0)       AS "totalSubAssets",
  COALESCE(ak.total_sum_insured, 0)       AS "totalSumInsured",
  COALESCE(ak.asset_total_premium, 0)     AS "assetTotalPremium",
  COALESCE(ek.total_endorsements, 0)      AS "totalEndorsements",
  COALESCE(ek.endorsement_asset_count, 0) AS "endorsementAssetCount"
FROM asset_kpi ak
CROSS JOIN sub_asset_kpi sak
CROSS JOIN endorsement_kpi ek',
    updated_at = NOW()
WHERE name = 'non_life_asset_kpi'
  AND query NOT LIKE '%endorsement_deletion_batch_id = 0%';

-- Verify
SELECT
  name,
  CASE
    WHEN query LIKE '%endorsement_sub_asset_count%' THEN 'STILL BROKEN'
    WHEN query LIKE '%CROSS JOIN%'                  THEN 'OK — fixed query stored'
    ELSE 'CHECK MANUALLY'
  END AS status
FROM admin_reports
WHERE name = 'non_life_asset_kpi';

COMMIT;
