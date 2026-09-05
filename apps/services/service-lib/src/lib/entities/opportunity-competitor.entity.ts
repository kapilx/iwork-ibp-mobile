import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Opportunity } from "./opportunity.entity";
import type { Relation } from "typeorm";

@Entity("opportunity_competitor")
export class OpportunityCompetitors {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "competitor", type: "varchar", length: 255 })
  competitor: string;

  @Column({ name: "competitor_id", type: "int", nullable: true })
  competitorId: number;

  @Column({ name: "competitor_branch_id", type: "int", nullable: true })
  competitorBranchId: number;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.opportunityId, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_id" })
  opportunity!: Relation<Opportunity>;

  constructor(
    id: number,
    opportunityId: number,
    competitor: string,
    competitorId: number,
    competitorBranchId: number
  ) {
    this.id = id;
    this.opportunityId = opportunityId;
    this.competitor = competitor;
    this.competitorId = competitorId;
    this.competitorBranchId = competitorBranchId;
  }
}
