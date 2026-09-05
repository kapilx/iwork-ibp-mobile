import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "business_target" })
export class BusinessTarget {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "user_id", type: "int", nullable: false })
  userId: number;

  @Column({ name: "month", type: "date", nullable: false })
  month: Date;

  @Column({
    name: "entity_type",
    type: "varchar",
    length: 150,
    nullable: false,
  })
  entityType: string;

  @Column({ name: "kpi", type: "varchar", length: 150, nullable: false })
  kpi: string;

  @Column({
    name: "type_of_target",
    type: "varchar",
    length: 150,
    nullable: false,
  })
  typeOfTarget: string;

  @Column({ name: "value_of_target", type: "numeric", nullable: false })
  valueOfTarget: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
  })
  updatedAt: Date;
}
