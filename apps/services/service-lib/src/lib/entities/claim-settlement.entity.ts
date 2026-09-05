import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("claim_settlement")
export class ClaimSettlement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "claim_activity_id", type: "int", nullable: true })
  claimActivityId?: number;

  @Column({ name: "settlement_date", type: "date", nullable: true })
  settlementDate?: Date;

  @Column({
    name: "settlement_amount",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  settlementAmount?: number;

  @Column({
    name: "approved_by",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  approvedBy?: string;

  @Column({ name: "mode_of_settlement_key", type: "varchar", length: 255, nullable: true })
  modeOfSettlementKey?: string;

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
