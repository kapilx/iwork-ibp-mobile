-- ─────────────────────────────────────────────────────────────────────────────
-- MIR — Monthly Information Report · Status action seed (IIRM-758_MIR)
--
-- Registers every lifecycle status/action MirReportService validates
-- (draft, submitted, approve, reject, publish, acknowledge) as lookup_data
-- rows, so the service can check the DB instead of relying solely on
-- hardcoded strings — any of these can be disabled by flipping its status
-- here without a code deploy.
--
-- organisation_id = 0: these are universal workflow verbs, not an
-- org-specific catalog (same convention as CONTACT_RECORD_TYPE, TYPE_OF_BUSINESS).
--
-- Idempotent: safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- lookup_key has only a plain (non-unique) index, not a unique constraint,
-- so ON CONFLICT isn't usable here — guard idempotency with NOT EXISTS instead.
INSERT INTO lookup_data (lookup_key, lookup_name, value_key, value, status, organisation_id, created_by, updated_by, lookup_order)
SELECT * FROM (VALUES
  ('MIR_STATUS_DRAFT',       'MIR_STATUS', 'DRAFT',       'draft',       1, 0, 'SYSTEM', 'SYSTEM', 1),
  ('MIR_STATUS_SUBMITTED',   'MIR_STATUS', 'SUBMITTED',   'submitted',   1, 0, 'SYSTEM', 'SYSTEM', 2),
  ('MIR_STATUS_APPROVE',     'MIR_STATUS', 'APPROVE',     'approve',     1, 0, 'SYSTEM', 'SYSTEM', 3),
  ('MIR_STATUS_REJECT',      'MIR_STATUS', 'REJECT',      'reject',      1, 0, 'SYSTEM', 'SYSTEM', 4),
  ('MIR_STATUS_PUBLISH',     'MIR_STATUS', 'PUBLISH',     'publish',     1, 0, 'SYSTEM', 'SYSTEM', 5),
  ('MIR_STATUS_ACKNOWLEDGE', 'MIR_STATUS', 'ACKNOWLEDGE', 'acknowledge', 1, 0, 'SYSTEM', 'SYSTEM', 6)
) AS seed(lookup_key, lookup_name, value_key, value, status, organisation_id, created_by, updated_by, lookup_order)
WHERE NOT EXISTS (
  SELECT 1 FROM lookup_data ld WHERE ld.lookup_key = seed.lookup_key
);

COMMIT;
