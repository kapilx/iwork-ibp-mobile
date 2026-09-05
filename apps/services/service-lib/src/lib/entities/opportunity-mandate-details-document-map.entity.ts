import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { OpportunityMandateDetailsEntry } from "./opportunity-mandate-details-entry.entity";
import { FileUpload } from "./file-upload.entity";
import { LookUp } from "./look-up.entity";

@Entity("opportunity_mandate_details_document_map")
export class OpportunityMandateDetailsDocumentMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "mandate_id" })
  mandateId: number;

  @Column({ name: "document_type_lid" })
  documentTypeLid: number;

  @Column({ name: "document_id" })
  documentId: number;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "document_type_lid" })
  documentType: Relation<LookUp>;

  @ManyToOne(
    () => OpportunityMandateDetailsEntry,
    (mandate) => mandate.mandateDetailsDocuments,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "mandate_id" })
  mandate: Relation<OpportunityMandateDetailsEntry>;

  @ManyToOne(() => FileUpload)
  @JoinColumn({ name: "document_id" })
  document: Relation<FileUpload>;
}
