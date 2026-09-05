import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn
} from 'typeorm';

@Entity('notification_info')
export class NotificationInfo {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;

    @Column({ name: 'to_recipients', type: 'json', nullable: false })
    toRecipients: string[];

    @Column({ name: 'cc_recipients', type: 'json', nullable: false })
    ccRecipients: string[];

    @Column({ name: 'from_sender', type: 'varchar', length: 255, nullable: true })
    fromSender: string;

    @Column({ name: 'subject', type: 'varchar', length: 500, nullable: false })
    subject: string;

    @Column({
        name: 'notification_type',
        type: 'varchar',
        length: 50,
        nullable: false,
        default: 'NOTIFICATION_CHANNEL_EMAIL'
    })
    notificationType: string;

    @Column({ name: 'template_id', type: 'integer', nullable: true })
    templateId: number;

    @Column({ name: 'variables', type: 'json', nullable: true })
    variables: Record<string, any>;

    @Column({ name: 'rendered_html', type: 'text', nullable: true })
    renderedHtml: string;

    @Column({ name: 'provider', type: 'varchar', length: 100, nullable: true })
    provider: string;

    @Column({ name: 'status', type: 'varchar', length: 50, nullable: false })
    status: string;

    @Column({ name: 'provider_message_id', type: 'varchar', length: 255, nullable: true })
    providerMessageId: string;

    @Column({ name: 'error', type: 'text', nullable: true })
    error: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
    createdAt: Date;

    @Column({ name: 'created_by', type: 'int', nullable: true })
    createdBy: number | null;

    @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
    sentAt: Date;
}
