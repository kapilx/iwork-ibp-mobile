import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import axios from "axios";
import { BulkEditRequestDto } from "../dto/bulk-edit-request.dto";
import {
  BulkEditResultDto,
  ValidationResultDto,
  BulkEditErrorDto,
} from "../dto/bulk-edit-result.dto";
import { BulkEditErrorCode } from "../enums/bulk-edit-error-code.enum";
import {
  BULK_EDIT_ENTITY_TYPES,
  BULK_EDITABLE_FIELDS,
  BULK_EDIT_LIMITS,
  type BulkEditEntityType,
  RENEWAL_OPPORTUNITY,
  SALES_OPPORTUNITY,
  USER_STATUS_ACTIVE,
} from "../../../../../../../libs/service-lib/src/lib/constants";
import { BulkEditRepository } from "./bulk-edit.repository";
import {
  errorMessages,
  infoMessages,
} from "../../../../../../../libs/service-lib/src/lib/messages";
import { NotificationUtils } from "../../../../../service-lib/src/lib/utils/notification.utils";
import {
  NOTIFICATION_IN_APP,
  BULK_EDIT_MANAGER_NOTIFICATION,
  BULK_EDIT_OWNERSHIP_RECEIVED,
  BULK_EDIT_OWNERSHIP_TRANSFER,
  BULK_EDIT_NOTIFICATIONS_FIELDS,
  serviceNames,
} from "../../../../../service-lib/src/lib/constants";
import { createLogger } from "../../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../../service-lib/src/lib/utils/logger.util";

/**
 * Service responsible for coordinating bulk edit operations across different entity services
 */
@Injectable()
export class BulkEditService {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly orgServiceBaseUrl = process.env.URL_ORG_SERVICE;
  // No dependencies required; axios used directly
  constructor(
    private readonly bulkEditRepository: BulkEditRepository,
    private readonly notificationUtils: NotificationUtils,
    private readonly traceIdService: TraceIdService
  ) {
    /* intentionally empty */
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.DOCUMENT_SERVICE
    );
  }

  private normalizeEntityType(entityType?: string): BulkEditEntityType | null {
    if (!entityType) {
      return null;
    }

    // Handle SALES_OPPORTUNITY and RENEWAL_OPPORTUNITY mapping to opportunity
    if (
      entityType === BULK_EDIT_ENTITY_TYPES.SALES_OPPORTUNITY ||
      entityType === BULK_EDIT_ENTITY_TYPES.RENEWAL_OPPORTUNITY
    ) {
      return BULK_EDIT_ENTITY_TYPES.OPPORTUNITY;
    }

    const normalized = entityType.toString();
    return (Object.values(BULK_EDIT_ENTITY_TYPES) as string[]).includes(
      normalized
    )
      ? (normalized as BulkEditEntityType)
      : null;
  }

  private normalizeFieldName(fieldName: string): string {
    if (typeof fieldName !== "string") {
      return "";
    }

    return fieldName
      .trim()
      .replace(/[\s_-]+(.)?/g, (_, chr: string) =>
        chr ? chr.toUpperCase() : ""
      )
      .replace(/^(.)/, (match) => match.toLowerCase());
  }

  /**
   * Validates a bulk edit request without executing the changes
   */
  public async validateBulkEdit(
    request: BulkEditRequestDto
  ): Promise<ValidationResultDto> {
    try {
      const normalizedEntityType = this.normalizeEntityType(
        request.entityType as string
      );
      this.logger.log({
        message: "Starting bulk edit validation",
        method: "validateBulkEdit",
        context: {
          entityType: normalizedEntityType ?? request.entityType,
          recordCount: request.recordIds.length,
          updateCount: request.fieldUpdates || 0,
        },
      });

      const validationErrors: BulkEditErrorDto[] = [];
      const warnings: string[] = [];

      // Validate entity type
      if (!normalizedEntityType) {
        validationErrors.push({
          recordId: 0,
          fieldName: "entityType",
          errorCode: BulkEditErrorCode.INVALID_FIELD_VALUE,
          errorMessage: errorMessages.bulkEditInvalidEntityType(
            request.entityType as unknown as string
          ),
        });
      }

      // Add performance warning for large batches (no hard limits)
      if (
        request.recordIds.length >
        BULK_EDIT_LIMITS.LARGE_BATCH_WARNING_THRESHOLD
      ) {
        warnings.push(
          infoMessages.bulkEditLargeBatchWarning(request.recordIds.length)
        );
      }

      // Validate field names for entity type
      if (normalizedEntityType) {
        const allowedFields = BULK_EDITABLE_FIELDS[normalizedEntityType] || [];
        for (const fieldName of Object.keys(request.fieldUpdates || {})) {
          const normalizedFieldName = this.normalizeFieldName(fieldName);
          const allowed = [...allowedFields] as ReadonlyArray<string>;
          if (!allowed.some((a) => a === normalizedFieldName)) {
            validationErrors.push({
              recordId: 0,
              fieldName: fieldName,
              errorCode: BulkEditErrorCode.INVALID_FIELD_VALUE,
              errorMessage: errorMessages.bulkEditFieldNotEditable(
                fieldName,
                normalizedEntityType,
                allowedFields.join(", ")
              ),
            });
          }
        }
      }

      const isValid = validationErrors.length === 0;

      this.logger.log({
        message: infoMessages.bulkEditValidationCompleted(
          isValid,
          validationErrors.length
        ),
        method: "validateBulkEdit",
        context: {
          isValid,
          errorCount: validationErrors.length,
          warningCount: warnings.length,
        },
      });

      return {
        isValid,
        errors: validationErrors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      this.logger.error({
        message: "Error during bulk edit validation",
        method: "validateBulkEdit",
        context: { error: (error as Error).message },
      });
      throw new BadRequestException("Bulk edit validation failed");
    }
  }

  /**
   * Executes a validated bulk edit operation
   */
  public async executeBulkEdit(
    request: BulkEditRequestDto
  ): Promise<BulkEditResultDto> {
    try {
      const normalizedEntityType = this.normalizeEntityType(
        request.entityType as string
      );
      this.logger.log({
        message: infoMessages.bulkEditExecutionStartedInService(
          normalizedEntityType ?? request.entityType,
          request.recordIds.length
        ),
        method: "executeBulkEdit",
        context: {
          entityType: normalizedEntityType ?? request.entityType,
          recordCount: request.recordIds.length,
          updateCount: request.fieldUpdates?.length || 0,
        },
      });

      // First validate the request
      const validation = await this.validateBulkEdit(request);
      if (!validation.isValid) {
        this.logger.warn({
          message: errorMessages.bulkEditValidationRequestFailed,
          method: "executeBulkEdit",
          context: {
            validationErrors: validation.errors,
            errorCount: validation.errors.length,
          },
        });
        throw new BadRequestException(
          errorMessages.bulkEditValidationRequestFailed,
          {
            cause: validation.errors,
            description: errorMessages.bulkEditValidationErrorsBeforeExecution,
          }
        );
      }

      // Route to appropriate entity service based on entity type
      let result: BulkEditResultDto;
      if (!normalizedEntityType) {
        throw new BadRequestException(
          errorMessages.bulkEditInvalidEntityType(request.entityType as string)
        );
      }

      switch (normalizedEntityType) {
        case BULK_EDIT_ENTITY_TYPES.COMPANY:
          result = await this.executeCompanyBulkEdit(request);
          break;
        case BULK_EDIT_ENTITY_TYPES.OPPORTUNITY:
          result = await this.executeOpportunityBulkEdit(request);
          break;
        case BULK_EDIT_ENTITY_TYPES.POLICY:
          result = await this.executePolicyBulkEdit(request);
          break;
        default: {
          const error = errorMessages.bulkEditUnsupportedEntityType(
            request.entityType as string
          );
          this.logger.error({
            message: error,
            method: "executeBulkEdit",
            context: { entityType: request.entityType },
          });
          throw new BadRequestException(error);
        }
      }

      this.logger.log({
        message: "Bulk edit execution completed successfully",
        method: "executeBulkEdit",
        context: {
          entityType: request.entityType,
          totalRecords: result.totalRecords,
          successCount: result.successCount,
          failureCount: result.failureCount,
        },
      });

      return result;
    } catch (error) {
      this.logger.error({
        info: "Bulk Edit Error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "BulkEditService",
          messageData: "Error during bulk edit execution",
          method: "executeBulkEdit",
          payload: {
            context: {
              error: error,
              entityType: request.entityType,
              recordCount: request.recordIds.length,
            },
          },
        }),
      });
      // Re-throw the original error to preserve the specific error message
      throw error;
    }
  }

  /**
   * Execute bulk edit for Company entities (routed to org-service)
   */
  public async executeCompanyBulkEdit(
    request: BulkEditRequestDto
  ): Promise<BulkEditResultDto> {
    try {
      this.logger.log({
        message: `Executing Company bulk edit for ${request.recordIds.length} records`,
        method: "executeCompanyBulkEdit",
        context: {
          recordCount: request.recordIds.length,
          entityType: request.entityType,
          fields: request.fieldUpdates,
          selectedFilterValues: request.selectedFilterValues,
          excludedIds: request.excludedIds,
          selectedAll: request.selectedAll,
        },
      });

      if (!this.orgServiceBaseUrl) {
        throw new BadRequestException(
          "Org service base URL not configured (URL_ORG_SERVICE)."
        );
      }

      // Prepare payload expected by org-service bulkUpdateCompanies
      const payload = {
        recordIds: request.recordIds,
        fieldUpdates: request.fieldUpdates,
        userId: request.userId,
        selectedFilterValues: request.selectedFilterValues,
        excludedIds: request.excludedIds,
        selectedAll: request.selectedAll,
      };

      // NOTE: Endpoint path is an assumption; adjust when org-service controller is implemented.
      const endpoint = `${this.orgServiceBaseUrl}/company/bulk-update`;
      type OrgServiceBulkUpdateResponse = {
        totalRecords?: number;
        successCount?: number;
        failureCount?: number;
        errors?: Array<{
          recordId?: number;
          fieldName?: string;
          errorCode?: string;
          errorMessage?: string;
        }>;
        affectedRecords?: number[];
        processingDuration?: number;
        leadCrmUserList?: any[];
        accountManagerUserList?: any[];
      };
      let serviceResponse: OrgServiceBulkUpdateResponse = {};
      try {
        const resp = await axios.post(endpoint, payload, { timeout: 240000 });
        serviceResponse = resp.data.data as OrgServiceBulkUpdateResponse;
      } catch (axiosError) {
        console.log("axiosError", axiosError);
        const axiosErr = axiosError as Error & {
          response?: { status?: number; data?: Record<string, unknown> };
        };
        this.logger.error({
          message: "Axios request to org-service failed",
          method: "executeCompanyBulkEdit",
          context: {
            endpoint,
            error: axiosErr.message || "Axios request error",
            status: axiosErr.response?.status,
            response: axiosErr.response?.data,
          },
        });
        throw new BadRequestException("Company bulk edit upstream call failed");
      }

      const result: BulkEditResultDto = {
        totalRecords: serviceResponse.totalRecords ?? request.recordIds.length,
        successCount: serviceResponse.successCount ?? 0,
        failureCount: serviceResponse.failureCount ?? 0,
        errors: Array.isArray(serviceResponse.errors)
          ? serviceResponse.errors.map((e) => ({
              recordId: e.recordId ?? 0,
              fieldName: e.fieldName ?? "*",
              errorCode: mapErrorCode(e.errorCode),
              errorMessage: e.errorMessage || e.errorCode || "Bulk edit error",
            }))
          : [],
        affectedRecords: Array.isArray(serviceResponse.affectedRecords)
          ? serviceResponse.affectedRecords
          : [],
        leadCrmUserList: Array.isArray(serviceResponse.leadCrmUserList)
          ? serviceResponse.leadCrmUserList
          : [],
        accountManagerUserList: Array.isArray(
          serviceResponse.accountManagerUserList
        )
          ? serviceResponse.accountManagerUserList
          : [],
      };

      this.logger.log({
        message: "Company bulk edit completed successfully",
        method: "executeCompanyBulkEdit",
        context: {
          request: request,
          totalRecords: result.totalRecords,
          successCount: result.successCount,
          failureCount: result.failureCount,
          entityType: request.entityType,
          leadCrmUserList: result.leadCrmUserList,
          accountManagerUserList: result.accountManagerUserList,
        },
      });
      if (!endpoint.includes("localhost")) {
        await this.notifyOwnershipChange(
          request,
          "leadCrm",
          BULK_EDIT_ENTITY_TYPES.COMPANY,
          result
        );
        await this.notifyOwnershipChange(
          request,
          "accountManager",
          BULK_EDIT_ENTITY_TYPES.COMPANY,
          result
        );
        if (request.fieldUpdates["leadCrm"] && result.leadCrmUserList) {
          result.leadCrmUserList.map(async (user) => {
            await this.notifyPreviousOwnershipChange(
              result.leadCrmUserList,
              "leadCrm",
              BULK_EDIT_ENTITY_TYPES.COMPANY,
              user.leadCrmCount,
              request.fieldUpdates["leadCrm"]
            );
          });
        }
        if (
          request.fieldUpdates["accountManager"] &&
          result.accountManagerUserList
        ) {
          result.accountManagerUserList.map(async (user) => {
            await this.notifyPreviousOwnershipChange(
              result.accountManagerUserList,
              "accountManager",
              BULK_EDIT_ENTITY_TYPES.COMPANY,
              user.accountManagerCount,
              request.fieldUpdates["accountManager"]
            );
          });
        }
      }
      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error({
        message: "Error during Company bulk edit execution",
        method: "executeCompanyBulkEdit",
        context: {
          error: err.message || "Company bulk edit execution error",
          recordCount: request.recordIds.length,
          entityType: request.entityType,
        },
      });
      throw new BadRequestException("Company bulk edit failed");
    }
  }

  /**
   * Execute bulk edit for Opportunity entities (routed to opportunity-service)
   */
  public async executeOpportunityBulkEdit(
    request: BulkEditRequestDto
  ): Promise<BulkEditResultDto> {
    try {
      // Handle entity type mapping for SALES_OPPORTUNITY and RENEWAL_OPPORTUNITY
      let processedEntityType = request.entityType;
      const originalEntityType = request.entityType as string;

      if (
        originalEntityType === BULK_EDIT_ENTITY_TYPES.SALES_OPPORTUNITY ||
        originalEntityType === BULK_EDIT_ENTITY_TYPES.RENEWAL_OPPORTUNITY
      ) {
        request.selectedFilterValues["type"] =
          originalEntityType === BULK_EDIT_ENTITY_TYPES.RENEWAL_OPPORTUNITY
            ? RENEWAL_OPPORTUNITY
            : SALES_OPPORTUNITY;

        processedEntityType = BULK_EDIT_ENTITY_TYPES.OPPORTUNITY;
        this.logger.log({
          message: `Mapping entity type from ${originalEntityType} to ${processedEntityType}`,
          method: "executeOpportunityBulkEdit",
          context: {
            originalEntityType: originalEntityType,
            mappedEntityType: processedEntityType,
          },
        });
      }

      // Process fieldUpdates to remove null values
      const processedFieldUpdates = { ...request.fieldUpdates };
      Object.keys(processedFieldUpdates).forEach((key) => {
        if (
          processedFieldUpdates[key] === null ||
          processedFieldUpdates[key] === undefined
        ) {
          delete processedFieldUpdates[key];
        }
      });

      this.logger.log({
        message: `Executing Opportunity bulk edit for ${request.recordIds.length} records`,
        method: "executeOpportunityBulkEdit",
        context: {
          recordCount: request.recordIds.length,
          entityType: processedEntityType,
          originalFieldUpdates: request.fieldUpdates,
          processedFieldUpdates: processedFieldUpdates,
          selectedFilterValues: request.selectedFilterValues,
          excludedIds: request.excludedIds,
          selectedAll: request.selectedAll,
        },
      });

      // TODO: Get opportunity service base URL from environment
      const opportunityServiceBaseUrl = process.env.URL_OPPORTUNITY_SERVICE;
      if (!opportunityServiceBaseUrl) {
        throw new BadRequestException(
          "Opportunity service base URL not configured (URL_OPPORTUNITY_SERVICE)."
        );
      }

      // Prepare payload expected by opportunity-service bulkUpdateOpportunities
      const payload = {
        recordIds: request.recordIds,
        fieldUpdates: processedFieldUpdates,
        userId: request.userId,
        selectedFilterValues: request.selectedFilterValues,
        excludedIds: request.excludedIds,
        selectedAll: request.selectedAll,
      };

      const endpoint = `${opportunityServiceBaseUrl}/opportunity/bulk-update`;
      type OpportunityServiceBulkUpdateResponse = {
        totalRecords?: number;
        successCount?: number;
        failureCount?: number;
        errors?: Array<{
          recordId?: number;
          fieldName?: string;
          errorCode?: string;
          errorMessage?: string;
        }>;
        affectedRecords?: number[];
        processingDuration?: number;
        bdOwnerUserList?: any[];
        isgOwnerUserList?: any[];
      };
      let serviceResponse: OpportunityServiceBulkUpdateResponse = {};
      try {
        const resp = await axios.post(endpoint, payload, { timeout: 240000 });
        serviceResponse = resp.data
          .data as OpportunityServiceBulkUpdateResponse;
      } catch (axiosError) {
        console.log("axiosError", axiosError);
        const axiosErr = axiosError as Error & {
          response?: { status?: number; data?: Record<string, unknown> };
        };
        this.logger.error({
          message: "Axios request to opportunity-service failed",
          method: "executeOpportunityBulkEdit",
          context: {
            endpoint,
            error: axiosErr.message || "Axios request error",
            status: axiosErr.response?.status,
            response: axiosErr.response?.data,
          },
        });
        throw new BadRequestException(
          "Opportunity bulk edit upstream call failed"
        );
      }

      const result: BulkEditResultDto = {
        totalRecords: serviceResponse.totalRecords ?? request.recordIds.length,
        successCount: serviceResponse.successCount ?? 0,
        failureCount: serviceResponse.failureCount ?? 0,
        errors: Array.isArray(serviceResponse.errors)
          ? serviceResponse.errors.map((e) => ({
              recordId: e.recordId ?? 0,
              fieldName: e.fieldName ?? "*",
              errorCode: mapErrorCode(e.errorCode),
              errorMessage: e.errorMessage || e.errorCode || "Bulk edit error",
            }))
          : [],
        affectedRecords: Array.isArray(serviceResponse.affectedRecords)
          ? serviceResponse.affectedRecords
          : [],
        bdOwnerUserList: Array.isArray(serviceResponse.bdOwnerUserList)
          ? serviceResponse.bdOwnerUserList
          : [],
        isgOwnerUserList: Array.isArray(serviceResponse.isgOwnerUserList)
          ? serviceResponse.isgOwnerUserList
          : [],
      };

      this.logger.log({
        message: "Opportunity bulk edit completed successfully",
        method: "executeOpportunityBulkEdit",
        context: {
          request: request,
          totalRecords: result.totalRecords,
          successCount: result.successCount,
          failureCount: result.failureCount,
          entityType: request.entityType,
          bdOwnerUserList: result.bdOwnerUserList,
          isgOwnerUserList: result.isgOwnerUserList,
        },
      });

      if (!endpoint.includes("localhost")) {
        await this.notifyOwnershipChange(
          request,
          "ownerId",
          BULK_EDIT_ENTITY_TYPES.OPPORTUNITY,
          result
        );
        await this.notifyOwnershipChange(
          request,
          "isgId",
          BULK_EDIT_ENTITY_TYPES.OPPORTUNITY,
          result
        );
        if (request.fieldUpdates["ownerId"] && result.bdOwnerUserList) {
          result.bdOwnerUserList.map(async (user) => {
            await this.notifyPreviousOwnershipChange(
              result.bdOwnerUserList,
              "bdOwner",
              BULK_EDIT_ENTITY_TYPES.OPPORTUNITY,
              user.bdOwnerCount,
              request.fieldUpdates["ownerId"]
            );
          });
        }
        if (request.fieldUpdates["isgId"] && result.isgOwnerUserList) {
          result.isgOwnerUserList.map(async (user) => {
            await this.notifyPreviousOwnershipChange(
              result.isgOwnerUserList,
              "isgOwner",
              BULK_EDIT_ENTITY_TYPES.OPPORTUNITY,
              user.isgOwnerCount,
              request.fieldUpdates["ownerId"]
            );
          });
        }
      }

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error({
        message: "Error during Opportunity bulk edit execution",
        method: "executeOpportunityBulkEdit",
        context: {
          error: err.message || "Opportunity bulk edit execution error",
          recordCount: request.recordIds.length,
          entityType: request.entityType,
        },
      });
      throw new BadRequestException("Opportunity bulk edit failed");
    }
  }

  /**
   * Execute bulk edit for Policy entities (routed to policy-service)
   */
  public async executePolicyBulkEdit(
    request: BulkEditRequestDto
  ): Promise<BulkEditResultDto> {
    try {
      this.logger.log({
        message: `Executing Policy bulk edit for ${request.recordIds.length} records`,
        method: "executePolicyBulkEdit",
        context: {
          recordCount: request.recordIds.length,
          entityType: request.entityType,
          fields: request.fieldUpdates,
          selectedFilterValues: request.selectedFilterValues,
          excludedIds: request.excludedIds,
          selectedAll: request.selectedAll,
        },
      });

      // TODO: Get policy service base URL from environment
      const policyServiceBaseUrl = process.env.URL_POLICY_SERVICE;
      if (!policyServiceBaseUrl) {
        throw new BadRequestException(
          "Policy service base URL not configured (URL_POLICY_SERVICE)."
        );
      }

      // Prepare payload expected by policy-service bulkUpdatePolicies
      const payload = {
        recordIds: request.recordIds,
        fieldUpdates: request.fieldUpdates,
        userId: request.userId,
        selectedFilterValues: request.selectedFilterValues,
        excludedIds: request.excludedIds,
        selectedAll: request.selectedAll,
      };

      const endpoint = `${policyServiceBaseUrl}/policy/bulk-update`;
      type PolicyServiceBulkUpdateResponse = {
        totalRecords?: number;
        successCount?: number;
        failureCount?: number;
        errors?: Array<{
          recordId?: number;
          fieldName?: string;
          errorCode?: string;
          errorMessage?: string;
        }>;
        affectedRecords?: number[];
        processingDuration?: number;
        bdOwnerUserList?: any[];
        isgOwnerUserList?: any[];
        accountManagerUserList?: any[];
      };
      let serviceResponse: PolicyServiceBulkUpdateResponse = {};
      try {
        const resp = await axios.post(endpoint, payload, { timeout: 240000 });
        serviceResponse = resp.data.data as PolicyServiceBulkUpdateResponse;
      } catch (axiosError) {
        console.log("axiosError", axiosError);
        const axiosErr = axiosError as Error & {
          response?: { status?: number; data?: Record<string, unknown> };
        };
        this.logger.error({
          message: "Axios request to policy-service failed",
          method: "executePolicyBulkEdit",
          context: {
            endpoint,
            error: axiosErr.message || "Axios request error",
            status: axiosErr.response?.status,
            response: axiosErr.response?.data,
          },
        });
        throw new BadRequestException("Policy bulk edit upstream call failed");
      }
      const result: BulkEditResultDto = {
        totalRecords: serviceResponse.totalRecords ?? request.recordIds.length,
        successCount: serviceResponse.successCount ?? 0,
        failureCount: serviceResponse.failureCount ?? 0,
        errors: Array.isArray(serviceResponse.errors)
          ? serviceResponse.errors.map((e) => ({
              recordId: e.recordId ?? 0,
              fieldName: e.fieldName ?? "*",
              errorCode: mapErrorCode(e.errorCode),
              errorMessage: e.errorMessage || e.errorCode || "Bulk edit error",
            }))
          : [],
        affectedRecords: Array.isArray(serviceResponse.affectedRecords)
          ? serviceResponse.affectedRecords
          : [],
        bdOwnerUserList: Array.isArray(serviceResponse.bdOwnerUserList)
          ? serviceResponse.bdOwnerUserList
          : [],
        isgOwnerUserList: Array.isArray(serviceResponse.isgOwnerUserList)
          ? serviceResponse.isgOwnerUserList
          : [],
        accountManagerUserList: Array.isArray(
          serviceResponse.accountManagerUserList
        )
          ? serviceResponse.accountManagerUserList
          : [],
      };

      this.logger.log({
        message: "Policy bulk edit completed successfully",
        method: "executePolicyBulkEdit",
        context: {
          request: request,
          totalRecords: result.totalRecords,
          successCount: result.successCount,
          failureCount: result.failureCount,
          entityType: request.entityType,
          bdOwnerUserList: result.bdOwnerUserList,
          isgOwnerUserList: result.isgOwnerUserList,
          accountManagerUserList: result.accountManagerUserList,
        },
      });
      if (!endpoint.includes("localhost")) {
        await this.notifyOwnershipChange(
          request,
          "ownerId",
          BULK_EDIT_ENTITY_TYPES.POLICY,
          result
        );
        await this.notifyOwnershipChange(
          request,
          "isgId",
          BULK_EDIT_ENTITY_TYPES.POLICY,
          result
        );
        await this.notifyOwnershipChange(
          request,
          "amId",
          BULK_EDIT_ENTITY_TYPES.POLICY,
          result
        );

        if (request.fieldUpdates["ownerId"] && result.bdOwnerUserList) {
          result.bdOwnerUserList.map(async (user) => {
            await this.notifyPreviousOwnershipChange(
              result.bdOwnerUserList,
              "bdOwner",
              BULK_EDIT_ENTITY_TYPES.POLICY,
              user.bdOwnerCount,
              request.fieldUpdates["ownerId"]
            );
          });
        }
        if (request.fieldUpdates["isgId"] && result.isgOwnerUserList) {
          result.isgOwnerUserList.map(async (user) => {
            await this.notifyPreviousOwnershipChange(
              result.isgOwnerUserList,
              "isgOwner",
              BULK_EDIT_ENTITY_TYPES.POLICY,
              user.isgOwnerCount,
              request.fieldUpdates["isgId"]
            );
          });
        }
        if (request.fieldUpdates["amId"] && result.accountManagerUserList) {
          result.accountManagerUserList.map(async (user) => {
            await this.notifyPreviousOwnershipChange(
              result.accountManagerUserList,
              "accountManager",
              BULK_EDIT_ENTITY_TYPES.POLICY,
              user.accountManagerCount,
              request.fieldUpdates["amId"]
            );
          });
        }
      }
      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error({
        message: "Error during Policy bulk edit execution",
        method: "executePolicyBulkEdit",
        context: {
          error: err.message || "Policy bulk edit execution error",
          recordCount: request.recordIds.length,
          entityType: request.entityType,
        },
      });
      throw new BadRequestException("Policy bulk edit failed");
    }
  }

  /**
   * Get user and manager details for notification purposes
   */
  public async getUserAndManagerDetails(userId: number): Promise<{
    receiverUser: {
      userId: number;
      firstName: string;
      lastName: string;
      emailId: string;
      userStatusKey: string;
    } | null;
    managerUser: {
      userId: number;
      firstName: string;
      lastName: string;
      emailId: string;
      userStatusKey: string;
    } | null;
  }> {
    try {
      this.logger.log({
        message: "Getting user and manager details for notification",
        method: "getUserAndManagerDetails",
        context: { userId },
      });

      const result = await this.bulkEditRepository.getUserAndManagerDetails(
        userId
      );

      if (!result.user) {
        this.logger.warn({
          message: "User not found for notification",
          method: "getUserAndManagerDetails",
          context: { userId },
        });
        return { receiverUser: null, managerUser: null };
      }

      const receiverUser = {
        userId: result.user.userId,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        emailId: result.user.emailId,
        userStatusKey: result.user.userStatusKey,
      };

      let managerUser = null;
      if (result.manager) {
        managerUser = {
          userId: result.manager.userId,
          firstName: result.manager.firstName,
          lastName: result.manager.lastName,
          emailId: result.manager.emailId,
          userStatusKey: result.manager.userStatusKey,
        };
      }

      this.logger.log({
        message: "Successfully retrieved user and manager details",
        method: "getUserAndManagerDetails",
        context: {
          userId,
          hasManager: !!managerUser,
        },
      });

      return { receiverUser, managerUser };
    } catch (error) {
      const err = error as Error;
      this.logger.error({
        message: "Error getting user and manager details",
        method: "getUserAndManagerDetails",
        context: {
          userId,
          error: err.message,
        },
      });
      throw new BadRequestException(
        `Failed to get user details: ${err.message}`
      );
    }
  }

  /**
   * Send notification to previous user about ownership transfer
   */
  public async sendNotificationsToPreviousUser(
    ownerName: string,
    emailId: string,
    entityType: string,
    noOfRecords: number,
    userId: number
  ): Promise<void> {
    try {
      this.logger.log({
        message: "Sending notification to previous user",
        method: "sendNotificationsToPreviousUser",
        context: { ownerName, emailId, entityType, noOfRecords, userId },
      });

      const eventType = BULK_EDIT_OWNERSHIP_TRANSFER;

      // Get notification service URL
      const notificationServiceUrl = process.env.URL_NOTIFICATION_SERVICE;
      if (!notificationServiceUrl) {
        throw new BadRequestException(
          "Notification service URL not configured (URL_NOTIFICATION_SERVICE)"
        );
      }

      const eventDetails =
        await this.notificationUtils.getNotificationDetailsByEvent(eventType);
      const parameters: Record<string, string | number> = {};
      // Dynamic parameter mapping based on eventDetails
      eventDetails.forEach((detail, index) => {
        if (
          detail.parameterKey === BULK_EDIT_NOTIFICATIONS_FIELDS.ENTITY_TYPE
        ) {
          parameters[detail.parameterKey] = entityType;
        } else if (
          detail.parameterKey === BULK_EDIT_NOTIFICATIONS_FIELDS.NO_OF_RECORDS
        ) {
          parameters[detail.parameterKey] = noOfRecords.toString();
        } else if (
          detail.parameterKey === BULK_EDIT_NOTIFICATIONS_FIELDS.OWNER_NAME
        ) {
          parameters[detail.parameterKey] = ownerName;
        }
      });

      const notificationPayload = {
        eventType: eventType,
        emailId: [emailId],
        channel: NOTIFICATION_IN_APP,
        parameters: parameters,
        userId: [userId],
      };
      const endpoint = `${notificationServiceUrl}/notifications`;
      this.logger.log({
        info: "Manager notifications payload",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userId,
          status: "success",
          location: "BulkEditService",
          method: "sendNotificationsToPreviousUser",
          payload: {
            endpoint: endpoint,
            axiosPayload: notificationPayload,
          },
          messageData: "notifcations axios call",
        }),
      });

      await axios.post(endpoint, notificationPayload, {
        timeout: 30000,
      });

      this.logger.log({
        message: "Successfully sent notification to previous user",
        method: "sendNotificationsToPreviousUser",
        context: { userId, eventType, entityType },
      });
    } catch (error) {
      const err = error as Error;
      this.logger.log({
        info: "Manager notifications payload to previous user",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userId,
          status: "failure",
          location: "BulkEditService",
          method: "sendNotificationsToPreviousUser",
          payload: {
            error: err,
          },
          messageData: "notifcations axios call failure",
        }),
      });

      this.logger.error({
        message: "Error sending notification to previous user",
        method: "sendNotificationsToPreviousUser",
        context: {
          userId,
          entityType,
          error: err.message,
        },
      });
      // Best-effort: a notification failure must not fail the bulk edit
      // itself — the underlying record update already succeeded by the
      // time this is called.
    }
  }
  /**
   * Send notification to receiver user about ownership transfer
   */
  public async sendNotificationsToReceiverUser(
    ownerName: string,
    emailId: string,
    entityType: string,
    noOfRecords: number,
    userId: number
  ): Promise<void> {
    try {
      this.logger.log({
        message: "Sending notification to receiver user",
        method: "sendNotificationsToReceiverUser",
        context: { ownerName, emailId, entityType, noOfRecords, userId },
      });

      const eventType = BULK_EDIT_OWNERSHIP_RECEIVED;

      // Get notification service URL
      const notificationServiceUrl = process.env.URL_NOTIFICATION_SERVICE;
      if (!notificationServiceUrl) {
        throw new BadRequestException(
          "Notification service URL not configured (URL_NOTIFICATION_SERVICE)"
        );
      }

      const eventDetails =
        await this.notificationUtils.getNotificationDetailsByEvent(eventType);
      const parameters: Record<string, string | number> = {};
      // Dynamic parameter mapping based on eventDetails
      eventDetails.forEach((detail, index) => {
        if (
          detail.parameterKey === BULK_EDIT_NOTIFICATIONS_FIELDS.ENTITY_TYPE
        ) {
          parameters[detail.parameterKey] = entityType;
        } else if (
          detail.parameterKey === BULK_EDIT_NOTIFICATIONS_FIELDS.NO_OF_RECORDS
        ) {
          parameters[detail.parameterKey] = noOfRecords.toString();
        } else if (
          detail.parameterKey === BULK_EDIT_NOTIFICATIONS_FIELDS.OWNER_NAME
        ) {
          parameters[detail.parameterKey] = ownerName;
        }
      });

      const notificationPayload = {
        eventType: eventType,
        emailId: [emailId],
        channel: NOTIFICATION_IN_APP,
        parameters: parameters,
        userId: [userId],
      };
      const endpoint = `${notificationServiceUrl}/notifications`;
      this.logger.log({
        info: "Sending notification to payload",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userId,
          status: "success",
          location: "BulkEditService",
          method: "sendNotificationsToReceiverUser",
          payload: {
            endpoint: endpoint,
            axiosPayload: notificationPayload,
          },
          messageData: "notifcations axios call",
        }),
      });

      await axios.post(endpoint, notificationPayload, {
        timeout: 30000,
      });

      this.logger.log({
        message: "Successfully sent notification to receiver user",
        method: "sendNotificationsToReceiverUser",
        context: { userId, eventType, entityType },
      });
    } catch (error) {
      const err = error as Error;
      this.logger.log({
        info: "Manager notifications payload to receiver user",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userId,
          status: "failure",
          location: "BulkEditService",
          method: "sendNotificationsToReceiverUser",
          payload: {
            error: err,
          },
          messageData: "notifcations axios call failure on receiver side",
        }),
      });
      this.logger.error({
        message: "Error sending notification to receiver user",
        method: "sendNotificationsToReceiverUser",
        context: {
          userId,
          entityType,
          error: err.message,
        },
      });
      // Best-effort: a notification failure must not fail the bulk edit
      // itself — the underlying record update already succeeded by the
      // time this is called.
    }
  }

  /**
   * Send notification to manager user about ownership change
   */
  public async sendNotificationsToManagerUser(
    ownerName: string,
    emailId: string,
    entityType: string,
    noOfRecords: number,
    userId: number
  ): Promise<void> {
    try {
      this.logger.log({
        message: "Sending notification to manager user",
        method: "sendNotificationsToManagerUser",
        context: { ownerName, emailId, entityType, noOfRecords, userId },
      });

      const eventType = BULK_EDIT_MANAGER_NOTIFICATION;

      // Get notification service URL
      const notificationServiceUrl = process.env.URL_NOTIFICATION_SERVICE;
      if (!notificationServiceUrl) {
        throw new BadRequestException(
          "Notification service URL not configured (URL_NOTIFICATION_SERVICE)"
        );
      }

      const eventDetails =
        await this.notificationUtils.getNotificationDetailsByEvent(eventType);
      const parameters: Record<string, string | number> = {};

      // Dynamic parameter mapping based on eventDetails
      eventDetails.forEach((detail, index) => {
        if (
          detail.parameterKey === BULK_EDIT_NOTIFICATIONS_FIELDS.ENTITY_TYPE
        ) {
          parameters[detail.parameterKey] = entityType;
        } else if (
          detail.parameterKey === BULK_EDIT_NOTIFICATIONS_FIELDS.NO_OF_RECORDS
        ) {
          parameters[detail.parameterKey] = noOfRecords.toString();
        } else if (
          detail.parameterKey === BULK_EDIT_NOTIFICATIONS_FIELDS.OWNER_NAME
        ) {
          parameters[detail.parameterKey] = ownerName;
        }
      });

      const notificationPayload = {
        eventType: eventType,
        emailId: [emailId],
        channel: NOTIFICATION_IN_APP,
        parameters: parameters,
        userId: [userId],
      };
      const endpoint = `${notificationServiceUrl}/notifications`;
      this.logger.log({
        info: "Manager notifications payload",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userId,
          status: "success",
          location: "BulkEditService",
          method: "sendNotificationsToManagerUser",
          payload: {
            endpoint: endpoint,
            axiosPayload: notificationPayload,
          },
          messageData: "notifcations axios call",
        }),
      });

      await axios.post(endpoint, notificationPayload, {
        timeout: 30000,
      });

      this.logger.log({
        message: "Successfully sent notification to manager user",
        method: "sendNotificationsToManagerUser",
        context: { userId, eventType, entityType },
      });
    } catch (error) {
      const err = error as Error;
      this.logger.log({
        info: "Manager notifications payload to manager user",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userId,
          status: "failure",
          location: "BulkEditService",
          method: "sendNotificationsToManagerUser",
          payload: {
            error: err,
          },
          messageData: "notifcations axios call failure on manager side",
        }),
      });
      this.logger.error({
        message: "Error sending notification to manager user",
        method: "sendNotificationsToManagerUser",
        context: {
          userId,
          entityType,
          error: err.message,
        },
      });
      // Best-effort: a notification failure must not fail the bulk edit
      // itself — the underlying record update already succeeded by the
      // time this is called.
    }
  }

  async findUsersWithSameRole(userId: number) {
    try {
      this.logger.log({
        level: "info",
        message: {
          userId,
          status: "success",
          location: "BulkAssignmentService",
          method: "findUsersWithSameRole",
          payload: { userId },
          messageData: "method invoked",
        },
      });

      const user = await this.bulkEditRepository.findUserWithRoles(userId);

      if (!user || user.deletedAt) {
        throw new NotFoundException(`User with id ${userId} not found.`);
      }

      const roleIds = Array.from(
        new Set(
          (user.userRoles ?? [])
            .map((userRole: any) => userRole.roleId)
            .filter(
              (roleId: any): roleId is number => typeof roleId === "number"
            )
        )
      );

      if (roleIds.length === 0) {
        throw new BadRequestException(
          `User with id ${userId} does not have any roles assigned.`
        );
      }

      const peers =
        await this.bulkEditRepository.findPeersByRoleAndOrganisation(
          roleIds,
          user.organisationId
        );
      const allPeers = await this.mapUsers(peers);
      const response = {
        user: await this.mapUser(user),
        peers: allPeers,
        count: allPeers.length,
      };

      this.logger.log({
        level: "info",
        message: {
          userId,
          status: "success",
          location: "BulkAssignmentService",
          method: "findUsersWithSameRole",
          payload: { userId },
          messageData: "role peers retrieved",
        },
      });

      return response;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: {
          userId,
          status: "failure",
          location: "BulkAssignmentService",
          method: "findUsersWithSameRole",
          payload: { userId },
          messageData: error instanceof Error ? error.message : error,
        },
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new Error(
        error instanceof Error && error.message
          ? error.message
          : errorMessages.bulkAssignmentRoleFetchFailed
      );
    }
  }

  async findUsersByRoleName(roleKey: string, organisationId: number) {
    try {
      this.logger.log({
        level: "info",
        message: {
          roleKey,
          organisationId,
          status: "success",
          location: "BulkAssignmentService",
          method: "findUsersByRoleName",
          payload: { roleKey, organisationId },
          messageData: "method invoked",
        },
      });

      // First find the role by name
      const role = await this.bulkEditRepository.findRoleByName(roleKey);

      if (!role) {
        throw new NotFoundException(`Role with name '${roleKey}' not found.`);
      }

      // Then find all users with that role in the given organisation
      const users =
        await this.bulkEditRepository.findPeersByRoleAndOrganisation(
          [role.id],
          organisationId
        );

      const response = {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          roleKey: role.roleKey,
        },
        users: await this.mapUsers(users),
        totalCount: users.length,
      };

      this.logger.log({
        level: "info",
        message: {
          roleKey,
          organisationId,
          status: "success",
          location: "BulkAssignmentService",
          method: "findUsersByRoleName",
          payload: { roleKey, organisationId, userCount: users.length },
          messageData: "users by role name retrieved successfully",
        },
      });

      return response;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: {
          roleKey,
          organisationId,
          status: "failure",
          location: "BulkAssignmentService",
          method: "findUsersByRoleName",
          payload: { roleKey, organisationId },
          messageData: error instanceof Error ? error.message : error,
        },
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new Error(
        error instanceof Error && error.message
          ? error.message
          : `Failed to fetch users for role: ${roleKey}`
      );
    }
  }

  public async mapUsers(users: any[]): Promise<any[]> {
    try {
      const uniqueUsers = new Map<number, any>();
      for (const user of users) {
        uniqueUsers.set(user.userId, await this.mapUser(user));
      }
      return Array.from(uniqueUsers.values());
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `Failed to map users: ${error.message}`
          : "Failed to map users."
      );
    }
  }

  public async mapUser(user: any): Promise<any> {
    try {
      return {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId,
        organisationId: user.organisationId,
        roles: (user.userRoles ?? []).map((userRole: any) => ({
          roleId: userRole.roleId,
          roleName: userRole.role ? userRole.role.name : undefined,
          roleKey: userRole.role ? userRole.role.roleKey : undefined,
        })),
      };
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `Failed to map user details: ${error.message}`
          : "Failed to map user details."
      );
    }
  }
  async notifyPreviousOwnershipChange(
    resultList: any,
    userFieldKey: string,
    entityType: string,
    resultCount: number,
    receiverUserId: number
  ) {
    for (const request of resultList) {
      const userIdValue = request["userId"];
      if (userIdValue) {
        resultCount = request[`${userFieldKey}Count`];
        const usersData = await this.getUserAndManagerDetails(
          Number(userIdValue)
        );
        const { receiverUser: previousUser } = usersData;
        if (previousUser && previousUser.userStatusKey === USER_STATUS_ACTIVE) {
          const allUserData = await this.getUserAndManagerDetails(
            Number(receiverUserId)
          );
          const { receiverUser } = allUserData;
          await this.sendNotificationsToPreviousUser(
            receiverUser.firstName,
            previousUser.emailId,
            entityType,
            resultCount,
            previousUser.userId
          );
        }
      }
    }
  }
  async notifyOwnershipChange(
    request: any,
    userFieldKey: string,
    entityType: string,
    result: BulkEditResultDto
  ) {
    const userIdValue = request.fieldUpdates[userFieldKey];
    if (userIdValue) {
      const usersData = await this.getUserAndManagerDetails(
        Number(userIdValue)
      );
      const { receiverUser, managerUser } = usersData;
      if (receiverUser) {
        await this.sendNotificationsToReceiverUser(
          receiverUser.firstName,
          receiverUser.emailId,
          entityType,
          result.successCount,
          receiverUser.userId
        );
      }
      if (receiverUser && managerUser) {
        await this.sendNotificationsToManagerUser(
          receiverUser.firstName,
          managerUser.emailId,
          entityType,
          result.successCount,
          managerUser.userId
        );
      }
    }
  }
}

// Map opportunity-service response to BulkEditResultDto
export const mapErrorCode = (code?: string): BulkEditErrorCode => {
  switch (code) {
    case "NOT_FOUND":
      return BulkEditErrorCode.RECORD_NOT_FOUND;
    case "FIELD_NOT_BULK_EDITABLE":
    case "FIELD_NON_EDITABLE":
    case "INVALID_TYPE":
      return BulkEditErrorCode.INVALID_FIELD_VALUE;
    case "UPDATE_FAILED":
    case "EXCEPTION":
      return BulkEditErrorCode.DATABASE_ERROR;
    default:
      return BulkEditErrorCode.VALIDATION_FAILED;
  }
};
