import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { MstrExtApplicationRef } from "./mstr-ext-application-ref.entity";
import { Tpa } from "./tpa.entity";

@Entity("mstr_tpa_claim_api_config")
@Index("uq_tpa_api_type", ["tpaId", "apiType"], { unique: true })
export class MstrTpaClaimApiConfig {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({ name: "tpa_id", type: "int" })
  tpaId!: number;

  // Identifies what kind of API this config row represents, e.g. 'FETCH_CLAIMS'
  @Column({ name: "api_type", type: "varchar", length: 50 })
  apiType!: string;

  // FK to mstr_ext_application_ref — holds the actual API URL and auth config
  @Column({ name: "ref_id", type: "int" })
  refId!: number;

  // Dynamic parameter mapping: maps our internal field names to TPA API param names
  @Column({ name: "dynamic_param_mapping", type: "jsonb", default: {} })
  dynamicParamMapping!: Record<string, any>;

  // Field mapping: maps TPA response fields to our internal field names
  @Column({ name: "field_mapping", type: "jsonb", default: {} })
  fieldMapping!: Record<string, any>;

  // JSONPath or dot-notation to extract the claims array from the TPA response
  @Column({ name: "data_path", type: "varchar", length: 200, nullable: true })
  dataPath?: string | null;

  // Maps TPA status strings to our internal claim status values
  @Column({
    name: "status_mapping",
    type: "jsonb",
    default: {
      PAID: "settled",
      Pending: "pending",
      Settled: "settled",
      pending: "pending",
      settled: "settled",
      Approved: "settled",
      Rejected: "rejected",
      Cancelled: "rejected",
      DEFICIENT: "rejected",
      OUTSTANDING: "pending",
    },
  })
  statusMapping!: Record<string, string>;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => Tpa)
  @JoinColumn({ name: "tpa_id" })
  tpa!: Relation<Tpa>;

  @ManyToOne(() => MstrExtApplicationRef)
  @JoinColumn({ name: "ref_id" })
  ref!: Relation<MstrExtApplicationRef>;
}
