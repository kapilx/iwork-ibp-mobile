import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Drawer,
  Tooltip,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileText,
  HeartHandshake,
  Info,
  Mail,
  RefreshCw,
  Share2,
  Shield,
  ShieldCheck,
  Search,

  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip as RechartTooltip, XAxis, YAxis } from "recharts";
import { getCompanyId } from "../../utils/companyConfig";
import { capitalizeFirst } from "../../utils";
import { useHRReport } from "../../hooks/useHRReport";
import { endPoints, formatNumberByLocalization, formatAmountWithCurrency, getCurrencySymbolPrefix, useLocalization } from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import type {
  PolicyCardRow,
  PremiumSummaryRow,
  ClaimsKpiRow,
  ClaimsMonthRow,
  EnrollmentStatusRow,
  DemographicsRow,
  Top10EmployeeRow,
  Top10HospitalRow,
  Top10DiseaseRow,
} from "./types";
import {
  formatINR,
  formatYoYDelta,
  parseDDMonYYYY,
  currentFiscalYear,
} from "../../utils/hrAnalytics";

const CARD_RADIUS = "8px";

const MON_MAP: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
function parsePeriodEnd(s: string | null | undefined): Date | null {
  if (!s) return null;
  const parts = s.trim().split(/[\s/\-]+/);
  if (parts.length >= 3) {
    const [d, m, y] = parts;
    const mo = MON_MAP[m];
    if (mo !== undefined) return new Date(Number(y), mo, Number(d));
  }
  return null;
}
function daysUntil(d: Date | null): number | null {
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

const METRIC_LABEL_COLOR = "#667085";
const METRIC_VALUE_COLOR = "#1d2939";
const PAGE_BG = "#EBF6FF";
const HEALTHY = "#17c94d";
const CRITICAL = "#ef4444";

function _DashboardCard({
  title,
  titleIcon,
  children,
  highlighted = false,
  highlightColor = "#1C57B8",
}: {
  title?: string;
  titleIcon?: React.ReactNode;
  children: React.ReactNode;
  highlighted?: boolean;
  highlightColor?: string;
}) {
  return (
    <Box
      sx={{
        background: "linear-gradient(247deg, #EDEDED 6.94%, #FEFEFE 84.91%)",
        border: highlighted ? `2px solid ${highlightColor}` : "1px solid #FFF",
        borderRadius: CARD_RADIUS,
        boxShadow: highlighted
          ? `0 0 0 4px ${highlightColor}22, 0 6px 100px 0 rgba(0,0,0,0.1)`
          : "0 6px 100px 0 rgba(0, 0, 0, 0.1)",
        p: 4,
        height: "100%",
        transition: "border 0.25s ease, box-shadow 0.25s ease",
      }}
    >
      {title ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
          {titleIcon ? (
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "9px",
                bgcolor: "#EEF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {titleIcon}
            </Box>
          ) : null}
          <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 600, color: "#111827" }}>
            {title}
          </Typography>
        </Box>
      ) : null}
      {children}
    </Box>
  );
}

function _ActionButton({
  label,
  primary = false,
  onClick,
  grow = false,
}: {
  label: string;
  primary?: boolean;
  onClick?: () => void;
  grow?: boolean;
}) {
  return (
    <Box
      onClick={(event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        onClick?.();
      }}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2.25,
        height: 42,
        borderRadius: "6px",
        border: primary ? "1px solid #1C57B8" : "1px solid #D0D5DD",
        color: primary ? "#fff" : "#1C57B8",
        bgcolor: primary ? "#1C57B8" : "#fff",
        fontSize: 15, lineHeight: 1.7,
        fontWeight: 500,
        cursor: "pointer",
        flex: grow ? 1 : undefined,
        width: grow ? "100%" : "auto",
      }}
    >
      {label}
    </Box>
  );
}

function _DonutMetric({
  value,
  total,
  color,
  label,
  trend,
  trendColor,
}: {
  value: number;
  total: number;
  color: string;
  label: string;
  trend?: string;
  trendColor?: string;
}) {
  return (
    <Box sx={{ width: 176, height: 176, position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[
              { name: label, value, fill: color },
              {
                name: "Balance",
                value: Math.max(total - value, 0),
                fill: "#E7EDF5",
              },
            ]}
            dataKey="value"
            innerRadius={52}
            outerRadius={72}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          />
        </PieChart>
      </ResponsiveContainer>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Typography
          sx={{
            fontSize: 32, lineHeight: 1.2, letterSpacing: "-0.5px",
            fontWeight: 700,
            color: METRIC_VALUE_COLOR,
            lineHeight: 1,
          }}
        >
          {value}%
        </Typography>
        <Typography
          sx={{
            fontSize: 15, lineHeight: 1.7,
            color: METRIC_LABEL_COLOR,
            mt: 0.75,
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>
        {trend && (
          <Typography
            sx={{
              fontSize: 15, lineHeight: 1.7,
              fontWeight: 700,
              color: trendColor ?? METRIC_LABEL_COLOR,
              mt: 0.75,
              lineHeight: 1,
            }}
          >
            {trend}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TWO NAVIGATION SCENARIOS TO THIS DASHBOARD
//
// SCENARIO A — COMPANY CARD BUTTON
//   Source  : HRPortalPortfolio → "View Dashboard" button on a company card
//   Props   : filterPolicyId = undefined/null
//   API     : dashboard_policy_cards?page=1&limit=10  (paginated, infinite scroll)
//             dashboard_enrollment_status?page=1&limit=0
//   Result  : All policies for the company, paginated. Infinite scroll loads more.
//
// SCENARIO B — POLICY CARD BUTTON
//   Source  : HRPortalPortfolio → clicking a specific policy tile
//   Props   : filterPolicyId = 749406 (specific policy id passed via location.state)
//   API     : dashboard_policy_cards?page=1&limit=0&policyId=749406
//             (limit=0 → skip COUNT query, return only the 1 matching row)
//             dashboard_enrollment_status?page=1&limit=0
//   Result  : Only that one policy shown. No pagination (1 result, no scroll needed).
//
// KEY DIFFERENCES IN BEHAVIOUR:
//   - filterPolicyId set  → limit=0 (skip pagination), SQL WHERE p.id = policyId
//   - filterPolicyId unset → paginated (page=N, limit=10), SQL returns all company policies
//   - Infinite scroll sentinel is only active in Scenario A (Scenario B: 1 row, sentinel never fires)
//   - onClearPolicyFilter navigates back to Scenario A by clearing policyId from location.state
// ─────────────────────────────────────────────────────────────────────────────
export function HRPortalDashboard({ companyId: propCompanyId, onPolicyCount, locationIds = '', filterPolicyId, onClearPolicyFilter }: { companyId?: number | null; onPolicyCount?: (count: number) => void; locationIds?: string; filterPolicyId?: number; onClearPolicyFilter?: () => void }) {
  const navigate = useNavigate();
  const { localizationData } = useLocalization();

  // Debounce locationIds so rapid parent-state changes (e.g. on mount) don't
  // trigger multiple back-to-back dashboard_policy_cards fetches.
  const [debouncedLocationIds, setDebouncedLocationIds] = useState(locationIds);
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedLocationIds(locationIds), 300);
    return () => clearTimeout(t);
  }, [locationIds]);

  const getRelativeBarHeight = (
    value: number,
    minValue: number,
    range: number
  ) => `${25 + Math.round(((value - minValue) / Math.max(range, 1)) * 75)}%`;

  const getForecastBarHeight = (value: number, maxValue: number) =>
    `${Math.max(Math.round((value / Math.max(maxValue, 1)) * 100), 8)}%`;

  // ── Stable values — computed once on mount, never change during component lifetime ──
  // Router state takes precedence over sessionStorage (used when navigating from Portfolio).
  const location = useLocation();
  const navState = location.state as { companyId?: number; companyName?: string } | null;
  const companyId = propCompanyId ?? navState?.companyId ?? getCompanyId();
  
  const companyName = navState?.companyName ?? null;
  // FY defaults are used ONLY as the initial claim-period filter for policy_cards.
  // They are frozen so policy_cards params never change on re-renders.
  const { start: fyStart, end: fyEnd } = useMemo(() => currentFiscalYear(), []);

  // ── Policy period — confirmed from the policy_cards API response ─────────
  // Starts empty so downstream reports are disabled until policy_cards returns.
  // This breaks the circular dependency: policy_cards uses fyStart/fyEnd (frozen),
  // while downstream reports wait for the period confirmed from the response.
  const [policyPeriodStart, setPolicyPeriodStart] = useState("");
  const [policyPeriodEnd, setPolicyPeriodEnd] = useState("");

  // ── Policy cards pagination ───────────────────────────────────────────────
  const POLICY_PAGE_LIMIT = 10;
  const [policyPage, setPolicyPage] = useState(1);
  const [allPolicyCardsRaw, setAllPolicyCardsRaw] = useState<PolicyCardRow[]>([]);
  const [renewalStatusMap, setRenewalStatusMap] = useState<Record<number, string>>({});
  const policyPageRef = useRef(1);
  policyPageRef.current = policyPage;

  // ── Global context state ──────────────────────────────────────────────────
  const [showYoY, setShowYoY] = useState(true);

  const [activePolicyFilter, _setActivePolicyFilter] = useState("gmc");
  const [sendReminderOpen, setSendReminderOpen] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [eCardOpen, setECardOpen] = useState(false);
  const [eCardOverlayOpen, setECardOverlayOpen] = useState(false);
  const [eCardSearch, setECardSearch] = useState("");
  const [eCardEmployee, setECardEmployee] = useState<null | {
    name: string;
    empId: string;
    dob: string;
    gender: string;
    policyNo: string;
    policyName: string;
    insurer: string;
    sumInsured: string;
    validFrom: string;
    validTo: string;
    dependents: string[];
  }>(null);
  const [empDetailsOpen, setEmpDetailsOpen] = useState(false);
  const [empDetailsSearch, setEmpDetailsSearch] = useState("");
  const [claimStatusOpen, setClaimStatusOpen] = useState(false);
  const [claimStatusSearch, setClaimStatusSearch] = useState("");
  const [_dashboardSearch, _setDashboardSearch] = useState("");
  const SESSION_FILTER_KEY = `hrDashboardFilter_${companyId}`;
  const [policyFilter, setPolicyFilter] = useState<"all" | "lifehealth" | "nonlife" | "inactive">(
    () => {
      const saved = sessionStorage.getItem(SESSION_FILTER_KEY);
      return (saved as "all" | "lifehealth" | "nonlife" | "inactive") ?? "all";
    }
  );
  const policyCardsScrollRef = useRef<HTMLDivElement>(null);
  const dashboardRootRef = useRef<HTMLDivElement>(null);

  // ── API params for dashboard_policy_cards ────────────────────────────────
  // policyStatus drives the Active / Inactive date gate on the backend.
  // policyCardsTypeParam drives the Life / Non-Life EXISTS filter on the backend.
  // policyTypeParam stays '' for other reports (enrollment etc.) that don't
  // support the new filter values.
  const policyCardsStatusParam = useMemo<string>(() => {
    return policyFilter === "inactive" ? "INACTIVE" : "";
  }, [policyFilter]);

  const policyCardsTypeParam = useMemo<string>(() => {
    if (policyFilter === "lifehealth") return "LIFE";
    if (policyFilter === "nonlife") return "NON_LIFE";
    return "";
  }, [policyFilter]);

  const policyTypeParam = useMemo<string>(() => {
    return policyFilter === "inactive" ? "INACTIVE" : "";
  }, [policyFilter]);

  // ── Reset downstream period whenever the policy filter changes ───────────
  // This disables downstream reports (periodReady = false) while policy_cards
  // re-fetches for the new filter, preventing stale-period + new-type mismatches.
  useEffect(() => {
    sessionStorage.setItem(SESSION_FILTER_KEY, policyFilter);
    setPolicyPeriodStart("");
    setPolicyPeriodEnd("");
    setPolicyPage(1);
    setAllPolicyCardsRaw([]);
    onPolicyCount?.(0);
    // Scroll to top — walk up DOM to find the first scrollable ancestor (HRPageContent)
    let el: HTMLElement | null = dashboardRootRef.current?.parentElement ?? null;
    while (el && el !== document.documentElement) {
      if (el.scrollTop > 0) { el.scrollTo({ top: 0, behavior: "smooth" }); break; }
      el = el.parentElement;
    }
  }, [policyFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset cards when location filter changes so stale cards don't show ────
  // policyFilter change already clears via the effect above.
  // debouncedLocationIds has its own effect here so skeleton shows immediately
  // instead of old cards + skeleton overlapping (the "glitch" the user sees).
  useEffect(() => {
    setPolicyPage(1);
    setAllPolicyCardsRaw([]);
    onPolicyCount?.(0); // reset the header counter so stale "5 Policies" doesn't show
  }, [debouncedLocationIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── API calls ─────────────────────────────────────────────────────────────

  // Policy Cards — uses FROZEN fyStart/fyEnd, NOT the downstream period state.
  // This is intentional: period state is SET from this response, so including
  // it in the params would create a circular re-fetch loop.
  const {
    data: policyCardsPage,
    total: policyCardsTotal,
    isLoading: policyCardsLoading,
    isFetching: policyCardsFetching,
    isError: policyCardsError,
    refetch: refetchPolicyCards,
  } = useHRReport<PolicyCardRow>(
    "dashboard_policy_cards",
    {
      companyId,
      policyType: policyCardsTypeParam,
      policyStatus: policyCardsStatusParam,
      locationIds: debouncedLocationIds,
      // When a single policy is selected, pass its id directly so the SQL
      // returns exactly that one policy regardless of active/inactive status.
      // Removes the need for client-side .filter() that could miss the policy.
      ...(filterPolicyId ? { policyId: String(filterPolicyId) } : { policyId: '' }),
    },
    !!companyId,
    // When a specific policy is selected (POLICY_CARD scenario), always load in one shot —
    // there is only 1 result and the sentinel would fire immediately for page=2 otherwise.
    // When no policy is selected (COMPANY_CARD scenario), paginate normally.
    filterPolicyId ? { page: 1, limit: 0 } : { page: policyPage, limit: POLICY_PAGE_LIMIT }
  );
  // Log every time the query key changes (= every time a new API call fires)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const scenario = filterPolicyId != null ? "POLICY_CARD" : "COMPANY_CARD";
    const pageMode = filterPolicyId != null ? "limit=0 (single policy, no pagination)" : `page=${policyPage} limit=${POLICY_PAGE_LIMIT}`;
  }, [policyPage, filterPolicyId, companyId, debouncedLocationIds, policyCardsTypeParam, policyCardsStatusParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Confirm period from the first policy card row and enable downstream reports.
  // Only updates state when the parsed values actually differ (string identity check
  // prevents unnecessary re-renders when the dates match the current state).
  useEffect(() => {
    if (!policyCardsPage.length) return;
    const first = policyCardsPage[0];
    const start = parseDDMonYYYY(first.periodStart);
    const end   = parseDDMonYYYY(first.periodEnd);
    if (start && start !== policyPeriodStart) setPolicyPeriodStart(start);
    if (end   && end   !== policyPeriodEnd)   setPolicyPeriodEnd(end);
  }, [policyCardsPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Accumulate pages: page 1 replaces, subsequent pages append.
  // policyPageRef carries the current page synchronously so this effect
  // doesn't need policyPage in its dep array (avoids running on every
  // page increment before the new response arrives).
  useEffect(() => {
    if (!policyCardsPage.length) return;
    // policyCardsFetching being true while data is present means this is
    // placeholder (stale) data from the previous query — React Query's
    // placeholderData returns the previous result while fetching new params.
    // Skip it so we don't restore old location's cards after clearing.
    if (policyCardsFetching) return;
    if (policyPageRef.current === 1) {
      setAllPolicyCardsRaw(policyCardsPage);
    } else {
      setAllPolicyCardsRaw((prev) => [...prev, ...policyCardsPage]);
    }
  }, [policyCardsPage, policyCardsFetching]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (policyCardsTotal != null) onPolicyCount?.(policyCardsTotal);
  }, [policyCardsTotal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Single batch call: fetch renewal status for all current policy cards at once
  useEffect(() => {
    if (!allPolicyCardsRaw.length) return;
    const policyIds = allPolicyCardsRaw.map((p) => String(p.policyId)).join(',');
    apiRequest(`${endPoints.generateHRReports}policy_renewal_status?limit=0`, {
      method: "POST",
      data: { policyIds },
    })
      .then((res: any) => {
        const rows: any[] = res?.data?.data ?? [];
        // Rows are sorted by (policyId, priority ASC) — first row per policyId = highest priority
        const next: Record<number, string> = {};
        rows.forEach((row) => {
          if (row.policyId != null && !(row.policyId in next)) {
            next[row.policyId] = row.activityName ?? "—";
          }
        });
        setRenewalStatusMap(next);
      })
      .catch(() => { /* leave existing map intact on error */ });
  }, [allPolicyCardsRaw]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll-based pagination: fetch next page when user is within 300px of bottom.
  const hasMoreCards = allPolicyCardsRaw.length < (policyCardsTotal ?? 0);
  const paginationSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = paginationSentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // allPolicyCardsRaw.length > 0 guard: prevents the sentinel from
        // firing (and incrementing policyPage beyond 1) while the array has
        // just been cleared for a filter change but data hasn't arrived yet.
        const isIntersecting = entries[0].isIntersecting;
        if (isIntersecting && hasMoreCards && !policyCardsFetching && allPolicyCardsRaw.length > 0) {
          setPolicyPage((p) => p + 1);
        }
      },
      { threshold: 0, rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMoreCards, policyCardsFetching, allPolicyCardsRaw.length]);

  // Fetch all CD transactions for the company (no policyId filter) in one call

  // True only after policy_cards confirms the period — gates all downstream fetches
  const periodReady = !!policyPeriodStart && !!policyPeriodEnd;

  // Premium Summary
  // const { data: premiumSummaryRaw, isLoading: premiumSummaryLoading } =
  //   useHRReport<PremiumSummaryRow>(
  //     "dashboard_premium_summary",
  //     { companyId, policyType: policyTypeParam, policyPeriodStart, policyPeriodEnd },
  //     !!companyId && periodReady
  //   );

  // // Claims KPI (date range matches the active policy period)
  // const { data: claimsKpiRaw, isLoading: claimsKpiLoading } =
  //   useHRReport<ClaimsKpiRow>(
  //     "dashboard_claims_analysis_kpi",
  //     {
  //       companyId, policyType: policyTypeParam,
  //       startDate: policyPeriodStart, endDate: policyPeriodEnd,
  //       claimType: "", claimStatus: "", memberType: "",
  //     },
  //     !!companyId && periodReady
  //   );

  // // Claims Monthly Trend
  // const { data: claimsMonthlyRaw, isLoading: claimsMonthlyLoading } =
  //   useHRReport<ClaimsMonthRow>(
  //     "dashboard_claims_monthly_trend",
  //     {
  //       companyId, policyType: policyTypeParam,
  //       startDate: policyPeriodStart, endDate: policyPeriodEnd,
  //       claimType: "", claimStatus: "", memberType: "",
  //     },
  //     !!companyId && periodReady
  //   );

  // Enrollment Status — returns 1 aggregate row, use limit=0 to skip the redundant COUNT query
  const { data: enrollmentStatusRaw, isLoading: enrollmentStatusLoading } =
    useHRReport<EnrollmentStatusRow>(
      "dashboard_enrollment_status",
      { companyId, policyType: policyTypeParam, locationIds: debouncedLocationIds },
      !!companyId,
      { page: 1, limit: 0 }
    );

  // Demographics
  // const { data: demographicsRaw, isLoading: demographicsLoading } =
  //   useHRReport<DemographicsRow>(
  //     "dashboard_demographics",
  //     { companyId, policyType: policyTypeParam, policyPeriodStart, policyPeriodEnd },
  //     !!companyId && periodReady
  //   );

  // ── Top-10 (lazy — only fetches when the corresponding tab is active) ─────
  const [claimInsightsView, setClaimInsightsView] = useState<
    "employees" | "hospitals" | "diseases"
  >("employees");

  // const { data: top10EmployeesRaw, isLoading: top10EmployeesLoading } =
  //   useHRReport<Top10EmployeeRow>(
  //     "dashboard_top10_employees",
  //     {
  //       companyId, policyType: policyTypeParam,
  //       policyPeriodStart, policyPeriodEnd,
  //       claimType: "", claimStatus: "", memberType: "",
  //     },
  //     !!companyId && periodReady && claimInsightsView === "employees"
  //   );

  // const { data: top10HospitalsRaw, isLoading: top10HospitalsLoading } =
  //   useHRReport<Top10HospitalRow>(
  //     "dashboard_top10_hospitals",
  //     {
  //       companyId, policyType: policyTypeParam,
  //       policyPeriodStart, policyPeriodEnd,
  //       claimType: "", claimStatus: "", memberType: "",
  //     },
  //     !!companyId && periodReady && claimInsightsView === "hospitals"
  //   );

  // const { data: top10DiseasesRaw, isLoading: top10DiseasesLoading } =
  //   useHRReport<Top10DiseaseRow>(
  //     "dashboard_top10_diseases",
  //     {
  //       companyId, policyType: policyTypeParam,
  //       policyPeriodStart, policyPeriodEnd,
  //       claimStatus: "", memberType: "",
  //     },
  //     !!companyId && periodReady && claimInsightsView === "diseases"
  //   );

  // Suppress TS "unused" warnings for data that drives future sections
  // void premiumSummaryLoading; void claimsKpiLoading; void claimsMonthlyLoading;
  // void enrollmentStatusLoading; void demographicsLoading;
  // void top10EmployeesLoading; void top10HospitalsLoading; void top10DiseasesLoading;
  // void claimsMonthlyRaw; void claimsKpiRaw; void premiumSummaryRaw; void demographicsRaw;
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [_highlightedCard, setHighlightedCard] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set()
  );
  const [addFundOpen, setAddFundOpen] = useState(false);
  const [addFundAccount, _setAddFundAccount] = useState<{
    name: string;
    balance: string;
    accountCode: string;
  } | null>(null);
  const [addFundAmount, setAddFundAmount] = useState("");
  const [addFundPayMethod, setAddFundPayMethod] = useState<"neft" | "upi">(
    "neft"
  );
  const [addFundSuccess, setAddFundSuccess] = useState(false);

  type AlertCardKey = "cd" | "claims" | "enrollment";
  type AlertSeverity = "critical" | "warning";
  type AlertDef = {
    id: string;
    cardKey: AlertCardKey;
    severity: AlertSeverity;
    category: string;
    title: string;
    body: string;
    color: string;
    bg: string;
    border: string;
  };

  // ─── Alerts derived from live API data ────────────────────────────────────
  const computedAlerts = useMemo<AlertDef[]>(() => {
    const list: AlertDef[] = [];

    // CD alerts: flag policies where available balance is below 10% (critical) or 20% (warning) of net premium
    allPolicyCardsRaw.forEach((p) => {
      const cdAvailable     = p.cdBalance != null ? Number(p.cdBalance) : Number(p.cdRunningBalance ?? 0);
      const _totalLives     = p.totalLives ?? 0;
      const _perLifePremium = _totalLives > 0 ? (p.netPremium ?? 0) / _totalLives : 0;
      const safeLimit       = p.safeLimit != null ? Number(p.safeLimit) : (_totalLives * 0.1) * _perLifePremium;
      const warnLimit       = safeLimit * 2;
      if (cdAvailable < safeLimit) {
        list.push({
          id: `cd-${p.policyId}-critical`,
          cardKey: "cd",
          severity: "critical",
          category: "CD Balance",
          title: `${p.policyName} CD balance critical`,
          body: `Remaining CD (${formatINR(cdAvailable, localizationData?.data)}) is below safe limit of ${formatINR(safeLimit, localizationData?.data)}. Add funds to avoid claim delays.`,
          color: "#DC2626",
          bg: "#FEF2F2",
          border: "#FECACA",
        });
      } else if (cdAvailable < warnLimit) {
        list.push({
          id: `cd-${p.policyId}-warning`,
          cardKey: "cd",
          severity: "warning",
          category: "CD Balance",
          title: `${p.policyName} CD balance warning`,
          body: `Remaining CD (${formatINR(cdAvailable, localizationData?.data)}) is approaching safe limit of ${formatINR(safeLimit, localizationData?.data)}. Top up soon.`,
          color: "#D97706",
          bg: "#FFFBEB",
          border: "#FDE68A",
        });
      }
    });

    // Claims alert: any policy with ICR > 80%
    const highIcrPolicies = allPolicyCardsRaw.filter((p) => (p.icrPercent ?? 0) > 80);
    if (highIcrPolicies.length > 0) {
      list.push({
        id: "claims-ratio-spike",
        cardKey: "claims",
        severity: "critical",
        category: "Claims",
        title: "High claim ratio detected",
        body: `ICR above 80% on ${highIcrPolicies.length} ${highIcrPolicies.length === 1 ? "policy" : "policies"} — renewal premium may rise`,
        color: "#DC2626",
        bg: "#FEF2F2",
        border: "#FECACA",
      });
    }

    // Enrollment alert: company-wide confirmed enrollment below 80%
    const es = enrollmentStatusRaw[0];
    if (es && (es.enrollmentConfirmedPercent ?? 100) < 80) {
      const pending = es.totalEligible - es.enrollmentConfirmed;
      list.push({
        id: "enrollment-incomplete",
        cardKey: "enrollment",
        severity: "warning",
        category: "Enrolment",
        title: `${pending} employees not enroled`,
        body: "Enrolment window open — send reminders",
        color: "#D97706",
        bg: "#FFFBEB",
        border: "#FDE68A",
      });
    }

    return list;
  }, [allPolicyCardsRaw, enrollmentStatusRaw]);

  // Remove alerts that the user dismissed in this session.
  // Dismissed set is cleared whenever the underlying data changes (new alert = fresh start).
  const visibleAlerts = useMemo(
    () => computedAlerts.filter((a) => !dismissedAlerts.has(a.id)),
    [computedAlerts, dismissedAlerts]
  );
  const _criticalCount = visibleAlerts.filter(
    (a) => a.severity === "critical"
  ).length;

  const _handleAlertClick = (alert: AlertDef) => {
    if (activeAlertId === alert.id) {
      setActiveAlertId(null);
      setHighlightedCard(null);
      return;
    }
    setActiveAlertId(alert.id);
    setHighlightedCard(alert.cardKey);
    setTimeout(() => {
      document
        .getElementById(`dashboard-card-${alert.cardKey}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  };

  const _dismissAlert = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedAlerts((prev) => new Set([...prev, id]));
    if (activeAlertId === id) {
      setActiveAlertId(null);
      setHighlightedCard(null);
    }
  };

  const _dismissAll = () => {
    setDismissedAlerts(new Set(computedAlerts.map((a) => a.id)));
    setActiveAlertId(null);
    setHighlightedCard(null);
  };

  // ── enrollmentCardData: derived from enrollment status API ──────────────
  const enrollmentCardData = useMemo(() => {
    const es = enrollmentStatusRaw[0];
    const notEnrolledCount = es ? es.totalEligible - es.enrollmentConfirmed : 0;
    return {
      notEnrolledCount,
      impact: notEnrolledCount > 0
        ? `${notEnrolledCount} employees have not enroled and may not access benefits or file claims.`
        : "All eligible employees have been enroled.",
    };
  }, [enrollmentStatusRaw]);

  // ── _claimInsightsData: top-10 chart data from API ────────────────────────
  // const _claimInsightsData = useMemo(() => {
  //   if (claimInsightsView === "hospitals") {
  //     return {
  //       title: "Top 10 Hospitals by Claim Amount",
  //       color: "#F59E0B",
  //       data: top10HospitalsRaw.map((r) => ({
  //         name: r.hospitalName,
  //         value: r.totalAmount / 100000,
  //         rankChange: r.rankChange,
  //       })),
  //       isLoading: top10HospitalsLoading,
  //     };
  //   }
  //   if (claimInsightsView === "diseases") {
  //     return {
  //       title: "Top 10 Diseases by Claim Amount",
  //       color: "#10B981",
  //       data: top10DiseasesRaw.map((r) => ({
  //         name: r.diseaseCategory,
  //         value: r.totalAmount / 100000,
  //         rankChange: r.rankChange,
  //       })),
  //       isLoading: top10DiseasesLoading,
  //     };
  //   }
  //   return {
  //     title: "Top 10 Employees by Claim Amount",
  //     color: "#3158F5",
  //     data: top10EmployeesRaw.map((r) => ({
  //       name: r.employeeName,
  //       value: r.totalAmount / 100000,
  //       rankChange: r.rankChange,
  //     })),
  //     isLoading: top10EmployeesLoading,
  //   };
  // }, [
  //   claimInsightsView,
  //   top10EmployeesRaw, top10EmployeesLoading,
  //   top10HospitalsRaw, top10HospitalsLoading,
  //   top10DiseasesRaw, top10DiseasesLoading,
  // ]);

  // ── _memberInsightsData: demographics quadrant from API ───────────────────
  // const _memberInsightsData = useMemo(() => {
  //   const d = demographicsRaw[0];
  //   if (!d) return [
  //     { title: "INCEPTION", total: "—", emp: 0, dep: 0 },
  //     { title: "ADDITION",  total: "—", emp: 0, dep: 0 },
  //     { title: "DELETION",  total: "—", emp: 0, dep: 0 },
  //     { title: "TOTAL",     total: "—", emp: 0, dep: 0 },
  //   ];
  //   const empPct = (e: number, t: number) =>
  //     t > 0 ? Math.round((e / t) * 1000) / 10 : 0;
  //   return [
  //     { title: "INCEPTION", total: d.inceptionMembersTotal.toLocaleString("en-IN"), emp: empPct(d.inceptionEmployees, d.inceptionMembersTotal), dep: empPct(d.inceptionDependents, d.inceptionMembersTotal) },
  //     { title: "ADDITION",  total: d.newAdditionsTotal.toLocaleString("en-IN"),     emp: empPct(d.newAdditionsEmployees, d.newAdditionsTotal),    dep: empPct(d.newAdditionsDependents, d.newAdditionsTotal)    },
  //     { title: "DELETION",  total: d.deletionsTotal.toLocaleString("en-IN"),        emp: empPct(d.deletionsEmployees, d.deletionsTotal),          dep: empPct(d.deletionsDependents, d.deletionsTotal)          },
  //     { title: "TOTAL",     total: d.totalActiveMembers.toLocaleString("en-IN"),    emp: empPct(d.totalActiveEmployees, d.totalActiveMembers),    dep: empPct(d.totalActiveDependents, d.totalActiveMembers)    },
  //   ];
  // }, [demographicsRaw]);

  // ── Icon mapping helper (policyTypeKey → visual style) ───────────────────
  const getPolicyIconProps = useCallback(
    (typeKey: string, name: string) => {
      const k = `${typeKey} ${name}`.toLowerCase();
      if (k.includes("mediclaim") || k.includes("health") || k.includes("gmc") || k.includes("gmp"))
        return { icon: <HeartHandshake size={22} color="#fff" />, iconAccent: "#1C57B8", iconBg: "#EBF3FF" };
      if (k.includes("term") || k.includes("life") || k.includes("gtl"))
        return { icon: <Shield size={22} color="#fff" />, iconAccent: "#7C3AED", iconBg: "#F3F0FF" };
      if (k.includes("accident") || k.includes("gpa"))
        return { icon: <Activity size={22} color="#fff" />, iconAccent: "#059669", iconBg: "#ECFDF5" };
      if (k.includes("parent") || k.includes("gpc"))
        return { icon: <Users size={22} color="#fff" />, iconAccent: "#D97706", iconBg: "#FFF7ED" };
      return { icon: <Shield size={22} color="#fff" />, iconAccent: "#1C57B8", iconBg: "#EBF3FF" };
    },
    []
  );

  // ── mappedPolicyCards: transform API rows into the UI policy shape ────────
  const mappedPolicyCards = useMemo(() => {
    return allPolicyCardsRaw.map((p, _idx) => {
      const netPremium    = Number(p.netPremium) || 0;
      const cdAvailable   = p.cdBalance != null ? Number(p.cdBalance) : Number(p.cdRunningBalance ?? 0);
      const totalLives      = p.totalLives ?? 0;
      const perLifePremium  = totalLives > 0 ? netPremium / totalLives : 0;
      const safeLimit       = p.safeLimit != null ? Number(p.safeLimit) : (totalLives * 0.1) * perLifePremium;
      const warnLimit       = safeLimit * 2;
      const cdColor       = cdAvailable < safeLimit ? "#EF4444" : cdAvailable < warnLimit ? "#F59E0B" : "#10B981";
      const barMax        = cdAvailable < safeLimit ? safeLimit * 2 : cdAvailable + safeLimit * 2;
      const availPct      = barMax > 0 ? Math.min(100, Math.max(0, (cdAvailable / barMax) * 100)) : 0;
      const safeMarkerPct = barMax > 0 ? Math.min(100, Math.max(0, (safeLimit / barMax) * 100)) : 0;
      const usedPct       = netPremium > 0 ? Math.max(0, 100 - Math.min(100, (cdAvailable / netPremium) * 100)) : 0;
      const cdUsed        = (p.cdUsedAmount > 0)
                              ? p.cdUsedAmount
                              : Math.max(0, netPremium - p.cdBalance);
      const cdTotal       = p.cdBalance + (p.cdUsedAmount > 0 ? p.cdUsedAmount : Math.max(0, netPremium - p.cdBalance));
      const icrHigh       = (p.icrPercent ?? 0) > 80;
      const icrDelta      = formatYoYDelta(p.icrYoYChangePercent);
      const claimDeltaGood = p.icrYoYChangePercent !== null && p.icrYoYChangePercent <= 0;
      const { icon, iconAccent, iconBg } = getPolicyIconProps(p.policyTypeKey, p.policyName);
      const incurredNum   = p.claimAmount / 100000;
      const lyIncurredNum = p.icrSamePeriodLYAmount / 100000;
      // Trend-adjusted forecast: scale LY full-year ICR by current vs LY-same-period pace.
      // Use claim AMOUNTS (not %) for the ratio so the denominator choice (earned vs net premium)
      // doesn't amplify the result when the two ICR fields use different bases.
      const _lyFullIcr    = p.icrFullYearAvgLY ?? 0;
      const _curYtdIcr    = p.icrPercent ?? 0;
      const _lyPeriodIcr  = p.icrSamePeriodLYPercent ?? 0;
      const _lyPeriodAmt  = p.icrSamePeriodLYAmount ?? 0;
      const _curAmt       = p.claimAmount ?? 0;
      const forecastICR   = (() => {
        if (_lyPeriodAmt > 0 && _lyFullIcr > 0)
          return Math.round(_lyFullIcr * (_curAmt / _lyPeriodAmt));
        if (_lyPeriodIcr > 0 && _lyFullIcr > 0)
          return Math.round(_lyFullIcr * (_curYtdIcr / _lyPeriodIcr));
        return p.icrForecastPercent != null ? Math.round(p.icrForecastPercent) : null;
      })();

      return {
        id: String(p.policyId),
        policyId: p.policyId,
        name: p.policyName,
        shortCode: p.policyTypeKey?.slice(0, 3).toUpperCase() ?? "POL",
        policyNo: p.policyNumber ?? `POL-${p.policyId}`,
        policyNumber: p.policyNumber ?? `POL-${p.policyId}`,
        type: p.policyTypeKey,
        iiRmTypeKey: p.iiRmTypeKey ?? '',
        icon,
        iconAccent,
        iconBg,
        insurer: p.insurer,
        tpaId: p.tpaName ?? "—",
        tpaName: p.tpaName ?? "—",
        cdAccountNumber: p.cdAccountNumber ?? "—",
        lives: formatNumberByLocalization(p.totalLives, localizationData?.data),
        renewalYear: "—",
        policyYear: `${p.periodStart?.slice(-4) ?? ""} – ${p.periodEnd?.slice(-4) ?? ""}`,
        policyPeriod: `${p.periodStart} – ${p.periodEnd}`,
        endorsementDate: "—",
        lastEnrollmentDate: "—",
        criticalCount: usedPct >= 50 ? 1 : 0,
        usedAmount: formatINR(cdUsed, localizationData?.data),
        usedPct,
        available: formatINR(cdAvailable, localizationData?.data),
        totalAmount: formatINR(cdTotal, localizationData?.data),
        safeLimit: formatINR(safeLimit, localizationData?.data),
        safeMarkerPct,
        availPct,
        cdColor,
        cdStatus: cdColor === "#EF4444" ? "Critical" : cdColor === "#F59E0B" ? "Warning" : "Healthy",
        cdInsightText: cdColor === "#EF4444"
          ? "Add funds to avoid claim delays."
          : cdColor === "#F59E0B"
          ? "Top up soon."
          : "No action needed.",
        annualPremium: formatINR(p.netPremium, localizationData?.data),
        claimValue: p.icrPercent ?? 0,
        claimColor: icrHigh ? "#EF4444" : "#10B981",
        claimStatus: icrHigh ? "High risk" : "Healthy",
        claimDelta: icrDelta ?? "—",
        claimDeltaGood,
        claimLYNum: p.icrSamePeriodLYPercent ?? 0,
        claimLYDelta: "—",
        claimLYDeltaGood: false,
        claimLYAvgNum: p.icrFullYearAvgLY ?? 0,
        claimLYAvgDelta: "—",
        claimLYAvgDeltaGood: false,
        premiumOutlookTitle: icrHigh ? "Premium at risk" : "Premium outlook",
        premiumOutlookColor: icrHigh ? "#EF4444" : "#10B981",
        premiumOutlookText: icrHigh
          ? "ICR above 80% — premium may increase."
          : "ICR healthy — premium likely stable.",
        premiumSavingLabel: icrHigh ? "EXTRA PREMIUM" : "POTENTIAL SAVING",
        premiumSavingValue: null as string | null,
        claimCount: p.icrClaimCount,
        incurred: formatINR(p.claimAmount, localizationData?.data),
        incurredNum,
        // LY claim counts not returned by dashboard_policy_cards — stub as 0
        lyClaimCount: 0,
        lyIncurredNum,
        lyIncurred: formatINR(p.icrSamePeriodLYAmount, localizationData?.data),
        lyAvgClaimCount: 0,
        lyAvgIncurredNum: (p.icrFullYearAvgLYAmount ?? 0) / 100000,
        lyAvgIncurred: formatINR(p.icrFullYearAvgLYAmount ?? 0, localizationData?.data),
        enrolled: p.enrolledCount,
        notEnrolled: p.notEnrolledCount,
        notLoggedIn: p.notLoggedInCount ?? 0,
        hrConfirmed: p.enrolledCount,
        active: p.enrolledCount,
        loggedIn: p.loggedInCount ?? 0,
        inProgress: p.inProgressCount,
        total: p.employeeCount,
        totalEmployees: p.employeeCount,
        totalDependents: p.dependentCount,
        enrollColor: "#D97706",
        enrollStatus: "Pending",
        enrollDaysLeft: "—",
        enrollEndDate: p.periodEnd,
        enrollImpactTitle: "Enrolment impact",
        enrollImpactText: p.notEnrolledCount > 0
          ? `${p.notEnrolledCount} employees pending enrolment.`
          : "All employees enroled.",
        claimInsight: icrHigh ? "High ICR — premium may increase at renewal" : "Stable ICR — premium outlook positive",
        enrollInsight: `${p.notEnrolledCount} employees pending`,
        combinedImpact: "",
        memberAdditions: p.memberAdditions,
        memberDeletions: p.memberDeletions,
        forecastICR,
        daysToExpiry: daysUntil(parsePeriodEnd(p.periodEnd)),
        renewalStatus: renewalStatusMap[p.policyId] ?? "—",
        totalAssets: p.totalAssets ?? 0,
        totalSubAssets: p.totalSubAssets ?? 0,
        totalSumInsured: p.totalSumInsured ?? 0,
        assetTotalPremium: p.assetTotalPremium ?? 0,
        _raw: p,
      };
    });
  }, [allPolicyCardsRaw, getPolicyIconProps, renewalStatusMap, localizationData]);

  // When coming from Portfolio "View Dashboard" on a specific policy, filter to just that policy.
  const displayedPolicyCards = useMemo(
    () => filterPolicyId ? mappedPolicyCards.filter((p) => p._raw?.policyId === filterPolicyId) : mappedPolicyCards,
    [mappedPolicyCards, filterPolicyId]
  );

  const summaryStats = useMemo(() => {
    // When a specific policy is filtered, aggregate only that policy's data
    const cards = filterPolicyId ? displayedPolicyCards : mappedPolicyCards;
    const employees   = cards.reduce((s, p) => s + (Number(p.totalEmployees) || 0), 0);
    const dependants  = cards.reduce((s, p) => s + (Number(p.totalDependents) || 0), 0);
    const totalLives  = employees + dependants;
    const inProgress  = cards.reduce((s, p) => s + (Number(p.inProgress) || 0), 0);
    const notStarted  = cards.reduce((s, p) => s + (Number(p.notEnrolled) || 0), 0);
    const notLoggedIn = cards.reduce((s, p) => s + (Number((p as any).notLoggedIn) || 0), 0);
    const additions   = cards.reduce((s, p) => s + (Number(p.memberAdditions) || 0), 0);
    const deletions   = cards.reduce((s, p) => s + (Number(p.memberDeletions) || 0), 0);
    const endorsements = additions + deletions;
    const highIcr     = cards.filter(p => (Number(p.claimValue) || 0) > 80).length;
    const cdWarn      = cards.filter(p => p.cdColor === '#EF4444' || p.cdColor === '#F59E0B').length;
    const icrValues   = cards.map(p => Number(p.claimValue) || 0).filter(v => !isNaN(v));
    const avgIcr      = icrValues.length > 0 ? Math.round(icrValues.reduce((s, v) => s + v, 0) / icrValues.length) : 0;
    const enrolledPct = employees > 0 ? Math.max(0, Math.min(100, Math.round(((employees - notStarted) / employees) * 100))) : 100;
    return { employees, dependants, totalLives, inProgress, notStarted, notLoggedIn, additions, deletions, endorsements, highIcr, cdWarn, avgIcr, pending: notStarted, enrolledPct };
  }, [mappedPolicyCards, displayedPolicyCards, filterPolicyId]);

  // Suppress TS unused-variable warnings — referenced once Claims/Premium/Demographics sections are rendered
  // void _claimInsightsData; void _memberInsightsData;
  // void showYoY; void setShowYoY; void activePolicyFilter; void setClaimInsightsView;
  // void _criticalCount; void _handleAlertClick; void _dismissAlert; void _dismissAll;
  // Module-level helpers suppressed at the same point (HEALTHY/CRITICAL/sub-components not yet in JSX)
  void (HEALTHY as unknown); void (CRITICAL as unknown);
  void (_DashboardCard as unknown); void (_ActionButton as unknown); void (_DonutMetric as unknown);

  const _claimInsightsSummary = useMemo(() => {
    if (claimInsightsView === "hospitals") {
      return {
        title: "Overall insight",
        body: "Hospital spending is concentrated in a small network cluster. Preferred-network steering and tariff review can reduce future costs.",
        highlight:
          "Apollo, Yashoda, and Fortis together drive the largest hospital claim share.",
      };
    }

    if (claimInsightsView === "diseases") {
      return {
        title: "Overall insight",
        body: "Lifestyle and chronic disease categories are driving the highest claims. Preventive programs can help lower future utilization.",
        highlight:
          "Diabetes, Hypertension, and Cardiovascular claims lead the disease mix.",
      };
    }

    return {
      title: "Overall insight",
      body: "A small employee group contributes a large share of claims. Case review and targeted support can improve outcomes and reduce repeat utilization.",
      highlight:
        "Top employees account for the majority of high-value claims in the current period.",
    };
  }, [claimInsightsView]);
  void _claimInsightsSummary;

  return (
    <Box
      ref={dashboardRootRef}
      sx={{
        mx: -3,
        minHeight: "100%",
        background: PAGE_BG,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ─── Policies heading ─────────────────────────────────────────────── */}
      <Box
        sx={{
          pl: { xs: 3, sm: 6 },
          pr: { xs: 3, sm: 6 },
          pt: 2,
          pb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          bgcolor: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 1,
          borderBottom: "1px solid #E5E7EB",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          flexWrap: { xs: "wrap", sm: "nowrap" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#111827" }}>
            Policies
          </Typography>
          {policyCardsTotal != null && policyCardsTotal > 0 && (() => {
            const displayedRaw = filterPolicyId
              ? allPolicyCardsRaw.filter((p) => p.policyId === filterPolicyId)
              : allPolicyCardsRaw;
            const displayCount = filterPolicyId ? displayedRaw.length : policyCardsTotal;
            const totalPrem = displayedRaw.reduce((s, p) => s + (Number(p.netPremium) || 0), 0);
            const chips = [
              { icon: <Shield size={18} color="#1D4ED8" />, value: String(displayCount), label: displayCount == 1 ? "Policy" : "Policies", bg: "#EFF6FF", border: "#BFDBFE", color: "#1D4ED8" },
              { icon: <Box component="span" sx={{ fontSize: 18, lineHeight: 1, fontWeight: 700, color: "#059669" }}></Box>, value: formatINR(totalPrem, localizationData?.data), label: "Total Premium", bg: "#ECFDF5", border: "#6EE7B7", color: "#059669" },
            ];
            return (
              <>
                <Box sx={{ width: "1px", height: 22, bgcolor: "#E5E7EB", flexShrink: 0 }} />
                {chips.map((chip, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.75, py: 0.6, borderRadius: "20px", bgcolor: chip.bg, border: `1px solid ${chip.border}` }}>
                    {chip.icon}
                    <Typography sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 700, color: chip.color }}>{chip.value}</Typography>
                    <Typography sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", color: "#6B7280" }}>{chip.label}</Typography>
                  </Box>
                ))}
              </>
            );
          })()}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, ml: "auto", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {(["all", "lifehealth", "nonlife", "inactive"] as const).map((f) => {
            const label =
              f === "all" ? "All Active" : f === "lifehealth" ? "Life & Health" : f === "nonlife" ? "Non-Life" : "Inactive";
            const active = policyFilter === f;
            return (
              <Box
                key={f}
                onClick={() => setPolicyFilter(f)}
                sx={{
                  px: 1.4, py: 0.5, borderRadius: 999,
                  fontSize: 15, lineHeight: 1.7,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  color: active ? "#fff" : "#6B7280",
                  bgcolor: active ? "#1C57B8" : "#F3F4F6",
                  border: active ? "1px solid #1C57B8" : "1px solid #E5E7EB",
                  transition: "all 0.15s ease",
                  "&:hover": { bgcolor: active ? "#1D4ED8" : "#E9EBF0", color: active ? "#fff" : "#374151" },
                  userSelect: "none",
                }}
              >
                {label}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ─── Policy Cards ──────────────────────────────────────────────── */}
      <Box
        sx={{
          px: { xs: 3, sm: 6 },
          pt: 5,
          pb: 8,
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 9,
        }}
      >
        {filterPolicyId && displayedPolicyCards.length > 0 && (
          <Box
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              px: 2.5, py: 1.25, mb: 2.5,
              borderRadius: '12px',
              background: 'linear-gradient(90deg, #EFF6FF 0%, #F0F9FF 100%)',
              border: '1px solid #BAE6FD',
              boxShadow: '0 1px 6px rgba(14,165,233,0.10)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Box component="span" sx={{ fontSize: 16 }}>🔍</Box>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.2 }}>
                  Policy Filter Active
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1E40AF', lineHeight: 1.4, mt: 0.25 }}>
                  {displayedPolicyCards[0]?.name ?? `Policy #${filterPolicyId}`}
                </Typography>
              </Box>
            </Box>
            <Box
              onClick={() => onClearPolicyFilter?.()}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                px: 1.5, py: 0.6, borderRadius: '8px',
                bgcolor: '#fff', border: '1px solid #BAE6FD',
                cursor: 'pointer', transition: 'all 0.15s',
                '&:hover': { bgcolor: '#EFF6FF', borderColor: '#7DD3FC' },
              }}
            >
              <Box component="span" sx={{ fontSize: 14, color: '#0369A1', lineHeight: 1 }}>✕</Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#0369A1' }}>Show all</Typography>
            </Box>
          </Box>
        )}
        {allPolicyCardsRaw.length > 0 && !policyCardsError && (
          <>
            {/* ── Policy Operations Overview — hidden ── */}
            {false && <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 0, background: 'linear-gradient(145deg, #6366F1 0%, #2563EB 55%, #0891B2 100%)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.18)', p: 4.5, boxShadow: '0 12px 48px rgba(79,70,229,0.28)', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.18) 0%, transparent 60%)', pointerEvents: 'none' } }}>

              {/* Section header */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: '-0.02em', fontWeight: 700, color: '#ffffff' }}>Policy Operations Overview</Typography>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.72)', mt: 0.75 }}>All active policies · Live operational status</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.6, borderRadius: '20px', bgcolor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4ADE80', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: '#ffffff' }}>Live</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)' }}>Last synced: just now</Typography>
                </Box>
              </Box>

              {/* Section 1: Primary Status Band — 3 cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0,1fr))' }, gap: 3, alignItems: 'stretch' }}>

                {/* Card 1: Enrollment Status */}
                <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E8EDF5', boxShadow: '0 2px 12px rgba(28,87,184,0.07)', p: 3.5, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Users size={18} color="#4F46E5" />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: '#374151' }}>Enrolment Status</Typography>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#9CA3AF' }}>Across all active policies</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 48, fontWeight: 800, color: '#4F46E5', lineHeight: 1, letterSpacing: '-0.03em' }}>{summaryStats.enrolledPct}%</Typography>
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#6B7280', mt: 0.75 }}>
                      <Box component="span" sx={{ fontWeight: 700, color: '#111827' }}>{formatNumberByLocalization(summaryStats.employees - summaryStats.notStarted, localizationData?.data)}</Box>
                      {' enroled of '}
                      <Box component="span" sx={{ fontWeight: 700, color: '#111827' }}>{formatNumberByLocalization(summaryStats.employees, localizationData?.data)}</Box>
                      {' employees'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2.5 }}>
                    <Box sx={{ height: 12, borderRadius: 6, display: 'flex', overflow: 'hidden', bgcolor: '#F3F4F6', mb: 1 }}>
                      <Box sx={{ width: `${summaryStats.enrolledPct}%`, bgcolor: '#4F46E5', transition: 'width 0.8s ease' }} />
                      {summaryStats.inProgress > 0 && <Box sx={{ width: `${Math.round((summaryStats.inProgress / Math.max(summaryStats.employees, 1)) * 100)}%`, bgcolor: '#FCD34D' }} />}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {[
                        { color: '#4F46E5', label: 'Enroled', value: Math.max(0, summaryStats.employees - summaryStats.notStarted - summaryStats.inProgress) },
                        { color: '#FCD34D', label: 'In Progress', value: summaryStats.inProgress },
                        { color: '#9CA3AF', label: 'Not Started', value: summaryStats.notLoggedIn },
                      ].map((seg) => (
                        <Box key={seg.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: 2, bgcolor: seg.color, flexShrink: 0, border: seg.border ?? 'none' }} />
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: seg.textColor ?? '#6B7280' }}>
                            {seg.label} <Box component="span" sx={{ fontWeight: 700, color: '#374151' }}>{formatNumberByLocalization(seg.value, localizationData?.data)}</Box>
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box sx={{ mt: 'auto', pt: 2.5, borderTop: '1px solid #F3F4F6' }}>
                    {summaryStats.notStarted > 0 ? (
                      <>
                        <Box
                          onClick={(e) => { e.stopPropagation(); setSendReminderOpen(true); }}
                          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, px: 2.5, py: 1.5, borderRadius: '10px', bgcolor: '#4F46E5', cursor: 'pointer', '&:hover': { bgcolor: '#4338CA' }, transition: 'background 0.15s' }}
                        >
                          <Mail size={15} color="#fff" />
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: '#fff' }}>Send Reminder to {formatNumberByLocalization(summaryStats.notStarted, localizationData?.data)} Pending Members</Typography>
                        </Box>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#9CA3AF', mt: 0.75, textAlign: 'center' }}>Reach unenroled members via email instantly</Typography>
                      </>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 2.25, borderRadius: '10px', bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                        <CheckCircle2 size={15} color="#059669" />
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: '#059669' }}>All employees enroled — no action needed</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Card 2: Coverage Snapshot */}
                <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E8EDF5', boxShadow: '0 2px 12px rgba(28,87,184,0.07)', p: 3.5, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Shield size={18} color="#059669" />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: '#374151' }}>Coverage Snapshot</Typography>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#9CA3AF' }}>Active insured lives</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mb: 2.5 }}>
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#9CA3AF', fontWeight: 500, mb: 0.75 }}>Total lives covered</Typography>
                    <Typography sx={{ fontSize: 48, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: '-0.02em' }}>{formatNumberByLocalization(summaryStats.totalLives, localizationData?.data)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1 }}>
                    {[
                      { Icon: Users, color: '#1C57B8', bg: '#EBF3FF', label: 'Employees', value: summaryStats.employees, pct: Math.round((summaryStats.employees / Math.max(summaryStats.totalLives, 1)) * 100) },
                      { Icon: HeartHandshake, color: '#7C3AED', bg: '#F5F3FF', label: 'Dependants', value: summaryStats.dependants, pct: Math.round((summaryStats.dependants / Math.max(summaryStats.totalLives, 1)) * 100) },
                    ].map((item) => (
                      <Box key={item.label}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <item.Icon size={15} color={item.color} />
                            </Box>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#6B7280' }}>{item.label}</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{formatNumberByLocalization(item.value, localizationData?.data)}</Typography>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#9CA3AF' }}>{item.pct}% of total</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ height: 6, borderRadius: 3, bgcolor: '#F3F4F6', overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', width: `${item.pct}%`, bgcolor: item.color, borderRadius: 3, transition: 'width 0.8s ease' }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Card 3: Operational Attention */}
                <Box sx={{ bgcolor: '#fff', borderRadius: '16px', border: '1px solid #E8EDF5', boxShadow: '0 2px 12px rgba(28,87,184,0.07)', p: 3.5, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AlertTriangle size={18} color="#D97706" />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: '#374151' }}>Operational Attention</Typography>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#9CA3AF' }}>Items requiring your review</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                    {[
                      (() => { const w = summaryStats.cdWarn > 0; return { label: 'CD Balance', badgeText: w ? `${summaryStats.cdWarn} at risk` : 'Healthy', desc: w ? `${summaryStats.cdWarn} ${summaryStats.cdWarn === 1 ? 'policy' : 'policies'} below safe threshold` : 'All balances within safe limits', borderColor: w ? '#EF4444' : '#10B981', badgeColor: w ? '#EF4444' : '#059669', badgeBg: w ? '#FEF2F2' : '#D1FAE5', cardBorder: w ? '#FECACA' : '#D1FAE5' }; })(),
                      (() => { const w = summaryStats.notStarted > 0; return { label: 'Enrolment', badgeText: w ? `${summaryStats.notStarted} pending` : 'Complete', desc: w ? 'Employees not yet enroled in any policy' : 'All employees enroled', borderColor: w ? '#D97706' : '#10B981', badgeColor: w ? '#D97706' : '#059669', badgeBg: w ? '#FFFBEB' : '#D1FAE5', cardBorder: w ? '#FDE68A' : '#D1FAE5' }; })(),
                      (() => { const w = summaryStats.highIcr > 0; return { label: 'Claims / ICR', badgeText: w ? `${summaryStats.highIcr} high ICR` : 'Healthy', desc: w ? (summaryStats.avgIcr > 0 ? `Avg ICR ${summaryStats.avgIcr}% — renewal may be affected` : 'High ICR may affect renewal premium') : 'Claim ratios within normal range', borderColor: w ? '#EF4444' : '#10B981', badgeColor: w ? '#EF4444' : '#059669', badgeBg: w ? '#FEF2F2' : '#D1FAE5', cardBorder: w ? '#FECACA' : '#D1FAE5' }; })(),
                    ].map((item) => (
                      <Box key={item.label} sx={{ p: 2, borderRadius: '12px', bgcolor: '#fff', border: `1px solid ${item.cardBorder}`, borderLeft: `3px solid ${item.borderColor}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: '#374151' }}>{item.label}</Typography>
                          <Box sx={{ px: 1, py: 0.25, borderRadius: '5px', bgcolor: item.badgeBg, flexShrink: 0, ml: 1 }}>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: item.badgeColor }}>{item.badgeText}</Typography>
                          </Box>
                        </Box>
                        <Typography sx={{ fontSize: 15, color: '#9CA3AF', lineHeight: 1.5 }}>{item.desc}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

              </Box>

            </Box>}

          </>
        )}

        {policyCardsFetching && allPolicyCardsRaw.length === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "16px",
                  height: 360,
                  background: "linear-gradient(90deg, #E7EAEE 25%, #F0F3F6 50%, #E7EAEE 75%)",
                  backgroundSize: "800px 100%",
                  "@keyframes shimmer": {
                    "0%": { backgroundPosition: "-400px 0" },
                    "100%": { backgroundPosition: "400px 0" },
                  },
                  animation: "shimmer 1.4s infinite linear",
                }}
              />
            ))}
          </Box>
        )}

        {policyCardsError && allPolicyCardsRaw.length === 0 && (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Typography sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", color: "#EF4444", fontWeight: 600, mb: 1 }}>
              Failed to load policies
            </Typography>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563", mb: 3 }}>
              There was a problem fetching your policy data. Please try again.
            </Typography>
            <Box
              onClick={refetchPolicyCards}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                px: 3,
                py: 2.25,
                borderRadius: "8px",
                bgcolor: "#1C57B8",
                color: "#fff",
                fontSize: 15, lineHeight: 1.7,
                fontWeight: 600,
                cursor: "pointer",
                "&:hover": { bgcolor: "#1A4B9B" },
              }}
            >
              <RefreshCw size={14} />
              Retry
            </Box>
          </Box>
        )}

        {allPolicyCardsRaw.length > 0 &&
          !policyCardsError &&
          displayedPolicyCards
            .map((policy) => {
              const predictedClaims = Math.round(
                policy.claimCount * (policy.claimDeltaGood ? 0.95 : 1.06)
              );
              const predictedIncurredNum = Math.round(
                policy.incurredNum * (policy.claimDeltaGood ? 0.95 : 1.06) * 10
              ) / 10;
              const predictedICR = policy.forecastICR != null
                ? Math.max(policy.forecastICR, 30)
                : Math.max(
                    Math.round(policy.claimValue * (policy.claimDeltaGood ? 0.95 : 1.06)),
                    20
                  );
              const predictedIncurredStr = `${getCurrencySymbolPrefix(localizationData?.data)}${predictedIncurredNum.toFixed(1)}L`;
              const allClaims = [
                policy.lyAvgClaimCount,
                policy.lyClaimCount,
                policy.claimCount,
                predictedClaims,
              ];
              const allIncurred = [
                policy.lyAvgIncurredNum,
                policy.lyIncurredNum,
                policy.incurredNum,
                predictedIncurredNum,
              ];
              const maxC = Math.max(...allClaims, 1);
              const maxI = Math.max(...allIncurred, 1);
              const minC = Math.min(...allClaims);
              const minI = Math.min(...allIncurred);
              const rangeC = Math.max(maxC - minC, 1);
              const rangeI = Math.max(maxI - minI, 0.01);
              const periods = [
                {
                  label: "FY Avg",
                  period: "Apr 24–Mar 25",
                  claims: policy.lyAvgClaimCount,
                  incurredNum: policy.lyAvgIncurredNum,
                  incurredStr: policy.lyAvgIncurred,
                  icr: policy.claimLYAvgNum,
                  claimsBar: "linear-gradient(180deg, #34D399 0%, #059669 100%)",
                  incurredBar: "linear-gradient(180deg, #6EE7B7 0%, #34D399 100%)",
                  accent: "#059669",
                  predicted: false,
                },
                {
                  label: "Same Period LY",
                  period: "Apr–May 24",
                  claims: policy.lyClaimCount,
                  incurredNum: policy.lyIncurredNum,
                  incurredStr: policy.lyIncurred,
                  icr: policy.claimLYNum,
                  claimsBar: "linear-gradient(180deg, #FBBF24 0%, #D97706 100%)",
                  incurredBar: "linear-gradient(180deg, #FCD34D 0%, #FBBF24 100%)",
                  accent: "#D97706",
                  predicted: false,
                },
                {
                  label: "Current",
                  period: "Apr–May 25",
                  claims: policy.claimCount,
                  incurredNum: policy.incurredNum,
                  incurredStr: policy.incurred,
                  icr: policy.claimValue,
                  claimsBar: "linear-gradient(180deg, #60A5FA 0%, #2563EB 100%)",
                  incurredBar: "linear-gradient(180deg, #93C5FD 0%, #60A5FA 100%)",
                  accent: "#2563EB",
                  delta: policy.claimDelta,
                  deltaGood: policy.claimDeltaGood,
                  predicted: false,
                },
                {
                  label: "Predicted",
                  period: "Renewal Est.",
                  claims: predictedClaims,
                  incurredNum: predictedIncurredNum,
                  incurredStr: predictedIncurredStr,
                  icr: predictedICR,
                  claimsBar: "linear-gradient(180deg, #C4B5FD 0%, #7C3AED 100%)",
                  incurredBar: "linear-gradient(180deg, #DDD6FE 0%, #A78BFA 100%)",
                  accent: "#7C3AED",
                  predicted: true,
                },
              ];

              return (
                <Box
                  key={policy.id}
                  onClick={() =>
                    navigate(`/hr-portal/policy-summary/${policy.id}?companyId=${companyId}`, {
                      state: { policyRow: policy._raw, policyList: allPolicyCardsRaw, companyId, companyName },
                    })
                  }
                  sx={{
                    background: "linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)",
                    border: "1px solid #fff",
                    borderRadius: "10px",
                    boxShadow: "0 6px 100px 0 rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "clip",
                    cursor: "pointer",
                    transition: "box-shadow 0.18s, border-color 0.18s",
                    "--chevron-color": "#C4CDD6",
                    "&:hover": {
                      boxShadow: "0 12px 48px rgba(15,23,42,0.14)",
                      borderColor: "#E8ECF0",
                      "--chevron-color": "#2556A6",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 3,
                      py: 2.25,
                      background: "linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)",
                      gap: 2,
                      borderBottom: "1px solid #DDE3EA",
                    }}
                  >
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0, flex: 1 }}>
                      {/* Name row */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 40, height: 40, borderRadius: "11px",
                            bgcolor: policy.iconAccent ?? "#1C57B8",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, boxShadow: "0 2px 8px rgba(28,87,184,0.18)",
                          }}
                        >
                          {policy.icon}
                        </Box>
                        <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#0F1C2E", whiteSpace: "nowrap" }}>
                          {policy.name}
                        </Typography>
                      </Box>
                      {/* Metadata chips row */}
                      <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.75, flexWrap: "wrap", pl: 0.5 }}>
                        {[
                          { label: "Policy ID", value: policy.policyNumber ?? policy.policyNo },
                          { label: "Period", value: policy.policyPeriod ?? policy.policyYear },
                          { label: "Insurer", value: policy.insurer },
                          { label: "TPA", value: policy.tpaName ?? policy.tpaId },
                          { label: "Lives", value: policy.lives },
                        ].map((item) => (
                          <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.6, px: 1.5, py: 0.4, borderRadius: "6px", bgcolor: "#F3F4F6", border: "1px solid #E5E7EB", whiteSpace: "nowrap" }}>
                            <Typography component="span" sx={{ fontSize: 18, lineHeight: 1.5, color: "#6B7280" }}>{item.label}:</Typography>
                            <Typography component="span" sx={{ fontSize: 18, lineHeight: 1.5, fontWeight: 700, color: "#111827" }}>{item.value}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "stretch", gap: 2, flexShrink: 0 }}>
                      <Box
                        sx={{
                          textAlign: "right",
                          px: 2,
                          py: 1,
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "1px solid #7B6DB5",
                        }}
                      >
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#E8EFF6", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.75 }}>
                          Annual Premium
                        </Typography>
                        <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>
                          {policy.annualPremium}
                        </Typography>
                      </Box>
                      <Box
                        onClick={(e) => { e.stopPropagation(); navigate(`/hr-portal/policy-summary/${policy.id}?companyId=${companyId}`, { state: { policyRow: policy._raw, policyList: allPolicyCardsRaw, companyId, companyName, tab: 'cd' } }); }}
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, px: 2, borderRadius: '10px', border: '1px solid #C4B5FD', bgcolor: '#ffffff', cursor: 'pointer', flexShrink: 0, '&:hover': { bgcolor: '#F5F3FF', borderColor: '#A78BFA' }, transition: 'all 0.15s' }}
                      >
                        <Typography sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", color: '#4C1D95', fontWeight: 600, whiteSpace: 'nowrap' }}>View CD Details</Typography>
                        <ChevronRight size={16} color="#6D28D9" />
                      </Box>
                    </Box>
                  </Box>

                  {/* ── Expiry alert + renewal status strip ── */}
                  {(() => {
                    const days = policy.daysToExpiry;
                    const isExpired  = days !== null && days <= 0;
                    const isExpiring = days !== null && days > 0 && days <= 60;
                    const alertBg    = (isExpired || isExpiring) ? '#FEF2F2' : '#F0F9FF';
                    const borderClr  = (isExpired || isExpiring) ? '#FECACA' : '#BAE6FD';
                    const tagBg      = (isExpired || isExpiring) ? '#FEE2E2' : '#E0F2FE';
                    const tagColor   = (isExpired || isExpiring) ? '#B91C1C' : '#0369A1';
                    const tagIcon    = isExpired ? '⛔' : isExpiring ? '🔴' : '🕐';
                    const tagLabel   = isExpired  ? 'Policy Expired'
                                     : isExpiring ? `Expires in ${days} day${days === 1 ? '' : 's'}`
                                     : null;
                    if (!tagLabel) return null;
                    const urgentMsg = isExpired
                      ? 'This policy has expired. Immediate renewal action is required.'
                      : days! <= 30
                      ? `Critical: Only ${days} day${days === 1 ? '' : 's'} left — initiate renewal immediately to avoid coverage lapse.`
                      : `Renewal due soon — policy expires in ${days} days. Please take action before coverage ends.`;
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5, borderTop: `3px solid ${isExpired ? '#DC2626' : '#F87171'}`, borderBottom: `1px solid ${borderClr}`, bgcolor: alertBg, gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: isExpired ? '#DC2626' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(220,38,38,0.35)' }}>
                            <Typography sx={{ fontSize: 20, lineHeight: 1.4 }}>⚠️</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#991B1B', lineHeight: 1.7 }}>
                              {isExpired ? 'Policy Expired' : `Policy Expiring in ${days} Day${days === 1 ? '' : 's'}`}
                            </Typography>
                            <Typography sx={{ fontSize: 15, color: '#B91C1C', lineHeight: 1.7, mt: 0.2 }}>
                              {urgentMsg}
                            </Typography>
                          </Box>
                        </Box>
                        {policy.renewalStatus && policy.renewalStatus !== '—' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                          <Typography sx={{ fontSize: 15, color: '#9CA3AF', fontWeight: 500 }}>Renewal Status</Typography>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.75, py: 0.6, borderRadius: '20px', bgcolor: '#FEE2E2', border: '1px solid #FECACA' }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#DC2626', flexShrink: 0 }} />
                            <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#991B1B', lineHeight: 1.7 }}>{policy.renewalStatus}</Typography>
                          </Box>
                        </Box>
                        )}
                      </Box>
                    );
                  })()}

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "0.8fr 1fr 1.2fr" },
                      gap: 2,
                      px: 2.5,
                      pb: 2.5,
                      pt: 2,
                      background: "transparent",
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #E5EAF3",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                        cursor: "pointer",
                        display: "grid",
                        gridTemplateRows: "auto 1fr auto",
                        overflow: "hidden",
                        transition: "box-shadow 0.18s, border-color 0.18s",
                        "&:hover": { boxShadow: "0 6px 20px rgba(28,87,184,0.1)", borderColor: "#C4D4EE" },
                      }}
                    >
                      <Box sx={{ px: 3, pt: 2, pb: 1.25, minHeight: 52, display: "flex", flexDirection: "column", justifyContent: "center", bgcolor: "transparent", flexShrink: 0 }}>
                        <Box sx={{ display: "inline-flex", alignItems: "center", px: 1.5, py: 0.5, borderRadius: 999, bgcolor: "#BFDBFE", border: "1px solid #93C5FD", alignSelf: "flex-start", mb: 0.75 }}>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#1E3A8A", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            CD Balance
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                          {policy.cdColor === "#EF4444" || policy.cdColor === "#F59E0B" ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <AlertTriangle size={11} color={policy.cdColor === "#EF4444" ? "#E05252" : "#D97706"} />
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: policy.cdColor === "#EF4444" ? "#E05252" : "#B45309" }}>
                                {policy.cdColor === "#EF4444" ? "Critical" : "Warning"}
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <CheckCircle2 size={11} color="#059669" />
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#059669" }}>Healthy</Typography>
                            </Box>
                          )}
                          <Typography sx={{ fontSize: 15, color: '#6B7280', fontFamily: 'monospace', bgcolor: '#F3F4F6', px: 1, py: 0.25, borderRadius: '4px', letterSpacing: '0.04em', flexShrink: 0 }}>
                            A/c: {policy.cdAccountNumber !== '—' ? policy.cdAccountNumber : policy.policyNo}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ px: 3, pt: 2.5, pb: 2.5, display: "flex", flexDirection: "column", minHeight: 0, bgcolor: "transparent", flex: 1 }}>
                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {/* Safe limit label — left of bar, aligned with strip */}
                            <Box sx={{ position: "relative", height: 130, width: 72, flexShrink: 0 }}>
                              <Box sx={{ position: "absolute", bottom: `calc(${policy.safeMarkerPct}% - 18px)`, right: 0, textAlign: "right" }}>
                                <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#F59E0B", lineHeight: 1.2 }}>
                                  {policy.safeLimit}
                                </Typography>
                                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4 }}>
                                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#F59E0B", lineHeight: 1.2 }}>
                                    Safe limit
                                  </Typography>
                                  <Tooltip title="Safe limit is configured per CD account (default 10% of net premium)" arrow placement="top">
                                    <Box component="span" sx={{ display: "inline-flex", cursor: "pointer" }}>
                                      <Info size={10} color="#D97706" />
                                    </Box>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </Box>

                            {/* Bar */}
                            <Box sx={{ position: "relative", width: 28, height: 130, borderRadius: "8px", bgcolor: "#EEF2F7", flexShrink: 0 }}>
                              <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${policy.availPct}%`, borderRadius: "6px", background: policy.cdColor === "#EF4444" ? "linear-gradient(180deg, #FCA5A5 0%, #EF4444 100%)" : policy.cdColor === "#F59E0B" ? "linear-gradient(180deg, #FCD34D 0%, #F59E0B 100%)" : "linear-gradient(180deg, #6EE7B7 0%, #10B981 100%)", transition: "height 0.4s ease" }} />
                              <Box sx={{ position: "absolute", bottom: `${policy.safeMarkerPct}%`, left: -6, right: -6, height: 3, bgcolor: "#FBBF24", borderRadius: 2, zIndex: 0 }} />
                            </Box>

                            {/* Right info */}
                            <Box>
                              <Typography sx={{ fontSize: 32, fontWeight: 800, color: policy.cdColor === "#EF4444" ? "#E05252" : policy.cdColor === "#F59E0B" ? "#D97706" : "#1d2939", lineHeight: 1 }}>
                                {policy.available}
                              </Typography>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563", mt: 0.75 }}>Available Balance</Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                      {/* CD Balance footer */}
                      <Box
                        onClick={(e) => e.stopPropagation()}
                        sx={{ px: 3, py: 2.25, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, bgcolor: policy.cdColor === '#EF4444' ? '#FEF2F2' : policy.cdColor === '#F59E0B' ? '#FFFBEB' : '#F0FDF4', borderTop: `1px solid ${policy.cdColor === '#EF4444' ? '#FECACA' : policy.cdColor === '#F59E0B' ? '#FDE68A' : '#BBF7D0'}` }}
                      >
                        <Typography sx={{ fontSize: 15, lineHeight: 1.5, color: policy.cdColor === '#EF4444' ? '#B91C1C' : policy.cdColor === '#F59E0B' ? '#92400E' : '#065F46', flex: 1 }}>
                          {policy.cdInsightText}
                        </Typography>
                        <Box
                          onClick={(e) => { e.stopPropagation(); navigate(`/hr-portal/policy-summary/${policy.id}?companyId=${companyId}`, { state: { policyRow: policy._raw, policyList: allPolicyCardsRaw, companyId, companyName, tab: 'cd' } }); }}
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.4, borderRadius: '6px', border: `1px solid ${policy.cdColor === '#EF4444' ? '#FECACA' : policy.cdColor === '#F59E0B' ? '#FDE68A' : '#BBF7D0'}`, bgcolor: '#fff', cursor: 'pointer', flexShrink: 0, '&:hover': { opacity: 0.85 } }}
                        >
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: policy.cdColor === '#EF4444' ? '#DC2626' : policy.cdColor === '#F59E0B' ? '#D97706' : '#065F46', whiteSpace: 'nowrap' }}>View CD Details</Typography>
                          <ArrowRight size={10} color={policy.cdColor === '#EF4444' ? '#DC2626' : policy.cdColor === '#F59E0B' ? '#D97706' : '#065F46'} />
                        </Box>
                      </Box>
                    </Box>

                    <Box
                      onClick={(e) => { e.stopPropagation(); navigate(`/hr-portal/policy-summary/${policy.id}?companyId=${companyId}`, { state: { policyRow: policy._raw, policyList: allPolicyCardsRaw, companyId, companyName, tab: 'enrollment' } }); }}
                      sx={{
                        bgcolor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #E5EAF3",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                        cursor: "pointer",
                        display: "grid",
                        gridTemplateRows: "auto 1fr auto",
                        overflow: "hidden",
                        transition: "box-shadow 0.18s, border-color 0.18s",
                        zIndex:0,
                        "&:hover": { boxShadow: "0 6px 20px rgba(28,87,184,0.1)", borderColor: "#C4D4EE" },
                      }}
                    >
                      {(() => {
                        const isNonLife = !(policy.iiRmTypeKey?.toLowerCase() ?? '').includes('life') && !(policy.iiRmTypeKey?.toLowerCase() ?? '').includes('health');
                        return (
                          <Box sx={{ px: 3, pt: 2, pb: 1.25, minHeight: 52, display: "flex", flexDirection: "column", justifyContent: "center", bgcolor: "transparent", flexShrink: 0 }}>
                            <Box sx={{ display: "inline-flex", alignItems: "center", px: 1.5, py: 0.5, borderRadius: 999, bgcolor: "#A7F3D0", border: "1px solid #6EE7B7", alignSelf: "flex-start", mb: 0.75 }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#064E3B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                {isNonLife ? 'Coverage' : 'Enrolment'}
                              </Typography>
                            </Box>
                            {isNonLife ? (
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.15 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <CheckCircle2 size={11} color="#059669" />
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#059669" }}>
                                    {formatNumberByLocalization(policy.totalAssets || 0, localizationData?.data)} Assets
                                  </Typography>
                                </Box>
                                {(policy.totalSubAssets || 0) > 0 && (
                                  <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: "#6B7280", pl: 2 }}>
                                    {formatNumberByLocalization(policy.totalSubAssets || 0, localizationData?.data)} Sub-Assets
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Clock size={11} color={policy.enrollColor ?? "#D97706"} />
                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: policy.enrollColor ?? "#D97706" }}>In Progress</Typography>
                              </Box>
                            )}
                          </Box>
                        );
                      })()}
                      {(() => {
                        const isNonLifeMid = !(policy.iiRmTypeKey?.toLowerCase() ?? '').includes('life') && !(policy.iiRmTypeKey?.toLowerCase() ?? '').includes('health');
                        if (isNonLifeMid) {
                          return (
                            <Box sx={{ px: 3, pt: 3.5, pb: 3, display: "flex", flexDirection: "column", minHeight: 0, bgcolor: "transparent", flex: 1 }}>
                              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2.5 }}>
                                {[
                                  { label: "Sum Insured", value: policy.totalSumInsured ?? 0 },
                                  { label: "Asset Premium", value: policy.assetTotalPremium ?? 0 },
                                ].map((item) => (
                                  <Box key={item.label} sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                                    <Typography sx={{ fontSize: 13, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{item.label}</Typography>
                                    <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#1D2939", letterSpacing: "-0.3px" }}>
                                      {formatAmountWithCurrency(item.value, localizationData?.data)}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5, mt: 3.5 }}>
                                {[
                                  { key: "assets", label: "Assets", count: policy.totalAssets ?? 0, dotColor: "#6EE7B7" },
                                  { key: "subAssets", label: "Sub-Assets", count: policy.totalSubAssets ?? 0, dotColor: "#93C5FD" },
                                ].map((cat) => (
                                  <Box key={cat.key} sx={{ borderRadius: "10px", border: "1px solid #EAECEF", px: 2, py: 2.25, display: "flex", flexDirection: "column", justifyContent: "center", gap: 0.5 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: cat.dotColor, flexShrink: 0 }} />
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{cat.label}</Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#1d2939", lineHeight: 1.35, letterSpacing: "-0.3px" }}>{cat.count}</Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          );
                        }
                        return (
                          <Box sx={{ px: 3, pt: 3.5, pb: 3, display: "flex", flexDirection: "column", minHeight: 0, bgcolor: "transparent", flex: 1 }}>
                            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 3.5 }}>
                                <Box sx={{ position: "relative", flexShrink: 0, width: 180, height: 180 }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={[
                                          { name: "Employees", value: Number(policy.totalEmployees) || 0 },
                                          { name: "Dependents", value: Number(policy.totalDependents) || 0 },
                                        ]}
                                        dataKey="value"
                                        innerRadius={50}
                                        outerRadius={76}
                                        stroke="none"
                                        startAngle={90}
                                        endAngle={-270}
                                      >
                                        <Cell fill="#3B82F6" />
                                        <Cell fill="#10B981" />
                                      </Pie>
                                    </PieChart>
                                  </ResponsiveContainer>
                                  <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#4B5563" }}>Lives</Typography>
                                  </Box>
                                </Box>

                                <Box sx={{ minWidth: 155 }}>
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>Enroled</Typography>
                                  {[
                                    { label: "Employees", value: policy.totalEmployees, color: "#374151", dot: "#93C5FD" },
                                    { label: "Dependents", value: policy.totalDependents, color: "#374151", dot: "#6EE7B7" },
                                    { label: "Total Lives", value: policy.lives, color: "#6B7280", dot: "#D1D5DB" },
                                  ].map((item) => (
                                    <Box key={item.label} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.75 }}>
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.875 }}>
                                        <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: item.dot, flexShrink: 0 }} />
                                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280" }}>{item.label}</Typography>
                                      </Box>
                                      <Typography sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 700, color: item.color, ml: 2.5 }}>{item.value}</Typography>
                                    </Box>
                                  ))}
                                </Box>
                              </Box>
                            </Box>

                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1.5, mt: 3.5 }}>
                              {[
                                // Sum of the three tiles below — shown directly so nobody has to add
                                // Enrolled + In Progress + Not Logged In by hand to get the current
                                // enrollment period's total.
                                { key: "total", label: "Total", count: (Number(policy.enrolled) || 0) + (Number(policy.inProgress) || 0) + (Number((policy as any).notLoggedIn) || 0), dotColor: "#1C57B8" },
                                { key: "enrolled", label: "Enrolled", count: policy.enrolled ?? 0, dotColor: "#4F46E5" },
                                { key: "inProgress", label: "In Progress", count: policy.inProgress, dotColor: "#FCD34D" },
                                { key: "notLoggedIn", label: "Not Started", count: (policy as any).notLoggedIn ?? 0, dotColor: "#9CA3AF" },
                              ].map((cat) => (
                                <Box key={cat.key} sx={{ borderRadius: "10px", border: "1px solid #EAECEF", px: 2, py: 2.25, display: "flex", flexDirection: "column", justifyContent: "center", gap: 0.5 }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: cat.dotColor, flexShrink: 0 }} />
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{cat.label}</Typography>
                                  </Box>
                                  <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#1d2939", lineHeight: 1.35, letterSpacing: "-0.3px" }}>{cat.count}</Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        );
                      })()}
                      {(() => {
                        const isNonLife2 = !(policy.iiRmTypeKey?.toLowerCase() ?? '').includes('life') && !(policy.iiRmTypeKey?.toLowerCase() ?? '').includes('health');
                        if (isNonLife2) {
                          return (
                            <Box sx={{ px: 3, py: 2.25, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, bgcolor: '#FFFBEB', borderTop: '1px solid #FDE68A' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875, flex: 1 }}>
                                <Clock size={13} color="#D97706" style={{ flexShrink: 0 }} />
                                <Typography sx={{ fontSize: 15, lineHeight: 1.5, color: '#D97706' }}>
                                  Policy Period Ends {policy.enrollEndDate}
                                </Typography>
                              </Box>
                              <Box
                                onClick={(e) => { e.stopPropagation(); navigate(`/hr-portal/policy-summary/${policy.id}?companyId=${companyId}`, { state: { policyRow: policy._raw, policyList: allPolicyCardsRaw, companyId, companyName, tab: 'enrollment' } }); }}
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.4, borderRadius: '6px', border: '1px solid #FDE68A', bgcolor: '#fff', cursor: 'pointer', flexShrink: 0, '&:hover': { opacity: 0.85 } }}
                              >
                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: '#D97706', whiteSpace: 'nowrap' }}>View Coverage</Typography>
                                <ArrowRight size={10} color="#D97706" />
                              </Box>
                            </Box>
                          );
                        }
                        return (
                          <Box sx={{ px: 2, py: 2.25, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, bgcolor: '#FFFBEB', borderTop: '1px solid #FDE68A' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                              <Clock size={12} color="#D97706" style={{ flexShrink: 0 }} />
                              <Typography sx={{ fontSize: 15, lineHeight: 1.5, color: '#D97706', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Ends {policy.enrollEndDate}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                              {Number(policy.notEnrolled) > 0 && (
                                <Box
                                  onClick={(e) => { e.stopPropagation(); setSendReminderOpen(true); }}
                                  sx={{ display: 'flex', alignItems: 'center', gap: 0.4, px: 1, py: 0.4, borderRadius: '6px', border: '1px solid #FDE68A', bgcolor: '#fff', cursor: 'pointer', '&:hover': { bgcolor: '#FFFBEB' } }}
                                >
                                  <Mail size={11} color="#D97706" />
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: '#D97706', whiteSpace: 'nowrap' }}>Send Reminder</Typography>
                                </Box>
                              )}
                              <Box
                                onClick={(e) => { e.stopPropagation(); navigate(`/hr-portal/policy-summary/${policy.id}?companyId=${companyId}`, { state: { policyRow: policy._raw, policyList: allPolicyCardsRaw, companyId, companyName, tab: 'enrollment' } }); }}
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.4, px: 1, py: 0.4, borderRadius: '6px', border: '1px solid #BFDBFE', bgcolor: '#fff', cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
                              >
                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: '#1C57B8', whiteSpace: 'nowrap' }}>View Enrolment Details</Typography>
                                <ArrowRight size={10} color="#1C57B8" />
                              </Box>
                            </Box>
                          </Box>
                        );
                      })()}
                    </Box>

                    <Box
                      sx={{
                        bgcolor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #E5EAF3",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                        cursor: "pointer",
                        display: "grid",
                        gridTemplateRows: "auto 1fr auto",
                        overflow: "hidden",
                        transition: "box-shadow 0.18s, border-color 0.18s",
                        "&:hover": { boxShadow: "0 6px 20px rgba(28,87,184,0.1)", borderColor: "#C4D4EE" },
                      }}
                    >
                      {/* Header — matches CD Balance & Enrollment style */}
                      <Box sx={{ px: 3, pt: 2, pb: 1.25, minHeight: 52, display: "flex", flexDirection: "column", justifyContent: "center", bgcolor: "transparent", flexShrink: 0 }}>
                        <Box sx={{ display: "inline-flex", alignItems: "center", px: 1.5, py: 0.5, borderRadius: 999, bgcolor: "#DDD6FE", border: "1px solid #C4B5FD", alignSelf: "flex-start", mb: 0.75 }}>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#4C1D95", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Incurred Claim Ratio
                          </Typography>
                        </Box>
                        {policy.claimColor === "#EF4444" ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <AlertTriangle size={11} color="#E05252" />
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#E05252" }}>High Risk</Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <CheckCircle2 size={11} color="#059669" />
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#059669" }}>Healthy</Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Compact chart body */}
                      {(() => {
                        const _now = new Date();
                        const lytLabel = new Date(_now.getFullYear() - 1, _now.getMonth())
                          .toLocaleString("en-IN", { month: "long", year: "numeric" });
                        const fullNames: Record<string, string> = {
                          "FY Avg": "Last Year — Full",
                          "Same Period LY": "Last Year — Same Period",
                          "Current": "Current Year to Date",
                          "Predicted": "Forecast",
                        };
                        // Premium per period (in lakhs)
                        // Prefer direct net_premium when meaningful, else back-calculate from claims and ICR
                        const netPremLakhs = (Number(policy._raw?.netPremium) || 0) / 100000;
                        const earnedPremLakhs = ((policy._raw?.earnedPremium ?? 0) / 100000) || netPremLakhs;
                        const computePremiumL = (incurredL: number, icr: number, directL: number): number => {
                          if (directL > 0 && (incurredL <= 0 || directL >= incurredL * 0.1)) return directL;
                          if (incurredL > 0) {
                            const effectiveIcr = Math.min(Math.max(icr, 30), 200);
                            return (incurredL * 100) / effectiveIcr;
                          }
                          return directL;
                        };
                        const lyFullPremL = computePremiumL(policy.lyAvgIncurredNum, Number(policy.claimLYAvgNum), netPremLakhs);
                        const lySamePremL = computePremiumL(policy.lyIncurredNum, Number(policy.claimLYNum), earnedPremLakhs);
                        const curPremL    = computePremiumL(policy.incurredNum,    Number(policy.claimValue), earnedPremLakhs);
                        const predPremL   = computePremiumL(predictedIncurredNum,  predictedICR,              netPremLakhs);
                        // Format premium: use rupees (formatINR) when < 1 lakh, otherwise lakhs
                        const formatPremL = (premL: number): string => {
                          if (premL <= 0) return "—";
                          if (premL < 1) return formatINR(Math.round(premL * 100000), localizationData?.data);
                          return `${getCurrencySymbolPrefix(localizationData?.data)}${premL.toFixed(1)}L`;
                        };
                        const miniData = periods.map((p) => {
                          let premiumStr = "—";
                          if (p.label === "FY Avg") premiumStr = lyFullPremL > 0 ? `~${formatPremL(lyFullPremL)}` : "—";
                          else if (p.label === "Same Period LY") premiumStr = lySamePremL > 0 ? `~${formatPremL(lySamePremL)}` : "—";
                          else if (p.label === "Current") premiumStr = formatPremL(curPremL);
                          else if (p.label === "Predicted") premiumStr = predPremL > 0 ? `est. ${formatPremL(predPremL)}` : "—";
                          return {
                            name: fullNames[p.label] ?? p.label,
                            shortName: p.label === "Same Period LY" ? "Last Year Same Period" : p.label === "FY Avg" ? "Last Year Full" : p.label === "Current" ? "Current YTD" : "Forecast",
                            icr: Number(p.icr),
                            fill: p.accent,
                            isPred: p.predicted,
                            incurredStr: p.incurredStr,
                            premiumStr,
                          };
                        });
                        const thresholdIcr = miniData.find((d) => d.shortName === "Current YTD")?.icr ?? 0;
                        const icrRawMax = Math.max(...miniData.map((d) => d.icr), thresholdIcr, 0);
                        const icrYMax = Math.ceil(icrRawMax / 10) * 10 + Math.ceil(icrRawMax * 0.05);
                        const formatAxisPct = (v: number) => {
                          if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M%`;
                          if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K%`;
                          return `${Math.round(v)}%`;
                        };
                        const yAxisW = icrRawMax >= 1_000_000 ? 52 : icrRawMax >= 1_000 ? 44 : 36;
                        const hasClaimData = policy.incurredNum > 0 || policy.claimCount > 0 || policy.lyIncurredNum > 0;
                        if (!hasClaimData) {
                          return (
                            <Box sx={{ px: 2.5, py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, flex: 1 }}>
                              <FileText size={32} color="#D1D5DB" />
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: '#9CA3AF' }}>No claim data available</Typography>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#D1D5DB', textAlign: 'center' }}>Claim activity will appear here once data is recorded for this policy period</Typography>
                            </Box>
                          );
                        }
                        return (
                          <Box sx={{ px: 2.5, pt: 1.5, pb: 1.5, display: "flex", alignItems: "center", gap: 2 }}>
                            {/* Mini bar chart */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <ResponsiveContainer width="100%" height={190}>
                                <BarChart data={miniData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
                                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
                                  <YAxis width={yAxisW} tick={{ fontSize: 15, lineHeight: 1.7, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={formatAxisPct} domain={[0, icrYMax]} tickCount={4} />
                                  <XAxis dataKey="shortName" axisLine={false} tickLine={false} height={40} interval={0} tick={(tickProps: Record<string, unknown>) => {
                                    const { x, y, payload } = tickProps as { x: number; y: number; payload: { value: string } };
                                    const isPred = payload.value === "Forecast";
                                    const fullName = miniData.find((d) => d.shortName === payload.value)?.name ?? payload.value;
                                    const words = payload.value.split(" ");
                                    const mid = Math.ceil(words.length / 2);
                                    const line1 = words.slice(0, mid).join(" ");
                                    const line2 = words.slice(mid).join(" ");
                                    const fill = isPred ? "#7C3AED" : "#9CA3AF";
                                    const fw = isPred ? 700 : 400;
                                    return (
                                      <g>
                                        <title>{fullName}</title>
                                        {line2 ? (
                                          <>
                                            <text x={x} y={y + 10} textAnchor="middle" fill={fill} fontSize={12} fontWeight={fw}>{line1}</text>
                                            <text x={x} y={y + 24} textAnchor="middle" fill={fill} fontSize={12} fontWeight={fw}>{line2}</text>
                                          </>
                                        ) : (
                                          <text x={x} y={y + 14} textAnchor="middle" fill={fill} fontSize={13} fontWeight={fw}>{line1}</text>
                                        )}
                                      </g>
                                    );
                                  }} />
                                  <RechartTooltip
                                    cursor={{ fill: "rgba(107,142,245,0.06)" }}
                                    content={({ active, payload }) => {
                                      if (!active || !payload?.length) return null;
                                      const d = payload[0]?.payload as { name: string; icr: number; fill: string; incurredStr: string; premiumStr: string; isPred: boolean };
                                      return (
                                        <Box sx={{ bgcolor: "#1F2937", px: 1.5, py: 1, borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.18)", minWidth: 160 }}>
                                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#fff", mb: 0.75 }}>{d.name}</Typography>
                                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 800, color: d.fill }}>ICR: {formatAxisPct(d.icr)}</Typography>
                                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>Claims Amount: {d.incurredStr}</Typography>
                                          {d.premiumStr !== "—" && <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>Incurred Premium: {d.premiumStr}</Typography>}
                                        </Box>
                                      );
                                    }}
                                  />
                                  {thresholdIcr > 0 && (
                                    <ReferenceLine
                                      y={thresholdIcr}
                                      stroke={miniData.find((d) => d.shortName === "Current YTD")?.fill ?? "#FB923C"}
                                      strokeDasharray="5 3"
                                      strokeWidth={1.5}
                                    />
                                  )}
                                  <Bar
                                    dataKey="icr"
                                    maxBarSize={36}
                                    shape={(props: Record<string, unknown>) => {
                                      const bx = props.x as number;
                                      const by = props.y as number;
                                      const bw = props.width as number;
                                      const bh = props.height as number;
                                      const idx = props.index as number;
                                      const item = miniData[idx];
                                      if (item?.isPred) {
                                        return (
                                          <g>
                                            <rect x={bx} y={by} width={bw} height={bh} rx={3} fill={item.fill} fillOpacity={0.72} />
                                            <rect x={bx} y={by} width={bw} height={bh} rx={3} fill="none" stroke="#7C3AED" strokeWidth={1.5} strokeDasharray="4 2" />
                                          </g>
                                        );
                                      }
                                      return <rect x={bx} y={by} width={bw} height={bh} rx={3} fill={item?.fill ?? "#6B8EF5"} />;
                                    }}
                                  >
                                    {miniData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </Box>
                          </Box>
                        );
                      })()}
                      <Box sx={{ borderTop: `1px solid ${policy.claimDeltaGood ? "#BBF7D0" : "#FECACA"}`, px: 3, py: 2.25, minHeight: 44, display: "flex", alignItems: "center", gap: 1.25, bgcolor: policy.claimDeltaGood ? "#F0FDF4" : "#FFF5F5" }}>
                        <Info size={13} color={policy.claimDeltaGood ? "#059669" : "#DC2626"} style={{ flexShrink: 0 }} />
                        <Typography sx={{ fontSize: 15, color: policy.claimDeltaGood ? "#065F46" : "#7F1D1D", flex: 1, lineHeight: 1.4 }}>
                          {policy.premiumOutlookText}
                        </Typography>
                        {policy.premiumSavingValue && (
                          <Box sx={{ px: 1.5, py: 0.5, borderRadius: 999, bgcolor: policy.claimDeltaGood ? "#DCFCE7" : "#FEE2E2", border: `1px solid ${policy.claimDeltaGood ? "#86EFAC" : "#FCA5A5"}`, flexShrink: 0 }}>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: policy.claimDeltaGood ? "#15803D" : "#DC2626" }}>
                              {policy.claimDeltaGood ? "Save " : ""}
                              {policy.premiumSavingValue}
                            </Typography>
                          </Box>
                        )}
                        <Box
                          onClick={(e) => { e.stopPropagation(); navigate(`/hr-portal/policy-summary/${policy.id}?companyId=${companyId}`, { state: { policyRow: policy._raw, policyList: allPolicyCardsRaw, companyId, companyName, tab: 'claims' } }); }}
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.4, borderRadius: '6px', border: `1px solid ${policy.claimDeltaGood ? '#86EFAC' : '#FCA5A5'}`, bgcolor: '#fff', cursor: 'pointer', flexShrink: 0, ml: 'auto', '&:hover': { opacity: 0.85 } }}
                        >
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: policy.claimDeltaGood ? '#15803D' : '#DC2626', whiteSpace: 'nowrap' }}>View Claim Analytics</Typography>
                          <ArrowRight size={10} color={policy.claimDeltaGood ? '#15803D' : '#DC2626'} />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}

        {!policyCardsFetching && !policyCardsError && allPolicyCardsRaw.length === 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 10,
              gap: 1.5,
              borderRadius: "16px",
              border: "1.5px dashed #E5E7EB",
              bgcolor: "#FAFAFA",
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                bgcolor: "#EBF3FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={22} color="#1C57B8" />
            </Box>
            <Typography sx={{ fontSize: 20, lineHeight: 1.4, fontWeight: 700, color: "#1D2939", letterSpacing: "-0.2px" }}>
              {policyFilter === "inactive"
                ? "No inactive policies found"
                : policyFilter === "lifehealth"
                ? "No Life & Health policies found"
                : policyFilter === "nonlife"
                ? "No Non-Life policies found"
                : "No policies found"}
            </Typography>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", textAlign: "center", maxWidth: 360 }}>
              {policyFilter === "inactive"
                ? "All policies for this company are currently active."
                : policyFilter === "lifehealth"
                ? "This company has no Life or Health policies under the applied filters."
                : policyFilter === "nonlife"
                ? "This company has no Non-Life policies under the applied filters."
                : "No policies are available for this company."}
            </Typography>
          </Box>
        )}

        {/* Sentinel — IntersectionObserver triggers next page when this enters view */}
        <div ref={paginationSentinelRef} style={{ height: 1 }} />

        {/* ── Load-more spinner (scroll pagination) ── */}
        {policyCardsFetching && allPolicyCardsRaw.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4, gap: 1.5 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "2.5px solid #E5EAF3",
                borderTopColor: "#1C57B8",
                animation: "spin 0.75s linear infinite",
                "@keyframes spin": { to: { transform: "rotate(360deg)" } },
              }}
            />
            <Typography sx={{ fontSize: 15, color: "#6B7280" }}>Loading more policies…</Typography>
          </Box>
        )}
      </Box>

      {/* ─── Send Reminders Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={sendReminderOpen}
        onClose={() => setSendReminderOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "16px", p: 0, overflow: "hidden", maxWidth: 480 },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {!reminderSent ? (
            <Box>
              {/* Header — brand blue gradient */}
              <Box
                sx={{
                  px: 4,
                  pt: 4,
                  pb: 3,
                  background:
                    "linear-gradient(90deg, #2556A6 0%, #1F88C6 100%)",
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "14px",
                      bgcolor: "rgba(255,255,255,0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={22} color="#fff" />
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px",
                        fontWeight: 700,
                        color: "#fff",
                        lineHeight: 1.2,
                      }}
                    >
                      Send Enrolment Reminders
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 15, lineHeight: 1.7,
                        color: "rgba(255,255,255,0.80)",
                        mt: 0.75,
                      }}
                    >
                      Notify employees who haven't enroled yet
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {/* Body */}
              <Box sx={{ px: 4, py: 3 }}>
                {/* Pending count badge */}
                <Box
                  sx={{
                    p: 3,
                    borderRadius: "12px",
                    bgcolor: "#EBF6FF",
                    border: "1px solid #BDD7F5",
                    mb: 3,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px",
                      fontWeight: 700,
                      color: "#1C57B8",
                      lineHeight: 1,
                    }}
                  >
                    {enrollmentCardData.notEnrolledCount}
                    <Box
                      component="span"
                      sx={{
                        fontSize: 15, lineHeight: 1.7,
                        fontWeight: 500,
                        color: METRIC_LABEL_COLOR,
                        ml: 1,
                      }}
                    >
                      employees pending
                    </Box>
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 15, lineHeight: 1.7,
                      color: "#374151",
                      lineHeight: 1.65,
                      mt: 1,
                    }}
                  >
                    {enrollmentCardData.impact}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: 15, lineHeight: 1.7,
                    fontWeight: 600,
                    color: "#111827",
                    mb: 1.75,
                  }}
                >
                  Reminder will be sent via:
                </Typography>
                {[
                  { label: "Email", desc: "To registered employee email IDs" },
                  // { label: "SMS", desc: "To registered mobile numbers" },
                ].map((ch) => (
                  <Box
                    key={ch.label}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 1.5,
                      p: 1.75,
                      borderRadius: "10px",
                      bgcolor: "#F8FAFC",
                      border: "1px solid #E4EAF3",
                    }}
                  >
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "10px",
                        bgcolor: "#EEF2FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Mail size={15} color="#1C57B8" />
                    </Box>
                    <Box>
                      <Typography
                        sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827" }}
                      >
                        {ch.label}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 15, lineHeight: 1.7, color: METRIC_LABEL_COLOR }}
                      >
                        {ch.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
              {/* Footer */}
              <Box sx={{ px: 4, pb: 4, display: "flex", gap: 1.5 }}>
                <Box
                  onClick={() => setSendReminderOpen(false)}
                  sx={{
                    flex: 1,
                    height: 46,
                    borderRadius: "10px",
                    border: "1px solid #D0D5DD",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15, lineHeight: 1.7,
                    fontWeight: 500,
                    color: "#374151",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#F9FAFB" },
                  }}
                >
                  Cancel
                </Box>
                <Box
                  onClick={() => setReminderSent(true)}
                  sx={{
                    flex: 1,
                    height: 46,
                    borderRadius: "10px",
                    background:
                      "linear-gradient(90deg, #2556A6 0%, #1F88C6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15, lineHeight: 1.7,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Send Now
                </Box>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                px: 4,
                py: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #2556A6 0%, #1F88C6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2.5,
                }}
              >
                <ShieldCheck size={30} color="#fff" />
              </Box>
              <Typography
                sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#111827", mb: 1 }}
              >
                Reminders Sent!
              </Typography>
              <Typography
                sx={{
                  fontSize: 15, lineHeight: 1.7,
                  color: METRIC_LABEL_COLOR,
                  lineHeight: 1.7,
                  mb: 4,
                }}
              >
                Enrolment reminders have been sent to{" "}
                <Box
                  component="span"
                  sx={{ fontWeight: 700, color: "#1C57B8" }}
                >
                  {enrollmentCardData.notEnrolledCount} employees
                </Box>{" "}
                via email and SMS.
              </Typography>
              <Box
                onClick={() => setSendReminderOpen(false)}
                sx={{
                  width: "100%",
                  height: 46,
                  borderRadius: "10px",
                  background:
                    "linear-gradient(90deg, #2556A6 0%, #1F88C6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15, lineHeight: 1.7,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Done
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Employee Details Dialog ──────────────────────────────────────── */}
      <Dialog
        open={empDetailsOpen}
        onClose={() => setEmpDetailsOpen(false)}
        maxWidth="md"
        PaperProps={{
          sx: {
            width: 520,
            maxWidth: "calc(100vw - 32px)",
            borderRadius: "16px",
            boxShadow: "0 36px 90px rgba(15,23,42,0.34)",
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            px: 4,
            py: 3,
            borderBottom: "1px solid #E8EEF5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 600, color: "#111827" }}>
            Employee Details
          </Typography>
          <Box
            onClick={() => setEmpDetailsOpen(false)}
            sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <X size={18} color="#6B7280" />
          </Box>
        </Box>
        <DialogContent sx={{ p: 4 }}>
          <Typography
            sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 1.5 }}
          >
            Employee Name or ID
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              height: 56,
              border: "1.5px solid #D1D5DB",
              borderRadius: "10px",
              bgcolor: "#F9FAFB",
              mb: 2.5,
              "&:focus-within": { borderColor: "#2C5FA9", bgcolor: "#fff" },
              transition: "border-color 0.2s",
            }}
          >
            <UserCheck size={16} color="#4B5563" />
            <Box
              component="input"
              placeholder="e.g. EMP-10042"
              value={empDetailsSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmpDetailsSearch(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter" && empDetailsSearch.trim()) {
                  setEmpDetailsOpen(false);
                  navigate(`/hr-portal/enrollment/${empDetailsSearch.trim()}`);
                }
              }}
              sx={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 15, lineHeight: 1.7,
                color: "#111827",
                "&::placeholder": { color: "#4B5563" },
              }}
            />
            {empDetailsSearch && (
              <Box
                onClick={() => setEmpDetailsSearch("")}
                sx={{ cursor: "pointer", display: "flex" }}
              >
                <X size={14} color="#4B5563" />
              </Box>
            )}
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Button
              onClick={() => setEmpDetailsOpen(false)}
              sx={{
                height: 58,
                borderRadius: "14px",
                border: "1px solid #D8E0EA",
                textTransform: "none",
                color: "#475467",
                fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px",
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!empDetailsSearch.trim()}
              onClick={() => {
                if (!empDetailsSearch.trim()) return;
                setEmpDetailsOpen(false);
                navigate(`/hr-portal/enrollment/${empDetailsSearch.trim()}`);
              }}
              sx={{
                height: 58,
                borderRadius: "14px",
                textTransform: "none",
                background: "#184C97",
                color: "#fff",
                fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px",
                "&:hover": { background: "#143F7D" },
                "&.Mui-disabled": { background: "#E5E7EB", color: "#4B5563" },
              }}
            >
              View Profile
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ── Claim Status Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={claimStatusOpen}
        onClose={() => setClaimStatusOpen(false)}
        maxWidth="md"
        PaperProps={{
          sx: {
            width: 520,
            maxWidth: "calc(100vw - 32px)",
            borderRadius: "16px",
            boxShadow: "0 36px 90px rgba(15,23,42,0.34)",
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            px: 4,
            py: 3,
            borderBottom: "1px solid #E8EEF5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 600, color: "#111827" }}>
            Claim Status
          </Typography>
          <Box
            onClick={() => setClaimStatusOpen(false)}
            sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <X size={18} color="#6B7280" />
          </Box>
        </Box>
        <DialogContent sx={{ p: 4 }}>
          <Typography
            sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 1.5 }}
          >
            Claim ID
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              height: 56,
              border: "1.5px solid #D1D5DB",
              borderRadius: "10px",
              bgcolor: "#F9FAFB",
              mb: 2.5,
              "&:focus-within": { borderColor: "#2C5FA9", bgcolor: "#fff" },
              transition: "border-color 0.2s",
            }}
          >
            <FileText size={16} color="#4B5563" />
            <Box
              component="input"
              placeholder="e.g. CLM-2025-001"
              value={claimStatusSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setClaimStatusSearch(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter" && claimStatusSearch.trim()) {
                  const claimId = claimStatusSearch.trim().toUpperCase();
                  const match = MOCK_CLAIMS.find((c) => c.id.toUpperCase() === claimId);
                  setClaimStatusOpen(false);
                  if (match) navigate(`/hr-portal/enrollment/${match.employeeId}`, { state: { tab: "history" } });
                  else navigate(`/hr-portal/employees`);
                }
              }}
              sx={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 15, lineHeight: 1.7,
                color: "#111827",
                "&::placeholder": { color: "#4B5563" },
              }}
            />
            {claimStatusSearch && (
              <Box
                onClick={() => setClaimStatusSearch("")}
                sx={{ cursor: "pointer", display: "flex" }}
              >
                <X size={14} color="#4B5563" />
              </Box>
            )}
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Button
              onClick={() => setClaimStatusOpen(false)}
              sx={{
                height: 58,
                borderRadius: "14px",
                border: "1px solid #D8E0EA",
                textTransform: "none",
                color: "#475467",
                fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px",
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!claimStatusSearch.trim()}
              onClick={() => {
                if (!claimStatusSearch.trim()) return;
                const claimId = claimStatusSearch.trim().toUpperCase();
                const match = MOCK_CLAIMS.find((c) => c.id.toUpperCase() === claimId);
                setClaimStatusOpen(false);
                if (match) navigate(`/hr-portal/enrollment/${match.employeeId}`, { state: { tab: "history" } });
                else navigate(`/hr-portal/employees`);
              }}
              sx={{
                height: 58,
                borderRadius: "14px",
                textTransform: "none",
                background: "#184C97",
                color: "#fff",
                fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px",
                "&:hover": { background: "#143F7D" },
                "&.Mui-disabled": { background: "#E5E7EB", color: "#4B5563" },
              }}
            >
              View Claim
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ── E-Card Dialog — search only ──────────────────────────────────── */}
      <Dialog
        open={eCardOpen}
        onClose={() => setECardOpen(false)}
        PaperProps={{
          sx: {
            width: 480,
            maxWidth: "calc(100vw - 32px)",
            borderRadius: "16px",
            boxShadow: "0 36px 90px rgba(15,23,42,0.34)",
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            px: 4,
            py: 3,
            borderBottom: "1px solid #E8EEF5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 600, color: "#111827" }}>
            Find Employee
          </Typography>
          <Box
            onClick={() => setECardOpen(false)}
            sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <X size={18} color="#6B7280" />
          </Box>
        </Box>
        <DialogContent sx={{ p: 4 }}>
          <Typography
            sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 1.5 }}
          >
            Employee Name or ID
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              height: 52,
              border: "1.5px solid #D1D5DB",
              borderRadius: "10px",
              bgcolor: "#F9FAFB",
              "&:focus-within": { borderColor: "#2C5FA9", bgcolor: "#fff" },
              transition: "border-color 0.2s",
              mb: 3,
            }}
          >
            <Users size={16} color="#4B5563" />
            <Box
              component="input"
              placeholder="Search by name or employee ID..."
              value={eCardSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setECardSearch(e.target.value)
              }
              sx={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 15, lineHeight: 1.7,
                color: "#111827",
                "&::placeholder": { color: "#4B5563" },
              }}
            />
            {eCardSearch && (
              <Box
                onClick={() => setECardSearch("")}
                sx={{ cursor: "pointer", display: "flex" }}
              >
                <X size={14} color="#4B5563" />
              </Box>
            )}
          </Box>
          <Box
            sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}
          >
            <Button
              onClick={() => setECardOpen(false)}
              sx={{
                height: 52,
                borderRadius: "12px",
                border: "1px solid #D8E0EA",
                textTransform: "none",
                color: "#475467",
                fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px",
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!eCardSearch.trim()}
              onClick={() => {
                if (!eCardSearch.trim()) return;
                setECardEmployee({
                  name: "Ramesh Kumar",
                  empId: "EMP-10042",
                  dob: "12 Mar 1985",
                  gender: "Male",
                  policyNo: "GMC-2025-001",
                  policyName: "Group Mediclaim Policy",
                  insurer: "HDFC Ergo Health Insurance",
                  sumInsured: "₹5,00,000",
                  validFrom: "15 Jan 2026",
                  validTo: "14 Jan 2027",
                  dependents: ["Sunita Kumar (Spouse)", "Arjun Kumar (Son)"],
                });
                setECardOpen(false);
                setECardOverlayOpen(true);
              }}
              sx={{
                height: 52,
                borderRadius: "12px",
                textTransform: "none",
                background: "#184C97",
                color: "#fff",
                fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px",
                fontWeight: 600,
                "&:hover": { background: "#143F7D" },
                "&.Mui-disabled": { background: "#E5E7EB", color: "#4B5563" },
              }}
            >
              Search Employee
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ── E-Card Drawer — full-screen side overlay ─────────────────────── */}
      {/* ── Add Funds Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={addFundOpen}
        onClose={() => {
          if (!addFundSuccess) setAddFundOpen(false);
        }}
        PaperProps={{
          sx: {
            width: 480,
            maxWidth: "calc(100vw - 32px)",
            borderRadius: "16px",
            boxShadow: "0 36px 90px rgba(15,23,42,0.34)",
            overflow: "hidden",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 4,
            py: 3,
            borderBottom: "1px solid #E8EEF5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#111827" }}
            >
              Add Funds
            </Typography>
            {addFundAccount && (
              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085", mt: 0.75 }}>
                {addFundAccount.name}
              </Typography>
            )}
          </Box>
          <Box
            onClick={() => setAddFundOpen(false)}
            sx={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              p: 0.5,
              borderRadius: "6px",
              "&:hover": { bgcolor: "#F3F4F6" },
            }}
          >
            <X size={18} color="#6B7280" />
          </Box>
        </Box>

        <DialogContent sx={{ p: 4 }}>
          {addFundSuccess ? (
            /* Success state */
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: "#ECFDF5",
                  border: "2px solid #A7F3D0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <UserCheck size={26} color="#059669" />
              </Box>
              <Typography
                sx={{
                  fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px",
                  fontWeight: 700,
                  color: "#111827",
                  mb: 0.75,
                }}
              >
                Request Submitted
              </Typography>
              <Typography
                sx={{
                  fontSize: 15, lineHeight: 1.7,
                  color: "#667085",
                  mb: 3,
                  lineHeight: 1.6,
                }}
              >
                Your fund addition request of{" "}
                <strong>
                  {formatAmountWithCurrency(Number(addFundAmount.replace(/,/g, "")), localizationData?.data)}
                </strong>{" "}
                for <strong>{addFundAccount?.name}</strong> has been submitted.
                It will be reflected within 1–2 business days.
              </Typography>
              <Button
                fullWidth
                onClick={() => {
                  setAddFundOpen(false);
                  setAddFundSuccess(false);
                }}
                sx={{
                  height: 48,
                  borderRadius: "12px",
                  textTransform: "none",
                  background: "#184C97",
                  color: "#fff",
                  fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px",
                  fontWeight: 600,
                  "&:hover": { background: "#143F7D" },
                }}
              >
                Done
              </Button>
            </Box>
          ) : (
            <>
              {/* Current balance info */}
              {addFundAccount && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2.5,
                    py: 2,
                    borderRadius: "10px",
                    bgcolor: "#F8FAFC",
                    border: "1px solid #E5E7EB",
                    mb: 3,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563" }}>
                      Current Balance
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px",
                        fontWeight: 700,
                        color: "#111827",
                        mt: 0.75,
                      }}
                    >
                      {addFundAccount.balance}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 999,
                      bgcolor: "#FEF2F2",
                      border: "1px solid #FEE4E2",
                      color: "#DC2626",
                      fontSize: 15, lineHeight: 1.7,
                      fontWeight: 600,
                    }}
                  >
                    Low Balance
                  </Box>
                </Box>
              )}

              {/* Amount field */}
              <Typography
                sx={{
                  fontSize: 15, lineHeight: 1.7,
                  fontWeight: 600,
                  color: "#374151",
                  mb: 1,
                }}
              >
                Amount to Add
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  height: 52,
                  border: "1.5px solid #D1D5DB",
                  borderRadius: "10px",
                  bgcolor: "#F9FAFB",
                  mb: 3,
                  "&:focus-within": { borderColor: "#2C5FA9", bgcolor: "#fff" },
                  transition: "border-color 0.2s",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px",
                    fontWeight: 600,
                    color: "#6B7280",
                    lineHeight: 1,
                  }}
                >
                  {getCurrencySymbolPrefix(localizationData?.data)}
                </Typography>
                <Box
                  component="input"
                  type="number"
                  placeholder="Enter amount"
                  value={addFundAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAddFundAmount(e.target.value)
                  }
                  sx={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px",
                    fontWeight: 600,
                    color: "#111827",
                    "&::placeholder": { color: "#4B5563", fontWeight: 400 },
                  }}
                />
              </Box>

              {/* Quick amount chips */}
              <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
                {["50,000", "1,00,000", "2,00,000", "5,00,000"].map((amt) => (
                  <Box
                    key={amt}
                    onClick={() => setAddFundAmount(amt.replace(/,/g, ""))}
                    sx={{
                      px: 2,
                      py: 0.75,
                      borderRadius: "8px",
                      border: "1px solid #D1D5DB",
                      bgcolor:
                        addFundAmount === amt.replace(/,/g, "")
                          ? "#EEF4FF"
                          : "#fff",
                      color:
                        addFundAmount === amt.replace(/,/g, "")
                          ? "#1C57B8"
                          : "#374151",
                      fontSize: 15, lineHeight: 1.7,
                      fontWeight: 500,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#F0F4FF" },
                    }}
                  >
                    {getCurrencySymbolPrefix(localizationData?.data)}{amt}
                  </Box>
                ))}
              </Box>

              {/* Payment method */}
              <Typography
                sx={{
                  fontSize: 15, lineHeight: 1.7,
                  fontWeight: 600,
                  color: "#374151",
                  mb: 1,
                }}
              >
                Payment Method
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1.5,
                  mb: 4,
                }}
              >
                {(
                  [
                    ["neft", "NEFT / RTGS", "Bank transfer"],
                    ["upi", "UPI", "Instant transfer"],
                  ] as const
                ).map(([key, label, sub]) => (
                  <Box
                    key={key}
                    onClick={() => setAddFundPayMethod(key)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: "10px",
                      border:
                        addFundPayMethod === key
                          ? "1.5px solid #2C5FA9"
                          : "1.5px solid #E5E7EB",
                      bgcolor: addFundPayMethod === key ? "#EEF4FF" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 15, lineHeight: 1.7,
                        fontWeight: 600,
                        color: addFundPayMethod === key ? "#1C57B8" : "#374151",
                      }}
                    >
                      {label}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563", mt: 0.75 }}
                    >
                      {sub}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Actions */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1.5,
                }}
              >
                <Button
                  onClick={() => setAddFundOpen(false)}
                  sx={{
                    height: 48,
                    borderRadius: "12px",
                    border: "1px solid #D8E0EA",
                    textTransform: "none",
                    color: "#475467",
                    fontSize: 15, lineHeight: 1.7,
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={!addFundAmount || Number(addFundAmount) <= 0}
                  onClick={() => setAddFundSuccess(true)}
                  sx={{
                    height: 48,
                    borderRadius: "12px",
                    textTransform: "none",
                    background: "#184C97",
                    color: "#fff",
                    fontSize: 15, lineHeight: 1.7,
                    fontWeight: 600,
                    "&:hover": { background: "#143F7D" },
                    "&.Mui-disabled": {
                      background: "#E5E7EB",
                      color: "#4B5563",
                    },
                  }}
                >
                  Confirm &amp; Submit
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Drawer
        anchor="right"
        open={eCardOverlayOpen}
        onClose={() => {
          setECardOverlayOpen(false);
          setECardEmployee(null);
          setECardSearch("");
        }}
        PaperProps={{
          sx: {
            width: 580,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          },
        }}
      >
        {/* Gradient header */}
        <Box
          sx={{
            px: 4,
            py: 3,
            background: "linear-gradient(90deg, #2556A6 0%, #1F88C6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 600, color: "#fff" }}>
              Insurance E-Cards
            </Typography>
            {eCardEmployee && (
              <Typography
                sx={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", mt: 0.75 }}
              >
                {eCardEmployee.name} · {1 + eCardEmployee.dependents.length}{" "}
                members
              </Typography>
            )}
          </Box>
          <Box
            onClick={() => {
              setECardOverlayOpen(false);
              setECardEmployee(null);
              setECardSearch("");
            }}
            sx={{
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.35)",
              background: "rgba(255,255,255,0.1)",
              "&:hover": { background: "rgba(255,255,255,0.2)" },
            }}
          >
            <X size={16} color="#fff" />
          </Box>
        </Box>

        {/* Search field — pre-filled with entered ID, re-searchable */}
        <Box
          sx={{
            px: 4,
            pt: 3,
            pb: 2,
            flexShrink: 0,
            borderBottom: "1px solid #E8EEF5",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              height: 44,
              border: "1.5px solid #D1D5DB",
              borderRadius: "10px",
              bgcolor: "#F9FAFB",
              "&:focus-within": { borderColor: "#2C5FA9", bgcolor: "#fff" },
              transition: "border-color 0.2s",
            }}
          >
            <Users size={15} color="#4B5563" />
            <Box
              component="input"
              value={eCardSearch}
              placeholder="Enter employee name or ID…"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setECardSearch(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter" && eCardSearch.trim()) {
                  setECardEmployee({
                    name: "Ramesh Kumar",
                    empId: "EMP-10042",
                    dob: "12 Mar 1985",
                    gender: "Male",
                    policyNo: "GMC-2025-001",
                    policyName: "Group Mediclaim Policy",
                    insurer: "HDFC Ergo Health Insurance",
                    sumInsured: "₹5,00,000",
                    validFrom: "15 Jan 2026",
                    validTo: "14 Jan 2027",
                    dependents: ["Sunita Kumar (Spouse)", "Arjun Kumar (Son)"],
                  });
                }
              }}
              sx={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 15, lineHeight: 1.7,
                color: "#111827",
                "&::placeholder": { color: "#4B5563" },
              }}
            />
            {eCardSearch && (
              <Box
                onClick={() => {
                  setECardSearch("");
                  setECardEmployee(null);
                }}
                sx={{ cursor: "pointer", display: "flex" }}
              >
                <X size={13} color="#4B5563" />
              </Box>
            )}
            <Box
              onClick={() => {
                if (eCardSearch.trim())
                  setECardEmployee({
                    name: "Ramesh Kumar",
                    empId: "EMP-10042",
                    dob: "12 Mar 1985",
                    gender: "Male",
                    policyNo: "GMC-2025-001",
                    policyName: "Group Mediclaim Policy",
                    insurer: "HDFC Ergo Health Insurance",
                    sumInsured: "₹5,00,000",
                    validFrom: "15 Jan 2026",
                    validTo: "14 Jan 2027",
                    dependents: ["Sunita Kumar (Spouse)", "Arjun Kumar (Son)"],
                  });
              }}
              sx={{
                width: 30,
                height: 30,
                borderRadius: "7px",
                background: "#184C97",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                "&:hover": { background: "#143F7D" },
              }}
            >
              <Search size={13} color="#fff" />
            </Box>
          </Box>
        </Box>

        {/* Body: cards */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {/* Cards — scrollable */}
          <Box
            ref={policyCardsScrollRef}
            sx={{
              flex: 1,
              overflowY: "auto",
              px: 3,
              py: 3,
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
            }}
          >
            {eCardEmployee &&
              (() => {
                const emp = eCardEmployee;
                const parsedDeps = emp.dependents.map((d) => {
                  const m = d.match(/^(.*?)\s*\(([^)]+)\)$/);
                  return m
                    ? { name: m[1].trim(), relation: m[2].trim() }
                    : { name: d, relation: "Dependent" };
                });
                const allMembers = [
                  {
                    name: emp.name,
                    memberId: emp.empId,
                    dob: emp.dob,
                    gender: emp.gender,
                    relation: "Self",
                    isSelf: true,
                  },
                  ...parsedDeps.map((d, i) => ({
                    name: d.name,
                    memberId: `${emp.empId}-D${i + 1}`,
                    dob: "—",
                    gender: "—",
                    relation: d.relation,
                    isSelf: false,
                  })),
                ];
                return allMembers.map((member, idx) => (
                  <Box key={member.name + idx}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          sx={{
                            fontSize: 15, lineHeight: 1.7,
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          {member.name}
                        </Typography>
                        <Box
                          sx={{
                            px: 1.1,
                            py: 0.25,
                            borderRadius: 999,
                            bgcolor: member.isSelf ? "#EBF3FF" : "#F3F0FF",
                            color: member.isSelf ? "#1C57B8" : "#7C3AED",
                            fontSize: 15, lineHeight: 1.7,
                            fontWeight: 600,
                          }}
                        >
                          {capitalizeFirst(member.relation)}
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", gap: 0.75 }}>
                        <Box
                          onClick={() =>
                            navigator.share?.({
                              title: `E-Card – ${member.name}`,
                              url: window.location.href,
                            })
                          }
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#fff",
                            color: "#184C97",
                            border: "1px solid #184C97",
                            cursor: "pointer",
                            "&:hover": { background: "#EEF4FF" },
                          }}
                        >
                          <Share2 size={14} />
                        </Box>
                        <Box
                          onClick={() => window.print()}
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#184C97",
                            color: "#fff",
                            cursor: "pointer",
                            "&:hover": { background: "#143F7D" },
                          }}
                        >
                          <Download size={14} />
                        </Box>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        mx: 0,
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          background:
                            "linear-gradient(90deg, #2C5FA9 0%, #2588B2 100%)",
                          px: 3,
                          pt: 2.5,
                          pb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 2,
                          }}
                        >
                          <Box>
                            <Typography
                              sx={{
                                fontSize: 15, lineHeight: 1.7,
                                letterSpacing: "0.12em",
                                color: "rgba(255,255,255,0.65)",
                                mb: 0.75,
                              }}
                            >
                              {emp.insurer.toUpperCase()}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 15, lineHeight: 1.7,
                                fontWeight: 700,
                                color: "#fff",
                              }}
                            >
                              {emp.policyName}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              background: "rgba(255,255,255,0.18)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <ShieldCheck size={17} color="#fff" />
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            rowGap: 1.75,
                            columnGap: 2,
                          }}
                        >
                          {[
                            ["Member", member.name],
                            ["Member ID", member.memberId],
                            ["Gender", member.gender],
                            ["Policy No.", emp.policyNo],
                            ["Sum Insured", emp.sumInsured],
                            [
                              "Valid From → To",
                              `${emp.validFrom} – ${emp.validTo}`,
                            ],
                          ].map(([label, value]) => (
                            <Box key={label}>
                              <Typography
                                sx={{
                                  fontSize: 15, lineHeight: 1.7,
                                  color: "rgba(255,255,255,0.6)",
                                  letterSpacing: "0.04em",
                                }}
                              >
                                {label}
                              </Typography>
                              <Typography
                                sx={{
                                  mt: 0.2,
                                  fontSize: 15, lineHeight: 1.7,
                                  fontWeight: 600,
                                  color: "#fff",
                                }}
                              >
                                {value}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          background:
                            "linear-gradient(247deg, #EDEDED 6.94%, #FEFEFE 84.91%)",
                          px: 3,
                          py: 1.5,
                          display: "flex",
                          gap: 7,
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography
                            sx={{
                              fontSize: 15, lineHeight: 1.7,
                              color: "#4B5563",
                            }}
                          >
                            Network Hospitals
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 15, lineHeight: 1.7,
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            7,000+
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            sx={{
                              fontSize: 15, lineHeight: 1.7,
                              color: "#4B5563",
                            }}
                          >
                            TPA Helpline (24×7)
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 15, lineHeight: 1.7,
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            1800-266-0700
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ));
              })()}
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: 4,
            py: 2.5,
            borderTop: "1px solid #E8EEF5",
            flexShrink: 0,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1.5,
          }}
        >
          <Button
            fullWidth
            startIcon={<Share2 size={16} />}
            onClick={() =>
              eCardEmployee &&
              navigator.share?.({
                title: `E-Cards – ${eCardEmployee.name}`,
                url: window.location.href,
              })
            }
            sx={{
              height: 48,
              borderRadius: "12px",
              textTransform: "none",
              background: "#fff",
              color: "#184C97",
              border: "1.5px solid #184C97",
              fontSize: 15, lineHeight: 1.7,
              fontWeight: 600,
              "&:hover": { background: "#EEF4FF" },
            }}
          >
            Share All
          </Button>
          <Button
            fullWidth
            startIcon={<Download size={16} />}
            onClick={() => window.print()}
            sx={{
              height: 48,
              borderRadius: "12px",
              textTransform: "none",
              background: "#184C97",
              color: "#fff",
              fontSize: 15, lineHeight: 1.7,
              fontWeight: 600,
              "&:hover": { background: "#143F7D" },
            }}
          >
            Download All
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}

export default HRPortalDashboard;
