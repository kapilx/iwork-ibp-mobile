import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Relation,
} from "typeorm";
import { Company } from "./company.entity";
import { Insurer } from "./insurer.entity";
import { CautionDepositPolicyMapping } from "./caution-deposit-policy-mapping.entity";
import { CautionDepositTransaction } from "./caution-deposit-transaction.entity";

@Entity("caution_deposit")
export class CautionDeposit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "cd_account_number",
    type: "varchar",
    length: 50,
    nullable: false,
  })
  cdAccountNumber: string;

  @Column({
    name: "cd_account_name",
    type: "varchar",
    length: 50,
    nullable: false,
  })
  cdAccountName: string;

  @Column({
    name: "cd_bank_name",
    type: "varchar",
    length: 100,
    nullable: false,
  })
  cdBankName: string;

  @Column({ name: "company_id", type: "int", nullable: false })
  companyId: number;

  @Column({ name: "insurer_id", type: "int", nullable: false })
  insurerId: number;

  @Column({ name : "balance_amount", type: "numeric", precision: 15, scale: 2 })
  balanceAmount: number;

  @Column({ name: "cd_safe_limit", type: "numeric", precision: 21, scale: 4, nullable: false, default: 10 })
  cdSafeLimit: number;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks?: string;

  @Column({ name: "status", type: "varchar", length: 50, nullable: false })
  status: string;

  @ManyToOne(() => Company, { onDelete: "CASCADE" })
  @JoinColumn({ name: "company_id" })
  company: Relation<Company>;

  @ManyToOne(() => Insurer, { onDelete: "CASCADE" })
  @JoinColumn({ name: "insurer_id" })
  insurer: Relation<Insurer>;

  @OneToMany(
    () => CautionDepositPolicyMapping,
    (mapping) => mapping.cautionDeposit
  )
  policyMappings: Relation<CautionDepositPolicyMapping[]>;

  @OneToMany(
    () => CautionDepositTransaction,
    (transaction) => transaction.cautionDeposit
  )
  transactions: Relation<CautionDepositTransaction[]>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy: number;

  @Column({ name: "action_lid", type: "int", nullable: true })
  actionLid?: number;
}
