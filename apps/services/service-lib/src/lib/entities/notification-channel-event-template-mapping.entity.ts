import {
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { NotificationEventType } from "./notification-event-type.entity";
import { NotificationChannelType } from "./notification-channel-type.entity";
import { NotificationTemplateApprovalHistory } from "./notification-template-approval-history.entity";

@Entity("notification_channel_event_template_mapping")
export class NotificationChannelEventTemplateMapping {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "event_type_id", type: "int", nullable: true })
  eventTypeId!: number | null;

  @Column({ name: "channel_type_id", type: "int" })
  channelTypeId!: number;

  @Column()
  subject!: string;

  @Column("text")
  body!: string;

  @Column({
    name: "created_by",
    type: "int",
    nullable: false,
    default: () => "0",
  })
  createdBy!: number;

  @Column({
    name: "updated_by",
    type: "int",
    nullable: false,
    default: () => "0",
  })
  updatedBy!: number;

  @Column({ name: "status_lid", type: "int", nullable: true })
  statusLid!: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;

  // Template Management Fields
  @Column({ name: 'organization_id', type: 'int', nullable: true })
  organizationId?: number;

  @Column({ name: 'active_status_lid', type: 'int', nullable: false, default: 0 })
  activeStatusLid!: number;

  @Column({ name: 'character_count', type: 'int', nullable: true })
  characterCount?: number;

  @Column({
    name: 'approval_status_lid',
    type: 'int',
    nullable: false,
  })
  approvalStatusLid!: number;

  @Column({ name: 'submitted_by', type: 'int', nullable: true })
  submittedBy?: number;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @Column({ name: 'reviewed_by', type: 'int', nullable: true })
  reviewedBy?: number;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'approval_comments', type: 'text', nullable: true })
  approvalComments?: string;

  @Column({ name: 'rejection_comments', type: 'text', nullable: true })
  rejectionComments?: string;

  @Column({ name: 'task_id', type: 'int', nullable: true })
  taskId?: number;

  @Column({ name: "additional_user_emails", type: "jsonb", nullable: true })
  additionalUserEmails?: Record<string, string>;

  @Column({ name: "additional_user_id", type: "jsonb", nullable: true })
  additionalUserIds?: Record<string, string>;

  // NULL = default/master template (config-agnostic, current behaviour).
  // NOT NULL = a company/domain-specific override scoped to this
  // company_portal_configuration — see notification-template-config-scoping.sql.
  // Resolved at send time by NotificationRepository.findTemplateMapping():
  // override (matching config_id) first, else the config_id IS NULL default.
  // Deliberately a plain FK column, no @ManyToOne relation to ConfigCompany —
  // every call site only ever needs the scalar id for filtering, never the
  // related row, so there's no reason to pull that entity in here at all.
  @Column({ name: "config_id", type: "int", nullable: true })
  configId?: number | null;

  // Company-wide override, distinct from config_id (domain-level, IBP
  // employee-facing templates only). For iwork/internal-CRM event types
  // (Opportunity_Creation, MIR_Report_*, etc. — anything NOT in
  // IBP_EMAIL_TEMPLATE_EVENT_TYPES) there's no domain concept at all, so
  // this is the company-level equivalent — see
  // notification-template-company-scoping.sql. Mutually exclusive with
  // config_id (DB CHECK constraint) and resolved the same way at send time:
  // company_id-matching override first, else the plain default.
  @Column({ name: "company_id", type: "int", nullable: true })
  companyId?: number | null;

  @ManyToOne(() => NotificationEventType)
  @JoinColumn({ name: "event_type_id" })
  eventType!: NotificationEventType;

  @ManyToOne(() => NotificationChannelType)
  @JoinColumn({ name: "channel_type_id" })
  channelType!: NotificationChannelType;

  @OneToMany(() => NotificationTemplateApprovalHistory, (history) => history.template)
  approvalHistory!: NotificationTemplateApprovalHistory[];
}
