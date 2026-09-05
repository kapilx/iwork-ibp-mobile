import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("company_portal_configuration_detail")
export class CompanyPortalConfigurationDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "company_id", type: "integer" })
  companyId: number;

  @Column({
    name: "company_portal_dashboard_config",
    type: "jsonb",
    nullable: true,
  })
  companyPortalDashboardConfig: Record<string, any> | null;

  @Column({
    name: "company_policy_config",
    type: "jsonb",
    nullable: true,
  })
  companyPolicyConfig: Record<string, any>[] | null;

  @Column({
    name: "company_portal_branding_config",
    type: "jsonb",
    nullable: true,
  })
  companyPortalBrandingConfig: Record<string, any> | null;

  @Column({
    name: "dependent_relation_config",
    type: "jsonb",
    nullable: true,
  })
  dependentRelationConfig: Record<string, any> | null;

  @Column({
    name: "company_portal_wellness_config",
    type: "jsonb",
    nullable: true,
  })
  companyPortalWellnessConfig: Record<string, any> | null;

  /**
   * Offers & Benefits section: `{ isEnabled, items[] }`. Scoped by the detail
   * row itself — each portal configuration points at its own detail, so a
   * domain-level override is just that config's own row, with the company-level
   * config's row as the fallback (same pattern as branding/auth).
   */
  @Column({
    name: "company_portal_offers_config",
    type: "jsonb",
    nullable: true,
  })
  companyPortalOffersConfig: Record<string, any> | null;

  @Column({ name: "is_company_config", type: "boolean", default: false })
  isCompanyConfig: boolean;

  @Column({ name: "created_by", type: "integer", nullable: true })
  createdBy: number | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "updated_by", type: "integer", nullable: true })
  updatedBy: number | null;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
