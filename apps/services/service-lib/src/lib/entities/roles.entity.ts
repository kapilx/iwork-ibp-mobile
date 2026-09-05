import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("roles")
export class Role {
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

  @Column({ name: "role_key", type: "varchar", length: 255, nullable: false })
  roleKey: string;

  constructor(
    id: number,
    name: string,
    description: string,
    createdBy: string,
    updatedBy: string,
    roleKey: string
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.roleKey = roleKey;
  }
}
