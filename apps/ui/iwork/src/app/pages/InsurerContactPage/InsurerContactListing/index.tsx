import { CellClickedEvent } from "ag-grid-community";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LIST_OF_RECORDS,
  TABLE_CONTROLLER_ENTITY_KEY,
} from "../../../constants";
import {
  CardBackground,
  SmartSearch,
  SEARCH,
  endPoints,
  useFormWatcher,
  useTableController,
  FeatureKey,
  selectHasPermission,
  KPICards,
  Table,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  GET_ENTITY_LABEL,
  buildBreadcrumbState,
  DETAILS_KEYS,
} from "@ui/ui-lib";
import { EntityType } from "../../../constants/enum";
import {
  getColumnsByContactRecordTypeLid,
  getDynamicTitle,
  insurerKPIData,
  searchDefaultValues,
  tableSearchConfig,
} from "./insurerTableConfig";
import { InsurerContactListingStyledContainer } from "./styles";
import { LookUpValues } from "../../../constants/lookupValues";
import { useDispatch, useSelector } from "react-redux";

const InsurerContactListing: React.FC<{ entityType: EntityType }> = ({
  entityType,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();

  const [isEditMode, setIsEditMode] = useState(false);

  const entityTypeToCreateContactFeatureKey: Record<EntityType, FeatureKey> = {
    [EntityType.INSURER]: FeatureKey.CREATE_INSURER_CONTACT,
    [EntityType.TPA]: FeatureKey.CREATE_TPA_CONTACT,
    [EntityType.BROKER]: FeatureKey.CREATE_BROKER_CONTACT,
  };

  const createContactFeatureKey =
    entityTypeToCreateContactFeatureKey[entityType] ||
    FeatureKey.CREATE_INSURER_CONTACT;

  const canCreateContact = useSelector((state: any) =>
    selectHasPermission(createContactFeatureKey)(state)
  );

  // Validate entityType and get the corresponding contactRecordTypeLid
  const resolvedLookupIds = useSelector(
    (state: any) => state.user.resolvedLookupIds
  );
  const contactRecordTypeLid =
    entityType &&
    resolvedLookupIds?.[
      LookUpValues[
        `${entityType.toUpperCase()}_CONTACT` as keyof typeof LookUpValues
      ]
    ]
      ? resolvedLookupIds[
          LookUpValues[
            `${entityType.toUpperCase()}_CONTACT` as keyof typeof LookUpValues
          ]
        ]
      : resolvedLookupIds?.[LookUpValues.INSURER_CONTACT];
  // Removed unnecessary console.log statement

  const getEntityKey = () => {
    switch (entityType) {
      case "insurer":
        return TABLE_CONTROLLER_ENTITY_KEY.insurerContactEntity;
      case "tpa":
        return TABLE_CONTROLLER_ENTITY_KEY.tpaContactEntity;
      case "broker":
        return TABLE_CONTROLLER_ENTITY_KEY.brokerContactEntity;
      default:
        return TABLE_CONTROLLER_ENTITY_KEY.insurerContactEntity;
    }
  };

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
    endpoint: endPoints.allContacts,
    customPathParam: `contactRecordTypeLid=${contactRecordTypeLid}`,
    searchFieldName: `${entityType}Name`,
    entityKey: getEntityKey(),
  });

  const { selectedValues, handleReset } = useFormWatcher({
    formMethods,
    setSearchTerm,
    searchDefaultValues,
    searchFieldName: `${entityType}Name`,
    entityKey: getEntityKey(),
    columnOrder,
    dispatch,
  });

  const location = useLocation();
  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const entityContactBreadcrumbs =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: GET_ENTITY_LABEL(entityType, true),
            path: `/${entityType}?contacts=true`,
            key: `manage-${entityType}-contact`,
            state: {
              filters: selectedValues ? selectedValues : null,
            },
          }),
        ];

  const onCellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === "contactName") {
      const destinationConfig = {
        label: event.data.contactName,
        path: `/${entityType}/contact/${event.data.id}`,
        key: `${entityType}-contact-details`,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: entityContactBreadcrumbs,
        crumb: destinationConfig,
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/${entityType}/contact/${event.data.id}`);
    }
    if (event.colDef.field === "companyName") {
      const destinationConfig = {
        label: event.data.companyName,
        path: `/${entityType}/${event.data.companyId}`,
        key: DETAILS_KEYS.COMPANY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: entityContactBreadcrumbs,
        crumb: destinationConfig,
        state: { from: entityType + "Contact" },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/${entityType}/${event.data.companyId}`, {
      //   state: { from: entityType + "Contact" },
      // });
    }
  };

  useEffect(() => {
    setSmartSearch(selectedValues);
  }, [selectedValues]);

  useEffect(() => {
    if (formMethods) {
      const subscription = formMethods.watch((values) => {
        const searchValue = formMethods.watch("contactName") || ""; // Assuming 'search' is the input name
        if (searchValue !== undefined) {
          setSearchTerm(searchValue);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [formMethods]);

  useEffect(() => {
    if (overallData) {
      setIsEditMode(true);
    }
  }, [overallData]);

  const columns = useMemo(() => {
    return getColumnsByContactRecordTypeLid(
      contactRecordTypeLid,
      resolvedLookupIds
    );
  }, [contactRecordTypeLid, resolvedLookupIds]);

  const tableSearch = tableSearchConfig(
    contactRecordTypeLid,
    resolvedLookupIds
  );

  const kpis = insurerKPIData(
    overallData,
    totalRows,
    contactRecordTypeLid,
    resolvedLookupIds
  );

  return (
    <InsurerContactListingStyledContainer>
      <CardBackground>
        <SmartSearch
          searchFormConfig={tableSearch}
          searchDefaultValues={searchDefaultValues}
          searchFormMethods={setFormMethods}
          selectedValues={selectedValues}
          searchFieldName={`${entityType}Name`}
          placeholder={SEARCH}
          formMethods={formMethods}
          onReset={handleReset}
          enableManualSearch={true}
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
        primaryActionLabel={getDynamicTitle(
          contactRecordTypeLid,
          "manage",
          resolvedLookupIds
        )}
        onPrimaryActionClick={() => navigate(`/${entityType}/contact/new`)}
        setSort={setSort}
        title={LIST_OF_RECORDS}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        entityKey={getEntityKey()}
      />
    </InsurerContactListingStyledContainer>
  );
};

export default InsurerContactListing;
