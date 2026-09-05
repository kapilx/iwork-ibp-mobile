import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";

@Entity("policy_dependent_endorsement")
export class PolicyDependentEndorsement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "policy_id", type: "int" })
  policyId!: number;

  @Column({ name: "dependent_id", type: "int" })
  dependentId!: number;

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
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
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
}
