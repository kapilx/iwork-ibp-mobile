import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("acl_categories")
export class AclCategory {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({
    name: "name",
    type: "varchar",
    length: 50,
    unique: true,
    nullable: false,
  })
  name: string;

  @Column({ name: "description", type: "text", nullable: true })
  description: string;

  @Column({ name: "parent", type: "varchar" })
  parent: string;

  @Column({ name: "category_key", type: "varchar" })
  categoryKey: string;

  @Column({ name: "application_scope", type: "varchar" })
  applicationScope: string;

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
    name: string,
    description: string,
    createdBy: string,
    updatedBy: string,
    categoryKey: string,
    parent: string,
    applicationScope: string
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.categoryKey = categoryKey;
    this.parent = parent;
    this.applicationScope = applicationScope;
  }
}
