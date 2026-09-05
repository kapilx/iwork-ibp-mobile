import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("localization_company_regulatory_fields")
export class LocalizationCompanyRegulatoryFields {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "field_key", type: "varchar", nullable: false })
  fieldKey: string;

  @Column({
    name: "data_type",
    type: "varchar",
    nullable: false,
  })
  dataType: "string" | "date" | "number";

  @Column({ name: "required", type: "boolean", nullable: false })
  required: boolean;

  @Column({ name: "active", type: "boolean", nullable: false })
  active: boolean;

  @Column({ name: "display_order", type: "int", nullable: false })
  displayOrder: number;

  @CreateDateColumn({
    name: "create_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @Column({ name: "meta_data", type: "jsonb", nullable: true })
  metaData?: Record<string, any>;

  constructor(
    id: number,
    fieldKey: string,
    dataType: "string" | "date" | "number",
    required: boolean,
    active: boolean,
    displayOrder: number,
    createAt: Date,
    updatedAt: Date,
    metaData?: Record<string, any>
  ) {
    this.id = id;
    this.fieldKey = fieldKey;
    this.dataType = dataType;
    this.required = required;
    this.active = active;
    this.displayOrder = displayOrder;
    this.createAt = createAt;
    this.updatedAt = updatedAt;
    this.metaData = metaData;
  }
}   