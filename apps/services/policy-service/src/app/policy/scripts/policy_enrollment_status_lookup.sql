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
  ('EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS', 'EMPLOYEE_ENROLLMENT_STATUS', 'IN_PROGRESS', 'In Progress', 'Enrollment in progress', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1),
  ('EMPLOYEE_ENROLLMENT_STATUS_ENROLLED', 'EMPLOYEE_ENROLLMENT_STATUS', 'ENROLLED', 'Enrolled', 'Employee Enrollment completed', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 2);
