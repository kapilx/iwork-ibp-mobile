import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { LocalizationReportFieldsCountryMap } from "./localization-report-fields-country-map.entity";

@Entity({ name: "localization_report_fields" })
export class LocalizationReportFields {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "field_key", type: "varchar", nullable: false })
  fieldKey: string;

  @Column({ name: "data_type", type: "varchar", nullable: false })
  dataType: string; // 'string' | 'date' | 'number' | 'float' (you can narrow this in TS)

  @Column({ name: "required", type: "boolean", nullable: false })
  required: boolean;

  @Column({ name: "active", type: "boolean", nullable: false })
  active: boolean;

  @Column({ name: "entity_type", type: "varchar", length: 30, nullable: true })
  entityType: string | null;

  @Column({ name: "description", type: "varchar", length: 200, nullable: true })
  description: string | null;

  @CreateDateColumn({
    name: "create_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @Column({ name: "meta_data", type: "jsonb", nullable: true })
  metaData: Record<string, any> | null;

  @OneToMany(
    () => LocalizationReportFieldsCountryMap,
    (map) => map.regulatoryKey
  )
  countryMappings: LocalizationReportFieldsCountryMap[];
}
