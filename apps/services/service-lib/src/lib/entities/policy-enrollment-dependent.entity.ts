import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { SensitiveField } from "../field-encryption/decorators/sensitive-field.decorator";
import { Auditable, SkipAudit } from "../audit-history";
import { PolicyEnrollmentEmployee } from "./policy-enrollment-employee.entity";
import { Policy } from "./policy.entity";

@Entity("policy_enrollment_dependent")
@Index(["employeeId", "relation"])
@Auditable()
export class PolicyEnrollmentDependent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "policy_id", type: "int", nullable: true })
  policyId?: number | null;

  @Column({ name: "employee_id", type: "int" })
  employeeId!: number;

  @Column({ name: "name", type: "varchar", length: 100 })
  name!: string;

  @Column({ name: "relation", type: "varchar", length: 50 })
  relation!: string;

  @Column({ name: "relationship_type", type: "varchar", length: 50, nullable: true })
  relationshipType?: string;

  @SensitiveField({ deterministic: true })
  @Column({ name: "date_of_birth_enc", type: "text", nullable: true })
  dateOfBirth?: Date;

  @Column({ name: "gender", type: "varchar", length: 20, nullable: true })
  gender?: string;

  @Column({ name: "claim_status", type: "varchar", length: 10, nullable: true })
  claimStatus?: string | null;

  @Column({
    name: "dependent_tpa_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  dependentTpaId?: string | null;

  @Column({ name: "enrollment_addition_batch_id", type: "int", nullable: true })
  enrollmentAdditionBatchId?: number | null;

  @Column({ name: "enrollment_deletion_batch_id", type: "int", nullable: true })
  enrollmentDeletionBatchId?: number | null;

  @Column({ name: "effective_date", type: "date", nullable: true })
  effectiveDate?: Date | null;

  @Column({ name: "document_ids", type: "jsonb", nullable: true })
  documentIds?: number[] | null;

  @Column({ name: "is_life_event", type: "boolean", default: false })
  isLifeEvent!: boolean;

  @Column({
    name: "endorsement_addition_batch_id",
    type: "int",
    nullable: true,
  })
  endorsementAdditionBatchId?: number | null;

  @Column({
    name: "endorsement_deletion_batch_id",
    type: "int",
    nullable: true,
  })
  endorsementDeletionBatchId?: number | null;

  @Column({
    name: "addition_endorsement_id",
    type: "int",
    nullable: true,
  })
  additionEndorsementId?: number | null;

  @Column({
    name: "deletion_endorsement_id",
    type: "int",
    nullable: true,
  })
  deletionEndorsementId?: number | null;

  @Column({
    name: "endorsement_addition_created_at",
    type: "timestamp",
    nullable: true,
  })
  endorsementAdditionCreatedAt?: Date | null;

  @Column({
    name: "endorsement_deletion_created_at",
    type: "timestamp",
    nullable: true,
  })
  endorsementDeletionCreatedAt?: Date | null;

  @Column({ name: "endorsement_updation_file_id", type: "int", nullable: true })
  endorsementUpdationFileId?: number;

  @Column({
    name: "endorsement_updation_created_at",
    type: "timestamp",
    nullable: true,
  })
  endorsementUpdationCreatedAt?: Date;

  @Column({
    name: "endorsement_status_key",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  endorsementStatusKey?: string | null;

  @Column({ name: "bypass_premium_amount", type: "numeric", precision: 19, scale: 2, nullable: true })
  bypassPremiumAmount?: number | null;

  @Column({ name: "bypass_sum_insured", type: "numeric", precision: 19, scale: 2, nullable: true })
  bypassSumInsured?: number | null;

  @Column({ name: "additional_attributes", type: "jsonb", nullable: true })
  additionalAttributes?: Record<string, any>;

  @Column({ name: "created_by", type: "int", default: 0 })
  @SkipAudit()
  createdBy!: number;

  @Column({ name: "updated_by", type: "int", default: 0 })
  @SkipAudit()
  updatedBy!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  @SkipAudit()
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  @SkipAudit()
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  @SkipAudit()
  deletedAt?: Date;

  @ManyToOne(() => Policy, { onDelete: "CASCADE" })
  @JoinColumn({ name: "policy_id" })
  policy!: Policy | null;

  @ManyToOne(() => PolicyEnrollmentEmployee, { onDelete: "CASCADE" })
  @JoinColumn({ name: "employee_id" })
  companyEmployee!: PolicyEnrollmentEmployee;
}
