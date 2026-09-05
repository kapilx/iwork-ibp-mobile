import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
  OneToMany,
} from "typeorm";
import { LookUp } from "./look-up.entity";
import { Task } from "./task.entity";
import { OpportunityDataValidationDocumentMap } from "./opportunity-data-validation-document-map.entity";

@Entity("opportunity_data_validation")
export class OpportunityDataValidation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "opportunity_id", type: "int" })
  opportunityId: number;

  @Column({ name: "activity_id", type: "int" })
  activityId: number;

  @Column({ name: "opportunity_activity_id", type: "int" })
  opportunityActivityId: number;

  // @Column({ name: "plan_date", type: "date" })
  // planDate: Date;

  // @Column({ name: "perform_date", type: "date", default: () => "CURRENT_DATE" })
  // performDate: Date;

  @Column({ name: "description", type: "text", nullable: true })
  description: string | null;

  // @Column({ name: "activity_type_lid", type: "int" })
  // activityTypeLid: number;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt: Date;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: false })
  updatedBy: number;

  @Column({ name: "status_lid", type: "int", nullable: false })
  statusLid: number;

  @Column({ name: "task_id", type: "int", nullable: true })
  taskId: number;

  // @ManyToOne(() => LookUp, (lookup) => lookup.id)
  // @JoinColumn({ name: "activity_type_lid", referencedColumnName: "id" })
  // activityType: LookUp;

  @ManyToOne(() => LookUp, (lookup) => lookup.id)
  @JoinColumn({ name: "status_lid", referencedColumnName: "id" })
  status: Relation<LookUp>;

  @ManyToOne(() => Task)
  @JoinColumn({ name: "task_id" })
  task: Relation<Task>;

  @OneToMany(
    () => OpportunityDataValidationDocumentMap,
    (dataValidationDoc) => dataValidationDoc.dataValidation
  )
  dataValidationDocs?: OpportunityDataValidationDocumentMap[];
  constructor(
    // planDate: Date,
    // performDate: Date,
    description: string | null,
    // activityTypeLid: number,
    taskId: number,
    statusLid: number
  ) {
    // this.planDate = planDate;
    // this.performDate = performDate;
    this.description = description;
    // this.activityTypeLid = activityTypeLid;
    this.taskId = taskId;
    this.statusLid = statusLid;
  }
}
