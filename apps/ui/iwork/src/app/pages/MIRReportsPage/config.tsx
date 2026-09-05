import { Chip } from "@mui/material";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import {
  Button,
  companyUtilityFunction,
  endPoints,
  FormFieldConfig,
} from "@ui/ui-lib";
import { MirStatus } from "./mirSections";

type OpenReportFn = (
  companyLabel: string,
  periodLabel: string,
  readOnly: boolean,
  status?: string,
  reportId?: number,
) => void;

interface MirReportRow {
  id: number;
  company: string;
  period: string;
  status: string;
  owner: string;
  generatedOn: string;
  publishedAt: string;
}

// Normalise backend lowercase status to display label
const STATUS_DISPLAY: Record<string, MirStatus> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Draft", // rejected returns to draft-like state
  published: "Published",
  acknowledged: "Acknowledged",
};

const STATUS_COLOR: Record<string, "default" | "info" | "warning" | "success" | "error"> = {
  draft: "default",
  submitted: "info",
  approved: "warning",
  rejected: "error",
  published: "success",
  acknowledged: "success",
};

export const MIR_FILTER_FIELDS: FormFieldConfig[] = [
  {
    key: "company",
    name: "company",
    label: "Company",
    type: "selectFieldByApi",
    gridColumn: 4,
    placeholder: "Search company",
    rules: { required: "Select a company" },
    apiDependencies: {
      endPoint: endPoints.companiesListInSelectField,
      utilityFunction: companyUtilityFunction,
      syncLabelTo: "companyName",
    },
    componentProps: {
      disablePortal: true,
    },
  },
  {
    key: "period",
    name: "period",
    label: "Period (Month / Year)",
    type: "monthYear",
    gridColumn: 4,
    placeholder: "MMM YYYY",
    rules: { required: "Select a period" },
    // MIR reports the previous month's activity (BR-MIR-002) — the current
    // and any future month can't be generated yet since that period hasn't
    // closed.
    componentProps: {
      maxDate: dayjs().subtract(1, "month").endOf("month"),
    },
  },
  {
    key: "generate",
    name: "generate",
    label: "Generate",
    type: "button",
    gridColumn: 2,
    onClick: "generate",
    componentProps: {
      variantType: "primary",
      sizeType: "large",
      sx: { mt: "26px" },
    },
  },
];

export const mirBreadcrumbs = (currentLabel: string) => [
  { label: "MIR Reports", key: "mir-reports", path: "/mir-reports" },
  { label: currentLabel, key: "mir-report-view" },
];

// Converts the API's "MM-YYYY" period (e.g. "06-2026") into a display
// label (e.g. "June 2026"). Falls back to the raw value if unparseable.
export const formatPeriodLabel = (period: string): string => {
  const [mm, yyyy] = (period ?? "").split("-");
  const monthIndex = Number(mm) - 1;
  if (!yyyy || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return period;
  }
  return new Date(Number(yyyy), monthIndex, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const formatCell = ({ value, data }: { value: unknown; data?: MirReportRow }) => {
  if (!data?.id) {
    return "";
  }
  return value !== null && value !== undefined && value !== "" ? String(value) : "--";
};

export const getMirColumns = (openReport: OpenReportFn): ColDef[] => [
  { headerName: "Company", field: "company", flex: 2, valueFormatter: formatCell, sortable: false },
  { headerName: "Period", field: "period", flex: 1, valueFormatter: formatCell, sortable: false },
  {
    headerName: "Status",
    field: "status",
    flex: 1,
    sortable: false,
    cellRenderer: (params: { value: string; data?: MirReportRow }) => {
      if (!params.data?.id) {
        return null;
      }
      const raw = (params.value ?? "").toLowerCase();
      return (
        <Chip
          size="small"
          label={STATUS_DISPLAY[raw] ?? params.value}
          color={STATUS_COLOR[raw] ?? "default"}
          variant="outlined"
        />
      );
    },
  },
  { headerName: "CRM Owner", field: "owner", flex: 1, valueFormatter: formatCell, sortable: false },
  { headerName: "Generated On", field: "generatedOn", flex: 1, valueFormatter: formatCell, sortable: false },
  { headerName: "Published At", field: "publishedAt", flex: 1, valueFormatter: formatCell, sortable: false },
  {
    headerName: "",
    field: "id",
    maxWidth: 100,
    sortable: false,
    cellRenderer: (params: { data?: MirReportRow }) => {
      if (!params.data?.id) {
        return null;
      }
      return (
        <Button
          variantType="link"
          label="View"
          onClick={() =>
            openReport(
              params.data!.company,
              params.data!.period,
              true,
              params.data!.status,
              params.data!.id,
            )
          }
        />
      );
    },
  },
];