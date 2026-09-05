import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { Insurer } from "./insurer.entity";
import { Contact } from "./contact.entity";
import { BrokingSlipVersionDetails } from "./opportunity-broking-slip-version.entity";
import { City } from "./city.entity";

@Entity({ name: "brokingslip_version_preferred_insurer_detail" })
export class PreferredInsurerDetails {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "insurer_id", type: "int" })
  insurerId: number;

  @Column({ name: "location_id", type: "int" })
  insurerLocationId: number;

  @Column({ name: "branch_id", type: "int" })
  insurerBranchId: number;

  @Column({ name: "contact_id", type: "int" })
  insurerContactId: number;

  // Relationships
  @ManyToOne(() => Insurer)
  @JoinColumn({ name: "insurer_id" })
  insurer: Relation<Insurer>;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: "contact_id" })
  contact: Relation<Contact>;

  @ManyToOne(() => City)
  @JoinColumn({ name: "location_id", referencedColumnName: "id" })
  location: Relation<City>;

  @ManyToOne(
    () => BrokingSlipVersionDetails,
    (brokingSlip) => brokingSlip.preferredInsurerDetails,
    { nullable: false }
  )
  @JoinColumn({ name: "opportunity_id" })
  brokingSlip?: Relation<BrokingSlipVersionDetails>;
}
