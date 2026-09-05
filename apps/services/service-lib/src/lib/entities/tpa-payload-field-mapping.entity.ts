import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { TpaExternalFeatureConfig } from "./tpa-external-feature-config.entity";

@Entity({ name: "tpa_payload_field_mapping" })
export class TpaPayloadFieldMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "feature_config_id", type: "int" })
  featureConfigId: number;

  @Column({ name: "external_field_name", type: "varchar", length: 100 })
  externalFieldName: string;

  // STATIC | POLICY | EMPLOYEE | ENROLLMENT | USER_INPUT
  @Column({ name: "source_type", type: "varchar", length: 20 })
  sourceType: string;

  @Column({ name: "source_field", type: "varchar", length: 100, nullable: true })
  sourceField: string | null;

  @Column({ name: "static_value", type: "varchar", length: 255, nullable: true })
  staticValue: string | null;

  @Column({ name: "is_required", type: "boolean", default: true })
  isRequired: boolean;

  @Column({ name: "field_type", type: "varchar", length: 20, nullable: true })
  fieldType: string | null;

  @Column({ name: "date_format", type: "varchar", length: 30, nullable: true })
  dateFormat: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => TpaExternalFeatureConfig, (cfg) => cfg.fieldMappings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "feature_config_id" })
  featureConfig: Relation<TpaExternalFeatureConfig>;
}
