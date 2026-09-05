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
  OneToOne,
} from "typeorm";

import { OpportunityPlacementSlipGeneration } from "./opportunity-placement-slip-generation.entity";
import { LookUp } from "./look-up.entity";

@Entity("opportunity_placement_slip_cd_detail")
export class OpportunityPlacementSlipCDDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "placement_slip_id", type: "int", nullable: false })
  placementSlipId: number;

  @Column({ name: "payment_type_lid", type: "int", nullable: true })
  paymentTypeLid: number;

  @Column({ name: "cd_account_type_lid", type: "int", nullable: true })
  cdAccountTypeLid: number;

  @Column({ name: "account_name", type: "varchar", nullable: true })
  accountName: string;

  @Column({ name: "account_number", type: "varchar", nullable: true })
  accountNumber: string;

  @Column({ name: "open_balance", type: "numeric", nullable: true })
  openBalance: number;

  @Column({ name: "cd_safe_limit", type: "numeric", precision: 21, scale: 4, nullable: false, default: 10 })
  cdSafeLimit: number;

  @Column({ name: "select_cd_account", type: "numeric", nullable: true })
  selectCdAccount: number;

  @Column({ name: "transaction_type_lid", type: "int", nullable: true })
  transactionTypeLid: number;

  @Column({ name: "cheque_date", type: "date", nullable: true })
  chequeDate: Date;

  @Column({ name: "cheque_amount", type: "numeric", nullable: true })
  chequeAmount: number;

  @Column({ name: "cheque_number", type: "varchar", nullable: true })
  chequeNumber: string;

  @Column({ name: "bank_name", type: "varchar", nullable: true })
  bankName: string;

  @Column({ name: "remarks", type: "varchar", nullable: true })
  remarks?: string;

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

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "transaction_type_lid", referencedColumnName: "id" })
  transactionType!: LookUp;

  @ManyToOne(
    () => OpportunityPlacementSlipGeneration,
    (placement) => placement.cdDetails
  )
  @JoinColumn({ name: "placement_slip_id" })
  placementSlip: OpportunityPlacementSlipGeneration;
}
