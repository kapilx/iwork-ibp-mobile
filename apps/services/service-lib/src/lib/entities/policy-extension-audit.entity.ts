import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Policy } from "./policy.entity";
import { FileUpload } from "./file-upload.entity";

export const ENDORSEMENT_TYPE_EXTENSION = "Extension";
export const ENDORSEMENT_TYPE_REVERT = "Revert";

@Entity("policy_extension_audit")
export class PolicyExtensionAudit {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "policy_id" })
  policyId!: number;

  @Column({ name: "insurer_policy_number" })
  insurerPolicyNumber!: string;

  @Column({ name: "endorsement_type" })
  endorsementType!: string;

  @Column({ name: "previous_policy_to_date", type: "date" })
  previousPolicyToDate!: string;

  @Column({ name: "extension_date", type: "date" })
  extensionDate!: string;

  @Column({ nullable: true, type: "text" })
  remarks!: string;

  @Column({ name: "source_file_upload_id", nullable: true })
  sourceFileUploadId!: number | null;

  @Column({ name: "processed_by" })
  processedBy!: number;

  @Column({ name: "is_reverted", default: false })
  isReverted!: boolean;

  @Column({ default: 'in-progress' })
  status!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne(() => Policy)
  @JoinColumn({ name: "policy_id" })
  policy!: Policy;

  @ManyToOne(() => FileUpload)
  @JoinColumn({ name: "source_file_upload_id" })
  sourceFile!: FileUpload;
}
