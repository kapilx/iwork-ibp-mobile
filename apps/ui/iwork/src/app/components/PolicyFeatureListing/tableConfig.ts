import { ColDef } from "ag-grid-community";

export interface PolicyFeatureRecord {
  id: number;
  policyId: number;
  documentId: number;
  fileName: string;
  fileStatus?: string;
  uploadedAt?: string;
  uploadedBy?: string | number;
  uploadedByName?: string;
}

const fallbackFormatter = ({ value }: { value: unknown }) =>
  value !== null && value !== undefined && value !== ""
    ? value
    : "--";

export const getPolicyFeatureColumns = (): ColDef[] => [
  {
    headerName: "File Name",
    field: "fileName",
    tooltipField: "fileName",
    headerTooltip: "File Name",
    valueFormatter: fallbackFormatter,
    minWidth: 220,
    flex: 1,
  },
  {
    headerName: "Uploaded By",
    field: "uploadedByName",
    tooltipField: "uploadedByName",
    headerTooltip: "Uploaded By",
    valueGetter: ({ data }) => data?.uploadedByName || data?.uploadedBy,
    minWidth: 180,
  },
  {
    headerName: "Uploaded On",
    field: "uploadedAt",
    tooltipField: "uploadedAt",
    headerTooltip: "Uploaded On",
    valueFormatter: fallbackFormatter,
    minWidth: 180,
  },
  {
    headerName: "Status",
    field: "fileStatus",
    tooltipField: "fileStatus",
    headerTooltip: "Status",
    valueFormatter: fallbackFormatter,
    minWidth: 140,
  },
];

export const policyFeatureBreadcrumbs = (policyId: string | undefined) => [
  {
    label: "Policies",
    path: "/policies",
  },
  {
    label: "Policy details",
    path: `/policies/${policyId}`,
  },
  {
    label: "Policy Features",
    path: `/policies/${policyId}/policy-features`,
  },
];
