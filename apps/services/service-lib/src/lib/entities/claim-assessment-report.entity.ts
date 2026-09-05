import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("claim_assessment_report")
export class ClaimAssessmentReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "claim_activity_id" })
  claimActivityId!: number;

  @Column({ name: "report_date", type: "date", nullable: true })
  reportDate?: Date;

  @Column({
    name: "report_by_key",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  reportByKey?: string;

  @Column({
    name: "assessed_loss_amount",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  assessedLossAmount?: number;

  @Column({ name: "key_observations", type: "text", nullable: true })
  keyObservations?: string;

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
