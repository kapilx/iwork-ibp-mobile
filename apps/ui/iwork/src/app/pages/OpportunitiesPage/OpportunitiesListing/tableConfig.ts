import { ColDef } from "ag-grid-community";
import {
  hierarchyField,
  priorityStyleMap,
} from "../../CompanyPage/CompanyListing/tableConfig";
import { masterUtility } from "../../../components/BusinessPerformance/businessPerformanceConfig";
import { Contact } from "../OpportunitiesForm/formConfig";
import {
  endPoints,
  activityDataUtilityFunction,
  convertToTreeData,
  formatCurrencyByLocalization,
  LocalizationConfig,
  theme,
  formatDate,
  DynamicObject,
  DATE_FORMATS,
} from "@ui/ui-lib";
import { companyUtilityFunctionFromContactPage } from "../../ContactPage/ContactListing/tableConfig";
import {
  MANAGE_OPPORTUNITIES,
  opportunityStatusOptions,
  filterStatusOptionsByRole,
} from "../../../constants";
import { accountManagerUtilityFunction } from "@ui/ui-lib/utils/masterUserDataUtility";

export const contactListUtilityFunction = (data: DynamicObject) => {
  return data?.data?.data?.map((contact: Contact) => ({
    value: contact.id,
    label: contact.displayName,
  }));
};

export const organisationUtility = (data: any[]) => {
  return data?.data?.data?.map((item) => ({
    label: item.name,
    value: item.id,
  }));
};

export const getColumns = (localization?: LocalizationConfig): ColDef[] => [
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
    headerName: "SO expiry date",
    field: "expectedCloseDate",
    headerTooltip: "SO expiry date",
    cellRenderer: "DateStatusDotRenderer",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatDate(value, DATE_FORMATS.DATE_MONTH_YEAR)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatDate(value, DATE_FORMATS.DATE_MONTH_YEAR)
        : "--",
    hide: false,
  },
  {
    headerName: "Activity name",
    field: "activityName",
    disableSort: true,
    tooltipField: "activityName",
    headerTooltip: "Activity name",
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
    headerName: "Estimated brokerage",
    field: "estimatedBrokerage",
    tooltipField: "estimatedBrokerage",
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
  },
  {
    headerName: "Assigned to",
    field: "assignedTo",
    disableSort: true,
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
    headerName: "Stage name",
    field: "stageName",
    disableSort: true,
    tooltipField: "stageName",
    headerTooltip: "Stage name",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "SO creation date",
    field: "opportunityCreationDate",
    headerTooltip: "SO creation date",
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
  // {
  //   headerName: "Contact",
  //   field: "contacts",
  //   headerTooltip: "Contact",
  //   valueGetter: (params) => {
  //     const contacts = params.data?.contacts;
  //     return Array.isArray(contacts) && contacts[0]?.displayName
  //       ? contacts[0].displayName
  //       : "--";
  //   },
  //   tooltipValueGetter: (params) => {
  //     const contacts = params.data?.contacts;
  //     return Array.isArray(contacts) && contacts[0]?.displayName
  //       ? contacts[0].displayName
  //       : "--";
  //   },
  //   hide: true,
  //   cellClass: "clickable-cell",
  // },
  {
    headerName: " SO Status",
    field: "state",
    tooltipField: "state",
    headerTooltip: "SO Status",
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
    headerName: "Opportunity ID",
    field: "opportunityId",
    headerTooltip: "Opportunity ID",
    cellClass: "clickable-cell",
    valueGetter: (params) => params.data?.opportunityId ?? "--",
    tooltipValueGetter: (params) => params.data?.opportunityId ?? "--",
    hide: false,
  },
];

export const tableSearchConfig = (
  companyContactId?: number,
  organisationId?: number,
  isConfigFromFunnel: boolean = false,
  canViewBD: boolean = true,
  canViewISG: boolean = true
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
    apiDependencies: {
      endPoint: endPoints.lookUpByName("PRIORITY", "DESC"),
      isSmartSearch: true,
    },
    componentProps: {
      disabled: isConfigFromFunnel,
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
    },
    placeholder: "Search",
    componentProps: {
      disabled: isConfigFromFunnel,
    },
  },
  {
    key: "activityName",
    name: "activityName",
    label: isConfigFromFunnel ? "SO funnel filter" : "SO activity",
    type: "multiselect",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter activity",
      disabled: isConfigFromFunnel,
    },
    apiDependencies: {
      endPoint: endPoints.activityList,
      utilityFunction: activityDataUtilityFunction,
    },
  },
  {
    key: "state",
    name: "state",
    label: "SO status",
    type: "multiselect",
    gridColumn: 2.9,
    options: filterStatusOptionsByRole(
      opportunityStatusOptions,
      canViewBD,
      canViewISG
    ),
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
];

interface OverallData {
  opportunityLeads?: number;
  opportunityProspects?: number;
  opportunityQcr?: number;
  opportunityClients?: number;
}

export const opportunityData = (
  overallData: OverallData,
  totalRows: number
) => [
  {
    // Raw count, not pre-formatted: KPICards applies formatNumberByLocalization
    // itself using the localization it resolves (prop or its own hook).
    title: "Total Companies",
    count: overallData?.opportunityLeads ?? 0,
    percentage: ((overallData?.opportunityLeads ?? 0) / totalRows) * 100,
    backgroundColor: theme.palette.kpiColors.purple,
    textColor: theme.palette.text.purple,
  },
  {
    title: "Total SOs",
    count: overallData?.opportunityProspects ?? 0,
    percentage: ((overallData?.opportunityProspects ?? 0) / totalRows) * 100,
    backgroundColor: theme.palette.kpiColors.yellow,
    textColor: theme.palette.text.yellow,
  },
  {
    title: "Total Premium Amount",
    count: overallData?.opportunityQcr ?? 0,
    backgroundColor: theme.palette.kpiColors.teal,
    textColor: theme.palette.text.teal,
    isFloatable: true,
  },
  {
    title: "Total Brokerage Amount",
    count: overallData?.opportunityClients ?? 0,
    backgroundColor: theme.palette.kpiColors.orange,
    textColor: theme.palette.text.orange,
    isFloatable: true,
  },
];

export const breadCrumbs = (dashboardFilters: any) => [
  {
    label: "Dashboard",
    path: "/dashboard",
    state: { filters: dashboardFilters, fromOpportunities: true },
  },
  { label: MANAGE_OPPORTUNITIES },
];

export const normalizeOpportunityStateField = (values: any) => {
  const newValues = { ...values };
  const stateValue = newValues.state;

  if (stateValue === null) {
    newValues.state = []; // null → []
  } else if (Array.isArray(stateValue)) {
    newValues.state = stateValue; // array → keep as is
  } else if (typeof stateValue === "string") {
    newValues.state = [stateValue]; // string → ["string"]
  } else if (typeof stateValue === "object" && stateValue?.value) {
    newValues.state = [stateValue.value]; // object → use value
  } else {
    newValues.state = []; // fallback
  }

  return newValues;
};
