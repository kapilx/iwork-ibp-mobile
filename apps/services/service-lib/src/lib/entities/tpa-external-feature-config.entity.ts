import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Tpa } from "./tpa.entity";
import { MstrExtApplicationRef } from "./mstr-ext-application-ref.entity";
import { MstrTpaFeatureType } from "./mstr-tpa-feature-type.entity";
import { TpaPayloadFieldMapping } from "./tpa-payload-field-mapping.entity";

@Entity({ name: "tpa_external_feature_config" })
export class TpaExternalFeatureConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "tpa_id", type: "int", nullable: true })
  tpaId: number | null;

  @Column({ name: "feature_type_id", type: "int" })
  featureTypeId: number;

  @Column({ name: "app_ref_id", type: "int", nullable: true })
  appRefId: number | null;

  @Column({ name: "label", type: "varchar", length: 100 })
  label: string;

  @Column({ name: "button_label", type: "varchar", length: 50 })
  buttonLabel: string;

  @Column({ name: "display_order", type: "int", default: 0 })
  displayOrder: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  // Machine type key used by worker schedulers: 'FETCH_CLAIMS', 'FETCH_ECARD', 'FETCH_HOSPITALS'
  @Column({ name: "api_type", type: "varchar", length: 50, nullable: true })
  apiType: string | null;

  // Maps our internal field names → TPA API param names (used by worker to build dynamic fields)
  // e.g. { "policyNumber": "POLICY_NUMBER", "groupCode": "GROUP_CODE" }
  @Column({ name: "dynamic_param_mapping", type: "jsonb", nullable: true })
  dynamicParamMapping: Record<string, string> | null;

  // Dot-notation path into TPA response to reach the data array (null = root is the array)
  @Column({ name: "data_path", type: "varchar", length: 200, nullable: true })
  dataPath: string | null;

  // Maps TPA response field names → our standard field keys (used by parser)
  // e.g. { "CLAIM_ID": "tpA_CLAIM_NO", "TPA_ID": "tpA_HEALTH_ID" }
  @Column({ name: "field_mapping", type: "jsonb", nullable: true })
  fieldMapping: Record<string, string> | null;

  // Maps TPA claim status strings → our internal status values (used by parser)
  // e.g. { "PAID": "settled", "OUTSTANDING": "pending", "DEFICIENT": "rejected" }
  @Column({ name: "status_mapping", type: "jsonb", nullable: true })
  statusMapping: Record<string, string> | null;

  // On the INTIMATE_CLAIM row: SINGLE = one combined call (legacy/ISBS), MULTI = separate
  // intimate + submit calls (FHPL, Health India). NULL is treated as SINGLE.
  @Column({ name: "claim_form_type", type: "varchar", length: 10, nullable: true })
  claimFormType: "SINGLE" | "MULTI" | null;

  // On the SUBMIT_CLAIM row for a MULTI TPA: SINGLE_CALL = one request with all fields +
  // documents (FHPL), PER_DOCUMENT = one request per document, looped (Health India).
  @Column({ name: "submit_execution_mode", type: "varchar", length: 20, nullable: true })
  submitExecutionMode: "SINGLE_CALL" | "PER_DOCUMENT" | null;

  // Internal only, not admin-configurable. On a SINGLE-flow INTIMATE_CLAIM row, set to
  // 'ISBS_BROKER_CLAIM' to keep routing through the hardcoded callIsbsBrokerClaim()
  // integration. NULL (the default for any other TPA) uses the generic single-step path.
  @Column({ name: "legacy_handler", type: "varchar", length: 50, nullable: true })
  legacyHandler: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => Tpa, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "tpa_id" })
  tpa: Relation<Tpa> | null;

  @ManyToOne(() => MstrTpaFeatureType, (ft) => ft.featureConfigs, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "feature_type_id" })
  featureType: Relation<MstrTpaFeatureType>;

  @ManyToOne(() => MstrExtApplicationRef, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({ name: "app_ref_id" })
  appRef: Relation<MstrExtApplicationRef> | null;

  @OneToMany(() => TpaPayloadFieldMapping, (m) => m.featureConfig, { cascade: true })
  fieldMappings: Relation<TpaPayloadFieldMapping[]>;
}
