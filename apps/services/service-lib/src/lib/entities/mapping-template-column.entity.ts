import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Relation,
} from 'typeorm';
import { MappingTemplateVersion } from './mapping-template-version.entity';

@Entity('mapping_template_columns')
export class MappingTemplateColumn {
    @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
    id!: number;

    @Column({ name: 'mapping_template_version_id', type: 'int' })
    mappingTemplateVersionId!: number;

    @Column({ name: 'source_column_id', type: 'int' })
    sourceColumnId!: number;

    @Column({ name: 'source_column_name', type: 'varchar', length: 150 })
    sourceColumnName!: string;

    @Column({ name: 'target_table_name', type: 'varchar', length: 100 })
    targetTableName!: string;

    @Column({ name: 'target_column_name', type: 'varchar', length: 100 })
    targetColumnName!: string;

    @Column({ name: 'transformation_config', type: 'jsonb' })
    transformationConfig!: Record<string, unknown>;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @Column({ name: 'created_by', type: 'int' })
    createdBy!: number;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;

    @Column({ name: 'updated_by', type: 'int' })
    updatedBy!: number;

    @ManyToOne(() => MappingTemplateVersion, (version) => version.columns, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'mapping_template_version_id' })
    mappingTemplateVersion?: Relation<MappingTemplateVersion>;
}
