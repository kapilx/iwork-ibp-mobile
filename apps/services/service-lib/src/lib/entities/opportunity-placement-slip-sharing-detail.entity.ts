import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { OpportunityPlacementSlipGeneration } from "./opportunity-placement-slip-generation.entity";
@Entity("opportunity_placement_slip_sharing_detail")
export class OpportunityPlacementSlipSharingDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "placement_slip_id", type: "int" })
  placementSlipId: number;

  @Column({ name: "insurer_id", type: "int" })
  insurerId: number;

  @Column({
    name: "share_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
  })
  sharePercentage: number;

  @Column({
    name: "share_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
  })
  shareAmount: number;

  @Column({
    name: "brokerage_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
  })
  brokeragePercentage: number;

  @Column({
    name: "brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
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

  @Column({ name: "created_by", type: "int" })
  createdBy: number;

  @Column({ name: "updated_by", type: "int" })
  updatedBy: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(
    () => OpportunityPlacementSlipGeneration,
    (placement) => placement.sharingDetails
  )
  @JoinColumn({ name: "placement_slip_id" })
  placementSlip: OpportunityPlacementSlipGeneration;
}
