import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  Menu,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  Ban,
  BriefcaseBusiness,
  CalendarClock,
  ChevronDown,
  CircleCheck,
  Eye,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  ShieldCheck,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import {
  endPoints,
  formatAmountWithCurrency,
  getCurrencySymbolPrefix,
  LocalizationConfig,
  useApiMutation,
  useLocalization,
} from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { getCompanyId, getSubdomainFromUrl } from "../../utils/companyConfig";
import { capitalizeFirst } from "../../utils";
import type { BackendActivity } from "../../utils/map-activity-log";

type EnrolledPerson = {
  name: string | null;
  relationship: string | null;
  dob: string | null;
  gender: string | null;
};

type PolicyComponent = {
  componentLabel: string | null;
  sumInsured: number;
  companyPay: number;
  employeePay: number;
  enrolledPeople: EnrolledPerson[];
};

type PolicyInfo = {
  policyId: number;
  policyName: string;
  policyNumber: string | null;
  insurerPolicyNumber: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  insurerName: string | null;
  policyStatus?: "Active" | "Expired" | null;
  sumInsured: number;
  availableBalance: number;
  enrollmentStatus: string | null;
  enrollmentStartDate: string | null;
  enrollmentEndDate: string | null;
  components?: PolicyComponent[];
};

type EmployeeProfileData = {
  employeeId: number;
  companyEmployeeId: string;
  employeeName: string;
  gender: string | null;
  designation: string | null;
  department: string | null;
  location: string | null;
  dateOfJoining: string | null;
  maritalStatus: string | null;
  email: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  alternateEmail: string | null;
  userStatus: string | null;
  enrollmentStatus: string | null;
  sumInsured: number;
  availableBalance: number;
  lastActivityDate: string | null;
  policyId: number | null;
  ecardKey: string | null;
  alternatePhone: string | null;
  dependents: Array<{ name: string | null; relationship: string | null; dob: string | null; gender: string | null }> | null;
  dependentsCount: number;
  policies: PolicyInfo[];
  employeeStatus?: string | null;
  isBlocked?: boolean;
  isVip?: boolean;
  // legacy fields (returned by older backend — used as fallback)
  policyName?: string | null;
  effectiveDate?: string | null;
  expiryDate?: string | null;
};

const fmtAmount = (n: number, localization?: LocalizationConfig) =>
  n >= 100000 ? `${getCurrencySymbolPrefix(localization)}${(n / 100000).toFixed(2)}L` : `${formatAmountWithCurrency(n, localization)}`;

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const calcTenure = (dateOfJoining: string | null): string => {
  if (!dateOfJoining) return "—";
  const diff = Date.now() - new Date(dateOfJoining).getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  return years > 0 ? `${years} year${years > 1 ? "s" : ""}` : "< 1 year";
};

const userStatusLabel = (key: string | null) =>
  key === "USER_STATUS_ACTIVE" ? "Active" : key ? "Inactive" : "—";

const enrollmentStatusLabel = (key: string | null): string | null => {
  if (!key) return null;
  if (key.includes("NOT_STARTED")) return "Not Started";
  if (key.includes("IN_PROGRESS")) return "In Progress";
  if (key.includes("ENDORSEMENT_SENT")) return "Endorsement Sent";
  if (key.includes("ENROLLED")) return "Enrolled";
  return key.replace(/_/g, " ");
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}


export function HRPortalEmployeeProfile() {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const routeLocation = useLocation();
  const { localizationData } = useLocalization();
  const initialTab = (routeLocation.state as { tab?: string } | null)?.tab;
  const [activeTab, setActiveTab] = useState<"profile" | "ecards" | "history">(
    initialTab === "ecards" ? "ecards" : initialTab === "history" ? "history" : "profile"
  );
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<{
    email: string; phone: string; department: string; location: string;
  } | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isVIP, setIsVIP] = useState(false);
  const [profile, setProfile] = useState<EmployeeProfileData | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const { mutate: fetchProfile, isPending: loading } = useApiMutation({
    config: {
      onSuccess: (res: any) => {
        setProfileError(null);
        const p = res?.data?.data?.[0] ?? null;
        setProfile(p);
        if (p) {
          setIsVIP(!!p.isVip);
          setIsBlocked(!!p.isBlocked);
        }
      },
      onError: (err: any) => {
        setProfileError(err?.message ?? "Failed to load profile");
        setProfile(null);
      },
    },
  });

  useEffect(() => {
    if (!employeeId) return;
    const isNumericId = /^\d+$/.test(employeeId);
    // Skip re-fetch when the profile is already loaded for this exact numeric ID
    // (happens after navigating from a search URL to the resolved numeric URL)
    if (isNumericId && profile?.employeeId === Number(employeeId)) return;
    fetchProfile({
      endpoint: endPoints.hrEmployeeProfile,
      method: "POST",
      data: isNumericId
        ? { employeeId: Number(employeeId) }
        : { search: employeeId },
    });
  }, [employeeId]);

  // After a string-search resolves, redirect to the numeric ID URL so the
  // canonical URL is stable. If no employee found, stay put (shows not-found UI).
  useEffect(() => {
    if (!employeeId || /^\d+$/.test(employeeId) || loading) return;
    if (profile?.employeeId) {
      navigate(`/hr-portal/enrollment/${profile.employeeId}`, { replace: true });
    }
  }, [profile, loading, employeeId]);

  const { mutate: updateVip } = useApiMutation({
    config: {
      onSuccess: (_res: any, vars: any) => setIsVIP(vars?.data?.isVip ?? isVIP),
      onError: () => setIsVIP((v) => !v), // revert optimistic update on failure
    },
  });

  const handleToggleVip = () => {
    if (!profile?.employeeId) return;
    const next = !isVIP;
    setIsVIP(next); // optimistic
    setActionMenuAnchor(null);
    updateVip({ endpoint: endPoints.hrEmployeeVip(profile.employeeId), method: "PUT", data: { isVip: next } });
  };

  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Enrollment confirmation email preview (per policy) ──────────────────────
  const [confirmationLoadingPolicyId, setConfirmationLoadingPolicyId] = useState<number | null>(null);
  const [mailPreview, setMailPreview] = useState<{
    open: boolean;
    loading: boolean;
    policyName: string;
    subject: string | null;
    html: string | null;
    error: string | null;
  }>({ open: false, loading: false, policyName: "", subject: null, html: null, error: null });

  const handleViewEnrollmentConfirmation = async (pol: PolicyInfo) => {
    if (!profile?.employeeId || confirmationLoadingPolicyId != null) return;
    setConfirmationLoadingPolicyId(pol.policyId);
    setMailPreview({ open: true, loading: true, policyName: pol.policyName, subject: null, html: null, error: null });
    try {
      const logsRes = await apiRequest(
        `${endPoints.getActivityLogs}?employeeId=${profile.employeeId}&activityKey=CONFIRMATION_EMAIL_SENT`
      );
      const logs: BackendActivity[] = Array.isArray(logsRes?.data) ? logsRes.data : [];
      // Backend already orders these DESC by actionDate, so the first match is the latest.
      const latest = logs.find((log) => {
        const policyIds = (log.metadata ?? log.meta)?.policyIds;
        return Array.isArray(policyIds) && policyIds.includes(pol.policyId);
      });

      if (!latest?.referenceId) {
        setMailPreview((p) => ({ ...p, loading: false, error: `No enrollment confirmation email found for ${pol.policyName}.` }));
        return;
      }

      const infoRes = await apiRequest(endPoints.getNotificationInfoById(latest.referenceId));
      const info = infoRes?.data;
      if (!info?.renderedHtml) {
        setMailPreview((p) => ({ ...p, loading: false, error: "This confirmation email has no preview content." }));
        return;
      }
      setMailPreview({ open: true, loading: false, policyName: pol.policyName, subject: info.subject ?? null, html: info.renderedHtml, error: null });
    } catch {
      setMailPreview((p) => ({ ...p, loading: false, error: "Failed to load the enrollment confirmation email. Please try again." }));
    } finally {
      setConfirmationLoadingPolicyId(null);
    }
  };

  const { mutate: updateBlock } = useApiMutation({
    config: {
      onSuccess: (_res: any, vars: any) => {
        setActionMsg({ type: "success", text: vars?.data?.isBlocked ? "Employee has been blocked." : "Employee has been unblocked." });
      },
      onError: () => {
        setIsBlocked((b) => !b); // revert optimistic update on failure
        setActionMsg({ type: "error", text: "Failed to update block status. Please try again." });
      },
    },
  });

  const handleToggleBlock = () => {
    if (!profile?.employeeId) return;
    const next = !isBlocked;
    setIsBlocked(next); // optimistic
    setActionMenuAnchor(null);
    updateBlock({ endpoint: endPoints.hrEmployeeBlock(profile.employeeId), method: "PUT", data: { isBlocked: next } });
  };

  const { mutate: sendWelcomeEmail, isPending: sendingWelcome } = useApiMutation({
    config: {
      onSuccess: () => setActionMsg({ type: "success", text: "Welcome email sent successfully." }),
      onError: () => setActionMsg({ type: "error", text: "Failed to send welcome email. Please try again." }),
    },
  });

  const handleSendWelcomeEmail = () => {
    if (!profile?.employeeId) return;
    const policyIds = (profile.policies ?? []).map((p) => p.policyId).filter(Boolean);
    const policyId = policyIds[0] ?? profile.policyId ?? undefined;
    setActionMenuAnchor(null);
    sendWelcomeEmail({
      endpoint: endPoints.sendWelcomeEmail,
      method: "POST",
      data: { employeeId: profile.employeeId, policyId, policyIds: policyIds.length ? policyIds : undefined },
    });
  };

  const { mutate: sendReminderEmail, isPending: sendingReminder } = useApiMutation({
    config: {
      onSuccess: () => setActionMsg({ type: "success", text: "Reminder email sent successfully." }),
      onError: () => setActionMsg({ type: "error", text: "Failed to send reminder email. Please try again." }),
    },
  });

  const handleSendReminderEmail = () => {
    if (!profile?.employeeId) return;
    setActionMenuAnchor(null);
    sendReminderEmail({
      endpoint: endPoints.sendReminderEmail,
      method: "POST",
      data: { employees: [profile.employeeId], forceImmediate: true },
    });
  };

  const [resetMsg, setResetMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Enrollment window extension dialog ──────────────────────────────────────
  type EnrollWindowRow = { policyId: number; policyName: string; policyNumber: string | null; expiryDate: string | null; insurerName: string | null; startDate: string; endDate: string };
  const [enrollWindowOpen, setEnrollWindowOpen] = useState(false);
  const [enrollWindowRows, setEnrollWindowRows] = useState<EnrollWindowRow[]>([]);
  const [enrollWindowSaving, setEnrollWindowSaving] = useState(false);
  const [enrollWindowMsg, setEnrollWindowMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleOpenEnrollWindow = () => {
    const rows: EnrollWindowRow[] = (profile?.policies ?? []).map((pol) => ({
      policyId: pol.policyId,
      policyName: pol.policyName ?? `Policy #${pol.policyId}`,
      policyNumber: pol.policyNumber ?? null,
      expiryDate: pol.expiryDate ?? null,
      insurerName: pol.insurerName ?? null,
      startDate: pol.enrollmentStartDate ?? "",
      endDate: pol.enrollmentEndDate ?? "",
    }));
    setEnrollWindowRows(rows);
    setEnrollWindowMsg(null);
    setActionMenuAnchor(null);
    setEnrollWindowOpen(true);
  };

  const updateEnrollRow = (policyId: number, field: "startDate" | "endDate", value: string) => {
    setEnrollWindowRows((prev) => prev.map((r) => r.policyId === policyId ? { ...r, [field]: value } : r));
  };

  const handleSaveEnrollWindow = async () => {
    if (!employeeId || enrollWindowRows.length === 0) return;
    setEnrollWindowSaving(true);
    setEnrollWindowMsg(null);
    try {
      await Promise.all(
        enrollWindowRows.map((row) =>
          apiRequest(endPoints.hrUpdateEnrollmentWindow(Number(employeeId)), {
            method: "PUT",
            data: {
              policyId: row.policyId,
              enrollmentStartDate: row.startDate || null,
              enrollmentEndDate: row.endDate || null,
            },
          })
        )
      );
      setEnrollWindowMsg({ type: "success", text: "Enrollment window updated successfully." });
      setEnrollWindowOpen(false);
      fetchProfile({ endpoint: endPoints.hrEmployeeProfile, method: "POST", data: { employeeId: Number(employeeId) } });
    } catch (err: any) {
      setEnrollWindowMsg({ type: "error", text: err?.response?.data?.message ?? err?.message ?? "Failed to update enrollment window." });
    } finally {
      setEnrollWindowSaving(false);
    }
  };

  const { mutate: sendResetPassword, isPending: resetLoading } = useApiMutation({
    config: {
      onSuccess: () => setResetMsg({ type: "success", text: "Password reset email sent successfully." }),
      onError: (err: any) => {
        const msg = err?.response?.data?.message ?? err?.message ?? "Failed to send reset email. Please try again.";
        setResetMsg({ type: "error", text: msg });
      },
    },
  });

  const [claimHistory, setClaimHistory] = useState<any[]>([]);
  const [claimHistoryLoading, setClaimHistoryLoading] = useState(false);
  const { mutate: fetchClaimHistory } = useApiMutation({
    config: {
      onSuccess: (res: any) => {
        setClaimHistory(res?.data?.data ?? res?.data ?? []);
        setClaimHistoryLoading(false);
      },
      onError: () => setClaimHistoryLoading(false),
    },
  });

  useEffect(() => {
    if (activeTab !== "history" || !profile?.policyId || !profile?.employeeId) return;
    setClaimHistoryLoading(true);
    fetchClaimHistory({
      endpoint: endPoints.generateHRReports + "policy_claim_history?limit=0",
      method: "POST",
      data: {
        policyId: profile.policyId,
        employeeId: String(profile.employeeId),
        claimStatus: "",
        claimType: "",
        startYear: "",
        endYear: "",
        search: "",
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
        locationIds: "",
      },
    });
  }, [activeTab, profile?.policyId, profile?.employeeId]);

  const [eCardPdfUrl, setECardPdfUrl] = useState<string | null>(null);
  const [eCardError, setECardError] = useState(false);

  const { mutate: fetchECardUrl, isPending: eCardLoading } = useApiMutation({
    config: {
      onSuccess: (res: any) => {
        const url = res?.data?.signedUrl ?? null;
        setECardPdfUrl(url);
        if (!url) setECardError(true);
      },
      onError: () => setECardError(true),
    },
  });

  useEffect(() => {
    if (activeTab !== "ecards" || !profile?.companyEmployeeId || eCardPdfUrl || eCardError) return;
    const companyId = getCompanyId();
    if (!companyId) return;
    fetchECardUrl({
      endpoint: endPoints.eCardSignedUrl,
      method: "POST",
      data: { companyId, companyEmployeeId: profile.companyEmployeeId },
    });
  }, [activeTab, profile?.companyEmployeeId]);

  const handleResetPassword = () => {
    setActionMenuAnchor(null);
    const email = profile?.email ?? profile?.alternateEmail;
    if (!email) {
      setResetMsg({ type: "error", text: "No email address on file for this employee." });
      return;
    }
    sendResetPassword({
      endpoint: endPoints.ibpSendResetMailByEmail(email, getSubdomainFromUrl() ?? undefined),
      method: "POST",
      data: {},
    });
  };

  const name = profile?.employeeName ?? "—";
  const companyEmpId = profile?.companyEmployeeId ?? "—";
  const department = profile?.department ?? "—";
  const location = profile?.location ?? "—";
  const gender = profile?.gender ?? "—";
  const designation = profile?.designation ?? "—";
  const statusLabel = userStatusLabel(profile?.userStatus ?? null);
  const tenure = calcTenure(profile?.dateOfJoining ?? null);
  const dependents = profile?.dependents ?? [];

  const handleEditOpen = () => {
    setEditValues({
      email: profile?.alternateEmail ?? "",
      phone: "",
      department,
      location,
    });
    setIsEditing(true);
    setActionMenuAnchor(null);
  };

  return (
    <Box sx={{ mx: -3, height: "100%", background: "#F5F8FF", display: "flex", flexDirection: "column", position: "relative", zIndex: 0 }}>

      {/* ── Top action bar ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          minHeight: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pl: 3,
          pr: 9,
          background: "#fff",
          borderBottom: "1px solid #E5E7EB",
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            onClick={() => navigate(-1)}
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: "#6B7280", fontSize: 15, lineHeight: 1.7, fontWeight: 500, cursor: "pointer", "&:hover": { color: "#111827" } }}
          >
            <ArrowLeft size={14} />
          </Box>
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827" }}>{loading ? "Employee Profile" : name}</Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mr: 6 }}>
          {/* Submit Claim button */}
          <Button
            onClick={() => navigate("/hr-portal/intimate-claim", {
              state: {
                employeeId: companyEmpId,
                employeeName: name,
                dependents: dependents.map((d) => ({ label: d.name ?? "", relationship: d.relationship ?? "" })),
              },
            })}
            sx={{ height: 36, px: 2.25, borderRadius: "10px", textTransform: "none", fontSize: 15, lineHeight: 1.7, fontWeight: 600, bgcolor: "#1C57B8", color: "#fff", boxShadow: "none", "&:hover": { bgcolor: "#163F8A", boxShadow: "none" } }}
          >
            Submit Claim
          </Button>

          {/* Actions dropdown */}
          <Button
            endIcon={<ChevronDown size={13} />}
            onClick={(e) => setActionMenuAnchor(e.currentTarget)}
            sx={{ height: 36, px: 2, borderRadius: "10px", textTransform: "none", fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151", border: "1px solid #D1D5DB", bgcolor: "#fff", boxShadow: "none", "&:hover": { bgcolor: "#F9FAFB", boxShadow: "none" } }}
          >
            Actions
          </Button>
        </Box>

        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={() => setActionMenuAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ sx: { borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.14)", minWidth: 200, mt: 0.75 } }}
        >
          <MenuItem onClick={handleEditOpen} sx={{ gap: 1.5, py: 2.25, fontSize: 15, lineHeight: 1.7, fontWeight: 500 }}>
            <Pencil size={15} color="#4B5563" /> Edit Employee
          </MenuItem>
          <MenuItem
            onClick={handleToggleVip}
            sx={{ gap: 1.5, py: 2.25, fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: isVIP ? "#D97706" : "inherit" }}
          >
            <Star size={15} color={isVIP ? "#D97706" : "#4B5563"} fill={isVIP ? "#D97706" : "none"} />
            {isVIP ? "Remove VIP Tag" : "Tag as VIP"}
          </MenuItem>
          <MenuItem
            onClick={handleToggleBlock}
            sx={{ gap: 1.5, py: 2.25, fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: isBlocked ? "#DC2626" : "inherit" }}
          >
            <Ban size={15} color={isBlocked ? "#DC2626" : "#4B5563"} />
            {isBlocked ? "Unblock Employee" : "Block Employee"}
          </MenuItem>
          <MenuItem onClick={handleSendWelcomeEmail} disabled={sendingWelcome || isBlocked} sx={{ gap: 1.5, py: 2.25, fontSize: 15, lineHeight: 1.7, fontWeight: 500 }}>
            <Mail size={15} color="#4B5563" /> Send Welcome Email
          </MenuItem>
          <MenuItem onClick={handleSendReminderEmail} disabled={sendingReminder || isBlocked} sx={{ gap: 1.5, py: 2.25, fontSize: 15, lineHeight: 1.7, fontWeight: 500 }}>
            <Mail size={15} color="#4B5563" /> Send Reminder Email
          </MenuItem>
          <MenuItem onClick={handleResetPassword} disabled={resetLoading || isBlocked} sx={{ gap: 1.5, py: 2.25, fontSize: 15, lineHeight: 1.7, fontWeight: 500 }}>
            <RotateCcw size={15} color="#4B5563" /> Reset Password
          </MenuItem>
          <MenuItem
            onClick={handleOpenEnrollWindow}
            disabled={!profile?.policies?.length}
            sx={{ gap: 1.5, py: 2.25, fontSize: 15, lineHeight: 1.7, fontWeight: 500 }}
          >
            <CalendarClock size={15} color="#4B5563" /> Edit Enrollment Window
          </MenuItem>
        </Menu>
      </Box>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "center", background: "#fff", borderBottom: "1px solid #E5E7EB", px: 3, width: "calc(100% + 96px)", flexShrink: 0 }}>
        {([
          { id: "profile", label: "Profile Overview" },
          { id: "ecards", label: "E-Cards" },
          { id: "history", label: "Claim History" },
        ] as const).map((tab) => (
          <Box
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            sx={{
              px: 3, py: 1.75, fontSize: 15, lineHeight: 1.7, fontWeight: activeTab === tab.id ? 600 : 500,
              color: activeTab === tab.id ? "#2556A6" : "#6B7280",
              borderBottom: activeTab === tab.id ? "2px solid #2556A6" : "2px solid transparent",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </Box>
        ))}
      </Box>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 3.5, py: 3, display: "flex", flexDirection: "column", gap: 2, "&::-webkit-scrollbar": { width: 5 }, "&::-webkit-scrollbar-thumb": { background: "#D1D5DB", borderRadius: 4 } }}>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10 }}>
              <CircularProgress sx={{ color: "#2556A6" }} />
            </Box>
          ) : !profile ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 12, gap: 2, textAlign: "center" }}>
              <Box sx={{ width: 72, height: 72, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UserRound size={36} color="#9CA3AF" />
              </Box>
              <Typography sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 700, color: "#374151" }}>Employee Not Found</Typography>
              <Typography sx={{ fontSize: 15, color: "#9CA3AF", maxWidth: 340, lineHeight: 1.7 }}>
                {profileError ?? "No employee record matches the provided name or ID. Please check the search value and try again."}
              </Typography>
              <Box
                onClick={() => navigate(-1)}
                sx={{ mt: 1, px: 3, py: 2.25, borderRadius: "8px", bgcolor: "#1C57B8", color: "#fff", cursor: "pointer", fontSize: 15, lineHeight: 1.7, fontWeight: 600, "&:hover": { bgcolor: "#152E5A" } }}
              >
                Go Back
              </Box>
            </Box>
          ) : <>

          {/* ── Profile Overview tab ─────────────────────────────────────── */}
          {activeTab === "profile" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

              {/* Hero identity card */}
              <Box sx={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2.5 }}>
                  {/* Orange avatar */}
                  <Box sx={{ width: 72, height: 72, borderRadius: "50%", background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, flexShrink: 0 }}>
                    {initials(name)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
                    <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{name}</Typography>
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", mt: 0.75 }}>
                      {[designation !== "—" ? designation : null, department !== "—" ? department : null, location !== "—" ? location : null].filter(Boolean).join(" | ") || companyEmpId}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.75, mt: 1, flexWrap: "wrap" }}>
                      <Box sx={{ px: 1.5, py: 0.35, borderRadius: 999, background: statusLabel === "Active" ? "#DCFCE7" : "#F3F4F6", border: `1px solid ${statusLabel === "Active" ? "#BBF7D0" : "#D1D5DB"}`, color: statusLabel === "Active" ? "#16A34A" : "#6B7280", fontSize: 15, lineHeight: 1.7, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                        <CircleCheck size={10} /> {statusLabel}
                      </Box>
                      {isVIP && <Box sx={{ px: 1.5, py: 0.35, borderRadius: 999, background: "#FEF3C7", border: "1px solid #FDE68A", color: "#D97706", fontSize: 15, lineHeight: 1.7, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 0.5 }}><Star size={10} fill="#FCD34D" /> VIP</Box>}
                      {isBlocked && <Box sx={{ px: 1.5, py: 0.35, borderRadius: 999, background: "#FEE2E2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 15, lineHeight: 1.7, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 0.5 }}><Ban size={10} /> Blocked</Box>}
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Single flat info card */}
              <Box sx={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", p: 3 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2.5 }}>
                  {[
                    { label: "Email", value: profile?.email ?? profile?.alternateEmail ?? "—" },
                    { label: "DOB", value: profile?.dateOfBirth ? fmtDate(profile.dateOfBirth) : "—" },
                    { label: "Gender", value: gender },
                    { label: "Phone", value: profile?.phone ?? profile?.alternatePhone ?? "—" },
                    { label: "Department", value: department },
                    // { label: "Date of Joining", value: profile?.dateOfJoining ? fmtDate(profile.dateOfJoining) : "—" },
                    { label: "Location", value: location },
                    { label: "Tenure", value: tenure },
                    { label: "Marital Status", value: profile?.maritalStatus ?? "—" },
                    { label: "Last Active", value: profile?.lastActivityDate ? fmtDate(profile.lastActivityDate) : "—" },
                  ].filter(({ value }) => value !== "—" || true).map(({ label, value }) => (
                    <Box key={label}>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.75 }}>{label}</Typography>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: "#111827", wordBreak: "break-all" }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Policies card */}
              {(() => {
                // Backward-compat: old backend returns policyName at top level; new backend returns policies[]
                const rawPolicies: PolicyInfo[] = Array.isArray(profile?.policies) && profile.policies.length > 0
                  ? profile.policies
                  : profile?.policyName
                    ? [{
                        policyId: profile.policyId ?? 0,
                        policyName: profile.policyName,
                        policyNumber: null,
                        insurerPolicyNumber: null,
                        effectiveDate: profile.effectiveDate ?? null,
                        expiryDate: profile.expiryDate ?? null,
                        insurerName: null,
                        sumInsured: profile.sumInsured,
                        availableBalance: profile.availableBalance,
                        enrollmentStatus: profile.enrollmentStatus,
                        enrollmentStartDate: null,
                        enrollmentEndDate: null,
                      }]
                    : [];
                const policies: PolicyInfo[] = rawPolicies;
                const policyColors = ["#F97316", "#6366F1", "#10B981", "#3B82F6", "#EF4444"];
                const activePolicies = policies.filter((p) => p.policyStatus !== "Expired");
                const expiredPolicies = policies.filter((p) => p.policyStatus === "Expired");

                const renderPolicyRow = (pol: PolicyInfo, idx: number) => {
                  const color = policyColors[idx % policyColors.length];
                  return (
                    <Box
                      key={pol.policyId}
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        px: 3,
                        py: 2.5,
                        borderBottom: "1px solid #F9FAFB",
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${color}30` }}>
                        <ShieldCheck size={16} color={color} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75, flexWrap: "wrap" }}>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827" }}>{pol.policyName}</Typography>
                          {pol.enrollmentStatus && (() => {
                            const isEnrolled = pol.enrollmentStatus.includes("ENROLLED");
                            const isInProgress = pol.enrollmentStatus.includes("IN_PROGRESS") || pol.enrollmentStatus.includes("ENDORSEMENT_SENT");
                            return (
                              <Box sx={{
                                px: 1.25, py: 0.25, borderRadius: 999, fontSize: 15, lineHeight: 1.7, fontWeight: 600,
                                bgcolor: isEnrolled ? "#DCFCE7" : isInProgress ? "#FEF9C3" : "#F3F4F6",
                                color: isEnrolled ? "#16A34A" : isInProgress ? "#B45309" : "#6B7280",
                                border: isEnrolled ? "1px solid #BBF7D0" : isInProgress ? "1px solid #FDE68A" : "1px solid #E5E7EB",
                              }}>
                                {enrollmentStatusLabel(pol.enrollmentStatus)}
                              </Box>
                            );
                          })()}
                          <>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#D1D5DB" }}>|</Typography>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151" }}>
                              <Box component="span" sx={{ color: "#9CA3AF" }}>Policy Id:</Box>{" "}
                              {pol.policyId == null ? "--" :
                                <Box component="span" sx={{ fontWeight: 600 }}>{pol.policyId}</Box>
                              }
                            </Typography>
                          </>
                          {/* {pol.insurerPolicyNumber && ( */}
                            <>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#D1D5DB" }}>|</Typography>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151" }}>
                                <Box component="span" sx={{ color: "#9CA3AF" }}>Insurer Policy Number:</Box>{" "}
                                {pol.insurerPolicyNumber === null ? "--" :
                                  <Box component="span" sx={{ fontWeight: 600 }}>{pol.insurerPolicyNumber}</Box>
                                }
                              </Typography>
                            </>
                          {/* )} */}
                        </Box>
                        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                          <Box>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Sum Insured</Typography>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151" }}>{fmtAmount(Number(pol.sumInsured), localizationData?.data)}</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Period</Typography>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: "#374151" }}>{fmtDate(pol.effectiveDate)} – {fmtDate(pol.expiryDate)}</Typography>
                          </Box>
                        </Box>
                        {(pol.components ?? []).length > 0 && (
                          <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Components Enrolled</Typography>
                            {(pol.components ?? []).map((comp, ci) => (
                              <Box
                                key={ci}
                                sx={{ px: 1.5, py: 1, borderRadius: "8px", bgcolor: "#F8FAFC", border: "1px solid #EEF2F7" }}
                              >
                                <Box sx={{ display: "inline-flex", px: 1.25, py: 0.25, borderRadius: 999, bgcolor: "#EEF2FF", border: "1px solid #C7D2FE", color: "#4338CA", fontSize: 15, lineHeight: 1.7, fontWeight: 600, mb: 0.5 }}>
                                  {comp.componentLabel ?? "Component"}
                                </Box>
                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151" }}>
                                  Dependents:{" "}
                                  {(comp.enrolledPeople ?? []).length > 0
                                    ? comp.enrolledPeople.map((p) => `${p.name ?? "—"} (${p.relationship ?? "—"})`).join(", ")
                                    : "None"}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                      <Box
                        component="button"
                        title="View enrolment confirmation email"
                        onClick={() => void handleViewEnrollmentConfirmation(pol)}
                        disabled={confirmationLoadingPolicyId != null}
                        sx={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: 40, height: 40, borderRadius: "999px", flexShrink: 0,
                          alignSelf: "center", my: "auto", mr: "40px",
                          border: "1px solid #C7D2FE", bgcolor: "#EEF2FF", cursor: "pointer", p: 0,
                          color: "#4F46E5",
                          "&:hover": { bgcolor: "#E0E7FF", color: "#4338CA" },
                          "&:disabled": { cursor: "not-allowed", opacity: 0.6 },
                        }}
                      >
                        {confirmationLoadingPolicyId === pol.policyId ? (
                          <CircularProgress size={18} sx={{ color: "inherit" }} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </Box>
                    </Box>
                  );
                };

                return (
                  <Box sx={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
                    <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827" }}>Policies</Typography>
                      {policies.length > 0 && (
                        <Box sx={{ px: 1.5, py: 0.4, borderRadius: 999, bgcolor: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", fontSize: 15, lineHeight: 1.7, fontWeight: 600 }}>
                          {policies.length} {policies.length === 1 ? "policy" : "policies"}
                        </Box>
                      )}
                    </Box>
                    {policies.length === 0 ? (
                      <Box sx={{ py: 5, textAlign: "center" }}>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>No policies on record</Typography>
                      </Box>
                    ) : (
                      <Box>
                        {activePolicies.length > 0 && (
                          <Box>
                            <Box sx={{ px: 3, py: 1.25, bgcolor: "#F0FDF4", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#15803D", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                Active Policies
                              </Typography>
                              <Box sx={{ px: 1, py: 0.1, borderRadius: 999, bgcolor: "#DCFCE7", color: "#16A34A", fontSize: 15, lineHeight: 1.7, fontWeight: 700 }}>
                                {activePolicies.length}
                              </Box>
                            </Box>
                            {activePolicies.map((pol, idx) => renderPolicyRow(pol, idx))}
                          </Box>
                        )}
                        {expiredPolicies.length > 0 && (
                          <Box>
                            <Box sx={{ px: 3, py: 1.25, bgcolor: "#FEF2F2", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#B91C1C", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                Expired Policies
                              </Typography>
                              <Box sx={{ px: 1, py: 0.1, borderRadius: 999, bgcolor: "#FEE2E2", color: "#B91C1C", fontSize: 15, lineHeight: 1.7, fontWeight: 700 }}>
                                {expiredPolicies.length}
                              </Box>
                            </Box>
                            {expiredPolicies.map((pol, idx) => renderPolicyRow(pol, idx))}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })()}

              {/* Dependents */}
              <Box sx={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", p: 3, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827" }}>Dependents</Typography>
                  <Box sx={{ px: 1.5, py: 0.4, borderRadius: 999, bgcolor: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", fontSize: 15, lineHeight: 1.7, fontWeight: 600 }}>{dependents.length} enrolled</Box>
                </Box>
                {dependents.length === 0 ? (
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", textAlign: "center", py: 2 }}>No dependents on record</Typography>
                ) : (
                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                    {dependents.map((dep, i) => (
                      <Box key={dep.name ?? i} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2, borderRadius: "12px", bgcolor: "#F8FAFC", border: "1px solid #EEF2F7", minWidth: 180 }}>
                        <Box sx={{ width: 38, height: 38, borderRadius: "50%", background: "#EAF2FF", color: "#2556A6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, lineHeight: 1.7, fontWeight: 700, flexShrink: 0 }}>{initials(dep.name ?? "?")}</Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827" }}>{dep.name ?? "—"}</Typography>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085", mt: 0.2 }}>{capitalizeFirst(dep.relationship) || "—"}{dep.gender ? ` / ${dep.gender}` : ""}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* ── E-Cards tab ──────────────────────────────────────────────── */}
          {activeTab === "ecards" && (
            <Box sx={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", overflow: "auto", maxHeight: "calc(100vh - 220px)", minHeight: 600, display: "flex", alignItems: eCardPdfUrl ? "stretch" : "flex-start", justifyContent: "center", p: eCardPdfUrl ? 0 : 4, "&::-webkit-scrollbar": { width: 8 }, "&::-webkit-scrollbar-thumb": { background: "#D1D5DB", borderRadius: 4 } }}>
              {eCardLoading && <CircularProgress sx={{ color: "#2556A6" }} />}
              {eCardPdfUrl && !eCardLoading && (
                <iframe
                  src={eCardPdfUrl}
                  title="Insurance E-Card"
                  style={{ width: "100%", height: 650, border: "none" }}
                />
              )}
              {eCardError && !eCardLoading && !eCardPdfUrl && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 4, textAlign: "center" }}>
                  <ShieldCheck size={52} color="#093F84" strokeWidth={1.5} />
                  <Typography sx={{ fontSize: 17, fontWeight: 600, color: "#1F2937", mt: 1 }}>
                    E-Card Not Available
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "#6B7280", maxWidth: 400, lineHeight: 1.8 }}>
                    The official insurer E-Card for this member is not available yet. Please check again later.
                  </Typography>
                </Box>
              )}
            </Box>
          )}


          {/* ── Claim History tab ─────────────────────────────────────────── */}
          {activeTab === "history" && <Box sx={{ background: "linear-gradient(247deg, #EDEDED 6.94%, #FEFEFE 84.91%)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #fff", flexShrink: 0 }}>
            <Box sx={{ px: 3.5, py: 2.5, borderBottom: "1px solid #EEF2F7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827" }}>Claim History</Typography>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: 999, bgcolor: "#F3F4F6", color: "#6B7280", fontSize: 15, lineHeight: 1.7, fontWeight: 600 }}>
                {claimHistoryLoading ? "..." : `${claimHistory.length} claims`}
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 0.9fr 40px", px: 3.5, py: 1.5, bgcolor: "#4B6B8A", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              {["Claim ID", "Requested On", "Claim Amount", "Approved", "Status", ""].map((h) => (
                <Typography key={h} sx={{ fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h}</Typography>
              ))}
            </Box>

            <Box>
              {claimHistoryLoading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={24} sx={{ color: "#2556A6" }} />
                </Box>
              )}
              {!claimHistoryLoading && claimHistory.length === 0 && (
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", textAlign: "center", py: 4 }}>No claim history available</Typography>
              )}
              {!claimHistoryLoading && claimHistory.map((claim, i) => {
                const claimKey = `${claim.claimId ?? claim.id ?? i}`;
                const isExpanded = expandedClaim === claimKey;
                const claimedAmt = Number(claim.claimedAmount ?? 0);
                const approvedAmt = Number(claim.approvedAmount ?? 0);
                const status = claim.status ?? "Pending";
                return (
                  <Box key={claimKey}>
                    <Box
                      onClick={() => setExpandedClaim(isExpanded ? null : claimKey)}
                      sx={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 0.9fr 40px", px: 3.5, py: 2.5, alignItems: "center", borderBottom: "1px solid #F3F4F6", cursor: "pointer", "&:hover": { bgcolor: "#FAFBFF" }, transition: "background 0.15s", bgcolor: isExpanded ? "#F0F7FF" : "transparent" }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: "9px", background: "#EEF4FF", border: "1px solid #CFE0FF", color: "#2F74D6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <ShieldCheck size={14} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{claim.claimNumber ?? claim.claimId}</Typography>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", mt: 0.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{claim.patientName}</Typography>
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{claim.claimDate ? fmtDate(claim.claimDate) : "—"}</Typography>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmtAmount(claimedAmt, localizationData?.data)}</Typography>
                      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmtAmount(approvedAmt, localizationData?.data)}</Typography>
                      <Box sx={{ px: 1.5, py: 0.5, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, lineHeight: 1.5, fontWeight: 600, maxWidth: "100%", overflow: "hidden",
                          color: status === "Approved" ? "#16A34A" : status === "Pending" ? "#D97706" : "#DC2626",
                          background: status === "Approved" ? "#ECFDF3" : status === "Pending" ? "#FFFBEB" : "#FEF2F2",
                          border: status === "Approved" ? "1px solid #BBF7D0" : status === "Pending" ? "1px solid #FDE68A" : "1px solid #FECACA",
                        }}>
                        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{status}</Box>
                      </Box>
                      <Box sx={{ color: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ChevronDown size={16} style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                      </Box>
                    </Box>
                    {isExpanded && (
                      <Box sx={{ px: 3.5, py: 2.5, bgcolor: "#F8FBFF", borderBottom: "1px solid #E5E7EB" }}>
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 2 }}>
                          {[
                            { label: "Claim ID", value: claim.claimNumber ?? claim.claimId },
                            { label: "Patient", value: claim.patientName ?? "—" },
                            { label: "Claim Date", value: claim.claimDate ? fmtDate(claim.claimDate) : "—" },
                            { label: "Status", value: status },
                            { label: "Claim Amount", value: fmtAmount(claimedAmt, localizationData?.data) },
                            { label: "Approved Amount", value: fmtAmount(approvedAmt, localizationData?.data) },
                            { label: "Deduction", value: fmtAmount(claimedAmt - approvedAmt, localizationData?.data) },
                            { label: "Settlement Ratio", value: claimedAmt > 0 ? `${Math.round((approvedAmt / claimedAmt) * 100)}%` : "—" },
                          ].map(({ label, value }) => (
                            <Box key={label}>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", mb: 0.75, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</Typography>
                              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#111827" }}>{value}</Typography>
                            </Box>
                          ))}
                        </Box>
                        {claim.hospital && claim.hospital !== "—" && (
                          <Box sx={{ p: 2, borderRadius: "8px", bgcolor: "#fff", border: "1px solid #E5E7EB" }}>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", mb: 0.75, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Hospital</Typography>
                            <Typography sx={{ fontSize: 15.5, color: "#374151", lineHeight: 1.6 }}>{claim.hospital}</Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>}
          </>}
      </Box>

      {/* ── Action (block / email) Snackbar ─────────────────────────────── */}
      <Snackbar
        open={Boolean(actionMsg)}
        autoHideDuration={4000}
        onClose={() => setActionMsg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={actionMsg?.type ?? "info"} onClose={() => setActionMsg(null)} sx={{ borderRadius: "10px" }}>
          {actionMsg?.text}
        </Alert>
      </Snackbar>

      {/* ── Reset Password Snackbar ─────────────────────────────────────── */}
      <Snackbar
        open={Boolean(resetMsg)}
        autoHideDuration={4000}
        onClose={() => setResetMsg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={resetMsg?.type ?? "info"} onClose={() => setResetMsg(null)} sx={{ borderRadius: "10px" }}>
          {resetMsg?.text}
        </Alert>
      </Snackbar>

      {/* ── Edit Details Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={isEditing}
        onClose={() => setIsEditing(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}
      >
        <Box sx={{ px: 4, py: 3, borderBottom: "1px solid #E8EEF5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#111827" }}>Edit Employee Details</Typography>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", mt: 0.75 }}>Update contact and department information</Typography>
          </Box>
          <Box onClick={() => setIsEditing(false)} sx={{ cursor: "pointer", display: "flex", p: 0.5, borderRadius: "8px", "&:hover": { bgcolor: "#F3F4F6" } }}>
            <X size={18} color="#6B7280" />
          </Box>
        </Box>
        <DialogContent sx={{ px: 4, py: 3 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5, mb: 3 }}>
            {([
              { label: "Email Address", key: "email", icon: <Mail size={15} color="#9CA3AF" /> },
              { label: "Phone Number", key: "phone", icon: <Phone size={15} color="#9CA3AF" /> },
              { label: "Department", key: "department", icon: <BriefcaseBusiness size={15} color="#9CA3AF" /> },
              { label: "Location", key: "location", icon: <MapPin size={15} color="#9CA3AF" /> },
            ] as const).map((field) => (
              <TextField
                key={field.key}
                label={field.label}
                value={editValues?.[field.key] ?? ""}
                onChange={(e) =>
                  setEditValues((prev) => prev ? { ...prev, [field.key]: e.target.value } : prev)
                }
                size="small"
                fullWidth
                InputProps={{ startAdornment: <Box sx={{ mr: 1, display: "flex" }}>{field.icon}</Box> }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
            ))}
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            <Button
              onClick={() => setIsEditing(false)}
              sx={{ height: 50, borderRadius: "12px", border: "1px solid #D1D5DB", color: "#374151", textTransform: "none", fontSize: 15, lineHeight: 1.7, fontWeight: 600, "&:hover": { bgcolor: "#F9FAFB" } }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              variant="contained"
              sx={{ height: 50, borderRadius: "12px", background: "#184C97", textTransform: "none", fontSize: 15, lineHeight: 1.7, fontWeight: 600, "&:hover": { background: "#143F7D" } }}
            >
              Save Changes
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ── Enrollment Window Dialog ─────────────────────────────────────── */}
      <Dialog
        open={enrollWindowOpen}
        onClose={() => setEnrollWindowOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px", width: 420, maxWidth: "96vw" } }}
      >
        <DialogContent sx={{ px: 4, py: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>Edit Enrollment Window</Typography>
            <Box onClick={() => setEnrollWindowOpen(false)} sx={{ cursor: "pointer", color: "#6B7280", "&:hover": { color: "#111827" } }}>
              <X size={18} />
            </Box>
          </Box>

          {/* One row per policy — each with its own pre-filled start/end dates */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mb: 3 }}>
            {enrollWindowRows.map((row) => (
              <Box key={row.policyId} sx={{ p: 2, border: "1px solid #E5E7EB", borderRadius: "12px", bgcolor: "#F9FAFB" }}>
                {/* Policy name + number on same line */}
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1C57B8" }}>
                    {row.policyName}
                  </Typography>
                  {row.policyNumber && (
                    <Typography sx={{ fontSize: 11, color: "#6B7280" }}>
                      [{row.policyNumber}]
                    </Typography>
                  )}
                </Box>
                {/* Insurer + expiry as secondary line */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 1 }}>
                  {row.insurerName && (
                    <Typography sx={{ fontSize: 11, color: "#6B7280" }}>{row.insurerName}</Typography>
                  )}
                  {row.expiryDate && (
                    <Typography sx={{ fontSize: 11, color: "#D97706" }}>
                      Expires: {new Date(row.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </Typography>
                  )}
                </Box>
                {/* Current enrollment window */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5, px: 1.25, py: 0.75, bgcolor: "#EFF6FF", borderRadius: "8px", border: "1px solid #DBEAFE" }}>
                  <CalendarClock size={12} color="#1C57B8" />
                  <Typography sx={{ fontSize: 11, color: "#1C57B8", fontWeight: 500 }}>
                    Current Enrollment Window:&nbsp;
                    <span style={{ fontWeight: 700 }}>
                      {row.startDate
                        ? new Date(row.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                      {" – "}
                      {row.endDate
                        ? new Date(row.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </span>
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <TextField
                    label="Start Date"
                    type="date"
                    size="small"
                    fullWidth
                    value={row.startDate}
                    onChange={(e) => updateEnrollRow(row.policyId, "startDate", e.target.value)}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { style: { fontSize: 13 } } }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#fff" } }}
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    size="small"
                    fullWidth
                    value={row.endDate}
                    onChange={(e) => updateEnrollRow(row.policyId, "endDate", e.target.value)}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { style: { fontSize: 13 } } }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#fff" } }}
                  />
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
            <Button
              onClick={() => setEnrollWindowOpen(false)}
              sx={{ height: 36, px: 2.5, borderRadius: "10px", textTransform: "none", fontSize: 14, fontWeight: 600, color: "#374151", border: "1px solid #D1D5DB", bgcolor: "#fff", boxShadow: "none", "&:hover": { bgcolor: "#F9FAFB", boxShadow: "none" } }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEnrollWindow}
              disabled={enrollWindowSaving || enrollWindowRows.length === 0}
              sx={{ height: 36, px: 2.5, borderRadius: "10px", textTransform: "none", fontSize: 14, fontWeight: 600, bgcolor: "#1C57B8", color: "#fff", boxShadow: "none", "&:hover": { bgcolor: "#163F8A", boxShadow: "none" } }}
            >
              {enrollWindowSaving ? "Saving…" : "Save"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ── Enrolment Confirmation Email Preview Dialog ─────────────────────── */}
      <Dialog
        open={mailPreview.open}
        onClose={() => setMailPreview((p) => ({ ...p, open: false }))}
        PaperProps={{ sx: { borderRadius: "16px", width: 760, maxWidth: "96vw" } }}
      >
        <DialogContent sx={{ px: 4, py: 3, display: "flex", flexDirection: "column", height: "78vh" }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>Enrolment Confirmation Email</Typography>
              <Typography sx={{ fontSize: 13, color: "#6B7280", mt: 0.25 }}>{mailPreview.policyName}</Typography>
              {mailPreview.subject && (
                <Typography sx={{ fontSize: 13, color: "#374151", mt: 0.5 }}>{mailPreview.subject}</Typography>
              )}
            </Box>
            <Box onClick={() => setMailPreview((p) => ({ ...p, open: false }))} sx={{ cursor: "pointer", color: "#6B7280", flexShrink: 0, "&:hover": { color: "#111827" } }}>
              <X size={18} />
            </Box>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, border: "1px solid #E5E7EB", borderRadius: "10px", overflow: "hidden", display: "flex" }}>
            {mailPreview.loading ? (
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={28} sx={{ color: "#2556A6" }} />
              </Box>
            ) : mailPreview.error ? (
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
                <Typography sx={{ fontSize: 14, color: "#9CA3AF", textAlign: "center" }}>{mailPreview.error}</Typography>
              </Box>
            ) : mailPreview.html ? (
              <iframe
                title="Enrolment Confirmation Email"
                srcDoc={mailPreview.html}
                style={{ flex: 1, width: "100%", border: 0, background: "#fff" }}
              />
            ) : null}
          </Box>
        </DialogContent>
      </Dialog>

      {/* ── Enrollment Window Snackbar ───────────────────────────────────── */}
      <Snackbar
        open={Boolean(enrollWindowMsg)}
        autoHideDuration={4000}
        onClose={() => setEnrollWindowMsg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={enrollWindowMsg?.type ?? "info"} onClose={() => setEnrollWindowMsg(null)} sx={{ borderRadius: "10px" }}>
          {enrollWindowMsg?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default HRPortalEmployeeProfile;
