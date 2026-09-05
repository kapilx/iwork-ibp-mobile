import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  Relation,
} from "typeorm";
import { LookUp } from "./look-up.entity";
import { Opportunity } from "./opportunity.entity";
import { MstrCoverSection } from "./mstr-cover-section.entity";

@Entity("opportunity_cover_map")
export class OpportunityCoverMap {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "opportunity_id", type: "int", nullable: false })
  opportunityId: number;

  @Column({ name: "policy_type_id", type: "int", nullable: false })
  policyTypeId: number;

  @Column({ name: "cover_id", type: "int", nullable: false })
  coverId: number;

  @Column({
    name: "mandate_type",
    type: "varchar",
    length: 50,
    nullable: false,
  })
  mandateType: string;

  @Column({
    name: "approval_required",
    type: "varchar",
    length: 10,
    default: "No",
  })
  approvalRequired: string;

  @Column({ name: "cover_name", type: "varchar", nullable: true })
  coverName?: string;

  @Column({ name: "cover_description", type: "text", nullable: true })
  coverDescription?: string;

  @Column({ name: "display_sequence", type: "int", nullable: true })
  displaySequence?: number;

  @Column({
    name: "display_category",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  displayCategory?: string;

  @Column({ name: "cover_type", type: "int", nullable: true })
  coverTypeLid?: number;

  @Column({ name: "input_type", type: "varchar", length: 100, nullable: true })
  inputType?: string;

  @Column({ name: "input_lov", type: "jsonb", nullable: true })
  inputLov?: Record<string, any>;

  @Column({ name: "covers_meta", type: "jsonb", nullable: true })
  coversMeta?: Record<string, any>;

  @Column({ name: "section_id", type: "int", nullable: true })
  sectionId?: number;

  // Snapshot of the template cutoff. Null = visible in every activity.
  // Read by the per-activity cover visibility filter.
  @Column({
    name: "visible_until_activity_key",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  visibleUntilActivityKey?: string;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt?: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt?: Date;

  // Relationships
  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "cover_type" })
  coverType?: Relation<LookUp>;

  @ManyToOne(() => Opportunity, (opportunity) => opportunity.covers)
  @JoinColumn({ name: "opportunity_id" })
  opportunity?: Relation<Opportunity>;

  @ManyToOne(() => MstrCoverSection)
  @JoinColumn({ name: "section_id", referencedColumnName: "id" })
  section?: Relation<MstrCoverSection>;

  constructor(
    opportunityId: number,
    policyTypeId: number,
    coverId: number,
    mandateType: string,
    approvalRequired: string,
    coverName?: string,
    coverDescription?: string,
    displaySequence?: number,
    displayCategory?: string,
    coverTypeLid?: number,
    inputType?: string,
    inputLov?: Record<string, any>,
    coversMeta?: Record<string, any>,
    sectionId?: number,
    visibleUntilActivityKey?: string
  ) {
    this.opportunityId = opportunityId;
    this.policyTypeId = policyTypeId;
    this.coverId = coverId;
    this.mandateType = mandateType;
    this.approvalRequired = approvalRequired;
    this.coverName = coverName;
    this.coverDescription = coverDescription;
    this.displaySequence = displaySequence;
    this.displayCategory = displayCategory;
    this.coverTypeLid = coverTypeLid;
    this.inputType = inputType;
    this.inputLov = inputLov;
    this.coversMeta = coversMeta;
    this.sectionId = sectionId;
    this.visibleUntilActivityKey = visibleUntilActivityKey;
  }
}
