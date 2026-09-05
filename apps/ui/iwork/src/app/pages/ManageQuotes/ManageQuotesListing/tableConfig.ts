import {
  endPoints,
  formatCurrencyByLocalization,
  LocalizationConfig,
  theme,
  formatDate,
  DATE_FORMATS,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";
import {
  hierarchyField,
  priorityStyleMap,
} from "../../CompanyPage/CompanyListing/tableConfig";
import {
  contactListUtilityFunction,
} from "../../OpportunitiesPage/OpportunitiesListing/tableConfig";
import { companyUtilityFunctionFromContactPage } from "../../ContactPage/ContactListing/tableConfig";
import {
  getRenewalAwareActivityLabel,
  MANAGE_QUOTES,
  BD_PLANNING,
  ISG_PLANNING,
  RENEWAL_PLANNING,
  WON,
  LOST,
  ACTIVE,
  OPPORTUNITY_TYPE_SO,
  OPPORTUNITY_TYPE_RO,
  DATA_VALIDATION_ACTIVITY,
  RSR_CREATION_ACTIVITY,
} from "../../../constants";

type FilterOption = { value: string; label: string };

// Opty. Status LOV is limited to Active / Won / Lost (spec §6.3). The two planning
// options exposed by the SO/RO lists are dropped; "Active" is broadened at send
// time (see expandManageQuotesFilters) instead of via the shared backend mapper.
export const MANAGE_QUOTES_STATUS_OPTIONS: FilterOption[] = [
  { value: ACTIVE, label: ACTIVE },
  { value: WON, label: WON },
  { value: LOST, label: LOST },
];

// Opty. Type toggle is built but hidden (spec §6.3). Flip to true to reveal it;
// while hidden it is not rendered and no optyType filter is sent (list stays
// combined). Revealing it also requires sending optyType as a query param.
export const SHOW_OPTY_TYPE_TOGGLE = true;

export const MANAGE_QUOTES_OPTY_TYPE_OPTIONS: FilterOption[] = [
  { value: "", label: "All" },
  { value: OPPORTUNITY_TYPE_SO, label: OPPORTUNITY_TYPE_SO },
  { value: OPPORTUNITY_TYPE_RO, label: OPPORTUNITY_TYPE_RO },
];

// Backend mapOpportunityState understands these planning tokens individually; we
// add them to "Active" so planning-state opportunities are included.
const ACTIVE_STATE_EXPANSION = [BD_PLANNING, ISG_PLANNING];

const RENEWAL_PREFIX = "Renewal ";
const DATA_VALIDATION_COMBINED_LABEL = `${RSR_CREATION_ACTIVITY}/${DATA_VALIDATION_ACTIVITY}`;
// Planning stages: SO surfaces "BD Planning", RO surfaces "Renewal Planning";
// both share the same underlying BD-planning status, so they collapse to one LOV
// entry. (ISG Planning is shared verbatim across SO and RO.)
const PLANNING_COMBINED_LABEL = `${BD_PLANNING}/${RENEWAL_PLANNING}`;

// Generic (SO-style) label for an activity name. The "Renewal " prefix is
// stripped from RO names; SO "Data Validation" and RO "RSR Creation" collapse to
// the combined "RSR Creation/Data Validation" entry, and SO "BD Planning" / RO
// "Renewal Planning" collapse to one planning entry (spec §5.4).
const toGenericActivityLabel = (name: string): string => {
  if (name === DATA_VALIDATION_ACTIVITY || name === RSR_CREATION_ACTIVITY) {
    return DATA_VALIDATION_COMBINED_LABEL;
  }
  if (name === BD_PLANNING || name === RENEWAL_PLANNING) {
    return PLANNING_COMBINED_LABEL;
  }
  return name.startsWith(RENEWAL_PREFIX)
    ? name.slice(RENEWAL_PREFIX.length)
    : name;
};

// Assemble the unique SO + RO activity LOV on the frontend (spec §5.4, no new
// backend endpoint). Returns the display options plus a map from each generic
// option value to the underlying activity name(s) the backend should match.
export const buildManageQuotesActivityOptions = (
  soOptions: FilterOption[] = [],
  roOptions: FilterOption[] = []
): {
  options: FilterOption[];
  valueToActivityNames: Record<string, string[]>;
} => {
  const buckets = new Map<string, Set<string>>();
  [...soOptions, ...roOptions].forEach(({ value }) => {
    if (!value) return;
    const generic = toGenericActivityLabel(value);
    const names = buckets.get(generic) ?? new Set<string>();
    names.add(value);
    buckets.set(generic, names);
  });

  const options: FilterOption[] = [];
  const valueToActivityNames: Record<string, string[]> = {};
  buckets.forEach((names, generic) => {
    options.push({ value: generic, label: generic });
    valueToActivityNames[generic] = Array.from(names);
  });
  return { options, valueToActivityNames };
};

// Expand the combined-screen filter values just before they are sent: broaden
// "Active" (§5.5) and map each generic activity option back to the underlying
// SO/RO activity name(s) (§5.4). Display/form values are left untouched.
export const expandManageQuotesFilters = (
  values: Record<string, any>,
  valueToActivityNames: Record<string, string[]>
): Record<string, any> => {
  if (!values) return values;
  const next = { ...values };

  if (Array.isArray(next.state) && next.state.includes(ACTIVE)) {
    next.state = Array.from(
      new Set([...next.state, ...ACTIVE_STATE_EXPANSION])
    );
  }

  if (Array.isArray(next.activityName) && next.activityName.length > 0) {
    next.activityName = Array.from(
      new Set(
        next.activityName.flatMap(
          (value: string) => valueToActivityNames[value] ?? [value]
        )
      )
    );
  }

  return next;
};

// Resolve the Opty. Type filter selection to the backend optyType query param.
// The toggle is a multiselect; a single SO/RO selection narrows the combined
// list, while none or both selected leaves it combined (undefined => no param).
export const resolveOptyTypeParam = (
  value: unknown
): typeof OPPORTUNITY_TYPE_SO | typeof OPPORTUNITY_TYPE_RO | undefined => {
  const values = Array.isArray(value)
    ? value
    : value === undefined || value === null || value === ""
      ? []
      : [typeof value === "object" ? (value as any).value : value];
  const normalized = values
    .map((v) => (typeof v === "object" && v ? (v as any).value : v))
    .filter((v): v is string => typeof v === "string");
  if (normalized.length !== 1) {
    return undefined;
  }
  return normalized[0] === OPPORTUNITY_TYPE_RO
    ? OPPORTUNITY_TYPE_RO
    : normalized[0] === OPPORTUNITY_TYPE_SO
      ? OPPORTUNITY_TYPE_SO
      : undefined;
};

// Manage Quotes columns (spec §6.4). Default sequence with the first three
// pinned left (frozen): Opty. ID, Activity name, Opty. Expiry. Remaining columns
// follow the RO set. SO rows render Policy Number as "--". A hidden Opty. Type
// column ("SO"/"RO") is available via the column chooser.
export const getColumns = (localization?: LocalizationConfig): ColDef[] => [
  {
    headerName: "Opty. ID",
    field: "opportunityId",
    headerTooltip: "Opty. ID",
    cellClass: "clickable-cell",
    valueGetter: (params) => params.data?.opportunityId ?? "--",
    tooltipValueGetter: (params) => params.data?.opportunityId ?? "--",
    hide: false,
    pinned: "left",
  },
  {
    headerName: "Activity name",
    field: "activityName",
    disableSort: true,
    tooltipField: "activityName",
    headerTooltip: "Activity name",
    valueFormatter: (params) =>
      params.value !== null && params.value !== undefined
        ? (getRenewalAwareActivityLabel(
            params.value,
            params.data?.opportunityType === OPPORTUNITY_TYPE_RO
          ) as string)
        : "--",
    cellClass: "clickable-cell",
    pinned: "left",
  },
  {
    headerName: "Opty. Expiry",
    field: "expectedCloseDate",
    headerTooltip: "Opty. Expiry",
    cellRenderer: "DateStatusDotRenderer",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatDate(value, DATE_FORMATS.DATE_MONTH_YEAR)
        : "--",
    hide: false,
    pinned: "left",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
  },
  {
    headerName: "Company name",
    field: "companyName",
    tooltipField: "companyName",
    headerTooltip: "Company name",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "clickable-cell",
    hide: false,
  },
  {
    headerName: "Priority",
    field: "priority",
    tooltipField: "priority",
    headerTooltip: "Priority level",
    cellRenderer: "ChipRenderer",
    width: 120,
    cellRendererParams: {
      styleMap: priorityStyleMap,
      variant: "normal",
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Policy type",
    field: "policyType",
    tooltipField: "policyType",
    headerTooltip: "Policy type",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "clickable-cell",
  },
  {
    headerName: "Premium",
    field: "premium",
    headerTooltip: "Premium",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Assigned to",
    field: "assignedTo",
    tooltipField: "assignedTo",
    headerTooltip: "Assigned to",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Branch",
    field: "branch",
    tooltipField: "branch",
    headerTooltip: "Branch",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    // SO has no policy number — render "--" regardless of any stray value.
    headerName: "Policy Number",
    field: "policyId",
    tooltipField: "policyId",
    headerTooltip: "Policy Number",
    valueGetter: (params) =>
      params.data?.opportunityType === OPPORTUNITY_TYPE_SO
        ? "--"
        : (params.data?.policyId ?? "--"),
    tooltipValueGetter: (params) =>
      params.data?.opportunityType === OPPORTUNITY_TYPE_SO
        ? "--"
        : (params.data?.policyId ?? "--"),
    hide: false,
  },
  {
    headerName: "Estimated brokerage",
    field: "estimatedBrokerage",
    headerTooltip: "Estimated brokerage",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: true,
  },
  {
    headerName: "Stage name",
    field: "stageName",
    disableSort: true,
    tooltipField: "stageName",
    headerTooltip: "Stage name",
    valueFormatter: (params) =>
      params.value !== null && params.value !== undefined
        ? (getRenewalAwareActivityLabel(
            params.value,
            params.data?.opportunityType === OPPORTUNITY_TYPE_RO
          ) as string)
        : "--",
    hide: true,
  },
  {
    headerName: "Opty. creation date",
    field: "opportunityCreationDate",
    headerTooltip: "Opty. creation date",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatDate(value, DATE_FORMATS.DATE_MONTH_YEAR)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatDate(value, DATE_FORMATS.DATE_MONTH_YEAR)
        : "--",
    hide: true,
  },
  {
    headerName: "Opty. Status",
    field: "state",
    tooltipField: "state",
    headerTooltip: "Opty. Status",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Industry segment",
    field: "industrySegment",
    tooltipField: "industry",
    headerTooltip: "Industry segment",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Sum insured",
    field: "sumInsured",
    headerTooltip: "Sum insured",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: true,
  },
  {
    headerName: "Opty. Type",
    field: "opportunityType",
    tooltipField: "opportunityType",
    headerTooltip: "Opportunity type",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
];

// Filter sections follow RO with three Manage Quotes changes (spec §6.3):
// the Opty. Status LOV is trimmed to Active/Won/Lost, the Opty. Activity LOV is
// the unique SO+RO union (passed in via activityOptions), and a hidden Opty. Type
// toggle is appended behind SHOW_OPTY_TYPE_TOGGLE.
export const tableSearchConfig = (
  companyContactId?: number,
  organisationId?: number,
  isConfigFromFunnel = false,
  activityOptions: FilterOption[] = []
) => [
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
    componentProps: {
      disabled: isConfigFromFunnel,
    },
    placeholder: "Search",
  },
  {
    key: "opportunityPriority",
    name: "opportunityPriority",
    label: "Company priority",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      disabled: isConfigFromFunnel,
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("PRIORITY", "DESC"),
      isSmartSearch: true,
    },
    placeholder: "Search",
  },
  {
    key: "opportunityContact",
    name: "opportunityContact",
    label: "Company contact",
    type: "selectFieldByApi",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.contactList(companyContactId),
      utilityFunction: contactListUtilityFunction,
      isSmartSearch: true,
    },
    componentProps: {
      fullWidth: true,
      placeholder: "Select contact",
      disabled: isConfigFromFunnel,
    },
    placeholder: "Search",
  },
  {
    key: "opportunityPolicyType",
    name: "opportunityPolicyType",
    label: "Policy type",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
      placeholder: "Select policy type",
      disabled: isConfigFromFunnel,
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("POLICY_TYPE"),
      isSmartSearch: true,
    },
    placeholder: "Search",
  },
  {
    key: "opportunityIndustrySegment",
    name: "opportunityIndustrySegment",
    label: "Company industry",
    type: "select",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("INDUSTRY_SEGMENT"),
      isSmartSearch: true,
      disabled: isConfigFromFunnel,
    },
    placeholder: "Search",
  },
  {
    key: "activityName",
    name: "activityName",
    label: "Opty. activity",
    type: "multiselect",
    gridColumn: 2.9,
    options: activityOptions,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter activity",
      disabled: isConfigFromFunnel,
    },
  },
  {
    key: "state",
    name: "state",
    label: "Opty. status",
    type: "multiselect",
    gridColumn: 2.9,
    options: MANAGE_QUOTES_STATUS_OPTIONS,
    componentProps: {
      fullWidth: true,
      placeholder: "Select stage",
      disabled: isConfigFromFunnel,
    },
    placeholder: "Search",
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
  // Opty. Type toggle — built but hidden (spec §6.3). Rendered only when the flag
  // is enabled; while hidden no optyType filter is sent and the list stays combined.
  ...(SHOW_OPTY_TYPE_TOGGLE
    ? [
        {
          key: "optyType",
          name: "optyType",
          label: "Opty. Type",
          type: "segmentedcontrol",
          gridColumn: 2.9,
          options: MANAGE_QUOTES_OPTY_TYPE_OPTIONS,
          componentProps: {
            fullWidth: true,
            variantType: "primary",
            shouldClearValue: true,
            disabled: isConfigFromFunnel,
          },
        },
      ]
    : []),
];

export const searchDefaultValues = {
  companyName: "",
  opportunityPriority: "",
  fromDate: "",
  toDate: "",
  period: { value: "3 Months", label: "3 Months" },
  opportunityBranch: "",
  opportunityIndustrySegment: "",
  assignedTo: "",
  activity: "",
  opportunityStage: "",
  state: { value: ACTIVE, label: ACTIVE },
  opportunityContact: "",
};

interface OverallData {
  opportunityLeads?: number;
  opportunityProspects?: number;
  opportunityQcr?: number;
  opportunityClients?: number;
}

// KPI cards: Total Companies, Total Opportunities, and — added 2026-07-30 — the
// premium and brokerage totals, same four as the SO/RO listings (spec §6.5).
export const opportunityData = (
  overallData: OverallData,
  totalRows: number
) => [
  {
    title: "Total Companies",
    count: overallData?.opportunityLeads || 0,
    percentage: ((overallData?.opportunityLeads ?? 0) / totalRows) * 100,
    backgroundColor: theme.palette.kpiColors.purple,
    textColor: theme.palette.text.purple,
  },
  {
    title: "Total Opportunities",
    count: overallData?.opportunityProspects || 0,
    percentage: ((overallData?.opportunityProspects ?? 0) / totalRows) * 100,
    backgroundColor: theme.palette.kpiColors.yellow,
    textColor: theme.palette.text.yellow,
  },
  // Premium / brokerage come from the same listing response the counts do
  // (opportunityQcr / opportunityClients), summed over the SO+RO result set —
  // no extra call. Titles, colours and isFloatable match the SO/RO listings.
  {
    title: "Total Expected Premium Amount",
    count: overallData?.opportunityQcr || 0,
    percentage: ((overallData?.opportunityQcr ?? 0) / totalRows) * 100,
    backgroundColor: theme.palette.kpiColors.teal,
    textColor: theme.palette.text.teal,
    isFloatable: true,
  },
  {
    title: "Total Expected Brokerage Amount",
    count: overallData?.opportunityClients || 0,
    percentage: ((overallData?.opportunityClients ?? 0) / totalRows) * 100,
    backgroundColor: theme.palette.kpiColors.orange,
    textColor: theme.palette.text.orange,
    isFloatable: true,
  },
];

export const breadCrumbs = (dashboardFilters: any) => [
  {
    label: "Dashboard",
    path: "/dashboard",
    state: { filters: dashboardFilters, fromROOpportunities: true },
  },
  { label: MANAGE_QUOTES },
];
