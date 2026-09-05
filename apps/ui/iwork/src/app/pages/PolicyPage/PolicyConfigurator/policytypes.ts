export const COMMA_FORMATTING = "CRORE"; // or "CRORE" or ""
//const COMMA_FORMATTING = "MILLION"; // or "CRORE" or ""
export const COMMA_SEPARATOR = ",";

export const POLICY_TYPES = [
  { value: "GMC", label: "GMC (Group Medical Coverage)" },
  { value: "GTL", label: "GTL (Group Term Life)" },
  { value: "GPA", label: "GPA (Group Personal Accident)" },
];

export type policy_type = "GMC" | "GTL" | "GPA";
export type policy_status =
  | "DRAFT"
  | "WIP"
  | "SUBMITTED"
  | "COMPLETE"
  | "REJECT";

export const PolicyTypes: policy_type[] = ["GMC", "GTL", "GPA"];

export const PolicyStatuses: policy_status[] = [
  "DRAFT",
  "WIP",
  "SUBMITTED",
  "COMPLETE",
  "REJECT",
];

export const POLICY_CONFIGURATOR_STATUS = {
  DRAFT: "Draft",
  WIP: "Wip",
  SUBMITTED: "Submitted",
  COMPLETE: "Complete",
  REJECTED: "Rejected",
  LIVE: "Live",
  LIVEEDITPENDINGAPPROVAL: "Live_Edit_Pending_Approval",
  LIVEEDITSUBMIT: "Live_Edit_Submit",
} as const;

export type Policy_Configurator_Status =
  (typeof POLICY_CONFIGURATOR_STATUS)[keyof typeof POLICY_CONFIGURATOR_STATUS];

export enum SumInsuredModel {
  FLAT = "FLAT",
  MULTIPLE = "MULTIPLE",
}

export const relations = [
  {
    type: "Self",
    options: ["Self"],
  },
  {
    type: "Spouse/Partner",
    options: [
      "Husband",
      "Wife",
      "Spouse",
      "Partner",
      "Same-sex Spouse",
      "Same-sex Partner",
    ],
  },
  {
    type: "Children",
    options: ["Son", "Daughter", "Child"],
  },
  {
    type: "Parents",
    options: ["Father", "Mother", "Mother-in-law", "Father-in-law", "Parent"],
  },
  {
    type: "Siblings",
    options: ["Brother", "Sister", "Sibling"],
  },
];

export const PolicyParameterMaster = [
  {
    name: "Age",
    type: "range",
    values: [],
  },
  {
    name: "Grade",
    type: "range",
    values: [],
  },
  {
    name: "Relationship Group",
    type: "relation",
    values: ["Self", "Spouse/Partner", "Children", "Parents", "Siblings"],
  },
  {
    name: "Gender",
    type: "list",
    values: ["Male", "Female"],
  },
  {
    name: "Marital Status",
    type: "list",
    values: ["Married", "Single"],
  },
  {
    name: "Designation",
    type: "list",
    values: ["Associate", "Executive", "Management", "Leadership"],
  },
  {
    name: "Custom List",
    type: "list",
    values: ["Option-1", "Option-2"],
  },
  {
    name: "Custom Range",
    type: "range",
    values: [],
  },
  {
    name: "Dependent Count",
    type: "dependent-count",
    values: ["All", "Self", "Spouse/Partner", "Children", "Parents", "Siblings"],
  },
  {
    name: "Dependent Attribute",
    type: "dependent-attribute",
    internalType: "dependent-attribute",
    repeatable: true,
    values: [],
  },
  {
    name: "Max Dependent Count",
    type: "max-dependent-count",
    internalType: "max-dependent-count",
    values: [],
  },
];

export interface SumInsuredOption {
  id: number;
  value: string;
}

export interface PolicyComponent {
  id: string;
  label?: string;
  type: string; // Made type mandatory
  sumInsuredModel: SumInsuredModel; // FLAT or MULTIPLE
  siMultipleLabel: string; // Configurable label, defaults to "CTC"
  siMultipleMin?: number; // Minimum value for the Sum Insured regardless of Multple
  siMultipleMax?: number; // Maximum value for the Sum Insured regardless of Multple
  sumInsuredOptions: SumInsuredOption[];
  nextSumInsuredId: number;
  showCompanyContribution: boolean; // Whether to show company contribution
  premiumPerLife: boolean; // Whether premium is per life or per family
  sumInsuredPerLife?: boolean; // Whether sum insured is per life or per family
  proRationEnabled: boolean; // Whether the pro-ration is enabled or not;
  isBenefitComponent?: boolean; // Pure semantic marker (FR-054.3); no enforced behavioural constraints — only ERR-BC-001 (must be on type==="optional").
  acceptRelationsFromParent?: boolean; // When true: this component inherits relations from its parent component (UI flag only, no runtime behaviour yet).
  isOptional?: boolean; // When true on a type==="base" component, IBP renders it under the Optional accordion instead of the Compulsory dropdown, so enrolment can complete without selecting it. Defaults to false.
}

// --- New interfaces for Policy Relationships ---
export interface RelationOptionConfig {
  name: string;
  enabled: boolean;
  minAge: string;
  maxAge: string;
  minAgeError?: string;
  maxAgeError?: string;
}

export interface RelationTypeConfig {
  type: string;
  enabled: boolean;
  maxCount: string;
  maxCountError?: string;
  configuredOptions: RelationOptionConfig[];
}

// --- End New interfaces ---

export const PolicyComponentTypeMaster = [
  {
    type: "base",
    label: "Base Policy",
    max: 1,
  },
  {
    type: "parental",
    label: "Parental Policy",
    max: 1,
  },
  {
    type: "optional",
    label: "Optional Policy",
    max: 200,
  },
];

// --- Interfaces for Policy Parameters Configuration ---
export interface RangeDetailConfig {
  id: string;
  rangeDisplayName: string;
  min: string;
  max: string;
}

export interface DependentCountBandConfig {
  id: string;
  displayName: string;
  minCount: string;       // stored as string (same pattern as range min/max)
  maxCount: string | null; // null = unlimited upper bound
  siEnhancement: string;  // stored as formatted number string
}

export interface DependentCountDetailConfig {
  targetRelationCategory: string; // e.g. "Parents", "Children", "All"
  countBands: DependentCountBandConfig[];
  nextCountBandId: number;
}

export interface MaxDependentCountOption {
  id: string;
  label: string;    // matched against the value the user types in the "Max Dependent Count" upload template column
  max: string;       // total dependents allowed for that label; exceeding it fails the employee
}

export interface MaxDependentCountDetailConfig {
  options: MaxDependentCountOption[];
  nextOptionId: number;
}

export interface DependentAttributeRangeBand {
  id: string;
  displayName: string;
  min: string;            // numeric string, inclusive lower bound
  max: string | null;     // numeric string, inclusive upper bound; null = unlimited
  companyAdditionalPremium: string;
  employeeAdditionalPremium: string;
}

export interface DependentAttributeListOption {
  id: string;
  value: string;          // categorical string value the dependent record carries
  companyAdditionalPremium: string;
  employeeAdditionalPremium: string;
}

export interface DependentAttributeDetailConfig {
  targetRelationCategory: string;   // "Self" | "Spouse/Partner" | "Children" | "Parents" | "Siblings"
  attributeKind: "range" | "list";
  targetAttributeName: string;      // e.g., "Age", "Health Tier"
  rangeBands: DependentAttributeRangeBand[];
  listOptions: DependentAttributeListOption[];
  nextBandId: number;
  nextOptionId: number;
}

export interface UserDetailConfig {
  id: string;
  label: string;
}

export interface LovDetailConfig {
  id: string;
  value: string;
  isDefault?: boolean; // To distinguish master values from user-added ones
}

export interface SelectedRelationConfig {
  name: string; // e.g., "Self", "Spouse"
  selected: boolean;
  maxCount: string;
  maxCountError?: string;
}

export interface RelationGroupDetailConfig {
  id: string;
  groupDisplayName: string; // Added for the group name
  // groupDisplayName?: string; // Optional: if each group needs a unique name
  selectedRelations: SelectedRelationConfig[];
  familyMaxCount: string;
  familyMaxCountError?: string;
  familyMaxManuallySet?: boolean;
}

export interface ConfiguredPolicyParameter {
  id: string;
  parameterMasterName: string; // Name from PolicyParameterMaster
  type: "range" | "list" | "relation" | "dependent-count" | "dependent-attribute" | "max-dependent-count"; // Type from PolicyParameterMaster
  displayName: string; // User-defined display name for the policy
  applyToDependents?: boolean; // When true, each life resolves their own band independently
  rangeDetails: RangeDetailConfig[]; // Always an array, even if empty
  nextRangeDetailId: number;
  lovDetails: LovDetailConfig[]; // Always an array, even if empty
  nextLovDetailId: number;
  relationGroupDetails: RelationGroupDetailConfig[]; // For relation type
  nextRelationGroupDetailId: number; // For relation type
  dependentCountConfig?: DependentCountDetailConfig; // Only for type === "dependent-count"
  dependentAttributeConfig?: DependentAttributeDetailConfig; // Only for type === "dependent-attribute"
  maxDependentCountConfig?: MaxDependentCountDetailConfig; // Only for type === "max-dependent-count"
}
// --- End Interfaces for Policy Parameters Configuration ---

// --- Interface for the combined Policy Relationships Summary ---
export interface PolicyRelationshipsSummary {
  enabledPolicyRelations: RelationTypeConfig[];
  familyMaxPolicyLevel: string;
}

// --- Interface for Policy Overview Data ---
export interface PolicyOverviewData {
  companyName: string;
  policyType: string; // "GMC", "GTL", "GPA"
  policyNumber: string;
}

export const PolicyTemplateConfigTypeMaster = {
  provisionPolicyNumber: {
    type: "string",
    label: "Provisional Policy Number",
    defaultValue: "",
  },
  insurerPolicyNumber: {
    type: "string",
    label: "Insurer Policy Number",
    defaultValue: "",
  },
  iirmPolicyNumber: {
    type: "string",
    label: "IIRM Policy Number",
    defaultValue: "",
  },
};

export enum PolicyBranch {
  BASE = "base",
  PARENTAL = "parental",
}

export interface CompoundPolicyTemplateConfig {
  mainPolicyId: string;
  provisionPolicyNumber?: string;
  insurerPolicyNumber?: string;
  iirmPolicyNumber?: string;
  eligibleRelations?: string[]; // Array of enabled relation types (e.g., ["Self", "Spouse/Partner"])
  clubSumInsured?: boolean; // Club sum insured for main policy only (not for addons)
  addonIds: {
    optionId: string;
    sequence: number;
    provisionPolicyNumber?: string;
    insurerPolicyNumber?: string;
    iirmPolicyNumber?: string;
    eligibleRelations?: string[]; // Array of enabled relation types for this addon
  }[]; // Array of IDs for optional components
}

export interface GroupPolicyTemplateConfig {
  basePolicy: CompoundPolicyTemplateConfig;
  parentalPolicy?: CompoundPolicyTemplateConfig;
}

export interface PolicyOptionChoice {
  sumInsuredId: number;
  isAvailable: boolean;
  isDefault: boolean;
  companyContribution: number;
  employeeContribution: number;
}

export interface PolicyOptionParameterMeta {
  parameterId: string;
  parameterOptionId: string;
}

export interface PolicyOptionChoiceMeta {
  policyId: string;
  configured: boolean;
  choices: PolicyOptionChoice[];
}

export interface ConfiguredPolicyOption {
  optionId: string;
  optionLabel: string;
  optionMeta: PolicyOptionParameterMeta[];
  basePolicyChoices: {
    mainPolicyChoices: PolicyOptionChoiceMeta;
    addonChoices: PolicyOptionChoiceMeta[];
  };
  parentalPolicyChoices?: {
    mainPolicyChoices: PolicyOptionChoiceMeta;
    addonChoices: PolicyOptionChoiceMeta[];
  };
}

export interface ConfiguredPolicyConstraints {
  sezApplicable?: boolean;
  payrollInstallments?: number;
  showEmployeeContribution?: boolean;
  crossParentsAllowed?: boolean;
  sameGenderParentsAllowed?: boolean;
  twinsSecondChildAllowed?: boolean;
  tripletsSecondChildAllowed?: boolean;
  allowFirstChildAsTwin?: boolean;
  unmarriedDaughterAgeExtension?: number;
  studyingSonAgeExtension?: number;
  enrollmentConfirmationRequired?: boolean;
  autoLockEnrollmentAfterConfirmation?: boolean;
  lockEnrollmentAfterCutoff?: boolean;
  allowResubmissionBeforeLock?: boolean;
  confirmationStatusVisibleToHR?: boolean;
  documentUploadForAdditionsRequired?: boolean;
  documentUploadForDeletionsRequired?: boolean;
  customDisclaimerBeforeSubmission?: string;
  femaleEmployeesCoverParents?: boolean;
  maleEmployeesCoverParents?: boolean;
  femaleEmployeesCoverInLaws?: boolean;
  maleEmployeesCoverInLaws?: boolean;
  ageGapBetweenChildrenAndEmployee?: number;
  ageGapBetweenParentAndEmployee?: number;
}

// --- Master Data for Policy Constraints ---

/**
 * Defines the configuration for a single policy constraint in the master data.
 * @template TValue The type of the constraint's value.
 */
export interface PolicyConstraintConfig<TValue> {
  /** User-friendly label for the constraint question. */
  questionLabel: string;
  /** Default value for the constraint. */
  defaultValue: TValue;
  /** UI input type for rendering the constraint. */
  uiType: "boolean" | "number" | "text" | "list";
  /** Options for 'select' uiType. Values should match the possible values of TValue. */
  options?: ReadonlyArray<{ value: string; label: string }>;
}

/**
 * Mapped type providing master configuration (label, default value, UI type)
 * for each property in ConfiguredPolicyConstraints.
 * It ensures that `defaultValue` has the non-nullable type of the constraint.
 */
export type PolicyConstraintsMasterData = {
  [K in keyof ConfiguredPolicyConstraints]-?: PolicyConstraintConfig<
    NonNullable<ConfiguredPolicyConstraints[K]>
  >;
};

/**
 * Options for Enrollment Verification Mode.
 */
export const EnrollmentVerificationModeOptions = [
  { value: "SMS", label: "SMS" },
  { value: "EMAIL", label: "Email" },
  { value: "BOTH", label: "Both SMS & Email" },
  { value: "NONE", label: "None" },
] as const;

/**
 * Master data for policy constraints, defining labels, default values, and UI hints.
 */
export const POLICY_CONSTRAINTS_MASTER: PolicyConstraintsMasterData = {
  sezApplicable: {
    questionLabel: "Is SEZ based Tax discount applicable?",
    defaultValue: false,
    uiType: "boolean",
  }, // No direct match from list, kept existing
  showEmployeeContribution: {
    questionLabel: "Show Employee Contribution to Employee?",
    defaultValue: true,
    uiType: "boolean",
  }, // No direct match from list, kept existing
  payrollInstallments: {
    questionLabel: "Number of payroll installments for premium deduction",
    defaultValue: 1,
    uiType: "number",
  }, // No direct match, kept existing
  crossParentsAllowed: {
    questionLabel: "Cross Selection of Parents Allowed?",
    defaultValue: false,
    uiType: "boolean",
  },
  sameGenderParentsAllowed: {
    questionLabel: "Allow coverage for same-gender parent & parent-in-law?",
    defaultValue: false,
    uiType: "boolean",
  }, // Kept existing as "Father & Father-in-law..." is too specific
  twinsSecondChildAllowed: {
    questionLabel: "Second Child as Twins Allowed?",
    defaultValue: true,
    uiType: "boolean",
  },
  tripletsSecondChildAllowed: {
    questionLabel: "Second Child as Triplets Allowed?",
    defaultValue: false,
    uiType: "boolean",
  },
  allowFirstChildAsTwin: {
    questionLabel: "Allow First Child as Twins?",
    defaultValue: false,
    uiType: "boolean",
  },
  unmarriedDaughterAgeExtension: {
    questionLabel: "Unmarried Daughter Age Limit Extension (years)",
    defaultValue: 0,
    uiType: "number",
  },
  studyingSonAgeExtension: {
    questionLabel: "Studying Son Age Limit Extension (years)",
    defaultValue: 0,
    uiType: "number",
  },
  enrollmentConfirmationRequired: {
    questionLabel: "Enrollment Confirmation Required?",
    defaultValue: true,
    uiType: "boolean",
  },
  autoLockEnrollmentAfterConfirmation: {
    questionLabel:
      "Automatically lock enrollment immediately after an employee confirms?",
    defaultValue: true,
    uiType: "boolean",
  },
  lockEnrollmentAfterCutoff: {
    questionLabel:
      "Automatically lock enrollment for all employees after the defined cutoff date?",
    defaultValue: true,
    uiType: "boolean",
  },
  allowResubmissionBeforeLock: {
    questionLabel:
      "Allow employees to modify and resubmit their enrollment before it's locked?",
    defaultValue: true,
    uiType: "boolean",
  },
  confirmationStatusVisibleToHR: {
    questionLabel:
      "Make employee enrollment confirmation status visible to HR/Admins?",
    defaultValue: true,
    uiType: "boolean",
  },
  documentUploadForAdditionsRequired: {
    questionLabel:
      "Require document upload for natural additions (life events)?",
    defaultValue: true,
    uiType: "boolean",
  },
  documentUploadForDeletionsRequired: {
    questionLabel:
      "Require document upload for natural deletions (life events)?",
    defaultValue: true,
    uiType: "boolean",
  },
  customDisclaimerBeforeSubmission: {
    questionLabel:
      "Custom disclaimer text to display to employees before enrollment submission",
    defaultValue: "",
    uiType: "text",
  },
  femaleEmployeesCoverParents: {
    questionLabel: "Allow female employees to cover their own parents?",
    defaultValue: true,
    uiType: "boolean",
  },
  maleEmployeesCoverParents: {
    questionLabel: "Allow male employees to cover their own parents?",
    defaultValue: true,
    uiType: "boolean",
  },
  femaleEmployeesCoverInLaws: {
    questionLabel: "Allow female employees to cover their parents-in-law?",
    defaultValue: true,
    uiType: "boolean",
  },
  maleEmployeesCoverInLaws: {
    questionLabel: "Allow male employees to cover their parents-in-law?",
    defaultValue: true,
    uiType: "boolean",
  },
  ageGapBetweenChildrenAndEmployee: {
    questionLabel:
      "Minimum required age gap between employee and their child (years)",
    defaultValue: 18,
    uiType: "number",
  },
  ageGapBetweenParentAndEmployee: {
    questionLabel:
      "Minimum required age gap between employee and their parent (years, parent older)",
    defaultValue: 18,
    uiType: "number",
  },
};

// --- End Master Data for Policy Constraints ---

// --- Interface for the Overall Policy Configuration ---
export interface UserDetailsSectionConfig {
  displayName: string;
  items: UserDetailConfig[];
}

export interface PolicyConfiguration {
  id: number;
  status: Policy_Configurator_Status;
  step: number;
  configuration: {
    components: PolicyComponent[];
    relationships: PolicyRelationshipsSummary;
    parameters: ConfiguredPolicyParameter[];
    policyTemplate: GroupPolicyTemplateConfig;
    policyOptions: ConfiguredPolicyOption[];
    constraints: ConfiguredPolicyConstraints;
    selectedLocationIds?: { id: number; address_1: string }[];
    enablePolicyLocations?: boolean;
    userDetailsSection?: UserDetailsSectionConfig;
  };
}

// Define a Response DTO for the policy configurations GET query that only includes a few columns
export class PolicyConfigurationsResponse {
  id!: number;
  companyId!: number;
  policyTypeLid!: number;
  policyId!: number;
  policyConfiguartionStatusLid!: number;
  policyStep!: number;
  createdAt!: Date | null;
  updatedAt!: Date | null;
}

export interface PolicyResponse {
  id: number;
  companyId: number;
  policyTypeLid: number;
  policyId: number;
  policyConfiguartionStatusLid: number;
  policyStep: number;
  policyConfiguration: PolicyConfiguration["configuration"];
  remarks?: string | null;
  version?: number;
  approverName?: string | null;
  rejectedByName?: string | null;
  requestSentToName?: string | null;
}

export type ConfigStep =
  | "policyComponents"
  | "policyChoiceTemplate"
  | "policyRelationships"
  | "policyParameters"
  | "policyChoices"
  | "policyConstraints"
  | "policyLocations";
