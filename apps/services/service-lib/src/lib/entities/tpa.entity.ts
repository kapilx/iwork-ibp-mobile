import { Exclude } from "class-transformer";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Auditable, SkipAudit } from "../audit-history";
import { Country } from "./country.entity";
import { LookUp } from "./look-up.entity";
import { TpaAddress } from "./tpa-address.entity";
import { TpaContact } from "./tpa-contact.entity";

@Entity("tpa")
@Auditable()
export class Tpa {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number | undefined;

  @Column({ name: "name", nullable: false, type: "varchar", length: 200 })
  tpaName!: string;

  @Column({
    name: "display_name",
    nullable: false,
    type: "varchar",
    length: 100,
  })
  displayName!: string;

  @Column({ name: "company_type_lid", nullable: false, type: "int" })
  companyTypeLid!: number;

  @Column({ name: "website", nullable: true, type: "varchar" })
  website?: string;

  @Column({ name: "remarks", nullable: true, type: "varchar", length: 500 })
  remarks?: string;

  @Column({ name: "status_lid", nullable: true, type: "int" })
  statusLid!: number;

  @Column({ name: "country_id", type: "int", nullable: true })
  countryId?: number;

  @Column({ name: "tpa_logo_file_id", type: "integer", nullable: true })
  tpaLogoFileId: number | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  createdAt?: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  updatedAt?: Date;

  @Exclude()
  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  @SkipAudit()
  deletedAt?: Date;

  @Column({ name: "created_by", type: "int" })
  @SkipAudit()
  createdBy?: number;

  @Column({ name: "updated_by", type: "int" })
  @SkipAudit()
  updatedBy?: number;

  @OneToMany(() => TpaAddress, (tpaAddress: TpaAddress) => tpaAddress.tpa, {
    cascade: true,
  })
  tpaAddresses!: Relation<TpaAddress>[];

  @OneToMany(() => TpaContact, (tpaContact) => tpaContact.tpa)
  contacts!: Relation<TpaContact[]>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "status_lid", referencedColumnName: "id" })
  status!: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "company_type_lid", referencedColumnName: "id" })
  companyType!: Relation<LookUp>;

  @OneToOne(() => Country, { eager: true })
  @JoinColumn({ name: "country_id", referencedColumnName: "id" })
  country?: Relation<Country>;

  constructor(partial: Partial<Tpa>) {
    Object.assign(this, partial);
  }
}
