import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { FileUpload } from "./file-upload.entity";
import { ClaimActivityMap } from "./claim-activity-map.entity";

@Entity("claim_activity_document_map")
export class ClaimActivityDocumentMap {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "claim_activity_id", type: "int", nullable: false })
  claimActivityId!: number;

  @Column({ name: "document_id", type: "int", nullable: true })
  documentId?: number;

  @Column({
    name: "document_label",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  documentLabel?: string;

  @Column({ name: "received_date", type: "date", nullable: true })
  receivedDate?: Date;

  @Column({
    name: "document_status_key",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  documentStatusKey?: string;

  @Column({ name: "is_custom", type: "int", nullable: true })
  isCustom?: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @ManyToOne(() => FileUpload, (fileUpload) => fileUpload.claimActivityDocs)
  @JoinColumn({ name: "document_id", referencedColumnName: "id" })
  document!: Relation<FileUpload>;

  @ManyToOne(() => ClaimActivityMap, { onDelete: "CASCADE" })
  @JoinColumn({ name: "claim_activity_id" })
  claimActivity!: Relation<ClaimActivityMap>;
}
