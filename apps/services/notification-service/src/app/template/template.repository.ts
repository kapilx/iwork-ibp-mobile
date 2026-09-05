import {
  NotificationChannelEventTemplateMapping,
  NotificationTemplateApprovalHistory,
  NotificationTemplateChangeLog,
  NotificationTemplateChangeAction,
  LookUp,
  NotificationChannelType,
  ConfigCompany,
  Company,
  TraceIdService,
} from '../../../../service-lib';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateTemplateDto } from './dto/create-template.dto';
import { GetTemplatesDto } from './dto/get-templates.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ApprovalStatusEnum, TemplateStatusEnum, WorkflowActionEnum, serviceNames } from '../../../../service-lib/src/lib/constants';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { buildLogMessage, serializeError } from '../../../../service-lib/src/lib/utils/logger.util';
import {
  NOTIFICATION_STATE_ON,
  TEMPLATE_ACTIVE_STATUS_ACTIVE,
  TEMPLATE_ACTIVE_STATUS_INACTIVE,
  APPROVAL_STATUS_DRAFT,
  APPROVAL_STATUS_APPROVED,
  APPROVAL_STATUS_REJECTED,
  APPROVAL_STATUS_PENDING_APPROVAL,
  APPROVAL_WORKFLOW_SUBMIT,
  APPROVAL_WORKFLOW_APPROVE,
  APPROVAL_WORKFLOW_REJECT,
  APPROVAL_WORKFLOW_REVISE,
  APPROVAL_WORKFLOW_WITHDRAW,
  NOTIFICATION_EVENT_TYPES,
} from '../../../../service-lib/src/lib/constants';

// The "Customise" action on Template Management (and, before that, the old
// "Customise Email Templates" tab on the company Portal Configuration
// screen) must only ever offer IBP company/employee-facing emails — not the
// dozens of internal iWork/CRM event types (opportunity creation, activity
// approvals, endorsements, MIR reports, etc.) that also live in
// notification_channel_event_template_mapping. Deliberately an allow-list,
// not a DB category column (that taxonomy migration — see
// database-migrations/sql/notification-template-category-taxonomy.sql —
// hasn't been run yet); revisit once it has. Exported so TemplateService can
// reuse it to compute `isCompanyCustomizable` on the plain GET /templates
// list too (see getTemplates / mapToResponseDto) — one allow-list, two
// consumers, not two copies of the same list.
export const IBP_EMAIL_TEMPLATE_EVENT_TYPES: string[] = [
  NOTIFICATION_EVENT_TYPES.IBP_PASSWORD_RESET_EVENT,
  NOTIFICATION_EVENT_TYPES.EMAIL_OTP_LOGIN,
  NOTIFICATION_EVENT_TYPES.EMAIL_OTP_2FA,
  NOTIFICATION_EVENT_TYPES.EMAIL_OTP_ENROLLMENT_VERIFICATION,
  NOTIFICATION_EVENT_TYPES.CLIENT_CONFIRMATION_EMAIL,
  NOTIFICATION_EVENT_TYPES.INITIAL_ONBOARDING_EMAIL,
  NOTIFICATION_EVENT_TYPES.ENROLLMENT_START_EMAIL,
  NOTIFICATION_EVENT_TYPES.ENROLLMENT_REMINDER_EMAIL,
  NOTIFICATION_EVENT_TYPES.ENROLLMENT_CONFIRMATION_EMAIL,
  NOTIFICATION_EVENT_TYPES.BULK_ENROLLMENT_CONFIRMATION_EMAIL,
  NOTIFICATION_EVENT_TYPES.LIFE_EVENT_CONFIRMATION_EMAIL,
  NOTIFICATION_EVENT_TYPES.ADDED_DEPENDENTS_EMAIL,
  NOTIFICATION_EVENT_TYPES.CLAIM_INTIMATION_CONFIRMATION_EMAIL,
  NOTIFICATION_EVENT_TYPES.SUPPORT_TICKET_RAISED_EMAIL,
  NOTIFICATION_EVENT_TYPES.SUPPORT_TICKET_STATUS_CHANGED_EMAIL,
  NOTIFICATION_EVENT_TYPES.PREVIOUS_WELCOME_EMAIL_APOLOGY,
];

export interface EffectiveTemplate {
  eventTypeId: number;
  eventTypeName: string;
  eventTypeDescription?: string;
  channelTypeId: number;
  defaultTemplateId: number;
  isOverride: boolean;
  overrideTemplateId?: number;
  subject: string;
  body: string;
  /** Whether the row actually being sent (override if one exists, else the
   * default) is active. Drives the "Disable"/"Enable" toggle in
   * TemplateOverrideEditor. */
  isActive: boolean;
}

export interface TemplateOverrideSummary {
  configId: number;
  companyId: number | null;
  companyName: string | null;
  subDomain: string | null;
  subject: string;
  updatedAt: Date;
  isActive: boolean;
}

// Company-wide override summary row — no subDomain, since these event
// types (iwork/internal-CRM) have no domain concept at all.
export interface TemplateCompanyOverrideSummary {
  companyId: number;
  companyName: string | null;
  subject: string;
  updatedAt: Date;
  isActive: boolean;
}

@Injectable()
export class TemplateRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(NotificationChannelEventTemplateMapping)
    private readonly templateRepository: Repository<NotificationChannelEventTemplateMapping>,
    @InjectRepository(NotificationTemplateApprovalHistory)
    private readonly historyRepository: Repository<NotificationTemplateApprovalHistory>,
    @InjectRepository(NotificationTemplateChangeLog)
    private readonly changeLogRepository: Repository<NotificationTemplateChangeLog>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(NotificationChannelType)
    private readonly channelTypeRepository: Repository<NotificationChannelType>,
    @InjectRepository(ConfigCompany)
    private readonly configCompanyRepository: Repository<ConfigCompany>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.NOTIFICATION_SERVICE);
  }

  private logError(method: string, error: unknown, payload: Record<string, unknown> = {}) {
    this.logger.log({
      level: 'error',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'failure',
        location: 'TemplateRepository',
        method,
        payload,
        messageData: serializeError(error),
      }),
    });
  }

  private async getLookupId(lookupKey: string): Promise<number> {
    const lookup = await this.lookUpRepository.findOne({
      where: { lookUpKey: lookupKey },
    });
    if (!lookup) {
      throw new NotFoundException(`Lookup with key ${lookupKey} not found`);
    }
    return lookup.id;
  }

  async create(createTemplateDto: CreateTemplateDto): Promise<NotificationChannelEventTemplateMapping> {
    // Get lookup IDs for statuses
    const notificationOnId = await this.getLookupId(NOTIFICATION_STATE_ON);
    const activeStatusId = createTemplateDto.isActive 
      ? await this.getLookupId(TEMPLATE_ACTIVE_STATUS_ACTIVE)
      : await this.getLookupId(TEMPLATE_ACTIVE_STATUS_INACTIVE);
    const draftStatusId = await this.getLookupId(APPROVAL_STATUS_DRAFT);

    const templateData: Partial<NotificationChannelEventTemplateMapping> = {
      // Core fields
      eventTypeId: createTemplateDto.eventTypeId,
      channelTypeId: createTemplateDto.channelTypeId,
      subject: createTemplateDto.subject || '',
      body: createTemplateDto.body,
      createdBy: createTemplateDto.createdBy || 0,
      updatedBy: createTemplateDto.createdBy || 0,
      statusLid: notificationOnId, // Use NOTIFICATION_ON lookup ID
      
      // Template management fields
      organizationId: createTemplateDto.organizationId,
      characterCount: createTemplateDto.body.length,
      activeStatusLid: activeStatusId, // Use lookup ID for active/inactive
      approvalStatusLid: draftStatusId, // Use lookup ID for draft
    };
    
    const template = this.templateRepository.create(templateData);

    return await this.templateRepository.save(template);
  }

  // Maps the frontend's short channel keys to the DB's channel_type_key
  // values. Shared by checkEventConflict and resolveChannelTypeIdByKey so
  // there's one place that knows this mapping.
  private static readonly CHANNEL_KEY_MAP: Record<string, string> = {
    email: "NOTIFICATION_CHANNEL_EMAIL",
    sms: "NOTIFICATION_CHANNEL_SMS",
    "whats-app": "NOTIFICATION_CHANNEL_WHATS_APP",
    "in-app": "NOTIFICATION_CHANNEL_IN_APP",
  };

  async resolveChannelTypeIdByKey(channelTypeKey: string): Promise<number | null> {
    try {
      const dbChannelTypeKey = TemplateRepository.CHANNEL_KEY_MAP[channelTypeKey] ?? channelTypeKey;
      const channelType = await this.channelTypeRepository.findOne({
        where: { channelTypeKey: dbChannelTypeKey },
      });
      return channelType?.id ?? null;
    } catch (error) {
      this.logError('resolveChannelTypeIdByKey', error, { channelTypeKey });
      throw error;
    }
  }

  async checkEventConflict(
    templateId: number,
    eventTypeId: number,
    channelTypeKey: string,
    configId?: number | null
  ): Promise<NotificationChannelEventTemplateMapping | null> {
    try {
      const channelTypeId = await this.resolveChannelTypeIdByKey(channelTypeKey);
      if (!channelTypeId) {
        return null;
      }

      // Find any OTHER template with the same eventTypeId + channelTypeId,
      // scoped to the same "space" (configId) — a default (configId absent)
      // conflicts only with other defaults, and a config's override only
      // conflicts with another row already scoped to that same config. This
      // is what makes it possible to have both a default AND a per-config
      // override for the same event+channel without either one reading as a
      // conflict with the other. templateId=0 means create mode — no template
      // to exclude.
      const qb = this.templateRepository
        .createQueryBuilder("template")
        .leftJoinAndSelect("template.channelType", "channelType")
        .where("template.eventTypeId = :eventTypeId", { eventTypeId })
        .andWhere("template.channelTypeId = :channelTypeId", {
          channelTypeId,
        });

      if (configId) {
        qb.andWhere("template.configId = :configId", { configId });
      } else {
        qb.andWhere("template.configId IS NULL");
      }

      if (templateId > 0) {
        qb.andWhere("template.id != :templateId", { templateId });
      }

      return await qb.getOne();
    } catch (error) {
      this.logError('checkEventConflict', error, { templateId, eventTypeId, channelTypeKey, configId });
      throw error;
    }
  }

  async findById(
    id: number
  ): Promise<NotificationChannelEventTemplateMapping | null> {
    return await this.templateRepository
      .createQueryBuilder("template")
      .leftJoinAndSelect("template.eventType", "eventType")
      .leftJoinAndSelect("template.channelType", "channelType")
      .leftJoinAndSelect("template.approvalHistory", "approvalHistory")
      .leftJoinAndMapOne(
        "template.creator",
        "employee",
        "creator",
        "template.createdBy = creator.userId"
      )
      .leftJoinAndMapOne(
        "template.updater",
        "employee",
        "updater",
        "template.updatedBy = updater.userId"
      )
      // configId is a plain FK column (see entity comment) — mapped in via
      // leftJoinAndMapOne rather than a real relation, same trick as
      // creator/updater above. Only matches for override rows (configId
      // NOT NULL); stays null for the shared default. Lets mapToResponseDto
      // populate companyName/overrideSubDomain uniformly for both findById
      // and findAll without a separate resolveConfigCompanyInfo round trip.
      .leftJoinAndMapOne(
        "template.configCompany",
        ConfigCompany,
        "overrideConfigCompany",
        "template.configId = overrideConfigCompany.id"
      )
      .leftJoinAndSelect("overrideConfigCompany.company", "overrideCompany")
      // Same trick, for company-wide overrides — companyId points straight
      // at company.id, no ConfigCompany indirection needed. Only matches
      // for company-override rows; stays null for the default and for
      // config-scoped overrides.
      .leftJoinAndMapOne(
        "template.directCompany",
        Company,
        "overrideDirectCompany",
        "template.companyId = overrideDirectCompany.id"
      )
      .where("template.id = :id", { id })
      .getOne();
  }

  async findAll(query: GetTemplatesDto): Promise<{ templates: NotificationChannelEventTemplateMapping[]; total: number }> {
    const queryBuilder = this.templateRepository.createQueryBuilder('template')
      .leftJoinAndSelect('template.eventType', 'eventType')
      .leftJoinAndSelect('template.channelType', 'channelType')
      .leftJoinAndMapOne('template.creator', 'employee', 'creator', 'template.createdBy = creator.userId')
      .leftJoinAndMapOne('template.updater', 'employee', 'updater', 'template.updatedBy = updater.userId')
      // See findById's identical join for why — Company/Subdomain columns
      // on the Template Management list need this on every row, not just
      // the single-row fetch.
      .leftJoinAndMapOne(
        'template.configCompany',
        ConfigCompany,
        'overrideConfigCompany',
        'template.configId = overrideConfigCompany.id'
      )
      .leftJoinAndSelect('overrideConfigCompany.company', 'overrideCompany')
      .leftJoinAndMapOne(
        'template.directCompany',
        Company,
        'overrideDirectCompany',
        'template.companyId = overrideDirectCompany.id'
      );

    await this.applyFilters(queryBuilder, query);

    const offset = ((query.page || 1) - 1) * (query.limit || 10);
    queryBuilder
      .skip(offset)
      .take(query.limit || 10)
      .orderBy('template.createdAt', 'DESC');

    const [templates, total] = await queryBuilder.getManyAndCount();

    return { templates, total };
  }

  async update(id: number, updateTemplateDto: UpdateTemplateDto): Promise<NotificationChannelEventTemplateMapping | null> {
    const template = await this.findById(id);
    if (!template) {
      return null;
    }

    const updateData: Partial<NotificationChannelEventTemplateMapping> = {
      channelTypeId: updateTemplateDto.channelTypeId,
      subject: updateTemplateDto.subject,
      body: updateTemplateDto.body,
      updatedBy: updateTemplateDto.updatedBy || 0,
    };

    // Handle eventTypeId explicitly to support setting it to null
    if ("eventTypeId" in updateTemplateDto) {
      (updateData as any).eventTypeId = updateTemplateDto.eventTypeId ?? null;
    }

    const extendedUpdateData: Record<string, unknown> = {
      ...updateData,
    };

    // Map DTO fields to entity fields
    if (updateTemplateDto.organizationId) extendedUpdateData.organizationId = updateTemplateDto.organizationId;
    if (updateTemplateDto.isActive !== undefined) {
      const activeStatusId = updateTemplateDto.isActive
        ? await this.getLookupId(TEMPLATE_ACTIVE_STATUS_ACTIVE)
        : await this.getLookupId(TEMPLATE_ACTIVE_STATUS_INACTIVE);
      extendedUpdateData.activeStatusLid = activeStatusId;
      extendedUpdateData.statusLid = await this.getLookupId(NOTIFICATION_STATE_ON);
    }
    
    // Approval Workflow mapping
    if (updateTemplateDto.approvalStatus) {
      // Map string approval status to lookup ID
      const approvalStatusMap: Record<string, string> = {
        [ApprovalStatusEnum.DRAFT]: APPROVAL_STATUS_DRAFT,
        [ApprovalStatusEnum.PENDING_APPROVAL]: APPROVAL_STATUS_PENDING_APPROVAL,
        [ApprovalStatusEnum.APPROVED]: APPROVAL_STATUS_APPROVED,
        [ApprovalStatusEnum.REJECTED]: APPROVAL_STATUS_REJECTED,
      };
      const lookupKey = approvalStatusMap[updateTemplateDto.approvalStatus];
      if (lookupKey) {
        extendedUpdateData.approvalStatusLid = await this.getLookupId(lookupKey);
      }
    } else {
      // If we are updating content/settings but not explicitly changing workflow status,
      // we reset it to draft so it needs re-approval
      extendedUpdateData.approvalStatusLid = await this.getLookupId(APPROVAL_STATUS_DRAFT);
      
      // When resetting to draft, also set template to inactive if isActive wasn't explicitly provided
      if (updateTemplateDto.isActive === undefined) {
        extendedUpdateData.activeStatusLid = await this.getLookupId(TEMPLATE_ACTIVE_STATUS_INACTIVE);
      }
    }
    if (updateTemplateDto.submittedBy !== undefined) extendedUpdateData.submittedBy = updateTemplateDto.submittedBy;
    if (updateTemplateDto.submittedAt) extendedUpdateData.submittedAt = updateTemplateDto.submittedAt;
    if (updateTemplateDto.reviewedBy !== undefined) extendedUpdateData.reviewedBy = updateTemplateDto.reviewedBy;
    if (updateTemplateDto.reviewedAt) extendedUpdateData.reviewedAt = updateTemplateDto.reviewedAt;
    if (updateTemplateDto.approvalComments) extendedUpdateData.approvalComments = updateTemplateDto.approvalComments;
    if (updateTemplateDto.rejectionComments) extendedUpdateData.rejectionComments = updateTemplateDto.rejectionComments;
    
    // Update character count if body changed
    if (updateTemplateDto.body) {
      extendedUpdateData.characterCount = updateTemplateDto.body.length;
    }

    await this.templateRepository.update(id, extendedUpdateData);

    // Content-change audit trail — only when subject/body actually changed,
    // separate from the approval-status-transition log above. Anchored to
    // the DEFAULT template's id (see NotificationTemplateChangeLog entity
    // comment) whether this row IS the default (template.configId is null)
    // or is itself a config-scoped override being edited directly.
    const subjectChanged = updateTemplateDto.subject !== undefined && updateTemplateDto.subject !== template.subject;
    const bodyChanged = updateTemplateDto.body !== undefined && updateTemplateDto.body !== template.body;
    if (subjectChanged || bodyChanged) {
      // logContentChange is fail-open by design (catches and logs its own
      // errors, never throws) — the template content update above already
      // succeeded, and a failure writing the audit trail entry must not
      // turn that into a failed request.
      const isOverrideRow = template.configId != null;
      const templateMappingId = isOverrideRow
        ? (await this.resolveDefaultTemplateId(template.eventTypeId, template.channelTypeId)) ?? id
        : id;
      await this.logContentChange({
        templateMappingId,
        configId: template.configId ?? null,
        action: isOverrideRow
          ? NotificationTemplateChangeAction.UPDATED_OVERRIDE
          : NotificationTemplateChangeAction.UPDATED_DEFAULT,
        oldSubject: template.subject,
        oldBody: template.body,
        newSubject: updateTemplateDto.subject ?? template.subject,
        newBody: updateTemplateDto.body ?? template.body,
        changedBy: updateTemplateDto.updatedBy || 0,
      });
    }

    return await this.findById(id);
  }

  async softDelete(id: number): Promise<boolean> {
    // Soft delete: Change active status to inactive instead of hard deleting
    const inactiveStatusId = await this.getLookupId(TEMPLATE_ACTIVE_STATUS_INACTIVE);
    
    const result = await this.templateRepository.update(id, {
      activeStatusLid: inactiveStatusId,
      updatedAt: new Date()
    });
    
    return result.affected ? result.affected > 0 : false;
  }

  async findByApprovalStatus(approvalStatus: string): Promise<NotificationChannelEventTemplateMapping[]> {
    // Convert string approval status to lookup ID
    const approvalStatusMap: Record<string, string> = {
      [ApprovalStatusEnum.DRAFT]: APPROVAL_STATUS_DRAFT,
      [ApprovalStatusEnum.PENDING_APPROVAL]: APPROVAL_STATUS_PENDING_APPROVAL,
      [ApprovalStatusEnum.APPROVED]: APPROVAL_STATUS_APPROVED,
      [ApprovalStatusEnum.REJECTED]: APPROVAL_STATUS_REJECTED,
    };
    const lookupKey = approvalStatusMap[approvalStatus];
    if (!lookupKey) {
      return [];
    }
    
    const approvalStatusId = await this.getLookupId(lookupKey);
    
    const queryBuilder = this.templateRepository.createQueryBuilder('template')
      .leftJoinAndSelect('template.eventType', 'eventType')
      .leftJoinAndSelect('template.channelType', 'channelType')
      .where('template.approvalStatusLid = :approvalStatusId', { approvalStatusId });

    return await queryBuilder.getMany();
  }

  private async applyFilters(queryBuilder: SelectQueryBuilder<NotificationChannelEventTemplateMapping>, query: GetTemplatesDto): Promise<void> {
    if (query.search) {
      queryBuilder.andWhere(
        'template.subject ILIKE :search',
        { search: `%${query.search}%` }
      );
    }

    if (query.channelTypeId) {
      queryBuilder.andWhere('template.channelTypeId = :channelTypeId', { channelTypeId: query.channelTypeId });
    }

    if (query.approvalStatus) {
      // Convert string approval status to lookup ID
      const approvalStatusMap: Record<string, string> = {
        [ApprovalStatusEnum.DRAFT]: APPROVAL_STATUS_DRAFT,
        [ApprovalStatusEnum.PENDING_APPROVAL]: APPROVAL_STATUS_PENDING_APPROVAL,
        [ApprovalStatusEnum.APPROVED]: APPROVAL_STATUS_APPROVED,
        [ApprovalStatusEnum.REJECTED]: APPROVAL_STATUS_REJECTED,
      };
      const lookupKey = approvalStatusMap[query.approvalStatus];
      if (lookupKey) {
        const approvalStatusId = await this.getLookupId(lookupKey);
        queryBuilder.andWhere('template.approvalStatusLid = :approvalStatusId', { approvalStatusId });
      }
    }

    if (query.status) {
      // Convert string status to lookup ID
      const statusLookupKey = query.status === TemplateStatusEnum.ACTIVE
        ? TEMPLATE_ACTIVE_STATUS_ACTIVE 
        : TEMPLATE_ACTIVE_STATUS_INACTIVE;
      const activeStatusId = await this.getLookupId(statusLookupKey);
      queryBuilder.andWhere('template.activeStatusLid = :activeStatusId', { activeStatusId });
    }

    if (query.organizationId) {
      queryBuilder.andWhere('template.organizationId = :organizationId', { organizationId: query.organizationId });
    }

    if (query.createdBy) {
      queryBuilder.andWhere('template.createdBy = :createdBy', { createdBy: query.createdBy });
    }

    // Filter out deleted templates (statusLid = 0 represents inactive/retired)
    // If user explicitly asks for 'inactive' templates, we show them. 
    // We no longer default to showing only active ones as per user request.
  }

  // Approval History Methods

  async createApprovalHistory(
    historyData: Partial<NotificationTemplateApprovalHistory>
  ): Promise<NotificationTemplateApprovalHistory> {
    const history = this.historyRepository.create(historyData);
    return await this.historyRepository.save(history);
  }

  async findApprovalHistoryByTemplateId(templateId: number): Promise<NotificationTemplateApprovalHistory[]> {
    return await this.historyRepository.createQueryBuilder('history')
      .leftJoinAndMapOne('history.performer', 'employee', 'performer', 'history.performedBy = performer.userId')
      .where('history.templateId = :templateId', { templateId })
      .orderBy('history.performedAt', 'DESC')
      .getMany();
  }

  async findLatestApprovalHistoryByTemplateId(templateId: number): Promise<NotificationTemplateApprovalHistory | null> {
    return await this.historyRepository.findOne({
      where: { templateId },
      order: { performedAt: 'DESC' },
    });
  }

  async deleteApprovalHistoryByTemplateId(templateId: number): Promise<void> {
    await this.historyRepository.delete({ templateId });
  }

  async logApprovalAction(
    templateId: number,
    action: string,
    fromStatus: string | null,
    toStatus: string,
    performedBy: number,
    comments?: string
  ): Promise<NotificationTemplateApprovalHistory> {
    // Convert action string to lookup ID
    const actionMap: Record<string, string> = {
      [WorkflowActionEnum.SUBMIT]: APPROVAL_WORKFLOW_SUBMIT,
      [WorkflowActionEnum.APPROVE]: APPROVAL_WORKFLOW_APPROVE,
      [WorkflowActionEnum.REJECT]: APPROVAL_WORKFLOW_REJECT,
      [WorkflowActionEnum.REVISE]: APPROVAL_WORKFLOW_REVISE,
      [WorkflowActionEnum.WITHDRAW]: APPROVAL_WORKFLOW_WITHDRAW,
    };
    const actionLookupKey = actionMap[action];
    const actionLid = actionLookupKey ? await this.getLookupId(actionLookupKey) : null;

    // Convert status strings to lookup IDs
    const statusMap: Record<string, string> = {
      [ApprovalStatusEnum.DRAFT]: APPROVAL_STATUS_DRAFT,
      [ApprovalStatusEnum.PENDING_APPROVAL]: APPROVAL_STATUS_PENDING_APPROVAL,
      [ApprovalStatusEnum.APPROVED]: APPROVAL_STATUS_APPROVED,
      [ApprovalStatusEnum.REJECTED]: APPROVAL_STATUS_REJECTED,
    };

    const fromStatusLookupKey = fromStatus ? statusMap[fromStatus] : null;
    const fromStatusLid = fromStatusLookupKey ? await this.getLookupId(fromStatusLookupKey) : undefined;

    const toStatusLookupKey = statusMap[toStatus];
    const toStatusLid = toStatusLookupKey ? await this.getLookupId(toStatusLookupKey) : null;

    if (!actionLid || !toStatusLid) {
      throw new Error(`Invalid action or status for approval history: action=${action}, toStatus=${toStatus}`);
    }

    return await this.createApprovalHistory({
      templateId,
      actionLid,
      fromStatusLid,
      toStatusLid,
      performedBy,
      comments,
      performedAt: new Date(),
    });
  }

  /**
   * Update taskId for a template (internal use only)
   */
  async updateTaskId(templateId: number, taskId: number): Promise<void> {
    await this.templateRepository.update(templateId, { taskId });
  }

  /**
   * Clear taskId from a template (internal use only)
   */
  async clearTaskId(templateId: number): Promise<void> {
    await this.templateRepository.update(templateId, { taskId: undefined });
  }

  // ---------------------------------------------------------------------
  // Company/config-scoped override methods (Customise Email Templates tab)
  // ---------------------------------------------------------------------

  /**
   * The effective template list for a given config: the config's own
   * override where one exists for an event type, else the shared default.
   * One query pair, no N+1 — this is what the template dropdown + "Default"
   * vs "Customized" badge in the UI is built from.
   */
  async findEffectiveTemplates(configId: number, channelTypeId: number): Promise<EffectiveTemplate[]> {
    try {
      const defaults = await this.templateRepository
        .createQueryBuilder('template')
        .leftJoinAndSelect('template.eventType', 'eventType')
        .where('template.channelTypeId = :channelTypeId', { channelTypeId })
        .andWhere('template.configId IS NULL')
        .andWhere('eventType.name IN (:...ibpEventTypeNames)', {
          ibpEventTypeNames: IBP_EMAIL_TEMPLATE_EVENT_TYPES,
        })
        .orderBy('template.id', 'ASC')
        .getMany();

      if (defaults.length === 0) {
        return [];
      }

      const eventTypeIds = defaults
        .map((defaultTemplate) => defaultTemplate.eventTypeId)
        .filter((eventTypeId): eventTypeId is number => eventTypeId != null);

      const overrides = eventTypeIds.length
        ? await this.templateRepository.find({
            where: { channelTypeId, configId, eventTypeId: In(eventTypeIds) },
          })
        : [];

      const overrideByEventType = new Map(
        overrides.map((override) => [override.eventTypeId as number, override])
      );

      // NULL activeStatusLid (most rows predate this column ever being set
      // — confirmed via DB) must read as active, same as
      // notification.repository.ts's send-path query — only the INACTIVE
      // lookup id itself means disabled.
      const inactiveStatusId = await this.getLookupId(TEMPLATE_ACTIVE_STATUS_INACTIVE);

      return defaults.map((defaultTemplate) => {
        const override = defaultTemplate.eventTypeId != null
          ? overrideByEventType.get(defaultTemplate.eventTypeId)
          : undefined;
        const effective = override ?? defaultTemplate;
        const eventType = (defaultTemplate as unknown as { eventType?: { name: string; description?: string } }).eventType;

        return {
          eventTypeId: defaultTemplate.eventTypeId as number,
          eventTypeName: eventType?.name ?? '',
          eventTypeDescription: eventType?.description,
          channelTypeId: defaultTemplate.channelTypeId,
          defaultTemplateId: defaultTemplate.id,
          isOverride: Boolean(override),
          overrideTemplateId: override?.id,
          subject: effective.subject,
          body: effective.body,
          isActive: Number(effective.activeStatusLid) !== inactiveStatusId,
        };
      });
    } catch (error) {
      this.logError('findEffectiveTemplates', error, { configId, channelTypeId });
      throw error;
    }
  }

  /**
   * Same idea as findEffectiveTemplates, but for iwork/internal-CRM event
   * types (anything NOT in IBP_EMAIL_TEMPLATE_EVENT_TYPES — no domain
   * concept, so scoped by companyId instead of configId).
   */
  async findEffectiveTemplatesForCompany(companyId: number, channelTypeId: number): Promise<EffectiveTemplate[]> {
    try {
      const defaults = await this.templateRepository
        .createQueryBuilder('template')
        .leftJoinAndSelect('template.eventType', 'eventType')
        .where('template.channelTypeId = :channelTypeId', { channelTypeId })
        .andWhere('template.configId IS NULL')
        .andWhere('template.companyId IS NULL')
        .andWhere('eventType.name NOT IN (:...ibpEventTypeNames)', {
          ibpEventTypeNames: IBP_EMAIL_TEMPLATE_EVENT_TYPES,
        })
        .orderBy('template.id', 'ASC')
        .getMany();

      if (defaults.length === 0) {
        return [];
      }

      const eventTypeIds = defaults
        .map((defaultTemplate) => defaultTemplate.eventTypeId)
        .filter((eventTypeId): eventTypeId is number => eventTypeId != null);

      const overrides = eventTypeIds.length
        ? await this.templateRepository.find({
            where: { channelTypeId, companyId, eventTypeId: In(eventTypeIds) },
          })
        : [];

      const overrideByEventType = new Map(
        overrides.map((override) => [override.eventTypeId as number, override])
      );

      const inactiveStatusId = await this.getLookupId(TEMPLATE_ACTIVE_STATUS_INACTIVE);

      return defaults.map((defaultTemplate) => {
        const override = defaultTemplate.eventTypeId != null
          ? overrideByEventType.get(defaultTemplate.eventTypeId)
          : undefined;
        const effective = override ?? defaultTemplate;
        const eventType = (defaultTemplate as unknown as { eventType?: { name: string; description?: string } }).eventType;

        return {
          eventTypeId: defaultTemplate.eventTypeId as number,
          eventTypeName: eventType?.name ?? '',
          eventTypeDescription: eventType?.description,
          channelTypeId: defaultTemplate.channelTypeId,
          defaultTemplateId: defaultTemplate.id,
          isOverride: Boolean(override),
          overrideTemplateId: override?.id,
          subject: effective.subject,
          body: effective.body,
          isActive: Number(effective.activeStatusLid) !== inactiveStatusId,
        };
      });
    } catch (error) {
      this.logError('findEffectiveTemplatesForCompany', error, { companyId, channelTypeId });
      throw error;
    }
  }

  /**
   * Every company/domain that currently has its own customization of this
   * default template — powers the "Customise" drill-down detail view on
   * Template Management (list existing overrides, offer to add a new one
   * for a company/domain not in this list yet). Resolves the default row's
   * event_type_id/channel_type_id the same way upsertOverride/deleteOverride
   * do, then finds every sibling row scoped to a config (configId NOT
   * NULL) sharing that event+channel, joined to ConfigCompany.company for
   * the display name. Company name/subDomain can legitimately be null (a
   * config whose company_id was cleared via company_portal_configuration's
   * ON DELETE SET NULL, or a company row missing companyName) — the caller
   * (template.service.ts) is responsible for a display fallback, this
   * method just passes through whatever the join returns.
   */
  async findOverridesForTemplate(defaultTemplateId: number): Promise<TemplateOverrideSummary[]> {
    try {
      const defaultTemplate = await this.templateRepository.findOne({ where: { id: defaultTemplateId } });
      if (!defaultTemplate) {
        throw new NotFoundException(`Template with ID ${defaultTemplateId} not found`);
      }
      if (defaultTemplate.eventTypeId == null) {
        return [];
      }

      const overrides = await this.templateRepository.find({
        where: {
          eventTypeId: defaultTemplate.eventTypeId,
          channelTypeId: defaultTemplate.channelTypeId,
          configId: Not(IsNull()),
        },
        order: { updatedAt: 'DESC' },
      });

      if (overrides.length === 0) {
        return [];
      }

      const configIds = overrides
        .map((override) => override.configId)
        .filter((configId): configId is number => configId != null);

      const configCompanies = configIds.length
        ? await this.configCompanyRepository.find({
            where: { id: In(configIds) },
            relations: ['company'],
          })
        : [];
      const configCompanyById = new Map(configCompanies.map((cc) => [cc.id, cc]));
      // Same NULL-must-read-as-active correction as findEffectiveTemplates.
      const inactiveStatusId = await this.getLookupId(TEMPLATE_ACTIVE_STATUS_INACTIVE);

      return overrides.map((override) => {
        const configCompany = override.configId != null ? configCompanyById.get(override.configId) : undefined;
        return {
          configId: override.configId as number,
          companyId: configCompany?.companyId ?? null,
          companyName: configCompany?.company?.companyName ?? null,
          subDomain: configCompany?.subDomain ?? null,
          subject: override.subject,
          updatedAt: override.updatedAt,
          isActive: Number(override.activeStatusLid) !== inactiveStatusId,
        };
      });
    } catch (error) {
      this.logError('findOverridesForTemplate', error, { defaultTemplateId });
      throw error;
    }
  }

  /**
   * Every company that currently has its own company-wide customization of
   * this default template — same idea as findOverridesForTemplate, scoped
   * by companyId instead of configId.
   */
  async findCompanyOverridesForTemplate(defaultTemplateId: number): Promise<TemplateCompanyOverrideSummary[]> {
    try {
      const defaultTemplate = await this.templateRepository.findOne({ where: { id: defaultTemplateId } });
      if (!defaultTemplate) {
        throw new NotFoundException(`Template with ID ${defaultTemplateId} not found`);
      }
      if (defaultTemplate.eventTypeId == null) {
        return [];
      }

      const overrides = await this.templateRepository.find({
        where: {
          eventTypeId: defaultTemplate.eventTypeId,
          channelTypeId: defaultTemplate.channelTypeId,
          companyId: Not(IsNull()),
        },
        order: { updatedAt: 'DESC' },
      });

      if (overrides.length === 0) {
        return [];
      }

      const companyIds = overrides
        .map((override) => override.companyId)
        .filter((companyId): companyId is number => companyId != null);

      const companies = companyIds.length
        ? await this.companyRepository.find({ where: { id: In(companyIds) } })
        : [];
      const companyById = new Map(companies.map((c) => [c.id, c]));
      const inactiveStatusId = await this.getLookupId(TEMPLATE_ACTIVE_STATUS_INACTIVE);

      return overrides.map((override) => ({
        companyId: override.companyId as number,
        companyName: companyById.get(override.companyId as number)?.companyName ?? null,
        subject: override.subject,
        updatedAt: override.updatedAt,
        isActive: Number(override.activeStatusLid) !== inactiveStatusId,
      }));
    } catch (error) {
      this.logError('findCompanyOverridesForTemplate', error, { defaultTemplateId });
      throw error;
    }
  }

  /**
   * Create or update the config-scoped override for a default template.
   * Never mutates the default row itself. Overrides created here go live
   * immediately (active + approved) — there is no approval workflow for
   * per-config overrides in this phase, only for editing the shared
   * default via the standalone Template Management screen.
   */
  async upsertOverride(
    defaultTemplateId: number,
    configId: number,
    subject: string,
    body: string,
    userId: number
  ): Promise<{ template: NotificationChannelEventTemplateMapping; isNew: boolean }> {
    try {
      const defaultTemplate = await this.templateRepository.findOne({ where: { id: defaultTemplateId } });
      if (!defaultTemplate) {
        throw new NotFoundException(`Template with ID ${defaultTemplateId} not found`);
      }
      if (defaultTemplate.configId != null) {
        throw new BadRequestException(
          `Template ${defaultTemplateId} is itself scoped to a config — overrides must be created from the default template's own ID, not another override's ID`
        );
      }
      if (defaultTemplate.eventTypeId == null) {
        throw new BadRequestException(`Template ${defaultTemplateId} has no event type; cannot create a config override for it`);
      }

      let override = await this.templateRepository.findOne({
        where: {
          eventTypeId: defaultTemplate.eventTypeId,
          channelTypeId: defaultTemplate.channelTypeId,
          configId,
        },
      });

      const isNew = !override;
      const oldSubject = override?.subject ?? null;
      const oldBody = override?.body ?? null;

      const notificationOnId = await this.getLookupId(NOTIFICATION_STATE_ON);
      const activeStatusId = await this.getLookupId(TEMPLATE_ACTIVE_STATUS_ACTIVE);
      const approvedStatusId = await this.getLookupId(APPROVAL_STATUS_APPROVED);

      if (!override) {
        override = this.templateRepository.create({
          eventTypeId: defaultTemplate.eventTypeId,
          channelTypeId: defaultTemplate.channelTypeId,
          configId,
          subject,
          body,
          createdBy: userId,
          updatedBy: userId,
          statusLid: notificationOnId,
          activeStatusLid: activeStatusId,
          approvalStatusLid: approvedStatusId,
          characterCount: body.length,
        });
      } else {
        override.subject = subject;
        override.body = body;
        override.updatedBy = userId;
        override.characterCount = body.length;
        override.statusLid = notificationOnId;
        override.activeStatusLid = activeStatusId;
        override.approvalStatusLid = approvedStatusId;
      }

      const saved = await this.templateRepository.save(override);

      // Fail-open: logContentChange catches and logs its own errors — the
      // override save above already succeeded, so an audit-log hiccup must
      // not turn this into a failed save from the caller's perspective.
      await this.logContentChange({
        templateMappingId: defaultTemplate.id,
        configId,
        action: isNew ? NotificationTemplateChangeAction.CREATED_OVERRIDE : NotificationTemplateChangeAction.UPDATED_OVERRIDE,
        oldSubject,
        oldBody,
        newSubject: subject,
        newBody: body,
        changedBy: userId,
      });

      return { template: saved, isNew };
    } catch (error) {
      this.logError('upsertOverride', error, { defaultTemplateId, configId, userId });
      throw error;
    }
  }

  /**
   * Delete a config's override, reverting that config back to the shared
   * default. Throws if no override exists for that config — nothing to
   * reset.
   */
  async deleteOverride(defaultTemplateId: number, configId: number, userId: number): Promise<NotificationChannelEventTemplateMapping> {
    try {
      const defaultTemplate = await this.templateRepository.findOne({ where: { id: defaultTemplateId } });
      if (!defaultTemplate) {
        throw new NotFoundException(`Template with ID ${defaultTemplateId} not found`);
      }
      if (defaultTemplate.eventTypeId == null) {
        throw new NotFoundException(`Template ${defaultTemplateId} has no event type`);
      }

      const override = await this.templateRepository.findOne({
        where: {
          eventTypeId: defaultTemplate.eventTypeId,
          channelTypeId: defaultTemplate.channelTypeId,
          configId,
        },
      });

      if (!override) {
        throw new NotFoundException(
          `No customization exists for template ${defaultTemplateId} / config ${configId} to reset`
        );
      }

      // Logged before the delete, not after: once the override row is gone
      // there's nothing left to read subject/body from for the log entry.
      // Fail-open — logContentChange never throws — but note this means a
      // failed audit write here does NOT block the reset from proceeding.
      await this.logContentChange({
        templateMappingId: defaultTemplate.id,
        configId,
        action: NotificationTemplateChangeAction.DELETED_OVERRIDE,
        oldSubject: override.subject,
        oldBody: override.body,
        newSubject: null,
        newBody: null,
        changedBy: userId,
      });

      await this.templateRepository.delete(override.id);
      return defaultTemplate;
    } catch (error) {
      this.logError('deleteOverride', error, { defaultTemplateId, configId, userId });
      throw error;
    }
  }

  /**
   * Create or update the company-wide override for a default template —
   * same idea as upsertOverride, scoped by companyId instead of configId,
   * for iwork/internal-CRM event types with no domain concept.
   */
  async upsertCompanyOverride(
    defaultTemplateId: number,
    companyId: number,
    subject: string,
    body: string,
    userId: number
  ): Promise<{ template: NotificationChannelEventTemplateMapping; isNew: boolean }> {
    try {
      const defaultTemplate = await this.templateRepository.findOne({ where: { id: defaultTemplateId } });
      if (!defaultTemplate) {
        throw new NotFoundException(`Template with ID ${defaultTemplateId} not found`);
      }
      if (defaultTemplate.companyId != null) {
        throw new BadRequestException(
          `Template ${defaultTemplateId} is itself scoped to a company — overrides must be created from the default template's own ID, not another override's ID`
        );
      }
      if (defaultTemplate.eventTypeId == null) {
        throw new BadRequestException(`Template ${defaultTemplateId} has no event type; cannot create a company override for it`);
      }

      let override = await this.templateRepository.findOne({
        where: {
          eventTypeId: defaultTemplate.eventTypeId,
          channelTypeId: defaultTemplate.channelTypeId,
          companyId,
        },
      });

      const isNew = !override;
      const oldSubject = override?.subject ?? null;
      const oldBody = override?.body ?? null;

      const notificationOnId = await this.getLookupId(NOTIFICATION_STATE_ON);
      const activeStatusId = await this.getLookupId(TEMPLATE_ACTIVE_STATUS_ACTIVE);
      const approvedStatusId = await this.getLookupId(APPROVAL_STATUS_APPROVED);

      if (!override) {
        override = this.templateRepository.create({
          eventTypeId: defaultTemplate.eventTypeId,
          channelTypeId: defaultTemplate.channelTypeId,
          companyId,
          subject,
          body,
          createdBy: userId,
          updatedBy: userId,
          statusLid: notificationOnId,
          activeStatusLid: activeStatusId,
          approvalStatusLid: approvedStatusId,
          characterCount: body.length,
        });
      } else {
        override.subject = subject;
        override.body = body;
        override.updatedBy = userId;
        override.characterCount = body.length;
        override.statusLid = notificationOnId;
        override.activeStatusLid = activeStatusId;
        override.approvalStatusLid = approvedStatusId;
      }

      const saved = await this.templateRepository.save(override);

      await this.logContentChange({
        templateMappingId: defaultTemplate.id,
        companyId,
        action: isNew ? NotificationTemplateChangeAction.CREATED_OVERRIDE : NotificationTemplateChangeAction.UPDATED_OVERRIDE,
        oldSubject,
        oldBody,
        newSubject: subject,
        newBody: body,
        changedBy: userId,
      });

      return { template: saved, isNew };
    } catch (error) {
      this.logError('upsertCompanyOverride', error, { defaultTemplateId, companyId, userId });
      throw error;
    }
  }

  /**
   * Delete a company's override, reverting that company back to the shared
   * default. Throws if no override exists for that company — nothing to
   * reset.
   */
  async deleteCompanyOverride(defaultTemplateId: number, companyId: number, userId: number): Promise<NotificationChannelEventTemplateMapping> {
    try {
      const defaultTemplate = await this.templateRepository.findOne({ where: { id: defaultTemplateId } });
      if (!defaultTemplate) {
        throw new NotFoundException(`Template with ID ${defaultTemplateId} not found`);
      }
      if (defaultTemplate.eventTypeId == null) {
        throw new NotFoundException(`Template ${defaultTemplateId} has no event type`);
      }

      const override = await this.templateRepository.findOne({
        where: {
          eventTypeId: defaultTemplate.eventTypeId,
          channelTypeId: defaultTemplate.channelTypeId,
          companyId,
        },
      });

      if (!override) {
        throw new NotFoundException(
          `No customization exists for template ${defaultTemplateId} / company ${companyId} to reset`
        );
      }

      await this.logContentChange({
        templateMappingId: defaultTemplate.id,
        companyId,
        action: NotificationTemplateChangeAction.DELETED_OVERRIDE,
        oldSubject: override.subject,
        oldBody: override.body,
        newSubject: null,
        newBody: null,
        changedBy: userId,
      });

      await this.templateRepository.delete(override.id);
      return defaultTemplate;
    } catch (error) {
      this.logError('deleteCompanyOverride', error, { defaultTemplateId, companyId, userId });
      throw error;
    }
  }

  /**
   * Disable/enable a template — the shared default (configId/companyId both
   * omitted), one company/domain's override (configId given), or one
   * company-wide override (companyId given) — without touching its content
   * or approvalStatusLid. This is the ONLY column findTemplateMapping
   * (notification.repository.ts) checks unconditionally at send time, so
   * flipping it here is what actually stops/resumes the email — not a
   * cosmetic status label.
   */
  async setActiveStatus(
    defaultTemplateId: number,
    active: boolean,
    configId: number | undefined,
    userId: number,
    companyId?: number,
  ): Promise<NotificationChannelEventTemplateMapping> {
    try {
      const defaultTemplate = await this.templateRepository.findOne({ where: { id: defaultTemplateId } });
      if (!defaultTemplate) {
        throw new NotFoundException(`Template with ID ${defaultTemplateId} not found`);
      }
      if (defaultTemplate.configId != null || defaultTemplate.companyId != null) {
        throw new BadRequestException(
          `Template ${defaultTemplateId} is itself scoped to a config/company — address it by the default template's own ID, optionally with configId or companyId in the body`
        );
      }

      let target = defaultTemplate;
      if (configId) {
        const override = await this.templateRepository.findOne({
          where: {
            eventTypeId: defaultTemplate.eventTypeId,
            channelTypeId: defaultTemplate.channelTypeId,
            configId,
          },
        });
        if (!override) {
          throw new NotFoundException(
            `No customization exists for template ${defaultTemplateId} / config ${configId} to disable`
          );
        }
        target = override;
      } else if (companyId) {
        const companyOverride = await this.templateRepository.findOne({
          where: {
            eventTypeId: defaultTemplate.eventTypeId,
            channelTypeId: defaultTemplate.channelTypeId,
            companyId,
          },
        });
        if (!companyOverride) {
          throw new NotFoundException(
            `No customization exists for template ${defaultTemplateId} / company ${companyId} to disable`
          );
        }
        target = companyOverride;
      }

      target.activeStatusLid = await this.getLookupId(
        active ? TEMPLATE_ACTIVE_STATUS_ACTIVE : TEMPLATE_ACTIVE_STATUS_INACTIVE
      );
      target.updatedBy = userId;
      return await this.templateRepository.save(target);
    } catch (error) {
      this.logError('setActiveStatus', error, { defaultTemplateId, configId, companyId, active, userId });
      throw error;
    }
  }

  /**
   * Change history for a template: pass configId to get that config's
   * override history (CREATED/UPDATED/DELETED_OVERRIDE), companyId for a
   * company-wide override's history, or omit both to get the shared
   * default's own edit history (UPDATED_DEFAULT).
   */
  async findChangeLog(
    defaultTemplateId: number,
    configId?: number | null,
    companyId?: number | null,
  ): Promise<NotificationTemplateChangeLog[]> {
    try {
      const qb = this.changeLogRepository
        .createQueryBuilder('log')
        .leftJoinAndMapOne('log.changedByUser', 'employee', 'changedByUser', 'log.changedBy = changedByUser.userId')
        .where('log.templateMappingId = :defaultTemplateId', { defaultTemplateId });

      if (configId) {
        qb.andWhere('log.configId = :configId', { configId });
      } else if (companyId) {
        qb.andWhere('log.companyId = :companyId', { companyId });
      } else {
        qb.andWhere('log.configId IS NULL').andWhere('log.companyId IS NULL');
      }

      qb.orderBy('log.changedAt', 'DESC');
      return await qb.getMany();
    } catch (error) {
      this.logError('findChangeLog', error, { defaultTemplateId, configId, companyId });
      throw error;
    }
  }

  /**
   * Given ANY template row's id — default or a company/domain-scoped
   * override — resolves the TRUE default row's own id for that same
   * event+channel. Returns the input id unchanged when it's already a
   * default (configId IS NULL); returns null if the row doesn't exist or
   * has no event type at all.
   *
   * Needed because GET /templates (Template Management's flat list) has no
   * configId filter — a company's own override row is just another row in
   * the same result set, visually indistinguishable from the shared
   * default in that list. Clicking on one is easy to do by accident (see
   * TemplateCustomisation's "Customise" flow, which used to trust whatever
   * id was clicked as if it were always the default and silently broke
   * when it wasn't) — this lets a caller detect that and redirect to the
   * canonical default instead of operating on the wrong row.
   */
  async resolveCanonicalDefaultTemplateId(templateId: number): Promise<number | null> {
    try {
      const template = await this.templateRepository.findOne({ where: { id: templateId } });
      if (!template) return null;
      if (template.configId == null && template.companyId == null) return template.id;
      return this.resolveDefaultTemplateId(template.eventTypeId, template.channelTypeId);
    } catch (error) {
      this.logError('resolveCanonicalDefaultTemplateId', error, { templateId });
      throw error;
    }
  }

  private async resolveDefaultTemplateId(eventTypeId: number | null, channelTypeId: number): Promise<number | null> {
    try {
      if (eventTypeId == null) return null;
      const defaultTemplate = await this.templateRepository.findOne({
        where: { eventTypeId, channelTypeId, configId: IsNull(), companyId: IsNull() },
      });
      return defaultTemplate?.id ?? null;
    } catch (error) {
      this.logError('resolveDefaultTemplateId', error, { eventTypeId, channelTypeId });
      throw error;
    }
  }

  // Deliberately fail-open: every call site writes this AFTER its real
  // work (content save/delete) already succeeded. An audit-log write
  // failing must never surface as a failure of the operation the user
  // actually asked for — it's logged as an error here and swallowed.
  private async logContentChange(params: {
    templateMappingId: number;
    configId?: number | null;
    companyId?: number | null;
    action: NotificationTemplateChangeAction;
    oldSubject: string | null;
    oldBody: string | null;
    newSubject: string | null;
    newBody: string | null;
    changedBy: number;
  }): Promise<void> {
    try {
      const entry = this.changeLogRepository.create({
        templateMappingId: params.templateMappingId,
        configId: params.configId ?? null,
        companyId: params.companyId ?? null,
        action: params.action,
        oldSubject: params.oldSubject,
        oldBody: params.oldBody,
        newSubject: params.newSubject,
        newBody: params.newBody,
        changedBy: params.changedBy,
      });
      await this.changeLogRepository.save(entry);
    } catch (error) {
      this.logError('logContentChange', error, {
        templateMappingId: params.templateMappingId,
        configId: params.configId,
        companyId: params.companyId,
        action: params.action,
      });
    }
  }
}