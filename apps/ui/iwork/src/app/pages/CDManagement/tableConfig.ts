import {
  formatCurrencyByLocalization,
  formatNumberByLocalization,
  formatNumberShort,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { FormFieldConfig } from "@ui/ui-lib/commonComponents/FormComponent/types";

export const cdManagementSearchConfig: FormFieldConfig[] = [
  {
    key: "companyNameText",
    name: "companyNameText",
    label: "Company",
    type: "text",
    gridColumn: 5,
    componentProps:{
      fullWidth: true,
      placeholder: "Search by company name",
    }
  },
  {
    key: "insurerName",
    name: "insurerName",
    label: "Insurer name",
    type: "text",
    gridColumn: 5,
    componentProps:{
      fullWidth: true,
      placeholder: "Search by insurer name",
    }
  },
  {
    key: "policyInsurerNumber",
    name: "policyInsurerNumber",
    label: "Insurer policy number",
    type: "text",
    gridColumn: 5,
    componentProps:{
      fullWidth: true,
      placeholder: "Search by insurer policy number",
    }
  },
  {
    key: "iirmPolicyId",
    name: "iirmPolicyId",
    label: "IIRM policy ID",
    type: "text",
    gridColumn: 5,
    componentProps:{
      fullWidth: true,
      placeholder: "Search by IIRM policy ID",
    }
  },
  {
    key: "cdAccountNumber",
    name: "cdAccountNumber",
    label: "CD account number",
    type: "text",
    gridColumn: 5,
    componentProps:{
      fullWidth: true,
      placeholder: "Search by CD account number",
    }
  },
  {
    key: "cdAccountStatus",
    name: "cdAccountStatus",
    label: "Status",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.lookUpByName("CD_ACCOUNT_STATUS"),
      isSmartSearch: true,
    },
    placeholder: "Select status",
  },
];

export const cdManagementSearchDefaultValues = {
  companyNameText: "",
  policyInsurerNumber: "",
  iirmPolicyId: "",
  cdAccountNumber: "",
  cdAccountStatus: "",
  insurerName: "",
};

export const columnDefs: ColDef[] = [
  {
    headerName: "Company",
    field: "companyName",
    tooltipField: "companyName",
    headerTooltip: "Company",
    cellClass: "clickable-cell",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    pinned: "left",
    sortable: false,
  },
  {
    headerName: "Insurer name",
    field: "insurerName",
    tooltipField: "insurerName",
    headerTooltip: "Insurer name",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    pinned: "left",
    sortable: false,
  },
  {
    headerName: "CD account number",
    field: "cdAccount",
    tooltipField: "cdAccount",
    headerTooltip: "CD account number",
    cellClass: "clickable-cell",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    pinned: "left",
    sortable: false,
  },
  {
    headerName: "Insurer policy number",
    field: "policyInsurerNumber",
    tooltipField: "policyInsurerNumber",
    headerTooltip: "Insurer policy number",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    width: 150,
    cellClass: "clickable-cell",
    sortable: false,
  },
  {
    headerName: "Total credit",
    field: "totalCredit",
    headerTooltip: "Total credit",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatNumberShort(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    width: 150,
    sortable: false,
    cellStyle: { color: "green" },
  },
  {
    headerName: "Total debit",
    field: "totalDebit",
    headerTooltip: "Total debit",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatNumberShort(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    width: 150,
    sortable: false,
    cellStyle: { color: "red" },
  },
  {
    headerName: "IIRM policy number",
    field: "policyId",
    tooltipField: "policyId",
    headerTooltip: "IIRM policy number",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    width: 150,
    cellClass: "clickable-cell",
    sortable: false,
  },
  {
    headerName: "Total balance",
    field: "amount",
    headerTooltip: "Total balance",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatNumberShort(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    width: 150,
    sortable: false,
  },
  {
    headerName: "Min. balance",
    field: "minimumBalance",
    headerTooltip: "Minimum balance",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatNumberShort(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    width: 150,
    sortable: false,
  },
  {
    headerName: "Status",
    field: "status",
    tooltipField: "status",
    headerTooltip: "Status",
    valueGetter: (params) => params.data.status?.lookUpValue ?? "--",
    tooltipValueGetter: (params) => params.data.status?.lookUpValue ?? "--",
    width: 110,
    sortable: false,
  },
  // {
  //   headerName: "Alert",
  //   field: "alert",
  //   tooltipField: "alert",
  //   headerTooltip: "Alert",
  //   valueFormatter: ({ value }) =>
  //     value !== null && value !== undefined ? value : "--",
  //   width: 110,
  // },
  {
    headerName: "Actions",
    field: "actions",
    tooltipField: "actions",
    headerTooltip: "Actions",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellRenderer: "ActionButton",
    cellRendererParams: {
      nameField: "displayName",
      subTextField: "industrySegment",
      colorKey: "colorKey",
    },
    minWidth: 150,
    sortable: false,
    flex: 1,
  },
];
