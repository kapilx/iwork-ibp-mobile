import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("mstr_service_policy_template_fields")
export class MstrServicePolicyTemplateField {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "field_name", type: "varchar", length: 255, nullable: false })
  fieldName!: string;

  @Column({ name: "field_type", type: "varchar", length: 50, nullable: false })
  fieldType!: string;

  @Column({ name: "claim_type", type: "varchar", length: 100, nullable: false })
  claimType!: string;

  @Column({ name: "entity_type", type: "varchar", length: 100, nullable: false })
  entityType!: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
