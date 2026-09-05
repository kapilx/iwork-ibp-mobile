import type { Relation } from "typeorm";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Address } from "./address.entity";
import { Company } from "./company.entity";

@Entity("company_address")
export class CompanyAddress {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id!: number;

  @Column({ name: "is_primary", default: false })
  isPrimary: boolean; // Optional: To mark an address as primary for the company

  @Column({ name: "company_id", type: "int" })
  companyId: number;

  @Column({ name: "address_id", type: "int" })
  addressId: number;

  @ManyToOne(() => Company, (company) => company.companyAddresses)
  @JoinColumn({ name: "company_id" })
  company: Relation<Company>;

  @ManyToOne(() => Address, (address) => address.companyAddresses, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "address_id" })
  address: Relation<Address>;

  constructor(
    company: Relation<Company>,
    address: Relation<Address>,
    isPrimary: boolean
  ) {
    this.company = company;
    this.address = address;
    this.isPrimary = isPrimary;
  }
}
