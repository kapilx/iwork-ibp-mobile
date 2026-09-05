import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AiConversationMessage } from './ai-conversation-message.entity';

@Entity({ name: 'ai_user_feedback' })
export class AiUserFeedback {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AiConversationMessage, (msg) => msg.feedbacks)
  @JoinColumn({ name: 'message_id' })
  message: AiConversationMessage;

  @Column({ name: 'message_id' })
  messageId: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ name: 'additional_info', type: 'jsonb', default: () => "'{}'" })
  additionalInfo: any;

  @Column({ name: 'is_valid_response', type: 'int', nullable: true })
  isValidResponse: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: number;
}
