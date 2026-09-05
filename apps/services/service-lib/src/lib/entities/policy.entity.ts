import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Auditable, SkipAudit } from "../audit-history";
import { PolicyInstallments } from "./policy-installments.entity";
import { Company } from "./company.entity";
import { Country } from "./country.entity";
import { Employee } from "./employee.entity";
import { Endorsement } from "./endorsement.entity";
import { LookUp } from "./look-up.entity";
import { Opportunity } from "./opportunity.entity";
import { PolicyCdNumberMap } from "./policy-cd-number-map.entity";
import { PolicyConfiguration } from "./policy-configuration.entity";
import { PolicyCoverMap } from "./policy-covers-map.entity";
import { PolicyInsurerMap } from "./policy-insurer-map.entity";
import { PolicyParticipantMap } from "./policy-participant-map.entity";
import { PolicyPremiumInstallmentSchedule } from "./policy-premium-installment-schedules.entity";
import { PolicyRiskLocationMap } from "./policy-risk-location-map.entity";
import { PolicyTpaMap } from "./policy-tpa-map.entity";
import { User } from "./user";

@Entity("policy")
@Auditable()
export class Policy {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({
    name: "policy_name",
    type: "varchar",
    length: 255,
    nullable: false,
  })
  policyName: string;

  @Column({
    name: "policy_holder",
    type: "varchar",
    length: 2000,
    nullable: true,
  })
  policyHolder?: string | null;

  @Column({
    name: "nature_of_bussiness_lid",
    type: "int",
    nullable: true,
  })
  natureOfBussinessLid?: number | null;

  @Column({
    name: "policy_type_lid",
    type: "int",
    nullable: false,
  })
  policyTypeLid: number;

  @Column({ name: "opportunity_id", type: "int", nullable: false })
  opportunityId: number;

  @Column({ name: "broker_id", type: "int", nullable: true })
  brokerId?: number;

  @Column({ name: "company_id", type: "int", nullable: false })
  companyId: number;

  @Column({ name: "policy_from", type: "date", nullable: false })
  policyFrom: Date;

  @Column({ name: "date_of_business", type: "date", nullable: true })
  dateOfBusiness?: Date | null;

  @Column({ name: "business_month", type: "date", nullable: true })
  businessMonth?: Date | null;

  @Column({ name: "policy_to", type: "date", nullable: false })
  policyTo: Date;

  @Column({
    name: "provisional_policy_no",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  provisionalPolicyNo: string;

  @Column({
    name: "sum_insured",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: false,
  })
  sumInsured: number;

  @Column({
    name: "premium_at_inception",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: false,
  })
  premiumAtInception: number;

  // @Column({
  //   name: "service_tax",
  //   type: "numeric",
  //   precision: 19,
  //   scale: 2,
  //   nullable: true,
  // })
  // serviceTax: number;

  @Column({
    name: "gst_percentage",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  gstPercentage: number;

  @Column({
    name: "gst",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  gst: number;

  @Column({
    name: "insurer_policy_number",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  insurerPolicyNumber: string;

  @Column({
    name: "external_tpa_policy_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  externalTpaPolicyId: string;

  @Column({
    name: "premium_collected",
    type: "numeric",
    nullable: true,
  })
  premiumCollected: number;

  @Column({
    name: "is_enrolment_premium_based_lid",
    type: "int",
    nullable: true,
  })
  isEnrolmentPremiumBasedLid?: number | null;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "is_enrolment_premium_based_lid" })
  isEnrolmentPremiumBased?: Relation<LookUp>;

  @Column({
    name: "brokerage_collected",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  brokerageCollected?: number | null;

  // @Column({
  //   name: "brokerage_percentage",
  //   type: "numeric",
  //   precision: 5,
  //   scale: 2,
  //   nullable: true,
  // })
  // brokeragePercentage: number;

  @Column({
    name: "basic_brokerage_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  basicBrokeragePercentage: number;

  @Column({
    name: "commission_terrorism",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  commissionTerrorism: number;

  @Column({ name: "is_policy_mined_lid", type: "int", nullable: true })
  isPolicyMinedLid?: number | null;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "is_policy_mined_lid" })
  isPolicyMined?: Relation<LookUp>;

  @Column({
    name: "opportunity_type",
    type: "varchar",
    length: 2,
    default: "SO",
  })
  opportunityType: string;

  // @Column({
  //   name: "brokerage_amount",
  //   type: "numeric",
  //   precision: 12,
  //   scale: 2,
  //   default: 0,
  // })
  // brokerageAmount: number;

  @Column({
    name: "rcon_status",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  rconStatus?: string;

  @Column({
    name: "rcon_brokerage",
    type: "numeric",
    precision: 12,
    scale: 2,
    nullable: true,
    default: 0,
  })
  rconBrokerage?: number;

  @Column({
    name: "rcon_outcome",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  rconOutcome?: string;

  @Column({
    name: "pending_brokerage",
    type: "numeric",
    precision: 12,
    scale: 2,
    nullable: true,
    default: 0,
  })
  pendingBrokerage?: number;

  @Column({ name: "am_id", type: "int", nullable: true })
  amId?: number | null;

  @Column({ name: "isg_id", type: "int", nullable: true })
  isgId?: number | null;

  @Column({ name: "status_lid", type: "integer", nullable: false })
  policyStatusLid: number;

  @Column({
    name: "policy_details_status_lid",
    type: "integer",
    nullable: true,
  })
  policyDetailsStatusLid?: number | null;

  @Column({
    name: "policy_covers_status_lid",
    type: "integer",
    nullable: true,
  })
  policyCoversStatusLid?: number | null;

  @Column({
    name: "policy_cd_status_lid",
    type: "integer",
    nullable: true,
  })
  policyCdStatusLid?: number | null;

  @Column({
    name: "policy_details_approved_by",
    type: "integer",
    nullable: true,
  })
  policyDetailsApprovedBy?: number | null;

  @Column({
    name: "policy_covers_approved_by",
    type: "integer",
    nullable: true,
  })
  policyCoversApprovedBy?: number | null;

  // TPA-specific insurer name string for this policy's generic TPA sync (e.g. hospital
  // network), since a TPA's own naming for an insurer can differ from insurer.name.
  @Column({
    name: "external_insurer_name",
    type: "varchar",
    length: 200,
    nullable: true,
  })
  externalInsurerName?: string | null;

  @Column({
    name: "policy_cd_approved_by",
    type: "integer",
    nullable: true,
  })
  policyCdApprovedBy?: number | null;

  @Column({ name: "country_id", type: "int", nullable: true })
  countryId?: number;

  @Column({
    name: "insurer_endorsement_number",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  insurerEndorsementNumber?: string;

  @Column({ name: "income_month", type: "date", nullable: true })
  incomeMonth?: Date | null;

  @Column({ name: "date_of_income", type: "date", nullable: true })
  dateOfIncome?: Date;

  @Column({
    name: "date_of_income_from_iwork",
    type: "date",
    nullable: true,
  })
  dateOfIncomeFromIwork?: Date | null;

  // @Column({
  //   name: "service_tax_amount",
  //   type: "numeric",
  //   precision: 19,
  //   scale: 2,
  //   nullable: true,
  // })
  // serviceTaxAmount?: number;

  @Column({
    name: "gst_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  gstAmount?: number;

  // @Column({
  //   name: "net_premium_amount",
  //   type: "numeric",
  //   precision: 19,
  //   scale: 2,
  //   nullable: true,
  // })
  // netPremiumAmount?: number;

  @Column({
    name: "net_premium",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  netPremium?: number;

  @Column({
    name: "terrorism_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  terrorismAmount?: number;

  @Column({
    name: "other_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  otherAmount?: number;

  // @Column({
  //   name: "gross_premium_amount",
  //   type: "numeric",
  //   precision: 19,
  //   scale: 2,
  //   nullable: true,
  // })
  // grossPremiumAmount?: number;

  @Column({
    name: "gross_premium",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  grossPremium?: number;

  @Column({
    name: "brokerage_amount_asper_iwork",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  brokerageAmountAsperIwork?: number;

  @Column({
    name: "brokerage_amount_asper_isg",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  brokerageAmountAsperIsg?: number;

  @Column({
    name: "fee_amount",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  feeAmount?: number;

  @Column({
    name: "od_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  odPercentage?: number;

  @Column({
    name: "tp_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  tpPercentage?: number;

  @Column({
    name: "net_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  netPercentage?: number;

  @Column({
    name: "share_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  sharePercentage?: number;

  @Column({
    name: "terrorism_brokerage_percentage",
    type: "numeric",
    precision: 7,
    scale: 4,
    nullable: true,
  })
  terrorismBrokeragePercentage?: number;

  @Column({
    name: "income_type_lid",
    type: "integer",
    nullable: true,
  })
  incomeTypeLid?: number;

  @Column({
    name: "deal_confirmed_lid",
    type: "integer",
    nullable: true,
  })
  dealConfirmedLid?: number;

  @Column({
    name: "policy_group_type_lid",
    type: "integer",
    nullable: true,
  })
  policyGroupTypeLid?: number;

  @Column({
    name: "owner_id",
    type: "integer",
    nullable: true,
  })
  ownerId?: number;

  @Column({ name: "iwork_unique_id", type: "varchar", length: 255, nullable: true })
  iworkUniqueId?: string;

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
    name: "basic_premium",
    type: "numeric",
    precision: 21,
    scale: 4,
    nullable: true,
  })
  basicPremium?: number;

  // @Column({
  //   name: "basic_premium_percentage",
  //   type: "numeric",
  //   precision: 5,
  //   scale: 2,
  //   nullable: true,
  // })
  // basicPremiumPercentage?: number;

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
    default: 0,
  })
  totalBrokerageAmount: number;

  @Column({ name: "service_level_lid", type: "int", nullable: true })
  serviceLevelLid?: number;

  @Column({
    name: "unique_iworkedge_reference",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  uniqueIworkedgeReference?: string;

  @Column({
    name: "is_installment_policy",
    type: "int",
  })
  isInstallmentPolicy: number;

  @Column({
    name: "unique_external_reference",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  uniqueExternalReference?: string;

  @Column({ name: "enabled_for_performance_lid", type: "int", nullable: true })
  enabledForPerformanceLid?: number;


  @Column({ name: "organisation_id", type: "int" })
  organisationId?: number;

  @Column({ name: "sbu_id", type: "int" })
  sbuId?: number;

  @Column({ name: "vertical_id", type: "int" })
  verticalId?: number;

  @Column({ name: "department_id", type: "int" })
  departmentId?: number;

  @Column({ name: "branch_id", type: "int" })
  branchId?: number;

  @Column({
    name: "unique_ref_key",
    type: "varchar",
    length: 35,
    nullable: true,
  })
  uniqueRefKey?: string;

  @Column({
    name: "financial_year",
    type: "varchar",
    length: 15,
    nullable: true,
  })
  financialYear?: string;

  @Column({
    name: "add_only_dependents",
    type: "boolean",
    default: false,
    nullable: false,
  })
  addOnlyDependents: boolean;

  // 'APPLICATION' | 'SQL_LOAD'. Surfaced in the Biz Done report as A / U so a
  // bulk-loaded row is visible to whoever reads the numbers.
  @Column({ name: "ingested_mode", type: "varchar", nullable: true })
  @SkipAudit()
  ingestedMode?: string | null;

  @Column({ name: "created_by", type: "int", nullable: false })
  @SkipAudit()
  createdBy: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  @SkipAudit()
  createdAt: Date;

  @Column({ name: "updated_by", type: "int", nullable: true })
  @SkipAudit()
  updatedBy: number;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  @SkipAudit()
  updatedAt: Date;

  // Relationships
  // Relation for opportunityId
  @OneToOne(() => Opportunity)
  @JoinColumn({
    name: "opportunity_id",
    referencedColumnName: "opportunityId",
  })
  opportunity!: Relation<Opportunity>;

  // Relation for companyId
  @OneToOne(() => Company)
  @JoinColumn({ name: "company_id", referencedColumnName: "id" })
  company!: Relation<Company>;

  @OneToOne(() => Employee)
  @JoinColumn({ name: "created_by", referencedColumnName: "userId" })
  createdUser!: Relation<Employee>;

  @OneToMany(() => PolicyTpaMap, (policyTpaMap) => policyTpaMap.policy)
  tpaMappings: Relation<PolicyTpaMap[]>;

  @OneToMany(() => Endorsement, (endorsement) => endorsement.policy)
  endorsements: Relation<Endorsement[]>;

  @OneToMany(
    () => PolicyInsurerMap,
    (policyInsurerMap) => policyInsurerMap.policy,
  )
  insurerMappings: Relation<PolicyInsurerMap[]>;

  @OneToMany(() => PolicyCoverMap, (policyCoverMap) => policyCoverMap.policy)
  coverMappings: Relation<PolicyCoverMap[]>;

  @OneToMany(
    () => PolicyCdNumberMap,
    (policyCdNumberMap) => policyCdNumberMap.policy,
  )
  cdMappings: Relation<PolicyCdNumberMap[]>;

  @OneToMany(
    () => PolicyPremiumInstallmentSchedule,
    (installment) => installment.policy,
  )
  premiumInstallments: Relation<PolicyPremiumInstallmentSchedule[]>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "is_installment_policy" })
  isInstallmentPolicy: Relation<LookUp>;

  @OneToMany(() => PolicyInstallments, (installment) => installment.policy)
  installments: Relation<PolicyInstallments[]>;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({ name: "owner_id", referencedColumnName: "userId" })
  owner?: Relation<User>;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({ name: "am_id", referencedColumnName: "userId" })
  am?: Relation<User>;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({ name: "isg_id", referencedColumnName: "userId" })
  isg?: Relation<User>;

  // Lookup relationships
  @OneToOne(() => LookUp)
  @JoinColumn({ name: "policy_type_lid", referencedColumnName: "id" })
  policyType: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "status_lid", referencedColumnName: "id" })
  policyStatus: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "policy_details_status_lid", referencedColumnName: "id" })
  policyDetailsStatus?: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "policy_covers_status_lid", referencedColumnName: "id" })
  policyCoversStatus?: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "policy_cd_status_lid", referencedColumnName: "id" })
  policyCdStatus?: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "nature_of_bussiness_lid", referencedColumnName: "id" })
  natureOfBussiness?: Relation<LookUp>;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({
    name: "policy_details_approved_by",
    referencedColumnName: "userId",
  })
  policyDetailsApprovedByUser?: Relation<User>;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({
    name: "policy_covers_approved_by",
    referencedColumnName: "userId",
  })
  policyCoversApprovedByUser?: Relation<User>;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({ name: "policy_cd_approved_by", referencedColumnName: "userId" })
  policyCdApprovedByUser?: Relation<User>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "income_type_lid", referencedColumnName: "id" })
  incomeType: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "deal_confirmed_lid", referencedColumnName: "id" })
  dealConfirmed: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "policy_group_type_lid", referencedColumnName: "id" })
  policyGroupType: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "service_level_lid" })
  serviceLevel?: Relation<LookUp>;

  @OneToOne(() => Country, { eager: true })
  @JoinColumn({ name: "country_id", referencedColumnName: "id" })
  country?: Relation<Country>;

  @OneToMany(
    () => PolicyParticipantMap,
    (policyParticipantMap) => policyParticipantMap.policy,
  )
  policyParticipants?: Relation<PolicyParticipantMap[]>;

  @OneToMany(
    () => PolicyConfiguration,
    (policyConfiguration) => policyConfiguration.policy,
  )
  policyConfigurations!: Relation<PolicyConfiguration[]>;

  @OneToMany(
    () => PolicyRiskLocationMap,
    (policyRiskLocation) => policyRiskLocation.policy,
    { cascade: true },
  )
  policyRiskLocations?: Relation<PolicyRiskLocationMap[]>;
}
