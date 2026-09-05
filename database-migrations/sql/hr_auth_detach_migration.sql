-- =============================================================================
-- HR User Auth Detach Migration
-- Purpose: Detach EXTERNAL_HR users from the users table.
--          Add credential fields to hr_user_management.
--          Make user_id nullable (no forced FK to users table).
-- Run order: Run after ibp_auth_detach_migration.sql
-- This script is idempotent (uses IF NOT EXISTS / IF EXISTS).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Add credential columns to hr_user_management
-- -----------------------------------------------------------------------------

ALTER TABLE hr_user_management
  ADD COLUMN IF NOT EXISTS login_name          VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password            VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_password_set     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_password_hashed  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS auth_version        BIGINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS user_status_key     VARCHAR(100) NOT NULL DEFAULT 'USER_STATUS_ACTIVE';

-- -----------------------------------------------------------------------------
-- STEP 2: Make user_id nullable — HR identity is self-contained in this table
-- -----------------------------------------------------------------------------

ALTER TABLE hr_user_management
  ALTER COLUMN user_id DROP NOT NULL;

-- Drop FK constraint on user_id if it exists
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'hr_user_management'
    AND kcu.column_name = 'user_id'
    AND tc.constraint_type = 'FOREIGN KEY';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE hr_user_management DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Dropped FK constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No FK constraint found on hr_user_management.user_id — skipping';
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- STEP 3: Migrate credential data from users → hr_user_management
--         Only for rows that still have a user_id link.
-- -----------------------------------------------------------------------------

UPDATE hr_user_management hrm
SET
  login_name          = u.login_name,
  password            = u.password,
  is_password_set     = COALESCE(u.is_password_set, FALSE),
  is_password_hashed  = COALESCE(u.is_password_hashed, FALSE),
  password_expires_at = u.password_expires_at,
  auth_version        = COALESCE(u.auth_version, 1),
  user_status_key     = COALESCE(u.user_status_key, 'USER_STATUS_ACTIVE')
FROM users u
WHERE hrm.user_id = u.id
  AND hrm.deleted_at IS NULL;

DO $$
DECLARE
  migrated_count INTEGER;
  total_hr       INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM hr_user_management
  WHERE login_name IS NOT NULL AND deleted_at IS NULL;

  SELECT COUNT(*) INTO total_hr
  FROM hr_user_management
  WHERE deleted_at IS NULL;

  RAISE NOTICE 'HR credential migration: % / % hr_user_management records migrated',
    migrated_count, total_hr;
END;
$$;

-- -----------------------------------------------------------------------------
-- STEP 4: Add hr_management_id to external_hr_policy_map and external_hr_location_map
--         Replace user_id FK (to users) with hr_management_id FK (to hr_user_management)
-- -----------------------------------------------------------------------------

ALTER TABLE external_hr_policy_map
  ADD COLUMN IF NOT EXISTS hr_management_id INTEGER REFERENCES hr_user_management(id);

ALTER TABLE external_hr_location_map
  ADD COLUMN IF NOT EXISTS hr_management_id INTEGER REFERENCES hr_user_management(id);

-- Migrate existing rows: fill hr_management_id from hr_user_management via user_id
UPDATE external_hr_policy_map epm
SET hr_management_id = hum.id
FROM hr_user_management hum
WHERE hum.user_id = epm.user_id
  AND hum.deleted_at IS NULL
  AND epm.hr_management_id IS NULL;

UPDATE external_hr_location_map elm
SET hr_management_id = hum.id
FROM hr_user_management hum
WHERE hum.user_id = elm.user_id
  AND hum.deleted_at IS NULL
  AND elm.hr_management_id IS NULL;

-- Drop old unique constraints on user_id and add new ones on hr_management_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'external_hr_policy_map' AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%user_id%policy_id%'
  ) THEN
    ALTER TABLE external_hr_policy_map DROP CONSTRAINT IF EXISTS external_hr_policy_map_user_id_policy_id_key;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'external_hr_location_map' AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%user_id%address_id%'
  ) THEN
    ALTER TABLE external_hr_location_map DROP CONSTRAINT IF EXISTS external_hr_location_map_user_id_address_id_key;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'external_hr_policy_map'
      AND constraint_name = 'external_hr_policy_map_hr_mgmt_policy_uq'
  ) THEN
    ALTER TABLE external_hr_policy_map
      ADD CONSTRAINT external_hr_policy_map_hr_mgmt_policy_uq UNIQUE (hr_management_id, policy_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'external_hr_location_map'
      AND constraint_name = 'external_hr_location_map_hr_mgmt_address_uq'
  ) THEN
    ALTER TABLE external_hr_location_map
      ADD CONSTRAINT external_hr_location_map_hr_mgmt_address_uq UNIQUE (hr_management_id, address_id);
  END IF;
END;
$$;

DO $$
DECLARE
  policy_migrated  INTEGER;
  location_migrated INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_migrated   FROM external_hr_policy_map   WHERE hr_management_id IS NOT NULL;
  SELECT COUNT(*) INTO location_migrated FROM external_hr_location_map WHERE hr_management_id IS NOT NULL;
  RAISE NOTICE 'Map migration: % policy rows, % location rows updated with hr_management_id',
    policy_migrated, location_migrated;
END;
$$;

-- =============================================================================
-- VERIFICATION QUERIES (run manually to confirm migration success)
-- =============================================================================

-- 1. Credentials migrated count:
-- SELECT COUNT(*) FROM hr_user_management WHERE login_name IS NOT NULL AND deleted_at IS NULL;

-- 2. HR records with no credentials yet (should be 0 after migration):
-- SELECT COUNT(*) FROM hr_user_management WHERE login_name IS NULL AND deleted_at IS NULL;

-- 3. Policy map migration check:
-- SELECT COUNT(*) FROM external_hr_policy_map WHERE hr_management_id IS NULL;

-- 4. Location map migration check:
-- SELECT COUNT(*) FROM external_hr_location_map WHERE hr_management_id IS NULL;

-- =============================================================================
-- ROLLBACK SCRIPT (run only if you need to revert)
-- =============================================================================
-- ALTER TABLE external_hr_location_map DROP CONSTRAINT IF EXISTS external_hr_location_map_hr_mgmt_address_uq;
-- ALTER TABLE external_hr_policy_map DROP CONSTRAINT IF EXISTS external_hr_policy_map_hr_mgmt_policy_uq;
-- ALTER TABLE external_hr_location_map DROP COLUMN IF EXISTS hr_management_id;
-- ALTER TABLE external_hr_policy_map DROP COLUMN IF EXISTS hr_management_id;
-- ALTER TABLE hr_user_management
--   DROP COLUMN IF EXISTS login_name,
--   DROP COLUMN IF EXISTS password,
--   DROP COLUMN IF EXISTS is_password_set,
--   DROP COLUMN IF EXISTS is_password_hashed,
--   DROP COLUMN IF EXISTS password_expires_at,
--   DROP COLUMN IF EXISTS auth_version,
--   DROP COLUMN IF EXISTS user_status_key;
-- ALTER TABLE hr_user_management ALTER COLUMN user_id SET NOT NULL;
-- (Re-add FK manually if needed: ALTER TABLE hr_user_management ADD CONSTRAINT ... FOREIGN KEY (user_id) REFERENCES users(id))
