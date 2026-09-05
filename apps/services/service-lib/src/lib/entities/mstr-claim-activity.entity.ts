import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("mstr_claim_activity")
export class MstrClaimActivity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "name", type: "varchar", length: 255, nullable: false })
  name!: string;

  @Column({ name: "description", type: "text", nullable: true })
  description?: string;

  @Column({
    name: "activity_key",
    type: "varchar",
    length: 100,
    nullable: false,
  })
  activityKey!: string;

  @Column({
    name: "activity_table",
    type: "varchar",
    length: 255,
    nullable: false,
  })
  activityTable!: string;

  @Column({ name: "activity_order", type: "int", nullable: false })
  activityOrder!: number;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
