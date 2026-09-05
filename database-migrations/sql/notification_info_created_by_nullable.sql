-- =============================================================================
-- Make notification_info.created_by nullable
-- Purpose: IBP-detach employees have no users table record (userId = null).
--          Enrollment confirmation emails must still be logged without a createdBy.
-- Run order: Run after ibp_auth_detach_migration.sql
-- This script is idempotent.
-- =============================================================================

ALTER TABLE notification_info
  ALTER COLUMN created_by DROP NOT NULL;

-- Verification
DO $$
DECLARE
  col_nullable TEXT;
BEGIN
  SELECT c.is_nullable INTO col_nullable
  FROM information_schema.columns c
  WHERE c.table_name = 'notification_info' AND c.column_name = 'created_by';

  RAISE NOTICE 'notification_info.created_by is_nullable: %', col_nullable;
END;
$$;

-- =============================================================================
-- ROLLBACK (only if no null rows exist)
-- Check first: SELECT COUNT(*) FROM notification_info WHERE created_by IS NULL;
-- ALTER TABLE notification_info ALTER COLUMN created_by SET NOT NULL;
-- =============================================================================
