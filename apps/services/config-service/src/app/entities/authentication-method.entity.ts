import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('authentication_methods')
export class AuthenticationMethod {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'method_code', unique: true, length: 50 })
    methodCode: string; // 'SIMPLE_AUTH', 'GOOGLE_OAUTH', 'MICROSOFT_OAUTH', etc.

    @Column({ name: 'method_name', length: 100 })
    methodName: string; // 'Simple Authentication', 'Google OAuth', etc.

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ type: 'jsonb', nullable: true })
    configuration: Record<string, any>; // Store method-specific config (e.g., OAuth client IDs)

    @Column({ name: 'authentication_method_key', type: 'text', nullable: true })
    authenticationMethodKey: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
