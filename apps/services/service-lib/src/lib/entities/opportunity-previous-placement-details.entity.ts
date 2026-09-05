import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Opportunity } from "./opportunity.entity";
import type { Relation } from "typeorm";

@Entity({ name: "opportunity_previous_placement_details" })
export class OpportunityPreviousPlacementDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "challenges_and_mitigation", type: "text", nullable: true })
  challengesAndMitigation: string;

  @Column({ name: "existing_competition", type: "text", nullable: true })
  existingCompetition: string;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks: string;

  @ManyToOne(
    () => Opportunity,
    (opportunity) => opportunity.previousPlacementDetails,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  constructor(
    id: number,
    opportunityId: number,
    challengesAndMitigation: string,
    existingCompetition: string,
    remarks: string
  ) {
    this.id = id;
    this.opportunityId = opportunityId;
    this.challengesAndMitigation = challengesAndMitigation;
    this.existingCompetition = existingCompetition;
    this.remarks = remarks;
  }
}
