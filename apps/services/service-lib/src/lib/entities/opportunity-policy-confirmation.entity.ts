import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Opportunity } from "./opportunity.entity";
import type { Relation } from "typeorm";
import { LookUp } from "./look-up.entity";
import { OpportunityPolicyConfirmationDocumentMap } from "./policy-confirmation-document-map.entity";
import { OpportunityPolicyConfirmationInsurerMap } from "./opportunity-policy-confirmation-insurer-details.entity";
import { OpportunityPolicyConfirmationInstallments } from "./opportunity-policy-confirmation-installments.entity";
@Entity("opportunity_policy_confirmation")
export class OpportunityPolicyConfirmation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "opportunity_id", type: "int", nullable: true })
  opportunityId: number;

  @Column({ name: "activity_id", type: "int", nullable: true })
  activityId: number;

  @Column({ name: "opportunity_activity_id", type: "int", nullable: true })
  opportunityActivityId: number;

  @Column({ name: "status_lid", type: "int", nullable: true })
  statusLid: number;

  @Column({ name: "policy_data_wrong_lid", type: "int", nullable: true })
  policyDataWrongLid: number;

  @Column({ name: "deviation_resolved_lid", type: "int", nullable: true })
  deviationResolvedLid: number;

  @Column({ name: "resolution_lid", type: "int", nullable: true })
  resolutionLid: number;

  @Column({
    name: "deviations",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  deviations: string;

  @Column({ name: "comments", type: "varchar", length: 500, nullable: true })
  comments: string;

  @Column({ name: "policy_data_rectified_lid", type: "int", nullable: true })
  policyDataRectifiedLid: number;

  @Column({ name: "remarks", type: "varchar", length: 500, nullable: true })
  remarks: string;

  // @Column({
  //   name: "brokerage_percentage",
  //   type: "decimal",
  //   precision: 5,
  //   scale: 2,
  //   nullable: true,
  // })
  // brokeragePercentage?: number;

  // @Column({
  //   name: "brokerage_amount",
  //   type: "decimal",
  //   precision: 19,
  //   scale: 2,
  //   nullable: true,
  // })
  // brokerageAmount?: number;

  @Column({
    name: "basic_premium",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  basicPremium?: number;

  @Column({
    name: "basic_brokerage_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  basicBrokeragePercentage?: number;

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
    name: "terrorism",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  terrorism?: number;

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
    name: "net_premium",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  netPremium?: number;

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

  @Column({
    name: "gross_premium",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  grossPremium?: number;

  @Column({ name: "is_premium_installment_based", type: "int", nullable: true })
  isPremiumInstallmentBased?: number | null;

  @Column({
    name: "total_installment_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  totalInstallmentAmount?: number | null;

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
    name: "sum_insured",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: false,
  })
  sumInsured: number;

  // @Column({
  //   name: "total_premium",
  //   type: "numeric",
  //   precision: 19,
  //   scale: 2,
  //   nullable: false,
  // })
  // totalPremium: number;

  @Column({ name: "lead_insurer_id", type: "int", nullable: false })
  leadInsurerId: number;

  @Column({
    name: "is_lead_insurer_pay_commission",
    type: "int",
    nullable: false,
  })
  isLeadInsurerPayCommission: number;

  @Column({ name: "policy_placed_type_lid", type: "int", nullable: true })
  policyPlacedTypeLid: number;

  @Column({
    name: "total_brokerage_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  totalBrokerageAmount: number;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.opportunityId, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "status_lid", referencedColumnName: "id" })
  status?: LookUp;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "policy_data_wrong_lid", referencedColumnName: "id" })
  policyDataWrong?: LookUp;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "deviation_resolved_lid", referencedColumnName: "id" })
  deviationResolved?: LookUp;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "resolution_lid", referencedColumnName: "id" })
  resolution?: LookUp;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "policy_data_rectified_lid", referencedColumnName: "id" })
  policyDataRectified?: LookUp;

  @OneToMany(
    () => OpportunityPolicyConfirmationDocumentMap,
    (documentMap) => documentMap.policyConfirmation,
    { cascade: true }
  )
  documents: Relation<OpportunityPolicyConfirmationDocumentMap>[];

  @OneToMany(
    () => OpportunityPolicyConfirmationInsurerMap,
    (insurer) => insurer.policyConfirmation
  )
  insurerDetails: OpportunityPolicyConfirmationInsurerMap[];

  @OneToMany(
    () => OpportunityPolicyConfirmationInstallments,
    (installment) => installment.policyConfirmation
  )
  installmentDetails: OpportunityPolicyConfirmationInstallments[];

  constructor(partial: Partial<OpportunityPolicyConfirmation>) {
    Object.assign(this, partial);
  }
}
