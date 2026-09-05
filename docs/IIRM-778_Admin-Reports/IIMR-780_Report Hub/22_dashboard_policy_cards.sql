-- ============================================================================
-- Report: Dashboard Policy Cards
-- name (used in URL/endpoint): dashboard_policy_cards    |    id: 22    |    order_no: 21
-- end_point: dashboard_policy_cards
-- created_at: 2026-05-08 12:02:49.480869    updated_at: 2026-06-30 13:31:18.420917
-- Pulled directly from production 2026-07-23. See IIRM-780_Report-Hub-PRD.md for the
-- functional description and product-level context for this report.
-- ============================================================================
-- HOW TO CHANGE THIS REPORT
-- 1. Edit the query in section 1, then push it with the UPDATE template there.
-- 2. If you add/remove/rename an output column (an `AS "..."` alias in the SELECT),
--    you MUST also update admin_reports_results_mappings (section 3) --
--    query_parameter_name there must match your alias exactly, or that column
--    silently falls back to a raw, unlabelled header. (This has already happened
--    on two other reports in this set -- see their KNOWN ISSUES sections.)
-- 3. If you add a new ###Token### filter, insert a matching row into
--    admin_reports_parameters (section 2) -- query_parameter there must match
--    the token text in the query exactly, including the ### on both sides.
-- 4. Existing filters follow one of two safe patterns -- keep whichever this
--    report already uses unless you're deliberately changing its behavior:
--      optional:  col = COALESCE(###Token###, col)
--      optional (dates): (###Token### IS NULL OR col::date >= ###Token###::date)
--      mandatory: col = ###Token###   <- returns ZERO rows if the filter is unset
-- ============================================================================

-- ------------------------------------------------------------------
-- 1. MAIN QUERY  (admin_reports.query, id = 22)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH

loc_filter AS (
  SELECT NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL AS is_all
),
loc_id_set AS (
  SELECT val::INTEGER AS loc_id
  FROM regexp_split_to_table(
    COALESCE(NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ''),
    ','
  ) AS val
  WHERE val ~ '^\d+$'
),

company_policies AS MATERIALIZED (
  SELECT
    p.id                   AS policy_id,
    p.policy_from,
    p.policy_to,
    p.net_premium,
    p.opportunity_id,
    p.policy_name,
    p.insurer_policy_number,
    p.policy_type_lid,
    ld.lookup_key          AS policy_type_key,
    iirm_ld.lookup_key     AS iirm_type_key,
    iirm_ld.value          AS iirm_type_value
  FROM policy p
  INNER JOIN lookup_data ld
         ON  ld.id          = p.policy_type_lid
         AND ld.deleted_at  IS NULL
  LEFT  JOIN policy_type_segregation pts
         ON  pts.policy_type_lid = p.policy_type_lid
  LEFT  JOIN lookup_data iirm_ld
         ON  iirm_ld.id         = pts.iirm_policy_type_lid
         AND iirm_ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '' OR p.id::text = ###policyId###)
    AND (
      ###policyId### != ''
      OR (COALESCE(###policyStatus###, '') IN ('', 'ACTIVE') AND p.policy_to >= CURRENT_DATE)
      OR (###policyStatus### = 'INACTIVE'                    AND p.policy_to <  CURRENT_DATE)
    )
    AND (p.is_installment_policy IS NULL OR NOT EXISTS (
      SELECT 1 FROM lookup_data inst_ld
      WHERE inst_ld.id          = p.is_installment_policy
        AND inst_ld.lookup_key  = 'TOGGLE_TYPE_YES'
        AND inst_ld.deleted_at  IS NULL
    ))
    AND (###externalHrUserId### IS NULL
         OR p.id IN (
           SELECT policy_id FROM external_hr_policy_map
           WHERE  hr_management_id = ###externalHrUserId###::INTEGER
         ))
    AND (
      ###policyType### = ''
      OR (###policyType### = 'LIFE'
          AND (lower(iirm_ld.value) LIKE '%life%' OR lower(iirm_ld.value) LIKE '%health%')
          AND  lower(iirm_ld.value) NOT LIKE '%non-life%')
      OR (###policyType### = 'NON_LIFE'
          AND lower(iirm_ld.value) NOT LIKE '%life%'
          AND lower(iirm_ld.value) NOT LIKE '%health%')
      OR (###policyType### NOT IN ('', 'LIFE', 'NON_LIFE')
          AND ld.lookup_key = ###policyType###)
    )
),

loc_employees AS MATERIALIZED (
  SELECT pee.id AS employee_id
  FROM policy_enrollment_employee pee
  WHERE pee.deleted_at IS NULL
    AND NOT (SELECT is_all FROM loc_filter)
    AND pee.policy_config_location_id IN (
      SELECT cpcl_loc.id
      FROM company_policy_configuration_location cpcl_loc
      WHERE cpcl_loc.address_id IN (SELECT loc_id FROM loc_id_set)
    )
),

employee_policy_base AS MATERIALIZED (
  SELECT
    peepm.id,
    peepm.policy_id,
    peepm.employee_id,
    peepm.endorsement_addition_batch_id,
    peepm.enrollment_deletion_batch_id,
    peepm.created_at,
    peepm.updated_at,
    cp.policy_from,
    cp.policy_to
  FROM policy_enrollment_employee_policy_map peepm
  INNER JOIN company_policies cp ON cp.policy_id = peepm.policy_id
  WHERE peepm.deleted_at IS NULL
),

loc_policies AS (
  SELECT DISTINCT epb.policy_id
  FROM employee_policy_base epb
  INNER JOIN loc_employees le ON le.employee_id = epb.employee_id
),

loc_premium_ratios AS (
  SELECT
    epb.policy_id,
    COUNT(DISTINCT le.employee_id)::numeric  AS loc_emp_count,
    COUNT(DISTINCT epb.employee_id)::numeric AS total_emp_count
  FROM employee_policy_base epb
  LEFT JOIN loc_employees le ON le.employee_id = epb.employee_id
  WHERE NOT (SELECT is_all FROM loc_filter)
    AND epb.policy_id IN (SELECT policy_id FROM loc_policies)
  GROUP BY epb.policy_id
),

company_logged_in_users AS MATERIALIZED (
  -- EXISTS stops at the first matching login per employee (index early-exit).
  -- Old JOIN pulled ALL login records then ran DISTINCT — far more rows for large policies.
  SELECT emp.employee_id AS user_id
  FROM (SELECT DISTINCT employee_id FROM employee_policy_base) emp
  WHERE EXISTS (
    SELECT 1 FROM user_activity_log ual
    WHERE ual.user_id           = emp.employee_id
      AND ual.activity_key      = 'LOGGED_IN'
      AND ual.activity_category = 'AUTH'
      AND ual.deleted_at        IS NULL
  )
),

policy_people_stats AS MATERIALIZED (
  SELECT
    epb.policy_id,
    COUNT(DISTINCT epb.employee_id) FILTER (
      WHERE (SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL
    )                                                                         AS employee_count,
    COUNT(DISTINCT epb.employee_id) FILTER (
      WHERE ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
        AND clu.user_id IS NOT NULL
    )                                                                         AS logged_in_count,
    COUNT(DISTINCT epb.employee_id) FILTER (
      WHERE ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
        AND clu.user_id IS NULL
    )                                                                         AS not_logged_in_count,
    COUNT(epb.id) FILTER (
      WHERE ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
        AND epb.endorsement_addition_batch_id IS NOT NULL
        AND epb.created_at BETWEEN epb.policy_from AND epb.policy_to
    )                                                                         AS member_additions,
    COUNT(epb.id) FILTER (
      WHERE ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
        AND epb.enrollment_deletion_batch_id IS NOT NULL
        AND epb.updated_at BETWEEN epb.policy_from AND epb.policy_to
    )                                                                         AS member_deletions
  FROM employee_policy_base epb
  LEFT JOIN loc_employees           le  ON le.employee_id  = epb.employee_id
  LEFT JOIN company_logged_in_users clu ON clu.user_id     = epb.employee_id
  GROUP BY epb.policy_id
),

policy_dependent_counts AS (
  SELECT
    ped.policy_id,
    COUNT(ped.id) AS dependent_count
  FROM policy_enrollment_dependent ped
  INNER JOIN company_policies cp ON cp.policy_id = ped.policy_id
  JOIN  policy_enrollment_employee pee
     ON pee.id = ped.employee_id AND pee.deleted_at IS NULL
  LEFT JOIN loc_employees le ON le.employee_id = pee.id
  WHERE ped.deleted_at IS NULL
    AND ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
  GROUP BY ped.policy_id
),

policy_enrollment_counts AS (
  SELECT
    pee_enr.policy_id,
    COUNT(pee_enr.id) FILTER (WHERE pee_enr.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED')    AS enrolled_count,
    COUNT(pee_enr.id) FILTER (WHERE pee_enr.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS') AS in_progress_count,
    COUNT(pee_enr.id) FILTER (WHERE pee_enr.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED') AS not_started_count
  FROM policy_employee_enrollment pee_enr
  INNER JOIN company_policies cp ON cp.policy_id = pee_enr.policy_id
  LEFT JOIN loc_employees le ON le.employee_id = pee_enr.employee_id
  WHERE pee_enr.deleted_at IS NULL
    AND ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
  GROUP BY pee_enr.policy_id
),

prev_policy AS (
  SELECT
    cp.policy_id                                           AS cur_policy_id,
    prev_p.id                                              AS prev_policy_id,
    prev_p.policy_from                                     AS prev_policy_from,
    prev_p.policy_to                                       AS prev_policy_to,
    COALESCE(prev_p.net_premium, 0)                        AS prev_net_premium,
    (LEAST(CURRENT_DATE, cp.policy_to) - cp.policy_from)  AS elapsed_days
  FROM company_policies cp
  JOIN opportunity opp   ON opp.id      = cp.opportunity_id AND opp.ref_policy_id IS NOT NULL
  JOIN policy prev_p     ON prev_p.id   = opp.ref_policy_id
),

claims_relevant AS MATERIALIZED (
  SELECT
    c.id,
    c.policy_id,
    c.claim_amount,
    c.claim_dt,
    c.employee_id
  FROM policy_claim c
  INNER JOIN (
    SELECT policy_id AS pol_id FROM company_policies
    UNION
    SELECT prev_policy_id FROM prev_policy
  ) scope ON scope.pol_id = c.policy_id
  LEFT JOIN loc_employees le ON le.employee_id = c.employee_id
  WHERE c.deleted_at IS NULL
    AND ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
),

policy_claims_cur AS (
  SELECT
    cr.policy_id,
    COUNT(cr.id)                      AS total_claims,
    COALESCE(SUM(cr.claim_amount), 0) AS total_claim_amount
  FROM claims_relevant cr
  INNER JOIN company_policies cp ON cp.policy_id = cr.policy_id
  WHERE cr.claim_dt BETWEEN cp.policy_from AND LEAST(cp.policy_to, CURRENT_DATE)
  GROUP BY cr.policy_id
),

policy_claims_ly AS (
  SELECT
    pp.cur_policy_id                                                         AS policy_id,
    COUNT(cr.id) FILTER (
      WHERE cr.claim_dt BETWEEN pp.prev_policy_from
                            AND LEAST(pp.prev_policy_to, pp.prev_policy_from + pp.elapsed_days)
    )                                                                         AS claim_count_sply,
    COALESCE(SUM(cr.claim_amount) FILTER (
      WHERE cr.claim_dt BETWEEN pp.prev_policy_from
                            AND LEAST(pp.prev_policy_to, pp.prev_policy_from + pp.elapsed_days)
    ), 0)                                                                     AS claim_amount_sply,
    COALESCE(SUM(cr.claim_amount) FILTER (
      WHERE cr.claim_dt BETWEEN pp.prev_policy_from AND pp.prev_policy_to
    ), 0)                                                                     AS claim_amount_full_yr_ly,
    pp.prev_net_premium
  FROM prev_policy pp
  LEFT JOIN claims_relevant cr
         ON  cr.policy_id = pp.prev_policy_id
         AND cr.claim_dt  BETWEEN pp.prev_policy_from AND pp.prev_policy_to
  GROUP BY pp.cur_policy_id, pp.prev_net_premium
),

policy_cd AS (
  SELECT
    cdpm.policy_id,
    COALESCE(SUM(cd.balance_amount), 0)                    AS available_amount,
    COALESCE(SUM(cdt_agg.used_amount), 0)                  AS used_amount,
    MAX(cd.cd_safe_limit)                                   AS cd_safe_limit,
    (array_agg(cd.cd_account_number ORDER BY cd.id))[1]    AS cd_account_number
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm  ON cdpm.caution_deposit_id = cd.id
  INNER JOIN company_policies cp                  ON cp.policy_id = cdpm.policy_id
  LEFT JOIN (
    SELECT caution_deposit_id, SUM(transaction_amount) AS used_amount
    FROM caution_deposit_transaction
    WHERE transaction_type = 'DEBIT_TRANSACTION'
    GROUP BY caution_deposit_id
  ) cdt_agg ON cdt_agg.caution_deposit_id = cd.id
  WHERE cd.status IN ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
  GROUP BY cdpm.policy_id
),

policy_cd_running_balance AS (
  SELECT DISTINCT ON (cdpm.policy_id)
    cdpm.policy_id,
    cdt.cd_balance_amount::numeric AS running_balance
  FROM caution_deposit_transaction cdt
  INNER JOIN caution_deposit cd                  ON cd.id = cdt.caution_deposit_id
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN company_policies cp                 ON cp.policy_id = cdpm.policy_id
  WHERE cd.status IN ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
  ORDER BY cdpm.policy_id, cdt.transaction_date DESC NULLS LAST, cdt.id DESC
),

policy_insurer AS (
  SELECT DISTINCT ON (pim.policy_id)
    pim.policy_id,
    i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i           ON i.id = pim.insurer_id
  INNER JOIN company_policies cp ON cp.policy_id = pim.policy_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
),

policy_tpa AS (
  SELECT DISTINCT ON (ptm.policy_id)
    ptm.policy_id,
    t.name AS tpa_name
  FROM policy_tpa_map ptm
  INNER JOIN tpa t               ON t.id = ptm.tpa_id
  INNER JOIN company_policies cp ON cp.policy_id = ptm.policy_id
  ORDER BY ptm.policy_id, ptm.id
),

endorsement_premiums AS (
  SELECT e.policy_id, SUM(e.net_premium) AS total_endorsement_premium
  FROM endorsement e
  INNER JOIN company_policies cp ON cp.policy_id = e.policy_id
  WHERE e.net_premium IS NOT NULL
  GROUP BY e.policy_id
)

SELECT
  cp.policy_id                                                                                      AS "policyId",
  cp.policy_name                                                                                    AS "policyName",
  cp.policy_type_key                                                                                AS "policyTypeKey",
  COALESCE(cp.iirm_type_key, '')                                                                   AS "iiRmTypeKey",
  cp.insurer_policy_number                                                                          AS "policyNumber",
  COALESCE(pi.insurer_name, '—')                                                                  AS "insurer",
  COALESCE(pt.tpa_name,     '—')                                                                  AS "tpaName",
  TO_CHAR(cp.policy_from, 'DD Mon YYYY')                                                           AS "periodStart",
  TO_CHAR(cp.policy_to,   'DD Mon YYYY')                                                           AS "periodEnd",
  COALESCE(pps.employee_count, 0) + COALESCE(pdc.dependent_count, 0)                              AS "totalLives",
  COALESCE(pps.employee_count, 0)                                                                   AS "employeeCount",
  COALESCE(pdc.dependent_count, 0)                                                                  AS "dependentCount",
  xeff.eff_premium                                                                                  AS "netPremium",
  xeff.eff_premium                                                                                  AS "earnedPremium",
  COALESCE(pcd.available_amount, 0)                                                                 AS "cdBalance",
  COALESCE(pcd.used_amount, 0)                                                                      AS "cdUsedAmount",
  COALESCE(pcrb.running_balance, pcd.available_amount, 0)                                          AS "cdRunningBalance",
  pcd.cd_account_number                                                                             AS "cdAccountNumber",
  ROUND(xeff.eff_premium * COALESCE(pcd.cd_safe_limit, 10) / 100.0, 2)                           AS "safeLimit",
  COALESCE(pc.total_claims, 0)                                                                      AS "totalClaims",
  COALESCE(pc.total_claim_amount, 0)                                                                AS "claimAmount",
  COALESCE(pen.enrolled_count, 0)                                                                   AS "enrolledCount",
  ROUND(COALESCE(pen.enrolled_count, 0)    * 100.0 / NULLIF(pps.employee_count, 0), 1)            AS "enrolledPercent",
  COALESCE(pen.in_progress_count, 0)                                                                AS "inProgressCount",
  ROUND(COALESCE(pen.in_progress_count, 0) * 100.0 / NULLIF(pps.employee_count, 0), 1)            AS "inProgressPercent",
  COALESCE(pps.not_logged_in_count, 0)                                                             AS "notEnrolledCount",
  ROUND(COALESCE(pps.not_logged_in_count, 0) * 100.0 / NULLIF(pps.employee_count, 0), 1)         AS "notEnrolledPercent",
  COALESCE(pps.not_logged_in_count, 0)                                                             AS "notLoggedInCount",
  COALESCE(pps.logged_in_count, 0)                                                                  AS "loggedInCount",
  ROUND(COALESCE(pc.total_claim_amount, 0) * 100.0
        / NULLIF(xeff.eff_premium, 0), 1)                                                          AS "icrPercent",
  COALESCE(pc.total_claims, 0)                                                                      AS "icrClaimCount",
  ROUND(COALESCE(poly.claim_amount_sply, 0) * 100.0
        / NULLIF(COALESCE(poly.prev_net_premium, cp.net_premium), 0), 1)                          AS "icrSamePeriodLYPercent",
  COALESCE(poly.claim_amount_sply, 0)                                                               AS "icrSamePeriodLYAmount",
  ROUND(COALESCE(poly.claim_amount_full_yr_ly, 0) * 100.0
        / NULLIF(COALESCE(poly.prev_net_premium, cp.net_premium), 0), 1)                          AS "icrFullYearAvgLY",
  ROUND(COALESCE(pc.total_claim_amount, 0) * 100.0 / NULLIF(xeff.eff_premium, 0)
        - COALESCE(poly.claim_amount_sply, 0) * 100.0
          / NULLIF(COALESCE(poly.prev_net_premium, cp.net_premium), 0), 1)                        AS "icrYoYChangePercent",
  ROUND(COALESCE(pc.total_claim_amount, 0)
        * (cp.policy_to - cp.policy_from + 1)::numeric
        / NULLIF((LEAST(cp.policy_to, CURRENT_DATE) - cp.policy_from + 1), 0)
        * 100.0 / NULLIF(xeff.eff_premium, 0), 1)                                                AS "icrForecastPercent",
  COALESCE(poly.prev_net_premium, 0)                                                               AS "lyNetPremium",
  COALESCE(poly.prev_net_premium, 0)                                                               AS "lySamePeriodEarnedPremium",
  COALESCE(pps.member_additions, 0)                                                                AS "memberAdditions",
  COALESCE(pps.member_deletions, 0)                                                                AS "memberDeletions"

FROM company_policies cp
LEFT JOIN policy_people_stats      pps  ON pps.policy_id  = cp.policy_id
LEFT JOIN policy_dependent_counts  pdc  ON pdc.policy_id  = cp.policy_id
LEFT JOIN policy_enrollment_counts pen  ON pen.policy_id  = cp.policy_id
LEFT JOIN policy_claims_cur        pc   ON pc.policy_id   = cp.policy_id
LEFT JOIN policy_claims_ly        poly  ON poly.policy_id = cp.policy_id
LEFT JOIN policy_cd               pcd   ON pcd.policy_id  = cp.policy_id
LEFT JOIN policy_cd_running_balance pcrb ON pcrb.policy_id = cp.policy_id
LEFT JOIN policy_insurer           pi   ON pi.policy_id   = cp.policy_id
LEFT JOIN policy_tpa               pt   ON pt.policy_id   = cp.policy_id
LEFT JOIN loc_premium_ratios      lpr   ON lpr.policy_id  = cp.policy_id
LEFT JOIN endorsement_premiums     ep   ON ep.policy_id   = cp.policy_id

CROSS JOIN LATERAL (
  SELECT ROUND(
    COALESCE(ep.total_endorsement_premium, cp.net_premium, 0)
    * COALESCE(lpr.loc_emp_count / NULLIF(lpr.total_emp_count, 0), 1.0),
    0
  ) AS eff_premium
) xeff

-- policyId and policyStatus already applied inside company_policies above.
-- Only location filter remains here.
WHERE (
  (SELECT is_all FROM loc_filter)
  OR cp.policy_id IN (SELECT policy_id FROM loc_policies)
)

ORDER BY cp.policy_type_key, cp.policy_name$Q$
--   WHERE id = 22;

WITH

loc_filter AS (
  SELECT NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL AS is_all
),
loc_id_set AS (
  SELECT val::INTEGER AS loc_id
  FROM regexp_split_to_table(
    COALESCE(NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ''),
    ','
  ) AS val
  WHERE val ~ '^\d+$'
),

company_policies AS MATERIALIZED (
  SELECT
    p.id                   AS policy_id,
    p.policy_from,
    p.policy_to,
    p.net_premium,
    p.opportunity_id,
    p.policy_name,
    p.insurer_policy_number,
    p.policy_type_lid,
    ld.lookup_key          AS policy_type_key,
    iirm_ld.lookup_key     AS iirm_type_key,
    iirm_ld.value          AS iirm_type_value
  FROM policy p
  INNER JOIN lookup_data ld
         ON  ld.id          = p.policy_type_lid
         AND ld.deleted_at  IS NULL
  LEFT  JOIN policy_type_segregation pts
         ON  pts.policy_type_lid = p.policy_type_lid
  LEFT  JOIN lookup_data iirm_ld
         ON  iirm_ld.id         = pts.iirm_policy_type_lid
         AND iirm_ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '' OR p.id::text = ###policyId###)
    AND (
      ###policyId### != ''
      OR (COALESCE(###policyStatus###, '') IN ('', 'ACTIVE') AND p.policy_to >= CURRENT_DATE)
      OR (###policyStatus### = 'INACTIVE'                    AND p.policy_to <  CURRENT_DATE)
    )
    AND (p.is_installment_policy IS NULL OR NOT EXISTS (
      SELECT 1 FROM lookup_data inst_ld
      WHERE inst_ld.id          = p.is_installment_policy
        AND inst_ld.lookup_key  = 'TOGGLE_TYPE_YES'
        AND inst_ld.deleted_at  IS NULL
    ))
    AND (###externalHrUserId### IS NULL
         OR p.id IN (
           SELECT policy_id FROM external_hr_policy_map
           WHERE  hr_management_id = ###externalHrUserId###::INTEGER
         ))
    AND (
      ###policyType### = ''
      OR (###policyType### = 'LIFE'
          AND (lower(iirm_ld.value) LIKE '%life%' OR lower(iirm_ld.value) LIKE '%health%')
          AND  lower(iirm_ld.value) NOT LIKE '%non-life%')
      OR (###policyType### = 'NON_LIFE'
          AND lower(iirm_ld.value) NOT LIKE '%life%'
          AND lower(iirm_ld.value) NOT LIKE '%health%')
      OR (###policyType### NOT IN ('', 'LIFE', 'NON_LIFE')
          AND ld.lookup_key = ###policyType###)
    )
),

loc_employees AS MATERIALIZED (
  SELECT pee.id AS employee_id
  FROM policy_enrollment_employee pee
  WHERE pee.deleted_at IS NULL
    AND NOT (SELECT is_all FROM loc_filter)
    AND pee.policy_config_location_id IN (
      SELECT cpcl_loc.id
      FROM company_policy_configuration_location cpcl_loc
      WHERE cpcl_loc.address_id IN (SELECT loc_id FROM loc_id_set)
    )
),

employee_policy_base AS MATERIALIZED (
  SELECT
    peepm.id,
    peepm.policy_id,
    peepm.employee_id,
    peepm.endorsement_addition_batch_id,
    peepm.enrollment_deletion_batch_id,
    peepm.created_at,
    peepm.updated_at,
    cp.policy_from,
    cp.policy_to
  FROM policy_enrollment_employee_policy_map peepm
  INNER JOIN company_policies cp ON cp.policy_id = peepm.policy_id
  WHERE peepm.deleted_at IS NULL
),

loc_policies AS (
  SELECT DISTINCT epb.policy_id
  FROM employee_policy_base epb
  INNER JOIN loc_employees le ON le.employee_id = epb.employee_id
),

loc_premium_ratios AS (
  SELECT
    epb.policy_id,
    COUNT(DISTINCT le.employee_id)::numeric  AS loc_emp_count,
    COUNT(DISTINCT epb.employee_id)::numeric AS total_emp_count
  FROM employee_policy_base epb
  LEFT JOIN loc_employees le ON le.employee_id = epb.employee_id
  WHERE NOT (SELECT is_all FROM loc_filter)
    AND epb.policy_id IN (SELECT policy_id FROM loc_policies)
  GROUP BY epb.policy_id
),

company_logged_in_users AS MATERIALIZED (
  -- EXISTS stops at the first matching login per employee (index early-exit).
  -- Old JOIN pulled ALL login records then ran DISTINCT — far more rows for large policies.
  SELECT emp.employee_id AS user_id
  FROM (SELECT DISTINCT employee_id FROM employee_policy_base) emp
  WHERE EXISTS (
    SELECT 1 FROM user_activity_log ual
    WHERE ual.user_id           = emp.employee_id
      AND ual.activity_key      = 'LOGGED_IN'
      AND ual.activity_category = 'AUTH'
      AND ual.deleted_at        IS NULL
  )
),

policy_people_stats AS MATERIALIZED (
  SELECT
    epb.policy_id,
    COUNT(DISTINCT epb.employee_id) FILTER (
      WHERE (SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL
    )                                                                         AS employee_count,
    COUNT(DISTINCT epb.employee_id) FILTER (
      WHERE ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
        AND clu.user_id IS NOT NULL
    )                                                                         AS logged_in_count,
    COUNT(DISTINCT epb.employee_id) FILTER (
      WHERE ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
        AND clu.user_id IS NULL
    )                                                                         AS not_logged_in_count,
    COUNT(epb.id) FILTER (
      WHERE ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
        AND epb.endorsement_addition_batch_id IS NOT NULL
        AND epb.created_at BETWEEN epb.policy_from AND epb.policy_to
    )                                                                         AS member_additions,
    COUNT(epb.id) FILTER (
      WHERE ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
        AND epb.enrollment_deletion_batch_id IS NOT NULL
        AND epb.updated_at BETWEEN epb.policy_from AND epb.policy_to
    )                                                                         AS member_deletions
  FROM employee_policy_base epb
  LEFT JOIN loc_employees           le  ON le.employee_id  = epb.employee_id
  LEFT JOIN company_logged_in_users clu ON clu.user_id     = epb.employee_id
  GROUP BY epb.policy_id
),

policy_dependent_counts AS (
  SELECT
    ped.policy_id,
    COUNT(ped.id) AS dependent_count
  FROM policy_enrollment_dependent ped
  INNER JOIN company_policies cp ON cp.policy_id = ped.policy_id
  JOIN  policy_enrollment_employee pee
     ON pee.id = ped.employee_id AND pee.deleted_at IS NULL
  LEFT JOIN loc_employees le ON le.employee_id = pee.id
  WHERE ped.deleted_at IS NULL
    AND ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
  GROUP BY ped.policy_id
),

policy_enrollment_counts AS (
  SELECT
    pee_enr.policy_id,
    COUNT(pee_enr.id) FILTER (WHERE pee_enr.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED')    AS enrolled_count,
    COUNT(pee_enr.id) FILTER (WHERE pee_enr.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS') AS in_progress_count,
    COUNT(pee_enr.id) FILTER (WHERE pee_enr.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED') AS not_started_count
  FROM policy_employee_enrollment pee_enr
  INNER JOIN company_policies cp ON cp.policy_id = pee_enr.policy_id
  LEFT JOIN loc_employees le ON le.employee_id = pee_enr.employee_id
  WHERE pee_enr.deleted_at IS NULL
    AND ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
  GROUP BY pee_enr.policy_id
),

prev_policy AS (
  SELECT
    cp.policy_id                                           AS cur_policy_id,
    prev_p.id                                              AS prev_policy_id,
    prev_p.policy_from                                     AS prev_policy_from,
    prev_p.policy_to                                       AS prev_policy_to,
    COALESCE(prev_p.net_premium, 0)                        AS prev_net_premium,
    (LEAST(CURRENT_DATE, cp.policy_to) - cp.policy_from)  AS elapsed_days
  FROM company_policies cp
  JOIN opportunity opp   ON opp.id      = cp.opportunity_id AND opp.ref_policy_id IS NOT NULL
  JOIN policy prev_p     ON prev_p.id   = opp.ref_policy_id
),

claims_relevant AS MATERIALIZED (
  SELECT
    c.id,
    c.policy_id,
    c.claim_amount,
    c.claim_dt,
    c.employee_id
  FROM policy_claim c
  INNER JOIN (
    SELECT policy_id AS pol_id FROM company_policies
    UNION
    SELECT prev_policy_id FROM prev_policy
  ) scope ON scope.pol_id = c.policy_id
  LEFT JOIN loc_employees le ON le.employee_id = c.employee_id
  WHERE c.deleted_at IS NULL
    AND ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
),

policy_claims_cur AS (
  SELECT
    cr.policy_id,
    COUNT(cr.id)                      AS total_claims,
    COALESCE(SUM(cr.claim_amount), 0) AS total_claim_amount
  FROM claims_relevant cr
  INNER JOIN company_policies cp ON cp.policy_id = cr.policy_id
  WHERE cr.claim_dt BETWEEN cp.policy_from AND LEAST(cp.policy_to, CURRENT_DATE)
  GROUP BY cr.policy_id
),

policy_claims_ly AS (
  SELECT
    pp.cur_policy_id                                                         AS policy_id,
    COUNT(cr.id) FILTER (
      WHERE cr.claim_dt BETWEEN pp.prev_policy_from
                            AND LEAST(pp.prev_policy_to, pp.prev_policy_from + pp.elapsed_days)
    )                                                                         AS claim_count_sply,
    COALESCE(SUM(cr.claim_amount) FILTER (
      WHERE cr.claim_dt BETWEEN pp.prev_policy_from
                            AND LEAST(pp.prev_policy_to, pp.prev_policy_from + pp.elapsed_days)
    ), 0)                                                                     AS claim_amount_sply,
    COALESCE(SUM(cr.claim_amount) FILTER (
      WHERE cr.claim_dt BETWEEN pp.prev_policy_from AND pp.prev_policy_to
    ), 0)                                                                     AS claim_amount_full_yr_ly,
    pp.prev_net_premium
  FROM prev_policy pp
  LEFT JOIN claims_relevant cr
         ON  cr.policy_id = pp.prev_policy_id
         AND cr.claim_dt  BETWEEN pp.prev_policy_from AND pp.prev_policy_to
  GROUP BY pp.cur_policy_id, pp.prev_net_premium
),

policy_cd AS (
  SELECT
    cdpm.policy_id,
    COALESCE(SUM(cd.balance_amount), 0)                    AS available_amount,
    COALESCE(SUM(cdt_agg.used_amount), 0)                  AS used_amount,
    MAX(cd.cd_safe_limit)                                   AS cd_safe_limit,
    (array_agg(cd.cd_account_number ORDER BY cd.id))[1]    AS cd_account_number
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm  ON cdpm.caution_deposit_id = cd.id
  INNER JOIN company_policies cp                  ON cp.policy_id = cdpm.policy_id
  LEFT JOIN (
    SELECT caution_deposit_id, SUM(transaction_amount) AS used_amount
    FROM caution_deposit_transaction
    WHERE transaction_type = 'DEBIT_TRANSACTION'
    GROUP BY caution_deposit_id
  ) cdt_agg ON cdt_agg.caution_deposit_id = cd.id
  WHERE cd.status IN ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
  GROUP BY cdpm.policy_id
),

policy_cd_running_balance AS (
  SELECT DISTINCT ON (cdpm.policy_id)
    cdpm.policy_id,
    cdt.cd_balance_amount::numeric AS running_balance
  FROM caution_deposit_transaction cdt
  INNER JOIN caution_deposit cd                  ON cd.id = cdt.caution_deposit_id
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN company_policies cp                 ON cp.policy_id = cdpm.policy_id
  WHERE cd.status IN ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
  ORDER BY cdpm.policy_id, cdt.transaction_date DESC NULLS LAST, cdt.id DESC
),

policy_insurer AS (
  SELECT DISTINCT ON (pim.policy_id)
    pim.policy_id,
    i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i           ON i.id = pim.insurer_id
  INNER JOIN company_policies cp ON cp.policy_id = pim.policy_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
),

policy_tpa AS (
  SELECT DISTINCT ON (ptm.policy_id)
    ptm.policy_id,
    t.name AS tpa_name
  FROM policy_tpa_map ptm
  INNER JOIN tpa t               ON t.id = ptm.tpa_id
  INNER JOIN company_policies cp ON cp.policy_id = ptm.policy_id
  ORDER BY ptm.policy_id, ptm.id
),

endorsement_premiums AS (
  SELECT e.policy_id, SUM(e.net_premium) AS total_endorsement_premium
  FROM endorsement e
  INNER JOIN company_policies cp ON cp.policy_id = e.policy_id
  WHERE e.net_premium IS NOT NULL
  GROUP BY e.policy_id
)

SELECT
  cp.policy_id                                                                                      AS "policyId",
  cp.policy_name                                                                                    AS "policyName",
  cp.policy_type_key                                                                                AS "policyTypeKey",
  COALESCE(cp.iirm_type_key, '')                                                                   AS "iiRmTypeKey",
  cp.insurer_policy_number                                                                          AS "policyNumber",
  COALESCE(pi.insurer_name, '—')                                                                  AS "insurer",
  COALESCE(pt.tpa_name,     '—')                                                                  AS "tpaName",
  TO_CHAR(cp.policy_from, 'DD Mon YYYY')                                                           AS "periodStart",
  TO_CHAR(cp.policy_to,   'DD Mon YYYY')                                                           AS "periodEnd",
  COALESCE(pps.employee_count, 0) + COALESCE(pdc.dependent_count, 0)                              AS "totalLives",
  COALESCE(pps.employee_count, 0)                                                                   AS "employeeCount",
  COALESCE(pdc.dependent_count, 0)                                                                  AS "dependentCount",
  xeff.eff_premium                                                                                  AS "netPremium",
  xeff.eff_premium                                                                                  AS "earnedPremium",
  COALESCE(pcd.available_amount, 0)                                                                 AS "cdBalance",
  COALESCE(pcd.used_amount, 0)                                                                      AS "cdUsedAmount",
  COALESCE(pcrb.running_balance, pcd.available_amount, 0)                                          AS "cdRunningBalance",
  pcd.cd_account_number                                                                             AS "cdAccountNumber",
  ROUND(xeff.eff_premium * COALESCE(pcd.cd_safe_limit, 10) / 100.0, 2)                           AS "safeLimit",
  COALESCE(pc.total_claims, 0)                                                                      AS "totalClaims",
  COALESCE(pc.total_claim_amount, 0)                                                                AS "claimAmount",
  COALESCE(pen.enrolled_count, 0)                                                                   AS "enrolledCount",
  ROUND(COALESCE(pen.enrolled_count, 0)    * 100.0 / NULLIF(pps.employee_count, 0), 1)            AS "enrolledPercent",
  COALESCE(pen.in_progress_count, 0)                                                                AS "inProgressCount",
  ROUND(COALESCE(pen.in_progress_count, 0) * 100.0 / NULLIF(pps.employee_count, 0), 1)            AS "inProgressPercent",
  COALESCE(pps.not_logged_in_count, 0)                                                             AS "notEnrolledCount",
  ROUND(COALESCE(pps.not_logged_in_count, 0) * 100.0 / NULLIF(pps.employee_count, 0), 1)         AS "notEnrolledPercent",
  COALESCE(pps.not_logged_in_count, 0)                                                             AS "notLoggedInCount",
  COALESCE(pps.logged_in_count, 0)                                                                  AS "loggedInCount",
  ROUND(COALESCE(pc.total_claim_amount, 0) * 100.0
        / NULLIF(xeff.eff_premium, 0), 1)                                                          AS "icrPercent",
  COALESCE(pc.total_claims, 0)                                                                      AS "icrClaimCount",
  ROUND(COALESCE(poly.claim_amount_sply, 0) * 100.0
        / NULLIF(COALESCE(poly.prev_net_premium, cp.net_premium), 0), 1)                          AS "icrSamePeriodLYPercent",
  COALESCE(poly.claim_amount_sply, 0)                                                               AS "icrSamePeriodLYAmount",
  ROUND(COALESCE(poly.claim_amount_full_yr_ly, 0) * 100.0
        / NULLIF(COALESCE(poly.prev_net_premium, cp.net_premium), 0), 1)                          AS "icrFullYearAvgLY",
  ROUND(COALESCE(pc.total_claim_amount, 0) * 100.0 / NULLIF(xeff.eff_premium, 0)
        - COALESCE(poly.claim_amount_sply, 0) * 100.0
          / NULLIF(COALESCE(poly.prev_net_premium, cp.net_premium), 0), 1)                        AS "icrYoYChangePercent",
  ROUND(COALESCE(pc.total_claim_amount, 0)
        * (cp.policy_to - cp.policy_from + 1)::numeric
        / NULLIF((LEAST(cp.policy_to, CURRENT_DATE) - cp.policy_from + 1), 0)
        * 100.0 / NULLIF(xeff.eff_premium, 0), 1)                                                AS "icrForecastPercent",
  COALESCE(poly.prev_net_premium, 0)                                                               AS "lyNetPremium",
  COALESCE(poly.prev_net_premium, 0)                                                               AS "lySamePeriodEarnedPremium",
  COALESCE(pps.member_additions, 0)                                                                AS "memberAdditions",
  COALESCE(pps.member_deletions, 0)                                                                AS "memberDeletions"

FROM company_policies cp
LEFT JOIN policy_people_stats      pps  ON pps.policy_id  = cp.policy_id
LEFT JOIN policy_dependent_counts  pdc  ON pdc.policy_id  = cp.policy_id
LEFT JOIN policy_enrollment_counts pen  ON pen.policy_id  = cp.policy_id
LEFT JOIN policy_claims_cur        pc   ON pc.policy_id   = cp.policy_id
LEFT JOIN policy_claims_ly        poly  ON poly.policy_id = cp.policy_id
LEFT JOIN policy_cd               pcd   ON pcd.policy_id  = cp.policy_id
LEFT JOIN policy_cd_running_balance pcrb ON pcrb.policy_id = cp.policy_id
LEFT JOIN policy_insurer           pi   ON pi.policy_id   = cp.policy_id
LEFT JOIN policy_tpa               pt   ON pt.policy_id   = cp.policy_id
LEFT JOIN loc_premium_ratios      lpr   ON lpr.policy_id  = cp.policy_id
LEFT JOIN endorsement_premiums     ep   ON ep.policy_id   = cp.policy_id

CROSS JOIN LATERAL (
  SELECT ROUND(
    COALESCE(ep.total_endorsement_premium, cp.net_premium, 0)
    * COALESCE(lpr.loc_emp_count / NULLIF(lpr.total_emp_count, 0), 1.0),
    0
  ) AS eff_premium
) xeff

-- policyId and policyStatus already applied inside company_policies above.
-- Only location filter remains here.
WHERE (
  (SELECT is_all FROM loc_filter)
  OR cp.policy_id IN (SELECT policy_id FROM loc_policies)
)

ORDER BY cp.policy_type_key, cp.policy_name

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 22)
-- ------------------------------------------------------------------
-- Filter: (no label -- stub/unconfigured parameter)
--   parameter_name : locationIds
--   token in query : ###locationIds###
--   data_type      : (none)
--   input_field    : (none -- likely unusable from the UI)
--   >>> STUB parameter row -- no type/label configured, this filter cannot be used from the generic screen.
--
-- Filter: (no label -- stub/unconfigured parameter)
--   parameter_name : policyId
--   token in query : ###policyId###
--   data_type      : (none)
--   input_field    : (none -- likely unusable from the UI)
--   >>> STUB parameter row -- no type/label configured, this filter cannot be used from the generic screen.
--
-- Filter: Company ID
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--
-- Filter: Policy Type
--   parameter_name : policyType
--   token in query : ###policyType###
--   data_type      : string
--   input_field    : input
--   order_no       : 2
--
-- Filter: Policy Status
--   parameter_name : policyStatus
--   token in query : ###policyStatus###
--   data_type      : string
--   input_field    : input
--   order_no       : 3
--
-- Filter: External HR User ID
--   parameter_name : externalHrUserId
--   token in query : ###externalHrUserId###
--   data_type      : number
--   input_field    : input
--   order_no       : 99
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 22)
-- ------------------------------------------------------------------
--   policyId                     -> Policy ID                      (variable: policyId, type: number, align: right)
--   policyName                   -> Policy Name                    (variable: policyName, type: string, align: left)
--   policyTypeKey                -> Policy Type Key                (variable: policyTypeKey, type: string, align: left)
--   insurer                      -> Insurer                        (variable: insurer, type: string, align: left)
--   periodStart                  -> Period Start                   (variable: periodStart, type: string, align: left)
--   periodEnd                    -> Period End                     (variable: periodEnd, type: string, align: left)
--   totalLives                   -> Total Lives                    (variable: totalLives, type: number, align: right)
--   employeeCount                -> Employee Count                 (variable: employeeCount, type: number, align: right)
--   dependentCount               -> Dependent Count                (variable: dependentCount, type: number, align: right)
--   netPremium                   -> Net Premium                    (variable: netPremium, type: number, align: right)
--   cdBalance                    -> CD Balance                     (variable: cdBalance, type: number, align: right)
--   cdUsedAmount                 -> CD Used Amount                 (variable: cdUsedAmount, type: number, align: right)
--   totalClaims                  -> Total Claims                   (variable: totalClaims, type: number, align: right)
--   claimAmount                  -> Claim Amount                   (variable: claimAmount, type: number, align: right)
--   enrolledCount                -> Enrolled Count                 (variable: enrolledCount, type: number, align: right)
--   enrolledPercent              -> Enrolled %                     (variable: enrolledPercent, type: number, align: right)
--   inProgressCount              -> In-Progress Count              (variable: inProgressCount, type: number, align: right)
--   inProgressPercent            -> In-Progress %                  (variable: inProgressPercent, type: number, align: right)
--   notEnrolledCount             -> Not Enrolled Count             (variable: notEnrolledCount, type: number, align: right)
--   notEnrolledPercent           -> Not Enrolled %                 (variable: notEnrolledPercent, type: number, align: right)
--   icrPercent                   -> ICR %                          (variable: icrPercent, type: number, align: right)
--   icrClaimCount                -> ICR Claim Count                (variable: icrClaimCount, type: number, align: right)
--   icrSamePeriodLYPercent       -> ICR Same Period LY %           (variable: icrSamePeriodLYPercent, type: number, align: right)
--   icrSamePeriodLYAmount        -> ICR Same Period LY Amt         (variable: icrSamePeriodLYAmount, type: number, align: right)
--   icrFullYearAvgLY             -> ICR Full Year Avg LY           (variable: icrFullYearAvgLY, type: number, align: right)
--   icrYoYChangePercent          -> ICR YoY Change %               (variable: icrYoYChangePercent, type: number, align: right)
--   icrForecastPercent           -> ICR Forecast %                 (variable: icrForecastPercent, type: number, align: right)
--   memberAdditions              -> Member Additions               (variable: memberAdditions, type: number, align: right)
--   memberDeletions              -> Member Deletions               (variable: memberDeletions, type: number, align: right)
--   iiRmTypeKey                  -> IIRM Type Key                  (variable: iiRmTypeKey, type: string, align: left)
--   earnedPremium                -> Earned Premium                 (variable: earnedPremium, type: number, align: right)
--   tpaName                      -> TPA Name                       (variable: tpaName, type: string, align: left)
--   policyNumber                 -> Policy Number                  (variable: policyNumber, type: string, align: left)
--   cdAccountNumber              -> CD Account Number              (variable: cdAccountNumber, type: string, align: left)

