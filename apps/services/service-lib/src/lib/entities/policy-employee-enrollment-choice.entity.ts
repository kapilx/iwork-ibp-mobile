import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Auditable, SkipAudit } from "../audit-history";
import { PolicyEmployeeEnrollment } from "./policy-employee-enrollment.entity";

@Entity("policy_employee_enrollment_choice")
@Auditable()
export class PolicyEmployeeEnrollmentChoice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "employee_enrollment_id", type: "int" })
  employeeEnrollmentId!: number;

  @Column({ name: "sum_insured", type: "numeric" })
  sumInsured!: number;

  @Column({ name: "premium", type: "numeric" })
  premium!: number;

  @Column({ name: "company_pay", type: "numeric" })
  companyPay!: number;

  @Column({ name: "employee_pay", type: "numeric" })
  employeePay!: number;

  @Column({
    name: "policy_component_action_type",
    type: "varchar",
    length: 100,
  })
  policyComponentActionType!: string;

  @Column({
    name: "policy_component_action_type_id",
    type: "int",
    nullable: true,
  })
  policyComponentActionTypeId?: number;

  @Column({
    name: "parent_policy_component_action_type_id",
    type: "int",
    nullable: true,
  })
  parentpolicyComponentActionTypeId?: number;

  @Column({
    name: "policy_component_action_label",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  policyComponentActionLabel?: string;

  @Column({
    name: "premium_per_life",
    type: "varchar",
    length: 50,
  })
  premiumPerLife?: boolean;

  @Column({ name: "sum_insured_per_life", type: "boolean", nullable: true })
  sumInsuredPerLife?: boolean | null;

  @Column({
    name: "pro_ration_enabled",
    type: "boolean"
  })
  proRationEnabled?: boolean;

  // Day-based prorated amount for this employee's own effective-date-to-policy-end
  // span (equals the full amount when proRationEnabled is false). Kept separate
  // from premium/companyPay/employeePay above, which existing consumers (e.g.
  // HR reports in hr.repository.ts) read expecting the full annual premium.
  @Column({ name: "prorated_premium", type: "numeric", nullable: true })
  proratedPremium?: number | null;

  @Column({ name: "prorated_company_pay", type: "numeric", nullable: true })
  proratedCompanyPay?: number | null;

  @Column({ name: "prorated_employee_pay", type: "numeric", nullable: true })
  proratedEmployeePay?: number | null;


  @Column({
    name: "sum_insured_model",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  sumInsuredModel?: string;

  @Column({
    name: "sum_insured_model_property",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  sumInsuredModelProperty?: string;

  @Column({
    name: "min_sum_insured_value",
    type: "numeric",
    nullable: true,
    precision: 15,
    scale: 2,
  })
  minSumInsuredValue?: number;

  @Column({
    name: "max_sum_insured_value",
    type: "numeric",
    nullable: true,
    precision: 15,
    scale: 2,
  })
  maxSumInsuredValue?: number;

  // @Column({ name: "min_sum_insured_value", type: "numeric", precision: 15, scale: 2 })
  // minSumInsuredValue?: number;

  // @Column({ name: "max_sum_insured_value", type: "numeric", precision: 15, scale: 2 })
  // maxSumInsuredValue?: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  @SkipAudit()
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  @SkipAudit()
  updatedAt!: Date;

  @ManyToOne(() => PolicyEmployeeEnrollment, { onDelete: "CASCADE" })
  @JoinColumn({ name: "employee_enrollment_id" })
  employeeEnrollment!: PolicyEmployeeEnrollment;
}
