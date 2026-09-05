import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  Relation,
  OneToOne,
} from "typeorm";
import { Country } from "./country.entity";
import { LookUp } from "./look-up.entity";

@Entity("organisation")
export class Organisation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "name", type: "varchar", length: 255 })
  name: string;

  @Column({ name: "description", type: "text", nullable: true })
  description: string | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date;

  @Column({ name: "status_lid", type: "int", nullable: false })
  statusLid: number;

  @Column({ name: "created_by", type: "varchar" })
  createdBy: string;

  @Column({ name: "updated_by", type: "varchar" })
  updatedBy: string;

  @Column({ name: "country_id", type: "int" })
  countryId: number;

  @Column({ name: "parent_organisation_id", type: "int" })
  parentOrganisationId: number;

  @Column({ name: "organisation_key", type: "varchar" })
  organisationKey: string;

  @ManyToOne(() => Country)
  @JoinColumn({ name: "country_id" })
  country: Relation<Country>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "status_lid", referencedColumnName: "id" })
  status!: Relation<LookUp>;

  constructor(
    id: number,
    name: string,
    description: string,
    createdAt: Date,
    updatedAt: Date,
    statusLid: number,
    countryId: number,
    parentOrganisationId: number,
    createdBy: string,
    updatedBy: string,
    organisationKey: string
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.statusLid = statusLid;
    this.countryId = countryId;
    this.parentOrganisationId = parentOrganisationId;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.organisationKey = organisationKey;
  }
}
