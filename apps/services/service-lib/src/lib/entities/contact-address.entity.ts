import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Contact } from "./contact.entity";
import { Address } from "./address.entity";
import type { Relation } from "typeorm";
@Entity("contact_address")
export class ContactAddress {
  @PrimaryGeneratedColumn()
  id?: number; // Marked as optional

  @Column({ name: "contact_id", type: "int" })
  contactId: number;

  @Column({ name: "address_id", type: "int" })
  addressId: number;

  @ManyToOne(() => Contact, (contact) => contact.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "contact_id" })
  contact: Relation<Contact>;

  @ManyToOne(() => Address, (address) => address.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "address_id" })
  address: Relation<Address>;

  constructor(contact: Relation<Contact>, address: Relation<Address>) {
    this.contact = contact;
    this.address = address;
  }
}
