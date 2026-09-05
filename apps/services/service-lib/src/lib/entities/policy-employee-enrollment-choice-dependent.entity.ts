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
import { Auditable, SkipAudit } from "../audit-history";
import { PolicyEmployeeEnrollmentChoice } from "./policy-employee-enrollment-choice.entity";
import { PolicyEnrollmentDependent } from "./policy-enrollment-dependent.entity";

@Entity("policy_employee_enrollment_choice_dependent")
@Index("idx_peecd_choice", ["employeeEnrollmentChoiceId"])
@Index("idx_peecd_dependent", ["dependentId"])
@Index(
  "uq_peecd_choice_dependent_active",
  ["employeeEnrollmentChoiceId", "dependentId"],
  { unique: true, where: "deleted_at IS NULL" },
)
@Auditable()
export class PolicyEmployeeEnrollmentChoiceDependent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "employee_enrollment_choice_id", type: "int" })
  employeeEnrollmentChoiceId!: number;

  @Column({ name: "dependent_id", type: "int" })
  dependentId!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  @SkipAudit()
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  @SkipAudit()
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  @SkipAudit()
  deletedAt?: Date;

  @ManyToOne(() => PolicyEmployeeEnrollmentChoice)
  @JoinColumn({ name: "employee_enrollment_choice_id" })
  choice!: PolicyEmployeeEnrollmentChoice;

  @ManyToOne(() => PolicyEnrollmentDependent)
  @JoinColumn({ name: "dependent_id" })
  dependent!: PolicyEnrollmentDependent;
}
