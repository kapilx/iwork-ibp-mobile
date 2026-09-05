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
import { Policy } from "./policy.entity";
import { FileUpload } from "./file-upload.entity";

/**
 * Entity for policy_installments table.
 */
@Entity("policy_installments")
export class PolicyInstallments {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_id", type: "int", nullable: false })
  policyId: number;

  @Column({ name: "opportunity_id", type: "int", nullable: true })
  opportunityId: number;

  @Column({ name: "installment_date", type: "date", nullable: true })
  installmentDate: Date;

  @Column({ name: "total_installment_amount", type: "numeric", nullable: true })
  totalInstallmentAmount: number;

  @Column({ name: "installment_net_amount", type: "numeric", nullable: true })
  installmentNetAmount: number;

  @Column({ name: "installment_no", type: "varchar", nullable: true })
  installmentNo: string;

  @Column({ name: "installment_sequence", type: "int", nullable: true })
  installmentSequence: number;

  @Column({ name: "installment_percentage", type: "numeric", nullable: true })
  installmentPercentage: number;

  @Column({ name: "insurer_endorsement_number", type: "varchar", length: 255, nullable: true })
  insurerEndorsementNumber: string;

  @Column({ name: "premium_collection_date", type: "date", nullable: true })
  premiumCollectionDate: Date;

  @Column({ name: "premium_collected_amount", type: "numeric", nullable: true })
  premiumCollectedAmount: number;

  @Column({ name: "tax_percentage", type: "numeric", nullable: true })
  taxPercentage: number;

  @Column({ name: "tax_amount", type: "numeric", nullable: true })
  taxAmount: number;

  @Column({ name: "installment_gross_amount", type: "numeric", nullable: true })
  installmentGrossAmount: number;

  @Column({ name: "collected_gross_amount", type: "numeric", nullable: true })
  collectedGrossAmount: number;

  @Column({ name: "transaction_mode_lid", type: "int", nullable: true })
  transactionModeLid: number;

  @Column({ name: "invoice_no", type: "varchar", length: 100, nullable: true })
  invoiceNo: string;

  @Column({ name: "transaction_cheque_number", type: "varchar", length: 100, nullable: true })
  transactionChequeNumber: string;

  @Column({ name: "bank_name", type: "varchar", length: 255, nullable: true })
  bankName: string;

  @Column({ name: "status_lid", type: "int", nullable: true })
  statusLid: number;

  @Column({ name: "source_file_id", type: "int", nullable: true })
  sourceFileId: number;

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

  @ManyToOne(() => Policy, (policy) => policy.installments)
  @JoinColumn({ name: "policy_id" })
  policy: Policy;

  @ManyToOne(() => FileUpload, { nullable: true })
  @JoinColumn({ name: "source_file_id" })
  sourceFile: FileUpload;
}
