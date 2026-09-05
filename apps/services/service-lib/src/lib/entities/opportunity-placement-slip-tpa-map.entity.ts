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

@Entity("opportunity_placement_slip_tpa_map")
export class OpportunityPlacementSlipTpaMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "placement_slip_id", type: "int", nullable: false })
  placementSlipId: number;

  @Column({ name: "tpa_id", type: "int", nullable: false })
  tpaId: number;

  @Column({ name: "tpa_location_id", type: "int", nullable: false })
  tpaLocationId: number;

  @Column({ name: "tpa_branch_id", type: "int", nullable: false })
  tpaBranchId: number;

  @Column({ name: "tpa_contact_id", type: "int", nullable: true })
  tpaContactId: number;

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
    (placement) => placement.tpaMaps
  )
  @JoinColumn({ name: "placement_slip_id" })
  placementSlip: OpportunityPlacementSlipGeneration;
}
