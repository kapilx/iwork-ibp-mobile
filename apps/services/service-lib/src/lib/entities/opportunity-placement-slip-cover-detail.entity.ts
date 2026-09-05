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

@Entity("opportunity_placement_slip_cover_detail")
export class OpportunityPlacementSlipCoverDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "placement_slip_id", type: "int" })
  placementSlipId: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "cover_template_id", type: "int" })
  coverTemplateId: number;

  @Column({ name: "cover_name", type: "varchar" })
  coverName: string;

  @Column({ name: "cover_response", type: "varchar" })
  coverResponse: string;

  @Column({ name: "covers_meta", type: "jsonb", nullable: true })
  coversMeta?: Record<string, any>;

  @Column({ name: "created_by", type: "int" })
  createdBy: number;

  @Column({ name: "updated_by", type: "int" })
  updatedBy: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(
    () => OpportunityPlacementSlipGeneration,
    (placement) => placement.coverDetails
  )
  @JoinColumn({ name: "placement_slip_id" })
  placementSlip: OpportunityPlacementSlipGeneration;
}
