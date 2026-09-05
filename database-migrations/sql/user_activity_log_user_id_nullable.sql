-- =============================================================================
-- Make user_activity_log.user_id nullable
-- Purpose: IBP-detach employees have no users table record (userId = null).
--          Notification activity logs must still be created without a userId.
--          Logs are identified by metadata->>'employeeId' for detached employees.
-- Run order: Run after ibp_auth_detach_migration.sql
-- This script is idempotent.
-- =============================================================================

ALTER TABLE user_activity_log
  ALTER COLUMN user_id DROP NOT NULL;

-- Verification
DO $$
DECLARE
  col_nullable TEXT;
BEGIN
  SELECT c.is_nullable INTO col_nullable
  FROM information_schema.columns c
  WHERE c.table_name = 'user_activity_log' AND c.column_name = 'user_id';

  RAISE NOTICE 'user_activity_log.user_id is_nullable: %', col_nullable;
END;
$$;

-- =============================================================================
-- ROLLBACK (only if no null rows exist)
-- Check first: SELECT COUNT(*) FROM user_activity_log WHERE user_id IS NULL;
-- ALTER TABLE user_activity_log ALTER COLUMN user_id SET NOT NULL;
-- =============================================================================
