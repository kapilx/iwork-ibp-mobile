import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { LookUp } from "./look-up.entity";
import { OrgSbu } from "./org-sbu.entity";

@Entity("sbu_ro_policy_type_suppression")
export class SbuRoPolicyTypeSuppression {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "sbu_id", type: "int", nullable: false })
  sbuId: number;

  @Column({ name: "policy_type_lid", type: "int", nullable: false })
  policyTypeLid: number;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => OrgSbu)
  @JoinColumn({ name: "sbu_id", referencedColumnName: "id" })
  sbu: Relation<OrgSbu>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "policy_type_lid", referencedColumnName: "id" })
  policyType: Relation<LookUp>;
}
