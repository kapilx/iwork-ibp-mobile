import {
  hierarchyField,
} from "../../CompanyPage/CompanyListing/tableConfig";
import {
  endPoints,
  activityDataUtilityFunction,
  formatLargeCurrency,
  formatNumberByLocalization,
} from "@ui/ui-lib";
import {
  contactListUtilityFunction,
} from "../../OpportunitiesPage/OpportunitiesListing/tableConfig";
import { companyUtilityFunctionFromContactPage } from "../../ContactPage/ContactListing/tableConfig";
import {
  opportunityStatusOptions,
  filterStatusOptionsByRole,
} from "../../../constants";

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
  // Owner field removed: on the Enhanced page the org-scope widget's Owner
  // accordion is the single owner channel (card click → ownerId/viewBy listing
  // params) — a second owner select here would fight it.
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
    gridColumn: 2.9,
    apiDependencies: hierarchyField.apiDependencies,
    componentProps: {
      ...hierarchyField.componentProps,
      controlledSearchInput: false,
    },
  },
];

// Companies table (portfolio-style flow): one row per company with the SO
// aggregate from /opportunity/company-summary; View details reveals that
// company's opportunity records below. Count/currency formatting mirrors the
// org-scope accordion's metric formatting.
export const getCompanyColumns = (localization: any) => [
  {
    headerName: "Company Name",
    field: "companyName",
    tooltipField: "companyName",
    headerTooltip: "Company Name",
    minWidth: 240,
    flex: 1,
    valueFormatter: ({ value }: any) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "clickable-cell",
  },
  {
    headerName: "Total SOs",
    field: "totalRos",
    headerTooltip: "Total SOs",
    width: 140,
    valueFormatter: ({ value }: any) =>
      formatNumberByLocalization(value ?? 0, localization),
  },
  {
    headerName: "Premium",
    field: "premium",
    headerTooltip: "Premium",
    width: 160,
    valueFormatter: ({ value }: any) =>
      value !== null && value !== undefined
        ? formatLargeCurrency(Number(value), localization).trim()
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Brokerage",
    field: "brokerage",
    headerTooltip: "Brokerage",
    width: 160,
    valueFormatter: ({ value }: any) =>
      value !== null && value !== undefined
        ? formatLargeCurrency(Number(value), localization).trim()
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Actions",
    field: "actions",
    headerTooltip: "Actions",
    // Actions holds no row value, so ServerSideGrid's global
    // defaultColDef.tooltipValueGetter falls through to its no-data branch and
    // renders "[object Object]". Return "" to suppress the cell tooltip.
    tooltipValueGetter: () => "",
    cellRenderer: "ActionButton",
    minWidth: 160,
    disableSort: true,
  },
];
