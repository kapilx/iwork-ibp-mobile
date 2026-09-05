import {
  FormFieldConfig,
  convertToTreeData,
  endPoints,
  insurerListUtilityFunction,
  generateYearOptions,
  getMonthsForQuarter,
  getAllMonths,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";
import { DonutGraphConfig } from "../DonutChart/types";
import { ALL_VALUE } from "../../constants";
import { organisationUtility } from "../../pages/OpportunitiesPage/OpportunitiesListing/tableConfig";
import { getQuarter } from "date-fns";
import {
  getMonthOptionsForQuarter,
  getMonthsForQuarterInSmarSearch,
} from "../../pages/BizDownReportPage/BizDownReportListing/tableConfig";

interface ChartFieldMap {
  subtitle: string;
  dataIndex: number;
  countKey: string;
  targetKey: string;
  brokerageAmount?: string;
  variant?: "single" | "dual";
  primaryLabel?: string;
  secondaryLabel?: string;
  additionalDataIndex?: number;
  additionalCountKey?: string;
  additionalTargetKey?: string;
  additionalBrokerageKey?: string;
}

export interface DashboardCollectionRow {
  name: string;
  target: number | null;
  achieved: number | null;
  percentageText: string;
  percentageIncreased: boolean;
}

const formatDashboardCollectionValue = (value: number | null): string =>
  value === null
    ? "--"
    : value.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      });

export const dashboardCollectionRowsConfig: DashboardCollectionRow[] = [
  {
    name: "Business booked",
    target: null,
    achieved: null,
    percentageText: "--",
    percentageIncreased: false,
  },
  {
    name: "Premium",
    target: null,
    achieved: null,
    percentageText: "--",
    percentageIncreased: false,
  },
  {
    name: "Business billed",
    target: null,
    achieved: null,
    percentageText: "--",
    percentageIncreased: false,
  },
  {
    name: "Business unbilled",
    target: null,
    achieved: null,
    percentageText: "--",
    percentageIncreased: false,
  },
  {
    name: "Invoiced",
    target: null,
    achieved: null,
    percentageText: "--",
    percentageIncreased: false,
  },
  {
    name: "Not collected",
    target: null,
    achieved: null,
    percentageText: "--",
    percentageIncreased: false,
  },
];

export const getBusinessCollectionColumns = (): ColDef[] => [
  {
    headerName: "Name",
    field: "name",
    headerTooltip: "Name",
    minWidth: 220,
    disableSort: true,
  },
  {
    headerName: "Target",
    field: "target",
    headerTooltip: "Target",
    flex: 1,
    valueFormatter: ({ value }: { value: number | null }) =>
      formatDashboardCollectionValue(value),
    tooltipValueGetter: (params: any) => {
      if (params.data?.name !== "Premium") return undefined;
      return params.value !== null && params.value !== undefined
        ? `${formatDashboardCollectionValue(params.value)}`
        : undefined;
    },
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    disableSort: true,
  },
  {
    headerName: "Achieved",
    field: "achieved",
    headerTooltip: "Achieved",
    flex: 1,
    valueFormatter: ({ value }: { value: number | null }) =>
      formatDashboardCollectionValue(value),
    tooltipValueGetter: (params: any) => {
      if (params.data?.name !== "Premium") return undefined;
      return params.value !== null && params.value !== undefined
        ? `${formatDashboardCollectionValue(params.value)}`
        : undefined;
    },
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    disableSort: true,
  },
  {
    headerName: "Percentage",
    field: "percentageText",
    headerTooltip: "Percentage",
    flex: 1,
    tooltipValueGetter: (params: any) => {
      if (params.data?.name !== "Premium") return undefined;
      return params.value && params.value !== "--"
        ? `${params.value}`
        : undefined;
    },
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    disableSort: true,
  },
];

const CHART_FIELD_MAP: ChartFieldMap[] = [
  {
    subtitle: "Total",
    dataIndex: 3,
    countKey: "totalPolicyCount",
    targetKey: "totalTarget",
    brokerageAmount: "totalSumOfBrokerage",
    variant: "single",
  },
  {
    subtitle: "New Business",
    dataIndex: 0,
    countKey: "countOfSO",
    targetKey: "targetOfSO",
    brokerageAmount: "sumOfBrokerageAmountOfSO",
    variant: "single",
    additionalDataIndex: 2,
    additionalCountKey: "countOfSOisMined",
    additionalTargetKey: "targetOfSOMined",
    additionalBrokerageKey: "sumOfBrokerageAmountOfSOisMined",
  },
  {
    subtitle: "Retention",
    dataIndex: 1,
    countKey: "countOfRO",
    targetKey: "targetOfRO",
    brokerageAmount: "sumOfBrokerageAmountOfRO",
    variant: "single",
  },
  {
    subtitle: "Premium Collection",
    dataIndex: 4,
    countKey: "totalPolicyCount",
    targetKey: "targetPremiumCollected",
    brokerageAmount: "premiumCollected",
    variant: "dual",
    primaryLabel: "Expected",
    secondaryLabel: "Collected",
  },
  {
    subtitle: "Brokerage Collection",
    dataIndex: 5,
    countKey: "totalPolicyCount",
    targetKey: "targetBrokerageCollected",
    brokerageAmount: "brokerageCollected",
    variant: "single",
    primaryLabel: "Expected",
    secondaryLabel: "Collected",
  },
];

/**
 * Transforms API data into chart configuration objects
 * @param apiData - Raw API response data
 * @returns Array of DonutGraphConfig objects
 */
export const transformBusinessPerformanceData = (
  apiData: any[]
): DonutGraphConfig[] => {
  if (!apiData || !Array.isArray(apiData)) {
    console.warn("transformBusinessPerformanceData: Invalid API data provided");
    return [];
  }

  try {
    return CHART_FIELD_MAP.map((map) => {
      const dataItem = apiData[map.dataIndex];

      if (!dataItem) {
        console.warn(
          `transformBusinessPerformanceData: No data item at index ${map.dataIndex}`
        );
        return {
          subtitle: map.subtitle,
          count: 0,
          target: 0,
          variant: map.variant || "single",
        } as DonutGraphConfig;
      }

      const additionalItem =
        map.additionalDataIndex !== undefined
          ? (apiData[map.additionalDataIndex] ?? null)
          : null;

      const baseConfig: DonutGraphConfig = {
        subtitle: map.subtitle,
        count:
          (dataItem[map.countKey] ?? 0) +
          (additionalItem && map.additionalCountKey
            ? (additionalItem[map.additionalCountKey] ?? 0)
            : 0),
        target:
          (dataItem[map.targetKey] ?? 0) +
          (additionalItem && map.additionalTargetKey
            ? (additionalItem[map.additionalTargetKey] ?? 0)
            : 0),
        variant: map.variant || "single",
        brokerageAmount: map.brokerageAmount
          ? (dataItem[map.brokerageAmount] ?? 0) +
            (additionalItem && map.additionalBrokerageKey
              ? (additionalItem[map.additionalBrokerageKey] ?? 0)
              : 0)
          : undefined,
        primaryLabel: map.primaryLabel || "Target",
        secondaryLabel: map.secondaryLabel || "Achieved",
      };

      // Add dual variant specific fields for Premium chart
      if (map.variant === "dual") {
        baseConfig.primaryLabel = map.primaryLabel || "Target";
        baseConfig.secondaryLabel = map.secondaryLabel || "Collected";
        baseConfig.primaryColor = "#FF3B30"; // Red for target
        baseConfig.secondaryColor = "#22C55E"; // Green for collected
      }

      return baseConfig;
    });
  } catch (error) {
    console.error(
      "transformBusinessPerformanceData: Error transforming data",
      error
    );
    return [];
  }
};

/**
 * Transforms quarterly API data into chart configuration objects
 * @param apiData - Raw quarterly API response data
 * @returns Array of DonutGraphConfig objects
 */
export const transformQuarterlyBusinessPerformanceData = (
  apiData: any[]
): DonutGraphConfig[] => {
  if (!apiData || !Array.isArray(apiData)) {
    console.warn(
      "transformQuarterlyBusinessPerformanceData: Invalid API data provided"
    );
    return [];
  }

  try {
    return apiData.map((quarterData) => {
      if (!quarterData) {
        console.warn(
          `transformQuarterlyBusinessPerformanceData: Invalid quarter data`
        );
        return {
          subtitle: "Unknown Quarter",
          count: 0,
          target: 0,
          variant: "single",
        } as DonutGraphConfig;
      }

      return {
        subtitle: quarterData.quarter || "Unknown Quarter",
        count: quarterData.achieved ?? 0,
        target: quarterData.target ?? 0,
        variant: "single",
        brokerageAmount: quarterData.achieved ?? 0, // Using achieved as brokerage amount
      } as DonutGraphConfig;
    });
  } catch (error) {
    console.error(
      "transformQuarterlyBusinessPerformanceData: Error transforming data",
      error
    );
    return [];
  }
};

/**
 * Utility function to process master data from API
 * @param data - Raw API data
 * @returns Array of value-label objects
 */
export const masterUtility = (
  data: any
): { value: number; label: string }[] => {
  try {
    const masterArray = Array.isArray(data?.data?.data) ? data.data.data : [];
    return masterArray.map((item: { id: number; name: string }) => ({
      value: item.id,
      label: item.name,
    }));
  } catch (error) {
    console.error("masterUtility: Error processing master data", error);
    return [];
  }
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

/**
 * Generates a section title config for smart search
 * @param title - The title text to display
 * @returns FormFieldConfig object for the title
 */
export const generateSectionTitleConfig = (title: string): FormFieldConfig => {
  return {
    key: `smartSearch_${title.toLowerCase().replace(/\s+/g, "_")}`,
    name: `smartSearch_${title.toLowerCase().replace(/\s+/g, "_")}`,
    type: "title",
    label: title,
    componentProps: {
      isBold: true,
    },
  } as FormFieldConfig;
};


const DATE_POPPER_DETAILS = {
  disablePortal: false,
  placement: "bottom-start" as const,
  modifiers: [
    {
      name: "flip",
      enabled: true,
      options: { boundary: "viewport", padding: 8 },
    },
    {
      name: "preventOverflow",
      enabled: true,
      options: { boundary: "viewport", padding: 8 },
    },
  ],
};

export const businessPerformanceFilterConfig: FormFieldConfig[] = [
  // Organisation Section
  generateSectionTitleConfig("Organisation"),
  {
    key: "organisationId",
    name: "organisationId",
    label: "Organisation",
    type: "select",
    gridColumn: 3.2,
    apiDependencies: {
      endPoint: endPoints.masterOrganisation,
      utilityFunction: (data: any[]) => organisationUtility(data),
      clearFieldsOnChange: ["verticalId", "departmentId", "branchId", "sbuId"],
    },
  },
  {
    key: "sbuId",
    name: "sbuId",
    label: "SBU",
    type: "select",
    gridColumn: 3.2,
    apiDependencies: {
      endPoint: endPoints.sbuByOrg,
      dependentField: "organisationId",
      clearFieldsOnChange: ["verticalId", "departmentId"],
      utilityFunction: (data: any[]) => masterUtility(data),
    },
  },
  {
    key: "verticalId",
    name: "verticalId",
    label: "Vertical",
    type: "multiselect",
    gridColumn: 3.2,
    apiDependencies: {
      endPoint: endPoints.verticalsBySbu,
      utilityFunction: (data: any[]) => masterUtility(data),
      dependentField: "sbuId",
      clearFieldsOnChange: ["departmentId"],
      // keep labels so the applied-filters summary reads names, not raw ids
      storeSelectedOption: true,
    },
  },
  {
    key: "departmentId",
    name: "departmentId",
    label: "Department",
    type: "select",
    gridColumn: 3.2,
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
    type: "multiselect",
    gridColumn: 3.2,
    apiDependencies: {
      endPoint: endPoints.branchesByOrg,
      utilityFunction: (data: any[]) => masterUtility(data),
      dependentField: "organisationId",
      // keep labels so the applied-filters summary reads names, not raw ids
      storeSelectedOption: true,
    },
  },
  {
    key: "userId",
    name: "userId",
    label: "Owner",
    type: "treeSelect",
    gridColumn: 6.4,
    apiDependencies: hierarchyField.apiDependencies,
    componentProps: {
      ...hierarchyField.componentProps,
      controlledSearchInput: false,
    },
  },
  {
    key: "owner",
    name: "owner",
    label: "View by",
    type: "segmentedcontrol",
    componentProps: {
      fullWidth: true,
      variantType: "primary",
      shouldClearValue: true,
    },
    gridColumn: 4,
    options: [
      { value: "manager", label: "Manager" },
      { value: "team", label: "Manager + Team" },
    ],
  },
  {
    key: "incomeType",
    name: "incomeType",
    label: "Income Type",
    type: "select",
    gridColumn: 3.2,
    options: [
      { value: ALL_VALUE, label: "All" },
      { value: "policy", label: "Policy" },
      { value: "endorsement", label: "Endorsement" },
    ],
  },
  {
    key: "insurerId",
    name: "insurerId",
    label: "Insurer",
    type: "selectFieldByApi",
    gridColumn: 3.2,
    apiDependencies: {
      endPoint: endPoints.insurersList,
      utilityFunction: insurerListUtilityFunction,
    },
  },

  // Period Section
  generateSectionTitleConfig("Period"),
  {
    key: "financialYear",
    name: "financialYear",
    label: "Financial Year",
    type: "select",
    gridColumn: 3.2,
    apiDependencies: {
      utilityFunction: generateYearOptions,
      clearFieldsOnChange: ["from", "to"],
    },
  },
  {
    key: "quarter",
    name: "quarter",
    label: "Quarter",
    type: "select",
    gridColumn: 3.2,
    apiDependencies: {
      clearFieldsOnChange: ["month", "from", "to"],
      utilityFunction: () => {
        return [
          { value: ALL_VALUE, label: "All" },
          { value: "Q1", label: "Q1" },
          { value: "Q2", label: "Q2" },
          { value: "Q3", label: "Q3" },
          { value: "Q4", label: "Q4" },
        ];
      },
    },
  },
  {
    key: "month",
    name: "month",
    label: "Month",
    type: "select",
    options: [],
    apiDependencies: {
      utilityDependent: "quarter",
      utilityFunction: (data: any) => getMonthsForQuarterInSmarSearch(data),
      clearFieldsOnChange: ["from", "to"],
    },
    gridColumn: 3.2,
  },
  {
    key: "from",
    name: "from",
    label: "From date (Applied on date of income)",
    type: "date",
    gridColumn: 3.2,
    componentProps: {
      fullWidth: true,
      placeholder: "Select from date",
      popperDetails: DATE_POPPER_DETAILS,
    },
    apiDependencies: {
      clearFieldsOnChange: ["financialYear", "quarter", "month"],
    },
  },
  {
    key: "to",
    name: "to",
    label: "To date (Applied on date of income)",
    type: "date",
    gridColumn: 3.2,
    componentProps: {
      fullWidth: true,
      placeholder: "Select to date",
      popperDetails: DATE_POPPER_DETAILS,
    },
    apiDependencies: {
      clearFieldsOnChange: ["financialYear", "quarter", "month"],
    },
  }
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

export const PERIOD_MODE_INCOME = "incomeMonth";
export const PERIOD_MODE_BUSINESS = "businessMonth";

/**
 * Business month filter (month-name dropdown). Applied only to the dashboard
 * widgets that support it (renewal scheduled by SBU, endorsement TAT by SBU,
 * brokerage to collect, policy type distribution) — appended to a dashboard-only
 * config so it does not leak into other consumers of businessPerformanceFilterConfig.
 */
export const businessMonthField = (): FormFieldConfig => ({
  key: "businessMonth",
  name: "businessMonth",
  label: "Business month",
  type: "select",
  gridColumn: 3.2,
  // The from/to date fields on the same row have two-line labels, so bottom-align
  // this single-line-label field to keep its input on the same line as theirs.
  gridItemSx: { alignSelf: "flex-end" },
  componentProps: {
    fullWidth: true,
  },
  placeholder: "Select month",
  apiDependencies: {
    utilityFunction: getAllMonths,
  },
});

export const bizDownDefaultValues = {
  organisationId: "",
  sbuId: "",
  verticalId: [] as any[],
  departmentId: "",
  branchId: [] as any[],
  financialYear: "",
  quarter: "",
  month: "",
  from: "",
  to: "",
  userId: "",
  owner: "",
  incomeType: "",
};
