import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('password_protection_config')
export class PasswordProtectionConfig {
    @PrimaryGeneratedColumn({ comment: 'Unique identifier' })
    id: number;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: false,
        comment: 'Display name of the module (e.g., "Knowledge Central")',
    })
    @Index()
    categoryName: string;

    @Column({
        type: 'varchar',
        length: 50,
        nullable: false,
        unique: true,
        comment: 'Unique key for the module (e.g., "knowledge_central")',
    })
    @Index()
    categoryKey: string;

    @Column({
        type: 'boolean',
        nullable: false,
        default: true,
        comment: 'Flag to enable/disable password protection for this module',
    })
    @Index()
    enablePassword: boolean;

    @Column({
        type: 'varchar',
        length: 20,
        nullable: false,
        default: 'active',
        comment: 'Status: active or inactive',
    })
    @Index()
    status: string;

    @CreateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        comment: 'Record creation timestamp',
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
        comment: 'Record last update timestamp',
    })
    updatedAt: Date;

    @Column({
        type: 'int',
        nullable: true,
        comment: 'User ID who created this record',
    })
    createdBy: number;

    @Column({
        type: 'int',
        nullable: true,
        comment: 'User ID who last updated this record',
    })
    updatedBy: number;
}
