import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { Policy } from "./policy.entity";

@Entity("policy_premium_installment_schedules")
export class PolicyPremiumInstallmentSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_id", type: "int", nullable: false })
  policyId: number;

  @Column({ name: "installment_1", type: "date", nullable: false })
  installment1: Date;

  @Column({ name: "installment_amount", type: "numeric", nullable: true })
  installmentAmount: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Policy, (policy) => policy.premiumInstallments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "policy_id" })
  policy: Relation<Policy>;
}
