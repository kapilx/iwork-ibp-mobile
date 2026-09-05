import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Auditable, SkipAudit } from "../audit-history";
import { Company } from "./company.entity";
import { LookUp } from "./look-up.entity";
import { MeetingChallengesMap } from "./meeting-challenges-map.entity";
import { MeetingDocumentMap } from "./meeting-document-map.entity";
import { MeetingNextStepsMap } from "./meeting-next-steps-map.entity";
import { MeetingOutcomesMap } from "./meeting-outcomes-map.entity";
import { MeetingParticipantMap } from "./meeting-participants.entity";
import { OpportunityActivityMap } from "./opportunity-activity-map.entity";
import { Opportunity } from "./opportunity.entity";

@Entity({ name: "meeting" })
@Auditable()
export class Meeting {
  @PrimaryGeneratedColumn({ name: "id", type: "int", nullable: false })
  id: number;

  @Column({ name: "opportunity_id", type: "int", nullable: false })
  opportunityId: number;

  @Column({ name: "activity_id", type: "int", nullable: false })
  activityId: number;

  @Column({ name: "meeting_type_lid", type: "int", nullable: false })
  meetingTypeLid: number;

  @Column({ name: "company_id", type: "int", nullable: false })
  companyId: number;

  @Column({ name: "meeting_date", type: "date", nullable: false })
  meetingDate: Date;

  @Column({ name: "start_time", type: "timetz", nullable: false })
  startTime: Date;

  @Column({ name: "duration", type: "int", nullable: false })
  duration: number;

  @Column({ name: "end_time", type: "timetz", nullable: false })
  endTime: Date;

  @Column({ name: "location_type_lid", type: "int", nullable: true })
  locationTypeLid: number;

  @Column({
    name: "meeting_subject",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  meetingSubject: string;

  @Column({ name: "meeting_agenda", type: "text", nullable: true })
  meetingAgenda: string;

  @Column({ name: "meeting_status_lid", type: "int", nullable: true })
  meetingStatusLid: number;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt?: Date | null;

  @Column({ name: "meeting_rating", type: "int", nullable: true })
  meetingRating: number;

  @Column({
    name: "feedback_submitted",
    type: "varchar",
    length: 30,
    nullable: true,
  })
  isFeedbackSubmitted: string;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks: string;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  createdAt?: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  updatedAt?: Date;

  @DeleteDateColumn({
    name: "deleted_at",
    type: "timestamptz",
    nullable: true,
  })
  @SkipAudit()
  deletedAt?: Date | null;

  @Column({ name: "created_by", type: "int", nullable: false })
  @SkipAudit()
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  @SkipAudit()
  updatedBy: number;

  // Relationships
  @ManyToOne(() => Opportunity)
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  // @Get("activities/:opportunityId") for fetching activities
  @ManyToOne(() => OpportunityActivityMap)
  @JoinColumn({ name: "activity_id" })
  activity: Relation<OpportunityActivityMap>;

  @ManyToOne(() => Company)
  @JoinColumn({ name: "company_id" })
  company: Relation<Company>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "meeting_type_lid", referencedColumnName: "id" })
  meetingType: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "meeting_status_lid", referencedColumnName: "id" })
  meetingStatus: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "location_type_lid", referencedColumnName: "id" })
  location: Relation<LookUp>;

  @OneToMany(
    () => MeetingParticipantMap,
    (meetingParticipantMap) => meetingParticipantMap.meeting,
    { cascade: true }
  )
  participants: Relation<MeetingParticipantMap>[];

  @OneToMany(() => MeetingDocumentMap, (meetingDoc) => meetingDoc.meeting)
  meetingDocs?: Relation<MeetingDocumentMap>[];

  @OneToMany(() => MeetingOutcomesMap, (outcome) => outcome.meeting)
  meetingOutcomes?: Relation<MeetingOutcomesMap>[];

  @OneToMany(() => MeetingChallengesMap, (challenge) => challenge.meeting)
  meetingChallenges?: Relation<MeetingChallengesMap>[];

  @OneToMany(() => MeetingNextStepsMap, (nextStep) => nextStep.meeting)
  meetingNextSteps?: Relation<MeetingNextStepsMap>[];

  constructor(
    opportunityId: number,
    activityId: number,
    meetingTypeLid: number,
    meetingStatusLid: number,
    companyId: number,
    meetingDate: Date,
    startTime: Date,
    duration: number,
    endTime: Date,
    locationTypeLid: number,
    meetingSubject: string,
    meetingAgenda: string,
    meetingRating: number,
    isFeedbackSubmitted: string,
    remarks: string
  ) {
    this.opportunityId = opportunityId;
    this.activityId = activityId;
    this.meetingTypeLid = meetingTypeLid;
    this.meetingStatusLid = meetingStatusLid;
    this.companyId = companyId;
    this.meetingDate = meetingDate;
    this.startTime = startTime;
    this.duration = duration;
    this.endTime = endTime;
    this.locationTypeLid = locationTypeLid;
    this.meetingSubject = meetingSubject;
    this.meetingAgenda = meetingAgenda;
    this.meetingRating = meetingRating;
    this.isFeedbackSubmitted = isFeedbackSubmitted;
    this.remarks = remarks;
  }
}
