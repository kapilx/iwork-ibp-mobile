-- =============================================================================
-- endorsement-employee-metrics-rewrite.sql
--
-- Three CTEs for Employee Strength:
--   - inception_counts    : endorsement where is_inception = true
--   - active_counts       : COUNT from map table (deleted_at IS NULL) — matches iworker
--   - endorsement_activity: SUM endorsment_count by net_premium sign for Added/Deleted
-- =============================================================================

BEGIN;

UPDATE admin_reports
SET query = $Q$
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
$Q$,
updated_at = NOW()
WHERE name = 'endorsement_employee_metrics';

-- VERIFY
SELECT name,
  CASE
    WHEN query LIKE '%pcfg.policy_id = p.id%'
         AND query NOT LIKE '%IS NULL) IN (%'
         AND query NOT LIKE '%pcfg_loc%'
         AND query LIKE '%###locationIds###%'
      THEN 'OK — single clean Pattern B per CTE'
    WHEN query LIKE '%IS NULL) IN (%'
      THEN 'BROKEN — partial strip fragment still present'
    WHEN query LIKE '%pcfg_loc%'
      THEN 'STALE — pcfg_loc alias still present (rewrite did not apply)'
    ELSE 'CHECK MANUALLY'
  END AS status
FROM admin_reports
WHERE name = 'endorsement_employee_metrics';

COMMIT;
