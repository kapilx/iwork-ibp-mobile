import { ColDef } from "ag-grid-community";
// eslint-disable-next-line @nx/enforce-module-boundaries
import { formatDate, formatNumberInputByLocalization } from "@ui/ui-lib";
import React from "react";

// Action Renderer Component
export const ActionRenderer = (params: { api?: { dispatchEvent?: (event: unknown) => void }; data?: unknown; node?: { rowIndex?: number } }) => {
  const handleEdit = () => {
    // This will be handled in the parent component via onCellClicked
    if (params.api && params.api.dispatchEvent) {
      params.api.dispatchEvent({
        type: 'cellClicked',
        rowIndex: params.node?.rowIndex,
        colDef: { field: 'edit' },
        value: 'edit',
        data: params.data
      });
    }
  };

  // Check if installment is paid - if so, don't show edit icon
  const status = params.data?.status;
  const isPaid = status && (
    (status.lookUpValue && status.lookUpValue.toLowerCase() === 'paid') ||
    (typeof status === 'string' && status.toLowerCase() === 'paid')
  );

  // Don't render anything if installment is paid
  if (isPaid) {
    return null;
  }

  return React.createElement(
    "div",
    { 
      style: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
      onClick: handleEdit,
      title: "Edit installment"
    },
    React.createElement(
      "span", 
      { 
        style: { 
          fontSize: "16px", 
          color: "#1976d2",
          fontWeight: "bold"
        } 
      }, 
      "✎"
    )
  );
};

export const instalmentsColumns: ColDef[] = [
  {
    headerName: "Installment No",
    field: "installmentSequence",
    tooltipField: "installmentSequence",
    headerTooltip: "Installment No",
    width: 140,
    hide:false,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Insurer Endorsement Number",
    field: "insurerEndorsementNumber",
    tooltipField: "insurerEndorsementNumber",
    headerTooltip: "Insurer Endorsement Number",
    hide:false,
    width: 180,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Installment Date",
    field: "installmentDate",
    headerTooltip: "Installment Date",
    hide:false,
    width: 140,
    valueFormatter: ({ value }) => {
      if (value !== null && value !== undefined) {
        const formatted = formatDate(value);
        return formatted || "--";
      }
      return "--";
    },
    tooltipValueGetter: ({ value }) => {
      if (value !== null && value !== undefined) {
        const formatted = formatDate(value);
        return formatted || "--";
      }
      return "--";
    },
  },
  {
    headerName: "Installment Premium %",
    field: "installmentPercentage",
    tooltipField: "installmentPercentage",
    headerTooltip: "Installment Premium Percentage",
    width: 120,
    hide: true,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? `${value}%` : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Installment Premium Amount",
    field: "installmentNetAmount",
    tooltipField: "installmentNetAmount",
    headerTooltip: "Installment Premium Amount",
    hide:false,
    width: 160,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatNumberInputByLocalization(value) : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Installment Collection Date",
    field: "premiumCollectionDate",
    headerTooltip: "Installment Collection Date",
    hide:false,
    width: 140,
    valueFormatter: ({ value }) => {
      if (value !== null && value !== undefined) {
        const formatted = formatDate(value);
        return formatted || "--";
      }
      return "--";
    },
    tooltipValueGetter: ({ value }) => {
      if (value !== null && value !== undefined) {
        const formatted = formatDate(value);
        return formatted || "--";
      }
      return "--";
    },
  },
  {
    headerName: "Installment Collected Amount",
    field: "premiumCollectedAmount",
    tooltipField: "premiumCollectedAmount",
    headerTooltip: "Installment Collected Amount",
    width: 160,
    hide:false,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatNumberInputByLocalization(value) : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Tax (%)",
    field: "taxPercentage",
    tooltipField: "taxPercentage",
    headerTooltip: "Tax Percentage",
    width: 120,
    hide:false,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? `${value}%` : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Tax Amount",
    field: "taxAmount",
    tooltipField: "taxAmount",
    headerTooltip: "Tax Amount",
    width: 140,
    hide:false,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatNumberInputByLocalization(value) : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Installment Gross Amount",
    field: "collectedGrossAmount",
    tooltipField: "collectedGrossAmount",
    headerTooltip: "Installment Gross Amount",
    width: 160,
    hide:false,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatNumberInputByLocalization(value) : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Transaction Mode",
    field: "transactionMode",
    tooltipField: "transactionMode",
    headerTooltip: "Transaction Mode",
    width: 140,
    hide:false,
    valueGetter: ({ data }) => {
      const transactionMode = data?.transactionMode;
      if (transactionMode && transactionMode.lookUpValue) {
        return transactionMode.lookUpValue;
      }
      return transactionMode || "--";
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Invoice No",
    field: "invoiceNo",
    tooltipField: "invoiceNo",
    headerTooltip: "Invoice Number",
    width: 140,
    hide:false,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Transaction/Cheque No",
    field: "transactionChequeNumber",
    tooltipField: "transactionChequeNumber",
    headerTooltip: "Transaction/Cheque Number",
    width: 180,
    hide:false,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Bank Name",
    field: "bankName",
    tooltipField: "bankName",
    headerTooltip: "Bank Name",
    width: 140,
    hide:false,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Status",
    field: "status",
    tooltipField: "Payment status",
    headerTooltip: "Payment Status",
    width: 120,
    hide:false,
    valueGetter: ({ data }) => {
      const status = data?.status;
      if (status && status.lookUpValue) {
        return status.lookUpValue;
      }
      return status || "--";
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "File name",
    field: "sourceFile.fileName",
    tooltipField: "sourceFile.fileName",
    headerTooltip: "File Name",
    sortable: false,
    hide:false,
    flex: 2,
    minWidth: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Edit",
    field: "edit",
    headerTooltip: "Edit",
    width: 100,
    hide:false,
    cellRenderer: ActionRenderer,
    tooltipValueGetter: ({ data }) => {
      const status = data?.status;
      const isPaid =
        status &&
        ((status.lookUpValue &&
          status.lookUpValue.toLowerCase() === "paid") ||
          (typeof status === "string" && status.toLowerCase() === "paid"));

      return isPaid ? "Paid installment" : "Edit installment";
    },
    sortable: false,
    filter: false,
  },
];
