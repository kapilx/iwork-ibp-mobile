ALTER TABLE policy_configuration_components_detail
  ADD COLUMN provisional_policy_number VARCHAR(255),
  ADD COLUMN insurer_policy_number VARCHAR(255),
  ADD COLUMN iirm_policy_number VARCHAR(255),
  ADD COLUMN club_sum_insured_lid INT;

ALTER TABLE policy_configuration_components_detail
  ADD CONSTRAINT fk_policy_configuration_components_detail_club_sum_insured_lid
  FOREIGN KEY (club_sum_insured_lid)
  REFERENCES lookup_data(id)
  ON DELETE SET NULL;

CREATE TABLE policy_configuration_component_relation_map (
  id SERIAL PRIMARY KEY,
  policy_configuration_component_detail_id INT NOT NULL,
  relation_type VARCHAR(100) NOT NULL
);

CREATE INDEX idx_policy_config_component_relation_map_detail_id
  ON policy_configuration_component_relation_map(policy_configuration_component_detail_id);

ALTER TABLE policy_configuration_component_relation_map
  ADD CONSTRAINT fk_policy_config_component_relation_map_detail_id
  FOREIGN KEY (policy_configuration_component_detail_id)
  REFERENCES policy_configuration_components_detail(id)
  ON DELETE CASCADE;
