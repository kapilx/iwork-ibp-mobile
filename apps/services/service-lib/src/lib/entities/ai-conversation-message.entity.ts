import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AiConversation } from './ai-conversation.entity';
import { AiUserFeedback } from './ai-user-feedback.entity';
import { AiPromptFavourite } from './ai-prompt-favourite.entity';

@Entity({ name: 'ai_conversation_message' })
export class AiConversationMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AiConversation, (conv) => conv.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: AiConversation;

  @Column({ name: 'conversation_id' })
  conversationId: number;

  @Column({ name: 'message_type', length: 50, nullable: true })
  messageType: string;

  @Column({ name: 'message_author', length: 50, nullable: true })
  messageAuthor: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @ManyToOne(() => AiConversationMessage, { nullable: true })
  @JoinColumn({ name: 'reference_message_id' })
  referenceMessage: AiConversationMessage;

  @ManyToOne(() => AiConversationMessage, { nullable: true })
  @JoinColumn({ name: 'parent_message_id' })
  parentMessage: AiConversationMessage;

  @Column({ name: 'sql_query', type: 'text', nullable: true })
  sqlQuery: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @OneToMany(() => AiUserFeedback, (f) => f.message)
  feedbacks: AiUserFeedback[];

  @OneToMany(() => AiPromptFavourite, (f) => f.message)
  favourites: AiPromptFavourite[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: number;
}
