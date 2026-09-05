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
@Entity("professional_experience")
export class ProfessionalExperience {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column({ name: "from_date", type: "date", nullable: true })
  fromDate?: Date;

  @Column({ name: "to_date", type: "date", nullable: true })
  toDate?: Date;

  @Column({ name: "company", type: "varchar", length: 100, nullable: true })
  company?: string;

  @Column({ name: "designation", type: "varchar", length: 100, nullable: true })
  designation?: string;

  @Column({ name: "department", type: "varchar", length: 100, nullable: true })
  department?: string;

  @Column({ name: "details", type: "text", nullable: true })
  details?: string;

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

  @ManyToOne(() => Contact, (contact) => contact.professionalExperiences, {
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
