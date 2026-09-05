import { LookUp } from "../../../../service-lib";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TemplateApprovalWorkflowDto } from "./dto/template-approval-workflow.dto";
import {
  ApprovalStatusEnum,
  WorkflowActionEnum,
} from "../../../../service-lib/src/lib/constants";
import { TemplateRepository } from "./template.repository";
import {
  TemplateApprovalWorkflowService,
  UserContext,
} from "./template-approval-workflow.service";

describe("TemplateApprovalWorkflowService", () => {
  let service: TemplateApprovalWorkflowService;
  let templateRepository: jest.Mocked<TemplateRepository>;
  let lookUpRepository: jest.Mocked<Repository<LookUp>>;

  const mockLookups = {
    draft: { id: 1, lookUpKey: "APPROVAL_STATUS_DRAFT", lookUpValue: "Draft" },
    pending: {
      id: 2,
      lookUpKey: "APPROVAL_STATUS_PENDING_APPROVAL",
      lookUpValue: "Pending Approval",
    },
    approved: {
      id: 3,
      lookUpKey: "APPROVAL_STATUS_APPROVED",
      lookUpValue: "Approved",
    },
    rejected: {
      id: 4,
      lookUpKey: "APPROVAL_STATUS_REJECTED",
      lookUpValue: "Rejected",
    },
    submit: {
      id: 5,
      lookUpKey: "APPROVAL_WORKFLOW_SUBMIT",
      lookUpValue: "Submit",
    },
    approve: {
      id: 6,
      lookUpKey: "APPROVAL_WORKFLOW_APPROVE",
      lookUpValue: "Approve",
    },
    reject: {
      id: 7,
      lookUpKey: "APPROVAL_WORKFLOW_REJECT",
      lookUpValue: "Reject",
    },
    revise: {
      id: 8,
      lookUpKey: "APPROVAL_WORKFLOW_REVISE",
      lookUpValue: "Revise",
    },
    withdraw: {
      id: 9,
      lookUpKey: "APPROVAL_WORKFLOW_WITHDRAW",
      lookUpValue: "Withdraw",
    },
  };

  const mockTemplate = {
    id: 1,
    templateName: "Test Template",
    createdBy: 100,
    updatedBy: 100,
    statusLid: 1,
    approvalStatusLid: mockLookups.draft.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserContext: UserContext = {
    userId: 100,
    roles: ["IWORK_ADMINISTRATOR"],
    organizationId: 1,
  };

  const mockAdminContext: UserContext = {
    userId: 200,
    roles: ["SYSTEM_ADMINISTRATOR"],
    organizationId: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateApprovalWorkflowService,
        {
          provide: TemplateRepository,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
            logApprovalAction: jest.fn(),
            createApprovalHistory: jest.fn(),
            findApprovalHistoryByTemplateId: jest.fn(),
            findLatestApprovalHistoryByTemplateId: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LookUp),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TemplateApprovalWorkflowService>(
      TemplateApprovalWorkflowService
    );
    templateRepository = module.get(TemplateRepository);
    lookUpRepository = module.get(getRepositoryToken(LookUp));

    // Mock lookup repository to return all lookup values for cache initialization
    lookUpRepository.find.mockResolvedValue(Object.values(mockLookups) as any);

    // Initialize the service's lookup caches
    await service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("processWorkflowAction", () => {
    it("should successfully submit template for approval", async () => {
      // Arrange
      const workflowDto: TemplateApprovalWorkflowDto = {
        action: WorkflowActionEnum.SUBMIT,
        performedBy: 100,
        performedByName: "Test User",
        comment: "Ready for review",
      };

      templateRepository.findById.mockResolvedValue(mockTemplate as any);
      templateRepository.update.mockResolvedValue({
        ...mockTemplate,
        approvalStatusLid: mockLookups.pending.id,
      } as any);
      templateRepository.logApprovalAction.mockResolvedValue({} as any);

      // Act
      const result = await service.processWorkflowAction(
        1,
        workflowDto,
        mockUserContext
      );

      // Assert
      expect(result.currentStatus).toBe(ApprovalStatusEnum.PENDING_APPROVAL);
      expect(templateRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          approvalStatus: ApprovalStatusEnum.PENDING_APPROVAL,
          submittedBy: 100,
        })
      );
      expect(templateRepository.logApprovalAction).toHaveBeenCalledWith(
        1,
        WorkflowActionEnum.SUBMIT,
        ApprovalStatusEnum.DRAFT,
        ApprovalStatusEnum.PENDING_APPROVAL,
        100,
        "Ready for review"
      );
    });

    it("should successfully approve template", async () => {
      // Arrange
      const pendingTemplate = {
        ...mockTemplate,
        approvalStatus: ApprovalStatusEnum.PENDING_APPROVAL,
      };

      const workflowDto: TemplateApprovalWorkflowDto = {
        action: WorkflowActionEnum.APPROVE,
        performedBy: 200,
        performedByName: "Admin User",
        comment: "Template approved",
      };

      templateRepository.findById.mockResolvedValue(pendingTemplate as any);
      templateRepository.update.mockResolvedValue({
        ...pendingTemplate,
        approvalStatusLid: mockLookups.approved.id,
      } as any);
      templateRepository.logApprovalAction.mockResolvedValue({} as any);

      // Act
      const result = await service.processWorkflowAction(
        1,
        workflowDto,
        mockAdminContext
      );

      // Assert
      expect(result.currentStatus).toBe(ApprovalStatusEnum.APPROVED);
      expect(templateRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          approvalStatus: ApprovalStatusEnum.APPROVED,
          reviewedBy: 200,
          isActive: true,
        })
      );
    });

    it("should successfully reject template", async () => {
      // Arrange
      const pendingTemplate = {
        ...mockTemplate,
        approvalStatus: ApprovalStatusEnum.PENDING_APPROVAL,
      };

      const workflowDto: TemplateApprovalWorkflowDto = {
        action: WorkflowActionEnum.REJECT,
        performedBy: 200,
        performedByName: "Admin User",
        comment: "Template needs improvements",
      };

      templateRepository.findById.mockResolvedValue(pendingTemplate as any);
      templateRepository.update.mockResolvedValue({
        ...pendingTemplate,
        approvalStatusLid: mockLookups.rejected.id,
      } as any);
      templateRepository.logApprovalAction.mockResolvedValue({} as any);

      // Act
      const result = await service.processWorkflowAction(
        1,
        workflowDto,
        mockAdminContext
      );

      // Assert
      expect(result.currentStatus).toBe(ApprovalStatusEnum.REJECTED);
      expect(templateRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          approvalStatus: ApprovalStatusEnum.REJECTED,
          reviewedBy: 200,
          isActive: false,
        })
      );
    });

    it("should successfully withdraw template from approval", async () => {
      // Arrange
      const pendingTemplate = {
        ...mockTemplate,
        approvalStatus: ApprovalStatusEnum.PENDING_APPROVAL,
      };

      const workflowDto: TemplateApprovalWorkflowDto = {
        action: WorkflowActionEnum.WITHDRAW,
        performedBy: 100,
        performedByName: "Test User",
        comment: "Need to make changes",
      };

      templateRepository.findById.mockResolvedValue(pendingTemplate as any);
      templateRepository.update.mockResolvedValue({
        ...pendingTemplate,
        approvalStatusLid: mockLookups.draft.id,
      } as any);
      templateRepository.logApprovalAction.mockResolvedValue({} as any);

      // Act
      const result = await service.processWorkflowAction(
        1,
        workflowDto,
        mockUserContext
      );

      // Assert
      expect(result.currentStatus).toBe(ApprovalStatusEnum.DRAFT);
      expect(templateRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          approvalStatus: ApprovalStatusEnum.DRAFT,
          submittedBy: undefined,
          submittedAt: undefined,
        })
      );
    });

    it("should successfully revise rejected template", async () => {
      // Arrange
      const rejectedTemplate = {
        ...mockTemplate,
        approvalStatusLid: mockLookups.rejected.id,
      };

      const workflowDto: TemplateApprovalWorkflowDto = {
        action: WorkflowActionEnum.REVISE,
        performedBy: 100,
        performedByName: "Test User",
        comment: "Addressed all feedback",
      };

      templateRepository.findById.mockResolvedValue(rejectedTemplate as any);
      templateRepository.update.mockResolvedValue({
        ...rejectedTemplate,
        approvalStatusLid: mockLookups.draft.id,
      } as any);
      templateRepository.logApprovalAction.mockResolvedValue({} as any);

      // Act
      const result = await service.processWorkflowAction(
        1,
        workflowDto,
        mockUserContext
      );

      // Assert
      expect(result.currentStatus).toBe(ApprovalStatusEnum.DRAFT);
      expect(templateRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          approvalStatus: ApprovalStatusEnum.DRAFT,
          updatedBy: 100,
        })
      );
    });

    it("should throw NotFoundException when template does not exist", async () => {
      // Arrange
      const workflowDto: TemplateApprovalWorkflowDto = {
        action: WorkflowActionEnum.SUBMIT,
        performedBy: 100,
        performedByName: "Test User",
      };

      templateRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.processWorkflowAction(999, workflowDto, mockUserContext)
      ).rejects.toThrow(NotFoundException);
      expect(templateRepository.findById).toHaveBeenCalledWith(999);
    });

    it("should throw BadRequestException for invalid state transition", async () => {
      // Arrange
      const workflowDto: TemplateApprovalWorkflowDto = {
        action: WorkflowActionEnum.APPROVE, // Invalid: can't approve draft template
        performedBy: 200,
        performedByName: "Admin User",
      };

      templateRepository.findById.mockResolvedValue(mockTemplate as any);

      // Act & Assert
      await expect(
        service.processWorkflowAction(1, workflowDto, mockAdminContext)
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when rejection comment is missing", async () => {
      // Arrange
      const workflowDto: TemplateApprovalWorkflowDto = {
        action: WorkflowActionEnum.REJECT,
        performedBy: 200,
        performedByName: "Admin User",
        comment: "", // Empty comment
      };

      const pendingTemplate = {
        ...mockTemplate,
        approvalStatusLid: mockLookups.pending.id,
      };

      templateRepository.findById.mockResolvedValue(pendingTemplate as any);

      // Act & Assert
      await expect(
        service.processWorkflowAction(1, workflowDto, mockAdminContext)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getApprovalHistory", () => {
    it("should return complete approval history", async () => {
      // Arrange
      const mockHistory = [
        {
          id: 1,
          templateId: 1,
          actionLid: mockLookups.submit.id,
          fromStatusLid: mockLookups.draft.id,
          toStatusLid: mockLookups.pending.id,
          performedBy: 100,
          performedAt: new Date(),
          comments: "Submitted for review",
          performer: null,
        },
      ];

      templateRepository.findById.mockResolvedValue(mockTemplate as any);
      templateRepository.findApprovalHistoryByTemplateId.mockResolvedValue(
        mockHistory as any
      );

      // Act
      const result = await service.getApprovalHistory(1);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].templateId).toBe(1);
      expect(result[0].action).toBe(WorkflowActionEnum.SUBMIT);
    });
  });
});
