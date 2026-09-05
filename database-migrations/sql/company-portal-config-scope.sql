-- Domain-level policy + location scoping for company portal configuration
-- Allows one company to have multiple domains each showing different policy subsets
-- NULL policy_id  = ALL_POLICIES mode for that company under that domain
-- NULL address_id = all locations for that policy

CREATE TABLE IF NOT EXISTS company_portal_config_scope (
  id          SERIAL        PRIMARY KEY,
  config_id   INTEGER       NOT NULL
                REFERENCES company_portal_configuration(id)
                ON DELETE CASCADE,
  company_id  INTEGER       NOT NULL,
  policy_id   INTEGER,
  address_id  INTEGER,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_portal_config_scope
    UNIQUE (config_id, company_id, policy_id, address_id)
);

CREATE INDEX IF NOT EXISTS idx_portal_config_scope_config_id
  ON company_portal_config_scope (config_id);

CREATE INDEX IF NOT EXISTS idx_portal_config_scope_company_id
  ON company_portal_config_scope (company_id);

-- Domain-level auth method override
-- NULL config_id = company-level default (existing rows untouched, backward compatible)
-- non-null config_id = override for that specific domain only
ALTER TABLE company_authentication_config
  ADD COLUMN IF NOT EXISTS config_id INTEGER
    REFERENCES company_portal_configuration(id)
    ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_auth_config_domain
  ON company_authentication_config (company_id, config_id)
  WHERE config_id IS NOT NULL;
