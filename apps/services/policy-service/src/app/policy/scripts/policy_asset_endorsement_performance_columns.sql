-- Add business/scope/performance-toggle columns to policy_asset_endorsement,
-- mirroring the endorsement table:
--
-- date_of_business / business_month : same pattern as endorsement (copy of
--   endorsement_effective_date, and first-of-month truncation of it).
-- organisation_id / sbu_id / vertical_id / department_id / branch_id : scope
--   columns, added nullable; backfilled from the parent policy row (joined
--   on policy_id) since policy already carries these scope values.
-- enabled_for_performance_lid : toggle lookup id, defaults to 9402 (false);
--   application code flips it to 9401 (true) once date_of_income/income_month
--   get populated for a given asset endorsement.
--
-- Safe to re-run: column adds are guarded, backfill only touches rows still NULL.

BEGIN;

ALTER TABLE policy_asset_endorsement
    ADD COLUMN IF NOT EXISTS date_of_business            DATE NULL,
    ADD COLUMN IF NOT EXISTS business_month               DATE NULL,
    ADD COLUMN IF NOT EXISTS organisation_id               INT  NULL,
    ADD COLUMN IF NOT EXISTS sbu_id                        INT  NULL,
    ADD COLUMN IF NOT EXISTS vertical_id                   INT  NULL,
    ADD COLUMN IF NOT EXISTS department_id                 INT  NULL,
    ADD COLUMN IF NOT EXISTS branch_id                     INT  NULL,
    ADD COLUMN IF NOT EXISTS enabled_for_performance_lid   INT  NOT NULL DEFAULT 9402;

UPDATE policy_asset_endorsement
SET date_of_business = endorsement_effective_date,
    business_month   = date_trunc('month', endorsement_effective_date)::date
WHERE endorsement_effective_date IS NOT NULL
  AND (date_of_business IS NULL OR business_month IS NULL);

UPDATE policy_asset_endorsement pae
SET organisation_id = p.organisation_id,
    sbu_id          = p.sbu_id,
    vertical_id     = p.vertical_id,
    department_id   = p.department_id,
    branch_id       = p.branch_id
FROM policy p
WHERE p.id = pae.policy_id
  AND (
        pae.organisation_id IS NULL
     OR pae.sbu_id IS NULL
     OR pae.vertical_id IS NULL
     OR pae.department_id IS NULL
     OR pae.branch_id IS NULL
  );

COMMIT;
