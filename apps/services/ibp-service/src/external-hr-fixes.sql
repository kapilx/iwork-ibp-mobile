-- =============================================================
-- EXTERNAL HR: Schema + Report SQL fixes
-- Run this once against the database.
-- =============================================================


-- -------------------------------------------------------------
-- 1. Make user_id nullable in external_hr_policy_map
-- -------------------------------------------------------------

-- BEFORE: check current nullability
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'external_hr_policy_map'
  AND column_name = 'user_id';

ALTER TABLE external_hr_policy_map
  ALTER COLUMN user_id DROP NOT NULL;

-- AFTER: confirm nullable
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'external_hr_policy_map'
  AND column_name = 'user_id';


-- -------------------------------------------------------------
-- 2. Fix all report queries: user_id → hr_management_id
--    in external_hr_policy_map externalHrUserId filter
--    Covers: endorsement_list, portfolio_company_policies,
--            portfolio_kpi_summary, dashboard_policy_cards,
--            endorsement_overview, cd_account_details,
--            cd_transactions, cd_kpi_summary,
--            endorsement_employee_metrics, policy_claim_history,
--            dashboard_enrollment_status
-- -------------------------------------------------------------

-- BEFORE: reports still using user_id filter
SELECT name
FROM admin_report
WHERE query LIKE '%external_hr_policy_map%'
  AND query LIKE '%user_id = ###externalHrUserId###%'
  AND deleted_at IS NULL
ORDER BY name;

UPDATE admin_report
SET query = REPLACE(
  query,
  'SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER',
  'SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER'
)
WHERE query LIKE '%external_hr_policy_map%'
  AND query LIKE '%user_id = ###externalHrUserId###%';

-- AFTER: confirm all updated (should return 0 rows)
SELECT name
FROM admin_report
WHERE query LIKE '%external_hr_policy_map%'
  AND query LIKE '%user_id = ###externalHrUserId###%'
  AND deleted_at IS NULL
ORDER BY name;


-- -------------------------------------------------------------
-- 3. Fix external_hr_user_list
--    - Removed JOIN users (user_id is null for detached HR users)
--    - epm join: user_id → hr_management_id
-- -------------------------------------------------------------

-- BEFORE
SELECT name, query FROM admin_report WHERE name = 'external_hr_user_list';

UPDATE admin_report
SET query =
'SELECT
  hum.id          AS hr_management_id,
  hum.user_id     AS user_id,
  hum.user_name   AS full_name,
  hum.email_id    AS email,
  hum.role_key    AS role_key,
  hum.company_name,
  hum.company_id,
  COUNT(DISTINCT epm.policy_id) AS policy_count,
  hum.created_at
FROM hr_user_management hum
LEFT JOIN external_hr_policy_map epm ON epm.hr_management_id = hum.id
WHERE hum.role_key = ''EXTERNAL_HR''
  AND hum.deleted_at IS NULL
  AND hum.company_id = ###companyId###
  AND (###search### IS NULL
       OR hum.user_name ILIKE ''%'' || ###search### || ''%''
       OR hum.email_id  ILIKE ''%'' || ###search### || ''%'')
GROUP BY hum.id, hum.user_id, hum.user_name, hum.email_id, hum.role_key,
         hum.company_name, hum.company_id, hum.created_at
ORDER BY hum.created_at DESC'
WHERE name = 'external_hr_user_list';

-- AFTER
SELECT name, query FROM admin_report WHERE name = 'external_hr_user_list';


-- -------------------------------------------------------------
-- 4. Fix external_hr_user_detail
--    - epm join: user_id → hr_management_id
--    - elm join: user_id → hr_management_id
-- -------------------------------------------------------------

-- BEFORE
SELECT name, query FROM admin_report WHERE name = 'external_hr_user_detail';

UPDATE admin_report
SET query =
'SELECT
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
LEFT JOIN external_hr_policy_map   epm ON epm.hr_management_id = hum.id
LEFT JOIN external_hr_location_map elm ON elm.hr_management_id = hum.id
WHERE hum.role_key   = ''EXTERNAL_HR''
  AND hum.deleted_at IS NULL
  AND hum.id         = ###userId###
GROUP BY hum.id, hum.user_id, hum.user_name, hum.email_id, hum.role_key,
         hum.company_id, hum.company_name, hum.phone_number, hum.date_of_birth'
WHERE name = 'external_hr_user_detail';

-- AFTER
SELECT name, query FROM admin_report WHERE name = 'external_hr_user_detail';


-- -------------------------------------------------------------
-- FINAL VERIFY: all reports using hr_management_id (should be 11+)
-- -------------------------------------------------------------
SELECT name
FROM admin_report
WHERE query LIKE '%external_hr_policy_map%'
  AND deleted_at IS NULL
ORDER BY name;


-- =============================================================
-- ROLLBACK SCRIPT
-- Run in reverse order only if you need to revert this file.
-- =============================================================

-- ROLLBACK 4: Restore external_hr_user_detail (undo full query replacement)
-- WARNING: This restores to the hr_management_id version → user_id version.
-- Confirm original query from git history if this was already customised.
/*
UPDATE admin_report
SET query =
'SELECT
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
         hum.company_id, hum.company_name, hum.phone_number, hum.date_of_birth'
WHERE name = 'external_hr_user_detail';
*/

-- ROLLBACK 3: Restore external_hr_user_list (undo full query replacement)
/*
UPDATE admin_report
SET query =
'SELECT
  hum.id          AS hr_management_id,
  hum.user_id     AS user_id,
  hum.user_name   AS full_name,
  hum.email_id    AS email,
  hum.role_key    AS role_key,
  hum.company_name,
  hum.company_id,
  COUNT(DISTINCT epm.policy_id) AS policy_count,
  hum.created_at
FROM hr_user_management hum
LEFT JOIN external_hr_policy_map epm ON epm.user_id = hum.user_id
WHERE hum.role_key = ''EXTERNAL_HR''
  AND hum.deleted_at IS NULL
  AND hum.company_id = ###companyId###
  AND (###search### IS NULL
       OR hum.user_name ILIKE ''%'' || ###search### || ''%''
       OR hum.email_id  ILIKE ''%'' || ###search### || ''%'')
GROUP BY hum.id, hum.user_id, hum.user_name, hum.email_id, hum.role_key,
         hum.company_name, hum.company_id, hum.created_at
ORDER BY hum.created_at DESC'
WHERE name = 'external_hr_user_list';
*/

-- ROLLBACK 2: Revert batch report query fix (hr_management_id → user_id)
/*
UPDATE admin_report
SET query = REPLACE(
  query,
  'SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER',
  'SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER'
)
WHERE query LIKE '%external_hr_policy_map%'
  AND query LIKE '%hr_management_id = ###externalHrUserId###%';
*/

-- ROLLBACK 1: Revert user_id back to NOT NULL
-- WARNING: Only safe if NO rows in external_hr_policy_map have user_id = NULL.
-- Check first: SELECT COUNT(*) FROM external_hr_policy_map WHERE user_id IS NULL;
/*
ALTER TABLE external_hr_policy_map
  ALTER COLUMN user_id SET NOT NULL;
*/
