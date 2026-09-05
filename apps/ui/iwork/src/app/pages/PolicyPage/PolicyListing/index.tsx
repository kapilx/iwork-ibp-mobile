import { CellClickedEvent } from "ag-grid-community";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CardBackground,
  SmartSearch,
  endPoints,
  useTableController,
  buildSmartSearchQueryString,
  useFormWatcher,
  Table,
  setToastMessage,
  Button,
  CommonBreadcrumb,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  buildBreadcrumbState,
  useBreadcrumbTrail,
  DETAILS_LABELS,
  DETAILS_KEYS,
  ChipRenderer,
  getSessionStorageData,
  selectHasPermission,
  FeatureKey,
  KPICards,
  useLocalization,
  useReportExports,
  EXPORT_REPORT_TYPE,
  EXPORT_TOAST,
} from "@ui/ui-lib";
import { getVisibleColumnsForExport } from "@ui/ui-lib/utils/reOrderColumnsOnDesiredConfig";
import ReportExportsTray from "../../../components/ReportExportsTray";
import {
  ACTIVATE_POLICY,
  MANAGE_POLICIES,
  MANAGE_POLICY,
  POLICY_ACTIVATED,
  POLICY_DETAILS,
  TABLE_CONTROLLER_ENTITY_KEY,
} from "../../../constants";
import { BREADCRUMB_KEYS } from "@ui/ui-lib";
import { TitleContainer } from "../../CompanyPage/CompanyListing/styles";
import {
  columns,
  PolicySearchConfig,
  InsurerSearchConfig,
  kpisData,
  POLICY_COLUMN_EXPORT_KEY_ALIASES,
  POLICY_COLUMN_EXPORT_EXCLUDED_FIELDS,
} from "../Constants/index";
import {
  PolicyListingContainer,
  HeaderWrapper,
  Container,
  Icons,
  FileIcon,
} from "./styles";
import {
  GeneratesmartSearchTitleConfig,
  periodConfig,
  smartSearchConfig,
} from "../../../Utils/smartSearchConfig";
import {
  ensureFromToFromFinancialYear,
  getSearchFilterValue,
} from "../../../Utils/smartSearchPrefill";
import { useInsurerBranchViewBy } from "../../../Utils/useInsurerBranchViewBy";
import { useDispatch, useSelector } from "react-redux";
import fileEdit from "../../../assets/svgs/file-pen-icon.svg";
import fileUpload from "../../../assets/svgs/file-upload-icon.svg";
import filePlus from "../../../assets/svgs/file-plus-icon.svg";
import {
  POLICY_EXPIRY_BEYOND_90_DRILLDOWN_DAYS,
  POLICY_EXPIRY_BEYOND_90_OFFSET_DAYS,
} from "../../../components/BusinessPerformance/tatDrilldownConfig";

interface PolicyData {
  policyId: string;
  companyId: string;
  opportunityId: string;
  opportunityType: string;
  policyStatus: string;
  policyName: string;
  companyName: string;
  accountManager: string;
  // Add other fields as needed
}

const PolicyListing: React.FC = () => {
  const formatDateOnly = (date: Date): string => date.toISOString().split("T")[0];
  const addDays = (date: Date, days: number): Date => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  };

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [skipQuery, setSkipQuery] = useState(true);
  const [isConfigDisable, setIsConfigDisable] = useState(false);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<
    Array<string | number>
  >([]);
  const [isAllPoliciesSelected, setIsAllPoliciesSelected] = useState(false);
  const [selectedFilterValuesAfterRun, setSelectedFilterValuesAfterRun] =
    useState<Record<string, any>>({});
  const tableSelectionApiRef = useRef<{ clearSelection: () => void } | null>(
    null
  );
  const userData = getSessionStorageData("user");
  const organisationId = userData?.organisationId ?? 1;
  const location = useLocation();

  useEffect(() => {
    if (location.state?.formDashboard) {
      setIsConfigDisable(true);
    }
  }, [location.state?.formDashboard]);

  const prefilledFilterValues = useMemo(() => {
    if (location.state && location.state?.filters) {
      return { ...location.state.filters };
    }

    const params = new URLSearchParams(location.search);
    const from = params.get("from");
    const to = params.get("to");
    const financialYear = params.get("financialYear");
    const policyExpiryFromDate = getSearchFilterValue(
      params.get("search"),
      "policyExpiryFromDate",
    );
    const policyExpiryToDate = getSearchFilterValue(
      params.get("search"),
      "policyExpiryToDate",
    );

    const hasAnyPrefill =
      Boolean(from) ||
      Boolean(to) ||
      Boolean(financialYear) ||
      Boolean(policyExpiryFromDate) ||
      Boolean(policyExpiryToDate);

    if (!hasAnyPrefill) return undefined;

    return {
      ...(financialYear ? { financialYear } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(policyExpiryFromDate ? { policyExpiryFromDate } : {}),
      ...(policyExpiryToDate ? { policyExpiryToDate } : {}),
    };
  }, [location.search, location.state]);

  const resolvedPrefilledFilterValues = useMemo(
    () => ensureFromToFromFinancialYear(prefilledFilterValues),
    [prefilledFilterValues],
  );

  const systemSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.systemDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.policyEntity
      ]
  );
  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.policyEntity
      ]
  );

  const defaultValues = useMemo(
    () => ({
      ...(userSmartSearchDefaultValues || systemSmartSearchDefaultValues || {}),
    }),
    [userSmartSearchDefaultValues, systemSmartSearchDefaultValues]
  );

  const canBulkEditPolicies = useSelector((state: any) =>
    selectHasPermission(FeatureKey.BULK_EDIT_WRITE)(state)
  );

  const {
    rowData,
    totalRows,
    currentPage,
    loading,
    setCurrentPage,
    pageSize,
    setPageSize,
    setSearchTerm,
    setSmartSearch,
    PAGE_SIZE_OPTIONS: PAGE_OPTIONS,
    setSort,
    setColumnOrder,
    columnOrder,
    refetch,
    overallData,
  } = useTableController({
    endpoint: endPoints.allPolicies,
    searchFieldName: "policyId",
    enabled: !skipQuery,
    defaultFieldName: "policyFrom",
  });

  const { localizationData } = useLocalization();
  const localization = localizationData?.data;
  const kpis = kpisData(overallData?.kpiData || {}, localization);

  const { selectedValues, handleReset } = useFormWatcher({
    formMethods,
    setSearchTerm,
    searchFieldName: "policyId",
    searchDefaultValues:
      resolvedPrefilledFilterValues || systemSmartSearchDefaultValues,
    // Reset must persist the true system default, not a drill-down link's
    // one-off resolvedPrefilledFilterValues, or a contextual visit would
    // overwrite the user's saved Policy preference for every future normal visit.
    persistDefaultValues: systemSmartSearchDefaultValues,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.policyEntity,
    columnOrder,
    dispatch,
  });
  useInsurerBranchViewBy(formMethods, selectedValues?.insurerBranchId);

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

    if (location.state?.formDashboard) {
      state.formDashboard = location.state.formDashboard;
    }

    return Object.keys(state).length > 0 ? state : undefined;
  }, [filtersToPersist, location.state?.formDashboard]);

  useBreadcrumbTrail({
    label: MANAGE_POLICIES,
    path: "/policies",
    key: BREADCRUMB_KEYS.POLICY,
    state: breadcrumbState,
  });
  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const policyBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: MANAGE_POLICIES,
            path: "/policies",
            key: BREADCRUMB_KEYS.POLICY,
            state: {
              ...(filtersToPersist && Object.keys(filtersToPersist).length > 0
                ? { filters: filtersToPersist }
                : {}),
              fromPolicyListing: true,
            },
          }),
        ];

  const onCellClicked = (event: CellClickedEvent) => {
    const filtersState =
      filtersToPersist && Object.keys(filtersToPersist).length > 0
        ? { filters: filtersToPersist }
        : {};
    if (
      (event.colDef.field === "insurerPolicyNumber" ||
        event.colDef.field === "policyType" ||
        event.colDef.field === "policyId") &&
      event.data
    ) {
      const rowData = event.data as PolicyData;
      const destinationConfig = {
        label: DETAILS_LABELS.POLICY,
        path: `/policies/${rowData.policyId}`,
        key: DETAILS_KEYS.POLICY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: policyBreadcrumb,
        crumb: destinationConfig,

        state: {
          policyId: rowData.policyId,
          companyId: rowData.companyId,
          policyStatus: rowData.policyStatus,
          policyName: rowData.policyName,
          companyName: rowData.companyName,
          accountManager: rowData.accountManager,
          policyDetails: {
            label: rowData.policyName,
          },

          ...filtersState,
        },
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });

      // navigate(`/policies/${rowData.policyId}`, {
      //   state: {
      //     policyId: rowData.policyId,
      //     companyId: rowData.companyId,
      //     policyStatus: rowData.policyStatus,
      //     policyName: rowData.policyName,
      //     companyName: rowData.companyName,
      //     accountManager: rowData.accountManager,
      //     policyDetails: {
      //       label: rowData.policyName,
      //     },
      //     from: "policyListing",
      //     filters: selectedValues ? selectedValues : null,
      //   },
      // });
    } else if (event.colDef.field === "companyName" && event.data) {
      const rowData = event.data as PolicyData;

      const destinationConfig = {
        label: rowData.companyName,
        path: `/companies/${rowData.companyId}`,
        key: DETAILS_KEYS.COMPANY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: policyBreadcrumb,
        crumb: destinationConfig,

        state: {
          companyId: rowData.companyId,
          companyName: rowData.companyName,
          ...filtersState,
        },
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });

      // navigate(`/companies/${rowData.companyId}`, {
      //   state: {
      //     companyId: rowData.companyId,
      //     companyName: rowData.companyName,
      //     from: "policyListing",
      //     filters: selectedValues ? selectedValues : null,
      //   },
      // });
    } else if (event.colDef.field === "contacts" && event.data) {
      const rowData = event.data as PolicyData;

      const destinationConfig = {
        label: DETAILS_LABELS.POLICY,
        path: `/policies/${rowData.policyId}`,
        key: DETAILS_KEYS.POLICY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: policyBreadcrumb,
        crumb: destinationConfig,

        state: {
          companyId: rowData.companyId,
          policyName: rowData.policyName,
          companyName: rowData.companyName,
          activeTab: "CardGrid",
          ...filtersState,
        },
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });

      // navigate(`/policies/${rowData.policyId}`, {
      //   state: {
      //     companyId: rowData.companyId,
      //     policyName: rowData.policyName,
      //     companyName: rowData.companyName,
      //     from: "policyListing",
      //     activeTab: "CardGrid",
      //   },
      // });
    } else if (event.colDef.field === "opportunityId" && event.data) {
      const rowData = event.data as PolicyData;

      if (rowData.opportunityId) {
        const opportunityType = rowData.opportunityType + " details";
        const detailsKey = rowData.opportunityType.toLowerCase() + "-details";

        const destinationConfig = {
          label: opportunityType,
          path: `/opportunities/${rowData.opportunityId}`,
          key: detailsKey,
        };
        const destinationState = buildBreadcrumbState({
          breadcrumbs: policyBreadcrumb,
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
      tableSelectionApiRef.current?.clearSelection?.();
      setSmartSearch(selectedValues);
      setSelectedFilterValuesAfterRun({
        ...selectedValues,
        orgId: organisationId,
      });
    }
  };

  useEffect(() => {
    if (formMethods && skipQuery) {
      const defValues = resolvedPrefilledFilterValues || defaultValues;
      let initialValues: Record<string, any> = {
        ...defValues,
      };

      // If neither date is set, default to today and 30 days from now
      if (!defValues.policyExpiryFromDate && !defValues.policyExpiryToDate) {
        const today = new Date();
        let toDate = new Date();
        let updatedDefValues = null;
        // Use days from location.state if available, else default to 30
        const days = location.state?.days || 0;
        if (days > 0) {
          if (days !== POLICY_EXPIRY_BEYOND_90_DRILLDOWN_DAYS) {
            toDate.setDate(today.getDate() + days);
          }

          const fromDate =
            days === POLICY_EXPIRY_BEYOND_90_DRILLDOWN_DAYS
              ? formatDateOnly(addDays(today, POLICY_EXPIRY_BEYOND_90_OFFSET_DAYS))
              : formatDateOnly(today);

          updatedDefValues = {
            ...defValues,
            policyExpiryFromDate: fromDate,
            policyExpiryToDate:
              days !== POLICY_EXPIRY_BEYOND_90_DRILLDOWN_DAYS
                ? formatDateOnly(toDate)
                : null,
            from: null,
            to: null,
            financialYear: null,
          };
        }
        initialValues = updatedDefValues || defValues;
      }

      formMethods.reset(initialValues);
      setSmartSearch(initialValues);
      setSelectedFilterValuesAfterRun({
        ...initialValues,
        orgId: organisationId,
      });
      setSkipQuery(false); // now allow queries to fire
    }
  }, [formMethods, skipQuery, defaultValues, resolvedPrefilledFilterValues, location.state?.days, organisationId, setSmartSearch]);

  const smartsearchConfig = useMemo(
    () => [
      ...smartSearchConfig,
      GeneratesmartSearchTitleConfig("Period (Policy from)"),
      ...periodConfig(false, selectedValues?.from, selectedValues?.to),
      GeneratesmartSearchTitleConfig("Policy"),
      ...PolicySearchConfig(isConfigDisable),
      GeneratesmartSearchTitleConfig("Insurer"),
      ...InsurerSearchConfig(),
    ],
    [selectedValues?.from, selectedValues?.to, isConfigDisable]
  );
  const ActionButtonRenderer = (props: any) => {
    const handleUploadClaim = () => {
      const policyId = props?.data?.policyId;
      if (policyId) {
        // navigate(`/${policyId}/upload-claims`, {
        //   state: {
        //     policyId,
        //     from: "policyListing",
        //     ...(filtersToPersist && Object.keys(filtersToPersist).length > 0
        //       ? { filters: filtersToPersist }
        //       : {}),
        //   },
        // });
        navigate(`/policies/${props?.data?.policyId}`, {
          state: {
            policyId: props?.data?.policyId,
            from: "policyListing",
            ...(filtersToPersist && Object.keys(filtersToPersist).length > 0
              ? { filters: filtersToPersist }
              : {}),
          },
        });
      } else {
        dispatch(setToastMessage("Unable to navigate: Policy ID not found"));
      }
    };
    // const handleCreateEndorsement = () => {
    //   const policyId = props?.data?.policyId;
    //   if (policyId) {
    //     navigate(`/${policyId}/upload-claims`);
    //   } else {
    //     dispatch(setToastMessage("Unable to navigate: Policy ID not found"));
    //   }
    // };
    // policyType is an object with lookUpValue per your column config
    const policyType = props?.data?.policyType?.lookUpValue ?? "";
    const isGroup = String(policyType).toLowerCase().includes("group");
    const policyStatus =
      props?.data?.policyStatus?.lookUpKey === "POLICY_STATUS_MIG_ACTIVE";
    return (
      <Container>
        <Button
          onClick={() => {
            navigate(`/policies/${props?.data?.policyId}`, {
              state: {
                policyId: props?.data?.policyId,
                from: "policyListing",
                ...(filtersToPersist && Object.keys(filtersToPersist).length > 0
                  ? { filters: filtersToPersist }
                  : {}),
              },
            });
          }}
          sizeType="small"
          variantType={policyStatus ? "secondary" : "primary"}
        >
          {policyStatus ? POLICY_ACTIVATED : ACTIVATE_POLICY}
        </Button>

        {/* Show icons only when policy is activated */}
        {props?.data?.policyStatus?.lookUpKey ===
          "POLICY_STATUS_MIG_ACTIVE" && (
          <Icons>
            {/* Endorsement icon */}
            <FileIcon
              src={fileEdit}
              alt="Create endorsement"
              title="Create endorsement"
              onClick={handleUploadClaim}
            />

            {/* Claims icon switches based on policyType */}
            {isGroup ? (
              <FileIcon
                src={fileUpload}
                alt="Upload claim"
                title="Upload claim"
                onClick={handleUploadClaim}
              />
            ) : (
              <FileIcon
                src={filePlus}
                alt="Create claim"
                title="Create claim"
                onClick={handleUploadClaim}
              />
            )}
          </Icons>
        )}
      </Container>
    );
  };

  const policyListReportExportsConfig = useMemo(
    () => ({
      reportType: EXPORT_REPORT_TYPE.POLICY_LIST,
      label: "Policy List Report",
      endpoints: {
        enqueue: endPoints.policyListReportExcelExport,
        status: endPoints.policyListReportExcelExportStatus,
        list: endPoints.policyListReportExcelExports,
        download: endPoints.policyListReportExcelExportDownload,
      },
    }),
    []
  );
  const {
    enqueueExport: enqueuePolicyListReportExport,
    hasInFlight: policyListReportInFlight,
    openPanel: openPolicyListExportsPanel,
    jobs: policyListExportJobs,
    unseenCount: policyListExportUnseenCount,
  } = useReportExports(policyListReportExportsConfig);

  const handleGeneratePolicyListReport = useCallback(async () => {
    try {
      const { orgId: _orgId, ...smartSearchEquivalent } =
        selectedFilterValuesAfterRun || {};
      let queryString = buildSmartSearchQueryString(smartSearchEquivalent, {
        searchFieldName: "policyId",
        defaultFieldName: "policyFrom",
      }).replace(/^&/, "");

      const visibleColumns = getVisibleColumnsForExport(columnOrder)
        .filter((c) => !POLICY_COLUMN_EXPORT_EXCLUDED_FIELDS.has(c.key))
        .map((c) => ({
          key: POLICY_COLUMN_EXPORT_KEY_ALIASES[c.key] ?? c.key,
          label: c.label,
        }));
      if (visibleColumns.length) {
        queryString += `${queryString ? "&" : ""}columns=${encodeURIComponent(
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

      await enqueuePolicyListReportExport({
        queryString,
        label: "Policy List Report",
        appliedFilters,
      });
    } catch (error) {
      dispatch(setToastMessage(EXPORT_TOAST.START_FAILED));
    }
  }, [
    enqueuePolicyListReportExport,
    selectedFilterValuesAfterRun,
    smartsearchConfig,
    columnOrder,
    dispatch,
  ]);

  const managePoliciesBreadcrumbs = [
    {
      label: "Dashboard",
      path: "/dashboard",
      state: {
        fromPolicyListing: true,
      },
    },
    {
      label: "Manage policy",
    },
  ];
  return (
    <PolicyListingContainer>
      <ReportExportsTray {...policyListReportExportsConfig} />
      {location?.state?.formDashboard === true ? (
        <CommonBreadcrumb crumbs={managePoliciesBreadcrumbs} />
      ) : (
        <TitleContainer variant="h1">{MANAGE_POLICY}</TitleContainer>
      )}

      <HeaderWrapper>
        <CardBackground>
          <SmartSearch
            searchFormConfig={smartsearchConfig}
            searchDefaultValues={
              resolvedPrefilledFilterValues || defaultValues
            }
            searchFormMethods={setFormMethods}
            selectedValues={selectedValues}
            onReset={handleReset}
            formMethods={formMethods}
            searchFieldName="policyId"
            placeholder="Search by Company name, Policy number, Policy ID"
            enableSmartSearch={true}
            onRunFilters={handleRun}
          />
        </CardBackground>
      </HeaderWrapper>
      <KPICards data={kpis} />
      <Table
        columns={columns}
        rowData={rowData}
        totalRows={totalRows}
        currentPage={currentPage}
        title="List of policies"
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={onCellClicked}
        components={{ ActionButton: ActionButtonRenderer, ChipRenderer }}
        tertiaryActionLabel={
          policyListReportInFlight ? "Preparing report…" : "Generate Report"
        }
        onTertiaryActionClick={() => {
          if (policyListReportInFlight) {
            dispatch(setToastMessage(EXPORT_TOAST.ALREADY_IN_PROGRESS));
            return;
          }
          handleGeneratePolicyListReport();
        }}
        tertiaryActionDisabled={policyListReportInFlight}
        tertiaryActionPermission={FeatureKey.EXPORT_POLICIES}
        secondaryActionLabel={
          policyListExportJobs.length
            ? `Downloads${
                policyListExportUnseenCount > 0
                  ? ` (${policyListExportUnseenCount})`
                  : ""
              }`
            : undefined
        }
        onSecondaryActionClick={openPolicyListExportsPanel}
        secondaryActionRight
        secondaryActionPermission={FeatureKey.EXPORT_POLICIES}
        setSort={setSort}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.policyEntity}
        selectedFilterValues={selectedValues}
        enableRowSelection={canBulkEditPolicies}
        rowSelectionIdKey="policyId"
        onRowSelectionChange={
          canBulkEditPolicies
            ? ({ selectedRowIds, isAllSelected }) => {
                setSelectedPolicyIds(selectedRowIds);
                setIsAllPoliciesSelected(isAllSelected);
              }
            : undefined
        }
        selectedFilterValuesAfterRun={selectedFilterValuesAfterRun}
        refetch={refetch}
        selectionApiRef={tableSelectionApiRef}
        showLoader={false}
      />
    </PolicyListingContainer>
  );
};

export default PolicyListing;
