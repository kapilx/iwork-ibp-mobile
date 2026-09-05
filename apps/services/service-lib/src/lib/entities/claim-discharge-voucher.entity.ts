import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("claim_discharge_voucher")
export class ClaimDischargeVoucher {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "claim_activity_id" })
  claimActivityId!: number;

  @Column({
    name: "dv_number",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  dischargeVoucherNumber?: string;

  @Column({ name: "dv_date", type: "date", nullable: true })
  dischargeVoucherDate?: Date;

  @Column({
    name: "dv_amount",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  dischargeVoucherAmount?: number;

  @Column({ name: "status_key", type: "varchar", length: 255, nullable: true })
  statusKey?: string;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;
}
