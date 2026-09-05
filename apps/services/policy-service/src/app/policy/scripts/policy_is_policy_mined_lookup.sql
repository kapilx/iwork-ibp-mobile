BEGIN;

ALTER TABLE policy
  ADD COLUMN IF NOT EXISTS is_policy_mined_lid_tmp INTEGER;

WITH yes_lookup AS (
  SELECT id FROM look_up WHERE look_up_key = 'IS_POLICY_MINED_YES'
),
no_lookup AS (
  SELECT id FROM look_up WHERE look_up_key = 'IS_POLICY_MINED_NO'
)
UPDATE policy
SET is_policy_mined_lid_tmp = CASE
  WHEN is_mined IS TRUE THEN (SELECT id FROM yes_lookup)
  WHEN is_mined IS FALSE THEN (SELECT id FROM no_lookup)
  ELSE NULL
END;

ALTER TABLE policy
  DROP COLUMN IF EXISTS is_mined;

ALTER TABLE policy
  RENAME COLUMN is_policy_mined_lid_tmp TO is_policy_mined_lid;

ALTER TABLE policy
  ADD CONSTRAINT IF NOT EXISTS fk_policy_is_policy_mined_lookup
  FOREIGN KEY (is_policy_mined_lid) REFERENCES look_up(id);

COMMIT;
