import React, { startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Checkbox,
  CircularProgress,
  ClickAwayListener,
  Dialog,
  DialogContent,
  Divider,
  Button,
  InputBase,
  Menu,
  MenuItem,
  Paper,
  Popper,
  Radio,
  Tooltip,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  Building2,
  ChevronDown,
  CreditCard,
  Download,
  FileText,
  MapPin,
  Search,
  Settings,
  Shield,
  Star,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { LogoutRounded, PersonRounded, SwitchAccountRounded } from "@mui/icons-material";


// REGION_OPTIONS removed — location options are fetched dynamically from API

const MOCK_EMPLOYEES = [
  { id: "EMP001", name: "Anjali Rentala", dept: "Engineering", policy: "GMC" },
  { id: "EMP003", name: "Rahul Kandula", dept: "Finance", policy: "GMC" },
  { id: "EMP002", name: "Aaliyah Schuyler", dept: "HR", policy: "GTL" },
  { id: "EMP004", name: "Giovanna Tao", dept: "Operations", policy: "GPA" },
  { id: "EMP009", name: "Anya Hirst", dept: "Sales", policy: "GMC" },
  { id: "EMP006", name: "Euan Lindgren", dept: "Product", policy: "GTL" },
  { id: "EMP010", name: "Kobe Stacy", dept: "Design", policy: "GMC" },
];

const MOCK_CLAIMS = [
  { id: "CLM-2025-0001", employee: "Rahul Sharma", employeeId: "EMP-1042", status: "Paid", amount: "₹25,000", policy: "GMC" },
  { id: "CLM-2025-0002", employee: "Priya Nair", employeeId: "EMP-2187", status: "Paid", amount: "₹48,000", policy: "GTL" },
  { id: "CLM-2025-0004", employee: "Deepa Krishnan", employeeId: "EMP-0891", status: "Outstanding", amount: "₹12,000", policy: "GPA" },
  { id: "CLM-2025-0005", employee: "Karan Patel", employeeId: "EMP-1754", status: "Outstanding", amount: "₹31,500", policy: "GMC" },
  { id: "CLM-2025-0008", employee: "Vikram Mehta", employeeId: "EMP-1105", status: "Rejected", amount: "₹9,200", policy: "GTL" },
];

const MOCK_DEPENDENTS: Record<
  string,
  { name: string; relation: string; dob: string }[]
> = {
  EMP001: [
    { name: "Rahul Rentala", relation: "Spouse", dob: "15 Mar 1985" },
    { name: "Arjun Rentala", relation: "Child", dob: "22 Jun 2012" },
  ],
  EMP003: [
    { name: "Meena Kandula", relation: "Spouse", dob: "08 Nov 1988" },
  ],
  EMP002: [
    { name: "James Schuyler", relation: "Spouse", dob: "02 Apr 1986" },
    { name: "Lily Schuyler", relation: "Child", dob: "15 Jan 2014" },
  ],
  EMP004: [{ name: "Wei Tao", relation: "Spouse", dob: "20 Jun 1989" }],
  EMP009: [
    { name: "Tom Hirst", relation: "Spouse", dob: "11 Jul 1990" },
    { name: "Emma Hirst", relation: "Child", dob: "18 Mar 2019" },
  ],
  EMP006: [
    { name: "Sara Lindgren", relation: "Spouse", dob: "19 Feb 1992" },
  ],
  EMP010: [
    { name: "Lisa Stacy", relation: "Spouse", dob: "14 Sep 1991" },
    { name: "Jake Stacy", relation: "Child", dob: "25 Nov 2017" },
  ],
};

import { darkIbpTheme, ibpTheme, apiRequest, endPoints, axiosInstance } from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { clearPortalConfiguration } from "../../redux/portalConfigSlice";
import {
  ThemeModeProvider,
  useThemeMode,
} from "../../context/ThemeModeContext";
import {
  HRPortalRoot,
  HRMainContent,
  HRPageContent,
  HRDesignFrame,
  HRDesignViewport,
} from "./styles";
import { getCompanyId, getCompanyName } from "../../utils/companyConfig";
import { HRPortalSidebar } from "../../components/HRPortalSidebar";
import Footer from "../../components/Footer";

import { HRPortalDashboard } from "../HRPortalDashboard";
import { HRPortalEnrolmentV2 } from "../HRPortalEnrolmentV2";
import { HRPortalClaims } from "../HRPortalClaims";
import { HRPortalReports } from "../HRPortalReports";
import { HRPortalHospitals } from "../HRPortalHospitals";
import { HRPortalInsightsV2 } from "../HRPortalInsightsV2";
import { HRPortalFinance } from "../HRPortalFinance";
import { HRPortalSettings } from "../HRPortalSettings";
import { HRPortalUserManagement } from "../HRPortalUserManagement";
import { PolicyDetail } from "../../components/PolicyDetail";
import { ClaimDetailPage } from "../../components/ClaimDetailPage";
import { HRPortalEmployeeProfile } from "../HRPortalEmployeeProfile";
import { HRPortalPolicyDetailV2 } from "../HRPortalPolicyDetailV2";
import { HRPortalComplaints } from "../HRPortalComplaints";
import { HRPortalEnrollment } from "../HRPortalEnrollment";
import { HRPortalIntimateClaimPage } from "../HRPortalIntimateClaimPage";
import { HRPortalPolicySummary } from "../HRPortalPolicySummary";
import { HRPortalPortfolio } from "../HRPortalPortfolio";
import { HRPortalEmployeeSearch } from "../HRPortalEmployeeSearch";
import { HRPortalPolicyFeature } from "../HRPortalPolicyFeature";
import ZohoEndorsementPage from "../ZohoEndorsementPage";


function ECard({
  name,
  empId,
  relation,
  policy,
}: {
  name: string;
  empId: string;
  relation: string;
  policy: string;
  subtitle: string;
}) {
  return (
    <Box
      sx={{
        borderRadius: "12px",
        background: "#F8FAFC",
        border: "1px solid #E8EEF5",
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
      }}
    >
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151" }}>
            {name}
          </Typography>
          <Box
            sx={{
              px: 1.1,
              py: 0.25,
              borderRadius: 999,
              bgcolor: relation === "Self" ? "#EBF3FF" : "#F3F0FF",
              color: relation === "Self" ? "#1C57B8" : "#7C3AED",
              fontSize: 15, lineHeight: 1.7,
              fontWeight: 600,
            }}
          >
            {relation}
          </Box>
        </Box>
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: "7px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#184C97",
            color: "#fff",
            cursor: "pointer",
            "&:hover": { background: "#143F7D" },
          }}
        >
          <Download size={12} color="#fff" />
        </Box>
      </Box>
      <Box sx={{ mx: 2, mb: 1.5, borderRadius: "10px", overflow: "hidden" }}>
        <Box
          sx={{
            background: "linear-gradient(90deg, #2C5FA9 0%, #2588B2 100%)",
            px: 2.5,
            pt: 2,
            pb: 1.75,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1.5,
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
                HDFC ERGO HEALTH INSURANCE
              </Typography>
              <Typography
                sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#fff" }}
              >
                Group Mediclaim Policy
              </Typography>
            </Box>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Shield size={14} color="#fff" />
            </Box>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              rowGap: 1.25,
              columnGap: 1.5,
            }}
          >
            {(
              [
                ["Member", name],
                ["Member ID", empId],
                ["Policy", policy],
                ["Policy No.", `${policy}-2025-001`],
                ["Sum Insured", "₹5,00,000"],
                ["Valid Till", "14 Jan 2027"],
              ] as [string, string][]
            ).map(([label, value]) => (
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
                    fontSize: 15, lineHeight: 1.7,
                    fontWeight: 600,
                    color: "#fff",
                    mt: 0.15,
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
            px: 2.5,
            py: 2.25,
            display: "flex",
            gap: 5,
            alignItems: "center",
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>
              Network Hospitals
            </Typography>
            <Typography
              sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827" }}
            >
              7,000+
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>
              Policy Type
            </Typography>
            <Typography
              sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827" }}
            >
              Floater
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>
              TPA Helpline
            </Typography>
            <Typography
              sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827" }}
            >
              1800-266-0700
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function HRPortal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenHandled = useRef(false);

  // Process token synchronously so sessionStorage is populated before children render.
  // useEffect fires after paint — by then child components would redirect to /landing.
  if (!tokenHandled.current) {
    tokenHandled.current = true;
    const token = searchParams.get("token");
    if (token) {
      const companyId = searchParams.get("companyId");
      const payload = decodeJwtPayload(token);
      if (payload) {
        const userId = payload.userDetails?.userId ?? payload.userId ?? null;
        const firstName = payload.userDetails?.firstName ?? null;
        const lastName = payload.userDetails?.lastName ?? null;
        const emailId = payload.userDetails?.emailId ?? null;
        const cid = companyId ? Number(companyId) : (payload.companyId ?? null);
        const cName = payload.companyName ?? null;
        sessionStorage.setItem("user", JSON.stringify({
          accessToken: { accessToken: token, refreshToken: null },
          portal: "HR_PORTAL",
          roleKey: "PORTAL_CRM",
          userId,
          firstName,
          lastName,
          email: emailId,
          companyId: cid,
          organisationId: cid,
          companyName: cName,
          // crmOriginCompanyId: the specific client company the CRM clicked from iWork.
          // Portfolio queries for CRM use crmUserId (not this companyId) to fetch all managed companies.
          crmOriginCompanyId: cid,
          isEmployee: false,
          isHR: false,
        }));
      }
    }
  }

  useEffect(() => {
    const token = searchParams.get("token");
    const companyId = searchParams.get("companyId");
    if (!token) return;

    // Exchange the short-lived iWork CRM token for a refreshable IBP token pair,
    // then fetch employee details to detect if the CRM user is also enrolled as
    // an IBP employee (isEmployee flag — needed for Switch to Employee Portal).
    axiosInstance.post(
      endPoints.ibpCrmSession,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    ).then(async (res) => {
      const { accessToken: newAccess, refreshToken: newRefresh } = res?.data?.data ?? {};
      if (!newAccess || !newRefresh) return;

      const stored = JSON.parse(sessionStorage.getItem("user") || "{}");
      stored.accessToken = { accessToken: newAccess, refreshToken: newRefresh };
      sessionStorage.setItem("user", JSON.stringify(stored));

      // Now fetch employee details with the new token to get isEmployee / id.
      try {
        const empRes = await axiosInstance.get(endPoints.employeeDetails, {
          headers: { Authorization: `Bearer ${newAccess}` },
        });
        const empData = empRes?.data?.data ?? {};
        const refreshed = JSON.parse(sessionStorage.getItem("user") || "{}");
        if (empData.isEmployee) {
          refreshed.isEmployee = true;
          refreshed.id = empData.id ?? refreshed.id;
        }
        sessionStorage.setItem("user", JSON.stringify(refreshed));
        window.dispatchEvent(new CustomEvent("hrportal:session-updated"));
      } catch { /* non-critical — switch button just won't show */ }
    }).catch(() => { /* keep using the original iWork token */ });

    // Replace URL — remove token param, keep companyId
    const newParams = new URLSearchParams();
    if (companyId) newParams.set("companyId", companyId);
    navigate(
      { pathname: "/hr-portal/portfolio", search: newParams.toString() },
      { replace: true },
    );
  }, []);

  return (
    <ThemeModeProvider>
      <HRPortalInner />
    </ThemeModeProvider>
  );
}

function HRPortalInner() {
  const { resolvedMode } = useThemeMode();
  const navigate = useNavigate();
  const [company, setCompany] = useState(() => getCompanyName() || "Insurance Management");
  const dispatch = useDispatch();
  const [userDetails, setUserDetails] = useState(() => JSON.parse(sessionStorage.getItem("user") || "{}"));
  useEffect(() => {
    const onSessionUpdate = () => setUserDetails(JSON.parse(sessionStorage.getItem("user") || "{}"));
    window.addEventListener("hrportal:session-updated", onSessionUpdate);
    return () => window.removeEventListener("hrportal:session-updated", onSessionUpdate);
  }, []);
  const { isEmployee, isHR, roleKey } = userDetails;
  // HR_ADMIN/ONLY_HR who are also IBP employees, OR CRM users enrolled in the domain company.
  const isHybridUser = Boolean(isEmployee && (isHR || roleKey === "PORTAL_CRM"));

  const displayName: string =
    userDetails.employeeName ||
    [userDetails.firstName, userDetails.lastName].filter(Boolean).join(" ") ||
    userDetails.email ||
    "User";
  const displayInitials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join("");
  const ROLE_DISPLAY_LABELS: Record<string, string> = {
    ONLY_HR:     "HR User",
    HR_ADMIN:    "HR Admin",
    EXTERNAL_HR: "HR Consultant",
    PORTAL_CRM:  "CRM",
  };
  const roleLabel: string = roleKey ? (ROLE_DISPLAY_LABELS[roleKey] ?? roleKey.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())) : "HR";

  const handleLogout = async () => {
    try {
      await apiRequest(endPoints.getActivityLogs, {
        method: "POST",
        data: {
          activityKey: "LOGGED_OUT",
          activityCategory: "AUTH",
          referenceId: userDetails?.employeeId,
          referenceType: "USER",
          metadata: null,
        },
        headers: { userid: String(userDetails?.employeeId) },
      });
    } catch (_error) {
      // Keep logout reliable even if activity logging fails.
    }
    dispatch(clearPortalConfiguration());
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("sessionStartedAt");
    navigate("/landing");
  };

  const [companySearch, setCompanySearch] = useState("");
  const [locationOptions, setLocationOptions] = useState<{ id: number; location_name: string; location_code?: string }[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  const [pendingLocationIds, setPendingLocationIds] = useState<number[]>([]);
  const [locationPolicyCounts, setLocationPolicyCounts] = useState<Record<number, { active: number; inactive: number }>>({});
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const LOCATION_PAGE_SIZE = 20;
  const [locationPage, setLocationPage] = useState(1);
  const [locationHasMore, setLocationHasMore] = useState(true);
  const [isLoadingMoreLocations, setIsLoadingMoreLocations] = useState(false);
  const locationSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationFetchTokenRef = useRef(0);
  const isInitialLocationSearchRef = useRef(true);
  // Snapshot of selected location ids taken when the dropdown opens — used to pin them to the
  // top of whatever page(s) are currently loaded, without re-sorting the list while the user checks boxes.
  const locationSortSnapshotRef = useRef<number[]>([]);
  const [groupCompanies, setGroupCompanies] = useState<{ id: number; name: string; isParent?: boolean }[]>([]);
  const [isGroupCompany, setIsGroupCompany] = useState(false);
  const [groupCompaniesLoading, setGroupCompaniesLoading] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(
    null
  );
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const [companyAnchor, setCompanyAnchor] = useState<HTMLElement | null>(null);
  const [regionAnchor, setRegionAnchor] = useState<HTMLElement | null>(null);
  // Safety net for a known MUI Menu/Modal bug: when a Menu closes (especially on a fast
  // open-then-click-away), its modal manager can fail to restore document.body's
  // pointer-events, leaving the whole page unclickable until something else happens to
  // reset it. Once our own state confirms every menu on this page is closed, force-clear
  // any leftover lock — this can only ever fix a stuck state, never break a real one.
  useEffect(() => {
    if (regionAnchor || settingsAnchor || profileAnchor || companyAnchor) return;
    const timer = setTimeout(() => {
      if (document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "";
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [regionAnchor, settingsAnchor, profileAnchor, companyAnchor]);
  const [searchText, setSearchText] = useState("");
  const pendingRestoreLocationIdsRef = useRef<number[] | null>(null);
  const lastGroupCompaniesFetchCidRef = useRef<number | null>(null);
  // Mirrors groupCompanies so the fetch effect can check membership without depending on it.
  const groupCompaniesRef = useRef<{ id: number; name: string; isParent?: boolean }[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // portfolioCompanyName persists the company name set by Portfolio → Dashboard navigation
  // across in-portal route changes (sidebar clicks pass no state, so location.state is lost).
  // Resets to null when the user navigates back to the Portfolio page.
  const [portfolioCompanyName, setPortfolioCompanyName] = useState<string | null>(null);
  const [portfolioCompanyId, setPortfolioCompanyId] = useState<number | null>(null);
  // ─── Navigation scenario: how did we arrive at the dashboard? ───────────────
  // SCENARIO A — COMPANY CARD BUTTON (portfolioCompanyId set, policyId absent)
  //   navigate("/hr-portal/dashboard", { state: { companyId, companyName } })
  //   → portfolioPolicyId = null → Dashboard loads ALL policies (paginated)
  //
  // SCENARIO B — POLICY CARD BUTTON (portfolioCompanyId set, policyId present)
  //   navigate("/hr-portal/dashboard", { state: { companyId, companyName, policyId } })
  //   → portfolioPolicyId = number → Dashboard loads ONLY that policy (limit=0)
  //
  // WHY useMemo NOT useState:
  //   useState lazy initializer only runs on first mount. On re-navigation
  //   (same component, new route state), the initializer doesn't re-run,
  //   so the old policyId would persist on the first render, causing a
  //   spurious dashboard_policy_cards call with the wrong policyId.
  //   useMemo re-computes synchronously whenever location.state changes,
  //   so Dashboard always sees the correct value on its very first render.
  const portfolioPolicyId = useMemo<number | null>(() => {
    const state = location.state as { policyId?: number } | null;
    return state?.policyId ?? null;
  }, [location.state]);

  useLayoutEffect(() => {
    const state = location.state as { companyName?: string; companyId?: number; locationIds?: string; policyId?: number } | null;
    if (state?.companyName) {
      setPortfolioCompanyName(state.companyName);
    }
    if (state?.companyId != null) {
      setPortfolioCompanyId(state.companyId);
    } else {
      // Persist companyId across refreshes/direct URL access via search param
      const paramCid = searchParams.get('companyId');
      if (paramCid) setPortfolioCompanyId(Number(paramCid));
    }
    if (state?.locationIds != null) {
      const ids = String(state.locationIds).split(',').map(Number).filter(Boolean);
      pendingRestoreLocationIdsRef.current = ids;
    }
    const scenario = state?.policyId != null ? "POLICY_CARD" : "COMPANY_CARD";
    console.log("[NAV][HRPortal] location.state received | SCENARIO=%s | companyId=%s | policyId=%s | locationIds=%s",
      scenario, state?.companyId ?? null, state?.policyId ?? null, state?.locationIds ?? null);
  }, [location.state, searchParams]);
  useEffect(() => {
    if (location.pathname.includes("/portfolio")) {
      setPortfolioCompanyName(null);
      setPortfolioCompanyId(null);
      // portfolioPolicyId is derived from location.state — clears automatically when navigating to portfolio
      setIsGroupCompany(false);
      setGroupCompanies([]);
    }
  }, [location.pathname]);

  // Keep a ref copy of the loaded group list for membership checks in the fetch effect.
  useEffect(() => { groupCompaniesRef.current = groupCompanies; }, [groupCompanies]);

  // Fetch group companies whenever the viewed company changes or route changes away from portfolio.
  // Uses portfolio_group_companies (HR-access-restricted) instead of the raw group-companies API
  // so external HR users only see the companies they are mapped to.
  useEffect(() => {
    if (location.pathname.includes("/portfolio")) return;
    const cid = portfolioCompanyId ?? getCompanyId();
    if (!cid) return;
    // Skip if we already fetched for this exact company — prevents double-fire when both
    // location.pathname and portfolioCompanyId change in the same navigation (e.g. portfolio→dashboard).
    if (lastGroupCompaniesFetchCidRef.current === cid) return;
    // The switchable-company list belongs to the GROUP, not the member being viewed. If the newly
    // selected company is already a member of the loaded group, keep the existing (complete) list —
    // refetching scoped to a member would collapse the dropdown to just that company.
    if (groupCompaniesRef.current.some((c) => c.id === cid)) {
      lastGroupCompaniesFetchCidRef.current = cid;
      return;
    }
    lastGroupCompaniesFetchCidRef.current = cid;
    setIsGroupCompany(false);
    setGroupCompanies([]);
    setGroupCompaniesLoading(true);
    apiRequest(
      `${endPoints.generateHRReports}portfolio_group_companies?page=1&limit=0`,
      {
        method: "POST",
        data: { companyId: String(cid), hrCompanyId: String(cid), crmUserId: "", searchTerm: "", locationIds: "" },
      }
    )
      .then((res: any) => {
        const rows: any[] = res?.data?.data ?? [];
        if (rows.length === 0) return;
        setIsGroupCompany(true);
        const seen = new Set<number>();
        const members: { id: number; name: string; isParent?: boolean }[] = [];
        // Add the parent group company first with the GROUP CO. badge
        const parentId: number | null = rows[0]?.groupId ?? null;
        const parentName: string = rows[0]?.groupName ? String(rows[0].groupName) : "";
        if (parentId && parentName) {
          seen.add(parentId);
          members.push({ id: parentId, name: parentName, isParent: true });
        }
        for (const r of rows) {
          if (!seen.has(r.companyId)) {
            seen.add(r.companyId);
            members.push({ id: r.companyId, name: String(r.companyName ?? "") });
          }
        }
        setGroupCompanies(members);
      })
      .catch((err) => { console.error("[GroupCompany] error:", err); })
      .finally(() => setGroupCompaniesLoading(false));
  }, [portfolioCompanyId, location.pathname]);

  // Fetches one page of policy locations for `cid`. mode "reset" replaces the list (fresh company
  // or fresh search); mode "append" adds a page on top for infinite scroll.
  const fetchLocationsPage = useCallback((cid: number, page: number, search: string, mode: "reset" | "append") => {
    const token = ++locationFetchTokenRef.current;
    if (mode === "reset") setLocationsLoading(true);
    else setIsLoadingMoreLocations(true);
    void apiRequest(
      `${endPoints.generateHRReports}external_hr_company_locations?page=${page}&limit=${LOCATION_PAGE_SIZE}`,
      { method: 'POST', data: { companyId: String(cid), searchTerm: search } }
    ).then((res: any) => {
      if (locationFetchTokenRef.current !== token) return; // a newer fetch (search/scroll) already superseded this one
      const rows: { id: number; location_name: string; location_code?: string; active_employee_count: number; inactive_employee_count: number }[] = res?.data?.data ?? [];
      setLocationOptions((prev) => (mode === "append" ? [...prev, ...rows] : rows));
      setLocationHasMore(rows.length === LOCATION_PAGE_SIZE);
      setLocationPage(page);
      // Set employee counts directly from the location query — no extra API calls needed
      setLocationPolicyCounts((prev) => {
        const counts = mode === "append" ? { ...prev } : {};
        rows.forEach((r) => { counts[r.id] = { active: r.active_employee_count ?? 0, inactive: r.inactive_employee_count ?? 0 }; });
        return counts;
      });
      if (mode === "reset") {
        if (pendingRestoreLocationIdsRef.current != null) {
          // Restore location filter from navigation state (Portfolio → Dashboard/PolicySummary).
          // Not validated against `rows` any more — with pagination we only ever hold one page at
          // a time, so a valid selection outside page 1 would otherwise be wrongly dropped.
          const restored = pendingRestoreLocationIdsRef.current;
          setSelectedLocationIds(restored);
          setPendingLocationIds(restored);
          pendingRestoreLocationIdsRef.current = null;
        } else if (portfolioCompanyId != null) {
          // Changed company via dropdown — reset filter
          setSelectedLocationIds([]);
          setPendingLocationIds([]);
        }
        // Navigating back to portfolio with no company change: preserve current selection as-is.
      }
    }).catch(() => { if (mode === "reset") setLocationOptions([]); })
      .finally(() => {
        if (mode === "reset") setLocationsLoading(false);
        else setIsLoadingMoreLocations(false);
      });
  }, [portfolioCompanyId]);

  // Fetch policy location options for the active company (page 1, fresh)
  useEffect(() => {
    const cid = portfolioCompanyId ?? getCompanyId();
    if (!cid) return;
    setLocationSearch("");
    setLocationHasMore(true);
    fetchLocationsPage(cid, 1, "", "reset");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioCompanyId]);

  // Debounced server-side search — resets to page 1 and replaces the list
  useEffect(() => {
    if (isInitialLocationSearchRef.current) { isInitialLocationSearchRef.current = false; return; }
    const cid = portfolioCompanyId ?? getCompanyId();
    if (!cid) return;
    if (locationSearchDebounceRef.current) clearTimeout(locationSearchDebounceRef.current);
    locationSearchDebounceRef.current = setTimeout(() => {
      setLocationHasMore(true);
      fetchLocationsPage(cid, 1, locationSearch.trim(), "reset");
    }, 300);
    return () => {
      if (locationSearchDebounceRef.current) clearTimeout(locationSearchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSearch]);

  const loadMoreLocations = useCallback(() => {
    const cid = portfolioCompanyId ?? getCompanyId();
    if (!cid || isLoadingMoreLocations || !locationHasMore || locationsLoading) return;
    fetchLocationsPage(cid, locationPage + 1, locationSearch.trim(), "append");
  }, [portfolioCompanyId, isLoadingMoreLocations, locationHasMore, locationsLoading, locationPage, locationSearch, fetchLocationsPage]);

  // Tooltips are positioned against their row at the moment they open, but our scrollable
  // list can move the row itself — the tooltip doesn't track that, so it visually "detaches"
  // and floats at the top/bottom of the dropdown instead of following its row. Simplest fix:
  // suppress tooltips while actively scrolling; they resume normally once scrolling settles.
  const [isLocationsScrolling, setIsLocationsScrolling] = useState(false);
  const locationsScrollStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLocationsScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) loadMoreLocations();
    setIsLocationsScrolling(true);
    if (locationsScrollStopTimerRef.current) clearTimeout(locationsScrollStopTimerRef.current);
    locationsScrollStopTimerRef.current = setTimeout(() => setIsLocationsScrolling(false), 150);
  }, [loadMoreLocations]);

  // Locations currently pinned to the top — snapshotted when the dropdown opens (see the
  // regionAnchor onClick handlers below) so items don't jump around while the user is checking boxes.
  const displayedLocationOptions = useMemo(() => {
    const pinned = locationSortSnapshotRef.current;
    if (pinned.length === 0) return locationOptions;
    const pinnedSet = new Set(pinned);
    const inPinned: typeof locationOptions = [];
    const rest: typeof locationOptions = [];
    locationOptions.forEach((opt) => (pinnedSet.has(opt.id) ? inPinned.push(opt) : rest.push(opt)));
    inPinned.sort((a, b) => pinned.indexOf(a.id) - pinned.indexOf(b.id));
    return [...inPinned, ...rest];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationOptions, regionAnchor]);


  // CRM-only users: auto-load first portfolio company when no company is selected yet.
  // Skipped for hybrid CRM+IBP employees — their IBP company loads via getCompanyId().
  useEffect(() => {
    if (roleKey !== "PORTAL_CRM" || portfolioCompanyId != null) return;
    if (isEmployee) return; // hybrid user: their IBP company is already in getCompanyId()
    if (location.pathname.includes("/portfolio")) return;
    const navState = location.state as { companyId?: number } | null;
    if (navState?.companyId != null) return; // portfolio click is about to set it via state effect
    const uid = userDetails?.userId ?? userDetails?.id ?? "";
    // Check if we have a crmOriginCompanyId (the company clicked from iWork) — use it as default
    const storedUser = JSON.parse(sessionStorage.getItem("user") || "{}");
    const originCid = storedUser?.crmOriginCompanyId ?? null;
    if (originCid) {
      setPortfolioCompanyId(originCid);
      const originName = storedUser?.companyName ?? null;
      if (originName) setPortfolioCompanyName(originName);
      return;
    }
    // Fallback: fetch the first company from the CRM's full portfolio.
    // Pass companyId:"" so the backend uses crmUserId alone (not restricted to one company's group).
    apiRequest(
      `${endPoints.generateHRReports}portfolio_group_companies?page=1&limit=1`,
      { method: "POST", data: { companyId: "", crmUserId: String(uid), hrCompanyId: "" } }
    ).then((res: any) => {
      const rows: any[] = res?.data?.data ?? res?.data ?? [];
      if (rows.length > 0) {
        const first = rows[0];
        // Use the actual member companyId (not groupId) so dashboard_policy_cards finds policies
        const id = first.companyId;
        const name = first.companyName ?? "";
        setPortfolioCompanyId(id);
        setPortfolioCompanyName(name);
        return;
      }
      // Fallback: try individual companies
      return apiRequest(
        `${endPoints.generateHRReports}portfolio_individual_companies?page=1&limit=1`,
        { method: "POST", data: { companyId: "", crmUserId: String(uid), hrCompanyId: "" } }
      ).then((res2: any) => {
        const rows2: any[] = res2?.data?.data ?? res2?.data ?? [];
        if (rows2.length > 0) {
          setPortfolioCompanyId(rows2[0].companyId);
          setPortfolioCompanyName(rows2[0].companyName ?? "");
        }
      });
    }).catch(() => {/* silently ignore — user can select from portfolio */});
  }, [roleKey, isEmployee, portfolioCompanyId, location.pathname, userDetails?.userId, userDetails?.id]);

  // 0 is sentinel for "no location" employees (policy_config_location_id IS NULL).
  // Named location IDs + optional 0 are passed to backend; empty = all locations.
  const effectiveLocationIds = (() => {
    return selectedLocationIds.length > 0 ? selectedLocationIds.join(',') : '';
  })();

  // Display text for the location trigger button
  const locationTriggerText = (() => {
    if (selectedLocationIds.length === 0) return 'All Locations';
    const parts: string[] = locationOptions
      .filter((o) => selectedLocationIds.includes(o.id))
      .map((o) => {
        const c = locationPolicyCounts[o.id];
        return `${o.location_code ? `[${o.location_code}] ` : ''}${o.location_name}(${c?.active ?? 0}/${c?.inactive ?? 0})`;
      });
    return parts.join(' | ');
  })();

  const displayCompany = portfolioCompanyName
    ?? (portfolioCompanyId ? groupCompanies.find((c) => c.id === portfolioCompanyId)?.name : undefined)
    ?? company;
  const isPortfolio = location.pathname.includes("/portfolio");
  const isDashboard =
    location.pathname.includes("/dashboard") ||
    location.pathname === "/hr-portal" ||
    location.pathname === "/hr-portal/";
  const isPolicyFeature = location.pathname.includes("/policy-feature/");
  const pageContentRef = useRef<HTMLDivElement>(null);
  const [dashboardScrolled, setDashboardScrolled] = useState(false);
  const [dashboardPolicyCount, setDashboardPolicyCount] = useState<number | null>(null);

  // Quick actions panel state
  const [qaEmpOpen, setQaEmpOpen] = useState(false);
  const [qaEmpSearch, setQaEmpSearch] = useState("");
  const [qaEmpResults, setQaEmpResults] = useState<SearchEmployee[]>([]);
  const [qaEmpLoading, setQaEmpLoading] = useState(false);
  const [qaClaimOpen, setQaClaimOpen] = useState(false);
  const [qaClaimSearch, setQaClaimSearch] = useState("");
const [qaECardOpen, setQaECardOpen] = useState(false);
  const [qaECardSearch, setQaECardSearch] = useState("");
  const [qaECardDrawerOpen, setQaECardDrawerOpen] = useState(false);
  const [qaECardEmpId] = useState("");

  const q = searchText.trim();

  type SearchEmployee = { dbId: number; name: string; employeeCode: string; dept: string; isVip?: boolean };
  type SearchClaim    = { id: number; claimNumber: string; employeeName: string; status: string; amount: string };
  type SearchPolicy   = { id: number; name: string; policyFrom: string; policyTo: string };

  const [matchedEmployees, setMatchedEmployees] = useState<SearchEmployee[]>([]);
  const [matchedClaims,    setMatchedClaims]    = useState<SearchClaim[]>([]);
  const [matchedPolicies,  setMatchedPolicies]  = useState<SearchPolicy[]>([]);
  const [searchLoading,    setSearchLoading]    = useState(false);

  useEffect(() => {
    if (q.length < 2) {
      setMatchedEmployees([]);
      setMatchedClaims([]);
      setMatchedPolicies([]);
      return;
    }
    // CRM with a portfolio company selected → search that company.
    // HR user → use their assigned companyId from auth (userDetails.companyId),
    // not the subdomain config which may point to the group parent.
    const companyId =
      portfolioCompanyId ??
      (userDetails?.companyId ? Number(userDetails.companyId) : null) ??
      getCompanyId();
    if (!companyId) return;
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const hrMgmtId = userDetails?.hrManagementId ? Number(userDetails.hrManagementId) : null;
        const res = await axiosInstance.get(endPoints.hrGlobalSearch(companyId, q, hrMgmtId));
        const { employees = [], claims = [], policies = [] } = res.data?.data ?? {};
        setMatchedEmployees(employees);
        setMatchedClaims(claims);
        setMatchedPolicies(policies);
      } catch {
        // keep previous results on error
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  const hasResults = matchedEmployees.length > 0 || matchedClaims.length > 0 || matchedPolicies.length > 0;

  // Quick-action Employee dialog live search
  useEffect(() => {
    const t = qaEmpSearch.trim();
    if (t.length < 2) { setQaEmpResults([]); return; }
    const companyId =
      portfolioCompanyId ??
      (userDetails?.companyId ? Number(userDetails.companyId) : null) ??
      getCompanyId();
    if (!companyId) return;
    const timer = setTimeout(async () => {
      try {
        setQaEmpLoading(true);
        const hrMgmtId2 = userDetails?.hrManagementId ? Number(userDetails.hrManagementId) : null;
        const res = await axiosInstance.get(endPoints.hrGlobalSearch(companyId, t, hrMgmtId2));
        setQaEmpResults(res.data?.data?.employees ?? []);
      } catch { /* keep previous */ } finally { setQaEmpLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [qaEmpSearch]);


  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const el = pageContentRef.current;
    if (!el) return;
    const onScroll = () => {
      setDashboardScrolled(el.scrollTop > 90);
      // Close company dropdown when user starts scrolling — prevents backdrop blocking scroll
      if (companyAnchor) setCompanyAnchor(null);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [companyAnchor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isDashboard) setDashboardScrolled(false);
  }, [isDashboard]);

  useEffect(() => {
    setDashboardPolicyCount(null);
  }, [portfolioCompanyId]);


  return (
    <ThemeProvider theme={resolvedMode === "dark" ? darkIbpTheme : ibpTheme}>
      <HRPortalRoot>
        <HRDesignViewport>
          <HRDesignFrame>
            {/* ── Sidebar ─────────────────────────────────────────────────────── */}
            <HRPortalSidebar />

            {/* ── Main Content ───────────────────────────────────────────────── */}
            <HRMainContent
              sx={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Company group switcher dropdown */}
              <Popper
                open={Boolean(companyAnchor)}
                anchorEl={companyAnchor}
                placement="bottom-start"
                style={{ zIndex: 9999 }}
              >
                <ClickAwayListener onClickAway={() => setCompanyAnchor(null)}>
                  <Paper sx={{ borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", mt: 0.75, minWidth: 300, py: 0.5 }}>
                    <Box sx={{ px: 2, pt: 1.25, pb: 0.5 }}>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        Switch Company
                      </Typography>
                    </Box>
                    {groupCompaniesLoading ? (
                      <Box sx={{ px: 2, py: 2, display: "flex", alignItems: "center", gap: 1 }}>
                        <CircularProgress size={14} />
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>Loading companies...</Typography>
                      </Box>
                    ) : groupCompanies.length === 0 ? (
                      <Box sx={{ px: 2, py: 1.5 }}>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>No other companies in this group</Typography>
                      </Box>
                    ) : groupCompanies.map((opt) => {
                      const isCurrent = opt.id === (portfolioCompanyId ?? null);
                      return (
                        <MenuItem
                          key={opt.id}
                          disabled={isCurrent}
                          onClick={() => {
                            setCompanyAnchor(null);
                            startTransition(() => {
                              setPortfolioCompanyId(opt.id);
                              setPortfolioCompanyName(opt.name);
                            });
                          }}
                          sx={{
                            fontSize: 15, lineHeight: 1.7,
                            fontWeight: isCurrent ? 700 : 400,
                            color: isCurrent ? "#1C57B8" : "#111827",
                            opacity: 1,
                            "&.Mui-disabled": { opacity: 1 },
                            display: "flex", alignItems: "center", gap: 1,
                          }}
                        >
                          {isCurrent && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#1C57B8", flexShrink: 0 }} />}
                          <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: isCurrent ? 700 : 400, color: isCurrent ? "#1C57B8" : "#111827", flex: 1, minWidth: 0 }} noWrap>{opt.name}</Typography>
                            {opt.isParent && (
                              <Box sx={{ px: 1, py: 0.15, borderRadius: "4px", bgcolor: "#1D4ED8", flexShrink: 0 }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#fff", lineHeight: 1.5, letterSpacing: 0.3 }}>GROUP CO.</Typography>
                              </Box>
                            )}
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Paper>
                </ClickAwayListener>
              </Popper>

              <Menu
                anchorEl={regionAnchor}
                open={Boolean(regionAnchor)}
                onClose={() => { setRegionAnchor(null); setLocationSearch(""); }}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                PaperProps={{
                  sx: {
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                    mt: 0.75,
                    width: 420,
                    height: 320,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  },
                }}
                MenuListProps={{
                  sx: {
                    p: 0,
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    overflow: "hidden",
                    maxHeight: "100%",
                  },
                }}
              >
                {/* Header */}
                <Box sx={{ px: 2, pt: 1.5, pb: 1, borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase", mb: 1 }}>
                    Select Policy Location
                  </Typography>
                  <Box
                    sx={{
                      display: "flex", alignItems: "center", gap: 1,
                      bgcolor: "#F9FAFB", border: "1px solid #E5E7EB",
                      borderRadius: "8px", px: 1.25, py: 0.6,
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Search size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />
                    <input
                      autoFocus
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      placeholder="Search by location code or address..."
                      style={{
                        border: "none", outline: "none", background: "transparent",
                        fontSize: 13, color: "#111827", width: "100%",
                      }}
                    />
                    {locationSearch && (
                      <Box
                        onClick={() => setLocationSearch("")}
                        sx={{ cursor: "pointer", display: "flex", alignItems: "center", color: "#9CA3AF", "&:hover": { color: "#374151" } }}
                      >
                        <X size={12} />
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* All Locations — sticky at top, outside scroll */}
                <Box sx={{ flexShrink: 0, borderBottom: "1px solid #F3F4F6" }}>
                  <MenuItem
                    onClick={() => setPendingLocationIds([])}
                    sx={{ py: 0.85, px: 1.5, "&:hover": { bgcolor: "#F0F6FF" } }}
                  >
                    <Radio
                      size="small"
                      checked={pendingLocationIds.length === 0}
                      sx={{ p: 0, mr: 1.25, color: "#D1D5DB", "&.Mui-checked": { color: "#1C57B8" } }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>All Locations</Typography>
                      <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>All policies</Typography>
                    </Box>
                  </MenuItem>
                </Box>

                {/* Scrollable middle — named locations + other */}
                <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0 }} onScroll={handleLocationsScroll}>

                {/* Loading skeleton for location options */}
                {locationsLoading && (
                  <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[0, 1, 2].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          height: 32, borderRadius: '8px',
                          background: 'linear-gradient(90deg, #E7EAEE 25%, #F0F3F6 50%, #E7EAEE 75%)',
                          backgroundSize: '400px 100%',
                          '@keyframes shimmer': { '0%': { backgroundPosition: '-200px 0' }, '100%': { backgroundPosition: '200px 0' } },
                          animation: 'shimmer 1.2s infinite linear',
                        }}
                      />
                    ))}
                  </Box>
                )}

                {/* No locations at all for this company/search */}
                {!locationsLoading && locationOptions.length === 0 && (
                  <Box sx={{ px: 2, py: 2, textAlign: "center" }}>
                    <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>No locations found</Typography>
                  </Box>
                )}

                {/* Named locations — checkboxes (server-filtered by locationSearch via searchTerm) */}
                {!locationsLoading && locationOptions.length > 0 && (
                  <>
                    <Box sx={{ px: 2, pt: 1, pb: 0.25, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, bgcolor: "#fff", zIndex: 1 }}>
                      <Box>
                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                          Location code
                        </Typography>
                        <Typography sx={{ fontSize: 9, color: "#9CA3AF" }}>
                          e.g. [266MB] 20Cube Logistics Pvt Ltd
                        </Typography>
                      </Box>
                      <Box sx={{ flexShrink: 0, textAlign: "right" }}>
                        <Typography sx={{ fontSize: 9, fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1.3 }}>
                          <Box component="span" sx={{ color: "#15803D" }}>Active</Box>
                          {"/"}
                          <Box component="span" sx={{ color: "#B91C1C" }}>Inactive</Box>
                        </Typography>
                        <Typography sx={{ fontSize: 9, color: "#9CA3AF", whiteSpace: "nowrap", lineHeight: 1.3 }}>
                          employee count
                        </Typography>
                      </Box>
                    </Box>
                    {displayedLocationOptions.map((opt) => {
                      const count = locationPolicyCounts[opt.id] ?? { active: 0, inactive: 0 };
                      return (
                        <MenuItem
                          key={opt.id}
                          onClick={() => {
                            setPendingLocationIds((prev) => {
                              const next = prev.includes(opt.id)
                                ? prev.filter((id) => id !== opt.id)
                                : [...prev, opt.id];
                              return next;
                            });
                          }}
                          sx={{ py: 0.75, px: 1.5, minWidth: 0, width: "100%", "&:hover": { bgcolor: "#F0F6FF" } }}
                        >
                          <Checkbox
                            size="small"
                            checked={pendingLocationIds.includes(opt.id)}
                            sx={{ p: 0, mr: 1.25, flexShrink: 0, color: "#D1D5DB", "&.Mui-checked": { color: "#1C57B8" } }}
                          />
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, flex: 1 }}>
                              <MapPin size={11} color="#6B7280" style={{ flexShrink: 0 }} />
                              <Tooltip title={isLocationsScrolling ? "" : (opt.location_code ? `[${opt.location_code}] ${opt.location_name}` : opt.location_name)} placement="top" arrow>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                                    {opt.location_code && <Box component="span" sx={{ color: "#6B7280" }}>[{opt.location_code}] </Box>}
                                    {opt.location_name}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0, ml: 1 }}>
                              <Tooltip title={isLocationsScrolling ? "" : "Active policy employees"} placement="top" arrow>
                                <Box sx={{ px: 1, py: 0.15, borderRadius: "10px", bgcolor: "#DCFCE7", minWidth: 24, textAlign: "center" }}>
                                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#15803D" }}>{count.active}</Typography>
                                </Box>
                              </Tooltip>
                              <Tooltip title={isLocationsScrolling ? "" : "Inactive policy employees"} placement="top" arrow>
                                <Box sx={{ px: 1, py: 0.15, borderRadius: "10px", bgcolor: "#FEE2E2", minWidth: 24, textAlign: "center" }}>
                                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#B91C1C" }}>{count.inactive}</Typography>
                                </Box>
                              </Tooltip>
                            </Box>
                          </Box>
                        </MenuItem>
                      );
                    })}
                    {isLoadingMoreLocations && (
                      <Box sx={{ px: 2, py: 1.25, textAlign: "center" }}>
                        <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>Loading more…</Typography>
                      </Box>
                    )}
                  </>
                )}

                </Box>{/* end scrollable area */}

                {/* Apply button — always visible at bottom */}
                <Box sx={{ px: 1.5, py: 1.25, borderTop: "1px solid #F3F4F6", flexShrink: 0 }}>
                  <Box
                    onClick={() => {
                      setSelectedLocationIds(pendingLocationIds);
                      setRegionAnchor(null);
                    }}
                    sx={{
                      height: 34,
                      borderRadius: "8px",
                      background: "#1C57B8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#fff",
                      cursor: "pointer",
                      "&:hover": { background: "#1749A0" },
                      transition: "background 0.15s",
                    }}
                  >
                    Apply
                  </Box>
                </Box>
              </Menu>

              <Menu
                anchorEl={settingsAnchor}
                open={Boolean(settingsAnchor)}
                onClose={() => setSettingsAnchor(null)}
              >
                <MenuItem onClick={() => setSettingsAnchor(null)}>
                  Portal Preferences
                </MenuItem>
                <MenuItem onClick={() => setSettingsAnchor(null)}>
                  Theme Settings
                </MenuItem>
              </Menu>
              <Menu
                anchorEl={profileAnchor}
                open={Boolean(profileAnchor)}
                onClose={() => setProfileAnchor(null)}
              >
                {userDetails.id && (
                  <MenuItem
                    onClick={() => { setProfileAnchor(null); navigate(`/hr-portal/enrollment/${userDetails.id}`); }}
                    sx={{ gap: 1.5, fontFamily: "'Figtree', sans-serif", fontSize: 15, fontWeight: 400, "&:hover": { backgroundColor: "#EAF3FC", color: "#2D8CE6" } }}
                  >
                    <PersonRounded sx={{ fontSize: 18 }} />
                    Profile
                  </MenuItem>
                )}
                {isHybridUser && (
                  <MenuItem
                    onClick={() => { setProfileAnchor(null); navigate("/"); }}
                    sx={{ gap: 1.5, fontFamily: "'Figtree', sans-serif", fontSize: 15, fontWeight: 400, "&:hover": { backgroundColor: "#EAF3FC", color: "#2D8CE6" } }}
                  >
                    <SwitchAccountRounded sx={{ fontSize: 18 }} />
                    Switch to Employee Portal
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => { setProfileAnchor(null); navigate("/hr-portal/settings"); }}
                  sx={{ gap: 1.5, fontFamily: "'Figtree', sans-serif", fontSize: 15, fontWeight: 400, "&:hover": { backgroundColor: "#EAF3FC", color: "#2D8CE6" } }}
                >
                  <Settings size={18} />
                  Account Settings
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => { setProfileAnchor(null); void handleLogout(); }}
                  sx={{ gap: 1.5, fontFamily: "'Figtree', sans-serif", fontSize: 15, fontWeight: 400, color: "#d32f2f", "&:hover": { backgroundColor: "#FDECEC", color: "#d32f2f" } }}
                >
                  <LogoutRounded sx={{ fontSize: 18 }} />
                  Log Out
                </MenuItem>
              </Menu>

              {/* ── Full header ── */}
              <Box
                  ref={searchRef}
                  sx={{
                    background:
                      "linear-gradient(90deg, #1A4B9B 0%, #1B7DB5 100%)",
                    px: 3,
                    pt: 4,
                    pb: 4,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 2,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                    <Box sx={{ flexShrink: 0, minWidth: 0 }}>
                      {isPortfolio ? (
                        <>
                          <Typography
                            sx={{
                              fontSize: 15, lineHeight: 1.7,
                              fontWeight: 600,
                              color: "rgba(255,255,255,0.5)",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              mb: 0.75,
                            }}
                          >
                            Risk Watch
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: { xs: 16, sm: 20 },
                              fontWeight: 700,
                              color: "#fff",
                              lineHeight: 1.15,
                              mb: 0.75,
                            }}
                          >
                            Portfolio Overview
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 15, lineHeight: 1.7,
                              color: "rgba(255,255,255,0.65)",
                              fontWeight: 400,
                              lineHeight: 1.4,
                            }}
                          >
                            Manage and track all client group companies and their insurance policies
                          </Typography>
                          <Box
                            onClick={(e) => setRegionAnchor(e.currentTarget)}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: 2,
                              px: 1.25,
                              py: 0.6,
                              borderRadius: "8px",
                              bgcolor: "rgba(255,255,255,0.12)",
                              border: "1px solid rgba(255,255,255,0.22)",
                              width: "fit-content",
                              cursor: "pointer",
                              userSelect: "none",
                              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 12, lineHeight: 1.7,
                                color: "rgba(255,255,255,0.75)",
                                fontWeight: 600,
                                letterSpacing: "0.04em",
                              }}
                            >
                              Policy Location:
                            </Typography>
                            <MapPin size={12} color="#fff" />
                            <Typography
                              sx={{
                                fontSize: 12, lineHeight: 1.7,
                                color: "#fff",
                                fontWeight: 600,
                              }}
                            >
                              {locationTriggerText}
                            </Typography>
                            <ChevronDown size={14} color="#fff" style={{ marginLeft: 2 }} />
                          </Box>
                        </>
                      ) : (
                        <>
                          <Typography
                            sx={{
                              fontSize: 15, lineHeight: 1.7,
                              fontWeight: 600,
                              color: "rgba(255,255,255,0.5)",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              mb: 0.75,
                            }}
                          >
                            You are viewing
                          </Typography>
                          <Box
                            onClick={(!isPolicyFeature && isGroupCompany) ? (e) => setCompanyAnchor(e.currentTarget) : undefined}
                            sx={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: 1.25,
                              cursor: (!isPolicyFeature && isGroupCompany) ? "pointer" : "default",
                              userSelect: "none",
                              width: "fit-content",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: { xs: 14, sm: 18 },
                                fontWeight: 700,
                                color: "#fff",
                                lineHeight: 1.15,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: { xs: 140, sm: "none" },
                              }}
                            >
                              {displayCompany}
                            </Typography>
                            {!isPolicyFeature && isGroupCompany && groupCompanies.length > 0 && <ChevronDown size={18} color="#fff" style={{ flexShrink: 0, marginLeft: 4 }} />}
                          </Box>
                          {/* {dashboardPolicyCount != null && dashboardPolicyCount > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                                mt: 1,
                                px: 1.25,
                                py: 0.4,
                                borderRadius: "8px",
                                bgcolor: "rgba(255,255,255,0.14)",
                                border: "1px solid rgba(255,255,255,0.22)",
                                width: "fit-content",
                              }}
                            >
                              <Shield size={12} color="rgba(255,255,255,0.85)" />
                              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)", lineHeight: 1, letterSpacing: 0.2 }}>
                                {dashboardPolicyCount} {dashboardPolicyCount === 1 ? "Policy" : "Policies"}
                              </Typography>
                            </Box>
                          )} */}
                          <Box
                            onClick={!isPolicyFeature ? (e) => { setPendingLocationIds(selectedLocationIds); locationSortSnapshotRef.current = selectedLocationIds; setRegionAnchor(e.currentTarget); } : undefined}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: 2,
                              px: 1.25,
                              py: 0.6,
                              borderRadius: "8px",
                              bgcolor: "rgba(255,255,255,0.12)",
                              border: "1px solid rgba(255,255,255,0.22)",
                              width: "fit-content",
                              cursor: isPolicyFeature ? "default" : "pointer",
                              userSelect: "none",
                              ...(!isPolicyFeature && { "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }),
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 12, lineHeight: 1.7,
                                color: "rgba(255,255,255,0.75)",
                                fontWeight: 600,
                                letterSpacing: "0.04em",
                              }}
                            >
                              Policy Location:
                            </Typography>
                            <MapPin size={12} color="#fff" />
                            <Typography
                              sx={{
                                fontSize: 12, lineHeight: 1.7,
                                color: "#fff",
                                fontWeight: 600,
                              }}
                            >
                              {locationTriggerText}
                            </Typography>
                            {!isPolicyFeature && <ChevronDown size={14} color="#fff" style={{ marginLeft: 2 }} />}
                          </Box>
                        </>
                      )}
                    </Box>
                  <Box sx={{ position: "relative", width: 500, ml: "auto" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 2,
                        height: 40,
                        border: "1px solid rgba(255,255,255,0.3)",
                        borderRadius: "10px",
                        bgcolor: "#fff",
                        "&:focus-within": {
                          borderColor: "rgba(255,255,255,0.8)",
                          boxShadow: "0 0 0 2px rgba(255,255,255,0.15)",
                        },
                      }}
                    >
                      <Search size={16} color="#9CA3AF" />
                      <InputBase
                        placeholder="Search employees, claims, policies..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && searchText.trim()) {
                            setSearchFocused(false);
                            navigate("/hr-portal/employee-search", {
                              state: { query: searchText.trim() },
                            });
                          }
                        }}
                        sx={{
                          fontSize: 15, lineHeight: 1.7,
                          color: "#111827",
                          flex: 1,
                          "& input": { p: 0, color: "#111827" },
                          "& input::placeholder": {
                            color: "#9CA3AF",
                            opacity: 1,
                          },
                        }}
                      />
                      {searchLoading && <CircularProgress size={13} sx={{ color: "#9CA3AF", mr: 0.5, flexShrink: 0 }} />}
                      {searchText && (
                        <Box
                          onClick={() => {
                            setSearchText("");
                            setSearchFocused(false);
                          }}
                          sx={{
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <X size={14} color="#9CA3AF" />
                        </Box>
                      )}
                    </Box>
                    {searchFocused && (hasResults || (q.length >= 2 && !searchLoading)) ? (
                      <Box
                        sx={{
                          position: "absolute",
                          top: "calc(100% + 6px)",
                          left: 0,
                          right: 0,
                          bgcolor: "#fff",
                          borderRadius: "12px",
                          boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
                          border: "1px solid #E5E7EB",
                          zIndex: 200,
                          overflow: "hidden",
                          maxHeight: 280,
                          overflowY: "auto",
                        }}
                      >
                        {/* No results */}
                        {!hasResults && q.length >= 2 && !searchLoading && (
                          <Box sx={{ px: 3, py: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
                            <Search size={20} color="#D1D5DB" />
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151" }}>No results found</Typography>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", textAlign: "center" }}>No employees, claims or policies matched "{q}"</Typography>
                          </Box>
                        )}

                        {/* Employees */}
                        {matchedEmployees.length > 0 && (
                          <>
                            <Box sx={{ px: 2, py: 0.75, bgcolor: "#F8FAFC", borderBottom: "1px solid #F3F4F6" }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Employees</Typography>
                            </Box>
                            {matchedEmployees.map((emp) => (
                              <Box
                                key={emp.dbId}
                                onMouseDown={() => {
                                  setSearchText("");
                                  setSearchFocused(false);
                                  navigate(`/hr-portal/enrollment/${emp.dbId}`);
                                }}
                                sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1, cursor: "pointer", "&:hover": { bgcolor: "#EBF3FF" }, borderBottom: "1px solid #F3F4F6" }}
                              >
                                <Box sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: "#EBF3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <User size={12} color="#2F74D6" />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827" }}>{emp.name}</Typography>
                                    {emp.isVip && <Box sx={{ px: 1, py: 0.1, borderRadius: 999, background: "#FEF3C7", border: "1px solid #FDE68A", color: "#D97706", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 0.5 }}><Star size={9} fill="#FCD34D" color="#D97706" /> VIP</Box>}
                                  </Box>
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>{emp.employeeCode} · {emp.dept}</Typography>
                                </Box>
                              </Box>
                            ))}
                          </>
                        )}

                        {/* Claims */}
                        {matchedClaims.length > 0 && (
                          <>
                            <Box sx={{ px: 2, py: 0.75, bgcolor: "#F8FAFC", borderBottom: "1px solid #F3F4F6", borderTop: matchedEmployees.length > 0 ? "1px solid #E5E7EB" : "none" }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Claims</Typography>
                            </Box>
                            {matchedClaims.map((claim) => (
                              <Box
                                key={claim.id}
                                onMouseDown={() => {
                                  setSearchText("");
                                  setSearchFocused(false);
                                  navigate(`/hr-portal/claims/${claim.id}`);
                                }}
                                sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1, cursor: "pointer", "&:hover": { bgcolor: "#F0FDF4" }, borderBottom: "1px solid #F3F4F6" }}
                              >
                                <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <FileText size={12} color="#059669" />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827" }}>{claim.claimNumber}</Typography>
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>{claim.employeeName}</Typography>
                                </Box>
                                <Box sx={{ px: 1, py: 0.2, borderRadius: 999, fontSize: 15, lineHeight: 1.7, fontWeight: 600, bgcolor: claim.status === "Approved" ? "#ECFDF5" : claim.status === "Pending" ? "#FFFBEB" : "#FEF2F2", color: claim.status === "Approved" ? "#059669" : claim.status === "Pending" ? "#D97706" : "#DC2626" }}>
                                  {claim.status}
                                </Box>
                              </Box>
                            ))}
                          </>
                        )}

                        {/* Policies */}
                        {matchedPolicies.length > 0 && (
                          <>
                            <Box sx={{ px: 2, py: 0.75, bgcolor: "#F8FAFC", borderBottom: "1px solid #F3F4F6", borderTop: (matchedEmployees.length > 0 || matchedClaims.length > 0) ? "1px solid #E5E7EB" : "none" }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Policies</Typography>
                            </Box>
                            {matchedPolicies.map((pol) => (
                              <Box
                                key={pol.id}
                                onMouseDown={() => {
                                  setSearchText("");
                                  setSearchFocused(false);
                                  navigate(`/hr-portal/policy-summary/${pol.id}`);
                                }}
                                sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1, cursor: "pointer", "&:hover": { bgcolor: "#EEF4FF" }, borderBottom: "1px solid #F3F4F6" }}
                              >
                                <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#EEF4FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <Shield size={12} color="#3538CD" />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827" }}>{pol.name}</Typography>
                                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>{pol.policyFrom} – {pol.policyTo}</Typography>
                                </Box>
                              </Box>
                            ))}
                          </>
                        )}
                      </Box>
                    ) : null}
                  </Box>
                  <Box
                    onClick={(e) => setProfileAnchor(e.currentTarget)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      pl: 0.5,
                      pr: 1.25,
                      height: 38,
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 999,
                      bgcolor: "rgba(255,255,255,0.1)",
                      cursor: "pointer",
                      flexShrink: 0,
                      "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        bgcolor: "#f97316",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 15, lineHeight: 1.7,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {displayInitials}
                    </Box>
                    <Box sx={{ lineHeight: 1 }}>
                      <Typography
                        sx={{
                          fontSize: 15, lineHeight: 1.7,
                          fontWeight: 600,
                          color: "#fff",
                          lineHeight: 1.3,
                        }}
                      >
                        {displayName}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 15, lineHeight: 1.7,
                          color: "rgba(255,255,255,0.7)",
                          lineHeight: 1,
                        }}
                      >
                        {roleLabel}
                      </Typography>
                    </Box>
                    <ChevronDown size={12} color="#fff" />
                  </Box>
                </Box>

              {/* ── Compact header (hidden — replaced by always-on full header above) ── */}
              {false && (
                <Box
                  ref={searchRef}
                  sx={{
                    display: "flex",
                    background:
                      "linear-gradient(90deg, #1A4B9B 0%, #1B7DB5 100%)",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 2px 14px rgba(15,53,110,0.20)",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 50,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      px: 3,
                      height: 56,
                      width: "100%",
                    }}
                  >
                    <Box sx={{ position: "relative", flex: 1, maxWidth: 320 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 1.5,
                          height: 34,
                          border: "1px solid rgba(255,255,255,0.3)",
                          borderRadius: "8px",
                          bgcolor: "#fff",
                          "&:focus-within": {
                            borderColor: "rgba(255,255,255,0.8)",
                            boxShadow: "0 0 0 2px rgba(255,255,255,0.15)",
                          },
                        }}
                      >
                        <Search size={13} color="#9CA3AF" />
                        <InputBase
                          placeholder="Search employees, claims..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          onFocus={() => setSearchFocused(true)}
                          sx={{
                            fontSize: 15, lineHeight: 1.7,
                            color: "#111827",
                            flex: 1,
                            "& input": { p: 0, color: "#111827" },
                            "& input::placeholder": {
                              color: "#9CA3AF",
                              opacity: 1,
                            },
                          }}
                        />
                        {searchText && (
                          <Box
                            onClick={() => {
                              setSearchText("");
                              setSearchFocused(false);
                            }}
                            sx={{
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <X size={13} color="#9CA3AF" />
                          </Box>
                        )}
                      </Box>
                      {searchFocused && (hasResults || (q.length >= 2 && !searchLoading)) && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: "calc(100% + 4px)",
                            left: 0,
                            right: 0,
                            bgcolor: "#fff",
                            borderRadius: "10px",
                            boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
                            border: "1px solid #E5E7EB",
                            zIndex: 200,
                            overflow: "hidden",
                          }}
                        >
                          {!hasResults && q.length >= 2 && !searchLoading && (
                            <Box sx={{ px: 3, py: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
                              <Search size={20} color="#D1D5DB" />
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151" }}>No results found</Typography>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", textAlign: "center" }}>No employees, claims or policies matched "{q}"</Typography>
                            </Box>
                          )}
                          {matchedEmployees.length > 0 && (
                            <>
                              <Box
                                sx={{
                                  px: 2,
                                  py: 0.75,
                                  bgcolor: "#F8FAFC",
                                  borderBottom: "1px solid #F3F4F6",
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: 15, lineHeight: 1.7,
                                    fontWeight: 700,
                                    color: "#9CA3AF",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em",
                                  }}
                                >
                                  Employees
                                </Typography>
                              </Box>
                              {matchedEmployees.map((emp) => (
                                <Box
                                  key={emp.dbId}
                                  onMouseDown={() => {
                                    setSearchText("");
                                    setSearchFocused(false);
                                    navigate(`/hr-portal/enrollment/${emp.dbId}`);
                                  }}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    px: 2,
                                    py: 1,
                                    cursor: "pointer",
                                    "&:hover": { bgcolor: "#EBF3FF" },
                                    borderBottom: "1px solid #F3F4F6",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: "50%",
                                      bgcolor: "#EBF3FF",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <User size={12} color="#2F74D6" />
                                  </Box>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827" }}>{emp.name}</Typography>
                                      {emp.isVip && <Box sx={{ px: 1, py: 0.1, borderRadius: 999, background: "#FEF3C7", border: "1px solid #FDE68A", color: "#D97706", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 0.5 }}><Star size={9} fill="#FCD34D" color="#D97706" /> VIP</Box>}
                                    </Box>
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>
                                      {emp.employeeCode} · {emp.dept}
                                    </Typography>
                                  </Box>
                                </Box>
                              ))}
                            </>
                          )}
                          {matchedClaims.length > 0 && (
                            <>
                              <Box
                                sx={{
                                  px: 2,
                                  py: 0.75,
                                  bgcolor: "#F8FAFC",
                                  borderBottom: "1px solid #F3F4F6",
                                  borderTop:
                                    matchedEmployees.length > 0
                                      ? "1px solid #E5E7EB"
                                      : "none",
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: 15, lineHeight: 1.7,
                                    fontWeight: 700,
                                    color: "#9CA3AF",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em",
                                  }}
                                >
                                  Claims
                                </Typography>
                              </Box>
                              {matchedClaims.map((claim) => (
                                <Box
                                  key={claim.id}
                                  onMouseDown={() => {
                                    setSearchText("");
                                    setSearchFocused(false);
                                    navigate(`/hr-portal/claims/${claim.id}`);
                                  }}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    px: 2,
                                    py: 1,
                                    cursor: "pointer",
                                    "&:hover": { bgcolor: "#F0FDF4" },
                                    borderBottom: "1px solid #F3F4F6",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: "8px",
                                      bgcolor: "#F0FDF4",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <FileText size={12} color="#059669" />
                                  </Box>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827" }}>
                                      {claim.claimNumber}
                                    </Typography>
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>
                                      {claim.employeeName}
                                    </Typography>
                                  </Box>
                                  <Box
                                    sx={{
                                      px: 1, py: 0.2, borderRadius: 999, fontSize: 15, lineHeight: 1.7, fontWeight: 600,
                                      bgcolor: claim.status === "Approved" ? "#ECFDF5" : claim.status === "Pending" ? "#FFFBEB" : "#FEF2F2",
                                      color: claim.status === "Approved" ? "#059669" : claim.status === "Pending" ? "#D97706" : "#DC2626",
                                    }}
                                  >
                                    {claim.status}
                                  </Box>
                                </Box>
                              ))}
                            </>
                          )}
                        </Box>
                      )}
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                        ml: "auto",
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        onClick={(e) => setCompanyAnchor(e.currentTarget)}
                        sx={{
                          display: { xs: "none", sm: "flex" },
                          alignItems: "center",
                          gap: 0.75,
                          px: 1.5,
                          height: 34,
                          border: "1px solid rgba(255,255,255,0.3)",
                          borderRadius: 999,
                          bgcolor: "rgba(255,255,255,0.12)",
                          cursor: "pointer",
                          userSelect: "none",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                        }}
                      >
                        <Building2 size={13} color="#fff" />
                        <Typography
                          sx={{
                            fontSize: 15, lineHeight: 1.7,
                            fontWeight: 600,
                            color: "#fff",
                            whiteSpace: "nowrap",
                            maxWidth: 140,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {displayCompany}
                        </Typography>
                        <ChevronDown size={12} color="#fff" />
                      </Box>
                      <Box
                        onClick={(e) => { setPendingLocationIds(selectedLocationIds); locationSortSnapshotRef.current = selectedLocationIds; setRegionAnchor(e.currentTarget); }}
                        sx={{
                          display: { xs: "none", md: "flex" },
                          alignItems: "center",
                          gap: 0.75,
                          px: 1.5,
                          height: 34,
                          border: "1px solid rgba(255,255,255,0.3)",
                          borderRadius: 999,
                          bgcolor: "rgba(255,255,255,0.12)",
                          cursor: "pointer",
                          userSelect: "none",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                        }}
                      >
                        <MapPin size={13} color="#fff" />
                        <Typography
                          sx={{
                            fontSize: 15, lineHeight: 1.7,
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.65)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Policy Location:
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 15, lineHeight: 1.7,
                            fontWeight: 600,
                            color: "#fff",
                            whiteSpace: "nowrap",
                            maxWidth: 110,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {locationTriggerText}
                        </Typography>
                        <ChevronDown size={12} color="#fff" />
                      </Box>
                      <Box
                        onClick={(e) => setProfileAnchor(e.currentTarget)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                          pl: 0.5,
                          pr: 1.25,
                          height: 34,
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 999,
                          bgcolor: "rgba(255,255,255,0.1)",
                          cursor: "pointer",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
                        }}
                      >
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: "#f97316",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 15, lineHeight: 1.7,
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          RS
                        </Box>
                        <Box sx={{ lineHeight: 1 }}>
                          <Typography
                            sx={{
                              fontSize: 15, lineHeight: 1.7,
                              fontWeight: 600,
                              color: "#fff",
                              lineHeight: 1.25,
                            }}
                          >
                            Rajesh Singh
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 15, lineHeight: 1.7,
                              color: "rgba(255,255,255,0.75)",
                              lineHeight: 1,
                            }}
                          >
                            HR Admin
                          </Typography>
                        </Box>
                        <ChevronDown size={12} color="#fff" />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Route Context + Quick Actions Bar — below header */}
              <Box sx={{ position: "relative", flex: 1, overflow: "hidden" }}>
                <HRPageContent
                  ref={pageContentRef}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 52,
                    bottom: 0,
                    display: "flex",
                    flexDirection: "column",
                    ...(isPolicyFeature && {
                      paddingLeft: 0,
                      paddingRight: 0,
                      paddingBottom: 0,
                      paddingTop: 0,
                      overflow: "hidden",
                    }),
                  }}
                >
                  <Box sx={{ flex: "1 0 auto" }}>
                  <Routes>
                    <Route
                      index
                      element={<Navigate to="dashboard" replace />}
                    />
                    <Route
                      path="dashboard"
                      element={
                        <HRPortalDashboard key={portfolioCompanyId ?? "default"} companyId={portfolioCompanyId} onPolicyCount={setDashboardPolicyCount} locationIds={effectiveLocationIds} filterPolicyId={portfolioPolicyId ?? undefined} onClearPolicyFilter={() => navigate(location.pathname + location.search, { replace: true, state: { ...(location.state as object ?? {}), policyId: undefined } })} />
                      }
                    />
                    <Route
                      path="employees"
                      element={<Navigate to="/hr-portal/enrollment" replace />}
                    />
                    <Route
                      path="enrollment"
                      element={<HRPortalEnrolmentV2 />}
                    />
                    <Route
                      path="inception-endorsement"
                      element={
                        <HRPortalEnrolmentV2
                          title="Initiate"
                          enrollmentTabLabel="Inception"
                        />
                      }
                    />
                    <Route
                      path="enrollment/:employeeId"
                      element={<HRPortalEmployeeProfile />}
                    />
                    <Route path="claims" element={<HRPortalClaims />} />
                    <Route
                      path="claims/:claimId"
                      element={<ClaimDetailPage />}
                    />
                    <Route path="reports" element={<HRPortalReports companyId={portfolioCompanyId} locationIds={effectiveLocationIds} locationLabel={locationTriggerText} />} />
                    <Route path="hospitals" element={<HRPortalHospitals companyId={portfolioCompanyId} />} />
                    <Route path="insights" element={<HRPortalInsightsV2 />} />
                    <Route path="portfolio" element={<HRPortalPortfolio locationIds={effectiveLocationIds} />} />
                    <Route
                      path="policies/:policyId"
                      element={<PolicyDetail />}
                    />
                    <Route
                      path="policy-detail-v2/:policyId"
                      element={<HRPortalPolicyDetailV2 />}
                    />
                    <Route path="finance" element={<HRPortalFinance />} />
                    <Route path="settings" element={<HRPortalSettings />} />
                    <Route
                      path="user-management"
                      element={<HRPortalUserManagement />}
                    />
                    <Route path="complaints" element={<HRPortalComplaints companyId={portfolioCompanyId} />} />
                    <Route path="enrollment-status" element={<HRPortalEnrollment companyId={portfolioCompanyId} />} />
                    <Route
                      path="intimate-claim"
                      element={<HRPortalIntimateClaimPage companyId={portfolioCompanyId} />}
                    />
                    <Route
                      path="policy-summary/:policyId"
                      element={<HRPortalPolicySummary locationIds={effectiveLocationIds} />}
                    />
                    <Route
                      path="employee-search"
                      element={<HRPortalEmployeeSearch />}
                    />
                    <Route
                      path="policy-feature/:policyId"
                      element={<HRPortalPolicyFeature />}
                    />
                    <Route
                      path="zoho-endorsement"
                      element={<ZohoEndorsementPage />}
                    />
                    <Route
                      path="*"
                      element={<Navigate to="dashboard" replace />}
                    />
                  </Routes>
                  </Box>
                  {!isPolicyFeature && (
                    <Box sx={{ mx: -3, mb: -3, mt: 4, position: "relative", zIndex: 25 }}>
                      <Footer />
                    </Box>
                  )}
                </HRPageContent>

                {/* ── Quick Actions Panel ──────────────────────────── */}
                <Box
                  onMouseEnter={() => setQuickActionsExpanded(true)}
                  onMouseLeave={() => setQuickActionsExpanded(false)}
                  sx={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: quickActionsExpanded ? 220 : 52,
                    bgcolor: "#FFFFFF",
                    borderLeft: "1px solid #E4EBF3",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 20,
                    transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
                    overflow: "hidden",
                    boxShadow: quickActionsExpanded
                      ? "-4px 0 24px rgba(28,87,184,0.08)"
                      : "none",
                  }}
                >
                  {/* Panel header */}
                  <Box
                    sx={{
                      height: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: quickActionsExpanded ? "flex-start" : "center",
                      px: quickActionsExpanded ? 2.5 : 0,
                      borderBottom: "1px solid #EEF2F7",
                      flexShrink: 0,
                      gap: 1,
                    }}
                  >
                    {quickActionsExpanded ? (
                      <>
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: "#1C57B8",
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: 15, lineHeight: 1.7,
                            fontWeight: 700,
                            color: "#6B7280",
                            letterSpacing: "0.07em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Quick Actions
                        </Typography>
                      </>
                    ) : (
                      <Box
                        sx={{
                          width: 20,
                          height: 3,
                          borderRadius: 99,
                          bgcolor: "#D1D9E6",
                        }}
                      />
                    )}
                  </Box>

                  {/* Action items */}
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      pt: 1,
                      pb: 1,
                      gap: 0,
                      "&::-webkit-scrollbar": { display: "none" },
                    }}
                  >
                    {(
                      [
                        {
                          icon: <UserCheck size={16} />,
                          label: "Employee Details",
                          color: "#1C57B8",
                          bg: "#EBF3FF",
                          onClick: () => { setQaEmpSearch(""); setQaEmpOpen(true); },
                        },
                        {
                          icon: <CreditCard size={16} />,
                          label: "Insurance E-Card",
                          color: "#7C3AED",
                          bg: "#F3F0FF",
                          onClick: () => { setQaECardSearch(""); setQaECardOpen(true); },
                        },
                        {
                          icon: <FileText size={16} />,
                          label: "Claim Status",
                          color: "#059669",
                          bg: "#ECFDF5",
                          onClick: () => { setQaClaimSearch(""); setQaClaimOpen(true); },
                        },
                        {
                          icon: <Shield size={16} />,
                          label: "Claim Submission",
                          color: "#D97706",
                          bg: "#FFF7ED",
                          onClick: () => navigate("/hr-portal/intimate-claim"),
                        },
                      ] as {
                        icon: React.ReactNode;
                        label: string;
                        color: string;
                        bg: string;
                        onClick: () => void;
                      }[]
                    ).map((action) => (
                      <Tooltip
                        key={action.label}
                        title={quickActionsExpanded ? "" : action.label}
                        placement="left"
                        arrow
                        componentsProps={{
                          tooltip: {
                            sx: {
                              bgcolor: "#1F2937",
                              fontSize: 15, lineHeight: 1.7,
                              fontWeight: 500,
                              borderRadius: "6px",
                              px: 1.25,
                              py: 0.65,
                            },
                          },
                          arrow: { sx: { color: "#1F2937" } },
                        }}
                      >
                        <Box
                          onClick={action.onClick}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            pl: "10px",
                            pr: 1,
                            height: 50,
                            cursor: "pointer",
                            transition: "background 0.14s",
                            flexShrink: 0,
                            "&:hover": {
                              bgcolor: "#F5F8FF",
                              "& .qa-chip": { transform: "scale(1.08)" },
                              "& .qa-label": { color: action.color },
                            },
                          }}
                        >
                          <Box
                            className="qa-chip"
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "9px",
                              bgcolor: action.bg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: action.color,
                              flexShrink: 0,
                              transition: "transform 0.15s",
                            }}
                          >
                            {action.icon}
                          </Box>
                          <Typography
                            className="qa-label"
                            sx={{
                              fontSize: 15, lineHeight: 1.7,
                              fontWeight: 500,
                              color: "#374151",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              maxWidth: quickActionsExpanded ? 160 : 0,
                              opacity: quickActionsExpanded ? 1 : 0,
                              transition: "color 0.14s, max-width 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease",
                            }}
                          >
                            {action.label}
                          </Typography>
                        </Box>
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              </Box>

              {/* ── Quick Actions Dialogs ──────────────────────────────── */}
              {/* Employee Lookup */}
              <Dialog
                open={qaEmpOpen}
                onClose={() => setQaEmpOpen(false)}
                PaperProps={{
                  sx: { width: 480, borderRadius: "16px", overflow: "hidden" },
                }}
              >
                <Box
                  sx={{
                    px: 3.5,
                    py: 2.5,
                    borderBottom: "1px solid #E8EEF5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 700, color: "#111827" }}
                  >
                    Employee Details
                  </Typography>
                  <Box
                    onClick={() => setQaEmpOpen(false)}
                    sx={{ cursor: "pointer", display: "flex" }}
                  >
                    <X size={18} color="#6B7280" />
                  </Box>
                </Box>
                <DialogContent sx={{ p: 3.5 }}>
                  <Typography
                    sx={{
                      fontSize: 15, lineHeight: 1.7,
                      fontWeight: 600,
                      color: "#374151",
                      mb: 1.25,
                    }}
                  >
                    Employee Name or ID
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      px: 2,
                      height: 52,
                      border: "1.5px solid #D1D5DB",
                      borderRadius: "10px",
                      bgcolor: "#F9FAFB",
                      mb: 2.5,
                      "&:focus-within": {
                        borderColor: "#2C5FA9",
                        bgcolor: "#fff",
                      },
                    }}
                  >
                    <UserCheck size={15} color="#9CA3AF" />
                    <Box
                      component="input"
                      placeholder="e.g. EMP-10042"
                      value={qaEmpSearch}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setQaEmpSearch(e.target.value)
                      }
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter" && qaEmpSearch.trim()) {
                          setQaEmpOpen(false);
                          navigate(
                            `/hr-portal/enrollment/${qaEmpSearch.trim()}`
                          );
                        }
                      }}
                      sx={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: 15, lineHeight: 1.7,
                        color: "#111827",
                        "&::placeholder": { color: "#9CA3AF" },
                      }}
                    />
                    {qaEmpSearch && (
                      <Box
                        onClick={() => setQaEmpSearch("")}
                        sx={{ cursor: "pointer", display: "flex" }}
                      >
                        <X size={13} color="#9CA3AF" />
                      </Box>
                    )}
                  </Box>

                  {/* Live employee results */}
                  {(qaEmpLoading || qaEmpResults.length > 0) && (
                    <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "10px", overflow: "hidden", mb: 2, maxHeight: 220, overflowY: "auto" }}>
                      {qaEmpLoading && (
                        <Box sx={{ px: 2.5, py: 2, fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>Searching…</Box>
                      )}
                      {!qaEmpLoading && qaEmpResults.map((emp) => (
                        <Box
                          key={emp.dbId}
                          onClick={() => {
                            setQaEmpOpen(false);
                            setQaEmpSearch("");
                            setQaEmpResults([]);
                            navigate(`/hr-portal/enrollment/${emp.dbId}`);
                          }}
                          sx={{
                            px: 2.5, py: 1.5, display: "flex", alignItems: "center", gap: 1.5,
                            cursor: "pointer", borderBottom: "1px solid #F3F4F6",
                            "&:last-child": { borderBottom: "none" },
                            "&:hover": { bgcolor: "#F5F8FF" },
                          }}
                        >
                          <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "#EAF2FF", color: "#2556A6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, lineHeight: 1.7, fontWeight: 700, flexShrink: 0 }}>
                            {emp.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase()}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827" }}>{emp.name}</Typography>
                              {emp.isVip && <Box sx={{ px: 1, py: 0.1, borderRadius: 999, background: "#FEF3C7", border: "1px solid #FDE68A", color: "#D97706", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 0.5 }}><Star size={9} fill="#FCD34D" color="#D97706" /> VIP</Box>}
                            </Box>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280" }}>{emp.employeeCode}{emp.dept ? ` · ${emp.dept}` : ""}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                    <Button
                      onClick={() => { setQaEmpOpen(false); setQaEmpSearch(""); setQaEmpResults([]); }}
                      sx={{ height: 52, borderRadius: "12px", border: "1px solid #D8E0EA", textTransform: "none", color: "#475467", fontSize: 15, lineHeight: 1.7 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!qaEmpSearch.trim()}
                      onClick={() => {
                        if (!qaEmpSearch.trim()) return;
                        setQaEmpOpen(false);
                        setQaEmpResults([]);
                        navigate(`/hr-portal/enrollment/${qaEmpSearch.trim()}`);
                      }}
                      sx={{ height: 52, borderRadius: "12px", textTransform: "none", background: "#184C97", color: "#fff", fontSize: 15, lineHeight: 1.7, fontWeight: 600, "&:hover": { background: "#143F7D" }, "&.Mui-disabled": { background: "#E5E7EB", color: "#9CA3AF" } }}
                    >
                      View Profile
                    </Button>
                  </Box>
                </DialogContent>
              </Dialog>

              {/* Claim Status Lookup */}
              <Dialog
                open={qaClaimOpen}
                onClose={() => setQaClaimOpen(false)}
                PaperProps={{
                  sx: { width: 480, borderRadius: "16px", overflow: "hidden" },
                }}
              >
                <Box
                  sx={{
                    px: 3.5,
                    py: 2.5,
                    borderBottom: "1px solid #E8EEF5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 700, color: "#111827" }}
                  >
                    Claim Status
                  </Typography>
                  <Box
                    onClick={() => setQaClaimOpen(false)}
                    sx={{ cursor: "pointer", display: "flex" }}
                  >
                    <X size={18} color="#6B7280" />
                  </Box>
                </Box>
                <DialogContent sx={{ p: 3.5 }}>
                  <Typography
                    sx={{
                      fontSize: 15, lineHeight: 1.7,
                      fontWeight: 600,
                      color: "#374151",
                      mb: 1.25,
                    }}
                  >
                    Claim ID
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      px: 2,
                      height: 52,
                      border: "1.5px solid #D1D5DB",
                      borderRadius: "10px",
                      bgcolor: "#F9FAFB",
                      mb: 2.5,
                      "&:focus-within": {
                        borderColor: "#2C5FA9",
                        bgcolor: "#fff",
                      },
                    }}
                  >
                    <FileText size={15} color="#9CA3AF" />
                    <Box
                      component="input"
                      placeholder="e.g. CLM-2025-001"
                      value={qaClaimSearch}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setQaClaimSearch(e.target.value)
                      }
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter" && qaClaimSearch.trim()) {
                          const claimId = qaClaimSearch.trim().toUpperCase();
                          const match = MOCK_CLAIMS.find((c) => c.id.toUpperCase() === claimId);
                          setQaClaimOpen(false);
                          if (match) navigate(`/hr-portal/enrollment/${match.employeeId}`, { state: { tab: "history" } });
                          else navigate(`/hr-portal/employees`, { state: { tab: "history" } });
                        }
                      }}
                      sx={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: 15, lineHeight: 1.7,
                        color: "#111827",
                        "&::placeholder": { color: "#9CA3AF" },
                      }}
                    />
                    {qaClaimSearch && (
                      <Box
                        onClick={() => setQaClaimSearch("")}
                        sx={{ cursor: "pointer", display: "flex" }}
                      >
                        <X size={13} color="#9CA3AF" />
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                    <Button
                      onClick={() => { setQaClaimOpen(false); setQaClaimSearch(""); }}
                      sx={{ height: 52, borderRadius: "12px", border: "1px solid #D8E0EA", textTransform: "none", color: "#475467", fontSize: 15, lineHeight: 1.7 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!qaClaimSearch.trim()}
                      onClick={() => {
                        if (!qaClaimSearch.trim()) return;
                        setQaClaimOpen(false);
                        navigate(`/hr-portal/employees`, { state: { tab: "history", search: qaClaimSearch.trim() } });
                      }}
                      sx={{ height: 52, borderRadius: "12px", textTransform: "none", background: "#184C97", color: "#fff", fontSize: 15, lineHeight: 1.7, fontWeight: 600, "&:hover": { background: "#143F7D" }, "&.Mui-disabled": { background: "#E5E7EB", color: "#9CA3AF" } }}
                    >
                      View Claim
                    </Button>
                  </Box>
                </DialogContent>
              </Dialog>

              {/* Insurance E-Card Lookup */}
              <Dialog
                open={qaECardOpen}
                onClose={() => setQaECardOpen(false)}
                PaperProps={{
                  sx: { width: 460, borderRadius: "16px", overflow: "hidden" },
                }}
              >
                <Box
                  sx={{
                    px: 3.5,
                    py: 2.5,
                    borderBottom: "1px solid #E8EEF5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                        bgcolor: "#F3F0FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CreditCard size={18} color="#7C3AED" />
                    </Box>
                    <Typography
                      sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 700, color: "#111827" }}
                    >
                      Insurance E-Card
                    </Typography>
                  </Box>
                  <Box
                    onClick={() => setQaECardOpen(false)}
                    sx={{ cursor: "pointer", display: "flex" }}
                  >
                    <X size={18} color="#6B7280" />
                  </Box>
                </Box>
                <DialogContent sx={{ p: 3.5 }}>
                  <Typography
                    sx={{
                      fontSize: 15, lineHeight: 1.7,
                      fontWeight: 600,
                      color: "#374151",
                      mb: 0.75,
                    }}
                  >
                    Employee ID
                  </Typography>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", mb: 1.5 }}>
                    Enter an employee ID to view their insurance e-cards and
                    dependents.
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      px: 2,
                      height: 52,
                      border: "1.5px solid #D1D5DB",
                      borderRadius: "10px",
                      bgcolor: "#F9FAFB",
                      mb: 2.5,
                      "&:focus-within": {
                        borderColor: "#7C3AED",
                        bgcolor: "#fff",
                      },
                    }}
                  >
                    <CreditCard size={15} color="#9CA3AF" />
                    <Box
                      component="input"
                      placeholder="e.g. EMP-10042"
                      value={qaECardSearch}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setQaECardSearch(e.target.value)
                      }
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter" && qaECardSearch.trim()) {
                          const empId = qaECardSearch.trim();
                          setQaECardOpen(false);
                          navigate(`/hr-portal/enrollment/${empId}`, { state: { tab: "ecards" } });
                        }
                      }}
                      autoFocus
                      sx={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: 15, lineHeight: 1.7,
                        color: "#111827",
                        "&::placeholder": { color: "#9CA3AF" },
                      }}
                    />
                    {qaECardSearch && (
                      <Box
                        onClick={() => setQaECardSearch("")}
                        sx={{ cursor: "pointer", display: "flex" }}
                      >
                        <X size={13} color="#9CA3AF" />
                      </Box>
                    )}
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 1.5,
                    }}
                  >
                    <Button
                      onClick={() => setQaECardOpen(false)}
                      sx={{
                        height: 52,
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
                      disabled={!qaECardSearch.trim()}
                      onClick={() => {
                        if (!qaECardSearch.trim()) return;
                        const empId = qaECardSearch.trim();
                        setQaECardOpen(false);
                        navigate(`/hr-portal/enrollment/${empId}`, { state: { tab: "ecards" } });
                      }}
                      sx={{
                        height: 52,
                        borderRadius: "12px",
                        textTransform: "none",
                        background: "#7C3AED",
                        color: "#fff",
                        fontSize: 15, lineHeight: 1.7,
                        fontWeight: 600,
                        "&:hover": { background: "#6D28D9" },
                        "&.Mui-disabled": {
                          background: "#E5E7EB",
                          color: "#9CA3AF",
                        },
                      }}
                    >
                      Get E-Cards
                    </Button>
                  </Box>
                </DialogContent>
              </Dialog>

              {/* E-Card right-side overlay panel */}
              {qaECardDrawerOpen &&
                (() => {
                  const empIdNorm = qaECardEmpId.trim().toUpperCase();
                  const emp =
                    MOCK_EMPLOYEES.find(
                      (e) => e.id.toUpperCase() === empIdNorm
                    ) || MOCK_EMPLOYEES[0];
                  const deps = emp ? MOCK_DEPENDENTS[emp.id] ?? [] : [];
                  return (
                    <>
                      {/* Backdrop */}
                      <Box
                        onClick={() => setQaECardDrawerOpen(false)}
                        sx={{
                          position: "absolute",
                          inset: 0,
                          bgcolor: "rgba(15, 23, 42, 0.38)",
                          zIndex: 400,
                        }}
                      />
                      {/* Panel */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          bottom: 0,
                          width: 370,
                          zIndex: 500,
                          bgcolor: "#F1F5F9",
                          boxShadow: "-4px 0 32px rgba(15,23,42,0.18)",
                          display: "flex",
                          flexDirection: "column",
                          overflow: "hidden",
                        }}
                      >
                        {/* Panel header */}
                        <Box
                          sx={{
                            px: 2.75,
                            py: 2,
                            borderBottom: "1px solid #E2E8F0",
                            bgcolor: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexShrink: 0,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: "9px",
                                bgcolor: "#F3F0FF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Shield size={17} color="#7C3AED" />
                            </Box>
                            <Box>
                              <Typography
                                sx={{
                                  fontSize: 15, lineHeight: 1.7,
                                  fontWeight: 700,
                                  color: "#0F172A",
                                  lineHeight: 1.2,
                                }}
                              >
                                Insurance E-Cards
                              </Typography>
                              <Typography
                                sx={{ fontSize: 15, lineHeight: 1.7, color: "#94A3B8", mt: 0.2 }}
                              >
                                {emp ? emp.name : qaECardEmpId}
                              </Typography>
                            </Box>
                          </Box>
                          <Box
                            onClick={() => setQaECardDrawerOpen(false)}
                            sx={{
                              cursor: "pointer",
                              display: "flex",
                              p: 0.75,
                              borderRadius: "7px",
                              "&:hover": { bgcolor: "#F1F5F9" },
                            }}
                          >
                            <X size={16} color="#64748B" />
                          </Box>
                        </Box>

                        {/* Cards scroll area */}
                        <Box
                          sx={{
                            flex: 1,
                            overflowY: "auto",
                            px: 2.25,
                            py: 2.25,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                          }}
                        >
                          {!emp ? (
                            /* ── Employee not found ── */
                            <Box
                              sx={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1.25,
                                py: 6,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: "14px",
                                  bgcolor: "#FEF2F2",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <User size={22} color="#EF4444" />
                              </Box>
                              <Typography
                                sx={{
                                  fontSize: 15, lineHeight: 1.7,
                                  fontWeight: 700,
                                  color: "#1E293B",
                                  textAlign: "center",
                                }}
                              >
                                Employee not found
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: 15, 
                                  color: "#94A3B8",
                                  textAlign: "center",
                                  lineHeight: 1.6,
                                  maxWidth: 240,
                                }}
                              >
                                No record found for{" "}
                                <strong style={{ color: "#475569" }}>
                                  {qaECardEmpId}
                                </strong>
                                . Please verify the employee ID.
                              </Typography>
                              <Box
                                onClick={() => {
                                  setQaECardDrawerOpen(false);
                                  setQaECardSearch("");
                                  setQaECardOpen(true);
                                }}
                                sx={{
                                  mt: 0.75,
                                  px: 2.5,
                                  py: 1,
                                  borderRadius: "8px",
                                  bgcolor: "#7C3AED",
                                  color: "#fff",
                                  fontSize: 15, lineHeight: 1.7,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  "&:hover": { bgcolor: "#6D28D9" },
                                }}
                              >
                                Try another ID
                              </Box>
                            </Box>
                          ) : (
                            <>
                              {/* Employee card */}
                              <Typography
                                sx={{
                                  fontSize: 15, lineHeight: 1.7,
                                  fontWeight: 700,
                                  color: "#64748B",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.07em",
                                  mb: 0.75,
                                }}
                              >
                                Employee
                              </Typography>
                              <ECard
                                name={emp.name}
                                empId={emp.id}
                                relation="Self"
                                policy={emp.policy}
                                subtitle={emp.dept}
                              />

                              {/* Dependent cards */}
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  mt: 1,
                                  mb: 0.75,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: 15, lineHeight: 1.7,
                                    fontWeight: 700,
                                    color: "#64748B",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.07em",
                                  }}
                                >
                                  Dependents
                                </Typography>
                                <Box
                                  sx={{
                                    px: 1.25,
                                    py: 0.2,
                                    borderRadius: 999,
                                    bgcolor:
                                      deps.length > 0 ? "#EDE9FE" : "#F1F5F9",
                                    fontSize: 15, lineHeight: 1.7,
                                    fontWeight: 700,
                                    color:
                                      deps.length > 0 ? "#7C3AED" : "#94A3B8",
                                  }}
                                >
                                  {deps.length} enrolled
                                </Box>
                              </Box>

                              {deps.length > 0 ? (
                                deps.map((dep, i) => (
                                  <ECard
                                    key={i}
                                    name={dep.name}
                                    empId={emp.id}
                                    relation={dep.relation}
                                    policy={emp.policy}
                                    subtitle={`DOB: ${dep.dob}`}
                                  />
                                ))
                              ) : (
                                <Box
                                  sx={{
                                    px: 2,
                                    py: 2.5,
                                    borderRadius: "12px",
                                    border: "1px dashed #CBD5E1",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 0.75,
                                    bgcolor: "#fff",
                                  }}
                                >
                                  <User size={20} color="#CBD5E1" />
                                  <Typography
                                    sx={{
                                      fontSize: 15, lineHeight: 1.7,
                                      color: "#94A3B8",
                                      textAlign: "center",
                                    }}
                                  >
                                    No dependents enrolled
                                  </Typography>
                                </Box>
                              )}
                            </>
                          )}
                        </Box>
                      </Box>
                    </>
                  );
                })()}
            </HRMainContent>
          </HRDesignFrame>
        </HRDesignViewport>
      </HRPortalRoot>
    </ThemeProvider>
  );
}

export default HRPortal;
