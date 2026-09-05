-- Add dependent_relation_config (per-company relations + constraints for dependent
-- management) to the company portal configuration detail. Authored in iWork, served
-- to the IBP employee app. Returns NULL/empty when a company hasn't configured it;
-- the IBP frontend applies its own default in that case.

ALTER TABLE "company_portal_configuration_detail"
  ADD COLUMN IF NOT EXISTS "dependent_relation_config" jsonb;
