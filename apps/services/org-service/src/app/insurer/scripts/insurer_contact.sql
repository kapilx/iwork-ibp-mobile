DROP TABLE IF EXISTS insurer_contact CASCADE;

-- Create insurer_contact table
CREATE TABLE insurer_contact (
    id SERIAL NOT NULL, -- Primary key with auto-increment
    insurer_id INT NOT NULL, -- Foreign key referencing insurer table
    contact_id INT NOT NULL, -- Foreign key referencing contact table
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Creation timestamp
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Update timestamp
    CONSTRAINT pk_insurer_contact_id PRIMARY KEY (id), -- Primary key constraint
    CONSTRAINT fk_insurer_contact_insurer FOREIGN KEY (insurer_id) REFERENCES insurer(id) ON DELETE CASCADE, -- Cascade delete when insurer is deleted
    CONSTRAINT fk_insurer_contact_contact FOREIGN KEY (contact_id) REFERENCES contact(id) ON DELETE CASCADE -- Cascade delete when contact is deleted
);

-- Add indexes for frequently queried columns
CREATE INDEX idx_insurer_contact_insurer_id ON insurer_contact(insurer_id);
CREATE INDEX idx_insurer_contact_contact_id ON insurer_contact(contact_id);