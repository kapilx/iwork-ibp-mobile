import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Relation,
  Index,
} from "typeorm";
import { Exclude } from "class-transformer";
import { MstrHospital } from "./mstr-hospital.entity";

/**
 * Entity representing hospital address information.
 * Uses string-based storage for location data instead of ID relationships.
 */
@Entity("mstr_hospital_address")
@Index("idx_mstr_hospital_address_city_name", ["cityName"])
@Index("idx_mstr_hospital_address_state_name", ["stateName"])
@Index("idx_mstr_hospital_address_country_name", ["countryName"])
@Index("idx_mstr_hospital_address_pincode", ["pinCode"])
@Index("idx_mstr_hospital_address_location", ["latitude", "longitude"])
export class MstrHospitalAddress {
  /**
   * Unique identifier for the hospital address.
   */
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  /**
   * First line of the address.
   */
  @Column({
    name: "address_line_1",
    type: "varchar",
    length: 200,
    nullable: false,
  })
  addressLine1!: string;

  /**
   * Second line of the address (optional).
   */
  @Column({
    name: "address_line_2",
    type: "varchar",
    length: 200,
    nullable: true,
  })
  addressLine2?: string;

  /**
   * City name stored as string.
   */
  @Column({ name: "city_name", type: "varchar", length: 100, nullable: false })
  cityName!: string;

  /**
   * State name stored as string.
   */
  @Column({ name: "state_name", type: "varchar", length: 100, nullable: false })
  stateName!: string;

  /**
   * Country name stored as string.
   */
  @Column({
    name: "country_name",
    type: "varchar",
    length: 100,
    nullable: false,
    default: "'India'",
  })
  countryName!: string;

  /**
   * Postal code of the address (optional).
   */
  @Column({ name: "pin_code", type: "varchar", length: 20, nullable: true })
  pinCode?: string;

  /**
   * Landmark near the address (optional).
   */
  @Column({ name: "landmark", type: "varchar", length: 200, nullable: true })
  landmark?: string;

  /**
   * Primary phone number.
   */
  @Column({ name: "phone_number", type: "varchar", length: 50, nullable: true })
  phoneNumber?: string;

  /**
   * Alternate phone number (optional).
   */
  @Column({
    name: "alternate_phone_number",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  alternatePhoneNumber?: string;

  /**
   * Email address (optional).
   */
  @Column({ name: "email", type: "varchar", length: 255, nullable: true })
  email?: string;

  /**
   * Telephone STD / area code from external TPA API (STDCODE field).
   */
  @Column({ name: "std_code", type: "varchar", length: 50, nullable: true })
  stdCode?: string;

  /**
   * Fax number from external TPA API (FAXNUMBER field).
   */
  @Column({ name: "fax_number", type: "varchar", length: 30, nullable: true })
  faxNumber?: string;

  /**
   * Level of care classification from external TPA API (LEVELOFCARE field).
   * e.g. "Primary", "Secondary", "Tertiary", or blank.
   */
  @Column({ name: "level_of_care", type: "varchar", length: 100, nullable: true })
  levelOfCare?: string;

  /**
   * Network type from external TPA API (NETWORKTYPE field).
   * e.g. "TPA_Wise", "Insurer_Wise".
   */
  @Column({ name: "network_type", type: "varchar", length: 100, nullable: true })
  networkType?: string;

  /**
   * Insurance companies list from external TPA API (INSURANCECOMPANY field).
   * Stored as JSON array, parsed from pipe-separated string in API response.
   * e.g. ["National Insurance Co. Ltd.", "United India Insurance Co. Ltd.", ...]
   */
  @Column({ name: "insurance_companies", type: "jsonb", nullable: true })
  insuranceCompanies?: string[];

  /**
   * Longitude coordinate for geospatial queries (decimal degrees).
   */
  @Column({
    name: "longitude",
    type: "numeric",
    precision: 11,
    scale: 8,
    nullable: true,
  })
  longitude?: number;

  /**
   * Latitude coordinate for geospatial queries (decimal degrees).
   */
  @Column({
    name: "latitude",
    type: "numeric",
    precision: 10,
    scale: 8,
    nullable: true,
  })
  latitude?: number;

  /**
   * Timestamp when the address was created.
   */
  @Exclude()
  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  /**
   * Identifier of the user who created the address.
   */
  @Exclude()
  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy!: number;

  /**
   * Timestamp when the address was last updated.
   */
  @Exclude()
  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;

  /**
   * Identifier of the user who last updated the address.
   */
  @Exclude()
  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy!: number;

  /**
   * Timestamp when the address was soft deleted.
   */
  @Exclude()
  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date;

  /**
   * Identifier of the user who soft deleted the address.
   */
  @Exclude()
  @Column({ name: "deleted_by", type: "int", nullable: true })
  deletedBy?: number;

  /**
   * List of hospitals associated with this address.
   */
  @OneToMany(() => MstrHospital, (hospital) => hospital.addresses, {
    cascade: true,
  })
  hospitals!: Relation<MstrHospital[]>;

  constructor(
    addressLine1: string,
    cityName: string,
    stateName: string,
    createdBy: number,
    updatedBy: number,
    countryName = "India",
    pinCode?: string,
    addressLine2?: string,
    landmark?: string,
    phoneNumber?: string,
    alternatePhoneNumber?: string,
    email?: string,
    longitude?: number,
    latitude?: number,
    stdCode?: string,
    faxNumber?: string,
    levelOfCare?: string,
    networkType?: string,
    insuranceCompanies?: string[],
  ) {
    this.addressLine1 = addressLine1;
    this.addressLine2 = addressLine2;
    this.cityName = cityName;
    this.stateName = stateName;
    this.countryName = countryName;
    this.pinCode = pinCode;
    this.landmark = landmark;
    this.phoneNumber = phoneNumber;
    this.alternatePhoneNumber = alternatePhoneNumber;
    this.email = email;
    this.latitude = latitude;
    this.longitude = longitude;
    this.stdCode = stdCode;
    this.faxNumber = faxNumber;
    this.levelOfCare = levelOfCare;
    this.networkType = networkType;
    this.insuranceCompanies = insuranceCompanies;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
