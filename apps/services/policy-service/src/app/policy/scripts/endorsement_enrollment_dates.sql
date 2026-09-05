ALTER TABLE endorsement
    ADD COLUMN IF NOT EXISTS enrollment_start_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS enrollment_end_date TIMESTAMPTZ;
