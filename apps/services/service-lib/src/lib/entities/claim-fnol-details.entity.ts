import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("claim_fnol_details")
export class ClaimFnolDetails {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "claim_activity_id", type: "int", nullable: false })
  claimActivityId!: number;

  @Column({ name: "fnol_sent_date", type: "date", nullable: true })
  fnolSentDate?: Date;

  @Column({
    name: "insurer_reference_no",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  insurerReferenceNo?: string;

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
