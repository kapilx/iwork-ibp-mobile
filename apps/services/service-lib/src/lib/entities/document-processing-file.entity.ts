import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { FileUpload } from "./file-upload.entity";

@Entity("document_processing_file")
export class DocumentProcessingFile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "entity_type", type: "varchar", length: 50 })
  entityType!: string;

  @Column({ name: "entity_id", type: "int" })
  entityId!: number;

  @Column({ name: "document_id", type: "int" })
  documentId!: number;

  @Column({ name: "document_type", type: "varchar", length: 50 })
  documentType!: string;

  @Column({ name: "endorsement_id", type: "int" })
  endorsementId?: number;

  @Column({ name: "enrollment_start_date", type: "date", nullable: true })
  enrollmentStartDate?: Date | null;

  @Column({ name: "enrollment_end_date", type: "date", nullable: true })
  enrollmentEndDate?: Date | null;

  @Column({ name: "expected_employees_count", type: "int" })
  expectedEmployeesCount?: number;

  @Column({ name: "expected_dependents_count", type: "int" })
  expectedDependentsCount?: number;

  @Column({
    name: "process_status",
    type: "varchar",
    length: 20,
    default: "CREATED",
  })
  processStatus!: string;

  @Column({ name: "created_by", type: "int", default: 0 })
  createdBy!: number;

  @Column({ name: "updated_by", type: "int", default: 0 })
  updatedBy!: number;

  @Column({
    name: "bypass_policy_configuration",
    type: "boolean",
    default: false,
    nullable: false,
  })
  bypassPolicyConfiguration!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => FileUpload, { onDelete: "CASCADE" })
  @JoinColumn({ name: "document_id" })
  document!: FileUpload;

}
