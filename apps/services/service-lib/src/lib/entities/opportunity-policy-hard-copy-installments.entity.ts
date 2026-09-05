import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { OpportunityPolicyHardCopy } from "./opportunity-policy-hard-copy.entity";

/**
 * Entity for opportunity_policy_hard_copy_installments table.
 */
@Entity("opportunity_policy_hard_copy_installments")
export class OpportunityPolicyHardCopyInstallments {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_hard_copy_id", type: "int", nullable: false })
  policyHardCopyId: number;

  @Column({ name: "opportunity_activity_id", type: "int", nullable: false })
  opportunityActivityId: number;

  @Column({ name: "installment_date", type: "date", nullable: true })
  installmentDate: Date;

  @Column({ name: "installment_net_amount", type: "numeric", nullable: true })
  installmentNetAmount: number;

  @Column({ name: "installment_no", type: "varchar", nullable: true })
  installmentNo: string;

  @Column({ name: "installment_sequence", type: "int", nullable: true })
  installmentSequence: number;

  @Column({ name: "installment_percentage", type: "numeric", nullable: true })
  installmentPercentage: number;

  @Column({ name: "tax_percentage", type: "numeric", nullable: true })
  taxPercentage: number;

  @Column({ name: "tax_amount", type: "numeric", nullable: true })
  taxAmount: number;

  @Column({ name: "installment_gross_amount", type: "numeric", nullable: true })
  installmentGrossAmount: number;

  @Column({ name: "mode_of_payment", type: "int", nullable: true })
  modeOfPayment: number;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz", nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(
    () => OpportunityPolicyHardCopy,
    (policyHardCopy) => policyHardCopy.installmentDetails
  )
  @JoinColumn({ name: "policy_hard_copy_id" })
  policyHardCopy: OpportunityPolicyHardCopy;
}
