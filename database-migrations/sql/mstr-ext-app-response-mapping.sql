-- TPA External Integration: Response Mapping Table
-- Stores per-field mappings from TPA API responses to our system (placeholders, standard keys, DB columns)
-- Replaces the single step1ResponseTokenKey / step2ResponseDataKey fields on mstr_ext_application_ref

CREATE TABLE IF NOT EXISTS mstr_ext_app_response_mapping (
  id                SERIAL PRIMARY KEY,
  app_ref_id        INTEGER NOT NULL REFERENCES mstr_ext_application_ref(id) ON DELETE CASCADE,
  step              INTEGER NOT NULL CHECK (step IN (1, 2)),
  response_key      VARCHAR(200) NOT NULL,
  -- dot-notation path into TPA JSON response, e.g. "access_token", "response.data.ecard_url", "members.0.id"
  target_type       VARCHAR(20)  NOT NULL CHECK (target_type IN ('PLACEHOLDER', 'STANDARD_KEY', 'DB_COLUMN')),
  -- PLACEHOLDER  → output_key is a placeholder name, value becomes {{name}} in step 2 payload
  -- STANDARD_KEY → output_key is a standard key (REDIRECT_URL, MEMBER_ID, etc.) read by IBP
  -- DB_COLUMN    → output_key is a DB column name in target_table, written by sync scheduler
  output_key        VARCHAR(100) NOT NULL,
  target_table      VARCHAR(100),            -- only for DB_COLUMN: which table to write to
  is_auth_token     BOOLEAN NOT NULL DEFAULT FALSE,
  is_primary_fk     BOOLEAN NOT NULL DEFAULT FALSE,
  -- DB_COLUMN secondary table only: inject PK from primary table insert instead of mapping a response field
  -- step=1 only: marks which PLACEHOLDER field's value is sent as Bearer header to step 2
  transform         JSONB,
  -- optional transformation, e.g.:
  --   {"type":"DATE_FORMAT","from":"DD/MM/YYYY","to":"YYYY-MM-DD"}
  --   {"type":"SPLIT","delimiter":"|","output":"ARRAY"}
  --   {"type":"NUMBER_PARSE"}
  display_order     INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mstr_ext_app_response_mapping_app_ref
  ON mstr_ext_app_response_mapping (app_ref_id, step, display_order);

COMMENT ON TABLE mstr_ext_app_response_mapping IS
  'Per-field response mappings for TPA external API integrations. '
  'Covers both Step 1 (auth) and Step 2 (data) responses. '
  'Replaces single-key step1ResponseTokenKey / step2ResponseDataKey fields.';

-- New columns on mstr_ext_application_ref for flow type + SYNC scheduler config

ALTER TABLE mstr_ext_application_ref
  ADD COLUMN IF NOT EXISTS flow_type         VARCHAR(20) NOT NULL DEFAULT 'REDIRECT',
  -- REDIRECT: step 2 returns a URL → IBP opens it
  -- DISPLAY:  step 2 returns data → IBP shows it
  -- SYNC:     step 2 returns data → scheduler writes it to DB tables
  ADD COLUMN IF NOT EXISTS sync_target_table VARCHAR(100),
  -- SYNC only: primary DB table to write to, e.g. "mstr_hospital"
  ADD COLUMN IF NOT EXISTS sync_dedup_column VARCHAR(100),
  -- SYNC only: column used for ON CONFLICT upsert, e.g. "external_hospital_id"
  ADD COLUMN IF NOT EXISTS sync_scope        VARCHAR(20),
  -- SYNC only: PER_POLICY | PER_TPA | GLOBAL
  ADD COLUMN IF NOT EXISTS sync_schedule     VARCHAR(50),
  -- SYNC only: cron expression, e.g. "30 13 * * *"
  ADD COLUMN IF NOT EXISTS sync_ttl_hours    INTEGER DEFAULT 24,
  -- SYNC only: skip sync if last run was within N hours
  ADD COLUMN IF NOT EXISTS basic_auth_user     VARCHAR(200),
  -- BASIC_AUTH only: username stored in DB (not env vars)
  ADD COLUMN IF NOT EXISTS basic_auth_password VARCHAR(500);
  -- BASIC_AUTH only: password stored in DB (not env vars)

COMMENT ON COLUMN mstr_ext_application_ref.flow_type IS 'REDIRECT | DISPLAY | SYNC';
COMMENT ON COLUMN mstr_ext_application_ref.sync_scope IS 'PER_POLICY | PER_TPA | GLOBAL';
COMMENT ON COLUMN mstr_ext_application_ref.basic_auth_user IS 'BASIC_AUTH: username for Basic Auth header';
COMMENT ON COLUMN mstr_ext_application_ref.basic_auth_password IS 'BASIC_AUTH: password for Basic Auth header';

-- Add is_primary_fk if table already existed before this column was added
ALTER TABLE mstr_ext_app_response_mapping
  ADD COLUMN IF NOT EXISTS is_primary_fk BOOLEAN NOT NULL DEFAULT FALSE;

-- Custom request headers support for each step
ALTER TABLE mstr_ext_application_ref
  ADD COLUMN IF NOT EXISTS verification_token_api_headers JSONB,
  ADD COLUMN IF NOT EXISTS magic_url_api_headers           JSONB;

-- Extended auth type support (MediAssist HEADER_CREDENTIALS, Paramount SESSION_BODY, Vidal BASIC_AUTH)
ALTER TABLE mstr_ext_application_ref
  ADD COLUMN IF NOT EXISTS token_placement    VARCHAR(20) DEFAULT 'BEARER_HEADER',
  -- How to pass the step1 token to step2: BEARER_HEADER | BODY | QUERY_PARAM
  ADD COLUMN IF NOT EXISTS step2_header_template JSONB,
  -- Static/dynamic headers sent on the step2 (data) call — supports {{placeholders}}
  ADD COLUMN IF NOT EXISTS token_body_key    VARCHAR(100),
  -- SESSION_BODY only: key under which to inject the token in step2 request body
  ADD COLUMN IF NOT EXISTS step2_content_type VARCHAR(50);
  -- Override Content-Type for step2 call (default JSON; use 'application/x-www-form-urlencoded' for FHPL)

COMMENT ON COLUMN mstr_ext_application_ref.token_placement    IS 'BEARER_HEADER | BODY | QUERY_PARAM — how step1 token reaches step2';
COMMENT ON COLUMN mstr_ext_application_ref.step2_header_template IS 'Static/dynamic headers for step2; supports {{placeholder}} templates';
COMMENT ON COLUMN mstr_ext_application_ref.token_body_key     IS 'SESSION_BODY: body key for injecting step1 token into step2 payload';
COMMENT ON COLUMN mstr_ext_application_ref.step2_content_type IS 'Content-Type override for step2 data API call';
