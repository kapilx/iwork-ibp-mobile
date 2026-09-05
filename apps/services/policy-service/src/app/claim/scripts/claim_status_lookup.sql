INSERT INTO lookup_data (
  lookup_key,
  lookup_name,
  value_key,
  value,
  description,
  created_at,
  updated_at,
  created_by,
  updated_by,
  lookup_order
) VALUES
  ('CLAIM_STATUS_PENDING', 'CLAIM_STATUS', 'PENDING', 'Pending', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1),
  ('CLAIM_STATUS_IN_PROGRESS', 'CLAIM_STATUS', 'IN_PROGRESS', 'In Progress', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2),
  ('CLAIM_STATUS_OPEN', 'CLAIM_STATUS', 'OPEN', 'Open', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 3),
  ('CLAIM_STATUS_SETTLED', 'CLAIM_STATUS', 'SETTLED', 'Settled', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 4),
  ('CLAIM_STATUS_REPUDIATED', 'CLAIM_STATUS', 'REPUDIATED', 'Repudiated', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 5),
  ('CLAIM_STATUS_WITHDRAWN', 'CLAIM_STATUS', 'WITHDRAWN', 'Withdrawn', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 6),
  ('CLAIM_STATUS_IIRM_CANCEL', 'CLAIM_STATUS', 'IIRM_CANCEL', 'IIRM Cancel', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 7);
