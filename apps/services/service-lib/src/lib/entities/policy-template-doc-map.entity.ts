import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import type { Relation } from "typeorm";
import { Policy } from "./policy.entity";
import { FileUpload } from "./file-upload.entity";

@Entity("policy_configuration_template_doc_map")
export class PolicyConfigurationTemplateDocMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "policy_id", type: "int" })
  policyId!: number;

  @Column({ name: "document_id", type: "int" })
  documentId!: number;

  @ManyToOne(() => Policy, (policy) => policy.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "policy_id" })
  policy?: Relation<Policy>;

  @ManyToOne(() => FileUpload, (file) => file.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "document_id" })
  document?: Relation<FileUpload>;

  constructor(policyId: number, documentId: number) {
    this.policyId = policyId;
    this.documentId = documentId;
  }
}
