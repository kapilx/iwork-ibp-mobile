import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Opportunity } from "./opportunity.entity";
import { LookUp } from "./look-up.entity";
import { OpportunityActivityMap } from "./opportunity-activity-map.entity";
import type { Relation } from "typeorm";
import { OpportunityQuoteComparisonReportDocumentMap } from "./opportunity-quote-comparison-report-document-map.entity";

@Entity("opportunity_quote_comparison_report")
export class OpportunityQuoteComparisonReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "opportunity_id", type: "int", nullable: false })
  opportunityId!: number;

  @Column({ name: "activity_id", type: "int", nullable: true })
  activityId!: number;

  @Column({ name: "opportunity_activity_id", type: "int", nullable: true })
  opportunityActivityId!: number;

  @Column({ name: "status_lid", type: "int", nullable: true })
  statusLid!: number;

  @Column({ name: "insurance_market", type: "text", nullable: true })
  insuranceMarket?: string;

  @Column({ name: "client_specific", type: "text", nullable: true })
  clientSpecific?: string;

  @Column({ name: "issues_faced", type: "text", nullable: true })
  issuesFaced?: string;

  @Column({
    name: "industry_benchmarking_comments",
    type: "text",
    nullable: true,
  })
  industryBenchmarkingComments?: string;

  @Column({ name: "analysis_recommendation", type: "text", nullable: true })
  analysisRecommendation?: string;

  @Column({ name: "overall_comments", type: "text", nullable: true })
  overallComments?: string;

  @Column({ name: "remarks", type: "text", nullable: true })
  remarks?: string;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.opportunityId, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  @ManyToOne(() => OpportunityActivityMap, (activityMap) => activityMap.id, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "opportunity_activity_id" })
  opportunityActivity: Relation<OpportunityActivityMap>;

  @ManyToOne(() => LookUp, { onDelete: "SET NULL" })
  @JoinColumn({ name: "status_lid" })
  status: Relation<LookUp>;

  @OneToMany(
    () => OpportunityQuoteComparisonReportDocumentMap,
    (doc) => doc.quoteComparisonReport
  )
  documents?: Relation<OpportunityQuoteComparisonReportDocumentMap[]>;

  constructor(
    opportunityId: number,
    activityId: number,
    opportunityActivityId: number,
    statusLid: number,
    insuranceMarket?: string,
    clientSpecific?: string,
    issuesFaced?: string,
    industryBenchmarkingComments?: string,
    analysisRecommendation?: string,
    overallComments?: string,
    remarks?: string,
    createdBy?: number,
    updatedBy?: number
  ) {
    this.opportunityId = opportunityId;
    this.activityId = activityId;
    this.opportunityActivityId = opportunityActivityId;
    this.statusLid = statusLid;
    this.insuranceMarket = insuranceMarket;
    this.clientSpecific = clientSpecific;
    this.issuesFaced = issuesFaced;
    this.industryBenchmarkingComments = industryBenchmarkingComments;
    this.analysisRecommendation = analysisRecommendation;
    this.overallComments = overallComments;
    this.remarks = remarks;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
