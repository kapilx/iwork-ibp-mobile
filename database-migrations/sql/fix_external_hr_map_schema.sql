-- Fix external_hr_policy_map and external_hr_location_map to support
-- hr_management_id (FK to hr_user_management.id) instead of user_id.
--
-- Original tables were created with `user_id INTEGER NOT NULL REFERENCES users(id)`.
-- The code (hr.repository.ts) now inserts using hr_management_id, not user_id.
-- This script adds hr_management_id, drops the NOT NULL from user_id,
-- and recreates the unique indexes on hr_management_id instead of user_id.
--
-- Also makes hr_user_management.user_id nullable since createHrUserManagement
-- does not populate it (the HR user is not a portal user in the users table).
--
-- Run once. Safe to re-run (ADD COLUMN IF NOT EXISTS / DROP IF EXISTS).

-- ============================================================
-- 1. hr_user_management: make user_id nullable
-- ============================================================
ALTER TABLE public.hr_user_management
  ALTER COLUMN user_id DROP NOT NULL;

-- ============================================================
-- 2. external_hr_policy_map: add hr_management_id, relax user_id
-- ============================================================
ALTER TABLE public.external_hr_policy_map
  ADD COLUMN IF NOT EXISTS hr_management_id BIGINT REFERENCES public.hr_user_management(id);

ALTER TABLE public.external_hr_policy_map
  ALTER COLUMN user_id DROP NOT NULL;

-- Drop old unique index on (user_id, policy_id)
DROP INDEX IF EXISTS uq_ext_hr_policy_map_user_policy;

-- New unique index on (hr_management_id, policy_id) — required for ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS uq_ext_hr_policy_map_hr_policy
  ON public.external_hr_policy_map (hr_management_id, policy_id);

CREATE INDEX IF NOT EXISTS idx_ext_hr_policy_map_hr_management_id
  ON public.external_hr_policy_map (hr_management_id);

-- ============================================================
-- 3. external_hr_location_map: add hr_management_id, relax user_id
-- ============================================================
ALTER TABLE public.external_hr_location_map
  ADD COLUMN IF NOT EXISTS hr_management_id BIGINT REFERENCES public.hr_user_management(id);

ALTER TABLE public.external_hr_location_map
  ALTER COLUMN user_id DROP NOT NULL;

-- Drop old unique index on (user_id, address_id)
DROP INDEX IF EXISTS uq_ext_hr_location_map_user_address;

-- New unique index on (hr_management_id, address_id) — required for ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS uq_ext_hr_location_map_hr_address
  ON public.external_hr_location_map (hr_management_id, address_id);

CREATE INDEX IF NOT EXISTS idx_ext_hr_location_map_hr_management_id
  ON public.external_hr_location_map (hr_management_id);

-- ============================================================
-- Verify
-- ============================================================
SELECT
  c.table_name,
  c.column_name,
  c.is_nullable,
  c.data_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name IN ('hr_user_management', 'external_hr_policy_map', 'external_hr_location_map')
  AND c.column_name IN ('user_id', 'hr_management_id')
ORDER BY c.table_name, c.column_name;
