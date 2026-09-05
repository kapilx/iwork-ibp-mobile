import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Collapse,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Typography,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { CalendarClock, CalendarDays, ChevronDown, ChevronsDownUp, ChevronsUpDown, Loader2, Mail, Users } from "lucide-react";
import { PortalHeroHeader } from "../HRPortal/controls";
import { endPoints } from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { useHRReport } from "../../hooks/useHRReport";
import { getCompanyId } from "../../utils/companyConfig";

type StatusRow = {
  periodId: number;
  // Every underlying document_processing_file.id merged into this row (same
  // policy + same dates, possibly multiple upload batches). Extend Enrolment
  // must update all of these, not just periodId.
  periodIds: number[];
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  policyId: number;
  policyName: string;
  policyNumber: string | null;
  total: number;
  enrolled: number;
  inProgress: number;
  notEnrolled: number;
};

type PeriodStats = {
  total: number;
  enrolled: number;
  inProgress: number;
  notEnrolled: number;
  enrolledPct: number;
  inProgressPct: number;
  notEnrolledPct: number;
};

type PeriodGroup = {
  periodStart: string;
  periodEnd: string;
  rows: StatusRow[];
  stats: PeriodStats;
};

const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

const computeStats = (rows: StatusRow[]): PeriodStats => {
  // Postgres COUNT(DISTINCT ...) comes back as a bigint, which the pg driver
  // serializes as a string — Number(...) here avoids "0" + "12" string
  // concatenation instead of numeric addition (row-level cells already do
  // this coercion before rendering; this is the same fix for the KPI sums).
  const total = rows.reduce((sum, r) => sum + Number(r.total ?? 0), 0);
  const enrolled = rows.reduce((sum, r) => sum + Number(r.enrolled ?? 0), 0);
  const inProgress = rows.reduce((sum, r) => sum + Number(r.inProgress ?? 0), 0);
  const notEnrolled = rows.reduce((sum, r) => sum + Number(r.notEnrolled ?? 0), 0);
  return {
    total,
    enrolled,
    inProgress,
    notEnrolled,
    enrolledPct: pct(enrolled, total),
    inProgressPct: pct(inProgress, total),
    notEnrolledPct: pct(notEnrolled, total),
  };
};

const STAT_CFG: { key: keyof StatusRow; label: string; color: string; bg: string }[] = [
  { key: "total",       label: "Total",        color: "#374151", bg: "#F3F4F6" },
  { key: "enrolled",    label: "Enroled",      color: "#16A34A", bg: "#DCFCE7" },
  { key: "inProgress",  label: "In Progress",  color: "#B45309", bg: "#FEF9C3" },
  { key: "notEnrolled", label: "Not Enroled",  color: "#B91C1C", bg: "#FEE2E2" },
];

// Percentage widths (sum to 100%) shared by the table's columns (Policy,
// Total, Enroled, In Progress, Not Enroled, Remind unenrolled) AND the
// accordion header row above it, so the period-level % chips in the header
// line up above their matching column at any screen width — percentages
// (rather than raw px) let both the header and the table scale together and
// still fill the full card width instead of leaving dead space on wide
// screens. minWidth is a floor so columns never get too cramped to read.
const COLUMN_WIDTHS: { width: string; minWidth: number }[] = [
  { width: "27%", minWidth: 220 }, // Policy
  { width: "10%", minWidth: 90 },  // Total
  { width: "15%", minWidth: 140 }, // Enroled
  { width: "15%", minWidth: 140 }, // In Progress
  { width: "15%", minWidth: 140 }, // Not Enroled
  { width: "17%", minWidth: 170 }, // Remind unenrolled
];

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// Smallest valid "new end date" — tomorrow. The backend floor is "tomorrow or
// later" regardless of the period's current end date, so a window can also be
// shortened, and a stale table can't offer a date the server would reject.
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Day after an ISO date — used only to prefill the picker with the most likely
// intent (extend by one day), never as the validation floor.
const dayAfter = (iso: string) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

function KpiCard({
  label,
  value,
  sub,
  color,
  bg,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  bg: string;
}) {
  const isNeutral = bg === "#F3F4F6";
  return (
    <Box sx={{ bgcolor: isNeutral ? "#fff" : bg, borderRadius: "14px", border: `1px solid ${isNeutral ? "#E5E7EB" : color}33`, px: 2.5, py: 2 }}>
      <Typography sx={{ fontSize: 16, color: "#6B7280", fontWeight: 600, mb: 0.75 }}>{label}</Typography>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
        <Typography sx={{ fontSize: 26, fontWeight: 700, color: isNeutral ? "#111827" : color }}>{value}</Typography>
        {sub && <Typography sx={{ fontSize: 14, color: "#6B7280" }}>({sub})</Typography>}
      </Box>
    </Box>
  );
}

// Same tinted-bg/colored-border visual language as KpiCard, but a real
// single-line chip (pill shape) sized to sit inline in a period header row.
function StatChip({ label, pctValue, color, bg }: { label: string; pctValue: number; color: string; bg: string }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 0.5,
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        bgcolor: bg,
        border: `1px solid ${color}33`,
        whiteSpace: "nowrap",
      }}
    >
      <Typography component="span" sx={{ fontSize: 14, fontWeight: 600, color }}>
        {label}:
      </Typography>
      <Typography component="span" sx={{ fontSize: 16, fontWeight: 700, color }}>
        {pctValue}%
      </Typography>
    </Box>
  );
}

export function HRPortalEnrollment({ companyId: companyIdProp }: { companyId?: number | null } = {}) {
  const companyId = (companyIdProp ?? getCompanyId() ?? null) as number | null;
  const navigate = useNavigate();

  const [reminderLoadingPolicyId, setReminderLoadingPolicyId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());
  const [extendModalGroup, setExtendModalGroup] = useState<PeriodGroup | null>(null);
  const [extendNewEndDate, setExtendNewEndDate] = useState("");
  const [extendSubmitting, setExtendSubmitting] = useState(false);
  const [extendError, setExtendError] = useState<string | null>(null);

  const { data: statusRows, isLoading: statusLoading, refetch: refetchStatus } = useHRReport<StatusRow>(
    "policy_enrollment_period_status_summary",
    { companyId: companyId ?? 0 },
    !!companyId,
    { limit: 0 }, // limit=0 = no pagination cap; without this the backend defaults to 10 rows
  );

  // Group the flat rows into period sections. Re-sorted by periodStart
  // (asc — oldest/soonest-closing period first) client-side rather than
  // trusting row order alone, in case two different periods share the same
  // start date and interleave in the backend's ORDER BY (start_date, policy_name).
  const periodGroups: PeriodGroup[] = useMemo(() => {
    const map = new Map<string, { periodStart: string; periodEnd: string; rows: StatusRow[] }>();
    for (const row of statusRows) {
      const key = `${row.periodStart}|${row.periodEnd}`;
      const existing = map.get(key);
      if (existing) existing.rows.push(row);
      else map.set(key, { periodStart: row.periodStart, periodEnd: row.periodEnd, rows: [row] });
    }
    return Array.from(map.values())
      .map((g) => ({ ...g, stats: computeStats(g.rows) }))
      .sort((a, b) => a.periodStart.localeCompare(b.periodStart));
  }, [statusRows]);

  // KPI totals across every drive/period combined.
  const overallStats: PeriodStats = useMemo(() => computeStats(statusRows), [statusRows]);

  const periodKey = (g: PeriodGroup) => `${g.periodStart}|${g.periodEnd}`;

  const togglePeriod = (key: string) => {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Same toggle behavior as the Portfolio page's Expand All/Collapse All —
  // any expanded -> collapse everything; none expanded -> expand everything.
  const toggleAllPeriods = () => {
    setExpandedPeriods(expandedPeriods.size > 0 ? new Set() : new Set(periodGroups.map(periodKey)));
  };

  const handleSendReminder = async (row: StatusRow) => {
    if (reminderLoadingPolicyId != null || row.enrolled === row.total) return;
    setReminderLoadingPolicyId(row.policyId);
    try {
      await apiRequest(endPoints.sendReminderEmail, {
        method: "POST",
        data: { policies: [row.policyId], forceImmediate: true, includeAllEmployees: true },
      });
      setToast({
        type: "success",
        text: `Reminder emails queued for ${row.notEnrolled} not-enroled employee${row.notEnrolled === 1 ? "" : "s"} on ${row.policyName}.`,
      });
    } catch {
      setToast({ type: "error", text: "Failed to send reminder emails. Please try again." });
    } finally {
      setReminderLoadingPolicyId(null);
    }
  };

  const openExtendModal = (group: PeriodGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setExtendModalGroup(group);
    // Prefill with the day after the current end date, but never below the
    // "tomorrow" floor — a period that already ended would otherwise prefill
    // with a date the server rejects.
    const prefill = dayAfter(group.periodEnd);
    const floor = tomorrow();
    setExtendNewEndDate(prefill > floor ? prefill : floor);
    setExtendError(null);
  };

  const closeExtendModal = () => {
    if (extendSubmitting) return;
    setExtendModalGroup(null);
    setExtendError(null);
  };

  const handleExtendSubmit = async () => {
    if (!extendModalGroup || !companyId) return;
    if (!extendNewEndDate || extendNewEndDate < tomorrow()) {
      setExtendError("New end date must be a future date.");
      return;
    }
    setExtendSubmitting(true);
    setExtendError(null);
    try {
      const periodIds = Array.from(new Set(extendModalGroup.rows.flatMap((r) => r.periodIds)));
      await apiRequest(endPoints.extendEnrollmentPeriod, {
        method: "PUT",
        // companyId's declared type is number|null, but it can actually arrive
        // as a string at runtime (e.g. via getCompanyId()'s sessionStorage
        // fallback) — the backend DTO's @IsInt() rejects a string outright, so
        // coerce explicitly rather than trust the static type.
        data: { companyId: Number(companyId), periodIds, newEndDate: extendNewEndDate },
      });
      const policyCount = extendModalGroup.rows.length;
      setToast({
        type: "success",
        text: `Enrolment extended to ${fmtDate(extendNewEndDate)} for ${policyCount} ${policyCount === 1 ? "Policy" : "Policies"}.`,
      });
      setExtendModalGroup(null);
      refetchStatus();
    } catch (err: any) {
      setExtendError(
        err?.response?.data?.message || err?.message || "Failed to extend enrolment. Please try again."
      );
    } finally {
      setExtendSubmitting(false);
    }
  };

  return (
    <Box sx={{ mx: -3, mt: -0.5, background: "#EBF6FF", display: "flex", flexDirection: "column" }}>
      <Box sx={{ position: "sticky", top: 0, zIndex: 0, background: "#EBF6FF", flexShrink: 0 }}>
        <PortalHeroHeader
          title="Enrolment Status"
          subtitle="Enrolment progress by period and policy, with reminders for pending policy enrolments."
          showLastSynced={false}
        />
      </Box>

      <Box sx={{ px: 4, py: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
        {statusLoading ? (
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", px: 3, py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Loader2 size={28} color="#1C57B8" style={{ animation: "spin 1s linear infinite" }} />
            <Typography sx={{ fontSize: 15, color: "#6B7280" }}>Loading enrolment status…</Typography>
          </Box>
        ) : periodGroups.length === 0 ? (
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", px: 3, py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={24} color="#9CA3AF" />
            </Box>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>No enrolment periods found for this company</Typography>
          </Box>
        ) : (
          <>
            {/* Overall KPIs — totals across every drive/period combined */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
              <KpiCard label="Total Enrolments" value={String(overallStats.total)} color="#374151" bg="#F3F4F6" />
              <KpiCard label="Enroled" value={`${overallStats.enrolledPct}%`} sub={`${overallStats.enrolled} enrolments`} color="#16A34A" bg="#DCFCE7" />
              <KpiCard label="In Progress" value={`${overallStats.inProgressPct}%`} sub={`${overallStats.inProgress} in progress`} color="#B45309" bg="#FEF9C3" />
              <KpiCard label="Not Enroled" value={`${overallStats.notEnrolledPct}%`} sub={`${overallStats.notEnrolled} pending`} color="#B91C1C" bg="#FEE2E2" />
            </Box>

            {/* Expand All / Collapse All control */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 15, color: "#6B7280" }}>
                {periodGroups.length} enrolment {periodGroups.length === 1 ? "period" : "periods"}
              </Typography>
              <Box
                onClick={toggleAllPeriods}
                sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.6, borderRadius: "8px", border: "1px solid #E5E7EB", bgcolor: "#fff", cursor: "pointer", "&:hover": { bgcolor: "#F3F4F6" } }}
              >
                {expandedPeriods.size > 0 ? (
                  <>
                    <ChevronsDownUp size={13} color="#6B7280" />
                    <Typography sx={{ fontSize: 15, color: "#6B7280", fontWeight: 500 }}>Collapse All</Typography>
                  </>
                ) : (
                  <>
                    <ChevronsUpDown size={13} color="#6B7280" />
                    <Typography sx={{ fontSize: 15, color: "#6B7280", fontWeight: 500 }}>Expand All</Typography>
                  </>
                )}
              </Box>
            </Box>

            {periodGroups.map((group) => {
              const key = periodKey(group);
              const isExpanded = expandedPeriods.has(key);
              return (
                <Box key={key} sx={{ bgcolor: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
                  <Box
                    onClick={() => togglePeriod(key)}
                    sx={{ px: 2, py: 2, borderBottom: isExpanded ? "1px solid #F3F4F6" : "none", display: "flex", alignItems: "center", bgcolor: "#F8FAFC", cursor: "pointer", "&:hover": { bgcolor: "#F0F4F8" } }}
                  >
                    {/* Each block below is the same fixed width as its matching table
                        column, so the period-level chips/actions line up with the
                        Total/Enroled/In Progress/Not Enroled/Remind columns beneath. */}
                    <Box sx={{ width: COLUMN_WIDTHS[0].width, minWidth: COLUMN_WIDTHS[0].minWidth, flexShrink: 0, display: "flex", alignItems: "center", gap: 1.25, overflow: "hidden" }}>
                      <CalendarDays size={16} color="#1C57B8" style={{ flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {fmtDate(group.periodStart)} – {fmtDate(group.periodEnd)}
                      </Typography>
                    </Box>
                    <Box sx={{ width: COLUMN_WIDTHS[1].width, minWidth: COLUMN_WIDTHS[1].minWidth, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                      <Box sx={{ px: 1.25, py: 0.3, borderRadius: 999, bgcolor: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {group.rows.length} {group.rows.length === 1 ? "Policy" : "Policies"}
                      </Box>
                    </Box>
                    <Box sx={{ width: COLUMN_WIDTHS[2].width, minWidth: COLUMN_WIDTHS[2].minWidth, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                      <StatChip label="Enroled" pctValue={group.stats.enrolledPct} color="#16A34A" bg="#DCFCE7" />
                    </Box>
                    <Box sx={{ width: COLUMN_WIDTHS[3].width, minWidth: COLUMN_WIDTHS[3].minWidth, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                      <StatChip label="In Progress" pctValue={group.stats.inProgressPct} color="#B45309" bg="#FEF9C3" />
                    </Box>
                    <Box sx={{ width: COLUMN_WIDTHS[4].width, minWidth: COLUMN_WIDTHS[4].minWidth, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                      <StatChip label="Not Enroled" pctValue={group.stats.notEnrolledPct} color="#B91C1C" bg="#FEE2E2" />
                    </Box>
                    <Box sx={{ width: COLUMN_WIDTHS[5].width, minWidth: COLUMN_WIDTHS[5].minWidth, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                      {(() => {
                        const fullyEnrolled = group.stats.enrolledPct === 100;
                        return (
                          <Box
                            onClick={(e) => !fullyEnrolled && openExtendModal(group, e)}
                            title={fullyEnrolled ? "Everyone in this drive is already enroled" : undefined}
                            sx={{
                              display: "inline-flex", alignItems: "center", gap: 0.6, height: 32, px: 1.5,
                              borderRadius: "8px", border: `1px solid ${fullyEnrolled ? "#E5E7EB" : "#BFDBFE"}`,
                              bgcolor: fullyEnrolled ? "#F3F4F6" : "#fff", color: fullyEnrolled ? "#9CA3AF" : "#1D4ED8",
                              fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
                              cursor: fullyEnrolled ? "not-allowed" : "pointer",
                              "&:hover": fullyEnrolled ? {} : { bgcolor: "#EFF6FF" },
                            }}
                          >
                            <CalendarClock size={14} />
                            Extend Enrolment
                          </Box>
                        );
                      })()}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "none" }}>
                      <ChevronDown size={16} color="#9CA3AF" />
                    </Box>
                  </Box>

                  <Collapse in={isExpanded} timeout={220} unmountOnExit>
                    <Box sx={{ overflowX: "auto" }}>
                      <Box component="table" sx={{ width: "100%", minWidth: COLUMN_WIDTHS.reduce((a, b) => a + b.minWidth, 0), tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, fontSize: 15, lineHeight: 1.7 }}>
                        <Box component="thead">
                          <Box component="tr" sx={{ bgcolor: "#4B6B8A" }}>
                            {["Policy", ...STAT_CFG.map((s) => s.label), "Remind unenrolled"].map((h, hi) => (
                              <Box component="th" key={hi} sx={{ width: COLUMN_WIDTHS[hi].width, minWidth: COLUMN_WIDTHS[hi].minWidth, px: 2, py: 1.5, textAlign: hi === 0 ? "left" : "center", fontSize: 15, fontWeight: 600, color: "#fff", whiteSpace: "nowrap" }}>
                                {h}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                        <Box component="tbody">
                          {group.rows.map((row, idx) => {
                            const isLast = idx === group.rows.length - 1;
                            // Disable once everyone is enrolled (total === enrolled) — covers
                            // In Progress too, not just Not Enrolled, so nobody left to remind.
                            const noReminderTargets = row.enrolled === row.total;
                            const sending = reminderLoadingPolicyId === row.policyId;
                            return (
                              <Box component="tr" key={`${row.periodId}-${row.policyId}`} sx={{ "&:hover": { bgcolor: "#F9FAFB" } }}>
                                <Box component="td" sx={{ px: 2, py: 2.25, borderBottom: isLast ? "none" : "1px solid #E5E7EB" }}>
                                  <Typography
                                    onClick={() => navigate(`/hr-portal/policy-summary/${row.policyId}?companyId=${companyId}`, { state: { tab: "enrollment" } })}
                                    sx={{ fontSize: 15, fontWeight: 600, color: "#1C57B8", cursor: "pointer", display: "inline-block", "&:hover": { textDecoration: "underline" } }}
                                  >
                                    {row.policyName}
                                  </Typography>
                                  <Typography sx={{ fontSize: 14, color: "#0a0a0a", fontWeight: 500 }}>
                                    {row.policyNumber || `POL-${row.policyId}`}
                                  </Typography>
                                </Box>
                                {STAT_CFG.map((cfg) => (
                                  <Box component="td" key={cfg.key} sx={{ px: 2, py: 2.25, textAlign: "center", borderBottom: isLast ? "none" : "1px solid #E5E7EB" }}>
                                    <Box sx={{ display: "inline-flex", minWidth: 44, justifyContent: "center", px: 1.25, py: 0.35, borderRadius: 999, bgcolor: cfg.bg }}>
                                      <Typography sx={{ fontSize: 15, fontWeight: 700, color: cfg.color }}>{Number(row[cfg.key] ?? 0)}</Typography>
                                    </Box>
                                  </Box>
                                ))}
                                <Box component="td" sx={{ px: 2, py: 2.25, textAlign: "center", borderBottom: isLast ? "none" : "1px solid #E5E7EB" }}>
                                  <Box
                                    onClick={() => handleSendReminder(row)}
                                    // title="Sends to every not-yet-enroled employee on this policy (not limited to this period)"
                                    sx={{
                                      display: "inline-flex", alignItems: "center", gap: 0.75, height: 34, px: 2,
                                      borderRadius: "8px", fontSize: 15, fontWeight: 600, whiteSpace: "nowrap",
                                      bgcolor: noReminderTargets || sending ? "#E5E7EB" : "#1C57B8",
                                      color: noReminderTargets || sending ? "#9CA3AF" : "#fff",
                                      cursor: noReminderTargets || sending ? "not-allowed" : "pointer",
                                      "&:hover": !noReminderTargets && !sending ? { bgcolor: "#163F8A" } : {},
                                    }}
                                  >
                                    {sending ? <CircularProgress size={13} sx={{ color: "inherit" }} /> : <Mail size={14} />}
                                    Send Reminder
                                  </Box>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </>
        )}
      </Box>

      <Dialog open={Boolean(extendModalGroup)} onClose={closeExtendModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 18, fontWeight: 700 }}>Extend Enrolment</DialogTitle>
        <DialogContent>
          {extendModalGroup && (
            <>
              <Typography sx={{ fontSize: 15, color: "#6B7280", mb: 2 }}>
                Current period: {fmtDate(extendModalGroup.periodStart)} – {fmtDate(extendModalGroup.periodEnd)}
                {" · "}
                {extendModalGroup.rows.length} {extendModalGroup.rows.length === 1 ? "policy" : "policies"} will be extended.
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="New enrolment end date"
                  format="DD/MM/YYYY"
                  value={extendNewEndDate ? dayjs(extendNewEndDate) : null}
                  onChange={(newValue) => setExtendNewEndDate(newValue ? newValue.format("YYYY-MM-DD") : "")}
                  minDate={dayjs(tomorrow())}
                  disabled={extendSubmitting}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      sx: { "& .MuiInputLabel-root": { color: "#000" } },
                    },
                  }}
                />
              </LocalizationProvider>
              {extendError && (
                <Typography sx={{ fontSize: 13, color: "#B91C1C", mt: 1 }}>{extendError}</Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeExtendModal} disabled={extendSubmitting} sx={{ textTransform: "none", color: "#6B7280" }}>
            Cancel
          </Button>
          <Button
            onClick={handleExtendSubmit}
            disabled={extendSubmitting}
            variant="contained"
            sx={{ textTransform: "none", bgcolor: "#1C57B8", "&:hover": { bgcolor: "#163F8A" } }}
          >
            {extendSubmitting ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Extend"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={4500} onClose={() => setToast(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast?.type ?? "info"} onClose={() => setToast(null)} sx={{ borderRadius: "10px" }}>
          {toast?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default HRPortalEnrollment;
