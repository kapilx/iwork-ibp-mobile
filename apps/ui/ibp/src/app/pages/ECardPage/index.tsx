import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import { Box, CircularProgress, InputBase, MenuItem, Tooltip, Typography } from "@mui/material";
import { ShieldCheck } from "lucide-react";
import { DocumentPreview, endPoints, useApiQuery } from "@ui/ui-lib";
import CustomTabs from "@ui/ui-lib/commonComponents/CustomTabs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { capitalizeFirst } from "../../utils";
import NoDataPage from "../../common/NoData";
import {
  ECARD_SUPPORT_LABEL_TEXT,
  ECARD_SUPPORT_LINK_TEXT,
  ECARD_SUPPORT_TEXT,
} from "../../constants";
import {
  BackArrowButton,
  CardTypeLabel,
  CenteredState,
  DocumentPreviewWrapper,
  MemberInfo,
  MemberItem,
  MemberList,
  MemberName,
  MemberPanel,
  MemberDownloadButton,
  MemberRadio,
  MemberRelationRow,
  MemberRelationTag,
  MemberTpaId,
  MobileSelectorRow,
  MobileSelectorsPanel,
  PageWrapper,
  PlaceholderContainer,
  PolicySelect,
  PolicySelectorLabel,
  PreviewBody,
  PreviewCard,
  PreviewHeader,
  PreviewPanel,
  PreviewTitle,
  PreviewTitleEcards,
  PreviewTitleGroup,
} from "./styles";

const ECardPage = () => {
  const navigate = useNavigate();
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeId = userDetails?.id;
  const hasLoggedEcardView = useRef(false);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedPolicyKey, setSelectedPolicyKey] = useState<string>("");
  const [pdfUrls, setPdfUrls] = useState<Record<string, string | "unavailable">>({});
  // Raw bytes for proxied/base64 PDFs, keyed the same as pdfUrls — handed to DocumentPreview
  // via previewData so pdf.js loads from memory instead of fetching a blob: URL itself, which
  // can fail in some dev-server setups even though the same blob downloads fine directly.
  const [pdfBytes, setPdfBytes] = useState<Record<string, Uint8Array>>({});
  const [loadingTpaId, setLoadingTpaId] = useState<string | null>(null);
  const [downloadingTpaIds, setDownloadingTpaIds] = useState<Set<string>>(new Set());
  // Cache: policyId → { appKey, dynamicFields } from backend lookup
  const policyAppKeyCache = useRef<Record<string, { appKey: string; dynamicFields: Record<string, string>; ecardResponseMode: string | null } | null>>({});
  // FAMILY_ONLY TPAs (e.g. FHPL) return the identical family card regardless of which member
  // triggered the fetch — cached per policyId so switching between family members never
  // re-hits the TPA's API after the first fetch.
  const familyCardCache = useRef<Record<string, { bytes?: Uint8Array; url?: string }>>({});
  const fallbackECardRef = useRef<HTMLDivElement | null>(null);
  const [downloadingFallback, setDownloadingFallback] = useState(false);

  const { data: eCards, isLoading } = useApiQuery({
    queryKey: ["eCardsContent", employeeId],
    url: employeeId ? endPoints.eCards(employeeId) : "",
    enabled: Boolean(employeeId),
  });

  const { data: employeeDetailsData, isLoading: isDetailsLoading } = useApiQuery({
    queryKey: ["employeeDetailsForECard", employeeId],
    url: employeeId ? endPoints.employeeDetails : "",
    enabled: Boolean(employeeId),
  });

  const { data: employeePoliciesData, isLoading: isPoliciesLoading } = useApiQuery({
    queryKey: ["employeePoliciesForECard", employeeId],
    url: employeeId ? endPoints.employeePolicies(employeeId) : "",
    enabled: Boolean(employeeId),
  });

  const { isEnrollmentCompleted, isEnrollmentWindowOpen } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkPolicies = (policies: any[]) => {
      const hasOpenIncompleteWindow = policies.some((policy: any) => {
        const endDate = policy?.enrollmentEndDate ? new Date(policy.enrollmentEndDate) : null;
        if (!endDate || isNaN(endDate.getTime())) return false;
        const isWindowOpen = today <= endDate;
        const isEnrolled = policy?.employeeEnrollmentStatusKey === "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED";
        return isWindowOpen || !isEnrolled;
      });
      return { isEnrollmentCompleted: !hasOpenIncompleteWindow, isEnrollmentWindowOpen: hasOpenIncompleteWindow };
    };

    // Primary source: policies endpoint — has enrollmentEndDate on both employeePolicies + enrolledPolicies
    const policiesPayload =
      (employeePoliciesData as any)?.data?.data ??
      (employeePoliciesData as any)?.data ??
      null;
    const allPolicies: any[] = [
      ...(policiesPayload?.employeePolicies ?? []),
      ...(policiesPayload?.enrolledPolicies ?? []),
    ];
    if (allPolicies.length > 0) return checkPolicies(allPolicies);

    // Fallback: employeeDetails — no dates, status-only
    const detailsPayload =
      (employeeDetailsData as any)?.data?.data ??
      (employeeDetailsData as any)?.data ??
      employeeDetailsData ?? null;
    const statuses: any[] = detailsPayload?.policyEnrollmentStatuses ?? [];
    if (!statuses.length) return { isEnrollmentCompleted: true, isEnrollmentWindowOpen: false };
    const allEnrolled = statuses.every(
      (p: any) => p?.employeeEnrollmentStatusKey === "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED"
    );
    return { isEnrollmentCompleted: allEnrolled, isEnrollmentWindowOpen: false };
  }, [employeePoliciesData, employeeDetailsData]);

  const allRecords = useMemo(() => {
    const records = eCards?.data?.ecarddata;
    return Array.isArray(records) ? records : [];
  }, [eCards]);

  // ── Split all records into current vs expired by policyTo date ───────
  type PolicyEntry = { policyKey: string; policyNumber: string; policyName: string; records: any[] };

  // Display order for the policy list: GMC, then GPA, then GTL — the same
  // ordering the dashboard summary and the enrollment calculator use, matching
  // their normalizePolicyTypeKey. MEDICAL is matched too, since
  // POLICY_NAME_MAPPING ships "Group Medical Cover" as the GMC display name.
  const POLICY_TYPE_ORDER: Record<string, number> = { GMC: 1, GPA: 2, GTL: 3 };

  const normalizePolicyTypeKey = (value?: string | null): string => {
    const raw = String(value ?? "").trim().toUpperCase();
    if (!raw) return "";
    // Match the family code as a whole underscore-delimited segment rather than
    // by exact suffix: real keys like "POLICY_TYPE_GMC_PARENTAL" and
    // "POLICY_TYPE_GMC_TOP-UP" carry more after it, so endsWith("_GMC") misses them.
    const segments = raw.split("_");
    if (raw === "GMC" || raw.endsWith("_GMC") || segments.includes("GMC")) return "GMC";
    if (raw === "GPA" || raw.endsWith("_GPA") || segments.includes("GPA")) return "GPA";
    if (raw === "GTL" || raw.endsWith("_GTL") || segments.includes("GTL")) return "GTL";
    if (raw.includes("MEDICLAIM") || raw.includes("MEDICAL") || raw.includes("HEALTH")) return "GMC";
    if (raw.includes("ACCIDENT") || raw.includes("PERSONAL")) return "GPA";
    if (raw.includes("TERM") || raw.includes("LIFE")) return "GTL";
    return raw;
  };

  // E-card records may carry no policyTypeKey, so name and number are tried as
  // fallbacks. Anything unclassifiable sorts last, keeping its original order.
  const rankPolicyEntry = (entry: PolicyEntry) => {
    const sources = [entry.records[0]?.policyTypeKey, entry.policyName, entry.policyNumber];
    for (const source of sources) {
      const rank = POLICY_TYPE_ORDER[normalizePolicyTypeKey(source)];
      if (rank) return rank;
    }
    return 999;
  };

  const buildPoliciesMap = (records: any[]) => {
    const map = new Map<string, PolicyEntry>();
    records.forEach((record: any) => {
      const key = String(record.policyId ?? record.policyNumber ?? "default");
      if (!map.has(key)) {
        map.set(key, {
          policyKey: key,
          policyNumber: record.policyNumber || record.insurerPolicyNumber || key,
          policyName: record.policyName || record.companyName || "",
          records: [],
        });
      }
      map.get(key)!.records.push(record);
    });
    // Rebuild in type order — Map preserves insertion order, and every consumer
    // (policyKeys, the sidebar list, the mobile selector) reads from this map.
    return new Map(
      Array.from(map.values())
        .sort((a, b) => rankPolicyEntry(a) - rankPolicyEntry(b))
        .map((entry) => [entry.policyKey, entry] as const),
    );
  };

  const { currentPoliciesMap, expiredPoliciesMap } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const current: any[] = [];
    const expired: any[] = [];
    allRecords.forEach((record: any) => {
      const policyTo = record.policyTo ?? record.policyEndDate ?? null;
      const isExpired = policyTo && new Date(policyTo) < now;
      (isExpired ? expired : current).push(record);
    });
    return { currentPoliciesMap: buildPoliciesMap(current), expiredPoliciesMap: buildPoliciesMap(expired) };
  }, [allRecords]);

  const [activeTab, setActiveTab] = useState<"current" | "expired">("current");

  // Active map switches based on selected tab
  const policiesMap = activeTab === "current" ? currentPoliciesMap : expiredPoliciesMap;

  const policyKeys = useMemo(() => Array.from(policiesMap.keys()), [policiesMap]);

  const [sidebarSearch, setSidebarSearch] = useState("");

  useEffect(() => { setSidebarSearch(""); }, [activeTab]);

  const filteredPolicyEntries = useMemo(() => {
    const q = sidebarSearch.trim().toLowerCase();
    if (!q) return policyKeys.map((pKey) => ({ pKey, records: policiesMap.get(pKey)!.records }));
    const result: { pKey: string; records: any[] }[] = [];
    for (const pKey of policyKeys) {
      const policy = policiesMap.get(pKey)!;
      const policyMatches =
        policy.policyNumber.toLowerCase().includes(q) ||
        policy.policyName.toLowerCase().includes(q);
      const matchingMembers = policy.records.filter((r: any) => (r.name || "").toLowerCase().includes(q));
      if (policyMatches) {
        result.push({ pKey, records: policy.records });
      } else if (matchingMembers.length > 0) {
        result.push({ pKey, records: matchingMembers });
      }
    }
    return result;
  }, [policyKeys, policiesMap, sidebarSearch]);

  // Auto-select first policy on data load or tab switch
  useEffect(() => {
    setSelectedPolicyKey(policyKeys[0] ?? "");
    setSelectedIndex(0);
  }, [policyKeys]);

  const currentPolicy = selectedPolicyKey ? policiesMap.get(selectedPolicyKey) : null;
  const policyRecords = currentPolicy?.records ?? [];

  // Reset member index when policy changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [selectedPolicyKey]);

  const selectedRecord = policyRecords[selectedIndex] ?? null;
  // Cache key must be unique PER FAMILY MEMBER, not per employee — companyEmployeeId identifies
  // the employee and is the SAME value on self and every dependent's record (set explicitly to
  // the parent employee's own id when building the dependents list server-side), so it can't be
  // the primary differentiator or self/dependent previews collide into the same cache slot and
  // the preview never refreshes past whichever member loaded first. tpaId does differ per member
  // when present; relation is appended as a guaranteed tiebreaker even if tpaId is ever missing
  // or coincidentally shared.
  const currentMemberKey = selectedRecord
    ? `${selectedRecord.policyId ?? "x"}_${selectedRecord.tpaId ?? selectedRecord.companyEmployeeId ?? String(selectedIndex)}_${selectedRecord.relation ?? "self"}`
    : null;
  const currentPdfUrl = currentMemberKey && pdfUrls[currentMemberKey] !== "unavailable"
    ? (pdfUrls[currentMemberKey] as string) ?? null
    : null;
  const isCurrentUnavailable = currentMemberKey ? pdfUrls[currentMemberKey] === "unavailable" : false;
  // Treat a not-yet-resolved TPA fetch as loading so we don't flash the fallback card before the PDF arrives.
  const isCurrentLoading = currentMemberKey
    ? loadingTpaId === currentMemberKey || pdfUrls[currentMemberKey] === undefined
    : false;

  const createEcardActivityLog = async (activityKey: "ECARD_VIEWED" | "ECARD_DOWNLOADED", record: any) => {
    if (!record) return;
    try {
      await apiRequest(endPoints.getActivityLogs, {
        method: "POST",
        data: {
          activityKey,
          activityCategory: "DOCUMENT",
          referenceId: record?.companyEmployeeId ?? record?.policyId ?? employeeId,
          referenceType: "E_CARD",
          metadata: {
            documentType: "E_CARD",
            memberName: record?.name || "member",
            relation: record?.relation || "Self",
            policyNumber: record?.policyNumber || "",
            policyName: record?.companyName || "",
            activityText:
              activityKey === "ECARD_VIEWED"
                ? `E-card viewed for ${record?.name || "member"}`
                : `E-card downloaded for ${record?.name || "member"}`,
          },
        },
      });
    } catch (error) {
      console.error("Failed to create %s activity log", activityKey, error);
    }
  };

  useEffect(() => {
    if (!allRecords.length || hasLoggedEcardView.current) return;
    hasLoggedEcardView.current = true;
    void createEcardActivityLog("ECARD_VIEWED", allRecords[0]);
  }, [allRecords]);

  // cacheKey lets each caller control which key pdfBytes gets stored under, matching whatever
  // key that caller already uses for pdfUrls (the auto-load effect and handleDownload key
  // pdfUrls differently — currentMemberKey vs plain tpaId — so this can't be inferred here).
  const fetchEcardForRecord = async (record: any, cacheKey?: string): Promise<string | "unavailable"> => {
    const policyId = record?.policyId;
    const tpaId = record?.tpaId ? String(record.tpaId) : null;

    // Step 1: resolve appKey for this policy (cached per policyId + self-vs-dependent, since
    // two-API e-card TPAs resolve a different appKey for each -- see individualEcardAppRefId
    // on the backend config; a plain policyId key would wrongly reuse whichever member's
    // appKey got resolved first for every other member on the same policy)
    const isDependentMember = !(!record?.relation || String(record.relation).toUpperCase() === "SELF");
    const appKeyCacheKey = `${policyId}_${isDependentMember ? "dep" : "self"}`;
    let appKeyConfig = policyId != null ? policyAppKeyCache.current[appKeyCacheKey] : undefined;
    if (appKeyConfig === undefined && policyId != null) {
      try {
        // Two-API e-card TPAs (e.g. Health India) resolve a different appKey for dependents
        // than for self -- see individualEcardAppRefId on the backend config. Good Health/FHPL
        // ignore this flag (single appKey either way), so it's safe to always pass it.
        const keyRes = await apiRequest(endPoints.policyTpaAppKey(policyId, "ECARD", isDependentMember), { method: "GET" });
        appKeyConfig = keyRes?.data ?? null;
      } catch {
        appKeyConfig = null;
      }
      policyAppKeyCache.current[appKeyCacheKey] = appKeyConfig ?? null;
    }

    // FAMILY_ONLY TPAs (e.g. FHPL) return the exact same family card no matter which member's
    // tpaId/details are sent — re-calling the TPA's API for every family member switch is pure
    // waste. Cache the result per policy and reuse it across every member on that policy.
    if (appKeyConfig?.ecardResponseMode === "FAMILY_ONLY" && policyId != null) {
      const cached = familyCardCache.current[policyId];
      if (cached) {
        console.log("[ECard] FAMILY_ONLY — reusing cached family card, skipping API call for policyId", policyId);
        if (cached.bytes) {
          const key = cacheKey ?? tpaId;
          if (key) setPdfBytes((prev) => ({ ...prev, [key]: cached.bytes! }));
          return URL.createObjectURL(new Blob([cached.bytes], { type: "application/pdf" }));
        }
        return cached.url!;
      }
    }

    // Step 2: build dynamicFields — backend provides policyNo/dates/static overrides,
    // frontend adds all employee-specific fields so the TPA payload template can use any of them.
    const appKey = appKeyConfig?.appKey;
    const dynamicFields: Record<string, string> = {
      ...(appKeyConfig?.dynamicFields ?? {}),  // policyNo, policyStartDate, policyEndDate, groupCode + static overrides
      employeeNumber: record?.companyEmployeeId ?? record?.employeeNumber ?? "",
      memberName: record?.name ?? "",
      relation: record?.relation ?? "",
      dateOfBirth: record?.dateOfBirth ?? record?.dob ?? "",
      gender: record?.gender ?? "",
      ...(tpaId ? { tpaId } : {}),
    };
    console.log("[ECard] dynamicFields being sent to magic-url:", dynamicFields);

    if (!appKey) {
      console.warn("[ECard] No appKey found for policyId", policyId, "— ecard unavailable");
      return "unavailable";
    }

    // Step 3: call magic-url
    const response = await apiRequest(endPoints.eCardExternalUrl, {
      method: "POST",
      data: { appKey, dynamicFields, employeeId: record?.id ?? employeeId, policyId },
    });

    const ecardData = response?.data;
    console.log("[ECard] raw response keys:", Object.keys(ecardData ?? {}));

    // Backend now fetches the file server-side (when a URL was resolved) and includes it here
    // as BASE64_PDF in this same response — one network call, no client-side proxy round-trip.
    // Server-to-server fetch isn't subject to the CORS restriction some TPA file hosts have,
    // which a browser-side fetch (what pdf.js's own loader would otherwise do) runs into.
    // Check this first; it's only absent if the backend's own fetch failed, in which case we
    // fall back to the raw URL below (download still works via direct navigation either way).
    const base64Inline =
      ecardData?.BASE64_PDF ??
      ecardData?.Ecard_Base64String ??
      ecardData?.base64 ??
      ecardData?.Base64 ??
      ecardData?.pdfBase64 ??
      ecardData?.data ??
      null;
    if (typeof base64Inline === "string" && base64Inline) {
      console.log("[ECard] using inline base64 PDF from backend");
      const binary = atob(base64Inline.trim());
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      { const key = cacheKey ?? tpaId; if (key) setPdfBytes((prev) => ({ ...prev, [key]: bytes })); }
      if (appKeyConfig?.ecardResponseMode === "FAMILY_ONLY" && policyId != null) {
        familyCardCache.current[policyId] = { bytes };
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      return URL.createObjectURL(blob);
    }

    const url =
      ecardData?.REDIRECT_URL ??       // our standard key — set via iWork response mapping
      ecardData?.DOWNLOAD_URL ??        // our standard key for direct download URLs
      ecardData?.url ??                 // legacy TPA-specific keys below
      ecardData?.downloadUrl ??
      ecardData?.ecardUrl ??
      ecardData?.EcardUrl ??
      null;
    if (typeof url === "string" && url) {
      console.log("[ECard] resolved URL from key (backend fetch unavailable, using raw URL):", Object.keys(ecardData).find(k => ecardData[k] === url));
      if (appKeyConfig?.ecardResponseMode === "FAMILY_ONLY" && policyId != null) {
        familyCardCache.current[policyId] = { url };
      }
      // Preview may fail for CORS-blocked TPAs since the backend's own fetch didn't succeed
      // here, but the download button (a real navigation, not a fetch) still works either way.
      return url;
    }

    console.warn("[ECard] no usable key found in response:", ecardData);
    return "unavailable";
  };

  useEffect(() => {
    if (!currentMemberKey || pdfUrls[currentMemberKey] !== undefined) return;

    setLoadingTpaId(currentMemberKey);
    fetchEcardForRecord(selectedRecord, currentMemberKey)
      .then((result) => {
        setPdfUrls((prev) => ({ ...prev, [currentMemberKey]: result }));
      })
      .catch(() => {
        setPdfUrls((prev) => ({ ...prev, [currentMemberKey]: "unavailable" }));
      })
      .finally(() => setLoadingTpaId(null));
  }, [currentMemberKey]);

  const triggerBrowserDownload = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `E-Card-${name}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownload = async (e: React.MouseEvent, record: any) => {
    e.stopPropagation();
    const tpaId = record?.tpaId ? String(record.tpaId) : null;
    if (!tpaId) return;

    const name = record.name || "member";
    const existing = pdfUrls[tpaId];

    if (existing && existing !== "unavailable") {
      triggerBrowserDownload(existing, name);
      void createEcardActivityLog("ECARD_DOWNLOADED", record);
      return;
    }

    if (existing === "unavailable") return;

    setDownloadingTpaIds((prev) => new Set(prev).add(tpaId));
    try {
      const result = await fetchEcardForRecord(record);
      setPdfUrls((prev) => ({ ...prev, [tpaId]: result }));
      if (result !== "unavailable") {
        triggerBrowserDownload(result, name);
        void createEcardActivityLog("ECARD_DOWNLOADED", record);
      }
    } catch {
      setPdfUrls((prev) => ({ ...prev, [tpaId]: "unavailable" }));
    } finally {
      setDownloadingTpaIds((prev) => {
        const next = new Set(prev);
        next.delete(tpaId);
        return next;
      });
    }
  };

  const capitalize = (s: string) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

  const isSelf = (relation: string) =>
    !relation || relation.toUpperCase() === "SELF";


  return (
    <PageWrapper>
      <PreviewCard>
        <PreviewHeader>
          <PreviewTitleGroup>
            <BackArrowButton onClick={() => navigate("/")} aria-label="Back to dashboard">
              <ArrowBackIosNewIcon fontSize="small" />
            </BackArrowButton>
            <PreviewTitleEcards onClick={() => navigate("/")}>E-Card</PreviewTitleEcards>
          </PreviewTitleGroup>
        </PreviewHeader>

        {(isDetailsLoading) ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress size={40} sx={{ color: "#093F84" }} />
          </Box>
        ) : !isEnrollmentCompleted ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2, p: 4, textAlign: "center" }}>
            <ShieldCheck size={52} color="#093F84" strokeWidth={1.5} />
            <Typography sx={{ fontSize: 17, fontWeight: 600, color: "#1F2937", mt: 1 }}>
              {isEnrollmentWindowOpen ? "Enrollment Window Not Yet Completed" : "Enrollment Not Completed"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#6B7280", maxWidth: 400, lineHeight: 1.8 }}>
              {isEnrollmentWindowOpen
                ? "Your current policy enrollment window is not yet completed. Once your enrollment is finalized, your E-Cards will be available here."
                : "Your enrollment is not completed. Please contact HR to complete your enrollment and access your E-Cards."}
            </Typography>
          </Box>
        ) : (
        <>
        {/* Wrapper gives CustomTabs the remaining flex height.
            CustomTabsMainContainer has no flex:1 of its own, so we drill in via CSS. */}
        <Box sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          // CustomTabsMainContainer — make it fill the wrapper and become a flex column
          "& > *": {
            flex: "1 !important",
            minHeight: "0 !important",
            paddingTop: "0 !important",
            display: "flex !important",
            flexDirection: "column !important",
            overflow: "hidden !important",
          },
          // Content Box (the div immediately after the MuiTabs bar) — must fill remaining height
          "& .MuiTabs-root + div": {
            flex: "1 !important",
            minHeight: "0 !important",
            overflow: "hidden !important",
            display: "flex !important",
            flexDirection: "column !important",
          },
        }}>
        <CustomTabs
          activeTabKey={activeTab}
          onTabChange={(key) => setActiveTab(key as "current" | "expired")}
          tabs={[
            {
              tabKey: "current",
              label: `Current Policies${currentPoliciesMap.size ? ` (${currentPoliciesMap.size})` : ""}`,
              content: (
                <PreviewBody>
          {(isLoading || allRecords.length > 0) && (
            <MobileSelectorsPanel>
              {policyKeys.length > 0 && (
                <MobileSelectorRow>
                  <PolicySelectorLabel>Policy</PolicySelectorLabel>
                  <PolicySelect
                    value={selectedPolicyKey}
                    onChange={(e) => setSelectedPolicyKey(e.target.value as string)}
                    size="small"
                  >
                    {policyKeys.map((key) => {
                      const p = policiesMap.get(key)!;
                      return (
                        <MenuItem key={key} value={key} sx={{ fontSize: 13 }}>
                          {p.policyNumber}
                          {p.policyName ? ` — ${p.policyName}` : ""}
                        </MenuItem>
                      );
                    })}
                  </PolicySelect>
                </MobileSelectorRow>
              )}
              {policyRecords.length > 0 && (
                <MobileSelectorRow>
                  <PolicySelectorLabel>Member</PolicySelectorLabel>
                  <PolicySelect
                    value={String(selectedIndex)}
                    onChange={(e) => setSelectedIndex(Number(e.target.value))}
                    size="small"
                  >
                    {policyRecords.map((record: any, idx: number) => (
                      <MenuItem key={record.tpaId ?? idx} value={String(idx)} sx={{ fontSize: 13 }}>
                        {record.name || "Member"} — {capitalizeFirst(record.relation || "Self")}
                      </MenuItem>
                    ))}
                  </PolicySelect>
                </MobileSelectorRow>
              )}
            </MobileSelectorsPanel>
          )}

          {(isLoading || allRecords.length > 0) && (
            <MemberPanel>
              {/* Search bar — fixed, does not scroll */}
              <Box sx={{ px: 1.5, py: "10px", borderBottom: "2px solid #E0E0E0", bgcolor: "#FFFFFF", flexShrink: 0 }}>
                <Box sx={{
                  display: "flex", alignItems: "center", gap: "8px",
                  px: "10px", py: "7px",
                  border: "1.5px solid #D1D5DB",
                  borderRadius: "6px",
                  bgcolor: "#F9FAFB",
                  transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
                  "&:focus-within": {
                    borderColor: "#093F84",
                    bgcolor: "#FFFFFF",
                    boxShadow: "0 0 0 3px rgba(9,63,132,0.12)",
                  },
                }}>
                  <SearchIcon sx={{ fontSize: 16, color: "#9CA3AF", flexShrink: 0 }} />
                  <InputBase
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    placeholder="Search policy or member..."
                    sx={{
                      flex: 1, fontSize: 13, color: "#374151",
                      "& .MuiInputBase-input": {
                        padding: 0,
                        "&::placeholder": { color: "#B0B8C4", fontSize: 13, opacity: 1 },
                      },
                    }}
                  />
                  {sidebarSearch && (
                    <Box
                      component="span"
                      onClick={() => setSidebarSearch("")}
                      sx={{ cursor: "pointer", color: "#9CA3AF", fontSize: 14, lineHeight: 1, display: "flex", "&:hover": { color: "#374151" } }}
                    >
                      ✕
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Scrollable member list */}
              <MemberList sx={{ padding: 0 }}>
                {isLoading && policiesMap.size === 0 && (
                  [0, 1, 2].map((i) => (
                    <MemberItem key={`skel-${i}`} selected={false} sx={{ pointerEvents: "none" }}>
                      <MemberRadio selected={false} />
                      <MemberInfo>
                        <div style={{ height: 12, width: "70%", background: "#F0F0F0", borderRadius: 4, marginBottom: 6 }} />
                        <div style={{ height: 10, width: "45%", background: "#F5F5F5", borderRadius: 4 }} />
                      </MemberInfo>
                    </MemberItem>
                  ))
                )}
                {filteredPolicyEntries.length === 0 && sidebarSearch && (
                  <Box sx={{ p: 2.5, textAlign: "center" }}>
                    <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>No results found</Typography>
                  </Box>
                )}
                {filteredPolicyEntries.map(({ pKey, records: filteredRecords }, policyIdx) => {
                  const policy = policiesMap.get(pKey)!;
                  return (
                    <Box key={pKey}>
                      {policyIdx > 0 && (
                        <Box sx={{ height: "2px", background: "#222222",  marginTop: "12px", marginBottom:"12px" }} />
                      )}
                      <Box sx={{
                        px: 1.5, py: "8px",
                        borderBottom: "1px solid #EDF2F7",
                        bgcolor: "#F0F4FA",
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                      }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#093F84", lineHeight: 1.4, letterSpacing: 0.2 }}>
                          {policy.policyNumber}
                        </Typography>
                        {policy.policyName && (
                          <Typography sx={{ fontSize: 10, color: "#6B7280", lineHeight: 1.3, marginTop: "2px" }}>
                            {policy.policyName}
                          </Typography>
                        )}
                      </Box>
                      {filteredRecords.map((record: any, idx: number) => {
                        const isSelected = selectedPolicyKey === pKey && selectedIndex === idx;
                        const tpaId = record?.tpaId ? String(record.tpaId) : null;
                        const isDownloading = tpaId ? downloadingTpaIds.has(tpaId) : false;
                        const isUnavailable = tpaId ? pdfUrls[tpaId] === "unavailable" : false;
                        return (
                          <MemberItem
                            key={record.tpaId ?? idx}
                            selected={isSelected}
                            onClick={() => { setSelectedPolicyKey(pKey); setSelectedIndex(idx); }}
                          >
                            <MemberRadio selected={isSelected} />
                            <MemberInfo>
                              <MemberName selected={isSelected}>
                                {record.name || "Member"}
                              </MemberName>
                              <MemberRelationRow>
                                <MemberRelationTag>
                                  {capitalizeFirst(record.relation || "Self")}
                                </MemberRelationTag>
                                <CardTypeLabel cardtype={isSelf(record.relation) ? "family" : "individual"}>
                                  {isSelf(record.relation) ? "Family Card" : "Individual Card"}
                                </CardTypeLabel>
                              </MemberRelationRow>
                              {record.tpaId && (
                                <MemberTpaId>TPA ID: {record.tpaId}</MemberTpaId>
                              )}
                            </MemberInfo>
                            {tpaId && (
                              <Tooltip
                                title={isUnavailable ? "E-Card not available" : "Download E-Card"}
                                placement="right"
                                arrow
                              >
                                <span>
                                  <MemberDownloadButton
                                    className="ecard-download-btn"
                                    size="small"
                                    disabled={isUnavailable || isDownloading}
                                    onClick={(e) => handleDownload(e, record)}
                                    aria-label={`Download E-Card for ${record.name || "member"}`}
                                  >
                                    {isDownloading ? (
                                      <CircularProgress size={14} sx={{ color: "inherit" }} />
                                    ) : (
                                      <DownloadIcon sx={{ fontSize: 16 }} />
                                    )}
                                  </MemberDownloadButton>
                                </span>
                              </Tooltip>
                            )}
                          </MemberItem>
                        );
                      })}
                    </Box>
                  );
                })}
              </MemberList>
            </MemberPanel>
          )}

          <PreviewPanel>
            {isLoading || isCurrentLoading ? (
              <CenteredState>
                <CircularProgress size={40} sx={{ color: "#093F84" }} />
              </CenteredState>
            ) : currentPdfUrl ? (
              <DocumentPreviewWrapper>
                <DocumentPreview
                  fileUrl={currentPdfUrl}
                  previewData={currentMemberKey ? pdfBytes[currentMemberKey] : undefined}
                  fileName={`E-Card-${selectedRecord?.name || "member"}.pdf`}
                  showFileMeta={false}
                  showDownloadButton={false}
                  previewHeight="100%"
                  previewSurfaceMaxHeight="100%"
                  toolbarPlacement="none"
                />
              </DocumentPreviewWrapper>
            ) : selectedRecord ? (
              <CenteredState>
                <PlaceholderContainer>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 4, textAlign: "center" }}>
                    <ShieldCheck size={52} color="#093F84" strokeWidth={1.5} />
                    <Typography sx={{ fontSize: 17, fontWeight: 600, color: "#1F2937", mt: 1 }}>
                      E-Card Not Available
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "#6B7280", maxWidth: 400, lineHeight: 1.8 }}>
                      The official insurer E-Card for this member is not available yet. Please check again later.
                    </Typography>
                  </Box>
                </PlaceholderContainer>
              </CenteredState>
            ) : (
              <CenteredState>
                <PlaceholderContainer>
                  <NoDataPage
                    compactView={true}
                    showFlyingBirds={false}
                    title={isCurrentUnavailable ? "No E-Card found" : ECARD_SUPPORT_TEXT}
                    subtitle={
                      isCurrentUnavailable
                        ? "Your E-Card is not available yet. Please check again later."
                        : `${ECARD_SUPPORT_LABEL_TEXT} ${ECARD_SUPPORT_LINK_TEXT}`
                    }
                    onBreadcrumbClick={() => navigate(-1)}
                    linkText="contact our support team."
                    linkHref="/support"
                    removeMaxWidth={true}
                  />
                </PlaceholderContainer>
              </CenteredState>
            )}
          </PreviewPanel>
                </PreviewBody>
              ),
            },
            {
              tabKey: "expired",
              label: `Expired Policies${expiredPoliciesMap.size ? ` (${expiredPoliciesMap.size})` : ""}`,
              disabled: expiredPoliciesMap.size === 0,
              content: (
                <PreviewBody>
                  {(isLoading || policiesMap.size > 0) && (
                    <MemberPanel>
                      {/* Search bar — fixed, does not scroll */}
                      <Box sx={{ px: 1.5, py: "10px", borderBottom: "2px solid #E0E0E0", bgcolor: "#FFFFFF", flexShrink: 0 }}>
                        <Box sx={{
                          display: "flex", alignItems: "center", gap: "8px",
                          px: "10px", py: "7px",
                          border: "1.5px solid #D1D5DB",
                          borderRadius: "6px",
                          bgcolor: "#F9FAFB",
                          transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
                          "&:focus-within": {
                            borderColor: "#093F84",
                            bgcolor: "#FFFFFF",
                            boxShadow: "0 0 0 3px rgba(9,63,132,0.12)",
                          },
                        }}>
                          <SearchIcon sx={{ fontSize: 16, color: "#9CA3AF", flexShrink: 0 }} />
                          <InputBase
                            value={sidebarSearch}
                            onChange={(e) => setSidebarSearch(e.target.value)}
                            placeholder="Search policy or member..."
                            sx={{
                              flex: 1, fontSize: 13, color: "#374151",
                              "& .MuiInputBase-input": {
                                padding: 0,
                                "&::placeholder": { color: "#B0B8C4", fontSize: 13, opacity: 1 },
                              },
                            }}
                          />
                          {sidebarSearch && (
                            <Box
                              component="span"
                              onClick={() => setSidebarSearch("")}
                              sx={{ cursor: "pointer", color: "#9CA3AF", fontSize: 14, lineHeight: 1, display: "flex", "&:hover": { color: "#374151" } }}
                            >
                              ✕
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {/* Scrollable member list */}
                      <MemberList sx={{ padding: 0 }}>
                        {filteredPolicyEntries.length === 0 && sidebarSearch && (
                          <Box sx={{ p: 2.5, textAlign: "center" }}>
                            <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>No results found</Typography>
                          </Box>
                        )}
                        {filteredPolicyEntries.map(({ pKey, records: filteredRecords }, policyIdx) => {
                          const policy = policiesMap.get(pKey)!;
                          return (
                            <Box key={pKey}>
                              {policyIdx > 0 && (
                                <Box sx={{ height: "2px", background: "#222222" }} />
                              )}
                              <Box sx={{
                                px: 1.5, py: "8px",
                                borderBottom: "1px solid #EDF2F7",
                                bgcolor: "#F0F4FA",
                                position: "sticky",
                                top: 0,
                                zIndex: 1,
                              }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#093F84", lineHeight: 1.4, letterSpacing: 0.2 }}>
                                  {policy.policyNumber}
                                </Typography>
                                {policy.policyName && (
                                  <Typography sx={{ fontSize: 10, color: "#6B7280", lineHeight: 1.3, marginTop: "2px" }}>
                                    {policy.policyName}
                                  </Typography>
                                )}
                              </Box>
                              {filteredRecords.map((record: any, idx: number) => {
                                const isSelected = selectedPolicyKey === pKey && selectedIndex === idx;
                                const tpaId = record?.tpaId ? String(record.tpaId) : null;
                                const isDownloading = tpaId ? downloadingTpaIds.has(tpaId) : false;
                                const isUnavailable = tpaId ? pdfUrls[tpaId] === "unavailable" : false;
                                return (
                                  <MemberItem
                                    key={record.tpaId ?? idx}
                                    selected={isSelected}
                                    onClick={() => { setSelectedPolicyKey(pKey); setSelectedIndex(idx); }}
                                  >
                                    <MemberRadio selected={isSelected} />
                                    <MemberInfo>
                                      <MemberName selected={isSelected}>{record.name || "Member"}</MemberName>
                                      <MemberRelationRow>
                                        <MemberRelationTag>{capitalizeFirst(record.relation || "Self")}</MemberRelationTag>
                                        <CardTypeLabel cardtype={isSelf(record.relation) ? "family" : "individual"}>
                                          {isSelf(record.relation) ? "Family Card" : "Individual Card"}
                                        </CardTypeLabel>
                                      </MemberRelationRow>
                                      {record.tpaId && <MemberTpaId>TPA ID: {record.tpaId}</MemberTpaId>}
                                    </MemberInfo>
                                    {tpaId && (
                                      <Tooltip title={isUnavailable ? "E-Card not available" : "Download E-Card"} placement="right" arrow>
                                        <span>
                                          <MemberDownloadButton className="ecard-download-btn" size="small" disabled={isUnavailable || isDownloading} onClick={(e) => handleDownload(e, record)} aria-label={`Download E-Card for ${record.name || "member"}`}>
                                            {isDownloading ? <CircularProgress size={14} sx={{ color: "inherit" }} /> : <DownloadIcon sx={{ fontSize: 16 }} />}
                                          </MemberDownloadButton>
                                        </span>
                                      </Tooltip>
                                    )}
                                  </MemberItem>
                                );
                              })}
                            </Box>
                          );
                        })}
                      </MemberList>
                    </MemberPanel>
                  )}

                  <PreviewPanel>
                    {isLoading || isCurrentLoading ? (
                      <CenteredState><CircularProgress size={40} sx={{ color: "#093F84" }} /></CenteredState>
                    ) : currentPdfUrl ? (
                      <DocumentPreviewWrapper>
                        <DocumentPreview fileUrl={currentPdfUrl} previewData={currentMemberKey ? pdfBytes[currentMemberKey] : undefined} fileName={`E-Card-${selectedRecord?.name || "member"}.pdf`} showFileMeta={false} showDownloadButton={false} previewHeight="100%" previewSurfaceMaxHeight="100%" toolbarPlacement="none" />
                      </DocumentPreviewWrapper>
                    ) : (
                      <CenteredState>
                        <PlaceholderContainer>
                          <NoDataPage compactView={true} showFlyingBirds={false} title="No E-Card found" subtitle="E-Cards for expired policies may no longer be available." onBreadcrumbClick={() => navigate(-1)} removeMaxWidth={true} />
                        </PlaceholderContainer>
                      </CenteredState>
                    )}
                  </PreviewPanel>
                </PreviewBody>
              ),
            },
          ]}
        />
        </Box>
        </>
        )}
      </PreviewCard>
    </PageWrapper>
  );
};

export default ECardPage;
