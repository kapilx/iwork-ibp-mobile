import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
    Relation,
} from 'typeorm';
import { MappingTemplateColumn } from './mapping-template-column.entity';

@Entity('mapping_template_version')
@Index('ux_active_mapping_template', ['companyId', 'entityName', 'fileDirection'], {
    unique: true,
    where: 'is_active = true',
})
export class MappingTemplateVersion {
    @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
    id!: number;

    @Column({ name: 'company_id', type: 'int' })
    companyId!: number;

    @Column({ name: 'entity_id', type: 'int', nullable: true })
    entityId?: number | null;

    @Column({ name: 'entity_name', type: 'varchar', length: 50 })
    entityName!: string;

    @Column({ name: 'file_direction', type: 'varchar', length: 20 })
    fileDirection!: string;

    @Column({ name: 'template_version_no', type: 'int' })
    templateVersionNo!: number;

    @Column({ name: 'is_active', type: 'boolean', default: false })
    isActive!: boolean;

    @Column({ name: 'change_note', type: 'text', nullable: true })
    changeNote?: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @Column({ name: 'created_by', type: 'int' })
    createdBy!: number;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;

    @Column({ name: 'updated_by', type: 'int' })
    updatedBy!: number;

    @OneToMany(() => MappingTemplateColumn, (column) => column.mappingTemplateVersion, {
        cascade: true,
    })
    columns?: Relation<MappingTemplateColumn[]>;
}
