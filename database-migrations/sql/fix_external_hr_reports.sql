-- Fix admin_reports id=56 (external_hr_user_list) and id=57 (external_hr_user_detail).
--
-- Problem: both reports were written to join on user_id (old schema).
-- After fix_external_hr_map_schema.sql the tables now use hr_management_id.
-- New users have user_id IS NULL so the old INNER JOIN on users drops them all.
-- Also: search condition used `###search### IS NULL` but the substitution engine
-- never emits SQL NULL — use `= ''` instead.
--
-- Run once. Safe to re-run (UPDATE is idempotent to same value).

-- ============================================================
-- id=56: external_hr_user_list
-- Changes:
--   • Remove INNER JOIN on users table (user_id may be NULL)
--   • Change policy map join from user_id → hr_management_id
--   • Change search guard from IS NULL → = ''
--   • Remove u.id from GROUP BY
-- ============================================================
UPDATE public.admin_reports
SET query = $q$
SELECT
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
WHERE hum.role_key = 'EXTERNAL_HR'
  AND hum.deleted_at IS NULL
  AND hum.company_id = ###companyId###
  AND (###search### = ''
       OR hum.user_name ILIKE '%' || ###search### || '%'
       OR hum.email_id  ILIKE '%' || ###search### || '%')
GROUP BY hum.id, hum.user_name, hum.email_id, hum.role_key,
         hum.company_name, hum.company_id, hum.created_at
ORDER BY hum.created_at DESC
$q$
WHERE id = 56;

-- ============================================================
-- id=57: external_hr_user_detail
-- Changes:
--   • Change policy map join from user_id → hr_management_id
--   • Change location map join from user_id → hr_management_id
-- ============================================================
UPDATE public.admin_reports
SET query = $q$
SELECT
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
    JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('policyId', epm.policy_id))
      FILTER (WHERE epm.policy_id IS NOT NULL),
    '[]'
  ) AS policies,
  COALESCE(
    JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('addressId', elm.address_id))
      FILTER (WHERE elm.address_id IS NOT NULL),
    '[]'
  ) AS locations
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
    WHEN query LIKE '%hr_management_id = hum.id%' THEN 'PATCHED OK'
    ELSE 'NOT PATCHED'
  END AS status
FROM admin_reports
WHERE id IN (56, 57);
