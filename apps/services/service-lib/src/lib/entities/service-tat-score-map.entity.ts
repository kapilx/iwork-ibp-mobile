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

@Entity({ name: "service_tat_score_map" })
@Index(["serviceId", "tatBucketId"], { unique: true })
export class ServiceTatScoreMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "service_id", type: "int" })
  serviceId!: number;

  @Column({ name: "tat_bucket_id", type: "int" })
  tatBucketId!: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt?: Date | null;

  @ManyToOne(() => ServiceMaster, (service) => service.tatScoreMappings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "service_id" })
  service!: Relation<ServiceMaster>;

  @ManyToOne(() => TatBucket, (bucket) => bucket.serviceMappings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "tat_bucket_id" })
  tatBucket!: Relation<TatBucket>;
}
