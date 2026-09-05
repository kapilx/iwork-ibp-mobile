import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Insurer } from './insurer.entity';

@Entity('endorsement_field_mapping')
export class EndorsementFieldMapping {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id!: number;

  @Column({ name: 'insurer_id', type: 'int', unique: true })
  insurerId!: number;

  @Column({ name: 'field_map', type: 'jsonb' })
  fieldMap!: Record<string, string>;

  @ManyToOne(() => Insurer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'insurer_id' })
  insurer?: Relation<Insurer>;

  constructor(insurerId: number, fieldMap: Record<string, string>) {
    this.insurerId = insurerId;
    this.fieldMap = fieldMap;
  }
}
