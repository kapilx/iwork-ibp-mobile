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
  UpdateDateColumn,
} from "typeorm";
import { Auditable, SkipAudit } from "../audit-history";
import { Company } from "./company.entity";
import { PolicyEmployeeEnrollment } from "./policy-employee-enrollment.entity";
import { SensitiveField } from "../field-encryption/decorators/sensitive-field.decorator";
import { PolicyEnrollmentDependent } from "./policy-enrollment-dependent.entity";

@Entity("policy_enrollment_employee")
@Index(["employeeCompanyId"])
@Index("uq_pee_empco_companyemp_active", ["companyId", "companyEmployeeId"], { unique: true })
@Auditable()
export class PolicyEnrollmentEmployee {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: "company_employee_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  companyEmployeeId?: string | null;

  // Identifier of the company owning the policy
  @Column({ name: "employee_company_id", type: "varchar", length: 100 })
  employeeCompanyId!: string;

  @Column({ name: "company_id", type: "int", nullable: true })
  companyId?: number;

  @Column({ name: "user_id", type: "int", nullable: true })
  userId?: number;

  @Column({ name: "employee_name", type: "varchar", length: 100 })
  employeeName!: string;

  @Column({ name: "full_name", type: "varchar", length: 100, nullable: true })
  fullName?: string;

  @SensitiveField({ deterministic: true })
  @Column({ name: "date_of_birth_enc", type: "text", nullable: true })
  dateOfBirth?: Date;

  @Column({ name: "gender", type: "varchar", length: 20, nullable: true })
  gender?: string;

  @SensitiveField({ deterministic: true })
  @Column({ name: "email_enc", type: "text", nullable: true })
  email?: string;

  @SensitiveField({ deterministic: true })
  @Column({ name: "phone_number_enc", type: "text", nullable: true })
  phoneNumber?: string;

  @Column({
    name: "alternate_phone_number",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  alternatePhoneNumber?: string;

  @Column({ name: "alternate_email", type: "varchar", length: 50, nullable: true })
  alternateEmail?: string;

  @Column({ name: "ctc", type: "numeric", nullable: true })
  ctc?: number;

  @Column({ name: "designation", type: "varchar", length: 100, nullable: true })
  designation?: string;

  @Column({
    name: "employee_tpa_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  employeeTpaId?: string | null;

  @Column({
    name: "relation_group",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  relationGroup?: string;

  @Column({
    name: "marital_status",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  maritalStatus?: string;

  @Column({ name: "policy_location", type: "varchar", length: 255, nullable: true })
  policyLocation?: string | null;

  @Column({ name: "policy_config_location_id", type: "int", nullable: true })
  policyConfigLocationId?: number | null;

  @Column({ name: "additional_params", type: "jsonb", nullable: true })
  additionalParams?: Record<string, any>;

  @Column({ name: "bypass_premium_amount", type: "numeric", precision: 19, scale: 2, nullable: true })
  bypassPremiumAmount?: number | null;

  @Column({ name: "bypass_sum_insured", type: "numeric", precision: 19, scale: 2, nullable: true })
  bypassSumInsured?: number | null;

  @Column({ name: "enrollment_progress", type: "jsonb", nullable: true })
  enrollmentProgress?: Record<string, any>;

  @Column({ name: "document_ids", type: "jsonb", nullable: true })
  documentIds?: JSON;

  // --- IBP credential fields (populated for USER_TYPE_COMPANY_EMPLOYEE only) ---

  @Column({ name: "login_name", type: "varchar", length: 255, nullable: true })
  loginName?: string | null;

  @SkipAudit()
  @Column({ name: "password", type: "varchar", length: 255, nullable: true })
  password?: string | null;

  @SkipAudit()
  @Column({ name: "ibp_password", type: "varchar", length: 255, nullable: true })
  ibpPassword?: string | null;

  @Column({ name: "is_password_set", type: "boolean", default: false })
  isPasswordSet!: boolean;

  @Column({ name: "allow_enrollment_reset", type: "boolean", nullable: true, default: false })
  allowEnrollmentReset?: boolean | null;

  @Column({ name: "is_password_hashed", type: "boolean", default: false })
  isPasswordHashed!: boolean;

  @Column({ name: "password_expires_at", type: "timestamptz", nullable: true })
  passwordExpiresAt?: Date | null;

  @Column({ name: "auth_version", type: "bigint", default: 1 })
  authVersion!: number;

  @Column({ name: "user_status_key", type: "varchar", length: 100, default: "USER_STATUS_ACTIVE" })
  userStatusKey!: string;

  // --- end credential fields ---

  @Column({ name: "created_by", type: "int", default: 0 })
  @SkipAudit()
  createdBy!: number;

  @Column({ name: "updated_by", type: "int", default: 0 })
  @SkipAudit()
  updatedBy!: number;

  @Column({
    name: "is_tc_accepted",
    type: "boolean",
    default: false,
  })
  isTCAccepted?: boolean;

  @Column({
    name: "tc_accepted_version",
    type: "int",
    nullable: true,
  })
  tcAcceptedVersion?: number | null;

  @Column({
    name: "tc_accepted_at",
    type: "timestamp",
    nullable: true,
  })
  tcAcceptedAt?: Date | null;

  @Column({
    name: "tc_withdrawn_at",
    type: "timestamp",
    nullable: true,
  })
  tcWithdrawnAt?: Date | null;

  @Column({
    name: "tc_status",
    type: "varchar",
    nullable: true,
  })
  tcStatus?: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  @SkipAudit()
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  @SkipAudit()
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  @SkipAudit()
  deletedAt?: Date;

  @OneToMany(() => PolicyEnrollmentDependent, (dep) => dep.companyEmployee)
  dependents!: PolicyEnrollmentDependent[];

  @OneToMany(() => PolicyEmployeeEnrollment, (enroll) => enroll.employee)
  enrollments!: PolicyEmployeeEnrollment[];

  @ManyToOne(() => Company, (company) => company.policyEnrollmentEmployees, {
  nullable: true,
  onDelete: "SET NULL", 
  })
  @JoinColumn({ name: "company_id" }) 
  company?: Company;
}
