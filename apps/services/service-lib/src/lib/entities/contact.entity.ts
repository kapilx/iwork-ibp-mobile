import type { Relation } from "typeorm";
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
  UpdateDateColumn,
} from "typeorm";
import { BrokerContact } from "../../../../service-lib/src/lib/entities/broker-contact.entity";
import { City } from "../../../../service-lib/src/lib/entities/city.entity";
import { Auditable, SkipAudit } from "../audit-history";
import { CompanyContactMap } from "./company-contact.entity";
import { ContactAddress } from "./contact-address.entity";
import { ContactCommunicationDetails } from "./contact-communication-details.entity";
import { ContactDetails } from "./contact-details.entity";
import { ContactDocMap } from "./contact-document-map.entity";
import { InsureContact } from "./insurer-contact.entity";
import { LookUp } from "./look-up.entity";
import { ProfessionalExperience } from "./professional-experience.entity";
import { QualificationExperience } from "./qualification-experience.entity";
import { TpaContact } from "./tpa-contact.entity";
import { User } from "./user";
/**
 * Entity representing a contact.
 */
@Entity("contact")
@Auditable()
export class Contact {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column({ name: "salutation_lid", type: "int", nullable: true })
  salutationLid: number;

  @Column({ name: "first_name", type: "varchar", length: 100, nullable: false })
  firstName: string;

  @Column({ name: "last_name", type: "varchar", length: 100, nullable: false })
  lastName: string;

  @Column({ name: "middle_name", type: "varchar", length: 100, nullable: true })
  middleName: string;

  @Column({
    name: "display_name",
    type: "varchar",
    length: 200,
    nullable: false,
  })
  displayName: string;

  @Column({ name: "linkedin_url", type: "text", nullable: false })
  linkedInUrl: string;

  @Column({ name: "company_location_id", type: "int", nullable: false })
  companyLocationId: number;

  @Column({ name: "company_branch_id", type: "int", nullable: false })
  companyBranchId: number;

  @Column({ name: "tag_lid", type: "int", nullable: false })
  tagLid: number;

  @Column({ name: "contact_type_lid", type: "int", nullable: false })
  contactTypeLid: number;

  @Column({ name: "department", type: "varchar", nullable: true })
  department: string;

  @Column({ name: "designation", type: "varchar", nullable: true })
  designation: string;

  // Commented out as per the requirement change - veda - 09/05/2025
  // @Column({ name: "department_id", type: "int", nullable: false })
  // departmentId: number;

  // @Column({
  //   name: "designation_id",
  //   type: "int",
  //   nullable: false,
  // })
  // designationId: number;

  @Column({ name: "reporting_to_id", type: "int", nullable: true })
  reportingToId: number;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks: string;

  @Column({ name: "status_lid", type: "int", nullable: true })
  statusLid!: number;

  @Column({ name: "relationship_type_lid", type: "int", nullable: true })
  relationshipTypeLid!: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  createdAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  updatedAt: Date;

  @Column({ name: "created_by", type: "int", nullable: false })
  @SkipAudit()
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  @SkipAudit()
  updatedBy: number;

  @Column({ name: "contact_record_type_lid", type: "int", nullable: false })
  contactRecordTypeLid: number;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  @SkipAudit()
  deletedAt?: Date;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "contact_record_type_lid", referencedColumnName: "id" })
  contactRecordType!: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "salutation_lid", referencedColumnName: "id" })
  salutation!: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "tag_lid", referencedColumnName: "id" })
  tag!: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "contact_type_lid", referencedColumnName: "id" })
  contactType!: Relation<LookUp>;

  // Commented out as per the requirement change - veda - 09/05/2025
  // @OneToOne(() => Department)
  // @JoinColumn({ name: "department_id", referencedColumnName: "id" })
  // department!: Relation<Department>;

  // @OneToOne(() => Designation)
  // @JoinColumn({ name: "designation_id", referencedColumnName: "id" })
  // designation!: Relation<Designation>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "status_lid", referencedColumnName: "id" })
  status!: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "relationship_type_lid", referencedColumnName: "id" })
  relationshipType!: Relation<LookUp>;

  @OneToOne(() => User)
  @JoinColumn({ name: "created_by", referencedColumnName: "userId" })
  owner!: Relation<User>;

  @OneToOne(() => City)
  @JoinColumn({ name: "company_location_id", referencedColumnName: "id" })
  companyLocation!: Relation<City>;

  // Establish One-to-Many Relationship with ContactAddress
  @OneToMany(() => ContactAddress, (contactAddress) => contactAddress.contact, {
    cascade: true,
  })
  contactAddresses: Relation<ContactAddress>;

  // Establish One-to-Many Relationship with QualificationExperience
  @OneToMany(
    () => QualificationExperience,
    (qualificationExperience) => qualificationExperience.contact,
    { cascade: true }
  )
  qualificationExperiences: Relation<QualificationExperience>;

  // Establish One-to-Many Relationship with ProfessionalExperience
  @OneToMany(
    () => ProfessionalExperience,
    (professionalExperience) => professionalExperience.contact,
    { cascade: true }
  )
  professionalExperiences: Relation<ProfessionalExperience>;

  // Establish One-to-Many Relationship with ContactDetails
  @OneToOne(() => ContactDetails, (contactDetails) => contactDetails.contact, {
    cascade: true,
  })
  contactDetails: Relation<ContactDetails>;

  // Establish One-to-Many Relationship with ContactCommunicationDetails
  @OneToMany(
    () => ContactCommunicationDetails,
    (contactCommunicationDetails) => contactCommunicationDetails.contact,
    { cascade: true }
  )
  communicationDetails!: Relation<ContactCommunicationDetails>[];

  @OneToMany(
    () => CompanyContactMap,
    (companyContact: CompanyContactMap) => companyContact.contact,
    { cascade: true }
  )
  companyContactMaps!: Relation<CompanyContactMap>[];

  @OneToMany(() => TpaContact, (tpaContact) => tpaContact.linkedContact, {
    cascade: true,
  })
  tpaContacts!: Relation<TpaContact>[];

  @OneToMany(
    () => InsureContact,
    (insurerContact: InsureContact) => insurerContact.contact,
    { cascade: true }
  )
  insurerContacts!: Relation<InsureContact>[];

  @OneToMany(
    () => BrokerContact,
    (brokerContact: BrokerContact) => brokerContact.contact,
    {
      cascade: true,
    }
  )
  brokerContacts!: Relation<BrokerContact>[];

  @OneToMany(() => ContactDocMap, (contactDocMap) => contactDocMap.contact)
  contactDocMaps?: Relation<ContactDocMap>[];

  @ManyToOne(() => Contact, (contact) => contact.reportingContacts, {
    nullable: true,
  })
  @JoinColumn({ name: "reporting_to_id" })
  reportingTo?: Relation<Contact>;

  @OneToMany(() => Contact, (contact) => contact.reportingTo)
  reportingContacts?: Relation<Contact>[];

  @OneToMany(() => Contact, (contact) => contact.assistant)
  assistantContacts?: Relation<Contact>[];

  constructor(
    salutationLid: number,
    firstName: string,
    lastName: string,
    middleName: string,
    displayName: string,
    linkedInUrl: string,
    companyLocationId: number,
    companyBranchId: number,
    tagLid: number,
    contactTypeLid: number,
    department: string,
    designation: string,
    reportingToId: number,
    relationshipTypeLid: number,
    remarks: string,
    contactRecordTypeLid: number,
    createdBy: number,
    updatedBy: number,
    createdAt: Date,
    updatedAt: Date,
    statusLid: number,
    contactAddresses: Relation<ContactAddress>,
    qualificationExperiences: Relation<QualificationExperience>,
    professionalExperiences: Relation<ProfessionalExperience>,
    contactDetails: Relation<ContactDetails>,
    deletedAt?: Date
  ) {
    this.salutationLid = salutationLid;
    this.firstName = firstName;
    this.lastName = lastName;
    this.middleName = middleName;
    this.displayName = displayName;
    this.linkedInUrl = linkedInUrl;
    this.companyLocationId = companyLocationId;
    this.companyBranchId = companyBranchId;
    this.tagLid = tagLid;
    this.contactTypeLid = contactTypeLid;
    this.department = department;
    this.designation = designation;
    this.reportingToId = reportingToId;
    this.relationshipTypeLid = relationshipTypeLid;
    this.remarks = remarks;
    this.contactRecordTypeLid = contactRecordTypeLid;
    this.statusLid = statusLid;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.contactAddresses = contactAddresses;
    this.qualificationExperiences = qualificationExperiences;
    this.professionalExperiences = professionalExperiences;
    this.contactDetails = contactDetails;
    this.deletedAt = deletedAt;
  }
}
