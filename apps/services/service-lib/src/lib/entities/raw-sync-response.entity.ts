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
import { SyncJob } from "./sync-job.entity";

export enum RawSyncResponseStatus {
  RECEIVED = "RECEIVED",
  // Set atomically with the pick, before the (potentially long-running,
  // record-by-record) parsing work starts — prevents a later parser cycle
  // from re-picking the same row while it's still being worked on.
  PROCESSING = "PROCESSING",
  PROCESSED = "PROCESSED",
  FAILED = "FAILED",
}

@Entity("raw_sync_response")
@Index(["processingStatus", "receivedAt"])
@Index(["appRefId", "scopeType", "scopeId"])
export class RawSyncResponse {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({ name: "job_id", type: "int" })
  jobId!: number;

  @Column({ name: "app_ref_id", type: "int" })
  appRefId!: number;

  @Column({ name: "sync_type", type: "varchar", length: 50 })
  syncType!: string;

  @Column({ name: "scope_type", type: "varchar", length: 20 })
  scopeType!: string;

  @Column({ name: "scope_id", type: "int", nullable: true })
  scopeId?: number | null;

  @Column({ name: "response_payload", type: "jsonb" })
  responsePayload!: any[];

  @Column({ name: "processing_status", type: "varchar", length: 20, default: RawSyncResponseStatus.RECEIVED })
  processingStatus!: RawSyncResponseStatus;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage?: string | null;

  @Column({ name: "received_at", type: "timestamptz" })
  receivedAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => SyncJob, { onDelete: "CASCADE" })
  @JoinColumn({ name: "job_id" })
  job!: Relation<SyncJob>;

  @ManyToOne(() => MstrExtApplicationRef, { onDelete: "CASCADE" })
  @JoinColumn({ name: "app_ref_id" })
  appRef!: Relation<MstrExtApplicationRef>;
}
