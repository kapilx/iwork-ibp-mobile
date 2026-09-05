import { TraceIdService } from '../../../../service-lib';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateTemplateDto } from './dto/create-template.dto';
import { TemplateResponseDto } from './dto/template-response.dto';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';
import { ApprovalStatusEnum, TemplateStatusEnum } from '../../../../service-lib/src/lib/constants';

describe('TemplateController', () => {
  let controller: TemplateController;
  let service: TemplateService;

  const mockTemplateService = {
    createTemplate: jest.fn(),
    getTemplate: jest.fn(),
    getTemplates: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    updateApprovalWorkflow: jest.fn(),
    getTemplateApprovalHistory: jest.fn(),
  };

  const mockTraceIdService = {
    traceId: 'test-trace-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateController],
      providers: [
        { provide: TemplateService, useValue: mockTemplateService },
        { provide: TraceIdService, useValue: mockTraceIdService },
      ],
    }).compile();

    controller = module.get<TemplateController>(TemplateController);
    service = module.get<TemplateService>(TemplateService);
    traceIdService = module.get<TraceIdService>(TraceIdService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTemplate', () => {
    it('should create a template successfully', async () => {
      const createTemplateDto: CreateTemplateDto = {
        name: 'Test Template',
        channelTypeId: 1,
        body: 'Hello {{firstName}}!',
        subject: 'Welcome',
      };

      const expectedResponse: TemplateResponseDto = {
        id: 1,
        name: 'Test Template',
        channelType: 'email',
        body: 'Hello {{firstName}}!',
        subject: 'Welcome',
        approvalStatus: ApprovalStatusEnum.DRAFT,
        status: TemplateStatusEnum.ACTIVE,
        createdBy: 0,
        updatedBy: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTemplateService.createTemplate.mockResolvedValue(expectedResponse);

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await controller.createTemplate(createTemplateDto, mockResponse);

      expect(service.createTemplate).toHaveBeenCalledWith(createTemplateDto);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should handle create template errors', async () => {
      const createTemplateDto: CreateTemplateDto = {
        name: 'Test Template',

        channelTypeId: 1,
        body: 'Hello {{firstName}}!',
      };

      const error = new Error('Validation failed');
      (error as Error & { status?: number })['status'] = 400;
      mockTemplateService.createTemplate.mockRejectedValue(error);

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await controller.createTemplate(createTemplateDto, mockResponse);

      expect(service.createTemplate).toHaveBeenCalledWith(createTemplateDto);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('getTemplate', () => {
    it('should retrieve a template successfully', async () => {
      const templateId = 1;
      const expectedResponse: TemplateResponseDto = {
        id: 1,
        name: 'Test Template',
        channelType: 'email',
        body: 'Hello {{firstName}}!',
        subject: 'Welcome',
        approvalStatus: ApprovalStatusEnum.APPROVED,
        status: TemplateStatusEnum.ACTIVE,
        createdBy: 1,
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTemplateService.getTemplate.mockResolvedValue(expectedResponse);

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await controller.getTemplate(templateId, mockResponse);

      expect(service.getTemplate).toHaveBeenCalledWith(templateId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });
});