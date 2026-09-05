import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Relation,
} from "typeorm";
import { LookUp } from "./look-up.entity";
import { OpportunityMeetingDocumentMap } from "./opportunity-meeting-document-map.entity";
import { OpportunityMeetingParticipantMap } from "./opportunity-meeting-participant-map.entity";
import { Opportunity } from "./opportunity.entity";
import { User } from "./user";
@Entity("opportunity_activity_map")
export class OpportunityActivityMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "opportunity_id", type: "int", nullable: false })
  opportunityId: number;

  @Column({ name: "ref_stage_id", type: "int", nullable: false })
  refStageId: number;

  @Column({ name: "ref_activity_id", type: "int", nullable: false })
  refActivityId: number;

  @Column({ name: "activity_name", type: "varchar", nullable: false })
  activityName: string;

  @Column({ name: "stage_name", type: "varchar", nullable: false })
  stageName: string;

  @Column({ name: "original_due_date", type: "date", nullable: false })
  originalDueDate: Date;

  @Column({ name: "lead_days", type: "int", nullable: false })
  leadDays: number;

  @Column({ name: "approval", type: "varchar" })
  approval: string;

  @Column({ name: "mandatory", type: "varchar" })
  mandatory: string;

  @Column({ name: "activity_meta", type: "jsonb", nullable: true })
  activityMeta: Record<string, any>;

  @Column({ name: "planned_at", type: "timestamptz", nullable: true })
  plannedAt: Date;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt: Date;

  @Column({ name: "due_date", type: "date", nullable: true })
  dueDate: Date;

  @Column({ name: "owner_id", type: "int", nullable: true })
  ownerId: number;

  @Column({ name: "ref_role_key", type: "varchar", nullable: false })
  roleKey: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy: number;

  @Column({ name: "submitted_by", type: "int", nullable: true })
  submittedBy: number;

  @Column({ name: "opportunity_table", type: "varchar", nullable: true })
  opportunityTable: string;

  @Column({ name: "file_path_url", type: "varchar", nullable: true })
  filePathUrl: string;

  @Column({
    name: "activity_key",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  activityKey: string;

  @Column({ name: "status_lid", type: "int", nullable: true })
  statusLid: number;

  @Column({
    name: "activity_status_key",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  activityStatusKey: string;

  @Column({ name: "activity_order", type: "int" })
  activityOrder!: number;

  @Column({
    name: "is_document_mandatory",
    type: "boolean",
    default: true,
    nullable: false,
  })
  isDocumentMandatory: boolean;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.opportunityId, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "status_lid" })
  status: Relation<LookUp>;

  @OneToOne(() => User)
  @JoinColumn({ name: "created_by", referencedColumnName: "userId" })
  created!: Relation<User>;

  @ManyToOne(() => User, (user) => user.userId, { onDelete: "CASCADE" })
  @JoinColumn({ name: "owner_id" })
  owner: Relation<User>;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "submitted_by", referencedColumnName: "userId" })
  submittedByUser: Relation<User>;

  @OneToMany(
    () => OpportunityMeetingDocumentMap,
    (doc) => doc.opportunityActivity
  )
  meetingDocuments: Relation<OpportunityMeetingDocumentMap[]>;

  @OneToMany(
    () => OpportunityMeetingParticipantMap,
    (part) => part.opportunityActivity
  )
  meetingParticipants: Relation<OpportunityMeetingParticipantMap[]>;

  constructor(
    id: number,
    opportunityId: number,
    refStageId: number,
    refActivityId: number,
    activityName: string,
    stageName: string,
    originalDueDate: Date,
    leadDays: number,
    approval: string,
    mandatory: string,
    activityMeta: Record<string, any>,
    opportunityTable: string,
    activityStatusKey: string,
    statusLid: number,
    ownerId: number,
    dueDate: Date,
    activityKey: string,
    plannedAt: Date,
    completedAt: Date,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.opportunityId = opportunityId;
    this.refStageId = refStageId;
    this.refActivityId = refActivityId;
    this.activityName = activityName;
    this.stageName = stageName;
    this.originalDueDate = originalDueDate;
    this.leadDays = leadDays;
    this.approval = approval;
    this.mandatory = mandatory;
    this.activityMeta = activityMeta;
    this.opportunityTable = opportunityTable;
    this.activityStatusKey = activityStatusKey;
    this.statusLid = statusLid;
    this.ownerId = ownerId;
    this.dueDate = dueDate;
    this.activityKey = activityKey;
    this.plannedAt = plannedAt;
    this.completedAt = completedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
