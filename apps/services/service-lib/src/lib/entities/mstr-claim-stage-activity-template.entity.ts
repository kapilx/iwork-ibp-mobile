import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("mstr_claim_stage_activity_template")
export class MstrClaimStageActivityTemplate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "stage_id", type: "int", nullable: false })
  stageId!: number;

  @Column({ name: "stage_name", type: "varchar", length: 255, nullable: false })
  stageName!: string;

  @Column({ name: "activity_id", type: "int", nullable: false })
  activityId!: number;

  @Column({
    name: "activity_name",
    type: "varchar",
    length: 255,
    nullable: false,
  })
  activityName!: string;

  @Column({
    name: "activity_key",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  activityKey?: string;

  @Column({
    name: "activity_table",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  activityTable?: string;

  @Column({ name: "stage_activity_order", type: "int", nullable: true })
  stageActivityOrder?: number;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
