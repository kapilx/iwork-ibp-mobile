// Client-side per-life, age-bucket-aware pricing for a policy component whose
// matched parameter has applyToDependents=true (currently: a plain "Age" range
// parameter — NOT the dedicated Dependent Count / Dependent Attribute / Max
// Dependent Count parameter types, which are already priced correctly elsewhere
// and must stay untouched).
//
// Needed because the backend only resolves per-life pricing against dependents
// that are already persisted at the time the enrollment screen's data was
// fetched. A dependent added live in the browser (before submit) has no server
// round-trip recomputing their own bucket's premium, so without this the UI
// falls back to "self's premium x headcount" — wrong whenever the dependent's
// own age bucket differs from self's.

export interface PremiumBreakdownEntry {
  label: string;
  isEmployee: boolean;
  companyPay: number;
  employeePay: number;
}

// Mirrors toMidnight/daysBetweenInclusive/calculateApplicableDays/
// calculateEmployeePremium in apps/services/service-lib/src/lib/utils/
// premium-calculator.util.ts EXACTLY — that file is backend-only and can't be
// imported into this frontend bundle, so this is a deliberate, tracked port.
// Any future change to the backend formula must be mirrored here, or the
// live preview and the actual saved/billed amount will disagree again.
const toMidnight = (d: Date): Date => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const daysBetweenInclusive = (start: Date, end: Date): number => {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
};

// Prorates ONE already-split amount (a company or employee portion) over the
// employee/dependent's own effective-date-to-policy-end span, out of the full
// policy period — identical math to calculateEmployeePremium server-side.
// Returns the amount unchanged if proration is disabled or required dates are
// missing, matching the backend's own no-op fallback.
export const calculateProratedAmount = (
  amount: number,
  policyFrom: unknown,
  policyTo: unknown,
  effectiveFrom: unknown,
  proRationEnabled: boolean
): number => {
  if (!proRationEnabled) return amount;
  if (!policyFrom || !policyTo || !effectiveFrom) return amount;

  const policyFromDate = new Date(policyFrom as string);
  const policyToDate = new Date(policyTo as string);
  const effectiveFromDate = new Date(effectiveFrom as string);
  if (
    Number.isNaN(policyFromDate.getTime()) ||
    Number.isNaN(policyToDate.getTime()) ||
    Number.isNaN(effectiveFromDate.getTime())
  ) {
    return amount;
  }

  const policyStartDate = toMidnight(policyFromDate);
  const policyEndDate = toMidnight(policyToDate);
  const totalPolicyDays = daysBetweenInclusive(policyStartDate, policyEndDate);
  if (totalPolicyDays <= 0) return amount;

  const adjustedStartDate = new Date(
    Math.max(toMidnight(effectiveFromDate).getTime(), policyStartDate.getTime())
  );
  const applicableDays = Math.max(
    0,
    daysBetweenInclusive(adjustedStartDate, policyEndDate)
  );

  const perDayAmount = amount / totalPolicyDays;
  return Math.round(perDayAmount * applicableDays * 100) / 100;
};

export interface ProrationContext {
  proRationEnabled: boolean;
  policyFrom: unknown;
  policyTo: unknown;
}

const computeAgeFromDob = (dateOfBirth: unknown): number | null => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth as string);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

const optionMetaMatchesTarget = (optionMeta: any[], target: any[]): boolean => {
  if (!Array.isArray(optionMeta) || !Array.isArray(target)) return false;
  if (optionMeta.length !== target.length) return false;
  return target.every((targetMeta) =>
    optionMeta.some(
      (meta) =>
        String(meta?.parameterId) === String(targetMeta?.parameterId) &&
        String(meta?.parameterOptionId) === String(targetMeta?.parameterOptionId)
    )
  );
};

const findChoiceForComponent = (
  option: any,
  componentId: number,
  sumInsuredId: number
): any | null => {
  const sections: any[] = [
    option?.basePolicyChoices?.mainPolicyChoices,
    ...(option?.basePolicyChoices?.addonChoices ?? []),
    option?.parentalPolicyChoices?.mainPolicyChoices,
    ...(option?.parentalPolicyChoices?.addonChoices ?? []),
  ].filter(Boolean);

  const section = sections.find((s) => Number(s?.policyId) === componentId);
  if (!section) return null;

  const availableChoices = (section.choices ?? []).filter(
    (c: any) => c?.isAvailable !== false
  );
  return (
    availableChoices.find((c: any) => Number(c?.sumInsuredId) === sumInsuredId) ??
    null
  );
};

export interface MatchingDependentsSelection {
  selectionComponentId: number;
}

export const getMatchingDependentsForComponent = (
  dependents: any[],
  selectionComponentId: number
): any[] => {
  if (!Number.isFinite(selectionComponentId)) return [];
  return (Array.isArray(dependents) ? dependents : []).filter((dependent) => {
    const dependentMappings =
      Array.isArray(dependent?.choices) && dependent.choices.length > 0
        ? dependent.choices
        : [
            {
              policyComponentActionTypeId:
                dependent?.policyComponentActionTypeId,
            },
          ];
    return dependentMappings.some(
      (mapping: any) =>
        Number(mapping?.policyComponentActionTypeId) === selectionComponentId
    );
  });
};

// Dedicated Dependent Count / Dependent Attribute / Max Dependent Count parameter
// types are already priced correctly by the existing (server-resolved) combined
// path — see resolveApplyToDependentsPremium in per-dependent-resolution.util.ts,
// which accounts for the dependent-count band via dependentCountZeroOptionMeta.
// This client-side path does NOT replicate that band substitution, so it must
// never activate on a policy that also has one of these parameters configured —
// doing so would silently ignore the count/attribute band and produce a wrong
// number instead of deferring to the already-working path.
const DEPENDENT_COUNT_INTERNAL_TYPE = "dependent-count";
const DEPENDENT_ATTRIBUTE_INTERNAL_TYPE = "dependent-attribute";
const MAX_DEPENDENT_COUNT_INTERNAL_TYPE = "max-dependent-count";

const hasDedicatedDependentParameter = (parameters: any[]): boolean => {
  const dedicatedTypes = new Set([
    DEPENDENT_COUNT_INTERNAL_TYPE,
    DEPENDENT_ATTRIBUTE_INTERNAL_TYPE,
    MAX_DEPENDENT_COUNT_INTERNAL_TYPE,
  ]);
  return parameters.some((p: any) => {
    const type = String(p?.type ?? "").toLowerCase();
    const internalType = String(p?.internalType ?? "").toLowerCase();
    return dedicatedTypes.has(type) || dedicatedTypes.has(internalType);
  });
};

// Resolves the applyToDependents parameter (plain range-type "Age" only) for a
// given policy config, if one exists. Returns null when there is nothing for
// this pricing path to do (falls back to existing flat-multiplier behavior),
// including whenever a dedicated dependent-count/attribute parameter is also
// configured on the same policy — that combined case is out of scope here.
const resolveAgeApplyToDepParam = (parameters: any[]): any | null => {
  if (hasDedicatedDependentParameter(parameters)) return null;
  return (
    parameters.find(
      (p: any) =>
        p?.applyToDependents === true &&
        Array.isArray(p?.rangeDetails) &&
        p.rangeDetails.length > 0 &&
        String(p?.displayName ?? "").trim().toLowerCase() === "age"
    ) ?? null
  );
};

// Resolves ONE life's own bucket choice (self or a dependent) for the given
// applyToDependents parameter. Returns null if the life's DOB doesn't resolve
// to a configured band or no matching policyOption/choice exists.
const resolveLifeBucketChoice = (
  applyToDepParam: any,
  baseOptionMeta: any[],
  policyOptionsList: any[],
  selectionComponentId: number,
  sumInsuredId: number,
  dateOfBirth: unknown
): any | null => {
  const age = computeAgeFromDob(dateOfBirth);
  if (age === null) return null;

  const matchedRange = applyToDepParam.rangeDetails.find((range: any) => {
    const min = Number(range?.min ?? 0) || 0;
    const rawMax = Number(range?.max);
    const max = Number.isFinite(rawMax) ? rawMax : Number.MAX_SAFE_INTEGER;
    return age >= min && age <= max;
  });
  if (!matchedRange) return null;

  const lifeOptionMeta = baseOptionMeta.map((meta: any) =>
    String(meta?.parameterId) === String(applyToDepParam.id)
      ? { ...meta, parameterOptionId: matchedRange.id }
      : meta
  );

  const matchedOption = policyOptionsList.find((option: any) =>
    optionMetaMatchesTarget(option?.optionMeta, lifeOptionMeta)
  );
  if (!matchedOption) return null;

  return findChoiceForComponent(matchedOption, selectionComponentId, sumInsuredId);
};

// Computes self + per-dependent premium for ONE specific sumInsuredId tier of
// ONE component selection. Returns null whenever required data or a bucket
// match isn't available, so the caller can fall back to today's behavior
// rather than guess.
//
// employeeDateOfBirth is REQUIRED to resolve self's own bucket price fresh —
// the same way every dependent's is resolved — rather than trusting
// selfCompanyContribution/selfEmployeeContribution as "self alone". Those
// values can already be the correctly combined self+dependents total (once the
// backend has resolved and persisted it, with premiumPerLife flipped to
// false); treating that as a self-only baseline and adding a dependent's
// bucket price on top of it double-counts them. Passing no DOB is the caller
// asserting the given self values are already known to be a single life's own
// price (e.g. a per-tier "Choose Your Plan" choice, never combined) — in that
// case they're used as-is.
export const computePerLifePremiumBreakdown = (
  policyConfig: any,
  selectionComponentId: number,
  sumInsuredId: number,
  dependents: any[],
  selfCompanyContribution: number,
  selfEmployeeContribution: number,
  employeeDateOfBirth?: unknown,
  proration?: ProrationContext,
  employeeEffectiveDate?: unknown
): PremiumBreakdownEntry[] | null => {
  if (!Number.isFinite(selectionComponentId) || !Number.isFinite(sumInsuredId)) {
    return null;
  }

  const parameters = Array.isArray(policyConfig?.parameters)
    ? policyConfig.parameters
    : [];
  const policyOptionsList = Array.isArray(policyConfig?.policyOptions)
    ? policyConfig.policyOptions
    : [];
  const baseOptionMeta = policyConfig?.availablePolicyChoices?.optionMeta;

  const applyToDepParam = resolveAgeApplyToDepParam(parameters);
  if (!applyToDepParam) return null;
  if (
    policyOptionsList.length === 0 ||
    !Array.isArray(baseOptionMeta) ||
    baseOptionMeta.length === 0
  ) {
    return null;
  }

  const matchingDependents = getMatchingDependentsForComponent(
    dependents,
    selectionComponentId
  );
  if (matchingDependents.length === 0) return null;

  let selfCompanyPay = selfCompanyContribution;
  let selfEmployeePay = selfEmployeeContribution;
  let selfChoice: any = null;
  let selfBreakdownEntry: any = null;
  if (employeeDateOfBirth) {
    selfChoice = resolveLifeBucketChoice(
      applyToDepParam,
      baseOptionMeta,
      policyOptionsList,
      selectionComponentId,
      sumInsuredId,
      employeeDateOfBirth
    );
    if (!selfChoice) return null;
    // Some tiers (typically the default one) carry their own embedded premiumBreakdown, meaning
    // their top-level companyContribution/employeeContribution is already a combined family total
    // for that specific tier — not self's own share. When present, pull self's own price out of
    // that breakdown instead of reading the combined total directly.
    selfBreakdownEntry = Array.isArray(selfChoice?.premiumBreakdown)
      ? selfChoice.premiumBreakdown.find((entry: any) => entry?.isEmployee === true)
      : null;
    selfCompanyPay = Number(selfBreakdownEntry?.companyPay ?? selfChoice?.companyContribution ?? 0);
    selfEmployeePay = Number(selfBreakdownEntry?.employeePay ?? selfChoice?.employeeContribution ?? 0);
  }

  // Raw (unprorated) self price — kept around so a same-bucket dependent below can borrow
  // it as their own baseline before ITS OWN proration is applied; using the already-prorated
  // selfCompanyPay/selfEmployeePay there would prorate that dependent's share twice.
  const rawSelfCompanyPay = selfCompanyPay;
  const rawSelfEmployeePay = selfEmployeePay;

  // Self is prorated by their OWN effective date; each dependent below by
  // THEIRS — never a single shared factor, since a dependent can join months
  // after the employee (or vice versa for a dependent already on record).
  if (proration) {
    selfCompanyPay = calculateProratedAmount(
      selfCompanyPay,
      proration.policyFrom,
      proration.policyTo,
      employeeEffectiveDate,
      proration.proRationEnabled
    );
    selfEmployeePay = calculateProratedAmount(
      selfEmployeePay,
      proration.policyFrom,
      proration.policyTo,
      employeeEffectiveDate,
      proration.proRationEnabled
    );
  }

  const breakdown: PremiumBreakdownEntry[] = [
    {
      label: "Self",
      isEmployee: true,
      companyPay: selfCompanyPay,
      employeePay: selfEmployeePay,
    },
  ];

  for (const dependent of matchingDependents) {
    const choice = resolveLifeBucketChoice(
      applyToDepParam,
      baseOptionMeta,
      policyOptionsList,
      selectionComponentId,
      sumInsuredId,
      dependent?.dateOfBirth
    );
    if (!choice) return null;

    // Same combined-total contamination as self's tier above, plus a second wrinkle: the
    // embedded breakdown only lists whichever dependents were present when the backend last
    // precomputed this specific tier's "default" combo — a dependent not in that snapshot
    // (e.g. a spouse added since) has no entry of their own to pull out. But if this dependent
    // resolved to the exact same bucket+tier choice as self (checked by reference — the same
    // underlying option array entry), the Age-based scheme guarantees they're charged the
    // identical flat rate as self, so self's already-extracted true single-life price is the
    // correct stand-in.
    const depBreakdownEntry = Array.isArray(choice?.premiumBreakdown)
      ? choice.premiumBreakdown.find((entry: any) => {
          if (entry?.isEmployee) return false;
          const entryLabel = String(entry?.label ?? "").trim().toLowerCase();
          const depRelation = String(dependent?.relation ?? dependent?.relationshipType ?? "").trim().toLowerCase();
          const depName = String(dependent?.name ?? "").trim().toLowerCase();
          return entryLabel.length > 0 && (entryLabel === depRelation || entryLabel === depName);
        })
      : null;
    const sameBucketAsSelf = choice === selfChoice;

    let depCompanyPay = Number(
      depBreakdownEntry?.companyPay ??
      (sameBucketAsSelf && selfBreakdownEntry ? rawSelfCompanyPay : choice?.companyContribution) ??
      0
    );
    let depEmployeePay = Number(
      depBreakdownEntry?.employeePay ??
      (sameBucketAsSelf && selfBreakdownEntry ? rawSelfEmployeePay : choice?.employeeContribution) ??
      0
    );
    if (proration) {
      // A dependent's effectiveDate is only ever populated explicitly (e.g. via a Life Event
      // addition) — the backend never defaults it to "now" on save, and it's frequently left
      // NULL. The correct default for a normal-flow dependent (added alongside the employee,
      // not via a separate life event) is the employee's own effective date. When even that is
      // unavailable, deliberately leave depEffectiveDate undefined rather than falling back to
      // new Date() — calculateProratedAmount's own rule (line ~51) is "no effective date known
      // -> return the unprorated amount", and that's exactly how self is treated in the
      // identical situation above; forcing "today" here would prorate a dependent while self
      // (with equally-missing data) skips proration entirely, an inconsistency for no reason.
      const depEffectiveDate = dependent?.effectiveDate ?? employeeEffectiveDate;
      depCompanyPay = calculateProratedAmount(
        depCompanyPay,
        proration.policyFrom,
        proration.policyTo,
        depEffectiveDate,
        proration.proRationEnabled
      );
      depEmployeePay = calculateProratedAmount(
        depEmployeePay,
        proration.policyFrom,
        proration.policyTo,
        depEffectiveDate,
        proration.proRationEnabled
      );
    }

    breakdown.push({
      label: dependent?.relation ?? dependent?.relationshipType ?? "Dependent",
      isEmployee: false,
      companyPay: depCompanyPay,
      employeePay: depEmployeePay,
    });
  }

  return breakdown;
};

// For a component with NO applyToDependents/dependent-count parameter at all —
// every covered life pays the identical tier price (today's flat "self price x
// headcount" case). Proration still must be per-life: self by their own
// effective date, each dependent by theirs — a single shared factor would be
// wrong whenever a dependent joined at a different time than the employee.
// Returns null (unchanged flat behavior) when proration isn't enabled or
// there's nothing to prorate, so the caller's existing flat-multiply path is
// used untouched in every case this doesn't explicitly handle.
export const computeFlatPerLifeProratedBreakdown = (
  matchingDependents: any[],
  includeSelf: boolean,
  selfCompanyContribution: number,
  selfEmployeeContribution: number,
  employeeEffectiveDate: unknown,
  proration: ProrationContext
): PremiumBreakdownEntry[] | null => {
  if (!proration?.proRationEnabled) return null;
  if (!includeSelf && matchingDependents.length === 0) return null;

  const breakdown: PremiumBreakdownEntry[] = [];

  if (includeSelf) {
    breakdown.push({
      label: "Self",
      isEmployee: true,
      companyPay: calculateProratedAmount(
        selfCompanyContribution,
        proration.policyFrom,
        proration.policyTo,
        employeeEffectiveDate,
        true
      ),
      employeePay: calculateProratedAmount(
        selfEmployeeContribution,
        proration.policyFrom,
        proration.policyTo,
        employeeEffectiveDate,
        true
      ),
    });
  }

  for (const dependent of matchingDependents) {
    // Same rationale as computePerLifePremiumBreakdown: a dependent's effectiveDate is
    // frequently NULL (the backend never defaults it). Default to the employee's own effective
    // date — that's what a normal-flow dependent addition is expected to be saved as. When even
    // that's unavailable, leave it undefined so calculateProratedAmount's "no date known ->
    // return unprorated" rule applies, same as self gets above when self's date is missing too.
    const depEffectiveDate = dependent?.effectiveDate ?? employeeEffectiveDate;
    breakdown.push({
      label: dependent?.relation ?? dependent?.relationshipType ?? "Dependent",
      isEmployee: false,
      companyPay: calculateProratedAmount(
        selfCompanyContribution,
        proration.policyFrom,
        proration.policyTo,
        depEffectiveDate,
        true
      ),
      employeePay: calculateProratedAmount(
        selfEmployeeContribution,
        proration.policyFrom,
        proration.policyTo,
        depEffectiveDate,
        true
      ),
    });
  }

  return breakdown;
};
