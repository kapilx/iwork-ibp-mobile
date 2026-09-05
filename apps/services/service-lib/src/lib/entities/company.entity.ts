import { Exclude } from "class-transformer";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { SensitiveField } from "../field-encryption";
import { CompanyContactMap } from "./company-contact.entity";
import { CompanyDetail } from "./company-detail.entity";
import { CompanyDocMap } from "./company-document-map.entity";
import { StateGstDetail } from "./company-gst-detail.entity";
import { CompanyAddress } from "./company.address.entity";
import { Country } from "./country.entity";
import { GroupCompanyMap } from "./group-comapny-map.entity";
import { LookUp } from "./look-up.entity";
import { Policy } from "./policy.entity";
import { User } from "./user";
import { Opportunity } from "./opportunity.entity";
import { Currency } from "./currency.entity";
import { Auditable, SkipAudit } from "../audit-history";
import { PolicyConfiguration } from "./policy-configuration.entity";
import { CompanyPolicyConfigurationLocation } from "./company-policy-configuration-location.entity";

@Entity("company")
@Auditable()
export class Company {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({
    name: "company_name",
    type: "text",
    nullable: false,
  })
  companyName: string;

  @Column({
    name: "display_name",
    type: "text",
    nullable: true,
  })
  displayName?: string;

  @Column({ name: "company_type_lid", type: "int", nullable: false })
  companyTypeLid: number;

  @Column({ name: "currency_id", type: "int", nullable: true })
  currencyId?: number;

  @Column({
    name: "industry_segment_lid",
    type: "int",
    nullable: false,
  })
  industrySegmentLid: number;

  @Column({ name: "no_of_employees", type: "int", nullable: true })
  noOfEmployees?: number;

  @Column({ name: "website", type: "text", nullable: true })
  website?: string;

  @Column({ name: "date_of_incorporation", type: "date", nullable: true })
  dateOfIncorporation?: Date;

  @SensitiveField()
  @Column({ name: "pan_card_number", type: "text", nullable: true })
  panCardNumber?: string;

  @Column({ name: "registration_no", type: "text", nullable: true })
  registrationNo?: string;

  @Column({
    name: "annual_premium",
    type: "decimal",
    nullable: true,
    precision: 15,
    scale: 2,
  })
  annualPremium?: number;

  @Column({
    name: "total_sum_insured",
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  totalSumInsured?: number;

  @Column({ name: "so_count", type: "int", nullable: true, default: 0 })
  soCount?: number;

  @Column({
    name: "so_total_premium",
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  soTotalPremium?: number;

  @Column({ name: "ro_count", type: "int", nullable: true, default: 0 })
  roCount?: number;

  @Column({
    name: "ro_total_premium",
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  roTotalPremium?: number;

  @Column({ name: "policy_count", type: "int", nullable: true, default: 0 })
  policyCount?: number;

  @Column({
    name: "policy_total_premium",
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  policyTotalPremium?: number;

  @Column({
    name: "brokerage",
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  brokerage?: number;

  @Column({
    name: "claim_amount",
    type: "decimal",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  claimAmount?: number;

  @Column({ name: "tan_number", type: "text", nullable: true })
  tanNumber?: string;

  @Column({ name: "company_logo_file_id", type: "integer", nullable: true })
  companyLogoFileId?: number;

  @Column({ name: "policy_feature_document_id", type: "integer", nullable: true })
  policyFeatureDocumentId?: number | null;

  @Column({
    name: "initial_onboarding_mail_trigger_mode",
    type: "varchar",
    length: 20,
    nullable: false,
    default: "cron",
  })
  initialOnboardingMailTriggerMode!: string;

  @Column({
    name: "mail_service_type",
    type: "varchar",
    length: 20,
    nullable: false,
    default: "SES",
  })
  mailServiceType!: string;

  @Column({
    name: "installment_reminder_days",
    type: "int",
    array: true,
    nullable: true,
  })
  installmentReminderDays?: number[] | null;

  @Column({
    name: "policy_expiry_reminder_days",
    type: "int",
    array: true,
    nullable: true,
  })
  policyExpiryReminderDays?: number[] | null;

  @Column({
    name: "opportunity_close_to_expiry_reminder_days",
    type: "int",
    array: true,
    nullable: true,
  })
  opportunityCloseToExpiryReminderDays?: number[] | null;

  @Column({ name: "service_tax", type: "text", nullable: true })
  serviceTax?: string;

  @Exclude()
  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  createdAt?: Date;

  @Exclude()
  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  updatedAt?: Date;

  @Exclude()
  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  @SkipAudit()
  deletedAt?: Date;

  @Exclude()
  @Column({ name: "created_by", type: "int", nullable: true })
  @SkipAudit()
  createdBy?: number;

  @Exclude()
  @Column({ name: "updated_by", type: "int", nullable: true })
  @SkipAudit()
  updatedBy?: number;

  @Column({ name: "priority_lid", type: "int", nullable: true }) // Add priority_lid
  priorityLid?: number;

  @Column({ name: "status_lid", type: "int", nullable: true }) // Add statusLid
  statusLid?: number;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks?: string;

  @Column({ name: "source_type_lid", type: "int", nullable: true })
  sourceTypeLid?: number;

  @Column({ name: "source", type: "text", nullable: true })
  source?: string;

  @Column({ name: "group_company_lid", type: "int", nullable: true })
  groupCompanyLid?: number;

  @Column({ name: "lead_crm", type: "int", nullable: true })
  leadCrm?: number;

  @Column({ name: "account_manager", type: "int", nullable: true })
  accountManager?: number;

  @Column({ name: "associate_crm_id", type: "bigint", nullable: true })
  associateCrmId?: number;

  @Column({ name: "associate_crm_mgr_id", type: "bigint", nullable: true })
  associateCrmMgrId?: number;

  @Column({ name: "central_ops_team_lead_id", type: "bigint", nullable: true })
  centralOpsTeamLeadId?: number;

  @Column({ name: "central_ops_lead_id", type: "bigint", nullable: true })
  centralOpsLeadId?: number;

  @Column({ name: "country_id", type: "int", nullable: true })
  countryId?: number;

  @Column({ name: "sentiment_lid", type: "int", nullable: true })
  sentimentLid?: number;

  @Column({ name: "audit_ref_id", type: "int", nullable: false })
  auditRefId!: number;

  @Column({name:"document_ids", type: "json", nullable: true})
  documentIds?: JSON;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "company_type_lid", referencedColumnName: "id" })
  companyType!: Relation<LookUp>;

  @OneToOne(() => Currency)
  @JoinColumn({ name: "currency_id", referencedColumnName: "id" })
  currency?: Relation<Currency>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "industry_segment_lid", referencedColumnName: "id" })
  industrySegment!: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "priority_lid", referencedColumnName: "id" })
  priority?: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "status_lid", referencedColumnName: "id" })
  status?: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "group_company_lid", referencedColumnName: "id" })
  groupCompany?: Relation<LookUp>;

  @OneToMany(
    () => CompanyAddress,
    (companyAddress: CompanyAddress) => companyAddress.company,
    { cascade: true }
  )
  companyAddresses!: Relation<CompanyAddress>[];

  @OneToMany(() => StateGstDetail, (stateGstDetail) => stateGstDetail.company)
  stateGstDetails?: Relation<StateGstDetail>[];

  @OneToMany(() => Policy, (policy) => policy.company)
  policies?: Policy[];

  @OneToMany(() => CompanyDocMap, (companyDocMap) => companyDocMap.company)
  companyDocMaps?: Relation<CompanyDocMap>[];

  @OneToMany(
    () => GroupCompanyMap,
    (groupCompanyMap) => groupCompanyMap.company
    // { cascade: true }
  )
  groupCompanyMaps?: Relation<GroupCompanyMap>[];

  @OneToOne(() => CompanyDetail, (detail) => detail.company, {
    cascade: true,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn({ name: "id", referencedColumnName: "companyId" })
  details?: Relation<CompanyDetail>;

  @OneToMany(
    () => CompanyContactMap,
    (companyContact: CompanyContactMap) => companyContact.company,
    { cascade: true }
  )
  companyContactMaps!: Relation<CompanyContactMap>[];

  @OneToOne(() => User)
  @JoinColumn({ name: "lead_crm", referencedColumnName: "userId" })
  owner?: Relation<User>;

  @OneToOne(() => User)
  @JoinColumn({ name: "account_manager", referencedColumnName: "userId" })
  accountManagerInfo?: Relation<User>;

  @OneToOne(() => User)
  @JoinColumn({ name: "associate_crm_id", referencedColumnName: "userId" })
  associateCrmInfo?: Relation<User>;

  @OneToOne(() => User)
  @JoinColumn({ name: "associate_crm_mgr_id", referencedColumnName: "userId" })
  associateCrmMgrInfo?: Relation<User>;

  @OneToOne(() => User)
  @JoinColumn({ name: "central_ops_team_lead_id", referencedColumnName: "userId" })
  centralOpsTeamLeadInfo?: Relation<User>;

  @OneToOne(() => User)
  @JoinColumn({ name: "central_ops_lead_id", referencedColumnName: "userId" })
  centralOpsLeadInfo?: Relation<User>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "source_type_lid", referencedColumnName: "id" })
  sourceType?: Relation<LookUp>;

  @OneToOne(() => Country, { eager: true })
  @JoinColumn({ name: "country_id", referencedColumnName: "id" })
  country?: Relation<Country>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "sentiment_lid", referencedColumnName: "id" })
  sentiment?: Relation<LookUp>;

  @OneToMany(() => Opportunity, (opportunity) => opportunity.company, {
    cascade: false,
    onDelete: "CASCADE",
  })
  opportunities?: Relation<Opportunity>[];

  @OneToMany(
    () => PolicyConfiguration,
    (policyConfiguration) => policyConfiguration.company
  )
  policyConfigurations!: PolicyConfiguration[];

  @OneToMany(
    () => CompanyPolicyConfigurationLocation,
    (location) => location.company
  )
  policyConfigurationLocations?: Relation<CompanyPolicyConfigurationLocation>[];

  constructor(
    companyName: string,
    displayName: string,
    companyTypeLid: number,
    currencyId: number,
    industrySegmentLid: number,
    noOfEmployees: number,
    website: string,
    dateOfIncorporation: Date,
    panCardNumber: string,
    registrationNo: string,
    annualPremium: number,
    tanNumber: string,
    groupCompanyLid: number,
    priorityLid: number,
    statusLid: number,
    remarks: string,
    sentimentLid: number,
    sourceTypeLid: number,
    source: string,
    leadCrm: number,
    accountManager: number,
    countryId: number
  ) {
    this.companyName = companyName;
    this.displayName = displayName;
    this.companyTypeLid = companyTypeLid;
    this.currencyId = currencyId;
    this.industrySegmentLid = industrySegmentLid;
    this.noOfEmployees = noOfEmployees;
    this.website = website;
    this.dateOfIncorporation = dateOfIncorporation;
    this.panCardNumber = panCardNumber;
    this.registrationNo = registrationNo;
    this.annualPremium = annualPremium;
    this.tanNumber = tanNumber;
    this.priorityLid = priorityLid;
    this.remarks = remarks;
    this.statusLid = statusLid;
    this.groupCompanyLid = groupCompanyLid;
    this.sentimentLid = sentimentLid;
    this.sourceTypeLid = sourceTypeLid;
    this.source = source;
    this.leadCrm = leadCrm;
    this.accountManager = accountManager;
    this.countryId = countryId;
  }
}
