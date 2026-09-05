import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("mstr_stage")
export class MstrStage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ name: "ro_name", type: "varchar", length: 255 })
  roName: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "stage_meta", type: "jsonb", nullable: true })
  stageMeta: Record<string, any>;

  @Column({ name: "ref_role_key", type: "varchar", length: 255 })
  refRoleKey: string;

  @Column({ name: "created_by", type: "int" })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  constructor(
    name: string,
    roName: string,
    description: string,
    stageMeta: Record<string, any>,
    createdBy: number,
    updatedBy: number
  ) {
    this.name = name;
    this.roName = roName;
    this.description = description;
    this.stageMeta = stageMeta;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
