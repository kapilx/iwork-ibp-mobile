DROP TABLE IF EXISTS insurer CASCADE;

-- Create insurer table
CREATE TABLE insurer (
    id SERIAL NOT NULL, -- Primary key with auto-increment
    name VARCHAR(200) NOT NULL, -- Insurer name with max length 200
    display_name VARCHAR(100) NOT NULL, -- Display name with max length 100
    company_type_id INT NOT NULL, -- Foreign key referencing LookUp table
    website VARCHAR(255), -- Website URL with max length 255
    is_life_id INT NOT NULL, -- Foreign key referencing LookUp table
    company_tag_id INT NOT NULL, -- Foreign key referencing LookUp table
    remarks VARCHAR(500), -- Remarks with max length 500
    insure_code VARCHAR(100), -- Insure code with max length 100
    status_id INT NOT NULL, -- Foreign key referencing LookUp table
    created_by INT NOT NULL DEFAULT 0, -- Created by user ID
    updated_by INT NOT NULL DEFAULT 0, -- Updated by user ID
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Creation timestamp
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Update timestamp
    deleted_at TIMESTAMPTZ, -- Soft delete timestamp
    CONSTRAINT pk_insurer_id PRIMARY KEY (id), -- Primary key constraint
    CONSTRAINT fk_company_type_id FOREIGN KEY (company_type_id) REFERENCES look_up(id), -- Foreign key for company_type_id
    CONSTRAINT fk_is_life_id FOREIGN KEY (is_life_id) REFERENCES look_up(id), -- Foreign key for is_life_id
    CONSTRAINT fk_company_tag_id FOREIGN KEY (company_tag_id) REFERENCES look_up(id), -- Foreign key for company_tag_id
    CONSTRAINT fk_status_id FOREIGN KEY (status_id) REFERENCES look_up(id) -- Foreign key for status_id
);

-- Add indexes for frequently queried columns
CREATE INDEX idx_insurer_name ON insurer(name);
CREATE INDEX idx_insurer_display_name ON insurer(display_name);
CREATE INDEX idx_insurer_company_type_id ON insurer(company_type_id);
CREATE INDEX idx_insurer_is_life_id ON insurer(is_life_id);
CREATE INDEX idx_insurer_company_tag_id ON insurer(company_tag_id);
CREATE INDEX idx_insurer_status_id ON insurer(status_id);
CREATE INDEX idx_insurer_created_by ON insurer(created_by);
CREATE INDEX idx_insurer_updated_by ON insurer(updated_by);

-----------------------
-- Update INSURER_IS_LIFE lookup values with new lookup INSURANCE_TYPE
UPDATE lookup_data
SET
  lookup_name = 'INSURANCE_TYPE',
  lookup_key = 'INSURANCE_TYPE_LIFE',
  value_key = 'LIFE',
  value = 'Life Insurance',
  description = 'Insurance Type - Life',
  lookup_order = 1
WHERE lookup_key = 'INSURER_IS_LIFE_YES';

UPDATE lookup_data
SET
  lookup_name = 'INSURANCE_TYPE',
  lookup_key = 'INSURANCE_TYPE_GENERAL',
  value_key = 'GENERAL',
  value = 'General Insurance',
  description = 'Insurance Type - General',
  lookup_order = 2
WHERE lookup_key = 'INSURER_IS_LIFE_NO';

INSERT INTO lookup_data (
    lookup_name,
    lookup_key,
    value_key,
    value,
    description,
    created_by,
    updated_by,
    lookup_order
)
VALUES
    (
        'INSURANCE_TYPE',
        'INSURANCE_TYPE_HEALTH',
        'HEALTH',
        'Health Insurance',
        'Insurance Type - Health',
        'SYSTEM',
        'SYSTEM',
        3
    ),
    (
        'INSURANCE_TYPE',
        'INSURANCE_TYPE_COMPOSITE',
        'COMPOSITE',
        'Composite Insurance',
        'Insurance Type - Composite',
        'SYSTEM',
        'SYSTEM',
        4
    );

----------------------
ALTER TABLE insurer
ADD COLUMN country_id INT; 

ALTER TABLE tpa
ADD COLUMN country_id INT; 

ALTER TABLE broker
ADD COLUMN country_id INT; 