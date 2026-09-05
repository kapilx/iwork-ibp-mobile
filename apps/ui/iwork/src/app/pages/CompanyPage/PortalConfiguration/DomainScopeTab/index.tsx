import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, CircularProgress, IconButton, Tooltip, Typography } from "@mui/material";
import { Building2, Check, Copy, Globe, Mail, Search, X } from "lucide-react";
import { HTTP_METHODS, apiRequest, endPoints } from "@ui/ui-lib";
import {
  SettingsSectionCard,
  SettingsSectionHeader,
  SettingsSectionIconBox,
  SettingsSectionText,
  SettingsSectionTitle,
  SettingsSectionDescription,
  SettingsSectionBody,
} from "../styles";

type PolicyOption = { id: number; name: string; policyNumber?: string; policyFrom?: string; policyTo?: string; insurerName?: string };
type LocationOption = { id: number; location_code: string; addr_1?: string };
type HierarchyCompany = { id: number; companyName: string; childCompanies?: { id: number; companyName: string }[] };

// ── CheckboxList (same as HR portal) ────────────────────────────────────────

function CheckboxList<T extends { id: number }>({
  label, items, labelKey, selectedIds, allSelected, onToggleAll, onToggle,
  isLoading, renderLabel, searchable = false, getSearchText, searchPlaceholder, disabled = false,
  takenIds = new Set<number>(),
}: {
  label: string; items: T[]; labelKey: keyof T; selectedIds: number[];
  allSelected: boolean; onToggleAll: () => void; onToggle: (id: number) => void;
  isLoading: boolean; renderLabel?: (item: T) => React.ReactNode;
  searchable?: boolean; getSearchText?: (item: T) => string; searchPlaceholder?: string; disabled?: boolean;
  takenIds?: Set<number>;
}) {
  const [search, setSearch] = React.useState("");
  // For Select All purposes, exclude taken items (they belong to other domains)
  const selectableItems = React.useMemo(() => items.filter((item) => !takenIds.has(item.id)), [items, takenIds]);
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
        {selectableItems.length > 0 && !disabled && (
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
      {searchable && !isLoading && items.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", height: 44, borderRadius: "10px", border: "1px solid #E5E7EB", bgcolor: "#F9FAFB", px: 1.5, gap: 0.75, "&:focus-within": { borderColor: "#1C57B8", bgcolor: "#fff" } }}>
          <Search size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder ?? `Search ${label.toLowerCase()}...`}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#111827", flex: 1, fontFamily: "inherit" }} />
          {search && <Box onClick={() => setSearch("")} sx={{ cursor: "pointer", display: "flex", alignItems: "center", color: "#9CA3AF", "&:hover": { color: "#374151" } }}><X size={12} /></Box>}
        </Box>
      )}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress size={24} sx={{ color: "#1C57B8" }} /></Box>
      ) : items.length === 0 ? (
        <Box sx={{ py: 3, textAlign: "center", border: "1px dashed #E5E7EB", borderRadius: "10px" }}>
          <Typography sx={{ fontSize: 14, color: "#9CA3AF" }}>No {label.toLowerCase()} available</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, maxHeight: 220, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#D1D5DB", borderRadius: 4 } }}>
          {filtered.length === 0 ? (
            <Box sx={{ py: 2, textAlign: "center" }}><Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>No results for "{search}"</Typography></Box>
          ) : filtered.map((item) => {
            const isTaken = takenIds.has(item.id);
            const isDisabled = disabled || isTaken;
            const checked = !isTaken && (allSelected || selectedIds.includes(item.id));
            return (
              <Tooltip key={item.id} title={isTaken ? "Already assigned to another domain" : ""} placement="right">
                <Box onClick={isDisabled ? undefined : () => onToggle(item.id)}
                  sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, borderRadius: "8px",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isTaken ? 0.45 : 1,
                    bgcolor: isTaken ? "#F3F4F6" : checked ? "#EBF3FF" : "#F9FAFB",
                    border: isTaken ? "1px solid #E5E7EB" : checked ? "1px solid #BFDBFE" : "1px solid transparent",
                    "&:hover": isDisabled ? {} : { bgcolor: checked ? "#DBEAFE" : "#F3F4F6" } }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: "4px",
                    border: isTaken ? "1.5px solid #D1D5DB" : checked ? "none" : "1.5px solid #D1D5DB",
                    bgcolor: isTaken ? "#E5E7EB" : checked ? "#1C57B8" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {checked && <X size={10} color="#fff" strokeWidth={3} />}
                  </Box>
                  <Typography sx={{ fontSize: 14, color: isTaken ? "#9CA3AF" : checked ? "#1C57B8" : "#374151", fontWeight: checked ? 600 : 400 }}>
                    {renderLabel ? renderLabel(item) : String(item[labelKey])}
                  </Typography>
                  {isTaken && (
                    <Typography sx={{ fontSize: 11, color: "#9CA3AF", ml: "auto", fontStyle: "italic", flexShrink: 0 }}>
                      other domain
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

// ── Per-company state ────────────────────────────────────────────────────────

interface CompanyState {
  allPolicies: boolean; policyIds: number[];
  allLocations: boolean; locationIds: number[];
  policies: PolicyOption[]; locations: LocationOption[];
  takenPolicyIds: Set<number>; policiesLoading: boolean; locationsLoading: boolean;
}

export type ScopeEntry = { companyId: number; policies: { policyId: number }[]; locationIds: number[] };

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

interface Props {
  configId: number | null;
  currentCompanyId: number | string | undefined;
  currentCompanyName?: string;
  inheritedCompanyIds: number[];
  onInheritedCompaniesChange: (ids: number[]) => void;
  isEditMode: boolean;
  onScopeChange?: (scope: ScopeEntry[]) => void;
  onDirty?: () => void;
  fullUrl?: string | null;
  ccEmailAddresses?: string[];
  onCcEmailAddressesChange?: (emails: string[]) => void;
}

export const DomainScopeTab: React.FC<Props> = ({
  configId, currentCompanyId, currentCompanyName, inheritedCompanyIds, onInheritedCompaniesChange, isEditMode, onScopeChange, onDirty, fullUrl,
  ccEmailAddresses = [], onCcEmailAddressesChange,
}) => {
  const [urlCopied, setUrlCopied] = useState(false);
  const [companyStates, setCompanyStates] = useState<Record<number, CompanyState>>({});
  const [ccEmailInput, setCcEmailInput] = useState("");
  const [ccEmailError, setCcEmailError] = useState<string | null>(null);

  const addCcEmail = useCallback(() => {
    const email = ccEmailInput.trim();
    if (!email) return;
    if (!EMAIL_REGEX.test(email)) { setCcEmailError("Enter a valid email address"); return; }
    if (ccEmailAddresses.some((e) => e.toLowerCase() === email.toLowerCase())) { setCcEmailError("Email already added"); return; }
    onDirty?.();
    onCcEmailAddressesChange?.([...ccEmailAddresses, email]);
    setCcEmailInput("");
    setCcEmailError(null);
  }, [ccEmailInput, ccEmailAddresses, onCcEmailAddressesChange, onDirty]);

  const removeCcEmail = useCallback((email: string) => {
    onDirty?.();
    onCcEmailAddressesChange?.(ccEmailAddresses.filter((e) => e !== email));
  }, [ccEmailAddresses, onCcEmailAddressesChange, onDirty]);

  // Company search (same as HR portal)
  const [companySearch, setCompanySearch] = useState("");
  const [hierarchyResults, setHierarchyResults] = useState<HierarchyCompany[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const nameCache = useRef<Map<number, string>>(new Map());
  const [, forceNameRefresh] = useState(0);

  // Seed own company into nameCache so per-company cards always show the name
  React.useEffect(() => {
    if (currentCompanyId && currentCompanyName) {
      nameCache.current.set(Number(currentCompanyId), currentCompanyName);
    }
  }, [currentCompanyId, currentCompanyName]);

  // Fetch company names for inherited companies that are not yet in the cache (e.g. on initial load from saved config)
  useEffect(() => {
    const missingIds = inheritedCompanyIds.filter((cid) => !nameCache.current.has(cid));
    if (missingIds.length === 0) return;
    let resolved = 0;
    missingIds.forEach((cid) => {
      apiRequest(endPoints.companyById(cid), { method: HTTP_METHODS.GET })
        .then((res: any) => {
          const name = res?.data?.companyName || res?.companyName;
          if (name) nameCache.current.set(cid, name);
        })
        .catch(() => {})
        .finally(() => { resolved++; if (resolved === missingIds.length) forceNameRefresh((n) => n + 1); });
    });
  }, [inheritedCompanyIds]);

  // Debounced hierarchy search — same as HR portal
  useEffect(() => {
    if (!companySearch.trim()) { setHierarchyResults([]); setDropdownOpen(false); return; }
    const term = companySearch.trim();
    const timer = setTimeout(() => {
      setSearchLoading(true);
      const isNumeric = /^\d+$/.test(term);
      const nameSearch = apiRequest(`${endPoints.ibpCompanyHierarchy}?page=1&limit=1000&search=${encodeURIComponent(term)}`, { method: HTTP_METHODS.GET });
      const idSearch = isNumeric
        ? apiRequest(endPoints.companyById(Number(term)), { method: HTTP_METHODS.GET }).catch(() => null)
        : Promise.resolve(null);
      Promise.all([nameSearch, idSearch])
        .then(([nameRes, idRes]: [any, any]) => {
          const list: HierarchyCompany[] = Array.isArray(nameRes?.data?.data) ? nameRes.data.data : Array.isArray(nameRes?.data) ? nameRes.data : [];
          if (idRes) {
            const c = idRes?.data ?? idRes;
            if (c?.id && !list.find((x) => x.id === c.id)) {
              list.unshift({ id: c.id, companyName: c.companyName ?? `Company #${c.id}` });
            }
          }
          list.forEach((p) => {
            nameCache.current.set(p.id, p.companyName);
            p.childCompanies?.forEach((ch) => nameCache.current.set(ch.id, ch.companyName));
          });
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
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleCompany = useCallback((id: number, name: string) => {
    nameCache.current.set(id, name);
    const exists = inheritedCompanyIds.includes(id);
    onInheritedCompaniesChange(exists ? inheritedCompanyIds.filter((cid) => cid !== id) : [...inheritedCompanyIds, id]);
  }, [inheritedCompanyIds, onInheritedCompaniesChange]);  // onDirty handled by onInheritedCompaniesChange wrapper in parent

  const toggleGroupCompany = useCallback((parent: HierarchyCompany) => {
    const parentSelected = inheritedCompanyIds.includes(parent.id);
    if (parentSelected) {
      const removeIds = new Set([parent.id, ...(parent.childCompanies ?? []).map((ch) => ch.id)]);
      onInheritedCompaniesChange(inheritedCompanyIds.filter((id) => !removeIds.has(id)));
    } else {
      const toAdd: number[] = [];
      if (!inheritedCompanyIds.includes(parent.id)) { nameCache.current.set(parent.id, parent.companyName); toAdd.push(parent.id); }
      (parent.childCompanies ?? []).forEach((ch) => {
        if (!inheritedCompanyIds.includes(ch.id)) { nameCache.current.set(ch.id, ch.companyName); toAdd.push(ch.id); }
      });
      onInheritedCompaniesChange([...inheritedCompanyIds, ...toAdd]);
    }
  }, [inheritedCompanyIds, onInheritedCompaniesChange]);

  // All company IDs shown in cards
  const allCompanyIds = React.useMemo(() => [
    ...(currentCompanyId ? [Number(currentCompanyId)] : []),
    ...inheritedCompanyIds,
  ], [currentCompanyId, inheritedCompanyIds]);

  const updateCompany = useCallback((id: number, patch: Partial<CompanyState>) => {
    onDirty?.();
    setCompanyStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, [onDirty]);

  const fetchCompanyData = useCallback((cid: number) => {
    setCompanyStates((prev) => ({
      ...prev,
      [cid]: prev[cid] ?? { allPolicies: false, policyIds: [], allLocations: false, locationIds: [], policies: [], locations: [], takenPolicyIds: new Set(), policiesLoading: true, locationsLoading: true },
    }));
    apiRequest(`${endPoints.generateHRReports}external_hr_company_policies?page=1&limit=0`, { method: HTTP_METHODS.POST, data: { companyId: String(cid) } })
      .then((res: any) => setCompanyStates((prev) => prev[cid] ? { ...prev, [cid]: { ...prev[cid], policies: res?.data?.data ?? [], policiesLoading: false } } : prev))
      .catch(() => setCompanyStates((prev) => prev[cid] ? { ...prev, [cid]: { ...prev[cid], policiesLoading: false } } : prev));
    apiRequest(`${endPoints.generateHRReports}external_hr_company_locations?page=1&limit=0`, { method: HTTP_METHODS.POST, data: { companyId: String(cid) } })
      .then((res: any) => setCompanyStates((prev) => prev[cid] ? { ...prev, [cid]: { ...prev[cid], locations: res?.data?.data ?? [], locationsLoading: false } } : prev))
      .catch(() => setCompanyStates((prev) => prev[cid] ? { ...prev, [cid]: { ...prev[cid], locationsLoading: false } } : prev));
    // Always fetch taken policies — use 0 as excludeConfigId for new (unsaved) domains
    apiRequest(endPoints.domainConfigScopeTaken(cid, configId ?? 0), { method: HTTP_METHODS.GET })
      .then((res: any) => setCompanyStates((prev) => prev[cid] ? { ...prev, [cid]: { ...prev[cid], takenPolicyIds: new Set<number>(Array.isArray(res?.data) ? res.data : []) } } : prev))
      .catch(() => {});
  }, [configId]);

  // Load saved scope + all company data — reset fully when configId changes
  useEffect(() => {
    if (!allCompanyIds.length) return;
    // Clear all previous selections so switching domains starts fresh
    setCompanyStates({});
    (async () => {
      let savedRows: Array<{ companyId: number; policyId: number | null; addressId: number | null }> = [];
      if (configId) {
        try {
          const res = await apiRequest(endPoints.domainConfigScope(configId), { method: HTTP_METHODS.GET });
          savedRows = Array.isArray(res?.data) ? res.data : [];
        } catch { /* defaults */ }
      }

      for (const cid of allCompanyIds) {
        const rows = savedRows.filter((r) => r.companyId === cid);
        let savedState: Partial<CompanyState> = {};
        if (rows.length) {
          const hasSentinel = rows.some((r) => r.policyId === null && r.addressId === null);
          const policyRows = rows.filter((r) => r.policyId !== null && r.addressId === null);
          const locationRows = rows.filter((r) => r.policyId === null && r.addressId !== null);
          savedState = {
            allPolicies: hasSentinel || (!policyRows.length && !locationRows.length),
            policyIds: policyRows.map((r) => r.policyId as number),
            allLocations: !locationRows.length,
            locationIds: locationRows.map((r) => r.addressId as number),
          };
        }
        setCompanyStates((prev) => ({
          ...prev,
          [cid]: { allPolicies: false, policyIds: [], allLocations: false, locationIds: [], policies: [], locations: [], takenPolicyIds: new Set(), policiesLoading: true, locationsLoading: true, ...savedState },
        }));
        fetchCompanyData(cid);
      }
    })();
  }, [configId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch data for newly added inherited companies
  useEffect(() => {
    for (const cid of inheritedCompanyIds) {
      if (!companyStates[cid]) fetchCompanyData(cid);
    }
  }, [inheritedCompanyIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent whenever scope state changes so main Save can include it
  useEffect(() => {
    if (!onScopeChange) return;
    const scope: ScopeEntry[] = allCompanyIds.map((cid) => {
      const state = companyStates[cid];
      if (!state) return { companyId: cid, policies: [], locationIds: [] };
      const taken = state.takenPolicyIds ?? new Set<number>();
      return {
        companyId: cid,
        // allPolicies=true → send empty array (backend interprets as "all selectable policies")
        // filter out any taken IDs that may have slipped in
        policies: state.allPolicies ? [] : state.policyIds.filter((pid) => !taken.has(pid)).map((pid) => ({ policyId: pid })),
        locationIds: state.allLocations ? [] : state.locationIds,
      };
    });
    onScopeChange(scope);
  }, [companyStates, allCompanyIds]); // eslint-disable-line react-hooks/exhaustive-deps


  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      {/* ── Portal & Scope section — merged URL + company ── */}
      <SettingsSectionCard sx={{ overflow: "visible" }}>
        <SettingsSectionHeader>
          <SettingsSectionIconBox>
            <Globe size={22} color="#3B82F6" />
          </SettingsSectionIconBox>
          <SettingsSectionText>
            <SettingsSectionTitle>Portal & Scope</SettingsSectionTitle>
            <SettingsSectionDescription>
              {currentCompanyName || `Company #${currentCompanyId}`}
              {fullUrl && ` · ${fullUrl}`}
              {inheritedCompanyIds.length > 0 && ` · ${inheritedCompanyIds.length} inherited compan${inheritedCompanyIds.length > 1 ? 'ies' : 'y'}`}
            </SettingsSectionDescription>
          </SettingsSectionText>
        </SettingsSectionHeader>
        <SettingsSectionBody>

          {/* Portal URL row — only in view mode when URL is known */}
          {!isEditMode && fullUrl && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", mb: 1 }}>Portal URL</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1.1, borderRadius: "10px", bgcolor: "#EFF6FF", border: "1.5px solid #BFDBFE" }}>
                <Globe size={14} color="#1D4ED8" />
                <Typography
                  component="a"
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ fontSize: 14, fontWeight: 500, color: "#1D4ED8", flex: 1, textDecoration: "none", "&:hover": { textDecoration: "underline" }, wordBreak: "break-all" }}
                >
                  {fullUrl}
                </Typography>
                <Tooltip title={urlCopied ? "Copied!" : "Copy URL"}>
                  <IconButton
                    size="small"
                    onClick={() => { navigator.clipboard.writeText(fullUrl); setUrlCopied(true); setTimeout(() => setUrlCopied(false), 2000); }}
                    sx={{ flexShrink: 0 }}
                  >
                    {urlCopied ? <Check size={14} color="#16a34a" /> : <Copy size={14} color="#6B7280" />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}

          {/* Own company — non-removable primary entry */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", mb: 1 }}>Own Company</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1.1, borderRadius: "10px", bgcolor: "#EFF6FF", border: "1.5px solid #BFDBFE" }}>
              <Building2 size={14} color="#1D4ED8" />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1D4ED8", flex: 1 }}>
                {currentCompanyName || `Company #${currentCompanyId}`}
              </Typography>
              <Box sx={{ px: 1, py: 0.25, borderRadius: "6px", bgcolor: "#DBEAFE" }}>
                <Typography sx={{ fontSize: 11, color: "#1D4ED8", fontWeight: 700 }}>Primary</Typography>
              </Box>
            </Box>
          </Box>

          {/* CC email addresses — applied as CC on eligible notification emails sent for this domain */}
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", mb: 1 }}>
              CC Email Addresses (Optional)
            </Typography>
            {ccEmailAddresses.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: isEditMode ? 1.5 : 0 }}>
                {ccEmailAddresses.map((email) => (
                  <Box key={email} sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.5, borderRadius: "8px", bgcolor: "#EFF6FF", border: "1.5px solid #BFDBFE" }}>
                    <Mail size={12} color="#1D4ED8" />
                    <Typography sx={{ fontSize: 13, color: "#1D4ED8", fontWeight: 600 }}>{email}</Typography>
                    {isEditMode && (
                      <Box onClick={() => removeCcEmail(email)} sx={{ cursor: "pointer", display: "flex", alignItems: "center", ml: 0.25, "&:hover": { opacity: 0.7 } }}>
                        <X size={12} color="#6B7280" />
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
            {ccEmailAddresses.length === 0 && !isEditMode && (
              <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>No CC email addresses configured</Typography>
            )}
            {isEditMode && (
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", height: 44, borderRadius: "10px", border: ccEmailError ? "1px solid #FCA5A5" : "1px solid #E5E7EB", bgcolor: "#F9FAFB", px: 1.5, gap: 0.75, "&:focus-within": { borderColor: "#1C57B8", bgcolor: "#fff" } }}>
                  <Mail size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />
                  <input
                    value={ccEmailInput}
                    onChange={(e) => { setCcEmailInput(e.target.value); setCcEmailError(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCcEmail(); } }}
                    onBlur={() => { if (ccEmailInput.trim()) addCcEmail(); }}
                    placeholder="Enter an email and press Enter…"
                    style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#111827", flex: 1, fontFamily: "inherit" }}
                  />
                </Box>
                {ccEmailError && (
                  <Typography sx={{ fontSize: 12, color: "#DC2626", mt: 0.5 }}>{ccEmailError}</Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Inherited companies label + chips */}
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", mb: 1 }}>
              {isEditMode ? "Inherited Companies" : (inheritedCompanyIds.length > 0 ? "Inherited Companies" : "")}
            </Typography>
            {inheritedCompanyIds.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
                {inheritedCompanyIds.map((cid) => (
                  <Box key={cid} sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.5, borderRadius: "8px", bgcolor: "#F0FDF4", border: "1.5px solid #BBF7D0" }}>
                    <Building2 size={12} color="#15803D" />
                    <Typography sx={{ fontSize: 13, color: "#15803D", fontWeight: 600 }}>{nameCache.current.get(cid) ?? `Company #${cid}`}<span style={{ opacity: 0.55, fontSize: 11, marginLeft: 5 }}>#{cid}</span></Typography>
                    {isEditMode && (
                      <Box onClick={() => toggleCompany(cid, nameCache.current.get(cid) ?? "")} sx={{ cursor: "pointer", display: "flex", alignItems: "center", ml: 0.25, "&:hover": { opacity: 0.7 } }}>
                        <X size={12} color="#6B7280" />
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
            {!isEditMode && inheritedCompanyIds.length === 0 && (
              <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>No inherited companies</Typography>
            )}
          </Box>

        {/* Search input + hierarchy dropdown */}
        {isEditMode && (
          <Box ref={companyDropdownRef} sx={{ position: "relative" }}>
            <Box sx={{ display: "flex", alignItems: "center", height: 44, borderRadius: "10px", border: "1px solid #E5E7EB", bgcolor: "#F9FAFB", px: 1.5, gap: 0.75, "&:focus-within": { borderColor: "#1C57B8", bgcolor: "#fff" } }}>
              <Search size={13} color="#9CA3AF" />
              <input
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                onFocus={() => { if (hierarchyResults.length > 0) setDropdownOpen(true); }}
                placeholder="Search by company name or IIRM company ID…"
                style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#111827", flex: 1, fontFamily: "inherit" }}
              />
              {searchLoading && <CircularProgress size={13} sx={{ color: "#1C57B8", flexShrink: 0 }} />}
            </Box>

            {dropdownOpen && hierarchyResults.length > 0 && (
              <Box sx={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, bgcolor: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 200, maxHeight: 300, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#D1D5DB", borderRadius: 4 } }}>
                {hierarchyResults.map((parent, pi) => {
                  const parentSelected = inheritedCompanyIds.includes(parent.id);
                  return (
                    <Box key={parent.id} sx={{ borderTop: pi > 0 ? "1px solid #F3F4F6" : "none" }}>
                      <Box
                        onMouseDown={(e) => { e.preventDefault(); toggleCompany(parent.id, parent.companyName); }}
                        sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.75, py: 1.1, cursor: "pointer", "&:hover": { bgcolor: "#F0F7FF" }, bgcolor: parentSelected ? "#EBF3FF" : "transparent" }}
                      >
                        <Box sx={{ width: 16, height: 16, borderRadius: "4px", border: parentSelected ? "none" : "1.5px solid #D1D5DB", bgcolor: parentSelected ? "#1C57B8" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {parentSelected && <X size={10} color="#fff" strokeWidth={3} />}
                        </Box>
                        <Building2 size={14} color={parentSelected ? "#1C57B8" : "#374151"} />
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: parentSelected ? "#1C57B8" : "#111827", flex: 1 }}>{parent.companyName}</Typography>
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
                      {parent.childCompanies?.map((child) => {
                        const childSelected = inheritedCompanyIds.includes(child.id);
                        return (
                          <Box key={child.id}
                            onMouseDown={(e) => { e.preventDefault(); toggleCompany(child.id, child.companyName); }}
                            sx={{ display: "flex", alignItems: "center", gap: 1, pl: 4, pr: 1.75, py: 0.9, cursor: "pointer", "&:hover": { bgcolor: "#F0F7FF" }, bgcolor: childSelected ? "#EBF3FF" : "#FAFAFA", borderTop: "1px solid #F3F4F6" }}
                          >
                            <Box sx={{ width: 14, height: 14, borderRadius: "4px", border: childSelected ? "none" : "1.5px solid #D1D5DB", bgcolor: childSelected ? "#1C57B8" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {childSelected && <X size={8} color="#fff" strokeWidth={3} />}
                            </Box>
                            <Typography sx={{ fontSize: 13, color: childSelected ? "#1C57B8" : "#374151", fontWeight: childSelected ? 600 : 400 }}>{child.companyName}</Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
        </SettingsSectionBody>
      </SettingsSectionCard>

      {/* ── Per-company policy + location cards ── */}
      {allCompanyIds.map((cid) => {
        const state = companyStates[cid];
        if (!state || !state.policies) return null;
        const name = cid === Number(currentCompanyId)
          ? (currentCompanyName || nameCache.current.get(cid) || `Company #${cid}`)
          : (nameCache.current.get(cid) || `Company #${cid}`);
        const takenPolicyIds = state.takenPolicyIds ?? new Set<number>();
        // selectablePolicies = policies NOT taken by another domain (for toggle-all count)
        const selectablePolicies = state.policies.filter((p) => !takenPolicyIds.has(p.id));
        const allLocationsSelected = state.allLocations;

        return (
          <Box key={cid} sx={{ p: 3, borderRadius: "16px", bgcolor: "#fff", border: "1.5px solid #BFDBFE", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, pb: 1.5, borderBottom: "1px solid #F3F4F6" }}>
              <Building2 size={15} color="#1C57B8" />
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#1C57B8", flex: 1 }}>{name}<span style={{ opacity: 0.55, fontSize: 11, fontWeight: 400, marginLeft: 6 }}>#{cid}</span></Typography>
            </Box>

            <Box sx={{ mb: 2.5 }}>
              <CheckboxList<PolicyOption>
                label="Policies *" items={state.policies} labelKey="name"
                selectedIds={state.policyIds} allSelected={state.allPolicies}
                takenIds={takenPolicyIds}
                onToggleAll={() => updateCompany(cid, { allPolicies: !state.allPolicies, policyIds: [] })}
                onToggle={(id) => {
                  if (state.allPolicies) {
                    // All were selected — clicking one deselects just that item (only from selectable ones)
                    const next = selectablePolicies.map((p) => p.id).filter((pid) => pid !== id);
                    updateCompany(cid, { policyIds: next, allPolicies: false });
                  } else {
                    const next = state.policyIds.includes(id) ? state.policyIds.filter((p) => p !== id) : [...state.policyIds, id];
                    updateCompany(cid, { policyIds: next, allPolicies: false });
                  }
                }}
                isLoading={state.policiesLoading} disabled={!isEditMode} searchable
                searchPlaceholder="Search by policy name,insurer policy no,IIRM policy ID…"
                getSearchText={(p) => [p.name, p.policyNumber, p.insurerName, String(p.id)].filter(Boolean).join(" ")}
                renderLabel={(p) => (
                  <span>
                    {p.name}
                    {(p.policyNumber || p.policyFrom) && (
                      <span style={{ opacity: 0.7, fontSize: 12, marginLeft: 6 }}>
                        {p.policyNumber ? `[${p.policyNumber}]` : ""}
                        {p.policyFrom && p.policyTo ? ` ${p.policyFrom} – ${p.policyTo}` : ""}
                      </span>
                    )}
                    {p.insurerName && <span style={{ opacity: 0.6, fontSize: 11, marginLeft: 6, color: "#6B7280" }}>{p.insurerName}</span>}
                    <span style={{ opacity: 0.45, fontSize: 11, marginLeft: 6, color: "#6B7280" }}>#{p.id}</span>
                  </span>
                )}
              />
            </Box>

            <CheckboxList<LocationOption>
              label="Location / Branch Access (optional)" items={state.locations} labelKey="location_code"
              selectedIds={state.locationIds} allSelected={allLocationsSelected}
              onToggleAll={() => updateCompany(cid, { allLocations: !state.allLocations, locationIds: [] })}
              onToggle={(id) => {
                if (state.allLocations) {
                  // All were selected — clicking one deselects just that item
                  const next = state.locations.map((l) => l.id).filter((lid) => lid !== id);
                  updateCompany(cid, { locationIds: next, allLocations: false });
                } else {
                  const next = state.locationIds.includes(id) ? state.locationIds.filter((l) => l !== id) : [...state.locationIds, id];
                  updateCompany(cid, { locationIds: next, allLocations: false });
                }
              }}
              isLoading={state.locationsLoading} disabled={!isEditMode} searchable
              getSearchText={(l) => (l.addr_1 ? `${l.location_code} ${l.addr_1}` : l.location_code)}
              renderLabel={(l) => (
                <span><span style={{ fontWeight: 600 }}>{l.location_code}</span>{l.addr_1 && <span style={{ opacity: 0.65, marginLeft: 6, fontSize: 12 }}>{l.addr_1}</span>}</span>
              )}
            />
          </Box>
        );
      })}

    </Box>
  );
};
