import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { OpportunityFinalNegotiation } from "./opportunity-final-negotiation.entity";

@Entity("opportunity_final_negotiation_quote_cover_detail")
export class OpportunityFinalNegotiationQuoteCoverDetail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "opportunity_final_negotiation_id", type: "int" })
  opportunityFinalNegotiationId!: number;

  @Column({ name: "quote_id", type: "int" })
  quoteId!: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId!: number;

  @Column({ name: "cover_map_id", type: "int" })
  coverMapId!: number;

  @Column({ name: "insurer_cover_response", type: "text", nullable: true })
  insurerCoverResponse?: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => OpportunityFinalNegotiation, (neg) => neg.quoteCovers, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_final_negotiation_id" })
  finalNegotiation: Relation<OpportunityFinalNegotiation>;
}
