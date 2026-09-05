-- =============================================================================
-- External Hospital Sync — Schema Migration
-- Adds source tracking and external API fields to hospital tables.
-- Run once before deploying the ExternalHospitalSyncScheduler.
-- Safe to re-run (ADD COLUMN IF NOT EXISTS).
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. mstr_hospital — source tracking + external ID for deduplication
-- ─────────────────────────────────────────────────────────────────────────────

-- Tracks where this hospital record came from:
--   FILE_UPLOAD  — inserted via admin file upload (existing records default to this)
--   API_SYNC     — synced from external TPA API (GoodHealth)
ALTER TABLE public.mstr_hospital
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'FILE_UPLOAD';

-- HOSPITALID from external TPA API response — used for daily deduplication check.
-- NULL for file-uploaded hospitals.
ALTER TABLE public.mstr_hospital
  ADD COLUMN IF NOT EXISTS external_hospital_id VARCHAR(50) NULL;

-- Unique index on external_hospital_id (only when not NULL) so dedup is O(1)
-- and the DB enforces no duplicate imports.
CREATE UNIQUE INDEX IF NOT EXISTS uq_mstr_hospital_external_id
  ON public.mstr_hospital (external_hospital_id)
  WHERE external_hospital_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. mstr_hospital_address — new fields from external API response
--    address_line_2 and landmark already exist — only adding the new ones.
-- ─────────────────────────────────────────────────────────────────────────────

-- STDCODE from API (telephone area/STD code)
ALTER TABLE public.mstr_hospital_address
  ADD COLUMN IF NOT EXISTS std_code VARCHAR(10) NULL;

-- FAXNUMBER from API
ALTER TABLE public.mstr_hospital_address
  ADD COLUMN IF NOT EXISTS fax_number VARCHAR(30) NULL;

-- LEVELOFCARE from API (e.g. "Primary", "Secondary", "Tertiary", or blank)
ALTER TABLE public.mstr_hospital_address
  ADD COLUMN IF NOT EXISTS level_of_care VARCHAR(100) NULL;

-- NETWORKTYPE from API (e.g. "TPA_Wise", "Insurer_Wise")
ALTER TABLE public.mstr_hospital_address
  ADD COLUMN IF NOT EXISTS network_type VARCHAR(100) NULL;

-- INSURANCECOMPANY from API — pipe-separated string stored as JSON array.
-- e.g. ["National Insurance Co. Ltd.", "United India Insurance Co. Ltd.", ...]
ALTER TABLE public.mstr_hospital_address
  ADD COLUMN IF NOT EXISTS insurance_companies JSONB NULL;


ALTER TABLE public.mstr_hospital_address
  ALTER COLUMN std_code TYPE VARCHAR(50);

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'mstr_hospital'         AND column_name IN ('source', 'external_hospital_id'))
    OR
    (table_name = 'mstr_hospital_address' AND column_name IN ('std_code', 'fax_number', 'level_of_care', 'network_type', 'insurance_companies'))
  )
ORDER BY table_name, column_name;
