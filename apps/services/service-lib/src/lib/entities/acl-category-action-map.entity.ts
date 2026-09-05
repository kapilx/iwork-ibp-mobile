import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from "typeorm";
import { AclCategory } from "./acl-categories.entity";
import { AclAction } from "./acl-actions.entity";

@Entity("acl_category_action_map")
export class AclCategoryActionMap {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @ManyToOne(() => AclCategory, { nullable: false })
  @JoinColumn({ name: "acl_category_id" })
  aclCategory: AclCategory;

  @ManyToOne(() => AclAction, { nullable: false })
  @JoinColumn({ name: "acl_action_id" })
  aclAction: AclAction;

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
    aclCategory: AclCategory,
    aclAction: AclAction,
    createdBy: string,
    updatedBy: string
  ) {
    this.id = id;
    this.aclCategory = aclCategory;
    this.aclAction = aclAction;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
