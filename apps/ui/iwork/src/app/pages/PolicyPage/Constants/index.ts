import { ColDef } from "ag-grid-community";
import {
  ConfigStep,
  ConfiguredPolicyOption,
  policy_status,
  PolicyComponentTypeMaster,
  PolicyConfiguration,
  SumInsuredModel,
  POLICY_CONFIGURATOR_STATUS,
} from "../PolicyConfigurator/policytypes";
// import { formatCurrencyByLocalization } from "../../../utils";
import {
  formatNumberShort,
  endPoints,
  FormFieldConfig,
  convertToTreeData,
  formatDate,
  formatNumberByLocalization,
  insurerListUtilityFunction,
  LocalizationConfig,
  theme,
  getAllMonths,
} from "@ui/ui-lib";
import { insurerBranchUtilityFunction } from "../../InsurerPage/AddInsurerBranch/formConfig";
import { createNewSumInsuredOption } from "../PolicyConfigurator/ConfiguratorFields";
import {
  POLICY_CHOICES_LABEL,
  POLICY_COMPONENTS_LABEL,
  POLICY_CONSTRAINTS_LABEL,
  POLICY_LOCATIONS_STEP_LABEL,
  POLICY_PARAMETERS_LABEL,
  POLICY_RELATIONSHIPS_LABEL,
  POLICY_TEMPLATE_LABEL,
} from "../../../constants";
import { organisationUtility } from "../../OpportunitiesPage/OpportunitiesListing/tableConfig";
import { companyUtilityFunctionFromContactPage } from "../../ContactPage/ContactListing/tableConfig";
import {
  hierarchyField,
  priorityStyleMap,
} from "../../CompanyPage/CompanyListing/tableConfig";
import { accountManagerUtilityFunction } from "@ui/ui-lib/utils/masterUserDataUtility";
export interface PolicyKPIData {
  totalCompanyCount: number;
  totalPolicyCount: number;
  premium: number;
  totalConfiguredPolicies: number;
}
export const kpisData = (
  kpiData: PolicyKPIData,
  localization?: LocalizationConfig
) => [
  {
    // Raw count, not pre-formatted: KPICards applies formatNumberByLocalization
    // itself using the localization it resolves (prop or its own hook).
    title: "Total companies",
    count: kpiData?.totalCompanyCount ?? 0,
    backgroundColor: theme.palette.kpiColors.purple,
    textColor: theme.palette.text.purple,
  },
  {
    title: "Total policies",
    count: kpiData?.totalPolicyCount ?? 0,
    backgroundColor: theme.palette.kpiColors.teal,
    textColor: theme.palette.text.teal,
  },
  {
    // A single amount, not a composite "(#count)" label — isFloatable lets
    // KPICards format it the same way as every other premium card (compact
    // Cr/L/K display, full-precision hover), instead of a one-off formatter.
    title: "Total premium",
    count: kpiData?.premium ?? 0,
    isFloatable: true,
    backgroundColor: theme.palette.kpiColors.orange,
    textColor: theme.palette.text.orange,
  },
  {
    title: "Configured policies",
    count: kpiData?.totalConfiguredPolicies ?? 0,
    backgroundColor: theme.palette.kpiColors.yellow,
    textColor: theme.palette.text.yellow,
  },
];
export const tableSearchConfig = (companyContactId?: string) => [
  {
    name: "companyName",
    label: "Company Name",
    type: "select",
    required: true,
    placeholder: "Enter company name",
  },
  {
    name: "policyNumber",
    label: "Policy Number",
    type: "select",
    required: false,
    placeholder: "Enter policy number",
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: false,
    options: [
      { label: "Active", value: "active" },
      { label: "Expired", value: "expired" },
    ],
    placeholder: "Select status",
  },
];

// --- Mock search form config ---
export const InsurerSearchConfig = (): FormFieldConfig[] => [
  {
    key: "insurerId",
    name: "insurerId",
    label: "Insurer",
    type: "selectFieldByApi",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.insurersList,
      utilityFunction: insurerListUtilityFunction,
      clearFieldsOnChange: ["insurerBranchId"],
    },
    placeholder: "Search",
  },
  {
    key: "insurerBranchId",
    name: "insurerBranchId",
    label: "Branch",
    type: "selectFieldByApi",
    gridColumn: 2.9,
    placeholder: "Search branch",
    apiDependencies: {
      endPoint: endPoints.insurerBranchList,
      dependentField: "insurerId",
      utilityFunction: insurerBranchUtilityFunction,
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "branchViewBy",
    name: "branchViewBy",
    label: "View by",
    type: "segmentedcontrol",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
      variantType: "primary",
      shouldClearValue: true,
    },
    apiDependencies: {
      showCondition: (watch: any) => !!watch("insurerBranchId"),
    },
    options: [
      { value: "branch", label: "Branch" },
      { value: "branchWithSub", label: "Branch + sub-branches" },
    ],
  },
];

export const PolicySearchConfig = (isConfigFromDashboard: boolean = false): FormFieldConfig[] => [
  {
    key: "companyName",
    name: "companyName",
    label: "Company name",
    type: "selectFieldByApi",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.companiesListInSelectField,
      utilityFunction: (data: any) => {
        return companyUtilityFunctionFromContactPage(data);
      },
      defaultValue: "",
    },
    placeholder: "Search",
  },
  {
    key: "policyCompanyPriority",
    name: "policyCompanyPriority",
    label: "Company priority",
    type: "select",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("PRIORITY", "DESC"),
      isSmartSearch: true,
      defaultValue: "",
    },
    placeholder: "Search",
  },
  {
    key: "policyType",
    name: "policyType",
    label: "Policy type",
    type: "select",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("POLICY_TYPE"),
      isSmartSearch: true,
    },
    placeholder: "Enter policy type ",
  },
  {
    key: "iirmPolicyType",
    name: "iirmPolicyType",
    label: "IIRM Policy type",
    type: "select",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("IIRM_POLICY_TYPE"),
      isSmartSearch: true,
    },
    placeholder: "Enter policy type ",
    componentProps: {
      disabled: isConfigFromDashboard,
    },
  },
  {
    key: "industry",
    name: "industry",
    label: "Company industry",
    type: "select",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("INDUSTRY_SEGMENT"),
      isSmartSearch: true,
    },
    placeholder: "Search",
  },
  {
    key: "renewalPeriod",
    name: "renewalPeriod",
    label: "Renewal period",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
      placeholder: "Select period",
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("POLICY_RENEWAL_PERIOD"),
      isSmartSearch: true,
    },
    placeholder: "Search",
  },
  {
    key: "policyExpiryFromDate",
    name: "policyExpiryFromDate",
    label: "Policy expiry (From date)",
    type: "date",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
      placeholder: "Select from date",
    },
  },
  {
    key: "policyExpiryToDate",
    name: "policyExpiryToDate",
    label: "Policy expiry (To date)",
    type: "date",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
      placeholder: "Select to date",
    },
  },
  {
    key: "businessMonth",
    name: "businessMonth",
    label: "Business month",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
    },
    placeholder: "Select month",
    apiDependencies: {
      utilityFunction: getAllMonths,
    },
  },
  {
    key: "isgManager",
    name: "isgManager",
    type: "treeSelect",
    label: "ISG manager",
    gridColumn: 5.8,
    apiDependencies: hierarchyField.apiDependencies,
    componentProps: {
      ...hierarchyField.componentProps,
      controlledSearchInput: false,
    },
  },
];

// --- Mock default values ---
export const DefaultValues = {
  industry: "",
  policyType: "",
  fromDate: "",
  toDate: "",
  period: "",
  ownedBy: "",
};

// --- Mock table columns ---

export const columns: ColDef[] = [
  {
    headerName: "Company name",
    field: "companyName",
    headerTooltip: "Company name",
    cellClass: "clickable-cell",
    valueGetter: (params) => params.data.companyName ?? "--",
    tooltipValueGetter: (params) => params.data.companyName ?? "--",

    pinned: "left",
  },
  {
    headerName: "Policy type",
    field: "policyType",
    tooltipField: "policyType.lookUpValue",
    cellClass: "clickable-cell",
    headerTooltip: "Policy type",
    valueGetter: (params) => params.data.policyType.lookUpValue ?? "--",
    tooltipValueGetter: (params) => params.data.policyType.lookUpValue ?? "--",
    pinned: "left",
  },
  {
    headerName: "Policy number",
    field: "insurerPolicyNumber",
    cellClass: "clickable-cell",
    headerTooltip: "Policy number",
    valueGetter: (params) =>
      params.data.insurerPolicyNumber !== null
        ? params.data.insurerPolicyNumber
        : "--",
    tooltipValueGetter: (params) =>
      params.data.insurerPolicyNumber !== null
        ? params.data.insurerPolicyNumber
        : "--",
    hide: false,
    pinned: "left",
  },
  {
    headerName: "Priority",
    field: "priority",
    headerTooltip: "Priority.lookUpValue",
    cellRenderer: "ChipRenderer",
    cellRendererParams: {
      styleMap: priorityStyleMap,
      variant: "normal",
    },
    valueGetter: (params) => params.data.priority?.lookUpValue ?? "--",
    tooltipValueGetter: (params) => params.data.priority?.lookUpValue ?? "--",
  },
  {
    headerName: "IIRM Policy type",
    field: "iirmPolicyType",
    tooltipField: "iirmPolicyType.lookUpValue",
    headerTooltip: "IIRM Policy type",
    valueGetter: (params) => params.data.iirmPolicyType.lookUpValue ?? "--",
    tooltipValueGetter: (params) => params.data.iirmPolicyType.lookUpValue ?? "--",
    // Resolved via a two-hop batched lookup outside the main policy query
    // (policyTypeLid -> PolicyTypeSegregation -> LookUp) — no direct DB
    // column/relation path to sort by without restructuring that query.
    disableSort: true,
  },
  {
    headerName: "Industry segment",
    field: "industry",
    headerTooltip: "Industry segment",
    valueGetter: (params) => params.data.industry?.lookUpValue ?? "--",
    tooltipValueGetter: (params) => params.data.industry?.lookUpValue ?? "--",
    hide: false,
  },
  {
    headerName: "Premium",
    field: "premium",
    headerTooltip: "Premium",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatNumberShort(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Insurer",
    field: "insurer",
    headerTooltip: "Insurer",
    valueGetter: (params) => params.data.insurerName ?? "--",
    tooltipValueGetter: (params) => params.data.insurerName ?? "--",
  },
  {
    headerName: "Policy from",
    field: "policyFrom",
    headerTooltip: "Policy From",
    valueGetter: (params) => formatDate(params.data.policyFrom) ?? "--",
    tooltipValueGetter: (params) => formatDate(params.data.policyFrom) ?? "--",
  },
  {
    headerName: "Business month",
    field: "businessMonth",
    headerTooltip: "Business Month",
    valueGetter: (params) => params.data.businessMonth ?? "--",
    tooltipValueGetter: (params) => params.data.businessMonth ?? "--",
  },
  {
    headerName: "Date of business",
    field: "dateOfBusiness",
    headerTooltip: "Date of Business",
    valueGetter: (params) => formatDate(params.data.dateOfBusiness) ?? "--",
    tooltipValueGetter: (params) => formatDate(params.data.dateOfBusiness) ?? "--",
  },
  {
    headerName: "Policy to",
    field: "policyTo",
    headerTooltip: "Policy To",
    valueGetter: (params) => formatDate(params.data.policyTo) ?? "--",
    tooltipValueGetter: (params) => formatDate(params.data.policyTo) ?? "--",
  },
  {
    headerName: "Policy status",
    field: "policyStatus",
    headerTooltip: "Policy status",
    valueGetter: (params) => params.data.policyStatus?.lookUpValue ?? "--",
    tooltipValueGetter: (params) =>
      params.data.policyStatus?.lookUpValue ?? "--",
  },
  {
    headerName: "Opportunity ID",
    field: "opportunityId",
    headerTooltip: "Opportunity ID",
    cellClass: "clickable-cell",
    valueGetter: (params) => params.data.opportunityId ?? "--",
    tooltipValueGetter: (params) =>
      params.data.opportunityId ?? "--",
  },
  {
    headerName: "Policy ID",
    field: "policyId",
    headerTooltip: "Policy ID",
    cellClass: "clickable-cell",
    valueGetter: (params) => params.data.policyId ?? "--",
    tooltipValueGetter: (params) =>
      params.data.policyId ?? "--",
  },
  {
    headerName: "Sum insured",
    field: "sumInsured",
    headerTooltip: "Sum Insured",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatNumberShort(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: true,
  },
  {
    headerName: "BD owner",
    field: "bdOwner",
    headerTooltip: "BD owner",
    valueGetter: (params) => params.data.BDowner ?? "--",
    tooltipValueGetter: (params) => params.data.BDowner ?? "--",
    hide: true,
  },
  {
    headerName: "Company account manager",
    field: "accountManager",
    headerTooltip: "Account Manager",
    valueGetter: (params) => params.data.accountManager ?? "--",
    tooltipValueGetter: (params) => params.data.accountManager ?? "--",
    hide: true,
  },
  {
    headerName: "Configuration status",
    field: "policyStep",
    disableSort: true,
    headerTooltip: "Configuration status",
    valueGetter: (params) =>
      params.data.configurationStatus?.lookUpValue ?? "--",
    tooltipValueGetter: (params) =>
      params.data.configurationStatus?.lookUpValue ?? "--",
    hide: true,
  },
  {
    headerName: "Currency",
    field: "currency",
    headerTooltip: "Currency",
    valueGetter: (params) => params.data.currency.name ?? "--",
    tooltipValueGetter: (params) => params.data.currency.name ?? "--",
    hide: true,
  },

  // {
  //   headerName: "Enrollment status",
  //   field: "enrollmentStatus",
  //   headerTooltip: "Enrollment Status",
  //   valueGetter: (params) => params.data.enrollmentStatus.lookUpValue ?? "--",
  //   tooltipValueGetter: (params) =>
  //     params.data.enrollmentStatus.lookUpValue ?? "--",
  // },
  // {
  //   headerName: "Brokerage",
  //   field: "brokerageAmount",
  //   headerTooltip: "Brokerage",
  //   valueFormatter: ({ value }) =>
  //     value !== null && value !== undefined
  //       ? formatCurrencyByLocalization(value)
  //       : "--",
  //   cellClass: "right-aligned-cell",
  //   headerClass: "right-aligned-header",
  // },
  {
    headerName: "Action",
    field: "action",
    disableSort: true,
    headerTooltip: "Action",
    cellRenderer: "ActionButton",
    width: 250,
    tooltipValueGetter: () => null,
  },
  {
    headerName: "Contacts",
    field: "contacts",
    headerTooltip: "Contacts",
    cellClass: "clickable-cell",
    valueGetter: (params) =>
      params.data?.contacts?.length > 0
        ? params.data.contacts[0]?.displayname +
        (params.data.contacts.length > 1
          ? ` +${params.data.contacts.length - 1}`
          : "")
        : "--",
    tooltipValueGetter: (params) =>
      params.data?.contacts?.length > 0
        ? params.data.contacts[0]?.displayname +
        (params.data.contacts.length > 1
          ? ` +${params.data.contacts.length - 1}`
          : "")
        : "--",
    hide: true,
  },
];

export const POLICY_COLUMN_EXPORT_KEY_ALIASES: Record<string, string> = {
  insurer: "insurerName",
  bdOwner: "BDowner",
  policyStep: "configurationStatus",
};

//Ignore the Action column in export file
export const POLICY_COLUMN_EXPORT_EXCLUDED_FIELDS = new Set<string>(["action"]);

// --- Mock table data (20 objects) ---
export const rowData = [
  {
    policy_id: 45,
    company_name: "Test Created Comapny",
    policy_type: "GPA",
    policy_number: "1232123",
    policy_status: "LIVE",
    policy_step: 7,
    created_at: "2025-06-17T10:59:36.453Z",
    updated_at: "2025-06-17T11:28:28.395Z",
  },
  {
    policy_id: 44,
    company_name: "hcl",
    policy_type: "GMC",
    policy_number: "h89890j",
    policy_status: "WIP",
    policy_step: 6,
    created_at: "2025-06-16T14:20:18.320Z",
    updated_at: "2025-06-17T09:54:08.045Z",
  },
  {
    policy_id: 43,
    company_name: "Info Tech",
    policy_type: "GPA",
    policy_number: "6606",
    policy_status: "WIP",
    policy_step: 1,
    created_at: "2025-06-16T11:16:13.146Z",
    updated_at: "2025-06-16T11:16:13.146Z",
  },
  {
    policy_id: 42,
    company_name: "tesr",
    policy_type: "GMC",
    policy_number: "123213",
    policy_status: "WIP",
    policy_step: 2,
    created_at: "2025-06-16T11:07:30.875Z",
    updated_at: "2025-06-16T11:09:48.343Z",
  },
  {
    policy_id: 41,
    company_name: "Alpha Corp",
    policy_type: "GMC",
    policy_number: "A12345",
    policy_status: "LIVE",
    policy_step: 5,
    created_at: "2025-06-15T10:00:00.000Z",
    updated_at: "2025-06-15T12:00:00.000Z",
  },
  {
    policy_id: 40,
    company_name: "Beta Ltd",
    policy_type: "GPA",
    policy_number: "B54321",
    policy_status: "WIP",
    policy_step: 3,
    created_at: "2025-06-14T09:30:00.000Z",
    updated_at: "2025-06-14T10:00:00.000Z",
  },
  {
    policy_id: 39,
    company_name: "Gamma Inc",
    policy_type: "GMC",
    policy_number: "G98765",
    policy_status: "LIVE",
    policy_step: 4,
    created_at: "2025-06-13T08:20:00.000Z",
    updated_at: "2025-06-13T09:00:00.000Z",
  },
  {
    policy_id: 38,
    company_name: "Delta Solutions",
    policy_type: "GPA",
    policy_number: "D11223",
    policy_status: "WIP",
    policy_step: 2,
    created_at: "2025-06-12T07:10:00.000Z",
    updated_at: "2025-06-12T08:00:00.000Z",
  },
  {
    policy_id: 37,
    company_name: "Epsilon LLC",
    policy_type: "GMC",
    policy_number: "E44556",
    policy_status: "LIVE",
    policy_step: 6,
    created_at: "2025-06-11T06:00:00.000Z",
    updated_at: "2025-06-11T07:00:00.000Z",
  },
  {
    policy_id: 36,
    company_name: "Zeta Group",
    policy_type: "GPA",
    policy_number: "Z77889",
    policy_status: "WIP",
    policy_step: 1,
    created_at: "2025-06-10T05:50:00.000Z",
    updated_at: "2025-06-10T06:30:00.000Z",
  },
  {
    policy_id: 35,
    company_name: "Eta Enterprises",
    policy_type: "GMC",
    policy_number: "E99001",
    policy_status: "LIVE",
    policy_step: 7,
    created_at: "2025-06-09T04:40:00.000Z",
    updated_at: "2025-06-09T05:20:00.000Z",
  },
  {
    policy_id: 34,
    company_name: "Theta Tech",
    policy_type: "GPA",
    policy_number: "T22334",
    policy_status: "WIP",
    policy_step: 2,
    created_at: "2025-06-08T03:30:00.000Z",
    updated_at: "2025-06-08T04:10:00.000Z",
  },
  {
    policy_id: 33,
    company_name: "Iota Systems",
    policy_type: "GMC",
    policy_number: "I55667",
    policy_status: "LIVE",
    policy_step: 5,
    created_at: "2025-06-07T02:20:00.000Z",
    updated_at: "2025-06-07T03:00:00.000Z",
  },
  {
    policy_id: 32,
    company_name: "Kappa Dynamics",
    policy_type: "GPA",
    policy_number: "K88990",
    policy_status: "WIP",
    policy_step: 3,
    created_at: "2025-06-06T01:10:00.000Z",
    updated_at: "2025-06-06T02:00:00.000Z",
  },
  {
    policy_id: 31,
    company_name: "Lambda Holdings",
    policy_type: "GMC",
    policy_number: "L11223",
    policy_status: "LIVE",
    policy_step: 4,
    created_at: "2025-06-05T00:00:00.000Z",
    updated_at: "2025-06-05T01:00:00.000Z",
  },
  {
    policy_id: 30,
    company_name: "Mu Ventures",
    policy_type: "GPA",
    policy_number: "M33445",
    policy_status: "WIP",
    policy_step: 2,
    created_at: "2025-06-04T23:50:00.000Z",
    updated_at: "2025-06-05T00:30:00.000Z",
  },
  {
    policy_id: 29,
    company_name: "Nu Innovations",
    policy_type: "GMC",
    policy_number: "N55667",
    policy_status: "LIVE",
    policy_step: 6,
    created_at: "2025-06-03T22:40:00.000Z",
    updated_at: "2025-06-03T23:20:00.000Z",
  },
  {
    policy_id: 28,
    company_name: "Xi Technologies",
    policy_type: "GPA",
    policy_number: "X77889",
    policy_status: "WIP",
    policy_step: 1,
    created_at: "2025-06-02T21:30:00.000Z",
    updated_at: "2025-06-02T22:10:00.000Z",
  },
  {
    policy_id: 27,
    company_name: "Omicron Labs",
    policy_type: "GMC",
    policy_number: "O99001",
    policy_status: "LIVE",
    policy_step: 7,
    created_at: "2025-06-01T20:20:00.000Z",
    updated_at: "2025-06-01T21:00:00.000Z",
  },
  {
    policy_id: 26,
    company_name: "Pi Solutions",
    policy_type: "GPA",
    policy_number: "P22334",
    policy_status: "WIP",
    policy_step: 2,
    created_at: "2025-05-31T19:10:00.000Z",
    updated_at: "2025-05-31T20:00:00.000Z",
  },
];

export const PAGE_SIZE_OPTIONS = [5, 10, 20];

export const getInitialPolicyConfiguration = (): PolicyConfiguration => {
  const baseMaster = PolicyComponentTypeMaster.find(
    (m: { type: string }) => m.type === "base"
  );
  if (!baseMaster) {
    throw new Error("Base master configuration not found.");
  }
  const state = { policyStatus: POLICY_CONFIGURATOR_STATUS.DRAFT };
  return {
    id: 0,
    status: state.policyStatus as policy_status,
    step: 1,
    configuration: {
      components: [
        {
          id: "base",
          label: baseMaster.label,
          type: "base",
          sumInsuredModel: SumInsuredModel.FLAT,
          siMultipleLabel: "CTC",
          sumInsuredOptions: [createNewSumInsuredOption(1)],
          nextSumInsuredId: 2,
          showCompanyContribution: false,
          premiumPerLife: false,
        },
      ],
      relationships: {
        enabledPolicyRelations: [],
        familyMaxPolicyLevel: "",
      },
      parameters: [],
      policyTemplate: {
        basePolicy: {
          mainPolicyId: "base",
          provisionPolicyNumber: "",
          insurerPolicyNumber: "",
          iirmPolicyNumber: "",
          addonIds: [],
        },
        parentalPolicy: undefined,
      },
      policyOptions: [] as ConfiguredPolicyOption[],
      constraints: {},
      selectedLocationIds: [],
      enablePolicyLocations: false,
      userDetailsSection: { displayName: "User Details", items: [{ id: "ud-1", label: "", value: "" }] },
    },
  };
};

export const getSteps = (enablePolicyLocations: boolean): ConfigStep[] => {
  const base: ConfigStep[] = [
    "policyComponents",
    "policyRelationships",
    "policyChoiceTemplate",
    "policyParameters",
    "policyChoices",
    "policyConstraints",
  ];
  if (enablePolicyLocations) {
    base.push("policyLocations");
  }
  return base;
};

export const stepLabels: Record<ConfigStep, string> = {
  policyComponents: POLICY_COMPONENTS_LABEL,
  policyChoiceTemplate: POLICY_TEMPLATE_LABEL,
  policyRelationships: POLICY_RELATIONSHIPS_LABEL,
  policyParameters: POLICY_PARAMETERS_LABEL,
  policyChoices: POLICY_CHOICES_LABEL,
  policyConstraints: POLICY_CONSTRAINTS_LABEL,
  policyLocations: POLICY_LOCATIONS_STEP_LABEL,
};
