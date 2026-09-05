-- ============================================================================
-- Report: Dashboard Demographics
-- name (used in URL/endpoint): dashboard_demographics    |    id: 26    |    order_no: 25
-- end_point: dashboard_demographics
-- created_at: 2026-05-08 12:04:29.721841    updated_at: 2026-06-01 12:11:46.364755
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
-- 1. MAIN QUERY  (admin_reports.query, id = 26)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH policy_scope AS (
  SELECT p.id AS policy_id
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyType### = '' OR ld.lookup_key = ###policyType###)
    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
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
  INNER JOIN policy_enrollment_employee pee_ds
    ON pee_ds.id = emp.employee_id AND pee_ds.deleted_at IS NULL
  WHERE emp.deleted_at IS NULL
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR pee_ds.policy_config_location_id = ANY(
        SELECT val::INTEGER FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
        ) AS val WHERE val ~ '^\d+$'
      )
    )
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
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR EXISTS (
        SELECT 1
        FROM policy_enrollment_employee pee_dd
        INNER JOIN policy_enrollment_employee_policy_map peepm_dd
          ON peepm_dd.employee_id = pee_dd.id
         AND peepm_dd.policy_id = dep.policy_id
         AND peepm_dd.deleted_at IS NULL
        WHERE pee_dd.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        )
        AND pee_dd.deleted_at IS NULL
      )
    )
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
CROSS JOIN dep_counts dc$Q$
--   WHERE id = 26;

WITH policy_scope AS (
  SELECT p.id AS policy_id
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyType### = '' OR ld.lookup_key = ###policyType###)
    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
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
  INNER JOIN policy_enrollment_employee pee_ds
    ON pee_ds.id = emp.employee_id AND pee_ds.deleted_at IS NULL
  WHERE emp.deleted_at IS NULL
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR pee_ds.policy_config_location_id = ANY(
        SELECT val::INTEGER FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
        ) AS val WHERE val ~ '^\d+$'
      )
    )
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
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR EXISTS (
        SELECT 1
        FROM policy_enrollment_employee pee_dd
        INNER JOIN policy_enrollment_employee_policy_map peepm_dd
          ON peepm_dd.employee_id = pee_dd.id
         AND peepm_dd.policy_id = dep.policy_id
         AND peepm_dd.deleted_at IS NULL
        WHERE pee_dd.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        )
        AND pee_dd.deleted_at IS NULL
      )
    )
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

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 26)
-- ------------------------------------------------------------------
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
-- Filter: Policy Period Start
--   parameter_name : policyPeriodStart
--   token in query : ###policyPeriodStart###
--   data_type      : date
--   input_field    : input
--   order_no       : 3
--
-- Filter: Policy Period End
--   parameter_name : policyPeriodEnd
--   token in query : ###policyPeriodEnd###
--   data_type      : date
--   input_field    : input
--   order_no       : 4
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 26)
-- ------------------------------------------------------------------
--   inceptionMembersTotal        -> Inception Members Total        (variable: inceptionMembersTotal, type: number, align: right)
--   inceptionEmployees           -> Inception Employees            (variable: inceptionEmployees, type: number, align: right)
--   inceptionDependents          -> Inception Dependents           (variable: inceptionDependents, type: number, align: right)
--   newAdditionsTotal            -> New Additions Total            (variable: newAdditionsTotal, type: number, align: right)
--   newAdditionsEmployees        -> New Additions Employees        (variable: newAdditionsEmployees, type: number, align: right)
--   newAdditionsDependents       -> New Additions Dependents       (variable: newAdditionsDependents, type: number, align: right)
--   deletionsTotal               -> Deletions Total                (variable: deletionsTotal, type: number, align: right)
--   deletionsEmployees           -> Deletions Employees            (variable: deletionsEmployees, type: number, align: right)
--   deletionsDependents          -> Deletions Dependents           (variable: deletionsDependents, type: number, align: right)
--   totalActiveMembers           -> Total Active Members           (variable: totalActiveMembers, type: number, align: right)
--   totalActiveEmployees         -> Total Active Employees         (variable: totalActiveEmployees, type: number, align: right)
--   totalActiveDependents        -> Total Active Dependents        (variable: totalActiveDependents, type: number, align: right)

