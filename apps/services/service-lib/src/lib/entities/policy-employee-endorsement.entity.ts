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
import { Company } from "./company.entity";
import { Endorsement } from "./endorsement.entity";
import { PolicyEnrollmentEmployee } from "./policy-enrollment-employee.entity";
import { Policy } from "./policy.entity";

@Entity("policy_employee_endorsement")
@Auditable()
export class PolicyEmployeeEndorsement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "policy_id", type: "int" })
  policyId!: number;

  @Column({ name: "employee_id", type: "int" })
  employeeId!: number;

  @Column({ name: "company_id", type: "int" })
  companyId!: number;

  @Column({
    name: "employee_endorsement_status_key",
    type: "varchar",
    length: 50,
  })
  employeeEndorsementStatusKey!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  @SkipAudit()
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  @SkipAudit()
  updatedAt!: Date;

  @Column({ name: "endorsement_addition_file_id", type: "int", nullable: true })
  endorsementAdditionFileId?: number | null;

  @Column({ name: "endorsement_deletion_file_id", type: "int", nullable: true })
  endorsementDeletionFileId?: number | null;

  @Column({ name: "endorsement_addition_created_at", type: "timestamp", nullable: true })
  endorsementAdditionCreatedAt?: Date | null;

  @Column({ name: "endorsement_deleted_created_at", type: "timestamp", nullable: true })
  endorsementDeletedCreatedAt?: Date | null;

  @Column({ name: "endorsement_updation_file_id", type: "int", nullable: true })
  endorsementUpdationFileId?: number | null;

  @Column({ name: "endorsement_updation_created_at", type: "timestamp", nullable: true, default: () => "CURRENT_TIMESTAMP" })
  endorsementUpdationCreatedAt?: Date | null;

  @Column({ name: 'endorsement_id', type: 'int', nullable: true })
  endorsementId?: number;

  @Column({ name: 'deletion_endorsement_id', type: 'int', nullable: true })
  deletionEndorsementId?: number;

  @ManyToOne(() => Policy, { onDelete: "CASCADE" })
  @JoinColumn({ name: "policy_id" })
  policy!: Policy;

  @ManyToOne(() => PolicyEnrollmentEmployee, { onDelete: "CASCADE" })
  @JoinColumn({ name: "employee_id" })
  employee!: PolicyEnrollmentEmployee;

  @ManyToOne(() => Company, { onDelete: "CASCADE" })
  @JoinColumn({ name: "company_id" })
  company!: Company;

  @ManyToOne(() => Endorsement, { onDelete: "CASCADE" })
  @JoinColumn({ name: "endorsement_id" })
  endorsement?: Endorsement;
}
