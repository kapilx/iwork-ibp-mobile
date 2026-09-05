import { CellClickedEvent } from "ag-grid-community";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  RENEWAL_OPPORTUNITIES,
  DETAILS_KEYS,
  DETAILS_LABELS,
} from "@ui/ui-lib";
import { getVisibleColumnsForExport } from "@ui/ui-lib/utils/reOrderColumnsOnDesiredConfig";
import ReportExportsTray from "../../../components/ReportExportsTray";
import {
  ADD_OPPORTUNITY_FORM_TITLES,
  BD_PLANNING,
  ISG_PLANNING,
  LIST_OF_RECORDS,
  EXPIRY_WINDOW_SUFFIX,
  MANAGE_RENEWAL_OPPORTUNITIES,
  OPPORTUNITY,
  RENEWAL_PLANNING,
  TABLE_CONTROLLER_ENTITY_KEY,
  UNAVAILABLE_ERROR_MESSAGE,
} from "../../../constants";
import { BREADCRUMB_KEYS } from "@ui/ui-lib";
import { TitleContainer } from "../../CompanyPage/CompanyListing/styles";
import { RenewalOpportunitiesListingContainer } from "./styles";
import {
  breadCrumbs,
  getColumns,
  opportunityData,
  tableSearchConfig,
} from "./tableConfig";
import { useDispatch, useSelector } from "react-redux";
import { InsurerSearchConfig } from "../../PolicyPage/Constants";
import { LookUpValues } from "../../../constants/lookupValues";
import {
  GeneratesmartSearchTitleConfig,
  periodConfig,
  smartSearchConfig,
} from "../../../Utils/smartSearchConfig";
import { BreadCrumbWrapper } from "../../OpportunitiesPage/OpportunitiesListing/styles";
import { normalizeOpportunityStateField } from "../../OpportunitiesPage/OpportunitiesListing/tableConfig";
import { usePastFinancialYearStatusDefault } from "../../../Utils/usePastFinancialYearStatusDefault";
import { useInsurerBranchViewBy } from "../../../Utils/useInsurerBranchViewBy";
import {
  hasStatusSelection,
  withActiveLostStatusDefault,
  withCurrentFinancialYearDefault,
} from "../../../Utils/smartSearchPrefill";

const RenewalOpportunityListing: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [skipQuery, setSkipQuery] = useState(true);
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [isConfigDisable, setIsConfigDisable] = useState(false);

  const dispatch = useDispatch();
  const userData = getSessionStorageData("user");
  const organisationId = userData?.organisationId ?? 1;

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
        TABLE_CONTROLLER_ENTITY_KEY.roEntity
      ]
  );
  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.roEntity
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
    () => ({
      ...withActiveLostStatusDefault(
        normalizeOpportunityStateField(defValues),
        hasStatusSelection(userSmartSearchDefaultValues)
      ),
      // branchViewBy is intentionally NOT seeded — useInsurerBranchViewBy below
      // selects "Branch" only once an insurer branch is picked, and clears it
      // when the branch (or the insurer above it) is removed.
    }),
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

  const canCreateOpportunity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.CREATE_OPPORTUNITY)(state)
  );
  const { canViewBD, canViewISG } = useActivityRoleVisibility();
  const canBulkEditOpportunities = useSelector((state: any) =>
    selectHasPermission(FeatureKey.BULK_EDIT_WRITE)(state)
  );

  const companyContactId = useLookupIdByKey(LookUpValues.COMPANY_CONTACT);

  // BD/ISG/Renewal Planning are synthetic stages with no opportunity_activity_map
  // row; the pending-activity and funnel paths can't resolve them. Route a
  // planning drilldown through the plain listing path (filters them by status).
  const drilldownActivityNames = location.state?.filters?.activityName;
  const isPlanningDrilldown =
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
    customPathParam: "type=RO" + customPath,
    enabled: !skipQuery,
    // Planning drilldowns reconcile with the dashboard count, which buckets by
    // opportunity created_at age; everything else uses expiry date.
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
    // Reset wipes to the system default (ignoring any saved view) + current-FY.
    searchDefaultValues: resetDefaultValues,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.roEntity,
    columnOrder,
    dispatch,
  });
  useInsurerBranchViewBy(formMethods, selectedValues?.insurerBranchId);
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

    if (location.state?.renewalScrollTarget) {
      state.renewalScrollTarget = location.state.renewalScrollTarget;
    }

    return Object.keys(state).length > 0 ? state : undefined;
  }, [
    filtersToPersist,
    location.state?.fromDashboard,
    location.state?.pendingActivities,
    location.state?.renewalScrollTarget,
  ]);

  useBreadcrumbTrail({
    label: MANAGE_RENEWAL_OPPORTUNITIES,
    path: "/renewal-opportunities",
    key: BREADCRUMB_KEYS.RENEWAL_OPPORTUNITY,
    state: breadcrumbState,
  });

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const roBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: MANAGE_RENEWAL_OPPORTUNITIES,
            path: "/renewal-opportunities",
            key: BREADCRUMB_KEYS.RENEWAL_OPPORTUNITY,
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

    if (event.colDef.field === "companyName") {
      const destinationConfig = {
        label: `${event.data.companyName}`,
        path: `/companies/${event.data.companyId}`,
        key: DETAILS_KEYS.COMPANY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: roBreadcrumb,
        crumb: destinationConfig,

        state: {
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
        label: ADD_OPPORTUNITY_FORM_TITLES.RO_DETAILS,
        path: `/opportunities/${event.data.opportunityId}`,
        key: DETAILS_KEYS.SALES_OPPORTUNITY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: roBreadcrumb,
        crumb: destinationConfig,

        state: {
          ...filtersState,
          companyId: event.data.companyId,
          opportunityId: event.data.opportunityId,
          sidebarLabel: location.state?.sidebarLabel,
        },
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });
    } else if (event.colDef.field === "opportunityId") {
      const rowData = event.data;

      if (rowData.opportunityId) {
        const destinationConfig = {
          label: DETAILS_LABELS.RENEWAL_OPPORTUNITY,
          path: `/opportunities/${rowData.opportunityId}`,
          key: DETAILS_KEYS.RENEWAL_OPPORTUNITY,
        };
        const destinationState = buildBreadcrumbState({
          breadcrumbs: roBreadcrumb,
          crumb: destinationConfig,

          state: {
            ...filtersState,
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
    // Follow-up drilldowns may carry an open-ended window (from only, no to);
    // allow from-only in that context. A to-only range stays invalid.
    const isPendingDrilldown = Boolean(location.state?.pendingActivities);
    if (
      (selectedValues?.from && !selectedValues?.to && !isPendingDrilldown) ||
      (selectedValues?.to && !selectedValues?.from)
    ) {
      dispatch(
        setToastMessage(
          "Please select from and to dates before running the search"
        )
      );
    } else {
      tableSelectionApiRef.current?.clearSelection?.();
      const sanitizedSelectedValues = sanitizeOpportunityFilters(selectedValues);
      setSmartSearch(sanitizedSelectedValues);
      console.log("organisationId in handleRun:", organisationId);
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
      setSmartSearch(defValues);
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
    activityName,
    ...otherFilters
  } = location.state?.filters || {};
  const dashboardFilters = { owner, userId, ...otherFilters };

  const smartsearchConfig = useMemo(
    () => [
      ...smartSearchConfig,
      GeneratesmartSearchTitleConfig("Period (RO expiry)"),
      ...periodConfig(
        isConfigDisable,
        selectedValues?.from,
        selectedValues?.to
      ),
      GeneratesmartSearchTitleConfig("RO"),
      ...tableSearchConfig(
        companyContactId,
        organisationId,
        isConfigDisable,
        canViewBD,
        canViewISG
      ),
      GeneratesmartSearchTitleConfig("Insurer"),
      ...InsurerSearchConfig(),
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

  const roReportExportsConfig = useMemo(
    () => ({
      reportType: EXPORT_REPORT_TYPE.RENEWAL_OPPORTUNITY_LIST,
      label: "Renewal Opportunity Report",
      endpoints: {
        enqueue: endPoints.roReportExcelExport,
        status: endPoints.roReportExcelExportStatus,
        list: endPoints.roReportExcelExports,
        download: endPoints.roReportExcelExportDownload,
      },
    }),
    []
  );
  const {
    enqueueExport: enqueueRoReportExport,
    hasInFlight: roReportInFlight,
    openPanel: openRoExportsPanel,
    jobs: roExportJobs,
    unseenCount: roExportUnseenCount,
  } = useReportExports(roReportExportsConfig);

  const handleGenerateRoReport = useCallback(async () => {
    try {
      const { orgId: _orgId, ...smartSearchEquivalent } =
        selectedFilterValuesAfterRun || {};
      let queryString = `type=RO${buildSmartSearchQueryString(
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

      await enqueueRoReportExport({
        queryString,
        label: "Renewal Opportunity Report",
        appliedFilters,
      });
    } catch (error) {
      dispatch(setToastMessage(EXPORT_TOAST.START_FAILED));
    }
  }, [
    enqueueRoReportExport,
    selectedFilterValuesAfterRun,
    smartsearchConfig,
    isPlanningDrilldown,
    columnOrder,
    dispatch,
  ]);

  return (
    <RenewalOpportunitiesListingContainer>
      <ReportExportsTray {...roReportExportsConfig} />
      {(location.state && location.state?.fromDashboard) ||
      existingBreadcrumbs?.length > 0 ? (
        <BreadCrumbWrapper>
          <CommonBreadcrumb crumbs={breadCrumbs(dashboardFilters)} />
        </BreadCrumbWrapper>
      ) : (
        <TitleContainer variant="h1">
          {MANAGE_RENEWAL_OPPORTUNITIES}
        </TitleContainer>
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
          onPrimaryActionClick: handleCreateOpportunity,
        })}
        tertiaryActionLabel={
          roReportInFlight ? "Preparing report…" : "Generate Report"
        }
        onTertiaryActionClick={() => {
          if (roReportInFlight) {
            dispatch(setToastMessage(EXPORT_TOAST.ALREADY_IN_PROGRESS));
            return;
          }
          handleGenerateRoReport();
        }}
        tertiaryActionDisabled={roReportInFlight}
        tertiaryActionPermission={FeatureKey.EXPORT_OPPORTUNITY}
        secondaryActionLabel={
          roExportJobs.length
            ? `Downloads${
                roExportUnseenCount > 0 ? ` (${roExportUnseenCount})` : ""
              }`
            : undefined
        }
        onSecondaryActionClick={openRoExportsPanel}
        secondaryActionRight
        secondaryActionPermission={FeatureKey.EXPORT_OPPORTUNITY}
        setSort={setSort}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.roEntity}
        selectedFilterValues={selectedValues}
        enableRowSelection={canBulkEditOpportunities}
        rowSelectionIdKey="opportunityId"
        onRowSelectionChange={({ selectedRowIds, isAllSelected }) => {
          setSelectedOpportunityIds(selectedRowIds);
          setIsAllOpportunitiesSelected(isAllSelected);
        }}
        selectedFilterValuesAfterRun={selectedFilterValuesAfterRun}
        refetch={refetch}
        selectionApiRef={tableSelectionApiRef}
        showLoader={false}
      ></Table>
    </RenewalOpportunitiesListingContainer>
  );
};

export default RenewalOpportunityListing;
