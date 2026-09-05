


BEGIN;

-- ── 1. tpa_sso_config ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tpa_sso_config (
  id                        SERIAL PRIMARY KEY,
  tpa_id                    INT          NOT NULL,
  -- Base portal/redirect URL — constants can go straight in the string, e.g.
  -- 'https://host/path?BC=MAIN'. Each tpa_sso_field_mapping row is appended
  -- automatically as its own key=value pair.
  portal_url                TEXT         NOT NULL,
  sso_key_env_name          VARCHAR(100) NOT NULL,
  sso_iv_env_name           VARCHAR(100),
  sso_key_encoding          VARCHAR(20)  NOT NULL DEFAULT 'utf8',   -- utf8 | base64
  sso_padding               VARCHAR(20)  NOT NULL DEFAULT 'PKCS7',  -- PKCS7 | ISO10126
  sso_iv_mode               VARCHAR(20)  NOT NULL,                  -- FIXED | KEY_AS_IV | RANDOM_EMBEDDED
  sso_text_encoding         VARCHAR(20)  NOT NULL DEFAULT 'utf8',   -- utf8 | utf16le
  sso_token_shape           VARCHAR(20)  NOT NULL DEFAULT 'SEPARATE_FIELDS', -- SEPARATE_FIELDS | COMBINED_JSON
  sso_token_param_name      VARCHAR(100),                          -- only used when sso_token_shape = COMBINED_JSON
  sso_output_transform      JSONB,                                 -- e.g. {"+":"@"} — null = no transform
  sso_iv_envelope_separator VARCHAR(5)   NOT NULL DEFAULT ':',      -- only used when sso_iv_mode = RANDOM_EMBEDDED
  is_active                 BOOLEAN      NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by                INT,
  updated_by                INT,
  CONSTRAINT uq_tpa_sso_config_tpa_id UNIQUE (tpa_id),
  CONSTRAINT chk_sso_key_encoding CHECK (sso_key_encoding IN ('utf8', 'base64')),
  CONSTRAINT chk_sso_padding CHECK (sso_padding IN ('PKCS7', 'ISO10126')),
  CONSTRAINT chk_sso_iv_mode CHECK (sso_iv_mode IN ('FIXED', 'KEY_AS_IV', 'RANDOM_EMBEDDED')),
  CONSTRAINT chk_sso_text_encoding CHECK (sso_text_encoding IN ('utf8', 'utf16le')),
  CONSTRAINT chk_sso_token_shape CHECK (sso_token_shape IN ('SEPARATE_FIELDS', 'COMBINED_JSON')),
  CONSTRAINT chk_sso_iv_env_required CHECK (
    (sso_iv_mode = 'FIXED' AND sso_iv_env_name IS NOT NULL)
    OR (sso_iv_mode != 'FIXED')
  ),
  CONSTRAINT chk_sso_token_param_required CHECK (
    (sso_token_shape = 'COMBINED_JSON' AND sso_token_param_name IS NOT NULL)
    OR (sso_token_shape != 'COMBINED_JSON')
  )
);

CREATE INDEX IF NOT EXISTS idx_tpa_sso_config_active ON public.tpa_sso_config (tpa_id, is_active);

-- ── 2. tpa_sso_field_mapping ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tpa_sso_field_mapping (
  id                   SERIAL PRIMARY KEY,
  sso_config_id        INT          NOT NULL,
  external_field_name  VARCHAR(100) NOT NULL,  -- outbound param/JSON-key name, e.g. "EncryptedPartnerId", "GC"
  source_type          VARCHAR(20)  NOT NULL,  -- STATIC | POLICY | EMPLOYEE
  source_field         VARCHAR(100),           -- e.g. "externalTpaPolicyId", "companyEmployeeId"
  static_value         VARCHAR(255),           -- literal value when source_type = STATIC, e.g. "MAIN"
  display_order        INT          NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_sso_field_source_value CHECK (
    (source_type = 'STATIC' AND static_value IS NOT NULL)
    OR (source_type != 'STATIC' AND source_field IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_tpa_sso_field_mapping_config_id
  ON public.tpa_sso_field_mapping (sso_config_id);

COMMIT;





ALTER TABLE public.tpa_sso_config
    ALTER COLUMN sso_key_env_name TYPE VARCHAR(255),
    ALTER COLUMN sso_iv_env_name TYPE VARCHAR(255),
    ALTER COLUMN sso_key_encoding TYPE VARCHAR(255),
    ALTER COLUMN sso_padding TYPE VARCHAR(255),
    ALTER COLUMN sso_iv_mode TYPE VARCHAR(255),
    ALTER COLUMN sso_text_encoding TYPE VARCHAR(255),
    ALTER COLUMN sso_token_shape TYPE VARCHAR(255),
    ALTER COLUMN sso_token_param_name TYPE VARCHAR(255),
    ALTER COLUMN sso_iv_envelope_separator TYPE VARCHAR(255);

ALTER TABLE public.tpa_sso_field_mapping
    ALTER COLUMN external_field_name TYPE VARCHAR(255),
    ALTER COLUMN source_type TYPE VARCHAR(255),
    ALTER COLUMN source_field TYPE VARCHAR(255);

-- ============================================================
-- REMOTE_API_REDIRECT support (Vidal's real sso-v2 API): instead of building
-- the redirect URL locally, we encrypt the payload, POST it to the TPA's own
-- SSO API, decrypt what they send back, and pull the redirect URL out of
-- that response. Everything above (key/IV/padding/encoding config) is reused
-- as-is for the outbound encryption — these columns only cover the extra
-- API-call and response-decryption steps.
--
-- As with the rest of this file: no secrets stored here either. Both
-- remote_api_headers (via {{env:KEY}} placeholders) and
-- remote_response_decrypt_key_env_name store only env var NAMES.
-- ============================================================

ALTER TABLE public.tpa_sso_config
    ADD COLUMN IF NOT EXISTS sso_delivery_mode                 VARCHAR(30)  NOT NULL DEFAULT 'LOCAL_REDIRECT', -- LOCAL_REDIRECT | REMOTE_API_REDIRECT
    ADD COLUMN IF NOT EXISTS remote_api_url                     TEXT,         -- TPA's own SSO API endpoint
    ADD COLUMN IF NOT EXISTS remote_api_method                  VARCHAR(10)  NOT NULL DEFAULT 'POST',
    ADD COLUMN IF NOT EXISTS remote_api_headers                 JSONB,        -- e.g. {"Ocp-Apim-Subscription-Key": "{{env:VIDAL_API_KEY}}"}
    ADD COLUMN IF NOT EXISTS remote_request_payload_key         VARCHAR(100) NOT NULL DEFAULT 'payload',
    ADD COLUMN IF NOT EXISTS remote_request_extra_fields         JSONB,        -- e.g. {"source": "IWORK", "subPartnerId": "..."}
    ADD COLUMN IF NOT EXISTS remote_response_data_path           VARCHAR(100) NOT NULL DEFAULT 'data',
    ADD COLUMN IF NOT EXISTS remote_response_decrypt_key_env_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS remote_response_redirect_url_path   VARCHAR(100) NOT NULL DEFAULT 'redirectUrl';

ALTER TABLE public.tpa_sso_config
    DROP CONSTRAINT IF EXISTS chk_sso_delivery_mode;
ALTER TABLE public.tpa_sso_config
    ADD CONSTRAINT chk_sso_delivery_mode CHECK (sso_delivery_mode IN ('LOCAL_REDIRECT', 'REMOTE_API_REDIRECT'));

ALTER TABLE public.tpa_sso_config
    DROP CONSTRAINT IF EXISTS chk_remote_api_fields_required;
ALTER TABLE public.tpa_sso_config
    ADD CONSTRAINT chk_remote_api_fields_required CHECK (
        (sso_delivery_mode = 'REMOTE_API_REDIRECT'
            AND remote_api_url IS NOT NULL
            AND remote_response_decrypt_key_env_name IS NOT NULL)
        OR (sso_delivery_mode != 'REMOTE_API_REDIRECT')
    );


-- ============================================================
-- sso_url_encode: when false, encrypted field values are appended to the
-- redirect URL as RAW base64 (+, /, =), exactly as the TPA's own kit builds
-- the link, instead of being percent-encoded. Default true keeps the existing
-- behavior for every current TPA (GHPL/FHPL/Vidal). Set false only for a TPA
-- whose SSO page reads the raw query string WITHOUT URL-decoding
-- (HealthIndia HISSO.aspx), where %2F/%3D would corrupt the token.
-- ============================================================
ALTER TABLE public.tpa_sso_config
    ADD COLUMN IF NOT EXISTS sso_url_encode BOOLEAN NOT NULL DEFAULT true;
