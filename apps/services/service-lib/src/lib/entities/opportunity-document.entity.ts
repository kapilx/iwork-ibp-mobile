import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Opportunity } from "./opportunity.entity";
import { FileUpload } from "./file-upload.entity";
import type { Relation } from "typeorm";
@Entity("opportunity_document_map")
export class OpportunityDocuments {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "opportunity_id" })
  opportunityId: number;

  @Column({ name: "document_id" })
  documentId: number;

  @ManyToOne(
    () => Opportunity,
    (opportunity) => opportunity.opportunityDocuments,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "opportunity_id" })
  opportunity!: Relation<Opportunity>;

  @ManyToOne(
    () => FileUpload,
    (fileupload) => fileupload.opportunityDocuments,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "document_id" })
  document!: Relation<FileUpload>;

  constructor(id: number, opportunityId: number, documentId: number) {
    this.id = id;
    this.opportunityId = opportunityId;
    this.documentId = documentId;
  }
}
