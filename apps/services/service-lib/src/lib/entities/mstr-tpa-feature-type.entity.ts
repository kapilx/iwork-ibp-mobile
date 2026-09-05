import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { TpaExternalFeatureConfig } from "./tpa-external-feature-config.entity";

@Entity({ name: "mstr_tpa_feature_type" })
export class MstrTpaFeatureType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "key", type: "varchar", length: 50, unique: true })
  key: string;

  @Column({ name: "label", type: "varchar", length: 100 })
  label: string;

  @Column({ name: "description", type: "text", nullable: true })
  description: string | null;

  @Column({ name: "icon", type: "varchar", length: 100, nullable: true })
  icon: string | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean;

  @Column({ name: "display_order", type: "int", default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @OneToMany(() => TpaExternalFeatureConfig, (cfg) => cfg.featureType)
  featureConfigs: Relation<TpaExternalFeatureConfig[]>;
}
