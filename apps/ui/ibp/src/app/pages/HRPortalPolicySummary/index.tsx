import { Box, CircularProgress, Dialog, DialogContent, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  Download,
  Eye,
  FileText,
  HeartHandshake,
  Info,
  Lock,
  Mail,
  Percent,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  endPoints,
  CustomModal,
  formatNumberByLocalization, formatAmountWithCurrency, getCurrencySymbolPrefix, getTaxLabel,
  useLocalization,
} from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { useHRReport } from "../../hooks/useHRReport";
import { formatINR, isYoYSuppressed } from "../../utils/hrAnalytics";
import { capitalizeFirst } from "../../utils";
import { getCompanyId } from "../../utils/companyConfig";
import { EndorsementManagement } from "../HRPortalEnrolmentV2";

// ─── Types ─────────────────────────────────────────────────────────────────────

type PolicyCdSummaryRow = {
  policyId: number;
  policyName: string;
  netPremium: number;
  cdBalance: number;
  cdUsedAmount: number;
  cdRunningBalance: number;
  cdAccountNumber: string | null;
  totalLives: number;
  employeeCount: number;
  safeLimit: number;
  usedPercent: number;
  usedAmount: number;
  insurer: string;
  periodStart: string;
  periodEnd: string;
};

type ClaimHistoryRow = {
  claimId: number;
  claimNumber: string;
  employeeId?: string | null;
  employeeName?: string | null;
  patientName: string;
  relation: string;
  hospital: string;
  claimDate: string | null;
  claimType: string;
  claimedAmount: number;
  approvedAmount: number;
  settlementDate: string | null;
  status: string;
  statusBucket?: string;
};

type ClaimsMonthRow = {
  month: string;
  monthStart: string;
  cashlessAmount: number;
  reimbursementAmount: number;
  cashlessCount: number;
  reimbursementCount: number;
  cashlessAmountPrevYear: number;
  reimbursementAmountPrevYear: number;
  cashlessCountPrevYear: number;
  reimbursementCountPrevYear: number;
};

type Top10HospitalRow = {
  hospitalId: string;
  hospitalName: string;
  city: string;
  totalClaims: number;
  totalAmount: number;
  totalAmountPrevYear: number;
  rankPrevYear: number | null;
  rankChange: number | null;
  yoYChangePercent: number | null;
};

type Top10DiseaseRow = {
  diseaseCategory: string;
  totalClaims: number;
  totalAmount: number;
  totalAmountPrevYear: number;
  rankPrevYear: number | null;
  rankChange: number | null;
  yoYChangePercent: number | null;
};

type CdTransactionRow = {
  txnId: number;
  txnDate: string;
  txnType: "Deposit" | "Deduction";
  amount: number;
  cdAccountNumber: string | null;
  policyNumber: string | null;
  isCurrentPolicy: boolean;
  runningBalance: number;
  bankName: string | null;
  referenceId: string | null;
  endorsementNumber: string | null;
  endorsementType: string | null;
  transactionValueDate: string | null;
  createdBy: string | null;
  remarks: string | null;
  additionCount: number;
  deletionCount: number;
  totalLivesCount: number;
};

type PolicyEnrollmentSummaryRow = {
  totalEmployees: number;
  totalDependents: number;
  enrolledCount: number;
  inProgressCount: number;
  notStartedCount: number;
  notEnrolledCount: number;
  notLoggedInCount: number;
  loggedInCount: number;
  enrolledPercent: number;
  inProgressPercent: number;
  notStartedPercent: number;
  notLoggedInPercent: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
};

type LinkedPolicyRow = {
  policyId: number;
  policyName: string;
  policyTypeKey: string;
  policyNumber: string;
  periodStart: string;
  periodEnd: string;
  netPremium: number;
  totalLives: number;
};

type UpcomingInstallmentRow = {
  installmentId: number;
  installmentLabel: string;
  installmentSeq: number | null;
  installmentDate: string;
  installmentAmount: number | null;
  totalInstallmentAmount: number | null;
  installmentPercent: number | null;
  statusKey: string | null;
};

type EndorsementReportRow = {
  policyId?: number;
  policyName?: string;
  netGrossPremium?: number | string;
  totalEndorsements?: number | string;
  employeesAtInception?: number | string;
  employeesInAddition?: number | string;
  employeesInDeletion?: number | string;
  activeEmployees?: number | string;
  activePremium?: number | string;
  totalEligible?: number | string;
  totalEligibleLives?: number | string;
  premiumAtInception?: number | string;
  totalPremium?: number | string;
  enrolledOfEligiblePercent?: number | string;
  premiumCoveragePercent?: number | string;
  livesAtInception?: number | string;
  livesInAddition?: number | string;
  livesInDeletion?: number | string;
  activeLives?: number | string;
  basePremium?: number | string;
  taxAmount?: number | string;
  grossPremium?: number | string;
  additionPremium?: number | string;
  deletionPremium?: number | string;
  correctionAdditionPremium?: number | string;
  correctionDeletionPremium?: number | string;
  netPremium?: number | string;
  rawNetPremium?: number | string;
  rawGrossPremium?: number | string;
  rawAddedCount?: number | string;
  rawDeletedCount?: number | string;
  rawDeletedDependentCount?: number | string;
  stillActiveAddedCount?: number | string;
  netTaxAmount?: number | string;
  endorsementId?: number | string;
  endorsmentCount?: number | string;
  endorsmentDependentCount?: number | string;
  endorsementType?: string | null;
  endorsementDate?: string;
  enrollmentStartDate?: string;
  enrollmentEndDate?: string;
  endorsementStatus?: string;
  isInception?: boolean;
  uploadCount?: number | string;
  totalSuccessCount?: number | string;
  totalErrorCount?: number | string;
  createdAt?: string;
  status?: string;
  remarks?: string;
  fileUrl?: string;
  errorFileUrl?: string;
  processStatus?: string;
  originalFileName?: string;
  fileName?: string;
  successCount?: number | string;
};

// Subset of dashboard_policy_cards row passed via router state
type PolicyCardRow = {
  policyId: number;
  policyName: string;
  policyTypeKey?: string;
  iiRmTypeKey?: string;
  policyNumber?: string;
  insurer: string;
  tpaName?: string;
  periodStart: string;
  periodEnd: string;
  netPremium: number;
  earnedPremium?: number;
  cdBalance: number;
  totalLives?: number;
  icrPercent: number;
  icrYoYChangePercent: number | null;
  icrClaimCount: number;
  claimAmount: number;
  icrSamePeriodLYPercent: number;
  icrSamePeriodLYAmount: number;
  icrFullYearAvgLY: number;
  icrFullYearAvgLYAmount?: number;
  lyNetPremium?: number;
  lySamePeriodEarnedPremium?: number;
  icrForecastPercent: number;
  enrolledCount: number;
  inProgressCount: number;
  notEnrolledCount: number;
  employeeCount: number;
  cdAccountNumber?: string | null;
  totalAssets?: number | null;
  totalSubAssets?: number | null;
  totalSumInsured?: number | null;
  assetTotalPremium?: number | null;
};

type NonLifeAssetKpiRow = {
  totalAssets: number;
  totalSubAssets: number;
  totalSumInsured: number;
  assetTotalPremium: number;
  totalEndorsements: number;
  endorsementAssetCount: number;
};

type NonLifeAssetRow = {
  assetId: number;
  coverCode: string;
  riskLocationType: string | null;
  riskLocationDetails: string | null;
  category: string | null;
  coverageType: string | null;
  quantity: number | null;
  uom: string | null;
  sumInsured: number;
  premium: number;
  rate: number | null;
  effectiveDate: string | null;
  subAssetCount: number;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "cd", label: "CD Balance" },
  { id: "enrollment", label: "Enrolment" },
  { id: "claims", label: "Claim Analytics" },
] as const;

type TabId = typeof TABS[number]["id"];
type ClaimsSection = "analytics" | "enrollment";

const PAGE_SIZE = 10;

const PS_REQUIRED_COLS: { label: string; format: string; example: string }[] = [
  { label: "Employee Name", format: "Text (max 100 chars)", example: "Anjali Rentala" },
  { label: "Date of Birth", format: "DD/MM/YYYY", example: "18/09/1991" },
  // { label: "Date of Joining", format: "DD/MM/YYYY", example: "01/04/2022" },
  { label: "Gender", format: "Male or Female", example: "Male / Female" },
  { label: "Relation", format: "Self / Spouse / Son / Daughter", example: "Self" },
  { label: "Department", format: "Text", example: "Engineering / Finance / HR" },
  { label: "Designation", format: "Text", example: "Senior Engineer" },
];

const PS_ENDORSEMENT_COLS: { label: string; format: string; example: string }[] = [
  ...PS_REQUIRED_COLS,
  { label: "Change Type", format: "Addition / Deletion / Correction", example: "Addition" },
  { label: "Effective Date", format: "DD/MM/YYYY", example: "15/04/2025" },
  { label: "Previous Policy Period", format: "DD Mon YYYY – DD Mon YYYY", example: "01 Apr 2024 – 31 Mar 2025" },
];

const CLAIM_STATUS_OPTIONS = ["", "Pending", "Approved", "Rejected", "Settled"] as const;
const CLAIM_STATUS_LABELS: Record<string, string> = {
  "": "All status",
  Pending: "Pending",
  Approved: "Approved",
  Rejected: "Rejected",
  Settled: "Settled",
};
// The UI shows 4 buckets (Pending/Approved/Rejected/Settled), but
// policy_claim.claim_status in the DB holds many more distinct raw strings
// (case-inconsistent, free text from TPA/ops updates — e.g. "Ready for
// payment", "Payment Initiated", "Under Rejection Approval", "RAL
// Deficiency"...). draft.status/claimStatus hold the display label
// throughout the UI (chip highlighting, TAT cards) and are sent to the
// backend as-is; the label-to-raw-value bucket matching (via ILIKE
// keywords) happens server-side in policy_claim_history's SQL — see
// database-migrations/sql/claim-status-bucket-fix.sql.

const CLAIM_TYPE_OPTIONS = ["", "Cashless", "Reimbursement"] as const;
const CLAIM_TYPE_LABELS: Record<string, string> = {
  "": "All types",
  Cashless: "Cashless",
  Reimbursement: "Reimbursement",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getPolicyIconInfo = (name: string): { icon: ReactNode; iconBg: string } => {
  const n = (name ?? "").toLowerCase();
  if (n.includes("mediclaim") || n.includes("health"))
    return { icon: <HeartHandshake size={22} color="#fff" />, iconBg: "#1C57B8" };
  if (n.includes("term") || n.includes("life"))
    return { icon: <Shield size={22} color="#fff" />, iconBg: "#7C3AED" };
  if (n.includes("accident"))
    return { icon: <Activity size={22} color="#fff" />, iconBg: "#059669" };
  if (n.includes("parent") || n.includes("family"))
    return { icon: <Users size={22} color="#fff" />, iconBg: "#D97706" };
  return { icon: <Shield size={22} color="#fff" />, iconBg: "#1C57B8" };
};

const getPolicyCodeInfo = (name: string): { code: string; color: string; bg: string; border: string } => {
  const n = (name ?? "").toLowerCase();
  if (n.includes("mediclaim") || n.includes("health")) {
    return { code: "GMC", color: "#2556A6", bg: "#EBF3FF", border: "#BFDBFE" };
  }
  if (n.includes("accident")) {
    return { code: "GPA", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" };
  }
  if (n.includes("term") || n.includes("life")) {
    return { code: "GTL", color: "#059669", bg: "#ECFDF5", border: "#BBF7D0" };
  }
  return { code: "POL", color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB" };
};

// "01 Apr 2025" → "Apr 2025"
const toPeriodLabel = (ddMonYYYY: string): string => {
  if (!ddMonYYYY) return "—";
  const parts = ddMonYYYY.trim().split(" ");
  return parts.length === 3 ? `${parts[1]} ${parts[2]}` : ddMonYYYY;
};

// "01 Apr 2025" → "Apr 2024"  (subtract one year)
const toLYLabel = (ddMonYYYY: string): string => {
  if (!ddMonYYYY) return "—";
  const parts = ddMonYYYY.trim().split(" ");
  if (parts.length === 3) return `${parts[1]} ${parseInt(parts[2]) - 1}`;
  return ddMonYYYY;
};

const fmtDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  const trimmed = String(dateStr).trim();
  if (!trimmed) return "—";
  // DD/MM/YYYY or DD-MM-YYYY (the format this page's APIs consistently return,
  // e.g. TO_CHAR(..., 'DD/MM/YYYY')) must be tried FIRST, not as a fallback.
  // Native Date parsing treats ambiguous slash-separated strings as MM/DD/YYYY
  // and does NOT throw for day <= 12 — e.g. "07/08/2026" (meant as 7 Aug)
  // silently parses as 8 Jul instead of NaN, so a "native first, DD/MM
  // fallback on NaN" ordering never reaches the fallback for exactly the
  // ambiguous dates where it matters. Unambiguous strings (day > 12) used to
  // "work" only because native parsing correctly failed and triggered the
  // fallback — this reordering makes every date parse the same way.
  let d: Date;
  const m = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  } else {
    d = new Date(trimmed);
  }
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const safeDateDiffDays = (start: string | null | undefined, end: string | null | undefined): number | null => {
  if (!start || !end) return null;
  const from = new Date(start);
  const to = new Date(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86400000));
};

// Batch ID | Upload Date | Enroll Start | Enroll End | File Name | Size | Total | Success | Failed | Status | Completed At | Actions
const FILE_COL_WIDTHS_DEFAULT = [90, 210, 120, 115, 200, 80, 75, 90, 75, 115, 210, 175];

// ─── Component ─────────────────────────────────────────────────────────────────

export function HRPortalPolicySummary({ locationIds = '' }: { locationIds?: string } = {}) {
  const navigate = useNavigate();
  const { policyId: policyIdParam } = useParams<{ policyId: string }>();
  const location = useLocation();
  const { localizationData } = useLocalization();

  const numericPolicyId = Number(policyIdParam);
  const isValidId = !isNaN(numericPolicyId) && numericPolicyId > 0;
  const [searchParams] = useSearchParams();
  const _ownCompanyId = getCompanyId();
  const _paramCompanyId = searchParams.get('companyId') ? Number(searchParams.get('companyId')) : null;

  const routerState = location.state as {
    policyRow?: PolicyCardRow;
    policyList?: PolicyCardRow[];
    tab?: TabId;
    companyId?: number;
    companyName?: string;
  } | null;
  const routerPolicyRow = routerState?.policyRow ?? null;

  // companyId from URL params takes priority; falls back to router state then logged-in user
  const companyId = _paramCompanyId ?? routerState?.companyId ?? _ownCompanyId;
  const _policyCardsCompanyId = companyId ?? 0;
  // When a location filter is active we always re-fetch so Lives Covered /
  // Enrollment Status / premium on this page reflect the selected location.
  // Without a filter we still prefer routerPolicyRow (instant paint from navigation
  // state) and only hit the API if no router row was passed.
  const hasLocationFilter = !!locationIds && locationIds.trim() !== '' && locationIds.trim() !== '[]';
  // Pass policyId directly so the API returns exactly this one policy.
  // policyStatus='' bypasses the active/inactive filter (the SQL does this when policyId is set).
  const { data: _policyCardsForSummary, isFetching: _policyCardsFetching } = useHRReport<PolicyCardRow>(
    "dashboard_policy_cards",
    { companyId: _policyCardsCompanyId, policyType: "", policyStatus: "", locationIds, policyId: String(numericPolicyId) },
    isValidId && !!_policyCardsCompanyId && (!routerPolicyRow || hasLocationFilter)
  );

  // True while a location-filtered fetch is in-flight.
  const policyRowLoading = hasLocationFilter && _policyCardsFetching;

  const policyRow: PolicyCardRow | null =
    // Location filter active AND response arrived → use first result (API returns only this policy)
    (hasLocationFilter && !_policyCardsFetching
      ? _policyCardsForSummary[0] ?? null
      : null)
    // No filter → fast paint from routerPolicyRow then fall back to API
    ?? (!hasLocationFilter ? routerPolicyRow : null)
    ?? (!hasLocationFilter ? _policyCardsForSummary[0] ?? null : null)
    ?? null;

  const isNonLife = useMemo(() => {
    const k = (policyRow?.iiRmTypeKey ?? "").toLowerCase();
    return k.length > 0 && !k.includes("life") && !k.includes("health");
  }, [policyRow]);

  const [activeTab, setActiveTab] = useState<TabId>(routerState?.tab ?? "cd");
  const [claimsSection, setClaimsSection] = useState<ClaimsSection>("analytics");
  const [claimDistribTab, setClaimDistribTab] = useState<"relation" | "type">("relation");
  // Top 10 Hospitals sort — must match the backend's own ranking (ORDER BY
  // total_amount DESC, see dashboard_top10_hospitals) by default, since
  // rankPrevYear/rankChange are computed server-side against that order.
  // "claims" lets the user switch to a count-based view on demand instead.
  const [hospitalSortBy, setHospitalSortBy] = useState<"amount" | "claims">("amount");

  // Claim History local filter state — committed (sent to API)
  const [claimStatus, setClaimStatus] = useState("");
  const [claimTypeFilter, setClaimTypeFilter] = useState("");
  const [claimDateFromFilter, setClaimDateFromFilter] = useState("");
  const [claimDateToFilter, setClaimDateToFilter] = useState("");
  const [claimNoFilter, setClaimNoFilter] = useState("");
  const [claimSearchFilter, setClaimSearchFilter] = useState("");
  const [employeeIdFilter, setEmployeeIdFilter] = useState("");
  const [settlementDateFromFilter, setSettlementDateFromFilter] = useState("");
  const [settlementDateToFilter, setSettlementDateToFilter] = useState("");
  const [amountMinFilter, setAmountMinFilter] = useState("");
  const [amountMaxFilter, setAmountMaxFilter] = useState("");
  const [tatFilter, setTatFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);

  // Smart filter panel — draft state (not sent to API until Run)
  const [hasRunFilter, setHasRunFilter] = useState(false);
  const [draft, setDraft] = useState({
    claimNo: "",
    claimType: "",         // "Cashless" | "Reimbursement" | ""
    status: "",            // "Pending" | "Approved" | "Rejected" | "Settled" | ""
    searchText: "",        // unified search: employee name/ID, patient name, hospital
    employeeId: "",        // company_employee_id filter
    claimDateFrom: "",
    claimDateTo: "",
    settlementDateFrom: "",
    settlementDateTo: "",
    amountMin: "",
    amountMax: "",
    tat: "",               // "lte7" | "7to30" | "gt30" | ""
  });
  type ClaimDraft = typeof draft;

  const EMPTY_DRAFT: ClaimDraft = {
    claimNo: "", claimType: "", status: "", searchText: "", employeeId: "",
    claimDateFrom: "", claimDateTo: "",
    settlementDateFrom: "", settlementDateTo: "",
    amountMin: "", amountMax: "", tat: "",
  };

  const CHIP_LABELS: Record<string, string> = {
    claimNo: "Claim No",
    claimType: "Type",
    status: "Status",
    searchText: "Search",
    employeeId: "Employee ID",
    claimDateFrom: "Claim From",
    claimDateTo: "Claim To",
    settlementDateFrom: "Settlement From",
    settlementDateTo: "Settlement To",
    amountMin: "Amount ≥",
    amountMax: "Amount ≤",
    tat: "TAT",
  };

  const draftActiveCount = Object.values(draft).filter(Boolean).length;

  const runSmartFilter = () => {
    setClaimStatus(draft.status);
    setClaimTypeFilter(draft.claimType);
    setClaimDateFromFilter(draft.claimDateFrom);
    setClaimDateToFilter(draft.claimDateTo);
    setClaimNoFilter(draft.claimNo);
    setClaimSearchFilter(draft.searchText);
    setEmployeeIdFilter(draft.employeeId);
    setSettlementDateFromFilter(draft.settlementDateFrom);
    setSettlementDateToFilter(draft.settlementDateTo);
    setAmountMinFilter(draft.amountMin);
    setAmountMaxFilter(draft.amountMax);
    setTatFilter(draft.tat);
    setSearch("");
    setDebouncedSearch("");
    setPage(0);
    setHasRunFilter(true);
  };

  const resetSmartFilter = () => {
    setDraft(EMPTY_DRAFT);
    setClaimStatus(""); setClaimTypeFilter("");
    setClaimDateFromFilter(""); setClaimDateToFilter("");
    setClaimNoFilter(""); setClaimSearchFilter(""); setEmployeeIdFilter("");
    setSettlementDateFromFilter(""); setSettlementDateToFilter("");
    setAmountMinFilter(""); setAmountMaxFilter(""); setTatFilter("");
    setSearch(""); setDebouncedSearch(""); setPage(0);
    setHasRunFilter(false);
  };

  const setPatchDraft = (patch: Partial<ClaimDraft>) =>
    setDraft((prev) => ({ ...prev, ...patch }));
  const [endorsementLoading, setEndorsementLoading] = useState(false);
  const [sendReminderOpen, setSendReminderOpen] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [reminderSending, setReminderSending] = useState(false);
  const [pendingEmployeeIds, setPendingEmployeeIds] = useState<number[]>([]);
  const [pendingCountLoading, setPendingCountLoading] = useState(false);

  const openSendReminderDialog = async () => {
    setReminderSent(false);
    setPendingEmployeeIds([]);
    setPendingCountLoading(true);
    setSendReminderOpen(true);
    try {
      const res = await apiRequest(endPoints.hrPendingEnrollmentEmployees(numericPolicyId), { method: "GET" });
      setPendingEmployeeIds(res?.data?.employeeIds ?? []);
    } catch {
      setPendingEmployeeIds([]);
    } finally {
      setPendingCountLoading(false);
    }
  };
  const [endorsementOverview, setEndorsementOverview] = useState<EndorsementReportRow | null>(null);
  const [endorsementMetrics, setEndorsementMetrics] = useState<EndorsementReportRow | null>(null);
  const [endorsementList, setEndorsementList] = useState<EndorsementReportRow[]>([]);
  const [policyPremiumDetails, setPolicyPremiumDetails] = useState<{ basePremium: number; taxAmount: number; grossPremium: number } | null>(null);

  // ── Designer's inception/endorsement UI state ──────────────────────────────
  const [inceptionView, setInceptionView] = useState<"upload" | "uploaded" | "loading" | "in_progress" | "completed">("upload");
  const [inceptionFile, setInceptionFile] = useState("");
  const [inceptionFileObj, setInceptionFileObj] = useState<File | null>(null);
  const [inceptionDragging, setInceptionDragging] = useState(false);
  const [inceptionBannerVisible, setInceptionBannerVisible] = useState(false);
  const [isInceptionUploading, setIsInceptionUploading] = useState(false);
  const [inceptionUploadError, setInceptionUploadError] = useState("");
  const [inceptionRefreshing, setInceptionRefreshing] = useState(false);
  const [isInceptionCompletedFromApi, setIsInceptionCompletedFromApi] = useState(false);
  const inceptionInputRef = useRef<HTMLInputElement | null>(null);

  const [endorsementView, setEndorsementView] = useState<"history" | "upload" | "uploaded" | "loading" | "success">("history");
  const [endorsementFile, setEndorsementFile] = useState("");
  const [endorsementFileObj, setEndorsementFileObj] = useState<File | null>(null);
  const [endorsementDragging, setEndorsementDragging] = useState(false);
  const [endorsementDone, setEndorsementDone] = useState(false);
  const [enrollmentUploadRows, setEnrollmentUploadRows] = useState<any[]>([]);
  const [enrollmentSummary, setEnrollmentSummary] = useState<{ successCount: number; errorCount: number; totalCount: number } | null>(null);
  const [policyInceptionId, setPolicyInceptionId] = useState<number | null>(null);
  const [isEndorsementUploading, setIsEndorsementUploading] = useState(false);
  const [endorsementUploadError, setEndorsementUploadError] = useState("");
  const [endorsementRefreshToken, setEndorsementRefreshToken] = useState(0);
  const [endorsementUploadDataMap, setEndorsementUploadDataMap] = useState<Record<number, any[]>>({});
  const [endorsementSummaryMap, setEndorsementSummaryMap] = useState<Record<number, any>>({});
  const [endorsementDocsMap, setEndorsementDocsMap] = useState<Record<number, any[]>>({});
  const [endorsementDocsLoading, setEndorsementDocsLoading] = useState<Record<number, boolean>>({});
  const [endorsementStepsMap, setEndorsementStepsMap] = useState<Record<number, any>>({});
  const [endorsementStepsLoadingMap, setEndorsementStepsLoadingMap] = useState<Record<number, boolean>>({});
  const [inceptionStepsSummary, setInceptionStepsSummary] = useState<{ notStartedCount: number; inProgressCount: number; notLoggedInCount: number; employeeCompletedCount: number; completedCount: number; totalEmployees: number; totalDependents: number; totalLives: number; enrolledLives: number; enrolledPremium: number } | null>(null);
  const [inceptionFileStatusPage, setInceptionFileStatusPage] = useState(0);
  const [endorsementFileStatusPages, setEndorsementFileStatusPages] = useState<Record<number, number>>({});
  const FILE_STATUS_PAGE_SIZE = 10;
  const [fsColWidths, setFsColWidths] = useState<number[]>(FILE_COL_WIDTHS_DEFAULT);
  const endorsementInputRef = useRef<HTMLInputElement | null>(null);

  // ── Inception form fields ──────────────────────────────────────────────────
  const [inceptionOsTicket, setInceptionOsTicket] = useState('');
  const [inceptionReceivedDate, setInceptionReceivedDate] = useState('');
  const [inceptionNoOfEmployees, setInceptionNoOfEmployees] = useState('');
  const [inceptionNoOfDependents, setInceptionNoOfDependents] = useState('');
  const [inceptionDocType, setInceptionDocType] = useState<'with_dependents' | 'employee_only'>('with_dependents');
  const [inceptionEnrollmentStartDate, setInceptionEnrollmentStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [inceptionEnrollmentEndDate, setInceptionEnrollmentEndDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 15); return d.toISOString().split('T')[0]; });

  // ── Endorsement form fields ────────────────────────────────────────────────
  const [endorsementOsTicket, setEndorsementOsTicket] = useState('');
  const [endorsementReceivedDate, setEndorsementReceivedDate] = useState('');
  const [endorsementFormType, setEndorsementFormType] = useState('');
  const [endorsementNoOfEmployees, setEndorsementNoOfEmployees] = useState('');
  const [endorsementNoOfDependents, setEndorsementNoOfDependents] = useState('');
  const [endorsementDocType, setEndorsementDocType] = useState<'with_dependents' | 'employee_only'>('with_dependents');
  const [endorsementEnrollmentStartDate, setEndorsementEnrollmentStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endorsementEnrollmentEndDate, setEndorsementEnrollmentEndDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 15); return d.toISOString().split('T')[0]; });
  const claimHistoryRef = useRef<HTMLDivElement | null>(null);
  const tabContentRef = useRef<HTMLDivElement | null>(null);
  const enrollHistoryHeaderRef = useRef<HTMLDivElement | null>(null);
  const [enrollHistorySticky, setEnrollHistorySticky] = useState(false);
  const tableAtTopRef = useRef(false);
  const tableAtTopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [tatStripMode, setTatStripMode] = useState(false);
  const [icrHoveredBar, setIcrHoveredBar] = useState<"claims" | "premium" | null>(null);

  const [inceptionExpanded, setInceptionExpanded] = useState(0);
  const [endorsementExpanded, setEndorsementExpanded] = useState(-1);
  const [enrollmentCardExpanded, setEnrollmentCardExpanded] = useState(0);
  const [endorsementFilter, setEndorsementFilter] = useState<"all" | "addition" | "deletion" | "correction" | "errors">("all");
  const [endorsementPage, setEndorsementPage] = useState(0);
  const [policyDashboardData, setPolicyDashboardData] = useState<{ employeeAndDependents: { employeeCount: number; dependentsCount: number; totalLives: number }; enrollmentStatus: { inProgressCount: number; notStartedCount: number } } | null>(null);
  const [policyDashboardLoading, setPolicyDashboardLoading] = useState(false);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const claimFilterBarRef = useRef<HTMLDivElement | null>(null);
  const cdTxnScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [claimFilterBarHeight, setClaimFilterBarHeight] = useState(0);
  const [cdTxnScrolled, setCdTxnScrolled] = useState(false);
  const [cdTxnPage, setCdTxnPage] = useState(1);
  const cdTxnPageSize = 8;
  const [comingSoonModal, setComingSoonModal] = useState<{ open: boolean; title: string; subHeading: string; message: string }>({ open: false, title: "", subHeading: "", message: "" });

  // Redirect if policyId is not a valid number
  useEffect(() => {
    if (policyIdParam !== undefined && !isValidId) {
      navigate("/hr-portal", { replace: true });
    }
  }, [policyIdParam, isValidId, navigate]);

  // Track claim filter bar height so sticky <th> can sit just below it
  useEffect(() => {
    const el = claimFilterBarRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setClaimFilterBarHeight(el.offsetHeight));
    ro.observe(el);
    setClaimFilterBarHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // Reset filter state when navigating to a different policy
  useEffect(() => {
    setActiveTab((routerState?.tab as TabId) ?? "cd");
    setClaimsSection("analytics");
    setClaimStatus("");
    setClaimTypeFilter("");
    setClaimDateFromFilter(""); setClaimDateToFilter("");
    setClaimNoFilter(""); setClaimSearchFilter(""); setEmployeeIdFilter("");
    setSettlementDateFromFilter(""); setSettlementDateToFilter("");
    setAmountMinFilter(""); setAmountMaxFilter(""); setTatFilter("");
    setSearch("");
    setDebouncedSearch("");
    setPage(0);
    setIsInceptionCompletedFromApi(false);
    setInceptionView("upload");
    setEnrollmentUploadRows([]);
    setEnrollmentSummary(null);
    setPolicyInceptionId(null);
    setInceptionStepsSummary(null);
    setInceptionFileStatusPage(0);
    setEndorsementFileStatusPages({});
    setEndorsementUploadDataMap({});
    setEndorsementSummaryMap({});
    setEnrollmentCardExpanded(-1);
    setInceptionOsTicket('');
    setInceptionReceivedDate('');
    setInceptionNoOfEmployees('');
    setInceptionNoOfDependents('');
    setInceptionDocType('with_dependents');
    setInceptionEnrollmentStartDate(new Date().toISOString().split('T')[0]);
    setInceptionEnrollmentEndDate(() => { const d = new Date(); d.setDate(d.getDate() + 15); return d.toISOString().split('T')[0]; });
    setEndorsementOsTicket('');
    setEndorsementReceivedDate('');
    setEndorsementFormType('');
    setEndorsementNoOfEmployees('');
    setEndorsementNoOfDependents('');
    setEndorsementDocType('with_dependents');
    setEndorsementEnrollmentStartDate(new Date().toISOString().split('T')[0]);
    setEndorsementEnrollmentEndDate(() => { const d = new Date(); d.setDate(d.getDate() + 15); return d.toISOString().split('T')[0]; });
  }, [numericPolicyId]);

  useEffect(() => {
    if (activeTab !== "enrollment") return;
    if (!companyId || !isValidId) {
      setEndorsementOverview(null);
      setEndorsementMetrics(null);
      setEndorsementList([]);
      setPolicyPremiumDetails(null);
      setEndorsementSummaryMap({});
      setEndorsementLoading(false);
      return;
    }

    let cancelled = false;
    const body = { companyId, policyId: numericPolicyId, locationIds };
    setEndorsementLoading(true);
    setPolicyDashboardLoading(true);

    const load = async () => {
      try {
        // Step 1: fetch HR reports + policy details + policy dashboard in parallel
        const [overviewRes, metricsRes, listRes, policyRes, dashRes] = await Promise.all([
          apiRequest(`${endPoints.generateHRReports}endorsement_overview`, {
            method: "POST",
            data: body,
          }),
          apiRequest(`${endPoints.generateHRReports}endorsement_employee_metrics`, {
            method: "POST",
            data: body,
          }),
          apiRequest(`${endPoints.generateHRReports}endorsement_list?limit=0`, {
            method: "POST",
            data: body,
          }),
          apiRequest(endPoints.getBasicDetailsByPolicyId(numericPolicyId), { method: "GET" })
            .catch(() => null),
          apiRequest(endPoints.policyDashboard(numericPolicyId), { method: "GET" })
            .catch(() => null),
        ]);

        if (cancelled) return;
        setPolicyDashboardLoading(false);
        if (dashRes?.data) {
          const d = dashRes.data;
          setPolicyDashboardData({
            employeeAndDependents: {
              employeeCount: Number(d.employeeAndDependents?.employeeCount ?? 0),
              dependentsCount: Number(d.employeeAndDependents?.dependentsCount ?? 0),
              totalLives: Number(d.employeeAndDependents?.totalLives ?? 0),
            },
            enrollmentStatus: {
              inProgressCount: Number(d.enrollmentStatus?.inProgressCount ?? 0),
              notStartedCount: Number(d.enrollmentStatus?.notStartedCount ?? 0),
            },
          });
        }
        setEndorsementOverview(overviewRes?.data?.data?.[0] ?? null);
        setEndorsementMetrics(metricsRes?.data?.data?.[0] ?? null);
        setEndorsementList((listRes?.data?.data ?? []) as EndorsementReportRow[]);

        const policyData = policyRes?.data;
        const inceptionId: number | null = policyData?.inceptionId ?? null;
        const isInceptionCompleted: boolean = policyData?.isInceptionCompleted ?? false;
        if (inceptionId) setPolicyInceptionId(inceptionId);

        const bd = policyData?.basicDetails;
        if (bd) {
          const gross = Number(bd.grossPremium ?? 0);
          const tax   = Number(bd.gstAmount ?? 0);
          const base  = Number(bd.premiumAtInception ?? (gross > 0 && tax > 0 ? gross - tax : gross / 1.18));
          if (gross > 0 || tax > 0 || base > 0) {
            setPolicyPremiumDetails({ basePremium: base, taxAmount: tax, grossPremium: gross });
          }
        }

        if (isInceptionCompleted) {
          setIsInceptionCompletedFromApi(true);
          // Still fetch steps + enrollment for summary data even when completed
        }

        // Step 2: if inceptionId, fetch endorsement stats (ibp-service) + enrollment upload summary
        if (inceptionId) {
          const [statsRes, enrollRes] = await Promise.all([
            apiRequest(
              endPoints.hrEndorsementStats(numericPolicyId, inceptionId, locationIds),
              { method: "GET" },
            ).catch(() => null),
            // Was employeeBatchData — policy-service's policy-WIDE (not endorsement-scoped)
            // enrollment-upload-summary, which returned every batch ever uploaded for this
            // policy across every endorsement/period, not just this inception. Switched to
            // the same ibp-service, endorsement-scoped endpoint the Endorsement cards already
            // use (hrEnrollmentUploadSummaryByEndorsement → hr.repository.ts
            // getEnrollmentUploadSummaryByEndorsement), passing inceptionId — same shape,
            // same unwrapping below, just correctly scoped now.
            apiRequest(
              `${endPoints.hrEnrollmentUploadSummaryByEndorsement(numericPolicyId, inceptionId)}?page=1&limit=1000`,
              { method: "GET" },
            ).catch(() => null),
          ]);

          if (cancelled) return;

          const stepsSummary = statsRes?.data ?? null;
          if (stepsSummary) {
            setInceptionStepsSummary({
              notStartedCount: Number(stepsSummary.notStartedCount ?? 0),
              inProgressCount: Number(stepsSummary.inProgressCount ?? 0),
              notLoggedInCount: Number(stepsSummary.notLoggedInCount ?? 0),
              employeeCompletedCount: Number(stepsSummary.employeeCompletedCount ?? 0),
              // Lives-level completed count (employees + their dependents who've
              // also finished enrolment) — the API already computes this
              // (hr.repository.ts getEndorsementStats: completedCount =
              // employee completedCount + dependentCompletedCount), it was just
              // being dropped here. Powers the "Enrolled" pill headline, which
              // otherwise showed employees-only and couldn't be reconciled
              // against "Total Lives" below it when there's no other endorsement.
              completedCount: Number(stepsSummary.completedCount ?? stepsSummary.employeeCompletedCount ?? 0),
              totalEmployees: Number(stepsSummary.totalEmployees ?? 0),
              totalDependents: Number(stepsSummary.totalDependents ?? 0),
              totalLives: Number(stepsSummary.totalLives ?? 0),
              enrolledLives: Number(stepsSummary.enrolledLives ?? 0),
              enrolledPremium: Number(stepsSummary.enrolledPremium ?? 0),
            });
          }

          // hrEnrollmentUploadSummaryByEndorsement response (via apiRequest which returns
          // response.data): { data: { data: [...rows], count: N, summary } } — same
          // createResponse(status, message, data) envelope the Endorsement cards' fetch
          // above already unwraps the same way.
          const enrollOuter = enrollRes?.data;           // { data: [...], count: N }
          const rows: any[] = enrollOuter?.data ?? enrollOuter?.rows ?? (Array.isArray(enrollRes) ? enrollRes : []);
          const totalCount: number = enrollOuter?.count ?? rows.length;
          // Compute aggregate totals from rows (summaryRow may be unreliable)
          const successCount: number = rows.reduce((s: number, r: any) => s + Number(r?.successCount ?? 0), 0);
          const errorCount: number = rows.reduce((s: number, r: any) => s + Number(r?.errorCount ?? 0), 0);

          setEnrollmentUploadRows(rows);
          setEnrollmentSummary({
            successCount,
            errorCount,
            totalCount,
          });

          // Don't use row processing-status to drive view state when fetching all batches —
          // a newer endorsement upload being processed would wrongly flip completed → in_progress.
          // in_progress is only set by inceptionRefreshing (triggered by HR upload submit).
          if (!isInceptionCompleted && (successCount > 0 || totalCount > 0)) {
            setIsInceptionCompletedFromApi(true);
          }
        }
      } catch {
        // silently fail — UI shows "—" for missing data
      } finally {
        if (!cancelled) {
          setTimeout(() => {
            if (!cancelled) {
              setEndorsementLoading(false);
              setInceptionRefreshing(false);
            }
          }, 1000);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [activeTab, companyId, isValidId, numericPolicyId, endorsementRefreshToken, locationIds]);

  // Sync API data → inception view state.
  // SS2 (completed): INCEPTION-type record in endorsementList (cron finished) OR
  //                  isInceptionCompleted from policy-service (iWork inception done) OR
  //                  any endorsement records exist, ever — checked via endorsementOverview's
  //                  totalEndorsements, NOT endorsementList. endorsementList is now scoped to
  //                  only the currently-open enrollment drive (see endorsement_list report fix),
  //                  so an established policy with no drive open RIGHT NOW would otherwise show
  //                  an empty endorsementList and get wrongly bounced back to "Inception
  //                  Required" here, even though inception completed long ago.
  //                  endorsementOverview (endorsement_overview report) stays lifetime-scoped on
  //                  purpose, so totalEndorsements > 0 remains a reliable "ever happened" signal.
  // SS3 (in_progress): only after HR portal uploads a file and cron is processing it
  //                    (inceptionRefreshing flag set by the upload submit handler)
  // SS1 (upload): default — show upload form so HR admin can submit inception data
  useEffect(() => {
    const hasInception = endorsementList.some(
      (e) => String(e.endorsementType ?? "").toUpperCase() === "INCEPTION",
    );
    const hasAnyEndorsementEver = Number(endorsementOverview?.totalEndorsements ?? 0) > 0;
    if (hasInception || isInceptionCompletedFromApi || endorsementList.length > 0 || hasAnyEndorsementEver) {
      setInceptionView("completed");
    } else if (inceptionRefreshing) {
      setInceptionView("in_progress");
    }
    // Otherwise leave as "upload" (SS1) — iWork inception in-progress does not affect HR portal
  }, [endorsementList, isInceptionCompletedFromApi, endorsementOverview]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync API data → endorsementDone (true when there are actual endorsement records, not just inception)
  useEffect(() => {
    const hasDone = endorsementList.some((e) => {
      const typeUpper = String(e.endorsementType ?? "").toUpperCase();
      const isInception = typeUpper === "INCEPTION" ||
        (policyInceptionId !== null && Number(e.endorsementId) === policyInceptionId);
      return !isInception;
    });
    if (hasDone) setEndorsementDone(true);
  }, [endorsementList, policyInceptionId]);

  // Endorsement tab only accessible after inception is complete — same as iWork condition.
  // inceptionView === "completed" is set when: INCEPTION record in endorsementList,
  // OR isInceptionCompleted from policy-service, OR enrollment upload summary has processed data.
  const endorsementTabEnabled = inceptionView === "completed";

  // Required Request Details fields must be filled before Choose file / Download template unlock.
  const isInceptionFormValid = !!inceptionOsTicket.trim() && !!inceptionReceivedDate && Number(inceptionNoOfEmployees) > 0;
  const isEndorsementFormValid = !!endorsementOsTicket.trim() && !!endorsementReceivedDate && !!endorsementFormType;

  // inception "loading" → "in_progress" after 2.2s
  useEffect(() => {
    if (inceptionView !== "loading") return;
    const t = setTimeout(() => setInceptionView("in_progress"), 2200);
    return () => clearTimeout(t);
  }, [inceptionView]);

  // inception banner auto-dismiss
  useEffect(() => {
    if (!inceptionBannerVisible) return;
    const t = setTimeout(() => setInceptionBannerVisible(false), 3500);
    return () => clearTimeout(t);
  }, [inceptionBannerVisible]);

  // endorsement "loading" → "success" after 2.2s, then "history" after 2.5s more
  useEffect(() => {
    if (endorsementView !== "loading") return;
    const t1 = setTimeout(() => { setEndorsementDone(true); setEndorsementView("success"); }, 2200);
    return () => clearTimeout(t1);
  }, [endorsementView]);

  useEffect(() => {
    if (endorsementView !== "success") return;
    const t2 = setTimeout(() => { setEndorsementView("history"); setEndorsementFile(""); setEndorsementFileObj(null); }, 2500);
    return () => clearTimeout(t2);
  }, [endorsementView]);

  // Reset to history when leaving enrollment tab so upload screen doesn't persist
  useEffect(() => {
    if (activeTab !== "enrollment" && (endorsementView === "upload" || endorsementView === "uploaded")) {
      setEndorsementView("history");
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps


  // Pre-fetch endorsement stats for all endorsements so status badge is correct before expand
  useEffect(() => {
    if (!isValidId || !endorsementList.length) return;
    // Re-fetch all when locationIds changes so badges reflect the active location filter
    setEndorsementSummaryMap({});
    endorsementList.forEach((e: any) => {
      const eid: number = Number(e.endorsementId);
      if (!eid) return;
      void apiRequest(
        endPoints.hrEndorsementStats(numericPolicyId, eid, locationIds),
        { method: "GET" },
      ).then((res: any) => {
        const summary = res?.data ?? null;
        setEndorsementSummaryMap((prev) => ({ ...prev, [eid]: summary ?? null }));
      }).catch(() => {
        setEndorsementSummaryMap((prev) => ({ ...prev, [eid]: null }));
      });
    });
  }, [endorsementList.length, isValidId, locationIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-expand the endorsement whose badge would read "Enrolment in progress".
  // Wait until step summaries for all non-inception rows have loaded — otherwise
  // the early run would fall through to "first card" and the guard below would
  // freeze that choice. The badge derivation lives in the render: prefer step
  // summary (notStarted>0 || inProgress>0, and not 100% notStarted); fall back
  // to raw endorsementStatus = PROCESSING / IN_PROGRESS.
  useEffect(() => {
    if (!endorsementList.length) return;
    if (enrollmentCardExpanded !== -1) return;
    const nonInception = endorsementList.filter((e) => !isInceptionRecord(e));
    if (nonInception.length === 0) return;
    const allSummariesLoaded = nonInception.every((e) => {
      const eid = Number(e.endorsementId);
      if (!eid) return true;
      return endorsementSummaryMap[eid] !== undefined;
    });
    if (!allSummariesLoaded) return;
    const inProgressIdx = nonInception.findIndex((e) => {
      const eid = Number(e.endorsementId);
      const summary = endorsementSummaryMap[eid];
      const rawStatus = String(e.endorsementStatus ?? "").toUpperCase().trim();
      if (rawStatus === "PROCESSED") return false;
      if (summary) {
        const totalEmp = Number(summary.totalEmployees ?? 0);
        const notSt = Number(summary.notStartedCount ?? 0);
        const inPr  = Number(summary.inProgressCount ?? 0);
        if (totalEmp === 0 || notSt === totalEmp) return false;
        return notSt > 0 || inPr > 0;
      }
      return rawStatus === "PROCESSING" || rawStatus === "IN_PROGRESS";
    });
    const targetIdx = inProgressIdx >= 0 ? inProgressIdx : 0;
    setEnrollmentCardExpanded(targetIdx);
  }, [endorsementList.length, endorsementSummaryMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch per-card upload data + endorsement steps summary when a card is expanded
  useEffect(() => {
    if (enrollmentCardExpanded === -1 || !isValidId) return;
    const mergedList = [
      ...endorsementHistory.map((i) => ({ ...i, cardType: "endorsement" as const })),
      ...inceptionHistory.map((i) => ({ ...i, cardType: "inception" as const })),
    ];
    const item = mergedList[enrollmentCardExpanded] as any;
    if (!item) return;
    const eid: number = item.rawEndorsementId;
    if (!eid) return;
    // Upload data
    if (endorsementUploadDataMap[eid] === undefined) {
      void apiRequest(
        `${endPoints.hrEnrollmentUploadSummaryByEndorsement(numericPolicyId, eid)}?page=1&limit=1000`,
        { method: "GET" },
      ).then((res: any) => {
        const outer = res?.data;
        const rows: any[] = outer?.data ?? outer?.rows ?? (Array.isArray(res) ? res : []);
        setEndorsementUploadDataMap((prev) => ({ ...prev, [eid]: rows }));
      }).catch(() => {
        setEndorsementUploadDataMap((prev) => ({ ...prev, [eid]: [] }));
      });
    }
    // Endorsement stats — fetch from ibp-service (no policy-service dependency)
    if (endorsementSummaryMap[eid] === undefined) {
      void apiRequest(
        endPoints.hrEndorsementStats(numericPolicyId, eid, locationIds),
        { method: "GET" },
      ).then((res: any) => {
        setEndorsementSummaryMap((prev) => ({ ...prev, [eid]: res?.data ?? null }));
      }).catch(() => {
        setEndorsementSummaryMap((prev) => ({ ...prev, [eid]: null }));
      });
    }
  }, [enrollmentCardExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch policy documents + endorsement steps when an endorsement card is expanded
  useEffect(() => {
    if (enrollmentCardExpanded === -1 || !numericPolicyId) return;
    const item = (mergedEnrollmentHistory as any[])[enrollmentCardExpanded];
    if (!item || item.cardType !== "endorsement") return;
    const eid: number = Number(item.rawEndorsementId);

    // Policy documents (cached per policy)
    if (endorsementDocsMap[numericPolicyId] === undefined) {
      setEndorsementDocsLoading((prev) => ({ ...prev, [numericPolicyId]: true }));
      apiRequest(`${endPoints.policyDocs(numericPolicyId)}?page=1&limit=100`, { method: "GET" })
        .then((res: any) => {
          setEndorsementDocsMap((prev) => ({ ...prev, [numericPolicyId]: res?.data?.data ?? [] }));
        })
        .catch(() => {
          setEndorsementDocsMap((prev) => ({ ...prev, [numericPolicyId]: [] }));
        })
        .finally(() => {
          setEndorsementDocsLoading((prev) => ({ ...prev, [numericPolicyId]: false }));
        });
    }

    // Endorsement steps (cached per endorsement id)
    if (eid && endorsementStepsMap[eid] === undefined) {
      setEndorsementStepsLoadingMap((prev) => ({ ...prev, [eid]: true }));
      apiRequest(endPoints.endorsementStepsByEndorsementId(numericPolicyId, eid), { method: "GET" })
        .then((res: any) => {
          setEndorsementStepsMap((prev) => ({ ...prev, [eid]: res?.data?.data ?? null }));
        })
        .catch(() => {
          setEndorsementStepsMap((prev) => ({ ...prev, [eid]: null }));
        })
        .finally(() => {
          setEndorsementStepsLoadingMap((prev) => ({ ...prev, [eid]: false }));
        });
    }
  }, [enrollmentCardExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll tab content to top on tab switch
  // HRPageContent (overflowY:auto, position:absolute) is the real scroll container —
  // not tabContentRef nor window. Walk up the DOM to find and reset it.
    useEffect(() => {
  // Try tabContentRef first
  const el = tabContentRef.current;
  if (el) {
    setTimeout(() => {
      el.scrollTop = 0;
    }, 0);
  }

  // Also walk UP the DOM from tabContentRef to find the real scrolling parent
  setTimeout(() => {
    let parent = tabContentRef.current?.parentElement;
    while (parent) {
      const { overflowY } = window.getComputedStyle(parent);
      if ((overflowY === "auto" || overflowY === "scroll") && parent.scrollTop > 0) {
        parent.scrollTop = 0;
        break;
      }
      parent = parent.parentElement;
    }
    window.scrollTo(0, 0);
  }, 0);

}, [activeTab]);

  // Sticky enrollment history bar — scroll listener on the tab scroll container
  useEffect(() => {
    if (activeTab !== "enrollment" || endorsementView !== "history") {
      setEnrollHistorySticky(false);
      return;
    }
    const container = tabContentRef.current;
    if (!container) return;
    const check = () => {
      const el = enrollHistoryHeaderRef.current;
      if (!el) { setEnrollHistorySticky(false); return; }
      const containerTop = container.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      setEnrollHistorySticky(elTop < containerTop);
    };
    container.addEventListener("scroll", check, { passive: true });
    check(); // run once on mount in case already scrolled
    return () => container.removeEventListener("scroll", check);
  }, [activeTab, endorsementView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Download via IBP service (same pattern as iWork EmployeeBatch handleDownload)
  const handleFileDownload = async (fileId: number | null | undefined, defaultName = "file") => {
    if (!fileId) return;
    try {
      // Use ibpFileUploadDownloadById — IBP service, not org service
      const url = endPoints.ibpFileUploadDownloadById(fileId);
      const response = await apiRequest(url, { method: "GET", responseType: "blob" });
      const blob = response.data as Blob;
      if (blob.type.includes("text/html")) {
        const text = await blob.text();
        if (text.includes("<html")) return;
      }
      let filename = defaultName;
      const cd = response.headers?.["content-disposition"] || response.headers?.get?.("content-disposition");
      if (cd) { const m = cd.match(/filename="?([^"]+)"?/); if (m?.[1]) filename = m[1]; }
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(objectUrl);
    } catch (err) { console.error("File download error:", err); }
  };

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 300);
  }, []);

  // CD Balance — always active; also supplies header info if policyRow is absent
  const {
    data: cdData,
    isLoading: cdLoading,
    isError: cdError,
    refetch: cdRefetch,
  } = useHRReport<PolicyCdSummaryRow>(
    "policy_cd_summary",
    { companyId: _policyCardsCompanyId, policyId: numericPolicyId },
    isValidId && !!_policyCardsCompanyId
  );
  const _cdRaw = cdData[0] ?? null;
  const cdSummary = _cdRaw
    ? {
        ..._cdRaw,
        netPremium: Number(_cdRaw.netPremium),
        cdBalance: Number(_cdRaw.cdBalance),
        cdUsedAmount: Number(_cdRaw.cdUsedAmount ?? _cdRaw.usedAmount),
        cdRunningBalance: Number(_cdRaw.cdRunningBalance ?? _cdRaw.cdBalance),
        safeLimit: Number(_cdRaw.safeLimit),
        usedPercent: Number(_cdRaw.usedPercent),
        usedAmount: Number(_cdRaw.usedAmount),
      }
    : null;

  // CD Transactions — lazy; only fetches while CD tab is active.
  // limit=0 bypasses the backend's default LIMIT so all company transactions
  // are returned and client-side pagination shows the correct total pages.
  const {
    data: cdTxnData,
    total: cdTxnTotal,
    isLoading: cdTxnLoading,
    isError: cdTxnError,
    refetch: cdTxnRefetch,
  } = useHRReport<CdTransactionRow>(
    "cd_transactions",
    { companyId: _policyCardsCompanyId, policyId: numericPolicyId, txnType: "", startDate: "", endDate: "", search: "" },
    isValidId && !!_policyCardsCompanyId && activeTab === "cd",
    { limit: 0 }
  );

  // Claim History — lazy; only fetches while the tab is active
  const {
    data: claimData,
    total: claimTotal,
    isLoading: claimLoading,
    isFetching: claimFetching,
    isError: claimError,
    refetch: claimRefetch,
  } = useHRReport<ClaimHistoryRow>(
    "policy_claim_history",
    {
      policyId: numericPolicyId,
      employeeId: "",
      // Sent as-is ("Approved"/"Rejected"/"Pending"/"Settled"/"") — the real
      // claim_status column holds many more distinct strings than these 4
      // buckets (e.g. "Ready for payment", "Payment Initiated", "Under
      // Rejection Approval"), so bucketing now happens server-side via
      // ILIKE keyword matching in policy_claim_history's SQL, not here.
      // See database-migrations/sql/claim-status-bucket-fix.sql.
      claimStatus,
      claimType: claimTypeFilter,
      claimDateFrom: claimDateFromFilter,
      claimDateTo: claimDateToFilter,
      claimNo: claimNoFilter,
      settlementDateFrom: settlementDateFromFilter,
      settlementDateTo: settlementDateToFilter,
      amountMin: amountMinFilter,
      amountMax: amountMaxFilter,
      tat: tatFilter,
      search: debouncedSearch || claimSearchFilter,
      locationIds,
    },
    isValidId && !!companyId && activeTab === "claims" && hasRunFilter,
    { limit: PAGE_SIZE, page: page + 1 }
  );

  const {
    data: claimAnalyticsData,
    isLoading: claimAnalyticsLoading,
    isFetching: claimAnalyticsFetching,
    isError: claimAnalyticsError,
    refetch: claimAnalyticsRefetch,
  } = useHRReport<ClaimHistoryRow>(
    "policy_claim_history",
    {
      policyId: numericPolicyId,
      employeeId: "",
      claimStatus: "",
      claimType: "",
      claimDateFrom: "",
      claimDateTo: "",
      claimNo: "",
      employeeSearch: "",
      patientName: "",
      hospital: "",
      settlementDateFrom: "",
      settlementDateTo: "",
      amountMin: "",
      amountMax: "",
      tat: "",
      search: "",
      locationIds,
    },
    isValidId && !!companyId && activeTab === "claims" && claimsSection === "analytics",
    { limit: 0, page: 1 }
  );

  // Skeleton — stays visible for at least 1 s after loading starts to avoid flash/glitch.
  // Uses isFetching (not isLoading) so the skeleton shows even when placeholderData
  // returns stale rows while a new filter/location fetch is in flight.
  const [showClaimSkeleton, setShowClaimSkeleton] = useState(false);
  const claimSkeletonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (claimFetching) {
      if (claimSkeletonTimerRef.current) clearTimeout(claimSkeletonTimerRef.current);
      setShowClaimSkeleton(true);
    } else {
      claimSkeletonTimerRef.current = setTimeout(() => setShowClaimSkeleton(false), 1000);
    }
    return () => {
      if (claimSkeletonTimerRef.current) clearTimeout(claimSkeletonTimerRef.current);
    };
  }, [claimFetching]); // eslint-disable-line react-hooks/exhaustive-deps

  // const cdAvailPct = 100 - p.usedPct;
  // const cdIsBelow = cdAvailPct < p.safeMarkerPct;
  // // Prediction: 2-month elapsed period → monthly burn rate
  // const cdAvailableNum  = parseFloat(p.available.replace(/[₹L,]/g, ""));
  // const cdSafeLimitNum  = parseFloat(p.safeLimit.replace(/[₹L,]/g, ""));
  // const cdUsedNum       = parseFloat(p.usedAmount.replace(/[₹L,]/g, ""));
  // const cdMonthlyBurn   = Math.round(cdUsedNum / 2 * 10) / 10;           // ₹L/month
  // const cdDaysRemaining = Math.round((cdAvailableNum / cdMonthlyBurn) * 30);
  // const cdMonthsSafe    = !cdIsBelow ? Math.floor((cdAvailableNum - cdSafeLimitNum) / cdMonthlyBurn) : 0;
  // const cdTopupNeeded   = Math.round((cdSafeLimitNum - cdAvailableNum) * 10) / 10;
  // // Adjusted forecast factoring in claim trend (delta good = slower burn)
  // const cdAdjustedDays  = Math.round(cdDaysRemaining * (p.claimDeltaGood ? 1.08 : 0.94));

  // Enrollment — lazy; only fetches while the tab is active
  const {
    data: enrollmentData,
    isLoading: enrollmentLoading,
    isFetching: enrollmentFetching,
    isError: enrollmentError,
    refetch: enrollmentRefetch,
  } = useHRReport<PolicyEnrollmentSummaryRow>(
    "policy_enrollment_summary",
    { policyId: numericPolicyId, companyId: companyId ?? 0 },
    // Also fetch on the main Enrolment tab now — its "Enrolment Status" card
    // (Card 2 below) reads this instead of dashboard_policy_cards, since this
    // report is already correctly scoped to the current enrollment drive and
    // uses the real employee_enrollment_status_key, not dashboard_policy_cards'
    // login-activity-based proxy.
    isValidId && !!companyId && ((activeTab === "claims" && claimsSection === "enrollment") || activeTab === "enrollment")
  );

  const {
    data: claimsMonthlyData,
    isLoading: claimsMonthlyLoading,
    isFetching: claimsMonthlyFetching,
    isError: claimsMonthlyError,
  } = useHRReport<ClaimsMonthRow>(
    "dashboard_claims_monthly_trend",
    { policyId: numericPolicyId, locationIds },
    isValidId && !!companyId && activeTab === "claims" && claimsSection === "analytics"
  );

  const {
    data: topHospitalsData,
    isLoading: topHospitalsLoading,
    isFetching: topHospitalsFetching,
    isError: topHospitalsError,
  } = useHRReport<Top10HospitalRow>(
    "dashboard_top10_hospitals",
    { policyId: numericPolicyId, locationIds },
    isValidId && !!companyId && activeTab === "claims" && claimsSection === "analytics",
    { sort: "totalClaims:DESC" }
  );

  const {
    data: topDiseasesData,
    isLoading: topDiseasesLoading,
    isFetching: topDiseasesFetching,
    isError: topDiseasesError,
  } = useHRReport<Top10DiseaseRow>(
    "dashboard_top10_diseases",
    { policyId: numericPolicyId, locationIds },
    isValidId && !!companyId && activeTab === "claims" && claimsSection === "analytics"
  );

  // Linked policies — fetches all policies sharing the same CD account as this policy
  const {
    data: linkedPoliciesRaw,
    isLoading: linkedPoliciesLoading,
  } = useHRReport<LinkedPolicyRow>(
    "linked_policies_of_cd_account",
    { policyId: numericPolicyId, companyId: companyId ?? 0 },
    isValidId && !!companyId && activeTab === "cd"
  );

  // Upcoming installments — real data from policy_installments for this policy only
  const {
    data: upcomingInstallments,
    isLoading: upcomingInstallmentsLoading,
  } = useHRReport<UpcomingInstallmentRow>(
    "upcoming_installments",
    { policyId: numericPolicyId, companyId: companyId ?? 0 },
    isValidId && !!companyId && activeTab === "cd"
  );

  // Non-Life Assets — lazy; only fetches while Assets tab is active on non-life policies
  const {
    data: nonLifeAssetKpiData,
    isLoading: nonLifeAssetKpiLoading,
    isError: nonLifeAssetKpiError,
    refetch: nonLifeAssetKpiRefetch,
  } = useHRReport<NonLifeAssetKpiRow>(
    "non_life_asset_kpi",
    { policyId: numericPolicyId, companyId: companyId ?? 0 },
    isValidId && !!companyId && activeTab === "enrollment" && isNonLife
  );

  const {
    data: nonLifeAssetListData,
    isLoading: nonLifeAssetListLoading,
    isError: nonLifeAssetListError,
  } = useHRReport<NonLifeAssetRow>(
    "non_life_asset_list",
    { policyId: numericPolicyId },
    isValidId && activeTab === "enrollment" && isNonLife
  );

  const linkedPolicies = linkedPoliciesRaw.map((pol) => ({
    ...pol,
    policyId: Number(pol.policyId),
    netPremium: Number(pol.netPremium),
    totalLives: Number(pol.totalLives),
    policyNumber: pol.policyNumber || `POL-${pol.policyId}`,
  }));

  const analyticsBackendLoading =
    claimAnalyticsFetching ||
    claimsMonthlyFetching ||
    topHospitalsFetching ||
    topDiseasesFetching;
  const analyticsBackendError =
    claimAnalyticsError ||
    claimsMonthlyError ||
    topHospitalsError ||
    topDiseasesError;
  const _enrollRaw = enrollmentData[0] ?? null;
  const enrollSummary = _enrollRaw
    ? {
        ..._enrollRaw,
        totalEmployees: Number(_enrollRaw.totalEmployees),
        totalDependents: Number(_enrollRaw.totalDependents),
        enrolledCount: Number(_enrollRaw.enrolledCount),
        inProgressCount: Number(_enrollRaw.inProgressCount),
        notStartedCount: Number(_enrollRaw.notStartedCount),
        notEnrolledCount: Number(_enrollRaw.notEnrolledCount),
        notLoggedInCount: Number(_enrollRaw.notLoggedInCount ?? 0),
        loggedInCount: Number(_enrollRaw.loggedInCount ?? 0),
        enrolledPercent: Number(_enrollRaw.enrolledPercent),
        inProgressPercent: Number(_enrollRaw.inProgressPercent),
        notStartedPercent: Number(_enrollRaw.notStartedPercent),
        notLoggedInPercent: Number(_enrollRaw.notLoggedInPercent ?? 0),
      }
    : null;

  // ─── Derived display values ────────────────────────────────────────────────

  const policyName = policyRow?.policyName ?? cdSummary?.policyName ?? "";
  const { icon: policyIcon, iconBg: policyIconBg } = getPolicyIconInfo(policyName);
  const insurer = policyRow?.insurer ?? cdSummary?.insurer ?? "—";
  const periodEndStr = policyRow?.periodEnd ?? cdSummary?.periodEnd ?? "";
  const renewalLabel = toPeriodLabel(periodEndStr);
  const livesDisplay = (cdSummary?.totalLives ?? policyRow?.totalLives)
    ? formatNumberByLocalization((cdSummary?.totalLives ?? policyRow?.totalLives)!, localizationData?.data)
    : "—";

  // cdRunningBalance (derived from the latest caution_deposit_transaction row —
  // the same source the Transactions table's own "Running Balance" column
  // uses) is preferred over cdBalance (a denormalized balance_amount column
  // stored on the CD account itself). cdBalance is only correct if that
  // column was updated in lockstep with every transaction — in practice it
  // can drift stale (confirmed: a policy showed Available Balance matching
  // an older transaction's balance while a newer deposit had already
  // posted). cdRunningBalance's own SQL already falls back to cdBalance if
  // there's no transaction history yet, so this ordering loses nothing.
  const cdAvailableAmount = cdSummary
    ? Number(cdSummary.cdRunningBalance ?? cdSummary.cdBalance ?? 0)
    : 0;
  const _cdNetPremium   = cdSummary?.netPremium ?? 0;
  const _cdTotalLives   = cdSummary?.totalLives ?? policyRow?.totalLives ?? 0;
  const _perLifePremium = _cdTotalLives > 0 ? _cdNetPremium / _cdTotalLives : 0;
  const _cdSafeLimit    = cdSummary?.safeLimit != null ? Number(cdSummary.safeLimit) : (_cdTotalLives * 0.1) * _perLifePremium;
  const _cdWarnLimit    = _cdSafeLimit * 2;
  const cdColor =
    cdAvailableAmount < _cdSafeLimit ? "#EF4444"
    : cdAvailableAmount < _cdWarnLimit ? "#F59E0B"
    : "#10B981";
  const cdUsedPct = _cdNetPremium > 0
    ? Math.max(0, Math.round(((_cdNetPremium - cdAvailableAmount) / _cdNetPremium) * 1000) / 10)
    : 0;
  const cdStatus =
    cdColor === "#EF4444" ? "Critical" : cdColor === "#F59E0B" ? "Warning" : "Healthy";
  const cdSafeLimitDisplay = _cdTotalLives > 0 ? formatINR(_cdSafeLimit, localizationData?.data) : "—";
  const cdInsightText =
    cdColor === "#EF4444"
      ? `Remaining CD (${formatINR(cdAvailableAmount, localizationData?.data)}) is below safe limit of ${cdSafeLimitDisplay}. Add funds to avoid claim delays.`
      : cdColor === "#F59E0B"
      ? `Remaining CD (${formatINR(cdAvailableAmount, localizationData?.data)}) is approaching safe limit of ${cdSafeLimitDisplay}. Top up soon.`
      : `Remaining CD (${formatINR(cdAvailableAmount, localizationData?.data)}) is within safe limit of ${cdSafeLimitDisplay}. No action needed.`;

  // Claim Ratio — derived from policyRow (router state)
  const icrDelta = policyRow?.icrYoYChangePercent ?? null;
  const icrSuppressed = isYoYSuppressed(icrDelta);
  const icrDeltaGood = !icrSuppressed && (icrDelta ?? 0) <= 0;
  const icrForecast = policyRow?.icrForecastPercent ?? policyRow?.icrPercent ?? 0;
  const icrCurrent = policyRow?.icrPercent ?? 0;
  const isRisingICR = icrForecast > icrCurrent;
  const outlookTitle = isRisingICR ? "Premium at risk" : "Premium outlook";
  const outlookBtnColor = isRisingICR ? "#EF4444" : "#10B981";
  const outlookText = isRisingICR
    ? "ICR is rising — renewal premium may increase significantly."
    : "If this continues, renewal premium may remain stable or reduce.";

  // Enrollment derived
  const enrolledPct = enrollSummary?.enrolledPercent ?? 0;
  const enrollColor =
    enrolledPct >= 80 ? "#10B981" : enrolledPct >= 50 ? "#D97706" : "#EF4444";
  const totalEmp = enrollSummary?.totalEmployees ?? 0;
  const enrollBarDomain: [number, number] = [
    0,
    Math.ceil((totalEmp || 100) / 100) * 100,
  ];
  const enrollBarTicks = [
    0,
    Math.round(enrollBarDomain[1] / 4),
    Math.round(enrollBarDomain[1] / 2),
    Math.round((enrollBarDomain[1] * 3) / 4),
    enrollBarDomain[1],
  ];
  const enrollBarData = enrollSummary
    ? [
        { name: "Enroled", value: enrollSummary.enrolledCount, fill: "#22C55E" },
        { name: "In Progress", value: enrollSummary.inProgressCount, fill: "#F59E0B" },
        { name: "Not Started", value: enrollSummary.notLoggedInCount, fill: "#4B5563" },
      ]
    : [];

  // ICR comparison groups for Claim Ratio tab
  const claimGroups = (() => {
    if (!policyRow) return null;
    const BAR_H = 100;
    const netPremL = (policyRow.netPremium ?? 0) / 100000;
    const curClaims = policyRow.icrClaimCount ?? 0;
    const curIncurred = (policyRow.claimAmount ?? 0) / 100000;
    const lySameIncurred = (policyRow.icrSamePeriodLYAmount ?? 0) / 100000;
    const lyFullIcr = policyRow.icrFullYearAvgLY ?? 0;
    const lyFullIncurred = netPremL > 0 ? (lyFullIcr / 100) * netPremL : 0;

    // Use SQL-computed ICR values directly — correct formula, avoids unit-mismatch bugs
    const curYtdIcr = policyRow.icrPercent ?? 0;
    const lyPeriodIcr = policyRow.icrSamePeriodLYPercent ?? 0;

    // Trend-based forecast: scale LY full year ICR by current trend vs LY same period
    const forecastIcr = (() => {
      if (lyPeriodIcr > 0 && lyFullIcr > 0) {
        return lyFullIcr * (curYtdIcr / lyPeriodIcr);
      }
      return policyRow.icrForecastPercent ?? curYtdIcr;
    })();

    // Premium for bar heights: use API earnedPremium if patch was run, else full netPremL
    const earnedPremL = (() => {
      const api = (policyRow.earnedPremium ?? 0) / 100000;
      return api > 0 ? api : netPremL;
    })();
// LY premium: use SQL columns if available; fall back to 0 for fresh policies with no LY data
    const lyNetPremL = policyRow.lyNetPremium ? policyRow.lyNetPremium / 100000 : 0;
    const lySamePeriodPremL = policyRow.lySamePeriodEarnedPremium ? policyRow.lySamePeriodEarnedPremium / 100000 : 0;

    const predictedClaims = curYtdIcr > 0
      ? Math.round(curClaims * (forecastIcr / Math.max(curYtdIcr, 1)))
      : curClaims;
    const predictedIncurred = netPremL > 0 ? (forecastIcr / 100) * netPremL : 0;
    const maxC = Math.max(curClaims, predictedClaims, 1);
    const maxI = Math.max(curIncurred, lySameIncurred, lyFullIncurred, predictedIncurred, 1);
    const lyYear = parseInt((policyRow.periodStart ?? "").split(" ")[2] ?? "0") - 1;
    return {
      BAR_H,
      maxC,
      maxI,
      netPremL,
      earnedPremL,
      groups: [
        {
          key: "lyav",
          period: "LAST YEAR",
          name: "FY Avg",
          claims: 0,
          incurred: lyFullIncurred,
          premium: lyNetPremL,
          incurredStr: lyFullIncurred > 0 ? `~${formatINR(lyFullIncurred * 100000, localizationData?.data)}` : "—",
          icr: lyFullIcr,
          delta: null as number | null,
          showDelta: false,
          deltaGood: false,
          dateRange: `Apr ${lyYear} – Mar ${lyYear + 1}`,
          barClaimsColor: "#34D399",
          barIncurredColor: "#A7F3D0",
          cardBg: "#F0FDF4",
          textColor: "#047857",
        },
        {
          key: "lyt",
          period: "LAST YEAR",
          name: "Same Period LY",
          claims: 0,
          incurred: lySameIncurred,
          premium: lySamePeriodPremL,
          incurredStr: policyRow.icrSamePeriodLYAmount
            ? formatINR(policyRow.icrSamePeriodLYAmount, localizationData?.data)
            : "—",
          icr: lyPeriodIcr,
          delta: null as number | null,
          showDelta: false,
          deltaGood: false,
          dateRange: `${toLYLabel(policyRow.periodStart ?? "")} – ${toLYLabel(policyRow.periodEnd ?? "")}`,
          barClaimsColor: "#FB923C",
          barIncurredColor: "#FDE68A",
          cardBg: "#FFF7ED",
          textColor: "#B45309",
        },
        {
          key: "cur",
          period: "THIS PERIOD",
          name: "Current",
          claims: curClaims,
          incurred: curIncurred,
          premium: earnedPremL,
          incurredStr: formatINR(policyRow.claimAmount ?? 0, localizationData?.data),
          icr: curYtdIcr,
          delta: icrDelta,
          showDelta: !icrSuppressed,
          deltaGood: icrDeltaGood,
          dateRange: `${toPeriodLabel(policyRow.periodStart ?? "")} – ${toPeriodLabel(policyRow.periodEnd ?? "")}`,
          barClaimsColor: "#6B8EF5",
          barIncurredColor: "#BFD0FC",
          cardBg: "#EEF2FF",
          textColor: "#3B5FD8",
        },
        {
          key: "pred",
          period: "NEXT YEAR",
          name: "Predicted",
          claims: predictedClaims,
          incurred: predictedIncurred,
          premium: netPremL,
          incurredStr: formatINR(predictedIncurred * 100000, localizationData?.data),
          icr: forecastIcr,
          delta: null as number | null,
          showDelta: false,
          deltaGood: false,
          dateRange: "Renewal Est.",
          barClaimsColor: "#8B5CF6",
          barIncurredColor: "#DDD6FE",
          cardBg: "#F5F3FF",
          textColor: "#6D28D9",
        },
      ],
    };
  })();

  const claimAnalyticsRows = claimAnalyticsData;

  const claimTatCards = useMemo(() => {
    const rows = claimAnalyticsRows.length > 0 ? claimAnalyticsRows : claimData;
    const today = new Date().toISOString();
    const tatFromRows = (filter: (row: ClaimHistoryRow) => boolean) => {
      const selected = rows.filter(filter);
      if (selected.length === 0) return 0;
      const valid = selected
        .map((row) => safeDateDiffDays(row.claimDate, row.settlementDate ?? today))
        .filter((v): v is number => v !== null);
      if (valid.length === 0) return 0;
      return Math.round(valid.reduce((sum, val) => sum + val, 0) / valid.length);
    };

    return [
      {
        id: "all",
        label: "All",
        count: rows.length,
        avgTat: tatFromRows(() => true),
        accent: "#1C57B8",
        accentBg: "#EBF3FF",
      },
      {
        id: "Ready For Payment",
        label: "Approved",
        count: rows.filter((row) => row.statusBucket === "Approved").length,
        avgTat: tatFromRows((row) => row.statusBucket === "Approved"),
        accent: "#059669",
        accentBg: "#ECFDF5",
      },
      {
        id: "PENDING",
        label: "Pending",
        count: rows.filter((row) => row.statusBucket === "Pending").length,
        avgTat: tatFromRows((row) => row.statusBucket === "Pending"),
        accent: "#D97706",
        accentBg: "#FFFBEB",
      },
      {
        id: "Claim Denied",
        label: "Rejected",
        count: rows.filter((row) => row.statusBucket === "Rejected").length,
        avgTat: tatFromRows((row) => row.statusBucket === "Rejected"),
        accent: "#DC2626",
        accentBg: "#FEF2F2",
      },
      {
        id: "Settled",
        label: "Settled",
        count: rows.filter((row) => row.statusBucket === "Settled").length,
        avgTat: tatFromRows((row) => row.statusBucket === "Settled"),
        accent: "#7C3AED",
        accentBg: "#F5F3FF",
      },
    ];
  }, [claimAnalyticsRows, claimData]);

  const claimTypeDistribution = useMemo(() => {
    const rows = claimAnalyticsRows.length > 0 ? claimAnalyticsRows : claimData;
    const sumAmt = (arr: typeof rows) => arr.reduce((s, r) => {
      const amt = Number(r.approvedAmount) > 0 ? Number(r.approvedAmount) : (Number(r.claimedAmount) || 0);
      return s + amt;
    }, 0);
    const cashless = rows.filter((row) => row.claimType === "Cashless");
    const reimbursement = rows.filter((row) => row.claimType === "Reimbursement");
    const other = rows.filter(
      (row) => row.claimType !== "Cashless" && row.claimType !== "Reimbursement"
    );
    const total = rows.length || 1;
    return [
      { name: "Cashless", value: cashless.length, fill: "#6B8EF5", pct: (cashless.length / total) * 100, approvedAmountTotal: sumAmt(cashless) },
      { name: "Reimbursement", value: reimbursement.length, fill: "#34D399", pct: (reimbursement.length / total) * 100, approvedAmountTotal: sumAmt(reimbursement) },
      { name: "Other", value: other.length, fill: "#FB923C", pct: (other.length / total) * 100, approvedAmountTotal: sumAmt(other) },
    ].filter((item) => item.value > 0 || rows.length === 0);
  }, [claimAnalyticsRows, claimData]);

  const topHospitals = useMemo(() => {
    if (topHospitalsData.length > 0) {
      return [...topHospitalsData]
        .sort((a, b) =>
          hospitalSortBy === "amount" ? b.totalAmount - a.totalAmount : b.totalClaims - a.totalClaims
        )
        .slice(0, 10)
        .map((row) => ({
          name: row.hospitalName,
          claims: row.totalClaims,
          amount: Number((row.totalAmount / 100000).toFixed(1)),
        }));
    }
    return [];
  }, [topHospitalsData, hospitalSortBy]);

  const claimRelationDistribution = useMemo(() => {
    const rows = claimAnalyticsRows.length > 0 ? claimAnalyticsRows : claimData;
    const groups: Record<string, { claims: number; incurred: number; approvedAmountTotal: number }> = {};
    const ORDER = ["Self", "Spouse", "Child", "Parent"];
    rows.forEach((row) => {
      const rel = row.relation ?? "Other";
      if (!groups[rel]) groups[rel] = { claims: 0, incurred: 0, approvedAmountTotal: 0 };
      groups[rel].claims += 1;
      groups[rel].incurred += (Number(row.approvedAmount) || Number(row.claimedAmount) || 0) / 100000;
      groups[rel].approvedAmountTotal += Number(row.approvedAmount) > 0 ? Number(row.approvedAmount) : (Number(row.claimedAmount) || 0);
    });
    const result = Object.entries(groups).map(([name, d]) => ({
      name,
      claims: d.claims,
      incurred: Math.round(d.incurred * 10) / 10,
      approvedAmountTotal: d.approvedAmountTotal,
    }));
    result.sort((a, b) => {
      const oa = ORDER.indexOf(a.name), ob = ORDER.indexOf(b.name);
      if (oa === -1 && ob === -1) return b.claims - a.claims;
      if (oa === -1) return 1;
      if (ob === -1) return -1;
      return oa - ob;
    });
    return result;
  }, [claimAnalyticsRows, claimData]);

  const topDiseases = useMemo(() => {
    if (topDiseasesData.length > 0) {
      const sorted = [...topDiseasesData].sort((a, b) => b.totalClaims - a.totalClaims);
      const max = Math.max(sorted[0]?.totalClaims ?? 1, 1);
      return sorted.map((row) => ({
        name: row.diseaseCategory,
        claims: row.totalClaims,
        pct: Math.round((row.totalClaims / max) * 1000) / 10,
      }));
    }
    return [];
  }, [topDiseasesData]);

  // ─── CSV Export ────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    if (claimData.length === 0) return;
    const headers = [
      "Claim No.",
      "Patient",
      "Relation",
      "Hospital",
      "Claim Date",
      "Type",
      "Claimed",
      "Approved",
      "Settlement Date",
      "Status",
    ];
    const rows = claimData.map((r) => [
      r.claimNumber ?? "",
      r.patientName ?? "",
      r.relation ?? "",
      r.hospital ?? "",
      fmtDate(r.claimDate),
      r.claimType ?? "",
      r.claimedAmount ?? 0,
      r.approvedAmount ?? 0,
      fmtDate(r.settlementDate),
      r.status ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claim-history-${numericPolicyId}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [claimData, numericPolicyId]);

  // ─── Shared loading / error shells ────────────────────────────────────────

  const TabLoader = () => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: 8,
        gap: 1.5,
      }}
    >
      <CircularProgress size={20} sx={{ color: "#2556A6" }} />
      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563" }}>
        Loading data…
      </Typography>
    </Box>
  );

  const TabError = ({ onRetry }: { onRetry: () => void }) => (
    <Box sx={{ py: 6, textAlign: "center" }}>
      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#EF4444", mb: 1.5 }}>
        Unable to load data. Please try again.
      </Typography>
      <Box
        onClick={onRetry}
        sx={{
          display: "inline-block",
          px: 3,
          py: 0.875,
          borderRadius: "8px",
          bgcolor: "#1C57B8",
          color: "#fff",
          fontSize: 15, lineHeight: 1.7,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Retry
      </Box>
    </Box>
  );

  // ─── Derived inception / endorsement data ─────────────────────────────────

  const fmt = (v: unknown) => (v == null || v === "" ? "—" : String(v));

  // Inception record = type is INCEPTION, OR its endorsementId matches the inceptionId
  // from policy-service (covers iWork-migrated policies like Financial_endorsement type)
  const isInceptionRecord = (e: EndorsementReportRow) =>
    String(e.endorsementType ?? "").toUpperCase() === "INCEPTION" ||
    e.isInception === true ||
    (policyInceptionId !== null && Number(e.endorsementId) === policyInceptionId);

  // endorsement_list rows don't carry per-row live/employee counts — fall back to
  // endorsementMetrics (Report 21) which is the policy-level aggregate for inception stats.
  const inceptionHistory = endorsementList
    .filter(isInceptionRecord)
    .map((e) => {
      const livesAtInception = e.livesAtInception ?? endorsementMetrics?.livesAtInception;
      const activeLivesVal = e.activeLives ?? endorsementMetrics?.activeLives;
      const employeesAtInception = e.employeesAtInception ?? endorsementMetrics?.employeesAtInception;
      const activeEmployeesVal = e.activeEmployees ?? endorsementMetrics?.activeEmployees;
      const dependentsAtInception =
        livesAtInception != null && employeesAtInception != null
          ? Number(livesAtInception) - Number(employeesAtInception)
          : endorsementMetrics?.livesAtInception != null && endorsementMetrics?.employeesAtInception != null
            ? Number(endorsementMetrics.livesAtInception) - Number(endorsementMetrics.employeesAtInception)
            : null;
      const activeDepsNum = (() => {
        const l = Number(activeLivesVal ?? 0);
        const e2 = Number(activeEmployeesVal ?? 0);
        return l > 0 ? l - e2 : null;
      })();
      return ({
      date: fmt(e.endorsementDate ?? e.createdAt),
      title: fmt(e.endorsementId),
      subtitle: fmt(e.remarks) !== "—" ? fmt(e.remarks) : `Inception data — ${fmt(policyRow?.policyName)}`,
      inception: fmt(livesAtInception),
      active: fmt(activeLivesVal),
      netGross: fmt(e.netGrossPremium),
      netPremium: fmt(e.netPremium),
      grossPremium: fmt(e.grossPremium),
      rawNetPremium: (e as any).rawNetPremium ?? null,
      rawGrossPremium: (e as any).rawGrossPremium ?? null,
      rawAddedCount: (e as any).rawAddedCount ?? null,
      rawDeletedCount: (e as any).rawDeletedCount ?? null,
      stillActiveAddedCount: (e as any).stillActiveAddedCount ?? null,
      employees: fmt(employeesAtInception),
      activeEmployees: fmt(activeEmployeesVal),
      dependents: fmt(dependentsAtInception),
      activeDependents: fmt(activeDepsNum),
      activeDependentsFormatted: fmt(activeDepsNum),
      livesAtInception: fmt(livesAtInception),
      activeLives: fmt(activeLivesVal),
      policyPeriod: policyRow ? `${policyRow.periodStart} – ${policyRow.periodEnd}` : "—",
      policyName: fmt(policyRow?.policyName),
      insurer: fmt(policyRow?.insurer),
      effectiveDate: fmt(e.endorsementDate),
      uploadedBy: "—",
      submittedOn: fmt(e.createdAt),
      rawCreatedAt: e.createdAt ?? null,
      fileName: e.originalFileName ?? e.fileName ?? "—",
      cleanRecords: e.totalSuccessCount != null ? String(e.totalSuccessCount) : "—",
      errorRecords: e.totalErrorCount != null ? String(e.totalErrorCount) : "0",
      errorCount: Number(e.totalErrorCount ?? 0),
      successCount: e.totalSuccessCount != null ? String(e.totalSuccessCount) : null,
      fileUrl: e.fileUrl ?? null,
      errorFileUrl: e.errorFileUrl ?? null,
      processStatus: e.processStatus ?? null,
      endorsementStatus: e.endorsementStatus ?? null,
      originalFileName: e.originalFileName ?? e.fileName ?? null,
      enrollmentStartDate: e.enrollmentStartDate ?? null,
      enrollmentEndDate: e.enrollmentEndDate ?? null,
      insurerEndorsementId: (e as any).endorsementNumber ?? (e as any).insurerEndorsementId ?? null,
      endorsmentCount: e.endorsmentCount ?? null,
      endorsmentDependentCount: e.endorsmentDependentCount ?? null,
      isInception: true,
      sumInsured: "—",
      premiumRows: (() => {
        // Inception uses the endorsement's own frozen raw values
        // (rawNetPremium/rawGrossPremium) — the same batch-upload-time figures
        // as the Added Premium pill and Premium Journey's Inception tile — not
        // netPremium/grossPremium (a live, growing enrolled-subset sum that
        // drifts as enrolled employees' premiums change afterward). Tax is
        // derived as gross - net directly, rather than reused from the old
        // enrolled-subset taxAmount field, since gross/net are now both raw.
        // Null-check fallbacks, not `||` — a legitimate 0 shouldn't be
        // silently replaced by a fallback.
        const gross = (e as any).rawGrossPremium != null ? Number((e as any).rawGrossPremium)
                      : e.grossPremium != null ? Number(e.grossPremium) : Number(policyPremiumDetails?.grossPremium ?? 0);
        const net   = (e as any).rawNetPremium != null ? Number((e as any).rawNetPremium)
                      : e.netPremium != null ? Number(e.netPremium) : (Number(policyRow?.netPremium ?? 0)
                        || (gross !== 0 ? gross / 1.18 : 0));
        const tax   = Number.isFinite(gross) && Number.isFinite(net) ? gross - net
                      : (e.taxAmount != null ? Number(e.taxAmount) : Number(policyPremiumDetails?.taxAmount ?? 0));
        // No `!== 0` gate — a real 0 (nobody enrolled yet) should render as
        // "₹0", not "—" (which reads as "no data" and reintroduces the exact
        // confusion this fix is meant to resolve).
        return [
          ["Net Premium",           Number.isFinite(net)   ? formatINR(net, localizationData?.data)   : "—"],
          ["Tax Amount (GST 18%)",  Number.isFinite(tax)   ? formatINR(tax, localizationData?.data)   : "—"],
          ["Gross Premium",         Number.isFinite(gross) ? formatINR(gross, localizationData?.data) : "—"],
        ] as [string, string][];
      })(),
    });
  });

  // Endorsement history = everything that is NOT the inception record
  const endorsementHistory = endorsementList
    .filter((e) => !isInceptionRecord(e))
    .map((e) => {
      const type = String(e.endorsementType ?? "").toUpperCase();
      const isAddition = type === "ADDITION" || type.includes("ADDITION");
      const isCorrection = type === "CORRECTION" || type.includes("CORRECTION");
      const isDeletion = type === "DELETION" || type.includes("DELETION");
      const changePrefix = isAddition ? "+" : isCorrection ? "~" : isDeletion ? "-" : "";
      const rawLabel = (e.endorsementType ?? "Endorsement").replace(/_/g, " ");
      const typeLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
      return {
        date: fmt(e.enrollmentStartDate ?? e.endorsementDate ?? e.createdAt),
        title: fmt(e.endorsementId),
        subtitle: fmt(e.remarks) !== "—" ? fmt(e.remarks) : `${typeLabel || "Endorsement"} · ${fmt(e.enrollmentStartDate)} – ${fmt(e.enrollmentEndDate)}`,
        changeType: `${changePrefix}${typeLabel}`,
        active: fmt(e.activeLives),
        netGross: fmt(e.netGrossPremium),
        activeEmployees: fmt(e.activeEmployees),
        livesAtInception: fmt(e.livesAtInception),
        activeLives: fmt(e.activeLives),
        endorsmentCount: fmt(e.endorsmentCount),
        endorsmentDependentCount: fmt(e.endorsmentDependentCount),
        errorCount: Number(e.totalErrorCount ?? 0),
        successCount: e.totalSuccessCount != null ? String(e.totalSuccessCount) : null,
        fileUrl: e.fileUrl ?? null,
        errorFileUrl: e.errorFileUrl ?? null,
        processStatus: e.processStatus ?? null,
        endorsementStatus: e.endorsementStatus ?? null,
        originalFileName: e.originalFileName ?? e.fileName ?? null,
        enrollmentStartDate: e.enrollmentStartDate ?? null,
        enrollmentEndDate: e.enrollmentEndDate ?? null,
        insurerEndorsementId: (e as any).endorsementNumber ?? (e as any).insurerEndorsementId ?? null,
        rawCreatedAt: e.createdAt ?? null,
        rawEndorsementId: Number(e.endorsementId),
        isInception: e.isInception === true,
        grossPremium: Math.abs(Number(e.grossPremium ?? 0)),
        netPremium: Math.abs(Number(e.netPremium ?? 0)),
        rawNetPremium: (e as any).rawNetPremium ?? null,
        rawGrossPremium: (e as any).rawGrossPremium ?? null,
        rawAddedCount: (e as any).rawAddedCount ?? null,
      rawDeletedCount: (e as any).rawDeletedCount ?? null,
      stillActiveAddedCount: (e as any).stillActiveAddedCount ?? null,
        premiumRows: (() => {
          // Null-check fallbacks, not `||` — see the matching comment in the
          // inception mapping above; a real 0 (nobody enrolled yet) must not
          // get silently replaced by the raw policy-level premium.
          const gross = e.grossPremium != null ? Number(e.grossPremium) : Number(policyPremiumDetails?.grossPremium ?? 0);
          const tax   = e.taxAmount   != null ? Number(e.taxAmount)   : Number(policyPremiumDetails?.taxAmount   ?? 0);
          const net   = e.netPremium  != null ? Number(e.netPremium)  : (gross !== 0 && tax !== 0 ? gross - tax : gross !== 0 ? gross / 1.18 : 0);
          // No `!== 0` gate — a real 0 (nobody enrolled yet) should render as
          // "₹0", not "—" (which reads as "no data").
          // Net premium only — per instruction, gross premium is not shown
          // anywhere in the Enrolment tab. `gross` above is kept only as a
          // fallback input for deriving `net` when it's missing.
          const rows: [string, string][] = [
            ["Net Premium",          Number.isFinite(net)   ? formatINR(net, localizationData?.data)   : "—"],
            ["Tax Amount (GST 18%)", Number.isFinite(tax)   ? formatINR(tax, localizationData?.data)   : "—"],
          ];
          if (isAddition && net !== 0) rows.push(["Added Premium", formatINR(net, localizationData?.data)]);
          if (isDeletion && net !== 0) rows.push(["Deleted Premium", formatINR(net, localizationData?.data)]);
          return rows;
        })(),
      };
    });

  // Merged enrollment history: endorsements first (newest → oldest), inception last
  const mergedEnrollmentHistory = [
    ...endorsementHistory.map((i) => ({ ...i, cardType: "endorsement" as const })),
    ...inceptionHistory.map((i) => ({ ...i, cardType: "inception" as const })),
  ];

  const INCEPTION_KPI_CARDS = [
    { id: "lives", label: "Total Lives", value: fmt(endorsementMetrics?.livesAtInception ?? policyRow?.totalLives), sub: "Employees + Dependents", color: "#1C57B8", bg: "#EBF3FF", border: "#BFDBFE" },
    { id: "employees", label: "Total Employees", value: fmt(endorsementMetrics?.employeesAtInception ?? policyRow?.employeeCount), sub: "Active at inception", color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
    { id: "dependents", label: "Total Dependents", value: (() => { const t = Number(policyRow?.totalLives ?? 0); const e = Number(policyRow?.employeeCount ?? 0); return t > 0 && e > 0 ? String(t - e) : "—"; })(), sub: "Spouse + Children", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
    { id: "premium", label: "Net Premium", value: endorsementMetrics?.premiumAtInception != null ? formatINR(Number(endorsementMetrics.premiumAtInception), localizationData?.data) : (policyRow?.netPremium != null ? formatINR(policyRow.netPremium, localizationData?.data) : "—"), sub: "From endorsement data", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  ];

  const CURRENT_KPI_CARDS = [
    { id: "lives", label: "Total Lives", value: fmt(endorsementMetrics?.activeLives), sub: "After all endorsements", color: "#1C57B8", bg: "#EBF3FF", border: "#BFDBFE" },
    { id: "employees", label: "Total Employees", value: fmt(endorsementMetrics?.activeEmployees), sub: "Currently enroled", color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
    { id: "dependents", label: "Total Dependents", value: (() => { const lives = Number(endorsementMetrics?.activeLives ?? 0); const emps = Number(endorsementMetrics?.activeEmployees ?? 0); return lives > 0 && emps > 0 ? String(lives - emps) : "—"; })(), sub: "Active dependents", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
    { id: "premium", label: "Net Premium", value: endorsementMetrics?.activePremium != null ? formatINR(Number(endorsementMetrics.activePremium), localizationData?.data) : "—", sub: "After endorsements", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  ];

  // ─── Download template helpers ───────────────────────────────────────────────

  async function downloadBlobFromEndpoint(url: string, fallbackName: string) {
    const resp = await apiRequest(url, { method: "GET" });
    const fileUrl = resp?.data?.url;
    const fallbackFileName = resp?.data?.fileName || fallbackName;
    if (fileUrl) {
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = fallbackFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const documentId = resp?.data?.documentId;
    if (!documentId) return;
    const blobResp = await apiRequest(endPoints.ibpFileUploadDownloadById(documentId), {
      method: "GET",
      responseType: "blob",
    });
    const blob = blobResp.data as Blob;
    const cd = (blobResp.headers as Record<string, string>)?.["content-disposition"] ?? "";
    const match = cd.match(/filename="?([^";\n]+)"?/);
    const fileName = match?.[1] || fallbackFileName;
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }

  async function handleDownloadInceptionTemplate() {
    if (!numericPolicyId) return;
    try {
      const endpoint = inceptionDocType === "employee_only"
        ? endPoints.downloadEmployeeDataTemplate(numericPolicyId)
        : endPoints.downloadEmployeeEnrollmentTemplate(numericPolicyId);
      await downloadBlobFromEndpoint(endpoint, "inception-template.xlsx");
    } catch { /* silently ignore */ }
  }

  async function handleDownloadEndorsementTemplate() {
    if (!numericPolicyId) return;
    try {
      const endpoint = endorsementDocType === "employee_only"
        ? endPoints.downloadEmployeeDataTemplate(numericPolicyId)
        : endPoints.downloadEmployeeEnrollmentTemplate(numericPolicyId);
      await downloadBlobFromEndpoint(endpoint, "endorsement-template.xlsx");
    } catch { /* silently ignore */ }
  }

  // ─── Upload helpers ───────────────────────────────────────────────────────────

  function validateUploadFile(file: File): string {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "csv") return "Unsupported file type. Please upload an .xlsx or .csv file.";
    if (file.size > 10 * 1024 * 1024) return "File too large. Maximum allowed size is 10 MB.";
    return "";
  }

  function handleInceptionFileSelect(file: File) {
    const err = validateUploadFile(file);
    if (err) { setInceptionUploadError(err); return; }
    setInceptionUploadError("");
    setInceptionFile(file.name);
    setInceptionFileObj(file);
    setInceptionView("uploaded");
  }

  function handleEndorsementFileSelect(file: File) {
    const err = validateUploadFile(file);
    if (err) { setEndorsementUploadError(err); return; }
    setEndorsementUploadError("");
    setEndorsementFile(file.name);
    setEndorsementFileObj(file);
    setEndorsementView("uploaded");
  }

  async function handleInceptionSubmit() {
    if (!inceptionFileObj || !numericPolicyId || isInceptionUploading) return;
    if (!inceptionOsTicket.trim() || !inceptionReceivedDate || Number(inceptionNoOfEmployees) <= 0) {
      setInceptionUploadError("Please fill iTicket Number, Request Received Date and No. of Employees before submitting.");
      return;
    }
    setIsInceptionUploading(true);
    setInceptionUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", inceptionFileObj);
      formData.append("companyType", "policy");
      formData.append("companyId", String(numericPolicyId));
      formData.append("documentTypeLid", "-1");
      const uploadResult = await apiRequest(endPoints.ibpFileUpload, { method: "POST", data: formData });
      const documentId = uploadResult?.data?.id || uploadResult?.data?.[0]?.id;
      if (!documentId) throw new Error("No documentId from upload");
      await apiRequest(endPoints.processEmployeeData(numericPolicyId), {
        method: "POST",
        data: {
          documentId,
          documentType: "policy_employee_data",
          employeeCount: Number(inceptionNoOfEmployees) || 0,
          dependentCount: inceptionDocType === "employee_only" ? 0 : (Number(inceptionNoOfDependents) || 0),
          osTicketNumber: inceptionOsTicket.trim(),
          endorsementEntryDate: inceptionReceivedDate,
          enrollmentStartDate: inceptionEnrollmentStartDate,
          enrollmentEndDate: inceptionEnrollmentEndDate,
          isInception: true,
        },
      });
      setInceptionView("loading");
    } catch {
      setInceptionUploadError("Upload failed. Please try again.");
      setInceptionView("uploaded");
    } finally {
      setIsInceptionUploading(false);
    }
  }

  async function handleEndorsementSubmit(fileOverride?: File) {
    const fileObj = fileOverride ?? endorsementFileObj;
    if (!fileObj || !numericPolicyId || isEndorsementUploading) return;
    if (!endorsementOsTicket.trim() || !endorsementReceivedDate || !endorsementFormType) {
      setEndorsementUploadError("Please fill iTicket Number, Request Received Date and Endorsement Type before submitting.");
      return;
    }
    setIsEndorsementUploading(true);
    setEndorsementUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", fileObj);
      formData.append("companyType", "policy");
      formData.append("companyId", String(numericPolicyId));
      formData.append("documentTypeLid", "-1");
      const uploadResult = await apiRequest(endPoints.ibpFileUpload, { method: "POST", data: formData });
      const documentId = uploadResult?.data?.id || uploadResult?.data?.[0]?.id;
      if (!documentId) throw new Error("No documentId from upload");
      await apiRequest(endPoints.processEmployeeData(numericPolicyId), {
        method: "POST",
        data: {
          documentId,
          documentType: "policy_employee_enrollment_data",
          employeeCount: Number(endorsementNoOfEmployees) || 0,
          dependentCount: endorsementDocType === "employee_only" ? 0 : (Number(endorsementNoOfDependents) || 0),
          osTicketNumber: endorsementOsTicket.trim(),
          endorsementType: endorsementFormType,
          endorsementEntryDate: endorsementReceivedDate,
          enrollmentStartDate: endorsementEnrollmentStartDate,
          enrollmentEndDate: endorsementEnrollmentEndDate,
          isInception: false,
        },
      });
      setEndorsementView("loading");
      setTimeout(() => {
        setEndorsementRefreshToken((t) => t + 1);
      }, 2500);
    } catch {
      setEndorsementUploadError("Upload failed. Please try again.");
      setEndorsementView("uploaded");
    } finally {
      setIsEndorsementUploading(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
    <Box
      sx={{
        mx: -3,
        height: "100%",
        background: "#EBF6FF",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={() => setTypeMenuOpen(false)}
    >
      {/* ── Sticky shell: header + tab bar ───────────────────────────────── */}
      <Box sx={{ position: "sticky", top: 0, zIndex: 1, flexShrink: 0, width: "100%" }}>

      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          pl: 3.25,
          pr: 4,
          py: 2,
          bgcolor: "#fff",
          borderBottom: "1px solid #E5E7EB",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          width: "100%",
          gap: 2,
        }}
      >
        {/* Back + divider + icon + name */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0, order: 1 }}>
          <Box
            onClick={() => navigate(-1)}
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "#6B7280", fontSize: 15, lineHeight: 1.7, fontWeight: 500, cursor: "pointer", flexShrink: 0, transition: "color 0.15s", "&:hover": { color: "#111827" } }}
          >
            <ArrowLeft size={16} />
            <Box component="span">Back</Box>
          </Box>
          <Box sx={{ width: "1px", height: 32, bgcolor: "#E5E7EB", flexShrink: 0 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, flexShrink: 0 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "13px", bgcolor: policyIconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {policyIcon}
            </Box>
            {cdLoading && !policyName ? (
              <Box sx={{ width: 200, height: 22, borderRadius: 4, bgcolor: "#F3F4F6" }} />
            ) : (
              <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>
                {policyName || "Policy Detail"}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Divider between name and metadata — md+ only */}
        <Box sx={{ display: { xs: "none", md: "block" }, width: "1px", height: 36, bgcolor: "#E5E7EB", flexShrink: 0, order: 2 }} />

        {/* Metadata — stacked label/value columns */}
        <Box sx={{
          order: { xs: 3, md: 2 },
          flex: { md: 1 },
          width: { xs: "100%", md: "auto" },
          pl: { xs: "72px", md: 0 },
          display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0,
        }}>
          {[
            { label: "Policy ID",  value: policyRow?.policyNumber ?? `POL-${policyRow?.policyId ?? numericPolicyId ?? "—"}` },
            { label: "Period",     value: (policyRow?.periodStart ?? cdSummary?.periodStart) && (policyRow?.periodEnd ?? cdSummary?.periodEnd) ? `${toPeriodLabel(policyRow?.periodStart ?? cdSummary?.periodStart ?? "")} – ${toPeriodLabel(policyRow?.periodEnd ?? cdSummary?.periodEnd ?? "")}` : "—" },
            { label: "Insurer",    value: insurer },
            { label: "TPA",        value: policyRow?.tpaName ?? "—" },
          ].map(({ label, value }, i, arr) => (
            <Box key={label} sx={{ display: "flex", alignItems: "center" }}>
              <Box sx={{ display: "flex", flexDirection: "column", px: 1.75, py: 0.25, whiteSpace: "nowrap" }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.4 }}>{value}</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", lineHeight: 1.4 }}>{label}</Typography>
              </Box>
              {i < arr.length - 1 && (
                <Box sx={{ width: "1px", height: 28, bgcolor: "#E5E7EB", flexShrink: 0 }} />
              )}
            </Box>
          ))}
        </Box>

        {/* Lives pill — solid dark navy */}
        <Box sx={{
          order: { xs: 2, md: 3 },
          ml: { xs: "auto", md: 0 },
          display: "flex", alignItems: "center", gap: 1, px: 2.25, py: 1.1, borderRadius: "12px",
          bgcolor: "#1E3A6E", flexShrink: 0, whiteSpace: "nowrap",
        }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.09em", textTransform: "uppercase" }}>
            Active Lives
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>
            {policyRow?.totalLives != null ? fmt(policyRow.totalLives) : "—"}
          </Typography>
        </Box>

        {/* Annual Premium pill — solid dark green */}
        <Box sx={{
          order: { xs: 2, md: 3 },
          display: "flex", alignItems: "center", gap: 1, px: 2.25, py: 1.1, borderRadius: "12px",
          bgcolor: "#065F46", flexShrink: 0, whiteSpace: "nowrap",
        }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.09em", textTransform: "uppercase" }}>
            Annual Premium
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1 }}>
            {policyRow?.netPremium ? formatINR(policyRow.netPremium, localizationData?.data) : "—"}
          </Typography>
        </Box>
      </Box>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: "#fff",
          borderBottom: "1px solid #E5E7EB",
          width: "100%",
          flexShrink: 0,
          zIndex: 9,
        }}
      >
        {/* Tab row */}
        <Box sx={{ display: "flex", alignItems: "center", px: 3, py: 2.25, gap: 1 }}>
          {TABS.map((tab) => {
            const tabLabel = tab.id === "enrollment" && isNonLife ? "Assets" : tab.label;
            return (
              <Box
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                sx={{
                  px: 2,
                  py: 1.1,
                  minHeight: 40,
                  borderRadius: "10px",
                  fontSize: 15, lineHeight: 1.7,
                  fontWeight: 600,
                  color: activeTab === tab.id ? "#fff" : "#374151",
                  background: activeTab === tab.id ? "#2556A6" : "#fff",
                  border: `1px solid ${activeTab === tab.id ? "#2556A6" : "#D0D7E2"}`,
                  boxShadow: activeTab === tab.id ? "0 3px 10px rgba(37,86,166,0.18)" : "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  "&:hover": {
                    background: activeTab === tab.id ? "#1f4a95" : "#F8FAFC",
                    borderColor: activeTab === tab.id ? "#1f4a95" : "#B8C2D1",
                  },
                }}
              >
                {tabLabel}
              </Box>
            );
          })}
        </Box>

        {/* Enrollment history sticky second row — only shown during inception upload (pre-completed) */}
        {activeTab === "enrollment" && enrollHistorySticky && (inceptionView === "upload" || inceptionView === "uploaded") && (
          <Box sx={{ px: 3, minHeight: 56, bgcolor: "#F1F5F9", borderTop: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827" }}>Inception Upload</Typography>
          </Box>
        )}
      </Box>
      </Box>{/* ── end sticky shell ── */}

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <Box
        ref={tabContentRef}
        onScroll={(e) => {
          const scrollTop = (e.currentTarget as HTMLDivElement).scrollTop;
          setShowBackToTop(scrollTop > 200);
        }}
        sx={{
          flex: 1,
          overflowY: "auto",
          scrollBehavior: "smooth",
          minHeight: 0,
          WebkitOverflowScrolling: "touch",
          px: 3,
          pt: tatStripMode && activeTab === "claims" ? 0 : 2.5,
          pb: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          position: "relative",
          "&::-webkit-scrollbar": { width: 5 },
          "&::-webkit-scrollbar-thumb": {
            background: "#D1D5DB",
            borderRadius: 4,
          },
        }}
      >
        {/* ══ CD Balance ════════════════════════════════════════════════ */}
        {activeTab === "cd" && (
          <>
            {cdLoading && !cdSummary ? (
              <TabLoader />
            ) : cdError ? (
              <TabError onRetry={cdRefetch} />
            ) : cdSummary && !cdSummary.cdAccountNumber ? (
              // cdSummary is truthy even with no CD account mapped — policy_cd_summary
              // LEFT JOINs from the policy itself, so it always returns a row with the
              // policy's own fields (name, premium, lives), just with every CD-derived
              // field null/zero. Showing that as "Safe Limit ₹X / Available Balance ₹0 /
              // Critical" looked like a real, critically-underfunded account when there
              // was no account at all. cdAccountNumber is null only when genuinely
              // unmapped (confirmed via caution_deposit_policy_mapping) — the one
              // reliable signal to show a plain "no CD account" state instead.
              <Box sx={{ py: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5, borderRadius: "14px", bgcolor: "#fff", border: "1px solid #E5E7EB" }}>
                <Box sx={{ width: 60, height: 60, borderRadius: "50%", bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wallet size={26} color="#D1D5DB" />
                </Box>
                <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#374151" }}>No CD Account Linked</Typography>
                <Typography sx={{ fontSize: 15, color: "#9CA3AF", textAlign: "center", maxWidth: 340, lineHeight: 1.6 }}>
                  This policy doesn't have a Caution Deposit account associated with it yet.
                </Typography>
              </Box>
            ) : cdSummary ? (
              <>
                {/* ── 2-column row: CD Balance card | Linked Policies ── */}
                {(() => {
                  const barMax = cdAvailableAmount < _cdSafeLimit ? _cdSafeLimit * 2 : cdAvailableAmount + _cdSafeLimit * 2;
                  const availPct = barMax > 0
                    ? Math.min(100, Math.max(0, (cdAvailableAmount / barMax) * 100))
                    : Math.max(0, 100 - cdUsedPct);
                  const safeMarkerPct = barMax > 0
                    ? Math.min(100, Math.max(0, (_cdSafeLimit / barMax) * 100))
                    : 10;
                  const cdIsBelow = cdAvailableAmount < _cdSafeLimit;
                  const _policyStart = policyRow?.periodStart ? new Date(policyRow.periodStart) : null;
                  const _today = new Date();
                  const _elapsedMonths = (_policyStart && !isNaN(_policyStart.getTime()))
                    ? Math.max(1, (_today.getFullYear() - _policyStart.getFullYear()) * 12 + _today.getMonth() - _policyStart.getMonth() + 1)
                    : 1;
                  const monthlyBurn = cdSummary.usedAmount > 0 ? Math.round((cdSummary.usedAmount / _elapsedMonths) * 10) / 10 : 0;
                  const daysRemaining = monthlyBurn > 0 ? Math.round((cdAvailableAmount / monthlyBurn) * 30) : 0;
                  const safeLimitAmt = _cdSafeLimit;
                  const topupNeeded = cdIsBelow ? Math.round((safeLimitAmt - cdAvailableAmount) * 10) / 10 : 0;
                  const burnStr = monthlyBurn >= 100000
                    ? `${getCurrencySymbolPrefix(localizationData?.data)}${(monthlyBurn / 100000).toFixed(1)}L`
                    : `${formatAmountWithCurrency(Math.round(monthlyBurn), localizationData?.data)}`;
                  const topupStr = topupNeeded >= 100000
                    ? `${getCurrencySymbolPrefix(localizationData?.data)}${(topupNeeded / 100000).toFixed(1)}L`
                    : `${formatAmountWithCurrency(Math.round(topupNeeded), localizationData?.data)}`;
                  return (
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "stretch" }}>

                      {/* Card 1: CD Balance visual */}
                      <Box sx={{ borderRadius: "14px", bgcolor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column" }}>
                        <Box sx={{ px: 3, pt: 2.5, pb: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                            <Box sx={{ display: "inline-flex", alignItems: "center", px: 1.75, py: 0.5, borderRadius: 999, bgcolor: "#EBF3FF", border: "1.5px solid #BFDBFE" }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 800, color: "#1C57B8", letterSpacing: "0.1em", textTransform: "uppercase" }}>CD Balance</Typography>
                            </Box>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: '5px', bgcolor: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                              <Typography sx={{ fontSize: 15, color: '#6B7280', fontWeight: 500 }}>A/c:</Typography>
                              <Typography sx={{ fontSize: 15, color: '#374151', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                                {/* Guaranteed non-empty here — the "no CD account" case is
                                    handled by the sibling branch above (cdAccountNumber is
                                    null/empty). No fabricated POL-{policyId} placeholder. */}
                                {cdSummary.cdAccountNumber}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "36px" }}>
                            {/* Safe limit label — left of bar, aligned with strip */}
                            <Box sx={{ position: "relative", height: 158, width: 90, flexShrink: 0 }}>
                              <Box sx={{ position: "absolute", bottom: `calc(${safeMarkerPct}% - 22px)`, right: 0, textAlign: "right" }}>
                                <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#F59E0B", lineHeight: 1.2 }}>
                                  {formatINR(_cdSafeLimit, localizationData?.data)}
                                </Typography>
                                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4 }}>
                                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#F59E0B", lineHeight: 1.2 }}>
                                    Safe limit
                                  </Typography>
                                  <Tooltip title="Safe limit is configured per CD account (default 10% of net premium)" arrow placement="top">
                                    <Box component="span" sx={{ display: "inline-flex", cursor: "pointer" }}>
                                      <Info size={11} color="#D97706" />
                                    </Box>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </Box>

                            {/* Bar */}
                            <Box sx={{ position: "relative", width: 42, height: 158, borderRadius: "10px", bgcolor: "#F1F5F9", flexShrink: 0 }}>
                              <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${availPct}%`, borderRadius: "0 0 10px 10px", background: cdColor === "#EF4444" ? "linear-gradient(180deg, #FCA5A5 0%, #EF4444 100%)" : cdColor === "#F59E0B" ? "linear-gradient(180deg, #FCD34D 0%, #F59E0B 100%)" : "linear-gradient(180deg, #6EE7B7 0%, #10B981 100%)", opacity: 0.85, transition: "height 0.4s ease" }} />
                              <Box sx={{ position: "absolute", left: -5, right: -5, bottom: `${safeMarkerPct}%`, height: "3px", bgcolor: "#F59E0B", borderRadius: 999, zIndex: 0 }} />
                            </Box>

                            {/* Right info */}
                            <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                                {cdIsBelow && <AlertTriangle size={13} color={cdColor} />}
                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: cdColor }}>{cdStatus}</Typography>
                              </Box>
                              <Typography sx={{ fontSize: 32, fontWeight: 800, color: cdColor === "#EF4444" ? "#EF4444" : cdColor === "#F59E0B" ? "#D97706" : "#059669", lineHeight: 1 }}>{formatINR(cdAvailableAmount, localizationData?.data)}</Typography>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563" }}>Available Balance</Typography>
                            </Box>
                          </Box>
                        </Box>
                        {/* Lives CD can cover & premium per person */}
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #F3F4F6", mt: 1 }}>
                          <Box sx={{ textAlign: "center", py: 3, px: 1, borderRight: "1px solid #F3F4F6", display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
                            <Typography sx={{ fontSize: 24, lineHeight: 1, letterSpacing: "-0.3px", fontWeight: 800, color: "#1E3A5F" }}>
                              {_perLifePremium > 0 ? formatINR(Math.round(_perLifePremium), localizationData?.data) : "—"}
                            </Typography>
                            <Tooltip title="Policy's Net Premium ÷ Total Lives (employees + dependents). This is a policy-wide average, not any one individual's actual premium — different employees/dependents can cost more or less than this depending on their plan, age, and family size." arrow placement="bottom">
                              <Typography sx={{ fontSize: 15, lineHeight: 1, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", cursor: "help", borderBottom: "1px dashed #D1D5DB", display: "inline-block" }}>Premium / Person</Typography>
                            </Tooltip>
                            <Typography sx={{ fontSize: 15, lineHeight: 1, color: "#4B5563" }}>per life per year</Typography>
                          </Box>
                          <Box sx={{ textAlign: "center", py: 3, px: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
                            <Typography sx={{ fontSize: 24, lineHeight: 1, letterSpacing: "-0.3px", fontWeight: 800, color: "#1E3A5F" }}>
                              {_perLifePremium > 0 ? formatNumberByLocalization(Math.floor(cdAvailableAmount / _perLifePremium), localizationData?.data) : "—"}
                            </Typography>
                            <Tooltip title="Available Balance ÷ Premium/Person, rounded down. How many lives (employees + dependents) the CD balance sitting in the account right now could fund at this policy's average per-life premium — not a prediction of when the balance will run out, just a snapshot of its current funding capacity." arrow placement="bottom">
                              <Typography sx={{ fontSize: 15, lineHeight: 1, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", cursor: "help", borderBottom: "1px dashed #D1D5DB", display: "inline-block" }}>Lives Fundable</Typography>
                            </Tooltip>
                            <Typography sx={{ fontSize: 15, lineHeight: 1, color: "#4B5563" }}>at current balance</Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Linked Policies */}
                      <Box
                        sx={{
                          borderRadius: "14px",
                          bgcolor: "#fff",
                          border: "1px solid #E5E7EB",
                          overflow: "hidden",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <Box
                          sx={{
                            px: 2.5,
                            py: 2.25,
                            borderBottom: "1px solid #F3F4F6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                          }}
                        >
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827" }}>
                            Upcoming Installments
                          </Typography>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563", textAlign: "right" }}>
                            {linkedPoliciesLoading ? "Loading…" : `${linkedPolicies.length} policies funded from this CD account`}
                          </Typography>
                        </Box>
                        <Box sx={{ maxHeight: 300, overflowY: "auto", "&::-webkit-scrollbar": { width: 6 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#D1D5DB", borderRadius: 3 }, "&::-webkit-scrollbar-track": { bgcolor: "transparent" } }}>
                          {upcomingInstallmentsLoading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                              <CircularProgress size={22} sx={{ color: "#1C57B8" }} />
                            </Box>
                          ) : upcomingInstallments.length === 0 ? (
                            <Box sx={{ px: 3, py: 6, textAlign: "center" }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151" }}>No upcoming installments</Typography>
                            </Box>
                          ) : (
                            <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                              {/* Table header */}
                              <Box sx={{ display: "flex", alignItems: "center", px: 0.5, mb: 0.5 }}>
                                <Box sx={{ width: 4, flexShrink: 0 }} />
                                <Box sx={{ flex: 1, minWidth: 0, px: 2 }}>
                                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase" }}>Installment</Typography>
                                </Box>
                                <Box sx={{ width: "1px", flexShrink: 0 }} />
                                <Box sx={{ px: 2.5, minWidth: 130, display: "flex", justifyContent: "center" }}>
                                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Due Date</Typography>
                                </Box>
                                <Box sx={{ width: "1px", flexShrink: 0 }} />
                                <Box sx={{ px: 2.5, minWidth: 120, display: "flex", justifyContent: "center" }}>
                                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Amount</Typography>
                                </Box>
                              </Box>
                              {upcomingInstallments.map((row) => {
                            const daysUntilInstallment = row.installmentDate
                              ? Math.round((new Date(row.installmentDate).getTime() - Date.now()) / 86400000)
                              : null;
                            const urgencyColor =
                              daysUntilInstallment === null ? "#4B5563"
                              : daysUntilInstallment < 0 ? "#EF4444"
                              : daysUntilInstallment <= 7 ? "#EF4444"
                              : daysUntilInstallment <= 30 ? "#D97706"
                              : "#2563EB";
                            const urgencyBg =
                              daysUntilInstallment === null ? "#F9FAFB"
                              : daysUntilInstallment < 0 ? "#FEF2F2"
                              : daysUntilInstallment <= 7 ? "#FEF2F2"
                              : daysUntilInstallment <= 30 ? "#FFFBEB"
                              : "#EFF6FF";
                            const urgencyBorder =
                              daysUntilInstallment === null ? "#E5E7EB"
                              : daysUntilInstallment < 0 ? "#FECACA"
                              : daysUntilInstallment <= 7 ? "#FECACA"
                              : daysUntilInstallment <= 30 ? "#FDE68A"
                              : "#BFDBFE";
                            const badgeText =
                              daysUntilInstallment === null ? "—"
                              : daysUntilInstallment < 0 ? "Overdue"
                              : daysUntilInstallment === 0 ? "Due today"
                              : `in ${daysUntilInstallment}d`;
                            const formattedDate = row.installmentDate
                              ? new Date(row.installmentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                              : null;
                            const installmentAmt = Number(row.installmentAmount ?? 0);
                            const seqLabel = row.installmentSeq != null
                              ? String(row.installmentSeq).padStart(2, "0")
                              : "—";
                            return (
                              <Box
                                key={row.installmentId}
                                sx={{
                                  display: "flex",
                                  alignItems: "stretch",
                                  borderRadius: "10px",
                                  border: `1px solid ${urgencyBorder}`,
                                  bgcolor: urgencyBg,
                                  overflow: "hidden",
                                }}
                              >
                                {/* Left accent bar */}
                                <Box sx={{ width: 4, bgcolor: urgencyColor, flexShrink: 0 }} />

                                {/* Installment info */}
                                <Box sx={{ flex: 1, minWidth: 0, px: 2, py: 2 }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.75 }}>
                                    <Box
                                      sx={{
                                        px: 1,
                                        py: 0.25,
                                        borderRadius: "6px",
                                        bgcolor: urgencyColor + "18",
                                        border: `1px solid ${urgencyColor}40`,
                                        color: urgencyColor,
                                        fontSize: 15,
                                        fontWeight: 800,
                                        letterSpacing: "0.04em",
                                        flexShrink: 0,
                                      }}
                                    >
                                      {seqLabel}
                                    </Box>
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.5, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {row.installmentLabel}
                                    </Typography>
                                  </Box>
                                  <Typography sx={{ fontSize: 15, color: "#6B7280" }}>
                                    {/* upcoming_installments (id=18) never selects policyId/policyNumber —
                                        it's already filtered to this one policyId, so there's nothing to
                                        distinguish per row. row.policyNumber was always undefined here;
                                        use the page's own policyRow instead, same fallback as elsewhere. */}
                                    Policy: {policyRow?.policyNumber ?? `POL-${policyRow?.policyId ?? numericPolicyId ?? "—"}`}
                                  </Typography>
                                </Box>

                                {/* Divider */}
                                <Box sx={{ width: "1px", bgcolor: urgencyBorder, flexShrink: 0, my: 1.5 }} />

                                {/* Date */}
                                <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, minWidth: 130 }}>
                                  {formattedDate ? (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap" }}>
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.4, fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>{formattedDate}</Typography>
                                      <Box sx={{ px: 1.25, py: 0.2, borderRadius: 999, bgcolor: urgencyColor + "18", border: `1px solid ${urgencyColor}40`, flexShrink: 0 }}>
                                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: urgencyColor, whiteSpace: "nowrap" }}>{badgeText}</Typography>
                                      </Box>
                                    </Box>
                                  ) : (
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>—</Typography>
                                  )}
                                </Box>

                                {/* Divider */}
                                <Box sx={{ width: "1px", bgcolor: urgencyBorder, flexShrink: 0, my: 1.5 }} />

                                {/* Amount */}
                                <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, minWidth: 120 }}>
                                  <Typography sx={{ fontSize: 20, fontWeight: 800, color: installmentAmt > 0 ? urgencyColor : "#9CA3AF", letterSpacing: "-0.5px", whiteSpace: "nowrap" }}>
                                    {installmentAmt > 0 ? formatINR(installmentAmt, localizationData?.data) : "—"}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          })}
                            </Box>
                          )}
                        </Box>
                      </Box>

                    </Box>
                  );
                })()}

                {/* Transactions */}
                <Box
                  sx={{
                    borderRadius: "14px",
                    bgcolor: "#fff",
                    border: "1px solid #E5E7EB",
                    overflow: "scroll",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <Box
                    sx={{
                      px: 3,
                      py: 2,
                      borderBottom: "1px solid #F3F4F6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827" }}
                    >
                      Transactions
                    </Typography>
                  </Box>
                  {/* Loader */}
                  {cdTxnLoading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                      <CircularProgress size={28} sx={{ color: "#1C57B8" }} />
                    </Box>
                  )}

                  {/* Error */}
                  {!cdTxnLoading && cdTxnError && (
                    <Box sx={{ px: 3, py: 5, textAlign: "center" }}>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#EF4444", mb: 1.5 }}>
                        Failed to load transactions.
                      </Typography>
                      <Box
                        onClick={cdTxnRefetch}
                        sx={{ display: "inline-block", px: 3, py: 0.875, borderRadius: "8px", bgcolor: "#1C57B8", color: "#fff", fontSize: 15, lineHeight: 1.7, fontWeight: 600, cursor: "pointer" }}
                      >
                        Retry
                      </Box>
                    </Box>
                  )}

                  {/* Empty state */}
                  {!cdTxnLoading && !cdTxnError && cdTxnData.length === 0 && (
                    <Box sx={{ py: 8, textAlign: "center" }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                        <RotateCcw size={20} color="#9CA3AF" />
                      </Box>
                      <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151", lineHeight: 1.5, mb: 0.75 }}>No transactions</Typography>
                      <Typography sx={{ fontSize: 15, color: "#9CA3AF", lineHeight: 1.7 }}>No CD transactions found for this policy.</Typography>
                    </Box>
                  )}

                  {/* Transaction table */}
                  {!cdTxnLoading && !cdTxnError && cdTxnData.length > 0 && (() => {
                    const cdTxnRecordCount = cdTxnTotal ?? cdTxnData.length;
                    const cdTxnTotalPages = Math.max(1, Math.ceil(cdTxnRecordCount / cdTxnPageSize));
                    const cdTxnCurrentPage = Math.min(cdTxnPage, cdTxnTotalPages);
                    const cdTxnPagedData = cdTxnData.slice((cdTxnCurrentPage - 1) * cdTxnPageSize, cdTxnCurrentPage * cdTxnPageSize);
                    const clamp2: React.CSSProperties = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" };
                    return (
                      <>
                        <Box ref={cdTxnScrollContainerRef} onScroll={(e) => setCdTxnScrolled((e.currentTarget as HTMLDivElement).scrollLeft > 0)} sx={{ overflowX: "auto", width: "100%" }}>
                          <Box component="table" sx={{ minWidth: 1660, width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, fontSize: 15, lineHeight: 1.7 }}>
                            <Box component="colgroup">
                              {[130,160,155,120,140,155,120,120,175,185,200].map((w, i) => <Box key={i} component="col" sx={{ width: w }} />)}
                            </Box>
                            <Box component="thead">
                              <Box component="tr" sx={{ bgcolor: "#4B6B8A" }}>
                                {["Date", "Account Number", "Policy", "Type", "Amount", "Running Balance", "Lives Added", "Lives Deleted", "Bank / Ref", "Endorsement", "Remarks"].map((h, hi) => (
                                  <Box key={h} component="th" sx={{ px: 2, minWidth: 250, py: 2.25, textAlign: "left", fontWeight: 600, color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap", fontSize: 15, lineHeight: 1.7, bgcolor: "#4B6B8A", ...(hi === 0 ? { position: "sticky", left: 0, zIndex: 0, borderRight: cdTxnScrolled ? "1px solid rgba(255,255,255,0.3)" : "none" } : {}) }}>
                                    {h}
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                            <Box component="tbody">
                              {cdTxnPagedData.map((txn) => {
                                const isDeposit = txn.txnType === "Deposit";
                                const isCurrent = txn.isCurrentPolicy === true;
                                const amtColor = isDeposit ? "#059669" : "#DC2626";
                                const amtPrefix = isDeposit ? "+" : "−";
                                const bankNameRaw = typeof txn.bankName === "string" ? txn.bankName.trim() : "";
                                const bankNameVal = bankNameRaw && bankNameRaw.toLowerCase() !== "null" ? bankNameRaw : null;
                                const referenceIdRaw = typeof txn.referenceId === "string" ? txn.referenceId.trim() : "";
                                const referenceIdVal = referenceIdRaw && referenceIdRaw.toLowerCase() !== "null" ? referenceIdRaw : null;
                                const rowBg = isCurrent ? "#EFF6FF" : "#fff";
                                return (
                                  <Box
                                    key={txn.txnId}
                                    component="tr"
                                    sx={{ "&:hover": { bgcolor: isCurrent ? "#DBEAFE" : "#FAFBFF" }, borderBottom: "1px solid #F3F4F6", bgcolor: rowBg }}
                                  >
                                    <Box component="td" sx={{ px: 2, py: 2.25, whiteSpace: "nowrap", color: "#374151", position: "sticky", left: 0, zIndex: 0, bgcolor: rowBg, borderRight: cdTxnScrolled ? "1px solid #94A3B8" : "none" }}>
                                      {txn.txnDate}
                                    </Box>
                                    <Box component="td" sx={{ px: 2, py: 2.25 }}>
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151", ...clamp2 }}>{txn.cdAccountNumber || "—"}</Typography>
                                    </Box>
                                    <Box component="td" sx={{ px: 2, py: 1.75 }}>
                                      {isCurrent
                                        ? <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.3, borderRadius: "6px", fontSize: 14, fontWeight: 600, bgcolor: "#DBEAFE", color: "#1D4ED8", border: "1px solid #93C5FD" }}>
                                            <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#3B82F6", flexShrink: 0 }} />
                                            {txn.policyNumber || "—"}
                                          </Box>
                                        : <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", ...clamp2 }}>{txn.policyNumber || "—"}</Typography>}
                                    </Box>
                                    <Box component="td" sx={{ px: 2, py: 1.75 }}>
                                      <Box sx={{ display: "inline-block", px: 1.25, py: 0.3, borderRadius: "6px", fontSize: 15, lineHeight: 1.7, fontWeight: 600, bgcolor: isDeposit ? "#DCFCE7" : "#FEE2E2", color: amtColor }}>
                                        {txn.txnType}
                                      </Box>
                                    </Box>
                                    <Box component="td" sx={{ px: 2, py: 2.25, fontWeight: 700, color: amtColor, whiteSpace: "nowrap" }}>
                                      {amtPrefix}{formatINR(Math.abs(Number(txn.amount)), localizationData?.data)}
                                    </Box>
                                    <Box component="td" sx={{ px: 2, py: 2.25, color: "#374151", whiteSpace: "nowrap" }}>
                                      {formatINR(Number(txn.runningBalance), localizationData?.data)}
                                    </Box>
                                    <Box component="td" sx={{ px: 2, py: 2.25, textAlign: "center", whiteSpace: "nowrap" }}>
                                      {Number(txn.additionCount) > 0
                                        ? <Box sx={{ display: "inline-block", px: 1, py: 0.25, borderRadius: "6px", fontSize: 14, fontWeight: 600, bgcolor: "#DCFCE7", color: "#059669" }}>+{txn.additionCount}</Box>
                                        : <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>—</Typography>}
                                    </Box>
                                    <Box component="td" sx={{ px: 2, py: 2.25, textAlign: "center", whiteSpace: "nowrap" }}>
                                      {Number(txn.deletionCount) > 0
                                        ? <Box sx={{ display: "inline-block", px: 1, py: 0.25, borderRadius: "6px", fontSize: 14, fontWeight: 600, bgcolor: "#FEE2E2", color: "#DC2626" }}>−{txn.deletionCount}</Box>
                                        : <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>—</Typography>}
                                    </Box>
                                    <Box component="td" sx={{ px: 2, py: 2.25, color: "#6B7280" }}>
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.55, color: "#374151", ...clamp2 }}>
                                        {bankNameVal || "—"}{referenceIdVal ? `, ${referenceIdVal}` : ""}
                                      </Typography>
                                    </Box>
                                    <Box component="td" sx={{ px: 2, py: 2.25, color: "#6B7280" }}>
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.55, color: "#374151", ...clamp2 }}>
                                        {txn.endorsementNumber || "—"}{txn.endorsementType ? ` · ${txn.endorsementType}` : ""}
                                      </Typography>
                                    </Box>
                                    <Box component="td" sx={{ px: 2, py: 2.25, color: "#6B7280" }}>
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.55, color: "#374151", ...clamp2 }}>
                                        {txn.remarks || "—"}{txn.createdBy ? ` · by ${txn.createdBy}` : ""}
                                      </Typography>
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        </Box>
                        {/* Pagination — always visible */}
                        <Box sx={{ px: 2, py: 1.25, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E9EEF5" }}>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#98A2B3" }}>
                            {cdTxnRecordCount > 0
                              ? `Showing ${(cdTxnCurrentPage - 1) * cdTxnPageSize + 1}–${Math.min(cdTxnCurrentPage * cdTxnPageSize, cdTxnRecordCount)} of ${cdTxnRecordCount} transactions`
                              : "No transactions"}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.55 }}>
                            {(() => {
                              const windowSize = 5;
                              const half = Math.floor(windowSize / 2);
                              const winStart = Math.max(1, Math.min(cdTxnCurrentPage - half, cdTxnTotalPages - windowSize + 1));
                              const winEnd = Math.min(cdTxnTotalPages, winStart + windowSize - 1);
                              const pageItems = ["Previous", ...Array.from({ length: winEnd - winStart + 1 }, (_, i) => String(winStart + i)), "Next"];
                              return pageItems.map((item) => {
                                const active = item === String(cdTxnCurrentPage);
                                return (
                                  <Box
                                    key={item}
                                    onClick={() => {
                                      if (item === "Previous") { setCdTxnPage((p) => Math.max(1, p - 1)); return; }
                                      if (item === "Next") { setCdTxnPage((p) => Math.min(cdTxnTotalPages, p + 1)); return; }
                                      setCdTxnPage(Number(item));
                                    }}
                                    sx={{
                                      minWidth: item.length > 1 ? 64 : 28, height: 28,
                                      px: item.length > 1 ? 1.1 : 0, borderRadius: 999,
                                      border: active ? "none" : "1px solid #E4E7EC",
                                      background: active ? "#2F74D6" : "#fff",
                                      color: active ? "#fff" : "#667085",
                                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                                      fontSize: 15, lineHeight: 1.7, cursor: "pointer",
                                    }}
                                  >
                                    {item}
                                  </Box>
                                );
                              });
                            })()}
                          </Box>
                        </Box>
                      </>
                    );
                  })()}
                </Box>
              </>
            ) : (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563" }}>
                  No CD data available for this policy.
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* ══ Claim Ratio ═══════════════════════════════════════════════ */}
        {activeTab === "claims" && (
          <>
            {claimsSection === "analytics" && (
              isNonLife && !analyticsBackendLoading && claimAnalyticsData.length === 0 ? (
                <Box sx={{ py: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5, borderRadius: "14px", bgcolor: "#fff", border: "1px solid #E5E7EB" }}>
                  <Box sx={{ width: 60, height: 60, borderRadius: "50%", bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText size={26} color="#D1D5DB" />
                  </Box>
                  <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#374151" }}>No Claims Graphs</Typography>
                  <Typography sx={{ fontSize: 15, color: "#9CA3AF", textAlign: "center", maxWidth: 340, lineHeight: 1.6 }}>No claims data available for this policy during the current period.</Typography>
                </Box>
              ) : (
              <>
                {/* Claim TAT — stat cards (only shown before entering tatStripMode) */}
                {!tatStripMode && (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827" }}>Claim TAT Overview</Typography>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", mt: 0.75 }}>Click a status to filter claim history</Typography>
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1.5 }}>
                      {claimTatCards.map((card) => {
                        const isClickable = card.id !== "all";
                        const tatBenchmark = card.id === "all" ? 30 : card.id === "Ready For Payment" ? 21 : card.id === "PENDING" ? 45 : card.id === "Claim Denied" ? 14 : 30;
                        const tatStatus = card.avgTat === 0 ? "neutral" : card.avgTat <= tatBenchmark * 0.7 ? "good" : card.avgTat <= tatBenchmark ? "fair" : "slow";
                        const tatColor = tatStatus === "good" ? "#059669" : tatStatus === "fair" ? "#D97706" : tatStatus === "slow" ? "#DC2626" : "#6B7280";
                        const tatBg = tatStatus === "good" ? "#F0FDF4" : tatStatus === "fair" ? "#FFFBEB" : tatStatus === "slow" ? "#FEF2F2" : "#F9FAFB";
                        return (
                          <Box
                            key={card.id}
                            onClick={() => {
                              if (isClickable) {
                                // card.id is this card's internal bucket key ("Ready For
                                // Payment"/"Claim Denied"/etc, used for benchmarks above) —
                                // NOT the display label. draft.status/claimStatus must hold
                                // the same label the Status chips below use ("Approved" etc),
                                // so the chip highlighting stays in sync and there's exactly
                                // one place (the policy_claim_history query params) that
                                // translates label -> real DB value.
                                setPatchDraft({ status: card.label });
                                // Apply filter directly (draft state update is async)
                                setClaimStatus(card.label);
                                setClaimTypeFilter(draft.claimType);
                                setClaimDateFromFilter(draft.claimDateFrom);
                                setClaimDateToFilter(draft.claimDateTo);
                                setClaimNoFilter(draft.claimNo);
                                setClaimSearchFilter(draft.searchText);
                                setSettlementDateFromFilter(draft.settlementDateFrom);
                                setSettlementDateToFilter(draft.settlementDateTo);
                                setAmountMinFilter(draft.amountMin);
                                setAmountMaxFilter(draft.amountMax);
                                setTatFilter(draft.tat);
                                setSearch("");
                                setDebouncedSearch("");
                                setPage(0);
                                setHasRunFilter(true);
                                // Scroll to Claim Search section
                                requestAnimationFrame(() => {
                                  requestAnimationFrame(() => {
                                    claimHistoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                  });
                                });
                              }
                            }}
                            sx={{
                              borderRadius: "14px",
                              border: `1.5px solid ${card.accent}33`,
                              bgcolor: card.accentBg,
                              p: 3.2,
                              cursor: isClickable ? "pointer" : "default",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                              transition: "all 0.15s ease",
                              display: "flex", flexDirection: "column", gap: 2.4,
                              "&:hover": isClickable ? { borderColor: card.accent, boxShadow: `0 4px 14px ${card.accent}30`, transform: "translateY(-1px)" } : {},
                            }}
                          >
                            {/* Label */}
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: card.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              {card.label}
                            </Typography>
                            {/* Claims | divider | Avg TAT */}
                            <Box sx={{ display: "flex", alignItems: "stretch" }}>
                              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", pr: 1.25 }}>
                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", mb: 0.75 }}>Claims</Typography>
                                <Typography sx={{ fontSize: 28, fontWeight: 800, color: card.accent, lineHeight: 1 }}>{card.count}</Typography>
                              </Box>
                              <Box sx={{ width: "1px", bgcolor: `${card.accent}33`, flexShrink: 0 }} />
                              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", pl: 1.25 }}>
                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", mb: 0.75 }}>Avg TAT</Typography>
                                <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#374151", lineHeight: 1 }}>
                                  {card.avgTat > 0 ? <>{card.avgTat}<Box component="span" sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#6B7280" }}>d</Box></> : <Box component="span" sx={{ fontSize: 15, fontWeight: 500, color: "#9CA3AF" }}>—</Box>}
                                </Typography>
                              </Box>
                            </Box>
                            {/* CTA */}
                            {isClickable && (
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mt: "auto", px: 1.25, py: 1.2, borderRadius: "8px", bgcolor: "#fff", border: `1px solid ${card.accent}33`, "&:hover": { bgcolor: card.accentBg, borderColor: `${card.accent}66` }, transition: "all 0.15s" }}>
                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: card.accent }}>View {card.label}</Typography>
                                <ChevronRight size={12} color={card.accent} />
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {!tatStripMode && analyticsBackendError && (
                  <Box
                    sx={{
                      mb: 2, px: 2, py: 1, borderRadius: "8px",
                      bgcolor: "#FFF7ED", border: "1px solid #FED7AA",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2,
                    }}
                  >
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#92400E" }}>
                      Some analytics data could not load — showing fallback.
                    </Typography>
                    <Box
                      onClick={() => void claimAnalyticsRefetch()}
                      sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#92400E", cursor: "pointer", whiteSpace: "nowrap", textDecoration: "underline" }}
                    >
                      Retry
                    </Box>
                  </Box>
                )}

                {/* ── Analytics skeleton — shown while charts are fetching ── */}
                {!tatStripMode && analyticsBackendLoading && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
                    {/* ICR / bar chart card skeleton */}
                    <Box
                      sx={{
                        borderRadius: "12px", border: "1px solid #E5EAF3", overflow: "hidden",
                        height: 320,
                        background: "linear-gradient(90deg, #E7EAEE 25%, #F0F3F6 50%, #E7EAEE 75%)",
                        backgroundSize: "800px 100%",
                        "@keyframes shimmer": { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
                        animation: "shimmer 1.4s infinite linear",
                      }}
                    />
                    {/* Monthly trend chart skeleton */}
                    <Box
                      sx={{
                        borderRadius: "12px", border: "1px solid #E5EAF3", overflow: "hidden",
                        height: 260,
                        background: "linear-gradient(90deg, #E7EAEE 25%, #F0F3F6 50%, #E7EAEE 75%)",
                        backgroundSize: "800px 100%",
                        animation: "shimmer 1.4s infinite linear",
                      }}
                    />
                    {/* Top 10 row — hospitals + diseases side-by-side */}
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                      {[0, 1].map((i) => (
                        <Box
                          key={i}
                          sx={{
                            borderRadius: "12px", border: "1px solid #E5EAF3", overflow: "hidden",
                            height: 280,
                            background: "linear-gradient(90deg, #E7EAEE 25%, #F0F3F6 50%, #E7EAEE 75%)",
                            backgroundSize: "800px 100%",
                            animation: "shimmer 1.4s infinite linear",
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* CLAIM ANALYTICS card — hidden while analytics are loading */}
                {!tatStripMode && !analyticsBackendLoading && claimGroups && (() => {
                  const thresholdIcr = Number(claimGroups.groups.find((g) => g.key === "lyt")?.icr ?? 0);
                  const curGroupIcr = Number(claimGroups.groups.find((g) => g.key === "cur")?.icr ?? 0);
                  const icrVsSamePeriod = curGroupIcr - thresholdIcr;
                  const samePeriodDeltaGood = icrVsSamePeriod <= 0;

                  const predIcr = Number(claimGroups.groups.find((g) => g.key === "pred")?.icr ?? 0);
                  // Premium for visualization: prefer direct premium when meaningful,
                  // otherwise back-calculate from claims & ICR (cap ICR for visibility)
                  // This handles test data where net_premium is too small relative to claims
                  const derivePremiumL = (incurredL: number, icr: number, directPremL: number): number => {
                    if (directPremL > 0 && (incurredL <= 0 || directPremL >= incurredL * 0.1)) {
                      return directPremL;
                    }
                    if (incurredL > 0) {
                      const effectiveIcr = Math.min(Math.max(icr, 30), 200);
                      return (incurredL * 100) / effectiveIcr;
                    }
                    return directPremL;
                  };

                  const predGroup = claimGroups.groups.find((g) => g.key === "pred");
                  const predPremiumL = predGroup
                    ? derivePremiumL(predGroup.incurred, Number(predGroup.icr), predGroup.premium)
                    : 0;
                  // Forecast amounts in rupees for formatINR
                  const aiIncurred = predGroup && predGroup.incurred > 0 ? predGroup.incurred * 100000 : null;
                  const aiPremium = predPremiumL > 0 ? predPremiumL * 100000 : null;

                  // ── Monthly trend chart data ────────────────────────────────
                  // Build month-by-month bars: premium (estimated) + claims (actual)
                  // Forecast: append 2 projected months using current trend
                  const monthlyRows = claimsMonthlyData ?? [];
                  const netPremiumTotal = (policyRow?.netPremium ?? 0);
                  const activeMths = monthlyRows.length > 0 ? monthlyRows.length : 12;
                  const monthlyPremiumEst = netPremiumTotal > 0 ? netPremiumTotal / activeMths : 0;

                  // If all monthly settled amounts are 0 (claims still pending),
                  // distribute policyRow.claimAmount proportionally by claim count per month
                  const totalMonthlyAmounts = monthlyRows.reduce((s, m) => s + Number(m.cashlessAmount) + Number(m.reimbursementAmount), 0);
                  const totalClaimAmt = policyRow?.claimAmount ?? 0;
                  const totalMonthlyCount = monthlyRows.reduce((s, m) => s + Number(m.cashlessCount) + Number(m.reimbursementCount), 0);
                  const useFallbackAmounts = totalMonthlyAmounts === 0 && totalClaimAmt > 0;

                  // Build actual month points — chart shows only up to current month, no forecast bars
                  const monthlyChartPoints = monthlyRows.map((m) => {
                     let claimsAmt = Number(m.cashlessAmount) + Number(m.reimbursementAmount);
                    if (useFallbackAmounts && totalMonthlyCount > 0) {
                      const mCount = Number(m.cashlessCount) + Number(m.reimbursementCount);
                      claimsAmt = (totalClaimAmt * mCount) / totalMonthlyCount;
                    } else if (useFallbackAmounts) {
                      claimsAmt = totalClaimAmt / activeMths;
                    }
                    return {
                      month: m.month,
                      premium: Math.round(monthlyPremiumEst / 100) / 10,
                      claims: Math.round(claimsAmt / 100000 * 10) / 10,
                      claimsRaw: claimsAmt,
                      isForecast: false,
                    };
                  });

                  // Keep forecastPoints for the forecast callout card computation only
                  const forecastMonthLabels = ["Forecast M+1", "Forecast M+2"];
                  const recentAvgClaims = monthlyRows.length >= 3
                    ? monthlyRows.slice(-3).reduce((s, m) => s + Number(m.cashlessAmount) + Number(m.reimbursementAmount), 0) / 3
                    : (monthlyRows.length > 0 ? monthlyRows.reduce((s, m) => s + Number(m.cashlessAmount) + Number(m.reimbursementAmount), 0) / monthlyRows.length : 0);
                  const forecastClaims = Math.round(recentAvgClaims / 100000 * 10) / 10;
                  const forecastPoints = monthlyRows.length > 0 ? forecastMonthLabels.map((lbl) => ({
                    month: lbl,
                    premium: Math.round(monthlyPremiumEst / 100) / 10,
                    claims: forecastClaims,
                    claimsRaw: recentAvgClaims,
                    isForecast: true,
                  })) : [];

                  // Chart uses only actual months up to and including the current month
                  const _nowDate = new Date();
                  const _nowY = _nowDate.getFullYear(); const _nowM = _nowDate.getMonth();
                  const _mns = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                  const allMonthlyPoints = monthlyChartPoints.filter((d) => {
                    const parts = d.month.split(" '");
                    if (parts.length !== 2) return true;
                    const mi = _mns.indexOf(parts[0]); const fy = 2000 + parseInt(parts[1], 10);
                    return mi !== -1 && (fy < _nowY || (fy === _nowY && mi <= _nowM));
                  });
                  const useMonthlyChart = monthlyChartPoints.length > 0;

                  const mAmtMax = Math.max(...monthlyChartPoints.map((d) => d.claims), 1);
                  const mYMax = Math.ceil(mAmtMax / 5) * 5 + Math.ceil(mAmtMax * 0.15);
                  const fmtLakh = (v: number) => {
                    const sym = getCurrencySymbolPrefix(localizationData?.data);
                    if (v === 0) return `${sym}0`;
                    if (v >= 10000) return `${sym}${Math.round(v / 100)}Cr`;
                    if (v >= 100) return `${sym}${(v / 100).toFixed(1)}Cr`;
                    if (v < 1) return `${formatAmountWithCurrency(Math.round(v * 100000), localizationData?.data)}`;
                    return `${sym}${v.toFixed(1)}L`;
                  };

                  // Forecast ICR for the callout card
                  const icrForForecast = forecastClaims > 0 && monthlyPremiumEst > 0
                    ? Math.round((forecastClaims / Math.round(monthlyPremiumEst / 100000 * 10) * 10) * 100) / 100
                    : predIcr;

                  const premiumLabelColorMap: Record<string, string> = {
                    lyav: "#6EE7B7",
                    lyt: "#FDBA74",
                    cur: "#93C5FD",
                    pred: "#C4B5FD",
                  };
                  const icrPeriodData = claimGroups.groups.map((g) => ({
                    shortLabel: g.key === "lyav" ? "Last Year Full" : g.key === "lyt" ? "Last Year Same Period" : g.key === "cur" ? "Current YTD" : "Forecast(2027)",
                    label: g.key === "lyav" ? "Last Year Full" : g.key === "lyt" ? "Last Year Same Period" : g.key === "cur" ? "Current Year to Date" : "Forecast",
                    claimsAmount: Math.round(g.incurred * 10) / 10,
                    incurredPremium: Math.round(g.premium * 10) / 10,
                    icr: Math.round(Number(g.icr) * 10) / 10,
                    isPredicted: g.key === "pred",
                    claimsColor: g.barClaimsColor,
                    premiumColor: g.barIncurredColor,
                    premiumLabelColor: premiumLabelColorMap[g.key] ?? "#6B7280",
                  }));
                  const icrPredRow = icrPeriodData.find((d) => d.isPredicted);
                  const icrAmtMax = Math.max(...icrPeriodData.flatMap((d) => [d.claimsAmount, d.incurredPremium]), 1);
                  const icrYMax = Math.ceil(icrAmtMax / 5) * 5 + Math.ceil(icrAmtMax * 0.15);

                  return (
                    <>
                    {/* ── Incurred Claims Ratio by Period ── */}
                    <Box sx={{ bgcolor: "#ffffff", borderRadius: "12px", border: "1px solid #E5EAF3", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", mb: 2 }}>
                      <Box sx={{ px: 3, pt: 2.5, pb: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <Box>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827" }}>Incurred Claims Ratio by Period</Typography>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", mt: 0.25 }}>Claims amount vs. incurred premium across periods</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ px: 3, pt: 1, pb: 2.5, display: "flex", gap: 2.5, alignItems: "flex-start" }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <ResponsiveContainer width="100%" height={310}>
                            <BarChart data={icrPeriodData} margin={{ top: 24, right: 4, left: 16, bottom: 4 }} barCategoryGap="28%" barGap={4}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
                              <YAxis tick={{ fontSize: 15, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => {
                                const sym = getCurrencySymbolPrefix(localizationData?.data);
                                if (v === 0) return `${sym}0`;
                                if (v >= 10000) return `${sym}${Math.round(v / 100)}Cr`;
                                if (v >= 100) return `${sym}${(v / 100).toFixed(1)}Cr`;
                                return `${sym}${v.toFixed(1)}L`;
                              }} width={72} domain={[0, icrYMax]} />
                              <XAxis dataKey="shortLabel" axisLine={false} tickLine={false} height={92}
                                tick={(tickProps: Record<string, unknown>) => {
                                  const { x, y, payload } = tickProps as { x: number; y: number; payload: { value: string } };
                                  const isPred = payload.value === "Forecast";
                                  const row = icrPeriodData.find((d) => d.shortLabel === payload.value);
                                  const boxColor = row?.claimsColor ?? "#9CA3AF";
                                  const icrLabel = `ICR: ${row?.icr ?? 0}%`;
                                  const boxW = 82; const boxH = 22; const boxX = x - boxW / 2; const boxY = y + 62;
                                  return (
                                    <g>
                                      <text x={x} y={y + 52} textAnchor="middle" fill={isPred ? "#7C3AED" : "#6B7280"} fontSize={13} fontWeight={isPred ? 700 : 500}>{payload.value}</text>
                                      <rect x={boxX} y={boxY} width={boxW} height={boxH} rx={11} fill={boxColor} fillOpacity={0.15} />
                                      <text x={x} y={boxY + 15} textAnchor="middle" fill={boxColor} fontSize={12} fontWeight={700}>{icrLabel}</text>
                                    </g>
                                  );
                                }}
                              />
                              <RechartTooltip cursor={false} content={({ active, payload }) => {
                                if (!active || !payload?.length || !icrHoveredBar) return null;
                                const d = payload[0]?.payload as typeof icrPeriodData[0];
                                if (icrHoveredBar === "premium") {
                                  return (
                                    <Box sx={{ bgcolor: "#1F2937", px: 1.5, py: 1.25, borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", minWidth: 170 }}>
                                      <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#fff", mb: 0.75 }}>{d.label}</Typography>
                                      <Typography sx={{ fontSize: 15, color: "#9CA3AF" }}>Incurred Premium</Typography>
                                      <Typography sx={{ fontSize: 15, fontWeight: 700, color: d.premiumLabelColor }}>{getCurrencySymbolPrefix(localizationData?.data)}{d.incurredPremium}L</Typography>
                                    </Box>
                                  );
                                }
                                return (
                                  <Box sx={{ bgcolor: "#1F2937", px: 1.5, py: 1.25, borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", minWidth: 170 }}>
                                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#fff", mb: 0.75 }}>{d.label}</Typography>
                                    <Typography sx={{ fontSize: 15, color: "#9CA3AF", mt: 0.5 }}>Claim Amount</Typography>
                                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: d.claimsColor }}>{getCurrencySymbolPrefix(localizationData?.data)}{d.claimsAmount}L</Typography>
                                  </Box>
                                );
                              }} />
                              <Bar dataKey="incurredPremium" maxBarSize={36} name="Incurred Premium" isAnimationActive={false}
                                onMouseEnter={() => setIcrHoveredBar("premium")}
                                onMouseLeave={() => setIcrHoveredBar(null)}
                                shape={(props: Record<string, unknown>) => {
                                  const bx = props.x as number; const by = props.y as number; const bw = props.width as number; const bh = props.height as number; const idx = props.index as number;
                                  const item = icrPeriodData[idx];
                                  const color = item?.premiumLabelColor ?? "#059669";
                                  const minH = 4; const effH = Math.max(bh, minH); const effY = by + bh - effH;
                                  const valLabel = (item?.incurredPremium ?? 0) === 0 ? `${getCurrencySymbolPrefix(localizationData?.data)}0` : fmtLakh(item?.incurredPremium ?? 0);
                                  if (item?.isPredicted) return (
                                    <g>
                                      <rect x={bx} y={effY} width={bw} height={effH} rx={3} fill={color} fillOpacity={0.7} />
                                      <rect x={bx} y={effY} width={bw} height={effH} rx={3} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="4 2" />
                                      <text x={bx + bw / 2} y={effY - 5} textAnchor="middle" fill={color} fontSize={10} fontWeight={700}>{valLabel}</text>
                                    </g>
                                  );
                                  return (
                                    <g>
                                      <rect x={bx} y={effY} width={bw} height={effH} rx={3} fill={color} />
                                      <text x={bx + bw / 2} y={effY - 5} textAnchor="middle" fill={color} fontSize={10} fontWeight={700}>{valLabel}</text>
                                    </g>
                                  );
                                }}>
                                {icrPeriodData.map((d) => <Cell key={d.shortLabel} fill={d.premiumLabelColor} />)}
                                <LabelList content={(props: Record<string, unknown>) => {
                                  const lx = props.x as number; const lw = props.width as number; const ly = props.y as number; const lh = props.height as number; const idx = props.index as number;
                                  const item = icrPeriodData[idx];
                                  const cx = lx + lw / 2;
                                  const effH = Math.max(lh, 4); const effY = ly + lh - effH;
                                  return (
                                    <text key={`prem-lbl-${idx}`} x={cx} y={effY + effH + 12} textAnchor="middle" fill={item?.premiumLabelColor ?? "#6B7280"} fontSize={11} fontWeight={600}>
                                      <tspan x={cx} dy={0}>Incurred</tspan>
                                      <tspan x={cx} dy={14}>Premium</tspan>
                                    </text>
                                  );
                                }} />
                              </Bar>
                              <Bar dataKey="claimsAmount" maxBarSize={36} name="Claim Amount" isAnimationActive={false}
                                onMouseEnter={() => setIcrHoveredBar("claims")}
                                onMouseLeave={() => setIcrHoveredBar(null)}
                                shape={(props: Record<string, unknown>) => {
                                  const bx = props.x as number; const by = props.y as number; const bw = props.width as number; const bh = props.height as number; const idx = props.index as number;
                                  const item = icrPeriodData[idx];
                                  const color = item?.claimsColor ?? "#2563EB";
                                  const minH = 4; const effH = Math.max(bh, minH); const effY = by + bh - effH;
                                  const valLabel = (item?.claimsAmount ?? 0) === 0 ? `${getCurrencySymbolPrefix(localizationData?.data)}0` : fmtLakh(item?.claimsAmount ?? 0);
                                  const labelColor = item?.isPredicted ? "#7C3AED" : color;
                                  if (item?.isPredicted) return (
                                    <g>
                                      <rect x={bx} y={effY} width={bw} height={effH} rx={3} fill={color} fillOpacity={0.7} />
                                      <rect x={bx} y={effY} width={bw} height={effH} rx={3} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="4 2" />
                                      <text x={bx + bw / 2} y={effY - 5} textAnchor="middle" fill={labelColor} fontSize={10} fontWeight={700}>{valLabel}</text>
                                    </g>
                                  );
                                  return (
                                    <g>
                                      <rect x={bx} y={effY} width={bw} height={effH} rx={3} fill={color} />
                                      <text x={bx + bw / 2} y={effY - 5} textAnchor="middle" fill={labelColor} fontSize={10} fontWeight={700}>{valLabel}</text>
                                    </g>
                                  );
                                }}>
                                {icrPeriodData.map((d) => <Cell key={d.shortLabel} fill={d.claimsColor} />)}
                                <LabelList content={(props: Record<string, unknown>) => {
                                  const lx = props.x as number; const lw = props.width as number; const ly = props.y as number; const lh = props.height as number; const idx = props.index as number;
                                  const item = icrPeriodData[idx];
                                  const cx = lx + lw / 2;
                                  const effH = Math.max(lh, 4); const effY = ly + lh - effH;
                                  return (
                                    <text key={`claims-lbl-${idx}`} x={cx} y={effY + effH + 12} textAnchor="middle" fill={item?.isPredicted ? "#7C3AED" : (item?.claimsColor ?? "#2563EB")} fontSize={11} fontWeight={700}>
                                      <tspan x={cx} dy={0}>Claim</tspan>
                                      <tspan x={cx} dy={14}>Amount</tspan>
                                    </text>
                                  );
                                }} />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </Box>
                        {/* Forecast panel */}
                        {icrPredRow && (
                          <Box sx={{ flexShrink: 0, width: 180, borderRadius: "10px", border: "1px solid #EDE9FE", bgcolor: "#FAF8FF", p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                              <Box sx={{ width: 14, height: 14, borderRadius: 2, border: "1.5px dashed #7C3AED", bgcolor: "#EDE9FE" }} />
                              <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#7C3AED", letterSpacing: "0.07em" }}>FORECAST (2027)</Typography>
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: 15, color: "#9CA3AF", fontWeight: 500, mb: 0.5 }}>Expected ICR</Typography>
                              <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#7C3AED", letterSpacing: "-0.4px", lineHeight: 1.25 }}>{icrPredRow.icr}%</Typography>
                            </Box>
                            <Box sx={{ width: "100%", height: "1px", bgcolor: "#EDE9FE" }} />
                            <Box>
                              <Typography sx={{ fontSize: 15, color: "#9CA3AF", fontWeight: 500, mb: 0.5 }}>Claims Amount</Typography>
                              <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>est. {getCurrencySymbolPrefix(localizationData?.data)}{icrPredRow.claimsAmount}L</Typography>
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: 15, color: "#9CA3AF", fontWeight: 500, mb: 0.5 }}>Incurred Premium</Typography>
                              <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>est. {getCurrencySymbolPrefix(localizationData?.data)}{icrPredRow.incurredPremium}L</Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* ── Monthly Claims Trend ── */}
                    <Box sx={{ bgcolor: "#ffffff", borderRadius: "12px", border: "1px solid #E5EAF3", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", mb: 2 }}>
                      {/* Header */}
                      <Box sx={{ px: 3, pt: 2.5, pb: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <Box>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827" }}>Monthly Claims Trend</Typography>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", mt: 0.75 }}>Monthly claim amounts with ICR trend · actual data only</Typography>
                        </Box>
                        {/* Legend */}
                        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexShrink: 0, pt: 0.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: "#34D399", flexShrink: 0 }} />
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280" }}>Claim Amount</Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Box sx={{ width: 18, height: 2, bgcolor: "#F59E0B", borderRadius: 1, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280" }}>ICR Trend</Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <svg width="20" height="10" style={{ flexShrink: 0 }}>
                              <line x1="0" y1="5" x2="20" y2="5" stroke="#6366F1" strokeWidth="2" strokeDasharray="5 3" />
                            </svg>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280" }}>Last Year ICR</Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Body */}
                      <Box sx={{ px: 3, pt: 1, pb: 2.5, display: "flex", gap: 2.5, alignItems: "flex-start" }}>
                        {/* Chart */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          {useMonthlyChart ? (() => {
                            // Actual months only — no forecast, no projections
                            const lyFullIcrVal = Number(claimGroups.groups.find((g) => g.key === "lyav")?.icr ?? 0);
                            const lyIcrFlat = thresholdIcr > 0 ? thresholdIcr : lyFullIcrVal > 0 ? lyFullIcrVal : null;
                            const chartData = allMonthlyPoints.map((d) => ({
                              ...d,
                              icr: d.premium > 0 ? Math.round((d.claims / d.premium) * 100 * 10) / 10 : null,
                              icrRaw: d.premium > 0 ? Math.round((d.claims / d.premium) * 100 * 10) / 10 : null,
                              lyIcr: lyIcrFlat,
                            }));

                            const icrVals = chartData.map((d) => d.icr ?? 0).filter((v) => v > 0);
                            const icrRawMax = Math.max(icrVals.length > 0 ? Math.max(...icrVals) : 100, lyIcrFlat ?? 0);
                            // Smart ICR axis formatter
                            const fmtIcr = (v: number) => {
                              if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M%`;
                              if (v >= 1_000) return `${Math.round(v / 1_000)}K%`;
                              return `${Math.round(v)}%`;
                            };
                            const icrMax = Math.ceil(icrRawMax / (icrRawMax >= 1000 ? 1000 : 10)) * (icrRawMax >= 1000 ? 1000 : 10) + (icrRawMax >= 1000 ? 1000 : 10);
                            // Left axis uses claims-only max so bars are always visible
                            const claimsOnlyMax = Math.max(...chartData.map((d) => d.claims), 1);
                            const claimsYMax = Math.ceil(claimsOnlyMax / 5) * 5 + Math.ceil(claimsOnlyMax * 0.2);
                            // Forecast panel computation
                            const actualIcrPoints = chartData.filter(d => d.icr != null && (d.icr as number) > 0);
                            const latestIcr = actualIcrPoints.length > 0 ? (actualIcrPoints[actualIcrPoints.length - 1].icr as number) : null;
                            const fcastAvg = icrVals.length > 0 ? icrVals.reduce((a, b) => a + b, 0) / icrVals.length : null;
                            const forecastIcr = latestIcr ?? fcastAvg;
                            const forecastChange = (forecastIcr != null && lyIcrFlat != null && lyIcrFlat > 0) ? +(forecastIcr - lyIcrFlat).toFixed(1) : null;
                            const forecastIsUp = forecastChange != null ? forecastChange >= 0 : (forecastIcr != null ? forecastIcr > 0 : null);
                            const fmtFcst = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M%` : v >= 1_000 ? `${(v / 1_000).toFixed(1)}K%` : `${v.toFixed(1)}%`;
                            const forecastDisplay2 = forecastIcr != null ? fmtFcst(forecastIcr) : "—";
                            const lyIcrDisplay2 = lyIcrFlat != null && lyIcrFlat > 0 ? fmtFcst(lyIcrFlat) : "N/A";
                            const changeAbs = forecastChange != null ? Math.abs(forecastChange) : null;
                            const changeFmt = changeAbs != null ? (changeAbs >= 1_000 ? `${(changeAbs / 1_000).toFixed(1)}K%` : `${changeAbs.toFixed(1)}%`) : null;
                            const forecastYear = new Date().getFullYear() + 1;
                            return (
                            <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "stretch" }}>
                              {/* Left axis title */}
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, flexShrink: 0 }}>
                                <Typography sx={{ fontSize: 15, color: "#9CA3AF", fontWeight: 600, whiteSpace: "nowrap", transform: "rotate(-90deg)", letterSpacing: "0.04em" }}>Claim Amount</Typography>
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height={280}>
                              <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 28 }} barCategoryGap="40%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 15, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={0} />
                                {/* Left axis — claim amount */}
                                <YAxis yAxisId="claims" orientation="left" width={84} tick={{ fontSize: 15, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={fmtLakh} domain={[0, claimsYMax]} />
                                {/* Right axis — ICR % with smart K/M formatter */}
                                <YAxis yAxisId="icr" orientation="right" width={56} tick={{ fontSize: 15, fill: "#F59E0B" }} axisLine={false} tickLine={false} tickFormatter={fmtIcr} domain={[0, icrMax]} />
                                <RechartTooltip
                                  cursor={{ fill: "rgba(107,142,245,0.05)" }}
                                  content={({ active, payload, label }) => {
                                    if (!active || !payload?.length) return null;
                                    const d = payload[0]?.payload as typeof chartData[0];
                                    return (
                                      <Box sx={{ bgcolor: "#1F2937", px: 1.75, py: 1.5, borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.18)", minWidth: 170 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
                                          {d.isForecast && <Sparkles size={12} color="#A78BFA" />}
                                          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{label as string}</Typography>
                                          {d.isForecast && <Box sx={{ px: 0.75, borderRadius: "4px", bgcolor: "#7C3AED22", border: "1px solid #7C3AED44" }}><Typography sx={{ fontSize: 15, color: "#A78BFA", fontWeight: 700 }}>FORECAST (2027)</Typography></Box>}
                                        </Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 0.5 }}>
                                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: d.isForecast ? "#A78BFA" : "#34D399" }} /><Typography sx={{ fontSize: 15, color: "#9CA3AF" }}>Claims</Typography></Box>
                                          <Typography sx={{ fontSize: 15, fontWeight: 600, color: d.isForecast ? "#A78BFA" : "#D1D5DB" }}>{fmtLakh(d.claims)}{d.isForecast ? " (est.)" : ""}</Typography>
                                        </Box>
                                        {d.icrRaw != null && (
                                          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Box sx={{ width: 14, height: 2, bgcolor: "#F59E0B", borderRadius: 1 }} /><Typography sx={{ fontSize: 15, color: "#9CA3AF" }}>ICR</Typography></Box>
                                            <Typography sx={{ fontSize: 15, fontWeight: 700, color: (d.icrRaw ?? 0) > 80 ? "#F87171" : "#F59E0B" }}>{fmtIcr(d.icrRaw ?? 0)}</Typography>
                                          </Box>
                                        )}
                                        {d.lyIcr != null && (
                                          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Box sx={{ width: 14, height: 2, bgcolor: "#6366F1", borderRadius: 1 }} /><Typography sx={{ fontSize: 15, color: "#9CA3AF" }}>Last Year ICR</Typography></Box>
                                            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#6366F1" }}>{fmtIcr(d.lyIcr)}</Typography>
                                          </Box>
                                        )}
                                      </Box>
                                    );
                                  }}
                                />
                                {/* Single claims bar */}
                                <Bar yAxisId="claims" dataKey="claims" name="Claim Amount" maxBarSize={40}
                                  shape={(props: Record<string, unknown>) => {
                                    const bx = props.x as number; const by = props.y as number;
                                    const bw = props.width as number; const bh = props.height as number;
                                    const d = chartData[props.index as number];
                                    if (!d || bh <= 0) return <g />;
                                    const col = d.isForecast ? "#A78BFA" : "#34D399";
                                    return d.isForecast ? (
                                      <g>
                                        <rect x={bx} y={by} width={bw} height={bh} rx={4} fill={col} fillOpacity={0.5} />
                                        <rect x={bx} y={by} width={bw} height={bh} rx={4} fill="none" stroke={col} strokeWidth={1.5} strokeDasharray="4 2" />
                                      </g>
                                    ) : <rect x={bx} y={by} width={bw} height={bh} rx={4} fill={col} />;
                                  }}
                                />
                                {/* ICR trend line */}
                                <Line yAxisId="icr" dataKey="icr" name="ICR %" type="monotone" stroke="#F59E0B" strokeWidth={2.5}
                                  strokeDasharray={(undefined as unknown as string)}
                                  dot={(dotProps: Record<string, unknown>) => {
                                    const { cx, cy, payload } = dotProps as { cx: number; cy: number; payload: typeof chartData[0] };
                                    if (payload.icr == null) return <g />;
                                    if (payload.icr == null) return <g />;
                                    const col = payload.isForecast ? "#A78BFA" : "#F59E0B";
                                    return <circle cx={cx} cy={cy} r={4} fill={col} stroke="#fff" strokeWidth={1.5} />;
                                  }}
                                  connectNulls
                                />
                                {/* LY ICR flat trend line */}
                                <Line yAxisId="icr" dataKey="lyIcr" name="Last Year ICR" type="monotone" stroke="#6366F1" strokeWidth={2} strokeDasharray="6 3"
                                  dot={(dotProps: Record<string, unknown>) => {
                                    const { cx, cy, payload } = dotProps as { cx: number; cy: number; payload: typeof chartData[0] };
                                    if (payload.lyIcr == null) return <g />;
                                    return <circle cx={cx} cy={cy} r={4} fill="#6366F1" stroke="#fff" strokeWidth={1.5} />;
                                  }}
                                  connectNulls
                                />
                              </ComposedChart>
                            </ResponsiveContainer>
                              </Box>
                              {/* Right axis title */}
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, flexShrink: 0 }}>
                                <Typography sx={{ fontSize: 15, color: "#F59E0B", fontWeight: 600, whiteSpace: "nowrap", transform: "rotate(90deg)", letterSpacing: "0.04em" }}>ICR %</Typography>
                              </Box>
                            </Box>
                              </Box>
                            </Box>
                            );
                          })() : (
                            <Box sx={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>No monthly data available</Typography>
                            </Box>
                          )}
                        </Box>

                      </Box>
                    </Box>
                    </>
                  );
                })()}

                {/* Claim Distribution card */}
                {!tatStripMode && !analyticsBackendLoading && (() => {
                  const DIST_PALETTE: Record<string, { claimsBar: string; incurredBar: string; accent: string }> = {
                    Self:          { claimsBar: "linear-gradient(180deg, #6B8EF5 0%, #3B5FD8 100%)", incurredBar: "linear-gradient(180deg, #BFD0FC 0%, #6B8EF5 100%)", accent: "#3B5FD8" },
                    Spouse:        { claimsBar: "linear-gradient(180deg, #FBBF24 0%, #D97706 100%)", incurredBar: "linear-gradient(180deg, #FDE68A 0%, #FBBF24 100%)", accent: "#D97706" },
                    Child:         { claimsBar: "linear-gradient(180deg, #34D399 0%, #059669 100%)", incurredBar: "linear-gradient(180deg, #A7F3D0 0%, #34D399 100%)", accent: "#059669" },
                    Parent:        { claimsBar: "linear-gradient(180deg, #A78BFA 0%, #7C3AED 100%)", incurredBar: "linear-gradient(180deg, #DDD6FE 0%, #A78BFA 100%)", accent: "#7C3AED" },
                    Other:         { claimsBar: "linear-gradient(180deg, #94A3B8 0%, #64748B 100%)", incurredBar: "linear-gradient(180deg, #CBD5E1 0%, #94A3B8 100%)", accent: "#64748B" },
                    Cashless:      { claimsBar: "linear-gradient(180deg, #60A5FA 0%, #2563EB 100%)", incurredBar: "linear-gradient(180deg, #93C5FD 0%, #60A5FA 100%)", accent: "#2563EB" },
                    Reimbursement: { claimsBar: "linear-gradient(180deg, #34D399 0%, #059669 100%)", incurredBar: "linear-gradient(180deg, #A7F3D0 0%, #34D399 100%)", accent: "#059669" },
                  };
                  // Every known relation variant gets its own unique color
                  const RELATION_COLOR_MAP: Record<string, string> = {
                    self: "#3B5FD8", spouse: "#D97706", wife: "#F59E0B", husband: "#D97706",
                    child: "#059669", son: "#10B981", daughter: "#34D399",
                    parent: "#7C3AED", mother: "#A78BFA", father: "#6D28D9",
                    "mother-in-law": "#EC4899", "father-in-law": "#DB2777",
                    "parent-in-law": "#F472B6", "in-law": "#F9A8D4",
                    sibling: "#F97316", brother: "#FB923C", sister: "#FED7AA",
                    grandparent: "#06B6D4", grandfather: "#0EA5E9", grandmother: "#38BDF8",
                    dependent: "#64748B", other: "#94A3B8",
                    cashless: "#2563EB", reimbursement: "#059669",
                  };
                  const RELATION_FALLBACK_COLORS = [
                    "#6366F1","#EC4899","#F59E0B","#10B981","#EF4444","#06B6D4",
                    "#F97316","#8B5CF6","#14B8A6","#F43F5E","#84CC16","#0EA5E9",
                  ];
                  const getRelationPal = (name: string): { claimsBar: string; incurredBar: string; accent: string } => {
                    const key = name.toLowerCase().trim();
                    // 1. Exact lower-case match
                    if (RELATION_COLOR_MAP[key]) {
                      const c = RELATION_COLOR_MAP[key];
                      return { claimsBar: c, incurredBar: c, accent: c };
                    }
                    // 2. Longest partial match (e.g. "father in law" hits "father-in-law")
                    const partial = Object.keys(RELATION_COLOR_MAP)
                      .filter((k) => key.includes(k.replace(/-/g, " ")) || key.replace(/-/g, " ").includes(k.replace(/-/g, " ")))
                      .sort((a, b) => b.length - a.length)[0];
                    if (partial) {
                      const c = RELATION_COLOR_MAP[partial];
                      return { claimsBar: c, incurredBar: c, accent: c };
                    }
                    // 3. Stable hash-based unique color for completely unknown values
                    let h = 0;
                    for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
                    const c = RELATION_FALLBACK_COLORS[Math.abs(h) % RELATION_FALLBACK_COLORS.length];
                    return { claimsBar: c, incurredBar: c, accent: c };
                  };
                  const AILMENT_PAL = [
                    { claimsBar: "linear-gradient(180deg, #F472B6 0%, #EC4899 100%)", incurredBar: "linear-gradient(180deg, #FBCFE8 0%, #F472B6 100%)", accent: "#EC4899" },
                    { claimsBar: "linear-gradient(180deg, #FB923C 0%, #EA580C 100%)", incurredBar: "linear-gradient(180deg, #FED7AA 0%, #FB923C 100%)", accent: "#EA580C" },
                    { claimsBar: "linear-gradient(180deg, #34D399 0%, #059669 100%)", incurredBar: "linear-gradient(180deg, #A7F3D0 0%, #34D399 100%)", accent: "#059669" },
                    { claimsBar: "linear-gradient(180deg, #FBBF24 0%, #D97706 100%)", incurredBar: "linear-gradient(180deg, #FEF08A 0%, #FBBF24 100%)", accent: "#D97706" },
                    { claimsBar: "linear-gradient(180deg, #818CF8 0%, #6366F1 100%)", incurredBar: "linear-gradient(180deg, #C7D2FE 0%, #818CF8 100%)", accent: "#6366F1" },
                    { claimsBar: "linear-gradient(180deg, #60A5FA 0%, #2563EB 100%)", incurredBar: "linear-gradient(180deg, #BAE6FD 0%, #60A5FA 100%)", accent: "#2563EB" },
                    { claimsBar: "linear-gradient(180deg, #A78BFA 0%, #7C3AED 100%)", incurredBar: "linear-gradient(180deg, #DDD6FE 0%, #A78BFA 100%)", accent: "#7C3AED" },
                  ];

                  const TABS: { key: "relation" | "type"; label: string }[] = [
                    { key: "relation", label: "By Relation" },
                    { key: "type", label: "Cashless vs Reimbursement" },
                  ];

                  type DistCol = { name: string; claims: number; incurred: number | null; incurredStr: string; claimsBar: string; incurredBar: string; accent: string; pct: number; approvedAmountTotal: number };
                  let cols: DistCol[] = [];

                  if (claimDistribTab === "relation") {
                    const total = Math.max(claimRelationDistribution.reduce((s, r) => s + r.claims, 0), 1);
                    cols = claimRelationDistribution.map((r) => {
                      const pal = getRelationPal(r.name);
                      return { name: r.name, claims: r.claims, incurred: r.incurred, incurredStr: `${r.incurred}L`, claimsBar: pal.claimsBar, incurredBar: pal.incurredBar, accent: pal.accent, pct: Math.round((r.claims / total) * 100), approvedAmountTotal: r.approvedAmountTotal };
                    });
                  } else if (claimDistribTab === "type") {
                    const total = Math.max(claimTypeDistribution.reduce((s, e) => s + e.value, 0), 1);
                    cols = claimTypeDistribution.map((e) => {
                      const pal = DIST_PALETTE[e.name] ?? DIST_PALETTE.Other;
                      return { name: e.name, claims: e.value, incurred: null, incurredStr: "", claimsBar: pal.claimsBar, incurredBar: pal.incurredBar, accent: pal.accent, pct: Math.round((e.value / total) * 100), approvedAmountTotal: e.approvedAmountTotal };
                    });
                  }

                  const totalClaims = cols.reduce((s, c) => s + c.claims, 0);

                  return (
                    <Box
                      sx={{
                        bgcolor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #E5EAF3",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                        mb: 2,
                      }}
                    >
                      {/* Header */}
                      <Box sx={{ px: 3, pt: 2, pb: 4 }}>
                        <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#111827", mb: 4 }}>Claim Distribution</Typography>
                        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
                          {TABS.map(({ key, label }) => {
                            const isActive = claimDistribTab === key;
                            return (
                              <Box
                                key={key}
                                onClick={() => setClaimDistribTab(key)}
                                sx={{
                                  px: 1.5, py: 0.45,
                                  borderRadius: 999,
                                  border: `1px solid ${isActive ? "#2F74D6" : "#E5E7EB"}`,
                                  bgcolor: isActive ? "#2F74D6" : "#F9FAFB",
                                  color: isActive ? "#fff" : "#6B7280",
                                  fontSize: 15, lineHeight: 1.7, fontWeight: isActive ? 600 : 500,
                                  cursor: "pointer", whiteSpace: "nowrap",
                                  userSelect: "none",
                                  transition: "all 0.15s",
                                  "&:hover": { borderColor: "#2F74D6", color: isActive ? "#fff" : "#2F74D6" },
                                }}
                              >
                                {label}
                              </Box>
                            );
                          })}

                          {/* Disabled "By Other Dimension" tab with dropdown */}
                          <Box
                            sx={{
                              display: "inline-flex", alignItems: "center", gap: 0.5,
                              px: 1.5, py: 0.45,
                              borderRadius: 999,
                              border: "1px solid #E5E7EB",
                              bgcolor: "#F3F4F6",
                              cursor: "not-allowed",
                              userSelect: "none",
                              opacity: 0.6,
                              position: "relative",
                            }}
                          >
                            <Box
                              component="select"
                              disabled
                              sx={{
                                appearance: "none",
                                border: "none",
                                bgcolor: "transparent",
                                fontSize: 15, lineHeight: 1.7,
                                fontWeight: 500,
                                color: "#6B7280",
                                cursor: "not-allowed",
                                outline: "none",
                                pr: 0.5,
                                fontFamily: "inherit",
                              }}
                            >
                              <option value="">By Other Dimension</option>
                              <option value="age">By Age Group</option>
                              <option value="department">By Department</option>
                              <option value="hospital">By Hospital</option>
                              <option value="disease">By Disease</option>
                              <option value="city">By City</option>
                            </Box>
                            <ChevronDown size={12} color="#9CA3AF" />
                          </Box>
                        </Box>
                      </Box>

                      {/* Body — two charts with compact centered legends */}
                      <Box sx={{ px: 3, pt: 0, pb: 2.5 }}>
                        {cols.length === 0 ? (
                          <Box sx={{ py: 5, textAlign: "center" }}>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563" }}>No data available</Typography>
                          </Box>
                        ) : (() => {
                          const totalApproved = cols.reduce((s, c) => s + c.approvedAmountTotal, 0);
                          return (
                          <Box sx={{ display: "flex", justifyContent: "center", gap: "96px" }}>
                            {/* LEFT — By Count */}
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", textTransform: "uppercase", mb: 1 }}>By Count</Typography>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Box sx={{ flexShrink: 0, width: 190, height: 190 }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie data={cols.map((c) => ({ name: c.name, value: c.claims }))} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" strokeWidth={0}>
                                        {cols.map((col) => <Cell key={col.name} fill={col.accent} />)}
                                      </Pie>
                                      <RechartTooltip content={({ active, payload }) => {
                                          if (!active || !payload?.length) return null;
                                          const name = String(payload[0]?.name ?? "");
                                          const col = cols.find((c) => c.name === name);
                                          return (
                                            <Box sx={{ bgcolor: "#1F2937", px: 1.75, py: 2.25, borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.18)", minWidth: 150 }}>
                                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: col?.accent ?? "#6B8EF5", flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#fff" }}>{name}</Typography>
                                              </Box>
                                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#D1D5DB" }}>{col?.claims ?? 0} claims</Typography>
                                            </Box>
                                          );
                                        }} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </Box>
                                {/* Compact table centered to chart */}
                                <Box>
                                  <Box sx={{ display: "grid", gridTemplateColumns: "auto 40px 36px", columnGap: 1.5, pb: 0.5, borderBottom: "1px solid #F0F2F5", mb: 0.75 }}>
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", fontWeight: 600 }}>Segment</Typography>
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", fontWeight: 600, textAlign: "right" }}>Count</Typography>
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", fontWeight: 600, textAlign: "right" }}>Share</Typography>
                                  </Box>
                                  {cols.map((col) => (
                                    <Box key={col.name} sx={{ display: "grid", gridTemplateColumns: "auto 40px 36px", columnGap: 1.5, alignItems: "center", py: 0.8 }}>
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: col.accent, flexShrink: 0 }} />
                                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151", whiteSpace: "nowrap" }}>{col.name}</Typography>
                                      </Box>
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827", textAlign: "right" }}>{col.claims}</Typography>
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", textAlign: "right" }}>{col.pct}%</Typography>
                                    </Box>
                                  ))}
                                </Box>
                              </Box>
                            </Box>

                            {/* RIGHT — By Claim Amount (donut proportional to claim counts; Amount = approvedAmount) */}
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", textTransform: "uppercase", mb: 1 }}>By Claim Amount</Typography>
                              {claimDistribTab === "relation" ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  <Box sx={{ flexShrink: 0, width: 190, height: 190 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                        <Pie
                                          data={cols.map((c) => ({ name: c.name, value: c.approvedAmountTotal || c.claims }))}
                                          cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" strokeWidth={0}
                                        >
                                          {cols.map((col) => <Cell key={col.name} fill={col.accent} />)}
                                        </Pie>
                                        <RechartTooltip content={({ active, payload }) => {
                                          if (!active || !payload?.length) return null;
                                          const name = String(payload[0]?.name ?? "");
                                          const col = cols.find((c) => c.name === name);
                                          return (
                                            <Box sx={{ bgcolor: "#1F2937", px: 1.75, py: 2.25, borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.18)", minWidth: 150 }}>
                                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: col?.accent ?? "#6B8EF5", flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#fff" }}>{name}</Typography>
                                              </Box>
                                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#D1D5DB" }}>{col?.approvedAmountTotal ? formatINR(col.approvedAmountTotal, localizationData?.data) : "—"}</Typography>
                                            </Box>
                                          );
                                        }} />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </Box>
                                  {/* Amount + % columns centered to chart */}
                                  <Box>
                                    <Box sx={{ display: "grid", gridTemplateColumns: "auto 72px 36px", columnGap: 1.5, pb: 0.5, borderBottom: "1px solid #F0F2F5", mb: 0.75 }}>
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", fontWeight: 600 }}>Segment</Typography>
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", fontWeight: 600, textAlign: "right" }}>Amount</Typography>
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", fontWeight: 600, textAlign: "right" }}>Share</Typography>
                                    </Box>
                                    {cols.map((col) => {
                                      const amtPct = totalApproved > 0 ? Math.round((col.approvedAmountTotal / totalApproved) * 100) : 0;
                                      return (
                                        <Box key={col.name} sx={{ display: "grid", gridTemplateColumns: "auto 72px 36px", columnGap: 1.5, alignItems: "center", py: 0.8 }}>
                                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: col.accent, flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151", whiteSpace: "nowrap" }}>{col.name}</Typography>
                                          </Box>
                                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827", textAlign: "right" }}>{col.approvedAmountTotal > 0 ? formatINR(col.approvedAmountTotal, localizationData?.data) : "—"}</Typography>
                                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", textAlign: "right" }}>{amtPct}%</Typography>
                                        </Box>
                                      );
                                    })}
                                  </Box>
                                </Box>
                              ) : (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  <Box sx={{ flexShrink: 0, width: 190, height: 190 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                        <Pie
                                          data={cols.map((c) => ({ name: c.name, value: c.approvedAmountTotal || c.claims }))}
                                          cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" strokeWidth={0}
                                        >
                                          {cols.map((col) => <Cell key={col.name} fill={col.accent} />)}
                                        </Pie>
                                        <RechartTooltip content={({ active, payload }) => {
                                          if (!active || !payload?.length) return null;
                                          const name = String(payload[0]?.name ?? "");
                                          const col = cols.find((c) => c.name === name);
                                          return (
                                            <Box sx={{ bgcolor: "#1F2937", px: 1.75, py: 2.25, borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.18)", minWidth: 150 }}>
                                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: col?.accent ?? "#6B8EF5", flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#fff" }}>{name}</Typography>
                                              </Box>
                                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#D1D5DB" }}>{col?.approvedAmountTotal ? formatINR(col.approvedAmountTotal, localizationData?.data) : "—"}</Typography>
                                            </Box>
                                          );
                                        }} />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </Box>
                                  <Box>
                                    <Box sx={{ display: "grid", gridTemplateColumns: "auto 72px 36px", columnGap: 1.5, pb: 0.5, borderBottom: "1px solid #F0F2F5", mb: 0.75 }}>
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", fontWeight: 600 }}>Segment</Typography>
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", fontWeight: 600, textAlign: "right" }}>Amount</Typography>
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", fontWeight: 600, textAlign: "right" }}>Share</Typography>
                                    </Box>
                                    {cols.map((col) => {
                                      const amtPct = totalApproved > 0 ? Math.round((col.approvedAmountTotal / totalApproved) * 100) : 0;
                                      return (
                                        <Box key={col.name} sx={{ display: "grid", gridTemplateColumns: "auto 72px 36px", columnGap: 1.5, alignItems: "center", py: 0.8 }}>
                                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: col.accent, flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151", whiteSpace: "nowrap" }}>{col.name}</Typography>
                                          </Box>
                                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827", textAlign: "right" }}>{col.approvedAmountTotal > 0 ? formatINR(col.approvedAmountTotal, localizationData?.data) : "—"}</Typography>
                                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", textAlign: "right" }}>{amtPct}%</Typography>
                                        </Box>
                                      );
                                    })}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          </Box>
                          );
                        })()}
                      </Box>

                      {/* Footer */}
                      <Box sx={{ borderTop: "1px solid #E5EAF3", px: 3, py: 2.25, minHeight: 44, display: "flex", alignItems: "center", gap: 1.25, bgcolor: "#F8FAFC" }}>
                        <Info size={13} color="#6B7280" style={{ flexShrink: 0 }} />
                        <Typography sx={{ fontSize: 15, color: "#6B7280", flex: 1, lineHeight: 1.4 }}>
                          {totalClaims} total claims across {cols.length} {claimDistribTab === "relation" ? "relation types" : "claim types"}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()}

                {!tatStripMode && !analyticsBackendLoading && <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <Box
                    sx={{
                      borderRadius: "14px",
                      bgcolor: "#fff",
                      border: "1px solid #E5E7EB",
                      p: 3,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5, mb: 0.75 }}>
                      <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#111827" }}>
                        Top 10 Hospitals
                      </Typography>
                      <Box sx={{ display: "flex", gap: 0.75, flexShrink: 0 }}>
                        {(["amount", "claims"] as const).map((mode) => {
                          const isActive = hospitalSortBy === mode;
                          return (
                            <Box
                              key={mode}
                              onClick={() => setHospitalSortBy(mode)}
                              sx={{
                                px: 1.25, py: 0.35,
                                borderRadius: 999,
                                border: `1px solid ${isActive ? "#2F74D6" : "#E5E7EB"}`,
                                bgcolor: isActive ? "#2F74D6" : "#F9FAFB",
                                color: isActive ? "#fff" : "#6B7280",
                                fontSize: 13, lineHeight: 1.5, fontWeight: isActive ? 600 : 500,
                                cursor: "pointer", whiteSpace: "nowrap",
                                userSelect: "none",
                                transition: "all 0.15s",
                                "&:hover": { borderColor: "#2F74D6", color: isActive ? "#fff" : "#2F74D6" },
                              }}
                            >
                              {mode === "amount" ? "By Amount" : "By Count"}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563", mb: 2 }}>
                      {hospitalSortBy === "amount" ? "By claim amount" : "By number of claims"}
                    </Typography>
                    {topHospitals.length > 0 ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                        {topHospitals.map((hospital, index) => {
                          const metric = hospitalSortBy === "amount" ? hospital.amount : hospital.claims;
                          const maxMetric = Math.max(
                            hospitalSortBy === "amount" ? topHospitals[0]?.amount ?? 1 : topHospitals[0]?.claims ?? 1,
                            1
                          );
                          const pct = Math.round((metric / maxMetric) * 100);
                          return (
                            <Box key={hospital.name}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 3.75 }}>
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: index < 3 ? "#1C57B8" : "#4B5563", width: 16 }}>
                                    #{index + 1}
                                  </Typography>
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151", fontWeight: index === 0 ? 600 : 400 }}>
                                    {hospital.name}
                                  </Typography>
                                </Box>
                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827" }}>
                                  {hospitalSortBy === "amount"
                                    ? `${getCurrencySymbolPrefix(localizationData?.data)}${hospital.amount.toFixed(1)}L`
                                    : hospital.claims}
                                </Typography>
                              </Box>
                              <Box sx={{ height: 5, borderRadius: 999, bgcolor: "#F3F4F6", overflow: "hidden" }}>
                                <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: index < 3 ? "#6B8EF5" : "#C7D7FD", borderRadius: 999 }} />
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      <Box sx={{ py: 8, textAlign: "center", color: "#4B5563", fontSize: 15, lineHeight: 1.7 }}>
                        No data found
                      </Box>
                    )}
                  </Box>

                  <Box
                    sx={{
                      borderRadius: "14px",
                      bgcolor: "#fff",
                      border: "1px solid #E5E7EB",
                      p: 3,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#111827", mb: 0.75 }}>
                      Top 10 Ailments
                    </Typography>
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563", mb: 2 }}>
                      Most claimed diagnoses
                    </Typography>
                    {topDiseases.length > 0 ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                        {topDiseases.map((disease, index) => {
                          const maxClaims = Math.max(topDiseases[0]?.claims ?? 1, 1);
                          const pct = Math.round((disease.claims / maxClaims) * 100);
                          const colors = [
                            "#F472B6",
                            "#FB923C",
                            "#34D399",
                            "#FBBF24",
                            "#818CF8",
                            "#60A5FA",
                            "#A78BFA",
                            "#4ADE80",
                            "#F87171",
                            "#38BDF8",
                          ];
                          return (
                            <Box key={disease.name}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 3.75 }}>
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: index < 3 ? "#D97706" : "#4B5563", width: 16 }}>
                                    #{index + 1}
                                  </Typography>
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151", fontWeight: index === 0 ? 600 : 400 }}>
                                    {disease.name}
                                  </Typography>
                                </Box>
                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827" }}>
                                  {disease.pct}%
                                </Typography>
                              </Box>
                              <Box sx={{ height: 5, borderRadius: 999, bgcolor: "#F3F4F6", overflow: "hidden" }}>
                                <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: colors[index], borderRadius: 999 }} />
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      <Box sx={{ py: 8, textAlign: "center", color: "#4B5563", fontSize: 15, lineHeight: 1.7 }}>
                        No data found
                      </Box>
                    )}
                  </Box>
                </Box>}
                  </>
              )
                )}
          </>
        )}

        {/* ══ Claim History ══════════════════════════════════════════════ */}
        {activeTab === "claims" && (
          <Box
            ref={claimHistoryRef}
            onWheel={(e) => {
              if (tatStripMode && e.deltaY < 0 && tableAtTopRef.current) {
                setTatStripMode(false);
                setClaimStatus("");
                setPage(0);
              }
            }}
            sx={{
              borderRadius: "14px",
              bgcolor: "#fff",
              border: "1px solid #E5E7EB",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              scrollMarginTop: "65px",
            }}
          >
            {/* ── Claim History header ── */}
            <Box
              ref={claimFilterBarRef}
              sx={{
                px: 3, pt: 2.5, pb: 0,
                bgcolor: "#fff", borderRadius: "14px 14px 0 0", flexShrink: 0,
              }}
            >
              {/* Row 1: Title + Export */}
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.01em", fontWeight: 700, color: "#111827" }}>
                  Claim Search
                </Typography>
              </Box>

              {/* ── Always-open filter panel ── */}
              <Box sx={{ bgcolor: "#F3F4F6", borderRadius: "14px", p: 2.5, mb: 2 }}>
                  {/* ── Unified search bar ── */}
                  <Box sx={{ position: "relative", mb: 2 }}>
                    <Box sx={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}>
                      <Search size={16} color="#9CA3AF" />
                    </Box>
                    <input
                      value={draft.claimNo || draft.searchText || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        const isClaimNo = /^(CLM|clm|\d)/i.test(v.trim());
                        if (v === "") {
                          setPatchDraft({ claimNo: "", searchText: "" });
                        } else if (isClaimNo) {
                          setPatchDraft({ claimNo: v, searchText: "" });
                        } else {
                          setPatchDraft({ claimNo: "", searchText: v });
                        }
                      }}
                      placeholder="Search by Claim No., Employee ID, Employee, Patient or Hospital…"
                      style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #D1D5DB", background: "#fff", padding: "0 16px 0 40px", fontSize: 15, fontFamily: "inherit", color: "#111827", outline: "none", boxSizing: "border-box", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                    />
                  </Box>

                  {/* ── Compact 3-group row ── */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 0.7fr", gap: 2, mb: 2 }}>

                    {/* Group 1: Type + Status */}
                    <Box sx={{ bgcolor: "#fff", border: "1px solid #E5E7EB", borderRadius: "10px", p: 1.75, display: "flex", flexDirection: "column", gap: 1.5 }}>
                      <Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.75 }}>Type</Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0.75 }}>
                          {["", "Cashless", "Reimbursement"].map((opt) => (
                            <Box key={opt || "any"} onClick={() => setPatchDraft({ claimType: opt })}
                              sx={{ height: 32, borderRadius: "6px", cursor: "pointer", border: draft.claimType === opt ? "1.5px solid #1C57B8" : "1.5px solid #E5E7EB", bgcolor: draft.claimType === opt ? "#EBF3FF" : "#F9FAFB", color: draft.claimType === opt ? "#1C57B8" : "#6B7280", fontSize: 13, fontWeight: draft.claimType === opt ? 700 : 500, display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none", transition: "all 0.12s", whiteSpace: "nowrap" }}
                            >{opt || "Any"}</Box>
                          ))}
                        </Box>
                      </Box>
                      <Box sx={{ height: "1px", bgcolor: "#F3F4F6" }} />
                      <Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.75 }}>Status</Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0.75 }}>
                          {(["", "Pending", "Approved", "Rejected", "Settled"] as const).map((opt) => (
                            <Box key={opt || "any"} onClick={() => setPatchDraft({ status: opt })}
                              sx={{ height: 32, borderRadius: "6px", cursor: "pointer", border: draft.status === opt ? "1.5px solid #1C57B8" : "1.5px solid #E5E7EB", bgcolor: draft.status === opt ? "#EBF3FF" : "#F9FAFB", color: draft.status === opt ? "#1C57B8" : "#6B7280", fontSize: 13, fontWeight: draft.status === opt ? 700 : 500, display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none", transition: "all 0.12s", whiteSpace: "nowrap" }}
                            >{opt || "Any"}</Box>
                          ))}
                        </Box>
                      </Box>
                    </Box>

                    {/* Group 2: Claim Date + Settlement Date */}
                    <Box sx={{ bgcolor: "#fff", border: "1px solid #E5E7EB", borderRadius: "10px", p: 1.75, display: "flex", flexDirection: "column", gap: 1.5 }}>
                      <Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.75 }}>Claim Date</Typography>
                        <Box sx={{ display: "flex", gap: 0.75, alignItems: "flex-end" }}>
                          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.4 }}>
                            <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em" }}>From</Typography>
                            <input type="date" value={draft.claimDateFrom}  placeholder="DD/MM/YYYY" onChange={(e) => setPatchDraft({ claimDateFrom: e.target.value })}
                              style={{ width: "100%", height: 30, borderRadius: 6, border: "1px solid #E5E7EB", background: "#F9FAFB", padding: "0 6px", fontSize: 13, fontFamily: "inherit", color: "#111827", outline: "none", boxSizing: "border-box" }} />
                          </Box>
                          <Typography sx={{ fontSize: 13, color: "#9CA3AF", pb: 0.25 }}>–</Typography>
                          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.4 }}>
                            <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em" }}>To</Typography>
                            <input type="date" value={draft.claimDateTo}  placeholder="DD/MM/YYYY" onChange={(e) => setPatchDraft({ claimDateTo: e.target.value })}
                              style={{ width: "100%", height: 30, borderRadius: 6, border: "1px solid #E5E7EB", background: "#F9FAFB", padding: "0 6px", fontSize: 13, fontFamily: "inherit", color: "#111827", outline: "none", boxSizing: "border-box" }} />
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ height: "1px", bgcolor: "#F3F4F6" }} />
                      <Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.75 }}>Settlement Date</Typography>
                        <Box sx={{ display: "flex", gap: 0.75, alignItems: "flex-end" }}>
                          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.4 }}>
                            <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF",letterSpacing: "0.07em" }}>From</Typography>
                            <input type="date" value={draft.settlementDateFrom}  placeholder="DD/MM/YYYY" onChange={(e) => setPatchDraft({ settlementDateFrom: e.target.value })}
                              style={{ width: "100%", height: 30, borderRadius: 6, border: "1px solid #E5E7EB", background: "#F9FAFB", padding: "0 6px", fontSize: 13, fontFamily: "inherit", color: "#111827", outline: "none", boxSizing: "border-box" }} />
                          </Box>
                          <Typography sx={{ fontSize: 13, color: "#9CA3AF", pb: 0.25 }}>–</Typography>
                          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.4 }}>
                            <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF",  letterSpacing: "0.07em" }}>To</Typography>
                            <input type="date" value={draft.settlementDateTo}  placeholder="DD/MM/YYYY" onChange={(e) => setPatchDraft({ settlementDateTo: e.target.value })}
                              style={{ width: "100%", height: 30, borderRadius: 6, border: "1px solid #E5E7EB", background: "#F9FAFB", padding: "0 6px", fontSize: 13, fontFamily: "inherit", color: "#111827", outline: "none", boxSizing: "border-box" }} />
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    {/* Group 3: TAT */}
                    <Box sx={{ bgcolor: "#fff", border: "1px solid #E5E7EB", borderRadius: "10px", p: 1.75 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.75 }}>TAT</Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {[{ label: "Any", val: "" }, { label: "≤ 7 days", val: "lte7" }, { label: "7 – 30 days", val: "7to30" }, { label: "> 30 days", val: "gt30" }].map(({ label, val }) => (
                          <Box key={label} onClick={() => setPatchDraft({ tat: val })}
                            sx={{ height: 30, px: 1.5, borderRadius: "6px", cursor: "pointer", border: draft.tat === val ? "1.5px solid #1C57B8" : "1.5px solid #E5E7EB", bgcolor: draft.tat === val ? "#EBF3FF" : "#F9FAFB", color: draft.tat === val ? "#1C57B8" : "#6B7280", fontSize: 13, fontWeight: draft.tat === val ? 700 : 500, display: "flex", alignItems: "center", userSelect: "none", transition: "all 0.12s" }}
                          >{label}</Box>
                        ))}
                      </Box>
                    </Box>

                  </Box>

                  {/* Active filter chips + Reset + Run */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 2, borderTop: "1px solid #E0E0E0" }}>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, flex: 1, minWidth: 0 }}>
                      {draftActiveCount === 0 ? (
                        <Typography sx={{ fontSize: 15, color: "#9CA3AF" }}>No filters active</Typography>
                      ) : (
                        Object.entries(draft).filter(([, v]) => Boolean(v)).map(([k, v]) => (
                          <Box key={k} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.25, borderRadius: "20px", bgcolor: "#EBF3FF", border: "1px solid #BFDBFE" }}>
                            <Typography sx={{ fontSize: 15, color: "#1C57B8", fontWeight: 600, whiteSpace: "nowrap" }}>
                              {CHIP_LABELS[k] ?? k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}: {String(v)}
                            </Typography>
                            <Box onClick={() => setPatchDraft({ [k]: "" } as Partial<ClaimDraft>)} sx={{ cursor: "pointer", display: "flex", ml: 0.25 }}>
                              <X size={11} color="#1C57B8" />
                            </Box>
                          </Box>
                        ))
                      )}
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, flexShrink: 0, ml: 2 }}>
                      {hasRunFilter && claimData.length > 0 && (
                        <Box onClick={handleExport}
                          sx={{ px: 2, height: 36, borderRadius: "8px", border: "1px solid #E5E7EB", bgcolor: "#fff", display: "flex", alignItems: "center", gap: 0.75, cursor: "pointer", "&:hover": { bgcolor: "#F3F4F6" }, transition: "background 0.12s" }}>
                          <Download size={13} color="#374151" />
                          <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Export</Typography>
                        </Box>
                      )}
                      <Box onClick={resetSmartFilter}
                        sx={{ px: 2, height: 36, borderRadius: "8px", border: "1px solid #E5E7EB", bgcolor: "#fff", display: "flex", alignItems: "center", gap: 0.75, cursor: "pointer", "&:hover": { bgcolor: "#F3F4F6" }, transition: "background 0.12s" }}>
                        <RotateCcw size={13} color="#374151" />
                        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Reset</Typography>
                      </Box>
                      <Box onClick={runSmartFilter}
                        sx={{ px: 2.5, height: 36, borderRadius: "8px", bgcolor: "#1C57B8", display: "flex", alignItems: "center", gap: 0.75, cursor: "pointer", "&:hover": { bgcolor: "#143F7D" }, transition: "background 0.12s" }}>
                        <Play size={13} color="#fff" />
                        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Run</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

              <Box sx={{ borderBottom: "1px solid #F3F4F6" }} />
            </Box>

            {/* Table */}
            {!hasRunFilter ? (
              <Box sx={{ px: 3, py: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <SlidersHorizontal size={24} color="#9CA3AF" />
                </Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Set filters and click Run to load claims</Typography>
              </Box>
            ) : showClaimSkeleton ? (
              <Box data-table-scroll sx={{ overflowX: "auto", borderRadius: "0 0 14px 14px" }}>
                <Box sx={{ minWidth: 1500 }}>
                  {/* Header — kept identical so layout is stable during load */}
                  <Box component="table" sx={{ width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, fontSize: 15, lineHeight: 1.7 }}>
                    <Box component="colgroup">
                      {[160,100,150,150,170,110,85,105,105,125,70,130].map((w, i) => (
                        <Box key={i} component="col" sx={{ width: w }} />
                      ))}
                    </Box>
                    <Box component="thead">
                      <Box component="tr">
                        {["Claim No.","Employee ID","Employee Name","Patient","Hospital","Claim Date","Type","Claimed","Approved","Settlement Date","TAT","Status"].map((h) => (
                          <Box component="th" key={h} sx={{ px: 3, py: 1.5, textAlign: "left", fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap", bgcolor: "#4B6B8A" }}>
                            {h}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                  {/* Skeleton body rows */}
                  <Box component="table" sx={{ width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0 }}>
                    <Box component="colgroup">
                      {[160,100,150,150,170,110,85,105,105,125,70,130].map((w, i) => (
                        <Box key={i} component="col" sx={{ width: w }} />
                      ))}
                    </Box>
                    <Box component="tbody">
                      {Array.from({ length: 7 }).map((_, ri) => (
                        <Box component="tr" key={ri} sx={{ borderBottom: "1px solid #F3F4F6" }}>
                          {([
                            ["75%", 13, 4],
                            ["55%", 13, 4],
                            ["65%", 13, 4],
                            ["68%", 13, 4],
                            ["60%", 13, 4],
                            ["80%", 13, 4],
                            ["55%", 13, 4],
                            ["50%", 13, 4],
                            ["50%", 13, 4],
                            ["72%", 13, 4],
                            ["45%", 13, 4],
                            ["62%", 22, 999],
                          ] as [string, number, number][]).map(([w, h, r], ci) => (
                            <Box component="td" key={ci} sx={{ px: 3, py: 2 }}>
                              <Skeleton variant="rounded" animation="wave" width={w} height={h} sx={{ borderRadius: r }} />
                            </Box>
                          ))}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : claimError ? (
              <Box sx={{ px: 3, py: 5, textAlign: "center" }}>
                <Typography
                  sx={{ fontSize: 15, lineHeight: 1.7, color: "#EF4444", mb: 1.5 }}
                >
                  Unable to load claim history.
                </Typography>
                <Box
                  onClick={claimRefetch}
                  sx={{
                    display: "inline-block",
                    px: 3,
                    py: 0.75,
                    borderRadius: "8px",
                    bgcolor: "#1C57B8",
                    color: "#fff",
                    fontSize: 15, lineHeight: 1.7,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Retry
                </Box>
              </Box>
            ) : (
              <Box
                data-table-scroll
                sx={{ overflowX: "auto", borderRadius: "0 0 14px 14px" }}
              >
                <Box sx={{ minWidth: 1650 }}>
                  {/* Fixed header — never scrolls */}
                  <Box
                    component="table"
                    sx={{ width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, fontSize: 15, lineHeight: 1.7 }}
                  >
                    <Box component="colgroup">
                      {[160,100,150,150,210,110,100,110,110,130,70,120].map((w, i) => (
                        <Box key={i} component="col" sx={{ width: w }} />
                      ))}
                    </Box>
                    <Box component="thead">
                      <Box component="tr">
                        {[
                          "Claim No.",
                          "Employee ID",
                          "Employee Name",
                          "Patient",
                          "Hospital",
                          "Claim Date",
                          "Type",
                          "Claimed",
                          "Approved",
                          "Settlement Date",
                          "TAT",
                          "Status",
                        ].map((h, hi) => (
                          <Box
                            component="th"
                            key={h}
                            sx={{
                              px: 3,
                              py: 1.5,
                              textAlign: "left",
                              fontSize: 15, lineHeight: 1.5,
                              fontWeight: 600,
                              color: "#fff",
                              borderBottom: "1px solid rgba(255,255,255,0.15)",
                              whiteSpace: "nowrap",
                              bgcolor: "#4B6B8A",
                            }}
                          >
                            {h}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                  {/* Table body */}
                  <Box>
                    <Box
                      component="table"
                      sx={{ width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, fontSize: 15, lineHeight: 1.7 }}
                    >
                      <Box component="colgroup">
                        {[160,100,150,150,210,110,100,110,110,130,70,120].map((w, i) => (
                          <Box key={i} component="col" sx={{ width: w }} />
                        ))}
                      </Box>
                  <Box component="tbody">
                    {claimData.length === 0 ? (
                      <Box component="tr">
                        <Box
                          component="td"
                          colSpan={12}
                          sx={{ px: 3, py: 8, textAlign: "center", verticalAlign: "middle" }}
                        >
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                              <FileText size={20} color="#9CA3AF" />
                            </Box>
                            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151", lineHeight: 1.5, mb: 0.75 }}>No claims found</Typography>
                            <Typography sx={{ fontSize: 15, color: "#9CA3AF", lineHeight: 1.7 }}>No claims match the selected filters.</Typography>
                          </Box>
                          <Box
                            onClick={() => {
                              setClaimStatus("");
                              setClaimTypeFilter("");
                              setSearch("");
                              setDebouncedSearch("");
                              setPage(0);
                              setHasRunFilter(false);
                            }}
                            sx={{
                              display: "inline-block",
                              px: 2.5,
                              py: 0.75,
                              borderRadius: "8px",
                              border: "1px solid #D0D5DD",
                              fontSize: 15, lineHeight: 1.7,
                              color: "#374151",
                              cursor: "pointer",
                              "&:hover": { bgcolor: "#F9FAFB" },
                            }}
                          >
                            Clear filters
                          </Box>
                        </Box>
                      </Box>
                    ) : (
                      claimData.map((row, i) => {
                        const st = row.status?.toLowerCase();
                        const sColor =
                          st === "approved" || st === "settled"
                            ? {
                                bg: "#ECFDF3",
                                color: "#027A48",
                                border: "#ABEFC6",
                              }
                            : st === "pending"
                            ? {
                                bg: "#FFF7ED",
                                color: "#C2410C",
                                border: "#FED7AA",
                              }
                            : {
                                bg: "#FEF2F2",
                                color: "#B91C1C",
                                border: "#FECACA",
                              };
                        return (
                          <Box
                            component="tr"
                            key={row.claimId ?? i}
                            sx={{
                              borderBottom:
                                i < claimData.length - 1
                                  ? "1px solid #F3F4F6"
                                  : "none",
                              "&:hover": { bgcolor: "#FAFBFF" },
                            }}
                          >
                            <Box component="td" sx={{ px: 3, py: 2, overflow: "hidden" }}>
                              <Tooltip title={row.claimNumber} placement="bottom" arrow>
                                <Typography
                                  sx={{
                                    fontSize: 15, lineHeight: 1.7,
                                    fontWeight: 600,
                                    color: "#1C57B8",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {row.claimNumber}
                                </Typography>
                              </Tooltip>
                            </Box>
                            <Box component="td" sx={{ px: 3, py: 2, whiteSpace: "nowrap" }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151", fontFamily: "monospace" }}>
                                {row.employeeCode || "—"}
                              </Typography>
                            </Box>
                            <Box component="td" sx={{ px: 3, py: 2, overflow: "hidden" }}>
                              <Tooltip title={row.employeeName || "—"} placement="bottom" arrow>
                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {row.employeeName || "—"}
                                </Typography>
                              </Tooltip>
                            </Box>
                            <Box component="td" sx={{ px: 2, py: 2, overflow: "hidden" }}>
                              <Tooltip title={row.patientName} placement="bottom" arrow>
                                <Typography
                                  sx={{
                                    fontSize: 15, lineHeight: 1.7,
                                    fontWeight: 600,
                                    color: "#111827",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {row.patientName}
                                </Typography>
                              </Tooltip>
                              <Typography
                                sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563" }}
                              >
                                {capitalizeFirst(row.relation)}
                              </Typography>
                            </Box>
                            <Box
                              component="td"
                              sx={{
                                px: 2,
                                py: 2,
                                fontSize: 15, lineHeight: 1.7,
                                color: "#374151",
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                              }}
                            >
                              {row.hospital}
                            </Box>
                            <Box
                              component="td"
                              sx={{
                                px: 2,
                                py: 2,
                                fontSize: 15, lineHeight: 1.7,
                                color: "#6B7280",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {fmtDate(row.claimDate)}
                            </Box>
                            <Box
                              component="td"
                              sx={{
                                px: 2,
                                py: 2,
                                fontSize: 15, lineHeight: 1.7,
                                color: "#374151",
                              }}
                            >
                              {row.claimType}
                            </Box>
                            <Box
                              component="td"
                              sx={{
                                px: 2,
                                py: 2,
                                fontSize: 15, lineHeight: 1.7,
                                fontWeight: 600,
                                color: "#111827",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatINR(row.claimedAmount, localizationData?.data)}
                            </Box>
                            <Box
                              component="td"
                              sx={{
                                px: 2,
                                py: 2,
                                fontSize: 14, lineHeight: 1.7,
                                fontWeight: 600,
                                color:
                                  st === "approved" || st === "settled"
                                    ? "#027A48"
                                    : "#4B5563",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {row.approvedAmount > 0
                                ? formatINR(row.approvedAmount, localizationData?.data)
                                : "—"}
                            </Box>
                            <Box
                              component="td"
                              sx={{
                                px: 2,
                                py: 2,
                                fontSize: 15, lineHeight: 1.7,
                                color: "#6B7280",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {fmtDate(row.settlementDate)}
                            </Box>
                            {/* TAT cell */}
                            {(() => {
                              const today = new Date().toISOString();
                              const tatDays = safeDateDiffDays(row.claimDate, row.settlementDate ?? today);
                              const tatColor = tatDays === null ? "#9CA3AF" : tatDays <= 14 ? "#059669" : tatDays <= 30 ? "#D97706" : "#DC2626";
                              const tatBg = tatDays === null ? "#F9FAFB" : tatDays <= 14 ? "#F0FDF4" : tatDays <= 30 ? "#FFFBEB" : "#FEF2F2";
                              return (
                                <Box component="td" sx={{ px: 3, py: 2, whiteSpace: "nowrap" }}>
                                  {tatDays !== null ? (
                                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.35, borderRadius: "8px", bgcolor: tatBg }}>
                                      <Clock size={11} color={tatColor} />
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: tatColor }}>{tatDays}d</Typography>
                                    </Box>
                                  ) : (
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#D1D5DB" }}>—</Typography>
                                  )}
                                </Box>
                              );
                            })()}
                            <Box component="td" sx={{ px: 3, py: 2, overflow: "hidden" }}>
                              <Tooltip title={row.status} placement="bottom" arrow>
                                <Box
                                  sx={{
                                    px: 1.5,
                                    py: 0.4,
                                    borderRadius: 999,
                                    fontSize: 15, lineHeight: 1.7,
                                    fontWeight: 600,
                                    display: "inline-flex",
                                    maxWidth: "100%",
                                    overflow: "hidden",
                                    bgcolor: sColor.bg,
                                    color: sColor.color,
                                    border: `1px solid ${sColor.border}`,
                                  }}
                                >
                                  <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {row.status}
                                  </Box>
                                </Box>
                              </Tooltip>
                            </Box>
                          </Box>
                        );
                      })
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
            )}

            {/* Pagination footer */}
            {!claimFetching && !claimError && claimData && claimData.length > 0 && (() => {
              const totalPages = claimTotal != null
                ? Math.ceil(claimTotal / PAGE_SIZE)
                : page + (claimData.length >= PAGE_SIZE ? 2 : 1);
              const hasPrev = page > 0;
              const hasNext = claimData.length >= PAGE_SIZE;
              if (totalPages <= 1 && !hasPrev && !hasNext) return null;
              const pageButtons: number[] = [];
              const delta = 2;
              for (let i = Math.max(0, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
                pageButtons.push(i);
              }
              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 3,
                    py: 1.75,
                    borderTop: "1px solid #F3F4F6",
                    flexShrink: 0,
                    mt: "auto",
                    bgcolor: "#fff",
                    borderRadius: "0 0 14px 14px",
                  }}
                >
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280" }}>
                    {claimTotal != null
                      ? `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, claimTotal)} of ${claimTotal} claims`
                      : `Page ${page + 1}`}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {/* Prev */}
                    <Box
                      onClick={() => { if (hasPrev) setPage((p) => p - 1); }}
                      sx={{
                        width: 32, height: 32,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: "8px", border: "1px solid #E5E7EB",
                        bgcolor: "#fff",
                        cursor: hasPrev ? "pointer" : "not-allowed",
                        opacity: hasPrev ? 1 : 0.4,
                        "&:hover": hasPrev ? { bgcolor: "#F9FAFB" } : {},
                      }}
                    >
                      <ChevronLeft size={15} color="#374151" />
                    </Box>

                    {/* Page number buttons */}
                    {pageButtons[0] > 0 && (
                      <>
                        <Box onClick={() => setPage(0)} sx={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #E5E7EB", bgcolor: "#fff", cursor: "pointer", fontSize: 15, lineHeight: 1.7, color: "#374151", "&:hover": { bgcolor: "#F9FAFB" } }}>1</Box>
                        {pageButtons[0] > 1 && <Typography sx={{ px: 0.5, fontSize: 15, lineHeight: 1.7, color: "#4B5563" }}>…</Typography>}
                      </>
                    )}
                    {pageButtons.map((p) => (
                      <Box
                        key={p}
                        onClick={() => setPage(p)}
                        sx={{
                          width: 32, height: 32,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: "8px",
                          border: p === page ? "1px solid #1C57B8" : "1px solid #E5E7EB",
                          bgcolor: p === page ? "#1C57B8" : "#fff",
                          cursor: "pointer",
                          fontSize: 15, lineHeight: 1.7,
                          fontWeight: p === page ? 700 : 400,
                          color: p === page ? "#fff" : "#374151",
                          "&:hover": p !== page ? { bgcolor: "#F9FAFB" } : {},
                        }}
                      >
                        {p + 1}
                      </Box>
                    ))}
                    {pageButtons[pageButtons.length - 1] < totalPages - 2 && (
                      <>
                        <Typography sx={{ px: 0.5, fontSize: 15, lineHeight: 1.7, color: "#4B5563" }}>…</Typography>
                        <Box onClick={() => setPage(totalPages - 1)} sx={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #E5E7EB", bgcolor: "#fff", cursor: "pointer", fontSize: 15, lineHeight: 1.7, color: "#374151", "&:hover": { bgcolor: "#F9FAFB" } }}>{totalPages}</Box>
                      </>
                    )}
                    {pageButtons[pageButtons.length - 1] === totalPages - 2 && (
                      <Box onClick={() => setPage(totalPages - 1)} sx={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid #E5E7EB", bgcolor: "#fff", cursor: "pointer", fontSize: 15, lineHeight: 1.7, color: "#374151", "&:hover": { bgcolor: "#F9FAFB" } }}>{totalPages}</Box>
                    )}

                    {/* Next */}
                    <Box
                      onClick={() => { if (hasNext) setPage((p) => p + 1); }}
                      sx={{
                        width: 32, height: 32,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: "8px", border: "1px solid #E5E7EB",
                        bgcolor: "#fff",
                        cursor: hasNext ? "pointer" : "not-allowed",
                        opacity: hasNext ? 1 : 0.4,
                        "&:hover": hasNext ? { bgcolor: "#F9FAFB" } : {},
                      }}
                    >
                      <ChevronRight size={15} color="#374151" />
                    </Box>
                  </Box>
                </Box>
              );
            })()}
          </Box>
        )}



        {/* ══ Enrollment ════════════════════════════════════════════════ */}
        {activeTab === "claims" && claimsSection === "enrollment" && (
          <>
            {enrollmentFetching && !enrollSummary ? (
              <TabLoader />
            ) : enrollmentError ? (
              <TabError onRetry={enrollmentRefetch} />
            ) : enrollSummary ? (
              <>
                {/* KPI tiles */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: 2,
                  }}
                >
                  {[
                    {
                      label: "Total Employees",
                      value: enrollSummary.totalEmployees,
                      pct: null as number | null,
                      color: "#374151",
                      bg: "#F9FAFB",
                    },
                    {
                      label: "Enroled",
                      value: enrollSummary.enrolledCount,
                      pct: enrollSummary.enrolledPercent,
                      color: "#22C55E",
                      bg: "#F0FDF4",
                    },
                    {
                      label: "In Progress",
                      value: enrollSummary.inProgressCount,
                      pct: enrollSummary.inProgressPercent,
                      color: "#D97706",
                      bg: "#FFF7ED",
                    },
                    {
                      label: "Not Started",
                      value: enrollSummary.notLoggedInCount,
                      pct: enrollSummary.notLoggedInPercent,
                      color: "#4B5563",
                      bg: "#F3F4F6",
                    },
                  ].map(({ label, value, pct, color, bg }) => (
                    <Box
                      key={label}
                      sx={{
                        p: 3,
                        borderRadius: "14px",
                        bgcolor: bg,
                        border: "1px solid #E5E7EB",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 15, lineHeight: 1.7,
                          color: "#4B5563",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          mb: 1,
                        }}
                      >
                        {label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 28, lineHeight: 1.25, letterSpacing: "-0.4px",
                          fontWeight: 700,
                          color,
                          lineHeight: 1,
                        }}
                      >
                        {value}
                      </Typography>
                      {pct !== null && (
                        <Typography
                          sx={{
                            fontSize: 15, lineHeight: 1.7,
                            color,
                            opacity: 0.75,
                            mt: 0.75,
                          }}
                        >
                          {pct.toFixed(1)}%
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>

                {/* Bar chart */}
                <Box
                  sx={{
                    p: 3,
                    borderRadius: "14px",
                    bgcolor: "#fff",
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography
                      sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827" }}
                    >
                      Enrolment Breakdown
                    </Typography>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.35,
                        borderRadius: 999,
                        bgcolor:
                          enrollColor === "#EF4444" ? "#FEF2F2" : "#FFF7EB",
                        fontSize: 15, lineHeight: 1.7,
                        fontWeight: 600,
                        color: enrollColor,
                      }}
                    >
                      {enrollSummary.notEnrolledCount +
                        enrollSummary.inProgressCount}{" "}
                      pending · {enrollSummary.enrolledPercent?.toFixed(1)}%
                      enrolled
                    </Box>
                  </Box>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={enrollBarData}
                      barCategoryGap="40%"
                      margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#F3F4F6"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 15, lineHeight: 1.7, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 15, lineHeight: 1.7, fill: "#4B5563" }}
                        axisLine={false}
                        tickLine={false}
                        domain={enrollBarDomain}
                        ticks={enrollBarTicks}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {enrollBarData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>

                {/* Status insight */}
                <Box
                  sx={{
                    p: 3,
                    borderRadius: "14px",
                    bgcolor:
                      enrollColor === "#EF4444" ? "#FEF2F2" : "#FFF8F0",
                    border: `1px solid ${
                      enrollColor === "#EF4444" ? "#FECACA" : "#FDE68A"
                    }`,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 15, lineHeight: 1.7,
                      fontWeight: 700,
                      color: enrollColor,
                      mb: 0.75,
                    }}
                  >
                    Enrolment Status
                  </Typography>
                  <Typography
                    sx={{ fontSize: 15, color: "#374151", lineHeight: 1.6 }}
                  >
                    {enrollSummary.enrolledPercent >= 80
                      ? `Strong coverage at ${enrollSummary.enrolledPercent.toFixed(
                          1
                        )}%. ${
                          enrollSummary.notLoggedInCount
                        } employees yet to log in.`
                      : enrollSummary.enrolledPercent >= 50
                      ? `${enrollSummary.enrolledPercent.toFixed(1)}% enrolled. ${
                          enrollSummary.inProgressCount +
                          enrollSummary.notLoggedInCount
                        } employees still need to complete enrolment.`
                      : `Only ${enrollSummary.enrolledPercent.toFixed(1)}% enrolled — ${
                          enrollSummary.notEnrolledCount
                        } employees not yet enrolled. Immediate action recommended.`}
                  </Typography>
                </Box>

                {/* Action buttons */}
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Box
                    onClick={() => navigate("/hr-portal/employees")}
                    sx={{
                      flex: 1,
                      height: 44,
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15, lineHeight: 1.7,
                      fontWeight: 600,
                      border: "1.5px solid #D0D5DD",
                      color: "#374151",
                      bgcolor: "#fff",
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#F8FAFC" },
                    }}
                  >
                    View Employees →
                  </Box>
                  <Box
                    onClick={() => navigate("/hr-portal/employees")}
                    sx={{
                      flex: 1,
                      height: 44,
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15, lineHeight: 1.7,
                      fontWeight: 600,
                      bgcolor: "#1C57B8",
                      color: "#fff",
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#143F7D" },
                    }}
                  >
                    Send Reminders
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563" }}>
                  No enrolment data available for this policy.
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* ══ Non-Life Assets Tab ══════════════════════════════════════════════ */}
        {activeTab === "enrollment" && isNonLife && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {nonLifeAssetKpiLoading && nonLifeAssetKpiData.length === 0 ? (
              <TabLoader />
            ) : nonLifeAssetKpiError ? (
              <TabError onRetry={nonLifeAssetKpiRefetch} />
            ) : (
              <>
                {/* KPI Cards */}
                {(() => {
                  const kpi = nonLifeAssetKpiData[0];
                  const totalAssets    = kpi ? Number(kpi.totalAssets)    : (policyRow?.totalAssets    ?? 0);
                  const totalSubAssets = kpi ? Number(kpi.totalSubAssets) : (policyRow?.totalSubAssets ?? 0);
                  const sumInsured     = kpi ? Number(kpi.totalSumInsured)    : (policyRow?.totalSumInsured ?? 0);
                  const assetPremium   = kpi ? Number(kpi.assetTotalPremium)  : (policyRow?.assetTotalPremium ?? 0);
                  return (
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
                      {[
                        { label: "Total Assets",  value: formatNumberByLocalization(totalAssets, localizationData?.data),    icon: <Shield size={18} color="#1C57B8" />, accent: "#1C57B8", bg: "#EBF3FF", border: "#BFDBFE" },
                        { label: "Sub-Assets",    value: formatNumberByLocalization(totalSubAssets, localizationData?.data), icon: <FileText size={18} color="#059669" />, accent: "#059669", bg: "#ECFDF5", border: "#BBF7D0" },
                        { label: "Sum Insured",   value: formatINR(sumInsured, localizationData?.data),  icon: <Banknote size={18} color="#7C3AED" />, accent: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
                        { label: "Asset Premium", value: formatINR(assetPremium, localizationData?.data), icon: <Wallet size={18} color="#D97706" />, accent: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
                      ].map((card) => (
                        <Box key={card.label} sx={{ borderRadius: "14px", border: `1.5px solid ${card.border}`, bgcolor: card.bg, p: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>{card.label}</Typography>
                            <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                              {card.icon}
                            </Box>
                          </Box>
                          <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.4px", lineHeight: 1.2 }}>{card.value}</Typography>
                        </Box>
                      ))}
                    </Box>
                  );
                })()}

                {/* Asset List */}
                <Box sx={{ borderRadius: "14px", border: "1px solid #E5E7EB", bgcolor: "#fff", overflow: "hidden" }}>
                  <Box sx={{ px: 3, py: 2, background: "linear-gradient(90deg, #EBF3FF 0%, #F8FAFF 100%)", borderBottom: "1px solid #DBEAFE", display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#1C57B8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Shield size={14} color="#fff" />
                    </Box>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1E3A6E" }}>Asset Details</Typography>
                    {nonLifeAssetListLoading && (
                      <Box sx={{ ml: "auto" }}><CircularProgress size={14} sx={{ color: "#1C57B8" }} /></Box>
                    )}
                  </Box>

                  {nonLifeAssetListError ? (
                    <Box sx={{ py: 4, textAlign: "center" }}>
                      <Typography sx={{ fontSize: 15, color: "#EF4444" }}>Failed to load assets.</Typography>
                    </Box>
                  ) : nonLifeAssetListData.length === 0 && !nonLifeAssetListLoading ? (
                    <Box sx={{ py: 6, textAlign: "center" }}>
                      <Typography sx={{ fontSize: 15, color: "#9CA3AF" }}>No active assets found for this policy.</Typography>
                    </Box>
                  ) : (
                    <>
                      {/* Column headers */}
                      <Box sx={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr 0.6fr 1fr 1fr 0.7fr", gap: 0, px: 3, py: 1.25, bgcolor: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                        {["Cover Code", "Category", "Location Type", "Qty", "Sum Insured", "Premium", "Sub-Assets"].map((h) => (
                          <Typography key={h} sx={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</Typography>
                        ))}
                      </Box>
                      {nonLifeAssetListData.map((row, idx) => (
                        <Box key={row.assetId} sx={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr 0.6fr 1fr 1fr 0.7fr", gap: 0, px: 3, py: 1.75, borderBottom: idx < nonLifeAssetListData.length - 1 ? "1px solid #F3F4F6" : "none", "&:hover": { bgcolor: "#FAFBFF" }, transition: "background 0.12s" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                            <Box sx={{ width: 26, height: 26, borderRadius: "6px", bgcolor: "#EBF3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Shield size={12} color="#1C57B8" />
                            </Box>
                            <Tooltip title={row.coverCode} placement="top" arrow>
                              <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.coverCode}</Typography>
                            </Tooltip>
                          </Box>
                          <Typography sx={{ fontSize: 15, color: "#374151" }}>{row.category || "—"}</Typography>
                          <Typography sx={{ fontSize: 15, color: "#374151" }}>{row.riskLocationType || "—"}</Typography>
                          <Typography sx={{ fontSize: 15, color: "#374151" }}>{row.quantity != null ? `${row.quantity} ${row.uom || ""}`.trim() : "—"}</Typography>
                          <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>{formatINR(row.sumInsured, localizationData?.data)}</Typography>
                          <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#059669" }}>{formatINR(row.premium, localizationData?.data)}</Typography>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box sx={{ px: 1.25, py: 0.35, borderRadius: "20px", bgcolor: row.subAssetCount > 0 ? "#ECFDF5" : "#F3F4F6", display: "inline-flex" }}>
                              <Typography sx={{ fontSize: 13, fontWeight: 700, color: row.subAssetCount > 0 ? "#059669" : "#9CA3AF" }}>{row.subAssetCount}</Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </>
                  )}
                </Box>
              </>
            )}
          </Box>
        )}

        {/* ══ Enrollment (merged Inception + Endorsement) ═════════════════════ */}
        {activeTab === "enrollment" && !isNonLife && (
          <Box sx={{ px: 3, py: 3, display: "flex", flexDirection: "column", gap: 4 }}>
            <input ref={inceptionInputRef} type="file" accept=".xlsx,.csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleInceptionFileSelect(f); e.target.value = ""; }} />
            <input ref={endorsementInputRef} type="file" accept=".xlsx,.csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleEndorsementFileSelect(f); e.target.value = ""; }} />

            {/* ── Action CTA Banner — adapts based on inception state ── */}
            {!endorsementLoading && (inceptionView === "upload" || inceptionView === "uploaded" || (inceptionView === "completed" && endorsementView === "history")) && (
              (() => {
                const inceptionDone = inceptionView === "completed";
                return (
                  <Box sx={{
                    bgcolor: "#fff",
                    borderRadius: "24px",
                    border: "1px solid #E8EDF5",
                    boxShadow: `0 12px 48px rgba(28,87,184,0.11), 0 2px 8px rgba(0,0,0,0.04), inset 0 3px 0 ${inceptionDone ? "#1C57B8" : "#D97706"}`,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                  }}>
                    {/* ── Left: Hero panel — dark navy matching page header ── */}
                    <Box sx={{
                      flex: "0 0 auto",
                      width: { xs: "100%", md: "50%" },
                      py: { xs: 5, md: 8 },
                      pl: { xs: 4, md: 7 },
                      pr: { xs: 4, md: 5 },
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 4,
                      background: "repeating-linear-gradient(45deg, transparent, transparent 14px, rgba(255,255,255,0.03) 14px, rgba(255,255,255,0.03) 15px), linear-gradient(135deg, #0F1C2E 0%, #1C2B4A 100%)",
                      borderRight: { xs: "none", md: "1px solid rgba(255,255,255,0.08)" },
                      borderBottom: { xs: "1px solid rgba(255,255,255,0.08)", md: "none" },
                    }}>
                      {/* Icon + badge row */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {/* Icon: solid accent bg + white icon — matches header icon style */}
                        <Box sx={{
                          width: 52, height: 52, borderRadius: "16px",
                          bgcolor: inceptionDone ? "#1C57B8" : "#D97706",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 4px 20px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.2)",
                        }}>
                          <RefreshCw size={24} color="#fff" />
                        </Box>
                        {/* Chip: frosted glass — matches header meta chips */}
                        <Box sx={{
                          px: 1.75, py: 0.65, borderRadius: "20px",
                          bgcolor: "rgba(255,255,255,0.1)",
                          border: "1px solid rgba(255,255,255,0.18)",
                          backdropFilter: "blur(8px)",
                          display: "flex", alignItems: "center", gap: 0.75,
                        }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: inceptionDone ? "#7EB3F5" : "#FCD078", flexShrink: 0 }} />
                          <Typography sx={{ fontSize: 20, lineHeight: 1.4, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                            {inceptionDone ? "Endorsement" : "Inception Required"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Title + description */}
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <Typography sx={{ fontSize: 32, lineHeight: 1.15, letterSpacing: "-0.5px", fontWeight: 800, color: "#fff" }}>
                          {inceptionDone ? "Create a New\nEndorsement" : "Activate Your Policy"}
                        </Typography>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.6)" }}>
                          {inceptionDone
                            ? <>Upload employee records to add new members,<br />remove exits, or correct mid-term changes — right from this page.</>
                            : <>Upload your inception data to activate the policy.<br />Endorsements can only begin after inception is complete.</>}
                        </Typography>
                        {/* Info chips — frosted glass */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                          {(inceptionDone
                            ? [{ label: "Add · Remove · Correct" }, { label: "~3–5 working days" }, { label: "Excel / CSV upload" }]
                            : [{ label: "One-time activation" }, { label: "~2–3 working days" }, { label: "Unlocks endorsements" }]
                          ).map((chip) => (
                            <Box key={chip.label} sx={{ px: 1.25, py: 0.4, borderRadius: "8px", bgcolor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.4, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>{chip.label}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>

                      {/* CTA button */}
                      <Box
                        onClick={() => inceptionDone
                          ? setEndorsementView("upload")
                          : navigate("/hr-portal/inception-endorsement", { state: { policyId: policyRow?.policyId } })}
                        sx={{
                          alignSelf: "flex-start",
                          display: "flex", alignItems: "center", gap: 1,
                          px: 3, py: 2, borderRadius: "14px",
                          bgcolor: inceptionDone ? "#1C57B8" : "#D97706",
                          cursor: "pointer",
                          boxShadow: inceptionDone ? "0 6px 20px rgba(28,87,184,0.5)" : "0 6px 20px rgba(217,119,6,0.5)",
                          transition: "all 0.2s",
                          "&:hover": {
                            bgcolor: inceptionDone ? "#1548A0" : "#B45309",
                            transform: "translateY(-2px)",
                            boxShadow: inceptionDone ? "0 10px 28px rgba(28,87,184,0.6)" : "0 10px 28px rgba(217,119,6,0.6)",
                          },
                        }}
                      >
                        <Plus size={17} color="#fff" />
                        <Typography sx={{ fontSize: 15, lineHeight: 1.4, fontWeight: 700, color: "#fff" }}>
                          {inceptionDone ? "Start Endorsement" : "Start Inception"}
                        </Typography>
                        <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
                      </Box>
                    </Box>

                    {/* ── Right: Steps panel ── */}
                    <Box sx={{
                      flex: 1,
                      py: { xs: 5, md: 7 },
                      px: { xs: 4, md: 5 },
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: "#FAFBFF",
                    }}>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.4, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.09em", mb: 3 }}>
                        {inceptionDone ? "How Endorsement Works" : "How Inception Works"}
                      </Typography>
                      {(inceptionDone
                        ? [
                            { icon: <Upload size={20} color="#fff" />, label: "Upload Employees", desc: "Submit an Excel with additions, deletions, or corrections", color: "#1C57B8" },
                            { icon: <Mail size={20} color="#fff" />, label: "Submitted to Insurer", desc: "Records are forwarded to the insurer for processing", color: "#7C3AED" },
                            { icon: <SlidersHorizontal size={20} color="#fff" />, label: "Insurer Processes", desc: "Insurer validates and processes the member changes", color: "#0891B2" },
                            { icon: <CheckCircle2 size={20} color="#fff" />, label: "Policy Updated", desc: "Policy reflects the latest member additions and changes", color: "#D97706" },
                            { icon: <Users size={20} color="#fff" />, label: "TPA Notified", desc: "TPA is updated with new member data and coverage", color: "#059669" },
                          ]
                        : [
                            { icon: <Upload size={20} color="#fff" />, label: "Inception Uploaded", desc: "Upload initial member data for the policy", color: "#1C57B8" },
                            { icon: <SlidersHorizontal size={20} color="#fff" />, label: "Data Validated", desc: "Records are checked for completeness and accuracy", color: "#0891B2" },
                            { icon: <Shield size={20} color="#fff" />, label: "Policy Activated", desc: "Coverage is enabled for all submitted members", color: "#7C3AED" },
                            { icon: <CheckCircle2 size={20} color="#fff" />, label: "Endorsements Enabled", desc: "Policy is live and ready for future endorsements", color: "#059669" },
                          ]
                      ).map((step, i, arr) => (
                        <React.Fragment key={step.label}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2.5, py: 1.75, px: 1.5, borderRadius: "14px", transition: "background 0.15s", "&:hover": { bgcolor: `${step.color}08` } }}>
                            {/* Timeline number circle */}
                            <Box sx={{
                              width: "auto", minWidth: 52, height: 28, borderRadius: "999px", px: 1.25,
                              bgcolor: step.color,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0, mt: 0.75,
                              boxShadow: `0 3px 10px ${step.color}40`,
                            }}>
                              <Typography sx={{ fontSize: 13, lineHeight: 1, fontWeight: 800, color: "#fff" }}>Step {i + 1}</Typography>
                            </Box>
                            {/* Icon box */}
                            <Box sx={{
                              width: 42, height: 42, borderRadius: "13px",
                              bgcolor: step.color,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                              boxShadow: `0 4px 14px ${step.color}45`,
                            }}>
                              {step.icon}
                            </Box>
                            {/* Text */}
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.4, fontWeight: 700, color: "#111827" }}>{step.label}</Typography>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.6, color: "#6B7280", mt: 0.3 }}>{step.desc}</Typography>
                            </Box>
                          </Box>
                          {i < arr.length - 1 && (
                            <Box sx={{ width: 2, height: 14, ml: "25px", bgcolor: `${step.color}30`, borderRadius: "2px" }} />
                          )}
                        </React.Fragment>
                      ))}
                    </Box>
                  </Box>
                );
              })()
            )}


            {/* ── Initial data load — show spinner ── */}
            {endorsementLoading && inceptionView === "upload" && (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 8 }}>
                <CircularProgress size={28} sx={{ color: "#1C57B8" }} />
              </Box>
            )}

            {/* ── Upload / Uploaded / Loading ── */}
            {!endorsementLoading && (inceptionView === "upload" || inceptionView === "uploaded") && (<>

              {/* 2-column grid */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5, alignItems: "start" }}>

                {/* LEFT — guidelines */}
                <Box sx={{ background: "#fff", border: "1px solid #E3EDF7", borderRadius: "14px", p: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#667085", letterSpacing: "0.07em" }}>GUIDELINES</Typography>
                  </Box>
                  <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "10px", overflow: "hidden" }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", px: 2, py: 1.1, bgcolor: "#F8FAFC", borderBottom: "1px solid #E5E7EB", gap: 2 }}>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#667085", letterSpacing: "0.06em" }}>COLUMN NAME</Typography>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#667085", letterSpacing: "0.06em" }}>FORMAT</Typography>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#667085", letterSpacing: "0.06em" }}>EXAMPLE</Typography>
                    </Box>
                    {PS_REQUIRED_COLS.map((col, i) => (
                      <Box key={col.label} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", px: 2, py: 2.25, gap: 2, alignItems: "center", borderBottom: i < PS_REQUIRED_COLS.length - 1 ? "1px solid #F3F4F6" : "none", bgcolor: "#fff" }}>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: "#111827" }}>{col.label}</Typography>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085" }}>{col.format}</Typography>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#94A3B8" }}>{col.example}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* RIGHT — title + upload zone */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ background: "#fff", border: "1px solid #E3EDF7", borderRadius: "14px", p: 3 }}>
                    <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#111827", mb: 0.75 }}>Upload Inception Data</Typography>
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085", mb: 2 }}>
                      Upload your file to add the complete employee roster for this policy period. Data will be validated and applied as the inception entry.
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "10px", px: 2, py: 1.5 }}>
                      <Typography sx={{ fontSize: 15, color: "#1E40AF", lineHeight: 1.7 }}>
                        <strong>Inception</strong> is a one-time upload done at the start of a policy period. It sets the baseline employee and dependent roster for this policy year. Upload once per policy cycle.
                      </Typography>
                    </Box>
                  </Box>

                  {/* ── Request Details form ── */}
                  <Box sx={{ background: "#fff", border: "1px solid #E3EDF7", borderRadius: "14px", p: 3 }}>
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827", mb: 2 }}>Request Details</Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                        <Box>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 0.75 }}>iTicket Number <Box component="span" sx={{ color: "#EF4444" }}>*</Box></Typography>
                          <Box component="input" value={inceptionOsTicket} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInceptionOsTicket(e.target.value)} placeholder="e.g. INC-12345" sx={{ width: "100%", boxSizing: "border-box", px: 1.5, py: 1, fontSize: 15, lineHeight: 1.7, border: "1px solid #D1D5DB", borderRadius: "8px", outline: "none", "&:focus": { borderColor: "#1C57B8", boxShadow: "0 0 0 3px rgba(28,87,184,0.1)" }, color: "#111827", bgcolor: "#fff" }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 0.75 }}>Request Received Date <Box component="span" sx={{ color: "#EF4444" }}>*</Box></Typography>
                          <Box component="input" type="date" value={inceptionReceivedDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInceptionReceivedDate(e.target.value)} sx={{ width: "100%", boxSizing: "border-box", px: 1.5, py: 1, fontSize: 15, lineHeight: 1.7, border: "1px solid #D1D5DB", borderRadius: "8px", outline: "none", "&:focus": { borderColor: "#1C57B8", boxShadow: "0 0 0 3px rgba(28,87,184,0.1)" }, color: "#111827", bgcolor: "#fff" }} />
                        </Box>
                      </Box>
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                        <Box>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 0.75 }}>No. of Employees <Box component="span" sx={{ color: "#EF4444" }}>*</Box></Typography>
                          <Box component="input" type="number" min="0" value={inceptionNoOfEmployees} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInceptionNoOfEmployees(e.target.value)} placeholder="0" sx={{ width: "100%", boxSizing: "border-box", px: 1.5, py: 1, fontSize: 15, lineHeight: 1.7, border: "1px solid #D1D5DB", borderRadius: "8px", outline: "none", "&:focus": { borderColor: "#1C57B8", boxShadow: "0 0 0 3px rgba(28,87,184,0.1)" }, color: "#111827", bgcolor: "#fff" }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 0.75 }}>No. of Dependents</Typography>
                          <Box component="input" type="number" min="0" value={inceptionNoOfDependents} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInceptionNoOfDependents(e.target.value)} placeholder="0" sx={{ width: "100%", boxSizing: "border-box", px: 1.5, py: 1, fontSize: 15, lineHeight: 1.7, border: "1px solid #D1D5DB", borderRadius: "8px", outline: "none", "&:focus": { borderColor: "#1C57B8", boxShadow: "0 0 0 3px rgba(28,87,184,0.1)" }, color: "#111827", bgcolor: "#fff" }} />
                        </Box>
                      </Box>
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                        <Box>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 0.75 }}>Enrolment Start Date</Typography>
                          <Box component="input" type="date" value={inceptionEnrollmentStartDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInceptionEnrollmentStartDate(e.target.value)} sx={{ width: "100%", boxSizing: "border-box", px: 1.5, py: 1, fontSize: 15, lineHeight: 1.7, border: "1px solid #D1D5DB", borderRadius: "8px", outline: "none", "&:focus": { borderColor: "#1C57B8", boxShadow: "0 0 0 3px rgba(28,87,184,0.1)" }, color: "#111827", bgcolor: "#fff" }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 0.75 }}>Enrolment End Date</Typography>
                          <Box component="input" type="date" value={inceptionEnrollmentEndDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInceptionEnrollmentEndDate(e.target.value)} sx={{ width: "100%", boxSizing: "border-box", px: 1.5, py: 1, fontSize: 15, lineHeight: 1.7, border: "1px solid #D1D5DB", borderRadius: "8px", outline: "none", "&:focus": { borderColor: "#1C57B8", boxShadow: "0 0 0 3px rgba(28,87,184,0.1)" }, color: "#111827", bgcolor: "#fff" }} />
                        </Box>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 0.75 }}>Document Type</Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          {([['with_dependents', 'Employee + Dependents Data'], ['employee_only', 'Employee Only']] as const).map(([val, label]) => (
                            <Box key={val} onClick={() => setInceptionDocType(val)} sx={{ flex: 1, px: 2, py: 1, borderRadius: "8px", border: `1.5px solid ${inceptionDocType === val ? "#1C57B8" : "#E5E7EB"}`, bgcolor: inceptionDocType === val ? "#EFF6FF" : "#F9FAFB", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: inceptionDocType === val ? 700 : 500, color: inceptionDocType === val ? "#1C57B8" : "#6B7280" }}>{label}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ background: "#fff", border: "1px solid #E3EDF7", borderRadius: "14px", p: 3, position: "relative" }}
                    onDragOver={(e) => { e.preventDefault(); if (isInceptionFormValid) setInceptionDragging(true); }}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setInceptionDragging(false); }}
                    onDrop={(e) => { e.preventDefault(); setInceptionDragging(false); if (!isInceptionFormValid) return; const f = e.dataTransfer.files?.[0]; if (f) handleInceptionFileSelect(f); }}
                  >
                    {inceptionView === "uploaded" ? (
                      <Box sx={{ border: "2px solid #BBF7D0", borderRadius: "12px", py: 4, px: 3, textAlign: "center", background: "#F0FDF4" }}>
                        <Box sx={{ width: 52, height: 52, borderRadius: "14px", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1.5 }}>
                          <CheckCircle2 size={26} color="#16A34A" />
                        </Box>
                        <Typography sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 700, color: "#15803D", mb: 0.75 }}>File uploaded successfully</Typography>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#166534" }}>{inceptionFile}</Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{ border: `2px dashed ${inceptionDragging ? "#1C57B8" : "#CBD5E1"}`, borderRadius: "12px", py: 5, textAlign: "center", background: inceptionDragging ? "#EFF6FF" : "#FAFBFC", transition: "all 0.15s" }}
                      >
                        <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1.5 }}>
                          <Upload size={20} color="#64748B" />
                        </Box>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#334155", mb: 2 }}>Drag and drop your file here, or</Typography>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
                          <Box onClick={() => { if (isInceptionFormValid) inceptionInputRef.current?.click(); }} sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, borderRadius: "8px", border: "1px solid #D0D5DD", cursor: isInceptionFormValid ? "pointer" : "not-allowed", opacity: isInceptionFormValid ? 1 : 0.5, bgcolor: "#fff", "&:hover": isInceptionFormValid ? { background: "#F8FAFC" } : {} }}>
                            <FileText size={14} color="#344054" />
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#344054" }}>Choose file</Typography>
                          </Box>
                          <Box onClick={() => { if (isInceptionFormValid) handleDownloadInceptionTemplate(); }} sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, borderRadius: "8px", border: "1px solid #D0D5DD", cursor: isInceptionFormValid ? "pointer" : "not-allowed", opacity: isInceptionFormValid ? 1 : 0.5, bgcolor: "#fff", "&:hover": isInceptionFormValid ? { background: "#F8FAFC" } : {} }}>
                            <Download size={14} color="#344054" />
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#344054" }}>Download template</Typography>
                          </Box>
                        </Box>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#94A3B8", mt: 1.5 }}>
                          {isInceptionFormValid ? ".xlsx, .csv supported" : "Fill in the required Request Details above to enable file upload"}
                        </Typography>
                      </Box>
                    )}
                    {inceptionUploadError && (
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#EF4444", mt: 1 }}>{inceptionUploadError}</Typography>
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", mt: 2.5 }}>
                      <Box
                        onClick={(() => { const ok = inceptionView === "uploaded" && !!inceptionOsTicket.trim() && !!inceptionReceivedDate && Number(inceptionNoOfEmployees) > 0 && !isInceptionUploading; return ok ? handleInceptionSubmit : undefined; })()}
                        sx={{
                          display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 1, borderRadius: "8px",
                          background: (inceptionView === "uploaded" && !!inceptionOsTicket.trim() && !!inceptionReceivedDate && Number(inceptionNoOfEmployees) > 0 && !isInceptionUploading) ? "#1C3A6E" : "#E5E7EB",
                          cursor: (inceptionView === "uploaded" && !!inceptionOsTicket.trim() && !!inceptionReceivedDate && Number(inceptionNoOfEmployees) > 0 && !isInceptionUploading) ? "pointer" : "not-allowed",
                          opacity: (inceptionView === "uploaded" && !!inceptionOsTicket.trim() && !!inceptionReceivedDate && Number(inceptionNoOfEmployees) > 0 && !isInceptionUploading) ? 1 : 0.65,
                          transition: "all 0.15s",
                          "&:hover": (inceptionView === "uploaded" && !!inceptionOsTicket.trim() && !!inceptionReceivedDate && Number(inceptionNoOfEmployees) > 0 && !isInceptionUploading) ? { background: "#152E5A" } : {},
                        }}
                      >
                        {isInceptionUploading ? <CircularProgress size={12} sx={{ color: "#fff" }} /> : <Upload size={14} color={(inceptionView === "uploaded" && !!inceptionOsTicket.trim() && !!inceptionReceivedDate && Number(inceptionNoOfEmployees) > 0) ? "#fff" : "#9CA3AF"} />}
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: (inceptionView === "uploaded" && !!inceptionOsTicket.trim() && !!inceptionReceivedDate && Number(inceptionNoOfEmployees) > 0) ? "#fff" : "#9CA3AF" }}>
                          {isInceptionUploading ? "Uploading…" : "Submit Inception Data"}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

              </Box>
            </>)}

            {/* ── Submitted success page ── */}
            {inceptionView === "loading" && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 3, textAlign: "center" }}>
                <Box sx={{ width: 72, height: 72, borderRadius: "20px", bgcolor: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={36} color="#16A34A" />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 800, color: "#111827", mb: 0.75 }}>Request Submitted Successfully</Typography>
                  <Typography sx={{ fontSize: 15, color: "#6B7280", maxWidth: 420, mx: "auto", lineHeight: 1.7 }}>
                    Your inception data has been received and is being validated. You will be redirected to the progress page shortly.
                  </Typography>
                </Box>
                {inceptionFile && (
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 2, py: 1, bgcolor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "10px" }}>
                    <Upload size={14} color="#16A34A" />
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#15803D", fontWeight: 500 }}>{inceptionFile}</Typography>
                  </Box>
                )}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={14} thickness={5} sx={{ color: "#4B5563" }} />
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4B5563" }}>Taking you to the progress page…</Typography>
                </Box>
              </Box>
            )}

            {/* ── In Progress ── */}
            {inceptionView === "in_progress" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Status banner */}
                <Box sx={{ bgcolor: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "14px", px: 3, py: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <Box sx={{ mt: 0.75, flexShrink: 0 }}><Clock size={20} color="#D97706" /></Box>
                      <Box>
                        <Typography sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 700, color: "#92400E", mb: 0.75 }}>Inception Data In Progress</Typography>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#78350F" }}>
                          File has been submitted and is being validated. Once processing is complete, inception stats will be shown.
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      onClick={() => {
                        if (inceptionRefreshing) return;
                        setInceptionRefreshing(true);
                        setEndorsementRefreshToken((t) => t + 1);
                      }}
                      sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 2, py: 1, borderRadius: "8px", border: "1.5px solid #D97706", bgcolor: "#fff", cursor: inceptionRefreshing ? "default" : "pointer", flexShrink: 0, opacity: inceptionRefreshing ? 0.65 : 1, "&:hover": { bgcolor: inceptionRefreshing ? "#fff" : "#FFFBEB" } }}
                    >
                      {inceptionRefreshing
                        ? <CircularProgress size={13} thickness={5} sx={{ color: "#D97706" }} />
                        : <RefreshCw size={13} color="#D97706" />}
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#D97706" }}>
                        {inceptionRefreshing ? "Checking…" : "Refresh"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Uploaded file status table */}
                {enrollmentUploadRows.length > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#374151", mb: 1.25 }}>Uploaded File Status</Typography>
                    {/* Summary cards */}
                    {enrollmentSummary && (
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5, mb: 1.5 }}>
                        {[
                          { label: "Total records", value: enrollmentSummary.totalCount ?? "—", color: "#1C57B8", border: "#1C57B8" },
                          { label: "Success", value: enrollmentSummary.successCount ?? "—", color: "#16A34A", border: "#16A34A" },
                          { label: "Failed", value: enrollmentSummary.errorCount ?? "—", color: "#DC2626", border: "#DC2626" },
                        ].map((c) => (
                          <Box key={c.label} sx={{ border: `1px solid #E5E7EB`, borderLeft: `4px solid ${c.border}`, borderRadius: "10px", px: 2.5, py: 1.75, bgcolor: "#fff" }}>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", mb: 0.75 }}>{c.label}</Typography>
                            <Typography sx={{ fontSize: 24, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                    <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "10px", overflow: "hidden" }}>
                      <Box sx={{ overflowX: "auto" }}>
                        {/* Header + Rows with resizable columns */}
                        {(() => {
                          const colTplIP = fsColWidths.map(w => `${w}px`).join(" ");
                          const minWIP = fsColWidths.reduce((s, w) => s + w, 0);
                          const hdrsIP = ["Batch ID", "Upload Date", "Enrol Start", "Enrol End", "File Name", "Size", "Total", "Success", "Failed", "Status", "Completed At", "Actions"];
                          return (<>
                        <Box sx={{ display: "grid", gridTemplateColumns: colTplIP, bgcolor: "#EEF2F7", px: 2, py: 1.5, borderBottom: "1px solid #D1D9E8", minWidth: minWIP }}>
                          {hdrsIP.map((h, hi) => (
                            <Box key={h} sx={{ position: "relative", display: "flex", alignItems: "center", overflow: "hidden", pr: "8px" }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h}</Typography>
                              {hi < hdrsIP.length - 1 && (
                                <Box
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    const startX = e.clientX; const startW = fsColWidths[hi];
                                    const onMove = (ev: MouseEvent) => { setFsColWidths(prev => { const next = [...prev]; next[hi] = Math.max(40, startW + ev.clientX - startX); return next; }); };
                                    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                                    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
                                  }}
                                  sx={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 6, cursor: "col-resize", zIndex: 1, "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }, borderRadius: "2px" }}
                                />
                              )}
                            </Box>
                          ))}
                        </Box>
                        {enrollmentUploadRows.map((row: any, idx: number) => {
                          const dpf = row?.documentProcessingFile ?? {};
                          const status: string = (dpf?.processStatus ?? "").toUpperCase();
                          const isProcessing = status === "PROCESSING" || status === "IN_PROGRESS";
                          const isCreated = status === "CREATED" || status === "";
                          const statusColor = isCreated ? "#6B7280" : isProcessing ? "#D97706" : status === "COMPLETED" ? "#16A34A" : "#DC2626";
                          const statusBg = isCreated ? "#F9FAFB" : isProcessing ? "#FFFBEB" : status === "COMPLETED" ? "#F0FDF4" : "#FEF2F2";
                          const statusLabel = status ? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ") : "—";
                          const srcFileId = row?.sourceFile?.id;
                          const errFileId = row?.errorFile?.id;
                          const uploadedFileUrl = srcFileId ? `${endPoints.fileUploadDownload}/${srcFileId}/download` : (dpf?.fileUrl ?? dpf?.documentUrl ?? null);
                          const errorFileUrl = errFileId ? `${endPoints.fileUploadDownload}/${errFileId}/download` : (dpf?.errorFileUrl ?? dpf?.errorDocumentUrl ?? null);
                          const hasErrors = (row?.errorCount ?? dpf?.errorCount ?? 0) > 0;
                          const fileName = row?.sourceFile?.fileName ?? dpf?.originalFileName ?? dpf?.fileName ?? `File ${idx + 1}`;
                          const fmtDate = (v: string | null | undefined) => { if (!v) return "—"; const d = new Date(v); if (isNaN(d.getTime())) return "—"; const dd = String(d.getDate()).padStart(2, "0"); const mm = String(d.getMonth() + 1).padStart(2, "0"); return `${dd}/${mm}/${d.getFullYear()}`; };
                          const fmtDateTime = (v: string | null | undefined) => { if (!v) return "—"; const d = new Date(v); if (isNaN(d.getTime())) return "—"; const dd = String(d.getDate()).padStart(2, "0"); const mm = String(d.getMonth() + 1).padStart(2, "0"); const h = d.getHours(); const hh = String(h % 12 || 12).padStart(2, "0"); const min = String(d.getMinutes()).padStart(2, "0"); const sec = String(d.getSeconds()).padStart(2, "0"); const ampm = h < 12 ? "AM" : "PM"; return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}:${sec} ${ampm}`; };
                          return (
                            <Box key={idx} sx={{ display: "grid", gridTemplateColumns: colTplIP, px: 2, py: 2.25, borderBottom: idx < enrollmentUploadRows.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "center", minWidth: minWIP }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row?.batchId ?? "—"}</Typography>
                              <Typography title={fmtDateTime(row?.createdAt)} sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fmtDateTime(row?.createdAt)}</Typography>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fmtDate(dpf?.enrollmentStartDate)}</Typography>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fmtDate(dpf?.enrollmentEndDate)}</Typography>
                              {srcFileId ? (
                                <Box onClick={() => handleFileDownload(srcFileId, fileName)} title={fileName} sx={{ fontSize: 15, lineHeight: 1.7, color: "#1C57B8", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", textDecoration: "underline", display: "block" }}>{fileName}</Box>
                              ) : (
                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#111827", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</Typography>
                              )}
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280" }}>{row?.sourceFile?.fileSize ?? "—"}</Typography>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151", fontWeight: 500 }}>{row?.processCount ?? "—"}</Typography>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#16A34A", fontWeight: 600 }}>{row?.successCount ?? "—"}</Typography>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: hasErrors ? "#DC2626" : "#6B7280", fontWeight: 600 }}>{row?.errorCount ?? "—"}</Typography>
                              <Box sx={{ display: "inline-flex" }}>
                                <Box sx={{ px: 1, py: 0.3, borderRadius: "6px", bgcolor: statusBg }}>
                                  {isProcessing
                                    ? <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><CircularProgress size={10} sx={{ color: statusColor }} /><Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: statusColor }}>{statusLabel}</Typography></Box>
                                    : <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: statusColor }}>{statusLabel}</Typography>}
                                </Box>
                              </Box>
                              <Typography title={fmtDateTime(dpf?.updatedAt)} sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fmtDateTime(dpf?.updatedAt)}</Typography>
                              <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.5, flexWrap: "nowrap" }}>
                                {isProcessing ? (
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>—</Typography>
                                ) : (<>
                                  {srcFileId && (
                                    <Box onClick={() => handleFileDownload(srcFileId, fileName)} sx={{ display: "flex", alignItems: "center", gap: 0.4, cursor: "pointer" }}>
                                      <Download size={11} color="#1C57B8" />
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#1C57B8", fontWeight: 600 }}>Uploaded</Typography>
                                    </Box>
                                  )}
                                  {hasErrors && errFileId && (
                                    <Box onClick={() => handleFileDownload(errFileId, "error-report.xlsx")} sx={{ display: "flex", alignItems: "center", gap: 0.4, cursor: "pointer" }}>
                                      <Download size={11} color="#DC2626" />
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#DC2626", fontWeight: 600 }}>Errors</Typography>
                                    </Box>
                                  )}
                                  {!srcFileId && !hasErrors && <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>—</Typography>}
                                </>)}
                              </Box>
                            </Box>
                          );
                        })}
                          </>);
                        })()}
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* ── Inception success banner ── */}
            {inceptionView === "completed" && inceptionBannerVisible && (
              <Box sx={{ bgcolor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "12px", px: 3, py: 2, display: "flex", alignItems: "center", gap: 2 }}>
                <CheckCircle2 size={20} color="#16A34A" />
                <Box>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#15803D" }}>Inception Successful</Typography>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#166534" }}>Baseline roster confirmed. Endorsements are now enabled for this policy.</Typography>
                </Box>
              </Box>
            )}

            {/* ── Enrollment history (inception complete) ── */}
            {inceptionView === "completed" && (<>
              {/* ── Endorsement upload form (when endorsement view is upload/uploaded) ── */}
              {(endorsementView === "upload" || endorsementView === "uploaded") && (
                <Box onClick={() => { setEndorsementFile(""); setEndorsementView("history"); }} sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, cursor: "pointer", color: "#667085", width: "fit-content", "&:hover": { color: "#1C57B8" }, transition: "color 0.15s" }}>
                  <ChevronLeft size={16} />
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 500 }}>Back to Enrolment History</Typography>
                </Box>
              )}
              {(endorsementView === "upload" || endorsementView === "uploaded") && (
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5, alignItems: "start" }}>
                  <Box sx={{ background: "#fff", border: "1px solid #E3EDF7", borderRadius: "14px", p: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#667085", letterSpacing: "0.07em" }}>GUIDELINES</Typography>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "10px", px: 2, py: 1.5 }}>
                      <Info size={16} color="#1C57B8" style={{ flexShrink: 0, marginTop: 2 }} />
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#1E3A8A" }}>
                        Use the <strong>Example</strong> column as a reference for the values and formats. Following these formats ensures the file uploads without validation errors.
                      </Typography>
                    </Box>
                    <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "10px", overflow: "hidden" }}>
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", px: 2, py: 1.1, bgcolor: "#F8FAFC", borderBottom: "1px solid #E5E7EB", gap: 2 }}>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#667085", letterSpacing: "0.06em" }}>COLUMN NAME</Typography>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#667085", letterSpacing: "0.06em" }}>FORMAT</Typography>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#667085", letterSpacing: "0.06em" }}>EXAMPLE</Typography>
                      </Box>
                      {PS_ENDORSEMENT_COLS.map((col, i) => (
                        <Box key={col.label} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", px: 2, py: 2.25, gap: 2, alignItems: "center", borderBottom: i < PS_ENDORSEMENT_COLS.length - 1 ? "1px solid #F3F4F6" : "none", bgcolor: "#fff" }}>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: "#111827" }}>{col.label}</Typography>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085" }}>{col.format}</Typography>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#94A3B8" }}>{col.example}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box sx={{ background: "#fff", border: "1px solid #E3EDF7", borderRadius: "14px", p: 3 }}>
                      <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#111827", mb: 0.75 }}>Upload Endorsement Data</Typography>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085", mb: 2 }}>Upload your endorsement file to record mid-term changes. Data will be validated, reviewed, and applied to the active policy.</Typography>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "10px", px: 2, py: 1.5 }}>
                        <Typography sx={{ fontSize: 15, color: "#15803D", lineHeight: 1.7 }}><strong>Endorsement</strong> is submitted on a regular basis throughout the policy year — add new joiners, remove exits, or correct records mid-term.</Typography>
                      </Box>
                    </Box>
                    {/* ── Request Details form ── */}
                    <Box sx={{ background: "#fff", border: "1px solid #E3EDF7", borderRadius: "14px", p: 3 }}>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827", mb: 2 }}>Request Details</Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                          <Box>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 0.75 }}>iTicket Number <Box component="span" sx={{ color: "#EF4444" }}>*</Box></Typography>
                            <Box component="input" value={endorsementOsTicket} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndorsementOsTicket(e.target.value)} placeholder="e.g. INC-12345" sx={{ width: "100%", boxSizing: "border-box", px: 1.5, py: 1, fontSize: 15, lineHeight: 1.7, border: "1px solid #D1D5DB", borderRadius: "8px", outline: "none", "&:focus": { borderColor: "#1C57B8" }, color: "#111827", bgcolor: "#fff" }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 0.75 }}>Request Received Date <Box component="span" sx={{ color: "#EF4444" }}>*</Box></Typography>
                            <Box component="input" type="date" value={endorsementReceivedDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndorsementReceivedDate(e.target.value)} sx={{ width: "100%", boxSizing: "border-box", px: 1.5, py: 1, fontSize: 15, lineHeight: 1.7, border: "1px solid #D1D5DB", borderRadius: "8px", outline: "none", "&:focus": { borderColor: "#1C57B8" }, color: "#111827", bgcolor: "#fff" }} />
                          </Box>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 0.75 }}>Endorsement Type <Box component="span" sx={{ color: "#EF4444" }}>*</Box></Typography>
                          <Box component="select" value={endorsementFormType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEndorsementFormType(e.target.value)} sx={{ width: "100%", boxSizing: "border-box", px: 1.5, py: 1, fontSize: 15, lineHeight: 1.7, border: "1px solid #D1D5DB", borderRadius: "8px", outline: "none", "&:focus": { borderColor: "#1C57B8" }, color: endorsementFormType ? "#111827" : "#9CA3AF", bgcolor: "#fff", appearance: "auto" }}>
                            <option value="">Select type</option>
                            <option value="FINANCIAL_ENDORSEMENT">Financial Endorsement</option>
                            <option value="NON_FINANCIAL_ENDORSEMENT">Non-Financial Endorsement</option>
                          </Box>
                        </Box>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                          <Box>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 0.75 }}>No. of Employees</Typography>
                            <Box component="input" type="number" min="0" value={endorsementNoOfEmployees} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndorsementNoOfEmployees(e.target.value)} placeholder="0" sx={{ width: "100%", boxSizing: "border-box", px: 1.5, py: 1, fontSize: 15, lineHeight: 1.7, border: "1px solid #D1D5DB", borderRadius: "8px", outline: "none", "&:focus": { borderColor: "#1C57B8" }, color: "#111827", bgcolor: "#fff" }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 0.75 }}>No. of Dependents</Typography>
                            <Box component="input" type="number" min="0" value={endorsementNoOfDependents} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndorsementNoOfDependents(e.target.value)} placeholder="0" sx={{ width: "100%", boxSizing: "border-box", px: 1.5, py: 1, fontSize: 15, lineHeight: 1.7, border: "1px solid #D1D5DB", borderRadius: "8px", outline: "none", "&:focus": { borderColor: "#1C57B8" }, color: "#111827", bgcolor: "#fff" }} />
                          </Box>
                        </Box>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                          <Box>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 0.75 }}>Enrolment Start Date</Typography>
                            <Box component="input" type="date" value={endorsementEnrollmentStartDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndorsementEnrollmentStartDate(e.target.value)} sx={{ width: "100%", boxSizing: "border-box", px: 1.5, py: 1, fontSize: 15, lineHeight: 1.7, border: "1px solid #D1D5DB", borderRadius: "8px", outline: "none", "&:focus": { borderColor: "#1C57B8" }, color: "#111827", bgcolor: "#fff" }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 0.75 }}>Enrolment End Date</Typography>
                            <Box component="input" type="date" value={endorsementEnrollmentEndDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndorsementEnrollmentEndDate(e.target.value)} sx={{ width: "100%", boxSizing: "border-box", px: 1.5, py: 1, fontSize: 15, lineHeight: 1.7, border: "1px solid #D1D5DB", borderRadius: "8px", outline: "none", "&:focus": { borderColor: "#1C57B8" }, color: "#111827", bgcolor: "#fff" }} />
                          </Box>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", mb: 0.75 }}>Document Type</Typography>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            {([['with_dependents', 'Employee + Dependents Data'], ['employee_only', 'Employee Only']] as const).map(([val, label]) => (
                              <Box key={val} onClick={() => setEndorsementDocType(val)} sx={{ flex: 1, px: 2, py: 1, borderRadius: "8px", border: `1.5px solid ${endorsementDocType === val ? "#1C57B8" : "#E5E7EB"}`, bgcolor: endorsementDocType === val ? "#EFF6FF" : "#F9FAFB", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: endorsementDocType === val ? 700 : 500, color: endorsementDocType === val ? "#1C57B8" : "#6B7280" }}>{label}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ background: "#fff", border: "1px solid #E3EDF7", borderRadius: "14px", p: 3, position: "relative" }}
                      onDragOver={(e) => { e.preventDefault(); if (isEndorsementFormValid) setEndorsementDragging(true); }}
                      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setEndorsementDragging(false); }}
                      onDrop={(e) => { e.preventDefault(); setEndorsementDragging(false); if (!isEndorsementFormValid) return; const f = e.dataTransfer.files?.[0]; if (f) handleEndorsementFileSelect(f); }}
                    >
                      {endorsementView === "uploaded" ? (
                        <Box sx={{ border: "2px solid #BBF7D0", borderRadius: "12px", py: 4, px: 3, textAlign: "center", background: "#F0FDF4" }}>
                          <Box sx={{ width: 52, height: 52, borderRadius: "14px", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1.5 }}><CheckCircle2 size={26} color="#16A34A" /></Box>
                          <Typography sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 700, color: "#15803D", mb: 0.75 }}>File uploaded successfully</Typography>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#166534" }}>{endorsementFile}</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ border: `2px dashed ${endorsementDragging ? "#1C57B8" : "#CBD5E1"}`, borderRadius: "12px", py: 5, textAlign: "center", background: endorsementDragging ? "#EFF6FF" : "#FAFBFC", transition: "all 0.15s" }}>
                          <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1.5 }}><Upload size={20} color="#64748B" /></Box>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#334155", mb: 2 }}>Drag and drop your file here, or</Typography>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
                            <Box onClick={() => { if (isEndorsementFormValid) endorsementInputRef.current?.click(); }} sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, borderRadius: "8px", border: "1px solid #D0D5DD", cursor: isEndorsementFormValid ? "pointer" : "not-allowed", opacity: isEndorsementFormValid ? 1 : 0.5, bgcolor: "#fff", "&:hover": isEndorsementFormValid ? { background: "#F8FAFC" } : {} }}>
                              <FileText size={14} color="#344054" />
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#344054" }}>Choose file</Typography>
                            </Box>
                            <Box onClick={() => { if (isEndorsementFormValid) handleDownloadEndorsementTemplate(); }} sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, borderRadius: "8px", border: "1px solid #D0D5DD", cursor: isEndorsementFormValid ? "pointer" : "not-allowed", opacity: isEndorsementFormValid ? 1 : 0.5, bgcolor: "#fff", "&:hover": isEndorsementFormValid ? { background: "#F8FAFC" } : {} }}>
                              <Download size={14} color="#344054" />
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#344054" }}>Download template</Typography>
                            </Box>
                          </Box>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#94A3B8", mt: 1.5 }}>
                            {isEndorsementFormValid ? ".xlsx, .csv supported" : "Fill in the required Request Details above to enable file upload"}
                          </Typography>
                        </Box>
                      )}
                      {endorsementUploadError && <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#EF4444", mt: 1 }}>{endorsementUploadError}</Typography>}
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", mt: 2.5 }}>
                        <Box
                          onClick={(() => { const ok = endorsementView === "uploaded" && !!endorsementOsTicket.trim() && !!endorsementReceivedDate && !!endorsementFormType && !isEndorsementUploading; return ok ? () => handleEndorsementSubmit() : undefined; })()}
                          sx={{
                            display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 1, borderRadius: "8px",
                            background: (endorsementView === "uploaded" && !!endorsementOsTicket.trim() && !!endorsementReceivedDate && !!endorsementFormType && !isEndorsementUploading) ? "#1C3A6E" : "#E5E7EB",
                            cursor: (endorsementView === "uploaded" && !!endorsementOsTicket.trim() && !!endorsementReceivedDate && !!endorsementFormType && !isEndorsementUploading) ? "pointer" : "not-allowed",
                            opacity: (endorsementView === "uploaded" && !!endorsementOsTicket.trim() && !!endorsementReceivedDate && !!endorsementFormType && !isEndorsementUploading) ? 1 : 0.65,
                            transition: "all 0.15s",
                            "&:hover": (endorsementView === "uploaded" && !!endorsementOsTicket.trim() && !!endorsementReceivedDate && !!endorsementFormType && !isEndorsementUploading) ? { background: "#152E5A" } : {},
                          }}
                        >
                          {isEndorsementUploading ? <CircularProgress size={12} sx={{ color: "#fff" }} /> : <Upload size={14} color={(endorsementView === "uploaded" && !!endorsementOsTicket.trim() && !!endorsementReceivedDate && !!endorsementFormType) ? "#fff" : "#9CA3AF"} />}
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: (endorsementView === "uploaded" && !!endorsementOsTicket.trim() && !!endorsementReceivedDate && !!endorsementFormType) ? "#fff" : "#9CA3AF" }}>{isEndorsementUploading ? "Uploading…" : "Submit Endorsement Data"}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* ── Endorsement submitted loading state ── */}
              {endorsementView === "loading" && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, textAlign: "center", minHeight: 220 }}>
                  <Box sx={{ width: 72, height: 72, borderRadius: "20px", bgcolor: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={36} color="#16A34A" /></Box>
                  <Box>
                    <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 800, color: "#111827", mb: 0.75 }}>Endorsement Submitted</Typography>
                    <Typography sx={{ fontSize: 15, color: "#6B7280", maxWidth: 420, mx: "auto", lineHeight: 1.7 }}>Your endorsement file has been received and is being processed.</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={14} thickness={5} sx={{ color: "#9CA3AF" }} />
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>Processing your endorsement…</Typography>
                  </Box>
                </Box>
              )}

              {endorsementView === "success" && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2.5, textAlign: "center", minHeight: 260, px: 4 }}>
                  <Box sx={{ width: 80, height: 80, borderRadius: "50%", bgcolor: "#DCFCE7", border: "4px solid #BBF7D0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 size={40} color="#16A34A" />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#111827", mb: 0.75, lineHeight: 1.25 }}>Successfully Submitted!</Typography>
                    <Typography sx={{ fontSize: 15, color: "#6B7280", maxWidth: 380, mx: "auto", lineHeight: 1.7 }}>
                      Your endorsement has been submitted successfully. Redirecting you back to the enrolment page…
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 0.75, borderRadius: "20px", bgcolor: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                    <CircularProgress size={12} thickness={5} sx={{ color: "#16A34A" }} />
                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#15803D" }}>Redirecting…</Typography>
                  </Box>
                </Box>
              )}

              {/* ── Enrollment history cards ── */}
              {endorsementView === "history" && (
                <Box sx={{ mt: "60px" }}>
                  {/* ── Actual header (observed for sticky trigger) ── */}
                  <Box ref={enrollHistoryHeaderRef} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#111827" }}>Enrolment history</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {enrollmentCardExpanded !== -1 && (
                        <Box onClick={() => setEnrollmentCardExpanded(-1)} sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.75, py: 0.85, borderRadius: "8px", border: "1px solid #D0D5DD", cursor: "pointer", background: "#fff", "&:hover": { background: "#F8FAFC" }, transition: "background 0.15s" }}>
                          <ChevronsUpDown size={13} color="#344054" />
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: "#344054" }}>Collapse All</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* ── Enrollment overview cards ── */}
                  {(() => {
                    const pd = policyDashboardData;
                    const empCount = policyRow?.employeeCount ?? pd?.employeeAndDependents?.employeeCount ?? 0;
                    const depCount = policyRow?.dependentCount ?? pd?.employeeAndDependents?.dependentsCount ?? 0;
                    const totalLivesPD = policyRow?.totalLives ?? (empCount + depCount);
                    // Card 2 ("Enrolment Status") uses policy_enrollment_summary (enrollSummary)
                    // instead of dashboard_policy_cards (policyRow/pd above, still used by Card 1
                    // "Lives Covered"). enrollSummary is already scoped to the current enrollment
                    // drive and uses the real employee_enrollment_status_key, not
                    // dashboard_policy_cards' login-activity-based proxy. Falls back to the old
                    // policyRow/pd source only while enrollSummary hasn't loaded yet.
                    const hasEnrollSummary = !!enrollSummary;
                    const statusEmpCount = hasEnrollSummary ? Number(enrollSummary.totalEmployees ?? 0) : empCount;
                    const inProgressPD = hasEnrollSummary
                      ? Number(enrollSummary.inProgressCount ?? 0)
                      : Number(policyRow?.inProgressCount ?? pd?.enrollmentStatus?.inProgressCount ?? 0);
                    const enrolledCount = hasEnrollSummary
                      ? Number(enrollSummary.enrolledCount ?? 0)
                      : Number(policyRow?.enrolledCount ?? Math.max(0, empCount - inProgressPD));
                    const notStartedPD = hasEnrollSummary
                      ? Number(enrollSummary.notStartedCount ?? 0)
                      : Math.max(0, empCount - enrolledCount - inProgressPD);
                    // No current enrollment drive open, but the policy has real endorsement
                    // history — show a dedicated empty state instead of a misleading "0/0/0".
                    const noCurrentEnrollmentPeriod = hasEnrollSummary
                      && statusEmpCount === 0
                      && Number(endorsementOverview?.totalEndorsements ?? 0) > 0;
                    const enrolledPct = statusEmpCount > 0 ? Math.max(0, Math.min(100, Math.round(((statusEmpCount - notStartedPD) / statusEmpCount) * 100))) : 100;
                    const empPct = Math.round((empCount / Math.max(totalLivesPD, 1)) * 100);
                    const depPct = Math.round((depCount / Math.max(totalLivesPD, 1)) * 100);

                    if (endorsementLoading || policyDashboardLoading || policyRowLoading) {
                      return (
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0,180px) 1fr", md: "minmax(0,200px) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)" }, gap: 2, alignItems: "stretch", mb: "32px" }}>
                          {[180, 1, 1, 1].map((_, i) => (
                            <Box
                              key={i}
                              sx={{
                                borderRadius: "14px",
                                height: i === 0 ? 230 : 160,
                                background: "linear-gradient(90deg, #E7EAEE 25%, #F0F3F6 50%, #E7EAEE 75%)",
                                backgroundSize: "600px 100%",
                                "@keyframes shimmer": { "0%": { backgroundPosition: "-300px 0" }, "100%": { backgroundPosition: "300px 0" } },
                                animation: "shimmer 1.2s infinite linear",
                              }}
                            />
                          ))}
                        </Box>
                      );
                    }
                    return (
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0,180px) 1fr", md: "minmax(0,200px) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)" }, gap: 2, alignItems: "stretch", mb: "32px" }}>

                        {/* ── Card 1: Lives Covered — who is on the policy ─────────── */}
                        <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: "1px solid #E8EDF5", boxShadow: "0 1px 6px rgba(28,87,184,0.06)", px: 2, pt: 2, pb: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", minHeight: 28 }}>
                            <Tooltip title="Everyone ever added to this policy's roster, across its entire history — not limited to the current enrolment period." arrow placement="bottom">
                              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.07em", lineHeight: 1, cursor: "help", borderBottom: "1px dashed #D1D5DB" }}>Lives Covered</Typography>
                            </Tooltip>
                          </Box>
                          {/* Vertical bar chart + total callout */}
                          {(() => {
                            const bars = [
                              { label: "Employees", value: empCount, color: "#6B98F7" },
                              { label: "Dependents", value: depCount, color: "#34C78A" },
                            ];
                            const minVal = Math.min(empCount, depCount);
                            const maxVal = Math.max(empCount, depCount);
                            const spread = maxVal - minVal;
                            const getBarPct = (v: number) =>
                              spread === 0 ? 100 : 55 + Math.round(((v - minVal) / spread) * 45);
                            return (
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 0, flex: 1, justifyContent: "space-between" }}>
                                {/* Chart area */}
                                <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 2, height: 100 }}>
                                  {bars.map((b) => (
                                    <Box key={b.label} sx={{ width: 52, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                                      <Typography sx={{ fontSize: 16, fontWeight: 800, color: b.color, lineHeight: 1, mb: 0.5 }}>{formatNumberByLocalization(b.value, localizationData?.data)}</Typography>
                                      <Box sx={{ width: "100%", height: `${getBarPct(b.value)}%`, bgcolor: b.color, borderRadius: "5px 5px 0 0" }} />
                                    </Box>
                                  ))}
                                </Box>
                                {/* Baseline */}
                                {/* <Box sx={{ height: "1px", bgcolor: "#E5E7EB" }} /> */}
                                {/* Labels */}
                                <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 0.75 }}>
                                  {bars.map((b) => (
                                    <Box key={b.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <Box sx={{ width: 7, height: 7, borderRadius: "2px", bgcolor: b.color, flexShrink: 0 }} />
                                      <Typography sx={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>{b.label}</Typography>
                                    </Box>
                                  ))}
                                </Box>
                                {/* Total callout */}
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1, px: 1.25, py: 0.75, borderRadius: "10px", bgcolor: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                                  <Typography sx={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>Total Lives</Typography>
                                  <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{formatNumberByLocalization(totalLivesPD, localizationData?.data)}</Typography>
                                </Box>
                              </Box>
                            );
                          })()}
                        </Box>

                        {/* ── Card 2: Enrollment Status RK1811 ────────────────────────────── */}
                            <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: "1px solid #E8EDF5", boxShadow: "0 1px 6px rgba(28,87,184,0.06)", px: 3, pt: 2.5, pb: 2.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
                          <Box sx={{ display: "flex", flexDirection: "column", minHeight: 36 }}>
                            <Tooltip title="Employees only (dependents not counted here) — and only for the current enrolment period, not the policy's full history. This is why this number can differ from the 'Added' figure on an endorsement card below, which counts employees + dependents together for that one drive." arrow placement="bottom">
                              <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.07em", lineHeight: 1, cursor: "help", borderBottom: "1px dashed #D1D5DB", display: "inline-block", pb:2 }}>Enrolment Status</Typography>
                            </Tooltip>
                            <Typography sx={{ fontSize: 14, color: "#374151", fontWeight: 500, mt: 1, borderBottom: "1px solid #E5E7EB", pb:2, pt:2 }}>
                              Current enrolment period
                              {enrollSummary?.currentPeriodStart && enrollSummary?.currentPeriodEnd && (
                                <Box component="span" sx={{ color: "#9CA3AF" }}> ({enrollSummary.currentPeriodStart} – {enrollSummary.currentPeriodEnd})</Box>
                              )}
                            </Typography>
                          </Box>
                          {/* Ring chart — minimal */}
                          {(() => {
                            const segments = [
                              { label: "Enroled", value: enrolledCount, color: "#4F46E5" },
                              { label: "In Progress", value: inProgressPD, color: "#D97706" },
                              { label: "Enrolment Not Started", value: notStartedPD, color: notStartedPD > 0 ? "#DC2626" : "#E5E7EB" },
                            ];
                            const total = Math.max(statusEmpCount, 1);
                            const sz = 160, r = 62, cx = 80, cy = 80;
                            const circ = 2 * Math.PI * r;
                            const gap = 3;
                            let offset = 0;
                            const arcs = segments.map((s) => {
                              const len = Math.max(0, (s.value / total) * circ - (s.value > 0 ? gap : 0));
                              const arc = { ...s, len, offset };
                              offset += len + (s.value > 0 ? gap : 0);
                              return arc;
                            });
                            if (noCurrentEnrollmentPeriod) {
                              return (
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, py: 4, textAlign: "center" }}>
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>
                                    There is no current ongoing enrolment period for this policy.
                                  </Typography>
                                </Box>
                              );
                            }
                            return (
                              <Box sx={{ display: "flex", flexDirection: "column", flex: 1, gap: 1.5 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 3.5, flex: 1, px: 1 }}>
                                  {/* Ring */}
                                  {/* <Box sx={{ position: "relative", width: sz, height: sz, flexShrink: 0 }}>
                                    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{ display: "block", transform: "rotate(-90deg)" }}>
                                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth="16" />
                                      {arcs.map((a) => a.len > 0 && (
                                        <circle key={a.label} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth="16"
                                          strokeDasharray={`${a.len} ${circ - a.len}`} strokeDashoffset={-a.offset} />
                                      ))}
                                    </svg>
                                    <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <Box sx={{ width: 92, textAlign: "center", overflow: "hidden" }}>
                                        <Typography sx={{ fontSize: empCount >= 10000 ? 16 : empCount >= 1000 ? 20 : 24, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{empCount}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500, lineHeight: 1, mt: 0.5 }}>employees</Typography>
                                      </Box>
                                    </Box>
                                  </Box> */}
                                  {/* Legend */}
                                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                                    {segments.map((s) => (
                                      <Box key={s.label} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: s.color, flexShrink: 0 }} />
                                        <Typography sx={{ fontSize: 15, color: "#6B7280", fontWeight: 500, flex: 1 }}>{s.label}</Typography>
                                        <Typography sx={{ fontSize: 20, fontWeight: 800, color: s.value > 0 ? s.color : "#9CA3AF", lineHeight: 1 }}>{s.value}</Typography>
                                      </Box>
                                    ))}
                                  </Box>
                                </Box>
                                {(notStartedPD > 0 || inProgressPD > 0) && (
                                  <Box onClick={openSendReminderDialog} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.5, py: 1, borderRadius: "10px", bgcolor: "#4F46E5", border: "1px solid #4338CA", cursor: "pointer", "&:hover": { bgcolor: "#4338CA" }, transition: "background 0.15s" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                                      <Mail size={13} color="#fff" />
                                      <Typography sx={{ fontSize: 15, color: "#fff", fontWeight: 500 }}>Send Reminder</Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{notStartedPD + inProgressPD}</Typography>
                                  </Box>
                                )}
                              </Box>
                            );
                          })()}
                        </Box>

                        {/* ── Cards 3+4 Combined: Policy Journey & Enrolment Summary ── */}
                        {(() => {
                          // Lives Journey (was Employee Journey) — inception/added/deleted/current
                          // are now LIVES counts (employees + dependents), reading the
                          // already-computed livesAtInception/livesInAddition/livesInDeletion/
                          // totalEligibleLives fields from endorsement_employee_metrics (FIX 1d/1i)
                          // instead of the employees-only fields. "Current" is the current ROSTER
                          // lives count (totalEligibleLives, FIX 1i) — not activeLives, which is
                          // gated by enrolment completion and was showing enrolled headcount
                          // instead of the full current roster (confirmed via policy 953191). No
                          // eligible/total denominator or percent; per instruction, this card no
                          // longer shows an "X / Eligible" ratio.
                          const livesAdded = Number(endorsementOverview?.livesInAddition ?? endorsementMetrics?.livesInAddition ?? 0);
                          const livesRemoved = Number(endorsementOverview?.livesInDeletion ?? endorsementMetrics?.livesInDeletion ?? 0);
                          const incLives = Number(endorsementMetrics?.livesAtInception ?? 0);
                          const currentLives = Number(endorsementMetrics?.totalEligibleLives ?? endorsementMetrics?.activeLives ?? 0);
                          const nonInceptionEnds = endorsementList.filter((e) => !isInceptionRecord(e));
                          const latestEnd = nonInceptionEnds[0];
                          const today = new Date(); today.setHours(0, 0, 0, 0);
                          const parseDDMMYYYY = (s: string) => {
                            if (!s) return null;
                            const parts = s.split("/");
                            if (parts.length === 3) {
                              const [d, m, y] = parts.map(Number);
                              const dt = new Date(y, m - 1, d);
                              return isNaN(dt.getTime()) ? null : dt;
                            }
                            const fallback = new Date(s);
                            return isNaN(fallback.getTime()) ? null : fallback;
                          };
                          const openEnd = nonInceptionEnds.find((e) => {
                            const ed = parseDDMMYYYY(String((e as any).enrollmentEndDate ?? ""));
                            return ed && ed >= today;
                          });
                          // Inception uses rawNetPremium — the inception endorsement's own frozen
                          // batch value (COALESCE(e.net_premium, policy.premium_at_inception)) — not
                          // netPremium (a live, growing sum of enrolled employees' current
                          // total_premium). Per instruction, Inception should reflect what was
                          // recorded when the batch was originally processed, not drift upward as
                          // enrolled employees' premiums change afterward — that drift is exactly
                          // what "Current" (below) is for. Added/Deleted stay on netPremium, the same
                          // source the Lives side already reads from (nonInceptionEnds above): Added =
                          // sum of positive netPremium across all non-inception rows; Deleted = sum of
                          // |negative netPremium| across all non-inception rows. Current is the
                          // running total of the three tiles to its left — Inception + Added -
                          // Deleted — so the whole strip is one arithmetic chain end to end, no
                          // separate/disconnected figure to reconcile by hand. No "Total Premium"
                          // denominator or coverage percent — per instruction, this card shows a
                          // single current figure, not a ratio.
                          const inceptionEnds = endorsementList.filter(isInceptionRecord);
                          const incPrem = inceptionEnds.length
                            ? inceptionEnds.reduce((sum, e) => sum + Number((e as any).rawNetPremium ?? 0), 0)
                            : null;
                          const addPrem = nonInceptionEnds.reduce((sum, e) => {
                            const np = Number(e.netPremium ?? 0);
                            return np > 0 ? sum + np : sum;
                          }, 0);
                          const delPrem = nonInceptionEnds.reduce((sum, e) => {
                            const np = Number(e.netPremium ?? 0);
                            return np < 0 ? sum + Math.abs(np) : sum;
                          }, 0);
                          const currentPrem = (incPrem ?? 0) + addPrem - delPrem;
                          const processedEnds = nonInceptionEnds.length;
                          return (
                            <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: "1px solid #E8EDF5", boxShadow: "0 1px 6px rgba(28,87,184,0.06)", p: 3, display: "flex", flexDirection: "column", gap: 2, gridColumn: { xs: "1 / -1", sm: "1 / -1", md: "span 2" }, minWidth: 0 }}>

                              {/* Header: title + processed counter top-right */}
                              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                                <Box>
                                  <Tooltip title="How the policy has grown through endorsements since inception, and how enrolment is progressing against that grown roster. Inception/Added figures reflect this policy's entire history; Enrolled reflects who has actually completed enrolment right now." arrow placement="bottom">
                                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.07em", lineHeight: 1, cursor: "help", borderBottom: "1px dashed #D1D5DB", display: "inline-block" }}>Policy Journey & Enrolment Summary</Typography>
                                  </Tooltip>
                                  <Typography sx={{ fontSize: 14, color: "#374151", fontWeight: 500, mt: 0.4 }}>Policy growth through endorsements and current enrolment</Typography>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.3 }}>
                                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#1C57B8", lineHeight: 1 }}>{processedEnds}</Typography>
                                  <Typography sx={{ fontSize: 15, color: "#6B7280", fontWeight: 400, ml: 0.75 }}>Endorsements</Typography>
                                </Box>
                              </Box>

                              {/* Divider */}
                              <Box sx={{ height: "1px", bgcolor: "#F3F4F6" }} />

                              {/* Body: two equal halves, center-aligned */}
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, flexWrap: { xs: "wrap", md: "nowrap" }, gap: { xs: 2, md: 0 } }}>

                                {/* Left: Lives Journey — centered, constrained width */}
                                <Box sx={{ width: { xs: "100%", md: "44%" }, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, pr: { xs: 0, md: 7 }, pl: { xs: 0, md: 2 } }}>
                                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Lives Journey</Typography>
                                  <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                                    {/* Inception */}
                                    <Box sx={{ textAlign: "center", minWidth: 0, flexShrink: 1 }}>
                                      <Typography sx={{ fontSize: 30, fontWeight: 800, color: "#1C57B8", lineHeight: 1 }}>{incLives}</Typography>
                                      <Tooltip title="Lives (employees + dependents) covered at the original policy inception — a roster count, not gated by enrolment status." arrow placement="bottom">
                                        <Typography sx={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500, mt: 0.4, cursor: "help", borderBottom: "1px dashed #D1D5DB", display: "inline-block" }}>Inception</Typography>
                                      </Tooltip>
                                    </Box>
                                    {/* Added arrow */}
                                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", px: 1 }}>
                                      <Box sx={{ px: 1, py: 0.35, mb: 0.6, borderRadius: "20px", bgcolor: livesAdded > 0 ? "#D1FAE5" : "#F3F4F6", border: `1px solid ${livesAdded > 0 ? "#A7F3D0" : "#E5E7EB"}` }}>
                                        <Typography sx={{ fontSize: 15, fontWeight: 800, color: livesAdded > 0 ? "#059669" : "#D1D5DB", lineHeight: 1 }}>+{livesAdded}</Typography>
                                      </Box>
                                      <Box sx={{ width: "100%", position: "relative", height: 3, bgcolor: livesAdded > 0 ? "#A7F3D0" : "#F3F4F6", borderRadius: "2px" }}>
                                        <Box sx={{ position: "absolute", right: -1, top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `7px solid ${livesAdded > 0 ? "#059669" : "#D1D5DB"}` }} />
                                      </Box>
                                      <Tooltip title="Lives (employees + dependents) added via later endorsements (not inception), all-time — a roster count, not gated by enrolment status." arrow placement="bottom">
                                        <Typography sx={{ fontSize: 13, color: "#9CA3AF", mt: 0.6, cursor: "help", borderBottom: "1px dashed #D1D5DB", display: "inline-block" }}>Added</Typography>
                                      </Tooltip>
                                    </Box>
                                    {/* Deleted arrow */}
                                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", px: 1 }}>
                                      <Box sx={{ px: 1, py: 0.35, mb: 0.6, borderRadius: "20px", bgcolor: livesRemoved > 0 ? "#FEE2E2" : "#F3F4F6", border: `1px solid ${livesRemoved > 0 ? "#FECACA" : "#E5E7EB"}` }}>
                                        <Typography sx={{ fontSize: 15, fontWeight: 800, color: livesRemoved > 0 ? "#DC2626" : "#D1D5DB", lineHeight: 1 }}>−{livesRemoved}</Typography>
                                      </Box>
                                      <Box sx={{ width: "100%", position: "relative", height: 3, bgcolor: livesRemoved > 0 ? "#FECACA" : "#F3F4F6", borderRadius: "2px" }}>
                                        <Box sx={{ position: "absolute", right: -1, top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `7px solid ${livesRemoved > 0 ? "#DC2626" : "#D1D5DB"}` }} />
                                      </Box>
                                      <Tooltip title="Lives (employees + dependents) removed via endorsements, all-time — a roster count, not gated by enrolment status." arrow placement="bottom">
                                        <Typography sx={{ fontSize: 13, color: "#9CA3AF", mt: 0.6, cursor: "help", borderBottom: "1px dashed #D1D5DB", display: "inline-block" }}>Deleted</Typography>
                                      </Tooltip>
                                    </Box>
                                    {/* Current */}
                                    <Box sx={{ textAlign: "center", minWidth: 0, flexShrink: 1 }}>
                                      <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#7C3AED", lineHeight: 1, whiteSpace: "normal", wordBreak: "break-word" }}>
                                        {currentLives}
                                      </Typography>
                                      <Tooltip title="Current total lives (employees + dependents) on the policy roster right now — a roster count, not gated by enrolment status." arrow placement="bottom">
                                        <Typography sx={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500, mt: 0.4, cursor: "help", borderBottom: "1px dashed #D1D5DB", display: "inline-block" }}>Current</Typography>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                </Box>

                                {/* Vertical divider — hidden on xs */}
                                <Box sx={{ width: "1px", bgcolor: "#E5E7EB", alignSelf: "stretch", flexShrink: 0, display: { xs: "none", md: "block" } }} />

                                {/* Right: Premium Journey — centered, constrained width */}
                                <Box sx={{ width: { xs: "100%", md: "44%" }, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, pl: { xs: 0, md: 7 }, pr: { xs: 0, md: 2 } }}>
                                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>Premium Journey</Typography>
                                  <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                                    {/* Inception */}
                                    <Box sx={{ textAlign: "center", minWidth: 74, flexShrink: 0 }}>
                                      <Typography sx={{ fontSize: 18, fontWeight: 800, color: "#1C57B8", lineHeight: 1, whiteSpace: "nowrap" }}>{incPrem != null ? formatINR(incPrem, localizationData?.data) : "—"}</Typography>
                                      <Tooltip title="The inception endorsement's own frozen premium, as recorded when this batch was originally processed — not a live figure, so it won't drift if enrolled employees' premiums change later." arrow placement="bottom">
                                        <Typography sx={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500, mt: 0.4, cursor: "help", borderBottom: "1px dashed #D1D5DB", display: "inline-block" }}>Inception</Typography>
                                      </Tooltip>
                                    </Box>
                                    {/* Added arrow */}
                                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", px: 1 }}>
                                      <Box sx={{ px: 1, py: 0.35, mb: 0.5, borderRadius: "20px", bgcolor: addPrem > 0 ? "#D1FAE5" : "#F3F4F6", border: `1px solid ${addPrem > 0 ? "#A7F3D0" : "#E5E7EB"}` }}>
                                        <Typography sx={{ fontSize: 13, fontWeight: 800, color: addPrem > 0 ? "#059669" : "#D1D5DB", lineHeight: 1 }}>{addPrem > 0 ? `+${formatINR(addPrem, localizationData?.data)}` : "—"}</Typography>
                                      </Box>
                                      <Box sx={{ width: "100%", position: "relative", height: 3, bgcolor: addPrem > 0 ? "#A7F3D0" : "#F3F4F6", borderRadius: "2px" }}>
                                        <Box sx={{ position: "absolute", right: -1, top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `7px solid ${addPrem > 0 ? "#059669" : "#D1D5DB"}` }} />
                                      </Box>
                                      <Tooltip title="Sum of positive net premium across all non-inception endorsements, all-time — the policy's entire history, not just any currently-open drive." arrow placement="bottom">
                                        <Typography sx={{ fontSize: 13, color: "#9CA3AF", mt: 0.5, cursor: "help", borderBottom: "1px dashed #D1D5DB", display: "inline-block" }}>Added</Typography>
                                      </Tooltip>
                                    </Box>
                                    {/* Deleted arrow */}
                                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", px: 1 }}>
                                      <Box sx={{ px: 1, py: 0.35, mb: 0.5, borderRadius: "20px", bgcolor: delPrem > 0 ? "#FEE2E2" : "#F3F4F6", border: `1px solid ${delPrem > 0 ? "#FECACA" : "#E5E7EB"}` }}>
                                        <Typography sx={{ fontSize: 13, fontWeight: 800, color: delPrem > 0 ? "#DC2626" : "#D1D5DB", lineHeight: 1 }}>{delPrem > 0 ? `−${formatINR(delPrem, localizationData?.data)}` : "—"}</Typography>
                                      </Box>
                                      <Box sx={{ width: "100%", position: "relative", height: 3, bgcolor: delPrem > 0 ? "#FECACA" : "#F3F4F6", borderRadius: "2px" }}>
                                        <Box sx={{ position: "absolute", right: -1, top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `7px solid ${delPrem > 0 ? "#DC2626" : "#D1D5DB"}` }} />
                                      </Box>
                                      <Tooltip title="Sum of |negative net premium| across all non-inception endorsements, all-time — net premium removed via deletions." arrow placement="bottom">
                                        <Typography sx={{ fontSize: 13, color: "#9CA3AF", mt: 0.5, cursor: "help", borderBottom: "1px dashed #D1D5DB", display: "inline-block" }}>Deleted</Typography>
                                      </Tooltip>
                                    </Box>
                                    {/* Current */}
                                    <Box sx={{ textAlign: "center", minWidth: 0, flexShrink: 1, maxWidth: 150 }}>
                                      <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#111827", lineHeight: 1.3, whiteSpace: "normal", wordBreak: "break-word" }}>
                                        {formatINR(currentPrem, localizationData?.data)}
                                      </Typography>
                                      <Tooltip title="Running total across the policy's entire endorsement history: Inception + Added − Deleted net premium." arrow placement="bottom">
                                        <Typography sx={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500, mt: 0.4, cursor: "help", borderBottom: "1px dashed #D1D5DB", display: "inline-block", whiteSpace: "normal" }}>Current</Typography>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                </Box>

                              </Box>

                              {/* Footer: blue pill — pushed to bottom */}
                              <Box sx={{ mt: "auto", display: "flex", alignItems: "center", px: 2, py: 1.25, borderRadius: "10px", bgcolor: "#EEF2FF", border: "1px solid #C7D7F9", gap: 2 }}>
                                {openEnd ? (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                                    <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#059669", flexShrink: 0 }} />
                                    <Typography sx={{ fontSize: 15, color: "#059669", fontWeight: 600 }}>Enrolment open</Typography>
                                  </Box>
                                ) : (
                                  <Typography sx={{ fontSize: 15, color: "#6B7280", fontWeight: 500 }}>No open endorsement</Typography>
                                )}
                                {latestEnd && (
                                  <>
                                    <Box sx={{ width: "1px", height: 14, bgcolor: "#C7D7F9", flexShrink: 0 }} />
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <Clock size={13} color="#9CA3AF" />
                                      <Typography sx={{ fontSize: 15, color: "#6B7280" }}>
                                        Latest Endorsement: <Box component="span" sx={{ fontWeight: 600, color: "#374151" }}>{fmt(latestEnd.endorsementDate ?? latestEnd.createdAt ?? latestEnd.date)}</Box>
                                      </Typography>
                                    </Box>
                                  </>
                                )}
                              </Box>

                            </Box>
                          );
                        })()}

                      </Box>
                    );
                  })()}

                  {endorsementLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={24} /></Box>
                  ) : mergedEnrollmentHistory.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 6 }}>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>
                        {/* endorsementList (and therefore mergedEnrollmentHistory) is scoped to
                            only the currently-open enrollment drive — see endorsement_list report
                            fix. A policy with real endorsement/inception history but nothing open
                            right now lands here too, so distinguish that from a genuinely empty
                            policy using the lifetime-scoped endorsementOverview signal. */}
                        {Number(endorsementOverview?.totalEndorsements ?? 0) > 0
                          ? "There is no current ongoing enrolment period for this policy."
                          : "No enrolment records found for this policy."}
                      </Typography>
                    </Box>
                  ) : mergedEnrollmentHistory.map((item, index) => {
                    const isExpanded = enrollmentCardExpanded === index;
                    const isEndorsementCard = item.cardType === "endorsement";
                    const itemIsInception = item.cardType === "inception" || (item as any).isInception === true;
                    const netPremiumDisplay = (item as any).premiumRows?.find(([l]: [string,string]) => l === "Net Premium")?.[1] ?? (item as any).netGross ?? "—";
                    const premiumDelta = (item as any).premiumRows?.find(([l]: [string,string]) => l === "Gross Premium")?.[1] ?? netPremiumDisplay;
                    const eid: number = (item as any).rawEndorsementId;
                    const stepSummary = isEndorsementCard ? endorsementSummaryMap[eid] : inceptionStepsSummary;
                    // Status: initial statuses → "Enrolment request received"; others → "Enrolment completed"
                    let statusText: string;
                    let statusStyle: { color: string; bg: string; border: string };
                    const dbStatusRaw = ((item as any).endorsementStatus || "").toUpperCase().trim();
                    const notStSt = Number(stepSummary?.notLoggedInCount ?? 0);
                    const inPrSt = Number(stepSummary?.inProgressCount ?? 0);

                    const isInitialStatus =
                      dbStatusRaw === "ENDORSEMENT_REQUEST_RECEIVED" ||
                      dbStatusRaw === "ENDORSEMENT_CREATED" ||
                      dbStatusRaw === "";
                    if (isInitialStatus) {
                      statusText = dbStatusRaw === "ENDORSEMENT_CREATED" ? "Endorsement created" : "Enrolment request received";
                      statusStyle = { color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB" };
                    } else if (notStSt > 0 || inPrSt > 0) {
                      statusText = "Enrolment in progress";
                      statusStyle = { color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" };
                    } else {
                      statusText = "Enrolment completed";
                      statusStyle = { color: "#1C57B8", bg: "#EBF3FF", border: "#BFDBFE" };
                    }
                    const rawEmp = (item as any).endorsmentCount;
                    const rawDep = (item as any).endorsmentDependentCount;
                    // stepSummary from endorsement-steps API (has full stats)
                    // rawEmp/rawDep from endorsement_list (only headcount)
                    const emp5 = Number(stepSummary?.totalEmployees ?? rawEmp ?? 0);
                    const dep5 = Number(stepSummary?.totalDependents ?? rawDep ?? 0);
                    // Raw total lives — matches iWork's endorsementSummary.totalLives exactly
                    // (totalEmployees + totalDependents, no enrolment-status filtering).
                    const rawTotalLives5 = stepSummary?.totalLives != null
                      ? Number(stepSummary.totalLives)
                      : emp5 + dep5;
                    const inProg5 = Number(stepSummary?.inProgressCount ?? 0);
                    const notSt5 = Number(stepSummary?.notLoggedInCount ?? 0);
                    const notStarted5 = Number(stepSummary?.notStartedCount ?? 0);
                    // Active lives = enrolled + inProgress + notLoggedIn — everyone still
                    // active on this batch, excluding anyone deletion-matched. Deliberately
                    // separate from rawTotalLives5 above, which stays the lifetime total
                    // (matches iWork's header, including exited people) — activeLives is
                    // what enrolled+inProgress+notLoggedIn actually reconciles against.
                    const activeLives5 = Number(stepSummary?.activeLives ?? (Number(stepSummary?.enrolledLives ?? 0) + inProg5 + notSt5));
                    const enrolled5 = stepSummary?.employeeCompletedCount != null
                      ? Number(stepSummary.employeeCompletedCount)
                      : Math.max(0, emp5 - inProg5 - notStarted5);
                    // Lives-level enrolled count (employees + their dependents who've
                    // also completed enrolment) — separate from enrolled5 above, which
                    // stays employees-only for the "EMPLOYEES" tile. This feeds the
                    // "Enrolled" pill headline instead: showing employees-only there
                    // (e.g. "33 Enrolled") couldn't be reconciled against the
                    // "Total Lives" figure below it when this is the only drive on the
                    // policy — 33 employees always also bring some enrolled dependents
                    // with them, and that count was silently missing from the pill.
                    const enrolledLives5 = stepSummary?.completedCount != null
                      ? Number(stepSummary.completedCount)
                      : enrolled5;
                    // hasHeadcountData: true when we have at least emp/dep counts
                    const hasHeadcountData = isEndorsementCard
                      ? (endorsementSummaryMap[eid] !== undefined || rawEmp != null)
                      : inceptionStepsSummary !== null;
                    // hasApiStepData: true only when endorsement-steps API returned a summary
                    const hasApiStepData = isEndorsementCard
                      ? endorsementSummaryMap[eid] != null
                      : inceptionStepsSummary !== null;
                    const fmtC = (v: number) => hasHeadcountData ? String(v) : "—";
                    const fmtCStat = (v: number) => hasApiStepData ? String(v) : "—";
                    // derive type colours once per card
                    const ct = (item as any).changeType ?? "";
                    const isAdd = ct.startsWith("+");
                    const isDel = ct.startsWith("-");
                    const isCorr = ct.startsWith("~");
                    const typeColor = itemIsInception ? "#7C3AED" : isAdd ? "#059669" : isDel ? "#DC2626" : isCorr ? "#D97706" : "#1C57B8";
                    const subtypeLabel = itemIsInception ? null : isAdd ? "Addition" : isDel ? "Deletion" : isCorr ? "Correction" : null;
                    // FIX (data-consistency): additions/exits/cardAddPremAmt/cardDelPremAmt used
                    // to read from endorsementSummaryMap (hr.repository.ts's RAW stored columns —
                    // employee_endorsement_addition_count / gross_premium, never enrolled-filtered),
                    // while the "Changes" breakdown and the top badge both read from `item`
                    // (endorsement_list, enrolled-only for addition/inception rows). Two different
                    // sources for the same concept meant this pill could show e.g. "2188 Added"
                    // while the breakdown correctly showed ₹0 (nobody had enrolled yet). Unified
                    // onto `item` — the same single source as the rest of this card — so they can't
                    // disagree.
                    //
                    // isAdd (endorsementType === "ADDITION") is itself fragile — endorsement
                    // #30683 is typed "FINANCIAL_ENDORSEMENT" despite genuinely adding 4
                    // employees, so isAdd stayed false and this pill always showed 0/nothing
                    // no matter what the real data said. rawAddedCount (roster-confirmed, see
                    // FIX 2g) doesn't have that problem — use it to decide whether this card is
                    // addition-shaped, on top of isAdd rather than instead of it.
                    const hasRealAdditions = Number((item as any).rawAddedCount ?? 0) > 0;
                    const isAdditionShaped = isEndorsementCard ? (isAdd || hasRealAdditions) : itemIsInception;
                    // Headline "Enrolled" pill — dedicated stats API field (enrolledLives:
                    // total live count of enrolled employees + their enrolled dependents),
                    // falling back to rawTotalLives5 only if the stats response hasn't
                    // loaded yet / doesn't carry the field.
                    const additions = isAdditionShaped ? Number(stepSummary?.enrolledLives ?? rawTotalLives5) : 0;
                    // Same fix as additions/isAdditionShaped above, mirrored for deletions —
                    // isDel is the same fragile endorsementType string match, and
                    // rawDeletedCount is the same roster-confirmed signal rawAddedCount is
                    // (see FIX 2h). Deletion has no "enrolled" analogue — someone removed
                    // from the roster isn't gated by enrolment status — so unlike additions
                    // there's no separate "completed" figure to prefer; the pill just shows
                    // the raw historical count directly. Lives-level like the Additions pill —
                    // employees (rawDeletedCount) + dependents (rawDeletedDependentCount) removed
                    // by this endorsement, both raw/ungated, consistent with each other.
                    const hasRealDeletions = Number((item as any).rawDeletedCount ?? 0) > 0;
                    const isDeletionShaped = isEndorsementCard && (isDel || hasRealDeletions);
                    const exits = isDeletionShaped
                      ? Number((item as any).rawDeletedCount ?? 0) + Number((item as any).rawDeletedDependentCount ?? 0)
                      : 0;
                    // Dedicated stats API field (enrolledPremium: premium of the enrolled
                    // ones only), falling back to the previous rawNetPremium/netPremium
                    // source if the stats response hasn't loaded yet / doesn't carry it.
                    const cardAddPremAmt = isAdditionShaped
                      ? Math.abs(Number(stepSummary?.enrolledPremium ?? (itemIsInception ? (item as any).rawNetPremium : (item as any).netPremium) ?? 0))
                      : 0;
                    const cardDelPremAmt = isDeletionShaped
                      ? Math.abs(Number((item as any).netPremium ?? 0))
                      : 0;
                    const premiumIsNegative = typeof premiumDelta === "string" && (premiumDelta.startsWith("-") || premiumDelta.startsWith("−") || premiumDelta.startsWith("–"));
                    return (
                      <Box key={String(item.title) + index} sx={{ bgcolor: "#fff", borderRadius: "16px", border: "1px solid #E5EBF4", boxShadow: "0 2px 10px rgba(15,23,42,0.07)", mb: "32px", overflow: "hidden" }}>

                        {/* ── Type header band ── */}
                        <Box onClick={() => setEnrollmentCardExpanded(isExpanded ? -1 : index)} sx={{ px: 3, py: 1.75, bgcolor: "#fff", borderBottom: "1px solid #E5EBF4", display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", "&:hover": { bgcolor: "#F8FAFC" }, transition: "background 0.15s" }}>
                          <Box sx={{ width: 26, height: 26, borderRadius: "8px", bgcolor: `${typeColor}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {itemIsInception ? <Sparkles size={14} color={typeColor} /> : <RefreshCw size={14} color={typeColor} />}
                          </Box>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.4, fontWeight: 800, color: typeColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {itemIsInception ? "Inception" : "Endorsement"}
                          </Typography>
                          {subtypeLabel && (
                            <Box sx={{ px: 1.25, py: 0.3, borderRadius: "7px", bgcolor: `${typeColor}14`, border: `1px solid ${typeColor}30` }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.4, fontWeight: 700, color: typeColor }}>{subtypeLabel}</Typography>
                            </Box>
                          )}
                          {/* Status pill — inline next to heading */}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.65, px: 1.5, py: 0.5, borderRadius: "20px", bgcolor: statusStyle.bg, border: `1px solid ${statusStyle.border}`, flexShrink: 0 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: statusStyle.color, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: 15, lineHeight: 1.4, fontWeight: 700, color: statusStyle.color }}>{statusText}</Typography>
                          </Box>
                          {/* Premium chips — pushed to right */}
                          {/* {isEndorsementCard && (cardAddPremAmt > 0 || cardDelPremAmt > 0) && (
                            <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
                              {cardAddPremAmt > 0 && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, px: 1.5, py: 0.4, borderRadius: "8px", bgcolor: "#ECFDF5", border: "1px solid #A7F3D0", flexShrink: 0 }}>
                                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#059669", lineHeight: 1.3, whiteSpace: "nowrap" }}>{formatINR(cardAddPremAmt, localizationData?.data)}</Typography>
                                  <Typography sx={{ fontSize: 12, color: "#6B7280", fontWeight: 500, lineHeight: 1.3, whiteSpace: "nowrap" }}>Add Premium</Typography>
                                </Box>
                              )}
                              {cardDelPremAmt > 0 && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, px: 1.5, py: 0.4, borderRadius: "8px", bgcolor: "#FEF2F2", border: "1px solid #FECACA", flexShrink: 0 }}>
                                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#DC2626", lineHeight: 1.3, whiteSpace: "nowrap" }}>{formatINR(cardDelPremAmt, localizationData?.data)}</Typography>
                                  <Typography sx={{ fontSize: 12, color: "#6B7280", fontWeight: 500, lineHeight: 1.3, whiteSpace: "nowrap" }}>Del Premium</Typography>
                                </Box>
                              )}
                            </Box>
                          )} */}
                        </Box>

                        {/* ── Main content (clickable) ── */}
                        <Box onClick={() => setEnrollmentCardExpanded(isExpanded ? -1 : index)} sx={{ px: 3, pt: 2.5, pb: 2.5, cursor: "pointer", "&:hover": { bgcolor: "#F8FAFC" }, transition: "background 0.15s" }}>

                          {/* Single row: IDs (left) | chips (center) | Net Premium + View Details (right) */}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>

                            {/* Left: IDs + enrolment period — value on top, label below */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap", flex: "0 0 auto" }}>
                              {/* ID */}
                              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                <Typography sx={{ fontSize: 15, lineHeight: 1.3, fontWeight: 700, color: "#111827" }}>#{item.title}</Typography>
                                <Typography sx={{ fontSize: 11, lineHeight: 1.3, color: "#9CA3AF", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>ID</Typography>
                              </Box>
                              <Box sx={{ width: "1px", height: 28, bgcolor: "#E5E7EB", flexShrink: 0 }} />
                              {/* Insurer */}
                              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                <Typography sx={{ fontSize: 15, lineHeight: 1.3, fontWeight: 700, color: "#111827" }}>{(item as any).insurerEndorsementId ?? "—"}</Typography>
                                <Typography sx={{ fontSize: 11, lineHeight: 1.3, color: "#9CA3AF", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Insurer</Typography>
                              </Box>
                              <Box sx={{ width: "1px", height: 28, bgcolor: "#E5E7EB", flexShrink: 0 }} />
                              {/* Endorsement Period */}
                              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <Clock size={12} color="#374151" />
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.3, fontWeight: 600, color: "#374151" }}>
                                    {(item as any).enrollmentStartDate ? fmtDate((item as any).enrollmentStartDate) : "—"}
                                    {" – "}
                                    {(item as any).enrollmentEndDate ? fmtDate((item as any).enrollmentEndDate) : "—"}
                                  </Typography>
                                </Box>
                                <Typography sx={{ fontSize: 11, lineHeight: 1.3, color: "#9CA3AF", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Enrolment Period</Typography>
                              </Box>
                            </Box>

                            {/* Center: 2 big pills */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }}>
                              {/* Additions pill */}
                              {(() => {
                                const addPremAmt = cardAddPremAmt;
                                const active = additions > 0;
                                return (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 3, py: 1.5, borderRadius: "20px", bgcolor: active ? "#ECFDF5" : "#F3F4F6", border: active ? "1px solid #A7F3D0" : "1px solid #E5E7EB" }}>
                                    <UserPlus size={18} color={active ? "#059669" : "#9CA3AF"} />
                                    {/* Count + label stacked */}
                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                      <Typography sx={{ fontSize: 20, fontWeight: 800, color: active ? "#065F46" : "#6B7280", lineHeight: 1.1 }}>{additions}</Typography>
                                      <Tooltip title="Total lives (employees + dependents) added in this drive — matches TOTAL LIVES in the Enrolment Summary below and iWork's totalLives, regardless of enrolment status." arrow placement="bottom">
                                        <Typography sx={{ fontSize: 15, color: active ? "#059669" : "#9CA3AF", fontWeight: 500, lineHeight: 1.2, cursor: "help", borderBottom: "1px dashed", borderColor: active ? "#059669" : "#9CA3AF" }}>Enroled</Typography>
                                      </Tooltip>
                                    </Box>
                                    {(() => {
                                      // Additions and deletions aren't tracked as separate premium
                                      // amounts in the DB — only their net sum is stored per
                                      // endorsement. When this batch has BOTH additions and
                                      // deletions, that single stored figure is a mix of the two —
                                      // labeling it "Added Premium" here would be misleading, so
                                      // it's removed entirely (not just greyed out) and shown once,
                                      // neutrally, as the blue "Net Premium" chip on the right.
                                      const isMixedBatch = additions > 0 && exits > 0;
                                      if (isMixedBatch) return null;
                                      const premActive = active && addPremAmt > 0;
                                      return <>
                                        <Box sx={{ width: "1px", height: 36, bgcolor: premActive ? "#A7F3D0" : "#E5E7EB", flexShrink: 0 }} />
                                        {/* Premium amount + label stacked */}
                                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                          <Typography sx={{ fontSize: 20, fontWeight: 800, color: premActive ? "#065F46" : "#9CA3AF", lineHeight: 1.1, whiteSpace: "nowrap" }}>{formatINR(addPremAmt, localizationData?.data)}</Typography>
                                          <Tooltip title="Net premium (before tax) for the enrolled additions above. Open View Details below for the full Net/GST breakdown." arrow placement="bottom">
                                            <Typography sx={{ fontSize: 15, color: premActive ? "#059669" : "#9CA3AF", fontWeight: 500, lineHeight: 1.2, cursor: "help", borderBottom: "1px dashed", borderColor: premActive ? "#059669" : "#9CA3AF" }}>Added Premium</Typography>
                                          </Tooltip>
                                        </Box>
                                      </>;
                                    })()}
                                  </Box>
                                );
                              })()}
                              {/* Exits pill */}
                              {(() => {
                                const delPremAmt = cardDelPremAmt;
                                const active = exits > 0;
                                return (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 3, py: 1.5, borderRadius: "20px", bgcolor: active ? "#FEF2F2" : "#F3F4F6", border: active ? "1px solid #FECACA" : "1px solid #E5E7EB" }}>
                                    <UserMinus size={18} color={active ? "#DC2626" : "#9CA3AF"} />
                                    {/* Count + label stacked */}
                                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                      <Typography sx={{ fontSize: 20, fontWeight: 800, color: active ? "#991B1B" : "#6B7280", lineHeight: 1.1 }}>{exits}</Typography>
                                      <Tooltip title="Employees + dependents removed in this drive — counted regardless of their enrolment status at the time of removal." arrow placement="bottom">
                                        <Typography sx={{ fontSize: 15, color: active ? "#DC2626" : "#9CA3AF", fontWeight: 500, lineHeight: 1.2, cursor: "help", borderBottom: "1px dashed", borderColor: active ? "#DC2626" : "#9CA3AF" }}>Exited</Typography>
                                      </Tooltip>
                                    </Box>
                                    {(() => {
                                      // Same reasoning as the Additions pill above, mirrored:
                                      // removed entirely (not greyed out) when this batch has both
                                      // additions and deletions — shown once as the blue "Net
                                      // Premium" chip instead.
                                      const isMixedBatch = additions > 0 && exits > 0;
                                      if (isMixedBatch) return null;
                                      const premActive = active && delPremAmt > 0;
                                      return <>
                                        <Box sx={{ width: "1px", height: 36, bgcolor: premActive ? "#FECACA" : "#E5E7EB", flexShrink: 0 }} />
                                        {/* Premium amount + label stacked */}
                                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                          <Typography sx={{ fontSize: 20, fontWeight: 800, color: premActive ? "#991B1B" : "#9CA3AF", lineHeight: 1.1, whiteSpace: "nowrap" }}>{formatINR(delPremAmt, localizationData?.data)}</Typography>
                                          <Tooltip title="Net premium (before tax) removed for the exits above." arrow placement="bottom">
                                            <Typography sx={{ fontSize: 15, color: premActive ? "#DC2626" : "#9CA3AF", fontWeight: 500, lineHeight: 1.2, cursor: "help", borderBottom: "1px dashed", borderColor: premActive ? "#DC2626" : "#9CA3AF" }}>Deleted Premium</Typography>
                                          </Tooltip>
                                        </Box>
                                      </>;
                                    })()}
                                  </Box>
                                );
                              })()}
                            </Box>

                            {/* Right: Net Premium (mixed additions+deletions only) + View Details */}
                            <Box sx={{ display: "flex", alignItems: "stretch", gap: 2, flexShrink: 0 }}>
                              {/* This batch has BOTH additions and deletions — the single stored
                                  net_premium is a mix of the two (additions/deletions premium
                                  aren't tracked separately in the DB), so it can't honestly be
                                  labeled "Added Premium" or "Deleted Premium" the way the two
                                  pills on the left do when a batch is purely one or the other.
                                  Shown neutrally as "Net Premium" instead — this is the same
                                  blue treatment Net Premium used before the Added/Deleted pills
                                  existed. */}
                              {additions > 0 && exits > 0 && (
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", px: 2, borderRadius: "12px", bgcolor: "#EBF3FF", border: "1px solid #BFDBFE", flexShrink: 0 }}>
                                  <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#1C57B8", lineHeight: 1.1, whiteSpace: "nowrap" }}>{netPremiumDisplay}</Typography>
                                  <Tooltip title="This is the consolidated premium of the additions and deletions in this batch — the Added Premium and Deleted Premium amounts aren't tracked separately in the database, only their combined net premium is." arrow placement="bottom">
                                    <Typography sx={{ fontSize: 15, color: "#1C57B8", fontWeight: 500, lineHeight: 1.2, cursor: "help", borderBottom: "1px dashed #1C57B8" }}>Net Premium</Typography>
                                  </Tooltip>
                                </Box>
                              )}
                              {/* View Details / Collapse */}
                              <Box
                                onClick={(e) => { e.stopPropagation(); setEnrollmentCardExpanded(isExpanded ? -1 : index); }}
                                sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, width: 130, borderRadius: "12px", bgcolor: "#fff", border: "1px solid #E5E7EB", cursor: "pointer", "&:hover": { bgcolor: "#F8FAFC", borderColor: "#D1D5DB" }, transition: "all 0.15s", flexShrink: 0 }}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronDown size={14} color="#6B7280" style={{ transform: "rotate(180deg)" }} />
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: "#6B7280" }}>Collapse</Typography>
                                  </>
                                ) : (
                                  <>
                                    <Eye size={14} color="#6B7280" />
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: "#6B7280" }}>View Details</Typography>
                                  </>
                                )}
                              </Box>
                            </Box>
                          </Box>

                        </Box>
                        {/* Expanded content */}
                        {isExpanded && (
                          <Box sx={{ px: 3, pb: 3, borderTop: "1px solid #EEF2F6", display: "flex", flexDirection: "column", gap: 0 }}>
                            {/* Enrolment status 5 boxes */}
                            <Box sx={{ pt: 2.5, pb: 2.5 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                                <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#EBF3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <Users size={14} color="#1C57B8" />
                                </Box>
                                <Tooltip title="Employees and dependents added specifically by THIS drive — not the whole policy. EMPLOYEES/DEPENDANTS/TOTAL LIVES are raw totals matching iWork's endorsementSummary exactly (EMPLOYEES + DEPENDANTS = TOTAL LIVES); IN PROGRESS and NOT STARTED are each an employee count plus that employee's dependents in the same status." arrow placement="bottom">
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#1F2937", cursor: "help", borderBottom: "1px dashed #D1D5DB", display: "inline-block" }}>Enrolment Summary</Typography>
                                </Tooltip>
                              </Box>
                              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 1.25 }}>
                                {([
                                  { label: "EMPLOYEES",     value: fmtC(emp5), subText:"Total in this drive",       color: "#059669", bg: "#F0FDF4", border: "#BBF7D0", tooltip: "Total employees added by this drive, regardless of enrolment status — matches iWork's totalEmployees." },
                                  { label: "DEPENDANTS",    value: fmtC(dep5),  subText:"Total in this drive",       color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", tooltip: "Total dependents added by this drive, regardless of enrolment status — matches iWork's totalDependents." },
                                  { label: "TOTAL LIVES",   value: fmtC(rawTotalLives5),  subText:"Total in this drive",     color: "#1C57B8", bg: "#EBF3FF", border: "#BFDBFE", tooltip: "Employees + dependents added by this drive — matches iWork's totalLives." },
                                  { label: "IN PROGRESS",   value: fmtCStat(inProg5), subText:"Lives",  color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", tooltip: "Employees from this drive who have started but not finished enrolling, plus their dependents in the same status." },
                                  { label: "NOT STARTED", value: fmtCStat(notSt5), subText:"Lives", color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", tooltip: "Employees from this drive who haven't started enrolling yet, plus their dependents in the same status. Mutually exclusive with In Progress and Enrolled." },
                                  // { label: "ACTIVE LIVES",  value: fmtCStat(activeLives5), subText:"Enrolled + In Progress + Not Started", color: "#0E7490", bg: "#ECFEFF", border: "#A5F3FC", tooltip: "Enrolled + In Progress + Not Started — everyone still active on this batch, excluding anyone deleted/exited. Unlike TOTAL LIVES (the lifetime total, including exits), this is the figure that ENROLLED + IN PROGRESS + NOT STARTED actually adds up to." },
                                ] as { label: string; value: string; color: string; bg: string; border: string; tooltip: string }[]).map((c) => (
                                  <Tooltip key={c.label} title={c.tooltip} arrow placement="bottom">
                                    <Box sx={{ bgcolor: c.bg, border: `1px solid ${c.border}`, borderRadius: "12px", px: 2, py: 1.75, position: "relative", overflow: "hidden", cursor: "help" }}>
                                      <Box sx={{ width: 3, position: "absolute", top: 0, left: 0, bottom: 0, bgcolor: c.color, borderRadius: "3px 0 0 3px" }} />
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: c.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.75 }}>{c.label}</Typography>
                                      <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>{c.value} <span  style={{ fontSize: 14, fontWeight: 400, color: "#555555", lineHeight: 1.1 }}>{c.subText}</span></Typography>
                                    </Box>
                                  </Tooltip>
                                ))}
                              </Box>
                            </Box>
                            {/* Changes (endorsement) or Premium breakdown (inception) */}
                            {isEndorsementCard ? (() => {
                              // Additions now reads the same roster-based raw addition count as
                              // the Policy Journey & Enrolment Summary card's "Added" figure
                              // (item.rawAddedCount — a real join against
                              // policy_enrollment_employee_policy_map, not gated by enrolment
                              // status or the endorsement's own net_premium), instead of
                              // endorsementSummaryMap's additionCount.
                              const rawAdded = (item as any).rawAddedCount;
                              const adds = Number(rawAdded ?? 0);
                              const addsDisplay = rawAdded != null ? `+${adds}` : "—";
                              // Same fix as Additions above, mirrored for Deletions — item.rawDeletedCount
                              // (FIX 2h) instead of endorsementSummaryMap's deletionCount, which read
                              // the stale stored employee_endorsement_deletion_count column.
                              const rawDeleted = (item as any).rawDeletedCount;
                              const dels = Number(rawDeleted ?? 0);
                              const delsDisplay = rawDeleted != null ? `-${dels}` : "—";
                              // Additions is now a permanent historical fact (FIX 2h) — it won't
                              // shrink if someone this endorsement added is later removed via a
                              // DIFFERENT endorsement. Correct, but silent: an HR admin seeing
                              // "Added 4" with no sign that 1 of them is actually gone from the
                              // roster now would read it as a data bug. stillActiveAddedCount is
                              // the currently-active subset of this SAME batch — diff against it
                              // to surface a disclaimer instead of a silent mismatch.
                              const stillActive = (item as any).stillActiveAddedCount;
                              const laterRemovedFromThisBatch = rawAdded != null && stillActive != null
                                ? Math.max(0, adds - Number(stillActive))
                                : 0;
                              const netPrem2 = (item as any).premiumRows?.find(([l]: [string, string]) => l === "Net Premium")?.[1] ?? "—";
                              const gstPrem2 = (item as any).premiumRows?.find(([l]: [string, string]) => l === "Tax Amount (GST 18%)")?.[1] ?? "—";
                              // premiumRows never carries a "Gross Premium" entry for endorsement
                              // (non-inception) rows, so this always fell back to "—". rawGrossPremium
                              // is the endorsement_list API's own gross premium value for this row —
                              // bind directly to it instead of looking it up in premiumRows.
                              const rawGrossPrem2 = (item as any).rawGrossPremium;
                              const grossPrem2 = rawGrossPrem2 != null ? formatINR(Number(rawGrossPrem2), localizationData?.data) : "—";
                              type ChangeRowDef = { label: string; desc: string; value: string; icon: React.ReactNode; iconBg: string; valueBg: string; valueColor: string };
                              const changeRows: ChangeRowDef[] = [
                                { label: "Additions",     desc: "New members added",    value: addsDisplay,  icon: <UserPlus size={14} color="#16A34A" />,  iconBg: "#F0FDF4", valueBg: "#F0FDF4", valueColor: "#15803D" },
                                { label: "Deletions",     desc: "Members deleted",      value: delsDisplay,  icon: <UserMinus size={14} color="#DC2626" />, iconBg: "#FEF2F2", valueBg: "#FEF2F2", valueColor: "#B91C1C" },
                                { label: "Employees Enrolled Net Premium",   desc: "Base premium before tax, for enrolled employees", value: netPrem2,  icon: <Banknote size={14} color="#475467" />,  iconBg: "#F3F4F6", valueBg: "#F3F4F6", valueColor: "#374151" },
                                { label: getTaxLabel(localizationData?.data), desc: "Tax at 18%", value: gstPrem2, icon: <Percent size={14} color="#475467" />, iconBg: "#F3F4F6", valueBg: "#F3F4F6", valueColor: "#374151" },
                                { label: "Employees Enrolled Gross Premium", desc: "Total including tax, for enrolled employees",  value: grossPrem2,   icon: <Wallet size={14} color="#1C57B8" />,    iconBg: "#EBF3FF", valueBg: "#EBF3FF", valueColor: "#1C57B8" },
                              ];
                              // Pair rows: [Additions,Deletions], [Net,GST]
                              const pairedRows: (ChangeRowDef | null)[][] = [];
                              for (let i = 0; i < changeRows.length; i += 2) {
                                pairedRows.push([changeRows[i], changeRows[i + 1] ?? null]);
                              }
                              return (
                                <Box sx={{ pt: 2.5, pb: 2.5 }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                                    <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <Activity size={14} color="#D97706" />
                                    </Box>
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#1F2937" }}>Changes</Typography>
                                  </Box>
                                  <Box sx={{ border: "1px solid #E5EBF4", borderRadius: "12px", overflow: "hidden", bgcolor: "#fff" }}>
                                    {pairedRows.map((pair, pi) => (
                                      <Box key={pi} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: pi < pairedRows.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                                        {pair.map((row, ci) => {
                                          if (!row) return null;
                                          const isGrossRow = row.label === "Gross premium";
                                          const isNegativeValue = typeof row.value === "string" && row.value.includes("-");
                                          const showCDCreditHint = isGrossRow && isNegativeValue;
                                          return (
                                            <Box key={row.label} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.75, borderRight: ci === 0 ? "1px solid #F3F4F6" : "none" }}>
                                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                                <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: row.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                  {row.icon}
                                                </Box>
                                                <Box>
                                                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#1F2937", lineHeight: 1.3 }}>{row.label}</Typography>
                                                  <Typography sx={{ fontSize: 15, color: "#9CA3AF", lineHeight: 1.4 }}>{row.desc}</Typography>
                                                </Box>
                                              </Box>
                                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0, ml: 1 }}>
                                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: row.valueColor }}>{row.value}</Typography>
                                                {showCDCreditHint && (
                                                  <Tooltip title="This will be credited to your CD account" arrow placement="top">
                                                    <Box sx={{ display: "inline-flex", alignItems: "center", cursor: "help" }}>
                                                      <Info size={14} color={row.valueColor} />
                                                    </Box>
                                                  </Tooltip>
                                                )}
                                              </Box>
                                            </Box>
                                          );
                                        })}
                                      </Box>
                                    ))}
                                  </Box>
                                  {/* {laterRemovedFromThisBatch > 0 && (
                                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mt: 1.5, px: 1.75, py: 1.25, borderRadius: "10px", bgcolor: "#FFFBEB", border: "1px solid #FDE68A" }}>
                                      <Info size={15} color="#B45309" style={{ marginTop: 1, flexShrink: 0 }} />
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.6, color: "#92400E" }}>
                                        {laterRemovedFromThisBatch} of the {adds} employee{adds === 1 ? "" : "s"} added by this endorsement {laterRemovedFromThisBatch === 1 ? "has" : "have"} since been removed via a different endorsement. Additions above reflects what this endorsement itself did and won't change — check the endorsement that removed them for details.
                                      </Typography>
                                    </Box>
                                  )} */}
                                </Box>
                              );
                            })() : (() => {
                              const premRows = (item as any).premiumRows as [string, string][];
                              console.log("premRows", premRows);
                              type PremRowDef = { label: string; desc: string; icon: React.ReactNode; iconBg: string; valueBg: string; valueColor: string };
                              // Net premium only — per instruction, gross premium is not shown
                              // anywhere in the Enrolment tab.
                              const premMeta: Record<string, PremRowDef> = {
                                "Net Premium":           { label: "Inception Net Premium",     desc: "Base premium before tax, as recorded at inception",   icon: <Banknote size={14} color="#475467" />,   iconBg: "#F3F4F6", valueBg: "#F3F4F6", valueColor: "#374151" },
                                "Tax Amount (GST 18%)":  { label: `Tax Amount (${getTaxLabel(localizationData?.data)} 18%)`,  desc: `${getTaxLabel(localizationData?.data)} applied at 18%, on the inception premium`,        icon: <Percent size={14} color="#475467" />,    iconBg: "#F3F4F6", valueBg: "#F3F4F6", valueColor: "#374151" },
                              };
                              // Inception is the same kind of batch as an endorsement addition — it
                              // just has nothing to net against yet. Surfacing Additions/Deletions
                              // here too (same rawAddedCount/rawDeletedCount source as the
                              // endorsement "Changes" card) gives the same at-a-glance clarity on
                              // how many lives this batch touched, instead of only the aggregate
                              // premium figures below.
                              const inceptionAdded = (item as any).rawAddedCount;
                              const inceptionAddedDisplay = inceptionAdded != null ? `+${inceptionAdded}` : "—";
                              const inceptionDeleted = (item as any).rawDeletedCount;
                              const inceptionDeletedDisplay = inceptionDeleted != null ? `-${inceptionDeleted}` : "—";
                              return (
                                <Box sx={{ pt: 2.5, pb: 2.5 }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                                    <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <Activity size={14} color="#D97706" />
                                    </Box>
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#1F2937" }}>Additions &amp; Deletions</Typography>
                                  </Box>
                                  <Box sx={{ border: "1px solid #E5EBF4", borderRadius: "12px", overflow: "hidden", bgcolor: "#fff", mb: 2.5 }}>
                                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.75, borderRight: "1px solid #F3F4F6" }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                          <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <UserPlus size={14} color="#16A34A" />
                                          </Box>
                                          <Box>
                                            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#1F2937", lineHeight: 1.3 }}>Additions</Typography>
                                            <Typography sx={{ fontSize: 15, color: "#9CA3AF", lineHeight: 1.4 }}>Members added at inception</Typography>
                                          </Box>
                                        </Box>
                                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#15803D" }}>{inceptionAddedDisplay}</Typography>
                                      </Box>
                                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.75 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                          <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <UserMinus size={14} color="#DC2626" />
                                          </Box>
                                          <Box>
                                            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#1F2937", lineHeight: 1.3 }}>Deletions</Typography>
                                            <Typography sx={{ fontSize: 15, color: "#9CA3AF", lineHeight: 1.4 }}>Members deleted at inception</Typography>
                                          </Box>
                                        </Box>
                                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#B91C1C" }}>{inceptionDeletedDisplay}</Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                                    <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#EBF3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <Wallet size={14} color="#1C57B8" />
                                    </Box>
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#1F2937" }}>Premium breakdown</Typography>
                                  </Box>
                                  <Box sx={{ border: "1px solid #E5EBF4", borderRadius: "12px", overflow: "hidden", bgcolor: "#fff" }}>
                                    {(() => {
                                      const pairedPrem: ([string,string] | null)[][] = [];
                                      for (let i = 0; i < premRows.length; i += 2) {
                                        pairedPrem.push([premRows[i], premRows[i + 1] ?? null]);
                                      }
                                      return pairedPrem.map((pair, pi) => (
                                        <Box key={pi} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: pi < pairedPrem.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                                          {pair.map((entry, ci) => entry && (() => {
                                            const [label, value] = entry;
                                            const meta = premMeta[label] ?? { label, desc: "", icon: <Banknote size={14} color="#475467" />, iconBg: "#F3F4F6", valueBg: "#F3F4F6", valueColor: "#374151" };
                                            return (
                                              <Box key={label} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.75, borderRight: ci === 0 ? "1px solid #F3F4F6" : "none" }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                                  <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: meta.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    {meta.icon}
                                                  </Box>
                                                  <Box>
                                                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#1F2937", lineHeight: 1.3 }}>{meta.label}</Typography>
                                                    <Typography sx={{ fontSize: 15, color: "#9CA3AF", lineHeight: 1.4 }}>{meta.desc}</Typography>
                                                  </Box>
                                                </Box>
                                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: meta.valueColor, flexShrink: 0, ml: 1 }}>{value}</Typography>
                                              </Box>
                                            );
                                          })())}
                                        </Box>
                                      ));
                                    })()}
                                  </Box>
                                </Box>
                              );
                            })()}
                            {/* File status table */}
                            {(() => {
                              const eidFS: number = (item as any).rawEndorsementId;
                              // Inception cards use enrollmentUploadRows (loaded at page load via employeeBatchData).
                              // Endorsement cards use endorsementUploadDataMap[eid] (loaded on expand via enrollmentUploadSummaryByEndorsement).
                              const apiRows: any[] = isEndorsementCard
                                ? (endorsementUploadDataMap[eidFS] ?? [])
                                : enrollmentUploadRows;
                              const isLoadingFS = isEndorsementCard && eidFS && endorsementUploadDataMap[eidFS] === undefined;
                              const totalRec = apiRows.reduce((s: number, r: any) => s + Number(r?.processCount ?? 0), 0);
                              const successRec = apiRows.reduce((s: number, r: any) => s + Number(r?.successCount ?? 0), 0);
                              const failedRec = apiRows.reduce((s: number, r: any) => s + Number(r?.errorCount ?? 0), 0);
                              const totalPages_fs = Math.ceil(apiRows.length / FILE_STATUS_PAGE_SIZE);
                              const curPage = isEndorsementCard ? (endorsementFileStatusPages[eidFS] ?? 0) : inceptionFileStatusPage;
                              const pageRows = apiRows.slice(curPage * FILE_STATUS_PAGE_SIZE, (curPage + 1) * FILE_STATUS_PAGE_SIZE);
                              const fD = (v: string | null | undefined) => { if (!v) return "—"; const d = new Date(v); if (isNaN(d.getTime())) return "—"; const dd = String(d.getDate()).padStart(2, "0"); const mm = String(d.getMonth() + 1).padStart(2, "0"); return `${dd}/${mm}/${d.getFullYear()}`; };
                              const fDT = (v: string | null | undefined) => { if (!v) return "—"; const d = new Date(v); if (isNaN(d.getTime())) return "—"; const dd = String(d.getDate()).padStart(2, "0"); const mm = String(d.getMonth() + 1).padStart(2, "0"); const h = d.getHours(); const hh = String(h % 12 || 12).padStart(2, "0"); const min = String(d.getMinutes()).padStart(2, "0"); const sec = String(d.getSeconds()).padStart(2, "0"); const ampm = h < 12 ? "AM" : "PM"; return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}:${sec} ${ampm}`; };
                              return (
                                <Box sx={{ pt: 3.75, pb: 1 }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <Upload size={14} color="#16A34A" />
                                    </Box>
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#1F2937" }}>File Status</Typography>
                                  </Box>
                                  {isLoadingFS ? (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}><CircularProgress size={14} /><Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>Loading file status…</Typography></Box>
                                  ) : (<>
                                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5, mb: 1.5 }}>
                                      {[
                                        { label: "Total records", value: totalRec > 0 ? totalRec : "—", color: "#1C57B8", border: "#1C57B8" },
                                        { label: "Success", value: successRec > 0 ? successRec : "—", color: "#16A34A", border: "#16A34A" },
                                        { label: "Failed", value: failedRec > 0 ? failedRec : "—", color: "#DC2626", border: "#DC2626" },
                                      ].map((c) => (
                                        <Box key={c.label} sx={{ border: "1px solid #E5E7EB", borderLeft: `4px solid ${c.border}`, borderRadius: "10px", px: 2.5, py: 1.75, bgcolor: "#fff" }}>
                                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", mb: 0.75 }}>{c.label}</Typography>
                                          <Typography sx={{ fontSize: 24, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</Typography>
                                        </Box>
                                      ))}
                                    </Box>
                                    <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "10px", overflow: "hidden" }}>
                                      <Box sx={{ overflowX: "auto" }}>
                                        {(() => {
                                          const colTplE = fsColWidths.map(w => `${w}px`).join(" ");
                                          const minWE = fsColWidths.reduce((s, w) => s + w, 0);
                                          const hdrsE = ["Batch ID", "Upload Date", "Enrol Start", "Enrol End", "File Name", "Size", "Total", "Success", "Failed", "Status", "Completed At", "Actions"];
                                          return (<>
                                            <Box sx={{ display: "grid", gridTemplateColumns: colTplE, bgcolor: "#EEF2F7", px: 2, py: 1.5, borderBottom: "1px solid #D1D9E8", minWidth: minWE }}>
                                              {hdrsE.map((h, hi) => (
                                                <Box key={h} sx={{ position: "relative", display: "flex", alignItems: "center", overflow: "hidden", pr: "8px" }}>
                                                  <Typography sx={{ fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h}</Typography>
                                                  {hi < hdrsE.length - 1 && (
                                                    <Box onMouseDown={(e) => { e.preventDefault(); const startX = e.clientX; const startW = fsColWidths[hi]; const onMove = (ev: MouseEvent) => { setFsColWidths(prev => { const next = [...prev]; next[hi] = Math.max(40, startW + ev.clientX - startX); return next; }); }; const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }; window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp); }} sx={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 8, cursor: "col-resize", zIndex: 1 }} />
                                                  )}
                                                </Box>
                                              ))}
                                            </Box>
                                            {pageRows.length === 0 ? (
                                              <Box sx={{ py: 8, textAlign: "center" }}>
                                                <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}><Upload size={20} color="#9CA3AF" /></Box>
                                                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151", lineHeight: 1.5, mb: 0.75 }}>No file batches</Typography>
                                                <Typography sx={{ fontSize: 15, color: "#9CA3AF", lineHeight: 1.7 }}>No enrolment file batches have been uploaded yet.</Typography>
                                              </Box>
                                            ) : pageRows.map((row: any, ri: number) => {
                                              const dpf = row?.documentProcessingFile ?? {};
                                              const st = (dpf?.processStatus ?? "").toUpperCase();
                                              const isStCreated = st === "CREATED" || st === "";
                                              const isStProc = st === "PROCESSING" || st === "IN_PROGRESS";
                                              const stColor = isStCreated ? "#6B7280" : isStProc ? "#D97706" : st === "COMPLETED" ? "#16A34A" : st ? "#DC2626" : "#9CA3AF";
                                              const stBg = isStCreated ? "#F9FAFB" : isStProc ? "#FFFBEB" : st === "COMPLETED" ? "#F0FDF4" : st ? "#FEF2F2" : "#F3F4F6";
                                              const stLabel = st ? st.charAt(0) + st.slice(1).toLowerCase().replace(/_/g, " ") : "—";
                                              const srcFileId = row?.sourceFile?.id;
                                              const errFileId = row?.errorFile?.id;
                                              const hasErrors2 = Number(row?.errorCount ?? 0) > 0;
                                              const fileName = row?.sourceFile?.fileName ?? dpf?.originalFileName ?? `File ${curPage * FILE_STATUS_PAGE_SIZE + ri + 1}`;
                                              return (
                                                <Box key={ri} sx={{ display: "grid", gridTemplateColumns: colTplE, px: 2, py: 2.25, borderBottom: "1px solid #F3F4F6", alignItems: "center", bgcolor: ri % 2 === 0 ? "#fff" : "#FAFAFA", minWidth: minWE }}>
                                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row?.batchId ?? "—"}</Typography>
                                                  <Typography title={fDT(row?.createdAt)} sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fDT(row?.createdAt)}</Typography>
                                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fD(dpf?.enrollmentStartDate)}</Typography>
                                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fD(dpf?.enrollmentEndDate)}</Typography>
                                                  {srcFileId ? (
                                                    <Box onClick={() => handleFileDownload(srcFileId, fileName)} title={fileName} sx={{ fontSize: 15, lineHeight: 1.7, color: "#1C57B8", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", textDecoration: "underline", display: "block" }}>{fileName}</Box>
                                                  ) : (
                                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</Typography>
                                                  )}
                                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280" }}>{row?.sourceFile?.fileSize ?? "—"}</Typography>
                                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#1C57B8" }}>{row?.processCount ?? "—"}</Typography>
                                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#16A34A" }}>{row?.successCount ?? "—"}</Typography>
                                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: hasErrors2 ? "#DC2626" : "#6B7280" }}>{row?.errorCount ?? "—"}</Typography>
                                                  <Box sx={{ display: "inline-flex" }}>
                                                    <Box sx={{ px: 1, py: 0.3, borderRadius: "6px", bgcolor: stBg }}>
                                                      {isStProc
                                                        ? <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><CircularProgress size={10} sx={{ color: stColor }} /><Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: stColor }}>{stLabel}</Typography></Box>
                                                        : <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: stColor }}>{stLabel}</Typography>}
                                                    </Box>
                                                  </Box>
                                                  <Typography title={fDT(dpf?.updatedAt)} sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fDT(dpf?.updatedAt)}</Typography>
                                                  <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.5, flexWrap: "nowrap" }}>
                                                    {isStProc ? (
                                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>—</Typography>
                                                    ) : (<>
                                                      {srcFileId && (
                                                        <Box onClick={() => handleFileDownload(srcFileId, fileName)} sx={{ display: "flex", alignItems: "center", gap: 0.4, cursor: "pointer" }}>
                                                          <Download size={11} color="#1C57B8" /><Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#1C57B8", fontWeight: 600 }}>Uploaded</Typography>
                                                        </Box>
                                                      )}
                                                      {hasErrors2 && errFileId && (
                                                        <Box onClick={() => handleFileDownload(errFileId, "error-report.xlsx")} sx={{ display: "flex", alignItems: "center", gap: 0.4, cursor: "pointer" }}>
                                                          <Download size={11} color="#DC2626" /><Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#DC2626", fontWeight: 600 }}>Errors</Typography>
                                                        </Box>
                                                      )}
                                                      {!srcFileId && !hasErrors2 && <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>—</Typography>}
                                                    </>)}
                                                  </Box>
                                                </Box>
                                              );
                                            })}
                                          </>);
                                        })()}
                                      </Box>
                                      {totalPages_fs > 1 && (
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, py: 1.5, borderTop: "1px solid #E5E7EB" }}>
                                          <Box onClick={() => isEndorsementCard ? setEndorsementFileStatusPages(prev => ({ ...prev, [eidFS]: Math.max(0, curPage - 1) })) : setInceptionFileStatusPage(p => Math.max(0, p - 1))} sx={{ width: 28, height: 28, borderRadius: "6px", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", cursor: curPage === 0 ? "not-allowed" : "pointer", opacity: curPage === 0 ? 0.4 : 1, bgcolor: "#fff" }}>
                                            <ChevronDown size={14} color="#374151" style={{ transform: "rotate(90deg)" }} />
                                          </Box>
                                          {Array.from({ length: totalPages_fs }, (_, pi) => (
                                            <Box key={pi} onClick={() => isEndorsementCard ? setEndorsementFileStatusPages(prev => ({ ...prev, [eidFS]: pi })) : setInceptionFileStatusPage(pi)} sx={{ minWidth: 28, height: 28, borderRadius: "6px", border: "1px solid", borderColor: pi === curPage ? "#1C57B8" : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", bgcolor: pi === curPage ? "#1C57B8" : "#fff" }}>
                                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: pi === curPage ? "#fff" : "#374151" }}>{pi + 1}</Typography>
                                            </Box>
                                          ))}
                                          <Box onClick={() => isEndorsementCard ? setEndorsementFileStatusPages(prev => ({ ...prev, [eidFS]: Math.min(totalPages_fs - 1, curPage + 1) })) : setInceptionFileStatusPage(p => Math.min(totalPages_fs - 1, p + 1))} sx={{ width: 28, height: 28, borderRadius: "6px", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", cursor: curPage >= totalPages_fs - 1 ? "not-allowed" : "pointer", opacity: curPage >= totalPages_fs - 1 ? 0.4 : 1, bgcolor: "#fff" }}>
                                            <ChevronDown size={14} color="#374151" style={{ transform: "rotate(-90deg)" }} />
                                          </Box>
                                        </Box>
                                      )}
                                    </Box>
                                  </>)}
                                </Box>
                              );
                            })()}

                            {/* ── Send Reminder (in-progress enrollments only) ── */}
                            {(notStSt > 0 || inPrSt > 0) && isEndorsementCard && (
                              <Box sx={{ mt: 1.5, px: 3, py: 2, borderRadius: "14px", border: "1px solid #C7D2FE", bgcolor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                  <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#E0E7FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Mail size={16} color="#4F46E5" />
                                  </Box>
                                  <Box>
                                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#3730A3", lineHeight: 1.4 }}>{notStSt + inPrSt} employee{(notStSt + inPrSt) !== 1 ? "s" : ""} yet to complete enrolment</Typography>
                                    <Typography sx={{ fontSize: 15, color: "#6366F1", lineHeight: 1.4 }}>Send a reminder to nudge pending employees to log in and complete their details.</Typography>
                                  </Box>
                                </Box>
                                <Box
                                  onClick={openSendReminderDialog}
                                  sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 2.5, py: 1.1, borderRadius: "12px", bgcolor: "#4F46E5", cursor: "pointer", flexShrink: 0, "&:hover": { bgcolor: "#4338CA", transform: "translateY(-1px)" }, transition: "all 0.15s", boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}
                                >
                                  <Mail size={15} color="#fff" />
                                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.5 }}>Send Reminder</Typography>
                                </Box>
                              </Box>
                            )}

                            {/* ── Endorsement Documents (filtered from policy docs by activityId) ── */}
                            {isEndorsementCard && (() => {
                              const allDocs: any[] = endorsementDocsMap[numericPolicyId] ?? [];
                              const isDocsLoading = endorsementDocsLoading[numericPolicyId] ?? (endorsementDocsMap[numericPolicyId] === undefined);
                              // Only the actual employee-data upload documents — not the
                              // endorsement's own creation file, insurer acknowledgement, claim
                              // documents, or manual uploads also returned by this shared
                              // policy-documents endpoint (see policy.service.ts getPolicyDocuments,
                              // which now exposes documentType for exactly this filtering).
                              const ENROLMENT_DOC_TYPES = ["policy_employee_data", "policy_employee_enrollment_data", "policy_endorsement_member_upload"];
                              const docRows = allDocs.filter((d: any) => Number(d.activityId) === eid && ENROLMENT_DOC_TYPES.includes(d.documentType));
                              return (
                                <Box sx={{ mt: 1.5, borderRadius: "14px", border: "1px solid #E5EBF4", overflow: "hidden" }}>
                                  {/* Header */}
                                  <Box sx={{ px: 3, py: 1.75, background: "linear-gradient(90deg, #EBF3FF 0%, #F8FAFF 100%)", borderBottom: "1px solid #DBEAFE", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                      <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#1C57B8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <FileText size={14} color="#fff" />
                                      </Box>
                                      <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1E3A6E" }}>Policy Documents</Typography>
                                    </Box>
                                    {isDocsLoading && <CircularProgress size={14} sx={{ color: "#1C57B8" }} />}
                                  </Box>
                                  <Box sx={{ bgcolor: "#fff", overflowX: "auto" }}>
                                    {/* Col headers */}
                                    <Box sx={{ display: "flex", alignItems: "center", px: 3, py: 1.25, bgcolor: "#F9FAFB", borderBottom: "1px solid #F3F4F6", minWidth: 900 }}>
                                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", width: 260, flexShrink: 0 }}>File Name</Typography>
                                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", width: 170, flexShrink: 0 }}>Document Name</Typography>
                                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", width: 160, flexShrink: 0 }}>Activity</Typography>
                                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", width: 130, flexShrink: 0 }}>Uploaded On</Typography>
                                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", flex: 1 }}>Uploaded By</Typography>
                                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", width: 110, textAlign: "right", flexShrink: 0 }}>Action</Typography>
                                    </Box>
                                    {!isDocsLoading && docRows.length === 0 && (
                                      <Box sx={{ px: 3, py: 3, textAlign: "center" }}>
                                        <Typography sx={{ fontSize: 15, color: "#9CA3AF" }}>No documents available for this endorsement.</Typography>
                                      </Box>
                                    )}
                                    {docRows.map((doc: any, idx: number) => {
                                      const uploadedDate = doc.uploadedAt
                                        ? new Date(doc.uploadedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                        : "—";
                                      return (
                                        <Box key={doc.id ?? idx} sx={{ display: "flex", alignItems: "center", px: 3, py: 1.5, borderBottom: idx < docRows.length - 1 ? "1px solid #F3F4F6" : "none", minWidth: 900, "&:hover": { bgcolor: "#FAFBFF" } }}>
                                          <Box sx={{ width: 260, flexShrink: 0, display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, pr: 2 }}>
                                            <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#F3F4F6", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                              <FileText size={14} color="#6B7280" />
                                            </Box>
                                            <Tooltip title={doc.fileName} placement="top" arrow>
                                              <Typography
                                                onClick={() => handleFileDownload(doc.id, doc.fileName)}
                                                sx={{ fontSize: 13, fontWeight: 500, color: "#1C57B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", textDecoration: "underline", "&:hover": { color: "#1849A9" } }}
                                              >
                                                {doc.fileName}
                                              </Typography>
                                            </Tooltip>
                                          </Box>
                                          <Typography sx={{ fontSize: 13, color: "#374151", width: 170, flexShrink: 0, pr: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.documentName || "—"}</Typography>
                                          <Typography sx={{ fontSize: 13, color: "#6B7280", width: 160, flexShrink: 0, pr: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.activityName || doc.subActivityName || "—"}</Typography>
                                          <Typography sx={{ fontSize: 13, color: "#6B7280", width: 130, flexShrink: 0 }}>{uploadedDate}</Typography>
                                          <Typography sx={{ fontSize: 13, color: "#6B7280", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", pr: 1 }}>{doc.uploadedBy || "—"}</Typography>
                                          <Box sx={{ width: 110, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
                                            <Box
                                              onClick={() => handleFileDownload(doc.id, doc.fileName)}
                                              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.5, py: 0.6, borderRadius: "8px", bgcolor: "#1C57B8", cursor: "pointer", "&:hover": { bgcolor: "#1849A9" }, transition: "background 0.15s" }}
                                            >
                                              <Download size={13} color="#fff" />
                                              <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>Download</Typography>
                                            </Box>
                                          </Box>
                                        </Box>
                                      );
                                    })}
                                  </Box>
                                </Box>
                              );
                            })()}

                            {/* ── Communication Details (endorsement steps) ── */}
                            {isEndorsementCard && (() => {
                              const steps = endorsementStepsMap[eid];
                              const isStepsLoading = endorsementStepsLoadingMap[eid] ?? (endorsementStepsMap[eid] === undefined);
                              const fmt = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
                              const fname = (p: string | null | undefined) => p?.split("/").pop() ?? null;

                              type StepRow = {
                                order: number; label: string; isCompleted: boolean; isCurrentStep: boolean;
                                ref: string; date: string; refLabel: string; docs: { fileId: number; fileName: string; date: string | null; label: string }[];
                              };

                              const stepRows: StepRow[] = steps ? [
                                {
                                  order: 1, label: steps.endorsementRequestReceived?.stepLabel ?? "Endorsement Request Received",
                                  isCompleted: !!steps.endorsementRequestReceived?.isCompleted,
                                  isCurrentStep: !!steps.endorsementRequestReceived?.isCurrentStep,
                                  ref: steps.endorsementRequestReceived?.data?.endorsementRequestReceived?.osTicketNumber ?? "—",
                                  refLabel: "OS Ticket",
                                  date: fmt(steps.endorsementRequestReceived?.data?.endorsementRequestReceived?.endorsementRequestReceivedDate),
                                  docs: [],
                                },
                                {
                                  order: 2, label: steps.createEndorsement?.stepLabel ?? "Create Endorsement",
                                  isCompleted: !!steps.createEndorsement?.isCompleted,
                                  isCurrentStep: !!steps.createEndorsement?.isCurrentStep,
                                  ref: steps.createEndorsement?.data?.createEndorsement?.provisionalEndorsementNumber ?? "—",
                                  refLabel: "Provisional No.",
                                  date: fmt(steps.createEndorsement?.data?.createEndorsement?.endorsementCreatedDate),
                                  docs: [],
                                },
                                {
                                  order: 3, label: steps.sendEndorsementToInsurer?.stepLabel ?? "Send Endorsement to Insurer",
                                  isCompleted: !!steps.sendEndorsementToInsurer?.isCompleted,
                                  isCurrentStep: !!steps.sendEndorsementToInsurer?.isCurrentStep,
                                  ref: "—", refLabel: "",
                                  date: fmt(steps.sendEndorsementToInsurer?.data?.sendEndorsementToInsurer?.insurerCommunicationDate),
                                  docs: (() => {
                                    const d = steps.sendEndorsementToInsurer?.data?.endorsementDocumentContainer;
                                    return d?.fileId ? [{ fileId: d.fileId, fileName: fname(d.fileName) ?? d.fileName, date: d.generatedDate, label: "Endorsement Doc" }] : [];
                                  })(),
                                },
                                {
                                  order: 4, label: steps.receiveInsurerAcknowledgement?.stepLabel ?? "Receive Acknowledgement from Insurer",
                                  isCompleted: !!steps.receiveInsurerAcknowledgement?.isCompleted,
                                  isCurrentStep: !!steps.receiveInsurerAcknowledgement?.isCurrentStep,
                                  ref: steps.receiveInsurerAcknowledgement?.data?.acknowledgementFromInsurer?.insurerEndorsementNumber ?? "—",
                                  refLabel: "Insurer Endo No.",
                                  date: fmt(steps.receiveInsurerAcknowledgement?.data?.acknowledgementFromInsurer?.acknowdgementDate),
                                  docs: (() => {
                                    const docId = steps.receiveInsurerAcknowledgement?.data?.endorsementPolicyDocumentId;
                                    return docId ? [{ fileId: docId, fileName: "Insurer Acknowledgement", date: steps.receiveInsurerAcknowledgement?.data?.acknowledgementFromInsurer?.acknowdgementDate, label: "Ack Doc" }] : [];
                                  })(),
                                },
                                {
                                  order: 5, label: steps.clientConfirmation?.stepLabel ?? "Client Confirmation",
                                  isCompleted: !!steps.clientConfirmation?.isCompleted,
                                  isCurrentStep: !!steps.clientConfirmation?.isCurrentStep,
                                  ref: "—", refLabel: "",
                                  date: fmt(steps.clientConfirmation?.data?.clientConfirmation?.clientConfirmationDate),
                                  docs: (() => {
                                    const out: StepRow["docs"] = [];
                                    const ed = steps.clientConfirmation?.data?.clientDocuments?.endorsementData;
                                    if (ed?.endorsementFileId) out.push({ fileId: ed.endorsementFileId, fileName: fname(ed.endorsementFileName) ?? ed.endorsementFileName, date: ed.endorsementCreatedDate, label: "Client Endo Doc" });
                                    const ip = steps.clientConfirmation?.data?.clientDocuments?.insurerPolicyDocument;
                                    if (ip?.insurerPolicyDocumentId) out.push({ fileId: ip.insurerPolicyDocumentId, fileName: fname(ip.insurerPolicyFileName) ?? ip.insurerPolicyFileName, date: ip.insurerPolicyCreatedDate, label: "Insurer Policy" });
                                    return out;
                                  })(),
                                },
                                {
                                  order: 6, label: steps.tpaIdUpload?.stepLabel ?? "TPA ID Upload",
                                  isCompleted: !!steps.tpaIdUpload?.isCompleted,
                                  isCurrentStep: !!steps.tpaIdUpload?.isCurrentStep,
                                  ref: "—", refLabel: "",
                                  date: fmt(steps.tpaIdUpload?.data?.tpaIdUpload?.tpaIdUploadDate),
                                  docs: (() => {
                                    const t = steps.tpaIdUpload?.data?.tpaIdUpload;
                                    return t?.tpaFileId ? [{ fileId: t.tpaFileId, fileName: fname(t.tpaFileName) ?? t.tpaFileName ?? "TPA ID Doc", date: t.tpaIdUploadDate, label: "TPA ID" }] : [];
                                  })(),
                                },
                              ] : [];

                              return (
                                <Box sx={{ mt: 1.5, borderRadius: "14px", border: "1px solid #E5EBF4", overflow: "hidden" }}>
                                  {/* Header */}
                                  <Box sx={{ px: 3, py: 1.75, background: "linear-gradient(90deg, #EBF3FF 0%, #F8FAFF 100%)", borderBottom: "1px solid #DBEAFE", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                      <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#1C57B8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Mail size={14} color="#fff" />
                                      </Box>
                                      <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1E3A6E" }}>Communication Details</Typography>
                                    </Box>
                                    {isStepsLoading && <CircularProgress size={14} sx={{ color: "#1C57B8" }} />}
                                  </Box>
                                  <Box sx={{ overflowX: "auto", bgcolor: "#fff" }}>
                                    <Table size="small" sx={{ minWidth: 900, borderCollapse: "collapse" }}>
                                      <TableHead>
                                        <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                                          {["#", "Step", "Status", "Date & Reference", "Document", "Action"].map((h) => (
                                            <TableCell key={h} sx={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", py: 1.25, borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>
                                              {h}
                                            </TableCell>
                                          ))}
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {!isStepsLoading && stepRows.length === 0 && (
                                          <TableRow>
                                            <TableCell colSpan={6} sx={{ textAlign: "center", py: 3, color: "#9CA3AF", fontSize: 14 }}>No step data available.</TableCell>
                                          </TableRow>
                                        )}
                                        {stepRows.map((row, idx) => {
                                          const statusLabel = row.isCompleted ? "Completed" : row.isCurrentStep ? "In Progress" : "Not Started";
                                          const statusColor = row.isCompleted ? "#065F46" : row.isCurrentStep ? "#1C57B8" : "#6B7280";
                                          const statusBg = row.isCompleted ? "#D1FAE5" : row.isCurrentStep ? "#DBEAFE" : "#F3F4F6";
                                          return (
                                            <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#FAFBFF" }, "&:last-child td": { borderBottom: 0 } }}>
                                              <TableCell sx={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", width: 32, borderBottom: "1px solid #F3F4F6", verticalAlign: "top", py: 1.5 }}>{row.order}</TableCell>
                                              <TableCell sx={{ fontSize: 13, fontWeight: 600, color: "#111827", borderBottom: "1px solid #F3F4F6", verticalAlign: "top", py: 1.5, minWidth: 200 }}>{row.label}</TableCell>
                                              <TableCell sx={{ borderBottom: "1px solid #F3F4F6", verticalAlign: "top", py: 1.5 }}>
                                                <Box sx={{ px: 1.25, py: 0.3, borderRadius: "20px", bgcolor: statusBg, display: "inline-flex" }}>
                                                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: statusColor, whiteSpace: "nowrap" }}>{statusLabel}</Typography>
                                                </Box>
                                              </TableCell>
                                              <TableCell sx={{ borderBottom: "1px solid #F3F4F6", verticalAlign: "top", py: 1.5, minWidth: 160 }}>
                                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{row.date}</Typography>
                                                {row.ref !== "—" && (
                                                  <Typography sx={{ fontSize: 12, color: "#6B7280", mt: 0.25 }}>
                                                    {row.refLabel ? `${row.refLabel}: ` : ""}{row.ref}
                                                  </Typography>
                                                )}
                                              </TableCell>
                                              <TableCell sx={{ borderBottom: "1px solid #F3F4F6", verticalAlign: "top", py: 1.5, minWidth: 200 }}>
                                                {row.docs.length === 0 ? (
                                                  <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>—</Typography>
                                                ) : (
                                                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                                                    {row.docs.map((doc, di) => (
                                                      <Box key={di} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                                        <FileText size={12} color="#6B7280" style={{ flexShrink: 0 }} />
                                                        <Tooltip title={doc.fileName} placement="top" arrow>
                                                          <Typography
                                                            onClick={() => handleFileDownload(doc.fileId, doc.fileName)}
                                                            sx={{ fontSize: 12, color: "#1C57B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180, cursor: "pointer", textDecoration: "underline", "&:hover": { color: "#1849A9" } }}
                                                          >
                                                            {doc.fileName}
                                                          </Typography>
                                                        </Tooltip>
                                                      </Box>
                                                    ))}
                                                  </Box>
                                                )}
                                              </TableCell>
                                              <TableCell sx={{ borderBottom: "1px solid #F3F4F6", verticalAlign: "top", py: 1.5 }}>
                                                {row.docs.length === 0 ? (
                                                  <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>—</Typography>
                                                ) : (
                                                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                                    {row.docs.map((doc, di) => (
                                                      <Box
                                                        key={di}
                                                        onClick={() => handleFileDownload(doc.fileId, doc.fileName)}
                                                        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.4, borderRadius: "8px", bgcolor: "#1C57B8", cursor: "pointer", "&:hover": { bgcolor: "#1849A9" }, transition: "background 0.15s", width: "fit-content" }}
                                                      >
                                                        <Download size={12} color="#fff" />
                                                        <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#fff" }}>Download</Typography>
                                                      </Box>
                                                    ))}
                                                  </Box>
                                                )}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Box>
                              );
                            })()}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </>)}
          </Box>
        )}



      </Box>
    </Box>

    {/* Floating back-to-top — fixed bottom-right, above quick links rail (z:120) */}
    {tatStripMode && activeTab === "claims" && (
      <Box
        onClick={() => {
          tabContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          setClaimStatus("");
          setTatStripMode(false);
          setPage(0);
        }}
        sx={{
          position: "fixed",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 130,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 2.25,
          py: 1.125,
          borderRadius: "12px",
          bgcolor: "#1C57B8",
          color: "#fff",
          cursor: "pointer",
          fontSize: 15, lineHeight: 1.7,
          fontWeight: 700,
          boxShadow: "0 6px 20px rgba(28,87,184,0.4)",
          "&:hover": { bgcolor: "#1a4fa0" },
        }}
      >
        <ChevronUp size={15} />
        Back to top
      </Box>
    )}
      {/* ─── Coming Soon Modal ───────────────────────────────────────── */}
      <CustomModal
        open={comingSoonModal.open}
        handleClose={() => setComingSoonModal({ open: false, title: "", subHeading: "", message: "" })}
        heading={<Typography sx={{ color: "#111827", fontWeight: 700, fontSize: 16 }}>{comingSoonModal.title}</Typography>}
        modalBoxStyles={{ maxWidth: "400px", width: "100%" }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, pt: 1, pb: 2 }}>
          <Box sx={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography sx={{ fontSize: 36 }}>{"📄"}</Typography>
          </Box>
          <Typography sx={{ fontSize: 17, fontWeight: 800, color: "#111827", textAlign: "center", lineHeight: 1.35 }}>
            {comingSoonModal.subHeading}
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 1.7, px: 1 }}>
            {comingSoonModal.message}
          </Typography>
          <Box onClick={() => setComingSoonModal({ open: false, title: "", subHeading: "", message: "" })} sx={{ mt: 1.5, px: 5, py: 1.25, borderRadius: "10px", background: "linear-gradient(90deg, #1C57B8 0%, #1C3A6E 100%)", cursor: "pointer", "&:hover": { opacity: 0.9 }, transition: "opacity 0.15s" }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Got it</Typography>
          </Box>
        </Box>
      </CustomModal>

      {/* ─── Send Enrolment Reminders Dialog ───────────────────────────── */}
      <Dialog
        open={sendReminderOpen}
        onClose={() => { setSendReminderOpen(false); setReminderSent(false); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 0, overflow: "hidden", maxWidth: 480 } }}
      >
        <DialogContent sx={{ p: 0 }}>
          {!reminderSent ? (
            <Box>
              {/* Header */}
              <Box sx={{ px: 4, pt: 3.5, pb: 3, background: "linear-gradient(135deg, #1C57B8 0%, #1F88C6 100%)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: "14px", bgcolor: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Mail size={22} color="#fff" />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Send Enrolment Reminders</Typography>
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.80)", mt: 0.75 }}>Notify employees who haven't enroled yet</Typography>
                  </Box>
                </Box>
              </Box>
              {/* Body */}
              <Box sx={{ px: 4, py: 3 }}>
                <Box sx={{ p: 3, borderRadius: "12px", bgcolor: "#EBF6FF", border: "1px solid #BDD7F5", mb: 3 }}>
                  <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#1C57B8", lineHeight: 1 }}>
                    {pendingCountLoading
                      ? <Box component="span" sx={{ fontSize: 18, color: "#667085" }}>Loading…</Box>
                      : <>{pendingEmployeeIds.length}<Box component="span" sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: "#667085", ml: 1 }}>employees pending</Box></>
                    }
                  </Typography>
                  <Typography sx={{ fontSize: 15, color: "#374151", lineHeight: 1.65, mt: 1 }}>
                    {pendingCountLoading
                      ? "Fetching pending employees…"
                      : pendingEmployeeIds.length > 0
                        ? `${pendingEmployeeIds.length} employee${pendingEmployeeIds.length !== 1 ? "s" : ""} have not yet enroled in this policy. Send a reminder to complete enrolment.`
                        : "All employees are enroled in this policy."}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827", mb: 1.75 }}>Reminder will be sent via:</Typography>
                {[
                  { label: "Email", desc: "To registered employee email IDs" },
                  // { label: "SMS", desc: "To registered mobile numbers" },
                ].map((ch) => (
                  <Box key={ch.label} sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, p: 1.75, borderRadius: "10px", bgcolor: "#F8FAFC", border: "1px solid #E4EAF3" }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: "10px", bgcolor: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Mail size={15} color="#1C57B8" />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827" }}>{ch.label}</Typography>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085" }}>{ch.desc}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
              {/* Footer */}
              <Box sx={{ px: 4, pb: 4, display: "flex", gap: 1.5 }}>
                <Box onClick={() => { setSendReminderOpen(false); setReminderSent(false); }} sx={{ flex: 1, height: 46, borderRadius: "10px", border: "1px solid #D0D5DD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: "#374151", cursor: "pointer", "&:hover": { bgcolor: "#F9FAFB" } }}>
                  Cancel
                </Box>
                <Box
                  onClick={async () => {
                    if (reminderSending) return;
                    setReminderSending(true);
                    try {
                      await apiRequest(endPoints.enrollmentReminder, {
                        method: "POST",
                        data: pendingEmployeeIds.length > 0
                          ? { employees: pendingEmployeeIds, forceImmediate: true }
                          : { policies: [numericPolicyId], forceImmediate: true },
                      });
                      setReminderSent(true);
                    } finally {
                      setReminderSending(false);
                    }
                  }}
                  sx={{ flex: 1, height: 46, borderRadius: "10px", background: "linear-gradient(90deg, #2556A6 0%, #1F88C6 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#fff", cursor: reminderSending ? "not-allowed" : "pointer", opacity: reminderSending ? 0.7 : 1 }}
                >
                  {reminderSending ? "Sending…" : "Send Now"}
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ px: 4, py: 6, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <Box sx={{ width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg, #2556A6 0%, #1F88C6 100%)", display: "flex", alignItems: "center", justifyContent: "center", mb: 2.5 }}>
                <CheckCircle2 size={30} color="#fff" />
              </Box>
              <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#111827", mb: 1 }}>Reminders Sent!</Typography>
              <Typography sx={{ fontSize: 15, color: "#667085", lineHeight: 1.7, mb: 4 }}>
                Enrolment reminders have been sent to{" "}
                <Box component="span" sx={{ fontWeight: 700, color: "#1C57B8" }}>{pendingEmployeeIds.length} employee{pendingEmployeeIds.length !== 1 ? "s" : ""}</Box>{" "}
                via email and SMS.
              </Typography>
              <Box onClick={() => { setSendReminderOpen(false); setReminderSent(false); }} sx={{ width: "100%", height: 46, borderRadius: "10px", background: "linear-gradient(90deg, #2556A6 0%, #1F88C6 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
                Done
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default HRPortalPolicySummary;
