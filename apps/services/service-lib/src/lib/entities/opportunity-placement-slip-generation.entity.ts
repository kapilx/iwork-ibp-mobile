import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { OpportunityPlacementSlipTpaMap } from "./opportunity-placement-slip-tpa-map.entity";
import { OpportunityPlacementSlipInsurerMap } from "./opportunity-placement-slip-insurer-map.entity";
import { OpportunityPlacementSlipSharingDetail } from "./opportunity-placement-slip-sharing-detail.entity";
import { OpportunityPlacementSlipCDDetail } from "./opportunity-placement-slip-cd-detail.entity";
import { OpportunityPlacementSlipCoverDetail } from "./opportunity-placement-slip-cover-detail.entity";
import { LookUp } from "./look-up.entity";
import { OpportunityPlacementSlipInstallementDetail } from "./opportunity-placement-slip-installment-detail.entity";
import { OpportunityPlacementSlipInstallments } from "./opportunity-placement-slip-installments.entity";
import { OpportunityPlacementSlipDocumentMap } from "./placement-slip-document-map.entity";

@Entity("opportunity_placement_slip_generation")
export class OpportunityPlacementSlipGeneration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "opportunity_activity_id", type: "int", nullable: false })
  opportunityActivityId!: number;

  @Column({ name: "policy_from_date", type: "date", nullable: false })
  policyFromDate: Date;

  @Column({ name: "policy_to_date", type: "date", nullable: false })
  policyToDate: Date;

  @Column({ name: "sum_insured", type: "numeric", nullable: false, precision: 21, scale: 4 })
  sumInsured: number;

  @Column({ name: "basic_premium", type: "numeric", nullable: false, precision: 21, scale: 4 })
  basicPremium: number;

  @Column({ name: "net_premium", type: "numeric", nullable: false, precision: 21, scale: 4 })
  netPremium: number;

  @Column({
    name: "is_premium_installment_based",
    type: "int",
    nullable: false,
  })
  isPremiumInstallmentBased: number;

  @Column({ name: "fee", type: "numeric", nullable: false, precision: 21, scale: 4 })
  fee: number;

  @Column({ name: "is_fee_in_installment", type: "int", nullable: false })
  isFeeInInstallment: number;

  @Column({
    name: "terrorism_brokerage_percentage",
    type: "numeric",
    nullable: true,
    precision: 7,
    scale: 4,
  })
  terrorismBrokeragePercentage: number;

  @Column({ name: "gst_percentage", type: "numeric", nullable: false, precision: 7, scale: 4 })
  gstPercentage: number;

  @Column({ name: "gst_amount", type: "numeric", nullable: false, precision: 21, scale: 4 })
  gstAmount: number;

  @Column({ name: "other", type: "numeric", nullable: true, precision: 21, scale: 4 })
  other?: number;

  @Column({
    name: "total_installment_amount",
    type: "numeric",
    nullable: true,
    precision: 21,
    scale: 4,
  })
  totalInstallmentAmount?: number;

  @Column({ name: "total_premium", type: "numeric", nullable: false, precision: 21, scale: 4 })
  totalPremium: number;

  @Column({ name: "lead_insurer_id", type: "int", nullable: false })
  leadInsurerId: number;

  @Column({
    name: "is_lead_insurer_pay_commission",
    type: "int",
    nullable: false,
  })
  isLeadInsurerPayCommission: number;

  @Column({ name: "placement_slip_date", type: "date", nullable: true })
  placementSlipDate: Date;

  @Column({ name: "max_age_of_dependents", type: "int", nullable: true })
  maxAgeOfDependents?: number;

  // @Column({ name: "brokerage_percentage", type: "numeric", nullable: false })
  // brokeragePercentage: number;
  @Column({
    name: "basic_brokerage_percentage",
    type: "numeric",
    nullable: false,
    precision: 7,
    scale: 4,
  })
  basicBrokeragePercentage: number;

  // @Column({ name: "brokerage_amount", type: "numeric", nullable: false })
  // brokerageAmount: number;

  @Column({ name: "policy_placed_type_lid", type: "int", nullable: true })
  policyPlacedTypeLid: number;

  @Column({ name: "remarks", type: "varchar", nullable: true })
  remarks?: string;

  @Column({ name: "status_lid", type: "int", nullable: false })
  statusLid: number;

  // @Column({
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
    name: "terrorism",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  terrorism?: number;

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
    name: "other_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  otherPercentage?: number;

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
    nullable: false,
  })
  grossPremium: number;

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

  @Column({
    name: "total_brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: false,
  })
  totalBrokerageAmount: number;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => LookUp, { onDelete: "SET NULL" })
  @JoinColumn({ name: "status_lid" })
  status: Relation<LookUp>;

  @OneToMany(() => OpportunityPlacementSlipTpaMap, (tpa) => tpa.placementSlip)
  tpaMaps: OpportunityPlacementSlipTpaMap[];

  @OneToMany(
    () => OpportunityPlacementSlipInsurerMap,
    (insurer) => insurer.placementSlip
  )
  insurerMaps: OpportunityPlacementSlipInsurerMap[];

  @OneToMany(
    () => OpportunityPlacementSlipInstallementDetail,
    (installment) => installment.placementSlip
  )
  installmentDates: OpportunityPlacementSlipInstallementDetail[];

  @OneToMany(
    () => OpportunityPlacementSlipInstallments,
    (installment) => installment.placementSlip
  )
  installmentDetails: OpportunityPlacementSlipInstallments[];

  @OneToMany(
    () => OpportunityPlacementSlipSharingDetail,
    (sharing) => sharing.placementSlip
  )
  sharingDetails: OpportunityPlacementSlipSharingDetail[];

  @OneToMany(() => OpportunityPlacementSlipCDDetail, (cd) => cd.placementSlip)
  cdDetails: OpportunityPlacementSlipCDDetail[];

  @OneToMany(
    () => OpportunityPlacementSlipCoverDetail,
    (cover) => cover.placementSlip
  )
  coverDetails: OpportunityPlacementSlipCoverDetail[];

  @OneToMany(
    () => OpportunityPlacementSlipDocumentMap,
    (documentMap) => documentMap.placementSlip,
    { cascade: true }
  )
  documents: Relation<OpportunityPlacementSlipDocumentMap>[];

  constructor(partial: Partial<OpportunityPlacementSlipGeneration>) {
    Object.assign(this, partial);
  }
}
