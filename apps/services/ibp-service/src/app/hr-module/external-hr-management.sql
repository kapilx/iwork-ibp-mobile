-- ═══════════════════════════════════════════════════════════════════════════════
-- External HR Management Setup
-- ───────────────────────────────────────────────────────────────────────────────
-- Run once against the target database.
--
-- What this script does:
--   1. Creates the ROLE_EXTERNAL_HR role in the `roles` table (idempotent).
--   2. Patches `portfolio_company_policies` report to scope results to only the
--      policies an External HR user is allowed to see (via external_hr_policy_map).
--
-- Why ROLE_EXTERNAL_HR is required:
--   When an External HR user is created via POST /hr-module/external-hr, the
--   service assigns this role in `user_role`. The role appears in the JWT
--   `userDetails.roles` payload and identifies the user type in business logic.
--
-- ACL note:
--   All /hr-module/* paths bypass the ACL guard (acl.guard.ts line 97).
--   ACL table entries are therefore NOT needed at this stage; access control for
--   External HR users is enforced at the data layer through externalHrUserId
--   scoping in report queries.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1.  Create ROLE_EXTERNAL_HR in the roles table (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.roles (name, description, role_key, created_at, updated_at, created_by, updated_by)
SELECT
  'External HR',
  'External HR user with policy-based and location-based access to the IBP portal',
  'ROLE_EXTERNAL_HR',
  NOW(),
  NOW(),
  'SYSTEM',
  'SYSTEM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles WHERE role_key = 'ROLE_EXTERNAL_HR'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2.  Patch portfolio_company_policies — add externalHrUserId policy scoping
-- ─────────────────────────────────────────────────────────────────────────────
-- When externalHrUserId is provided (i.e. the logged-in user is an External HR),
-- only policies present in external_hr_policy_map for that user are returned.
-- When it is NULL (HR Admin / CRM users), all company policies are returned.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  report_id INTEGER;
BEGIN
  SELECT id INTO report_id
  FROM public.admin_reports
  WHERE name = 'portfolio_company_policies';

  IF report_id IS NULL THEN
    RAISE NOTICE 'portfolio_company_policies report not found — skipping patch';
    RETURN;
  END IF;

  UPDATE public.admin_reports
  SET query = $newq$
WITH policy_insurer AS (
  SELECT DISTINCT ON (pim.policy_id)
    pim.policy_id,
    i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
),
policy_tpa AS (
  SELECT DISTINCT ON (ptm.policy_id)
    ptm.policy_id,
    t.name AS tpa_name
  FROM policy_tpa_map ptm
  INNER JOIN tpa t ON t.id = ptm.tpa_id
  ORDER BY ptm.policy_id, ptm.id
)
SELECT
  p.id                                                           AS "policyId",
  p.company_id                                                   AS "companyId",
  COALESCE(iirm_ld.value, ld.value)                             AS "policyTypeCode",
  ld.value                                                       AS "policyTypeName",
  pi.insurer_name                                                AS "insurerName",
  COALESCE(pt.tpa_name, '—')                                    AS "tpaName",
  p.insurer_policy_number                                        AS "policyNumber",
  p.net_premium                                                  AS "premiumAmount",
  TO_CHAR(p.policy_from, 'DD/MM/YYYY')                          AS "startDate",
  TO_CHAR(p.policy_to,   'DD/MM/YYYY')                          AS "endDate",
  CASE
    WHEN p.policy_to <  CURRENT_DATE                             THEN 'Expired'
    WHEN p.policy_to <= CURRENT_DATE + INTERVAL '60 days'        THEN 'Renewal Due'
    ELSE 'Active'
  END                                                            AS "policyStatus"
FROM policy p
LEFT JOIN lookup_data ld              ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
LEFT JOIN policy_type_segregation pts ON pts.policy_type_lid = p.policy_type_lid
LEFT JOIN lookup_data iirm_ld         ON iirm_ld.id = pts.iirm_policy_type_lid AND iirm_ld.deleted_at IS NULL
LEFT JOIN policy_insurer pi           ON pi.policy_id = p.id
LEFT JOIN policy_tpa pt               ON pt.policy_id = p.id
WHERE p.company_id = ###companyId###
  AND (###externalHrUserId### IS NULL
       OR p.id IN (
         SELECT policy_id
         FROM external_hr_policy_map
         WHERE user_id = ###externalHrUserId###::INTEGER
       ))
ORDER BY p.policy_from DESC
$newq$
  WHERE id = report_id;

  -- Register externalHrUserId parameter (idempotent)
  INSERT INTO public.admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  ) VALUES (
    report_id,
    'externalHrUserId',
    'External HR User ID',
    '###externalHrUserId###',
    'number',
    'SYSTEM',
    'SYSTEM',
    'input',
    'none',
    '{}'::jsonb,
    99
  )
  ON CONFLICT (admin_report_id, parameter_name) DO NOTHING;

  RAISE NOTICE 'portfolio_company_policies: externalHrUserId policy scoping applied.';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  r.name           AS role_name,
  r.role_key,
  ar.name          AS report_name,
  CASE
    WHEN ar.query LIKE '%externalHrUserId%' THEN 'OK — externalHrUserId scoping present'
    ELSE 'PATCH DID NOT APPLY — check for errors above'
  END              AS patch_status
FROM public.roles r
CROSS JOIN public.admin_reports ar
WHERE r.role_key  = 'ROLE_EXTERNAL_HR'
  AND ar.name     = 'portfolio_company_policies';

COMMIT;
