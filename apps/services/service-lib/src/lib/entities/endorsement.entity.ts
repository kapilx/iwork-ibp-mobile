import type { Relation } from "typeorm";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Auditable, SkipAudit } from "../audit-history";
import { Company } from "./company.entity";
import { FileUpload } from "./file-upload.entity";
import { LookUp } from "./look-up.entity";
import { Policy } from "./policy.entity";

@Entity("endorsement")
@Auditable()
export class Endorsement {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "policy_id", type: "int" })
  policyId!: number;

  @Column({ name: "company_id", type: "int" })
  companyId!: number;

  @Column({
    name: "endorsement_type",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  endorsementType?: string | null;

  @Column({ name: "endorsement_date", type: "timestamp", nullable: true })
  endorsementDate?: Date | null;

  @Column({
    name: "insurer_endorsement_number",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  insurerEndorsementNumber?: string | null;

  @Column({
    name: "provisional_endorsement_number",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  provisionalEndorsementNumber?: string | null;

  @Column({
    name: "insurer_acknowledgement_number",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  insurerAcknowledgementNumber?: string | null;

  @Column({
    name: "insurer_endorsement_date",
    type: "timestamptz",
    nullable: true,
  })
  insurerEndorsementDate?: Date | null;

  @Column({
    name: "insurer_communication_date",
    type: "timestamptz",
    nullable: true,
  })
  insurerCommunicationDate?: Date | null;

  @Column({
    name: "endorsement_entry_date",
    type: "timestamptz",
    nullable: true,
  })
  endorsementEntryDate?: Date | null;

  @Column({
    name: "enrollment_start_date",
    type: "timestamptz",
    nullable: true,
  })
  enrollmentStartDate?: Date | null;

  @Column({
    name: "enrollment_end_date",
    type: "timestamptz",
    nullable: true,
  })
  enrollmentEndDate?: Date | null;

  @Column({ name: "endorsment_file_id", type: "int", nullable: true })
  endorsmentFileId?: number | null;

  @Column({ name: "endorsment_count", type: "int", default: 0 })
  endorsmentCount!: number;

  @Column({ name: "endorsment_dependent_count", type: "int", default: 0 })
  endorsmentDependentCount!: number;

  @Column({ name: "ack_file_id", type: "int", nullable: true })
  ackFileId?: number | null;

  @Column({ name: "endorsement_ack_count", type: "int", default: 0 })
  endorsementAckCount!: number;

  @Column({
    name: "employee_endorsement_addition_count",
    type: "int",
    default: 0,
  })
  employeeEndorsementAdditionCount!: number;

  @Column({
    name: "employee_endorsement_deletion_count",
    type: "int",
    default: 0,
  })
  employeeEndorsementDeletionCount!: number;

  @Column({ name: "tpa_document_id", type: "int", nullable: true })
  tpaDocumentId?: number | null;

  @Column({ name: "tpa_error_file_id", type: "int", nullable: true })
  tpaErrorFileId?: number | null;

  @Column({ name: "tpa_processed_count", type: "int", default: 0 })
  tpaProcessedCount!: number;

  @Column({ name: "tpa_error_count", type: "int", default: 0 })
  tpaErrorCount!: number;

  @Column({
    name: "endorsement_effective_date",
    type: "timestamptz",
    nullable: true,
  })
  endorsementEffectiveDate?: Date | null;

  @Column({ name: "date_of_business", type: "date", nullable: true })
  dateOfBusiness?: Date | null;

  @Column({ name: "business_month", type: "date", nullable: true })
  businessMonth?: Date | null;

  @Column({
    name: "client_confirmation_date",
    type: "timestamptz",
    nullable: true,
  })
  clientConfirmationDate?: Date | null;

  @Column({
    name: "tpa_acknowledged_date",
    type: "timestamptz",
    nullable: true,
  })
  tpaAcknowledgedDate?: Date | null;

  @Column({
    name: "sum_insured",
    type: "numeric",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  sumInsured?: number | null;

  @Column({
    name: "premium_at_inception",
    type: "numeric",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  premiumAtInception?: number | null;

  // @Column({
  //   name: "gross_premium_amount",
  //   type: "numeric",
  //   precision: 18,
  //   scale: 2,
  //   nullable: true,
  // })
  // grossPremiumAmount?: number | null;

  @Column({
    name: "gross_premium",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  grossPremium?: number | null;

  // @Column({
  //   name: "net_premium_amount",
  //   type: "numeric",
  //   precision: 18,
  //   scale: 2,
  //   nullable: true,
  // })
  // netPremiumAmount?: number | null;

  @Column({
    name: "net_premium",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  netPremium?: number | null;

  @Column({
    name: "premium_collected",
    type: "numeric",
    nullable: true,
  })
  premiumCollected: number;

  // @Column({
  //   name: "service_tax_amount",
  //   type: "numeric",
  //   precision: 18,
  //   scale: 2,
  //   nullable: true,
  // })
  // serviceTaxAmount?: number | null;

  @Column({
    name: "gst_amount",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  gstAmount?: number | null;

  @Column({
    name: "terrorism_amount",
    type: "numeric",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  terrorismAmount?: number | null;

  @Column({
    name: "income_month",
    type: "timestamptz",
    nullable: true,
  })
  incomeMonth?: Date | null;

  @Column({ name: "date_of_income", type: "timestamptz", nullable: true })
  dateOfIncome?: Date | null;

  @Column({ name: "income_type_lid", type: "int", nullable: true })
  incomeTypeLid?: number | null;

  // @Column({
  //   name: "brokerage_amount",
  //   type: "numeric",
  //   precision: 18,
  //   scale: 2,
  //   nullable: true,
  // })
  // brokerageAmount?: number | null;

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
    precision: 5,
    scale: 2,
    nullable: true,
  })
  basicBrokeragePercentage: number | null;

  @Column({
    name: "brokerage_amount_asper_iwork",
    type: "numeric",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  brokerageAmountAsperIwork?: number | null;

  @Column({
    name: "brokerage_amount_asper_isg",
    type: "numeric",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  brokerageAmountAsperIsg?: number | null;

  @Column({
    name: "fee_amount",
    type: "numeric",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  feeAmount?: number | null;

  @Column({
    name: "commission_terrorism_amount",
    type: "numeric",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  commissionTerrorismAmount?: number | null;

  @Column({
    name: "other_amount",
    type: "numeric",
    precision: 18,
    scale: 2,
    nullable: true,
  })
  otherAmount?: number | null;

  @Column({
    name: "od_percentage",
    type: "numeric",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  odPercentage?: number | null;

  @Column({
    name: "tp_percentage",
    type: "numeric",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  tpPercentage?: number | null;

  @Column({
    name: "net_percentage",
    type: "numeric",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  netPercentage?: number | null;

  @Column({
    name: "share_percentage",
    type: "numeric",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  sharePercentage?: number | null;

  @Column({
    name: "terrorism_brokerage_percentage",
    type: "numeric",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  terrorismBrokeragePercentage?: number | null;

  @Column({
    name: "insurer_endorsed_dependent_count",
    type: "int",
    nullable: true,
  })
  insurerEndorsedDependentCount?: number | null;

  @Column({
    name: "insurer_endorsed_employee_count",
    type: "int",
    nullable: true,
  })
  insurerEndorsedEmployeeCount?: number | null;

  @Column({ name: "deal_confirmed_lid", type: "int", nullable: true })
  dealConfirmedLid?: number | null;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks?: string | null;

  @Column({ name: "client_confirmation_message", type: "text", nullable: true })
  clientConfirmationMessage?: string | null;

  @Column({ name: "tpa_upload_remarks", type: "text", nullable: true })
  tpaUploadRemarks?: string | null;

  @Column({
    name: "insurer_communication_details",
    type: "text",
    nullable: true,
  })
  insurerCommunicationDetails?: string | null;

  @Column({
    name: "financial_non_financially",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  financialNonFinancially?: string | null;

  @Column({
    name: "os_ticket_number",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  osTicketNumber?: string | null;

  @Column({
    name: "endorsement_status",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  endorsementStatus?: string | null;
  @Column({
    name: "brokerage_collected",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  brokerageCollected?: number | null;

  @Column({
    name: "basic_premium",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  basicPremium?: number;

  @Column({
    name: "srcc_amount",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  srccAmount?: number;

  @Column({
    name: "admin_charges",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  adminCharges?: number;

  @Column({
    name: "cess_amount",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  cessAmount?: number;

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
    precision: 19,
    scale: 2,
    nullable: true,
  })
  gstPercentage: number;

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
    precision: 5,
    scale: 2,
    nullable: true,
  })
  srccPercentage?: number;

  @Column({
    name: "basic_brokerage_amount",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  basicBrokerageAmount: number | null;

  @Column({
    name: "srcc_brokerage_amount",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  srccBrokerageAmount?: number;

  @Column({
    name: "tc_brokerage_amount",
    type: "numeric",
    precision: 19,
    scale: 2,
    nullable: true,
  })
  tcBrokerageAmount: number;

  @Column({ name: "current_endorsement_step", type: "int", nullable: true })
  currentEndorsementStep?: number | null;

  @Column({
    name: "unique_iworkedge_reference",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  uniqueIworkedgeReference?: string;

  @Column({
    name: "unique_external_reference",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  uniqueExternalReference?: string;

  @Column({ name: "enabled_for_performance_lid", type: "int", nullable: true })
  enabledForPerformanceLid?: number;

  // 'APPLICATION' | 'SQL_LOAD'. Surfaced in the Biz Done report as A / U so a
  // bulk-loaded row is visible to whoever reads the numbers.
  @Column({ name: "ingested_mode", type: "varchar", nullable: true })
  @SkipAudit()
  ingestedMode?: string | null;

  @Column({ name: "created_by", type: "int", nullable: true })
  @SkipAudit()
  createdBy?: number | null;

  @Column({ name: "updated_by", type: "int", nullable: true })
  @SkipAudit()
  updatedBy?: number | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  @SkipAudit()
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  @SkipAudit()
  updatedAt!: Date;

  @Column({ name: "is_inception", type: "boolean", default: false })
  isInception?: boolean;

  @Column({ name: "to_be_mapped_post_upload_lid", type: "int", default: 9401 })
  toBeMappedPostUploadLid?: number;

  @Column({
    name: "client_mapping_file_id",
    type: "int",
    nullable: true,
    default: null,
  })
  clientMappingFileId?: number | null;

  @Column({
    name: "client_mapping_file_id_created_at",
    type: "timestamptz",
    nullable: true,
    default: null,
  })
  clientMappingFileIdCreatedAt?: Date | null;

  @Column({
    name: "premium_calculation_file_id",
    type: "int",
    nullable: true,
    default: null,
  })
  premiumCalculationFileId?: number | null;

  @Column({
    name: "premium_calculation_file_id_created_at",
    type: "timestamptz",
    nullable: true,
    default: null,
  })
  premiumCalculationFileIdCreatedAt?: Date | null;

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
    name: "iwork_unique_id",
    type: "varchar",
    length: 15,
    nullable: true,
  })
  iworkUniqueId?: string;

  @ManyToOne(() => Policy, { onDelete: "CASCADE" })
  @JoinColumn({ name: "policy_id" })
  policy?: Relation<Policy>;

  @ManyToOne(() => Company, { onDelete: "CASCADE" })
  @JoinColumn({ name: "company_id" })
  company?: Relation<Company>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "income_type_lid", referencedColumnName: "id" })
  incomeType?: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "deal_confirmed_lid", referencedColumnName: "id" })
  dealConfirmed?: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "to_be_mapped_post_upload_lid", referencedColumnName: "id" })
  toBeMappedPostUpload?: Relation<LookUp>;

  @ManyToOne(() => FileUpload)
  @JoinColumn({ name: "endorsment_file_id" })
  endorsmentFile?: Relation<FileUpload>;

  @ManyToOne(() => FileUpload)
  @JoinColumn({ name: "ack_file_id" })
  ackFile?: Relation<FileUpload>;
}
