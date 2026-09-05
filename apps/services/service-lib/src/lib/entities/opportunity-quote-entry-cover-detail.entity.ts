import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { OpportunityQuoteEntry } from "./opportunity-quote-entry.entity";

@Entity("opportunity_quote_cover_detail")
export class OpportunityQuoteCoverDetail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "quote_id", type: "int" })
  quoteId: number;

  @Column({ name: "cover_map_id", type: "int" })
  coverMapId: number;

  @Column({ name: "policy_type_id", type: "int", nullable: true })
  policyTypeId?: number;

  @Column({ name: "cover_name", type: "text", nullable: true })
  coverName?: string;

  @Column({ name: "insurer_cover_response", type: "text", nullable: true })
  insurerCoverResponse?: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @ManyToOne(() => OpportunityQuoteEntry, (quote) => quote.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "quote_id" })
  quote: OpportunityQuoteEntry;
}
