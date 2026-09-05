import type { Relation } from "typeorm";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { SensitiveField } from "../field-encryption/decorators/sensitive-field.decorator";
import { Auditable, SkipAudit } from "../audit-history";
import { LookUp } from "./look-up.entity";
import { OpportunityActivityParticipants } from "./opportunity-activity-participants.entity";
import { Opportunity } from "./opportunity.entity";
import { OrgBranch } from "./org-branch.entity";
import { OrgDepartment } from "./org-department.entity";
import { OrgDesignation } from "./org-designation.entity";
import { OrgSbu } from "./org-sbu.entity";
import { OrgVertical } from "./org-vertical.entity";
import { Organisation } from "./organisation.entity";
import { UserRole } from "./user-role.entity";

@Entity("users")
@Auditable()
export class User {
  @PrimaryGeneratedColumn({ name: "id" })
  userId: number;

  @Column({ name: "salutation_lid" })
  salutationLid: number;

  @Column({ name: "first_name" })
  firstName: string;

  @Column({ name: "last_name" })
  lastName: string;

  @SensitiveField({ deterministic: true })
  @Column({ name: "email_id_enc", unique: true, nullable: true, type: "text" })
  emailId: string;

  @SensitiveField({ deterministic: true })
  @Column({ name: "mobile_enc", unique: true, nullable: true, type: "text" })
  mobile: string;

  @Column({ name: "login_name", unique: true })
  loginName: string;

  @Column({ name: "password" })
  @SkipAudit()
  password: string;

  @Column({ name: "ibp_password", nullable: true })
  @SkipAudit()
  ibpPassword?: string;

  @Column({
    name: "is_password_hashed",
    type: "boolean",
    default: true,
  })
  isPasswordHashed: boolean;

  @Column({
    name: "is_password_set",
    type: "boolean",
    default: true,
  })
  isPasswordSet: boolean;

  @Column({ name: "branch_id" })
  branchId: number;

  @Column({ name: "sbu_id" })
  sbuId: number;

  @Column({ name: "vertical_id" })
  verticalId: number;

  @Column({ name: "department_id" })
  departmentId: number;

  @Column({ name: "designation_id" })
  designationId: number;

  @Column({ name: "organisation_id" })
  organisationId: number;

  @Column({ name: "reporting_user_id" })
  reportingUserId: number;

  @Column({ name: "user_type_key" })
  userTypeKey: string;

  @Column({ name: "status_lid", type: "int" })
  statusLid!: number;

  @Column({ name: "user_status_key" })
  userStatusKey: string;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  createdAt?: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  updatedAt?: Date;

  @Column({ name: "created_by", type: "int", nullable: true })
  @SkipAudit()
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  @SkipAudit()
  updatedBy?: number;

  @Column({ name: "password_expires_at", type: "timestamp", nullable: true })
  passwordExpiresAt?: Date;

  @Column({ 
    name: "auth_version", 
    type: "bigint", 
    default: 1,
    comment: "Version number for authentication invalidation. Incremented when user roles or permissions change."
  })
  authVersion: number;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles!: Relation<UserRole>[];

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  @SkipAudit()
  deletedAt?: Date;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "salutation_lid" })
  salutation!: Relation<LookUp>;

  @ManyToOne(() => Organisation)
  @JoinColumn({ name: "organisation_id" })
  organisation!: Relation<Organisation>;

  @ManyToOne(() => OrgBranch)
  @JoinColumn({ name: "branch_id" })
  branch!: Relation<OrgBranch>;

  @ManyToOne(() => OrgSbu)
  @JoinColumn({ name: "sbu_id" })
  sbu!: Relation<OrgSbu>;

  @ManyToOne(() => OrgVertical)
  @JoinColumn({ name: "vertical_id" })
  vertical!: Relation<OrgVertical>;

  @ManyToOne(() => OrgDesignation)
  @JoinColumn({ name: "designation_id" })
  designation!: Relation<OrgDesignation>;

  @ManyToOne(() => OrgDepartment)
  @JoinColumn({ name: "department_id" })
  department!: Relation<OrgDepartment>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "status_lid" })
  status!: Relation<LookUp>;

  @OneToMany(
    () => OpportunityActivityParticipants,
    (participant) => participant.participant
  )
  participations: OpportunityActivityParticipants[];

  @OneToMany(() => Opportunity, (opportunity) => opportunity.owner)
  opportunities?: Relation<Opportunity[]>;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
