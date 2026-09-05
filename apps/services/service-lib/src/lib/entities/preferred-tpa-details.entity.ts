import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { Tpa } from "./tpa.entity";
import { Contact } from "./contact.entity";
import { BrokingSlipVersionDetails } from "./opportunity-broking-slip-version.entity";

@Entity({ name: "brokingslip_version_preferred_tpa_detail" })
export class PreferredTpaDetails {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "tpa_id", type: "int" })
  tpaId: number;

  @Column({ name: "location_id", type: "int" })
  locationId: number;

  @Column({ name: "branch_id", type: "int" })
  branchId: number;

  @Column({ name: "contact_id", type: "int" })
  contactId: number;

  // Relationships
  @ManyToOne(() => Tpa)
  @JoinColumn({ name: "tpa_id" })
  tpa: Relation<Tpa>;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: "contact_id" })
  contact: Relation<Contact>;

  @ManyToOne(
    () => BrokingSlipVersionDetails,
    (brokingSlip) => brokingSlip.preferredTpaDetails,
    {
      nullable: false,
    }
  )
  @JoinColumn({ name: "opportunity_id" })
  brokingSlip?: Relation<BrokingSlipVersionDetails>;
}
