import {
  convertToTreeData,
  endPoints,
  FormFieldConfig,
  getCurrentFinancialYearDefault,
  getAllMonths,
  getMonthsForQuarter,
  masterDataUtilityFunction,
  requiredErrorMessage,
} from "@ui/ui-lib";
import { generateYearOptions } from "@ui/ui-lib";
import { masterUtility } from "../components/BusinessPerformance/businessPerformanceConfig";
import { organisationUtility } from "../pages/OpportunitiesPage/OpportunitiesListing/tableConfig";
import dayjs from "dayjs";
import { max } from "date-fns";

export const periodConfig = (
  isDisable: boolean = false,
  fromDate: string = "",
  toDate: string = ""
) => [
  {
    key: "financialYear",
    name: "financialYear",
    label: "Financial Year",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
      disabled: isDisable,
    },
    placeholder: "Select financial year",
    apiDependencies: {
      clearFieldsOnChange: ["period"],
      clerFieldsWhenCurrValueEmpty: ["month", "from", "to"],
      utilityFunction: generateYearOptions,
    },
  },
  {
    key: "period",
    name: "period",
    label: "Period",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
      placeholder: "Select period",
      disabled: isDisable,
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("POLICY_DURATION"),
      clearFieldsOnChange: ["financialYear", "month"],
      clerFieldsWhenCurrValueEmpty: ["from", "to"],
      isSmartSearch: true,
    },
    placeholder: "Search",
  },
  {
    key: "month",
    name: "month",
    label: "Month",
    type: "select",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
      disabled: isDisable,
    },
    placeholder: "Select month",
    apiDependencies: {
      clearFieldsOnChange: ["period"],
      utilityFunction: getAllMonths,
    },
  },
  {
    key: "from",
    name: "from",
    label: "From date",
    type: "date",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
      placeholder: "Select from date",
      disabled: isDisable,
      maxDate: toDate ? dayjs(toDate) : undefined,
    },
    apiDependencies: {
      clearFieldsOnChange: ["financialYear", "period", "month"],
    },
  },
  {
    key: "to",
    name: "to",
    label: "To date",
    type: "date",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
      placeholder: "Select to date",
      disabled: isDisable,
      minDate: fromDate ? dayjs(fromDate) : undefined,
    },
    apiDependencies: {
      clearFieldsOnChange: ["financialYear", "period", "month"],
    },
  },
];

export const CommonFieldsconfig: FormFieldConfig[] = [
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
      clearFieldsOnChange: ["verticalId", "sbuId", "branchId"],
    },
  },
  {
    key: "sbuId",
    name: "sbuId",
    label: "SBU",
    type: "select",
    gridColumn: 2.9,
    placeholder: "Select SBU",
    apiDependencies: {
      endPoint: endPoints.sbuByOrg,
      dependentField: "organisationId",
      clearFieldsOnChange: ["verticalId", "departmentId"],
      utilityFunction: masterDataUtilityFunction,
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "verticalId",
    name: "verticalId",
    label: "Vertical",
    type: "multiselect",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
    },
    placeholder: "Select vertical",
    apiDependencies: {
      endPoint: endPoints.verticalsBySbu,
      utilityFunction: (data: any[]) => masterUtility(data),
      dependentField: "sbuId",
      // keep labels so the applied-filters summary reads names, not raw ids
      storeSelectedOption: true,
    },
  },
  {
    key: "branchId",
    name: "branchId",
    label: "Branch",
    type: "multiselect",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
    },
    placeholder: "Select branch",
    apiDependencies: {
      endPoint: endPoints.branchesByOrg,
      utilityFunction: (data: any[]) => masterUtility(data),
      dependentField: "organisationId",
      // keep labels so the applied-filters summary reads names, not raw ids
      storeSelectedOption: true,
    },
  },
  {
    key: "ownerId",
    name: "ownerId",
    label: "Owner",
    gridColumn: 5.8,
    type: "treeSelect",
    apiDependencies: {
      endPoint: endPoints.employeeHirarcy,
      utilityFunction: convertToTreeData,
      // clearFieldsOnChange: ["viewBy"],
    },
    componentProps: {
      fullWidth: true,
    },
  },

  {
    key: "viewBy",
    name: "viewBy",
    type: "segmentedcontrol",
    label: "View by",
    gridColumn: 2.9,
    componentProps: {
      fullWidth: true,
      variantType: "primary",
      shouldClearValue: true,
    },
    // apiDependencies: {
    //   endPoint: endPoints.lookUpByName("TOGGLE_TYPE"),
    // },
    options: [
      { value: "manager", label: "Manager" },
      { value: "team", label: "Manager + Team" },
    ],
  },
];
export const periodDefaultValues = {
  financialYear: getCurrentFinancialYearDefault(),
  period: "",
  month: "",
  from: "",
  to: "",
};

export const commonFieldsDefaultValues = {
  organisationId: "",
  sbuId: "",
  verticalId: [],
  branchId: [],
  ownerId: "",
  viewBy: "",
};

export const smartSearchDefaultValues = {
  ...commonFieldsDefaultValues,
  ...periodDefaultValues,
};

export const GeneratesmartSearchTitleConfig = (title: string) => {
  return {
    key: `smartSearch_${title.toLowerCase()}`,
    name: `smartSearch_${title.toLowerCase()}`,
    type: "title",
    label: title,
    componentProps: {
      isBold: true,
    },
  };
};

export const smartSearchConfig: any = [
  GeneratesmartSearchTitleConfig("Organisation"),
  ...CommonFieldsconfig,
];
