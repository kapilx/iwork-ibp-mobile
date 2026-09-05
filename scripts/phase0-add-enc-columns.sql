-- Phase 0: Add encrypted PII columns alongside originals.

-- users
ALTER TABLE users    ADD COLUMN IF NOT EXISTS email_id_enc TEXT;
ALTER TABLE users    ADD COLUMN IF NOT EXISTS mobile_enc   TEXT;

-- employee
ALTER TABLE employee ADD COLUMN IF NOT EXISTS email_id_enc TEXT;
ALTER TABLE employee ADD COLUMN IF NOT EXISTS mobile_enc   TEXT;
ALTER TABLE employee ADD COLUMN IF NOT EXISTS date_of_birth_enc      TEXT;

-- policy_enrollment_employee
ALTER TABLE policy_enrollment_employee ADD COLUMN IF NOT EXISTS date_of_birth_enc TEXT;
ALTER TABLE policy_enrollment_employee ADD COLUMN IF NOT EXISTS email_enc         TEXT;
ALTER TABLE policy_enrollment_employee ADD COLUMN IF NOT EXISTS phone_number_enc  TEXT;

-- policy_enrollment_dependent
ALTER TABLE policy_enrollment_dependent ADD COLUMN IF NOT EXISTS date_of_birth_enc TEXT;

-- contact_communication_details
ALTER TABLE contact_communication_details ADD COLUMN IF NOT EXISTS communication_details_enc TEXT;
