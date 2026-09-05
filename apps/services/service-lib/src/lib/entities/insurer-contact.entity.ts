import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Insurer } from "./insurer.entity";
import { Contact } from "./contact.entity";
import type { Relation } from "typeorm";

@Entity({ name: "insurer_contact" })
export class InsureContact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "insurer_id" })
  insurerId!: number;

  @Column({ name: "contact_id" })
  contactId!: number;

  /** Relationship with the Insurer entity. */
  @ManyToOne(() => Insurer, (insurer) => insurer.insurerContacts, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "insurer_id" })
  insurer!: Relation<Insurer>;

  /** Relationship with the Contact entity. */
  @ManyToOne(() => Contact, (contact) => contact.insurerContacts, {
    eager: true,
  })
  @JoinColumn({ name: "contact_id" })
  contact!: Relation<Contact>;
}
