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
import { Policy } from "./policy.entity";

@Entity("policy_cover_map")
export class PolicyCoverMap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "policy_id", type: "int", nullable: false })
  policyId: number;

  @Column({ name: "cover_template_id", type: "int", nullable: false })
  coverTemplateId: number;

  @Column({ name: "section_id", type: "int", nullable: true })
  sectionId?: number;

  @Column({ name: "cover_name", type: "varchar", nullable: false })
  coverName: string;

  @Column({ name: "cover_response", type: "json", nullable: true })
  coverResponse: Record<string, any>;

  @Column({ name: "covers_meta", type: "jsonb", nullable: true })
  coversMeta?: Record<string, any>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Policy, (policy) => policy.coverMappings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "policy_id" })
  policy: Relation<Policy>;
}
