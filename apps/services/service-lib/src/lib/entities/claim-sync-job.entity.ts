import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum ClaimSyncJobStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum ClaimSyncJobPriority {
  HIGH = "HIGH",
  NORMAL = "NORMAL",
}

@Entity("claim_sync_job")
@Index(["status", "priority", "createdAt"])
@Index(["policyNumber", "status"])
export class ClaimSyncJob {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({ name: "policy_id", type: "int" })
  policyId!: number;

  @Column({ name: "policy_number", type: "varchar", length: 100 })
  policyNumber!: string;

  @Column({ name: "tpa_id", type: "int", nullable: true })
  tpaId?: number | null;

  @Column({
    name: "priority",
    type: "varchar",
    length: 10,
    default: ClaimSyncJobPriority.NORMAL,
  })
  priority!: ClaimSyncJobPriority;

  @Column({
    name: "status",
    type: "varchar",
    length: 20,
    default: ClaimSyncJobStatus.PENDING,
  })
  status!: ClaimSyncJobStatus;

  @Column({ name: "retry_count", type: "int", default: 0 })
  retryCount!: number;

  @Column({ name: "policy_start_date", type: "date", nullable: true })
  policyStartDate?: Date | null;

  @Column({ name: "policy_end_date", type: "date", nullable: true })
  policyEndDate?: Date | null;

  // TPA-specific parameters beyond the standard policy fields (e.g. groupCode for Paramount)
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
}
