import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";

@Entity("lookup_data")
export class LookUp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "lookup_key", type: "varchar", length: 255 })
  lookUpKey: string;

  @Column({ name: "lookup_name", type: "varchar", length: 255 })
  lookUpName: string;

  @Column({ name: "value_key", type: "varchar", length: 255 })
  lookUpValueKey: string;

  @Column({ name: "value", type: "text" })
  lookUpValue: string;

  @Column({ name: "description", type: "text" })
  description: string;

  @Column({ name: "lookup_order", type: "int" })
  lookUpOrder: number;

  @Column({ name: "organisation_id", type: "int" })
  organisationId: number;

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

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date;

  @Column({ name: "status", type: "int", default: 1 })
  status: number;

  @Column({ name: "created_by", type: "varchar" })
  createdBy: string;

  @Column({ name: "updated_by", type: "varchar" })
  updatedBy: string;

  constructor(
    id: number,
    lookUpKey: string,
    lookUpName: string,
    lookUpValueKey: string,
    lookUpValue: string,
    description: string,
    lookUpOrder: number,
    status: number,
    createdAt: Date,
    updatedAt: Date,
    createdBy: string,
    updatedBy: string
  ) {
    this.id = id;
    this.lookUpKey = lookUpKey;
    this.lookUpName = lookUpName;
    this.lookUpValueKey = lookUpValueKey;
    this.lookUpValue = lookUpValue;
    this.description = description;
    this.lookUpOrder = lookUpOrder;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
