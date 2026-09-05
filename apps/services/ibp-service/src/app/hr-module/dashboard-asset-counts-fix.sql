-- =============================================================================
-- dashboard-asset-counts-fix.sql
--
-- Fixes totalAssets / totalSubAssets returning 0 in dashboard_policy_cards
-- (id=22) because policy_asset_counts and policy_sub_asset_counts CTEs filter
-- with endorsement_deletion_batch_id IS NULL, but active records store 0.
--
-- Fix: change IS NULL  →  (IS NULL OR = 0) in both CTEs.
-- IDEMPOTENT: WHERE guard skips if already fixed.
-- =============================================================================

BEGIN;

UPDATE admin_reports
SET query = replace(replace(
  query,
  'WHERE pam.endorsement_deletion_batch_id IS NULL
  GROUP BY pam.policy_id',
  'WHERE (pam.endorsement_deletion_batch_id IS NULL OR pam.endorsement_deletion_batch_id = 0)
  GROUP BY pam.policy_id'
),
  'WHERE psam.endorsement_deletion_batch_id IS NULL
  GROUP BY psam.policy_id',
  'WHERE (psam.endorsement_deletion_batch_id IS NULL OR psam.endorsement_deletion_batch_id = 0)
  GROUP BY psam.policy_id'
),
    updated_at = NOW()
WHERE id = 22
  AND query LIKE '%policy_asset_counts%'
  AND query NOT LIKE '%pam.endorsement_deletion_batch_id = 0%';

-- Verify
SELECT
  id,
  name,
  CASE
    WHEN query LIKE '%pam.endorsement_deletion_batch_id = 0%' THEN 'OK — deletion filter fixed'
    WHEN query LIKE '%policy_asset_counts%'                   THEN 'NOT UPDATED — anchor mismatch, check whitespace'
    ELSE 'policy_asset_counts CTE not present'
  END AS status
FROM admin_reports
WHERE id = 22;

COMMIT;
