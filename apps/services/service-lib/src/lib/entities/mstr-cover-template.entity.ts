import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { Organisation } from "./organisation.entity";
import { LookUp } from "./look-up.entity";
import { MstrCoverSection } from "./mstr-cover-section.entity";

@Entity("mstr_cover_template")
export class MstrCoverTemplate {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "ref_cover_id", type: "int", nullable: false })
  refCoverId: number;

  @Column({ name: "cover_name", type: "varchar", length: 200, nullable: true })
  coverName?: string;

  @Column({ name: "cover_description", type: "text", nullable: true })
  coverDescription?: string;

  @Column({ name: "mandatory", type: "varchar", length: 10, default: "Yes" })
  mandatory: string;

  @Column({ name: "organization_id", type: "int", nullable: false })
  organizationId: number;

  @Column({ name: "policy_type_id", type: "int", nullable: false })
  policyTypeId: number;

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

  // Per-cover "show until activity" cutoff (activity_key). Null = no limit
  // (visible in every activity). See COVER_BEARING_ACTIVITY_ORDER.
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

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @ManyToOne(() => Organisation, (org) => org.id, { eager: true })
  @JoinColumn({ name: "organization_id" })
  organisation: Relation<Organisation>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "cover_type", referencedColumnName: "id" })
  coverType?: Relation<LookUp>;

  @ManyToOne(() => MstrCoverSection)
  @JoinColumn({ name: "section_id", referencedColumnName: "id" })
  section?: Relation<MstrCoverSection>;

  constructor(
    refCoverId: number,
    coverName: string,
    coverDescription: string,
    mandatory: string,
    organizationId: number,
    policyTypeId: number,
    displaySequence: number,
    displayCategory: string,
    coverTypeLid: number,
    inputType: string,
    inputLov: Record<string, any>,
    coversMeta: Record<string, any>,
    sectionId?: number
  ) {
    this.refCoverId = refCoverId;
    this.coverName = coverName;
    this.coverDescription = coverDescription;
    this.mandatory = mandatory;
    this.organizationId = organizationId;
    this.policyTypeId = policyTypeId;
    this.displaySequence = displaySequence;
    this.displayCategory = displayCategory;
    this.coverTypeLid = coverTypeLid;
    this.inputType = inputType;
    this.inputLov = inputLov;
    this.coversMeta = coversMeta;
    this.sectionId = sectionId;
  }
}
