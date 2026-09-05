import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { LookUp } from "./look-up.entity";

@Entity("filter_preference")
export class FilterPreference {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "entity", type: "varchar", length: 100 })
  entity!: string;

  @Column({ name: "user_id", type: "int", nullable: true })
  userId!: number;

  @Column({ name: "filter_name", type: "varchar", length: 255, nullable: true })
  filterName!: string;

  @Column({ name: "filter_type_lid", type: "int", nullable: false })
  filterTypeLid!: number;

  @Column({
    name: "default_filter_lid",
    type: "int",
    nullable: false,
  })
  defaultFilterLid!: number;

  @Column({ name: "filter_json", type: "jsonb" })
  filterJson!: object;

  @Column({ name: "table_setting_json", type: "jsonb" })
  tableSettingJson!: TableSettingItem[];

  @Column({ name: "status_lid", type: "int", nullable: false })
  statusLid!: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date;

  @Column({ name: "created_by", type: "int" })
  createdBy: number;

  @Column({ name: "updated_by", type: "int" })
  updatedBy: number;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "filter_type_lid", referencedColumnName: "id" })
  filterType: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "default_filter_lid", referencedColumnName: "id" })
  defaultFilter: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "status_lid", referencedColumnName: "id" })
  status: Relation<LookUp>;
}

export class TableSettingItem {
  index!: number;
  name!: string;
  hide!: boolean;
}
