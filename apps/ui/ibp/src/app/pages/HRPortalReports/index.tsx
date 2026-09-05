import { Box, CircularProgress, ClickAwayListener, Paper, Typography } from "@mui/material";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Download,
  FileSpreadsheet,
  LayoutGrid,
  MapPin,
  Search,
  Shield,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ReportBadge } from "../../components/ReportBadge";
import {
  ALL_REPORTS,
  CATEGORIES,
  type CategoryDef,
  type Column,
  type ReportDef,
} from "../../components/HRReports/data";
import {
  PORTAL_DATE_OPTIONS,
  PortalActionButton,
  PortalControlBar,
  PortalHeroHeader,
  PortalSearchField,
  PortalSelectControl,
  PORTAL_HEADER_TITLE_SX,
} from "../HRPortal/controls";
import {
  SectionCard,
  StyledTable,
  StyledTd,
  StyledTh,
} from "../HRPortal/styles";
import {
  endPoints,
  formatNumberByLocalization,
  getCurrencySymbolPrefix,
  type LocalizationConfig,
  useLocalization,
} from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { useHRReport } from "../../hooks/useHRReport";
import { getCompanyId } from "../../utils/companyConfig";

type ViewMode = "categories" | "detail";

function buildReportParams(
  reportKey: string,
  companyId: number,
  extra: Record<string, string> = {},
  locationIds = ""
): Record<string, unknown> {
  switch (reportKey) {
    case "endorsement_list":
      return { companyId, policyId: extra.policyId ?? "", locationIds };
    case "ibp_hr_employee_listing":
      return {
        companyId,
        policyIds: extra.policyIds ?? "",
        enrollStatus: extra.enrollStatus ?? "",
        enrollmentPeriodIds: extra.enrollmentPeriodIds ?? "",
      };
    case "company_policy_details_summary":
      return { companyId, locationIds };
    case "employee_login_activity":
      return {
        companyId,
        policyId: extra.policyId ?? "",
        enrollmentPeriodId: extra.enrollmentPeriodId ?? "",
      };
    default:
      return { companyId, locationIds };
  }
}

function buildClaimHistoryParams(policyId: number, claimStatus = "", claimType = "", locationIds = ""): Record<string, unknown> {
  return {
    policyId: String(policyId),
    claimStatus,
    claimType,
    locationIds,
    // Remaining params sent as empty strings so SQL conditions (e.g. ###tat### = '')
    // evaluate to TRUE rather than NULL = '' which blocks all rows.
    employeeId: "",
    claimDateFrom: "",
    claimDateTo: "",
    claimNo: "",
    search: "",
    settlementDateFrom: "",
    settlementDateTo: "",
    amountMin: "",
    amountMax: "",
    tat: "",
    startYear: "",
    endYear: "",
  };
}

function computeDynamicStats(
  reportKey: string,
  rows: Record<string, unknown>[],
  localization?: LocalizationConfig
): { label: string; value: string }[] | null {
  if (!rows.length) return null;

  if (reportKey === "ibp_hr_employee_listing") {
    const enrolled = rows.filter((r) =>
      String(r.enrollStatus ?? "").includes("_ENROLLED") &&
      !String(r.enrollStatus ?? "").includes("NOT_STARTED")
    ).length;
    const pending = rows.length - enrolled;
    return [
      { label: "Total Employees", value: formatNumberByLocalization(rows.length, localization) },
      { label: "Enrolled", value: formatNumberByLocalization(enrolled, localization) },
      { label: "Pending", value: formatNumberByLocalization(pending, localization) },
    ];
  }

  if (reportKey === "policy_claim_history") {
    const settled = rows.filter(
      (r) => String(r.status ?? "").toLowerCase() === "settled"
    ).length;
    const amounts = rows
      .map((r) => Number(r.claimedAmount ?? r.approvedAmount ?? 0))
      .filter((n) => n > 0);
    const avg = amounts.length
      ? Math.round(amounts.reduce((s, n) => s + n, 0) / amounts.length)
      : 0;
    const avgFormatted = avg
      ? `${getCurrencySymbolPrefix(localization)}${(avg / 1000).toFixed(1).replace(/\.0$/, "")}K`
      : "—";
    return [
      { label: "Total Claims", value: formatNumberByLocalization(rows.length, localization) },
      { label: "Settled", value: formatNumberByLocalization(settled, localization) },
      { label: "Avg Claimed", value: avgFormatted },
    ];
  }

  if (reportKey === "endorsement_list") {
    const totalUploads = rows.reduce(
      (s, r) => s + (Number(r.uploadCount) || 0),
      0
    );
    const totalProcessed = rows.reduce(
      (s, r) => s + (Number(r.totalSuccessCount) || 0),
      0
    );
    return [
      { label: "Total Endorsements", value: formatNumberByLocalization(rows.length, localization) },
      { label: "Total Uploads", value: formatNumberByLocalization(totalUploads, localization) },
      { label: "Processed", value: formatNumberByLocalization(totalProcessed, localization) },
    ];
  }

  return null;
}

function formatDate(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function cellValue(column: Column, row: Record<string, unknown>): string {
  const v = row[column.key];
  if (column.type === "date") return formatDate(v);
  return String(v ?? "");
}

async function downloadReportFromApi(
  reportKey: string,
  params: Record<string, unknown>
): Promise<void> {
  const response = await apiRequest(endPoints.downloadHRReports + reportKey, {
    method: "POST",
    data: params,
    responseType: "blob",
  });
  const blob: Blob = response.data;
  const disposition: string = response.headers?.["content-disposition"] ?? "";
  const filename = disposition.match(/filename=(.+)/)?.[1] ?? `${reportKey}.csv`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const CATEGORY_ORDER = [
  "endorsement",
  "employees",
  "claims",
  "finance",
  "communication",
] as const;

const CATEGORY_TITLE: Record<string, string> = {
  employees: "Employee Reports",
  claims: "Claim Reports",
  endorsement: "Endorsement Reports",
  finance: "Finance Reports",
  communication: "Communication Reports",
};

const CATEGORY_SUBTITLE: Record<string, string> = {
  employees: "Employee Reports",
  claims: "Claim Reports",
  endorsement: "Endorsement Reports",
  finance: "Finance Reports",
  communication: "Communications Reports",
};

function iconForList(report: ReportDef) {
  return report.icon ?? FileSpreadsheet;
}

const SELECT_SX = {
  width: "100%",
  height: 32,
  px: 1.25,
  borderRadius: "7px",
  border: "1px solid #D0D5DD",
  bgcolor: "#fff",
  fontSize: 15, lineHeight: 1.7,
  color: "#374151",
  fontFamily: "inherit",
  outline: "none",
  cursor: "pointer",
  appearance: "none",
  pr: "26px",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 7px center",
  "&:focus": { borderColor: "#1C57B8" },
};

type PolicyOption = { policyId: number; policyName: string };

// Single-select searchable dropdown — same visual language (search box,
// scrollable list, portal + fixed-position panel that escapes card clipping)
// as the "Policy Location" filter, but for single-value fields like Policy /
// Enrollment Period where one click both selects and closes.
function SearchableSelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  allOptionLabel,
}: {
  label: string;
  value: number | null;
  onChange: (id: number | null) => void;
  options: { id: number; label: string; sublabel?: string }[];
  placeholder: string;
  disabled?: boolean;
  // When set, renders a leading "All ..." row that clears the selection back
  // to null — used where null is a valid, immediately-runnable choice (e.g.
  // "All Policies") rather than an incomplete "please select one" state.
  allOptionLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => { setOpen(false); setSearch(""); }, []);

  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) { close(); return; }
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, close]);

  const filtered = useMemo(() =>
    search.trim()
      ? options.filter((o) => `${o.label} ${o.sublabel ?? ""}`.toLowerCase().includes(search.toLowerCase()))
      : options,
    [options, search]
  );

  const selected = options.find((o) => o.id === value);

  return (
    <Box>
      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085", fontWeight: 500, mb: 0.75 }}>{label}</Typography>
      <Box
        ref={triggerRef}
        onClick={() => {
          if (disabled) return;
          const rect = triggerRef.current?.getBoundingClientRect();
          if (rect) setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
          setOpen((o) => !o);
        }}
        sx={{
          ...SELECT_SX,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer", userSelect: "none",
          backgroundImage: "none", pr: 1.25,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: selected || (allOptionLabel && value === null && !disabled) ? "#374151" : "#9CA3AF" }}>
          {selected ? selected.label : allOptionLabel && value === null && !disabled ? allOptionLabel : placeholder}
        </Box>
        <ChevronDown size={13} style={{ flexShrink: 0, opacity: 0.7, marginLeft: 6 }} />
      </Box>

      {open && pos && createPortal(
        <ClickAwayListener onClickAway={close}>
          <Paper
            sx={{
              position: "fixed", top: pos.top, left: pos.left, zIndex: 1300,
              display: "flex", flexDirection: "column",
              height: 300, width: Math.max(pos.width, 260),
              border: "1px solid #E5E7EB", borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden",
            }}
          >
            <Box sx={{ px: 1.5, pt: 1.5, pb: 1, borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, bgcolor: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px", px: 1.25, py: 0.6 }} onKeyDown={(e) => e.stopPropagation()}>
                <Search size={12} color="#9CA3AF" style={{ flexShrink: 0 }} />
                <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#111827", width: "100%" }} />
              </Box>
            </Box>
            {allOptionLabel && (
              <Box
                onClick={() => { onChange(null); close(); }}
                sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.85, cursor: "pointer", flexShrink: 0, bgcolor: value === null ? "#EBF3FF" : "transparent", "&:hover": { bgcolor: "#F0F6FF" }, borderBottom: "1px solid #F3F4F6" }}
              >
                <Box sx={{ width: 14, height: 14, borderRadius: "50%", border: value === null ? "none" : "1.5px solid #D1D5DB", bgcolor: value === null ? "#1C57B8" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {value === null && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#fff" }} />}
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{allOptionLabel}</Typography>
              </Box>
            )}
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#D1D5DB", borderRadius: 4 } }}>
              {filtered.length === 0 ? (
                <Box sx={{ px: 2, py: 2, textAlign: "center" }}><Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>No options found</Typography></Box>
              ) : filtered.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <Box
                    key={opt.id}
                    onClick={() => { onChange(opt.id); close(); }}
                    sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.85, cursor: "pointer", bgcolor: isSelected ? "#EBF3FF" : "transparent", "&:hover": { bgcolor: "#F0F6FF" }, borderBottom: "1px solid #F9FAFB" }}
                  >
                    <Box sx={{ width: 14, height: 14, borderRadius: "50%", border: isSelected ? "none" : "1.5px solid #D1D5DB", bgcolor: isSelected ? "#1C57B8" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {isSelected && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#fff" }} />}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, color: isSelected ? "#1C57B8" : "#374151", fontWeight: 600 }}>{opt.label}</Typography>
                      {opt.sublabel && <Typography sx={{ fontSize: 11, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt.sublabel}</Typography>}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </ClickAwayListener>,
        document.body
      )}
    </Box>
  );
}

function ReportCard({
  report,
  companyId,
  policies,
  globalPolicyId,
  locationIds = "",
  locationOptions = [],
}: {
  report: ReportDef;
  companyId: number | null;
  policies: PolicyOption[];
  globalPolicyId?: number | null;
  locationIds?: string;
  locationOptions?: { id: number; location_code: string; addr_1?: string }[];
}) {
  const { localizationData } = useLocalization();
  const [expanded, setExpanded] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(globalPolicyId ?? null);

  // Sync with global filter when it changes (pre-select, but allow local override).
  // Also reset on companyId change — otherwise switching companies leaves a
  // stale policyId selected, which in turn never triggers the enrollment
  // period reset below (that effect only fires when selectedPolicyId itself
  // changes value).
  useEffect(() => {
    setSelectedPolicyId(globalPolicyId ?? null);
  }, [globalPolicyId, companyId]);
  const [claimType, setClaimType] = useState("");
  const [claimStatus, setClaimStatus] = useState("");
  const [enrollStatus, setEnrollStatus] = useState("");

  // Per-card location filter — initialized from parent, overridable locally
  const [cardLocationIds, setCardLocationIds] = useState(locationIds);
  useEffect(() => {
    setCardLocationIds(locationIds);
    setCardPendingLocIds(locationIds ? locationIds.split(",").map(Number).filter(Boolean) : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationIds]);

  const [cardLocMenuOpen, setCardLocMenuOpen] = useState(false);
  const [cardLocMenuPos, setCardLocMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [cardLocationSearch, setCardLocationSearch] = useState("");
  const [cardPendingLocIds, setCardPendingLocIds] = useState<number[]>(() =>
    locationIds ? locationIds.split(",").map(Number).filter(Boolean) : []
  );
  const cardLocMenuRef = useRef<HTMLDivElement>(null);

  const closeCardLocMenu = useCallback(() => {
    setCardLocMenuOpen(false);
    setCardLocationSearch("");
  }, []);

  // Track the trigger's position while open, so the panel follows it as the
  // page scrolls instead of being left stranded (stale position clashing with
  // whatever scrolls underneath it). Capture phase so this also fires for
  // scrolls inside nested scroll containers (e.g. the card list itself), but
  // scrolling WITHIN the dropdown's own location list doesn't move the
  // trigger, so it recomputes to the same position — no closing, no drift.
  // Only close if the trigger has scrolled out of the viewport entirely.
  useEffect(() => {
    if (!cardLocMenuOpen) return;
    const reposition = () => {
      const rect = cardLocMenuRef.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) {
        closeCardLocMenu();
        return;
      }
      setCardLocMenuPos({ top: rect.bottom + 4, left: rect.left });
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [cardLocMenuOpen, closeCardLocMenu]);

  const applyCardLocation = useCallback(() => {
    setCardLocationIds(cardPendingLocIds.length ? cardPendingLocIds.join(",") : "");
    closeCardLocMenu();
  }, [cardPendingLocIds, closeCardLocMenu]);

  const cardSelectedLocLabel = useMemo(() => {
    if (!cardLocationIds) return "All Locations";
    const ids = cardLocationIds.split(",").map(Number).filter(Boolean);
    if (ids.length === 1) {
      const o = locationOptions.find((opt) => opt.id === ids[0]);
      return o ? (o.addr_1 ? `${o.location_code} — ${o.addr_1}` : o.location_code) : "1 Location";
    }
    return `${ids.length} Locations`;
  }, [cardLocationIds, locationOptions]);

  const filteredCardLocOpts = useMemo(() =>
    cardLocationSearch.trim()
      ? locationOptions.filter((o) =>
          `${o.location_code ?? ""} ${o.addr_1 ?? ""}`.toLowerCase().includes(cardLocationSearch.toLowerCase())
        )
      : locationOptions,
    [locationOptions, cardLocationSearch]
  );

  const isDisabled = !report.reportKey;
  const isClaimHistory = report.reportKey === "policy_claim_history";
  const isEnrollment = report.reportKey === "ibp_hr_employee_listing";
  const isLoginActivity = report.reportKey === "employee_login_activity";

  // Login activity is scoped to one policy's one enrollment period — both
  // must be picked before the report can run.
  const [selectedEnrollmentPeriodId, setSelectedEnrollmentPeriodId] = useState<number | null>(null);
  // Login activity: reset period when policy changes
  useEffect(() => { if (isLoginActivity) setSelectedEnrollmentPeriodId(null); }, [selectedPolicyId, isLoginActivity]);

  // Enrollment report: multi-select period IDs
  const [selectedEnrollmentPeriodIds, setSelectedEnrollmentPeriodIds] = useState<number[]>([]);
  // Enrollment report: multi-select policy IDs — reset when selected periods change
  const [selectedEnrollmentPolicyIds, setSelectedEnrollmentPolicyIds] = useState<number[]>([]);
  const enrollmentPeriodIdsKey = selectedEnrollmentPeriodIds.join(",");
  useEffect(() => { setSelectedEnrollmentPolicyIds([]); }, [enrollmentPeriodIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  type EnrollmentPeriodOption = { periodId: number; label: string; enrollmentStartDate: string; enrollmentEndDate: string };

  // Login activity: enrollment periods filtered by selected policy (original chain)
  const { data: enrollmentPeriods } = useHRReport<EnrollmentPeriodOption>(
    "policy_enrollment_periods",
    { policyId: String(selectedPolicyId ?? "") },
    isLoginActivity && !!selectedPolicyId,
    { limit: 0 }
  );

  // Enrollment report: all enrollment periods for the company
  const { data: enrollmentPeriodsByCompany } = useHRReport<EnrollmentPeriodOption>(
    "policy_enrollment_periods_by_company",
    { companyId: String(companyId ?? "") },
    isEnrollment && !!companyId,
    { limit: 0 }
  );

  // Enrollment report: policies in the selected periods (or all when no period selected)
  type PolicyForPeriodOption = { policyId: number; policyName: string; policyNumber: string; policyFrom: string; policyTo: string };
  const { data: policiesForPeriod } = useHRReport<PolicyForPeriodOption>(
    "policy_list_for_enrollment_period",
    { companyId: String(companyId ?? ""), enrollmentPeriodIds: enrollmentPeriodIdsKey },
    isEnrollment && !!companyId,
    { limit: 0 }
  );

  // ── Enrollment period multi-select dropdown ───────────────────────────────
  const [enrollPeriodMenuOpen, setEnrollPeriodMenuOpen] = useState(false);
  const [enrollPeriodMenuPos, setEnrollPeriodMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [pendingEnrollPeriodIds, setPendingEnrollPeriodIds] = useState<number[]>([]);
  const enrollPeriodMenuRef = useRef<HTMLDivElement>(null);

  const closeEnrollPeriodMenu = useCallback(() => { setEnrollPeriodMenuOpen(false); }, []);

  useEffect(() => {
    if (!enrollPeriodMenuOpen) return;
    const reposition = () => {
      const rect = enrollPeriodMenuRef.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) { closeEnrollPeriodMenu(); return; }
      setEnrollPeriodMenuPos({ top: rect.bottom + 4, left: rect.left });
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => { window.removeEventListener("scroll", reposition, true); window.removeEventListener("resize", reposition); };
  }, [enrollPeriodMenuOpen, closeEnrollPeriodMenu]);

  const applyEnrollPeriods = useCallback(() => {
    setSelectedEnrollmentPeriodIds(pendingEnrollPeriodIds);
    closeEnrollPeriodMenu();
  }, [pendingEnrollPeriodIds, closeEnrollPeriodMenu]);

  const enrollPeriodLabel = useMemo(() => {
    if (!selectedEnrollmentPeriodIds.length) return "";
    if (selectedEnrollmentPeriodIds.length === 1)
      return enrollmentPeriodsByCompany.find((p) => p.periodId === selectedEnrollmentPeriodIds[0])?.label ?? "1 Period";
    return `${selectedEnrollmentPeriodIds.length} Periods`;
  }, [selectedEnrollmentPeriodIds, enrollmentPeriodsByCompany]);

  // ── Policy multi-select dropdown ──────────────────────────────────────────
  const [enrollPolicyMenuOpen, setEnrollPolicyMenuOpen] = useState(false);
  const [enrollPolicyMenuPos, setEnrollPolicyMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [pendingEnrollPolicyIds, setPendingEnrollPolicyIds] = useState<number[]>([]);
  const [enrollPolicySearch, setEnrollPolicySearch] = useState("");
  const enrollPolicyMenuRef = useRef<HTMLDivElement>(null);

  const closeEnrollPolicyMenu = useCallback(() => {
    setEnrollPolicyMenuOpen(false);
    setEnrollPolicySearch("");
  }, []);

  useEffect(() => {
    if (!enrollPolicyMenuOpen) return;
    const reposition = () => {
      const rect = enrollPolicyMenuRef.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) { closeEnrollPolicyMenu(); return; }
      setEnrollPolicyMenuPos({ top: rect.bottom + 4, left: rect.left });
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => { window.removeEventListener("scroll", reposition, true); window.removeEventListener("resize", reposition); };
  }, [enrollPolicyMenuOpen, closeEnrollPolicyMenu]);

  const applyEnrollPolicies = useCallback(() => {
    setSelectedEnrollmentPolicyIds(pendingEnrollPolicyIds);
    closeEnrollPolicyMenu();
  }, [pendingEnrollPolicyIds, closeEnrollPolicyMenu]);

  const enrollPolicyLabel = useMemo(() => {
    if (!selectedEnrollmentPolicyIds.length) return "";
    if (selectedEnrollmentPolicyIds.length === 1)
      return policiesForPeriod.find((p) => p.policyId === selectedEnrollmentPolicyIds[0])?.policyName ?? "1 Policy";
    return `${selectedEnrollmentPolicyIds.length} Policies`;
  }, [selectedEnrollmentPolicyIds, policiesForPeriod]);

  const filteredPoliciesForPeriod = useMemo(() =>
    enrollPolicySearch.trim()
      ? policiesForPeriod.filter((p) =>
          `${p.policyName} ${p.policyNumber ?? ""}`.toLowerCase().includes(enrollPolicySearch.toLowerCase())
        )
      : policiesForPeriod,
  [policiesForPeriod, enrollPolicySearch]);

  const hasRealData =
    !!report.reportKey && !!companyId &&
    (!report.needsPolicyId || isEnrollment || !!selectedPolicyId) &&
    // Enrollment report: require at least one period selected before firing the API.
    (!isEnrollment || selectedEnrollmentPeriodIds.length > 0);

  const params = useMemo(() => {
    if (!report.reportKey || !companyId) return {};
    if (isClaimHistory) {
      return selectedPolicyId
        ? buildClaimHistoryParams(selectedPolicyId, claimStatus, claimType, cardLocationIds)
        : {};
    }
    if (isLoginActivity) {
      // selectedEnrollmentPeriodId === null means "All Periods" — send "" so
      // the report's optional filter matches every period for the selected
      // policy. Sent as the periodId itself (document_processing_file.id /
      // enrollment_addition_batch_id), not a date range.
      return selectedPolicyId
        ? buildReportParams(report.reportKey, companyId, {
            policyId: String(selectedPolicyId),
            enrollmentPeriodId: selectedEnrollmentPeriodId ? String(selectedEnrollmentPeriodId) : "",
          })
        : {};
    }
    if (isEnrollment) {
      // selectedPolicyId === null means "All Policies" — send policyId: ""
      // so the report's optional filter matches every policy for the company.
      // Enrollment period is optional too: only meaningful once a policy is
      // picked, and "All Periods" (selectedEnrollmentPeriodId === null) sends
      // "" so that filter is skipped as well. Sent as the periodId itself
      // (document_processing_file.id / enrollment_addition_batch_id), not a
      // date range.
      return buildReportParams(report.reportKey, companyId, {
        policyIds: selectedEnrollmentPolicyIds.length ? selectedEnrollmentPolicyIds.join(",") : "",
        enrollStatus,
        enrollmentPeriodIds: enrollmentPeriodIdsKey,
      });
    }
    return buildReportParams(report.reportKey, companyId, { enrollStatus }, cardLocationIds);
  }, [report.reportKey, companyId, isClaimHistory, isLoginActivity, isEnrollment, selectedPolicyId, selectedEnrollmentPeriodId, enrollmentPeriodIdsKey, selectedEnrollmentPolicyIds, claimStatus, claimType, enrollStatus, cardLocationIds]);

  const [reportCount, setReportCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  useEffect(() => {
    if (!expanded || !hasRealData || !report.reportKey) return;
    let cancelled = false;
    setCountLoading(true);
    setReportCount(null);
    apiRequest(endPoints.countHRReport(report.reportKey), { method: "POST", data: params })
      .then((res: any) => { if (!cancelled) setReportCount(res?.data?.count ?? null); })
      .catch(() => { if (!cancelled) setReportCount(null); })
      .finally(() => { if (!cancelled) setCountLoading(false); });
    return () => { cancelled = true; };
  // JSON.stringify(params) used instead of params object — prevents infinite loop from reference churn
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, hasRealData, report.reportKey, JSON.stringify(params)]);

  const reportLoading = countLoading;

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!report.reportKey || !companyId || Object.keys(params).length === 0) return;
    setIsExporting(true);
    try {
      await downloadReportFromApi(report.reportKey, params);
    } finally {
      setIsExporting(false);
    }
  };

  const Icon = iconForList(report);

  return (
    <Box
      sx={{
        borderRadius: "8px",
        background: "linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)",
        border: `1.5px solid ${expanded ? "#BDD4F8" : "#FFF"}`,
        boxShadow: expanded
          ? "0 6px 24px rgba(28,87,184,0.13)"
          : "0 6px 100px 0 rgba(0,0,0,0.10)",
        overflow: "hidden",
        transition: "box-shadow 0.18s ease, border-color 0.18s ease",
        opacity: isDisabled ? 0.5 : 1,
        pointerEvents: isDisabled ? "none" : "auto",
      }}
    >
      {/* Header row */}
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          minHeight: 76,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.35,
          py: 1.55,
          cursor: "pointer",
          "&:hover": { bgcolor: "rgba(28,87,184,0.025)" },
          transition: "background 0.15s",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.4 }}>
          <Box sx={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color: "#2a75d7", mt: 0.15 }}>
            <Icon size={14} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#1f2937" }}>{report.name}</Typography>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#93a0ad", mt: 0.75 }}>{report.description}</Typography>
            {/* <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.9 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CalendarDays size={11} color="#9aa6b2" />
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9aa6b2" }}>{report.lastGenerated}</Typography>
              </Box>
            </Box> */}
          </Box>
        </Box>
        {isDisabled ? (
          <Box sx={{ px: 1.5, py: 0.45, borderRadius: "20px", background: "#F3F4F6", border: "1px solid #D1D5DB", fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>
            Coming soon
          </Box>
        ) : (
          <ChevronDown
            size={16}
            color="#2a75d7"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }}
          />
        )}
      </Box>

      {/* Expand panel */}
      {expanded && (
        <Box sx={{ borderTop: "1px solid #E3EDF7", px: 2.5, pt: 2, pb: 2.25, background: "rgba(235,246,255,0.55)" }}>
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>
            Export Filters
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 1.5, mb: 2 }}>
            {/* Location filter — shown for reports that support it */}
            {locationOptions.length > 0 && !report.hideLocationFilter && (
              <Box ref={cardLocMenuRef} sx={{ position: "relative" }}>
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085", fontWeight: 500, mb: 0.75 }}>Policy Location</Typography>
                <Box
                  onClick={() => {
                    setCardPendingLocIds(cardLocationIds ? cardLocationIds.split(",").map(Number).filter(Boolean) : []);
                    const rect = cardLocMenuRef.current?.getBoundingClientRect();
                    if (rect) setCardLocMenuPos({ top: rect.bottom + 4, left: rect.left });
                    setCardLocMenuOpen((o) => !o);
                  }}
                  sx={{
                    ...SELECT_SX,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", userSelect: "none",
                    backgroundImage: "none",
                    pr: 1.25,
                  }}
                >
                  <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cardSelectedLocLabel}</Box>
                  <ChevronDown size={13} style={{ flexShrink: 0, opacity: 0.7, marginLeft: 6 }} />
                </Box>

                {cardLocMenuOpen && cardLocMenuPos && createPortal(
                  <ClickAwayListener onClickAway={closeCardLocMenu}>
                    <Paper
                      sx={{
                        position: "fixed",
                        top: cardLocMenuPos.top,
                        left: cardLocMenuPos.left,
                        zIndex: 1300,
                        display: "flex", flexDirection: "column",
                        height: 200, width: 280,
                        border: "1px solid #E5E7EB", borderRadius: "12px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden",
                      }}
                    >
                      {/* Search */}
                      <Box sx={{ px: 1.5, pt: 1.5, pb: 1, borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, bgcolor: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px", px: 1.25, py: 0.6 }} onKeyDown={(e) => e.stopPropagation()}>
                          <Search size={12} color="#9CA3AF" style={{ flexShrink: 0 }} />
                          <input autoFocus value={cardLocationSearch} onChange={(e) => setCardLocationSearch(e.target.value)} placeholder="Search locations…" style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#111827", width: "100%" }} />
                        </Box>
                      </Box>
                      {/* All Locations option */}
                      <Box onClick={() => setCardPendingLocIds([])} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.85, cursor: "pointer", flexShrink: 0, bgcolor: cardPendingLocIds.length === 0 ? "#EBF3FF" : "transparent", "&:hover": { bgcolor: "#F0F6FF" }, borderBottom: "1px solid #F3F4F6" }}>
                        <Box sx={{ width: 14, height: 14, borderRadius: "50%", border: cardPendingLocIds.length === 0 ? "none" : "1.5px solid #D1D5DB", bgcolor: cardPendingLocIds.length === 0 ? "#1C57B8" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {cardPendingLocIds.length === 0 && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#fff" }} />}
                        </Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>All Locations</Typography>
                      </Box>
                      {/* Location list */}
                      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#D1D5DB", borderRadius: 4 } }}>
                        {filteredCardLocOpts.length === 0 ? (
                          <Box sx={{ px: 2, py: 2, textAlign: "center" }}><Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>No locations found</Typography></Box>
                        ) : filteredCardLocOpts.map((opt) => {
                          const checked = cardPendingLocIds.includes(opt.id);
                          return (
                            <Box key={opt.id} onClick={() => setCardPendingLocIds((p) => checked ? p.filter((id) => id !== opt.id) : [...p, opt.id])} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, cursor: "pointer", bgcolor: checked ? "#EBF3FF" : "transparent", "&:hover": { bgcolor: "#F0F6FF" }, borderBottom: "1px solid #F9FAFB" }}>
                              <Box sx={{ width: 14, height: 14, borderRadius: "3px", border: checked ? "none" : "1.5px solid #D1D5DB", bgcolor: checked ? "#1C57B8" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {checked && <X size={9} color="#fff" strokeWidth={3} />}
                              </Box>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: 13, color: checked ? "#1C57B8" : "#374151", fontWeight: 600 }}>{opt.location_code}</Typography>
                                {opt.addr_1 && <Typography sx={{ fontSize: 11, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 230 }}>{opt.addr_1}</Typography>}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                      {/* Apply button */}
                      <Box sx={{ px: 1.5, py: 1.25, borderTop: "1px solid #F3F4F6", display: "flex", gap: 1, flexShrink: 0 }}>
                        <Box onClick={applyCardLocation} sx={{ flex: 1, height: 36, borderRadius: "8px", bgcolor: "#1C57B8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, cursor: "pointer", "&:hover": { bgcolor: "#163F8A" } }}>Apply</Box>
                      </Box>
                    </Paper>
                  </ClickAwayListener>,
                  document.body
                )}
              </Box>
            )}

            {/* Enrollment report filters: Enrollment Period → Policy → Status */}
            {isEnrollment && (
              <>
                {/* 1. Enrollment Period — multi-select */}
                <Box ref={enrollPeriodMenuRef} sx={{ position: "relative" }}>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085", fontWeight: 500, mb: 0.75 }}>Enrollment Period</Typography>
                  <Box
                    onClick={() => {
                      setPendingEnrollPeriodIds(selectedEnrollmentPeriodIds);
                      const rect = enrollPeriodMenuRef.current?.getBoundingClientRect();
                      if (rect) setEnrollPeriodMenuPos({ top: rect.bottom + 4, left: rect.left });
                      setEnrollPeriodMenuOpen((o) => !o);
                    }}
                    sx={{ ...SELECT_SX, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none", backgroundImage: "none", pr: 1.25 }}
                  >
                    <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: enrollPeriodLabel ? "inherit" : "#9CA3AF" }}>
                      {enrollPeriodLabel || "Select period"}
                    </Box>
                    <ChevronDown size={13} style={{ flexShrink: 0, opacity: 0.7, marginLeft: 6 }} />
                  </Box>
                  {enrollPeriodMenuOpen && enrollPeriodMenuPos && createPortal(
                    <ClickAwayListener onClickAway={closeEnrollPeriodMenu}>
                      <Paper sx={{ position: "fixed", top: enrollPeriodMenuPos.top, left: enrollPeriodMenuPos.left, width: 300, maxHeight: 320, zIndex: 1500, borderRadius: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#D1D5DB", borderRadius: 4 } }}>
                          {enrollmentPeriodsByCompany.length === 0 ? (
                            <Box sx={{ px: 2, py: 2, textAlign: "center" }}><Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>No periods found</Typography></Box>
                          ) : enrollmentPeriodsByCompany.map((opt) => {
                            const checked = pendingEnrollPeriodIds.includes(opt.periodId);
                            return (
                              <Box key={opt.periodId} onClick={() => setPendingEnrollPeriodIds((p) => checked ? p.filter((id) => id !== opt.periodId) : [...p, opt.periodId])} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.85, cursor: "pointer", bgcolor: checked ? "#EBF3FF" : "transparent", "&:hover": { bgcolor: "#F0F6FF" }, borderBottom: "1px solid #F9FAFB" }}>
                                <Box sx={{ width: 14, height: 14, borderRadius: "3px", border: checked ? "none" : "1.5px solid #D1D5DB", bgcolor: checked ? "#1C57B8" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  {checked && <X size={9} color="#fff" strokeWidth={3} />}
                                </Box>
                                <Typography sx={{ fontSize: 13, color: checked ? "#1C57B8" : "#374151", fontWeight: 500 }}>{opt.label}</Typography>
                              </Box>
                            );
                          })}
                        </Box>
                        <Box sx={{ px: 1.5, py: 1.25, borderTop: "1px solid #F3F4F6", display: "flex", flexShrink: 0 }}>
                          <Box onClick={applyEnrollPeriods} sx={{ flex: 1, height: 36, borderRadius: "8px", bgcolor: "#1C57B8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, cursor: "pointer", "&:hover": { bgcolor: "#163F8A" } }}>Apply</Box>
                        </Box>
                      </Paper>
                    </ClickAwayListener>,
                    document.body
                  )}
                </Box>

                {/* 2. Policy — multi-select with search, filtered by selected periods */}
                <Box ref={enrollPolicyMenuRef} sx={{ position: "relative" }}>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085", fontWeight: 500, mb: 0.75 }}>Policy</Typography>
                  <Box
                    onClick={() => {
                      setPendingEnrollPolicyIds(selectedEnrollmentPolicyIds);
                      const rect = enrollPolicyMenuRef.current?.getBoundingClientRect();
                      if (rect) setEnrollPolicyMenuPos({ top: rect.bottom + 4, left: rect.left });
                      setEnrollPolicyMenuOpen((o) => !o);
                    }}
                    sx={{ ...SELECT_SX, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none", backgroundImage: "none", pr: 1.25 }}
                  >
                    <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: enrollPolicyLabel ? "inherit" : "#9CA3AF" }}>
                      {enrollPolicyLabel || "Select policies"}
                    </Box>
                    <ChevronDown size={13} style={{ flexShrink: 0, opacity: 0.7, marginLeft: 6 }} />
                  </Box>
                  {enrollPolicyMenuOpen && enrollPolicyMenuPos && createPortal(
                    <ClickAwayListener onClickAway={closeEnrollPolicyMenu}>
                      <Paper sx={{ position: "fixed", top: enrollPolicyMenuPos.top, left: enrollPolicyMenuPos.left, width: 320, maxHeight: 360, zIndex: 1500, borderRadius: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        {/* Search */}
                        <Box sx={{ px: 1.25, py: 1, borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
                          <Search size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />
                          <Box component="input" autoFocus value={enrollPolicySearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnrollPolicySearch(e.target.value)} placeholder="Search policy..." sx={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#374151", bgcolor: "transparent", "&::placeholder": { color: "#9CA3AF" } }} />
                        </Box>
                        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#D1D5DB", borderRadius: 4 } }}>
                          {filteredPoliciesForPeriod.length === 0 ? (
                            <Box sx={{ px: 2, py: 2, textAlign: "center" }}><Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>No policies found</Typography></Box>
                          ) : filteredPoliciesForPeriod.map((opt) => {
                            const checked = pendingEnrollPolicyIds.includes(opt.policyId);
                            return (
                              <Box key={opt.policyId} onClick={() => setPendingEnrollPolicyIds((p) => checked ? p.filter((id) => id !== opt.policyId) : [...p, opt.policyId])} sx={{ display: "flex", alignItems: "flex-start", gap: 1, px: 1.5, py: 0.85, cursor: "pointer", bgcolor: checked ? "#EBF3FF" : "transparent", "&:hover": { bgcolor: "#F0F6FF" }, borderBottom: "1px solid #F9FAFB" }}>
                                <Box sx={{ width: 14, height: 14, borderRadius: "3px", border: checked ? "none" : "1.5px solid #D1D5DB", bgcolor: checked ? "#1C57B8" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: "2px" }}>
                                  {checked && <X size={9} color="#fff" strokeWidth={3} />}
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontSize: 13, color: checked ? "#1C57B8" : "#374151", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt.policyName}</Typography>
                                  <Typography sx={{ fontSize: 11, color: "#6B7280", mt: 0.2 }}>
                                    {opt.policyNumber}{opt.policyFrom ? ` · ${opt.policyFrom} – ${opt.policyTo}` : ""}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                        <Box sx={{ px: 1.5, py: 1.25, borderTop: "1px solid #F3F4F6", display: "flex", flexShrink: 0 }}>
                          <Box onClick={applyEnrollPolicies} sx={{ flex: 1, height: 36, borderRadius: "8px", bgcolor: "#1C57B8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, cursor: "pointer", "&:hover": { bgcolor: "#163F8A" } }}>Apply</Box>
                        </Box>
                      </Paper>
                    </ClickAwayListener>,
                    document.body
                  )}
                </Box>

                {/* 3. Enrollment Status */}
                <Box>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085", fontWeight: 500, mb: 0.75 }}>Enrollment Status</Typography>
                  <Box component="select" value={enrollStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEnrollStatus(e.target.value)} sx={SELECT_SX}>
                    <option value="">All</option>
                    <option value="EMPLOYEE_ENROLLMENT_STATUS_ENROLLED">Total Enrolled</option>
                    <option value="AUTO_ENROLLED">Auto Enrolled</option>
                    <option value="USER_ENROLLED">User Enrolled</option>
                    <option value="EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS">In Progress</option>
                    <option value="EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED">Not Started</option>
                  </Box>
                </Box>
              </>
            )}

            {/* Claims-specific filters */}
            {isClaimHistory && (
              <>
                <Box>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085", fontWeight: 500, mb: 0.75 }}>Policy</Typography>
                  <Box component="select" value={selectedPolicyId ?? ""} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPolicyId(e.target.value ? Number(e.target.value) : null)} sx={SELECT_SX}>
                    <option value="">Select Policy</option>
                    {policies.map((p) => <option key={p.policyId} value={p.policyId}>{p.policyName}</option>)}
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085", fontWeight: 500, mb: 0.75 }}>Claim Type</Typography>
                  <Box component="select" value={claimType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setClaimType(e.target.value)} sx={SELECT_SX}>
                    {["", "Cashless", "Reimbursement"].map((o) => <option key={o} value={o}>{o || "All Types"}</option>)}
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085", fontWeight: 500, mb: 0.75 }}>Status</Typography>
                  <Box component="select" value={claimStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setClaimStatus(e.target.value)} sx={SELECT_SX}>
                    {["", "Pending","Approved","Rejected","Settled"].map((o) => <option key={o} value={o}>{o || "All Statuses"}</option>)}
                  </Box>
                </Box>
              </>
            )}

            {/* Login activity — scoped to a specific policy + enrollment period */}
            {isLoginActivity && (
              <>
                <SearchableSelectField
                  label="Policy"
                  value={selectedPolicyId}
                  onChange={setSelectedPolicyId}
                  options={policies.map((p) => ({ id: p.policyId, label: p.policyName }))}
                  placeholder="Select Policy"
                />
                <SearchableSelectField
                  label="Enrollment Period"
                  value={selectedEnrollmentPeriodId}
                  onChange={setSelectedEnrollmentPeriodId}
                  options={enrollmentPeriods.map((p) => ({ id: p.periodId, label: p.label }))}
                  placeholder={selectedPolicyId ? "Select Enrollment Period" : "Select a policy first"}
                  disabled={!selectedPolicyId}
                  allOptionLabel="All Periods"
                />
              </>
            )}
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.5 }}>
            {(reportLoading || isExporting) && <CircularProgress size={14} sx={{ color: "#2a75d7" }} />}
            {hasRealData && !countLoading && !isExporting && reportCount !== null && (
              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085" }}>{formatNumberByLocalization(reportCount, localizationData?.data)} records</Typography>
            )}
            <Box
              onClick={!isExporting && hasRealData ? handleExport : undefined}
              sx={{
                display: "inline-flex", alignItems: "center", gap: 0.75, px: 2, py: 0.9,
                borderRadius: "8px",
                background: hasRealData && !isExporting ? "#1C3A6E" : "#6B7280",
                cursor: hasRealData && !isExporting ? "pointer" : "not-allowed",
                "&:hover": hasRealData && !isExporting ? { background: "#152E5A" } : {},
                transition: "background 0.15s",
              }}
            >
              <Download size={13} color="#fff" />
              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#fff" }}>
                {isExporting ? "Downloading..." : "Download Report"}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

function ReportsCategoryView({
  category,
  onCategoryChange,
  companyId,
  policies,
  locationIds = "",
  locationLabel = "",
}: {
  category: CategoryDef;
  onCategoryChange: (category: CategoryDef) => void;
  companyId: number | null;
  policies: PolicyOption[];
  locationIds?: string;
  locationLabel?: string;
}) {
  const [showAll, setShowAll] = useState(true);
  const [globalPolicyId, setGlobalPolicyId] = useState<number | null>(null);

  // ── Local location filter ─────────────────────────────────────────────────
  const [localLocationIds, setLocalLocationIds] = useState(locationIds);
  const [locationOptions, setLocationOptions] = useState<{ id: number; location_code: string; addr_1?: string }[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [locMenuOpen, setLocMenuOpen] = useState(false);
  const [pendingLocIds, setPendingLocIds] = useState<number[]>(() =>
    locationIds ? locationIds.split(",").map(Number).filter(Boolean) : []
  );
  const locMenuRef = useRef<HTMLDivElement>(null);

  // Sync if parent prop changes (e.g. global filter applied)
  useEffect(() => {
    setLocalLocationIds(locationIds);
    setPendingLocIds(locationIds ? locationIds.split(",").map(Number).filter(Boolean) : []);
  }, [locationIds]);

  // Fetch location options once companyId is available
  useEffect(() => {
    if (!companyId) return;
    apiRequest(`${endPoints.generateHRReports}external_hr_company_locations?page=1&limit=0`, {
      method: "POST",
      data: { companyId: String(companyId) },
    }).then((res: any) => {
      setLocationOptions(res?.data?.data ?? []);
    }).catch(() => setLocationOptions([]));
  }, [companyId]);

  // Close location menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locMenuRef.current && !locMenuRef.current.contains(e.target as Node)) {
        setLocMenuOpen(false);
        setLocationSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const applyLocation = useCallback(() => {
    setLocalLocationIds(pendingLocIds.length ? pendingLocIds.join(",") : "");
    setLocMenuOpen(false);
    setLocationSearch("");
  }, [pendingLocIds]);

  const clearLocation = useCallback(() => {
    setPendingLocIds([]);
    setLocalLocationIds("");
    setLocMenuOpen(false);
    setLocationSearch("");
  }, []);

  const filteredLocOpts = useMemo(() =>
    locationSearch.trim()
      ? locationOptions.filter((o) =>
          `${o.location_code} ${o.addr_1 ?? ''}`.toLowerCase().includes(locationSearch.toLowerCase())
        )
      : locationOptions,
    [locationOptions, locationSearch]
  );

  const selectedLocLabel = useMemo(() => {
    if (!localLocationIds) return "All Locations";
    const ids = localLocationIds.split(",").map(Number).filter(Boolean);
    if (ids.length === 1) {
      const o = locationOptions.find((o) => o.id === ids[0]);
      return o ? (o.addr_1 ? `${o.location_code} — ${o.addr_1}` : o.location_code) : "1 Location";
    }
    return `${ids.length} Locations`;
  }, [localLocationIds, locationOptions]);

  const isLocationFiltered = !!localLocationIds;

  const reports = useMemo(
    () => showAll ? ALL_REPORTS : ALL_REPORTS.filter((r) => r.categoryId === category.id),
    [category.id, showAll]
  );

  const CHIP_SX = (active: boolean) => ({
    height: 38,
    px: 2.25,
    borderRadius: "10px",
    display: "inline-flex",
    alignItems: "center",
    gap: 1,
    background: active ? "#1d57b7" : "transparent",
    color: active ? "#fff" : "#324152",
    border: active ? "1px solid #1d57b7" : "1px solid #dbe3ee",
    boxShadow: active ? "0 3px 8px rgba(28,87,184,0.18)" : "none",
    fontSize: 15, lineHeight: 1.7,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <Box sx={{ mx: -3, mt: -0.5, minHeight: "100%", background: "#EBF6FF", display: "flex", flexDirection: "column" }}>
      {/* Sticky header + chips bar */}
      <Box sx={{ position: "sticky", top: 0, zIndex: 0 }}>
        <PortalHeroHeader
          title="Reports"
          subtitle="View and download reports across endorsements, claims, employees, and finance"
          noBorder
          action={
            locationLabel && locationLabel !== "All Locations" ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, borderRadius: "8px", bgcolor: "#EFF6FF", border: "1px solid #93C5FD", color: "#1d57b7", fontSize: 13, fontWeight: 600 }}>
                <MapPin size={13} />
                {locationLabel}
              </Box>
            ) : undefined
          }
        />

        <PortalControlBar
          bleed={true}
          rightSlot={
            (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* ── Policy Location filter ── */}
              <Box ref={locMenuRef} sx={{ position: "relative" }}>
                <Box
                  onClick={() => { setPendingLocIds(localLocationIds ? localLocationIds.split(",").map(Number).filter(Boolean) : []); setLocMenuOpen((o) => !o); }}
                  sx={{
                    height: 38, px: 2, borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: 1,
                    background: isLocationFiltered ? "#1d57b7" : "#EFF6FF",
                    color: isLocationFiltered ? "#fff" : "#1d57b7",
                    border: isLocationFiltered ? "1.5px solid #1d57b7" : "1.5px solid #93C5FD",
                    fontSize: 15, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
                    "&:hover": { background: isLocationFiltered ? "#1548A0" : "#DBEAFE", borderColor: "#1d57b7" },
                    transition: "all 0.15s",
                  }}
                >
                  <MapPin size={13} style={{ flexShrink: 0 }} />
                  <Box component="span" sx={{ fontWeight: 700, opacity: 0.7, mr: 0.4, fontSize: 15 }}>Location:</Box>
                  <Box component="span" sx={{ maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", fontSize: 15 }}>{selectedLocLabel}</Box>
                  {isLocationFiltered && (
                    <Box onClick={(e) => { e.stopPropagation(); clearLocation(); }} sx={{ ml: 0.5, display: "flex", alignItems: "center" }}>
                      <X size={12} />
                    </Box>
                  )}
                  <ChevronDown size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                </Box>

                {locMenuOpen && (
                  <Box sx={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 300, bgcolor: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 260, maxWidth: 320 }}>
                    {/* Search */}
                    <Box sx={{ px: 1.5, pt: 1.5, pb: 1, borderBottom: "1px solid #F3F4F6" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, bgcolor: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px", px: 1.25, py: 0.6 }} onKeyDown={(e) => e.stopPropagation()}>
                        <Search size={12} color="#9CA3AF" style={{ flexShrink: 0 }} />
                        <input autoFocus value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} placeholder="Search locations…" style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#111827", width: "100%" }} />
                      </Box>
                    </Box>
                    {/* All Locations option */}
                    <Box onClick={() => { setPendingLocIds([]); }} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.85, cursor: "pointer", bgcolor: pendingLocIds.length === 0 ? "#EBF3FF" : "transparent", "&:hover": { bgcolor: "#F0F6FF" }, borderBottom: "1px solid #F3F4F6" }}>
                      <Box sx={{ width: 14, height: 14, borderRadius: "50%", border: pendingLocIds.length === 0 ? "none" : "1.5px solid #D1D5DB", bgcolor: pendingLocIds.length === 0 ? "#1C57B8" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {pendingLocIds.length === 0 && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#fff" }} />}
                      </Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>All Locations</Typography>
                    </Box>
                    {/* Location list */}
                    <Box sx={{ maxHeight: 240, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#D1D5DB", borderRadius: 4 } }}>
                      {filteredLocOpts.length === 0 ? (
                        <Box sx={{ px: 2, py: 2, textAlign: "center" }}><Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>No locations found</Typography></Box>
                      ) : filteredLocOpts.map((opt) => {
                        const checked = pendingLocIds.includes(opt.id);
                        return (
                          <Box key={opt.id} onClick={() => setPendingLocIds((p) => checked ? p.filter((id) => id !== opt.id) : [...p, opt.id])} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, cursor: "pointer", bgcolor: checked ? "#EBF3FF" : "transparent", "&:hover": { bgcolor: "#F0F6FF" }, borderBottom: "1px solid #F9FAFB" }}>
                            <Box sx={{ width: 14, height: 14, borderRadius: "3px", border: checked ? "none" : "1.5px solid #D1D5DB", bgcolor: checked ? "#1C57B8" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {checked && <X size={9} color="#fff" strokeWidth={3} />}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontSize: 13, color: checked ? "#1C57B8" : "#374151", fontWeight: 600 }}>{opt.location_code}</Typography>
                              {opt.addr_1 && <Typography sx={{ fontSize: 11, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 230 }}>{opt.addr_1}</Typography>}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                    {/* Apply button */}
                    <Box sx={{ px: 1.5, py: 1.25, borderTop: "1px solid #F3F4F6", display: "flex", gap: 1 }}>
                      <Box onClick={applyLocation} sx={{ flex: 1, height: 36, borderRadius: "8px", bgcolor: "#1C57B8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, cursor: "pointer", "&:hover": { bgcolor: "#163F8A" } }}>Apply</Box>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* ── Policy filter (existing) ── */}
              <Box
                sx={{
                  position: "relative",
                  height: 38,
                  px: 2.25,
                  pr: 1.5,
                  borderRadius: "10px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  background: globalPolicyId ? "#1d57b7" : "#EFF6FF",
                  color: globalPolicyId ? "#fff" : "#1d57b7",
                  border: globalPolicyId ? "1.5px solid #1d57b7" : "1.5px solid #93C5FD",
                  boxShadow: "none",
                  fontSize: 15, lineHeight: 1.7,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  minWidth: 140,
                  maxWidth: 240,
                  flexShrink: 0,
                  userSelect: "none",
                  "&:hover": { background: globalPolicyId ? "#1548A0" : "#DBEAFE", borderColor: "#1d57b7" },
                  transition: "all 0.15s",
                }}
              >
                <Shield size={14} style={{ flexShrink: 0 }} />
                <Typography
                  component="span"
                  sx={{
                    fontSize: 15, lineHeight: 1.7,
                    fontWeight: 500,
                    color: "inherit",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Box component="span" sx={{ fontWeight: 700, opacity: 0.7, mr: 0.4 }}>Policy:</Box>
                  {globalPolicyId
                    ? (policies.find((p) => p.policyId === globalPolicyId)?.policyName ?? "All")
                    : "All"}
                </Typography>
                <ChevronDown size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                {/* Invisible native select sits on top for native dropdown UX */}
                <Box
                  component="select"
                  value={globalPolicyId ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setGlobalPolicyId(e.target.value ? Number(e.target.value) : null)
                  }
                  aria-label="Filter reports by policy"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    cursor: "pointer",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <option value="">All Policies</option>
                  {policies.map((p) => (
                    <option key={p.policyId} value={p.policyId}>{p.policyName}</option>
                  ))}
                </Box>
              </Box>
              </Box>
            )
          }
        >
          {/* All chip */}
          <Box onClick={() => setShowAll(true)} sx={CHIP_SX(showAll)}>
            <LayoutGrid size={14} />
            All Active
          </Box>

          {CATEGORY_ORDER.map((id) => {
            const item = CATEGORIES.find((entry) => entry.id === id) ?? CATEGORIES[0];
            const active = !showAll && category.id === item.id;
            const CatIcon = item.icon;
            return (
              <Box
                key={item.id}
                onClick={() => { setShowAll(false); onCategoryChange(item); }}
                sx={CHIP_SX(active)}
              >
                <CatIcon size={14} />
                {CATEGORY_TITLE[item.id]}
              </Box>
            );
          })}
        </PortalControlBar>
      </Box>

      <Box sx={{ px: 4, pt: 3.5 }}>
        <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#233141", mb: 2 }}>
          {showAll ? "All Reports" : CATEGORY_SUBTITLE[category.id]}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", "@media (max-width: 900px)": { flexDirection: "column" } }}>
          {[0, 1].map((col) => (
            <Box key={col} sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              {reports
                .filter((_, i) => i % 2 === col)
                .map((report) => (
                  <ReportCard key={report.id} report={report} companyId={companyId} policies={policies} globalPolicyId={globalPolicyId} locationIds={localLocationIds} locationOptions={locationOptions} />
                ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  color = "#2a75d7",
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  color?: string;
}) {
  const { localizationData } = useLocalization();
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: "#1e293b",
        borderRadius: "8px",
        px: 1.5,
        py: 1,
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
      }}
    >
      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#fff", mb: 0.75 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: "2px", background: color, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#e2e8f0" }}>
          {formatNumberByLocalization(payload[0].value, localizationData?.data)}
        </Typography>
      </Box>
    </Box>
  );
}

function ReportDetailPage({
  report,
  category: _category,
  onBack,
  companyId,
  locationIds = "",
}: {
  report: ReportDef;
  category: CategoryDef;
  onBack: () => void;
  companyId: number | null;
  locationIds?: string;
}) {
  const { localizationData } = useLocalization();
  const [policyFilter, setPolicyFilter] = useState("All Policies");
  const [dateRange, setDateRange] = useState(PORTAL_DATE_OPTIONS[0]);
  const [search, setSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const hasRealData = !!report.reportKey && !!companyId;

  const params = useMemo(
    () => hasRealData
      ? buildReportParams(report.reportKey!, companyId!, {}, locationIds)
      : {},
    [hasRealData, report.reportKey, companyId, locationIds]
  );

  const { data: realRows, isLoading: reportLoading } = useHRReport<Record<string, unknown>>(
    report.reportKey ?? "_noop_",
    params,
    hasRealData,
    { limit: 0 }
  );

  const rows = useMemo(() => {
    const source: Record<string, unknown>[] =
      hasRealData && realRows.length > 0
        ? realRows
        : (report.rows as Record<string, unknown>[]);

    if (!search.trim()) return source;
    const query = search.toLowerCase();
    return source.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(query))
    );
  }, [hasRealData, realRows, report.rows, search]);

  const summaryStats = useMemo(() => {
    if (hasRealData && realRows.length > 0 && report.reportKey) {
      const computed = computeDynamicStats(report.reportKey, realRows, localizationData?.data);
      if (computed) return computed;
    }
    return report.summaryStats;
  }, [hasRealData, realRows, report.reportKey, report.summaryStats, localizationData]);

  return (
    <Box
      sx={{
        mx: -3,
        mt: -0.5,
        minHeight: "100%",
        background: "#EBF6FF",
        display: "flex",
        flexDirection: "column",
        gap: 1.2,
      }}
    >
      <Box
        sx={{
          mx: 0,
          mt: 0,
          px: 3,
          minHeight: 64,
          display: "flex",
          alignItems: "center",
          gap: 1.4,
          background: "linear-gradient(90deg, #2556A6 0%, #1F88C6 100%)",
          color: "#FFFFFF",
        }}
      >
        <Box
          onClick={onBack}
          sx={{
            height: 34,
            px: 1.2,
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.8)",
            display: "inline-flex",
            alignItems: "center",
            gap: 0.8,
            fontSize: 15, lineHeight: 1.7,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={14} />
          Back
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
          <Typography sx={PORTAL_HEADER_TITLE_SX}>{report.name}</Typography>
          <Typography
            sx={{
              fontSize: 15, lineHeight: 1.7,
              lineHeight: "14px",
              color: "rgba(255,255,255,0.78)",
            }}
          >
            {_category.label}
          </Typography>
        </Box>
      </Box>

      <PortalControlBar
        bleed={true}
        rightSlot={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {(reportLoading || isExporting) && <CircularProgress size={14} sx={{ color: "#2a75d7" }} />}
            <PortalActionButton
              label={isExporting ? "Downloading..." : "Export CSV"}
              icon={<Download size={14} />}
              onClick={async () => {
                if (!report.reportKey || !companyId || isExporting) return;
                setIsExporting(true);
                try {
                  await downloadReportFromApi(report.reportKey, params);
                } finally {
                  setIsExporting(false);
                }
              }}
            />
          </Box>
        }
      >
        <PortalSearchField
          value={search}
          onChange={setSearch}
          placeholder="Search records"
          icon={<Search size={14} color="#98A2B3" />}
          width={280}
        />
        <PortalSelectControl
          value={policyFilter}
          onChange={setPolicyFilter}
          options={["All Policies", "GMC", "GPA", "GTL"]}
          width={130}
        />
        <PortalSelectControl
          value={dateRange}
          onChange={setDateRange}
          options={PORTAL_DATE_OPTIONS}
          width={220}
          leadingIcon={<CalendarDays size={14} />}
        />
      </PortalControlBar>

      <Box sx={{ px: 3, py: 2.5 }}>
        <Typography sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 600, color: "#233141" }}>
          {report.name}
        </Typography>
        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#94a0ad", mt: 0.2 }}>
          {report.description}
        </Typography>

        <SectionCard
          sx={{
            mt: 1.35,
            mb: 1.2,
            p: 0,
            borderRadius: "10px",
            overflow: "hidden",
            background: "linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)",
            border: "1px solid #FFF",
            boxShadow: "0 6px 100px 0 rgba(0, 0, 0, 0.10)",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 2.25,
              display: "flex",
              alignItems: "stretch",
            }}
          >
            {summaryStats.slice(0, 3).map((stat, index) => (
              <Box
                key={stat.label}
                sx={{
                  minHeight: 52,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  px: 4,
                  borderRight:
                    index < summaryStats.slice(0, 3).length - 1
                      ? "1px solid #e7edf5"
                      : "none",
                  ...(index === 0 && { pl: 0 }),
                }}
              >
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#808c99" }}>
                  {stat.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px",
                    fontWeight: 600,
                    color: "#1f2937",
                    mt: 0.75,
                  }}
                >
                  {stat.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </SectionCard>

        {report.chartData ? (
          <SectionCard
            sx={{
              mb: 1.2,
              p: 1.5,
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <Typography
              sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#233141", mb: 1.2 }}
            >
              {report.chartLabel ?? "Report Chart"}
            </Typography>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={report.chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#edf1f6"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 15, lineHeight: 1.7, fill: "#7d8794" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 15, lineHeight: 1.7, fill: "#7d8794" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<ChartTooltip color="#2a75d7" />}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                <Bar
                  dataKey="value"
                  fill="#2a75d7"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        ) : null}

        <SectionCard
          sx={{
            mb: 0,
            p: 0,
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <StyledTable>
            <thead>
              <tr>
                {report.columns.map((column) => (
                  <StyledTh
                    key={column.key}
                    sx={{
                      py: 1.2,
                      fontSize: 15, lineHeight: 1.7,
                      background: "#fff",
                      color: "#7d8794",
                      borderBottom: "1px solid #edf1f6",
                      textAlign: column.align ?? "left",
                      textTransform: "none",
                    }}
                  >
                    {column.label}
                  </StyledTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${report.id}-${rowIndex}`}>
                  {report.columns.map((column) => {
                    const value = row[column.key];
                    return (
                      <StyledTd
                        key={`${column.key}-${rowIndex}`}
                        sx={{
                          py: 1.15,
                          fontSize: 15, lineHeight: 1.7,
                          textAlign: column.align ?? "left",
                        }}
                      >
                        {column.badge ? (
                          <ReportBadge value={String(value)} />
                        ) : (
                          <Typography
                            sx={{
                              fontSize: 15, lineHeight: 1.7,
                              color: "#364152",
                              fontWeight:
                                column.key === "department" ||
                                column.key === "employee"
                                  ? 500
                                  : 400,
                            }}
                          >
                            {cellValue(column, row)}
                          </Typography>
                        )}
                      </StyledTd>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </StyledTable>
        </SectionCard>
      </Box>
    </Box>
  );
}

export function HRPortalReports({ companyId: companyIdProp, locationIds = "", locationLabel = "" }: { companyId?: number | null; locationIds?: string; locationLabel?: string } = {}) {
  const location = useLocation();
  const initialReportId = (location.state as { reportId?: string } | null)?.reportId;
  const initialReport = initialReportId ? ALL_REPORTS.find((r) => r.id === initialReportId) : null;

  const companyId = (companyIdProp ?? getCompanyId() ?? null) as number | null;

  // Lightweight policy id/name/number list for dropdowns — NOT
  // dashboard_policy_cards, which computes heavy per-policy dashboard data
  // and is slow for what's just "give me this company's policies".
  const { data: policyCards } = useHRReport<{ policyId: number; policyName: string; policyNumber: string }>(
    "policy_list_for_company",
    { companyId: companyId ?? 0 },
    !!companyId,
    { limit: 0 } // limit=0 = no pagination cap; without this the backend defaults to 10 rows
  );
  const policies: PolicyOption[] = useMemo(
    () => policyCards.map((p) => ({
      policyId: p.policyId,
      policyName: p.policyNumber ? `${p.policyName} (${p.policyNumber})` : p.policyName,
    })),
    [policyCards]
  );

  const [view, setView] = useState<ViewMode>(initialReport ? "detail" : "categories");
  const [activeCategoryId, setActiveCategoryId] = useState<string>(initialReport?.categoryId ?? "endorsement");
  const [activeReportId] = useState<string>(initialReport?.id ?? "endorse-summary");

  const activeCategory =
    CATEGORIES.find((category) => category.id === activeCategoryId) ??
    CATEGORIES[0];
  const activeReport =
    ALL_REPORTS.find((report) => report.id === activeReportId) ??
    ALL_REPORTS[0];

  return view === "categories" ? (
    <ReportsCategoryView
      category={activeCategory}
      onCategoryChange={(category) => {
        setActiveCategoryId(category.id);
      }}
      companyId={companyId}
      policies={policies}
      locationIds={locationIds}
      locationLabel={locationLabel}
    />
  ) : (
    <ReportDetailPage
      report={activeReport}
      category={activeCategory}
      onBack={() => setView("categories")}
      companyId={companyId}
      locationIds={locationIds}
    />
  );
}

export default HRPortalReports;
