import { CellClickedEvent } from "ag-grid-community";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BD_PLANNING,
  CREATE_OPPORTUNITY,
  ISG_PLANNING,
  LIST_OF_RECORDS,
  EXPIRY_WINDOW_SUFFIX,
  MANAGE_OPPORTUNITIES,
  OPPORTUNITY,
  RENEWAL_PLANNING,
  TABLE_CONTROLLER_ENTITY_KEY,
  UNAVAILABLE_ERROR_MESSAGE,
} from "../../../constants";
import { TitleContainer } from "../../CompanyPage/CompanyListing/styles";
import { BreadCrumbWrapper, OpportunitiesListingContainer } from "./styles";
import {
  BREADCRUMB_KEYS,
  CONTACTS,
  DETAILS_KEYS,
  DETAILS_LABELS,
  OPPORTUNITIES,
} from "@ui/ui-lib";
import { getVisibleColumnsForExport } from "@ui/ui-lib/utils/reOrderColumnsOnDesiredConfig";
import {
  breadCrumbs,
  getColumns,
  normalizeOpportunityStateField,
  opportunityData,
  tableSearchConfig,
} from "./tableConfig";
import { useDispatch, useSelector } from "react-redux";
import { LookUpValues } from "../../../constants/lookupValues";
import {
  CardBackground,
  ChipRenderer,
  DateStatusDotRenderer,
  SmartSearch,
  SEARCH,
  endPoints,
  useFormWatcher,
  useTableController,
  buildSmartSearchQueryString,
  selectHasPermission,
  FeatureKey,
  useActivityRoleVisibility,
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
  useReportExports,
  EXPORT_REPORT_TYPE,
  EXPORT_TOAST,
} from "@ui/ui-lib";
import ReportExportsTray from "../../../components/ReportExportsTray";
import {
  GeneratesmartSearchTitleConfig,
  periodConfig,
  smartSearchConfig,
} from "../../../Utils/smartSearchConfig";
import { usePastFinancialYearStatusDefault } from "../../../Utils/usePastFinancialYearStatusDefault";
import {
  hasStatusSelection,
  withActiveLostStatusDefault,
  withCurrentFinancialYearDefault,
} from "../../../Utils/smartSearchPrefill";

const OpportunitiesListing: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userData = getSessionStorageData("user");
  const organisationId = userData?.organisationId ?? 1;
  const [isConfigDisable, setIsConfigDisable] = useState(false);
  const location = useLocation();
  const [selectedOpportunityIds, setSelectedOpportunityIds] = useState<
    Array<string | number>
  >([]);
  const [isAllOpportunitiesSelected, setIsAllOpportunitiesSelected] =
    useState(false);
  const [selectedFilterValuesAfterRun, setSelectedFilterValuesAfterRun] =
    useState<Record<string, any>>({});
  const tableSelectionApiRef = useRef<{ clearSelection: () => void } | null>(
    null
  );

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
        TABLE_CONTROLLER_ENTITY_KEY.soEntity
      ]
  );
  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.soEntity
      ]
  );

  // Default the Financial Year to the current FY when the resolved defaults
  // (saved view → server config) don't set one. Memoized for stable identity —
  // SmartSearch resets the form to searchDefaultValues whenever that prop
  // changes, so an unstable default would re-stamp FY every render.
  const defValues = useMemo(
    () =>
      withCurrentFinancialYearDefault(
        userSmartSearchDefaultValues || systemSmartSearchDefaultValues || {}
      ),
    [userSmartSearchDefaultValues, systemSmartSearchDefaultValues]
  );

  const defaultValues = useMemo(
    () =>
      withActiveLostStatusDefault(
        normalizeOpportunityStateField(defValues),
        hasStatusSelection(userSmartSearchDefaultValues)
      ),
    [defValues, userSmartSearchDefaultValues]
  );

  // Reset target: always the SYSTEM default (never a user saved view) + current
  // FY — preserves the original "Reset wipes to system default" behavior.
  // Also reapplies the Active+Lost status default when the system default
  // has no explicit status, so Reset shows the same status immediately that
  // a reload would otherwise apply on top of it.
  const resetDefaultValues = useMemo(
    () =>
      withActiveLostStatusDefault(
        withCurrentFinancialYearDefault(systemSmartSearchDefaultValues || {}),
        hasStatusSelection(systemSmartSearchDefaultValues)
      ),
    [systemSmartSearchDefaultValues]
  );

  const companyContactId = useLookupIdByKey(LookUpValues.COMPANY_CONTACT);

  const onReset = () => {
    handleReset();
    setIsConfigDisable(false);
  };

  const canCreateOpportunity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.CREATE_OPPORTUNITY)(state)
  );
  const { canViewBD, canViewISG } = useActivityRoleVisibility();
  const canBulkEditOpportunities = useSelector((state: any) =>
    selectHasPermission(FeatureKey.BULK_EDIT_WRITE)(state)
  );
  const [skipQuery, setSkipQuery] = useState(true);

  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  // BD/ISG Planning are synthetic stages with no opportunity_activity_map row, so
  // the pending-activity and funnel paths can't resolve them. Route a planning
  // drilldown through the plain listing path, which filters them by status.
  const drilldownActivityNames = location.state?.filters?.activityName;
  const isPlanningDrilldown =
    Array.isArray(drilldownActivityNames) &&
    drilldownActivityNames.some((name: string) =>
      [BD_PLANNING, ISG_PLANNING, RENEWAL_PLANNING].includes(name)
    );
  const customPath =
    location.state?.fromDashboard && !isPlanningDrilldown
      ? location.state?.pendingActivities
        ? "isPendingActivity=true"
        : "funnel=true"
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
    searchTerm,
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
    enabled: !skipQuery,
    // Planning drilldowns reconcile with the dashboard count, which buckets by
    // opportunity created_at age; everything else uses SO expiry date.
    defaultFieldName: isPlanningDrilldown ? "createdAt" : "expiryDate",
    customPathParam: customPath,
  });

  const { selectedValues, handleReset } = useFormWatcher({
    formMethods,
    setSearchTerm,
    searchFieldName: "companyName23",
    // Reset wipes to the system default (ignoring any saved view) + current-FY.
    searchDefaultValues: resetDefaultValues,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.soEntity,
    columnOrder,
    dispatch,
  });
  usePastFinancialYearStatusDefault(formMethods);

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const handleCreateOpportunity = () => {
    navigate("/create", {
      state: {
        pageTitle: OPPORTUNITY,
        cta: "createOpportunity",
        originPath: "/opportunities",
      },
    });
  };

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

    // Preserve the dashboard's "return to Sales Schedule by SBU" marker so it
    // survives this page re-registering its own breadcrumb.
    if (location.state?.salesScrollTarget) {
      state.salesScrollTarget = location.state.salesScrollTarget;
    }

    return Object.keys(state).length > 0 ? state : undefined;
  }, [
    filtersToPersist,
    location.state?.fromDashboard,
    location.state?.pendingActivities,
    location.state?.salesScrollTarget,
  ]);

  useBreadcrumbTrail({
    label: MANAGE_OPPORTUNITIES,
    path: "/opportunities",
    key: BREADCRUMB_KEYS.SALES_OPPORTUNITY,
    state: breadcrumbState, // 👈 include latest filters here
  });

  const onCellClicked = (event: CellClickedEvent) => {
    const filtersState =
      filtersToPersist && Object.keys(filtersToPersist).length > 0
        ? { filters: filtersToPersist }
        : {};

    const opportunitiesBreadCrumb =
      existingBreadcrumbs.length > 0
        ? existingBreadcrumbs
        : [
            createBreadcrumbEntry({
              label: MANAGE_OPPORTUNITIES,
              path: `/opportunities`,
              key: BREADCRUMB_KEYS.SALES_OPPORTUNITY,
              state: {
                ...filtersState,
                from: "SO",
                sidebarLabel: location.state?.sidebarLabel,
              },
            }),
          ];

    if (event.colDef.field === "companyName") {
      const destinationConfig = {
        label: `${event.data.companyName}`,
        path: `/companies/${event.data.companyId}`,
        key: DETAILS_KEYS.COMPANY,
      };

      const destinationState = buildBreadcrumbState({
        breadcrumbs: opportunitiesBreadCrumb,
        crumb: destinationConfig,
        state: {
          from: "SO",
          ...filtersState,
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
        label: DETAILS_LABELS.SALES_OPPORTUNITY,
        path: `/opportunities/${event.data.opportunityId}`,
        key: DETAILS_KEYS.SALES_OPPORTUNITY,
      };

      const destinationState = buildBreadcrumbState({
        breadcrumbs: opportunitiesBreadCrumb,
        crumb: destinationConfig,
        state: {
          companyId: event.data.companyId,
          opportunityId: event.data.opportunityId,
          from: "SO",
          sidebarLabel: location.state?.sidebarLabel,
          ...filtersState,
        },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
    } else if (event.colDef.field === "contacts") {
      const destinationConfig = {
        label: CONTACTS,
        path: `/contact/${event.data.contacts[0].id}`,
        key: DETAILS_KEYS.SALES_OPPORTUNITY,
      };

      const destinationState = buildBreadcrumbState({
        breadcrumbs: opportunitiesBreadCrumb,
        crumb: destinationConfig,
        state: {
          companyId: event.data.companyId,
          opportunityId: event.data.opportunityId,
          from: "SO",
          ...filtersState,
        },
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });
    } else if (event.colDef.field === "opportunityId") {
      const rowData = event.data;

      if (rowData.opportunityId) {
        const destinationConfig = {
          label: DETAILS_LABELS.SALES_OPPORTUNITY,
          path: `/opportunities/${rowData.opportunityId}`,
          key: DETAILS_KEYS.SALES_OPPORTUNITY,
        };
        const destinationState = buildBreadcrumbState({
          breadcrumbs: opportunitiesBreadCrumb,
          crumb: destinationConfig,

          state: {
            companyId: rowData.companyId,
            opportunityId: rowData.opportunityId,
            from: "SO",
            sidebarLabel: location.state?.sidebarLabel,
            ...filtersState,
          },
        });
        navigate(destinationConfig.path, {
          state: destinationState,
        });
      }
    }
  };

  const handleRun = () => {
    // Follow-up drilldowns may carry an open-ended window (from only, no to);
    // allow from-only in that context. A to-only range stays invalid.
    const isPendingDrilldown = Boolean(location.state?.pendingActivities);
    if (
      (selectedValues?.from && !selectedValues?.to && !isPendingDrilldown) ||
      (selectedValues?.to && !selectedValues?.from)
    ) {
      dispatch(
        setToastMessage(
          "Please select from and to dates before running the search."
        )
      );
    } else {
      tableSelectionApiRef.current?.clearSelection?.();
      const sanitizedSelectedValues = sanitizeOpportunityFilters({
        ...selectedValues,
        ...(defaultValues?.fromFunnel && {
          fromFunnel: defaultValues.fromFunnel,
        }),
      });
      setSmartSearch(sanitizedSelectedValues);
      setSelectedFilterValuesAfterRun({
        ...sanitizedSelectedValues,
        orgId: organisationId,
      });
    }
  };

  useEffect(() => {
    if (error && error.status === 504) {
      dispatch(setToastMessage(UNAVAILABLE_ERROR_MESSAGE));
    }
  }, [error]);

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
      console.log("Def Values on Effect:", defValues);
      formMethods.reset(defValues);
      setSmartSearch(defValues);
      setSelectedFilterValuesAfterRun({
        ...defValues,
        orgId: organisationId,
      });
      setSkipQuery(false);
    }
  }, [formMethods, skipQuery]);

  // Destructure filters from location.state and map keys as required
  const {
    viewBy: owner,
    ownerId: userId,
    activityName,
    ...otherFilters
  } = location.state?.filters || {};
  const dashboardFilters = { owner, userId, ...otherFilters };

  // Memoize to avoid new array each render causing downstream effects & resets
  const smartsearchConfig = useMemo(
    () => [
      ...smartSearchConfig,
      GeneratesmartSearchTitleConfig("Period (SO expiry)"),
      ...periodConfig(
        isConfigDisable,
        selectedValues?.from,
        selectedValues?.to
      ),
      GeneratesmartSearchTitleConfig("SO"),
      ...tableSearchConfig(
        companyContactId,
        organisationId,
        isConfigDisable,
        canViewBD,
        canViewISG
      ),
    ],
    [
      companyContactId,
      organisationId,
      isConfigDisable,
      selectedValues?.from,
      selectedValues?.to,
      canViewBD,
      canViewISG,
    ]
  );

  const soReportExportsConfig = useMemo(
    () => ({
      reportType: EXPORT_REPORT_TYPE.SALES_OPPORTUNITY_LIST,
      label: "Sales Opportunity Report",
      endpoints: {
        enqueue: endPoints.soReportExcelExport,
        status: endPoints.soReportExcelExportStatus,
        list: endPoints.soReportExcelExports,
        download: endPoints.soReportExcelExportDownload,
      },
    }),
    []
  );
  const {
    enqueueExport: enqueueSoReportExport,
    hasInFlight: soReportInFlight,
    openPanel: openSoExportsPanel,
    jobs: soExportJobs,
    unseenCount: soExportUnseenCount,
  } = useReportExports(soReportExportsConfig);

  const handleGenerateSoReport = useCallback(async () => {
    try {
      // Mirror exactly what the live listing currently sends (see
      // useTableController's getSearchQueryParam / buildSmartSearchQueryString)
      // so the export matches what's on screen — same filters minus the
      // `orgId` marker this page appends only for its own local bookkeeping.
      const { orgId: _orgId, ...smartSearchEquivalent } =
        selectedFilterValuesAfterRun || {};
      let queryString = `type=SO${buildSmartSearchQueryString(
        smartSearchEquivalent,
        {
          searchFieldName: "companyName23",
          defaultFieldName: isPlanningDrilldown ? "createdAt" : "expiryDate",
        }
      )}`;

      const visibleColumns = getVisibleColumnsForExport(columnOrder);
      if (visibleColumns.length) {
        queryString += `&columns=${encodeURIComponent(
          JSON.stringify(visibleColumns)
        )}`;
      }

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
      const appliedFilters: { filter: string; value: string }[] = [];
      (smartsearchConfig as any[]).forEach((field) => {
        const key = field?.key;
        if (!key || field?.type === "title") return;
        const value = displayVal(smartSearchEquivalent?.[key]);
        if (value && value.trim())
          appliedFilters.push({ filter: field?.label ?? key, value });
      });

      await enqueueSoReportExport({
        queryString,
        label: "Sales Opportunity Report",
        appliedFilters,
      });
    } catch (error) {
      dispatch(setToastMessage(EXPORT_TOAST.START_FAILED));
    }
  }, [
    enqueueSoReportExport,
    selectedFilterValuesAfterRun,
    smartsearchConfig,
    isPlanningDrilldown,
    columnOrder,
    dispatch,
  ]);

  return (
    <OpportunitiesListingContainer>
      <ReportExportsTray {...soReportExportsConfig} />
      {(location.state && location.state?.fromDashboard) ||
      existingBreadcrumbs.length > 0 ? (
        <BreadCrumbWrapper>
          <CommonBreadcrumb />
        </BreadCrumbWrapper>
      ) : (
        <TitleContainer variant="h1">{MANAGE_OPPORTUNITIES}</TitleContainer>
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

      <KPICards data={kpis} localization={localizationData?.data} />

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
          primaryActionLabel: CREATE_OPPORTUNITY,
          onPrimaryActionClick: handleCreateOpportunity,
        })}
        tertiaryActionLabel={
          soReportInFlight ? "Preparing report…" : "Generate Report"
        }
        onTertiaryActionClick={() => {
          if (soReportInFlight) {
            dispatch(setToastMessage(EXPORT_TOAST.ALREADY_IN_PROGRESS));
            return;
          }
          handleGenerateSoReport();
        }}
        tertiaryActionDisabled={soReportInFlight}
        tertiaryActionPermission={FeatureKey.EXPORT_OPPORTUNITY}
        secondaryActionLabel={
          soExportJobs.length
            ? `Downloads${
                soExportUnseenCount > 0 ? ` (${soExportUnseenCount})` : ""
              }`
            : undefined
        }
        onSecondaryActionClick={openSoExportsPanel}
        secondaryActionRight
        secondaryActionPermission={FeatureKey.EXPORT_OPPORTUNITY}
        setSort={setSort}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.soEntity}
        selectedFilterValues={selectedValues}
        enableRowSelection={canBulkEditOpportunities}
        rowSelectionIdKey="opportunityId"
        onRowSelectionChange={
          canBulkEditOpportunities
            ? ({ selectedRowIds, isAllSelected }) => {
                setSelectedOpportunityIds(selectedRowIds);
                setIsAllOpportunitiesSelected(isAllSelected);
              }
            : undefined
        }
        selectedFilterValuesAfterRun={selectedFilterValuesAfterRun}
        refetch={refetch}
        selectionApiRef={tableSelectionApiRef}
        showLoader={false}
      ></Table>
    </OpportunitiesListingContainer>
  );
};

export default OpportunitiesListing;
