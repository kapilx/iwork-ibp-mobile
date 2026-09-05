import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import {
  CellContainer,
  CompanyListingContainer,
  PremiumSpan,
  StyledCellPremium,
  TitleContainer,
} from "./styles";
import {
  SmartSearch,
  useTableController,
  endPoints,
  SEARCH,
  ChipRenderer,
  useFormWatcher,
  CardBackground,
  selectHasPermission,
  FeatureKey,
  useLocalization,
  KPICards,
  Table,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  buildBreadcrumbState,
  useBreadcrumbTrail,
  DETAILS_KEYS,
  Button,
  environment,
} from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import {
  CREATE_COMPANY,
  LIST_OF_COMPANIES,
  MANAGE_COMPANY,
  LIST_OF_RECORDS,
  COMPANY,
  TABLE_CONTROLLER_ENTITY_KEY,
} from "../../../constants";
import { BREADCRUMB_KEYS } from "@ui/ui-lib";
import { getColumns, kpisData, tableSearchConfig } from "./tableConfig";
import { CellClickedEvent } from "ag-grid-community";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  GeneratesmartSearchTitleConfig,
  periodConfig,
  smartSearchConfig,
} from "../../../Utils/smartSearchConfig";

export const soRoPremiumCell = (premium: string, countValue: string) => {
  return (
    <CellContainer>
      <PremiumSpan>{premium}</PremiumSpan>
      <StyledCellPremium>{countValue}</StyledCellPremium>
    </CellContainer>
  );
};
const currentUserId: number | null = (() => {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "{}")?.userId ?? null;
  } catch {
    return null;
  }
})();

const CompanyListing: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const systemSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.systemDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.companyEntity
      ],
  );
  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.companyEntity
      ],
  );

  const defaultValues =
    userSmartSearchDefaultValues || systemSmartSearchDefaultValues || {};

  const location = useLocation();
  const prefilledFilterValues = useMemo(() => {
    if (location.state && location.state?.filters) {
      return { ...location.state.filters };
    }
  }, [location.state]);

  const year = new Date().getFullYear();

  const canCreateCompany = useSelector((state: any) =>
    selectHasPermission(FeatureKey.CREATE_COMPANY)(state),
  );
  const canBulkEditCompanies = useSelector((state: any) =>
    selectHasPermission(FeatureKey.BULK_EDIT_WRITE)(state),
  );

  const { localizationData } = useLocalization();
  const handleHrPortalRedirect = useCallback(
    async (companyId: number) => {
      if (!currentUserId) return;
      try {
        const res = await apiRequest(endPoints.crmRedirectToken, {
          method: "POST",
          data: { userId: currentUserId, companyId },
        });
        const token = res?.data?.accessToken;
        const portalBase = (
          res?.data?.portalUrl || environment.ibpAppUrl
        ).replace(/\/$/, "");
        if (token) {
          window.open(
            `${portalBase}/hr-portal/portfolio?token=${encodeURIComponent(
              token,
            )}&companyId=${companyId}`,
            "_blank",
          );
        }
      } catch {
        // silently fail — button should not break the listing
      }
    },
    [currentUserId],
  );
  const columns = React.useMemo(
    () =>
      getColumns(localizationData?.data, currentUserId, handleHrPortalRedirect),
    [localizationData, handleHrPortalRedirect],
  );
  const initialTotalRowsRef = React.useRef<number | null>(null);

  const handleCreateCompany = () => {
    navigate("/create", {
      state: {
        pageTitle: COMPANY,
        cta: "createCompany",
        originPath: "/companies",
      },
    });
  };

  const [skipQuery, setSkipQuery] = useState(true);

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
    setColumnOrder,
    columnOrder,
    refetch,
  } = useTableController({
    endpoint: endPoints.allCompanies,
    searchFieldName: "companyName1",
    enabled: !skipQuery,
    defaultFieldName: "createdAt",
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.companyEntity,
  });

  useEffect(() => {
    if (initialTotalRowsRef.current === null && totalRows > 0) {
      initialTotalRowsRef.current = totalRows;
    }
  }, [totalRows]);

  // Use the initial count for KPIs, fallback to current totalRows if not set
  const initialTotalRows = initialTotalRowsRef.current ?? totalRows;
  const localization = localizationData?.data;
  const kpis = kpisData(overallData, initialTotalRows, localization);

  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<
    Array<string | number>
  >([]);
  const [selectedFilterValuesAfterRun, setSelectedFilterValuesAfterRun] =
    useState<Record<string, any>>({});
  const [isAllCompaniesSelected, setIsAllCompaniesSelected] = useState(false);
  const tableSelectionApiRef = useRef<{ clearSelection: () => void } | null>(
    null,
  );

  const { selectedValues, handleReset } = useFormWatcher({
    formMethods,
    setSearchTerm,
    searchFieldName: "companyName1",
    searchDefaultValues: systemSmartSearchDefaultValues,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.companyEntity,
    columnOrder,
    dispatch,
  });

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

    return Object.keys(state).length > 0 ? state : undefined;
  }, [filtersToPersist]);

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const companyBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: MANAGE_COMPANY,
            path: "/companies",
            key: BREADCRUMB_KEYS.COMPANY,
            state: {
              filters: selectedValues ? selectedValues : null,
            },
          }),
        ];

  useBreadcrumbTrail({
    label: MANAGE_COMPANY,
    path: "/companies",
    state: breadcrumbState, // 👈 include latest filters here
  });

  const onCellClicked = (event: CellClickedEvent) => {
    const filtersState =
      filtersToPersist && Object.keys(filtersToPersist).length > 0
        ? { filters: filtersToPersist }
        : {};

    if (event.colDef.field === "displayName") {
      const destinationConfig = {
        label: event.data.companyName,
        path: `/companies/${event.data.companyId}`,
        key: DETAILS_KEYS.COMPANY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: companyBreadcrumb,
        crumb: destinationConfig,

        state: {
          ...filtersState,
        },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
      //  navigate(`/companies/${event.data.companyId}`, {
      //   state: {
      //     filters: selectedValues ? selectedValues : null,
      //   },
      // });
    }
    if (event.colDef.field === "soPremium") {
      const destinationConfig = {
        label: event.data.companyName,
        path: `/companies/${event.data.companyId}`,
        key: DETAILS_KEYS.SALES_OPPORTUNITY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: companyBreadcrumb,
        crumb: destinationConfig,

        state: {
          activeTabKey: "salesOpportunities",
          ...filtersState,
        },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/companies/${event.data.companyId}`, {
      //   state: {
      //     activeTabKey: "salesOpportunities",
      //     filters: selectedValues ? selectedValues : null,
      //   },
      // });
    }
    if (event.colDef.field === "roPremium") {
      const destinationConfig = {
        label: event.data.companyName,
        path: `/companies/${event.data.companyId}`,
        key: DETAILS_KEYS.RENEWAL_OPPORTUNITY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: companyBreadcrumb,
        crumb: destinationConfig,

        state: {
          activeTabKey: "renewalOpportunities",
          ...filtersState,
        },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/companies/${event.data.companyId}`, {
      //   state: {
      //     activeTabKey: "renewalOpportunities",
      //     filters: selectedValues ? selectedValues : null,
      //   },
      // });
    }
  };

  const handleRun = () => {
    tableSelectionApiRef.current?.clearSelection?.();
    setSmartSearch(selectedValues);
    setSelectedFilterValuesAfterRun(selectedValues || {});
  };

  useEffect(() => {
    if (formMethods && skipQuery) {
      const defValues = prefilledFilterValues || defaultValues;
      formMethods.reset(defValues);
      setSmartSearch(defValues);
      setSelectedFilterValuesAfterRun(defValues);
      setSkipQuery(false); // now allow queries to fire
    }
  }, [formMethods, skipQuery]);

  const smartsearchConfig = useMemo(
    () => [
      ...smartSearchConfig,
      GeneratesmartSearchTitleConfig("Period (Company created)"),
      ...periodConfig(false, selectedValues?.from, selectedValues?.to),
      GeneratesmartSearchTitleConfig("Company"),
      ...tableSearchConfig,
    ],
    [selectedValues?.from, selectedValues?.to],
  );

  return (
    <CompanyListingContainer>
      <TitleContainer variant="h1">{MANAGE_COMPANY}</TitleContainer>

      <CardBackground>
        <SmartSearch
          searchFormConfig={smartsearchConfig}
          searchDefaultValues={defaultValues}
          searchFormMethods={setFormMethods}
          selectedValues={selectedValues}
          onReset={handleReset}
          formMethods={formMethods}
          searchFieldName="companyName1"
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
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={onCellClicked}
        components={{ ChipRenderer }}
        {...(canCreateCompany && {
          primaryActionLabel: CREATE_COMPANY,
          onPrimaryActionClick: handleCreateCompany,
        })}
        setSort={setSort}
        title={LIST_OF_RECORDS}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.companyEntity}
        selectedFilterValues={selectedValues}
        enableRowSelection={canBulkEditCompanies}
        rowSelectionIdKey="companyId"
        onRowSelectionChange={
          canBulkEditCompanies
            ? ({ selectedRowIds, isAllSelected }) => {
                setSelectedCompanyIds(selectedRowIds);
                setIsAllCompaniesSelected(isAllSelected);
              }
            : undefined
        }
        selectedFilterValuesAfterRun={selectedFilterValuesAfterRun}
        refetch={refetch}
        selectionApiRef={tableSelectionApiRef}
        showLoader={false}
      />
    </CompanyListingContainer>
  );
};
export default CompanyListing;
