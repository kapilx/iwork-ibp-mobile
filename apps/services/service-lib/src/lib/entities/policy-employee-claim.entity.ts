import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Auditable, SkipAudit } from "../audit-history";
import { Company } from "./company.entity";
import { FileUpload } from "./file-upload.entity";
import { Opportunity } from "./opportunity.entity";
import { PolicyClaimSettlement } from "./policy-employee-claim-settlement.entity";
import { PolicyEnrollmentDependent } from "./policy-enrollment-dependent.entity";
import { PolicyEnrollmentEmployee } from "./policy-enrollment-employee.entity";
import { Policy } from "./policy.entity";

@Entity("policy_claim")
@Index(["employeeId", "policyId"])
@Auditable()
export class PolicyClaim {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "policy_id", type: "int" })
  policyId!: number;

  @Column({ name: "employee_id", type: "int" })
  employeeId!: number;

  @Column({ name: "employee_tpa_id", type: "varchar", length: 100, nullable: true })
  employeeTpaId?: string | null;

  @Column({ name: "company_employee_id", type: "varchar", length: 100, nullable: true })
  companyEmployeeId?: string | null;

  @Column({
    name: "claim_insured_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  claimInsuredId?: string | null;

  @Column({ name: "dependent_id", type: "int", nullable: true })
  dependentId?: number | null;

  @Column({
    name: "clm_hospital",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  claimHospital?: string | null;

  @Column({
    name: "clm_hospital_location",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  claimHospitalLocation?: string | null;

  @Column({ name: "hospital_id", type: "int", nullable: true })
  hospitalId?: number | null;

  @Column({ name: "clm_doa", type: "date", nullable: true })
  claimDateOfAdmission?: Date | null;

  @Column({ name: "clm_dod", type: "date", nullable: true })
  claimDateOfDischarge?: Date | null;

  @Column({ name: "claim_dt", type: "date", nullable: true })
  claimDate?: Date | null;

  @Column({ name: "clm_type", type: "varchar", length: 50, nullable: true })
  claimType?: string | null;

  // Required by some MULTI-flow TPAs at intimation (Health India's benefiT_TYPE) — persisted
  // so a later resubmission call (e.g. Health India's GetClaimIntimationWithDMS, which repeats
  // the full intimation payload) can reconstruct it without asking the employee twice.
  @Column({ name: "benefit_type", type: "varchar", length: 50, nullable: true })
  benefitType?: string | null;

  @Column({ name: "claim_amount", type: "numeric", nullable: true })
  claimAmount?: number | null;

  @Column({ name: "claim_description", type: "text", nullable: true })
  claimDescription?: string | null;

  @Column({ name: "claim_status", type: "varchar", length: 50, nullable: true })
  claimStatus?: string | null;

  @Column({
    name: "clm_pre_auth_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  claimPreAuthId?: string | null;

  @Column({ name: "claim_checklist", type: "text", nullable: true })
  claimChecklist?: string | null;

  @Column({ name: "clm_bill_details", type: "text", nullable: true })
  claimBillDetails?: string | null;

  @Column({ name: "clm_allowed_amt", type: "numeric", nullable: true })
  claimAllowedAmount?: number | null;

  @Column({ name: "clm_pre_auth_date", type: "date", nullable: true })
  claimPreAuthDate?: Date | null;

  @Column({ name: "clm_pre_auth_amt", type: "numeric", nullable: true })
  claimPreAuthAmount?: number | null;

  @Column({
    name: "clm_allowed_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  claimAllowedId?: string | null;

  @Column({ name: "claim_checklist_count", type: "int", nullable: true })
  claimChecklistCount?: number | null;

  @Column({ name: "document_ids", type: "jsonb", nullable: true })
  documentIds?: { documentId: number; documentType: string }[] | null;

  // TPA-specific fields collected at intimation via the admin-configured USER_INPUT
  // payload field mapping (tpa_payload_field_mapping) — fields the framework can't
  // source from our own DB, so the claimant is asked directly. Persisted here so a
  // resubmission-style Submit Claim call can reconstruct the original intimation
  // payload the same way it already does for canonical fields.
  @Column({ name: "extra_fields", type: "jsonb", nullable: true })
  extraFields?: Record<string, any> | null;

  @Column({ name: "user_id", type: "text", nullable: true })
  userId?: string | null;

  @Column({ name: "source_file_upload_id", type: "int", nullable: true })
  sourceFileUploadId?: number | null;

  @Column({ name: "company_id", type: "int", nullable: true })
  companyId?: number;

  @Column({ name: "opportunity_id", type: "int", nullable: true })
  opportunityId?: number;

  @Column({
    name: "claim_number",
    type: "varchar",
    length: 50,
    unique: true,
    nullable: true,
  })
  claimNumber?: string;

  @Column({
    name: "company_name",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  companyName?: string | null;

  @Column({
    name: "policy_number",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  policyNumber?: string | null;

  @Column({ name: "policy_tpa_id", type: "int", nullable: true })
  policyTpaId?: number | null;

  @Column({ name: "policy_type", type: "varchar", length: 100, nullable: true })
  policyType?: string | null;

  @Column({ name: "policy_start_date", type: "date", nullable: true })
  policyStartDate?: Date | null;

  @Column({ name: "policy_end_date", type: "date", nullable: true })
  policyEndDate?: Date | null;

  @Column({ name: "employee_name", type: "varchar", length: 100, nullable: true })
  employeeName?: string | null;

  @Column({ name: "patient_name", type: "varchar", length: 100, nullable: true })
  patientName?: string | null;

  @Column({
    name: "patient_relation",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  patientRelation?: string | null;

  @Column({ name: "patient_tpa_id", type: "varchar", length: 100, nullable: true })
  patientTpaId?: string | null;

  @Column({ name: "total_sum_insured", type: "numeric", nullable: true })
  totalSumInsured?: number | null;

  @Column({
    name: "total_available_balance",
    type: "numeric",
    nullable: true,
  })
  totalAvailableBalance?: number | null;

  @Column({
    name: "active_activity",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  activeActivity?: string;

  @Column({
    name:"place_of_accident",
    type: "varchar",
    length:255,
    nullable: true
  })
  placeOfAccident?:string;

  @Column({ name: "tpa_claim_no", type: "varchar", length: 100, nullable: true })
  tpaClaimNo?: string | null;

  @Column({ name: "tpa_claim_ref_id", type: "int", nullable: true })
  tpaClaimRefId?: number | null;

  // The TPA's own claim reference (same value as tpaClaimNo), duplicated here as a
  // plain string dedup key — this is the column the pull-side sync mechanism
  // (TpaAppRefForm's "Dedup column (ref_claim_id)" admin setting, GenericTpaSyncScheduler's
  // predecessor) matches against to detect "this claim already exists, update don't
  // duplicate" on re-sync. Existed in the DB (with its own index,
  // idx_pc_ref_claim_id) but was never mapped on this entity, so the push-side flow
  // (deliverIntimationJob) had no way to populate it — a claim delivered via the push
  // flow was invisible to that dedup check. Fixed by setting this alongside
  // tpaClaimNo once the TPA accepts the claim.
  @Column({ name: "ref_claim_id", type: "varchar", length: 100, nullable: true })
  refClaimId?: string | null;

  @Column({ name: "created_by", type: "int", nullable: true })
  @SkipAudit()
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  @SkipAudit()
  updatedBy?: number;

  @ManyToOne(() => FileUpload)
  @JoinColumn({ name: "source_file_upload_id" })
  sourceFileUpload!: FileUpload;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  @SkipAudit()
  deletedAt?: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  @SkipAudit()
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  @SkipAudit()
  updatedAt!: Date;

  @ManyToOne(() => Policy, { onDelete: "CASCADE" })
  @JoinColumn({ name: "policy_id" })
  policy!: Policy;

  @ManyToOne(() => Company)
  @JoinColumn({ name: "company_id" })
  company?: Relation<Company>;

  @ManyToOne(() => Opportunity)
  @JoinColumn({ name: "opportunity_id" })
  opportunity?: Relation<Opportunity>;

  @ManyToOne(() => PolicyEnrollmentEmployee, { onDelete: "CASCADE" })
  @JoinColumn({ name: "employee_id" })
  employee!: PolicyEnrollmentEmployee;

  @ManyToOne(() => PolicyEnrollmentDependent, { onDelete: "SET NULL" })
  @JoinColumn({ name: "dependent_id" })
  dependent?: PolicyEnrollmentDependent;

  @OneToMany(
    () => PolicyClaimSettlement,
    (settlement) => settlement.claim,
    { cascade: true }
  )
  settlements?: PolicyClaimSettlement[];
}
