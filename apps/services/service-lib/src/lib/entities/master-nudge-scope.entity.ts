import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn
} from 'typeorm';

@Entity('mstr_nudge_scope')
export class NudgeScope {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  key: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', default: 1 })
  createdBy: number;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: number;

    constructor(id: number, name: string, description: string, key: string) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.key = key;
    }
}
