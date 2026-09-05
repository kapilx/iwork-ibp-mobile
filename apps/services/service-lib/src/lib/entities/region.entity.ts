import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('region')
export class Region {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | undefined;

  constructor(name: string, description?: string) {
    this.name = name;
    this.description = description;
  }
}
