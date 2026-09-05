import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  OneToOne,
  OneToMany,
} from "typeorm";
import { LookUp } from "./look-up.entity";
import { ChildDetails } from "./child-details.entity";
import { Contact } from "./contact.entity";
import type { Relation } from "typeorm";
@Entity("contact_details")
export class ContactDetails {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column({ name: "gender", type: "int", nullable: true })
  gender?: number;

  @Column({ name: "date_of_birth", type: "date", nullable: true })
  dateOfBirth?: Date;

  @Column({
    name: "favourite_food",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  favouriteFood?: string;

  @Column({
    name: "favourite_restaurant",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  favouriteRestaurant?: string;

  @Column({ name: "personal_history", type: "text", nullable: true })
  personalHistory?: string;

  @Column({ name: "major_achievements", type: "text", nullable: true })
  majorAchievements?: string;

  @Column({ name: "marital_status", type: "int", nullable: true })
  maritalStatus?: number;

  @Column({ name: "date_of_wedding", type: "date", nullable: true })
  dateOfWedding?: Date;

  @Column({ name: "spouse_name", type: "varchar", length: 100, nullable: true })
  spouseName?: string;

  @Column({ name: "spouse_date_of_birth", type: "date", nullable: true })
  spouseDateOfBirth?: Date;

  @Column({ name: "spouse_working_status", type: "int", nullable: true })
  spouseWorkingStatus?: number;

  @Column({
    name: "working_company",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  workingCompany?: string;

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

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy: number;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "gender", referencedColumnName: "id" })
  genderType!: LookUp;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "spouse_working_status", referencedColumnName: "id" })
  spouseWorkingStatusType!: LookUp;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "marital_status", referencedColumnName: "id" })
  maritalStatusType!: LookUp;

  @OneToOne(() => Contact, (contact) => contact.contactDetails, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contact_id" })
  contact: Relation<Contact>;

  // Establish One-to-Many Relationship with ContactDetails
  @OneToMany(
    () => ChildDetails,
    (childDetails) => childDetails.contactDetails,
    {
      cascade: true,
    }
  )
  childDetails: Relation<ChildDetails>;

  constructor(
    createdAt: Date,
    updatedAt: Date,
    createdBy: number,
    updatedBy: number,
    contact: Relation<Contact>,
    childDetails: Relation<ChildDetails>
  ) {
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.contact = contact;
    this.childDetails = childDetails;
  }
}
