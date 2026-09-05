import { ColDef } from "ag-grid-community";
import { getStatus } from "./index.js";
import { HoverCellRenderer } from "./index.js";
import { colors } from "@ui/ui-lib/styles/Theme/colors";
import {
  formatCurrencyByLocalization,
  formatNumberByLocalization,
  formatNumberShort,
  LocalizationConfig,
} from "@ui/ui-lib/utils";
import { formatDate, formatDateTime } from "@ui/ui-lib/utils/DateFormat";
import CustomStepper from "../../common/CustomStepper/index.js";
import { policyEndorsementStatus } from "../../constants/index.js";

export const priorityStyleMap = {
  processed: {
    backgroundColor: colors.gradients.teal.end,
    color: colors.gradients.teal.text,
  },
  pending: {
    backgroundColor: colors.gradients.orange.end,
    color: colors.gradients.orange.text,
  },
};

export const getClosedEndorsementCols = (
  hoveredIndex: number,
  onInsurerAcknowledge?: (key: string, data: any) => void,
  localization?: LocalizationConfig
): ColDef[] => [
  {
    headerName: "Endorsement date",
    field: "endorsementSentDate",
    tooltipField: "endorsementSentDate",
    headerTooltip: "Endorsement date",
    pinned: "left",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
  },

  {
    headerName: "Endorsement ID",
    field: "endorsementId",
    tooltipField: "endorsementId",
    headerTooltip: "Endorsement ID",
    pinned: "left",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },

  {
    headerName: "Status",
    field: "status",

    headerTooltip: "Status",
    minWidth: 650,
    // Computed in a post-fetch loop over the paginated page
    // (listEndorsementBatches), not a plain column — no sortable path.
    disableSort: true,
    cellRenderer: (params: any) => {
      return (
        <CustomStepper
          currentStep={policyEndorsementStatus[params.data?.status]}
          onCurrentStepClick={(stepKey, data) =>
            onInsurerAcknowledge?.(stepKey, data)
          }
          rowData={params.data}
          variant="default"
        />
      );
    },
    cellRendererParams: {
      styleMap: priorityStyleMap,
      variant: "withDot",
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },

  {
    headerName: "File name",
    field: "fileName",
    tooltipField: "fileName",
    headerTooltip: "File name",
    cellRenderer: "FileRenderer",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    disableSort: true,
  },

  {
    headerName: "Total count",
    field: "totalCount",
    tooltipField: "totalCount",
    headerTooltip: "Total count",

    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
    disableSort: true,
  },
  {
    headerName: "Addition",
    field: "addition",
    tooltipField: "addition",
    headerTooltip: "Addition",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Deletion",
    field: "deletion",
    tooltipField: "deletion",
    headerTooltip: "Deletion",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },

  {
    headerName: "Net premium",
    field: "netPremium",
    tooltipField: "netPremium",
    headerTooltip: "Net premium",

    valueFormatter: ({ value, data }) => {
      const premium =
        value != null
          ? formatCurrencyByLocalization(value, localization)
          : "--";
      return `${premium}`;
    },
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Gross premium",
    field: "grossPremium",
    tooltipField: "grossPremium",
    headerTooltip: "Gross premium",
    valueFormatter: ({ value, data }) => {
      const premium =
        value != null
          ? formatCurrencyByLocalization(value, localization)
          : "--";
      return `${premium}`;
    },
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Brokerage",
    field: "brokerage",
    tooltipField: "brokerage",
    headerTooltip: "Brokerage",
    valueFormatter: ({ value, data }) => {
      const premium =
        value != null
          ? formatCurrencyByLocalization(value, localization)
          : "--";
      return `${premium}`;
    },
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Insurer Endorsement ID",
    field: "confirmationId",
    tooltipField: "confirmationId",
    headerTooltip: "Insurer Endorsement ID",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Acknowledgement recieved date",
    field: "acknowledgementRecievedDate",
    tooltipField: "acknowledgementRecievedDate",
    headerTooltip: "Acknowledgement recieved date",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
  },
  {
    headerName: "Uploaded by",
    field: "uploadedBy",
    tooltipField: "uploadedBy",
    headerTooltip: "Uploaded by",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    disableSort: true,
  },
  {
    headerName: "Endorsement type",
    field: "endorsementType",
    tooltipField: "endorsementType",
    headerTooltip: "Endorsement type",

    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "TPA error count",
    field: "tpaErrorCount",
    tooltipField: "tpaErrorCount",
    headerTooltip: "TPA error count",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "TPA error file",
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
  },
];

export const getManageEndorsementCols = (
  hoveredIndex: number,
  onInsurerAcknowledge?: (key: string, data: any) => void,
  localization?: LocalizationConfig
): ColDef[] => [
  {
    headerName: "Policy number",
    field: "policyNumber",
    headerTooltip: "Policy number",
    pinned: "left",
    cellClass: "clickable-cell",
    valueGetter: (params) =>
      params.data.policyNumber !== null ? params.data.policyNumber : "--",
    tooltipValueGetter: (params) =>
      params.data.policyNumber !== null ? params.data.policyNumber : "--",
  },
  {
    headerName: "Company name",
    field: "companyName",
    headerTooltip: "Company name",
    pinned: "left",
    valueGetter: (params) => params.data.companyName ?? "--",
    tooltipValueGetter: (params) => params.data.companyName ?? "--",
  },
  {
    headerName: "Endorsement date",
    field: "endorsementSentDate",
    tooltipField: "endorsementSentDate",
    headerTooltip: "Endorsement date",
    pinned: "left",
    maxWidth: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
  },
  {
    headerName: "Status",
    field: "status",
    headerTooltip: "Status",
    minWidth: 650,
    cellRenderer: (params: any) => {
      return (
        <CustomStepper
          currentStep={policyEndorsementStatus[params.data?.status]}
          onCurrentStepClick={(stepKey, data) =>
            onInsurerAcknowledge?.(stepKey, data)
          }
          rowData={params.data}
          variant="default"
        />
      );
    },
    cellRendererParams: {
      styleMap: priorityStyleMap,
      variant: "withDot",
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Endorsement ID",
    field: "endorsementId",
    tooltipField: "endorsementId",
    headerTooltip: "Endorsement ID",
    // pinned: "left",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Policy type",
    field: "policyType",
    tooltipField: "policyType",
    // cellClass: "clickable-cell",
    headerTooltip: "Policy type",
    valueGetter: (params) => params.data.policyType ?? "--",
    tooltipValueGetter: (params) => params.data.policyType.lookUpValue ?? "--",
  },
  {
    headerName: "File name",
    field: "fileName",
    tooltipField: "fileName",
    headerTooltip: "File name",
    cellRenderer: "FileRenderer",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },

  {
    headerName: "Total count",
    field: "totalCount",
    tooltipField: "totalCount",
    headerTooltip: "Total count",

    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Addition",
    field: "addition",
    tooltipField: "addition",
    headerTooltip: "Addition",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Deletion",
    field: "deletion",
    tooltipField: "deletion",
    headerTooltip: "Deletion",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },

  {
    headerName: "Net premium",
    field: "netPremium",
    tooltipField: "netPremium",
    headerTooltip: "Net premium",

    valueFormatter: ({ value, data }) => {
      const premium =
        value != null
          ? formatCurrencyByLocalization(value, localization)
          : "--";
      return `${premium}`;
    },
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Gross premium",
    field: "grossPremium",
    tooltipField: "grossPremium",
    headerTooltip: "Gross premium",
    valueFormatter: ({ value, data }) => {
      const premium =
        value != null
          ? formatCurrencyByLocalization(value, localization)
          : "--";
      return `${premium}`;
    },
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Brokerage",
    field: "brokerage",
    tooltipField: "brokerage",
    headerTooltip: "Brokerage",
    valueFormatter: ({ value, data }) => {
      const premium =
        value != null
          ? formatCurrencyByLocalization(value, localization)
          : "--";
      return `${premium}`;
    },
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Insurer Endorsement ID",
    field: "confirmationId",
    tooltipField: "confirmationId",
    headerTooltip: "Insurer Endorsement ID",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Acknowledgement recieved date",
    field: "acknowledgementRecievedDate",
    tooltipField: "acknowledgementRecievedDate",
    headerTooltip: "Acknowledgement recieved date",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
  },
  {
    headerName: "Uploaded by",
    field: "uploadedBy",
    tooltipField: "uploadedBy",
    headerTooltip: "Uploaded by",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Endorsement type",
    field: "endorsementType",
    tooltipField: "endorsementType",
    headerTooltip: "Endorsement type",

    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "TPA error count",
    field: "tpaErrorCount",
    tooltipField: "tpaErrorCount",
    headerTooltip: "TPA error count",
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "TPA error file",
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
  },
  {
    headerName: "TAT (Days)",
    field: "endorsementSentDate", // tat
    tooltipField: "endorsementSentDate", //tat
    headerTooltip: "TAT (Days)",
    maxWidth: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
  },
  {
    headerName: "Company Priority",
    field: "endorsementSentDate", // Company Priority
    tooltipField: "endorsementSentDate", // Company Priority
    headerTooltip: "Company Priority",
    maxWidth: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? formatDate(value) : "--",
  },
];

export const endorsementBatchTrackerCols: ColDef[] = [
  {
    headerName: "Endorsement ID",
    field: "endorsementId",
    tooltipField: "endorsementId",
    headerTooltip: "Endorsement ID",
    valueFormatter: ({ value }) => value ?? "--",
    cellClass: "clickable-cell",
  },
  {
    headerName: "Endorsement date",
    field: "endorsementDate",
    tooltipField: "endorsementDate",
    headerTooltip: "Endorsement date",
    valueFormatter: ({ value }) => (value ? formatDate(value) : "--"),
    tooltipValueGetter: ({ value }) => (value ? formatDateTime(value) : "--"),
    // Confirmed live (asset tracker): sort direction has no effect —
    // ASC/DESC return identical order. listAssetEndorsementBatchesTracker's
    // raw QueryBuilder .orderBy() silently no-ops for this field (root cause
    // not yet fully understood — endorsementId sorts fine via the same
    // mechanism, so it isn't a blanket QueryBuilder issue). Stopgap until
    // that's root-caused properly.
    disableSort: true,
  },
  {
    headerName: "Endorsement status",
    field: "currentStatus",
    tooltipField: "currentStatus",
    headerTooltip: "Endorsement status",
    cellClass: "clickable-cell",
    valueFormatter: (params) => {
      if (params?.data?.currentStageOrder && params?.data?.currentStageLabel) {
        const value = `Step ${params?.data?.currentStageOrder} - ${params?.data?.currentStageLabel}`;
        return value;
      }
      return "--";
    },
    tooltipValueGetter: (params) => {
      if (params?.data?.currentStageOrder && params?.data?.currentStageLabel) {
        const value = `Step ${params?.data?.currentStageOrder} - ${params?.data?.currentStageLabel}`;
        return value;
      }
      return "--";
    },
  },
  {
    headerName: "Insurer Endorsement Number",
    field: "insurerEndorsementNumber",
    tooltipField: "insurerEndorsementNumber",
    headerTooltip: "Insurer Endorsement Number",
    valueFormatter: ({ value }) => value ?? "--",
    tooltipValueGetter: ({ value }) => value ?? "--",
  },
  {
    headerName: "Endorsement Effective Date",
    field: "endorsementEffectiveDate",
    tooltipField: "endorsementEffectiveDate",
    headerTooltip: "Endorsement Effective Date",
    valueFormatter: ({ value }) => (value ? formatDate(value) : "--"),
    tooltipValueGetter: ({ value }) => (value ? formatDateTime(value) : "--"),
  },
  {
    headerName: "TAT / Ageing",
    field: "TATduration",
    tooltipField: "TATduration",
    headerTooltip: "TAT / Ageing",
    valueFormatter: ({ value }) => value ?? "--",
    tooltipValueGetter: ({ value }) => value ?? "--",
    // Computed in JS after fetch (start/end date diff) — not in either
    // ENDORSEMENT_TRACKER_SORT_FIELDS or ASSET_ENDORSEMENT_TRACKER_SORT_FIELDS.
    disableSort: true,
  },
  {
    headerName: "Additions",
    field: "additionCount",
    headerTooltip: "Additions",
    valueFormatter: ({ value }) =>
      value != null ? formatNumberByLocalization(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    // Same query, same select-list + raw .orderBy() pattern already
    // confirmed broken for endorsementDate/grossPremium above. Untied test
    // data wasn't available to prove it live either way — disabled on
    // suspicion for consistency, not individually confirmed.
    disableSort: true,
  },
  {
    headerName: "Deletions",
    field: "deletionCount",
    headerTooltip: "Deletions",
    valueFormatter: ({ value }) =>
      value != null ? formatNumberByLocalization(value) : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    // Same as Additions above — suspected, not individually confirmed.
    disableSort: true,
  },
  {
    headerName: "Gross premium",
    field: "grossPremium",
    tooltipField: "grossPremium",
    headerTooltip: "Gross premium",
    valueFormatter: ({ value, data }) => {
      const premium =
        value != null ? formatNumberShort(value, data?.localization) : "--";
      return `${premium}`;
    },
    tooltipValueGetter: ({ value, data }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value, data?.localization)
        : "--",
    // Confirmed live (asset tracker): sort=grossPremium:ASC and :DESC both
    // return the same order despite genuinely distinct values (10000 vs 0).
    // Same unexplained QueryBuilder no-op as endorsementDate above.
    disableSort: true,
  },
  {
    headerName: "Basic Brokerage %",
    field: "basicBrokeragePercentage",
    tooltipField: "basicBrokeragePercentage",
    headerTooltip: "Basic Brokerage Percentage",
    valueFormatter: ({ value }) => {
      return value != null ? `${value}` : "--";
    },
    tooltipValueGetter: ({ value }) =>
      value != null ? `${value}` : "--",
    // Same suspected no-op as endorsementDate/grossPremium above — not
    // individually live-verified, disabled out of caution.
    disableSort: true,
  },
  {
    headerName: "Basic Brokerage Amount",
    field: "basicBrokerageAmount",
    tooltipField: "basicBrokerageAmount",
    headerTooltip: "Basic Brokerage Amount",
    // Same suspected no-op as endorsementDate/grossPremium above — not
    // individually live-verified, disabled out of caution.
    disableSort: true,
   valueFormatter: ({ value, data }) => {
      const basicBrokerageAmount =
        value != null
          ? formatCurrencyByLocalization(value, data?.localization)
          : "--";
      return `${basicBrokerageAmount}`;
    },
    tooltipValueGetter: ({ value, data }) =>
      value !== null && value !== undefined
        ? formatCurrencyByLocalization(value, data?.localization)
        : "--",
  },
];
