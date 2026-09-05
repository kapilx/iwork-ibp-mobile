import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { apiRequest } from "../utils/apiRequest";
import { endPoints, EXPORT_TOAST } from "../constants";
import { setToastMessage } from "../redux/slice";
import {
  addExportJob,
  upsertExportJobs,
  setExportsPanelOpen,
  markAutoDownloaded as markAutoDownloadedAction,
  selectExportJobs,
  selectExportsPanelOpen,
  selectExportsUnseenCount,
  selectInFlightExportIds,
  ExportJob,
  EXPORT_JOB_STATUS,
  EXPORT_REPORT_TYPE,
} from "../redux/exportsSlice";

const saveBufferAsFile = (
  buffer: { data: number[] } | number[],
  mimeType: string | undefined,
  fileName: string
): void => {
  const bytes = Array.isArray(buffer) ? buffer : buffer.data;
  const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

interface EnqueueOptions {
  // Query string to append to the enqueue URL (same params the synchronous
  // download used, e.g. "entityType=policyDetails&search=...").
  queryString?: string;
  // Friendly label shown in the Downloads panel.
  label?: string;
  appliedFilters?: { filter: string; value: string }[];
}

export interface ReportExportsEndpoints {
  enqueue: string;
  status: (jobId: number | string) => string;
  list: string;
  download: (jobId: number | string) => string;
}

export interface ReportExportsConfig {
  // Discriminates this module's jobs in the shared jobs list — also scopes
  // the panel-open/unseen-count state and the in-flight/job selectors so one
  // module's tray never shows or counts another module's exports.
  reportType?: string;
  // Default label used when enqueueExport is called without one.
  label?: string;
  endpoints?: Partial<ReportExportsEndpoints>;
}

const DEFAULT_ENDPOINTS: ReportExportsEndpoints = {
  enqueue: endPoints.policyReportExcelExport,
  status: endPoints.policyReportExcelExportStatus,
  list: endPoints.policyReportExcelExports,
  download: endPoints.policyReportExcelExportDownload,
};

/**
 * Non-blocking report-export client. `enqueueExport` fires a background job and
 * returns immediately (the user keeps working); the tray component polls
 * in-flight jobs via `pollInFlight` and hydrates history via `refreshExports`.
 *
 * Defaults to the original BizDone endpoints/reportType so existing call
 * sites (`useReportExports()`, no args) are unaffected. Other modules (SO,
 * RO, ...) pass their own `reportType` + `endpoints` to get an independently
 * scoped tray backed by the same shared job-queue infrastructure.
 */
export const useReportExports = (config: ReportExportsConfig = {}) => {
  const reportType = config.reportType ?? EXPORT_REPORT_TYPE.BIZDONE;
  const label = config.label ?? "Biz Done Report";
  const eps = useMemo(
    () => ({ ...DEFAULT_ENDPOINTS, ...config.endpoints }),
    // config.endpoints is expected to be a stable reference (module-level
    // endPoints values) from call sites; re-derive only if the object itself changes.
    [config.endpoints]
  );

  const dispatch = useDispatch();
  const jobs = useSelector((state: any) => selectExportJobs(state, reportType));
  const unseenCount = useSelector((state: any) =>
    selectExportsUnseenCount(state, reportType)
  );
  const panelOpen = useSelector((state: any) =>
    selectExportsPanelOpen(state, reportType)
  );
  const inFlightIds = useSelector((state: any) =>
    selectInFlightExportIds(state, reportType)
  );
  const hasInFlight = inFlightIds.length > 0;

  const enqueueExport = useCallback(
    async (opts: EnqueueOptions = {}) => {
      try {
        const appliedFilters =
          opts.appliedFilters && opts.appliedFilters.length
            ? opts.appliedFilters
            : null;
        const appliedFiltersParam = appliedFilters
          ? `&appliedFilters=${encodeURIComponent(JSON.stringify(appliedFilters))}`
          : "";
        const url = opts.queryString
          ? `${eps.enqueue}?${opts.queryString}${appliedFiltersParam}`
          : eps.enqueue;
        // GET (not POST): the enqueue endpoint is a GET so it passes the same
        // export ACL permission the synchronous download uses.
        const body = await apiRequest(url, { method: "GET" });
        const jobId = body?.data?.jobId;
        const alreadyInProgress = body?.data?.alreadyInProgress === true;
        if (jobId != null) {
          // Parse the query we just sent so the card shows a filter summary
          // immediately, before the first status poll returns from the server.
          let filtersApplied: Record<string, any> | null = null;
          try {
            filtersApplied = opts.queryString
              ? Object.fromEntries(new URLSearchParams(opts.queryString))
              : null;
          } catch {
            filtersApplied = null;
          }
          dispatch(
            addExportJob({
              jobId,
              reportType,
              status: body?.data?.status ?? "PENDING",
              label: opts.label ?? label,
              createdAt: new Date().toISOString(),
              filtersApplied,
              // Show the applied-filter summary immediately (before the first
              // status poll), from the labels we just sent.
              filtersSummary: appliedFilters
                ? appliedFilters
                    .slice(0, 6)
                    .map((r) => r.value)
                    .join("  ·  ")
                : null,
              // Freshly generated in this session → auto-download when ready.
              autoDownload: true,
            })
          );
          dispatch(
            setToastMessage(
              alreadyInProgress
                ? EXPORT_TOAST.ALREADY_IN_PROGRESS
                : EXPORT_TOAST.PREPARING
            )
          );
        } else {
          dispatch(setToastMessage(EXPORT_TOAST.START_FAILED));
        }
      } catch (error) {
        dispatch(setToastMessage(EXPORT_TOAST.START_FAILED));
      }
    },
    [dispatch, eps.enqueue, label, reportType]
  );

  // Hydrate the panel from server history so it survives refresh / re-login.
  const refreshExports = useCallback(async () => {
    try {
      const body = await apiRequest(eps.list, {
        method: "GET",
      });
      const list = body?.data;
      if (Array.isArray(list) && list.length) {
        dispatch(upsertExportJobs(list as ExportJob[]));
      }
    } catch {
      /* silent — the panel just shows what it already has */
    }
  }, [dispatch, eps.list]);

  // Poll only the currently in-flight jobs. Since every id passed here was
  // in-flight, any that now report a terminal status just transitioned, so we
  // can toast on completion/failure without tracking previous state.
  const pollInFlight = useCallback(
    async (ids: number[]) => {
      if (!ids.length) return;
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const body = await apiRequest(eps.status(id), { method: "GET" });
            return body?.data as ExportJob | undefined;
          } catch {
            return undefined;
          }
        })
      );
      const valid = results.filter(Boolean) as ExportJob[];
      if (!valid.length) return;
      dispatch(upsertExportJobs(valid));
      valid.forEach((job) => {
        if (job.status === EXPORT_JOB_STATUS.COMPLETED) {
          dispatch(setToastMessage(EXPORT_TOAST.READY));
        } else if (job.status === EXPORT_JOB_STATUS.FAILED) {
          dispatch(setToastMessage(EXPORT_TOAST.FAILED));
        }
      });
    },
    [dispatch, eps.status]
  );

  const downloadExport = useCallback(
    async (job: ExportJob) => {
      try {
        const body = await apiRequest(eps.download(job.jobId), { method: "GET" });
        const { fileName, mimeType, buffer } = body?.data ?? {};
        if (!buffer) {
          throw new Error("Empty download response");
        }
        saveBufferAsFile(buffer, mimeType, fileName ?? `${job.label ?? label}.xlsx`);
      } catch {
        dispatch(setToastMessage(EXPORT_TOAST.DOWNLOAD_FAILED));
      }
    },
    [dispatch, eps.download, label]
  );

  const openPanel = useCallback(
    () => dispatch(setExportsPanelOpen({ open: true, reportType })),
    [dispatch, reportType]
  );
  const closePanel = useCallback(
    () => dispatch(setExportsPanelOpen({ open: false, reportType })),
    [dispatch, reportType]
  );
  const markAutoDownloaded = useCallback(
    (jobId: number) => dispatch(markAutoDownloadedAction(jobId)),
    [dispatch]
  );

  return {
    jobs,
    unseenCount,
    panelOpen,
    hasInFlight,
    enqueueExport,
    refreshExports,
    pollInFlight,
    downloadExport,
    openPanel,
    closePanel,
    markAutoDownloaded,
  };
};

export default useReportExports;
