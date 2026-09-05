import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Opportunity } from "./opportunity.entity";
import { LookUp } from "./look-up.entity";
import type { Relation } from "typeorm";
import { OpportunityPolicyDocketDocumentMap } from "./policy-docket-document-map.entity";

@Entity("opportunity_policy_docket")
export class OpportunityPolicyDocket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "opportunity_id", type: "int", nullable: true })
  opportunityId: number;

  @Column({ name: "activity_id", type: "int", nullable: true })
  activityId: number;

  @Column({ name: "opportunity_activity_id", type: "int", nullable: true })
  opportunityActivityId: number;

  @Column({ name: "status_lid", type: "int", nullable: true })
  statusLid: number;

  @Column({ name: "issuance_date", type: "date", nullable: true })
  issuanceDate: Date | null;

  @Column({ name: "held_cover_note", type: "int", nullable: true })
  heldCoverNote: number;

  @Column({ name: "policy_document", type: "int", nullable: true })
  policyDocument: number;

  @Column({ name: "policy_docket", type: "int", nullable: true })
  policyDocket: number;

  @Column({ name: "endorsement", type: "int", nullable: true })
  endorsement: number;

  @Column({ name: "health_claims", type: "int", nullable: true })
  healthClaims: number;

  @Column({ name: "non_health_claims", type: "int", nullable: true })
  nonHealthClaims: number;

  @Column({ name: "mir", type: "int", nullable: true })
  mir: number;

  @Column({ name: "monthly_meeting", type: "int", nullable: true })
  monthlyMeeting: number;

  @Column({ name: "quarterly_meeting", type: "int", nullable: true })
  quarterlyMeeting: number;

  @Column({ name: "renewal_notice", type: "int", nullable: true })
  renewalNotice: number;

  @Column({ name: "data_collection", type: "int", nullable: true })
  dataCollection: number;

  @Column({ name: "remarks", type: "varchar", length: 500, nullable: true })
  remarks: string;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.opportunityId, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "status_lid", referencedColumnName: "id" })
  status?: Relation<LookUp>;

  @OneToMany(
    () => OpportunityPolicyDocketDocumentMap,
    (document) => document.policyDocket,
    {
      cascade: true,
    }
  )
  documents: OpportunityPolicyDocketDocumentMap[];
}
