import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { OpportunityQuoteEntry } from "./opportunity-quote-entry.entity";
import { FileUpload } from "./file-upload.entity"; // Assuming you have a documents table

@Entity("opportunity_quote_entry_document_map")
export class OpportunityQuoteEntryDocumentMap {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "opportunity_quote_entry_id", type: "int" })
  opportunityQuoteEntryId!: number;

  @Column({ name: "document_id", type: "int" })
  documentId!: number;

  @ManyToOne(() => FileUpload)
  @JoinColumn({ name: "document_id" })
  document!: Relation<FileUpload>;

  @ManyToOne(() => OpportunityQuoteEntry, (entry) => entry.documentMappings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_quote_entry_id" })
  quoteEntry!: Relation<OpportunityQuoteEntry>;
}
