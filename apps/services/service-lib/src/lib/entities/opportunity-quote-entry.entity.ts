import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Relation,
} from "typeorm";
import { Opportunity } from "./opportunity.entity";
import { LookUp } from "./look-up.entity"; // Assuming you have this
import { Insurer } from "./insurer.entity"; // Assuming you have this
import { BrokingSlipVersionDetails } from "./opportunity-broking-slip-version.entity";
import { OpportunityQuoteEntryDocumentMap } from "./opportunity-quote-entry-document-map.entity";
import { OpportunityQuoteCoverDetail } from "./opportunity-quote-entry-cover-detail.entity";
import { OpportunityQuoteTaxMap } from "./opportunity-quote-entry-tax-map.entity";

@Entity("opportunity_quote_entry")
export class OpportunityQuoteEntry {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "opportunity_id", type: "int", nullable: false })
  opportunityId!: number;

  @Column({ name: "opportunity_activity_id", type: "int", nullable: false })
  opportunityActivityId!: number;

  @Column({ name: "broking_slip_id", type: "int", nullable: true })
  brokingSlipId?: number;

  @Column({ name: "insurer_id", type: "int", nullable: true })
  insurerId?: number;

  @Column({ name: "insurer_location_id", type: "int", nullable: true })
  insurerLocationId?: number;

  @Column({ name: "quote_received_on", type: "date", nullable: true })
  quoteReceivedOn?: Date;

  @Column({ name: "basic_premium", type: "numeric", nullable: true, precision: 21, scale: 4 })
  basicPremium?: number;

  @Column({ name: "terrorism", type: "numeric", nullable: true, precision: 21, scale: 4 })
  terrorism?: number;

  @Column({ name: "net_premium", type: "numeric", nullable: true, precision: 21, scale: 4 })
  netPremium?: number;

  // @Column({ name: "brokerage_percent", type: "numeric", nullable: true })
  // brokeragePercent?: number;

  @Column({
    name: "basic_brokerage_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  basicBrokeragePercentage?: number;

  @Column({ name: "insurer_remarks", type: "text", nullable: true })
  insurerRemarks?: string;

  @Column({ name: "attachment_url", type: "text", nullable: true })
  attachmentUrl?: string;

  @Column({ name: "status_id", type: "int", nullable: true })
  statusId?: number;

  // @Column({
  //   name: "basic_premium_percentage",
  //   type: "numeric",
  //   precision: 7,
  //   scale: 4,
  //   nullable: true,
  // })
  // basicPremiumPercentage?: number;

  @Column({
    name: "srcc_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  srccPercentage?: number;

  @Column({
    name: "srcc_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  srccAmount?: number;

  @Column({
    name: "srcc_brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  srccBrokerageAmount?: number;

  @Column({
    name: "terrorism_brokerage_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  terrorismBrokeragePercentage?: number;

  @Column({
    name: "gst_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  gstPercentage?: number;

  @Column({
    name: "gst_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  gstAmount?: number;

  @Column({
    name: "total_gross_premium_inc_tax",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  totalGrossPremiumIncTax?: number;

  @Column({
    name: "fee_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  feePercentage?: number;

  @Column({
    name: "fee",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  fee?: number;

  @Column({
    name: "other_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  otherPercentage?: number;

  @Column({
    name: "other",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  other?: number;

  @Column({
    name: "admin_charges_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  adminChargesPercentage?: number;

  @Column({
    name: "admin_charges",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  adminCharges?: number;

  @Column({
    name: "cess_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  cessPercentage?: number;

  @Column({
    name: "cess_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  cessAmount?: number;

  // @Column({
  //   name: "total_gross_premium_inc_tax_charges",
  //   type: "numeric",
  //   precision: 21,
  //   scale: 4,
  //   nullable: true,
  // })
  // totalGrossPremiumIncTaxCharges?: number;

  @Column({
    name: "gross_premium",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  grossPremium?: number;

  @Column({
    name: "tc_brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: false,
  })
  tcBrokerageAmount: number;

  @Column({
    name: "basic_brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: false,
  })
  basicBrokerageAmount: number;

  // @Column({
  //   name: "brokerage_amount",
  //   type: "numeric",
  //   precision: 21,
  //   scale: 4,
  //   nullable: true,
  // })
  // brokerageAmount?: number;

  @Column({
    name: "total_brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  totalBrokerageAmount?: number;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz" })
  deletedAt?: Date;

  @OneToMany(
    () => OpportunityQuoteEntryDocumentMap,
    (docMap) => docMap.quoteEntry
  )
  documentMappings!: Relation<OpportunityQuoteEntryDocumentMap>[];

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.opportunityId, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "opportunity_id" })
  opportunity!: Relation<Opportunity>;

  @ManyToOne(() => LookUp, { nullable: true })
  @JoinColumn({ name: "status_id" })
  status?: Relation<LookUp>;

  @ManyToOne(() => Insurer, { nullable: true })
  @JoinColumn({ name: "insurer_id" })
  insurer?: Relation<Insurer>;

  @ManyToOne(
    () => BrokingSlipVersionDetails,
    (brokingSlipVersion) => brokingSlipVersion.quoteEntry,
    { nullable: true }
  )
  @JoinColumn({ name: "broking_slip_id" })
  brokingSlipVersion?: BrokingSlipVersionDetails;
  // New OneToMany relationship for OpportunityQuoteCoverDetail
  @OneToMany(
    () => OpportunityQuoteCoverDetail,
    (coverDetail) => coverDetail.quote,
    { cascade: true }
  )
  coverDetails!: Relation<OpportunityQuoteCoverDetail>[];

  @OneToMany(() => OpportunityQuoteTaxMap, (tax) => tax.quoteEntry, {
    onDelete: "CASCADE",
  })
  taxMappings!: Relation<OpportunityQuoteTaxMap>[];

  constructor(partial: Partial<OpportunityQuoteEntry>) {
    Object.assign(this, partial);
  }
}
