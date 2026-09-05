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
import { InsurerAddress } from "./insurer-address.entity";
import { InsureContact } from "./insurer-contact.entity";
import { LookUp } from "./look-up.entity";

@Entity({ name: "insurer" })
@Auditable()
export class Insurer {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({ name: "name", type: "varchar", length: 200 })
  insurerName!: string;

  @Column({ name: "display_name", type: "varchar", length: 100 })
  displayName!: string;

  @Column({ name: "company_type_lid", type: "int", nullable: false })
  companyTypeLid!: number;

  @Column({ name: "website", type: "varchar", nullable: true })
  website?: string;

  @Column({ name: "is_life_lid", type: "int", nullable: false })
  isLifeLid!: number;

  @Column({ name: "company_tag_lid", type: "int", nullable: false })
  companyTagLid!: number;

  @Column({ name: "remarks", type: "varchar", nullable: true, length: 500 })
  remarks?: string;

  @Column({ name: "insure_code", type: "varchar", nullable: true, length: 100 })
  insureCode?: string;

  @Column({ name: "pan_card_no", type: "varchar", nullable: true, length: 20 })
  panCardNumber?: string;

  @Column({ name: "registration_no", type: "varchar", nullable: true, length: 50 })
  registrationNo?: string;

  @Column({ name: "tan_number", type: "varchar", nullable: true, length: 20 })
  tanNumber?: string;

  @Column({ name: "status_lid", type: "int", nullable: false })
  statusLid!: number;

  @Column({ name: "country_id", type: "int", nullable: true })
  countryId?: number;

  @Column({ name: "created_by", type: "int" })
  @SkipAudit()
  createdBy!: number;

  @Column({ name: "updated_by", type: "int" })
  @SkipAudit()
  updatedBy!: number;

  @Column({ name: "insurer_logo_file_id", type: "integer", nullable: true })
  insurerLogoFileId: number | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  @SkipAudit()
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  @SkipAudit()
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  @SkipAudit()
  deletedAt?: Date;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "is_life_lid", referencedColumnName: "id" })
  isLife!: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "company_type_lid", referencedColumnName: "id" })
  companyType!: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "company_tag_lid", referencedColumnName: "id" })
  companyTag!: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "status_lid", referencedColumnName: "id" })
  status!: Relation<LookUp>;

  @OneToOne(() => Country, { eager: true })
  @JoinColumn({ name: "country_id", referencedColumnName: "id" })
  country?: Relation<Country>;

  /** List of addresses associated with this insurer company. */
  @OneToMany(() => InsurerAddress, (insurerAddress) => insurerAddress.insurer, {
    cascade: true,
  })
  insurerAddresses!: Relation<InsurerAddress[]>; // List of associated addresses

  /** List of contacts associated with this insurer company. */
  @OneToMany(() => InsureContact, (insurerContact) => insurerContact.insurer, {
    cascade: true,
  })
  insurerContacts!: Relation<InsureContact[]>;
}
