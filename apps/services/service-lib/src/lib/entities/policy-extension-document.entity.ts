import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";
import { Policy } from "./policy.entity";
import { PolicyAssetEndorsement } from "./policy-asset-endorsement.entity";
import { FileUpload } from "./file-upload.entity";

@Entity("policy_extension_documents")
export class PolicyExtensionDocument {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "policy_id", type: "int", nullable: false })
  policyId!: number;

  @Column({ name: "endorsement_id", type: "int", nullable: false })
  endorsementId!: number;

  @Column({ name: "document_id", type: "int", nullable: false })
  documentId!: number;

  @Column({ name: "status", type: "varchar", length: 20, default: "active" })
  status!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy!: number;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number | null;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date | null;

  @Column({ name: "deleted_by", type: "int", nullable: true })
  deletedBy?: number | null;

  @ManyToOne(() => Policy, { onDelete: "CASCADE" })
  @JoinColumn({ name: "policy_id" })
  policy?: Relation<Policy>;

  @ManyToOne(() => PolicyAssetEndorsement)
  @JoinColumn({ name: "endorsement_id" })
  endorsement?: Relation<PolicyAssetEndorsement>;

  @ManyToOne(() => FileUpload)
  @JoinColumn({ name: "document_id" })
  document?: Relation<FileUpload>;
}
