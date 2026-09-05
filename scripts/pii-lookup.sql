-- =============================================================================
-- PII Lookup Functions
-- =============================================================================
-- Uses pgcrypto's hmac() to reproduce the deterministic IV and match it
-- against the IV stored inside each encrypted payload — no AES key needed.
--
-- How it works:
--   Stored payload  = base64( JSON { v, iv, tag, ct } )
--   IV in payload   = base64( HMAC-SHA256(pepper, plaintext)[0:12] )
--   Search strategy = compute expected IV for the search term, compare with
--                     IV extracted from every row's stored payload.
--
-- Requires:
--   CREATE EXTENSION IF NOT EXISTS pgcrypto;
--
-- Usage:
--   SELECT * FROM pii_lookup('users',    'email_id_enc', 'john@example.com', '<FIELD_HASH_PEPPER>');
--   SELECT * FROM pii_lookup('employee', 'email_id_enc', 'john@example.com', '<FIELD_HASH_PEPPER>');
--   SELECT * FROM pii_lookup('users',    'mobile_enc',   '9876543210',        '<FIELD_HASH_PEPPER>');
--   SELECT * FROM pii_lookup('employee', 'mobile_enc',   '9876543210',        '<FIELD_HASH_PEPPER>');
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ---------------------------------------------------------------------------
-- 1. pii_iv_for_value
--    Computes the expected IV for a given plaintext + pepper.
--    This is the same derivation as the app:
--      IV = HMAC-SHA256(pepper, plaintext)[first 12 bytes], base64-encoded
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pii_iv_for_value(
  p_plaintext TEXT,
  p_pepper    TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE STRICT
AS $$
  SELECT encode(
    substring(
      hmac(p_plaintext::bytea, p_pepper::bytea, 'sha256'),
      1, 12
    ),
    'base64'
  );
$$;


-- ---------------------------------------------------------------------------
-- 2. pii_extract_iv
--    Extracts the IV from a stored encrypted payload.
--    Payload format: base64( JSON { "v":2, "iv":"...", "tag":"...", "ct":"..." } )
--    Returns NULL if the value is not a valid encrypted payload.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pii_extract_iv(p_enc_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE STRICT
AS $$
BEGIN
  RETURN (
    convert_from(decode(p_enc_value, 'base64'), 'utf8')::json->>'iv'
  );
EXCEPTION WHEN OTHERS THEN
  -- not a valid encrypted payload (NULL, plaintext, or corrupt) — skip
  RETURN NULL;
END;
$$;


-- ---------------------------------------------------------------------------
-- 3. pii_lookup  (main function)
--    Searches any table+column for a matching plaintext value.
--    Returns all columns of matching rows as JSON objects.
--
--    Parameters:
--      p_table    — DB table name, e.g. 'users' or 'employee'
--      p_column   — encrypted column name, e.g. 'email_id_enc' or 'mobile_enc'
--      p_value    — plaintext to search for, e.g. 'john@gmail.com'
--      p_pepper   — value of FIELD_HASH_PEPPER env var
--
--    NOTE: Non-encrypted columns (first_name, id, etc.) are readable in the
--    output. Encrypted columns still show ciphertext — the AES key is not
--    needed for lookup, only the pepper.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pii_lookup(
  p_table  TEXT,
  p_column TEXT,
  p_value  TEXT,
  p_pepper TEXT
)
RETURNS SETOF json
LANGUAGE plpgsql
AS $$
DECLARE
  v_expected_iv TEXT;
  v_sql         TEXT;
BEGIN
  -- Derive the IV we expect to find in matching rows
  v_expected_iv := pii_iv_for_value(p_value, p_pepper);

  RAISE NOTICE 'Searching %.% for IV = %', p_table, p_column, v_expected_iv;

  -- Compare the IV extracted from each row's payload with the expected IV.
  -- Uses format() with %I (identifier quoting) to prevent SQL injection.
  v_sql := format(
    $q$
      SELECT row_to_json(t)
      FROM (
        SELECT *
        FROM   %I
        WHERE  %I IS NOT NULL
          AND  pii_extract_iv(%I) = %L
      ) t
    $q$,
    p_table,        -- %I table name
    p_column,       -- %I column IS NOT NULL check
    p_column,       -- %I column passed to pii_extract_iv()
    v_expected_iv   -- %L expected IV literal
  );

  RETURN QUERY EXECUTE v_sql;
END;
$$;


-- =============================================================================
-- Quick-use named wrappers (optional convenience)
-- Avoids typing column names every time for the common lookups.
-- =============================================================================

CREATE OR REPLACE FUNCTION find_user_by_email(p_email TEXT, p_pepper TEXT)
RETURNS SETOF json LANGUAGE sql AS $$
  SELECT pii_lookup('users', 'email_id_enc', p_email, p_pepper);
$$;

CREATE OR REPLACE FUNCTION find_user_by_mobile(p_mobile TEXT, p_pepper TEXT)
RETURNS SETOF json LANGUAGE sql AS $$
  SELECT pii_lookup('users', 'mobile_enc', p_mobile, p_pepper);
$$;

CREATE OR REPLACE FUNCTION find_employee_by_email(p_email TEXT, p_pepper TEXT)
RETURNS SETOF json LANGUAGE sql AS $$
  SELECT pii_lookup('employee', 'email_id_enc', p_email, p_pepper);
$$;

CREATE OR REPLACE FUNCTION find_employee_by_mobile(p_mobile TEXT, p_pepper TEXT)
RETURNS SETOF json LANGUAGE sql AS $$
  SELECT pii_lookup('employee', 'mobile_enc', p_mobile, p_pepper);
$$;


-- =============================================================================
-- USAGE EXAMPLES
-- =============================================================================
-- Replace <FIELD_HASH_PEPPER> with the actual value from environments/.env.dev
--
-- Generic lookup (any table / any column):
--   SELECT * FROM pii_lookup('users',    'email_id_enc', 'john@example.com', '<FIELD_HASH_PEPPER>');
--   SELECT * FROM pii_lookup('employee', 'email_id_enc', 'john@example.com', '<FIELD_HASH_PEPPER>');
--   SELECT * FROM pii_lookup('users',    'mobile_enc',   '9876543210',        '<FIELD_HASH_PEPPER>');
--
-- Named convenience wrappers:
--   SELECT * FROM find_user_by_email('john@example.com', '<FIELD_HASH_PEPPER>');
--   SELECT * FROM find_user_by_mobile('9876543210',       '<FIELD_HASH_PEPPER>');
--   SELECT * FROM find_employee_by_email('jane@example.com', '<FIELD_HASH_PEPPER>');
--   SELECT * FROM find_employee_by_mobile('9876543210',       '<FIELD_HASH_PEPPER>');
--
-- Verify the IV derivation independently:
--   SELECT pii_iv_for_value('john@example.com', '<FIELD_HASH_PEPPER>');
-- =============================================================================
-- Quick-use named wrappers (optional convenience)
-- Avoids typing column names every time for the common lookups.
-- =============================================================================



-- ---------------------------------------------------------------------------
-- 4. pii_lookup_column
--    Returns only the encrypted column value(s) that match the search term.
--    Returns SETOF TEXT for use in WHERE IN (SELECT ...) clauses.
--
--    Parameters:
--      p_table    — DB table name, e.g. 'users' or 'employee'
--      p_column   — encrypted column name, e.g. 'email_id_enc' or 'mobile_enc'
--      p_value    — plaintext to search for, e.g. 'john@gmail.com'
--      p_pepper   — value of FIELD_HASH_PEPPER env var
--
--    Usage:
--      SELECT * FROM company c
--      JOIN users u ON c.created_by = u.id
--      WHERE u.email_id_enc IN (
--          SELECT pii_lookup_column('users', 'email_id_enc', 'emp-karan-000-48635@gmail.com', '4f91f14660f8473e4cc4ddb5768ef98d7e4384fb7f512d97')
--      );
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pii_lookup_column(
  p_table  TEXT,
  p_column TEXT,
  p_value  TEXT,
  p_pepper TEXT
)
RETURNS SETOF TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_expected_iv TEXT;
  v_sql         TEXT;
BEGIN
  -- Derive the IV we expect to find in matching rows
  v_expected_iv := pii_iv_for_value(p_value, p_pepper);

  RAISE NOTICE 'Searching %.% for IV = %', p_table, p_column, v_expected_iv;

  -- Return only the encrypted column value(s) that match
  v_sql := format(
    $q$
      SELECT %I
      FROM   %I
      WHERE  %I IS NOT NULL
        AND  pii_extract_iv(%I) = %L
    $q$,
    p_column,       -- %I column to SELECT
    p_table,        -- %I table name
    p_column,       -- %I column IS NOT NULL check
    p_column,       -- %I column passed to pii_extract_iv()
    v_expected_iv   -- %L expected IV literal
  );

  RETURN QUERY EXECUTE v_sql;
END;
$$;