import {
  buildLogMessage,
  createLogger,
  NotificationChannelEventTemplateMapping,
  TraceIdService,
  LookUp,
  Employee,
  User,
} from "../../../../service-lib";
import { NotificationUtils } from "../../../../service-lib/src/lib/utils/notification.utils";
import { checkUserHasPrivilege } from "../../../../service-lib/src/lib/utils/privilege-users.util";
import axios from "axios";
import * as Handlebars from "handlebars";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { addDays } from "date-fns";
import {
  ApprovalHistoryResponseDto,
  TemplateApprovalWorkflowDto,
  WorkflowStatusResponseDto,
} from "./dto/template-approval-workflow.dto";
import { IBP_EMAIL_TEMPLATE_EVENT_TYPES, TemplateRepository } from "./template.repository";
import { UpdateTemplateDto } from "./dto/update-template.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { NotificationService } from "../notification/notification.service";
import { DataSource, Repository } from "typeorm";
import {
  serviceNames,
  PRIORITY_LOOK_UP_HIGH_VALUE,
  NOTIFICATION_IN_APP,
  NOTIFICATION_EMAIL,
  ApprovalStatusEnum,
  TEMPLATE_NOTIFICATION_PARAMS,
  WorkflowActionEnum,
  TASK_ORIGIN,
  NOTIFICATION_SMS,
  APPROVAL_STATUS_DRAFT,
  APPROVAL_STATUS_APPROVED,
  APPROVAL_STATUS_REJECTED,
  APPROVAL_STATUS_PENDING_APPROVAL,
  APPROVAL_WORKFLOW_SUBMIT,
  APPROVAL_WORKFLOW_APPROVE,
  APPROVAL_WORKFLOW_REJECT,
  APPROVAL_WORKFLOW_REVISE,
  APPROVAL_WORKFLOW_WITHDRAW,
  TASK_TYPE_APPROVAL,
  ACL_CATEGORY,
  ACL_ACTIONS,
  TEMPLATE_NOTIFICATION_EVENTS,
} from "../../../../service-lib/src/lib/constants";
import { ENV } from "../../../../service-lib/src/lib/environment";

export interface UserContext {
  userId: number;
  roles: string[];
  organizationId?: number;
}

@Injectable()
export class TemplateApprovalWorkflowService implements OnModuleInit {
  private readonly logger;
  private approvalStatusLookupCache: Map<number, string> = new Map();
  private workflowActionLookupCache: Map<number, string> = new Map();
  private readonly approvalStatusKeyMap: Record<string, ApprovalStatusEnum> = {
    [APPROVAL_STATUS_DRAFT]: ApprovalStatusEnum.DRAFT,
    [APPROVAL_STATUS_APPROVED]: ApprovalStatusEnum.APPROVED,
    [APPROVAL_STATUS_REJECTED]: ApprovalStatusEnum.REJECTED,
    [APPROVAL_STATUS_PENDING_APPROVAL]: ApprovalStatusEnum.PENDING_APPROVAL,
  };
  private readonly workflowActionKeyMap: Record<string, WorkflowActionEnum> = {
    [APPROVAL_WORKFLOW_SUBMIT]: WorkflowActionEnum.SUBMIT,
    [APPROVAL_WORKFLOW_APPROVE]: WorkflowActionEnum.APPROVE,
    [APPROVAL_WORKFLOW_REJECT]: WorkflowActionEnum.REJECT,
    [APPROVAL_WORKFLOW_REVISE]: WorkflowActionEnum.REVISE,
    [APPROVAL_WORKFLOW_WITHDRAW]: WorkflowActionEnum.WITHDRAW,
  };

  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly traceIdService: TraceIdService,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
    private readonly notificationUtils: NotificationUtils,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.NOTIFICATION_SERVICE
    );
  }

  async onModuleInit() {
    await this.initializeLookupCaches();
  }

  private async initializeLookupCaches() {
    // Initialize approval status cache
    const approvalStatuses = await this.lookUpRepository.find({
      where: [
        { lookUpKey: APPROVAL_STATUS_DRAFT },
        { lookUpKey: APPROVAL_STATUS_APPROVED },
        { lookUpKey: APPROVAL_STATUS_REJECTED },
        { lookUpKey: APPROVAL_STATUS_PENDING_APPROVAL },
      ],
    });
    approvalStatuses.forEach((lookup) => {
      this.approvalStatusLookupCache.set(
        lookup.id,
        this.approvalStatusKeyMap[lookup.lookUpKey]
      );
    });

    // Initialize workflow action cache
    const workflowActions = await this.lookUpRepository.find({
      where: [
        { lookUpKey: APPROVAL_WORKFLOW_SUBMIT },
        { lookUpKey: APPROVAL_WORKFLOW_APPROVE },
        { lookUpKey: APPROVAL_WORKFLOW_REJECT },
        { lookUpKey: APPROVAL_WORKFLOW_REVISE },
        { lookUpKey: APPROVAL_WORKFLOW_WITHDRAW },
      ],
    });
    workflowActions.forEach((lookup) => {
      this.workflowActionLookupCache.set(
        lookup.id,
        this.workflowActionKeyMap[lookup.lookUpKey]
      );
    });
  }

  /**
   * Cache is populated once in onModuleInit — a lookup row added/changed
   * after boot without a service restart would otherwise resolve to
   * `undefined` here, which `res.json()` then silently drops from the
   * response instead of erroring. Falls back to a direct DB read (and
   * backfills the cache) on a miss instead of returning `undefined`.
   */
  private async getApprovalStatusLabel(
    lid: number
  ): Promise<ApprovalStatusEnum> {
    const cached = this.approvalStatusLookupCache.get(lid);
    if (cached) return cached as ApprovalStatusEnum;
    const lookup = await this.lookUpRepository.findOne({ where: { id: lid } });
    const resolved = lookup
      ? this.approvalStatusKeyMap[lookup.lookUpKey]
      : undefined;
    if (!resolved) {
      throw new Error(`Unknown approval status lookup id: ${lid}`);
    }
    this.approvalStatusLookupCache.set(lid, resolved);
    return resolved;
  }

  private async getWorkflowActionLabel(
    lid: number
  ): Promise<WorkflowActionEnum> {
    const cached = this.workflowActionLookupCache.get(lid);
    if (cached) return cached as WorkflowActionEnum;
    const lookup = await this.lookUpRepository.findOne({ where: { id: lid } });
    const resolved = lookup
      ? this.workflowActionKeyMap[lookup.lookUpKey]
      : undefined;
    if (!resolved) {
      throw new Error(`Unknown workflow action lookup id: ${lid}`);
    }
    this.workflowActionLookupCache.set(lid, resolved);
    return resolved;
  }

  /**
   * Unified workflow endpoint handling all approval operations
   */
  async processWorkflowAction(
    templateId: number,
    workflowDto: TemplateApprovalWorkflowDto,
    userContext: UserContext,
    authorizationHeader?: string
  ): Promise<WorkflowStatusResponseDto> {
    const traceId = this.traceIdService.traceId;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId,
        status: "success",
        payload: {
          templateId,
          action: workflowDto.action,
          performedBy: workflowDto.performedBy,
          performedByName: workflowDto.performedByName,
          userRoles: userContext.roles,
        },
        location: "TemplateApprovalWorkflowService",
        method: "processWorkflowAction",
      }),
    });

    try {
      // Get template and validate existence
      const template = await this.templateRepository.findById(templateId);
      if (!template) {
        throw new NotFoundException(`Template with ID ${templateId} not found`);
      }

      // IBP email event types don't go through this approval workflow yet
      // (it's being picked up in a later phase) — defense in depth for the
      // UI already hiding these actions, so this can't be triggered by a
      // stale tab/direct API call either.
      if (
        template.eventType?.name &&
        IBP_EMAIL_TEMPLATE_EVENT_TYPES.includes(template.eventType.name)
      ) {
        throw new BadRequestException(
          `"${template.eventType.name}" doesn't use the approval workflow yet — edits to IBP email templates take effect immediately.`
        );
      }

      // Get current status
      const currentStatus = this.getCurrentStatus(template);

      // Validate action is allowed for current status and user
      await this.validateWorkflowAction(workflowDto, currentStatus);

      // Process the specific action
      let newStatus: ApprovalStatusEnum;

      switch (workflowDto.action) {
        case WorkflowActionEnum.SUBMIT:
          ({ newStatus } = await this.handleSubmitAction(
            templateId,
            workflowDto,
            currentStatus,
            authorizationHeader
          ));
          break;

        case WorkflowActionEnum.APPROVE:
          ({ newStatus } = await this.handleApproveAction(
            templateId,
            workflowDto,
            currentStatus,
            authorizationHeader
          ));
          break;

        case WorkflowActionEnum.REJECT:
          ({ newStatus } = await this.handleRejectAction(
            templateId,
            workflowDto,
            currentStatus,
            authorizationHeader
          ));
          break;

        case WorkflowActionEnum.WITHDRAW:
          ({ newStatus } = await this.handleWithdrawAction(
            templateId,
            workflowDto,
            currentStatus,
            authorizationHeader
          ));
          break;

        case WorkflowActionEnum.REVISE:
          ({ newStatus } = await this.handleReviseAction(
            templateId,
            workflowDto,
            currentStatus
          ));
          break;

        default:
          throw new BadRequestException(
            `Unsupported workflow action: ${workflowDto.action}`
          );
      }

      // Return workflow status
      const response: WorkflowStatusResponseDto = {
        templateId,
        currentStatus: newStatus,
        previousStatus: currentStatus,
        lastActionBy: workflowDto.performedBy,
        lastActionAt: new Date(),
        lastActionComment: workflowDto.comment,
      };

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId,
          status: "success",
          payload: {
            templateId,
            action: workflowDto.action,
            fromStatus: currentStatus,
            toStatus: newStatus,
          },
          location: "TemplateApprovalWorkflowService",
          method: "processWorkflowAction",
        }),
      });

      return response;
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId,
          status: "failure",
          payload: {
            templateId,
            action: workflowDto.action,
            error: (error as Error).message,
          },
          location: "TemplateApprovalWorkflowService",
          method: "processWorkflowAction",
        }),
      });
      throw error;
    }
  }

  /**
   * Get complete approval history for a template
   */
  async getApprovalHistory(
    templateId: number
  ): Promise<ApprovalHistoryResponseDto[]> {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    const history =
      await this.templateRepository.findApprovalHistoryByTemplateId(templateId);

    // Convert to response DTOs with user names and lookup values
    return Promise.all(
      history.map(async (record) => ({
        id: record.id,
        templateId: record.templateId,
        action: await this.getWorkflowActionLabel(Number(record.actionLid)),
        fromStatus: record.fromStatusLid
          ? await this.getApprovalStatusLabel(Number(record.fromStatusLid))
          : ApprovalStatusEnum.DRAFT,
        toStatus: await this.getApprovalStatusLabel(Number(record.toStatusLid)),
        performedBy: record.performedBy,
        performedByName: this.getUserName(record),
        comment: record.comments,
        performedAt: record.performedAt,
      }))
    );
  }

  // Private helper methods

  private getCurrentStatus(
    template: NotificationChannelEventTemplateMapping
  ): ApprovalStatusEnum {
    // Convert lookup ID to string enum (TypeORM might return as string)
    const approvalStatusId = Number(template.approvalStatusLid);
    const statusString = this.approvalStatusLookupCache.get(approvalStatusId);
    return (statusString as ApprovalStatusEnum) || ApprovalStatusEnum.DRAFT;
  }

  private async validateWorkflowAction(
    workflowDto: TemplateApprovalWorkflowDto,
    currentStatus: ApprovalStatusEnum
  ): Promise<void> {
    const action = workflowDto.action;
    // Validate state transitions
    const validTransitions = this.getValidTransitions();
    const allowedActions = validTransitions[currentStatus] || [];

    if (!allowedActions.includes(action)) {
      throw new BadRequestException(
        `Action '${action}' not allowed for template in '${currentStatus}' status. ` +
          `Allowed actions: ${allowedActions.join(", ")}`
      );
    }

    // Validate mandatory comments for rejection
    if (action === WorkflowActionEnum.REJECT && !workflowDto.comment?.trim()) {
      throw new BadRequestException("Rejection comment is mandatory");
    }
  }

  private getValidTransitions(): Record<
    ApprovalStatusEnum,
    WorkflowActionEnum[]
  > {
    return {
      [ApprovalStatusEnum.DRAFT]: [WorkflowActionEnum.SUBMIT],
      [ApprovalStatusEnum.PENDING_APPROVAL]: [
        WorkflowActionEnum.APPROVE,
        WorkflowActionEnum.REJECT,
        WorkflowActionEnum.WITHDRAW,
      ],
      [ApprovalStatusEnum.APPROVED]: [WorkflowActionEnum.REVISE],
      [ApprovalStatusEnum.REJECTED]: [WorkflowActionEnum.REVISE],
    };
  }

  private async handleSubmitAction(
    templateId: number,
    workflowDto: TemplateApprovalWorkflowDto,
    currentStatus: ApprovalStatusEnum,
    authorizationHeader?: string
  ): Promise<{
    newStatus: ApprovalStatusEnum;
    updatedTemplate: NotificationChannelEventTemplateMapping;
  }> {
    const updatePayload: UpdateTemplateDto = {
      approvalStatus: ApprovalStatusEnum.PENDING_APPROVAL,
      submittedBy: workflowDto.performedBy,
      submittedAt: new Date(),
      updatedBy: workflowDto.performedBy,
    };

    const updatedTemplate = await this.templateRepository.update(
      templateId,
      updatePayload
    );

    await this.templateRepository.logApprovalAction(
      templateId,
      WorkflowActionEnum.SUBMIT,
      currentStatus,
      ApprovalStatusEnum.PENDING_APPROVAL,
      workflowDto.performedBy,
      workflowDto.comment
    );

    // Create approval task for template and store taskId in DB
    try {
      const createdTaskId = await this.createTemplateApprovalTask(
        templateId,
        updatedTemplate?.subject || `Template ${templateId}`,
        workflowDto.performedBy,
        workflowDto.performedByName,
        authorizationHeader
      );

      if (createdTaskId) {
        // Find approver user (immediate parent with approval permission)
        const approverUserId = await this.getApproverUserId(workflowDto.performedBy);
        
        // Send notification to assignee
        await this.sendTaskAssignmentNotification(
          approverUserId,
          workflowDto.performedBy,
          templateId,
          updatedTemplate?.subject || `Template ${templateId}`,
          createdTaskId
        );
        
        // Store taskId in database for later retrieval during approve/reject
        await this.templateRepository.updateTaskId(templateId, createdTaskId);
      } else {
        this.logger.log({
          level: "warn",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            payload: {
              templateId,
              message: "Template submitted but task was not created",
            },
            location: "TemplateApprovalWorkflowService",
            method: "handleSubmitAction",
          }),
        });
      }
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: {
            templateId,
            error: (error as Error).message,
          },
          location: "TemplateApprovalWorkflowService",
          method: "handleSubmitAction:createTemplateApprovalTask",
        }),
      });
      // Previously only logged: the template flipped to Pending Approval
      // while silently notifying no one, leaving it stuck with no visible
      // reason why. Rethrow so Submit fails loudly instead of reporting a
      // false success — the submitter can see the real reason (e.g. no
      // manager with approval rights) and escalate instead of assuming an
      // approver is already working on it.
      throw new BadRequestException(
        `Template submitted, but no approver could be assigned: ${
          (error as Error).message
        }`
      );
    }

    return {
      newStatus: ApprovalStatusEnum.PENDING_APPROVAL,
      updatedTemplate: updatedTemplate!,
    };
  }

  private async handleApproveAction(
    templateId: number,
    workflowDto: TemplateApprovalWorkflowDto,
    currentStatus: ApprovalStatusEnum,
    authorizationHeader?: string
  ): Promise<{
    newStatus: ApprovalStatusEnum;
    updatedTemplate: NotificationChannelEventTemplateMapping;
  }> {
    // Get template to retrieve taskId before updating
    const template = await this.templateRepository.findById(templateId);
    const taskIdToClose = template?.taskId;

    const updatePayload: UpdateTemplateDto = {
      approvalStatus: ApprovalStatusEnum.APPROVED,
      reviewedBy: workflowDto.performedBy,
      reviewedAt: new Date(),
      approvalComments: workflowDto.comment,
      isActive: true,
      updatedBy: workflowDto.performedBy,
    };

    const updatedTemplate = await this.templateRepository.update(
      templateId,
      updatePayload
    );

    await this.templateRepository.logApprovalAction(
      templateId,
      WorkflowActionEnum.APPROVE,
      currentStatus,
      ApprovalStatusEnum.APPROVED,
      workflowDto.performedBy,
      workflowDto.comment
    );

    // Close the approval task and clear taskId if task exists
    if (taskIdToClose) {
      try {
        await this.closeTemplateApprovalTask(
          taskIdToClose,
          workflowDto.performedBy,
          "Template approved",
          WorkflowActionEnum.APPROVE,
          authorizationHeader
        );
      } catch (error) {
        // Log but don't fail approval
        this.logger.log({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            payload: {
              templateId,
              taskId: taskIdToClose,
              error: (error as Error).message,
            },
            location: "TemplateApprovalWorkflowService",
            method: "handleApproveAction:closeTemplateApprovalTask",
          }),
        });
      }
      // Clear taskId from database after successful task deletion
      await this.templateRepository.clearTaskId(templateId);
    }

    // Notify submitter of approval
    if (updatedTemplate?.submittedBy) {
      try {
        await this.sendSubmitterNotification(
          updatedTemplate.submittedBy,
          templateId,
          updatedTemplate.subject,
          WorkflowActionEnum.APPROVE,
          workflowDto.performedBy,
          workflowDto.comment
        );
      } catch (error) {
        // Log but don't fail approval
        this.logger.log({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            payload: { templateId, error: (error as Error).message },
            location: "TemplateApprovalWorkflowService",
            method: "handleApproveAction:sendSubmitterNotification",
          }),
        });
      }
    }

    return {
      newStatus: ApprovalStatusEnum.APPROVED,
      updatedTemplate: updatedTemplate!,
    };
  }

  private async handleRejectAction(
    templateId: number,
    workflowDto: TemplateApprovalWorkflowDto,
    currentStatus: ApprovalStatusEnum,
    authorizationHeader?: string
  ): Promise<{
    newStatus: ApprovalStatusEnum;
    updatedTemplate: NotificationChannelEventTemplateMapping;
  }> {
    // Get template to retrieve taskId before updating
    const template = await this.templateRepository.findById(templateId);
    const taskIdToClose = template?.taskId;

    const updatePayload: UpdateTemplateDto = {
      approvalStatus: ApprovalStatusEnum.REJECTED,
      reviewedBy: workflowDto.performedBy,
      reviewedAt: new Date(),
      rejectionComments: workflowDto.comment,
      isActive: false,
      updatedBy: workflowDto.performedBy,
    };

    const updatedTemplate = await this.templateRepository.update(
      templateId,
      updatePayload
    );

    await this.templateRepository.logApprovalAction(
      templateId,
      WorkflowActionEnum.REJECT,
      currentStatus,
      ApprovalStatusEnum.REJECTED,
      workflowDto.performedBy,
      workflowDto.comment
    );

    // Close the approval task and clear taskId if task exists
    if (taskIdToClose) {
      try {
        await this.closeTemplateApprovalTask(
          taskIdToClose,
          workflowDto.performedBy,
          workflowDto.comment || "Template rejected",
          WorkflowActionEnum.REJECT,
          authorizationHeader
        );
      } catch (error) {
        // Log but don't fail rejection
        this.logger.log({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            payload: {
              templateId,
              taskId: taskIdToClose,
              error: (error as Error).message,
            },
            location: "TemplateApprovalWorkflowService",
            method: "handleRejectAction:closeTemplateApprovalTask",
          }),
        });
      }
      // Clear taskId from database after successful task deletion
      await this.templateRepository.clearTaskId(templateId);
    }

    // Notify submitter of rejection
    if (updatedTemplate?.submittedBy) {
      try {
        await this.sendSubmitterNotification(
          updatedTemplate.submittedBy,
          templateId,
          updatedTemplate.subject,
          WorkflowActionEnum.REJECT,
          workflowDto.performedBy,
          workflowDto.comment
        );
      } catch (error) {
        // Log but don't fail rejection
        this.logger.log({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            payload: { templateId, error: (error as Error).message },
            location: "TemplateApprovalWorkflowService",
            method: "handleRejectAction:sendSubmitterNotification",
          }),
        });
      }
    }

    return {
      newStatus: ApprovalStatusEnum.REJECTED,
      updatedTemplate: updatedTemplate!,
    };
  }

  private async handleWithdrawAction(
    templateId: number,
    workflowDto: TemplateApprovalWorkflowDto,
    currentStatus: ApprovalStatusEnum,
    authorizationHeader?: string
  ): Promise<{
    newStatus: ApprovalStatusEnum;
    updatedTemplate: NotificationChannelEventTemplateMapping;
  }> {
    // Get template to retrieve taskId before updating
    const template = await this.templateRepository.findById(templateId);
    const taskIdToClose = template?.taskId;

    const updatePayload: UpdateTemplateDto = {
      approvalStatus: ApprovalStatusEnum.DRAFT,
      submittedBy: undefined,
      submittedAt: undefined,
      updatedBy: workflowDto.performedBy,
    };

    const updatedTemplate = await this.templateRepository.update(
      templateId,
      updatePayload
    );

    await this.templateRepository.logApprovalAction(
      templateId,
      WorkflowActionEnum.WITHDRAW,
      currentStatus,
      ApprovalStatusEnum.DRAFT,
      workflowDto.performedBy,
      workflowDto.comment
    );

    // Close the approval task and clear taskId if task exists
    if (taskIdToClose) {
      try {
        await this.closeTemplateApprovalTask(
          taskIdToClose,
          workflowDto.performedBy,
          "Template withdrawn",
          WorkflowActionEnum.WITHDRAW,
          authorizationHeader
        );
      } catch (error) {
        // Log but don't fail withdrawal
        this.logger.log({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            payload: {
              templateId,
              taskId: taskIdToClose,
              error: (error as Error).message,
            },
            location: "TemplateApprovalWorkflowService",
            method: "handleWithdrawAction:closeTemplateApprovalTask",
          }),
        });
      }
      // Clear taskId from database after successful task deletion
      await this.templateRepository.clearTaskId(templateId);
    }

    return {
      newStatus: ApprovalStatusEnum.DRAFT,
      updatedTemplate: updatedTemplate!,
    };
  }

  private async handleReviseAction(
    templateId: number,
    workflowDto: TemplateApprovalWorkflowDto,
    currentStatus: ApprovalStatusEnum
  ): Promise<{
    newStatus: ApprovalStatusEnum;
    updatedTemplate: NotificationChannelEventTemplateMapping;
  }> {
    const updatePayload: UpdateTemplateDto = {
      approvalStatus: ApprovalStatusEnum.DRAFT,
      isActive: false,
      submittedBy: undefined,
      submittedAt: undefined,
      reviewedBy: undefined,
      reviewedAt: undefined,
      approvalComments: undefined,
      rejectionComments: undefined,
      updatedBy: workflowDto.performedBy,
    };

    const updatedTemplate = await this.templateRepository.update(
      templateId,
      updatePayload
    );

    await this.templateRepository.logApprovalAction(
      templateId,
      WorkflowActionEnum.REVISE,
      currentStatus,
      ApprovalStatusEnum.DRAFT,
      workflowDto.performedBy,
      workflowDto.comment
    );

    return {
      newStatus: ApprovalStatusEnum.DRAFT,
      updatedTemplate: updatedTemplate!,
    };
  }

  private getUserName(record: any): string {
    // Extract user name from joined employee data
    const performer = record.performer;
    if (performer) {
      return `${performer.firstName} ${performer.lastName}`.trim();
    }
    return `User ${record.performedBy}`;
  }

  /**
   * Get the lookup ID for TASK_TYPE_APPROVAL
   */
  private async getTaskTypeApprovalLookupId(): Promise<number> {
    const taskTypeLookup = await this.lookUpRepository.findOne({
      where: { lookUpKey: TASK_TYPE_APPROVAL },
    });

    if (!taskTypeLookup) {
      throw new NotFoundException("TASK_TYPE_APPROVAL lookup not found");
    }

    return taskTypeLookup.id;
  }

  /**
   * Get the lookup ID for HIGH priority
   */
  private async getHighPriorityLookupId(): Promise<number> {
    const priorityLookup = await this.lookUpRepository.findOne({
      where: { lookUpKey: PRIORITY_LOOK_UP_HIGH_VALUE },
    });

    if (!priorityLookup) {
      throw new NotFoundException("High priority lookup not found");
    }

    return priorityLookup.id;
  }

  /**
   * Find first user with APPROVE permission (immediate parent)
   */
  private async getApproverUserId(submittedByUserId: number): Promise<number> {
    try {
      // Get submitter's employee record to find reporting manager
      const submitterEmployee = await this.employeeRepository.findOne({
        where: { userId: submittedByUserId },
      });

      if (!submitterEmployee) {
        throw new NotFoundException(
          `Employee record not found for user ${submittedByUserId}`
        );
      }

      // Get reporting manager's user ID
      const reportingUserId = submitterEmployee.reportingUserId;

      if (!reportingUserId) {
        throw new NotFoundException("No reporting manager found for submitter");
      }

      // Verify reporting manager has approval permission via user_role
      const managerHasPermission = await this.checkUserHasPrivilegeWrapper(
        reportingUserId,
        ACL_CATEGORY.TEMPLATE_MANAGEMENT,
        ACL_ACTIONS.APPROVE
      );

      if (managerHasPermission) {
        return reportingUserId;
      } else {
        throw new BadRequestException(
          "Reporting manager does not have approval permission"
        );
      }
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message },
          location: "TemplateApprovalWorkflowService",
          method: "getApproverUserId",
        }),
      });
      throw error;
    }
  }

  /**
   * Check if a user has a specific privilege using shared utility
   */
  private async checkUserHasPrivilegeWrapper(
    userId: number,
    aclCategoryKey: string,
    aclActionKey: string
  ): Promise<boolean> {
    try {
      return await checkUserHasPrivilege(
        this.dataSource,
        userId,
        aclCategoryKey,
        aclActionKey
      );
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: {
            userId,
            aclCategoryKey,
            aclActionKey,
            error: (error as Error).message,
          },
          location: "TemplateApprovalWorkflowService",
          method: "checkUserHasPrivilegeWrapper",
        }),
      });
      // Return false if the query fails
      return false;
    }
  }

  /**
   * Send workflow notification for template approval process
   * Handles Template_Submit, Template_Approve, and Template_Reject events
   * Uses in-house notification service and dynamically fetches parameter keys from database
   */
  private async sendWorkflowNotification(
    eventType: string,
    recipientUserId: number,
    parameterValues: {
      submitterUserName?: string;
      approverUserName?: string;
      templateId: number;
      templateName: string;
      comments?: string;
      url?: string | Handlebars.SafeString;
    },
    sendSMS = false,
    sendInApp = true,
    sendEmail = true
  ): Promise<void> {
    try {
      // Get user email and phone number from database
      const user = await this.userRepository.findOne({
        where: { userId: recipientUserId },
        select: ["userId", "emailId", "mobile"],
      });

      if (!user || !user.emailId) {
        throw new NotFoundException(
          `Email not found for user ID ${recipientUserId}`
        );
      }

      // Dynamically fetch parameter keys from database
      const eventDetails =
        await this.notificationUtils.getNotificationDetailsByEvent(eventType);

      // Build parameters dynamically using database parameter keys
      const parameters: Record<string, string | number | Handlebars.SafeString> = {};
      eventDetails.forEach((detail: { parameterKey: string }) => {
        const key = detail.parameterKey;
        // Map parameter keys to values
        if (
          key === TEMPLATE_NOTIFICATION_PARAMS.SUBMITTER_USER_NAME &&
          parameterValues.submitterUserName
        ) {
          parameters[key] = parameterValues.submitterUserName;
        } else if (
          key === TEMPLATE_NOTIFICATION_PARAMS.APPROVER_USER_NAME &&
          parameterValues.approverUserName
        ) {
          parameters[key] = parameterValues.approverUserName;
        } else if (key === TEMPLATE_NOTIFICATION_PARAMS.TEMPLATE_ID) {
          parameters[key] = parameterValues.templateId;
        } else if (key === TEMPLATE_NOTIFICATION_PARAMS.TEMPLATE_NAME) {
          parameters[key] = parameterValues.templateName;
        } else if (
          key === TEMPLATE_NOTIFICATION_PARAMS.COMMENTS &&
          parameterValues.comments
        ) {
          parameters[key] = parameterValues.comments;
        } else if (
          key === TEMPLATE_NOTIFICATION_PARAMS.URL &&
          parameterValues.url
        ) {
          parameters[key] = parameterValues.url;
        }
      });

      // Send EMAIL notification
      if (sendEmail) {
        await this.notificationService.sendNotification({
          eventType,
          userId: [recipientUserId],
          emailId: [user.emailId],
          phoneNumber: [],
          channel: NOTIFICATION_EMAIL,
          parameters,
          additionalUserId: [],
        });

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "UnifiedApprovalWorkflowService",
            method: "sendWorkflowNotification",
            messageData: `Email notification sent for ${eventType}`,
          }),
        });
      }

      // Send IN_APP notification
      if (sendInApp) {
        await this.notificationService.sendNotification({
          eventType,
          channel: NOTIFICATION_IN_APP,
          userId: [recipientUserId],
          parameters,
        });

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            payload: { recipientUserId, eventType, channel: "IN_APP" },
            location: "TemplateApprovalWorkflowService",
            method: "sendWorkflowNotification",
            messageData: "IN_APP notification sent successfully",
          }),
        });
      }

      // Send SMS notification (which automatically sends email too via notification.service.ts logic)
      if (sendSMS && user.mobile) {
        await this.notificationService.sendNotification({
          eventType,
          channel: NOTIFICATION_SMS,
          phoneNumber: [user.mobile],
          emailId: [user.emailId],
          userId: [recipientUserId],
          parameters,
        });

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            payload: { recipientUserId, eventType, channel: "SMS" },
            location: "UnifiedApprovalWorkflowService",
            method: "sendWorkflowNotification",
            messageData:
              "SMS notification sent successfully (email sent automatically)",
          }),
        });
      }
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: {
            error: (error as Error).message,
            eventType,
            recipientUserId,
          },
          location: "TemplateApprovalWorkflowService",
          method: "sendWorkflowNotification",
        }),
      });
      // Don't throw - notification failure shouldn't block workflow
    }
  }

  /**
   * Send notification to task assignee
   */
  private async sendTaskAssignmentNotification(
    approverUserId: number,
    submittedByUserId: number,
    templateId: number,
    templateName: string,
    taskId: number
  ): Promise<void> {
    try {
      // Get submitter details for parameter
      const submitter = await this.employeeRepository.findOne({
        where: { userId: submittedByUserId },
      });

      if (!submitter) {
        throw new NotFoundException("Submitter details not found");
      }

      const submitterName = `${submitter.firstName} ${submitter.lastName}`;

      // Build URL for navigation with redirect parameter to show approve/reject buttons
      const templateUrl = `${ENV.CLIENT_SERVER_URL}template-management/preview/${templateId}?redirect=true`;

      // Check if email will be sent automatically with SMS
      const sendEmailWithSMS = ENV.SEND_EMAIL_WITH_SMS !== "false";

      // Send template submission notification
      await this.sendWorkflowNotification(
        TEMPLATE_NOTIFICATION_EVENTS.TEMPLATE_SUBMIT,
        approverUserId,
        {
          submitterUserName: submitterName,
          templateId,
          templateName,
          url: new Handlebars.SafeString(templateUrl), // Prevent HTML escaping of URL
        },
        true, // sendSMS
        true, // sendInApp
        !sendEmailWithSMS // sendEmail - false if SMS already sends email to avoid duplicates
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          payload: { approverUserId, templateId, taskId },
          location: "TemplateApprovalWorkflowService",
          method: "sendTaskAssignmentNotification",
          messageData: "Task assignment notification sent",
        }),
      });
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message },
          location: "TemplateApprovalWorkflowService",
          method: "sendTaskAssignmentNotification",
        }),
      });
      // Don't throw - notification failure shouldn't block task creation
    }
  }

  /**
   * Send notification to submitter when template is approved/rejected
   */
  private async sendSubmitterNotification(
    submittedByUserId: number,
    templateId: number,
    templateName: string,
    action: WorkflowActionEnum.APPROVE | WorkflowActionEnum.REJECT,
    reviewerUserId: number,
    comments?: string
  ): Promise<void> {
    try {
      // Get reviewer details
      const reviewer = await this.employeeRepository.findOne({
        where: { userId: reviewerUserId },
      });

      if (!reviewer) {
        throw new NotFoundException("Reviewer details not found");
      }

      const reviewerName = `${reviewer.firstName} ${reviewer.lastName}`;
      const eventType =
        action === WorkflowActionEnum.APPROVE
          ? TEMPLATE_NOTIFICATION_EVENTS.TEMPLATE_APPROVE
          : TEMPLATE_NOTIFICATION_EVENTS.TEMPLATE_REJECT;

      // Build URL for navigation to template preview
      const templateUrl = `${ENV.CLIENT_SERVER_URL}template-management/preview/${templateId}`;

      // Check if email will be sent automatically with SMS
      const sendEmailWithSMS = ENV.SEND_EMAIL_WITH_SMS !== "false";

      // Send notification using workflow notification function
      await this.sendWorkflowNotification(
        eventType,
        submittedByUserId,
        {
          approverUserName: reviewerName,
          templateId,
          templateName,
          comments: comments || "",
          url: new Handlebars.SafeString(templateUrl), // Prevent HTML escaping of URL
        },
        true, // sendSMS
        true, // sendInApp
        !sendEmailWithSMS // sendEmail - false if SMS already sends email to avoid duplicates
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          payload: { submittedByUserId, templateId, action },
          location: "TemplateApprovalWorkflowService",
          method: "sendSubmitterNotification",
          messageData: `Submitter notified of ${action}`,
        }),
      });
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message },
          location: "TemplateApprovalWorkflowService",
          method: "sendSubmitterNotification",
        }),
      });
      // Don't throw - notification failure shouldn't block workflow
    }
  }

  /**
   * Create an approval task for the template by calling opportunity-service
   */
  private async createTemplateApprovalTask(
    templateId: number,
    templateName: string,
    submittedByUserId: number,
    submittedByUserName: string,
    authorizationHeader?: string
  ): Promise<number | undefined> {
    try {
      const opportunityServiceUrl = ENV.URL_OPPORTUNITY_SERVICE;

      // Get required lookup IDs
      const [taskTypeApprovalId, highPriorityId] = await Promise.all([
        this.getTaskTypeApprovalLookupId(),
        this.getHighPriorityLookupId(),
      ]);

      // Find approver user (immediate parent with approval permission)
      const approverUserId = await this.getApproverUserId(submittedByUserId);

      // Build task payload matching CreateTaskDto structure
      let createdTaskId;
      if (approverUserId >= 0) {
        const taskPayload = {
          taskName: `Approve Template: ${templateName}`,
          taskTypeLid: taskTypeApprovalId,
          assigneeId: approverUserId,
          dueDate: addDays(new Date(), 2).toISOString().split("T")[0], // 2 days from now
          description: `Template "${templateName}" submitted by User ${submittedByUserName}. Please review and approve.`,
          priorityLid: highPriorityId,
          taskOrigin: TASK_ORIGIN.TEMPLATE_APPROVAL,
          templateId: templateId,
          isTemplateApprovalTask: true,
        };

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            payload: { templateId, approverUserId },
            location: "TemplateApprovalWorkflowService",
            method: "createTemplateApprovalTask",
            messageData: "Creating approval task for template",
          }),
        });

        // Create task via opportunity-service
        const taskEndpoint = `${opportunityServiceUrl}/task`;
        const headers: Record<string, string | number> = {
          userid: submittedByUserId,
        };
        
        // Include Authorization header if provided (required for QA environment)
        if (authorizationHeader) {
          headers.Authorization = authorizationHeader;
        }

        const taskResponse = await axios.post(
          taskEndpoint,
          taskPayload,
          { headers }
        );

        createdTaskId = taskResponse.data?.data?.id;
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          payload: { templateId, taskId: createdTaskId },
          location: "TemplateApprovalWorkflowService",
          method: "createTemplateApprovalTask",
          messageData: "Template approval task created successfully",
        }),
      });

      return createdTaskId;
    } catch (error) {
      const axiosError = error as any;
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: {
            templateId,
            error: (error as Error).message,
            errorCode: axiosError?.code,
            httpStatus: axiosError?.response?.status,
            responseData: axiosError?.response?.data,
          },
          location: "TemplateApprovalWorkflowService",
          method: "createTemplateApprovalTask",
        }),
      });
      throw error;
    }
  }

  /**
   * Close an approval task by calling opportunity-service
   * Deletes task if action is 'withdraw', completes task otherwise
   */
  private async closeTemplateApprovalTask(
    taskId: number,
    userId: number,
    comments: string,
    action:
      | WorkflowActionEnum.APPROVE
      | WorkflowActionEnum.REJECT
      | WorkflowActionEnum.WITHDRAW,
    authorizationHeader?: string
  ): Promise<void> {
    try {
      const opportunityServiceUrl = ENV.URL_OPPORTUNITY_SERVICE;

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          payload: { taskId, userId, comments, action },
          location: "TemplateApprovalWorkflowService",
          method: "closeTemplateApprovalTask",
          messageData: `Closing approval task with action: ${action}`,
        }),
      });

      if (action === WorkflowActionEnum.WITHDRAW) {
        // Delete task via opportunity-service for withdraw action
        const deleteHeaders: Record<string, string | number> = {
          userid: userId,
        };
        
        if (authorizationHeader) {
          deleteHeaders.Authorization = authorizationHeader;
        }

        await axios.delete(`${opportunityServiceUrl}/task/${taskId}`, {
          headers: deleteHeaders,
        });

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            payload: { taskId },
            location: "TemplateApprovalWorkflowService",
            method: "closeTemplateApprovalTask",
            messageData:
              "Template approval task deleted successfully (withdraw)",
          }),
        });
      } else {
        // Complete task via opportunity-service using isTemplateApprovalTask flag for approve/reject
        const completeHeaders: Record<string, string | number> = {
          userid: userId,
        };
        
        if (authorizationHeader) {
          completeHeaders.Authorization = authorizationHeader;
        }

        await axios.put(
          `${opportunityServiceUrl}/task/${taskId}/complete`,
          {
            comments: comments,
            isTemplateApprovalTask: true,
          },
          {
            headers: completeHeaders,
          }
        );

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            payload: { taskId, comments },
            location: "TemplateApprovalWorkflowService",
            method: "closeTemplateApprovalTask",
            messageData: `Template approval task completed successfully (${action})`,
          }),
        });
      }
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: {
            taskId,
            error: (error as Error).message,
          },
          location: "TemplateApprovalWorkflowService",
          method: "closeTemplateApprovalTask",
        }),
      });
      throw error;
    }
  }
}
