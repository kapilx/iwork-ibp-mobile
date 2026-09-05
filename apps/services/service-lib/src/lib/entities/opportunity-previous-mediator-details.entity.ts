import type { Relation } from "typeorm";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Address } from "./address.entity";
import { City } from "./city.entity";
import { Opportunity } from "./opportunity.entity";

@Entity({ name: "opportunity_previous_mediator_details" })
export class OpportunityPreviousMediatorDetails {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "company_id", type: "int" })
  companyId: number;

  @Column({ name: "location_id", type: "int", nullable: true })
  locationId?: number;

  @Column({ name: "branch_id", type: "int", nullable: true })
  branchId?: number;

  @Column({ name: "mediator_type", type: "varchar" })
  mediatorType: string;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.opportunityId, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  @OneToOne(() => City, (city) => city.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "location_id" })
  location?: Relation<City>;

  @OneToOne(() => Address, (address) => address.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "branch_id" })
  branch?: Relation<Address>;

  constructor(
    id: number,
    opportunityId: number,
    companyId: number,
    mediatorType: string,
    locationId?: number,
    branchId?: number
  ) {
    this.id = id;
    this.opportunityId = opportunityId;
    this.companyId = companyId;
    this.mediatorType = mediatorType;
    this.locationId = locationId;
    this.branchId = branchId;
  }
}
