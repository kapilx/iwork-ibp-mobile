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
  ('POLICY_SECTION_APPROVAL_STATUS_SUBMITTED', 'POLICY_SECTION_APPROVAL_STATUS', 'SUBMITTED', 'Submitted', 'Policy section submitted for approval', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1),
  ('POLICY_SECTION_APPROVAL_STATUS_APPROVED', 'POLICY_SECTION_APPROVAL_STATUS', 'APPROVED', 'Approved', 'Policy section approved', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2),
  ('POLICY_SECTION_APPROVAL_STATUS_REJECTED', 'POLICY_SECTION_APPROVAL_STATUS', 'REJECTED', 'Rejected', 'Policy section rejected with comments', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 3)
ON CONFLICT (lookup_key) DO UPDATE
SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW(),
  updated_by = EXCLUDED.updated_by,
  lookup_order = EXCLUDED.lookup_order;
