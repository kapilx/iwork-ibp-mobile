import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("claim_informed")
export class ClaimInformed {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "claim_activity_id", type: "int", nullable: false })
  claimActivityId!: number;

  @Column({ name: "intimation_datetime", type: "timestamptz", nullable: true })
  intimationDatetime?: Date;

  @Column({ name: "intimated_by_key", type: "varchar", length: 255, nullable: true })
  intimatedByKey?: string;

  @Column({ name: "intimation_channel_key", type: "varchar", length: 255, nullable: true })
  intimationChannelKey?: string;

  @Column({ name: "loss_location_id", type: "int", nullable: true })
  lossLocationId?: number;

  @Column({ name: "description_of_loss", type: "text", nullable: true })
  descriptionOfLoss?: string;

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
