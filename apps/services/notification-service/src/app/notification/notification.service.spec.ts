import { Test } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { EmailService } from './email.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationService,
        EmailService,
        {
          provide: NotificationRepository,
          useValue: {},
        },
      ],
    }).compile();
    service = moduleRef.get(NotificationService);
  });

  it('should render template', () => {
    const result = service.renderTemplate('Hello {{name}}', { name: 'John' });
    expect(result).toBe('Hello John');
  });
});
