import { In, Repository } from "typeorm";
import {
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import {
  CLAIM_STATUS_FILTER,
  EMPLOYEE_INSURED_EMPTY_RESULT,
  EMPLOYEE_INSURED_QUERY_CONSTANTS,
  POLICY_EMPLOYEE_INSURED_DB_FIELD_MAP,
  RELATIONSHIP_GROUP,
  DEFAULT_ACTIVE_STATUS,
  DEFAULT_INACTIVE_STATUS,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  Policy,
  PolicyEnrollmentEmployee,
  PolicyEnrollmentEmployeePolicyMap,
  PolicyEmployeeEnrollment,
  PolicyEnrollmentDependent,
  Endorsement,
  DocumentProcessingFile,
  EmployeeEnrollmentSubmission,
} from "../entities";
import { buildLogMessage } from "./logger.util";
import { TraceIdService } from "../trace-id.service";

const formatDate = (date?: string | Date | null): string | null => {
  if (!date) return null;
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }
  return parsedDate.toISOString().split("T")[0];
};

// Helper functions for new field calculations
const calculateAdditionProrataDays = (
  effectiveFromDate?: Date | string | null,
  policyEndDate?: Date | string | null
): number | null => {
  if (!effectiveFromDate || !policyEndDate) return null;

  const from = new Date(effectiveFromDate);
  const end = new Date(policyEndDate);

  if (isNaN(from.getTime()) || isNaN(end.getTime())) return null;

  const diffTime = Math.abs(end.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24) + 1);

  return diffDays;
};

const calculateDeletionProrataDays = (
  deletedAt?: Date | string | null,
  policyEndDate?: Date | string | null
): number => {
  if (!deletedAt || !policyEndDate) return 0;

  const deleted = new Date(deletedAt);
  const end = new Date(policyEndDate);

  if (isNaN(deleted.getTime()) || isNaN(end.getTime())) return 0;

  const diffTime = Math.max(0, end.getTime() - deleted.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24) + 1);

  return diffDays;
};

const calculatePolicyActiveDays = (
  policyFrom?: Date | string | null,
  policyTo?: Date | string | null
): number | null => {
  if (!policyFrom || !policyTo) return null;

  const from = new Date(policyFrom);
  const to = new Date(policyTo);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) return null;

  const diffTime = Math.abs(to.getTime() - from.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24) + 1);

  return diffDays;
};

const calculateProrataPremium = (
  prorataDays: number | null,
  basicPremium: number | null,
  policyActiveDays: number | null
): number | null => {
  if (
    prorataDays === null ||
    basicPremium === null ||
    policyActiveDays === null ||
    policyActiveDays === 0
  ) {
    return null;
  }

  const premium = prorataDays * (basicPremium / policyActiveDays);
  return Math.round(premium * 100) / 100;
};

const calculateStatus = (effectiveFrom?: Date | string | null, effectiveTo?: Date | string | null): string => {
  const now = new Date();
  
  if (!effectiveFrom) return DEFAULT_INACTIVE_STATUS;
  
  const fromDate = new Date(effectiveFrom);
  const toDate = effectiveTo ? new Date(effectiveTo) : null;
  
  if (isNaN(fromDate.getTime())) return DEFAULT_INACTIVE_STATUS;
  
  // Check if current date is within the effective range
  if (fromDate > now) return DEFAULT_INACTIVE_STATUS; // Not started yet
  if (toDate && toDate < now) return DEFAULT_INACTIVE_STATUS; // Already ended
  
  return DEFAULT_ACTIVE_STATUS;
};

const enrollmentStatusLabel = (key?: string | null): string => {
  if (!key) return "Not Started";
  return key
    .replace("EMPLOYEE_ENROLLMENT_STATUS_", "")
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

const normalizeSearchToken = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
};

const toDateOnlyString = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().split("T")[0];
};

const EMPLOYEE_INSURED_SORT_FIELDS = new Set([
  "insurerEndorsementNumber",
  "insurerEndorsementDate",
  "employeeId",
  "insuredName",
  "status",
  "sumInsuredTotal",
  "relation",
  "endorsementId",
]);

interface EmployeeInsuredQueryParams {
  policyId: number;
  page: number;
  limit: number;
  skipPagination?: boolean;
  relationshipGroup?: string;
  claimStatus?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  searchBy?: string;
  employeeId?: string;
  iirmPolicyId?: string;
  insurerEndorsementNumber?: string;
  insurerEndorsementDate?: string;
  tpaId?: string;
  status?: string;
  endorsementId?: number;
  sort?: { field: string; order: "ASC" | "DESC" }[];
}

interface EmployeeInsuredRepositories {
  policyRepository: Repository<Policy>;
  employeePolicyMapRepo: Repository<PolicyEnrollmentEmployeePolicyMap>;
  employeeRepo: Repository<PolicyEnrollmentEmployee>;
  dependentRepo: Repository<PolicyEnrollmentDependent>;
  employeeEnrollmentRepo: Repository<PolicyEmployeeEnrollment>;
  endorsementRepo: Repository<Endorsement>;
}

interface EmployeeInsuredLogContext {
  logger: any;
  traceIdService: TraceIdService;
  location: string;
  method: string;
}

export async function getPolicyEmployeeInsuredDetailsFromRepository({
  policyId,
  page,
  limit,
  skipPagination,
  relationshipGroup,
  claimStatus,
  effectiveFrom,
  effectiveTo,
  searchBy,
  employeeId,
  iirmPolicyId,
  insurerEndorsementNumber,
  insurerEndorsementDate,
  tpaId,
  endorsementId,
  status,
  sort,
  policyRepository,
  employeePolicyMapRepo,
  employeeRepo,
  dependentRepo,
  employeeEnrollmentRepo,
  endorsementRepo,
  logger,
  traceIdService,
  location,
  method,
  employeeEndorsementMap,
}: EmployeeInsuredQueryParams &
  EmployeeInsuredRepositories &
  EmployeeInsuredLogContext & {
    employeeEndorsementMap?: Map<number, number>;
  }): Promise<{ data: any[]; count: number }> {
  try {
    const {
      POLICY_RELATIONS,
      ENDORSEMENT_ORDER,
      DEFAULT_SORT_FIELDS,
      ORDER_ASC,
      EMPLOYEE_MAP_ALIAS,
      EMPLOYEE_ALIAS,
      DEPENDENT_ALIAS,
      MAP_POLICY_WHERE,
      DEPENDENT_DEFAULT_ORDER_FIELD,
      SEARCH_BY_LIKE,
      EMPLOYEE_ID_IN,
      EMPLOYEE_COMPANY_ID_LIKE,
    } = EMPLOYEE_INSURED_QUERY_CONSTANTS;
    const RELATIONSHIP_SELF = RELATIONSHIP_GROUP.SELF;
    const RELATIONSHIP_DEPENDENT = RELATIONSHIP_GROUP.DEPENDENT;
    const CLAIM_STATUS_NO = CLAIM_STATUS_FILTER.NO;
    const CLAIM_STATUS_NONE = CLAIM_STATUS_FILTER.NONE;
    const CLAIM_STATUS_YES = CLAIM_STATUS_FILTER.YES;
    const CLAIM_STATUS_ACTIVE = CLAIM_STATUS_FILTER.ACTIVE;

    const policy = await policyRepository.manager.findOne(Policy, {
      where: { id: policyId },
      relations: [...POLICY_RELATIONS],
    });

    if (!policy) {
      throw new NotFoundException(
        `Policy Basic Details not found for ID: ${policyId}`
      );
    }

    // Fetch endorsement data for enhanced fields
    const endorsements = await endorsementRepo.find({
      where: { policyId },
      order: ENDORSEMENT_ORDER,
    });
    
    // Create endorsement map for quick lookup
    const endorsementMap = new Map(
      endorsements.map(endorsement => [endorsement.id, endorsement])
    );


    const employeeMapQuery = employeePolicyMapRepo
      .createQueryBuilder(EMPLOYEE_MAP_ALIAS)
       .withDeleted()
      .where(MAP_POLICY_WHERE, { policyId });
    const employeeMaps = await employeeMapQuery.getMany();
    const mappedEmployeeIds = employeeMaps.map((map) => map.employeeId);

    if (mappedEmployeeIds.length === 0) {
      return EMPLOYEE_INSURED_EMPTY_RESULT;
    }

    const employeeIdFilter =
      employeeId === null || employeeId === undefined
        ? ""
        : String(employeeId).replace(/^\[|\]$/g, "").trim();
    const normalizedEmployeeIdFilter = normalizeSearchToken(employeeIdFilter);

    let targetEmployeeIds = mappedEmployeeIds;
    if (employeeIdFilter) {
      const filterValue = `%${normalizedEmployeeIdFilter}%`;
      const matchingEmployees = await employeeRepo
        .createQueryBuilder(EMPLOYEE_ALIAS)
         .withDeleted()
        .where(EMPLOYEE_ID_IN, {
          employeeIds: mappedEmployeeIds,
        })
        .andWhere(
          "LOWER(REGEXP_REPLACE(employee.companyEmployeeId, '[^a-zA-Z0-9]', '', 'g')) LIKE LOWER(:companyEmployeeId)",
          {
            companyEmployeeId: filterValue,
          }
        )
        .getMany();
      targetEmployeeIds = matchingEmployees.map((employee) => employee.id);
      if (targetEmployeeIds.length === 0) {
        return EMPLOYEE_INSURED_EMPTY_RESULT;
      }
    }

    const includeEmployees =
      !relationshipGroup ||
      relationshipGroup.toLowerCase() === RELATIONSHIP_SELF;
    const includeDependents =
      !relationshipGroup ||
      relationshipGroup.toLowerCase() !== RELATIONSHIP_SELF;

    const sanitizedSort =
      sort?.filter(({ field }) => EMPLOYEE_INSURED_SORT_FIELDS.has(field)) ?? [];

    let dependents: PolicyEnrollmentDependent[] = [];
    if (includeDependents) {
      const queryBuilder = dependentRepo
        .createQueryBuilder(DEPENDENT_ALIAS)
        .withDeleted()
        .where("dependent.policyId = :policyId", { policyId })
        .andWhere("dependent.employeeId IN (:...employeeIds)", {
          employeeIds: targetEmployeeIds,
        });

      const dependentSort = sanitizedSort.filter(
        ({ field }) =>
          Boolean(
            POLICY_EMPLOYEE_INSURED_DB_FIELD_MAP[
              field as keyof typeof POLICY_EMPLOYEE_INSURED_DB_FIELD_MAP
            ]
          )
      );

      if (dependentSort.length > 0) {
        dependentSort.forEach((sortItem, index) => {
          const { field, order } = sortItem;
          const dbField =
            POLICY_EMPLOYEE_INSURED_DB_FIELD_MAP[
              field as keyof typeof POLICY_EMPLOYEE_INSURED_DB_FIELD_MAP
            ];

          if (!index) {
            queryBuilder.orderBy(dbField, order);
          } else {
            queryBuilder.addOrderBy(dbField, order);
          }
        });
      } else {
        queryBuilder.orderBy(DEPENDENT_DEFAULT_ORDER_FIELD, ORDER_ASC);
      }

      if (searchBy) {
        queryBuilder.andWhere(SEARCH_BY_LIKE, {
          searchBy: `%${searchBy}%`,
        });
      }

      if (relationshipGroup) {
        if (relationshipGroup.toLowerCase() === RELATIONSHIP_DEPENDENT) {
          queryBuilder.andWhere(
            "NOT ((dependent.relationshipType IS NOT NULL AND LOWER(dependent.relationshipType) = :selfRelation) OR (dependent.relation IS NOT NULL AND LOWER(dependent.relation) = :selfRelation))",
            { selfRelation: RELATIONSHIP_SELF }
          );
        } else if (
          relationshipGroup.toLowerCase() !== RELATIONSHIP_SELF
        ) {
          queryBuilder.andWhere(
            "(dependent.relationshipType = :relationshipGroup OR dependent.relation = :relationshipGroup)",
            { relationshipGroup }
          );
        }
      } else {
        queryBuilder.andWhere(
          "NOT ((dependent.relationshipType IS NOT NULL AND LOWER(dependent.relationshipType) = :selfRelation) OR (dependent.relation IS NOT NULL AND LOWER(dependent.relation) = :selfRelation))",
          { selfRelation: RELATIONSHIP_SELF }
        );
      }

      if (claimStatus) {
        if (
          claimStatus.toLowerCase() === CLAIM_STATUS_NO ||
          claimStatus.toLowerCase() === CLAIM_STATUS_NONE
        ) {
          queryBuilder.andWhere(
            `(dependent.claimStatus IS NOT NULL AND dependent.claimStatus != '' AND (LOWER(dependent.claimStatus) = '${CLAIM_STATUS_NO}' OR LOWER(dependent.claimStatus) = '${CLAIM_STATUS_NONE}'))`
          );
        } else if (
          claimStatus.toLowerCase() === CLAIM_STATUS_YES ||
          claimStatus.toLowerCase() === CLAIM_STATUS_ACTIVE
        ) {
          queryBuilder.andWhere(
            `(dependent.claimStatus IS NOT NULL AND dependent.claimStatus != '' AND LOWER(dependent.claimStatus) != '${CLAIM_STATUS_NO}' AND LOWER(dependent.claimStatus) != '${CLAIM_STATUS_NONE}')`
          );
        } else {
          queryBuilder.andWhere(
            "dependent.claimStatus IS NOT NULL AND dependent.claimStatus = :claimStatus",
            { claimStatus }
          );
        }
      }

      if (effectiveFrom) {
        queryBuilder.andWhere(
          "DATE(dependent.effectiveDate) = DATE(:effectiveFrom)",
          { effectiveFrom }
        );
      }

      if (endorsementId) {
        queryBuilder.andWhere(
          "dependent.additionEndorsementId = :endorsementId",
          { endorsementId }
        );
      }

      const effectiveToDate = effectiveTo || policy.policyTo;
      if (effectiveToDate) {
        queryBuilder.andWhere(
          "DATE(COALESCE(dependent.endorsementDeletionCreatedAt, :policyToDate)) <= DATE(:effectiveToDate)",
          { effectiveToDate, policyToDate: policy.policyTo }
        );
      }

      dependents = await queryBuilder.getMany();
    }

    const employeeIds = targetEmployeeIds;
    const enrollments =
      employeeIds.length > 0
        ? await employeeEnrollmentRepo.find({
            where: {
              policyId: policyId,
              employeeId: In(employeeIds),
            },
            select: [
              "employeeId",
              "sumInsured",
              "balance",
              "totalPremium",
              "deletedAt",
              "employeeEnrollmentStatusKey",
            ],
            withDeleted: true,
          })
        : [];

    const enrollmentMap = new Map(
      enrollments.map((enrollment) => [
        enrollment.employeeId,
        {
          sumInsured: enrollment.sumInsured,
          balance: enrollment.balance,
          totalPremium: enrollment.totalPremium,
          deletedAt: enrollment.deletedAt ?? null,
          enrollmentStatusKey: enrollment.employeeEnrollmentStatusKey ?? null,
        },
      ])
    );

    // Fetch employee data for both company ID and contact info (email, mobile)
    const employeeMapById = new Map(
      employeeMaps.map((map) => [map.employeeId, map])
    );

    const batchIds = Array.from(
      new Set(
        employeeMaps.flatMap((map) =>
          [map.enrollmentAdditionBatchId, map.enrollmentDeletionBatchId].filter(
            (id): id is number => Boolean(id)
          )
        )
      )
    );
    // batch id -> document_processing_file.endorsement_id -> endorsement row
    const endorsementByBatchId = new Map(
      batchIds.length > 0
        ? (
            await policyRepository.manager.find(DocumentProcessingFile, {
              where: { documentId: In(batchIds) },
            })
          ).map((file) => [
            file.documentId,
            endorsementMap.get(file.endorsementId ?? -1) ?? null,
          ])
        : []
    );

    // Latest submit that included this policy wins; submissionCount is insert-only
    // and monotonic per employee, so MAX(submissionCount) == latest submittedAt.
    const submissionRefByEmployeeId = new Map<number, string>();
    if (employeeIds.length > 0) {
      const submissions = await policyRepository.manager
        .createQueryBuilder(EmployeeEnrollmentSubmission, "submission")
        .where("submission.employeeId IN (:...employeeIds)", { employeeIds })
        .andWhere("submission.policyIds @> CAST(:policyIdJson AS jsonb)", {
          policyIdJson: JSON.stringify([policyId]),
        })
        .orderBy("submission.employeeId", "ASC")
        .addOrderBy("submission.submissionCount", "DESC")
        .getMany();
      submissions.forEach((submission) => {
        if (!submissionRefByEmployeeId.has(submission.employeeId)) {
          submissionRefByEmployeeId.set(
            submission.employeeId,
            submission.referenceNumber
          );
        }
      });
    }

    const employeeDataMap = new Map(
      (
        await employeeRepo.find({
          where: { id: In(employeeIds) },
          withDeleted: true,
        })
      ).map((employee) => [
        employee.id, 
        {
          companyEmployeeId: employee.companyEmployeeId ?? null,
          email: employee.email ?? null,
          phoneNumber: employee.phoneNumber ?? null,
        }
      ])
    );

    const dependentDetails = dependents.map((dependent) => {
      const enrollmentData = enrollmentMap.get(dependent.employeeId);
      const employeeData = employeeDataMap.get(dependent.employeeId);
      const dependentEndorsementId =
        dependent.additionEndorsementId ??
        employeeEndorsementMap?.get(dependent.employeeId) ??
        null;
      const dependentEndorsement =
        (dependentEndorsementId &&
          endorsementMap.get(dependentEndorsementId)) ??
        (endorsements.length > 0 ? endorsements[0] : null);
      const employeeCompanyId = employeeData?.companyEmployeeId ?? null;
      const dependentEmail = employeeData?.email ?? null;
      const dependentMobile = employeeData?.phoneNumber ?? null;
      
      const sumInsuredTotal = enrollmentData?.sumInsured
        ? Number(enrollmentData.sumInsured)
        : null;
      const sumInsuredBalance = enrollmentData?.balance
        ? Number(enrollmentData.balance)
        : null;
      const sumInsuredUtilized =
        sumInsuredTotal !== null && sumInsuredBalance !== null
          ? sumInsuredTotal - sumInsuredBalance
          : null;

      const originalRelationship =
        dependent.relationshipType ?? dependent.relation;
    const transformedRelationshipGroup =
        originalRelationship?.toLowerCase() === RELATIONSHIP_SELF
          ? RELATIONSHIP_SELF
          : RELATIONSHIP_DEPENDENT;

      // Calculate prorata days and status for dependents
      const dependentEffectiveFrom = dependent.effectiveDate ?? dependent.endorsementAdditionCreatedAt;
      const dependentEffectiveTo = dependent.deletedAt ?? policy.policyTo;
      
      const policyActiveDays = calculatePolicyActiveDays(
        policy.policyFrom,
        policy.policyTo
      );
      const basicPremium = enrollmentData?.totalPremium
        ? Number(enrollmentData.totalPremium)
        : null;
      const additionProrataDays = calculateAdditionProrataDays(
        dependentEffectiveFrom,
        policy.policyTo
      );
      const deletionProrataDays = calculateDeletionProrataDays(
        enrollmentData?.deletedAt ?? null,
        policy.policyTo
      );
      const additionPremiumExcludingGst = calculateProrataPremium(
        additionProrataDays,
        basicPremium,
        policyActiveDays
      );
      const deletionPremiumExcludingGst = calculateProrataPremium(
        deletionProrataDays,
        basicPremium,
        policyActiveDays
      );
      const netPremiumExcludingGst =
        additionPremiumExcludingGst !== null &&
        deletionPremiumExcludingGst !== null
          ? Math.round(
              Math.abs(
                additionPremiumExcludingGst - deletionPremiumExcludingGst
              ) * 100
            ) / 100
          : null;
      const mapRecord = employeeMapById.get(dependent.employeeId);
      const batchEndorsement = endorsementByBatchId.get(
        mapRecord?.enrollmentAdditionBatchId ??
          mapRecord?.enrollmentDeletionBatchId ??
          -1
      );
      const dependentStatus = mapRecord?.deletedAt
        ? DEFAULT_INACTIVE_STATUS
        : calculateStatus(dependentEffectiveFrom, dependentEffectiveTo);

      return {
        iirmEmpId: dependent.id ?? null,
        employeeId: dependent.employeeId ?? null,
        employeeCompanyId,
        insuredName: dependent.name ?? null,
        dateOfBirth: formatDate(dependent.dateOfBirth) ?? null,
        gender: dependent.gender ?? null,
        effectiveFrom: formatDate(dependentEffectiveFrom) ?? null,
        effectiveTo: formatDate(dependentEffectiveTo) ?? null,
        relationshipGroup: transformedRelationshipGroup ?? null,
        relation: dependent.relation ?? null,
        sumInsuredTotal,
        sumInsuredUtilized,
        sumInsuredBalance,
        
        // New enhanced fields for dependents
        iirmPolicyId: policyId ?? null,
        insurerPolicyNumber: policy.insurerPolicyNumber ?? null,
        insurerEndorsementNumber:
          dependentEndorsement?.insurerEndorsementNumber ?? null,
        insurerEndorsementDate: dependentEndorsement?.insurerEndorsementDate
          ? formatDate(dependentEndorsement.insurerEndorsementDate)
          : null,
        tpaId: dependent.dependentTpaId ?? null,
        mobileNumber: dependentMobile,  // From parent employee record
        email: dependentEmail,          // From parent employee record
        endorsementEffectiveDate: dependentEffectiveFrom ? formatDate(dependentEffectiveFrom) : null,
        additionProrataDays,
        deletionProrataDays,
        additionPremiumExcludingGst,
        deletionPremiumExcludingGst,
        netPremiumExcludingGst,
        enrollmentConfirmationNumber:
          submissionRefByEmployeeId.get(dependent.employeeId) ?? null,
        enrollmentStartDate: formatDate(mapRecord?.enrollmentStartDate) ?? null,
        enrollmentEndDate: formatDate(mapRecord?.enrollmentEndDate) ?? null,
        enrollmentStatus: enrollmentStatusLabel(enrollmentData?.enrollmentStatusKey),
        endorsementType: batchEndorsement?.endorsementType ?? null,
        ingestedMode: batchEndorsement?.ingestedMode ?? null,
        status: dependentStatus,
        claimStatus: dependent.claimStatus ?? null,
        endorsementId: dependent.additionEndorsementId ?? null,
      };
    })
    .filter((record) => {
      // Apply additional filters for dependents
      if (
        iirmPolicyId &&
        normalizeSearchToken(record.iirmPolicyId) !==
          normalizeSearchToken(iirmPolicyId)
      ) {
        return false;
      }
      
      if (tpaId) {
        const recordTpaId = normalizeSearchToken(record.tpaId);
        if (!recordTpaId.includes(normalizeSearchToken(tpaId))) {
          return false;
        }
      }
      
      if (status && record.status?.toLowerCase() !== status.toLowerCase()) {
        return false;
      }
      
      if (endorsementId) {
        const recordEndorsementId = record.endorsementId;
        if (recordEndorsementId !== endorsementId) {
          return false;
        }
      }

      if (insurerEndorsementNumber) {
        const endorsementNum = normalizeSearchToken(
          record.insurerEndorsementNumber
        );
        if (
          !endorsementNum.includes(
            normalizeSearchToken(insurerEndorsementNumber)
          )
        ) {
          return false;
        }
      }
      
      if (insurerEndorsementDate) {
        const endorsementDate = toDateOnlyString(
          record.insurerEndorsementDate
        );
        const filterDate = toDateOnlyString(insurerEndorsementDate);
        if (!endorsementDate || !filterDate || endorsementDate !== filterDate) {
          return false;
        }
      }
            
      return true;
    });

    const employees =
      includeEmployees && employeeIds.length > 0
        ? await employeeRepo.find({
            where: { id: In(employeeIds) },
            withDeleted: true,
          })
        : [];

    const lowerSearchBy = searchBy?.toLowerCase();
    const effectiveToDate = effectiveTo || policy.policyTo;
    if (tpaId) {
      logger.log(
        buildLogMessage({
          message: "Employee insured search tpaId filter",
          traceId: traceIdService.traceId,
          location,
          method,
          data: { tpaId },
        })
      );
    }

    const matchesClaimStatus = (
      value: string | null | undefined,
      filter: string
    ) => {
      const normalized = (value ?? "").toLowerCase();
      const normalizedFilter = filter.toLowerCase();
      if (
        normalizedFilter === CLAIM_STATUS_NO ||
        normalizedFilter === CLAIM_STATUS_NONE
      ) {
        return (
          normalized !== "" &&
          (normalized === CLAIM_STATUS_NO ||
            normalized === CLAIM_STATUS_NONE)
        );
      }
      if (
        normalizedFilter === CLAIM_STATUS_YES ||
        normalizedFilter === CLAIM_STATUS_ACTIVE
      ) {
        return (
          normalized !== "" &&
          normalized !== CLAIM_STATUS_NO &&
          normalized !== CLAIM_STATUS_NONE
        );
      }
      return normalized !== "" && normalized === normalizedFilter;
    };

    const matchesEffectiveFrom = (
      value: Date | string | null | undefined,
      filter: string
    ) => {
      if (!filter) return true;
      const valueDateOnly = toDateOnlyString(value);
      const filterDateOnly = toDateOnlyString(filter);
      if (!valueDateOnly || !filterDateOnly) {
        return false;
      }
      return valueDateOnly === filterDateOnly;
    };

    const matchesEffectiveTo = (
      value: Date | string | null | undefined,
      filter: string | Date | null | undefined
    ) => {
      if (!filter) return true;
      const valueDateOnly = toDateOnlyString(value);
      const filterDateOnly = toDateOnlyString(filter);
      if (!valueDateOnly || !filterDateOnly) {
        return false;
      }
      return valueDateOnly <= filterDateOnly;
    };

    const employeeDetails = employees
      .filter((employee) => {
        const mapRecord = employeeMapById.get(employee.id);
        if (!mapRecord) return false;
        
        // Filter by employeeId (company employee ID)
        if (normalizedEmployeeIdFilter) {
          const companyEmployeeId = normalizeSearchToken(
            employee.companyEmployeeId
          );
          if (!companyEmployeeId.includes(normalizedEmployeeIdFilter)) {
            return false;
          }
        }
        
        // Filter by searchBy (insured name)
        if (lowerSearchBy) {
          const name = (employee.fullName ?? employee.employeeName ?? "").toLowerCase();
          if (!name.includes(lowerSearchBy)) {
            return false;
          }
        }
        
        // Filter by claim status
        if (claimStatus && !matchesClaimStatus(mapRecord.claimStatus, claimStatus)) {
          return false;
        }
        
        // Filter by effective from date
        const fromDate = mapRecord.enrollmentStartDate ?? mapRecord.effectiveDate;
        if (effectiveFrom && !matchesEffectiveFrom(fromDate, effectiveFrom)) {
          return false;
        }
        
        // Filter by effective to date
        const toDate = mapRecord.enrollmentEndDate ?? effectiveToDate;
        if (effectiveToDate && !matchesEffectiveTo(toDate, effectiveToDate)) {
          return false;
        }
        
        // Filter by IIRM Policy ID
        if (
          iirmPolicyId &&
          normalizeSearchToken(policyId) !== normalizeSearchToken(iirmPolicyId)
        ) {
          return false;
        }
        
        // Filter by TPA ID
        if (tpaId) {
          const employeeTpaId = mapRecord.employeeTpaId?.toString().toLowerCase() ?? "";
          if (!employeeTpaId.includes(tpaId.toLowerCase())) {
            return false;
          }
        }
        
        // Filter by status (Active/Inactive)
        if (status) {
          const effectiveFromDate = mapRecord.enrollmentStartDate ?? mapRecord.effectiveDate ?? null;
          const effectiveToValue = mapRecord.enrollmentEndDate ?? effectiveToDate ?? null;
          const recordStatus = mapRecord.deletedAt
            ? DEFAULT_INACTIVE_STATUS
            : calculateStatus(effectiveFromDate, effectiveToValue);
          if (recordStatus.toLowerCase() !== status.toLowerCase()) {
            return false;
          }
        }
        
        return true;
      })
      .map((employee) => {
        const mapRecord = employeeMapById.get(employee.id);
        const enrollmentData = enrollmentMap.get(employee.id);
        const sumInsuredTotal = enrollmentData?.sumInsured
          ? Number(enrollmentData.sumInsured)
          : null;
        const sumInsuredBalance = enrollmentData?.balance
          ? Number(enrollmentData.balance)
          : null;
        const sumInsuredUtilized =
          sumInsuredTotal !== null && sumInsuredBalance !== null
            ? sumInsuredTotal - sumInsuredBalance
            : null;
        const effectiveFromDate =
          mapRecord?.effectiveDate ?? mapRecord?.enrollmentStartDate ?? null;
        const effectiveToValue =
          mapRecord?.deletedAt ?? policy.policyTo ?? null;

        // Use endorsementId from employeeEndorsementMap if available (preserve existing functionality)
        const endorsementId = employeeEndorsementMap?.get(employee.id) ?? null;
        
        let endorsement = null;
        if (endorsementId && endorsementMap.has(endorsementId)) {
          endorsement = endorsementMap.get(endorsementId);
        } else if (endorsements.length > 0) {
          // Fallback: use the most recent endorsement for this policy
          endorsement = endorsements[0];
        }
        
        const policyActiveDays = calculatePolicyActiveDays(
          policy.policyFrom,
          policy.policyTo
        );
        const basicPremium = enrollmentData?.totalPremium
          ? Number(enrollmentData.totalPremium)
          : null;
        // Calculate prorata days for employees
        const additionProrataDays = calculateAdditionProrataDays(
          effectiveFromDate,
          policy.policyTo
        );
        const deletionProrataDays = calculateDeletionProrataDays(
          enrollmentData?.deletedAt ?? null,
          policy.policyTo
        );
        const additionPremiumExcludingGst = calculateProrataPremium(
          additionProrataDays,
          basicPremium,
          policyActiveDays
        );
        const deletionPremiumExcludingGst = calculateProrataPremium(
          deletionProrataDays,
          basicPremium,
          policyActiveDays
        );
        const netPremiumExcludingGst =
          additionPremiumExcludingGst !== null &&
          deletionPremiumExcludingGst !== null
            ? Math.round(
                Math.abs(
                  additionPremiumExcludingGst - deletionPremiumExcludingGst
                ) * 100
              ) / 100
            : null;
        
        // Calculate status based on effective dates
        const recordStatus = mapRecord?.deletedAt
          ? DEFAULT_INACTIVE_STATUS
          : calculateStatus(effectiveFromDate, effectiveToValue);
        const batchEndorsement = endorsementByBatchId.get(
          mapRecord?.enrollmentAdditionBatchId ??
            mapRecord?.enrollmentDeletionBatchId ??
            -1
        );


        return {
          iirmEmpId: employee.id ?? null,
          employeeId: employee.id ?? null,
          employeeCompanyId: employee.companyEmployeeId ?? null,
          insuredName: employee.fullName ?? employee.employeeName ?? null,
          dateOfBirth: formatDate(employee.dateOfBirth) ?? null,
          gender: employee.gender ?? null,
          effectiveFrom: formatDate(effectiveFromDate) ?? null,
          effectiveTo: formatDate(effectiveToValue) ?? null,
          relationshipGroup: RELATIONSHIP_SELF,
          relation: RELATIONSHIP_SELF,
          sumInsuredTotal,
          sumInsuredUtilized,
          sumInsuredBalance,
          claimStatus: mapRecord?.claimStatus ?? null,
          endorsementId, // Preserve existing endorsementId functionality
          
          // New enhanced fields
          iirmPolicyId: policyId ?? null,
          insurerPolicyNumber: policy.insurerPolicyNumber ?? null,
          insurerEndorsementNumber: endorsement?.insurerEndorsementNumber ?? null,
          insurerEndorsementDate: endorsement?.insurerEndorsementDate ? formatDate(endorsement.insurerEndorsementDate) : null,
          tpaId: mapRecord?.employeeTpaId ?? null,
          mobileNumber: employee.phoneNumber ?? null,
          email: employee.email ?? null,
          endorsementEffectiveDate: endorsement?.createdAt ? formatDate(endorsement.createdAt) : null,
          additionProrataDays,
          deletionProrataDays,
          additionPremiumExcludingGst,
          deletionPremiumExcludingGst,
          netPremiumExcludingGst,
          status: recordStatus,
          enrollmentConfirmationNumber:
            submissionRefByEmployeeId.get(employee.id) ?? null,
          enrollmentStartDate: formatDate(mapRecord?.enrollmentStartDate) ?? null,
          enrollmentEndDate: formatDate(mapRecord?.enrollmentEndDate) ?? null,
          enrollmentStatus: enrollmentStatusLabel(enrollmentData?.enrollmentStatusKey),
          endorsementType: batchEndorsement?.endorsementType ?? null,
          ingestedMode: batchEndorsement?.ingestedMode ?? endorsement?.ingestedMode ?? null,
        };
      })
      .filter((record) => {
        // Apply endorsement-based filters after mapping
        if (insurerEndorsementNumber) {
          const endorsementNum = normalizeSearchToken(
            record.insurerEndorsementNumber
          );
          if (
            !endorsementNum.includes(
              normalizeSearchToken(insurerEndorsementNumber)
            )
          ) {
            return false;
          }
        }
        
        if (insurerEndorsementDate) {
          const endorsementDate = toDateOnlyString(
            record.insurerEndorsementDate
          );
          const filterDate = toDateOnlyString(insurerEndorsementDate);
          if (!endorsementDate || !filterDate || endorsementDate !== filterDate) {
            return false;
          }
        }
        
        if (endorsementId) {
          const recordEndorsementId = record.endorsementId;
          if (recordEndorsementId !== endorsementId) {
            return false;
          }
        }
        
        return true;
      });

    const combined = [...employeeDetails, ...dependentDetails];
    const totalCount = combined.length;

    const sortFields =
      sanitizedSort.length > 0
        ? sanitizedSort
        : DEFAULT_SORT_FIELDS;

    const normalizeSortValue = (value: any, field: string) => {
      if (value === null || value === undefined) {
        return null;
      }
      if (field === "relationshipGroup") {
        return value === RELATIONSHIP_GROUP.SELF ? 0 : 1;
      }
      if (value instanceof Date) {
        return value.getTime();
      }
      if (typeof value === "string") {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          return date.getTime();
        }
        const num = Number(value);
        if (!Number.isNaN(num)) {
          return num;
        }
        return value.toLowerCase();
      }
      return value;
    };

    combined.sort((a, b) => {
      for (const { field, order } of sortFields) {
        const valA = normalizeSortValue((a as any)[field], field);
        const valB = normalizeSortValue((b as any)[field], field);
        if (valA === null && valB === null) {
          continue;
        }
        if (valA === null) {
          return 1;
        }
        if (valB === null) {
          return -1;
        }
        if (valA < valB) {
          return order === "ASC" ? -1 : 1;
        }
        if (valA > valB) {
          return order === "ASC" ? 1 : -1;
        }
      }
      return 0;
    });

    if (skipPagination) {
      return {
        data: combined,
        count: totalCount,
      };
    }

    const skip = (page - 1) * limit;
    const paged = combined.slice(skip, skip + limit);

    return {
      data: paged,
      count: totalCount,
    };
  } catch (error: any) {
    logger.error({
      level: "error",
      message: buildLogMessage({
        traceId: traceIdService.traceId,
        status: "failure",
        location,
        method,
        payload: { policyId },
        messageData: error,
      }),
    });
    throw new InternalServerErrorException(
      `Failed to fetch policy employee insured details: ${error.message}`
    );
  }
}
