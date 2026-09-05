import type { Relation } from "typeorm";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Company } from "./company.entity";

@Entity("company_detail")
export class CompanyDetail {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "company_id", type: "int" })
  companyId!: number;

  @Column({ name: "company_history", type: "text", nullable: true })
  companyHistory?: string;

  @Column({ name: "major_products", type: "text", nullable: true })
  majorProducts?: string;

  @Column({ name: "key_customers", type: "text", nullable: true })
  keyCustomers?: string;

  @Column({ name: "documents_uploaded", type: "text", nullable: true })
  documentsUploaded?: string;

  @Column({ name: "business_processes", type: "text", nullable: true })
  businessProcesses?: string;

  @Column({ name: "account_strategy", type: "text", nullable: true })
  accountStrategy?: string;

  @Column({ name: "targeting_reason", type: "text", nullable: true })
  targetingReason?: string;

  @Column({ name: "competitor", type: "text", nullable: true })
  competitor?: string;

  @Column({ name: "weakness", type: "text", nullable: true })
  weakness?: string;

  @Column({ name: "action_plan", type: "text", nullable: true })
  actionPlan?: string;

  @Column({ name: "potential_opportunity", type: "text", nullable: true }) // Add potential_opportunity
  potentialOpportunity?: string;

  @Column({ name: "industry_intelligence", type: "text", nullable: true }) // Add industry_intelligence
  industryIntelligence?: string;

  @Column({ name: "service_plan", type: "text", nullable: true }) // Add service_plan
  servicePlan?: string;

  @Column({ name: "acquisition_history", type: "text", nullable: true }) // Add acquisition_history
  acquisitionHistory?: string;

  @Column({ name: "biz_profile", type: "text", nullable: true }) // Add biz_profile
  bizProfile?: string;

  @Column({ name: "service_performance", type: "text", nullable: true }) // Add service_performance
  servicePerformance?: string;

  @Column({ name: "sales_pitch", type: "text", nullable: true })
  salesPitch?: string;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt?: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt?: Date;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => Company)
  @JoinColumn({ name: "company_id" })
  company!: Relation<Company>;

  @OneToOne(() => CompanyDetail, (detail) => detail.company, { cascade: true })
  @JoinColumn({ name: "id", referencedColumnName: "companyId" })
  details!: Relation<CompanyDetail>;

  constructor(
    companyId: number,
    companyHistory?: string,
    majorProducts?: string,
    keyCustomers?: string,
    documentsUploaded?: string,
    businessProcesses?: string,
    accountStrategy?: string,
    targetingReason?: string,
    competitor?: string,
    weakness?: string,
    actionPlan?: string,
    potentialOpportunity?: string,
    industryIntelligence?: string,
    servicePlan?: string,
    acquisitionHistory?: string,
    bizProfile?: string,
    servicePerformance?: string,
    salesPitch?: string,
    createdBy?: number,
    updatedBy?: number
  ) {
    this.companyId = companyId;
    this.companyHistory = companyHistory;
    this.majorProducts = majorProducts;
    this.keyCustomers = keyCustomers;
    this.documentsUploaded = documentsUploaded;
    this.businessProcesses = businessProcesses;
    this.accountStrategy = accountStrategy;
    this.targetingReason = targetingReason;
    this.competitor = competitor;
    this.weakness = weakness;
    this.actionPlan = actionPlan;
    this.potentialOpportunity = potentialOpportunity;
    this.industryIntelligence = industryIntelligence;
    this.servicePlan = servicePlan;
    this.acquisitionHistory = acquisitionHistory;
    this.bizProfile = bizProfile;
    this.servicePerformance = servicePerformance;
    this.salesPitch = salesPitch;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
