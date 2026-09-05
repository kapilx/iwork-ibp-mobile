-- Shared Step 1 Auth: an app ref can delegate its Step 1 auth to another app ref.
-- When set, document-service uses the linked app ref's Step 1 config + shares its token cache.
-- NULL = this app ref owns its own Step 1 (existing behavior unchanged).

ALTER TABLE mstr_ext_application_ref
  ADD COLUMN IF NOT EXISTS auth_app_ref_id INT REFERENCES mstr_ext_application_ref(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mstr_ext_app_ref_auth_app_ref_id ON mstr_ext_application_ref(auth_app_ref_id);

COMMENT ON COLUMN mstr_ext_application_ref.auth_app_ref_id IS
  'Points to another app ref whose Step 1 auth config this ref reuses. NULL = owns its own Step 1.';
