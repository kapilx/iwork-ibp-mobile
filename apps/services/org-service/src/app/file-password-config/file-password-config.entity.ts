import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('file_password_config')
export class FilePasswordConfig {
    @PrimaryGeneratedColumn({ comment: 'Unique identifier' })
    id!: number;

    @Column({
        name: 'password_type',
        type: 'enum',
        enum: ['custom', 'user_details'],
        nullable: false,
        default: 'custom',
        comment: 'Type of password generation: custom or user_details',
    })
    passwordType!: 'custom' | 'user_details';

    @Column({
        name: 'selected_country_id',
        type: 'int',
        nullable: false,
        comment: 'ID of the selected country/organisation',
    })
    selectedCountryId!: number;

    @Column({
        name: 'organisation_key',
        type: 'varchar',
        length: 255,
        nullable: false,
        comment: 'Key identifier for the organisation',
    })
    organisationKey!: string;

    @Column({
        name: 'custom_password',
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: 'Custom password when passwordType is custom',
    })
    customPassword?: string;

    @Column({
        name: 'user_fields',
        type: 'simple-json',
        nullable: true,
        comment: 'Array of user fields to use when passwordType is user_details (e.g., ["firstName", "email"])',
    })
    userFields?: string[];

    @Column({
        name: 'created_by',
        type: 'int',
        nullable: false,
        comment: 'User ID who created the configuration',
    })
    createdBy!: number;

    @Column({
        name: 'updated_by',
        type: 'int',
        nullable: true,
        comment: 'User ID who last updated the configuration',
    })
    updatedBy?: number;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        comment: 'Record creation timestamp',
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
        comment: 'Record last update timestamp',
    })
    updatedAt!: Date;
}
