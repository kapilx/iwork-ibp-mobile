import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { PolicyEnrollmentEmployee } from './policy-enrollment-employee.entity';

export enum TicketCategory {
  BILLING = 'billing',
  CLAIMS = 'claims',
  POLICY = 'policy',
  ENROLLMENT = 'enrollment',
  OTHER = 'other',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('raise_ticket')
@Index('idx_raise_ticket_employee_id', ['employeeId'])
@Index('idx_raise_ticket_status', ['status'])
@Index('idx_raise_ticket_category', ['category'])
@Index('idx_raise_ticket_created_at', ['createdAt'])
export class RaiseTicket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'employee_id', nullable: true })
  employeeId: number | null;

  @Column({ name: 'is_anonymous_user', type: 'boolean', default: false })
  isAnonymousUser: boolean;

  @Column({ name: 'ticket_id', length: 50, unique: true })
  ticketId: string;

  @Column({
    type: 'enum',
    enum: TicketCategory,
    enumName: 'ticket_category_enum', //  important for postgres
  })
  category: TicketCategory;

  @Column({ name: 'mail_id', length: 255 })
  mailId: string;

  @Column({ name: 'escalation_description', type: 'text' })
  escalationDescription: string;

  @Column({ name: 'document_ids', type: 'jsonb', nullable: true }) //  jsonb
  documentIds: number[] | null;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    enumName: 'ticket_status_enum', // 
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    enumName: 'ticket_priority_enum', // 
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @Column({ name: 'created_by', type: 'integer', nullable: true })
  createdBy: number | null = null;

  @Column({ name: 'assigned_to', type: 'integer', nullable: true })
  assignedTo: number | null;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'comment', type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  //  Relation
  @ManyToOne(() => PolicyEnrollmentEmployee, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'employee_id' })
  employee?: PolicyEnrollmentEmployee | null;

  //  Ticket ID generator
  @BeforeInsert()
  generateTicketId() {
    if (!this.ticketId) {
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      const randomSuffix = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');

      this.ticketId = `TKT-${dateStr}-${randomSuffix}`;
    }
  }
}
