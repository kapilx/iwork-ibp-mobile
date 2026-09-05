import {
  EntityManager,
  In,
  IsNull,
  Repository,
} from "typeorm";

import {
  BOOLEAN_VALUES,
  DATA_TYPES,
  DEFAULT_PAGE,
  DEPENDENT_ATTRIBUTE_INTERNAL_TYPE,
  DEPENDENT_COUNT_INTERNAL_TYPE,
  EMPLOYEE_ENDORSEMENT_READY,
  EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS,
  EMPLOYEE_ENROLLMENT_STATUS_ENROLLED,
  POLICY_CONFIGURATION_STATUS_LIVE,
  POLICY_RELATIONSHIP_TYPE_PARAMETER,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  DocumentProcessingFile,
  LookUp,
  Policy,
  PolicyConfiguration,
  PolicyEmployeeEndorsement,
  PolicyEmployeeEnrollment,
  PolicyEmployeeEnrollmentChoice,
  PolicyEnrollmentDependent,
  PolicyEnrollmentEmployee,
  PolicyEnrollmentEmployeePolicyMap,
} from "../../../../service-lib/src/lib/entities";
import {
  EnrollmentChoiceDto,
  EnrollmentProcessingRepository,
  UpsertEnrollmentDependentDto,
  resolveDependentCountSiEnhancement,
  resolveDependentCountOptionId,
} from "../../../../service-lib/src/lib/utils/enrollment-processing.util";
import {
  resolveDependentAttributePremium,
  resolveOptionIdForLife,
  resolveDependentOnlyPremiumByConfiguration,
  resolveSumInsuredIdForValue,
  type DependentAttributeParam,
  type OptionMetaEntry,
} from "../../../../service-lib/src/lib/utils/per-dependent-resolution.util";
import {
  toMidnight,
  daysBetweenInclusive,
  calculateApplicableDays,
} from "../../../../service-lib/src/lib/utils/premium-calculator.util";

export class SchedulerEnrollmentProcessingRepository
  implements EnrollmentProcessingRepository
{
  constructor(
    private readonly lookUpRepository: Repository<LookUp>,
    private readonly policyConfigurationRepo: Repository<PolicyConfiguration>,
    private readonly companyEmployeeRepo: Repository<PolicyEnrollmentEmployee>,
    private readonly dependentRepo: Repository<PolicyEnrollmentDependent>,
    private readonly employeeEnrollmentRepo: Repository<PolicyEmployeeEnrollment>,
    private readonly employeeChoiceRepo: Repository<PolicyEmployeeEnrollmentChoice>,
    private readonly employeePolicyMapRepo: Repository<PolicyEnrollmentEmployeePolicyMap>,
    private readonly uploadRepo: Repository<DocumentProcessingFile>
  ) {}

  async getConfigRelationsAndContains(policyId: number) {
    const liveStatus = await this.lookUpRepository.findOne({
      where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE },
    });
    const config = await this.policyConfigurationRepo.findOne({
      where: {
        policyId,
        ...(liveStatus ? { policyConfiguartionStatusLid: liveStatus.id } : {}),
      },
    });
    if (!config) return null;
    const data = config.policyConfiguration as any;
    const isRelationshipGroup = Array.isArray(data?.parameters)
      ? data.parameters.some(
          (p: any) => p.type === POLICY_RELATIONSHIP_TYPE_PARAMETER
        )
      : false;
    return {
      isRelationshipGroup,
      relationships: data?.relationships,
      constraints: data?.constraints,
    };
  }

  async getPolicyConfigurationByPolicyId(
    policyId: number
  ): Promise<PolicyConfiguration | null> {
    const liveStatus = await this.lookUpRepository.findOne({
      where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE },
    });
    if (!liveStatus) {
      return null;
    }
    return this.policyConfigurationRepo.findOne({
      where: {
        policyId,
        policyConfiguartionStatusLid: liveStatus.id,
      },
    });
  }

  async getEmployeeDetailsByEmployeeId(employeeId: number) {
    const employeeDetails = await this.companyEmployeeRepo.findOne({
      where: { id: employeeId },
    });
    if (!employeeDetails) {
      return null;
    }
    return {
      dateOfBirth: employeeDetails.dateOfBirth
        ? typeof employeeDetails.dateOfBirth === "string"
          ? employeeDetails.dateOfBirth
          : employeeDetails.dateOfBirth.toISOString()
        : "",
      designation: employeeDetails.designation || "",
      email: employeeDetails.email || "",
      employeeCompanyId: parseInt(employeeDetails.employeeCompanyId) || 0,
      employeeName: employeeDetails.employeeName,
      gender: employeeDetails.gender || "",
      id: employeeDetails.id,
      policyId: employeeDetails.policyId,
      maritalStatus: employeeDetails.maritalStatus || "",
      phone: employeeDetails.phoneNumber || "",
      fullName: employeeDetails.fullName,
      additionalDetails: employeeDetails.additionalParams,
    };
  }

  async getEnrollmentComponents(
    policyId: number,
    employeeId: number
  ): Promise<PolicyEmployeeEnrollmentChoice[]> {
    const enrollment = await this.employeeEnrollmentRepo.findOne({
      where: { policyId, employeeId },
      relations: { components: true },
    });
    return enrollment?.components ?? [];
  }

  async getEmployeeEnrollmentWindowSource(
    policyId: number,
    employeeId: number
  ): Promise<
    | Pick<
        PolicyEnrollmentEmployeePolicyMap,
        "enrollmentStartDate" | "enrollmentEndDate" | "createdAt"
      >
    | null
  > {
    const row = await this.employeePolicyMapRepo
      .createQueryBuilder("map")
      .select([
        "COALESCE(map.enrollmentStartDate, dpf.enrollmentStartDate) AS enrollmentStartDate",
        "COALESCE(map.enrollmentEndDate, dpf.enrollmentEndDate) AS enrollmentEndDate",
        "map.createdAt AS createdAt",
      ])
      .leftJoin(
        DocumentProcessingFile,
        "dpf",
        "dpf.documentId = map.enrollmentAdditionBatchId",
      )
      .where("map.deletedAt IS NULL")
      .andWhere("map.policyId = :policyId", { policyId })
      .andWhere("map.employeeId = :employeeId", { employeeId })
      .orderBy("map.updatedAt", "DESC")
      .addOrderBy("map.createdAt", "DESC")
      .getRawOne<{
        enrollmentstartdate?: Date | string | null;
        enrollmentenddate?: Date | string | null;
        createdat?: Date | string | null;
      }>();

    if (!row) return null;

    const enrollmentStartDate =
      (row as any).enrollmentstartdate ?? (row as any).enrollmentStartDate ?? null;
    const enrollmentEndDate =
      (row as any).enrollmentenddate ?? (row as any).enrollmentEndDate ?? null;
    const createdAt = (row as any).createdat ?? (row as any).createdAt ?? null;

    return {
      enrollmentStartDate:
        enrollmentStartDate ? new Date(enrollmentStartDate) : null,
      enrollmentEndDate: enrollmentEndDate ? new Date(enrollmentEndDate) : null,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    };
  }

  async updateDependents(
    manager: EntityManager,
    policyId: number,
    employeeId: number,
    dtos: UpsertEnrollmentDependentDto[],
    userId: number,
    options: { skipDeletion?: boolean } = {},
    endorsementId?: number
  ) {
    const existing = options.skipDeletion
      ? []
      : await manager.find(PolicyEnrollmentDependent, {
          where: { policyId, employeeId, deletedAt: IsNull() },
        });

    const existingById = new Map<number, PolicyEnrollmentDependent>();
    if (options.skipDeletion) {
      const idsToFetch = dtos.filter((dto) => dto.id).map((dto) => dto.id!);
      if (idsToFetch.length > 0) {
        const fetched = await manager.find(PolicyEnrollmentDependent, {
          where: { id: In(idsToFetch) },
        });
        fetched.forEach((dep) => existingById.set(dep.id, dep));
      }
    } else {
      existing.forEach((dep) => existingById.set(dep.id, dep));
    }

    const incomingIds = new Set<number>();
    const entities: PolicyEnrollmentDependent[] = [];
    for (const dto of dtos) {
      if (dto.id) incomingIds.add(dto.id);
      const existingDependent = dto.id ? existingById.get(dto.id) : undefined;
      const dependentEntity: Partial<PolicyEnrollmentDependent> = {
        policyId,
        employeeId,
        name: dto.name,
        relation: dto.relation,
        relationshipType: dto.relationshipType,
        dateOfBirth: dto.dateOfBirth
          ? typeof dto.dateOfBirth === "string"
            ? dto.dateOfBirth
            : new Date(
                dto.dateOfBirth.getTime() -
                  dto.dateOfBirth.getTimezoneOffset() * 60000
              )
                .toISOString()
                .split("T")[0]
          : undefined,
        effectiveDate: dto.effectiveDate
          ? typeof dto.effectiveDate === "string"
            ? dto.effectiveDate
            : new Date(
                dto.effectiveDate.getTime() -
                  dto.effectiveDate.getTimezoneOffset() * 60000
              )
                .toISOString()
                .split("T")[0]
          : undefined,
        gender: dto.gender,
        enrollmentAdditionBatchId: dto.enrollmentAdditionBatchId ?? null,
        createdBy: dto.id ? undefined : userId,
        updatedBy: userId,
        claimStatus: dto.claimStatus ?? existingDependent?.claimStatus ?? null,
        // Preserve endorsement fields so the upsert does not overwrite them with NULL
        endorsementStatusKey: existingDependent?.endorsementStatusKey,
        additionEndorsementId: existingDependent?.additionEndorsementId,
        endorsementAdditionBatchId: existingDependent?.endorsementAdditionBatchId,
      };
      if (dto.id) {
        dependentEntity.id = dto.id;
      }
      const entity = manager.create(PolicyEnrollmentDependent, dependentEntity);
      entities.push(entity);
    }

    if (!options.skipDeletion) {
      for (const dep of existing) {
        if (!incomingIds.has(dep.id)) {
          dep.deletedAt = new Date();
          dep.updatedBy = userId;
          // Reliable per-endorsement ownership marker — every other function that
          // needs to know "was THIS dependent deleted by THIS specific endorsement"
          // relies on deletionEndorsementId, not just deletedAt being set.
          if (endorsementId != null) {
            (dep as any).deletionEndorsementId = endorsementId;
          }
          entities.push(dep);
        }
      }
    }
    const savedEntities = await manager.save(PolicyEnrollmentDependent, entities);

    if (options.skipDeletion) {
      return savedEntities.filter((e) => !e.deletedAt);
    }

    return manager.find(PolicyEnrollmentDependent, {
      where: {
        policyId,
        employeeId,
        deletedAt: IsNull(),
      },
    });
  }

  async updateEnrollmentChoices(
    manager: EntityManager,
    dtos: Array<
      EnrollmentChoiceDto & {
        policyId: number;
        employeeId: number;
        companyId: number;
      }
    >,
    enrollmentContext?: {
      policyId: number;
      employeeId: number;
      companyId: number;
    }
  ) {
    let policyId: number, employeeId: number, companyId: number;

    if (dtos.length > 0) {
      ({ policyId, employeeId, companyId } = dtos[0]);
    } else if (enrollmentContext) {
      ({ policyId, employeeId, companyId } = enrollmentContext);
    } else {
      return [];
    }

    let enrollment = await manager.findOne(PolicyEmployeeEnrollment, {
      where: { policyId, employeeId },
    });
    if (!enrollment) {
      const inProgressKey = EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS;
      enrollment = manager.create(PolicyEmployeeEnrollment, {
        policyId,
        employeeId,
        companyId,
        employeeEnrollmentStatusKey: inProgressKey,
      });
      enrollment = await manager.save(enrollment);
    }

    const existingChoices = await manager.find(
      PolicyEmployeeEnrollmentChoice,
      {
        where: { employeeEnrollmentId: enrollment.id },
      }
    );

    const incomingIds = new Set<number>();
    dtos.forEach((dto) => {
      if (dto.id) {
        incomingIds.add(dto.id);
      }
    });

    const choicesToDelete = existingChoices.filter(
      (choice) => !incomingIds.has(choice.id)
    );

    if (choicesToDelete.length > 0) {
      const idsToDelete = choicesToDelete.map((choice) => choice.id);
      await manager.delete(PolicyEmployeeEnrollmentChoice, {
        id: In(idsToDelete),
      });
    }

    if (dtos.length > 0) {
      const entities = dtos.map((dto) =>
        manager.create(PolicyEmployeeEnrollmentChoice, {
          id: dto.id,
          employeeEnrollmentId: enrollment.id,
          sumInsured: dto.sumInsured,
          premium: dto.premium,
          companyPay: dto.companyPay,
          employeePay: dto.employeePay,
          premiumPerLife: dto.premiumPerLife,
          proRationEnabled: dto.proRationEnabled,
          sumInsuredModel: dto.sumInsuredModel,
          sumInsuredModelProperty: dto.sumInsuredModelProperty,
          minSumInsuredValue: dto.minSumInsuredValue,
          maxSumInsuredValue: dto.maxSumInsuredValue,
          policyComponentActionType: dto.policyComponentActionType,
          policyComponentActionTypeId: dto.policyComponentActionTypeId,
          parentpolicyComponentActionTypeId:
            dto.parentpolicyComponentActionTypeId,
          policyComponentActionLabel: dto.policyComponentActionLabel,
        })
      );

      return manager.save(PolicyEmployeeEnrollmentChoice, entities);
    }
    return [];
  }

  async deleteExistingEnrollmentChoices(
    policyId: number,
    employeeId: number
  ): Promise<void> {
    const enrollment = await this.employeeEnrollmentRepo.findOne({
      where: { policyId, employeeId },
    });

    if (enrollment) {
      await this.employeeChoiceRepo.delete({
        employeeEnrollmentId: enrollment.id,
      });
    }
  }

  async findEmployeeEnrollment(policyId: number, employeeId: number) {
    return this.employeeEnrollmentRepo.findOne({
      where: { policyId, employeeId },
    });
  }

  async updateEnrollmentStatus(
    manager: EntityManager,
    policyId: number,
    employeeId: number,
    companyId: number,
    valueKey: string,
    endorsementId?: number,
    newDependentsOnly: boolean = false,
    newlyAddedDependentIds?: number[],
    deletedDependentIds?: number[],
    employeeDeletedAt?: Date | string | null
  ) {
    const enrollment = await manager.findOne(PolicyEmployeeEnrollment, {
      where: { policyId, employeeId },
    });
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    // Captured before any mutation below — this is what an independent dependent
    // addition appends onto (see the newDependentsOnly branch further down).
    const existingSumInsured = Number(enrollment.sumInsured) || 0;

    const components = await manager.find(PolicyEmployeeEnrollmentChoice, {
      where: { employeeEnrollmentId: enrollment.id },
    });

    const activeDependents = await manager.find(PolicyEnrollmentDependent, {
      where: { policyId, employeeId, deletedAt: IsNull() },
    });

    const livesCount = 1 + activeDependents.length;

    // activeDependents excludes anyone just deleted (deletedAt: IsNull() above), so
    // their records must be fetched separately — withDeleted since they're soft-deleted.
    const deletedDependentRecords = deletedDependentIds?.length
      ? await manager.find(PolicyEnrollmentDependent, {
          where: { id: In(deletedDependentIds) },
          withDeleted: true,
        })
      : [];

    // Fetched up front (not after totals, as before) — needed to know whether any
    // component's per-life premium must be resolved per-dependent (age/dependent-count
    // aware) rather than flatly multiplied by livesCount, below.
    const policyConfigRecord = await this.getPolicyConfigurationByPolicyId(
      policyId
    );
    const config = policyConfigRecord?.policyConfiguration as any;

    const applyToDependentsParams: any[] = config
      ? (config.parameters ?? []).filter((p: any) => p.applyToDependents)
      : [];
    const useConfigForDependents =
      applyToDependentsParams.length > 0 &&
      (activeDependents.length > 0 || deletedDependentRecords.length > 0);

    // depBaseOptionMeta anchors the "Age" (etc.) swap done per-dependent below to the
    // SAME non-applyToDependents values (e.g. Dependent Count) the employee's own
    // premium was resolved against — mirrors calculateProratedPremiumsForEnrollment.
    let empRecordForDependents: any = null;
    let computeDepBaseOptionMeta: (dependentsForBand: any[]) => OptionMetaEntry[] = () => [];
    if (useConfigForDependents) {
      const employeeRecord = await manager.findOne(PolicyEnrollmentEmployee, {
        where: { id: employeeId },
      });
      if (employeeRecord) {
        empRecordForDependents = {
          ...(employeeRecord as any),
          additionalDetails: (employeeRecord as any).additionalParams,
        };
        const dependentCountParams: any[] = (config.parameters ?? []).filter(
          (p: any) =>
            p.type?.toLowerCase() === DEPENDENT_COUNT_INTERNAL_TYPE ||
            p.internalType === DEPENDENT_COUNT_INTERNAL_TYPE
        );
        computeDepBaseOptionMeta = (dependentsForBand: any[]): OptionMetaEntry[] => {
          const empBaseOption = (config.policyOptions ?? []).find((opt: any) => {
            const ageAndAttributesMatch = applyToDependentsParams.every((param: any) => {
              try {
                const empId = resolveOptionIdForLife(
                  empRecordForDependents,
                  empRecordForDependents,
                  param,
                  undefined
                );
                return !empId || (opt.optionMeta ?? []).some(
                  (m: OptionMetaEntry) => m.parameterId === param.id && m.parameterOptionId === empId
                );
              } catch {
                return true;
              }
            });
            const dependentCountMatches = dependentCountParams.every((param: any) => {
              const matchedId = resolveDependentCountOptionId(param, dependentsForBand);
              return !matchedId || (opt.optionMeta ?? []).some(
                (m: OptionMetaEntry) => m.parameterId === param.id && m.parameterOptionId === matchedId
              );
            });
            return ageAndAttributesMatch && dependentCountMatches;
          });
          return empBaseOption?.optionMeta ?? [];
        };
      }
    }

    // "Newly added" is what THIS endorsement action is introducing — everyone else
    // (previously known) is frozen and untouched. Only meaningful (non-empty) when
    // newDependentsOnly — the family-together/inception path recomputes everything
    // fresh and doesn't need this split.
    const newlyAddedDependents = newDependentsOnly
      ? activeDependents.filter((dep) => newlyAddedDependentIds?.includes(dep.id))
      : [];

    // Current (full) family band — used for the employee's own row and every
    // dependent's own premium, including one newly added in this specific endorsement.
    // Per the business Premium Rater Table (confirmed with stakeholder): a newly added
    // dependent is priced at the NEW/enhanced family SI directly — the employee's own
    // line and previously-known dependents are frozen and never recalculated here.
    const newDepBaseOptionMeta = computeDepBaseOptionMeta(activeDependents);

    // Band INCLUDING the deleted dependent(s) — activeDependents excludes them, so a
    // deleted life's own refund must resolve against the enhanced band it was actually
    // active under just before deletion, not the smaller post-deletion family. No
    // diff/subtraction here — just resolve-and-prorate, mirroring
    // calculateProratedPremiumsForEnrollment's bandIncludingDeleted.
    const bandIncludingDeleted = deletedDependentRecords.length
      ? computeDepBaseOptionMeta([...activeDependents, ...deletedDependentRecords])
      : [];

    // Fetched fresh (not reused/cached) — proration below needs the policy's actual
    // coverage window, and gstPercentage is needed later regardless of newDependentsOnly.
    const policyRow = await manager.findOne(Policy, {
      where: { id: policyId },
      select: ["id", "policyFrom", "policyTo", "gstPercentage"],
    });
    const gstPercentage = Number(policyRow?.gstPercentage ?? 0);
    const normalizedPolicyFrom = policyRow?.policyFrom
      ? toMidnight(new Date(policyRow.policyFrom))
      : undefined;
    const normalizedPolicyTo = policyRow?.policyTo
      ? toMidnight(new Date(policyRow.policyTo))
      : undefined;
    const totalPolicyDays =
      normalizedPolicyFrom && normalizedPolicyTo
        ? Math.max(0, daysBetweenInclusive(normalizedPolicyFrom, normalizedPolicyTo))
        : 0;
    const applicableDaysFor = (effectiveDate: Date | string | undefined): number => {
      if (!normalizedPolicyFrom || !normalizedPolicyTo) return totalPolicyDays;
      const start = effectiveDate ? toMidnight(new Date(effectiveDate)) : normalizedPolicyFrom;
      const clampedStart = new Date(
        Math.max(start.getTime(), normalizedPolicyFrom.getTime())
      );
      return calculateApplicableDays(clampedStart, normalizedPolicyTo);
    };
    const prorationFactorFor = (effectiveDate: Date | string | undefined): number =>
      totalPolicyDays > 0 ? applicableDaysFor(effectiveDate) / totalPolicyDays : 1;

    // Anchor for DA proration below — the earliest new dependent's effective date
    // within this action.
    const earliestNewDepDate: Date | undefined =
      newlyAddedDependents.length > 0
        ? newlyAddedDependents.reduce((earliest: Date, dep: any) => {
            const d = dep.effectiveDate ? toMidnight(new Date(dep.effectiveDate)) : earliest;
            return d < earliest ? d : earliest;
          }, toMidnight(new Date(newlyAddedDependents[0].effectiveDate ?? Date.now())))
        : undefined;

    // Anchor for the deletion refund proration below — earliest deletion date within
    // this action; the refund covers each deleted life's own applicable days from
    // their deletion date through policyTo.
    const earliestDeletedDate: Date | undefined =
      deletedDependentRecords.length > 0
        ? deletedDependentRecords.reduce((earliest: Date, dep: any) => {
            const d = dep.deletedAt ? toMidnight(new Date(dep.deletedAt)) : earliest;
            return d < earliest ? d : earliest;
          }, toMidnight(new Date(deletedDependentRecords[0].deletedAt ?? Date.now())))
        : undefined;

    const sum = components.reduce(
      (acc, comp) => acc + Number(comp.sumInsured),
      0
    );

    const existingTotalPremium = Number(enrollment.totalPremium) || 0;
    const existingTotalCompanyPay = Number(enrollment.totalCompanyPay) || 0;
    const existingTotalEmployeePay = Number(enrollment.totalEmployeePay) || 0;

    const totals = components.reduce(
      (acc, comp) => {
        const isPPLComponent = this.isPremiumPerLifeEnabled(comp.premiumPerLife);

        if (newDependentsOnly) {
          // Endorsement (independent addition) case, per the business Premium Rater
          // Table (confirmed with stakeholder): previously-known dependents AND the
          // employee's own line are frozen — their premium is already part of the
          // existingTotalPremium baseline this reduce starts from and is never
          // recalculated here. Only the newly added dependent(s)' own premium, priced
          // at the CURRENT/enhanced family band and prorated by days covered, is
          // appended on top.
          if (isPPLComponent && useConfigForDependents && empRecordForDependents) {
            for (const param of applyToDependentsParams) {
              for (const dep of newlyAddedDependents) {
                const depLifeRecord = {
                  ...(dep as any),
                  additionalDetails: (dep as any).additionalAttributes,
                };
                const factor = prorationFactorFor(dep.effectiveDate);
                try {
                  const result = resolveDependentOnlyPremiumByConfiguration({
                    parameter: param,
                    dependent: depLifeRecord,
                    employee: empRecordForDependents,
                    baseOptionMeta: newDepBaseOptionMeta,
                    policyOptions: config.policyOptions ?? [],
                    componentId: comp.policyComponentActionTypeId ?? 0,
                    effectiveDate: dep.effectiveDate ?? undefined,
                    sumInsuredId: resolveSumInsuredIdForValue(
                      config.components,
                      comp.policyComponentActionTypeId ?? 0,
                      comp.sumInsured
                    ),
                  });
                  acc.totalPremium += result.premium * factor;
                  acc.totalCompanyPay += result.companyPay * factor;
                  acc.totalEmployeePay += result.employeePay * factor;
                } catch {
                  // no matching option for this dependent's own band — nothing to add
                }
              }
            }
          } else {
            // Flat (non-config-driven) component: append only the newly added
            // life/lives' own share, prorated — a livesCount multiplier here would
            // re-charge every already-counted existing life again.
            for (const dep of newlyAddedDependents) {
              const factor = prorationFactorFor(dep.effectiveDate);
              acc.totalPremium += (Number(comp.premium) || 0) * factor;
              acc.totalCompanyPay += (Number(comp.companyPay) || 0) * factor;
              acc.totalEmployeePay += (Number(comp.employeePay) || 0) * factor;
            }
          }
          return acc;
        }

        // Family-together / inception case — unchanged: full fresh recompute for
        // every life against the current (single, shared) family band.
        if (isPPLComponent && useConfigForDependents && empRecordForDependents) {
          // The employee's own premium is resolved fresh here too — not just read
          // from comp.premium as-is — because comp.premium can be stale: if a
          // dependent was added independently after the employee's own submission,
          // newDepBaseOptionMeta (and thus the Dependent Count band) reflects the
          // CURRENT family, but the employee's saved choice still reflects whatever
          // the family looked like when they originally enrolled.
          let empPremium = Number(comp.premium) || 0;
          let empCompanyPay = Number(comp.companyPay) || 0;
          let empEmployeePay = Number(comp.employeePay) || 0;
          for (const param of applyToDependentsParams) {
            try {
              const result = resolveDependentOnlyPremiumByConfiguration({
                parameter: param,
                dependent: empRecordForDependents,
                employee: empRecordForDependents,
                baseOptionMeta: newDepBaseOptionMeta,
                policyOptions: config.policyOptions ?? [],
                componentId: comp.policyComponentActionTypeId ?? 0,
                effectiveDate: undefined,
                sumInsuredId: resolveSumInsuredIdForValue(
                  config.components,
                  comp.policyComponentActionTypeId ?? 0,
                  comp.sumInsured
                ),
              });
              empPremium = result.premium;
              empCompanyPay = result.companyPay;
              empEmployeePay = result.employeePay;
            } catch {
              // keep the stale comp.premium fallback already set above
            }
          }
          acc.totalPremium += empPremium;
          acc.totalCompanyPay += empCompanyPay;
          acc.totalEmployeePay += empEmployeePay;

          for (const dep of activeDependents) {
            const depLifeRecord = {
              ...(dep as any),
              additionalDetails: (dep as any).additionalAttributes,
            };
            for (const param of applyToDependentsParams) {
              try {
                const result = resolveDependentOnlyPremiumByConfiguration({
                  parameter: param,
                  dependent: depLifeRecord,
                  employee: empRecordForDependents,
                  baseOptionMeta: newDepBaseOptionMeta,
                  policyOptions: config.policyOptions ?? [],
                  componentId: comp.policyComponentActionTypeId ?? 0,
                  effectiveDate: dep.effectiveDate ?? undefined,
                  sumInsuredId: resolveSumInsuredIdForValue(
                    config.components,
                    comp.policyComponentActionTypeId ?? 0,
                    comp.sumInsured
                  ),
                });
                acc.totalPremium += result.premium;
                acc.totalCompanyPay += result.companyPay;
                acc.totalEmployeePay += result.employeePay;
              } catch {
                acc.totalPremium += Number(comp.premium) || 0;
                acc.totalCompanyPay += Number(comp.companyPay) || 0;
                acc.totalEmployeePay += Number(comp.employeePay) || 0;
              }
            }
          }
        } else {
          const multiplier = isPPLComponent ? livesCount : 1;
          acc.totalPremium += (Number(comp.premium) || 0) * multiplier;
          acc.totalCompanyPay += (Number(comp.companyPay) || 0) * multiplier;
          acc.totalEmployeePay += (Number(comp.employeePay) || 0) * multiplier;
        }

        return acc;
      },
      newDependentsOnly
        ? {
            totalPremium: existingTotalPremium,
            totalCompanyPay: existingTotalCompanyPay,
            totalEmployeePay: existingTotalEmployeePay,
          }
        : { totalPremium: 0, totalCompanyPay: 0, totalEmployeePay: 0 }
    );

    const siBaseline =
      newDependentsOnly && existingSumInsured > 0 ? existingSumInsured : sum;
    enrollment.sumInsured = siBaseline;
    enrollment.totalPremium = totals.totalPremium;
    enrollment.totalCompanyPay = totals.totalCompanyPay;
    enrollment.totalEmployeePay = totals.totalEmployeePay;

    if (config) {
      const dependentsForSiBandMatch = newDependentsOnly
        ? newlyAddedDependents
        : activeDependents;

      const siEnhancement = resolveDependentCountSiEnhancement(
        config,
        dependentsForSiBandMatch,
        !newDependentsOnly
      );

      enrollment.sumInsured = siBaseline + siEnhancement;

      const daParams = (config.parameters ?? []).filter(
        (p: any) =>
          p.internalType === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE ||
          p.type?.toLowerCase() === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE
      );
      // Only the newly added dependent(s)' DA premium is appended for an independent
      // addition — previously-known dependents' DA is already part of the
      // existingTotalPremium baseline above and must not be recomputed here.
      const dependentsForDaMatch = newDependentsOnly
        ? newlyAddedDependents
        : activeDependents;
      if (daParams.length > 0 && dependentsForDaMatch.length > 0) {
        const relationNameToTypeMap = new Map<string, string>();
        for (const rel of config.relationships?.enabledPolicyRelations ?? []) {
          for (const opt of rel.configuredOptions ?? []) {
            if (opt.name) {
              relationNameToTypeMap.set(
                String(opt.name).toLowerCase().trim(),
                rel.type ?? ""
              );
            }
          }
        }

        let daCompanyTotal = 0;
        let daEmployeeTotal = 0;
        for (const daParam of daParams) {
          const resolved = resolveDependentAttributePremium(
            dependentsForDaMatch as any[],
            daParam as DependentAttributeParam,
            undefined,
            relationNameToTypeMap
          );
          if (newDependentsOnly) {
            // Prorated by the same days-covered fraction as the new dependent(s)'
            // own premium above — mirrors calculateProratedPremiumsForEnrollment.
            const factor = prorationFactorFor(earliestNewDepDate);
            daCompanyTotal += resolved.companyAdditional * factor;
            daEmployeeTotal += resolved.employeeAdditional * factor;
          } else {
            daCompanyTotal += resolved.companyAdditional;
            daEmployeeTotal += resolved.employeeAdditional;
          }
        }

        enrollment.totalPremium = totals.totalPremium + daCompanyTotal + daEmployeeTotal;
        enrollment.totalCompanyPay = totals.totalCompanyPay + daCompanyTotal;
        enrollment.totalEmployeePay = totals.totalEmployeePay + daEmployeeTotal;
      }

      // Deletion refund (independent dependent deletion within this endorsement). No
      // diff/subtraction against a stored baseline: resolve the deleted life's own
      // premium at the band it was actually active under (bandIncludingDeleted),
      // prorated by ITS OWN applicable days (deletion date through policyTo), then
      // subtract from the running totals — mirrors the newlyAddedDependents addition
      // branch above, but as a subtraction, per the confirmed no-diff/resolve-and-prorate
      // model used throughout calculateProratedPremiumsForEnrollment/premium-calculator.
      if (deletedDependentRecords.length > 0) {
        let deletionPremium = 0;
        let deletionCompanyPay = 0;
        let deletionEmployeePay = 0;

        for (const comp of components) {
          const isPPLComponent = this.isPremiumPerLifeEnabled(comp.premiumPerLife);
          if (isPPLComponent && useConfigForDependents && empRecordForDependents) {
            for (const param of applyToDependentsParams) {
              for (const dep of deletedDependentRecords) {
                const depLifeRecord = {
                  ...(dep as any),
                  additionalDetails: (dep as any).additionalAttributes,
                };
                const factor = prorationFactorFor((dep as any).deletedAt);
                try {
                  const result = resolveDependentOnlyPremiumByConfiguration({
                    parameter: param,
                    dependent: depLifeRecord,
                    employee: empRecordForDependents,
                    baseOptionMeta: bandIncludingDeleted,
                    policyOptions: config.policyOptions ?? [],
                    componentId: comp.policyComponentActionTypeId ?? 0,
                    effectiveDate: (dep as any).effectiveDate ?? undefined,
                    sumInsuredId: resolveSumInsuredIdForValue(
                      config.components,
                      comp.policyComponentActionTypeId ?? 0,
                      comp.sumInsured
                    ),
                  });
                  deletionPremium += result.premium * factor;
                  deletionCompanyPay += result.companyPay * factor;
                  deletionEmployeePay += result.employeePay * factor;
                } catch {
                  // no matching option for this dependent's own band — nothing to refund
                }
              }
            }
          } else if (isPPLComponent) {
            for (const dep of deletedDependentRecords) {
              const factor = prorationFactorFor((dep as any).deletedAt);
              deletionPremium += (Number(comp.premium) || 0) * factor;
              deletionCompanyPay += (Number(comp.companyPay) || 0) * factor;
              deletionEmployeePay += (Number(comp.employeePay) || 0) * factor;
            }
          }
        }

        const siReduction = resolveDependentCountSiEnhancement(
          config,
          deletedDependentRecords,
          false
        );
        enrollment.sumInsured = Math.max(0, Number(enrollment.sumInsured) - siReduction);

        if (daParams.length > 0) {
          const relationNameToTypeMapForDeletion = new Map<string, string>();
          for (const rel of config.relationships?.enabledPolicyRelations ?? []) {
            for (const opt of rel.configuredOptions ?? []) {
              if (opt.name) {
                relationNameToTypeMapForDeletion.set(
                  String(opt.name).toLowerCase().trim(),
                  rel.type ?? ""
                );
              }
            }
          }
          const deletionFactor = prorationFactorFor(earliestDeletedDate);
          for (const daParam of daParams) {
            const resolved = resolveDependentAttributePremium(
              deletedDependentRecords as any[],
              daParam as DependentAttributeParam,
              undefined,
              relationNameToTypeMapForDeletion
            );
            deletionCompanyPay += resolved.companyAdditional * deletionFactor;
            deletionEmployeePay += resolved.employeeAdditional * deletionFactor;
            deletionPremium +=
              (resolved.companyAdditional + resolved.employeeAdditional) * deletionFactor;
          }
        }

        enrollment.totalPremium = Number(enrollment.totalPremium) - deletionPremium;
        enrollment.totalCompanyPay = Number(enrollment.totalCompanyPay) - deletionCompanyPay;
        enrollment.totalEmployeePay = Number(enrollment.totalEmployeePay) - deletionEmployeePay;
      }

      // Employee's own deletion refund (whole-employee/family deletion). Nothing else
      // in this function ever refunds the employee's own base premium/SI — the
      // deletion refund block above only covers dependents. Mirrors that same block
      // exactly, but for the employee's own life, resolved at bandIncludingDeleted
      // (the family band they were active under just before this deletion) and
      // prorated by their own deletion date.
      if (employeeDeletedAt) {
        let empDeletionPremium = 0;
        let empDeletionCompanyPay = 0;
        let empDeletionEmployeePay = 0;
        const empFactor = prorationFactorFor(employeeDeletedAt);

        for (const comp of components) {
          const isPPLComponent = this.isPremiumPerLifeEnabled(comp.premiumPerLife);
          if (isPPLComponent && useConfigForDependents && empRecordForDependents) {
            for (const param of applyToDependentsParams) {
              try {
                const result = resolveDependentOnlyPremiumByConfiguration({
                  parameter: param,
                  dependent: empRecordForDependents,
                  employee: empRecordForDependents,
                  baseOptionMeta: bandIncludingDeleted,
                  policyOptions: config.policyOptions ?? [],
                  componentId: comp.policyComponentActionTypeId ?? 0,
                  effectiveDate: undefined,
                  sumInsuredId: resolveSumInsuredIdForValue(
                    config.components,
                    comp.policyComponentActionTypeId ?? 0,
                    comp.sumInsured
                  ),
                });
                empDeletionPremium += result.premium * empFactor;
                empDeletionCompanyPay += result.companyPay * empFactor;
                empDeletionEmployeePay += result.employeePay * empFactor;
              } catch {
                // no matching option for the employee's own band — nothing to refund
              }
            }
          } else {
            // Flat (non-config-driven) component: whether per-life or family-shared,
            // the employee's own removal ends the whole family's coverage for it —
            // refund its full prorated share once (mirrors how the family-together
            // branch above charges it once per life / once per family).
            empDeletionPremium += (Number(comp.premium) || 0) * empFactor;
            empDeletionCompanyPay += (Number(comp.companyPay) || 0) * empFactor;
            empDeletionEmployeePay += (Number(comp.employeePay) || 0) * empFactor;
          }
        }

        // Base SI (not the dependent-count enhancement — the block above already
        // removed that). sumInsured is never prorated elsewhere in this codebase — a
        // coverage limit, not a time-based charge — so the full base tier is refunded.
        const baseSiReduction = components.reduce(
          (sum, comp) => sum + (Number(comp.sumInsured) || 0),
          0
        );
        enrollment.sumInsured = Math.max(0, Number(enrollment.sumInsured) - baseSiReduction);

        enrollment.totalPremium = Number(enrollment.totalPremium) - empDeletionPremium;
        enrollment.totalCompanyPay = Number(enrollment.totalCompanyPay) - empDeletionCompanyPay;
        enrollment.totalEmployeePay = Number(enrollment.totalEmployeePay) - empDeletionEmployeePay;
      }

      // Keep the lastPaid anchor fresh on every update — used elsewhere (e.g. CD
      // balance/billing reconciliation) as the last confirmed premium for this employee.
      enrollment.lastPaidNetPremium = enrollment.totalPremium;
      enrollment.lastPaidGrossPremium =
        enrollment.totalPremium + (enrollment.totalPremium * gstPercentage) / 100;
    }

    enrollment.balance = enrollment.sumInsured;
    enrollment.employeeEnrollmentStatusKey = valueKey;
    if (valueKey === EMPLOYEE_ENROLLMENT_STATUS_ENROLLED) {
      if (!endorsementId) {
        const employeePolicyMap = await manager.findOne(
          PolicyEnrollmentEmployeePolicyMap,
          {
            where: { employeeId, policyId },
          }
        );

        if (employeePolicyMap?.enrollmentAdditionBatchId) {
          const documentProcessingFile = await manager.findOne(
            DocumentProcessingFile,
            {
              where: {
                documentId: employeePolicyMap.enrollmentAdditionBatchId,
              },
            }
          );
          endorsementId = documentProcessingFile?.endorsementId ?? undefined;
        }
      }

      if (!newDependentsOnly) {
        const record: Partial<PolicyEmployeeEndorsement> = {
          policyId,
          employeeId,
          companyId,
          employeeEndorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
          endorsementId: endorsementId,
        };
        const endorsementMap = manager.create(PolicyEmployeeEndorsement, record);
        await manager.save(endorsementMap);
      }
      // Prefer newlyAddedDependentIds — the reliable, freshly-computed "new to THIS
      // call" signal — over "additionEndorsementId IS NULL". A dependent added at
      // inception (before any Endorsement record exists) never gets a non-null
      // additionEndorsementId stamped at all, so that filter would ALSO match — and
      // overwrite — every inception dependent on the very next endorsement, corrupting
      // "new to this endorsement" for every downstream premium computation (e.g.
      // calculateProratedPremiumsForEnrollment, which reads additionEndorsementId back
      // from the DB rather than being passed the ids directly). Callers that don't pass
      // newlyAddedDependentIds keep the original IsNull() scoping so their behavior is
      // unchanged.
      if (newlyAddedDependentIds?.length) {
        await manager.update(
          PolicyEnrollmentDependent,
          { id: In(newlyAddedDependentIds) },
          {
            endorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
            additionEndorsementId: endorsementId,
          }
        );
      } else if (!newlyAddedDependentIds) {
        await manager.update(
          PolicyEnrollmentDependent,
          { policyId, employeeId, deletedAt: IsNull(), additionEndorsementId: IsNull() },
          {
            endorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
            additionEndorsementId: endorsementId,
          }
        );
      }
    }
    return manager.save(enrollment);
  }

  async getPoliciesByEmployee(employeeId: number): Promise<Policy[]> {
    const maps = await this.employeePolicyMapRepo.find({
      where: { employeeId },
      relations: { policy: { policyType: true } },
    });
    return maps.map((map) => map.policy);
  }

  private isPremiumPerLifeEnabled(value: any): boolean {
    if (typeof value === DATA_TYPES.BOOLEAN) {
      return value;
    }
    if (typeof value === DATA_TYPES.NUMBER) {
      return value === 1;
    }
    if (typeof value === DATA_TYPES.STRING) {
      const normalized = value.trim().toLowerCase();
      return [BOOLEAN_VALUES.TRUE, DEFAULT_PAGE, "yes"].includes(normalized);
    }
    return false;
  }
}
