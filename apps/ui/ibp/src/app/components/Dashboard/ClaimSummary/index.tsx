import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { capitalizeFirst } from "../../../utils";
import { RefreshCw } from "lucide-react";
import { endPoints, useLocalization, formatAmountWithCurrency } from "@ui/ui-lib";
import { useApiMutation } from "@ui/ui-lib/hooks/useMutation";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { Box, Button, Tooltip } from "@mui/material";
import {
  StyledContainer,
  StyledHeader,
  StyledCard,
  StyledStatusBar,
  StyledPolicySection,
  StyledPolicyInfo,
  StyledPolicyItem,
  StyledPolicyNumber,
  StyledPolicyLabel,
  StyledAmountSection,
  StyledGaugeContainer,
  StyledAmountBox,
  StyledAmountContent,
  StyledAmountIndicator,
  StyledAmount,
  StyledAmountLabel,
  StyledClaimItem,
  StyledClaimHeader,
  StyledClaimLeft,
  StyledClaimInfo,
  StyledClaimName,
  StyledClaimId,
  StyledClaimDetails,
  StyledClaimDetail,
  StyledClaimValue,
  StyledClaimLabel,
  StyledFamilySection,
  StyledFamilyHeader,
  StyledFamilyMembers,
  StyledFamilyMember,
  StyledFamilyName,
  StyledFamilyRelation,
  StyledStatusBarTitle,
  StyledStatusBarValue,
  StyledClaimIcon,
  BottomContainer,
  BottomContainerContent,
  BottomContainerImage,
  StyledDividerLine,
  DividerLine,
  CardHeader,
  ShowMoreButton,
  EmptyStateContainer,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateSubtitle,
  PolicySeparator,
  CoverageLabel,
  PolicyMetaRow,
  PolicyTypeImage,
  StyledPolicyTypeTitle,
  StyledClaimLabelWithStatus,
  StyledClaimStatusDetail,
  StyledClaimLabelText,
  StyledClaimLabelDetail,
} from "./styles";
import claimsDocIcon from "../../../../assets/svgs/claims-employee-icon.svg";
import claimsBackground from "../../../assets/svgs/claims-background-img.svg";
import policyType from "../../../assets/svgs/policy-type.svg";
import { formatDate } from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { DATE_FORMATS } from "../../../constants";
import NoDataPage from "../../../common/NoData";

function parseDateStr(str?: string | null): Date | null {
  if (!str || str === "--") return null;
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  // Try DD-MMM-YYYY or DD/MMM/YYYY
  const match = String(str).match(/(\d{1,2})[\s\-/]([A-Za-z]+)[\s\-/](\d{4})/);
  if (match) {
    const months: Record<string, number> = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
    const m = months[match[2].toLowerCase().slice(0,3)];
    if (m !== undefined) return new Date(Number(match[3]), m, Number(match[1]));
  }
  return null;
}

function computeTAT(requestedOn?: string, updatedOn?: string, status?: string): string {
  const start = parseDateStr(requestedOn);
  if (!start) return "--";
  const end = (status === "Pending" || !updatedOn || updatedOn === "--")
    ? new Date()
    : parseDateStr(updatedOn) ?? new Date();
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "--";
  if (days === 0) return "Today";
  return `${days} day${days !== 1 ? "s" : ""}`;
}

function ClaimRefreshIcon({ onRefresh, refreshing }: { onRefresh?: () => void; refreshing?: boolean }) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (refreshing) return;
    onRefresh?.();
  };
  return (
    <Tooltip title="Refresh claim status" placement="top" arrow>
      <Box
        component="span"
        onClick={handleClick}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          cursor: refreshing ? "wait" : "pointer",
          color: "#E65C00",
          "@keyframes spin360": {
            from: { transform: "rotate(0deg)" },
            to: { transform: "rotate(360deg)" },
          },
          "& svg": {
            animation: refreshing ? "spin360 1.2s linear infinite" : "none",
          },
        }}
      >
        <RefreshCw size={13} />
      </Box>
    </Tooltip>
  );
}

const claimNotesTooltipText =
  "The patient notes are crucial for tracking progress and ensuring personalized care. They provide insights into the patient's history, treatment plans, and any changes in their condition.";

interface ClaimItem {
  name: string;
  claimId: string;
  // Raw policy_claim.id (numeric) — distinct from the display claimId string above.
  // Only present for MULTI-flow TPA claims sitting at INTIMATED, so "Submit Claim"
  // can resume-navigate straight into Step 4.
  rawClaimId?: number;
  tpaClaimNo?: string;  // GoodHealth / TPA claim ID — used for live refresh
  requestedOn: string;
  updatedOn: string;
  amount: number;
  settledAmount: number;
  docsLabel: string;
  status: "Settled" | "Rejected" | "Pending" | "Intimated" | "Processing";
}

interface FamilyMember {
  name: string;
  relation: string;
}

interface ClaimSummaryData {
  policyId?: number;
  counts: {
    total: number;
    approved: number;
    pending: number;
  };
  policyType?: string;
  policyNumber: string;
  policyName?: string;
  policyExpiry: string;
  policyFrom?: string;
  policyStartDate?: string | null;
  policyEndDate?: string | null;
  isParentalPolicy?: boolean;
  sumInsured: number;
  available: number;
  claimed: number;
  settled?: number;
  claims: ClaimItem[];
  family: {
    title: string;
    members: FamilyMember[];
  };
  labels?: Partial<{
    pageTitle: string;
    claimStatus: string;
    totalClaims: string;
    approved: string;
    pending: string;
    policyNumber: string;
    policyExpiry: string;
    sumInsured: string;
    available: string;
    claimed: string;
    claimRequested: string;
    claimUpdated: string;
    claimAmount: string;
    settledAmount: string;
    documents: string;
  }>;
  policyTabs?: Array<{ policyType?: string; label?: string }>;
  parental?: ClaimSummaryData;
}

interface ClaimSummaryProps {
  summary:
    | ClaimSummaryData
    | ClaimSummaryData[]
    | {
        policies: any[];
        policyTabs?: Array<{ policyType?: string; label?: string }>;
      };
  hideCoverToggle?: boolean;
  isTitleRequired?: boolean;
  // Needed only to resume-navigate an INTIMATED claim's "Submit Claim" button into
  // Step 4 of /claims-intimation. Omit if this consumer never shows MULTI-flow claims.
  employeeId?: number | string;
  // Manual refresh — Claims Corner has no live polling (its query has no
  // refetchInterval, and window-focus refetch is globally disabled), so a
  // claim moving from "Processing" to "Intimated" in the background
  // (ClaimTpaSubmissionScheduler, every 2 min) never appears on its own;
  // without this the only way to see it was leaving and re-opening the page.
  // Rendered at the top of the claims-card section (StyledStatusBar) —
  // owned by the caller since the underlying query lives in ClaimsCorner.
  onRefresh?: () => void;
  isRefreshing?: boolean;
  labelsOverride?: Partial<{
    pageTitle: string;
    claimStatus: string;
    totalClaims: string;
    approved: string;
    pending: string;
    actionRequired: string;
    policyNumber: string;
    policyExpiry: string;
    sumInsured: string;
    available: string;
    claimed: string;
    settled: string;
    claimRequested: string;
    claimAmount: string;
    settledAmount: string;
    documents: string;
  }>;
}

const POLICY_TYPE_SHORT_MAP: Record<string, string> = {
  "GROUP MEDICLAIM POLICY": "GMC",
  "GROUP PERSONAL ACCIDENT POLICY": "GPA",
  "GROUP TERM LIFE INSURANCE (GTL)": "GTL",
  "GROUP TERM LIFE": "GTL",
  "GROUP MEDICLAIM PARENTAL": "GMP",
  "GROUP MEDICLAIM TOP-UP POLICY": "GMC Top-Up",
};

const toPolicyTypeShort = (policyType?: string) => {
  if (!policyType) return "--";
  const normalized = policyType.trim().toUpperCase();
  return POLICY_TYPE_SHORT_MAP[normalized] ?? "--";
};

// Format a date string to DD-MM-YYYY for GoodHealth TPA API request payload
function fmtGoodHealthDate(dateStr?: string): string {
  if (!dateStr || dateStr === "--") return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

// Parse GoodHealth response dates like "2024-9-20.12.53. 56. 442000000" → "20/09/2024"
function parseGoodHealthDate(dateStr?: string): string {
  if (!dateStr || dateStr === "--") return "--";
  // GoodHealth format: YYYY-M-D.HH.MM. SS. nnnnnnnnn  — extract YYYY-M-D
  const match = String(dateStr).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }
  // Fallback for ISO / standard formats
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }
  return "--";
}

function mapGoodHealthStatus(s?: string): ClaimItem["status"] {
  const n = (s ?? "").trim().toUpperCase();
  if (n === "SETTLED" || n === "APPROVED") return "Settled";
  if (n === "REJECTED") return "Rejected";
  return "Pending";
}

function ClaimSummary({
  summary,
  hideCoverToggle: _hideCoverToggle = false,
  isTitleRequired = true,
  labelsOverride,
  employeeId,
  onRefresh,
  isRefreshing,
}: ClaimSummaryProps) {
  const navigate = useNavigate();
  const { localizationData } = useLocalization();
  const [showAllClaims, setShowAllClaims] = React.useState<boolean[]>([]);
  // Per-claimId overrides from live refresh: loading flag + updated fields
  const [refreshedClaims, setRefreshedClaims] = useState<Record<string, Partial<ClaimItem> & { loading?: boolean }>>({});
  const { mutate: fetchClaimStatus } = useApiMutation({});
  const { mutate: storeClaimStatus } = useApiMutation({});
  // Cache resolved appKey per policyId to avoid repeat API calls
  const policyAppKeyCache = useRef<Record<string, { appKey: string; dynamicFields: Record<string, string> } | null>>({});

  const summaries = React.useMemo(() => {
    const toDate = (val?: string | null) => {
      if (!val || val === "--") return "--";
      const formatted = formatDate(val, DATE_FORMATS.DATE_MONTH_YEAR);
      return formatted && formatted !== "Invalid Date" ? formatted : "--";
    };

    const mapCounts = (counts?: any) => ({
      total: counts?.total ?? 0,
      approved: counts?.approved ?? counts?.settled ?? 0,
      pending: counts?.pending ?? counts?.inProgress ?? 0,
    });

    const mapStatus = (status?: string | null): ClaimItem["status"] => {
      const normalized = status
        ?.toString()
        .trim()
        .replace(/[\s\-_]+/g, "")
        .toUpperCase();

      switch (normalized) {
        case "SETTLED":
        case "APPROVED":
          return "Settled";
        case "REJECTED":
          return "Rejected";
        case "INTIMATED":
          return "Intimated";
        // "CLAIM INTIMATION" — the claim has been received by us and is being
        // delivered to the TPA in the background (see claim_tpa_submission_job).
        // Deliberately its OWN label, distinct from both "Intimated" (the TPA
        // has genuinely confirmed it) and generic "Pending" (used elsewhere for
        // a TPA-confirmed claim awaiting processing) — reusing either one made
        // it impossible to tell, from the claims list alone, which cards were
        // actually confirmed vs still in flight (or stuck/failed) in the
        // background. The "Submit Claim" button is unaffected — it already
        // requires status === "Intimated" AND tpaClaimNo, so it never showed
        // for this interim state either way.
        case "CLAIMINTIMATION":
          return "Processing";
        default:
          return "Pending";
      }
    };

    const mapClaims = (claims?: any[]) =>
      (claims || []).map((c) => {
        if (c.name && c.claimId) {
          return {
            name: c.name,
            claimId: c.claimId,
            tpaClaimNo: c.tpaClaimNo ?? c.tpa_claim_no ?? c.claimId,
            requestedOn: c.requestedOn ?? toDate(c.claimDate),
            updatedOn: c.updatedOn ?? toDate(c.updatedAt) ?? "--",
            amount: c.claimAmount ?? 0,
            settledAmount: c.claimSettledAmount ?? 0,
            docsLabel: c.docsLabel ?? c.documentsLabel ?? "No documents",
            status: mapStatus(c.status ?? c.statustype),
          };
        }
        return {
          name: c.relation ? `${c.memberName} (${capitalizeFirst(c.relation)})` : c.memberName,
          claimId: `#${c.claimNumber ?? ""}`,
          // Raw policy_claim.id — backend's ClaimSummaryDto.claimId (a number), not to
          // be confused with the display string above.
          rawClaimId: typeof c.claimId === "number" ? c.claimId : undefined,
          // For internally submitted claims, tpa_claim_no is the ISBS CCN (e.g. "1334424")
          tpaClaimNo: c.tpaClaimNo ?? c.tpa_claim_no ?? "",
          requestedOn: toDate(c.claimDate),
          updatedOn: toDate(c.updatedAt) ?? "--",
          amount: c.claimAmount ?? 0,
          settledAmount: c.settledAmount ?? c.claimSettledAmount ?? 0,
          docsLabel: c.documentsLabel ?? "No documents",
          status: mapStatus(c.status),
        };
      });

    const isMappedPolicy = (policy: any): policy is ClaimSummaryData =>
      Boolean(policy?.counts && policy?.claims && policy?.family);

    const mapPolicy = (policy: any): ClaimSummaryData | null => {
      if (!policy) return null;

      if (isMappedPolicy(policy)) {
        return {
          ...policy,
          claims: mapClaims(policy.claims),
          parental: policy.parental
            ? { ...policy.parental, claims: mapClaims(policy.parental.claims) }
            : undefined,
        };
      }

      const base = policy.basePolicy || policy;
      const baseCoverage = base.coverage || policy.coverage || {};
      const baseCounts = base.claimsStatusCounts || policy.claimsStatusCounts;

      const sumFromCoverage = (coverage: any) =>
        coverage?.sumInsured ??
        (coverage?.available ?? 0) +
          (coverage?.claimed ?? 0) +
          (coverage?.settled ?? 0);

      const baseData: ClaimSummaryData = {
        policyId: policy.policyId ?? base.policyId,
        counts: mapCounts(baseCounts),
        policyType: policy.policyType ?? base.policyType,
        policyName: policy.policyName ?? policy.policyType ?? "--",
        policyNumber: policy.policyNumber ?? "--",
        policyExpiry: toDate(policy.policyExpiry ?? base.policyExpiry),
        policyFrom: policy.policyFrom ?? policy.policyStartDate ?? base.policyFrom ?? null,
        policyStartDate: policy.policyStartDate ?? null,
        policyEndDate: policy.policyEndDate ?? null,
        sumInsured: sumFromCoverage(baseCoverage),
        available: baseCoverage?.available ?? 0,
        claimed: baseCoverage?.claimed ?? 0,
        settled: baseCoverage?.settled ?? 0,
        claims: mapClaims(base.claims || policy.claims),
        // family: {
        //   title: "Family Members Covered",
        //   members:
        //     base.familyMembersCovered ??
        //     policy.familyMembersCovered ??
        //     ([] as FamilyMember[]),
        // },
        labels: {
          pageTitle: "Claim summary",
          claimStatus: "Claim Status",
          totalClaims: "Total Claims",
          approved: "Settled",
          pending: "Pending",
          policyNumber: "Policy Number",
          policyExpiry: "Policy Expiry",
          sumInsured: "Sum Insured",
          available: "Available",
          claimed: "Claimed",
          settled: "Settled",
          claimRequested: "Claim Requested",
          claimUpdated: "Last Updated At",
          claimAmount: "Claim amount",
          settledAmount: "Settled amount",
          documents: "Documents",
        },
      };

      if (policy.parentalPolicy) {
        const parentalCoverage = policy.parentalPolicy.coverage || {};
        const parentalCounts = policy.parentalPolicy.claimsStatusCounts || {};
        baseData.parental = {
          counts: mapCounts(parentalCounts),
          policyType: toPolicyTypeShort(
            policy.parentalPolicy.policyType ??
              policy.policyType ??
              baseData.policyType,
          ),
          policyNumber: policy.policyNumber ?? policy.policyName ?? "--",
          policyExpiry: toDate(policy.policyExpiry),
          sumInsured: sumFromCoverage(parentalCoverage),
          available: parentalCoverage.available ?? 0,
          claimed: parentalCoverage.claimed ?? 0,
          settled: parentalCoverage.settled ?? 0,
          claims: mapClaims(policy.parentalPolicy.claims),
          family: {
            title: "Family Members Covered",
            members: policy.parentalPolicy.familyMembersCovered ?? [],
          },
          labels: baseData.labels,
        };
      }
      return baseData;
    };

    if (Array.isArray(summary)) {
      return summary;
    }
    if ((summary as any)?.policies) {
      return ((summary as any).policies || [])
        .map(mapPolicy)
        .filter(Boolean) as ClaimSummaryData[];
    }
    return summary ? [summary as ClaimSummaryData] : [];
  }, [summary]);

  if (!summaries.length) {
    return null;
  }

  const formatCurrency = (amount: number) =>
    `${formatAmountWithCurrency(amount || 0, localizationData?.data)}`;

  const defaultLabels = {
    pageTitle: "Claim summary",
    claimStatus: "Status",
    totalClaims: "Total Claims",
    approved: "Approved Amount",
    pending: "Pending",
    policyNumber: "Policy Number",
    policyExpiry: "Policy Expiry",
    sumInsured: "Sum Insured",
    available: "Available",
    claimed: "Claimed",
    settled: "Approved Amount",
    claimRequested: "Claim Requested",
    claimUpdated: "Last Updated At",
    claimAmount: "Claim amount",
    settledAmount: "Approved amount",
    documents: "Documents",
    policyType: "Policy type"
  };

  const mergedDefaults = React.useMemo(
    () => ({
      ...defaultLabels,
      ...(labelsOverride || {}),
    }),
    [labelsOverride],
  );

  const headerLabels = React.useMemo(
    () => ({
      ...(summaries[0]?.labels || {}),
      ...mergedDefaults,
    }),
    [summaries, mergedDefaults],
  );

  const displaySummaries = React.useMemo(() => {
    return summaries.flatMap((policy) => {
      const baseEntry = {
        ...policy,
        coverageType: "base" as const,
        parentPolicyNumber: policy.policyNumber,
      };
      if (policy.parental) {
        const parentalEntry = {
          ...policy.parental,
          coverageType: "parental" as const,
          parentPolicyNumber: policy.policyNumber,
          policyNumber: policy.policyNumber,
          policyExpiry: policy.parental.policyExpiry ?? policy.policyExpiry,
          labels: policy.parental.labels ?? policy.labels,
        };
        return [baseEntry, parentalEntry];
      }
      return [baseEntry];
    });
  }, [summaries]);

  React.useEffect(() => {
    setShowAllClaims(displaySummaries.map(() => false));
  }, [displaySummaries]);

  // Filter out policy blocks that have no claims
  const displaySummariesWithClaims = React.useMemo(
    () => displaySummaries.filter((policy) => (policy.claims || []).length > 0),
    [displaySummaries],
  );



  const handleClaimRefresh = async (
    claimId: string,
    policyNumber: string,
    policyStartDate?: string | null,
    policyEndDate?: string | null,
    tpaClaimNo?: string,
    policyId?: number,
  ) => {
    const rawId = (tpaClaimNo && tpaClaimNo.trim()) ? tpaClaimNo.trim() : claimId.replace(/^#/, "");
    if (!rawId) return;
    setRefreshedClaims((prev) => ({ ...prev, [claimId]: { ...prev[claimId], loading: true } }));

    // Resolve appKey dynamically from backend; cache per policyId
    let appKey = "goodhealth-claim-status"; // fallback
    if (policyId != null) {
      const cacheKey = String(policyId);
      let cached = policyAppKeyCache.current[cacheKey];
      if (cached === undefined) {
        try {
          const keyRes = await apiRequest(endPoints.policyTpaAppKey(policyId, "FETCH_CLAIM_STATUS"), { method: "GET" });
          cached = keyRes?.data ?? null;
        } catch {
          cached = null;
        }
        policyAppKeyCache.current[cacheKey] = cached;
      }
      if (cached?.appKey) appKey = cached.appKey;
    }

    fetchClaimStatus(
      {
        endpoint: endPoints.eCardExternalUrl,
        method: "POST",
        data: {
          appKey,
          userEmail: "",
          dynamicFields: {
            policyNo:        policyNumber,
            policyStartDate: policyStartDate ?? "",
            policyEndDate:   policyEndDate   ?? "",
            claimId:         rawId,
          },
        },
      },
      {
        onSuccess: (res: any) => {
          const raw = res?.data;
          const claimData = Array.isArray(raw) ? raw[0] : (raw?.data ? (Array.isArray(raw.data) ? raw.data[0] : raw.data) : raw);
          if (claimData && !claimData.errorMsg) {
            setRefreshedClaims((prev) => ({
              ...prev,
              [claimId]: {
                loading:       false,
                status:        mapGoodHealthStatus(claimData.claimStatus),
                amount:        claimData.claimAmount    != null ? Number(claimData.claimAmount)    : prev[claimId]?.amount,
                settledAmount: claimData.approvedAmount != null ? Number(claimData.approvedAmount) : prev[claimId]?.settledAmount,
                updatedOn:     parseGoodHealthDate(claimData.settledDate ?? claimData.approvedDate),
                requestedOn:   parseGoodHealthDate(claimData.claimRegDate ?? claimData.preAuthRequestDate),
              },
            }));

            // Persist refreshed data to tpa_claim_data + policy_claim via existing individual store endpoint
            storeClaimStatus({
              endpoint: endPoints.tpaClaimIndividualStore,
              method: "POST",
              data: {
                policyNumber,
                tpaClaimNo: rawId,
                claim: {
                  ...claimData,
                  // Map GoodHealth field names to what storeIndividualClaim expects for policy_claim update
                  STATUS:              claimData.claimStatus,
                  HOSPITAL_NAME:       claimData.hospitalName,
                  PAID_AMOUNT:         claimData.chequeAmount ?? claimData.approvedAmount,
                  DATE_OF_SETTLEMENT:  claimData.settledDate ?? claimData.neftDate,
                },
              },
            });
          } else {
            setRefreshedClaims((prev) => ({ ...prev, [claimId]: { ...prev[claimId], loading: false } }));
          }
        },
        onError: () => {
          setRefreshedClaims((prev) => ({ ...prev, [claimId]: { ...prev[claimId], loading: false } }));
        },
      },
    );
  };

  const renderPolicyBlock = (
    policy: ClaimSummaryData & {
      coverageType?: "base" | "parental";
      parentPolicyNumber?: string;
    },
    index: number,
  ) => {
    // Skip rendering if this policy block has no claims
    if (!policy.claims || policy.claims.length === 0) return null;

    const isShowingAllClaims = showAllClaims[index];
    const policyTypeShort = toPolicyTypeShort(policy.policyType);
    const policyTypeFull = (policy as any).policyName ?? policy.policyType ?? "--";
    const policyNumberOnly = policy.policyNumber || policy.parentPolicyNumber || "--";

    const labels = { ...policy.labels, ...mergedDefaults };

    const totalAvailable = policy.available ?? 0;
    const totalClaimed = policy.claimed ?? 0;
    const totalSettled = policy.settled ?? 0;
    const baseTotal = totalAvailable + totalClaimed + totalSettled;
    const usedRatio =
      baseTotal > 0 ? (totalClaimed + totalSettled) / baseTotal : 0;
    const settledRatio = baseTotal > 0 ? totalSettled / baseTotal : 0;
    const gauge = {
      series: [
        {
          type: "gauge",
          startAngle: 5,
          endAngle: -350,
          min: 0,
          max: 100,
          radius: "100%",
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 6,
              color: [
                [
                  1,
                  new echarts.graphic.LinearGradient(0, 0, 0.98, 1, [
                    { offset: 0, color: "#FFF765" },
                    { offset: 1, color: "#E4C40E" },
                  ]),
                ],
              ],
            },
          },
          pointer: { show: false },
          progress: {
            show: true,
            overlap: true,
            width: 6,
            roundCap: true,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0.98, 1, [
                { offset: 0, color: "#88DB8B" },
                { offset: 1, color: "#27A62C" },
              ]),
            },
          },
          detail: { show: false },
          splitLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          data: [{ value: Math.min(Math.max(usedRatio * 100, 0), 100) }],
        },
        {
          type: "gauge",
          startAngle: 5,
          endAngle: -350,
          min: 0,
          max: 100,
          radius: "100%",
          axisLine: { show: false },
          pointer: { show: false },
          progress: {
            show: true,
            overlap: true,
            width: 6,
            roundCap: true,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0.98, 1, [
                { offset: 0, color: "#FFAE65" },
                { offset: 1, color: "#E4520E" },
              ]),
            },
          },
          detail: { show: false },
          splitLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          data: [{ value: Math.min(Math.max(settledRatio * 100, 0), 100) }],
        },
      ],
      animation: true,
    };

    return (
      <React.Fragment>
        <StyledPolicySection>
          <StyledPolicyInfo>
            <StyledPolicyItem>
              <StyledPolicyLabel>{labels.policyType}</StyledPolicyLabel>
              <StyledPolicyNumber>{policyTypeShort}</StyledPolicyNumber>
            </StyledPolicyItem>
            <StyledPolicyItem>
              <StyledPolicyLabel>{labels.policyNumber}</StyledPolicyLabel>
              <StyledPolicyNumber>{policyNumberOnly}</StyledPolicyNumber>
            </StyledPolicyItem>

            <StyledPolicyItem>
              <StyledPolicyLabel>{labels.policyExpiry}</StyledPolicyLabel>
              <StyledPolicyNumber>
                {(policy.policyExpiry)}
              </StyledPolicyNumber>
            </StyledPolicyItem>

            <StyledPolicyItem>
              <StyledPolicyLabel>{labels.sumInsured}</StyledPolicyLabel>
              <StyledPolicyNumber>
                {formatCurrency(policy.sumInsured)}
              </StyledPolicyNumber>
            </StyledPolicyItem>
          </StyledPolicyInfo>

          <StyledAmountSection>
            <StyledDividerLine indicatorcolor="#Df8447" />
            {/* <StyledGaugeContainer>
              <ReactECharts
                option={gauge}
                notMerge
                lazyUpdate
                style={{ width: "59px", height: "59px" }}
              />
            </StyledGaugeContainer> */}

            <StyledAmountBox>
              <StyledAmountIndicator indicatorcolor="#187FE3" />
              <StyledAmountContent>
                <StyledAmountLabel>{labels.available}</StyledAmountLabel>
                <StyledAmount>{formatCurrency(policy.available)}</StyledAmount>
              </StyledAmountContent>
            </StyledAmountBox>

            <StyledAmountBox>
              <StyledAmountIndicator indicatorcolor="#187FE3" />
              <StyledAmountContent>
                <StyledAmountLabel>{labels.claimed}</StyledAmountLabel>
                <StyledAmount>{formatCurrency(policy.claimed)}</StyledAmount>
              </StyledAmountContent>
            </StyledAmountBox>

            <StyledAmountBox>
              <StyledAmountIndicator indicatorcolor="#187FE3" />
              <StyledAmountContent>
                <StyledAmountLabel>{labels.settled}</StyledAmountLabel>
                <StyledAmount>{formatCurrency(totalSettled)}</StyledAmount>
              </StyledAmountContent>
            </StyledAmountBox>
          </StyledAmountSection>
        </StyledPolicySection>

        {/* <PolicyMetaRow> */}
        <StyledStatusBar>
          {policy.coverageType &&
            policyTypeShort === "GMC" &&
            policy.isParentalPolicy !== false && (
              <StyledPolicyTypeTitle>
                <PolicyTypeImage src={policyType} alt="policyType" />
                <StyledStatusBarTitle variant={policy.coverageType}>
                  {policy.coverageType === "parental"
                    ? "Parental policy"
                    : "Base policy"}
                </StyledStatusBarTitle>
                <span>|</span>
              </StyledPolicyTypeTitle>
            )}
          <StyledStatusBarTitle>{labels.claimStatus}</StyledStatusBarTitle>
          <StyledStatusBarValue>
            {String(policy.counts.total).padStart(2, "0")} {labels.totalClaims}
          </StyledStatusBarValue>
          <span>|</span>
          <StyledStatusBarValue>
            {String(policy.counts.approved).padStart(2, "0")} {labels.approved}
          </StyledStatusBarValue>
          <span>|</span>
          <StyledStatusBarValue>
            {String(policy.counts.pending).padStart(2, "0")} {labels.pending}
          </StyledStatusBarValue>
          {onRefresh && (
            <Tooltip title="Refresh claims" placement="top" arrow>
              <Box
                component="span"
                onClick={() => {
                  if (isRefreshing) return;
                  onRefresh();
                }}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  marginLeft: "auto",
                  cursor: isRefreshing ? "wait" : "pointer",
                  color: "#1565c0",
                  fontSize: 14,
                  fontWeight: 500,
                  "@keyframes spin360": {
                    from: { transform: "rotate(0deg)" },
                    to: { transform: "rotate(360deg)" },
                  },
                  "& svg": {
                    animation: isRefreshing ? "spin360 1.2s linear infinite" : "none",
                  },
                }}
              >
                <RefreshCw size={14} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Box>
            </Tooltip>
          )}
        </StyledStatusBar>

        <BottomContainer>
          <BottomContainerContent hasClaims={true}>
            <>
              {(isShowingAllClaims
                ? policy.claims
                : policy.claims.slice(0, 3)
              ).map((claim, claimIndex) => {
                // Merge live-refreshed data on top of the cached claim
                const live = refreshedClaims[claim.claimId];
                const displayClaim: ClaimItem = { ...claim, ...(live ? { status: live.status ?? claim.status, amount: live.amount ?? claim.amount, settledAmount: live.settledAmount ?? claim.settledAmount, requestedOn: live.requestedOn ?? claim.requestedOn, updatedOn: live.updatedOn ?? claim.updatedOn } : {}) };
                return (
                <StyledClaimItem
                  key={`${claim.claimId}-${claimIndex}`}
                  data-testid="ibp-claim-summary-claim-item"
                >
                  <StyledClaimHeader>
                    <StyledClaimLeft>
                      <StyledClaimIcon>
                        <img src={claimsDocIcon} alt="" />
                      </StyledClaimIcon>
                      <StyledClaimInfo sx={{ minWidth: "170px" }}>
                        <StyledClaimId>{displayClaim.claimId}</StyledClaimId>
                        <Tooltip title={displayClaim.name} placement="top" arrow disableHoverListener={displayClaim.name.length <= 22}>
                          <StyledClaimName>{displayClaim.name}</StyledClaimName>
                        </Tooltip>
                      </StyledClaimInfo>
                    </StyledClaimLeft>

                    <StyledClaimStatusDetail statustype={displayClaim.status}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, width: "100%" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <StyledClaimLabel>{labels.claimStatus}:</StyledClaimLabel>
                          <StyledClaimLabelWithStatus statustype={displayClaim.status}>
                            {displayClaim.status}
                          </StyledClaimLabelWithStatus>
                          {displayClaim.status === "Pending" && (
                            <ClaimRefreshIcon
                              refreshing={!!live?.loading}
                              onRefresh={() => handleClaimRefresh(claim.claimId, policy.policyNumber, policy.policyStartDate, policy.policyEndDate, claim.tpaClaimNo, policy.policyId)}
                            />
                          )}
                        </Box>
                        {/* MULTI-flow TPA claim (FHPL, Health India) intimated but not yet
                            submitted — resume straight into Step 4 (bills/bank details) of
                            the same stepper, right from this card, instead of a separate
                            "Continue Submission" section elsewhere on the page. */}
                        
                      </Box>
                    </StyledClaimStatusDetail>

                    {/* Gated on tpaClaimNo, not just the "Intimated" label — the label now
                        also covers the interim CLAIM INTIMATION state (delivery still in
                        progress, see mapStatus above), but tpaClaimNo is only ever set once
                        the TPA has genuinely accepted the claim (ClaimTpaSubmissionScheduler's
                        job succeeded). Prevents "Submit Claim" from appearing before the TPA
                        has actually confirmed the intimation. */}
                    {displayClaim.status === "Intimated" && displayClaim.rawClaimId && displayClaim.tpaClaimNo && (
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ textTransform: "none", fontWeight: 400, borderRadius: "8px", flexShrink: 0, cursor:"pointer" }}
                            onClick={() =>
                              navigate("/claims-intimation", {
                                state: {
                                  resumeClaimId: displayClaim.rawClaimId,
                                  resumeEmployeeId: employeeId,
                                  resumePolicyId: policy.policyId,
                                },
                              })
                            }
                          >
                            Submit Claim
                          </Button>
                        )}
                  </StyledClaimHeader>

                  <StyledClaimDetails>
                    <StyledClaimDetail sx={{ minWidth: "170px" }}>
                      <StyledClaimLabel>
                        {labels.claimRequested}
                      </StyledClaimLabel>
                      <StyledClaimValue>{displayClaim.requestedOn}</StyledClaimValue>
                    </StyledClaimDetail>

                    <StyledClaimDetail sx={{ minWidth: "160px" }}>
                      <StyledClaimLabel>{labels.claimAmount}</StyledClaimLabel>
                      <StyledClaimValue>
                        {formatCurrency(displayClaim.amount)}
                      </StyledClaimValue>
                    </StyledClaimDetail>

                    <StyledClaimDetail sx={{ minWidth: "180px" }}>
                      <StyledClaimLabel>
                        {labels.settledAmount}
                      </StyledClaimLabel>
                      <StyledClaimValue>
                        {formatCurrency(displayClaim.settledAmount)}
                      </StyledClaimValue>
                    </StyledClaimDetail>

                    <StyledClaimDetail>
                      <StyledClaimLabel>
                        {labels.claimUpdated}
                      </StyledClaimLabel>
                      <StyledClaimValue>{displayClaim.updatedOn || "--"}</StyledClaimValue>
                    </StyledClaimDetail>

                    <StyledClaimDetail>
                      <StyledClaimLabel>TAT</StyledClaimLabel>
                      <StyledClaimValue>
                        {computeTAT(claim.requestedOn, claim.updatedOn, claim.status)}
                      </StyledClaimValue>
                    </StyledClaimDetail>

                    {/* <StyledClaimLabelDetail>
                      <Tooltip title={claimNotesTooltipText} arrow placement="top">
                        <StyledClaimLabelText>
                          The patient notes are crucial for tracking progress and
                          ensuring personalized care. They provide insights into
                          the patient's history, treatment plans, and any changes
                          in their condition.
                        </StyledClaimLabelText>
                      </Tooltip>
                    </StyledClaimLabelDetail> */}
                  </StyledClaimDetails>
                </StyledClaimItem>
                );
              })}

              {policy.claims.length > 3 && (
                <ShowMoreButton
                  type="button"
                  onClick={() =>
                    setShowAllClaims((prev) => {
                      const next = [...prev];
                      next[index] = !prev[index];
                      return next;
                    })
                  }
                >
                  {isShowingAllClaims
                    ? "Show less"
                    : `+${policy.claims.length - 3} more`}
                </ShowMoreButton>
              )}
            </>
          </BottomContainerContent>
        </BottomContainer>
      </React.Fragment>
    );
  };

  // If no policy blocks have any claims, show NoDataPage
  if (displaySummariesWithClaims.length === 0) {
    return (
      <NoDataPage
        title="No claims found"
        subtitle="You and your family haven't made any claims yet. Glad to know everyone is doing well! Your claim history will appear here once a claim is submitted."
        showFlyingBirds={true}
        showDivider={true}
        compactView={true}
      />
    );
  }

  return (
    <StyledContainer>
      {isTitleRequired && <StyledHeader>{headerLabels.pageTitle}</StyledHeader>}

      <StyledCard data-testid="ibp-claim-summary-card">
        {displaySummariesWithClaims.map((policy, idx) => (
          <React.Fragment
            key={`${policy.policyNumber}-${idx}-${policy.coverageType}`}
          >
            {renderPolicyBlock(policy, idx)}
            {idx < displaySummariesWithClaims.length - 1 && <PolicySeparator />}
          </React.Fragment>
        ))}
      </StyledCard>
    </StyledContainer>
  );
}

export default ClaimSummary;
