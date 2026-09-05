import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, UpdateDateColumn,
  JoinColumn
} from 'typeorm';
import { Nudge } from './master-nudge.entity';

@Entity('mstr_nudge_action')
export class NudgeAction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Nudge, (nudge) => nudge.actions)
  @JoinColumn({ name: 'nudge_id' })
  nudgeId: Nudge;

  @Column({ name: 'action_url' })
  actionUrl: string;

  @Column()
  name: string;

  @Column({ name: 'additional_details', nullable: true })
  additionalDetails: string;

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

  constructor(id: number, nudge: Nudge, actionUrl: string, name: string, additionalDetails: string, isEnable: boolean) {
    this.id = id;
    this.nudgeId = nudge;
    this.actionUrl = actionUrl;
    this.name = name;
    this.additionalDetails = additionalDetails;
    this.isEnable = isEnable;
  }
}
