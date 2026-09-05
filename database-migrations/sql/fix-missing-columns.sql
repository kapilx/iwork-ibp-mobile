-- =============================================================================
-- Fix: Add all missing columns to existing tables
-- Safe to run multiple times (IF NOT EXISTS on every statement)
-- Run this if tpa-external-integration-tables.sql or
-- mstr-ext-app-response-mapping.sql did not fully apply.
-- =============================================================================

-- ── mstr_ext_application_ref ─────────────────────────────────────────────────

ALTER TABLE public.mstr_ext_application_ref
  ADD COLUMN IF NOT EXISTS field_hints                    JSONB,
  ADD COLUMN IF NOT EXISTS payload_format                 VARCHAR(10)  DEFAULT 'JSON',
  ADD COLUMN IF NOT EXISTS flow_type                      VARCHAR(20)  DEFAULT 'REDIRECT',
  ADD COLUMN IF NOT EXISTS sync_target_table              VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sync_dedup_column              VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sync_scope                     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS sync_schedule                  VARCHAR(50),
  ADD COLUMN IF NOT EXISTS sync_ttl_hours                 INTEGER      DEFAULT 24,
  ADD COLUMN IF NOT EXISTS sync_tables                    JSONB,
  ADD COLUMN IF NOT EXISTS basic_auth_user                VARCHAR(200),
  ADD COLUMN IF NOT EXISTS basic_auth_password            VARCHAR(500),
  ADD COLUMN IF NOT EXISTS verification_token_api_headers JSONB,
  ADD COLUMN IF NOT EXISTS magic_url_api_headers          JSONB,
  ADD COLUMN IF NOT EXISTS token_placement                VARCHAR(20)  DEFAULT 'BEARER_HEADER',
  ADD COLUMN IF NOT EXISTS step2_header_template          JSONB,
  ADD COLUMN IF NOT EXISTS token_body_key                 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS step2_content_type             VARCHAR(50);

-- ── tpa_external_feature_config ──────────────────────────────────────────────

ALTER TABLE public.tpa_external_feature_config
  ADD COLUMN IF NOT EXISTS api_type              VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dynamic_param_mapping JSONB,
  ADD COLUMN IF NOT EXISTS data_path             VARCHAR(200),
  ADD COLUMN IF NOT EXISTS field_mapping         JSONB,
  ADD COLUMN IF NOT EXISTS status_mapping        JSONB;

-- Allow tpa_id to be NULL (for pre-configured admin-level app refs)
ALTER TABLE public.tpa_external_feature_config
  ALTER COLUMN tpa_id DROP NOT NULL;

-- ── Partial unique indexes ────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS uq_tpa_ext_feat_cfg_api_type
  ON public.tpa_external_feature_config (tpa_id, api_type)
  WHERE api_type IS NOT NULL AND tpa_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tpa_ext_feat_cfg_feature
  ON public.tpa_external_feature_config (tpa_id, feature_type_id)
  WHERE api_type IS NULL AND tpa_id IS NOT NULL;

-- ── mstr_ext_application_ref nullable columns ────────────────────────────────
-- iss was created NOT NULL but is optional for SESSION/BASIC_AUTH types

ALTER TABLE public.mstr_ext_application_ref
  ALTER COLUMN iss DROP NOT NULL;

-- ── mstr_ext_application_ref id sequence ─────────────────────────────────────
-- Fixes: null value in column "id" violates not-null constraint
-- The table may have been created without SERIAL so the id has no auto-increment default.

CREATE SEQUENCE IF NOT EXISTS mstr_ext_application_ref_id_seq;

ALTER TABLE public.mstr_ext_application_ref
  ALTER COLUMN id SET DEFAULT nextval('mstr_ext_application_ref_id_seq');

SELECT setval(
  'mstr_ext_application_ref_id_seq',
  COALESCE((SELECT MAX(id) FROM public.mstr_ext_application_ref), 0) + 1,
  false
);

-- ── Verify ───────────────────────────────────────────────────────────────────

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'mstr_ext_application_ref' AND column_name IN (
      'field_hints', 'payload_format', 'flow_type', 'sync_target_table',
      'sync_dedup_column', 'sync_scope', 'sync_schedule', 'sync_ttl_hours',
      'basic_auth_user', 'basic_auth_password', 'verification_token_api_headers',
      'magic_url_api_headers', 'token_placement', 'step2_header_template',
      'token_body_key', 'step2_content_type'
    ))
    OR
    (table_name = 'tpa_external_feature_config' AND column_name IN (
      'api_type', 'dynamic_param_mapping', 'data_path', 'field_mapping', 'status_mapping'
    ))
  )
ORDER BY table_name, column_name;
