-- Migration: Add contact_id to insurer_address table
-- Tracks which contact was created for a specific insurer address combination

ALTER TABLE insurer_address
    ADD COLUMN IF NOT EXISTS contact_id INT NULL,
    ADD CONSTRAINT fk_insurer_address_contact
        FOREIGN KEY (contact_id) REFERENCES contact(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_insurer_address_contact_id ON insurer_address(contact_id);
