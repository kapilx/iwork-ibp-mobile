import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { ApplicationSchedulerConfiguration } from "./application-scheduler-configuration.entity";

@Entity("scheduler_audit_log")
@Index(["schedulerConfigId", "executedAt"])
@Index(["status"])
@Index(["executedAt"])
export class SchedulerAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "scheduler_config_id" })
  schedulerConfigId: number;

  @ManyToOne(() => ApplicationSchedulerConfiguration)
  @JoinColumn({ name: "scheduler_config_id" })
  schedulerConfig: ApplicationSchedulerConfiguration;

  @Column({ name: "scheduler_key", length: 255 })
  schedulerKey: string;

  @Column({ name: "scheduler_name", length: 255 })
  schedulerName: string;

  @Column({
    name: "status",
    type: "varchar",
    length: 20,
    comment: "Status: running, success, failed",
  })
  status: string;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage: string | null;

  @Column({ name: "execution_duration_ms", type: "integer", nullable: true })
  executionDurationMs: number | null;

  @Column({ name: "executed_at", type: "timestamptz" })
  executedAt: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @Column({ name: "created_by" })
  createdBy: number;
}
