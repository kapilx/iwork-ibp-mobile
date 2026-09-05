import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { MstrExtApplicationRef } from "./mstr-ext-application-ref.entity";

export enum SyncJobStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum SyncJobPriority {
  HIGH = "HIGH",
  NORMAL = "NORMAL",
}

export enum SyncJobScopeType {
  GLOBAL = "GLOBAL",
  PER_TPA = "PER_TPA",
  PER_POLICY = "PER_POLICY",
}

@Entity("sync_job")
@Index(["syncType", "status", "priority", "createdAt"])
@Index(["appRefId", "scopeType", "scopeId", "status"])
export class SyncJob {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({ name: "app_ref_id", type: "int" })
  appRefId!: number;

  @Column({ name: "sync_type", type: "varchar", length: 50 })
  syncType!: string;

  @Column({ name: "scope_type", type: "varchar", length: 20, default: SyncJobScopeType.GLOBAL })
  scopeType!: SyncJobScopeType;

  @Column({ name: "scope_id", type: "int", nullable: true })
  scopeId?: number | null;

  @Column({ name: "priority", type: "varchar", length: 10, default: SyncJobPriority.NORMAL })
  priority!: SyncJobPriority;

  @Column({ name: "status", type: "varchar", length: 20, default: SyncJobStatus.PENDING })
  status!: SyncJobStatus;

  @Column({ name: "retry_count", type: "int", default: 0 })
  retryCount!: number;

  @Column({ name: "dynamic_params", type: "jsonb", nullable: true })
  dynamicParams?: Record<string, string> | null;

  @Column({ name: "started_at", type: "timestamptz", nullable: true })
  startedAt?: Date | null;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt?: Date | null;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage?: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => MstrExtApplicationRef, { onDelete: "CASCADE" })
  @JoinColumn({ name: "app_ref_id" })
  appRef!: Relation<MstrExtApplicationRef>;
}
