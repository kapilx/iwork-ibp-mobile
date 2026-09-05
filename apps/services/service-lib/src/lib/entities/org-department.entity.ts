import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  OneToOne,
  Relation,
} from "typeorm";
import { OrgVertical } from "./org-vertical.entity";
import { LookUp } from "./look-up.entity";

@Entity("org_department")
export class OrgDepartment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ name: "vertical_id" })
  verticalId: number;

  @Column({ type: "text" })
  description: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date;

  @Column({ name: "status_lid", type: "int", nullable: false })
  statusLid: number;

  @Column({ name: "created_by", type: "varchar", length: 255 })
  createdBy: string;

  @Column({ name: "updated_by", type: "varchar", length: 255 })
  updatedBy: string;

  @ManyToOne(() => OrgVertical, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vertical_id" })
  vertical!: OrgVertical;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "status_lid", referencedColumnName: "id" })
  status: Relation<LookUp>;

  constructor(
    id: number,
    name: string,
    verticalId: number,
    description: string,
    statusLid: number,
    createdAt: Date,
    updatedAt: Date,
    createdBy: string,
    updatedBy: string
  ) {
    this.id = id;
    this.name = name;
    this.verticalId = verticalId;
    this.description = description;
    this.statusLid = statusLid;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
