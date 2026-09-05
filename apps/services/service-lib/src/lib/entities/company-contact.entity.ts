import type { Relation } from "typeorm";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Company } from "./company.entity";
import { Contact } from "./contact.entity";
@Entity("company_contact_map")
export class CompanyContactMap {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column({ name: "contact_id", type: "int" })
  contactId: number;

  @Column({ name: "company_id", type: "int" })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.companyContactMaps, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "company_id" })
  company!: Relation<Company>;

  @ManyToOne(() => Contact, (contact) => contact.companyContactMaps, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contact_id" })
  contact!: Relation<Contact>;

  constructor(contactId: number, companyId: number) {
    this.contactId = contactId;
    this.companyId = companyId;
  }
}
