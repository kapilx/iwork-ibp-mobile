import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, UpdateDateColumn,
  JoinColumn
} from 'typeorm';
import { Nudge } from './master-nudge.entity';

@Entity('mstr_nudge_parameters')
export class NudgeParameter {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Nudge, (nudge) => nudge.parameters)
  @JoinColumn({ name: 'nudge_id' })
  nudgeId: Nudge;

  @Column()
  parameter: string;

  @Column({ name: 'data_type' })
  dataType: string;

  @Column()
  type: string;

  @Column({ name: 'is_enable', default: true })
  isEnable: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', default: 1 })
  createdBy: number;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: number;

  constructor(id: number, nudge: Nudge, parameter: string, dataType: string, type: string, isEnable: boolean) {
    this.id = id;
    this.nudgeId = nudge;
    this.parameter = parameter;
    this.dataType = dataType;
    this.type = type;
    this.isEnable = isEnable;
  }
}
