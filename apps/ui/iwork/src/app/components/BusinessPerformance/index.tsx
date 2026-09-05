import {
  CardBackground,
  FeatureKey,
  SEARCH,
  SmartSearch,
  FormFieldConfig,
  buildQueryString,
  buildBreadcrumbState,
  createBreadcrumbEntry,
  endPoints,
  getBreadcrumbsFromState,
  getSessionStorageData,
  selectHasPermission,
  useApiQuery,
  Table,
  useFormWatcher,
  BUSINESS_PERFORMANCE,
  updateUserDefaultConfig,
  // SAVE_VIEW, // moved into filter bar — top button commented out
  DETAILS_LABELS,
  DETAILS_KEYS,
  CLIENT_PORTFOLIO,
  BREADCRUMB_KEYS,
  useBreadcrumbTrail,
  setToastMessage,
  useDashboardWidgetVisibility,
  useActivityRoleVisibility,
} from "@ui/ui-lib";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CircularProgress, Typography, Box } from "@mui/material";
import {
  PieSkeleton,
  TableSkeleton,
} from "../DashboardSkeletons";
import {
  DashboardPageWrapper,
  FloatingFilterButton,
  // HeaderActionsRow, // used only by commented-out header block below
  LeftSideSectionContainer,
  MyFollowUpLabel,
  StyledButtonContainer,
  StyledSectionSubHeading,
  SubSectionHeader,
  StickyFilterBar,
  StickySmartSearchWrapper,
} from "./styles";
import SalesFunnel from "../../pages/Dashboard/Charts/SalesFunnel/SalesFunnel";
import RenewalFunnel from "../../pages/Dashboard/Charts/RenewalFunnel/RenewalFunnel";
import {
  businessPerformanceFilterConfig,
  businessMonthField,
  periodModeToggleField,
  PERIOD_MODE_BUSINESS,
  PERIOD_MODE_INCOME,
  dashboardCollectionRowsConfig,
  getBusinessCollectionColumns,
  transformBusinessPerformanceData,
} from "./businessPerformanceConfig";
import {
  ALL_VALUE,
  TABLE_CONTROLLER_ENTITY_KEY,
  MANAGE_QUOTES,
  OPPORTUNITY_TYPE_SO,
  ISG_PLANNING,
} from "../../constants";
import { useDispatch, useSelector } from "react-redux";
import Unauthorized from "../../pages/UnauthorizedPage";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import BrokerageToCollect from "../BrokerageToCollect";
import MyFollowUp from "../MyFollowUp";
import PolicyTypeDistribution from "../../pages/Dashboard/PolicyTypeDistribution";
import ServiceScoreWidget from "../../pages/Dashboard/ServiceScoreWidget";
import { Button } from "@ui/ui-lib/commonComponents";
import TargetVsActualBreakdown from "../../pages/Dashboard/TargetVsActualBreakdown";
// import BusinessPerformanceBarChart from "../BusinessPerformanceBarChart";
import SbuTatSummaryTable from "../SbuTatSummaryTable";
import SbuPolicyExpiryTable from "../SbuPolicyExpiryTable";
import { TatSectionKey } from "../SbuTatSummaryTable/types";
// import { SectionHeader } from "../../pages/Dashboard/styles"; // used only by commented-out header block below
import FilterIcon from "../../../../../ui-lib/src/lib/assets/svgs/filter-icon";
import { theme } from "@ui/ui-lib/styles/Theme";
import {
  OPEN_TAT_LABEL,
  POLICY_EXPIRY_BUCKET_LABELS,
  POLICY_EXPIRY_BUCKET_DAY_RANGES,
  SBU_EXPIRY_BUCKET_TO_RANGE_KEY,
} from "./tatDrilldownConfig";

export const stripAllValues = (filters: Record<string, any>) => {
  const cleanedFilters: Record<string, any> = {};
  Object.entries(filters).forEach(([key, value]) => {
    const isEmptyMultiselect = Array.isArray(value) && value.length === 0;
    if (
      value !== ALL_VALUE &&
      value !== "" &&
      value !== null &&
      !isEmptyMultiselect
    ) {
      cleanedFilters[key] = value;
    }
  });
  return cleanedFilters;
};

// Floor for the floating filter panel's height cap. On a short viewport we'd
// rather the panel scroll inside a usable box than collapse to a sliver.
const MIN_FILTER_PANEL_HEIGHT = 320;

const BusinessPerformance: React.FC = () => {
  const dispatch = useDispatch();
  const [skipQuery, setSkipQuery] = useState(true);
  const [collectionTableCurrentPage, setCollectionTableCurrentPage] =
    useState(1);
  const [collectionTablePageSize, setCollectionTablePageSize] = useState(10);
  const [_collectionTableSort, setCollectionTableSort] = useState<
    { colId: string; sort: "asc" | "desc" }[]
  >([]);

  const viewSalesFunnel = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_OPPORTUNITY)(state)
  );

  // Hide the BD-oriented SO/RO funnels for ISG-only users so they are never
  // routed to a listing not in their menu (spec §11.1). BD-only, BD+ISG and
  // unrestricted users still see them. The SO/RO Follow Up tables stay visible
  // for everyone; their rows are role-scoped by the backend.
  const dashboardWidgetVisibility = useDashboardWidgetVisibility();
  // ISG-only viewers can't open the SO listing (/opportunities) — it's not in
  // their menu, so the SO by SBU drilldown lands on an unauthorized page. Route
  // them to Manage Quotes (their combined SO+RO listing) instead, mirroring the
  // Follow-Up drilldown. BD / dual-role users keep the SO listing.
  const { canViewBD, canViewISG } = useActivityRoleVisibility();
  const routeToManageQuotes = canViewISG && !canViewBD;
  const filterPreferencesLoading = useSelector(
    (state: any) => state.user.buttonLoading
  );

  const systemSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.systemDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.dashBoard
      ]
  );
  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.dashBoard
      ]
  );

  const withPeriodAndIncomeDefaults = (
    baseValues: Record<string, any>
  ): Record<string, any> => {
    const existingIncomeType = baseValues?.incomeType;
    const normalizedIncomeType =
      existingIncomeType && typeof existingIncomeType === "object"
        ? existingIncomeType
        : { value: ALL_VALUE, label: "All" };

    const existingPeriodMode = baseValues?.periodMode;
    const normalizedPeriodMode =
      existingPeriodMode && typeof existingPeriodMode === "object"
        ? existingPeriodMode
        : { value: PERIOD_MODE_INCOME, label: "Income Month" };

    return {
      ...baseValues,
      incomeType: normalizedIncomeType,
      periodMode: normalizedPeriodMode,
    };
  };

  // Seed values on load: a saved view wins, falling back to the system default.
  const defaultValues = useMemo(
    () =>
      withPeriodAndIncomeDefaults(
        userSmartSearchDefaultValues || systemSmartSearchDefaultValues || {}
      ),
    [userSmartSearchDefaultValues, systemSmartSearchDefaultValues]
  );

  // Reset target: always the SYSTEM default, never a user saved view — matches
  // Manage Company (CompanyListing) and the SO listing, where Reset means "wipe
  // back to the system default". Passing `defaultValues` here instead made
  // Reset restore the saved view, so a saved Owner could never be cleared.
  //
  // Owner falls back to the logged-in user when the system default names none,
  // so Reset lands on you rather than on a blank field. Note the dashboard's
  // Owner key is `userId` (businessPerformanceConfig), not the `ownerId` used
  // by the shared smartSearchConfig on Company/Contact.
  const resetDefaultValues = useMemo(() => {
    const systemValues = withPeriodAndIncomeDefaults(
      systemSmartSearchDefaultValues || {}
    );
    if (systemValues.userId) return systemValues;

    const sessionUser = getSessionStorageData("user");
    if (!sessionUser?.userId) return systemValues;

    const lastName = sessionUser.lastName?.trim();
    return {
      ...systemValues,
      userId: {
        value: String(sessionUser.userId),
        label: [sessionUser.firstName, lastName].filter(Boolean).join(" "),
      },
    };
  }, [systemSmartSearchDefaultValues]);

  const [appliedFilters, setAppliedFilters] = useState({}); // State for filters applied after clicking "Run"

  const cleanedFiltersAll = stripAllValues(appliedFilters);

  // businessMonth is applied ONLY to the four widgets that support it (renewal
  // scheduled by SBU, endorsement TAT by SBU, brokerage to collect, policy type
  // distribution). Strip it from the shared query strings so the other widgets'
  // endpoints — which don't declare the param — don't receive it and 400
  // (policy-service rejects unknown query params).
  const {
    businessMonth: rawBusinessMonthValue,
    periodMode: appliedPeriodMode,
    ...cleanedFilters
  } = cleanedFiltersAll;


  const isAppliedBusinessMonthMode =
    (typeof appliedPeriodMode === "object"
      ? (appliedPeriodMode as any)?.value
      : appliedPeriodMode) === PERIOD_MODE_BUSINESS;
  const businessMonthValue = isAppliedBusinessMonthMode
    ? rawBusinessMonthValue
    : undefined;

  // incomeType only affects the business performance APIs (the legacy widget
  // plus the quarterly/by-SBU pair behind Target vs Actual). Strip it from
  // everything else — those endpoints don't declare the param and would 400.
  const { incomeType: _incomeType, ...cleanedFiltersWithoutIncomeType } =
    cleanedFilters;
  const queryString = buildQueryString(cleanedFilters);
  const queryStringWithoutIncomeType = buildQueryString(
    cleanedFiltersWithoutIncomeType
  );

  // Send the owner param to the sales/renewal funnel (and its drill-in) only when
  // an owner other than the logged-in user is explicitly picked. On the default
  // (self) view we omit it so the backend applies its default — a leader sees the
  // whole org, everyone else their own team — and the funnel count and drilldown,
  // getting identical params, always reconcile.
  const loggedInUserId = useMemo(() => {
    try {
      const u = sessionStorage.getItem("user");
      return u ? JSON.parse(u)?.userId ?? null : null;
    } catch {
      return null;
    }
  }, []);
  const isExplicitOwnerPick = (uid: unknown) =>
    uid !== undefined &&
    uid !== null &&
    uid !== "" &&
    String(uid) !== String(loggedInUserId);
  const funnelQueryString = (() => {
    const filters = cleanedFiltersWithoutIncomeType as Record<string, unknown>;
    if (isExplicitOwnerPick(filters?.userId)) {
      return queryStringWithoutIncomeType;
    }
    const { userId: _omitOwner, ...rest } = filters;
    return buildQueryString(rest);
  })();

  // Query string for the four business-month-aware widgets. incomeType never
  // applies to these endpoints, so it builds on the income-type-stripped base
  // and re-adds businessMonth when present.
  const businessMonthQueryString = businessMonthValue
    ? buildQueryString({
        ...cleanedFiltersWithoutIncomeType,
        businessMonth: businessMonthValue,
      })
    : queryStringWithoutIncomeType;

  // appliedFilters without incomeType — used as the `filters` prop for all
  // components that are not affected by income type.
  const {
    incomeType: _appliedIncomeType,
    periodMode: _appliedPeriodModeForDrilldown,
    businessMonth: rawAppliedBusinessMonth,
    ...appliedFiltersWithoutIncomeType
  } = appliedFilters as Record<string, any>;
  const appliedBusinessMonth = isAppliedBusinessMonthMode
    ? rawAppliedBusinessMonth
    : undefined;

  // Drilldown filters for the four business-month-aware widgets — re-adds
  // businessMonth so the destination listing (policies / biz-done report /
  // manage-endorsements) pre-applies it.
  const appliedFiltersWithBusinessMonth = appliedBusinessMonth
    ? { ...appliedFiltersWithoutIncomeType, businessMonth: appliedBusinessMonth }
    : appliedFiltersWithoutIncomeType;
  const hasInsurerFilterApplied = useMemo(() => {
    const insurerFilter = appliedFiltersWithoutIncomeType?.insurerId;
    if (insurerFilter === undefined || insurerFilter === null || insurerFilter === "") {
      return false;
    }
    if (typeof insurerFilter === "object") {
      return insurerFilter.value !== undefined && insurerFilter.value !== null && insurerFilter.value !== "";
    }
    return true;
  }, [appliedFiltersWithoutIncomeType]);

  // Business month is only implemented for the renewal-by-SBU, endorsement-TAT-by-SBU,
  // brokerage-to-collect and policy-type-distribution widgets. When it's applied, the
  // remaining widgets (business performance, sales/renewal funnels, target vs actual,
  // claims-TAT-by-SBU, my follow up) can't honour it, so they render a "not applicable" (--) state.
  const hasBusinessMonthApplied = useMemo(() => {
    const value =
      businessMonthValue && typeof businessMonthValue === "object"
        ? (businessMonthValue as any).value
        : businessMonthValue;
    return (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== ALL_VALUE &&
      value !== "ALL"
    );
  }, [businessMonthValue]);

  const url = `${endPoints.businessPerformanceData}${queryString}`;
  const { data, isLoading, error } = useApiQuery({
    url: url,
    queryKey: [BUSINESS_PERFORMANCE.QUERY_KEYS.BUSINESS_PERFORMANCE_DATA, url],
    enabled: !skipQuery,
  });

  // TAT Summary (single endpoint — includes SBU rows, endorsement TAT by SBU, and aggregate totals)
  const tatSummaryUrl = `${endPoints.tatSummaryData}${businessMonthQueryString}`;
  const { data: tatSummaryTotalsData, isLoading: tatSummaryTotalsLoading } =
    useApiQuery({
      url: tatSummaryUrl,
      queryKey: ["tatSummaryData", tatSummaryUrl],
      enabled: !skipQuery,
    });

  // Renewal Schedule by SBU — sourced from RO opportunities (type=RO, refPolicyId IS NOT NULL, expiry_date)
  // businessMonth does not apply here; incomeType never applies to opportunity endpoints.
  const renewalScheduleBySbuUrl = `${endPoints.renewalScheduleBySbu}${queryStringWithoutIncomeType}`;
  const { data: renewalScheduleBySbuData, isLoading: renewalScheduleBySbuLoading } =
    useApiQuery({
      url: renewalScheduleBySbuUrl,
      queryKey: ["renewalScheduleBySbu", renewalScheduleBySbuUrl],
      enabled: !skipQuery,
    });

  // Sales Schedule by SBU — sourced from SO opportunities (type=SO, expiry_date).
  // Unlike renewals there is no refPolicyId filter; businessMonth/incomeType never apply here.
  const salesScheduleBySbuUrl = `${endPoints.salesScheduleBySbu}${queryStringWithoutIncomeType}`;
  const { data: salesScheduleBySbuData, isLoading: salesScheduleBySbuLoading } =
    useApiQuery({
      url: salesScheduleBySbuUrl,
      queryKey: ["salesScheduleBySbu", salesScheduleBySbuUrl],
      enabled: !skipQuery,
    });

  // Placement by SBU — the same endpoint as Sales by SBU, scoped to the combined
  // SO+RO pipeline past the ISG Planning gate (spec §12.3-B).
  const placementScheduleBySbuUrl = `${endPoints.salesScheduleBySbu}${queryStringWithoutIncomeType}&scope=PLACEMENT`;
  const {
    data: placementScheduleBySbuData,
    isLoading: placementScheduleBySbuLoading,
  } = useApiQuery({
    url: placementScheduleBySbuUrl,
    queryKey: ["placementScheduleBySbu", placementScheduleBySbuUrl],
    enabled: !skipQuery && dashboardWidgetVisibility.placementScheduleBySbu,
  });

  // Policy Summary API call — not affected by incomeType
  const policySummaryUrl = `${endPoints.policySummaryData}${businessMonthQueryString}`;
  const {
    data: policySummaryData,
    isLoading: policySummaryLoading,
    error: policySummaryError,
  } = useApiQuery({
    url: policySummaryUrl,
    queryKey: [
      BUSINESS_PERFORMANCE.QUERY_KEYS.POLICY_SUMMARY_DATA,
      policySummaryUrl,
    ],
    enabled: !skipQuery,
  });
  const chartsData = transformBusinessPerformanceData(data?.data);
  const dashboardCollectionRows = useMemo(() => {
    const premiumApiData = data?.data?.[4];
    const target: number | null = premiumApiData?.targetPremiumCollected ?? null;
    const achieved: number | null = premiumApiData?.premiumCollected ?? null;
    const percentage =
      target !== null && achieved !== null && target !== 0
        ? `${((achieved / target) * 100).toFixed(2)}%`
        : "--";
    const percentageIncreased =
      target !== null && achieved !== null ? achieved >= target : false;

    return dashboardCollectionRowsConfig.map((row) => {
      if (row.name === "Premium") {
        return { ...row, target, achieved, percentageText: percentage, percentageIncreased };
      }
      return row;
    });
  }, [data]);
  const businessCollectionColumns = useMemo(
    () => getBusinessCollectionColumns(),
    []
  );

  // Single shared form instance — passed to both SmartSearch instances so they
  // stay in sync: same field store, same watch subscription, same reset target.
  const sharedFilterMethods = useForm({ defaultValues });
  const { selectedValues, handleReset } = useFormWatcher({
    formMethods: sharedFilterMethods,
    setSearchTerm: () => undefined,
    searchFieldName: "bussinessPerformance",
    searchDefaultValues: resetDefaultValues,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.dashBoard,
    dispatch,
  });

  const isBusinessMonthMode = useMemo(() => {
    const mode = (selectedValues as Record<string, any>)?.periodMode;
    return (
      (typeof mode === "object" ? mode?.value : mode) === PERIOD_MODE_BUSINESS
    );
  }, [selectedValues]);

  const dashboardFilterConfig = useMemo(() => {
    const incomePeriodKeys = ["quarter", "month", "from", "to"];
    const base = businessPerformanceFilterConfig.filter(
      (f) => !incomePeriodKeys.includes(f.key)
    );
    const incomePeriodFields = businessPerformanceFilterConfig.filter((f) =>
      incomePeriodKeys.includes(f.key)
    );

    // Switching mode clears every period selection on both sides, so a hidden
    // field can't keep riding the query string after the toggle moves.
    const toggle: FormFieldConfig = {
      ...periodModeToggleField(),
      apiDependencies: {
        clearFieldsOnChange: [...incomePeriodKeys, "businessMonth"],
      },
    };

    // The base config bottom-aligns Business month to sit level with the
    // two-line date labels next to it; in this mode those dates are gone.
    const { gridItemSx: _dropBottomAlign, ...businessMonth } =
      businessMonthField();

    return [
      ...base,
      toggle,
      ...(isBusinessMonthMode
        ? [businessMonth as FormFieldConfig]
        : incomePeriodFields),
    ];
  }, [isBusinessMonthMode]);

  const handleRun = () => {
    const toDate = selectedValues?.to;
    const fromDate = selectedValues?.from;

    const hasToDate =
      toDate && toDate !== null && toDate !== "" && toDate !== undefined;
    const hasFromDate =
      fromDate &&
      fromDate !== null &&
      fromDate !== "" &&
      fromDate !== undefined;

    // Check if only one date is provided
    if ((hasToDate && !hasFromDate) || (hasFromDate && !hasToDate)) {
      dispatch(
        setToastMessage({
          message: "Please select from and to dates before running the search",
          severity: "error",
        })
      );
      return;
    }

    // Check if from date is greater than to date
    if (hasFromDate && hasToDate) {
      const fromDateObj = new Date(fromDate);
      const toDateObj = new Date(toDate);

      if (fromDateObj > toDateObj) {
        dispatch(
          setToastMessage({
            message: "Please provide valid from and to dates",
            severity: "error",
          })
        );
        return;
      }
    }
    setAppliedFilters({
      ...(selectedValues || {}),
      incomeType:
        (selectedValues as Record<string, any>)?.incomeType ||
        ({ value: ALL_VALUE, label: "All" } as const),
      periodMode:
        (selectedValues as Record<string, any>)?.periodMode ||
        ({ value: PERIOD_MODE_INCOME, label: "Income Month" } as const),
    });
  };
  const navigate = useNavigate();
  const location = useLocation();
  const lastPersistedFiltersRef = useRef<string>();

  useEffect(() => {
    if (!skipQuery || filterPreferencesLoading) return;

    const baseValues = location.state?.filters || defaultValues;
    const defValues = {
      ...baseValues,
      incomeType:
        (baseValues as Record<string, any>)?.incomeType ||
        ({ value: ALL_VALUE, label: "All" } as const),
      periodMode:
        (baseValues as Record<string, any>)?.periodMode ||
        ({ value: PERIOD_MODE_INCOME, label: "Income Month" } as const),
    };

    sharedFilterMethods.reset(defValues);
    setAppliedFilters(defValues);
    setSkipQuery(false); // now allow queries to fire
  }, [
    sharedFilterMethods,
    location?.state?.filters,
    defaultValues,
    skipQuery,
    filterPreferencesLoading,
  ]);

  const fromOpportunities =
    location.state?.lastRemovedBreadcrumb?.key ===
    BREADCRUMB_KEYS.SALES_OPPORTUNITY;
  const fromBizDoneReport =
    location.state?.lastRemovedBreadcrumb?.key ===
      BREADCRUMB_KEYS.BIZ_DONE_REPORT &&
    location.state?.lastRemovedBreadcrumb?.state?.fromBrokerageToCollect;
  const fromROOpportunities =
    location.state?.lastRemovedBreadcrumb?.key ===
    BREADCRUMB_KEYS.RENEWAL_OPPORTUNITY;
  const fromClientPortfolio =
    location.state?.lastRemovedBreadcrumb?.key ===
    BREADCRUMB_KEYS.CLIENT_PORTFOLIO;
  const fromClaims =
    location.state?.lastRemovedBreadcrumb?.key === BREADCRUMB_KEYS.CLAIMS;
  const fromEndorsement =
    location.state?.lastRemovedBreadcrumb?.key === BREADCRUMB_KEYS.ENDORSEMENT;
  const fromPolicyType =
    location.state?.lastRemovedBreadcrumb?.key === BREADCRUMB_KEYS.POLICY;

  const lastEntryPointIsFollowUp =
    location.state?.lastRemovedBreadcrumb?.state?.pendingActivities === true;

  const placementScrollTarget =
    location.state?.lastRemovedBreadcrumb?.state?.placementScrollTarget;

  // Markers set by the SO/RO "Schedule by SBU" drilldowns so returning via
  // breadcrumb lands on that table rather than falling back to the funnel.
  const salesScrollTarget =
    location.state?.lastRemovedBreadcrumb?.state?.salesScrollTarget;
  const renewalScrollTarget =
    location.state?.lastRemovedBreadcrumb?.state?.renewalScrollTarget;

  const salesFunnelRef = useRef<HTMLDivElement | null>(null);
  const renewalFunnelRef = useRef<HTMLDivElement | null>(null);
  const salesScheduleBySbuRef = useRef<HTMLDivElement | null>(null);
  const renewalScheduleBySbuRef = useRef<HTMLDivElement | null>(null);
  const placementFunnelRef = useRef<HTMLDivElement | null>(null);
  const placementBySbuRef = useRef<HTMLDivElement | null>(null);
  const placementFollowUpRef = useRef<HTMLDivElement | null>(null);
  const brokerageToCollectRef = useRef<HTMLDivElement | null>(null);
  const soFollowUpRef = useRef<HTMLDivElement | null>(null);
  const roFollowUpRef = useRef<HTMLDivElement | null>(null);
  const blockRef = useRef<HTMLDivElement | null>(null);
  const tatSummaryRef = useRef<HTMLDivElement | null>(null);
  const policyTypeRef = useRef<HTMLDivElement | null>(null);
  const serviceScoreRef = useRef<HTMLDivElement | null>(null);
  const smartSearchRef = useRef<HTMLDivElement | null>(null);
  const pageRootRef = useRef<HTMLDivElement | null>(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [expandFilters, setExpandFilters] = useState(false);
  const [filterPanelMaxHeight, setFilterPanelMaxHeight] = useState<number>();
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = pageRootRef.current;
    if (!el) return;

    // Walk up the DOM to find the nearest scrollable ancestor
    const getScrollableParent = (node: HTMLElement | null): HTMLElement | null => {
      if (!node) return null;
      const overflowRegex = /(auto|scroll)/;
      let parent = node.parentElement;
      while (parent) {
        const { overflow, overflowY } = getComputedStyle(parent);
        if (overflowRegex.test(overflow + overflowY)) return parent;
        parent = parent.parentElement;
      }
      return null;
    };

    const scrollContainer = getScrollableParent(el);
    if (!scrollContainer) return;

    scrollContainerRef.current = scrollContainer;

    // Show floating icon only when the bottom of the SmartSearch container
    // has scrolled above the top of the scroll container's visible area
    const handleScroll = () => {
      if (!smartSearchRef.current) return;
      const smartSearchRect = smartSearchRef.current.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      setIsScrolled(smartSearchRect.bottom <= containerRect.top);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.style.overflow = expandFilters ? "hidden" : "";
    return () => {
      container.style.overflow = "";
    };
  }, [expandFilters]);

  // The floating panel is `top: 0` inside the scroll container, not the
  // viewport, so its ceiling is "viewport bottom minus wherever that container
  // starts". Re-measured on open and on resize; the container's top can move
  // (banners, announcements) between one open and the next.
  useEffect(() => {
    if (!expandFilters) return;

    const measure = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const { top } = container.getBoundingClientRect();
      setFilterPanelMaxHeight(
        Math.max(MIN_FILTER_PANEL_HEIGHT, window.innerHeight - top - 8)
      );
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [expandFilters]);

  useLayoutEffect(() => {
    if (!viewSalesFunnel) return;

    // Resolve the widget we should land on based on the entry point. We key off
    // the entry-point flags (not the ref's current value) so the target stays
    // stable while we wait for the widget to mount.
    const getTargetRef = (): React.RefObject<HTMLDivElement> | null => {
      // Specific "Schedule by SBU" markers win over the funnel fallbacks so a
      // drilldown from an SBU table returns to that table, not the funnel.
      if (salesScrollTarget === "sbu") return salesScheduleBySbuRef;
      if (renewalScrollTarget === "sbu") return renewalScheduleBySbuRef;
      if (placementScrollTarget === "funnel") return placementFunnelRef;
      if (placementScrollTarget === "sbu") return placementBySbuRef;
      if (placementScrollTarget === "followUp") return placementFollowUpRef;
      if (fromOpportunities) {
        return lastEntryPointIsFollowUp ? soFollowUpRef : salesFunnelRef;
      }
      if (fromROOpportunities) {
        return lastEntryPointIsFollowUp ? roFollowUpRef : renewalFunnelRef;
      }
      if (fromClientPortfolio) return blockRef;
      if (fromClaims || fromEndorsement) return tatSummaryRef;
      if (fromPolicyType) return policyTypeRef;
      if (fromBizDoneReport) return brokerageToCollectRef;
      return null;
    };

    const targetRef = getTargetRef();
    if (!targetRef) return;

    // Widgets render immediately and fill in as their data arrives, which keeps
    // shifting everything below them. If we scroll while that's still happening,
    // we either land on the wrong spot or have to snap-correct (which kills the
    // animation). So we wait for the layout to stop reflowing, then do a single
    // smooth scroll to the target's final position.
    let rafId = 0;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let observer: ResizeObserver | undefined;
    let done = false;
    const start = performance.now();
    const MAX_WAIT_MS = 8000;
    const SETTLE_MS = 400;

    const contentEl = pageRootRef.current;

    const cleanup = () => {
      if (settleTimer) clearTimeout(settleTimer);
      cancelAnimationFrame(rafId);
      observer?.disconnect();
    };

    // Scroll once, smoothly, to the (now settled) target.
    const doScroll = () => {
      if (done) return;
      const node = targetRef.current;
      if (!node || node.offsetHeight === 0) {
        // Target not painted yet — keep waiting within the cap.
        if (performance.now() - start < MAX_WAIT_MS) {
          rafId = requestAnimationFrame(doScroll);
        }
        return;
      }
      done = true;
      cleanup();
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const armSettle = () => {
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(doScroll, SETTLE_MS);
    };

    if (contentEl && typeof ResizeObserver !== "undefined") {
      // Every time a widget finishes loading, the content height changes and we
      // restart the settle timer. When it stays quiet for SETTLE_MS, we scroll.
      observer = new ResizeObserver(() => {
        if (done) return;
        if (performance.now() - start > MAX_WAIT_MS) {
          doScroll();
          return;
        }
        armSettle();
      });
      observer.observe(contentEl);
      armSettle();
    } else {
      settleTimer = setTimeout(doScroll, 800);
    }

    return cleanup;
  }, [
    fromOpportunities,
    fromROOpportunities,
    viewSalesFunnel,
    fromClientPortfolio,
    fromClaims,
    fromEndorsement,
    fromPolicyType,
    fromBizDoneReport,
    lastEntryPointIsFollowUp,
    placementScrollTarget,
    salesScrollTarget,
    renewalScrollTarget,
  ]);

  useEffect(() => {
    if (!appliedFilters || Object.keys(appliedFilters).length === 0) {
      return;
    }

    const serializedFilters = JSON.stringify(appliedFilters);

    if (lastPersistedFiltersRef.current === serializedFilters) {
      return;
    }

    navigate(".", {
      state: { ...(location.state ?? {}), filters: appliedFilters },
      replace: true,
    });

    lastPersistedFiltersRef.current = serializedFilters;
  }, [appliedFilters, location.state, navigate]);

  const cleanValues = (filterValues: any) => {
    // const result = Object.entries(filterValues).filter
    return Object.fromEntries(
      Object.entries(filterValues).filter(
        ([, value]) => value !== ALL_VALUE && value !== "" && value !== null
      )
    );
  };

  const formatDateOnly = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const addDays = (date: Date, days: number): Date => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const getPolicyExpiryDrilldownRange = (bucketLabel?: string) => {
    const today = new Date();
    // The SBU tables pass their column label ("30 Days"/…); translate it to the
    // day-range key before lookup, else 30/60/90 resolve no range and the drill
    // widens to "expiry >= today" (the whole future pipeline).
    const rangeKey = bucketLabel
      ? SBU_EXPIRY_BUCKET_TO_RANGE_KEY[bucketLabel] ?? bucketLabel
      : undefined;
    const range = rangeKey
      ? POLICY_EXPIRY_BUCKET_DAY_RANGES[rangeKey]
      : undefined;

    if (rangeKey === POLICY_EXPIRY_BUCKET_LABELS.BEYOND_90_DAYS) {
      return {
        policyExpiryFromDate: formatDateOnly(addDays(today, range?.from ?? 0)),
        policyExpiryToDate: null as string | null,
      };
    }

    if (!range) {
      return {
        policyExpiryFromDate: formatDateOnly(today),
        policyExpiryToDate: null as string | null,
      };
    }

    return {
      policyExpiryFromDate: formatDateOnly(addDays(today, range.from)),
      policyExpiryToDate:
        range.to !== null ? formatDateOnly(addDays(today, range.to)) : null,
    };
  };

  useBreadcrumbTrail({
    label: DETAILS_LABELS.DASHBOARD,
    path: "/dashboard",
    key: BREADCRUMB_KEYS.DASHBOARD,
    state: {
      filters: appliedFilters,
      fromDashboard: true,
    },
  });

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const dashboardBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: DETAILS_LABELS.DASHBOARD,
            path: "/dashboard",
            key: DETAILS_KEYS.DASHBOARD,
            state: {
              filters: appliedFilters,
              fromDashboard: true,
            },
          }),
        ];
  const onFunnelClick = (params: any, chartKey: string) => {
    const name = params?.data?.name;
    const isPlacementFunnel = chartKey === "PLACEMENT";

    const isPlacementHeadBar = isPlacementFunnel && name === ISG_PLANNING;

    // The placement head bar still drills as a funnel stage (everything past the
    // ISG gate), but it names itself in Opty. Activity so the filter panel shows
    // what was clicked. Safe because the funnel path drops a non-stage
    // activityName server-side (getActivityTableName finds no table for it).
    // SO/RO head bars stay blank — their listings have no such LOV entry.
    const activityName =
      name === "SO" || name === "RO"
        ? ""
        : name === "Placement Slip"
        ? "Placement Slip Generation"
        : name;

    const filteredValues = cleanValues(appliedFilters);

    // Neither businessMonth nor periodMode is a valid filter for the
    // opportunities listing — drop them so the opportunity-service endpoint
    // doesn't reject the unknown param. forbidNonWhitelisted is global to every
    // service (service-lib CommonBootstrap), so an unknown param is a 400, not
    // something quietly ignored.
    const {
      incomeType: _incomeType,
      businessMonth: _businessMonth,
      periodMode: _periodMode,
      ...rest
    } = filteredValues ?? {};

    const soToManageQuotes = routeToManageQuotes && chartKey === "SO";
    const drillToManageQuotes = isPlacementFunnel || soToManageQuotes;

    const updateFilter = {
      ...rest,
      viewBy: filteredValues.owner,
      // Only pass ownerId on an explicit owner pick — matching the funnel count —
      // so a leader's default drill-in stays org-wide instead of scoping to self.
      ...(isExplicitOwnerPick(filteredValues.userId)
        ? { ownerId: filteredValues.userId }
        : {}),
      ...(activityName && activityName !== ""
        ? { activityName: [activityName] }
        : {}),
      ...(soToManageQuotes ? { optyType: [OPPORTUNITY_TYPE_SO] } : {}),
    };

    const destinationConfig = drillToManageQuotes
      ? {
          label: MANAGE_QUOTES,
          path: "/manage-quotes",
          key: BREADCRUMB_KEYS.MANAGE_QUOTES,
        }
      : chartKey === "SO"
        ? {
            label: DETAILS_LABELS.SALES_OPPORTUNITY,
            path: "/opportunities",
            key: DETAILS_KEYS.SALES_OPPORTUNITY,
          }
        : {
            label: DETAILS_LABELS.RENEWAL_OPPORTUNITY,
            path: "/renewal-opportunities",
            key: DETAILS_KEYS.RENEWAL_OPPORTUNITY,
          };

    const destinationState = buildBreadcrumbState({
      breadcrumbs: dashboardBreadcrumb,
      crumb: destinationConfig,
      state: {
        filters: updateFilter,
        fromDashboard: true,
        // Scroll back to this widget when returning via breadcrumb.
        ...(isPlacementFunnel ? { placementScrollTarget: "funnel" } : {}),
        // ISG Planning arrives as a display-only activity name here, so Manage
        // Quotes must keep the funnel path instead of reading it as a
        // planning-status drilldown.
        ...(isPlacementHeadBar ? { funnelHeadStage: true } : {}),
      },
    });

    navigate(destinationConfig.path, {
      state: destinationState,
    });
  };

  const handleTotalClick = () => {
    const destinationConfig = {
      label: BUSINESS_PERFORMANCE.LABELS.MY_BUSINESS_PERFORMANCE,
      path: "/business-performance",
      key: BREADCRUMB_KEYS.BUSINESS_PERFORMANCE,
    };

    const {
      periodMode: _drilldownPeriodMode,
      businessMonth: _drilldownBusinessMonth,
      ...drilldownFilters
    } = appliedFilters as Record<string, any>;
    const destinationState = buildBreadcrumbState({
      breadcrumbs: dashboardBreadcrumb,
      crumb: destinationConfig,
      state: {
        filters: drilldownFilters,
      },
    });

    navigate(destinationConfig.path, {
      state: destinationState,
    });
  };

  // *** Need to verify on this ****
  const handleViewPortfolio = () => {
    const destinationConfig = {
      label: CLIENT_PORTFOLIO,
      path: "/my-client-portfolio",
      key: BREADCRUMB_KEYS.CLIENT_PORTFOLIO,
    };
    const destinationState = buildBreadcrumbState({
      breadcrumbs: dashboardBreadcrumb,
      crumb: destinationConfig,
      state: {
        formDashboard: true,
        filters: getDashboardDrilldownFilters(),
      },
    });

    navigate(destinationConfig.path, {
      state: destinationState,
    });
    // navigate("/my-client-portfolio", {
    //   state: {
    //     formDashboard: true,
    //   },
    // });
  };

  const handleSaveView = () => {
    dispatch(
      updateUserDefaultConfig({
        entityKey: TABLE_CONTROLLER_ENTITY_KEY.dashBoard,
        selectedFilterValues: selectedValues ?? {},
        columns: [],
      })
    );
  };

  const getDashboardDrilldownFilters = () => {
    const filteredValues = cleanValues(appliedFiltersWithoutIncomeType);
    const { userId, owner, ...rest } = filteredValues ?? {};

    return {
      ...rest,
      ...(userId !== undefined ? { ownerId: userId } : {}),
      ...(owner !== undefined ? { viewBy: owner } : {}),
    };
  };

  const handleTatSbuBucketClick = (
    sectionTitle: TatSectionKey,
    row: { sbuId: number; sbuName: string; sourceSbuIds?: number[] },
    bucketLabel?: string
  ) => {
    const tatRangeValue = bucketLabel;
    const openTatOnly =
      sectionTitle === TatSectionKey.CLAIMS && !bucketLabel
        ? { value: true, label: OPEN_TAT_LABEL }
        : undefined;

    const sbuIds =
      row.sourceSbuIds && row.sourceSbuIds.length > 0
        ? row.sourceSbuIds
        : [row.sbuId];

    const destinationConfig =
      sectionTitle === TatSectionKey.ENDORSEMENTS
        ? {
            label: DETAILS_LABELS.ENDORSEMENT,
            path: "/manage-endorsements",
            key: BREADCRUMB_KEYS.ENDORSEMENT,
          }
        : {
            label: "Manage claims",
            path: "/manage-claims",
            key: BREADCRUMB_KEYS.CLAIMS,
          };

    const destinationState = buildBreadcrumbState({
      breadcrumbs: dashboardBreadcrumb,
      crumb: destinationConfig,
      state: {
        formDashboard: true,
        filters: {
          ...getDashboardDrilldownFilters(),
          // SBU is a single-select smart-search field — it pre-fills only when the
          // value is a single id matching an option (option.value === value.value),
          // not an array. Use the row's primary SBU id.
          sbuId: {
            value: sbuIds[0],
            label: row.sbuName,
          },
          // businessMonth exists on endorsements only — carry it to the
          // endorsements listing, never to claims.
          ...(sectionTitle === TatSectionKey.ENDORSEMENTS && appliedBusinessMonth
            ? { businessMonth: appliedBusinessMonth }
            : {}),
            ...(tatRangeValue
            ? {
                tatRange: {
                  value: tatRangeValue,
                  label: Array.isArray(tatRangeValue)
                    ? tatRangeValue.join(", ")
                    : tatRangeValue,
                },
              }
            : {}),
          ...(openTatOnly ? { openTatOnly } : {}),
        },
      },
    });

    navigate(destinationConfig.path, {
      state: destinationState,
    });
  };

  const handlePolicyExpiryBucketClick = (
    row: { sbuId: number; sbuName: string; sourceSbuIds?: number[] },
    bucketLabel?: string
  ) => {
    const sbuIds =
      row.sourceSbuIds && row.sourceSbuIds.length > 0
        ? row.sourceSbuIds
        : [row.sbuId];

    const expiryRange = getPolicyExpiryDrilldownRange(bucketLabel);

    // Strip period-based filters from the dashboard drilldown — they conflict
    // with the expiry-date bucket range we are about to set as from/to. The
    // Renewal Schedule by SBU widget is purely a relative "next N days" view,
    // so financialYear/quarter/month never apply to it or its drilldown.
    const {
      financialYear: _fy,
      timeFilter: _tf,
      quarter: _quarter,
      month: _month,
      period: _period,
      from: _from,
      to: _to,
      ...drilldownFiltersWithoutPeriod
    } = getDashboardDrilldownFilters();

    const destinationConfig = {
      label: DETAILS_LABELS.RENEWAL_OPPORTUNITY,
      path: "/renewal-opportunities",
      key: BREADCRUMB_KEYS.RENEWAL_OPPORTUNITY,
    };

    const destinationState = buildBreadcrumbState({
      breadcrumbs: dashboardBreadcrumb,
      crumb: destinationConfig,
      state: {
        formDashboard: true,
        // Scroll back to the Renewal Schedule by SBU table when returning.
        renewalScrollTarget: "sbu",
        filters: {
          ...drilldownFiltersWithoutPeriod,
          // SBU is a single-select smart-search field — it pre-fills only when the
          // value is a single id matching an option (option.value === value.value),
          // not an array. Use the row's primary SBU id.
          sbuId: {
            value: sbuIds[0],
            label: row.sbuName,
          },
          ...(expiryRange.policyExpiryFromDate
            ? { from: expiryRange.policyExpiryFromDate }
            : {}),
          ...(expiryRange.policyExpiryToDate
            ? { to: expiryRange.policyExpiryToDate }
            : {}),
        },
      },
    });

    navigate(destinationConfig.path, {
      state: destinationState,
    });
  };

  const handleSalesScheduleBucketClick = (
    row: { sbuId: number; sbuName: string; sourceSbuIds?: number[] },
    bucketLabel?: string,
    // Placement buckets span SO and RO, so they always drill into the combined
    // listing and never narrow by type (spec §12.4). Everything else — the SBU
    // pre-fill and the expiry range — is identical, hence one handler.
    isPlacement = false
  ) => {
    const sbuIds =
      row.sourceSbuIds && row.sourceSbuIds.length > 0
        ? row.sourceSbuIds
        : [row.sbuId];

    const expiryRange = getPolicyExpiryDrilldownRange(bucketLabel);

    // Strip period-based filters from the dashboard drilldown — they conflict
    // with the expiry-date bucket range we set as from/to. The Sales Schedule by
    // SBU widget is a relative "next N days" view, so financialYear/quarter/month
    // never apply to it or its drilldown.
    const {
      financialYear: _fy,
      timeFilter: _tf,
      quarter: _quarter,
      month: _month,
      period: _period,
      from: _from,
      to: _to,
      ...drilldownFiltersWithoutPeriod
    } = getDashboardDrilldownFilters();

    const destinationConfig =
      isPlacement || routeToManageQuotes
        ? {
            label: MANAGE_QUOTES,
            path: "/manage-quotes",
            key: BREADCRUMB_KEYS.MANAGE_QUOTES,
          }
        : {
            label: DETAILS_LABELS.SALES_OPPORTUNITY,
            path: "/opportunities",
            key: DETAILS_KEYS.SALES_OPPORTUNITY,
          };

    const destinationState = buildBreadcrumbState({
      breadcrumbs: dashboardBreadcrumb,
      crumb: destinationConfig,
      state: {
        formDashboard: true,
        // Scroll back to this widget when returning via breadcrumb.
        ...(isPlacement
          ? { placementScrollTarget: "sbu" }
          : { salesScrollTarget: "sbu" }),
        filters: {
          ...drilldownFiltersWithoutPeriod,
          // SBU is a single-select smart-search field — it pre-fills only when the
          // value is a single id matching an option (option.value === value.value),
          // not an array. Use the row's primary SBU id.
          sbuId: {
            value: sbuIds[0],
            label: row.sbuName,
          },
          ...(expiryRange.policyExpiryFromDate
            ? { from: expiryRange.policyExpiryFromDate }
            : {}),
          ...(expiryRange.policyExpiryToDate
            ? { to: expiryRange.policyExpiryToDate }
            : {}),
          // Manage Quotes is a combined SO+RO list — narrow it to SO for the
          // ISG-only routing so the SBU drilldown shows only SO opportunities.
          ...(routeToManageQuotes && !isPlacement
            ? { optyType: [OPPORTUNITY_TYPE_SO] }
            : {}),
        },
      },
    });

    navigate(destinationConfig.path, {
      state: destinationState,
    });
  };

  return (
    <DashboardPageWrapper>
      {" "}
      {/* <HeaderActionsRow>
        <SectionHeader>
          Here’s a quick snapshot of performance, sales and renewals
        </SectionHeader>
                <Button
          loading={filterPreferencesLoading}
          onClick={handleSaveView}
          variantType="primary"
          label={SAVE_VIEW}
        />
      </HeaderActionsRow> */}
      {isScrolled && !expandFilters && (
        <StickyFilterBar>
          <FloatingFilterButton
            aria-label="Open filters"
            onClick={() => setExpandFilters((prev) => !prev)}
          >
            <FilterIcon color={theme.palette.text.secondary} />
          </FloatingFilterButton>
        </StickyFilterBar>
      )}
      {isScrolled && expandFilters && (
        <StickySmartSearchWrapper availableHeight={filterPanelMaxHeight}>
          <CardBackground>
            <SmartSearch
              searchFormConfig={dashboardFilterConfig}
              searchDefaultValues={defaultValues}
              sharedFormMethods={sharedFilterMethods}
              selectedValues={selectedValues}
              onReset={handleReset}
              formMethods={sharedFilterMethods}
              searchFieldName="bussinessPerformance"
              placeholder={SEARCH}
              enableSmartSearch={true}
              onRunFilters={handleRun}
              disableSearch={true}
              hideSearch={true}
              runThePeriodFilterByDefault={false}
              expandFilters={true}
              onExpandFiltersChange={(expanded) => {
                if (!expanded) setExpandFilters(false);
              }}
              collapseOnRun={true}
              onSaveView={handleSaveView}
              saveViewLoading={filterPreferencesLoading}
            />
          </CardBackground>
        </StickySmartSearchWrapper>
      )}
      <div style={{ paddingTop: "20px" }} ref={pageRootRef}>
        <div ref={smartSearchRef} style = {{marginBottom: "20px"}}>
          <CardBackground>
          <SmartSearch
            searchFormConfig={dashboardFilterConfig}
            searchDefaultValues={defaultValues}
            sharedFormMethods={sharedFilterMethods}
            selectedValues={selectedValues}
            onReset={handleReset}
            formMethods={sharedFilterMethods}
            searchFieldName="bussinessPerformance"
            placeholder={SEARCH}
            enableSmartSearch={true}
            onRunFilters={handleRun}
            disableSearch={true}
            hideSearch={true}
            runThePeriodFilterByDefault={false}
            onSaveView={handleSaveView}
            saveViewLoading={filterPreferencesLoading}
          />
        </CardBackground>
        </div>

        {/* Target vs Actual Breakdown ("My Business Performance") — BD,
            leadership and superusers only; hidden for ISG-only users. */}
      <LeftSideSectionContainer ref={salesFunnelRef}>
        {dashboardWidgetVisibility.myBusinessPerformance && (
          <TargetVsActualBreakdown
            queryString={queryString}
            onTotalNavigate={handleTotalClick}
            showNotApplicablePlaceholder={
              hasInsurerFilterApplied || hasBusinessMonthApplied
            }
          />
        )}
      </LeftSideSectionContainer>

        {/* Business Performance Bar Chart - commented out per request
        <BusinessPerformanceBarChart
          title={BUSINESS_PERFORMANCE.LABELS.MY_BUSINESS_PERFORMANCE}
          data={data}
          isLoading={isLoading}
          error={error}
          chartsData={chartsData}
          onclickBar={handleTotalClick}
          showNotApplicablePlaceholder={
            hasInsurerFilterApplied || hasBusinessMonthApplied
          }
        />
        */}

        {/* First Business Performance Section */}
        {/* {renderBusinessPerformanceSection(
          BUSINESS_PERFORMANCE.LABELS.MY_BUSINESS_PERFORMANCE,
          data,
          isLoading,
          error,
          chartsData,
          handleTotalClick
        )} */}

        {dashboardWidgetVisibility.salesFunnel && (
          <LeftSideSectionContainer ref={salesFunnelRef}>
            <SubSectionHeader border={true}>
              {BUSINESS_PERFORMANCE.LABELS.MY_SALES_FUNNEL}
            </SubSectionHeader>
            {viewSalesFunnel ? (
              <SalesFunnel
                handleFunnelClick={onFunnelClick}
                queryString={funnelQueryString}
                skipQuery={skipQuery}
                showNotApplicablePlaceholder={hasBusinessMonthApplied}
              />
            ) : (
              <Unauthorized />
            )}
          </LeftSideSectionContainer>
        )}

        {/* Sales Schedule by SBU Table — sits under the SO funnel */}
        {dashboardWidgetVisibility.salesScheduleBySbu && (
          <LeftSideSectionContainer ref={salesScheduleBySbuRef}>
            <SubSectionHeader border={true}>
              {BUSINESS_PERFORMANCE.LABELS.SALES_SCHEDULE_BY_SBU}
            </SubSectionHeader>
            <SbuPolicyExpiryTable
              rows={salesScheduleBySbuData?.data?.data}
              isLoading={salesScheduleBySbuLoading}
              onBucketClick={handleSalesScheduleBucketClick}
              showNotApplicablePlaceholder={hasBusinessMonthApplied}
            />
          </LeftSideSectionContainer>
        )}

        {/* SO Follow Up table */}
        {dashboardWidgetVisibility.soFollowUp && (
          <LeftSideSectionContainer ref={soFollowUpRef} gap={false}>
            <MyFollowUpLabel>
              {BUSINESS_PERFORMANCE.LABELS.SO_FOLLOW_UP}
            </MyFollowUpLabel>
            <MyFollowUp
              filters={appliedFiltersWithoutIncomeType}
              queryString={queryStringWithoutIncomeType}
              status="SO"
              showNotApplicablePlaceholder={hasBusinessMonthApplied}
            />
          </LeftSideSectionContainer>
        )}

        {dashboardWidgetVisibility.renewalFunnel && (
          <LeftSideSectionContainer ref={renewalFunnelRef}>
            <SubSectionHeader border={true}>
              {BUSINESS_PERFORMANCE.LABELS.MY_RENEWAL_FUNNEL}
            </SubSectionHeader>
            {viewSalesFunnel ? (
              // If viewSalesFunnel is true, render the RenewalFunnel component

              <RenewalFunnel
                handleFunnelClick={onFunnelClick}
                queryString={funnelQueryString}
                skipQuery={skipQuery}
                showNotApplicablePlaceholder={hasBusinessMonthApplied}
              />
            ) : (
              // If viewSalesFunnel is false, render the Unauthorized component
              <Unauthorized />
            )}
          </LeftSideSectionContainer>
        )}

        {/* Renewal Schedule by SBU Table — sits under the RO funnel */}
        {dashboardWidgetVisibility.renewalScheduleBySbu && (
          <LeftSideSectionContainer ref={renewalScheduleBySbuRef}>
            <SubSectionHeader border={true}>
              {BUSINESS_PERFORMANCE.LABELS.RENEWAL_SCHEDULE_BY_SBU}
            </SubSectionHeader>
            <SbuPolicyExpiryTable
              rows={renewalScheduleBySbuData?.data?.data}
              isLoading={renewalScheduleBySbuLoading}
              onBucketClick={handlePolicyExpiryBucketClick}
              showNotApplicablePlaceholder={hasBusinessMonthApplied}
            />
          </LeftSideSectionContainer>
        )}

        {/* RO Follow Up table */}
        {dashboardWidgetVisibility.roFollowUp && (
          <LeftSideSectionContainer ref={roFollowUpRef} gap={false}>
            <MyFollowUpLabel>
              {BUSINESS_PERFORMANCE.LABELS.RO_FOLLOW_UP}
            </MyFollowUpLabel>
            <MyFollowUp
              filters={appliedFiltersWithoutIncomeType}
              queryString={queryStringWithoutIncomeType}
              status="RO"
              showNotApplicablePlaceholder={hasBusinessMonthApplied}
            />
          </LeftSideSectionContainer>
        )}

         {/* ---- Placement trio (spec §12): the ISG mirror of the SO trio. Shown
             to ISG-only users and to leadership / super; hidden from BD-only.
             All three drill into Manage Quotes. ---- */}
        {dashboardWidgetVisibility.placementFunnel && (
          <LeftSideSectionContainer ref={placementFunnelRef}>
            <SubSectionHeader border={true}>
              {BUSINESS_PERFORMANCE.LABELS.MY_PLACEMENT_FUNNEL}
            </SubSectionHeader>
            {viewSalesFunnel ? (
              <SalesFunnel
                type="PLACEMENT"
                handleFunnelClick={onFunnelClick}
                queryString={funnelQueryString}
                skipQuery={skipQuery}
                showNotApplicablePlaceholder={hasBusinessMonthApplied}
              />
            ) : (
              <Unauthorized />
            )}
          </LeftSideSectionContainer>
        )}

        {dashboardWidgetVisibility.placementScheduleBySbu && (
          <LeftSideSectionContainer ref={placementBySbuRef}>
            <SubSectionHeader border={true}>
              {BUSINESS_PERFORMANCE.LABELS.PLACEMENT_SCHEDULE_BY_SBU}
            </SubSectionHeader>
            <SbuPolicyExpiryTable
              rows={placementScheduleBySbuData?.data?.data}
              isLoading={placementScheduleBySbuLoading}
              onBucketClick={(row: any, bucketLabel?: string) =>
                handleSalesScheduleBucketClick(row, bucketLabel, true)
              }
              showNotApplicablePlaceholder={hasBusinessMonthApplied}
            />
          </LeftSideSectionContainer>
        )}

        {dashboardWidgetVisibility.placementFollowUp && (
          <LeftSideSectionContainer ref={placementFollowUpRef} gap={false}>
            <MyFollowUpLabel>
              {BUSINESS_PERFORMANCE.LABELS.PLACEMENT_FOLLOW_UP}
            </MyFollowUpLabel>
            <MyFollowUp
              filters={appliedFiltersWithoutIncomeType}
              queryString={queryStringWithoutIncomeType}
              status="PLACEMENT"
              showNotApplicablePlaceholder={hasBusinessMonthApplied}
            />
          </LeftSideSectionContainer>
        )}

          {/* Policy Type Distribution Widget */}
        <LeftSideSectionContainer ref={policyTypeRef}>
          <StyledButtonContainer>
            <SubSectionHeader border={false} style={{ marginTop: "0px" }}>
              {BUSINESS_PERFORMANCE.LABELS.POLICY_TYPE_DISTRIBUTION}
              <StyledSectionSubHeading>
                {BUSINESS_PERFORMANCE.DESCRIPTIONS.COUNT_PREMIUM_BROKERAGE}
              </StyledSectionSubHeading>
            </SubSectionHeader>
            <Button onClick={handleViewPortfolio}>
              {BUSINESS_PERFORMANCE.LABELS.VIEW_PORTFOLIO}
            </Button>
          </StyledButtonContainer>
          {policySummaryLoading ? (
            <Box
              sx={{
                minHeight: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PieSkeleton legendItems={5} />
            </Box>
          ) : policySummaryError ? (
            <Typography color="error">
              Failed to load policy type distribution data
            </Typography>
          ) : (
            <PolicyTypeDistribution
              data={policySummaryData?.data?.policyTypesDistribution}
              filters={appliedFiltersWithBusinessMonth}
              breadcrumbs={dashboardBreadcrumb}
            />
          )}
        </LeftSideSectionContainer>

        {/* TAT Summary by SBU Table */}
        <LeftSideSectionContainer ref={tatSummaryRef}>
          <SubSectionHeader border={true}>
            {BUSINESS_PERFORMANCE.LABELS.ENDORSEMENT_TAT_BY_SBU}
          </SubSectionHeader>
          <SbuTatSummaryTable
            data={tatSummaryTotalsData?.data?.sbuData}
            isLoading={tatSummaryTotalsLoading}
            onBucketClick={handleTatSbuBucketClick}
            showClaimsNotApplicablePlaceholder={hasBusinessMonthApplied}
          />
        </LeftSideSectionContainer>

        <LeftSideSectionContainer>
          <SubSectionHeader border={true}>
            {BUSINESS_PERFORMANCE.LABELS.BUSINESS_COLLECTION_SUMMARY}
          </SubSectionHeader>
          {isLoading ? (
            <TableSkeleton rows={5} cols={businessCollectionColumns.length} />
          ) : (
          <Table
            columns={businessCollectionColumns}
            rowData={dashboardCollectionRows}
            totalRows={dashboardCollectionRows.length}
            currentPage={collectionTableCurrentPage}
            setCurrentPage={setCollectionTableCurrentPage}
            loading={false}
            pageSize={collectionTablePageSize}
            pageSizeOptions={[5, 10, 20]}
            setPageSize={setCollectionTablePageSize}
            onCellClicked={() => undefined}
            onPrimaryActionClick={() => undefined}
            setSort={setCollectionTableSort}
            components={{}}
            height={400}
            displaySettingsButton={false}
            enableSaveView={false}
          />
          )}
        </LeftSideSectionContainer>

        <LeftSideSectionContainer ref={brokerageToCollectRef}>
          <SubSectionHeader border={true}>
            {BUSINESS_PERFORMANCE.LABELS.BROKERAGE_TO_COLLECT}
          </SubSectionHeader>
          {skipQuery ? (
            <TableSkeleton rows={6} cols={6} />
          ) : (
            <BrokerageToCollect
              filters={appliedFiltersWithBusinessMonth}
              queryString={businessMonthQueryString}
            />
          )}
        </LeftSideSectionContainer>

        {/* Service Score scatter plot — has its own Company filter since the
            dashboard's global Smart Search doesn't support one. Sits next to
            Brokerage to Collect. */}
        <LeftSideSectionContainer ref={serviceScoreRef}>
          <SubSectionHeader border={true}>Service Score</SubSectionHeader>
          <ServiceScoreWidget filters={appliedFilters} ownerId={loggedInUserId} />
        </LeftSideSectionContainer>

        {/* Service Follow up widget */}
        {/* <LeftSideSectionContainer>
          <ServiceFollowUp filters={appliedFilters} queryString={queryString} />
        </LeftSideSectionContainer> */}

        {/* Overview Cards widgets */}
        {/* <StyledOverviewBlock ref={blockRef}> */}
        {/* Business Overview */}
        {/* <LeftSideSectionContainer style={{ width: "100%" }}>
            <OverviewCard
              type={BUSINESS_PERFORMANCE.OVERVIEW_CARD_TYPES.BUSINESS}
              filters={appliedFiltersWithoutIncomeType}
            />
          </LeftSideSectionContainer> */}

        {/* Claims Overview */}
        {/* <LeftSideSectionContainer style={{ width: "100%" }}> */}
        {/* <SubSectionHeader border={false}>
              {BUSINESS_PERFORMANCE.LABELS.CLAIMS_OVERVIEW}
            </SubSectionHeader> */}
        {/* <OverviewCard
              type={BUSINESS_PERFORMANCE.OVERVIEW_CARD_TYPES.CLAIMS}
              filters={appliedFilters}
            /> */}
        {/* </LeftSideSectionContainer> */}
        {/* </StyledOverviewBlock> */}

        {/* Endorsement Tat Widgets  */}

        {/* Client Service Analysis Widget */}
        {/* <LeftSideSectionContainer>
          <StyledButtonContainer>

            <SubSectionHeader border={false} style={{ marginTop: "0px" }}>
              {BUSINESS_PERFORMANCE.LABELS.CLIENT_SERVICE_ANALYSIS}
              <StyledSectionSubHeading>
                {BUSINESS_PERFORMANCE.DESCRIPTIONS.CLIENT_SERVICE_SCORES}
              </StyledSectionSubHeading>
            </SubSectionHeader>
            <Button onClick={handleManageServiceScoreClick}>
              {BUSINESS_PERFORMANCE.LABELS.MANAGE_SERVICE_SCORE}
            </Button>
          </StyledButtonContainer>

          <ClientServiceAnalysis />
        </LeftSideSectionContainer> */}

        {/* Policy Expiry Timeline Widget */}
        {/* <LeftSideSectionContainer border={true} ref={policyListingRef}>
          {policySummaryLoading ? (
            <CircularProgress />
          ) : policySummaryError ? (
            <Typography color="error">
              {BUSINESS_PERFORMANCE.ERRORS.POLICY_EXPIRY_TIMELINE_DATA}
            </Typography>
          ) : (
            <CardBackground>
              <TatSummary
                showIndicator={false}
                tatData={policyExpiryData}
                dataType={BUSINESS_PERFORMANCE.DATA_TYPES.POLICIES}
                appliedFilters={appliedFilters}
              />
            </CardBackground>
          )}
        </LeftSideSectionContainer> */}

        {/* <LeftSideSectionContainer>
          <SubSectionHeader border={true}>
            My Client Testimonials
          </SubSectionHeader>

          <WorkInProgress />
        </LeftSideSectionContainer> */}
      </div>
    </DashboardPageWrapper>
  );
};

export default BusinessPerformance;
