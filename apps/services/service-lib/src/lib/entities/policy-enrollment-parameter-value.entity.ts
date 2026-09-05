import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Policy } from "./policy.entity";
import { PolicyEnrollmentEmployee } from "./policy-enrollment-employee.entity";
import { PolicyEnrollmentParameter } from "./policy-enrollment-parameter.entity";
import { PolicyEnrollmentParameterOption } from "./policy-enrollment-parameter-option.entity";

@Entity("policy_enrollment_parameter_values")
@Index(["policyId", "employeeId"])
@Index("idx_pepv_parameter", ["parameterId"])
export class PolicyEnrollmentParameterValue {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "policy_id", type: "int" })
  policyId!: number;

  @Column({ name: "employee_id", type: "int" })
  employeeId!: number;

  @Column({ name: "parameter_id", type: "int" })
  parameterId!: number;

  @Column({ name: "parameter_option_id", type: "int", nullable: true })
  parameterOptionId?: number;

  @Column({ name: "value", type: "varchar", length: 255, nullable: true })
  value?: string;

  @Column({ name: "created_by", type: "int", default: 0 })
  createdBy!: number;

  @Column({ name: "updated_by", type: "int", default: 0 })
  updatedBy!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => Policy, { onDelete: "CASCADE" })
  @JoinColumn({ name: "policy_id" })
  policy!: Policy;

  @ManyToOne(() => PolicyEnrollmentEmployee, { onDelete: "CASCADE" })
  @JoinColumn({ name: "employee_id" })
  companyEmployee!: PolicyEnrollmentEmployee;

  @ManyToOne(() => PolicyEnrollmentParameter, { onDelete: "CASCADE" })
  @JoinColumn({ name: "parameter_id" })
  parameter!: PolicyEnrollmentParameter;

  @ManyToOne(() => PolicyEnrollmentParameterOption, { nullable: true })
  @JoinColumn({ name: "parameter_option_id" })
  parameterOption?: PolicyEnrollmentParameterOption;
}
