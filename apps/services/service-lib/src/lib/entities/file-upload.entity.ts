import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { CompanyDocMap } from "./company-document-map.entity";
import { ContactDocMap } from "./contact-document-map.entity";
import type { Relation } from "typeorm";
import { TaskDocumentMap } from "./task-document-map.entity";
import { NoteDocumentMap } from "./note-document-map.entity";
import { MeetingDocumentMap } from "./meeting-document-map.entity";
import { LookUp } from "./look-up.entity";
import { ClaimActivityDocumentMap } from "./claim-activity-document-map.entity";
import { User } from "./user";
import { OpportunityActivityMap } from "./opportunity-activity-map.entity";
import { OpportunityMeetingDocumentMap } from "./opportunity-meeting-document-map.entity";
import { Company } from "./company.entity";
import { RewardDocMap } from "./reward-doc-map.entity";

@Entity("file_uploads")
export class FileUpload {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "file_key", type: "text", nullable: false })
  fileKey: string; // Renamed from fileUrl

  @Column({ name: "upload_type", type: "varchar", length: 50 })
  uploadType: string;

  @Column({ name: "status", type: "varchar", length: 10, default: "ACTIVE" })
  status: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @Column({ name: "created_by", type: "int" })
  createdBy: number;

  @Column({ name: "updated_by", type: "int" })
  updatedBy: number;

  @ManyToOne(() => User, (user) => user.userId, { onDelete: "CASCADE" })
  @JoinColumn({ name: "updated_by", referencedColumnName: "userId" })
  owner?: Relation<User>;

  @Column({ name: "company_type", type: "varchar" })
  entityType: string;

  @Column({ name: "document_type_lid", type: "number" })
  documentTypeLid: number;

  @Column({ name: "company_id", type: "int" })
  entityId: number;

  @Column({ name: "opportunity_id", type: "int", nullable: true })
  opportunityId?: number;

  @Column({ name: "opportunity_activity_id", type: "int", nullable: true })
  opportunityActivityId?: number;

  @Column({ name: "policy_id", type: "int", nullable: true })
  policyId?: number;

  @Column({ name: "claim_id", type: "int", nullable: true })
  claimId?: number;

  @Column({ name: "claim_activity_id", type: "int", nullable: true })
  claimActivityId?: number;

  @Column({ name: "meeting_id", type: "int", nullable: true })
  meetingId?: number;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt?: Date;

  @Column({ name: "file_size", type: "varchar", length: 32, nullable: true })
  fileSize?: string;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "document_type_lid", referencedColumnName: "id" })
  documentType!: Relation<LookUp>;

  @OneToMany(() => CompanyDocMap, (companyDocMap) => companyDocMap.document)
  companyDocMaps?: Relation<CompanyDocMap>[];

  @OneToMany(() => ContactDocMap, (contactDocMap) => contactDocMap.document)
  contactDocMaps?: Relation<ContactDocMap>[];

  @OneToMany(() => RewardDocMap, (rewardDocMap) => rewardDocMap.document)
  rewardDocMaps?: Relation<RewardDocMap>[];

  @OneToMany(() => TaskDocumentMap, (taskDoc) => taskDoc.document)
  taskDocs?: Relation<TaskDocumentMap>[];

  @OneToMany(() => NoteDocumentMap, (noteDoc) => noteDoc.document)
  noteDocs?: Relation<NoteDocumentMap>[];

  @OneToMany(() => MeetingDocumentMap, (meetingDoc) => meetingDoc.document)
  meetingDocs?: Relation<MeetingDocumentMap>[];

  @OneToOne(() => OpportunityActivityMap)
  @JoinColumn({ name: "opportunity_activity_id", referencedColumnName: "id" })
  opportunityActivity?: Relation<OpportunityActivityMap>[];

  @OneToMany(
    () => OpportunityMeetingDocumentMap,
    (opportunityMeeting) => opportunityMeeting.document
  )
  opportunityMeetingDocs?: Relation<OpportunityMeetingDocumentMap>[];

  @OneToMany(
    () => ClaimActivityDocumentMap,
    (claimActivity) => claimActivity.document
  )
  claimActivityDocs?: Relation<ClaimActivityDocumentMap>[];

  @OneToOne(() => User)
  @JoinColumn({ name: "created_by", referencedColumnName: "userId" })
  createdByUser?: Relation<User>;

  @OneToOne(() => User)
  @JoinColumn({ name: "updated_by", referencedColumnName: "userId" })
  updatedByUser?: Relation<User>;

  @ManyToOne(() => Company)
  @JoinColumn({ name: "company_id", referencedColumnName: "id" })
  company?: Relation<Company>;
}
