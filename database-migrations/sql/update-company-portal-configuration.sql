-- Update the company configuration schema to align with the new table/column names
ALTER TABLE "config_company" RENAME TO "company_portal_configuration";

ALTER TABLE "company_portal_configuration" RENAME COLUMN "reference-id" TO "company_id";
ALTER TABLE "company_portal_configuration" RENAME COLUMN "database-id" TO "company_database_id";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'company_portal_configuration'
      AND column_name = 'sub-domain'
  ) THEN
    ALTER TABLE "company_portal_configuration"
      RENAME COLUMN "sub-domain" TO "sub_domine";
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'company_portal_configuration'
      AND column_name = 'sub_domine'
  ) THEN
    ALTER TABLE "company_portal_configuration"
      RENAME COLUMN "sub_domine" TO "sub_domain";
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'company_portal_configuration'
      AND column_name = 'company_portal_configuration'
  ) THEN
    ALTER TABLE "company_portal_configuration"
      RENAME COLUMN "company_portal_configuration" TO "company_portal_dashboard_config";
  END IF;
END
$$;



ALTER TABLE "company_portal_configuration"
  ADD COLUMN IF NOT EXISTS "company_portal_dashboard_config" jsonb,
  ADD COLUMN IF NOT EXISTS "company_logo_file_id" integer,
  ADD COLUMN IF NOT EXISTS "company_policy_config" jsonb,
  ADD COLUMN IF NOT EXISTS "company_portal_branding_config" jsonb;
ALTER TABLE "company_portal_configuration"
  ADD COLUMN IF NOT EXISTS "company_configuration_status_lid" integer;
ALTER TABLE "company_portal_configuration"
  ADD COLUMN IF NOT EXISTS "approved_by" integer,
  ADD COLUMN IF NOT EXISTS "approved_at" timestamp,
  ADD COLUMN IF NOT EXISTS "rejected_by" integer,
  ADD COLUMN IF NOT EXISTS "rejected_at" timestamp;
ALTER TABLE "company_portal_configuration"
  DROP COLUMN IF EXISTS "name";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_company_configuration_status_lid'
      AND table_name = 'company_portal_configuration'
  ) THEN
    ALTER TABLE "company_portal_configuration"
      ADD CONSTRAINT fk_company_configuration_status_lid
      FOREIGN KEY ("company_configuration_status_lid") REFERENCES lookup_data(id);
  END IF;
END
$$;


INSERT INTO
  lookup_data (
    lookup_key,
    lookup_name,
    value_key,
    value,
    description,
    created_at,
    updated_at,
    created_by,
    updated_by,
    lookup_order,
    organisation_id
  )
SELECT
  'COMPANY_CONFIGURATION_STATUS_DRAFT',
  'COMPANY_CONFIGURATION_STATUS',
  'DRAFT',
  'Draft',
  'Draft company configuration state',
  NOW(),
  NOW(),
  'SYSTEM',
  'SYSTEM',
  1,
  0
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      lookup_data
    WHERE
      lookup_key = 'COMPANY_CONFIGURATION_STATUS_DRAFT'
      AND value_key = 'DRAFT'
  );

INSERT INTO
  lookup_data (
    lookup_key,
    lookup_name,
    value_key,
    value,
    description,
    created_at,
    updated_at,
    created_by,
    updated_by,
    lookup_order,
    organisation_id
  )
SELECT
  'COMPANY_CONFIGURATION_STATUS_REJECTED',
  'COMPANY_CONFIGURATION_STATUS',
  'REJECTED',
  'Rejected',
  'Rejected company configuration',
  NOW(),
  NOW(),
  'SYSTEM',
  'SYSTEM',
  2,
  0
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      lookup_data
    WHERE
      lookup_key = 'COMPANY_CONFIGURATION_STATUS_REJECTED'
      AND value_key = 'REJECTED'
  );

INSERT INTO
  lookup_data (
    lookup_key,
    lookup_name,
    value_key,
    value,
    description,
    created_at,
    updated_at,
    created_by,
    updated_by,
    lookup_order,
    organisation_id
  )
SELECT
  'COMPANY_CONFIGURATION_STATUS_ACTIVE',
  'COMPANY_CONFIGURATION_STATUS',
  'ACTIVE',
  'Active',
  'Active company configuration',
  NOW(),
  NOW(),
  'SYSTEM',
  'SYSTEM',
  3,
  0
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      lookup_data
    WHERE
      lookup_key = 'COMPANY_CONFIGURATION_STATUS_ACTIVE'
      AND value_key = 'ACTIVE'
  );

INSERT INTO
  lookup_data (
    lookup_key,
    lookup_name,
    value_key,
    value,
    description,
    created_at,
    updated_at,
    created_by,
    updated_by,
    lookup_order,
    organisation_id
  )
SELECT
  'COMPANY_CONFIGURATION_STATUS_UNDER_REVIEW',
  'COMPANY_CONFIGURATION_STATUS',
  'UNDER_REVIEW',
  'Under Review',
  'Company configuration under review',
  NOW(),
  NOW(),
  'SYSTEM',
  'SYSTEM',
  4,
  0
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      lookup_data
    WHERE
      lookup_key = 'COMPANY_CONFIGURATION_STATUS_UNDER_REVIEW'
      AND value_key = 'UNDER_REVIEW'
  );

INSERT INTO
  public.authentication_methods (
    method_code,
    method_name,
    description,
    is_active,
    configuration,
    created_at,
    updated_at,
    authentication_method_key
  )
VALUES
  (
    'EMAIL_PASSWORD',
    'Email and Password',
    'Authentication using email and password',
    true,
    NULL,
    NOW(),
    NOW(),
    'email_password'
  ),
  (
    'PHONE_PASSWORD',
    'Phone and Password',
    'Authentication using phone number and password',
    true,
    NULL,
    NOW(),
    NOW(),
    'phone_password'
  ),
  (
    'USERNAME_PASSWORD',
    'Username and Password',
    'Authentication using username and password',
    true,
    NULL,
    NOW(),
    NOW(),
    'username_password'
  );

DROP TABLE IF EXISTS "company_logo";

ALTER TABLE "company_portal_configuration"
  DROP COLUMN IF EXISTS "company_logo";

ALTER TABLE "company_authentication_mapping" RENAME TO "company_authentication_map";

ALTER TABLE "company_authentication_map"
  ADD COLUMN IF NOT EXISTS "authentication_method_key" text;
ALTER TABLE "company_authentication_map"
  ADD COLUMN IF NOT EXISTS "created_by" integer,
  ADD COLUMN IF NOT EXISTS "updated_by" integer;

ALTER TABLE "authentication_methods" ADD COLUMN IF NOT EXISTS "authentication_method_key" text;

DROP TABLE IF EXISTS "company_rule_mapping";
DROP TABLE IF EXISTS "password_rules";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'company_authentication_map'
      AND column_name = 'company_specific_config'
  ) THEN
    ALTER TABLE "company_authentication_map"
      RENAME COLUMN "company_specific_config" TO "company_portal_config";
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'company_authentication_map'
      AND column_name = 'company_portal_config'
  ) THEN
    ALTER TABLE "company_authentication_map"
      RENAME COLUMN "company_portal_config" TO "company_portal_auth_config";
  END IF;
END
$$;

-- The following block can be used to revert the changes if necessary
-- ALTER TABLE "company_authentication_map" RENAME TO "company_authentication_mapping";
-- CREATE TABLE "company_logo" (
--   "id" SERIAL PRIMARY KEY,
--   "company_id" numeric NOT NULL,
--   "logo_url" text,
--   "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   "created_by" varchar NULL DEFAULT 'ADMIN',
--   "updated_by" varchar NULL DEFAULT 'ADMIN',
--   CONSTRAINT "UQ_company_logo_company_id" UNIQUE ("company_id")
-- );
-- INSERT INTO "company_logo" ("company_id", "logo_url")
--   SELECT "company_id", "company_logo"
--   FROM "company_portal_configuration"
--   WHERE "company_logo" IS NOT NULL;
-- ALTER TABLE "company_portal_configuration" DROP COLUMN "company_logo";
-- ALTER TABLE "company_portal_configuration" DROP COLUMN "company_portal_configuration";
-- ALTER TABLE "company_portal_configuration" DROP COLUMN "company_portal_dashboard_config";
-- ALTER TABLE "company_portal_configuration" DROP COLUMN "company_policy_config";
-- ALTER TABLE "company_portal_configuration" DROP COLUMN "company_logo_file_id";
-- ALTER TABLE "company_portal_configuration" RENAME COLUMN "company_id" TO "reference-id";
-- ALTER TABLE "company_portal_configuration" RENAME COLUMN "company_database_id" TO "database-id";
-- ALTER TABLE "company_portal_configuration" RENAME TO "config_company";
-- ALTER TABLE "authentication_methods" DROP COLUMN "authentication_method_key";
-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1
--     FROM information_schema.columns
--     WHERE table_name = 'company_authentication_map'
--       AND column_name = 'company_portal_config'
--   ) THEN
--     ALTER TABLE "company_authentication_map"
--       RENAME COLUMN "company_portal_config" TO "company_specific_config";
--   END IF;
-- END
-- $$;

-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1
--     FROM information_schema.columns
--     WHERE table_name = 'company_authentication_map'
--       AND column_name = 'company_portal_auth_config'
--   ) THEN
--     ALTER TABLE "company_authentication_map"
--       RENAME COLUMN "company_portal_auth_config" TO "company_portal_config";
--   END IF;
-- END
-- $$;

-- ALTER TABLE "company_portal_configuration" DROP COLUMN "company_portal_branding_config";
-- ALTER TABLE "company_portal_configuration" ADD COLUMN "company_logo" text;
-- ALTER TABLE "company_authentication_map" DROP COLUMN "authentication_method_key";

-- Company Configuration ACL and task mappings
BEGIN;

------------------------------------------------------------
-- 1) Create a new ACL category for Company Configuration
------------------------------------------------------------
INSERT INTO public.acl_categories (
    name,
    description,
    created_at,
    updated_at,
    created_by,
    updated_by,
    parent,
    category_key,
    application_scope
)
SELECT
    'Company Configuration',
    'Manage Company Configuration',
    NOW(),
    NOW(),
    'SYSTEM',
    'SYSTEM',
    'COMPANY_CONFIGURATION',
    'COMPANY_CONFIGURATION',
    'config-service'
WHERE NOT EXISTS (
    SELECT 1
    FROM public.acl_categories
    WHERE category_key = 'COMPANY_CONFIGURATION'
);

------------------------------------------------------------
-- 2) Map existing actions to the Company Configuration category
------------------------------------------------------------
INSERT INTO public.acl_category_action_map (
    acl_category_id,
    acl_action_id,
    created_at,
    updated_at,
    created_by,
    updated_by
)
SELECT
    c.id,
    a.id,
    NOW(),
    NOW(),
    'SYSTEM',
    'SYSTEM'
FROM public.acl_categories c
JOIN public.acl_actions a
  ON a.action_key IN (
        'READ_001',
        'WRITE_001',
        'UPDATE_001',
        'APPROVE_001'
     )
WHERE c.category_key = 'COMPANY_CONFIGURATION'
  AND NOT EXISTS (
      SELECT 1
      FROM public.acl_category_action_map cam
      WHERE cam.acl_category_id = c.id
        AND cam.acl_action_id   = a.id
  );

------------------------------------------------------------
-- 3) Grant Company Configuration permissions to Super User ONLY
------------------------------------------------------------
INSERT INTO public.role_acl_category_action_map (
    role_id,
    acl_category_action_id,
    created_at,
    updated_at,
    created_by,
    updated_by
)
SELECT
    r.id,
    cam.id,
    NOW(),
    NOW(),
    'SYSTEM',
    'SYSTEM'
FROM public.roles r
JOIN public.acl_category_action_map cam
  ON 1 = 1
JOIN public.acl_categories c
  ON c.id = cam.acl_category_id
WHERE c.category_key = 'COMPANY_CONFIGURATION'
  AND r.name = 'Super User'
  AND NOT EXISTS (
      SELECT 1
      FROM public.role_acl_category_action_map racam
      WHERE racam.role_id = r.id
        AND racam.acl_category_action_id = cam.id
  );

------------------------------------------------------------
-- 4) Map Company Configuration category actions to APIs
------------------------------------------------------------
INSERT INTO public.acl_category_action_api_map (
    acl_category_action_id,
    api,
    method,
    created_at,
    updated_at,
    created_by,
    updated_by
)
SELECT
    cam.id,
    'config-company' AS api,
    CASE a.action_key
        WHEN 'READ_001'   THEN 'GET'
        WHEN 'WRITE_001'  THEN 'POST'
        WHEN 'UPDATE_001' THEN 'PUT'
        WHEN 'APPROVE_001' THEN 'PUT'
        ELSE 'POST'
    END AS method,
    NOW(),
    NOW(),
    'SYSTEM',
    'SYSTEM'
FROM public.acl_category_action_map cam
JOIN public.acl_categories c
  ON c.id = cam.acl_category_id
JOIN public.acl_actions a
  ON a.id = cam.acl_action_id
WHERE c.category_key = 'COMPANY_CONFIGURATION'
  AND a.action_key IN (
        'READ_001',
        'WRITE_001',
        'UPDATE_001',
        'APPROVE_001'
    )
  AND NOT EXISTS (
      SELECT 1
      FROM public.acl_category_action_api_map api_map
    WHERE api_map.acl_category_action_id = cam.id
  );

-- Introduce detail tables for portal and authentication configurations
CREATE TABLE IF NOT EXISTS company_portal_configuration_detail (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  company_portal_dashboard_config JSONB,
  company_policy_config JSONB,
  company_portal_branding_config JSONB,
  is_company_config BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_by INTEGER,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_authentication_config (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  authentication_method_id INTEGER NOT NULL,
  company_portal_auth_config JSONB,
  created_by INTEGER,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_by INTEGER,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

ALTER TABLE "company_authentication_config"
  ADD COLUMN IF NOT EXISTS "authentication_method_key" text;

-- Ensure a single shared default record for USERNAME_PASSWORD with an empty JSON payload
INSERT INTO company_authentication_config (
  id,
  company_id,
  authentication_method_id,
  authentication_method_key,
  company_portal_auth_config,
  created_at,
  updated_at
)
SELECT
  1,
  0,
  COALESCE(
    (SELECT id FROM authentication_methods WHERE method_code = 'USERNAME_PASSWORD' LIMIT 1),
    0
  ),
  'DEFAULT_USERNAME_PASSWORD',
  '{}'::jsonb,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM company_authentication_config
  WHERE authentication_method_key = 'DEFAULT_USERNAME_PASSWORD'
);

ALTER TABLE "company_portal_configuration"
  ADD COLUMN IF NOT EXISTS "is_company_config" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "company_portal_configuration_detail_id" integer;

ALTER TABLE "company_authentication_map"
  ADD COLUMN IF NOT EXISTS "company_portal_auth_config_id" integer;

INSERT INTO company_portal_configuration_detail (
  company_id,
  company_portal_dashboard_config,
  company_policy_config,
  company_portal_branding_config,
  is_company_config,
  created_by,
  created_at,
  updated_by,
  updated_at
) 
SELECT DISTINCT ON (cpc.company_id)
  cpc.company_id,
  cpc.company_portal_dashboard_config,
  cpc.company_policy_config,
  cpc.company_portal_branding_config,
  TRUE,
  cpc.created_by,
  cpc.created_at,
  cpc.updated_by,
  cpc.updated_at
FROM company_portal_configuration cpc
WHERE (
  cpc.company_portal_dashboard_config IS NOT NULL OR
  cpc.company_policy_config IS NOT NULL OR
  cpc.company_portal_branding_config IS NOT NULL
)
  AND NOT EXISTS (
    SELECT 1
    FROM company_portal_configuration_detail detail
    WHERE detail.company_id = cpc.company_id
  )
ORDER BY cpc.company_id, cpc.id DESC;

UPDATE company_portal_configuration cpc
SET
  company_portal_configuration_detail_id = detail.id,
  is_company_config = TRUE
FROM company_portal_configuration_detail detail
WHERE cpc.company_id = detail.company_id;

INSERT INTO company_authentication_config (
  company_id,
  authentication_method_id,
  company_portal_auth_config,
  created_by,
  created_at,
  updated_by,
  updated_at
)
SELECT
  cam.company_id,
  cam.authentication_method_id,
  cam.company_portal_auth_config,
  cam.created_by,
  cam.created_at,
  cam.updated_by,
  cam.updated_at
FROM company_authentication_map cam
WHERE cam.company_portal_auth_config IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM company_authentication_config cac
    WHERE cac.company_id = cam.company_id
      AND cac.authentication_method_id = cam.authentication_method_id
  );

UPDATE company_authentication_map cam
SET company_portal_auth_config_id = cac.id
FROM company_authentication_config cac
WHERE cam.company_id = cac.company_id
  AND cam.authentication_method_id = cac.authentication_method_id
  AND cam.company_portal_auth_config IS NOT NULL;

ALTER TABLE "company_portal_configuration"
  DROP COLUMN IF EXISTS "company_portal_branding_config",
  DROP COLUMN IF EXISTS "company_portal_dashboard_config",
  DROP COLUMN IF EXISTS "company_policy_config";

ALTER TABLE "company_authentication_map"
  DROP COLUMN IF EXISTS "company_portal_auth_config";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_company_portal_configuration_detail'
      AND table_name = 'company_portal_configuration'
  ) THEN
    ALTER TABLE "company_portal_configuration"
      ADD CONSTRAINT fk_company_portal_configuration_detail
      FOREIGN KEY ("company_portal_configuration_detail_id")
      REFERENCES company_portal_configuration_detail(id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_company_portal_auth_config'
      AND table_name = 'company_authentication_map'
  ) THEN
    ALTER TABLE "company_authentication_map"
      ADD CONSTRAINT fk_company_portal_auth_config
      FOREIGN KEY ("company_portal_auth_config_id")
      REFERENCES company_authentication_config(id);
  END IF;
END
$$;

COMMIT;
