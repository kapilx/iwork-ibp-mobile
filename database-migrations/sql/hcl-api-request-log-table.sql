-- HCL Employee Interface Sync — per-request API audit log
-- (see docs/HCL-Employee-Interface-Sync/HCL-Employee-Interface-Sync-TRD.md
-- §16).
--
-- One row PER INBOUND HTTP CALL to the HCL integration — deliberately
-- separate from hcl_employee_intake, which stores one row PER EMPLOYEE/
-- DEPENDENT (a single call carrying multiple employees duplicates the same
-- raw payload across each of those rows, on purpose, for per-record
-- traceability — that stays exactly as-is). This table answers a different
-- question: what did HCL actually send us on the wire for a given call, and
-- what did we send back — independent of how many (if any)
-- hcl_employee_intake rows that call produced.

CREATE TABLE IF NOT EXISTS hcl_api_request_log (
    id                SERIAL PRIMARY KEY,
    endpoint          VARCHAR(255) NOT NULL,
    http_method       VARCHAR(10) NOT NULL,
    request_ip        VARCHAR(64),
    request_headers   JSONB,
    request_payload   JSONB,
    response_status   INT,
    response_payload  JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hcl_api_request_log_created_at ON hcl_api_request_log (created_at);
