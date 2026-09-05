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
import type { Relation } from "typeorm";

@Entity("opportunity_rfp_detail")
export class OpportunityRfpDetail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "opportunity_id", type: "int", nullable: false })
  opportunityId!: number;

  @Column({ name: "opportunity_activity_id", type: "int", nullable: false })
  opportunityActivityId!: number;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks?: string;

  @Column({
    name: "status_lid",
    type: "int",
    nullable: false,
  })
  statusLid!: number;

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
}
