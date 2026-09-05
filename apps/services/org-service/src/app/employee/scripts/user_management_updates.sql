-- SQL script to update user and employee tables
-- and create supporting tables for verticals and branches.

-- 1. Create org_vertical table
CREATE TABLE IF NOT EXISTS org_vertical (
    id SERIAL PRIMARY KEY,
    organisation_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR NOT NULL,
    updated_by VARCHAR NOT NULL,
    CONSTRAINT fk_org_vertical_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisation(id)
);

-- 2. Create org_branch table
CREATE TABLE IF NOT EXISTS org_branch (
    id SERIAL PRIMARY KEY,
    organisation_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR NOT NULL,
    updated_by VARCHAR NOT NULL,
    CONSTRAINT fk_org_branch_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisation(id)
);

-- 3. Modify users table
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS vertical_id INT,
    ADD COLUMN IF NOT EXISTS branch_id INT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS created_by INT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_by INT,
    ADD COLUMN IF NOT EXISTS user_type_key VARCHAR(255);

ALTER TABLE employee
    ADD COLUMN IF NOT EXISTS vertical_id INT;

-- remove old iirm_emp_id column if present
ALTER TABLE users
    DROP COLUMN IF EXISTS iirm_emp_id;

-- foreign keys for users table
ALTER TABLE users
    ADD CONSTRAINT fk_users_vertical FOREIGN KEY (vertical_id)
        REFERENCES org_vertical(id);
-- 4. Update employee table foreign keys
ALTER TABLE employee
    ADD CONSTRAINT fk_employee_vertical FOREIGN KEY (vertical_id)
        REFERENCES org_vertical(id);

-- 5. Modify department table to reference vertical
ALTER TABLE department
    ADD COLUMN IF NOT EXISTS vertical_id INT;
ALTER TABLE department
    ADD CONSTRAINT fk_department_vertical FOREIGN KEY (vertical_id)
        REFERENCES org_vertical(id);

ALTER TABLE department
    DROP COLUMN organisation_id;

-- 6. Insert initial user type lookup data
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
) VALUES (
    'USER_TYPE_IIRM_EMPLOYEE',
    'USER_TYPE',
    'IIRM_EMPLOYEE',
    'IIRM Employee',
    'Default user type for employees',
    NOW(),
    NOW(),
    'Admin',
    'Admin',
    1
) ON CONFLICT (lookup_key) DO NOTHING;

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
) VALUES (
    'USER_STATUS_ACTIVE',
    'USER_STATUS',
    'ACTIVE',
    'Active',
    'Default user status for active users',
    NOW(),
    NOW(),
    'Admin',
    'Admin',
    1
) ON CONFLICT (lookup_key) DO NOTHING;

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
) VALUES (
    'USER_STATUS_DELETED',
    'USER_STATUS',
    'DELETED',
    'Deleted',
    'Default user status for deleted users',
    NOW(),
    NOW(),
    'Admin',
    'Admin',
    1
) ON CONFLICT (lookup_key) DO NOTHING;

ALTER TABLE employee
    ADD CONSTRAINT fk_employee_branch FOREIGN KEY (branch_id)
        REFERENCES org_branch(id);
ALTER TABLE users
    ADD CONSTRAINT fk_users_branch FOREIGN KEY (branch_id)
        REFERENCES org_branch(id);

ALTER TABLE employee
    ADD CONSTRAINT fk_employee_department FOREIGN KEY (department_id)
        REFERENCES department(id);

ALTER TABLE users
    ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id)
        REFERENCES department(id);

ALTER TABLE employee RENAME COLUMN "organization_id" TO "organisation_id";

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS organisation_id INT;
ALTER TABLE users
    ADD CONSTRAINT fk_employee_organisation FOREIGN KEY (organisation_id)
        REFERENCES organisation(id);

ALTER TABLE organisation
    ADD COLUMN IF NOT EXISTS country_id INT;
ALTER TABLE organisation
    ADD CONSTRAINT fk_organisation_country FOREIGN KEY (country_id)
        REFERENCES country (id);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS USER_STATUSstatus_key VARCHAR(255);

ALTER TABLE designation
    ADD COLUMN IF NOT EXISTS grade_level INT;

-- Following changes were not made in the DB:

-- need to keep a constraint (unique) on the lookup_key which is currently failing due
-- to duplicate entries (YES & NO)
ALTER TABLE users
    ADD CONSTRAINT fk_users_user_type FOREIGN KEY (user_type_key)
        REFERENCES lookup_data (lookup_key);

ALTER TABLE users
    ADD CONSTRAINT fk_users_user_status FOREIGN KEY (user_status_key)
        REFERENCES lookup_data (lookup_key);

