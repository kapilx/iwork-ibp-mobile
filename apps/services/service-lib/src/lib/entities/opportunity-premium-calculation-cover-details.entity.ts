import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Opportunity } from "./opportunity.entity";
import { OpportunityCoverMap } from "./opportunity-cover.entity";
import type { Relation } from "typeorm";

@Entity("opportunity_premium_cover_detail")
export class OpportunityPremiumCoverDetail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "opportunity_id", type: "int", nullable: false })
  opportunityId!: number;

  @Column({ name: "cover_map_id", type: "int", nullable: false })
  coverMapId!: number;

  @Column({ name: "policy_type_lid", type: "int", nullable: false })
  policyTypeLid!: number;

  @Column({ name: "cover_name", type: "varchar", nullable: true })
  coverName!: string;

  @Column({ name: "cover_response", type: "varchar", nullable: true })
  coverResponse!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.opportunityId, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_id" })
  opportunity!: Relation<Opportunity>;

  @ManyToOne(() => OpportunityCoverMap, (coverMap) => coverMap.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "cover_map_id" })
  coverMap!: Relation<OpportunityCoverMap>;

  constructor(
    opportunityId: number,
    coverMapId: number,
    policyTypeLid: number,
    coverName: string,
    coverResponse: string,
    createdBy?: number,
    updatedBy?: number
  ) {
    this.opportunityId = opportunityId;
    this.coverMapId = coverMapId;
    this.policyTypeLid = policyTypeLid;
    this.coverName = coverName;
    this.coverResponse = coverResponse;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
