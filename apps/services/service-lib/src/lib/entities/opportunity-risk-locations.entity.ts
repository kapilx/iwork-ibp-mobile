import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Opportunity } from "./opportunity.entity";
import type { Relation } from "typeorm";
import { Address } from "./address.entity";

@Entity("opportunity_risk_location_map")
export class OpportunityRiskLocations {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "address_id", type: "int" })
  addressId: number;

  @ManyToOne(
    () => Opportunity,
    (opportunity) => opportunity.opportunityRiskLocations,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "opportunity_id" })
  opportunity!: Relation<Opportunity>;

  @ManyToOne(() => Address, (address) => address.opportunityRiskLocations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "address_id" })
  address!: Relation<Address>;

  constructor(id: number, opportunityId: number, addressId: number) {
    this.id = id;
    this.opportunityId = opportunityId;
    this.addressId = addressId;
  }
}
