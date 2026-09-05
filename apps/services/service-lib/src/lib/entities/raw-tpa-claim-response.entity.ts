import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ClaimSyncJob } from "./claim-sync-job.entity";

export enum RawTpaClaimResponseStatus {
  RECEIVED = "RECEIVED",
  PROCESSED = "PROCESSED",
  FAILED = "FAILED",
}

@Entity("raw_tpa_claim_response")
@Index(["processingStatus", "receivedAt"])
@Index(["policyNumber"])
export class RawTpaClaimResponse {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({ name: "job_id", type: "int" })
  jobId!: number;

  @Column({ name: "policy_number", type: "varchar", length: 100 })
  policyNumber!: string;

  @Column({ name: "tpa_id", type: "int", nullable: true })
  tpaId?: number | null;

  // Full array of claim objects returned by TPA API
  @Column({ name: "response_payload", type: "jsonb" })
  responsePayload!: Record<string, any>[];

  @Column({
    name: "processing_status",
    type: "varchar",
    length: 20,
    default: RawTpaClaimResponseStatus.RECEIVED,
  })
  processingStatus!: RawTpaClaimResponseStatus;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage?: string | null;

  @Column({ name: "received_at", type: "timestamptz" })
  receivedAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => ClaimSyncJob)
  @JoinColumn({ name: "job_id" })
  job!: ClaimSyncJob;
}
