import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { AiConversationMessage } from './ai-conversation-message.entity';

@Entity({ name: 'ai_prompt_favourite' })
@Index(['messageId', 'createdBy'], { unique: true })
export class AiPromptFavourite {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AiConversationMessage, (msg) => msg.favourites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: AiConversationMessage;

  @Column({ name: 'message_id' })
  messageId: number;

  @Column({ name: 'is_favourite', type: 'int', default: 1 })
  isFavourite: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ name: 'additional_info', type: 'jsonb', default: () => "'{}'" , nullable: true })
  additionalInfo: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;
}
