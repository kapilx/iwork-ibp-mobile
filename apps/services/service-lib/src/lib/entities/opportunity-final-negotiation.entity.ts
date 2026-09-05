import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Insurer } from "./insurer.entity";
import { LookUp } from "./look-up.entity";
import { Meeting } from "./meeting.entity";
import { OpportunityActivityMap } from "./opportunity-activity-map.entity";
import { OpportunityFinalNegotiationQcrVariation } from "./opportunity-final-negotiation-qcr-variation.entity";
import { OpportunityFinalNegotiationServiceLevelAgreement } from "./opportunity-final-negotiation-service-level-agreement.entity";
import { OpportunityFinalNegotiationSharingDetail } from "./opportunity-final-negotiation-sharing-detail.entity";
import { OpportunityFinalNegotiationTaxMap } from "./opportunity-final-negotiation-tax-map.entity";
import { OpportunityQuoteEntry } from "./opportunity-quote-entry.entity";
import { OpportunityFinalNegotiationQuoteDocuments } from "./opportunity-final-negotiation-quote-documents.entity";
import { OpportunityFinalNegotiationQuoteCoverDetail } from "./opportunity-final-negotiation-quote-cover-detail.entity";

@Entity("opportunity_final_negotiation")
export class OpportunityFinalNegotiation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "meeting_id", type: "int" })
  meetingId: number;

  @Column({ name: "is_final_negotiation_lid", type: "integer", nullable: true })
  isFinalNegotiationTypeLid: number;

  @Column({ name: "select_meeting_id", type: "integer", nullable: true })
  selectMeeting: number | null;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "activity_id", type: "int" })
  activityId: number;

  @Column({ name: "opportunity_activity_id", type: "int" })
  opportunityActivityId: number;

  @Column({ name: "policy_placed_type_lid", type: "int" })
  policyPlacedTypeLid: number;

  @Column({ name: "lead_insurer_id", type: "int", nullable: true })
  leadInsurerId: number | null;

  @Column({
    name: "is_lead_insurer_pay_commission_lid",
    type: "int",
    nullable: true,
  })
  isLeadInsurerPayCommissionLid: number;

  @Column({ name: "finalized_version_id", type: "int" })
  finalizedVersionId: number;

  @Column({ name: "finalized_quote_id", type: "int" })
  finalizedQuoteId: number;

  @Column({ name: "quote_insurer_id", type: "int" })
  insurerId: number;

  @Column({ name: "quote_insurer_location_id", type: "int", nullable: true })
  insurerLocationId: number;

  @Column({ name: "is_quote_edited", type: "int", default: false })
  isQuoteEdited: number;

  @Column({ name: "quote_received_on", type: "date", nullable: true })
  quoteReceivedOn: Date;

  @Column({ name: "basic_premium", type: "numeric", nullable: true, precision: 21, scale: 4 })
  basicPremium: number | null;

  @Column({ name: "terrorism", type: "numeric", nullable: true, precision: 21, scale: 4 })
  terrorism: number | null;

  @Column({ name: "net_premium", type: "numeric", nullable: true, precision: 21, scale: 4 })
  netPremium: number | null;

  // @Column({ name: "brokerage_percentage", type: "numeric", nullable: true })
  // brokeragePercentage: number | null;

  @Column({
    name: "basic_brokerage_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  basicBrokeragePercentage?: number;

  @Column({ name: "insurer_remarks", type: "text", nullable: true })
  insurerRemarks: string | null;

  @Column({ name: "other_insurer_comments", type: "text", nullable: true })
  otherInsurerComments: string | null;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks: string | null;

  @Column({ name: "min_of_meeting", type: "text", nullable: true })
  mom: string | null;

  @Column({ name: "status_lid", type: "int" })
  statusLid: number;

  //  @Column({
  //   name: "basic_premium_percentage",
  //   type: "numeric",
  //   precision: 5,
  //   scale: 2,
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

  // @Column({
  //   name: "total_gross_premium_inc_tax",
  //   type: "numeric",
  //   precision: 19,
  //   scale: 2,
  //   nullable: true,
  // })
  // totalGrossPremiumIncTax?: number;

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
  //   precision: 19,
  //   scale: 2,
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
  //   precision: 19,
  //   scale: 2,
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

  @Column({ name: "meeting_date", type: "date", nullable: false })
  meetingDate: Date;

  @Column({ name: "start_time", type: "timetz", nullable: false })
  startTime: Date;

  @Column({ name: "end_time", type: "timetz", nullable: false })
  endTime: Date;

  @Column({ name: "location_type_lid", type: "int", nullable: true })
  locationTypeLid: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy: number | null;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy: number | null;

  @ManyToOne(() => Meeting)
  @JoinColumn({ name: "meeting_id" })
  meeting: Relation<Meeting>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "policy_placed_type_lid" })
  policyPlacedType: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "is_final_negotiation_lid" })
  isFinalNegotiation: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "is_quote_edited" })
  quoteEditable: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "status_lid" })
  status: Relation<LookUp>;

  @ManyToOne(() => Insurer)
  @JoinColumn({ name: "lead_insurer_id" })
  leadInsurer: Relation<Insurer>;

  @ManyToOne(() => OpportunityQuoteEntry)
  @JoinColumn({ name: "finalized_quote_id" })
  finalizedQuote: Relation<OpportunityQuoteEntry>;

  @OneToMany(
    () => OpportunityFinalNegotiationSharingDetail,
    (d) => d.finalNegotiation,
    { cascade: true }
  )
  sharingDetails: Relation<OpportunityFinalNegotiationSharingDetail>[];

  @OneToMany(
    () => OpportunityFinalNegotiationQcrVariation,
    (v) => v.finalNegotiation,
    { cascade: true }
  )
  qcrVariations: Relation<OpportunityFinalNegotiationQcrVariation>[];

  @OneToMany(
    () => OpportunityFinalNegotiationServiceLevelAgreement,
    (s) => s.finalNegotiation,
    { cascade: true }
  )
  slaDetails: Relation<OpportunityFinalNegotiationServiceLevelAgreement>[];

  @OneToMany(
    () => OpportunityFinalNegotiationTaxMap,
    (t) => t.finalNegotiation,
    { cascade: true }
  )
  taxDetails: Relation<OpportunityFinalNegotiationTaxMap>[];

  @OneToMany(
    () => OpportunityFinalNegotiationQuoteDocuments,
    (qd) => qd.finalNegotiation,
    { cascade: true }
  )
  quoteDocs: Relation<OpportunityFinalNegotiationQuoteDocuments>[];

  @OneToMany(
    () => OpportunityFinalNegotiationQuoteCoverDetail,
    (qc) => qc.finalNegotiation,
    { cascade: true }
  )
  quoteCovers: Relation<OpportunityFinalNegotiationQuoteCoverDetail>[];

  @ManyToOne(() => OpportunityActivityMap)
  @JoinColumn({ name: "opportunity_activity_id" })
  opportunityActivity: Relation<OpportunityActivityMap>;

  constructor(partial: Partial<OpportunityFinalNegotiation>) {
    Object.assign(this, partial);
  }
}
