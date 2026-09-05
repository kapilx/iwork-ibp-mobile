import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("policy_audit_log")
@Index(["policyId"])
@Index(["policyConfigurationId"])
@Index(["entityType"])
@Index(["entityType", "entityId"])
@Index(["action"])
export class PolicyAuditLog {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "policy_id", type: "int", nullable: true })
  policyId?: number | null;

  @Column({
    name: "policy_configuration_id",
    type: "int",
    nullable: true,
  })
  policyConfigurationId?: number | null;

  @Column({ name: "entity_type", type: "varchar", length: 100, nullable: true })
  entityType?: string | null;

  @Column({ name: "entity_id", type: "int", nullable: true })
  entityId?: number | null;

  @Column({ name: "action", type: "varchar", length: 100 })
  action!: string;

  @Column({ name: "performed_by", type: "int", nullable: true })
  performedBy?: number | null;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks?: string | null;

  @Column({ name: "metadata", type: "jsonb", nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    nullable: true,
  })
  updatedAt?: Date | null;
}
