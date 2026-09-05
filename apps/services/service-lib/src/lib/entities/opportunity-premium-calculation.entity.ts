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
import { LookUp } from "./look-up.entity";
import type { Relation } from "typeorm";
import { Organisation } from "./organisation.entity";

@Entity("opportunity_premium_calculation")
export class OpportunityPremiumCalculation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "opportunity_id", type: "int", nullable: true })
  opportunityId!: number;

  @Column({ name: "activity_id", type: "int", nullable: true })
  activityId!: number;

  @Column({ name: "opportunity_activity_id", type: "int", nullable: true })
  opportunityActivityId!: number;

  @Column({ name: "status_lid", type: "int", nullable: true })
  statusLid!: number;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks?: string | null;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.opportunityId, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  @ManyToOne(() => LookUp, { onDelete: "SET NULL" })
  @JoinColumn({ name: "status_lid" })
  status: Relation<LookUp>;

  constructor(
    opportunityId: number,
    activityId: number,
    opportunityActivityId: number,
    statusLid: number,
    remarks?: string | null,
    createdBy?: number,
    updatedBy?: number
  ) {
    this.opportunityId = opportunityId;
    this.activityId = activityId;
    this.opportunityActivityId = opportunityActivityId;
    this.statusLid = statusLid;
    this.remarks = remarks;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
