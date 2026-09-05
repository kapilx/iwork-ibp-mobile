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
import { OpportunityActivityMap } from "./opportunity-activity-map.entity";
import { Opportunity } from "./opportunity.entity";
import { Policy } from "./policy.entity";
import { TaskDocumentMap } from "./task-document-map.entity";
import { User } from "./user";

@Entity({ name: "task" })
@Auditable()
export class Task {
  @PrimaryGeneratedColumn({ name: "id", type: "int", nullable: false })
  id: number;

  @Column({ name: "task_name", type: "varchar", nullable: false })
  taskName: string;

  @Column({ name: "activity_id", type: "int", nullable: true })
  activityId: number | null;

  @Column({ name: "policy_id", type: "int", nullable: true })
  policyId: number | null;

  @Column({ name: "template_id", type: "int", nullable: true })
  templateId: number | null;

  @Column({ name: "task_origin", type: "varchar", length: 100, nullable: true })
  taskOrigin: string | null;

  @Column({ name: "task_label", type: "varchar", length: 150, nullable: true })
  taskLabel: string | null;

  @Column({ name: "company_id", type: "int", nullable: false })
  companyId: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "assignee_id", type: "int", nullable: false })
  assigneeId: number;

  @Column({ name: "due_date", type: "date", nullable: false })
  dueDate: Date;

  @Column({ name: "task_status_lid", type: "int", nullable: false })
  taskStatusLid: number;

  @Column({ name: "task_type_lid", type: "int", nullable: false })
  taskTypeLid: number;

  @Column({ name: "sub_task_type_lid", type: "int", nullable: true })
  subTaskTypeLid: number;

  @Column({ name: "task_close", type: "varchar", length: 20, nullable: true })
  taskClose: string;

  @Column({
    name: "task_is_editable",
    type: "varchar",
    length: 20,
    nullable: false,
  })
  taskIsEditable: string;

  @Column({ name: "priority_lid", type: "int", nullable: false })
  priorityLid: number;

  @Column({ name: "description", type: "text", nullable: true })
  description: string;

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

  @Column({ name: "comments", type: "text", nullable: true })
  comments: string | null;

  // Relationships
  @ManyToOne(() => Company)
  @JoinColumn({ name: "company_id" })
  company: Relation<Company>;

  @ManyToOne(() => User, (user) => user.userId, { onDelete: "CASCADE" })
  @JoinColumn({ name: "assignee_id" })
  assignee: Relation<User>;

  @ManyToOne(() => Opportunity)
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  @ManyToOne(() => Policy, { nullable: true })
  @JoinColumn({ name: "policy_id" })
  policy?: Relation<Policy>;

  // @Get("activities/:opportunityId") for fetching activities
  @ManyToOne(() => OpportunityActivityMap)
  @JoinColumn({ name: "activity_id" })
  activity: Relation<OpportunityActivityMap>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "task_status_lid", referencedColumnName: "id" })
  taskStatus: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "task_type_lid", referencedColumnName: "id" })
  taskType: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "sub_task_type_lid", referencedColumnName: "id" })
  subTaskType: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "priority_lid", referencedColumnName: "id" })
  priority: Relation<LookUp>;

  @OneToMany(() => TaskDocumentMap, (taskDoc) => taskDoc.task)
  taskDocs?: TaskDocumentMap[];

  constructor(
    taskName: string,
    activityId: number | null,
    companyId: number,
    opportunityId: number,
    assigneeId: number,
    dueDate: Date,
    taskStatusLid: number,
    taskTypeLid: number,
    subTaskTypeLid: number,
    taskClose: string,
    taskIsEditable: string,
    priorityLid: number,
    description: string,
    comments?: string | null,
    policyId?: number | null,
    templateId?: number | null,
    taskOrigin?: string | null,
    taskLabel?: string | null
  ) {
    this.taskName = taskName;
    this.activityId = activityId;
    this.companyId = companyId;
    this.opportunityId = opportunityId;
    this.assigneeId = assigneeId;
    this.dueDate = dueDate;
    this.taskStatusLid = taskStatusLid;
    this.taskTypeLid = taskTypeLid;
    this.subTaskTypeLid = subTaskTypeLid;
    this.taskClose = taskClose;
    this.taskIsEditable = taskIsEditable;
    this.priorityLid = priorityLid;
    this.description = description;
    this.comments = comments ?? null;
    this.policyId = policyId ?? null;
    this.templateId = templateId ?? null;
    this.taskOrigin = taskOrigin ?? null;
    this.taskLabel = taskLabel ?? null;
  }
}
