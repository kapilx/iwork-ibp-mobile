import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { Insurer } from "./insurer.entity";

@Entity("claim_loss_adjuster_details")
export class ClaimLossAdjusterDetails {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "claim_activity_id", type: "int", nullable: false })
  claimActivityId!: number;

  @Column({ name: "adjuster_appointment_date", type: "date", nullable: true })
  adjusterAppointmentDate?: Date;

  @Column({
    name: "adjuster_name",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  adjusterName?: string;

  @Column({
    name: "adjuster_phone",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  adjusterPhone?: string;

  @Column({
    name: "adjuster_email",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  adjusterEmail?: string;

  @Column({
    name: "adjuster_appointment_ref_no",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  adjusterAppointmentRefNo?: string;

  @Column({
    name: "adjuster_assigned_by",
    type: "int",
    nullable: true,
  })
  adjusterAssignedBy?: number;

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

  @ManyToOne(() => Insurer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "adjuster_assigned_by", referencedColumnName: "id" })
  insurer: Relation<Insurer>;
}
