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
import { Organisation } from "./organisation.entity";
import { LookUp } from "./look-up.entity";

@Entity("org_branch")
export class OrgBranch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "organisation_id", type: "int" })
  organisationId: number;

  @Column({ name: "name", type: "varchar", length: 255 })
  name: string;

  @Column({ name: "description", type: "text", nullable: true })
  description: string | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date;

  @Column({ name: "status_lid", type: "int", nullable: false })
  statusLid: number;

  @Column({ name: "created_by", type: "varchar" })
  createdBy!: string;

  @Column({ name: "updated_by", type: "varchar" })
  updatedBy!: string;

  @ManyToOne(() => Organisation, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organisation_id" })
  organisation!: Organisation;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "status_lid", referencedColumnName: "id" })
  status: Relation<LookUp>;
}
