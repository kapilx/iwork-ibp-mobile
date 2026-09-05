import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Policy } from "./policy.entity";
import { User } from "./user";
import { FileUpload } from "./file-upload.entity";
import { LookUp } from "./look-up.entity";

@Entity("policy_faq_uploads")
@Index(["policyId"])
export class PolicyFaqUpload {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "policy_id", type: "int" })
  policyId!: number;

  @Column({ name: "file_id", type: "int" })
  fileId!: number;

  @Column({ name: "file_name", type: "varchar", length: 255 })
  fileName!: string;

  @Column({ name: "file_path", type: "varchar", length: 500 })
  filePath!: string;

  @Column({ name: "faq_count", type: "int" })
  faqCount!: number;

  @Column({ name: "uploaded_by", type: "int" })
  uploadedBy!: number;

  @CreateDateColumn({ name: "uploaded_at", type: "timestamptz" })
  uploadedAt!: Date;

  @Column({ 
    name: "status_lkey", 
    type: "varchar", 
    length: 50, 
    default: "FAQ_UPLOAD_FILE_PROCESSING" 
  })
  statusLkey!: string;

  // Relations
  @ManyToOne(() => Policy, (policy) => policy.id)
  @JoinColumn({ name: "policy_id" })
  policy?: Policy;

  @ManyToOne(() => FileUpload, (fileUpload) => fileUpload.id)
  @JoinColumn({ name: "file_id" })
  file?: FileUpload;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({ name: "uploaded_by" })
  uploadedByUser?: User;

  @ManyToOne(() => LookUp, (lookUp) => lookUp.lookUpKey)
  @JoinColumn({ name: "status_lkey", referencedColumnName: "lookUpKey" })
  status?: LookUp;
}