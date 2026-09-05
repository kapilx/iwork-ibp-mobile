import {
  formatDateTime,
  formatNumberByLocalization,
  formatNumberShort,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";

export const CDDetails = [
  {
    sectionTitle: "Account details",
    fields: [
      { label: "CD account number", key: "cdAccountNumber" },
      { label: "Company", key: "companyName" },
       { label: "Insurer", key: "insurerName" },
      // { label: "Policy number", key: "policyNumber" },
       {
        label: "Total credit",
        key: "totalCredit",

        getFormattedValue: (item: { totalCredit?: number }): string => {
          if (
            item?.totalCredit === undefined ||
            item?.totalCredit === null
          ) {
            return "--";
          }
          return formatNumberShort(item?.totalCredit);
        },
      },
       {
        label: "Total debit",
        key: "totalDebit",

        getFormattedValue: (item: { totalDebit?: number }): string => {
          if (
            item?.totalDebit === undefined ||
            item?.totalDebit === null
          ) {
            return "--";
          }
          return formatNumberShort(item?.totalDebit);
        },
      },
      {
        label: "Total balance",
        key: "balanceAmount",

        getFormattedValue: (item: { balanceAmount?: number }): string => {
          if (
            item?.balanceAmount === undefined ||
            item?.balanceAmount === null
          ) {
            return "--";
          }
          return formatNumberShort(item?.balanceAmount);
        },
      },
      {
        label: "Minimum balance (20% of Premium in the Policy)",
        key: "minimumBalance",
        getFormattedValue: (item: { minimumBalance?: number }): string => {
          if (
            item?.minimumBalance === undefined ||
            item?.minimumBalance === null
          ) {
            return "--";
          }
          return formatNumberShort(item?.minimumBalance);
        },
      },
      { label: "Status", key: "status" },
      { label: "Remarks", key: "remarks" },
    ],
  },
];

export const CDAccountTransaction: ColDef[] = [
  {
    headerName: "Transaction date",
    field: "transactionDate",
    headerTooltip: "Transaction date",
   valueFormatter: ({ value }) =>
         value !== null && value !== undefined ? formatDateTime(value) : "--",
    tooltipValueGetter: ({ value }) =>
         value !== null && value !== undefined ? formatDateTime(value) : "--",
    pinned: "left",
  },
    {
    headerName: "Transaction type",
    field: "type",
    headerTooltip: "Type",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    width: 150,
    pinned: "left",
  },
  {
    headerName: "Transaction/cheque number",
    field: "neftRtgsNumber",
    headerTooltip: "Transaction/cheque number",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    pinned: "left",
    sortable: false,
  },
   {
    headerName: "Credit amount",
    field: "creditAmount",
    headerTooltip: "Credit amount",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatNumberShort(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    cellStyle: { color: "green" },
    width: 150,
    sortable: false,
  },
   {
    headerName: "Debit amount",
    field: "debitAmount",
    headerTooltip: "Debit amount",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatNumberShort(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    cellStyle: { color: "red" },
    width: 150,
    sortable: false,
  },
  {
    headerName: "Total balance",
    field: "balance",
    headerTooltip: "Total balance",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatNumberShort(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    width: 150,
  },
   {
    headerName: "Intake type",
    field: "endorsementType",
    headerTooltip: "Intake type",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Intake number",
    field: "endorsementNumber",
    headerTooltip: "Intake number",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Transaction mode",
    field: "description",
    headerTooltip: "Transaction mode",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Transaction remarks",
    field: "neftRtgsRemark",
    headerTooltip: "Transaction remarks",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "IIRM policy number",
    field: "policyId",
    headerTooltip: "IIRM policy number",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    width: 150,
   cellClass: "clickable-cell",
  },
  {
    headerName: "Insurer policy number",
    field: "policyInsurerNumber",
    headerTooltip: "Insurer policy number",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    width: 150,
    cellClass: "clickable-cell",
  },
  {
    headerName: "Policy type",
    field: "policyType",
    headerTooltip: "Policy type",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Creation date",
    field: "createdAt",
    headerTooltip: "Creation date",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatDateTime(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? formatDateTime(value) : "--",
  },
   {
    headerName: "Created by",
    field: "createdBy",
    headerTooltip: "Created by",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    sortable: false,
  },
];

export const CDDetailsBreadcrumbs = [
  { label: "CD management", path: "/cd-management" },
  { label: "Cash deposit statement" },
];
