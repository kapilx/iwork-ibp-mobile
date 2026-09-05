CREATE TABLE endorsement_field_mapping (
    id SERIAL,
    insurer_id INT NOT NULL UNIQUE,
    field_map JSONB NOT NULL,
    CONSTRAINT pk_endorsement_field_mapping PRIMARY KEY (id),
    CONSTRAINT fk_endorsement_field_mapping_insurer FOREIGN KEY (insurer_id) REFERENCES insurer(id) ON DELETE CASCADE
);

-- Field mappings should be inserted using the API provided by the application.

-----------------
-- 03 Sep 2025
ALTER TABLE policy
ADD COLUMN brokerage_collected NUMERIC(19,2);

ALTER TABLE endorsement
ADD COLUMN brokerage_collected NUMERIC(19,2);