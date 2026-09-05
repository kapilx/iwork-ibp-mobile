// Static values for the Downloads / report-exports tray.

export const DEFAULT_POLL_INTERVAL_MS = 15000;
// Used instead of DEFAULT_POLL_INTERVAL_MS while a just-triggered
// (autoDownload) job is in-flight — exports now typically finish in single-
// digit seconds, so the 15s cadence was the real source of perceived lag
// between server completion and the auto-download firing, not generation
// time itself. Jobs the user isn't actively watching (e.g. a stale
// in-progress job restored on page reload, autoDownload=false) keep the
// slower cadence so we're not polling the server every few seconds for
// those. 6s (not 2s) so a still-in-flight job isn't hit as frequently.
export const FAST_POLL_INTERVAL_MS = 6000;
export const DRAWER_WIDTH = "30%";
export const MAX_SUMMARY_PARTS = 6;

export const EXPORT_TRAY_TEXT = {
  panelTitle: "Your reports",
  emptyState: "No reports yet. Generate a report to see it here.",
  download: "Download",
  latest: "Latest",
  defaultReportLabel: "Biz Done Report",
  failedHint: "Please generate the report again.",
};

// Query keys that are not user-meaningful and should be left out of the summary.
export const SUMMARY_SKIP_KEYS = [
  "search",
  "entityType",
  "page",
  "limit",
  "userId",
  "branchViewBy",
];

// Readable text colours for the card (kept explicit so they stay legible on the
// coloured status backgrounds regardless of theme).
export const TEXT_COLORS = {
  summary: "#37474f",
  meta: "#546e7a",
};

// Status accent colours (left border + status icon), keyed by job status.
export const STATUS_COLORS = {
  COMPLETED: "#2e7d32",
  FAILED: "#c62828",
  PROCESSING: "#e67e22",
  PENDING: "#1565c0",
};

// "Latest" chip colours.
export const LATEST_CHIP_COLORS = {
  backgroundColor: "#e3f2fd",
  color: "#1565c0",
  dotColor: "#1565c0",
};

// Sizing / style overrides.
export const DOWNLOAD_ICON_SIZE = 18;
export const EMPTY_STATE_FONT_SIZE = "0.8125rem";
export const LATEST_CHIP_LABEL_STYLE = { minWidth: "auto" };

// Download button (circular, softly tinted so it reads clearly as an action).
export const DOWNLOAD_BTN_SIZE = 40;
export const DOWNLOAD_BTN_BG = "#e3f2fd";
export const DOWNLOAD_BTN_HOVER_BG = "#cfe4fb";
