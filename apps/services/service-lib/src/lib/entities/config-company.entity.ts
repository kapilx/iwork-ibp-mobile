import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { DatabaseConnect } from "./database-connect.entity";
import { LookUp } from "./look-up.entity";
import { CompanyPortalConfigurationDetail } from "./company-portal-configuration-detail.entity";
import { Company } from "./company.entity";

@Entity("company_portal_configuration")
export class ConfigCompany {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: "sub_domain",
    type: "varchar",
    nullable: true,
  })
  subDomain: string;

  @Column({ name: "company_portal_url", type: "text", nullable: true })
  companyPortalUrl: string | null;

  @Column({ name: "company_id", type: "integer", nullable: true })
  companyId: number | null;

  @Column({ name: "company_database_id", type: "integer", nullable: true })
  companyDatabaseId: number | null;

  @ManyToOne(() => DatabaseConnect, { nullable: true })
  @JoinColumn({ name: "company_database_id" })
  databaseConnect: DatabaseConnect;

  @Column({ name: "company_logo_file_id", type: "integer", nullable: true })
  companyLogoFileId: number | null;

  @Column({ name: "is_company_config", type: "boolean", default: false })
  isCompanyConfig: boolean;

  // Company/domain-level CC email addresses. Applied as CC on every eligible
  // notification email sent for this company's portal config (unioned with
  // the per-template additional_user_emails, not a replacement for it) — see
  // NotificationService.resolveCompanyCcEmails in notification-service.
  @Column({
    name: "cc_email_addresses",
    type: "text",
    array: true,
    nullable: true,
  })
  ccEmailAddresses?: string[];

  @Column({
    name: "company_portal_configuration_detail_id",
    type: "integer",
    nullable: true,
  })
  companyPortalConfigurationDetailId: number | null;

  @ManyToOne(() => CompanyPortalConfigurationDetail, {
    cascade: true,
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: "company_portal_configuration_detail_id" })
  companyPortalConfigurationDetail?: CompanyPortalConfigurationDetail | null;

  @Column({
    name: "company_configuration_status_lid",
    type: "integer",
    nullable: true,
  })
  companyConfigurationStatusLid: number | null;

  @ManyToOne(() => LookUp, { nullable: true })
  @JoinColumn({ name: "company_configuration_status_lid" })
  companyConfigurationStatus?: LookUp | null;

  @Column({ name: "approved_by", type: "integer", nullable: true })
  approvedBy: number | null;

  @Column({ name: "approved_at", type: "timestamp", nullable: true })
  approvedAt: Date | null;

  @Column({ name: "rejected_by", type: "integer", nullable: true })
  rejectedBy: number | null;

  @Column({ name: "rejected_at", type: "timestamp", nullable: true })
  rejectedAt: Date | null;

  @Column({ name: "created_by", type: "integer", nullable: true })
  createdBy: number;

  @ManyToOne(() => Company, (company) => company.configCompanies, {
  nullable: true,
  onDelete: "SET NULL", // safe option
  })
  @JoinColumn({ name: "company_id" }) // maps FK column
  company?: Company | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp", nullable: true })
  createdAt: Date;

  @Column({ name: "updated_by", type: "integer", nullable: true })
  updatedBy: number;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp", nullable: true })
  updatedAt: Date;

  @Column({ name: "deleted_by", type: "integer", nullable: true })
  deletedBy: number;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date;
}
