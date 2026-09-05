import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  DeleteDateColumn,
} from "typeorm";
import { PolicyEnrollmentEmployee } from "./policy-enrollment-employee.entity";
import { Policy } from "./policy.entity";

@Entity("policy_enrollment_employee_policy_map")
@Index(["employeeId", "policyId"], { unique: true })
export class PolicyEnrollmentEmployeePolicyMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "employee_id", type: "int" })
  employeeId!: number;

  @Column({ name: "policy_id", type: "int" })
  policyId!: number;

  @Column({ name: "enrollment_start_date", type: "date", nullable: true })
  enrollmentStartDate?: Date | null;

  @Column({ name: "enrollment_end_date", type: "date", nullable: true })
  enrollmentEndDate?: Date | null;

  @Column({ name: "claim_status", type: "varchar", length: 10, nullable: true })
  claimStatus?: string | null;

  @Column({
    name: "employee_tpa_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  employeeTpaId?: string | null;

  @Column({ name: "effective_date", type: "date", nullable: true })
  effectiveDate?: Date | null;

  @Column({ name: "enrollment_addition_batch_id", type: "int", nullable: true })
  enrollmentAdditionBatchId?: number | null;

  @Column({ name: "enrollment_deletion_batch_id", type: "int", nullable: true })
  enrollmentDeletionBatchId?: number | null;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date;

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
    name: "endorsement_status_key",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  endorsementStatusKey?: string | null;

  @Column({ name: "additional_params", type: "jsonb", nullable: true })
  additionalParams?: Record<string, any>;

  @Column({
    name: "is_on_borading_mail_sent",
    type: "boolean",
    default: true,
  })
  isOnBoradingMailSent!: boolean;

  @Column({
    name: "is_confirmation_mail_sent",
    type: "boolean",
    default: false,
  })
  isConfirmationMailSent!: boolean;

  @Column({
    name: "is_parental_lock_enabled",
    type: "boolean",
    nullable: true,
  })
  isParentalLockEnabled?: boolean | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => PolicyEnrollmentEmployee, { onDelete: "CASCADE" })
  @JoinColumn({ name: "employee_id" })
  employee!: PolicyEnrollmentEmployee;

  @ManyToOne(() => Policy, { onDelete: "CASCADE" })
  @JoinColumn({ name: "policy_id" })
  policy!: Policy;
}
