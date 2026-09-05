-- Fix admin_reports id=56 (external_hr_user_list) and id=57 (external_hr_user_detail)
-- to return camelCase column aliases matching the frontend ExtHrUser type.
--
-- Problem: raw SQL returns snake_case keys (full_name, company_name, hr_management_id, etc.)
-- but the frontend TypeScript type expects camelCase (fullName, companyName, hrManagementId).
-- useHRReport passes the raw rows through without transformation, so all camelCase fields
-- are undefined → username shows "?", company shows "Company undefined".
--
-- Run after fix_external_hr_show_all_users.sql (which set the companyId optional filter).

BEGIN;

-- ============================================================
-- id=56: external_hr_user_list  (camelCase aliases + optional companyId)
-- ============================================================
UPDATE public.admin_reports
SET query = $q$
SELECT
  hum.id                              AS "hrManagementId",
  hum.user_id                         AS "userId",
  hum.user_name                       AS "fullName",
  hum.email_id                        AS "email",
  hum.role_key                        AS "roleKey",
  hum.company_name                    AS "companyName",
  hum.company_id                      AS "companyId",
  COUNT(DISTINCT epm.policy_id)       AS "policyCount",
  hum.created_at                      AS "createdAt"
FROM hr_user_management hum
LEFT JOIN external_hr_policy_map epm ON epm.hr_management_id = hum.id
WHERE hum.role_key = 'EXTERNAL_HR'
  AND hum.deleted_at IS NULL
  AND (###companyId### = '' OR hum.company_id::text = ###companyId###)
  AND (###search### = ''
       OR hum.user_name ILIKE '%' || ###search### || '%'
       OR hum.email_id  ILIKE '%' || ###search### || '%')
GROUP BY hum.id, hum.user_name, hum.email_id, hum.role_key,
         hum.company_name, hum.company_id, hum.created_at
ORDER BY hum.created_at DESC
$q$
WHERE id = 56;

-- ============================================================
-- id=57: external_hr_user_detail  (camelCase aliases)
-- ============================================================
UPDATE public.admin_reports
SET query = $q$
SELECT
  hum.id                              AS "hrManagementId",
  hum.user_id                         AS "userId",
  hum.user_name                       AS "fullName",
  hum.email_id                        AS "email",
  hum.role_key                        AS "roleKey",
  hum.company_id                      AS "companyId",
  hum.company_name                    AS "companyName",
  hum.phone_number                    AS "phoneNumber",
  hum.date_of_birth                   AS "dateOfBirth",
  COALESCE(
    JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('policyId', epm.policy_id))
      FILTER (WHERE epm.policy_id IS NOT NULL),
    '[]'
  )                                   AS "policies",
  COALESCE(
    JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('addressId', elm.address_id))
      FILTER (WHERE elm.address_id IS NOT NULL),
    '[]'
  )                                   AS "locations"
FROM hr_user_management hum
LEFT JOIN external_hr_policy_map   epm ON epm.hr_management_id = hum.id
LEFT JOIN external_hr_location_map elm ON elm.hr_management_id = hum.id
WHERE hum.role_key   = 'EXTERNAL_HR'
  AND hum.deleted_at IS NULL
  AND hum.id         = ###userId###
GROUP BY hum.id, hum.user_id, hum.user_name, hum.email_id, hum.role_key,
         hum.company_id, hum.company_name, hum.phone_number, hum.date_of_birth
$q$
WHERE id = 57;

-- Verify
SELECT id, name,
  CASE
    WHEN query LIKE '%"fullName"%' AND query LIKE '%"companyName"%' THEN 'CAMELCASE OK'
    ELSE 'NOT PATCHED'
  END AS status
FROM admin_reports
WHERE id IN (56, 57);

COMMIT;
