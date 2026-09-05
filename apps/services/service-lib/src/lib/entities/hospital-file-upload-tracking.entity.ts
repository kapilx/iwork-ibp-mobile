import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
  Index,
} from "typeorm";
import { Exclude } from "class-transformer";
import { Policy } from "./policy.entity";
import { FileUpload } from "./file-upload.entity";

/**
 * Entity representing hospital file upload tracking information.
 * This entity tracks the status and metrics of hospital file uploads for each policy.
 */
@Entity("hospital_file_upload_tracking")
@Index("idx_hospital_file_upload_tracking_policy", ["policyId"])
@Index("idx_hospital_file_upload_tracking_status", ["fileStatus"])
export class HospitalFileUploadTracking {
  /**
   * Unique identifier for the upload tracking record.
   */
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  /**
   * Reference to the policy.
   */
  @Column({
    name: "policy_id",
    type: "int",
    nullable: false,
  })
  policyId!: number;

  /**
   * Reference to the uploaded file.
   */
  @Column({
    name: "file_id",
    type: "int",
    nullable: false,
  })
  fileId!: number;

  /**
   * Status of the file processing (e.g., 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED').
   */
  @Column({
    name: "file_status",
    type: "varchar",
    length: 50,
    nullable: false,
    default: "PENDING",
  })
  fileStatus!: string;

  /**
   * Number of records that failed validation.
   */
  @Column({
    name: "error_count",
    type: "int",
    nullable: false,
    default: 0,
  })
  errorCount!: number;

  /**
   * Number of records that were successfully processed.
   */
  @Column({
    name: "success_count",
    type: "int",
    nullable: false,
    default: 0,
  })
  successCount!: number;

  /**
   * Number of network hospitals processed successfully.
   */
  @Column({
    name: "network_hospital_count",
    type: "int",
    nullable: false,
    default: 0,
  })
  networkHospitalCount!: number;

  /**
   * Number of excluded hospitals processed successfully.
   */
  @Column({
    name: "excluded_hospital_count",
    type: "int",
    nullable: false,
    default: 0,
  })
  excludedHospitalCount!: number;

  /**
   * Total number of records in the uploaded file (initial count).
   */
  @Column({
    name: "total_records",
    type: "int",
    nullable: false,
    default: 0,
  })
  totalRecords!: number;

  /**
   * Reference to the error file (if any errors occurred).
   */
  @Column({
    name: "error_file_id",
    type: "int",
    nullable: true,
  })
  errorFileId?: number;

  /**
   * Reference to the success file (if applicable).
   */
  @Column({
    name: "success_file_id",
    type: "int",
    nullable: true,
  })
  successFileId?: number;

  /**
   * Timestamp when the tracking record was created.
   */
  @Exclude()
  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  /**
   * Identifier of the user who created the tracking record.
   */
  @Exclude()
  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy!: number;

  /**
   * Timestamp when the tracking record was last updated.
   */
  @Exclude()
  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;

  /**
   * Identifier of the user who last updated the tracking record.
   */
  @Exclude()
  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy!: number;

  /**
   * Timestamp when the tracking record was soft deleted.
   */
  @Exclude()
  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date;

  /**
   * Identifier of the user who soft deleted the tracking record.
   */
  @Exclude()
  @Column({ name: "deleted_by", type: "int", nullable: true })
  deletedBy?: number;

  /**
   * Policy associated with this upload tracking.
   */
  @ManyToOne(() => Policy, (policy) => policy.id, { eager: true })
  @JoinColumn({ name: "policy_id" })
  policy!: Relation<Policy>;

  /**
   * Uploaded file associated with this tracking.
   */
  @ManyToOne(() => FileUpload, (file) => file.id, { eager: true })
  @JoinColumn({ name: "file_id" })
  file!: Relation<FileUpload>;

  /**
   * Error file (if any errors occurred during processing).
   */
  @ManyToOne(() => FileUpload, (file) => file.id, { nullable: true })
  @JoinColumn({ name: "error_file_id" })
  errorFile?: Relation<FileUpload>;

  /**
   * Success file (if applicable).
   */
  @ManyToOne(() => FileUpload, (file) => file.id, { nullable: true })
  @JoinColumn({ name: "success_file_id" })
  successFile?: Relation<FileUpload>;
}