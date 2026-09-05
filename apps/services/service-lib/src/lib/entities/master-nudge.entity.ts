import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { NudgeAction } from './master-nudge-action.entity';
import { NudgeParameter } from './master-nudge-parameters.entity';
import { Organisation } from './organisation.entity';

@Entity('mstr_nudge')
export class Nudge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'nudge_template', nullable: true })
  nudgeTemplate: string;

  @Column({ nullable: true })
  prompt: string;

  @Column({ name: 'endpoint_url', nullable: true })
  endpointUrl: string;

  @Column({ nullable: true })
  method: string;

  @Column({ name: 'is_enable', default: true })
  isEnable: boolean;

  @Column( { name: 'icon_key', nullable: true })
  iconKey: string;

  @Column( { name: 'background_color', nullable: true })
  backgroundColor: string;

  @Column( { name: 'template_type', nullable: true })
  templateType: string; // static or dynamic
  
  // 🔥 FOREIGN KEY RELATIONSHIP
  @ManyToOne(() => Organisation)
  @JoinColumn({ name: 'org_id' })
  organisation: Organisation;

  @Column({ name: 'org_id' })
  orgId: number;

  @Column()
  key: string;

  @OneToMany(() => NudgeAction, (action) => action.nudgeId)
  actions: NudgeAction[];

  @OneToMany(() => NudgeParameter, (param) => param.nudgeId)
  parameters: NudgeParameter[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', default: 1 })
  createdBy: number;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: number;


  constructor(id: number, name: string, description: string, nudgeTemplate: string, prompt: string, endpointUrl: string, method: string, isEnable: boolean, orgId: number, key: string) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.nudgeTemplate = nudgeTemplate;
    this.prompt = prompt;
    this.endpointUrl = endpointUrl;
    this.method = method;
    this.isEnable = isEnable;
    this.orgId = orgId;
    this.key = key;
  }
}


  