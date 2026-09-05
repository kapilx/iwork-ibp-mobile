import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { OpportunityFinalNegotiation } from "./opportunity-final-negotiation.entity";
import { Insurer } from "./insurer.entity";
import type { Relation } from "typeorm";

@Entity("opportunity_final_negotiation_sharing_detail")
export class OpportunityFinalNegotiationSharingDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "opportunity_final_negotiation_id", type: "int" })
  opportunityFinalNegotiationId: number;

  @Column({ name: "insurer_id", type: "int" })
  insurerId: number;

  @Column({
    name: "share_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
  })
  sharePercentage: number;

  @Column({
    name: "share_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
  })
  shareAmount: number;

  @Column({
    name: "brokerage_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
  })
  brokeragePercentage: number;

  @Column({
    name: "brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
  })
  brokerageAmount: number;

  @Column({
    name: "terrorism_share_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  terrorismSharePercentage: number;

  @Column({
    name: "terrorism_share_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  terrorismShareAmount: number;

  @Column({
    name: "terrorism_brokerage_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
  })
  terrorismBrokeragePercentage: number;

  @Column({
    name: "terrorism_brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
  })
  terrorismBrokerageAmount: number;

  @Column({
    name: "total_brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  totalBrokerageAmount: number | null;

  @Column({ name: "insurer_location_id", type: "integer" })
  insurerLocationId: number;

  @Column({ name: "insurer_branch_id", type: "integer" })
  insurerBranchId: number;

  @Column({ name: "insurer_contact_id", type: "integer" })
  insurerContactId: number;

  @Column({ name: "is_lead_insurer", type: "integer" })
  isLeadInsurer: number;

  @ManyToOne(() => OpportunityFinalNegotiation, (neg) => neg.sharingDetails, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_final_negotiation_id" })
  finalNegotiation: Relation<OpportunityFinalNegotiation>;

  @ManyToOne(() => Insurer)
  @JoinColumn({ name: "insurer_id" })
  insurer: Relation<Insurer>;
}
