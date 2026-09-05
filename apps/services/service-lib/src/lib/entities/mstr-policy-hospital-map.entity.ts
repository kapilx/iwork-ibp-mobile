import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
  Index,
  Unique,
} from "typeorm";
import { Exclude } from "class-transformer";
import { Policy } from "./policy.entity";
import { MstrHospital } from "./mstr-hospital.entity";

/**
 * Entity representing the mapping between policies and hospitals.
 * This entity tracks which hospitals are associated with which policies and their network status.
 */
@Entity("mstr_policy_hospital_map")
@Unique(["policyId", "hospitalId"])
@Index("idx_mstr_policy_hospital_map_policy", ["policyId"])
@Index("idx_mstr_policy_hospital_map_hospital", ["hospitalId"])
@Index("idx_mstr_policy_hospital_map_network", ["isNetworkHospital"])
export class MstrPolicyHospitalMap {
  /**
   * Unique identifier for the policy-hospital mapping.
   */
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  /**
   * Reference to the policy.
   */
  @Column({
    name: "policy_id",
    type: "int",
    nullable: false,
  })
  policyId!: number;

  /**
   * Reference to the hospital.
   */
  @Column({
    name: "hospital_id",
    type: "int",
    nullable: false,
  })
  hospitalId!: number;

  /**
   * Indicates whether the hospital is a network hospital for this policy.
   */
  @Column({
    name: "is_network_hospital",
    type: "boolean",
    nullable: false,
    default: true,
  })
  isNetworkHospital!: boolean;

  /**
   * Timestamp when the mapping was created.
   */
  @Exclude()
  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  /**
   * Identifier of the user who created the mapping.
   */
  @Exclude()
  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy!: number;

  /**
   * Timestamp when the mapping was last updated.
   */
  @Exclude()
  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;

  /**
   * Identifier of the user who last updated the mapping.
   */
  @Exclude()
  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy!: number;

  /**
   * Timestamp when the mapping was soft deleted.
   */
  @Exclude()
  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date;

  /**
   * Identifier of the user who soft deleted the mapping.
   */
  @Exclude()
  @Column({ name: "deleted_by", type: "int", nullable: true })
  deletedBy?: number;

  /**
   * Policy associated with this mapping.
   */
  @ManyToOne(() => Policy, (policy) => policy.id, { eager: true })
  @JoinColumn({ name: "policy_id" })
  policy!: Relation<Policy>;

  /**
   * Hospital associated with this mapping.
   */
  @ManyToOne(() => MstrHospital, (hospital) => hospital.policyMappings, {
    eager: true,
  })
  @JoinColumn({ name: "hospital_id" })
  hospital!: Relation<MstrHospital>;
}