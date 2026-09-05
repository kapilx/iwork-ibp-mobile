import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("mstr_stage")
export class MasterStage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "name", type: "varchar", length: 255, nullable: false })
  name: string;

  @Column({ name: "description", type: "text", nullable: true })
  description: string;

  @Column({ name: "stage_meta", type: "jsonb", default: "{}" })
  stageMeta: Record<string, any>;

  @Column({ name: "created_by", type: "int" })
  createdBy: number;

  @Column({ name: "updated_by", type: "int" })
  updatedBy: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  constructor(
    id: number,
    name: string,
    description: string,
    stageMeta: Record<string, any>,
    createdBy: number,
    updatedBy: number,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.stageMeta = stageMeta;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
