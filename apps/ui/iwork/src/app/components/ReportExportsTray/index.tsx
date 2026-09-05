import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { LinearProgress, Tooltip } from "@mui/material";
import downloadIcon from "@ui/ui-lib/assets/svgs/download-icon.svg";
import {
  ChipRenderer,
  Drawer,
  useReportExports,
  ReportExportsConfig,
  selectInFlightExportIds,
  EXPORT_REPORT_TYPE,
  ExportJob,
  EXPORT_JOB_STATUS,
  environment,
} from "@ui/ui-lib";
import { getStatusMeta, LATEST_CHIP_STYLE_MAP } from "./config";
import {
  DEFAULT_POLL_INTERVAL_MS,
  DRAWER_WIDTH,
  EXPORT_TRAY_TEXT,
  FAST_POLL_INTERVAL_MS,
  LATEST_CHIP_LABEL_STYLE,
} from "./constants";
import {
  formatDuration,
  formatExact,
  getLatestJobId,
  summarizeFilters,
} from "./utils";
import {
  CardBody,
  ContentWrapper,
  DownloadButton,
  DownloadIconImg,
  EmptyState,
  ListWrapper,
  MetaText,
  ReportCard,
  ReportTitle,
  RightColumn,
  SummaryText,
  TitleRow,
} from "./styles";

const POLL_INTERVAL_MS =
  environment.reportExportPollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

/**
 * Headless exports manager + Downloads drawer. Mounted per-module (BizDone,
 * SO, ...); defaults to BizDone's endpoints/reportType so existing mounts
 * (no props) are unaffected. Runs the background poller and renders the
 * "Your reports" drawer, opened by that module's "Downloads" button (via
 * panel-open state scoped to this instance's reportType).
 */
const ReportExportsTray = (props: ReportExportsConfig = {}) => {
  const reportType = props.reportType ?? EXPORT_REPORT_TYPE.BIZDONE;
  // Historical jobs (loaded via refreshExports) never carry a `label` — it's
  // only ever set client-side at enqueue time, never persisted to
  // user_bizdone_report — so every job in this tray falls back to the
  // *instance's own* configured label. Every job here already shares this
  // instance's reportType (selectExportJobs scopes it), so they all share the
  // same correct default; a single hardcoded string here would mislabel
  // every non-BizDone module's older jobs as "Biz Done Report".
  const defaultLabel = props.label ?? EXPORT_TRAY_TEXT.defaultReportLabel;
  const {
    jobs,
    refreshExports,
    pollInFlight,
    downloadExport,
    panelOpen,
    closePanel,
    markAutoDownloaded,
  } = useReportExports(props);
  const inFlightIds = useSelector((state: any) =>
    selectInFlightExportIds(state, reportType)
  );

  const isLoggedIn = Boolean(sessionStorage.getItem("user"));
  const inFlightRef = useRef<number[]>(inFlightIds);
  inFlightRef.current = inFlightIds;
  const autoDownloadedRef = useRef<Set<number>>(new Set());

  // Hydrate on mount and whenever the panel opens.
  useEffect(() => {
    if (isLoggedIn) refreshExports();
  }, [isLoggedIn, refreshExports]);
  useEffect(() => {
    if (panelOpen) refreshExports();
  }, [panelOpen, refreshExports]);

  // Background poller: ticks only while something is in-flight. Polls fast
  // while a job triggered THIS session (autoDownload) is still in-flight, so
  // auto-download fires within a couple seconds of real completion instead
  // of waiting out the slow cadence — that gap, not generation time, was
  // what made completed exports feel delayed. Falls back to the slow
  // cadence once nothing in-flight is one the user is actively watching for
  // (e.g. a stale in-progress job restored on reload).
  const hasWatchedInFlight = jobs.some(
    (job) => inFlightIds.includes(job.jobId) && job.autoDownload
  );
  useEffect(() => {
    if (!inFlightIds.length) return;
    const interval = setInterval(
      () => {
        pollInFlight(inFlightRef.current);
      },
      hasWatchedInFlight ? FAST_POLL_INTERVAL_MS : POLL_INTERVAL_MS
    );
    return () => clearInterval(interval);
  }, [inFlightIds.length, hasWatchedInFlight, pollInFlight]);

  // Auto-download reports generated this session, once each completes.
  useEffect(() => {
    jobs.forEach((job) => {
      if (
        job.status === EXPORT_JOB_STATUS.COMPLETED &&
        job.documentId != null &&
        job.autoDownload &&
        !autoDownloadedRef.current.has(job.jobId)
      ) {
        autoDownloadedRef.current.add(job.jobId);
        downloadExport(job);
        // Persist the "already downloaded" state so a tray remount on another
        // route never re-downloads it (the ref alone resets on remount).
        markAutoDownloaded(job.jobId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  if (!isLoggedIn) return null;

  const latestJobId = getLatestJobId(jobs);

  return (
    <Drawer
      open={panelOpen}
      onClose={closePanel}
      title={EXPORT_TRAY_TEXT.panelTitle}
      width={DRAWER_WIDTH}
      anchor="right"
    >
      <ContentWrapper>
        <ListWrapper>
          {jobs.length === 0 ? (
            <EmptyState>{EXPORT_TRAY_TEXT.emptyState}</EmptyState>
          ) : (
            jobs.map((job: ExportJob) => {
              const meta = getStatusMeta(job.status);
              const inProgress =
                job.status === EXPORT_JOB_STATUS.PENDING ||
                job.status === EXPORT_JOB_STATUS.PROCESSING;
              const summary =
                job.filtersSummary || summarizeFilters(job.filtersApplied);
              return (
                <ReportCard key={job.jobId} accent={meta.color}>
                  <meta.Icon sx={{ color: meta.color, mt: 0.25 }} fontSize="small" />
                  <CardBody>
                    <TitleRow>
                      <ReportTitle variant="body2" noWrap>
                        {job.label || defaultLabel}
                      </ReportTitle>
                      {job.jobId === latestJobId ? (
                        <ChipRenderer
                          value={EXPORT_TRAY_TEXT.latest}
                          size="small"
                          styleMap={LATEST_CHIP_STYLE_MAP}
                          ChipLabelContainerStyles={LATEST_CHIP_LABEL_STYLE}
                        />
                      ) : null}
                    </TitleRow>
                    {summary ? (
                      <SummaryText variant="caption">{summary}</SummaryText>
                    ) : null}
                    <MetaText variant="caption">
                      {formatExact(job.createdAt)}
                      {job.status === EXPORT_JOB_STATUS.COMPLETED &&
                      formatDuration(job.startedAt, job.completedAt)
                        ? ` · ${formatDuration(job.startedAt, job.completedAt)}`
                        : ""}
                    </MetaText>
                    {inProgress ? (
                      <LinearProgress sx={{ mt: 0.75, borderRadius: 1 }} />
                    ) : null}
                    {job.status === EXPORT_JOB_STATUS.FAILED ? (
                      <MetaText variant="caption" sx={{ mt: 0.5 }}>
                        {EXPORT_TRAY_TEXT.failedHint}
                      </MetaText>
                    ) : null}
                  </CardBody>
                  <RightColumn>
                    {job.status === EXPORT_JOB_STATUS.COMPLETED &&
                    job.documentId != null ? (
                      <Tooltip title={EXPORT_TRAY_TEXT.download}>
                        <DownloadButton
                          size="small"
                          aria-label={EXPORT_TRAY_TEXT.download}
                          onClick={() => downloadExport(job)}
                        >
                          <DownloadIconImg
                            src={downloadIcon}
                            alt={EXPORT_TRAY_TEXT.download}
                          />
                        </DownloadButton>
                      </Tooltip>
                    ) : null}
                  </RightColumn>
                </ReportCard>
              );
            })
          )}
        </ListWrapper>
      </ContentWrapper>
    </Drawer>
  );
};

export default ReportExportsTray;
