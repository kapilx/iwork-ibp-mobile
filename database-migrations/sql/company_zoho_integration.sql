-- Create table to store per-company Zoho People OAuth2 tokens and sync metadata.
-- One row per company that connects their Zoho People account.

CREATE TABLE IF NOT EXISTS company_zoho_integration (
  id                    SERIAL PRIMARY KEY,
  company_id            INT NOT NULL UNIQUE REFERENCES company(id),
  zoho_organization_id  VARCHAR(100),
  zoho_domain           VARCHAR(50) NOT NULL DEFAULT 'zoho.in',
  access_token          TEXT,
  refresh_token         TEXT,
  token_expires_at      TIMESTAMPTZ,
  scopes                TEXT[],
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at        TIMESTAMPTZ,
  last_sync_stats       JSONB,
  created_by            INT,
  updated_by            INT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_czi_company_id ON company_zoho_integration(company_id);
CREATE INDEX IF NOT EXISTS idx_czi_is_active  ON company_zoho_integration(is_active);

COMMENT ON TABLE  company_zoho_integration                   IS 'Per-company Zoho People OAuth2 connection config and sync state';
COMMENT ON COLUMN company_zoho_integration.access_token      IS 'AES-256-GCM encrypted Zoho access token (1-hour TTL)';
COMMENT ON COLUMN company_zoho_integration.refresh_token     IS 'AES-256-GCM encrypted Zoho refresh token (persistent)';
COMMENT ON COLUMN company_zoho_integration.last_sync_stats   IS 'JSON: { synced, created, updated, skipped, errors }';
