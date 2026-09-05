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
import { PolicyEmployeeEnrollmentChoice } from "./policy-employee-enrollment-choice.entity";
import { PolicyEnrollmentEmployee } from "./policy-enrollment-employee.entity";
import { Policy } from "./policy.entity";

@Entity("policy_employee_enrollment")
@Index(["employeeId", "policyId"], { unique: true })
@Auditable()
export class PolicyEmployeeEnrollment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "policy_id", type: "int" })
  policyId!: number;

  @Column({ name: "employee_id", type: "int" })
  employeeId!: number;

  @Column({ name: "company_id", type: "int" })
  companyId!: number;

  @Column({ name: "sum_insured", type: "numeric", default: 0 })
  sumInsured!: number;

  @Column({ name: "balance", type: "numeric", default: 0 })
  balance!: number;

  @Column({ name: "total_premium", type: "numeric", default: 0 })
  totalPremium!: number;

  @Column({ name: "total_company_pay", type: "numeric", default: 0 })
  totalCompanyPay!: number;

  @Column({ name: "total_employee_pay", type: "numeric", default: 0 })
  totalEmployeePay!: number;

  @Column({ name: "last_paid_gross_premium", type: "numeric", default: 0 })
  lastPaidGrossPremium!: number;
  @Column({ name: "last_paid_net_premium", type: "numeric", default: 0 })
  lastPaidNetPremium!: number;

  @Column({ name: "endorsement_updation_file_id", type: "int", nullable: true })
  endorsementUpdationFileId?: number;

  @Column({ name: "endorsement_updation_created_at", type: "timestamp", nullable: true })
  endorsementUpdationCreatedAt?: Date;

  @Column({
    name: "employee_enrollment_status_key",
    type: "varchar",
    length: 50,
  })
  employeeEnrollmentStatusKey!: string;

  @Column({ name: "is_auto_submitted", type: "boolean", default: false })
  isAutoSubmitted!: boolean;

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
  policy!: Policy;

  @ManyToOne(() => Company, { onDelete: "CASCADE" })
  @JoinColumn({ name: "company_id" })
  company!: Company;

  @ManyToOne(
    () => PolicyEnrollmentEmployee,
    (employee) => employee.enrollments,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "employee_id" })
  employee!: PolicyEnrollmentEmployee;

  @OneToMany(
    () => PolicyEmployeeEnrollmentChoice,
    (choice) => choice.employeeEnrollment
  )
  components!: PolicyEmployeeEnrollmentChoice[];
}
