import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("application_scheduler_configuration")
@Index(["schedulerKey"], { unique: true })
export class ApplicationSchedulerConfiguration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "scheduler_key", length: 255, unique: true })
  schedulerKey: string;

  @Column({ name: "scheduler_name", length: 255 })
  schedulerName: string;

  @Column({ name: "scheduler_expression", length: 100 })
  schedulerExpression: string;

  @Column({ name: "is_enabled", default: true })
  isEnabled: boolean;

  @Column({ name: "description", type: "text", nullable: true })
  description: string | null;

  @Column({
    name: "last_successful_run_at",
    type: "timestamptz",
    nullable: true,
  })
  lastSuccessfulRunAt: Date | null;

  @Column({ name: "last_failed_run_at", type: "timestamptz", nullable: true })
  lastFailedRunAt: Date | null;

  @Column({
    name: "last_run_status",
    type: "varchar",
    length: 20,
    default: "idle",
    comment: "Status: idle, running, success, failed",
  })
  lastRunStatus: string;

  @Column({ name: "last_error_message", type: "text", nullable: true })
  lastErrorMessage: string | null;

  @Column({ name: "is_editable", type: "boolean" })
  isEditable: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @Column({ name: "created_by" })
  createdBy: number;

  @Column({ name: "updated_by" })
  updatedBy: number;
}
