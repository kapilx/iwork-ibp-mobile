import {
  apiRequest,
  axiosInstance,
  endPoints,
  fetchEmployeePolicies,
  formatAmountWithCurrency,
  type LocalizationConfig,
  getPayrollInstallments,
  useApiQuery,
  useLocalization,
} from "@ui/ui-lib";
import { useApiMutation } from "@ui/ui-lib/hooks/useMutation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Bottomfooter from "../../common/BottomFooter";
import enrollmentFooterImage from "../../assets/svgs/enrollment-footer-image.svg";
import EnrollmentFlow from "../../components/MultiEnrollment/EnrollmentFlow";
import MultiEnrollmentSummary, { DisclaimerAccepted } from "../../components/MultiEnrollment/MultiEnrollmentSummary";
import {
  ALERT_MESSAGES,
  BACK,
  CONTINUE,
  EDIT,
  SAVE_EXIT,
  SPOUSE_PARTNERS,
  SPOUSE_PARTNERS_PAYLOAD,
  TOAST_MESSAGES,
  EMAIL_OTP_SCENARIOS,
} from "../../constants";
import { setToastMessage } from "../../redux/slice";
import { isEqual } from "../../utils/deepCompare";
import {
  reconstructPolicyConfigurationFromSavedChoices,
  transformFamilyMembersToArray,
} from "./utils";
import {
  CalculatorMainContainer,
  FooterBannerWrapper,
  PageContainer,
  StyledEnrollContainer,
} from "./styles";
import ConfirmationPage from "../../components/MultiEnrollment/VerifyIdentityFlow/ConfirmationPage";
import VerifyLoginPage from "../../components/MultiEnrollment/VerifyIdentityFlow/VerifyLoginPage";
import VerifyLoginOtpPage from "../../components/MultiEnrollment/VerifyIdentityFlow/VerifyLoginOtpPage";
import { policyTypeKeys } from "../../components/WelllnessBenefitSection/constants";
import { useAuthConfig } from "../../hooks/useAuthConfig";
import {
  flattenPoliciesWithStatus,
  getUnifiedEnrollmentViewState,
  PolicyStatus,
} from "../../utils/flattenPolicies";
import { normalizePoliciesByBase } from "../../components/MultiEnrollment/MultiEnrollmentSummary/utils";
import { generatePolicyStructureForSingleEnrollment } from "../../components/PolicyConfiguration/utils";
import {
  computePerLifePremiumBreakdown,
  computeFlatPerLifeProratedBreakdown,
  calculateProratedAmount,
  type ProrationContext,
  type PremiumBreakdownEntry,
} from "../../utils/applyToDependentsPricing";
import {
  ButtonContainer,
  CancleCommonButton,
  ContinueButton,
  FooterBanner,
  FooterBannerLeft,
  FooterBannerLeftContent,
  FooterBannerLeftContentSubtitle,
  FooterBannerLeftContentTitle,
  StyledImage,
} from "../../common/BottomFooter/styles";
import EmployeeDetails from "../../components/Enrollment/EnrollmentFlow/EmployeeDetails";
import { Box } from "lucide-react";

enum EnrollmentStep {
  Configuration,
  Summary,
  success,
}

enum VerificationStep {
  SelectMethod,
  EnterOtp,
  Success,
}

interface FamilyMemberDetailsMap {
  [key: string]: any[];
}

const normalizeDateKey = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split("/");
    if (day && month && year) {
      return `${year}-${month}-${day}`;
    }
  }

  return raw;
};

const hasPolicyChoiceMapping = (dependent: any): boolean => {
  if (!dependent) return false;

  const hasDirectMapping =
    dependent?.policyComponentActionTypeId !== null &&
    dependent?.policyComponentActionTypeId !== undefined;

  const hasChoiceMapping =
    Array.isArray(dependent?.choices) &&
    dependent.choices.some(
      (choice: any) =>
        choice?.policyComponentActionTypeId !== null &&
        choice?.policyComponentActionTypeId !== undefined
    );

  return hasDirectMapping || hasChoiceMapping;
};

const getDependentMergeKey = (dependent: any): string => {
  const normalizeText = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  // IMPORTANT: Do NOT key by backend `id` here.
  // For MultiEnrollment, the same real-world person can appear with different
  // ids per policy (e.g., GMC vs Top-Up). Keying by `id` prevents us from
  // merging them and causes duplicate rows in the UI.
  return [
    normalizeText(dependent?.name),
    normalizeText(dependent?.relation ?? dependent?.relationship),
    normalizeText(dependent?.relationshipType),
    normalizeText(dependent?.gender),
  ].join("|");
};

const buildDependentFingerprint = (dependent: any): string => {
  const normalizeText = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  return [
    normalizeText(dependent?.name),
    normalizeDateKey(dependent?.dateOfBirth),
    normalizeText(
      dependent?.relation ?? dependent?.relationship ?? dependent?.relationshipType,
    ),
    normalizeText(dependent?.gender),
  ].join("|");
};

const toEpochDay = (rawDate: unknown): number | null => {
  const normalized = normalizeDateKey(rawDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const [year, month, day] = normalized.split("-").map((v) => Number(v));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day))
    return null;
  const utc = Date.UTC(year, month - 1, day);
  if (!Number.isFinite(utc)) return null;
  return Math.floor(utc / 86400000);
};

const mergeDependentChoiceArrays = (a: any[] = [], b: any[] = []) => {
  const buildKey = (choice: any) =>
    [
      String(choice?.policyComponentActionTypeId ?? ""),
      String(choice?.parentpolicyComponentActionTypeId ?? ""),
      String(choice?.policyComponentActionType ?? "").toLowerCase(),
      String(choice?.policyComponentActionLabel ?? "").trim().toLowerCase(),
    ].join("|");

  const merged: any[] = [];
  const seen = new Set<string>();
  for (const choice of [...a, ...b]) {
    if (!choice) continue;
    const key = buildKey(choice);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(choice);
  }
  return merged;
};

// Merge duplicate dependents that represent the same person across policies.
// Some backends return separate dependent records per policy (and we have even
// seen DOB differ by 1 day between policies). Without this merge, the UI shows
// duplicates (one checked, one unchecked) in each policy accordion.
const mergeDependentsByPersonFuzzyDob = (dependents: any[] = []) => {
  const normalizeText = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  const merged: Array<{
    baseKey: string;
    epochDay: number | null;
    dependent: any;
  }> = [];

  for (const dep of dependents) {
    if (!dep) continue;

    const baseKey = [
      normalizeText(dep?.name),
      normalizeText(dep?.relation ?? dep?.relationship),
      normalizeText(dep?.relationshipType),
      normalizeText(dep?.gender),
    ].join("|");
    if (!baseKey) continue;

    const incomingDay = toEpochDay(dep?.dateOfBirth);

    const existing = merged.find((entry) => {
      if (entry.baseKey !== baseKey) return false;
      if (entry.epochDay === null || incomingDay === null) return true;
      return Math.abs(entry.epochDay - incomingDay) <= 1;
    });

    if (!existing) {
      merged.push({
        baseKey,
        epochDay: incomingDay,
        dependent: {
          ...dep,
          choices: Array.isArray(dep?.choices) ? dep.choices : [],
        },
      });
      continue;
    }

    const current = existing.dependent;
    const mergedChoices = mergeDependentChoiceArrays(
      Array.isArray(current?.choices) ? current.choices : [],
      Array.isArray(dep?.choices) ? dep.choices : [],
    );

    // Prefer a stable DOB if present; if both are present and within tolerance,
    // pick the earliest day (helps with timezone +/-1 day issues).
    let nextDob = current?.dateOfBirth ?? dep?.dateOfBirth;
    const currentDay = toEpochDay(current?.dateOfBirth);
    if (currentDay !== null && incomingDay !== null) {
      const chosen = Math.min(currentDay, incomingDay);
      if (chosen === currentDay) {
        nextDob = current?.dateOfBirth;
      } else {
        nextDob = dep?.dateOfBirth;
      }
    }

    existing.epochDay = toEpochDay(nextDob);
    existing.dependent = {
      ...current,
      ...dep,
      // keep a single id (it may not be valid for all policies; downstream payload builders
      // already guard against sending invalid ids per policy)
      id: current?.id ?? dep?.id,
      dateOfBirth: nextDob,
      choices: mergedChoices,
      // preserve the flag if either variant was manually added
      isManuallyAdded: Boolean(current?.isManuallyAdded) || Boolean(dep?.isManuallyAdded),
    };
  }

  return merged.map((entry) => entry.dependent);
};

const dedupeFamilyMemberDetailsMap = (
  details: FamilyMemberDetailsMap,
): FamilyMemberDetailsMap => {
  const array = transformFamilyMembersToArray(details || {});
  const merged = mergeDependentsByPersonFuzzyDob(array);
  return transformDependentsToMap(merged);
};

const mergeDependentsMapPreferMapped = (
  incomingMap: FamilyMemberDetailsMap,
  localMap: FamilyMemberDetailsMap
): FamilyMemberDetailsMap => {
  const incomingList = Object.values(incomingMap || {}).flat();
  const localList = Object.values(localMap || {}).flat();

  const localByKey = new Map<string, any>();
  localList.forEach((dependent: any) => {
    localByKey.set(getDependentMergeKey(dependent), dependent);
  });

  const mergedList = incomingList.map((incomingDependent: any) => {
    const localCandidate = localByKey.get(
      getDependentMergeKey(incomingDependent)
    );
    if (!localCandidate) return incomingDependent;

    if (
      !hasPolicyChoiceMapping(incomingDependent) &&
      hasPolicyChoiceMapping(localCandidate)
    ) {
      return {
        ...incomingDependent,
        policyComponentActionTypeId:
          localCandidate?.policyComponentActionTypeId ??
          incomingDependent?.policyComponentActionTypeId ??
          null,
        policyComponentActionType:
          localCandidate?.policyComponentActionType ??
          incomingDependent?.policyComponentActionType ??
          null,
        parentpolicyComponentActionTypeId:
          localCandidate?.parentpolicyComponentActionTypeId ??
          incomingDependent?.parentpolicyComponentActionTypeId ??
          null,
        policyComponentActionLabel:
          localCandidate?.policyComponentActionLabel ??
          incomingDependent?.policyComponentActionLabel ??
          null,
        choices:
          Array.isArray(localCandidate?.choices) &&
          localCandidate.choices.length > 0
            ? localCandidate.choices
            : incomingDependent?.choices ?? [],
      };
    }

    return incomingDependent;
  });

  return transformDependentsToMap(mergedList);
};

const buildPolicyComponentLoadingKey = (
  policyId: number,
  parentpolicyComponentActionTypeId?: number | string | null,
  policyComponentActionTypeId?: number | string | null,
) => {
  const p = Number(policyId);
  const parent = parentpolicyComponentActionTypeId ?? null;
  const component = policyComponentActionTypeId ?? null;
  return `${p}|${String(parent)}|${String(component)}`;
};

const getPrimaryComponentIdsForPolicy = (policy: any) => {
  const choice = Array.isArray(policy?.configuration?.employeeChosenChoices)
    ? policy.configuration.employeeChosenChoices[0]
    : null;

  const fromChosen = {
    parentpolicyComponentActionTypeId: choice?.parentpolicyComponentActionTypeId ?? null,
    policyComponentActionTypeId: choice?.policyComponentActionTypeId ?? null,
  };

  if (fromChosen.policyComponentActionTypeId != null) {
    return fromChosen;
  }

  const baseTemplateId = policy?.configuration?.policyTemplate?.basePolicy?.mainPolicyId;
  if (baseTemplateId != null) {
    return {
      parentpolicyComponentActionTypeId: null,
      policyComponentActionTypeId: baseTemplateId,
    };
  }

  const components = policy?.configuration?.policyComponentsConfiguration?.components;
  if (Array.isArray(components) && components.length > 0) {
    const base = components.find(
      (c: any) => String(c?.type ?? "").toLowerCase() === "base",
    );
    const componentId = base?.id ?? components[0]?.id ?? null;
    return { parentpolicyComponentActionTypeId: null, policyComponentActionTypeId: componentId };
  }

  return { parentpolicyComponentActionTypeId: null, policyComponentActionTypeId: null };
};

const formatCurrency = (value: number, localization?: LocalizationConfig) =>
  `${formatAmountWithCurrency(Math.round(value), localization)}`;

const normalizePolicyTypeKey = (value?: string | null): string => {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase();
  if (!raw) return "";
  // Match "GMC"/"GPA"/"GTL" as a whole underscore-delimited segment, not just
  // an exact-suffix check — real policyTypeKey values like
  // "POLICY_TYPE_GMC_PARENTAL" and "POLICY_TYPE_GMC_TOP-UP" have more after
  // the family code, so endsWith("_GMC") alone misses them, silently
  // excluding Parental/Top-up policies from every GMC-gated per-life and
  // proration calculation.
  const segments = raw.split("_");
  if (raw === "GMC" || raw.endsWith("_GMC") || segments.includes("GMC")) return "GMC";
  if (raw === "GPA" || raw.endsWith("_GPA") || segments.includes("GPA")) return "GPA";
  if (raw === "GTL" || raw.endsWith("_GTL") || segments.includes("GTL")) return "GTL";
  if (raw.includes("MEDICLAIM") || raw.includes("HEALTH")) return "GMC";
  if (raw.includes("ACCIDENT") || raw.includes("PERSONAL")) return "GPA";
  if (raw.includes("TERM") || raw.includes("LIFE")) return "GTL";
  return raw;
};

const isGmcPolicy = (policy: any): boolean => {
  const normalizedTypeKey = normalizePolicyTypeKey(
    policy?.policyTypeKey ?? policy?.policyName
  );
  return normalizedTypeKey === "GMC";
};

// Returns true for any policy that has at least one enabled non-Self relation option.
// This determines which policy accordions show the FamilyMembersManagement section.
const hasDependentRelations = (policy: any): boolean => {
  const relations = policy?.configuration?.relationships?.enabledPolicyRelations;
  if (!Array.isArray(relations)) return false;
  // Include Self-only policies (e.g. GPA) so they also get FamilyMembersManagement
  // with the eligible relations strip showing "Self".
  return relations.some(
    (relation: any) =>
      relation.enabled &&
      Array.isArray(relation.configuredOptions) &&
      relation.configuredOptions.some((opt: any) => opt.enabled)
  );
};

export const buildGmcPolicyIdSet = (overAllData?: any[]): Set<number> => {
  if (!Array.isArray(overAllData)) return new Set<number>();
  return new Set(
    overAllData
      .filter((policy) => isGmcPolicy(policy))
      .map((policy) => Number(policy?.policyId))
      .filter((policyId) => Number.isFinite(policyId))
  );
};

const shouldApplyDependentMultiplier = (
  policy: any,
  gmcPolicyIds: Set<number>
): boolean => {
  const policyId = Number(policy?.policyId);
  if (Number.isFinite(policyId) && gmcPolicyIds.size > 0) {
    return gmcPolicyIds.has(policyId);
  }
  return isGmcPolicy(policy);
};

// Extracted from getDependentMultiplierForSelection so the proration path
// below can reuse the identical matching-dependents/includeSelf logic instead
// of re-deriving it slightly differently. No gating here (premiumPerLife/GMC
// checks stay in getDependentMultiplierForSelection) — this is pure membership.
const resolveSelectionMembership = (
  policy: any,
  dependents: any[],
  overAllData?: any[]
): { matchingDependents: any[]; includeSelf: boolean } => {
  const selectionComponentId = Number(policy?.policyComponentActionTypeId);
  const selectionType = String(policy?.policyComponentActionType ?? "")
    .trim()
    .toLowerCase();
  const selectionLabel = String(
    policy?.policyComponentActionLabel ?? policy?.label ?? ""
  )
    .trim()
    .toLowerCase();
  const selectionParentComponentId = Number(
    policy?.parentpolicyComponentActionTypeId
  );

  const matchingDependents = (
    Array.isArray(dependents) ? dependents : []
  ).filter((dependent) => {
    const dependentMappings =
      Array.isArray(dependent?.choices) && dependent.choices.length > 0
        ? dependent.choices
        : [
            {
              policyComponentActionTypeId:
                dependent?.policyComponentActionTypeId,
              policyComponentActionType: dependent?.policyComponentActionType,
              parentpolicyComponentActionTypeId:
                dependent?.parentpolicyComponentActionTypeId,
              policyComponentActionLabel: dependent?.policyComponentActionLabel,
            },
          ];

    return dependentMappings.some((mapping: any) => {
      const mappedComponentId = Number(mapping?.policyComponentActionTypeId);
      const mappedParentId = Number(mapping?.parentpolicyComponentActionTypeId);
      const mappedType = String(mapping?.policyComponentActionType ?? "")
        .trim()
        .toLowerCase();
      const mappedLabel = String(mapping?.policyComponentActionLabel ?? "")
        .trim()
        .toLowerCase();

      // Prefer exact component-id matching when component ids are available.
      if (
        Number.isFinite(selectionComponentId) &&
        mappedComponentId === selectionComponentId
      ) {
        if (
          selectionType === "optional" &&
          Number.isFinite(selectionParentComponentId)
        ) {
          return mappedParentId === selectionParentComponentId;
        }
        return true;
      }

      // Fallback for older payloads where ids may be absent.
      if (selectionType && mappedType === selectionType) {
        if (
          selectionType === "optional" &&
          Number.isFinite(selectionParentComponentId)
        ) {
          if (mappedParentId !== selectionParentComponentId) {
            return false;
          }
        }
        if (selectionLabel && mappedLabel) {
          return mappedLabel === selectionLabel;
        }
        return true;
      }

      return false;
    });
  });

  const policyId = Number(policy?.policyId);
  const policySource = Array.isArray(overAllData)
    ? overAllData.find((item) => Number(item?.policyId) === policyId)
    : null;
  const policyTemplate = policySource?.configuration?.policyTemplate;

  const getEligibleRelationsForSelection = (): string[] => {
    if (!policyTemplate || !Number.isFinite(selectionComponentId)) return [];

    const normalizedComponentId = Number(selectionComponentId);

    const baseMainId = Number(policyTemplate?.basePolicy?.mainPolicyId);
    if (baseMainId === normalizedComponentId) {
      return policyTemplate?.basePolicy?.eligibleRelations || [];
    }

    const parentalMainId = Number(policyTemplate?.parentalPolicy?.mainPolicyId);
    if (parentalMainId === normalizedComponentId) {
      return policyTemplate?.parentalPolicy?.eligibleRelations || [];
    }

    const findAddon = (policyNode: any) =>
      (policyNode?.addonIds || []).find(
        (addon: any) => Number(addon?.optionId) === normalizedComponentId
      );

    // The same addon optionId can exist under BOTH base and parental policies
    // with different eligibleRelations (e.g. a shared "Flex" addon where the base
    // side covers Self/Spouse and the parental side covers Parent). Disambiguate
    // using the addon's parent component id so a parental addon never inherits the
    // base side's eligible relations (which would wrongly include "Self").
    if (Number.isFinite(selectionParentComponentId)) {
      if (selectionParentComponentId === parentalMainId) {
        const parentalAddon = findAddon(policyTemplate?.parentalPolicy);
        if (parentalAddon) return parentalAddon?.eligibleRelations || [];
      }
      if (selectionParentComponentId === baseMainId) {
        const baseAddon = findAddon(policyTemplate?.basePolicy);
        if (baseAddon) return baseAddon?.eligibleRelations || [];
      }
    }

    // Fallback when the parent context is unknown: preserve the previous
    // base-first resolution order.
    const baseAddon = findAddon(policyTemplate?.basePolicy);
    if (baseAddon) {
      return baseAddon?.eligibleRelations || [];
    }

    const parentalAddon = findAddon(policyTemplate?.parentalPolicy);
    if (parentalAddon) {
      return parentalAddon?.eligibleRelations || [];
    }

    return [];
  };

  const eligibleRelations = getEligibleRelationsForSelection();
  const parentalMainId = Number(policyTemplate?.parentalPolicy?.mainPolicyId);
  const isParentalComponent =
    selectionType === "parental" ||
    (Number.isFinite(selectionParentComponentId) &&
      selectionParentComponentId === parentalMainId);

  const includeSelf =
    eligibleRelations.length > 0
      ? eligibleRelations.some(
          (relation: string) => relation?.toLowerCase?.() === "self"
        )
      : !isParentalComponent;

  // Dedupe the same way the original count did (uniqueDependentKeys), so a
  // duplicate dependent entry in the source array isn't priced/prorated twice.
  const seenKeys = new Set<string>();
  const dedupedMatchingDependents = matchingDependents.filter((dependent) => {
    const key = String(
      dependent?.id ??
        `${dependent?.name ?? ""}|${dependent?.relation ?? ""}|${
          dependent?.dateOfBirth ?? ""
        }`
    );
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  return { matchingDependents: dedupedMatchingDependents, includeSelf };
};

const getDependentMultiplierForSelection = (
  policy: any,
  dependents: any[],
  gmcPolicyIds: Set<number>,
  overAllData?: any[]
): number => {
  if (!policy?.premiumPerLife) {
    return 1;
  }

  // Non-GMC per-life policies must remain Self-only.
  if (!shouldApplyDependentMultiplier(policy, gmcPolicyIds)) {
    return 1;
  }

  const { matchingDependents, includeSelf } = resolveSelectionMembership(
    policy,
    dependents,
    overAllData
  );

  return matchingDependents.length + (includeSelf ? 1 : 0);
};

// Per-life, age-bucket-aware premium for a selection whose matched parameter has
// applyToDependents=true (e.g. a plain "Age" range parameter, not one of the
// dedicated Dependent Count/Attribute parameter types). Those dedicated types are
// already resolved correctly elsewhere and must stay untouched — this only kicks in
// for the plain-parameter case, and returns null (falling back to the existing flat
// self-premium x headcount multiplier) whenever the required data or a match isn't
// available, rather than guessing.
// Resolves this component's own proRationEnabled flag (default true, matching
// the entity's DB default) and the policy's coverage span, needed to prorate
// by any life's own effective date. Returns null policyFrom/policyTo when the
// policy can't be found — calculateProratedAmount treats missing dates as "no
// proration", so callers degrade safely to the unprorated amount.
const resolveProrationContext = (
  selectionComponentId: number,
  policyId: number,
  policyConfig: any,
  flattenedPolicies?: any[]
): ProrationContext => {
  const components = Array.isArray(policyConfig?.components)
    ? policyConfig.components
    : [];
  const component = components.find(
    (c: any) => Number(c?.id) === selectionComponentId
  );
  const proRationEnabled = component?.proRationEnabled !== false;

  const flattenedPolicy = Array.isArray(flattenedPolicies)
    ? flattenedPolicies.find((p: any) => Number(p?.policyId) === policyId)
    : null;

  return {
    proRationEnabled,
    policyFrom: flattenedPolicy?.startDate ?? null,
    policyTo: flattenedPolicy?.dueDate ?? null,
  };
};

export const resolveApplyToDependentsPremiumClient = (
  policy: any,
  dependents: any[],
  gmcPolicyIds: Set<number>,
  overAllData?: any[],
  employeeDateOfBirth?: unknown,
  employeeEffectiveDate?: unknown,
  flattenedPolicies?: any[]
): {
  companyContribution: number;
  employeeContribution: number;
  breakdown?: PremiumBreakdownEntry[];
} | null => {
  const selectionComponentId = Number(policy?.policyComponentActionTypeId);
  const selfSumInsuredId = Number(policy?.sumInsuredId);
  const policyId = Number(policy?.policyId);
  if (
    !Number.isFinite(selectionComponentId) ||
    !Number.isFinite(selfSumInsuredId) ||
    !Number.isFinite(policyId)
  ) {
    return null;
  }

  const policySource = Array.isArray(overAllData)
    ? overAllData.find((item) => Number(item?.policyId) === policyId)
    : null;
  const policyConfig = policySource?.configuration?.policyComponentsConfiguration;
  // Per-policy effective date for THIS employee (from policy_enrollment_employee_policy_map,
  // via getAllRelationsConstraintsAndDependents) — the same employee can have a different
  // effective date on a different policy, so this must come from this specific policy's
  // configuration, not the caller-supplied fallback (kept only for backward compatibility).
  const resolvedEmployeeEffectiveDate =
    policySource?.configuration?.employeeEffectiveDate ?? employeeEffectiveDate;
  const proration = resolveProrationContext(
    selectionComponentId,
    policyId,
    policyConfig,
    flattenedPolicies
  );

  const selfCompany = Number(
    policy?.companyContribution ?? policy?.companyPay ?? 0
  );
  const selfEmployee = Number(
    policy?.employeeContribution ?? policy?.employeePay ?? 0
  );

  // Proration is a property of the COMPONENT (proRationEnabled), independent
  // of whether this is a GMC/per-life-priced policy at all — a self-only GPA
  // or GTL component with proRationEnabled=true must still be prorated for a
  // mid-year joiner. Everything below this (the per-life/headcount paths) is
  // GMC-gated; this self-only fallback is not, so it's the only proration
  // that applies to a non-GMC policy.
  if (!shouldApplyDependentMultiplier(policy, gmcPolicyIds)) {
    if (!proration.proRationEnabled) return null;
    return {
      companyContribution: calculateProratedAmount(
        selfCompany,
        proration.policyFrom,
        proration.policyTo,
        resolvedEmployeeEffectiveDate,
        true
      ),
      employeeContribution: calculateProratedAmount(
        selfEmployee,
        proration.policyFrom,
        proration.policyTo,
        resolvedEmployeeEffectiveDate,
        true
      ),
    };
  }

  // employeeDateOfBirth is required here: policy.companyContribution can
  // already be a correctly combined self+dependents total (once the backend
  // has resolved and persisted it), and treating that as "self alone" would
  // double-count every matching dependent. Without a DOB to resolve self's
  // own bucket fresh, there's no safe way to tell "stale self-only" apart from
  // "already-correct combined", so this bails out rather than guess.
  if (employeeDateOfBirth) {
    const breakdown = computePerLifePremiumBreakdown(
      policyConfig,
      selectionComponentId,
      selfSumInsuredId,
      dependents,
      selfCompany,
      selfEmployee,
      employeeDateOfBirth,
      proration,
      resolvedEmployeeEffectiveDate
    );
    if (breakdown) {
      return {
        ...breakdown.reduce(
          (acc, life) => ({
            companyContribution: acc.companyContribution + life.companyPay,
            employeeContribution: acc.employeeContribution + life.employeePay,
          }),
          { companyContribution: 0, employeeContribution: 0 }
        ),
        breakdown,
      };
    }
  }

  // A relationship-group policy's companyContribution/employeeContribution is
  // already a single combined total for the whole matched family band (e.g.
  // "Self + 1 Parent"), not a per-head price — multiplying/summing it per
  // life here would double it, so it never goes through the per-life/flat
  // paths above. Proration still applies, but by the LATEST (most recent)
  // effective date among the DEPENDENTS in the combination only — self's own
  // effective date is deliberately excluded here: for a Parental-style
  // relationship-group policy the coverage is fundamentally about the
  // dependent(s) added, not self, so self joining doesn't establish when this
  // band started applying. This deliberately does not account for a
  // combination that changed mid-year due to a later deletion — same
  // reasoning as everywhere else in this file: handle the case that's
  // actually needed, not guess at one that isn't.
  if (policySource?.configuration?.isRelationshipGroup === true) {
    if (!proration.proRationEnabled) return null;

    const { matchingDependents, includeSelf } = resolveSelectionMembership(
      policy,
      dependents,
      overAllData
    );
    if (!includeSelf && matchingDependents.length === 0) return null;

    // A dependent added during this same enrollment session has no effectiveDate
    // of their own yet (FamilyMembersManagement never sets one) — fall back to
    // the employee's own effectiveDate rather than excluding them or defaulting
    // to new Date(): a freshly-added dependent's coverage starts alongside the
    // employee's, not "today", and excluding them entirely was causing this
    // whole branch to hit candidateDates.length === 0 and skip proration
    // completely for a brand-new parental dependent.
    const candidateDates: Date[] = [];
    for (const dependent of matchingDependents) {
      const rawDate = dependent?.effectiveDate ?? resolvedEmployeeEffectiveDate;
      if (!rawDate) continue;
      const d = new Date(rawDate as string);
      if (!Number.isNaN(d.getTime())) candidateDates.push(d);
    }
    if (candidateDates.length === 0) return null;

    const latestEffectiveDate = new Date(
      Math.max(...candidateDates.map((d) => d.getTime()))
    );

    return {
      companyContribution: calculateProratedAmount(
        selfCompany,
        proration.policyFrom,
        proration.policyTo,
        latestEffectiveDate,
        true
      ),
      employeeContribution: calculateProratedAmount(
        selfEmployee,
        proration.policyFrom,
        proration.policyTo,
        latestEffectiveDate,
        true
      ),
    };
  }

  // Per-head multiplication (and the resulting "Self: X + Spouse: Y" split)
  // only applies when the COMPONENT ITSELF is configured as per-life
  // (policyConfig.components[].premiumPerLife) — a static, admin-set flag,
  // NOT the same as policy.premiumPerLife above (that one is a dynamic,
  // sometimes-stale signal on the saved choice). A component with
  // premiumPerLife=false has a single FIXED total premium regardless of how
  // many lives are covered (e.g. GMC Base's ₹8,750 covers the whole family as
  // one number) — treating it as per-head would double/multiply a number
  // that was never meant to be split. For that case, just prorate the flat
  // total once, with no breakdown split.
  const componentIsPerLife =
    Array.isArray(policyConfig?.components) &&
    policyConfig.components.find((c: any) => Number(c?.id) === selectionComponentId)
      ?.premiumPerLife === true;

  if (!componentIsPerLife) {
    if (!proration.proRationEnabled) return null;
    return {
      companyContribution: calculateProratedAmount(
        selfCompany,
        proration.policyFrom,
        proration.policyTo,
        resolvedEmployeeEffectiveDate,
        true
      ),
      employeeContribution: calculateProratedAmount(
        selfEmployee,
        proration.policyFrom,
        proration.policyTo,
        resolvedEmployeeEffectiveDate,
        true
      ),
    };
  }

  // Not an Age-applyToDependents component (or it didn't resolve) — if this is
  // the plain flat "same price per head" case (no applyToDependents/dependent-
  // count parameter at all) and proration is enabled, each life still needs
  // prorating by their OWN date even though everyone pays the same tier price.
  const { matchingDependents, includeSelf } = resolveSelectionMembership(
    policy,
    dependents,
    overAllData
  );
  const flatBreakdown = computeFlatPerLifeProratedBreakdown(
    matchingDependents,
    includeSelf,
    selfCompany,
    selfEmployee,
    resolvedEmployeeEffectiveDate,
    proration
  );
  if (!flatBreakdown) return null;

  return {
    ...flatBreakdown.reduce(
      (acc, life) => ({
        companyContribution: acc.companyContribution + life.companyPay,
        employeeContribution: acc.employeeContribution + life.employeePay,
      }),
      { companyContribution: 0, employeeContribution: 0 }
    ),
    breakdown: flatBreakdown,
  };
};

export const transformDependentsToMap = (dependents: any[] = []) => {
  return dependents.reduce<FamilyMemberDetailsMap>((acc, dependent) => {
    if (!dependent) return acc;
    const relationType = dependent.relationshipType || dependent.relation;
    if (!relationType) return acc;

    const relation =
      relationType === SPOUSE_PARTNERS_PAYLOAD ? SPOUSE_PARTNERS : relationType;
    if (!relation) return acc;

    const formatted = {
      id: dependent.id, // Keep the backend provided id
      tempKey: dependent.tempKey, // Preserve tempKey if it exists
      name: dependent.name,
      relationship: dependent.relation || dependent.relationship,
      dateOfBirth: dependent.dateOfBirth,
      gender: dependent.gender || "",
      relationshipType: relationType,
      parentpolicyComponentActionTypeId:
        dependent.parentpolicyComponentActionTypeId ?? null,
      policyComponentActionTypeId:
        dependent.policyComponentActionTypeId ?? null,
      policyComponentActionLabel: dependent.policyComponentActionLabel ?? null,
      policyComponentActionType: dependent.policyComponentActionType ?? null,
      choices: Array.isArray(dependent.choices) ? dependent.choices : [],
      isManuallyAdded: Boolean(dependent.isManuallyAdded),
    };

    if (acc[relation]) {
      acc[relation] = [...acc[relation], formatted];
    } else {
      acc[relation] = [formatted];
    }

    return acc;
  }, {});
};

// Function to merge current family member details with backend response
// This updates tempKey dependents with their new IDs from backend
const mergeDependentsWithBackendResponse = (
  currentFamilyDetails: FamilyMemberDetailsMap,
  backendDependents: any[]
): FamilyMemberDetailsMap => {
  const normalizeText = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLowerCase();
  const buildFingerprint = (dependent: any) =>
    [
      normalizeText(dependent?.name),
      normalizeText(dependent?.relation ?? dependent?.relationship),
      normalizeText(dependent?.relationshipType),
      normalizeDateKey(dependent?.dateOfBirth),
    ].join("|");

  const backendByFingerprint = new Map<string, any>();
  backendDependents.forEach((dependent) => {
    if (!dependent) return;
    backendByFingerprint.set(buildFingerprint(dependent), dependent);
  });

  const currentArray = transformFamilyMembersToArray(currentFamilyDetails);
  const mergedArray = currentArray.map((currentDependent) => {
    if (currentDependent?.id) {
      return currentDependent;
    }

    const backendMatch = backendByFingerprint.get(
      buildFingerprint(currentDependent)
    );
    if (backendMatch?.id) {
      return {
        ...currentDependent,
        id: Number(backendMatch.id),
        tempKey: undefined,
      };
    }

    return currentDependent;
  });

  return transformDependentsToMap(mergedArray);
};

const buildChoiceIdentityKey = (item: any): string => {
  const policyId = Number(item?.policyId ?? 0);
  const actionType = String(
    item?.policyComponentActionType ?? ""
  ).toLowerCase();
  const actionTypeId = String(item?.policyComponentActionTypeId ?? "null");
  const parentActionTypeId = String(
    item?.parentpolicyComponentActionTypeId ?? "null"
  );
  const label = String(item?.policyComponentActionLabel ?? "")
    .trim()
    .toLowerCase();

  return [
    String(policyId),
    actionType,
    actionTypeId,
    parentActionTypeId,
    label,
  ].join("|");
};

const mergeDependentsForSubmitPayload = (
  dependents: any[] = [],
  allowedDependentIds?: Set<number>
) => {
  const dependentMap = new Map<string, any>();

  const buildPersonFingerprint = (dependent: any) =>
    `person:${String(dependent?.name ?? "")
      .trim()
      .toLowerCase()}|${String(dependent?.relation ?? "")
      .trim()
      .toLowerCase()}|${String(dependent?.relationshipType ?? "")
      .trim()
      .toLowerCase()}|${String(dependent?.gender ?? "")
      .trim()
      .toLowerCase()}|${String(dependent?.dateOfBirth ?? "").trim()}`;

  dependents.forEach((dependent) => {
    if (!dependent) return;

    const idKey =
      dependent?.id !== undefined && dependent?.id !== null
        ? `id:${String(dependent.id)}`
        : null;
    const parsedDependentId = Number(dependent?.id);
    const rawChoicesForDep = Array.isArray(dependent?.choices)
      ? dependent.choices
      : [];
    // Profile-only deps: added via profile page, no policy component assignment yet.
    // Their IDs must always be preserved so the backend doesn't silently drop them.
    const isProfileOnlyDep =
      rawChoicesForDep.length === 0 &&
      dependent?.policyComponentActionTypeId == null &&
      dependent?.policyComponentActionType == null;
    const canUseDependentId =
      Number.isFinite(parsedDependentId) &&
      (isProfileOnlyDep ||
        !allowedDependentIds ||
        // In combined-enrollment, relationship constraints may not include the
        // saved dependents list. When the allow-list is empty, do not strip IDs.
        allowedDependentIds.size === 0 ||
        allowedDependentIds.has(parsedDependentId));
    const fingerprintKey = buildPersonFingerprint(dependent);

    const rawChoiceEntries = Array.isArray(dependent?.choices)
      ? dependent.choices
      : [];

    const mappedChoiceEntries = rawChoiceEntries
      .map((choice: any) => ({
        policyComponentActionTypeId:
          choice?.policyComponentActionTypeId ?? null,
        policyComponentActionType: choice?.policyComponentActionType ?? null,
        parentpolicyComponentActionTypeId:
          choice?.parentpolicyComponentActionTypeId ?? null,
        policyComponentActionLabel: choice?.policyComponentActionLabel ?? null,
      }))
      .filter(
        (choiceEntry: any) =>
          choiceEntry.policyComponentActionTypeId !== null ||
          choiceEntry.policyComponentActionType !== null ||
          choiceEntry.parentpolicyComponentActionTypeId !== null ||
          choiceEntry.policyComponentActionLabel !== null
      );

    const fallbackChoiceEntry = {
      policyComponentActionTypeId:
        dependent?.policyComponentActionTypeId ?? null,
      policyComponentActionType: dependent?.policyComponentActionType ?? null,
      parentpolicyComponentActionTypeId:
        dependent?.parentpolicyComponentActionTypeId ?? null,
      policyComponentActionLabel: dependent?.policyComponentActionLabel ?? null,
    };

    if (
      mappedChoiceEntries.length === 0 &&
      (fallbackChoiceEntry.policyComponentActionTypeId !== null ||
        fallbackChoiceEntry.policyComponentActionType !== null ||
        fallbackChoiceEntry.parentpolicyComponentActionTypeId !== null ||
        fallbackChoiceEntry.policyComponentActionLabel !== null)
    ) {
      mappedChoiceEntries.push(fallbackChoiceEntry);
    }

    const existing =
      (idKey ? dependentMap.get(idKey) : null) ??
      dependentMap.get(fingerprintKey);

    if (!existing) {
      const primaryChoice = mappedChoiceEntries[0] ?? null;
      const created = {
        ...(canUseDependentId ? { id: parsedDependentId } : {}),
        name: dependent?.name,
        relation: dependent?.relation ?? dependent?.relationship ?? null,
        relationshipType: dependent?.relationshipType,
        dateOfBirth: dependent?.dateOfBirth,
        gender: dependent?.gender || "",
        parentpolicyComponentActionTypeId:
          primaryChoice?.parentpolicyComponentActionTypeId ??
          dependent?.parentpolicyComponentActionTypeId ??
          null,
        policyComponentActionTypeId:
          primaryChoice?.policyComponentActionTypeId ??
          dependent?.policyComponentActionTypeId ??
          null,
        policyComponentActionLabel:
          primaryChoice?.policyComponentActionLabel ??
          dependent?.policyComponentActionLabel ??
          null,
        policyComponentActionType:
          primaryChoice?.policyComponentActionType ??
          dependent?.policyComponentActionType ??
          null,
        choices: mappedChoiceEntries.map((choiceEntry: any) => ({
          ...choiceEntry,
          choiceKey: [
            String(choiceEntry.policyComponentActionTypeId ?? "null"),
            String(choiceEntry.policyComponentActionType ?? "null"),
            String(choiceEntry.parentpolicyComponentActionTypeId ?? "null"),
            String(choiceEntry.policyComponentActionLabel ?? "null"),
          ].join("|"),
        })),
        // Track that this dep was explicitly added via the form (not injected from profile).
        // Manually-added deps with no choices and no id must still be sent so the backend creates them.
        isManuallyAdded: Boolean(dependent?.isManuallyAdded),
      };

      dependentMap.set(fingerprintKey, created);
      if (idKey) {
        dependentMap.set(idKey, created);
      }
      return;
    }

    // Link both keys to the same object so id/no-id variants coalesce.
    dependentMap.set(fingerprintKey, existing);
    if (idKey) {
      dependentMap.set(idKey, existing);
      if (!existing.id && canUseDependentId) {
        existing.id = parsedDependentId;
      }
    }
    // If any occurrence was manually added, mark the merged entry as such.
    if (dependent?.isManuallyAdded) {
      existing.isManuallyAdded = true;
    }

    mappedChoiceEntries.forEach((choiceEntry: any) => {
      const choiceKey = [
        String(choiceEntry.policyComponentActionTypeId ?? "null"),
        String(choiceEntry.policyComponentActionType ?? "null"),
        String(choiceEntry.parentpolicyComponentActionTypeId ?? "null"),
        String(choiceEntry.policyComponentActionLabel ?? "null"),
      ].join("|");

      if (
        (existing.policyComponentActionTypeId == null ||
          existing.policyComponentActionType == null) &&
        (choiceEntry.policyComponentActionTypeId !== null ||
          choiceEntry.policyComponentActionType !== null)
      ) {
        existing.parentpolicyComponentActionTypeId =
          choiceEntry.parentpolicyComponentActionTypeId;
        existing.policyComponentActionTypeId =
          choiceEntry.policyComponentActionTypeId;
        existing.policyComponentActionLabel =
          choiceEntry.policyComponentActionLabel;
        existing.policyComponentActionType =
          choiceEntry.policyComponentActionType;
      }

      if (
        !existing.choices.some((choice: any) => choice.choiceKey === choiceKey)
      ) {
        existing.choices.push({ ...choiceEntry, choiceKey });
      }
    });
  });

  const lastArray = Array.from(new Set(dependentMap.values())).map(
    (dependent) => ({
      ...dependent,
      choices: dependent.choices.map((choice: any) => {
        const cleanChoice = { ...choice };
        delete cleanChoice.choiceKey;
        return cleanChoice;
      }),
    })
  );
  console.log("last array", lastArray);
  // Keep dependents that are either:
  // 1. Enrolled in at least one policy component (choices.length > 0) — standard case
  // 2. Already exist in the backend (have a valid numeric id) but are not checked for
  //    any policy — must be preserved so the backend doesn't delete them on save.
  //    If the user truly wants to remove them, they must be explicitly deleted.
  // 3. Were manually added via the FMM form (isManuallyAdded) but not yet saved —
  //    must be sent so the backend creates the dep record, even without choices.
  return lastArray
    .filter(
      (ele) =>
        ele.choices.length > 0 ||
        Number.isFinite(Number(ele?.id)) ||
        ele?.isManuallyAdded === true
    )
    .map((ele) => {
      // Strip the internal flag before sending to the backend.
      const { isManuallyAdded, ...rest } = ele;
      return rest;
    });
};

const buildRelationshipGroupPricingKey = (dependentsPayload: any[]) => {
  // DOB is intentionally excluded: the same person's DOB can differ by 1 day
  // across Base vs Top-up policy backend records (data inconsistency). Including
  // DOB makes Policy2's key change when you only touched Policy1, triggering an
  // unwanted refresh and causing the "Selected → Select" flip on the untouched policy.
  // relation + relationshipType + gender is sufficient to identify a pricing slot.
  const toSortable = (item: any) => ({
    relation: String(item?.relation ?? "").trim().toLowerCase(),
    relationshipType: String(item?.relationshipType ?? "").trim().toLowerCase(),
    gender: String(item?.gender ?? "").trim().toLowerCase(),
  });

  const normalized = (Array.isArray(dependentsPayload) ? dependentsPayload : [])
    .map(toSortable)
    // For pricing, name and DOB are irrelevant; key by identity fields only.
    .sort((a, b) => {
      const ak = `${a.relation}|${a.relationshipType}|${a.gender}`;
      const bk = `${b.relation}|${b.relationshipType}|${b.gender}`;
      return ak.localeCompare(bk);
    });

  return JSON.stringify(normalized);
};

const calculateFooterStats = (
  policyConfigurationData: any[],
  pendingSelections: any[],
  dependents: any[],
  overAllData?: any[],
  flattenedPolicies: any[] = [],
  employeeDateOfBirth?: unknown,
  employeeEffectiveDate?: unknown
) => {
  const actionablePolicyIds = new Set(
    flattenedPolicies
      .filter(
        (policy) =>
          policy?.status === PolicyStatus.CAN_ENROLL ||
          policy?.status === PolicyStatus.NOT_STARTED ||
          policy?.status === PolicyStatus.EDIT_ENROLL
      )
      .map((policy) => Number(policy?.policyId))
      .filter((policyId) => Number.isFinite(policyId))
  );
  const filteredByActionable =
    actionablePolicyIds.size > 0
      ? policyConfigurationData.filter((policy) =>
          actionablePolicyIds.has(Number(policy?.policyId))
        )
      : policyConfigurationData;

  // If actionable filtering removes everything (mixed states / already-enrolled policies),
  // fall back to summarizing the selected policies we have locally so the calculator
  // doesn't go blank while cards still show "Selected".
  const policiesToSummarize =
    filteredByActionable.length > 0 ? filteredByActionable : policyConfigurationData;
  const plansSelected = policiesToSummarize.filter(Boolean).length;
  const membersCover = dependents.length;

  const gmcPolicyIds = buildGmcPolicyIdSet(overAllData);

  return policiesToSummarize.reduce(
    (acc, policy) => {
      // 1️⃣ pick policy with priority
      if (!policy) return acc;

      const baseCompany = Number(
        policy.companyContribution ?? policy.companyPay ?? 0
      );
      const baseEmployee = Number(
        policy.employeeContribution ?? policy.employeePay ?? 0
      );

      // Per-life, age-bucket-aware premium when the matched parameter has
      // applyToDependents=true (e.g. plain "Age"); falls back to the flat
      // self-premium x headcount multiplier for every other case.
      const perLifePremium = resolveApplyToDependentsPremiumClient(
        policy,
        dependents,
        gmcPolicyIds,
        overAllData,
        employeeDateOfBirth,
        employeeEffectiveDate,
        flattenedPolicies
      );

      let company: number;
      let employee: number;
      if (perLifePremium) {
        company = perLifePremium.companyContribution;
        employee = perLifePremium.employeeContribution;
      } else {
        const premiumMultiplier = getDependentMultiplierForSelection(
          policy,
          dependents,
          gmcPolicyIds,
          overAllData
        );
        company = baseCompany * premiumMultiplier;
        employee = baseEmployee * premiumMultiplier;
      }
      const total = company + employee;

      return {
        plansSelected,
        membersCover,
        totalPremium: acc.totalPremium + total,
        companyPays: acc.companyPays + company,
        yourPay: acc.yourPay + employee,
      };
    },
    {
      plansSelected,
      membersCover,
      totalPremium: 0,
      companyPays: 0,
      yourPay: 0,
    }
  );
};

const calculateEnrollmentSummary = (
  policyConfigurationData: any[],
  overAllData: any[],
  dependents: any[],
  flattenedPolicies: any[] = [],
  employeeDateOfBirth?: unknown,
  employeeEffectiveDate?: unknown
) => {
  const resolveGstConfig = (source: any) => {
    const DEFAULT = {
      applicable: true,
      showToEmployee: true,
      rate: 0.18,
    };

    const constraints = Array.isArray(source)
      ? source.find((item) => item?.configuration?.constraints)?.configuration
          ?.constraints
      : source?.configuration?.constraints;

    if (!constraints) return DEFAULT;

    return {
      applicable: constraints.gstApplicable !== false,
      showToEmployee: constraints.showGstToEmployee !== false,
      rate: DEFAULT.rate,
    };
  };

  const round2 = (n: number) => Math.round(n * 100) / 100;

  if (!policyConfigurationData || policyConfigurationData.length === 0) {
    return {
      sections: [],
      summary: {
        user: { base: 0, gst: 0, total: 0 },
        company: { base: 0, gst: 0, total: 0 },
        totalCoverage: 0,
      },
      gstConfig: resolveGstConfig(overAllData),
    };
  }

  const gmcPolicyIds = buildGmcPolicyIdSet(overAllData);
  const actionablePolicyIds = new Set(
    flattenedPolicies
      .filter(
        (policy) =>
          policy?.status === PolicyStatus.CAN_ENROLL ||
          policy?.status === PolicyStatus.NOT_STARTED ||
          policy?.status === PolicyStatus.EDIT_ENROLL
      )
      .map((policy) => Number(policy?.policyId))
      .filter((policyId) => Number.isFinite(policyId))
  );
  const policiesToSummarize =
    actionablePolicyIds.size > 0
      ? policyConfigurationData.filter((policy) =>
          actionablePolicyIds.has(Number(policy?.policyId))
        )
      : policyConfigurationData;

  // Use a Map to ensure deduplication by policyId + policyType combination
  const sectionsMap = new Map();

  const sections = policiesToSummarize
    .map((policy, index) => {
      if (!policy) return null;

      const baseCompany = Number(
        policy.companyContribution ?? policy.companyPay ?? 0
      );
      const baseEmployee = Number(
        policy.employeeContribution ?? policy.employeePay ?? 0
      );
      const showCompanyContribution = policy?.showCompanyContribution === true;
      // Per-life, age-bucket-aware premium when the matched parameter has
      // applyToDependents=true (e.g. plain "Age"); falls back to the flat
      // self-premium x headcount multiplier for every other case.
      const perLifePremium = resolveApplyToDependentsPremiumClient(
        policy,
        dependents,
        gmcPolicyIds,
        overAllData,
        employeeDateOfBirth,
        employeeEffectiveDate,
        flattenedPolicies
      );
      let companyPay: number;
      let employeePay: number;
      if (perLifePremium) {
        companyPay = perLifePremium.companyContribution;
        employeePay = perLifePremium.employeeContribution;
      } else {
        const premiumMultiplier = getDependentMultiplierForSelection(
          policy,
          dependents,
          gmcPolicyIds,
          overAllData
        );
        companyPay = baseCompany * premiumMultiplier;
        employeePay = baseEmployee * premiumMultiplier;
      }
      const totalPremium = companyPay + employeePay;
      const sumInsured = Number(policy.rawSumInsured ?? policy.sumInsured ?? 0);

      // Get policy type (base, addon, parental)
      const policyType = policy.policyComponentActionType || "base";

      // Get category label from backend (policyComponentActionLabel or label)
      // Fallback to deriving from policyComponentActionType
      let categoryPrefix = policy.policyComponentActionLabel || policy.label;

      // Keep normalized key for ordering, but show full policy name in calculator titles.
      const policyTypeKey = policy.policyTypeKey || policy.policyName || "";
      const policyDisplayName =
        policy.policyName || normalizePolicyTypeKey(policyTypeKey);
      const policyTitle = `${categoryPrefix} (${policyDisplayName})`;

      // Create unique key for deduplication per policy component.
      const deduplicationKey = [
        policy.policyId,
        policyType,
        policy.policyComponentActionTypeId ?? "null",
        policy.parentpolicyComponentActionTypeId ?? "null",
        policy.policyComponentActionLabel ?? "",
      ].join("|");

      const sectionData = {
        id: `policy-${index}`,
        title: policyTitle,
        policyId: policy.policyId, // Add policyId for reliable matching
        policyTypeKey: policyTypeKey,
        policyType: policyType,
        policyComponentActionType: policy.policyComponentActionType || null,
        policyComponentActionTypeId: policy.policyComponentActionTypeId ?? null,
        parentpolicyComponentActionTypeId:
          policy.parentpolicyComponentActionTypeId ?? null,
        policyComponentActionLabel: policy.policyComponentActionLabel ?? null,
        count: 1,
        totalPremium: round2(totalPremium),
        defaultExpanded: false,
        details: {
          enhancedCoverage: round2(sumInsured),
          youPay: round2(employeePay),
          companyPay: showCompanyContribution ? round2(companyPay) : null,
          totalPremium: round2(totalPremium),
        },
        // Add metadata for debugging
        isReplacement: policy.isReplacement || false,
        updatedAt: policy.updatedAt || Date.now(),
        deduplicationKey: deduplicationKey,
      };

      return sectionData;
    })
    .filter(Boolean);

  // Deduplicate sections by policyId + policyType
  sections.forEach((section) => {
    if (section) {
      const existingSection = sectionsMap.get(section.deduplicationKey);

      if (existingSection) {
        // If there's already a section with this key, keep the newer one (higher updatedAt)
        if (section.updatedAt >= existingSection.updatedAt) {
          console.log(
            "Replacing duplicate section for key: %s",
            section.deduplicationKey,
            {
              old: existingSection,
              new: section,
            }
          );
          sectionsMap.set(section.deduplicationKey, section);
        } else {
          console.log(
            "Keeping existing section for key: %s",
            section.deduplicationKey,
            {
              existing: existingSection,
              discarded: section,
            }
          );
        }
      } else {
        sectionsMap.set(section.deduplicationKey, section);
      }
    }
  });

  // Convert map back to array
  const deduplicatedSections = Array.from(sectionsMap.values());

  const totalEmployeeBase = deduplicatedSections.reduce(
    (sum, section) => sum + section.details.youPay,
    0
  );
  const totalCompanyBase = deduplicatedSections.reduce(
    (sum, section) => sum + section.details.companyPay,
    0
  );
  const totalCoverage = deduplicatedSections.reduce(
    (sum, section) => sum + section.details.enhancedCoverage,
    0
  );

  const gstConfig = resolveGstConfig(overAllData);
  const GST_RATE = gstConfig.rate;
  const employeeGst = gstConfig.applicable
    ? round2(totalEmployeeBase * GST_RATE)
    : 0;
  const companyGst = gstConfig.applicable
    ? round2(totalCompanyBase * GST_RATE)
    : 0;

  return {
    sections: deduplicatedSections,
    summary: {
      user: {
        base: round2(totalEmployeeBase),
        gst: employeeGst,
        total: round2(totalEmployeeBase + employeeGst),
      },
      company: {
        base: round2(totalCompanyBase),
        gst: companyGst,
        total: round2(totalCompanyBase + companyGst),
      },
      totalCoverage: round2(totalCoverage),
    },
    gstConfig,
  };
};

function MultiEnrollment() {
  const subdomain = window.location.hostname.split(".")[0];
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeId = userDetails?.id;
  const companyId = userDetails?.employeeCompanyId;
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { localizationData } = useLocalization();
  const shouldOpenSummaryFromNavigation = Boolean(location.state?.openSummary);
  const isSummaryViewOnlyFromNavigation = Boolean(location.state?.isViewOnly);

  const policyId = location.state?.policyInfo?.policyId;
  const policyTypeKey = location.state?.policyInfo?.policyTypeKey;
  const isPolicyAlreadyEnrolled =
    location.state?.policyInfo?.isEditable ?? false;

  const [step, setStep] = useState<EnrollmentStep>(
    EnrollmentStep.Configuration
  );
  const [verificationStep, setVerificationStep] = useState<VerificationStep>(
    VerificationStep.SelectMethod
  );
  const [selectedOtpMethod, setSelectedOtpMethod] = useState<
    "mobile" | "email" | null
  >(null);
  const [isSendingVerificationOtp, setIsSendingVerificationOtp] =
    useState(false);
  const [isVerifyingVerificationOtp, setIsVerifyingVerificationOtp] =
    useState(false);
  const [isVerificationResendDisabled, setIsVerificationResendDisabled] =
    useState(false);
  const [verificationResendCountdown, setVerificationResendCountdown] =
    useState(0);
  const [submissionMeta, setSubmissionMeta] = useState<{
    referenceNumber?: string | null;
    submissionCount?: number | string | null;
  } | null>(null);
  const { authMethods } = useAuthConfig();
  const [policyConfigurationData, setPolicyConfigurationData] = useState<any[]>(
    []
  );
  const [familyMemberDetails, setFamilyMemberDetails] =
    useState<FamilyMemberDetailsMap>({});
  const [overAllData, setOverAllData] = useState<any>();
  const [loading, setLoading] = useState(false);
  const acceptedDisclaimersRef = useRef<DisclaimerAccepted[]>([]);
  // GPA / parental lock-in acknowledgements from the enrollment flow, kept in
  // sync with the live checkboxes and folded into disclaimersAccepted at submit.
  const ackDisclaimersRef = useRef<
    { policyId: number; text: string; isMandatory: boolean }[]
  >([]);
  const [policyComponentLoadingByKey, setPolicyComponentLoadingByKey] =
    useState<Record<string, boolean>>({});
  const isPolicyComponentsLoading = useMemo(
    () => Object.values(policyComponentLoadingByKey).some(Boolean),
    [policyComponentLoadingByKey],
  );
  const [initialPolicyConfigurationData, setInitialPolicyConfigurationData] =
    useState<any[]>([]);
  const [isDependentsModified, setIsDependentsModified] = useState(false);
  const [shouldResetSelections, setShouldResetSelections] = useState(false);
  const [resetSelectionPolicyIds, setResetSelectionPolicyIds] = useState<
    number[]
  >([]);
  const lastRelationshipGroupPayloadByPolicyRef = useRef<Record<string, string>>(
    {}
  );
  const relationshipGroupRefreshPendingRef = useRef(0);
  const relationshipGroupResetPendingRef = useRef(false);
  const relationshipGroupResetPolicyIdsRef = useRef<number[]>([]);
  const relationshipGroupLoadingKeyByPolicyIdRef = useRef<Record<number, string>>(
    {},
  );
  const lastReconstructedChoicesRef = useRef<any[] | null>(null);
  const saveHadCombinedChoicesRef = useRef(false);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [groupMediclaimPolicy, setGroupMediclaimPolicy] = useState(null);
  // Map of policyId → policy data for every policy that has dependent/relation support.
  // Used to render FamilyMembersManagement inside each eligible policy accordion.
  const [policiesWithDependents, setPoliciesWithDependents] = useState<Record<number, any>>({});
  const [initialFamilyMemberDetails, setInitialFamilyMemberDetails] =
    useState<FamilyMemberDetailsMap>({});
  const [profileOnlyDependents, setProfileOnlyDependents] = useState<any[]>([]);
  const [deletedProfileOnlyIds, setDeletedProfileOnlyIds] = useState<Set<number>>(new Set());
  const [deletedProfileOnlyFingerprints, setDeletedProfileOnlyFingerprints] =
    useState<Set<string>>(new Set());

  const handleProfileSuggestedDepDeleted = useCallback((dep: any) => {
    const fingerprint = buildDependentFingerprint(dep);
    if (fingerprint) {
      setDeletedProfileOnlyFingerprints(
        (prev) => new Set([...prev, fingerprint]),
      );
    }

    setDeletedProfileOnlyIds((prev) => {
      const next = new Set(prev);
      const numericDepId = Number(dep?.id);
      if (Number.isFinite(numericDepId)) {
        next.add(numericDepId);
      }

      if (fingerprint) {
        profileOnlyDependents.forEach((existingDep: any) => {
          if (buildDependentFingerprint(existingDep) !== fingerprint) return;
          const existingId = Number(existingDep?.id);
          if (Number.isFinite(existingId)) {
            next.add(existingId);
          }
        });
      }

      return next;
    });
  }, [profileOnlyDependents]);

  // Filter out deleted deps so all FMM instances never re-inject them.
  const activeProfileSuggestedDependents = useMemo(
    () =>
      profileOnlyDependents.filter((d: any) => {
        const id = Number(d?.id);
        if (Number.isFinite(id) && deletedProfileOnlyIds.has(id)) {
          return false;
        }

        const fingerprint = buildDependentFingerprint(d);
        if (fingerprint && deletedProfileOnlyFingerprints.has(fingerprint)) {
          return false;
        }

        return true;
      }),
    [deletedProfileOnlyFingerprints, deletedProfileOnlyIds, profileOnlyDependents]
  );
  const [isRefreshingPolicies, setIsRefreshingPolicies] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(false);
  const relationConstraints = useSelector(
    (state: any) => state.policyData.relationDependentData
  );
  const passwordMethodCodes = [
    "EMAIL_PASSWORD",
    "PHONE_PASSWORD",
    "USERNAME_PASSWORD",
  ];
  const passwordMethods = authMethods.filter(
    (method) =>
      passwordMethodCodes.includes(method.methodCode) && method.isEnabled
  );

  const normalizeOtpDeliveryMethod = (
    method?: string
  ): "email" | "mobile" | "both" | null => {
    const normalized = String(method || "")
      .trim()
      .toLowerCase();
    if (normalized === "email") return "email";
    if (["sms", "mobile", "phone", "phonenumber"].includes(normalized)) {
      return "mobile";
    }
    if (normalized === "both") return "both";
    return null;
  };

  const getPasswordMethodForDelivery = (channel: "email" | "mobile") => {
    return passwordMethods.find((pm) => {
      const raw =
        pm?.configuration?.passwordConfig?.twoFactorAuthentication
          ?.otpDeliveryMethod ??
        pm?.configuration?.twoFactorAuthentication?.otpDeliveryMethod;
      const normalized = normalizeOtpDeliveryMethod(raw);
      if (!normalized) return false;
      if (normalized === "both") return true;
      return normalized === channel;
    });
  };

  const allowedVerificationMethods = useMemo(() => {
    const methods = new Set<"email" | "mobile">();
    for (const pm of passwordMethods) {
      const raw =
        pm?.configuration?.passwordConfig?.twoFactorAuthentication
          ?.otpDeliveryMethod ??
        pm?.configuration?.twoFactorAuthentication?.otpDeliveryMethod;
      const normalized = normalizeOtpDeliveryMethod(raw);
      if (normalized === "email") methods.add("email");
      else if (normalized === "mobile") methods.add("mobile");
      else if (normalized === "both") {
        methods.add("email");
        methods.add("mobile");
      }
    }
    if (methods.has("mobile") && methods.has("email"))
      return ["mobile", "email"] as const;
    if (methods.has("email")) return ["email"] as const;
    if (methods.has("mobile")) return ["mobile"] as const;
    return [] as const;
  }, [authMethods]);

  useEffect(() => {
    if (allowedVerificationMethods.length === 0) {
      setSelectedOtpMethod(null);
      return;
    }
    if (!selectedOtpMethod) return;
    if (!allowedVerificationMethods.includes(selectedOtpMethod)) {
      setSelectedOtpMethod(allowedVerificationMethods[0]);
    }
  }, [allowedVerificationMethods, selectedOtpMethod]);

  // 🔥 Enrollment Progress Tracking - Fetch current progress
  const { data: enrollmentProgressData } = useApiQuery({
    queryKey: ["enrollmentProgress", employeeId],
    url: employeeId ? endPoints.enrollmentProgress(employeeId) : "",
    enabled: Boolean(employeeId),
  });

  // Store enrollmentBatchKey when fetched
  useEffect(() => {
    if (!enrollmentProgressData || !employeeId) return;

    const payload = enrollmentProgressData as {
      data?: {
        enrollmentBatchKey?: string;
      };
    };

    if (payload?.data?.enrollmentBatchKey) {
      const key = payload.data.enrollmentBatchKey;
      sessionStorage.setItem(`enrollment_batch_key_${employeeId}`, key);
    }
  }, [enrollmentProgressData, employeeId]);

  // Mutation to update enrollment progress
  const { mutate: updateEnrollmentProgress } = useApiMutation({
    config: {
      onSuccess: () => {
        console.log("Enrollment progress updated");
      },
      onError: (error: any) => {
        console.error("Enrollment progress update failed:", error);
      },
    },
  });

  // Helper function to update enrollment step (wrapped in useCallback to stabilize reference)
  const updateEnrollmentStep = useCallback(
    (stepName: string, completed: boolean) => {
      const enrollmentBatchKey = sessionStorage.getItem(
        `enrollment_batch_key_${employeeId}`
      );

      if (!enrollmentBatchKey || !employeeId) {
        console.warn(
          "Enrollment update skipped: missing enrollmentBatchKey or employeeId"
        );
        return;
      }

      updateEnrollmentProgress({
        endpoint: endPoints.updateEnrollmentProgress(employeeId),
        method: "PUT",
        data: {
          enrollmentBatchKey,
          stepName,
          completed,
        },
      });
    },
    [employeeId, updateEnrollmentProgress]
  );

  // Auto-complete reviewBenefits step when landing on this page
  useEffect(() => {
    const enrollmentBatchKey = sessionStorage.getItem(
      `enrollment_batch_key_${employeeId}`
    );

    if (!enrollmentBatchKey || !employeeId) {
      return;
    }

    const payload = enrollmentProgressData as {
      data?: {
        steps?: Array<{ name: string; completed: boolean }>;
      };
    };

    const reviewBenefitsStep = payload?.data?.steps?.find(
      (s: any) => s.name === "reviewBenefits"
    );

    if (reviewBenefitsStep?.completed) {
      return;
    }

    console.log("Auto-completing reviewBenefits step");
    updateEnrollmentStep("reviewBenefits", true);
  }, [employeeId, enrollmentProgressData, updateEnrollmentStep]);

  const [pendingSelections, setPendingSelections] = useState<(any | null)[]>(
    []
  );
  const [componentSelectionStateByKey, setComponentSelectionStateByKey] =
    useState<Record<string, boolean>>({});

  const policiesData = useSelector(
    (state: any) => state.policyData.policiesData
  );
  const isLoading = useSelector((state: any) => state.policyData.loading);
  const [allBasePoliciesEnrolled, setAllBasePoliciesEnrolled] = useState(false);
  const [hasAllCompulsoryOptionsSelected, setHasAllCompulsoryOptionsSelected] =
    useState(true);

  const flattenedPolicies = useMemo(
    () => flattenPoliciesWithStatus(policiesData),
    [policiesData]
  );

  const { data: employeeDetailsResponse } = useApiQuery({
    queryKey: ["employeeDetails", employeeId],
    url: employeeId ? endPoints.employeeDetails : "",
    enabled: Boolean(employeeId),
  });

  const employeeDateOfBirth = useMemo(() => {
    const payload = employeeDetailsResponse as any;
    const details = payload?.data?.data ?? payload?.data ?? payload;
    return details?.dateOfBirth ?? details?.dob ?? null;
  }, [employeeDetailsResponse]);

  const employeeEffectiveDate = useMemo(() => {
    const payload = employeeDetailsResponse as any;
    const additionalDetails =
      payload?.data?.additionalDetails ??
      payload?.data?.data?.additionalDetails;
    // Mirrors the backend's own COALESCE order for this value
    // (hr.repository.ts: 'Effective Date' then 'dateOfJoining'), since
    // additionalDetails is company-configured free-form JSON.
    return (
      additionalDetails?.["Effective Date"] ??
      null
    );
  }, [employeeDetailsResponse]);
  console.log(employeeEffectiveDate, "employeeEffectiveDate");

  // Payroll installments are derived, not configured: the inclusive month span
  // from the employee's effective date to each policy's end date. `additionalDetails`
  // is company-configured free-form JSON, so the effective date can be absent —
  // in that case the policy's own start date is used, which is the correct span
  // for anyone who was already effective when the policy period began.
  //
  // Policies in a single submission can end on different dates while this panel
  // shows one combined premium, so the largest span is used and the copy stays
  // accurate for the longest-running policy. See the per-policy declarations on
  // the summary page for each policy's own count.
  // The configured installment cap lives on relationDependentData (the policy
  // CONFIGURATION), not on the policies list — that payload has no
  // `configuration` key, so reading it off flattenedPolicies always yields
  // undefined and the cap silently never applies.
  const configuredInstallmentsByPolicyId = useMemo(() => {
    const map = new Map<string, unknown>();
    (Array.isArray(relationConstraints) ? relationConstraints : []).forEach(
      (policy: any) => {
        if (policy?.policyId != null) {
          map.set(
            String(policy.policyId),
            policy?.configuration?.constraints?.payrollInstallments
          );
        }
      }
    );
    return map;
  }, [relationConstraints]);

  const payrollInstallments = useMemo(() => {
    const counts = (flattenedPolicies ?? []).map((policy: any) =>
      getPayrollInstallments(
        employeeEffectiveDate ?? policy?.startDate,
        policy?.dueDate,
        configuredInstallmentsByPolicyId.get(
          String(policy?.policyId)
        ) as number | undefined
      )
    );
    return counts.length > 0 ? Math.max(...counts) : 1;
  }, [
    flattenedPolicies,
    employeeEffectiveDate,
    configuredInstallmentsByPolicyId,
  ]);

  const policyOptions = useMemo(() => {
    if (!overAllData) return [];
    return generatePolicyStructureForSingleEnrollment(
      overAllData?.configuration?.policyComponentsConfiguration
    );
  }, [overAllData]);

  const overAllDataForFlow = useMemo(() => {
    if (!Array.isArray(overAllData)) {
      return overAllData;
    }

    return overAllData.map((policy: any) => {
      const showEmployeeContribution =
        policy?.configuration?.constraints?.showEmployeeContribution === true;
      const components =
        policy?.configuration?.policyComponentsConfiguration?.components || [];

      return {
        ...policy,
        configuration: {
          ...policy?.configuration,
          policyComponentsConfiguration: {
            ...policy?.configuration?.policyComponentsConfiguration,
            components: components.map((component: any) => ({
              ...component,
              // Both flags must be true to show company contribution and premium.
              // If either the constraint-level flag (showEmployeeContribution) OR
              // the component-level flag (showCompanyContribution) is false → hide.
              showCompanyContribution:
                showEmployeeContribution &&
                component?.showCompanyContribution === true,
            })),
          },
        },
      };
    });
  }, [overAllData]);

  const hasActionablePolicies = useMemo(
    () =>
      flattenedPolicies.some(
        (policy) =>
          policy.status === PolicyStatus.CAN_ENROLL ||
          policy.status === PolicyStatus.NOT_STARTED ||
          policy.status === PolicyStatus.EDIT_ENROLL
      ),
    [flattenedPolicies]
  );

  const shouldAutoOpenLockedSummary = useMemo(() => {
    const employeePolicies = policiesData?.employeePolicies ?? [];
    const enrolledPolicies = policiesData?.enrolledPolicies ?? [];

    if (employeePolicies.length > 0 || enrolledPolicies.length === 0) {
      return false;
    }

    return (
      !hasActionablePolicies &&
      flattenedPolicies.length > 0 &&
      flattenedPolicies.every((policy) => policy.status === PolicyStatus.LOCKED)
    );
  }, [flattenedPolicies, hasActionablePolicies, policiesData]);

  const shouldRenderSummaryInitially =
    shouldOpenSummaryFromNavigation || shouldAutoOpenLockedSummary;
  const isSummaryViewOnly =
    isSummaryViewOnlyFromNavigation || shouldAutoOpenLockedSummary;

  useEffect(() => {
    setIsReadOnly(false);
  }, [location.state?.policyInfo?.isEditable]);

  useEffect(() => {
    if (!shouldRenderSummaryInitially) {
      return;
    }
    // Do not interrupt the confirmation page that is shown immediately after
    // a successful enrollment submission. The policy refresh triggered by the
    // submit flow causes all policies to appear LOCKED, which would normally
    // flip shouldAutoOpenLockedSummary → true and reset the step mid-render.
    if (verificationStep === VerificationStep.Success) {
      return;
    }
    setStep(EnrollmentStep.Summary);
    if (isSummaryViewOnly) {
      setIsReadOnly(true);
    }
  }, [isSummaryViewOnly, shouldRenderSummaryInitially, verificationStep]);

  useEffect(() => {
    if (!employeeId) {
      dispatch(setToastMessage(TOAST_MESSAGES.IDENTIFIERS_MISSING));
      navigate("/");
    }
  }, [dispatch, employeeId, navigate]);

  useEffect(() => {
    if (!employeeId) {
      return;
    }
    setIsRefreshingPolicies(true);
    dispatch(fetchEmployeePolicies()).finally(() => {
      setIsRefreshingPolicies(false);
    });
  }, [dispatch, employeeId]);

  useEffect(() => {
    if (
      isRefreshingPolicies ||
      isLoading ||
      !relationConstraints ||
      !Array.isArray(relationConstraints)
    )
      return;

    // Set the overall data as the entire array
    setOverAllData(relationConstraints);

    // Find all policies that have dependent/relation support (any enabled non-Self relation).
    const policiesWithDependentSupport = relationConstraints.filter(hasDependentRelations);

    // Build the policiesWithDependents map (policyId → policy data) used by EnrollmentFlow
    // to render FamilyMembersManagement inside each eligible policy accordion.
    const newPoliciesWithDependents: Record<number, any> = {};
    policiesWithDependentSupport.forEach((policy: any) => {
      newPoliciesWithDependents[Number(policy.policyId)] = policy;
    });
    setPoliciesWithDependents(newPoliciesWithDependents);

    // Keep groupMediclaimPolicy for backward compatibility with the isRelationshipGroup=true
    // API flow (the updatePoliciesData call below). Do NOT change that flow.
    // Use exact match for POLICY_TYPE_GMC — includes() would also match POLICY_TYPE_GMC_TOP-UP.
    const groupMediclaimPolicyDataFromApi = relationConstraints.find(
      (policy) =>
        policy.policyTypeKey === "POLICY_TYPE_GMC" ||
        policy.policyName === "GMC"
    );
    if (groupMediclaimPolicyDataFromApi) {
      setGroupMediclaimPolicy(groupMediclaimPolicyDataFromApi);
    }

    // Load dependents from ALL policies that have dependent support, not just GMC.
    if (policiesWithDependentSupport.length > 0) {
      const allComponentIds = new Set<number>(
        policiesWithDependentSupport.flatMap((policy: any) =>
          (policy.configuration?.policyComponentsConfiguration?.components || [])
            .map((component: any) => Number(component?.id))
            .filter((id: number) => Number.isFinite(id))
        )
      );

      const allDependentsRaw: any[] = policiesWithDependentSupport.flatMap((policy: any) =>
        Array.isArray(policy.configuration?.dependents)
          ? policy.configuration.dependents
          : []
      );

      let dependentsSource: any[] = allDependentsRaw.filter(
        (dep: any) => Array.isArray(dep?.choices) && dep.choices.length > 0
      );

      dependentsSource = mergeDependentsByPersonFuzzyDob(dependentsSource);

      const profileOnlyRaw = allDependentsRaw.filter(
        (dep: any) => !Array.isArray(dep?.choices) || dep.choices.length === 0
      );
      const seenProfileIds = new Set<string>();
      const dedupedProfileOnly = profileOnlyRaw.filter((dep: any) => {
        const key = String(dep?.id ?? dep?.name ?? JSON.stringify(dep));
        if (seenProfileIds.has(key)) return false;
        seenProfileIds.add(key);
        return true;
      });
      setProfileOnlyDependents(dedupedProfileOnly);

      // Recovery: if the dependents arrays are empty but component IDs exist,
      // search all policies for dependents referencing those component IDs.
      if (dependentsSource.length === 0 && allComponentIds.size > 0) {
        const recoveredDependents = relationConstraints
          .flatMap((policy: any) =>
            Array.isArray(policy?.configuration?.dependents)
              ? policy.configuration.dependents
              : []
          )
          .filter((dependent: any) => {
            const referencedComponentIds = new Set<number>();
            const collect = (value: unknown) => {
              const id = Number(value);
              if (Number.isFinite(id)) {
                referencedComponentIds.add(id);
              }
            };

            collect(dependent?.policyComponentActionTypeId);
            collect(dependent?.parentpolicyComponentActionTypeId);

            if (Array.isArray(dependent?.choices)) {
              dependent.choices.forEach((choice: any) => {
                collect(choice?.policyComponentActionTypeId);
                collect(choice?.parentpolicyComponentActionTypeId);
              });
            }

            return Array.from(referencedComponentIds).some((id) =>
              allComponentIds.has(id)
            );
          });

        if (recoveredDependents.length > 0) {
          dependentsSource = recoveredDependents;
        }
      }

      // If recovery was used to populate dependentsSource, also extract profile-only from recovered
      if (dependentsSource.length > 0 && dedupedProfileOnly.length === 0) {
        const seenRecoveryIds = new Set<string>();
        const recoveryProfileOnly = dependentsSource
          .filter((dep: any) => !Array.isArray(dep?.choices) || dep.choices.length === 0)
          .filter((dep: any) => {
            const key = String(dep?.id ?? dep?.name ?? JSON.stringify(dep));
            if (seenRecoveryIds.has(key)) return false;
            seenRecoveryIds.add(key);
            return true;
          });
        if (recoveryProfileOnly.length > 0) {
          setProfileOnlyDependents(recoveryProfileOnly);
          dependentsSource = dependentsSource.filter(
            (dep: any) => Array.isArray(dep?.choices) && dep.choices.length > 0
          );
        }
      }

      const relationDetails = transformDependentsToMap(dependentsSource);
      setFamilyMemberDetails((prev) =>
        dedupeFamilyMemberDetailsMap(
          mergeDependentsMapPreferMapped(relationDetails, prev || {}),
        )
      );
      setInitialFamilyMemberDetails((prev) =>
        dedupeFamilyMemberDetailsMap(
          mergeDependentsMapPreferMapped(relationDetails, prev || {}),
        )
      );
    }
  }, [isLoading, isRefreshingPolicies, relationConstraints]);

  const completeRelationshipGroupRefresh = useCallback(() => {
    relationshipGroupRefreshPendingRef.current = Math.max(
      0,
      relationshipGroupRefreshPendingRef.current - 1
    );

    if (relationshipGroupRefreshPendingRef.current > 0) {
      return;
    }

    setPolicyComponentLoadingByKey({});
    relationshipGroupLoadingKeyByPolicyIdRef.current = {};

    if (relationshipGroupResetPendingRef.current) {
      setResetSelectionPolicyIds(
        Array.from(new Set(relationshipGroupResetPolicyIdsRef.current)).filter(
          (id) => Number.isFinite(id)
        )
      );
      setShouldResetSelections(true);
      setIsDependentsModified(false);
      relationshipGroupResetPendingRef.current = false;
      relationshipGroupResetPolicyIdsRef.current = [];
    }
  }, []);

  const beginRelationshipGroupRefreshBatch = useCallback(
    (
      count: number,
      shouldResetSelectionsAfter: boolean,
      policyIdsToReset: number[],
      componentKeysToLoad: string[]
    ) => {
      if (count <= 0) {
        return;
      }

      relationshipGroupRefreshPendingRef.current += count;
      setPolicyComponentLoadingByKey((prev) => {
        const next = { ...(prev || {}) };
        componentKeysToLoad.forEach((key) => {
          if (key) next[key] = true;
        });
        return next;
      });

      if (shouldResetSelectionsAfter) {
        relationshipGroupResetPendingRef.current = true;
        relationshipGroupResetPolicyIdsRef.current = policyIdsToReset;
      }
    },
    []
  );

  const { mutate: updatePoliciesData } = useApiMutation({
    config: {
      onSuccess: (updatedData: any, variables: any) => {
        const requestedPolicyId = Number(variables?.data?.policyId);
        const nextPolicyComponentsConfig =
          updatedData?.data?.policyComponentsConfiguration;
        const nextEnrollmentChoices = updatedData?.data?.enrollmentChoicesMade;

        if (Number.isFinite(requestedPolicyId)) {
          const loadingKey =
            relationshipGroupLoadingKeyByPolicyIdRef.current[requestedPolicyId];
          if (loadingKey) {
            setPolicyComponentLoadingByKey((prev) => {
              const next = { ...(prev || {}) };
              delete next[loadingKey];
              return next;
            });
            delete relationshipGroupLoadingKeyByPolicyIdRef.current[requestedPolicyId];
          }
        }

        if (Number.isFinite(requestedPolicyId)) {
          setOverAllData((prev: any[]) =>
            Array.isArray(prev)
              ? prev.map((policy) => {
                  if (Number(policy?.policyId) !== requestedPolicyId) {
                    return policy;
                  }

                  return {
                    ...policy,
                    configuration: {
                      ...policy.configuration,
                      policyComponentsConfiguration:
                        nextPolicyComponentsConfig &&
                        typeof nextPolicyComponentsConfig === "object"
                          ? nextPolicyComponentsConfig
                          : policy.configuration?.policyComponentsConfiguration,
                      employeeChosenChoices: Array.isArray(nextEnrollmentChoices)
                        ? nextEnrollmentChoices
                        : policy.configuration?.employeeChosenChoices || [],
                    },
                  };
                })
              : prev
          );
        }

        completeRelationshipGroupRefresh();
      },
      onError: (error: any, variables: any) => {
        const requestedPolicyId = Number(variables?.data?.policyId);
        if (Number.isFinite(requestedPolicyId)) {
          const loadingKey =
            relationshipGroupLoadingKeyByPolicyIdRef.current[requestedPolicyId];
          if (loadingKey) {
            setPolicyComponentLoadingByKey((prev) => {
              const next = { ...(prev || {}) };
              delete next[loadingKey];
              return next;
            });
            delete relationshipGroupLoadingKeyByPolicyIdRef.current[requestedPolicyId];
          }
        }
        dispatch(
          setToastMessage(
            Array.isArray(error?.message)
              ? error.message[0]
              : error?.message || ALERT_MESSAGES.GENERIC_ERROR
          )
        );
        completeRelationshipGroupRefresh();
      },
    },
  });

  const { mutate: saveEnrollment } = useApiMutation({
    config: {
      onSuccess: async (data: any, variables: any) => {
        const action = variables?.data?.action;
        setLoading(false);

        // Update family member details with IDs from backend response
        if (data?.data?.dependents) {
          const updatedFamilyDetails = mergeDependentsWithBackendResponse(
            familyMemberDetails,
            data.data.dependents
          );
          setFamilyMemberDetails(dedupeFamilyMemberDetailsMap(updatedFamilyDetails));
          // Reset the modified flag after successful save
          setIsDependentsModified(false);
        }

        // Track enrollment progress based on action (BEFORE navigation)
        if (action === "save") {
          // Save & Exit: Complete selectTopUps and addDependents steps only if combinedChoices was non-empty
          if (saveHadCombinedChoicesRef.current) {
            console.log(
              "Enrollment: Completing selectTopUps and addDependents (Save & Exit)"
            );
            updateEnrollmentStep("selectTopUps", true);
            updateEnrollmentStep("addDependents", true);
          }

          dispatch(fetchEmployeePolicies());
          dispatch(setToastMessage(TOAST_MESSAGES.ENROLLMENT_SAVE));

          // Wait for step updates to complete before navigation
          setTimeout(() => {
            navigate("/");
          }, 500);
        }

        if (action === "submit") {
          setSubmissionMeta({
            referenceNumber:
              data?.data?.referenceNumber ?? data?.referenceNumber ?? null,
            submissionCount:
              data?.data?.submissionCount ?? data?.submissionCount ?? null,
          });

          // Fallback: if backend didn't return meta (older deployments), fetch the latest submission record.
          const maybeRef =
            data?.data?.referenceNumber ?? data?.referenceNumber ?? null;
          const maybeCount =
            data?.data?.submissionCount ?? data?.submissionCount ?? null;
          if ((!maybeRef || maybeCount === null) && employeeId && companyId) {
            try {
              const metaRes = await apiRequest(
                endPoints.latestEnrollmentSubmissionMeta(employeeId, companyId),
                { method: "GET" }
              );
              setSubmissionMeta((prev) => ({
                referenceNumber:
                  prev?.referenceNumber ??
                  metaRes?.data?.referenceNumber ??
                  null,
                submissionCount:
                  prev?.submissionCount ??
                  metaRes?.data?.submissionCount ??
                  null,
              }));
            } catch (e) {
              // Ignore fallback errors; card will render without meta.
            }
          }

          // Final submission: Complete all remaining steps
          console.log("Enrollment: Completing all steps (Final Submit)");
          updateEnrollmentStep("selectTopUps", true);
          updateEnrollmentStep("addDependents", true);

          dispatch(setToastMessage(TOAST_MESSAGES.ENROLLMENT_SUBMIT));

          // Wait for step updates before showing success screen
          setTimeout(() => {
            setStep(EnrollmentStep.success);
            dispatch(fetchEmployeePolicies());
          }, 500);
        }
      },
      onError: (error: any) => {
        dispatch(
          setToastMessage(
            Array.isArray(error?.message)
              ? error.message[0]
              : error?.message || ALERT_MESSAGES.GENERIC_ERROR
          )
        );
        setLoading(false);
      },
    },
  });

  const transformedDependents = useMemo(() => {
    return transformFamilyMembersToArray(familyMemberDetails);
  }, [familyMemberDetails]);

  const relationshipGroupPolicies = useMemo(() => {
    if (!Array.isArray(overAllData)) {
      return [];
    }
    // Dependent Count / Dependent Attribute parameter policies (mutually
    // exclusive with relationship-group configs) also need their bucket/premium
    // recomputed live as dependents are added or removed, via the same
    // policyConfigurationByDependents refresh batch used for relationship-group
    // policies — filterPolicyOptions already matches on dependent count for these.
    return overAllData.filter(
      (policy: any) =>
        policy?.configuration?.isRelationshipGroup === true ||
        policy?.configuration?.isDependentParameter === true
    );
  }, [overAllData]);

  const relationshipGroupRefreshDependents = useMemo(() => {
    const candidates: any[] = Array.isArray(transformedDependents)
      ? transformedDependents
      : [];

    const toKey = (dep: any) => {
      // Do NOT key on id or personKey: the same real person can have a different
      // id/personKey per policy in the backend, so id-based keying prevents
      // deduplication and causes duplicate rows in the dependent list.
      // Do NOT key on name: name edits should not create a new entry.
      // Key on relation + relationshipType + DOB + gender — these are stable
      // identity fields that uniquely identify a person for pricing purposes.
      return [
        String(dep?.relation ?? dep?.relationship ?? "").trim().toLowerCase(),
        String(dep?.relationshipType ?? "").trim().toLowerCase(),
        String(dep?.dateOfBirth ?? "").trim(),
        String(dep?.gender ?? "").trim().toLowerCase(),
      ].join("|");
    };

    const seen = new Set<string>();
    const merged: any[] = [];
    for (const dep of candidates) {
      if (!dep) continue;
      const key = toKey(dep);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(dep);
    }
    return merged;
  }, [activeProfileSuggestedDependents, transformedDependents]);

  useEffect(() => {
    if (!employeeId) {
      return;
    }

    if (!relationshipGroupPolicies.length) {
      return;
    }

    const calls: Array<{ policyId: number; dependentsPayload: any[] }> = [];
    // Selection reset is handled by CTA/membership diff per component.
    // Resetting committed selections here caused cross-policy side effects.
    let shouldResetSelectionsAfterRefresh = false;

    for (const policy of relationshipGroupPolicies) {
      const requestedPolicyId = Number(policy?.policyId);
      if (!Number.isFinite(requestedPolicyId)) {
        continue;
      }

      const componentIds = new Set<number>(
        (policy?.configuration?.policyComponentsConfiguration?.components || [])
          .map((component: any) => Number(component?.id))
          .filter((id: number) => Number.isFinite(id))
      );

      const validDependentIds = new Set<number>(
        (policy?.configuration?.dependents || [])
          .map((dependent: any) => Number(dependent?.id))
          .filter((id: number) => Number.isFinite(id))
      );

      const selectedDependents =
        componentIds.size > 0
          ? relationshipGroupRefreshDependents.filter((dependent: any) => {
              const directId = Number(dependent?.policyComponentActionTypeId);
              if (Number.isFinite(directId) && componentIds.has(directId)) {
                return true;
              }

              const choices = Array.isArray(dependent?.choices)
                ? dependent.choices
                : [];
              return choices.some((choice: any) => {
                const choiceId = Number(choice?.policyComponentActionTypeId);
                return Number.isFinite(choiceId) && componentIds.has(choiceId);
              });
            })
          : relationshipGroupRefreshDependents;

      const dependentsPayload = selectedDependents.map((dependent: any) => {
          const parsedId = Number(dependent?.id);
          const canUseId =
            Number.isFinite(parsedId) && validDependentIds.has(parsedId);

          return {
            ...(canUseId ? { id: parsedId } : {}),
            name: dependent.name,
            relation: dependent.relation,
            relationshipType: dependent.relationshipType,
            dateOfBirth: dependent.dateOfBirth,
            gender: dependent.gender || "",
          };
        });

      // Stabilize payload order to avoid spurious refreshes due to object/iteration ordering.
      dependentsPayload.sort((a: any, b: any) => {
        const ak = `${String(a?.relation ?? "").toLowerCase()}|${String(a?.relationshipType ?? "").toLowerCase()}|${normalizeDateKey(a?.dateOfBirth)}|${String(a?.gender ?? "").toLowerCase()}`;
        const bk = `${String(b?.relation ?? "").toLowerCase()}|${String(b?.relationshipType ?? "").toLowerCase()}|${normalizeDateKey(b?.dateOfBirth)}|${String(b?.gender ?? "").toLowerCase()}`;
        return ak.localeCompare(bk);
      });

      // Pricing key ignores name so "edit name" does not trigger refresh/reset.
      const payloadKey = buildRelationshipGroupPricingKey(dependentsPayload);
      const lastKey =
        lastRelationshipGroupPayloadByPolicyRef.current[String(requestedPolicyId)];

      // If nothing is selected for this policy (self-only) and we have never fetched
      // relationship-group pricing for it, skip the refresh. This prevents unrelated
      // "add dependent in GMC" actions from triggering refresh/reset for other
      // relationship-group policies until the user actually selects a dependent there.
      if (!lastKey && dependentsPayload.length === 0) {
        continue;
      }

      if (lastKey === payloadKey) {
        continue;
      }

      // Do NOT force-reset selections for every payload change (e.g. editing dependent name).
      // CTA already flips to "Select" via membership diff logic; resetting here causes
      // unrelated policies to flip unexpectedly.

      lastRelationshipGroupPayloadByPolicyRef.current[String(requestedPolicyId)] =
        payloadKey;

      calls.push({ policyId: requestedPolicyId, dependentsPayload });
    }

    if (calls.length === 0) {
      return;
    }

    const componentKeysToLoad = calls.map((call) => {
      const policy = relationshipGroupPolicies.find(
        (p: any) => Number(p?.policyId) === Number(call.policyId),
      );
      const componentIds = getPrimaryComponentIdsForPolicy(policy);
      const key = buildPolicyComponentLoadingKey(
        Number(call.policyId),
        componentIds.parentpolicyComponentActionTypeId,
        componentIds.policyComponentActionTypeId,
      );
      relationshipGroupLoadingKeyByPolicyIdRef.current[Number(call.policyId)] =
        key;
      return key;
    });

    beginRelationshipGroupRefreshBatch(
      calls.length,
      shouldResetSelectionsAfterRefresh,
      calls.map((call) => call.policyId),
      componentKeysToLoad,
    );

    for (const call of calls) {
      updatePoliciesData({
        endpoint: endPoints.policyConfigurationByDependents,
        method: "POST",
        data: {
          policyId: call.policyId,
          employeeId,
          dependents: call.dependentsPayload,
          isModified: isDependentsModified,
        },
      });
    }

    // Enrollment progress: mark addDependents when at least one dependent exists.
    if (relationshipGroupRefreshDependents.length > 0) {
      updateEnrollmentStep("addDependents", true);
    }
  }, [
    beginRelationshipGroupRefreshBatch,
    employeeId,
    isDependentsModified,
    relationshipGroupPolicies,
    relationshipGroupRefreshDependents,
    updateEnrollmentStep,
    updatePoliciesData,
  ]);

  useEffect(() => {
    if (!overAllData) return;

    const reconstructedChoices =
      reconstructPolicyConfigurationFromSavedChoices(overAllData);

    const shouldUpdate =
      !lastReconstructedChoicesRef.current ||
      !isEqual(lastReconstructedChoicesRef.current, reconstructedChoices);

    if (shouldUpdate) {
      lastReconstructedChoicesRef.current = reconstructedChoices;
      if (reconstructedChoices.length > 0) {
        // Merge: when the backend reconstruction returns null for a policy (no saved
        // choice yet — the user made a local-only selection before submitting),
        // preserve the existing local value so unsaved selections are not wiped.
        // This prevents a GMC "Selected → Select" flip when GMC Top-up's RG refresh
        // triggers a reconstruction that sees GMC's employeeChosenChoices as [] and
        // overwrites the locally-stored GMC selection with null.
        setPolicyConfigurationData((prev) =>
          reconstructedChoices.map((reconstructed: any, index: number) => {
            if (reconstructed !== null && reconstructed !== undefined) {
              return reconstructed;
            }
            return (Array.isArray(prev) ? prev[index] : null) ?? null;
          })
        );
        if (initialPolicyConfigurationData.length === 0) {
          setInitialPolicyConfigurationData(reconstructedChoices);
        }
      } else {
        setPolicyConfigurationData([]);
      }
    }
  }, [initialPolicyConfigurationData.length, overAllData]);
  
  const unifiedEnrollmentViewState = useMemo(
    () => getUnifiedEnrollmentViewState(flattenedPolicies),
    [flattenedPolicies]
  );
  const hasResolvedInitialViewRef = useRef(false);

  useEffect(() => {
    if (hasResolvedInitialViewRef.current) {
      return;
    }

    if (shouldOpenSummaryFromNavigation) {
      setStep(EnrollmentStep.Summary);
      setIsReadOnly(isSummaryViewOnlyFromNavigation);
      hasResolvedInitialViewRef.current = true;
      return;
    }

    if (!flattenedPolicies.length) {
      return;
    }

    if (unifiedEnrollmentViewState.openSummary) {
      setStep(EnrollmentStep.Summary);
      setIsReadOnly(unifiedEnrollmentViewState.isViewOnly);
    }

    hasResolvedInitialViewRef.current = true;
  }, [
    flattenedPolicies.length,
    isSummaryViewOnlyFromNavigation,
    shouldOpenSummaryFromNavigation,
    unifiedEnrollmentViewState,
  ]);

  const handleSave = (
    action: string,
    onSubmitSuccess?: () => void,
    onSubmitError?: () => void
  ) => {
    if (!employeeId || !companyId) {
      dispatch(setToastMessage(TOAST_MESSAGES.ENROLLMENT_SAVE_FAIL));
      onSubmitError?.();
      return;
    }

    setLoading(true);

    let configurationData = [...policyConfigurationData];

    if (action === "submit") {
      configurationData = normalizePoliciesByBase(policyConfigurationData);
    }

    const currentGmcPolicy = relationConstraints.find(
      (policy: any) => policy?.policyTypeKey?.includes("POLICY_TYPE_GMC")
    );
    const allowedDependentIdsForSubmit = new Set<number>(
      (currentGmcPolicy?.configuration?.dependents || [])
        .map((dependent: any) => Number(dependent?.id))
        .filter((id: number) => Number.isFinite(id))
    );

    const enrolledDeps = mergeDependentsForSubmitPayload(
      transformedDependents,
      allowedDependentIdsForSubmit
    );

    console.log("[handleSave] profileOnlyDependents:", profileOnlyDependents);
    console.log("[handleSave] transformedDependents:", transformedDependents);
    console.log("[handleSave] enrolledDeps:", enrolledDeps);

    const enrolledFingerprints = new Set<string>(
      enrolledDeps.map((dep: any) => buildDependentFingerprint(dep))
    );

    const seenProfileOnlyFingerprints = new Set<string>();
    const deduplicatedProfileOnlyDeps = (profileOnlyDependents || [])
      .filter((dep: any) => {
        if (!dep?.id) {
          console.log("[handleSave] profile dep excluded (no id):", dep);
          return false;
        }
        if (deletedProfileOnlyIds.has(Number(dep.id))) {
          console.log("[handleSave] profile dep excluded (deleted):", dep);
          return false;
        }
        const fingerprint = buildDependentFingerprint(dep);
        if (deletedProfileOnlyFingerprints.has(fingerprint)) {
          console.log("[handleSave] profile dep excluded (deleted fingerprint):", dep);
          return false;
        }
        if (enrolledFingerprints.has(fingerprint)) {
          console.log("[handleSave] profile dep excluded (already in enrolledDeps):", dep, "fingerprint:", fingerprint);
          return false;
        }
        if (seenProfileOnlyFingerprints.has(fingerprint)) {
          console.log("[handleSave] profile dep excluded (duplicate fingerprint):", dep);
          return false;
        }
        seenProfileOnlyFingerprints.add(fingerprint);
        return true;
      })
      .map((dep: any) => ({
        id: Number(dep.id),
        name: dep.name,
        relation: dep.relation || dep.relationship,
        relationshipType: dep.relationshipType || dep.relation || dep.relationship,
        dateOfBirth: dep.dateOfBirth,
        gender: dep.gender,
        choices: [],
      }));

    console.log("[handleSave] deduplicatedProfileOnlyDeps:", deduplicatedProfileOnlyDeps);

    const normalizedDependentsForSubmit = [
      ...enrolledDeps,
      ...deduplicatedProfileOnlyDeps,
    ];

    console.log("[handleSave] normalizedDependentsForSubmit:", normalizedDependentsForSubmit);

    const choiceIdToIdentityMap = new Map<number, Set<string>>();
    configurationData.forEach((item: any) => {
      if (!item?.id || !item?.policyId) return;
      const numericId = Number(item.id);
      if (!Number.isFinite(numericId)) return;

      const identityKey = buildChoiceIdentityKey(item);
      if (!choiceIdToIdentityMap.has(numericId)) {
        choiceIdToIdentityMap.set(numericId, new Set());
      }
      choiceIdToIdentityMap.get(numericId)?.add(identityKey);
    });

    const conflictingChoiceIds = new Set<number>(
      Array.from(choiceIdToIdentityMap.entries())
        .filter(([, identities]) => identities.size > 1)
        .map(([id]) => id)
    );

    const groupedPolicies = Object.values(
      configurationData.reduce((acc, item) => {
        // skip null or invalid
        if (!item || !item.policyId) return acc;

        const {
          policyId,
          policyName,
          id,
          rawSumInsured,
          sumInsured,
          premium,
          companyPay,
          employeePay,
          companyContribution,
          employeeContribution,
          parentpolicyComponentActionTypeId,
          policyComponentActionType,
          policyComponentActionTypeId,
          policyComponentActionLabel,
        } = item;

        const choiceIdentityKey = buildChoiceIdentityKey(item);
        const numericChoiceId = Number(id);
        const canReuseChoiceId =
          Number.isFinite(numericChoiceId) &&
          !conflictingChoiceIds.has(numericChoiceId) &&
          choiceIdToIdentityMap.get(numericChoiceId)?.has(choiceIdentityKey);

        // Compute the same prorated total shown on every screen and send it
        // along with the submit — the backend stores this as given rather
        // than recomputing, so the saved record can never disagree with what
        // the employee actually confirmed. Returns null when proration
        // doesn't apply (relationship-group, or proRationEnabled=false);
        // fall back to the full values in that case.
        const proratedForChoice = resolveApplyToDependentsPremiumClient(
          item,
          transformedDependents,
          gmcPolicyIdsForSummary,
          overAllData,
          employeeDateOfBirth,
          employeeEffectiveDate,
          flattenedPolicies
        );

        const finalCompanyPay = Number(companyPay ?? companyContribution ?? 0);
        const finalEmployeePay = Number(employeePay ?? employeeContribution ?? 0);

        const choice = {
          ...(canReuseChoiceId ? { id: numericChoiceId } : {}),
          sumInsured: Number(rawSumInsured ?? sumInsured ?? 0),
          premium: Number(premium),
          companyPay: finalCompanyPay,
          employeePay: finalEmployeePay,
          proratedCompanyPay: proratedForChoice?.companyContribution ?? finalCompanyPay,
          proratedEmployeePay: proratedForChoice?.employeeContribution ?? finalEmployeePay,
          proratedPremium:
            (proratedForChoice?.companyContribution ?? finalCompanyPay) +
            (proratedForChoice?.employeeContribution ?? finalEmployeePay),
          parentpolicyComponentActionTypeId,
          policyComponentActionType,
          policyComponentActionTypeId,
          policyComponentActionLabel,
          // Add metadata for deduplication
          updatedAt: item.updatedAt || Date.now(),
        };

        if (!acc[policyId]) {
          acc[policyId] = {
            policyId,
            policyName,
            choices: new Map(), // Use Map for deduplication
          };
        }

        // Create composite key for deduplication by component identity.
        const choiceKey = [
          policyComponentActionTypeId,
          policyComponentActionType,
          parentpolicyComponentActionTypeId ?? "null",
          String(policyComponentActionLabel ?? "").toLowerCase(),
        ].join("|");

        const existing = acc[policyId].choices.get(choiceKey);

        if (existing) {
          // Keep the newer choice (higher updatedAt)
          if (choice.updatedAt >= existing.updatedAt) {
            console.log(
              `API Payload: Replacing duplicate choice for policy ${policyId}, key ${choiceKey}:`,
              {
                old: existing,
                new: choice,
              }
            );
            acc[policyId].choices.set(choiceKey, choice);
          } else {
            console.log(
              `API Payload: Keeping existing choice for policy ${policyId}, key ${choiceKey}:`,
              {
                existing: existing,
                discarded: choice,
              }
            );
          }
        } else {
          acc[policyId].choices.set(choiceKey, choice);
        }

        return acc;
      }, {})
    ).map((policy) => ({
      ...policy,
      choices: Array.from(policy.choices.values()).map((choice) => {
        const { updatedAt, ...cleanChoice } = choice; // Remove our internal metadata
        return cleanChoice;
      }),
    }));

    const canEnolledPolicyIds = flattenedPolicies
      ?.filter(
        (policy) =>
          policy.status !== PolicyStatus.LOCKED &&
          policy.status !== PolicyStatus.NOTIFY
      )
      ?.map((policy) => policy.policyId);

    const filteredGroupedPolicies = groupedPolicies.filter((policy) =>
      canEnolledPolicyIds.includes(policy?.policyId)
    );

    // An enrolled policy the user unselected entirely vanishes from
    // groupedPolicies, and the backend reads "absent" as "no change" — so it must
    // still be sent, carrying no choices, for its stored choices to be cleared.
    // Guarded on a non-empty selection so a submit fired mid-load can't look like
    // "unselected everything" and wipe live enrollments.
    if (filteredGroupedPolicies.length > 0) {
      const sentPolicyIds = new Set(
        filteredGroupedPolicies.map((policy: any) => Number(policy?.policyId))
      );
      (flattenedPolicies ?? []).forEach((policy: any) => {
        if (
          policy?.status === PolicyStatus.EDIT_ENROLL &&
          !sentPolicyIds.has(Number(policy?.policyId))
        ) {
          filteredGroupedPolicies.push({
            policyId: policy.policyId,
            policyName: policy.policyName,
            choices: [],
          } as any);
        }
      });
    }

    if (action === "save") {
      saveHadCombinedChoicesRef.current = groupedPolicies.length > 0;
    }

    const logEnrollmentActivity = async (
      activityKey: string,
      referenceType: string,
      documentType: string,
      metadata: Record<string, any>
    ) => {
      try {
        await apiRequest(endPoints.getActivityLogs, {
          method: "POST",
          data: {
            activityKey,
            activityCategory: "ENROLLMENT",
            referenceId: employeeId,
            referenceType,
            metadata: {
              documentType,
              ...metadata,
            },
          },
        });
      } catch (error) {
        console.error(`Failed to create ${activityKey} activity log`, error);
      }
    };

  const triggerEnrollmentConfirmation = async (
      submittedPolicyIds: Array<string | number>,
      meta?: { referenceNumber?: string | null; submissionCount?: number | string | null }
    ) => {
      if (!employeeId || !submittedPolicyIds.length) return;

      try {
        const response = await axiosInstance.post(
          endPoints.enrollmentConfirmation,
          {
            policyIds: submittedPolicyIds.map((id) => Number(id)),
            employeeId: Number(employeeId),
            referenceNumber: meta?.referenceNumber ?? undefined,
            submissionCount:
              meta?.submissionCount !== null && meta?.submissionCount !== undefined
                ? Number(meta.submissionCount)
                : undefined,
          }
        );

        const isConfirmationSuccess = response?.data?.data?.success === true;
        if (isConfirmationSuccess) {
          updateEnrollmentStep("receiveConfirmation", true);
          // Keep UI meta stable even if confirmation mail triggers later.
          setSubmissionMeta((prev) => ({
            referenceNumber:
              prev?.referenceNumber ??
              response?.data?.data?.referenceNumber ??
              response?.data?.referenceNumber ??
              null,
            submissionCount:
              prev?.submissionCount ??
              response?.data?.data?.submissionCount ??
              response?.data?.submissionCount ??
              null,
          }));
        }
      } catch (error) {
        console.error("Enrollment confirmation API failed", error);
      }
    };

    const deletedDependentIdsForSubmit = Array.from(deletedProfileOnlyIds).filter(
      (id) => Number.isFinite(id)
    );

    // Fold the GPA / parental lock-in acknowledgements (from the live enrollment
    // flow checkboxes) into disclaimersAccepted, deduped by policyId + text.
    const acknowledgementDisclaimers = (ackDisclaimersRef.current || []).map(
      (d) => ({
        policyId: d.policyId,
        text: d.text,
        isMandatory: d.isMandatory,
        acceptedAt: new Date().toISOString(),
      }),
    );
    const seenDisclaimerKeys = new Set<string>();
    const finalDisclaimers = [
      ...acceptedDisclaimersRef.current,
      ...acknowledgementDisclaimers,
    ].filter((d: any) => {
      const key = `${d.policyId}|${String(d.text ?? "").trim()}`;
      if (seenDisclaimerKeys.has(key)) return false;
      seenDisclaimerKeys.add(key);
      return true;
    });

    saveEnrollment(
      {
        endpoint: endPoints.updateEnrollmentData,
        method: "PUT",
        data: {
          employeeId,
          companyId: Number(companyId),
          action,
          dependents: normalizedDependentsForSubmit,
          combinedChoices: filteredGroupedPolicies,
          ...(deletedDependentIdsForSubmit.length > 0
            ? { deletedDependentIds: deletedDependentIdsForSubmit }
            : {}),
          ...(action === "submit" && finalDisclaimers.length > 0
            ? { disclaimersAccepted: finalDisclaimers }
            : {}),
        },
      },
      {
        onSuccess: (response: any) => {
          if (action === "submit") {
            const confirmationPolicyIds = Array.from(
              new Set(
                filteredGroupedPolicies
                  .map((policy) => policy?.policyId)
                  .filter((id) => id !== null && id !== undefined)
              )
            ) as Array<string | number>;

            // Show ref id + submission counter immediately on the success screen.
            setSubmissionMeta({
              referenceNumber:
                response?.data?.referenceNumber ?? response?.referenceNumber ?? null,
              submissionCount:
                response?.data?.submissionCount ?? response?.submissionCount ?? null,
            });

            void triggerEnrollmentConfirmation(confirmationPolicyIds, {
              referenceNumber:
                response?.data?.referenceNumber ?? response?.referenceNumber ?? null,
              submissionCount:
                response?.data?.submissionCount ?? response?.submissionCount ?? null,
            });
            updateEnrollmentStep("submitEnrollment", true);
            void logEnrollmentActivity(
              "SUBMITTED_ENROLLMENT",
              "SUBMITTED_ENROLLMENT",
              "SUBMITTED_ENROLLMENT",
              {
                policyIds: confirmationPolicyIds,
                employeeId,
              }
            );

            dispatch(fetchEmployeePolicies());
            onSubmitSuccess?.();
          }
        },
        onError: () => {
          if (action === "submit") {
            onSubmitError?.();
          }
        },
      }
    );
  };

  const latestChoicePricingByKey = useMemo(() => {
    const latestChoicePricingByKey = new Map<string, any>();

    if (Array.isArray(overAllData)) {
      overAllData.forEach((policy: any) => {
        const policyConfig = policy?.configuration?.policyComponentsConfiguration;
        if (!policyConfig) return;

        const generatedPolicies = generatePolicyStructureForSingleEnrollment(
          policyConfig
        );

        generatedPolicies.forEach((component: any) => {
          const choices = Array.isArray(component?.choices) ? component.choices : [];
          choices.forEach((choice: any) => {
            const sumInsuredId = Number(choice?.sumInsuredId);
            if (!Number.isFinite(sumInsuredId)) return;

            const identityKey = buildChoiceIdentityKey({
              policyId: component?.policyId ?? policy?.policyId,
              policyComponentActionType:
                choice?.policyComponentActionType ??
                component?.policyComponentActionType ??
                component?.type,
              policyComponentActionTypeId:
                choice?.policyComponentActionTypeId ??
                component?.policyComponentActionTypeId ??
                component?.id,
              parentpolicyComponentActionTypeId:
                choice?.parentpolicyComponentActionTypeId ??
                component?.parentpolicyComponentActionTypeId ??
                null,
              policyComponentActionLabel:
                choice?.policyComponentActionLabel ??
                component?.policyComponentActionLabel ??
                component?.label,
            });

            latestChoicePricingByKey.set(
              `${identityKey}|${sumInsuredId}`,
              choice
            );
          });
        });
      });
    }

    return latestChoicePricingByKey;
  }, [overAllData]);

  const effectivePolicyConfigurationData = useMemo(
    () =>
      (Array.isArray(policyConfigurationData) ? policyConfigurationData : [])
        .filter(Boolean)
        .filter((item) => {
          const componentKey = buildChoiceIdentityKey(item);
          return componentSelectionStateByKey[componentKey] !== false;
        })
        .map((item) => {
          const sumInsuredId = Number(item?.sumInsuredId);
          if (!Number.isFinite(sumInsuredId)) return item;

          const componentKey = buildChoiceIdentityKey(item);
          const latestChoice = latestChoicePricingByKey.get(
            `${componentKey}|${sumInsuredId}`
          );
          if (!latestChoice) return item;

          const companyContribution = Number(
            latestChoice?.companyContribution ??
              latestChoice?.companyPay ??
              item?.companyContribution ??
              item?.companyPay ??
              0
          );
          const employeeContribution = Number(
            latestChoice?.employeeContribution ??
              latestChoice?.employeePay ??
              item?.employeeContribution ??
              item?.employeePay ??
              0
          );

          return {
            ...item,
            companyContribution,
            employeeContribution,
            companyPay: companyContribution,
            employeePay: employeeContribution,
            premium: Number(
              latestChoice?.premium ?? companyContribution + employeeContribution
            ),
            sumInsured: latestChoice?.sumInsured ?? item?.sumInsured,
            rawSumInsured:
              latestChoice?.rawSumInsured ??
              latestChoice?.sumInsured ??
              item?.rawSumInsured ??
              item?.sumInsured,
            showCompanyContribution:
              latestChoice?.showCompanyContribution ??
              item?.showCompanyContribution,
          };
        }),
    [
      componentSelectionStateByKey,
      latestChoicePricingByKey,
      policyConfigurationData,
    ]
  );

  // Same per-life, age-bucket-aware override used by the footer stats and the
  // Choose Your Plan cards, applied once here and reused by both the summary
  // calculation and the Confirm Enrolment page (MultiEnrollmentSummary), which
  // otherwise reads companyContribution/employeeContribution straight off this
  // array and would still show the pre-dependent, self-only value.
  const gmcPolicyIdsForSummary = useMemo(
    () => buildGmcPolicyIdSet(overAllData),
    [overAllData]
  );
  const perLifeCorrectedPolicyConfigurationData = useMemo(
    () =>
      effectivePolicyConfigurationData.map((item) => {
        const perLifePremium = resolveApplyToDependentsPremiumClient(
          item,
          transformedDependents,
          gmcPolicyIdsForSummary,
          overAllData,
          employeeDateOfBirth,
          employeeEffectiveDate,
          flattenedPolicies
        );
        if (!perLifePremium) return item;
        return {
          ...item,
          companyContribution: perLifePremium.companyContribution,
          employeeContribution: perLifePremium.employeeContribution,
          companyPay: perLifePremium.companyContribution,
          employeePay: perLifePremium.employeeContribution,
          premium:
            perLifePremium.companyContribution + perLifePremium.employeeContribution,
        };
      }),
    [
      effectivePolicyConfigurationData,
      transformedDependents,
      gmcPolicyIdsForSummary,
      overAllData,
      employeeDateOfBirth,
      employeeEffectiveDate,
      flattenedPolicies,
    ]
  );

  const footerStats = useMemo(() => {

    const stats = calculateFooterStats(
      effectivePolicyConfigurationData,
      pendingSelections,
      transformedDependents,
      overAllData,
      flattenedPolicies,
      employeeDateOfBirth,
      employeeEffectiveDate
    );

    return {
      plansSelected: stats.plansSelected,
      membersCover: stats.membersCover + 1,
      totalPremium: formatCurrency(stats.totalPremium, localizationData?.data),
      companyPays: formatCurrency(stats.companyPays, localizationData?.data),
      yourPay: formatCurrency(stats.yourPay, localizationData?.data),
    };
  }, [
    effectivePolicyConfigurationData,
    transformedDependents,
    pendingSelections,
    overAllData,
    flattenedPolicies,
    localizationData,
    employeeDateOfBirth,
    employeeEffectiveDate,
  ]);

  const enrollmentSummaryData = useMemo(
    () =>
      calculateEnrollmentSummary(
        effectivePolicyConfigurationData,
        overAllData,
        transformedDependents,
        flattenedPolicies,
        employeeDateOfBirth,
        employeeEffectiveDate
      ),
    [
      effectivePolicyConfigurationData,
      overAllData,
      transformedDependents,
      flattenedPolicies,
      employeeDateOfBirth,
      employeeEffectiveDate,
    ]
  );

  const calculatorEnrollmentSummaryData = enrollmentSummaryData
    ? { ...enrollmentSummaryData, payrollInstallments }
    : enrollmentSummaryData;

  const storedDisclaimers = useMemo(() => {
    const enrolled = policiesData?.enrolledPolicies ?? [];
    return enrolled.flatMap((p: any) =>
      (p.disclaimersAccepted ?? []).map((d: any) => ({ ...d, policyId: p.policyId }))
    );
  }, [policiesData]);

  const renderSummaryPage = () => (
    <MultiEnrollmentSummary
      policyConfigurationData={perLifeCorrectedPolicyConfigurationData}
      summaryData={summarySource}
      handleSave={(action: string) => handleSave(action)}
      onBack={handleSummaryBack}
      onContinue={handleStartSubmitVerification}
      onCancel={handleBack}
      loading={loading}
      isLoading={isLoading || isPolicyComponentsLoading}
      isViewOnly={isSummaryViewOnly}
      isViewOnlyFromEnrolled={isSummaryViewOnly}
      gstConfig={enrollmentSummaryData.gstConfig}
      onDisclaimersChange={(d) => { acceptedDisclaimersRef.current = d; }}
      storedDisclaimers={isSummaryViewOnly ? storedDisclaimers : []}
    />
  );

  // At least one component must be selected on an actionable policy, whatever its
  // action type. This used to require a `base`-typed component, which deadlocked
  // configs where every component sits in the Optional section: selecting ten
  // optional addons left Continue disabled with no explanation, because none of
  // them was action-type `base`.
  //
  // When compulsory components exist this clause is satisfied for free by the
  // compulsory gate, so it only has teeth in an all-optional config.
  const hasActionablePolicySelected = useMemo(() => {
    const actionablePolicyIds = new Set(
      (flattenedPolicies || [])
        .filter(
          (policy) =>
            policy?.status === PolicyStatus.CAN_ENROLL ||
            policy?.status === PolicyStatus.EDIT_ENROLL ||
            policy?.status === PolicyStatus.NOT_STARTED
        )
        .map((policy) => Number(policy?.policyId))
        .filter((policyId) => Number.isFinite(policyId))
    );

    return effectivePolicyConfigurationData.some(
      (policy) => policy && actionablePolicyIds.has(Number(policy.policyId))
    );
  }, [effectivePolicyConfigurationData, flattenedPolicies]);

  const handleFamilyMemberChange = (updated: FamilyMemberDetailsMap) => {
    console.log("Family member details updated:", updated);
    updated = dedupeFamilyMemberDetailsMap(updated);
    const prevCount = Object.values(familyMemberDetails).flat().length;
    const newCount = Object.values(updated).flat().length;

    //  Detect newly added dependents (using tempKey)
    const hasNewDependents = Object.values(updated).some((members) =>
      Array.isArray(members) ? members.some((member) => member.tempKey) : false
    );

    // Detect deleted dependents (new count < old count)
    const hasDeletedDependents = newCount < prevCount;

    if (hasNewDependents || hasDeletedDependents) {
      setIsDependentsModified(true);
    }

    setFamilyMemberDetails(updated);
  };

  const summarySource = useMemo(() => {
    if (!overAllData) return null;
    return {
      ...overAllData,
      dependents: transformedDependents,
    };
  }, [overAllData, transformedDependents]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleContinue = () => {
    if (!hasAllCompulsoryOptionsSelected) {
      dispatch(
        setToastMessage("Please select all compulsory options to continue.")
      );
      return;
    }
    // When user continues to summary, mark selectTopUps as complete
    console.log("Enrollment: Completing selectTopUps (Continue to Summary)");
    updateEnrollmentStep("selectTopUps", true);

    setStep(EnrollmentStep.Summary);
  };

  const handleSummaryBack = () => {
     if(location.state?.openSummary){
      navigate("/dashboard")
      return;
    }
    if (shouldAutoOpenLockedSummary) {
      // For locked summaries (view-only), go back to previous page
      navigate(-1);
      return;
    }
    // For active enrollment flow, go back to configuration step
    setStep(EnrollmentStep.Configuration);
  };

  const resetAllData = () => {
    // Reset family member details to initial
    setFamilyMemberDetails(initialFamilyMemberDetails);
    // Reset policy configuration data to initial API data
    setPolicyConfigurationData([...initialPolicyConfigurationData]);
    // Trigger accordion reset in child component
    setResetTrigger(true);
  };

  const companyContributionDetails = overAllData?.map((policy: any) => ({
    policyId: policy.policyId,
    showEmployeeContribution:
      policy.configuration.constraints.showEmployeeContribution || 0,
  }));

  const handleFooterButtonClick = () => {
    if (isPolicyAlreadyEnrolled) {
      setIsReadOnly(true);
      resetAllData();
    } else {
      handleSave("save");
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    const trimmedPhone = (phone ?? "").trim();
    const cleanedDigits = trimmedPhone.replace(/\D/g, "");

    if (!cleanedDigits) {
      return "";
    }

    if (trimmedPhone.startsWith("+")) {
      return `+${cleanedDigits}`;
    }

    if (cleanedDigits.length === 10) {
      return `+91${cleanedDigits}`;
    }

    if (cleanedDigits.length === 12 && cleanedDigits.startsWith("91")) {
      return `+${cleanedDigits}`;
    }

    return `+${cleanedDigits}`;
  };

  const handleSelectMethod = async (method: "mobile" | "email") => {
    if (isSendingVerificationOtp) return;
    console.log("Selected OTP method:", method);
    setSelectedOtpMethod(method);
    setIsSendingVerificationOtp(true);

    try {
      const shouldSendEmail = method === "email";
      const shouldSendPhone = method === "mobile";
      const formattedPhone = formatPhoneNumber(userDetails?.phone);
      const deliveryPasswordMethod = getPasswordMethodForDelivery(method);

      if (shouldSendEmail && !userDetails?.email) {
        dispatch(setToastMessage("Registered email not found"));
        return;
      }

      if (shouldSendPhone && !formattedPhone) {
        dispatch(setToastMessage("Registered mobile number not found"));
        return;
      }

      if (shouldSendEmail && userDetails?.email) {
        await axiosInstance.post(endPoints.sendEmailOtp, {
          email: userDetails.email,
          domain: subdomain,
          scenario: EMAIL_OTP_SCENARIOS.ENROLLMENT_VERIFICATION,
          passwordMethodCode: deliveryPasswordMethod?.methodCode,
        });
      }

      if (shouldSendPhone && formattedPhone) {
        await axiosInstance.post(endPoints.sendPhoneOtp, {
          phoneNumber: formattedPhone,
          domain: subdomain,
          scenario: EMAIL_OTP_SCENARIOS.ENROLLMENT_VERIFICATION,
          passwordMethodCode: deliveryPasswordMethod?.methodCode,
        });
      }

      const methodCodeAliases =
        method === "email"
          ? ["EMAIL_OTP"]
          : ["PHONE_OTP", "MOBILE_OTP", "SMS_OTP"];
      const otpMethodConfig = authMethods.find((authMethod) => {
        if (!authMethod?.isEnabled) return false;
        const normalizedCode = String(
          authMethod.methodCode ||
            authMethod.authenticationMethodKey ||
            authMethod.authentication_method_key ||
            ""
        )
          .trim()
          .toUpperCase();
        return methodCodeAliases.includes(normalizedCode);
      });

      const cooldownSeconds = Number(
        deliveryPasswordMethod?.configuration?.passwordConfig
          ?.twoFactorAuthentication?.resendOtpCooldownSeconds ??
          deliveryPasswordMethod?.configuration?.twoFactorAuthentication
            ?.resendOtpCooldownSeconds
      );
      const resolvedCooldown = cooldownSeconds > 0 ? cooldownSeconds : 60;
      setIsVerificationResendDisabled(resolvedCooldown > 0);
      setVerificationResendCountdown(resolvedCooldown);
      setVerificationStep(VerificationStep.EnterOtp);
    } catch (error: any) {
      dispatch(
        setToastMessage(
          error?.response?.data?.message ||
            error?.message ||
            ALERT_MESSAGES.GENERIC_ERROR
        )
      );
    } finally {
      setIsSendingVerificationOtp(false);
    }
  };

  const handleAlternateAuth = () => {
    navigate("/dashboard");
  };

  const handleVerifyOtp = async (otp: string) => {
    if (isVerifyingVerificationOtp) return;
    if (otp.length !== 6) {
      dispatch(setToastMessage("Please enter a valid 6-digit OTP"));
      return;
    }

    setIsVerifyingVerificationOtp(true);
    try {
      const shouldVerifyEmail = selectedOtpMethod === "email";
      const shouldVerifyPhone = selectedOtpMethod === "mobile";
      const formattedPhone = formatPhoneNumber(userDetails?.phone);

      if (shouldVerifyEmail && !userDetails?.email) {
        dispatch(setToastMessage("Registered email not found"));
        setIsVerifyingVerificationOtp(false);
        return;
      }

      if (shouldVerifyPhone && !formattedPhone) {
        dispatch(setToastMessage("Registered mobile number not found"));
        setIsVerifyingVerificationOtp(false);
        return;
      }

      if (shouldVerifyEmail && userDetails?.email) {
        await axiosInstance.post(endPoints.verifyEmailOtp, {
          email: userDetails?.email,
          otp,
          domain: subdomain,
        });
      }

      if (shouldVerifyPhone && formattedPhone) {
        await axiosInstance.post(endPoints.verifyPhoneOtp, {
          phoneNumber: formattedPhone,
          otp,
          domain: subdomain,
        });
      }
    } catch (error: any) {
      dispatch(
        setToastMessage(
          error?.response?.data?.message ||
            error?.message ||
            ALERT_MESSAGES.GENERIC_ERROR
        )
      );
      setIsVerifyingVerificationOtp(false);
      return;
    }

    handleSave(
      "submit",
      () => {
        setIsVerifyingVerificationOtp(false);
        setVerificationStep(VerificationStep.Success);
      },
      () => {
        setIsVerifyingVerificationOtp(false);
      }
    );
  };

  const handleBackFromOtp = () => {
    setIsVerificationResendDisabled(false);
    setVerificationResendCountdown(0);
    setVerificationStep(VerificationStep.SelectMethod);
  };

  const handleResendOtp = () => {
    if (!selectedOtpMethod) return;
    handleSelectMethod(selectedOtpMethod);
  };

  const handleCloseVerification = () => {
    // Reset verification flow and go back to summary or configuration
    setIsVerificationResendDisabled(false);
    setVerificationResendCountdown(0);
    setVerificationStep(VerificationStep.SelectMethod);
    setStep(EnrollmentStep.Summary);
  };

  const handleStartSubmitVerification = () => {
    if (allowedVerificationMethods.length === 0) {
      handleSave(
        "submit",
        () => {
          setVerificationStep(VerificationStep.Success);
          setStep(EnrollmentStep.success);
        },
        () => {
          setStep(EnrollmentStep.Summary);
        }
      );
      return;
    }

    if (allowedVerificationMethods.length === 1) {
      const singleMethod = allowedVerificationMethods[0];
      setSelectedOtpMethod(singleMethod);
      setIsVerificationResendDisabled(false);
      setVerificationResendCountdown(0);
      setVerificationStep(VerificationStep.EnterOtp);
      setStep(EnrollmentStep.success);
      handleSelectMethod(singleMethod);
      return;
    }

    setSelectedOtpMethod(null);
    setIsVerificationResendDisabled(false);
    setVerificationResendCountdown(0);
    setVerificationStep(VerificationStep.SelectMethod);
    setStep(EnrollmentStep.success);
  };

  useEffect(() => {
    if (verificationResendCountdown > 0) {
      const timer = setTimeout(
        () => setVerificationResendCountdown(verificationResendCountdown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
    setIsVerificationResendDisabled(false);
    return undefined;
  }, [verificationResendCountdown]);

  // Check if footer should be shown (when there are selected policies)
  // const hasSelectedPolicies =
  //   policyConfigurationData.filter(Boolean).length > 0;

  return (
    <PageContainer>
      {step === EnrollmentStep.Configuration ? (
        <>
            <EmployeeDetails
              isReadOnly={isReadOnly}
              policyOptions={policyOptions}
              flattenedPolicies={flattenedPolicies}
            />
          <StyledEnrollContainer $fullWidth={false}>
            <EnrollmentFlow
              policyData={overAllDataForFlow}
              policyConfigurationData={policyConfigurationData}
              setPolicyConfigurationData={setPolicyConfigurationData}
              isLoading={isLoading}
              isPolicyComponentsLoading={isPolicyComponentsLoading}
              policyComponentLoadingByKey={policyComponentLoadingByKey}
              familyMemberDetails={familyMemberDetails}
              onFamilyMemberChange={handleFamilyMemberChange}
              isReadOnly={isReadOnly}
              setShouldResetSelections={setShouldResetSelections}
              shouldResetSelections={shouldResetSelections}
              resetSelectionPolicyIds={resetSelectionPolicyIds}
              setResetSelectionPolicyIds={setResetSelectionPolicyIds}
              groupMediclaimPolicy={groupMediclaimPolicy}
              policiesWithDependents={policiesWithDependents}
              resetTrigger={resetTrigger}
              setResetTrigger={setResetTrigger}
              setAllBasePoliciesEnrolled={setAllBasePoliciesEnrolled}
              pendingSelections={pendingSelections}
              setPendingSelections={setPendingSelections}
              policyId={policyId}
              enrollmentSummaryData={enrollmentSummaryData}
              onCompulsorySelectionStatusChange={
                setHasAllCompulsoryOptionsSelected
              }
              onComponentSelectionStateChange={setComponentSelectionStateByKey}
              onAckDisclaimersChange={(entries) => {
                ackDisclaimersRef.current = entries;
              }}
              profileSuggestedDependents={activeProfileSuggestedDependents}
              onProfileSuggestedDepDeleted={handleProfileSuggestedDepDeleted}
              employeeDateOfBirth={employeeDateOfBirth}
              employeeEffectiveDate={employeeEffectiveDate}
            />
            {/* {hasSelectedPolicies && ( */}
            <CalculatorMainContainer >
            <Bottomfooter
              stats={footerStats}
              onBack={handleBack}
              onSave={() => handleSave("save")}
              onContinue={handleContinue}
              loading={loading}
              isContinueDisabled={
                isLoading ||
                isPolicyComponentsLoading ||
                !hasActionablePolicySelected ||
                !hasAllCompulsoryOptionsSelected
              }
              overAllData={overAllData}
              isReadOnly={isReadOnly}
              setIsReadOnly={setIsReadOnly}
              resetData={resetAllData}
              isMultiEnrollment={true}
              showActionBanner={false}
              enrollmentSummaryData={calculatorEnrollmentSummaryData}
            />
            </CalculatorMainContainer>
            {/* )} */}
          </StyledEnrollContainer>
          {/* {hasSelectedPolicies && ( */}
          <FooterBannerWrapper>
            <FooterBanner>
              {/* Payment schedule moved to Premium Calculator panel */}
              {/* <FooterBannerLeft>
                <FooterBannerLeftContent>
                  <FooterBannerLeftContentTitle>
                    Payment schedule
                  </FooterBannerLeftContentTitle>
                  <FooterBannerLeftContentSubtitle>
                    Your contribution will be deducted in {payrollInstallments}{" "}
                    equal instalments from your monthly salary
                  </FooterBannerLeftContentSubtitle>
                </FooterBannerLeftContent>
              </FooterBannerLeft> */}
              <div></div>
              <ButtonContainer>
                {isReadOnly ? (
                  <ContinueButton
                    variant="contained"
                    buttonType="secondary"
                    label={EDIT}
                    onClick={() => setIsReadOnly(false)}
                    loading={loading}
                    fullWidth={true}
                    width={"100%"}
                  />
                ) : (
                  <>
                    <CancleCommonButton
                      variant="outlined"
                      buttonType="primary"
                      label={BACK}
                      onClick={handleBack}
                      loading={loading}
                      disabled={isReadOnly}
                      fullWidth={true}
                      width={"100%"}
                    />
                    <CancleCommonButton
                      variant="outlined"
                      buttonType="primary"
                      label={isPolicyAlreadyEnrolled ? "Cancel" : SAVE_EXIT}
                      onClick={handleFooterButtonClick}
                      loading={loading}
                      disabled={isReadOnly}
                      fullWidth={true}
                      width={"100%"}
                    />
                    <ContinueButton
                      variant="contained"
                      buttonType="secondary"
                      label={"Continue to Summary"}
                      onClick={handleContinue}
                      disabled={
                        isLoading ||
                        isPolicyComponentsLoading ||
                        !hasActionablePolicySelected ||
                        !hasAllCompulsoryOptionsSelected ||
                        isReadOnly
                      }
                      fullWidth={true}
                      width={"100%"}
                    />
                  </>
                )}
              </ButtonContainer>
            </FooterBanner>
          </FooterBannerWrapper>
          {/* )} */}
        </>
      ) : step === EnrollmentStep.success ? (
        <>
          {renderSummaryPage()}
          {verificationStep === VerificationStep.SelectMethod ? (
            <VerifyLoginPage
              onClose={handleCloseVerification}
              onSelectMethod={handleSelectMethod}
              onAlternateAuth={handleAlternateAuth}
              isSendingOtp={isSendingVerificationOtp}
              allowedMethods={[...allowedVerificationMethods]}
            />
          ) : verificationStep === VerificationStep.EnterOtp ? (
            <VerifyLoginOtpPage
              onVerify={handleVerifyOtp}
              onBack={handleBackFromOtp}
              onClose={handleCloseVerification}
              onResendOtp={handleResendOtp}
              method={selectedOtpMethod}
              email={userDetails?.email}
              mobileNumber={userDetails?.phone}
              loading={isVerifyingVerificationOtp || loading}
              isResendingOtp={isSendingVerificationOtp}
              isResendDisabled={isVerificationResendDisabled}
              resendCountdown={verificationResendCountdown}
            />
          ) : (
            <ConfirmationPage
              referenceNumber={submissionMeta?.referenceNumber}
              submissionCount={submissionMeta?.submissionCount}
            />
          )}
        </>
      ) : (
        renderSummaryPage()
      )}
    </PageContainer>
  );
}

export default MultiEnrollment;
