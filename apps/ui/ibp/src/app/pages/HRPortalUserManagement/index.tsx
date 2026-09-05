import { Box, CircularProgress, Typography } from "@mui/material";
import {
  Building2,
  CheckCircle2,
  Edit2,
  Hash,
  Mail,
  Plus,
  Search,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import {
  PortalControlBar,
  PortalHeroHeader,
  PortalTabItem,
} from "../HRPortal/controls";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { endPoints } from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { useHRReport } from "../../hooks/useHRReport";

// ─── HR Admin/ONLY_HR user type (from GET /hr-module/hr-users) ────────────────

type HrAdminUser = {
  hrManagementId: number;
  fullName: string;
  email: string;
  phone?: string;
  roleKey: string; // HR_ADMIN or ONLY_HR
  companyId: number;
  companyName: string;
  status?: string;
  createdAt: string;
};

const HR_ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  HR_ADMIN: { label: "HR Admin", color: "#1C57B8", bg: "#EBF3FF" },
  ONLY_HR: { label: "HR", color: "#059669", bg: "#ECFDF5" },
};

// ─── External HR types ────────────────────────────────────────────────────────

type ExtHrUser = {
  hrManagementId: number;
  userId: number;
  fullName: string;
  email: string;
  roleKey: string;
  companyName: string;
  companyId: number;
  policyCount: number;
  createdAt: string;
};

type PolicyOption = { id: number; name: string; policyNumber?: string; policyFrom?: string; policyTo?: string; insurerName?: string };
type LocationOption = { id: number; location_code: string; addr_1?: string };

// Concat location_code + addr_1 for display & search
const locationLabel = (l: LocationOption) =>
  l.addr_1 ? `${l.location_code} — ${l.addr_1}` : l.location_code;
type HierarchyCompany = {
  id: number;
  companyName: string;
  country?: string;
  status?: string;
  childCompanies?: { id: number; companyName: string; country?: string; status?: string }[];
};

type SelectedCompany = {
  id: number;
  companyName: string;
  policyIds: number[];
  locationIds: number[];
  allPolicies: boolean;
  allLocations: boolean;
};

type ExtHrFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  status: "ACTIVE" | "INACTIVE";
  companies: SelectedCompany[];
  roleKey: string;
};

const emptyExtHrForm = (defaultRoleKey = "EXTERNAL_HR"): ExtHrFormState => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  status: "ACTIVE",
  companies: [],
  roleKey: defaultRoleKey,
});

type CompanyData = {
  policies: PolicyOption[];
  locations: LocationOption[];
  policiesLoading: boolean;
  locationsLoading: boolean;
};

// ─── External HR — Step 2 sub-component (checkbox lists) ─────────────────────

function CheckboxList<T extends { id: number }>({
  label,
  items,
  labelKey,
  selectedIds,
  allSelected,
  onToggleAll,
  onToggle,
  isLoading,
  renderLabel,
  searchable = false,
  getSearchText,
}: {
  label: string;
  items: T[];
  labelKey: keyof T;
  selectedIds: number[];
  allSelected: boolean;
  onToggleAll: () => void;
  onToggle: (id: number) => void;
  isLoading: boolean;
  renderLabel?: (item: T) => React.ReactNode;
  searchable?: boolean;
  getSearchText?: (item: T) => string;
}) {
  const [search, setSearch] = React.useState("");
  const filtered = React.useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => {
      const text = getSearchText ? getSearchText(item) : String(item[labelKey]);
      return text.toLowerCase().includes(q);
    });
  }, [items, search, labelKey, getSearchText]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>{label}</Typography>
        {items.length > 0 && (
          <Box onClick={onToggleAll} sx={{ display: "flex", alignItems: "center", gap: 0.75, cursor: "pointer" }}>
            <Box sx={{ width: 16, height: 16, borderRadius: "4px", border: allSelected ? "none" : "1.5px solid #D1D5DB", bgcolor: allSelected ? "#1C57B8" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {allSelected && <X size={10} color="#fff" strokeWidth={3} />}
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: allSelected ? "#1C57B8" : "#6B7280" }}>
              {allSelected ? "Deselect All" : "Select All"}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Search input — only shown when searchable=true and items exist */}
      {searchable && !isLoading && items.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, bgcolor: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px", px: 1.25, py: 0.6 }}>
          <Search size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#111827", width: "100%", fontFamily: "inherit" }}
          />
          {search && (
            <Box onClick={() => setSearch("")} sx={{ cursor: "pointer", display: "flex", alignItems: "center", color: "#9CA3AF", "&:hover": { color: "#374151" } }}>
              <X size={12} />
            </Box>
          )}
        </Box>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={24} sx={{ color: "#1C57B8" }} />
        </Box>
      ) : items.length === 0 ? (
        <Box sx={{ py: 3, textAlign: "center", border: "1px dashed #E5E7EB", borderRadius: "10px" }}>
          <Typography sx={{ fontSize: 14, color: "#9CA3AF" }}>No {label.toLowerCase()} available</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, maxHeight: 220, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#D1D5DB", borderRadius: 4 } }}>
          {filtered.length === 0 ? (
            <Box sx={{ py: 2, textAlign: "center" }}>
              <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>No results for "{search}"</Typography>
            </Box>
          ) : filtered.map((item) => {
            const checked = allSelected || selectedIds.includes(item.id);
            return (
              <Box key={item.id} onClick={() => onToggle(item.id)} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, borderRadius: "8px", cursor: "pointer", bgcolor: checked ? "#EBF3FF" : "#F9FAFB", border: checked ? "1px solid #BFDBFE" : "1px solid transparent", "&:hover": { bgcolor: checked ? "#DBEAFE" : "#F3F4F6" } }}>
                <Box sx={{ width: 16, height: 16, borderRadius: "4px", border: checked ? "none" : "1.5px solid #D1D5DB", bgcolor: checked ? "#1C57B8" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {checked && <X size={10} color="#fff" strokeWidth={3} />}
                </Box>
                <Typography sx={{ fontSize: 14, color: checked ? "#1C57B8" : "#374151", fontWeight: checked ? 600 : 400 }}>
                  {renderLabel ? renderLabel(item) : String(item[labelKey])}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

// ─── External HR — Multi-step Create/Edit form ────────────────────────────────
// When defaultRoleKey is provided (non-EXTERNAL_HR), a role selector is shown in step 1.

function ExternalHrForm({
  editUserId,
  adminCompanyId,
  adminCompanyName,
  defaultRoleKey,
  skipCompanyStep,
  onBack,
  onSuccess,
}: {
  editUserId: number | null;
  adminCompanyId: number;
  adminCompanyName: string;
  defaultRoleKey?: string;
  /** When true, skips the company/policy step (for internal HR users). */
  skipCompanyStep?: boolean;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const isEdit = editUserId !== null;
  const showRoleSelect = !!defaultRoleKey && defaultRoleKey !== "EXTERNAL_HR";
  const [form, setForm] = useState<ExtHrFormState>(() => emptyExtHrForm(defaultRoleKey ?? "EXTERNAL_HR"));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [hierarchyResults, setHierarchyResults] = useState<HierarchyCompany[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  // Per-company policies + locations cache
  const [companiesData, setCompaniesData] = useState<Record<number, CompanyData>>({});

  // Debounced company hierarchy search
  useEffect(() => {
    if (!companySearch.trim()) { setHierarchyResults([]); setDropdownOpen(false); return; }
    const timer = setTimeout(() => {
      setSearchLoading(true);
      apiRequest(`${endPoints.ibpCompanyHierarchy}?page=1&limit=1000&search=${encodeURIComponent(companySearch.trim())}`, { method: "GET" })
        .then((res: any) => {
          const list: HierarchyCompany[] = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
          setHierarchyResults(list);
          setDropdownOpen(list.length > 0);
        })
        .catch(() => { setHierarchyResults([]); setDropdownOpen(false); })
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [companySearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch policies + locations for each newly added company
  useEffect(() => {
    if (step !== 2) return;
    form.companies.forEach((co) => {
      if (companiesData[co.id]) return; // already fetched
      setCompaniesData((prev) => ({
        ...prev,
        [co.id]: { policies: [], locations: [], policiesLoading: true, locationsLoading: true },
      }));
      // policies — page/limit must be query params, not body
      apiRequest(`${endPoints.generateHRReports}external_hr_company_policies?page=1&limit=0`, {
        method: "POST",
        data: { companyId: String(co.id) },
      })
        .then((res: any) => {
          const rows: PolicyOption[] = res?.data?.data ?? [];
          setCompaniesData((prev) => ({ ...prev, [co.id]: { ...prev[co.id], policies: rows, policiesLoading: false } }));
        })
        .catch(() => setCompaniesData((prev) => ({ ...prev, [co.id]: { ...prev[co.id], policiesLoading: false } })));
      // locations — same fix
      apiRequest(`${endPoints.generateHRReports}external_hr_company_locations?page=1&limit=0`, {
        method: "POST",
        data: { companyId: String(co.id) },
      })
        .then((res: any) => {
          const rows: LocationOption[] = res?.data?.data ?? [];
          setCompaniesData((prev) => ({ ...prev, [co.id]: { ...prev[co.id], locations: rows, locationsLoading: false } }));
        })
        .catch(() => setCompaniesData((prev) => ({ ...prev, [co.id]: { ...prev[co.id], locationsLoading: false } })));
    });
  }, [step, form.companies]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load user detail for edit mode
  useEffect(() => {
    if (!isEdit || !editUserId) return;
    setLoadingDetail(true);

    if (skipCompanyStep || (defaultRoleKey && defaultRoleKey !== "EXTERNAL_HR")) {
      // Internal HR user (HR_ADMIN/ONLY_HR) — load from dedicated detail endpoint
      apiRequest(endPoints.hrUserDetail(editUserId), { method: "GET" })
        .then((res: any) => {
          const user = res?.data ?? res;
          if (!user) return;

          // Use companies array from API (includes pre-populated policyIds/locationIds)
          let companies: SelectedCompany[] = [];
          if (Array.isArray(user.companies) && user.companies.length > 0) {
            companies = user.companies.map((c: any) => ({
              id: Number(c.companyId),
              companyName: c.companyName || user.companyName || "",
              policyIds: Array.isArray(c.policyIds) ? c.policyIds.map(Number) : [],
              locationIds: Array.isArray(c.locationIds) ? c.locationIds.map(Number) : [],
              allPolicies: false,
              allLocations: false,
            }));
          } else if (user.companyId) {
            companies = [{ id: Number(user.companyId), companyName: user.companyName || "", policyIds: [], locationIds: [], allPolicies: false, allLocations: false }];
          }

          setForm((prev) => ({
            ...prev,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: user.phone || "",
            dateOfBirth: user.dateOfBirth || "",
            status: (user.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as "ACTIVE" | "INACTIVE",
            companies,
            roleKey: user.roleKey && user.roleKey !== "INACTIVE" ? user.roleKey : (defaultRoleKey ?? "ONLY_HR"),
          }));
        })
        .finally(() => setLoadingDetail(false));
      return;
    }

    // External HR — load via report
    apiRequest(endPoints.generateHRReports + "external_hr_user_detail", {
      method: "POST",
      data: { userId: String(editUserId) },
    })
      .then((res: any) => {
        const user = res?.data?.data?.[0];
        if (!user) return;
        const nameParts = (user.fullName || "").split(" ");
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

        const rawCompanies: { companyId: number; companyName: string }[] = Array.isArray(user.companies)
          ? user.companies
          : user.companyId ? [{ companyId: Number(user.companyId), companyName: user.companyName || "" }] : [];

        const policyRows: { policyId: number; companyId: number }[] = Array.isArray(user.policies)
          ? user.policies.map((p: any) => ({ policyId: Number(p.policyId), companyId: Number(p.companyId) }))
          : [];
        const locationRows: { addressId: number; companyId: number }[] = Array.isArray(user.locations)
          ? user.locations.map((l: any) => ({ addressId: Number(l.addressId), companyId: Number(l.companyId ?? user.companyId) }))
          : [];

        const companies: SelectedCompany[] = rawCompanies.map((c) => ({
          id: c.companyId,
          companyName: c.companyName,
          policyIds: policyRows.filter((p) => p.companyId === c.companyId).map((p) => p.policyId),
          locationIds: locationRows.filter((l) => l.companyId === c.companyId).map((l) => l.addressId),
          allPolicies: false,
          allLocations: false,
        }));

        setForm({
          firstName: nameParts[0] || "",
          lastName,
          email: user.email || "",
          phone: user.phoneNumber || "",
          dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : "",
          status: (user.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as "ACTIVE" | "INACTIVE",
          companies,
          roleKey: user.roleKey && user.roleKey !== "INACTIVE" ? user.roleKey : (defaultRoleKey ?? "EXTERNAL_HR"),
        });
      })
      .finally(() => setLoadingDetail(false));
  }, [editUserId, isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  const pf = useCallback(<K extends keyof ExtHrFormState>(k: K, v: ExtHrFormState[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  }, []);

  const toggleCompany = useCallback((id: number, name: string) => {
    setForm((prev) => {
      const exists = prev.companies.some((c) => c.id === id);
      if (exists) {
        return { ...prev, companies: prev.companies.filter((c) => c.id !== id) };
      }
      return {
        ...prev,
        companies: [...prev.companies, { id, companyName: name, policyIds: [], locationIds: [], allPolicies: false, allLocations: false }],
      };
    });
  }, []);

  // Clicking a group/parent company selects it + all its children at once
  const toggleGroupCompany = useCallback((
    parent: HierarchyCompany,
  ) => {
    setForm((prev) => {
      const parentSelected = prev.companies.some((c) => c.id === parent.id);
      if (parentSelected) {
        // Deselect parent + all children
        const removeIds = new Set([parent.id, ...(parent.childCompanies ?? []).map((ch) => ch.id)]);
        return { ...prev, companies: prev.companies.filter((c) => !removeIds.has(c.id)) };
      }
      // Select parent + all children that aren't already selected
      const toAdd: SelectedCompany[] = [];
      if (!prev.companies.some((c) => c.id === parent.id)) {
        toAdd.push({ id: parent.id, companyName: parent.companyName, policyIds: [], locationIds: [], allPolicies: false, allLocations: false });
      }
      (parent.childCompanies ?? []).forEach((ch) => {
        if (!prev.companies.some((c) => c.id === ch.id)) {
          toAdd.push({ id: ch.id, companyName: ch.companyName, policyIds: [], locationIds: [], allPolicies: false, allLocations: false });
        }
      });
      return { ...prev, companies: [...prev.companies, ...toAdd] };
    });
  }, []);

  const updateCompany = useCallback((id: number, patch: Partial<SelectedCompany>) => {
    setForm((prev) => ({
      ...prev,
      companies: prev.companies.map((c) => c.id === id ? { ...c, ...patch } : c),
    }));
  }, []);

  const step1Valid = !!(form.firstName.trim() && form.lastName.trim() && form.email.trim() && form.phone.trim() && form.dateOfBirth);
  const anyDataLoading = form.companies.some((c) => {
    const d = companiesData[c.id];
    return !d || d.policiesLoading;
  });
  const step2Valid = form.companies.length > 0 &&
    !anyDataLoading &&
    form.companies.every((c) => {
      const available = companiesData[c.id]?.policies ?? [];
      // If no policies exist for this company, skip the policy requirement
      if (available.length === 0) return true;
      return c.allPolicies || c.policyIds.length > 0;
    });

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const companies = form.companies.map((co) => {
        const data = companiesData[co.id];
        return {
          companyId: co.id,
          policyIds: co.allPolicies ? (data?.policies ?? []).map((p) => p.id) : co.policyIds,
          locationIds: co.allLocations ? (data?.locations ?? []).map((l) => l.id) : co.locationIds,
        };
      });
      const payload: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        ...(isEdit ? {} : { email: form.email.trim() }),
        phone: form.phone.trim(),
        dateOfBirth: /^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth) ? form.dateOfBirth : undefined,
        status: form.status,
        companies,
        // flat arrays for backward-compat with existing single-company backend
        companyId: companies[0]?.companyId,
        policyIds: companies.flatMap((c) => c.policyIds),
        locationIds: companies.flatMap((c) => c.locationIds),
      };
      if (!isEdit && showRoleSelect) payload.roleKey = form.roleKey;
      if (isEdit) {
        await apiRequest(endPoints.externalHrUpdate(editUserId!), { method: "PUT", data: payload });
      } else {
        await apiRequest(endPoints.externalHrCreate, { method: "POST", data: payload });
      }
      onSuccess();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = skipCompanyStep
    ? ["Basic Info", "Review & Save"]
    : ["Basic Info", "Company & Access", "Review & Save"];

  const StepBadge = ({ n }: { n: number }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, opacity: step < n ? 0.4 : 1 }}>
      <Box sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: step > n ? "#059669" : step === n ? "#1C57B8" : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {step > n ? <CheckCircle2 size={14} color="#fff" /> : <Typography sx={{ fontSize: 12, fontWeight: 700, color: step === n ? "#fff" : "#6B7280" }}>{n}</Typography>}
      </Box>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: step === n ? "#1C57B8" : step > n ? "#059669" : "#6B7280" }}>{STEPS[n - 1]}</Typography>
    </Box>
  );

  if (loadingDetail) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={32} sx={{ color: "#1C57B8" }} />
      </Box>
    );
  }


  return (
    <Box sx={{ px: 4, py: 3.5 }}>
      {/* Step indicator */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, p: 2, bgcolor: "#fff", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
        {(skipCompanyStep ? [1, 2] : [1, 2, 3]).map((n, idx, arr) => (
          <React.Fragment key={n}>
            <StepBadge n={n} />
            {idx < arr.length - 1 && <Box sx={{ flex: 1, height: 1, bgcolor: step > n ? "#059669" : "#E5E7EB" }} />}
          </React.Fragment>
        ))}
      </Box>

      {/* ── Step 1: Basic Info ── */}
      {step === 1 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box sx={{ p: 3, borderRadius: "16px", bgcolor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", mb: 2 }}>Basic Information</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
              {(["firstName", "lastName"] as const).map((field) => (
                <Box key={field}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151", mb: 0.75 }}>
                    {field === "firstName" ? "First Name *" : "Last Name *"}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", height: 44, borderRadius: "10px", border: "1px solid #E5E7EB", bgcolor: "#fff", px: 1.5, gap: 0.75, "&:focus-within": { borderColor: "#1C57B8" } }}>
                    <User size={13} color="#9CA3AF" />
                    <input value={form[field]} onChange={(e) => pf(field, e.target.value)} placeholder={field === "firstName" ? "e.g. Anjali" : "e.g. Rentala"} style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#111827", flex: 1, fontFamily: "inherit" }} />
                  </Box>
                </Box>
              ))}
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151", mb: 0.75 }}>Email Address *</Typography>
              <Box sx={{ display: "flex", alignItems: "center", height: 44, borderRadius: "10px", border: "1px solid #E5E7EB", bgcolor: isEdit ? "#F3F4F6" : "#fff", px: 1.5, gap: 0.75, "&:focus-within": { borderColor: "#1C57B8" } }}>
                <Mail size={13} color="#9CA3AF" />
                <input value={form.email} onChange={(e) => pf("email", e.target.value)} placeholder="name@company.com" type="email" disabled={isEdit} style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, color: isEdit ? "#6B7280" : "#111827", flex: 1, fontFamily: "inherit", cursor: isEdit ? "not-allowed" : "text" }} />
              </Box>
              {isEdit && <Typography sx={{ fontSize: 12, color: "#9CA3AF", mt: 0.5 }}>Email cannot be changed for existing users.</Typography>}
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151", mb: 0.75 }}>Phone Number *</Typography>
                <Box sx={{ display: "flex", alignItems: "center", height: 44, borderRadius: "10px", border: "1px solid #E5E7EB", bgcolor: "#fff", px: 1.5, gap: 0.75, "&:focus-within": { borderColor: "#1C57B8" } }}>
                  <Hash size={13} color="#9CA3AF" />
                  <input value={form.phone} onChange={(e) => pf("phone", e.target.value)} placeholder="+91 98765 43210" type="tel" style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#111827", flex: 1, fontFamily: "inherit" }} />
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151", mb: 0.75 }}>Date of Birth *</Typography>
                <Box sx={{ display: "flex", alignItems: "center", height: 44, borderRadius: "10px", border: "1px solid #E5E7EB", bgcolor: "#fff", px: 1.5, gap: 0.75, "&:focus-within": { borderColor: "#1C57B8" } }}>
                  <input value={form.dateOfBirth} onChange={(e) => pf("dateOfBirth", e.target.value)} type="date" max={new Date().toISOString().slice(0, 10)} style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, color: form.dateOfBirth ? "#111827" : "#9CA3AF", flex: 1, fontFamily: "inherit" }} />
                </Box>
              </Box>
            </Box>

            {/* Role selector — only shown for HR Users tab (HR_ADMIN / ONLY_HR) on create */}
            {showRoleSelect && !isEdit && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151", mb: 1 }}>Role *</Typography>
                <Box sx={{ display: "flex", gap: 1.25 }}>
                  {[
                    { key: "ONLY_HR", label: "HR", desc: "Standard HR access", color: "#059669", bg: "#ECFDF5" },
                    { key: "HR_ADMIN", label: "HR Admin", desc: "Full HR module access", color: "#1C57B8", bg: "#EBF3FF" },
                  ].map((r) => (
                    <Box
                      key={r.key}
                      onClick={() => pf("roleKey", r.key)}
                      sx={{
                        flex: 1, p: 2, borderRadius: "12px", cursor: "pointer",
                        border: form.roleKey === r.key ? `2px solid ${r.color}` : "1.5px solid #E5E7EB",
                        bgcolor: form.roleKey === r.key ? r.bg : "#fff",
                        transition: "all 0.12s ease",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                        <Shield size={14} color={r.color} />
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: r.color }}>{r.label}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>{r.desc}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151", mb: 1 }}>Status</Typography>
              <Box sx={{ display: "flex", gap: 1.25 }}>
                {(["ACTIVE", "INACTIVE"] as const).map((s) => (
                  <Box key={s} onClick={() => pf("status", s)} sx={{ flex: 1, height: 42, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, cursor: "pointer", border: form.status === s ? (s === "ACTIVE" ? "2px solid #059669" : "2px solid #DC2626") : "1.5px solid #E5E7EB", bgcolor: form.status === s ? (s === "ACTIVE" ? "#ECFDF5" : "#FEF2F2") : "#fff", color: form.status === s ? (s === "ACTIVE" ? "#059669" : "#DC2626") : "#6B7280" }}>
                    {s === "ACTIVE" ? "Active" : "Inactive"}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
          <Box onClick={step1Valid ? () => setStep(skipCompanyStep ? 3 : 2) : undefined} sx={{ height: 48, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, bgcolor: step1Valid ? "#184C97" : "#D1D5DB", color: "#fff", cursor: step1Valid ? "pointer" : "not-allowed", "&:hover": { bgcolor: step1Valid ? "#143F7D" : "#D1D5DB" } }}>
            {skipCompanyStep ? "Continue to Review" : "Continue to Company & Access"}
          </Box>
        </Box>
      )}

      {/* ── Step 2: Company → Policies → Locations (cascading) ── */}
      {step === 2 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

          {/* Section A: Company Multi-select */}
          <Box sx={{ p: 3, borderRadius: "16px", bgcolor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>
              Company *
            </Typography>

            {/* Selected company chips */}
            {form.companies.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.25 }}>
                {form.companies.map((co) => (
                  <Box key={co.id} sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.5, borderRadius: "8px", bgcolor: "#EBF3FF", border: "1.5px solid #BFDBFE" }}>
                    <Building2 size={12} color="#1C57B8" />
                    <Typography sx={{ fontSize: 13, color: "#1C57B8", fontWeight: 600 }}>{co.companyName}</Typography>
                    <Box onClick={() => toggleCompany(co.id, co.companyName)} sx={{ cursor: "pointer", display: "flex", alignItems: "center", ml: 0.25 }}>
                      <X size={12} color="#6B7280" />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* Search input + multi-select dropdown */}
            <Box ref={companyDropdownRef} sx={{ position: "relative" }}>
              <Box sx={{ display: "flex", alignItems: "center", height: 44, borderRadius: "10px", border: "1px solid #E5E7EB", bgcolor: "#F9FAFB", px: 1.5, gap: 0.75, "&:focus-within": { borderColor: "#1C57B8", bgcolor: "#fff" } }}>
                <Search size={13} color="#9CA3AF" />
                <input
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  onFocus={() => { if (hierarchyResults.length > 0) setDropdownOpen(true); }}
                  placeholder="Search and add companies…"
                  style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#111827", flex: 1, fontFamily: "inherit" }}
                />
                {searchLoading && <CircularProgress size={13} sx={{ color: "#1C57B8", flexShrink: 0 }} />}
              </Box>

              {/* Multi-select dropdown tree */}
              {dropdownOpen && hierarchyResults.length > 0 && (
                <Box sx={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, bgcolor: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 200, maxHeight: 300, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#D1D5DB", borderRadius: 4 } }}>
                  {hierarchyResults.map((parent, pi) => {
                    const allIds = [parent.id, ...(parent.childCompanies ?? []).map((ch) => ch.id)];
                    const selectedCount = allIds.filter((id) => form.companies.some((c) => c.id === id)).length;
                    const parentChecked = selectedCount > 0;
                    return (
                      <Box key={parent.id} sx={{ borderTop: pi > 0 ? "1px solid #F3F4F6" : "none" }}>
                        {/* Group/parent row */}
                        <Box
                          onMouseDown={(e) => { e.preventDefault(); toggleCompany(parent.id, parent.companyName); }}
                          sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.75, py: 1.1, cursor: "pointer", "&:hover": { bgcolor: "#F0F7FF" }, bgcolor: form.companies.some((c) => c.id === parent.id) ? "#EBF3FF" : "transparent" }}
                        >
                          <Box sx={{ width: 16, height: 16, borderRadius: "4px", border: form.companies.some((c) => c.id === parent.id) ? "none" : "1.5px solid #D1D5DB", bgcolor: form.companies.some((c) => c.id === parent.id) ? "#1C57B8" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {form.companies.some((c) => c.id === parent.id) && <X size={10} color="#fff" strokeWidth={3} />}
                          </Box>
                          <Building2 size={14} color={form.companies.some((c) => c.id === parent.id) ? "#1C57B8" : "#374151"} />
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: form.companies.some((c) => c.id === parent.id) ? "#1C57B8" : "#111827", flex: 1 }}>{parent.companyName}</Typography>
                          {parent.childCompanies && parent.childCompanies.length > 0 && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                              <Typography sx={{ fontSize: 11, color: "#9CA3AF", bgcolor: "#F3F4F6", px: 0.75, borderRadius: "6px" }}>{parent.childCompanies.length}</Typography>
                              <Typography
                                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); toggleGroupCompany(parent); }}
                                sx={{ fontSize: 11, color: "#1C57B8", fontWeight: 600, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                              >
                                Select All
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        {/* Child rows */}
                        {parent.childCompanies?.map((child) => {
                          const childChecked = form.companies.some((c) => c.id === child.id);
                          return (
                            <Box
                              key={child.id}
                              onMouseDown={(e) => { e.preventDefault(); toggleCompany(child.id, child.companyName); }}
                              sx={{ display: "flex", alignItems: "center", gap: 1, pl: 4, pr: 1.75, py: 0.9, cursor: "pointer", "&:hover": { bgcolor: "#F0F7FF" }, bgcolor: childChecked ? "#EBF3FF" : "#FAFAFA", borderTop: "1px solid #F3F4F6" }}
                            >
                              <Box sx={{ width: 14, height: 14, borderRadius: "4px", border: childChecked ? "none" : "1.5px solid #D1D5DB", bgcolor: childChecked ? "#1C57B8" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {childChecked && <X size={9} color="#fff" strokeWidth={3} />}
                              </Box>
                              <Typography sx={{ fontSize: 13, color: childChecked ? "#1C57B8" : "#374151", fontWeight: childChecked ? 600 : 400 }}>{child.companyName}</Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    );
                  })}
                </Box>
              )}
              {dropdownOpen && !searchLoading && companySearch.trim() && hierarchyResults.length === 0 && (
                <Box sx={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, bgcolor: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.07)", zIndex: 200, py: 2.5, textAlign: "center" }}>
                  <Typography sx={{ fontSize: 14, color: "#9CA3AF" }}>No companies found for "{companySearch}"</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Section B+C: Per-company Policies + Locations (grouped) */}
          {form.companies.map((co) => {
            const data = companiesData[co.id] ?? { policies: [], locations: [], policiesLoading: true, locationsLoading: true };
            return (
              <Box key={co.id} sx={{ p: 3, borderRadius: "16px", bgcolor: "#fff", border: "1.5px solid #BFDBFE", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                {/* Company header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, pb: 1.5, borderBottom: "1px solid #F3F4F6" }}>
                  <Building2 size={15} color="#1C57B8" />
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1C57B8", flex: 1 }}>{co.companyName}</Typography>
                </Box>

                {/* Policies */}
                <Box sx={{ mb: 2.5 }}>
                  <CheckboxList
                    label="Policies *"
                    items={data.policies}
                    labelKey="name"
                    selectedIds={co.policyIds}
                    allSelected={co.allPolicies}
                    onToggleAll={() => updateCompany(co.id, { allPolicies: !co.allPolicies, policyIds: [] })}
                    onToggle={(id) => {
                      const next = co.policyIds.includes(id) ? co.policyIds.filter((p) => p !== id) : [...co.policyIds, id];
                      updateCompany(co.id, { policyIds: next, allPolicies: false });
                    }}
                    isLoading={data.policiesLoading}
                    searchable
                    getSearchText={(p: PolicyOption) =>
                      [p.name, p.policyNumber, p.insurerName].filter(Boolean).join(" ")
                    }
                    renderLabel={(p) => (
                      <span>
                        {p.name}
                        {(p.policyNumber || p.policyFrom) && (
                          <span style={{ opacity: 0.7, fontSize: 12, marginLeft: 6 }}>
                            {p.policyNumber ? `[${p.policyNumber}]` : ""}
                            {p.policyFrom && p.policyTo ? ` ${p.policyFrom} – ${p.policyTo}` : ""}
                          </span>
                        )}
                      </span>
                    )}
                  />
                </Box>

                {/* Locations */}
                <CheckboxList
                  label="Location / Branch Access (optional)"
                  items={data.locations}
                  labelKey="location_code"
                  selectedIds={co.locationIds}
                  allSelected={co.allLocations}
                  onToggleAll={() => updateCompany(co.id, { allLocations: !co.allLocations, locationIds: [] })}
                  onToggle={(id) => {
                    const next = co.locationIds.includes(id) ? co.locationIds.filter((l) => l !== id) : [...co.locationIds, id];
                    updateCompany(co.id, { locationIds: next, allLocations: false });
                  }}
                  isLoading={data.locationsLoading}
                  searchable
                  getSearchText={(l: LocationOption) => locationLabel(l)}
                  renderLabel={(l: LocationOption) => (
                    <span>
                      <span style={{ fontWeight: 600 }}>{l.location_code}</span>
                      {l.addr_1 && <span style={{ opacity: 0.65, marginLeft: 6, fontSize: 12 }}>{l.addr_1}</span>}
                    </span>
                  )}
                />
              </Box>
            );
          })}

          {/* Navigation */}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Box onClick={() => setStep(1)} sx={{ flex: 1, height: 48, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, bgcolor: "#fff", color: "#374151", border: "1.5px solid #E5E7EB", cursor: "pointer", "&:hover": { bgcolor: "#F9FAFB" } }}>
              Back
            </Box>
            <Box onClick={step2Valid ? () => setStep(3) : undefined} sx={{ flex: 2, height: 48, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, bgcolor: step2Valid ? "#184C97" : "#D1D5DB", color: "#fff", cursor: step2Valid ? "pointer" : "not-allowed", "&:hover": { bgcolor: step2Valid ? "#143F7D" : "#D1D5DB" } }}>
              Continue to Review
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Step 3: Review & Save ── */}
      {step === 3 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box sx={{ p: 3, borderRadius: "16px", bgcolor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", mb: 2 }}>Review</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {[
                { label: "Name", value: `${form.firstName} ${form.lastName}` },
                { label: "Email", value: form.email },
                { label: "Phone", value: form.phone },
                { label: "Date of Birth", value: form.dateOfBirth || "—" },
                { label: "Status", value: form.status },
                ...(showRoleSelect && !isEdit ? [{ label: "Role", value: HR_ROLE_CONFIG[form.roleKey]?.label ?? form.roleKey }] : []),
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: "flex", justifyContent: "space-between", py: 1, borderBottom: "1px solid #F3F4F6" }}>
                  <Typography sx={{ fontSize: 14, color: "#6B7280", fontWeight: 500 }}>{label}</Typography>
                  <Typography sx={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>{value}</Typography>
                </Box>
              ))}
              {/* Per-company summary */}
              {form.companies.map((co) => {
                const data = companiesData[co.id];
                const effectivePolicies = co.allPolicies ? (data?.policies ?? []) : (data?.policies ?? []).filter((p) => co.policyIds.includes(p.id));
                const effectiveLocations = co.allLocations ? (data?.locations ?? []) : (data?.locations ?? []).filter((l) => co.locationIds.includes(l.id));
                return (
                  <Box key={co.id} sx={{ py: 1.25, borderBottom: "1px solid #F3F4F6" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
                      <Building2 size={13} color="#1C57B8" />
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1C57B8" }}>{co.companyName}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: "#6B7280", mb: 0.5 }}>Policies</Typography>
                    {co.allPolicies ? (
                      <Box sx={{ px: 1.25, py: 0.3, borderRadius: 999, display: "inline-flex", bgcolor: "#ECFDF5", fontSize: 12, fontWeight: 600, color: "#059669", mb: 0.75 }}>All ({data?.policies?.length ?? 0})</Box>
                    ) : (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 0.75 }}>
                        {effectivePolicies.map((p) => (
                          <Box key={p.id} sx={{ px: 1.25, py: 0.3, borderRadius: 999, bgcolor: "#EBF3FF", fontSize: 12, fontWeight: 600, color: "#1C57B8" }}>{p.name}</Box>
                        ))}
                      </Box>
                    )}
                    {effectiveLocations.length > 0 && (
                      <>
                        <Typography sx={{ fontSize: 12, color: "#6B7280", mb: 0.5 }}>Locations</Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {co.allLocations
                            ? <Box sx={{ px: 1.25, py: 0.3, borderRadius: 999, display: "inline-flex", bgcolor: "#ECFDF5", fontSize: 12, fontWeight: 600, color: "#059669" }}>All ({data?.locations?.length ?? 0})</Box>
                            : effectiveLocations.map((l) => (
                                <Box key={l.id} sx={{ px: 1.25, py: 0.3, borderRadius: 999, bgcolor: "#F3F4F6", fontSize: 12, color: "#374151" }}>{locationLabel(l)}</Box>
                              ))
                          }
                        </Box>
                      </>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
          {submitError && (
            <Box sx={{ p: 2, borderRadius: "10px", bgcolor: "#FEF2F2", border: "1px solid #FECACA" }}>
              <Typography sx={{ fontSize: 14, color: "#DC2626" }}>{submitError}</Typography>
            </Box>
          )}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Box onClick={() => setStep(skipCompanyStep ? 1 : 2)} sx={{ flex: 1, height: 48, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, bgcolor: "#fff", color: "#374151", border: "1.5px solid #E5E7EB", cursor: "pointer", "&:hover": { bgcolor: "#F9FAFB" } }}>
              Back
            </Box>
            <Box
              onClick={!submitting ? handleSubmit : undefined}
              sx={{ flex: 2, height: 48, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 1, fontSize: 15, fontWeight: 700, bgcolor: submitting ? "#D1D5DB" : "#184C97", color: "#fff", cursor: submitting ? "not-allowed" : "pointer", "&:hover": { bgcolor: submitting ? "#D1D5DB" : "#143F7D" } }}
            >
              {submitting && <CircularProgress size={16} sx={{ color: "#fff" }} />}
              {isEdit ? "Save Changes" : (showRoleSelect ? "Create HR User" : "Create External HR User")}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─── Shared success screen ─────────────────────────────────────────────────────

function SuccessScreen({ title, subtitle, backLabel, onBack }: { title: string; subtitle: string; backLabel: string; onBack: () => void }) {
  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2.5, py: 8 }}>
      <Box sx={{ width: 72, height: 72, borderRadius: "50%", bgcolor: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CheckCircle2 size={40} color="#10B981" />
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#111827", mb: 0.75 }}>{title}</Typography>
        <Typography sx={{ fontSize: 15.5, color: "#6B7280", lineHeight: 1.7 }}>{subtitle}</Typography>
      </Box>
      <Box onClick={onBack} sx={{ mt: 1, px: 4, height: 46, borderRadius: "11px", bgcolor: "#184C97", color: "#fff", display: "flex", alignItems: "center", fontSize: 15, fontWeight: 700, cursor: "pointer", "&:hover": { bgcolor: "#143F7D" } }}>
        {backLabel}
      </Box>
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HRPortalUserManagement() {
  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"hr_users" | "external_hr">("hr_users");

  // ── HR Users tab state ─────────────────────────────────────────────────────
  const [hrUsersView, setHrUsersView] = useState<"list" | "form" | "success">("list");
  const [hrUsersEditId, setHrUsersEditId] = useState<number | null>(null);
  const [hrUsers, setHrUsers] = useState<HrAdminUser[]>([]);
  const [hrUsersLoading, setHrUsersLoading] = useState(false);
  const [hrUsersTotal, setHrUsersTotal] = useState(0);
  const [hrUsersPage, setHrUsersPage] = useState(1);
  const [hrUsersSearch, setHrUsersSearch] = useState("");
  const [hrUsersDebouncedSearch, setHrUsersDebouncedSearch] = useState("");
  const hrUsersLimit = 10;
  const [hrUsersSuccessBanner, setHrUsersSuccessBanner] = useState<string | null>(null);
  const hrUsersSuccessTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hrUsersScrollRef = useRef<HTMLDivElement | null>(null);
  const [hrUsersScrolled, setHrUsersScrolled] = useState(false);

  // ── External HR tab state ──────────────────────────────────────────────────
  const [extHrView, setExtHrView] = useState<"list" | "form" | "success">("list");
  const [extHrEditUserId, setExtHrEditUserId] = useState<number | null>(null);
  const [extHrSearch, setExtHrSearch] = useState("");
  const [extHrDebouncedSearch, setExtHrDebouncedSearch] = useState("");
  const externalUsersScrollRef = useRef<HTMLDivElement | null>(null);
  const [externalUsersScrolled, setExternalUsersScrolled] = useState(false);
  const [extHrPage, setExtHrPage] = useState(1);
  const [extHrLimit] = useState(10);
  const [extHrStatusUpdating, setExtHrStatusUpdating] = useState<number | null>(null);
  const [extHrSuccessBanner, setExtHrSuccessBanner] = useState<string | null>(null);
  const successBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sessionCompanyId = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}")?.companyId ?? 0;
    } catch {
      return 0;
    }
  })();

  const sessionCompanyName: string = JSON.parse(sessionStorage.getItem("user") || "{}")?.companyName ?? "Your Company";

  // ── HR Users debounce ──────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setHrUsersDebouncedSearch(hrUsersSearch.trim());
      setHrUsersPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [hrUsersSearch]);

  // ── HR Users fetch — show all HR_ADMIN + ONLY_HR across all companies ────────
  useEffect(() => {
    if (activeTab !== "hr_users" || hrUsersView !== "list") return;
    setHrUsersLoading(true);
    const params = new URLSearchParams({
      page: String(hrUsersPage),
      limit: String(hrUsersLimit),
    });
    if (hrUsersDebouncedSearch) params.set("search", hrUsersDebouncedSearch);
    apiRequest(`${endPoints.hrUsersList}?${params.toString()}`, { method: "GET" })
      .then((res: any) => {
        const payload = res?.data ?? res;
        setHrUsers(Array.isArray(payload?.data) ? payload.data : []);
        setHrUsersTotal(Number(payload?.total ?? 0));
      })
      .catch(() => { setHrUsers([]); setHrUsersTotal(0); })
      .finally(() => setHrUsersLoading(false));
  }, [activeTab, hrUsersView, hrUsersPage, hrUsersDebouncedSearch]);

  // ── External HR debounce ───────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setExtHrDebouncedSearch(extHrSearch.trim());
      setExtHrPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [extHrSearch]);

  const { data: extHrUsers, total: extHrTotal, isLoading: extHrLoading, refetch: refetchExtHr } = useHRReport<ExtHrUser>(
    "external_hr_user_list",
    { companyId: "", search: extHrDebouncedSearch || "" },
    activeTab === "external_hr" && extHrView === "list",
    { page: extHrPage, limit: extHrLimit },
  );

  const extHrTotalPages = extHrTotal != null ? Math.ceil(extHrTotal / extHrLimit) : null;
  const hrUsersTotalPages = hrUsersTotal > 0 ? Math.ceil(hrUsersTotal / hrUsersLimit) : null;

  // ── External HR actions ────────────────────────────────────────────────────
  const handleExtHrStatusToggle = async (user: ExtHrUser) => {
    const newStatus = user.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
    setExtHrStatusUpdating(user.hrManagementId);
    try {
      await apiRequest(endPoints.externalHrUpdate(user.hrManagementId), {
        method: "PUT",
        data: { status: newStatus },
      });
      refetchExtHr();
    } catch {
      // silently fail — user stays in current state
    } finally {
      setExtHrStatusUpdating(null);
    }
  };

  const headerTitle = () => {
    if (activeTab === "hr_users") {
      if (hrUsersView === "form") return hrUsersEditId ? "Edit HR User" : "Add HR User";
      if (hrUsersView === "success") return "HR User Saved";
      return "User Management";
    }
    if (extHrView === "form") return extHrEditUserId ? "Edit External HR User" : "Add External HR User";
    if (extHrView === "success") return "External HR User Saved";
    return "User Management";
  };

  const headerSub = () => {
    if (activeTab === "hr_users" && hrUsersView !== "list") return "Configure company, policy & location access for HR users";
    if (extHrView !== "list" && activeTab === "external_hr") return "Assign policy & location access for external HR users";
    return "Manage portal access, roles and policy permissions";
  };

  const handleAdd = () => {
    if (activeTab === "hr_users") { setHrUsersEditId(null); setHrUsersView("form"); }
    else { setExtHrEditUserId(null); setExtHrView("form"); }
  };

  const showBackBtn =
    (activeTab === "hr_users" && hrUsersView !== "list") ||
    (activeTab === "external_hr" && extHrView !== "list");

  const handleBack = () => {
    if (activeTab === "hr_users") { setHrUsersView("list"); setHrUsersEditId(null); }
    else { setExtHrView("list"); setExtHrEditUserId(null); }
  };

  return (
    <Box sx={{ mx: -3, mt: -0.5, height: "100%", background: "#EBF6FF", display: "flex", flexDirection: "column" }}>
      {/* ── Header + Tab bar ──────────────────────────────────────────────────── */}
      <Box sx={{ position: "sticky", top: 0, zIndex: 0, background: "#EBF6FF", flexShrink: 0 }}>
        <PortalHeroHeader
          title={headerTitle()}
          subtitle={headerSub()}
          onBack={showBackBtn ? handleBack : undefined}
        />
        {hrUsersView === "list" && extHrView === "list" && (
          <PortalControlBar>
            {([
              { key: "hr_users" as const, label: "HR Users", Icon: Users },
              { key: "external_hr" as const, label: "External HR", Icon: Building2 },
            ]).map(({ key, label, Icon }) => (
              <PortalTabItem
                key={key}
                active={activeTab === key}
                onClick={() => setActiveTab(key)}
                icon={<Icon size={14} />}
                label={label}
              />
            ))}
          </PortalControlBar>
        )}
      </Box>

      {/* ── HR Users: form view ──────────────────────────────────────────────── */}
      {activeTab === "hr_users" && hrUsersView === "form" && (
        <ExternalHrForm
          editUserId={hrUsersEditId}
          adminCompanyId={sessionCompanyId}
          adminCompanyName={sessionCompanyName}
          defaultRoleKey="ONLY_HR"
          skipCompanyStep={false}
          onBack={() => { setHrUsersView("list"); setHrUsersEditId(null); }}
          onSuccess={() => setHrUsersView("success")}
        />
      )}

      {/* ── HR Users: success view ───────────────────────────────────────────── */}
      {activeTab === "hr_users" && hrUsersView === "success" && (
        <SuccessScreen
          title={hrUsersEditId ? "HR User Updated" : "HR User Created"}
          subtitle={hrUsersEditId ? "The HR user has been updated successfully." : "The HR user has been created and granted access."}
          backLabel="Back to HR Users"
          onBack={() => {
            const msg = hrUsersEditId ? "HR user updated successfully." : "HR user created successfully.";
            setHrUsersView("list");
            setHrUsersEditId(null);
            setHrUsersSuccessBanner(msg);
            if (hrUsersSuccessTimer.current) clearTimeout(hrUsersSuccessTimer.current);
            hrUsersSuccessTimer.current = setTimeout(() => setHrUsersSuccessBanner(null), 4000);
          }}
        />
      )}

      {/* ── HR Users: list view ──────────────────────────────────────────────── */}
      {activeTab === "hr_users" && hrUsersView === "list" && (
        <Box sx={{ px: 4, py: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Success banner */}
          {hrUsersSuccessBanner && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2.5, py: 1.5, borderRadius: "12px", bgcolor: "#ECFDF5", border: "1px solid #A7F3D0" }}>
              <CheckCircle2 size={18} color="#059669" />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#059669", flex: 1 }}>{hrUsersSuccessBanner}</Typography>
              <Box onClick={() => setHrUsersSuccessBanner(null)} sx={{ cursor: "pointer", display: "flex" }}><X size={14} color="#059669" /></Box>
            </Box>
          )}

          {/* Stats */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
            {[
              { label: "Total HR Users", value: hrUsersTotal, icon: <Users size={16} color="#1C57B8" />, bg: "#EBF3FF", color: "#1C57B8" },
              { label: "HR Admin", value: hrUsers.filter((u) => u.roleKey === "HR_ADMIN").length, icon: <Shield size={16} color="#7C3AED" />, bg: "#F5F3FF", color: "#7C3AED" },
              { label: "HR (ONLY_HR)", value: hrUsers.filter((u) => u.roleKey === "ONLY_HR").length, icon: <CheckCircle2 size={16} color="#059669" />, bg: "#ECFDF5", color: "#059669" },
            ].map(({ label, value, icon, bg, color }) => (
              <Box key={label} sx={{ p: 3, borderRadius: "14px", bgcolor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</Box>
                <Box>
                  <Typography sx={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</Typography>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", fontWeight: 500, mt: 0.75 }}>{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Search / filter bar */}
          <Box sx={{ p: 2, borderRadius: "14px", bgcolor: "#fff", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ flex: 1, maxWidth: 360, display: "flex", alignItems: "center", gap: 0.75, px: 1.25, height: 32, borderRadius: "8px", border: "1px solid #E5E7EB", bgcolor: "#F9FAFB", "&:focus-within": { borderColor: "#1C57B8", bgcolor: "#fff" } }}>
              <Search size={13} color="#9CA3AF" />
              <input value={hrUsersSearch} onChange={(e) => setHrUsersSearch(e.target.value)} placeholder="Search by name or email..." style={{ border: "none", outline: "none", background: "transparent", fontSize: 15, color: "#374151", flex: 1, fontFamily: "inherit" }} />
              {hrUsersSearch && <Box onClick={() => setHrUsersSearch("")} sx={{ cursor: "pointer", display: "flex" }}><X size={12} color="#9CA3AF" /></Box>}
            </Box>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", whiteSpace: "nowrap" }}>{hrUsersTotal} user{hrUsersTotal !== 1 ? "s" : ""}</Typography>
            <Box sx={{ flex: 1 }} />
            <Box onClick={handleAdd}
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 2, height: 34, borderRadius: "8px", bgcolor: "#1C57B8", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", "&:hover": { bgcolor: "#143F7D" }, transition: "background 0.12s" }}>
              <Plus size={14} />
              Add HR User
            </Box>
          </Box>

          {/* Table */}
          <Box ref={hrUsersScrollRef} onScroll={(e) => setHrUsersScrolled((e.currentTarget as HTMLDivElement).scrollLeft > 0)} sx={{ borderRadius: "14px", bgcolor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflowX: "auto" }}>
            <Box sx={{ minWidth: 960 }}>
              <Box component="table" sx={{ width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, fontSize: 14 }}>
                <Box component="colgroup">
                  {[210, 210, 120, 200, 140, 80].map((w, i) => <Box key={i} component="col" sx={{ width: w }} />)}
                </Box>
                <Box component="thead">
                  <Box component="tr" sx={{ bgcolor: "#4B6B8A" }}>
                    {["User", "Email", "Role", "Company", "Created", "Actions"].map((h, hi) => (
                      <Box component="th" key={h} sx={{ px: 2.5, py: 1.5, textAlign: "left", fontSize: 13, fontWeight: 600, color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap", bgcolor: "#4B6B8A", ...(hi === 0 ? { position: "sticky", left: 0, zIndex: 3, borderRight: hrUsersScrolled ? "1px solid rgba(255,255,255,0.3)" : "none" } : {}) }}>{h}</Box>
                    ))}
                  </Box>
                </Box>
              </Box>
              <Box>
                <Box component="table" sx={{ width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, fontSize: 14 }}>
                  <Box component="colgroup">
                    {[210, 210, 120, 200, 140, 80].map((w, i) => <Box key={i} component="col" sx={{ width: w }} />)}
                  </Box>
                  <Box component="tbody">
                    {hrUsersLoading ? (
                      <Box component="tr"><Box component="td" colSpan={6} sx={{ py: 6, textAlign: "center" }}><CircularProgress size={28} sx={{ color: "#1C57B8" }} /></Box></Box>
                    ) : hrUsers.length === 0 ? (
                      <Box component="tr"><Box component="td" colSpan={6} sx={{ px: 3, py: 5, textAlign: "center" }}><Typography sx={{ fontSize: 14, color: "#9CA3AF" }}>No HR users found.</Typography></Box></Box>
                    ) : (
                      hrUsers.map((u, i) => {
                        const roleCfg = HR_ROLE_CONFIG[u.roleKey];
                        return (
                          <Box component="tr" key={u.hrManagementId} sx={{ borderBottom: i < hrUsers.length - 1 ? "1px solid #F3F4F6" : "none", "&:hover": { bgcolor: "#FAFBFF" } }}>
                            <Box component="td" sx={{ px: 2.5, py: 2, position: "sticky", left: 0, zIndex: 4, bgcolor: "#fff", borderRight: hrUsersScrolled ? "1px solid #94A3B8" : "none" }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: roleCfg?.bg ?? "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: roleCfg?.color ?? "#6B7280" }}>
                                    {(u.fullName || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                  </Typography>
                                </Box>
                                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{u.fullName}</Typography>
                              </Box>
                            </Box>
                            <Box component="td" sx={{ px: 2.5, py: 2 }}><Typography sx={{ fontSize: 13, color: "#6B7280" }}>{u.email}</Typography></Box>
                            <Box component="td" sx={{ px: 2.5, py: 2 }}>
                              {roleCfg ? (
                                <Box sx={{ px: 1.5, py: 0.35, borderRadius: 999, display: "inline-flex", bgcolor: roleCfg.bg, fontSize: 13, fontWeight: 600, color: roleCfg.color, whiteSpace: "nowrap" }}>
                                  {roleCfg.label}
                                </Box>
                              ) : (
                                <Typography sx={{ fontSize: 13, color: "#6B7280" }}>{u.roleKey}</Typography>
                              )}
                            </Box>
                            <Box component="td" sx={{ px: 2.5, py: 2 }}>
                              <Typography sx={{ fontSize: 13, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.companyName || `Company ${u.companyId}`}</Typography>
                            </Box>
                            <Box component="td" sx={{ px: 2.5, py: 2 }}>
                              <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                              </Typography>
                            </Box>
                            <Box component="td" sx={{ px: 2.5, py: 2 }}>
                             <Box
                                onClick={() => { setHrUsersEditId(u.hrManagementId); setHrUsersView("form"); }}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: "8px",
                                  border: "1px solid #BFDBFE",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  bgcolor: "#EBF3FF",
                                  "&:hover": { bgcolor: "#DBEAFE" },
                                }}
                              >
                                <Edit2 size={13} color="#1C57B8" />
                              </Box>
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

          {/* Pagination */}
          {hrUsersTotalPages != null && hrUsersTotalPages > 1 && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 0.5, py: 1, flexShrink: 0 }}>
              <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
                Page {hrUsersPage} of {hrUsersTotalPages} · {hrUsersTotal} total
              </Typography>
              <Box sx={{ display: "flex", gap: 0.75 }}>
                {[
                  { label: "← Prev", disabled: hrUsersPage <= 1, onClick: () => setHrUsersPage((p) => p - 1) },
                  { label: "Next →", disabled: hrUsersPage >= hrUsersTotalPages, onClick: () => setHrUsersPage((p) => p + 1) },
                ].map(({ label, disabled, onClick }) => (
                  <Box key={label} onClick={disabled ? undefined : onClick} sx={{ px: 2, height: 34, borderRadius: "8px", display: "flex", alignItems: "center", fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", bgcolor: disabled ? "#F3F4F6" : "#fff", color: disabled ? "#9CA3AF" : "#374151", border: "1px solid #E5E7EB", "&:hover": { bgcolor: disabled ? "#F3F4F6" : "#EBF3FF", color: disabled ? "#9CA3AF" : "#1C57B8" } }}>
                    {label}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* ── External HR: list view ───────────────────────────────────────────── */}
      {activeTab === "external_hr" && extHrView === "list" && (
        <Box sx={{ px: 4, py: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Success banner */}
          {extHrSuccessBanner && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2.5, py: 1.5, borderRadius: "12px", bgcolor: "#ECFDF5", border: "1px solid #A7F3D0" }}>
              <CheckCircle2 size={18} color="#059669" />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#059669", flex: 1 }}>{extHrSuccessBanner}</Typography>
              <Box onClick={() => setExtHrSuccessBanner(null)} sx={{ cursor: "pointer", display: "flex" }}><X size={14} color="#059669" /></Box>
            </Box>
          )}
          {/* Stats */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
            {[
              { label: "Total External HR", value: extHrUsers.length, icon: <Users size={16} color="#1C57B8" />, bg: "#EBF3FF", color: "#1C57B8" },
              { label: "Active", value: extHrUsers.filter((u) => u.status !== "INACTIVE").length, icon: <CheckCircle2 size={16} color="#059669" />, bg: "#ECFDF5", color: "#059669" },
              { label: "Avg. Policies", value: extHrUsers.length ? Math.round(extHrUsers.reduce((s, u) => s + Number(u.policyCount || 0), 0) / extHrUsers.length) : 0, icon: <Shield size={16} color="#7C3AED" />, bg: "#F5F3FF", color: "#7C3AED" },
            ].map(({ label, value, icon, bg, color }) => (
              <Box key={label} sx={{ p: 3, borderRadius: "14px", bgcolor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</Box>
                <Box>
                  <Typography sx={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</Typography>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", fontWeight: 500, mt: 0.75 }}>{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Search */}
          <Box sx={{ p: 2, borderRadius: "14px", bgcolor: "#fff", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ flex: 1, maxWidth: 360, display: "flex", alignItems: "center", gap: 0.75, px: 1.25, height: 32, borderRadius: "8px", border: "1px solid #E5E7EB", bgcolor: "#F9FAFB", "&:focus-within": { borderColor: "#1C57B8", bgcolor: "#fff" } }}>
              <Search size={13} color="#9CA3AF" />
              <input value={extHrSearch} onChange={(e) => setExtHrSearch(e.target.value)} placeholder="Search by name or email..." style={{ border: "none", outline: "none", background: "transparent", fontSize: 15, color: "#374151", flex: 1, fontFamily: "inherit" }} />
              {extHrSearch && <Box onClick={() => setExtHrSearch("")} sx={{ cursor: "pointer", display: "flex" }}><X size={12} color="#9CA3AF" /></Box>}
            </Box>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", whiteSpace: "nowrap" }}>{extHrUsers.length} user{extHrUsers.length !== 1 ? "s" : ""}</Typography>
            <Box sx={{ flex: 1 }} />
            <Box onClick={handleAdd}
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 2, height: 34, borderRadius: "8px", bgcolor: "#1C57B8", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", "&:hover": { bgcolor: "#143F7D" }, transition: "background 0.12s" }}>
              <Plus size={14} />
              Add HR
            </Box>
          </Box>

          {/* Table */}
          <Box ref={externalUsersScrollRef} onScroll={(e) => setExternalUsersScrolled((e.currentTarget as HTMLDivElement).scrollLeft > 0)} sx={{ borderRadius: "14px", bgcolor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", mb: 0, overflowX: "auto" }}>
            <Box sx={{ minWidth: 1060 }}>
              {/* Fixed header */}
              <Box component="table" sx={{ width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, fontSize: 14 }}>
                <Box component="colgroup">
                  {[210,210,110,200,120,140,80].map((w, i) => <Box key={i} component="col" sx={{ width: w }} />)}
                </Box>
                <Box component="thead">
                  <Box component="tr" sx={{ bgcolor: "#4B6B8A" }}>
                    {["User", "Email", "Policies", "Company", "Status", "Created", "Actions"].map((h, hi) => (
                      <Box component="th" key={h} sx={{ px: 2.5, py: 1.5, textAlign: "left", fontSize: 13, fontWeight: 600, color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap", bgcolor: "#4B6B8A", ...(hi === 0 ? { position: "sticky", left: 0, zIndex: 3, borderRight: externalUsersScrolled ? "1px solid rgba(255,255,255,0.3)" : "none" } : {}) }}>{h}</Box>
                    ))}
                  </Box>
                </Box>
              </Box>
              {/* Table body */}
              <Box>
                <Box component="table" sx={{ width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, fontSize: 14 }}>
                  <Box component="colgroup">
                    {[210,210,110,200,120,140,80].map((w, i) => <Box key={i} component="col" sx={{ width: w }} />)}
                  </Box>
                  <Box component="tbody">
                    {extHrLoading ? (
                      <Box component="tr"><Box component="td" colSpan={7} sx={{ py: 6, textAlign: "center" }}><CircularProgress size={28} sx={{ color: "#1C57B8" }} /></Box></Box>
                    ) : extHrUsers.length === 0 ? (
                      <Box component="tr"><Box component="td" colSpan={7} sx={{ px: 3, py: 5, textAlign: "center" }}><Typography sx={{ fontSize: 14, color: "#9CA3AF" }}>No external HR users found.</Typography></Box></Box>
                    ) : (
                      extHrUsers.map((u, i) => {
                        const isActive = u.status !== "INACTIVE";
                        return (
                          <Box component="tr" key={u.hrManagementId} sx={{ borderBottom: i < extHrUsers.length - 1 ? "1px solid #F3F4F6" : "none", "&:hover": { bgcolor: "#FAFBFF" } }}>
                            <Box component="td" sx={{ px: 2.5, py: 2, position: "sticky", left: 0, zIndex: 4, bgcolor: "#fff", borderRight: externalUsersScrolled ? "1px solid #94A3B8" : "none" }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "#EBF3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1C57B8" }}>
                                    {(u.fullName || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                  </Typography>
                                </Box>
                                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{u.fullName}</Typography>
                              </Box>
                            </Box>
                            <Box component="td" sx={{ px: 2.5, py: 2 }}><Typography sx={{ fontSize: 13, color: "#6B7280" }}>{u.email}</Typography></Box>
                            <Box component="td" sx={{ px: 2.5, py: 2 }}>
                              <Box sx={{ px: 1.5, py: 0.35, borderRadius: 999, display: "inline-flex", bgcolor: "#EBF3FF", fontSize: 13, fontWeight: 600, color: "#1C57B8" }}>
                                {u.policyCount} {Number(u.policyCount) === 1 ? "policy" : "policies"}
                              </Box>
                            </Box>
                            <Box component="td" sx={{ px: 2.5, py: 2 }}><Typography sx={{ fontSize: 13, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.companyName || `Company ${u.companyId}`}</Typography></Box>
                            <Box component="td" sx={{ px: 2.5, py: 2 }}>
                              {extHrStatusUpdating === u.hrManagementId ? (
                                <CircularProgress size={16} sx={{ color: "#1C57B8" }} />
                              ) : (
                                <Box onClick={() => handleExtHrStatusToggle(u)} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.5, py: 0.35, borderRadius: 999, cursor: "pointer", bgcolor: isActive ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${isActive ? "#ABEFC6" : "#FECACA"}`, "&:hover": { opacity: 0.8 } }}>
                                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: isActive ? "#22C55E" : "#EF4444" }} />
                                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: isActive ? "#059669" : "#DC2626" }}>{isActive ? "Active" : "Inactive"}</Typography>
                                </Box>
                              )}
                            </Box>
                            <Box component="td" sx={{ px: 2.5, py: 2 }}>
                              <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                              </Typography>
                            </Box>
                            <Box component="td" sx={{ px: 2.5, py: 2 }}>
                             <Box
                              onClick={() => { setExtHrEditUserId(u.hrManagementId); setExtHrView("form"); }}
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: "8px",
                                border: "1px solid #BFDBFE",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                bgcolor: "#EBF3FF",
                                "&:hover": { bgcolor: "#DBEAFE" },
                              }}
                            >
                              <Edit2 size={13} color="#1C57B8" />
                            </Box>
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

          {/* Pagination */}
          {extHrTotalPages != null && extHrTotalPages > 1 && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 0.5, py: 1, flexShrink: 0 }}>
              <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
                Page {extHrPage} of {extHrTotalPages} · {extHrTotal} total
              </Typography>
              <Box sx={{ display: "flex", gap: 0.75 }}>
                {[
                  { label: "← Prev", disabled: extHrPage <= 1, onClick: () => setExtHrPage((p) => p - 1) },
                  { label: "Next →", disabled: extHrPage >= extHrTotalPages, onClick: () => setExtHrPage((p) => p + 1) },
                ].map(({ label, disabled, onClick }) => (
                  <Box key={label} onClick={disabled ? undefined : onClick} sx={{ px: 2, height: 34, borderRadius: "8px", display: "flex", alignItems: "center", fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", bgcolor: disabled ? "#F3F4F6" : "#fff", color: disabled ? "#9CA3AF" : "#374151", border: "1px solid #E5E7EB", "&:hover": { bgcolor: disabled ? "#F3F4F6" : "#EBF3FF", color: disabled ? "#9CA3AF" : "#1C57B8" } }}>
                    {label}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* ── External HR: form view ───────────────────────────────────────────── */}
      {activeTab === "external_hr" && extHrView === "form" && (
        <ExternalHrForm
          editUserId={extHrEditUserId}
          adminCompanyId={sessionCompanyId}
          adminCompanyName={sessionCompanyName}
          onBack={() => { setExtHrView("list"); setExtHrEditUserId(null); }}
          onSuccess={() => { setExtHrView("success"); }}
        />
      )}

      {/* ── External HR: success view ────────────────────────────────────────── */}
      {activeTab === "external_hr" && extHrView === "success" && (
        <SuccessScreen
          title={extHrEditUserId ? "External HR User Updated" : "External HR User Created"}
          subtitle={`The user has been ${extHrEditUserId ? "updated" : "created"} and granted access to the selected policies.`}
          backLabel="Back to External HR List"
          onBack={() => {
            const msg = extHrEditUserId
              ? "External HR user updated successfully."
              : "External HR user created successfully.";
            setExtHrView("list");
            setExtHrEditUserId(null);
            refetchExtHr();
            setExtHrSuccessBanner(msg);
            if (successBannerTimer.current) clearTimeout(successBannerTimer.current);
            successBannerTimer.current = setTimeout(() => setExtHrSuccessBanner(null), 4000);
          }}
        />
      )}
    </Box>
  );
}

export default HRPortalUserManagement;
