-- HCL Employee Interface Sync — staging/intake table.
--
-- HCL's HRMS pushes employee/dependent lifecycle changes (Activate/Deactivate,
-- Bulk Insert, Dependent Delete, Demise, Separation, Transfer, Natural
-- Addition — HCL Interface Document v1.4, 05-Feb-2024) to our new inbound
-- endpoint (ibp-service, hcl-integration module). Every accepted call is
-- landed here first — never written directly into policy_enrollment_employee
-- / policy_enrollment_dependent — so an HR/Ops admin can review it in
-- RiskWatch and turn selected records into a real endorsement via the
-- existing enrollment-upload pipeline.
--
-- See docs/HCL-Employee-Interface-Sync/HCL-Employee-Interface-Sync-TRD.md §5.1
-- for the full design, including the processing-status lifecycle (§6) and the
-- reconciliation mechanism that moves a record from PROCESSING to
-- PROCESSED/FAILED once the existing pipeline finishes (§10).
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS hcl_employee_intake (
    id                            SERIAL PRIMARY KEY,
    flag_operation_type           VARCHAR(2) NOT NULL,
    groupcode                     VARCHAR(100),
    policy_no                     VARCHAR(100),
    policy_id                     INT REFERENCES policy(id),
    company_id                    INT REFERENCES company(id),
    ein                           VARCHAR(50) NOT NULL,
    hcl_depid                     INT,
    check_sum                     VARCHAR(255),
    raw_payload                   JSONB NOT NULL,
    parsed_employee               JSONB NOT NULL,
    parsed_dependents             JSONB NOT NULL DEFAULT '[]',
    status                        VARCHAR(20) NOT NULL DEFAULT 'RECEIVED',
    failure_reason                TEXT,
    endorsement_id                INT REFERENCES endorsement(id),
    document_processing_file_id   INT REFERENCES document_processing_file(id),
    created_by                    INT NOT NULL DEFAULT 0,
    updated_by                    INT NOT NULL DEFAULT 0,
    created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at                  TIMESTAMPTZ,

    CONSTRAINT chk_hcl_employee_intake_status
        CHECK (status IN ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED')),
    CONSTRAINT chk_hcl_employee_intake_operation_type
        CHECK (flag_operation_type IN ('AD', 'BI', 'DD', 'ED', 'ES', 'ET', 'NA'))
);

CREATE INDEX IF NOT EXISTS idx_hcl_employee_intake_ein ON hcl_employee_intake (ein);
CREATE INDEX IF NOT EXISTS idx_hcl_employee_intake_status ON hcl_employee_intake (status);
CREATE INDEX IF NOT EXISTS idx_hcl_employee_intake_policy_id ON hcl_employee_intake (policy_id);
CREATE INDEX IF NOT EXISTS idx_hcl_employee_intake_company_id ON hcl_employee_intake (company_id);

-- Best-effort dedup key (TRD §7): (ein, check_sum) is the best mechanism the
-- HCL document actually supports (no request/transaction ID field exists in
-- the interface) — not a guaranteed idempotency key, since CHECK_SUM's
-- derivation is undocumented. Partial index so rows with a NULL check_sum
-- (shouldn't happen in practice, but the document doesn't mark it required
-- on every sub-shape) don't collide against each other.
CREATE UNIQUE INDEX IF NOT EXISTS uq_hcl_employee_intake_ein_checksum
    ON hcl_employee_intake (ein, check_sum)
    WHERE check_sum IS NOT NULL;
