import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("industry_segment")
export class IndustrySegment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @Column({ name: "created_by", type: "varchar", length: 255 })
  createdBy: string;

  @Column({ name: "updated_by", type: "varchar", length: 255 })
  updatedBy: string;

  constructor(
    id: number,
    name: string,
    createdBy: string,
    updatedBy: string,
    description: string
  ) {
    this.id = id;
    this.name = name;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.description = description;
  }
}
