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
import { TpaSsoConfig } from "./tpa-sso-config.entity";

// One row per field the SSO link needs to carry, for a given tpa_sso_config.
// Mirrors tpa_payload_field_mapping's shape on purpose (STATIC | POLICY | EMPLOYEE),
// just parented to tpa_sso_config instead of tpa_external_feature_config.
// SYSTEM is the one addition specific to this table: a value computed at call time
// instead of read from our data or a literal — currently just epoch timestamps
// (source_field = CURRENT_EPOCH_SECONDS | CURRENT_EPOCH_MILLIS), e.g. Volo's
// validTimestamp, which the TPA checks against its own clock on redemption.
@Entity({ name: "tpa_sso_field_mapping" })
export class TpaSsoFieldMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "sso_config_id", type: "int" })
  ssoConfigId: number;

  // Outbound query-param name (GHPL: "EncryptedPartnerId" | FHPL: "partnerId" | HITPA: "GC").
  // Ignored when the parent config's sso_token_shape = COMBINED_JSON — the JSON key is used
  // there instead (still this same column, just serialized into the payload, not the URL).
  @Column({ name: "external_field_name", type: "varchar", length: 100 })
  externalFieldName: string;

  // STATIC | POLICY | EMPLOYEE
  @Column({ name: "source_type", type: "varchar", length: 20 })
  sourceType: string;

  // Our field name to read from, e.g. "externalTpaPolicyId", "companyEmployeeId".
  // Required unless source_type = STATIC.
  @Column({ name: "source_field", type: "varchar", length: 100, nullable: true })
  sourceField: string | null;

  // Literal value to send, e.g. "MAIN", "home". Required when source_type = STATIC.
  @Column({ name: "static_value", type: "varchar", length: 255, nullable: true })
  staticValue: string | null;

  @Column({ name: "display_order", type: "int", default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => TpaSsoConfig, (c) => c.fieldMappings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sso_config_id" })
  ssoConfig: Relation<TpaSsoConfig>;
}
