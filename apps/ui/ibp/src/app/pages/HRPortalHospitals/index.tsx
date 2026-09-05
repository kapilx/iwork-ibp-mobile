import { Box, Typography } from "@mui/material";
import { FileText, ChevronDown, LocateFixed, MapPin, Search, Shield } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HospitalCards from "../HospitalNetworkV1/HospitalCards";
import HospitalMapView from "../HospitalNetworkV1/HospitalMapView";
import {
  PortalControlBar,
  PortalHeroHeader,
  PortalSearchField,
  PortalSelectControl,
} from "../HRPortal/controls";
import { endPoints, useApiMutation } from "@ui/ui-lib";
import { getCompanyId } from "../../utils/companyConfig";
import { useHRReport } from "../../hooks/useHRReport";

// ─── Types ────────────────────────────────────────────────────────────────────

type DirectoryView = "card" | "map";

type PolicyCardRow = { policyId: number; policyName: string };

type HospitalAddress = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  landmark?: string | null;
  cityName?: string | null;
  stateName?: string | null;
  countryName?: string | null;
  pinCode?: string | null;
  phoneNumber?: string | null;
  alternatePhoneNumber?: string | null;
  email?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

type HospitalResult = {
  id?: number | string;
  name?: string;
  addresses?: HospitalAddress | HospitalAddress[] | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_POLICIES = "All Policies";
const ALL_STATES = "All States";
const ALL_CITIES = "All Cities";
const MAP_LIMIT = 24;
const CARD_LIMIT = 12;
const SEARCH_DEBOUNCE_MS = 400;

// ─── Pure helpers (defined outside component — stable references) ──────────────

const getPrimaryAddress = (addresses: HospitalResult["addresses"]): HospitalAddress => {
  if (Array.isArray(addresses)) return addresses[0] || {};
  return addresses || {};
};

const buildLocationText = (address: HospitalAddress) =>
  [
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    address.cityName,
    address.stateName,
    address.pinCode,
    address.countryName,
  ]
    .filter(Boolean)
    .join(", ");

const getHospitalKey = (hospital: HospitalResult, index: number) =>
  hospital.id ?? `${hospital.name || "hospital"}-${index}`;

const mergeHospitals = (prev: HospitalResult[], next: HospitalResult[]): HospitalResult[] => {
  const map = new Map<string | number, HospitalResult>();
  prev.forEach((h, i) => map.set(getHospitalKey(h, i), h));
  next.forEach((h, i) => map.set(getHospitalKey(h, i), h));
  return Array.from(map.values());
};

// ─── Component ────────────────────────────────────────────────────────────────

export function HRPortalHospitals({ companyId: propCompanyId }: { companyId?: number | null }) {
  const companyId = propCompanyId ?? getCompanyId() ?? 0;

  // All company policy IDs come from dashboard_policy_cards — the correct HR-portal
  // data source. The employee Redux store (policyData) is empty for HR admins.
  const { data: policyCardsData, isLoading: isPolicyCardsLoading } =
    useHRReport<PolicyCardRow>(
      "dashboard_policy_cards",
      { companyId, policyType: "" },
      !!companyId,
    );

  // ─── UI state ───────────────────────────────────────────────────────────────
  const [view, setView] = useState<DirectoryView>("card");
  const [selectedPolicyId, setSelectedPolicyId] = useState("0");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedState, setSelectedState] = useState(ALL_STATES);
  const [selectedCity, setSelectedCity] = useState(ALL_CITIES);
  const [selectedHospital, setSelectedHospital] = useState<HospitalResult | null>(null);
  const [page, setPage] = useState(1);
  const [accumulatedHospitals, setAccumulatedHospitals] = useState<HospitalResult[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [actualUserLocation, setActualUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenterLocation, setMapCenterLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Policy options for filter dropdown — { label: full name, value: policyId string }
  const policyOptions = useMemo(() => {
    const seen = new Set<number>();
    const opts: { label: string; value: string }[] = [
      { label: ALL_POLICIES, value: "0" },
    ];
    for (const row of policyCardsData) {
      const id = Number(row.policyId);
      if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
      seen.add(id);
      opts.push({ label: row.policyName || String(id), value: String(id) });
    }
    return opts;
  }, [policyCardsData]);

  // Stable numeric ID list — de-duped, validated, and optionally filtered by selected policy
  const hospitalPolicyIds = useMemo(() => {
    if (selectedPolicyId !== "0") {
      const id = Number(selectedPolicyId);
      return Number.isFinite(id) && id > 0 ? [id] : [];
    }
    const ids = policyCardsData
      .map((row) => Number(row.policyId))
      .filter((id) => Number.isFinite(id) && id > 0);
    return Array.from(new Set(ids));
  }, [policyCardsData, selectedPolicyId]);

  // Serialized for use as a stable effect dependency (avoids array-reference churn)
  const serializedPolicyIds = useMemo(
    () => JSON.stringify(hospitalPolicyIds),
    [hospitalPolicyIds],
  );

  const showSyncedHospitals = import.meta.env.VITE_FF_SHOW_SYNCED_HOSPITALS !== "false";
  const policyIdsReady = showSyncedHospitals || hospitalPolicyIds.length > 0;

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const { mutate: fetchHospitals, data: hospitalData, isPending: isLoadingHospitals } =
    useApiMutation({});
  const { mutate: fetchStates, data: statesData } = useApiMutation({});
  const { mutate: fetchCities, data: citiesData } = useApiMutation({});

  // Keep mutate functions in refs so effects NEVER include them as dependencies.
  // This is the root cause of multiple API calls: if mutate isn't perfectly stable
  // across renders, including it in effect deps re-fires the effect on every render.
  const fetchHospitalsRef = useRef(fetchHospitals);
  fetchHospitalsRef.current = fetchHospitals;
  const fetchStatesRef = useRef(fetchStates);
  fetchStatesRef.current = fetchStates;
  const fetchCitiesRef = useRef(fetchCities);
  fetchCitiesRef.current = fetchCities;

  // Tracks which page was passed to the most recent hospital fetch request.
  // Used by the accumulation effect to decide merge vs replace — avoids stale
  // closure problems with `page` state.
  const lastFetchedPageRef = useRef(1);

  // ─── Geolocation (once on mount) ────────────────────────────────────────────
  useEffect(() => {
    const fallback = { lat: 17.385044, lng: 78.486671 };
    if (!navigator.geolocation) {
      setActualUserLocation(fallback);
      setMapCenterLocation(fallback);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setActualUserLocation(loc);
        setMapCenterLocation(loc);
      },
      () => {
        setActualUserLocation(fallback);
        setMapCenterLocation(fallback);
      },
    );
  }, []);

  // ─── Search debounce ────────────────────────────────────────────────────────
  // When the debounce timer fires we reset pagination atomically in the same
  // batch — React 18 batches all setState calls inside setTimeout callbacks
  // (via automatic batching with createRoot). This means the hospital fetch
  // effect sees debouncedSearch=newValue AND page=1 in the same render cycle,
  // so it fires exactly once for the new search term.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
      setAccumulatedHospitals([]);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  // ─── Location options (states list) ─────────────────────────────────────────
  // setTimeout(0) + clearTimeout cleanup prevents React 18 Strict Mode from
  // firing the API call twice (Strict Mode runs every effect twice in dev:
  // run → cleanup → run; the cleanup cancels the first timer before it fires).
  useEffect(() => {
    if (!policyIdsReady || !hospitalPolicyIds.length) return;
    const id = window.setTimeout(() => {
      fetchStatesRef.current({
        endpoint: endPoints.hospitalNetworkLocations(),
        method: "POST",
        data: { policyIds: hospitalPolicyIds },
      });
    }, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedPolicyIds, policyIdsReady]);

  // ─── Location options (cities list) ─────────────────────────────────────────
  useEffect(() => {
    if (!policyIdsReady || selectedState === ALL_STATES || !hospitalPolicyIds.length) return;
    const id = window.setTimeout(() => {
      fetchCitiesRef.current({
        endpoint: endPoints.hospitalNetworkLocations(),
        method: "POST",
        data: { policyIds: hospitalPolicyIds, state: selectedState },
      });
    }, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedPolicyIds, policyIdsReady, selectedState]);

  // ─── Primary hospital search ─────────────────────────────────────────────────
  // Filter resets (page=1, accumulatedHospitals=[]) happen atomically inside
  // event handlers — React 18 batches all setState in onClick/onChange, so the
  // effect sees new filter + page=1 in the same render → exactly one call per
  // user action.
  //
  // The setTimeout(0) + cleanup is critical: React 18 Strict Mode (dev only)
  // runs every effect twice (run → cleanup → run). Without a cleanup the effect
  // body fires twice → two API calls. The cleanup cancels the first timer before
  // it fires; only the second run's timer actually triggers the fetch.
  const lastRequestRef = useRef("");
  const lastResponseRef = useRef("");

  useEffect(() => {
    if (!policyIdsReady) return;

    const payload: Record<string, unknown> = {
      policyIds: hospitalPolicyIds,
      isNetworkHospital: true,
      ...(showSyncedHospitals ? { source: "API_SYNC" } : {}),
      page,
      limit: CARD_LIMIT,
    };

    if (debouncedSearch) {
      payload.search = debouncedSearch;
    }

    if (selectedState !== ALL_STATES) {
      payload.state = selectedState;
    }

    if (selectedCity !== ALL_CITIES) {
      payload.city = selectedCity;
    }

    const requestKey = JSON.stringify(payload);

    // prevent duplicate requests (skip dedup for synced mode — no policyIds to track)
    if (!showSyncedHospitals && lastRequestRef.current === requestKey) return;

    lastRequestRef.current = requestKey;

    lastFetchedPageRef.current = page;

    fetchHospitalsRef.current({
      endpoint: endPoints.getHospitalNetworks(),
      method: "POST",
      data: payload,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    serializedPolicyIds,
    policyIdsReady,
    page,
    debouncedSearch,
    selectedState,
    selectedCity,
  ]);
  // ─── Results accumulation ────────────────────────────────────────────────────
  const normalizedHospitals = useMemo(() => {
    const data: HospitalResult[] = hospitalData?.data?.data || [];
    return data.map((hospital) => ({
      ...hospital,
      addresses: getPrimaryAddress(hospital.addresses),
    }));
  }, [hospitalData]);

  // When new hospital data arrives: replace on page 1, merge on subsequent pages
  useEffect(() => {
    const responseKey = JSON.stringify(normalizedHospitals);

    // prevent duplicate rerender loops
    if (lastResponseRef.current === responseKey) return;

    lastResponseRef.current = responseKey;

    setIsLoadingMore(false);

    setAccumulatedHospitals((prev) => {
      if (lastFetchedPageRef.current === 1) {
        return normalizedHospitals;
      }

      return mergeHospitals(prev, normalizedHospitals);
    });
  }, [normalizedHospitals]);

  const displayHospitals = accumulatedHospitals.length > 0 ? accumulatedHospitals : normalizedHospitals;

  // ─── Derived values ──────────────────────────────────────────────────────────
  const stateOptions = useMemo(() => {
    if (showSyncedHospitals) {
      // Derive states from loaded synced hospitals directly — no extra API call
      const states = Array.from(new Set(
        accumulatedHospitals
          .map((h: any) => h.addresses?.stateName)
          .filter(Boolean)
      )).sort() as string[];
      return [ALL_STATES, ...states];
    }
    const states = (statesData?.data?.states || []) as string[];
    return [ALL_STATES, ...states];
  }, [statesData, showSyncedHospitals, accumulatedHospitals]);

  const cityOptions = useMemo(() => {
    if (showSyncedHospitals && selectedState !== ALL_STATES) {
      // Derive cities from loaded synced hospitals for the selected state
      const cities = Array.from(new Set(
        accumulatedHospitals
          .filter((h: any) => h.addresses?.stateName?.toLowerCase() === selectedState.toLowerCase())
          .map((h: any) => h.addresses?.cityName)
          .filter(Boolean)
      )).sort() as string[];
      return [ALL_CITIES, ...cities];
    }
    const cities = (citiesData?.data?.cities || []) as string[];
    return [ALL_CITIES, ...cities];
  }, [citiesData, showSyncedHospitals, accumulatedHospitals, selectedState]);

  const totalCount: number = hospitalData?.data?.count || 0;
  const hasMore = displayHospitals.length < totalCount;

  const isInitialLoading = policyIdsReady && isLoadingHospitals && displayHospitals.length === 0;

  // Show subtle fetch indicator when refreshing with existing results visible
  const isFetching = isLoadingHospitals && displayHospitals.length > 0;

  // ─── Handlers ────────────────────────────────────────────────────────────────

  // All filter change handlers reset pagination atomically with the filter update.
  // React 18 batches multiple setState calls inside event handlers → one render →
  // one effect run → one API call. No separate reset effect needed.

  const handlePolicyChange = useCallback((value: string) => {
    setSelectedPolicyId(value);
    setSelectedState(ALL_STATES);
    setSelectedCity(ALL_CITIES);
    setPage(1);
    setAccumulatedHospitals([]);
    setSelectedHospital(null);
  }, []);

  const handleStateChange = useCallback((value: string) => {
    setSelectedState(value);
    setSelectedCity(ALL_CITIES);
    setPage(1);
    setAccumulatedHospitals([]);
    setSelectedHospital(null);
  }, []);

  const handleCityChange = useCallback((value: string) => {
    setSelectedCity(value);
    setPage(1);
    setAccumulatedHospitals([]);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    // Only update the visible input — the debounce effect handles the reset + API call
    setSearchTerm(value);
  }, []);

  const handleViewToggle = useCallback(() => {
    setView((current) => (current === "card" ? "map" : "card"));
  }, []);

  const handleLoadMore = useCallback(() => {
    if (isLoadingHospitals || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setPage((current) => current + 1);
  }, [hasMore, isLoadingHospitals, isLoadingMore]);

  const handleShowOnMap = useCallback((hospital: HospitalResult) => {
    setSelectedHospital(hospital);
    setView("map");
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ mx: -3, mt: -0.5, minHeight: "100%", background: "#EBF6FF" }}>
      <Box sx={{ position: "sticky", top: 0, zIndex: 5, bgcolor: "#EBF6FF" }}>
        <PortalHeroHeader
          title="Network Hospitals"
          subtitle="List of Network hospitals as provided by the TPA. Verify with TPA before submission/admission, Search network hospitals, filter by location, and move between card and map view."
          noBorder
        />

        <PortalControlBar
        bleed={true}
        rightSlot={
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Policy filter chip — only shown when more than 2 policy options exist (matches the left-side dropdown's render rule) */}
            {policyOptions.length > 2 && (() => {
              const isPolicySelected = selectedPolicyId !== "0";
              const selectedLabel = isPolicySelected
                ? (policyOptions.find((p) => p.value === selectedPolicyId)?.label ?? "Selected")
                : "All";
              return (
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
                    background: isPolicySelected ? "#1d57b7" : "#EFF6FF",
                    color: isPolicySelected ? "#fff" : "#1d57b7",
                    border: isPolicySelected ? "1.5px solid #1d57b7" : "1.5px solid #93C5FD",
                    boxShadow: "none",
                    fontSize: 15, lineHeight: 1.7,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    minWidth: 140,
                    maxWidth: 240,
                    flexShrink: 0,
                    userSelect: "none",
                    "&:hover": { background: isPolicySelected ? "#1548A0" : "#DBEAFE", borderColor: "#1d57b7" },
                    transition: "all 0.15s",
                  }}
                >
                  <Shield size={14} style={{ flexShrink: 0 }} />
                  <Typography component="span" sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                    <Box component="span" sx={{ fontWeight: 700, opacity: 0.7, mr: 0.4 }}>Policy:</Box>
                    {selectedLabel}
                  </Typography>
                  <ChevronDown size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                  <Box
                    component="select"
                    value={selectedPolicyId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handlePolicyChange(e.target.value)}
                    aria-label="Filter hospitals by policy"
                    sx={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                  >
                    {policyOptions.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </Box>
                </Box>
              );
            })()}

            {/* Card / Map toggle */}
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4b5563" }}>Card</Typography>
            <Box
              onClick={handleViewToggle}
              sx={{
                width: 34,
                height: 18,
                borderRadius: 999,
                background: view === "map" ? "#58aaf8" : "#dfe7f0",
                position: "relative",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
            >
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: 2,
                  left: view === "map" ? 18 : 2,
                  transition: "left 0.2s ease",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.16)",
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#4b5563" }}>Map</Typography>
          </Box>
        }
      >
        <PortalSearchField
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search hospitals by name, city, state..."
          icon={<Search size={14} color="#98A2B3" />}
          width={300}
        />

        <PortalSelectControl
          value={selectedState}
          onChange={handleStateChange}
          options={stateOptions}
          width={170}
          leadingIcon={<MapPin size={14} />}
        />

        <PortalSelectControl
          value={selectedCity}
          onChange={handleCityChange}
          options={cityOptions}
          width={170}
          leadingIcon={<LocateFixed size={14} />}
          highlighted={selectedCity !== ALL_CITIES}
        />
      </PortalControlBar>
      </Box>

      {view === "card" ? (
        <Box sx={{ px: 4, py: 3.5 }}>
          <HospitalCards
            hospitals={displayHospitals}
            totalCount={totalCount}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onShowOnMap={handleShowOnMap}
            activeTab="network"
            isLoading={isInitialLoading}
            isFetching={isFetching || isLoadingMore}
          />
        </Box>
      ) : (
        <Box sx={{ px: 4, py: 3.5, minHeight: 610 }}>
          <HospitalMapView
            hospitals={displayHospitals}
            isLoading={isInitialLoading}
            userLocation={mapCenterLocation}
            actualUserLocation={actualUserLocation}
            focusHospital={selectedHospital}
          />
        </Box>
      )}
    </Box>
  );
}

export default HRPortalHospitals;
