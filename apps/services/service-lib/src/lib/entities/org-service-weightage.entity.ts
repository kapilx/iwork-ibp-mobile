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

@Entity({ name: "mstr_org_service_weightage" })
@Index(["orgId", "serviceId"], { unique: true })
export class OrgServiceWeightage {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "org_id", type: "int" })
  orgId!: number;

  @Column({ name: "service_id", type: "int" })
  serviceId!: number;

  @Column({
    name: "weightage_score",
    type: "numeric",
    precision: 10,
    scale: 4,
    default: 0,
  })
  weightageScore!: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt?: Date | null;

  @ManyToOne(() => ServiceMaster, (service) => service.weightages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "service_id" })
  service!: Relation<ServiceMaster>;
}
