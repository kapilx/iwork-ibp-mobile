-- ============================================================
-- TPA External Integration Framework — Combined Migration
-- ============================================================
-- Covers every table, column, index, and seed row for the
-- TPA External Integration feature.
--
-- Safe to run on:
--   • Fresh DB      — creates everything from scratch
--   • Existing DB   — every statement uses IF NOT EXISTS / DO $$
--                     so nothing breaks if already applied
--
-- Run order matters — do not reorder sections.
-- Run as a superuser or the app DB user (needs CREATE / ALTER).
--
-- Sections:
--   1. mstr_ext_application_ref   — base table + all columns
--   2. TPA Feature Framework      — feature types, configs, field mappings
--   3. Response Mappings          — per-field response mapping table
--   4. Claims Sync Pipeline       — job queue + raw store (claims-specific)
--   5. Generic Sync Pipeline      — job queue + raw store (reusable)
--   6. Hospital Sync              — hospital + address column additions
--   7. Seed Data                  — iConnect, Poppins, Good Health TPA app refs
--   8. Verify                     — sanity check SELECT
--   9. Shared Step 1 Auth         — auth_app_ref_id FK on mstr_ext_application_ref
--  10. Claim Status Log           — policy_claim_status_log (ref_claim_id dedup, sync columns)
--                                   tpa_claim_data (updated_at/by/created_by for generic sync)
-- ============================================================


-- ============================================================
-- SECTION 1: mstr_ext_application_ref
-- Base table for all external API configurations.
-- CREATE covers fresh DB; ALTER ADD COLUMN IF NOT EXISTS covers
-- existing DB where table already exists with fewer columns.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mstr_ext_application_ref (
  id                              SERIAL       PRIMARY KEY,
  label                           TEXT         NOT NULL,
  description                     TEXT,
  auth_type                       VARCHAR(20)  NOT NULL DEFAULT 'JWT',
  -- JWT | SESSION | SESSION_BODY | DIRECT | HEADER_CREDENTIALS | BASIC_AUTH
  verification_token_api_url      TEXT,
  verification_token_api_method   VARCHAR(10),
  verification_token_api_payload  JSONB,
  verification_token_api_headers  JSONB,
  magic_url_api_url               TEXT         NOT NULL,
  magic_url_api_method            VARCHAR(10)  NOT NULL,
  magic_url_api_payload           JSONB,
  magic_url_api_headers           JSONB,
  container_category              TEXT         NOT NULL,
  is_active                       BOOLEAN      NOT NULL DEFAULT TRUE,
  iss                             TEXT,
  expires_in                      VARCHAR(20)  NOT NULL DEFAULT '10m',
  step1_response_token_key        VARCHAR(100) NOT NULL DEFAULT 'verificationToken',
  step2_response_data_key         VARCHAR(100) NOT NULL DEFAULT 'magicLink',
  field_hints                     JSONB,
  payload_format                  VARCHAR(10)           DEFAULT 'JSON',
  -- How to pass the step1 token to step2: BEARER_HEADER | BODY | QUERY_PARAM
  token_placement                 VARCHAR(20)           DEFAULT 'BEARER_HEADER',
  step2_header_template           JSONB,
  token_body_key                  VARCHAR(100),
  step2_content_type              VARCHAR(50),
  -- BASIC_AUTH: stored here (supports {{env:KEY}} to read from .env at runtime)
  basic_auth_user                 VARCHAR(200),
  basic_auth_password             VARCHAR(500),
  -- SYNC flow config
  flow_type                       VARCHAR(20)           DEFAULT 'REDIRECT',
  -- REDIRECT | DISPLAY | SYNC
  sync_target_table               VARCHAR(100),
  sync_dedup_column               VARCHAR(100),
  sync_scope                      VARCHAR(20),
  -- PER_POLICY | PER_TPA | GLOBAL
  sync_schedule                   VARCHAR(50),
  sync_ttl_hours                  INTEGER               DEFAULT 24,
  sync_tables                     JSONB,
  created_by                      INTEGER,
  updated_by                      INTEGER,
  created_at                      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Idempotent column additions for existing DBs that have the old shorter schema
ALTER TABLE public.mstr_ext_application_ref
  ADD COLUMN IF NOT EXISTS description                     TEXT,
  ADD COLUMN IF NOT EXISTS auth_type                       VARCHAR(20)  DEFAULT 'JWT',
  ADD COLUMN IF NOT EXISTS step1_response_token_key        VARCHAR(100) DEFAULT 'verificationToken',
  ADD COLUMN IF NOT EXISTS step2_response_data_key         VARCHAR(100) DEFAULT 'magicLink',
  ADD COLUMN IF NOT EXISTS field_hints                     JSONB,
  ADD COLUMN IF NOT EXISTS payload_format                  VARCHAR(10)  DEFAULT 'JSON',
  ADD COLUMN IF NOT EXISTS verification_token_api_headers  JSONB,
  ADD COLUMN IF NOT EXISTS magic_url_api_headers           JSONB,
  ADD COLUMN IF NOT EXISTS token_placement                 VARCHAR(20)  DEFAULT 'BEARER_HEADER',
  ADD COLUMN IF NOT EXISTS step2_header_template           JSONB,
  ADD COLUMN IF NOT EXISTS token_body_key                  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS step2_content_type              VARCHAR(50),
  ADD COLUMN IF NOT EXISTS basic_auth_user                 VARCHAR(200),
  ADD COLUMN IF NOT EXISTS basic_auth_password             VARCHAR(500),
  ADD COLUMN IF NOT EXISTS flow_type                       VARCHAR(20)  DEFAULT 'REDIRECT',
  ADD COLUMN IF NOT EXISTS sync_target_table               VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sync_dedup_column               VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sync_scope                      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS sync_schedule                   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS sync_ttl_hours                  INTEGER      DEFAULT 24,
  ADD COLUMN IF NOT EXISTS sync_tables                     JSONB,
  ADD COLUMN IF NOT EXISTS created_by                      INTEGER,
  ADD COLUMN IF NOT EXISTS updated_by                      INTEGER;

-- Make iss nullable (was NOT NULL in older versions)
ALTER TABLE public.mstr_ext_application_ref
  ALTER COLUMN iss DROP NOT NULL;

-- Ensure id has a sequence (fixes "null value in column id" on older table variants)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attrdef ad
    JOIN pg_class c ON c.oid = ad.adrelid
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ad.adnum
    WHERE c.relname = 'mstr_ext_application_ref' AND a.attname = 'id'
  ) THEN
    CREATE SEQUENCE IF NOT EXISTS mstr_ext_application_ref_id_seq;
    ALTER TABLE public.mstr_ext_application_ref
      ALTER COLUMN id SET DEFAULT nextval('mstr_ext_application_ref_id_seq');
    PERFORM setval(
      'mstr_ext_application_ref_id_seq',
      COALESCE((SELECT MAX(id) FROM public.mstr_ext_application_ref), 0) + 1,
      false
    );
  END IF;
END $$;


-- ============================================================
-- SECTION 2: TPA Feature Framework
-- ============================================================

-- ── 2A. mstr_tpa_feature_type ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mstr_tpa_feature_type (
  id             SERIAL       PRIMARY KEY,
  key            VARCHAR(50)  NOT NULL UNIQUE,
  label          VARCHAR(100) NOT NULL,
  description    TEXT,
  icon           VARCHAR(100),
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  display_order  INT          NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO public.mstr_tpa_feature_type (key, label, description, icon, display_order) VALUES
  ('ECARD',            'E-card',           'Fetch employee e-card from TPA',              'credit-card',   1),
  ('CLAIMS',           'Claims',           'Fetch employee claims history from TPA',       'file-text',     2),
  ('HOSPITAL_NETWORK', 'Hospital Network', 'Fetch list of empanelled hospitals from TPA',  'building-2',    3),
  ('TPA_PORTAL_LOGIN', 'TPA Portal Login', 'SSO login into the TPA''s own web portal',     'external-link', 4)
ON CONFLICT (key) DO NOTHING;

-- ── 2B. tpa_external_feature_config ──────────────────────────
CREATE TABLE IF NOT EXISTS public.tpa_external_feature_config (
  id                    SERIAL       PRIMARY KEY,
  tpa_id                INT          REFERENCES public.tpa(id) ON DELETE CASCADE,
  feature_type_id       INT          NOT NULL REFERENCES public.mstr_tpa_feature_type(id) ON DELETE RESTRICT,
  app_ref_id            INT          REFERENCES public.mstr_ext_application_ref(id) ON DELETE RESTRICT,
  label                 VARCHAR(100) NOT NULL,
  button_label          VARCHAR(50)  NOT NULL,
  display_order         INT          NOT NULL DEFAULT 0,
  is_active             BOOLEAN      NOT NULL DEFAULT true,
  api_type              VARCHAR(50),
  dynamic_param_mapping JSONB,
  data_path             VARCHAR(200),
  field_mapping         JSONB,
  status_mapping        JSONB,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- tpa_id is nullable: allows pre-configuring before a TPA is assigned
ALTER TABLE public.tpa_external_feature_config
  ALTER COLUMN tpa_id DROP NOT NULL;

-- Idempotent column additions for existing tables
ALTER TABLE public.tpa_external_feature_config
  ADD COLUMN IF NOT EXISTS api_type              VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dynamic_param_mapping JSONB,
  ADD COLUMN IF NOT EXISTS data_path             VARCHAR(200),
  ADD COLUMN IF NOT EXISTS field_mapping         JSONB,
  ADD COLUMN IF NOT EXISTS status_mapping        JSONB;

-- Drop old overly-strict unique constraint if it exists (replaced by partial indexes below)
DO $$ DECLARE
  _cname TEXT;
BEGIN
  SELECT c.conname INTO _cname
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'tpa_external_feature_config' AND c.contype = 'u'
  LIMIT 1;
  IF _cname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tpa_external_feature_config DROP CONSTRAINT ' || quote_ident(_cname);
  END IF;
END $$;

-- Partial unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS uq_tpa_ext_feat_cfg_api_type
  ON public.tpa_external_feature_config (tpa_id, api_type)
  WHERE api_type IS NOT NULL AND tpa_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tpa_ext_feat_cfg_feature
  ON public.tpa_external_feature_config (tpa_id, feature_type_id)
  WHERE api_type IS NULL AND tpa_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tpa_ext_feat_cfg_tpa_id ON public.tpa_external_feature_config(tpa_id);
CREATE INDEX IF NOT EXISTS idx_tpa_ext_feat_cfg_active  ON public.tpa_external_feature_config(tpa_id, is_active);

COMMENT ON COLUMN public.tpa_external_feature_config.api_type IS
  'Worker scheduler lookup key: FETCH_CLAIMS, FETCH_ECARD, INTIMATE_CLAIM, etc. NULL = IBP display only';

-- ── 2C. tpa_payload_field_mapping ────────────────────────────
CREATE TABLE IF NOT EXISTS public.tpa_payload_field_mapping (
  id                   SERIAL       PRIMARY KEY,
  feature_config_id    INT          NOT NULL REFERENCES public.tpa_external_feature_config(id) ON DELETE CASCADE,
  external_field_name  VARCHAR(100) NOT NULL,
  source_type          VARCHAR(100) NOT NULL,
  -- STATIC | USER_INPUT | <actual table name> e.g. policy, employee, enrollment
  source_field         VARCHAR(100),
  static_value         VARCHAR(255),
  is_required          BOOLEAN      NOT NULL DEFAULT true,
  field_type           VARCHAR(20),
  date_format          VARCHAR(30),
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_source_value CHECK (
    (source_type = 'STATIC'     AND static_value IS NOT NULL)
    OR (source_type = 'USER_INPUT')
    OR (source_type NOT IN ('STATIC', 'USER_INPUT') AND source_field IS NOT NULL)
  )
);

-- Idempotent column additions
ALTER TABLE public.tpa_payload_field_mapping
  ADD COLUMN IF NOT EXISTS field_type   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS date_format  VARCHAR(30);

-- Drop old constraint with narrower source_type size if it exists, re-add correct one
ALTER TABLE public.tpa_payload_field_mapping
  DROP CONSTRAINT IF EXISTS chk_source_value;

ALTER TABLE public.tpa_payload_field_mapping
  ALTER COLUMN source_type TYPE VARCHAR(100);

ALTER TABLE public.tpa_payload_field_mapping
  ADD CONSTRAINT chk_source_value CHECK (
    (source_type = 'STATIC'     AND static_value IS NOT NULL)
    OR (source_type = 'USER_INPUT')
    OR (source_type NOT IN ('STATIC', 'USER_INPUT') AND source_field IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_tpa_payload_map_cfg_id ON public.tpa_payload_field_mapping(feature_config_id);


-- ============================================================
-- SECTION 3: Response Mappings
-- Per-field mappings from TPA API responses → our system.
-- Replaces single step1ResponseTokenKey / step2ResponseDataKey.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mstr_ext_app_response_mapping (
  id             SERIAL       PRIMARY KEY,
  app_ref_id     INTEGER      NOT NULL REFERENCES public.mstr_ext_application_ref(id) ON DELETE CASCADE,
  step           INTEGER      NOT NULL CHECK (step IN (1, 2)),
  response_key   VARCHAR(200) NOT NULL,
  -- dot-notation path into TPA JSON, e.g. "access_token", "response.data.ecard_url"
  target_type    VARCHAR(20)  NOT NULL CHECK (target_type IN ('PLACEHOLDER', 'STANDARD_KEY', 'DB_COLUMN')),
  -- PLACEHOLDER  → value becomes {{output_key}} placeholder for step2 payload
  -- STANDARD_KEY → standard key read by IBP (REDIRECT_URL, DOWNLOAD_URL, MEMBER_ID, etc.)
  -- DB_COLUMN    → written directly to target_table by sync scheduler
  output_key     VARCHAR(100) NOT NULL,
  target_table   VARCHAR(100),
  -- DB_COLUMN only: which table to write to
  is_auth_token  BOOLEAN      NOT NULL DEFAULT FALSE,
  -- step=1 PLACEHOLDER: this field's value becomes Bearer for step2
  is_primary_fk  BOOLEAN      NOT NULL DEFAULT FALSE,
  -- DB_COLUMN secondary table: inject PK from primary table insert
  transform      JSONB,
  -- e.g. {"type":"DATE_FORMAT","from":"DD/MM/YYYY","to":"YYYY-MM-DD"}
  display_order  INTEGER      NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Idempotent column addition (in case table existed before is_primary_fk was added)
ALTER TABLE public.mstr_ext_app_response_mapping
  ADD COLUMN IF NOT EXISTS is_primary_fk BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_mstr_ext_app_response_mapping_app_ref
  ON public.mstr_ext_app_response_mapping (app_ref_id, step, display_order);

COMMENT ON TABLE public.mstr_ext_app_response_mapping IS
  'Per-field response mappings for TPA external API integrations (Step1 + Step2). '
  'Replaces single-key step1_response_token_key / step2_response_data_key fields.';


-- ============================================================
-- SECTION 4: Claims Sync Pipeline
-- Job queue + raw response store specific to TPA claims sync.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.claim_sync_job (
  id                SERIAL       PRIMARY KEY,
  policy_id         INT          NOT NULL,
  policy_number     VARCHAR(100) NOT NULL,
  tpa_id            INT,
  priority          VARCHAR(10)  NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('HIGH', 'NORMAL')),
  status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  retry_count       INT          NOT NULL DEFAULT 0,
  policy_start_date DATE,
  policy_end_date   DATE,
  dynamic_params    JSONB,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  error_message     TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claim_sync_job_pending
  ON public.claim_sync_job (priority, created_at)
  WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_claim_sync_job_processing_started
  ON public.claim_sync_job (started_at)
  WHERE status = 'PROCESSING';

CREATE INDEX IF NOT EXISTS idx_claim_sync_job_policy_status
  ON public.claim_sync_job (policy_number, status);

CREATE TABLE IF NOT EXISTS public.raw_tpa_claim_response (
  id                SERIAL       PRIMARY KEY,
  job_id            INT          NOT NULL REFERENCES public.claim_sync_job(id) ON DELETE CASCADE,
  policy_number     VARCHAR(100) NOT NULL,
  tpa_id            INT,
  response_payload  JSONB        NOT NULL,
  processing_status VARCHAR(20)  NOT NULL DEFAULT 'RECEIVED'
                      CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'FAILED')),
  error_message     TEXT,
  received_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_tpa_claim_response_received
  ON public.raw_tpa_claim_response (received_at)
  WHERE processing_status = 'RECEIVED';

CREATE INDEX IF NOT EXISTS idx_raw_tpa_claim_response_processed_age
  ON public.raw_tpa_claim_response (created_at)
  WHERE processing_status = 'PROCESSED';

CREATE INDEX IF NOT EXISTS idx_raw_tpa_claim_response_policy
  ON public.raw_tpa_claim_response (policy_number);


-- ============================================================
-- SECTION 5: Generic Sync Pipeline
-- Reusable job queue + raw response store for any SYNC-type
-- app ref (flowType = SYNC). Used for hospital sync and all
-- future SYNC integrations.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sync_job (
  id             SERIAL       PRIMARY KEY,
  app_ref_id     INT          NOT NULL REFERENCES public.mstr_ext_application_ref(id) ON DELETE CASCADE,
  sync_type      VARCHAR(50)  NOT NULL,
  scope_type     VARCHAR(20)  NOT NULL DEFAULT 'GLOBAL'
                   CHECK (scope_type IN ('PER_POLICY', 'PER_TPA', 'GLOBAL')),
  scope_id       INT,
  -- PER_POLICY → policy.id, PER_TPA → tpa.id, GLOBAL → NULL
  priority       VARCHAR(10)  NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('HIGH', 'NORMAL')),
  status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  retry_count    INT          NOT NULL DEFAULT 0,
  dynamic_params JSONB,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  error_message  TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_job_pending
  ON public.sync_job (sync_type, priority, created_at)
  WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_sync_job_processing_started
  ON public.sync_job (started_at)
  WHERE status = 'PROCESSING';

CREATE INDEX IF NOT EXISTS idx_sync_job_app_ref_scope
  ON public.sync_job (app_ref_id, scope_type, scope_id, status);

CREATE TABLE IF NOT EXISTS public.raw_sync_response (
  id                SERIAL       PRIMARY KEY,
  job_id            INT          NOT NULL REFERENCES public.sync_job(id) ON DELETE CASCADE,
  app_ref_id        INT          NOT NULL REFERENCES public.mstr_ext_application_ref(id) ON DELETE CASCADE,
  sync_type         VARCHAR(50)  NOT NULL,
  scope_type        VARCHAR(20)  NOT NULL,
  scope_id          INT,
  response_payload  JSONB        NOT NULL,
  processing_status VARCHAR(20)  NOT NULL DEFAULT 'RECEIVED'
                      CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'FAILED')),
  error_message     TEXT,
  received_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_sync_response_received
  ON public.raw_sync_response (sync_type, received_at)
  WHERE processing_status = 'RECEIVED';

CREATE INDEX IF NOT EXISTS idx_raw_sync_response_processed_age
  ON public.raw_sync_response (created_at)
  WHERE processing_status = 'PROCESSED';

CREATE INDEX IF NOT EXISTS idx_raw_sync_response_scope
  ON public.raw_sync_response (app_ref_id, scope_type, scope_id);


-- ============================================================
-- SECTION 6: Hospital Sync Schema
-- Adds source tracking and external-API fields to
-- mstr_hospital and mstr_hospital_address.
-- ============================================================

-- mstr_hospital: source tracking + external dedup ID + TPA link
ALTER TABLE public.mstr_hospital
  ADD COLUMN IF NOT EXISTS source               VARCHAR(20) NOT NULL DEFAULT 'FILE_UPLOAD',
  ADD COLUMN IF NOT EXISTS external_hospital_id VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS tpa_id               INTEGER     NULL,
  ADD COLUMN IF NOT EXISTS raw_data             JSONB       NULL;

-- Drop old global unique (replaced by composite per-TPA unique below)
ALTER TABLE public.mstr_hospital
  DROP CONSTRAINT IF EXISTS mstr_hospital_external_hospital_id_key;

DROP INDEX IF EXISTS public.uq_mstr_hospital_external_id;

-- Composite unique: same external ID allowed across different TPAs
CREATE UNIQUE INDEX IF NOT EXISTS idx_mstr_hospital_ext_id_tpa
  ON public.mstr_hospital (external_hospital_id, tpa_id)
  WHERE external_hospital_id IS NOT NULL AND tpa_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mstr_hospital_tpa_id
  ON public.mstr_hospital (tpa_id)
  WHERE tpa_id IS NOT NULL;

-- mstr_hospital_address: new fields from external API response
ALTER TABLE public.mstr_hospital_address
  ADD COLUMN IF NOT EXISTS std_code           VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS fax_number         VARCHAR(30)  NULL,
  ADD COLUMN IF NOT EXISTS level_of_care      VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS network_type       VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS insurance_companies JSONB       NULL;


-- ============================================================
-- SECTION 7: Seed Data
-- TPA API app-ref configs are created via the iWork Admin UI
-- (Admin Settings → External API Configs → New).
-- No seed inserts here — avoids hardcoded credentials in SQL.
--
-- NOTE ON CREDENTIALS:
--   When creating configs in iWork, use {{env:KEY_NAME}} syntax
--   for any sensitive values (passwords, API keys, encrypted keys).
--   Store actual values in the server's .env file only.
--
--   Example payload field: "password": "{{env:GH_TPA_PASSWORD}}"
--   .env file:              GH_TPA_PASSWORD=actual_value_here
-- ============================================================


-- ============================================================
-- SECTION 8: Verify
-- Sanity check — shows all tables and key columns created above.
-- ============================================================

SELECT
  t.table_name,
  COUNT(c.column_name) AS column_count
FROM information_schema.tables t
JOIN information_schema.columns c
  ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE t.table_schema = 'public'
  AND t.table_name IN (
    'mstr_ext_application_ref',
    'mstr_tpa_feature_type',
    'tpa_external_feature_config',
    'tpa_payload_field_mapping',
    'mstr_ext_app_response_mapping',
    'claim_sync_job',
    'raw_tpa_claim_response',
    'sync_job',
    'raw_sync_response'
  )
GROUP BY t.table_name
ORDER BY t.table_name;

-- ── Env vars to add to .env for Good Health TPA ─────────────
-- GH_TPA_USERNAME=
-- GH_TPA_PASSWORD=
-- GH_TPA_ENCRYPTED_KEY=


-- ============================================================
-- SECTION 9: Shared Step 1 Auth (auth-app-ref-link.sql)
-- Allows an app ref to delegate its Step 1 authentication to
-- another app ref, so ecard / hospital / claims for the same
-- TPA all share one credential set and one token cache entry.
-- NULL = app ref owns its own Step 1 (backward compat).
-- ============================================================

ALTER TABLE mstr_ext_application_ref
  ADD COLUMN IF NOT EXISTS auth_app_ref_id INT REFERENCES mstr_ext_application_ref(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mstr_ext_app_ref_auth_app_ref_id ON mstr_ext_application_ref(auth_app_ref_id);

COMMENT ON COLUMN mstr_ext_application_ref.auth_app_ref_id IS
  'Points to another app ref whose Step 1 auth config this ref reuses. NULL = owns its own Step 1.';


-- ============================================================
-- SECTION 10: Claim Status Log + Generic Sync Support
-- Full audit trail of every claim status transition.
--   policy_claim.claim_status    = latest state
--   policy_claim_settlement      = financial settlement records
--   policy_claim_status_log      = full history (one row per change)
--
-- Also adds generic-sync-compatible columns to:
--   policy_claim              = ref_claim_id (sync dedup — safe across TPAs)
--   policy_claim_status_log   = ref_claim_id (sync dedup only), updated_at/by for parser
--   policy_claim_settlement   = ref_claim_id (sync dedup only)
--   tpa_claim_data            = updated_at/by/created_by for parser
--
-- ref_claim_id rule: used ONLY by generic sync to dedup on cron re-runs
-- (UPDATE if ref_claim_id exists, INSERT if not). All other app code uses claim_id.
-- ============================================================

-- ── 10A. Create policy_claim_status_log (fresh DB) ───────────
CREATE TABLE IF NOT EXISTS policy_claim_status_log (
    id                  SERIAL PRIMARY KEY,
    claim_id            INT REFERENCES policy_claim(id) ON DELETE CASCADE,
    -- nullable: generic sync writes by ref_claim_id before claim_id is resolved
    ref_claim_id        VARCHAR(100),
    -- TPA's external claim reference — dedup key for generic sync
    previous_status     VARCHAR(50),
    new_status          VARCHAR(50) NOT NULL,
    settlement_amount   NUMERIC(15, 2),
    settlement_date     DATE,
    source              VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    source_ref_id       INT,
    changed_by          INT NOT NULL DEFAULT 0,
    changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          INT NOT NULL DEFAULT 0,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by          INT NOT NULL DEFAULT 0
);

-- ── 10B. Idempotent column additions (existing DB) ───────────
-- Make claim_id nullable so generic sync can insert without our internal FK
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'policy_claim_status_log'
      AND column_name = 'claim_id'
  ) THEN
    ALTER TABLE policy_claim_status_log ALTER COLUMN claim_id DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE policy_claim_status_log
  ADD COLUMN IF NOT EXISTS ref_claim_id   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by     INT         NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_by     INT         NOT NULL DEFAULT 0;

-- ── 10C. Indexes on policy_claim_status_log ───────────────────
CREATE INDEX IF NOT EXISTS idx_pcsl_claim_id      ON policy_claim_status_log(claim_id);
CREATE INDEX IF NOT EXISTS idx_pcsl_new_status    ON policy_claim_status_log(new_status);
CREATE INDEX IF NOT EXISTS idx_pcsl_changed_at    ON policy_claim_status_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_pcsl_ref_claim_id  ON policy_claim_status_log(ref_claim_id)
  WHERE ref_claim_id IS NOT NULL;

COMMENT ON TABLE  policy_claim_status_log                   IS 'Full audit trail of claim status transitions';
COMMENT ON COLUMN policy_claim_status_log.claim_id          IS 'FK to policy_claim.id — nullable when written by generic sync before match';
COMMENT ON COLUMN policy_claim_status_log.ref_claim_id      IS 'TPA external claim reference ID — dedup key for generic sync';
COMMENT ON COLUMN policy_claim_status_log.source            IS 'UPLOAD=file upload, TPA_SYNC=generic scheduler, MANUAL=admin action';
COMMENT ON COLUMN policy_claim_status_log.source_ref_id     IS 'ID of the file_upload or sync_job that triggered this change';
COMMENT ON COLUMN policy_claim_status_log.settlement_amount IS 'Populated only when new_status indicates settlement';

-- ── 10D. policy_claim — add ref_claim_id for sync dedup ─────────────────────
-- ref_claim_id: TPA's own unique claim ID (their internal row/GUID).
-- Safe across TPAs: TPA-A and TPA-B can both have claim "12345" —
-- ref_claim_id keeps them distinct. tpa_claim_no alone is NOT safe as dedup.
ALTER TABLE policy_claim
  ADD COLUMN IF NOT EXISTS ref_claim_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_pc_ref_claim_id ON policy_claim(ref_claim_id)
  WHERE ref_claim_id IS NOT NULL;

COMMENT ON COLUMN policy_claim.ref_claim_id IS
  'TPA internal unique claim ID — dedup key for generic sync. Distinct per TPA. Use tpa_claim_no for display only.';

-- ── 10F. policy_claim_settlement — add ref_claim_id for sync dedup ──────────
-- ref_claim_id: TPA's external claim reference — used ONLY by generic sync
-- to dedup on re-runs (UPDATE if ref_claim_id exists, INSERT if not).
-- claim_id (FK to policy_claim) continues to be used for all app queries.
ALTER TABLE policy_claim_settlement
  ADD COLUMN IF NOT EXISTS ref_claim_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_pcs_ref_claim_id ON policy_claim_settlement(ref_claim_id)
  WHERE ref_claim_id IS NOT NULL;

COMMENT ON COLUMN policy_claim_settlement.ref_claim_id IS
  'TPA external claim reference — dedup key for generic sync only. Use claim_id for all app queries.';

-- ── 10G. tpa_claim_data — add generic-sync-compatible columns ─
-- Generic parser always writes updated_at + updated_by into every row.
-- created_at + created_by are written on INSERT. Without these columns
-- the parser's raw INSERT fails with "column does not exist".
ALTER TABLE tpa_claim_data
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by  INT         NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_by  INT         NOT NULL DEFAULT 0;

-- ── 10H. Verify ───────────────────────────────────────────────
SELECT
  t.table_name,
  COUNT(c.column_name) AS column_count
FROM information_schema.tables t
JOIN information_schema.columns c
  ON c.table_name = t.table_name AND c.table_schema = t.table_schema
WHERE t.table_schema = 'public'
  AND t.table_name IN ('policy_claim', 'policy_claim_status_log', 'policy_claim_settlement', 'tpa_claim_data')
GROUP BY t.table_name
ORDER BY t.table_name;

-- ── 11. Generic TPA Sync Scheduler — DB-driven cron configuration ──────────
-- Make the three GenericTpaSyncScheduler crons DB-driven (enable/disable + expression editable from admin UI).
-- Expressions stored in UTC. IST equivalents: Producer 10:30 PM, Worker 10:40 PM, Parser 10:50 PM.

INSERT INTO application_scheduler_configuration
  (scheduler_key, scheduler_name, scheduler_expression, is_enabled, is_editable, last_run_status, description, created_by)
SELECT * FROM (VALUES
  ('GENERIC_TPA_SYNC_PRODUCER', 'TPA Sync – Producer', '0 17 * * *',   true, true, 'idle', 'Scans active SYNC-type TPA configs, checks per-config cron schedule, enqueues PENDING sync_job rows for due configs.', 0),
  ('GENERIC_TPA_SYNC_WORKER',   'TPA Sync – Worker',   '10 17 * * *',  true, true, 'idle', 'Picks PENDING sync_job rows (batch 10), calls TPA API via document-service, stores raw response in raw_sync_response.', 0),
  ('GENERIC_TPA_SYNC_PARSER',   'TPA Sync – Parser',   '20 17 * * *',  true, true, 'idle', 'Picks RECEIVED raw_sync_response rows (batch 20), applies DB_COLUMN response mappings, upserts into target tables.', 0)
) AS v(scheduler_key, scheduler_name, scheduler_expression, is_enabled, is_editable, last_run_status, description, created_by)
WHERE NOT EXISTS (
  SELECT 1 FROM application_scheduler_configuration asc2 WHERE asc2.scheduler_key = v.scheduler_key
);

-- ── 12. mstr_ext_application_ref — make optional URL/method columns nullable ──
-- verification_token_api_url and magic_url_api_url are not required for DIRECT/HEADER_CREDENTIALS auth types.
-- Sending null from the UI was hitting NOT NULL constraint. Drop the constraint at DB level.

ALTER TABLE mstr_ext_application_ref
  ALTER COLUMN verification_token_api_url   DROP NOT NULL,
  ALTER COLUMN verification_token_api_method DROP NOT NULL,
  ALTER COLUMN magic_url_api_url            DROP NOT NULL,
  ALTER COLUMN magic_url_api_method         DROP NOT NULL;

-- ── 13. mstr_ext_application_ref — configurable Authorization header prefix ──
-- The word placed before the token in the Authorization header (e.g. "Bearer",
-- "Token", "JWT") — some TPAs use a non-standard prefix instead of the
-- conventional "Bearer".
ALTER TABLE mstr_ext_application_ref
  ADD COLUMN IF NOT EXISTS token_header_prefix VARCHAR(20) DEFAULT 'Bearer';

-- ── 14. mstr_hospital_address — widen columns overflowing on real TPA data ──
-- landline_number seen up to 34 chars into phone_number varchar(20); email
-- seen up to 144 chars into email varchar(100). Paired with length changes
-- in mstr-hospital-address.entity.ts.
ALTER TABLE mstr_hospital_address ALTER COLUMN phone_number TYPE VARCHAR(50);
ALTER TABLE mstr_hospital_address ALTER COLUMN alternate_phone_number TYPE VARCHAR(50);
ALTER TABLE mstr_hospital_address ALTER COLUMN email TYPE VARCHAR(255);

-- ── 15. policy — TPA-specific insurer name for PER_POLICY generic sync ──────
-- A TPA's own naming for an insurer can differ from insurer.name (e.g.
-- "The Oriental Insurance Co. Ltd." vs "THE ORIENTAL INSURANCE COMPANY
-- LIMITED"). Used as the {{insurerName}} dynamic param for PER_POLICY
-- generic TPA sync jobs (e.g. hospital network calls scoped by insurer).
ALTER TABLE policy ADD COLUMN IF NOT EXISTS external_insurer_name VARCHAR(200);
