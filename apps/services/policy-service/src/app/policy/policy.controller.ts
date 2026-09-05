import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  Req,
  Res,
  Post,
  Body,
  Put,
  Delete,
  NotFoundException,
  HttpException,
  DefaultValuePipe,
  ParseBoolPipe,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApplyMasking, ResponseMaskingInterceptor } from "../../../../service-lib/src/lib/field-masking";
import { JwtService } from "@nestjs/jwt";
import type { Request, Response } from "express";
import { PolicyExtensionService } from "./policy-extension.service";
import { PolicyService } from "./policy.service";
import { CompanyCdListQueryDto } from "./dto/company-cd-query.dto";
import { GetTatSummaryQueryDto } from "./dto/get-tat-summary-query.dto";
import { GetTatBucketsQueryDto } from "./dto/get-tat-buckets-query.dto";
import { GetMigrationLogsDto } from "./dto/get-migration-logs.dto";
import {
  createErrorResponse,
  createResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import {
  getPolicyByIdSwaggerMetadata,
  getPoliciesByCompanySwaggerMetadata,
  getPoliciesByOpportunitySwaggerMetadata,
  createPolicyConfigurationSwaggerMetadata,
  updatePolicyConfigurationSwaggerMetadata,
  getPolicyConfigurationByIdSwaggerMetadata,
  listPolicyConfigurationsSwaggerMetadata,
  deletePolicyConfigurationSwaggerMetadata,
  approvalPolicyConfigurationSwaggerMetadata,
  queueEnrollmentUploadSwaggerMetadata,
  listEnrollmentUploadSummarySwaggerMetadata,
  getAllOpportunitiesSwaggerMetadata,
  getPolicyConstraintsSwaggerMetadata,
  generateTemplateSwaggerMetadata,
  downloadTemplateByIdSwaggerMetadata,
  downloadTPAUploadTemplateSwaggerMetadata,
  uploadEndorsementTemplateSwaggerMetadata,
  downloadEndorsementExcelSwaggerMetadata,
  createEndorsementFieldMappingSwaggerMetadata,
  getPolicyDashboardDetailsSwaggerMetadata,
  listEndorsementBatchesSwaggerMetadata,
  acknowledgeEndorsementSwaggerMetadata,
  uploadTpaIdSwaggerMetadata,
  getTpaIdUploadsSwaggerMetadata,
  searchEndorsementBatchesSwaggerMetadata,
  inceptionCreatePolicySwaggerMetadata,
  listEndorsementBatchesTrackerSwaggerMetadata,
  getCompanyCautionDepositsSwaggerMetadata,
  getCautionDepositByIdSwaggerMetadata,
  getCautionDepositsByCompanySwaggerMetadata,
  getCautionDepositTransactionsByCautionDepositIdSwaggerMetadata,
  createCompanyCautionDepositSwaggerMetadata,
  getCompanyPoliciesSummarySwaggerMetadata,
  getPolicyTatSummarySwaggerMetadata,
  getPolicyTatBucketsSwaggerMetadata,
  listAssetEndorsementBatchesTrackerSwaggerMetadata,
  getPolicySubAssetsSwaggerMetadata,
  getPolicyAssetsSwaggerMetadata,
  generateExcelFromJsonSwaggerMetadata,
  updatePolicyCoverSwaggerMetadata,
  updateCautionDepositAccountNumberSwaggerMetadata,
  mergeCautionDepositsSwaggerMetadata,
  activatePolicySwaggerMetadata,
  submitPolicySectionSwaggerMetadata,
  approvePolicySectionSwaggerMetadata,
  getPolicySectionStatusesSwaggerMetadata,
  bulkUpdatePoliciesSwaggerMetadata,
  listEndorsementManagementBatchesSwaggerMetadata,
  getDashboardBusinessPerformanceSwaggerMetadata,
  getNewDashboardBusinessPerformanceSwaggerMetadata,
  getDashboardPolicySummarySwaggerMetadata,
  getQuarterlyDashboardBusinessPerformanceSwaggerMetadata,
  getQuarterlyDashboardBusinessPerformanceBySbuSwaggerMetadata,
  generatePerformanceOutputSwaggerMetadata,
  getBrokerageToCollectSwaggerMetadata,
  getPolicyReportSwaggerMetadata,
  getPolicyReportListSwaggerMetadata,
  getPolicyReportExcelSwaggerMetadata,
  listEndorsementStepsSwaggerMetadata,
  updatePolicySwaggerMetadata,
  updateCautionDepositSwaggerMetadata,
  getCautionDepositsByPolicySwaggerMetadata,
  getPoliciesByContactSwaggerMetadata,
  getPolicyInsurersSwaggerMetadata,
  getPolicyDocumentsSwaggerMetadata,
  queueAssetEnrollmentUploadSwaggerMetadata,
  getPolicyEndorsementStepsSwaggerMetadata,
  getEndorsementStepsSwaggerMetadata,
  getAssetEndorsementStepsSwaggerMetadata,
  updateEndorsementStepsSwaggerMetadata,
  updateEndorsementHeadersSwaggerMetadata,
  updateAssetEndorsementStepsSwaggerMetadata,
  getCautionDepositTransactionsByPolicySwaggerMetadata,
  sendEndorsementNotificationEmailSwaggerMetadata,
  getInsurerDocumentStatusSwaggerMetadata,
  updateInsurerDocumentStatusSwaggerMetadata,
  uploadPolicyComponentConfigurationSwaggerMetadata,
  getPolicyTypesSwaggerMetadata,
  getPolicyContactsSwaggerMetadata,
  createPolicyContactsSwaggerMetadata,
  migratePoliciesSwaggerMetadata,
  getMigrationLogsSwaggerMetadata,
} from "./policy.swagger";
import { ApiTags } from "@nestjs/swagger";
import {
  GetPolicyListDto,
  GetPolicyReportDto,
  GeneratePerformanceDto,
  GetInsurersBrokerageDto,
} from "./dto/get-policy.dto";
import { CreatePolicyConfigurationDto } from "./dto/create-policy-configuration.dto";
import { UpdatePolicyConfigurationDto } from "./dto/update-policy-configuration.dto";
import { UpdatePolicyConfigurationApprovalDto } from "./dto/update-policy-configuration-approval.dto";
import { ActivatePolicyDto } from "./dto/activate-policy.dto";
import { UpdateEndorsementHeadersDto } from "./dto/update-endorsement-headers.dto";
import { GetPolicyConfigurationListDto } from "./dto/get-policy-configuration.dto";
import { ExportPolicyConfigurationDto } from "./dto/export-policy-configuration.dto";
import { GetPolicyScopeSummaryDto } from "./dto/get-policy-scope-summary.dto";
import { GetPolicyTypesByCompanyDto } from "./dto/get-policy-types-by-company.dto";
import {
  successMessage,
  errorMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  DEFAULT_VALUES,
  serviceNames,
  EXCEL_TEMPLATE_FILE_NAMES,
  NOTIFICATION_EMAIL,
  EMPLOYEE_INSURED_EXCEL_METHOD_NAME,
  EMPLOYEE_INSURED_EXCEL_SUCCESS_MESSAGE,
  EMPLOYEE_INSURED_EXCEL_ERROR_MESSAGE,
  CONTACT_STATUS,
} from "../../../../service-lib/src/lib/constants";
import {
  POLICY_SECTION_APPROVAL_SECTIONS,
  ROLES,
  POLICY_CONFIGURATION_STATUS_LIVE_EDIT_PENDING_APPROVAL,
  INSURER_PARTICIPANT_TYPE,
  ROLE_KEY,
  BOOLEAN_VALUES,
  OWNER_TYPES
} from "../../../../../../libs/service-lib/src/lib/constants";
import { GetPolicyQueryDto } from "./dto/get-all-policy.dto";
import { GetServiceScoreChartQueryDto } from "./dto/get-service-score-chart-query.dto";
import { GetPolicyKpiDto } from "./dto/get-policy-kpi.dto";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { CreateEndorsementFieldMappingDto } from "./dto/create-endorsement-field-mapping.dto";
import { UpdateEndorsementAcknowledgementDto } from "./dto/update-endorsement-acknowledgement.dto";
import { GetEndorsementBatchesDto } from "./dto/get-endorsement-batches.dto";
import { GetEndorsementStepsDto } from "./dto/get-endorsement-steps.dto";
import { UpdateCautionDepositDto } from "./dto/update-caution-deposit.dto";
import { UpdateCautionDepositAccountNumberDto } from "./dto/update-caution-deposit-account-number.dto";
import { CreateCautionDepositDto } from "./dto/create-caution-deposit.dto";
import { UpsertBusinessTargetDto } from "./dto/upsert-business-target.dto";
import { BusinessTargetReportQueryDto } from "./dto/business-target-report-query.dto";
import { MergeCautionDepositDto } from "./dto/merge-caution-deposit.dto";
import { CreatePolicyDto } from "./dto/policy.dto";
import { PolicyComponentUploadDto } from "./dto/policy-component-upload.dto";
import { EndorsementNotificationEmail } from "./dto/send-policy-email.dto";
import {
  GetPolicyAssetsDto,
  GetPolicySubAssetsDto,
} from "./dto/get-policy-assets.dto";
import { PolicyBulkUpdateDto } from "./dto/policy-bulk-update.dto";
import { UpdatePolicyCoverDto } from "./dto/update-policy-cover.dto";
import {
  PolicySectionApprovalDto,
  PolicySectionIdentifier,
  PolicySectionSubmissionDto,
} from "./dto/policy-section-approval.dto";
import { UpdatePolicyDTO } from "./dto/update-policy.dto";
import { bulkUploadFaqSwaggerMetadata } from "../portal-configuration/portal-configuration.swagger";
import { BulkUploadFaqDto } from "../portal-configuration/dto/bulk-upload-faq.dto";
import { CreatePolicyInstallmentDto } from "./dto/create-policy-installment.dto";
import { UpdatePolicyInstallmentDto } from "./dto/update-policy-installment.dto";
import { resolveEmployeeInsuredSearchParams } from "../../../../../../libs/service-lib/src/lib/utils/employee-insured.utils";
import { InjectRepository } from "@nestjs/typeorm";
import { LookUp, PolicyInsurerMap } from "../../../../service-lib/src/lib/entities";
import { Repository } from "typeorm";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { PolicyTypeQueryDto } from "./dto/policy-type-query.dto";
import { CreatePolicyContactsDto } from "./dto/policy-insurer-details.dto";
import { MirReportService, SubmitMirDto } from "./mir-report.service";

const cautionDepositIdParsePipe = new ParseIntPipe({
  exceptionFactory: () =>
    new BadRequestException(errorMessages.cautionDepositInvalidIdentifier),
});

@ApiTags("Policy")
@Controller("policy")
export class PolicyController {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly sectionSubmissionMessages: Record<
    PolicySectionIdentifier,
    string
  > = {
    [POLICY_SECTION_APPROVAL_SECTIONS.POLICY_DETAILS]:
      successMessage.policySectionSubmitted,
    [POLICY_SECTION_APPROVAL_SECTIONS.POLICY_CD]:
      successMessage.cautionDepositSectionSubmitted,
    [POLICY_SECTION_APPROVAL_SECTIONS.POLICY_COVERS]:
      successMessage.coversSectionSubmitted,
  };
  private readonly sectionApprovalMessages: Record<
    PolicySectionIdentifier,
    string
  > = {
    [POLICY_SECTION_APPROVAL_SECTIONS.POLICY_DETAILS]:
      successMessage.policySectionApprovalUpdated,
    [POLICY_SECTION_APPROVAL_SECTIONS.POLICY_CD]:
      successMessage.cautionDepositSectionApprovalUpdated,
    [POLICY_SECTION_APPROVAL_SECTIONS.POLICY_COVERS]:
      successMessage.coversSectionApprovalUpdated,
  };
  private getSubmissionSuccessMessage(
    section: PolicySectionIdentifier
  ): string {
    return (
      this.sectionSubmissionMessages[section] ||
      successMessage.policySectionSubmitted
    );
  }
  private getApprovalSuccessMessage(section: PolicySectionIdentifier): string {
    return (
      this.sectionApprovalMessages[section] ||
      successMessage.policySectionApprovalUpdated
    );
  }
  constructor(
    private policyService: PolicyService,
    private readonly policyExtensionService: PolicyExtensionService,
    private readonly scopeService: ScopeService,
    private readonly traceIdService: TraceIdService,
    private readonly jwtService: JwtService,
    private readonly mirReportService: MirReportService,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(PolicyInsurerMap)
    private readonly policyInsurerMapRepo: Repository<PolicyInsurerMap>,
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.POLICY_SERVICE
    );
  }

  @Get("policies")
  @getAllOpportunitiesSwaggerMetadata()
  async getAllPolicies(
    @Query() getPoliciesDto: GetPolicyQueryDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "getAllPolicies",
          messageData: "method invoked",
        }),
      });
      const {
        sort,
        page,
        limit,
        search,
        searchBy,
        field,
        from,
        to,
        period,
        month,
        financialYear,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        ownerId,
        viewBy,
        renewalPeriod,
        policyId,
        iirmPolicyTypeLid,
        insurerId,
        businessMonth,
        insurerBranchId,
        branchViewBy,
      } = getPoliciesDto;
      const policies = await this.policyService.getAllPolicies(
        page || DEFAULT_VALUES.PAGE,
        limit || DEFAULT_VALUES.LIMIT,
        search || "",
        sort,
        searchBy,
        userId,
        field,
        from,
        to || null,
        period,
        month,
        financialYear,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        ownerId,
        viewBy,
        renewalPeriod,
        policyId,
        iirmPolicyTypeLid,
        insurerId,
        businessMonth,
        false, // groupByCompany
        false, // forceActive
        undefined, // scopedCompanyId
        false, // pastCompanies
        insurerBranchId,
        branchViewBy
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policies retrieved successfully",
            policies
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "PolicyController",
          method: "getAllPolicies",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : "Failed to fetch policies."
          )
        );
    }
  }

  @Get("portfolio/companies")
  @getAllOpportunitiesSwaggerMetadata()
  async getPortfolioCompanies(
    @Query() getPoliciesDto: GetPolicyQueryDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "getPortfolioCompanies",
          messageData: "method invoked",
        }),
      });
      const {
        sort,
        page,
        limit,
        search,
        searchBy,
        field,
        from,
        to,
        period,
        month,
        financialYear,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        ownerId,
        viewBy,
        renewalPeriod,
        policyId,
        iirmPolicyTypeLid,
        insurerId,
        pastCompanies,
        serviceScore,
        recursiveTeam,
      } = getPoliciesDto;
      const portfolio = await this.policyService.getPortfolioCompanies(
        page || DEFAULT_VALUES.PAGE,
        limit || DEFAULT_VALUES.LIMIT,
        search || "",
        sort,
        searchBy,
        userId,
        field,
        from,
        to || null,
        period,
        month,
        financialYear,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        ownerId,
        viewBy,
        renewalPeriod,
        policyId,
        iirmPolicyTypeLid,
        insurerId,
        pastCompanies,
        serviceScore,
        recursiveTeam,
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Portfolio companies retrieved successfully",
            portfolio
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "PolicyController",
          method: "getPortfolioCompanies",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch portfolio companies."
          )
        );
    }
  }

  @Get("service-score")
  async getServiceScoreChart(
    @Query() query: GetServiceScoreChartQueryDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "getServiceScoreChart",
          messageData: "method invoked",
        }),
      });
      const chart = await this.policyService.getServiceScoreChart(
        userId,
        query.companyId,
        {
          financialYear: query.financialYear,
          quarter: query.quarter,
          month: query.month,
          from: query.from,
          to: query.to,
        }
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Service Score chart data retrieved successfully",
            chart
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyController",
          method: "getServiceScoreChart",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch Service Score chart data."
          )
        );
    }
  }

  @Get("endorsement-batches")
  @searchEndorsementBatchesSwaggerMetadata()
  async searchEndorsementBatches(
    @Query() query: GetEndorsementBatchesDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "searchEndorsementBatches",
          messageData: "method invoked",
        }),
      });
      const { page, limit, search, sort, searchBy } = query;
      const data = await this.policyService.searchEndorsementBatches(
        page || DEFAULT_VALUES.PAGE,
        limit || DEFAULT_VALUES.LIMIT,
        search || "",
        sort || "",
        searchBy || "",
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Batches retrieved", data));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "PolicyController",
          method: "searchEndorsementBatches",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch endorsement batches."
          )
        );
    }
  }

  @Get("endorsement-management-batches")
  @listEndorsementManagementBatchesSwaggerMetadata()
  async searchEndorsementManagementBatches(
    @Query() query: GetEndorsementBatchesDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "searchEndorsementBatches",
          messageData: "method invoked",
        }),
      });
      const {
        page,
        limit,
        search,
        sort,
        searchBy,
        field,
        from,
        to,
        period,
        month,
        financialYear,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        ownerId,
        viewBy,
        tatRange,
        insurerId,
        businessMonth,
      } = query;
      const data = await this.policyService.searchEndorsementManagementBatches(
        page || DEFAULT_VALUES.PAGE,
        limit || DEFAULT_VALUES.LIMIT,
        search || "",
        sort || "",
        searchBy || "",
        userId,
        field,
        from,
        to,
        period,
        month,
        financialYear,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        ownerId,
        viewBy,
        tatRange,
        insurerId,
        businessMonth,
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Batches retrieved", data));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "PolicyController",
          method: "searchEndorsementBatches",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch endorsement batches."
          )
        );
    }
  }

  @Get("dashboard-business-performance")
  @getDashboardBusinessPerformanceSwaggerMetadata()
  async getDashboardBusinessPerformance(
    @Query() query: GetPolicyKpiDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const ownerId = parseInt(req?.headers?.userid);
      const {
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        timeFilter,
        financialYear,
        owner,
      } = query;
      let userId = query.userId;
      if (userId === undefined) {
        userId = ownerId;
      }
      const data = await this.policyService.getDashboardBusinessPerformance(
        userId,
        timeFilter,
        financialYear,
        owner,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, "KPI data fetched successfully", data)
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : "Failed to fetch KPI data."
          )
        );
    }
  }

  @Get("new-dashboard-business-performance")
  @getNewDashboardBusinessPerformanceSwaggerMetadata()
  async getNewDashboardBusinessPerformance(
    @Query() query: GetPolicyKpiDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const ownerId = parseInt(req?.headers?.userid);
      const {
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        quarter,
        month,
        financialYear,
        owner,
        from,
        to,
        incomeType,
      } = query;
      let userId = query.userId;
      if (userId === undefined || userId === null) {
        userId = ownerId;
      }
      // Leadership bypass applies only when no employee is explicitly selected;
      // an explicit userId always scopes to that user's hierarchy.
      const isLeadership =
        query.userId != null
          ? false
          : await this.scopeService.hasLeadershipRole(Number(userId));
      // Date validation and handling
      const fromDate: Date | undefined = from;
      const toDate: Date | undefined = to;

      // If only one date is provided, throw error
      if ((fromDate && !toDate) || (toDate && !fromDate)) {
        throw new BadRequestException(
          'Please provide valid from and to dates'
        );
      }

      // If from date is greater than to date, throw error
      if (fromDate && toDate && fromDate > toDate) {
        throw new BadRequestException(
          'Please provide valid from and to dates'
        );
      }

      const data = await this.policyService.getNewDashboardBusinessPerformance(
        userId,
        month ? month : quarter,
        financialYear,
        owner,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        isLeadership,
        fromDate,
        toDate,
        incomeType,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, "KPI data fetched successfully", data)
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : "Failed to fetch KPI data."
          )
        );
    }
  }

  @Get("dashboard-policy-summary")
  @getDashboardPolicySummarySwaggerMetadata()
  async getNewDashboardPolicySummary(
    @Query() query: GetPolicyKpiDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const ownerId = parseInt(req?.headers?.userid);
      const {
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        quarter,
        month,
        financialYear,
        owner,
        from,
        to,
        insurerId,
        businessMonth,
      } = query;
      let userId = query.userId;
      if (userId === undefined || userId === null) {
        userId = ownerId;
      }
      // Leadership bypass applies only when no employee is explicitly selected;
      // an explicit userId always scopes to that user's hierarchy.
      const isLeadership =
        query.userId != null
          ? false
          : await this.scopeService.hasLeadershipRole(Number(userId));
      // Date validation and handling
      const fromDate: Date | undefined = from;
      const toDate: Date | undefined = to;

      // If only one date is provided, throw error
      if ((fromDate && !toDate) || (toDate && !fromDate)) {
        throw new BadRequestException(
          'Please provide valid from and to dates'
        );
      }

      // If from date is greater than to date, throw error
      if (fromDate && toDate && fromDate > toDate) {
        throw new BadRequestException(
          'Please provide valid from and to dates'
        );
      }


      // A specific owner was explicitly picked when the caller sent a userId —
      // scope to that owner's own book rather than their role-based visibility.
      const explicitOwnerSelected = query.userId != null;

      const data = await this.policyService.getNewDashboardPolicySummary(
        userId,
        month ? month : quarter,
        financialYear,
        owner,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        isLeadership,
        fromDate,
        toDate,
        insurerId,
        businessMonth,
        explicitOwnerSelected,
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy summary data fetched successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch policy summary data."
          )
        );
    }
  }

  @Get("quarterly-dashboard-business-performance")
  @getQuarterlyDashboardBusinessPerformanceSwaggerMetadata()
  async getQuarterlyDashboardBusinessPerformance(
    @Query() query: GetPolicyKpiDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const ownerId = parseInt(req?.headers?.userid);
      const {
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        financialYear,
        quarter,
        month,
        owner,
        from,
        to,
        useLiveData,
        incomeType,
      } = query;
      let userId = query.userId;
      if (userId === undefined || userId === null) {
        userId = ownerId;
      }
      // Leadership bypass applies only when no employee is explicitly selected;
      // an explicit userId always scopes to that user's hierarchy.
      const isLeadership =
        query.userId != null
          ? false
          : await this.scopeService.hasLeadershipRole(Number(userId));
      // Date validation and handling
      const fromDate: Date | undefined = from;
      const toDate: Date | undefined = to;

      // If only one date is provided, throw error
      if ((fromDate && !toDate) || (toDate && !fromDate)) {
        throw new BadRequestException(
          'Please provide valid from and to dates'
        );
      }

      // If from date is greater than to date, throw error
      if (fromDate && toDate && fromDate > toDate) {
        throw new BadRequestException(
          'Please provide valid from and to dates'
        );
      }

      const data =
        await this.policyService.getQuarterlyDashboardBusinessPerformance(
          userId,
          financialYear,
          quarter,
          month,
          owner,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          isLeadership,
          fromDate,
          toDate,
          useLiveData === true,
          incomeType
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Quarterly business performance data fetched successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch quarterly business performance data."
          )
        );
    }
  }

  @Get("quarterly-dashboard-business-performance-by-sbu-basis")
  @getQuarterlyDashboardBusinessPerformanceBySbuSwaggerMetadata()
  async getQuarterlyDashboardBusinessPerformanceBySbu(
    @Query() query: GetPolicyKpiDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const ownerId = parseInt(req?.headers?.userid);
      const {
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        financialYear,
        quarter,
        month,
        owner,
        from,
        to,
        useLiveData,
        incomeType,
      } = query;
      let userId = query.userId;
      if (userId === undefined || userId === null) {
        userId = ownerId;
      }
      // Leadership bypass applies only when no employee is explicitly selected;
      // an explicit userId always scopes to that user's hierarchy.
      const isLeadership =
        query.userId != null
          ? false
          : await this.scopeService.hasLeadershipRole(Number(userId));

      // Date validation and handling
      const fromDate: Date | undefined = from;
      const toDate: Date | undefined = to;

      // If only one date is provided, throw error
      if ((fromDate && !toDate) || (toDate && !fromDate)) {
        throw new BadRequestException(
          'Please provide valid from and to dates'
        );
      }

      // If from date is greater than to date, throw error
      if (fromDate && toDate && fromDate > toDate) {
        throw new BadRequestException(
          'Please provide valid from and to dates'
        );
      }

      const data =
        await this.policyService.getQuarterlyDashboardBusinessPerformanceBySbu(
          userId,
          financialYear,
          quarter,
          month,
          owner,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          isLeadership,
          fromDate,
          toDate,
          useLiveData === true,
          incomeType
        );
      
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Quarterly business performance data by SBU fetched successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch quarterly business performance data by SBU."
          )
        );
    }
  }

  @Get("generate-performance-output")
  @generatePerformanceOutputSwaggerMetadata()
  async generatePerformanceOutput(
    @Query() query: GeneratePerformanceDto,
    @Res() res: Response
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          query,
          status: "success",
          location: "PolicyController",
          method: "generatePerformanceOutput",
          messageData: "method invoked",
        }),
      });

      console.log("Generating performance output for all users", query);
      const result =
        await this.policyService.generatePerformanceOutputForAllUsers(
          query.month,
          query.year
        );
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          query,
          payload: { result },
          status: result === true ? "success" : "failure",
          location: "PolicyController",
          method: "generatePerformanceOutput",
          messageData: "Performance output generation completed.",
        }),
      });
      if (result === true) {
        return res
          .status(HttpStatus.OK)
          .json(
            createResponse(
              HttpStatus.OK,
              "Performance output generated successfully"
            )
          );
      } else {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "Failed to generate performance output"
            )
          );
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          query,
          status: "failure",
          location: "PolicyController",
          method: "generatePerformanceOutput",
          messageData: error,
        }),
      });

      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to generate performance output"
          )
        );
    }
  }

  @Get("brokerage-to-collect")
  @getBrokerageToCollectSwaggerMetadata()
  async getInsurersBrokerageToCollect(
    @Query() query: GetInsurersBrokerageDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const loggedInUserId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: loggedInUserId,
          status: "success",
          location: "PolicyController",
          method: "getInsurersBrokerageToCollect",
          messageData: "method invoked",
        }),
      });
      const {
        page,
        limit,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        owner,
        sort,
        financialYear,
        quarter,
        month,
        from,
        to,
        insurerId,
        businessMonth,
      } = query;

      let userId = query.userId;
      if (userId === undefined || userId === null) {
        userId = loggedInUserId;
      }
      // Leadership bypass applies only when no employee is explicitly selected;
      // an explicit userId always scopes to that user's hierarchy.
      const isLeadership =
        query.userId != null
          ? false
          : await this.scopeService.hasLeadershipRole(Number(userId));
      // Date validation and handling
      const fromDate: Date | undefined = from;
      const toDate: Date | undefined = to;

      // If only one date is provided, throw error
      if ((fromDate && !toDate) || (toDate && !fromDate)) {
        throw new BadRequestException(
          'Please provide valid from and to dates'
        );
      }

      // If from date is greater than to date, throw error
      if (fromDate && toDate && fromDate > toDate) {
        throw new BadRequestException(
          'Please provide valid from and to dates'
        );
      }

      const data = await this.policyService.getInsurersBrokerageToCollect(
        page,
        limit,
        userId,
        financialYear,
        month ? month : quarter,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        owner,
        sort,
        isLeadership,
        fromDate,
        toDate,
        insurerId,
        businessMonth
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, "Insurers brokerage to collect", data)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: loggedInUserId,
          status: "failure",
          location: "PolicyController",
          method: "getInsurersBrokerageToCollect",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message)
        );
    }
  }

  @Get(":policyId/dashboard")
  @getPolicyDashboardDetailsSwaggerMetadata()
  async getPolicyDashboardDetails(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("isNonGroupPolicy", new DefaultValuePipe(false), ParseBoolPipe)
    isNonGroupPolicy: boolean,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "getPolicyDashboardDetails",
          payload: { policyId, isNonGroupPolicy },
          messageData: "method invoked",
        }),
      });
      const data = await this.policyService.getPolicyDashboardDetails(
        policyId,
        isNonGroupPolicy
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Dashboard data fetched successfully",
            data
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyController",
          method: "getPolicyDashboardDetails",
          payload: { policyId },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch dashboard data."
          )
        );
    }
  }

  @Get("policy-report")
  @getPolicyReportSwaggerMetadata()
  async getPolicyReport(
    @Query() query: GetPolicyReportDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PolicyController",
        method: "getPolicyReport",
        payload: { query },
        messageData: "method invoked",
      }),
    });

    try {
      const { timeFilter, financialYear, ownerId, entityType } = query;

      const policies = await this.policyService.getPolicyReport(
        ownerId ?? userId,
        entityType,
        timeFilter,
        financialYear,
        undefined
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "getPolicyReport",
          payload: { policies },
          messageData: "Policy report retrieved - successfully",
        }),
      });

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy report retrieved successfully",
            policies
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyController",
          method: "getPolicyReport",
          payload: { query },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch policy report."
          )
        );
    }
  }

  @Get("policy-report-list")
  @getPolicyReportListSwaggerMetadata()
  async getPolicyReportList(
    @Query() query: GetPolicyListDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PolicyController",
        method: "getPolicyReportList",
        payload: { query },
        messageData: "method invoked",
      }),
    });

    try {
      const ownerId = parseInt(req?.headers?.userid);

      let parsedSearch: Record<string, any> = {};
      if (typeof query.search === "string" && query.search.trim()) {
        parsedSearch = await this.parseSearchString(query.search);
      }

      const {
        entityType,
        page,
        limit,
        searchBy,
        insurerId,
        insurerBranchId,
        branchViewBy,
        businessPerformanceType,
        allowAllInsurer,
        businessMonth,
        filterByBusinessDate: queryFilterByBusinessDate,
        financialYear: queryFinancialYear,
        quarter: queryQuarter,
        month: queryMonth,
        from: queryFrom,
        to: queryTo,
        sort,
      } = query;

      const search = parsedSearch;

      // Extract date and period filters - prioritize search parameter, fallback to query params
      const from = search.from || queryFrom;
      const to = search.to || queryTo;
      const financialYear = search.financialYear || queryFinancialYear;
      const month = search.month || queryMonth;
      const quarter = search.quarter || queryQuarter;
      const filterByBusinessDate =
        search.filterByBusinessDate === BOOLEAN_VALUES.TRUE || queryFilterByBusinessDate === BOOLEAN_VALUES.TRUE;
      const policyType = search.policyType ? String(search.policyType) : undefined;
      const groupCompanyId = search.groupCompanyId ? Number(search.groupCompanyId) : undefined;
      const brokerId = search.brokerId ? Number(search.brokerId) : undefined;

      // Validate date parameters
      if ((from && !to) || (to && !from)) {
        throw new BadRequestException(
          "Please provide valid from and to dates"
        );
      }

      // If from date is greater than to date, throw error
      if (from && to && from > to) {
        throw new BadRequestException(
          "Please provide valid from and to dates"
        );
      }

      let selectedInsurerId: number | undefined = undefined;
      const pickedUserId =
        search.userId === undefined || search.userId === null
          ? null
          : Number(search.userId.toString().replaceAll('/', ''));
      const explicitOwnerPicked =
        pickedUserId !== null && pickedUserId !== ownerId;
      if (pickedUserId === null) {
        search.userId = ownerId;
      }
      const isLeadership =
        explicitOwnerPicked || search.owner === OWNER_TYPES.MANAGER
          ? false
          : await this.scopeService.hasLeadershipRole(ownerId);
      if (insurerId || search.insurerId) {
        selectedInsurerId = insurerId ? insurerId : search.insurerId;
      }

      const policies = await this.policyService.getPolicyReportList(
        search.userId,
        entityType,
        page,
        limit,
        month ? month : quarter,
        financialYear && parseInt(financialYear),
        search.owner,
        search.organisationId,
        search.sbuId,
        search.verticalId,
        search.departmentId,
        search.branchId,
        searchBy,
        isLeadership,
        selectedInsurerId,
        from,
        to,
        businessPerformanceType,
        allowAllInsurer,
        search.incomeType,
        businessMonth,
        insurerBranchId ?? search.insurerBranchId,
        branchViewBy ?? search.branchViewBy,
        filterByBusinessDate,
        policyType,
        groupCompanyId,
        brokerId,
        sort,
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "getPolicyReportList",
          payload: { policies },
          messageData: "Policy report retrieved - successfully",
        }),
      });

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy report retrieved successfully",
            policies
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyController",
          method: "getPolicyReportList",
          payload: { query },
          messageData: error,
        }),
      });
      console.error("Error in getPolicyReport:", error);
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch policy report."
          )
        );
    }
  }

  @Get("policy-report-excel")
  @getPolicyReportExcelSwaggerMetadata()
  async getPolicyReportExcelDownload(
    @Query() query: GetPolicyListDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PolicyController",
        method: "getPolicyReportExcelDownload",
        payload: { query },
        messageData: "method invoked",
      }),
    });

    try {
      const ownerId = parseInt(req?.headers?.userid);
      let parsedSearch: Record<string, any> = {};
      let selectedInsurerId: number | undefined = undefined;
      if (typeof query.search === "string" && query.search.trim()) {
        parsedSearch = await this.parseSearchString(query.search);
      }

      const {
        entityType,
        page,
        limit,
        searchBy,
        insurerId,
        businessPerformanceType,
        businessMonth: queryBusinessMonth,
        filterByBusinessDate: queryFilterByBusinessDateExcel,
        financialYear: queryFinancialYear,
        quarter: queryQuarter,
        month: queryMonth,
        from: queryFrom,
        to: queryTo,
      } = query;

      const search = parsedSearch;

      // Extract date and period filters - prioritize search parameter, fallback to query params
      const from = search.from || queryFrom;
      const to = search.to || queryTo;
      const financialYear = search.financialYear || queryFinancialYear;
      const month = search.month || queryMonth;
      const quarter = search.quarter || queryQuarter;
      const businessMonth = search.businessMonth || queryBusinessMonth;
      const filterByBusinessDateExcel =
        search.filterByBusinessDate === BOOLEAN_VALUES.TRUE || queryFilterByBusinessDateExcel === BOOLEAN_VALUES.TRUE;
      const policyTypeExcel = search.policyType ? String(search.policyType) : undefined;
      const groupCompanyIdExcel = search.groupCompanyId ? Number(search.groupCompanyId) : undefined;
      const brokerIdExcel = search.brokerId ? Number(search.brokerId) : undefined;

      const pickedUserIdExcel =
        search.userId === undefined || search.userId === null
          ? null
          : Number(search.userId.toString().replaceAll('/', ''));
      const explicitOwnerPickedExcel =
        pickedUserIdExcel !== null && pickedUserIdExcel !== ownerId;
      if (pickedUserIdExcel === null) {
        search.userId = ownerId;
      }
      // Same Manager-outranks-leadership rule as getPolicyReportList, so the
      // synchronous download can never disagree with the listing on screen.
      const isLeadership =
        explicitOwnerPickedExcel || search.owner === OWNER_TYPES.MANAGER
          ? false
          : await this.scopeService.hasLeadershipRole(ownerId);
      if (insurerId || search.insurerId) {
        selectedInsurerId = insurerId ? insurerId : search.insurerId;
      }

      const effectiveSearchByExcel = searchBy ?? (search.companyName ? String(search.companyName) : undefined);

      const policies = await this.policyService.getPolicyReportExcel(
        search.userId,
        undefined,
        page,
        limit,
        month ? month : quarter,
        financialYear,
        search.owner,
        search.organisationId,
        search.sbuId,
        search.verticalId,
        search.departmentId,
        search.branchId,
        effectiveSearchByExcel,
        isLeadership,
        selectedInsurerId,
        from,
        to,
        businessPerformanceType,
        search.incomeType,
        businessMonth,
        filterByBusinessDateExcel,
        policyTypeExcel,
        groupCompanyIdExcel,
        brokerIdExcel,
      );

      // getPolicyReportExcel now returns the S3 object key (so the async export
      // flow can regenerate fresh, unexpired URLs). For this synchronous
      // download endpoint, mint a fresh pre-signed URL for the client.
      const downloadUrl = await this.policyService.toDownloadUrl(policies);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "getPolicyReportExcelDownload",
          payload: { policies: downloadUrl },
          messageData: "Policy report excel generated - successfully",
        }),
      });

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy report excel generated successfully",
            downloadUrl
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyController",
          method: "getPolicyReportExcelDownload",
          payload: { query },
          messageData: error,
        }),
      });
      console.error("Error in getPolicyReportExcelDownload:", error);
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch policy report excel download url."
          )
        );
    }
  }

  @Get("bizdone-report-excel/export")
  async queuePolicyReportExcelExport(
    @Query() query: GetPolicyListDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      // Store the exact query the user asked for; the worker replays it through
      // the same generation path, so the output matches the synchronous export.
      const data = await this.policyService.enqueueReportExport(
        userId,
        query as unknown as Record<string, unknown>
      );
      return res
        .status(HttpStatus.ACCEPTED)
        .json(
          createResponse(HttpStatus.ACCEPTED, "Report export queued", data)
        );
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("bizdone-report-excel/exports")
  async listPolicyReportExcelExports(
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.listReportExports(userId);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Report exports", data));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }


  @Get("bizdone-report-excel/export/:jobId")
  async getPolicyReportExcelExportStatus(
    @Param("jobId", ParseIntPipe) jobId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.getReportExportStatus(
        jobId,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Report export status", data));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("bizdone-report-excel/export/:jobId/download")
  async downloadPolicyReportExcelExport(
    @Param("jobId", ParseIntPipe) jobId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const document = await this.policyService.downloadReportExportFile(
        jobId,
        userId
      );
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, "Report export file retrieved", {
          fileName: document.fileName,
          mimeType: document.mimeType,
          buffer: document.buffer,
        })
      );
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  // ==== Business targets: CRUD + report ======================================

  @Post("business-target")
  async upsertBusinessTarget(
    @Body() dto: UpsertBusinessTargetDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.upsertBusinessTarget(dto);
      const message = dto.id
        ? "Business target updated successfully"
        : "Business target saved successfully";
      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, message, data));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("business-target-report-list")
  async getBusinessTargetReportList(
    @Query() query: BusinessTargetReportQueryDto,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data =
        await this.policyService.getBusinessTargetReportList(query);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Business target report", data));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("business-target-report/export")
  async queueBusinessTargetReportExport(
    @Query() query: BusinessTargetReportQueryDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.enqueueBusinessTargetReportExport(
        userId,
        query as unknown as Record<string, unknown>
      );
      return res
        .status(HttpStatus.ACCEPTED)
        .json(
          createResponse(HttpStatus.ACCEPTED, "Report export queued", data)
        );
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("business-target-report/exports")
  async listBusinessTargetReportExports(
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data =
        await this.policyService.listBusinessTargetReportExports(userId);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Report exports", data));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("business-target-report/export/:jobId")
  async getBusinessTargetReportExportStatus(
    @Param("jobId", ParseIntPipe) jobId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.getReportExportStatus(
        jobId,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Report export status", data));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("business-target-report/export/:jobId/download")
  async downloadBusinessTargetReportExport(
    @Param("jobId", ParseIntPipe) jobId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const document = await this.policyService.downloadReportExportFile(
        jobId,
        userId
      );
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, "Report export file retrieved", {
          fileName: document.fileName,
          mimeType: document.mimeType,
          buffer: document.buffer,
        })
      );
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("policies-report-excel/export")
  async queuePolicyListReportExcelExport(
    @Query() query: GetPolicyQueryDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.enqueuePolicyListReportExport(
        userId,
        query as unknown as Record<string, unknown>
      );
      return res
        .status(HttpStatus.ACCEPTED)
        .json(
          createResponse(HttpStatus.ACCEPTED, "Report export queued", data)
        );
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("policies-report-excel/exports")
  async listPolicyListReportExcelExports(
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.listPolicyListReportExports(
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Report exports", data));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  // Poll the status of a queued policy-list export. Status polling is scoped
  // only by jobId + userId (not reportType), so this reuses the exact same
  // service method the BizDone status route calls.
  @Get("policies-report-excel/export/:jobId")
  async getPolicyListReportExcelExportStatus(
    @Param("jobId", ParseIntPipe) jobId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.getReportExportStatus(
        jobId,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Report export status", data));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  // Reuses the exact same download service method as the BizDone route above
  // — same job table, jobId + userId scoping already covers both.
  @Get("policies-report-excel/export/:jobId/download")
  async downloadPolicyListReportExcelExport(
    @Param("jobId", ParseIntPipe) jobId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const document = await this.policyService.downloadReportExportFile(
        jobId,
        userId
      );
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, "Report export file retrieved", {
          fileName: document.fileName,
          mimeType: document.mimeType,
          buffer: document.buffer,
        })
      );
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  // Org-hierarchy drilldown aggregate for Biz Done Report Enhanced: one row
  // per child node at the requested level, with policy count / premium /
  // brokerage. Declared before the ":policyId" catch-all so "scope-summary"
  // is not captured as an id param. Mirrors opportunity-service's
  // "scope-summary" route/scope-resolution pattern.
  @Get("scope-summary")
  async getPolicyScopeSummary(
    @Query() queries: GetPolicyScopeSummaryDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const {
        level,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        from,
        to,
        financialYear,
        userId,
        owner,
        filterByBusinessDate,
      } = queries;
      const loggedInUserId = parseInt(req?.headers?.userid as string);
      const resolvedUserId = userId ?? loggedInUserId;
      // Mirrors getPolicyReportList: an explicit View-by = "Manager" outranks
      // the leadership bypass, otherwise the cards would keep showing whole-org
      // totals while the table below them narrowed to the selected person.
      const isLeadership =
        owner === OWNER_TYPES.MANAGER
          ? false
          : await this.scopeService.hasLeadershipRole(Number(resolvedUserId));
      const data = await this.policyService.getPolicyScopeSummary(
        resolvedUserId,
        {
          level,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          from,
          to,
          financialYear,
          owner,
          // Business Month mode counts dateOfBusiness, not dateOfIncome.
          filterByBusinessDate: filterByBusinessDate === BOOLEAN_VALUES.TRUE,
        },
        isLeadership
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy scope summary retrieved successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch policy scope summary."
          )
        );
    }
  }

  // Client-Portfolio-only scope aggregate. A SEPARATE route from
  // "scope-summary" above so Biz Done Enhanced (which hits scope-summary) is
  // byte-for-byte unaffected. Two-segment path, declared before the ":policyId"
  // catch-all, same as "portfolio/companies".
  @Get("portfolio/scope-summary")
  async getPortfolioScopeSummary(
    @Query() queries: GetPolicyScopeSummaryDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const {
        level,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        from,
        to,
        financialYear,
        userId,
        owner,
      } = queries;
      const loggedInUserId = parseInt(req?.headers?.userid as string);
      const resolvedUserId = userId ?? loggedInUserId;
      const isLeadership = await this.scopeService.hasLeadershipRole(
        Number(resolvedUserId)
      );
      const data = await this.policyService.getPortfolioScopeSummary(
        resolvedUserId,
        {
          level,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          from,
          to,
          financialYear,
          owner,
        },
        isLeadership
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Portfolio scope summary retrieved successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch portfolio scope summary."
          )
        );
    }
  }

  @Get(":policyId/employee-insured-excel")
  async getEmployeeInsuredExcelDownload(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("relationshipGroup") relationshipGroup?: string,
    @Query("claimStatus") claimStatus?: string,
    @Query("effectiveFrom") effectiveFrom?: string,
    @Query("effectiveTo") effectiveTo?: string,
    @Query("searchBy") searchBy?: string,
    @Query("search") search?: string,
    @Query("iirmPolicyId") iirmPolicyId?: string,
    @Query("insurerEndorsementNumber") insurerEndorsementNumber?: string,
    @Query("insurerEndorsementDate") insurerEndorsementDate?: string,
    @Query("tpaId") tpaId?: string,
    @Query("status") status?: string,
    @Query("endorsementId") endorsementId?: string,
    @Query("sort") sort?: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PolicyController",
        method: EMPLOYEE_INSURED_EXCEL_METHOD_NAME,
        payload: { policyId },
        messageData: "method invoked",
      }),
    });

    try {
      const {
        relationshipGroup: effectiveRelationshipGroup,
        claimStatus: effectiveClaimStatus,
        effectiveFrom: effectiveEffectiveFrom,
        effectiveTo: effectiveEffectiveTo,
        searchBy: effectiveSearchBy,
        employeeId: effectiveEmployeeId,
        iirmPolicyId: effectiveIirmPolicyId,
        insurerEndorsementNumber: effectiveInsurerEndorsementNumber,
        insurerEndorsementDate: effectiveInsurerEndorsementDate,
        tpaId: effectiveTpaId,
        status: effectiveStatus,
        endorsementId: effectiveEndorsementId,
      } = resolveEmployeeInsuredSearchParams({
        relationshipGroup,
        claimStatus,
        effectiveFrom,
        effectiveTo,
        searchBy,
        search,
        iirmPolicyId,
        insurerEndorsementNumber,
        insurerEndorsementDate,
        tpaId,
        status,
        endorsementId,
      });

      const sortParams = sort
        ? sort
            .split(",")
            .map((item) => {
              const [rawKey, rawOrder] = item.trim().split(":");
              const field = rawKey.trim();
              const order = (rawOrder || "ASC").trim().toUpperCase() as
                | "ASC"
                | "DESC";
              return { field, order };
            })
            .filter(({ field }) => Boolean(field))
        : [];

      const userDetails = userId
        ? await this.policyService.getUserDetails(Number(userId))
        : null;

      const downloadUrl = await this.policyService.getPolicyEmployeeInsuredExcel(
        policyId,
        effectiveRelationshipGroup,
        effectiveClaimStatus,
        effectiveEffectiveFrom,
        effectiveEffectiveTo,
        effectiveSearchBy,
        effectiveEmployeeId,
        effectiveIirmPolicyId,
        effectiveInsurerEndorsementNumber,
        effectiveInsurerEndorsementDate,
        effectiveTpaId,
        effectiveStatus,
        sortParams,
        userDetails,
        effectiveEndorsementId,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            EMPLOYEE_INSURED_EXCEL_SUCCESS_MESSAGE,
            downloadUrl
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyController",
          method: EMPLOYEE_INSURED_EXCEL_METHOD_NAME,
          payload: { policyId },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : EMPLOYEE_INSURED_EXCEL_ERROR_MESSAGE
          )
        );
    }
  }
  @Get("generate-template-excel")
  @generateExcelFromJsonSwaggerMetadata() // TODO: update swagger decorator to remove body schema
  async generateExcelFromJson(
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid);
    const fileName = EXCEL_TEMPLATE_FILE_NAMES.ASSET_TEMPLATE_FILLED;
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "generateExcelFromJson",
          payload: { fileName },
          messageData: "method invoked",
        }),
      });

      const url = await this.policyService.generateExcelFromJson(fileName);

      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, "Excel generated successfully", {
          url,
        })
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyController",
          method: "generateExcelFromJson",
          payload: { fileName },
          messageData: error,
        }),
      });

      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.excelGenerationError
          )
        );
    }
  }

  @Get("endorsement-steps")
  @listEndorsementStepsSwaggerMetadata()
  async listEndorsementSteps(
    @Query() query: GetEndorsementStepsDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "listEndorsementSteps",
          messageData: "method invoked",
        }),
      });

      const { page, limit, search } = query;
      const data = await this.policyService.getAllEndorsementSteps(
        page || DEFAULT_VALUES.PAGE,
        limit || DEFAULT_VALUES.LIMIT,
        search
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, "Endorsement steps retrieved", data)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "PolicyController",
          method: "listEndorsementSteps",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch endorsement steps"
          )
        );
    }
  }

  @Get(":policyId/contacts")
  @getPolicyContactsSwaggerMetadata()
  async getPolicyContacts(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("contactDetails") contactDetails: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const userIdHeader = req?.headers?.userid as string;
      const userId = parseInt(userIdHeader);

      if (!userIdHeader || isNaN(userId)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "Invalid or missing userId header",
            ),
          );
      }

      if (
        !contactDetails ||
        (contactDetails !== CONTACT_STATUS.INSURERS && contactDetails !== CONTACT_STATUS.COMPANY)
      ) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "Invalid contactDetails parameter. Must be 'insurers' or 'company'",
            ),
          );
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "getPolicyContacts",
          payload: { policyId, contactDetails },
          messageData: "method invoked",
        }),
      });

      const contacts = await this.policyService.getPolicyContacts(
        policyId,
        userId,
        contactDetails,
      );

      const message =
        contactDetails === CONTACT_STATUS.INSURERS
          ? "Insurer contacts retrieved successfully"
          : "Company contacts retrieved successfully";

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, message, contacts));
    } catch (error) {
      const userIdHeader = req?.headers?.userid as string;
      const userId = parseInt(userIdHeader);

      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: isNaN(userId) ? undefined : userId,
          status: "failure",
          location: "PolicyController",
          method: "getPolicyContacts",
          payload: { policyId, contactDetails },
          messageData: error,
        }),
      });

      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(
            createErrorResponse(
              HttpStatus.NOT_FOUND,
              error.message || "Policy not found",
            ),
          );
      }

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error
              ? error.message
              : "Failed to fetch contact details",
          ),
        );
    }
  }

  @Post(":policyId/contacts")
  @createPolicyContactsSwaggerMetadata()
  async createPolicyContacts(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body() createContactsDto: CreatePolicyContactsDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const userIdHeader = req?.headers?.userid as string;
      const userId = parseInt(userIdHeader);

      if (!userIdHeader || isNaN(userId)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "Invalid or missing userId header",
            ),
          );
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "createPolicyContacts",
          payload: { 
            policyId, 
            contactDetails: createContactsDto.contactDetails,
            contactCount: createContactsDto.contacts.length
          },
          messageData: "method invoked",
        }),
      });

      await this.policyService.createPolicyContacts(
        policyId,
        userId,
        createContactsDto.contactDetails,
        createContactsDto.contacts,
      );

      const message =
        createContactsDto.contactDetails === CONTACT_STATUS.INSURERS
          ? "Insurer contacts processed successfully"
          : "Company contacts processed successfully";

      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, message));
    } catch (error) {
      const userIdHeader = req?.headers?.userid as string;
      const userId = parseInt(userIdHeader);

      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: isNaN(userId) ? undefined : userId,
          status: "failure",
          location: "PolicyController",
          method: "createPolicyContacts",
          payload: { 
            policyId, 
            contactDetails: createContactsDto.contactDetails,
            contactCount: createContactsDto.contacts.length
          },
          messageData: error,
        }),
      });

      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(
            createErrorResponse(
              HttpStatus.NOT_FOUND,
              error.message || "Policy not found",
            ),
          );
      }

      if (error instanceof BadRequestException) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              error.message,
            ),
          );
      }

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error
              ? error.message
              : "Failed to process contact details",
          ),
        );
    }
  }

  @Get("policy-types")
  @getPolicyTypesSwaggerMetadata()
  async getPolicyTypes(
    @Query() query: PolicyTypeQueryDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const { ownerId, viewBy, companyId, insurerId, showActive } = query;
    const userId = parseInt(req?.headers?.userid as string);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PolicyController",
        method: "getPolicyTypes",
        payload: { ownerId, viewBy, companyId, insurerId },
        messageData: "method invoked",
      }),
    });
    try {
      const data = await this.policyService.getPolicyTypes(
        userId,
        ownerId,
        viewBy,
        companyId,
        insurerId,
        showActive
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.claimListRetrieved, data)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "ClaimController",
          method: "getPolicyTypes",
          payload: { ownerId, viewBy, companyId, insurerId },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.policyClaimFetchFailed,
        errorMessages.policyClaimFetchFailed,
        errorMessages.policyClaimFetchFailed
      );
    }
  }

  // Registered here (before the catch-all :policyId route below) — a
  // literal path like this one, if declared after :policyId, would be
  // swallowed by it (NestJS/Express match routes in declaration order), and
  // "company-policy-migration-log" would be parsed as a policyId and fail
  // ParseIntPipe with "Validation failed (numeric string is expected)".
  @Get("company-policy-migration-log")
  @getMigrationLogsSwaggerMetadata()
  async getMigrationLogs(
    @Res() res: Response,
    @Query() query: GetMigrationLogsDto,
  ): Promise<Response> {
    try {
      const { data, count, systems } = await this.policyService.getMigrationLogs(
        query.page,
        query.limit,
        query.sort,
        query.system,
      );
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, "Migration logs retrieved successfully", {
          data,
          count,
          page: query.page,
          limit: query.limit,
          systems,
        }),
      );
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  // NOTE: @Res() is intentionally NOT used here. NestJS interceptors
  // (including ResponseMaskingInterceptor) are bypassed when @Res() +
  // res.json() is used because the response is written directly to Express
  // before the interceptor's map() operator runs. Returning the value lets
  // the interceptor process and mask the data before it is sent.
  @Get(":policyId")
  @getPolicyByIdSwaggerMetadata()
  @ApplyMasking('policy_member')
  @UseInterceptors(ResponseMaskingInterceptor)
  async getPolicyById(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("section") section: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sort") sort?: string,
    @Query("relationshipGroup") relationshipGroup?: string,
    @Query("claimStatus") claimStatus?: string,
    @Query("effectiveFrom") effectiveFrom?: string,
    @Query("effectiveTo") effectiveTo?: string,
    @Query("searchBy") searchBy?: string,
    @Query("search") search?: string,
    @Query("iirmPolicyId") iirmPolicyId?: string,
    @Query("insurerEndorsementNumber") insurerEndorsementNumber?: string,
    @Query("insurerEndorsementDate") insurerEndorsementDate?: string,
    @Query("tpaId") tpaId?: string,
    @Query("status") status?: string,
    @Query("endorsementId") endorsementId?: string,
  ): Promise<object> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "getPolicyById",
          payload: { policyId, section },
          messageData: "method invoked",
        }),
      });
      const policy = await this.policyService.getPolicyById(
        policyId,
        section,
        page ? Number(page) : undefined,
        limit ? Number(limit) : undefined,
        sort,
        relationshipGroup,
        claimStatus,
        effectiveFrom,
        effectiveTo,
        searchBy,
        search,
        iirmPolicyId,
        insurerEndorsementNumber,
        insurerEndorsementDate,
        tpaId,
        status,
        endorsementId
      );

      return createResponse(HttpStatus.OK, "Policy retrieved successfully", policy);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyController",
          method: "getPolicyById",
          payload: { policyId, section },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to fetch policy."
      );
    }
  }

  @Put(":policyId")
  @updatePolicySwaggerMetadata()
  async updatePolicyById(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body() body: UpdatePolicyDTO,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      if (!Number.isFinite(userId)) {
        throw new BadRequestException(
          "Valid user id header is required for updates."
        );
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "updatePolicyById",
          payload: { policyId, userId: userId },
          messageData: "method invoked",
        }),
      });

      const policy = await this.policyService.updatePolicyById(
        policyId,
        body,
        userId
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, "Policy updated successfully", policy)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyController",
          method: "updatePolicyById",
          payload: { policyId },
          messageData: error,
        }),
      });

      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message =
        error instanceof Error ? error.message : "Failed to update policy.";

      if (error instanceof BadRequestException) {
        status = HttpStatus.BAD_REQUEST;
      } else if (error instanceof NotFoundException) {
        status = HttpStatus.NOT_FOUND;
      } else {
        message = "Failed to update policy.";
      }

      return res.status(status).json(createErrorResponse(status, message));
    }
  }

  @Put(":policyId/covers")
  @updatePolicyCoverSwaggerMetadata()
  async updatePolicyCover(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body() dto: UpdatePolicyCoverDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid);
    const coverTemplateIds = Object.keys(dto.covers || {});
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "updatePolicyCover",
          payload: { policyId, coverTemplateIds },
          messageData: "method invoked",
        }),
      });

      const data = await this.policyService.updatePolicyCover(
        policyId,
        dto,
        userId
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.policyCoverUpdated, data)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyController",
          method: "updatePolicyCover",
          payload: { policyId, coverTemplateIds },
          messageData: error,
        }),
      });
      if (error instanceof HttpException) {
        const status = error.getStatus();
        const response = error.getResponse();

        let message: string | undefined;
        if (typeof response === "string") {
          message = response;
        } else if (response && typeof response === "object") {
          const responseMessage = (response as any).message;
          if (Array.isArray(responseMessage)) {
            message = responseMessage[0];
          } else {
            message = responseMessage;
          }
        }

        return res
          .status(status)
          .json(
            createErrorResponse(
              status,
              message || error.message || errorMessages.policyCoverUpdateFailed
            )
          );
      }

      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.policyCoverUpdateFailed
          )
        );
    }
  }

  @Post(":policyId/sections/submission")
  @submitPolicySectionSwaggerMetadata()
  async submitPolicySection(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body() dto: PolicySectionSubmissionDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "submitPolicySection",
          payload: { policyId, section: dto.section },
          messageData: "method invoked",
        }),
      });
      const data = await this.policyService.submitPolicySection(
        policyId,
        dto,
        userId
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            this.getSubmissionSuccessMessage(dto.section),
            data
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyController",
          method: "submitPolicySection",
          payload: { policyId, section: dto.section },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.policyApprovalStatusUpdateFailed
          )
        );
    }
  }

  @Put(":policyId/sections/approval")
  @approvePolicySectionSwaggerMetadata()
  async approvePolicySection(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body() dto: PolicySectionApprovalDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "approvePolicySection",
          payload: { policyId, section: dto.section, status: dto.status },
          messageData: "method invoked",
        }),
      });
      const data = await this.policyService.approvePolicySection(
        policyId,
        dto,
        userId
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            this.getApprovalSuccessMessage(dto.section),
            data
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyController",
          method: "approvePolicySection",
          payload: { policyId, section: dto.section, status: dto.status },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.policyApprovalStatusUpdateFailed
          )
        );
    }
  }

  @Get(":policyId/sections/status")
  @getPolicySectionStatusesSwaggerMetadata()
  async getPolicySectionStatuses(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "getPolicySectionStatuses",
          payload: { policyId },
          messageData: "method invoked",
        }),
      });
      const data = await this.policyService.getPolicySectionStatuses(policyId);

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.policySectionStatusesRetrieved,
            data
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyController",
          method: "getPolicySectionStatuses",
          payload: { policyId },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.policyApprovalStatusFetchFailed
          )
        );
    }
  }

  @Put("caution-deposit/:id/account-number")
  @updateCautionDepositAccountNumberSwaggerMetadata()
  async updateCautionDepositAccountNumber(
    @Param("id", cautionDepositIdParsePipe) id: number,
    @Body() dto: UpdateCautionDepositAccountNumberDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "updateCautionDepositAccountNumber",
          payload: { id, cdAccountNumber: dto.cdAccountNumber },
          messageData: "method invoked",
        }),
      });

      const data = await this.policyService.updateCautionDepositAccountNumber(
        id,
        dto,
        userId
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.cautionDepositAccountNumberUpdated,
            data
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyController",
          method: "updateCautionDepositAccountNumber",
          payload: { id, cdAccountNumber: dto.cdAccountNumber },
          messageData: error,
        }),
      });

      if (error instanceof HttpException) {
        const status = error.getStatus();
        const response = error.getResponse();
        let message: string | undefined;

        if (typeof response === "string") {
          message = response;
        } else if (response && typeof response === "object") {
          const responseMessage = (response as any).message;
          if (Array.isArray(responseMessage)) {
            message = responseMessage[0];
          } else {
            message = responseMessage;
          }
        }

        return res
          .status(status)
          .json(
            createErrorResponse(
              status,
              message ||
                error.message ||
                errorMessages.cautionDepositAccountNumberUpdateFailed
            )
          );
      }

      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.cautionDepositAccountNumberUpdateFailed
          )
        );
    }
  }

  @Get("caution-deposit/:id")
  @getCautionDepositByIdSwaggerMetadata()
  async getCautionDepositBalance(
    @Param("id", cautionDepositIdParsePipe) id: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.getCautionDepositDetailsById(id);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Caution deposit fetched successfully",
            data
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch caution deposit"
          )
        );
    }
  }

  @Put("caution-deposit/:id")
  @updateCautionDepositSwaggerMetadata()
  async updateCautionDepositBalance(
    @Param("id", cautionDepositIdParsePipe) id: number,
    @Body() dto: UpdateCautionDepositDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.updateCautionDepositBalance(
        id,
        dto,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Caution deposit updated successfully",
            data
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to update caution deposit"
          )
        );
    }
  }

  @Post("caution-deposit/merge")
  @mergeCautionDepositsSwaggerMetadata()
  async mergeCautionDeposits(
    @Body() dto: MergeCautionDepositDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "mergeCautionDeposits",
          payload: { sourceCdIds: dto.sourceCdIds, targetCDId: dto.targetCDId },
          messageData: "method invoked",
        }),
      });

      const data = await this.policyService.mergeCautionDeposits(
        dto.sourceCdIds,
        dto.targetCDId,
        userId
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "mergeCautionDeposits",
          payload: { sourceCdIds: dto.sourceCdIds, targetCDId: dto.targetCDId },
          messageData: "Caution deposits merged successfully",
        }),
      });

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Caution deposits merged successfully",
            data
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyController",
          method: "mergeCautionDeposits",
          payload: { sourceCdIds: dto.sourceCdIds, targetCDId: dto.targetCDId },
          messageData: error,
        }),
      });

      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }

      if (error instanceof BadRequestException) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(createErrorResponse(HttpStatus.BAD_REQUEST, error.message));
      }

      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to merge caution deposits"
          )
        );
    }
  }

  @Get("configuration/:id")
  @getPolicyConfigurationByIdSwaggerMetadata()
  async getConfigurationById(
    @Param("id", ParseIntPipe) policyId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = Number(req?.headers?.userid);
      if (!userId || isNaN(userId)) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json(
            createErrorResponse(HttpStatus.UNAUTHORIZED, "User ID is required")
          );
      }
      const data =
        await this.policyService.getPolicyConfigurationByPolicyIdForRole(
          policyId,
          userId
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.policyConfigurationRetrieved,
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  @Post("company/caution-deposit")
  @createCompanyCautionDepositSwaggerMetadata()
  async createCompanyCautionDeposit(
    @Body() dto: CreateCautionDepositDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.createCompanyCautionDeposit(
        dto,
        userId
      );
      const message = dto.cautionDepositId
        ? "CD account updated successfully"
        : "CD account created successfully";
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            message,
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to create CD account"
          )
        );
    }
  }

  @Get("company/caution-deposit")
  @getCompanyCautionDepositsSwaggerMetadata()
  async getCompanyCautionDeposits(
    @Query() query: CompanyCdListQueryDto,
    @Res() res: Response,
    @Req() req: Request
  ): Promise<Response> {
    const {
      search = "",
      searchBy,
      page = DEFAULT_VALUES.PAGE,
      limit = DEFAULT_VALUES.LIMIT,
      ownerId,
      viewBy,
      organisationId,
      sbuId,
      verticalId,
      branchId,
    } = query;
    const userId = parseInt(req?.headers?.userid as string);
    try {
      const data = await this.policyService.getCompanyCautionDeposits(
        search,
        searchBy,
        page,
        limit,
        userId,
        ownerId,
        viewBy,
        organisationId,
        sbuId,
        verticalId,
        branchId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.cautionDepositsRetrieved,
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            errorMessages.cautionDepositsFetchFailed
          )
        );
    }
  }

  @Get("company/:companyId/caution-deposit")
  @getCautionDepositsByCompanySwaggerMetadata()
  async getCautionDepositsByCompany(
    @Param("companyId", ParseIntPipe) companyId: number,
    @Query("search") search: string,
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.getCautionDepositsByCompany(
        companyId,
        search || "",
        page || DEFAULT_VALUES.PAGE,
        limit || DEFAULT_VALUES.LIMIT
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Caution deposits retrieved successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch caution deposits"
          )
        );
    }
  }

  @Get("caution-deposit/:cautionDepositId/transactions")
  @getCautionDepositTransactionsByCautionDepositIdSwaggerMetadata()
  async getCautionDepositTransactionsByCautionDepositId(
    @Param("cautionDepositId", cautionDepositIdParsePipe)
    cautionDepositId: number,
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Query("export") exportFlag: string,
    @Query("sort") sort: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      if (exportFlag === "true") {
        const downloadUrl =
          await this.policyService.exportCautionDepositTransactions(
            cautionDepositId
          );

        return res
          .status(HttpStatus.OK)
          .json(
            createResponse(
              HttpStatus.OK,
              "Caution deposit transactions exported successfully",
              downloadUrl
            )
          );
      }

      const data =
        await this.policyService.getCautionDepositTransactionsByCautionDepositId(
          cautionDepositId,
          page || DEFAULT_VALUES.PAGE,
          limit || DEFAULT_VALUES.LIMIT,
          sort
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Caution deposit transactions retrieved successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch caution deposit transactions"
          )
        );
    }
  }

  @Get("company/:companyId/policies")
  @getCompanyPoliciesSummarySwaggerMetadata()
  async getCompanyPolicies(
    @Param("companyId", ParseIntPipe) companyId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "getCompanyPolicies",
          payload: { companyId },
          messageData: "method invoked",
        }),
      });
      const policies = await this.policyService.getPolicySummariesByCompanyId(
        companyId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.policiesRetrieved,
            policies
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyController",
          method: "getCompanyPolicies",
          payload: { companyId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.policyNotFound
          )
        );
    }
  }

  // Minimal, fast, paginated {policyId, policyName, policyNumber} list for
  // picker/dropdown UIs — e.g. ZohoEndorsementPage's "Select Policy" field
  // (used by the Zoho and HCL enrollment flows), which previously sourced
  // its options from the much heavier "dashboard_policy_cards" report
  // endpoint (dashboard-oriented: premiums, sum insured, life counts,
  // statuses — no pagination, far more than a dropdown needs).
  @Get("company/:companyId/policy-options")
  async getPolicyOptionsByCompanyId(
    @Param("companyId", ParseIntPipe) companyId: number,
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 100,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "getPolicyOptionsByCompanyId",
          payload: { companyId, page, limit },
          messageData: "method invoked",
        }),
      });
      const result = await this.policyService.getPolicyOptionsByCompanyId(
        companyId,
        page,
        limit,
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.policiesRetrieved, result));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyController",
          method: "getPolicyOptionsByCompanyId",
          payload: { companyId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : errorMessages.policyNotFound,
          ),
        );
    }
  }

  @Get("company/:companyId")
  @getPoliciesByCompanySwaggerMetadata()
  async getPoliciesByCompanyId(
    @Param("companyId", ParseIntPipe) companyId: number,
    @Query() getPoliciesDto: GetPolicyQueryDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "getPoliciesByCompanyId",
          payload: { companyId },
          messageData: "method invoked",
        }),
      });
      const policies = await this.policyService.getPoliciesByCompanyId(
        companyId,
        getPoliciesDto,
        userId
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policies retrieved successfully",
            policies
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyController",
          method: "getPoliciesByCompanyId",
          payload: { companyId },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : "Failed to fetch policies."
          )
        );
    }
  }

  @Get(":policyId/caution-deposit")
  @getCautionDepositsByPolicySwaggerMetadata()
  async getCautionDepositsByPolicy(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.getCautionDepositsByPolicy(
        policyId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Caution deposits retrieved successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch caution deposits"
          )
        );
    }
  }

  @Put(":policyId/caution-deposit/:cautionDepositId")
  async updateCautionDepositBalanceByPolicy(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("cautionDepositId", cautionDepositIdParsePipe) cautionDepositId: number,
    @Body() dto: UpdateCautionDepositDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.updateCautionDepositBalanceByPolicy(
        cautionDepositId,
        policyId,
        dto,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Caution deposit updated successfully for policy",
            data
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to update caution deposit for policy"
          )
        );
    }
  }

  @Get(":policyId/insurers")
  @getPolicyInsurersSwaggerMetadata()
  async getInsurersByPolicy(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "getInsurersByPolicy",
          messageData: "method invoked",
        }),
      });
      const data = await this.policyService.getInsurersByPolicy(policyId);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy Insurers retrieved successfully",
            data
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyController",
          method: "getInsurersByPolicy",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : "Failed to fetch insurers"
          )
        );
    }
  }

  @Get("contact/:contactId")
  @getPoliciesByContactSwaggerMetadata()
  async getPoliciesByContactId(
    @Param("contactId", ParseIntPipe) contactId: number,
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Res() res: Response
  ) {
    try {
      const policies = await this.policyService.getPoliciesByContactId(
        contactId,
        page || DEFAULT_VALUES.PAGE,
        limit || DEFAULT_VALUES.LIMIT
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policies retrieved successfully",
            policies
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : "Failed to fetch policies."
          )
        );
    }
  }

  @Get("opportunity/:opportunityId")
  @getPoliciesByOpportunitySwaggerMetadata()
  async getPoliciesByOpportunityId(
    @Param("opportunityId", ParseIntPipe) opportunityId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const policies = await this.policyService.getPoliciesByOpportunityId(
        opportunityId
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policies retrieved successfully",
            policies
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : "Failed to fetch policies."
          )
        );
    }
  }

  @Post("configuration")
  @createPolicyConfigurationSwaggerMetadata()
  async createConfiguration(
    @Body() dto: CreatePolicyConfigurationDto,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.createPolicyConfiguration(dto);
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            successMessage.policyConfigurationCreated,
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  @Put("configuration/:id")
  @updatePolicyConfigurationSwaggerMetadata()
  async updateConfiguration(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePolicyConfigurationDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      if (isNaN(userId)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "Invalid or missing userid header"
            )
          );
      }

      const data = await this.policyService.updatePolicyConfiguration(
        id,
        dto,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.policyConfigurationUpdated,
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  @Get("configuration")
  @listPolicyConfigurationsSwaggerMetadata()
  async listConfigurations(
    @Query() query: GetPolicyConfigurationListDto,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const { page, limit, search } = query;
      const data = await this.policyService.listPolicyConfigurations(
        page ?? 1,
        limit ?? 10,
        search
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.policyConfigurationListRetrieved,
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  @Put("configuration/:id/approval")
  @approvalPolicyConfigurationSwaggerMetadata()
  async policyConfigurationApproval(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePolicyConfigurationApprovalDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.updatePolicyConfigurationStatus(
        id,
        dto.isApproved,
        userId,
        dto.remarks
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.policyConfigurationApprovalUpdated,
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  @Get("configuration/company/:companyId/policy-type/:policyTypeLid/export/live")
  async listLiveConfigurationsForExport(
    @Param("companyId", ParseIntPipe) companyId: number,
    @Param("policyTypeLid", ParseIntPipe) policyTypeLid: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data =
        await this.policyService.listLivePolicyConfigurationsForExport(companyId, policyTypeLid);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Live policy configurations fetched successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  @Get("company/:companyId/policy-types")
  async getPolicyTypesByCompanyId(
    @Param("companyId", ParseIntPipe) companyId: number,
    @Query() query: GetPolicyTypesByCompanyDto,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const { search, page, limit } = query;
      const data = await this.policyService.getPolicyTypesByCompanyId(
        companyId,
        search,
        page,
        limit
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy types fetched successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }


  @Post("configuration/:policyId/export")
  async exportPolicyConfiguration(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body() dto: ExportPolicyConfigurationDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      if (isNaN(userId)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "Invalid or missing userid header"
            )
          );
      }

      const data = await this.policyService.exportPolicyConfiguration(
        policyId,
        dto.sourcePolicyConfigurationId,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy configuration exported successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  @Put("reconfigure/:policyId")
  async reconfigurePolicy(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.reconfigurePolicy(policyId, userId);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.policyReconfigured, data)
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  @Put(":policyId/activate")
  @activatePolicySwaggerMetadata()
  async activatePolicy(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body() dto: ActivatePolicyDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.activatePolicy(
        policyId,
        userId,
        dto
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.policyActivated, data)
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  @Delete("configuration/:id")
  @deletePolicyConfigurationSwaggerMetadata()
  async removeConfiguration(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      await this.policyService.deletePolicyConfiguration(id);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.policyConfigurationDeleted,
            null
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  @Get("constraints/:policyId")
  @getPolicyConstraintsSwaggerMetadata()
  async getPolicyConstraints(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.getPolicyConstraintsByPolicyId(
        policyId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy constraints retrieved successfully",
            data
          )
        );
    } catch (error) {
      this.logger.error(
        `Error retrieving policy constraints for policyId ${policyId}: ${error}`
      );
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  @Get(":policyId/template")
  @generateTemplateSwaggerMetadata()
  async getTemplate(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      if (!policyId) {
        throw new Error("Policy ID is required.");
      }

      const result = await this.policyService.generateTemplate(policyId);

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Template generated", result));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to generate template."
          )
        );
    }
  }

  @Get(":policyId/enrollment-template")
  @generateTemplateSwaggerMetadata()
  async getEnrollmentTemplate(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("mode") mode: string | undefined,
    @Query("endorsementType") endorsementType: string | undefined,
    @Res() res: Response
  ): Promise<Response> {
    try {
      if (!policyId) {
        throw new Error("Policy ID is required.");
      }
      const result = mode === "bypass"
        ? await this.policyService.generateBypassTemplate(policyId, endorsementType)
        : await this.policyService.generateDownloadableTemplate(policyId);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Template generated", result));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to generate template."
          )
        );
    }
  }

  @Get(":policyId/documents")
  @getPolicyDocumentsSwaggerMetadata()
  async getPolicyDocuments(
    @Param("policyId") policyId: number,
    @Query() query: GetPolicyQueryDto,
    @Res() res: Response
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "getPolicyDocuments",
          payload: { policyId, query },
          messageData: "method invoked",
        }),
      });
      const { page, limit, searchBy, from, to, sort } = query;
      const documents = await this.policyService.getPolicyDocuments(
        policyId,
        page || DEFAULT_VALUES.PAGE,
        limit || DEFAULT_VALUES.LIMIT,
        searchBy,
        from,
        to,
        sort
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.policyDocumentsRetrieved,
            documents
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyController",
          method: "getPolicyDocuments",
          payload: { policyId, query },
          messageData: error,
        }),
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  @Post(":policyId/documents/upload")
  async uploadPolicyDocument(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body("documentId", ParseIntPipe) documentId: number,
    @Body("documentType") documentType: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      if (!documentType) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(createErrorResponse(HttpStatus.BAD_REQUEST, "documentType is required"));
      }
      const userId = parseInt(req?.headers?.userid as string);
      const data = await this.policyService.uploadPolicyDocument(
        policyId,
        documentId,
        documentType,
        userId,
      );
      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, successMessage.policyDocumentUploaded, data));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("template/download/:documentId")
  @downloadTemplateByIdSwaggerMetadata()
  async downloadTemplateByDocumentId(
    @Param("documentId") documentId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const userId = req.headers['userid'];
    const userDetails = userId ? await this.policyService.getUserDetails(Number(userId)) : null;
    const document = await this.policyService.downloadTemplateByDocumentId(
      documentId,
      userDetails
    );
    res.setHeader("Content-Type", document.mimeType);
    res.attachment(document.fileName);
    res.send(document.buffer);
  }

  @Get(":policyId/tpa-upload-template")
  @downloadTPAUploadTemplateSwaggerMetadata()
  async prepareTPAUploadTemplate(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("endorsementId") endorsementId: number | undefined,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const parsedEndorsementId = endorsementId
        ? parseInt(String(endorsementId), 10)
        : undefined;

      const data = await this.policyService.prepareTPAUploadTemplate(
        policyId,
        parsedEndorsementId
      );
      
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "TPA upload template prepared",
            data
          )
        );
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Post(":policyId/enrollment-upload")
  @queueEnrollmentUploadSwaggerMetadata()
  async queueEnrollmentUpload(
    @Req() req: Request,
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body("documentId", ParseIntPipe) documentId: number,
    @Body("documentType") documentType: string,
    @Res() res: Response,
    @Body("employeeCount", new ParseIntPipe({ optional: true }))
    employeeCount?: number,
    @Body("dependentCount", new ParseIntPipe({ optional: true }))
    dependentCount?: number,
    @Body("endorsementId", new ParseIntPipe({ optional: true }))
    endorsementId?: number,
    @Body("osTicketNumber") osTicketNumber?: string,
    @Body("endorsementType") endorsementType?: string,
    @Body("endorsementEntryDate") endorsementEntryDate?: string,
    @Body("enrollmentStartDate") enrollmentStartDate?: string,
    @Body("enrollmentEndDate") enrollmentEndDate?: string,
    @Body("isInception") isInception?: boolean
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.createEnrollmentUpload(
        policyId,
        userId,
        documentId,
        documentType,
        employeeCount,
        dependentCount,
        endorsementId,
        osTicketNumber,
        endorsementType,
        endorsementEntryDate,
        enrollmentStartDate,
        enrollmentEndDate,
        isInception
      );
      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, "Upload queued", data));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message)
        );
    }
  }

  @Post("policy-configuration/components/upload")
  @uploadPolicyComponentConfigurationSwaggerMetadata()
  async uploadPolicyComponentConfiguration(
    @Req() req: Request,
    @Body() dto: PolicyComponentUploadDto,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.processPolicyComponentUpload(
        dto,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy components processed successfully",
            data
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyController",
          method: "uploadPolicyComponentConfiguration",
          payload: { fileId: dto.fileId, onlyPolicyId: dto.onlyPolicyId },
          messageData: error,
        }),
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  @Post(":policyId/asset-enrollment-upload")
  @queueAssetEnrollmentUploadSwaggerMetadata()
  async queueAssetEnrollmentUpload(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Req() req: Request,
    @Res() res: Response,
    @Body("documentId", ParseIntPipe) documentId: number,
    @Body("documentType") documentType: string,
    @Body("assetCount", new ParseIntPipe({ optional: true }))
    assetCount?: number,
    @Body("subAssetCount", new ParseIntPipe({ optional: true }))
    subAssetCount?: number,
    @Body("endorsementId", new ParseIntPipe({ optional: true }))
    endorsementId?: number,
    @Body("osTicketNumber") osTicketNumber?: string,
    @Body("endorsementType") endorsementType?: string,
    @Body("endorsementEntryDate") endorsementEntryDate?: string,
    @Body("isInception") isInception?: boolean
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.policyService.createAssetEnrollmentUpload(
        policyId,
        userId,
        documentId,
        documentType,
        assetCount,
        subAssetCount,
        endorsementId,
        osTicketNumber,
        endorsementType,
        endorsementEntryDate,
        isInception
      );
      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, "Upload queued", data));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message)
        );
    }
  }

  @Get(":policyId/enrollment-upload-summary")
  @listEnrollmentUploadSummarySwaggerMetadata()
  async listEnrollmentUploadSummary(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Query("tpaData") tpaData?: string,
    @Query("sort") sort?: string,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.listEnrollmentUploadSummary(
        policyId,
        Number(page),
        Number(limit),
        undefined,
        undefined,
        tpaData,
        sort
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Summary retrieved", data));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message)
        );
    }
  }

  @Get(":policyId/:endorsementId/enrollment-upload-summary-by-endorsement")
  @listEnrollmentUploadSummarySwaggerMetadata()
  async listEnrollmentUploadSummaryForEndorsement(
    @Res() res: Response,
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("endorsementId", ParseIntPipe) endorsementId: number,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Query("usePolicyAssetEndorsement") usePolicyAssetEndorsement?: string,
    @Query("tpaData") tpaData?: string,
    @Query("sort") sort?: string
  ): Promise<Response> {
    try {
      const data = await this.policyService.listEnrollmentUploadSummary(
        policyId,
        Number(page),
        Number(limit),
        endorsementId,
        usePolicyAssetEndorsement,
        tpaData,
        sort
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Summary retrieved", data));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message)
        );
    }
  }

  @Post(":policyId/endorsement/template")
  @uploadEndorsementTemplateSwaggerMetadata()
  async uploadEndorsementTemplate(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body("insurerId", ParseIntPipe) insurerId: number,
    @Body("documentId", ParseIntPipe) documentId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "uploadEndorsementTemplate",
          payload: { policyId, insurerId, documentId },
          messageData: "method invoked",
        }),
      });
      await this.policyService.uploadEndorsementTemplate(
        policyId,
        insurerId,
        documentId
      );
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            successMessage.endorsementTemplateUploaded
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyController",
          method: "uploadEndorsementTemplate",
          payload: { policyId, insurerId, documentId },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.endorsementTemplateUploadFailed
          )
        );
    }
  }

  @Get(":policyId/endorsement-batches")
  @listEndorsementBatchesSwaggerMetadata()
  async listEndorsementBatches(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("page") page = DEFAULT_VALUES.PAGE,
    @Query("limit") limit = DEFAULT_VALUES.LIMIT,
    @Query("sort") sort: string,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.listEndorsementBatches(
        policyId,
        Number(page),
        Number(limit),
        sort
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Batches retrieved", data));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message)
        );
    }
  }

  @Get(":policyId/endorsement-batches-tracker")
  @listEndorsementBatchesTrackerSwaggerMetadata()
  async listEndorsementBatchesTracker(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("page") page = DEFAULT_VALUES.PAGE,
    @Query("limit") limit = DEFAULT_VALUES.LIMIT,
    @Query("sort") sort: string | undefined,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.listEndorsementBatchesTracker(
        policyId,
        Number(page),
        Number(limit),
        sort
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Batches retrieved", data));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message)
        );
    }
  }

  @Get(":policyId/asset-endorsement-batches-tracker")
  @listAssetEndorsementBatchesTrackerSwaggerMetadata()
  async listAssetEndorsementBatchesTracker(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("page") page = DEFAULT_VALUES.PAGE,
    @Query("limit") limit = DEFAULT_VALUES.LIMIT,
    @Query("sort") sort: string | undefined,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.listAssetEndorsementBatchesTracker(
        policyId,
        Number(page),
        Number(limit),
        sort
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Batches retrieved", data));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message)
        );
    }
  }

  @Get("summary-dashboard/tat-summary")
  @getPolicyTatSummarySwaggerMetadata()
  async getTatSummary(
    @Query() query: GetTatSummaryQueryDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = Number.parseInt(req?.headers?.userid as string, 10);
    try {
      const mappedQuery = {
        ...query,
        ...(query.ownerId != null || query.userId != null
          ? { ownerId: query.ownerId ?? query.userId }
          : {}),
        viewBy: query.viewBy || query.owner,
        orgId: query.orgId || query.organisationId,
      };
      const isLeadership = await this.scopeService.hasLeadershipRole(
        mappedQuery.ownerId ?? userId
      );
      const summary = await this.policyService.getTatSummary(
        userId,
        mappedQuery,
        isLeadership
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "getTatSummary",
          // ...existing code...
          payload: query,
          messageData: "TAT summary fetched",
        }),
      });

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.tatSummaryRetrieved,
            summary
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyController",
          method: "getTatSummary",
          messageData: error,
        }),
      });

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            errorMessages.tatSummaryFetchFailed
          )
        );
    }
  }

  @Get("summary-dashboard/tat-buckets")
  @getPolicyTatBucketsSwaggerMetadata()
  async getTatBuckets(
    @Query() query: GetTatBucketsQueryDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = Number.parseInt(req?.headers?.userid as string, 10);

    try {
      const buckets = await this.policyService.getTatBuckets(userId, query);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "getTatBuckets",
          payload: query,
          messageData: "TAT buckets fetched",
        }),
      });

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.tatBucketListRetrieved,
            buckets
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyController",
          method: "getTatBuckets",
          payload: query,
          messageData: error,
        }),
      });

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            errorMessages.tatBucketListFetchFailed
          )
        );
    }
  }

  @Get(":policyId/endorsement-steps")
  @getPolicyEndorsementStepsSwaggerMetadata()
  async getPolicyEndorsementSteps(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.getPolicyEndorsementSteps(policyId);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, "Endorsement steps data received", data)
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch endorsement steps"
          )
        );
    }
  }

  @Get(":policyId/endorsement/:endorsementId/premium-calculation-download")
  async getPremiumCalculationDownload(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("endorsementId", ParseIntPipe) endorsementId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const document = await this.policyService.getPremiumCalculationDownload(
        policyId,
        endorsementId
      );
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, "Premium calculation file retrieved", {
          fileName: document.fileName,
          mimeType: document.mimeType,
          buffer: document.buffer,
        })
      );
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get(":policyId/endorsement/:endorsementId/endorsement-steps")
  @getEndorsementStepsSwaggerMetadata()
  async getEndorsementSteps(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("endorsementId", ParseIntPipe) endorsementId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.getEndorsementSteps(
        policyId,
        endorsementId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, "Endorsement steps data received", data)
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch endorsement steps"
          )
        );
    }
  }

  @Get(":policyId/asset-endorsement/:endorsementId/endorsement-steps")
  @getAssetEndorsementStepsSwaggerMetadata()
  async getAssetEndorsementSteps(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("endorsementId", ParseIntPipe) endorsementId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.getAssetEndorsementSteps(
        policyId,
        endorsementId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Asset endorsement steps data received",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch asset endorsement steps"
          )
        );
    }
  }

  @Put(":policyId/endorsement/:endorsementId/endorsement-steps")
  @updateEndorsementStepsSwaggerMetadata()
  async updateEndorsementSteps(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("endorsementId", ParseIntPipe) endorsementId: number,
    @Body() steps: Record<string, any>,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const leadinsurer = await this.lookUpRepository.findOne({
        where: {
          lookUpKey: INSURER_PARTICIPANT_TYPE.INSURER_PARTICIPATION_TYPE_LEAD,
        },
      });
      const requestStart = Date.now();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "updateEndorsementSteps",
          messageData: {
            message: "request-start",
            policyId,
            endorsementId,
            userId,
          },
        }),
      });
      const insurerMapping = await this.policyInsurerMapRepo.findOne({
        where: { policyId, insurerParticipationTypeLid: leadinsurer?.id },
        select: ["insurerId"],
      });
      const insurerId = insurerMapping?.insurerId;
      // const mappings = await this.policyService.getActiveMappingTemplates(insurerId, 'SEND_TO_INSURER');
      // if (!mappings.length) {
      //   throw new Error(`No active mappings found for insurer ID ${insurerId}`);
      // }

      const updateStart = Date.now();
      await this.policyService.updateEndorsementSteps(
        endorsementId,
        steps,
        userId
      );
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "updateEndorsementSteps",
          messageData: {
            message: "updateEndorsementSteps-completed",
            policyId,
            endorsementId,
            durationMs: Date.now() - updateStart,
          },
        }),
      });
      const getStart = Date.now();
      const updatedEndorsementStepData =
        await this.policyService.getEndorsementSteps(policyId, endorsementId);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "updateEndorsementSteps",
          messageData: {
            message: "getEndorsementSteps-completed",
            policyId,
            endorsementId,
            durationMs: Date.now() - getStart,
          },
        }),
      });
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "updateEndorsementSteps",
          messageData: {
            message: "request-completed",
            policyId,
            endorsementId,
            durationMs: Date.now() - requestStart,
          },
        }),
      });
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Endorsement steps updated",
            updatedEndorsementStepData
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to update endorsement steps"
          )
        );
    }
  }

  @Put(":policyId/endorsement/:endorsementId/endorsement-headers")
  @updateEndorsementHeadersSwaggerMetadata()
  async updateEndorsementHeaders(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("endorsementId", ParseIntPipe) endorsementId: number,
    @Body() body: UpdateEndorsementHeadersDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PolicyController",
        method: "updateEndorsementHeaders",
        payload: { policyId, endorsementId, ...body },
        messageData: "method invoked",
      }),
    });

    try {
      const updatedEndorsement = await this.policyService.updateEndorsementHeaders(
        endorsementId,
        body.netPremium,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Endorsement headers updated",
            updatedEndorsement
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to update endorsement headers"
          )
        );
    }
  }

  @Put(":policyId/asset-endorsement/:endorsementId/endorsement-steps")
  @updateAssetEndorsementStepsSwaggerMetadata()
  async updateAssetEndorsementSteps(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("endorsementId", ParseIntPipe) endorsementId: number,
    @Body() steps: Record<string, any>,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      await this.policyService.updateAssetEndorsementSteps(
        endorsementId,
        steps,
        userId
      );
      const updatedAssetEndorsementStepData =
        await this.policyService.getAssetEndorsementSteps(
          policyId,
          endorsementId
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Asset endorsement steps updated",
            updatedAssetEndorsementStepData
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to update asset endorsement steps"
          )
        );
    }
  }

  @Get(":policyId/caution-deposit/transactions")
  @getCautionDepositTransactionsByPolicySwaggerMetadata()
  async getCautionDepositTransactionsByPolicy(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data =
        await this.policyService.getCautionDepositTransactionsByPolicy(
          policyId,
          page || DEFAULT_VALUES.PAGE,
          limit || DEFAULT_VALUES.LIMIT
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Caution deposit transactions retrieved successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch caution deposit transactions"
          )
        );
    }
  }

  @Post("endorsement/field-mapping")
  @createEndorsementFieldMappingSwaggerMetadata()
  async createEndorsementFieldMapping(
    @Body() dto: CreateEndorsementFieldMappingDto,
    @Res() res: Response
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "createEndorsementFieldMapping",
          payload: dto,
          messageData: "method invoked",
        }),
      });
      const result = await this.policyService.createEndorsementFieldMapping(
        dto.insurerId,
        dto.fieldMap
      );
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            successMessage.endorsementMappingCreated,
            result
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyController",
          method: "createEndorsementFieldMapping",
          payload: dto,
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.endorsementFieldMappingFailed
          )
        );
    }
  }

  @Get(":policyId/assets")
  @getPolicyAssetsSwaggerMetadata()
  async getPolicyAssets(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query() query: GetPolicyAssetsDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "getPolicyAssets",
          messageData: "method invoked",
        }),
      });
      const { page, limit, search } = query;
      const data = await this.policyService.getPolicyAssets(
        policyId,
        page ?? DEFAULT_VALUES.PAGE,
        limit ?? DEFAULT_VALUES.LIMIT,
        search?.trim() ?? ""
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy assets retrieved successfully",
            data
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "PolicyController",
          method: "getPolicyAssets",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch policy assets."
          )
        );
    }
  }

  @Get(":policyId/sub-assets")
  @getPolicySubAssetsSwaggerMetadata()
  async getPolicySubAssets(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query() query: GetPolicySubAssetsDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "getPolicySubAssets",
          messageData: "method invoked",
        }),
      });
      const { page, limit, search } = query;
      const data = await this.policyService.getPolicySubAssets(
        policyId,
        page ?? DEFAULT_VALUES.PAGE,
        limit ?? DEFAULT_VALUES.LIMIT,
        search?.trim() ?? ""
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy sub-assets retrieved successfully",
            data
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid),
          status: "failure",
          location: "PolicyController",
          method: "getPolicySubAssets",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch policy sub-assets."
          )
        );
    }
  }

  @Get(":policyId/endorsement/download")
  @downloadEndorsementExcelSwaggerMetadata()
  async downloadExcel(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("insurerId", ParseIntPipe) insurerId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PolicyController",
          method: "downloadExcel",
          payload: { policyId, insurerId },
          messageData: "method invoked",
        }),
      });
      const url = await this.policyService.generateEndorsementExcel(
        policyId,
        insurerId,
        userId
      );
      return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: successMessage.endorsementExcelGenerated,
        data: url,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PolicyController",
          method: "downloadExcel",
          payload: { policyId, insurerId },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.endorsementExcelGenerationFailed
          )
        );
    }
  }

  @Post("endorsement/:endorsementId/tpa-id-upload")
  @uploadTpaIdSwaggerMetadata()
  async uploadTpaIds(
    @Param("endorsementId", ParseIntPipe) endorsementId: number,
    @Body("documentId", ParseIntPipe) documentId: number,
    @Body("policyId", ParseIntPipe) policyId: number,
    @Body("tpaId") tpaId: number | undefined,
    @Body("tpaAcknowledgedDate") tpaAcknowledgedDate: string | undefined,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const record = await this.policyService.uploadTpaIds(
        documentId,
        endorsementId,
        policyId,
        tpaAcknowledgedDate ? new Date(tpaAcknowledgedDate) : undefined
      );
      return res.status(HttpStatus.ACCEPTED).json(
        createResponse(HttpStatus.ACCEPTED, "TPA upload queued", {
          documentProcessingFileId: record.id,
          processStatus: record.processStatus,
        })
      );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message)
        );
    }
  }

  @Get("policy/:policyId/tpa-id-uploads")
  @getTpaIdUploadsSwaggerMetadata()
  async getTpaIdUploads(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("page") page = DEFAULT_VALUES.PAGE,
    @Query("limit") limit = DEFAULT_VALUES.LIMIT,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.getTpaIdUploads(
        policyId,
        page,
        limit
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "TPA uploads fetched successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message)
        );
    }
  }

  @Put(":policyId/:endorsementId/insurer-acknowledgement")
  @acknowledgeEndorsementSwaggerMetadata()
  async acknowledgeEndorsementBatch(
    @Param("endorsementId", ParseIntPipe) endorsementId: number,
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body() dto: UpdateEndorsementAcknowledgementDto,
    @Res() res: Response
  ): Promise<Response> {
    try {
      await this.policyService.acknowledgeEndorsementBatch(
        endorsementId,
        dto.insurerEndorsementNumber,
        dto.uploadedFileId,
        dto.insurerEndorsementDate
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Acknowledgement saved", null));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message)
        );
    }
  }

  async parseSearchString(search?: string): Promise<Record<string, any>> {
    const parsed: Record<string, any> = {};
    if (typeof search === "string" && search.trim()) {
      const toValue = (raw: string) => {
        const v = raw.trim();
        return v === "" || isNaN(Number(v)) ? v : Number(v);
      };
      // Split on commas OUTSIDE brackets, so a multiselect filter written as
      // `verticalId:[3,7]` stays one pair instead of collapsing to its first id.
      const pairs = search.match(/[^,]+:\[[^\]]*\]|[^,]+/g) ?? [];
      for (const pair of pairs) {
        const idx = pair.indexOf(":");
        if (idx < 1) continue;
        const key = pair.slice(0, idx).trim();
        const raw = pair.slice(idx + 1).trim();
        if (!key || !raw) continue;
        if (raw.startsWith("[") && raw.endsWith("]")) {
          const values = raw
            .slice(1, -1)
            .split(",")
            .map(toValue)
            .filter((v) => v !== "");
          // A single-value list keeps its scalar shape — existing callers
          // compare and cast these directly.
          parsed[key] = values.length > 1 ? values : values[0];
        } else {
          parsed[key] = toValue(raw);
        }
      }
    }
    return parsed;
  }

  @Post("inception-create-policy")
  @inceptionCreatePolicySwaggerMetadata()
  async inceptionCreatePolicy(
    @Body() policies: CreatePolicyDto[],
    @Res() res: Response,
    @Req() req: Request
  ) {
    const userId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "inceptionCreatePolicy",
          messageData: "method invoked",
        }),
      });
      const results = await this.policyService.inceptionCreatePolicies(
        policies,
        userId
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.policyCreated, results)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyController",
          method: "inceptionCreatePolicy",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        error.message,
        error.message,
        error.message
      );
    }
  }

  @Post(":policyId/endorsement-notification-email")
  @sendEndorsementNotificationEmailSwaggerMetadata()
  async sendPolicyEmail(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body() dto: EndorsementNotificationEmail,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PolicyController",
        method: "sendPolicyEmail",
        payload: { policyId, ...dto },
        messageData: "method invoked",
      }),
    });
    try {
      await this.policyService.sendEndorsementNotificationEmails(
        policyId,
        dto.url,
        dto.contactType,
        dto.isClientConfirmation,
        dto.attachmentFileIds,
        dto.emailIds,
        dto.ccEmails
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Email sent successfully", null));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PolicyController",
          method: "sendPolicyEmail",
          payload: { policyId, ...dto },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error ? error.message : "Failed to send email"
          )
        );
    }
  }

  // Bulk update policies endpoint
  @Post("bulk-update")
  @bulkUpdatePoliciesSwaggerMetadata()
  async bulkUpdatePolicies(
    @Body() bulkUpdateDto: PolicyBulkUpdateDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const userId =
        bulkUpdateDto.userId || parseInt(req?.headers?.userid as string);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "bulkUpdatePolicies",
          payload: {
            recordCount: bulkUpdateDto.recordIds?.length || 0,
            updateCount: Object.keys(bulkUpdateDto.fieldUpdates || {}).length,
            userId: bulkUpdateDto.userId,
          },
          messageData: "method invoked",
        }),
      });

      // Validate required fields based on selectedAll flag
      if (!bulkUpdateDto.selectedAll && !bulkUpdateDto.recordIds?.length) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "recordIds is required when selectedAll is false"
            )
          );
      }

      if (
        bulkUpdateDto.fieldUpdates &&
        Object.keys(bulkUpdateDto.fieldUpdates).length === 0
      ) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "fieldUpdates is required and must contain at least one field update"
            )
          );
      }

      const result = await this.policyService.bulkUpdatePolicies(
        bulkUpdateDto.recordIds || [],
        bulkUpdateDto.fieldUpdates,
        userId,
        bulkUpdateDto.selectedAll,
        bulkUpdateDto.excludedIds,
        bulkUpdateDto.selectedFilterValues
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "bulkUpdatePolicies",
          payload: {
            totalRecords: result.totalRecords,
            successCount: result.successCount,
            failureCount: result.failureCount,
          },
          messageData: "bulk update completed",
        }),
      });

      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, "Bulk update completed successfully", {
          totalRecords: result.totalRecords,
          successCount: result.successCount,
          failureCount: result.failureCount,
          errors: result.errors,
          affectedRecords: result.affectedRecords,
          processingDuration: result.processingDuration,
          bdOwnerUserList: result.bdOwnerUserList,
          isgOwnerUserList: result.isgOwnerUserList,
          accountManagerUserList: result.accountManagerUserList,
        })
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: bulkUpdateDto.userId,
          status: "failure",
          location: "PolicyController",
          method: "bulkUpdatePolicies",
          payload: {
            recordCount: bulkUpdateDto.recordIds?.length || 0,
            updateCount: Object.keys(bulkUpdateDto.fieldUpdates || {}).length,
          },
          messageData: (error as Error).message || "Bulk update failed",
        }),
      });

      return handleErrorResponse(
        error instanceof HttpException
          ? error
          : new BadRequestException(
              (error as Error).message || "Policy bulk update failed"
            ),
        res,
        (error as Error).message,
        (error as Error).message
      );
    }
  }

  @Post("faq/bulk-upload")
  @bulkUploadFaqSwaggerMetadata()
  async bulkUploadFaq(
    @Body() dto: BulkUploadFaqDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "bulkUpload FAQs",
          payload: {
            userId,
            ...dto,
          },
          messageData: "FAQ bulk upload request received",
        }),
      });
      if (!userId) {
        this.logger.warn({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "success",
            location: "PolicyController",
            method: "bulkUpload FAQs",
            payload: {
              userId,
              ...dto,
            },
            messageData: "Unauthorized FAQ bulk upload attempt",
          }),
        });
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json(
            createErrorResponse(
              HttpStatus.UNAUTHORIZED,
              errorMessages.unauthorizedUser,
              null
            )
          );
      }

      const result = await this.policyService.bulkUploadFaq(dto, userId);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PolicyController",
          method: "bulkUpload FAQs",
          payload: {
            userId,
            ...dto,
          },
          messageData: "FAQ bulk upload completed successfully",
        }),
      });

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "FAQ bulk upload processed successfully",
            result
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userId,
          status: "failure",
          location: "PolicyController",
          method: "bulkUploadFaq",
          payload: {
            userId,
            ...dto,
          },
          messageData: (error as Error).message || "Bulk upload of FAQs failed",
        }),
      });

      return handleErrorResponse(
        error instanceof HttpException
          ? error
          : new BadRequestException(
              (error as Error).message || "FAQs bulk upload failed"
            ),
        res,
        (error as Error).message,
        (error as Error).message
      );
    }
  }

  @Get(":policyId/endorsement/:endorsementId/insurer-document-status")
  @getInsurerDocumentStatusSwaggerMetadata()
  async getSendToInsurerDocumentStatus(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("endorsementId", ParseIntPipe) endorsementId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.getSendToInsurerDocumentStatus(
        policyId,
        endorsementId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Send to insurer document status fetched",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch send to insurer document status"
          )
        );
    }
  }

  @Post(":policyId/endorsement/:endorsementId/insurer-document-status")
  @updateInsurerDocumentStatusSwaggerMetadata()
  async resetSendToInsurerDocumentStatus(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("endorsementId", ParseIntPipe) endorsementId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.resetSendToInsurerDocumentStatus(
        policyId,
        endorsementId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Send to insurer document status reset",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to reset send to insurer document status"
          )
        );
    }
  }

  @Post(":policyId/prepare-seed-data")
  async prepareSeedDataByPolicyId(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.prepareSeedDataByPolicyId(
        policyId,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Seed data prepared successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to reset send to insurer document status"
          )
        );
    }
  }

  @Get(":documentId/get-preview-document")
  async getPreview(
    @Param("documentId", ParseIntPipe) documentId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.policyService.extractExcelData(documentId);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Preview fetched successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch preview document"
          )
        );
    }
  }

  @Post(":policyId/installments")
  @UseInterceptors(FileInterceptor('file'))
  async createPolicyInstallment(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body() createInstallmentDto: CreatePolicyInstallmentDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const userIdHeader = req?.headers?.userid as string;
      const userId = parseInt(userIdHeader);

      if (!userIdHeader || isNaN(userId)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "Invalid or missing userId header",
            ),
          );
      }

      const installment = await this.policyService.createPolicyInstallment(
        policyId,
        createInstallmentDto,
        userId,
        file
      );

      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            "Policy installment created successfully",
            installment
          )
        );
    } catch (error) {
      return handleErrorResponse(error, res);
    }
  }

  @Put(":policyId/installments/:installmentId")
  @UseInterceptors(FileInterceptor('file'))
  async updatePolicyInstallment(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("installmentId", ParseIntPipe) installmentId: number,
    @Body() updateInstallmentDto: UpdatePolicyInstallmentDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const userIdHeader = req?.headers?.userid as string;
      const userId = parseInt(userIdHeader);

      if (!userIdHeader || isNaN(userId)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "Invalid or missing userId header",
            ),
          );
      }

      const installment = await this.policyService.updatePolicyInstallment(
        policyId,
        installmentId,
        updateInstallmentDto,
        userId,
        file
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy installment updated successfully",
            installment
          )
        );
    } catch (error) {
      return handleErrorResponse(error, res);
    }
  }

  // ─── Policy Extension Endpoints ───────────────────────────────────────────

  @Post(":policyId/extension/submit")
  async submitPolicyExtension(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body() body: Record<string, any>,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const { extensionDate, endorsementType, premium, remarks, osTicketNumber, endorsementRequestReceivedDate, endorsementId } = body;
      const result = await this.policyExtensionService.submitExtension(
        policyId,
        {
          extensionDate,
          endorsementType,
          premium: (premium !== null && premium !== undefined) ? Number(premium) : null,
          remarks,
          osTicketNumber,
          endorsementRequestReceivedDate,
          endorsementId: endorsementId != null ? Number(endorsementId) : null,
        },
        userId,
      );
      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, "Policy extension submitted", result));
    } catch (error) {
      return res
        .status(
          error instanceof NotFoundException ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST,
        )
        .json(createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message));
    }
  }

  @Post(":policyId/extension/documents")
  @UseInterceptors(FileInterceptor("file"))
  async uploadExtensionDocument(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("endorsementId", ParseIntPipe) endorsementId: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      if (!file) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(createErrorResponse(HttpStatus.BAD_REQUEST, "No file provided"));
      }
      const userId = parseInt(req?.headers?.userid as string);
      const result = await this.policyExtensionService.uploadDocument(
        policyId,
        endorsementId,
        file,
        userId,
      );
      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, "Document uploaded", result));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message));
    }
  }

  @Get(":policyId/extension/documents")
  async listExtensionDocuments(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("endorsementId", ParseIntPipe) endorsementId: number,
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const data = await this.policyExtensionService.listDocuments(
        policyId,
        endorsementId,
        page ? parseInt(page, 10) : 1,
        limit ? parseInt(limit, 10) : 10,
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Documents retrieved", data));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message));
    }
  }

  @Get(":policyId/extension/template")
  async downloadExtensionTemplate(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const result = await this.policyExtensionService.generateTemplate(policyId);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Template generated", result));
    } catch (error) {
      return res
        .status(
          error instanceof NotFoundException
            ? HttpStatus.NOT_FOUND
            : HttpStatus.BAD_REQUEST,
        )
        .json(createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message));
    }
  }

  @Post(":policyId/extension-upload")
  async queueExtensionUpload(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body("documentId", ParseIntPipe) documentId: number,
    @Body("endorsementId", new ParseIntPipe({ optional: true })) endorsementId: number | undefined,
    @Body("osTicketNumber") osTicketNumber: string | undefined,
    @Body("endorsementType") endorsementType: string | undefined,
    @Body("endorsementRequestReceivedDate") endorsementEntryDate: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const record = await this.policyExtensionService.createExtensionUpload(
        policyId,
        userId,
        documentId,
        endorsementId,
        osTicketNumber,
        endorsementType,
        endorsementEntryDate,
      );
      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, "Extension upload queued", record));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message));
    }
  }

  @Get(":policyId/extension/audit")
  async getExtensionAuditHistory(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("sort") sort: string,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const data = await this.policyExtensionService.getAuditHistory(
        policyId,
        Number(page),
        Number(limit),
        sort,
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Audit history retrieved", data));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message));
    }
  }

  @Get(":policyId/extension/upload-status/:dpfId")
  async getExtensionUploadStatus(
    @Param("policyId", ParseIntPipe) _policyId: number,
    @Param("dpfId", ParseIntPipe) dpfId: number,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const data = await this.policyExtensionService.getUploadStatus(dpfId);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Upload status retrieved", data));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message));
    }
  }

  @Get(":policyId/extension/:endorsementId/details")
  async getExtensionDetails(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("endorsementId", ParseIntPipe) endorsementId: number,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const data = await this.policyExtensionService.getExtensionDetails(policyId, endorsementId);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Extension details retrieved", data));
    } catch (error) {
      return res
        .status(
          error instanceof NotFoundException ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST,
        )
        .json(createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message));
    }
  }

  // ─── MIR Report endpoints ────────────────────────────────────────────────

  @Get("mir-report/list")
  async listMirReports(
    @Query("companyId") companyId: string,
    @Query("period") period: string,
    @Query("status") status: string,
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const data = await this.mirReportService.listMirReports({
        companyId: companyId ? parseInt(companyId) : undefined,
        period,
        status,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      });
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "MIR reports fetched", data));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, (error as Error).message));
    }
  }

  @Post("mir-report/generate")
  async generateMirReport(
    @Body() body: { companyId: number; period: string; organisationId?: number },
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const data = await this.mirReportService.generateMirReport(
        body.companyId,
        body.period,
        userId,
        body.organisationId,
      );
      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, "MIR draft created", data));
    } catch (error) {
      const status =
        error instanceof ConflictException
          ? HttpStatus.CONFLICT
          : error instanceof ForbiddenException
            ? HttpStatus.FORBIDDEN
            : HttpStatus.BAD_REQUEST;
      return res
        .status(status)
        .json(createErrorResponse(status, (error as Error).message));
    }
  }

  @Get("mir-report/:reportId/sections")
  async getMirReportSections(
    @Param("reportId", ParseIntPipe) reportId: number,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const data = await this.mirReportService.getMirReportWithSections(reportId);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "MIR sections fetched", data));
    } catch (error) {
      const status =
        error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(status)
        .json(createErrorResponse(status, (error as Error).message));
    }
  }

  @Post("mir-report/:reportId/submit")
  async submitMirReport(
    @Param("reportId", ParseIntPipe) reportId: number,
    @Body() body: SubmitMirDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const data = await this.mirReportService.submitMirReport(reportId, userId, body);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "MIR submitted for approval", data));
    } catch (error) {
      const status =
        error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : error instanceof ConflictException
            ? HttpStatus.CONFLICT
            : error instanceof ForbiddenException
              ? HttpStatus.FORBIDDEN
              : HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(status)
        .json(createErrorResponse(status, (error as Error).message));
    }
  }

  @Post("mir-report/:reportId/transition")
  async transitionMirReport(
    @Param("reportId", ParseIntPipe) reportId: number,
    @Body() body: { action: string; comment?: string },
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const data = await this.mirReportService.transitionMirReport(
        reportId,
        body.action,
        userId,
        body.comment,
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "MIR status updated", data));
    } catch (error) {
      const status =
        error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : error instanceof ConflictException
            ? HttpStatus.CONFLICT
            : error instanceof ForbiddenException
              ? HttpStatus.FORBIDDEN
              : error instanceof BadRequestException
                ? HttpStatus.BAD_REQUEST
                : HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(status)
        .json(createErrorResponse(status, (error as Error).message));
    }
  }

  @Post("migrate-policies")
  @migratePoliciesSwaggerMetadata()
  async migratePolicies(
    @Res() res: Response,
    @Query("batchSize") batchSize?: string,
  ): Promise<Response> {
    try {
      const result = await this.policyService.migratePolicies(
        batchSize ? Number(batchSize) : undefined,
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Migration completed", result));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

}
