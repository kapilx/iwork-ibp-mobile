import { ColDef } from "ag-grid-community";
import {
  endPoints,
  CompanyNameRenderer,
  FormFieldConfig,
  convertToTreeData,
  formatCurrencyByLocalization,
  formatNumberByLocalization,
  formatLargeCurrency,
  FULL_PRECISION_FRACTION_DIGITS,
  LocalizationConfig,
  masterDataUtilitySearchFunction,
  NO_DATA_AVAILABLE,
  sentimentStyleMap,
  theme,
  colors,
  masterDataUtilityCitySearchFunction,
} from "@ui/ui-lib";
import { soRoPremiumCell } from "./index.js";
import { accountManagerUtilityFunction } from "@ui/ui-lib/utils/masterUserDataUtility.js";

interface OverallData {
  companyLeads?: number;
  companyOpportunities?: number;
  companyProspects?: number;
  companyQcr?: number;
  companyClients?: number;
  totalRoCount?: number;
  totalRoPremium?: number;
  totalSoCount?: number;
  totalSoPremium?: number;
  untappedCompanies?: number;
  count?: number;
}

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

export const hierarchyField: FormFieldConfig = {
  key: "userId",
  name: "userId",
  label: "Owner",
  type: "treeSelect",
  apiDependencies: {
    endPoint: endPoints.employeeHirarcy,
    utilityFunction: convertToTreeData,
    // clearFieldsOnChange: ["owner"],
  },
  componentProps: {
    fullWidth: true,
  },
} as const;

export const kpisData = (
  overallData: OverallData,
  totalRows: number,
  localization: LocalizationConfig
) => [
  {
    // Raw count, not pre-formatted: KPICards applies formatNumberByLocalization
    // itself using the localization it resolves (prop or its own hook).
    title: "Total companies",
    count: overallData?.count ?? 0,
    backgroundColor: theme.palette.kpiColors.purple,
    textColor: theme.palette.text.purple,
  },
  {
    title: "Untapped companies",
    count: overallData?.untappedCompanies ?? 0,
    backgroundColor: theme.palette.kpiColors.yellow,
    textColor: theme.palette.text.yellow,
  },
  {
    // Composite "premium (#count)" cards can't use isFloatable (that path only
    // formats a single number) — premium uses the same compact formatter
    // (formatLargeCurrency) as every isFloatable card elsewhere, and the count
    // uses the same plain-count formatter (formatNumberByLocalization), so the
    // decimals/casing/comma-grouping match the rest of the app.
    title: "Total RO premium (#count)",
    count:
      overallData?.totalRoCount != null && overallData?.totalRoPremium != null
        ? `${formatLargeCurrency(
            overallData?.totalRoPremium,
            localization
          ).trim()} (${formatNumberByLocalization(overallData?.totalRoCount, localization)})`
        : 0,
    originalValue:
      overallData?.totalRoCount != null && overallData?.totalRoPremium != null
        ? `${formatNumberByLocalization(
            overallData.totalRoPremium,
            localization,
            FULL_PRECISION_FRACTION_DIGITS
          )} (${formatNumberByLocalization(overallData.totalRoCount, localization, FULL_PRECISION_FRACTION_DIGITS)})`
        : undefined,
    backgroundColor: theme.palette.kpiColors.teal,
    textColor: theme.palette.text.teal,
  },
  {
    title: "Total SO premium (#count)",
    count:
      overallData?.totalSoCount != null && overallData?.totalSoPremium != null
        ? `${formatLargeCurrency(
            overallData?.totalSoPremium,
            localization
          ).trim()} (${formatNumberByLocalization(overallData?.totalSoCount, localization)})`
        : 0,
    originalValue:
      overallData?.totalSoCount != null && overallData?.totalSoPremium != null
        ? `${formatNumberByLocalization(
            overallData.totalSoPremium,
            localization,
            FULL_PRECISION_FRACTION_DIGITS
          )} (${formatNumberByLocalization(overallData.totalSoCount, localization, FULL_PRECISION_FRACTION_DIGITS)})`
        : undefined,
    backgroundColor: theme.palette.kpiColors.orange,
    textColor: theme.palette.text.orange,
  },
];

export const getColumns = (
  localization?: LocalizationConfig,
  currentUserId?: number | null,
  onHrPortalRedirect?: (companyId: number) => void,
): ColDef[] => [
  {
    headerName: "Display name",
    field: "displayName",
    tooltipField: "displayName",
    headerTooltip: "Display name",
    cellClass: "clickable-cell",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    cellRenderer: CompanyNameRenderer,
    cellRendererParams: {
      nameField: "displayName",
      subTextField: "industrySegment",
      colorKey: "colorKey",
    },
    pinned: "left",
    minWidth: 350,
  },
  {
    headerName: "Lead CRM",
    field: "leadCRM",
    tooltipField: "leadCRM",
    headerTooltip: "Lead CRM",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
  },
  {
    headerName: "Priority level",
    field: "priority",
    tooltipField: "priority",
    headerTooltip: "Priority level",
    cellRenderer: "ChipRenderer",
    cellRendererParams: {
      styleMap: priorityStyleMap,
      variant: "normal",
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
  },
  {
    headerName: "Policy premium (#count)",
    field: "policyPremium",
    headerTooltip: "Policy premium (#count)",
    cellRenderer: (params: any) => {
      const premium =
        params?.data?.policyPremium != null
          ? formatCurrencyByLocalization(
              params?.data?.policyPremium,
              localization
            )
          : "--";
      const count = `(#${params?.data?.policyCount})`;
      return soRoPremiumCell(premium, count);
    },
    tooltipValueGetter: (params) => {
      const val =
        params?.data?.policyPremium != null
          ? formatCurrencyByLocalization(
              params?.data?.policyPremium,
              localization
            )
          : "--";
      return val !== "--"
        ? String(`${val} (#${params?.data?.policyCount})`)
        : { NO_DATA_AVAILABLE };
    },
    hide: false,
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },

  {
    headerName: "RO premium (#count)",
    field: "roPremium",
    headerTooltip: "RO premium (#count)",
    cellRenderer: (params: any) => {
      const premium =
        params?.data?.roPremium != null
          ? formatCurrencyByLocalization(params?.data?.roPremium, localization)
          : "--";
      const count = `(#${params?.data?.renewalOpportunityCount})`;
      return soRoPremiumCell(premium, count);
    },
    tooltipValueGetter: (params) => {
      const val =
        params?.data?.roPremium != null
          ? formatCurrencyByLocalization(params?.data?.roPremium, localization)
          : "--";
      return val !== "--"
        ? String(`${val} (#${params?.data?.renewalOpportunityCount})`)
        : { NO_DATA_AVAILABLE };
    },
    hide: false,
    cellClass: "clickable-cell right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "SO premium (#count)",
    field: "soPremium",
    headerTooltip: "SO premium (#count)",
    cellRenderer: (params: any) => {
      const premium =
        params?.data?.soPremium != null
          ? formatCurrencyByLocalization(params?.data?.soPremium, localization)
          : "--";

      const countValue =
        params?.data?.salesOpportunityCount != null
          ? params?.data?.salesOpportunityCount
          : 0;

      const count = `(#${countValue})`;

      // return a span with spacing via CSS, not `&nbsp;`
      return soRoPremiumCell(premium, count);
    },
    tooltipValueGetter: (params) => {
      const soPremium = params?.data?.soPremium;
      if (soPremium === null || soPremium === undefined) {
        return { NO_DATA_AVAILABLE };
      }
      const val = formatCurrencyByLocalization(soPremium, localization);
      return `${val} (#${params?.data?.salesOpportunityCount})`;
    },
    hide: false,
    cellClass: "clickable-cell right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  // {
  //   headerName: "Brokerage",
  //   field: "brokerage",
  //   headerTooltip: "Brokerage",
  //   valueFormatter: ({ value }) =>
  //     formatCurrencyByLocalization(value, localization) ?? "--",
  //   tooltipValueGetter: ({ value }) =>
  //     formatCurrencyByLocalization(value, localization) ?? "--",
  //   hide: false,
  //   disableSort: true,
  //   cellClass: "right-aligned-cell",
  //   headerClass: "right-aligned-header",
  // },
  {
    headerName: "Status",
    field: "status",
    tooltipField: "status",
    headerTooltip: "Status",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
  },
  {
    headerName: "Currency",
    field: "currency",
    headerTooltip: "Currency",
    colId: "currency",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value?.value : "--",
    tooltipValueGetter: (params) => {
      const val = params.data?.currency?.value;
      return val !== null && val !== undefined
        ? String(val)
        : { NO_DATA_AVAILABLE };
    },
    hide: true,
  },
  {
    headerName: "Sum insured",
    field: "sumInsured",
    headerTooltip: "Sum insured",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    tooltipValueGetter: (params) => {
      const val = params.data?.sumInsured;
      return val !== null && val !== undefined
        ? formatCurrencyByLocalization(val, localization)
        : NO_DATA_AVAILABLE;
    },
    hide: true,
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },

  {
    headerName: "City",
    field: "city",
    disableSort: true,
    tooltipField: "city",
    valueGetter: (params) => {
      const cityName = params.data?.city;
      return cityName || "--";
    },
    headerTooltip: "City",
    hide: true,
  },
  {
    headerName: "Type",
    field: "companyType",
    tooltipField: "companyType",
    headerTooltip: "Type",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Sentiment",
    field: "sentiment",
    tooltipField: "sentiment",
    headerTooltip: "Sentiment",
    cellRenderer: "ChipRenderer", // Use the generic ChipRenderer
    cellRendererParams: {
      styleMap: sentimentStyleMap, // Pass the type as "sentiment"
      variant: "withImage", // Use the variant with image
    },
    valueGetter: (params) => {
      const primaryDetails = params.data?.sentiment ?? "--";
      return primaryDetails;
    },
    hide: true,
  },
  {
    headerName: "Country",
    field: "country",
    colId: "country",
    tooltipField: "country.name",
    headerTooltip: "Country",
    valueGetter: (params) => {
      const primaryDetails = params.data?.country.name ?? "--";
      return primaryDetails;
    },
    hide: true,
  },
  {
    headerName: "Company name",
    field: "companyName",
    tooltipField: "companyName",
    headerTooltip: "Company name",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
    cellRenderer: CompanyNameRenderer,
    cellRendererParams: {
      nameField: "companyName",
      subTextField: "industrySegment",
    },
  },
  {
    headerName: "Industry",
    field: "industrySegment",
    tooltipField: "industrySegment",
    headerTooltip: "Industry",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Associate",
    field: "associateCrm",
    tooltipField: "associateCrm",
    headerTooltip: "Associate",
    valueFormatter: ({ value }) => (value ? value : "--"),
    hide: true,
  },
//   {
//   headerName: "Risk Watch",
//   field: "leadCRMId",
//   colId: "hrPortalAction",
//   sortable: false,
//   filter: false,
//   resizable: false,
//   width: 140,
//   pinned: "right" as const,

//   cellRenderer: (params: any) => {
//     if (
//       !currentUserId ||
//       params.data?.leadCRMId !== currentUserId
//     ) {
//       return null;
//     }

//     return (
//       <button
//         style={{
//           fontSize: "12px",
//           padding: "4px 10px",
//           borderRadius: "4px",
//           border: "1px solid #1976d2",
//           background: "#fff",
//           color: "#1976d2",
//           cursor: "pointer",
//           whiteSpace: "nowrap",
//         }}
//         onClick={(e) => {
//           e.stopPropagation();
//           onHrPortalRedirect?.(params.data.companyId);
//         }}
//       >
//         Risk Watch
//       </button>
//     );
//   },
// }
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
    key: "industrySegment",
    name: "industrySegment",
    label: "Industry",
    type: "select",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("INDUSTRY_SEGMENT"),
      isSmartSearch: true,
      defaultValue: "",
    },
    placeholder: "Search ",
  },
  {
    key: "city",
    name: "city",
    label: "City",
    type: "selectFieldByApi",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.masterDataByName("city"),
      utilityFunction: masterDataUtilityCitySearchFunction,
      defaultValue: "",
      customParams: { searchBy: "name" },
    },
    placeholder: "Search ",
  },
  {
    key: "status",
    name: "status",
    label: "Company status",
    type: "select",
    gridColumn: 2.9,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("COMPANY_STATUS"),
      isSmartSearch: true,
      defaultValue: "",
    },
    placeholder: "Search ",
  },

  {
    key: "accountManager",
    name: "accountManager",
    type: "treeSelect",
    label: "Account Manager",
    gridColumn: 5.8,
    apiDependencies: hierarchyField.apiDependencies,
    componentProps: {
      ...hierarchyField.componentProps,
      controlledSearchInput: false,
    },
  },
];

export const searchDefaultValues = {
  type: "",
  industrySegment: "",
  priority: "",
  city: "",
  companyType: "",
  status: { value: "Active", label: "Active" },
  // ownedBy: "",
  // viewBy: { value: "team", label: "Manager + Team" },
};
