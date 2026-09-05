import type { Relation } from "typeorm";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { OpportunityFinalNegotiation } from "./opportunity-final-negotiation.entity";

@Entity("opportunity_final_negotiation_qcr_variation")
export class OpportunityFinalNegotiationQcrVariation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "opportunity_final_negotiation_id", type: "int" })
  opportunityFinalNegotiationId: number;

  @Column({ name: "issue", type: "varchar", length: 255 })
  issue: string;

  @ManyToOne(() => OpportunityFinalNegotiation, (neg) => neg.qcrVariations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_final_negotiation_id" })
  finalNegotiation: Relation<OpportunityFinalNegotiation>;
}
