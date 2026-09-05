ALTER TABLE policy_configuration_components_detail
  ADD COLUMN IF NOT EXISTS is_benefit_component BOOLEAN NOT NULL DEFAULT false;
