import { TraceIdService } from '../../../../service-lib';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateTemplateDto } from './dto/create-template.dto';
import { TemplateRepository } from './template.repository';
import { TemplateService } from './template.service';
import { ApprovalStatusEnum } from '../../../../service-lib/src/lib/constants';

describe('TemplateService', () => {
  let service: TemplateService;
  let repository: TemplateRepository;
  let traceIdService: TraceIdService;

  const mockTemplateRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockTraceIdService = {
    traceId: 'test-trace-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateService,
        { provide: TemplateRepository, useValue: mockTemplateRepository },
        { provide: TraceIdService, useValue: mockTraceIdService },
      ],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
    repository = module.get<TemplateRepository>(TemplateRepository);
    traceIdService = module.get<TraceIdService>(TraceIdService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTemplate', () => {
    it('should create a template successfully', async () => {
      const createTemplateDto: CreateTemplateDto = {
        name: 'Test Template',
        channelTypeId: 2, // SMS channel
        body: 'Hello {{firstName}}!',
      };

      const mockTemplate = {
        id: 1,
        templateName: 'Test Template',
        body: 'Hello {{firstName}}!',
        channelType: { name: 'sms' },
        statusLid: 1,
        createdBy: 0,
        updatedBy: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvalStatus: ApprovalStatusEnum.DRAFT,
      } as any;

      mockTemplateRepository.create.mockResolvedValue(mockTemplate);

      const result = await service.createTemplate(createTemplateDto);

      expect(repository.create).toHaveBeenCalledWith(createTemplateDto);
      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Test Template',
          body: 'Hello {{firstName}}!',
          approvalStatus: ApprovalStatusEnum.DRAFT,
        })
      );
    });

    it('should throw BadRequestException for email template without subject', async () => {
      const createTemplateDto: CreateTemplateDto = {
        name: 'Test Email Template',
        channelTypeId: 1, // Email channel
        body: 'Hello {{firstName}}!',
        // subject is missing
      };

      await expect(service.createTemplate(createTemplateDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createTemplate(createTemplateDto)).rejects.toThrow(
        'Subject is required for email templates'
      );
    });
  });

  describe('getTemplate', () => {
    it('should retrieve a template successfully', async () => {
      const templateId = 1;
      const mockTemplate = {
        id: 1,
        templateName: 'Test Template',
        body: 'Hello {{firstName}}!',
        channelType: { name: 'email' },
        statusLid: 1,
        createdBy: 1,
        updatedBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvalStatus: ApprovalStatusEnum.APPROVED,
      } as any;

      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);

      const result = await service.getTemplate(templateId);

      expect(repository.findById).toHaveBeenCalledWith(templateId);
      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Test Template',
          channelType: 'email',
          approvalStatus: ApprovalStatusEnum.APPROVED,
        })
      );
    });

    it('should throw NotFoundException for non-existent template', async () => {
      const templateId = 999;
      mockTemplateRepository.findById.mockResolvedValue(null);

      await expect(service.getTemplate(templateId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getTemplate(templateId)).rejects.toThrow(
        `Template with ID ${templateId} not found`
      );
    });
  });

  describe('updateTemplate', () => {
    it('should throw BadRequestException for locked template', async () => {
      const templateId = 1;
      const updateDto = { name: 'Updated Template' };

      const mockTemplate = {
        id: 1,
        approvalStatus: ApprovalStatusEnum.PENDING_APPROVAL,
      } as any;

      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);

      await expect(service.updateTemplate(templateId, updateDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.updateTemplate(templateId, updateDto)).rejects.toThrow(
        'Template cannot be edited while pending approval'
      );
    });
  });

  describe('validateApprovalStatusTransition', () => {
    it('should allow valid status transitions', async () => {
      const templateId = 1;
      const workflowDto = {
        templateId: 1,
        approval_status: ApprovalStatusEnum.PENDING_APPROVAL as any,
        submittedBy: 1,
      };

      const mockTemplate = {
        id: 1,
        approvalStatus: ApprovalStatusEnum.DRAFT,
      } as any;

      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);
      mockTemplateRepository.update.mockResolvedValue({
        ...mockTemplate,
        approvalStatus: ApprovalStatusEnum.PENDING_APPROVAL,
      });

      const result = await service.updateApprovalWorkflow(templateId, workflowDto);

      expect(result.approvalStatus).toBe(ApprovalStatusEnum.PENDING_APPROVAL);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const templateId = 1;
      const workflowDto = {
        templateId: 1,
        approval_status: ApprovalStatusEnum.APPROVED as any,
        reviewedBy: 1,
      };

      const mockTemplate = {
        id: 1,
        approvalStatus: ApprovalStatusEnum.DRAFT,
      } as any;

      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);

      await expect(service.updateApprovalWorkflow(templateId, workflowDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.updateApprovalWorkflow(templateId, workflowDto)).rejects.toThrow(
        `Invalid status transition from ${ApprovalStatusEnum.DRAFT} to ${ApprovalStatusEnum.APPROVED}`
      );
    });
  });
});