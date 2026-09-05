// Configuration for the report-exports tray: per-status presentation and the
// ordered fields used to build a report's filter summary.
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import { EXPORT_JOB_STATUS, ExportJob } from "@ui/ui-lib";
import { LATEST_CHIP_COLORS, STATUS_COLORS } from "./constants";

export interface StatusMeta {
  color: string;
  Icon: typeof CheckCircleIcon;
}

export const STATUS_META: Record<string, StatusMeta> = {
  [EXPORT_JOB_STATUS.COMPLETED]: {
    color: STATUS_COLORS.COMPLETED,
    Icon: CheckCircleIcon,
  },
  [EXPORT_JOB_STATUS.FAILED]: {
    color: STATUS_COLORS.FAILED,
    Icon: ErrorOutlineIcon,
  },
  [EXPORT_JOB_STATUS.PROCESSING]: {
    color: STATUS_COLORS.PROCESSING,
    Icon: HourglassTopIcon,
  },
  [EXPORT_JOB_STATUS.PENDING]: {
    color: STATUS_COLORS.PENDING,
    Icon: HourglassTopIcon,
  },
};

export const getStatusMeta = (status: ExportJob["status"]): StatusMeta =>
  STATUS_META[status] ?? STATUS_META[EXPORT_JOB_STATUS.PENDING];

// styleMap for the common ChipRenderer "Latest" badge (keyed by lowercased value).
export const LATEST_CHIP_STYLE_MAP = {
  latest: LATEST_CHIP_COLORS,
};

// Ordered fields shown in the filter summary (fallback for when the server
// summary with resolved names isn't available yet).
export const FILTER_SUMMARY_FIELDS: {
  key: string;
  fmt: (v: string) => string;
}[] = [
  { key: "month", fmt: (v) => v },
  { key: "businessMonth", fmt: (v) => v },
  { key: "quarter", fmt: (v) => (/^\d+$/.test(v) ? `Q${v}` : v) },
  { key: "financialYear", fmt: (v) => `FY ${v}` },
  { key: "owner", fmt: (v) => (v.toLowerCase() === "team" ? "Team" : "Me") },
  { key: "incomeType", fmt: (v) => v },
  { key: "policyType", fmt: (v) => `Policy ${v}` },
  { key: "organisationId", fmt: (v) => `Org ${v}` },
  { key: "sbuId", fmt: (v) => `SBU ${v}` },
  { key: "branchId", fmt: (v) => `Branch ${v}` },
  { key: "insurerId", fmt: (v) => `Insurer ${v}` },
];
