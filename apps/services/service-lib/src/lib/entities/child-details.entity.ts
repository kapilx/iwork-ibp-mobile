import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { ContactDetails } from "./contact-details.entity";
import type { Relation } from "typeorm";
import { LookUp } from "./look-up.entity";

@Entity("child_details")
export class ChildDetails {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column({ name: "child_name", type: "varchar", length: 100, nullable: true })
  childName?: string;

  @Column({ name: "child_dob", type: "date", nullable: true })
  childDob?: Date;

  @Column({ name: "child_gender", type: "int", nullable: true })
  childGender?: number;

  @Column({ name: "contact_details_id", type: "int", nullable: false })
  contactDetailsId: number;

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

  @ManyToOne(
    () => ContactDetails,
    (contactDetails) => contactDetails.childDetails,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "contact_details_id" })
  contactDetails: Relation<ContactDetails>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "child_gender", referencedColumnName: "id" })
  childGenderType: Relation<LookUp>;

  constructor(
    childName: string,
    childDob: Date,
    childGender: number,
    contactDetailsId: number,
    createdAt: Date,
    updatedAt: Date,
    createdBy: number,
    updatedBy: number,
    contactDetails: Relation<ContactDetails>,
    childGenderType: Relation<LookUp>
  ) {
    this.childName = childName;
    this.childDob = childDob;
    this.childGender = childGender;
    this.contactDetailsId = contactDetailsId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.contactDetails = contactDetails;
    this.childGenderType = childGenderType;
  }
}
