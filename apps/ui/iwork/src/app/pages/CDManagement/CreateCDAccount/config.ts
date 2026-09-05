import {
  endPoints,
  formatCurrencyByLocalization,
  formatNumberShort,
  requiredErrorMessage,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";

export const companyUtilityFunction = (data: any) => {
  return data.data.data.map((company: any) => ({
    value: company.companyId,
    label: company.displayName,
  }));
};
export const insurerListUtilityFunction = (data: any) => {
  return data?.data?.data?.map(
    (item: { insurerId: string; insurerName: string }) => ({
      value: item.insurerId,
      label: item.insurerName,
    })
  );
};

export const lookupUtilityFunction = (data: any) => {
  return data?.data?.map(
    (item: { id: number; lookUpValue: string }) => ({
      value: item.id,
      label: item.lookUpValue,
    })
  );
};

// Fields before the policy table
export const CreateCDBalanceConfigPart1 = (
  ownerId: number,
  isMergeCDAccountsEnabled = false,
) => [
  {
    key: "action_lid",
    name: "action_lid",
    label: "Action",
    gridColumn: 5,
    type: "selectFieldByApi",
    componentProps: { fullWidth: true },
    apiDependencies: {
      endPoint: endPoints.lookUpByName("CD_ACCOUNT_ACTIONS"),
      utilityFunction: (data: any) => {
        const options = lookupUtilityFunction(data);
        if (isMergeCDAccountsEnabled) return options;
        return options.filter(
          (opt: { label: string }) =>
            !opt.label?.includes("Merge CD Accounts"),
        );
      },
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Action"),
      },
    },
  },
  {
    key: "companyId",
    name: "companyId",
    label: "Company name",
    type: "selectFieldByApi",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    apiDependencies: {
      endPoint: endPoints.companiesHierarchy,
      utilityFunction: companyUtilityFunction,
      clearFieldsOnChange: ["insurerId"],
      customParams: { viewBy: "team" },
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Company"),
      },
    },
  },
  {
    key: "insurerId",
    name: "insurerId",
    type: "selectFieldByApi",
    label: "Insurer",
    gridColumn: 5,
    componentProps: {
      fullWidth: true,
    },
    apiDependencies: {
      endPoint: endPoints.insurersByCompany,
      dependentField: "companyId",
      utilityFunction: insurerListUtilityFunction,
      // customParams: { searchBy: "firstName" },
    },
    rules: {
      required: {
        value: true,
        message: "Please select an insurer.",
      },
    },
  },
];

// Fields after the policy table
export const CreateCDBalanceConfigPart2 = (ownerId: number) => [
  {
    key: "accountCreationOption",
    name: "accountCreationOption",
    label: "Account creation option",
    gridColumn: 12,
    type: "radiogroup",
    options: [
      { value: "existingAccountOnly", label: "Existing Account Only" },
      {
        value: "createNewAccount",
        label: "Create New Account",
      },
    ],
    componentProps: {
      fullWidth: true,
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Account Creation Option is required"),
      },
    },
  },
  {
    key: "cdAccountNumber",
    name: "cdAccountNumber",
    label: "CD account number",
    gridColumn: 5,
    type: "select",
    showField: (watch) => watch("accountCreationOption") === "existingAccountOnly",
    componentProps: { fullWidth: true },
    options: [],
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("CD Account Number"),
      },
    },
  },
  {
    key: "cdAccountNumber",
    name: "cdAccountNumber",
    label: "CD account number",
    gridColumn: 5,
    type: "text",
    showField: (watch) => watch("accountCreationOption") === "createNewAccount",
    componentProps: { fullWidth: true },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("CD Account Number"),
      },
    },
  },
  {
    key: "cdAccountName",
    name: "cdAccountName",
    label: "CD account name",
    gridColumn: 5,
    type: "text",
    showField: (watch) => watch("accountCreationOption") === "existingAccountOnly",
    componentProps: { 
      fullWidth: true,
      disabled: true,
    },
  },
  {
    key: "cdAccountName",
    name: "cdAccountName",
    label: "CD account name",
    gridColumn: 5,
    type: "text",
    showField: (watch) => watch("accountCreationOption") === "createNewAccount",
    componentProps: { 
      fullWidth: true,
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("CD Account Name"),
      },
    },
  },
  {
    key: "cdSafeLimit",
    name: "cdSafeLimit",
    label: "CD safe limit %",
    gridColumn: 5,
    type: "number",
    isDecimal: true,
    formatNumber: true,
    showField: (watch) => watch("accountCreationOption") === "existingAccountOnly",
    componentProps: {
      fullWidth: true,
      disabled: true,
    },
  },
  {
    key: "cdSafeLimit",
    name: "cdSafeLimit",
    label: "CD safe limit %",
    gridColumn: 5,
    type: "number",
    isDecimal: true,
    formatNumber: true,
    showField: (watch) => watch("accountCreationOption") === "createNewAccount",
    componentProps: {
      fullWidth: true,
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("CD Safe Limit %"),
      },
      min: {
        value: 0,
        message: "CD Safe Limit percentage cannot be negative",
       },
      max: {
        value: 100,
        message: "CD Safe Limit percentage cannot exceed 100",
      },
    },
  },
  // {
  //   key: "accountCreationOption",
  //   name: "accountCreationOption",
  //   label: "Account creation option",
  //   gridColumn: 9,
  //   type: "radiogroup",
  //   options: [
  //     { value: "createAccountOnly", label: "Create Account Only" },
  //     {
  //       value: "withOpeningBalance",
  //       label: "Create Account with Opening Balance",
  //     },
  //   ],
  //   componentProps: {
  //     fullWidth: true,
  //   },
  //   rules: {
  //     required: {
  //       value: true,
  //       message: requiredErrorMessage("Account Creation Option is required"),
  //     },
  //   },
  // },

  {
    key: "balanceAmount",
    name: "balanceAmount",
    label: "Opening balance amount",
    gridColumn: 4.9,
    formatNumber: true,
    type: "number",
    showField: (watch) =>
      watch("accountCreationOption") === "withOpeningBalance",
    componentProps: {
      type: "number",
      fullWidth: true,
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Opening Balance Amount"),
      },
    },
  },
  {
    key: "referenceType",
    name: "referenceType",
    label: "Mode of payment ",
    gridColumn: 4.9,
    type: "select",
    showField: (watch) =>
      watch("accountCreationOption") === "withOpeningBalance",
    componentProps: {
      fullWidth: true,
    },
    apiDependencies: {
      endPoint: endPoints.lookUpByName(`TRANSACTION_TYPE`),
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Mode of Payment"),
      },
    },
  },
  {
    key: "transactionReferenceId",
    name: "transactionReferenceId",
    label: "Transaction/Cheque number",
    gridColumn: 4.9,
    type: "text",
    showField: (watch) =>
      watch("accountCreationOption") === "withOpeningBalance",
    componentProps: {
      fullWidth: true,
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Transaction Number"),
      },
    },
  },
  {
    key: "chequeDate",
    name: "chequeDate",
    label: "Transaction/Cheque date",
    gridColumn: 4.9,
    type: "date",
    showField: (watch) =>
      watch("accountCreationOption") === "withOpeningBalance",
    componentProps: {
      fullWidth: true,
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Transaction Date"),
      },
    },
  },
];

// Full config (for backward compatibility if needed)
export const CreateCDBalanceConfig = (ownerId: number) => [
  ...CreateCDBalanceConfigPart1(ownerId),
  ...CreateCDBalanceConfigPart2(ownerId),
];

export const CreateCDBalanceDefaultValues = {
  action_lid: null,
  companyId: null,
  insurerId: null,
  policyIds: [],
  cdAccountNumber: "",
  cdAccountName: "",
  cdSafeLimit: null,
  cautionDepositId: null,
  accountCreationOption: "",
  balanceAmount: "",
  referenceType: "",
  transactionReferenceId: "",
  chequeDate: null,
};
export const createCDAccountBreadcrumbs = [
  { label: "CD management", path: "/cd-management" },
  { label: "Create CD account" },
];

export interface PolicyData {
  policyId: number;
  policyNumber: string | null;
  policyType: string | null;
  policyPremium: number | null;
  hasCautionDeposit: boolean;
  cautionDepositId: number | null;
  cdAccountNumber: string | null;
  cdAccountName: string | null;
  cdBalanceAmount: number | null;
  cdSafeLimit: number | null;
  cdStatus: string | null;
  transactionCount?: number;
}

export const getPolicyColumns = (): ColDef<PolicyData>[] => [
  {
    headerName: "Policy Type",
    field: "policyType",
    sortable: false,
    flex: 1,
    minWidth: 180,
  },
  {
    headerName: "Policy Number",
    field: "policyNumber",
    sortable: false,
    flex: 1,
    minWidth: 180,
  },
  {
    headerName: "Policy Premium",
    field: "policyPremium",
    sortable: false,
    flex: 1,
    minWidth: 150,
    valueFormatter: (params) =>
      params.value !== null && params.value !== undefined
        ? formatNumberShort(params.value)
        : "--",
  },
  {
    headerName: "CD Account Number",
    field: "cdAccountNumber",
    sortable: false,
    flex: 1,
    minWidth: 150,
    valueFormatter: (params) =>
      params.value !== null && params.value !== undefined
        ? params.value
        : "--",
    tooltipValueGetter: (params) =>
      params.value !== null && params.value !== undefined
        ? params.value
        : "--",
  },
  {
    headerName: "CD Account Name",
    field: "cdAccountName",
    sortable: false,
    flex: 1,
    minWidth: 150,
    valueFormatter: (params) =>
      params.value !== null && params.value !== undefined
        ? params.value
        : "--",
    tooltipValueGetter: (params) =>
      params.value !== null && params.value !== undefined
        ? params.value
        : "--",  
      }
];

export interface MergeCDAccountData {
  cdAccountNumber: string;
  cdAccountName: string | null;
  cautionDepositId: number | null;
  policies: PolicyData[];
  balance: number;
  policyNumbers: string[];
  transactionCount?: number;
}

export const getMergeCDColumns = (): ColDef<MergeCDAccountData>[] => [
  {
    headerName: "Source",
    field: "cdAccountNumber",
    sortable: false,
    width: 100,
    // Cell renderer will be added in component
  },
  {
    headerName: "Target",
    field: "cdAccountNumber",
    sortable: false,
    width: 100,
    // Cell renderer will be added in component
  },
  {
    headerName: "CD Account Number",
    field: "cdAccountNumber",
    sortable: false,
    flex: 1,
    minWidth: 180,
  },
  {
    headerName: "CD Account Name",
    field: "cdAccountName",
    sortable: false,
    flex: 1,
    minWidth: 180,
    valueFormatter: (params) =>
      params.value !== null && params.value !== undefined ? params.value : "--",
  },
  {
    headerName: "Balance",
    field: "balance",
    sortable: false,
    flex: 1,
    minWidth: 150,
    valueFormatter: (params) =>
      params.value !== null && params.value !== undefined
        ? formatCurrencyByLocalization(params.value, undefined, 2)
        : "--",
  },
  {
    headerName: "Mapped Policies",
    field: "policyNumbers",
    sortable: false,
    flex: 2,
    minWidth: 250,
    cellRenderer: (params: any) => {
      if (!params.value || params.value.length === 0) return '--';
      return params.value.join(', ');
    },
  },
  {
    headerName: "Policy IDs",
    field: "policies",
    sortable: false,
    flex: 1,
    minWidth: 180,
    cellRenderer: (params: any) => {
      const policies: PolicyData[] = params.value;
      if (!policies || policies.length === 0) return '--';
      return policies.map((p) => p.policyId).join(', ');
    },
    tooltipValueGetter: (params: any) => {
      const policies: PolicyData[] = params.value;
      if (!policies || policies.length === 0) return '--';
      return policies.map((p) => p.policyId).join(', ');
    },
  },
];
