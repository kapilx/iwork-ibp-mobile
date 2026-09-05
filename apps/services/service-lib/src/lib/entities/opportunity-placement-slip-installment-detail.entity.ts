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

/**
 * Entity for opportunity_placement_slip_installement_detail table.
 */
@Entity("opportunity_placement_slip_installement_detail")
export class OpportunityPlacementSlipInstallementDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "placement_slip_id", type: "int", nullable: false })
  placementSlipId: number;

  @Column({ name: "first_installment_date", type: "date", nullable: true })
  firstInstallmentDate: Date;

  @Column({ name: "installment_amount", type: "numeric", nullable: true })
  installmentAmount: number;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(
    () => OpportunityPlacementSlipGeneration,
    (placement) => placement.installmentDates
  )
  @JoinColumn({ name: "placement_slip_id" })
  placementSlip: OpportunityPlacementSlipGeneration;

  constructor(
    placementSlipId: number,
    firstInstallmentDate: Date,
    installmentAmount: number,
    createdBy: number,
    updatedBy: number
  ) {
    this.placementSlipId = placementSlipId;
    this.firstInstallmentDate = firstInstallmentDate;
    this.installmentAmount = installmentAmount;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
