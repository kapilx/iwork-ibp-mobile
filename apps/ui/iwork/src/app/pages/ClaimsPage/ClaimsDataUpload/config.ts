import { endPoints, formatDateTime, FormFieldConfig } from "@ui/ui-lib";
import { colors } from "@ui/ui-lib/styles/Theme/colors";
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

export const claimsUploadBatchColumns = [
  {
    field: "claimBatchId",
    headerName: "Batch ID",
    width: 100,
  },
  {
    field: "claimCreatedDate",
    headerName: "Created Date",
    flex: 1,
    minWidth: 150,
    valueFormatter: ({ value }) => (value ? formatDateTime(value) : "--"),
    tooltipValueGetter: ({ data }) => {
      const value = data?.claimCreatedDate;
      return value ? formatDateTime(value) : "--";
    },
  },
  {
    field: "fileName",
    headerName: "File Name",
    flex: 2,
    minWidth: 150,
    cellRenderer: "FileNameRenderer",
    // path.basename(fileKey) server-side — not a plain column.
    disableSort: true,
  },
  {
    field: "totalClaimRecords",
    headerName: "Total",
    width: 130,
  },
  {
    field: "totalSuccess",
    headerName: "Success",
    width: 100,
  },
  {
    field: "totalFail",
    headerName: "Failed",
    width: 100,
  },
  {
    field: "totalPendingClaims",
    headerName: "Pending Claims",
    width: 130,
    // COUNT(CASE...) aggregate — no single sortable column.
    disableSort: true,
  },
  {
    field: "totalSettledClaims",
    headerName: "Total Settled",
    width: 130,
    disableSort: true,
  },
  {
    field: "status",
    headerName: "Status",
    minWidth: 150,
    flex: 1,
    cellRenderer: "ChipRenderer",
    cellRendererParams: {
      styleMap: statusStyleMap,
    },
  },
  {
    field: "processingCompletedAt",
    headerName: "Processing completed at",
    headerTooltip: "Processing completed at",
    flex: 1,
    minWidth: 230,
    valueFormatter: ({ value }) => (value ? formatDateTime(value) : "--"),
    tooltipValueGetter: ({ data }) => {
      const value = data?.processingCompletedAt;
      return value ? formatDateTime(value) : "--";
    },
  },
  {
    field: "actions",
    headerName: "Actions",
    minWidth: 100,
    cellRenderer: "ActionButton",
  },
];

export const ClaimsDataUploadConfig = (
  policyId: number,
  companyType: string,
  documentTypeLid: number,
  showDownloadIcon: boolean = true
) => [
  {
    key: "claimsDataUpload",
    name: "claimsDataUpload",
    label: "",
    type: "title",
    componentProps: {
      isBold: true,
    },
    gridColumn: 9,
  },
  {
    key: "claimsUploadDate",
    name: "claimsUploadDate",
    label: "Claims upload date",
    type: "date",
    gridColumn: 5,
    componentProps: {
      placeholder: "Enter employee count",
      fullWidth: true,
    },
    rules: { required: { value: true, message: "Field is required" } },
  },
  {
    key: "totalClaims",
    name: "totalClaims",
    label: "Number of claims",
    type: "number",
    gridColumn: 5,
    formatNumber: true,
    componentProps: {
      placeholder: "Enter employee count",
      fullWidth: true,
    },
    rules: { required: { value: true, message: "Field is required" } },
  },
  {
    key: "uploadClaimsFile",
    name: "uploadClaimsFile",
    label: "Upload claims file",
    type: "documentupload",
    gridColumn: 9,
    companyId: policyId,
    documentTypeLid: documentTypeLid,
    componentProps: {
      fullWidth: true,
      customVariant: "endorsementDoc",
      accept: ".xlsx,.xls",
      requireDocumentType: false,
      maxLimit: 1,
      companyType: companyType,
        downloadTemplateLabel: "Download claims template",
      showDownloadIcon,
    },
    hideDropdown: true,
    apiDependencies: {
      endPoint: endPoints.fileUpload,
    },
  },
];
