import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("hr_user_management")
@Index(["userId"], { unique: true, where: '"deleted_at" IS NULL' })
export class HrUserManagement {
  @PrimaryGeneratedColumn()
  id!: number;

  // Nullable after HR auth detach — HR identity is self-contained in this table
  @Column({ name: "user_id", type: "int", nullable: true })
  userId?: number | null;

  @Column({ name: "user_name", type: "varchar", length: 255, nullable: true })
  userName?: string | null;

  @Column({ name: "email_id", type: "varchar", length: 255, nullable: true })
  emailId?: string | null;

  @Column({ name: "phone_number", type: "varchar", length: 50, nullable: true })
  phoneNumber?: string | null;

  @Column({ name: "role_key", type: "varchar", length: 100, default: "HR_ADMIN" })
  roleKey!: string;

  @Column({
    name: "company_id",
    type: "int",
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value: number | string | null) =>
        value === null || value === undefined ? null : Number(value),
    },
  })
  companyId?: number | null;

  @Column({ name: "company_name", type: "varchar", length: 255, nullable: true })
  companyName?: string | null;

  // Credential columns — migrated from users table during HR auth detach
  @Column({ name: "login_name", type: "varchar", length: 255, nullable: true })
  loginName?: string | null;

  @Column({ name: "password", type: "varchar", length: 255, nullable: true })
  password?: string | null;

  @Column({ name: "is_password_set", type: "boolean", default: false })
  isPasswordSet!: boolean;

  @Column({ name: "is_password_hashed", type: "boolean", default: false })
  isPasswordHashed!: boolean;

  @Column({ name: "password_expires_at", type: "timestamptz", nullable: true })
  passwordExpiresAt?: Date | null;

  @Column({ name: "auth_version", type: "bigint", default: 1 })
  authVersion!: number;

  @Column({ name: "user_status_key", type: "varchar", length: 100, default: "USER_STATUS_ACTIVE" })
  userStatusKey!: string;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number | null;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date | null;
}
