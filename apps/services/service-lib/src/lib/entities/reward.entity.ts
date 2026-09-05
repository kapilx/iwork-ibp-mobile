import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { Auditable, SkipAudit } from "../audit-history";
import { Insurer } from "./insurer.entity";
import { LookUp } from "./look-up.entity";
import { RewardBusinessMonth } from "./reward-business-month.entity";
import { RewardDocMap } from "./reward-doc-map.entity";

@Entity({ name: "reward" })
@Auditable()
export class Reward {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  // Lookup REWARD_CATEGORY_*. Phase 1 always Generic; Specific reserved (BR-001). Immutable after save.
  @Column({ name: "reward_category_lid", type: "int", nullable: false })
  rewardCategoryLid!: number;

  // Lookup REWARD_TYPE_*. Hidden, stored only; always Fixed in Phase 1, Percentage in Phase 2 (BR-007).
  @Column({ name: "reward_type_lid", type: "int", nullable: false })
  rewardTypeLid!: number;

  // Customer/payee = insurer (BR-003); active or inactive (BR-004).
  @Column({ name: "insurer_id", type: "int", nullable: false })
  insurerId!: number;

  // Owning organisation (captured from creator). Used to scope listing/KPIs/report;
  // leadership/super users bypass the scope (see ScopeService.hasLeadershipRole).
  // Nullable so pre-existing rows are unaffected.
  @Column({ name: "organisation_id", type: "int", nullable: true })
  organisationId?: number;

  // Income Month is derived from this, not stored (BR-006).
  @Column({ name: "date_of_income", type: "date", nullable: false })
  dateOfIncome!: string;

  // Cumulative across selected business months (BR-005); positive only (BR-016).
  @Column({ name: "reward_amount", type: "numeric", precision: 15, scale: 2, nullable: false })
  rewardAmount!: string;

  @Column({ name: "remarks", type: "varchar", length: 500, nullable: true })
  remarks?: string;

  @Column({ name: "created_by", type: "int" })
  @SkipAudit()
  createdBy!: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  @SkipAudit()
  updatedBy?: number;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  @SkipAudit()
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  @SkipAudit()
  updatedAt!: Date;

  // Soft-delete = Inactive (BR-010).
  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  @SkipAudit()
  deletedAt?: Date;

  @OneToOne(() => Insurer)
  @JoinColumn({ name: "insurer_id", referencedColumnName: "id" })
  insurer!: Relation<Insurer>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "reward_category_lid", referencedColumnName: "id" })
  rewardCategory!: Relation<LookUp>;

  @OneToOne(() => LookUp)
  @JoinColumn({ name: "reward_type_lid", referencedColumnName: "id" })
  rewardType!: Relation<LookUp>;

  @OneToMany(() => RewardBusinessMonth, (bm) => bm.reward, {
    cascade: true,
    orphanedRowAction: "delete",
  })
  businessMonths!: Relation<RewardBusinessMonth[]>;

  @OneToMany(() => RewardDocMap, (map) => map.reward, {
    cascade: true,
    orphanedRowAction: "delete",
  })
  docMaps!: Relation<RewardDocMap[]>;
}
