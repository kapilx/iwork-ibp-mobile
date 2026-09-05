import { ColDef } from "ag-grid-community";
import {
  endPoints,
  FormFieldConfig,
  LocalizationConfig,
  theme,
  colors,
  formatNumberByLocalization,
  formatCurrencyByLocalization,
} from "@ui/ui-lib";

interface OverallData {
  totalCompanyCount?: number;
  totalPolicyCount?: number;
  totalCompaniesPremium?: number;
  totalCompaniesBrokerage?: number;
}

export const PORTFOLIO_ACTIVE_ONLY_PARAM = "activeOnly=true";
export const PORTFOLIO_COMPANY_TYPE_FILTER_KEY = "policyCompanyType";
export const COMPANY_TYPE_LOOKUP_NAME = "COMPANY_TYPE";

export const priorityStyleMap = {
  vimp: {
    backgroundColor: "#E8F5E9",
    color: colors.text.primary,
    dotColor: "#4CAF50",
  },
  low: {
    backgroundColor: "#FFFDE7",
    color: colors.text.primary,
    dotColor: "#FFEB3B",
  },
  imp: {
    backgroundColor: "#FFEBEE",
    color: colors.text.primary,
    dotColor: "#F44336",
  },
  medium: {
    backgroundColor: "#FFCD0529",
    color: colors.text.primary,
    dotColor: "#F8A500",
  },
  high: {
    backgroundColor: "#FF710426",
    color: colors.text.primary,
    dotColor: "#FF7104",
  },
};

export const kpisData = (overallData: OverallData) => [
  {
    // Raw count, not pre-formatted: KPICards applies formatNumberByLocalization
    // itself using the localization it resolves (prop or its own hook), so the
    // grouping stays consistent with every other plain-count card in the app.
    title: "Total companies",
    count: overallData?.totalCompanyCount ?? 0,
    backgroundColor: theme.palette.kpiColors.purple,
    textColor: theme.palette.text.purple,
  },
  {
    title: "Total policies",
    count: overallData?.totalPolicyCount ?? 0,
    backgroundColor: theme.palette.kpiColors.yellow,
    textColor: theme.palette.text.yellow,
  },
  {
    title: "Total premium",
    count: overallData?.totalCompaniesPremium ?? 0,
    backgroundColor: theme.palette.kpiColors.teal,
    textColor: theme.palette.text.teal,
    isFloatable: true,
  },
  {
    title: "Total brokerage",
    count: overallData?.totalCompaniesBrokerage ?? 0,
    backgroundColor: theme.palette.kpiColors.orange,
    textColor: theme.palette.text.orange,
    isFloatable: true,
  },
];

export const getColumns = (localization?: LocalizationConfig): ColDef[] => [
  {
    headerName: "Company name",
    field: "companyName",
    tooltipField: "companyName",
    headerTooltip: "Company name",
    cellClass: "clickable-cell",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    pinned: "left",
  },
  {
    headerName: "Policy premium (#count)",
    field: "policyPremium",
    headerTooltip: "Policy premium (#count)",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    cellRenderer: "PremiumCountCell",
    cellRendererParams: { premiumField: "policyPremium", countField: "policyCount" },
    tooltipValueGetter: ({ data }) =>
      data?.policyPremium != null
        ? `${formatCurrencyByLocalization(data.policyPremium)} (#${data.policyCount ?? 0})`
        : "--",
    width: 190,
    pinned: "left",
    hide: true,
  },
  {
    headerName: "RO premium (#count)",
    field: "roPremium",
    headerTooltip: "RO premium (#count)",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    cellRenderer: "PremiumCountCell",
    cellRendererParams: { premiumField: "roPremium", countField: "roCount" },
    tooltipValueGetter: ({ data }) =>
      data?.roPremium != null
        ? `${formatCurrencyByLocalization(data.roPremium)} (#${data.roCount ?? 0})`
        : "--",
    width: 190,
  },
  {
    headerName: "SO premium (#count)",
    field: "soPremium",
    headerTooltip: "SO premium (#count)",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    cellRenderer: "PremiumCountCell",
    cellRendererParams: { premiumField: "soPremium", countField: "soCount" },
    tooltipValueGetter: ({ data }) =>
      data?.soPremium != null
        ? `${formatCurrencyByLocalization(data.soPremium)} (#${data.soCount ?? 0})`
        : "--",
    width: 190,
    hide: true,
  },
  {
    headerName: "Brokerage (RO)",
    field: "roBrokerage",
    headerTooltip: "RO brokerage",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value)
        : "--",
    width: 170,
  },
  ...(["Q1", "Q2", "Q3", "Q4"] as const).map(
    (q): ColDef => ({
      headerName: q,
      field: `roBrokerage${q}`,
      headerTooltip: `${q} RO brokerage`,
      cellClass: "right-aligned-cell",
      headerClass: "right-aligned-header",
      valueFormatter: ({ value }) =>
        value !== null && value !== undefined
          ? formatCurrencyByLocalization(value, localization)
          : "--",
      tooltipValueGetter: ({ value }) =>
        value !== null && value !== undefined
          ? formatCurrencyByLocalization(value)
          : "--",
      width: 130,
    }),
  ),
  // {
  //   headerName: "Brokerage",
  //   field: "brokerage",
  //   headerTooltip: "Brokerage",
  //   cellClass: "right-aligned-cell",
  //   headerClass: "right-aligned-header",
  //   valueFormatter: ({ value }) =>
  //     value !== null && value !== undefined ? formatNumberShort(value) : "--",
  //   tooltipValueGetter: ({ value }) =>
  //     value !== null && value !== undefined
  //       ? formatNumberByLocalization(value)
  //       : "--",
  // },
  {
    headerName: "Priority",
    field: "priority",
    tooltipField: "priority",
    headerTooltip: "Priority",
    cellRenderer: "ChipRenderer",
    cellRendererParams: {
      styleMap: priorityStyleMap,
      variant: "normal",
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    width: 170,
  },
  {
    headerName: "Claim amount",
    field: "claimAmount",
    headerTooltip: "Claim amount",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value)
        : "--",
    width: 170,
    hide: true,
  },
  {
    headerName: "Service score",
    field: "ServiceScore",
    headerTooltip:
      "Service score - Computed by average percentage of score achieved in each month based on selected filter",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    valueGetter: ({ data }) => data?.serviceScoreSummary?.totalServiceScore,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? `${formatNumberByLocalization(value)}%`
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? `${formatNumberByLocalization(value)}%`
        : "--",
    width: 170,
    disableSort: true,
  },

  {
    headerName: "Actions",
    field: "actions",
    tooltipField: "actions",
    headerTooltip: "Actions",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellRenderer: "ActionButton",
    minWidth: 110,
    pinned: "left",
    disableSort: true,
  },
];

export const tableSearchConfig: FormFieldConfig[] = [
  {
    key: "companyType",
    name: "companyType",
    label: "Company type",
    type: "select",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("COMPANY_TYPE"),
      isSmartSearch: true,
      defaultValue: "",
    },
    placeholder: "Search ",
  },
  {
    key: "priority",
    name: "priority",
    label: "Company priority",
    type: "select",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("PRIORITY", "DESC"),
      isSmartSearch: true,
      defaultValue: "",
    },
    placeholder: "Search ",
  },
  {
    key: "serviceScore",
    name: "serviceScore",
    label: "Service score",
    type: "select",
    gridColumn: 2.9,
    // apiDependencies: {
    //   endPoint: endPoints.lookUpByName("PRIORITY"),
    //   isSmartSearch: true,
    //   defaultValue: "",
    // },
    options: [
      { value: ">90", label: ">90%" },
      { value: ">80", label: ">80%" },
      { value: ">70", label: ">70%" },
      { value: "<70", label: "<70%" },
    ],
    placeholder: "Search ",
  },
];

export const searchDefaultValues = {
  type: "",
  industrySegment: "",
  priority: "",
  city: "",
  companyType: "",
  status: { value: "Active", label: "Active" },
  ownedBy: "",
  serviceScore: [],
  // viewBy: { value: "team", label: "Manager + Team" },
};

export const clientPortfolioBreadcrumbs = [
  {
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    label: "My client portfolio",
  },
];
