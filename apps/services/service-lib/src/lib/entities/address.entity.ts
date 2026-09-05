import { Exclude } from "class-transformer";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Auditable, SkipAudit } from "../audit-history";
import { BrokerAddress } from "./broker-address.entity";
import { City } from "./city.entity";
import { CompanyAddress } from "./company.address.entity";
import { ContactAddress } from "./contact-address.entity";
import { Country } from "./country.entity";
import { InsurerAddress } from "./insurer-address.entity";
import { LookUp } from "./look-up.entity";
import { OpportunityRiskLocations } from "./opportunity-risk-locations.entity";
import { PolicyRiskLocationMap } from "./policy-risk-location-map.entity";
import { State } from "./state.entity";
import { TpaAddress } from "./tpa-address.entity";
/**
 * Entity representing an address.
 */
@Entity("address")
@Auditable()
export class Address {
  /**
   * Unique identifier for the address.
   */
  @PrimaryGeneratedColumn()
  id: number | undefined;

  /**
   * Type of the address (e.g., residential, business).
   */
  @Column({ name: "address_type_lid", type: "int", nullable: true })
  addressTypeLid: number;

  /**
   * First line of the address.
   */
  @Column({ name: "addr_1", type: "varchar", length: 200 })
  address1: string;

  /**
   * Second line of the address (optional).
   */
  @Column({ name: "addr_2", type: "varchar", length: 200, nullable: true })
  address2: string;

  /**
   * Area or locality of the address (optional).
   */
  @Column({ name: "area", type: "varchar", length: 100, nullable: true })
  area: string;

  /**
   * Postal code of the address (optional).
   */
  @Column({ name: "pincode", type: "varchar", length: 20, nullable: true })
  pinCode: string;

  /**
   * Primary phone number associated with the address.
   */
  @Column({ name: "phone_number", type: "varchar", length: 20, nullable: true })
  phoneNumber: string;

  /**
   * Alternate phone number (optional).
   */
  @Column({
    name: "alternate_phone_number",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  alternatePhoneNumber: string;

  /**
   * Email address associated with the address (optional).
   */
  @Column({ name: "email", type: "varchar", length: 100, nullable: true })
  email: string;

  /**
   * Support number or toll-free number (optional).
   */
  @Column({
    name: "support_number",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  supportNumber: string;

  @Column({ name: "branch_type_lid", type: "int", nullable: true })
  branchTypeLid?: number;

  @Column({ name: "parent_branch_id", type: "int", nullable: true })
  parentBranchId?: number;

  @Column({ name: "branch_code", type: "varchar", length: 100, nullable: true })
  branchCode?: string;

  @Column({ name: "location_code", type: "varchar", length: 100, nullable: true })
  locationCode?: string | null;

  @Column({ name: "branch_name", type: "varchar", length: 200, nullable: true })
  branchName?: string;

  @Column({ name: "pan_card_no", type: "varchar", length: 50, nullable: true })
  panCardNo?: string;

  @Column({ name: "registration_no", type: "varchar", length: 50, nullable: true })
  registrationNo?: string;

  @Column({ name: "tan_number", type: "varchar", length: 50, nullable: true })
  tanNumber?: string;

  @Column({ name: "state_gst_detail_id", type: "int", nullable: true })
  stateGstDetailId?: number;

  /**
   * Timestamp when the address was created.
   */
  @Exclude()
  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  createdAt?: Date;

  /**
   * Timestamp when the address was last updated.
   */
  @Exclude()
  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  updatedAt?: Date;

  /**
   * Identifier of the user who created the address.
   */
  @Exclude()
  @Column({ name: "created_by", type: "int", nullable: false })
  @SkipAudit()
  createdBy?: number;

  /**
   * Identifier of the user who last updated the address.
   */
  @Exclude()
  @Column({ name: "updated_by", type: "int", nullable: false })
  @SkipAudit()
  updatedBy?: number;

  @Exclude()
  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  @SkipAudit()
  deletedAt?: Date;

  /**
   * Country associated with the address.
   */
  @ManyToOne(() => Country, (country) => country.id, { eager: true })
  @JoinColumn({ name: "country_id" }) // Ensure the correct column name is used
  countryId: Relation<Country>;

  /**
   * State associated with the address.
   */
  @ManyToOne(() => State, (state) => state.id, { eager: true })
  @JoinColumn({ name: "state_id" }) // Ensure the correct column name is used
  stateId: Relation<State>;

  /**
   * City associated with the address.
   */
  @ManyToOne(() => City, (city) => city.id, { eager: true })
  @JoinColumn({ name: "city_id" }) // Ensure the correct column name is used
  cityId: Relation<City>;

  /**
   * List of contact addresses associated with this address.
   */
  @OneToMany(() => ContactAddress, (contactAddress) => contactAddress.address, {
    cascade: true,
  })
  contactAddresses: Relation<ContactAddress[]>;

  /**
   * List of insurer company addresses associated with this address.
   */
  @OneToMany(() => InsurerAddress, (insurerAddress) => insurerAddress.address, {
    cascade: true,
  })
  insurerAddresses!: Relation<InsurerAddress[]>;

  @OneToMany(() => BrokerAddress, (BrokerAddress) => BrokerAddress.address, {
    cascade: true,
  })
  brokerAddresses!: Relation<BrokerAddress[]>;

  @OneToMany(() => CompanyAddress, (companyAddress) => companyAddress.address, {
    cascade: true,
  })
  companyAddresses!: Relation<CompanyAddress[]>;

  @OneToMany(() => TpaAddress, (tpaAddress) => tpaAddress.address, {
    cascade: true,
  })
  tpaAddresses!: Relation<TpaAddress[]>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "address_type_lid", referencedColumnName: "id" })
  addressType!: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "branch_type_lid", referencedColumnName: "id" })
  branchType?: Relation<LookUp>;

  @OneToMany(
    () => OpportunityRiskLocations,
    (opportunityRiskLocations) => opportunityRiskLocations.address,
    {
      cascade: true,
    }
  )
  opportunityRiskLocations?: Relation<OpportunityRiskLocations[]>;

  @OneToMany(
    () => PolicyRiskLocationMap,
    (policyRiskLocation) => policyRiskLocation.address,
    { cascade: true }
  )
  policyRiskLocations?: Relation<PolicyRiskLocationMap[]>;

  constructor(
    addressTypeLid: number,
    address1: string,
    countryId: Relation<Country>,
    stateId: Relation<State>,
    cityId: Relation<City>,
    phoneNumber: string,
    address2?: string,
    area?: string,
    pinCode?: string,
    alternatePhoneNumber?: string,
    email?: string,
    supportNumber?: string,
    createdBy?: number,
    updatedBy?: number,
    createdAt?: Date,
    updatedAt?: Date,
    contactAddresses?: Relation<ContactAddress>
  ) {
    this.addressTypeLid = addressTypeLid;
    this.address1 = address1;
    this.countryId = countryId;
    this.stateId = stateId;
    this.cityId = cityId;
    this.address2 = address2 ?? "";
    this.area = area ?? "";
    this.pinCode = pinCode ?? "";
    this.phoneNumber = phoneNumber;
    this.alternatePhoneNumber = alternatePhoneNumber ?? "";
    this.email = email ?? "";
    this.supportNumber = supportNumber ?? "";
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
    this.contactAddresses = contactAddresses;
  }
}
