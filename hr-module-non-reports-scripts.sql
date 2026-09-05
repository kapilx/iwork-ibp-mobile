-- =============================================================================
-- HR MODULE — NON-REPORTS SCRIPTS
-- Combined from all SQL files in:
--   apps/services/ibp-service/src/app/hr-module/
--
-- EXCLUDED: all INSERT/UPDATE/DELETE/ALTER for:
--   admin_reports, admin_reports_parameters, admin_reports_results_mappings
--
-- Files in alphabetical order.
-- =============================================================================


-- =============================================================================
-- STEP 1: BACKUP — copy all three tables into dated backup tables
-- Backup table names: <table>_bkp_20260521
-- Run this block FIRST before applying any other scripts.
-- =============================================================================

BEGIN;

CREATE TABLE public.admin_reports_bkp_20260521
  AS TABLE public.admin_reports;

CREATE TABLE public.admin_reports_parameters_bkp_20260521
  AS TABLE public.admin_reports_parameters;

CREATE TABLE public.admin_reports_results_mappings_bkp_20260521
  AS TABLE public.admin_reports_results_mappings;

COMMIT;

-- Verify backup row counts match originals
SELECT 'admin_reports'                  AS table_name, COUNT(*) AS backed_up_rows FROM public.admin_reports_bkp_20260521
UNION ALL
SELECT 'admin_reports_parameters'       AS table_name, COUNT(*) AS backed_up_rows FROM public.admin_reports_parameters_bkp_20260521
UNION ALL
SELECT 'admin_reports_results_mappings' AS table_name, COUNT(*) AS backed_up_rows FROM public.admin_reports_results_mappings_bkp_20260521;


-- =============================================================================
-- STEP 2: EMPTY the three tables
-- Truncate child tables first (FK order):
--   admin_reports_results_mappings → admin_reports_parameters → admin_reports
-- =============================================================================

BEGIN;

TRUNCATE TABLE public.admin_reports_results_mappings RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.admin_reports_parameters       RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.admin_reports                  RESTART IDENTITY CASCADE;

COMMIT;

-- Verify all three tables are now empty
SELECT 'admin_reports'                  AS table_name, COUNT(*) AS remaining_rows FROM public.admin_reports
UNION ALL
SELECT 'admin_reports_parameters'       AS table_name, COUNT(*) AS remaining_rows FROM public.admin_reports_parameters
UNION ALL
SELECT 'admin_reports_results_mappings' AS table_name, COUNT(*) AS remaining_rows FROM public.admin_reports_results_mappings;


-- =============================================================================
-- SOURCE: external-hr-management.sql
-- =============================================================================

BEGIN;

-- Create ROLE_EXTERNAL_HR in the roles table (idempotent)
INSERT INTO public.roles (name, description, role_key, created_at, updated_at, created_by, updated_by)
SELECT
  'External HR',
  'External HR user with policy-based and location-based access to the IBP portal',
  'ROLE_EXTERNAL_HR',
  NOW(),
  NOW(),
  'SYSTEM',
  'SYSTEM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles WHERE role_key = 'ROLE_EXTERNAL_HR'
);

COMMIT;


-- =============================================================================
-- SOURCE: hr-report-and-user-management-scripts.sql
-- =============================================================================

-- hr_user_management
-- HR portal access registry for IBP.
-- Presence in this table grants HR portal access.
-- Supports HR_ADMIN and EXTERNAL_HR roles.
CREATE TABLE public.hr_user_management (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    user_name           VARCHAR(255),
    email_id            VARCHAR(255),
    phone_number        VARCHAR(50),

    -- Roles:
    -- HR_ADMIN
    -- EXTERNAL_HR
    role_key            VARCHAR(100) NOT NULL DEFAULT 'HR_ADMIN',

    company_id          BIGINT,
    company_name        VARCHAR(255),

    date_of_birth       DATE,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_by          BIGINT,
    updated_by          BIGINT,

    deleted_at          TIMESTAMPTZ,

    CONSTRAINT fk_hr_user_management_user
        FOREIGN KEY (user_id)
        REFERENCES public.users(id)
);

COMMENT ON TABLE public.hr_user_management IS
'HR portal access registry for IBP. Presence in this table grants HR portal access. Supports HR_ADMIN and EXTERNAL_HR roles.';

COMMENT ON COLUMN public.hr_user_management.role_key IS
'Supported roles: HR_ADMIN, EXTERNAL_HR';

CREATE INDEX idx_hr_user_management_email_id
ON public.hr_user_management(email_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_hr_user_management_company_id
ON public.hr_user_management(company_id);

CREATE INDEX idx_hr_user_management_role_key
ON public.hr_user_management(role_key);

CREATE UNIQUE INDEX uq_hr_user_management_user_id_active
ON public.hr_user_management(user_id)
WHERE deleted_at IS NULL;


-- Add policy_location column to policy_enrollment_employee
ALTER TABLE policy_enrollment_employee
ADD COLUMN policy_location VARCHAR(255);


-- external_hr_policy_map
-- Maps an external-HR user to one or more policies within a company.
CREATE TABLE IF NOT EXISTS external_hr_policy_map (
  id          SERIAL        PRIMARY KEY,
  user_id     INTEGER       NOT NULL REFERENCES users(id),
  policy_id   INTEGER       NOT NULL,
  company_id  INTEGER       NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ext_hr_policy_map_user_policy
  ON external_hr_policy_map (user_id, policy_id);

CREATE INDEX IF NOT EXISTS idx_ext_hr_policy_map_user_id
  ON external_hr_policy_map (user_id);

CREATE INDEX IF NOT EXISTS idx_ext_hr_policy_map_company_id
  ON external_hr_policy_map (company_id);


-- external_hr_location_map
-- Maps an external-HR user to one or more company locations (addresses).
CREATE TABLE IF NOT EXISTS external_hr_location_map (
  id          SERIAL        PRIMARY KEY,
  user_id     INTEGER       NOT NULL REFERENCES users(id),
  address_id  INTEGER       NOT NULL,
  company_id  INTEGER       NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ext_hr_location_map_user_address
  ON external_hr_location_map (user_id, address_id);

CREATE INDEX IF NOT EXISTS idx_ext_hr_location_map_user_id
  ON external_hr_location_map (user_id);

CREATE INDEX IF NOT EXISTS idx_ext_hr_location_map_company_id
  ON external_hr_location_map (company_id);


