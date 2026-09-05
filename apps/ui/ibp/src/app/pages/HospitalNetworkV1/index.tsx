import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { InputAdornment,Box ,Button, Modal} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import KeyboardArrowDownImage from "../../../assets/svgs/filtered-icon.svg";
import { useSelector, useDispatch } from "react-redux";
import { UseFormReturn } from "react-hook-form";
import {
  useApiQuery,
  useApiMutation,
  endPoints,
  apiRequest,
  ibpTheme as theme,
  DynamicForm,
  setToastMessage,
  formatNumberByLocalization,
  CustomModal,
  useLocalization,
} from "@ui/ui-lib";
import {
  HOSPITAL_FILTER_FORM_CONFIG,
  initialHospitalFilterValues,
  ITEMS_PER_PAGE,
} from "./config";
import {
  BackToPageContainer,
  BackToPageImage,
  BackToPageText,
  ButtonText,
  CardsContainer,
  ClearAllButton,
  ClearAllButtonText,
  DownloadIcon,
  ErrorContainer,
  FilterContainerSubHeading,
  FiltersContainer,
  FiltersContainerForm,
  FiltersContainerHeading,
  FiltersContainerSearch,
  FiltersBackgroundImage,
  HospitalHeaderBar,
  HospitalHeaderDivider,
  HospitalHeaderFilterButton,
  HospitalHeaderLeft,
  HospitalHeaderRight,
  HospitalHeaderTitle,
  HospitalHeaderViewText,
  HospitalButton,
  HospitalButtonContainer,
  HospitalContainer,
  HospitalContent,
  HospitalCount,
  HospitalExportButton,
  HospitalHeading,
  HospitalNetworkContainer,
  HospitalTopContainer,
  SearchButton,
  StyledSearchField,
  SearchClearButton,
  SearchClearIcon,
  SearchAdornmentSeparator,
  SearchAdornmentIcon,
  ViewToggleSwitch,
  FilterOutlinedIcon,
  KeyboardArrowDown,
  FilterContainer,
  ButtonContainer,
  StyledModal,
  FilterCloseIcon,
  HospitalHeaderSubTitle,
  HospitalHeaderTextContainer
} from "./styles";
import closeIcon from "../../../assets/svgs/hospital-cancel-icon.svg";
import searchClearIcon from "../../assets/svgs/close-icon.svg";
import downloadIcon from "../../assets/svgs/download-icon.svg";
import hospitalNetworkBg from "../../../assets/svgs/hospital-banner-image.svg";
import searchIcon from '../../../assets/svgs/support-search-icon.svg'
import filterIcon from '../../../assets/svgs/hospital-filter-icon.svg'
import HospitalCards from "./HospitalCards";
import { HOSPITALNETWORK } from "../../constants";
import PreviousPageIcon from "../../assets/svgs/pagination-left.svg";
import { useNavigate } from "react-router-dom";
import HospitalMapView from "./HospitalMapView";

type HospitalFilterValues = typeof initialHospitalFilterValues;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Map view geo-search radius (km). Starts small and doubles (5 -> 10 -> 20 -> 40 -> 80 ...)
// whenever the current radius covers less than 1% of the total matching hospitals, or
// whenever the user zooms out past what the current radius covers. Once the radius
// hits MAX_MAP_SEARCH_RADIUS_KM, that's treated as "fully zoomed out" and every
// matching hospital counts toward the total (see totalHospitalCount) — but only the
// first MAX_RENDERED_MAP_MARKERS are actually drawn as pins (see mapMarkersToRender).
// Rendering thousands of raw, unclustered google.maps.Marker objects freezes the
// browser; in practice nobody visually scans that many pins anyway — they search by
// name and the map recenters on the result — so capping what's drawn (not what's
// counted or searchable) is the pragmatic fix until proper marker clustering lands.
const INITIAL_MAP_SEARCH_RADIUS_KM = 5;
const MAX_MAP_SEARCH_RADIUS_KM = 5000;
const MIN_HOSPITAL_COVERAGE_RATIO = 0.01; // 1% of total matching hospitals
const MAX_RENDERED_MAP_MARKERS = 900;
// Synced (API_SYNC) branch: the backend loads every match into memory regardless of
// `limit` before slicing, so requesting a generous limit here costs nothing extra and
// guarantees the full matching set is available for client-side radius filtering below.
const SYNCED_HOSPITAL_FETCH_LIMIT = 20000;

const EARTH_RADIUS_KM = 6371;
const toRadians = (value: number) => (value * Math.PI) / 180;
const haversineDistanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// MstrHospitalAddress.latitude/longitude are Postgres `numeric` columns with no
// TypeORM transformer, so the pg driver returns them as strings (e.g. "17.44781600"),
// not numbers — Number(...) below is required, not defensive decoration. Also try a
// couple of alternate shapes in case a given response doesn't nest coords under
// `addresses` the way the geo-branch response does.
const getHospitalLatLng = (hospital: any): { lat: number; lng: number } | null => {
  const address = hospital?.addresses;
  const candidates: Array<[unknown, unknown]> = [
    [address?.latitude, address?.longitude],
    [hospital?.latitude, hospital?.longitude],
    [hospital?.lat, hospital?.lng],
    [hospital?.location?.lat, hospital?.location?.lng],
    [hospital?.location?.latitude, hospital?.location?.longitude],
  ];
  for (const [rawLat, rawLng] of candidates) {
    if (rawLat === null || rawLat === undefined || rawLng === null || rawLng === undefined) {
      continue;
    }
    const lat = Number(rawLat);
    const lng = Number(rawLng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  return null;
};

const hasValue = (value: unknown) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== null && value !== undefined;
};

const parseSearchPayload = (searchString: string) => {
  const normalized = searchString.startsWith("?")
    ? searchString.slice(1)
    : searchString.startsWith("&")
      ? searchString.slice(1)
      : searchString;
  const params = new URLSearchParams(normalized);
  const payload: Record<string, string> = {};
  params.forEach((value, key) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      payload[key] = value;
    }
  });
  return payload;
};

const HospitalNetworkV1: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { localizationData } = useLocalization();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState(0);
  const [formMethods, setFormMethods] =
    useState<UseFormReturn<HospitalFilterValues>>();
  const [fullSearchTerm, setFullSearchTerm] = useState(""); // New state for API search parameters
  const [filterParams, setFilterParams] = useState<HospitalFilterValues>(
    initialHospitalFilterValues,
  );
  const [filterDraft, setFilterDraft] = useState<HospitalFilterValues>(
    initialHospitalFilterValues,
  );
  const [isApplyDisabled, setIsApplyDisabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"network" | "excluded">("network");
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMapView, setIsMapView] = useState(false);
  const [useGeoSearch, setUseGeoSearch] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [focusHospital, setFocusHospital] = useState<any | null>(null);
  const [mapRadiusKm, setMapRadiusKm] = useState(INITIAL_MAP_SEARCH_RADIUS_KM);
  const [mapCenterLocation, setMapCenterLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [actualUserLocation, setActualUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const initialUserLocationRef = useRef<{ lat: number; lng: number } | null>(
    null,
  );
  const lastGeocodeQueryRef = useRef<string>("");
  const suppressGeocodeRef = useRef(false);
  const previousFiltersRef = useRef<HospitalFilterValues | null>(null);
  const previousSearchTermRef = useRef<string>("");
  const cameFromCardClickRef = useRef(false);
  const [accumulatedHospitals, setAccumulatedHospitals] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const lastRequestedPageRef = useRef<number>(1);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  // Get policies from Redux state
  const policies = useSelector((state: any) => state.policyData.policiesData);

  // Get user location for map view (default to Hyderabad if denied)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setActualUserLocation(nextLocation);
          setMapCenterLocation(nextLocation);
          initialUserLocationRef.current = nextLocation;
        },
        () => {
          const fallback = {
            lat: 17.385044,
            lng: 78.486671,
          };
          setActualUserLocation(fallback);
          setMapCenterLocation(fallback);
          initialUserLocationRef.current = fallback;
        },
      );
    } else {
      const fallback = {
        lat: 17.385044,
        lng: 78.486671,
      };
      setActualUserLocation(fallback);
      setMapCenterLocation(fallback);
      initialUserLocationRef.current = fallback;
    }
  }, []);

  useEffect(() => {
    if (!isMapView) return;
    if (suppressGeocodeRef.current) {
      suppressGeocodeRef.current = false;
      return;
    }
    const pin = filterParams.pinCode;
    if (!pin) return;
    if (!GOOGLE_MAPS_API_KEY) return;

    const queryParts = [
      String(pin),
      filterParams.city,
      filterParams.state,
      "India",
    ]
      .filter(Boolean)
      .join(", ");

    if (!queryParts || queryParts === lastGeocodeQueryRef.current) return;
    lastGeocodeQueryRef.current = queryParts;

    const controller = new AbortController();
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      queryParts,
    )}&key=${GOOGLE_MAPS_API_KEY}`;

    fetch(geocodeUrl, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.status !== "OK" || !data.results?.[0]) return;
        const loc = data.results[0].geometry.location;
        if (!loc) return;
        setMapCenterLocation({ lat: loc.lat, lng: loc.lng });
      })
      .catch(() => {});

    return () => controller.abort();
  }, [isMapView, filterParams.pinCode, filterParams.city, filterParams.state]);
  // Handle click outside to close filter
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is inside filter container
      if (filterContainerRef.current?.contains(target)) {
        return; // Click inside filter, do nothing
      }
      
      // Check if click is inside any MUI dropdown/popover/menu (these are portaled outside the filter)
      const isInsideMuiElement = 
        target.closest('.MuiPopover-root') !== null ||
        target.closest('.MuiMenu-root') !== null ||
        target.closest('.MuiModal-root') !== null ||
        target.closest('.MuiPaper-root') !== null ||
        target.closest('[role="presentation"]') !== null;
      
      if (isInsideMuiElement) {
        return; // Click inside MUI dropdown, do nothing
      }
      
      // Click is outside both filter and dropdowns, close the filter
      if (isFilterOpen) {
        setIsFilterOpen(false);
        if (formMethods) {
          setFilterDraft(formMethods.getValues());
        }
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen, formMethods]);

  const groupMediclaimPolicyId = useMemo(() => {
    if (!policies) return null;

    // Helper to find the policy within a specific array
    const findIn = (arr?: any[]) =>
      arr?.find((p) => p?.policyName?.includes("Group Mediclaim Policy"))
        ?.policyId || null;

    // Try employeePolicies first, then enrolledPolicies
    return (
      findIn(policies.employeePolicies) ||
      findIn(policies.enrolledPolicies) ||
      null
    );
  }, [policies]);

  const allPoliciesList = useMemo(() => {
    if (!policies) return [] as { policyId: number; policyName: string }[];
    return [
      ...(Array.isArray(policies.employeePolicies) ? policies.employeePolicies : []),
      ...(Array.isArray(policies.enrolledPolicies) ? policies.enrolledPolicies : []),
    ]
      .filter((p) => Number.isFinite(Number(p?.policyId)))
      .reduce((acc: { policyId: number; policyName: string }[], p) => {
        const id = Number(p.policyId);
        if (!acc.some((x) => x.policyId === id)) {
          acc.push({ policyId: id, policyName: p.policyName ?? String(id) });
        }
        return acc;
      }, []);
  }, [policies]);

  const hospitalPolicyIds = useMemo(() => {
    if (selectedPolicyId !== 0) {
      return allPoliciesList.some((p) => p.policyId === selectedPolicyId)
        ? [selectedPolicyId]
        : [];
    }
    return allPoliciesList.map((p) => p.policyId);
  }, [allPoliciesList, selectedPolicyId]);
  const primaryHospitalPolicyId =
    groupMediclaimPolicyId ?? hospitalPolicyIds[0] ?? null;

  // API call for hospital networks
  const mapLocationParams =
    isMapView && actualUserLocation && useGeoSearch
      ? `&latitude=${actualUserLocation.lat}&longitude=${actualUserLocation.lng}&radius=${mapRadiusKm}`
      : "";

  const handleFormMethods = useCallback(
    (methods: UseFormReturn<HospitalFilterValues>) => {
      setFormMethods(methods);
    },
    [],
  );

  const evaluateApplyButtonState = useCallback(
    (values: HospitalFilterValues, currentSearchTerm: string) => {
      // Check if we have any values to enable the apply button
      // Don't check for pinCode validity here - just check if there are any values
      const otherFilterValues = Object.keys(values)
        .filter((key) => key !== "pinCode" && key !== "isNetworkHospital")
        .some((key) => hasValue(values[key as keyof HospitalFilterValues]));

      const hasPinCodeValue =
        values.pinCode && values.pinCode.toString().trim().length > 0;
      const hasSearchValue = hasValue(currentSearchTerm);

      const hasHospitalTypeChange =
        values.isNetworkHospital !== filterParams.isNetworkHospital;

      const shouldEnable =
        otherFilterValues ||
        hasPinCodeValue ||
        hasSearchValue ||
        hasHospitalTypeChange;

      // Enable button if there are ANY values (validation will happen when Apply is clicked)
      setIsApplyDisabled(!shouldEnable);
    },
    [filterParams.isNetworkHospital],
  );

  useEffect(() => {
    if (!formMethods) {
      return;
    }

    evaluateApplyButtonState(formMethods.getValues(), searchTerm);

    const subscription = formMethods.watch((value) => {
      const nextValues = value as HospitalFilterValues;

      evaluateApplyButtonState(nextValues, searchTerm);
    });

    return () => subscription.unsubscribe();
  }, [formMethods, evaluateApplyButtonState, searchTerm]);

  useEffect(() => {
    if (!isFilterOpen || !formMethods) return;
    formMethods.reset(filterDraft, {
      keepDirtyValues: false,
      keepTouched: false,
    });
  }, [isFilterOpen, formMethods, filterDraft]);

  useEffect(() => {
    setFilterDraft(filterParams);
  }, [filterParams]);

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { value } = event.target;
    setSearchTerm(value);

    if (formMethods) {
      evaluateApplyButtonState(formMethods.getValues(), value);
    }
  };

  const hasLocationFilters = useMemo(() => {
    return (
      hasValue(filterParams.state) ||
      hasValue(filterParams.city) ||
      hasValue(filterParams.pinCode)
    );
  }, [filterParams]);

  const hasHospitalTypeFilter = useMemo(
    () => filterParams.isNetworkHospital === "false",
    [filterParams.isNetworkHospital],
  );

  const hasAnyFilters = hasLocationFilters || hasHospitalTypeFilter;

  const handleSearchClear = useCallback(() => {
    setSearchTerm("");
    setFullSearchTerm("");
    setPage(1);
    setAccumulatedHospitals([]);
    setIsLoadingMore(false);
    lastRequestedPageRef.current = 1;

    if (formMethods) {
      evaluateApplyButtonState(formMethods.getValues(), "");
    }
  }, [formMethods, evaluateApplyButtonState]);

  // Helper function to build search parameters string
  const buildSearchParams = useCallback(
    (filters: HospitalFilterValues, search: string) => {
      const params: string[] = [];

      // Add search term if provided
      if (search && search.trim()) {
        params.push(`search=${encodeURIComponent(search.trim())}`);
      }

      // Add filter parameters if they have values
      if (filters.state && hasValue(filters.state)) {
        params.push(`state=${encodeURIComponent(filters.state)}`);
      }

      if (filters.city && hasValue(filters.city)) {
        params.push(`city=${encodeURIComponent(filters.city)}`);
      }

      if (filters.pinCode && hasValue(filters.pinCode)) {
        params.push(`pinCode=${encodeURIComponent(filters.pinCode)}`);
      }

      // Add any other filter fields from the form config
      Object.keys(filters).forEach((key) => {
        if (
          !["state", "city", "pinCode", "isNetworkHospital"].includes(key) &&
          hasValue(filters[key as keyof HospitalFilterValues])
        ) {
          params.push(
            `${key}=${encodeURIComponent(
              filters[key as keyof HospitalFilterValues],
            )}`,
          );
        }
      });

      return params.length > 0 ? `&${params.join("&")}` : "";
    },
    [],
  );

  const showSyncedHospitals = import.meta.env.VITE_FF_SHOW_SYNCED_HOSPITALS !== "false";
  const baseSearchPayload = useMemo(
    () => ({
      ...parseSearchPayload(fullSearchTerm),
      policyIds: hospitalPolicyIds,
      isNetworkHospital: activeTab === "network",
      ...(showSyncedHospitals ? { source: "API_SYNC" } : {}),
    }),
    [fullSearchTerm, hospitalPolicyIds, activeTab, showSyncedHospitals],
  );

  // Only the policy-mapped (non-synced) branch can use the real geo/radius endpoint —
  // it's hardcoded to a single policyId's MstrPolicyHospitalMap rows. The synced
  // (API_SYNC) hospital dataset that "showSyncedHospitals" pulls in isn't reachable
  // through that endpoint at all, so when it's active we fetch the full synced set
  // once (it already carries lat/lng) and do radius filtering client-side below.
  const isGeoBranchActive =
    isMapView && useGeoSearch && !showSyncedHospitals;

  // --- Card hospitals (POST) ---
  const {
    mutate: fetchCardHospitals,
    data: cardHospitalData,
    isPending: isLoadingHospitals,
    error: cardError,
  } = useApiMutation({});

  const isFetchingHospitals = isLoadingHospitals;

  useEffect(() => {
    if (!hospitalPolicyIds.length && !showSyncedHospitals) return;
    // Also needed (silently, not for card rendering) while the geo branch is active in
    // map view: its `count` is the location-independent total the 1% threshold is based on.
    if (isMapView && !isGeoBranchActive) return;
    fetchCardHospitals({
      endpoint: endPoints.getHospitalNetworks(),
      method: "POST",
      data: { ...baseSearchPayload, page, limit: ITEMS_PER_PAGE },
    });
  }, [hospitalPolicyIds, activeTab, fullSearchTerm, page, isMapView, isGeoBranchActive]);

  // --- Map hospitals geo search (GET) — policy-mapped hospitals only ---
  // This endpoint uses real SQL LIMIT/OFFSET (unlike the synced branch), so the
  // limit should track the true total (cardHospitalData's count — location
  // independent, since showSyncedHospitals is false whenever this branch is
  // active) rather than an arbitrary fixed number, while still fetching
  // everything that could possibly match.
  const geoFetchLimit = (cardHospitalData as any)?.data?.count || 50;
  const geoSearchUrl =
    isGeoBranchActive && actualUserLocation && primaryHospitalPolicyId
      ? endPoints.getHospitalNetworksGeospatial(primaryHospitalPolicyId) +
        `?isNetworkHospital=${activeTab === "network"}` +
        `${fullSearchTerm}` +
        `${mapLocationParams}` +
        `&page=1&limit=${geoFetchLimit}`
      : "";

  const {
    data: mapGeoHospitalData,
    isLoading: isLoadingMapGeo,
    isFetching: isFetchingMapGeo,
    error: mapGeoError,
  } = useApiQuery({
    queryKey: [
      "hospitalNetworksGeo",
      primaryHospitalPolicyId,
      activeTab,
      fullSearchTerm,
      mapLocationParams,
      geoFetchLimit,
    ],
    url: geoSearchUrl,
    enabled: isGeoBranchActive && !!actualUserLocation && !!primaryHospitalPolicyId,
    config: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });

  // --- Map hospitals non-geo (POST) — synced (API_SYNC) hospitals, no location
  // filtering server-side. Fetch the full matching set in one shot (the backend
  // already loads every match into memory regardless of `limit` before slicing,
  // so a generous limit costs nothing extra) and filter by radius client-side. ---
  const {
    mutate: fetchMapPostHospitals,
    data: mapPostHospitalData,
    isPending: isLoadingMapPost,
    error: mapPostError,
  } = useApiMutation({});

  useEffect(() => {
    if (isGeoBranchActive || (!hospitalPolicyIds.length && !showSyncedHospitals) || !isMapView) return;
    fetchMapPostHospitals({
      endpoint: endPoints.getHospitalNetworks(),
      method: "POST",
      data: { ...baseSearchPayload, page: 1, limit: SYNCED_HOSPITAL_FETCH_LIMIT },
    });
  }, [isMapView, isGeoBranchActive, hospitalPolicyIds, activeTab, fullSearchTerm]);

  const mapHospitalData = isGeoBranchActive ? mapGeoHospitalData : mapPostHospitalData;
  const isLoadingMapHospitals = isLoadingMapGeo || isLoadingMapPost;
  const mapError = mapGeoError || mapPostError;

  const selectedState = (formMethods?.watch("state") ||
    filterDraft.state ||
    "") as string;

  const { mutate: fetchStates, data: statesData } = useApiMutation({});

  useEffect(() => {
    if (!hospitalPolicyIds.length) return;
    fetchStates({
      endpoint: endPoints.hospitalNetworkLocations(),
      method: "POST",
      data: { policyIds: hospitalPolicyIds },
    });
  }, [hospitalPolicyIds]);

  const { mutate: fetchCities, data: citiesData } = useApiMutation({});

  useEffect(() => {
    if (!hospitalPolicyIds.length || !selectedState) return;
    fetchCities({
      endpoint: endPoints.hospitalNetworkLocations(),
      method: "POST",
      data: { policyIds: hospitalPolicyIds, state: selectedState },
    });
  }, [hospitalPolicyIds, selectedState]);

  const stateOptions = useMemo(
    () =>
      (statesData?.data?.states || []).map((item: string) => ({
        value: item,
        label: item,
      })),
    [statesData],
  );

  const cityOptions = useMemo(
    () =>
      (citiesData?.data?.cities || []).map((item: string) => ({
        value: item,
        label: item,
      })),
    [citiesData],
  );

  useEffect(() => {
    // Prefer lastSyncedAt from the API (MAX(createdAt) computed server-side).
    // Fall back to deriving it client-side from the returned records if absent.
    const apiLastSynced = cardHospitalData?.data?.lastSyncedAt;
    if (apiLastSynced) {
      const d = new Date(apiLastSynced);
      if (!isNaN(d.getTime())) { setLastRefreshed(d); return; }
    }
    const records: any[] = cardHospitalData?.data?.data;
    if (!Array.isArray(records) || records.length === 0) return;
    const maxDate = records.reduce((max: Date | null, h: any) => {
      const d = h.createdAt ? new Date(h.createdAt) : null;
      if (!d || isNaN(d.getTime())) return max;
      return max === null || d > max ? d : max;
    }, null);
    if (maxDate) setLastRefreshed(maxDate);
  }, [cardHospitalData]);

  const normalizedHospitals = useMemo(() => {
    const data = cardHospitalData?.data?.data || [];
    return data.map((hospital: any) => {
      const address = Array.isArray(hospital.addresses)
        ? hospital.addresses[0]
        : hospital.addresses;
      return { ...hospital, addresses: address || {} };
    });
  }, [cardHospitalData]);

  const normalizedMapHospitals = useMemo(() => {
    const data = mapHospitalData?.data?.data || [];
    return data.map((hospital: any) => {
      const address = Array.isArray(hospital.addresses)
        ? hospital.addresses[0]
        : hospital.addresses;
      return { ...hospital, addresses: address || {} };
    });
  }, [mapHospitalData]);

  // Some synced (API_SYNC) hospital addresses have never been geocoded — latitude/
  // longitude are genuinely NULL in the database for them, not a parsing bug. Radius
  // filtering is impossible for a dataset with zero geocoded records, so detect that
  // up front rather than pointlessly doubling the radius toward the safety cap.
  const hasAnyGeocodedSyncedHospital = useMemo(() => {
    if (isGeoBranchActive) return true;
    return normalizedMapHospitals.some((hospital: any) => !!getHospitalLatLng(hospital));
  }, [isGeoBranchActive, normalizedMapHospitals]);

  // The synced (non-geo) branch has no server-side radius filtering, so apply it
  // here against the full fetched set. Once the radius has grown all the way to
  // the safety cap, treat that as "fully zoomed out" and show every hospital.
  const syncedHospitalsWithinRadius = useMemo(() => {
    if (isGeoBranchActive) return normalizedMapHospitals;
    if (!actualUserLocation || mapRadiusKm >= MAX_MAP_SEARCH_RADIUS_KM) {
      return normalizedMapHospitals;
    }

    let withValidCoords = 0;
    let loggedFirst = false;

    const result = normalizedMapHospitals.filter((hospital: any) => {
      const coords = getHospitalLatLng(hospital);

      if (!loggedFirst) {
        loggedFirst = true;
        // eslint-disable-next-line no-console
        console.log("[HospitalMap] first-hospital raw debug (unconditional)", {
          userLocation: actualUserLocation,
          fullHospitalRecord: hospital,
          rawAddress: hospital.addresses,
          rawAddressKeys: hospital.addresses ? Object.keys(hospital.addresses) : null,
          rawTopLevel: { latitude: hospital.latitude, longitude: hospital.longitude },
          parsedCoords: coords,
          currentRadiusKm: mapRadiusKm,
        });
      }

      if (!coords) return false;
      withValidCoords += 1;

      const distanceKm = haversineDistanceKm(
        actualUserLocation.lat,
        actualUserLocation.lng,
        coords.lat,
        coords.lng,
      );

      return distanceKm <= mapRadiusKm;
    });

    // eslint-disable-next-line no-console
    console.log("[HospitalMap] radius filter summary", {
      radiusKm: mapRadiusKm,
      totalHospitals: normalizedMapHospitals.length,
      withValidCoords,
      missingOrInvalidCoords: normalizedMapHospitals.length - withValidCoords,
      withinRadius: result.length,
    });

    return result;
  }, [isGeoBranchActive, normalizedMapHospitals, actualUserLocation, mapRadiusKm]);

  const mapHospitals = useMemo(() => {
    if (!isMapView) return normalizedMapHospitals;
    const baseList = isGeoBranchActive ? normalizedMapHospitals : syncedHospitalsWithinRadius;
    const term = searchTerm.trim().toLowerCase();

    const matchesText = (hospital: any) => {
      if (!term) return true;
      return (hospital.name || "").toLowerCase().includes(term);
    };

    // Geo branch already filters by radius server-side; synced branch was just
    // filtered client-side above. Only text search is applied locally here.
    return baseList.filter((hospital: any) => matchesText(hospital));
  }, [isMapView, isGeoBranchActive, normalizedMapHospitals, syncedHospitalsWithinRadius, searchTerm]);

  // Rendering cap only — totalHospitalCount below stays based on the full
  // (uncapped) mapHospitals, so the header count and search results stay accurate
  // even when the map itself only draws the first MAX_RENDERED_MAP_MARKERS pins.
  const mapMarkersToRender = useMemo(
    () => mapHospitals.slice(0, MAX_RENDERED_MAP_MARKERS),
    [mapHospitals],
  );

  // --- Grow the search radius (5 -> 10 -> 20 -> 40 -> 80 ...) until it covers at
  // least 1% of the total matching hospitals, or the safety cap is hit. Purely
  // radius-driven — does not touch how many hospitals are fetched. ---
  useEffect(() => {
    if (!isMapView || mapRadiusKm >= MAX_MAP_SEARCH_RADIUS_KM) return;

    if (isGeoBranchActive) {
      if (isLoadingMapGeo || isFetchingMapGeo) return;
      // The 1% threshold must be computed against a location-independent total —
      // mapGeoHospitalData's count is already radius-scoped, so comparing it to 1%
      // of itself can never trigger growth. cardHospitalData's count is the right
      // reference here since showSyncedHospitals is always false whenever this
      // branch is active (see the fetchCardHospitals effect above).
      const locationIndependentTotal = (cardHospitalData as any)?.data?.count || 0;
      if (!locationIndependentTotal) return;
      const geoCount = mapGeoHospitalData?.data?.count || 0;
      const threshold = Math.max(1, Math.ceil(locationIndependentTotal * MIN_HOSPITAL_COVERAGE_RATIO));
      if (geoCount < threshold) {
        setMapRadiusKm((prev) => Math.min(prev * 2, MAX_MAP_SEARCH_RADIUS_KM));
      }
    } else {
      if (isLoadingMapPost || !actualUserLocation) return;
      const total = (mapPostHospitalData as any)?.data?.count || 0;
      if (!total) return;

      // No synced hospital in this dataset has ever been geocoded (a data gap, not
      // a filtering bug — see hasAnyGeocodedSyncedHospital) — radius filtering is
      // impossible, so jump straight to "show everything" instead of pointlessly
      // doubling toward the safety cap.
      if (!hasAnyGeocodedSyncedHospital) {
        setMapRadiusKm(MAX_MAP_SEARCH_RADIUS_KM);
        return;
      }

      const threshold = Math.max(1, Math.ceil(total * MIN_HOSPITAL_COVERAGE_RATIO));
      if (syncedHospitalsWithinRadius.length < threshold) {
        setMapRadiusKm((prev) => Math.min(prev * 2, MAX_MAP_SEARCH_RADIUS_KM));
      }
    }
  }, [
    isMapView,
    isGeoBranchActive,
    mapRadiusKm,
    isLoadingMapGeo,
    isFetchingMapGeo,
    mapGeoHospitalData,
    cardHospitalData,
    isLoadingMapPost,
    mapPostHospitalData,
    actualUserLocation,
    hasAnyGeocodedSyncedHospital,
    syncedHospitalsWithinRadius,
  ]);

  const handleShowOnMap = useCallback(
    (hospital: any) => {
      if (!cameFromCardClickRef.current) {
        previousFiltersRef.current = filterParams;
        previousSearchTermRef.current = searchTerm;
      }
      cameFromCardClickRef.current = true;
      const address = Array.isArray(hospital?.addresses)
        ? hospital.addresses[0]
        : hospital?.addresses;

      const nextFilters = {
        ...initialHospitalFilterValues,
        isNetworkHospital: filterParams.isNetworkHospital,
        state: address?.stateName || "",
        city: address?.cityName || "",
        pinCode: address?.pinCode || "",
      };

      setFocusHospital(hospital);
      setFilterParams(nextFilters);
      setFilterDraft(nextFilters);
      setIsApplyDisabled(false);
      const newSearchTerm = buildSearchParams(nextFilters, searchTerm);
      setFullSearchTerm(newSearchTerm);
      setUseGeoSearch(false);
      suppressGeocodeRef.current = true;
      setIsMapView(true);
    },
    [buildSearchParams, filterParams, searchTerm],
  );

  useEffect(() => {
    if (!isMapView) return;
    if (hasLocationFilters) {
      setUseGeoSearch(false);
    }
  }, [isMapView, hasLocationFilters]);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setPage(1);
      const newSearchTerm = buildSearchParams(filterParams, searchTerm);
      setFullSearchTerm(newSearchTerm);
    }, 400);

    return () => window.clearTimeout(handler);
  }, [searchTerm, buildSearchParams]);

  const mergeHospitals = useCallback((prev: any[], next: any[]) => {
    const map = new Map<string | number, any>();
    const getKey = (hospital: any) =>
      hospital?.id ??
      `${hospital?.name || "unknown"}-${hospital?.addresses?.addressLine1 || ""}-${hospital?.addresses?.pinCode || ""}`;

    prev.forEach((hospital) => {
      map.set(getKey(hospital), hospital);
    });
    next.forEach((hospital) => {
      map.set(getKey(hospital), hospital);
    });

    return Array.from(map.values());
  }, []);

  useEffect(() => {
    if (isMapView) {
      setIsLoadingMore(false);
      return;
    }
    if (!cardHospitalData) return;

    setAccumulatedHospitals((prev) => {
      if (page === 1) return normalizedHospitals;
      return mergeHospitals(prev, normalizedHospitals);
    });
    setIsLoadingMore(false);
  }, [cardHospitalData, normalizedHospitals, page, isMapView, mergeHospitals]);

  useEffect(() => {
    if (isMapView) return;
    setAccumulatedHospitals([]);
    setPage(1);
    setIsLoadingMore(false);
    lastRequestedPageRef.current = 1;
  }, [activeTab, fullSearchTerm, hospitalPolicyIds, isMapView]);

  useEffect(() => {
    if (isMapView) return;
    setPage(1);
    setAccumulatedHospitals([]);
    setIsLoadingMore(false);
    lastRequestedPageRef.current = 1;
    const newSearchTerm = buildSearchParams(filterParams, searchTerm);
    setFullSearchTerm(newSearchTerm);
  }, [isMapView]);

  useEffect(() => {
    if (!isFetchingHospitals && !isLoadingHospitals) {
      lastRequestedPageRef.current = page;
    }
  }, [page, isFetchingHospitals, isLoadingHospitals]);

  const displayHospitals = useMemo(() => {
    if (accumulatedHospitals.length > 0) {
      return accumulatedHospitals;
    }
    return normalizedHospitals;
  }, [accumulatedHospitals, normalizedHospitals]);

  const cardTotalCount = cardHospitalData?.data?.count || 0;
  const mapTotalCount = mapHospitalData?.data?.count || 0;
  const totalHospitalCount = isMapView ? mapHospitals.length : cardTotalCount;

  const handleApplyFilters = async () => {
   
    setPage(1);

    const filters = formMethods
      ? formMethods.getValues()
      : initialHospitalFilterValues;
    setActiveTab(filters.isNetworkHospital === "false" ? "excluded" : "network");
    setFilterParams(filters);
    setFilterDraft(filters);
    const newSearchTerm = buildSearchParams(filters, searchTerm);
    setFullSearchTerm(newSearchTerm);
    setIsFilterOpen(false);
  };
  const handleBackNavigation = () => {
    navigate("/"); // Navigate back to the dashboard page
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFullSearchTerm("");
    setFilterParams(initialHospitalFilterValues);
    setFilterDraft(initialHospitalFilterValues);
    setIsApplyDisabled(true);
    setUseGeoSearch(true);
    setFocusHospital(null);
    setPage(1);
    setActiveTab("network");
    lastGeocodeQueryRef.current = "";
    if (!isMapView) {
      setMapRadiusKm(INITIAL_MAP_SEARCH_RADIUS_KM);
    }
    if (initialUserLocationRef.current) {
      setActualUserLocation(initialUserLocationRef.current);
      setMapCenterLocation(initialUserLocationRef.current);
    }
    if (formMethods) {
      formMethods.reset(initialHospitalFilterValues, {
        keepDirtyValues: false,
        keepTouched: false,
      });
    }
  };

  const handleCloseFilter = useCallback(() => {
    if (formMethods) {
      setFilterDraft(formMethods.getValues());
    }
    setIsFilterOpen(false);
  }, [formMethods]);

  const handleExportClick = useCallback(async () => {
    if (!primaryHospitalPolicyId) {
      dispatch(
        setToastMessage(HOSPITALNETWORK.TOAST_MESSAGES.POLICY_ID_NOT_AVAILABLE),
      );
      return;
    }

    try {
      const exportTotal = cardTotalCount || mapTotalCount || 0;
      const exportUrl =
        endPoints.hospitalNetworkExport(primaryHospitalPolicyId) +
        `?page=${page}&limit=${exportTotal}` +
        `&isNetworkHospital=${activeTab === "network"}` +
        `${fullSearchTerm}`;

      const tmpl = await apiRequest(exportUrl, {
        method: "GET",
        responseType: "blob",
      });

      const blobData = tmpl?.data ?? tmpl;
      const blob =
        blobData instanceof Blob
          ? blobData
          : new Blob([blobData], {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

      const fileUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = `hospital-network-${primaryHospitalPolicyId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      dispatch(setToastMessage(HOSPITALNETWORK.TOAST_MESSAGES.EXPORT_SUCCESS));
    } catch (error) {
      dispatch(setToastMessage(HOSPITALNETWORK.TOAST_MESSAGES.EXPORT_ERROR));
    }
  }, [
    dispatch,
    primaryHospitalPolicyId,
    activeTab,
    fullSearchTerm,
    cardTotalCount,
    mapTotalCount,
    page,
  ]);

  console.log({
  mapRadiusKm,
  totalFromApi: mapPostHospitalData?.data?.count,
  fetched: normalizedMapHospitals.length,
  afterRadiusFilter: syncedHospitalsWithinRadius.length,
});

  if (!hospitalPolicyIds.length) {
    return (
      <HospitalNetworkContainer>
        <HospitalHeading>{HOSPITALNETWORK.HEADING}</HospitalHeading>
        <HospitalContent>
          <p>No policies found for hospital network search.</p>
        </HospitalContent>
      </HospitalNetworkContainer>
    );
  }

  return (
    <>
      <HospitalNetworkContainer>
        {/*
        <BackToPageContainer onClick={handleBackNavigation}>
          <BackToPageImage src={PreviousPageIcon} alt="Back" />
          <BackToPageText>{HOSPITALNETWORK.BACK_TO_DASHBOARD}</BackToPageText>
        </BackToPageContainer>
        <HospitalHeading>
          {HOSPITALNETWORK.HEADING}
          <HospitalCount>({hospitalData?.data?.count || 0})</HospitalCount>
        </HospitalHeading>
        <HospitalContainer>
          <HospitalTopContainer>
            <HospitalButtonContainer data-testid="ibp-hospital-tab-buttons">
              <HospitalButton
                variant={activeTab === "network" ? "contained" : "outlined"}
                onClick={() => setActiveTab("network")}
              >
                {HOSPITALNETWORK.NETWORK_HOSPITALS_BUTTON}
              </HospitalButton>

              <HospitalButton
                variant={activeTab === "excluded" ? "contained" : "outlined"}
                onClick={() => setActiveTab("excluded")}
              >
                {HOSPITALNETWORK.EXCLUDED_HOSPITALS_BUTTON}
              </HospitalButton>
            </HospitalButtonContainer>

            <HospitalExportButton onClick={handleExportClick}>
              <DownloadIcon src={downloadIcon} />
              {HOSPITALNETWORK.EXPORT_BUTTON}
            </HospitalExportButton>
          </HospitalTopContainer>
        </HospitalContainer>
        */}
        <HospitalHeaderBar>
          <HospitalHeaderLeft onClick={()=> navigate("/dashboard")}>
            <BackToPageImage src={PreviousPageIcon} alt="Back" />
            <HospitalHeaderTextContainer>
            <HospitalHeaderTitle>
              {HOSPITALNETWORK.HEADING} (
              {formatNumberByLocalization(totalHospitalCount, localizationData?.data)})
            </HospitalHeaderTitle>
            <HospitalHeaderSubTitle>List of Network hospitals as provided by the TPA. Verify with TPA before submission/admission</HospitalHeaderSubTitle>
            </HospitalHeaderTextContainer>
          </HospitalHeaderLeft>
          <HospitalHeaderRight>
            <HospitalHeaderViewText>Card View</HospitalHeaderViewText>
            <ViewToggleSwitch
              size="small"
              checked={isMapView}
              onChange={(event) => {
                const checked = event.target.checked;
                setIsMapView(checked);
                if (checked) {
                  setUseGeoSearch(!hasLocationFilters);
                  setFocusHospital(null);
                  return;
                }

                if (cameFromCardClickRef.current) {
                  const previousFilters =
                    previousFiltersRef.current ?? initialHospitalFilterValues;
                  const previousSearchTerm = previousSearchTermRef.current ?? "";
                  setFilterParams(previousFilters);
                  setFilterDraft(previousFilters);
                  setSearchTerm(previousSearchTerm);
                  const newSearchTerm = buildSearchParams(
                    previousFilters,
                    previousSearchTerm,
                  );
                  setFullSearchTerm(newSearchTerm);
                  setIsApplyDisabled(
                    !(
                      hasValue(previousSearchTerm) ||
                      hasValue(previousFilters.state) ||
                      hasValue(previousFilters.city) ||
                      hasValue(previousFilters.pinCode) ||
                      previousFilters.isNetworkHospital === "false"
                    ),
                  );
                  cameFromCardClickRef.current = false;
                }
              }}
            />
            <HospitalHeaderViewText>Map View</HospitalHeaderViewText>
            <HospitalHeaderDivider />
            {allPoliciesList.length > 1 && (
              <Box
                component="select"
                value={selectedPolicyId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setSelectedPolicyId(Number(e.target.value));
                  setPage(1);
                  setAccumulatedHospitals([]);
                }}
                sx={{
                  height: 34,
                  borderRadius: "8px",
                  border: selectedPolicyId !== 0 ? "1.5px solid #2556A6" : "1px solid #dbe3ee",
                  px: 1.5,
                  fontSize: 12,
                  fontWeight: selectedPolicyId !== 0 ? 600 : 500,
                  color: selectedPolicyId !== 0 ? "#1c57b8" : "#344054",
                  background: "#fff",
                  cursor: "pointer",
                  minWidth: 0,
                  flexShrink: 1,
                  maxWidth: 220,
                  "@media (max-width: 768px)": {
                    maxWidth: "45vw",
                  },
                }}
              >
                <option value={0}>All Policies</option>
                {allPoliciesList.map((p) => (
                  <option key={p.policyId} value={p.policyId}>{p.policyName}</option>
                ))}
              </Box>
            )}
            <HospitalHeaderFilterButton
              type="button"
              $isActive={hasAnyFilters || hasValue(searchTerm)}
              onClick={() => setIsFilterOpen(true)}
            >
              <FilterOutlinedIcon src={filterIcon} alt="Filter" />
              <HospitalHeaderViewText
                $isActive={hasAnyFilters || hasValue(searchTerm)}
              >
                Filter
              </HospitalHeaderViewText>
              <KeyboardArrowDown src={KeyboardArrowDownImage} alt="Expand" />
            </HospitalHeaderFilterButton>
          </HospitalHeaderRight>
        </HospitalHeaderBar>
        <FiltersContainer data-testid="ibp-hospital-filters-container">
          {/* Search Box */}
          <FiltersContainerSearch>
            {/*
            <FiltersContainerHeading>
              {HOSPITALNETWORK.SEARCH_HOSPITAL}
            </FiltersContainerHeading>
            */}
            {lastRefreshed && (
              <Box sx={{ fontSize: "16px", color: "#EBF6FF", fontWeight: 600, opacity: 0.8, mt: 1.5 }}>
                Last synced at:{" "}
                {lastRefreshed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })},{" "}
                {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase()}
              </Box>
            )}
            <StyledSearchField
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={HOSPITALNETWORK.SEARCH_PLACEHOLDER}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {searchTerm ? (
                      <>
                        <SearchClearButton
                          type="button"
                          aria-label="Clear search"
                          onClick={handleSearchClear}
                        >
                          <SearchClearIcon src={closeIcon} alt="Clear" />
                        </SearchClearButton>
                        <SearchAdornmentSeparator />
                      </>
                    ) : null}
                    <SearchAdornmentIcon src={searchIcon} alt="Search" />
                  </InputAdornment>
                ),
              }}
            />
          </FiltersContainerSearch>

          <FiltersBackgroundImage
            src={hospitalNetworkBg}
            alt={HOSPITALNETWORK.SEARCH_HOSPITAL}
          />
        </FiltersContainer>

          <FilterContainer
            ref={filterContainerRef}
            style={{
              display: isFilterOpen ? "block" : "none",
            }}
          >
            <FiltersContainerForm>
              <FilterCloseIcon onClick={handleCloseFilter} src={closeIcon} alt="Close" />
              <DynamicForm
                variant="ibp"
                formConfig={HOSPITAL_FILTER_FORM_CONFIG(
                  stateOptions,
                  cityOptions,
                  {
                    onPinCodeEnter: handleApplyFilters,
                  },
                )}
                defaultValues={filterDraft}
                formMethods={(methods) =>
                  handleFormMethods(
                    methods as UseFormReturn<HospitalFilterValues>,
                  )
                }
              />
            </FiltersContainerForm>
            <ButtonContainer>
              <Button
                onClick={handleClearFilters}
              >
                <ClearAllButtonText>
                  {HOSPITALNETWORK.CLEAR_ALL_BUTTON}
                </ClearAllButtonText>
              </Button>
              <Button
                disabled={isApplyDisabled}
                onClick={handleApplyFilters}
              >
                <ButtonText disabled={isApplyDisabled}>
                  Apply
                </ButtonText>
              </Button>
            </ButtonContainer>
          </FilterContainer>
        <CardsContainer>
          {(isMapView ? mapError : cardError) ? (
            <ErrorContainer>
              Error loading hospitals:{" "}
              {(isMapView ? mapError : cardError)?.message || "Unknown error"}
            </ErrorContainer>
          ) : isMapView ? (
            <HospitalMapView
              hospitals={mapMarkersToRender}
              isLoading={isLoadingMapHospitals}
              userLocation={mapCenterLocation}
              actualUserLocation={actualUserLocation}
              focusHospital={focusHospital}
              onRadiusChange={(viewportRadiusKm) => {
                // Zooming out only ever grows the search radius, by doubling
                // (5 -> 10 -> 20 -> 40 -> 80 ...) until it covers the visible
                // viewport. Zooming in does not shrink it back down — the
                // coverage-threshold effect above is the only thing that
                // decides whether the current radius is "enough".
                setMapRadiusKm((prev) => {
                  if (viewportRadiusKm <= prev) return prev;
                  let next = prev;
                  while (next < viewportRadiusKm && next < MAX_MAP_SEARCH_RADIUS_KM) {
                    next *= 2;
                  }
                  return Math.min(next, MAX_MAP_SEARCH_RADIUS_KM);
                });
              }}
            />
          ) : (
            <HospitalCards
              hospitals={displayHospitals}
              totalCount={cardTotalCount}
              hasMore={displayHospitals.length < cardTotalCount}
              onLoadMore={() => {
                if (
                  isLoadingHospitals ||
                  isFetchingHospitals ||
                  isLoadingMore
                )
                  return;
                const nextPage = page + 1;
                if (lastRequestedPageRef.current >= nextPage) return;
                setIsLoadingMore(true);
                setPage(nextPage);
              }}
              onShowOnMap={handleShowOnMap}
              activeTab={activeTab}
              isLoading={isLoadingHospitals}
              isFetching={isFetchingHospitals}
            />
          )}
        </CardsContainer>
 
      </HospitalNetworkContainer>
    </>
  );
};

export default HospitalNetworkV1;
