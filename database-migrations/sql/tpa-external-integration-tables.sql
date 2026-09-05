-- ============================================================
-- TPA External Integration Framework
-- Creates 3 tables:
--   1. mstr_tpa_feature_type   — admin-managed list of feature types
--   2. tpa_external_feature_config — TPA + feature + API config link
--   3. tpa_payload_field_mapping   — field-by-field payload mapping
-- ============================================================

BEGIN;

-- ── 1. mstr_tpa_feature_type ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mstr_tpa_feature_type (
  id             SERIAL PRIMARY KEY,
  key            VARCHAR(50)  NOT NULL UNIQUE,   -- machine key: CLAIMS, ECARD, etc.
  label          VARCHAR(100) NOT NULL,           -- human label shown in iWork
  description    TEXT,                           -- help text shown in iWork
  icon           VARCHAR(100),                   -- icon identifier for IBP button
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  display_order  INT          NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Pre-seed feature types
INSERT INTO public.mstr_tpa_feature_type (key, label, description, icon, display_order)
VALUES
  ('ECARD',            'E-card',            'Fetch employee e-card from TPA',                    'credit-card',   1),
  ('CLAIMS',           'Claims',            'Fetch employee claims history from TPA',             'file-text',     2),
  ('HOSPITAL_NETWORK', 'Hospital Network',  'Fetch list of empanelled hospitals from TPA',        'building-2',    3),
  ('TPA_PORTAL_LOGIN', 'TPA Portal Login',  'SSO login into the TPA''s own web portal',           'external-link', 4)
ON CONFLICT (key) DO NOTHING;

-- ── 2. tpa_external_feature_config ───────────────────────────
CREATE TABLE IF NOT EXISTS public.tpa_external_feature_config (
  id               SERIAL PRIMARY KEY,
  tpa_id           INT          REFERENCES public.tpa(id) ON DELETE CASCADE,
  -- nullable: some configs are pre-created before TPA is assigned
  feature_type_id  INT          NOT NULL REFERENCES public.mstr_tpa_feature_type(id) ON DELETE RESTRICT,
  app_ref_id       INT          REFERENCES public.mstr_ext_application_ref(id) ON DELETE RESTRICT,
  -- nullable: some feature types don't need an API ref
  label            VARCHAR(100) NOT NULL,          -- internal name e.g. "Good Health Claims"
  button_label     VARCHAR(50)  NOT NULL,          -- text shown on IBP button
  display_order    INT          NOT NULL DEFAULT 0,
  is_active        BOOLEAN      NOT NULL DEFAULT true,
  api_type         VARCHAR(50),
  -- Machine key for worker scheduler lookup: FETCH_CLAIMS, FETCH_ECARD, INTIMATE_CLAIM, etc.
  -- NULL for feature configs that only drive IBP button display (no scheduler involvement)
  dynamic_param_mapping JSONB,
  -- Maps our internal field names → TPA API param names (worker builds dynamicFields from this)
  data_path        VARCHAR(200),
  -- Dot-notation into TPA response to reach the data array (null = root is the array)
  field_mapping    JSONB,
  -- Maps TPA response field names → our standard field keys (parser uses this)
  status_mapping   JSONB,
  -- Maps TPA status strings → our internal status values (parser uses this)
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  -- NO single inline UNIQUE — see partial indexes below:
  -- Rows with api_type: unique by (tpa_id, api_type)   → one FETCH_CLAIMS per TPA
  -- Rows without api_type: unique by (tpa_id, feature_type_id) → one IBP button per TPA per feature
);

-- ── 3. tpa_payload_field_mapping ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.tpa_payload_field_mapping (
  id                   SERIAL PRIMARY KEY,
  feature_config_id    INT          NOT NULL REFERENCES public.tpa_external_feature_config(id) ON DELETE CASCADE,
  external_field_name  VARCHAR(100) NOT NULL,   -- key in TPA API payload e.g. "policyNo"
  source_type          VARCHAR(20)  NOT NULL,   -- STATIC | POLICY | EMPLOYEE | ENROLLMENT | USER_INPUT
  source_field         VARCHAR(100),            -- our DB column e.g. "insurer_policy_number"
  static_value         VARCHAR(255),            -- value when source_type = STATIC
  is_required          BOOLEAN      NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_source_value CHECK (
    (source_type = 'STATIC' AND static_value IS NOT NULL)
    OR (source_type != 'STATIC' AND source_field IS NOT NULL)
    OR (source_type = 'USER_INPUT')
  )
);

-- ── Indexes ───────────────────────────────────────────────────
-- Worker scheduler: one config per TPA per api_type (FETCH_CLAIMS, INTIMATE_CLAIM, etc.)
CREATE UNIQUE INDEX IF NOT EXISTS uq_tpa_ext_feat_cfg_api_type
  ON public.tpa_external_feature_config (tpa_id, api_type)
  WHERE api_type IS NOT NULL AND tpa_id IS NOT NULL;

-- IBP button display: one config per TPA per feature type (for rows with no api_type)
CREATE UNIQUE INDEX IF NOT EXISTS uq_tpa_ext_feat_cfg_feature
  ON public.tpa_external_feature_config (tpa_id, feature_type_id)
  WHERE api_type IS NULL AND tpa_id IS NOT NULL;

-- General lookup indexes
CREATE INDEX IF NOT EXISTS idx_tpa_ext_feat_cfg_tpa_id ON public.tpa_external_feature_config(tpa_id);
CREATE INDEX IF NOT EXISTS idx_tpa_ext_feat_cfg_active  ON public.tpa_external_feature_config(tpa_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tpa_payload_map_cfg_id   ON public.tpa_payload_field_mapping(feature_config_id);

COMMIT;

-- ── Add columns to mstr_ext_application_ref ──────────────────
-- Run this if mstr_ext_application_ref already exists
ALTER TABLE public.mstr_ext_application_ref
  ADD COLUMN IF NOT EXISTS field_hints JSONB;

ALTER TABLE public.mstr_ext_application_ref
  ADD COLUMN IF NOT EXISTS payload_format VARCHAR(10) DEFAULT 'JSON';

-- Allow feature configs without a TPA (for Admin Settings pre-configuration)
ALTER TABLE public.tpa_external_feature_config
  ALTER COLUMN tpa_id DROP NOT NULL;

-- ── Allow real table names as source_type (was VARCHAR(20)) ─────────────────
-- Run once; no-op if already done
ALTER TABLE public.tpa_payload_field_mapping
  DROP CONSTRAINT IF EXISTS chk_source_value;

ALTER TABLE public.tpa_payload_field_mapping
  ALTER COLUMN source_type TYPE VARCHAR(100);

ALTER TABLE public.tpa_payload_field_mapping
  ADD CONSTRAINT chk_source_value CHECK (
    (source_type = 'STATIC' AND static_value IS NOT NULL)
    OR (source_type = 'USER_INPUT')
    OR (source_type NOT IN ('STATIC', 'USER_INPUT') AND source_field IS NOT NULL)
  );

-- ── Phase 3: Existing DB upgrade (skip on fresh DB — columns already in CREATE TABLE) ──
-- Drops the old (tpa_id, feature_type_id) unique constraint and adds the correct partial indexes.
-- Adds the 5 new columns absorbed from mstr_tpa_claim_api_config.

-- Drop the old overly-strict unique constraint (auto-named by Postgres on inline UNIQUE)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'tpa_external_feature_config'
      AND c.contype = 'u'
      AND array_to_string(c.conkey, ',') IN (
        SELECT array_to_string(ARRAY[a.attnum, b.attnum], ',')
        FROM pg_attribute a, pg_attribute b
        WHERE a.attrelid = t.oid AND a.attname = 'tpa_id'
          AND b.attrelid = t.oid AND b.attname = 'feature_type_id'
      )
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.tpa_external_feature_config DROP CONSTRAINT ' || c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname = 'tpa_external_feature_config' AND c.contype = 'u'
      LIMIT 1
    );
  END IF;
END $$;

-- Add new columns (safe no-ops if already present from CREATE TABLE on fresh DB)
ALTER TABLE public.tpa_external_feature_config
  ADD COLUMN IF NOT EXISTS api_type              VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dynamic_param_mapping JSONB,
  ADD COLUMN IF NOT EXISTS data_path             VARCHAR(200),
  ADD COLUMN IF NOT EXISTS field_mapping         JSONB,
  ADD COLUMN IF NOT EXISTS status_mapping        JSONB;

-- Recreate partial unique indexes (no-ops if already exist)
CREATE UNIQUE INDEX IF NOT EXISTS uq_tpa_ext_feat_cfg_api_type
  ON public.tpa_external_feature_config (tpa_id, api_type)
  WHERE api_type IS NOT NULL AND tpa_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tpa_ext_feat_cfg_feature
  ON public.tpa_external_feature_config (tpa_id, feature_type_id)
  WHERE api_type IS NULL AND tpa_id IS NOT NULL;

COMMENT ON COLUMN public.tpa_external_feature_config.api_type IS
  'Worker scheduler lookup key: FETCH_CLAIMS, FETCH_ECARD, INTIMATE_CLAIM, etc. NULL = IBP display only';
COMMENT ON COLUMN public.tpa_external_feature_config.dynamic_param_mapping IS
  'Maps internal field names to TPA-specific param names for building API request';
COMMENT ON COLUMN public.tpa_external_feature_config.data_path IS
  'Dot-notation path into TPA response to reach the data array (null = root)';
COMMENT ON COLUMN public.tpa_external_feature_config.field_mapping IS
  'Maps TPA response field names to our standard field keys — used by parser scheduler';
COMMENT ON COLUMN public.tpa_external_feature_config.status_mapping IS
  'Maps TPA claim status strings to our internal status values — used by parser scheduler';

-- ── Phase 4: field_type + date_format on tpa_payload_field_mapping ──────────
-- field_type: STRING | DATE | NUMBER — admin marks the data type of each payload field
-- date_format: e.g. DD-MON-YYYY — only used when field_type = DATE; controls how the
--   value is formatted before being sent to the TPA API

ALTER TABLE public.tpa_payload_field_mapping
  ADD COLUMN IF NOT EXISTS field_type  VARCHAR(20),
  ADD COLUMN IF NOT EXISTS date_format VARCHAR(30);

COMMENT ON COLUMN public.tpa_payload_field_mapping.field_type IS
  'Data type of this field: STRING (default) | DATE | NUMBER';
COMMENT ON COLUMN public.tpa_payload_field_mapping.date_format IS
  'Date format to apply when field_type = DATE. e.g. DD-MON-YYYY, DD/MM/YYYY. Supports custom patterns.';

-- ── Rollback (run manually if needed) ────────────────────────
-- ALTER TABLE public.tpa_payload_field_mapping DROP COLUMN IF EXISTS date_format;
-- ALTER TABLE public.tpa_payload_field_mapping DROP COLUMN IF EXISTS field_type;
-- DROP INDEX IF EXISTS public.uq_tpa_ext_feat_cfg_api_type;
-- DROP INDEX IF EXISTS public.uq_tpa_ext_feat_cfg_feature;
-- ALTER TABLE public.tpa_external_feature_config DROP COLUMN IF EXISTS status_mapping;
-- ALTER TABLE public.tpa_external_feature_config DROP COLUMN IF EXISTS field_mapping;
-- ALTER TABLE public.tpa_external_feature_config DROP COLUMN IF EXISTS data_path;
-- ALTER TABLE public.tpa_external_feature_config DROP COLUMN IF EXISTS dynamic_param_mapping;
-- ALTER TABLE public.tpa_external_feature_config DROP COLUMN IF EXISTS api_type;
-- ALTER TABLE public.mstr_ext_application_ref DROP COLUMN IF EXISTS payload_format;
-- ALTER TABLE public.mstr_ext_application_ref DROP COLUMN IF EXISTS field_hints;
-- DROP TABLE IF EXISTS public.tpa_payload_field_mapping;
-- DROP TABLE IF EXISTS public.tpa_external_feature_config;
-- DROP TABLE IF EXISTS public.mstr_tpa_feature_type;

-- Phase 5: tpa_id on mstr_hospital for TPA-based hospital filtering
ALTER TABLE public.mstr_hospital
  ADD COLUMN IF NOT EXISTS tpa_id INTEGER NULL;

CREATE INDEX IF NOT EXISTS idx_mstr_hospital_tpa_id
  ON public.mstr_hospital (tpa_id)
  WHERE tpa_id IS NOT NULL;

-- Phase 5b: Fix external_hospital_id uniqueness — scope it per TPA, not globally
-- Old global unique must be dropped first; replace with composite (external_hospital_id, tpa_id)
ALTER TABLE public.mstr_hospital
  DROP CONSTRAINT IF EXISTS mstr_hospital_external_hospital_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mstr_hospital_ext_id_tpa
  ON public.mstr_hospital (external_hospital_id, tpa_id)
  WHERE external_hospital_id IS NOT NULL AND tpa_id IS NOT NULL;
