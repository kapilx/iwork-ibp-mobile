-- Make external_hr_user_list (id=56) show ALL EXTERNAL_HR users regardless of company.
-- companyId filter becomes optional: pass '' to show all, or a numeric string to filter.
-- Run after fix_external_hr_reports.sql (which fixed the hr_management_id joins).

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
  AND (###companyId### = '' OR hum.company_id::text = ###companyId###)
  AND (###search### = ''
       OR hum.user_name ILIKE '%' || ###search### || '%'
       OR hum.email_id  ILIKE '%' || ###search### || '%')
GROUP BY hum.id, hum.user_name, hum.email_id, hum.role_key,
         hum.company_name, hum.company_id, hum.created_at
ORDER BY hum.created_at DESC
$q$
WHERE id = 56;

-- Verify
SELECT id, name,
  CASE WHEN query LIKE '%###companyId### = ''''%' THEN 'PATCHED OK' ELSE 'NOT PATCHED' END AS status
FROM admin_reports WHERE id = 56;
