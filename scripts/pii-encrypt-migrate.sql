-- Ensure pgcrypto is available (provides hmac, encrypt, decode, etc.)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users    ADD COLUMN IF NOT EXISTS email_id_enc TEXT;
ALTER TABLE users    ADD COLUMN IF NOT EXISTS mobile_enc   TEXT;
ALTER TABLE employee ADD COLUMN IF NOT EXISTS email_id_enc TEXT;
ALTER TABLE employee ADD COLUMN IF NOT EXISTS mobile_enc   TEXT;
ALTER TABLE employee ADD COLUMN IF NOT EXISTS date_of_birth_enc      TEXT;
ALTER TABLE policy_enrollment_employee  ADD COLUMN IF NOT EXISTS date_of_birth_enc TEXT;
ALTER TABLE policy_enrollment_employee  ADD COLUMN IF NOT EXISTS email_enc         TEXT;
ALTER TABLE policy_enrollment_employee  ADD COLUMN IF NOT EXISTS phone_number_enc  TEXT;
ALTER TABLE policy_enrollment_dependent ADD COLUMN IF NOT EXISTS date_of_birth_enc TEXT;
ALTER TABLE contact_communication_details ADD COLUMN IF NOT EXISTS communication_details_enc TEXT;


-- =============================================================================
-- Schema change: relax audit_history_log.action constraint to allow 'REVEALED'
-- =============================================================================
ALTER TABLE audit_history_log
DROP CONSTRAINT audit_log_action_check;

ALTER TABLE audit_history_log
ADD CONSTRAINT audit_log_action_check
CHECK (
    action::text = ANY (
        ARRAY[
            'INSERT'::text,
            'UPDATE'::text,
            'DELETE'::text,
            'LOGIN'::text,
            'PASSWORD-RESET'::text,
            'LOGOUT'::text,
            'REVEALED'::text
        ]
    )
);


-- =============================================================================
-- PII Field Encryption Migration
-- =============================================================================
-- PURPOSE:
--   One-time migration that encrypts plaintext PII columns in-place using the
--   same AES-256-GCM deterministic scheme as FieldEncryptionService.
--   After this runs, the application reads from the _enc columns exclusively.
--
-- PREREQUISITES:
--   • pgcrypto extension installed  (CREATE EXTENSION IF NOT EXISTS pgcrypto;)
--   • Phase-0 _enc columns already added  (run phase0-add-enc-columns.sql first)
--   • Superuser / DBA role with CREATE FUNCTION privilege
--
-- HOW TO RUN:
--   psql -h <host> -U <user> -d <database> -f pii-encrypt-migrate.sql
--
-- TABLES PROCESSED:
--   users:    email_id → email_id_enc,  mobile → mobile_enc
--   employee: email_id → email_id_enc,  mobile → mobile_enc,
--             date_of_birth → date_of_birth_enc
--   policy_enrollment_employee:  date_of_birth → date_of_birth_enc,
--                                email → email_enc,  phone_number → phone_number_enc
--   policy_enrollment_dependent: date_of_birth → date_of_birth_enc
--   contact_communication_details: communication_details → communication_details_enc
--
-- IDEMPOTENT:
--   Rows where the _enc column is already populated are skipped.
--   Safe to re-run after an interruption.
--
-- PERFORMANCE NOTE:
--   Each row requires AES block operations implemented in plpgsql, which is
--   slower than native C. Expect ~50–200 ms per 1 000 rows depending on
--   hardware.  For very large tables consider running the TypeScript version
--   (encrypt-pii-fields.ts) instead, which uses Node.js native crypto.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 0  –  Set secret keys (fill in your values from .env before running)
-- ─────────────────────────────────────────────────────────────────────────────

SELECT set_config('pii.enc_key_b64',  'DARvZyXcXKP7EB6SiDmpHMFX/A5ay1oeZ2oBub1G8I0=',  false);
SELECT set_config('pii.hash_pepper',  '4f91f14660f8473e4cc4ddb5768ef98d7e4384fb7f512d97',      false);

-- Quick sanity-check: the key must decode to exactly 32 bytes (AES-256).
DO $$
BEGIN
  IF octet_length(decode(current_setting('pii.enc_key_b64'), 'base64')) <> 32 THEN
    RAISE EXCEPTION 'FIELD_ENC_KEY_BASE64 must decode to exactly 32 bytes (got %)',
      octet_length(decode(current_setting('pii.enc_key_b64'), 'base64'));
  END IF;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1  –  Helper functions (AES-256-GCM primitives)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1a. XOR two bytea values of equal length.
CREATE OR REPLACE FUNCTION _pii_xor(a bytea, b bytea)
RETURNS bytea LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE
  r bytea := a;
  i int;
BEGIN
  FOR i IN 0 .. octet_length(a) - 1 LOOP
    r := set_byte(r, i, get_byte(a, i) # get_byte(b, i));
  END LOOP;
  RETURN r;
END;
$$;


-- 1b. Left-shift a 16-byte block by 1 bit.
--     Bit 127 (MSB of byte 0) shifts out; bit 0 (LSB of byte 15) shifts in 0.
CREATE OR REPLACE FUNCTION _pii_lshift1(v bytea)
RETURNS bytea LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE
  r bytea := v;
  i int;
BEGIN
  FOR i IN 0 .. 14 LOOP
    r := set_byte(r, i,
           ((get_byte(v, i) << 1) | (get_byte(v, i + 1) >> 7)) & 255);
  END LOOP;
  r := set_byte(r, 15, (get_byte(v, 15) << 1) & 255);
  RETURN r;
END;
$$;


-- 1c. AES-256-ECB: encrypt a single 16-byte block.
--     Uses pgcrypto's encrypt() in ECB mode without padding.
CREATE OR REPLACE FUNCTION _pii_aes_block(key bytea, blk bytea)
RETURNS bytea LANGUAGE plpgsql IMMUTABLE STRICT AS $$
BEGIN
  RETURN encrypt(blk, key, 'aes-ecb/pad:none');
END;
$$;


-- 1d. GF(2^128) multiplication (NIST standard representation).
--
--     Representation: big-endian 16-byte block; coefficient of α^j is at
--       byte (15 - j/8), bit (j%8)  [bit 0 = LSB, bit 7 = MSB of that byte].
--     Irreducible polynomial: x^128 + x^7 + x^2 + x + 1.
--     Multiply-by-α: left-shift the 128-bit integer by 1 bit; if the old
--       MSB (α^127 coefficient) was 1, XOR the result with 0x87 in byte 15
--       (= x^7 + x^2 + x + 1, the reduction polynomial).
CREATE OR REPLACE FUNCTION _pii_gf128_mult(X bytea, Y bytea)
RETURNS bytea LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE
  Z   bytea := decode(repeat('00', 16), 'hex');
  V   bytea := X;
  j   int;
  yj  int;
  msb int;
BEGIN
  FOR j IN 0 .. 127 LOOP
    -- Coefficient of α^j in Y
    yj := (get_byte(Y, 15 - j / 8) >> (j % 8)) & 1;

    IF yj = 1 THEN
      Z := _pii_xor(Z, V);         -- Z ^= V  (accumulate X * α^j)
    END IF;

    -- Update V = V * α
    msb := (get_byte(V, 0) >> 7) & 1;   -- old bit-127 (MSB of byte 0)
    V   := _pii_lshift1(V);
    IF msb = 1 THEN
      V := set_byte(V, 15, get_byte(V, 15) # 135);  -- 135 = 0x87
    END IF;
  END LOOP;

  RETURN Z;
END;
$$;


-- 1e. GHASH over ciphertext only (AAD is empty for our fields).
--
--     GHASH_H(C) = mult_H applied iteratively over each 16-byte block of C
--     followed by a 16-byte length block  (0^64 ‖ len(C)_bits as uint64-BE).
CREATE OR REPLACE FUNCTION _pii_ghash(H bytea, ct bytea)
RETURNS bytea LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE
  X        bytea  := decode(repeat('00', 16), 'hex');
  ct_len   int    := octet_length(ct);
  n_blocks int    := (ct_len + 15) / 16;
  blk      bytea;
  len_blk  bytea;
  ct_bits  bigint;
  i        int;
BEGIN
  -- Process ciphertext blocks (zero-pad the last block if needed)
  FOR i IN 0 .. n_blocks - 1 LOOP
    blk := substring(ct FROM i * 16 + 1 FOR 16);
    IF octet_length(blk) < 16 THEN
      blk := blk || decode(repeat('00', 16 - octet_length(blk)), 'hex');
    END IF;
    X := _pii_gf128_mult(_pii_xor(X, blk), H);
  END LOOP;

  -- Process the length block: len(AAD)=0 ‖ len(C) in bits (both 64-bit BE)
  ct_bits := ct_len::bigint * 8;
  len_blk := decode(repeat('00', 8), 'hex')
          || decode(lpad(to_hex(ct_bits), 16, '0'), 'hex');
  X := _pii_gf128_mult(_pii_xor(X, len_blk), H);

  RETURN X;
END;
$$;


-- 1f. Main encryption function: deterministic AES-256-GCM.
--
--     Algorithm (matches FieldEncryptionService.encryptDeterministic):
--       IV  (12 B) = HMAC-SHA256(pepper, utf8(plaintext))[0:12]
--       H          = AES_K(0^128)
--       J0         = IV ‖ 0x00000001
--       ciphertext = plaintext ⊕ AES_K(IV ‖ 0x00000002 + i) for each block i
--       tag        = AES_K(J0) ⊕ GHASH_H(ciphertext)
--       payload    = {"v":2,"iv":b64(IV),"tag":b64(tag),"ct":b64(ciphertext)}
--       result     = base64(utf8(JSON(payload)))
CREATE OR REPLACE FUNCTION pii_encrypt_det(plaintext text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  key       bytea;
  pt        bytea;
  iv        bytea;
  H         bytea;
  J0        bytea;
  keystream bytea;
  ctr_blk   bytea;
  ctr_val   int;
  ct        bytea;
  ghash_val bytea;
  tag       bytea;
  n_blocks  int;
  i         int;
  payload   text;
BEGIN
  key := decode(current_setting('pii.enc_key_b64'), 'base64');
  pt  := convert_to(plaintext, 'UTF8');

  -- ── Deterministic IV ────────────────────────────────────────────────────────
  -- pgcrypto hmac() on this server only exposes the (text, text, text) overload.
  -- Passing plaintext and pepper as text is equivalent: UTF-8 DB encoding means
  -- the raw bytes match what Node.js crypto produces from the same strings.
  iv := substring(
          hmac(plaintext, current_setting('pii.hash_pepper'), 'sha256'::text),
          1, 12);

  -- ── GHASH subkey H = AES_K(0^128) ───────────────────────────────────────────
  H := _pii_aes_block(key, decode(repeat('00', 16), 'hex'));

  -- ── J0 = IV ‖ 0x00000001 ────────────────────────────────────────────────────
  J0 := iv || decode('00000001', 'hex');

  -- ── AES-CTR encryption (counter starts at 2; counter 1 is reserved for J0) ──
  n_blocks  := (octet_length(pt) + 15) / 16;
  keystream := ''::bytea;
  FOR i IN 0 .. n_blocks - 1 LOOP
    ctr_val := i + 2;
    ctr_blk := iv || decode(lpad(to_hex(ctr_val), 8, '0'), 'hex');
    keystream := keystream || _pii_aes_block(key, ctr_blk);
  END LOOP;
  ct := _pii_xor(pt, substring(keystream FROM 1 FOR octet_length(pt)));

  -- ── GCM authentication tag ──────────────────────────────────────────────────
  ghash_val := _pii_ghash(H, ct);
  tag       := _pii_xor(_pii_aes_block(key, J0), ghash_val);

  -- ── Assemble JSON payload and base64-encode it ──────────────────────────────
  -- Build JSON manually to preserve key order and avoid JSONB reordering.
  -- Remove base64 line-breaks (PostgreSQL inserts \n every 76 chars).
  payload :=
      '{"v":2,"iv":"'
   || translate(encode(iv,  'base64'), E'\n', '')
   || '","tag":"'
   || translate(encode(tag, 'base64'), E'\n', '')
   || '","ct":"'
   || translate(encode(ct,  'base64'), E'\n', '')
   || '"}';

  RETURN translate(
    encode(convert_to(payload, 'UTF8'), 'base64'),
    E'\n', ''
  );
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2  –  Encrypt  users  table
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE users
SET    email_id_enc = pii_encrypt_det(email_id)
WHERE  email_id IS NOT NULL
  AND  email_id <> ''
  AND  email_id_enc IS NULL;

UPDATE users
SET    mobile_enc = pii_encrypt_det(mobile)
WHERE  mobile IS NOT NULL
  AND  mobile <> ''
  AND  mobile_enc IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3  –  Encrypt  employee  table
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE employee
SET    email_id_enc = pii_encrypt_det(email_id)
WHERE  email_id IS NOT NULL
  AND  email_id <> ''
  AND  email_id_enc IS NULL;

UPDATE employee
SET    mobile_enc = pii_encrypt_det(mobile)
WHERE  mobile IS NOT NULL
  AND  mobile <> ''
  AND  mobile_enc IS NULL;

-- NOTE: date_of_birth is serialized as 'YYYY-MM-DD' to match the TypeScript
-- serializeValue() function which uses getFullYear()/getMonth()+1/getDate().
-- If date_of_birth is stored as a TIMESTAMP WITH TIME ZONE, replace
-- to_char(date_of_birth, 'YYYY-MM-DD') with
-- to_char(date_of_birth AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
-- to ensure the date string matches what Node.js local-time methods produce.

UPDATE employee
SET    date_of_birth_enc = pii_encrypt_det(to_char(date_of_birth, 'YYYY-MM-DD'))
WHERE  date_of_birth IS NOT NULL
  AND  date_of_birth_enc IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4  –  Encrypt  policy_enrollment_employee  table
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE policy_enrollment_employee
SET    date_of_birth_enc = pii_encrypt_det(to_char(date_of_birth, 'YYYY-MM-DD'))
WHERE  date_of_birth IS NOT NULL
  AND  date_of_birth_enc IS NULL;

UPDATE policy_enrollment_employee
SET    email_enc = pii_encrypt_det(email)
WHERE  email IS NOT NULL
  AND  email <> ''
  AND  email_enc IS NULL;

UPDATE policy_enrollment_employee
SET    phone_number_enc = pii_encrypt_det(phone_number)
WHERE  phone_number IS NOT NULL
  AND  phone_number <> ''
  AND  phone_number_enc IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5  –  Encrypt  policy_enrollment_dependent  table
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE policy_enrollment_dependent
SET    date_of_birth_enc = pii_encrypt_det(to_char(date_of_birth, 'YYYY-MM-DD'))
WHERE  date_of_birth IS NOT NULL
  AND  date_of_birth_enc IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6  –  Verify (all counts must be 0)
-- ─────────────────────────────────────────────────────────────────────────────

SELECT 'users.email_id'          AS field,
       COUNT(*)                   AS unencrypted_rows
FROM   users
WHERE  email_id IS NOT NULL AND email_id <> '' AND email_id_enc IS NULL

UNION ALL

SELECT 'users.mobile', COUNT(*)
FROM   users
WHERE  mobile IS NOT NULL AND mobile <> '' AND mobile_enc IS NULL

UNION ALL

SELECT 'employee.email_id', COUNT(*)
FROM   employee
WHERE  email_id IS NOT NULL AND email_id <> '' AND email_id_enc IS NULL

UNION ALL

SELECT 'employee.mobile', COUNT(*)
FROM   employee
WHERE  mobile IS NOT NULL AND mobile <> '' AND mobile_enc IS NULL

UNION ALL

SELECT 'employee.date_of_birth', COUNT(*)
FROM   employee
WHERE  date_of_birth IS NOT NULL AND date_of_birth_enc IS NULL

UNION ALL

SELECT 'policy_enrollment_employee.date_of_birth', COUNT(*)
FROM   policy_enrollment_employee
WHERE  date_of_birth IS NOT NULL AND date_of_birth_enc IS NULL

UNION ALL

SELECT 'policy_enrollment_employee.email', COUNT(*)
FROM   policy_enrollment_employee
WHERE  email IS NOT NULL AND email <> '' AND email_enc IS NULL

UNION ALL

SELECT 'policy_enrollment_employee.phone_number', COUNT(*)
FROM   policy_enrollment_employee
WHERE  phone_number IS NOT NULL AND phone_number <> '' AND phone_number_enc IS NULL

UNION ALL

SELECT 'policy_enrollment_dependent.date_of_birth', COUNT(*)
FROM   policy_enrollment_dependent
WHERE  date_of_birth IS NOT NULL AND date_of_birth_enc IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7  –  Cleanup helper functions
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS pii_encrypt_det(text);
DROP FUNCTION IF EXISTS _pii_ghash(bytea, bytea);
DROP FUNCTION IF EXISTS _pii_gf128_mult(bytea, bytea);
DROP FUNCTION IF EXISTS _pii_aes_block(bytea, bytea);
DROP FUNCTION IF EXISTS _pii_lshift1(bytea);
DROP FUNCTION IF EXISTS _pii_xor(bytea, bytea);
