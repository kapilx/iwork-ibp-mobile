-- =============================================================================
-- non-life-asset-list-fix.sql
--
-- Fixes non_life_asset_list returning empty results because:
--   1. WHERE pam.endorsement_deletion_batch_id IS NULL  — stored value is 0,
--      not NULL, so the row was filtered out. Fix: IS NULL OR = 0.
--   2. INNER JOIN policy_asset — drops rows when cover_code has no master
--      record. Fix: LEFT JOIN so we always get the map row.
--   3. Same NULL-vs-0 issue on the sub-asset LEFT JOIN filter.
--
-- IDEMPOTENT: only fires when the old IS NULL filter is still present.
-- =============================================================================

BEGIN;

UPDATE admin_reports
SET query =
'SELECT
  pa.id                                        AS "assetId",
  pam.cover_code                               AS "coverCode",
  pa.risk_location_type                        AS "riskLocationType",
  pa.risk_location_details                     AS "riskLocationDetails",
  pa.category                                  AS "category",
  pa.coverage_type                             AS "coverageType",
  pa.quantity                                  AS "quantity",
  pa.uom                                       AS "uom",
  COALESCE(pam.sum_insured, 0)                 AS "sumInsured",
  COALESCE(pam.premium, 0)                     AS "premium",
  pam.rate                                     AS "rate",
  TO_CHAR(pam.effective_date, ''DD Mon YYYY'') AS "effectiveDate",
  COUNT(DISTINCT psam.id)                      AS "subAssetCount"
FROM policy_asset_endorsement_map pam
LEFT JOIN policy_asset pa ON pa.cover_code = pam.cover_code
LEFT JOIN policy_sub_asset_endorsement_map psam
  ON psam.policy_id = pam.policy_id
  AND psam.cover_code = pam.cover_code
  AND (psam.endorsement_deletion_batch_id IS NULL OR psam.endorsement_deletion_batch_id = 0)
WHERE pam.policy_id = ###policyId###
  AND (pam.endorsement_deletion_batch_id IS NULL OR pam.endorsement_deletion_batch_id = 0)
GROUP BY
  pa.id, pam.cover_code, pa.risk_location_type, pa.risk_location_details,
  pa.category, pa.coverage_type, pa.quantity, pa.uom,
  pam.sum_insured, pam.premium, pam.rate, pam.effective_date
ORDER BY pam.cover_code',
    updated_at = NOW()
WHERE name = 'non_life_asset_list'
  AND query NOT LIKE '%endorsement_deletion_batch_id = 0%';

-- Verify
SELECT
  name,
  CASE
    WHEN query LIKE '%endorsement_deletion_batch_id = 0%' THEN 'OK — deletion filter fixed'
    ELSE 'NOT UPDATED — check manually'
  END AS status
FROM admin_reports
WHERE name = 'non_life_asset_list';

COMMIT;
