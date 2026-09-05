-- Migration: Add step1 custom headers, payload format, and basic auth env-ref columns
-- Date: 2026-07-20
-- Purpose: Support dynamic headers, form-encoded body, and env-referenced credentials
--          for any TPA external API integration (FHPL and future TPAs)
--
-- Sensitive credentials (basic_auth_user, basic_auth_password, header values) are NEVER
-- stored as plain text. Store the pattern {{env:KEY_NAME}} in DB; actual value lives in .env

BEGIN;

ALTER TABLE mstr_ext_application_ref
  ADD COLUMN IF NOT EXISTS verification_token_api_headers JSONB,
  ADD COLUMN IF NOT EXISTS payload_format                 VARCHAR(20) DEFAULT 'JSON',
  ADD COLUMN IF NOT EXISTS basic_auth_user                VARCHAR(200),
  ADD COLUMN IF NOT EXISTS basic_auth_password            VARCHAR(200);

COMMENT ON COLUMN mstr_ext_application_ref.verification_token_api_headers
  IS 'Custom headers for step1 auth call. Values support {{env:KEY}} for secrets. e.g. {"Username":"{{env:FHPL_USERNAME}}","Password":"{{env:FHPL_PASSWORD}}"}';

COMMENT ON COLUMN mstr_ext_application_ref.payload_format
  IS 'Body format for step1 auth call: JSON (default) or FORM (application/x-www-form-urlencoded)';

COMMENT ON COLUMN mstr_ext_application_ref.basic_auth_user
  IS 'Basic auth username. Use {{env:KEY}} pattern — never store plain text credentials.';

COMMENT ON COLUMN mstr_ext_application_ref.basic_auth_password
  IS 'Basic auth password. Use {{env:KEY}} pattern — never store plain text credentials.';

-- Verify
SELECT column_name, data_type, column_default
  FROM information_schema.columns
 WHERE table_name = 'mstr_ext_application_ref'
   AND column_name IN (
     'verification_token_api_headers',
     'payload_format',
     'basic_auth_user',
     'basic_auth_password'
   )
 ORDER BY column_name;

COMMIT;
