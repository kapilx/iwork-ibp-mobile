import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { UpsertConfigScopeDto } from "./dto/upsert-config-scope.dto";
import type { Request } from "express";
import {
  CompanyConfigActionResponse,
  CompanyPolicyFeatureDocumentResponse,
  CompanyConfigService,
  CompanyConfigResponse,
  PortalConfigListItem,
} from "./company-config.service";
import { UpdateCompanyPortalConfigDto } from "./dto/update-company-portal-config.dto";
import { CompanyConfigSubmissionDto } from "./dto/company-config-submission.dto";
import { CompanyConfigApprovalDto } from "./dto/company-config-approval.dto";
import { UpdateCompanyPolicyFeatureDocumentDto } from "./dto/update-company-policy-feature-document.dto";
import { UpdateCompanyOnboardingMailModeDto } from "./dto/update-company-onboarding-mail-mode.dto";
import { TriggerCompanyOnboardingMailDto } from "./dto/trigger-company-onboarding-mail.dto";
import {
  getAllCompanyConfigsSwagger,
  upsertCompanyPortalConfigurationSwagger,
  getCompanyPortalConfigurationSwagger,
  submitCompanyConfigForApprovalSwagger,
  approveCompanyConfigSwagger,
  getCompanyPolicyFeatureDocumentSwagger,
  updateCompanyPolicyFeatureDocumentSwagger,
  getCompanyOnboardingMailModeSwagger,
  updateCompanyOnboardingMailModeSwagger,
  triggerCompanyOnboardingMailsSwagger,
} from "./company-config.swagger";
import { getAllAuthMethodsSwagger } from "../auth-config/auth-config.swagger";
import { JwtService } from "@nestjs/jwt";

@Controller("config-company")
export class CompanyConfigController {
  constructor(
    private readonly companyConfigService: CompanyConfigService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * GET /api/config/company/list/all
   * Get all company configurations
   */
  @Get("list/all")
  @getAllCompanyConfigsSwagger()
  async getAllConfigs(): Promise<CompanyConfigResponse[]> {
    return this.companyConfigService.getAllConfigs();
  }

  /**
   * GET /api/config/company/methods
   * Get all available authentication methods
   */
  @Get("methods")
  @getAllAuthMethodsSwagger()
  async getAllAuthMethods() {
    const methods = await this.companyConfigService.getAllAuthMethods();
    return {
      statusCode: HttpStatus.OK,
      message: "Authentication methods retrieved successfully",
      data: methods,
    };
  }

  /**
   * PUT /api/config/company/portal
   * Update company portal and authentication configuration payload
   */
  @Put("portal")
  @upsertCompanyPortalConfigurationSwagger()
  async upsertCompanyPortalConfiguration(
    @Body() payload: UpdateCompanyPortalConfigDto,
    @Req() req: Request
  ): Promise<CompanyConfigResponse> {
    const userIdHeader = this.getUserIdFromRequest(req);
    return this.companyConfigService.upsertCompanyPortalConfiguration(
      payload,
      userIdHeader as string | number | undefined
    );
  }

  /**
   * GET /api/config/company/domain-company-ids
   * Returns all company IDs that already have a subDomain configured (used to filter dropdown)
   */
  @Get("domain-company-ids")
  async getDomainConfiguredCompanyIds() {
    return this.companyConfigService.getDomainConfiguredCompanyIds();
  }

  /**
   * GET /api/config/company/portal/config/:configId
   * Get a specific portal configuration by its own ID (multi-portal support)
   */
  @Get("portal/config/:configId")
  async getPortalConfigurationById(
    @Param("configId", ParseIntPipe) configId: number
  ) {
    return this.companyConfigService.getPortalConfigurationById(configId);
  }

  /**
   * GET /api/config/company/portal/list/:companyId
   * List all portal configurations for a company (multi-portal support)
   */
  @Get("portal/list/:companyId")
  async listPortalConfigurations(
    @Param("companyId", ParseIntPipe) companyId: number
  ): Promise<{ statusCode: number; data: PortalConfigListItem[] }> {
    const data = await this.companyConfigService.listPortalConfigurations(companyId);
    return { statusCode: HttpStatus.OK, data };
  }

  /**
   * POST /api/config/company/portal
   * Create a new portal configuration for a company (never upserts existing)
   */
  @Post("portal")
  async createPortalConfiguration(
    @Body() payload: UpdateCompanyPortalConfigDto,
    @Req() req: Request
  ): Promise<CompanyConfigResponse> {
    const userIdHeader = this.getUserIdFromRequest(req);
    return this.companyConfigService.upsertCompanyPortalConfiguration(
      { ...payload, _forceCreate: true },
      userIdHeader as string | number | undefined
    );
  }

  /**
   * DELETE /api/config/company/portal/:configId
   * Delete a specific portal configuration (scope rows are preserved)
   */
  @Delete("portal/:configId")
  async deletePortalConfiguration(
    @Param("configId", ParseIntPipe) configId: number,
  ) {
    const result = await this.companyConfigService.deletePortalConfiguration(configId);
    return { statusCode: HttpStatus.OK, ...result };
  }

  /**
   * GET /api/config/company/portal/:companyId
   * Get portal config payload for a company
   */
  @Get("portal/:companyId")
  @getCompanyPortalConfigurationSwagger()
  async getCompanyPortalConfiguration(
    @Param("companyId", ParseIntPipe) companyId: number
  ) {
    return this.companyConfigService.getCompanyPortalConfiguration(companyId);
  }

  /**
   * POST /api/config/company/submission
   * Send a company configuration for approval
   */
  @Post("submission")
  @submitCompanyConfigForApprovalSwagger()
  async submitCompanyConfigForApproval(
    @Body() payload: CompanyConfigSubmissionDto,
    @Req() req: Request
  ): Promise<CompanyConfigActionResponse> {
    const userIdHeader = this.getUserIdFromRequest(req);
    return this.companyConfigService.submitCompanyConfigForApproval(
      payload,
      userIdHeader as string | number | undefined
    );
  }

  /**
   * PUT /api/config/company/approval
   * Approve or reject a company configuration
   */
  @Put("approval")
  @approveCompanyConfigSwagger()
  async approveCompanyConfig(
    @Body() payload: CompanyConfigApprovalDto,
    @Req() req: Request
  ): Promise<CompanyConfigActionResponse> {
    const userIdHeader = this.getUserIdFromRequest(req);
    return this.companyConfigService.approveCompanyConfig(
      payload,
      userIdHeader as string | number | undefined
    );
  }

  @Put("policy-feature-document")
  @updateCompanyPolicyFeatureDocumentSwagger()
  async updateCompanyPolicyFeatureDocument(
    @Body() payload: UpdateCompanyPolicyFeatureDocumentDto,
    @Req() req: Request
  ): Promise<CompanyPolicyFeatureDocumentResponse> {
    const userIdHeader = this.getUserIdFromRequest(req);
    return this.companyConfigService.updateCompanyPolicyFeatureDocument(
      payload,
      userIdHeader as string | number | undefined
    );
  }

  @Get("policy-feature-document/:companyId")
  @getCompanyPolicyFeatureDocumentSwagger()
  async getCompanyPolicyFeatureDocument(
    @Param("companyId", ParseIntPipe) companyId: number
  ) {
    return this.companyConfigService.getCompanyPolicyFeatureDocument(companyId);
  }

  @Delete("policy-feature-document/:companyId")
  async deleteCompanyPolicyFeatureDocument(
    @Param("companyId", ParseIntPipe) companyId: number
  ) {
    return this.companyConfigService.deleteCompanyPolicyFeatureDocument(companyId);
  }

  @Get("onboarding-mail-mode/:companyId")
  @getCompanyOnboardingMailModeSwagger()
  async getCompanyOnboardingMailMode(
    @Param("companyId", ParseIntPipe) companyId: number,
  ) {
    return this.companyConfigService.getCompanyOnboardingMailMode(companyId);
  }

  @Put("onboarding-mail-mode")
  @updateCompanyOnboardingMailModeSwagger()
  async updateCompanyOnboardingMailMode(
    @Body() payload: UpdateCompanyOnboardingMailModeDto,
    @Req() req: Request,
  ) {
    const userIdHeader = this.getUserIdFromRequest(req);
    return this.companyConfigService.updateCompanyOnboardingMailMode(
      payload,
      userIdHeader as string | number | undefined,
    );
  }

  @Post("onboarding-mail-trigger")
  @triggerCompanyOnboardingMailsSwagger()
  async triggerCompanyOnboardingMails(
    @Body() payload: TriggerCompanyOnboardingMailDto,
  ) {
    return this.companyConfigService.triggerCompanyOnboardingMails(payload);
  }

  private getUserIdFromRequest(req: Request): string | number | undefined {
    const headers = req?.headers ?? {};
    const headerUserId =
      this.normalizeHeaderValue(headers.userid) ??
      this.normalizeHeaderValue(headers.userId) ??
      this.normalizeHeaderValue(headers["user-id"]);
    if (headerUserId) {
      return headerUserId;
    }

    const user = (req as any).user;
    if (user?.userDetails?.userId) {
      return user.userDetails.userId;
    }

    const authorizationHeader = this.normalizeHeaderValue(headers.authorization);
    if (!authorizationHeader) {
      return undefined;
    }

    const token = authorizationHeader.includes(" ")
      ? authorizationHeader.split(" ")[1]
      : authorizationHeader;
    if (!token) {
      return undefined;
    }

    try {
      const decoded = this.jwtService.verify<Record<string, any>>(token);
      return decoded?.userDetails?.userId;
    } catch {
      return undefined;
    }
  }

  private normalizeHeaderValue(value: string | string[] | undefined): string | undefined {
    if (!value) {
      return undefined;
    }
    return Array.isArray(value) ? value[0] : value;
  }

  /**
   * GET /api/config/company/scope/:configId
   * Get domain policy+location scope for a portal configuration
   */
  @Get("scope/:configId")
  async getConfigScope(@Param("configId", ParseIntPipe) configId: number) {
    const data = await this.companyConfigService.getConfigScope(configId);
    return { statusCode: HttpStatus.OK, data };
  }

  /**
   * POST /api/config/company/scope/:configId
   * Upsert domain policy+location scope (replaces all existing rows for this configId)
   */
  @Post("scope/:configId")
  async upsertConfigScope(
    @Param("configId", ParseIntPipe) configId: number,
    @Body() dto: UpsertConfigScopeDto,
  ) {
    const result = await this.companyConfigService.upsertConfigScope(configId, dto);
    return { statusCode: HttpStatus.OK, message: "Scope saved", data: result };
  }

  /**
   * GET /api/config/company/scope/company/:companyId/taken?excludeConfigId=N
   * Returns policy IDs already assigned to other domain configs for this company
   */
  @Get("scope/company/:companyId/taken")
  async getTakenPolicies(
    @Param("companyId", ParseIntPipe) companyId: number,
    @Query("excludeConfigId", ParseIntPipe) excludeConfigId: number,
  ) {
    const data = await this.companyConfigService.getTakenPolicies(companyId, excludeConfigId);
    return { statusCode: HttpStatus.OK, data };
  }
}
