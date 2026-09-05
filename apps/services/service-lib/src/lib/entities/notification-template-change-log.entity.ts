import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

// Dedicated content-change audit trail for notification_channel_event_template_mapping —
// deliberately separate from notification_template_approval_history, which only tracks
// approval-workflow status transitions (submit/approve/reject), not what the subject/body
// content actually changed from/to. Written explicitly by TemplateRepository on every
// default-edit, override-create/update, and override-delete — see
// database-migrations/sql/notification-template-change-log-table.sql.
//
// templateMappingId always points at the DEFAULT template row's id (config_id IS NULL),
// never at an override row's own id — override rows can be deleted (Reset to Default),
// and the mapping table's FK is ON DELETE CASCADE, so pointing at an override row would
// silently delete its own "I was deleted" log entry the moment that delete happens. The
// default row is the stable anchor for a template's full history across every config;
// configId on this table distinguishes "history for config X" (CREATED_OVERRIDE /
// UPDATED_OVERRIDE / DELETED_OVERRIDE, configId set) from "history of the default itself"
// (UPDATED_DEFAULT, configId NULL).
export enum NotificationTemplateChangeAction {
  CREATED_OVERRIDE = "CREATED_OVERRIDE",
  UPDATED_OVERRIDE = "UPDATED_OVERRIDE",
  UPDATED_DEFAULT = "UPDATED_DEFAULT",
  DELETED_OVERRIDE = "DELETED_OVERRIDE",
}

@Entity("notification_template_change_log")
export class NotificationTemplateChangeLog {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  // Plain FK column, deliberately no @ManyToOne relation here — this table
  // is queried/written purely by templateMappingId (see TemplateRepository),
  // and keeping this a plain column avoids adding an import-graph edge back
  // to notification-channel-event-template-mapping.entity.ts.
  @Column({ name: "template_mapping_id", type: "int" })
  templateMappingId!: number;

  // Denormalized copy of the row's config_id at write time, so "all changes
  // for company/config X" can be queried without a join back to the mapping
  // table (which may since have had its own config_id row deleted, e.g. on
  // DELETED_OVERRIDE).
  @Column({ name: "config_id", type: "int", nullable: true })
  configId?: number | null;

  // Same denormalization as config_id, for company-wide overrides (iwork/
  // internal-CRM event types with no domain concept — see company_id on
  // notification_channel_event_template_mapping.entity.ts). Mutually
  // exclusive with configId on any given row.
  @Column({ name: "company_id", type: "int", nullable: true })
  companyId?: number | null;

  @Column({ name: "action", type: "varchar", length: 32 })
  action!: NotificationTemplateChangeAction;

  @Column({ name: "old_subject", type: "text", nullable: true })
  oldSubject?: string | null;

  @Column({ name: "old_body", type: "text", nullable: true })
  oldBody?: string | null;

  @Column({ name: "new_subject", type: "text", nullable: true })
  newSubject?: string | null;

  @Column({ name: "new_body", type: "text", nullable: true })
  newBody?: string | null;

  @Column({ name: "changed_by", type: "int" })
  changedBy!: number;

  @CreateDateColumn({
    name: "changed_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  changedAt!: Date;
}
