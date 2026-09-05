import { ColDef } from "ag-grid-community";
import { formatDate } from "@ui/ui-lib";

export const clientSpocColumns: ColDef[] = [
  {
    headerName: "Name",
    field: "name",
    flex: 2,
    tooltipField: "name",
    valueFormatter: ({ value }) => value ?? "--",
    sortable: false,
  },
  {
    headerName: "Email Address",
    field: "email",
    flex: 2,
    tooltipField: "email",
    valueFormatter: ({ value }) => value ?? "--",
    sortable: false,
  },
  {
    headerName: "Phone Number",
    field: "phoneNumber",
    flex: 1,
    tooltipField: "phoneNumber",
    valueFormatter: ({ value }) => value ?? "--",
    sortable: false,
  },
  {
    headerName: "Role",
    field: "role",
    flex: 1,
    tooltipField: "role",
    valueFormatter: ({ value }) => value ?? "--",
    sortable: false,
  },
];

export const premiumReceiptsColumns: ColDef[] = [
  {
    headerName: "PR Mapped",
    field: "prMapped",
    flex: 1,
    tooltipField: "prMapped",
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "PR ID",
    field: "prId",
    flex: 1,
    tooltipField: "prId",
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "PR Name",
    field: "prName",
    flex: 2,
    tooltipField: "prName",
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "PR Brokerage",
    field: "prBrokerage",
    flex: 1,
    tooltipField: "prBrokerage",
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "PR Premium",
    field: "prPremium",
    flex: 1,
    tooltipField: "prPremium",
    valueFormatter: ({ value }) => value ?? "--",
  },
];

export const commissionStatementsColumns: ColDef[] = [
  {
    headerName: "CS Mapped",
    field: "commissionStatementMapped",
    flex: 1,
    tooltipField: "commissionStatementMapped",
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "CS ID",
    field: "commissionStatementId",
    flex: 1,
    tooltipField: "commissionStatementId",
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "CS Name",
    field: "commissionStatementName",
    flex: 2,
    tooltipField: "commissionStatementName",
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "CS Brokerage",
    field: "commissionStatementBrokerage",
    flex: 1,
    tooltipField: "commissionStatementBrokerage",
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "CS Premium",
    field: "commissionStatementPremium",
    flex: 1,
    tooltipField: "commissionStatementPremium",
    valueFormatter: ({ value }) => value ?? "--",
  },
];

export const invoicesColumns: ColDef[] = [
  {
    headerName: "Invoiced",
    field: "invoiced",
    flex: 1,
    tooltipField: "invoiced",
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "Invoice Number",
    field: "invoiceNumber",
    flex: 1,
    tooltipField: "invoiceNumber",
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "Invoice Date",
    field: "invoiceDate",
    flex: 1,
    valueFormatter: ({ value }) => (value ? formatDate(value) : "--"),
    tooltipValueGetter: ({ value }) => (value ? formatDate(value) : "--"),
  },
  {
    headerName: "Invoiced Brokerage",
    field: "invoicedBrokerage",
    flex: 1,
    tooltipField: "invoicedBrokerage",
    valueFormatter: ({ value }) => value ?? "--",
  },
];

export const collectionsColumns: ColDef[] = [
  {
    headerName: "Collected",
    field: "collected",
    flex: 1,
    tooltipField: "collected",
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "UTR Number",
    field: "utrNumber",
    flex: 1,
    tooltipField: "utrNumber",
    valueFormatter: ({ value }) => value ?? "--",
  },
  {
    headerName: "UTR Date",
    field: "utrDate",
    flex: 1,
    valueFormatter: ({ value }) => (value ? formatDate(value) : "--"),
    tooltipValueGetter: ({ value }) => (value ? formatDate(value) : "--"),
  },
  {
    headerName: "Collected Amount",
    field: "collectedAmount",
    flex: 1,
    tooltipField: "collectedAmount",
    valueFormatter: ({ value }) => value ?? "--",
  },
];
