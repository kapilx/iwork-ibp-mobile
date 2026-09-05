import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Company } from "./company.entity";
import { LookUp } from "./look-up.entity";
import { Opportunity } from "./opportunity.entity";
import { Policy } from "./policy.entity";

@Entity("non_group_claim")
export class NonGroupClaim {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "policy_id", type: "int", nullable: false })
  policyId!: number;

  @Column({ name: "company_id", type: "int", nullable: false })
  companyId!: number;

  @Column({ name: "opportunity_id", type: "int", nullable: false })
  opportunityId!: number;

  @Column({
    name: "claim_number",
    type: "varchar",
    length: 50,
    unique: true,
    nullable: false,
  })
  claimNumber!: string;

  @Column({ name: "status_key", type: "varchar", length: 255, nullable: false })
  statusKey!: string;

  @Column({ name: "claim_date", type: "date", nullable: true })
  claimDate?: Date;

  @Column({ name: "settled_date", type: "date", nullable: true })
  settledDate?: Date;

  @Column({
    name: "claim_amount",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  claimAmount?: number;

  @Column({
    name: "active_activity",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  activeActivity?: string;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => Policy)
  @JoinColumn({ name: "policy_id" })
  policy?: Relation<Policy>;

  @ManyToOne(() => Company)
  @JoinColumn({ name: "company_id" })
  company?: Relation<Company>;

  @ManyToOne(() => Opportunity)
  @JoinColumn({ name: "opportunity_id" })
  opportunity?: Relation<Opportunity>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "status_key", referencedColumnName: "lookUpKey" })
  status?: Relation<LookUp>;
}
