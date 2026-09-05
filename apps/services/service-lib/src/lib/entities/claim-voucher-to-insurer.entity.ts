import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("claim_voucher_to_insurer")
export class ClaimVoucherToInsurer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "claim_activity_id" })
  claimActivityId!: number;

  @Column({ name: "sent_to_insurer_date", type: "date", nullable: true })
  sentToInsurerDate?: Date;

  @Column({
    name: "acknowledgement_ref_no",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  acknowledgementRefNo?: string;

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
