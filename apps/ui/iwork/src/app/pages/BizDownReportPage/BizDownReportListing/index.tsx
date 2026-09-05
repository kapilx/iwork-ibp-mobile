import { CellClickedEvent } from "ag-grid-community";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BIZ_DONE_REPORT,
  LIST_OF_RECORDS,
  ALL_VALUE,
  TABLE_CONTROLLER_ENTITY_KEY,
} from "../../../constants";
import { TitleContainer } from "../../CompanyPage/CompanyListing/styles";
import { Container } from "./styles";
import { useInsurerBranchViewBy } from "../../../Utils/useInsurerBranchViewBy";
import { getColumns, bizDownReportData, insurerField, businessMonthField, insurerBranchField, branchViewByField, periodModeToggleField, fromDateField, toDateField, getMonthsForQuarterInSmarSearch } from "./tableConfig";
import { companyUtilityFunctionFromContactPage } from "../../ContactPage/ContactListing/tableConfig";
import { useSelector, useDispatch } from "react-redux";
import { businessPerformanceFilterConfig, generateSectionTitleConfig } from "../../../components/BusinessPerformance/businessPerformanceConfig";
import {
  endPoints,
  EXPORT_TOAST,
  KPICards,
  Table,
  setToastMessage,
  FeatureKey,
  useLocalization,
  useReportExports,
  useTableController,
  CardBackground,
  ChipRenderer,
  SmartSearch,
  useFormWatcher,
  SEARCH,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  useBreadcrumbTrail,
  updateUserDefaultConfig,
  BREADCRUMB_KEYS,
  DETAILS_KEYS,
  buildBreadcrumbState,
  DETAILS_LABELS,
  CommonBreadcrumb,
  getAllMonths,
  getMonthsForQuarter,
  getSessionStorageData,
} from "@ui/ui-lib";
import ReportExportsTray from "../../../components/ReportExportsTray";
import ReportSheetSelectMenu from "../../../components/ReportSheetSelectMenu";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";

const validateFilterValue = (value: any): boolean => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === ALL_VALUE ||
    (Array.isArray(value) && value.length === 0) // multiselect with nothing picked
  ) {
    return false;
  }
  return true;
};

const optionValue = (v: any) =>
  typeof v === "object" && v !== null ? v?.value : v;

const incomePeriodKey = (values: any) =>
  JSON.stringify([
    optionValue(values?.month) ?? "",
    optionValue(values?.quarter) ?? "",
    optionValue(values?.financialYear) ?? "",
  ]);

const businessPeriodKey = (values: any) =>
  JSON.stringify([
    Array.isArray(values?.businessMonth)
      ? values.businessMonth.map(optionValue)
      : optionValue(values?.businessMonth) ?? "",
    optionValue(values?.financialYear) ?? "",
  ]);

const deriveBusinessMonthDateRange = (
  businessMonths: any,
  financialYear: any
): { from: string; to: string } | null => {
  let months = Array.isArray(businessMonths)
    ? businessMonths
    : businessMonths
    ? [businessMonths]
    : [];
  const allMonthDefs = getAllMonths();

  // Strip "ALL" sentinel and get only real month entries
  const isAllValue = (m: any) => {
    const val = typeof m === "object" && m !== null ? m?.value : m;
    return String(val).toUpperCase() === ALL_VALUE;
  };
  const realMonths = months.filter((m: any) => !isAllValue(m));

  if (realMonths.length === 0) {
    // Only "ALL" was selected with no individual months — expand to all 12
    months = allMonthDefs.filter((m) => m.month > 0);
  } else {
    // Use the individually-selected months (ignoring the "ALL" marker)
    months = realMonths;
  }

  // generateYearOptions stores value as the START year only ("2025" for FY 2025-2026)
  const fyRaw = typeof financialYear === "object" ? financialYear?.value : financialYear;
  let fyStart = new Date().getFullYear();
  let fyEnd = fyStart + 1;
  if (fyRaw) {
    const fyStr = String(fyRaw);
    if (fyStr.includes("-")) {
      const parts = fyStr.split("-").map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        fyStart = parts[0];
        fyEnd = parts[1];
      }
    } else {
      const year = parseInt(fyStr, 10);
      if (!isNaN(year)) {
        fyStart = year;
        fyEnd = year + 1;
      }
    }
  }

  // Apr(4)–Dec(12) belong to fyStart; Jan(1)–Mar(3) belong to fyEnd
  const getYear = (month: number) => (month >= 4 ? fyStart : fyEnd);
  const pad = (n: number) => String(n).padStart(2, "0");

  // Sort by actual calendar date — April 2025 must sort before March 2026
  const entries: { month: number; year: number }[] = months
    .map((m: any) => {
      const monthNum =
        typeof m === "object" && m !== null
          ? (m.month ?? allMonthDefs.find((mo) => mo.value === m.value)?.month ?? 0)
          : (allMonthDefs.find((mo) => mo.value === m)?.month ?? 0);
      return monthNum;
    })
    .filter((n: number) => n > 0)
    .map((month: number) => ({ month, year: getYear(month) }))
    .sort((a: any, b: any) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month
    );

  if (!entries.length) return null;

  const first = entries[0];
  const last = entries[entries.length - 1];
  const lastDay = new Date(last.year, last.month, 0).getDate();

  return {
    from: `${first.year}-${pad(first.month)}-01`,
    to: `${last.year}-${pad(last.month)}-${pad(lastDay)}`,
  };
};

// Normalises a stored filter record into form values. Shared by the page seed
// (user saved view, falling back to system) and by Reset (system only), so the
// two can't drift. Pure — no component state, hence module scope.
const buildDefaults = (baseValues: any, defaultOwner?: { value: string; label: string }) => {
  const existingIncomeType = baseValues?.incomeType;
  const normalizedIncomeType =
    existingIncomeType && typeof existingIncomeType === "object"
      ? existingIncomeType
      : { value: ALL_VALUE, label: "All" };

  return {
    ...baseValues,
    incomeType: normalizedIncomeType,
    userId: baseValues?.userId ?? defaultOwner ?? "",
    // branchViewBy is intentionally NOT seeded here — see the insurer-branch
    // effect in the component: it only applies once a branch is selected.
    periodMode:
      baseValues?.periodMode ?? { value: "incomeMonth", label: "Income Month" },
    // Honour whatever the caller seeded with: the page seed passes the user's
    // saved view (so a saved month survives reload), Reset passes the system
    // defaults (which carry no month, so the select falls back to placeholder).
    month: baseValues?.month ?? "",
    quarter: baseValues?.quarter ?? "",
    from: baseValues?.from ?? "",
    to: baseValues?.to ?? "",
  };
};

const BizDownReportListing: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { enqueueExport, hasInFlight, openPanel, jobs: exportJobs, unseenCount } =
    useReportExports();

  const prefilledFilterValues = useMemo(() => {
    if (location.state && location.state?.filters) {
      return {
        ...location.state.filters,
        ...(location.state?.fromBrokerageToCollect && {
          from: location.state.from ?? "",
          to: location.state.to ?? "",
          insurerId: {
            label: location.state.insurerName,
            value: location.state.insurerId,
          },
        }),
      };
    }

    // If no filters but insurerId is still passed
    if (location.state?.insurerId && location.state?.fromBrokerageToCollect) {
      return {
        from: location.state.from ?? "",
        to: location.state.to ?? "",
        insurerId: {
          label: location.state.insurerName,
          value: location.state.insurerId,
        },
      };
    }

    return undefined;
  }, [location.state]);

  const insurerId = location.state?.insurerId;
  const [skipQuery, setSkipQuery] = useState(true);
  const [sheetModalOpen, setSheetModalOpen] = useState(false);

  const customBrokeragePathParam = location.state?.fromBrokerageToCollect
    ? `&insurerId=${insurerId}`
    : location.state?.businessPerformanceType === "ACTUAL"
      ? `&businessPerformanceType=ACTUAL`
      : location.state?.businessPerformanceType === "NEW_BIZ"
        ? `&businessPerformanceType=SO`
        : location.state?.businessPerformanceType === "RENEWAL"
          ? `&businessPerformanceType=RO`
          : "";

  const {
    rowData,
    totalRows,
    currentPage,
    loading,
    setCurrentPage,
    pageSize,
    setPageSize,
    PAGE_SIZE_OPTIONS,
    overallData,
    setSort,
    setSmartSearch,
    setColumnOrder,
    columnOrder,
  } = useTableController({
    endpoint: endPoints.policyReportList,
    searchFieldName: "companyName",
    customPathParam:
      "entityType=policyDetails&allowAllInsurer=true" +
      customBrokeragePathParam,
    enabled: !skipQuery,
  });

  const systemSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.systemDefaultConfig?.smartSearchValues?.[
      TABLE_CONTROLLER_ENTITY_KEY.bizDoneReportEntity
      ]
  );
  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
      TABLE_CONTROLLER_ENTITY_KEY.bizDoneReportEntity
      ]
  );
  // Reset persists the cleared FILTERS; the column layout must ride along
  // unchanged. Sending the live columnOrder instead would overwrite the saved
  // layout with whatever the grid happens to be showing.
  const storedColumns = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.tableDefaultSettings?.[
      TABLE_CONTROLLER_ENTITY_KEY.bizDoneReportEntity
      ]
  );

  // Owner defaults to the logged-in user — same convention Biz Done
  // Enhanced's userId field uses. A saved view's own Owner choice
  // (baseValues.userId) still wins over this default.
  const userData = getSessionStorageData("user");
  const defaultOwner = useMemo(() => {
    const fullName = userData?.firstName
      ? userData.lastName && userData.lastName.trim() !== ""
        ? `${userData.firstName} ${userData.lastName}`
        : userData.firstName
      : "";
    return { value: String(userData?.userId ?? ""), label: fullName };
  }, [userData?.userId, userData?.firstName, userData?.lastName]);

  const defaultValues = useMemo(
    () =>
      buildDefaults(
        userSmartSearchDefaultValues || systemSmartSearchDefaultValues || {},
        defaultOwner
      ),
    [userSmartSearchDefaultValues, systemSmartSearchDefaultValues, defaultOwner]
  );

  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();

  // Reset target: the system default only, never the user's saved view —
  // otherwise fields the view carries (group company, company name) can't be
  // cleared. Every registered key gets an EXPLICIT value, because reset() won't
  // clear a field whose key is merely absent and SmartSearch's summary skips
  // only undefined/null/"" — so an omitted key stays visible after the query
  // has already dropped it. Empty value matches the field's shape so
  // multiselects stay arrays. Called from an event handler, so no memo needed.
  const buildResetPayload = () => {
    const systemDefaults = buildDefaults(systemSmartSearchDefaultValues || {}, defaultOwner);
    const current = formMethods?.getValues() ?? {};
    const next: Record<string, any> = {};
    Object.keys(current).forEach((key) => {
      next[key] =
        systemDefaults[key] !== undefined
          ? systemDefaults[key]
          : Array.isArray(current[key])
            ? []
            : "";
    });
    // Keys the system default defines but the form hasn't registered yet.
    return { ...next, ...systemDefaults };
  };

  const { selectedValues } = useFormWatcher({
    formMethods,
    setSearchTerm: () => { },
    searchFieldName: "bizDownReport",
    searchDefaultValues: defaultValues,
  });

  const isBusinessMonthMode = useMemo(() => {
    const mode = selectedValues?.periodMode;
    return mode === "businessMonth" || (mode as any)?.value === "businessMonth";
  }, [selectedValues?.periodMode]);

  const derivedBusinessMonthRange = useMemo(() => {
    if (!isBusinessMonthMode) return null;
    return deriveBusinessMonthDateRange(
      selectedValues?.businessMonth,
      selectedValues?.financialYear
    );
  }, [isBusinessMonthMode, selectedValues?.businessMonth, selectedValues?.financialYear]);

  useInsurerBranchViewBy(formMethods, selectedValues?.insurerBranchId);

  const prevBusinessMonthHadAll = useRef(false);
  // Last period values the from/to effects actually acted on — see
  // incomePeriodKey above for why identity comparison is not enough.
  const prevIncomePeriodKey = useRef<string | null>(null);
  const prevBusinessPeriodKey = useRef<string | null>(null);

  useEffect(() => {
    if (!formMethods || !isBusinessMonthMode) return;
    const businessMonth = selectedValues?.businessMonth;
    const current = Array.isArray(businessMonth) ? businessMonth : [];

    const containsAll = (arr: any[]) =>
      arr.some((m: any) => {
        const val = typeof m === "object" && m !== null ? m?.value : m;
        return String(val).toUpperCase() === ALL_VALUE;
      });

    const hadAll = prevBusinessMonthHadAll.current;
    const hasAll = containsAll(current);
    prevBusinessMonthHadAll.current = hasAll;

    const allMonthValues = getAllMonths().filter((m) => m.month > 0).map((m) => m.value);
    const stripAll = (arr: any[]) =>
      arr.filter((m: any) => {
        const val = typeof m === "object" && m !== null ? m?.value : m;
        return String(val).toUpperCase() !== ALL_VALUE;
      });

    if (hasAll && !hadAll) {
      // "All" just checked — select all 12 months and keep "All" checked
      formMethods.setValue("businessMonth", [ALL_VALUE, ...allMonthValues]);
    } else if (!hasAll && hadAll) {
      // "All" just unchecked — clear everything
      formMethods.setValue("businessMonth", []);
    } else if (hasAll && hadAll) {
      // "All" still present, but a month may have been deselected
      const realSelected = stripAll(current);
      const missingAny = allMonthValues.some((v) => !realSelected.includes(v));
      if (missingAny) {
        // Not all months present — uncheck "All", keep remaining months
        prevBusinessMonthHadAll.current = false;
        formMethods.setValue("businessMonth", realSelected);
      }
    }
    // Individual toggle with no "All" involved — do nothing, let MUI handle it
  }, [selectedValues?.businessMonth, isBusinessMonthMode, formMethods]);

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);

  const breadcrumbState = useMemo(() => {
    const live =
      (formMethods?.getValues?.() as Record<string, any>) ?? selectedValues;
    const filters = Object.keys(live ?? {}).length
      ? live
      : location.state?.filters;
    return { ...(filters && { filters }) };
  }, [selectedValues, location.state?.filters, formMethods]);

  const bizDoneCrumb = {
    label: BIZ_DONE_REPORT,
    path: "/biz-done-report",
    key: BREADCRUMB_KEYS.BIZ_DONE_REPORT,
    state: breadcrumbState,
  };

  useBreadcrumbTrail(bizDoneCrumb);

  const bizDoneReportBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [createBreadcrumbEntry(bizDoneCrumb)];

  const onCellClicked = (event: CellClickedEvent) => {
    const currentFilters =
      (formMethods?.getValues?.() as Record<string, any>) ?? selectedValues;
    if (event.colDef.field === "customerName" && event.data?.custId) {
      const destinationConfig = {
        label: event.data?.companyName ?? event.data?.customerName,
        path: `/companies/${event.data?.custId}`,
        key: DETAILS_KEYS.COMPANY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: bizDoneReportBreadcrumb,
        crumb: destinationConfig,

        state: {
          from: "bizDoneReport",
          filters: currentFilters ? currentFilters : null,
        },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/companies/${event.data?.custId}`, {
      //   state: {
      //     from: "bizDoneReport",
      //     filters: selectedValues ? selectedValues : null,
      //   },
      // });
    } else if (event.colDef.field === "iirmPolNo") {
      const destinationConfig = {
        label: DETAILS_LABELS.POLICY,
        path: `/policies/${event.data?.iirmPolNo}`,
        key: DETAILS_KEYS.POLICY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: bizDoneReportBreadcrumb,
        crumb: destinationConfig,

        state: {
          from: "bizDoneReport",
          filters: currentFilters ? currentFilters : null,
        },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
    } else if (event.colDef.field === "opportunityId" && event.data?.opportunityId) {
      const destinationConfig = {
        label: `Opportunity ${event.data.opportunityId}`,
        path: `/opportunities/${event.data.opportunityId}`,
        key: DETAILS_KEYS.SALES_OPPORTUNITY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: bizDoneReportBreadcrumb,
        crumb: destinationConfig,
        state: {
          from: "bizDoneReport",
          filters: currentFilters ? currentFilters : null,
        },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
    }
  };

  const handleRun = () => {
    if (isBusinessMonthMode) {
      const derived = deriveBusinessMonthDateRange(
        selectedValues?.businessMonth,
        selectedValues?.financialYear
      );
      // Exclude UI-only fields (periodMode, businessMonth) from query params.
      // Use manually-edited from/to if present; fall back to derived range.
      const { periodMode: _pm, businessMonth: _bm, ...restValues } = selectedValues || {};
      const effectiveFrom = restValues.from || derived?.from;
      const effectiveTo = restValues.to || derived?.to;
      setSmartSearch({ ...restValues, from: effectiveFrom, to: effectiveTo, filterByBusinessDate: "true" });
      return;
    }

    // Income month mode — validate manual date range
    const toDate = selectedValues?.to;
    const fromDate = selectedValues?.from;

    const hasToDate = toDate && toDate !== null && toDate !== "" && toDate !== undefined;
    const hasFromDate = fromDate && fromDate !== null && fromDate !== "" && fromDate !== undefined;

    if ((hasToDate && !hasFromDate) || (hasFromDate && !hasToDate)) {
      dispatch(
        setToastMessage({
          message: "Please select from and to dates before running the search",
          severity: "error",
        })
      );
      return;
    }

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

    const { periodMode: _pm, businessMonth: _bm, ...restValues } = selectedValues || {};
    setSmartSearch(restValues);
  };

  const handleDownloadReport = React.useCallback(async (sheets: string[]) => {
    try {
      // Resolve effective filter values — in business month mode, inject derived from/to
      let effectiveValues = selectedValues ?? {};
      if (isBusinessMonthMode) {
        const derived = deriveBusinessMonthDateRange(
          selectedValues?.businessMonth,
          selectedValues?.financialYear
        );
        const effectiveFrom = selectedValues?.from || derived?.from;
        const effectiveTo = selectedValues?.to || derived?.to;
        if (effectiveFrom && effectiveTo) {
          effectiveValues = {
            ...effectiveValues,
            from: effectiveFrom,
            to: effectiveTo,
            filterByBusinessDate: "true",
          };
        }
      }

      // Check for period filter conflicts
      const fromDate = effectiveValues?.from;
      const toDate = effectiveValues?.to;
      const financialYear = effectiveValues?.financialYear;
      const month = effectiveValues?.month;
      const quarter = effectiveValues?.quarter;
      const hasPeriodFilters = !isBusinessMonthMode && (validateFilterValue(financialYear) || validateFilterValue(month) || validateFilterValue(quarter));
      const hasDateRange = validateFilterValue(fromDate) || validateFilterValue(toDate);

      // Build search string from all filters
      // If period filters exist, exclude from/to; if date range exists, exclude period filters
      const excludedKeys: string[] = ['periodMode', 'businessMonth'];
      if (hasPeriodFilters) {
        excludedKeys.push('from', 'to');
      } else if (hasDateRange && !isBusinessMonthMode) {
        excludedKeys.push('financialYear', 'month', 'quarter');
      }

      const search = effectiveValues && Object.keys(effectiveValues).length > 0
        ? Object.entries(effectiveValues)
        .map(([key, rawValue]) => {
          if (excludedKeys.includes(key)) {
              return null;
          }

          try {
            const value = Array.isArray(rawValue)
              // multiselect may hold {value,label} options — send the ids
              ? rawValue.map((v: any) => (v?.value ?? v)).join(",")
              : typeof rawValue === "object" && rawValue !== null
              ? (rawValue as any).value
              : rawValue;

                if (!validateFilterValue(value)) {
                  return null;
                }

            return `${key}:[${value}]`;
          } catch (error) {
            console.error("Error processing search parameter %s:", key, error);
            return null;
          }
        })
        .filter(Boolean) // Remove null values
        .join(",")
      : "";

      const sheetsParam = sheets && sheets.length ? sheets.join(",") : "policyDetails";
      const queryString = `entityType=policyDetails${
        search ? `&search=${search}` : ""
      }${customBrokeragePathParam}&sheets=${sheetsParam}`;

      // Applied Filters (with labels), assembled from the same form config the
      // smart-search UI renders, honouring the same excludedKeys as the query so
      // the export's Applied Filters sheet matches exactly what was exported.
      // The server writes these verbatim — no id→name resolution.
      const displayVal = (raw: any): string => {
        if (Array.isArray(raw))
          return raw
            .map((i) =>
              i && typeof i === "object" && "label" in i ? i.label : i
            )
            .filter(Boolean)
            .join(", ");
        if (raw && typeof raw === "object" && "label" in raw)
          return String((raw as any).label);
        return raw == null ? "" : String(raw);
      };
      // "Filter by" (periodMode) is dropped from the query — the backend infers
      // income vs business month from which date fields it receives — but it is
      // a real user choice, so the sheet must still record it. Everything else
      // excludedKeys drops (businessMonth, and whichever period keys lost the
      // from/to conflict) stays out, so the sheet can't claim a filter the
      // query never sent.
      const appliedFilterExcludedKeys = excludedKeys.filter(
        (key) => key !== "periodMode"
      );
      const appliedFilters: { filter: string; value: string }[] = [];
      (bizDoneReportConfig as any[]).forEach((field) => {
        const key = field?.key;
        if (!key || field?.type === "title" || appliedFilterExcludedKeys.includes(key)) return;
        // periodMode can be stored as a bare "incomeMonth" string by an older
        // saved view, so derive its label from the mode rather than displayVal.
        const value =
          key === "periodMode"
            ? isBusinessMonthMode
              ? "Business Month"
              : "Income Month"
            : displayVal(effectiveValues?.[key]);
        if (value && value.trim())
          appliedFilters.push({ filter: field?.label ?? key, value });
      });

      // Fire-and-forget: enqueue a background export and let the user keep
      // working. The Downloads tray polls for completion and surfaces the file
      // when it's ready — no blocking wait, and large reports can't 504.
      await enqueueExport({ queryString, label: "Biz Done Report", appliedFilters });
    } catch (error) {
      console.error("Export error:", error);
      dispatch(setToastMessage(EXPORT_TOAST.START_FAILED));
    }
  }, [dispatch, enqueueExport, selectedValues, customBrokeragePathParam, isBusinessMonthMode]);

  const kpis = useMemo(
    () => bizDownReportData(overallData?.kpiDetails, totalRows),
    [overallData?.kpiDetails, totalRows]
  );

  useEffect(() => {
    if (formMethods && skipQuery) {
      const defValues = prefilledFilterValues || defaultValues;
      formMethods.reset(defValues);
      // Seed the period guards ONLY when the restored values carry explicit
      // dates — those (a saved view's, or a drill-down's) must survive the
      // reset's watch emission instead of being recomputed into the FY range.
      // With no dates restored there is nothing to protect, so the effects
      // below still derive from/to out of the restored month/quarter/FY.
      if (defValues?.from || defValues?.to) {
        prevIncomePeriodKey.current = incomePeriodKey(defValues);
        prevBusinessPeriodKey.current = businessPeriodKey(defValues);
      }

      const { periodMode: _pm, businessMonth: _bm, ...restToCommit } = defValues || {};
      const restoredIsBusinessMonthMode =
        defValues?.periodMode === "businessMonth" ||
        (defValues?.periodMode as any)?.value === "businessMonth";
      if (restoredIsBusinessMonthMode) {
        const derived = deriveBusinessMonthDateRange(
          defValues?.businessMonth,
          defValues?.financialYear
        );
        setSmartSearch({
          ...restToCommit,
          from: restToCommit.from || derived?.from || "",
          to: restToCommit.to || derived?.to || "",
          filterByBusinessDate: "true",
        });
      } else {
        setSmartSearch(restToCommit);
      }
      setSkipQuery(false); // now allow queries to fire
    }
  }, [formMethods, skipQuery]);

  useEffect(() => {
    if (!isBusinessMonthMode || !formMethods) return;
    const key = businessPeriodKey(selectedValues);
    if (prevBusinessPeriodKey.current === key) return;
    prevBusinessPeriodKey.current = key;
    const derived = deriveBusinessMonthDateRange(
      selectedValues?.businessMonth,
      selectedValues?.financialYear
    );
    if (derived) {
      formMethods.setValue("from", derived.from);
      formMethods.setValue("to", derived.to);
    } else {
      formMethods.setValue("from", "");
      formMethods.setValue("to", "");
    }
  }, [selectedValues?.businessMonth, selectedValues?.financialYear, isBusinessMonthMode]);

  // Income month mode: auto-fill from/to when a specific month is selected
  useEffect(() => {
    if (isBusinessMonthMode || !formMethods) return;
    const key = incomePeriodKey(selectedValues);
    if (prevIncomePeriodKey.current === key) return;
    prevIncomePeriodKey.current = key;

    const monthVal = selectedValues?.month;
    const monthName = typeof monthVal === "object" ? (monthVal as any)?.value : monthVal;
    const allMonthDefs = getAllMonths();
    const pad = (n: number) => String(n).padStart(2, "0");

    const fyRaw = typeof selectedValues?.financialYear === "object"
      ? (selectedValues?.financialYear as any)?.value
      : selectedValues?.financialYear;
    let fyStart = new Date().getFullYear();
    let fyEnd = fyStart + 1;
    if (fyRaw) {
      const fyStr = String(fyRaw);
      if (fyStr.includes("-")) {
        const parts = fyStr.split("-").map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          fyStart = parts[0]; fyEnd = parts[1];
        }
      } else {
        const year = parseInt(fyStr, 10);
        if (!isNaN(year)) { fyStart = year; fyEnd = year + 1; }
      }
    }

    // No month selected — clear dates, do not auto-fill
    if (!monthName) {
      formMethods.setValue("from", "");
      formMethods.setValue("to", "");
      return;
    }

    if (monthName === ALL_VALUE) {
      // "All" months explicitly selected — derive range from quarter (if set) or full FY
      const quarterRaw = selectedValues?.quarter;
      const quarterVal = typeof quarterRaw === "object" && quarterRaw !== null
        ? (quarterRaw as any)?.value
        : quarterRaw;
      const isSpecificQuarter = ["Q1", "Q2", "Q3", "Q4"].includes(quarterVal);

      if (isSpecificQuarter) {
        const quarterMonths = getMonthsForQuarter(quarterVal as "Q1" | "Q2" | "Q3" | "Q4");
        const firstDef = allMonthDefs.find((m) => m.value === quarterMonths[0]?.value);
        const lastDef = allMonthDefs.find((m) => m.value === quarterMonths[quarterMonths.length - 1]?.value);
        if (firstDef?.month && lastDef?.month) {
          const fromYear = firstDef.month >= 4 ? fyStart : fyEnd;
          const toYear = lastDef.month >= 4 ? fyStart : fyEnd;
          const lastDay = new Date(toYear, lastDef.month, 0).getDate();
          formMethods.setValue("from", `${fromYear}-${pad(firstDef.month)}-01`);
          formMethods.setValue("to", `${toYear}-${pad(lastDef.month)}-${pad(lastDay)}`);
        }
      } else {
        // No specific quarter — full financial year (Apr → Mar)
        formMethods.setValue("from", `${fyStart}-04-01`);
        formMethods.setValue("to", `${fyEnd}-03-31`);
      }
      return;
    }

    // Specific month selected
    const monthDef = allMonthDefs.find((m) => m.value === monthName);
    if (!monthDef || !monthDef.month) return;

    const year = monthDef.month >= 4 ? fyStart : fyEnd;
    const lastDay = new Date(year, monthDef.month, 0).getDate();
    formMethods.setValue("from", `${year}-${pad(monthDef.month)}-01`);
    formMethods.setValue("to", `${year}-${pad(monthDef.month)}-${pad(lastDay)}`);
  }, [selectedValues?.month, selectedValues?.quarter, selectedValues?.financialYear, isBusinessMonthMode]);

  const { localizationData } = useLocalization();
  const columns = useMemo(
    () => getColumns(localizationData?.data),
    [localizationData?.data]
  );

  const filteredSmartSearchConfig = useMemo(() => {
    return businessPerformanceFilterConfig
      .filter(
        field => !['insurerId', 'quarter', 'month', 'from', 'to'].includes(field.key)
      )
      // Add a "Rewards" option to Income Type (Biz Done only). Rewards are
      // unioned into the main listing by the API (no separate table/KPIs).
      .map((field) =>
        field.key === 'incomeType'
          ? {
              ...field,
              options: [
                ...((field.options as any[]) ?? []),
                { value: 'rewards', label: 'Rewards' },
              ],
            }
          : field
      );
  }, []);

  const bizDoneReportConfig = useMemo(() => {
    const periodFields = isBusinessMonthMode
      ? [
          businessMonthField(),
          {
            ...fromDateField("From date (Applied on date of business)"),
            componentProps: {
              fullWidth: true,
              placeholder: "Select from date",
              ...(derivedBusinessMonthRange && {
                minDate: dayjs(derivedBusinessMonthRange.from),
                maxDate: dayjs(derivedBusinessMonthRange.to),
              }),
            },
          },
          {
            ...toDateField("To date (Applied on date of business)"),
            componentProps: {
              fullWidth: true,
              placeholder: "Select to date",
              ...(derivedBusinessMonthRange && {
                minDate: dayjs(derivedBusinessMonthRange.from),
                maxDate: dayjs(derivedBusinessMonthRange.to),
              }),
            },
          },
        ]
      : [
          {
            key: "quarter",
            name: "quarter",
            label: "Quarter",
            type: "select",
            gridColumn: 3.2,
            apiDependencies: {
              clearFieldsOnChange: ["month", "from", "to"],
              utilityFunction: () => [
                { value: "__ALL__", label: "All" },
                { value: "Q1", label: "Q1" },
                { value: "Q2", label: "Q2" },
                { value: "Q3", label: "Q3" },
                { value: "Q4", label: "Q4" },
              ],
            },
          },
          {
            key: "month",
            name: "month",
            label: "Month",
            type: "select",
            options: [],
            gridColumn: 3.2,
            apiDependencies: {
              utilityDependent: "quarter",
              utilityFunction: (data: any) => getMonthsForQuarterInSmarSearch(data),
              clearFieldsOnChange: ["from", "to"],
            },
          },
          fromDateField(),
          toDateField(),
        ];

    return [
      ...filteredSmartSearchConfig,
      periodModeToggleField(),
      ...periodFields,
      generateSectionTitleConfig("Insurer"),
      insurerField(location?.state?.fromBrokerageToCollect ? true : false),
      insurerBranchField(),
      branchViewByField(),
      generateSectionTitleConfig("Policy"),
      {
        key: "groupCompanyId",
        name: "groupCompanyId",
        label: "Group company",
        type: "selectFieldByApi",
        gridColumn: 3.2,
        apiDependencies: {
          endPoint: endPoints.parentCompaniesList,
          utilityFunction: (data: any) =>
            (data?.data?.data ?? []).map((c: any) => ({
              value: c.id,
              label: c.companyName,
            })),
        },
        placeholder: "Search group company",
      },
      {
        key: "companyName",
        name: "companyName",
        label: "Company name",
        type: "selectFieldByApi",
        gridColumn: 3.2,
        apiDependencies: {
          endPoint: endPoints.companiesListInSelectField,
          utilityFunction: (data: any) => companyUtilityFunctionFromContactPage(data),
        },
        placeholder: "Search company",
      },
      {
        key: "policyType",
        name: "policyType",
        label: "Policy type",
        type: "select",
        gridColumn: 3.2,
        apiDependencies: {
          endPoint: endPoints.lookUpByName("POLICY_TYPE"),
          isSmartSearch: true,
        },
        placeholder: "Select policy type",
      },
      {
        key: "brokerId",
        name: "brokerId",
        label: "Broker agent",
        type: "selectFieldByApi",
        gridColumn: 3.2,
        apiDependencies: {
          endPoint: endPoints.brokersList,
          utilityFunction: (data: any) =>
            (data?.data?.data ?? []).map((b: any) => ({
              value: b.id,
              label: b.displayName || b.brokerName,
            })),
        },
        placeholder: "Search broker agent",
      },
    ] as typeof businessPerformanceFilterConfig;
  }, [isBusinessMonthMode, derivedBusinessMonthRange, filteredSmartSearchConfig, location?.state?.fromBrokerageToCollect]);

  return (
    <Container>
      {/* Downloads tray is scoped to the Biz Done screen (fixed-position). */}
      <ReportExportsTray />
      <ReportSheetSelectMenu
        open={sheetModalOpen}
        onClose={() => setSheetModalOpen(false)}
        onGenerate={(sheets) => handleDownloadReport(sheets)}
      />
      {existingBreadcrumbs?.length > 1 ? (
        <CommonBreadcrumb />
      ) : (
        <TitleContainer variant="h1">{BIZ_DONE_REPORT}</TitleContainer>
      )}

      <CardBackground>
        <SmartSearch
          searchFormConfig={bizDoneReportConfig}
          searchDefaultValues={defaultValues}
          searchFormMethods={setFormMethods}
          selectedValues={selectedValues}
          onReset={() => {
            // Not useFormWatcher's handleReset — that resets to
            // searchDefaultValues, i.e. the saved view. setSearchTerm is a
            // no-op here, so bypassing the hook's helper loses nothing.
            const next = buildResetPayload();
            formMethods?.reset(next);
            prevBusinessMonthHadAll.current = false;
            setSmartSearch(next);
            dispatch(
              updateUserDefaultConfig({
                entityKey: TABLE_CONTROLLER_ENTITY_KEY.bizDoneReportEntity,
                selectedFilterValues: next,
                columns: storedColumns,
              }) as any // untyped useDispatch can't accept a thunk action
            );
            navigate(".", {
              replace: true,
              state: { breadcrumbs: getBreadcrumbsFromState(location.state) },
            });
          }}
          formMethods={formMethods}
          searchFieldName="BizDoneReport"
          placeholder={SEARCH}
          enableSmartSearch={true}
          onRunFilters={handleRun}
          disableSearch={true}
          hideSearch={true}
          runThePeriodFilterByDefault={false}
        />
      </CardBackground>

      <KPICards data={kpis} localization={localizationData?.data} />

      <Table
        columns={columns}
        rowData={rowData}
        totalRows={totalRows}
        currentPage={currentPage}
        title={LIST_OF_RECORDS}
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={onCellClicked}
        components={{ ChipRenderer }}
        primaryActionLabel={hasInFlight ? "Preparing report…" : "Generate Report"}
        onPrimaryActionClick={() => {
          if (hasInFlight) {
            dispatch(setToastMessage(EXPORT_TOAST.ALREADY_IN_PROGRESS));
            return;
          }
          setSheetModalOpen(true);
        }}
        primaryActionDisabled={hasInFlight}
        secondaryActionLabel={
          exportJobs.length
            ? `Downloads${unseenCount > 0 ? ` (${unseenCount})` : ""}`
            : undefined
        }
        onSecondaryActionClick={openPanel}
        secondaryActionRight
        primaryActionPermission={
          FeatureKey.DOWNLOAD_BUSINESS_PERFORMANCE_REPORT
        }
        secondaryActionPermission={
          FeatureKey.DOWNLOAD_BUSINESS_PERFORMANCE_REPORT
        }
        setSort={setSort}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.bizDoneReportEntity}
        selectedFilterValues={selectedValues}
      />
    </Container>
  );
};

export default BizDownReportListing;
