import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("employee_hierarchy")
export class EmployeeHierarchy {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({
    name: "user_id", type: "integer",
  })
  userId: number;

  @Column({ name: "reporting_user_id", type: "integer" })
  reportingUserId: number;

  @Column({ name: "created_by", type: "varchar", length: 255, nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "varchar", length: 255, nullable: false })
  updatedBy: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
  })
  updatedAt!: Date;

  constructor(
    id: number,
    userId: number,
    reportingUserId: number,
    createdBy: number,
    updatedBy: number,
  ) {
    this.id = id;
    this.userId = userId;
    this.reportingUserId = reportingUserId;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
