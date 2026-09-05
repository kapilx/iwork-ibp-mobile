import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { OpportunityFinalNegotiation } from "./opportunity-final-negotiation.entity";
import type { Relation } from "typeorm";

@Entity("opportunity_final_negotiation_tax_map")
export class OpportunityFinalNegotiationTaxMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "opportunity_final_negotiation_id", type: "int" })
  opportunityFinalNegotiationId: number;

  @Column({ name: "tax", type: "int", nullable: true })
  tax: number | null;

  @Column({ name: "tax_value", type: "int", nullable: true })
  taxValue: number | null;

  @ManyToOne(() => OpportunityFinalNegotiation, (neg) => neg.taxMaps, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_final_negotiation_id" })
  finalNegotiation: Relation<OpportunityFinalNegotiation>;
}
