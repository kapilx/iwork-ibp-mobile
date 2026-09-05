import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import {
  UserBizdoneReportStatus,
  UserBizdoneReportType,
} from "../constants";

@Entity("user_bizdone_report")
// Worker claim query: oldest PENDING first.
@Index(["status", "createdAt"])
// "My exports" listing / status polling scoped to the requester.
@Index(["userId", "createdAt"])
export class UserBizdoneReport {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @Column({
    name: "report_type",
    type: "varchar",
    length: 30,
    default: UserBizdoneReportType.BIZDONE,
  })
  reportType!: UserBizdoneReportType;

  @Column({
    name: "status",
    type: "varchar",
    length: 20,
    default: UserBizdoneReportStatus.PENDING,
  })
  status!: UserBizdoneReportStatus;

  // The exact filter set the user applied on the BizDone report (the query the
  // worker replays to regenerate the same report). Stored as-sent, already
  // scoped to what this user is permitted to download.
  @Column({ name: "filters_applied", type: "jsonb", nullable: true })
  filtersApplied?: Record<string, unknown> | null;

  // FileUpload id for the generated workbook, populated on COMPLETED.
  @Column({ name: "document_id", type: "int", nullable: true })
  documentId?: number | null;

  @Column({ name: "started_at", type: "timestamptz", nullable: true })
  startedAt?: Date | null;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt?: Date | null;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage?: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
