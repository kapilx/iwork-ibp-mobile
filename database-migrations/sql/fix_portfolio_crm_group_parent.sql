-- Fix portfolio_group_companies (id=50): also show group members when the GROUP PARENT
-- has lead_crm = crmUserId (not just when the member itself has lead_crm = crmUserId).
-- This ensures CRM users see all subsidiaries of companies they manage as group parent.
--
-- Run once. Safe to re-run (REPLACE is a no-op if already applied).

UPDATE admin_reports
SET query = REPLACE(
  query,
  '  AND (###crmUserId### = '''' OR c.lead_crm::text = ###crmUserId###)',
  '  AND (###crmUserId### = '''' OR c.lead_crm::text = ###crmUserId### OR gc.lead_crm::text = ###crmUserId###)'
)
WHERE id = 50;

-- Verify
SELECT id, name,
  CASE WHEN query LIKE '%gc.lead_crm::text = ###crmUserId###%'
       THEN 'PATCHED OK' ELSE 'NOT PATCHED' END AS status
FROM admin_reports
WHERE id = 50;
