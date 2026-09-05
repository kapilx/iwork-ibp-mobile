-- Run this AFTER the original queries are restored in DB
-- Adds notLoggedInCount / loggedInCount to dashboard_policy_cards
-- Adds notLoggedInCount / loggedInCount / notLoggedInPercent to policy_enrollment_summary
-- Idempotent: skips if already applied

-- ── 1. policy_enrollment_summary ─────────────────────────────────────────────
UPDATE admin_reports
SET query = REPLACE(
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
  E'  ROUND(COALESCE(en.not_started_count,  0) * 100.0 / NULLIF(es.total_employees, 0), 1) AS "notStartedPercent"\nFROM emp_scope       es\nCROSS JOIN enroll_status en\nCROSS JOIN dep_scope     ds',
  E'  ROUND(COALESCE(en.not_started_count,  0) * 100.0 / NULLIF(es.total_employees, 0), 1) AS "notStartedPercent",\n  COALESCE(lc.not_logged_in_count, 0)                                                           AS "notLoggedInCount",\n  COALESCE(lc.logged_in_count,     0)                                                           AS "loggedInCount",\n  ROUND(COALESCE(lc.not_logged_in_count, 0) * 100.0 / NULLIF(es.total_employees, 0), 1)       AS "notLoggedInPercent"\nFROM emp_scope       es\nCROSS JOIN enroll_status en\nCROSS JOIN dep_scope     ds\nCROSS JOIN login_counts  lc'
)
WHERE name = 'policy_enrollment_summary'
  AND query NOT LIKE '%login_counts%';


-- ── 2. dashboard_policy_cards ─────────────────────────────────────────────────
UPDATE admin_reports
SET query = REPLACE(
  -- fix existing notEnrolledCount: wrong user_id join → correct .id join
  REPLACE(
    -- fix existing notEnrolledPercent: wrong user_id join → correct .id join
    REPLACE(
      query,
      'WHERE ual.user_id           = pee_nl.user_id',
      'WHERE ual.user_id           = pee_nl.id'
    ),
    'WHERE ual2.user_id           = pee_np.user_id',
    'WHERE ual2.user_id           = pee_np.id'
  ),
  -- add notLoggedInCount + loggedInCount after notEnrolledPercent
  E') * 100.0 / NULLIF(pec.employee_count, 0), 1)                                                   AS "notEnrolledPercent",',
  E') * 100.0 / NULLIF(pec.employee_count, 0), 1)                                                   AS "notEnrolledPercent",\n  (\n    SELECT COUNT(DISTINCT pee_nli.id)\n    FROM policy_enrollment_employee_policy_map peepm_nli\n    JOIN policy_enrollment_employee pee_nli\n      ON pee_nli.id = peepm_nli.employee_id AND pee_nli.deleted_at IS NULL\n    WHERE peepm_nli.policy_id  = p.id\n      AND peepm_nli.deleted_at IS NULL\n      AND (\n        (SELECT is_all FROM loc_filter)\n        OR peepm_nli.employee_id IN (SELECT employee_id FROM loc_employees)\n      )\n      AND NOT EXISTS (\n        SELECT 1 FROM user_activity_log ual_nli\n        WHERE ual_nli.user_id           = pee_nli.id\n          AND ual_nli.activity_key      = \'LOGGED_IN\'\n          AND ual_nli.activity_category = \'AUTH\'\n          AND ual_nli.deleted_at IS NULL\n      )\n  )                                                                                                   AS "notLoggedInCount",\n  (\n    SELECT COUNT(DISTINCT pee_li.id)\n    FROM policy_enrollment_employee_policy_map peepm_li\n    JOIN policy_enrollment_employee pee_li\n      ON pee_li.id = peepm_li.employee_id AND pee_li.deleted_at IS NULL\n    WHERE peepm_li.policy_id  = p.id\n      AND peepm_li.deleted_at IS NULL\n      AND (\n        (SELECT is_all FROM loc_filter)\n        OR peepm_li.employee_id IN (SELECT employee_id FROM loc_employees)\n      )\n      AND EXISTS (\n        SELECT 1 FROM user_activity_log ual_li\n        WHERE ual_li.user_id           = pee_li.id\n          AND ual_li.activity_key      = \'LOGGED_IN\'\n          AND ual_li.activity_category = \'AUTH\'\n          AND ual_li.deleted_at IS NULL\n      )\n  )                                                                                                   AS "loggedInCount",'
)
WHERE name = 'dashboard_policy_cards'
  AND query NOT LIKE '%notLoggedInCount%';
