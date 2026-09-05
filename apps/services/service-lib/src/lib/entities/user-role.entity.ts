import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from "typeorm";
import { Role } from "./roles.entity";
import { User } from "./user";
import { PolicyEnrollmentEmployee } from "./policy-enrollment-employee.entity";
import type { Relation } from "typeorm";

@Entity("user_role")
export class UserRole {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  // Nullable — NULL when row belongs to a company employee (ibp_employee_id is set instead)
  @Column({ name: "user_id", type: "int", nullable: true })
  userId: number | null;

  @Column({ name: "role_id", type: "int" })
  roleId: number;

  // Set for USER_TYPE_COMPANY_EMPLOYEE role rows; NULL for iWork/COMBINED users
  @Column({ name: "ibp_employee_id", type: "int", nullable: true })
  ibpEmployeeId?: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user: Relation<User>;

  @ManyToOne(() => Role, { nullable: false })
  @JoinColumn({ name: "role_id" })
  role: Relation<Role>;

  @ManyToOne(() => PolicyEnrollmentEmployee, { nullable: true })
  @JoinColumn({ name: "ibp_employee_id" })
  policyEnrollmentEmployee?: Relation<PolicyEnrollmentEmployee>;

  constructor(
    id: number,
    userId: number | null,
    roleId: number,
    user: Relation<User>,
    role: Relation<Role>,
    ibpEmployeeId?: number | null
  ) {
    this.id = id;
    this.userId = userId;
    this.roleId = roleId;
    this.user = user;
    this.role = role;
    this.ibpEmployeeId = ibpEmployeeId ?? null;
  }
}
