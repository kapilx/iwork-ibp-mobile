-- ============================================================================
-- Report: Dashboard Enrollment Status
-- name (used in URL/endpoint): dashboard_enrollment_status    |    id: 25    |    order_no: 24
-- end_point: dashboard_enrollment_status
-- created_at: 2026-05-08 12:04:03.096693    updated_at: 2026-06-29 17:24:15.93638
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
-- 1. MAIN QUERY  (admin_reports.query, id = 25)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH location_filter AS (
    SELECT
        NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') AS location_string
),

location_ids AS (
    SELECT val::int AS address_id
    FROM location_filter,
         regexp_split_to_table(location_string, ',') val
    WHERE val ~ '^\d+$'
),

policy_scope AS MATERIALIZED (
    SELECT p.id
    FROM policy p
    JOIN lookup_data ld
      ON ld.id = p.policy_type_lid
     AND ld.deleted_at IS NULL
    WHERE p.company_id = ###companyId###
      AND (###policyType### = '' OR ld.lookup_key = ###policyType###)
      AND (
            p.is_installment_policy IS NULL
            OR NOT EXISTS (
                SELECT 1
                FROM lookup_data inst_ld
                WHERE inst_ld.id = p.is_installment_policy
                  AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES'
                  AND inst_ld.deleted_at IS NULL
            )
      )
      AND (
            ###externalHrUserId### IS NULL
            OR EXISTS (
                SELECT 1
                FROM external_hr_policy_map ehp
                WHERE ehp.policy_id = p.id
                  AND ehp.hr_management_id = ###externalHrUserId###::INTEGER
            )
      )
),

employee_scope AS MATERIALIZED (
    SELECT DISTINCT
           pee.id,
           pee.user_id
    FROM policy_enrollment_employee pee
    JOIN policy_enrollment_employee_policy_map peepm
      ON peepm.employee_id = pee.id
     AND peepm.deleted_at IS NULL
    JOIN policy_scope ps
      ON ps.id = peepm.policy_id
    LEFT JOIN company_policy_configuration_location cpcl
      ON cpcl.id = pee.policy_config_location_id
    LEFT JOIN location_ids li
      ON li.address_id = cpcl.address_id
    CROSS JOIN location_filter lf
    WHERE pee.company_id = ###companyId###
      AND pee.deleted_at IS NULL
      AND (
            lf.location_string IS NULL
            OR li.address_id IS NOT NULL
      )
),

logged_users AS MATERIALIZED (
    SELECT DISTINCT ual.user_id
    FROM user_activity_log ual
    JOIN employee_scope es
      ON es.user_id = ual.user_id
    WHERE ual.activity_key = 'LOGGED_IN'
      AND ual.activity_category = 'AUTH'
      AND ual.deleted_at IS NULL
),

latest_enrollment AS (
    SELECT employee_id,
           employee_enrollment_status_key
    FROM (
        SELECT
            pee.employee_id,
            pee.employee_enrollment_status_key,
            ROW_NUMBER() OVER (
                PARTITION BY pee.employee_id
                ORDER BY pee.updated_at DESC, pee.id DESC
            ) rn
        FROM policy_employee_enrollment pee
        JOIN policy_scope ps
          ON ps.id = pee.policy_id
        WHERE pee.deleted_at IS NULL
    ) x
    WHERE rn = 1
)

SELECT
    COUNT(*)                                                                    AS "totalEligible",
    COUNT(*) FILTER (WHERE lu.user_id IS NOT NULL)                             AS "loggedIn",
    COUNT(*) FILTER (WHERE lu.user_id IS NULL)                                 AS "notLoggedIn",
    COUNT(*) FILTER (
        WHERE le.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
    )                                                                           AS "enrollmentConfirmed",
    ROUND(COUNT(*) FILTER (WHERE lu.user_id IS NOT NULL) * 100.0
          / NULLIF(COUNT(*), 0), 1)                                            AS "loggedInPercent",
    ROUND(COUNT(*) FILTER (WHERE lu.user_id IS NULL) * 100.0
          / NULLIF(COUNT(*), 0), 1)                                            AS "notLoggedInPercent",
    ROUND(COUNT(*) FILTER (
        WHERE le.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
    ) * 100.0 / NULLIF(COUNT(*), 0), 1)                                       AS "enrollmentConfirmedPercent"

FROM employee_scope es
LEFT JOIN logged_users lu     ON lu.user_id    = es.user_id
LEFT JOIN latest_enrollment le ON le.employee_id = es.id$Q$
--   WHERE id = 25;

WITH location_filter AS (
    SELECT
        NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') AS location_string
),

location_ids AS (
    SELECT val::int AS address_id
    FROM location_filter,
         regexp_split_to_table(location_string, ',') val
    WHERE val ~ '^\d+$'
),

policy_scope AS MATERIALIZED (
    SELECT p.id
    FROM policy p
    JOIN lookup_data ld
      ON ld.id = p.policy_type_lid
     AND ld.deleted_at IS NULL
    WHERE p.company_id = ###companyId###
      AND (###policyType### = '' OR ld.lookup_key = ###policyType###)
      AND (
            p.is_installment_policy IS NULL
            OR NOT EXISTS (
                SELECT 1
                FROM lookup_data inst_ld
                WHERE inst_ld.id = p.is_installment_policy
                  AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES'
                  AND inst_ld.deleted_at IS NULL
            )
      )
      AND (
            ###externalHrUserId### IS NULL
            OR EXISTS (
                SELECT 1
                FROM external_hr_policy_map ehp
                WHERE ehp.policy_id = p.id
                  AND ehp.hr_management_id = ###externalHrUserId###::INTEGER
            )
      )
),

employee_scope AS MATERIALIZED (
    SELECT DISTINCT
           pee.id,
           pee.user_id
    FROM policy_enrollment_employee pee
    JOIN policy_enrollment_employee_policy_map peepm
      ON peepm.employee_id = pee.id
     AND peepm.deleted_at IS NULL
    JOIN policy_scope ps
      ON ps.id = peepm.policy_id
    LEFT JOIN company_policy_configuration_location cpcl
      ON cpcl.id = pee.policy_config_location_id
    LEFT JOIN location_ids li
      ON li.address_id = cpcl.address_id
    CROSS JOIN location_filter lf
    WHERE pee.company_id = ###companyId###
      AND pee.deleted_at IS NULL
      AND (
            lf.location_string IS NULL
            OR li.address_id IS NOT NULL
      )
),

logged_users AS MATERIALIZED (
    SELECT DISTINCT ual.user_id
    FROM user_activity_log ual
    JOIN employee_scope es
      ON es.user_id = ual.user_id
    WHERE ual.activity_key = 'LOGGED_IN'
      AND ual.activity_category = 'AUTH'
      AND ual.deleted_at IS NULL
),

latest_enrollment AS (
    SELECT employee_id,
           employee_enrollment_status_key
    FROM (
        SELECT
            pee.employee_id,
            pee.employee_enrollment_status_key,
            ROW_NUMBER() OVER (
                PARTITION BY pee.employee_id
                ORDER BY pee.updated_at DESC, pee.id DESC
            ) rn
        FROM policy_employee_enrollment pee
        JOIN policy_scope ps
          ON ps.id = pee.policy_id
        WHERE pee.deleted_at IS NULL
    ) x
    WHERE rn = 1
)

SELECT
    COUNT(*)                                                                    AS "totalEligible",
    COUNT(*) FILTER (WHERE lu.user_id IS NOT NULL)                             AS "loggedIn",
    COUNT(*) FILTER (WHERE lu.user_id IS NULL)                                 AS "notLoggedIn",
    COUNT(*) FILTER (
        WHERE le.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
    )                                                                           AS "enrollmentConfirmed",
    ROUND(COUNT(*) FILTER (WHERE lu.user_id IS NOT NULL) * 100.0
          / NULLIF(COUNT(*), 0), 1)                                            AS "loggedInPercent",
    ROUND(COUNT(*) FILTER (WHERE lu.user_id IS NULL) * 100.0
          / NULLIF(COUNT(*), 0), 1)                                            AS "notLoggedInPercent",
    ROUND(COUNT(*) FILTER (
        WHERE le.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
    ) * 100.0 / NULLIF(COUNT(*), 0), 1)                                       AS "enrollmentConfirmedPercent"

FROM employee_scope es
LEFT JOIN logged_users lu     ON lu.user_id    = es.user_id
LEFT JOIN latest_enrollment le ON le.employee_id = es.id

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 25)
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
-- Filter: Policy Type
--   parameter_name : policyType
--   token in query : ###policyType###
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
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 25)
-- ------------------------------------------------------------------
--   totalEligible                -> Total Eligible                 (variable: totalEligible, type: number, align: right)
--   loggedIn                     -> Logged In                      (variable: loggedIn, type: number, align: right)
--   notLoggedIn                  -> Not Logged In                  (variable: notLoggedIn, type: number, align: right)
--   enrollmentConfirmed          -> Enrollment Confirmed           (variable: enrollmentConfirmed, type: number, align: right)
--   loggedInPercent              -> Logged In %                    (variable: loggedInPercent, type: number, align: right)
--   notLoggedInPercent           -> Not Logged In %                (variable: notLoggedInPercent, type: number, align: right)
--   enrollmentConfirmedPercent   -> Enrollment Confirmed %         (variable: enrollmentConfirmedPercent, type: number, align: right)

