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
import { LookUp } from "./look-up.entity";

@Entity("mstr_cover")
export class MstrCover {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "name", type: "varchar", length: 200, nullable: false })
  name: string;

  @Column({ name: "description", type: "text", nullable: true })
  description?: string;

  @Column({ name: "cover_type", type: "int", nullable: true })
  coverTypeLid?: number;

  @Column({ name: "input_type", type: "varchar", length: 100, nullable: true })
  inputType?: string;

  @Column({ name: "input_lov", type: "jsonb", nullable: true })
  inputLov?: Record<string, any>;

  @Column({ name: "covers_meta", type: "jsonb", nullable: true })
  coversMeta?: Record<string, any>;

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

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "cover_type", referencedColumnName: "id" })
  coverType?: Relation<LookUp>;

  constructor(
    name: string,
    description?: string,
    coverTypeLid?: number,
    inputType?: string,
    inputLov?: Record<string, any>,
    coversMeta?: Record<string, any>
  ) {
    this.name = name;
    this.description = description;
    this.coverTypeLid = coverTypeLid;
    this.inputType = inputType;
    this.inputLov = inputLov;
    this.coversMeta = coversMeta;
  }
}
