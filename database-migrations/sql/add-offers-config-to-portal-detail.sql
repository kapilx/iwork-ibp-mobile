-- Offers & Benefits: store the whole section as JSONB on the existing portal
-- configuration detail row, alongside company_portal_wellness_config and
-- dependent_relation_config. Replaces the company_offer_benefit and
-- company_offer_benefit_settings tables, which are no longer used.
--
-- Shape: { "isEnabled": boolean, "items": [ { id, title, description,
--          redirectionUrl, imageFileId, isEnabled, displayOrder } ] }
--
-- Domain scoping comes from the row itself: each company_portal_configuration
-- points at its own detail via company_portal_configuration_detail_id, so a
-- per-domain override is that config's own row, falling back to the
-- company-level config's row.
ALTER TABLE company_portal_configuration_detail
  ADD COLUMN IF NOT EXISTS company_portal_offers_config JSONB;
