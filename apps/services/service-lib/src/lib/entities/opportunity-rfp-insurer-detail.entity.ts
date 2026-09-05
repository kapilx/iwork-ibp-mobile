import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  Relation,
} from "typeorm";
import { OpportunityRfpDetailsEntry } from "./opportunity-rfp-details-entry.entity";
import { LookUp } from "./look-up.entity";
import { City } from "./city.entity";
import { Contact } from "./contact.entity";
import { InsureContact } from "./insurer-contact.entity";

@Entity({ name: "opportunity_rfp_insurer_detail" })
export class OpportunityRfpInsurerDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "insurer_id", type: "integer", nullable: false })
  insurerId: number;

  @Column({
    name: "insurer_location_id",
    type: "integer",
    nullable: true,
  })
  insurerLocationId: number;

  @Column({
    name: "insurer_branch",
    type: "integer",
    nullable: true,
  })
  insurerBranchId: number;

  @Column({
    name: "insurer_contact_id",
    type: "integer",
    nullable: true,
  })
  insurerContactId: number;

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

  /** Relationship with the Contact entity. */
  // @ManyToOne(
  //   () => Contact,
  //   (contact) => contact.rfpdetailsentryinsurerContact,
  //   {
  //     eager: true,
  //   }
  // )
  // @JoinColumn({ name: "insurer_contact_id" })
  // contact!: Relation<Contact>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "preference_type_lid", referencedColumnName: "id" })
  preferenceType?: Relation<LookUp>;

  @OneToOne(() => City)
  @JoinColumn({ name: "insurer_location_id", referencedColumnName: "id" })
  location!: Relation<City>;

  /** Relationship with the InsurerContact entity. */
  @ManyToOne(() => InsureContact, (insurerContact) => insurerContact.insurer)
  @JoinColumn({ name: "insurer_id", referencedColumnName: "insurerId" })
  insurerContact!: Relation<InsureContact>;
}
