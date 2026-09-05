-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: External HR – Multi-company + Multi-policy support
--
-- Changes:
--   1. New table  external_hr_company_map  (many companies per HR user)
--   2. Seed it from existing hr_user_management.company_id
--   3. Update external_hr_user_list  report — show companies array + company count
--   4. Update external_hr_user_detail report — add companies array
--   5. All UPDATEs are idempotent
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. New junction table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.external_hr_company_map (
  id               SERIAL PRIMARY KEY,
  hr_management_id INTEGER       NOT NULL REFERENCES public.hr_user_management(id) ON DELETE CASCADE,
  company_id       INTEGER       NOT NULL,
  company_name     VARCHAR(255),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ext_hr_company_map_hr_company UNIQUE (hr_management_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_ext_hr_company_map_hr_management_id
  ON public.external_hr_company_map(hr_management_id);

CREATE INDEX IF NOT EXISTS idx_ext_hr_company_map_company_id
  ON public.external_hr_company_map(company_id);


-- ── 2. Seed from existing single-company column ───────────────────────────────
-- Idempotent: ON CONFLICT DO NOTHING
INSERT INTO public.external_hr_company_map (hr_management_id, company_id, company_name)
SELECT
  id,
  company_id,
  company_name
FROM public.hr_user_management
WHERE role_key   = 'EXTERNAL_HR'
  AND deleted_at IS NULL
  AND company_id IS NOT NULL
ON CONFLICT (hr_management_id, company_id) DO NOTHING;


-- ── 3. Update external_hr_user_list ──────────────────────────────────────────
-- Now shows:
--   • companies  — JSON array of {companyId, companyName}
--   • companyCount — how many companies the user can access
--   • policyCount — total distinct policies (unchanged)
--   • companyId filter checks the company_map table instead of hum.company_id
UPDATE public.admin_reports
SET
  query = $SQL$
SELECT
  hum.id                                                AS "hrManagementId",
  hum.user_id                                           AS "userId",
  hum.user_name                                         AS "fullName",
  hum.email_id                                          AS "email",
  hum.role_key                                          AS "roleKey",
  COALESCE(
    JSON_AGG(
      DISTINCT JSONB_BUILD_OBJECT(
        'companyId',   ehcm.company_id,
        'companyName', ehcm.company_name
      )
    ) FILTER (WHERE ehcm.company_id IS NOT NULL),
    '[]'
  )                                                     AS "companies",
  COUNT(DISTINCT ehcm.company_id)                       AS "companyCount",
  COUNT(DISTINCT epm.policy_id)                         AS "policyCount",
  hum.created_at                                        AS "createdAt"
FROM hr_user_management hum
LEFT JOIN external_hr_company_map  ehcm ON ehcm.hr_management_id = hum.id
LEFT JOIN external_hr_policy_map   epm  ON epm.hr_management_id  = hum.id
WHERE hum.role_key   = 'EXTERNAL_HR'
  AND hum.deleted_at IS NULL
  AND (###companyId### = ''
       OR ehcm.company_id::text = ###companyId###)
  AND (###search### = ''
       OR hum.user_name ILIKE '%' || ###search### || '%'
       OR hum.email_id  ILIKE '%' || ###search### || '%')
GROUP BY hum.id, hum.user_name, hum.email_id, hum.role_key, hum.created_at
ORDER BY hum.created_at DESC
$SQL$,
  updated_at = NOW(),
  updated_by = 'SYSTEM'
WHERE name = 'external_hr_user_list';


-- ── 4. Update external_hr_user_detail ────────────────────────────────────────
-- Now shows:
--   • companies — JSON array of {companyId, companyName}
--   • policies  — JSON array of {policyId, companyId}  (company context per policy)
--   • locations — unchanged
UPDATE public.admin_reports
SET
  query = $SQL$
SELECT
  hum.id                                                AS "hrManagementId",
  hum.user_id                                           AS "userId",
  hum.user_name                                         AS "fullName",
  hum.email_id                                          AS "email",
  hum.role_key                                          AS "roleKey",
  hum.phone_number                                      AS "phoneNumber",
  COALESCE(
    JSON_AGG(
      DISTINCT JSONB_BUILD_OBJECT(
        'companyId',   ehcm.company_id,
        'companyName', ehcm.company_name
      )
    ) FILTER (WHERE ehcm.company_id IS NOT NULL),
    '[]'
  )                                                     AS "companies",
  COALESCE(
    JSON_AGG(
      DISTINCT JSONB_BUILD_OBJECT(
        'policyId',  epm.policy_id,
        'companyId', epm.company_id
      )
    ) FILTER (WHERE epm.policy_id IS NOT NULL),
    '[]'
  )                                                     AS "policies",
  COALESCE(
    JSON_AGG(
      DISTINCT JSONB_BUILD_OBJECT('addressId', elm.address_id)
    ) FILTER (WHERE elm.address_id IS NOT NULL),
    '[]'
  )                                                     AS "locations"
FROM hr_user_management hum
LEFT JOIN external_hr_company_map  ehcm ON ehcm.hr_management_id = hum.id
LEFT JOIN external_hr_policy_map   epm  ON epm.hr_management_id  = hum.id
LEFT JOIN external_hr_location_map elm  ON elm.hr_management_id  = hum.id
WHERE hum.role_key   = 'EXTERNAL_HR'
  AND hum.deleted_at IS NULL
  AND hum.id         = ###userId###
GROUP BY hum.id, hum.user_id, hum.user_name, hum.email_id,
         hum.role_key, hum.phone_number
$SQL$,
  updated_at = NOW(),
  updated_by = 'SYSTEM'
WHERE name = 'external_hr_user_detail';


-- ── 5. Verification ───────────────────────────────────────────────────────────
SELECT
  name,
  CASE WHEN query LIKE '%external_hr_company_map%' THEN '✓ updated' ELSE '✗ not updated' END AS status
FROM public.admin_reports
WHERE name IN ('external_hr_user_list', 'external_hr_user_detail');
