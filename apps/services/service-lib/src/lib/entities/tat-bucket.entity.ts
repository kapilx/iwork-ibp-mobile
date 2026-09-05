import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";
import { ServiceTatScoreMap } from "./service-tat-score-map.entity";
import { OrgServiceTatSummary } from "./org-service-tat-summary.entity";

@Entity({ name: "mstr_tat_bucket" })
@Index(["orgId", "tatDisplayOrder"], { unique: false })
export class TatBucket {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "org_id", type: "int" })
  orgId!: number;

  @Column({ name: "tat_label", type: "varchar", length: 50 })
  tatLabel!: string;

  @Column({ name: "start_day", type: "int" })
  startDay!: number;

  @Column({ name: "end_day", type: "int" })
  endDay!: number;

  @Column({ name: "tat_display_order", type: "int", default: 0 })
  tatDisplayOrder!: number;

  @Column({ name: "status", type: "varchar", length: 20, default: "ACTIVE" })
  status!: string;

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

  @OneToMany(() => ServiceTatScoreMap, (map) => map.tatBucket)
  serviceMappings?: Relation<ServiceTatScoreMap[]>;

  @OneToMany(() => OrgServiceTatSummary, (summary) => summary.tatBucket)
  summaryRows?: Relation<OrgServiceTatSummary[]>;
}
