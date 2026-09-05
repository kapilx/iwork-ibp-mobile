import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Contact } from "./contact.entity";
import type { Relation } from "typeorm";

@Entity("qualification_experience")
export class QualificationExperience {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column({
    name: "name_of_qualification",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  nameOfQualification?: string;

  @Column({
    name: "year_of_qualification",
    type: "int",
    nullable: true,
  })
  yearOfQualification?: number;

  @Column({
    name: "details",
    type: "text",
    nullable: true,
  })
  details?: string;

  @Column({
    name: "university_name",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  universityName?: string;

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

  @ManyToOne(() => Contact, (contact) => contact.qualificationExperiences, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contact_id" })
  contact: Relation<Contact>;

  constructor(
    createdAt: Date,
    updatedAt: Date,
    createdBy: number,
    updatedBy: number,
    contact: Relation<Contact>
  ) {
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.contact = contact;
  }
}
