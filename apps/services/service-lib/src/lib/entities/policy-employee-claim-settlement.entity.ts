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
import { PolicyClaim } from "./policy-employee-claim.entity";
import { FileUpload } from "./file-upload.entity";

@Entity("policy_claim_settlement")
@Index(["claimId"])
export class PolicyClaimSettlement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "claim_id", type: "int" })
  claimId!: number;

  @Column({ name: "source_file_upload_id", type: "int", nullable: true })
  sourceFileUploadId?: number;

  @ManyToOne(() => FileUpload)
  @JoinColumn({ name: "source_file_upload_id" })
  sourceFileUpload!: FileUpload;

  @Column({ name: "clm_sett_no", type: "varchar", length: 100, nullable: true })
  settlementNo?: string | null;

  @Column({ name: "clm_sett_amt", type: "numeric", nullable: true })
  settlementAmount?: number | null;

  @Column({ name: "clm_sett_date", type: "date", nullable: true })
  settlementDate?: Date | null;

  @Column({ name: "clm_sett_details", type: "text", nullable: true })
  settlementDetails?: string | null;

  @Column({ name: "clm_dis_amt", type: "numeric", nullable: true })
  disallowedAmount?: number | null;

  @Column({
    name: "clm_sett_chq_bnk",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  settlementChequeBank?: string | null;

  @Column({ name: "clm_sett_chq_dt", type: "date", nullable: true })
  settlementChequeDate?: Date | null;

  @Column({
    name: "clm_sett_chq_no",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  settlementChequeNo?: string | null;

  @Column({ name: "claim_activity_id", type: "int", nullable: true })
  claimActivityId?: number;

  @Column({
    name: "approved_by",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  approvedBy?: string;

  @Column({
    name: "mode_of_settlement_key",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  modeOfSettlementKey?: string;

  @Column({ name: "status_key", type: "varchar", length: 255, nullable: true })
  statusKey?: string;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => PolicyClaim, (claim) => claim.settlements, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "claim_id" })
  claim!: PolicyClaim;
}
