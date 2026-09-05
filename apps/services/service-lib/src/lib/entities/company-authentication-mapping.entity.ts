import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
} from 'typeorm';
import { AuthenticationMethod } from './authentication-method.entity';
import { CompanyAuthenticationConfig } from './company-authentication-config.entity';

@Entity('company_authentication_map')
@Unique(['companyId', 'configId', 'authenticationMethodId']) // Prevent duplicate mappings per domain scope
export class CompanyAuthenticationMapping {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'company_id', type: 'int' })
    companyId: number; // Reference to company in org-service

    /** NULL = company-level default; set = domain-level override for this specific domain */
    @Column({ name: 'config_id', type: 'int', nullable: true })
    configId: number | null;

    @Column({ name: 'authentication_method_id', type: 'int' })
    authenticationMethodId: number;

    @ManyToOne(() => AuthenticationMethod, { eager: true })
    @JoinColumn({ name: 'authentication_method_id' })
    authenticationMethod: AuthenticationMethod;

    @Column({ name: 'is_enabled', default: true })
    isEnabled: boolean; // Allow disabling specific auth method for a company

    @Column({ name: 'display_order', default: 1 })
    displayOrder: number; // Order in which auth methods should be displayed

    @Column({ name: 'authentication_method_key', type: 'text', nullable: true })
    authenticationMethodKey: string | null;

    @Column({ name: 'company_portal_auth_config_id', type: 'int', nullable: true })
    companyPortalAuthConfigId: number | null;

    @ManyToOne(() => CompanyAuthenticationConfig, { cascade: true, nullable: true })
    @JoinColumn({ name: 'company_portal_auth_config_id' })
    companyAuthenticationConfig?: CompanyAuthenticationConfig | null;

    @Column({ name: 'created_by', type: 'integer', nullable: true })
    createdBy: number | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'updated_by', type: 'integer', nullable: true })
    updatedBy: number | null;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
