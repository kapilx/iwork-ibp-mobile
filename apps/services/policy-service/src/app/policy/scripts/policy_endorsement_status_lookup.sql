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
  ('EMPLOYEE_ENDORSEMENT_ACKNOWLEDGEMENT_PENDING', 'EMPLOYEE_ENDORSEMENT_STATUS', 'ACKNOWLEDGEMENT_PENDING', 'Endorsement acknowledgement pending', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 3),
  ('EMPLOYEE_ENDORSEMENT_DOWNLOADED', 'EMPLOYEE_ENDORSEMENT_STATUS', 'DOWNLOADED', 'Endorsement downloaded', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 4),
  ('EMPLOYEE_ENDORSEMENT_ACKNOWLEDGED', 'EMPLOYEE_ENDORSEMENT_STATUS', 'ACKNOWLEDGED', 'Endorsement acknowledged', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 5),
  ('EMPLOYEE_ENDORSEMENT_TPA_ACKNOWLEDGED', 'EMPLOYEE_ENDORSEMENT_STATUS', 'TPA_ACKNOWLEDGED', 'TPA acknowledged', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 6);
