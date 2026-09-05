import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import * as XLSX from "xlsx";
import {
  DocumentProcessingFile,
  FileUpload,
  MstrHospital,
  MstrHospitalAddress,
  MstrPolicyHospitalMap,
  Policy,
  PolicyClaim,
  PolicyClaimSettlement,
  PolicyEnrollmentDependent,
  PolicyEnrollmentEmployee,
  PolicyEnrollmentEmployeePolicyMap,
  PolicyEnrollmentUploadSummary,
  PolicyClaimStatus,
  PolicyClaimAudit,
  State,
} from "../../../../service-lib/src/lib/entities";
import { MappingTemplateVersion } from "../../../../service-lib/src/lib/entities/mapping-template-version.entity";
import { MappingTemplateColumn } from "../../../../service-lib/src/lib/entities/mapping-template-column.entity";
import { MstrEntityFieldsUtilityRef } from "../../../../service-lib/src/lib/entities/mstr-entity-fields-utility-ref.entity";
import {
  downloadFromS3,
  generateExcel,
  uploadToS3,
} from "../../../../service-lib/src/lib/utils/file-management.utils";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { IS_DEMO_ENVIRONMENT } from "../../../../service-lib/src/lib/environment";
import {
  DEFAULT_TOTAL_KPI_COUNT,
  DOCUMENT_ENTITY_TYPE,
  DOCUMENT_PROCESS_STATUS,
  DOCUMENT_TYPE,
  // OPPORTUNITY_POLICY_STATUS_ACTIVE,
  // POLICY_STATUS_MIG_ACTIVE,
  ENABLE_DYNAMIC_CLAIMS_MAPPING,
  UTILITY_UPLOAD_ENTITY_CLAIMS,
  UPLOAD_CLAIM_ENTITY_NAME,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { formatSize } from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";

type ClaimStatusLookup = {
  statusByKey: Map<string, PolicyClaimStatus>;
  allowedStatuses: string[];
};

type PolicyContextResult = {
  policy: Policy | null;
  error?: Error;
};

type MappingTemplateContextResult = {
  mapping: Map<string, string> | null;
  error?: Error;
};

type DynamicMappingContextResult = {
  mappingContext: MappingTemplateContextResult;
  useDynamic: boolean;
};

type ParsedClaimRow = {
  rawRow: Record<string, any>;
  policyNumber: string | null;
  policyType: string | null;
  policyStartDate: Date | null;
  policyEndDate: Date | null;
  companyName: string | null;
  employeeName: string | null;
  employeeIdValue: string | null;
  employeeTpaId: string | null;
  patientName: string | null;
  patientRelation: string;
  normalizedRelation: string;
  patientTpaId: string | null;
  claimNumber: string;
  claimType: string | null;
  totalSumInsured: number | null;
  claimAmount: number | null;
  settlementAmount: number | null;
  totalAvailableBalance: number | null;
  claimRequestedDate: Date | null;
  claimSettledDate: Date | null;
  claimStatus: string;
  claimStatusEntity: PolicyClaimStatus;
  hospitalName: string;
  hospitalAddress: string;
  hospitalCity: string;
  hospitalState: string;
};

type ResolvedClaimRow = ParsedClaimRow & {
  policy: Policy;
  policyTpaId: number | null;
  employeeMapping: PolicyEnrollmentEmployeePolicyMap;
  dependentId: number | null;
};

@Injectable()
export class ClaimUploadScheduler {
  private static readonly SELF_RELATION_TYPES = new Set(["self", "employee"]);

  private readonly batchSize = 1000;
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(DocumentProcessingFile)
    private readonly docProcessingRepo: Repository<DocumentProcessingFile>,
    @InjectRepository(FileUpload)
    private readonly fileRepo: Repository<FileUpload>,
    @InjectRepository(Policy)
    private readonly policyRepo: Repository<Policy>,
    @InjectRepository(PolicyEnrollmentEmployeePolicyMap)
    private readonly employeePolicyMapRepo: Repository<PolicyEnrollmentEmployeePolicyMap>,
    @InjectRepository(PolicyEnrollmentEmployee)
    private readonly employeeEnrollmentRepo: Repository<PolicyEnrollmentEmployee>,
    @InjectRepository(PolicyEnrollmentDependent)
    private readonly dependentRepo: Repository<PolicyEnrollmentDependent>,
    @InjectRepository(PolicyClaim)
    private readonly claimRepo: Repository<PolicyClaim>,
    @InjectRepository(PolicyClaimSettlement)
    private readonly settlementRepo: Repository<PolicyClaimSettlement>,
    @InjectRepository(PolicyClaimStatus)
    private readonly claimStatusRepo: Repository<PolicyClaimStatus>,
    @InjectRepository(PolicyClaimAudit)
    private readonly claimAuditRepo: Repository<PolicyClaimAudit>,
    @InjectRepository(PolicyEnrollmentUploadSummary)
    private readonly summaryRepo: Repository<PolicyEnrollmentUploadSummary>,
    @InjectRepository(MappingTemplateVersion)
    private readonly mappingTemplateRepo: Repository<MappingTemplateVersion>,
    @InjectRepository(MappingTemplateColumn)
    private readonly mappingTemplateColumnRepo: Repository<MappingTemplateColumn>,
    @InjectRepository(MstrEntityFieldsUtilityRef)
    private readonly entityFieldRepo: Repository<MstrEntityFieldsUtilityRef>,
    @InjectRepository(MstrHospital)
    private readonly hospitalRepo: Repository<MstrHospital>,
    @InjectRepository(MstrHospitalAddress)
    private readonly hospitalAddressRepo: Repository<MstrHospitalAddress>,
    @InjectRepository(MstrPolicyHospitalMap)
    private readonly policyHospitalMapRepo: Repository<MstrPolicyHospitalMap>,
    @InjectRepository(State)
    private readonly stateRepo: Repository<State>,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.SCHEDULER_SERVICE
    );
  }

  @Cron("*/2 * * * *")
  async processClaimUploads(): Promise<void> {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    const pending = await this.getPendingClaimUpload();
    if (!pending) {
      return;
    }
    if (ENABLE_DYNAMIC_CLAIMS_MAPPING) {
      await this.processClaimUploadWithDynamicMapping(pending);
      return;
    }
    await this.processClaimUploadLegacy(pending);
  }

  private async getPendingClaimUpload(): Promise<DocumentProcessingFile | null> {
    const unprocessedFile = await this.docProcessingRepo.findOne({
      where: {
        documentType: DOCUMENT_TYPE.CLAIMS_DOCUMENT,
        processStatus: DOCUMENT_PROCESS_STATUS.CREATED,
      },
      order: { createdAt: "ASC" },
    });
    if (!unprocessedFile) {
      return null;
    }

    const updateResult = await this.docProcessingRepo.query(
      `UPDATE document_processing_file
       SET process_status = $1
       WHERE id = $2 AND process_status = $3`,
      [
        DOCUMENT_PROCESS_STATUS.PROCESSING,
        unprocessedFile.id,
        DOCUMENT_PROCESS_STATUS.CREATED,
      ]
    );
    if (updateResult[1] !== 1) {
      return null;
    }
    return unprocessedFile;
  }

  private async processClaimUploadWithDynamicMapping(
    upload: DocumentProcessingFile
  ): Promise<void> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "in-progress",
        location: "ClaimUploadScheduler",
        method: "processClaimUploadWithDynamicMapping",
        payload: { uploadId: upload.id, documentId: upload.documentId },
        messageData: "processing started",
      }),
    });

    const errors: Record<string, any>[] = [];
    let successCount = 0;
    let policyIdForSummary: number | null =
      upload.entityType === DOCUMENT_ENTITY_TYPE.CLAIM_UPLOAD_POLICY_ENTITY
        ? upload.entityId
        : null;
    try {
      const file = await this.fileRepo.findOne({
        where: { id: upload.documentId },
      });
      if (!file) {
        throw new NotFoundException(errorMessages.claimFileNotFound);
      }

      const buffer = await downloadFromS3(file.fileKey);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const worksheet =
        workbook.Sheets[workbook.SheetNames[DEFAULT_TOTAL_KPI_COUNT]];
      if (!worksheet) {
        throw new BadRequestException(errorMessages.claimUploadFailed);
      }
      const claimStatusLookup = await this.loadClaimStatusLookup();
      const policyContext = await this.getPolicyContextForUpload(upload);
      const dynamicContext = await this.getDynamicClaimsMappingContext(
        upload,
        policyContext,
        worksheet
      );
      if (!dynamicContext.useDynamic) {
        this.logger.warn({
          level: "warn",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "warning",
            location: "ClaimUploadScheduler",
            method: "processClaimUploadWithDynamicMapping",
            payload: { uploadId: upload.id },
            messageData:
              "No active claims mapping template found; falling back to legacy processing.",
          }),
        });
        await this.processClaimUploadLegacy(upload);
        return;
      }
      const mappingTemplateContext = dynamicContext.mappingContext;

      await this.processWorksheetInBatches(
        worksheet,
        async (batch) => {
          const mappedBatch = mappingTemplateContext.mapping
            ? batch.map((row) =>
                this.applyMappingTemplate(row, mappingTemplateContext.mapping)
              )
            : batch;
          const {
            errors: batchErrors,
            successCount: batchSuccessCount,
            policyId: batchPolicyId,
          } = await this.processBatch(upload, mappedBatch, {
            claimStatusLookup,
            policyContext,
            mappingTemplateContext,
          });
          errors.push(...batchErrors);
          successCount += batchSuccessCount;
          if (policyIdForSummary === null && batchPolicyId) {
            policyIdForSummary = batchPolicyId;
          }
        },
        this.batchSize
      );

      const errorFileUploadId = await this.createErrorFileIfNeeded(
        errors,
        file,
        upload
      );
      await this.saveSummary({
        upload,
        policyId: policyIdForSummary,
        sourceFileId: file.id,
        errorFileUploadId,
        successCount,
        errorCount: errors.length,
      });
      const status =
        errors.length && successCount === 0
          ? DOCUMENT_PROCESS_STATUS.FAILED
          : DOCUMENT_PROCESS_STATUS.COMPLETED;
      await this.updateProcessingStatus(upload.id, status);
    } catch (error) {
      const errorFileUploadId = await this.createErrorFileIfNeeded(
        errors,
        await this.fileRepo.findOne({ where: { id: upload.documentId } }),
        upload
      );
      await this.saveSummary({
        upload,
        policyId: policyIdForSummary,
        sourceFileId: upload.documentId,
        errorFileUploadId,
        successCount,
        errorCount: errors.length,
      });
      await this.updateProcessingStatus(
        upload.id,
        DOCUMENT_PROCESS_STATUS.FAILED
      );
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ClaimUploadScheduler",
          method: "processClaimUploadWithDynamicMapping",
          payload: { uploadId: upload.id },
          messageData: this.formatErrorForLog(error),
        }),
      });
    }
  }

  private async processClaimUploadLegacy(
    upload: DocumentProcessingFile
  ): Promise<void> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "in-progress",
        location: "ClaimUploadScheduler",
        method: "processClaimUploadLegacy",
        payload: { uploadId: upload.id, documentId: upload.documentId },
        messageData: "processing started",
      }),
    });

    const errors: Record<string, any>[] = [];
    let successCount = 0;
    let policyIdForSummary: number | null =
      upload.entityType === DOCUMENT_ENTITY_TYPE.CLAIM_UPLOAD_POLICY_ENTITY
        ? upload.entityId
        : null;
    try {
      const file = await this.fileRepo.findOne({
        where: { id: upload.documentId },
      });
      if (!file) {
        throw new NotFoundException(errorMessages.claimFileNotFound);
      }

      const buffer = await downloadFromS3(file.fileKey);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const worksheet =
        workbook.Sheets[workbook.SheetNames[DEFAULT_TOTAL_KPI_COUNT]];
      if (!worksheet) {
        throw new BadRequestException(errorMessages.claimUploadFailed);
      }
      const claimStatusLookup = await this.loadClaimStatusLookup();
      const policyContext = await this.getPolicyContextForUpload(upload);
      const mappingTemplateContext = await this.getMappingTemplateForUpload(
        upload,
        policyContext,
        { requireTemplate: false }
      );

      await this.processWorksheetInBatches(
        worksheet,
        async (batch) => {
          const mappedBatch = mappingTemplateContext.mapping
            ? batch.map((row) =>
                this.applyMappingTemplate(row, mappingTemplateContext.mapping)
              )
            : batch;
          const {
            errors: batchErrors,
            successCount: batchSuccessCount,
            policyId: batchPolicyId,
          } = await this.processBatch(upload, mappedBatch, {
            claimStatusLookup,
            policyContext,
            mappingTemplateContext,
          });
          errors.push(...batchErrors);
          successCount += batchSuccessCount;
          if (policyIdForSummary === null && batchPolicyId) {
            policyIdForSummary = batchPolicyId;
          }
        },
        this.batchSize
      );

      const errorFileUploadId = await this.createErrorFileIfNeeded(
        errors,
        file,
        upload
      );
      await this.saveSummary({
        upload,
        policyId: policyIdForSummary,
        sourceFileId: file.id,
        errorFileUploadId,
        successCount,
        errorCount: errors.length,
      });
      const status =
        errors.length && successCount === 0
          ? DOCUMENT_PROCESS_STATUS.FAILED
          : DOCUMENT_PROCESS_STATUS.COMPLETED;
      await this.updateProcessingStatus(upload.id, status);
    } catch (error) {
      const errorFileUploadId = await this.createErrorFileIfNeeded(
        errors,
        await this.fileRepo.findOne({ where: { id: upload.documentId } }),
        upload
      );
      await this.saveSummary({
        upload,
        policyId: policyIdForSummary,
        sourceFileId: upload.documentId,
        errorFileUploadId,
        successCount,
        errorCount: errors.length,
      });
      await this.updateProcessingStatus(
        upload.id,
        DOCUMENT_PROCESS_STATUS.FAILED
      );
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ClaimUploadScheduler",
          method: "processClaimUploadLegacy",
          payload: { uploadId: upload.id },
          messageData: this.formatErrorForLog(error),
        }),
      });
    }
  }

  private async updateProcessingStatus(
    uploadId: number,
    status: (typeof DOCUMENT_PROCESS_STATUS)[keyof typeof DOCUMENT_PROCESS_STATUS]
  ): Promise<void> {
    await this.docProcessingRepo.update(
      { id: uploadId },
      { processStatus: status, updatedAt: new Date() }
    );
  }

  private async processBatch(
    upload: DocumentProcessingFile,
    rows: Record<string, any>[],
    context: {
      claimStatusLookup: ClaimStatusLookup;
      policyContext: PolicyContextResult;
      mappingTemplateContext: MappingTemplateContextResult;
    }
  ): Promise<{
    errors: Record<string, any>[];
    successCount: number;
    policyId: number | null;
  }> {
    const errors: Record<string, any>[] = [];
    let successCount = 0;
    let policyId: number | null = null;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "in-progress",
        location: "ClaimUploadScheduler",
        method: "processBatch",
        payload: { uploadId: upload.id, batchSize: rows.length },
        messageData: "batch processing started",
      }),
    });
    if (context.policyContext.error || context.mappingTemplateContext.error) {
      const errorMessage = this.getErrorMessage(
        context.policyContext.error || context.mappingTemplateContext.error
      );
      for (const row of rows) {
        errors.push({
          ...this.extractRawRow(row),
          Remarks: errorMessage,
        });
      }
      return { errors, successCount, policyId };
    }

    const parsedRows: ParsedClaimRow[] = [];
    for (const row of rows) {
      try {
        parsedRows.push(
          this.parseRow(upload, row, context.claimStatusLookup)
        );
      } catch (error) {
        errors.push({
          ...this.extractRawRow(row),
          Remarks: this.getErrorMessage(error),
        });
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "ClaimUploadScheduler",
            method: "parseRow",
            payload: { uploadId: upload.id },
            messageData: error,
          }),
        });
      }
    }

    if (!parsedRows.length) {
      return { errors, successCount, policyId };
    }

    const policyById = await this.loadPoliciesForBatch(
      upload,
      parsedRows,
      context.policyContext.policy
    );
    const resolvedRows: ResolvedClaimRow[] = [];

    for (const parsed of parsedRows) {
      try {
        if (
          context.policyContext.policy &&
          parsed.policyNumber &&
          String(context.policyContext.policy.id) !== String(parsed.policyNumber) &&
          context.policyContext.policy.insurerPolicyNumber !== parsed.policyNumber
        ) {
          throw new BadRequestException(errorMessages.claimPolicyNumberMismatch);
        }
        const policy =
          context.policyContext.policy ??
          policyById.get(parsed.policyNumber ?? "");
        if (!policy) {
          throw new BadRequestException(errorMessages.claimInvalidPolicyId);
        }
        // claims can be uploaded even for expired/inactive policies
        // if (!this.isActivePolicy(policy)) {
        //   throw new BadRequestException(errorMessages.claimInactivePolicy(policy.id));
        // }
        const policyTpaId = this.resolvePolicyTpaId(upload, policy);
        resolvedRows.push({
          ...parsed,
          policy,
          policyTpaId,
          employeeMapping: null as unknown as PolicyEnrollmentEmployeePolicyMap,
          dependentId: null,
        });
        if (!policyId) {
          policyId = policy.id;
        }
      } catch (error) {
        errors.push({
          ...parsed.rawRow,
          Remarks: this.getErrorMessage(error),
        });
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "ClaimUploadScheduler",
            method: "resolvePolicy",
            payload: { uploadId: upload.id },
            messageData: error,
          }),
        });
      }
    }

    if (!resolvedRows.length) {
      return { errors, successCount, policyId };
    }

    const policyIds = Array.from(
      new Set(resolvedRows.map((row) => row.policy.id))
    );
    // Path A identifiers: companyEmployeeId (new format)
    const companyEmployeeIds = Array.from(
      new Set(
        resolvedRows
          .map((row) => row.employeeIdValue)
          .filter((value): value is string => Boolean(value))
      )
    );
    // Path B identifiers: employeeTpaId (legacy format fallback)
    const employeeTpaIds = Array.from(
      new Set(
        resolvedRows
          .map((row) => row.employeeTpaId)
          .filter((value): value is string => Boolean(value))
      )
    );
    const dependentTpaIds = Array.from(
      new Set(
        resolvedRows
          .filter((row) => !this.isSelfRelation(row.normalizedRelation))
          .map((row) => row.patientTpaId)
          .filter(Boolean)
      )
    ) as string[];

    const normalizedDependentTpaIds = dependentTpaIds
      .map((value) => this.normalizeIdentifier(value))
      .filter((value): value is string => Boolean(value));

    // Run all lookups in parallel: Path A (companyEmployeeId), Path B (tpaId), dependent queries
    const [
      allEnrollmentsByCeid,
      employeeMaps,
      employeeMapAnyPolicy,
      dependentMaps,
      dependentMapAnyPolicy,
    ] = await Promise.all([
      // Path A Step 1: find enrollments by companyEmployeeId (existence + id resolution)
      companyEmployeeIds.length
        ? this.employeeEnrollmentRepo.find({
            where: { companyEmployeeId: In(companyEmployeeIds) },
            select: ["id", "companyEmployeeId"],
            withDeleted: true,
          })
        : Promise.resolve([]),
      // Path B: maps by tpaId + policyId
      employeeTpaIds.length && policyIds.length
        ? this.employeePolicyMapRepo.find({
            where: {
              policyId: In(policyIds),
              employeeTpaId: In(employeeTpaIds),
            },
            withDeleted: true,
          })
        : Promise.resolve([]),
      // Path B existence check (cross-policy)
      employeeTpaIds.length
        ? this.employeePolicyMapRepo.find({
            where: { employeeTpaId: In(employeeTpaIds) },
            withDeleted: true,
          })
        : Promise.resolve([]),
      normalizedDependentTpaIds.length && policyIds.length
        ? this.dependentRepo
            .createQueryBuilder("dependent")
            .withDeleted()
            .where("dependent.policyId IN (:...policyIds)", { policyIds })
            .andWhere("LOWER(dependent.dependentTpaId) IN (:...dependentTpaIds)", {
              dependentTpaIds: normalizedDependentTpaIds,
            })
            .getMany()
        : Promise.resolve([]),
      normalizedDependentTpaIds.length
        ? this.dependentRepo
            .createQueryBuilder("dependent")
            .withDeleted()
            .where("LOWER(dependent.dependentTpaId) IN (:...dependentTpaIds)", {
              dependentTpaIds: normalizedDependentTpaIds,
            })
            .getMany()
        : Promise.resolve([]),
    ]);

    // Path A Step 2: policy-scoped maps for the resolved enrollment IDs
    const enrollmentIdsByCeid = allEnrollmentsByCeid.map((e) => e.id);
    const policyMapsByCeid =
      enrollmentIdsByCeid.length && policyIds.length
        ? await this.employeePolicyMapRepo.find({
            where: {
              employeeId: In(enrollmentIdsByCeid),
              policyId: In(policyIds),
            },
            withDeleted: true,
          })
        : [];

    const dependentEmployeeIds = Array.from(
      new Set(dependentMaps.map((dependent) => dependent.employeeId))
    );
    const employeeMapsByEmployeeId =
      dependentEmployeeIds.length && policyIds.length
        ? await this.employeePolicyMapRepo.find({
            where: {
              policyId: In(policyIds),
              employeeId: In(dependentEmployeeIds),
            },
          })
        : [];

    // Fetch all dependents for matched employees — used as name/relation fallback
    // when patientTpaId is absent from the file.
    const matchedEmployeeIds = Array.from(
      new Set([
        ...policyMapsByCeid.map((m) => m.employeeId),
        ...employeeMaps.map((m) => m.employeeId),
      ])
    );
    const allDependentsByEmployee = matchedEmployeeIds.length
      ? await this.dependentRepo.find({
          where: { employeeId: In(matchedEmployeeIds) },
          select: ["id", "employeeId", "name", "relation", "dependentTpaId"],
          withDeleted: true,
        })
      : [];

    // Path A: build lookup map keyed by ${policyId}:${companyEmployeeId}
    const enrollmentByIdCeid = new Map<number, string>(); // enrollmentId → companyEmployeeId
    for (const enrollment of allEnrollmentsByCeid) {
      if (enrollment.companyEmployeeId) {
        enrollmentByIdCeid.set(enrollment.id, enrollment.companyEmployeeId);
      }
    }
    const employeeMapByCeidKey = new Map<string, PolicyEnrollmentEmployeePolicyMap>();
    for (const map of policyMapsByCeid) {
      const ceid = enrollmentByIdCeid.get(map.employeeId);
      if (ceid) {
        employeeMapByCeidKey.set(`${map.policyId}:${ceid}`, map);
      }
    }
    const companyEmployeeIdSet = new Set(
      allEnrollmentsByCeid
        .map((e) => e.companyEmployeeId)
        .filter((v): v is string => Boolean(v))
    );

    // Path B: build lookup map keyed by ${policyId}:${employeeTpaId}
    const employeeMapByTpaKey = new Map<string, PolicyEnrollmentEmployeePolicyMap>();
    for (const map of employeeMaps) {
      employeeMapByTpaKey.set(`${map.policyId}:${map.employeeTpaId}`, map);
    }
    const employeeMapByEmployeeIdKey = new Map<
      string,
      PolicyEnrollmentEmployeePolicyMap
    >();
    for (const map of employeeMapsByEmployeeId) {
      employeeMapByEmployeeIdKey.set(`${map.policyId}:${map.employeeId}`, map);
    }
    const employeeMapByTpaId = new Map<string, PolicyEnrollmentEmployeePolicyMap>();
    for (const map of employeeMapAnyPolicy) {
      if (map.employeeTpaId && !employeeMapByTpaId.has(map.employeeTpaId)) {
        employeeMapByTpaId.set(map.employeeTpaId, map);
      }
    }
    const employeeTpaIdSet = new Set(employeeMapByTpaId.keys());
    const employeeEnrollmentById = new Map<number, PolicyEnrollmentEmployee>();
    for (const enrollment of employeeEnrollments) {
      employeeEnrollmentById.set(enrollment.id, enrollment);
    }
    const dependentMapByKey = new Map<string, PolicyEnrollmentDependent>();
    const dependentMapByEmployeeAndTpa = new Map<
      string,
      PolicyEnrollmentDependent
    >();
    for (const dependent of dependentMaps) {
      const normalizedDependentTpaId = this.normalizeIdentifier(
        dependent.dependentTpaId ?? ""
      );
      if (!normalizedDependentTpaId) {
        continue;
      }
      dependentMapByKey.set(
        `${dependent.policyId}:${normalizedDependentTpaId}`,
        dependent
      );
      dependentMapByEmployeeAndTpa.set(
        `${dependent.employeeId}:${normalizedDependentTpaId}`,
        dependent
      );
    }
    const dependentTpaIdSet = new Set(
      dependentMapAnyPolicy
        .map((dependent) => this.normalizeIdentifier(dependent.dependentTpaId ?? ""))
        .filter((value): value is string => Boolean(value))
    );
    const dependentAnyPolicyByTpaId = new Map<string, PolicyEnrollmentDependent>();
    for (const dependent of dependentMapAnyPolicy) {
      const normalizedTpaId = this.normalizeIdentifier(dependent.dependentTpaId ?? "");
      if (normalizedTpaId) {
        dependentAnyPolicyByTpaId.set(normalizedTpaId, dependent);
      }
    }

    // Name/relation fallback maps — keyed by ${employeeId}:${normalizedName} and ${employeeId}:${normalizedRelation}
    const dependentByEmployeeAndName = new Map<string, PolicyEnrollmentDependent>();
    const dependentByEmployeeAndRelation = new Map<string, PolicyEnrollmentDependent>();
    for (const dep of allDependentsByEmployee) {
      const normName = dep.name.toLowerCase().replace(/\s+/g, " ").trim();
      const normRelation = dep.relation.toLowerCase().trim();
      dependentByEmployeeAndName.set(`${dep.employeeId}:${normName}`, dep);
      if (!dependentByEmployeeAndRelation.has(`${dep.employeeId}:${normRelation}`)) {
        dependentByEmployeeAndRelation.set(`${dep.employeeId}:${normRelation}`, dep);
      }
    }

    const preparedRows: ResolvedClaimRow[] = [];
    for (const row of resolvedRows) {
      try {
        // Path A: look up by companyEmployeeId (new format)
        let employeeMap = row.employeeIdValue
          ? employeeMapByCeidKey.get(`${row.policy.id}:${row.employeeIdValue}`)
          : undefined;
        // Path B: fall back to employeeTpaId (legacy format)
        if (!employeeMap && row.employeeTpaId) {
          employeeMap = employeeMapByTpaKey.get(`${row.policy.id}:${row.employeeTpaId}`);
        }
        if (!employeeMap) {
          const noIdentifier = !row.employeeIdValue && !row.employeeTpaId;
          if (noIdentifier) {
            if (this.isSelfRelation(row.normalizedRelation)) {
              throw new BadRequestException(
                errorMessages.claimEmployeeIdMissing
              );
            }
            const normalizedPatientTpaId = this.normalizeIdentifier(
              row.patientTpaId
            );
            const dependent = normalizedPatientTpaId
              ? dependentMapByKey.get(
                  `${row.policy.id}:${normalizedPatientTpaId}`
                )
              : undefined;
            if (!dependent) {
              if (
                normalizedPatientTpaId &&
                !dependentTpaIdSet.has(normalizedPatientTpaId)
              ) {
                throw new BadRequestException(
                  errorMessages.claimInvalidDependentTpaId(
                    row.patientTpaId ?? ""
                  )
                );
              }
              throw new BadRequestException(
                errorMessages.claimDependentNotAssociated(
                  row.patientTpaId ?? "",
                  row.policy.id
                )
              );
            }
            employeeMap = employeeMapByEmployeeIdKey.get(
              `${row.policy.id}:${dependent.employeeId}`
            );
            if (!employeeMap) {
              throw new BadRequestException(
                errorMessages.claimDependentNotAssociated(
                  row.patientTpaId ?? "",
                  row.policy.id
                )
              );
            }
          } else {
            // Identifier provided but not resolved to a map
            const identifier = row.employeeIdValue ?? row.employeeTpaId ?? "";
            const existsAnywhere = row.employeeIdValue
              ? companyEmployeeIdSet.has(row.employeeIdValue)
              : employeeTpaIdSet.has(row.employeeTpaId!);
            if (!existsAnywhere) {
              throw new BadRequestException(
                errorMessages.claimInvalidEmployeeId(identifier)
              );
            }
            throw new BadRequestException(
              upload.entityType === DOCUMENT_ENTITY_TYPE.CLAIM_UPLOAD_TPA_ENTITY
                ? errorMessages.claimEmployeeNotAssociatedWithTpa(
                    identifier,
                    upload.entityId
                  )
                : errorMessages.claimEmployeeNotAssociated(
                    identifier,
                    row.policy.id
                  )
            );
          }
        }

        let dependentId: number | null = null;
        let resolvedPatientTpaId: string | null = row.patientTpaId;
        if (!this.isSelfRelation(row.normalizedRelation)) {
          const normalizedPatientTpaId = this.normalizeIdentifier(row.patientTpaId);
          if (normalizedPatientTpaId) {
            // Primary: match by patientTpaId
            const dependent =
              dependentMapByKey.get(`${row.policy.id}:${normalizedPatientTpaId}`) ??
              dependentMapByEmployeeAndTpa.get(`${employeeMap.employeeId}:${normalizedPatientTpaId}`) ??
              dependentAnyPolicyByTpaId.get(normalizedPatientTpaId);
            if (dependent) {
              dependentId = dependent.id;
            }
          } else {
            // Fallback: match by patientName or relation when no TPA ID in file
            const normName = row.patientName?.toLowerCase().replace(/\s+/g, " ").trim();
            const dependent =
              (normName ? dependentByEmployeeAndName.get(`${employeeMap.employeeId}:${normName}`) : undefined) ??
              dependentByEmployeeAndRelation.get(`${employeeMap.employeeId}:${row.normalizedRelation}`);
            if (dependent) {
              dependentId = dependent.id;
              resolvedPatientTpaId = dependent.dependentTpaId ?? null;
            }
          }
        }

        preparedRows.push({
          ...row,
          patientTpaId: this.isSelfRelation(row.normalizedRelation)
            ? (employeeMap.employeeTpaId ?? null)
            : resolvedPatientTpaId,
          employeeMapping: employeeMap,
          dependentId,
        });
      } catch (error) {
        errors.push({
          ...row.rawRow,
          Remarks: this.getErrorMessage(error),
        });
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "ClaimUploadScheduler",
            method: "resolveEmployeeContext",
            payload: { uploadId: upload.id },
            messageData: error,
          }),
        });
      }
    }

    if (!preparedRows.length) {
      return { errors, successCount, policyId };
    }

    const claimNumbers = Array.from(
      new Set(preparedRows.map((row) => row.claimNumber).filter(Boolean))
    ) as string[];
    const existingClaims = claimNumbers.length
      ? await this.claimRepo.find({
          where: { claimNumber: In(claimNumbers) },
        })
      : [];
    const existingClaimMap = new Map<string, PolicyClaim>();
    const existingClaimEmployeeMap = new Map<string, Set<number>>();
    for (const claim of existingClaims) {
      if (claim.claimNumber && claim.employeeId) {
        existingClaimMap.set(`${claim.claimNumber}:${claim.employeeId}`, claim);
        if (!existingClaimEmployeeMap.has(claim.claimNumber)) {
          existingClaimEmployeeMap.set(claim.claimNumber, new Set());
        }
        existingClaimEmployeeMap
          .get(claim.claimNumber)
          ?.add(claim.employeeId);
      }
    }

    const claimsToSave: PolicyClaim[] = [];
    const claimMeta: Array<{
      settlementAmount: number | null;
      settlementDate: Date | null;
      claimStatusId: number;
      shouldAudit: boolean;
    }> = [];
    const balanceAdjustments = new Map<string, number>();

    const processedClaimNumbers = new Set<string>();
    for (const row of preparedRows) {
      try {
        const claimNumber = row.claimNumber;
        const claimKey = `${claimNumber}:${row.employeeMapping.employeeId}`;
        if (claimNumber && processedClaimNumbers.has(claimNumber)) {
          throw new BadRequestException(
            errorMessages.claimDuplicateRecord(claimNumber)
          );
        }
        if (claimNumber) {
          const employeeIdsForClaim =
            existingClaimEmployeeMap.get(claimNumber);
          if (
            employeeIdsForClaim?.size &&
            !employeeIdsForClaim.has(row.employeeMapping.employeeId)
          ) {
            throw new BadRequestException(
              errorMessages.claimDuplicateRecord(claimNumber)
            );
          }
        }
        const { hospitalId, hospitalLocation } =
          await this.findOrCreateHospitalAndMapping(
            row.hospitalName,
            row.hospitalAddress,
            row.hospitalCity,
            row.hospitalState,
            row.policy.id,
            upload.createdBy ?? 0
          );

        const claimPayload: Partial<PolicyClaim> = {
          policyId: row.policy.id,
          employeeId: row.employeeMapping.employeeId,
          employeeTpaId: row.employeeMapping.employeeTpaId ?? null,
          companyEmployeeId: row.employeeIdValue ?? null,
          dependentId: row.dependentId ?? undefined,
          claimNumber: row.claimNumber,
          claimType: row.claimType,
          claimAmount: this.isSettledStatus(row.claimStatus)
            ? (row.settlementAmount ?? row.claimAmount)
            : row.claimAmount,
          claimDate: row.claimRequestedDate,
          claimStatus: row.claimStatus,
          sourceFileUploadId: upload.documentId,
          companyName: row.companyName,
          policyNumber: row.policyNumber,
          policyTpaId: row.policyTpaId,
          policyType: row.policyType,
          policyStartDate: row.policyStartDate,
          policyEndDate: row.policyEndDate,
          employeeName: row.employeeName,
          patientName: row.patientName,
          patientRelation: row.patientRelation,
          patientTpaId: row.patientTpaId,
          totalSumInsured: row.totalSumInsured,
          totalAvailableBalance: row.totalAvailableBalance,
          hospitalId,
          claimHospital: row.hospitalName,
          claimHospitalLocation: hospitalLocation,
        };

        const existingClaim = claimNumber
          ? existingClaimMap.get(claimKey)
          : undefined;
        const shouldAudit =
          !existingClaim ||
          (existingClaim.claimStatus ?? "").toLowerCase() !==
            row.claimStatus.toLowerCase();
        const claimEntity = this.claimRepo.create({
          id: existingClaim?.id,
          ...claimPayload,
          sourceFileUploadId: upload.documentId,
        });
        claimsToSave.push(claimEntity);
        claimMeta.push({
          settlementAmount: row.settlementAmount,
          settlementDate: row.claimSettledDate,
          claimStatusId: row.claimStatusEntity.id,
          shouldAudit,
        });

        if (claimNumber) {
          processedClaimNumbers.add(claimNumber);
        }
        if (
          this.isSettledStatus(row.claimStatus) &&
          row.settlementAmount &&
          row.settlementAmount > 0
        ) {
          const balanceKey = `${row.employeeMapping.employeeId}:${row.policy.id}`;
          balanceAdjustments.set(
            balanceKey,
            (balanceAdjustments.get(balanceKey) ?? 0) + row.settlementAmount
          );
        }
      } catch (error) {
        errors.push({
          ...row.rawRow,
          Remarks: this.getErrorMessage(error),
        });
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "ClaimUploadScheduler",
            method: "buildClaimPayload",
            payload: { uploadId: upload.id },
            messageData: error,
          }),
        });
      }
    }

    if (!claimsToSave.length) {
      return { errors, successCount, policyId };
    }

    await this.claimRepo.manager.transaction(async (manager) => {
      const savedClaims = await manager.save(PolicyClaim, claimsToSave, {
        chunk: this.batchSize,
      });

      const settlements: PolicyClaimSettlement[] = [];
      const audits: PolicyClaimAudit[] = [];

      savedClaims.forEach((claim, index) => {
        const meta = claimMeta[index];
        if (meta?.settlementAmount || meta?.settlementDate) {
          settlements.push(
            this.settlementRepo.create({
              claimId: claim.id,
              sourceFileUploadId: upload.documentId,
              settlementAmount: meta.settlementAmount ?? null,
              settlementDate: meta.settlementDate,
            })
          );
        }
        if (meta?.shouldAudit) {
          audits.push(
            this.claimAuditRepo.create({
              policyClaimId: claim.id,
              policyClaimStatusId: meta.claimStatusId,
              userId: upload.createdBy ?? 0,
              sourceFileUploadId: upload.documentId,
            })
          );
        }
      });

      if (settlements.length) {
        await manager.save(PolicyClaimSettlement, settlements, {
          chunk: this.batchSize,
        });
      }
      if (audits.length) {
        await manager.save(PolicyClaimAudit, audits, { chunk: this.batchSize });
      }

      for (const [balanceKey, amount] of balanceAdjustments.entries()) {
        const [employeeId, policyIdValue] = balanceKey
          .split(":")
          .map((value) => Number(value));
        if (!Number.isFinite(employeeId) || !Number.isFinite(policyIdValue)) {
          continue;
        }
        await manager.query(
          `UPDATE policy_employee_enrollment
           SET balance = COALESCE(balance, 0) - $1
           WHERE employee_id = $2 AND policy_id = $3`,
          [amount, employeeId, policyIdValue]
        );
      }
    });

    successCount += claimsToSave.length;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ClaimUploadScheduler",
        method: "processBatch",
        payload: {
          uploadId: upload.id,
          batchSize: rows.length,
          successCount,
          errorCount: errors.length,
        },
        messageData: "batch processing completed",
      }),
    });
    return { errors, successCount, policyId };
  }

  private async loadClaimStatusLookup(): Promise<ClaimStatusLookup> {
    try {
      const statuses = await this.claimStatusRepo.find();
      const statusByKey = new Map<string, PolicyClaimStatus>();
      statuses.forEach((status) => {
        statusByKey.set(status.status.toLowerCase(), status);
      });
      return {
        statusByKey,
        allowedStatuses: statuses.map((status) => status.status),
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ClaimUploadScheduler",
          method: "loadClaimStatusLookup",
          messageData: this.formatErrorForLog(error),
        }),
      });
      return { statusByKey: new Map(), allowedStatuses: [] };
    }
  }

  private async getPolicyContextForUpload(
    upload: DocumentProcessingFile
  ): Promise<PolicyContextResult> {
    if (upload.entityType !== DOCUMENT_ENTITY_TYPE.CLAIM_UPLOAD_POLICY_ENTITY) {
      return { policy: null };
    }
    try {
      const policy = await this.policyRepo.findOne({
        where: { id: upload.entityId },
        relations: ["policyType", "tpaMappings", "policyStatus"],
      });
      if (!policy) {
        throw new BadRequestException(errorMessages.claimInvalidPolicyId);
      }
      // claims can be uploaded even for expired/inactive policies
      // if (!this.isActivePolicy(policy)) {
      //   throw new BadRequestException(
      //     errorMessages.claimInactivePolicy(upload.entityId)
      //   );
      // }
      return { policy };
    } catch (error) {
      return { policy: null, error: error as Error };
    }
  }

  private async getMappingTemplateForUpload(
    upload: DocumentProcessingFile,
    policyContext: PolicyContextResult,
    options?: { requireTemplate?: boolean }
  ): Promise<MappingTemplateContextResult> {
    const requireTemplate = options?.requireTemplate ?? true;
    if (policyContext.error) {
      return { mapping: null, error: policyContext.error };
    }
    const tpaId = this.resolveTpaIdForTemplate(upload, policyContext.policy);
    if (!tpaId) {
      if (!requireTemplate) {
        return { mapping: null };
      }
      return {
        mapping: null,
        error: new BadRequestException(
          errorMessages.claimMappingTemplateMissing()
        ),
      };
    }
    const template = await this.mappingTemplateRepo.findOne({
      where: {
        entityId: tpaId,
        entityName: UTILITY_UPLOAD_ENTITY_CLAIMS,
        fileDirection: "INBOUND",
        isActive: true,
      },
      relations: ["columns"],
    });
    if (!template) {
      if (!requireTemplate) {
        return { mapping: null };
      }
      return {
        mapping: null,
        error: new BadRequestException(
          errorMessages.claimMappingTemplateMissing()
        ),
      };
    }
    return { mapping: await this.buildMappingTemplateMap(template) };
  }

  private async getDynamicClaimsMappingContext(
    upload: DocumentProcessingFile,
    policyContext: PolicyContextResult,
    worksheet: XLSX.WorkSheet
  ): Promise<DynamicMappingContextResult> {
    if (policyContext.error) {
      return {
        mappingContext: { mapping: null, error: policyContext.error },
        useDynamic: true,
      };
    }
    const tpaId = this.resolveTpaIdForTemplate(upload, policyContext.policy);
    if (!tpaId) {
      return { mappingContext: { mapping: null }, useDynamic: false };
    }
    const template = await this.mappingTemplateRepo.findOne({
      where: {
        entityId: tpaId,
        entityName: UTILITY_UPLOAD_ENTITY_CLAIMS,
        fileDirection: "INBOUND",
        isActive: true,
      },
      order: { templateVersionNo: "DESC" },
    });
    if (!template) {
      return { mappingContext: { mapping: null }, useDynamic: false };
    }

    const seedTargets = await this.entityFieldRepo.find({
      where: { entityName: UTILITY_UPLOAD_ENTITY_CLAIMS },
    });
    const mappingRows = await this.mappingTemplateColumnRepo.find({
      where: { mappingTemplateVersionId: template.id },
      select: [
        "sourceColumnName",
        "targetTableName",
        "targetColumnName",
        "transformationConfig",
      ],
    });
    if (!mappingRows.length) {
      return {
        mappingContext: {
          mapping: null,
          error: new BadRequestException(
            errorMessages.claimMappingTemplateEmpty
          ),
        },
        useDynamic: true,
      };
    }

    const ref = worksheet["!ref"];
    if (!ref) {
      return {
        mappingContext: {
          mapping: null,
          error: new BadRequestException(errorMessages.claimUploadFailed),
        },
        useDynamic: true,
      };
    }
    const range = XLSX.utils.decode_range(ref);
    const headerColumns = this.getWorksheetHeaders(worksheet, range);

    const requiredTargets = seedTargets.filter((target) =>
      Boolean(target.is_required ?? target.isRequired)
    );

    const normalizePipeList = (val?: string) =>
      (val ?? "")
        .split("|")
        .map((v) => v.trim())
        .filter(Boolean);

    const getSourceColumn = (
      targetTable: string,
      targetColumn: string
    ): string | undefined => {
      const matches = mappingRows.filter((row) => {
        const targetColumnTokens = normalizePipeList(row.targetColumnName);
        if (!targetColumnTokens.includes(targetColumn)) {
          return false;
        }
        const targetTableTokens = normalizePipeList(row.targetTableName);
        if (!targetTableTokens.length) {
          return true;
        }
        return targetTableTokens.includes(targetTable);
      });

      if (!matches.length) {
        return undefined;
      }

      const preferredMatch = matches.find((row) => {
        const targetTableTokens = normalizePipeList(row.targetTableName);
        return targetTableTokens.includes(targetTable);
      });

      const selected = preferredMatch ?? matches[0];
      const sourceColumnName = selected.sourceColumnName;
      return sourceColumnName ? String(sourceColumnName).trim() : undefined;
    };

    const requireSourceColumn = (
      targetTable: string,
      targetColumn: string
    ): string => {
      const src = getSourceColumn(targetTable, targetColumn);
      if (!src) {
        throw new BadRequestException(
          errorMessages.claimMappingMissingTarget(`${targetTable}.${targetColumn}`)
        );
      }
      return src;
    };

    try {
      for (const target of requiredTargets) {
        const targetTable = target.tableName ?? target.table_name ?? "";
        const targetColumn = target.columnName ?? target.column_name ?? "";
        if (!targetTable || !targetColumn) {
          continue;
        }
        const source = requireSourceColumn(targetTable, targetColumn);
        if (!headerColumns.some((column) => column === source)) {
          throw new BadRequestException(
            errorMessages.claimMappingSourceColumnNotFound(source)
          );
        }
      }
    } catch (error) {
      return {
        mappingContext: { mapping: null, error: error as Error },
        useDynamic: true,
      };
    }

    const templateWithColumns = {
      ...template,
      columns: mappingRows,
    } as MappingTemplateVersion;
    const mapping = await this.buildMappingTemplateMap(templateWithColumns);

    return { mappingContext: { mapping }, useDynamic: true };
  }

  private resolveTpaIdForTemplate(
    upload: DocumentProcessingFile,
    policy: Policy | null
  ): number | null {
    if (upload.entityType === DOCUMENT_ENTITY_TYPE.CLAIM_UPLOAD_TPA_ENTITY) {
      return upload.entityId;
    }
    if (policy && Array.isArray(policy.tpaMappings) && policy.tpaMappings.length) {
      return policy.tpaMappings[0].tpaId ?? null;
    }
    return null;
  }

  private async buildMappingTemplateMap(
    template: MappingTemplateVersion
  ): Promise<Map<string, string>> {
    const targetFieldRows = await this.entityFieldRepo.find({
      where: { entityName: template.entityName },
      select: ["columnName", "displayName"],
    });
    const displayNameByColumn = new Map<string, string>();
    targetFieldRows.forEach((field) => {
      displayNameByColumn.set(field.columnName, field.displayName);
    });
    const mapping = new Map<string, string>();
    template.columns?.forEach((column) => {
      const targetDisplayName =
        displayNameByColumn.get(column.targetColumnName) ||
        column.targetColumnName;
      mapping.set(
        this.normalizeHeader(column.sourceColumnName),
        targetDisplayName
      );
    });
    return mapping;
  }

  private applyMappingTemplate(
    row: Record<string, any>,
    mapping: Map<string, string>
  ): Record<string, any> {
    const mappedRow = { ...row };
    for (const [key, value] of Object.entries(row)) {
      const targetDisplayName = mapping.get(this.normalizeHeader(key));
      if (targetDisplayName) {
        mappedRow[targetDisplayName] = value;
      }
    }
    return { __rawRow: row, ...mappedRow };
  }

  private async processWorksheetInBatches(
    worksheet: XLSX.WorkSheet,
    handler: (batch: Record<string, any>[]) => Promise<void>,
    batchSize: number
  ): Promise<void> {
    const ref = worksheet["!ref"];
    if (!ref) {
      return;
    }
    const range = XLSX.utils.decode_range(ref);
    const headers = this.getWorksheetHeaders(worksheet, range);
    let batch: Record<string, any>[] = [];
    for (let rowIndex = range.s.r + 1; rowIndex <= range.e.r; rowIndex += 1) {
      const row = this.buildRowFromWorksheet(
        worksheet,
        headers,
        rowIndex,
        range.s.c
      );
      if (this.isRowEmpty(row)) {
        continue;
      }
      batch.push(row);
      if (batch.length >= batchSize) {
        await handler(batch);
        batch = [];
      }
    }
    if (batch.length) {
      await handler(batch);
    }
  }

  private getWorksheetHeaders(
    worksheet: XLSX.WorkSheet,
    range: XLSX.Range
  ): string[] {
    const headers: string[] = [];
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: col })];
      headers.push(cell?.v ? String(cell.v).trim() : "");
    }
    return headers;
  }

  private buildRowFromWorksheet(
    worksheet: XLSX.WorkSheet,
    headers: string[],
    rowIndex: number,
    startColumn: number
  ): Record<string, any> {
    const row: Record<string, any> = {};
    headers.forEach((header, index) => {
      if (!header) {
        return;
      }
      const cell = worksheet[
        XLSX.utils.encode_cell({ r: rowIndex, c: startColumn + index })
      ];
      row[header] = cell?.v ?? null;
    });
    return row;
  }

  private isRowEmpty(row: Record<string, any>): boolean {
    return Object.values(row).every(
      (value) => value === null || value === undefined || String(value).trim() === ""
    );
  }

  private buildNormalizedRow(row: Record<string, any>): Map<string, any> {
    const normalizedRow = new Map<string, any>();
    for (const [key, value] of Object.entries(row)) {
      if (key === "__rawRow") {
        continue;
      }
      normalizedRow.set(this.normalizeHeader(key), value);
    }
    return normalizedRow;
  }

  private getNormalizedCellValue(
    normalizedRow: Map<string, any>,
    ...aliases: string[]
  ): any {
    for (const alias of aliases) {
      const normalizedAlias = this.normalizeHeader(alias);
      if (normalizedRow.has(normalizedAlias)) {
        return normalizedRow.get(normalizedAlias);
      }
    }
    return undefined;
  }

  private normalizeText(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const normalized = String(value).trim();
    return normalized ? normalized : null;
  }

  private parseRow(
    upload: DocumentProcessingFile,
    row: Record<string, any>,
    claimStatusLookup: ClaimStatusLookup
  ): ParsedClaimRow {
    const rawRow = this.extractRawRow(row);
    const normalizedRow = this.buildNormalizedRow(row);
    const policyNumber = this.normalizeText(
      this.getNormalizedCellValue(normalizedRow, "Policy Number")
    );
    const policyType = this.normalizeText(
      this.getNormalizedCellValue(normalizedRow, "Policy Type")
    );
    const policyStartDate = this.parseDate(
      this.getNormalizedCellValue(normalizedRow, "Policy Start Date")
    );
    const policyEndDate = this.parseDate(
      this.getNormalizedCellValue(normalizedRow, "Policy End Date")
    );
    const companyName = this.normalizeText(
      this.getNormalizedCellValue(
        normalizedRow,
        "Corporate / Company Name",
        "Corporate Company Name",
        "Company Name"
      )
    );
    const employeeName = this.normalizeText(
      this.getNormalizedCellValue(normalizedRow, "Employee Name")
    );
    const employeeIdValue = this.normalizeText(
      this.getNormalizedCellValue(normalizedRow, "Employee ID")
    );
    const employeeTpaId = this.normalizeText(
      this.getNormalizedCellValue(
        normalizedRow,
        "Employee TPA Id",
        "Employee TPA ID"
      )
    );
    const patientName = this.normalizeText(
      this.getNormalizedCellValue(normalizedRow, "Patient Name")
    );
    const patientRelation = this.normalizeText(
      this.getNormalizedCellValue(normalizedRow, "Patient Relation")
    );
    const patientTpaId = this.normalizeText(
      this.getNormalizedCellValue(normalizedRow, "Patient TPA ID")
    );
    const claimNumber = this.normalizeText(
      this.getNormalizedCellValue(normalizedRow, "Claim Number")
    );
    const claimType = this.normalizeText(
      this.getNormalizedCellValue(normalizedRow, "Claim Type")
    );
    const totalSumInsured = this.toNumber(
      this.getNormalizedCellValue(normalizedRow, "Total Sum Insured")
    );
    const claimAmount = this.toNumber(
      this.getNormalizedCellValue(normalizedRow, "Claimed Amount")
    );
    const settlementAmount = this.toNumber(
      this.getNormalizedCellValue(normalizedRow, "Settled Amount")
    );
    const totalAvailableBalance = this.toNumber(
      this.getNormalizedCellValue(normalizedRow, "Total Available Balance")
    );
    const claimRequestedDate = this.parseDate(
      this.getNormalizedCellValue(normalizedRow, "Claim Requested Date")
    );
    const claimSettledDate = this.parseDate(
      this.getNormalizedCellValue(normalizedRow, "Claim Settled Date")
    );
    const claimStatusValue = this.normalizeStatus(
      this.getNormalizedCellValue(normalizedRow, "Status")
    );

    const hospitalName = this.normalizeText(
      this.getNormalizedCellValue(normalizedRow, "Hospital Name")
    );
    const hospitalAddress = this.normalizeText(
      this.getNormalizedCellValue(normalizedRow, "Hospital Address")
    );
    const hospitalCity = this.normalizeText(
      this.getNormalizedCellValue(normalizedRow, "Hospital City")
    );
    const hospitalState = this.normalizeText(
      this.getNormalizedCellValue(normalizedRow, "Hospital State")
    );

    const normalizedRelation = this.normalizeRelation(patientRelation);
    const isDependentRelation = !this.isSelfRelation(normalizedRelation);
    if (
      !patientRelation ||
      !claimNumber ||
      !claimStatusValue ||
      (upload.entityType === DOCUMENT_ENTITY_TYPE.CLAIM_UPLOAD_TPA_ENTITY &&
        !policyNumber)
    ) {
      throw new BadRequestException(errorMessages.claimMandatoryFieldsMissing);
    }
    if (!employeeIdValue && !employeeTpaId && !isDependentRelation) {
      throw new BadRequestException(errorMessages.claimEmployeeIdMissing);
    }

    if (!hospitalName || !hospitalAddress || !hospitalCity || !hospitalState) {
      throw new BadRequestException(
        "Hospital Name, Address,City and State are required. " +
        "These fields are used to map policy for an existing hospital record " +
        "if no match is found fields are used to create a new hospital and map it to the policy."
      );
    }

    const claimStatusEntity = claimStatusLookup.statusByKey.get(
      claimStatusValue.toLowerCase()
    );
    if (!claimStatusEntity) {
      throw new BadRequestException(
        errorMessages.claimInvalidStatus(
          claimStatusValue,
          claimStatusLookup.allowedStatuses.join(", ")
        )
      );
    }

    // if (isDependentRelation && !patientTpaId) {
    //   throw new BadRequestException(errorMessages.claimMandatoryFieldsMissing);
    // }

    return {
      rawRow,
      policyNumber,
      policyType,
      policyStartDate,
      policyEndDate,
      companyName,
      employeeName,
      employeeIdValue,
      employeeTpaId,
      patientName,
      patientRelation,
      normalizedRelation,
      patientTpaId,
      claimNumber,
      claimType,
      totalSumInsured,
      claimAmount,
      settlementAmount,
      totalAvailableBalance,
      claimRequestedDate,
      claimSettledDate,
      claimStatus: claimStatusEntity.status,
      claimStatusEntity,
      hospitalName,
      hospitalAddress,
      hospitalCity,
      hospitalState,
    };
  }

  private extractRawRow(row: Record<string, any>): Record<string, any> {
    const raw = (row as { __rawRow?: Record<string, any> }).__rawRow;
    return raw ?? row;
  }

  private async loadPoliciesForBatch(
    upload: DocumentProcessingFile,
    rows: ParsedClaimRow[],
    policyContext: Policy | null
  ): Promise<Map<string, Policy>> {
    if (
      upload.entityType === DOCUMENT_ENTITY_TYPE.CLAIM_UPLOAD_POLICY_ENTITY ||
      policyContext
    ) {
      return new Map();
    }
    const policyNumbers = Array.from(
      new Set(rows.map((row) => row.policyNumber).filter(Boolean))
    ) as string[];
    if (!policyNumbers.length) {
      return new Map();
    }
    const numericIds = policyNumbers
      .filter((v) => /^\d+$/.test(v) && parseInt(v, 10) <= 2147483647)
      .map(Number);
    const qb = this.policyRepo
      .createQueryBuilder("policy")
      .leftJoinAndSelect("policy.policyType", "policyType")
      .leftJoinAndSelect("policy.tpaMappings", "tpaMappings")
      .leftJoinAndSelect("policy.policyStatus", "policyStatus");
    if (numericIds.length) {
      qb.where(
        "policy.id IN (:...numericIds) OR policy.insurerPolicyNumber IN (:...policyNumbers)",
        { numericIds, policyNumbers }
      );
    } else {
      qb.where("policy.insurerPolicyNumber IN (:...policyNumbers)", { policyNumbers });
    }
    const policies = await qb.getMany();
    const policyMap = new Map<string, Policy>();
    policies.forEach((policy) => {
      policyMap.set(String(policy.id), policy);
      if (policy.insurerPolicyNumber) {
        policyMap.set(policy.insurerPolicyNumber, policy);
      }
    });
    return policyMap;
  }

  private resolvePolicyTpaId(
    upload: DocumentProcessingFile,
    policy: Policy
  ): number | null {
    if (upload.entityType === DOCUMENT_ENTITY_TYPE.CLAIM_UPLOAD_TPA_ENTITY) {
      return upload.entityId;
    }
    if (Array.isArray(policy.tpaMappings) && policy.tpaMappings.length > 0) {
      return policy.tpaMappings[0].tpaId ?? null;
    }
    return null;
  }

  private isSelfRelation(normalizedRelation: string): boolean {
    return ClaimUploadScheduler.SELF_RELATION_TYPES.has(normalizedRelation);
  }

  private normalizeRelation(value: unknown): string {
    if (!value) {
      throw new BadRequestException(errorMessages.claimMandatoryFieldsMissing);
    }
    return String(value).trim().toLowerCase();
  }

  private normalizeIdentifier(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }
    const normalized = String(value).trim().toLowerCase();
    return normalized || null;
  }

  private parseDate(value: any): Date | null {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value === "number") {
      const parsed = XLSX.SSF.parse_date_code(value);
      return parsed ? new Date(parsed.y, parsed.m - 1, parsed.d) : null;
    }
    const str = String(value).trim();
    let m: RegExpMatchArray | null;
    if ((m = str.match(/^(\d{4})[-\/. ](\d{1,2})[-\/. ](\d{1,2})$/))) {
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }
    if ((m = str.match(/^(\d{1,2})[-\/. ](\d{1,2})[-\/. ](\d{4})$/))) {
      const d1 = Number(m[1]);
      const d2 = Number(m[2]);
      const y = Number(m[3]);
      return new Date(y, d2 - 1, d1);
    }
    const date = new Date(str);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private formatExcelDate(value: any): any {
    if (value instanceof Date) {
      return value.toISOString().split("T")[0];
    }
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number") {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) {
        return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(
          parsed.d
        ).padStart(2, "0")}`;
      }
    }
    return value;
  }

  private formatErrorRowDates(row: Record<string, any>): Record<string, any> {
    const formattedRow = { ...row };
    Object.entries(formattedRow).forEach(([key, value]) => {
      if (!key.toLowerCase().includes("date")) {
        return;
      }
      formattedRow[key] = this.formatExcelDate(value);
    });
    return formattedRow;
  }

  private toNumber(value: any): number | null {
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  }

  private normalizeStatus(value: any): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const normalized = String(value).trim();
    return normalized ? normalized : null;
  }

  // private isActivePolicy(policy: Policy): boolean {
  //   const statusKey = policy.policyStatus?.lookUpKey ?? "";
  //   return (
  //     statusKey === OPPORTUNITY_POLICY_STATUS_ACTIVE ||
  //     statusKey === POLICY_STATUS_MIG_ACTIVE
  //   );
  // }

  private async createErrorFileIfNeeded(
    errors: Record<string, any>[],
    file: FileUpload | null,
    upload: DocumentProcessingFile
  ): Promise<number | null> {
    if (!errors.length || !file) {
      return null;
    }
    const formattedErrors = errors.map((row) => this.formatErrorRowDates(row));
    const errorBuffer = await generateExcel(formattedErrors);
    const errorFileSizeBytes = errorBuffer.length;
    const errorFileSizeFormatted = formatSize(errorFileSizeBytes);

    const sanitizedName = `claim-upload-${
      upload.id
    }-errorfile-${Date.now()}.xlsx`;
    const key = `uploads/company/${file.entityType}/errorfiles/${sanitizedName}`;

    try {
      await uploadToS3(
        errorBuffer,
        key,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      const savedErrorFile = await this.fileRepo.save(
        this.fileRepo.create({
          fileKey: key,
          entityType: file.entityType,
          entityId: file.entityId,
          uploadType: "AWS",
          documentTypeLid: file.documentTypeLid,
          createdBy: 0,
          updatedBy: 0,
          fileSize: errorFileSizeFormatted,
        })
      );
      return savedErrorFile.id;
    } catch (uploadErr) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ClaimUploadScheduler",
          method: "createErrorFileIfNeeded",
          payload: { uploadId: upload.id },
          messageData: uploadErr,
        }),
      });
      return null;
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown error";
    }
  }

  private formatErrorForLog(error: unknown): {
    message: string;
    stack?: string;
  } {
    if (error instanceof Error) {
      return { message: error.message, stack: error.stack };
    }
    return { message: this.getErrorMessage(error) };
  }

  private async saveSummary({
    upload,
    policyId,
    sourceFileId,
    errorFileUploadId,
    successCount,
    errorCount,
  }: {
    upload: DocumentProcessingFile;
    policyId: number | null;
    sourceFileId: number;
    errorFileUploadId: number | null;
    successCount: number;
    errorCount: number;
  }): Promise<void> {
    if (!policyId) {
      return;
    }
    const processCount = successCount + errorCount;
    await this.summaryRepo.save(
      this.summaryRepo.create({
        documentProcessingFileId: upload.id,
        policyId,
        sourceFileUploadId: sourceFileId,
        errorFileUploadId: errorFileUploadId ?? null,
        successFileUploadId: null,
        successCount,
        errorCount,
        processCount,
        batchId: upload.id,
        endorsementId: upload.endorsementId,
      })
    );
  }

  private isSettledStatus(status?: string | null): boolean {
    if (!status) return false;
    return status.toString().trim().toLowerCase() === "settled";
  }

  private normalizeHeader(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  private async getCountryNameFromState(stateName: string): Promise<string> {
    const normalized = stateName.trim().toLowerCase();
    const state = await this.stateRepo
      .createQueryBuilder("state")
      .leftJoinAndSelect("state.country", "country")
      .where(
        "LOWER(TRIM(state.name)) = :name OR LOWER(TRIM(state.stateCode)) = :name",
        { name: normalized }
      )
      .getOne();

    return state?.country?.name?.trim() || "India";
  }

  private async findOrCreateHospitalAndMapping(
    hospitalName: string,
    hospitalAddress: string,
    hospitalCity: string,
    hospitalState: string,
    policyId: number,
    userId: number
  ): Promise<{ hospitalId: number; hospitalLocation: string }> {
    const norm = (v: string) => v.trim().toLowerCase();
    const normName = norm(hospitalName);
    const normAddress = norm(hospitalAddress);
    const normCity = norm(hospitalCity);
    const normState = norm(hospitalState);

    return this.hospitalRepo.manager.transaction(async (manager) => {
      const hospitalRepo = manager.getRepository(MstrHospital);
      const addressRepo = manager.getRepository(MstrHospitalAddress);
      const mapRepo = manager.getRepository(MstrPolicyHospitalMap);

      const existing = await hospitalRepo
        .createQueryBuilder("hospital")
        .innerJoinAndSelect("hospital.addresses", "addresses")
        .where("hospital.deletedAt IS NULL")
        .andWhere("addresses.deletedAt IS NULL")
        .andWhere("LOWER(TRIM(hospital.name)) = :name", { name: normName })
        .andWhere("LOWER(TRIM(addresses.addressLine1)) = :address", { address: normAddress })
        .andWhere("LOWER(TRIM(addresses.cityName)) = :city", { city: normCity })
        .andWhere("LOWER(TRIM(addresses.stateName)) = :state", { state: normState })
        .getOne();

      let hospitalId: number;
      let hospitalLocation: string;

      if (existing) {
        hospitalId = existing.id;
        const addr = existing.addresses;
        hospitalLocation = [
          addr.addressLine1,
          addr.cityName,
          addr.stateName,
          addr.pinCode,
          addr.countryName,
        ]
          .filter(Boolean)
          .join(", ");
      } else {
        const countryName = await this.getCountryNameFromState(hospitalState);
        const savedAddress = await addressRepo.save(
          addressRepo.create({
            addressLine1: hospitalAddress.trim(),
            cityName: hospitalCity.trim(),
            stateName: hospitalState.trim(),
            countryName,
            createdBy: userId,
            updatedBy: userId,
          } as Partial<MstrHospitalAddress>)
        );

        const savedHospital = await hospitalRepo.save(
          hospitalRepo.create({
            name: hospitalName.trim(),
            addressId: savedAddress.id,
            createdBy: userId,
            updatedBy: userId,
          } as Partial<MstrHospital>)
        );

        hospitalId = savedHospital.id;
        hospitalLocation = [hospitalAddress.trim(), hospitalCity.trim(), hospitalState.trim()].join(", ");
      }

      const existingMapping = await mapRepo.findOne({
        where: { policyId, hospitalId },
        withDeleted: true,
      });

      if (existingMapping) {
        existingMapping.updatedBy = userId;
        existingMapping.deletedAt = null as any;
        existingMapping.deletedBy = null as any;
        await mapRepo.save(existingMapping);
      } else {
        await mapRepo.save(
          mapRepo.create({
            policyId,
            hospitalId,
            isNetworkHospital: false,
            createdBy: userId,
            updatedBy: userId,
          } as Partial<MstrPolicyHospitalMap>)
        );
      }

      return { hospitalId, hospitalLocation };
    });
  }
}
