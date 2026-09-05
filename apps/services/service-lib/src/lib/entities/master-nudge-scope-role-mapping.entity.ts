import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn
} from 'typeorm';

@Entity('mstr_nudge_scope_role_mapping')
export class NudgeScopeRoleMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nudge_id' })
  nudgeId: number;

  @Column({ name: 'scope_id' })
  scopeId: number;

  @Column({ name: 'role_id' })
  roleId: number;

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


    constructor(id: number, nudgeId: number, scopeId: number, roleId: number, isEnable: boolean) { 
        this.id = id;
        this.nudgeId = nudgeId;
        this.scopeId = scopeId;
        this.roleId = roleId;
        this.isEnable = isEnable;
    }
}
