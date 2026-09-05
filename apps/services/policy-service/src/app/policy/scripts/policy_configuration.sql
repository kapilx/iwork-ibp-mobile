CREATE TABLE policy_configuration (
    id SERIAL,
    company_id INT NOT NULL,
    policy_type_lid INT NOT NULL,
    policy_id INT NOT NULL,
    policy_configuration_status_lid INT NOT NULL,
    policy_step INT NOT NULL,
    policy_configuration JSONB NOT NULL,
    remarks TEXT, -- New field
    version INT DEFAULT 1, -- New field
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT pk_policy_configuration PRIMARY KEY (id),
   CONSTRAINT fk_policy_id FOREIGN KEY (policy_id) REFERENCES policy(id),
    CONSTRAINT fk_policy_type_lid FOREIGN KEY (policy_type_lid) REFERENCES lookup_data(id),
    CONSTRAINT fk_policy_configuration_status_lid FOREIGN KEY (policy_configuration_status_lid) REFERENCES lookup_data(id),
    CONSTRAINT fk_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE
);

INSERT INTO lookup_data (
  lookup_key,
  lookup_name,
  value_key,
  value,
  description,
  created_at,
  updated_at,
  created_by,
  updated_by,
  lookup_order
) VALUES
  ('POLICY_CONFIGURATION_STATUS_WIP', 'POLICY_CONFIGURATION_STATUS', 'WIP', 'Wip', 'Work in progress', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1),
  ('POLICY_CONFIGURATION_STATUS_COMPLETE', 'POLICY_CONFIGURATION_STATUS', 'COMPLETE', 'Complete', 'Completed', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2),
  ('POLICY_CONFIGURATION_STATUS_LIVE', 'POLICY_CONFIGURATION_STATUS', 'LIVE', 'Live', 'Live', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 3),
  ('POLICY_CONFIGURATION_STATUS_SUBMITTED', 'POLICY_CONFIGURATION_STATUS', 'SUBMITTED', 'Submitted', 'Submitted for review', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 4),
  ('POLICY_CONFIGURATION_STATUS_REJECTED', 'POLICY_CONFIGURATION_STATUS', 'REJECTED', 'Rejected', 'Rejected due to validation or approval failure', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 5);


  -- Update gst, brokerage_percentage, and commission_terrorism columns to numeric(5,2)
ALTER TABLE policy
  ALTER COLUMN gst TYPE numeric(5,2) USING gst::numeric(5,2),
  ALTER COLUMN brokerage_percentage TYPE numeric(5,2) USING brokerage_percentage::numeric(5,2),
  ALTER COLUMN commission_terrorism TYPE numeric(5,2) USING commission_terrorism::numeric(5,2);

--- add column for owner
ALTER TABLE policy ADD COLUMN IF NOT EXISTS owner_id INTEGER;

--- Update service_tax data type
ALTER TABLE policy 
ALTER COLUMN service_tax TYPE numeric(19,2) USING service_tax::numeric(19,2);