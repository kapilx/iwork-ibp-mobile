import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { LookUp } from "./look-up.entity";
import { Meeting } from "./meeting.entity";
import { OpportunityActivityMap } from "./opportunity-activity-map.entity";

@Entity({ name: "opportunity_kdm_meeting" })
export class OpportunityKdmMeeting {
  @PrimaryGeneratedColumn({ name: "id", type: "int", nullable: false })
  id: number;

  @Column({ name: "meeting_id", type: "integer", nullable: true })
  meetingId: number;

  @Column({ name: "status_lid", type: "integer", nullable: true })
  statusLid: number;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks: string;

  @Column({ name: "mom", type: "text", nullable: true })
  mom: string;

  @Column({ name: "kdm_meeting_type_lid", type: "integer", nullable: true })
  kdmMeetingTypeLid: number;

  @Column({ name: "select_meeting_id", type: "integer", nullable: true })
  selectMeeting: number | null;

  @Column({ name: "opportunity_id", type: "integer", nullable: true })
  opportunityId: number;

  @Column({ name: "activity_id", type: "integer", nullable: true })
  activityId: number;

  @Column({ name: "opportunity_activity_id", type: "integer", nullable: true })
  opportunityActivityId: number;

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

  // Relationships
  @ManyToOne(() => Meeting)
  @JoinColumn({ name: "meeting_id" })
  meeting: Relation<Meeting>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "status_lid" })
  status: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "location_type_lid" })
  location: Relation<LookUp>;

  @ManyToOne(() => OpportunityActivityMap)
  @JoinColumn({ name: "opportunity_activity_id" })
  opportunityActivity: Relation<OpportunityActivityMap>;

  constructor(
    meetingId: number,
    remarks: string,
    mom: string,
    statusLid: number,
    kdmMeetingTypeLid: number,
    selectMeeting: number | null,
    opportunityId: number,
    activityId: number,
    opportunityActivityId: number,
    meetingDate: Date,
    startTime: Date,
    endTime: Date,
    locationTypeLid: number
  ) {
    this.meetingId = meetingId;
    this.remarks = remarks;
    this.mom = mom;
    this.statusLid = statusLid;
    this.kdmMeetingTypeLid = kdmMeetingTypeLid;
    this.selectMeeting = selectMeeting;
    this.opportunityId = opportunityId;
    this.activityId = activityId;
    this.opportunityActivityId = opportunityActivityId;
    this.meetingDate = meetingDate;
    this.startTime = startTime;
    this.endTime = endTime;
    this.locationTypeLid = locationTypeLid;
  }
}
