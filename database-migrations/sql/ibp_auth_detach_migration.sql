-- =============================================================================
-- IBP User Auth Detach Migration
-- Purpose: Detach USER_TYPE_COMPANY_EMPLOYEE from users table.
--          Add credential fields to policy_enrollment_employee.
--          Extend user_role with ibp_employee_id for company employee role mapping.
--          Migrate existing data from users → policy_enrollment_employee.
-- Run order: This script is idempotent (uses IF NOT EXISTS / IF EXISTS).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Add credential columns to policy_enrollment_employee
-- -----------------------------------------------------------------------------

ALTER TABLE policy_enrollment_employee
  ADD COLUMN IF NOT EXISTS login_name       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ibp_password     VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_password_set  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_password_hashed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS auth_version     BIGINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS user_status_key  VARCHAR(100) NOT NULL DEFAULT 'USER_STATUS_ACTIVE';

-- -----------------------------------------------------------------------------
-- STEP 2: Add ibp_employee_id column to user_role (Option B — extend existing table)
-- If pee_id was already added from a previous run of this script, rename it.
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_role' AND column_name = 'pee_id'
  ) THEN
    ALTER TABLE user_role RENAME COLUMN pee_id TO ibp_employee_id;
  ELSE
    ALTER TABLE user_role
      ADD COLUMN IF NOT EXISTS ibp_employee_id INTEGER REFERENCES policy_enrollment_employee(id);
  END IF;
END;
$$;

-- Make existing user_id nullable to support pee-only role rows
ALTER TABLE user_role
  ALTER COLUMN user_id DROP NOT NULL;

-- -----------------------------------------------------------------------------
-- STEP 3: Migrate credential data from users → policy_enrollment_employee
--         Only for USER_TYPE_COMPANY_EMPLOYEE records.
--         COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE stays in users — skipped here.
-- -----------------------------------------------------------------------------

UPDATE policy_enrollment_employee pee
SET
  login_name          = u.login_name,
  password            = u.password,
  ibp_password        = u.ibp_password,
  is_password_set     = COALESCE(u.is_password_set, FALSE),
  is_password_hashed  = COALESCE(u.is_password_hashed, FALSE),
  password_expires_at = u.password_expires_at,
  auth_version        = COALESCE(u.auth_version, 1),
  user_status_key     = COALESCE(u.user_status_key, 'USER_STATUS_ACTIVE')
FROM users u
WHERE pee.user_id    = u.id
  AND u.user_type_key = 'USER_TYPE_COMPANY_EMPLOYEE'
  AND pee.deleted_at IS NULL;

-- Verify row count after migration (informational — will show in psql output)
DO $$
DECLARE
  migrated_count INTEGER;
  total_company_employees INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM policy_enrollment_employee pee
  JOIN users u ON pee.user_id = u.id
  WHERE u.user_type_key = 'USER_TYPE_COMPANY_EMPLOYEE'
    AND pee.login_name IS NOT NULL
    AND pee.deleted_at IS NULL;

  SELECT COUNT(*) INTO total_company_employees
  FROM policy_enrollment_employee pee
  JOIN users u ON pee.user_id = u.id
  WHERE u.user_type_key = 'USER_TYPE_COMPANY_EMPLOYEE'
    AND pee.deleted_at IS NULL;

  RAISE NOTICE 'Credential migration: % / % company employee records migrated',
    migrated_count, total_company_employees;
END;
$$;

-- -----------------------------------------------------------------------------
-- STEP 4: Migrate role mappings from user_role (userId) → user_role (peeId)
--         For USER_TYPE_COMPANY_EMPLOYEE only.
--         We insert new rows with ibp_employee_id set and user_id = NULL.
--         Original rows (with user_id) are left intact until cleanup.
-- -----------------------------------------------------------------------------

INSERT INTO user_role (ibp_employee_id, role_id, user_id)
SELECT DISTINCT
  pee.id        AS ibp_employee_id,
  ur.role_id,
  NULL::INTEGER AS user_id
FROM user_role ur
JOIN users u   ON ur.user_id = u.id
JOIN policy_enrollment_employee pee ON pee.user_id = u.id
WHERE u.user_type_key = 'USER_TYPE_COMPANY_EMPLOYEE'
  AND pee.deleted_at IS NULL
  -- Avoid duplicates if migration is re-run
  AND NOT EXISTS (
    SELECT 1 FROM user_role existing
    WHERE existing.ibp_employee_id  = pee.id
      AND existing.role_id = ur.role_id
  );

DO $$
DECLARE
  role_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO role_rows
  FROM user_role
  WHERE ibp_employee_id IS NOT NULL;

  RAISE NOTICE 'Role migration: % ibp_employee_id-based role rows created', role_rows;
END;
$$;

-- NOTE: No new index added on policy_enrollment_employee.
--       The table already has its existing indexes. Auth lookups use
--       existing phone_number_enc / email_enc / login_name columns with
--       ORDER BY id DESC to resolve multiple rows per employee.

-- =============================================================================
-- VERIFICATION QUERIES (run manually to confirm migration success)
-- =============================================================================

-- 1. Credentials migrated count:
-- SELECT COUNT(*) FROM policy_enrollment_employee WHERE login_name IS NOT NULL AND deleted_at IS NULL;

-- 2. COMPANY_EMPLOYEE users not yet migrated (should be 0 after migration):
-- SELECT COUNT(*)
-- FROM policy_enrollment_employee pee
-- JOIN users u ON pee.user_id = u.id
-- WHERE u.user_type_key = 'USER_TYPE_COMPANY_EMPLOYEE'
--   AND pee.login_name IS NULL
--   AND pee.deleted_at IS NULL;

-- 3. Role rows with ibp_employee_id:
-- SELECT COUNT(*) FROM user_role WHERE ibp_employee_id IS NOT NULL;

-- 4. Credentials spot-check (pick a known employee):
-- SELECT login_name, is_password_set, user_status_key FROM policy_enrollment_employee WHERE company_employee_id = '<known_id>';

-- =============================================================================
-- ROLLBACK SCRIPT (run only if you need to revert)
-- Run these in order, one at a time, with verification between each step.
-- =============================================================================

-- STEP R1: Remove ibp_employee_id-based role rows added by this migration
-- DELETE FROM user_role WHERE ibp_employee_id IS NOT NULL AND user_id IS NULL;

-- STEP R2: Restore user_id NOT NULL on user_role
-- WARNING: Check first that no other null user_id rows exist before this:
--   SELECT COUNT(*) FROM user_role WHERE user_id IS NULL AND ibp_employee_id IS NULL;
-- Only proceed if that returns 0.
-- ALTER TABLE user_role ALTER COLUMN user_id SET NOT NULL;

-- STEP R3: Drop ibp_employee_id column
-- ALTER TABLE user_role DROP COLUMN IF EXISTS ibp_employee_id;
-- (If column was renamed from pee_id and you want to restore it: ALTER TABLE user_role RENAME COLUMN ibp_employee_id TO pee_id;)

-- STEP R4: Remove credential columns from policy_enrollment_employee
-- ALTER TABLE policy_enrollment_employee
--   DROP COLUMN IF EXISTS login_name,
--   DROP COLUMN IF EXISTS password,
--   DROP COLUMN IF EXISTS ibp_password,
--   DROP COLUMN IF EXISTS is_password_set,
--   DROP COLUMN IF EXISTS is_password_hashed,
--   DROP COLUMN IF EXISTS password_expires_at,
--   DROP COLUMN IF EXISTS auth_version,
--   DROP COLUMN IF EXISTS user_status_key;
