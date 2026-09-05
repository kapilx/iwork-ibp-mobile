import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

// Durable staging table for HCL's "Employee Activate and Deactivation Service"
// interface (HCL Interface Document v1.4, 05-Feb-2024). HCL pushes employee/
// dependent lifecycle changes to our HclIntegrationController; every accepted
// call lands here first — never a direct write into policy_enrollment_employee
// / policy_enrollment_dependent — so RiskWatch can review it before an admin
// turns it into a real endorsement. See:
// docs/HCL-Employee-Interface-Sync/HCL-Employee-Interface-Sync-TRD.md §5.1.
export const HCL_INTAKE_STATUS = {
  RECEIVED: "RECEIVED",
  PROCESSING: "PROCESSING",
  PROCESSED: "PROCESSED",
  FAILED: "FAILED",
} as const;
export type HclIntakeStatus =
  (typeof HCL_INTAKE_STATUS)[keyof typeof HCL_INTAKE_STATUS];

@Entity({ name: "hcl_employee_intake" })
@Index(["ein"])
@Index(["status"])
export class HclEmployeeIntake {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  // One of the document's seven documented Flag_operationType values:
  // AD, BI, DD, ED, ES, ET, NA.
  @Column({ name: "flag_operation_type", type: "varchar", length: 2 })
  flagOperationType!: string;

  @Column({ name: "groupcode", type: "varchar", length: 100, nullable: true })
  groupcode?: string | null;

  // As received from HCL, verbatim (may be a placeholder like "NA" in test
  // payloads — see policyNo resolution note on policyId below).
  @Column({ name: "policy_no", type: "varchar", length: 100, nullable: true })
  policyNo?: string | null;

  // Best-effort resolved from policyNo via Policy.insurerPolicyNumber.
  // Nullable — HCL's own sample payloads use placeholder policy numbers
  // ("900020001111", "NA") that won't resolve to a real policy. A record
  // with a null policyId is still stored (for traceability/visibility) but
  // is not eligible for endorsement generation until resolved.
  @Column({ name: "policy_id", type: "int", nullable: true })
  policyId?: number | null;

  @Column({ name: "company_id", type: "int", nullable: true })
  companyId?: number | null;

  // From E_EMP_HCL.EIN — HCL's employee identifier.
  @Column({ name: "ein", type: "varchar", length: 50 })
  ein!: string;

  // From E_DEP_HCL[].HCL_DEPID (when this record concerns a specific
  // dependent) or root-level Del_hcldepid (for DD). Null for employee-only
  // operations (ED, ES, and AD/BI/ET/NA rows with no dependent context).
  @Column({ name: "hcl_depid", type: "int", nullable: true })
  hclDepid?: number | null;

  // From the relevant CHECK_SUM field. Used for dedup (§7 of the TRD) —
  // never algorithmically verified, since HCL has not documented the
  // hashing algorithm.
  @Column({ name: "check_sum", type: "varchar", length: 255, nullable: true })
  checkSum?: string | null;

  // Full request body, verbatim, for traceability and re-processing.
  @Column({ name: "raw_payload", type: "jsonb" })
  rawPayload!: Record<string, unknown>;

  // Flattened E_EMP_HCL, for quick RiskWatch rendering without re-parsing
  // rawPayload.
  @Column({ name: "parsed_employee", type: "jsonb" })
  parsedEmployee!: Record<string, unknown>;

  // Flattened E_DEP_HCL[], "[]" if the operation carries none.
  @Column({ name: "parsed_dependents", type: "jsonb", default: () => "'[]'" })
  parsedDependents!: Record<string, unknown>[];

  @Column({
    name: "status",
    type: "varchar",
    length: 20,
    default: HCL_INTAKE_STATUS.RECEIVED,
  })
  status!: HclIntakeStatus;

  // Populated when status = FAILED (TRD §11).
  @Column({ name: "failure_reason", type: "text", nullable: true })
  failureReason?: string | null;

  // Populated once the linked endorsement is created (status -> PROCESSED).
  @Column({ name: "endorsement_id", type: "int", nullable: true })
  endorsementId?: number | null;

  // Set once this record is submitted into the existing enrollment-upload
  // pipeline (status -> PROCESSING); used to reconcile back to
  // PROCESSED/FAILED once document_processing_file finishes (TRD §10).
  @Column({ name: "document_processing_file_id", type: "int", nullable: true })
  documentProcessingFileId?: number | null;

  @Column({ name: "created_by", type: "int", default: 0 })
  createdBy!: number;

  @Column({ name: "updated_by", type: "int", default: 0 })
  updatedBy!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @Column({ name: "processed_at", type: "timestamptz", nullable: true })
  processedAt?: Date | null;
}
