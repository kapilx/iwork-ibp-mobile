import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";

@Entity("claim_activity_map")
export class ClaimActivityMap {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "policy_id", type: "int", nullable: false })
  policyId: number;

  @Column({ name: "claim_id", type: "int", nullable: false })
  claimId: number;

  @Column({ name: "activity_order", type: "int", nullable: true })
  activityOrder?: number;

  @Column({
    name: "activity_name",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  activityName?: string;

  @Column({ name: "stage_name", type: "varchar", length: 255, nullable: true })
  stageName?: string;

  @Column({
    name: "activity_table",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  activityTable?: string;

  @Column({
    name: "activity_key",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  activityKey?: string;

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

  @Column({ name: "completed_at", type: "timestamptz", nullable: "true" })
  completedAt?: Date | null;

  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  deletedAt?: Date;
}
