-- Fix portfolio reports to scope strictly to the domain company for HR users.
--
-- Problem: when hrCompanyId = Company A (a group member/child), the queries
-- expand to show ALL SIBLINGS of Company A (other companies with the same
-- group parent). This causes HR users enrolled in multiple companies to see
-- combined data from all sibling companies when logging in from one domain.
--
-- The sibling expansion block:
--   OR gcm.group_company_id IN (
--     SELECT gcm2.group_company_id FROM group_company_map gcm2
--     WHERE gcm2.company_id::text = ###hrCompanyId###
--   )
-- finds Company A's group parent, then returns ALL children of that parent.
--
-- Correct behavior:
--   - hrCompanyId = Group Parent  → show all its children  ✓ (gcm.group_company_id::text = hrCompanyId)
--   - hrCompanyId = Group Member  → show ONLY that member  ✓ (c.id::text = hrCompanyId)
--   - hrCompanyId = ''            → no filter (CRM path)   ✓
--
-- CRM users use crmUserId, not hrCompanyId, so they are unaffected.
--
-- Run after portfolio-company-location-filter.sql and external-hr-report-filters.sql.

BEGIN;

-- ============================================================
-- 1. portfolio_group_companies (id=50)
--    Latest version is from portfolio-company-location-filter.sql
-- ============================================================
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

-- ============================================================
-- 2. portfolio_kpi_summary (id=47)
--    Latest version is from external-hr-report-filters.sql
-- ============================================================
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

-- Also fix portfolio_kpi_summary: use hr_management_id instead of user_id
-- for external HR policy scoping (user_id is now nullable after schema migration)
UPDATE public.admin_reports
SET query = REPLACE(
  query,
  'WHERE user_id = ###externalHrUserId###::INTEGER',
  'WHERE hr_management_id = ###externalHrUserId###::INTEGER'
)
WHERE name = 'portfolio_kpi_summary';

-- ============================================================
-- Verify
-- ============================================================
SELECT name,
  CASE
    WHEN query NOT LIKE '%gcm2.company_id::text = ###hrCompanyId###%' THEN 'SIBLING EXPANSION REMOVED OK'
    ELSE 'NOT PATCHED — text mismatch, check whitespace'
  END AS sibling_status,
  CASE
    WHEN name = 'portfolio_kpi_summary' AND query LIKE '%hr_management_id = ###externalHrUserId###%'
      THEN 'HR_MGMT_ID OK'
    WHEN name = 'portfolio_kpi_summary'
      THEN 'HR_MGMT_ID NOT PATCHED'
    ELSE 'N/A'
  END AS ext_hr_col_status
FROM public.admin_reports
WHERE name IN ('portfolio_group_companies', 'portfolio_kpi_summary');

COMMIT;
