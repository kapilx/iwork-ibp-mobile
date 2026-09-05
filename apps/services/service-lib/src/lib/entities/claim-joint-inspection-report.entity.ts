import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("claim_joint_inspection_report")
export class ClaimJointInspectionReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "claim_activity_id" })
  claimActivityId!: number;

  @Column({ name: "inspection_date", type: "date", nullable: true })
  inspectionDate?: Date;

  @Column({
    name: "inspected_by",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  inspectedBy?: string;

  @Column({ name: "client", type: "int", nullable: true })
  client?: number;

  @Column({ name: "insurer", type: "int", nullable: true })
  insurer?: number;

  @Column({ name: "adjuster", type: "int", nullable: true })
  adjuster?: number;

  @Column({ name: "surveyor", type: "int", nullable: true })
  surveyor?: number;

  @Column({ name: "inspection_findings", type: "text", nullable: true })
  inspectionFindings?: string;

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
