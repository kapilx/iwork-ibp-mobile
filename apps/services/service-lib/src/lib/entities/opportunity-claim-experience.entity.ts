import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Opportunity } from "./opportunity.entity";
import type { Relation } from "typeorm";

@Entity("opportunity_claim_experience")
export class OpportunityClaimExperiences {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "policy_from", type: "date" })
  policyFrom: Date;

  @Column({ name: "policy_to", type: "date" })
  policyTo: Date;

  @Column({
    name: "nature_of_loss",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  natureOfLoss: string;

  @Column({ name: "premium", type: "float", nullable: true })
  premium: number;

  @Column({ name: "claim_amount", type: "float", nullable: true })
  claimAmount: number;

  @Column({ name: "claim_percentage", type: "float", nullable: true })
  claimPercentage: number;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks: string;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.opportunityId)
  @JoinColumn({ name: "opportunity_id" })
  opportunity!: Relation<Opportunity>;

  constructor(
    id: number,
    opportunityId: number,
    policyFrom: Date,
    policyTo: Date,
    natureOfLoss: string,
    premium: number,
    claimAmount: number,
    claimPercentage: number,
    remarks: string
  ) {
    this.id = id;
    this.opportunityId = opportunityId;
    this.policyFrom = policyFrom;
    this.policyTo = policyTo;
    this.natureOfLoss = natureOfLoss;
    this.premium = premium;
    this.claimAmount = claimAmount;
    this.claimPercentage = claimPercentage;
    this.remarks = remarks;
  }
}
