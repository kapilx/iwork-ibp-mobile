import {
  formatDate,
  formatNumberByLocalization,
  LocalizationConfig,
  Step,
} from "@ui/ui-lib";
import { CLAIMS_STEP_KEYS, ENDORSEMENT_STEP_KEYS } from "../../constants";

import { StateEnum } from "../../components/NestedStepper/RenderComponent";
import { ColDef } from "ag-grid-community";
import { ClaimsDataUploadConfig } from "./ClaimsDataUpload/config";

export const claimUploadConfig: Step[] = [
  {
    key: CLAIMS_STEP_KEYS.UPLOAD_CLAIMS,
    title: "Upload claims",
    config: { ClaimsDataUploadConfig },
    checked: false,
    stepState: StateEnum.DRAFT,
  }
];

export interface ClaimsUploadBreadcrumbConfigParams {
  policyId: number;
  from?: string;
}

export const claimsUploadBreadcrumbConfig = ({
  from,
  policyId,
}: ClaimsUploadBreadcrumbConfigParams) => {
  if (from === "policyListing") {
    return [
      { label: "Manage Policy", path: "/policies" },
      { label: "Claims upload" },
    ];
  }
  return [
    { label: "Policy details", path: `/policies/${policyId}` },
    { label: "Claims upload", path: "" },
  ];
};

export const claimsBatches: ColDef[] = [
  {
    headerName: "Claim batch ID",
    field: "claimBatchId",
    tooltipField: "claimBatchId",
    headerTooltip: "Claims batch ID",
    width: 120,
    valueFormatter: ({ value }) =>
      value ?? value === 0 ? String(value) : "--",
  },
  {
    headerName: "Claim created date",
    field: "claimCreatedDate",
    headerTooltip: "Claim created date",
    width: 160,
    valueFormatter: ({ value }) => (value ? formatDate(value) : "--"),
    tooltipValueGetter: ({ value }) => (value ? formatDate(value) : "--"),
  },
  {
    headerName: "Total claim records",
    field: "totalClaimRecords",
    headerTooltip: "Total claim records",
    flex: 1,
    minWidth: 140,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
  },
  {
    headerName: "Processed claims",
    field: "processedClaims",
    headerTooltip: "Processed claims",
    flex: 1,
    minWidth: 140,
    valueFormatter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined
        ? formatNumberByLocalization(value)
        : "--",
  },
  {
    headerName: "Status",
    field: "status",
    tooltipField: "status",
    headerTooltip: "Status",
    flex: 1,
    minWidth: 120,
    // show status text as-is (you can map values to labels if needed)
    valueFormatter: ({ value }) => (value ? String(value) : "--"),
    tooltipValueGetter: ({ value }) => (value ? String(value) : "--"),
  },
  {
    headerName: "Actions",
    field: "actions",
    headerTooltip: "Actions",
    minWidth: 250,
    cellRenderer: "ActionButton",
  },
];
