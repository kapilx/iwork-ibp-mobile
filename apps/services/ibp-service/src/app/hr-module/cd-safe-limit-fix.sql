-- cd-safe-limit-fix.sql
-- Patches admin_reports id=22 (dashboard_policy_cards) and id=30 (policy_cd_summary)
-- to use the cd_safe_limit column from the caution_deposit table instead of hardcoded percentages.
--
-- Each DO block:
--   1. Checks whether the patch has already been applied (query LIKE '%cd_safe_limit%').
--   2. If already applied, emits a NOTICE and skips.
--   3. Otherwise applies two replace() calls in a single UPDATE and emits a NOTICE.
--
-- Run:  psql -v ON_ERROR_STOP=1 -f cd-safe-limit-fix.sql

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Report id=22  dashboard_policy_cards
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_query TEXT;
BEGIN
  SELECT query INTO v_query FROM admin_reports WHERE id = 22;

  IF v_query IS NULL THEN
    RAISE NOTICE 'admin_reports id=22 not found — skipping.';
    RETURN;
  END IF;

  IF v_query LIKE '%cd_safe_limit%' THEN
    RAISE NOTICE 'admin_reports id=22 (dashboard_policy_cards): cd_safe_limit already present — skipping.';
    RETURN;
  END IF;

  -- Change A: add MAX(cd.cd_safe_limit) to the policy_cd CTE SELECT list.
  -- Change B: insert the safeLimit column into the outer SELECT after cdAccountNumber.
  UPDATE admin_reports
  SET query = replace(
    replace(
      query,
      -- Change A anchor → replacement
      '    COALESCE(SUM(cd.balance_amount), 0)   AS available_amount,
    COALESCE(SUM(cdt_agg.used_amount), 0) AS used_amount
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.company_id = ###companyId###
  LEFT JOIN (
    SELECT caution_deposit_id, SUM(transaction_amount) AS used_amount
    FROM caution_deposit_transaction
    WHERE transaction_type = ''DEBIT_TRANSACTION''
    GROUP BY caution_deposit_id
  ) cdt_agg ON cdt_agg.caution_deposit_id = cd.id
  WHERE cd.status in (''CD_ACCOUNT_ACTIVE'', ''ACTIVE'')
  GROUP BY cdpm.policy_id',
      '    COALESCE(SUM(cd.balance_amount), 0)   AS available_amount,
    COALESCE(SUM(cdt_agg.used_amount), 0) AS used_amount,
    MAX(cd.cd_safe_limit)                 AS cd_safe_limit
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.company_id = ###companyId###
  LEFT JOIN (
    SELECT caution_deposit_id, SUM(transaction_amount) AS used_amount
    FROM caution_deposit_transaction
    WHERE transaction_type = ''DEBIT_TRANSACTION''
    GROUP BY caution_deposit_id
  ) cdt_agg ON cdt_agg.caution_deposit_id = cd.id
  WHERE cd.status in (''CD_ACCOUNT_ACTIVE'', ''ACTIVE'')
  GROUP BY cdpm.policy_id'
    ),
    -- Change B anchor → replacement
    '  pca.cd_account_number                                                                    AS "cdAccountNumber",
  COALESCE(pc.total_claims, 0)                                                             AS "totalClaims",',
    '  pca.cd_account_number                                                                    AS "cdAccountNumber",
  ROUND(COALESCE(p.net_premium, 0) * COALESCE(pcd.cd_safe_limit, 10) / 100.0, 2)         AS "safeLimit",
  COALESCE(pc.total_claims, 0)                                                             AS "totalClaims",'
  )
  WHERE id = 22;

  RAISE NOTICE 'admin_reports id=22 (dashboard_policy_cards): cd_safe_limit patch applied.';
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Report id=30  policy_cd_summary
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_query TEXT;
BEGIN
  SELECT query INTO v_query FROM admin_reports WHERE id = 30;

  IF v_query IS NULL THEN
    RAISE NOTICE 'admin_reports id=30 not found — skipping.';
    RETURN;
  END IF;

  IF v_query LIKE '%cd_safe_limit%' THEN
    RAISE NOTICE 'admin_reports id=30 (policy_cd_summary): cd_safe_limit already present — skipping.';
    RETURN;
  END IF;

  -- Change A: add MAX(cd.cd_safe_limit) to the policy_cd CTE SELECT list.
  -- Change B: replace the hardcoded 0.05 safeLimit with the dynamic column expression.
  UPDATE admin_reports
  SET query = replace(
    replace(
      query,
      -- Change A anchor → replacement
      '    COALESCE(SUM(cd.balance_amount), 0)   AS available_amount,
    COALESCE(SUM(cdt_agg.used_amount), 0) AS used_amount
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.id = ###policyId###
                         AND p_cd.company_id = ###companyId###
  LEFT JOIN (
    SELECT caution_deposit_id, SUM(transaction_amount) AS used_amount
    FROM caution_deposit_transaction
    WHERE transaction_type = ''DEBIT_TRANSACTION''
    GROUP BY caution_deposit_id
  ) cdt_agg ON cdt_agg.caution_deposit_id = cd.id
  WHERE cd.status IN (''CD_ACCOUNT_ACTIVE'', ''ACTIVE'')
  GROUP BY cdpm.policy_id',
      '    COALESCE(SUM(cd.balance_amount), 0)   AS available_amount,
    COALESCE(SUM(cdt_agg.used_amount), 0) AS used_amount,
    MAX(cd.cd_safe_limit)                 AS cd_safe_limit
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.id = ###policyId###
                         AND p_cd.company_id = ###companyId###
  LEFT JOIN (
    SELECT caution_deposit_id, SUM(transaction_amount) AS used_amount
    FROM caution_deposit_transaction
    WHERE transaction_type = ''DEBIT_TRANSACTION''
    GROUP BY caution_deposit_id
  ) cdt_agg ON cdt_agg.caution_deposit_id = cd.id
  WHERE cd.status IN (''CD_ACCOUNT_ACTIVE'', ''ACTIVE'')
  GROUP BY cdpm.policy_id'
    ),
    -- Change B: replace hardcoded 5% with dynamic cd_safe_limit column
    '  ROUND(COALESCE(p.net_premium, 0) * 0.05, 2)                                            AS "safeLimit",',
    '  ROUND(COALESCE(p.net_premium, 0) * COALESCE(pcd.cd_safe_limit, 10) / 100.0, 2)         AS "safeLimit",'
  )
  WHERE id = 30;

  RAISE NOTICE 'admin_reports id=30 (policy_cd_summary): cd_safe_limit patch applied.';
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY: show the safeLimit expression from both patched reports
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  id,
  name,
  regexp_match(query, 'ROUND\([^\n]+AS "safeLimit"') AS "safeLimit_expr"
FROM admin_reports
WHERE id IN (22, 30)
ORDER BY id;

COMMIT;
