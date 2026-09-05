import type { Relation } from "typeorm";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Auditable, SkipAudit } from "../audit-history";
import { BrokerAddress } from "./broker-address.entity";
import { BrokerContact } from "./broker-contact.entity";
import { Country } from "./country.entity";
import { LookUp } from "./look-up.entity";

@Entity({ name: "broker" })
@Auditable()
export class Broker {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({
    name: "broker_name",
    type: "varchar",
    length: 200,
    nullable: false,
  })
  brokerName!: string;

  @Column({
    name: "display_name",
    type: "varchar",
    length: 100,
    nullable: false,
  })
  displayName!: string;

  @Column({ name: "company_type_lid", type: "int", nullable: false })
  companyTypeLid!: number;

  @Column({ name: "website", type: "varchar", nullable: true })
  website?: string;

  @Column({ name: "remarks", type: "varchar", length: 500, nullable: true })
  remarks?: string;

  @Column({ name: "status_lid", type: "int", nullable: false })
  statusLid!: number;

  @Column({ name: "country_id", type: "int", nullable: true })
  countryId?: number;

  @Column({
    name: "nature_of_broking_bussiness_lid",
    type: "int",
    nullable: true,
  })
  natureOfBrokingBussinessLid?: number | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  @SkipAudit()
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  @SkipAudit()
  updatedAt!: Date;

  @Column({ name: "created_by", type: "int", nullable: false })
  @SkipAudit()
  createdBy!: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  @SkipAudit()
  updatedBy!: number;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  @SkipAudit()
  deletedAt?: Date;

  // @Column({ name: "audit_ref_id", type: "int", nullable: false })
  // auditRefId!: number;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "company_type_lid", referencedColumnName: "id" })
  companyType!: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "status_lid", referencedColumnName: "id" })
  status!: Relation<LookUp>;

  @OneToOne(() => Country, { eager: true })
  @JoinColumn({ name: "country_id", referencedColumnName: "id" })
  country?: Relation<Country>;

  @OneToOne(() => LookUp)
  @JoinColumn({
    name: "nature_of_broking_bussiness_lid",
    referencedColumnName: "id",
  })
  natureOfBrokingBussiness?: Relation<LookUp>;

  @OneToMany(() => BrokerAddress, (brokerAddress) => brokerAddress.broker, {
    cascade: true,
  })
  brokerAddresses!: Relation<BrokerAddress>[];

  /** List of contacts associated with this insurer company. */
  @OneToMany(() => BrokerContact, (brokerContact) => brokerContact.broker, {
    cascade: true,
  })
  brokerContacts!: Relation<BrokerContact>[];
}
