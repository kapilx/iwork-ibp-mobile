import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("mstr_activity")
export class MstrActivity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ name: "ro_name", type: "varchar", length: 255 })
  roName: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({
    name: "activity_key",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  activityKey: string;

  @Column({ name: "activity_detail_meta", type: "jsonb", nullable: true })
  activityMeta: Record<string, any>;

  @Column({ name: "opportunity_table", type: "varchar", nullable: true })
  opportunityTable: string;

  @Column({ name: "activity_order", type: "int" })
  activityOrder!: number;

  @Column({ name: "created_by", type: "int" })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  constructor(
    name: string,
    roName: string,
    description: string,
    activityMeta: Record<string, any>,
    opportunityTable: string,
    activityKey: string,
    activityOrder: number,
    createdBy: number,
    updatedBy: number
  ) {
    this.name = name;
    this.roName = roName;
    this.description = description;
    this.activityMeta = activityMeta;
    this.opportunityTable = opportunityTable;
    this.activityKey = activityKey;
    this.activityOrder = activityOrder;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
