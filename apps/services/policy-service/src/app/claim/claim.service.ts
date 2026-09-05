import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  HttpException,
} from "@nestjs/common";
import { QueryFailedError } from "typeorm";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import {
  DOCUMENT_PROCESS_STATUS,
  serviceNames,
} from "../../../../service-lib/src/lib/constants";
import {
  DEFAULT_TOTAL_KPI_COUNT,
  DOCUMENT_ENTITY_TYPE,
  DOCUMENT_TYPE,
  OWNER_TYPES,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  OPPORTUNITY_MAP_TABLE_DELETE_FIELDS,
  ATTRIBUTE_FIELD_MAP,
} from "../../../../service-lib/src/lib/constants";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { ClaimBatchItemDto, ClaimDto, ClaimListItemDto } from "./dto";
import { PolicySummaryDto } from "../policy/dto/policy-summary.dto";
import { ClaimRepository } from "./claim.repository";
import { mapSearchParams } from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { getDateRange } from "../../../../service-lib/src/lib/utils/get-data-range.utils";
import path from "path";
import fs from "fs";
import AWS from "aws-sdk";
import * as XLSX from "xlsx";
import {
  ENDORSEMENT_TAT_BUCKETS,
  EndorsementTatFilterLabel,
  normalizeEndorsementTatFilter,
} from "../../../../../../libs/service-lib/src/lib/utils/tat.utils";
import { sanitizePath } from "../../../../service-lib/src/lib/utils/path-sanitizer.util";

// Vertical and branch are multiselect filters: accept a single id or a list.
const idMatches = (selected: any, rowId: any): boolean => {
  if (!selected) return true;
  const ids = (Array.isArray(selected) ? selected : [selected]).map(Number);
  return ids.includes(Number(rowId));
};


const CLAIM_TAT_BUCKETS = ENDORSEMENT_TAT_BUCKETS;

@Injectable()
export class ClaimService {
  private readonly s3: AWS.S3;
  private readonly bucket = process.env.S3_AWS_BUCKET || "";
  private readonly repoMode = process.env.DOCUMENT_REPOSITORY_MODE || "LFS";
  private readonly docRepoPath =
    process.env.DOCUMENT_REPOSITORY || "tmp/document-repository";
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly claimRepository: ClaimRepository,
    private readonly traceIdService: TraceIdService,
    private readonly scopeService: ScopeService,
  ) {
    if (this.repoMode === "AWS") {
      AWS.config.update({ region: process.env.S3_AWS_REGION });
      this.s3 = new AWS.S3();
    }
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.POLICY_SERVICE,
    );
  }

  private normalizeClaimTemplateType(value?: string): string {
    return value?.trim() ? value.trim() : "GMC";
  }

  async generateClaimsTemplate(
    claimType?: string,
    queryTpaId?: string,
    policyId?: string): Promise<{
    documentId: number;
    fileName: string;
  }> {
    const normalizedClaimType = this.normalizeClaimTemplateType(claimType);
    const safeType = normalizedClaimType.replace(/\s+/g, "-").toLowerCase();

    let tpaId = Number(queryTpaId) ? Number(queryTpaId) : undefined;
    if(policyId && !tpaId) {
      const policyTpaMappings = await this.claimRepository.findPolicyWithTpaMappings(Number(policyId));
      if(!policyTpaMappings || (policyTpaMappings && policyTpaMappings.tpaMappings.length === 0)) {
        throw new BadRequestException(errorMessages.noTpaMappingsFoundForPolicyId);
      }
      tpaId = policyTpaMappings?.tpaMappings[0]?.tpaId;
    }
    const fileName = tpaId 
      ? `claims-${tpaId}-${safeType}-TEMPLATE.xlsx`
      : `claims-${safeType}-TEMPLATE.xlsx`;
    
    const key = `uploads/company/claim/templates/${fileName}`;
    
    // Check if template already exists
    const existingFile = await this.claimRepository.getFileUploadByKey(key);
    if (existingFile) {
      return {
        documentId: existingFile.id,
        fileName,
      };
    }

    let headerRow: string[] = [];
    
    if (tpaId) {
      // Check for active mappings for the TPA
      const activeMappings = await this.claimRepository.findActiveTpaMappings(tpaId);
      
      if (activeMappings && activeMappings.length > 0) {
        // Use target columns from active mappings
        headerRow = activeMappings.map((mapping) => mapping.targetColumn);
      } else {
        // Fall back to default template fields if no mappings found
        const fields = await this.claimRepository.findActiveClaimsTemplateFields(
          normalizedClaimType
        );
        
        if (!fields.length) {
          throw new BadRequestException(errorMessages.noActiveClaimsTemplateFieldsOrTpaMappingsFound);
        }
        
        headerRow = fields.map((field) => field.fieldName);
      }
    } else {
      // Original logic for non-TPA templates
      const fields = await this.claimRepository.findActiveClaimsTemplateFields(
        normalizedClaimType
      );

      if (!fields.length) {
        throw new BadRequestException(errorMessages.noActiveClaimsTemplateFieldsFound);
      }

      headerRow = fields.map((field) => field.fieldName);
    }

    const workbook = XLSX.utils.book_new();
    const templateSheet = XLSX.utils.aoa_to_sheet([headerRow]);
    XLSX.utils.book_append_sheet(workbook, templateSheet, "Template");
    
    // Add helper sheet only for non-TPA templates (since TPA mappings don't have fieldType)
    if (!tpaId) {
      const fields = await this.claimRepository.findActiveClaimsTemplateFields(
        normalizedClaimType
      );
      const helperRows = [headerRow, fields.map((field) => field.fieldType)];
      const helperSheet = XLSX.utils.aoa_to_sheet(helperRows);
      XLSX.utils.book_append_sheet(workbook, helperSheet, "Template Helper");
    }
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    if (this.repoMode === "AWS") {
      try {
        const putRes = await this.s3
          .putObject({ Bucket: this.bucket, Key: key, Body: buffer })
          .promise();
        if (!putRes?.ETag) {
          throw new Error("Missing ETag");
        }
      } catch (error) {
        throw new InternalServerErrorException(
          errorMessages.failedToUploadClaimsTemplateToS3
        );
      }
    } else {
      const sanitizedPath = sanitizePath(key, this.docRepoPath);
      const targetPath = path.join(this.docRepoPath, sanitizedPath);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, buffer);
    }

    let fileUploadEntry = await this.claimRepository.getFileUploadByKey(key);
    if (!fileUploadEntry) {
      fileUploadEntry = await this.claimRepository.createFileUploadRecord({
        fileKey: key,
        companyType: "claim",
        companyId: DEFAULT_TOTAL_KPI_COUNT,
        uploadType: this.repoMode === "AWS" ? "AWS" : "LFS",
        documentTypeLid: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 0,
        updatedBy: 0,
        deletedAt: null,
      });
    }

    return {
      documentId: fileUploadEntry.id,
      fileName,
    };
  }

  async uploadClaim(
    fileId: number,
    policyId: number | undefined,
    tpaId: number | undefined,
    claimsUploadDate: Date,
    totalClaims: number,
  ): Promise<{ fileId: number; processedCount: number }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ClaimService",
        method: "uploadClaim",
        payload: { fileId },
        messageData: "method invoked",
      }),
    });
    try {
      if (!policyId && !tpaId) {
        throw new BadRequestException(
          "Either policyId or tpaId is required to upload claims.",
        );
      }
      if (policyId && tpaId) {
        throw new BadRequestException(
          "Provide either policyId or tpaId, not both.",
        );
      }
      let normalizedUploadDate = claimsUploadDate ?? new Date();
      if (claimsUploadDate) {
        const hasZeroTime =
          normalizedUploadDate.getUTCHours() === 0 &&
          normalizedUploadDate.getUTCMinutes() === 0 &&
          normalizedUploadDate.getUTCSeconds() === 0 &&
          normalizedUploadDate.getUTCMilliseconds() === 0;
        if (hasZeroTime) {
          const now = new Date();
          normalizedUploadDate = new Date(
            Date.UTC(
              normalizedUploadDate.getUTCFullYear(),
              normalizedUploadDate.getUTCMonth(),
              normalizedUploadDate.getUTCDate(),
              now.getUTCHours(),
              now.getUTCMinutes(),
              now.getUTCSeconds(),
              now.getUTCMilliseconds(),
            ),
          );
        }
      }
      const file = await this.claimRepository.findFileById(fileId);
      if (!file) {
        throw new NotFoundException(errorMessages.claimFileNotFound);
      }
      const entityType = tpaId
        ? DOCUMENT_ENTITY_TYPE.CLAIM_UPLOAD_TPA_ENTITY
        : DOCUMENT_ENTITY_TYPE.CLAIM_UPLOAD_POLICY_ENTITY;
      const entityId = tpaId ?? policyId ?? DEFAULT_TOTAL_KPI_COUNT;
      const resolvedTpaId = await this.resolveTpaIdForUpload(
        policyId,
        tpaId,
        entityId,
        entityType,
        normalizedUploadDate,
        totalClaims,
        fileId,
      );
      // const hasMappingTemplate =
      //   await this.claimRepository.hasActiveClaimMappingTemplate(resolvedTpaId);
      // if (!hasMappingTemplate) {
      // await this.claimRepository.createDocumentProcessingRecord({
      //   entityType,
      //   entityId,
      //   documentId: fileId,
      //   createdAt: normalizedUploadDate,
      //   updatedAt: normalizedUploadDate,
      //   documentType: DOCUMENT_TYPE.CLAIMS_DOCUMENT,
      //   processStatus: DOCUMENT_PROCESS_STATUS.FAILED,
      //   expectedEmployeesCount: totalClaims,
      // });
      // throw new BadRequestException(
      //   errorMessages.claimMappingTemplateMissing()
      // );
      // }
      await this.claimRepository.createDocumentProcessingRecord({
        entityType,
        entityId,
        documentId: fileId,
        createdAt: normalizedUploadDate,
        updatedAt: normalizedUploadDate,
        documentType: DOCUMENT_TYPE.CLAIMS_DOCUMENT,
        processStatus: DOCUMENT_PROCESS_STATUS.CREATED,
        // Adding the total claims count to expected_employees_count field as it is not used for anything else
        expectedEmployeesCount: totalClaims,
      });
      return { fileId, processedCount: DEFAULT_TOTAL_KPI_COUNT };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ClaimService",
          method: "uploadClaim",
          payload: { fileId },
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(errorMessages.claimUploadFailed);
    }
  }

  async getEmployeeClaim(employeeId: number): Promise<ClaimDto[]> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ClaimService",
        method: "getEmployeeClaim",
        payload: { employeeId },
        messageData: "method invoked",
      }),
    });
    try {
      const entities = await this.claimRepository.findClaimsByEmployeeId(
        employeeId,
      );
      return entities.map((c) => new ClaimDto(c));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ClaimService",
          method: "getEmployeeClaim",
          payload: { employeeId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        errorMessages.employeeClaimFetchFailed,
      );
    }
  }

  private async resolveTpaIdForUpload(
    policyId: number | undefined,
    tpaId: number | undefined,
    entityId: number,
    entityType: string,
    uploadDate: Date,
    totalClaims: number,
    fileId: number,
  ): Promise<number> {
    if (tpaId) {
      return tpaId;
    }
    if (!policyId) {
      throw new BadRequestException(
        "Either policyId or tpaId is required to upload claims.",
      );
    }
    const policy = await this.claimRepository.findPolicyWithTpaMappings(
      policyId,
    );
    if (!policy) {
      throw new BadRequestException(errorMessages.claimInvalidPolicyId);
    }
    if (!policy.tpaMappings || policy.tpaMappings.length === 0) {
      await this.claimRepository.createDocumentProcessingRecord({
        entityType,
        entityId,
        documentId: fileId,
        createdAt: uploadDate,
        updatedAt: uploadDate,
        documentType: DOCUMENT_TYPE.CLAIMS_DOCUMENT,
        processStatus: DOCUMENT_PROCESS_STATUS.FAILED,
        expectedEmployeesCount: totalClaims,
      });
      throw new BadRequestException(
        errorMessages.claimMappingTemplateMissing(),
      );
    }
    return policy.tpaMappings[0].tpaId;
  }

  async getPolicyClaim(
    policyId: number,
    page: number,
    limit: number,
    search?: string,
    sort?: string,
  ): Promise<{ data: ClaimListItemDto[]; count: number }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ClaimService",
        method: "getPolicyClaim",
        payload: { policyId, sort },
        messageData: "method invoked",
      }),
    });
    try {
      const [entities, count] = await this.claimRepository.findClaimsByPolicyId(
        policyId,
        page,
        limit,
        search,
        sort,
      );
      return { data: entities.map((c) => new ClaimListItemDto(c)), count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ClaimService",
          method: "getPolicyClaim",
          payload: { policyId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        errorMessages.policyClaimFetchFailed,
      );
    }
  }

  async getClaims(
    page: number,
    limit: number,
    search: string | undefined,
    loggedInUserId: number,
    ownerId?: number,
    viewBy?: "manager" | "team",
    organisationId?: number,
    sbuId?: number,
    verticalId?: number,
    branchId?: number,
    companyName?: string,
    companyPriority?: number[],
    policyType?: string,
    claimStatus?: string[],
    tatFrom?: number,
    tatTo?: number,
    tatRange?: EndorsementTatFilterLabel[],
    openTatOnly?: boolean,
    field?: string,
    from?: Date,
    to?: Date,
    period?: string,
    month?: string,
    financialYear?: number,
    insurerId?: number,
    sort?: string,
  ): Promise<{ data: ClaimListItemDto[]; count: number }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ClaimService",
        method: "getClaims",
        payload: { page, limit, search, ownerId, viewBy },
        messageData: "method invoked",
      }),
    });
    try {
      const isLeadership = await this.scopeService.hasLeadershipRole(
        Number(loggedInUserId),
      );
      const userId = ownerId ?? loggedInUserId;
      let userIds: number[] = [];
      if (isLeadership && !ownerId) {
        userIds = [];
      } else if (viewBy === OWNER_TYPES.TEAM) {
        const users = await this.scopeService.getNewEmployeeHierarchyByUserId(
          userId,
        );
        userIds = users.map((u) => u.userId);
        if (!userIds.includes(userId)) {
          userIds.push(userId);
        }
      } else {
        userIds = [userId];
      }
      const filterRegex = /\b[^:,]+:(\[[^\]]*\]|[^,]+)/g;
      const filterMatches = search ? search.match(filterRegex) : null;
      let freeSearch = search
        ? search.replace(filterRegex, "").replace(/,/g, "").trim()
        : undefined;
      const searchParams = filterMatches
        ? mapSearchParams(filterMatches.join(","))
        : [];

      const tatParamIndex = searchParams.findIndex(
        (p) => p.searchBy === "tatRange",
      );
      const tatRangeArray: EndorsementTatFilterLabel[] = Array.isArray(tatRange)
        ? [...tatRange]
        : [];
      if (tatParamIndex !== -1) {
        const tatVal = searchParams.splice(tatParamIndex, 1)[0].searchValue;
        const arr = Array.isArray(tatVal) ? tatVal : [tatVal];
        arr.forEach((v) => {
          const normalized = normalizeEndorsementTatFilter(String(v));
          if (normalized) {
            tatRangeArray.push(normalized);
          }
        });
      }

      let orgParam = searchParams.find(
        (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.organisationId,
      );
      if (organisationId) {
        if (orgParam) {
          orgParam.searchValue = [organisationId];
        } else {
          searchParams.push({
            searchBy: ATTRIBUTE_FIELD_MAP.organisationId,
            searchValue: [organisationId],
          });
        }
        orgParam = searchParams.find(
          (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.organisationId,
        );
      }
      if (orgParam) {
        const orgIds = Array.isArray(orgParam.searchValue)
          ? orgParam.searchValue.map((v) => Number(v))
          : [Number(orgParam.searchValue)];
        const expandedIds = new Set<number>();
        for (const id of orgIds) {
          const organisationIdNew =
            await this.claimRepository.getEntityTableMapIds(
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
              { id },
            );
          const lookupCriteria =
            organisationIdNew.length === 0
              ? { parentOrganisationId: id }
              : { id };
          const organisationIds =
            await this.claimRepository.getEntityTableMapIds(
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
              lookupCriteria,
            );
          organisationIds.forEach((oid) => expandedIds.add(oid));
        }
        if (expandedIds.size === 0) {
          return { data: [], count: 0 };
        }
        orgParam.searchValue = Array.from(expandedIds);
      }
      if (sbuId) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.sbuId,
          searchValue: [sbuId],
        });
      }
      if (verticalId) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.verticalId,
          searchValue: [verticalId],
        });
      }
      if (branchId) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.branchId,
          searchValue: [branchId],
        });
      }
      if (companyName) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.companyName,
          searchValue: [companyName],
        });
      }
      if (companyPriority && companyPriority.length > 0) {
        // Validate all IDs are numbers
        const priorityIds = companyPriority
          .map((v) => Number(v))
          .filter((v) => !isNaN(v));
        if (priorityIds.length === 0) {
          return { data: [], count: 0 };
        }
        const lookupValues = await this.claimRepository.getLookupValues(
          priorityIds,
        );
        if (lookupValues.length === 0) {
          return { data: [], count: 0 };
        }
        searchParams.push({
          // Directly search by lookUpValue (so repository uses companyPriority.lookUpValue)
          searchBy: "companyPriority.lookUpValue",
          searchValue: lookupValues.map((l) => l.lookUpValue),
        });
      }
      if (policyType) {
        searchParams.push({
          searchBy: ATTRIBUTE_FIELD_MAP.policyType,
          searchValue: [policyType],
        });
      }
      if (claimStatus && claimStatus.length > 0) {
        searchParams.push({
          searchBy: "claim.claimStatus",
          searchValue: claimStatus,
        });
      }
      let priorityParam = searchParams.find(
        (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.policyPriority,
      );
      if (priorityParam) {
        const ids = Array.isArray(priorityParam.searchValue)
          ? priorityParam.searchValue.map((v) => Number(v))
          : [Number(priorityParam.searchValue)];
        const lookupValues = await this.claimRepository.getLookupValues(ids);
        if (lookupValues.length === 0) {
          return { data: [], count: 0 };
        }
        priorityParam.searchBy = "companyPriority.lookUpValue";
        priorityParam.searchValue = lookupValues.map((l) => l.lookUpValue);
      }
      const tatRanges: { from?: number; to?: number }[] = [];
      if (tatFrom !== undefined || tatTo !== undefined) {
        tatRanges.push({ from: tatFrom, to: tatTo });
      }
      const uniqueTatRanges = Array.from(new Set(tatRangeArray));
      uniqueTatRanges.forEach((label) => {
        const bucket = CLAIM_TAT_BUCKETS[label];
        if (!bucket) {
          return;
        }
        tatRanges.push({ from: bucket.min, to: bucket.max });
      });
      let fromDate = from;
      let toDate = to;
      if (
        (!fromDate || !toDate) &&
        (period || month || financialYear !== undefined)
      ) {
        const range = getDateRange(month ?? period, financialYear);
        fromDate = range.start;
        toDate = range.end;
      }
      const dateField = fromDate && toDate ? "claim.claimDate" : undefined;

      const [entities, count] = await this.claimRepository.findAllClaims(
        page,
        limit,
        userIds,
        searchParams,
        freeSearch,
        tatRanges,
        dateField,
        fromDate,
        toDate,
        Boolean(openTatOnly),
        insurerId,
        sort,
      );
      return { data: entities.map((c) => new ClaimListItemDto(c)), count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ClaimService",
          method: "getClaims",
          payload: { page, limit, search, ownerId, viewBy },
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof QueryFailedError) {
        throw new BadRequestException(error.message || "");
      }
      if (error instanceof Error && error.message) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException(
        errorMessages.policyClaimFetchFailed,
      );
    }
  }

  async getPolicyTypes(
    loggedInUserId: number,
    ownerId?: number,
    viewBy?: "manager" | "team",
    companyId?: number,
    insurerId?: number,
  ): Promise<{ policyTypes: string[]; policies: PolicySummaryDto[] }> {
    if (companyId) {
      const policies = await this.claimRepository.findPoliciesByCompanyId(
        companyId,
        insurerId,
      );
      const policyTypes = Array.from(
        new Set(policies.map((p) => p.policyType).filter(Boolean)),
      );
      return { policyTypes, policies };
    }

    const userId = ownerId ?? loggedInUserId;
    let userIds: number[] = [];
    if (viewBy === OWNER_TYPES.TEAM) {
      const users = await this.scopeService.getNewEmployeeHierarchyByUserId(
        userId,
      );
      userIds =
        users && users.length > 0 ? users.map((u) => u.userId) : [userId];
    } else {
      userIds = [userId];
    }

    const uniqueUserIds = Array.from(new Set(userIds));
    if (!uniqueUserIds.length) {
      return { policyTypes: [], policies: [] };
    }

    const policyTypes = await this.claimRepository.findUniquePolicyTypes(
      uniqueUserIds,
    );
    return { policyTypes, policies: [] };
  }

  async getPolicyClaimBatches(
    policyId: number | undefined,
    page: number,
    limit: number,
    tpaId?: number,
    sort?: string,
  ): Promise<{
    data: ClaimBatchItemDto[];
    count: number;
    totalClaimRecords: number;
    totalSuccessRecords: number;
    totalFailedRecords: number;
    totalSettledClaimRecords: number;
    settledClaimAmount: number;
    claimAmountPendingForSettlement: number;
  }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ClaimService",
        method: "getPolicyClaimBatches",
        payload: { policyId, page, limit, tpaId },
        messageData: "method invoked",
      }),
    });
    try {
      const effectivePolicyId = tpaId ? undefined : policyId;
      if (!effectivePolicyId && !tpaId) {
        throw new BadRequestException(errorMessages.claimBatchFilterMissing);
      }
      const { records, count, summary } =
        await this.claimRepository.findTpaUploadBatches(
          effectivePolicyId ?? 0,
          page,
          limit,
          tpaId,
          sort,
        );
      return {
        data: records.map(
          (record) =>
            new ClaimBatchItemDto({
              claimBatchId: record.id,
              claimCreatedDate: record.createdAt,
              totalClaimRecords: record.totalClaims,
              processedClaims: record.processedClaims,
              status: record.processStatus,
              sourceFileId: record.sourceFileId,
              fileName: record.fileKey ? path.basename(record.fileKey) : null,
              processingCompletedAt:
                record.processStatus === DOCUMENT_PROCESS_STATUS.CREATED
                  ? null
                  : record.processingCompletedAt,
              totalSuccess: record.totalSuccess,
              totalFail: record.totalFail,
              totalPendingClaims: record.totalPendingClaims,
              totalSettledClaims: record.totalSettledClaims,
              errorFileId: record.errorFileId,
            }),
        ),
        count,
        ...summary,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ClaimService",
          method: "getPolicyClaimBatches",
          payload: { policyId, page, limit, tpaId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        errorMessages.claimBatchFetchFailed,
      );
    }
  }

  async getDashboardBusinessOverview(
    userId: number,
    timeFilter?: string,
    financialYear?: number,
    owner?: string,
    organisationId?: any,
    sbuId?: number,
    verticalId?: number,
    departmentId?: number,
    branchId?: number,
    isLeadership = false,
    from?: Date,
    to?: Date
  ): Promise<{
    businessOverview: {
      totalCompanyCount: number;
      totalPolicyCount: number;
      totalCompaniesPremium: number;
      totalCompaniesBrokerage: number;
    };
    claimsOverview: {
      totalClaimsCount: number;
      totalClaimAmount: number;
      policiesWithClaimsCount: number;
      companiesWithClaimsCount: number;
    };
  }> {
    const emptyBusinessOverview = {
      totalCompanyCount: 0,
      totalPolicyCount: 0,
      totalCompaniesPremium: 0,
      totalCompaniesBrokerage: 0,
    };

    const emptyClaimsOverview = {
      totalClaimsCount: 0,
      totalClaimAmount: 0,
      policiesWithClaimsCount: 0,
      companiesWithClaimsCount: 0,
    };

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ClaimService",
        method: "getDashboardBusinessOverview",
        payload: {
          userId,
          timeFilter: timeFilter ?? null,
          financialYear: financialYear ?? null,
          owner: owner ?? null,
        },
        messageData: "method invoked",
      }),
    });

    try {
      let resolvedUserIds: any = [];
      if (isLeadership === false) {
        resolvedUserIds = await this.resolveDashboardUserIds(
          userId,
          owner,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
        );

        if (!resolvedUserIds.length) {
          return {
            businessOverview: { ...emptyBusinessOverview },
            claimsOverview: { ...emptyClaimsOverview },
          };
        }
      } else {
        if (isLeadership === true) {
          const orgId = organisationId;
          if (orgId === 0) {
            const organisationIdNew =
              await this.claimRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
                { id: orgId },
              );

            const lookupCriteria =
              organisationIdNew.length === 0
                ? { parentOrganisationId: orgId }
                : { id: orgId };

            const organisationIds =
              await this.claimRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
                lookupCriteria,
              );
            organisationId = organisationIds;
          } else {
            organisationId = [organisationId];
          }
        }
      }

      const range = from && to ? { start: from, end: to } : getDateRange(timeFilter, financialYear);
      const [businessOverview, claimsOverview] = await Promise.all([
        this.claimRepository.getBusinessOverviewForUsers(
          resolvedUserIds,
          range,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          isLeadership,
        ),
        this.claimRepository.getClaimsOverviewForUsers(
          resolvedUserIds,
          range,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          isLeadership,
        ),
      ]);

      return {
        businessOverview,
        claimsOverview,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ClaimService",
          method: "getDashboardBusinessOverview",
          payload: {
            userId,
            timeFilter: timeFilter ?? null,
            financialYear: financialYear ?? null,
            owner: owner ?? null,
          },
          messageData: error,
        }),
      });

      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch business overview data.",
      );
    }
  }

  private async resolveDashboardUserIds(
    userId: number,
    owner?: string,
    organisationId?: number,
    sbuId?: number,
    verticalId?: number,
    departmentId?: number,
    branchId?: number,
  ): Promise<number[]> {
    if (!owner || owner === OWNER_TYPES.MANAGER) {
      const userDetails = await this.claimRepository.findUserDetails(
        userId,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
      );
      return userDetails ? [userId] : [];
    }

    const hierarchy = await this.scopeService.getNewEmployeeHierarchyByUserId(
      userId,
    );
    if (!hierarchy?.length) {
      return [];
    }

    const filtered = hierarchy.filter(
      (member) =>
        (!organisationId || member.organisationId === organisationId) &&
        (!sbuId || member.sbuId === sbuId) &&
        idMatches(verticalId, member.verticalId) &&
        (!departmentId || member.departmentId === departmentId) &&
        idMatches(branchId, member.branchId),
    );

    return Array.from(new Set(filtered.map((member) => member.userId)));
  }
}
