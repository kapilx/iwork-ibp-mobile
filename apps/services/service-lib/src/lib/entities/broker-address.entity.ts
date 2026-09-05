import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Address } from "./address.entity";
import { Broker } from "./broker.entity";
import type { Relation } from "typeorm";

@Entity({ name: "broker_address" })
export class BrokerAddress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "broker_id" })
  brokerId!: number;

  @Column({ name: "address_id" })
  addressId?: number;

  /** Relationship with the Broker entity */
  @ManyToOne(() => Broker, (broker) => broker.brokerAddresses, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "broker_id" })
  broker!: Relation<Broker>;

  /** Relationship with the Address entity */
  @ManyToOne(() => Address, (address) => address.brokerAddresses, {
    eager: true,
  })
  @JoinColumn({ name: "address_id" })
  address!: Relation<Address>;
}
