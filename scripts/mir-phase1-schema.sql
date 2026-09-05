-- ─────────────────────────────────────────────────────────────────────────────
-- MIR — Monthly Information Report · Phase-1 schema   (IIRM-758_MIR)
--
-- Creates:
--   1. mir_report          one row per generated MIR (company × period)
--   2. mstr_mir_section    master lookup for the 13 MIR sections (seed included)
--   3. mir_report_section  per-report, per-section CRM inputs + cell data
--
-- Business rules enforced at DB level:
--   BR-MIR-001 — UNIQUE (company_id, report_period) on mir_report
--   Section data de-duplicated via UNIQUE (report_id, section_id)
--
-- Idempotent: safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ─── 1. mir_report ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mir_report (
  id              SERIAL          PRIMARY KEY,
  company_id      INT             NOT NULL REFERENCES company(id) ON DELETE CASCADE,

  -- Period stored as 'MM-YYYY', e.g. '06-2026'.
  report_period   VARCHAR(7)      NOT NULL,

  -- Lifecycle values: draft | submitted | approved | rejected | published | acknowledged
  status          VARCHAR(50)     NOT NULL DEFAULT 'draft',

  overall_comments TEXT,

  -- Lead CRM's mandatory rejection comment (BR-MIR-005) — visible on the
  -- MIR form while back in draft; cleared once the Associate CRM resubmits.
  rejection_comment TEXT,

  created_by      INT             NOT NULL,
  updated_by      INT,

  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- BR-MIR-001: one MIR per company per period
ALTER TABLE mir_report
  ADD CONSTRAINT uq_mir_report_company_period
  UNIQUE (company_id, report_period);

-- Backfills rejection_comment onto tables created before this column existed.
ALTER TABLE mir_report ADD COLUMN IF NOT EXISTS rejection_comment TEXT;

CREATE INDEX IF NOT EXISTS idx_mir_report_company_id     ON mir_report(company_id);
CREATE INDEX IF NOT EXISTS idx_mir_report_report_period  ON mir_report(report_period);
CREATE INDEX IF NOT EXISTS idx_mir_report_status         ON mir_report(status);
CREATE INDEX IF NOT EXISTS idx_mir_report_created_by     ON mir_report(created_by);

-- ─── 2. mstr_mir_section ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mstr_mir_section (
  id            SERIAL        PRIMARY KEY,
  section_key   VARCHAR(10)   NOT NULL,   -- e.g. 's1' .. 's13'
  section_name  VARCHAR(200)  NOT NULL,
  display_order INT           NOT NULL
);

ALTER TABLE mstr_mir_section
  ADD CONSTRAINT uq_mstr_mir_section_key
  UNIQUE (section_key);

-- Seed the 13 sections (matches MIR_SECTION_MASTER in mir-report.service.ts)
INSERT INTO mstr_mir_section (section_key, section_name, display_order)
VALUES
  ('s1',  'Critical Issues Needing Your Immediate Attention', 1),
  ('s2',  'Claim Documentation',                              2),
  ('s3',  'Renewals Due in 3 Months',                        3),
  ('s4',  'Claims',                                          4),
  ('s5',  'Risk Matrix',                                     5),
  ('s6',  'Portfolio Detail',                                6),
  ('s7',  'Policy Insurer Details',                          7),
  ('s8',  'Head Count for Health Policies',                  8),
  ('s9',  'Cash Deposit Account',                            9),
  ('s10', 'Our Service Tracker',                             10),
  ('s11', 'Other Activities',                                11),
  ('s12', 'Current Month Plan',                              12),
  ('s13', 'Overall Comments',                                13)
ON CONFLICT (section_key) DO NOTHING;

-- ─── 3. mir_report_section ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mir_report_section (
  id              SERIAL      PRIMARY KEY,
  report_id       INT         NOT NULL REFERENCES mir_report(id) ON DELETE CASCADE,
  section_id      INT         NOT NULL REFERENCES mstr_mir_section(id),

  -- CRM free-text summary written for the whole section
  section_summary TEXT,

  -- Per-row CRM values keyed by frontend state key, e.g.:
  -- { "s1t1-0-3": "Renewal notice sent", "s5t1-0-2": true }
  cell_data       JSONB,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE mir_report_section
  ADD CONSTRAINT IF NOT EXISTS uq_mir_report_section_report_section
  UNIQUE (report_id, section_id);

CREATE INDEX IF NOT EXISTS idx_mir_report_section_report_id  ON mir_report_section(report_id);
CREATE INDEX IF NOT EXISTS idx_mir_report_section_section_id ON mir_report_section(section_id);
-- GIN index enables efficient JSONB key/value queries on cell_data
CREATE INDEX IF NOT EXISTS idx_mir_report_section_cell_data  ON mir_report_section USING GIN (cell_data);

COMMIT;
