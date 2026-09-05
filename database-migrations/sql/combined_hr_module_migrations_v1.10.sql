-- =============================================================================
-- COMBINED HR MODULE MIGRATIONS — feature/hr-module-updates-dev-v1.10
-- =============================================================================
-- Execute this single file to apply all DB changes for this branch.
-- Safe to re-run: DDL uses IF NOT EXISTS / IF EXISTS; report UPDATEs are
-- idempotent; REPLACE() is a no-op when the target text is already gone.
--
-- Execution order matters — do NOT reorder sections.
--
-- Sections:
--   1. Schema DDL         — ALTER TABLE, ADD COLUMN, indexes
--   2. Report queries     — admin_reports id=56, 57 (External HR user list/detail)
--   3. Portfolio CRM      — admin_reports id=50, 51 (group/individual companies)
--   4. Portfolio policies — admin_reports portfolio_company_policies
--   5. Portfolio scope    — remove sibling-expansion from id=47, 50
--   6. Role seed          — PORTAL_CRM role + ACL mappings
-- =============================================================================


-- =============================================================================
-- SECTION 1: SCHEMA DDL
-- Source: fix_external_hr_map_schema.sql
-- Makes hr_user_management.user_id nullable; adds hr_management_id FK to both
-- policy map and location map tables; recreates unique indexes on hr_management_id.
-- =============================================================================

-- 1a. hr_user_management: make user_id nullable
ALTER TABLE public.hr_user_management
  ALTER COLUMN user_id DROP NOT NULL;

-- 1b. external_hr_policy_map: add hr_management_id, relax user_id
ALTER TABLE public.external_hr_policy_map
  ADD COLUMN IF NOT EXISTS hr_management_id BIGINT REFERENCES public.hr_user_management(id);

ALTER TABLE public.external_hr_policy_map
  ALTER COLUMN user_id DROP NOT NULL;

DROP INDEX IF EXISTS uq_ext_hr_policy_map_user_policy;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ext_hr_policy_map_hr_policy
  ON public.external_hr_policy_map (hr_management_id, policy_id);

CREATE INDEX IF NOT EXISTS idx_ext_hr_policy_map_hr_management_id
  ON public.external_hr_policy_map (hr_management_id);

-- 1c. external_hr_location_map: add hr_management_id, relax user_id
ALTER TABLE public.external_hr_location_map
  ADD COLUMN IF NOT EXISTS hr_management_id BIGINT REFERENCES public.hr_user_management(id);

ALTER TABLE public.external_hr_location_map
  ALTER COLUMN user_id DROP NOT NULL;

DROP INDEX IF EXISTS uq_ext_hr_location_map_user_address;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ext_hr_location_map_hr_address
  ON public.external_hr_location_map (hr_management_id, address_id);

CREATE INDEX IF NOT EXISTS idx_ext_hr_location_map_hr_management_id
  ON public.external_hr_location_map (hr_management_id);

-- Verify schema
SELECT
  c.table_name,
  c.column_name,
  c.is_nullable,
  c.data_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN ('hr_user_management', 'external_hr_policy_map', 'external_hr_location_map')
  AND c.column_name IN ('user_id', 'hr_management_id')
ORDER BY c.table_name, c.column_name;


-- =============================================================================
-- SECTION 2: EXTERNAL HR REPORT QUERIES (id=56, 57) — FINAL VERSION
-- Source: fix_external_hr_report_camelcase_aliases.sql
-- Supersedes: fix_external_hr_reports.sql + fix_external_hr_show_all_users.sql
-- Fixes: camelCase column aliases, optional companyId filter, hr_management_id joins.
-- =============================================================================

BEGIN;

-- id=56: external_hr_user_list
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

-- id=57: external_hr_user_detail
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
    WHEN query LIKE '%"fullName"%' AND query LIKE '%"companyName"%' THEN 'SECTION 2 OK'
    ELSE 'SECTION 2 NOT PATCHED'
  END AS status
FROM admin_reports
WHERE id IN (56, 57);

COMMIT;


-- =============================================================================
-- SECTION 3: PORTFOLIO CRM — group/individual companies (id=50, 51)
-- Source: fix_portfolio_crm.sql + fix_portfolio_crm_group_parent.sql
-- Fixes: CRM users see companies with any policies (not just LH); group parent
--        lead_crm check so subsidiaries of managed parents are visible.
-- =============================================================================

BEGIN;

-- 3a. portfolio_individual_companies (id=51): include CRM-filtered companies
UPDATE admin_reports
SET query = REPLACE(
  query,
  '    OR (###hrCompanyId### != '''' AND COALESCE(pc.policy_count, 0) > 0)
  )
  AND (###crmUserId### = '''' OR c.lead_crm::text = ###crmUserId###)
  AND (###hrCompanyId### = '''' OR c.id::text = ###hrCompanyId###)',
  '    OR (###hrCompanyId### != '''' AND COALESCE(pc.policy_count, 0) > 0)
    OR (###crmUserId### != '''' AND COALESCE(pc.policy_count, 0) > 0)
  )
  AND (###crmUserId### = '''' OR c.lead_crm::text = ###crmUserId###)
  AND (###hrCompanyId### = '''' OR c.id::text = ###hrCompanyId###)'
)
WHERE id = 51;

-- 3b. portfolio_group_companies (id=50): include CRM-filtered companies
UPDATE admin_reports
SET query = REPLACE(
  query,
  '    OR (###hrCompanyId### != '''' AND COALESCE(pc.policy_count, 0) > 0)
  )
  AND (###crmUserId### = '''' OR c.lead_crm::text = ###crmUserId###)',
  '    OR (###hrCompanyId### != '''' AND COALESCE(pc.policy_count, 0) > 0)
    OR (###crmUserId### != '''' AND COALESCE(pc.policy_count, 0) > 0)
  )
  AND (###crmUserId### = '''' OR c.lead_crm::text = ###crmUserId###)'
)
WHERE id = 50;

-- 3c. portfolio_group_companies (id=50): also match when GROUP PARENT has lead_crm
--     so CRM users see all subsidiaries of companies they manage as group parent.
UPDATE admin_reports
SET query = REPLACE(
  query,
  '  AND (###crmUserId### = '''' OR c.lead_crm::text = ###crmUserId###)',
  '  AND (###crmUserId### = '''' OR c.lead_crm::text = ###crmUserId### OR gc.lead_crm::text = ###crmUserId###)'
)
WHERE id = 50;

-- Verify
SELECT id, name,
  CASE
    WHEN id = 50 AND query LIKE '%gc.lead_crm::text = ###crmUserId###%' THEN 'SECTION 3 id=50 OK'
    WHEN id = 51 AND query LIKE '%###crmUserId### != ''''%AND COALESCE(pc.policy_count%' THEN 'SECTION 3 id=51 OK'
    ELSE 'SECTION 3 CHECK MANUALLY'
  END AS status
FROM admin_reports
WHERE id IN (50, 51);

COMMIT;


-- =============================================================================
-- SECTION 4: PORTFOLIO COMPANY POLICIES — final version with External HR filter
-- Source: fix_portfolio_company_policies_external_hr_v2.sql
-- Supersedes: fix_portfolio_company_policies_external_hr.sql (v1)
-- Fixes: externalHrUserId uses IS NULL guard (NULL = show all, value = filter);
--        joins on hr_management_id (not deprecated user_id).
-- =============================================================================

BEGIN;

UPDATE admin_reports
SET query = $Q$
WITH policy_insurer AS (
  SELECT DISTINCT ON (pim.policy_id)
    pim.policy_id,
    i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
),
policy_tpa AS (
  SELECT DISTINCT ON (ptm.policy_id)
    ptm.policy_id,
    t.name AS tpa_name
  FROM policy_tpa_map ptm
  INNER JOIN tpa t ON t.id = ptm.tpa_id
  ORDER BY ptm.policy_id, ptm.id
)
SELECT
  p.id                                                           AS "policyId",
  p.company_id                                                   AS "companyId",
  COALESCE(iirm_ld.value, ld.value)                             AS "policyTypeCode",
  ld.value                                                       AS "policyTypeName",
  pi.insurer_name                                                AS "insurerName",
  COALESCE(pt.tpa_name, '—')                                    AS "tpaName",
  p.insurer_policy_number                                        AS "policyNumber",
  p.net_premium                                                  AS "premiumAmount",
  TO_CHAR(p.policy_from, 'DD/MM/YYYY')                          AS "startDate",
  TO_CHAR(p.policy_to,   'DD/MM/YYYY')                          AS "endDate",
  CASE
    WHEN p.policy_to <  CURRENT_DATE                             THEN 'Expired'
    WHEN p.policy_to <= CURRENT_DATE + INTERVAL '60 days'        THEN 'Renewal Due'
    ELSE 'Active'
  END                                                            AS "policyStatus"
FROM policy p
LEFT JOIN lookup_data ld              ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
LEFT JOIN policy_type_segregation pts ON pts.policy_type_lid = p.policy_type_lid
LEFT JOIN lookup_data iirm_ld         ON iirm_ld.id = pts.iirm_policy_type_lid AND iirm_ld.deleted_at IS NULL
LEFT JOIN policy_insurer pi           ON pi.policy_id = p.id
LEFT JOIN policy_tpa pt               ON pt.policy_id = p.id
WHERE p.company_id = ###companyId###
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_configuration pcfg,
           jsonb_array_elements_text(COALESCE(pcfg.policy_configuration->'selectedLocationIds', '[]'::jsonb)) loc_id
      WHERE pcfg.policy_id = p.id
        AND pcfg.policy_configuration_status_lid = (
          SELECT id FROM lookup_data
          WHERE lookup_key = 'POLICY_CONFIGURATION_STATUS_LIVE'
          LIMIT 1
        )
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
       OR p.id IN (
         SELECT policy_id
         FROM external_hr_policy_map
         WHERE hr_management_id = ###externalHrUserId###::INTEGER
       ))
ORDER BY p.policy_from DESC
$Q$,
updated_at = NOW()
WHERE name = 'portfolio_company_policies';

-- Register externalHrUserId parameter (idempotent)
INSERT INTO admin_reports_parameters
  (admin_report_id, parameter_name, query_parameter, created_at, updated_at, created_by, updated_by)
SELECT
  r.id, 'externalHrUserId', '###externalHrUserId###', NOW(), NOW(), 'SYSTEM', 'SYSTEM'
FROM admin_reports r
WHERE r.name = 'portfolio_company_policies'
  AND NOT EXISTS (
    SELECT 1 FROM admin_reports_parameters p
    WHERE p.admin_report_id = r.id AND p.parameter_name = 'externalHrUserId'
  );

-- Verify
SELECT
  r.name,
  CASE WHEN r.query LIKE '%###externalHrUserId### IS NULL%' THEN 'SECTION 4 QUERY OK' ELSE 'SECTION 4 NOT PATCHED' END AS query_status,
  CASE WHEN EXISTS (SELECT 1 FROM admin_reports_parameters p WHERE p.admin_report_id = r.id AND p.parameter_name = 'externalHrUserId')
       THEN 'PARAM OK' ELSE 'PARAM MISSING' END AS param_status
FROM admin_reports r
WHERE r.name = 'portfolio_company_policies';

COMMIT;


-- =============================================================================
-- SECTION 5: PORTFOLIO SCOPE — remove sibling-expansion from id=47, 50
-- Source: fix_portfolio_hr_domain_scope.sql
-- Fix: HR users from a group-member company were seeing sibling companies.
--      portfolio_kpi_summary also gets the hr_management_id column fix.
-- =============================================================================

BEGIN;

-- 5a. portfolio_group_companies (id=50): remove sibling expansion block
UPDATE public.admin_reports
SET query = REPLACE(
  query,
  '    OR gcm.group_company_id IN (
      SELECT gcm2.group_company_id
      FROM group_company_map gcm2
      WHERE gcm2.company_id::text = ###hrCompanyId###
    )
',
  ''
)
WHERE name = 'portfolio_group_companies';

-- 5b. portfolio_kpi_summary (id=47): remove sibling expansion block
UPDATE public.admin_reports
SET query = REPLACE(
  query,
  '      OR c.id IN (
        SELECT gcm.company_id FROM group_company_map gcm
        WHERE gcm.group_company_id IN (
          SELECT gcm2.group_company_id FROM group_company_map gcm2
          WHERE gcm2.company_id::text = ###hrCompanyId###
        )
      )
',
  ''
)
WHERE name = 'portfolio_kpi_summary';

-- 5c. portfolio_kpi_summary (id=47): fix external HR policy join column
UPDATE public.admin_reports
SET query = REPLACE(
  query,
  'WHERE user_id = ###externalHrUserId###::INTEGER',
  'WHERE hr_management_id = ###externalHrUserId###::INTEGER'
)
WHERE name = 'portfolio_kpi_summary';

-- Verify
SELECT name,
  CASE
    WHEN query NOT LIKE '%gcm2.company_id::text = ###hrCompanyId###%' THEN 'SECTION 5 SIBLING REMOVED OK'
    ELSE 'SECTION 5 NOT PATCHED — check whitespace in text'
  END AS sibling_status
FROM public.admin_reports
WHERE name IN ('portfolio_group_companies', 'portfolio_kpi_summary');

COMMIT;


-- =============================================================================
-- SECTION 6: ROLE SEED — PORTAL_CRM role + ACL action mappings
-- Source: fix_portfolio_crm.sql (bottom section)
-- Safe to re-run: INSERT is guarded with NOT EXISTS checks.
-- =============================================================================

-- Insert PORTAL_CRM role if not already present
INSERT INTO roles (name, role_key, created_by, updated_by)
SELECT 'Portal CRM', 'PORTAL_CRM', 'system', 'system'
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE role_key = 'PORTAL_CRM'
);

-- Map ACL actions (ids 1 and 154) to PORTAL_CRM role
INSERT INTO role_acl_category_action_map (role_id, acl_category_action_id, created_by, updated_by)
SELECT r.id, 1, 'system', 'system'
FROM roles r
WHERE r.role_key = 'PORTAL_CRM'
  AND NOT EXISTS (
    SELECT 1 FROM role_acl_category_action_map m
    WHERE m.role_id = r.id AND m.acl_category_action_id = 1
  );

INSERT INTO role_acl_category_action_map (role_id, acl_category_action_id, created_by, updated_by)
SELECT r.id, 154, 'system', 'system'
FROM roles r
WHERE r.role_key = 'PORTAL_CRM'
  AND NOT EXISTS (
    SELECT 1 FROM role_acl_category_action_map m
    WHERE m.role_id = r.id AND m.acl_category_action_id = 154
  );

-- Verify
SELECT r.role_key, COUNT(m.id) AS acl_action_count
FROM roles r
LEFT JOIN role_acl_category_action_map m ON m.role_id = r.id
WHERE r.role_key = 'PORTAL_CRM'
GROUP BY r.role_key;


-- =============================================================================
-- FINAL SUMMARY CHECK
-- Run after all sections complete — should show all OK.
-- =============================================================================
SELECT
  'Schema DDL'          AS section,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'external_hr_policy_map' AND column_name = 'hr_management_id')
       THEN 'OK' ELSE 'MISSING' END AS status
UNION ALL
SELECT
  'Report id=56 camelCase',
  CASE WHEN EXISTS (SELECT 1 FROM admin_reports WHERE id = 56 AND query LIKE '%"fullName"%')
       THEN 'OK' ELSE 'NOT PATCHED' END
UNION ALL
SELECT
  'Report id=57 camelCase',
  CASE WHEN EXISTS (SELECT 1 FROM admin_reports WHERE id = 57 AND query LIKE '%"fullName"%')
       THEN 'OK' ELSE 'NOT PATCHED' END
UNION ALL
SELECT
  'Portfolio id=50 CRM group parent',
  CASE WHEN EXISTS (SELECT 1 FROM admin_reports WHERE id = 50 AND query LIKE '%gc.lead_crm::text = ###crmUserId###%')
       THEN 'OK' ELSE 'NOT PATCHED' END
UNION ALL
SELECT
  'Portfolio company_policies IS NULL guard',
  CASE WHEN EXISTS (SELECT 1 FROM admin_reports WHERE name = 'portfolio_company_policies' AND query LIKE '%###externalHrUserId### IS NULL%')
       THEN 'OK' ELSE 'NOT PATCHED' END
UNION ALL
SELECT
  'Portfolio sibling expansion removed',
  CASE WHEN NOT EXISTS (SELECT 1 FROM admin_reports WHERE name IN ('portfolio_group_companies','portfolio_kpi_summary') AND query LIKE '%gcm2.company_id::text = ###hrCompanyId###%')
       THEN 'OK' ELSE 'STILL PRESENT' END
UNION ALL
SELECT
  'PORTAL_CRM role seeded',
  CASE WHEN EXISTS (SELECT 1 FROM roles WHERE role_key = 'PORTAL_CRM')
       THEN 'OK' ELSE 'MISSING' END;
