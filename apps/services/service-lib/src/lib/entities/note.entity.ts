import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Auditable, SkipAudit } from "../audit-history";
import { Company } from "./company.entity";
import { NoteDocumentMap } from "./note-document-map.entity";
import { OpportunityActivityMap } from "./opportunity-activity-map.entity";
import { Opportunity } from "./opportunity.entity";

@Entity({ name: "note" })
@Auditable()
export class Note {
  @PrimaryGeneratedColumn({ name: "id", type: "int", nullable: false })
  id: number;

  @Column({ name: "company_id", type: "int", nullable: true })
  companyId: number;

  @Column({ name: "opportunity_id", type: "int", nullable: true })
  opportunityId: number;

  @Column({ name: "activity_id", type: "int", nullable: true })
  activityId: number;

  @Column({ name: "title", type: "varchar", length: 100, nullable: false })
  title: string;

  @Column({ name: "description", type: "text", nullable: false })
  description?: string;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  createdAt?: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  @SkipAudit()
  updatedAt?: Date;

  @DeleteDateColumn({
    name: "deleted_at",
    type: "timestamptz",
    nullable: true,
  })
  @SkipAudit()
  deletedAt?: Date | null;

  @Column({ name: "created_by", type: "int", nullable: false })
  @SkipAudit()
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  @SkipAudit()
  updatedBy: number;

  // Relationships
  @ManyToOne(() => Company)
  @JoinColumn({ name: "company_id" })
  company: Relation<Company>;

  @ManyToOne(() => Opportunity)
  @JoinColumn({ name: "opportunity_id" })
  opportunity: Relation<Opportunity>;

  // @Get("activities/:opportunityId") for fetching activities
  @ManyToOne(() => OpportunityActivityMap)
  @JoinColumn({ name: "activity_id" })
  activity: Relation<OpportunityActivityMap>;

  @OneToMany(() => NoteDocumentMap, (noteDoc) => noteDoc.note)
  noteDocs?: NoteDocumentMap[];
}
