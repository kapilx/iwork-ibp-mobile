import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Relation } from "typeorm";
import { OrgServiceWeightage } from "./org-service-weightage.entity";
import { ServiceTatScoreMap } from "./service-tat-score-map.entity";
import { OrgServiceTatSummary } from "./org-service-tat-summary.entity";

@Entity({ name: "mstr_service" })
export class ServiceMaster {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "service_name", type: "varchar", length: 150, unique: true })
  serviceName!: string;

  @Column({ name: "service_display_name", type: "varchar", length: 150 })
  serviceDisplayName!: string;

  @Column({ name: "service_display_order", type: "int", default: 0 })
  serviceDisplayOrder!: number;

  @Column({ name: "status", type: "varchar", length: 20, default: "ACTIVE" })
  status!: string;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    nullable: true,
  })
  updatedAt?: Date | null;

  @OneToMany(
    () => OrgServiceWeightage,
    (weightage) => weightage.service,
    { cascade: false }
  )
  weightages?: Relation<OrgServiceWeightage[]>;

  @OneToMany(() => ServiceTatScoreMap, (map) => map.service)
  tatScoreMappings?: Relation<ServiceTatScoreMap[]>;

  @OneToMany(() => OrgServiceTatSummary, (summary) => summary.service)
  tatSummaries?: Relation<OrgServiceTatSummary[]>;
}
