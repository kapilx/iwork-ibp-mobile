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
import { CautionDeposit } from "./caution-deposit.entity";
import { Endorsement } from "./endorsement.entity";

@Entity("caution_deposit_transaction")
export class CautionDepositTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "caution_deposit_id", type: "int", nullable: false })
  cautionDepositId: number;

  @Column({
    name: "transaction_type",
    type: "varchar",
    length: 10,
    nullable: false,
  })
  transactionType: string;

  @Column({ name: "endorsement_id", type: "int", nullable: true })
  endorsementId?: number;

  @Column({ name: "transaction_amount", type: "numeric", precision: 21, scale: 4, nullable: false })
  transactionAmount: number;

  @Column({ name: "transaction_date", type: "timestamp", nullable: false })
  transactionDate: Date;

  @Column({
    name: "transaction_reference_id",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  transactionReferenceId?: string;

  @Column({
    name: "reference_type",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  referenceType?: string;

  @Column({ name: "bank_name", type: "varchar", length: 100, nullable: true })
  bankName?: string;

  @Column({
    name: "cheque_number",
    type: "varchar",
    length: 30,
    nullable: true,
  })
  chequeNumber?: string;

  @Column({
    name: "cd_balance_amount",
    type: "varchar",
    length: 50,
    nullable: false,
  })
  balanceAmount: string;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy: number;

  @Column({ name: "policy_id", type: "int", nullable: true })
  policyId?: number;

  @Column({ name: "cheque_date", type: "date", nullable: true })
  chequeDate?: Date;

  @Column({ name: "ifsc_code", type: "varchar", length: 20, nullable: true })
  ifscCode?: string;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks?: string;

  @Column({ name: "is_policy_extension", type: "boolean", default: false })
  isPolicyExtension: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => CautionDeposit, { onDelete: "CASCADE" })
  @JoinColumn({ name: "caution_deposit_id" })
  cautionDeposit: Relation<CautionDeposit>;

  @ManyToOne(() => Endorsement, { onDelete: "CASCADE" })
  @JoinColumn({ name: "endorsement_id" })
  endorsement?: Relation<Endorsement>;
}
