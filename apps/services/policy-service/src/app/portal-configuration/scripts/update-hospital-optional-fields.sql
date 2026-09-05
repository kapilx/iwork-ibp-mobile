-- Database update script to make hospital fields optional
-- Execute these statements to align database with updated entity constraints
-- Date: 11 November 2025

-- Update mstr_hospital table to make 'code' nullable
ALTER TABLE mstr_hospital ALTER COLUMN code DROP NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN mstr_hospital.code IS 'Hospital code for identification (optional after upload feature)';

-- Update mstr_hospital_address table to make 'pin_code' nullable  
ALTER TABLE mstr_hospital_address ALTER COLUMN pin_code DROP NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN mstr_hospital_address.pin_code IS 'Postal code of the address (optional after upload feature)';

-- Verify changes
SELECT 
    column_name, 
    is_nullable, 
    data_type, 
    character_maximum_length 
FROM information_schema.columns 
WHERE table_name IN ('mstr_hospital', 'mstr_hospital_address') 
    AND column_name IN ('code', 'pin_code')
ORDER BY table_name, column_name;