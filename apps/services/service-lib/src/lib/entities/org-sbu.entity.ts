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

@Entity("org_sbu")
export class OrgSbu {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
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

  @Column({
    name: "is_ro_generation_enabled",
    type: "boolean",
    default: false,
  })
  isRoGenerationEnabled: boolean;

  @Column({ name: "ro_process_status", type: "varchar", length: 50, nullable: true })
  roProcessStatus: string | null;

  @Column({ name: "ro_process_started_at", type: "timestamptz", nullable: true })
  roProcessStartedAt: Date | null;

  @ManyToOne(() => Organisation)
  @JoinColumn({ name: "organisation_id" })
  organisation!: Relation<Organisation>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "status_lid", referencedColumnName: "id" })
  status: Relation<LookUp>;
}
