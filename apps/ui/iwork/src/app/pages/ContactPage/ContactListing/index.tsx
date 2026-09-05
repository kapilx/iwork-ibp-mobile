import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ADD_CONTACT,
  CONTACT,
  GENERIC_ERROR,
  LIST_OF_RECORDS,
  MANAGE_CONTACTS,
  TABLE_CONTROLLER_ENTITY_KEY,
} from "../../../constants";
import { BREADCRUMB_KEYS, CONTACTS, DETAILS_KEYS } from "@ui/ui-lib";
import {
  SEARCH,
  endPoints,
  useTableController,
  SmartSearch,
  CardBackground,
  useFormWatcher,
  setToastMessage,
  useLookupIdByKey,
  selectHasPermission,
  FeatureKey,
  KPICards,
  Table,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  buildBreadcrumbState,
  useBreadcrumbTrail,
} from "@ui/ui-lib";
import { ContactListingStyledContainer, TitleContainer } from "./styles";
import { columns, kpiData, tableSearchConfig } from "./tableConfig";
import { useForm } from "react-hook-form";
import { CellClickedEvent } from "ag-grid-community";
import { useDispatch } from "react-redux";
import { LookUpValues } from "../../../constants/lookupValues";
import { useSelector } from "react-redux";
import {
  GeneratesmartSearchTitleConfig,
  periodConfig,
  smartSearchConfig,
} from "../../../Utils/smartSearchConfig";

const ContactListing: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const prefilledFilterValues = useMemo(() => {
    if (location.state && location.state?.filters) {
      return { ...location.state.filters };
    }
  }, [location.state]);

  const systemSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.systemDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.contactEntity
      ]
  );
  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.contactEntity
      ]
  );

  const defaultValues =
    userSmartSearchDefaultValues || systemSmartSearchDefaultValues || {};

  const companyContactId = useLookupIdByKey(LookUpValues.COMPANY_CONTACT);
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
    searchTerm,
    setSearchTerm,
    overallData,
    setSort,
    setSmartSearch,
    setColumnOrder,
    columnOrder,
  } = useTableController({
    endpoint: endPoints.allContacts,
    customPathParam: `contactRecordTypeLid=${companyContactId}`,
    searchFieldName: "contactName",
    enabled: !skipQuery,
    defaultFieldName: "createdAt",
  });

  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();

  const kpis = kpiData(overallData, totalRows);

  const handleCreateContact = () => {
    navigate("/create", {
      state: {
        pageTitle: CONTACT,
        cta: "addContact",
        originPath: "/contact",
      },
    });
  };

  const { selectedValues, handleReset } = useFormWatcher({
    formMethods,
    setSearchTerm,
    searchFieldName: "contactName",
    searchDefaultValues: systemSmartSearchDefaultValues,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.contactEntity,
    columnOrder,
    dispatch,
  });

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
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

  useBreadcrumbTrail({
    label: MANAGE_CONTACTS,
    path: "/contact",
    state: breadcrumbState, // 👈 include latest filters here
  });

  const onCellClicked = (event: CellClickedEvent) => {
    const filtersState =
      filtersToPersist && Object.keys(filtersToPersist).length > 0
        ? { filters: filtersToPersist }
        : {};

    const contactBreadcrumb =
      existingBreadcrumbs.length > 0
        ? existingBreadcrumbs
        : [
            createBreadcrumbEntry({
              label: MANAGE_CONTACTS,
              path: "/contact",
              key: BREADCRUMB_KEYS.CONTACT,
              state: {
                ...filtersState,
              },
            }),
          ];
    if (event.colDef.field === "contactName") {
      const destinationConfig = {
        label: `${event.data.contactName}`,
        path: `/contact/${event.data.id}`,
        key: DETAILS_KEYS.CONTACT,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: contactBreadcrumb,
        crumb: destinationConfig,

        state: {
          ...filtersState,
        },
      });
      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/contact/${event.data.id}`, {
      //   state: {
      //     filters: selectedValues ? selectedValues : null,
      //   },
      // });
    } else if (event.colDef.field === "companyName") {
      const destinationConfig = {
        label: `${event.data.companyName}`,
        path: `/companies/${event.data.companyId}`,
        key: DETAILS_KEYS.COMPANY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: contactBreadcrumb,
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
      //     from: "contact",
      //     filters: selectedValues ? selectedValues : null,
      //   },
      // });
    }
  };

  const handleRun = () => {
    setSmartSearch(selectedValues);
  };

  const canCreateContact = useSelector((state: any) =>
    selectHasPermission(FeatureKey.CREATE_CONTACT)(state)
  );

  useEffect(() => {
    if (formMethods && skipQuery) {
      const defValues = prefilledFilterValues || defaultValues;
      formMethods.reset(defValues);
      formMethods.setValue("status", defValues.status);
      setSmartSearch(defValues);
      setSkipQuery(false); // now allow queries to fire
    }
  }, [formMethods, skipQuery]);

  const smartsearchConfig = useMemo(
    () => [
      ...smartSearchConfig,
      GeneratesmartSearchTitleConfig("Period (Contact created)"),
      ...periodConfig(false, selectedValues?.from, selectedValues?.to),
      GeneratesmartSearchTitleConfig("Contact"),
      ...tableSearchConfig,
    ],
    [selectedValues?.from, selectedValues?.to]
  );

  return (
    <ContactListingStyledContainer>
      <TitleContainer variant="h1">{MANAGE_CONTACTS}</TitleContainer>
      <CardBackground>
        <SmartSearch
          searchFormConfig={smartsearchConfig}
          searchDefaultValues={defaultValues}
          searchFormMethods={setFormMethods}
          selectedValues={selectedValues}
          onReset={handleReset}
          formMethods={formMethods}
          searchFieldName="contactName"
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
        {...(canCreateContact && {
          primaryActionLabel: ADD_CONTACT,
          onPrimaryActionClick: handleCreateContact,
        })}
        setSort={setSort}
        title={LIST_OF_RECORDS}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.contactEntity}
        selectedFilterValues={selectedValues}
        showLoader={false}
      />
      {/* </StyledContainer> */}
    </ContactListingStyledContainer>
  );
};

export default ContactListing;
