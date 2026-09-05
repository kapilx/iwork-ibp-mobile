-- =============================================================================
-- policy-cards-lookup-table-fix.sql
--
-- Fixes the wrong table/column references already stored in the
-- dashboard_policy_cards query by the first (broken) run of
-- policy-cards-live-config-fix.sql.
--
-- Replaces:
--   FROM look_up  WHERE name = 'POLICY_CONFIGURATION_STATUS_LIVE'
-- With:
--   FROM lookup_data  WHERE lookup_key = 'POLICY_CONFIGURATION_STATUS_LIVE'
-- =============================================================================

BEGIN;

UPDATE admin_reports
SET
  query = replace(
    replace(
      query,
      'FROM look_up',
      'FROM lookup_data'
    ),
    'WHERE name = ''POLICY_CONFIGURATION_STATUS_LIVE''',
    'WHERE lookup_key = ''POLICY_CONFIGURATION_STATUS_LIVE'''
  ),
  updated_at = NOW()
WHERE name = 'dashboard_policy_cards'
  AND query LIKE '%look_up%';

-- VERIFY
SELECT
  name,
  CASE
    WHEN query LIKE '%FROM lookup_data%' AND query LIKE '%lookup_key = ''POLICY_CONFIGURATION_STATUS_LIVE''%'
      THEN 'OK — correct table and column'
    WHEN query LIKE '%FROM look_up%'
      THEN 'BROKEN — still has wrong table look_up'
    WHEN query LIKE '%pcfg.policy_configuration_status_lid%'
      THEN 'HAS CONDITION — check table/column manually'
    ELSE 'NO LIVE STATUS CONDITION'
  END AS live_status_guard
FROM admin_reports
WHERE name = 'dashboard_policy_cards';

COMMIT;
