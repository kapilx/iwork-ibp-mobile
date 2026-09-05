import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Tpa } from "./tpa.entity";
import { Contact } from "./contact.entity";
import type { Relation } from "typeorm";
@Entity({ name: "tpa_contact" })
export class TpaContact {
  @PrimaryGeneratedColumn({ name: "id" })
  tpaContactId!: number;

  @Column({ name: "tpa_id" })
  id!: number;

  @Column({ name: "contact_id" })
  contactId!: number;

  @ManyToOne(() => Tpa, (tpa) => tpa.contacts)
  @JoinColumn({ name: "tpa_id" })
  tpa!: Relation<Tpa>;

  @ManyToOne(() => Contact, (contact) => contact.tpaContacts, { eager: true })
  @JoinColumn({ name: "contact_id" })
  linkedContact!: Relation<Contact>;
}
