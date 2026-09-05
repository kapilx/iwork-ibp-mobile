import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Relation,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { LookUp } from "./look-up.entity";
import { Opportunity } from "./opportunity.entity";

@Entity("opportunity_lost")
export class OpportunityLost {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "opportunity_id", type: "int", nullable: false })
  opportunityId: number;

  @Column({ name: "remarks", type: "varchar", nullable: true })
  remarks?: string;

  @Column({ name: "reason_for_loss_lid", type: "int", nullable: true })
  reasonForLossLid?: number;

  @Column({ name: "status_lid", type: "int", nullable: true })
  statusLid?: number;

  @Column({ name: "injected_by", type: "varchar", default: true })
  injectedBy: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy: number;

  @OneToOne(() => Opportunity)
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "reason_for_loss_lid" })
  reasonForLoss: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "status_lid" })
  status: Relation<LookUp>;

  constructor(
    opportunityId: number,
    statusLid: number,
    reasonForLossLid?: number,
    remarks?: string
  ) {
    this.opportunityId = opportunityId;
    this.statusLid = statusLid;
    this.reasonForLossLid = reasonForLossLid;
    this.remarks = remarks;
  }
}
