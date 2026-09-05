import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("claim_survey_completed")
export class ClaimSurveyCompleted {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "claim_activity_id", type: "int", nullable: false })
  claimActivityId!: number;

  @Column({ name: "survey_date", type: "date", nullable: true })
  surveyDate?: Date;

  @Column({
    name: "surveyor_name",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  surveyorName?: string;

  @Column({ name: "findings_summary", type: "text", nullable: true })
  findingsSummary?: string;

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
