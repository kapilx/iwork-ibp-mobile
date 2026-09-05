import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from "typeorm";
import { Role } from "./roles.entity";
import { AclCategoryActionMap } from "./acl-category-action-map.entity";

@Entity("role_acl_category_action_map")
export class RoleAclCategoryActionMap {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @ManyToOne(() => Role, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "role_id" })
  role: Role;

  @ManyToOne(() => AclCategoryActionMap, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "acl_category_action_id" })
  aclCategoryActionMap: AclCategoryActionMap;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
  })
  updatedAt!: Date;

  @Column({ name: "created_by", type: "varchar", length: 255, nullable: false })
  createdBy: string;

  @Column({ name: "updated_by", type: "varchar", length: 255, nullable: false })
  updatedBy: string;

  constructor(
    id: number,
    role: Role,
    aclCategoryActionMap: AclCategoryActionMap,
    createdBy: string,
    updatedBy: string
  ) {
    this.id = id;
    this.role = role;
    this.aclCategoryActionMap = aclCategoryActionMap;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
