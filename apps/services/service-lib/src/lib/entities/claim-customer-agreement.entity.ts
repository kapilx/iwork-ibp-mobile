import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("claim_customer_agreement")
export class ClaimCustomerAgreement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "claim_activity_id" })
  claimActivityId!: number;

  @Column({ name: "agreement_date", type: "date", nullable: true })
  agreementDate?: Date;

  @Column({ name: "customer_confirmation_key", type: "varchar", length: 255, nullable: true })
  customerConfirmationKey?: string;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks?: string;

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
