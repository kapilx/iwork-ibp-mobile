import {
  BREADCRUMB_KEYS,
  buildBreadcrumbState,
  CardBackground,
  ChipRenderer,
  CommonBreadcrumb,
  createBreadcrumbEntry,
  CustomModal,
  DETAILS_KEYS,
  DETAILS_LABELS,
  endPoints,
  getBreadcrumbsFromState,
  MANAGE_ENDORSEMENT,
  SmartSearch,
  Table,
  theme,
  useFormWatcher,
  useLocalization,
  useTableController,
} from "@ui/ui-lib";
import ActionButton from "@ui/ui-lib/commonComponents/ActionButton";
import { CellClickedEvent } from "ag-grid-community";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { drawerHeadingMap } from "../../../components/PolicyDashboard/config.js";
import DrawerContentSwitcher from "../../../components/PolicyDashboard/DrawerContentSwitcher.js";
import FileRenderer, {
  handleDownload,
} from "../../../components/PolicyDashboard/FileRenderer.js";
import { DrawerView } from "../../../components/PolicyDashboard/index.js";
import {
  ADD_ENDORSEMENT,
  ENDORSEMENT_STATUS,
  MANAGE_ENDORSEMENTS,
  TABLE_CONTROLLER_ENTITY_KEY,
} from "../../../constants/index.js";
import {
  GeneratesmartSearchTitleConfig,
  periodConfig,
  smartSearchConfig,
} from "../../../Utils/smartSearchConfig.js";
import { ensureFromToFromFinancialYear } from "../../../Utils/smartSearchPrefill";
import { TitleContainer } from "../../CompanyPage/CompanyListing/styles.js";
import {
  HeaderWrapper,
  PolicyListingContainer,
} from "../../PolicyPage/PolicyListing/styles.js";
import {
  endorsementSmartsearchConfig,
  getManageEndorsementCols,
  manageEndorsementBreadcrumbs,
} from "./config.js";

const EndorsementListing = () => {
  const dispatch = useDispatch();
  const ActionButtonRenderer = (params: any) => {
    const errorFileId = params.data?.tpaErrorDocumentId;
    if (!errorFileId) {
      return <span></span>;
    }
    return (
      <ActionButton onClick={() => handleDownload(errorFileId, dispatch)} />
    );
  };
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
  const { localizationData } = useLocalization();
  const location = useLocation();

  const [openDrawer, setOpenDrawer] = useState(false);
  const [drawerView, setDrawerView] = useState<DrawerView | null>(null);
  const [insurerAcknowledgementData, setInsurerAcknowledgementData] =
    useState<any>(null);

  const [refreshDashboard, setRefreshDashboard] = useState(false);

  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();

  const systemSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.systemDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.endorsementEntity
      ]
  );

  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.endorsementEntity
      ]
  );

  const defaultValues =
    userSmartSearchDefaultValues || systemSmartSearchDefaultValues || {};

  const prefilledFilterValues = useMemo(() => {
    if (location.state && location.state?.filters) {
      return { ...location.state.filters };
    }
  }, [location.state]);

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
    setSort,
    refetch: refetchEndorsementData,
    setSmartSearch,
    setColumnOrder,
    columnOrder,
    setSearchTerm,
  } = useTableController({
    endpoint: endPoints.getAllEndrosmentBatches,
    searchFieldName: "EndorsementManagement",
    defaultFieldName: "endorsementEntryDate",
    enabled: !skipQuery,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.endorsementEntity,
  });

  const { selectedValues, handleReset } = useFormWatcher({
    formMethods,
    setSearchTerm: setSearchTerm,
    searchFieldName: "EndorsementManagement",
    searchDefaultValues:
      prefilledFilterValues || systemSmartSearchDefaultValues,
    // Reset must persist the true system default, not a drill-down link's
    // one-off prefilledFilterValues, or a contextual visit would overwrite
    // the user's saved Endorsement preference for every future normal visit.
    persistDefaultValues: systemSmartSearchDefaultValues,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.endorsementEntity,
    columnOrder,
    dispatch,
  });

  const handleRun = () => {
    setSmartSearch(selectedValues);
  };

  useEffect(() => {
    if (formMethods && skipQuery) {
      const defValues = prefilledFilterValues || defaultValues;
      const initialValues = ensureFromToFromFinancialYear(defValues) || {};

      formMethods.reset(initialValues);
      setSmartSearch(initialValues);
      setSkipQuery(false); // now allow queries to fire
    }
  }, [
    formMethods,
    skipQuery,
    defaultValues,
    prefilledFilterValues,
    setSmartSearch,
  ]);

  const smartsearchConfig = useMemo(
    () => [
      ...smartSearchConfig,
      GeneratesmartSearchTitleConfig("Period (Endorsement created)"),
      ...periodConfig(false, selectedValues?.from, selectedValues?.to),
      GeneratesmartSearchTitleConfig("Endorsement "),
      ...endorsementSmartsearchConfig,
    ],
    [selectedValues?.from, selectedValues?.to]
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (!skipQuery) {
      refetchEndorsementData();
    }
  }, [refreshDashboard]);

  const handleAcknowledgementClick = (key: string, data: any) => {
    if (key === "insurer_ack" || key === "upload_tpa_ids") {
      setOpenDrawer(true);
      setInsurerAcknowledgementData(data);
      data?.status === ENDORSEMENT_STATUS.ENDORSEMENT_STATUS_PENDING
        ? setDrawerView("insurerAcknowledgement")
        : setDrawerView("tpaAcknowledgement");
      setOpenDrawer(true);
    }
  };

  const handleAcknowledgeClick = () => {
    setOpenDrawer(false);
    setRefreshDashboard((prev) => !prev);
  };

  const handleRefreshDashboard = () => {
    setRefreshDashboard((prev) => !prev);
  };

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const endorsementBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: MANAGE_ENDORSEMENT,
            path: "/manage-endorsements",
            key: BREADCRUMB_KEYS.ENDORSEMENT,
            state: {
              filters: selectedValues ? selectedValues : null,
            },
          }),
        ];

  const onCellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === "policyNumber" && event.data) {
      const rowData = event.data as any;
      const destinationConfig = {
        label: DETAILS_LABELS.POLICY,
        path: `/policies/${rowData.policyId}`,
        key: DETAILS_KEYS.POLICY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: endorsementBreadcrumb,
        crumb: destinationConfig,
        state: {
          policyId: rowData.policyId,
          companyId: rowData.companyId,
          policyStatus: rowData.policyStatus,
          policyName: rowData.policyType,
          companyName: rowData.companyName,
          accountManager: rowData.accountManager,
          policyDetails: {
            label: rowData.policyType,
          },
          from: "polimanage-endorsements",
          filters: selectedValues ? selectedValues : null,
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
      //     policyName: rowData.policyType,
      //     companyName: rowData.companyName,
      //     accountManager: rowData.accountManager,
      //     policyDetails: {
      //       label: rowData.policyType,
      //     },
      //     from: "polimanage-endorsements",
      //     filters: selectedValues ? selectedValues : null,
      //   },
      // });
    } else if (event.colDef.field === "endorsementId" && event.data) {
      const rowData = event.data as any;
      const destinationConfig = {
        label: DETAILS_LABELS.ENDORSEMENT,
        path: `/${rowData?.policyId}/create-endorsement/${rowData?.endorsementId}`,
        key: DETAILS_KEYS.ENDORSEMENT,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: endorsementBreadcrumb,
        crumb: destinationConfig,

        state: {
          navigationFrom: "/manage-endorsements",
          navigationLabel: "Manage endorsements",
          sidebarLabel: "Manage Endorsements",
          filters: selectedValues ? selectedValues : null,
        },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(
      //   `/${rowData?.policyId}/create-endorsement/${rowData?.endorsementId}`,
      //   {
      //     state: {
      //       navigationFrom: "/manage-endorsements",
      //       navigationLabel: "Manage endorsements",
      //       filters: selectedValues ? selectedValues : null,
      //     },
      //   }
      // );
    }
  };
  return (
    <PolicyListingContainer>
      {location?.state?.formDashboard ? (
        <CommonBreadcrumb crumbs={manageEndorsementBreadcrumbs} />
      ) : (
        <TitleContainer variant="h1">{MANAGE_ENDORSEMENTS}</TitleContainer>
      )}

      <HeaderWrapper>
        <CardBackground>
          <SmartSearch
            searchFormConfig={smartsearchConfig}
            searchDefaultValues={
              prefilledFilterValues || defaultValues
            }
            searchFormMethods={setFormMethods}
            selectedValues={selectedValues}
            onReset={handleReset}
            formMethods={formMethods}
            searchFieldName="EndorsementManagement"
            placeholder="Search"
            enableSmartSearch={true}
            onRunFilters={handleRun}
          />
        </CardBackground>
      </HeaderWrapper>
      <Table
        columns={getManageEndorsementCols}
        rowData={rowData}
        totalRows={totalRows}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={loading}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        setPageSize={setPageSize}
        onCellClicked={onCellClicked}
        setSort={setSort}
        components={{
          ChipRenderer,
          FileRenderer: FileRenderer,
          ActionButton: ActionButtonRenderer,
        }}
        title="List of Endorsements"
        height={440}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.endorsementEntity}
        selectedFilterValues={selectedValues}
      />

      <CustomModal
        open={openDrawer}
        handleClose={() => setOpenDrawer(false)}
        heading={drawerHeadingMap[drawerView] || ""}
        disablePortal={true}
        headingStyles={{ color: theme.palette.chips.senary }}
      >
        <DrawerContentSwitcher
          drawerView={drawerView}
          setDrawerView={setDrawerView}
          setOpenDrawer={setOpenDrawer}
          onInsurerAcknowledge={handleAcknowledgementClick}
          insurerAcknowledgementData={insurerAcknowledgementData}
          sendEndorsement={handleAcknowledgeClick}
          refreshDashboard={handleRefreshDashboard}
        />
      </CustomModal>
    </PolicyListingContainer>
  );
};

export default EndorsementListing;
