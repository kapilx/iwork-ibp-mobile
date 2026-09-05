import React, { useEffect, useMemo, useState } from "react";
import {
  BREADCRUMB_KEYS,
  buildBreadcrumbState,
  buildQueryString,
  CardBackground,
  CommonBreadcrumb,
  createBreadcrumbEntry,
  DETAILS_KEYS,
  DETAILS_LABELS,
  endPoints,
  getBreadcrumbsFromState,
  getSessionStorageData,
  PAGE_SIZE_OPTIONS,
  SEARCH,
  SmartSearch,
  Table,
  useApiQuery,
  useBreadcrumbTrail,
  useFormWatcher,
  useLocalization,
} from "@ui/ui-lib";
import {
  businessPerformanceBreadcrumbs,
  getColumns,
  conditionalTooltipFormatter,
  onCellClickFilterNavighationMap,
  onCellClickFilterNavighationMapForOpportunity,
} from "./config";
import { StyledTableWrapper } from "./styles";
import { CompanyListingContainer } from "../../CompanyPage/CompanyListing/styles";
import { useForm } from "react-hook-form";
import { BUSINESS_PERFORMANCE, ALL_VALUE } from "../../../constants";
import {
  bizDownDefaultValues,
  businessPerformanceFilterConfig,
} from "../../../components/BusinessPerformance/businessPerformanceConfig";
import { stripAllValues } from "../../../components/BusinessPerformance";
import { useLocation, useNavigate } from "react-router-dom";
import { CellChangedEvent } from "ag-grid-community";

const BusinessPerformance = () => {
  const { localizationData } = useLocalization();
  // Example: get localization from userData or other context if available
  const localization = localizationData?.data;

   // Filter out unnecessary filters from the config for this page
  const filteredSmartSearchConfig = useMemo(
    () => businessPerformanceFilterConfig.filter(field => {
      // const filtersToExclude = ["from", "to"];
      const filtersToExclude = ["incomeType"];
      return !filtersToExclude.includes(field.key);
    }),
    []
  );

  const tableColumns = React.useMemo(
    () =>
      getColumns(localization).map((col, colIndex) => ({
        ...col,
        maxWidth: 120,
        tooltipValueGetter: conditionalTooltipFormatter,
        disableSort: true,
        cellClass: (params) => {
          const rowIndex = params.node.rowIndex;
          if (colIndex === 0) {
            return "";
          }
          const cellValue = params.value;
          if (
            cellValue === "--" ||
            cellValue === null ||
            cellValue === undefined
          ) {
            return "right-aligned-cell";
          }

          if (
            rowIndex === 0 ||
            rowIndex === 1 ||
            rowIndex === 2 ||
            rowIndex === 4 ||
            rowIndex === 5
          ) {
            return "right-aligned-clickable-cell";
          }

          return "right-aligned-cell";
        },
      })),
    [localization]
  );

  const [skipQuery, setSkipQuery] = useState(true);
  const [smartSearch, setSmartSearch] = useState({});

  const userData = useMemo(() => getSessionStorageData("user"), []);

  const cleanedFilters = stripAllValues(smartSearch);
  const normalizedFilters = { ...cleanedFilters };
  const {
    incomeType: _incomeType,
    periodMode: _periodMode,
    businessMonth: _businessMonth,
    ...apiSafeFilters
  } = normalizedFilters;
  // Only send userId when it's a genuine explicit pick (someone other than
  // the logged-in user). The Owner field is pre-filled with the logged-in
  // user by default for display purposes, but always sending it as a query
  // param would make the backend treat it as an explicit selection and
  // permanently disable the leadership org-wide bypass — mirrors the
  // isExplicitOwnerPick pattern already used for the sales/renewal funnel
  // query in components/BusinessPerformance/index.tsx.
  const { userId: userIdFilterValue, ...filtersWithoutOwner } =
    apiSafeFilters as Record<string, any>;
  const selectedOwnerId = userIdFilterValue?.value ?? userIdFilterValue;
  const isExplicitOwnerPick =
    selectedOwnerId !== undefined &&
    selectedOwnerId !== null &&
    selectedOwnerId !== "" &&
    String(selectedOwnerId) !== String(userData?.userId ?? "");
  const apiFilters = isExplicitOwnerPick
    ? apiSafeFilters
    : filtersWithoutOwner;
  const queryString = buildQueryString(apiFilters);
  // useLiveData=true aggregates ACTUAL straight from policy/endorsement/reward
  // instead of the hourly performance_output ETL table -- same switch the
  // TargetVsActual widget uses, so this grid and the dashboard agree.
  const url = `${endPoints.brokerageSummary}${queryString}${
    queryString.startsWith("?") ? "&" : "?"
  }useLiveData=true`;

  const { data: bussinessPerformanceData, isLoading: isBusinessLoading } =
    useApiQuery({
      queryKey: ["brokerage-summary", url],
      url: url,
      enabled: !skipQuery,
    });

  const location = useLocation();
  const navigate = useNavigate();

  const defautValuesFromLocalState = useMemo(() => {
    console.log("location.state in biz performance:", location.state);
    if (location.state && location.state?.filters) {
      return { ...location.state.filters };
    }
  }, [location.state]);

  const currentFinancialYear = new Date().getFullYear().toString();
  const nextFinancialYear = (new Date().getFullYear() + 1).toString();

  const defaultValues = useMemo(
    () => ({
      ...bizDownDefaultValues,
      userId: {
        value: String(userData?.userId ?? ""),
        label: userData?.firstName
          ? userData.lastName && userData.lastName.trim() !== ""
            ? `${userData.firstName} ${userData.lastName}`
            : userData.firstName
          : "",
      },
      organisationId: {
        value: userData?.organisationId ?? "",
        label: userData?.organisationName ?? "",
      },
      financialYear: {
        value: currentFinancialYear,
        label: `${currentFinancialYear}-${nextFinancialYear}`,
      },
      quarter: { value: ALL_VALUE, label: "All" },
      month: { value: ALL_VALUE, label: "All" },
    }),
    [currentFinancialYear, nextFinancialYear, userData]
  );

  // SmartSearch resets the form to whatever `searchDefaultValues` it's given
  // on every mount/identity-change of that prop (see smartsearch_reset_race
  // memory) — seeding it with the plain page default would clobber a
  // specific owner/team carried over via navigation state (e.g. clicking
  // Total on the Dashboard after selecting a specific employee) back to the
  // logged-in user's own default. Seed it with the restored values instead,
  // same fix as applied on Biz Done listing.
  const smartSearchDefaultValues = useMemo(
    () => ({
      ...defaultValues,
      ...(defautValuesFromLocalState || {}),
    }),
    [defaultValues, defautValuesFromLocalState]
  );

  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();

  const { selectedValues, handleReset } = useFormWatcher({
    formMethods,
    setSearchTerm: () => {},
    searchDefaultValues: defaultValues,
  });

  const handleRun = () => {
    setSmartSearch(selectedValues);
  };

  useEffect(() => {
    if (formMethods && skipQuery) {
      formMethods.reset(smartSearchDefaultValues);
      setSmartSearch(smartSearchDefaultValues);
      setSkipQuery(false); // now allow queries to fire
    }
  }, [smartSearchDefaultValues, formMethods, skipQuery]);

  const fieldsArray = [
    // "label",
    "annual",
    "april",
    "may",
    "june",
    "q1",
    "july",
    "august",
    "september",
    "q2",
    "october",
    "november",
    "december",
    "q3",
    "january",
    "february",
    "march",
    "q4",
    "total",
  ];

  const filtersToPersist = useMemo(() => {
    if (selectedValues && Object.keys(selectedValues).length > 0) {
      return selectedValues;
    }

    if (location.state?.filters) {
      return location.state.filters;
    }

    return undefined;
  }, [location.state?.filters, selectedValues]);

  const filtersState =
    filtersToPersist && Object.keys(filtersToPersist).length > 0
      ? { filters: filtersToPersist }
      : {};

  useBreadcrumbTrail({
    label: BUSINESS_PERFORMANCE,
    path: "/business-performance",
    key: BREADCRUMB_KEYS.BUSINESS_PERFORMANCE,
    state: {
      ...filtersState,
    },
  });

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const roBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: BUSINESS_PERFORMANCE,
            path: "/business-performance",
            key: BREADCRUMB_KEYS.BUSINESS_PERFORMANCE,
            state: {
              ...filtersState,
            },
          }),
        ];

  const onCellClicked = (event: CellChangedEvent) => {
    if (
      event.value === "--" ||
      event.value === null ||
      event.value === undefined
    ) {
      return;
    }

    let businessPerformanceType = "";
    let destinationConfig: any = null;

    if (!fieldsArray.includes(event.colDef.field)) return;

    const rowIndex = event.node.rowIndex;
    // --- ROW 0,1,2
    if (rowIndex === 0 || rowIndex === 1 || rowIndex === 2) {
      if (rowIndex === 0) businessPerformanceType = "ACTUAL";
      if (rowIndex === 1) businessPerformanceType = "NEW_BIZ";
      if (rowIndex === 2) businessPerformanceType = "RENEWAL";

      destinationConfig = {
        label: DETAILS_LABELS.BIZ_DONE_REPORT,
        path: `/biz-done-report`,
        key: DETAILS_KEYS.BIZ_DONE_REPORT,
      };
    }

    // ---  FOR ROW 4 ---
    if (rowIndex === 4) {
      destinationConfig = {
        label: "Opportunities",
        path: `/opportunities`,
        key: "OPPORTUNITIES",
      };
    }

    // ---  FOR ROW 5 ---
    if (rowIndex === 5) {
      destinationConfig = {
        label: "Renewal Opportunities",
        path: `/renewal-opportunities`,
        key: "RENEWAL_OPPORTUNITIES",
      };
    }

    if (!destinationConfig) return;

    const monthFilter = onCellClickFilterNavighationMap[event.colDef.field];

    let finalFilters: any = {};

    // Row 0–2
    if (rowIndex === 0 || rowIndex === 1 || rowIndex === 2) {
      const filtersState =
        filtersToPersist && Object.keys(filtersToPersist).length > 0
          ? { filters: filtersToPersist }
          : {};

      finalFilters = {
        ...filtersState.filters,
        ...monthFilter,
      };
    }

    // Row 4 & 5
    if (rowIndex === 4 || rowIndex === 5) {
      // filtersState is `{}` when nothing is persisted, so read through a
      // default rather than off `.filters` directly.
      const persisted: Record<string, any> = filtersState.filters ?? {};

      // Picking From/To clears financialYear, so the range is the only period
      // the user actually chose — hand it to the map so it anchors the year and
      // forwards the range as-is on the Annual column.
      const fromToDate = onCellClickFilterNavighationMapForOpportunity(
        persisted.financialYear,
        event.colDef.field,
        { from: persisted.from, to: persisted.to }
      );

      // Only forward ownerId when it's a genuine explicit pick (someone other
      // than the logged-in user) — same reasoning as the table's own query:
      // the Owner field defaults to the logged-in user for display, and
      // forwarding it unconditionally makes the destination listing treat it
      // as an explicit selection, disabling its leadership org-wide bypass.
      const drilldownOwnerId =
        (persisted.userId as any)?.value ?? persisted.userId;
      const isExplicitOwnerPickForDrilldown =
        drilldownOwnerId !== undefined &&
        drilldownOwnerId !== null &&
        drilldownOwnerId !== "" &&
        String(drilldownOwnerId) !== String(userData?.userId ?? "");

      finalFilters = {
        organisationId: persisted.organisationId,
        ...(isExplicitOwnerPickForDrilldown
          ? { ownerId: persisted.userId }
          : {}),
        viewBy: persisted.owner,
        sbuId: persisted.sbuId,
        verticalId: persisted.verticalId,
        branchId: persisted.branchId,
        // financialYear: persisted.financialYear,
        // "BD Planning"/"Renewal Planning"/"ISG Planning" are no longer
        // selectable status options on the SO/RO listings — the listings
        // now expand a plain "Active" filter into the full live pipeline
        // (Open/Default/Work In Progress/BD Planning/ISG Planning) via
        // mapOpportunityState (libs/service-lib/.../helper.utils.ts:444-455).
        // Sending the retired labels explicitly no longer matches the
        // listing's own status field options, so just send "Active" and let
        // it expand the same way a manual "Active" pick does.
        state: ["Active"],
        // ...monthFilter,
        ...fromToDate,
      };
    }

    const destinationState = buildBreadcrumbState({
      breadcrumbs: roBreadcrumb,
      crumb: destinationConfig,
      state: {
        filters: finalFilters,
        businessPerformanceType,
      },
    });

    navigate(destinationConfig.path, {
      state: destinationState,
    });
  };

  return (
    <CompanyListingContainer>
      <CommonBreadcrumb
        crumbs={businessPerformanceBreadcrumbs(
          location.state?.filters ? location.state?.filters : null
        )}
      />
      {/* <TitleContainer variant="h1">{BUSINESS_PERFORMANCE}</TitleContainer> */}
      <CardBackground>
        <SmartSearch
          searchFormConfig={filteredSmartSearchConfig}
          searchDefaultValues={smartSearchDefaultValues}
          searchFormMethods={setFormMethods}
          selectedValues={selectedValues}
          onReset={handleReset}
          formMethods={formMethods}
          searchFieldName="bussinessPerformance"
          placeholder={SEARCH}
          enableSmartSearch={true}
          onRunFilters={handleRun}
          disableSearch={true}
          hideSearch={true}
          runThePeriodFilterByDefault={false}
        />
      </CardBackground>
      <StyledTableWrapper>
        <Table
          columns={tableColumns}
          rowData={bussinessPerformanceData?.data || []}
          totalRows={bussinessPerformanceData?.data?.length || 0}
          currentPage={1}
          setCurrentPage={() => {}}
          loading={isBusinessLoading}
          pageSize={10}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          setPageSize={() => {}}
          onCellClicked={onCellClicked}
          setSort={() => {}}
          height={550}
        />
      </StyledTableWrapper>
    </CompanyListingContainer>
  );
};

export default BusinessPerformance;
