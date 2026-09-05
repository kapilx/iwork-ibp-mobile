import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "company_zoho_integration" })
export class CompanyZohoIntegration {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Index()
  @Column({ name: "company_id", type: "int", unique: true })
  companyId!: number;

  @Column({ name: "zoho_organization_id", type: "varchar", length: 100, nullable: true })
  zohoOrganizationId?: string;

  @Column({ name: "zoho_domain", type: "varchar", length: 50, default: "zoho.in" })
  zohoDomain!: string;

  // Stored encrypted via FieldEncryptionService.encrypt() before save
  @Column({ name: "access_token", type: "text", nullable: true })
  accessToken?: string;

  // Stored encrypted via FieldEncryptionService.encrypt() before save
  @Column({ name: "refresh_token", type: "text", nullable: true })
  refreshToken?: string;

  @Column({ name: "token_expires_at", type: "timestamptz", nullable: true })
  tokenExpiresAt?: Date;

  @Column({ name: "scopes", type: "text", array: true, nullable: true })
  scopes?: string[];

  @Index()
  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @Column({ name: "last_synced_at", type: "timestamptz", nullable: true })
  lastSyncedAt?: Date;

  @Column({ name: "last_sync_stats", type: "jsonb", nullable: true })
  lastSyncStats?: {
    synced: number;
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
  };

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
