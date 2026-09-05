import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("claim_payment")
export class ClaimPayment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "claim_activity_id", type: "int", nullable: true })
  claimActivityId?: number;

  @Column({ name: "payment_date", type: "date", nullable: true })
  paymentDate?: Date;

  @Column({
    name: "payment_reference_no",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  paymentReferenceNo?: string;

  @Column({
    name: "paid_amount",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  paidAmount?: number;

  @Column({ name: "mode_of_payment_key", type: "varchar", length: 255, nullable: true })
  modeOfPaymentKey?: string;

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
