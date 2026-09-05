import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('mstr_entity_fields_utility_ref')
export class MstrEntityFieldsUtilityRef {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'entity_name', type: 'varchar', length: 50, nullable: false })
    entityName!: string;

    @Column({ name: 'table_name', type: 'varchar', length: 100, nullable: false })
    tableName!: string;

    @Column({ name: 'column_name', type: 'varchar', length: 100, nullable: false })
    columnName!: string;

    @Column({ name: 'display_name', type: 'varchar', length: 100, nullable: false })
    displayName!: string;

    @Column({ name: 'data_type', type: 'varchar', length: 20, nullable: false })
    dataType!: string;

    @Column({ name: 'is_required', type: 'boolean', default: false })
    isRequired!: boolean;

    @Column({ name: 'config', type: 'jsonb', nullable: true })
    config!: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @Column({ name: 'created_by', type: 'integer', nullable: true })
    createdBy!: number;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @Column({ name: 'updated_by', type: 'integer', nullable: true })
    updatedBy!: number;

    @Column({ name: 'entity_id', type: 'integer', nullable: true, default: null })
    entityId!: number | null;
}
