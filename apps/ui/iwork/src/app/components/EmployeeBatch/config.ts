import { ColDef } from "ag-grid-community";
import { formatDateTime } from "@ui/ui-lib/utils/DateFormat";
import { colors } from "@ui/ui-lib/styles/Theme/colors";
import { theme } from "@ui/ui-lib/styles/Theme";
import { formatNumberByLocalization } from "@ui/ui-lib";
import dayjs from "dayjs";

export const statusStyleMap = {
  failed: {
    backgroundColor: colors.gradients.red.end,
    color: colors.gradients.red.text,
  },
  created: {
    backgroundColor: colors.background.covers,
    color: colors.text.grey,
  },
  processing: {
    backgroundColor: colors.gradients.orange.end,
    color: colors.gradients.orange.text,
  },
  completed: {
    backgroundColor: colors.gradients.teal.end,
    color: colors.gradients.teal.text,
  },
};

export const successCountStyleMap = {
  color: colors.text.success,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
};

export const failedCountStyleMap = {
  color: colors.text.failed,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
};

export const employeeBatches: ColDef[] = [
  {
    headerName: "Batch ID",
    field: "batchId",
    tooltipField: "batchId",
    headerTooltip: "Batch ID",
    width: 100,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    // batchId falls back to documentProcessingFileId when null — no single
    // DB column to sort by.
    disableSort: true,
  },

  {
    headerName: "Upload date",
    field: "createdAt",
    headerTooltip: "Upload Date",
    flex: 1, // Will grow proportionally
    minWidth: 150,
    valueFormatter: ({ value }) => (value ? formatDateTime(value) : "--"),
    tooltipValueGetter: ({ value }) => (value ? formatDateTime(value) : "--"),
  },
  {
    headerName: "Enrollment start date",
    field: "documentProcessingFile.enrollmentStartDate",
    headerTooltip: "Enrollment Start Date",
    flex: 1,
    minWidth: 180,
    valueFormatter: ({ value }) =>
      value ? dayjs(value).format("DD/MM/YYYY") : "--",
    tooltipValueGetter: ({ data }) => {
      const value = data?.documentProcessingFile?.enrollmentStartDate;
      return value ? dayjs(value).format("DD/MM/YYYY") : "--";
    },
  },
  {
    headerName: "Enrollment end date",
    field: "documentProcessingFile.enrollmentEndDate",
    headerTooltip: "Enrollment End Date",
    flex: 1,
    minWidth: 180,
    valueFormatter: ({ value }) =>
      value ? dayjs(value).format("DD/MM/YYYY") : "--",
    tooltipValueGetter: ({ data }) => {
      const value = data?.documentProcessingFile?.enrollmentEndDate;
      return value ? dayjs(value).format("DD/MM/YYYY") : "--";
    },
  },

  {
    headerName: "File name",
    field: "sourceFile.fileName",
    tooltipField: "sourceFile.fileName",
    headerTooltip: "File Name",
    flex: 2,
    minWidth: 150,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
    // Derived via path.basename(fileKey) server-side — not a plain column.
    disableSort: true,
  },

  {
    headerName: "File size",
    field: "sourceFile.fileSize",
    tooltipField: "sourceFile.fileSize",
    headerTooltip: "File Size",
    flex: 2,
    minWidth: 100,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },
  {
    headerName: "Total count",
    field: "processCount",
    tooltipField: "processCount",
    headerTooltip: "Total Count",
    width: 130,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    cellClass: "right-aligned-cell",
    headerClass: "right-aligned-header",
  },
  {
    headerName: "Success",
    field: "successCount",
    tooltipField: "successCount",
    headerTooltip: "Success",
    width: 100,
    cellRenderer: "TextRenderer",
    cellRendererParams: {
      styleMap: successCountStyleMap,
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    cellClass: "success-count-cell",
    headerClass: "success-count-header",
  },
  {
    headerName: "Failed",
    field: "errorCount",
    tooltipField: "errorCount",
    headerTooltip: "Failed",
    width: 100,
    cellRenderer: "TextRenderer",
    cellRendererParams: {
      styleMap: failedCountStyleMap,
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    cellClass: "failed-count-cell",
    headerClass: "success-count-header",
  },
  {
    headerName: "Status",
    field: "documentProcessingFile.processStatus",
    tooltipField: "documentProcessingFile.processStatus",
    headerTooltip: "Status",
    cellRenderer: "ChipRenderer",
    minWidth: 150,
    flex: 1,
    cellRendererParams: {
      styleMap: statusStyleMap,
    },
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined ? value : "--",
  },

  {
    headerName: "Processing completed at",
    field: "documentProcessingFile.updatedAt",
    headerTooltip: "Processing completed at",
    flex: 1,
    minWidth: 230,
    valueFormatter: ({ value }) => (value ? formatDateTime(value) : "--"),
    tooltipValueGetter: ({ data }) => {
      const value = data?.documentProcessingFile?.updatedAt;
      return value ? formatDateTime(value) : "--";
    },
  },
  {
    headerName: "Actions",
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
  // {
  //   headerName: "",
  //   field: "initiateFileProcessing",
  //   headerTooltip: "Initiate file processing",
  //   cellRenderer: "ProcessEnrollmentButton",
  //   minWidth: 220,
  //   flex: 1,
  //   suppressSizeToFit: true,
  //   sortable: false,
  // },
];
