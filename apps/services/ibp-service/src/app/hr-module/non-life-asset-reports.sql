-- =============================================================================
-- non-life-asset-reports.sql
--
-- 1. Patches dashboard_policy_cards (id=22) to include asset count columns
--    for Non-Life / Commercial Lines policies:
--      "totalAssets", "totalSubAssets", "totalSumInsured", "assetTotalPremium"
--
-- 2. Creates report  non_life_asset_kpi  — per-policy asset KPI summary
--    (total assets, sub-assets, sum insured, premium, endorsement counts)
--
-- 3. Creates report  non_life_asset_list — per-policy asset detail list
--    (one row per active asset with sub-asset count and financial data)
--
-- IDEMPOTENT: all DO blocks skip if already applied.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Patch dashboard_policy_cards (id=22)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE v_q TEXT;
BEGIN
  SELECT query INTO v_q FROM admin_reports WHERE id = 22;
  IF v_q IS NULL THEN RAISE NOTICE 'id=22 not found — skip'; RETURN; END IF;

  IF v_q LIKE '%policy_asset_counts%' THEN
    RAISE NOTICE 'id=22: policy_asset_counts already present — skip';
    RETURN;
  END IF;

  -- Anchor 1: Add two new CTEs after policy_activity GROUP BY clause (last CTE)
  -- Anchor 2: Add totalAssets/totalSubAssets columns at end of SELECT list
  -- Anchor 3: Add LEFT JOINs for the new CTEs before WHERE clause

  UPDATE admin_reports
  SET query = replace(replace(replace(
    query,

    -- Anchor 1: CTE addition — unique: ends with peepm.policy_id before SELECT
    '  GROUP BY peepm.policy_id
)
SELECT',
    '  GROUP BY peepm.policy_id
),
policy_asset_counts AS (
  SELECT
    pam.policy_id,
    COUNT(DISTINCT pam.id)             AS total_assets,
    COALESCE(SUM(pam.sum_insured), 0)  AS total_sum_insured,
    COALESCE(SUM(pam.premium), 0)      AS asset_total_premium
  FROM policy_asset_endorsement_map pam
  INNER JOIN policy p_am ON p_am.id = pam.policy_id
                         AND p_am.company_id = ###companyId###
  WHERE pam.endorsement_deletion_batch_id IS NULL
  GROUP BY pam.policy_id
),
policy_sub_asset_counts AS (
  SELECT
    psam.policy_id,
    COUNT(DISTINCT psam.id) AS total_sub_assets
  FROM policy_sub_asset_endorsement_map psam
  INNER JOIN policy p_sam ON p_sam.id = psam.policy_id
                          AND p_sam.company_id = ###companyId###
  WHERE psam.endorsement_deletion_batch_id IS NULL
  GROUP BY psam.policy_id
)
SELECT'
  ),

  -- Anchor 2: SELECT tail — add new columns before FROM
  '  COALESCE(pa.member_deletions, 0)                                                         AS "memberDeletions"
FROM policy p',
  '  COALESCE(pa.member_deletions, 0)                                                         AS "memberDeletions",
  COALESCE(pac.total_assets, 0)                                                            AS "totalAssets",
  COALESCE(psac.total_sub_assets, 0)                                                       AS "totalSubAssets",
  COALESCE(pac.total_sum_insured, 0)                                                       AS "totalSumInsured",
  COALESCE(pac.asset_total_premium, 0)                                                     AS "assetTotalPremium"
FROM policy p'
  ),

  -- Anchor 3: JOIN addition — after policy_activity join, before WHERE
  'LEFT JOIN policy_activity pa           ON pa.policy_id = p.id
WHERE p.company_id = ###companyId###',
  'LEFT JOIN policy_activity pa           ON pa.policy_id = p.id
LEFT JOIN policy_asset_counts pac      ON pac.policy_id = p.id
LEFT JOIN policy_sub_asset_counts psac ON psac.policy_id = p.id
WHERE p.company_id = ###companyId###'
  ),
  updated_at = NOW()
  WHERE id = 22;

  RAISE NOTICE 'id=22 (dashboard_policy_cards): totalAssets/totalSubAssets columns added';
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Create non_life_asset_kpi report
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE v_id INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_reports WHERE name = 'non_life_asset_kpi') THEN
    INSERT INTO admin_reports (name, label, end_point, query, created_at, updated_at)
    VALUES (
      'non_life_asset_kpi',
      'Non-Life Asset KPI',
      'non_life_asset_kpi',
      'WITH asset_kpi AS (
  SELECT
    pam.policy_id,
    COUNT(DISTINCT pam.id)             AS total_assets,
    COALESCE(SUM(pam.sum_insured), 0)  AS total_sum_insured,
    COALESCE(SUM(pam.premium), 0)      AS asset_total_premium
  FROM policy_asset_endorsement_map pam
  WHERE pam.policy_id = ###policyId###
    AND pam.endorsement_deletion_batch_id IS NULL
  GROUP BY pam.policy_id
),
sub_asset_kpi AS (
  SELECT
    psam.policy_id,
    COUNT(DISTINCT psam.id) AS total_sub_assets
  FROM policy_sub_asset_endorsement_map psam
  WHERE psam.policy_id = ###policyId###
    AND psam.endorsement_deletion_batch_id IS NULL
  GROUP BY psam.policy_id
),
endorsement_kpi AS (
  SELECT
    pae.policy_id,
    COUNT(pae.id)                                          AS total_endorsements,
    COALESCE(SUM(pae.endorsement_asset_count), 0)         AS endorsement_asset_count
  FROM policy_asset_endorsement pae
  WHERE pae.policy_id = ###policyId###
  GROUP BY pae.policy_id
)
SELECT
  COALESCE(ak.total_assets, 0)                     AS "totalAssets",
  COALESCE(sak.total_sub_assets, 0)                AS "totalSubAssets",
  COALESCE(ak.total_sum_insured, 0)                AS "totalSumInsured",
  COALESCE(ak.asset_total_premium, 0)              AS "assetTotalPremium",
  COALESCE(ek.total_endorsements, 0)               AS "totalEndorsements",
  COALESCE(ek.endorsement_asset_count, 0)          AS "endorsementAssetCount"
FROM (SELECT ###policyId###::INTEGER AS policy_id) base
LEFT JOIN asset_kpi ak    ON ak.policy_id = base.policy_id
LEFT JOIN sub_asset_kpi sak ON sak.policy_id = base.policy_id
LEFT JOIN endorsement_kpi ek ON ek.policy_id = base.policy_id',
      NOW(), NOW()
    )
    RETURNING id INTO v_id;

    INSERT INTO admin_reports_parameters
      (admin_report_id, parameter_name, label, data_type, created_at, updated_at, query_parameter, input_field_type, option_type, option, order_no)
    VALUES
      (v_id, 'policyId',  'Policy ID',  'number', NOW(), NOW(), '###policyId###',  'input', 'none', '{}', 1),
      (v_id, 'companyId', 'Company ID', 'number', NOW(), NOW(), '###companyId###', 'input', 'none', '{}', 2);

    RAISE NOTICE 'Created non_life_asset_kpi with id=%', v_id;
  ELSE
    RAISE NOTICE 'non_life_asset_kpi already exists — skip';
  END IF;
END;
$$;

-- Fix: remove endorsement_sub_asset_count if present in an already-inserted report
DO $$
DECLARE v_q TEXT;
BEGIN
  SELECT query INTO v_q FROM admin_reports WHERE name = 'non_life_asset_kpi';
  IF v_q IS NULL THEN RETURN; END IF;
  IF v_q NOT LIKE '%endorsement_sub_asset_count%' THEN
    RAISE NOTICE 'non_life_asset_kpi: endorsement_sub_asset_count not present — skip';
    RETURN;
  END IF;
  UPDATE admin_reports
  SET query = replace(replace(
    query,
    '
    COALESCE(SUM(pae.endorsement_sub_asset_count), 0)     AS endorsement_sub_asset_count',
    ''
  ),
    '
  COALESCE(ek.endorsement_sub_asset_count, 0)      AS "endorsementSubAssetCount"',
    ''
  ),
  updated_at = NOW()
  WHERE name = 'non_life_asset_kpi';
  RAISE NOTICE 'non_life_asset_kpi: endorsement_sub_asset_count column removed';
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Create non_life_asset_list report
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE v_id INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_reports WHERE name = 'non_life_asset_list') THEN
    INSERT INTO admin_reports (name, label, end_point, query, created_at, updated_at)
    VALUES (
      'non_life_asset_list',
      'Non-Life Asset List',
      'non_life_asset_list',
      'SELECT
  pa.id                                          AS "assetId",
  pa.cover_code                                  AS "coverCode",
  pa.risk_location_type                          AS "riskLocationType",
  pa.risk_location_details                       AS "riskLocationDetails",
  pa.category                                    AS "category",
  pa.coverage_type                               AS "coverageType",
  pa.quantity                                    AS "quantity",
  pa.uom                                         AS "uom",
  COALESCE(pam.sum_insured, 0)                   AS "sumInsured",
  COALESCE(pam.premium, 0)                       AS "premium",
  pam.rate                                       AS "rate",
  TO_CHAR(pam.effective_date, ''DD Mon YYYY'')   AS "effectiveDate",
  COUNT(DISTINCT psam.id)                        AS "subAssetCount"
FROM policy_asset_endorsement_map pam
INNER JOIN policy_asset pa ON pa.cover_code = pam.cover_code
LEFT JOIN policy_sub_asset_endorsement_map psam
  ON psam.policy_id = pam.policy_id
  AND psam.cover_code = pam.cover_code
  AND psam.endorsement_deletion_batch_id IS NULL
WHERE pam.policy_id = ###policyId###
  AND pam.endorsement_deletion_batch_id IS NULL
GROUP BY
  pa.id, pa.cover_code, pa.risk_location_type, pa.risk_location_details,
  pa.category, pa.coverage_type, pa.quantity, pa.uom,
  pam.sum_insured, pam.premium, pam.rate, pam.effective_date
ORDER BY pa.cover_code',
      NOW(), NOW()
    )
    RETURNING id INTO v_id;

    INSERT INTO admin_reports_parameters
      (admin_report_id, parameter_name, label, data_type, created_at, updated_at, query_parameter, input_field_type, option_type, option, order_no)
    VALUES
      (v_id, 'policyId', 'Policy ID', 'number', NOW(), NOW(), '###policyId###', 'input', 'none', '{}', 1);

    RAISE NOTICE 'Created non_life_asset_list with id=%', v_id;
  ELSE
    RAISE NOTICE 'non_life_asset_list already exists — skip';
  END IF;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  id,
  name,
  CASE
    WHEN query LIKE '%policy_asset_counts%' THEN 'OK — asset CTEs present'
    ELSE 'NOT PATCHED'
  END AS asset_cte_status
FROM admin_reports WHERE id = 22;

SELECT id, name, end_point
FROM admin_reports
WHERE name IN ('non_life_asset_kpi', 'non_life_asset_list')
ORDER BY name;

COMMIT;
