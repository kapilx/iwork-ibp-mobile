import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { OpportunityPlacementSlipGeneration } from "./opportunity-placement-slip-generation.entity";
@Entity("opportunity_placement_slip_insurer_map")
export class OpportunityPlacementSlipInsurerMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "placement_slip_id", type: "int", nullable: false })
  placementSlipId: number;

  @Column({ name: "insurer_id", type: "int", nullable: false })
  insurerId: number;

  @Column({ name: "insurer_location_id", type: "int", nullable: false })
  insurerLocationId: number;

  @Column({ name: "insurer_branch_id", type: "int", nullable: false })
  insurerBranchId: number;

  @Column({ name: "insurer_contact_id", type: "int", nullable: false })
  insurerContactId: number;

  @Column({ name: "is_lead_insurer", type: "int", nullable: false })
  isLeadInsurer: number;

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
    () => OpportunityPlacementSlipGeneration,
    (placement) => placement.insurerMaps
  )
  @JoinColumn({ name: "placement_slip_id" })
  placementSlip: OpportunityPlacementSlipGeneration;
}
