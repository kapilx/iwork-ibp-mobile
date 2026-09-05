import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { LookUp } from "./look-up.entity";
import { Meeting } from "./meeting.entity";
import { OpportunityActivityMap } from "./opportunity-activity-map.entity";
import { Opportunity } from "./opportunity.entity";

@Entity({ name: "opportunity_hand_over_meet" })
export class OpportunityHandOverMeet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "activity_id", type: "integer", nullable: false })
  activityId: number;

  @Column({ name: "opportunity_id", type: "integer", nullable: false })
  opportunityId: number;

  @Column({ name: "opportunity_activity_id", type: "integer", nullable: false })
  opportunityActivityId: number;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks: string;

  @Column({ name: "meeting_id", type: "integer", nullable: true })
  meetingId: number;

  @Column({ name: "status_lid", type: "integer", nullable: true })
  statusLid: number;

  @Column({ name: "mom", type: "text", nullable: true })
  mom: string;

  @Column({
    name: "hand_over_meeting_type_lid",
    type: "integer",
    nullable: true,
  })
  handOverMeetingTypeLid: number;

  @Column({ name: "select_meeting_id", type: "integer", nullable: true })
  selectMeeting: number | null;

  @Column({ name: "meeting_date", type: "date", nullable: false })
  meetingDate: Date;

  @Column({ name: "start_time", type: "timetz", nullable: false })
  startTime: Date;

  @Column({ name: "end_time", type: "timetz", nullable: false })
  endTime: Date;

  @Column({ name: "location_type_lid", type: "int", nullable: true })
  locationTypeLid: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date;

  @Column({ name: "created_by", type: "integer", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "integer", nullable: false })
  updatedBy: number;

  @ManyToOne(() => Opportunity)
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  @OneToOne(() => Meeting, (meeting) => meeting.id)
  @JoinColumn({ name: "meeting_id" })
  meeting: Relation<Meeting>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "status_lid" })
  status: Relation<LookUp>;

  @ManyToOne(() => OpportunityActivityMap)
  @JoinColumn({ name: "opportunity_activity_id" })
  opportunityActivity: Relation<OpportunityActivityMap>;
}
