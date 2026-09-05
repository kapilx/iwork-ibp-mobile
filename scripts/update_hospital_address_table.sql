-- Script to update mstr_hospital_address table to use foreign keys for state, city, and country
-- This script converts varchar fields to integer foreign keys matching the standard address table structure

-- Step 1: Add new integer columns for foreign keys
ALTER TABLE mstr_hospital_address 
ADD COLUMN state_id INT,
ADD COLUMN city_id INT,
ADD COLUMN country_id INT;

-- Step 2: Update the new columns with matching IDs from master tables
-- Update country_id (assuming India is the default country with id = 1)
UPDATE mstr_hospital_address 
SET country_id = (
    SELECT id FROM country 
    WHERE name = mstr_hospital_address.country 
    LIMIT 1
);

-- If no match found, set default to India (id = 1)
UPDATE mstr_hospital_address 
SET country_id = 1 
WHERE country_id IS NULL;

-- Update state_id
UPDATE mstr_hospital_address 
SET state_id = (
    SELECT id FROM state 
    WHERE name = mstr_hospital_address.state 
    LIMIT 1
);

-- Update city_id
UPDATE mstr_hospital_address 
SET city_id = (
    SELECT id FROM city 
    WHERE name = mstr_hospital_address.city 
    LIMIT 1
);

-- Step 3: Make the new foreign key columns NOT NULL after data migration
ALTER TABLE mstr_hospital_address 
ALTER COLUMN state_id SET NOT NULL,
ALTER COLUMN city_id SET NOT NULL,
ALTER COLUMN country_id SET NOT NULL;

-- Step 4: Add foreign key constraints
ALTER TABLE mstr_hospital_address 
ADD CONSTRAINT fk_hospital_address_state 
    FOREIGN KEY (state_id) REFERENCES state(id),
ADD CONSTRAINT fk_hospital_address_city 
    FOREIGN KEY (city_id) REFERENCES city(id),
ADD CONSTRAINT fk_hospital_address_country 
    FOREIGN KEY (country_id) REFERENCES country(id);

-- Step 5: Create indexes for better query performance
CREATE INDEX idx_mstr_hospital_address_state_id ON mstr_hospital_address(state_id);
CREATE INDEX idx_mstr_hospital_address_city_id ON mstr_hospital_address(city_id);
CREATE INDEX idx_mstr_hospital_address_country_id ON mstr_hospital_address(country_id);

-- Step 6: Drop the old varchar columns (CAUTION: This will permanently delete data)
-- Uncomment the following lines only after verifying the migration is successful
ALTER TABLE mstr_hospital_address 
DROP COLUMN state,
DROP COLUMN city,
DROP COLUMN country;

-- Step 7: Add backup of old data (recommended before dropping columns)
-- CREATE TABLE mstr_hospital_address_backup AS 
-- SELECT id, state, city, country, created_at 
-- FROM mstr_hospital_address;