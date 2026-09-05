-- =============================================================================
-- External HR Access Filter Migration
-- Purpose : Restrict portfolio_group_companies and external_hr_company_locations
--           to show only the companies / locations the external HR user has
--           been explicitly assigned.
-- Idempotent: all UPDATEs are guarded by NOT LIKE, all INSERTs by NOT EXISTS
-- =============================================================================


-- ── 1. portfolio_group_companies — add externalHrUserId company filter ─────────
UPDATE public.admin_reports
SET
  query      = REPLACE(
    query,
    'ORDER BY "groupId", "companyName"',
    '  AND (
    ###externalHrUserId### IS NULL
    OR c.id IN (
      SELECT DISTINCT company_id
      FROM external_hr_policy_map
      WHERE hr_management_id = ###externalHrUserId###::INTEGER
        AND company_id IS NOT NULL
    )
  )
ORDER BY "groupId", "companyName"'
  ),
  updated_at = NOW(),
  updated_by = 'SYSTEM'
WHERE name  = 'portfolio_group_companies'
  AND query NOT LIKE '%externalHrUserId%';

-- parameter for portfolio_group_companies
INSERT INTO public.admin_reports_parameters
  (admin_report_id, parameter_name, label, data_type,
   created_at, updated_at, deleted_at,
   created_by, updated_by, deleted_by,
   query_parameter, input_field_type, option_type, option, order_no)
SELECT
  ar.id,
  'externalHrUserId',
  'External HR User ID',
  'integer',
  NOW(), NOW(), NULL,
  'SYSTEM', 'SYSTEM', NULL,
  '###externalHrUserId###',
  NULL, NULL, NULL,
  (SELECT COALESCE(MAX(order_no), 0) + 1
   FROM public.admin_reports_parameters
   WHERE admin_report_id = ar.id)
FROM public.admin_reports ar
WHERE ar.name = 'portfolio_group_companies'
  AND NOT EXISTS (
    SELECT 1 FROM public.admin_reports_parameters p
    WHERE p.admin_report_id = ar.id
      AND p.parameter_name   = 'externalHrUserId'
  );


-- ── 2. external_hr_company_locations — filter locations + employee counts ──────
--   • Shows only locations assigned to the HR user (external_hr_location_map)
--   • employee_count and no_location_employee_count count only employees who
--     are enrolled in the HR user's accessible policies (external_hr_policy_map)
UPDATE public.admin_reports
SET
  query = 'SELECT
  cpcl.id,
  a.location_code,
  a.addr_1,
  COUNT(DISTINCT pee.id) AS employee_count,
  (
    SELECT COUNT(DISTINCT pee2.id)
    FROM policy_enrollment_employee pee2
    WHERE pee2.company_id = ###companyId###
      AND pee2.deleted_at IS NULL
      AND pee2.policy_config_location_id IS NULL
      AND EXISTS (
        SELECT 1
        FROM policy_enrollment_employee_policy_map pepm2
        JOIN policy p2 ON p2.id = pepm2.policy_id
        WHERE pepm2.employee_id = pee2.id
          AND p2.company_id    = ###companyId###
          AND pepm2.deleted_at IS NULL
          AND p2.policy_to    >= CURRENT_DATE
          AND (
            ###externalHrUserId### IS NULL
            OR p2.id IN (
              SELECT policy_id FROM external_hr_policy_map
              WHERE hr_management_id = ###externalHrUserId###::INTEGER
            )
          )
      )
  ) AS no_location_employee_count
FROM company_policy_configuration_location cpcl
JOIN address a ON a.id = cpcl.address_id
LEFT JOIN policy_enrollment_employee pee
  ON  pee.policy_config_location_id = cpcl.id
  AND pee.deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM policy_enrollment_employee_policy_map pepm
    JOIN policy p ON p.id = pepm.policy_id
    WHERE pepm.employee_id = pee.id
      AND p.company_id    = ###companyId###
      AND pepm.deleted_at IS NULL
      AND p.policy_to    >= CURRENT_DATE
      AND (
        ###externalHrUserId### IS NULL
        OR p.id IN (
          SELECT policy_id FROM external_hr_policy_map
          WHERE hr_management_id = ###externalHrUserId###::INTEGER
        )
      )
  )
WHERE cpcl.company_id = ###companyId###
  AND a.deleted_at IS NULL
  AND (
    ###externalHrUserId### IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM external_hr_location_map
      WHERE hr_management_id = ###externalHrUserId###::INTEGER
    )
    OR cpcl.id IN (
      SELECT address_id FROM external_hr_location_map
      WHERE hr_management_id = ###externalHrUserId###::INTEGER
    )
  )
GROUP BY cpcl.id, a.location_code, a.addr_1
ORDER BY a.location_code ASC',
  updated_at = NOW(),
  updated_by = 'SYSTEM'
WHERE name = 'external_hr_company_locations';

-- parameter for external_hr_company_locations
INSERT INTO public.admin_reports_parameters
  (admin_report_id, parameter_name, label, data_type,
   created_at, updated_at, deleted_at,
   created_by, updated_by, deleted_by,
   query_parameter, input_field_type, option_type, option, order_no)
SELECT
  ar.id,
  'externalHrUserId',
  'External HR User ID',
  'integer',
  NOW(), NOW(), NULL,
  'SYSTEM', 'SYSTEM', NULL,
  '###externalHrUserId###',
  NULL, NULL, NULL,
  (SELECT COALESCE(MAX(order_no), 0) + 1
   FROM public.admin_reports_parameters
   WHERE admin_report_id = ar.id)
FROM public.admin_reports ar
WHERE ar.name = 'external_hr_company_locations'
  AND NOT EXISTS (
    SELECT 1 FROM public.admin_reports_parameters p
    WHERE p.admin_report_id = ar.id
      AND p.parameter_name   = 'externalHrUserId'
  );


-- ── 3. Verify ──────────────────────────────────────────────────────────────────
SELECT
  ar.name,
  CASE WHEN ar.query LIKE '%externalHrUserId%' THEN '✓ query patched'
       ELSE                                          '✗ query NOT patched' END AS query_status,
  CASE WHEN EXISTS (
    SELECT 1 FROM public.admin_reports_parameters p
    WHERE p.admin_report_id = ar.id AND p.parameter_name = 'externalHrUserId'
  ) THEN '✓ parameter exists'
    ELSE '✗ parameter MISSING' END AS param_status
FROM public.admin_reports ar
WHERE ar.name IN ('portfolio_group_companies', 'external_hr_company_locations')
ORDER BY ar.name;




-- ── Fix 1: dependent_count — filter by employee location, not policy ──────────
UPDATE public.admin_reports
SET
  query = REPLACE(
    query,
    'policy_dependent_counts AS (
  SELECT
    ped.policy_id,
    COUNT(ped.id) AS dependent_count
  FROM policy_enrollment_dependent ped
  WHERE ped.deleted_at IS NULL
    AND (
      (SELECT is_all FROM loc_filter)
      OR ped.policy_id IN (SELECT policy_id FROM loc_policies)
    )
  GROUP BY ped.policy_id
)',
    'policy_dependent_counts AS (
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
)'
  ),
  updated_at = NOW(),
  updated_by = 'SYSTEM'
WHERE name = 'dashboard_policy_cards'
  AND query LIKE '%OR ped.policy_id IN (SELECT policy_id FROM loc_policies)%';


-- ── Fix 2: notEnrolledCount — derive from employee_count, not enrollment table ─
-- Employees with no row in policy_employee_enrollment are missed by NOT_STARTED filter
-- Correct formula: employee_count - enrolled - in_progress = true not-logged-in
UPDATE public.admin_reports
SET
  query = REPLACE(
    REPLACE(
      query,
      'COALESCE(pen.not_started_count, 0)                                                                AS "notEnrolledCount",',
      'GREATEST(COALESCE(pec.employee_count, 0) - COALESCE(pen.enrolled_count, 0) - COALESCE(pen.in_progress_count, 0), 0) AS "notEnrolledCount",'
    ),
    'ROUND(COALESCE(pen.not_started_count, 0) * 100.0 / NULLIF(pec.employee_count, 0), 1)             AS "notEnrolledPercent",',
    'ROUND(GREATEST(COALESCE(pec.employee_count, 0) - COALESCE(pen.enrolled_count, 0) - COALESCE(pen.in_progress_count, 0), 0) * 100.0 / NULLIF(pec.employee_count, 0), 1) AS "notEnrolledPercent",'
  ),
  updated_at = NOW(),
  updated_by = 'SYSTEM'
WHERE name = 'dashboard_policy_cards';



UPDATE public.admin_reports
SET
  query = 'SELECT
  ap.id,
  ap.policy_name        AS name,
  ap.insurer_policy_number AS "policyNumber",
  TO_CHAR(ap.policy_from, ''DD Mon YYYY'') AS "policyFrom",
  TO_CHAR(ap.policy_to,   ''DD Mon YYYY'') AS "policyTo",
  COALESCE(
    (SELECT i.display_name
     FROM policy_insurer_map pim
     JOIN insurer i ON i.id = pim.insurer_id
     WHERE pim.policy_id = ap.id
     ORDER BY pim.share_percentage DESC NULLS LAST, pim.id
     LIMIT 1),
    ''—''
  ) AS "insurerName"
FROM policy ap
WHERE ap.company_id = ###companyId###
  AND (
    ap.is_installment_policy IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM lookup_data inst_ld
      WHERE inst_ld.id = ap.is_installment_policy
        AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES''
        AND inst_ld.deleted_at IS NULL
    )
  )
ORDER BY ap.policy_name ASC',
  updated_at = NOW(),
  updated_by = 'SYSTEM'
WHERE name = 'external_hr_company_policies';




UPDATE public.admin_reports
SET
  query = REPLACE(
    REPLACE(
      query,
      -- exact string 1
      'GREATEST(COALESCE(pec.employee_count, 0) - COALESCE(pen.enrolled_count, 0) - COALESCE(pen.in_progress_count, 0), 0) AS "notEnrolledCount",',
      '(
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
        WHERE ual.user_id           = pee_nl.user_id
          AND ual.activity_key      = ''LOGGED_IN''
          AND ual.activity_category = ''AUTH''
          AND ual.deleted_at IS NULL
      )
  )                                                                                                   AS "notEnrolledCount",'
    ),
    -- exact string 2
    '  ROUND(GREATEST(COALESCE(pec.employee_count, 0) - COALESCE(pen.enrolled_count, 0) - COALESCE(pen.in_progress_count, 0), 0) * 100.0 / NULLIF(pec.employee_count, 0), 1) AS "notEnrolledPercent",',
    '  ROUND(
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
         WHERE ual2.user_id           = pee_np.user_id
           AND ual2.activity_key      = ''LOGGED_IN''
           AND ual2.activity_category = ''AUTH''
           AND ual2.deleted_at IS NULL
       )
    ) * 100.0 / NULLIF(pec.employee_count, 0), 1)                                                   AS "notEnrolledPercent",'
  ),
  updated_at = NOW(),
  updated_by = 'SYSTEM'
WHERE name = 'dashboard_policy_cards';