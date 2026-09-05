import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Opportunity } from "./opportunity.entity";
import { MstrActivity } from "./mstr-activity.entity";
import { User } from "./user";
import type { Relation } from "typeorm";
@Entity("opportunity_activity_participants")
export class OpportunityActivityParticipants {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "opportunity_id" })
  opportunityId: number;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.opportunityId, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  @Column({ name: "activity_id" })
  activityId: number;

  @ManyToOne(() => MstrActivity, (activity) => activity.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "activity_id" })
  activity: Relation<MstrActivity>;

  @Column({ name: "participant_id" })
  participantId: number;

  @ManyToOne(() => User, (participant) => participant.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "participant_id" })
  participant: Relation<User>;

  @Column({ name: "opportunity_activity_id", type: "int" })
  opportunityActivityId: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @Column({ name: "created_by", type: "int" })
  createdBy: number;

  @Column({ name: "updated_by", type: "int" })
  updatedBy: number;

  constructor(
    id: number,
    opportunityId: number,
    activityId: number,
    participantId: number,
    createdAt: Date,
    updatedAt: Date,
    createdBy: number,
    updatedBy: number,
    opportunityActivityId: number
  ) {
    this.id = id;
    this.opportunityId = opportunityId;
    this.activityId = activityId;
    this.participantId = participantId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.opportunityActivityId = opportunityActivityId;
  }
}
