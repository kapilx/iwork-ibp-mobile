import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from "typeorm";
import { Tpa } from "./tpa.entity";
import { Address } from "./address.entity";
import { Exclude } from "class-transformer";
import type { Relation } from "typeorm";
@Entity({ name: "tpa_address" })
export class TpaAddress {
  @PrimaryGeneratedColumn({ name: "id" })
  tpaAddressId!: number;

  @Column({ name: "tpa_id" })
  id!: number;

  @Column({ name: "address_id" })
  addressId?: number;

  @ManyToOne(() => Tpa, (tpa) => tpa.tpaAddresses, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tpa_id" })
  tpa!: Relation<Tpa>;

  @ManyToOne(() => Address, (address) => address.tpaAddresses, { eager: true })
  @JoinColumn({ name: "address_id" })
  address!: Relation<Address>;

  @Exclude()
  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt?: Date;
}
