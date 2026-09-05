import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Relation,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { OpportunityFinalNegotiation } from "./opportunity-final-negotiation.entity";
import { FileUpload } from "./file-upload.entity";

/**
 * Entity for opportunity_final_negotiation_quote_documents table.
 */
@Entity("opportunity_final_negotiation_quote_documents")
export class OpportunityFinalNegotiationQuoteDocuments {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "opportunity_final_negotiation_id", type: "int" })
  opportunityFinalNegotiationId!: number;

  @Column({ name: "quote_id", type: "int" })
  quoteId!: number;

  @Column({ name: "document_id", type: "int" })
  documentId!: number;

  @Column({ name: "document_type_lid", type: "int" })
  documentTypeLid!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => OpportunityFinalNegotiation, (neg) => neg.quoteDocs, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_final_negotiation_id" })
  finalNegotiation: Relation<OpportunityFinalNegotiation>;

  @OneToOne(() => FileUpload)
  @JoinColumn({ name: "document_id" })
  document: Relation<FileUpload>;
}
