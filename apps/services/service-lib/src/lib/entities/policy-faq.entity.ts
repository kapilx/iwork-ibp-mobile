import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Policy } from "./policy.entity";
import { User } from "./user";

@Entity("policy_faqs")
@Index(["policyId"])
@Index(["category"])
@Index(["isActive"])
export class PolicyFaq {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "policy_id", type: "int" })
  policyId!: number;

  @Column({ name: "category", type: "varchar", length: 100 })
  category!: string;

  @Column({ name: "question", type: "text" })
  question!: string;

  @Column({ name: "answer", type: "text" })
  answer!: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @Column({ name: "created_by", type: "int" })
  createdBy!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number | null;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz", nullable: true })
  updatedAt?: Date | null;

  // Relations
  @ManyToOne(() => Policy, (policy) => policy.id)
  @JoinColumn({ name: "policy_id" })
  policy?: Policy;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({ name: "created_by" })
  createdByUser?: User;

  @ManyToOne(() => User, (user) => user.userId)
  @JoinColumn({ name: "updated_by" })
  updatedByUser?: User;
}