-- =============================================================================
-- policy-location-column-fix.sql
--
-- Fixes the wrong column name in all location filters.
--
-- The policy_configuration table's JSONB column is named "policy_configuration"
-- (snake_case) in the database — NOT "policyConfiguration" (camelCase).
--
-- Previous scripts mistakenly used pcfg."policyConfiguration" which causes:
--   "column pcfg.policyConfiguration does not exist"
--
-- This script replaces every occurrence of
--   pcfg."policyConfiguration"
-- with
--   pcfg.policy_configuration
-- across all affected reports. Safe to re-run (idempotent).
-- =============================================================================

BEGIN;

DO $FIX_COL$
DECLARE
  v_id   INTEGER;
  v_q    TEXT;
  v_fixed TEXT;
  rname  TEXT;
  fixed_count INTEGER := 0;
BEGIN
  FOR rname IN
    SELECT name FROM admin_reports
    WHERE query LIKE '%pcfg."policyConfiguration"%'
       OR query LIKE '%pc."policyConfiguration"%'
  LOOP
    SELECT id, query INTO v_id, v_q FROM admin_reports WHERE name = rname;

    v_fixed := v_q;
    v_fixed := replace(v_fixed, 'pcfg."policyConfiguration"', 'pcfg.policy_configuration');
    v_fixed := replace(v_fixed, 'pc."policyConfiguration"',   'pcfg.policy_configuration');

    IF v_fixed IS DISTINCT FROM v_q THEN
      UPDATE admin_reports SET query = v_fixed, updated_at = NOW() WHERE id = v_id;
      fixed_count := fixed_count + 1;
      RAISE NOTICE 'Fixed column name in report: %', rname;
    END IF;
  END LOOP;

  IF fixed_count = 0 THEN
    RAISE NOTICE 'No reports needed fixing (already correct or not yet applied).';
  ELSE
    RAISE NOTICE 'Total reports fixed: %', fixed_count;
  END IF;
END $FIX_COL$;

-- =============================================================================
-- VERIFY: confirm correct column name in all location-filtered reports
-- =============================================================================
SELECT
  name,
  CASE
    WHEN query LIKE '%pcfg.policy_configuration%' AND query LIKE '%###locationIds###%'
      THEN 'OK'
    WHEN query LIKE '%"policyConfiguration"%'     AND query LIKE '%###locationIds###%'
      THEN 'BROKEN — still has camelCase column name'
    WHEN query LIKE '%###locationIds###%'
      THEN 'HAS FILTER — column name OK'
    ELSE 'NO LOCATION FILTER'
  END AS status
FROM admin_reports
WHERE name IN (
  'dashboard_policy_cards',
  'dashboard_enrollment_status',
  'portfolio_kpi_summary',
  'endorsement_overview',
  'endorsement_employee_metrics',
  'endorsement_list',
  'cd_kpi_summary',
  'cd_account_details',
  'cd_transactions',
  'policy_claim_history'
)
ORDER BY name;

COMMIT;
