// Pure formatting helpers for the report-exports tray.
import { ExportJob } from "@ui/ui-lib";
import { FILTER_SUMMARY_FIELDS } from "./config";
import { MAX_SUMMARY_PARTS, SUMMARY_SKIP_KEYS } from "./constants";

/**
 * Client-side filter summary (fallback when the server summary with resolved
 * names is not yet available). Bracket-aware so multi-value fields survive.
 */
export const summarizeFilters = (
  filters?: Record<string, any> | null
): string => {
  if (!filters) return "";
  const map: Record<string, string> = {};
  const search = typeof filters.search === "string" ? filters.search : "";
  const re = /([a-zA-Z0-9_]+):\[([^\]]*)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(search)) !== null) {
    if (m[2] && m[2].trim()) map[m[1]] = m[2].trim();
  }
  const skip = new Set(SUMMARY_SKIP_KEYS);
  Object.entries(filters).forEach(([k, v]) => {
    if (skip.has(k) || v == null || typeof v === "object") return;
    if (!(k in map)) map[k] = String(v);
  });

  // "YYYY-MM-DD" -> "DD/MM/YYYY"; anything else (a non-date from/to filter,
  // e.g. a numeric range) passes through unchanged.
  const toDisplayDate = (value: string): string => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
  };

  const parts: string[] = [];
  if (map.from && map.to)
    parts.push(`${toDisplayDate(map.from)} → ${toDisplayDate(map.to)}`);
  for (const { key, fmt } of FILTER_SUMMARY_FIELDS) {
    if (parts.length >= MAX_SUMMARY_PARTS) break;
    if (map[key]) parts.push(fmt(map[key]));
  }
  return parts.join("  ·  ");
};

export const formatExact = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
  const timePart = d.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart}`;
};


/** How long generation took, from the worker claiming the job to completion. */
export const formatDuration = (
  startedAt?: string | null,
  completedAt?: string | null
): string => {
  if (!startedAt || !completedAt) return "";
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return "";
  const totalSecs = Math.round((end - start) / 1000);
  if (totalSecs < 60) return `Took ${totalSecs}s`;
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return secs ? `Took ${mins}m ${secs}s` : `Took ${mins}m`;
};

/** The newest report by creation time (for the "Latest" badge). */
export const getLatestJobId = (jobs: ExportJob[]): number | undefined =>
  jobs.reduce<ExportJob | null>((latest, j) => {
    if (!latest) return j;
    return new Date(j.createdAt ?? 0).getTime() >
      new Date(latest.createdAt ?? 0).getTime()
      ? j
      : latest;
  }, null)?.jobId;

