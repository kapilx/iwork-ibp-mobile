ALTER TABLE policy
    ADD COLUMN IF NOT EXISTS policy_details_status_lid INTEGER,
    ADD COLUMN IF NOT EXISTS policy_covers_status_lid INTEGER,
    ADD COLUMN IF NOT EXISTS policy_cd_status_lid INTEGER,
    ADD COLUMN IF NOT EXISTS policy_details_approved_by INTEGER,
    ADD COLUMN IF NOT EXISTS policy_covers_approved_by INTEGER,
    ADD COLUMN IF NOT EXISTS policy_cd_approved_by INTEGER;
