-- =============================================================================
-- hr-module-cd-balance-fixes-v3.sql
-- Version : v3 + policy-filter-v4 (combined)
-- Depends : hr-report-and-user-management-scripts.sql (base inserts)
--           hr-module-dashboard-icr-renewal-ly-fix.sql (v1 — ICR LY fix)
--           hr-module-cd-balance-fixes-v2.sql          (v2 — used_amount + ORDER BY fixes)
-- =============================================================================
-- Changes in this file (cumulative — each re-run is safe)
-- -------------------------------------------------------
-- [v3] CD company_id fix
--   Root cause: all three CD-related CTEs filtered on
--     WHERE cd.company_id = ###companyId###
--   The caution_deposit records for some policies are stored under a different
--   company_id (e.g. parent/group company) than the policy itself.  Fixed by
--   joining through the policy table instead:
--     INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
--                            AND p_cd.company_id = ###companyId###
--
-- [v4] Dynamic Active/Inactive + Life/Non-Life filter
--   Previous issues:
--     • AND p.policy_to >= CURRENT_DATE was hardcoded, making the INACTIVE
--       branch of the policyType filter unreachable.
--     • Life / Non-Life filtering was done entirely client-side.
--
--   Fix: two independent optional params added / extended:
--
--   ###policyStatus###  (new param)
--     ''  or 'ACTIVE'  → p.policy_to >= CURRENT_DATE  (default, same as before)
--     'INACTIVE'       → p.policy_to < CURRENT_DATE
--
--   ###policyType###    (extended — existing param, two new values)
--     ''               → no type filter (all types)
--     'LIFE'           → EXISTS on iirm_policy_type containing 'life'/'health'
--                        but NOT 'non-life'
--     'NON_LIFE'       → EXISTS on iirm_policy_type containing 'non-life'
--     any other value  → ld.lookup_key = ###policyType### (backward-compatible)
--
--   Backward-compatibility guarantee:
--     When policyStatus is not sent (value = ''), query returns active policies
--     only — identical to original behaviour.
--
-- Run order : apply after v2.
-- =============================================================================

BEGIN;

DO $$
DECLARE
  report_id INTEGER;
BEGIN
  SELECT id INTO report_id FROM admin_reports WHERE name = 'dashboard_policy_cards';

  IF report_id IS NULL THEN
    RAISE NOTICE 'dashboard_policy_cards not found — skipping update';
    RETURN;
  END IF;

  UPDATE admin_reports
  SET
    query = $q$
WITH policy_employee_counts AS (
  SELECT
    peepm.policy_id,
    COUNT(DISTINCT peepm.employee_id) AS employee_count
  FROM policy_enrollment_employee_policy_map peepm
  WHERE peepm.deleted_at IS NULL
  GROUP BY peepm.policy_id
),
policy_dependent_counts AS (
  SELECT
    ped.policy_id,
    COUNT(ped.id) AS dependent_count
  FROM policy_enrollment_dependent ped
  WHERE ped.deleted_at IS NULL
  GROUP BY ped.policy_id
),
policy_enrollment_counts AS (
  SELECT
    pee.policy_id,
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED')    AS enrolled_count,
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS') AS in_progress_count,
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED') AS not_started_count
  FROM policy_employee_enrollment pee
  WHERE pee.deleted_at IS NULL
  GROUP BY pee.policy_id
),
policy_claims_cur AS (
  SELECT
    c.policy_id,
    COUNT(c.id)                      AS total_claims,
    COALESCE(SUM(c.claim_amount), 0) AS total_claim_amount
  FROM policy_claim c
  INNER JOIN policy p ON p.id = c.policy_id
  WHERE p.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND c.claim_dt BETWEEN p.policy_from AND LEAST(p.policy_to, CURRENT_DATE)
  GROUP BY c.policy_id
),
prev_policy AS (
  SELECT
    p.id                                                  AS cur_policy_id,
    prev_p.id                                             AS prev_policy_id,
    prev_p.policy_from                                    AS prev_policy_from,
    prev_p.policy_to                                      AS prev_policy_to,
    COALESCE(prev_p.net_premium, 0)                       AS prev_net_premium,
    (LEAST(CURRENT_DATE, p.policy_to) - p.policy_from)   AS elapsed_days
  FROM policy p
  JOIN opportunity opp  ON opp.id = p.opportunity_id
                       AND opp.ref_policy_id IS NOT NULL
  JOIN policy prev_p    ON prev_p.id = opp.ref_policy_id
  WHERE p.company_id = ###companyId###
),
policy_claims_sply AS (
  SELECT
    pp.cur_policy_id                                      AS policy_id,
    COUNT(c.id)                                           AS claim_count_sply,
    COALESCE(SUM(c.claim_amount), 0)                      AS claim_amount_sply,
    pp.prev_net_premium
  FROM prev_policy pp
  LEFT JOIN policy_claim c ON c.policy_id = pp.prev_policy_id
    AND c.deleted_at IS NULL
    AND c.claim_dt BETWEEN pp.prev_policy_from
                       AND LEAST(pp.prev_policy_to,
                                 pp.prev_policy_from + pp.elapsed_days)
  GROUP BY pp.cur_policy_id, pp.prev_net_premium
),
policy_claims_full_yr_ly AS (
  SELECT
    pp.cur_policy_id                                      AS policy_id,
    COALESCE(SUM(c.claim_amount), 0)                      AS claim_amount_full_yr_ly,
    pp.prev_net_premium
  FROM prev_policy pp
  LEFT JOIN policy_claim c ON c.policy_id = pp.prev_policy_id
    AND c.deleted_at IS NULL
    AND c.claim_dt BETWEEN pp.prev_policy_from AND pp.prev_policy_to
  GROUP BY pp.cur_policy_id, pp.prev_net_premium
),
policy_cd AS (
  SELECT
    cdpm.policy_id,
    COALESCE(SUM(cd.balance_amount), 0)   AS available_amount,
    COALESCE(SUM(cdt_agg.used_amount), 0) AS used_amount
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.company_id = ###companyId###
  LEFT JOIN (
    SELECT caution_deposit_id, SUM(transaction_amount) AS used_amount
    FROM caution_deposit_transaction
    WHERE transaction_type = 'DEBIT_TRANSACTION'
    GROUP BY caution_deposit_id
  ) cdt_agg ON cdt_agg.caution_deposit_id = cd.id
  WHERE cd.status in ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
  GROUP BY cdpm.policy_id
),
policy_cd_account AS (
  SELECT DISTINCT ON (cdpm.policy_id)
    cdpm.policy_id,
    cd.cd_account_number
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.company_id = ###companyId###
  WHERE cd.status = 'ACTIVE'
  ORDER BY cdpm.policy_id, cd.id
),
policy_insurer AS (
  SELECT DISTINCT ON (pim.policy_id)
    pim.policy_id,
    i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
),
policy_tpa AS (
  SELECT DISTINCT ON (ptm.policy_id)
    ptm.policy_id,
    t.name AS tpa_name
  FROM policy_tpa_map ptm
  INNER JOIN tpa t ON t.id = ptm.tpa_id
  ORDER BY ptm.policy_id, ptm.id
),
policy_cd_running_balance AS (
  SELECT DISTINCT ON (cdpm.policy_id)
    cdpm.policy_id,
    cdt.cd_balance_amount::numeric AS running_balance
  FROM caution_deposit_transaction cdt
  INNER JOIN caution_deposit cd ON cd.id = cdt.caution_deposit_id
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.company_id = ###companyId###
  WHERE cd.status = 'ACTIVE'
  ORDER BY cdpm.policy_id, cdt.updated_at DESC, cdt.id DESC
),
policy_activity AS (
  SELECT
    peepm.policy_id,
    COUNT(peepm.id) FILTER (
      WHERE peepm.endorsement_addition_batch_id IS NOT NULL
        AND peepm.created_at BETWEEN p.policy_from AND p.policy_to
    ) AS member_additions,
    COUNT(peepm.id) FILTER (
      WHERE peepm.enrollment_deletion_batch_id IS NOT NULL
        AND peepm.updated_at BETWEEN p.policy_from AND p.policy_to
    ) AS member_deletions
  FROM policy_enrollment_employee_policy_map peepm
  INNER JOIN policy p ON p.id = peepm.policy_id
  WHERE peepm.deleted_at IS NULL
    AND p.company_id = ###companyId###
  GROUP BY peepm.policy_id
)
SELECT
  p.id                                                                                     AS "policyId",
  p.policy_name                                                                            AS "policyName",
  ld.lookup_key                                                                            AS "policyTypeKey",
  COALESCE(iirm_ld.lookup_key, '')                                                        AS "iiRmTypeKey",
  p.insurer_policy_number                                                                  AS "policyNumber",
  COALESCE(pi.insurer_name, '—')                                                         AS "insurer",
  COALESCE(pt.tpa_name, '—')                                                             AS "tpaName",
  TO_CHAR(p.policy_from, 'DD Mon YYYY')                                                   AS "periodStart",
  TO_CHAR(p.policy_to,   'DD Mon YYYY')                                                   AS "periodEnd",
  COALESCE(pec.employee_count, 0) + COALESCE(pdc.dependent_count, 0)                     AS "totalLives",
  COALESCE(pec.employee_count, 0)                                                          AS "employeeCount",
  COALESCE(pdc.dependent_count, 0)                                                         AS "dependentCount",
  COALESCE(p.net_premium, 0)                                                               AS "netPremium",
  ROUND(
    COALESCE(p.net_premium, 0)
    * (LEAST(p.policy_to, CURRENT_DATE) - p.policy_from + 1)::numeric
    / NULLIF(p.policy_to - p.policy_from + 1, 0),
    0
  )                                                                                        AS "earnedPremium",
  COALESCE(pcd.available_amount, 0)                                                        AS "cdBalance",
  COALESCE(pcd.used_amount, 0)                                                             AS "cdUsedAmount",
  COALESCE(pcrb.running_balance, pcd.available_amount, 0)                                 AS "cdRunningBalance",
  pca.cd_account_number                                                                    AS "cdAccountNumber",
  COALESCE(pc.total_claims, 0)                                                             AS "totalClaims",
  COALESCE(pc.total_claim_amount, 0)                                                       AS "claimAmount",
  COALESCE(pen.enrolled_count, 0)                                                          AS "enrolledCount",
  ROUND(COALESCE(pen.enrolled_count, 0) * 100.0 / NULLIF(pec.employee_count, 0), 1)       AS "enrolledPercent",
  COALESCE(pen.in_progress_count, 0)                                                       AS "inProgressCount",
  ROUND(COALESCE(pen.in_progress_count, 0) * 100.0 / NULLIF(pec.employee_count, 0), 1)    AS "inProgressPercent",
  COALESCE(pen.not_started_count, 0)                                                       AS "notEnrolledCount",
  ROUND(COALESCE(pen.not_started_count, 0) * 100.0 / NULLIF(pec.employee_count, 0), 1)    AS "notEnrolledPercent",
  ROUND(
    COALESCE(pc.total_claim_amount, 0) * 100.0 / NULLIF(
      COALESCE(p.net_premium, 0)
      * (LEAST(p.policy_to, CURRENT_DATE) - p.policy_from + 1)::numeric
      / NULLIF(p.policy_to - p.policy_from + 1, 0),
      0
    ), 1
  )                                                                                        AS "icrPercent",
  COALESCE(pc.total_claims, 0)                                                             AS "icrClaimCount",
  ROUND(
    COALESCE(pcsply.claim_amount_sply, 0) * 100.0
    / NULLIF(COALESCE(pcsply.prev_net_premium, p.net_premium), 0),
    1
  )                                                                                        AS "icrSamePeriodLYPercent",
  COALESCE(pcsply.claim_amount_sply, 0)                                                    AS "icrSamePeriodLYAmount",
  ROUND(
    COALESCE(pcfly.claim_amount_full_yr_ly, 0) * 100.0
    / NULLIF(COALESCE(pcfly.prev_net_premium, p.net_premium), 0),
    1
  )                                                                                        AS "icrFullYearAvgLY",
  ROUND(
    COALESCE(pc.total_claim_amount, 0) * 100.0 / NULLIF(p.net_premium, 0)
    - COALESCE(pcsply.claim_amount_sply, 0) * 100.0
      / NULLIF(COALESCE(pcsply.prev_net_premium, p.net_premium), 0),
    1
  )                                                                                        AS "icrYoYChangePercent",
  ROUND(
    COALESCE(pc.total_claim_amount, 0)
    * (p.policy_to - p.policy_from + 1)::numeric
    / NULLIF((LEAST(p.policy_to, CURRENT_DATE) - p.policy_from + 1), 0)
    * 100.0 / NULLIF(p.net_premium, 0),
    1
  )                                                                                        AS "icrForecastPercent",
  COALESCE(pa.member_additions, 0)                                                         AS "memberAdditions",
  COALESCE(pa.member_deletions, 0)                                                         AS "memberDeletions"
FROM policy p
INNER JOIN lookup_data ld              ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
LEFT JOIN policy_type_segregation pts  ON pts.policy_type_lid = p.policy_type_lid
LEFT JOIN lookup_data iirm_ld          ON iirm_ld.id = pts.iirm_policy_type_lid AND iirm_ld.deleted_at IS NULL
LEFT JOIN policy_employee_counts pec   ON pec.policy_id = p.id
LEFT JOIN policy_dependent_counts pdc  ON pdc.policy_id = p.id
LEFT JOIN policy_enrollment_counts pen ON pen.policy_id = p.id
LEFT JOIN policy_claims_cur pc         ON pc.policy_id = p.id
LEFT JOIN policy_claims_sply pcsply    ON pcsply.policy_id = p.id
LEFT JOIN policy_claims_full_yr_ly pcfly ON pcfly.policy_id = p.id
LEFT JOIN policy_cd pcd                ON pcd.policy_id = p.id
LEFT JOIN policy_cd_running_balance pcrb ON pcrb.policy_id = p.id
LEFT JOIN policy_cd_account pca        ON pca.policy_id = p.id
LEFT JOIN policy_insurer pi            ON pi.policy_id = p.id
LEFT JOIN policy_tpa pt                ON pt.policy_id = p.id
LEFT JOIN policy_activity pa           ON pa.policy_id = p.id
WHERE p.company_id = ###companyId###
  -- Status filter: '' or 'ACTIVE' → active only (default); 'INACTIVE' → expired only.
  -- COALESCE handles callers that omit policyStatus (backend substitutes NULL) — they
  -- get active-only behaviour, same as the original hardcoded default.
  AND (
    (COALESCE(###policyStatus###, '') IN ('', 'ACTIVE') AND p.policy_to >= CURRENT_DATE)
    OR (###policyStatus### = 'INACTIVE' AND p.policy_to < CURRENT_DATE)
  )
  -- Type filter: '' → all; 'LIFE' → life/health via iirm; 'NON_LIFE' → non-life via iirm;
  -- any other value → specific lookup_key match (backward-compatible)
  AND (
    ###policyType### = ''
    OR (###policyType### = 'LIFE' AND EXISTS (
      SELECT 1
      FROM policy_type_segregation pts2
      INNER JOIN lookup_data il
        ON il.id = pts2.iirm_policy_type_lid
       AND il.deleted_at IS NULL
      WHERE pts2.policy_type_lid = p.policy_type_lid
        AND (lower(il.value) LIKE '%life%' OR lower(il.value) LIKE '%health%')
        AND lower(il.value) NOT LIKE '%non-life%'
    ))
    OR (###policyType### = 'NON_LIFE' AND EXISTS (
      SELECT 1 
      FROM policy_type_segregation pts2
      INNER JOIN lookup_data il
        ON il.id = pts2.iirm_policy_type_lid
       AND il.deleted_at IS NULL
      WHERE pts2.policy_type_lid = p.policy_type_lid
        AND lower(il.value) NOT LIKE '%life%'
        AND lower(il.value) NOT LIKE '%health%'
    ))
    OR (###policyType### NOT IN ('', 'LIFE', 'NON_LIFE') AND ld.lookup_key = ###policyType###)
  )
  AND (###externalHrUserId### IS NULL
       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER))
ORDER BY ld.lookup_key, p.policy_name
$q$,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'SYSTEM'
  WHERE id = report_id;

  -- Register policyStatus parameter (idempotent — safe to re-run)
  INSERT INTO admin_reports_parameters (
    admin_report_id, parameter_name, label, query_parameter, data_type,
    created_by, updated_by, input_field_type, option_type, option, order_no
  ) VALUES (
    report_id, 'policyStatus', 'Policy Status', '###policyStatus###', 'string',
    'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 3
  )
  ON CONFLICT (admin_report_id, parameter_name) DO NOTHING;

  RAISE NOTICE
    'dashboard_policy_cards (id=%): v3+v4 applied — CD CTEs join through policy, dynamic policyStatus + LIFE/NON_LIFE filter.',
    report_id;

END $$;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- [v5] policy_cd_summary — align CD logic with dashboard_policy_cards
-- ─────────────────────────────────────────────────────────────────────────────
-- Problems fixed:
--   1. policy_cd CTE used cd.company_id = ###companyId### (same v3 bug as
--      dashboard_policy_cards) — causes 0 / null CD values for policies whose
--      caution_deposit is stored under a different company_id.
--
--   2. cdRunningBalance was never returned — Policy Details derived
--      cdAvailableAmount from the first cd_transactions row, which is
--      unreliable.
--
-- Fix: mirror the three CD CTEs from dashboard_policy_cards exactly:
--   • policy_cd              — scope through policy INNER JOIN, not cd.company_id
--   • policy_cd_account      — DISTINCT ON for cd_account_number
--   • policy_cd_running_balance — latest cdt.cd_balance_amount per policy
--
-- New fields added to SELECT:
--   • "cdUsedAmount"       (was only "usedAmount"; both names now returned)
--   • "cdRunningBalance"   (COALESCE(running_balance, available_amount, 0))
--   • "cdAccountNumber"    (cd_account_number)
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

DO $$
DECLARE
  report_id INTEGER;
BEGIN
  SELECT id INTO report_id FROM admin_reports WHERE name = 'policy_cd_summary';

  IF report_id IS NULL THEN
    RAISE NOTICE 'policy_cd_summary not found — skipping v5 CD alignment fix';
    RETURN;
  END IF;

  UPDATE admin_reports
  SET
    query = $q$
WITH policy_lives AS (
  SELECT
    peepm.policy_id,
    COUNT(DISTINCT peepm.employee_id)                    AS employee_count,
    (SELECT COUNT(ped.id)
     FROM policy_enrollment_dependent ped
     WHERE ped.policy_id = peepm.policy_id
       AND ped.deleted_at IS NULL)                        AS dependent_count
  FROM policy_enrollment_employee_policy_map peepm
  WHERE peepm.deleted_at IS NULL
    AND peepm.policy_id = ###policyId###
  GROUP BY peepm.policy_id
),
policy_cd AS (
  SELECT
    cdpm.policy_id,
    COALESCE(SUM(cd.balance_amount), 0)   AS available_amount,
    COALESCE(SUM(cdt_agg.used_amount), 0) AS used_amount
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.id = ###policyId###
                         AND p_cd.company_id = ###companyId###
  LEFT JOIN (
    SELECT caution_deposit_id, SUM(transaction_amount) AS used_amount
    FROM caution_deposit_transaction
    WHERE transaction_type = 'DEBIT_TRANSACTION'
    GROUP BY caution_deposit_id
  ) cdt_agg ON cdt_agg.caution_deposit_id = cd.id
  WHERE cd.status IN ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
  GROUP BY cdpm.policy_id
),
policy_cd_account AS (
  SELECT DISTINCT ON (cdpm.policy_id)
    cdpm.policy_id,
    cd.cd_account_number
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.id = ###policyId###
                         AND p_cd.company_id = ###companyId###
  WHERE cd.status = 'ACTIVE'
  ORDER BY cdpm.policy_id, cd.id
),
policy_cd_running_balance AS (
  SELECT DISTINCT ON (cdpm.policy_id)
    cdpm.policy_id,
    cdt.cd_balance_amount::numeric AS running_balance
  FROM caution_deposit_transaction cdt
  INNER JOIN caution_deposit cd ON cd.id = cdt.caution_deposit_id
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id
                         AND p_cd.id = ###policyId###
                         AND p_cd.company_id = ###companyId###
  WHERE cd.status = 'ACTIVE'
  ORDER BY cdpm.policy_id, cdt.updated_at DESC, cdt.id DESC
),
policy_insurer AS (
  SELECT DISTINCT ON (pim.policy_id)
    pim.policy_id,
    i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
)
SELECT
  p.id                                                                                     AS "policyId",
  p.policy_name                                                                            AS "policyName",
  COALESCE(p.net_premium, 0)                                                              AS "netPremium",
  COALESCE(pcd.available_amount, 0)                                                       AS "cdBalance",
  COALESCE(pcd.used_amount, 0)                                                            AS "cdUsedAmount",
  COALESCE(pcd.used_amount, 0)                                                            AS "usedAmount",
  COALESCE(pcrb.running_balance, pcd.available_amount, 0)                                 AS "cdRunningBalance",
  pca.cd_account_number                                                                    AS "cdAccountNumber",
  COALESCE(pl.employee_count, 0) + COALESCE(pl.dependent_count, 0)                       AS "totalLives",
  COALESCE(pl.employee_count, 0)                                                          AS "employeeCount",
  ROUND(COALESCE(p.net_premium, 0) * 0.05, 2)                                            AS "safeLimit",
  ROUND(
    COALESCE(pcd.used_amount, 0) * 100.0
    / NULLIF(COALESCE(pcd.available_amount, 0) + COALESCE(pcd.used_amount, 0), 0),
    1
  )                                                                                        AS "usedPercent",
  COALESCE(pi.insurer_name, '—')                                                         AS "insurer",
  TO_CHAR(p.policy_from, 'DD Mon YYYY')                                                   AS "periodStart",
  TO_CHAR(p.policy_to,   'DD Mon YYYY')                                                   AS "periodEnd"
FROM policy p
LEFT JOIN policy_lives              pl   ON pl.policy_id   = p.id
LEFT JOIN policy_cd                 pcd  ON pcd.policy_id  = p.id
LEFT JOIN policy_cd_running_balance pcrb ON pcrb.policy_id = p.id
LEFT JOIN policy_cd_account         pca  ON pca.policy_id  = p.id
LEFT JOIN policy_insurer            pi   ON pi.policy_id   = p.id
WHERE p.id = ###policyId###
  AND p.company_id = ###companyId###
$q$,
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'SYSTEM'
  WHERE id = report_id;

  RAISE NOTICE
    'policy_cd_summary (id=%): v5 applied — CD CTEs aligned with dashboard_policy_cards, cdRunningBalance + cdUsedAmount + cdAccountNumber added.',
    report_id;

END $$;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify (dashboard_policy_cards)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  CASE
    WHEN query LIKE '%p_cd.company_id = ###companyId###%'
     AND query LIKE '%###policyStatus###%'
     AND query LIKE '%NON_LIFE%'
     AND query LIKE '%LIFE%'
     AND query LIKE '%iirm_policy_type_lid%'
    THEN 'OK — v3+v4 fully applied'
    ELSE 'PATCH DID NOT APPLY — check for errors above'
  END AS patch_status
FROM admin_reports
WHERE name = 'dashboard_policy_cards';

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify (policy_cd_summary)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  CASE
    WHEN query LIKE '%policy_cd_running_balance%'
     AND query LIKE '%cdRunningBalance%'
     AND query LIKE '%cdUsedAmount%'
     AND query LIKE '%cdAccountNumber%'
     AND query LIKE '%p_cd.id = ###policyId###%'
    THEN 'OK — v5 policy_cd_summary aligned'
    ELSE 'PATCH DID NOT APPLY — check for errors above'
  END AS patch_status
FROM admin_reports
WHERE name = 'policy_cd_summary';
