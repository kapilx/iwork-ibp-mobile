import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Company } from "./company.entity";
import { PolicyEnrollmentEmployee } from "./policy-enrollment-employee.entity";

@Entity("employee_enrollment_submission")
@Index(["employeeId", "companyId"])
@Index(["referenceNumber"], { unique: true })
@Index(["employeeId", "companyId", "submissionCount"], { unique: true })
export class EmployeeEnrollmentSubmission {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "employee_id", type: "int" })
  employeeId!: number;

  @Column({ name: "company_id", type: "int" })
  companyId!: number;

  @Column({ name: "policy_ids", type: "jsonb", default: () => "'[]'::jsonb" })
  policyIds!: number[];

  @Column({ name: "submission_count", type: "int" })
  submissionCount!: number;

  @Column({ name: "reference_number", type: "varchar", length: 80 })
  referenceNumber!: string;

  @Column({ name: "submitted_at", type: "timestamptz", default: () => "now()" })
  submittedAt!: Date;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number | null;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => PolicyEnrollmentEmployee, { onDelete: "CASCADE" })
  @JoinColumn({ name: "employee_id" })
  employee!: PolicyEnrollmentEmployee;

  @ManyToOne(() => Company, { onDelete: "CASCADE" })
  @JoinColumn({ name: "company_id" })
  company!: Company;
}

