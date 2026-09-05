import type { Relation } from "typeorm";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { SensitiveField } from "../field-encryption/decorators/sensitive-field.decorator";
import { Organisation } from "../../../../service-lib/src/lib/entities/organisation.entity";
import { Auditable, SkipAudit } from "../audit-history";
import { LookUp } from "./look-up.entity";
import { OrgBranch } from "./org-branch.entity";
import { OrgDepartment } from "./org-department.entity";
import { OrgDesignation } from "./org-designation.entity";
import { OrgSbu } from "./org-sbu.entity";
import { OrgVertical } from "./org-vertical.entity";
import { User } from "./user";
import { UserRole } from "./user-role.entity";

@Entity("employee")
@Auditable()
export class Employee {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  employeeId!: number;

  @Column({ name: "salutation_lid", type: "int" })
  salutationLid!: number;

  @Column({ name: "first_name", type: "varchar" })
  firstName!: string;

  @Column({ name: "last_name", type: "varchar" })
  lastName!: string;

  @SensitiveField({ deterministic: true })
  @Column({ name: "email_id_enc", unique: true, nullable: true, type: "text" })
  emailId!: string;

  @SensitiveField({ deterministic: true })
  @Column({ name: "mobile_enc", unique: true, nullable: true, type: "text" })
  mobile!: string;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @Column({ name: "branch_id", type: "int" })
  branchId!: number;

  @Column({ name: "sbu_id", type: "int" })
  sbuId!: number;

  @Column({ name: "vertical_id", type: "int" })
  verticalId!: number;

  @Column({ name: "department_id", type: "int" })
  departmentId!: number;

  @Column({ name: "designation_id", type: "int" })
  designationId!: number;

  @Column({ name: "organisation_id", type: "int" })
  organisationId!: number;

  @Column({ name: "status_lid", type: "int" })
  statusLid!: number;

  @Column({ name: "iirm_emp_id", type: "varchar", unique: true })
  iirmEmpId!: string;

  @Column({ name: "reporting_user_id", type: "int" })
  reportingUserId!: number;

  @Column({ name: "reporting_manager_employee_id", type: "int" })
  reportingManagerEmployeeId!: number;

  @SensitiveField({ deterministic: true })
  @Column({ name: "date_of_birth_enc", type: "text", nullable: true })
  dateOfBirth: Date;

  @Column({ name: "date_of_joining", type: "date" })
  dateOfJoining: Date;

  @Column({ name: "profile_url", type: "text" })
  profileUrl: string;

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

  @Column({ name: "created_by", type: "int" })
  @SkipAudit()
  createdBy?: number;

  @Column({ name: "updated_by", type: "int" })
  @SkipAudit()
  updatedBy?: number;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  @SkipAudit()
  deletedAt?: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: Relation<User>;

  @ManyToOne(() => Employee, (employee) => employee.reportees, {
    nullable: true,
  })
  @JoinColumn({ name: "reporting_manager_employee_id" }) // Self-referencing relationship for manager
  reportingTo?: Relation<Employee>;

  @OneToMany(() => Employee, (employee) => employee.reportingTo)
  reportees!: Relation<Employee>[];

  @ManyToOne(() => Organisation)
  @JoinColumn({ name: "organisation_id" })
  organisation!: Relation<Organisation>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "status_lid" })
  statusLookup!: Relation<LookUp>;

  @ManyToOne(() => OrgDepartment)
  @JoinColumn({ name: "department_id" })
  department!: Relation<OrgDepartment>;

  @ManyToOne(() => OrgDesignation)
  @JoinColumn({ name: "designation_id" })
  designation!: Relation<OrgDesignation>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "salutation_lid" })
  salutation!: Relation<LookUp>;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  @JoinColumn({ name: "user_id", referencedColumnName: "userId" })
  userRoles!: Relation<UserRole[]>;

  @ManyToOne(() => OrgBranch)
  @JoinColumn({ name: "branch_id" })
  branch!: Relation<OrgBranch>;

  @ManyToOne(() => OrgSbu)
  @JoinColumn({ name: "sbu_id" })
  sbu!: Relation<OrgSbu>;

  @ManyToOne(() => OrgVertical)
  @JoinColumn({ name: "vertical_id" })
  vertical!: Relation<OrgVertical>;

  constructor(partial: Partial<Employee>) {
    Object.assign(this, partial);
  }
}
