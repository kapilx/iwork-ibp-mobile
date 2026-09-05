import { CellClickedEvent } from "ag-grid-community";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CardBackground,
  ChipRenderer,
  DateStatusDotRenderer,
  SmartSearch,
  SEARCH,
  endPoints,
  useFormWatcher,
  useTableController,
  useApiQuery,
  activityDataUtilityFunction,
  selectHasPermission,
  FeatureKey,
  useLocalization,
  useLookupIdByKey,
  getSessionStorageData,
  KPICards,
  Table,
  setToastMessage,
  CommonBreadcrumb,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  buildBreadcrumbState,
  useBreadcrumbTrail,
  DETAILS_KEYS,
  DETAILS_LABELS,
  BREADCRUMB_KEYS,
} from "@ui/ui-lib";
import {
  LIST_OF_RECORDS,
  EXPIRY_WINDOW_SUFFIX,
  MANAGE_QUOTES,
  OPPORTUNITY,
  OPPORTUNITY_TYPE_RO,
  TABLE_CONTROLLER_ENTITY_KEY,
  UNAVAILABLE_ERROR_MESSAGE,
  BD_PLANNING,
  ISG_PLANNING,
  RENEWAL_PLANNING,
} from "../../../constants";
import { TitleContainer } from "../../CompanyPage/CompanyListing/styles";
import { ManageQuotesListingContainer } from "./styles";
import {
  breadCrumbs,
  buildManageQuotesActivityOptions,
  expandManageQuotesFilters,
  getColumns,
  MANAGE_QUOTES_OPTY_TYPE_OPTIONS,
  opportunityData,
  resolveOptyTypeParam,
  tableSearchConfig,
} from "./tableConfig";
import { useDispatch, useSelector } from "react-redux";
import { LookUpValues } from "../../../constants/lookupValues";
import {
  GeneratesmartSearchTitleConfig,
  periodConfig,
  smartSearchConfig,
} from "../../../Utils/smartSearchConfig";
import { BreadCrumbWrapper } from "../../OpportunitiesPage/OpportunitiesListing/styles";
import { normalizeOpportunityStateField } from "../../OpportunitiesPage/OpportunitiesListing/tableConfig";
import { usePastFinancialYearStatusDefault } from "../../../Utils/usePastFinancialYearStatusDefault";
import {
  hasStatusSelection,
  withActiveLostStatusDefault,
} from "../../../Utils/smartSearchPrefill";

// Stable reference for "no persisted defaults" so defValues/defaultValues keep a
// constant identity across renders (a fresh {} each render loops SmartSearch's
// reset-on-defaults effect). Used until a server-side MANAGE_QUOTES config exists.
const EMPTY_DEFAULT_VALUES: Record<string, any> = {};

const ManageQuotesListing: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [skipQuery, setSkipQuery] = useState(true);
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [isConfigDisable, setIsConfigDisable] = useState(false);
  // Applied (on Run) Opty. Type narrowing — sent as the backend optyType query
  // param (single SO/RO; none/both => combined). Backs the hidden Opty. Type toggle.
  const [appliedOptyType, setAppliedOptyType] = useState<string | undefined>(
    undefined
  );

  const dispatch = useDispatch();
  const userData = getSessionStorageData("user");
  const organisationId = userData?.organisationId ?? 1;

  const [selectedFilterValuesAfterRun, setSelectedFilterValuesAfterRun] =
    useState<Record<string, any>>({});

  const funnelDefaultValues = useMemo(() => {
    if (location.state && location.state?.filters) {
      return { ...location.state.filters };
    }
  }, [location.state]);

  const sanitizeOpportunityFilters = (filters?: Record<string, any>) => {
    if (!filters) return filters;
    const { incomeType: _incomeType, ...rest } = filters;
    return rest;
  };

  useEffect(() => {
    if (location?.state?.fromDashboard) {
      setIsConfigDisable(true);
    }
  }, [location.state?.fromDashboard]);

  const systemSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.systemDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.manageQuotesEntity
      ]
  );
  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.manageQuotesEntity
      ]
  );

  // Mirrors the SO/RO pattern (defaults come from saved user/system config). The
  // MANAGE_QUOTES entity has no persisted config yet, so this falls back to a
  // STABLE empty object — a fresh {} each render would make defaultValues change
  // identity and loop SmartSearch's reset-on-defaults effect.
  const defValues =
    userSmartSearchDefaultValues ||
    systemSmartSearchDefaultValues ||
    EMPTY_DEFAULT_VALUES;

  const defaultValues = useMemo(
    () => ({
      ...withActiveLostStatusDefault(
        normalizeOpportunityStateField(defValues),
        hasStatusSelection(userSmartSearchDefaultValues)
      ),
      // Segmented controls only show a selection when their value is present
      // in defaultValues (SegmentedControl has no defaultValue prop of its
      // own) — keeps "All" selected by default.
      optyType: MANAGE_QUOTES_OPTY_TYPE_OPTIONS[0],
    }),
    [defValues, userSmartSearchDefaultValues]
  );

  // Reset must always return to the SYSTEM default, never the user's saved view.
  // defaultValues above prefers userSmartSearchDefaultValues (so the page OPENS on
  // the saved view), but Reset should ignore saved views — so derive a system-only
  // value, normalized (the Opty. status multiselect needs `state` as an array).
  const systemDefaultValues = useMemo(
    () => ({
      ...withActiveLostStatusDefault(
        normalizeOpportunityStateField(
          systemSmartSearchDefaultValues || EMPTY_DEFAULT_VALUES
        ),
        hasStatusSelection(systemSmartSearchDefaultValues)
      ),
      optyType: MANAGE_QUOTES_OPTY_TYPE_OPTIONS[0],
    }),
    [systemSmartSearchDefaultValues]
  );

  const canCreateOpportunity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.CREATE_OPPORTUNITY)(state)
  );

  const companyContactId = useLookupIdByKey(LookUpValues.COMPANY_CONTACT);

  // Opty. Activity LOV is the unique SO + RO union, assembled on the frontend
  // (spec §5.4). Fetch both activity lists and merge to generic labels; the
  // value->name map expands selections back to underlying names at send time.
  // isgOnly forces the activity LOV to ISG activities only (Manage Quotes is an
  // ISG-only screen). renewalActivityList already carries ?type=RO, so append
  // with &; activityList has no query string, so append with ?.
  const { data: soActivityResponse } = useApiQuery({
    url: `${endPoints.activityList}?isgOnly=true`,
    queryKey: ["manageQuotesActivities", "SO"],
  });
  const { data: roActivityResponse } = useApiQuery({
    url: `${endPoints.renewalActivityList}&isgOnly=true`,
    queryKey: ["manageQuotesActivities", "RO"],
  });

  const { activityOptions, activityValueToNames } = useMemo(() => {
    const { options, valueToActivityNames } = buildManageQuotesActivityOptions(
      activityDataUtilityFunction(soActivityResponse),
      activityDataUtilityFunction(roActivityResponse)
    );
    return {
      activityOptions: options,
      activityValueToNames: valueToActivityNames,
    };
  }, [soActivityResponse, roActivityResponse]);

  // Planning-row drilldowns (BD/ISG/Renewal Planning) must NOT go down the
  // pending-activity or funnel path — those require a planned, uncompleted
  // activity_map row, which planning-STATUS opportunities do not have, so the
  // list would come back empty and mismatch the dashboard count. Sending a
  // plain listing lets the backend's planningClause (status = ISG/BD Planning)
  // run, matching the "Follow up by SO Activity" planning count. Mirrors
  // OpportunitiesListing / RenewalOpportunityListing.
  const drilldownActivityNames = location.state?.filters?.activityName;
  // Exception: the Placement funnel's ISG Planning head bar carries its name
  // purely so the filter panel shows it. That drill is still a funnel drill
  // (everything past the ISG gate), so it keeps the funnel path — the backend
  // drops the non-stage activityName from the funnel search itself.
  const isFunnelHeadStage = location.state?.funnelHeadStage === true;
  const isPlanningDrilldown =
    !isFunnelHeadStage &&
    Array.isArray(drilldownActivityNames) &&
    drilldownActivityNames.some((name: string) =>
      [BD_PLANNING, ISG_PLANNING, RENEWAL_PLANNING].includes(name)
    );
  const customPath =
    location.state?.fromDashboard === true && !isPlanningDrilldown
      ? location.state?.pendingActivities === true
        ? `&isPendingActivity=${true}`
        : `&funnel=${true}`
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
    setSearchTerm,
    overallData,
    setSort,
    setSmartSearch,
    error,
    setColumnOrder,
    columnOrder,
    refetch,
  } = useTableController({
    endpoint: endPoints.allOpurtunities,
    searchFieldName: "companyName23",
    customPathParam: `type=ALL${customPath}${
      appliedOptyType ? `&optyType=${appliedOptyType}` : ""
    }`,
    enabled: !skipQuery,
    // Planning drilldowns filter by opportunity createdAt (the dashboard planning
    // count's date axis); real/other views keep expiryDate. Mirrors
    // RenewalOpportunityListing so the drilldown list matches the count.
    defaultFieldName: isPlanningDrilldown ? "createdAt" : "expiryDate",
  });

  useEffect(() => {
    if (error && error.status === 504) {
      dispatch(setToastMessage(UNAVAILABLE_ERROR_MESSAGE));
    }
  }, [error]);
  const { selectedValues, handleReset } = useFormWatcher({
    formMethods,
    setSearchTerm,
    searchFieldName: "companyName23",
    // Reset to the SYSTEM default (normalized), not defaultValues — defaultValues
    // prefers the user's saved view, so resetting to it after a Save View would
    // restore the saved view instead of the system default. normalize keeps `state`
    // as an array (the Opty. status multiselect needs it) to avoid
    // "(value || []).includes is not a function".
    searchDefaultValues: systemDefaultValues,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.manageQuotesEntity,
    columnOrder,
    dispatch,
  });
  usePastFinancialYearStatusDefault(formMethods);
  const filtersToPersist = useMemo(() => {
    if (selectedValues && Object.keys(selectedValues).length > 0) {
      return selectedValues;
    }

    if (location.state?.filters) {
      return location.state.filters;
    }

    return undefined;
  }, [location.state?.filters, selectedValues]);

  const breadcrumbState = useMemo(() => {
    const state: Record<string, unknown> = {};

    if (filtersToPersist && Object.keys(filtersToPersist).length > 0) {
      state.filters = filtersToPersist;
    }

    if (location.state?.fromDashboard) {
      state.fromDashboard = location.state.fromDashboard;
    }

    if (location.state?.pendingActivities) {
      state.pendingActivities = location.state.pendingActivities;
    }

    if (location.state?.placementScrollTarget) {
      state.placementScrollTarget = location.state.placementScrollTarget;
    }

    // Carry the head-bar marker back with the crumb; without it, returning from
    // a detail page would re-read ISG Planning as a planning drilldown and show
    // a narrower list than the one the user left.
    if (location.state?.funnelHeadStage) {
      state.funnelHeadStage = location.state.funnelHeadStage;
    }

    // SO Schedule by SBU can route here too (routeToManageQuotes); preserve its
    // marker so returning lands on the Sales Schedule by SBU table.
    if (location.state?.salesScrollTarget) {
      state.salesScrollTarget = location.state.salesScrollTarget;
    }

    return Object.keys(state).length > 0 ? state : undefined;
  }, [
    filtersToPersist,
    location.state?.fromDashboard,
    location.state?.pendingActivities,
    location.state?.placementScrollTarget,
    location.state?.funnelHeadStage,
    location.state?.salesScrollTarget,
  ]);

  useBreadcrumbTrail({
    label: MANAGE_QUOTES,
    path: "/manage-quotes",
    key: BREADCRUMB_KEYS.MANAGE_QUOTES,
    state: breadcrumbState,
  });

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const manageQuotesBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: MANAGE_QUOTES,
            path: "/manage-quotes",
            key: BREADCRUMB_KEYS.MANAGE_QUOTES,
            state: {
              filters: selectedValues ? selectedValues : null,
              sidebarLabel: location.state?.sidebarLabel,
            },
          }),
        ];

  const onCellClicked = (event: CellClickedEvent) => {
    const filtersState =
      filtersToPersist && Object.keys(filtersToPersist).length > 0
        ? { filters: filtersToPersist }
        : {};

    // Both SO and RO open the same /opportunities/:id detail route; the row's
    // opportunityType only drives the breadcrumb label/key. The MANAGE_QUOTES
    // origin marker lets the detail page send "back" to /manage-quotes (§11.2b).
    const isRenewal = event.data?.opportunityType === OPPORTUNITY_TYPE_RO;
    const opportunityCrumbLabel = isRenewal
      ? DETAILS_LABELS.RENEWAL_OPPORTUNITY
      : DETAILS_LABELS.SALES_OPPORTUNITY;
    const opportunityCrumbKey = isRenewal
      ? DETAILS_KEYS.RENEWAL_OPPORTUNITY
      : DETAILS_KEYS.SALES_OPPORTUNITY;

    if (event.colDef.field === "companyName") {
      const destinationConfig = {
        label: `${event.data.companyName}`,
        path: `/companies/${event.data.companyId}`,
        key: DETAILS_KEYS.COMPANY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: manageQuotesBreadcrumb,
        crumb: destinationConfig,

        state: {
          ...filtersState,
          from: MANAGE_QUOTES,
        },
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });
    } else if (
      event.colDef.field === "policyType" ||
      event.colDef.field === "activityName"
    ) {
      const destinationConfig = {
        label: opportunityCrumbLabel,
        path: `/opportunities/${event.data.opportunityId}`,
        key: opportunityCrumbKey,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: manageQuotesBreadcrumb,
        crumb: destinationConfig,

        state: {
          ...filtersState,
          companyId: event.data.companyId,
          opportunityId: event.data.opportunityId,
          sidebarLabel: location.state?.sidebarLabel,
          from: MANAGE_QUOTES,
        },
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });
    } else if (event.colDef.field === "opportunityId") {
      const rowData = event.data;

      if (rowData.opportunityId) {
        const destinationConfig = {
          label: opportunityCrumbLabel,
          path: `/opportunities/${rowData.opportunityId}`,
          key: opportunityCrumbKey,
        };
        const destinationState = buildBreadcrumbState({
          breadcrumbs: manageQuotesBreadcrumb,
          crumb: destinationConfig,

          state: {
            ...filtersState,
            from: MANAGE_QUOTES,
          },
        });
        navigate(destinationConfig.path, {
          state: destinationState,
        });
      }
    }
  };

  const handleCreateOpportunity = () => {
    navigate("/create", {
      state: {
        pageTitle: OPPORTUNITY,
        cta: "createOpportunity",
        originPath: "/opportunities",
      },
    });
  };

  const handleRun = () => {
    if (
      (selectedValues?.from && !selectedValues?.to) ||
      (selectedValues?.to && !selectedValues?.from)
    ) {
      dispatch(
        setToastMessage(
          "Please select from and to dates before running the search"
        )
      );
    } else {
      const sanitizedSelectedValues = sanitizeOpportunityFilters(selectedValues);
      // optyType is sent as a top-level query param (see customPathParam), not via
      // &search=, so strip it from the smart-search payload.
      const { optyType: _optyType, ...searchValues } = expandManageQuotesFilters(
        sanitizedSelectedValues,
        activityValueToNames
      );
      setSmartSearch(searchValues);
      setAppliedOptyType(resolveOptyTypeParam(selectedValues?.optyType));
      setSelectedFilterValuesAfterRun({
        ...sanitizedSelectedValues,
        orgId: organisationId,
      });
    }
  };

  const kpis = opportunityData(overallData, totalRows);
  const { localizationData } = useLocalization();
  const columns = React.useMemo(
    () => getColumns(localizationData?.data),
    [localizationData]
  );

  useEffect(() => {
    if (formMethods && skipQuery) {
      const defValues = sanitizeOpportunityFilters(
        funnelDefaultValues || defaultValues
      );
      formMethods.reset(defValues);
      const { optyType: _optyType, ...searchValues } = expandManageQuotesFilters(
        defValues,
        activityValueToNames
      );
      setSmartSearch(searchValues);
      setAppliedOptyType(resolveOptyTypeParam(defValues?.optyType));
      setSelectedFilterValuesAfterRun({
        ...defValues,
        orgId: organisationId,
      });
      setSkipQuery(false);
    }
  }, [formMethods, skipQuery]);

  const onReset = () => {
    handleReset();
    setIsConfigDisable(false);
  };

  const {
    viewBy: owner,
    ownerId: userId,
    activityName: _activityName,
    ...otherFilters
  } = location.state?.filters || {};
  const dashboardFilters = { owner, userId, ...otherFilters };

  const smartsearchConfig = useMemo(
    () => [
      ...smartSearchConfig,
      GeneratesmartSearchTitleConfig("Period (Opty. Expiry)"),
      ...periodConfig(
        isConfigDisable,
        selectedValues?.from,
        selectedValues?.to
      ),
      GeneratesmartSearchTitleConfig("Opportunity"),
      ...tableSearchConfig(
        companyContactId,
        organisationId,
        isConfigDisable,
        activityOptions
      ),
    ],
    [
      companyContactId,
      organisationId,
      isConfigDisable,
      selectedValues?.from,
      selectedValues?.to,
      activityOptions,
    ]
  );

  return (
    <ManageQuotesListingContainer>
      {(location.state && location.state?.fromDashboard) ||
      existingBreadcrumbs?.length > 0 ? (
        <BreadCrumbWrapper>
          <CommonBreadcrumb crumbs={breadCrumbs(dashboardFilters)} />
        </BreadCrumbWrapper>
      ) : (
        <TitleContainer variant="h1">{MANAGE_QUOTES}</TitleContainer>
      )}

      <CardBackground>
        <SmartSearch
          searchFormConfig={smartsearchConfig}
          searchFormMethods={setFormMethods}
          selectedValues={selectedValues}
          searchDefaultValues={defaultValues}
          onReset={onReset}
          formMethods={formMethods}
          searchFieldName="companyName23"
          placeholder={SEARCH}
          enableSmartSearch={true}
          onRunFilters={handleRun}
        />
      </CardBackground>

      <KPICards data={kpis} />

      <Table
        columns={columns}
        rowData={rowData}
        totalRows={totalRows}
        currentPage={currentPage}
        title={LIST_OF_RECORDS}
        // titleSuffix={EXPIRY_WINDOW_SUFFIX}
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={onCellClicked}
        components={{ ChipRenderer, DateStatusDotRenderer }}
        {...(canCreateOpportunity && {
          onPrimaryActionClick: handleCreateOpportunity,
        })}
        setSort={setSort}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.manageQuotesEntity}
        selectedFilterValues={selectedValues}
        selectedFilterValuesAfterRun={selectedFilterValuesAfterRun}
        refetch={refetch}
        showLoader={false}
      ></Table>
    </ManageQuotesListingContainer>
  );
};

export default ManageQuotesListing;
