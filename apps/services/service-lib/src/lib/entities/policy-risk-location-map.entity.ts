import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { Address } from "./address.entity";
import { Policy } from "./policy.entity";

@Entity("policy_risk_location_map")
export class PolicyRiskLocationMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "policy_id", type: "int" })
  policyId: number;

  @Column({ name: "address_id", type: "int" })
  addressId: number;

  @ManyToOne(() => Policy, (policy) => policy.policyRiskLocations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "policy_id" })
  policy!: Relation<Policy>;

  @ManyToOne(() => Address, (address) => address.policyRiskLocations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "address_id" })
  address!: Relation<Address>;

  constructor(id: number, policyId: number, addressId: number) {
    this.id = id;
    this.policyId = policyId;
    this.addressId = addressId;
  }
}
