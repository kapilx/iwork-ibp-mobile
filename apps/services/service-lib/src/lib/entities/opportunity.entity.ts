import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
  DeleteDateColumn,
  OneToOne,
} from "typeorm";
import { OpportunityChallenges } from "./opportunity-challenges.entity";
import { OpportunityClaimExperiences } from "./opportunity-claim-experience.entity";
import { OpportunityCompetitors } from "./opportunity-competitor.entity";
import { OpportunityDocuments } from "./opportunity-document.entity";
import { OpportunityRiskLocations } from "./opportunity-risk-locations.entity";
import type { Relation } from "typeorm";
import { Company } from "./company.entity";
import { LookUp } from "./look-up.entity";
import { OpportunityPreviousPlacementDetails } from "./opportunity-previous-placement-details.entity";
import { OpportunityPreviousMediatorDetails } from "./opportunity-previous-mediator-details.entity";
import { OpportunityContactMap } from "./opportunity-contact-map.entity";
import { OpportunityCoverMap } from "./opportunity-cover.entity";
import { OpportunityActivityMap } from "./opportunity-activity-map.entity";
import { OpportunityActivityParticipants } from "./opportunity-activity-participants.entity";
import { User } from "./user";
import { Policy } from "./policy.entity";
import { Auditable, SkipAudit } from "../audit-history";
import { OpportunityLost } from "./opportunity-lost.entity";

@Entity("opportunity")
@Auditable()
export class Opportunity {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  opportunityId: number;

  @Column({ name: "company_id", type: "int" })
  companyId: number;

  @Column({ name: "estimated_brokerage", type: "float", nullable: true })
  estimatedBrokerage: number;

  @Column({
    name: "estimated_brokerage_percentage",
    type: "float",
    nullable: true,
  })
  estimatedBrokeragePercentage: number;

  @Column({ name: "policy_type_lid", type: "int" })
  policyTypeLid: number;

  @Column({ name: "policy_status_lid", type: "int" })
  policyStatusLid: number;

  @Column({ name: "service_level_lid", type: "int" })
  serviceLevelLid: number;

  @Column({ name: "expiry_date", type: "date" })
  expiryDate: Date;

  @Column({ name: "sum_insured", type: "float" })
  sumInsured: number;

  @Column({ name: "premium_paid", type: "float", nullable: true })
  premiumPaid: number;

  @Column({ name: "status_lid", type: "int" })
  statusLid: number;

  @Column({ name: "estimated_fee", type: "float", nullable: true })
  estimatedFee: number;

  @Column({ name: "opportunity_type_lid", type: "int" })
  opportunityTypeLid: number;

  @Column({ name: "is_policy_mined_lid", type: "int" })
  isPolicyMinedLid: number;

  @Column({
    name: "enabled_for_performance_lid",
    type: "int",
    default: 9401,
  })
  enabledForPerformanceLid: number;

  @Column({ name: "source", type: "varchar" })
  source: string;

  @Column({ name: "source_type_lid", type: "int" })
  opportunitySourceTypeLid: number;

  @Column({ name: "sales_pitch", type: "text", nullable: true })
  salesPitch?: string;

  @Column({ name: "ref_policy_id", type: "int", nullable: true })
  refPolicyId: number;

  @Column({ name: "ref_opportunity_id", type: "int", nullable: true })
  refOpportunityId: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  createdAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  @SkipAudit()
  deletedAt: Date;

  @Column({ name: "created_by", type: "int" })
  @SkipAudit()
  createdBy: number;

  @Column({ name: "updated_by", type: "int" })
  @SkipAudit()
  updatedBy: number;

  @Column({ name: "owner_id", type: "int" })
  ownerId: number;

  @Column({ name: "am_id", type: "int" })
  amId: number;

  @Column({ name: "isg_id", type: "int" })
  isgId: number;

  @Column({ name: "audit_ref_id", type: "int", nullable: false })
  auditRefId!: number;

  @Column({ name: "injected_by", type: "varchar", length: 100, nullable: true })
  injectedBy?: string;

  @Column({ name: "organisation_id", type: "int" })
  organisationId?: number;

  @Column({ name: "sbu_id", type: "int" })
  sbuId?: number;

  @Column({ name: "vertical_id", type: "int" })
  verticalId?: number;

  @Column({ name: "department_id", type: "int" })
  departmentId?: number;

  @Column({ name: "branch_id", type: "int" })
  branchId?: number;
  
  @Column({
    name: "unique_ref_key",
    type: "varchar",
    length: 35,
    nullable: true,
  })
  uniqueRefKey?: string;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({ name: "owner_id", referencedColumnName: "userId" })
  owner?: Relation<User>;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({ name: "am_id", referencedColumnName: "userId" })
  am?: Relation<User>;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({ name: "isg_id", referencedColumnName: "userId" })
  isg?: Relation<User>;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({ name: "created_by", referencedColumnName: "userId" })
  createdByUser?: Relation<User>;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({ name: "updated_by", referencedColumnName: "userId" })
  updatedByUser?: Relation<User>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "source_type_lid", referencedColumnName: "id" })
  opportunitySourceType!: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "opportunity_type_lid", referencedColumnName: "id" })
  opportunityType!: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "is_policy_mined_lid", referencedColumnName: "id" })
  isPolicyMined!: Relation<LookUp>;

  @OneToMany(
    () => OpportunityChallenges,
    (opportunityChallenges) => opportunityChallenges.opportunity,
    {
      cascade: true,
    }
  )
  opportunityChallenges?: Relation<OpportunityChallenges[]>;

  @OneToMany(
    () => OpportunityClaimExperiences,
    (opportunityClaimExperiences) => opportunityClaimExperiences.opportunity,
    {
      cascade: true,
    }
  )
  opportunityClaimExperiences?: Relation<OpportunityClaimExperiences[]>;

  @OneToMany(
    () => OpportunityCompetitors,
    (opportunityCompetitors) => opportunityCompetitors.opportunity,
    {
      cascade: true,
    }
  )
  opportunityCompetitors?: Relation<OpportunityCompetitors[]>;

  @OneToMany(
    () => OpportunityDocuments,
    (opportunityDocuments) => opportunityDocuments.opportunity,
    {
      cascade: true,
    }
  )
  opportunityDocuments?: Relation<OpportunityDocuments[]>;

  @OneToMany(
    () => OpportunityRiskLocations,
    (opportunityRiskLocations) => opportunityRiskLocations.opportunity,
    {
      cascade: true,
    }
  )
  opportunityRiskLocations?: Relation<OpportunityRiskLocations[]>;

  @ManyToOne(() => Company, (company) => company.opportunities, {
    cascade: false,
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "company_id" })
  company?: Relation<Company>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "policy_type_lid" })
  policyType?: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "status_lid" })
  status?: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "policy_status_lid" })
  policyStatus?: Relation<LookUp>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "service_level_lid" })
  serviceLevel?: Relation<LookUp>;

  @OneToOne(() => Policy, (policy) => policy.opportunity, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn({ name: "ref_policy_id" })
  refPolicy?: Relation<Policy>;

  @ManyToOne(() => Opportunity, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "ref_opportunity_id" })
  refOpportunity?: Relation<Opportunity>;

  @OneToMany(
    () => OpportunityPreviousPlacementDetails,
    (previousPlacementDetails) => previousPlacementDetails.opportunity,
    { cascade: true }
  )
  previousPlacementDetails?: Relation<OpportunityPreviousPlacementDetails[]>;

  @OneToMany(
    () => OpportunityPreviousMediatorDetails,
    (previousMediatorDetails) => previousMediatorDetails.opportunity,
    { cascade: true }
  )
  previousMediatorDetails?: Relation<OpportunityPreviousMediatorDetails>[];

  @OneToMany(
    () => OpportunityContactMap,
    (opportunityContactMap) => opportunityContactMap.opportunity,
    { cascade: true }
  )
  opportunityContactMap?: Relation<OpportunityContactMap>[];

  @OneToMany(() => OpportunityCoverMap, (cover) => cover.opportunity, {
    cascade: true,
  })
  covers?: Relation<OpportunityCoverMap>[];

  @OneToMany(
    () => OpportunityActivityMap,
    (opportunityActivityMap) => opportunityActivityMap.opportunity,
    { cascade: true }
  )
  opportunityActivityMap?: Relation<OpportunityActivityMap[]>;

  @OneToMany(() => Policy, (Policy) => Policy.opportunity, { cascade: true })
  policy?: Relation<Policy[]>;

  @OneToMany(
    () => OpportunityActivityParticipants,
    (opportunityActivityParticipants) =>
      opportunityActivityParticipants.opportunity,
    { cascade: true }
  )
  opportunityActivityParticipants?: Relation<OpportunityActivityParticipants[]>;

  @OneToOne(
    () => OpportunityLost,
    (opportunityLost) => opportunityLost.opportunity
  )
  opportunityLost?: Relation<OpportunityLost>;

  constructor(
    opportunityId: number,
    companyId: number,
    estimatedBrokerage: number,
    estimatedBrokeragePercentage: number,
    policyTypeLid: number,
    policyStatusLid: number,
    serviceLevelLid: number,
    expiryDate: Date,
    sumInsured: number,
    premiumPaid: number,
    estimatedFee: number,
    opportunityTypeLid: number,
    isPolicyMinedLid: number,
    source: string,
    opportunitySourceTypeLid: number,
    salesPitch: string,
    ownerId: number,
    refPolicyId: number,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date,
    createdBy: number,
    updatedBy: number
  ) {
    this.opportunityId = opportunityId;
    this.companyId = companyId;
    this.estimatedBrokerage = estimatedBrokerage;
    this.estimatedBrokeragePercentage = estimatedBrokeragePercentage;
    this.policyTypeLid = policyTypeLid;
    this.policyStatusLid = policyStatusLid;
    this.serviceLevelLid = serviceLevelLid;
    this.expiryDate = expiryDate;
    this.sumInsured = sumInsured;
    this.premiumPaid = premiumPaid;
    this.estimatedFee = estimatedFee;
    this.opportunityTypeLid = opportunityTypeLid;
    this.isPolicyMinedLid = isPolicyMinedLid;
    this.source = source;
    this.opportunitySourceTypeLid = opportunitySourceTypeLid;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.salesPitch = salesPitch;
    this.ownerId = ownerId;
    this.refPolicyId = refPolicyId;
  }
}
