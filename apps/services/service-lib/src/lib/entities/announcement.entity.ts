import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Organisation } from "./organisation.entity";

@Entity("announcement")
export class Announcement {
  @PrimaryGeneratedColumn({ name: "id", type: "int", nullable: false })
  id: number;

  @Column({ name: "organisation_id", type: "int", nullable: false })
  organisationId: number;

  @Column({ name: "title", type: "varchar", length: 255, nullable: false })
  title: string;

  @Column({ name: "description", type: "text", nullable: true })
  description: string;

  @Column({ name: "expiry_date", type: "date", nullable: false })
  expiryDate: Date;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
  })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy: number;

  // Relationships
  @ManyToOne(() => Organisation, {
    cascade: false,
    nullable: false,
  })
  @JoinColumn({ name: "organisation_id" })
  organisation: Relation<Organisation>;

  constructor(
    organisationId: number,
    title: string,
    description: string,
    expiryDate: Date,
    createdBy: number,
    updatedBy: number
  ) {
    this.organisationId = organisationId;
    this.title = title;
    this.description = description;
    this.expiryDate = expiryDate;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
