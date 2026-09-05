import dayjs from "dayjs";
import { DependentRelationConfig } from "../../utils/companyConfig";

export interface DisplayDependent {
  key: string;
  id?: number;
  name: string;
  relationship: string;
  gender: string;
  rawGender: string;
  rawDateOfBirth?: string;
  dobInput: string; // DD/MM/YYYY for the edit form
  dobLabel: string; // "12 Jan 1990 · 35 yrs" for the card
  initial: string;
  isSelf?: boolean; // the employee's own (Self) row — prefilled, read-only
}

// Config-free relationship list. No policy eligibility rules are applied here —
// the policy is not configured yet, so we only offer the common family relations.
export const RELATIONSHIP_OPTIONS = [
  { label: "Spouse", value: "Spouse" },
  { label: "Son", value: "Son" },
  { label: "Daughter", value: "Daughter" },
  { label: "Father", value: "Father" },
  { label: "Mother", value: "Mother" },
  { label: "Father-in-law", value: "Father-in-law" },
  { label: "Mother-in-law", value: "Mother-in-law" },
];

// Frontend-only default config used when no policy is configured yet. Drives the
// relationship dropdown, the DependentRulesCard guidance, and the soft DOB age
// hints. Intentionally PERMISSIVE and non-binding — nothing here blocks a submit;
// authoritative eligibility is enforced later at actual enrollment.
const opt = (name: string, minAge: string, maxAge: string, enabled = true) => ({
  name,
  minAge,
  maxAge,
  enabled,
  minAgeError: "",
  maxAgeError: "",
});

export const DEFAULT_RELATIONSHIPS = {
  familyMaxPolicyLevel: "6",
  enabledPolicyRelations: [
    {
      type: "Self",
      enabled: true,
      maxCount: "1",
      configuredOptions: [opt("Self", "18", "100")],
    },
    {
      type: "Spouse/Partner",
      enabled: true,
      maxCount: "1",
      configuredOptions: [
        opt("Husband", "", "", false),
        opt("Wife", "", "", false),
        opt("Spouse", "18", "100"),
        opt("Partner", "", "", false),
        opt("Same-sex Spouse", "", "", false),
        opt("Same-sex Partner", "", "", false),
      ],
    },
    {
      type: "Children",
      enabled: true,
      maxCount: "2",
      configuredOptions: [
        opt("Son", "0", "26"),
        opt("Daughter", "0", "26"),
        opt("Child", "", "", false),
      ],
    },
    {
      type: "Parents",
      enabled: true,
      maxCount: "2",
      configuredOptions: [
        opt("Father", "18", "100"),
        opt("Mother", "18", "100"),
        opt("Father-in-law", "18", "100"),
        opt("Mother-in-law", "18", "100"),
        opt("Parent", "", "", false),
      ],
    },
  ],
};

export const DEFAULT_CONSTRAINTS = {
  tpaMandatory: true,
  gstApplicable: true,
  sezApplicable: false,
  showGstToEmployee: true,
  crossParentsAllowed: false,
  payrollInstallments: 4,
  parentalLockInPeriod: 2,
  allowFirstChildAsTwin: false,
  studyingSonAgeExtension: 0,
  twinsSecondChildAllowed: false,
  maleEmployeesCoverInLaws: true,
  sameGenderParentsAllowed: false,
  showEmployeeContribution: false,
  lockEnrollmentAfterCutoff: true,
  maleEmployeesCoverParents: true,
  femaleEmployeesCoverInLaws: true,
  tripletsSecondChildAllowed: false,
  femaleEmployeesCoverParents: true,
  confirmationStatusVisibleToHR: true,
  unmarriedDaughterAgeExtension: 0,
  ageGapBetweenParentAndEmployee: 10,
  enrollmentConfirmationRequired: true,
  ageGapBetweenChildrenAndEmployee: 10,
  customDisclaimerBeforeSubmission: "",
  documentUploadForAdditionsRequired: true,
  documentUploadForDeletionsRequired: true,
  autoLockEnrollmentAfterConfirmation: false,
};

// ── Company-configured dependent relations ───────────────────────────────────
// The per-company `dependentRelationConfig` (from config-service via the IBP
// company config) uses per-relation max counts + a few flags. This page consumes
// a per-GROUP relationship config, so map one to the other. Used only when a
// company has configured it; otherwise the DEFAULT_* above apply.

const relationMaxCount = (
  relations: DependentRelationConfig["relations"],
  key: string,
): number => {
  const n = Number(relations?.[key]?.maxCount);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export const buildRelationshipsFromConfig = (config: DependentRelationConfig) => {
  const r = config?.relations ?? {};
  const spouse = relationMaxCount(r, "spouse");
  const son = relationMaxCount(r, "son");
  const daughter = relationMaxCount(r, "daughter");
  const father = relationMaxCount(r, "father");
  const mother = relationMaxCount(r, "mother");
  const fatherInLaw = relationMaxCount(r, "fatherInLaw");
  const motherInLaw = relationMaxCount(r, "motherInLaw");

  const childrenMax = son + daughter;
  const parentsMax = father + mother + fatherInLaw + motherInLaw;

  const familyMaxRaw = config?.constraints?.familyMaxPolicyLevel;
  const familyMaxPolicyLevel =
    familyMaxRaw != null && Number(familyMaxRaw) > 0
      ? String(familyMaxRaw)
      : DEFAULT_RELATIONSHIPS.familyMaxPolicyLevel;

  return {
    familyMaxPolicyLevel,
    enabledPolicyRelations: [
      {
        type: "Self",
        enabled: true,
        maxCount: "1",
        configuredOptions: [opt("Self", "18", "100")],
      },
      {
        type: "Spouse/Partner",
        enabled: spouse > 0,
        maxCount: String(spouse),
        configuredOptions: [opt("Spouse", "18", "100")],
      },
      {
        type: "Children",
        enabled: childrenMax > 0,
        maxCount: String(childrenMax),
        configuredOptions: [
          ...(son > 0 ? [opt("Son", "0", "26")] : []),
          ...(daughter > 0 ? [opt("Daughter", "0", "26")] : []),
        ],
      },
      {
        type: "Parents",
        enabled: parentsMax > 0,
        maxCount: String(parentsMax),
        configuredOptions: [
          ...(father > 0 ? [opt("Father", "18", "100")] : []),
          ...(mother > 0 ? [opt("Mother", "18", "100")] : []),
          ...(fatherInLaw > 0 ? [opt("Father-in-law", "18", "100")] : []),
          ...(motherInLaw > 0 ? [opt("Mother-in-law", "18", "100")] : []),
        ],
      },
    ],
  };
};

export const buildConstraintsFromConfig = (config: DependentRelationConfig) => {
  const c = config?.constraints ?? {};
  return {
    ...DEFAULT_CONSTRAINTS,
    crossParentsAllowed: Boolean(c.crossParentsAllowed),
    sameGenderParentsAllowed: Boolean(c.sameGenderParentsAllowed),
    // Cover-in-laws default to permissive (true) when the flag is absent.
    maleEmployeesCoverInLaws: c.maleEmployeesCoverInLaws !== false,
    femaleEmployeesCoverInLaws: c.femaleEmployeesCoverInLaws !== false,
    // twins/triplets map to the "second child" extra-slot flags this page reads.
    allowFirstChildAsTwin: false,
    twinsSecondChildAllowed: Boolean(c.twinsAllowed),
    tripletsSecondChildAllowed: Boolean(c.tripletsAllowed),
  };
};

export interface RelationOption {
  label: string;
  value: string;
}

// Build the relationship dropdown from the (default or real) config's
// enabledPolicyRelations. Falls back to the static list if config is absent.
export const buildRelationshipOptionsFromConfig = (
  relationships: any,
): RelationOption[] => {
  const rels = relationships?.enabledPolicyRelations;
  if (!Array.isArray(rels)) return RELATIONSHIP_OPTIONS;
  const opts: RelationOption[] = [];
  const seen = new Set<string>();
  rels.forEach((rel: any) => {
    if (!rel?.enabled) return;
    if (String(rel?.type ?? "").toLowerCase().trim() === "self") return;
    (rel.configuredOptions || []).forEach((o: any) => {
      if (o?.enabled === false || !o?.name) return;
      const key = String(o.name).toLowerCase().trim();
      if (seen.has(key)) return;
      seen.add(key);
      opts.push({ label: o.name, value: o.name });
    });
  });
  return opts.length ? opts : RELATIONSHIP_OPTIONS;
};

// Map each configured option name -> its relation group type, and each group ->
// its maxCount. Used to gate the dropdown by remaining capacity per group.
const buildGroupMeta = (relationships: any) => {
  const rels = relationships?.enabledPolicyRelations;
  const nameToGroup = new Map<string, string>();
  const groupMax = new Map<string, number>();
  if (Array.isArray(rels)) {
    rels.forEach((rel: any) => {
      if (!rel?.enabled) return;
      const type = String(rel?.type ?? "").trim();
      if (type.toLowerCase() === "self") return;
      const max = Number(rel?.maxCount);
      groupMax.set(type, Number.isFinite(max) ? max : Number.POSITIVE_INFINITY);
      (rel.configuredOptions || []).forEach((o: any) => {
        if (o?.enabled === false || !o?.name) return;
        nameToGroup.set(String(o.name).toLowerCase().trim(), type);
      });
    });
  }
  return { nameToGroup, groupMax };
};

// ── Multiple-birth (twin/triplet) child slots ────────────────────────────────
// Mirrors FamilyMembersManagement: beyond the base children maxCount, extra
// children are permitted when the policy allows shared birth events —
//   allowFirstChildAsTwin      → eldest child may have 1 twin sibling  (eldest group up to 2)
//   twinsSecondChildAllowed     → youngest child may have 1 twin sibling (youngest group up to 2)
//   tripletsSecondChildAllowed  → youngest child may have 2 triplet siblings (youngest group up to 3)
// They compose: extraSlots = (eldestCap - 1) + (youngestCap - 1).
interface ChildMultipleBirthConfig {
  allowFirstChildAsTwin: boolean;
  twinsSecondChildAllowed: boolean;
  tripletsSecondChildAllowed: boolean;
}

const getChildMultipleBirthConfig = (
  constraints: any,
): ChildMultipleBirthConfig => ({
  allowFirstChildAsTwin: constraints?.allowFirstChildAsTwin === true,
  twinsSecondChildAllowed: constraints?.twinsSecondChildAllowed === true,
  tripletsSecondChildAllowed: constraints?.tripletsSecondChildAllowed === true,
});

const getChildExtraSlots = (cfg: ChildMultipleBirthConfig): number => {
  const eldestCap = cfg.allowFirstChildAsTwin ? 2 : 1;
  const youngestCap = cfg.tripletsSecondChildAllowed
    ? 3
    : cfg.twinsSecondChildAllowed
      ? 2
      : 1;
  return eldestCap - 1 + (youngestCap - 1);
};

// Optional overall dependent-count cap (see resolveMaxDependentCountOverall
// below), additive to the per-group maxCount gating in
// buildAvailableRelationshipOptions. Only active when a policy's
// max-dependent-count parameter is configured AND the employee's own
// additionalDetails value matches one of its labeled options — otherwise
// undefined, and this screen behaves exactly as it does today.
export const resolveMaxDependentCountOverall = (
  policiesParameters: any[] | undefined | null,
  employeeAdditionalDetails: Record<string, unknown> | undefined | null,
): number | undefined => {
  if (!Array.isArray(policiesParameters)) return undefined;

  for (const parameters of policiesParameters) {
    if (!Array.isArray(parameters)) continue;
    const param = parameters.find((p: any) => p?.type === "max-dependent-count");
    const options = param?.maxDependentCountConfig?.options;
    if (!Array.isArray(options) || options.length === 0) continue;

    const employeeLabel = String(
      employeeAdditionalDetails?.[param?.parameterMasterName ?? param?.displayName] ?? "",
    ).trim();
    if (!employeeLabel) continue;

    const matched = options.find(
      (opt: any) => String(opt?.label ?? "").trim() === employeeLabel,
    );
    const max = matched ? parseInt(String(matched.max), 10) : NaN;
    if (Number.isFinite(max)) return max;
  }
  return undefined;
};

// Relationship options with per-group max-count gating: once a group is full
// among the employee's existing dependents, that group's options are dropped
// from the dropdown. The Children group may exceed its base maxCount by the
// twin/triplet extra slots derived from `constraints`. `keepRelation` is always
// kept visible so the currently-edited dependent's value stays selectable.
// `maxDependentCountOverall`, when present, additionally caps the TOTAL
// dependent count across all groups combined (see resolveMaxDependentCountOverall).
export const buildAvailableRelationshipOptions = (
  relationships: any,
  existingRelations: string[] = [],
  keepRelation?: string,
  constraints?: any,
  maxDependentCountOverall?: number,
): RelationOption[] => {
  const isInLaw = (v: string) =>
    v === "father-in-law" || v === "mother-in-law";
  const isOwnParent = (v: string) => v === "father" || v === "mother";

  const base = buildRelationshipOptionsFromConfig(relationships);
  const { nameToGroup, groupMax } = buildGroupMeta(relationships);

  const keepLower = String(keepRelation ?? "").toLowerCase().trim();

  // Overall cap reached → no further options, regardless of per-group state
  // (the currently-edited relation's own value stays selectable). "Self" is
  // excluded from the count — the cap is on DEPENDENTS, not total family members.
  if (maxDependentCountOverall !== undefined) {
    const dependentCount = existingRelations.filter(
      (r) => String(r).toLowerCase().trim() !== "self",
    ).length;
    if (dependentCount >= maxDependentCountOverall) {
      return base.filter(
        (option) => option.value.toLowerCase().trim() === keepLower,
      );
    }
  }

  if (!nameToGroup.size) return base;

  const childExtraSlots = getChildExtraSlots(
    getChildMultipleBirthConfig(constraints),
  );

  const existingLower = existingRelations.map((r) =>
    String(r).toLowerCase().trim(),
  );
  const countByGroup = new Map<string, number>();
  existingLower.forEach((r) => {
    const g = nameToGroup.get(r);
    if (g) countByGroup.set(g, (countByGroup.get(g) ?? 0) + 1);
  });

  // crossParentsAllowed=false → own parents and parents-in-law are mutually
  // exclusive: once one kind is added, the other kind can no longer be selected.
  const noCrossParents = constraints?.crossParentsAllowed === false;
  const hasOwnParent = existingLower.some(isOwnParent);
  const hasInLaw = existingLower.some(isInLaw);

  return base.filter((option) => {
    const value = option.value.toLowerCase().trim();
    if (value === keepLower) return true;
    if (noCrossParents) {
      if (hasOwnParent && isInLaw(value)) return false;
      if (hasInLaw && isOwnParent(value)) return false;
    }
    const group = nameToGroup.get(value);
    if (!group) return true;
    let max = groupMax.get(group) ?? Number.POSITIVE_INFINITY;
    // Children may exceed base maxCount by the twin/triplet slots.
    if (group.toLowerCase() === "children") max += childExtraSlots;
    return (countByGroup.get(group) ?? 0) < max;
  });
};

export interface DependentRules {
  eligibility: Array<{
    type: string;
    maxCount?: number;
    minAge?: number;
    maxAge?: number;
    options: string[];
  }>;
  rules: string[];
}

// Translate the (default or real) config into human-readable "before you add a
// dependent" guidance: who can be added + which constraint rules apply. Purely
// informational — nothing here blocks a submission.
export const buildDependentRules = (
  relationships: any,
  constraints: any,
  employeeGender?: string,
): DependentRules => {
  const eligibility: DependentRules["eligibility"] = [];
  const rels = relationships?.enabledPolicyRelations;
  if (Array.isArray(rels)) {
    rels.forEach((rel: any) => {
      if (!rel?.enabled) return;
      if (String(rel?.type ?? "").toLowerCase().trim() === "self") return;
      const opts = (rel.configuredOptions || []).filter(
        (o: any) => o?.enabled !== false && o?.name,
      );
      if (!opts.length) return;
      const mins = opts
        .map((o: any) => Number(o.minAge))
        .filter((n: number) => Number.isFinite(n));
      const maxs = opts
        .map((o: any) => Number(o.maxAge))
        .filter((n: number) => Number.isFinite(n));
      const maxCount = Number(rel.maxCount);
      eligibility.push({
        type: rel.type,
        maxCount: Number.isFinite(maxCount) ? maxCount : undefined,
        minAge: mins.length ? Math.min(...mins) : undefined,
        maxAge: maxs.length ? Math.max(...maxs) : undefined,
        options: opts.map((o: any) => o.name),
      });
    });
  }

  const c = constraints || {};
  const num = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const gl = String(employeeGender ?? "").toLowerCase();
  const isFemale = gl.includes("female") || gl === "f";
  const isMale = !isFemale && (gl.includes("male") || gl === "m");
  const familyMax = Number(relationships?.familyMaxPolicyLevel);

  // Every possible constraint-derived rule. Each renders only when its `show`
  // condition holds, so the list reflects exactly what the (backend) config allows.
  const candidates: Array<{ show: boolean; text: string }> = [
    {
      show: Number.isFinite(familyMax) && familyMax > 0 && familyMax <= 50,
      text: `Up to ${familyMax} family members can be covered in total.`,
    },
    {
      show: isMale && c.maleEmployeesCoverParents === false,
      text: "As a male employee, you cannot add your own parents (Father, Mother).",
    },
    {
      show: isMale && c.maleEmployeesCoverInLaws === false,
      text: "As a male employee, you cannot add parents-in-law (Father-in-law, Mother-in-law).",
    },
    {
      show: isFemale && c.femaleEmployeesCoverParents === false,
      text: "As a female employee, you cannot add your own parents (Father, Mother).",
    },
    {
      show: isFemale && c.femaleEmployeesCoverInLaws === false,
      text: "As a female employee, you cannot add parents-in-law (Father-in-law, Mother-in-law).",
    },
    {
      show: c.crossParentsAllowed === false,
      text: "Cannot add both parents and parents-in-law together.",
    },
    {
      show: c.sameGenderParentsAllowed === false,
      text: "Same-gender parent combinations are not allowed (e.g. Father + Father-in-law).",
    },
    {
      show: num(c.parentalLockInPeriod) > 0,
      text: `Parents, once added, are locked in for ${num(c.parentalLockInPeriod)} year(s) and cannot be changed.`,
    },
    {
      show: num(c.ageGapBetweenParentAndEmployee) > 0,
      text: `A parent must be at least ${num(c.ageGapBetweenParentAndEmployee)} years older than you.`,
    },
    {
      show: num(c.ageGapBetweenChildrenAndEmployee) > 0,
      text: `A child must be at least ${num(c.ageGapBetweenChildrenAndEmployee)} years younger than you.`,
    },
    {
      show: num(c.studyingSonAgeExtension) > 0,
      text: `A studying son can be covered for ${num(c.studyingSonAgeExtension)} additional year(s).`,
    },
    {
      show: num(c.unmarriedDaughterAgeExtension) > 0,
      text: `An unmarried daughter can be covered for ${num(c.unmarriedDaughterAgeExtension)} additional year(s).`,
    },
    {
      show: Boolean(
        c.allowFirstChildAsTwin ||
          c.twinsSecondChildAllowed ||
          c.tripletsSecondChildAllowed,
      ),
      text: "Twins or triplets sharing the same date of birth can be added even beyond the usual child limit.",
    },
    {
      show: c.documentUploadForAdditionsRequired === true,
      text: "Supporting documents are required when adding a dependent.",
    },
    {
      show: c.documentUploadForDeletionsRequired === true,
      text: "Supporting documents are required when removing a dependent.",
    },
    {
      show: c.tpaMandatory === true,
      text: "TPA (Third Party Administrator) registration is mandatory.",
    },
    {
      show: c.enrollmentConfirmationRequired === true,
      text: "Enrollment confirmation is required to finalize your dependents.",
    },
    {
      show: c.lockEnrollmentAfterCutoff === true,
      text: "Dependents cannot be changed after the enrollment cut-off date.",
    },
    {
      show: c.autoLockEnrollmentAfterConfirmation === true,
      text: "Enrollment locks automatically once you confirm.",
    },
  ];

  const rules = candidates.filter((r) => r.show).map((r) => r.text);

  // Always-applicable reminders.
  rules.push(
    "Enter each dependent's full name, gender and date of birth accurately.",
  );
  rules.push(
    "You can edit or remove a dependent anytime before enrollment opens.",
  );

  return { eligibility, rules };
};

// Soft age guidance for a relation name, read from the config. Non-binding —
// used only for helper text, never to block a submission.
export const getAgeHintForRelation = (
  relationships: any,
  relationName: string,
): { minAge?: number; maxAge?: number } => {
  const rels = relationships?.enabledPolicyRelations;
  if (!Array.isArray(rels) || !relationName) return {};
  const target = relationName.toLowerCase().trim();
  for (const rel of rels) {
    const match = (rel?.configuredOptions || []).find(
      (o: any) => String(o?.name ?? "").toLowerCase().trim() === target,
    );
    if (match) {
      const min = Number(match.minAge);
      const max = Number(match.maxAge);
      return {
        minAge: Number.isFinite(min) ? min : undefined,
        maxAge: Number.isFinite(max) ? max : undefined,
      };
    }
  }
  return {};
};

// Coarse relationship-type bucket sent alongside `relation`. This is NOT a policy
// eligibility rule — just a stable category the backend expects on the dependent.
const RELATIONSHIP_TYPE_MAP: Record<string, string> = {
  spouse: "spouse",
  husband: "spouse",
  wife: "spouse",
  partner: "spouse",
  son: "children",
  daughter: "children",
  father: "parents",
  mother: "parents",
  "father-in-law": "parents-in-law",
  "mother-in-law": "parents-in-law",
};

export const getRelationshipType = (relation: string): string =>
  RELATIONSHIP_TYPE_MAP[String(relation || "").toLowerCase().trim()] ||
  String(relation || "").toLowerCase().trim();

// Gender implied by a relation, matching the form's gender option values
// ("male" | "female"). Mirrors getGenderByRelationship in
// EnrollmentFlow/FamilyMembersManagement: gendered relations map directly, while
// Spouse/Partner resolve to the opposite of the employee's gender. Anything
// unmapped returns "" so the user picks the gender themselves.
const RELATION_GENDER_MAP: Record<string, string> = {
  father: "male",
  mother: "female",
  son: "male",
  daughter: "female",
  husband: "male",
  wife: "female",
  grandfather: "male",
  grandmother: "female",
  grandson: "male",
  granddaughter: "female",
  "father-in-law": "male",
  "mother-in-law": "female",
  "son-in-law": "male",
  "daughter-in-law": "female",
};

export const getGenderForRelation = (
  relation: string,
  employeeGender?: string,
): string => {
  const normalized = String(relation || "").toLowerCase().trim();
  if (["spouse", "spouse/partner", "partner"].includes(normalized)) {
    const eg = String(employeeGender || "")
      .toLowerCase()
      .replace(/gender_type_/g, "")
      .trim();
    if (eg === "male" || eg === "m") return "female";
    if (eg === "female" || eg === "f") return "male";
    return "";
  }
  return RELATION_GENDER_MAP[normalized] || "";
};

export const toGenderDisplay = (value: unknown): string => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (["male", "m", "gender_type_male"].includes(raw)) return "Male";
  if (["female", "f", "gender_type_female"].includes(raw)) return "Female";
  if (["other", "o"].includes(raw)) return "Other";
  return "--";
};

// Normalizes a year-first calendar date to strict "YYYY-MM-DD" — needed because values
// sourced from a company's free-form additionalDetails JSON (e.g. "Effective Date", populated
// from that company's own enrollment upload template) can arrive with any separator
// ("2026/07/13", "2026.07.13", ...), while UpsertEnrollmentDependentDto's effectiveDate field
// is validated with @IsDateString() — strict ISO 8601, which rejects anything but hyphens
// outright with a 400. Only handles year-first input (unambiguous day/month order); deliberately
// does NOT attempt to guess DD/MM vs MM/DD for a non-year-first string — returns null instead of
// risking a silently wrong date, since the field is optional on the DTO.
export const normalizeToIsoDate = (value?: string | null): string | null => {
  if (!value) return null;
  const s = String(value).trim();
  const match = s.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
};

// Parse a DOB that may arrive as "YYYY-MM-DD" or a full ISO timestamp, taking only
// the calendar date so ahead-of-UTC timezones (e.g. IST) don't shift the day.
const parseCalendarDob = (dob?: string | null): dayjs.Dayjs | null => {
  if (!dob) return null;
  const s = String(dob).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return dayjs(`${iso[1]}-${iso[2]}-${iso[3]}`);
  const d = dayjs(s, "DD/MM/YYYY");
  return d.isValid() ? d : dayjs(s).isValid() ? dayjs(s) : null;
};

export const normalizeDependents = (raw: any[]): DisplayDependent[] => {
  const list = Array.isArray(raw) ? raw : [];
  const mapped: DisplayDependent[] = [];

  list.forEach((dep: any, index: number) => {
    const name = String(dep?.name ?? "").trim();
    const relationship = String(
      dep?.relation ?? dep?.relationship ?? dep?.relationshipType ?? "",
    ).trim();
    if (!name || !relationship) return;

    const dobObj = parseCalendarDob(dep?.dateOfBirth);
    const age = dobObj ? dayjs().diff(dobObj, "year") : null;
    const dobDisplay = dobObj ? dobObj.format("DD MMM YYYY") : "";
    const parsedId = Number(dep?.id);

    mapped.push({
      key: Number.isFinite(parsedId)
        ? String(parsedId)
        : `${name}-${relationship}-${index}`,
      id: Number.isFinite(parsedId) ? parsedId : undefined,
      name,
      relationship: relationship.charAt(0).toUpperCase() + relationship.slice(1),
      gender: toGenderDisplay(dep?.gender),
      rawGender: String(dep?.gender ?? "").toLowerCase(),
      rawDateOfBirth: dep?.dateOfBirth,
      dobInput: dobObj ? dobObj.format("DD/MM/YYYY") : "",
      dobLabel: dobDisplay
        ? age !== null
          ? `${dobDisplay} · ${age} yr${age === 1 ? "" : "s"}`
          : dobDisplay
        : "Not provided",
      initial: name.charAt(0).toUpperCase(),
    });
  });

  // De-dupe by name+relationship (dependents may repeat across policy rows).
  return Array.from(
    new Map(
      mapped.map((d) => [
        `${d.name.toLowerCase()}-${d.relationship.toLowerCase()}`,
        d,
      ]),
    ).values(),
  );
};

// Convert whatever the date field holds into a timezone-proof YYYY-MM-DD string.
export const toApiDate = (rawDob: unknown): string => {
  let dobDate: Date | null = null;
  if (rawDob instanceof Date) {
    dobDate = rawDob;
  } else if (
    rawDob &&
    typeof rawDob === "object" &&
    typeof (rawDob as { toDate?: unknown }).toDate === "function"
  ) {
    dobDate = (rawDob as { toDate: () => Date }).toDate();
  } else if (typeof rawDob === "string" && rawDob.trim()) {
    const trimmed = rawDob.trim();
    dobDate = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)
      ? dayjs(trimmed, "DD/MM/YYYY").toDate()
      : dayjs(trimmed).isValid()
        ? dayjs(trimmed).toDate()
        : null;
  }
  if (dobDate && !Number.isNaN(dobDate.getTime())) {
    return `${dobDate.getFullYear()}-${String(dobDate.getMonth() + 1).padStart(2, "0")}-${String(dobDate.getDate()).padStart(2, "0")}`;
  }
  return typeof rawDob === "string" ? rawDob : "";
};

// Build the employee's own (Self) row from the employee-details response, mirroring
// FamilyMembersManagement (name = employeeName ?? fullName, gender, dateOfBirth).
// Self is prefilled and read-only — it is not addable via the relationship dropdown.
export const buildSelfDependent = (payload: any): DisplayDependent | null => {
  const data = payload?.data?.data ?? payload?.data ?? {};
  const name = String(data?.employeeName ?? data?.fullName ?? "").trim();
  const genderRaw =
    data?.gender && typeof data.gender === "object"
      ? data.gender.value ?? data.gender.label ?? data.gender.key ?? ""
      : data?.gender;
  const dobRaw = data?.dateOfBirth ?? data?.dob;
  if (!name && !dobRaw && !genderRaw) return null;

  const dobObj = parseCalendarDob(dobRaw);
  const age = dobObj ? dayjs().diff(dobObj, "year") : null;
  const dobDisplay = dobObj ? dobObj.format("DD MMM YYYY") : "";
  const displayName = name || "Employee";

  return {
    key: "self",
    id: undefined,
    name: displayName,
    relationship: "Self",
    gender: toGenderDisplay(genderRaw),
    rawGender: String(genderRaw ?? "").toLowerCase(),
    rawDateOfBirth: dobRaw,
    dobInput: dobObj ? dobObj.format("DD/MM/YYYY") : "",
    dobLabel: dobDisplay
      ? age !== null
        ? `${dobDisplay} · ${age} yr${age === 1 ? "" : "s"}`
        : dobDisplay
      : "Not provided",
    initial: displayName.charAt(0).toUpperCase(),
    isSelf: true,
  };
};
