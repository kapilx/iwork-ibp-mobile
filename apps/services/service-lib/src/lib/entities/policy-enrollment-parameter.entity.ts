import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Policy } from "./policy.entity";

@Entity("policy_enrollment_parameters")
@Index(["policyId", "name"], { unique: true })
export class PolicyEnrollmentParameter {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "policy_id", type: "int" })
  policyId!: number;

  @Column({ name: "name", type: "varchar", length: 100 })
  name!: string;

  @Column({ name: "type", type: "varchar", length: 20 })
  type!: string;

  @Column({ name: "display_name", type: "varchar", length: 100 })
  displayName!: string;

  @Column({ name: "created_by", type: "int", default: 0 })
  createdBy!: number;

  @Column({ name: "updated_by", type: "int", default: 0 })
  updatedBy!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => Policy, { onDelete: "CASCADE" })
  @JoinColumn({ name: "policy_id" })
  policy!: Policy;
}
