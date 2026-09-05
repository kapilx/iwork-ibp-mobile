-- Adds `isOptional` for policy components. Both stores need it:
--   1. policy_configuration_components_detail  — written by the save path
--   2. policy_configuration.policy_configuration — the JSONB blob that
--      relations-constraints-dependents serves verbatim
-- Both statements are idempotent. Run before restarting policy-service.

ALTER TABLE policy_configuration_components_detail
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN NOT NULL DEFAULT false;

UPDATE policy_configuration pc
SET policy_configuration = jsonb_set(
      pc.policy_configuration,
      '{components}',
      (
        SELECT jsonb_agg(
                 CASE
                   WHEN c ? 'isOptional' THEN c
                   ELSE c || '{"isOptional": false}'::jsonb
                 END
                 ORDER BY ord
               )
        FROM jsonb_array_elements(pc.policy_configuration -> 'components')
             WITH ORDINALITY AS t(c, ord)
      )
    )
WHERE jsonb_typeof(pc.policy_configuration -> 'components') = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(pc.policy_configuration -> 'components') AS c
    WHERE NOT (c ? 'isOptional')
  );
