import type { Relation } from "typeorm";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Company } from "./company.entity";
import { LookUp } from "./look-up.entity";
import { State } from "./state.entity";

@Entity("state_gst_detail")
export class StateGstDetail {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "state_id", type: "int" })
  stateId!: number;

  @Column({ name: "gst_number", type: "varchar", length: 15, unique: true })
  gstNumber!: string;

  @Column({ name: "gst_category_lid", type: "int" })
  gstCategoryLid!: number;

  @Column({ name: "company_id", type: "int" })
  companyId?: number;

  @Column({ name: "entity_type", type: "varchar", length: 50, default: "COMPANY" })
  entityType!: string;

  @Column({ name: "status_lid", type: "int", nullable: true })
  statusLid?: number;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt?: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt?: Date;

  @DeleteDateColumn({
    name: "deleted_at",
    type: "timestamptz",
    nullable: true,
  })
  deletedAt?: Date | null;

  @ManyToOne(() => State, (state) => state.id, { eager: true })
  @JoinColumn({ name: "state_id" })
  state?: State;

  @ManyToOne(() => Company, (company) => company.stateGstDetails, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: "company_id" })
  company?: Relation<Company>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "gst_category_lid", referencedColumnName: "id" })
  gstCategory!: LookUp;

  constructor(
    stateId: number,
    gstNumber: string,
    gstCategory: Relation<LookUp>,
    company: Relation<Company>
  ) {
    this.stateId = stateId;
    this.gstNumber = gstNumber;
    this.gstCategory = gstCategory;
    this.company = company;
  }
}
