import { Column, Entity, ManyToOne, PrimaryGeneratedColumn,JoinColumn} from 'typeorm';
import { NotificationParameter } from './notification_parameter.entity';
import { NotificationEventType } from './notification-event-type.entity';

@Entity('notification_event_parameter_mapping')
export class NotificationEventParameterMapping {
  @PrimaryGeneratedColumn({ name: "id", type: "int", nullable: false })
  id!: number;

  @Column({ name: "event_type_id", type: "int" })
  eventTypeId!: number;

  @Column({ name: "parameter_definition_id", type: "int" })
  parameterDefinitionId!: number;

  @Column({ default: false })
  required!: boolean;

  @ManyToOne(() => NotificationEventType)
  @JoinColumn({ name: 'event_type_id' })
  eventType!: NotificationEventType;

  @ManyToOne(() => NotificationParameter)
  @JoinColumn({ name: 'parameter_definition_id' })
  parameterDefinition!: NotificationParameter;
}
