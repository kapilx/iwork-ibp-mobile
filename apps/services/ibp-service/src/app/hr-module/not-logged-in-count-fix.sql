-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1 — Restore originals (safe to re-run; only overwrites if patched)
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE admin_reports
SET query = $q$WITH emp_scope AS (
  SELECT
    COUNT(DISTINCT peepm.employee_id) AS total_employees
  FROM policy_enrollment_employee_policy_map peepm
  WHERE peepm.policy_id = ###policyId###
    AND peepm.deleted_at IS NULL
),

enroll_status AS (
  SELECT
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED')    AS enrolled_count,
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS') AS in_progress_count,
    COUNT(pee.id) FILTER (WHERE pee.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED') AS not_started_count
  FROM policy_employee_enrollment pee
  WHERE pee.policy_id = ###policyId###
    AND pee.deleted_at IS NULL
),

dep_scope AS (
  SELECT
    COUNT(ped.id) AS total_dependents
  FROM policy_enrollment_dependent ped
  WHERE ped.policy_id = ###policyId###
    AND ped.deleted_at IS NULL
)

SELECT
  es.total_employees                                                             AS "totalEmployees",
  COALESCE(ds.total_dependents,    0)                                           AS "totalDependents",
  COALESCE(en.enrolled_count,      0)                                           AS "enrolledCount",
  COALESCE(en.in_progress_count,   0)                                           AS "inProgressCount",
  COALESCE(en.not_started_count,   0)                                           AS "notStartedCount",
  GREATEST(es.total_employees - COALESCE(en.enrolled_count, 0), 0)             AS "notEnrolledCount",
  ROUND(COALESCE(en.enrolled_count,     0) * 100.0 / NULLIF(es.total_employees, 0), 1) AS "enrolledPercent",
  ROUND(COALESCE(en.in_progress_count,  0) * 100.0 / NULLIF(es.total_employees, 0), 1) AS "inProgressPercent",
  ROUND(COALESCE(en.not_started_count,  0) * 100.0 / NULLIF(es.total_employees, 0), 1) AS "notStartedPercent"
FROM emp_scope       es
CROSS JOIN enroll_status en
CROSS JOIN dep_scope     ds$q$
WHERE name = 'policy_enrollment_summary';


UPDATE admin_reports
SET query = $q$WITH loc_filter AS (
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
loc_employees AS (
  SELECT pee.id AS employee_id
  FROM policy_enrollment_employee pee
  WHERE pee.deleted_at IS NULL
    AND NOT (SELECT is_all FROM loc_filter)
    AND pee.policy_config_location_id IN (SELECT loc_id FROM loc_id_set)
),
loc_policies AS (
  SELECT DISTINCT peepm.policy_id
  FROM policy_enrollment_employee_policy_map peepm
  INNER JOIN loc_employees le ON le.employee_id = peepm.employee_id
  WHERE peepm.deleted_at IS NULL
),
loc_premium_ratios AS (
  SELECT
    peepm.policy_id,
    COUNT(DISTINCT peepm.employee_id) FILTER (
      WHERE peepm.employee_id IN (SELECT employee_id FROM loc_employees)
    )::numeric AS loc_emp_count,
    COUNT(DISTINCT peepm.employee_id)::numeric AS total_emp_count
  FROM policy_enrollment_employee_policy_map peepm
  WHERE peepm.deleted_at IS NULL
    AND NOT (SELECT is_all FROM loc_filter)
    AND peepm.policy_id IN (SELECT policy_id FROM loc_policies)
  GROUP BY peepm.policy_id
),
policy_employee_counts AS (
  SELECT
    peepm.policy_id,
    COUNT(DISTINCT peepm.employee_id) AS employee_count
  FROM policy_enrollment_employee_policy_map peepm
  WHERE peepm.deleted_at IS NULL
    AND (
      (SELECT is_all FROM loc_filter)
      OR peepm.employee_id IN (SELECT employee_id FROM loc_employees)
    )
  GROUP BY peepm.policy_id
),
policy_dependent_counts AS (
  SELECT
    ped.policy_id,
    COUNT(ped.id) AS dependent_count
  FROM policy_enrollment_dependent ped
  JOIN policy_enrollment_employee pee
    ON pee.id = ped.employee_id AND pee.deleted_at IS NULL
  WHERE ped.deleted_at IS NULL
    AND (
      (SELECT is_all FROM loc_filter)
      OR pee.id IN (SELECT employee_id FROM loc_employees)
    )
  GROUP BY ped.policy_id
),
policy_enrollment_counts AS (
  SELECT
    pee_enr.policy_id,
    COUNT(pee_enr.id) FILTER (WHERE pee_enr.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED')    AS enrolled_count,
    COUNT(pee_enr.id) FILTER (WHERE pee_enr.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS') AS in_progress_count,
    COUNT(pee_enr.id) FILTER (WHERE pee_enr.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED') AS not_started_count
  FROM policy_employee_enrollment pee_enr
  WHERE pee_enr.deleted_at IS NULL
    AND (
      (SELECT is_all FROM loc_filter)
      OR pee_enr.employee_id IN (SELECT employee_id FROM loc_employees)
    )
  GROUP BY pee_enr.policy_id
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
    AND (
      (SELECT is_all FROM loc_filter)
      OR c.employee_id IN (SELECT employee_id FROM loc_employees)
    )
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
  JOIN opportunity opp  ON opp.id = p.opportunity_id AND opp.ref_policy_id IS NOT NULL
  JOIN policy prev_p    ON prev_p.id = opp.ref_policy_id
  WHERE p.company_id = ###companyId###
),
policy_claims_sply AS (
  SELECT
    pp.cur_policy_id                 AS policy_id,
    COUNT(c.id)                      AS claim_count_sply,
    COALESCE(SUM(c.claim_amount), 0) AS claim_amount_sply,
    pp.prev_net_premium
  FROM prev_policy pp
  LEFT JOIN policy_claim c ON c.policy_id = pp.prev_policy_id
    AND c.deleted_at IS NULL
    AND c.claim_dt BETWEEN pp.prev_policy_from
                       AND LEAST(pp.prev_policy_to, pp.prev_policy_from + pp.elapsed_days)
    AND (
      (SELECT is_all FROM loc_filter)
      OR c.employee_id IN (SELECT employee_id FROM loc_employees)
    )
  GROUP BY pp.cur_policy_id, pp.prev_net_premium
),
policy_claims_full_yr_ly AS (
  SELECT
    pp.cur_policy_id                 AS policy_id,
    COALESCE(SUM(c.claim_amount), 0) AS claim_amount_full_yr_ly,
    pp.prev_net_premium
  FROM prev_policy pp
  LEFT JOIN policy_claim c ON c.policy_id = pp.prev_policy_id
    AND c.deleted_at IS NULL
    AND c.claim_dt BETWEEN pp.prev_policy_from AND pp.prev_policy_to
    AND (
      (SELECT is_all FROM loc_filter)
      OR c.employee_id IN (SELECT employee_id FROM loc_employees)
    )
  GROUP BY pp.cur_policy_id, pp.prev_net_premium
),
policy_cd AS (
  SELECT
    cdpm.policy_id,
    COALESCE(SUM(cd.balance_amount), 0)   AS available_amount,
    COALESCE(SUM(cdt_agg.used_amount), 0) AS used_amount,
    MAX(cd.cd_safe_limit)                 AS cd_safe_limit
  FROM caution_deposit cd
  INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id AND p_cd.company_id = ###companyId###
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
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id AND p_cd.company_id = ###companyId###
  WHERE cd.status IN ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
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
  INNER JOIN policy p_cd ON p_cd.id = cdpm.policy_id AND p_cd.company_id = ###companyId###
  WHERE cd.status IN ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
  ORDER BY cdpm.policy_id, cdt.transaction_date DESC NULLS LAST, cdt.id DESC
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
    AND (
      (SELECT is_all FROM loc_filter)
      OR peepm.employee_id IN (SELECT employee_id FROM loc_employees)
    )
  GROUP BY peepm.policy_id
)
SELECT
  p.id                                                                                              AS "policyId",
  p.policy_name                                                                                     AS "policyName",
  ld.lookup_key                                                                                     AS "policyTypeKey",
  COALESCE(iirm_ld.lookup_key, '')                                                                 AS "iiRmTypeKey",
  p.insurer_policy_number                                                                           AS "policyNumber",
  COALESCE(pi.insurer_name, '—')                                                                  AS "insurer",
  COALESCE(pt.tpa_name, '—')                                                                      AS "tpaName",
  TO_CHAR(p.policy_from, 'DD Mon YYYY')                                                            AS "periodStart",
  TO_CHAR(p.policy_to,   'DD Mon YYYY')                                                            AS "periodEnd",
  COALESCE(pec.employee_count, 0) + COALESCE(pdc.dependent_count, 0)                              AS "totalLives",
  COALESCE(pec.employee_count, 0)                                                                   AS "employeeCount",
  COALESCE(pdc.dependent_count, 0)                                                                  AS "dependentCount",
  ROUND(COALESCE(p.net_premium, 0)
        * COALESCE(lpr.loc_emp_count / NULLIF(lpr.total_emp_count, 0), 1.0), 0)                   AS "netPremium",
  ROUND(COALESCE(p.net_premium, 0)
        * COALESCE(lpr.loc_emp_count / NULLIF(lpr.total_emp_count, 0), 1.0), 0)                   AS "earnedPremium",
  COALESCE(pcd.available_amount, 0)                                                                 AS "cdBalance",
  COALESCE(pcd.used_amount, 0)                                                                      AS "cdUsedAmount",
  COALESCE(pcrb.running_balance, pcd.available_amount, 0)                                          AS "cdRunningBalance",
  pca.cd_account_number                                                                             AS "cdAccountNumber",
  ROUND(COALESCE(p.net_premium, 0)
        * COALESCE(lpr.loc_emp_count / NULLIF(lpr.total_emp_count, 0), 1.0)
        * COALESCE(pcd.cd_safe_limit, 10) / 100.0, 2)                                             AS "safeLimit",
  COALESCE(pc.total_claims, 0)                                                                      AS "totalClaims",
  COALESCE(pc.total_claim_amount, 0)                                                                AS "claimAmount",
  COALESCE(pen.enrolled_count, 0)                                                                   AS "enrolledCount",
  ROUND(COALESCE(pen.enrolled_count, 0) * 100.0 / NULLIF(pec.employee_count, 0), 1)                AS "enrolledPercent",
  COALESCE(pen.in_progress_count, 0)                                                                AS "inProgressCount",
  ROUND(COALESCE(pen.in_progress_count, 0) * 100.0 / NULLIF(pec.employee_count, 0), 1)             AS "inProgressPercent",
  (
    SELECT COUNT(DISTINCT pee_nl.id)
    FROM policy_enrollment_employee_policy_map peepm_nl
    JOIN policy_enrollment_employee pee_nl
      ON pee_nl.id = peepm_nl.employee_id AND pee_nl.deleted_at IS NULL
    WHERE peepm_nl.policy_id  = p.id
      AND peepm_nl.deleted_at IS NULL
      AND (
        (SELECT is_all FROM loc_filter)
        OR peepm_nl.employee_id IN (SELECT employee_id FROM loc_employees)
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_activity_log ual
        WHERE ual.user_id           = pee_nl.id
          AND ual.activity_key      = 'LOGGED_IN'
          AND ual.activity_category = 'AUTH'
          AND ual.deleted_at IS NULL
      )
  )                                                                                                   AS "notEnrolledCount",
  ROUND(
    (SELECT COUNT(DISTINCT pee_np.id)
     FROM policy_enrollment_employee_policy_map peepm_np
     JOIN policy_enrollment_employee pee_np
       ON pee_np.id = peepm_np.employee_id AND pee_np.deleted_at IS NULL
     WHERE peepm_np.policy_id  = p.id
       AND peepm_np.deleted_at IS NULL
       AND (
         (SELECT is_all FROM loc_filter)
         OR peepm_np.employee_id IN (SELECT employee_id FROM loc_employees)
       )
       AND NOT EXISTS (
         SELECT 1 FROM user_activity_log ual2
         WHERE ual2.user_id           = pee_np.id
           AND ual2.activity_key      = 'LOGGED_IN'
           AND ual2.activity_category = 'AUTH'
           AND ual2.deleted_at IS NULL
       )
    ) * 100.0 / NULLIF(pec.employee_count, 0), 1)                                                   AS "notEnrolledPercent",
  ROUND(COALESCE(pc.total_claim_amount, 0) * 100.0
        / NULLIF(COALESCE(p.net_premium, 0) * COALESCE(lpr.loc_emp_count / NULLIF(lpr.total_emp_count, 0), 1.0), 0),
        1)                                                                                           AS "icrPercent",
  COALESCE(pc.total_claims, 0)                                                                      AS "icrClaimCount",
  ROUND(COALESCE(pcsply.claim_amount_sply, 0) * 100.0
        / NULLIF(COALESCE(pcsply.prev_net_premium, p.net_premium), 0), 1)                          AS "icrSamePeriodLYPercent",
  COALESCE(pcsply.claim_amount_sply, 0)                                                             AS "icrSamePeriodLYAmount",
  ROUND(COALESCE(pcfly.claim_amount_full_yr_ly, 0) * 100.0
        / NULLIF(COALESCE(pcfly.prev_net_premium, p.net_premium), 0), 1)                           AS "icrFullYearAvgLY",
  ROUND(COALESCE(pc.total_claim_amount, 0) * 100.0
        / NULLIF(COALESCE(p.net_premium, 0) * COALESCE(lpr.loc_emp_count / NULLIF(lpr.total_emp_count, 0), 1.0), 0)
        - COALESCE(pcsply.claim_amount_sply, 0) * 100.0
          / NULLIF(COALESCE(pcsply.prev_net_premium, p.net_premium), 0), 1)                        AS "icrYoYChangePercent",
  ROUND(COALESCE(pc.total_claim_amount, 0)
        * (p.policy_to - p.policy_from + 1)::numeric
        / NULLIF((LEAST(p.policy_to, CURRENT_DATE) - p.policy_from + 1), 0)
        * 100.0
        / NULLIF(COALESCE(p.net_premium, 0) * COALESCE(lpr.loc_emp_count / NULLIF(lpr.total_emp_count, 0), 1.0), 0),
        1)                                                                                           AS "icrForecastPercent",
  COALESCE(pcfly.prev_net_premium, 0)                                                               AS "lyNetPremium",
  COALESCE(pcfly.prev_net_premium, 0)                                                               AS "lySamePeriodEarnedPremium",
  COALESCE(pa.member_additions, 0)                                                                  AS "memberAdditions",
  COALESCE(pa.member_deletions, 0)                                                                  AS "memberDeletions"
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
LEFT JOIN loc_premium_ratios lpr       ON lpr.policy_id = p.id
WHERE p.company_id = ###companyId###
  AND (
    ###policyId### != ''
    OR (COALESCE(###policyStatus###, '') IN ('', 'ACTIVE') AND p.policy_to >= CURRENT_DATE)
    OR (###policyStatus### = 'INACTIVE' AND p.policy_to < CURRENT_DATE)
  )
  AND (
    ###policyType### = ''
    OR (###policyType### = 'LIFE' AND EXISTS (
      SELECT 1 FROM policy_type_segregation pts2
      INNER JOIN lookup_data il ON il.id = pts2.iirm_policy_type_lid AND il.deleted_at IS NULL
      WHERE pts2.policy_type_lid = p.policy_type_lid
        AND (lower(il.value) LIKE '%life%' OR lower(il.value) LIKE '%health%')
        AND lower(il.value) NOT LIKE '%non-life%'
    ))
    OR (###policyType### = 'NON_LIFE' AND EXISTS (
      SELECT 1 FROM policy_type_segregation pts2
      INNER JOIN lookup_data il ON il.id = pts2.iirm_policy_type_lid AND il.deleted_at IS NULL
      WHERE pts2.policy_type_lid = p.policy_type_lid
        AND lower(il.value) NOT LIKE '%life%'
        AND lower(il.value) NOT LIKE '%health%'
    ))
    OR (###policyType### NOT IN ('', 'LIFE', 'NON_LIFE') AND ld.lookup_key = ###policyType###)
  )
  AND (
    (SELECT is_all FROM loc_filter)
    OR p.id IN (SELECT policy_id FROM loc_policies)
  )
AND (
    ###policyId### != ''
    OR (COALESCE(###policyStatus###, '') IN ('', 'ACTIVE') AND p.policy_to >= CURRENT_DATE)
    OR (###policyStatus### = 'INACTIVE' AND p.policy_to < CURRENT_DATE)
)  AND (###externalHrUserId### IS NULL
       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
AND (p.is_installment_policy IS NULL OR NOT EXISTS (
  SELECT 1 FROM lookup_data inst_ld
  WHERE inst_ld.id = p.is_installment_policy
    AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES'
    AND inst_ld.deleted_at IS NULL
))
ORDER BY ld.lookup_key, p.policy_name$q$
WHERE name = 'dashboard_policy_cards';


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2 — Add notLoggedInCount / loggedInCount to both reports
-- ─────────────────────────────────────────────────────────────────────────────

-- policy_enrollment_summary: add login_counts CTE + 3 new columns
UPDATE admin_reports
SET query = REPLACE(
  -- 2a. inject login_counts CTE before main SELECT
  REPLACE(
    query,
    E')\n\nSELECT\n  es.total_employees',
    $r$),

login_counts AS (
  SELECT
    COUNT(DISTINCT peepm.employee_id) FILTER (
      WHERE NOT EXISTS (
        SELECT 1 FROM user_activity_log ual
        WHERE ual.user_id           = emp.id
          AND ual.activity_key      = 'LOGGED_IN'
          AND ual.activity_category = 'AUTH'
          AND ual.deleted_at IS NULL
      )
    ) AS not_logged_in_count,
    COUNT(DISTINCT peepm.employee_id) FILTER (
      WHERE EXISTS (
        SELECT 1 FROM user_activity_log ual
        WHERE ual.user_id           = emp.id
          AND ual.activity_key      = 'LOGGED_IN'
          AND ual.activity_category = 'AUTH'
          AND ual.deleted_at IS NULL
      )
    ) AS logged_in_count
  FROM policy_enrollment_employee_policy_map peepm
  JOIN policy_enrollment_employee emp
    ON emp.id = peepm.employee_id AND emp.deleted_at IS NULL
  WHERE peepm.policy_id = ###policyId### AND peepm.deleted_at IS NULL
)

SELECT
  es.total_employees$r$
  ),
  -- 2b. add 3 columns after notStartedPercent + add CROSS JOIN
  E'  ROUND(COALESCE(en.not_started_count,  0) * 100.0 / NULLIF(es.total_employees, 0), 1) AS "notStartedPercent"\nFROM emp_scope       es\nCROSS JOIN enroll_status en\nCROSS JOIN dep_scope     ds',
  E'  ROUND(COALESCE(en.not_started_count,  0) * 100.0 / NULLIF(es.total_employees, 0), 1) AS "notStartedPercent",\n  COALESCE(lc.not_logged_in_count, 0)                                                           AS "notLoggedInCount",\n  COALESCE(lc.logged_in_count,     0)                                                           AS "loggedInCount",\n  ROUND(COALESCE(lc.not_logged_in_count, 0) * 100.0 / NULLIF(es.total_employees, 0), 1)       AS "notLoggedInPercent"\nFROM emp_scope       es\nCROSS JOIN enroll_status en\nCROSS JOIN dep_scope     ds\nCROSS JOIN login_counts  lc'
)
WHERE name = 'policy_enrollment_summary'
  AND query NOT LIKE '%login_counts%';


-- dashboard_policy_cards: add notLoggedInCount + loggedInCount after notEnrolledPercent
UPDATE admin_reports
SET query = REPLACE(
  query,
  E'  ROUND(\n    (SELECT COUNT(DISTINCT pee_np.id)\n     FROM policy_enrollment_employee_policy_map peepm_np\n     JOIN policy_enrollment_employee pee_np\n       ON pee_np.id = peepm_np.employee_id AND pee_np.deleted_at IS NULL\n     WHERE peepm_np.policy_id  = p.id\n       AND peepm_np.deleted_at IS NULL\n       AND (\n         (SELECT is_all FROM loc_filter)\n         OR peepm_np.employee_id IN (SELECT employee_id FROM loc_employees)\n       )\n       AND NOT EXISTS (\n         SELECT 1 FROM user_activity_log ual2\n         WHERE ual2.user_id           = pee_np.id\n           AND ual2.activity_key      = \'LOGGED_IN\'\n           AND ual2.activity_category = \'AUTH\'\n           AND ual2.deleted_at IS NULL\n       )\n    ) * 100.0 / NULLIF(pec.employee_count, 0), 1)                                                   AS "notEnrolledPercent",',
  E'  ROUND(\n    (SELECT COUNT(DISTINCT pee_np.id)\n     FROM policy_enrollment_employee_policy_map peepm_np\n     JOIN policy_enrollment_employee pee_np\n       ON pee_np.id = peepm_np.employee_id AND pee_np.deleted_at IS NULL\n     WHERE peepm_np.policy_id  = p.id\n       AND peepm_np.deleted_at IS NULL\n       AND (\n         (SELECT is_all FROM loc_filter)\n         OR peepm_np.employee_id IN (SELECT employee_id FROM loc_employees)\n       )\n       AND NOT EXISTS (\n         SELECT 1 FROM user_activity_log ual2\n         WHERE ual2.user_id           = pee_np.id\n           AND ual2.activity_key      = \'LOGGED_IN\'\n           AND ual2.activity_category = \'AUTH\'\n           AND ual2.deleted_at IS NULL\n       )\n    ) * 100.0 / NULLIF(pec.employee_count, 0), 1)                                                   AS "notEnrolledPercent",\n  (\n    SELECT COUNT(DISTINCT pee_nli.id)\n    FROM policy_enrollment_employee_policy_map peepm_nli\n    JOIN policy_enrollment_employee pee_nli\n      ON pee_nli.id = peepm_nli.employee_id AND pee_nli.deleted_at IS NULL\n    WHERE peepm_nli.policy_id  = p.id\n      AND peepm_nli.deleted_at IS NULL\n      AND (\n        (SELECT is_all FROM loc_filter)\n        OR peepm_nli.employee_id IN (SELECT employee_id FROM loc_employees)\n      )\n      AND NOT EXISTS (\n        SELECT 1 FROM user_activity_log ual_nli\n        WHERE ual_nli.user_id           = pee_nli.id\n          AND ual_nli.activity_key      = \'LOGGED_IN\'\n          AND ual_nli.activity_category = \'AUTH\'\n          AND ual_nli.deleted_at IS NULL\n      )\n  )                                                                                                   AS "notLoggedInCount",\n  (\n    SELECT COUNT(DISTINCT pee_li.id)\n    FROM policy_enrollment_employee_policy_map peepm_li\n    JOIN policy_enrollment_employee pee_li\n      ON pee_li.id = peepm_li.employee_id AND pee_li.deleted_at IS NULL\n    WHERE peepm_li.policy_id  = p.id\n      AND peepm_li.deleted_at IS NULL\n      AND (\n        (SELECT is_all FROM loc_filter)\n        OR peepm_li.employee_id IN (SELECT employee_id FROM loc_employees)\n      )\n      AND EXISTS (\n        SELECT 1 FROM user_activity_log ual_li\n        WHERE ual_li.user_id           = pee_li.id\n          AND ual_li.activity_key      = \'LOGGED_IN\'\n          AND ual_li.activity_category = \'AUTH\'\n          AND ual_li.deleted_at IS NULL\n      )\n  )                                                                                                   AS "loggedInCount",'
)
WHERE name = 'dashboard_policy_cards'
  AND query NOT LIKE '%notLoggedInCount%';
