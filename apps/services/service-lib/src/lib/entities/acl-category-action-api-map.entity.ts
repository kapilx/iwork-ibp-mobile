import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AclCategoryActionMap } from "./acl-category-action-map.entity";

@Entity("acl_category_action_api_map")
export class AclCategoryActionApiMap {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({
    name: "acl_category_action_id", type: "integer",
  })
  aclCategoryActionId: number;

  @Column({ name: "api", type: "varchar" })
  api: string;

  @Column({ name: "method", type: "varchar" })
  method: string;


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

  @ManyToOne(() => AclCategoryActionMap, (map) => map.id)
  @JoinColumn({ name: 'acl_category_action_id' })
  aclCategoryActionMap: AclCategoryActionMap;

  constructor(
    id: number,
    aclCategoryActionId: number,
    api: string,
    method: string,
    createdBy: string,
    updatedBy: string,
  ) {
    this.id = id;
    this.aclCategoryActionId = aclCategoryActionId;
    this.api = api;
    this.method = method;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
