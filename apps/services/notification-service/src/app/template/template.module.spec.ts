import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NotificationChannelEventTemplateMapping,
  NotificationEventType,
  NotificationChannelType,
  NotificationEventParameterMapping,
  NotificationTemplateApprovalHistory,
  NotificationParameter,
  LookUp,
  Employee,
} from '../../../../service-lib';
import { TemplateController } from './template.controller';
import { TemplateModule } from './template.module';
import { TemplateRepository } from './template.repository';
import { TemplateService } from './template.service';

describe('TemplateModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            NotificationChannelEventTemplateMapping,
            NotificationEventType,
            NotificationChannelType,
            NotificationEventParameterMapping,
            NotificationTemplateApprovalHistory,
            NotificationParameter,
            LookUp,
            Employee,
          ],
          synchronize: true,
        }),
        TemplateModule,
      ],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should have TemplateService available', () => {
    const templateService = module.get<TemplateService>(TemplateService);
    expect(templateService).toBeDefined();
  });

  it('should have TemplateController available', () => {
    const templateController = module.get<TemplateController>(TemplateController);
    expect(templateController).toBeDefined();
  });

  it('should have TemplateRepository available', () => {
    const templateRepository = module.get<TemplateRepository>(TemplateRepository);
    expect(templateRepository).toBeDefined();
  });
});