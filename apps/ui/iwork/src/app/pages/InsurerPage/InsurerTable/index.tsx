import {
  CardBackground,
  FeatureKey,
  SEARCH,
  SmartSearch,
  endPoints,
  selectHasPermission,
  useFormWatcher,
  useTableController,
  KPICards,
  Table,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  GET_ENTITY_LABEL,
  buildBreadcrumbState,
  buildColumnSettingsPayload,
  updateUserDefaultConfig,
} from "@ui/ui-lib";
import { CellClickedEvent } from "ag-grid-community";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import {
  INSURER_TYPE,
  LIST_OF_RECORDS,
  TABLE_CONTROLLER_ENTITY_KEY,
} from "../../../constants";
import { InsurerTableStyledContainer } from "./styles";
import {
  entityTypeTitles,
  getColumns,
  getTableSearchConfig,
  insurerkpiData,
  searchDefaultValues,
} from "./tableConfig";
import { useDispatch, useSelector } from "react-redux";

const InsurerListing: React.FC<{ entityType: string }> = ({ entityType }) => {
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const titles = entityTypeTitles[entityType || "insurer"]; // Default to "insurer" if entityType is undefined

  const [isEditMode, setIsEditMode] = useState(false);
  const [skipQuery, setSkipQuery] = useState(true);

  const entityTypeToCreateFeatureKey: Record<string, FeatureKey> = {
    insurer: FeatureKey.CREATE_INSURER,
    tpa: FeatureKey.CREATE_TPA,
    broker: FeatureKey.CREATE_BROKER,
  };

  const createFeatureKey =
    entityTypeToCreateFeatureKey[entityType] || FeatureKey.CREATE_INSURER;

  const canCreate = useSelector((state: any) =>
    selectHasPermission(createFeatureKey)(state)
  );

  const getAllEndpoint = (() => {
    switch (entityType) {
      case "insurer":
        return endPoints.allInsurers;
      case "tpa":
        return endPoints.AllTpas;
      case "broker":
        return endPoints.allBrokers;
      default:
        return endPoints.allInsurers;
    }
  })();

  const entityKey = useMemo(() => {
    switch (entityType) {
      case "insurer":
        return TABLE_CONTROLLER_ENTITY_KEY.insurerEntity;
      case "tpa":
        return TABLE_CONTROLLER_ENTITY_KEY.tpaEntity;
      case "broker":
        return TABLE_CONTROLLER_ENTITY_KEY.brokerEntity;
      default:
        return TABLE_CONTROLLER_ENTITY_KEY.insurerEntity;
    }
  }, [entityType]);

  const userSmartSearchDefaultValues = useSelector(
    (state: any) => state.user.userDefaultConfig?.smartSearchValues?.[entityKey]
  );
  const systemSmartSearchDefaultValues = useSelector(
    (state: any) => state.user.systemDefaultConfig?.smartSearchValues?.[entityKey]
  );
  const defaultValues = userSmartSearchDefaultValues || systemSmartSearchDefaultValues || searchDefaultValues;

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
  } = useTableController({
    endpoint: getAllEndpoint,
    searchFieldName: `${entityType}Name`,
    entityKey,
    enabled: !skipQuery,
  });

  const { selectedValues, handleReset: resetForm } = useFormWatcher({
    formMethods,
    setSearchTerm,
    searchDefaultValues: defaultValues,
    searchFieldName: `${entityType}Name`,
  });

  const handleReset = () => {
    if (formMethods) {
      formMethods.reset(searchDefaultValues);
    }
    setSearchTerm("");
    dispatch(
      updateUserDefaultConfig({
        entityKey,
        selectedFilterValues: searchDefaultValues,
        columns: buildColumnSettingsPayload(columnOrder),
      }) as any
    );
  };

  useEffect(() => {
    if (formMethods && skipQuery) {
      formMethods.reset(defaultValues);
      setSmartSearch(defaultValues);
      setSkipQuery(false);
    }
  }, [formMethods, skipQuery]);

  useEffect(() => {
    if (formMethods) {
      const fieldName = `${entityType}Name`;
      const subscription = formMethods.watch((values) => {
        const searchValue = (values as Record<string, string>)[fieldName] || "";
        setSearchTerm(searchValue);
        if (!searchValue) {
          setSmartSearch((prev: Record<string, string>) => ({ ...prev, [fieldName]: "" }));
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [formMethods, entityType, setSearchTerm, setSmartSearch]);

  const location = useLocation();
  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const entityBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: GET_ENTITY_LABEL(entityType),
            path: `/${entityType}`,
            key: `manage-${entityType}`,
            state: {
              filters: selectedValues ? selectedValues : null,
            },
          }),
        ];

  const onCellClicked = (event: CellClickedEvent) => {
    const idKey = "id";
    const entityId = event.data?.[idKey];

    if (event.colDef.field === `${entityType}Name` && entityId) {
      const destinationConfig = {
        label: event.data?.[`${entityType}Name`],
        path: `/${entityType}/${entityId}`,
        key: `${entityType}-details`,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: entityBreadcrumb,
        crumb: destinationConfig,
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/${entityType}/${entityId}`);
    }
    if (event.colDef.field === "Edit")
      navigate(`/${entityType}/${entityId}/edit`);
  };
  useEffect(() => {
    if (overallData) {
      setIsEditMode(true);
    }
  }, [overallData]);

  const columns = useMemo(() => {
    return getColumns(entityType || INSURER_TYPE);
  }, [entityType]);

  const tableSearchConfig = getTableSearchConfig(entityType || INSURER_TYPE);
  const kpis = insurerkpiData(
    overallData,
    totalRows,
    entityType || INSURER_TYPE
  );
  return (
    <InsurerTableStyledContainer>
      <CardBackground>
        <SmartSearch
          searchFormConfig={entityType === "insurer" ? tableSearchConfig : []}
          searchDefaultValues={defaultValues}
          searchFormMethods={setFormMethods}
          isEditMode={isEditMode}
          selectedValues={selectedValues}
          searchFieldName={`${entityType}Name`}
          placeholder={SEARCH}
          formMethods={formMethods}
          onReset={handleReset}
          enableManualSearch={true}
          enableSmartSearch={true}
          onRunFilters={() => setSmartSearch(formMethods?.getValues() ?? searchDefaultValues)}
        />
      </CardBackground>
      <KPICards data={kpis} />

      <Table
        columns={columns}
        rowData={rowData}
        totalRows={totalRows}
        currentPage={currentPage}
        loading={loading}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={onCellClicked}
        primaryActionLabel={
          !canCreate
            ? undefined
            : entityType === "insurer"
            ? "Add Insurer"
            : titles?.manageTitle
        }
        onPrimaryActionClick={
          canCreate
            ? entityType === "insurer"
              ? () => navigate("/insurer/branch/new")
              : () => navigate(`/${entityType}/new`)
            : undefined
        }
        setSort={setSort}
        title={LIST_OF_RECORDS}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        entityKey={entityKey}
        selectedFilterValues={selectedValues}
      />
    </InsurerTableStyledContainer>
  );
};

export default InsurerListing;
