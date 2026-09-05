import { DataSource, In } from "typeorm";
import { ENV } from "../environment";
import {
  UserBizdoneReport,
} from "../entities/user-bizdone-report.entity";
import { FileUpload } from "../entities/file-upload.entity";
import {
  UserBizdoneReportStatus,
  UserBizdoneReportType,
} from "../constants";
import { getSignedUrl } from "./file-management.utils";

/**
 * Shared async-report-export job queue. Enqueue inserts a PENDING row and
 * fires the `generate` callback fire-and-forget (not awaited by the caller);
 * the client polls job status until it's COMPLETED/FAILED. No background
 * cron — a job stuck PENDING/PROCESSING past STUCK_JOB_THRESHOLD_MS is
 * lazily marked FAILED the next time it's read (dedup check, status poll,
 * or listing), so the user can just click "Generate Report" again.
 */

export type ReportExportGenerator = (
  filtersApplied: Record<string, any> | null | undefined,
  userId: number,
) => Promise<string>; // resolves to the generated file's S3 key

// A PENDING/PROCESSING job older than this (measured from startedAt once
// claimed, else createdAt) is treated as abandoned — no cron is coming to
// retry it, so every read path below fails it on sight instead.
const STUCK_JOB_THRESHOLD_MS = 30 * 60 * 1000;

function isJobStuck(job: UserBizdoneReport): boolean {
  if (
    job.status !== UserBizdoneReportStatus.PENDING &&
    job.status !== UserBizdoneReportStatus.PROCESSING
  ) {
    return false;
  }
  const since = job.startedAt ?? job.createdAt;
  return Date.now() - since.getTime() > STUCK_JOB_THRESHOLD_MS;
}

async function failStuckJob(
  dataSource: DataSource,
  job: UserBizdoneReport,
): Promise<UserBizdoneReport> {
  const errorMessage =
    "Export timed out with no update for 30 minutes — please generate again.";
  await markReportExportJobFailed(dataSource, job.id, errorMessage);
  return {
    ...job,
    status: UserBizdoneReportStatus.FAILED,
    errorMessage,
    startedAt: null,
  };
}

/**
 * Enqueue a new export job, or return the existing in-flight one if the same
 * user already has a PENDING/PROCESSING job of this reportType with the exact
 * same filters (dedup — a repeat click on "Generate Report" must not spawn a
 * second job for the same request). A stuck in-flight duplicate is failed
 * instead of reused, so a repeat click always gets a fresh job rather than
 * waiting on one that's never going to finish.
 */
export async function createReportExportJob(
  dataSource: DataSource,
  userId: number,
  reportType: UserBizdoneReportType,
  filtersApplied: Record<string, unknown>,
): Promise<{ job: UserBizdoneReport; reused: boolean }> {
  const repo = dataSource.getRepository(UserBizdoneReport);

  const inFlight = await repo.find({
    where: [
      { userId, reportType, status: UserBizdoneReportStatus.PENDING },
      { userId, reportType, status: UserBizdoneReportStatus.PROCESSING },
    ],
    order: { createdAt: "DESC" },
  });
  const target = JSON.stringify(filtersApplied ?? {});
  const duplicate = inFlight.find(
    (j) => JSON.stringify(j.filtersApplied ?? {}) === target,
  );
  if (duplicate) {
    if (isJobStuck(duplicate)) {
      await failStuckJob(dataSource, duplicate);
    } else {
      return { job: duplicate, reused: true };
    }
  }

  const job = repo.create({
    userId,
    filtersApplied,
    reportType,
    status: UserBizdoneReportStatus.PENDING,
  });
  const saved = await repo.save(job);
  return { job: saved, reused: false };
}

/** Fetch one export job for status polling, scoped to the requesting user. */
export async function getReportExportJob(
  dataSource: DataSource,
  id: number,
  userId: number,
): Promise<UserBizdoneReport | null> {
  const job = await dataSource.getRepository(UserBizdoneReport).findOne({
    where: { id, userId },
  });
  if (job && isJobStuck(job)) {
    return failStuckJob(dataSource, job);
  }
  return job;
}

/**
 * Recent export jobs for a user, newest first. Omitting `reportTypes` returns
 * every module's jobs — the original single cross-module "Downloads" tray
 * design, since every module's jobs live in the same table. Pass a
 * `reportTypes` list to scope a module-specific tray (e.g. the SO listing
 * page's Downloads panel showing only its own exports).
 */
export async function listReportExportJobs(
  dataSource: DataSource,
  userId: number,
  reportTypes?: UserBizdoneReportType[],
  limit = 20,
): Promise<UserBizdoneReport[]> {
  const jobs = await dataSource.getRepository(UserBizdoneReport).find({
    where: {
      userId,
      ...(reportTypes?.length ? { reportType: In(reportTypes) } : {}),
    },
    order: { createdAt: "DESC" },
    take: limit,
  });
  return Promise.all(
    jobs.map((job) => (isJobStuck(job) ? failStuckJob(dataSource, job) : job)),
  );
}

/**
 * Atomically claim one specific PENDING job by id — used by the
 * trigger-on-enqueue fire-and-forget path.
 */
export async function claimReportExportJob(
  dataSource: DataSource,
  id: number,
): Promise<UserBizdoneReport | null> {
  const repo = dataSource.getRepository(UserBizdoneReport);
  const claimed = await repo.update(
    { id, status: UserBizdoneReportStatus.PENDING },
    { status: UserBizdoneReportStatus.PROCESSING, startedAt: new Date() },
  );
  if (claimed.affected !== 1) {
    return null;
  }
  return repo.findOne({ where: { id } });
}

export async function markReportExportJobCompleted(
  dataSource: DataSource,
  id: number,
  documentId: number,
): Promise<void> {
  await dataSource.getRepository(UserBizdoneReport).update(
    { id },
    {
      status: UserBizdoneReportStatus.COMPLETED,
      documentId,
      completedAt: new Date(),
      errorMessage: null,
    },
  );
}

export async function markReportExportJobFailed(
  dataSource: DataSource,
  id: number,
  errorMessage: string,
): Promise<void> {
  await dataSource.getRepository(UserBizdoneReport).update(
    { id },
    {
      status: UserBizdoneReportStatus.FAILED,
      errorMessage: errorMessage?.slice(0, 2000),
      startedAt: null,
    },
  );
}

/**
 * Generate the report for a claimed job and record the outcome on the job
 * row. Never rethrows to a caller that can't act on it usefully — failures
 * are persisted so the client sees FAILED — but DOES rethrow after
 * persisting, so a caller that wants to log/monitor failures still can
 * (mirrors the original policy-service behavior).
 */
export async function processReportExportJob(
  dataSource: DataSource,
  job: { id: number; userId: number; filtersApplied?: Record<string, any> | null },
  generate: ReportExportGenerator,
): Promise<void> {
  try {
    const fileKey = await generate(job.filtersApplied, job.userId);
    if (!fileKey) {
      throw new Error("Report generation returned no file key");
    }
    const fileUploadRepo = dataSource.getRepository(FileUpload);
    const fileUpload = await fileUploadRepo.save(
      fileUploadRepo.create({
        fileKey,
        uploadType: "AWS",
        documentTypeLid: 0,
        createdBy: job.userId,
        updatedBy: job.userId,
      }),
    );
    await markReportExportJobCompleted(dataSource, job.id, fileUpload.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report export failed";
    await markReportExportJobFailed(dataSource, job.id, message);
    throw error;
  }
}

/**
 * Claim-then-generate for the fire-and-forget trigger-on-enqueue path. Never
 * rethrows — this is always invoked as `void triggerReportExportJob(...)` by
 * enqueueReportExportJob (not awaited), so an uncaught rejection here would
 * surface as an unhandled promise rejection in the process instead of a
 * logged, actionable error. processReportExportJob already persisted the
 * FAILED status on the job row before this catch runs; this only prevents the
 * rethrow from escaping with nothing listening for it.
 */
export async function triggerReportExportJob(
  dataSource: DataSource,
  jobId: number,
  generate: ReportExportGenerator,
): Promise<void> {
  try {
    const job = await claimReportExportJob(dataSource, jobId);
    if (!job) {
      return;
    }
    await processReportExportJob(dataSource, job, generate);
  } catch (error) {
    console.error("Error in triggerReportExportJob:", error);
  }
}

/**
 * Enqueue + immediately attempt generation (fire-and-forget — not awaited by
 * the caller past the enqueue itself). Returns instantly regardless of report
 * size. If this in-process trigger never runs (e.g. the pod is killed right
 * after enqueue), the job just sits PENDING until isJobStuck() catches it on
 * the next status poll/listing/dedup check — no cron retries it.
 */
export async function enqueueReportExportJob(
  dataSource: DataSource,
  userId: number,
  reportType: UserBizdoneReportType,
  filtersApplied: Record<string, unknown>,
  generate: ReportExportGenerator,
): Promise<{ jobId: number; status: string; alreadyInProgress: boolean }> {
  const { job, reused } = await createReportExportJob(
    dataSource,
    userId,
    reportType,
    filtersApplied,
  );
  if (!reused) {
    void triggerReportExportJob(dataSource, job.id, generate);
  }
  return { jobId: job.id, status: job.status, alreadyInProgress: reused };
}

// Recover the S3 object key from a (possibly expired) pre-signed URL, handling
// both virtual-hosted (bucket in host) and path-style (bucket in path) URLs.
function s3KeyFromUrl(url: string): string | null {
  try {
    const path = decodeURIComponent(new URL(url).pathname).replace(/^\/+/, "");
    const bucket = ENV.S3_AWS_BUCKET;
    const key =
      bucket && path.startsWith(`${bucket}/`)
        ? path.slice(bucket.length + 1)
        : path;
    return key || null;
  } catch {
    return null;
  }
}

/**
 * Resolve whatever is stored on the job down to an S3 key, then ALWAYS mint a
 * fresh pre-signed URL — never return a stored URL directly. `stored` is
 * either a `UserBizdoneReport.documentId` (FileUpload id, now always an
 * integer) or, from the synchronous getPolicyReport path, a raw S3 key
 * string. Legacy rows that held a full pre-signed URL directly have all been
 * backfilled into `file_uploads` (see backfill-legacy-bizdone-report-file-
 * uploads.sql), but the https branch stays as a defensive fallback.
 */
export async function toReportDownloadUrl(
  dataSource: DataSource,
  stored?: string | number | null,
): Promise<string | null> {
  if (!stored) return null;
  try {
    const value = typeof stored === "number" ? String(stored) : stored;
    let key: string | null;
    if (/^\d+$/.test(value)) {
      const fileUpload = await dataSource
        .getRepository(FileUpload)
        .findOne({ where: { id: Number(value) } });
      key = fileUpload?.fileKey ?? null;
    } else if (/^https?:\/\//i.test(value)) {
      key = s3KeyFromUrl(value);
    } else {
      key = value;
    }
    if (!key) return null;
    return await getSignedUrl(key, { expiresSeconds: 60 * 60 });
  } catch {
    return null;
  }
}

/**
 * The frontend sends the already-resolved applied filters (labels included,
 * exactly as shown in the smart-search Applied Filters), stored on the job as
 * `filtersApplied.appliedFilters` (a JSON string). Parse it back into rows for
 * the Applied Filters sheet and the Downloads-panel summary — no server-side
 * id->name resolution needed. Generic across every report type.
 */
export function parseReportAppliedFilters(
  raw: unknown,
): { filter: string; value: string }[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr
        .filter(
          (r) =>
            r &&
            typeof r.filter === "string" &&
            typeof r.value === "string" &&
            r.value.trim() !== "",
        )
        .map((r) => ({ filter: r.filter, value: r.value }));
    }
  } catch {
    // Malformed payload — fall through to empty.
  }
  return [];
}

/**
 * JSON array of `{ key, label }` (the requester's Table Settings config,
 * sent as `columns` on the enqueue query) to scope the export sheet to
 * exactly what's visible on screen, with the same header labels shown in
 * the grid/Table Settings — rather than every field on the row under a
 * formatted-field-name header. Absent/malformed -> undefined, so callers
 * fall back to exporting every field.
 */
export function parseReportColumns(
  raw: unknown,
): { key: string; label: string }[] | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return undefined;
    const columns = arr
      .filter(
        (c) => c && typeof c.key === "string" && typeof c.label === "string",
      )
      .map((c) => ({ key: c.key, label: c.label }));
    return columns.length ? columns : undefined;
  } catch {
    return undefined;
  }
}

/** Concise one-line summary for the Downloads-panel card. */
export function summaryFromAppliedReportFilters(
  rows: { filter: string; value: string }[],
): string {
  return rows
    .slice(0, 6)
    .map((r) => r.value)
    .join("  ·  ");
}

/**
 * Status of a queued export, for the frontend to poll. Scoped to the
 * requesting user. Returns `documentId` (the FileUpload id), never a signed
 * S3 URL — the client fetches the actual file through the module's own
 * .../export/:jobId/download route, which re-validates ownership via
 * getReportExportJob before ever touching S3. Minting a signed URL here and
 * handing it back in a JSON response would leak a working (if time-limited)
 * direct-to-S3 link to anyone who can read the response/browser history.
 */
export async function getReportExportStatus(
  dataSource: DataSource,
  jobId: number,
  userId: number,
): Promise<{
  jobId: number;
  reportType: UserBizdoneReportType;
  status: UserBizdoneReportStatus;
  documentId: number | null;
  errorMessage: string | null;
  filtersApplied: Record<string, unknown> | null;
  filtersSummary: string;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
} | null> {
  const job = await getReportExportJob(dataSource, jobId, userId);
  if (!job) {
    return null;
  }
  const applied = parseReportAppliedFilters(
    (job.filtersApplied as Record<string, any> | null)?.appliedFilters,
  );
  return {
    jobId: job.id,
    reportType: job.reportType,
    status: job.status,
    documentId: job.documentId ?? null,
    errorMessage: job.errorMessage ?? null,
    filtersApplied: job.filtersApplied ?? null,
    filtersSummary: summaryFromAppliedReportFilters(applied),
    createdAt: job.createdAt,
    startedAt: job.startedAt ?? null,
    completedAt: job.completedAt ?? null,
  };
}

/**
 * Recent exports for the requesting user, for the Downloads panel. Omitting
 * `reportTypes` spans every module; pass a list to scope to a single module's
 * tray (see listReportExportJobs). Returns `documentId`, not a signed URL —
 * see getReportExportStatus.
 */
export async function listReportExports(
  dataSource: DataSource,
  userId: number,
  reportTypes?: UserBizdoneReportType[],
) {
  const jobs = await listReportExportJobs(dataSource, userId, reportTypes);
  return jobs.map((job) => {
    const applied = parseReportAppliedFilters(
      (job.filtersApplied as Record<string, any> | null)?.appliedFilters,
    );
    return {
      jobId: job.id,
      reportType: job.reportType,
      status: job.status,
      documentId: job.documentId ?? null,
      errorMessage: job.errorMessage ?? null,
      filtersApplied: job.filtersApplied ?? null,
      filtersSummary: summaryFromAppliedReportFilters(applied),
      createdAt: job.createdAt,
      startedAt: job.startedAt ?? null,
      completedAt: job.completedAt ?? null,
    };
  });
}
