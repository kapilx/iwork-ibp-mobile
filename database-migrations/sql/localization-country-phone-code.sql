-- Country calling code (e.g. "91" for India, "94" for Sri Lanka), used to prepend
-- to mobile numbers during enrollment uploads instead of hardcoding "+91".
-- Resolved via: policy location -> address -> country (name) -> localization_country (name).
ALTER TABLE localization_country
ADD COLUMN IF NOT EXISTS phone_number_code VARCHAR(10) NULL;

COMMENT ON COLUMN localization_country.phone_number_code IS
  'International calling code (no + or leading zeros), e.g. "91" for India. Used to prepend to employee mobile numbers based on the policy''s resolved country during enrollment uploads.';

UPDATE localization_country SET phone_number_code = '91' WHERE name = 'India';
UPDATE localization_country SET phone_number_code = '81' WHERE name = 'Japan';
UPDATE localization_country SET phone_number_code = '65' WHERE name = 'Singapore';
UPDATE localization_country SET phone_number_code = '27' WHERE name = 'South Africa';
UPDATE localization_country SET phone_number_code = '66' WHERE name = 'Thailand';
UPDATE localization_country SET phone_number_code = '44' WHERE name = 'United Kingdom';
UPDATE localization_country SET phone_number_code = '1' WHERE name = 'United States of America';
UPDATE localization_country SET phone_number_code = '94' WHERE name = 'Sri Lanka';
UPDATE localization_country SET phone_number_code = '960' WHERE name = 'Maldives';
UPDATE localization_country SET phone_number_code = '254' WHERE name = 'Kenya';
