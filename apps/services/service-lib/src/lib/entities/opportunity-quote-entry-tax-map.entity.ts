import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { OpportunityQuoteEntry } from "./opportunity-quote-entry.entity";
import type { Relation } from "typeorm";

@Entity("opportunity_quote_tax_map")
export class OpportunityQuoteTaxMap {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "opportunity_quote_entry_id", type: "int" })
  opportunityQuoteEntryId!: number;

  @Column({ name: "tax_lid", type: "int", nullable: true })
  taxLid!: number | null;

  @Column({ name: "tax_value", type: "numeric", nullable: true })
  taxValue!: number | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @ManyToOne(() => OpportunityQuoteEntry, (entry) => entry.taxMappings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_quote_entry_id" })
  quoteEntry!: Relation<OpportunityQuoteEntry>;
}
