import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Relation,
} from "typeorm";
import { OpportunityRfpDetailsEntry } from "./opportunity-rfp-details-entry.entity";
import { LookUp } from "./look-up.entity";
import { City } from "./city.entity";
import { Contact } from "./contact.entity";
import { TpaContact } from "./tpa-contact.entity";

@Entity({ name: "opportunity_rfp_tpa_detail" })
export class OpportunityRfpTpaDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "tpa_id", type: "integer", nullable: false })
  tpaId: number;

  @Column({
    name: "tpa_location_id",
    type: "integer",
    nullable: true,
  })
  locationId: number;

  @Column({ name: "tpa_branch", type: "integer", nullable: true })
  branchId: number;

  @Column({
    name: "tpa_contact_id",
    type: "integer",
    nullable: true,
  })
  contactId: number;

  @Column({ name: "preference_type_lid", type: "integer", nullable: false })
  preferenceTypeLid: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz" })
  deletedAt: Date;

  @Column({ name: "created_by", type: "integer", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "integer", nullable: false })
  updatedBy: number;

  @Column({
    name: "opportunity_rfp_details_entry_id",
    type: "integer",
    nullable: false,
  })
  opportunityRfpDetailsEntryId: number;

  @ManyToOne(() => OpportunityRfpDetailsEntry)
  @JoinColumn({ name: "opportunity_rfp_details_entry_id" })
  opportunityRfpDetailsEntry: OpportunityRfpDetailsEntry;

  // @ManyToOne(() => Contact, (contact) => contact.rfpdetailsentrytpaContact, {
  //   eager: true,
  // })
  // @JoinColumn({ name: "tpa_contact_id" })
  // contact!: Relation<Contact>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "preference_type_lid", referencedColumnName: "id" })
  preferenceType?: Relation<LookUp>;

  @OneToOne(() => City)
  @JoinColumn({ name: "tpa_location_id", referencedColumnName: "id" })
  location!: Relation<City>;

  /** Relationship with the InsurerContact entity. */
  @ManyToOne(() => TpaContact, (tpaContact) => tpaContact.tpa, {
    eager: true,
  })
  @JoinColumn({ name: "tpa_id", referencedColumnName: "id" })
  tpaContact!: Relation<TpaContact>;
}
