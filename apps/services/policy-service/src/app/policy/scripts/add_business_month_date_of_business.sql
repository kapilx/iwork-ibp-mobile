-- Add / align business_month and date_of_business columns on policy and endorsement.
--
-- date_of_business : copy of policy_from / endorsement_effective_date (full date).
-- business_month   : first day of that month (DATE), mirroring income_month exactly
--                    (income_month is the first-of-month for date_of_income).
--                    Displayed like income_month (e.g. 'Mon-YYYY' in the Biz Done report).
--
-- NOTE: business_month used to be VARCHAR(20) holding a bare month name ("June").
-- This script converts it to DATE. The old month-name strings cannot be converted
-- to a real date (no year), so the conversion sets them to NULL and the backfill
-- below repopulates from policy_from / endorsement_effective_date.
--
-- Safe to re-run: column adds are guarded, the type conversion only runs while the
-- column is still non-DATE, and the backfill only touches rows that are still NULL.

BEGIN;

-- ─── POLICY TABLE ────────────────────────────────────────────────────────────

ALTER TABLE policy
    ADD COLUMN IF NOT EXISTS date_of_business  DATE  NULL,
    ADD COLUMN IF NOT EXISTS business_month    DATE  NULL;

-- Convert a pre-existing VARCHAR business_month to DATE (only if not already DATE).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'policy'
          AND column_name = 'business_month'
          AND data_type <> 'date'
    ) THEN
        ALTER TABLE policy
            ALTER COLUMN business_month TYPE DATE USING (NULL::date);
    END IF;
END $$;

-- Backfill existing rows.
UPDATE policy
SET date_of_business = policy_from,
    business_month   = date_trunc('month', policy_from)::date
WHERE policy_from IS NOT NULL
  AND (date_of_business IS NULL OR business_month IS NULL);

-- ─── ENDORSEMENT TABLE ───────────────────────────────────────────────────────

ALTER TABLE endorsement
    ADD COLUMN IF NOT EXISTS date_of_business  DATE  NULL,
    ADD COLUMN IF NOT EXISTS business_month    DATE  NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'endorsement'
          AND column_name = 'business_month'
          AND data_type <> 'date'
    ) THEN
        ALTER TABLE endorsement
            ALTER COLUMN business_month TYPE DATE USING (NULL::date);
    END IF;
END $$;

UPDATE endorsement
SET date_of_business = endorsement_effective_date,
    business_month   = date_trunc('month', endorsement_effective_date)::date
WHERE endorsement_effective_date IS NOT NULL
  AND (date_of_business IS NULL OR business_month IS NULL);

COMMIT;
