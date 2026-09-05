-- ============================================================================
-- Report: Endorsement Employee & Lives Metrics
-- name (used in URL/endpoint): endorsement_employee_metrics    |    id: 41    |    order_no: 21
-- end_point: endorsement_employee_metrics
-- created_at: 2026-05-08 12:08:57.415724    updated_at: 2026-06-03 07:36:37.486285
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
-- 1. MAIN QUERY  (admin_reports.query, id = 41)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH inception_counts AS (
  SELECT
    COALESCE(e.endorsment_count,           0) AS employees_at_inception,
    COALESCE(e.endorsment_dependent_count, 0) AS dependents_at_inception
  FROM endorsement e
  INNER JOIN policy p ON p.id = e.policy_id
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '' OR e.policy_id::text = ###policyId###)
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR EXISTS (
        SELECT 1
        FROM policy_configuration pcfg,
             jsonb_array_elements_text(COALESCE(pcfg.policy_configuration->'selectedLocationIds', '[]'::jsonb)) loc_id
        WHERE pcfg.policy_id = p.id
          AND loc_id::INTEGER = ANY(
            SELECT val::INTEGER
            FROM regexp_split_to_table(
              NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
              ','
            ) AS val
            WHERE val ~ '^\d+$'
          )
      )
    )
    AND (###externalHrUserId### IS NULL
           OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
    AND e.is_inception = true
  ORDER BY e.id ASC
  LIMIT 1
),
active_counts AS (
  SELECT
    (SELECT COUNT(DISTINCT peepm.employee_id)
     FROM policy_enrollment_employee_policy_map peepm
     INNER JOIN policy p ON p.id = peepm.policy_id
     WHERE p.company_id = ###companyId###
       AND (###policyId### = '' OR peepm.policy_id::text = ###policyId###)
       AND peepm.deleted_at IS NULL
       AND (###externalHrUserId### IS NULL
              OR peepm.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
    ) AS active_employees,
    (SELECT COUNT(DISTINCT ped.id)
     FROM policy_enrollment_dependent ped
     INNER JOIN policy p ON p.id = ped.policy_id
     WHERE p.company_id = ###companyId###
       AND (###policyId### = '' OR ped.policy_id::text = ###policyId###)
       AND ped.deleted_at IS NULL
       AND (###externalHrUserId### IS NULL
              OR ped.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
    ) AS active_dependents
),
endorsement_activity AS (
  SELECT
    COALESCE(SUM(CASE WHEN e.net_premium > 0 THEN e.endorsment_count ELSE 0 END), 0)                                    AS emp_additions,
    COALESCE(SUM(CASE WHEN e.net_premium < 0 THEN ABS(e.endorsment_count) ELSE 0 END), 0)                               AS emp_deletions,
    COALESCE(SUM(CASE WHEN e.net_premium > 0 THEN GREATEST(COALESCE(e.endorsment_dependent_count, 0), 0) ELSE 0 END), 0) AS dep_additions,
    COALESCE(SUM(CASE WHEN e.net_premium < 0 THEN ABS(COALESCE(e.endorsment_dependent_count, 0)) ELSE 0 END), 0)        AS dep_deletions
  FROM endorsement e
  INNER JOIN policy p ON p.id = e.policy_id
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '' OR e.policy_id::text = ###policyId###)
    AND e.is_inception IS NOT TRUE
    AND e.net_premium IS NOT NULL
    AND (###externalHrUserId### IS NULL
           OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
)
SELECT
  ic.employees_at_inception                                                           AS "employeesAtInception",
  ea.emp_additions                                                                    AS "employeesInAddition",
  ea.emp_deletions                                                                    AS "employeesInDeletion",
  ac.active_employees                                                                  AS "activeEmployees",
  ic.employees_at_inception + ic.dependents_at_inception                             AS "livesAtInception",
  ea.emp_additions + ea.dep_additions                                                 AS "livesInAddition",
  ea.emp_deletions + ea.dep_deletions                                                 AS "livesInDeletion",
  ac.active_employees + ac.active_dependents                                          AS "activeLives"
FROM inception_counts ic
CROSS JOIN endorsement_activity ea
CROSS JOIN active_counts ac$Q$
--   WHERE id = 41;

WITH inception_counts AS (
  SELECT
    COALESCE(e.endorsment_count,           0) AS employees_at_inception,
    COALESCE(e.endorsment_dependent_count, 0) AS dependents_at_inception
  FROM endorsement e
  INNER JOIN policy p ON p.id = e.policy_id
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '' OR e.policy_id::text = ###policyId###)
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR EXISTS (
        SELECT 1
        FROM policy_configuration pcfg,
             jsonb_array_elements_text(COALESCE(pcfg.policy_configuration->'selectedLocationIds', '[]'::jsonb)) loc_id
        WHERE pcfg.policy_id = p.id
          AND loc_id::INTEGER = ANY(
            SELECT val::INTEGER
            FROM regexp_split_to_table(
              NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
              ','
            ) AS val
            WHERE val ~ '^\d+$'
          )
      )
    )
    AND (###externalHrUserId### IS NULL
           OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
    AND e.is_inception = true
  ORDER BY e.id ASC
  LIMIT 1
),
active_counts AS (
  SELECT
    (SELECT COUNT(DISTINCT peepm.employee_id)
     FROM policy_enrollment_employee_policy_map peepm
     INNER JOIN policy p ON p.id = peepm.policy_id
     WHERE p.company_id = ###companyId###
       AND (###policyId### = '' OR peepm.policy_id::text = ###policyId###)
       AND peepm.deleted_at IS NULL
       AND (###externalHrUserId### IS NULL
              OR peepm.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
    ) AS active_employees,
    (SELECT COUNT(DISTINCT ped.id)
     FROM policy_enrollment_dependent ped
     INNER JOIN policy p ON p.id = ped.policy_id
     WHERE p.company_id = ###companyId###
       AND (###policyId### = '' OR ped.policy_id::text = ###policyId###)
       AND ped.deleted_at IS NULL
       AND (###externalHrUserId### IS NULL
              OR ped.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
    ) AS active_dependents
),
endorsement_activity AS (
  SELECT
    COALESCE(SUM(CASE WHEN e.net_premium > 0 THEN e.endorsment_count ELSE 0 END), 0)                                    AS emp_additions,
    COALESCE(SUM(CASE WHEN e.net_premium < 0 THEN ABS(e.endorsment_count) ELSE 0 END), 0)                               AS emp_deletions,
    COALESCE(SUM(CASE WHEN e.net_premium > 0 THEN GREATEST(COALESCE(e.endorsment_dependent_count, 0), 0) ELSE 0 END), 0) AS dep_additions,
    COALESCE(SUM(CASE WHEN e.net_premium < 0 THEN ABS(COALESCE(e.endorsment_dependent_count, 0)) ELSE 0 END), 0)        AS dep_deletions
  FROM endorsement e
  INNER JOIN policy p ON p.id = e.policy_id
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '' OR e.policy_id::text = ###policyId###)
    AND e.is_inception IS NOT TRUE
    AND e.net_premium IS NOT NULL
    AND (###externalHrUserId### IS NULL
           OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
)
SELECT
  ic.employees_at_inception                                                           AS "employeesAtInception",
  ea.emp_additions                                                                    AS "employeesInAddition",
  ea.emp_deletions                                                                    AS "employeesInDeletion",
  ac.active_employees                                                                  AS "activeEmployees",
  ic.employees_at_inception + ic.dependents_at_inception                             AS "livesAtInception",
  ea.emp_additions + ea.dep_additions                                                 AS "livesInAddition",
  ea.emp_deletions + ea.dep_deletions                                                 AS "livesInDeletion",
  ac.active_employees + ac.active_dependents                                          AS "activeLives"
FROM inception_counts ic
CROSS JOIN endorsement_activity ea
CROSS JOIN active_counts ac

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 41)
-- ------------------------------------------------------------------
-- Filter: (no label -- stub/unconfigured parameter)
--   parameter_name : locationIds
--   token in query : ###locationIds###
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
-- Filter: Policy ID
--   parameter_name : policyId
--   token in query : ###policyId###
--   data_type      : string
--   input_field    : input
--   order_no       : 2
--
-- Filter: External HR User ID
--   parameter_name : externalHrUserId
--   token in query : ###externalHrUserId###
--   data_type      : number
--   input_field    : input
--   order_no       : 99
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 41)
-- ------------------------------------------------------------------
--   employeesAtInception         -> Employees at Inception         (variable: employeesAtInception, type: number, align: right)
--   employeesInAddition          -> Employees in Addition          (variable: employeesInAddition, type: number, align: right)
--   employeesInDeletion          -> Employees in Deletion          (variable: employeesInDeletion, type: number, align: right)
--   activeEmployees              -> Active Employees               (variable: activeEmployees, type: number, align: right)
--   livesAtInception             -> Lives at Inception             (variable: livesAtInception, type: number, align: right)
--   livesInAddition              -> Lives in Addition              (variable: livesInAddition, type: number, align: right)
--   livesInDeletion              -> Lives in Deletion              (variable: livesInDeletion, type: number, align: right)
--   activeLives                  -> Active Lives                   (variable: activeLives, type: number, align: right)

