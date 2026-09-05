import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Relation,
} from 'typeorm';
import { Country } from './country.entity';

@Entity('mstr_policy_constraints')
export class MstrPolicyConstraint {
  @PrimaryGeneratedColumn({ name: 'id' })
  id!: number;

  @Column({ name: 'country_id', type: 'int' })
  countryId!: number;

  @Column({ name: 'constraints', type: 'jsonb' })
  constraints!: Record<string, any>;

  @Column({ name: 'created_by', type: 'int' })
  createdBy!: number;

  @Column({ name: 'updated_by', type: 'int' })
  updatedBy!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Country, { eager: true })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Relation<Country>;
}
