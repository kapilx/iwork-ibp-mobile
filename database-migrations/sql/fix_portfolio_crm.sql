-- Fix portfolio SQL so CRM users see companies with ANY policies (not just LH)
-- Run this once. Safe to re-run (REPLACE is idempotent if already applied).

-- Fix: portfolio_individual_companies (id=51)
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

-- Fix: portfolio_group_companies (id=50)
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

-- Verify the change was applied (both should show the new line)
SELECT id, name,
  CASE WHEN query LIKE '%###crmUserId### != ''''%AND COALESCE(pc.policy_count%'
       THEN 'PATCHED OK' ELSE 'NOT PATCHED' END AS status
FROM admin_reports
WHERE id IN (50, 51);




INSERT INTO roles (name, role_key, created_by, updated_by)
VALUES ('Portal CRM', 'PORTAL_CRM', 'system', 'system');

INSERT INTO role_acl_category_action_map (role_id, acl_category_action_id, created_by, updated_by)
SELECT id, 1, 'system', 'system' FROM roles WHERE role_key = 'PORTAL_CRM'
UNION ALL
SELECT id, 154, 'system', 'system' FROM roles WHERE role_key = 'PORTAL_CRM';
