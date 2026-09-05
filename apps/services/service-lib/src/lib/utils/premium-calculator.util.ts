import { Brackets, In, IsNull, Repository } from "typeorm";
import * as XLSX from "xlsx";
import {
  Endorsement,
  FileUpload,
  Policy,
  PolicyConfiguration,
  PolicyEmployeeEndorsement,
  PolicyEmployeeEnrollment,
  PolicyEmployeeEnrollmentChoice,
  PolicyEnrollmentEmployeePolicyMap,
} from "../entities";
import { LoggerLike, resolveDependentCountSiEnhancement } from "./enrollment-processing.util";
import { buildLogMessage } from "./logger.util";
import {
  BOOLEAN_VALUES,
  DATA_TYPES,
  DEFAULT_PAGE,
  DEFAULT_TOTAL_KPI_COUNT,
  DEPENDENT_ATTRIBUTE_INTERNAL_TYPE,
  DEPENDENT_COUNT_ALL_CATEGORY,
  DEPENDENT_COUNT_INTERNAL_TYPE,
  EMPLOYEE_ENDORSEMENT_READY,
  NON_FINANCIAL_CONSTANTS,
  PER_MILLE_RATE,
  POLICY_CONFIGURATION_STATUS_LIVE,
  SUM_INSURED_MODELS,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { PREMIUM_CALCULATOR_HEADERS } from "../constants";
import { endorsementFileUploadMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { uploadToS3 } from "./file-management.utils";
import {
  resolveDependentAttributePremium,
  resolveDependentOnlyPremiumByConfiguration,
  resolveOptionIdForLife,
  resolveSumInsuredIdForValue,
  type DependentAttributeParam,
  type OptionMetaEntry,
} from "./per-dependent-resolution.util";

/**
 * Resolves which count-band option a "Dependent Count" parameter currently matches,
 * given the family's dependents — duplicated (rather than imported) from
 * enrollment-processing.util.ts's resolveDependentCountOptionId to avoid a circular
 * import (that file already imports from this one). Keep both in sync if the band
 * matching rules change.
 */
function resolveDependentCountOptionId(
  parameter: any,
  dependents: Array<{ relation?: string | null; relationshipType?: string | null }>,
): string | null {
  const dcConfig = parameter?.dependentCountConfig;
  if (!dcConfig?.countBands?.length) return null;
  const targetNorm = (dcConfig.targetRelationCategory ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z]/g, "");
  const enrolledCount =
    targetNorm === DEPENDENT_COUNT_ALL_CATEGORY.toLowerCase()
      ? (dependents ?? []).length
      : (dependents ?? []).filter((dep) => {
          const relNorm = (dep.relation ?? dep.relationshipType ?? "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z]/g, "");
          return (
            relNorm === targetNorm ||
            relNorm.includes(targetNorm) ||
            targetNorm.includes(relNorm)
          );
        }).length;
  const matchedBand = dcConfig.countBands.find((band: any) => {
    const min = parseInt(String(band.minCount ?? 0)) || 0;
    const rawMax =
      band.maxCount !== null && band.maxCount !== undefined
        ? parseInt(String(band.maxCount))
        : NaN;
    const max = isNaN(rawMax) ? Number.POSITIVE_INFINITY : rawMax;
    return enrolledCount >= min && enrolledCount <= max;
  });
  return matchedBand?.id ?? null;
}

export async function premiumCalculator(
  policyId: number,
  endorsementId: number|undefined,
  repositories: {
    endorsementRepo: Repository<Endorsement>;
    policyRepo: Repository<Policy>;
    policyConfigRepo: Repository<PolicyConfiguration>;
    employeePolicyMapRepo: Repository<PolicyEnrollmentEmployeePolicyMap>;
    fileRepo: Repository<FileUpload>
    employeeEnrollmentRepo: Repository<PolicyEmployeeEnrollment>;
    lookUpRepository: Repository<any>;
    dependentRepo: Repository<any>;
  },
  logger?: LoggerLike,
  traceId?: string,
): Promise<any> {
  const startTime = Date.now();
  logger?.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceId,
      status: "in-progress",
      location: "PolicyRepository",
      method: "premiumCalculator",
      payload: { policyId, endorsementId },
      messageData: { message: "request_start", event: "request_start" },
    }),
  });

  try {
    const fileName = `premium-calculator-${policyId}${
      endorsementId ? `-${endorsementId}` : ""
    }.xlsx`;
    const s3Key = `uploads/policy/templates/${fileName}`;
    const enrollments = await listEnrolledEnrollments(
      policyId,
      endorsementId,
      {
        employeeEnrollmentRepo: repositories.employeeEnrollmentRepo,
      },
      logger,
      traceId,
    );
    if (!enrollments || enrollments.length === 0) return;

    // Fetch policy dates needed for pro-rated premium calculation on deletions
    const policy = await repositories.policyRepo.findOne({
      where: { id: policyId },
    });

    // Fetch policy config for age-band premium calculation
    let policyConfig: any = null;
    try {
      const liveStatus = await repositories.lookUpRepository.findOne({
        where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE },
      });
      if (liveStatus) {
        const configEntity = await repositories.policyConfigRepo.findOne({
          where: { policyId, policyConfiguartionStatusLid: liveStatus.id },
        });
        if (configEntity?.policyConfiguration) {
          policyConfig = configEntity.policyConfiguration;
        }
      }
    } catch (_err) {
      // policyConfig stays null; age-band calculation falls back to base premium
    }

    // Dependent Count+Age band matching needs the employee's FULL active family,
    // not just this endorsement's own dependent(s) — but only when this parameter
    // is actually configured, so policies that don't use it are unaffected.
    const needsFullFamilyForBand = Boolean(
      policyConfig &&
        (policyConfig.parameters ?? []).some(
          (p: any) =>
            p.type?.toLowerCase() === DEPENDENT_COUNT_INTERNAL_TYPE ||
            p.internalType === DEPENDENT_COUNT_INTERNAL_TYPE,
        ),
    );
    const activeDependentsByEmployee = needsFullFamilyForBand
      ? await fetchActiveDependentsMapByEmployeeIds(
          policyId,
          enrollments.map((e) => e.employeeId),
          repositories.dependentRepo,
        )
      : new Map<number, any[]>();

    // Dependent Attribute parameters — for per-family (non-premiumPerLife)
    // choices, each dependent's own DA-derived additive premium replaces the
    // default 0 (mirrors enrollment-processing.util.ts's endorsement-portion
    // DA handling).
    const daParams: any[] = policyConfig
      ? (policyConfig.parameters ?? []).filter(
          (p: any) =>
            p.internalType === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE ||
            p.type?.toLowerCase() === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE,
        )
      : [];
    const daRelationNameToTypeMap = new Map<string, string>();
    if (daParams.length > 0) {
      for (const rel of policyConfig?.relationships?.enabledPolicyRelations ?? []) {
        for (const opt of rel.configuredOptions ?? []) {
          if (opt.name) {
            daRelationNameToTypeMap.set(String(opt.name).toLowerCase().trim(), rel.type ?? "");
          }
        }
      }
    }
    // Derive choice template structure from first enrollment's components
    const firstComponents: any[] = (enrollments[0] as any)?.components ?? [];
    const choiceHeaders = getChoiceHeaders(
      firstComponents as PolicyEmployeeEnrollmentChoice[],
    );

    // Trailing static header labels (appended after choice columns)
    const trailingHeaderLabels: Record<string, string> = {
      [PREMIUM_CALCULATOR_HEADERS.TOTAL_SI]: "Total SI",
      [PREMIUM_CALCULATOR_HEADERS.TOTAL_PREMIUM]: "Total Premium",
      [PREMIUM_CALCULATOR_HEADERS.APPLICABLE_DAYS]: "Applicable Days",
      [PREMIUM_CALCULATOR_HEADERS.ENDORSEMENT_TYPE]: "Endorsement Type",
    };

    // Leading static header labels
    const leadingHeaderLabels: Record<string, string> = {
      [PREMIUM_CALCULATOR_HEADERS.SL_NO]: "Sl No",
      [PREMIUM_CALCULATOR_HEADERS.EMPLOYEE_ID]: "Employee ID",
      [PREMIUM_CALCULATOR_HEADERS.EMPLOYEE_NAME]: "Employee Name",
      [PREMIUM_CALCULATOR_HEADERS.RELATION]: "Relation",
      [PREMIUM_CALCULATOR_HEADERS.DATE_OF_BIRTH]: "Date of Birth",
      [PREMIUM_CALCULATOR_HEADERS.EFFECTIVE_FROM]: "Effective From",
      [PREMIUM_CALCULATOR_HEADERS.EFFECTIVE_TO]: "Effective To",
    };

    // Resolvers for leading headers (effective dates resolved separately via coverage)
    const leadingResolvers: Record<
      string,
      (enroll: PolicyEmployeeEnrollment, idx: number) => any
    > = {
      [PREMIUM_CALCULATOR_HEADERS.SL_NO]: (_e, idx) => idx + 1,
      [PREMIUM_CALCULATOR_HEADERS.EMPLOYEE_ID]: (e) =>
        e.employee?.companyEmployeeId ?? "",
      [PREMIUM_CALCULATOR_HEADERS.EMPLOYEE_NAME]: (e) =>
        e.employee?.fullName ?? e.employee?.employeeName ?? "",
      [PREMIUM_CALCULATOR_HEADERS.RELATION]: () => "Self",
      [PREMIUM_CALCULATOR_HEADERS.DATE_OF_BIRTH]: (e) => e.employee?.dateOfBirth ?? "",
      [PREMIUM_CALCULATOR_HEADERS.EFFECTIVE_FROM]: () => "",
      [PREMIUM_CALCULATOR_HEADERS.EFFECTIVE_TO]: () => "",
    };

    const trailingResolvers: Record<
      string,
      (
        enroll: PolicyEmployeeEnrollment,
        coverage: PolicyEnrollmentEmployeePolicyMap | null,
        dep?: any,
      ) => any
    > = {
      [PREMIUM_CALCULATOR_HEADERS.ENDORSEMENT_TYPE]: (enroll, _coverage, dep?) => {
        if (dep) {
          return dep.deletedAt ? "Deletion" : "Addition";
        }
        const isDeletion =
          !!enroll.deletedAt ||
          !!enroll.employee?.deletedAt ||
          !!(enroll as any).enrollmentDeletionBatchId;
        return isDeletion ? "Deletion" : "Addition";
      },
      [PREMIUM_CALCULATOR_HEADERS.APPLICABLE_DAYS]: (
        _enroll,
        coverage,
        dep?,
      ) => {
        if (!policy?.policyTo) return "";
        // Use dep's own dates when resolving for a dependent row
        const effectiveDate = dep ? dep.effectiveDate : coverage?.effectiveDate;
        const deletedAt = dep ? dep.deletedAt : coverage?.deletedAt;
        const isDeletion = !!deletedAt;
        if (isDeletion) {
          // Deletion: deletedAt → policyTo (refund period, mirrors proration logic)
          if (!deletedAt) return "";
          return calculateApplicableDays(deletedAt, policy!.policyTo);
        } else {
          if (!effectiveDate) return "";
          return calculateApplicableDays(effectiveDate, policy!.policyTo);
        }
      },
    };

    // Header order: leading | choice columns | trailing
    const headers = [
      ...Object.values(leadingHeaderLabels),
      ...choiceHeaders,
      ...Object.values(trailingHeaderLabels),
    ];

    // Build rows — one employee row + one row per dependent per enrollment
    const rowGroups: Promise<any[][]>[] = enrollments.map(
      async (enroll: PolicyEmployeeEnrollment, idx: number) => {
        const components: any[] = enroll.components ?? [];

        // C-5: Detect whether any policy parameter carries applyToDependents=true.
        // When true, the stored choice.premium already holds the per-dependent sum
        // calculated at enrollment time (C-3). The premiumPerLife multiplier must
        // NOT be applied on top — FR-053.
        const hasApplyToDependentsParam = (policyConfig?.parameters ?? []).some(
          (p: any) => p.applyToDependents === true,
        );

        const coverage = await repositories.employeePolicyMapRepo.findOne({
          where: { policyId, employeeId: enroll.employeeId },
          select: ["employeeId", "effectiveDate", "deletedAt", "additionalParams"],
          withDeleted: true,
        });

        const dependents: any[] = enroll.employee?.dependents ?? [];

        // Per-dependent Dependent Attribute additive premium — resolved once
        // per enrollment (not per-row) and looked up by dependent reference
        // when building each dependent's row below.
        const daPremiumByDep = new Map<
          any,
          { companyAdditional: number; employeeAdditional: number }
        >();
        if (daParams.length > 0 && dependents.length > 0) {
          for (const daParam of daParams) {
            try {
              const { perDependent } = resolveDependentAttributePremium(
                dependents,
                daParam as DependentAttributeParam,
                coverage?.effectiveDate ?? coverage?.deletedAt ?? null,
                daRelationNameToTypeMap,
              );
              for (const { depRef, companyAdditional, employeeAdditional } of perDependent) {
                const existing = daPremiumByDep.get(depRef) ?? {
                  companyAdditional: 0,
                  employeeAdditional: 0,
                };
                existing.companyAdditional += companyAdditional;
                existing.employeeAdditional += employeeAdditional;
                daPremiumByDep.set(depRef, existing);
              }
            } catch {
              // DA resolution failure: skip this param, don't block the export
            }
          }
        }

        const applyToDependentsParams: any[] = policyConfig
          ? (policyConfig.parameters ?? []).filter((p: any) => p.applyToDependents)
          : [];
        const useConfigForDependents = applyToDependentsParams.length > 0 && !!policyConfig;

        const empRecord = {
          ...(enroll.employee as any),
          additionalDetails: (enroll.employee as any)?.additionalParams,
        };

        // "Dependent Count" parameters aren't applyToDependents (they describe the whole
        // family, not one life) but can still be part of a policyOption's optionMeta
        // alongside Age etc. — matching empBaseOption on applyToDependentsParams alone
        // would pick the first policyOption with the right Age regardless of dependent
        // count, so depBaseOptionMeta's "Dependent Count" entry must also be constrained
        // to the CURRENT total dependent count — mirrors calculateProratedPremiumsForEnrollment
        // in enrollment-processing.util.ts.
        const dependentCountParams: any[] = policyConfig
          ? (policyConfig.parameters ?? []).filter(
              (p: any) =>
                p.type?.toLowerCase() === DEPENDENT_COUNT_INTERNAL_TYPE ||
                p.internalType === DEPENDENT_COUNT_INTERNAL_TYPE,
            )
          : [];
        // Full active family, independent of endorsement scoping (only populated when
        // Dependent Count+Age is configured) — falls back to this endorsement's own
        // `dependents` otherwise, matching original behavior.
        const activeDependentsForBand = (
          activeDependentsByEmployee.get(enroll.employeeId) ?? dependents
        ).filter((dep: any) => !dep.deletedAt);

        const computeDepBaseOptionMeta = (dependentsForBand: any[]): OptionMetaEntry[] => {
          const empBaseOption = (policyConfig.policyOptions ?? []).find((opt: any) => {
            const ageAndAttributesMatch = applyToDependentsParams.every((param: any) => {
              try {
                const empId = resolveOptionIdForLife(empRecord, empRecord, param, coverage?.effectiveDate ?? coverage?.deletedAt);
                return !empId || (opt.optionMeta ?? []).some(
                  (m: OptionMetaEntry) => m.parameterId === param.id && m.parameterOptionId === empId,
                );
              } catch {
                return true;
              }
            });
            const dependentCountMatches = dependentCountParams.every((param: any) => {
              const matchedId = resolveDependentCountOptionId(param, dependentsForBand);
              return !matchedId || (opt.optionMeta ?? []).some(
                (m: OptionMetaEntry) => m.parameterId === param.id && m.parameterOptionId === matchedId,
              );
            });
            return ageAndAttributesMatch && dependentCountMatches;
          });
          return empBaseOption?.optionMeta ?? [];
        };

        // Current (full) family band — used uniformly for the employee and every
        // dependent's row, including one newly added in this specific endorsement. Per
        // the business Premium Rater Table (confirmed with stakeholder): a newly added
        // dependent is priced at the NEW/enhanced family SI, not the pre-addition one —
        // only the employee's own line (handled elsewhere, e.g. updateEnrollmentStatus)
        // gets an old-vs-new diff.
        const depBaseOptionMeta: OptionMetaEntry[] = useConfigForDependents
          ? computeDepBaseOptionMeta(activeDependentsForBand)
          : [];

        // Band INCLUDING a dependent deleted in this endorsement — activeDependentsForBand
        // already excludes them (their deletedAt is set), so their own row must resolve
        // against the enhanced band they were actually active under, not the smaller
        // post-deletion one. No diff/subtraction — just resolve-and-prorate at this band.
        const deletedDependentsInThisEndorsement = dependents.filter((dep: any) => !!dep.deletedAt);
        const bandIncludingDeleted: OptionMetaEntry[] = useConfigForDependents
          ? computeDepBaseOptionMeta([...activeDependentsForBand, ...deletedDependentsInThisEndorsement])
          : [];
        const baseOptionMetaForDependent = (dep: any): OptionMetaEntry[] =>
          dep.deletedAt ? bandIncludingDeleted : depBaseOptionMeta;

        // Dependent Count SI enhancement — only meaningful for a shared/family sum
        // insured (sumInsuredPerLife=false): the employee's row must show the
        // enhanced (base + dependent-count) SI, since that's the actual family SI in
        // effect. A per-life SI model prices each life on their own SI tier already,
        // so no enhancement applies there — existing logic is untouched for that case.
        // Uses activeDependentsForBand + deletedDependentsInThisEndorsement (not just
        // active) — same reasoning as bandIncludingDeleted above: a whole-family
        // deletion leaves activeDependentsForBand empty, but the employee's row must
        // still resolve at the band they were actually active under just before
        // deletion, not the smaller (here, zero-dependent) post-deletion one.
        const dependentCountSiEnhancement =
          policyConfig && dependentCountParams.length > 0
            ? resolveDependentCountSiEnhancement(
                policyConfig,
                [...activeDependentsForBand, ...deletedDependentsInThisEndorsement],
                true,
              )
            : 0;

        const computeProrated = (
          amount: number | null | undefined,
          effectiveDate: Date | null | undefined,
          deletedAt: Date | null | undefined,
          proRationEnabled = true,
        ): number => {
          if (amount == null) return 0;
          const isDeletion = !!deletedAt;
          if (!proRationEnabled) return isDeletion ? 0 : Number(amount);
          if (!policy?.policyFrom || !policy?.policyTo) return Number(amount);
          const { calculatedPremium } = calculateEmployeePremium({
            totalPremium: Number(amount),
            policyFrom: policy.policyFrom,
            policyTo: policy.policyTo,
            effectiveFrom: isDeletion ? deletedAt : effectiveDate,
            effectiveTo: policy.policyTo,
          });
          return calculatedPremium;
        };

        // Employee pro-rate helper
        const proratePremium = (
          amount: number | null | undefined,
          proRationEnabled = true,
        ): number =>
          computeProrated(
            amount,
            coverage?.effectiveDate,
            coverage?.deletedAt,
            proRationEnabled,
          );

        // Dependent pro-rate helper
        const prorateForDep = (
          amount: number | null | undefined,
          dep: any,
          proRationEnabled = true,
        ): number =>
          computeProrated(
            amount,
            dep.effectiveDate ?? null,
            dep.deletedAt ?? null,
            proRationEnabled,
          );

        const leadingValues = Object.keys(leadingHeaderLabels).map((key) => {
          if (key === PREMIUM_CALCULATOR_HEADERS.EFFECTIVE_FROM)
            return coverage?.effectiveDate ?? "";
          if (key === PREMIUM_CALCULATOR_HEADERS.EFFECTIVE_TO)
            return coverage?.deletedAt ?? policy?.policyTo ?? "";
          return leadingResolvers[key](enroll, idx);
        });

        // Collect structured component data so we can re-use it when building dependent rows
        interface CompItem {
          si: number;
          // Un-enhanced, actually-configured SI tier value (e.g. 300000) — always use
          // this (never `si`, which can carry the dependent-count enhancement for
          // display) when matching against config.components[].sumInsuredOptions.
          rawSi: number;
          rawPremium: number;
          ppl: boolean;
          pplForSI: boolean;
          proRationEnabled: boolean;
          hasOpt: boolean;
          component: any;
        }
        // Each template entry produces two CompItems: [base/parental, optional]
        // choiceValues has 4 entries per pair: [si, premium, optSI, optPremium]
        const compPairs: Array<[CompItem, CompItem]> = [];

        const choiceValues: any[] = [];
        let empChoicePremiumSum = 0;
        let empChoiceSISum = 0;

        for (let i = 0; i < firstComponents.length; i++) {
          const template = firstComponents[i] as any;
          let mainComp: any = undefined;
          let optionalComp: any = undefined;
          let mainPPL = false;
          let mainPPLForSI = false;

          if (template.policyComponentActionType === "base") {
            mainComp = components.find(
              (c) =>
                c.policyComponentActionType === "base" &&
                c.policyComponentActionTypeId ===
                  template.policyComponentActionTypeId,
            );
            optionalComp = components.find(
              (c) =>
                c.policyComponentActionType === "optional" &&
                c.parentpolicyComponentActionTypeId ===
                  template.policyComponentActionTypeId,
            );
            mainPPL = parsePremiumPerLife(mainComp?.premiumPerLife);
          } else if (template.policyComponentActionType === "parental") {
            mainComp = components.find(
              (c) =>
                c.policyComponentActionType === "parental" &&
                c.policyComponentActionTypeId ===
                  template.policyComponentActionTypeId,
            );
            optionalComp = components.find(
              (c) =>
                c.policyComponentActionType === "optional" &&
                c.parentpolicyComponentActionTypeId ===
                  template.policyComponentActionTypeId,
            );
            mainPPL = parsePremiumPerLife(mainComp?.premiumPerLife);
          } else {
            continue;
          }

          // sumInsuredPerLife is stored on the enrollment choice row directly.
          mainPPLForSI = Boolean(mainComp?.sumInsuredPerLife);
          // C-5: When applyToDependents=true parameters exist, suppress the
          // premiumPerLife multiplier — the stored premium already accounts for all
          // enrolled lives (FR-053).
          const optPPL = hasApplyToDependentsParam
            ? false
            : parsePremiumPerLife(
                optionalComp?.premiumPerLife ?? mainComp?.premiumPerLife,
              );
          const optPPLForSI = Boolean(optionalComp?.sumInsuredPerLife ?? mainComp?.sumInsuredPerLife);
          const mainProRation = mainComp?.proRationEnabled !== false;
          const optProRation = optionalComp?.proRationEnabled !== false;
          // Determine whether an optional component is configured for this template entry
          const templateOptComp = (firstComponents as any[]).find(
            (c: any) =>
              c.policyComponentActionType === "optional" &&
              c.parentpolicyComponentActionTypeId ===
                template.policyComponentActionTypeId,
          );
          const hasOpt = !!templateOptComp;
          const mainRawStored = mainComp ? resolveChoicePremium(mainComp, enroll, coverage?.additionalParams) : 0;
          // The employee's own premium is re-resolved fresh against the CURRENT family
          // band when config-driven — not just the stored comp.premium as-is — since
          // that stored value can be stale relative to the current dependent count
          // (mirrors the fresh employee resolution in updateEnrollmentStatus).
          // Only re-resolve the employee's own premium fresh when the employee is
          // actually part of THIS endorsement (inception/family-together, or their own
          // choices were resubmitted) — mirrors updateEnrollmentStatus, which leaves the
          // employee's line completely frozen when only a dependent was added
          // independently.
          const isEmployeeInThisEndorsement = (enroll as any).isEmployeeInThisEndorsement !== false;
          let mainRaw = mainRawStored;
          if (mainComp && mainPPL && useConfigForDependents && mainRawStored > 0 && isEmployeeInThisEndorsement) {
            let configPremium = 0;
            for (const param of applyToDependentsParams) {
              try {
                const result = resolveDependentOnlyPremiumByConfiguration({
                  parameter: param,
                  dependent: empRecord,
                  employee: empRecord,
                  // bandIncludingDeleted so a whole-family deletion (employee + deps
                  // together) resolves at the enhanced band they were actually under,
                  // not the smaller post-deletion one — equals depBaseOptionMeta when
                  // nobody in this endorsement is being deleted.
                  baseOptionMeta: bandIncludingDeleted,
                  policyOptions: policyConfig.policyOptions ?? [],
                  componentId: mainComp.policyComponentActionTypeId ?? 0,
                  effectiveDate: coverage?.effectiveDate ?? undefined,
                  sumInsuredId: resolveSumInsuredIdForValue(
                    policyConfig.components,
                    mainComp.policyComponentActionTypeId ?? 0,
                    mainComp.sumInsured
                  ),
                });
                configPremium = result.premium;
              } catch {
                configPremium = mainRawStored;
              }
            }
            mainRaw = configPremium;
          }
          const empMainAmt = mainRaw;
          const mainPremium = proratePremium(empMainAmt, mainProRation);

          const optRawStored = optionalComp ? resolveChoicePremium(optionalComp, enroll, coverage?.additionalParams) : 0;
          let optRaw = optRawStored;
          if (optionalComp && hasOpt && optPPL && useConfigForDependents && optRawStored > 0 && isEmployeeInThisEndorsement) {
            let configPremium = 0;
            for (const param of applyToDependentsParams) {
              try {
                const result = resolveDependentOnlyPremiumByConfiguration({
                  parameter: param,
                  dependent: empRecord,
                  employee: empRecord,
                  baseOptionMeta: bandIncludingDeleted,
                  policyOptions: policyConfig.policyOptions ?? [],
                  componentId: optionalComp.policyComponentActionTypeId ?? 0,
                  effectiveDate: coverage?.effectiveDate ?? undefined,
                  sumInsuredId: resolveSumInsuredIdForValue(
                    policyConfig.components,
                    optionalComp.policyComponentActionTypeId ?? 0,
                    optionalComp.sumInsured
                  ),
                });
                configPremium = result.premium;
              } catch {
                configPremium = optRawStored;
              }
            }
            optRaw = configPremium;
          }
          const empOptAmt = optRaw;
          const optPremium = hasOpt
            ? proratePremium(empOptAmt, optProRation)
            : 0;

          // Employee row: a per-family (non-per-life) component's SI is enhanced by
          // dependent count, since that's the whole point of "Dependent Count" — the
          // shared family SI grows with the family. A per-life component prices each
          // life on their own tier already, so it's left exactly as stored.
          const mainSI = mainPPLForSI
            ? Number(mainComp?.sumInsured ?? 0)
            : Number(mainComp?.sumInsured ?? 0) + dependentCountSiEnhancement;
          const optSI = hasOpt
            ? optPPLForSI
              ? Number(optionalComp?.sumInsured ?? 0)
              : Number(optionalComp?.sumInsured ?? 0) + dependentCountSiEnhancement
            : 0;

          choiceValues.push(mainSI || "", mainPremium || "");
          if (hasOpt) {
            choiceValues.push(optSI || "", optPremium || "");
          }
          empChoicePremiumSum += mainPremium + (hasOpt ? optPremium : 0);
          empChoiceSISum += mainSI + (hasOpt ? optSI : 0);

          compPairs.push([
            {
              si: mainSI,
              rawSi: Number(mainComp?.sumInsured ?? 0),
              rawPremium: mainRaw,
              ppl: mainPPL,
              pplForSI: mainPPLForSI,
              proRationEnabled: mainProRation,
              hasOpt,
              component: mainComp,
            },
            {
              si: optSI,
              rawSi: hasOpt ? Number(optionalComp?.sumInsured ?? 0) : 0,
              rawPremium: optRaw,
              ppl: optPPL,
              pplForSI: optPPLForSI,
              proRationEnabled: optProRation,
              hasOpt,
              component: optionalComp ?? mainComp,
            },
          ]);
        }

        // Check the premium amount paid by employee in PolicyEnrollmentEmployeeMap table first followed by PolicyEnrollmentEmployee table
        const mapPremiumOverride = resolveMapAdditionalParamValue(
          coverage?.additionalParams,
          "premium",
        );
        const isBypassEnroll =
          (enroll.employee as any)?.bypassPremiumAmount != null ||
          mapPremiumOverride !== undefined;
        const empTotalPremium = isBypassEnroll
          ? Math.abs(mapPremiumOverride ?? Number((enroll.employee as any)?.bypassPremiumAmount ?? 0))
          : Math.round(empChoicePremiumSum * 100) / 100;
        const empTotalSI = isBypassEnroll
          ? Number((enroll.employee as any)?.bypassSumInsured ?? 0)
          : empChoiceSISum;
        const isEmpDeletion =
          !!coverage?.deletedAt || !!(enroll as any).enrollmentDeletionBatchId;
        const empTotalPremiumSigned = isEmpDeletion
          ? -empTotalPremium
          : empTotalPremium;
        const trailingValues = Object.keys(trailingHeaderLabels).map((key) => {
          if (key === PREMIUM_CALCULATOR_HEADERS.TOTAL_SI)
            return empTotalSI || "";
          if (key === PREMIUM_CALCULATOR_HEADERS.TOTAL_PREMIUM)
            return empTotalPremiumSigned || "";
          return trailingResolvers[key](enroll, coverage);
        });

        const employeeRow = [
          ...leadingValues,
          ...choiceValues,
          ...trailingValues,
        ];

        // Dependent rows
        const emptyChoiceCols = Array(choiceValues.length).fill("");
        const emptyTrailingCols = Array(
          Object.keys(trailingHeaderLabels).length,
        ).fill("");

        // Row visibility is scoped to THIS endorsement (only show what this specific
        // transaction is about) — `dependents` (enroll.employee.dependents) is already
        // scoped to this endorsement by listEnrolledEnrollments' join (both newly-added
        // AND deleted dependents), separate from activeDependentsForBand above, which
        // deliberately uses the FULL active family for Dependent-Count band matching.
        // Deleted dependents must still get their own (negative) row below — don't
        // filter them out here.
        const dependentsForRows = dependents;
        const dependentRows = dependentsForRows.map((dep: any) => {
          const depLeading = Object.keys(leadingHeaderLabels).map((key) => {
            switch (key) {
              case PREMIUM_CALCULATOR_HEADERS.SL_NO:
                return idx + 1;
              case PREMIUM_CALCULATOR_HEADERS.EMPLOYEE_ID:
                return enroll.employee?.companyEmployeeId ?? "";
              case PREMIUM_CALCULATOR_HEADERS.EMPLOYEE_NAME:
                return dep.name ?? "";
              case PREMIUM_CALCULATOR_HEADERS.RELATION:
                return dep.relation ?? "";
              case PREMIUM_CALCULATOR_HEADERS.DATE_OF_BIRTH:
                return dep.dateOfBirth ?? "";
              case PREMIUM_CALCULATOR_HEADERS.EFFECTIVE_FROM:
                return dep.effectiveDate ?? "";
              case PREMIUM_CALCULATOR_HEADERS.EFFECTIVE_TO:
                return dep.deletedAt ?? policy?.policyTo ?? "";
              default:
                return "";
            }
          });

          // Build dep choice columns — only show for choices where ppl=true; use dep's own effective dates
          const depChoiceValues: any[] = [];
          let depChoicePremiumSum = 0;
          let depChoiceSISum = 0;
          let hasAnyPPL = false;
          let hasAnySIForDep = false;

          const depLifeRecord = {
            ...dep,
            additionalDetails: dep.additionalAttributes,
            effectiveDate: dep.effectiveDate ?? dep.deletedAt ?? coverage?.effectiveDate,
          };

          const daEntry = daParams.length > 0 ? daPremiumByDep.get(dep) : undefined;
          const depDaTotal = daEntry
            ? daEntry.companyAdditional + daEntry.employeeAdditional
            : 0;

          for (const [main, opt] of compPairs) {
            let mainDepRaw = main.rawPremium;
            if (main.ppl && useConfigForDependents && main.rawPremium > 0) {
              let configPremium = 0;
              for (const param of applyToDependentsParams) {
                try {
                  const result = resolveDependentOnlyPremiumByConfiguration({
                    parameter: param,
                    dependent: depLifeRecord,
                    employee: empRecord,
                    baseOptionMeta: baseOptionMetaForDependent(dep),
                    policyOptions: policyConfig.policyOptions ?? [],
                    componentId: main.component?.policyComponentActionTypeId ?? 0,
                    effectiveDate: depLifeRecord.effectiveDate,
                    sumInsuredId: resolveSumInsuredIdForValue(
                      policyConfig.components,
                      main.component?.policyComponentActionTypeId ?? 0,
                      main.rawSi
                    ),
                  });
                  configPremium += result.premium;
                } catch {
                  configPremium += main.rawPremium;
                }
              }
              mainDepRaw = configPremium;
            }
            // Per-family (non-PPL) choice: fall back to the dependent's own
            // Dependent Attribute premium instead of 0, when one is configured.
            const showMainPremium = main.ppl || depDaTotal !== 0;
            const mainVal = main.ppl
              ? prorateForDep(mainDepRaw, dep, main.proRationEnabled)
              : depDaTotal !== 0
                ? prorateForDep(depDaTotal, dep, main.proRationEnabled)
                : 0;
            depChoiceValues.push(
              main.pplForSI ? main.si || "" : "",
              showMainPremium ? mainVal || "" : "",
            );
            if (showMainPremium) {
              depChoicePremiumSum += mainVal;
              hasAnyPPL = true;
            }
            if (main.pplForSI) {
              depChoiceSISum += main.si;
              hasAnySIForDep = true;
            }
            if (main.hasOpt) {
              let optDepRaw = opt.rawPremium;
              if (opt.ppl && useConfigForDependents && opt.rawPremium > 0) {
                let configPremium = 0;
                for (const param of applyToDependentsParams) {
                  try {
                    const result = resolveDependentOnlyPremiumByConfiguration({
                      parameter: param,
                      dependent: depLifeRecord,
                      employee: empRecord,
                      baseOptionMeta: baseOptionMetaForDependent(dep),
                      policyOptions: policyConfig.policyOptions ?? [],
                      componentId: opt.component?.policyComponentActionTypeId ?? 0,
                      effectiveDate: depLifeRecord.effectiveDate,
                      sumInsuredId: resolveSumInsuredIdForValue(
                        policyConfig.components,
                        opt.component?.policyComponentActionTypeId ?? 0,
                        opt.rawSi
                      ),
                    });
                    configPremium += result.premium;
                  } catch {
                    configPremium += opt.rawPremium;
                  }
                }
                optDepRaw = configPremium;
              }
              const showOptPremium = opt.ppl || depDaTotal !== 0;
              const optVal = opt.ppl
                ? prorateForDep(optDepRaw, dep, opt.proRationEnabled)
                : depDaTotal !== 0
                  ? prorateForDep(depDaTotal, dep, opt.proRationEnabled)
                  : 0;
              depChoiceValues.push(
                opt.pplForSI ? opt.si || "" : "",
                showOptPremium ? optVal || "" : "",
              );
              if (showOptPremium) {
                depChoicePremiumSum += optVal;
                hasAnyPPL = true;
              }
              if (opt.pplForSI) {
                depChoiceSISum += opt.si;
                hasAnySIForDep = true;
              }
            }
          }

          // Bypass dependents with an explicit bypassPremiumAmount are the per-life
          // equivalent in bypass mode — they should carry their own totals.
          const isDepBypass = dep.bypassPremiumAmount != null;

          if (!hasAnyPPL && !hasAnySIForDep && !isDepBypass) {
            // All choices are per-family — dependent is covered by employee row, no data shown.
            // Still show Endorsement Type and Applicable Days (using family/coverage dates for PPF).
            const nonPplTrailingValues = Object.keys(trailingHeaderLabels).map((key) => {
              if (key === PREMIUM_CALCULATOR_HEADERS.ENDORSEMENT_TYPE)
                return dep.deletedAt ? "Deletion" : "Addition";
              if (key === PREMIUM_CALCULATOR_HEADERS.APPLICABLE_DAYS) {
                if (!policy?.policyTo) return "";
                // PPF: use dep's own effective dates
                const deletedAt = dep.deletedAt;
                const effectiveDate = dep.effectiveDate;
                const isDeletion = !!deletedAt;
                if (isDeletion) {
                  if (!deletedAt) return "";
                  return calculateApplicableDays(deletedAt, policy!.policyTo);
                } else {
                  if (!effectiveDate) return "";
                  return calculateApplicableDays(effectiveDate, policy!.policyTo);
                }
              }
              return "";
            });
            return [...depLeading, ...emptyChoiceCols, ...nonPplTrailingValues];
          }
          const depTotalPremium = isDepBypass
            ? Math.abs(Number(dep.bypassPremiumAmount ?? 0))
            : Math.round(depChoicePremiumSum * 100) / 100;
          const depTotalSI = isDepBypass
            ? Number(dep.bypassSumInsured ?? 0)
            : depChoiceSISum;
          const isDepDeletion = !!dep.deletedAt;
          const depTotalPremiumSigned = isDepDeletion
            ? -depTotalPremium
            : depTotalPremium;
          const depTrailingValues = Object.keys(trailingHeaderLabels).map(
            (key) => {
              if (key === PREMIUM_CALCULATOR_HEADERS.TOTAL_SI)
                return depTotalSI || "";
              if (key === PREMIUM_CALCULATOR_HEADERS.TOTAL_PREMIUM)
                return depTotalPremiumSigned || "";
              return trailingResolvers[key](enroll, coverage, dep);
            },
          );

          return [...depLeading, ...depChoiceValues, ...depTrailingValues];
        });

        const isEmployeeInThisEndorsement =
          (enroll as any).isEmployeeInThisEndorsement !== false;
        return [
          ...(isEmployeeInThisEndorsement ? [employeeRow] : []),
          ...dependentRows,
        ];
      },
    );

    const rows = (await Promise.all(rowGroups)).flat();

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows] as any[][]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Premium Calculator");
    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    }) as Buffer;

    await uploadToS3(
      buffer,
      s3Key,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    const savedFileUpload = await repositories.fileRepo.save(
      repositories.fileRepo.create({
        fileKey: s3Key,
        companyType: "policy",
        companyId: policyId,
        uploadType: "AWS",
        documentTypeLid: 0,
        createdBy: 0,
        updatedBy: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    if (endorsementId) {
      await repositories.endorsementRepo.update(endorsementId, {
        premiumCalculationFileId: savedFileUpload.id,
        premiumCalculationFileIdCreatedAt: new Date(),
      });
    }

    logger?.log({
      level: "info",
      message: buildLogMessage({
        traceId: traceId,
        status: "success",
        location: "PolicyRepository",
        method: "premiumCalculator",
        payload: { policyId, endorsementId },
        messageData: {
          message: "premiumCalculator_complete",
          event: "premiumCalculator_complete",
          durationMs: Date.now() - startTime,
          enrollmentCount: enrollments.length,
          rowCount: rows.length,
        },
      }),
    });
  } catch (error) {
    logger?.error({
      level: "error",
      message: buildLogMessage({
        traceId: traceId,
        status: "failure",
        location: "scheduler-service EnrollmentUploadScheduler",
        method: "premiumCalculator",
        payload: { policyId, endorsementId },
        messageData: {
          message: "premiumCalculator_failed",
          event: "premiumCalculator_failed",
          durationMs: Date.now() - startTime,
          error: error instanceof Error ? error.message : error,
        },
      }),
    });
    throw error;
  }
}

// Full active family for a set of employees, independent of any specific
// endorsement — used ONLY for Dependent Count+Age band matching, never for
// deciding which dependent's own row/premium gets computed (that stays scoped
// to listEnrolledEnrollments' per-endorsement dependents).
export async function fetchActiveDependentsMapByEmployeeIds(
  policyId: number,
  employeeIds: number[],
  dependentRepo: Repository<any>,
): Promise<Map<number, any[]>> {
  const map = new Map<number, any[]>();
  if (!employeeIds.length) return map;
  const rows = await dependentRepo.find({
    where: {
      policyId,
      employeeId: In(employeeIds),
      deletedAt: IsNull(),
    },
  });
  rows.forEach((dep: any) => {
    const list = map.get(dep.employeeId) ?? [];
    list.push(dep);
    map.set(dep.employeeId, list);
  });
  return map;
}

export async function listEnrolledEnrollments(
  policyId: number,
  endorsementId: number | undefined,
  repositories: {
    employeeEnrollmentRepo: Repository<PolicyEmployeeEnrollment>;
  },
  logger?: LoggerLike,
  traceId?: string,
): Promise<PolicyEmployeeEnrollment[]> {
  const startTime = Date.now();
  logger?.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceId,
      status: "in-progress",
      location: "PolicyRepository",
      method: "listEnrolledEnrollments",
      payload: { policyId, endorsementId },
      messageData: { message: "request_start", event: "request_start" },
    }),
  });
  try {
    // Row-display/premium scope is per-endorsement: only this endorsement's own
    // dependent(s) are attached here. Dependent Count+Age band matching (which needs
    // the FULL active family, not just this endorsement's dependent) is handled
    // separately by fetchActiveDependentsMapByEmployeeIds, gated on that parameter
    // actually being configured — this default join must not affect policies that
    // don't use it.
    const depJoinCondition = endorsementId
      ? "dependents.policy_id = enroll.policy_id AND dependents.endorsement_status_key = :depStatus AND (dependents.addition_endorsement_id = :depEndorsementId OR dependents.deletion_endorsement_id = :depEndorsementId)"
      : "dependents.policy_id = enroll.policy_id AND dependents.endorsement_status_key = :depStatus";
    const depJoinParams = endorsementId
      ? { depStatus: EMPLOYEE_ENDORSEMENT_READY, depEndorsementId: endorsementId }
      : { depStatus: EMPLOYEE_ENDORSEMENT_READY };

    let qb = repositories.employeeEnrollmentRepo
      .createQueryBuilder("enroll")
      .withDeleted()
      .leftJoinAndSelect("enroll.employee", "employee")
      .leftJoinAndSelect(
        "employee.dependents",
        "dependents",
        depJoinCondition,
        depJoinParams,
      )
      .leftJoinAndSelect("enroll.components", "components")
      .leftJoin(
        PolicyEmployeeEndorsement,
        "pee",
        "pee.employee_id = enroll.employee_id AND pee.policy_id = enroll.policy_id",
      )
      .where("enroll.policy_id = :policyId", { policyId })
      .andWhere(
        new Brackets((qb) => {
          qb.where("pee.employee_endorsement_status_key = :status", {
            status: EMPLOYEE_ENDORSEMENT_READY,
          }).orWhere("dependents.id IS NOT NULL");
        }),
      )
      .orderBy("enroll.id", "ASC");

    if (endorsementId) {
      qb = qb.andWhere(
        new Brackets((qb) => {
          qb.where("pee.endorsement_id = :endorsementId", {
            endorsementId,
          })
            .orWhere("pee.deletion_endorsement_id = :endorsementId", {
              endorsementId,
            })
            .orWhere("dependents.addition_endorsement_id = :endorsementId", {
              endorsementId,
            })
            .orWhere("dependents.deletion_endorsement_id = :endorsementId", {
              endorsementId,
            });
        }),
      );
    }
    const rows = await qb.getMany();

    if (endorsementId) {
      const peeMatchQuery = await repositories.employeeEnrollmentRepo
        .createQueryBuilder("e")
        .withDeleted()
        .select("e.employeeId", "employeeId")
        .innerJoin(
          PolicyEmployeeEndorsement,
          "pee",
          "pee.employee_id = e.employee_id AND pee.policy_id = e.policy_id",
        )
        .where("e.policy_id = :policyId", { policyId })
        .andWhere(
          new Brackets((qb2) =>
            qb2
              .where("pee.endorsement_id = :endorsementId", { endorsementId })
              .orWhere("pee.deletion_endorsement_id = :endorsementId", { endorsementId }),
          ),
        )
        .getRawMany();
      const peeMatchedIds = new Set<number>(
        peeMatchQuery.map((r) => Number(r.employeeId)),
      );
      rows.forEach((row) => {
        (row as any).isEmployeeInThisEndorsement = peeMatchedIds.has(row.employeeId);
      });
    } else {
      rows.forEach((row) => {
        (row as any).isEmployeeInThisEndorsement = true;
      });
    }

    logger?.log({
      level: "info",
      message: buildLogMessage({
        traceId: traceId,
        status: "success",
        location: "PolicyRepository",
        method: "listEnrolledEnrollments",
        payload: { policyId, endorsementId },
        messageData: {
          message: "request_completed",
          event: "request_completed",
          durationMs: Date.now() - startTime,
          rows: rows.length,
        },
      }),
    });
    return rows;
  } catch (error) {
    logger?.error({
      level: "error",
      message: buildLogMessage({
        traceId: traceId,
        status: "failure",
        location: "PolicyRepository",
        method: "listEnrolledEnrollments",
        payload: { policyId, endorsementId },
        messageData: {
          message: "request_failed",
          event: "request_failed",
          durationMs: Date.now() - startTime,
          error: error instanceof Error ? error.message : error,
        },
      }),
    });
    throw error;
  }
}

export function toMidnight(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function daysBetweenInclusive(start: Date, end: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
}

export function calculateApplicableDays(
  from: Date | string,
  to: Date | string,
): number {
  return Math.max(0, daysBetweenInclusive(toMidnight(new Date(from)), toMidnight(new Date(to))));
}

function getChoiceHeaders(choices: PolicyEmployeeEnrollmentChoice[]): string[] {
  const renderHeaders: string[] = [];
  for (let i = 0; i < choices.length; i++) {
    const component = choices[i] as any;
    const type = component.policyComponentActionType;
    if (type !== "base" && type !== "parental") continue;

    const mainHeader = component.policyComponentActionLabel ?? "";
    const optComp = choices.find(
      (c: any) =>
        c.policyComponentActionType === "optional" &&
        c.parentpolicyComponentActionTypeId ===
          component.policyComponentActionTypeId,
    ) as any;

    renderHeaders.push(mainHeader, `${mainHeader} Premium`);
    if (optComp) {
      const optHeader = `${mainHeader} - ${
        optComp.policyComponentActionLabel ?? ""
      }`;
      renderHeaders.push(optHeader, `${optHeader} Premium`);
    }
  }
  return renderHeaders;
}

export function calculateEmployeePremium(params: any) {
  const { totalPremium, policyFrom, policyTo, effectiveFrom, effectiveTo } =
    params;

  const policyStartDate = toMidnight(new Date(policyFrom));
  const policyEndDate = toMidnight(new Date(policyTo));

  // Total policy days — both start and end inclusive
  const totalPolicyDays = daysBetweenInclusive(policyStartDate, policyEndDate);

  // Case 1: No effective dates — return full premium unchanged
  if (!effectiveFrom || !effectiveTo) {
    return {
      calculatedPremium: totalPremium,
      totalPolicyDays,
      applicableDays: totalPolicyDays,
      isProRated: false,
    };
  }

  const effectiveStartDate = toMidnight(new Date(effectiveFrom));
  const effectiveEndDate = toMidnight(new Date(effectiveTo));

  // Clamp effective range within policy period
  const adjustedStartDate = new Date(
    Math.max(effectiveStartDate.getTime(), policyStartDate.getTime()),
  );
  const adjustedEndDate = new Date(
    Math.min(effectiveEndDate.getTime(), policyEndDate.getTime()),
  );

  // Applicable days — both start and end inclusive
  const applicableDays = Math.max(
    0,
    daysBetweenInclusive(adjustedStartDate, adjustedEndDate),
  );

  const perDayPremium =
    totalPolicyDays > 0 ? totalPremium / totalPolicyDays : 0;
  const calculatedPremium =
    Math.round(perDayPremium * applicableDays * 100) / 100;

  return {
    calculatedPremium,
    totalPolicyDays,
    applicableDays,
    isProRated: true,
  };
}

function calculateAge(dob: Date): number {
  const today = new Date();
  if (!(dob instanceof Date) || Number.isNaN(dob.getTime())) {
    throw new Error(endorsementFileUploadMessages.ER0067);
  }

  const createBirthdayForYear = (year: number) => {
    const month = dob.getMonth();
    const day = dob.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, daysInMonth));
  };

  const thisYearBirthday = createBirthdayForYear(today.getFullYear());

  let fullYears = today.getFullYear() - dob.getFullYear();
  if (today < thisYearBirthday) {
    fullYears -= 1;
  }

  const lastBirthdayYear =
    today < thisYearBirthday ? today.getFullYear() - 1 : today.getFullYear();
  const lastBirthday = createBirthdayForYear(lastBirthdayYear);
  const nextBirthday = createBirthdayForYear(lastBirthdayYear + 1);

  const elapsedMs = today.getTime() - lastBirthday.getTime();
  const yearDurationMs = nextBirthday.getTime() - lastBirthday.getTime();
  const fractionOfYear = yearDurationMs > 0 ? elapsedMs / yearDurationMs : 0;
  // TODO: Removing the fractional part as per new requirement as users are not considering the fractional age in current business scenarios and only taking the full years into account
  return fullYears;
}

export function calculateAgeAtEffectiveDate(dob: Date, effectiveDate: Date): number {
  const ref = new Date(effectiveDate);
  let age = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) {
    age--;
  }
  return Math.floor(age);
}

function parsePremiumPerLife(value: unknown): boolean {
  if (typeof value === DATA_TYPES.BOOLEAN) {
    return value;
  }
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === DATA_TYPES.NUMBER) {
    return value === 1;
  }
  const normalized = String(value).trim().toLowerCase();
  return (
    normalized === BOOLEAN_VALUES.TRUE ||
    normalized === DEFAULT_PAGE.toString() ||
    normalized === "yes"
  );
}

export function findAgeBandPremium(
    age: number | null,
    basePremium: number,
    policyConfig: any,
    choice: PolicyEmployeeEnrollmentChoice
  ): number {

    if (age === null || !policyConfig?.parameters || !policyConfig?.policyOptions) {
      return basePremium;
    }
    
    // Step 1: Find the age parameter and matching range
    let matchingRangeId: string | null = null;
    let ageParameterId: string | null = null;
    
    for (const parameter of policyConfig.parameters) {
      if (parameter.rangeDetails && parameter.rangeDetails.length > 0) {
        const paramName = (parameter.displayName || parameter.name || '').toLowerCase();
        if (paramName.includes(NON_FINANCIAL_CONSTANTS.AGE)) {
          ageParameterId = parameter.id;
          // Find matching range for this age
          for (const range of parameter.rangeDetails) {
            const minAge = typeof range.min === DATA_TYPES.STRING 
              ? parseInt(range.min) || NON_FINANCIAL_CONSTANTS.MIN_AGE
              : range.min || NON_FINANCIAL_CONSTANTS.MIN_AGE;
            const maxAge = typeof range.max === DATA_TYPES.STRING 
              ? parseInt(range.max) || NON_FINANCIAL_CONSTANTS.MAX_AGE
              : range.max || NON_FINANCIAL_CONSTANTS.MAX_AGE;
              
            if (age >= minAge && age <= maxAge) {
              matchingRangeId = range.id;
              break;
            }
          }
          if (matchingRangeId) break;
        }
      }
    }
    ;
    if (!matchingRangeId || !ageParameterId) {
      return basePremium;
    }
    
    // Step 2: Find the policy option that matches this age range
    const matchingPolicyOption = policyConfig.policyOptions?.find((option: any) => {
      return option.optionMeta?.some((meta: any) => 
        meta.parameterId === ageParameterId && 
        meta.parameterOptionId === matchingRangeId
      );
    });
    ;
    if (!matchingPolicyOption?.basePolicyChoices?.mainPolicyChoices?.choices) {
      return basePremium;
    }
    
    // Step 3: Find the matching sum insured option
    // First, try to find the component to get sum insured options
    const choiceId = choice.policyComponentActionTypeId;
    const component = policyConfig.components?.find((comp: any) => comp.id === choiceId);
    
    if (!component?.sumInsuredOptions) {
      return basePremium;
    }
    
    // Match the sum insured value from choice with the sumInsuredId
    const choiceSumInsured = parseNumericValue(choice.sumInsured);
    let matchingSumInsuredId: number | null = null;
    
    for (const siOption of component.sumInsuredOptions) {
      const optionValue = parseNumericValue(siOption.value);
      if (optionValue === choiceSumInsured) {
        matchingSumInsuredId = siOption.id;
        break;
      }
    }
    ;
    if (matchingSumInsuredId === null) {
      // If exact match not found, try using the first available option as fallback
      matchingSumInsuredId = component.sumInsuredOptions[0]?.id;
    }
    
    if (matchingSumInsuredId === null) {
      return basePremium;
    }
    
    // Step 4: Find the premium for this sum insured ID in the policy option
    const premiumChoice = matchingPolicyOption.basePolicyChoices.mainPolicyChoices.choices.find(
      (c: any) => c.sumInsuredId === matchingSumInsuredId
    );
    
    if (!premiumChoice) {
      return basePremium;
    }
    
    // Step 5: Calculate total premium (company + employee contribution)
    const companyContribution = parseNumericValue(premiumChoice.companyContribution) || 0;
    const employeeContribution = parseNumericValue(premiumChoice.employeeContribution) || 0;
    const totalPremium = companyContribution + employeeContribution;
    ;
    return totalPremium > 0 ? totalPremium : basePremium;
  };

function parseNumericValue(value: unknown): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    const numeric = Number(
      typeof value === DATA_TYPES.STRING
        ? (value as string).replace(/,/g, "")
        : value
    );
    return Number.isFinite(numeric) ? numeric : undefined;
  }

// Normalized-key lookup into a PolicyEnrollmentEmployeePolicyMap.additionalParams
// blob — the raw upload row's "Premium"/etc. cell lands here under whatever key
// its column mapping or literal header text produced, not a fixed constant.
function resolveMapAdditionalParamValue(
  mapAdditionalParams: Record<string, any> | null | undefined,
  propertyKey: string,
): number | undefined {
  if (!mapAdditionalParams || typeof mapAdditionalParams !== "object") return undefined;
  const normalizedTarget = propertyKey.replace(/[\s_-]+/g, "").toLowerCase();
  for (const [key, rawValue] of Object.entries(mapAdditionalParams)) {
    if (rawValue === null || rawValue === undefined || typeof rawValue === "object") continue;
    if (key.replace(/[\s_-]+/g, "").toLowerCase() !== normalizedTarget) continue;
    const numeric = parseNumericValue(rawValue);
    if (numeric !== undefined) return numeric;
  }
  return undefined;
}

function resolveEmployeeMultiplierValue(
  enrollment: PolicyEmployeeEnrollment,
  propertyKey?: string,
  mapAdditionalParams?: Record<string, any> | null,
): number | undefined {
  if (!enrollment?.employee || !propertyKey?.trim()) {
    return undefined;
  }
  const normalizedTarget = propertyKey.replace(/[\s_-]+/g, "").toLowerCase();
  const tryResolve = (source: Record<string, any> | undefined): number | undefined => {
    if (!source || typeof source !== "object") return undefined;
    for (const [key, rawValue] of Object.entries(source)) {
      if (rawValue === null || rawValue === undefined || typeof rawValue === "object") continue;
      if (key.replace(/[\s_-]+/g, "").toLowerCase() !== normalizedTarget) continue;
      const numeric = parseNumericValue(rawValue);
      if (numeric !== undefined) return numeric;
    }
    return undefined;
  };
  const mapValue = tryResolve(mapAdditionalParams ?? undefined);
  if (mapValue !== undefined) return mapValue;
  const direct = tryResolve(enrollment.employee as unknown as Record<string, any>);
  if (direct !== undefined) return direct;
  return tryResolve(enrollment.employee.additionalParams as Record<string, any>);
}

function resolveApplicableSumInsuredValue(
  choice: PolicyEmployeeEnrollmentChoice,
  sumInsured?: number,
): number | undefined {
  if (sumInsured === undefined || sumInsured <= 0) return sumInsured;
  const maxSI = parseNumericValue(choice.maxSumInsuredValue);
  if (maxSI !== undefined && maxSI > 0 && maxSI <= sumInsured) return maxSI;
  const minSI = parseNumericValue(choice.minSumInsuredValue);
  if (minSI !== undefined && minSI > 0 && minSI >= sumInsured) return minSI;
  return sumInsured;
}

/**
 * Resolves the effective premium for a choice, handling the MULTIPLE sum-insured
 * model where premium = (applicableSI / 1000) * (companyPay + employeePay).
 * Falls back to choice.premium for all other models.
 */
export function resolveChoicePremium(
  choice: any,
  enrollment: PolicyEmployeeEnrollment,
  mapAdditionalParams?: Record<string, any> | null,
): number {
  const basePremium = parseNumericValue(choice?.premium) ?? 0;
  if (!choice) return basePremium;

  const sumInsuredModel = choice.sumInsuredModel
    ? String(choice.sumInsuredModel).trim().toUpperCase()
    : undefined;

  if (sumInsuredModel !== SUM_INSURED_MODELS.MULTIPLE) return basePremium;

  const multiplier = resolveEmployeeMultiplierValue(enrollment, choice.sumInsuredModelProperty, mapAdditionalParams);
  const rawSI =
    Number(multiplier ?? DEFAULT_PAGE) *
    Number(parseNumericValue(choice.sumInsured) ?? DEFAULT_PAGE);
  const applicableSI = resolveApplicableSumInsuredValue(choice, rawSI);
  const companyContribution = parseNumericValue(choice.companyPay) ?? 0;
  const employeeContribution = parseNumericValue(choice.employeePay) ?? 0;

  if (
    multiplier !== undefined &&
    multiplier > 0 &&
    applicableSI !== undefined &&
    applicableSI > 0 &&
    companyContribution + employeeContribution > 0
  ) {
    return (applicableSI / PER_MILLE_RATE) * (companyContribution + employeeContribution);
  }

  if (applicableSI === DEFAULT_TOTAL_KPI_COUNT) return DEFAULT_TOTAL_KPI_COUNT;

  return basePremium;
}