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
import { CautionDeposit } from "./caution-deposit.entity";

@Entity("caution_deposit_policy_mapping")
export class CautionDepositPolicyMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_id", type: "int", nullable: false })
  policyId: number;

  @Column({ name: "caution_deposit_id", type: "int", nullable: false })
  cautionDepositId: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy: number;

  @ManyToOne(() => Policy, { onDelete: "CASCADE" })
  @JoinColumn({ name: "policy_id" })
  policy: Relation<Policy>;

  @ManyToOne(() => CautionDeposit, { onDelete: "CASCADE" })
  @JoinColumn({ name: "caution_deposit_id" })
  cautionDeposit: Relation<CautionDeposit>;
}