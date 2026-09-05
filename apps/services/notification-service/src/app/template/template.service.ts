import {
  buildLogMessage,
  createLogger,
  NotificationChannelEventTemplateMapping,
  TraceIdService,
  LookUp,
} from "../../../../service-lib";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { GetTemplatesDto } from "./dto/get-templates.dto";
import {
  PaginatedTemplateResponseDto,
  TemplateResponseDto,
} from "./dto/template-response.dto";
import {
  EffectiveTemplateResponseDto,
  SaveCompanyTemplateOverrideDto,
  SaveTemplateOverrideDto,
  TemplateChangeLogEntryResponseDto,
  TemplateCompanyOverrideSummaryResponseDto,
  TemplateOverrideSummaryResponseDto,
} from "./dto/template-override.dto";
import {
  TemplateStatusResponseDto,
  UpdateTemplateStatusDto,
} from "./dto/template-status.dto";
import { ApprovalStatusEnum, TemplateStatusEnum } from "../../../../service-lib/src/lib/constants";
import { UpdateTemplateDto } from "./dto/update-template.dto";
import { IBP_EMAIL_TEMPLATE_EVENT_TYPES, TemplateRepository } from "./template.repository";
import {
  serviceNames,
  APPROVAL_STATUS_DRAFT,
  APPROVAL_STATUS_APPROVED,
  APPROVAL_STATUS_REJECTED,
  APPROVAL_STATUS_PENDING_APPROVAL,
  TEMPLATE_ACTIVE_STATUS_ACTIVE,
  TEMPLATE_ACTIVE_STATUS_INACTIVE,
} from "../../../../service-lib/src/lib/constants";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class TemplateService implements OnModuleInit {
  private readonly logger: ReturnType<typeof createLogger>;
  private approvalStatusLookupCache: Map<number, string> = new Map();
  private activeStatusLookupCache: Map<number, string> = new Map();

  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly traceIdService: TraceIdService,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.NOTIFICATION_SERVICE);
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
    approvalStatuses.forEach(lookup => {
      const statusMap: Record<string, string> = {
        [APPROVAL_STATUS_DRAFT]: ApprovalStatusEnum.DRAFT,
        [APPROVAL_STATUS_APPROVED]: ApprovalStatusEnum.APPROVED,
        [APPROVAL_STATUS_REJECTED]: ApprovalStatusEnum.REJECTED,
        [APPROVAL_STATUS_PENDING_APPROVAL]: ApprovalStatusEnum.PENDING_APPROVAL,
      };
      this.approvalStatusLookupCache.set(lookup.id, statusMap[lookup.lookUpKey]);
    });

    // Initialize active status cache
    const activeStatuses = await this.lookUpRepository.find({
      where: [
        { lookUpKey: TEMPLATE_ACTIVE_STATUS_ACTIVE },
        { lookUpKey: TEMPLATE_ACTIVE_STATUS_INACTIVE },
      ],
    });
    activeStatuses.forEach(lookup => {
      const statusMap: Record<string, string> = {
        [TEMPLATE_ACTIVE_STATUS_ACTIVE]: TemplateStatusEnum.ACTIVE,
        [TEMPLATE_ACTIVE_STATUS_INACTIVE]: TemplateStatusEnum.INACTIVE,
      };
      this.activeStatusLookupCache.set(lookup.id, statusMap[lookup.lookUpKey]);
    });
  }

  private async getPendingApprovalLookupId(): Promise<number> {
    const lookup = await this.lookUpRepository.findOne({
      where: { lookUpKey: APPROVAL_STATUS_PENDING_APPROVAL },
    });
    if (!lookup) {
      throw new NotFoundException(`Lookup with key ${APPROVAL_STATUS_PENDING_APPROVAL} not found`);
    }
    return lookup.id;
  }

  // Most rows in this table predate activeStatusLid ever being set and sit
  // at NULL, not the ACTIVE lookup id (confirmed via DB: 35 of 68 default
  // rows) — matching only "resolves to ACTIVE" would mislabel all of those
  // as disabled. The correct check, matching notification.repository.ts's
  // send-path query, is "does NOT resolve to INACTIVE" — NULL/unset counts
  // as never-disabled.
  private isActiveRow(row: NotificationChannelEventTemplateMapping): boolean {
    return this.activeStatusLookupCache.get(Number(row.activeStatusLid)) !== TemplateStatusEnum.INACTIVE;
  }

  async checkEventConflict(
    templateId: number,
    eventTypeId: number,
    channelTypeKey: string,
    configId?: number | null
  ): Promise<{
    isMapped: boolean;
    conflictingTemplate?: { id: number; subject: string; channelType: string };
  }> {
    const conflict = await this.templateRepository.checkEventConflict(
      templateId,
      eventTypeId,
      channelTypeKey,
      configId
    );
    if (!conflict) return { isMapped: false };
    return {
      isMapped: true,
      conflictingTemplate: {
        id: conflict.id,
        subject: conflict.subject,
        channelType: (conflict as any).channelType?.channelType || "",
      },
    };
  }

  async createTemplate(
    createTemplateDto: CreateTemplateDto
  ): Promise<TemplateResponseDto> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        payload: { channelTypeId: createTemplateDto.channelTypeId },
        location: 'TemplateService',
        method: 'createTemplate',
      }),
    });

    try {
      const template = await this.templateRepository.create(createTemplateDto);
      const response = this.mapToResponseDto(template);

      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          payload: { templateId: template.id },
          location: 'TemplateService',
          method: 'createTemplate',
        }),
      });

      return response;
    } catch (error) {
      this.logger.log({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          payload: { error: (error as Error).message },
          location: 'TemplateService',
          method: 'createTemplate',
        }),
      });
      throw error;
    }
  }

  async getTemplate(id: number): Promise<TemplateResponseDto> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        payload: { templateId: id },
        location: 'TemplateService',
        method: 'getTemplate',
      }),
    });

    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    const response = this.mapToResponseDto(template);

    // companyId/companyName/overrideSubDomain are now populated directly by
    // mapToResponseDto off findById's configCompany join (see
    // template.repository.ts) — same as findAll, no separate lookup needed
    // here any more. canonicalDefaultTemplateId still needs its own
    // resolution: it's not a simple join, it's "find the sibling row with
    // configId IS NULL for this same event+channel", needed purely for
    // routing (Customise screens are keyed by the default's id even when
    // displaying an override's content). Override rows DO stay visible in
    // Template Management's flat list (by design — each one is its own
    // company's customization, not a hidden implementation detail), so
    // clicking one needs to open THAT company's own content directly, not
    // redirect to the shared default.
    if (template.configId != null) {
      const canonicalDefaultTemplateId = await this.templateRepository.resolveCanonicalDefaultTemplateId(id);
      response.canonicalDefaultTemplateId = canonicalDefaultTemplateId ?? undefined;
    }

    return response;
  }

  async getTemplates(query: GetTemplatesDto): Promise<PaginatedTemplateResponseDto> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        payload: query,
        location: 'TemplateService',
        method: 'getTemplates',
      }),
    });

    const { templates, total } = await this.templateRepository.findAll(query);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const totalPages = Math.ceil(total / limit);
    const mapped = templates.map(template => this.mapToResponseDto(template));

    // TEMP DIAGNOSTIC (2026-08-08) — remove once isCompanyCustomizable
    // wiring is confirmed live in the running environment. Logs exactly
    // what this method saw for each row on this page, so we can tell
    // "backend not serving the new field at all" apart from "eventType
    // name isn't matching the allow-list" from the terminal alone.
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        payload: {
          rows: mapped.map((t, i) => ({
            id: t.id,
            subject: t.subject,
            eventTypeId: t.eventTypeId,
            configId: (templates[i] as any)?.configId,
            eventTypeNameSeen: (templates[i] as any)?.eventType?.name,
            isCompanyCustomizable: t.isCompanyCustomizable,
          })),
        },
        location: 'TemplateService',
        method: 'getTemplates:DIAGNOSTIC',
      }),
    });

    return {
      templates: mapped,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async updateTemplate(id: number, updateTemplateDto: UpdateTemplateDto): Promise<TemplateResponseDto> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        payload: { templateId: id, updates: updateTemplateDto },
        location: 'TemplateService',
        method: 'updateTemplate',
      }),
    });

    const existingTemplate = await this.templateRepository.findById(id);
    if (!existingTemplate) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    // Check if template is in pending approval status (cannot be edited)
    const pendingApprovalId = await this.getPendingApprovalLookupId();
    if (Number(existingTemplate.approvalStatusLid) === pendingApprovalId) {
      throw new BadRequestException(`"${existingTemplate.subject}" template cannot be edited while pending approval`);
    }

    const updatedTemplate = await this.templateRepository.update(id, updateTemplateDto);
    if (!updatedTemplate) {
      throw new NotFoundException(`"${existingTemplate.subject}" template not found after update`);
    }

    return this.mapToResponseDto(updatedTemplate);
  }

  async deleteTemplate(id: number): Promise<void> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        payload: { templateId: id },
        location: 'TemplateService',
        method: 'deleteTemplate',
      }),
    });

    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    // Check if template is already inactive
    const inactiveStatusId = await this.lookUpRepository.findOne({
      where: { lookUpKey: TEMPLATE_ACTIVE_STATUS_INACTIVE },
    });
    
    if (template.activeStatusLid === inactiveStatusId?.id) {
      throw new BadRequestException(`"${template.subject}" template is already inactive`);
    }

    // Soft delete: Mark as inactive (approval history is preserved)
    const deleted = await this.templateRepository.softDelete(id);
    if (!deleted) {
      throw new BadRequestException(`Failed to deactivate "${template.subject}" template`);
    }

    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        payload: { templateId: id, message: 'Template marked as inactive' },
        location: 'TemplateService',
        method: 'deleteTemplate',
      }),
    });
  }

  private mapToResponseDto(template: NotificationChannelEventTemplateMapping): TemplateResponseDto {
    const templateWithExtras = template as any;
    
    // Parse variables from template content dynamically
    const variableRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    const variableNames = new Set<string>();
    const content = (template.body || '') + (template.subject || '');
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      variableNames.add(match[1]);
    }
    
    const variables = Array.from(variableNames).map((name: string) => ({
      name,
      description: `Template variable: ${name}`,
      dataType: 'string',
      example: `Sample ${name}`,
    }));

    const creator = templateWithExtras.creator;
    const updater = templateWithExtras.updater;

    // Convert to numbers to ensure Map lookup works (TypeORM might return as string)
    const approvalStatusId = Number(template.approvalStatusLid);
    const activeStatusId = Number(template.activeStatusLid);

    // Drives the "Customise" row action on Template Management — only for
    // IBP company/employee-facing event types (see
    // IBP_EMAIL_TEMPLATE_EVENT_TYPES) AND only on a genuine default row
    // (configId IS NULL). GET /templates has no configId filter, so a
    // company's own override row is just another row in the same result
    // set — customizing "from" an override row would pass that override's
    // own id where the override endpoints expect the default's id, and
    // upsertOverride explicitly rejects that (BadRequestException). Gating
    // here means an override row simply never offers Customise at all,
    // avoiding that dead-end before it can happen. `eventType` is only
    // present when the caller's query joined it (findAll does; findById
    // does too) — falls through to false rather than throwing when it isn't.
    const eventTypeName: string | undefined = templateWithExtras.eventType?.name;
    const isCompanyCustomizable = Boolean(
      template.configId == null &&
      eventTypeName &&
      IBP_EMAIL_TEMPLATE_EVENT_TYPES.includes(eventTypeName)
    );

    // Complementary set: iwork/internal-CRM event types (no domain concept
    // at all) get company-wide customization instead of domain-scoped —
    // see company_id on the entity. Same "genuine default row" gate as
    // isCompanyCustomizable, just the opposite allow-list membership.
    const isCompanyLevelCustomizable = Boolean(
      template.configId == null &&
      template.companyId == null &&
      eventTypeName &&
      !IBP_EMAIL_TEMPLATE_EVENT_TYPES.includes(eventTypeName)
    );

    // Populated via findById/findAll's configCompany join (see
    // template.repository.ts) whenever this row is an override — same data
    // resolveConfigCompanyInfo used to fetch separately, now available on
    // every row (list included) with no N+1. Stays undefined for a genuine
    // default row (configId is null, join simply doesn't match anything).
    const configCompany = templateWithExtras.configCompany;
    const companyId = template.configId != null ? (configCompany?.companyId ?? null) : undefined;
    const companyName = template.configId != null ? (configCompany?.company?.companyName ?? null) : undefined;
    const overrideSubDomain = template.configId != null ? (configCompany?.subDomain ?? null) : undefined;

    // Same idea, for a company-wide override row (directCompany comes from
    // findById/findAll's own join straight to Company via companyId — see
    // template.repository.ts). Distinct field names from companyId/
    // companyName above, which describe a CONFIG's owning company, not this
    // row's own direct scope.
    const directCompany = templateWithExtras.directCompany;
    const companyOverrideId = template.companyId ?? null;
    const companyOverrideCompanyName = template.companyId != null ? (directCompany?.companyName ?? null) : undefined;

    return {
      id: template.id,
      eventTypeId: template.eventTypeId,
      channelTypeId: template.channelTypeId,
      subject: template.subject,
      body: template.body,
      variables,
      approvalStatus: (this.approvalStatusLookupCache.get(approvalStatusId) || ApprovalStatusEnum.DRAFT) as ApprovalStatusEnum,
      // NULL/unset activeStatusLid (most rows — see isActiveRow) must read
      // as ACTIVE, not INACTIVE — this used to default straight to
      // INACTIVE on any cache miss, mislabeling every never-explicitly-set
      // row as disabled in the dashboard/status chip.
      status:
        this.activeStatusLookupCache.get(activeStatusId) === TemplateStatusEnum.INACTIVE
          ? TemplateStatusEnum.INACTIVE
          : TemplateStatusEnum.ACTIVE,
      organizationId: templateWithExtras.organizationId,
      createdBy: template.createdBy,
      updatedBy: template.updatedBy,
      createdByName: creator ? `${creator.firstName} ${creator.lastName}`.trim() : `User ${template.createdBy}`,
      updatedByName: updater ? `${updater.firstName} ${updater.lastName}`.trim() : `User ${template.updatedBy}`,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      isCompanyCustomizable,
      isCompanyLevelCustomizable,
      configId: template.configId ?? null,
      companyId,
      companyName,
      overrideSubDomain,
      companyOverrideId,
      companyOverrideCompanyName,
    };
  }

  // ---------------------------------------------------------------------
  // Company/config-scoped override methods (Customise Email Templates tab)
  // ---------------------------------------------------------------------

  async getEffectiveTemplates(
    configId: number,
    channelTypeKey = "email"
  ): Promise<EffectiveTemplateResponseDto[]> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { configId, channelTypeKey },
        location: "TemplateService",
        method: "getEffectiveTemplates",
      }),
    });

    try {
      const channelTypeId = await this.templateRepository.resolveChannelTypeIdByKey(channelTypeKey);
      if (!channelTypeId) {
        throw new NotFoundException(`Unknown channel type '${channelTypeKey}'`);
      }

      return await this.templateRepository.findEffectiveTemplates(configId, channelTypeId);
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, configId, channelTypeKey },
          location: "TemplateService",
          method: "getEffectiveTemplates",
        }),
      });
      throw error;
    }
  }

  /**
   * Same idea as getEffectiveTemplates, scoped by companyId instead of
   * configId — for iwork/internal-CRM event types with no domain concept.
   */
  async getEffectiveTemplatesForCompany(
    companyId: number,
    channelTypeKey = "email"
  ): Promise<EffectiveTemplateResponseDto[]> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { companyId, channelTypeKey },
        location: "TemplateService",
        method: "getEffectiveTemplatesForCompany",
      }),
    });

    try {
      const channelTypeId = await this.templateRepository.resolveChannelTypeIdByKey(channelTypeKey);
      if (!channelTypeId) {
        throw new NotFoundException(`Unknown channel type '${channelTypeKey}'`);
      }

      return await this.templateRepository.findEffectiveTemplatesForCompany(companyId, channelTypeId);
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, companyId, channelTypeKey },
          location: "TemplateService",
          method: "getEffectiveTemplatesForCompany",
        }),
      });
      throw error;
    }
  }

  async saveTemplateOverride(
    defaultTemplateId: number,
    dto: SaveTemplateOverrideDto,
    userId: number
  ): Promise<EffectiveTemplateResponseDto> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId, configId: dto.configId },
        location: "TemplateService",
        method: "saveTemplateOverride",
      }),
    });

    try {
      const { template } = await this.templateRepository.upsertOverride(
        defaultTemplateId,
        dto.configId,
        dto.subject,
        dto.body,
        userId
      );

      return {
        eventTypeId: template.eventTypeId as number,
        eventTypeName: "",
        channelTypeId: template.channelTypeId,
        defaultTemplateId,
        isOverride: true,
        overrideTemplateId: template.id,
        subject: template.subject,
        body: template.body,
        isActive: this.isActiveRow(template),
      };
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId, configId: dto.configId },
          location: "TemplateService",
          method: "saveTemplateOverride",
        }),
      });
      throw error;
    }
  }

  async deleteTemplateOverride(
    defaultTemplateId: number,
    configId: number,
    userId: number
  ): Promise<EffectiveTemplateResponseDto> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId, configId },
        location: "TemplateService",
        method: "deleteTemplateOverride",
      }),
    });

    try {
      const defaultTemplate = await this.templateRepository.deleteOverride(defaultTemplateId, configId, userId);

      return {
        eventTypeId: defaultTemplate.eventTypeId as number,
        eventTypeName: "",
        channelTypeId: defaultTemplate.channelTypeId,
        defaultTemplateId: defaultTemplate.id,
        isOverride: false,
        subject: defaultTemplate.subject,
        body: defaultTemplate.body,
        isActive: this.isActiveRow(defaultTemplate),
      };
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId, configId },
          location: "TemplateService",
          method: "deleteTemplateOverride",
        }),
      });
      throw error;
    }
  }

  async saveCompanyTemplateOverride(
    defaultTemplateId: number,
    dto: SaveCompanyTemplateOverrideDto,
    userId: number
  ): Promise<EffectiveTemplateResponseDto> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId, companyId: dto.companyId },
        location: "TemplateService",
        method: "saveCompanyTemplateOverride",
      }),
    });

    try {
      const { template } = await this.templateRepository.upsertCompanyOverride(
        defaultTemplateId,
        dto.companyId,
        dto.subject,
        dto.body,
        userId
      );

      return {
        eventTypeId: template.eventTypeId as number,
        eventTypeName: "",
        channelTypeId: template.channelTypeId,
        defaultTemplateId,
        isOverride: true,
        overrideTemplateId: template.id,
        subject: template.subject,
        body: template.body,
        isActive: this.isActiveRow(template),
      };
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId, companyId: dto.companyId },
          location: "TemplateService",
          method: "saveCompanyTemplateOverride",
        }),
      });
      throw error;
    }
  }

  async deleteCompanyTemplateOverride(
    defaultTemplateId: number,
    companyId: number,
    userId: number
  ): Promise<EffectiveTemplateResponseDto> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId, companyId },
        location: "TemplateService",
        method: "deleteCompanyTemplateOverride",
      }),
    });

    try {
      const defaultTemplate = await this.templateRepository.deleteCompanyOverride(defaultTemplateId, companyId, userId);

      return {
        eventTypeId: defaultTemplate.eventTypeId as number,
        eventTypeName: "",
        channelTypeId: defaultTemplate.channelTypeId,
        defaultTemplateId: defaultTemplate.id,
        isOverride: false,
        subject: defaultTemplate.subject,
        body: defaultTemplate.body,
        isActive: this.isActiveRow(defaultTemplate),
      };
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId, companyId },
          location: "TemplateService",
          method: "deleteCompanyTemplateOverride",
        }),
      });
      throw error;
    }
  }

  /**
   * Disable/enable the shared default (dto.configId omitted) or one
   * company/domain's override (dto.configId given). See
   * TemplateRepository.setActiveStatus for why this is more than a label —
   * it's the one status column the send path always enforces.
   */
  async setTemplateStatus(
    defaultTemplateId: number,
    dto: UpdateTemplateStatusDto,
    userId: number
  ): Promise<TemplateStatusResponseDto> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId, configId: dto.configId, active: dto.active },
        location: "TemplateService",
        method: "setTemplateStatus",
      }),
    });

    try {
      await this.templateRepository.setActiveStatus(
        defaultTemplateId,
        dto.active,
        dto.configId,
        userId,
        dto.companyId
      );

      return {
        defaultTemplateId,
        configId: dto.configId,
        companyId: dto.companyId,
        isActive: dto.active,
      };
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId, configId: dto.configId, companyId: dto.companyId },
          location: "TemplateService",
          method: "setTemplateStatus",
        }),
      });
      throw error;
    }
  }

  /**
   * Every company/domain that already has a customization of this default
   * template — powers the "Customise" drill-down detail view on Template
   * Management. See PRD §5 / TRD §3.3.
   */
  async getTemplateOverridesSummary(defaultTemplateId: number): Promise<TemplateOverrideSummaryResponseDto[]> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId },
        location: "TemplateService",
        method: "getTemplateOverridesSummary",
      }),
    });

    try {
      const overrides = await this.templateRepository.findOverridesForTemplate(defaultTemplateId);

      return overrides.map((override) => ({
        configId: override.configId,
        companyId: override.companyId,
        // Fallback label when the company/config relation resolves to
        // nothing usable (deleted/renamed company, cleared company_id) —
        // never show a blank cell in the overrides list.
        companyName: override.companyName ?? (override.companyId != null ? `Company #${override.companyId}` : "Unknown company"),
        subDomain: override.subDomain,
        subject: override.subject,
        updatedAt: override.updatedAt,
        isActive: override.isActive,
      }));
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId },
          location: "TemplateService",
          method: "getTemplateOverridesSummary",
        }),
      });
      throw error;
    }
  }

  /**
   * Every company that already has a company-wide customization of this
   * default template — same idea as getTemplateOverridesSummary, scoped by
   * companyId instead of configId.
   */
  async getCompanyTemplateOverridesSummary(defaultTemplateId: number): Promise<TemplateCompanyOverrideSummaryResponseDto[]> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId },
        location: "TemplateService",
        method: "getCompanyTemplateOverridesSummary",
      }),
    });

    try {
      const overrides = await this.templateRepository.findCompanyOverridesForTemplate(defaultTemplateId);

      return overrides.map((override) => ({
        companyId: override.companyId,
        companyName: override.companyName ?? `Company #${override.companyId}`,
        subject: override.subject,
        updatedAt: override.updatedAt,
        isActive: override.isActive,
      }));
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId },
          location: "TemplateService",
          method: "getCompanyTemplateOverridesSummary",
        }),
      });
      throw error;
    }
  }

  async getTemplateChangeLog(
    defaultTemplateId: number,
    configId?: number | null,
    companyId?: number | null
  ): Promise<TemplateChangeLogEntryResponseDto[]> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId, configId, companyId },
        location: "TemplateService",
        method: "getTemplateChangeLog",
      }),
    });

    try {
      const entries = await this.templateRepository.findChangeLog(defaultTemplateId, configId, companyId);

      return entries.map((entry) => {
        const changedByUser = (entry as unknown as { changedByUser?: { firstName?: string; lastName?: string } }).changedByUser;
        return {
          action: entry.action,
          oldSubject: entry.oldSubject,
          oldBody: entry.oldBody,
          newSubject: entry.newSubject,
          newBody: entry.newBody,
          changedBy: entry.changedBy,
          changedByName: changedByUser
            ? `${changedByUser.firstName ?? ""} ${changedByUser.lastName ?? ""}`.trim() || undefined
            : undefined,
          changedAt: entry.changedAt,
        };
      });
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId, configId },
          location: "TemplateService",
          method: "getTemplateChangeLog",
        }),
      });
      throw error;
    }
  }
}