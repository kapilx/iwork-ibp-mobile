import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("mstr_stage_activity_template")
export class MstrStageActivityTemplate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "policy_type_id", type: "int", nullable: false })
  policyTypeLid!: number;

  @Column({ name: "org_id", type: "int", nullable: false })
  orgId!: number;

  @Column({ name: "stage_id", type: "int", nullable: false })
  stageId!: number;

  @Column({ name: "stage_name", type: "varchar", nullable: false })
  stageName: string;

  @Column({ name: "ro_stage_name", type: "varchar", nullable: false })
  roStageName: string;

  @Column({ name: "activity_id", type: "int", nullable: false })
  activityId!: number;

  @Column({ name: "activity_name", type: "varchar", nullable: false })
  activityName: string;

  @Column({ name: "ro_activity_name", type: "varchar", nullable: false })
  roActivityName: string;

  @Column({
    name: "activity_key",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  activityKey: string;

  @Column({ name: "approval", type: "varchar", length: 10, nullable: true })
  approval!: string;

  @Column({ name: "mandatory", type: "varchar", length: 10, nullable: true })
  mandatory!: string;

  @Column({ name: "opportunity_table", type: "varchar", nullable: true })
  opportunityTable: string;

  @Column({ name: "stage_activity_order", type: "int" })
  stageActivityOrder!: number;

  @Column({ name: "lead_days", type: "int", nullable: true })
  leadDays: number;

  @Column({ name: "created_by", type: "int", nullable: true })
  createdBy?: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  constructor(
    policyTypeId: number,
    orgId: number,
    stageId: number,
    stageName: string,
    roStageName: string,
    activityId: number,
    activityName: string,
    roActivityName: string,
    approval: string,
    mandatory: string,
    activityKey: string,
    opportunityTable: string,
    stageActivityOrder: number,
    leadDays: number,
    createdBy?: number,
    updatedBy?: number
  ) {
    this.policyTypeLid = policyTypeId;
    this.orgId = orgId;
    this.stageId = stageId;
    this.stageName = stageName;
    this.roStageName = roStageName;
    this.activityId = activityId;
    this.activityName = activityName;
    this.roActivityName = roActivityName;
    this.approval = approval;
    this.mandatory = mandatory;
    this.activityKey = activityKey;
    this.opportunityTable = opportunityTable;
    this.stageActivityOrder = stageActivityOrder;
    this.leadDays = leadDays;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
  }
}
