import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { MstrEmailTemplate } from './mstr-email-template.entity';
import { Company } from './company.entity';
import { NotificationEventType } from './notification-event-type.entity';

@Entity('company_email_template_map')
export class CompanyEmailTemplateMap {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;

    @Column({ name: 'template_id', type: 'integer', nullable: false })
    templateId: number;

    @Column({ name: 'company_id', type: 'integer', nullable: false })
    companyId: number;

    @Column({ name: 'event_type_id', type: 'integer', nullable: false })
    eventTypeId: number;

    @Column({ name: 'is_active', type: 'boolean', nullable: false, default: true })
    isActive: boolean;

    @Column({ name: 'additional_user_emails', type: 'text', array: true, nullable: true })
    additionalUserEmails: string[];

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
    deletedAt: Date;

    @Column({ name: 'created_by', type: 'integer', nullable: false, default: 0 })
    createdBy: number;

    @Column({ name: 'updated_by', type: 'integer', nullable: false, default: 0 })
    updatedBy: number;

    @ManyToOne(() => MstrEmailTemplate)
    @JoinColumn({ name: 'template_id' })
    template: MstrEmailTemplate;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @ManyToOne(() => NotificationEventType)
    @JoinColumn({ name: 'event_type_id' })
    eventType: NotificationEventType;
}