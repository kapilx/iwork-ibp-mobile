import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Opportunity } from "./opportunity.entity";
import { PreferredInsurerDetails } from "./preferred-insurer-details.entity";
import { PreferredTpaDetails } from "./preferred-tpa-details.entity";
import { BrokingSlipVersionCoverDetails } from "./opportunity-broking-slip-version-cover-map-details.entity";
import { OpportunityQuoteEntry } from "./opportunity-quote-entry.entity";
@Entity({ name: "opportunity_broking_slip_version_details" })
export class BrokingSlipVersionDetails {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "sum_insured", type: "numeric", nullable: true, precision: 21, scale: 4 })
  sumInsured: number;

  @Column({ name: "brokerage_percentage", type: "numeric", nullable: true, precision: 7, scale: 4 })
  brokeragePercentage: number;

  @Column({ name: "policy_from", type: "date", nullable: true })
  policyFrom: Date;

  @Column({ name: "policy_to", type: "date", nullable: true })
  policyTo: Date;

  @Column({ name: "renewal_date", type: "date", nullable: true })
  renewalDate: Date;

  @Column({ name: "quote_receipt_timeline", type: "date", nullable: true })
  quoteReceiptTimeline: Date;

  @Column({ name: "business_activity", type: "text", nullable: true })
  businessActivity: string;

  @Column({ name: "risk_mitigation_features", type: "text", nullable: true })
  riskMitigationFeatures: string;

  @Column({ name: "clauses", type: "text", nullable: true })
  clauses: string;

  @Column({ name: "insurer_remarks", type: "text", nullable: true })
  insurerRemarks: string;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks: string;

  @Column({
    name: "basic_premium",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  basicPremium: number;

  @Column({
    name: "brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  brokerageAmount: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date;

  @Column({ name: "created_by", type: "int" })
  createdBy: number;

  @Column({ name: "updated_by", type: "int" })
  updatedBy: number;

  @Column({ name: "broking_slip_version", type: "numeric", nullable: true })
  brokingSlipVersion: number;

  @Column({ name: "broking_slip_name", type: "text", nullable: true })
  brokingSlipName: string;

  // Relationships
  @ManyToOne(() => Opportunity)
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Opportunity;

  @OneToMany(
    () => PreferredInsurerDetails,
    (insurerDetail) => insurerDetail.brokingSlip
  )
  preferredInsurerDetails?: PreferredInsurerDetails[];

  @OneToMany(() => PreferredTpaDetails, (tpaDetail) => tpaDetail.brokingSlip)
  preferredTpaDetails?: PreferredTpaDetails[];

  @OneToMany(
    () => BrokingSlipVersionCoverDetails,
    (coverMapDetail) => coverMapDetail.brokingSlipVersion,
    { cascade: true }
  )
  coverDetails?: BrokingSlipVersionCoverDetails[];

  @OneToMany(
    () => OpportunityQuoteEntry,
    (quoteEntry) => quoteEntry.brokingSlipVersion,
    { cascade: true }
  )
  quoteEntry?: OpportunityQuoteEntry[];
}
