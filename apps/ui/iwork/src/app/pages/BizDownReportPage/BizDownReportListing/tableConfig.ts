import { companyUtilityFunction, DATE_FORMATS, endPoints, getCurrentFinancialYearDefault, FormFieldConfig } from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import { priorityStyleMap } from "../../CompanyPage/CompanyListing/tableConfig.js";
import {
  formatDate,
  convertToTreeData,
  formatCurrencyByLocalization,
  LocalizationConfig,
  theme,
  getAllMonths,
  getMonthsForQuarter,
  generateYearOptions,
} from "@ui/ui-lib";
import { masterUtility } from "../../../components/BusinessPerformance/businessPerformanceConfig.js";
import { ALL_VALUE } from "../../../constants/index.js";
import { organisationUtility } from "../../OpportunitiesPage/OpportunitiesListing/tableConfig.js";
import { insurerBranchUtilityFunction } from "../../InsurerPage/AddInsurerBranch/formConfig.js";

// The backend already sends these report date fields pre-formatted as
// DD/MM/YYYY (not raw ISO) — pass those through as-is rather than re-parsing
// them with dayjs's default parser, which misreads "15/07/2026" as an invalid
// MM/DD/YYYY string. Anything else is assumed to be an ISO-shaped value and
// gets formatted normally; anything unparseable is shown unchanged.
const formatReportDate = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "--";
  if (typeof value === "number") {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format(DATE_FORMATS.DATE_MONTH_YEAR) : String(value);
  }
  const str = String(value);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
  // Only attempt further parsing for unambiguous ISO-shaped strings — a bare
  // numeric string (e.g. an epoch value serialized as text) is shown unchanged
  // rather than guessed at, since dayjs's default parser can misread it.
  if (!/^\d{4}-\d{2}-\d{2}/.test(str)) return str;
  const parsed = dayjs(str);
  return parsed.isValid() ? parsed.format(DATE_FORMATS.DATE_MONTH_YEAR) : str;
};

// Keep your existing getColumns function...
export const getColumns = (localization?: LocalizationConfig): ColDef[] => [
  {
    headerName: "IIRM Policy Number",
    field: "iirmPolNo",
    tooltipField: "iirmPolNo",
    headerTooltip: "IIRM Policy Number",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "clickable-cell",
  },
  {
    headerName: "Opportunity ID",
    field: "opportunityId",
    tooltipField: "opportunityId",
    headerTooltip: "Opportunity ID",
    width: 130,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "clickable-cell",
  },
  {
    // Policy rows only. The New/Renewal wording is mapped in SQL (see the
    // policyDetails select in policy-report.ts); endorsement and reward rows
    // come back NULL and render as "--".
    headerName: "Opportunity Type",
    field: "opportunityType",
    tooltipField: "opportunityType",
    headerTooltip: "Opportunity Type",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined && value !== "" ? value : "--",
  },
    {
    headerName: "SBU",
    field: "SBU",
    tooltipField: "SBU",
    headerTooltip: "SBU",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "IIRM Reference Number",
    field: "iirmRefNo",
    tooltipField: "iirmRefNo",
    headerTooltip: "IIRM Reference Number",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Insurer Policy Number",
    field: "insPolNo",
    tooltipField: "insPolNo",
    headerTooltip: "Insurer Policy Number",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Vertical",
    field: "vertical",
    tooltipField: "vertical",
    headerTooltip: "Vertical",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide:true,
  },
  {
    headerName: "Insurer Endorsement Number",
    field: "insEndNo",
    tooltipField: "insEndNo",
    headerTooltip: "Insurer Endorsement Number",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Income Type",
    field: "incomeType",
    tooltipField: "incomeType",
    headerTooltip: "Income Type",
    width: 120,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Entry In Iwork",
    field: "entryInIwork",
    tooltipField: "entryInIwork",
    headerTooltip: "Entry In Iwork",
    width: 140,
    hide: true,
  },
  {
    headerName: "Income Month",
    field: "incomeMonth",
    tooltipField: "incomeMonth",
    headerTooltip: "Income Month",
    width: 120,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Date Of Income",
    field: "dateOfIncome",
    tooltipField: "dateOfIncome",
    headerTooltip: "Date Of Income",
    width: 140,
    hide: true,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatReportDate(value) : "--",
  },
  {
    headerName: "Policy From Date",
    field: "policyFromDate",
    tooltipField: "policyFromDate",
    headerTooltip: "Policy From Date",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatReportDate(value) : "--",
  },
  {
    headerName: "Business Month",
    field: "businessMonth",
    tooltipField: "businessMonth",
    headerTooltip: "Business Month",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Date Of Business",
    field: "dateOfBusiness",
    tooltipField: "dateOfBusiness",
    headerTooltip: "Date Of Business",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatReportDate(value) : "--",
  },
  {
    headerName: "Policy To Date",
    field: "policyToDate",
    tooltipField: "policyToDate",
    headerTooltip: "Policy To Date",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatReportDate(value) : "--",
  },
  {
    headerName: "Cust Id",
    field: "custId",
    tooltipField: "custId",
    headerTooltip: "Customer ID",
    width: 100,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Customer Name",
    field: "customerName",
    tooltipField: "customerName",
    headerTooltip: "Customer Name",
    width: 180,
    valueGetter: ({ data }) => data?.companyName ?? data?.customerName ?? null,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "clickable-cell",
  },
  {
    headerName: "Broker Agent",
    field: "brokerName",
    tooltipField: "brokerName",
    headerTooltip: "Broker Agent",
    width: 180,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Customer Category",
    field: "customerCategory",
    tooltipField: "customerCategory",
    headerTooltip: "Customer Category",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Policy Name",
    field: "policyName",
    tooltipField: "policyName",
    headerTooltip: "Policy Name",
    width: 180,
    valueGetter: ({ data }) => data?.policyType ?? data?.policyName ?? null,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Policy Category",
    field: "policyCategory",
    tooltipField: "policyCategory",
    headerTooltip: "Policy Category",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Insurer Name",
    field: "insurer",
    tooltipField: "insurer",
    headerTooltip: "Insurer Name",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "IIRM Organisation",
    field: "iirmOrganisation",
    tooltipField: "iirmOrganisation",
    headerTooltip: "IIRM Organisation",
    width: 160,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Reward Category",
    field: "rewardCategory",
    tooltipField: "rewardCategory",
    headerTooltip: "Reward Category",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Remarks",
    field: "remarks",
    tooltipField: "remarks",
    headerTooltip: "Remarks",
    width: 180,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Insurer Branch",
    field: "insBranch",
    tooltipField: "insBranch",
    headerTooltip: "Insurer Branch",
    width: 120,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Employee Name",
    field: "empName",
    tooltipField: "empName",
    headerTooltip: "Employee Name",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "IIRM Branch",
    field: "iirmBranch",
    tooltipField: "iirmBranch",
    headerTooltip: "IIRM Branch",
    width: 120,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Vertical",
    field: "vertical",
    tooltipField: "vertical",
    headerTooltip: "Vertical",
    width: 120,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Department",
    field: "department",
    tooltipField: "department",
    headerTooltip: "Department",
    width: 120,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Status",
    field: "status",
    tooltipField: "status",
    headerTooltip: "Status",
    width: 120,
    cellRenderer: "ChipRenderer",
    cellRendererParams: {
      styleMap: priorityStyleMap,
      variant: "withDot",
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
  {
    headerName: "Share Percentage",
    field: "sharePercentage",
    headerTooltip: "Share Percentage",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? `${value}%` : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? `${value}%` : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: true,
  },
  {
    headerName: "Net Premium",
    field: "netPremium",
    headerTooltip: "Net Premium",
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
    headerName: "Terrorism",
    field: "terrorism",
    headerTooltip: "Terrorism",
    width: 120,
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
    headerName: "Other",
    field: "other",
    headerTooltip: "Other",
    width: 120,
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
    headerName: "Service Tax",
    field: "serviceTax",
    headerTooltip: "Service Tax",
    width: 120,
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
    headerName: "Premium Collected",
    field: "premiumCollected",
    headerTooltip: "Premium Collected",
    width: 120,
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
    hide: false,
  },
  {
    headerName: "Gross Premium",
    field: "grossPremium",
    headerTooltip: "Gross Premium",
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
    headerName: "Brokerage Percentage",
    field: "brokeragePercentage",
    headerTooltip: "Brokerage Percentage",
    width: 180,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? `${value}%` : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? `${value}%` : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: true,
  },
  {
    headerName: "Brokerage Amount",
    field: "brokerageAmount",
    headerTooltip: "Brokerage Amount",
    width: 160,
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
    headerName: "Brokerage Collected",
    field: "brokerageCollected",
    headerTooltip: "Brokerage Collected",
    width: 120,
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
    headerName: "Brokerage Amount As Entered By ISG",
    field: "brokerageAmountAsEnteredByIsg",
    tooltipField: "brokerageAmountAsEnteredByIsg",
    headerTooltip: "Brokerage Amount As Entered By ISG",
    width: 240,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: true,
  },
  {
    headerName: "Brokerage Amount As Per Iwork",
    field: "brokerageAmountAsPerIwork",
    tooltipField: "brokerageAmountAsPerIwork",
    headerTooltip: "Brokerage Amount As Per Iwork",
    width: 220,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, localization)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: true,
  },
  {
    headerName: "Fees",
    field: "fees",
    headerTooltip: "Fees",
    width: 120,
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
    headerName: "Deal Confirmed",
    field: "dealConfirmed",
    tooltipField: "dealConfirmed",
    headerTooltip: "Deal Confirmed",
    width: 140,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? (value ? "Yes" : "No") : "--",
    hide: true,
  },
  // {
  //   headerName: "Policy Group",
  //   field: "policyGroup",
  //   tooltipField: "policyGroup",
  //   headerTooltip: "Policy Group",
  //   width: 130,
  //   valueFormatter: ({ value }) =>
  //     value !== null && value !== undefined ? value : "--",
  //   hide: true,
  // },
  {
    headerName: "Terrorism Brokerage Amount",
    field: "terrorismCommissionAmount",
    headerTooltip: "Terrorism Brokerage Amount",
    width: 200,
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
    headerName: "Terrorism Brokerage Percentage",
    field: "terrorismCommissionPercentage",
    headerTooltip: "Terrorism Brokerage Percentage",
    width: 220,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? `${value}%` : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? `${value}%` : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: true,
  },
  {
    headerName: "Policy Status",
    field: "policyStatus",
    tooltipField: "policyStatus",
    headerTooltip: "Policy Status",
    width: 130,
    cellRenderer: "ChipRenderer",
    cellRendererParams: {
      styleMap: priorityStyleMap,
      variant: "withDot",
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  // {
  //   headerName: "Company Vertical",
  //   field: "companyVertical",
  //   tooltipField: "companyVertical",
  //   headerTooltip: "Company Vertical",
  //   width: 150,
  //   valueFormatter: ({ value }) =>
  //     value !== null && value !== undefined ? value : "--",
  //   hide: true,
  // },
  {
    headerName: "Total Brokerage Amount",
    field: "totalBrokerageAmount",
    headerTooltip: "Total Brokerage Amount",
    width: 200,
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
    headerName: "Ingested Mode",
    field: "ingestedMode",
    tooltipField: "ingestedMode",
    headerTooltip: "Ingested Mode",
    width: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: true,
  },
];

// Quarter logic function - same as business performance
export const getMonthOptionsForQuarter = (quarter?: string) => {
  if (!quarter || quarter === ALL_VALUE) {
    return getAllMonths();
  }

  const quarterMonths = getMonthsForQuarter(
    quarter as "Q1" | "Q2" | "Q3" | "Q4"
  );
  return [{ value: ALL_VALUE, label: "All" }, ...quarterMonths];
};

export const getMonthsForQuarterInSmarSearch = (data: any) => {
  const quarter = data && typeof data === "object" ? data.value : data;
  if (
    quarter &&
    (quarter === "Q1" ||
      quarter === "Q2" ||
      quarter === "Q3" ||
      quarter === "Q4")
  ) {
    const options = getMonthsForQuarter(quarter);
    return [{ value: ALL_VALUE, label: "All" }, ...options];
  }

  return getAllMonths();
};

export const tableSearchConfig = (
  companyContactId?: number,
  organisationId?: number
) => [
  {
    key: "organisationId",
    name: "organisationId",
    label: "Organisation",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
    },
    placeholder: "Select organisation",
    apiDependencies: {
      endPoint: endPoints.masterOrganisation,
      utilityFunction: (data: any[]) => organisationUtility(data),
      clearFieldsOnChange: ["verticalId", "departmentId", "branchId"],
    },
  },
  {
    key: "verticalId",
    name: "verticalId",
    label: "Vertical",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
    },
    placeholder: "Select vertical",
    apiDependencies: {
      endPoint: endPoints.verticalsByOrg,
      utilityFunction: (data: any[]) => masterUtility(data),
      dependentField: "organisationId",
      clearFieldsOnChange: ["departmentId"],
    },
  },
  {
    key: "departmentId",
    name: "departmentId",
    label: "Department",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
    },
    placeholder: "Select department",
    apiDependencies: {
      endPoint: endPoints.departmentsByVertical,
      utilityFunction: (data: any[]) => masterUtility(data),
      dependentField: "verticalId",
    },
  },
  {
    key: "branchId",
    name: "branchId",
    label: "Branch",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
    },
    placeholder: "Select branch",
    apiDependencies: {
      endPoint: endPoints.branchesByOrg,
      utilityFunction: (data: any[]) => masterUtility(data),
      dependentField: "organisationId",
    },
  },
  {
    key: "financialYear",
    name: "financialYear",
    label: "Financial Year",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
    },
    placeholder: "Select financial year",
    options: generateYearOptions(),
  },
  {
    key: "quarter",
    name: "quarter",
    label: "Quarter",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
    },
    placeholder: "Select quarter",
    options: [
      { value: ALL_VALUE, label: "All" },
      { value: "Q1", label: "Q1" },
      { value: "Q2", label: "Q2" },
      { value: "Q3", label: "Q3" },
      { value: "Q4", label: "Q4" },
    ],
  },
  {
    key: "month",
    name: "month",
    label: "Month",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
    },
    placeholder: "Select month",
    options: getAllMonths(), // Default options
  },
  {
    key: "userId",
    name: "userId",
    label: "Owner",
    type: "treeSelect",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
    },
    placeholder: "Select team member",
    apiDependencies: {
      endPoint: endPoints.employeeHirarcy,
      utilityFunction: convertToTreeData,
    },
  },
  {
    key: "owner",
    name: "owner",
    label: "View by",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
    },
    placeholder: "Select view by",
    options: [
      { value: "me+team", label: "Me + Team" },
      { value: "me", label: "Me" },
    ],
  },
];

export const searchDefaultValues = {
  organisationId: "",
  verticalId: "",
  departmentId: "",
  branchId: "",
  financialYear: getCurrentFinancialYearDefault(),
  quarter: "",
  month: "",
  userId: "",
  owner: "",
};

interface OverallData {
  grosspremium?: number;
  commissionamount?: number;
  netpremium?: number;
  // activePolicies?: number;
}

export const bizDownReportData = (
  overallData: OverallData,
  totalRows: number
) => [
  {
    title: "Gross Premium",
    count: overallData?.grosspremium || 0,
    percentage: ((overallData?.grosspremium ?? 0) / totalRows) * 100,
    backgroundColor: theme.palette.kpiColors.purple,
    textColor: theme.palette.text.purple,
    isFloatable: true,
  },
  {
    title: "Total Brokerage Amount",
    count: overallData?.commissionamount || 0,
    percentage: ((overallData?.commissionamount ?? 0) / totalRows) * 100,
    backgroundColor: theme.palette.kpiColors.yellow,
    textColor: theme.palette.text.yellow,
    isFloatable: true,
  },
  {
    title: "Net Premium",
    count: overallData?.netpremium || 0,
    percentage: ((overallData?.netpremium ?? 0) / totalRows) * 100,
    backgroundColor: theme.palette.kpiColors.teal,
    textColor: theme.palette.text.teal,
    isFloatable: true,
  },
  {
    title: "Brokerage to collect",
    count: overallData?.brokeragetobecollected || 0,
    percentage: ((overallData?.brokeragetobecollected ?? 0) / totalRows) * 100,
    backgroundColor: theme.palette.kpiColors.orange,
    textColor: theme.palette.text.orange,
    isFloatable: true,
  },
];

export const periodModeToggleField = (): FormFieldConfig => ({
  key: "periodMode",
  name: "periodMode",
  label: "Filter by",
  type: "segmentedcontrol",
  gridColumn: 4,
  options: [
    { value: "incomeMonth", label: "Income Month" },
    { value: "businessMonth", label: "Business Month" },
  ],
  componentProps: {
    fullWidth: true,
    variantType: "primary",
  },
});

export const businessMonthField = () => ({
  key: "businessMonth",
  name: "businessMonth",
  label: "Business month",
  type: "multiselect",
  gridColumn: 3.2,
  componentProps: {
    fullWidth: true,
  },
  placeholder: "Select months",
  apiDependencies: {
    utilityFunction: getAllMonths,
  },
});

export const fromDateField = (label = "From date (Applied on date of income)"): FormFieldConfig => ({
  key: "from",
  name: "from",
  label,
  type: "date",
  gridColumn: 3.2,
  componentProps: {
    fullWidth: true,
    placeholder: "Select from date",
  },
});

export const toDateField = (label = "To date (Applied on date of income)"): FormFieldConfig => ({
  key: "to",
  name: "to",
  label,
  type: "date",
  gridColumn: 3.2,
  componentProps: {
    fullWidth: true,
    placeholder: "Select to date",
  },
});

export const insurerField = (isDisabled: boolean) => {
  return {
    key: "insurerId",
    name: "insurerId",
    label: "Insurer",
    type: "selectFieldByApi",
    gridColumn: 3.2,
    componentProps: {
      fullWidth: true,
      disabled: isDisabled,
    },
    apiDependencies: {
      endPoint: endPoints.insurersList,
      utilityFunction: companyUtilityFunction,
      customParams: { limit: 500, searchBy: "firstName" },
      clearFieldsOnChange: ["insurerBranchId"],
    },
    placeholder: "Select Insurer",
  };
};

export const insurerBranchField = (): FormFieldConfig => ({
  key: "insurerBranchId",
  name: "insurerBranchId",
  label: "Branch",
  type: "selectFieldByApi",
  gridColumn: 3.2,
  placeholder: "Search branch",
  apiDependencies: {
    endPoint: endPoints.insurerBranchList,
    dependentField: "insurerId",
    utilityFunction: insurerBranchUtilityFunction,
  },
  componentProps: {
    fullWidth: true,
  },
});

export const branchViewByField = (): FormFieldConfig => ({
  key: "branchViewBy",
  name: "branchViewBy",
  label: "View by",
  type: "segmentedcontrol",
  gridColumn: 4,
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
});
