-- Domain-level auth method override for company_authentication_map
-- (mirrors the config_id column already added to company_authentication_config
-- in company-portal-config-scope.sql)
-- NULL config_id = company-level default (existing rows untouched, backward compatible)
-- non-null config_id = override for that specific domain only
ALTER TABLE company_authentication_map
  ADD COLUMN IF NOT EXISTS config_id INTEGER
    REFERENCES company_portal_configuration(id);
    
CREATE INDEX IF NOT EXISTS idx_auth_map_domain
  ON company_authentication_map (company_id, config_id)
  WHERE config_id IS NOT NULL;

-- Replace the (company_id, authentication_method_id) uniqueness with a
-- domain-aware version, so a domain-specific override row no longer collides
-- with the company-level default row for the same method.
--
-- The pre-existing uniqueness in this database is named "uq_company_auth_method"
-- and is NOT registered as a formal table CONSTRAINT (it doesn't show up in
-- information_schema.table_constraints), only as a plain unique INDEX — so it
-- must be dropped by name via DROP INDEX, not discovered generically.
ALTER TABLE company_authentication_map DROP CONSTRAINT IF EXISTS uq_company_auth_method;
DROP INDEX IF EXISTS uq_company_auth_method;

DO $$
DECLARE
  existing_constraint_name text;
BEGIN
  -- Backstop for any other environment where this uniqueness exists as a
  -- formal constraint under a different (e.g. auto-generated) name.
  SELECT tc.constraint_name INTO existing_constraint_name
  FROM information_schema.table_constraints tc
  WHERE tc.table_name = 'company_authentication_map'
    AND tc.constraint_type = 'UNIQUE'
    AND (
      SELECT array_agg(kcu.column_name::text ORDER BY kcu.column_name::text)
      FROM information_schema.key_column_usage kcu
      WHERE kcu.constraint_name = tc.constraint_name
        AND kcu.table_name = tc.table_name
    ) = ARRAY['authentication_method_id', 'company_id']::text[]
  LIMIT 1;

  IF existing_constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE company_authentication_map DROP CONSTRAINT %I',
      existing_constraint_name
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'uq_company_auth_map_company_config_method'
      AND table_name = 'company_authentication_map'
  ) THEN
    ALTER TABLE company_authentication_map
      ADD CONSTRAINT uq_company_auth_map_company_config_method
      UNIQUE (company_id, config_id, authentication_method_id);
  END IF;
END
$$;
