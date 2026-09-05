import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Opportunity } from "./opportunity.entity";
import type { Relation } from "typeorm";
import { LookUp } from "./look-up.entity";

@Entity("opportunity_challenges")
export class OpportunityChallenges {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "challenge_type_lid", type: "int" })
  challengeTypeLid: number;

  @Column({ name: "description", type: "text", nullable: true })
  description: string;

  @Column({ name: "mitigation_type_lid", type: "int" })
  mitigationTypeLid: number;

  @Column({ name: "mitigation_description", type: "text", nullable: true })
  mitigationDescription: string;

  @ManyToOne(
    () => Opportunity,
    (opportunity) => opportunity.opportunityChallenges
  )
  @JoinColumn({ name: "opportunity_id" })
  opportunity?: Relation<Opportunity>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "challenge_type_lid" })
  challenge?: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "mitigation_type_lid" })
  mitigation?: Relation<LookUp>;

  constructor(
    id: number,
    opportunityId: number,
    challengeTypeLid: number,
    description: string,
    mitigationTypeLid: number,
    mitigationDescription: string
  ) {
    this.id = id;
    this.opportunityId = opportunityId;
    this.challengeTypeLid = challengeTypeLid;
    this.description = description;
    this.mitigationTypeLid = mitigationTypeLid;
    this.mitigationDescription = mitigationDescription;
  }
}
