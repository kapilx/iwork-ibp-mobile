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
import { MstrExtApplicationRef } from "./mstr-ext-application-ref.entity";

// @ts-ignore - TypeORM decorators
@Entity({ name: "mstr_ext_app_response_mapping" })
export class MstrExtAppResponseMapping {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "app_ref_id", type: "integer" })
  appRefId: number;

  // 1 = step 1 (auth/verification), 2 = step 2 (data/magic URL)
  @Column({ name: "step", type: "integer" })
  step: number;

  // Dot-notation path into TPA JSON response, e.g. "access_token", "response.data.url", "members.0.id"
  @Column({ name: "response_key", type: "varchar", length: 200 })
  responseKey: string;

  // PLACEHOLDER  → outputKey is a placeholder name → value becomes {{name}} in step 2 payload
  // STANDARD_KEY → outputKey is a standard key (REDIRECT_URL, MEMBER_ID, etc.) consumed by IBP
  // DB_COLUMN    → outputKey is a DB column name in targetTable, written by the sync scheduler
  @Column({ name: "target_type", type: "varchar", length: 20 })
  targetType: string;

  @Column({ name: "output_key", type: "varchar", length: 100 })
  outputKey: string;

  // Only used when targetType = DB_COLUMN
  @Column({ name: "target_table", type: "varchar", length: 100, nullable: true })
  targetTable: string | null;

  // Step 1 only: marks which PLACEHOLDER field's extracted value is sent as Bearer header to step 2
  @Column({ name: "is_auth_token", type: "boolean", default: false })
  isAuthToken: boolean;

  // DB_COLUMN only, secondary tables only:
  // when true, responseKey is ignored — this column receives the auto-generated PK
  // returned after inserting the primary (syncTargetTable) row (cross-table FK injection)
  @Column({ name: "is_primary_fk", type: "boolean", default: false })
  isPrimaryFk: boolean;

  // Optional transformation applied to the extracted value before using it
  // e.g. {"type":"DATE_FORMAT","from":"DD/MM/YYYY","to":"YYYY-MM-DD"}
  //      {"type":"SPLIT","delimiter":"|","output":"ARRAY"}
  //      {"type":"NUMBER_PARSE"}
  @Column({ name: "transform", type: "jsonb", nullable: true })
  transform: Record<string, any> | null;

  @Column({ name: "display_order", type: "integer", default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => MstrExtApplicationRef, { onDelete: "CASCADE" })
  @JoinColumn({ name: "app_ref_id" })
  appRef: Relation<MstrExtApplicationRef>;
}
