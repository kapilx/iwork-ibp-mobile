import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Mirrors the backend user_bizdone_report lifecycle. A const map (not a TS
// enum) so the string values stay assignable from API JSON without casting,
// while giving named constants to use instead of magic strings.
export const EXPORT_JOB_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

// Mirrors the backend's UserBizdoneReportType enum. Used to discriminate jobs
// in the shared `jobs` list so each module's tray (BizDone, SO, ...) can be
// scoped to only its own exports.
export const EXPORT_REPORT_TYPE = {
  BIZDONE: "BIZDONE",
  SALES_OPPORTUNITY_LIST: "SALES_OPPORTUNITY_LIST",
  RENEWAL_OPPORTUNITY_LIST: "RENEWAL_OPPORTUNITY_LIST",
  POLICY_LIST: "POLICY_LIST",
  BUSINESS_TARGET: "BUSINESS_TARGET",
} as const;

export type ExportReportType =
  (typeof EXPORT_REPORT_TYPE)[keyof typeof EXPORT_REPORT_TYPE];

export type ExportJobStatus =
  (typeof EXPORT_JOB_STATUS)[keyof typeof EXPORT_JOB_STATUS];

export interface ExportJob {
  jobId: number;
  reportType?: string;
  status: ExportJobStatus;
  documentId?: number | null;
  errorMessage?: string | null;
  createdAt?: string;
  // Set when the worker actually starts generating (not when enqueued) —
  // together with completedAt, this is how long generation took.
  startedAt?: string | null;
  completedAt?: string | null;
  // A friendly label shown in the panel (e.g. "Biz Done Report").
  label?: string;
  // The applied filters (the stored query), used to render a per-report
  // summary so exports with different filters are distinguishable.
  filtersApplied?: Record<string, any> | null;
  // Server-built human-readable summary with names resolved (preferred over the
  // client-side id summary when present).
  filtersSummary?: string | null;
  // Set on reports the user generated this session, so the UI can auto-download
  // them the moment they complete (not applied to hydrated history).
  autoDownload?: boolean;
}

export interface ExportsState {
  jobs: ExportJob[];
  // Keyed by reportType so each module's tray (BizDone, SO, ...) tracks its
  // own drawer-open state and unseen badge independently — opening the SO
  // tray must not clear BizDone's unseen count, and vice versa.
  panelOpenByType: Record<string, boolean>;
  unseenCountByType: Record<string, number>;
}

// Jobs enqueued before reportType existed (or via a caller that omits it)
// fall back to BIZDONE — the module every job belonged to originally.
const DEFAULT_REPORT_TYPE: string = EXPORT_REPORT_TYPE.BIZDONE;

const initialState: ExportsState = {
  jobs: [],
  panelOpenByType: {},
  unseenCountByType: {},
};

const isInFlight = (s: ExportJobStatus) =>
  s === EXPORT_JOB_STATUS.PENDING || s === EXPORT_JOB_STATUS.PROCESSING;

// Keep the list newest-first regardless of the order updates arrive in
// (enqueue, poll, and the DESC list endpoint all funnel through here).
const sortNewestFirst = (jobs: ExportJob[]) =>
  jobs.sort((a, b) => {
    const ta = new Date(a.createdAt ?? 0).getTime();
    const tb = new Date(b.createdAt ?? 0).getTime();
    if (tb !== ta) return tb - ta;
    return (b.jobId ?? 0) - (a.jobId ?? 0);
  });

export const exportsSlice = createSlice({
  name: "exports",
  initialState,
  reducers: {
    // Add a freshly enqueued job to the top of the list.
    addExportJob: (state, action: PayloadAction<ExportJob>) => {
      const existing = state.jobs.findIndex(
        (j) => j.jobId === action.payload.jobId
      );
      if (existing >= 0) {
        state.jobs[existing] = { ...state.jobs[existing], ...action.payload };
      } else {
        state.jobs.unshift(action.payload);
      }
      sortNewestFirst(state.jobs);
    },
    // Merge in fresh statuses (from polling or the list endpoint). Bumps the
    // unseen badge (scoped to the job's own reportType) whenever a job
    // transitions from in-flight to a terminal state while that type's panel
    // is closed.
    upsertExportJobs: (state, action: PayloadAction<ExportJob[]>) => {
      for (const incoming of action.payload) {
        const type = incoming.reportType ?? DEFAULT_REPORT_TYPE;
        const idx = state.jobs.findIndex((j) => j.jobId === incoming.jobId);
        if (idx >= 0) {
          const prev = state.jobs[idx];
          const becameTerminal =
            isInFlight(prev.status) && !isInFlight(incoming.status);
          state.jobs[idx] = { ...prev, ...incoming };
          if (becameTerminal && !state.panelOpenByType[type]) {
            state.unseenCountByType[type] =
              (state.unseenCountByType[type] ?? 0) + 1;
          }
        } else {
          state.jobs.unshift(incoming);
        }
      }
      sortNewestFirst(state.jobs);
    },
    setExportsPanelOpen: (
      state,
      action: PayloadAction<{ open: boolean; reportType?: string }>,
    ) => {
      const type = action.payload.reportType ?? DEFAULT_REPORT_TYPE;
      state.panelOpenByType[type] = action.payload.open;
      if (action.payload.open) {
        state.unseenCountByType[type] = 0;
      }
    },
    // Clear the auto-download flag once a job has been auto-downloaded, so it is
    // never downloaded again — even if the tray unmounts/remounts on navigation.
    markAutoDownloaded: (state, action: PayloadAction<number>) => {
      const job = state.jobs.find((j) => j.jobId === action.payload);
      if (job) {
        job.autoDownload = false;
      }
    },
    clearExports: (state) => {
      state.jobs = [];
      state.panelOpenByType = {};
      state.unseenCountByType = {};
    },
  },
});

export const {
  addExportJob,
  upsertExportJobs,
  setExportsPanelOpen,
  markAutoDownloaded,
  clearExports,
} = exportsSlice.actions;

export default exportsSlice.reducer;

// Selectors. `reportType` scopes to a single module's jobs (e.g. the SO
// tray must only ever see SALES_OPPORTUNITY_LIST jobs); omit it to get the
// original cross-module view.
export const selectExportJobs = (
  state: any,
  reportType?: string,
): ExportJob[] => {
  const jobs = state.exports?.jobs ?? [];
  return reportType
    ? jobs.filter((j: ExportJob) => j.reportType === reportType)
    : jobs;
};
export const selectExportsPanelOpen = (
  state: any,
  reportType: string = DEFAULT_REPORT_TYPE,
): boolean => state.exports?.panelOpenByType?.[reportType] ?? false;
export const selectExportsUnseenCount = (
  state: any,
  reportType: string = DEFAULT_REPORT_TYPE,
): number => state.exports?.unseenCountByType?.[reportType] ?? 0;
export const selectInFlightExportIds = (
  state: any,
  reportType?: string,
): number[] =>
  selectExportJobs(state, reportType)
    .filter((j: ExportJob) => isInFlight(j.status))
    .map((j: ExportJob) => j.jobId);
