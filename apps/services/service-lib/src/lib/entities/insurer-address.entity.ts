import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Address } from "./address.entity";
import { Insurer } from "./insurer.entity";
import type { Relation } from "typeorm";

@Entity({ name: "insurer_address" })
export class InsurerAddress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "insurer_id" })
  insurerId!: number;

  @Column({ name: "address_id" })
  addressId?: number;

  @Column({ name: "contact_id", nullable: true })
  contactId?: number;

  /** Relationship with the Insurer entity.*/
  @ManyToOne(() => Insurer, (insurer) => insurer.insurerAddresses, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "insurer_id" })
  insurer!: Relation<Insurer>;

  /**  Relationship with the Address entity.*/
  @ManyToOne(() => Address, (address) => address.insurerAddresses, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "address_id" })
  address!: Relation<Address>;
}
