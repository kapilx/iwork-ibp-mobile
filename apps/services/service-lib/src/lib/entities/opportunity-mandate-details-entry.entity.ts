import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Relation,
} from "typeorm";
import { Opportunity } from "./opportunity.entity";
import { MstrActivity } from "./mstr-activity.entity";
import { Company } from "./company.entity";
import { LookUp } from "./look-up.entity";
import { OpportunityMandateDetailsContactMap } from "./opportunity-mandate-details-contact-map.entity";
import { OpportunityMandateDetailsDocumentMap } from "./opportunity-mandate-details-document-map.entity";

@Entity("opportunity_mandate_details_entry")
export class OpportunityMandateDetailsEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "opportunity_id", type: "int", nullable: false })
  opportunityId: number;

  @Column({ name: "activity_id", type: "int", nullable: false })
  activityId: number;

  @Column({ name: "company_id", type: "int", nullable: true })
  companyId: number;

  @Column({
    name: "activity_date",
    type: "date",
    default: () => "CURRENT_DATE",
  })
  activityDate: Date;

  @Column({ name: "plan_date", type: "date", nullable: true })
  planDate: Date;

  @Column({ name: "mandate_type_lid", type: "int", nullable: true })
  mandateTypeLid: number | null;

  @Column({ name: "valid_from", type: "date", nullable: true })
  validFrom: Date | null;

  @Column({ name: "valid_to", type: "date", nullable: true })
  validTo: Date | null;

  @Column({ name: "compensation_payable", type: "numeric", nullable: true })
  compensationPayable: number | null;

  @Column({ name: "compensation_type_lid", type: "int", nullable: true })
  compensationTypeLid: number | null;

  @Column({ name: "issued_on", type: "date", nullable: true })
  issuedOn: Date | null;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy: number;

  @Column({ name: "status_lid", type: "int", nullable: true })
  statusLid: number;

  @Column({ name: "opportunity_activity_id", type: "int", nullable: true })
  opportunityActivityId: number;

  @ManyToOne(() => Opportunity)
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  @ManyToOne(() => MstrActivity)
  @JoinColumn({ name: "activity_id" })
  activity: Relation<MstrActivity>;

  @ManyToOne(() => Company)
  @JoinColumn({ name: "company_id" })
  company: Relation<Company>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "mandate_type_lid" })
  mandateType: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "compensation_type_lid" })
  compensationType: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "status_lid" })
  status: Relation<LookUp>;

  @OneToMany(
    () => OpportunityMandateDetailsContactMap,
    (contactMap) => contactMap.mandate,
    { cascade: true }
  )
  mandateDetailsContacts: Relation<OpportunityMandateDetailsContactMap>[];

  @OneToMany(
    () => OpportunityMandateDetailsDocumentMap,
    (documentMap) => documentMap.mandate,
    { cascade: true }
  )
  mandateDetailsDocuments: Relation<OpportunityMandateDetailsDocumentMap>[];

  constructor(
    id: number,
    opportunityId: number,
    activityId: number,
    companyId: number,
    activityDate: Date,
    planDate: Date,
    mandateTypeLid: number,
    validFrom: Date,
    validTo: Date,
    compensationPayable: number,
    compensationTypeLid: number,
    issuedOn: Date,
    remarks: string,
    statusLid: number,
    createdAt: Date,
    updatedAt: Date,
    createdBy: number,
    updatedBy: number
  ) {
    this.id = id;
    this.opportunityId = opportunityId;
    this.activityId = activityId;
    this.companyId = companyId;
    this.activityDate = activityDate;
    this.planDate = planDate;
    this.mandateTypeLid = mandateTypeLid;
    this.validFrom = validFrom;
    this.validTo = validTo;
    this.compensationPayable = compensationPayable;
    this.compensationTypeLid = compensationTypeLid;
    this.issuedOn = issuedOn;
    this.remarks = remarks;
    this.statusLid = statusLid;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
