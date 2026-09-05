import { Box, Typography } from "@mui/material";
import { capitalizeFirst } from "../../utils";
import {
  Activity,
  CalendarDays,
  ClipboardList,
  Download,
  FilePlus2,
  LineChart,
  List,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  endPoints,
  formatAmountWithCurrency,
  LocalizationConfig,
  useApiQuery,
  useLocalization,
} from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { ClaimsInsights } from "../../components/ClaimsInsights";
import { NewClaim } from "../../components/NewClaim";
import { ProcessClaim } from "../../components/ProcessClaim";
import { CLAIMS, type Claim } from "../../mock-data/hr-portal/claims";
import {
  PORTAL_DATE_OPTIONS,
  PortalActionButton,
  PortalControlBar,
  PortalHeroHeader,
  PortalSearchField,
  PortalSelectControl,
  PortalTabItem,
  downloadMockFile,
} from "../HRPortal/controls";
import {
  SectionCard,
  StyledTable,
  StyledTd,
  StyledTh,
} from "../HRPortal/styles";

type ClaimsTab = "all" | "intimate" | "process" | "insights" | "procedure";
type ProcedureMode = "cashless" | "reimbursement";

const CLAIM_TABS: { id: ClaimsTab; label: string; icon: typeof List }[] = [
  { id: "all", label: "All Claims", icon: List },
  { id: "intimate", label: "Submit Claim", icon: FilePlus2 },
  { id: "process", label: "Process Claim", icon: Activity },
  { id: "insights", label: "Insights", icon: LineChart },
  { id: "procedure", label: "Claim Procedure", icon: ClipboardList },
];

const STATUS_STYLE: Record<
  Claim["status"],
  { bg: string; color: string; border: string }
> = {
  Paid: { bg: "#edfdf1", color: "#14924e", border: "#b7efc5" },
  Outstanding: { bg: "#fff6e5", color: "#cb7c15", border: "#ffd58c" },
  Rejected: { bg: "#fff0f0", color: "#dd4b39", border: "#ffd1d0" },
  Closed: { bg: "#f3f6f9", color: "#6b7280", border: "#d6dde5" },
  Denied: { bg: "#fff0f0", color: "#dd4b39", border: "#ffd1d0" },
  Processing: { bg: "#eef5ff", color: "#2563eb", border: "#cfe0ff" },
};

const PROCEDURE_DATA: Record<
  ProcedureMode,
  {
    title: string;
    steps: { title: string; body: string; hint?: string }[];
  }
> = {
  cashless: {
    title: "Cashless Claim Process",
    steps: [
      {
        title: "Get Admitted to a Network Hospital",
        body: "Visit a TPA-empanelled network hospital. Present your insurance e-Card or policy number at the insurance / billing desk on arrival. Confirm the hospital is covered under your policy before admission.",
        hint: "Search network hospitals on the TPA portal or call 1800-XXX-XXXX before heading to the hospital.",
      },
      {
        title: "Hospital Sends Cashless Request to TPA",
        body: "The hospital submits the pre-authorisation form and estimated treatment cost to the insurer / TPA.",
      },
      {
        title: "Coordinate with Customer Service Team",
        body: "Your HR insurance desk and TPA coordinate for clarifications, policy checks, and room-rent limits if needed.",
      },
      {
        title: "TPA Authorises Cashless",
        body: "The insurer issues an approval or requests additional information for the cashless admission.",
      },
      {
        title: "Avail Treatment & Discharge",
        body: "The member receives treatment, pays only non-payable items, and completes discharge formalities at the hospital.",
      },
      {
        title: "Hospital Sends Final Bill to TPA",
        body: "After discharge, the hospital forwards the final bill packet and discharge summary for settlement.",
      },
      {
        title: "TPA Processes Claim & Pays Hospital",
        body: "The approved amount is settled directly with the hospital and the case is marked as paid / closed.",
      },
    ],
  },
  reimbursement: {
    title: "Reimbursement Claim Process",
    steps: [
      {
        title: "Seek Treatment at Any Hospital",
        body: "Receive treatment at a hospital of your choice and preserve every medical record, bill, prescription, and payment proof.",
        hint: "Keep originals ready. Missing discharge papers or invoices are the main reason reimbursements get delayed.",
      },
      {
        title: "Inform Insurer / HR Team",
        body: "Notify the TPA and HR insurance desk about the hospitalisation, ideally within 24 hours for emergency admissions.",
      },
      {
        title: "Collect Final Claim Documents",
        body: "Ensure the discharge summary, bills, investigation reports, doctor prescriptions, and cancelled cheque are available in one packet.",
      },
      {
        title: "Submit Reimbursement Claim Form",
        body: "Fill the reimbursement claim form and submit it along with originals to the TPA / insurer within the policy TAT.",
      },
      {
        title: "TPA Reviews Documentation",
        body: "The claim is scrutinised for eligibility, policy coverage, deductions, and admissible limits.",
      },
      {
        title: "Clarifications / Additional Docs",
        body: "If required, the TPA raises queries for missing proofs, treatment notes, or supporting medical evidence.",
      },
      {
        title: "Approved Amount Credited",
        body: "Once approved, the admissible reimbursement amount is transferred to the claimant’s registered bank account.",
      },
    ],
  },
};

const PROCEDURE_HELPLINES = [
  ["TPA Helpline (24×7)", "1800-XXX-XXXX"],
  ["Emergency Pre-auth", "1800-XXX-YYYY"],
  ["HR Insurance Desk", "+91 98765 00000"],
] as const;

const PROCEDURE_FORMS = [
  "Cashless Claim Form",
  "Reimbursement Form",
  "Pre-Auth Request",
  "Grievance Form",
] as const;

const PROCEDURE_CHECKLIST = [
  {
    title: "Insurance E-Card (digital or printed)",
    subtitle: "Download from HR portal",
  },
  {
    title: "Government-issued photo ID",
    subtitle: "Aadhaar / PAN / Passport",
  },
  {
    title: "Treating doctor's prescription / referral",
    subtitle: "On letterhead",
  },
  {
    title: "Pre-auth reference number from TPA",
    subtitle: "Required for cashless requests",
  },
  {
    title: "Discharge summary (original)",
    subtitle: "Signed by treating doctor",
  },
  {
    title: "Lab & diagnostic reports (original)",
    subtitle: "Attach key investigations",
  },
  {
    title: "Pharmacy bills and receipts",
    subtitle: "Itemised bill copies",
  },
  {
    title: "Implant stickers / invoices (if any)",
    subtitle: "Include supporting labels",
  },
] as const;

const PROCEDURE_TIMELINE = [
  ["Pre-auth Request", "2–4 hrs", 82],
  ["TPA Approval", "4–6 hrs", 83],
  ["Treatment Duration", "1–7 days", 88],
  ["Bill Submission", "1–2 days", 82],
  ["Final Settlement", "7–15 days", 86],
] as const;

const PROCEDURE_STATUS_MEANINGS = [
  [
    "Documents received by TPA.",
    "Await acknowledgement.",
    "Submitted",
    "#F3F4F6",
    "#475467",
    "#D0D5DD",
  ],
  [
    "TPA is verifying docs and eligibility.",
    "Keep employee reachable for queries.",
    "Under Review",
    "#EEF4FF",
    "#2563EB",
    "#BFDBFE",
  ],
  [
    "Additional info required from employee.",
    "Furnish response within 7 days.",
    "Query Raised",
    "#FFF7ED",
    "#EA580C",
    "#FED7AA",
  ],
  [
    "Full claim amount approved.",
    "Inform employee; settlement follows.",
    "Approved",
    "#ECFDF3",
    "#16A34A",
    "#BBF7D0",
  ],
  [
    "Part of the claim approved.",
    "Share deduction breakup.",
    "Partial Approval",
    "#ECFEFF",
    "#0891B2",
    "#A5F3FC",
  ],
  [
    "Claim denied — exclusion or missing docs.",
    "Review letter; escalate if needed.",
    "Rejected",
    "#FEF2F2",
    "#DC2626",
    "#FECACA",
  ],
  [
    "Payment released to hospital / employee.",
    "Confirm receipt; close record.",
    "Settled",
    "#EEF2FF",
    "#4F46E5",
    "#C7D2FE",
  ],
] as const;

function normalizeClaimStatus(raw: string | undefined): Claim["status"] {
  const s = (raw ?? "").toLowerCase();
  if (s === "settled" || s === "paid") return "Paid";
  if (s === "rejected") return "Rejected";
  if (s === "closed") return "Closed";
  if (s === "denied") return "Denied";
  if (s === "outstanding" || s === "pending" || s === "processing") return "Processing";
  return "Outstanding";
}

function mapTpaToClaim(tpa: Record<string, any>, localization?: LocalizationConfig): Claim {
  // Supports both MIS field names (legacy) and TPA external field names (new tpa-claims API)
  const claimNo = tpa.CLAIM_ID ?? tpa.INSURANCE_CLAIM_NO ?? tpa.TPA_CLAIM_NO ?? "";
  const rawDate = tpa.CLAIM_REG_DATE ?? tpa.CLAIM_REGISTERED_DATE ?? "";
  const claimDate = rawDate
    ? new Date(rawDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";
  const regDate = rawDate ? new Date(rawDate).getTime() : 0;
  const settleDate =
    (tpa.SETTLED_DATE ?? tpa.DATE_OF_SETTLEMENT)
      ? new Date(tpa.SETTLED_DATE ?? tpa.DATE_OF_SETTLEMENT).getTime()
      : Date.now();
  const tat = regDate ? Math.round((settleDate - regDate) / 86400000) : 0;

  const rawAmount = tpa.CLAIM_AMOUNT ?? tpa.ESTIMATED_CLAIM_AMOUNT;
  const rawSettled = tpa.CHEQUE_AMOUNT ?? tpa.APPROVED_AMOUNT ?? tpa.PAID_AMOUNT;

  return {
    id: claimNo,
    empId: tpa.EMPLOYEE_NO ?? "",
    empName: tpa.EMPLOYEE_NAME ?? "",
    dept: tpa.SUB_GROUP?.trim() ?? "",
    relation: tpa.PATIENT_RELATION ?? tpa.RELATION ?? "",
    tpaId: tpa.TPA_ID ?? tpa.TPA_HEALTH_ID ?? "",
    claimType: (tpa.CLAIM_TYPE ?? tpa.TYPE_OF_CLAIM ?? "").toUpperCase() === "CASHLESS" ? "Cashless" : "Reimbursement",
    claimDate,
    claimAmount: rawAmount ? `${formatAmountWithCurrency(Number(rawAmount), localization)}` : "—",
    claimAmountExact: rawAmount ? `${formatAmountWithCurrency(Number(rawAmount), localization)}` : "—",
    settledAmount: rawSettled ? `${formatAmountWithCurrency(Number(rawSettled), localization)}` : "—",
    settledAmountExact: rawSettled ? `${formatAmountWithCurrency(Number(rawSettled), localization)}` : "—",
    status: normalizeClaimStatus(tpa.CLAIM_STATUS ?? tpa.STATUS),
    tat,
  };
}

// CLAIMS mock data has ₹-formatted strings baked in for the empty-state fallback
// (shown when there's no real TPA data yet) — re-derive the raw amount and
// re-format it with the current company's currency so the fallback isn't
// always Indian-formatted for non-Indian companies.
function localizeMockClaim(claim: Claim, localization?: LocalizationConfig): Claim {
  const toNum = (s: string) => Number(s.replace(/[^0-9.]/g, "")) || 0;
  return {
    ...claim,
    claimAmount: formatAmountWithCurrency(toNum(claim.claimAmountExact), localization),
    claimAmountExact: formatAmountWithCurrency(toNum(claim.claimAmountExact), localization),
    settledAmount: formatAmountWithCurrency(toNum(claim.settledAmountExact), localization),
    settledAmountExact: formatAmountWithCurrency(toNum(claim.settledAmountExact), localization),
  };
}

function formatEcardDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  }
  return dateStr;
}

function AllClaimsTab({
  policy,
  tpaClaims,
  refreshing,
}: {
  policy: string;
  tpaClaims: Claim[];
  refreshing?: boolean;
}) {
  const navigate = useNavigate();
  const { localizationData } = useLocalization();
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("All years");
  const [statusFilter, setStatusFilter] = useState("All status");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [page, setPage] = useState(1);
  const claimsScrollRef = useRef<HTMLDivElement | null>(null);
  const [claimsScrolled, setClaimsScrolled] = useState(false);
  const pageSize = 8;

  const allClaims = tpaClaims.length > 0
    ? tpaClaims
    : CLAIMS.map((c) => localizeMockClaim(c, localizationData?.data));

  const filteredClaims = useMemo(() => {
    return allClaims.filter((claim) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        claim.id.toLowerCase().includes(query) ||
        claim.empId.toLowerCase().includes(query) ||
        claim.empName.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "All status" || claim.status === statusFilter;
      const matchesType =
        typeFilter === "All types" || claim.claimType === typeFilter;
      const matchesYear =
        yearFilter === "All years" || claim.claimDate.endsWith(yearFilter);
      const matchesPolicy = policy === "All Policies" || true;
      return matchesSearch && matchesStatus && matchesType && matchesYear && matchesPolicy;
    });
  }, [search, statusFilter, typeFilter, yearFilter, policy, allClaims]);

  const totalPages = Math.max(1, Math.ceil(filteredClaims.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedClaims = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClaims.slice(start, start + pageSize);
  }, [currentPage, filteredClaims]);

  const kpis = [
    { label: "Total Claims", value: "25", note: "All Submitted" },
    { label: "Paid", value: "7", note: "Settled Claims" },
    { label: "Outstanding", value: "13", note: "Pending Claims" },
    { label: "Rejected", value: "1", note: "Rejected Claims" },
    { label: "Closed", value: "2", note: "Closed Claims" },
    { label: "Denied", value: "2", note: "Denied Claims" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {refreshing ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.8,
            py: 1,
            borderRadius: "8px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#92400e",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <RefreshCw size={13} style={{ flexShrink: 0, animation: "spin 1.2s linear infinite" }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          Syncing latest claims from TPA in the background — showing cached data. Refresh the page in a moment to see updated results.
        </Box>
      ) : null}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          overflow: "hidden",
          background: "linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)",
          border: "1px solid #FFF",
          borderRadius: "8px",
          boxShadow: "0 6px 100px 0 rgba(0, 0, 0, 0.10)",
        }}
      >
        {kpis.map((item, index) => (
          <Box
            key={item.label}
            sx={{
              p: 1.5,
              borderLeft: index === 0 ? "none" : "1px solid #E4EAF2",
            }}
          >
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#687686" }}>
              {item.label}
            </Typography>
            <Typography
              sx={{ mt: 0.75, fontSize: 28, lineHeight: 1.25, letterSpacing: "-0.4px", fontWeight: 600, color: "#1f2937" }}
            >
              {item.value}
            </Typography>
            <Typography sx={{ mt: 0.75, fontSize: 15, lineHeight: 1.7, color: "#8d99a6" }}>
              {item.note}
            </Typography>
          </Box>
        ))}
      </Box>

      <SectionCard
        sx={{
          mb: 0,
          p: 0,
          borderRadius: "8px",
          overflow: "hidden",
          background: "#FFFFFF",
          border: "1px solid #E3EDF7",
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: "1px solid #E9EEF5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <PortalSearchField
              value={search}
              onChange={setSearch}
              placeholder="Search employee, claim no..."
              icon={<Search size={14} color="#98A2B3" />}
              width={370}
              height={32}
              borderRadius="8px"
              fontSize={11.5}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <PortalSelectControl
              value={yearFilter}
              onChange={setYearFilter}
              options={["All years", "2025"]}
              width={96}
              height={32}
              borderRadius="8px"
              fontSize={11.5}
            />
            <PortalSelectControl
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                "All status",
                "Paid",
                "Outstanding",
                "Rejected",
                "Closed",
                "Denied",
                "Processing",
              ]}
              width={106}
              height={32}
              borderRadius="8px"
              fontSize={11.5}
            />
            <PortalSelectControl
              value={typeFilter}
              onChange={setTypeFilter}
              options={["All types", "Cashless", "Reimbursement"]}
              width={108}
              height={32}
              borderRadius="8px"
              fontSize={11.5}
            />
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                height: 32,
                px: 1.5,
                borderRadius: "8px",
                background: "#1C57B8",
                color: "#FFFFFF",
                fontSize: 15, lineHeight: 1.7,
                fontWeight: 600,
                cursor: "pointer",
                userSelect: "none",
                "&:hover": { background: "#184D9F" },
                transition: "background 0.15s ease",
              }}
            >
              <Download size={14} color="#fff" />
              Export
            </Box>
          </Box>
        </Box>

        <Box ref={claimsScrollRef} onScroll={(e) => setClaimsScrolled((e.currentTarget as HTMLDivElement).scrollLeft > 0)} sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 1300 }}>
            {/* Fixed header — never scrolls vertically */}
            <StyledTable style={{ width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0 }}>
              <colgroup>
                {[130,100,140,90,90,90,100,110,110,100,140].map((w, i) => <col key={i} style={{ width: w }} />)}
              </colgroup>
              <thead>
                <tr>
                  {[
                    "Claim Number",
                    "Employee ID",
                    "Employee Name",
                    "Relation",
                    "TPA ID",
                    "Claim Type",
                    "Claim Date",
                    "Claim Amount",
                    "Settled Amount",
                    "Status",
                    "TAT / Aging (Days)",
                  ].map((heading, hi) => (
                    <StyledTh
                      key={heading}
                      sx={{
                        py: 1.2,
                        fontSize: 15, lineHeight: 1.7,
                        background: "#4B6B8A",
                        color: "#fff",
                        borderBottom: "1px solid rgba(255,255,255,0.15)",
                        textTransform: "none",
                        ...(hi === 0 ? { position: "sticky", left: 0, bgcolor: "#4B6B8A", zIndex: 3, borderRight: claimsScrolled ? "1px solid rgba(255,255,255,0.3)" : "none" } : {}),
                      }}
                    >
                      {heading}
                    </StyledTh>
                  ))}
                </tr>
              </thead>
            </StyledTable>
            {/* Table body */}
            <Box>
              <StyledTable style={{ width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0 }}>
                <colgroup>
                  {[130,100,140,90,90,90,100,110,110,100,140].map((w, i) => <col key={i} style={{ width: w }} />)}
                </colgroup>
                <tbody>
                  {paginatedClaims.map((claim) => {
                    const statusStyle = STATUS_STYLE[claim.status];

                    return (
                      <tr key={claim.id}>
                        <StyledTd sx={{ py: 1.15, minHeight: 44, position: "sticky", left: 0, zIndex: 2, bgcolor: "#fff", borderRight: claimsScrolled ? "1px solid #94A3B8" : "none" }}>
                      <Typography
                        onClick={() =>
                          navigate(`/hr-portal/claims/${claim.id}`)
                        }
                        sx={{
                          fontSize: 15, lineHeight: 1.7,
                          fontWeight: 600,
                          color: "#2a75d7",
                          cursor: "pointer",
                        }}
                      >
                        {claim.id}
                      </Typography>
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44, fontSize: 15, lineHeight: 1.7 }}>
                      {claim.empId}
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44 }}>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#1f2937" }}>
                        {claim.empName}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 15, lineHeight: 1.7, color: "#9aa6b2", mt: 0.2 }}
                      >
                        {claim.dept}
                      </Typography>
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44, fontSize: 15, lineHeight: 1.7 }}>
                      {capitalizeFirst(claim.relation)}
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44, fontSize: 15, lineHeight: 1.7 }}>
                      {claim.tpaId}
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44 }}>
                      <Box
                        sx={{
                          display: "inline-flex",
                          px: 0.9,
                          py: 0.35,
                          borderRadius: "6px",
                          background:
                            claim.claimType === "Cashless"
                              ? "#f1edff"
                              : "#fff1e8",
                          color:
                            claim.claimType === "Cashless"
                              ? "#7c5ce0"
                              : "#d17d14",
                          fontSize: 15, lineHeight: 1.7,
                          fontWeight: 600,
                        }}
                      >
                        {claim.claimType}
                      </Box>
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44, fontSize: 15, lineHeight: 1.7 }}>
                      {claim.claimDate}
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44 }}>
                      <Typography
                        sx={{
                          fontSize: 15, lineHeight: 1.7,
                          fontWeight: 600,
                          color: "#1f2937",
                        }}
                      >
                        {claim.claimAmount}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 15, lineHeight: 1.7, color: "#9aa6b2", mt: 0.2 }}
                      >
                        {claim.claimAmountExact}
                      </Typography>
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44 }}>
                      <Typography
                        sx={{
                          fontSize: 15, lineHeight: 1.7,
                          fontWeight: 600,
                          color: "#14924e",
                        }}
                      >
                        {claim.settledAmount}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 15, lineHeight: 1.7, color: "#9aa6b2", mt: 0.2 }}
                      >
                        {claim.settledAmountExact}
                      </Typography>
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44 }}>
                      <Box
                        sx={{
                          display: "inline-flex",
                          px: 0.9,
                          py: 0.35,
                          borderRadius: "7px",
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                          fontSize: 15, lineHeight: 1.7,
                          fontWeight: 600,
                        }}
                      >
                        {claim.status}
                      </Box>
                    </StyledTd>
                    <StyledTd sx={{ py: 1.15, minHeight: 44 }}>
                      <Box
                        sx={{
                          display: "inline-flex",
                          px: 0.9,
                          py: 0.35,
                          borderRadius: "7px",
                          background: "#fff0f0",
                          color: "#ef4444",
                          border: "1px solid #ffd1d0",
                          fontSize: 15, lineHeight: 1.7,
                          fontWeight: 600,
                        }}
                      >
                        {claim.tat}d
                      </Box>
                    </StyledTd>
                      </tr>
                    );
                  })}
                </tbody>
              </StyledTable>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            px: 1.6,
            py: 1,
            borderTop: "1px solid #edf1f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#8d99a6" }}>
            Showing{" "}
            {filteredClaims.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            -{Math.min(currentPage * pageSize, filteredClaims.length)} of{" "}
            {filteredClaims.length}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            {[
              { key: "prev", label: "‹", disabled: currentPage === 1 },
              ...Array.from({ length: totalPages }, (_, index) => ({
                key: `page-${index + 1}`,
                label: String(index + 1),
                active: currentPage === index + 1,
              })),
              {
                key: "next",
                label: "›",
                disabled: currentPage === totalPages,
              },
            ].map((item) => (
              <Box
                key={item.key}
                onClick={() => {
                  if (item.key === "prev" && currentPage > 1) {
                    setPage(currentPage - 1);
                  } else if (item.key === "next" && currentPage < totalPages) {
                    setPage(currentPage + 1);
                  } else if (item.key.startsWith("page-")) {
                    setPage(Number(item.label));
                  }
                }}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  border: item.active ? "none" : "1px solid #E5E7EB",
                  background: item.active ? "#1C57B8" : "#FFFFFF",
                  color: item.active ? "#FFFFFF" : "#6B7280",
                  opacity: item.disabled ? 0.45 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15, lineHeight: 1.7,
                  fontWeight: 600,
                  cursor: item.disabled ? "default" : "pointer",
                }}
              >
                {item.label}
              </Box>
            ))}
          </Box>
        </Box>
      </SectionCard>
      <Box sx={{ minHeight: 14 }} />
    </Box>
  );
}

function ClaimProcedureTab() {
  const [mode, setMode] = useState<ProcedureMode>("cashless");
  const [expandedStep, setExpandedStep] = useState(0);
  const data = PROCEDURE_DATA[mode];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box
        sx={{
          width: "fit-content",
          display: "inline-flex",
          borderRadius: "8px",
          border: "1px solid #dce5ee",
          overflow: "hidden",
          background: "#fff",
        }}
      >
        {(["cashless", "reimbursement"] as ProcedureMode[]).map((item) => (
          <Box
            key={item}
            onClick={() => setMode(item)}
            sx={{
              px: 2.4,
              py: 1.05,
              background: mode === item ? "#2a75d7" : "#fff",
              color: mode === item ? "#fff" : "#607182",
              fontSize: 15, lineHeight: 1.7,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {item === "cashless" ? "Cashless" : "Reimbursement"}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 2.5 }}>
        <SectionCard
          sx={{ mb: 0, p: 0, borderRadius: "10px", overflow: "hidden" }}
        >
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: "1px solid #edf1f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 600, color: "#1f2937" }}
            >
              {data.title}
            </Typography>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#8d99a6" }}>
              7 Steps
            </Typography>
          </Box>

          <Box
            sx={{
              px: 3,
              py: 2,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
            }}
          >
            {data.steps.map((step, index) => {
              const active = expandedStep === index;

              return (
                <Box key={step.title} sx={{ display: "flex", gap: 1.2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: active ? "#1d57b7" : "#fff",
                        border: active ? "none" : "1px solid #d9e3ec",
                        color: active ? "#fff" : "#97a2af",
                        fontSize: 15, lineHeight: 1.7,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </Box>
                    {index < data.steps.length - 1 ? (
                      <Box
                        sx={{
                          width: 2,
                          flex: 1,
                          background: "#d7e5f4",
                          my: 0.4,
                        }}
                      />
                    ) : null}
                  </Box>

                  <Box sx={{ flex: 1, pb: 1.05 }}>
                    <Box
                      onClick={() => setExpandedStep(index)}
                      sx={{
                        minHeight: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                      }}
                    >
                      <Typography
                        sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#2a3441" }}
                      >
                        {step.title}
                      </Typography>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#95a1ae" }}>
                        {active ? "⌃" : "⌄"}
                      </Typography>
                    </Box>

                    {active ? (
                      <Box
                        sx={{
                          mt: 0.9,
                          borderRadius: "10px",
                          background: "#eef5ff",
                          border: "1px solid #dce9fa",
                          px: 2,
                          py: 1.75,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: "#1d57b7",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 15, lineHeight: 1.7,
                              fontWeight: 600,
                              flexShrink: 0,
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Typography
                            sx={{
                              fontSize: 15, lineHeight: 1.7,
                              color: "#556678",
                              lineHeight: 1.6,
                            }}
                          >
                            {step.body}
                          </Typography>
                        </Box>
                        {step.hint ? (
                          <Box
                            sx={{
                              mt: 1.2,
                              pt: 1.1,
                              borderTop: "1px solid #cfdcf0",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.7,
                              color: "#2a75d7",
                              fontSize: 15, lineHeight: 1.7,
                            }}
                          >
                            <Box
                              sx={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                border: "1px solid currentColor",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 15, lineHeight: 1.7,
                                fontWeight: 600,
                              }}
                            >
                              i
                            </Box>
                            <Typography
                              sx={{ fontSize: 15, lineHeight: 1.7, color: "#2a75d7" }}
                            >
                              {step.hint}
                            </Typography>
                          </Box>
                        ) : null}
                      </Box>
                    ) : null}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </SectionCard>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <SectionCard
            sx={{ mb: 0, p: 0, borderRadius: "10px", overflow: "hidden" }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #edf1f6" }}>
              <Typography
                sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#2a3441" }}
              >
                Helpline Numbers
              </Typography>
            </Box>
            <Box sx={{ px: 2, py: 1.5, display: "grid", rowGap: 1.4 }}>
              {PROCEDURE_HELPLINES.map(([label, value]) => (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1.2,
                  }}
                >
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#7d8794" }}>
                    {label}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: "#1f2937" }}
                  >
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </SectionCard>

          <SectionCard
            sx={{ mb: 0, p: 0, borderRadius: "10px", overflow: "hidden" }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #edf1f6" }}>
              <Typography
                sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#2a3441" }}
              >
                Download Forms
              </Typography>
            </Box>
            <Box sx={{ px: 2, py: 1.5, display: "grid", rowGap: 0.75 }}>
              {PROCEDURE_FORMS.map((item) => (
                <Box
                  key={item}
                  onClick={() =>
                    downloadMockFile(
                      `${item.toLowerCase().replace(/\s+/g, "-")}.txt`,
                      `Mock download for ${item}`
                    )
                  }
                  sx={{
                    px: 1.2,
                    py: 0.85,
                    borderRadius: "7px",
                    background: "#f7f9fc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 15, lineHeight: 1.7,
                    color: "#4c5d6e",
                    cursor: "pointer",
                  }}
                >
                  {item}
                  <Download size={11} />
                </Box>
              ))}
            </Box>
          </SectionCard>

          <Box
            sx={{
              borderRadius: "10px",
              overflow: "hidden",
              background: "linear-gradient(90deg, #2556a6 0%, #1f88c6 100%)",
              color: "#fff",
              px: 2,
              py: 1.75,
            }}
          >
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600 }}>
              Escalation
            </Typography>
            <Box sx={{ mt: 1.4, display: "grid", rowGap: 1.1 }}>
              <Box>
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, opacity: 0.72 }}>
                  Email
                </Typography>
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, mt: 0.75 }}>
                  grievance@tpa.in
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, opacity: 0.72 }}>
                  Phone
                </Typography>
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, mt: 0.75 }}>
                  1800-XXX-ZZZZ
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, opacity: 0.72 }}>
                  Response
                </Typography>
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, mt: 0.75 }}>
                  3 working days
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.6 }}>
        <SectionCard sx={{ mb: 0, p: 1.6, borderRadius: "10px" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography
              sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#2a3441" }}
            >
              Document Checklist
            </Typography>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#2a75d7" }}>
              0 / 8 ready
            </Typography>
          </Box>
          <Box
            sx={{
              mt: 1.4,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.2,
            }}
          >
            {PROCEDURE_CHECKLIST.map((item) => (
              <Box
                key={item.title}
                sx={{
                  minHeight: 56,
                  borderRadius: "8px",
                  border: "1px solid #E6EDF5",
                  px: 1.3,
                  py: 1.1,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 0.9,
                }}
              >
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "1.5px solid #D0D5DD",
                    flexShrink: 0,
                    mt: 0.15,
                  }}
                />
                <Box>
                  <Typography
                    sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: "#344054" }}
                  >
                    {item.title}
                  </Typography>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#98A2B3", mt: 0.2 }}>
                    {item.subtitle}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </SectionCard>

        <SectionCard sx={{ mb: 0, p: 1.6, borderRadius: "10px" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography
              sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#2a3441" }}
            >
              Expected Approval Timeline
            </Typography>
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 999,
                background: "#f3f6f9",
                fontSize: 15, lineHeight: 1.7,
                color: "#7d8794",
              }}
            >
              Total ≈ 7-22 days
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.9 }}>
            {PROCEDURE_TIMELINE.map(([label, value, fill]) => (
              <Box key={label}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "132px 1fr auto",
                    gap: 1.25,
                    alignItems: "center",
                  }}
                >
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085" }}>
                    {label}
                  </Typography>
                  <Box
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      background: "#E5E7EB",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${fill}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: "#2a75d7",
                      }}
                    />
                  </Box>
                  <Typography
                    sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#2a75d7" }}
                  >
                    {value}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
          <Typography
            sx={{ mt: 1.8, fontSize: 15.8, color: "#98A2B3", lineHeight: 1.6 }}
          >
            * Timelines vary based on document completeness and TPA workload.
            Track status under{" "}
            <Box component="span" sx={{ color: "#475467", fontWeight: 600 }}>
              Claims -&gt; Process Claim
            </Box>
            .
          </Typography>
        </SectionCard>
      </Box>

      <SectionCard
        sx={{ mb: 0, p: 0, borderRadius: "10px", overflow: "hidden" }}
      >
        <Box
          sx={{
            px: 1.8,
            py: 1.35,
            borderBottom: "1px solid #E6EDF5",
          }}
        >
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#2a3441" }}>
            Claim Status Meaning
          </Typography>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1.3fr 0.9fr",
            px: 1.8,
            py: 1.05,
            background: "#F8FAFC",
            borderBottom: "1px solid #E6EDF5",
          }}
        >
          {["Meaning", "HR Action", "Status"].map((label) => (
            <Typography
              key={label}
              sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085", fontWeight: 600 }}
            >
              {label}
            </Typography>
          ))}
        </Box>
        {PROCEDURE_STATUS_MEANINGS.map(
          ([meaning, action, status, bg, color, border], index) => (
            <Box
              key={status}
              sx={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1.3fr 0.9fr",
                px: 1.8,
                py: 1.15,
                borderBottom:
                  index < PROCEDURE_STATUS_MEANINGS.length - 1
                    ? "1px solid #EEF2F6"
                    : "none",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#475467" }}>
                {meaning}
              </Typography>
              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085" }}>
                {action}
              </Typography>
              <Box>
                <Box
                  sx={{
                    width: "fit-content",
                    px: 1.05,
                    py: 0.42,
                    borderRadius: 999,
                    background: bg,
                    color,
                    border: `1px solid ${border}`,
                    fontSize: 15, lineHeight: 1.7,
                    fontWeight: 600,
                  }}
                >
                  {status}
                </Box>
              </Box>
            </Box>
          )
        )}
      </SectionCard>
    </Box>
  );
}

export function HRPortalClaims() {
  const [activeTab, setActiveTab] = useState<ClaimsTab>("all");
  const [policy, setPolicy] = useState("All Policies");
  const [dateRange, setDateRange] = useState(PORTAL_DATE_OPTIONS[0]);

  // ── TPA claims — single call to backend sync endpoint ─────────────────────
  // The backend handles: 24h TTL check → Redis lock → TPA API fetch → DB store.
  // If another user triggered a fetch for the same policy concurrently, the
  // backend returns refreshing:true with cached rows so this user is not blocked.
  const [tpaClaims, setTpaClaims] = useState<Claim[]>([]);
  const [claimsRefreshing, setClaimsRefreshing] = useState(false);
  const hasFetchedRef = useRef(false);
  const { localizationData } = useLocalization();

  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeId = userDetails?.id;

  const { data: eCards } = useApiQuery({
    queryKey: ["eCardsForClaims", employeeId],
    url: employeeId ? endPoints.eCards(employeeId) : "",
    enabled: Boolean(employeeId),
  });

  const primaryEcard = useMemo(() => {
    const records = (eCards as any)?.data?.ecarddata;
    return Array.isArray(records) && records.length > 0 ? records[0] : null;
  }, [eCards]);

  useEffect(() => {
    if (!primaryEcard?.policyNumber || hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    (async () => {
      try {
        const policyStartDate = formatEcardDate(primaryEcard.policyFrom);
        const policyEndDate = formatEcardDate(primaryEcard.policyTo);

        const response = await apiRequest(
          endPoints.tpaClaimsSync(primaryEcard.policyNumber, policyStartDate, policyEndDate, employeeId),
          { method: "GET" },
        );

        const result = (response as any)?.data ?? {};
        const fetchedClaims: any[] = result.claims ?? [];
        const isRefreshing: boolean = result.refreshing ?? false;

        setTpaClaims(fetchedClaims.map((claim) => mapTpaToClaim(claim, localizationData?.data)));
        setClaimsRefreshing(isRefreshing);
      } catch {
        // Fall back to mock data silently
      }
    })();
  }, [primaryEcard, localizationData]);

  const pageAction =
    activeTab === "process"
      ? { label: "Refresh", icon: RefreshCw }
      : activeTab === "procedure" || activeTab === "insights"
      ? null
      : { label: "Bulk Upload", icon: Upload };

  const ActionIcon = pageAction?.icon;

  return (
    <Box
      sx={{
        mx: -3,
        mt: -0.5,
        height: "100%",
        background: "#EBF6FF",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 0,
          background: "#EBF6FF",
          flexShrink: 0,
        }}
      >
        <PortalHeroHeader
          title={
            CLAIM_TABS.find((tab) => tab.id === activeTab)?.label ?? "Claims"
          }
          bleed={true}
          action={
            pageAction && ActionIcon ? (
              <PortalActionButton
                label={pageAction.label}
                icon={<ActionIcon size={14} />}
                variant="light"
                onClick={() => {
                  if (activeTab === "process") {
                    setDateRange((current) => current);
                    return;
                  }
                  downloadMockFile(
                    `claims-${activeTab}.txt`,
                    `Mock export for ${activeTab} claims in ${policy} for ${dateRange}`
                  );
                }}
              />
            ) : undefined
          }
        />

        <PortalControlBar
          bleed={true}
          rightSlot={
            activeTab !== "intimate" ? (
              <>
                <PortalSelectControl
                  value={policy}
                  onChange={setPolicy}
                  options={["All Policies", "GMC", "GPA", "GTL"]}
                  width={118}
                />
                <PortalSelectControl
                  value={dateRange}
                  onChange={setDateRange}
                  options={PORTAL_DATE_OPTIONS}
                  width={246}
                  minWidth={246}
                  leadingIcon={<CalendarDays size={14} />}
                />
              </>
            ) : undefined
          }
        >
          {CLAIM_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <PortalTabItem
                key={tab.id}
                active={active}
                onClick={() => setActiveTab(tab.id)}
                icon={<Icon size={14} />}
                label={tab.label}
              />
            );
          })}
        </PortalControlBar>
      </Box>

      <Box
        sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", px: 3, py: 2.5 }}
      >
        {activeTab === "all" ? <AllClaimsTab policy={policy} tpaClaims={tpaClaims} refreshing={claimsRefreshing} /> : null}
        {activeTab === "intimate" ? <NewClaim /> : null}
        {activeTab === "process" ? <ProcessClaim /> : null}
        {activeTab === "insights" ? <ClaimsInsights /> : null}
        {activeTab === "procedure" ? <ClaimProcedureTab /> : null}
      </Box>
    </Box>
  );
}

export default HRPortalClaims;
