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

@Entity("opportunity_rfp_cover_detail")
export class OpportunityRfpCoverDetail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "opportunity_id", type: "int", nullable: false })
  opportunityId: number;

  @Column({ name: "cover_map_id", type: "int", nullable: false })
  coverMapId: number;

  @Column({ name: "policy_type_id", type: "int", nullable: false })
  policyTypeId: number;

  @Column({ name: "cover_name", type: "varchar", nullable: false })
  coverName: string;

  @Column({ name: "cover_response", type: "varchar", nullable: false })
  coverResponse: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy: number;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.opportunityId, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  @ManyToOne(() => OpportunityCoverMap, (coverMap) => coverMap.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "cover_map_id" })
  coverMap: Relation<OpportunityCoverMap>;
}
