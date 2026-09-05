import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { LocalizationReportFields } from "./localization-report-fields.entity";
import { LocalizationCountry } from "./localization-country.entity";

@Entity({ name: "localization_report_fields_country_map" })
export class LocalizationReportFieldsCountryMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "country_id", type: "int", nullable: false })
  countryId: number;

  @Column({ name: "regulatory_key_id", type: "int", nullable: false })
  regulatoryKeyId: number;

  @Column({ name: "report_section", type: "varchar", nullable: false })
  reportSection: string; // e.g. 'bizdone'

  @Column({ name: "activity_section", type: "varchar", nullable: false })
  activitySection: string; // e.g. 'companySummary', 'policySummary', ...

  @Column({ name: "display_order", type: "int", nullable: false })
  displayOrder: number;

  @Column({ name: "field_label", type: "varchar", nullable: false })
  fieldLabel: string;

  @Column({ name: "field_alias", type: "varchar", nullable: false })
  fieldAlias: string;

  @Column({ name: "field_value", type: "varchar", nullable: false })
  fieldValue: string;

  @Column({ name: "status", type: "varchar", nullable: false })
  status: string;

  @CreateDateColumn({
    name: "created_at",
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

  // Relations

  @ManyToOne(() => LocalizationReportFields, (field) => field.countryMappings, {
    onUpdate: "NO ACTION",
    onDelete: "NO ACTION",
  })
  @JoinColumn({ name: "regulatory_key_id" })
  regulatoryKey: LocalizationReportFields;

  @ManyToOne(() => LocalizationCountry, (country) => country.fieldMappings, {
    onUpdate: "NO ACTION",
    onDelete: "NO ACTION",
  })
  @JoinColumn({ name: "country_id" })
  country: LocalizationCountry;
}
