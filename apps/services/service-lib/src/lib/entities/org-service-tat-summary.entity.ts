import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";
import { ServiceMaster } from "./service-master.entity";
import { TatBucket } from "./tat-bucket.entity";

@Entity({ name: "org_service_tat_summary" })
@Index(
  [
    "orgId",
    "companyId",
    "policyId",
    "serviceId",
    "tatBucketId",
    "snapshotDate",
  ],
  { unique: true }
)
export class OrgServiceTatSummary {
  @PrimaryGeneratedColumn({ name: "id", type: "bigint" })
  id!: number;

  @Column({ name: "org_id", type: "int" })
  orgId!: number;

  @Column({ name: "company_id", type: "int" })
  companyId!: number;

  @Column({ name: "policy_id", type: "int" })
  policyId!: number;

  @Column({ name: "service_id", type: "int" })
  serviceId!: number;

  @Column({ name: "tat_bucket_id", type: "int" })
  tatBucketId!: number;

  @Column({ name: "snapshot_date", type: "date" })
  snapshotDate!: Date;

  @Column({ name: "event_count", type: "int", default: 0 })
  eventCount!: number;

  @Column({
    name: "bucket_score",
    type: "numeric",
    precision: 14,
    scale: 4,
    default: 0,
  })
  bucketScore!: number;

  @Column({
    name: "average_tat_days",
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  averageTatDays?: number | null;

  @Column({
    name: "tat_weight",
    type: "numeric",
    precision: 10,
    scale: 4,
    default: 0,
  })
  tatWeight!: number;

  @Column({ name: "is_compliant", type: "boolean", default: true })
  isCompliant!: boolean;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt?: Date | null;

  @ManyToOne(() => ServiceMaster, (service) => service.tatSummaries, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "service_id" })
  service!: Relation<ServiceMaster>;

  @ManyToOne(() => TatBucket, (bucket) => bucket.summaryRows, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "tat_bucket_id" })
  tatBucket!: Relation<TatBucket>;
}
