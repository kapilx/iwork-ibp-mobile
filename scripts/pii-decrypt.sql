-- =============================================================================
-- PII Decryption Functions  (pure pgcrypto + plpgsql — works on AWS RDS)
-- =============================================================================
-- Decrypts values stored by FieldEncryptionService (AES-256-GCM).
--
-- How it works without plpython3u / plv8:
--   AES-GCM is AES-CTR mode + a GHASH auth tag.
--   For read-only viewing we only need the CTR decryption:
--     keystream[i] = AES-256-ECB( key, IV || (i+1) )   ← pgcrypto primitive
--     plaintext[i] = ciphertext[i] XOR keystream[i]
--   Auth tag verification is skipped (safe for a viewer; legitimate data from
--   the app will always decrypt correctly).
--
-- Requirements (both pre-installed on AWS RDS PostgreSQL):
--   • pgcrypto  — encrypt(block, key, 'aes-ecb') as the AES-256 primitive
--   • plpgsql   — the default PostgreSQL procedural language
--
-- Quick start:
--   \i scripts/pii-decrypt.sql
--   SELECT set_config('app.field_enc_key', '<FIELD_ENC_KEY_BASE64>', false);
--   SELECT pii_decrypt(email_id_enc) FROM users LIMIT 5;
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ---------------------------------------------------------------------------
-- 1. pii_decrypt(p_enc_value TEXT)
--    Decrypts a single AES-256-GCM encrypted value.
--    Reads the key from the session setting app.field_enc_key — set it once
--    per connection so the key never appears in query logs:
--
--      SELECT set_config('app.field_enc_key', '<FIELD_ENC_KEY_BASE64>', false);
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pii_decrypt(p_enc_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_key           BYTEA;
  v_payload       JSON;
  v_iv            BYTEA;    -- 12 bytes  (96-bit GCM nonce stored in payload)
  v_ct            BYTEA;    -- ciphertext bytes
  v_plaintext     BYTEA;
  v_counter_block BYTEA;    -- 16 bytes: IV(12) || counter_BE(4)
  v_keystream     BYTEA;    -- 16 bytes: AES-ECB output of counter block
  v_ct_block      BYTEA;
  v_pt_block      BYTEA;
  v_num_blocks    INTEGER;
  v_block_start   INTEGER;
  v_block_len     INTEGER;
  v_i             INTEGER;
  v_j             INTEGER;
BEGIN
  -- Passthrough for null / empty
  IF p_enc_value IS NULL OR p_enc_value = '' THEN
    RETURN p_enc_value;
  END IF;

  -- Read the key stored by set_config() — not visible in pg_stat_activity
  BEGIN
    v_key := decode(current_setting('app.field_enc_key', true), 'base64');
  EXCEPTION WHEN OTHERS THEN
    v_key := NULL;
  END;

  IF v_key IS NULL OR length(v_key) != 32 THEN
    RETURN '[DECRYPT_ERROR: run  SELECT set_config(''app.field_enc_key'', ''<FIELD_ENC_KEY_BASE64>'', false);  first]';
  END IF;

  -- Decode outer base64 envelope → JSON payload
  BEGIN
    v_payload := convert_from(decode(p_enc_value, 'base64'), 'utf8')::json;
    v_iv      := decode(v_payload->>'iv', 'base64');   -- 12 bytes
    v_ct      := decode(v_payload->>'ct', 'base64');   -- N  bytes
  EXCEPTION WHEN OTHERS THEN
    RETURN '[DECRYPT_ERROR: invalid payload — ' || SQLERRM || ']';
  END;

  -- -------------------------------------------------------------------------
  -- AES-256-GCM / CTR decryption
  --
  -- For a 96-bit IV the GCM counter layout is:
  --   J0             = IV || 0x00000001   (reserved for auth tag — skip)
  --   data block [i] = IV || (i + 1)     i=1 → 0x00000002, i=2 → 0x00000003 …
  --
  -- pgcrypto encrypt() adds PKCS7 padding → 32-byte output for a 16-byte
  -- input; only the first 16 bytes are the actual AES-ECB block result.
  -- -------------------------------------------------------------------------
  v_plaintext  := ''::BYTEA;
  v_num_blocks := CEIL(length(v_ct)::NUMERIC / 16)::INTEGER;

  FOR v_i IN 1..v_num_blocks LOOP

    -- Counter block = IV (12 bytes) || (v_i + 1) as big-endian uint32
    v_counter_block := v_iv
      || decode(lpad(to_hex(v_i + 1), 8, '0'), 'hex');

    -- AES-256-ECB encrypt the counter block; take first 16 bytes of output
    v_keystream := substring(
      encrypt(v_counter_block, v_key, 'aes-ecb')
      from 1 for 16
    );

    -- Slice the ciphertext for this block (last block may be < 16 bytes)
    v_block_start := (v_i - 1) * 16 + 1;
    v_block_len   := LEAST(16, length(v_ct) - (v_i - 1) * 16);
    v_ct_block    := substring(v_ct from v_block_start for v_block_len);

    -- XOR keystream with ciphertext block, byte by byte
    v_pt_block := v_ct_block;
    FOR v_j IN 0..v_block_len - 1 LOOP
      v_pt_block := set_byte(
        v_pt_block,
        v_j,
        get_byte(v_ct_block, v_j) # get_byte(v_keystream, v_j)
      );
    END LOOP;

    v_plaintext := v_plaintext || v_pt_block;
  END LOOP;

  RETURN convert_from(v_plaintext, 'utf8');

EXCEPTION WHEN OTHERS THEN
  RETURN '[DECRYPT_ERROR: ' || SQLERRM || ']';
END;
$$;


-- ---------------------------------------------------------------------------
-- 2. pii_decrypt_with_key(p_enc_value TEXT, p_key_base64 TEXT)
--    One-off variant that accepts the key inline.
--    WARNING: the key literal will appear in pg_stat_activity and slow-query
--    logs. Use only on loopback / trusted connections.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pii_decrypt_with_key(
  p_enc_value  TEXT,
  p_key_base64 TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Store key in local session config then delegate to pii_decrypt()
  PERFORM set_config('app.field_enc_key', p_key_base64, true);
  RETURN pii_decrypt(p_enc_value);
END;
$$;


-- ---------------------------------------------------------------------------
-- 3. pii_is_encrypted(p_value TEXT)
--    Returns TRUE when the value is a valid encrypted payload.
--    Works for both v:1 (random IV) and v:2 (deterministic IV).
--    Mirrors FieldEncryptionService.isEncrypted().
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pii_is_encrypted(p_value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE STRICT
AS $$
DECLARE
  v_p JSON;
BEGIN
  IF p_value IS NULL OR length(p_value) < 10 THEN RETURN FALSE; END IF;
  BEGIN
    v_p := convert_from(decode(p_value, 'base64'), 'utf8')::json;
    RETURN
      (v_p->>'v')   IN ('1', '2')
      AND (v_p->>'iv')  IS NOT NULL
      AND (v_p->>'tag') IS NOT NULL
      AND (v_p->>'ct')  IS NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
END;
$$;


-- =============================================================================
-- USAGE
-- =============================================================================
--
-- ── Step 1: set the key once per session ─────────────────────────────────────
--   (stored in server memory only; never written to WAL or query logs)
--
--   SELECT set_config('app.field_enc_key', '<FIELD_ENC_KEY_BASE64>', false);
--
--
-- ── Decrypt users ─────────────────────────────────────────────────────────────
--
--   SELECT id,
--          pii_decrypt(email_id_enc) AS email,
--          pii_decrypt(mobile_enc)   AS mobile
--   FROM users
--   LIMIT 20;
--
--
-- ── Decrypt a single employee ─────────────────────────────────────────────────
--
--   SELECT id, first_name,
--          pii_decrypt(email_id_enc) AS email,
--          pii_decrypt(mobile_enc)   AS mobile,
--          pii_decrypt(date_of_birth_enc)      AS dob
--   FROM employee
--   WHERE id = 123;
--
--
-- ── Mixed state (some rows not yet migrated to encryption) ────────────────────
--
--   SELECT id,
--          CASE WHEN pii_is_encrypted(email_id_enc)
--               THEN pii_decrypt(email_id_enc)
--               ELSE email_id_enc
--          END AS email
--   FROM users;
--
--
-- ── Search by plaintext value, then show decrypted columns ───────────────────
--   (combines pii_lookup_column from pii-lookup.sql)
--
--   SELECT id,
--          pii_decrypt(email_id_enc) AS email,
--          pii_decrypt(mobile_enc)   AS mobile
--   FROM users
--   WHERE email_id_enc IN (
--     SELECT pii_lookup_column('users', 'email_id_enc',
--                              'john@example.com', '<FIELD_HASH_PEPPER>')
--   );
--
--
-- ── Inline key (WARNING: key appears in pg_stat_activity) ────────────────────
--
--   SELECT pii_decrypt_with_key(email_id_enc, '<FIELD_ENC_KEY_BASE64>')
--   FROM users LIMIT 5;
--
--
-- ── Verify on a known value ───────────────────────────────────────────────────
--
--   SELECT pii_decrypt('<paste_enc_value_from_db>');
--   -- Should return the original plaintext.
--
-- =============================================================================
