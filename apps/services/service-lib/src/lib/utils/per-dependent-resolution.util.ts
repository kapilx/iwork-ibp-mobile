import { calculateAgeAtEffectiveDate } from "./premium-calculator.util";
import { createLogger } from "../logger";
import { DEPENDENT_COUNT_ALL_CATEGORY } from "../../../../../../libs/service-lib/src/lib/constants";

const logger = createLogger();

export interface OptionMetaEntry {
  parameterId: string;
  parameterOptionId: string;
}

export interface LifeRecord {
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  effectiveDate?: Date | string | null;
  deletedAt?: Date | string | null;
  relation?: string | null;
  [key: string]: any;
}

export interface PerDependentParameter {
  id: string;
  parameterMasterName?: string;
  displayName?: string;
  type?: string;
  internalType?: string;
  rangeDetails?: Array<{ id: string; min: string | number; max: string | number }>;
  lovDetails?: Array<{ id: string; value: string }>;
}

interface PolicyChoiceSection {
  policyId: number;
  choices?: Array<{
    isAvailable?: boolean;
    sumInsuredId?: number;
    companyContribution?: number | string;
    employeeContribution?: number | string;
    [key: string]: any;
  }>;
}

export interface PerDependentPolicyOption {
  optionId?: string | number;
  optionMeta: OptionMetaEntry[];
  basePolicyChoices?: {
    mainPolicyChoices?: PolicyChoiceSection;
    addonChoices?: PolicyChoiceSection[];
  };
  parentalPolicyChoices?: {
    mainPolicyChoices?: PolicyChoiceSection;
    addonChoices?: PolicyChoiceSection[];
  };
}

export interface PerDependentResolutionParams {
  parameter: PerDependentParameter;
  employee: LifeRecord & { [key: string]: any };
  dependents: LifeRecord[];
  baseOptionMeta: OptionMetaEntry[];
  policyOptions: PerDependentPolicyOption[];
  componentId: number;
  effectiveDate?: Date | string | null;
  // The specific sumInsuredOptions id (config.components[].sumInsuredOptions[].id) this
  // life's premium was actually chosen at — required so findChoicePremiumForComponent
  // picks the matching SI tier's contribution instead of just the first available one.
  sumInsuredId?: number | null;
  // When the policy also has a Dependent Count parameter, each dependent's own
  // premium (unlike the employee's) must be priced as if they were the only
  // life enrolled — i.e. looked up at the "0 dependents" band, not whatever
  // band the base bucket currently sits at. Callers resolve this band by its
  // min/max=0 value (never by display name, which is admin-configurable).
  dependentCountZeroOptionMeta?: OptionMetaEntry | null;
}

export interface PerDependentPremiumResult {
  premium: number;
  companyPay: number;
  employeePay: number;
  // Per-life composition of the total above — one entry per life priced
  // (employee + each dependent) — so the UI can show how the total was built
  // up instead of just the lump sum.
  perLife?: Array<{
    label: string;
    isEmployee: boolean;
    companyPay: number;
    employeePay: number;
  }>;
}

export interface DependentOnlyPremiumParams {
  parameter: PerDependentParameter;
  dependent: LifeRecord;
  employee?: LifeRecord;
  baseOptionMeta: OptionMetaEntry[];
  policyOptions: PerDependentPolicyOption[];
  componentId: number;
  effectiveDate?: Date | string | null;
  // The specific sumInsuredOptions id (config.components[].sumInsuredOptions[].id) this
  // dependent's premium was actually chosen at — required so findChoicePremiumForComponent
  // picks the matching SI tier's contribution instead of just the first available one.
  sumInsuredId?: number | null;
}

/**
 * Maps an actual chosen sum-insured VALUE (e.g. 300000) to the config's abstract
 * sumInsuredOptions id (e.g. 3) for a given component — the id policyOptions choices
 * key their companyContribution/employeeContribution by. Mirrors the equivalent
 * value->id lookup already used in premium-calculator.util.ts/enrollment-processing.util.ts.
 */
export function resolveSumInsuredIdForValue(
  components:
    | Array<{ id?: number; sumInsuredOptions?: Array<{ id: number; value: string | number }> }>
    | undefined,
  componentId: number,
  sumInsuredValue: number | string | null | undefined,
): number | null {
  if (sumInsuredValue === null || sumInsuredValue === undefined) return null;
  const component = (components ?? []).find((c) => c.id === componentId);
  if (!component?.sumInsuredOptions?.length) return null;
  const target = Number(sumInsuredValue);
  if (isNaN(target)) return null;
  const matched = component.sumInsuredOptions.find(
    (opt) => Number(opt.value) === target,
  );
  return matched?.id ?? null;
}

function getEmployeeAttributeValue(
  employee: LifeRecord,
  parameterName: string,
): string | number | null {
  const normalizedName = parameterName.toLowerCase().replace(/\s+/g, "");
  for (const [key, val] of Object.entries(employee)) {
    if (
      key.toLowerCase().replace(/[\s_-]+/g, "") === normalizedName &&
      val !== null &&
      val !== undefined &&
      typeof val !== "object"
    ) {
      return val as string | number;
    }
  }
  const extras = (employee.additionalDetails ?? employee.additionalParams ?? employee.additionalAttributes) as
    | Record<string, any>
    | undefined;
  if (extras && typeof extras === "object") {
    for (const [key, val] of Object.entries(extras)) {
      if (
        key.toLowerCase().replace(/[\s_-]+/g, "") === normalizedName &&
        val !== null &&
        val !== undefined &&
        typeof val !== "object"
      ) {
        return val as string | number;
      }
    }
  }
  return null;
}

function findChoicePremiumForComponent(
  option: PerDependentPolicyOption,
  componentId: number,
  sumInsuredId?: number | null,
): { companyPay: number; employeePay: number } | null {
  const sections: PolicyChoiceSection[] = [
    option.basePolicyChoices?.mainPolicyChoices,
    ...(option.basePolicyChoices?.addonChoices ?? []),
    option.parentalPolicyChoices?.mainPolicyChoices,
    ...(option.parentalPolicyChoices?.addonChoices ?? []),
  ].filter((s): s is PolicyChoiceSection => Boolean(s));

  const section = sections.find((s) => s.policyId === componentId);
  if (!section) return null;

  const availableChoices = (section.choices ?? []).filter(
    (c) => c.isAvailable !== false,
  );
  // Must match the life's actual chosen SI tier — falling back to the first available
  // choice (e.g. the lowest/default tier) silently mispriced every SI tier above it.
  const choice =
    (sumInsuredId != null
      ? availableChoices.find((c) => c.sumInsuredId === sumInsuredId)
      : undefined) ?? availableChoices[0];
  if (!choice) return null;

  return {
    companyPay: Number(choice.companyContribution ?? 0),
    employeePay: Number(choice.employeeContribution ?? 0),
  };
}

function optionMetaMatches(
  optionMeta: OptionMetaEntry[],
  lifeOptionMeta: OptionMetaEntry[],
): boolean {
  if (optionMeta.length !== lifeOptionMeta.length) return false;
  return lifeOptionMeta.every((lm) =>
    optionMeta.some(
      (om) =>
        om.parameterId === lm.parameterId &&
        om.parameterOptionId === lm.parameterOptionId,
    ),
  );
}

export function resolveOptionIdForLife(
  life: LifeRecord,
  employee: LifeRecord,
  parameter: PerDependentParameter,
  effectiveDate?: Date | string | null,
): string | null {
  const paramName = (
    parameter.parameterMasterName ??
    parameter.displayName ??
    ""
  ).toLowerCase();

  if (paramName === "age") {
    const dob = life.dateOfBirth ? new Date(life.dateOfBirth as any) : null;
    if (!dob || isNaN(dob.getTime())) return null;

    const refDate = life.effectiveDate
      ? new Date(life.effectiveDate as any)
      : effectiveDate
      ? new Date(effectiveDate as any)
      : new Date();

    const age = calculateAgeAtEffectiveDate(dob, refDate);
    const matchedRange = (parameter.rangeDetails ?? []).find((range) => {
      const min = parseInt(String(range.min ?? 0)) || 0;
      const rawMax = parseInt(String(range.max ?? ""));
      const max = isNaN(rawMax) ? Number.MAX_SAFE_INTEGER : rawMax;
      return age >= min && age <= max;
    });
    if (!matchedRange) {
      const desc =
        (life as any).isEmployee === true
          ? "Employee"
          : ((life.relation as string | null) ?? "Dependent");
      throw new Error(
        `ERR-ATD-002: ${desc}'s age "${age}" does not match any configured band/option.`,
      );
    }
    return matchedRange.id;
  }

  if (paramName === "gender") {
    const genderValue = ((life.gender as string | null) ?? "").toLowerCase().trim();
    let matched = (parameter.lovDetails ?? []).find(
      (lov) => (lov.value ?? "").toLowerCase() === genderValue,
    );
    if (!matched) {
      const empGender = ((employee.gender as string | null) ?? "").toLowerCase().trim();
      matched = (parameter.lovDetails ?? []).find(
        (lov) => (lov.value ?? "").toLowerCase() === empGender,
      );
    }
    return matched?.id ?? null;
  }

  // Try life's own attribute first (covers per-dependent values like MaritalStatus).
  // Fall back to employee when the dependent doesn't carry the attribute.
  const attrName = parameter.parameterMasterName ?? parameter.displayName ?? "";
  let attrValue = getEmployeeAttributeValue(life, attrName);
  if (attrValue === null) {
    attrValue = getEmployeeAttributeValue(employee, attrName);
  }
  if (attrValue === null) return null;
  if (parameter.rangeDetails?.length) {
    const numVal = Number(attrValue);
    const matchedRange = parameter.rangeDetails.find((range) => {
      const min = parseInt(String(range.min ?? 0)) || 0;
      const rawMax = parseInt(String(range.max ?? ""));
      const max = isNaN(rawMax) ? Number.MAX_SAFE_INTEGER : rawMax;
      return numVal >= min && numVal <= max;
    });
    return matchedRange?.id ?? null;
  }

  if (parameter.lovDetails?.length) {
    const matched = parameter.lovDetails.find(
      (lov) => (lov.value ?? "").toLowerCase() === String(attrValue).toLowerCase(),
    );
    return matched?.id ?? null;
  }

  return null;
}

/**
 * Resolves the total premium for a component when one or more parameters carry
 * `applyToDependents: true`.  Each enrolled life — employee plus every dependent
 * — is evaluated independently against the parameter bands using their own
 * attribute value.  The individually resolved Stage 5 premiums are summed.
 *
 * FR-053: The caller must NOT apply a `premiumPerLife` multiplier on top of
 * the result returned by this function; the sum already accounts for all lives.
 */
export function resolveApplyToDependentsPremium(
  params: PerDependentResolutionParams,
): PerDependentPremiumResult {
  const {
    parameter,
    employee,
    dependents,
    baseOptionMeta,
    policyOptions,
    componentId,
    effectiveDate,
    sumInsuredId,
    dependentCountZeroOptionMeta,
  } = params;

  const allLives: Array<LifeRecord & { isEmployee: boolean }> = [
    { ...employee, isEmployee: true },
    ...dependents.map((d) => ({ ...d, isEmployee: false })),
  ];

  let totalCompanyPay = 0;
  let totalEmployeePay = 0;
  const perLife: NonNullable<PerDependentPremiumResult["perLife"]> = [];

  for (const life of allLives) {
    const matchedOptionId = resolveOptionIdForLife(
      life,
      employee,
      parameter,
      effectiveDate,
    );
    if (!matchedOptionId) continue;

    // Each dependent (not the employee) is priced as if enrolled alone — their
    // own age band, but the Dependent Count portion of the bucket pinned to the
    // "0 dependents" band, not whatever count band the family is currently at.
    const lifeOptionMeta: OptionMetaEntry[] = baseOptionMeta.map((meta) => {
      if (meta.parameterId === parameter.id) {
        return { ...meta, parameterOptionId: matchedOptionId };
      }
      if (
        !life.isEmployee &&
        dependentCountZeroOptionMeta &&
        meta.parameterId === dependentCountZeroOptionMeta.parameterId
      ) {
        return { ...meta, parameterOptionId: dependentCountZeroOptionMeta.parameterOptionId };
      }
      return meta;
    });

    const matchedOption = policyOptions.find(
      (option) =>
        Array.isArray(option.optionMeta) &&
        optionMetaMatches(option.optionMeta, lifeOptionMeta),
    );
    if (!matchedOption) {
      throw new Error(
        `ERR-ATD-003: No policy option found for resolved parameter combination`,
      );
    }

    const choiceAmounts = findChoicePremiumForComponent(matchedOption, componentId, sumInsuredId);
    if (choiceAmounts === null) {
      throw new Error(
        `ERR-ATD-004: No Stage 5 choice configured for option ${matchedOption.optionId ?? componentId}`,
      );
    }

    totalCompanyPay += choiceAmounts.companyPay;
    totalEmployeePay += choiceAmounts.employeePay;
    perLife.push({
      label: life.isEmployee ? "Self" : (life.relation as string | null) ?? "Dependent",
      isEmployee: life.isEmployee,
      companyPay: choiceAmounts.companyPay,
      employeePay: choiceAmounts.employeePay,
    });
  }

  // FR-053: total is the algebraic sum of individually resolved premiums.
  return {
    companyPay: totalCompanyPay,
    employeePay: totalEmployeePay,
    premium: totalCompanyPay + totalEmployeePay,
    perLife,
  };
}

/**
 * Resolves the premium for a single dependent based on the parameter configuration.
 * Unlike resolveApplyToDependentsPremium, only the dependent's premium is calculated —
 * the employee is excluded from the sum.
 *
 * For per-dependent attributes (age, gender) the dependent's own values are used.
 * For employee-level attributes (Grade, Designation, etc.) the employee record is
 * used as the lookup source when provided.
 */
export function resolveDependentOnlyPremiumByConfiguration(
  params: DependentOnlyPremiumParams,
): PerDependentPremiumResult {
  const { parameter, dependent, employee, baseOptionMeta, policyOptions, componentId, effectiveDate, sumInsuredId } = params;

  const matchedOptionId = resolveOptionIdForLife(
    dependent,
    employee ?? dependent,
    parameter,
    effectiveDate,
  );
  if (!matchedOptionId) {
    throw new Error(`No matching option found for parameter ${parameter.id} — falling back to choice premium`);
  }

  const lifeOptionMeta: OptionMetaEntry[] = baseOptionMeta.map((meta: OptionMetaEntry) =>
    meta.parameterId === parameter.id
      ? { ...meta, parameterOptionId: matchedOptionId }
      : meta,
  );
  const matchedOption = policyOptions.find(
    (option) =>
      Array.isArray(option.optionMeta) &&
      optionMetaMatches(option.optionMeta, lifeOptionMeta),
  );
  if (!matchedOption) {
    throw new Error(
      `ERR-DOC-001: No policy option found for resolved parameter combination`,
    );
  }

  const choiceAmounts = findChoicePremiumForComponent(matchedOption, componentId, sumInsuredId);
  if (choiceAmounts === null) {
    throw new Error(
      `ERR-DOC-002: No Stage 5 choice configured for option ${matchedOption.optionId ?? componentId}`,
    );
  }
  return {
    companyPay: choiceAmounts.companyPay,
    employeePay: choiceAmounts.employeePay,
    premium: choiceAmounts.companyPay + choiceAmounts.employeePay,
  };
}

// ─── Dependent Attribute Parameter (Phase 2) ─────────────────────────────────

export interface DependentAttributeBand {
  id: string;
  displayName: string;
  min: string;
  max: string | null;
  companyAdditionalPremium: string;
  employeeAdditionalPremium: string;
}

export interface DependentAttributeListOpt {
  id: string;
  value: string;
  companyAdditionalPremium: string;
  employeeAdditionalPremium: string;
}

export interface DependentAttributeConfig {
  targetRelationCategory: string;
  attributeKind: "range" | "list";
  targetAttributeName: string;
  rangeBands?: DependentAttributeBand[];
  listOptions?: DependentAttributeListOpt[];
}

export interface DependentAttributeParam {
  dependentAttributeConfig: DependentAttributeConfig;
  label?: string;
  displayName?: string;
}

export interface DependentAttributePremiumResult {
  companyAdditional: number;
  employeeAdditional: number;
  perDependent: Array<{ depRef: LifeRecord; companyAdditional: number; employeeAdditional: number }>;
}

/**
 * For each enrolled dependent whose relation category matches
 * `parameter.dependentAttributeConfig.targetRelationCategory`, resolves the
 * dependent's attribute value (range or list), looks up the matching band/option,
 * and accumulates the additive company/employee premiums.
 *
 * FR-058 / BR-033: The returned amounts are additive on top of the base Stage 5
 * choice premium — the caller is responsible for summing them onto the choice.
 * FR-059 / BR-036: Returns { 0, 0 } when no matching dependents are enrolled.
 */
export function resolveDependentAttributePremium(
  dependents: LifeRecord[],
  parameter: DependentAttributeParam,
  effectiveDate?: Date | string | null,
  relationNameToTypeMap?: Map<string, string>,
): DependentAttributePremiumResult {
  const cfg = parameter.dependentAttributeConfig;
  const targetNorm = (cfg.targetRelationCategory ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z]/g, "");

  const normRelField = (raw: unknown): string =>
    String(raw ?? "").toLowerCase().trim().replace(/[^a-z]/g, "");
  const matchesTarget = (raw: unknown): boolean => {
    const n = normRelField(raw);
    return !!n && (n === targetNorm || n.includes(targetNorm) || targetNorm.includes(n));
  };

  // "All" means every dependent counts toward this attribute, irrespective of
  // relation category — mirrors the same "All" handling for Dependent Count bands.
  const matchingDependents =
    targetNorm === DEPENDENT_COUNT_ALL_CATEGORY.toLowerCase()
      ? dependents
      : dependents.filter((dep) => {
          if (dep.relation && relationNameToTypeMap) {
            const resolvedType = relationNameToTypeMap.get(
              String(dep.relation).toLowerCase().trim(),
            );
            if (resolvedType !== undefined) {
              return matchesTarget(resolvedType);
            }
          }
          return matchesTarget((dep as any).relationshipType) || matchesTarget(dep.relation);
        });

  if (!matchingDependents.length) {
    return { companyAdditional: 0, employeeAdditional: 0, perDependent: [] };
  }

  const paramLabel = parameter.label ?? parameter.displayName ?? "Dependent Attribute";
  const perDependent: DependentAttributePremiumResult["perDependent"] = [];

  for (const dep of matchingDependents) {
    let depCompany = 0;
    let depEmployee = 0;

    // Resolution failure for a single dependent (missing DOB, unresolvable/
    // non-numeric attribute, or no band/list option matches) must not block
    // premium calculation for the rest of the enrollment — log it and fall
    // back to 0 additional premium for this dependent instead of throwing.
    try {
      if (cfg.attributeKind === "range") {
        // Priority 1: band ID stored directly in dep.additionalAttributes keyed by
        // the DA parameter label (set when the upload file has a "Dependent Attribute"
        // column with values like "b2"/"b3").
        const additionalAttrs = (dep as any).additionalAttributes;
        let resolvedFromBandId = false;
        if (additionalAttrs && typeof additionalAttrs === "object") {
          for (const [key, val] of Object.entries(additionalAttrs as Record<string, unknown>)) {
            if (key.toLowerCase().trim() === paramLabel.toLowerCase().trim() && val) {
              const directBand = (cfg.rangeBands ?? []).find((b) => b?.displayName === String(val));
              if (directBand) {
                depCompany = parseFloat(directBand.companyAdditionalPremium ?? "0");
                depEmployee = parseFloat(directBand.employeeAdditionalPremium ?? "0");
                resolvedFromBandId = true;
                break;
              }
            }
          }
        }

        if (!resolvedFromBandId) {
          // Priority 2: compute from age (DOB) or a numeric attribute on the dependent.
          const attrNameNorm = (cfg.targetAttributeName ?? "").toLowerCase().trim();
          let attrValue: number;

          if (attrNameNorm === "age" || attrNameNorm.startsWith("age")) {
            const dob = dep.dateOfBirth ? new Date(dep.dateOfBirth as any) : null;
            if (!dob || isNaN(dob.getTime())) {
              throw new Error(
                `ERR-DA-001: Cannot resolve age for dependent — date of birth is missing or invalid`,
              );
            }
            const refDate = dep.effectiveDate
              ? new Date(dep.effectiveDate as any)
              : effectiveDate
                ? new Date(effectiveDate as any)
                : new Date();
            attrValue = calculateAgeAtEffectiveDate(dob, refDate);
          } else {
            const rawVal = getEmployeeAttributeValue(dep, paramLabel); // Pass paramLabel --> [Dependent Attribute : "val"]
            const num = Number(rawVal);
            if (rawVal === null || isNaN(num)) {
              throw new Error(
                `ERR-DA-002: Dependent attribute "${paramLabel}" could not be resolved or is not numeric`,
              );
            }
            attrValue = num;
          }

          const sorted = [...(cfg.rangeBands ?? [])].sort(
            (a, b) => parseFloat(a.min) - parseFloat(b.min),
          );
          const matched = sorted.find(
            (band) =>
              attrValue >= parseFloat(band.min) &&
              (band.max === null || attrValue <= parseFloat(band.max)),
          );
          if (!matched) {
            throw new Error(
              `ERR-DA-003: Dependent attribute value "${attrValue}" does not fall within any configured band for parameter "${paramLabel}"`,
            );
          }
          depCompany = parseFloat(matched.companyAdditionalPremium ?? "0");
          depEmployee = parseFloat(matched.employeeAdditionalPremium ?? "0");
        }
      } else {
        const attrValue = String(
          getEmployeeAttributeValue(dep, cfg.targetAttributeName) ?? "",
        );
        const matched = (cfg.listOptions ?? []).find((opt) => opt.value === attrValue);
        if (!matched) {
          throw new Error(
              `ERR-DA-002: Dependent attribute "${paramLabel}" could not be resolved or is not numeric`,
          );
        }
        depCompany = parseFloat(matched.companyAdditionalPremium ?? "0");
        depEmployee = parseFloat(matched.employeeAdditionalPremium ?? "0");
      }
    } catch (err) {
      logger.error(
        `[resolveDependentAttributePremium] ${err instanceof Error ? err.message : err}`,
      );
      depCompany = 0;
      depEmployee = 0;
    }

    perDependent.push({ depRef: dep, companyAdditional: depCompany, employeeAdditional: depEmployee });
  }

  const companyAdditional = perDependent.reduce((s, e) => s + e.companyAdditional, 0);
  const employeeAdditional = perDependent.reduce((s, e) => s + e.employeeAdditional, 0);
  return { companyAdditional, employeeAdditional, perDependent };
}
