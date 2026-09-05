-- =============================================================================
-- cd-account-status-fix.sql
--
-- Fixes NULL cdAccountNumber and missing cdRunningBalance in:
--   • dashboard_policy_cards  (id = 22)
--   • policy_cd_summary       (id = 30)
--
-- ROOT CAUSE:
--   policy_cd_account and policy_cd_running_balance CTEs filter on
--   WHERE cd.status = 'ACTIVE' but CDs can also be 'CD_ACCOUNT_ACTIVE'.
--   The policy_cd CTE already uses IN ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
--   correctly — the other two CTEs were never updated to match.
--
--   Proof:
--     SELECT * FROM caution_deposit_policy_mapping WHERE policy_id = 649565
--     → caution_deposit_id = 421
--     SELECT * FROM caution_deposit WHERE id = 421
--     → cd_account_number is present, status = 'CD_ACCOUNT_ACTIVE'
--
-- FIX:
--   Change WHERE cd.status = 'ACTIVE' to
--         WHERE cd.status IN ('CD_ACCOUNT_ACTIVE', 'ACTIVE')
--   in both policy_cd_account and policy_cd_running_balance CTEs.
--
-- IDEMPOTENT: DO blocks skip if CD_ACCOUNT_ACTIVE already present.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Report id=22  dashboard_policy_cards
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_q  TEXT;
  old1 TEXT;
  new1 TEXT;
  old2 TEXT;
  new2 TEXT;
BEGIN
  SELECT query INTO v_q FROM admin_reports WHERE id = 22;
  IF v_q IS NULL THEN RAISE NOTICE 'id=22 not found — skip'; RETURN; END IF;

  -- policy_cd_account CTE — unique discriminator: ORDER BY cdpm.policy_id, cd.id
  old1 :=
    '  WHERE cd.status = ''ACTIVE''
  ORDER BY cdpm.policy_id, cd.id';
  new1 :=
    '  WHERE cd.status IN (''CD_ACCOUNT_ACTIVE'', ''ACTIVE'')
  ORDER BY cdpm.policy_id, cd.id';

  -- policy_cd_running_balance CTE — unique discriminator: ORDER BY ... cdt.updated_at
  old2 :=
    '  WHERE cd.status = ''ACTIVE''
  ORDER BY cdpm.policy_id, cdt.updated_at DESC, cdt.id DESC';
  new2 :=
    '  WHERE cd.status IN (''CD_ACCOUNT_ACTIVE'', ''ACTIVE'')
  ORDER BY cdpm.policy_id, cdt.updated_at DESC, cdt.id DESC';

  IF POSITION(old1 IN v_q) = 0 THEN
    RAISE NOTICE 'id=22 (dashboard_policy_cards): already patched — skip';
    RETURN;
  END IF;

  UPDATE admin_reports
  SET    query      = replace(replace(query, old1, new1), old2, new2),
         updated_at = NOW()
  WHERE  id = 22;

  RAISE NOTICE 'id=22 (dashboard_policy_cards): cd.status IN fix applied to policy_cd_account and policy_cd_running_balance';
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Report id=30  policy_cd_summary
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_q  TEXT;
  old1 TEXT;
  new1 TEXT;
  old2 TEXT;
  new2 TEXT;
BEGIN
  SELECT query INTO v_q FROM admin_reports WHERE id = 30;
  IF v_q IS NULL THEN RAISE NOTICE 'id=30 not found — skip'; RETURN; END IF;

  -- Same anchor strings — ORDER BY patterns are identical in this report too
  old1 :=
    '  WHERE cd.status = ''ACTIVE''
  ORDER BY cdpm.policy_id, cd.id';
  new1 :=
    '  WHERE cd.status IN (''CD_ACCOUNT_ACTIVE'', ''ACTIVE'')
  ORDER BY cdpm.policy_id, cd.id';

  old2 :=
    '  WHERE cd.status = ''ACTIVE''
  ORDER BY cdpm.policy_id, cdt.updated_at DESC, cdt.id DESC';
  new2 :=
    '  WHERE cd.status IN (''CD_ACCOUNT_ACTIVE'', ''ACTIVE'')
  ORDER BY cdpm.policy_id, cdt.updated_at DESC, cdt.id DESC';

  IF POSITION(old1 IN v_q) = 0 THEN
    RAISE NOTICE 'id=30 (policy_cd_summary): already patched — skip';
    RETURN;
  END IF;

  UPDATE admin_reports
  SET    query      = replace(replace(query, old1, new1), old2, new2),
         updated_at = NOW()
  WHERE  id = 30;

  RAISE NOTICE 'id=30 (policy_cd_summary): cd.status IN fix applied to policy_cd_account and policy_cd_running_balance';
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  id,
  name,
  CASE
    WHEN query LIKE '%policy_cd_account%'
         AND query LIKE '%IN (''CD_ACCOUNT_ACTIVE'', ''ACTIVE'')%'
      THEN 'OK — CD_ACCOUNT_ACTIVE included in both CTEs'
    WHEN query LIKE '%policy_cd_account%'
         AND query LIKE '%status = ''ACTIVE''%'
      THEN 'BROKEN — policy_cd_account still uses single ACTIVE status'
    ELSE 'CHECK MANUALLY'
  END AS cd_account_status
FROM admin_reports
WHERE id IN (22, 30)
ORDER BY id;

COMMIT;
