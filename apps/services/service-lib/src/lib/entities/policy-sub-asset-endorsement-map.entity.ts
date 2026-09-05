import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("policy_sub_asset_endorsement_map")
export class PolicySubAssetEndorsementMap {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "policy_id", type: "int" })
  policyId!: number;

  @Column({ name: "cover_code", type: "varchar", length: 50 })
  coverCode!: string;
  @Column({ name: "sub_asset_id", type: "int" })
  subAssetId!: number;
  @Column({ name: "endorsement_addition_batch_id", type: "int" })
  endorsementAdditionBatchId!: number;
  @Column({ name: "endorsement_deletion_batch_id", type: "int" })
  endorsementDeletionBatchId!: number;
  @Column({ name: "endorsement_status", type: "varchar", length: 100 })
  endorsementStatus!: string;
  @Column({ name: "effective_date", type: "timestamptz" })
  effectiveDate!: Date;
  @Column({ name: "deletion_effective_date", type: "timestamptz" })
  deletionEffectiveDate!: Date;
  @Column({
    name: "sub_limit_amount",
    type: "numeric",
    precision: 15,
    scale: 2,
    nullable: true,
  })
  subLimitAmount?: number;

  @Column({ name: "endorsement_addition_id", type: "int", nullable: true })
  endorsementAdditionId?: number | null;

  @Column({ name: "endorsement_deletion_id", type: "int", nullable: true })
  endorsementDeletionId?: number | null;
}
