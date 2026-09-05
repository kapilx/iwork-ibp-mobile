import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Insurer } from "./insurer.entity";
import { OpportunityPolicyHardCopy } from "./opportunity-policy-hard-copy.entity";

@Entity("opportunity_policy_hard_copy_insurer_map")
export class OpportunityPolicyHardCopyInsurerMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "policy_hard_copy_id", type: "int" })
  policyHardCopyId: number;

  @Column({ name: "insurer_id", type: "int", nullable: false })
  insurerId: number;

  @Column({ name: "insurer_location_id", type: "int", nullable: false })
  insurerLocationId: number;

  @Column({ name: "insurer_branch_id", type: "int", nullable: false })
  insurerBranchId: number;

  @Column({ name: "insurer_contact_id", type: "int", nullable: false })
  insurerContactId: number;

  @Column({ name: "is_lead_insurer", type: "int", nullable: true })
  isLeadInsurer: number;

  @Column({
    name: "share_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: false,
  })
  sharePercentage: number;

  @Column({
    name: "share_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: false,
  })
  shareAmount: number;

  @Column({
    name: "brokerage_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: false,
  })
  brokeragePercentage: number;

  @Column({
    name: "brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: false,
  })
  brokerageAmount: number;

  @Column({
    name: "terrorism_share_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  terrorismSharePercentage: number;

  @Column({
    name: "terrorism_share_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  terrorismShareAmount: number;

  @Column({
    name: "terrorism_brokerage_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
  })
  terrorismBrokeragePercentage: number;

  @Column({
    name: "terrorism_brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
  })
  terrorismBrokerageAmount: number;

  @Column({
    name: "total_brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  totalBrokerageAmount: number | null;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(
    () => OpportunityPolicyHardCopy,
    (policyHardCopy) => policyHardCopy.insurerDetails
  )
  @JoinColumn({ name: "policy_hard_copy_id" })
  policyHardCopy: Relation<OpportunityPolicyHardCopy>;

  @ManyToOne(() => Insurer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "insurer_id" })
  insurer: Relation<Insurer>;
}
