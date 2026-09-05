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
import { PolicyClaim } from "./policy-employee-claim.entity";
import { PolicyClaimStatus } from "./policy-claim-status.entity";

@Entity("policy_claim_audit")
@Index(["policyClaimId"])
@Index(["policyClaimStatusId"])
@Index(["userId"])
export class PolicyClaimAudit {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "policy_claim_id", type: "int" })
  policyClaimId!: number;

  @Column({ name: "policy_claim_status_id", type: "int" })
  policyClaimStatusId!: number;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @Column({ name: "source_file_upload_id", type: "int", nullable: true })
  sourceFileUploadId?: number | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => PolicyClaim, { onDelete: "CASCADE" })
  @JoinColumn({ name: "policy_claim_id" })
  policyClaim!: PolicyClaim;

  @ManyToOne(() => PolicyClaimStatus, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "policy_claim_status_id" })
  policyClaimStatus!: PolicyClaimStatus;
}
