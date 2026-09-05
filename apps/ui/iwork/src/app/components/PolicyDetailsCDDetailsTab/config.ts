import { ColDef } from "ag-grid-community";
import { formatDateTime } from "@ui/ui-lib/utils/DateFormat";
import {
  colors,
  formatCurrencyByLocalization,
  LocalizationConfig,
} from "@ui/ui-lib";

export const priorityStyleMap = {
  credit: {
    backgroundColor: colors.gradients.teal.end,
    color: colors.gradients.teal.text,
  },
  debit: {
    backgroundColor: colors.gradients.red.end,
    color: colors.gradients.red.text,
  },
};

export const cdDetailsColumns = (
  localization?: LocalizationConfig
): ColDef[] => [
  // {
  //   headerName: "Account number",
  //   field: "cdAccountNumber",
  //   headerTooltip: "Account number",
  //   valueFormatter: ({ value }) =>
  //     value !== null && value !== undefined ? value : "--",
  //   tooltipValueGetter: ({ value }) =>
  //     value !== null && value !== undefined ? value : "--",
  //   // cellRenderer: "BalanceAmountRenderer",
  //   hide: false,
  //   pinned: "left",
  // },

  {
    headerName: "Transaction date",
    field: "transactionDate",
    headerTooltip: "Transaction date",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatDateTime(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? formatDateTime(value) : "--",
    hide: false,
    pinned: "left",
    disableSort: true,
  },
  {
    headerName: "Transaction type",
    field: "transactionType",
    tooltipField: "transactionType",
    headerTooltip: "Transaction type",
    cellRenderer: "ChipRenderer",
    cellRendererParams: {
      styleMap: priorityStyleMap,
      variant: "withDot",
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    pinned: "left",
    disableSort: true,
  },
  {
    headerName: "Transaction amount",
    field: "transactionAmount",
    headerTooltip: "Transaction amount",
    tooltipField: "transactionAmount",
    valueFormatter: ({ value, data }) => {
      const premium =
        value != null
          ? formatCurrencyByLocalization(value, localization)
          : "--";
      return `${premium}`;
    },

    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: false,
    pinned: "left",
    disableSort: true,
  },
  {
    headerName: "Transaction details",
    field: "transactionDescription",
    headerTooltip: "Transaction description",
    tooltipField: "transactionDescription",
    minWidth: 350,
    cellRenderer: "TransationDetailsRenderer",
    hide: false,
    disableSort: true,
  },
  {
    headerName: "Transaction number",
    field: "chequeNumber",
    headerTooltip: "Transaction number",
    tooltipField: "chequeNumber",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    disableSort: true,
  },
  {
    headerName: "Transaction by",
    field: "createdBy",
    headerTooltip: "Transaction by",
    tooltipField: "createdBy",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    hide: false,
    disableSort: true,
  },
  {
    headerName: "Balance",
    field: "balanceAmount",
    headerTooltip: "Balance",
    tooltipField: "balanceAmount",
    // flex: 1,
    valueFormatter: ({ value, data }) => {
      const premium =
        value != null
          ? formatCurrencyByLocalization(value, localization)
          : "--";
      return `${premium}`;
    },

    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    hide: false,
    disableSort: true,
  },
];

export const cdDetailsFormConfig = {
  key: "accountBasicDetails",
  title: "",
  config: [
    {
      key: "accountNumber",
      name: "accountNumber",
      type: "text",
      label: "Account Number",
      gridColumn: 9,
      rules: {
        required: {
          value: true,
          message: "Account Number is required.",
        },
      },
      componentProps: {
        fullWidth: true,
      },
    },
  ],
};
