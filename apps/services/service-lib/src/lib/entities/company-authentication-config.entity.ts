import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { AuthenticationMethod } from "./authentication-method.entity";

@Entity("company_authentication_config")
export class CompanyAuthenticationConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "company_id", type: "int" })
  companyId: number;

  @Column({ name: "authentication_method_id", type: "int" })
  authenticationMethodId: number;

  @ManyToOne(() => AuthenticationMethod, { eager: true })
  @JoinColumn({ name: "authentication_method_id" })
  authenticationMethod: AuthenticationMethod;

  @Column({
    name: "authentication_method_key",
    type: "text",
    nullable: true,
  })
  authenticationMethodKey: string | null;

  @Column({ name: "company_portal_auth_config", type: "jsonb", nullable: true })
  companyPortalAuthConfig: Record<string, any> | null;

  /** NULL = company-level default; set = domain-level override for this specific domain */
  @Column({ name: "config_id", type: "int", nullable: true })
  configId: number | null;

  @Column({ name: "created_by", type: "integer", nullable: true })
  createdBy: number | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "updated_by", type: "integer", nullable: true })
  updatedBy: number | null;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
