-- Restores the service_tat_score_map table to its base schema (service/bucket map)
-- and reseeds the default mappings for active services. Execute this script on
-- environments where override columns were previously added.

BEGIN;

ALTER TABLE service_tat_score_map
    DROP CONSTRAINT IF EXISTS chk_service_tat_score_map_day_range,
    DROP COLUMN IF EXISTS start_day,
    DROP COLUMN IF EXISTS end_day,
    DROP COLUMN IF EXISTS tat_weight,
    DROP COLUMN IF EXISTS is_compliant;

INSERT INTO service_tat_score_map (
    service_id,
    tat_bucket_id,
    created_at,
    updated_at
)
SELECT
    service.id,
    bucket.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM mstr_service AS service
JOIN mstr_org_service_weightage AS weight
    ON weight.service_id = service.id
JOIN mstr_tat_bucket AS bucket
    ON bucket.org_id = weight.org_id
WHERE service.status = 'ACTIVE'
  AND weight.weightage_score > 0
  AND bucket.status = 'ACTIVE'
ON CONFLICT (service_id, tat_bucket_id) DO UPDATE
SET
    updated_at = CURRENT_TIMESTAMP;

COMMIT;
