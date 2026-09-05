DROP TABLE IF EXISTS insurer_address CASCADE;

-- Create insurer_address table
CREATE TABLE insurer_address (
    id SERIAL NOT NULL, -- Primary key with auto-increment
    insurer_id INT NOT NULL, -- Foreign key referencing insurer table
    address_id INT NOT NULL, -- Foreign key referencing address table
    contact_id INT NULL, -- Foreign key referencing the contact created for this address (nullable)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Creation timestamp
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL, -- Update timestamp
    CONSTRAINT pk_insurer_address_id PRIMARY KEY (id), -- Primary key constraint
    CONSTRAINT fk_insurer_address_insurer FOREIGN KEY (insurer_id) REFERENCES insurer(id) ON DELETE CASCADE, -- Cascade delete when insurer is deleted
    CONSTRAINT fk_insurer_address_address FOREIGN KEY (address_id) REFERENCES address(id) ON DELETE CASCADE, -- Cascade delete when address is deleted
    CONSTRAINT fk_insurer_address_contact FOREIGN KEY (contact_id) REFERENCES contact(id) ON DELETE SET NULL -- Nullify when contact is deleted
);

-- Add indexes for frequently queried columns
CREATE INDEX idx_insurer_address_insurer_id ON insurer_address(insurer_id);
CREATE INDEX idx_insurer_address_address_id ON insurer_address(address_id);
CREATE INDEX idx_insurer_address_contact_id ON insurer_address(contact_id);

