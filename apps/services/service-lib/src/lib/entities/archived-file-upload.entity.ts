import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { FileUpload } from "./file-upload.entity";

@Entity("archived_file_upload")
export class ArchivedFileUpload {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "ref_file_upload_id", type: "int", nullable: false })
  refFileUploadId: number;

  @Column({ name: "file_key", type: "text", nullable: false })
  fileKey: string;

  @Column({ name: "new_file_key", type: "text", nullable: false })
  newFileKey: string; // Added new column

  @Column({
    name: "company_type",
    type: "varchar",
    length: 255,
    nullable: false,
  })
  companyType: string;

  @Column({ name: "company_id", type: "int", nullable: false })
  companyId: number;

  @Column({ name: "opportunity_id", type: "int", nullable: true })
  opportunityId?: number;

  @Column({ name: "opportunity_activity_id", type: "int", nullable: true })
  opportunityActivityId?: number;

  @Column({ name: "policy_id", type: "int", nullable: true })
  policyId?: number;

  @Column({ name: "claim_id", type: "int", nullable: true })
  claimId?: number;

  @Column({ name: "claim_activity_id", type: "int", nullable: true })
  claimActivityId?: number;

  @Column({ name: "meeting_id", type: "int", nullable: true })
  meetingId?: number;

  @Column({ name: "upload_type", type: "varchar", length: 50, nullable: false })
  uploadType: string;

  @Column({ name: "document_type_lid", type: "int", nullable: false })
  documentTypeLid: number;

  @Column({
    name: "created_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column({
    name: "updated_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy: number;

  @Column({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date;

  @ManyToOne(() => FileUpload)
  @JoinColumn({ name: "ref_file_upload_id" })
  fileUpload: FileUpload;
}
