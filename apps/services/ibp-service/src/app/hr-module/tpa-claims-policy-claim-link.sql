-- ─── Step 1: tpa_claim_data — add UNIQUE constraint to prevent duplicates ────
-- Duplicate guard: same policy + same TPA claim number + same data type = same row
ALTER TABLE public.tpa_claim_data
    ADD COLUMN IF NOT EXISTS id_temp SERIAL; -- temp, will be replaced by proper PK if not exists
-- Add unique constraint only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uq_tpa_claim_data_key' AND conrelid = 'public.tpa_claim_data'::regclass
    ) THEN
        ALTER TABLE public.tpa_claim_data
            ADD CONSTRAINT uq_tpa_claim_data_key
            UNIQUE (policy_number, tpa_claim_no, data_type);
    END IF;
END$$;

-- Drop temp column if it was added (only runs if id already existed)
ALTER TABLE public.tpa_claim_data DROP COLUMN IF EXISTS id_temp;

-- ─── Step 2: policy_claim — new columns ─────────────────────────────────────

-- TPA's own claim number (different from INSURANCE_CLAIM_NO stored in claim_number)
ALTER TABLE public.policy_claim
    ADD COLUMN IF NOT EXISTS tpa_claim_no VARCHAR(100);

-- FK to tpa_claim_data — links the queryable row to the raw JSONB detail
ALTER TABLE public.policy_claim
    ADD COLUMN IF NOT EXISTS tpa_claim_ref_id INTEGER
    REFERENCES public.tpa_claim_data(id) ON DELETE SET NULL;

-- Make source_file_upload_id nullable — TPA-fetched claims have no file upload
ALTER TABLE public.policy_claim
    ALTER COLUMN source_file_upload_id DROP NOT NULL;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_policy_claim_tpa_ref ON public.policy_claim (tpa_claim_ref_id);
CREATE INDEX IF NOT EXISTS idx_policy_claim_tpa_claim_no ON public.policy_claim (tpa_claim_no);

-- ─── Step 3: policy_claim_settlement — allow TPA-inserted rows without a file ─

-- paid_amount (clm_sett_amt) and settlement date (clm_sett_date) already exist here.
-- TPA-fetched settlements have no uploaded file, so make source_file_upload_id nullable.
ALTER TABLE public.policy_claim_settlement
    ALTER COLUMN source_file_upload_id DROP NOT NULL;
