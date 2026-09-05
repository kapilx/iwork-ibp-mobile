-- ============================================================
-- FILTERED SQL DUMP
-- admin_report IDs: 21-33, 40-57
-- Tables: admin_reports, admin_reports_parameters, admin_reports_results_mappings
-- ============================================================

-- ============================================================
-- TABLE 1: admin_reports
-- ============================================================
-- Ensure unique constraint exists on admin_reports.name (required for ON CONFLICT)
ALTER TABLE admin_reports
ADD CONSTRAINT uk_admin_reports_name UNIQUE (name);


ALTER TABLE admin_reports_parameters
  ADD CONSTRAINT uq_admin_reports_parameters_report_param
  UNIQUE (admin_report_id, parameter_name);

ALTER TABLE admin_reports_results_mappings
  ADD CONSTRAINT uq_admin_reports_results_mappings_report_col
  UNIQUE (admin_report_id, query_parameter_name);



-- id=21
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (21, 'dashboard_premium_summary', 'Dashboard Premium Summary', 'dashboard_premium_summary', '
WITH cur_year AS (
  SELECT
    COALESCE(SUM(p.premium_at_inception), 0) AS inception_premium,
    0::numeric                                AS addition_premium,
    0::numeric                                AS deletion_premium,
    0::numeric                                AS top_up_premium,
    COALESCE(SUM(p.net_premium), 0)           AS total_premium
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyType### = '''' OR ld.lookup_key = ###policyType###)
    AND p.policy_from >= ###policyPeriodStart###::date
    AND p.policy_to   <= ###policyPeriodEnd###::date
),
prev_year AS (
  SELECT
    COALESCE(SUM(p.premium_at_inception), 0) AS inception_premium,
    0::numeric                                AS addition_premium,
    0::numeric                                AS deletion_premium,
    0::numeric                                AS top_up_premium,
    COALESCE(SUM(p.net_premium), 0)           AS total_premium
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyType### = '''' OR ld.lookup_key = ###policyType###)
    AND p.policy_from >= (###policyPeriodStart###::date - INTERVAL ''1 year'')
    AND p.policy_to   <= (###policyPeriodEnd###::date   - INTERVAL ''1 year'')
)
SELECT
  cy.inception_premium                                                                AS "inceptionPremium",
  cy.addition_premium                                                                 AS "additionPremium",
  cy.deletion_premium                                                                 AS "deletionPremium",
  cy.top_up_premium                                                                   AS "topUpPremium",
  cy.total_premium                                                                    AS "totalPremium",
  py.inception_premium                                                                AS "inceptionPremiumPrevYear",
  py.addition_premium                                                                 AS "additionPremiumPrevYear",
  py.deletion_premium                                                                 AS "deletionPremiumPrevYear",
  py.top_up_premium                                                                   AS "topUpPremiumPrevYear",
  py.total_premium                                                                    AS "totalPremiumPrevYear",
  ROUND((cy.total_premium - py.total_premium) * 100.0 / NULLIF(py.total_premium, 0), 1) AS "totalPremiumYoYChangePercent"
FROM cur_year cy
CROSS JOIN prev_year py
    ', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, 20);

-- id=22
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (22, 'dashboard_policy_cards', 'Dashboard Policy Cards', 'dashboard_policy_cards', '
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
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'')    AS enrolled_count,
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS'') AS in_progress_count,
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED'') AS not_started_count
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
policy_claims_sply AS (
  -- Same ELAPSED period shifted back 1 year (not the full LY year)
  SELECT
    c.policy_id,
    COUNT(c.id)                      AS claim_count_sply,
    COALESCE(SUM(c.claim_amount), 0) AS claim_amount_sply
  FROM policy_claim c
  INNER JOIN policy p ON p.id = c.policy_id
  WHERE p.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND c.claim_dt BETWEEN (p.policy_from - INTERVAL ''1 year'')
                       AND (LEAST(CURRENT_DATE, p.policy_to) - INTERVAL ''1 year'')
  GROUP BY c.policy_id
),
policy_claims_full_yr_ly AS (
  -- Full prior-year window: policy_from-1yr to policy_to-1yr
  SELECT
    c.policy_id,
    COALESCE(SUM(c.claim_amount), 0) AS claim_amount_full_yr_ly
  FROM policy_claim c
  INNER JOIN policy p ON p.id = c.policy_id
  WHERE p.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND c.claim_dt BETWEEN (p.policy_from - INTERVAL ''1 year'') AND (p.policy_to - INTERVAL ''1 year'')
  GROUP BY c.policy_id
),
policy_cd AS (
  SELECT
    cdpm.policy_id,
    COALESCE(SUM(cd.balance_amount), 0) AS available_amount,
    COALESCE(SUM(
      CASE WHEN cdt.transaction_type = ''DEBIT'' THEN cdt.transaction_amount ELSE 0 END
    ), 0)                                AS used_amount
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  LEFT JOIN caution_deposit_transaction cdt ON cdt.caution_deposit_id = cd.id
  WHERE cd.company_id = ###companyId###
    AND cd.status = ''ACTIVE''
  GROUP BY cdpm.policy_id
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
  WHERE cd.company_id = ###companyId###
    AND cd.status = ''ACTIVE''
  ORDER BY cdpm.policy_id, cdt.transaction_date DESC, cdt.id DESC
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
  COALESCE(iirm_ld.lookup_key, '''')                                                        AS "iiRmTypeKey",
  p.insurer_policy_number                                                                  AS "policyNumber",
  COALESCE(pi.insurer_name, ''—'')                                                         AS "insurer",
  COALESCE(pt.tpa_name, ''—'')                                                             AS "tpaName",
  TO_CHAR(p.policy_from, ''DD Mon YYYY'')                                                   AS "periodStart",
  TO_CHAR(p.policy_to,   ''DD Mon YYYY'')                                                   AS "periodEnd",
  COALESCE(pec.employee_count, 0) + COALESCE(pdc.dependent_count, 0)                     AS "totalLives",
  COALESCE(pec.employee_count, 0)                                                          AS "employeeCount",
  COALESCE(pdc.dependent_count, 0)                                                         AS "dependentCount",
  COALESCE(p.net_premium, 0)                                                               AS "netPremium",
  -- Earned premium: net_premium pro-rated to elapsed policy days
  ROUND(
    COALESCE(p.net_premium, 0)
    * (LEAST(p.policy_to, CURRENT_DATE) - p.policy_from + 1)::numeric
    / NULLIF(p.policy_to - p.policy_from + 1, 0),
    0
  )                                                                                        AS "earnedPremium",
  COALESCE(pcd.available_amount, 0)                                                        AS "cdBalance",
  COALESCE(pcd.used_amount, 0)                                                             AS "cdUsedAmount",
  COALESCE(pcrb.running_balance, pcd.available_amount, 0) AS "cdRunningBalance",
  COALESCE(pc.total_claims, 0)                                                             AS "totalClaims",
  COALESCE(pc.total_claim_amount, 0)                                                       AS "claimAmount",
  COALESCE(pen.enrolled_count, 0)                                                          AS "enrolledCount",
  ROUND(COALESCE(pen.enrolled_count, 0) * 100.0 / NULLIF(pec.employee_count, 0), 1)       AS "enrolledPercent",
  COALESCE(pen.in_progress_count, 0)                                                       AS "inProgressCount",
  ROUND(COALESCE(pen.in_progress_count, 0) * 100.0 / NULLIF(pec.employee_count, 0), 1)    AS "inProgressPercent",
  GREATEST(COALESCE(pec.employee_count, 0) - COALESCE(pen.enrolled_count, 0) - COALESCE(pen.in_progress_count, 0), 0) AS "notEnrolledCount",
  ROUND(GREATEST(COALESCE(pec.employee_count, 0) - COALESCE(pen.enrolled_count, 0) - COALESCE(pen.in_progress_count, 0), 0) * 100.0 / NULLIF(pec.employee_count, 0), 1) AS "notEnrolledPercent",
  -- icrPercent: claims / earned_premium (not full net_premium)
  ROUND(COALESCE(pc.total_claim_amount, 0) * 100.0 / NULLIF(p.net_premium, 0), 1)        AS "icrPercent",
  COALESCE(pc.total_claims, 0)                                                             AS "icrClaimCount",
  -- icrSamePeriodLYPercent: LY same-elapsed claims / same earned_premium denominator
  ROUND(COALESCE(pcsply.claim_amount_sply, 0) * 100.0 / NULLIF(p.net_premium, 0), 1)     AS "icrSamePeriodLYPercent",
  COALESCE(pcsply.claim_amount_sply, 0)                                                    AS "icrSamePeriodLYAmount",
  -- icrFullYearAvgLY: full prior-year claims / full net_premium (correct: both full year)
  ROUND(COALESCE(pcfly.claim_amount_full_yr_ly, 0) * 100.0 / NULLIF(p.net_premium, 0), 1) AS "icrFullYearAvgLY",
  COALESCE(pcfly.claim_amount_full_yr_ly, 0) AS "icrFullYearAvgLYAmount",
  ROUND(
    COALESCE(pc.total_claim_amount, 0) * 100.0 / NULLIF(p.net_premium, 0)
    - COALESCE(pcsply.claim_amount_sply, 0) * 100.0 / NULLIF(p.net_premium, 0),
    1
  )                                                                                        AS "icrYoYChangePercent",
  -- icrForecastPercent: straight-line annualization from YTD pace (frontend applies trend)
  ROUND(COALESCE(pc.total_claim_amount, 0) * (p.policy_to - p.policy_from + 1)::numeric / NULLIF((LEAST(p.policy_to, CURRENT_DATE) - p.policy_from + 1), 0) * 100.0 / NULLIF(p.net_premium, 0), 1) AS "icrForecastPercent",
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
LEFT JOIN policy_insurer pi            ON pi.policy_id = p.id
LEFT JOIN policy_tpa pt                ON pt.policy_id = p.id
LEFT JOIN policy_activity pa           ON pa.policy_id = p.id
WHERE p.company_id = ###companyId###
  AND (
    ###policyType### = ''''
    OR (###policyType### = ''INACTIVE'' AND p.policy_to < CURRENT_DATE)
    OR (###policyType### != ''INACTIVE'' AND ld.lookup_key = ###policyType###)
  )
ORDER BY ld.lookup_key, p.policy_name
', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 21);

-- id=23
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (23, 'dashboard_claims_analysis_kpi', 'Dashboard Claims Analysis KPI', 'dashboard_claims_analysis_kpi', '
WITH cur_year AS (
  SELECT
    COUNT(c.id)                                                                                         AS total_count,
    COALESCE(SUM(c.claim_amount), 0)                                                                    AS total_amount,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(c.claim_status) IN (''settled'',''paid'')), 0)         AS paid_amount,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) IN (''settled'',''paid''))                      AS paid_count,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(c.claim_status) IN (''outstanding'',''pending'')), 0)  AS pending_amount,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) IN (''outstanding'',''pending''))               AS pending_count
  FROM policy_claim c
  INNER JOIN policy p       ON p.id  = c.policy_id
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE c.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND (###policyType###  = '''' OR ld.lookup_key = ###policyType###)
    AND (###startDate###   = '''' OR c.claim_dt >= ###startDate###::date)
    AND (###endDate###     = '''' OR c.claim_dt <= ###endDate###::date)
    AND (###claimType###   = '''' OR LOWER(COALESCE(c.clm_type,'''')) LIKE ''%''||LOWER(###claimType###)||''%'')
    AND (###claimStatus### = '''' OR LOWER(c.claim_status) = LOWER(###claimStatus###))
    AND (###memberType###  = ''''
         OR (LOWER(###memberType###)=''employee''  AND c.dependent_id IS NULL)
         OR (LOWER(###memberType###)=''dependent'' AND c.dependent_id IS NOT NULL))
),
prev_year AS (
  SELECT
    COUNT(c.id)                                                                                         AS total_count,
    COALESCE(SUM(c.claim_amount), 0)                                                                    AS total_amount,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(c.claim_status) IN (''settled'',''paid'')), 0)         AS paid_amount,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) IN (''settled'',''paid''))                      AS paid_count,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(c.claim_status) IN (''outstanding'',''pending'')), 0)  AS pending_amount,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) IN (''outstanding'',''pending''))               AS pending_count
  FROM policy_claim c
  INNER JOIN policy p       ON p.id  = c.policy_id
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE c.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND (###policyType###  = '''' OR ld.lookup_key = ###policyType###)
    AND (###startDate###   = '''' OR c.claim_dt >= (###startDate###::date - INTERVAL ''1 year''))
    AND (###endDate###     = '''' OR c.claim_dt <= (###endDate###::date   - INTERVAL ''1 year''))
    AND (###claimType###   = '''' OR LOWER(COALESCE(c.clm_type,'''')) LIKE ''%''||LOWER(###claimType###)||''%'')
    AND (###claimStatus### = '''' OR LOWER(c.claim_status) = LOWER(###claimStatus###))
    AND (###memberType###  = ''''
         OR (LOWER(###memberType###)=''employee''  AND c.dependent_id IS NULL)
         OR (LOWER(###memberType###)=''dependent'' AND c.dependent_id IS NOT NULL))
),
net_premium_agg AS (
  SELECT COALESCE(SUM(p.net_premium), 0) AS total_net_premium
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyType### = '''' OR ld.lookup_key = ###policyType###)
)
SELECT
  cy.total_count                                                                         AS "totalClaimsCount",
  cy.total_amount                                                                        AS "totalClaimsAmount",
  cy.paid_amount                                                                         AS "paidClaimsAmount",
  cy.paid_count                                                                          AS "paidClaimsCount",
  cy.pending_amount                                                                      AS "pendingClaimsAmount",
  cy.pending_count                                                                       AS "pendingClaimsCount",
  ROUND(cy.paid_amount * 100.0 / NULLIF(np.total_net_premium, 0), 1)                   AS "claimRatioPercent",
  py.total_count                                                                         AS "totalClaimsCountPrevYear",
  py.total_amount                                                                        AS "totalClaimsAmountPrevYear",
  py.paid_amount                                                                         AS "paidClaimsAmountPrevYear",
  py.paid_count                                                                          AS "paidClaimsCountPrevYear",
  py.pending_amount                                                                      AS "pendingClaimsAmountPrevYear",
  py.pending_count                                                                       AS "pendingClaimsCountPrevYear",
  ROUND(py.paid_amount * 100.0 / NULLIF(np.total_net_premium, 0), 1)                   AS "claimRatioPercentPrevYear",
  ROUND((cy.total_amount   - py.total_amount)   * 100.0 / NULLIF(py.total_amount,  0), 1) AS "totalClaimsAmountYoYChangePercent",
  ROUND((cy.paid_amount    - py.paid_amount)    * 100.0 / NULLIF(py.paid_amount,   0), 1) AS "paidClaimsAmountYoYChangePercent",
  ROUND((cy.pending_amount - py.pending_amount) * 100.0 / NULLIF(py.pending_amount,0), 1) AS "pendingClaimsAmountYoYChangePercent"
FROM cur_year cy
CROSS JOIN prev_year py
CROSS JOIN net_premium_agg np
    ', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 22);

-- id=24
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (24, 'dashboard_claims_monthly_trend', 'Dashboard Claims Monthly Trend', 'dashboard_claims_monthly_trend', '
WITH policy_window AS (
  SELECT id, company_id, policy_from, policy_to
  FROM policy
  WHERE id = ###policyId###
),
date_spine AS (
  SELECT generate_series(
    date_trunc(''month'', pw.policy_from),
    date_trunc(''month'', pw.policy_to),
    INTERVAL ''1 month''
  ) AS month_start
  FROM policy_window pw
),
monthly_cur AS (
  SELECT
    date_trunc(''month'', c.claim_dt) AS claim_month,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type,''''))=''cashless''), 0)       AS cashless_amount,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type,''''))=''reimbursement''), 0)  AS reimbursement_amount,
    COUNT(c.id) FILTER (WHERE LOWER(COALESCE(c.clm_type,''''))=''cashless'')                            AS cashless_count,
    COUNT(c.id) FILTER (WHERE LOWER(COALESCE(c.clm_type,''''))=''reimbursement'')                       AS reimbursement_count
  FROM policy_claim c
  INNER JOIN policy_window pw ON pw.id = c.policy_id
  WHERE c.deleted_at IS NULL
    AND c.claim_dt BETWEEN pw.policy_from AND pw.policy_to
  GROUP BY date_trunc(''month'', c.claim_dt)
),
monthly_prev AS (
  SELECT
    date_trunc(''month'', c.claim_dt) + INTERVAL ''1 year'' AS claim_month,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type,''''))=''cashless''), 0)       AS cashless_amount_prev_year,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(COALESCE(c.clm_type,''''))=''reimbursement''), 0)  AS reimbursement_amount_prev_year,
    COUNT(c.id) FILTER (WHERE LOWER(COALESCE(c.clm_type,''''))=''cashless'')                            AS cashless_count_prev_year,
    COUNT(c.id) FILTER (WHERE LOWER(COALESCE(c.clm_type,''''))=''reimbursement'')                       AS reimbursement_count_prev_year
  FROM policy_claim c
  INNER JOIN policy_window pw ON pw.id = c.policy_id
  WHERE c.deleted_at IS NULL
    AND c.claim_dt BETWEEN (pw.policy_from - INTERVAL ''1 year'') AND (pw.policy_to - INTERVAL ''1 year'')
  GROUP BY date_trunc(''month'', c.claim_dt)
)
SELECT
  TO_CHAR(ds.month_start, ''Mon ''''YY'')                    AS "month",
  ds.month_start                                          AS "monthStart",
  COALESCE(mc.cashless_amount, 0)                        AS "cashlessAmount",
  COALESCE(mc.reimbursement_amount, 0)                   AS "reimbursementAmount",
  COALESCE(mc.cashless_count, 0)                         AS "cashlessCount",
  COALESCE(mc.reimbursement_count, 0)                    AS "reimbursementCount",
  COALESCE(mp.cashless_amount_prev_year, 0)              AS "cashlessAmountPrevYear",
  COALESCE(mp.reimbursement_amount_prev_year, 0)         AS "reimbursementAmountPrevYear",
  COALESCE(mp.cashless_count_prev_year, 0)               AS "cashlessCountPrevYear",
  COALESCE(mp.reimbursement_count_prev_year, 0)          AS "reimbursementCountPrevYear"
FROM date_spine ds
LEFT JOIN monthly_cur  mc ON DATE(mc.claim_month) = DATE(ds.month_start)
LEFT JOIN monthly_prev mp ON DATE(mp.claim_month) = DATE(ds.month_start)
ORDER BY ds.month_start
  ', '2026-05-08 12:03:43.680983', '2026-05-08 12:03:43.680983', NULL, 'SYSTEM', 'SYSTEM', NULL, 23);

-- id=25
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (25, 'dashboard_enrollment_status', 'Dashboard Enrollment Status', 'dashboard_enrollment_status', '
WITH policy_scope AS (
  SELECT p.id AS policy_id
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyType### = '''' OR ld.lookup_key = ###policyType###)
),
employee_scope AS (
  SELECT DISTINCT peepm.employee_id, pee.user_id
  FROM policy_enrollment_employee_policy_map peepm
  INNER JOIN policy_scope ps ON ps.policy_id = peepm.policy_id
  INNER JOIN policy_enrollment_employee pee ON pee.id = peepm.employee_id
  WHERE peepm.deleted_at IS NULL AND pee.deleted_at IS NULL
),
total_scope AS (SELECT COUNT(*) AS total_employees FROM employee_scope),
latest_login AS (
  SELECT ual.user_id, MAX(ual.action_date) AS last_login_at
  FROM user_activity_log ual
  WHERE ual.activity_key = ''LOGGED_IN'' AND ual.activity_category = ''AUTH'' AND ual.deleted_at IS NULL
  GROUP BY ual.user_id
),
latest_enrollment AS (
  SELECT DISTINCT ON (pee.employee_id)
    pee.employee_id, pee.employee_enrollment_status_key
  FROM policy_employee_enrollment pee
  INNER JOIN policy_scope ps ON ps.policy_id = pee.policy_id
  WHERE pee.deleted_at IS NULL
  ORDER BY pee.employee_id, pee.updated_at DESC, pee.id DESC
),
login_counts AS (
  SELECT
    COUNT(DISTINCT es.employee_id) FILTER (WHERE ll.last_login_at IS NOT NULL) AS logged_in,
    COUNT(DISTINCT es.employee_id) FILTER (WHERE ll.last_login_at IS NULL)     AS not_logged_in
  FROM employee_scope es
  LEFT JOIN latest_login ll ON ll.user_id = es.user_id
),
enrollment_confirmed AS (
  SELECT COUNT(DISTINCT le.employee_id) AS confirmed
  FROM latest_enrollment le
  WHERE le.employee_enrollment_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED''
)
SELECT
  ts.total_employees                                                       AS "totalEligible",
  lc.logged_in                                                             AS "loggedIn",
  lc.not_logged_in                                                         AS "notLoggedIn",
  ec.confirmed                                                             AS "enrollmentConfirmed",
  ROUND(lc.logged_in      * 100.0 / NULLIF(ts.total_employees, 0), 1)    AS "loggedInPercent",
  ROUND(lc.not_logged_in  * 100.0 / NULLIF(ts.total_employees, 0), 1)    AS "notLoggedInPercent",
  ROUND(ec.confirmed      * 100.0 / NULLIF(ts.total_employees, 0), 1)    AS "enrollmentConfirmedPercent"
FROM total_scope ts
CROSS JOIN login_counts lc
CROSS JOIN enrollment_confirmed ec
    ', '2026-05-08 12:04:03.096693', '2026-05-08 12:04:03.096693', NULL, 'SYSTEM', 'SYSTEM', NULL, 24);

-- id=26
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (26, 'dashboard_demographics', 'Dashboard Demographics', 'dashboard_demographics', '
WITH policy_scope AS (
  SELECT p.id AS policy_id
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyType### = '''' OR ld.lookup_key = ###policyType###)
),
employee_scope AS (
  SELECT
    emp.employee_id,
    MAX(CASE WHEN emp.enrollment_addition_batch_id  IS NOT NULL THEN 1 ELSE 0 END) AS has_inception_add,
    MAX(CASE WHEN emp.endorsement_addition_batch_id IS NOT NULL THEN 1 ELSE 0 END) AS has_endorse_add,
    MAX(CASE WHEN emp.enrollment_deletion_batch_id  IS NOT NULL THEN 1 ELSE 0 END) AS has_deletion,
    MAX(CASE WHEN emp.endorsement_addition_batch_id IS NOT NULL
              AND emp.created_at BETWEEN ###policyPeriodStart###::date AND ###policyPeriodEnd###::date
             THEN 1 ELSE 0 END) AS has_period_add,
    MAX(CASE WHEN emp.enrollment_deletion_batch_id IS NOT NULL
              AND emp.updated_at BETWEEN ###policyPeriodStart###::date AND ###policyPeriodEnd###::date
             THEN 1 ELSE 0 END) AS has_period_del
  FROM policy_enrollment_employee_policy_map emp
  INNER JOIN policy_scope ps ON ps.policy_id = emp.policy_id
  WHERE emp.deleted_at IS NULL
  GROUP BY emp.employee_id
),
dependent_scope AS (
  SELECT
    dep.id AS dependent_id,
    MAX(CASE WHEN dep.enrollment_addition_batch_id  IS NOT NULL THEN 1 ELSE 0 END) AS has_inception_add,
    MAX(CASE WHEN dep.endorsement_addition_batch_id IS NOT NULL THEN 1 ELSE 0 END) AS has_endorse_add,
    MAX(CASE WHEN dep.enrollment_deletion_batch_id  IS NOT NULL THEN 1 ELSE 0 END) AS has_deletion,
    MAX(CASE WHEN dep.endorsement_addition_batch_id IS NOT NULL
              AND dep.created_at BETWEEN ###policyPeriodStart###::date AND ###policyPeriodEnd###::date
             THEN 1 ELSE 0 END) AS has_period_add,
    MAX(CASE WHEN dep.enrollment_deletion_batch_id IS NOT NULL
              AND dep.updated_at BETWEEN ###policyPeriodStart###::date AND ###policyPeriodEnd###::date
             THEN 1 ELSE 0 END) AS has_period_del
  FROM policy_enrollment_dependent dep
  INNER JOIN policy_scope ps ON ps.policy_id = dep.policy_id
  WHERE dep.deleted_at IS NULL
  GROUP BY dep.id
),
emp_counts AS (
  SELECT
    COUNT(*) FILTER (WHERE has_inception_add=0 AND has_deletion=0) AS inception_emp,
    COUNT(*) FILTER (WHERE has_period_add=1)                        AS addition_emp,
    COUNT(*) FILTER (WHERE has_period_del=1)                        AS deletion_emp,
    COUNT(*) FILTER (WHERE has_deletion=0)                          AS active_emp
  FROM employee_scope
),
dep_counts AS (
  SELECT
    COUNT(*) FILTER (WHERE has_inception_add=0 AND has_deletion=0) AS inception_dep,
    COUNT(*) FILTER (WHERE has_period_add=1)                        AS addition_dep,
    COUNT(*) FILTER (WHERE has_period_del=1)                        AS deletion_dep,
    COUNT(*) FILTER (WHERE has_deletion=0)                          AS active_dep
  FROM dependent_scope
)
SELECT
  ec.inception_emp + dc.inception_dep AS "inceptionMembersTotal",
  ec.inception_emp                    AS "inceptionEmployees",
  dc.inception_dep                    AS "inceptionDependents",
  ec.addition_emp  + dc.addition_dep  AS "newAdditionsTotal",
  ec.addition_emp                     AS "newAdditionsEmployees",
  dc.addition_dep                     AS "newAdditionsDependents",
  ec.deletion_emp  + dc.deletion_dep  AS "deletionsTotal",
  ec.deletion_emp                     AS "deletionsEmployees",
  dc.deletion_dep                     AS "deletionsDependents",
  ec.active_emp    + dc.active_dep    AS "totalActiveMembers",
  ec.active_emp                       AS "totalActiveEmployees",
  dc.active_dep                       AS "totalActiveDependents"
FROM emp_counts ec
CROSS JOIN dep_counts dc
    ', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, 25);

-- id=27
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (27, 'dashboard_top10_employees', 'Dashboard Top 10 Employees by Claims', 'dashboard_top10_employees', '
WITH cur_year AS (
  SELECT
    pee.id                                                                    AS employee_id,
    pee.company_employee_id                                                   AS employee_code,
    COALESCE(pee.full_name, pee.employee_name, ''—'')                         AS employee_name,
    COALESCE(pee.designation, ''—'')                                          AS department,
    COUNT(c.id)                                                               AS total_claims,
    COALESCE(SUM(c.claim_amount), 0)                                         AS total_amount,
    RANK() OVER (ORDER BY COALESCE(SUM(c.claim_amount),0) DESC)              AS cur_rank
  FROM policy_claim c
  INNER JOIN policy_enrollment_employee pee ON pee.id = c.employee_id AND pee.deleted_at IS NULL
  INNER JOIN policy p       ON p.id  = c.policy_id
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE c.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND (###policyType###  = '''' OR ld.lookup_key = ###policyType###)
    AND c.claim_dt BETWEEN ###policyPeriodStart###::date AND ###policyPeriodEnd###::date
    AND (###claimType###   = '''' OR LOWER(COALESCE(c.clm_type,'''')) LIKE ''%''||LOWER(###claimType###)||''%'')
    AND (###claimStatus### = '''' OR LOWER(c.claim_status) = LOWER(###claimStatus###))
    AND (###memberType###  = ''''
         OR (LOWER(###memberType###)=''employee''  AND c.dependent_id IS NULL)
         OR (LOWER(###memberType###)=''dependent'' AND c.dependent_id IS NOT NULL))
  GROUP BY pee.id, pee.company_employee_id, pee.full_name, pee.employee_name, pee.designation
  ORDER BY total_amount DESC
  LIMIT 10
),
prev_year_ranked AS (
  SELECT
    c.employee_id,
    COALESCE(SUM(c.claim_amount), 0)                    AS total_amount_py,
    RANK() OVER (ORDER BY COALESCE(SUM(c.claim_amount),0) DESC) AS prev_rank
  FROM policy_claim c
  INNER JOIN policy p       ON p.id  = c.policy_id
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE c.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND (###policyType### = '''' OR ld.lookup_key = ###policyType###)
    AND c.claim_dt BETWEEN (###policyPeriodStart###::date - INTERVAL ''1 year'')
                       AND (###policyPeriodEnd###::date   - INTERVAL ''1 year'')
  GROUP BY c.employee_id
)
SELECT
  cy.employee_id                                                                       AS "employeeId",
  cy.employee_code                                                                     AS "employeeCode",
  cy.employee_name                                                                     AS "employeeName",
  cy.department                                                                        AS "department",
  cy.total_claims                                                                      AS "totalClaims",
  cy.total_amount                                                                      AS "totalAmount",
  COALESCE(py.total_amount_py, 0)                                                     AS "totalAmountPrevYear",
  py.prev_rank                                                                         AS "rankPrevYear",
  CASE WHEN py.prev_rank IS NULL THEN NULL ELSE py.prev_rank - cy.cur_rank END        AS "rankChange",
  ROUND((cy.total_amount - COALESCE(py.total_amount_py,0)) * 100.0 / NULLIF(py.total_amount_py,0), 1) AS "yoYChangePercent"
FROM cur_year cy
LEFT JOIN prev_year_ranked py ON py.employee_id = cy.employee_id
ORDER BY cy.total_amount DESC
    ', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, 26);

-- id=28
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (28, 'dashboard_top10_hospitals', 'Dashboard Top 10 Hospitals by Claims', 'dashboard_top10_hospitals', '
WITH policy_window AS (
  SELECT id, policy_from, policy_to FROM policy WHERE id = ###policyId###
),
cur_year_base AS (
  SELECT
    COALESCE(h.id::text, ''ext-''||MD5(COALESCE(c.clm_hospital::text,''unknown''))) AS hospital_key,
    COALESCE(h.name, c.clm_hospital::text, ''Unknown'')                            AS hospital_name,
    COALESCE(a.city_name, ''—'')                                                  AS city,
    COUNT(c.id)                      AS total_claims,
    COALESCE(SUM(c.claim_amount), 0) AS total_amount
  FROM policy_claim c
  INNER JOIN policy_window p ON p.id = c.policy_id
  LEFT JOIN mstr_hospital h         ON h.id = c.hospital_id AND h.deleted_at IS NULL
  LEFT JOIN mstr_hospital_address a ON a.id = h.address_id  AND a.deleted_at IS NULL
  WHERE c.deleted_at IS NULL
  GROUP BY
    COALESCE(h.id::text, ''ext-''||MD5(COALESCE(c.clm_hospital::text,''unknown''))),
    COALESCE(h.name, c.clm_hospital::text, ''Unknown''),
    COALESCE(a.city_name, ''—'')
),
cur_year AS (
  SELECT hospital_key, hospital_name, city, total_claims, total_amount,
         RANK() OVER (ORDER BY total_amount DESC) AS cur_rank
  FROM cur_year_base
),
prev_year_ranked AS (
  SELECT
    COALESCE(c.hospital_id::text, ''ext-''||MD5(COALESCE(c.clm_hospital::text,''unknown''))) AS hospital_key,
    COALESCE(SUM(c.claim_amount), 0) AS total_amount_py,
    RANK() OVER (ORDER BY COALESCE(SUM(c.claim_amount),0) DESC) AS prev_rank
  FROM policy_claim c
  INNER JOIN policy_window p ON p.id = c.policy_id
  WHERE c.deleted_at IS NULL
  GROUP BY COALESCE(c.hospital_id::text, ''ext-''||MD5(COALESCE(c.clm_hospital::text,''unknown'')))
)
SELECT
  cy.hospital_key                                                                    AS "hospitalId",
  cy.hospital_name                                                                   AS "hospitalName",
  cy.city                                                                            AS "city",
  cy.total_claims                                                                    AS "totalClaims",
  cy.total_amount                                                                    AS "totalAmount",
  COALESCE(py.total_amount_py, 0)                                                   AS "totalAmountPrevYear",
  py.prev_rank                                                                       AS "rankPrevYear",
  CASE WHEN py.prev_rank IS NULL THEN NULL ELSE py.prev_rank - cy.cur_rank END      AS "rankChange",
  ROUND((cy.total_amount - COALESCE(py.total_amount_py,0)) * 100.0 / NULLIF(py.total_amount_py,0), 1) AS "yoYChangePercent"
FROM cur_year cy
LEFT JOIN prev_year_ranked py ON py.hospital_key = cy.hospital_key
ORDER BY cy.total_amount DESC
    ', '2026-05-08 12:05:08.299731', '2026-05-08 12:05:08.299731', NULL, 'SYSTEM', 'SYSTEM', NULL, 27);

-- id=29
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (29, 'dashboard_top10_diseases', 'Dashboard Top 10 Diseases by Claims', 'dashboard_top10_diseases', '
WITH policy_window AS (
  SELECT id, policy_from, policy_to FROM policy WHERE id = ###policyId###
),
cur_year_base AS (
  SELECT
    INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text),''''),''Unclassified''))) AS disease_category,
    COUNT(c.id)                      AS total_claims,
    COALESCE(SUM(c.claim_amount), 0) AS total_amount
  FROM policy_claim c
  INNER JOIN policy_window p ON p.id = c.policy_id
  WHERE c.deleted_at IS NULL
  GROUP BY INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text),''''),''Unclassified'')))
),
cur_year AS (
  SELECT disease_category, total_claims, total_amount,
         RANK() OVER (ORDER BY total_amount DESC) AS cur_rank
  FROM cur_year_base
),
prev_year_ranked AS (
  SELECT
    INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text),''''),''Unclassified''))) AS disease_category,
    COALESCE(SUM(c.claim_amount), 0) AS total_amount_py,
    RANK() OVER (ORDER BY COALESCE(SUM(c.claim_amount),0) DESC) AS prev_rank
  FROM policy_claim c
  INNER JOIN policy_window p ON p.id = c.policy_id
  WHERE c.deleted_at IS NULL
  GROUP BY INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text),''''),''Unclassified'')))
)
SELECT
  cy.disease_category                                                                   AS "diseaseCategory",
  cy.total_claims                                                                       AS "totalClaims",
  cy.total_amount                                                                       AS "totalAmount",
  COALESCE(py.total_amount_py, 0)                                                      AS "totalAmountPrevYear",
  py.prev_rank                                                                          AS "rankPrevYear",
  CASE WHEN py.prev_rank IS NULL THEN NULL ELSE py.prev_rank - cy.cur_rank END         AS "rankChange",
  ROUND((cy.total_amount - COALESCE(py.total_amount_py,0)) * 100.0 / NULLIF(py.total_amount_py,0), 1) AS "yoYChangePercent"
FROM cur_year cy
LEFT JOIN prev_year_ranked py ON py.disease_category = cy.disease_category
ORDER BY cy.total_amount DESC
    ', '2026-05-08 12:05:23.976083', '2026-05-08 12:05:23.976083', NULL, 'SYSTEM', 'SYSTEM', NULL, 28);

-- id=30
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (30, 'policy_cd_summary', 'Policy CD Summary', 'policy_cd_summary', '
WITH policy_cd AS (
  SELECT
    cdpm.policy_id,
    COALESCE(SUM(cd.balance_amount), 0)   AS available_amount,
    COALESCE(SUM(cdt_agg.used_amount), 0) AS used_amount
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  LEFT JOIN (
    SELECT caution_deposit_id, SUM(transaction_amount) AS used_amount
    FROM caution_deposit_transaction
    WHERE transaction_type = ''DEBIT_TRANSACTION''
    GROUP BY caution_deposit_id
  ) cdt_agg ON cdt_agg.caution_deposit_id = cd.id
  WHERE cd.company_id = ###companyId### AND cd.status = ''ACTIVE''
  GROUP BY cdpm.policy_id
),
policy_insurer AS (
  SELECT DISTINCT ON (pim.policy_id) pim.policy_id, i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
)
SELECT
  p.id                                                                          AS "policyId",
  p.policy_name                                                                 AS "policyName",
  COALESCE(p.net_premium, 0)                                                   AS "netPremium",
  COALESCE(pcd.available_amount, 0)                                            AS "cdBalance",
  ROUND(COALESCE(p.net_premium, 0) * 0.05, 2)                                 AS "safeLimit",
  ROUND(
    COALESCE(pcd.used_amount, 0) * 100.0
    / NULLIF(COALESCE(pcd.available_amount,0) + COALESCE(pcd.used_amount,0), 0),
    1
  )                                                                             AS "usedPercent",
  COALESCE(pcd.used_amount, 0)                                                 AS "usedAmount",
  COALESCE(pi.insurer_name, ''—'')                                              AS "insurer",
  TO_CHAR(p.policy_from, ''DD Mon YYYY'')                                        AS "periodStart",
  TO_CHAR(p.policy_to,   ''DD Mon YYYY'')                                        AS "periodEnd"
FROM policy p
LEFT JOIN policy_cd      pcd ON pcd.policy_id = p.id
LEFT JOIN policy_insurer pi  ON pi.policy_id  = p.id
WHERE p.id = ###policyId### AND p.company_id = ###companyId###
    ', '2026-05-08 12:05:38.20827', '2026-05-08 12:05:38.20827', NULL, 'SYSTEM', 'SYSTEM', NULL, 29);

-- id=31
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (31, 'policy_claim_history', 'Policy Claim History', 'policy_claim_history', '
WITH latest_settlement AS (
  SELECT DISTINCT ON (pcs.claim_id)
    pcs.claim_id,
    pcs.clm_sett_amt  AS settled_amount,
    pcs.clm_sett_date AS settlement_date
  FROM policy_claim_settlement pcs
  ORDER BY pcs.claim_id, pcs.clm_sett_date DESC NULLS LAST, pcs.id DESC
)
SELECT
  c.id                                                                          AS "claimId",
  COALESCE(c.claim_number, c.id::text)                                          AS "claimNumber",
  COALESCE(pee.full_name, pee.employee_name, ''—'')                               AS "patientName",
  CASE
    WHEN c.dependent_id IS NULL THEN ''Self''
    ELSE COALESCE(ped.relation, ''Dependent'')
  END                                                                           AS "relation",
  COALESCE(mh.name, c.clm_hospital, ''—'')                                        AS "hospital",
  c.claim_dt                                                                    AS "claimDate",
  INITCAP(COALESCE(c.clm_type, ''—''))                                            AS "claimType",
  c.claim_amount                                                                AS "claimedAmount",
  COALESCE(ls.settled_amount, 0)                                                AS "approvedAmount",
  ls.settlement_date                                                            AS "settlementDate",
  INITCAP(COALESCE(c.claim_status, ''pending''))                                  AS "status"
FROM policy_claim c
INNER JOIN policy p
  ON p.id = c.policy_id
LEFT JOIN policy_enrollment_employee pee
  ON pee.id = c.employee_id
 AND pee.deleted_at IS NULL
LEFT JOIN policy_enrollment_dependent ped
  ON ped.id = c.dependent_id
 AND ped.deleted_at IS NULL
LEFT JOIN mstr_hospital mh
  ON mh.id = c.hospital_id
 AND mh.deleted_at IS NULL
LEFT JOIN latest_settlement ls
  ON ls.claim_id = c.id
WHERE c.policy_id = ###policyId###
  AND (
    ###claimStatus### = ''''
    OR LOWER(c.claim_status) = LOWER(###claimStatus###)
  )
  AND (
    ###claimType### = ''''
    OR LOWER(COALESCE(c.clm_type, ''''))
       LIKE ''%'' || LOWER(###claimType###) || ''%''
  )
  AND (
    NULLIF(###startYear###, '''') IS NULL
    OR EXTRACT(YEAR FROM c.claim_dt)::int >= NULLIF(###startYear###, '''')::int
  )
  AND (
    NULLIF(###endYear###, '''') IS NULL
    OR EXTRACT(YEAR FROM c.claim_dt)::int <= NULLIF(###endYear###, '''')::int
  )
  AND (
    ###search### = ''''
    OR COALESCE(pee.full_name, pee.employee_name, '''')
       ILIKE ''%'' || ###search### || ''%''
    OR COALESCE(c.claim_number, '''')
       ILIKE ''%'' || ###search### || ''%''
    OR COALESCE(mh.name, c.clm_hospital, '''')
       ILIKE ''%'' || ###search### || ''%''
  )
ORDER BY c.claim_dt DESC NULLS LAST, c.id DESC
    ', '2026-05-08 12:06:13.348584', '2026-05-11 14:08:57.73027', NULL, 'SYSTEM', 'SYSTEM', NULL, 30);

-- id=32
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (32, 'policy_enrollment_summary', 'Policy Enrollment Summary', 'policy_enrollment_summary', '
WITH emp_scope AS (
  SELECT COUNT(DISTINCT peepm.employee_id) AS total_employees
  FROM policy_enrollment_employee_policy_map peepm
  WHERE peepm.policy_id = ###policyId### AND peepm.deleted_at IS NULL
),
enroll_status AS (
  SELECT
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key=''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'')    AS enrolled_count,
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key=''EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS'') AS in_progress_count,
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key=''EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED'') AS not_started_count
  FROM policy_employee_enrollment pee
  WHERE pee.policy_id = ###policyId### AND pee.deleted_at IS NULL
),
dep_scope AS (
  SELECT COUNT(ped.id) AS total_dependents
  FROM policy_enrollment_dependent ped
  WHERE ped.policy_id = ###policyId### AND ped.deleted_at IS NULL
)
SELECT
  es.total_employees                                                                       AS "totalEmployees",
  COALESCE(ds.total_dependents, 0)                                                        AS "totalDependents",
  COALESCE(en.enrolled_count, 0)                                                          AS "enrolledCount",
  COALESCE(en.in_progress_count, 0)                                                       AS "inProgressCount",
  COALESCE(en.not_started_count, 0)                                                       AS "notStartedCount",
  GREATEST(es.total_employees - COALESCE(en.enrolled_count,0), 0)                        AS "notEnrolledCount",
  ROUND(COALESCE(en.enrolled_count,    0)*100.0/NULLIF(es.total_employees,0),1)           AS "enrolledPercent",
  ROUND(COALESCE(en.in_progress_count, 0)*100.0/NULLIF(es.total_employees,0),1)          AS "inProgressPercent",
  ROUND(COALESCE(en.not_started_count, 0)*100.0/NULLIF(es.total_employees,0),1)          AS "notStartedPercent"
FROM emp_scope es
CROSS JOIN enroll_status en
CROSS JOIN dep_scope ds
    ', '2026-05-08 12:06:29.443626', '2026-05-08 12:06:29.443626', NULL, 'SYSTEM', 'SYSTEM', NULL, 31);

-- id=33
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (33, 'linked_policies_of_cd_account', 'Linked Policies of CD Account', 'linked_policies_of_cd_account', '
WITH input_cd_accounts AS (
  SELECT DISTINCT cdpm.caution_deposit_id
  FROM caution_deposit_policy_mapping cdpm
  INNER JOIN caution_deposit cd ON cd.id = cdpm.caution_deposit_id
  WHERE cdpm.policy_id = ###policyId### AND cd.company_id = ###companyId###
),
linked_policy_ids AS (
  SELECT DISTINCT cdpm.policy_id
  FROM caution_deposit_policy_mapping cdpm
  INNER JOIN input_cd_accounts ica ON ica.caution_deposit_id = cdpm.caution_deposit_id
),
employee_counts AS (
  SELECT policy_id, COUNT(DISTINCT employee_id) AS employee_count
  FROM policy_enrollment_employee_policy_map WHERE deleted_at IS NULL GROUP BY policy_id
),
dependent_counts AS (
  SELECT policy_id, COUNT(id) AS dependent_count
  FROM policy_enrollment_dependent WHERE deleted_at IS NULL GROUP BY policy_id
)
SELECT
  p.id                                                                       AS "policyId",
  p.policy_name                                                              AS "policyName",
  ld.lookup_key                                                              AS "policyTypeKey",
  COALESCE(p.insurer_policy_number, '''')                                     AS "policyNumber",
  TO_CHAR(p.policy_from, ''DD Mon YYYY'')                                     AS "periodStart",
  TO_CHAR(p.policy_to,   ''DD Mon YYYY'')                                     AS "periodEnd",
  COALESCE(p.net_premium, 0)                                                AS "netPremium",
  COALESCE(ec.employee_count,0) + COALESCE(dc.dependent_count,0)           AS "totalLives"
FROM linked_policy_ids lpi
INNER JOIN policy      p  ON p.id  = lpi.policy_id AND p.company_id = ###companyId###
INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
LEFT JOIN  employee_counts  ec ON ec.policy_id = p.id
LEFT JOIN  dependent_counts dc ON dc.policy_id = p.id
ORDER BY p.policy_name
    ', '2026-05-08 12:06:45.937996', '2026-05-08 12:06:45.937996', NULL, 'SYSTEM', 'SYSTEM', NULL, 30);

-- id=40
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (40, 'endorsement_overview', 'Endorsement Overview KPIs', 'endorsement_overview', '
SELECT
  COUNT(DISTINCT e.id) AS "totalEndorsements",
  NULL::numeric        AS "netGrossPremium"
FROM endorsement e
INNER JOIN policy p ON p.id = e.policy_id
WHERE p.company_id = ###companyId###
  AND (###policyId### = '''' OR e.policy_id::text = ###policyId###)
    ', '2026-05-08 12:08:57.413819', '2026-05-08 12:08:57.413819', NULL, 'SYSTEM', 'SYSTEM', NULL, 20);

-- id=41
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (41, 'endorsement_employee_metrics', 'Endorsement Employee & Lives Metrics', 'endorsement_employee_metrics', '
WITH employee_scope AS (
  SELECT
    emp_map.employee_id,
    MAX(CASE WHEN emp_map.enrollment_addition_batch_id IS NOT NULL THEN 1 ELSE 0 END) AS has_addition,
    MAX(CASE WHEN emp_map.enrollment_deletion_batch_id IS NOT NULL THEN 1 ELSE 0 END) AS has_deletion
  FROM policy_enrollment_employee_policy_map emp_map
  INNER JOIN policy p ON p.id = emp_map.policy_id
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '''' OR emp_map.policy_id::text = ###policyId###)
    AND emp_map.deleted_at IS NULL
  GROUP BY emp_map.employee_id
),
dependent_scope AS (
  SELECT
    dep.id AS dependent_id,
    MAX(CASE WHEN dep.enrollment_addition_batch_id IS NOT NULL THEN 1 ELSE 0 END) AS has_addition,
    MAX(CASE WHEN dep.enrollment_deletion_batch_id IS NOT NULL THEN 1 ELSE 0 END) AS has_deletion
  FROM policy_enrollment_dependent dep
  INNER JOIN policy p ON p.id = dep.policy_id
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '''' OR dep.policy_id::text = ###policyId###)
    AND dep.deleted_at IS NULL
  GROUP BY dep.id
),
employee_counts AS (
  SELECT
    COUNT(*) FILTER (WHERE has_addition=0 AND has_deletion=0) AS at_inception,
    COUNT(*) FILTER (WHERE has_addition=1 AND has_deletion=0) AS in_addition,
    COUNT(*) FILTER (WHERE has_deletion=1)                     AS in_deletion,
    COUNT(*) FILTER (WHERE has_deletion=0)                     AS active
  FROM employee_scope
),
dependent_counts AS (
  SELECT
    COUNT(*) FILTER (WHERE has_addition=0 AND has_deletion=0) AS at_inception,
    COUNT(*) FILTER (WHERE has_addition=1 AND has_deletion=0) AS in_addition,
    COUNT(*) FILTER (WHERE has_deletion=1)                     AS in_deletion,
    COUNT(*) FILTER (WHERE has_deletion=0)                     AS active
  FROM dependent_scope
)
SELECT
  ec.at_inception                   AS "employeesAtInception",
  ec.in_addition                    AS "employeesInAddition",
  ec.in_deletion                    AS "employeesInDeletion",
  ec.active                         AS "activeEmployees",
  ec.at_inception + dc.at_inception AS "livesAtInception",
  ec.in_addition  + dc.in_addition  AS "livesInAddition",
  ec.in_deletion  + dc.in_deletion  AS "livesInDeletion",
  ec.active       + dc.active       AS "activeLives"
FROM employee_counts ec
CROSS JOIN dependent_counts dc
    ', '2026-05-08 12:08:57.415724', '2026-05-08 12:08:57.415724', NULL, 'SYSTEM', 'SYSTEM', NULL, 21);

-- id=42
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (42, 'endorsement_list', 'Endorsement List', 'endorsement_list', '
SELECT
  e.id                                                   AS "endorsementId",
  e.insurer_endorsement_number                           AS "insurerEndorsementId",
  e.policy_id                                            AS "policyId",
  p.insurer_policy_number                                AS "policyNumber",
  e.endorsement_type                                     AS "endorsementType",
  TO_CHAR(e.enrollment_start_date, ''DD/MM/YYYY'')         AS "enrollmentStartDate",
  TO_CHAR(e.enrollment_end_date,   ''DD/MM/YYYY'')         AS "enrollmentEndDate",
  TO_CHAR(e.created_at,            ''DD/MM/YYYY'')         AS "createdAt",
  e.os_ticket_number                                     AS "osTicketNumber",
  COALESCE(e.endorsement_status, '''')                     AS "endorsementStatus",
  COALESCE(counts.upload_count,  0)                      AS "uploadCount",
  COALESCE(counts.success_count, 0)                      AS "totalSuccessCount",
  COALESCE(counts.error_count,   0)                      AS "totalErrorCount",
  COALESCE(counts.process_count, 0)                      AS "totalProcessCount",
  COALESCE(e.basic_premium,  p.basic_premium)            AS "basePremium",
  COALESCE(e.gst_amount,     p.gst_amount)               AS "taxAmount",
  COALESCE(e.gross_premium,  p.gross_premium)            AS "grossPremium",
  COALESCE(e.net_premium,    p.net_premium)              AS "netPremium",
  CASE
    WHEN COALESCE(e.net_premium,   p.net_premium)   IS NOT NULL
     AND COALESCE(e.gst_amount,    p.gst_amount)    IS NOT NULL
    THEN COALESCE(e.net_premium, p.net_premium) + COALESCE(e.gst_amount, p.gst_amount)
    ELSE COALESCE(e.net_premium, p.net_premium, e.gross_premium, p.gross_premium)
  END                                                    AS "netGrossPremium",
  COALESCE(e.endorsment_count, 0)                        AS "endorsmentCount",
  COALESCE(e.endorsment_dependent_count, 0)              AS "endorsmentDependentCount",
  COALESCE(e.is_inception, false)                        AS "isInception"
FROM endorsement e
INNER JOIN policy p ON p.id = e.policy_id
LEFT JOIN (
  SELECT
    dpf.endorsement_id,
    COUNT(DISTINCT dpf.id)              AS upload_count,
    COALESCE(SUM(s.success_count), 0)   AS success_count,
    COALESCE(SUM(s.error_count),   0)   AS error_count,
    COALESCE(SUM(s.process_count), 0)   AS process_count
  FROM document_processing_file dpf
  INNER JOIN policy p2 ON p2.id = dpf.entity_id AND dpf.entity_type = ''policy''
  LEFT JOIN policy_enrollment_upload_summary s
    ON s.document_processing_file_id = dpf.id
  WHERE p2.company_id = ###companyId###
    AND (###policyId### = '''' OR dpf.entity_id::text = ###policyId###)
  GROUP BY dpf.endorsement_id
) counts ON counts.endorsement_id = e.id
WHERE p.company_id = ###companyId###
  AND (###policyId### = '''' OR e.policy_id::text = ###policyId###)
ORDER BY e.created_at DESC
', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, 22);

-- id=43
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (43, 'endorsement_premium_components', 'Endorsement Premium Components', 'endorsement_premium_components', '
SELECT ''BASE_PREMIUM''                  AS "componentKey",''Base Premium''                  AS "componentLabel",NULL::numeric AS "amount" WHERE ###companyId### IS NOT NULL
UNION ALL SELECT ''TAX_AMOUNT'',                 ''Tax Amount'',                  NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT ''GROSS_PREMIUM'',              ''Gross Premium'',               NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT ''ADDITION_PREMIUM'',           ''Addition Premium'',            NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT ''DELETION_PREMIUM'',           ''Deletion Premium'',            NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT ''CORRECTION_ADDITION_PREMIUM'',''Correction Addition Premium'', NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT ''CORRECTION_DELETION_PREMIUM'',''Correction Deletion Premium'', NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT ''NET_PREMIUM'',                ''Net Premium'',                 NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT ''NET_TAX_AMOUNT'',             ''Net Tax Amount'',              NULL::numeric WHERE ###companyId### IS NOT NULL
UNION ALL SELECT ''NET_GROSS_PREMIUM'',          ''Net Gross Premium'',           NULL::numeric WHERE ###companyId### IS NOT NULL
    ', '2026-05-08 12:09:33.433056', '2026-05-08 12:09:33.433056', NULL, 'SYSTEM', 'SYSTEM', NULL, 23);

-- id=44
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (44, 'cd_kpi_summary', 'CD Management KPI Summary', 'cd_kpi_summary', '
WITH account_totals AS (
  SELECT COUNT(DISTINCT cd.id) AS active_accounts_count, COALESCE(SUM(cd.balance_amount),0) AS total_deposit_balance
  FROM caution_deposit cd WHERE cd.company_id = ###companyId### AND cd.status = ''ACTIVE''
),
utilisation AS (
  SELECT COALESCE(SUM(CASE WHEN cdt.transaction_type=''DEBIT_TRANSACTION'' THEN cdt.transaction_amount ELSE 0 END),0) AS total_utilised
  FROM caution_deposit_transaction cdt
  INNER JOIN caution_deposit cd ON cd.id = cdt.caution_deposit_id
  WHERE cd.company_id = ###companyId###
),
last_credit AS (
  SELECT cdt.transaction_date, cdt.transaction_amount, cdt.bank_name
  FROM caution_deposit_transaction cdt
  INNER JOIN caution_deposit cd ON cd.id = cdt.caution_deposit_id
  WHERE cd.company_id = ###companyId### AND cdt.transaction_type = ''CREDIT_TRANSACTION''
  ORDER BY cdt.transaction_date DESC LIMIT 1
),
balance_trend AS (
  SELECT json_agg(monthly_balance ORDER BY month_start) AS trend_data
  FROM (
    SELECT
      date_trunc(''month'', cdt.transaction_date) AS month_start,
      SUM(CASE WHEN cdt.transaction_type=''CREDIT_TRANSACTION'' THEN cdt.transaction_amount ELSE 0 END)
      - SUM(CASE WHEN cdt.transaction_type=''DEBIT_TRANSACTION''  THEN cdt.transaction_amount ELSE 0 END) AS monthly_balance
    FROM caution_deposit_transaction cdt
    INNER JOIN caution_deposit cd ON cd.id = cdt.caution_deposit_id
    WHERE cd.company_id = ###companyId###
      AND cdt.transaction_date >= date_trunc(''month'', NOW() - INTERVAL ''5 months'')
    GROUP BY date_trunc(''month'', cdt.transaction_date)
    ORDER BY month_start LIMIT 6
  ) t
)
SELECT
  at.total_deposit_balance                                                            AS "totalDepositBalance",
  at.active_accounts_count                                                            AS "activeCdAccountsCount",
  ut.total_utilised                                                                   AS "utilisedAmount",
  ROUND(ut.total_utilised*100.0/NULLIF(at.total_deposit_balance,0),1)               AS "utilisedPercent",
  TO_CHAR(lc.transaction_date,''DD/MM/YYYY'')                                          AS "lastDepositDate",
  lc.transaction_amount                                                               AS "lastDepositAmount",
  lc.bank_name                                                                        AS "lastDepositBank",
  bt.trend_data                                                                       AS "balanceTrendData"
FROM account_totals at
CROSS JOIN utilisation ut
LEFT JOIN last_credit lc ON true
LEFT JOIN balance_trend bt ON true
    ', '2026-05-08 12:09:48.874743', '2026-05-08 12:09:48.874743', NULL, 'SYSTEM', 'SYSTEM', NULL, 10);

-- id=45
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (45, 'cd_account_details', 'CD Account Details', 'cd_account_details', '
SELECT
  cd.id                                                                               AS "cdAccountId",
  cd.cd_account_number                                                                AS "cdAccountNumber",
  cd.cd_account_name                                                                  AS "cdAccountName",
  p.insurer_policy_number                                                             AS "policyNumber",
  p.id                                                                                AS "policyId",
  COALESCE(cd.balance_amount,0)                                                       AS "depositBalance",
  COALESCE(SUM(CASE WHEN cdt.transaction_type=''DEBIT_TRANSACTION'' THEN cdt.transaction_amount ELSE 0 END),0) AS "utilisedAmount",
  ROUND(COALESCE(SUM(CASE WHEN cdt.transaction_type=''DEBIT_TRANSACTION'' THEN cdt.transaction_amount ELSE 0 END),0)*100.0/NULLIF(cd.balance_amount,0),1) AS "utilisationPercent",
  TO_CHAR(cd.updated_at,''DD/MM/YYYY'')                                                AS "lastUpdated"
FROM caution_deposit cd
INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
INNER JOIN policy p ON p.id = cdpm.policy_id
LEFT JOIN caution_deposit_transaction cdt ON cdt.caution_deposit_id = cd.id
WHERE cd.company_id = ###companyId### AND cd.status = ''ACTIVE''
  AND (###search### = '''' OR cd.cd_account_name ILIKE ''%''||###search###||''%'' OR p.insurer_policy_number ILIKE ''%''||###search###||''%'')
GROUP BY cd.id,cd.cd_account_number,cd.cd_account_name,cd.balance_amount,cd.updated_at,p.insurer_policy_number,p.id
ORDER BY "utilisationPercent" DESC NULLS LAST
    ', '2026-05-08 12:10:03.360642', '2026-05-08 12:10:03.360642', NULL, 'SYSTEM', 'SYSTEM', NULL, 11);

-- id=46
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (46, 'cd_transactions', 'CD Deposit Transactions', 'cd_transactions', '

SELECT
  cdt.id                                                                   AS "txnId",

  TO_CHAR(cdt.transaction_date, ''DD/MM/YYYY'')                              AS "txnDate",

  CASE
    WHEN cdt.transaction_type = ''CREDIT_TRANSACTION'' THEN ''Deposit''
    ELSE ''Deduction''
  END                                                                       AS "txnType",

  CASE
    WHEN cdt.transaction_type = ''CREDIT_TRANSACTION''
      THEN cdt.transaction_amount
    ELSE -cdt.transaction_amount
  END                                                                       AS "amount",

  cd.cd_account_number                                                      AS "cdAccountNumber",

  p.insurer_policy_number                                                   AS "policyNumber",

  cdt.bank_name                                                             AS "bankName",

  COALESCE(
    NULLIF(TRIM(cdt.cheque_number), ''''),
    cdt.transaction_reference_id
  )                                                                         AS "referenceId",

  cdt.cd_balance_amount                                                     AS "runningBalance",

  e.insurer_endorsement_number                                              AS "endorsementNumber",

  e.endorsement_type                                                        AS "endorsementType",

  TO_CHAR(cdt.cheque_date, ''DD/MM/YYYY'')                                    AS "transactionValueDate",

  TRIM(u.first_name || '' '' || COALESCE(u.last_name, ''''))                    AS "createdBy",

  cdt.remarks                                                               AS "remarks",

  cdt.ifsc_code                                                             AS "ifscCode"

FROM caution_deposit_transaction cdt

INNER JOIN caution_deposit cd
  ON cd.id = cdt.caution_deposit_id

LEFT JOIN policy p
  ON p.id = cdt.policy_id

LEFT JOIN endorsement e
  ON e.id = cdt.endorsement_id

LEFT JOIN users u
  ON u.id = cdt.created_by

WHERE cd.company_id = ###companyId###

  AND (
    ###policyId### = ''''
    OR cdt.policy_id::text = ###policyId###
  )

  AND (
    ###txnType### = ''''
    OR cdt.transaction_type = ###txnType###
  )

  AND (
    NULLIF(###startDate###, '''') IS NULL
    OR cdt.transaction_date >= NULLIF(###startDate###, '''')::date
  )

  AND (
    NULLIF(###endDate###, '''') IS NULL
    OR cdt.transaction_date <= NULLIF(###endDate###, '''')::date
  )

  AND (
    ###search### = ''''
    OR COALESCE(
         NULLIF(TRIM(cdt.cheque_number), ''''),
         cdt.transaction_reference_id
       ) ILIKE ''%'' || ###search### || ''%''
    OR cdt.remarks ILIKE ''%'' || ###search### || ''%''
  )

ORDER BY cdt.transaction_date DESC

', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, 12);

-- id=47
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (47, 'portfolio_kpi_summary', 'Portfolio KPI Summary', 'portfolio_kpi_summary', '
WITH lh_companies AS (
  SELECT DISTINCT c.id
  FROM company c
  WHERE c.deleted_at IS NULL
    -- PORTAL_CRM: only companies this CRM owns (member or parent)
    AND (###crmUserId### = '''' OR c.lead_crm::text = ###crmUserId###)
    -- HR_ADMIN: their company + all companies in their group (members + parent)
    AND (
      ###hrCompanyId### = ''''
      OR c.id::text = ###hrCompanyId###
      OR c.id IN (
        SELECT gcm.company_id FROM group_company_map gcm
        WHERE gcm.group_company_id IN (
          SELECT gcm2.group_company_id FROM group_company_map gcm2
          WHERE gcm2.company_id::text = ###hrCompanyId###
        )
      )
      OR c.id IN (
        SELECT gcm3.group_company_id FROM group_company_map gcm3
        WHERE gcm3.company_id::text = ###hrCompanyId###
      )
    )
    AND EXISTS (
      SELECT 1
      FROM policy p2
      JOIN policy_type_segregation pts ON pts.policy_type_lid = p2.policy_type_lid
      JOIN lookup_data il ON il.id = pts.iirm_policy_type_lid AND il.deleted_at IS NULL
      WHERE p2.company_id = c.id
        AND (lower(il.value) LIKE ''%life%'' OR lower(il.value) LIKE ''%health%'')
        AND lower(il.value) NOT LIKE ''%non-life%''
    )
)
SELECT
  COUNT(DISTINCT lc.id)::int                                                           AS "totalCompanies",
  COUNT(DISTINCT p.id)::int                                                            AS "totalPolicies",
  COUNT(DISTINCT p.id) FILTER (WHERE p.policy_to >= CURRENT_DATE)::int                AS "activePolicies",
  COUNT(DISTINCT p.id) FILTER (WHERE p.policy_to <  CURRENT_DATE)::int                AS "inactivePolicies",
  COALESCE(SUM(p.net_premium), 0)::numeric                                             AS "totalPremium"
FROM lh_companies lc
LEFT JOIN policy p ON p.company_id = lc.id
', '2026-05-08 12:12:27.895499', '2026-05-08 12:12:27.895499', NULL, 'SYSTEM', 'SYSTEM', NULL, 20);

-- id=48
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (48, 'portfolio_companies', 'Portfolio Companies', 'portfolio_companies', '
SELECT
  c.id                                                AS "companyId",
  COALESCE(c.display_name, c.company_name)           AS "companyName",
  ind.value                                           AS "industry",
  city.name                                           AS "city",
  state.name                                          AS "state",
  COALESCE(c.no_of_employees, 0)::int                AS "employeeCount",
  CASE WHEN crm_u.first_name IS NOT NULL
       THEN crm_u.first_name || '' '' || crm_u.last_name END AS "rmName",
  gcm.group_company_id                               AS "groupId",
  COALESCE(gc.display_name, gc.company_name)         AS "groupName",
  grp_ind.value                                       AS "groupSector",
  ''GROUP_MEMBER''                                      AS "companyRole",
  COALESCE(pc.policy_count,   0)::int                AS "policyCount",
  COALESCE(pc.active_count,   0)::int                AS "activePolicyCount",
  COALESCE(pc.inactive_count, 0)::int                AS "inactivePolicyCount"
FROM company c
INNER JOIN group_company_map gcm ON gcm.company_id = c.id
INNER JOIN company gc ON gc.id = gcm.group_company_id AND gc.deleted_at IS NULL
LEFT JOIN lookup_data ind     ON ind.id     = c.industry_segment_lid  AND ind.deleted_at     IS NULL
LEFT JOIN lookup_data grp_ind ON grp_ind.id = gc.industry_segment_lid AND grp_ind.deleted_at IS NULL
LEFT JOIN users crm_u ON crm_u.id = c.lead_crm
LEFT JOIN LATERAL (
  SELECT ca.address_id
  FROM company_address ca
  WHERE ca.company_id = c.id
  ORDER BY ca.is_primary DESC NULLS LAST, ca.id ASC
  LIMIT 1
) first_ca ON TRUE
LEFT JOIN address addr ON addr.id = first_ca.address_id AND addr.deleted_at IS NULL
LEFT JOIN city  ON city.id  = addr.city_id
LEFT JOIN state ON state.id = addr.state_id
LEFT JOIN (
  SELECT company_id,
         COUNT(*)                                           AS policy_count,
         COUNT(*) FILTER (WHERE policy_to >= CURRENT_DATE) AS active_count,
         COUNT(*) FILTER (WHERE policy_to <  CURRENT_DATE) AS inactive_count
  FROM policy GROUP BY company_id
) pc ON pc.company_id = c.id
WHERE c.deleted_at IS NULL

UNION ALL

SELECT
  c.id                                                AS "companyId",
  COALESCE(c.display_name, c.company_name)           AS "companyName",
  ind.value                                           AS "industry",
  city.name                                           AS "city",
  state.name                                          AS "state",
  COALESCE(c.no_of_employees, 0)::int                AS "employeeCount",
  CASE WHEN crm_u.first_name IS NOT NULL
       THEN crm_u.first_name || '' '' || crm_u.last_name END AS "rmName",
  NULL::int                                           AS "groupId",
  NULL::text                                          AS "groupName",
  NULL::text                                          AS "groupSector",
  ''INDIVIDUAL''                                        AS "companyRole",
  COALESCE(pc.policy_count,   0)::int                AS "policyCount",
  COALESCE(pc.active_count,   0)::int                AS "activePolicyCount",
  COALESCE(pc.inactive_count, 0)::int                AS "inactivePolicyCount"
FROM company c
LEFT JOIN lookup_data ind ON ind.id = c.industry_segment_lid AND ind.deleted_at IS NULL
LEFT JOIN users crm_u ON crm_u.id = c.lead_crm
LEFT JOIN LATERAL (
  SELECT ca.address_id
  FROM company_address ca
  WHERE ca.company_id = c.id
  ORDER BY ca.is_primary DESC NULLS LAST, ca.id ASC
  LIMIT 1
) first_ca ON TRUE
LEFT JOIN address addr ON addr.id = first_ca.address_id AND addr.deleted_at IS NULL
LEFT JOIN city  ON city.id  = addr.city_id
LEFT JOIN state ON state.id = addr.state_id
LEFT JOIN (
  SELECT company_id,
         COUNT(*)                                           AS policy_count,
         COUNT(*) FILTER (WHERE policy_to >= CURRENT_DATE) AS active_count,
         COUNT(*) FILTER (WHERE policy_to <  CURRENT_DATE) AS inactive_count
  FROM policy GROUP BY company_id
) pc ON pc.company_id = c.id
WHERE c.deleted_at IS NULL
  AND c.id NOT IN (SELECT DISTINCT group_company_id FROM group_company_map)
  AND c.id NOT IN (SELECT DISTINCT company_id        FROM group_company_map)

ORDER BY "groupId" NULLS LAST, "companyName"
', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, 21);

-- id=49
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (49, 'portfolio_policies', 'Portfolio Policies', 'portfolio_policies', '
WITH policy_insurer AS (
  SELECT DISTINCT ON (pim.policy_id)
    pim.policy_id,
    i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
)
SELECT
  p.id                                                      AS "policyId",
  p.company_id                                              AS "companyId",
  COALESCE(iirm_ld.value, ld.value)                        AS "policyTypeCode",
  ld.value                                                  AS "policyTypeName",
  pi.insurer_name                                           AS "insurerName",
  p.insurer_policy_number                                   AS "policyNumber",
  p.net_premium                                             AS "premiumAmount",
  TO_CHAR(p.policy_from, ''DD/MM/YYYY'')                     AS "startDate",
  TO_CHAR(p.policy_to,   ''DD/MM/YYYY'')                     AS "endDate",
  CASE
    WHEN p.policy_to <  CURRENT_DATE                        THEN ''Expired''
    WHEN p.policy_to <= CURRENT_DATE + INTERVAL ''60 days''   THEN ''Renewal Due''
    ELSE ''Active''
  END                                                       AS "policyStatus"
FROM policy p
LEFT JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
LEFT JOIN policy_type_segregation pts ON pts.policy_type_lid = p.policy_type_lid
LEFT JOIN lookup_data iirm_ld ON iirm_ld.id = pts.iirm_policy_type_lid AND iirm_ld.deleted_at IS NULL
LEFT JOIN policy_insurer pi ON pi.policy_id = p.id
WHERE p.company_id IN (
  SELECT id FROM company
  WHERE deleted_at IS NULL
    AND id NOT IN (SELECT DISTINCT group_company_id FROM group_company_map)
)
ORDER BY p.company_id, p.policy_from DESC
', '2026-05-08 12:12:57.608283', '2026-05-08 12:12:57.608283', NULL, 'SYSTEM', 'SYSTEM', NULL, 22);

-- id=50
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (50, 'portfolio_group_companies', 'Portfolio Group Companies', 'portfolio_group_companies', '
SELECT
  c.id                                                AS "companyId",
  COALESCE(c.display_name, c.company_name)           AS "companyName",
  ind.value                                           AS "industry",
  city.name                                           AS "city",
  state.name                                          AS "state",
  CASE WHEN crm_u.first_name IS NOT NULL
       THEN crm_u.first_name || '' '' || crm_u.last_name END AS "rmName",
  gcm.group_company_id                               AS "groupId",
  COALESCE(gc.display_name, gc.company_name)         AS "groupName",
  grp_ind.value                                       AS "groupSector",
  ''GROUP_MEMBER''                                      AS "companyRole",
  COALESCE(pc.policy_count,    0)::int               AS "policyCount",
  COALESCE(pc.active_count,    0)::int               AS "activePolicyCount",
  COALESCE(pc.inactive_count,  0)::int               AS "inactivePolicyCount",
  COALESCE(pc.lh_policy_count, 0)::int               AS "lhPolicyCount",
  NULL::int                                           AS "employeeCount",
  pc_grp.parent_policy_count                         AS "parentPolicyCount",
  pc_grp.parent_active_count                         AS "parentActivePolicyCount",
  pc_grp.parent_inactive_count                       AS "parentInactivePolicyCount",
  pc_grp.parent_lh_policy_count                      AS "parentLhPolicyCount",
  NULL::int                                           AS "parentEmployeeCount",
  grp_city.name                                       AS "parentCity",
  grp_state.name                                      AS "parentState",
  CASE WHEN parent_crm_u.first_name IS NOT NULL
       THEN parent_crm_u.first_name || '' '' || parent_crm_u.last_name END AS "parentRmName"
FROM company c
INNER JOIN group_company_map gcm ON gcm.company_id = c.id
INNER JOIN company gc ON gc.id = gcm.group_company_id AND gc.deleted_at IS NULL
LEFT JOIN lookup_data ind     ON ind.id     = c.industry_segment_lid  AND ind.deleted_at     IS NULL
LEFT JOIN lookup_data grp_ind ON grp_ind.id = gc.industry_segment_lid AND grp_ind.deleted_at IS NULL
LEFT JOIN users crm_u ON crm_u.id = c.lead_crm
LEFT JOIN users parent_crm_u ON parent_crm_u.id = gc.lead_crm
LEFT JOIN (
  SELECT DISTINCT ON (ca.company_id)
    ca.company_id,
    ca.address_id
  FROM company_address ca
  ORDER BY ca.company_id, ca.is_primary DESC NULLS LAST, ca.id ASC
) best_addr ON best_addr.company_id = c.id
LEFT JOIN address addr ON addr.id = best_addr.address_id AND addr.deleted_at IS NULL
LEFT JOIN city  ON city.id  = addr.city_id
LEFT JOIN state ON state.id = addr.state_id
LEFT JOIN (
  SELECT DISTINCT ON (ca2.company_id)
    ca2.company_id,
    ca2.address_id
  FROM company_address ca2
  ORDER BY ca2.company_id, ca2.is_primary DESC NULLS LAST, ca2.id ASC
) best_addr_grp ON best_addr_grp.company_id = gc.id
LEFT JOIN address addr_grp ON addr_grp.id = best_addr_grp.address_id AND addr_grp.deleted_at IS NULL
LEFT JOIN city  grp_city  ON grp_city.id  = addr_grp.city_id
LEFT JOIN state grp_state ON grp_state.id = addr_grp.state_id
LEFT JOIN (
  SELECT p.company_id,
         COUNT(*)                                           AS policy_count,
         COUNT(*) FILTER (WHERE p.policy_to >= CURRENT_DATE) AS active_count,
         COUNT(*) FILTER (WHERE p.policy_to <  CURRENT_DATE) AS inactive_count,
         COUNT(*) FILTER (
           WHERE EXISTS (
             SELECT 1
             FROM policy_type_segregation pts_lh
             JOIN lookup_data il ON il.id = pts_lh.iirm_policy_type_lid AND il.deleted_at IS NULL
             WHERE pts_lh.policy_type_lid = p.policy_type_lid
               AND (lower(il.value) LIKE ''%life%'' OR lower(il.value) LIKE ''%health%'')
               AND lower(il.value) NOT LIKE ''%non-life%''
           )
         )                                                   AS lh_policy_count
  FROM policy p GROUP BY p.company_id
) pc ON pc.company_id = c.id
LEFT JOIN (
  SELECT gcm_g.group_company_id,
         COUNT(p2.id)                                               AS parent_policy_count,
         COUNT(p2.id) FILTER (WHERE p2.policy_to >= CURRENT_DATE)  AS parent_active_count,
         COUNT(p2.id) FILTER (WHERE p2.policy_to <  CURRENT_DATE)  AS parent_inactive_count,
         COUNT(p2.id) FILTER (
           WHERE EXISTS (
             SELECT 1
             FROM policy_type_segregation pts2
             JOIN lookup_data il2 ON il2.id = pts2.iirm_policy_type_lid AND il2.deleted_at IS NULL
             WHERE pts2.policy_type_lid = p2.policy_type_lid
               AND (lower(il2.value) LIKE ''%life%'' OR lower(il2.value) LIKE ''%health%'')
               AND lower(il2.value) NOT LIKE ''%non-life%''
           )
         )                                                           AS parent_lh_policy_count
  FROM group_company_map gcm_g
  JOIN company cm ON cm.id = gcm_g.company_id AND cm.deleted_at IS NULL
  JOIN policy p2 ON p2.company_id = cm.id
  GROUP BY gcm_g.group_company_id
) pc_grp ON pc_grp.group_company_id = gcm.group_company_id
WHERE c.deleted_at IS NULL
  AND (
    COALESCE(pc.lh_policy_count, 0) > 0
    OR (###hrCompanyId### != '''' AND COALESCE(pc.policy_count, 0) > 0)
  )
  AND (###crmUserId### = '''' OR c.lead_crm::text = ###crmUserId###)
  AND (
    ###hrCompanyId### = ''''
    OR gcm.group_company_id::text = ###hrCompanyId###
    OR gcm.group_company_id IN (
      SELECT gcm2.group_company_id
      FROM group_company_map gcm2
      WHERE gcm2.company_id::text = ###hrCompanyId###
    )
    OR c.id::text = ###hrCompanyId###
  )
  AND (###searchTerm### IS NULL
       OR COALESCE(c.display_name, c.company_name) ILIKE ''%'' || ###searchTerm### || ''%''
       OR COALESCE(gc.display_name, gc.company_name) ILIKE ''%'' || ###searchTerm### || ''%'')
ORDER BY "groupId", "companyName"
', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, 23);

-- id=51
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (51, 'portfolio_individual_companies', 'Portfolio Individual Companies', 'portfolio_individual_companies', '
SELECT
  c.id                                                AS "companyId",
  COALESCE(c.display_name, c.company_name)           AS "companyName",
  ind.value                                           AS "industry",
  city.name                                           AS "city",
  state.name                                          AS "state",
  CASE WHEN crm_u.first_name IS NOT NULL
       THEN crm_u.first_name || '' '' || crm_u.last_name END AS "rmName",
  NULL::int                                           AS "groupId",
  NULL::text                                          AS "groupName",
  NULL::text                                          AS "groupSector",
  ''INDIVIDUAL''                                        AS "companyRole",
  COALESCE(pc.policy_count,    0)::int               AS "policyCount",
  COALESCE(pc.active_count,    0)::int               AS "activePolicyCount",
  COALESCE(pc.inactive_count,  0)::int               AS "inactivePolicyCount",
  COALESCE(pc.lh_policy_count, 0)::int               AS "lhPolicyCount",
  NULL::int                                           AS "employeeCount"
FROM company c
LEFT JOIN group_company_map gcm_p ON gcm_p.group_company_id = c.id
LEFT JOIN group_company_map gcm_m ON gcm_m.company_id = c.id
LEFT JOIN lookup_data ind ON ind.id = c.industry_segment_lid AND ind.deleted_at IS NULL
LEFT JOIN users crm_u ON crm_u.id = c.lead_crm
LEFT JOIN (
  SELECT DISTINCT ON (ca.company_id)
    ca.company_id,
    ca.address_id
  FROM company_address ca
  ORDER BY ca.company_id, ca.is_primary DESC NULLS LAST, ca.id ASC
) best_addr ON best_addr.company_id = c.id
LEFT JOIN address addr ON addr.id = best_addr.address_id AND addr.deleted_at IS NULL
LEFT JOIN city  ON city.id  = addr.city_id
LEFT JOIN state ON state.id = addr.state_id
LEFT JOIN (
  SELECT p.company_id,
         COUNT(*)                                           AS policy_count,
         COUNT(*) FILTER (WHERE p.policy_to >= CURRENT_DATE) AS active_count,
         COUNT(*) FILTER (WHERE p.policy_to <  CURRENT_DATE) AS inactive_count,
         COUNT(*) FILTER (
           WHERE EXISTS (
             SELECT 1
             FROM policy_type_segregation pts_lh
             JOIN lookup_data il ON il.id = pts_lh.iirm_policy_type_lid AND il.deleted_at IS NULL
             WHERE pts_lh.policy_type_lid = p.policy_type_lid
               AND (lower(il.value) LIKE ''%life%'' OR lower(il.value) LIKE ''%health%'')
               AND lower(il.value) NOT LIKE ''%non-life%''
           )
         )                                                   AS lh_policy_count
  FROM policy p GROUP BY p.company_id
) pc ON pc.company_id = c.id
WHERE c.deleted_at IS NULL
  AND gcm_p.group_company_id IS NULL
  AND gcm_m.company_id IS NULL
  AND (
    COALESCE(pc.lh_policy_count, 0) > 0
    OR (###hrCompanyId### != '''' AND COALESCE(pc.policy_count, 0) > 0)
  )
  AND (###crmUserId### = '''' OR c.lead_crm::text = ###crmUserId###)
  AND (###hrCompanyId### = '''' OR c.id::text = ###hrCompanyId###)
  AND (###searchTerm### IS NULL
       OR COALESCE(c.display_name, c.company_name) ILIKE ''%'' || ###searchTerm### || ''%'')
ORDER BY "companyName"
', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, 24);

-- id=52
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (52, 'portfolio_company_policies', 'Portfolio Company Policies', 'portfolio_company_policies', '
WITH policy_insurer AS (
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
)
SELECT
  p.id                                                           AS "policyId",
  p.company_id                                                   AS "companyId",
  COALESCE(iirm_ld.value, ld.value)                             AS "policyTypeCode",
  ld.value                                                       AS "policyTypeName",
  pi.insurer_name                                                AS "insurerName",
  COALESCE(pt.tpa_name, ''—'')                                    AS "tpaName",
  p.insurer_policy_number                                        AS "policyNumber",
  p.net_premium                                                  AS "premiumAmount",
  TO_CHAR(p.policy_from, ''DD/MM/YYYY'')                          AS "startDate",
  TO_CHAR(p.policy_to,   ''DD/MM/YYYY'')                          AS "endDate",
  CASE
    WHEN p.policy_to <  CURRENT_DATE                             THEN ''Expired''
    WHEN p.policy_to <= CURRENT_DATE + INTERVAL ''60 days''        THEN ''Renewal Due''
    ELSE ''Active''
  END                                                            AS "policyStatus"
FROM policy p
LEFT JOIN lookup_data ld      ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
LEFT JOIN policy_type_segregation pts ON pts.policy_type_lid = p.policy_type_lid
LEFT JOIN lookup_data iirm_ld ON iirm_ld.id = pts.iirm_policy_type_lid AND iirm_ld.deleted_at IS NULL
LEFT JOIN policy_insurer pi   ON pi.policy_id = p.id
LEFT JOIN policy_tpa pt       ON pt.policy_id = p.id
WHERE p.company_id = ###companyId###
ORDER BY p.policy_from DESC
    ', '2026-05-08 12:14:00.640021', '2026-05-11 14:59:19.630154', NULL, 'SYSTEM', 'SYSTEM', NULL, 25);

-- id=53
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (53, 'ibp_hr_employee_listing', 'IBP HR Employee Listing', 'ibp_hr_employee_listing', '
WITH base_employees AS (
  SELECT
    pee.id AS "employeeId",
    pee.company_id AS "companyId",
    pee.user_id AS "userId",
    pee.company_employee_id AS "companyEmployeeId",
    pee.employee_name AS "employeeName",
    pee.full_name AS "fullName",
    pee.email_enc AS "email",
    pee.gender AS "gender",
    pee.date_of_birth_enc AS "dateOfBirth",
    pee.phone_number_enc AS "mobile"
  FROM policy_enrollment_employee pee
  WHERE pee.company_id = ###companyId###
    AND pee.deleted_at IS NULL
    AND (
      NULLIF(###search###, '''') IS NULL
      OR pee.employee_name ILIKE ''%'' || ###search### || ''%''
      OR pee.full_name ILIKE ''%'' || ###search### || ''%''
      OR pee.email_enc ILIKE ''%'' || ###search### || ''%''
      OR pee.company_employee_id ILIKE ''%'' || ###search### || ''%''
    )
),
latest_enrollment AS (
  SELECT DISTINCT ON (pe.employee_id, pe.company_id)
    pe.employee_id,
    pe.company_id,
    pe.employee_enrollment_status_key,
    pe.sum_insured
  FROM policy_employee_enrollment pe
  INNER JOIN base_employees be
    ON be."employeeId" = pe.employee_id
   AND be."companyId" = pe.company_id
  WHERE pe.deleted_at IS NULL
  ORDER BY pe.employee_id, pe.company_id, pe.updated_at DESC, pe.id DESC
),
dependents AS (
  SELECT
    employee_id,
    COUNT(*) AS dependents_count
  FROM policy_enrollment_dependent
  WHERE deleted_at IS NULL
  GROUP BY employee_id
),
last_login AS (
  SELECT
    ual.user_id,
    MAX(ual.action_date) AS last_login_at
  FROM user_activity_log ual
  INNER JOIN base_employees be
    ON be."userId" = ual.user_id
  WHERE ual.activity_key = ''LOGGED_IN''
    AND ual.activity_category = ''AUTH''
    AND ual.deleted_at IS NULL
  GROUP BY ual.user_id
)
SELECT
  be."employeeId",
  be."companyEmployeeId",
  be."employeeName",
  be."fullName",
  be."email",
  be."gender",
  be."dateOfBirth",
  be."mobile",
  COALESCE(le.employee_enrollment_status_key, ''EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED'') AS "enrollStatus",
  COALESCE(le.sum_insured, 0) AS "sumInsured",
  COALESCE(dep.dependents_count, 0) AS "dependentsCount",
  CONCAT(''uploads/e-cards/company/'', be."companyId", ''/'', be."companyEmployeeId", ''.pdf'') AS "ecardKey",
  ll.last_login_at AS "lastLoginAt"
FROM base_employees be
LEFT JOIN latest_enrollment le
  ON le.employee_id = be."employeeId"
 AND le.company_id = be."companyId"
LEFT JOIN dependents dep
  ON dep.employee_id = be."employeeId"
LEFT JOIN last_login ll
  ON ll.user_id = be."userId"
ORDER BY be."employeeId" DESC
LIMIT  COALESCE(NULLIF(###limit###,  '''')::int, 50)
OFFSET COALESCE(NULLIF(###offset###, '''')::int,  0)
', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, 7);

-- id=54
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (54, 'external_hr_company_policies', 'External HR – Company Policies', 'external_hr_company_policies', 'SELECT ap.id, ap.policy_name AS name
FROM policy ap
WHERE ap.company_id = ###companyId###
ORDER BY ap.policy_name ASC', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 100);

-- id=55
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (55, 'external_hr_company_locations', 'External HR – Company Locations', 'external_hr_company_locations', 'SELECT DISTINCT a.id, a.addr_1
FROM company_policy_configuration_location cpcl
JOIN address a ON a.id = cpcl.address_id
WHERE cpcl.company_id = ###companyId###
  AND a.deleted_at IS NULL
ORDER BY a.addr_1 ASC', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 101);

-- id=56
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (56, 'external_hr_user_list', 'External HR – User List', 'external_hr_user_list', 'SELECT
  hum.id          AS hr_management_id,
  u.id            AS user_id,
  hum.user_name   AS full_name,
  hum.email_id    AS email,
  hum.role_key    AS role_key,
  hum.company_name,
  hum.company_id,
  COUNT(DISTINCT epm.policy_id) AS policy_count,
  hum.created_at
FROM hr_user_management hum
JOIN users u ON u.id = hum.user_id
LEFT JOIN external_hr_policy_map epm ON epm.user_id = hum.user_id
WHERE hum.role_key = ''EXTERNAL_HR''
  AND hum.deleted_at IS NULL
  AND hum.company_id = ###companyId###
  AND (###search### IS NULL
       OR hum.user_name ILIKE ''%'' || ###search### || ''%''
       OR hum.email_id  ILIKE ''%'' || ###search### || ''%'')
GROUP BY hum.id, u.id, hum.user_name, hum.email_id, hum.role_key,
         hum.company_name, hum.company_id, hum.created_at
ORDER BY hum.created_at DESC', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 102);

-- id=57
INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no) VALUES (57, 'external_hr_user_detail', 'External HR – User Detail', 'external_hr_user_detail', 'SELECT
  hum.id          AS hr_management_id,
  hum.user_id     AS user_id,
  hum.user_name   AS full_name,
  hum.email_id    AS email,
  hum.role_key,
  hum.company_id,
  hum.company_name,
  hum.phone_number,
  hum.date_of_birth,
  COALESCE(
    JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(''policyId'', epm.policy_id))
      FILTER (WHERE epm.policy_id IS NOT NULL),
    ''[]''
  ) AS policies,
  COALESCE(
    JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(''addressId'', elm.address_id))
      FILTER (WHERE elm.address_id IS NOT NULL),
    ''[]''
  ) AS locations
FROM hr_user_management hum
LEFT JOIN external_hr_policy_map   epm ON epm.user_id = hum.user_id
LEFT JOIN external_hr_location_map elm ON elm.user_id = hum.user_id
WHERE hum.role_key   = ''EXTERNAL_HR''
  AND hum.deleted_at IS NULL
  AND hum.id         = ###userId###
GROUP BY hum.id, hum.user_id, hum.user_name, hum.email_id, hum.role_key,
         hum.company_id, hum.company_name, hum.phone_number, hum.date_of_birth', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 103);


-- ============================================================
-- TABLE 2: admin_reports_parameters
-- ============================================================

-- admin_report_id=21 (4 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (204, 21, 'companyId', 'Company ID', 'number', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (205, 21, 'policyType', 'Policy Type', 'string', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyType###', 'input', 'none', '{}', 2);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (206, 21, 'policyPeriodStart', 'Policy Period Start', 'date', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyPeriodStart###', 'input', 'none', '{}', 3);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (207, 21, 'policyPeriodEnd', 'Policy Period End', 'date', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyPeriodEnd###', 'input', 'none', '{}', 4);

-- admin_report_id=22 (2 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (208, 22, 'companyId', 'Company ID', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (209, 22, 'policyType', 'Policy Type', 'string', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyType###', 'input', 'none', '{}', 2);

-- admin_report_id=23 (7 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (210, 23, 'companyId', 'Company ID', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (211, 23, 'policyType', 'Policy Type', 'string', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyType###', 'input', 'none', '{}', 2);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (212, 23, 'startDate', 'Start Date', 'date', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, '###startDate###', 'input', 'none', '{}', 3);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (213, 23, 'endDate', 'End Date', 'date', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, '###endDate###', 'input', 'none', '{}', 4);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (214, 23, 'claimType', 'Claim Type', 'string', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, '###claimType###', 'input', 'none', '{}', 5);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (215, 23, 'claimStatus', 'Claim Status', 'string', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, '###claimStatus###', 'input', 'none', '{}', 6);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (216, 23, 'memberType', 'Member Type', 'string', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, '###memberType###', 'input', 'none', '{}', 7);

-- admin_report_id=24 (1 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (217, 24, 'policyId', 'Policy ID', 'number', '2026-05-08 12:03:43.680983', '2026-05-08 12:03:43.680983', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyId###', 'input', 'none', '{}', 1);

-- admin_report_id=25 (2 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (218, 25, 'companyId', 'Company ID', 'number', '2026-05-08 12:04:03.096693', '2026-05-08 12:04:03.096693', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (219, 25, 'policyType', 'Policy Type', 'string', '2026-05-08 12:04:03.096693', '2026-05-08 12:04:03.096693', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyType###', 'input', 'none', '{}', 2);

-- admin_report_id=26 (4 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (220, 26, 'companyId', 'Company ID', 'number', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (221, 26, 'policyType', 'Policy Type', 'string', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyType###', 'input', 'none', '{}', 2);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (222, 26, 'policyPeriodStart', 'Policy Period Start', 'date', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyPeriodStart###', 'input', 'none', '{}', 3);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (223, 26, 'policyPeriodEnd', 'Policy Period End', 'date', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyPeriodEnd###', 'input', 'none', '{}', 4);

-- admin_report_id=27 (7 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (224, 27, 'companyId', 'Company ID', 'number', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (225, 27, 'policyType', 'Policy Type', 'string', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyType###', 'input', 'none', '{}', 2);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (226, 27, 'policyPeriodStart', 'Policy Period Start', 'date', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyPeriodStart###', 'input', 'none', '{}', 3);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (227, 27, 'policyPeriodEnd', 'Policy Period End', 'date', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyPeriodEnd###', 'input', 'none', '{}', 4);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (228, 27, 'claimType', 'Claim Type', 'string', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, '###claimType###', 'input', 'none', '{}', 5);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (229, 27, 'claimStatus', 'Claim Status', 'string', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, '###claimStatus###', 'input', 'none', '{}', 6);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (230, 27, 'memberType', 'Member Type', 'string', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, '###memberType###', 'input', 'none', '{}', 7);

-- admin_report_id=28 (1 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (231, 28, 'policyId', 'Policy ID', 'number', '2026-05-08 12:05:08.299731', '2026-05-08 12:05:08.299731', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyId###', 'input', 'none', '{}', 1);

-- admin_report_id=29 (1 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (232, 29, 'policyId', 'Policy ID', 'number', '2026-05-08 12:05:23.976083', '2026-05-08 12:05:23.976083', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyId###', 'input', 'none', '{}', 1);

-- admin_report_id=30 (2 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (233, 30, 'companyId', 'Company ID', 'number', '2026-05-08 12:05:38.20827', '2026-05-08 12:05:38.20827', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (234, 30, 'policyId', 'Policy ID', 'number', '2026-05-08 12:05:38.20827', '2026-05-08 12:05:38.20827', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyId###', 'input', 'none', '{}', 2);

-- admin_report_id=31 (7 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (235, 31, 'policyId', 'Policy ID', 'number', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (236, 31, 'claimStatus', 'Claim Status', 'string', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, '###claimStatus###', 'input', 'none', '{}', 2);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (237, 31, 'claimType', 'Claim Type', 'string', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, '###claimType###', 'input', 'none', '{}', 3);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (238, 31, 'startYear', 'Start Year', 'string', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, '###startYear###', 'input', 'none', '{}', 4);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (239, 31, 'endYear', 'End Year', 'string', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, '###endYear###', 'input', 'none', '{}', 5);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (240, 31, 'search', 'Search', 'string', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, '###search###', 'input', 'none', '{}', 6);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (284, 31, 'employeeId', 'Employee ID', 'number', '2026-05-11 13:29:41.783226', '2026-05-11 13:29:41.783226', NULL, 'SYSTEM', 'SYSTEM', NULL, '###employeeId###', 'input', 'none', '{}', 7);

-- admin_report_id=32 (2 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (241, 32, 'policyId', 'Policy ID', 'number', '2026-05-08 12:06:29.443626', '2026-05-08 12:06:29.443626', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (242, 32, 'companyId', 'Company ID', 'number', '2026-05-08 12:06:29.443626', '2026-05-08 12:06:29.443626', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 2);

-- admin_report_id=33 (2 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (243, 33, 'policyId', 'Policy ID', 'number', '2026-05-08 12:06:45.937996', '2026-05-08 12:06:45.937996', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (244, 33, 'companyId', 'Company ID', 'number', '2026-05-08 12:06:45.937996', '2026-05-08 12:06:45.937996', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 2);

-- admin_report_id=40 (2 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (253, 40, 'companyId', 'Company ID', 'number', '2026-05-08 12:08:57.413819', '2026-05-08 12:08:57.413819', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (254, 40, 'policyId', 'Policy ID', 'string', '2026-05-08 12:08:57.413819', '2026-05-08 12:08:57.413819', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyId###', 'input', 'none', '{}', 2);

-- admin_report_id=41 (2 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (255, 41, 'companyId', 'Company ID', 'number', '2026-05-08 12:08:57.415724', '2026-05-08 12:08:57.415724', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (256, 41, 'policyId', 'Policy ID', 'string', '2026-05-08 12:08:57.415724', '2026-05-08 12:08:57.415724', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyId###', 'input', 'none', '{}', 2);

-- admin_report_id=42 (2 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (257, 42, 'companyId', 'Company ID', 'number', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (258, 42, 'policyId', 'Policy ID', 'string', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyId###', 'input', 'none', '{}', 2);

-- admin_report_id=43 (2 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (259, 43, 'companyId', 'Company ID', 'number', '2026-05-08 12:09:33.433056', '2026-05-08 12:09:33.433056', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (260, 43, 'policyId', 'Policy ID', 'string', '2026-05-08 12:09:33.433056', '2026-05-08 12:09:33.433056', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyId###', 'input', 'none', '{}', 2);

-- admin_report_id=44 (1 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (261, 44, 'companyId', 'Company ID', 'number', '2026-05-08 12:09:48.874743', '2026-05-08 12:09:48.874743', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);

-- admin_report_id=45 (2 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (262, 45, 'companyId', 'Company ID', 'number', '2026-05-08 12:10:03.360642', '2026-05-08 12:10:03.360642', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (263, 45, 'search', 'Search', 'string', '2026-05-08 12:10:03.360642', '2026-05-08 12:10:03.360642', NULL, 'SYSTEM', 'SYSTEM', NULL, '###search###', 'input', 'none', '{}', 2);

-- admin_report_id=46 (6 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (264, 46, 'companyId', 'Company ID', 'number', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (265, 46, 'policyId', 'Policy ID', 'number', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyId###', 'input', 'none', '{}', 2);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (266, 46, 'startDate', 'Start Date', 'date', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, '###startDate###', 'input', 'none', '{}', 3);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (267, 46, 'endDate', 'End Date', 'date', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, '###endDate###', 'input', 'none', '{}', 4);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (268, 46, 'txnType', 'Txn Type', 'string', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, '###txnType###', 'input', 'none', '{}', 5);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (269, 46, 'search', 'Search', 'string', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, '###search###', 'input', 'none', '{}', 6);

-- admin_report_id=47 (3 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (270, 47, 'companyId', 'Company ID', 'number', '2026-05-08 12:12:27.895499', '2026-05-08 12:12:27.895499', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (278, 47, 'hrCompanyId', 'HR Company ID', 'string', '2026-05-10 12:53:19.949579', '2026-05-10 12:53:19.949579', NULL, 'SYSTEM', 'SYSTEM', NULL, '###hrCompanyId###', 'input', 'none', '{}', 11);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (279, 47, 'crmUserId', 'CRM User ID', 'string', '2026-05-10 12:53:19.949579', '2026-05-10 12:53:19.949579', NULL, 'SYSTEM', 'SYSTEM', NULL, '###crmUserId###', 'input', 'none', '{}', 10);

-- admin_report_id=48 (1 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (271, 48, 'companyId', 'Company ID', 'number', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);

-- admin_report_id=49 (1 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (272, 49, 'companyId', 'Company ID', 'number', '2026-05-08 12:12:57.608283', '2026-05-08 12:12:57.608283', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);

-- admin_report_id=50 (4 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (273, 50, 'companyId', 'Company ID', 'number', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (274, 50, 'searchTerm', 'Search', 'string', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, '###searchTerm###', 'input', 'none', '{}', 2);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (280, 50, 'hrCompanyId', 'HR Company ID', 'string', '2026-05-10 12:53:19.957649', '2026-05-10 12:53:19.957649', NULL, 'SYSTEM', 'SYSTEM', NULL, '###hrCompanyId###', 'input', 'none', '{}', 11);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (281, 50, 'crmUserId', 'CRM User ID', 'string', '2026-05-10 12:53:19.957649', '2026-05-10 12:53:19.957649', NULL, 'SYSTEM', 'SYSTEM', NULL, '###crmUserId###', 'input', 'none', '{}', 10);

-- admin_report_id=51 (4 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (275, 51, 'companyId', 'Company ID', 'number', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (276, 51, 'searchTerm', 'Search', 'string', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, '###searchTerm###', 'input', 'none', '{}', 2);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (282, 51, 'hrCompanyId', 'HR Company ID', 'string', '2026-05-10 12:53:19.960744', '2026-05-10 12:53:19.960744', NULL, 'SYSTEM', 'SYSTEM', NULL, '###hrCompanyId###', 'input', 'none', '{}', 11);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (283, 51, 'crmUserId', 'CRM User ID', 'string', '2026-05-10 12:53:19.960744', '2026-05-10 12:53:19.960744', NULL, 'SYSTEM', 'SYSTEM', NULL, '###crmUserId###', 'input', 'none', '{}', 10);

-- admin_report_id=52 (1 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (277, 52, 'companyId', 'Company ID', 'number', '2026-05-08 12:14:00.640021', '2026-05-08 12:14:00.640021', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);

-- admin_report_id=53 (4 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (285, 53, 'companyId', 'Company ID', 'number', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (286, 53, 'search', 'Search', 'string', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, '###search###', 'input', 'none', '{}', 2);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (287, 53, 'limit', 'Limit', 'number', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, '###limit###', 'input', 'none', '{}', 3);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (288, 53, 'offset', 'Offset', 'number', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, '###offset###', 'input', 'none', '{}', 4);

-- admin_report_id=54 (1 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (289, 54, 'companyId', 'Company ID', 'number', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);

-- admin_report_id=55 (1 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (290, 55, 'companyId', 'Company ID', 'number', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);

-- admin_report_id=56 (2 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (291, 56, 'companyId', 'Company ID', 'number', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, '###companyId###', 'input', 'none', '{}', 1);
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (292, 56, 'search', 'Search', 'string', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, '###search###', 'input', 'none', '{}', 2);

-- admin_report_id=57 (1 parameter(s))
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no) VALUES (293, 57, 'userId', 'User ID', 'number', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, '###userId###', 'input', 'none', '{}', 1);


-- ============================================================
-- TABLE 3: admin_reports_results_mappings
-- ============================================================

-- admin_report_id=21 (11 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (210, 21, 'inceptionPremium', 'inceptionPremium', 'Inception Premium', 'number', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (211, 21, 'additionPremium', 'additionPremium', 'Addition Premium', 'number', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (212, 21, 'deletionPremium', 'deletionPremium', 'Deletion Premium', 'number', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (213, 21, 'topUpPremium', 'topUpPremium', 'Top-Up Premium', 'number', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (214, 21, 'totalPremium', 'totalPremium', 'Total Premium', 'number', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (215, 21, 'inceptionPremiumPrevYear', 'inceptionPremiumPrevYear', 'Inception Premium (Prev Year)', 'number', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (216, 21, 'additionPremiumPrevYear', 'additionPremiumPrevYear', 'Addition Premium (Prev Year)', 'number', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (217, 21, 'deletionPremiumPrevYear', 'deletionPremiumPrevYear', 'Deletion Premium (Prev Year)', 'number', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (218, 21, 'topUpPremiumPrevYear', 'topUpPremiumPrevYear', 'Top-Up Premium (Prev Year)', 'number', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (219, 21, 'totalPremiumPrevYear', 'totalPremiumPrevYear', 'Total Premium (Prev Year)', 'number', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (220, 21, 'totalPremiumYoYChangePercent', 'totalPremiumYoYChangePercent', 'Total Premium YoY Change (%)', 'number', '2026-05-08 12:02:18.92567', '2026-05-08 12:02:18.92567', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=22 (33 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (221, 22, 'policyId', 'policyId', 'Policy ID', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (222, 22, 'policyName', 'policyName', 'Policy Name', 'string', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (223, 22, 'policyTypeKey', 'policyTypeKey', 'Policy Type Key', 'string', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (224, 22, 'insurer', 'insurer', 'Insurer', 'string', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (225, 22, 'periodStart', 'periodStart', 'Period Start', 'string', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (226, 22, 'periodEnd', 'periodEnd', 'Period End', 'string', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (227, 22, 'totalLives', 'totalLives', 'Total Lives', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (228, 22, 'employeeCount', 'employeeCount', 'Employee Count', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (229, 22, 'dependentCount', 'dependentCount', 'Dependent Count', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (230, 22, 'netPremium', 'netPremium', 'Net Premium', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (231, 22, 'cdBalance', 'cdBalance', 'CD Balance', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (232, 22, 'cdUsedAmount', 'cdUsedAmount', 'CD Used Amount', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (233, 22, 'totalClaims', 'totalClaims', 'Total Claims', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (234, 22, 'claimAmount', 'claimAmount', 'Claim Amount', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (235, 22, 'enrolledCount', 'enrolledCount', 'Enrolled Count', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (236, 22, 'enrolledPercent', 'enrolledPercent', 'Enrolled %', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (237, 22, 'inProgressCount', 'inProgressCount', 'In-Progress Count', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (238, 22, 'inProgressPercent', 'inProgressPercent', 'In-Progress %', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (239, 22, 'notEnrolledCount', 'notEnrolledCount', 'Not Enrolled Count', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (240, 22, 'notEnrolledPercent', 'notEnrolledPercent', 'Not Enrolled %', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (241, 22, 'icrPercent', 'icrPercent', 'ICR %', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (242, 22, 'icrClaimCount', 'icrClaimCount', 'ICR Claim Count', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (243, 22, 'icrSamePeriodLYPercent', 'icrSamePeriodLYPercent', 'ICR Same Period LY %', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (244, 22, 'icrSamePeriodLYAmount', 'icrSamePeriodLYAmount', 'ICR Same Period LY Amt', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (245, 22, 'icrFullYearAvgLY', 'icrFullYearAvgLY', 'ICR Full Year Avg LY', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (246, 22, 'icrYoYChangePercent', 'icrYoYChangePercent', 'ICR YoY Change %', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (247, 22, 'icrForecastPercent', 'icrForecastPercent', 'ICR Forecast %', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (248, 22, 'memberAdditions', 'memberAdditions', 'Member Additions', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (249, 22, 'memberDeletions', 'memberDeletions', 'Member Deletions', 'number', '2026-05-08 12:02:49.480869', '2026-05-08 12:02:49.480869', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (553, 22, 'iiRmTypeKey', 'iiRmTypeKey', 'IIRM Type Key', 'string', '2026-05-08 14:25:49.270863', '2026-05-08 14:25:49.270863', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (554, 22, 'earnedPremium', 'earnedPremium', 'Earned Premium', 'number', '2026-05-10 12:30:46.239664', '2026-05-10 12:30:46.239664', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (555, 22, 'tpaName', 'tpaName', 'TPA Name', 'string', '2026-05-10 12:30:46.239664', '2026-05-10 12:30:46.239664', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (556, 22, 'policyNumber', 'policyNumber', 'Policy Number', 'string', '2026-05-10 12:30:46.239664', '2026-05-10 12:30:46.239664', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');

-- admin_report_id=23 (17 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (250, 23, 'totalClaimsCount', 'totalClaimsCount', 'Total Claims Count', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (251, 23, 'totalClaimsAmount', 'totalClaimsAmount', 'Total Claims Amount', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (252, 23, 'paidClaimsAmount', 'paidClaimsAmount', 'Paid Claims Amount', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (253, 23, 'paidClaimsCount', 'paidClaimsCount', 'Paid Claims Count', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (254, 23, 'pendingClaimsAmount', 'pendingClaimsAmount', 'Pending Claims Amount', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (255, 23, 'pendingClaimsCount', 'pendingClaimsCount', 'Pending Claims Count', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (256, 23, 'claimRatioPercent', 'claimRatioPercent', 'Claim Ratio %', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (257, 23, 'totalClaimsCountPrevYear', 'totalClaimsCountPrevYear', 'Total Claims Count (Prev Year)', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (258, 23, 'totalClaimsAmountPrevYear', 'totalClaimsAmountPrevYear', 'Total Claims Amount (Prev Year)', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (259, 23, 'paidClaimsAmountPrevYear', 'paidClaimsAmountPrevYear', 'Paid Claims Amount (Prev Year)', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (260, 23, 'paidClaimsCountPrevYear', 'paidClaimsCountPrevYear', 'Paid Claims Count (Prev Year)', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (261, 23, 'pendingClaimsAmountPrevYear', 'pendingClaimsAmountPrevYear', 'Pending Claims Amount (Prev Year)', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (262, 23, 'pendingClaimsCountPrevYear', 'pendingClaimsCountPrevYear', 'Pending Claims Count (Prev Year)', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (263, 23, 'claimRatioPercentPrevYear', 'claimRatioPercentPrevYear', 'Claim Ratio % (Prev Year)', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (264, 23, 'totalClaimsAmountYoYChangePercent', 'totalClaimsAmountYoYChangePercent', 'Total Claims YoY Change (%)', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (265, 23, 'paidClaimsAmountYoYChangePercent', 'paidClaimsAmountYoYChangePercent', 'Paid Claims YoY Change (%)', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (266, 23, 'pendingClaimsAmountYoYChangePercent', 'pendingClaimsAmountYoYChangePercent', 'Pending Claims YoY Change (%)', 'number', '2026-05-08 12:03:17.876687', '2026-05-08 12:03:17.876687', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=24 (10 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (267, 24, 'month', 'month', 'Month', 'string', '2026-05-08 12:03:43.680983', '2026-05-08 12:03:43.680983', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (268, 24, 'monthStart', 'monthStart', 'Month Start', 'string', '2026-05-08 12:03:43.680983', '2026-05-08 12:03:43.680983', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (269, 24, 'cashlessAmount', 'cashlessAmount', 'Cashless Amount', 'number', '2026-05-08 12:03:43.680983', '2026-05-08 12:03:43.680983', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (270, 24, 'reimbursementAmount', 'reimbursementAmount', 'Reimbursement Amount', 'number', '2026-05-08 12:03:43.680983', '2026-05-08 12:03:43.680983', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (271, 24, 'cashlessCount', 'cashlessCount', 'Cashless Count', 'number', '2026-05-08 12:03:43.680983', '2026-05-08 12:03:43.680983', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (272, 24, 'reimbursementCount', 'reimbursementCount', 'Reimbursement Count', 'number', '2026-05-08 12:03:43.680983', '2026-05-08 12:03:43.680983', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (273, 24, 'cashlessAmountPrevYear', 'cashlessAmountPrevYear', 'Cashless Amount (Prev Year)', 'number', '2026-05-08 12:03:43.680983', '2026-05-08 12:03:43.680983', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (274, 24, 'reimbursementAmountPrevYear', 'reimbursementAmountPrevYear', 'Reimbursement Amount (Prev Year)', 'number', '2026-05-08 12:03:43.680983', '2026-05-08 12:03:43.680983', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (275, 24, 'cashlessCountPrevYear', 'cashlessCountPrevYear', 'Cashless Count (Prev Year)', 'number', '2026-05-08 12:03:43.680983', '2026-05-08 12:03:43.680983', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (276, 24, 'reimbursementCountPrevYear', 'reimbursementCountPrevYear', 'Reimbursement Count (Prev Year)', 'number', '2026-05-08 12:03:43.680983', '2026-05-08 12:03:43.680983', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=25 (7 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (277, 25, 'totalEligible', 'totalEligible', 'Total Eligible', 'number', '2026-05-08 12:04:03.096693', '2026-05-08 12:04:03.096693', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (278, 25, 'loggedIn', 'loggedIn', 'Logged In', 'number', '2026-05-08 12:04:03.096693', '2026-05-08 12:04:03.096693', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (279, 25, 'notLoggedIn', 'notLoggedIn', 'Not Logged In', 'number', '2026-05-08 12:04:03.096693', '2026-05-08 12:04:03.096693', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (280, 25, 'enrollmentConfirmed', 'enrollmentConfirmed', 'Enrollment Confirmed', 'number', '2026-05-08 12:04:03.096693', '2026-05-08 12:04:03.096693', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (281, 25, 'loggedInPercent', 'loggedInPercent', 'Logged In %', 'number', '2026-05-08 12:04:03.096693', '2026-05-08 12:04:03.096693', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (282, 25, 'notLoggedInPercent', 'notLoggedInPercent', 'Not Logged In %', 'number', '2026-05-08 12:04:03.096693', '2026-05-08 12:04:03.096693', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (283, 25, 'enrollmentConfirmedPercent', 'enrollmentConfirmedPercent', 'Enrollment Confirmed %', 'number', '2026-05-08 12:04:03.096693', '2026-05-08 12:04:03.096693', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=26 (12 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (284, 26, 'inceptionMembersTotal', 'inceptionMembersTotal', 'Inception Members Total', 'number', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (285, 26, 'inceptionEmployees', 'inceptionEmployees', 'Inception Employees', 'number', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (286, 26, 'inceptionDependents', 'inceptionDependents', 'Inception Dependents', 'number', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (287, 26, 'newAdditionsTotal', 'newAdditionsTotal', 'New Additions Total', 'number', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (288, 26, 'newAdditionsEmployees', 'newAdditionsEmployees', 'New Additions Employees', 'number', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (289, 26, 'newAdditionsDependents', 'newAdditionsDependents', 'New Additions Dependents', 'number', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (290, 26, 'deletionsTotal', 'deletionsTotal', 'Deletions Total', 'number', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (291, 26, 'deletionsEmployees', 'deletionsEmployees', 'Deletions Employees', 'number', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (292, 26, 'deletionsDependents', 'deletionsDependents', 'Deletions Dependents', 'number', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (293, 26, 'totalActiveMembers', 'totalActiveMembers', 'Total Active Members', 'number', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (294, 26, 'totalActiveEmployees', 'totalActiveEmployees', 'Total Active Employees', 'number', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (295, 26, 'totalActiveDependents', 'totalActiveDependents', 'Total Active Dependents', 'number', '2026-05-08 12:04:29.721841', '2026-05-08 12:04:29.721841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=27 (10 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (296, 27, 'employeeId', 'employeeId', 'Employee ID', 'number', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (297, 27, 'employeeCode', 'employeeCode', 'Employee Code', 'string', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (298, 27, 'employeeName', 'employeeName', 'Employee Name', 'string', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (299, 27, 'department', 'department', 'Designation / Dept', 'string', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (300, 27, 'totalClaims', 'totalClaims', 'Total Claims', 'number', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (301, 27, 'totalAmount', 'totalAmount', 'Total Amount', 'number', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (302, 27, 'totalAmountPrevYear', 'totalAmountPrevYear', 'Total Amount (Prev Year)', 'number', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (303, 27, 'rankPrevYear', 'rankPrevYear', 'Rank (Prev Year)', 'number', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (304, 27, 'rankChange', 'rankChange', 'Rank Change', 'number', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (305, 27, 'yoYChangePercent', 'yoYChangePercent', 'YoY Change (%)', 'number', '2026-05-08 12:04:47.227841', '2026-05-08 12:04:47.227841', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=28 (9 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (306, 28, 'hospitalId', 'hospitalId', 'Hospital ID', 'string', '2026-05-08 12:05:08.299731', '2026-05-08 12:05:08.299731', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (307, 28, 'hospitalName', 'hospitalName', 'Hospital Name', 'string', '2026-05-08 12:05:08.299731', '2026-05-08 12:05:08.299731', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (308, 28, 'city', 'city', 'City', 'string', '2026-05-08 12:05:08.299731', '2026-05-08 12:05:08.299731', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (309, 28, 'totalClaims', 'totalClaims', 'Total Claims', 'number', '2026-05-08 12:05:08.299731', '2026-05-08 12:05:08.299731', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (310, 28, 'totalAmount', 'totalAmount', 'Total Amount', 'number', '2026-05-08 12:05:08.299731', '2026-05-08 12:05:08.299731', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (311, 28, 'totalAmountPrevYear', 'totalAmountPrevYear', 'Total Amount (Prev Year)', 'number', '2026-05-08 12:05:08.299731', '2026-05-08 12:05:08.299731', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (312, 28, 'rankPrevYear', 'rankPrevYear', 'Rank (Prev Year)', 'number', '2026-05-08 12:05:08.299731', '2026-05-08 12:05:08.299731', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (313, 28, 'rankChange', 'rankChange', 'Rank Change', 'number', '2026-05-08 12:05:08.299731', '2026-05-08 12:05:08.299731', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (314, 28, 'yoYChangePercent', 'yoYChangePercent', 'YoY Change (%)', 'number', '2026-05-08 12:05:08.299731', '2026-05-08 12:05:08.299731', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=29 (7 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (315, 29, 'diseaseCategory', 'diseaseCategory', 'Disease Category', 'string', '2026-05-08 12:05:23.976083', '2026-05-08 12:05:23.976083', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (316, 29, 'totalClaims', 'totalClaims', 'Total Claims', 'number', '2026-05-08 12:05:23.976083', '2026-05-08 12:05:23.976083', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (317, 29, 'totalAmount', 'totalAmount', 'Total Amount', 'number', '2026-05-08 12:05:23.976083', '2026-05-08 12:05:23.976083', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (318, 29, 'totalAmountPrevYear', 'totalAmountPrevYear', 'Total Amount (Prev Year)', 'number', '2026-05-08 12:05:23.976083', '2026-05-08 12:05:23.976083', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (319, 29, 'rankPrevYear', 'rankPrevYear', 'Rank (Prev Year)', 'number', '2026-05-08 12:05:23.976083', '2026-05-08 12:05:23.976083', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (320, 29, 'rankChange', 'rankChange', 'Rank Change', 'number', '2026-05-08 12:05:23.976083', '2026-05-08 12:05:23.976083', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (321, 29, 'yoYChangePercent', 'yoYChangePercent', 'YoY Change (%)', 'number', '2026-05-08 12:05:23.976083', '2026-05-08 12:05:23.976083', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=30 (10 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (322, 30, 'policyId', 'policyId', 'Policy ID', 'number', '2026-05-08 12:05:38.20827', '2026-05-08 12:05:38.20827', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (323, 30, 'policyName', 'policyName', 'Policy Name', 'string', '2026-05-08 12:05:38.20827', '2026-05-08 12:05:38.20827', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (324, 30, 'netPremium', 'netPremium', 'Net Premium', 'number', '2026-05-08 12:05:38.20827', '2026-05-08 12:05:38.20827', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (325, 30, 'cdBalance', 'cdBalance', 'CD Balance', 'number', '2026-05-08 12:05:38.20827', '2026-05-08 12:05:38.20827', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (326, 30, 'safeLimit', 'safeLimit', 'Safe Limit (5%)', 'number', '2026-05-08 12:05:38.20827', '2026-05-08 12:05:38.20827', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (327, 30, 'usedPercent', 'usedPercent', 'Used (%)', 'number', '2026-05-08 12:05:38.20827', '2026-05-08 12:05:38.20827', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (328, 30, 'usedAmount', 'usedAmount', 'Used Amount', 'number', '2026-05-08 12:05:38.20827', '2026-05-08 12:05:38.20827', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (329, 30, 'insurer', 'insurer', 'Insurer', 'string', '2026-05-08 12:05:38.20827', '2026-05-08 12:05:38.20827', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (330, 30, 'periodStart', 'periodStart', 'Period Start', 'string', '2026-05-08 12:05:38.20827', '2026-05-08 12:05:38.20827', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (331, 30, 'periodEnd', 'periodEnd', 'Period End', 'string', '2026-05-08 12:05:38.20827', '2026-05-08 12:05:38.20827', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');

-- admin_report_id=31 (11 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (332, 31, 'claimId', 'claimId', 'Claim ID', 'number', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (333, 31, 'claimNumber', 'claimNumber', 'Claim Number', 'string', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (334, 31, 'patientName', 'patientName', 'Patient Name', 'string', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (335, 31, 'relation', 'relation', 'Relation', 'string', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (336, 31, 'hospital', 'hospital', 'Hospital', 'string', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (337, 31, 'claimDate', 'claimDate', 'Claim Date', 'date', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (338, 31, 'claimType', 'claimType', 'Claim Type', 'string', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (339, 31, 'claimedAmount', 'claimedAmount', 'Claimed Amount', 'number', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (340, 31, 'approvedAmount', 'approvedAmount', 'Approved Amount', 'number', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (341, 31, 'settlementDate', 'settlementDate', 'Settlement Date', 'date', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (342, 31, 'status', 'status', 'Status', 'string', '2026-05-08 12:06:13.348584', '2026-05-08 12:06:13.348584', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');

-- admin_report_id=32 (9 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (343, 32, 'totalEmployees', 'totalEmployees', 'Total Employees', 'number', '2026-05-08 12:06:29.443626', '2026-05-08 12:06:29.443626', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (344, 32, 'totalDependents', 'totalDependents', 'Total Dependents', 'number', '2026-05-08 12:06:29.443626', '2026-05-08 12:06:29.443626', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (345, 32, 'enrolledCount', 'enrolledCount', 'Enrolled', 'number', '2026-05-08 12:06:29.443626', '2026-05-08 12:06:29.443626', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (346, 32, 'inProgressCount', 'inProgressCount', 'In Progress', 'number', '2026-05-08 12:06:29.443626', '2026-05-08 12:06:29.443626', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (347, 32, 'notStartedCount', 'notStartedCount', 'Not Started', 'number', '2026-05-08 12:06:29.443626', '2026-05-08 12:06:29.443626', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (348, 32, 'notEnrolledCount', 'notEnrolledCount', 'Not Enrolled', 'number', '2026-05-08 12:06:29.443626', '2026-05-08 12:06:29.443626', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (349, 32, 'enrolledPercent', 'enrolledPercent', 'Enrolled (%)', 'number', '2026-05-08 12:06:29.443626', '2026-05-08 12:06:29.443626', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (350, 32, 'inProgressPercent', 'inProgressPercent', 'In Progress (%)', 'number', '2026-05-08 12:06:29.443626', '2026-05-08 12:06:29.443626', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (351, 32, 'notStartedPercent', 'notStartedPercent', 'Not Started (%)', 'number', '2026-05-08 12:06:29.443626', '2026-05-08 12:06:29.443626', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=33 (8 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (352, 33, 'policyId', 'policyId', 'Policy ID', 'number', '2026-05-08 12:06:45.937996', '2026-05-08 12:06:45.937996', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (353, 33, 'policyName', 'policyName', 'Policy Name', 'string', '2026-05-08 12:06:45.937996', '2026-05-08 12:06:45.937996', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (354, 33, 'policyTypeKey', 'policyTypeKey', 'Policy Type', 'string', '2026-05-08 12:06:45.937996', '2026-05-08 12:06:45.937996', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (355, 33, 'policyNumber', 'policyNumber', 'Policy Number', 'string', '2026-05-08 12:06:45.937996', '2026-05-08 12:06:45.937996', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (356, 33, 'periodStart', 'periodStart', 'Period Start', 'string', '2026-05-08 12:06:45.937996', '2026-05-08 12:06:45.937996', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (357, 33, 'periodEnd', 'periodEnd', 'Period End', 'string', '2026-05-08 12:06:45.937996', '2026-05-08 12:06:45.937996', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (358, 33, 'netPremium', 'netPremium', 'Net Premium', 'number', '2026-05-08 12:06:45.937996', '2026-05-08 12:06:45.937996', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (359, 33, 'totalLives', 'totalLives', 'Total Lives', 'number', '2026-05-08 12:06:45.937996', '2026-05-08 12:06:45.937996', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=40 (2 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (428, 40, 'totalEndorsements', 'totalEndorsements', 'Total Endorsements', 'number', '2026-05-08 12:08:57.413819', '2026-05-08 12:08:57.413819', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (429, 40, 'netGrossPremium', 'netGrossPremium', 'Net Gross Premium', 'number', '2026-05-08 12:08:57.413819', '2026-05-08 12:08:57.413819', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=41 (8 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (430, 41, 'employeesAtInception', 'employeesAtInception', 'Employees at Inception', 'number', '2026-05-08 12:08:57.415724', '2026-05-08 12:08:57.415724', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (431, 41, 'employeesInAddition', 'employeesInAddition', 'Employees in Addition', 'number', '2026-05-08 12:08:57.415724', '2026-05-08 12:08:57.415724', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (432, 41, 'employeesInDeletion', 'employeesInDeletion', 'Employees in Deletion', 'number', '2026-05-08 12:08:57.415724', '2026-05-08 12:08:57.415724', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (433, 41, 'activeEmployees', 'activeEmployees', 'Active Employees', 'number', '2026-05-08 12:08:57.415724', '2026-05-08 12:08:57.415724', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (434, 41, 'livesAtInception', 'livesAtInception', 'Lives at Inception', 'number', '2026-05-08 12:08:57.415724', '2026-05-08 12:08:57.415724', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (435, 41, 'livesInAddition', 'livesInAddition', 'Lives in Addition', 'number', '2026-05-08 12:08:57.415724', '2026-05-08 12:08:57.415724', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (436, 41, 'livesInDeletion', 'livesInDeletion', 'Lives in Deletion', 'number', '2026-05-08 12:08:57.415724', '2026-05-08 12:08:57.415724', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (437, 41, 'activeLives', 'activeLives', 'Active Lives', 'number', '2026-05-08 12:08:57.415724', '2026-05-08 12:08:57.415724', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=42 (13 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (438, 42, 'endorsementId', 'endorsementId', 'Endorsement ID', 'number', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (439, 42, 'policyId', 'policyId', 'Policy ID', 'number', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (440, 42, 'policyNumber', 'policyNumber', 'Policy Number', 'string', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (441, 42, 'endorsementType', 'endorsementType', 'Endorsement Type', 'string', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (442, 42, 'enrollmentStartDate', 'enrollmentStartDate', 'Enrollment Start', 'string', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (443, 42, 'enrollmentEndDate', 'enrollmentEndDate', 'Enrollment End', 'string', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (444, 42, 'createdAt', 'createdAt', 'Created At', 'string', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (445, 42, 'osTicketNumber', 'osTicketNumber', 'OS Ticket Number', 'string', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (446, 42, 'endorsementStatus', 'endorsementStatus', 'Endorsement Status', 'string', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (447, 42, 'uploadCount', 'uploadCount', 'Upload Count', 'number', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (448, 42, 'totalSuccessCount', 'totalSuccessCount', 'Total Success Count', 'number', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (449, 42, 'totalErrorCount', 'totalErrorCount', 'Total Error Count', 'number', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (450, 42, 'totalProcessCount', 'totalProcessCount', 'Total Process Count', 'number', '2026-05-08 12:09:18.263787', '2026-05-08 12:09:18.263787', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=43 (3 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (451, 43, 'componentKey', 'componentKey', 'Component Key', 'string', '2026-05-08 12:09:33.433056', '2026-05-08 12:09:33.433056', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (452, 43, 'componentLabel', 'componentLabel', 'Component Label', 'string', '2026-05-08 12:09:33.433056', '2026-05-08 12:09:33.433056', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (453, 43, 'amount', 'amount', 'Amount', 'number', '2026-05-08 12:09:33.433056', '2026-05-08 12:09:33.433056', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=44 (8 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (454, 44, 'totalDepositBalance', 'totalDepositBalance', 'Total Deposit Balance', 'number', '2026-05-08 12:09:48.874743', '2026-05-08 12:09:48.874743', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (455, 44, 'activeCdAccountsCount', 'activeCdAccountsCount', 'Active CD Accounts Count', 'number', '2026-05-08 12:09:48.874743', '2026-05-08 12:09:48.874743', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (456, 44, 'utilisedAmount', 'utilisedAmount', 'Utilised Amount', 'number', '2026-05-08 12:09:48.874743', '2026-05-08 12:09:48.874743', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (457, 44, 'utilisedPercent', 'utilisedPercent', 'Utilised Percent', 'number', '2026-05-08 12:09:48.874743', '2026-05-08 12:09:48.874743', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (458, 44, 'lastDepositDate', 'lastDepositDate', 'Last Deposit Date', 'string', '2026-05-08 12:09:48.874743', '2026-05-08 12:09:48.874743', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (459, 44, 'lastDepositAmount', 'lastDepositAmount', 'Last Deposit Amount', 'number', '2026-05-08 12:09:48.874743', '2026-05-08 12:09:48.874743', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (460, 44, 'lastDepositBank', 'lastDepositBank', 'Last Deposit Bank', 'string', '2026-05-08 12:09:48.874743', '2026-05-08 12:09:48.874743', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (461, 44, 'balanceTrendData', 'balanceTrendData', 'Balance Trend Data', 'string', '2026-05-08 12:09:48.874743', '2026-05-08 12:09:48.874743', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');

-- admin_report_id=45 (9 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (462, 45, 'cdAccountId', 'cdAccountId', 'CD Account ID', 'number', '2026-05-08 12:10:03.360642', '2026-05-08 12:10:03.360642', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (463, 45, 'cdAccountNumber', 'cdAccountNumber', 'CD Account Number', 'string', '2026-05-08 12:10:03.360642', '2026-05-08 12:10:03.360642', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (464, 45, 'cdAccountName', 'cdAccountName', 'CD Account Name', 'string', '2026-05-08 12:10:03.360642', '2026-05-08 12:10:03.360642', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (465, 45, 'policyNumber', 'policyNumber', 'Policy Number', 'string', '2026-05-08 12:10:03.360642', '2026-05-08 12:10:03.360642', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (466, 45, 'policyId', 'policyId', 'Policy ID', 'number', '2026-05-08 12:10:03.360642', '2026-05-08 12:10:03.360642', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (467, 45, 'depositBalance', 'depositBalance', 'Deposit Balance', 'number', '2026-05-08 12:10:03.360642', '2026-05-08 12:10:03.360642', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (468, 45, 'utilisedAmount', 'utilisedAmount', 'Utilised Amount', 'number', '2026-05-08 12:10:03.360642', '2026-05-08 12:10:03.360642', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (469, 45, 'utilisationPercent', 'utilisationPercent', 'Utilisation Percent', 'number', '2026-05-08 12:10:03.360642', '2026-05-08 12:10:03.360642', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (470, 45, 'lastUpdated', 'lastUpdated', 'Last Updated', 'string', '2026-05-08 12:10:03.360642', '2026-05-08 12:10:03.360642', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');

-- admin_report_id=46 (15 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (471, 46, 'txnId', 'txnId', 'Transaction ID', 'number', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (472, 46, 'txnDate', 'txnDate', 'Transaction Date', 'string', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (473, 46, 'txnType', 'txnType', 'Transaction Type', 'string', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (474, 46, 'amount', 'amount', 'Amount', 'number', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (475, 46, 'policyNumber', 'policyNumber', 'Policy Number', 'string', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (476, 46, 'bankName', 'bankName', 'Bank Name', 'string', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (477, 46, 'referenceId', 'referenceId', 'Reference ID', 'string', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (478, 46, 'runningBalance', 'runningBalance', 'Running Balance', 'string', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (479, 46, 'endorsementNumber', 'endorsementNumber', 'Endorsement Number', 'string', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (480, 46, 'endorsementType', 'endorsementType', 'Endorsement Type', 'string', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (481, 46, 'transactionValueDate', 'transactionValueDate', 'Transaction Value Date', 'string', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (482, 46, 'createdBy', 'createdBy', 'Created By', 'string', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (483, 46, 'remarks', 'remarks', 'Remarks', 'string', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (484, 46, 'ifscCode', 'ifscCode', 'IFSC Code', 'string', '2026-05-08 12:10:14.870678', '2026-05-08 12:10:14.870678', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (558, 46, 'cdAccountNumber', 'cdAccountNumber', 'CD Account Number', 'string', '2026-05-12 12:21:32.259252', '2026-05-12 12:21:32.259252', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');

-- admin_report_id=47 (6 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (485, 47, 'totalCompanies', 'totalCompanies', 'Total Companies', 'number', '2026-05-08 12:12:27.895499', '2026-05-08 12:12:27.895499', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (486, 47, 'totalPolicies', 'totalPolicies', 'Total Policies', 'number', '2026-05-08 12:12:27.895499', '2026-05-08 12:12:27.895499', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (487, 47, 'activePolicies', 'activePolicies', 'Active Policies', 'number', '2026-05-08 12:12:27.895499', '2026-05-08 12:12:27.895499', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (488, 47, 'inactivePolicies', 'inactivePolicies', 'Inactive Policies', 'number', '2026-05-08 12:12:27.895499', '2026-05-08 12:12:27.895499', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (489, 47, 'totalLives', 'totalLives', 'Total Lives', 'number', '2026-05-08 12:12:27.895499', '2026-05-08 12:12:27.895499', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (490, 47, 'totalPremium', 'totalPremium', 'Total Premium', 'number', '2026-05-08 12:12:27.895499', '2026-05-08 12:12:27.895499', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=48 (14 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (491, 48, 'companyId', 'companyId', 'Company ID', 'number', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (492, 48, 'companyName', 'companyName', 'Company', 'string', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (493, 48, 'industry', 'industry', 'Industry', 'string', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (494, 48, 'city', 'city', 'City', 'string', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (495, 48, 'state', 'state', 'State', 'string', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (496, 48, 'employeeCount', 'employeeCount', 'Employees', 'number', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (497, 48, 'rmName', 'rmName', 'RM', 'string', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (498, 48, 'groupId', 'groupId', 'Group ID', 'number', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (499, 48, 'groupName', 'groupName', 'Group', 'string', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (500, 48, 'groupSector', 'groupSector', 'Sector', 'string', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (501, 48, 'companyRole', 'companyRole', 'Role', 'string', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (502, 48, 'policyCount', 'policyCount', 'Policies', 'number', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (503, 48, 'activePolicyCount', 'activePolicyCount', 'Active Policies', 'number', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (504, 48, 'inactivePolicyCount', 'inactivePolicyCount', 'Inactive Policies', 'number', '2026-05-08 12:12:43.528698', '2026-05-08 12:12:43.528698', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=49 (10 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (505, 49, 'policyId', 'policyId', 'Policy ID', 'number', '2026-05-08 12:12:57.608283', '2026-05-08 12:12:57.608283', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (506, 49, 'companyId', 'companyId', 'Company ID', 'number', '2026-05-08 12:12:57.608283', '2026-05-08 12:12:57.608283', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (507, 49, 'policyTypeCode', 'policyTypeCode', 'Type Code', 'string', '2026-05-08 12:12:57.608283', '2026-05-08 12:12:57.608283', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (508, 49, 'policyTypeName', 'policyTypeName', 'Policy Type', 'string', '2026-05-08 12:12:57.608283', '2026-05-08 12:12:57.608283', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (509, 49, 'insurerName', 'insurerName', 'Insurer', 'string', '2026-05-08 12:12:57.608283', '2026-05-08 12:12:57.608283', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (510, 49, 'policyNumber', 'policyNumber', 'Policy No.', 'string', '2026-05-08 12:12:57.608283', '2026-05-08 12:12:57.608283', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (511, 49, 'premiumAmount', 'premiumAmount', 'Premium', 'number', '2026-05-08 12:12:57.608283', '2026-05-08 12:12:57.608283', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (512, 49, 'startDate', 'startDate', 'Start Date', 'string', '2026-05-08 12:12:57.608283', '2026-05-08 12:12:57.608283', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (513, 49, 'endDate', 'endDate', 'End Date', 'string', '2026-05-08 12:12:57.608283', '2026-05-08 12:12:57.608283', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (514, 49, 'policyStatus', 'policyStatus', 'Status', 'string', '2026-05-08 12:12:57.608283', '2026-05-08 12:12:57.608283', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');

-- admin_report_id=50 (14 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (515, 50, 'companyId', 'companyId', 'Company ID', 'number', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (516, 50, 'companyName', 'companyName', 'Company', 'string', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (517, 50, 'industry', 'industry', 'Industry', 'string', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (518, 50, 'city', 'city', 'City', 'string', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (519, 50, 'state', 'state', 'State', 'string', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (520, 50, 'employeeCount', 'employeeCount', 'Employees', 'number', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (521, 50, 'rmName', 'rmName', 'RM', 'string', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (522, 50, 'groupId', 'groupId', 'Group ID', 'number', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (523, 50, 'groupName', 'groupName', 'Group', 'string', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (524, 50, 'groupSector', 'groupSector', 'Sector', 'string', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (525, 50, 'companyRole', 'companyRole', 'Role', 'string', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (526, 50, 'policyCount', 'policyCount', 'Policies', 'number', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (527, 50, 'activePolicyCount', 'activePolicyCount', 'Active Policies', 'number', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (528, 50, 'inactivePolicyCount', 'inactivePolicyCount', 'Inactive Policies', 'number', '2026-05-08 12:13:12.829517', '2026-05-08 12:13:12.829517', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=51 (14 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (529, 51, 'companyId', 'companyId', 'Company ID', 'number', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (530, 51, 'companyName', 'companyName', 'Company', 'string', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (531, 51, 'industry', 'industry', 'Industry', 'string', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (532, 51, 'city', 'city', 'City', 'string', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (533, 51, 'state', 'state', 'State', 'string', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (534, 51, 'employeeCount', 'employeeCount', 'Employees', 'number', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (535, 51, 'rmName', 'rmName', 'RM', 'string', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (536, 51, 'groupId', 'groupId', 'Group ID', 'number', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (537, 51, 'groupName', 'groupName', 'Group', 'string', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (538, 51, 'groupSector', 'groupSector', 'Sector', 'string', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (539, 51, 'companyRole', 'companyRole', 'Role', 'string', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (540, 51, 'policyCount', 'policyCount', 'Policies', 'number', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (541, 51, 'activePolicyCount', 'activePolicyCount', 'Active Policies', 'number', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (542, 51, 'inactivePolicyCount', 'inactivePolicyCount', 'Inactive Policies', 'number', '2026-05-08 12:13:33.885964', '2026-05-08 12:13:33.885964', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');

-- admin_report_id=52 (11 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (543, 52, 'policyId', 'policyId', 'Policy ID', 'number', '2026-05-08 12:14:00.640021', '2026-05-08 12:14:00.640021', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (544, 52, 'companyId', 'companyId', 'Company ID', 'number', '2026-05-08 12:14:00.640021', '2026-05-08 12:14:00.640021', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (545, 52, 'policyTypeCode', 'policyTypeCode', 'Type Code', 'string', '2026-05-08 12:14:00.640021', '2026-05-08 12:14:00.640021', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (546, 52, 'policyTypeName', 'policyTypeName', 'Policy Type', 'string', '2026-05-08 12:14:00.640021', '2026-05-08 12:14:00.640021', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (547, 52, 'insurerName', 'insurerName', 'Insurer', 'string', '2026-05-08 12:14:00.640021', '2026-05-08 12:14:00.640021', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (548, 52, 'policyNumber', 'policyNumber', 'Policy No.', 'string', '2026-05-08 12:14:00.640021', '2026-05-08 12:14:00.640021', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (549, 52, 'premiumAmount', 'premiumAmount', 'Premium', 'number', '2026-05-08 12:14:00.640021', '2026-05-08 12:14:00.640021', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (550, 52, 'startDate', 'startDate', 'Start Date', 'string', '2026-05-08 12:14:00.640021', '2026-05-08 12:14:00.640021', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (551, 52, 'endDate', 'endDate', 'End Date', 'string', '2026-05-08 12:14:00.640021', '2026-05-08 12:14:00.640021', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (552, 52, 'policyStatus', 'policyStatus', 'Status', 'string', '2026-05-08 12:14:00.640021', '2026-05-08 12:14:00.640021', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (557, 52, 'tpaName', 'tpaName', 'TPA', 'string', '2026-05-11 14:59:19.630154', '2026-05-11 14:59:19.630154', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');

-- admin_report_id=53 (13 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (559, 53, 'employeeId', 'employeeId', 'Employee ID', 'number', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (560, 53, 'companyEmployeeId', 'companyEmployeeId', 'Company Employee ID', 'string', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (561, 53, 'employeeName', 'employeeName', 'Employee Name', 'string', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (562, 53, 'fullName', 'fullName', 'Full Name', 'string', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (563, 53, 'email', 'email', 'Email', 'string', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (564, 53, 'gender', 'gender', 'Gender', 'string', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (565, 53, 'dateOfBirth', 'dateOfBirth', 'Date Of Birth', 'date', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (566, 53, 'mobile', 'mobile', 'Mobile', 'string', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (567, 53, 'enrollStatus', 'enrollStatus', 'Enroll Status', 'string', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (568, 53, 'sumInsured', 'sumInsured', 'Sum Insured', 'number', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (569, 53, 'dependentsCount', 'dependentsCount', 'Dependents Count', 'number', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (570, 53, 'ecardKey', 'ecardKey', 'E-Card Key', 'string', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (571, 53, 'lastLoginAt', 'lastLoginAt', 'Last Login At', 'date', '2026-05-12 12:21:56.188796', '2026-05-12 12:21:56.188796', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');

-- admin_report_id=54 (2 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (572, 54, 'id', 'id', 'ID', 'number', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (573, 54, 'name', 'name', 'Policy Name', 'string', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');

-- admin_report_id=55 (2 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (574, 55, 'id', 'id', 'ID', 'number', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (594, 55, 'addr_1', 'addr1', 'Address', 'string', '2026-05-13 12:47:53.882778', '2026-05-13 12:47:53.882778', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');

-- admin_report_id=56 (9 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (576, 56, 'hr_management_id', 'hrManagementId', 'HR Management ID', 'number', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (577, 56, 'user_id', 'userId', 'User ID', 'number', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (578, 56, 'full_name', 'fullName', 'Full Name', 'string', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (579, 56, 'email', 'email', 'Email', 'string', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (580, 56, 'role_key', 'roleKey', 'Role Key', 'string', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (581, 56, 'company_name', 'companyName', 'Company Name', 'string', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (582, 56, 'company_id', 'companyId', 'Company ID', 'number', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (583, 56, 'policy_count', 'policyCount', 'Policy Count', 'number', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (584, 56, 'created_at', 'createdAt', 'Created At', 'string', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');

-- admin_report_id=57 (11 mapping(s))
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (585, 57, 'hr_management_id', 'hrManagementId', 'HR Management ID', 'number', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (586, 57, 'user_id', 'userId', 'User ID', 'number', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (587, 57, 'full_name', 'fullName', 'Full Name', 'string', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (588, 57, 'email', 'email', 'Email', 'string', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (589, 57, 'role_key', 'roleKey', 'Role Key', 'string', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (590, 57, 'company_id', 'companyId', 'Company ID', 'number', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'right');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (591, 57, 'company_name', 'companyName', 'Company Name', 'string', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (592, 57, 'policies', 'policies', 'Policies', 'string', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (593, 57, 'locations', 'locations', 'Locations', 'string', '2026-05-13 12:11:21.843585', '2026-05-13 12:11:21.843585', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (596, 57, 'phone_number', 'phoneNumber', 'Phone', 'string', '2026-05-13 13:10:24.210286', '2026-05-13 13:10:24.210286', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');
INSERT INTO public.admin_reports_results_mappings (id, admin_report_id, query_parameter_name, variable_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, alignment) VALUES (597, 57, 'date_of_birth', 'dateOfBirth', 'Date of Birth', 'string', '2026-05-13 13:10:24.210286', '2026-05-13 13:10:24.210286', NULL, 'SYSTEM', 'SYSTEM', NULL, 'left');




DO $$
DECLARE
  report_id INT;
BEGIN
  SELECT id INTO report_id FROM admin_reports WHERE name = 'dashboard_policy_cards';
  IF report_id IS NULL THEN
    RAISE NOTICE 'dashboard_policy_cards not found — skipping ICR renewal LY fix';
    RETURN;
  END IF;

  UPDATE admin_reports SET query = $newq$
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
  -- Resolve the renewal chain: current policy → opportunity → previous policy.
  -- Only rows where opp.ref_policy_id IS NOT NULL (i.e. actual renewal policies).
  -- First-time policies produce no row here; all LY values default to 0 via LEFT JOIN.
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
  -- Same-elapsed-period claims on the PREVIOUS policy (the real LY entity).
  -- Window: prev_policy_from → LEAST(prev_policy_to, prev_policy_from + elapsed_days)
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
  -- Full previous policy year: prev_policy_from → prev_policy_to.
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
    COALESCE(SUM(cd.balance_amount), 0) AS available_amount,
    0::numeric                           AS used_amount
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  WHERE cd.company_id = ###companyId###
    AND cd.status = 'ACTIVE'
  GROUP BY cdpm.policy_id
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
  WHERE cd.company_id = ###companyId###
    AND cd.status = 'ACTIVE'
  ORDER BY cdpm.policy_id, cdt.transaction_date DESC, cdt.id DESC
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
  COALESCE(pcrb.running_balance, pcd.available_amount, 0)                                  AS "cdRunningBalance",
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
  -- LY same-period ICR: claims on prev policy for same elapsed days / prev policy net_premium
  ROUND(
    COALESCE(pcsply.claim_amount_sply, 0) * 100.0
    / NULLIF(COALESCE(pcsply.prev_net_premium, p.net_premium), 0),
    1
  )                                                                                        AS "icrSamePeriodLYPercent",
  COALESCE(pcsply.claim_amount_sply, 0)                                                    AS "icrSamePeriodLYAmount",
  -- Full LY ICR: total claims on prev policy for its full period / prev policy net_premium
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
LEFT JOIN policy_insurer pi            ON pi.policy_id = p.id
LEFT JOIN policy_tpa pt                ON pt.policy_id = p.id
LEFT JOIN policy_activity pa           ON pa.policy_id = p.id
WHERE p.company_id = ###companyId###
  AND (
    ###policyType### = ''
    OR (###policyType### = 'INACTIVE' AND p.policy_to < CURRENT_DATE)
    OR (###policyType### != 'INACTIVE' AND ld.lookup_key = ###policyType###)
  )
  AND (###externalHrUserId### IS NULL
       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER))
ORDER BY ld.lookup_key, p.policy_name
$newq$
  WHERE id = report_id;

  -- Register externalHrUserId parameter (idempotent)
  INSERT INTO admin_reports_parameters (
    admin_report_id, parameter_name, label, query_parameter, data_type,
    created_by, updated_by, input_field_type, option_type, option, order_no
  ) VALUES (
    report_id, 'externalHrUserId', 'External HR User ID', '###externalHrUserId###', 'number',
    'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 99
  )
  ON CONFLICT (admin_report_id, parameter_name) DO NOTHING;

  RAISE NOTICE 'dashboard_policy_cards: ICR LY fixed via renewal chain (prev_policy CTE). externalHrUserId scoping included.';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify patch
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  CASE
    WHEN query LIKE '%prev_policy AS%'
     AND query LIKE '%opp.ref_policy_id%'
     AND query LIKE '%externalHrUserId%'
    THEN 'OK — renewal chain LY fix applied'
    ELSE 'PATCH DID NOT APPLY — check for errors above'
  END AS patch_status
FROM admin_reports
WHERE name = 'dashboard_policy_cards';





---- HR USER Management scripts 


--
-- Data for Name: hr_user_management; Type: TABLE DATA; Schema: public; Owner: iirm20251211
--



CREATE TABLE public.hr_user_management (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    user_name           VARCHAR(255),
    email_id            VARCHAR(255),
    phone_number        VARCHAR(50),

    -- Roles:
    -- HR_ADMIN
    -- EXTERNAL_HR
    role_key            VARCHAR(100) NOT NULL DEFAULT 'HR_ADMIN',

    company_id          BIGINT,
    company_name        VARCHAR(255),

    date_of_birth       DATE,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_by          BIGINT,
    updated_by          BIGINT,

    deleted_at          TIMESTAMPTZ,

    CONSTRAINT fk_hr_user_management_user
        FOREIGN KEY (user_id)
        REFERENCES public.users(id)
);

-- =========================================
-- COMMENTS
-- =========================================

COMMENT ON TABLE public.hr_user_management IS
'HR portal access registry for IBP. Presence in this table grants HR portal access. Supports HR_ADMIN and EXTERNAL_HR roles.';

COMMENT ON COLUMN public.hr_user_management.role_key IS
'Supported roles: HR_ADMIN, EXTERNAL_HR';

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX idx_hr_user_management_email_id
ON public.hr_user_management(email_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_hr_user_management_company_id
ON public.hr_user_management(company_id);

CREATE INDEX idx_hr_user_management_role_key
ON public.hr_user_management(role_key);

CREATE UNIQUE INDEX uq_hr_user_management_user_id_active
ON public.hr_user_management(user_id)
WHERE deleted_at IS NULL;






-- INSERT INTO public.hr_user_management (id, user_id, user_name, email_id, phone_number, role_key, company_id, company_name, created_at, updated_at, created_by, updated_by, deleted_at, date_of_birth) 
-- VALUES (1, 292372, 'Kapil', 'kapildikshit@indiainsure.comdummy2', '9000000020', 'PORTAL_CRM', 344192, 'Divami test', 
-- '2026-05-09 07:20:04.258199+00', '2026-05-09 07:20:04.258199+00', 1, NULL, NULL, NULL);


ALTER TABLE policy_enrollment_employee
ADD COLUMN policy_location VARCHAR(255);



-- external_hr_policy_map
-- Maps an external-HR user to one or more policies within a company.
CREATE TABLE IF NOT EXISTS external_hr_policy_map (
  id          SERIAL        PRIMARY KEY,
  user_id     INTEGER       NOT NULL REFERENCES users(id),
  policy_id   INTEGER       NOT NULL,
  company_id  INTEGER       NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ext_hr_policy_map_user_policy
  ON external_hr_policy_map (user_id, policy_id);
CREATE INDEX IF NOT EXISTS idx_ext_hr_policy_map_user_id
  ON external_hr_policy_map (user_id);
CREATE INDEX IF NOT EXISTS idx_ext_hr_policy_map_company_id
  ON external_hr_policy_map (company_id);

-- external_hr_location_map
-- Maps an external-HR user to one or more company locations (addresses).
CREATE TABLE IF NOT EXISTS external_hr_location_map (
  id          SERIAL        PRIMARY KEY,
  user_id     INTEGER       NOT NULL REFERENCES users(id),
  address_id  INTEGER       NOT NULL,
  company_id  INTEGER       NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ext_hr_location_map_user_address
  ON external_hr_location_map (user_id, address_id);
CREATE INDEX IF NOT EXISTS idx_ext_hr_location_map_user_id
  ON external_hr_location_map (user_id);
CREATE INDEX IF NOT EXISTS idx_ext_hr_location_map_company_id
  ON external_hr_location_map (company_id);




INSERT INTO group_company_map (
    company_id,
    group_company_id
)
VALUES
    (364729, 343048),
    (343574, 343048),
    (343049, 343048),
	(343047, 343048),
	(190550, 343048),
	(160696, 343048),
	(70013, 343048),
	(68613, 343048),
	(41571, 343048),
	(36980, 343048),
	(27845, 343048),
    (27320, 343048);


--
-- PostgreSQL database dump complete
--











