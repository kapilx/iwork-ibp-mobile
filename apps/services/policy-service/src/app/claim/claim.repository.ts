import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import {
  FileUpload,
  PolicyClaim,
  PolicyClaimSettlement,
  PolicyEnrollmentDependent,
  PolicyEnrollmentEmployeePolicyMap,
  PolicyEmployeeEnrollment,
  PolicyEnrollmentUploadSummary,
  Policy,
  DocumentProcessingFile,
  User,
  PolicyEnrollmentEmployee,
  MstrServicePolicyTemplateField,
  PolicyInsurerMap,
  LookUp,
} from "../../../../service-lib/src/lib/entities";
import { MappingTemplateVersion } from "../../../../service-lib/src/lib/entities/mapping-template-version.entity";
import { CLAIM_STATUS } from "../../../../service-lib/src/lib/constants";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_TOTAL_KPI_COUNT,
  DOCUMENT_ENTITY_TYPE,
  FILE_DIRECTION_INBOUND,
  UPLOAD_CLAIM_ENTITY_NAME,
  INSURER_PARTICIPANT_TYPE,
  ENTITY_NAME
} from "../../../../../../libs/service-lib/src/lib/constants";
import { brokerageAmountExpr } from "../../../../../../libs/service-lib/src/lib/constants";
import { mapSortParams } from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";

type TpaUploadBatchRecord = {
  id: number;
  createdAt: Date;
  processingCompletedAt: Date | null;
  processStatus: string;
  totalClaims: number;
  processedClaims: number;
  sourceFileId: number;
  fileKey: string | null;
  errorFileId: number | null;
  totalSuccess: number;
  totalFail: number;
  totalPendingClaims: number;
  totalSettledClaims: number;
};

type TpaUploadBatchSummary = {
  totalClaimRecords: number;
  totalSuccessRecords: number;
  totalFailedRecords: number;
  totalSettledClaimRecords: number;
  settledClaimAmount: number;
  claimAmountPendingForSettlement: number;
};
@Injectable()
export class ClaimRepository {
  constructor(
    @InjectRepository(PolicyClaim)
    private readonly claimRepo: Repository<PolicyClaim>,
    @InjectRepository(PolicyClaimSettlement)
    private readonly settlementRepo: Repository<PolicyClaimSettlement>,
    @InjectRepository(FileUpload)
    private readonly fileRepo: Repository<FileUpload>,
    @InjectRepository(PolicyEnrollmentEmployeePolicyMap)
    private readonly mapRepo: Repository<PolicyEnrollmentEmployeePolicyMap>,
    @InjectRepository(PolicyEnrollmentEmployee)
    private readonly employeeEnrollmentRepo: Repository<PolicyEnrollmentEmployee>,
    @InjectRepository(PolicyEmployeeEnrollment)
    private readonly policyEmployeeEnrollmentRepo: Repository<PolicyEmployeeEnrollment>,
    @InjectRepository(PolicyEnrollmentDependent)
    private readonly dependentRepo: Repository<PolicyEnrollmentDependent>,
    @InjectRepository(Policy)
    private readonly policyRepo: Repository<Policy>,
    @InjectRepository(DocumentProcessingFile)
    private readonly docProcessingRepo: Repository<DocumentProcessingFile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(MappingTemplateVersion)
    private readonly mappingTemplateRepo: Repository<MappingTemplateVersion>,
    @InjectRepository(MstrServicePolicyTemplateField)
    private readonly claimsTemplateRepo: Repository<MstrServicePolicyTemplateField>,
    private readonly entityService: EntityService,
  ) {}

  findFileById(fileId: number) {
    return this.fileRepo.findOne({ where: { id: fileId } });
  }

  getFileUploadByKey(fileKey: string) {
    return this.fileRepo.findOne({ where: { fileKey } });
  }

  createFileUploadRecord(data: Partial<FileUpload>) {
    const entity = this.fileRepo.create(data);
    return this.fileRepo.save(entity);
  }

  findActiveClaimsTemplateFields(claimType?: string) {
    const qb = this.claimsTemplateRepo
      .createQueryBuilder("template")
      .where("template.isActive = :isActive", { isActive: true })
      .andWhere("template.entityType = :entityType", { entityType: "claims" })
      .orderBy("template.id", "ASC");
    if (claimType) {
      qb.andWhere("LOWER(template.claimType) = LOWER(:claimType)", {
        claimType,
      });
    }
    return qb.getMany();
  }

  findEmployeePolicyMap(policyId: number, employeeTpaId: string) {
    return this.mapRepo.findOne({ where: { policyId, employeeTpaId } });
  }

  findEmployeePolicyMapByEmployeeId(policyId: number, employeeId: number) {
    return this.mapRepo.findOne({ where: { policyId, employeeId } });
  }

  findEmployeeEnrollmentByCompanyEmployeeId(
    companyEmployeeId: string,
  ): Promise<PolicyEnrollmentEmployee | null> {
    return this.employeeEnrollmentRepo.findOne({
      where: { companyEmployeeId },
      select: ["id"],
    });
  }

  findPolicyById(policyId: number) {
    return this.policyRepo.findOne({
      where: { id: policyId },
      relations: ["policyType"],
    });
  }

  findPolicyWithTpaMappings(policyId: number) {
    return this.policyRepo.findOne({
      where: { id: policyId },
      relations: ["tpaMappings"],
    });
  }

  async hasActiveClaimMappingTemplate(tpaId: number): Promise<boolean> {
    const template = await this.mappingTemplateRepo.findOne({
      where: {
        entityId: tpaId,
        entityName: UPLOAD_CLAIM_ENTITY_NAME,
        fileDirection: "INBOUND",
        isActive: true,
      },
      select: ["id"],
    });
    return Boolean(template);
  }

  async findActiveTpaMappings(tpaId: number): Promise<{ targetColumn: string }[]> {
    const template = await this.mappingTemplateRepo.findOne({
      where: {
        entityId: tpaId,
        entityName: UPLOAD_CLAIM_ENTITY_NAME,
        fileDirection: FILE_DIRECTION_INBOUND,
        isActive: true,
      },
      relations: ["columns"],
    });
    
    if (!template || !template.columns) {
      return [];
    }
    
    return template.columns.map(column => ({ 
      targetColumn: column.sourceColumnName 
    }));
  }

  findDependent(policyId: number, employeeId: number, dependentTpaId: string) {
    return this.dependentRepo.findOne({
      where: { policyId, employeeId, dependentTpaId },
    });
  }

  findClaim(
    policyId: number,
    employeeTpaId: string,
    claimInsuredId: string | null,
  ) {
    return this.claimRepo.findOne({
      where: { policyId, employeeTpaId, claimInsuredId },
    });
  }

  saveClaim(claim: Partial<PolicyClaim>) {
    return this.claimRepo.save(claim);
  }

  saveSettlement(settlement: Partial<PolicyClaimSettlement>) {
    return this.settlementRepo.save(settlement);
  }

  findDependentByTpaId(policyId: number, dependentTpaId: string) {
    return this.dependentRepo.findOne({
      where: { policyId, dependentTpaId },
    });
  }

  async decrementEnrollmentBalance(
    employeeId: number,
    policyId: number,
    amount: number,
  ) {
    if (!employeeId || !Number.isFinite(amount) || amount <= 0) {
      return;
    }
    const current = await this.policyEmployeeEnrollmentRepo.findOne({
      where: { employeeId, policyId },
      select: ["id", "balance"],
    });
    if (!current) {
      return;
    }
    const newBalance = (current.balance ?? 0) - amount;
    Object.assign(current, { balance: newBalance });
    await this.policyEmployeeEnrollmentRepo.save(current);
  }

  createDocumentProcessingRecord(record: Partial<DocumentProcessingFile>) {
    const entity = this.docProcessingRepo.create(record);
    return this.docProcessingRepo.save(entity);
  }

  updateDocumentProcessingStatus(
    id: number,
    processStatus: string,
    claimsUploadDate: Date,
    totalClaims?: number,
  ) {
    return this.docProcessingRepo.update(id, {
      processStatus,
      createdAt: claimsUploadDate,
      updatedAt: claimsUploadDate,
      expectedEmployeesCount: totalClaims,
    });
  }

  async findTpaUploadBatches(
    policyId: number | undefined,
    page: number,
    limit: number,
    tpaId?: number,
    sort?: string,
  ): Promise<{
    records: TpaUploadBatchRecord[];
    count: number;
    summary: TpaUploadBatchSummary;
  }> {
    const safePage =
      Number.isFinite(page) && page > DEFAULT_TOTAL_KPI_COUNT
        ? Math.floor(page)
        : DEFAULT_PAGE;
    const safeLimit =
      Number.isFinite(limit) && limit > DEFAULT_TOTAL_KPI_COUNT
        ? Math.floor(limit)
        : DEFAULT_LIMIT;

    const entityType = tpaId
      ? DOCUMENT_ENTITY_TYPE.CLAIM_UPLOAD_TPA_ENTITY
      : DOCUMENT_ENTITY_TYPE.CLAIM_UPLOAD_POLICY_ENTITY;
    const entityId = tpaId ?? policyId ?? DEFAULT_TOTAL_KPI_COUNT;

    const baseQuery = this.docProcessingRepo
      .createQueryBuilder("doc")
      .where("doc.entityId = :entityId", { entityId })
      .andWhere("doc.entityType = :entityType", { entityType });

    const count = await baseQuery.clone().getCount();

    const qb = baseQuery
      .clone()
      .leftJoin(FileUpload, "file", "file.id = doc.documentId")
      .leftJoin(
        PolicyEnrollmentUploadSummary,
        "summary",
        "summary.documentProcessingFileId = doc.id",
      )
      .leftJoin(
        PolicyClaim,
        "claim",
        "claim.sourceFileUploadId = doc.documentId AND claim.deletedAt IS NULL",
      )
      .select("doc.id", "id")
      .addSelect("doc.documentId", "sourceFileId")
      .addSelect("doc.createdAt", "createdAt")
      .addSelect("doc.updatedAt", "processingCompletedAt")
      .addSelect("doc.processStatus", "processStatus")
      .addSelect("file.fileKey", "fileKey")
      .addSelect("COALESCE(summary.processCount, 0)", "totalClaims")
      .addSelect("COALESCE(summary.successCount, 0)", "processedClaims")
      .addSelect("COALESCE(summary.successCount, 0)", "totalSuccess")
      .addSelect("COALESCE(summary.errorCount, 0)", "totalFail")
      .addSelect("summary.errorFileUploadId", "errorFileId")
      .addSelect(
        "COUNT(CASE WHEN LOWER(claim.claimStatus) = :pendingStatus THEN 1 END)",
        "totalPendingClaims",
      )
      .addSelect(
        "COUNT(CASE WHEN LOWER(claim.claimStatus) = :settledStatus THEN 1 END)",
        "totalSettledClaims",
      )
      .groupBy("doc.id")
      .addGroupBy("doc.createdAt")
      .addGroupBy("doc.updatedAt")
      .addGroupBy("doc.processStatus")
      .addGroupBy("file.fileKey")
      .addGroupBy("summary.processCount")
      .addGroupBy("summary.successCount")
      .addGroupBy("summary.errorCount")
      .addGroupBy("summary.errorFileUploadId");

    const sortParams = mapSortParams(
      sort,
      ENTITY_NAME.CLAIM_UPLOAD_BATCH.toUpperCase(),
    );
    const effectiveSort =
      sortParams.length > 0
        ? sortParams
        : [{ field: "doc.id", order: "DESC" as const }];
    effectiveSort.forEach(({ field, order }, idx) => {
      if (idx === 0) {
        qb.orderBy(field, order, "NULLS LAST");
      } else {
        qb.addOrderBy(field, order, "NULLS LAST");
      }
    });

    qb.skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .setParameters({
        pendingStatus: "pending",
        settledStatus: "settled",
      });

    const raw = await qb.getRawMany();
    const toNumber = (value: string | number | null | undefined): number => {
      const numeric = Number(value ?? DEFAULT_TOTAL_KPI_COUNT);
      return Number.isNaN(numeric) ? DEFAULT_TOTAL_KPI_COUNT : numeric;
    };
    const records: TpaUploadBatchRecord[] = raw.map((row) => ({
      id: Number(row.id),
      createdAt: new Date(row.createdAt),
      processingCompletedAt: row.processingCompletedAt
        ? new Date(row.processingCompletedAt)
        : null,
      processStatus: row.processStatus,
      totalClaims: toNumber(row.totalClaims),
      processedClaims: toNumber(row.processedClaims),
      sourceFileId: toNumber(row.sourceFileId),
      fileKey: row.fileKey ? String(row.fileKey) : null,
      errorFileId: row.errorFileId ? Number(row.errorFileId) : null,
      totalSuccess: toNumber(row.totalSuccess),
      totalFail: toNumber(row.totalFail),
      totalPendingClaims: toNumber(row.totalPendingClaims),
      totalSettledClaims: toNumber(row.totalSettledClaims),
    }));

    const uploadIdsQuery = baseQuery
      .clone()
      .select("doc.documentId")
      .getQuery();
    const uploadIdsParams = baseQuery.getParameters();
    const createClaimBatchQuery = () =>
      this.claimRepo
        .createQueryBuilder("claim")
        .andWhere("claim.deletedAt IS NULL")
        .andWhere(`claim.sourceFileUploadId IN (${uploadIdsQuery})`)
        .setParameters(uploadIdsParams);

    const totalSettledClaimRecordsPromise = createClaimBatchQuery()
      .andWhere("LOWER(claim.claimStatus) = LOWER(:settledStatus)")
      .setParameter("settledStatus", CLAIM_STATUS.SETTLED)
      .getCount();

    const latestSettlementSubquery = this.settlementRepo
      .createQueryBuilder("settlement")
      .select("MAX(settlement.id)", "id")
      .addSelect("settlement.claimId", "claimId")
      .groupBy("settlement.claimId");

    const settledClaimAmountPromise = createClaimBatchQuery()
      .andWhere("LOWER(claim.claimStatus) = LOWER(:settledStatus)")
      .setParameter("settledStatus", CLAIM_STATUS.SETTLED)
      .leftJoin(
        `(${latestSettlementSubquery.getQuery()})`,
        "latestSettlement",
        `"latestSettlement"."claimId" = claim.id`,
      )
      .leftJoin(
        PolicyClaimSettlement,
        "settlement",
        `"settlement"."id" = "latestSettlement"."id"`,
      )
      .setParameters(latestSettlementSubquery.getParameters())
      .select(
        "COALESCE(SUM(settlement.settlementAmount), 0)",
        "settledClaimAmount",
      )
      .getRawOne<{ settledClaimAmount: string | number | null }>();

    const claimAmountPendingForSettlementPromise = createClaimBatchQuery()
      .andWhere(
        "(claim.claimStatus IS NULL OR LOWER(claim.claimStatus) <> LOWER(:settledStatus))",
      )
      .setParameter("settledStatus", CLAIM_STATUS.SETTLED)
      .select(
        "COALESCE(SUM(claim.claimAmount), 0)",
        "claimAmountPendingForSettlement",
      )
      .getRawOne<{
        claimAmountPendingForSettlement: string | number | null;
      }>();

    const summaryTotals = await baseQuery
      .clone()
      .leftJoin(
        PolicyEnrollmentUploadSummary,
        "summary",
        "summary.documentProcessingFileId = doc.id",
      )
      .select("COALESCE(SUM(summary.processCount), 0)", "totalRecords")
      .addSelect(
        "COALESCE(SUM(summary.successCount), 0)",
        "totalSuccessRecords",
      )
      .addSelect("COALESCE(SUM(summary.errorCount), 0)", "totalFailedRecords")
      .getRawOne<{
        totalRecords: string | number | null;
        totalSuccessRecords: string | number | null;
        totalFailedRecords: string | number | null;
      }>();

    const [
      totalSettledClaimRecords,
      settledClaimAmountRaw,
      claimAmountPendingRaw,
    ] = await Promise.all([
      totalSettledClaimRecordsPromise,
      settledClaimAmountPromise,
      claimAmountPendingForSettlementPromise,
    ]);

    const summary: TpaUploadBatchSummary = {
      totalClaimRecords: toNumber(summaryTotals?.totalRecords),
      totalSuccessRecords: toNumber(summaryTotals?.totalSuccessRecords),
      totalFailedRecords: toNumber(summaryTotals?.totalFailedRecords),
      totalSettledClaimRecords,
      settledClaimAmount: toNumber(settledClaimAmountRaw?.settledClaimAmount),
      claimAmountPendingForSettlement: toNumber(
        claimAmountPendingRaw?.claimAmountPendingForSettlement,
      ),
    };
    return { records, count, summary };
  }

  findClaimsByEmployeeId(employeeId: number) {
    return this.claimRepo.find({
      where: { employeeId },
      relations: ["dependent", "settlements"],
    });
  }

  async findClaimsByPolicyId(
    policyId: number,
    page: number,
    limit: number,
    search?: string,
    sort?: string,
  ) {
    const qb = this.claimRepo
      .createQueryBuilder("claim")
      .leftJoinAndSelect("claim.employee", "employee")
      .leftJoinAndSelect("claim.policy", "policy")
      .leftJoinAndSelect("policy.company", "company")
      .leftJoinAndSelect("company.priority", "companyPriority")
      .leftJoinAndSelect("policy.policyType", "policyType")
      .leftJoin("claim.settlements", "settlements")
      .addSelect(
        `DATE_PART(
            'day',
            DATE_TRUNC(
              'day',
              COALESCE(
                MIN(settlements.settlementDate) AT TIME ZONE 'UTC',
                NOW() AT TIME ZONE 'UTC'
              )
            )
            - DATE_TRUNC(
                'day',
                COALESCE(claim.claimDate, claim.createdAt) AT TIME ZONE 'UTC'
              )
          )`,
        "tatDays",
      )
      // claim.claimDate is already part of the base entity's full-hydration
      // select (no `.select([...])` narrowing on this query) — this explicit
      // addSelect was redundant, and once TypeORM wraps the query in its
      // DISTINCT-pagination-safety subquery (triggered by the .groupBy calls
      // below), the duplicate "claim_claim_dt" alias becomes genuinely
      // ambiguous when referenced from the outer ORDER BY (Postgres 42702).
      .where("claim.policyId = :policyId", { policyId })
      .groupBy("claim.id")
      .addGroupBy("claim.claimDate")
      .addGroupBy("claim.createdAt")
      .addGroupBy("employee.id")
      .addGroupBy("policy.id")
      .addGroupBy("company.id")
      .addGroupBy("companyPriority.id")
      .addGroupBy("policyType.id")
      .skip((page - 1) * limit)
      .take(limit);

    const sortParams = mapSortParams(sort, ENTITY_NAME.CLAIM.toUpperCase());
    const effectiveSort =
      sortParams.length > 0
        ? sortParams
        : [{ field: "claim.createdAt", order: "DESC" as const }];
    effectiveSort.forEach(({ field, order }, idx) => {
      if (idx === 0) {
        qb.orderBy(field, order, "NULLS LAST");
      } else {
        qb.addOrderBy(field, order, "NULLS LAST");
      }
    });

    if (search) {
      qb.andWhere(
        "company.companyName ILIKE :search OR claim.claimInsuredId ILIKE :search",
        { search: `%${search}%` },
      );
    }

    const countQb = qb.clone().skip(undefined).take(undefined).orderBy();
    const count = await countQb.getCount();
    const { raw, entities } = await qb.getRawAndEntities();
    const enriched = entities.map((e, idx) => ({
      ...e,
      tatDays: raw[idx].tatDays,
    }));
    return [enriched, count] as [PolicyClaim[], number];
  }

  async findAllClaims(
    page: number,
    limit: number,
    userIds: number[],
    searchParams: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    search?: string,
    tatRanges?: { from?: number; to?: number }[],
    dateField?: string,
    fromDate?: Date,
    toDate?: Date,
    openTatOnly?: boolean,
    insurerId?: number,
    sort?: string,
  ): Promise<[PolicyClaim[], number]> {
    try {
      const qb = this.claimRepo
        .createQueryBuilder("claim")
        .leftJoinAndSelect("claim.employee", "employee")
        .leftJoinAndSelect("claim.policy", "policy")
        .leftJoinAndSelect("policy.company", "company")
        .leftJoin("company.owner", "owner")
        .leftJoinAndSelect("company.priority", "companyPriority")
        .leftJoinAndSelect("policy.policyType", "policyType")
        .leftJoin("claim.settlements", "settlements")
        .addSelect(
          `DATE_PART(
            'day',
            DATE_TRUNC(
              'day',
              COALESCE(
                MIN(settlements.settlementDate) AT TIME ZONE 'UTC',
                NOW() AT TIME ZONE 'UTC'
              )
            )
            - DATE_TRUNC('day', COALESCE(claim.claimDate, claim.createdAt) AT TIME ZONE 'UTC')
          )`,
          "tatDays",
        )
        // Bare alias (no dot) so raw .orderBy()/.addOrderBy() can reference
        // it directly — a dotted expression like "COALESCE(claim.x, ...)"
        // fails TypeORM's alias-prefix check (it tries to resolve the text
        // before the first dot as a join alias) before the query ever runs.
        .addSelect(
          "COALESCE(claim.claimInsuredId, claim.claimNumber, CAST(claim.id AS VARCHAR))",
          "claimnumbersort",
        )
        // .addSelect("claim.createdAt") // added
        .groupBy("claim.id")
        .addGroupBy("claim.claimDate")
        .addGroupBy("employee.id")
        .addGroupBy("policy.id")
        .addGroupBy("company.id")
        .addGroupBy("companyPriority.id")
        .addGroupBy("policyType.id")
        .skip((page - 1) * limit)
        .take(limit);

      // mapSortParams whitelists against ENTITY_SORT_FIELDS.CLAIM, so every
      // field reaching addOrderBy() here is one of our own static column
      // paths, never a raw client string. Falls back to the previous
      // hardcoded order when no (valid) sort was requested.
      const sortParams = mapSortParams(sort, ENTITY_NAME.CLAIM.toUpperCase());
      const effectiveSort =
        sortParams.length > 0
          ? sortParams
          : [{ field: "claim.createdAt", order: "DESC" as const }];
      effectiveSort.forEach(({ field, order }, idx) => {
        if (idx === 0) {
          qb.orderBy(field, order, "NULLS LAST");
        } else {
          qb.addOrderBy(field, order, "NULLS LAST");
        }
      });

      qb.where("claim.deletedAt IS NULL");
      qb.andWhere("COALESCE(claim.claimDate, claim.createdAt) IS NOT NULL");
      if (Array.isArray(userIds) && userIds.length > 0) {
        qb.andWhere("owner.userId IN (:...userIds)", { userIds });
      }

      searchParams.forEach((param, idx) => {
        const value = Array.isArray(param.searchValue)
          ? param.searchValue
          : [param.searchValue];
        qb.andWhere(`${param.searchBy} IN (:...sp${idx})`, {
          [`sp${idx}`]: value,
        });
      });

      if (search) {
        qb.andWhere(
          "company.companyName ILIKE :search OR claim.claimInsuredId ILIKE :search OR policy.insurerPolicyNumber ILIKE :search",
          { search: `%${search}%` },
        );
      }

      const tatFilters =
        tatRanges?.filter((range) =>
          [range.from, range.to].some((value) => value !== undefined),
        ) ?? [];

      if (openTatOnly || tatFilters.length > 0) {
        qb.having("MIN(settlements.settlementDate) IS NULL");
      }

      if (tatFilters.length > 0) {
        const tatExpr = `GREATEST(
          0,
          DATE_PART(
            'day',
            DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC')
            - DATE_TRUNC('day', claim.claimDate AT TIME ZONE 'UTC')
          )
        )`;
        const conditions: string[] = [];
        const params: Record<string, number> = {};
        tatFilters.forEach((r, idx) => {
          if (r.from !== undefined && r.to !== undefined) {
            conditions.push(
              `${tatExpr} BETWEEN :tatFrom${idx} AND :tatTo${idx}`,
            );
            params[`tatFrom${idx}`] = r.from;
            params[`tatTo${idx}`] = r.to;
          } else if (r.from !== undefined) {
            conditions.push(`${tatExpr} >= :tatFrom${idx}`);
            params[`tatFrom${idx}`] = r.from;
          } else if (r.to !== undefined) {
            conditions.push(`${tatExpr} <= :tatTo${idx}`);
            params[`tatTo${idx}`] = r.to;
          }
        });
        if (conditions.length > 0) {
          qb.andHaving(conditions.join(" OR "), params);
        }
      }

      if (dateField && fromDate && toDate) {
        qb.andWhere(`${dateField} BETWEEN :fromDate AND :toDate`, {
          fromDate,
          toDate,
        });
      }

      // Apply insurer filter - claims link to policies via policy_id,
      // and policies link to insurers via policy_insurer_map
      if (insurerId) {
        qb.andWhere(
          `claim.policyId IN (
            SELECT pim_claim.policy_id
            FROM policy_insurer_map pim_claim
            WHERE pim_claim.insurer_id = :claimInsurerId
          )`,
          { claimInsurerId: insurerId }
        );
      }

      const countQb = qb
        .clone()
        .select("claim.id")
        .addSelect("claim.claimDate")
        .skip(undefined)
        .take(undefined)
        .orderBy();
      const count = (await countQb.getRawMany()).length;
      const { raw, entities } = await qb.getRawAndEntities();
      const enriched = entities.map((e, idx) => ({
        ...e,
        tatDays: raw[idx].tatDays,
      }));

      const policyIds = [
        ...new Set(
          enriched
            .map((e) => e.policyId ?? (e as any).policy?.id)
            .filter((id): id is number => typeof id === "number"),
        ),
      ];

      const [policiesWithDetails, leadInsurerLookup] = await Promise.all([
        policyIds.length > 0
          ? this.policyRepo.find({
              where: { id: In(policyIds) },
              relations: [
                "owner",
                "owner.branch",
                "insurerMappings",
                "insurerMappings.insurer",
                "tpaMappings",
                "tpaMappings.tpa",
              ],
            })
          : Promise.resolve([]),
        this.policyRepo.manager.findOne(LookUp, {
          where: {
            lookUpKey:
              INSURER_PARTICIPANT_TYPE.INSURER_PARTICIPATION_TYPE_LEAD,
          },
        }),
      ]);

      const policyDetailMap = new Map(
        policiesWithDetails.map((p) => [p.id, p]),
      );

      const result = enriched.map((e) => {
        const resolvedPolicyId = e.policyId ?? (e as any).policy?.id;
        const policyDetail = policyDetailMap.get(resolvedPolicyId);
        const insurerMappings = (policyDetail as any)?.insurerMappings ?? [];

        const leadInsurer = insurerMappings.find(
          (m: PolicyInsurerMap) =>
            leadInsurerLookup &&
            m.insurerParticipationTypeLid === leadInsurerLookup.id,
        );
        const coInsurerMappings = insurerMappings.filter(
          (m: PolicyInsurerMap) =>
            leadInsurerLookup &&
            m.insurerParticipationTypeLid !== leadInsurerLookup.id,
        );

        const tpaMappings = (policyDetail as any)?.tpaMappings ?? [];
        const tpaName =
          tpaMappings
            .map((m: any) => m.tpa?.displayName)
            .filter(Boolean)
            .join(", ") || null;

        return {
          ...e,
          policyId: resolvedPolicyId ?? null,
          branchId: (policyDetail as any)?.owner?.branchId ?? null,
          branchName: (policyDetail as any)?.owner?.branch?.name ?? null,
          insurer: (leadInsurer as any)?.insurer?.displayName ?? null,
          coInsurers:
            coInsurerMappings
              .map((m: PolicyInsurerMap) => (m as any).insurer?.displayName)
              .filter(Boolean)
              .join(", ") || null,
          tpaName: tpaName,
        };
      });

      return [result as unknown as PolicyClaim[], count];
    } catch (error) {
      throw error;
    }
  }

  async getEntityTableMapIds(
    entity: string,
    select: string,
    whereCondition: any,
  ): Promise<any[]> {
    try {
      return await this.entityService.getEntityMapByIds(
        entity,
        select,
        whereCondition,
      );
    } catch (error) {
      return [];
    }
  }

  async getLookupValues(
    ids: number[],
  ): Promise<{ id: number; lookUpValue: string }[]> {
    try {
      return await this.entityService.getLookupValues(ids);
    } catch (error) {
      return [];
    }
  }

  async findPoliciesByCompanyId(
    companyId: number,
    insurerId?: number,
  ): Promise<
    {
      policyId: number;
      policyNumber: string | null;
      policyType: string | null;
      policyPremium: number | null;
      hasCautionDeposit: boolean;
    }[]
  > {
    const qb = this.policyRepo
      .createQueryBuilder("policy")
      .leftJoin("policy.policyType", "policyType")
      .leftJoin(
        "caution_deposit_policy_mapping",
        "cdpm",
        "cdpm.policy_id = policy.id",
      )
      .select([
        'policy.id AS "policyId"',
        'policy.insurerPolicyNumber AS "policyNumber"',
        'policyType.lookUpValue AS "policyType"',
        'policy.grossPremium AS "policyPremium"',
        'COUNT(cdpm.id) AS "cautionDepositCount"',
      ])
      .where("policy.companyId = :companyId", { companyId });

    if (insurerId) {
      qb.innerJoin(
        "policy.insurerMappings",
        "insurerMappings",
        "insurerMappings.insurerId = :insurerId",
        { insurerId },
      );
    }

    const rows = await qb
      .groupBy("policy.id")
      .addGroupBy("policy.insurerPolicyNumber")
      .addGroupBy("policy.grossPremium")
      .addGroupBy("policyType.id")
      .addGroupBy("policyType.lookUpValue")
      .orderBy("policy.insurerPolicyNumber", "ASC")
      .getRawMany();

    return rows.map((row: any) => ({
      policyId: Number(row.policyId),
      policyNumber: row.policyNumber ?? null,
      policyType: row.policyType ?? null,
      policyPremium:
        row.policyPremium !== null && row.policyPremium !== undefined
          ? Number(row.policyPremium)
          : null,
      hasCautionDeposit: Number(row.cautionDepositCount) > 0,
    }));
  }

  async findUniquePolicyTypes(userIds: number[]): Promise<string[]> {
    const rows = await this.claimRepo
      .createQueryBuilder("claim")
      .leftJoin("claim.policy", "policy")
      .leftJoin("policy.policyType", "policyType")
      .leftJoin("policy.company", "company")
      .leftJoin("company.owner", "owner")
      .select("DISTINCT policyType.lookUpValue", "policyType")
      .where("owner.userId IN (:...userIds)", { userIds })
      .getRawMany();
    return rows.map((r: any) => r.policyType).filter(Boolean);
  }
  
  async findUserDetails(
    userId: number,
    organisationId?: number,
    sbuId?: number,
    verticalId?: number,
    departmentId?: number,
    branchId?: number,
  ): Promise<User | null> {
    return this.userRepo.findOne({
      where: {
        userId,
        organisationId: organisationId ?? undefined,
        sbuId: sbuId ?? undefined,
        verticalId: verticalId ?? undefined,
        departmentId: departmentId ?? undefined,
        branchId: branchId ?? undefined,
      },
    });
  }

  async getBusinessOverviewForUsers(
    userIds: any[],
    range?: { start?: Date | null; end?: Date | null },
    organisationId?: any[],
    sbuId?: any,
    verticalId?: any,
    departmentId?: any,
    branchId?: any,
    isLeadership?: any,
  ): Promise<{
    totalCompanies: number;
    totalPolicies: number;
    totalPremiumCollected: number;
    totalBrokerageCollected: number;
  }> {
    const safeUserIds = Array.isArray(userIds)
      ? userIds
      : userIds !== undefined && userIds !== null
      ? [userIds]
      : [];

    const toArray = (value: any): any[] => {
      if (Array.isArray(value)) {
        return value.filter((item) => item !== undefined && item !== null);
      }

      return value !== undefined && value !== null ? [value] : [];
    };

    const organisationIds = toArray(organisationId);
    const sbuIds = toArray(sbuId);
    const verticalIds = toArray(verticalId);
    const departmentIds = toArray(departmentId);
    const branchIds = toArray(branchId);

    const shouldApplyLeadershipFilters =
      isLeadership === true &&
      [
        organisationIds.length,
        sbuIds.length,
        verticalIds.length,
        departmentIds.length,
        branchIds.length,
      ].some((length) => length > 0);

    if (!isLeadership && !safeUserIds.length) {
      return {
        totalCompanies: 0,
        totalPolicies: 0,
        totalPremiumCollected: 0,
        totalBrokerageCollected: 0,
      };
    }

    const policyQuery = this.policyRepo
      .createQueryBuilder("policy")
      .select([
        'COUNT(DISTINCT policy.companyId) AS "totalCompanies"',
        'COUNT(policy.id) AS "totalPolicies"',
        `COALESCE(SUM(${brokerageAmountExpr("policy")}), 0) AS "policyBrokerage"`,
        'COALESCE(SUM(policy.premiumCollected), 0) AS "policyPremiumCollected"',
      ]);

    if (isLeadership === false) {
      policyQuery.andWhere("policy.ownerId IN (:...userIds)", {
        userIds: safeUserIds,
      });
    } else if (shouldApplyLeadershipFilters) {
      if (organisationIds.length) {
        policyQuery.andWhere(
          "policy.organisationId IN (:...organisationIds)",
          { organisationIds },
        );
      }

      if (sbuIds.length) {
        policyQuery.andWhere("policy.sbuId IN (:...sbuIds)", { sbuIds });
      }

      if (verticalIds.length) {
        policyQuery.andWhere("policy.verticalId IN (:...verticalIds)", {
          verticalIds,
        });
      }

      if (departmentIds.length) {
        policyQuery.andWhere(
          "policy.departmentId IN (:...departmentIds)",
          { departmentIds },
        );
      }

      if (branchIds.length) {
        policyQuery.andWhere("policy.branchId IN (:...branchIds)", {
          branchIds,
        });
      }
    }

    if (range?.start) {
      policyQuery.andWhere("policy.dateOfIncome >= :startDate", {
        startDate: range.start,
      });
    }

    if (range?.end) {
      policyQuery.andWhere("policy.dateOfIncome <= :endDate", {
        endDate: range.end,
      });
    }

    const endorsementQuery = this.policyRepo
      .createQueryBuilder("policy")
      .innerJoin("policy.endorsements", "endorsement")
      .select([
        `COALESCE(SUM(${brokerageAmountExpr("endorsement", { terrorismAmountColumn: "commissionTerrorismAmount" })}), 0) AS "endorsementBrokerage"`,
      ]);

    if (isLeadership === false) {
      endorsementQuery.andWhere("policy.ownerId IN (:...userIds)", {
        userIds: safeUserIds,
      });
    } else if (shouldApplyLeadershipFilters) {
      endorsementQuery.innerJoin(
        User,
        "endorsementPolicyOwner",
        "endorsementPolicyOwner.userId = policy.ownerId",
      );

      if (organisationIds.length) {
        endorsementQuery.andWhere(
          "endorsementPolicyOwner.organisationId IN (:...organisationIds)",
          { organisationIds },
        );
      }

      if (sbuIds.length) {
        endorsementQuery.andWhere(
          "endorsementPolicyOwner.sbuId IN (:...sbuIds)",
          { sbuIds },
        );
      }

      if (verticalIds.length) {
        endorsementQuery.andWhere(
          "endorsementPolicyOwner.verticalId IN (:...verticalIds)",
          { verticalIds },
        );
      }

      if (departmentIds.length) {
        endorsementQuery.andWhere(
          "endorsementPolicyOwner.departmentId IN (:...departmentIds)",
          { departmentIds },
        );
      }

      if (branchIds.length) {
        endorsementQuery.andWhere(
          "endorsementPolicyOwner.branchId IN (:...branchIds)",
          { branchIds },
        );
      }
    }

    if (range?.start) {
      endorsementQuery.andWhere("endorsement.dateOfIncome >= :startDate", {
        startDate: range.start,
      });
    }

    if (range?.end) {
      endorsementQuery.andWhere("endorsement.dateOfIncome <= :endDate", {
        endDate: range.end,
      });
    }

    const [policyOverview, endorsementOverview] = await Promise.all([
      policyQuery.getRawOne(),
      endorsementQuery.getRawOne(),
    ]);

    const totalBrokerageCollected =
      parseFloat(policyOverview?.policyBrokerage || "0") +
      parseFloat(endorsementOverview?.endorsementBrokerage || "0");

    const totalPremiumCollected = parseFloat(
      policyOverview?.policyPremiumCollected || "0",
    );

    return {
      totalCompanies: policyOverview?.totalCompanies
        ? parseInt(policyOverview.totalCompanies, 10)
        : 0,
      totalPolicies: policyOverview?.totalPolicies
        ? parseInt(policyOverview.totalPolicies, 10)
        : 0,
      totalPremiumCollected,
      totalBrokerageCollected,
    };
  }
  async getClaimsOverviewForUsers(
    userIds: any[],
    range?: { start?: Date | null; end?: Date | null },
    organisationId?: any[],
    sbuId?: any,
    verticalId?: any,
    departmentId?: any,
    branchId?: any,
    isLeadership?: any,
  ): Promise<{
    totalClaimsCount: number;
    totalClaimAmount: number;
    policiesWithClaimsCount: number;
    companiesWithClaimsCount: number;
  }> {
    const safeUserIds = Array.isArray(userIds)
      ? userIds
      : userIds !== undefined && userIds !== null
      ? [userIds]
      : [];

    const toArray = (value: any): any[] => {
      if (Array.isArray(value)) {
        return value.filter((item) => item !== undefined && item !== null);
      }

      return value !== undefined && value !== null ? [value] : [];
    };

    const organisationIds = toArray(organisationId);
    const sbuIds = toArray(sbuId);
    const verticalIds = toArray(verticalId);
    const departmentIds = toArray(departmentId);
    const branchIds = toArray(branchId);

    const shouldApplyLeadershipFilters =
      isLeadership === true &&
      [
        organisationIds.length,
        sbuIds.length,
        verticalIds.length,
        departmentIds.length,
        branchIds.length,
      ].some((length) => length > 0);

    if (!isLeadership && !safeUserIds.length) {
      return {
        totalClaimsCount: 0,
        totalClaimAmount: 0,
        policiesWithClaimsCount: 0,
        companiesWithClaimsCount: 0,
      };
    }

    const overviewQuery = this.claimRepo
      .createQueryBuilder("policy_claim")
      .innerJoin("policy_claim.policy", "policy")
      .select("COUNT(policy_claim.id)", "totalClaimsCount")
      .addSelect(
        "COALESCE(SUM(policy_claim.claimAmount), 0)",
        "totalClaimAmount",
      )
      .addSelect(
        "COUNT(DISTINCT policy_claim.policyId)",
        "policiesWithClaimsCount",
      )
      .addSelect(
        "COUNT(DISTINCT policy.companyId)",
        "companiesWithClaimsCount",
      );

    if (isLeadership === false) {
      overviewQuery.andWhere("policy.created_by IN (:...userIds)", {
        userIds: safeUserIds,
      });
    } else if (shouldApplyLeadershipFilters) {
      overviewQuery.innerJoin(
        User,
        "policyCreator",
        "policyCreator.userId = policy.created_by",
      );

      if (organisationIds.length) {
        overviewQuery.andWhere(
          "policyCreator.organisationId IN (:...organisationIds)",
          { organisationIds },
        );
      }

      if (sbuIds.length) {
        overviewQuery.andWhere("policyCreator.sbuId IN (:...sbuIds)", {
          sbuIds,
        });
      }

      if (verticalIds.length) {
        overviewQuery.andWhere(
          "policyCreator.verticalId IN (:...verticalIds)",
          { verticalIds },
        );
      }

      if (departmentIds.length) {
        overviewQuery.andWhere(
          "policyCreator.departmentId IN (:...departmentIds)",
          { departmentIds },
        );
      }

      if (branchIds.length) {
        overviewQuery.andWhere("policyCreator.branchId IN (:...branchIds)", {
          branchIds,
        });
      }
    }

    if (range?.start) {
      overviewQuery.andWhere("policy_claim.createdAt >= :claimStartDate", {
        claimStartDate: range.start,
      });
    }

    if (range?.end) {
      overviewQuery.andWhere("policy_claim.createdAt <= :claimEndDate", {
        claimEndDate: range.end,
      });
    }

    const overview = await overviewQuery.getRawOne();

    return {
      totalClaimsCount: overview?.totalClaimsCount
        ? parseInt(overview.totalClaimsCount, 10)
        : 0,
      totalClaimAmount: overview?.totalClaimAmount
        ? parseFloat(overview.totalClaimAmount)
        : 0,
      policiesWithClaimsCount: overview?.policiesWithClaimsCount
        ? parseInt(overview.policiesWithClaimsCount, 10)
        : 0,
      companiesWithClaimsCount: overview?.companiesWithClaimsCount
        ? parseInt(overview.companiesWithClaimsCount, 10)
        : 0,
    };
  }
}
