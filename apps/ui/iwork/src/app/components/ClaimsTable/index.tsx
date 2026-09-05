import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  ChipRenderer,
  SmartSearch,
  CardBackground,
  useFormWatcher,
  CLAIMS_TITLE,
  CLAIMS_SUBTITLE,
  useTableController,
  endPoints,
  CommonBreadcrumb,
  Button,
  CustomModal,
  DynamicForm,
  CANCEL,
} from "@ui/ui-lib";
import {
  claimsSearchConfig,
  getClaimsTableColumns,
  manageClaimsBreadcrumbs,
  getUploadClaimsFormConfig,
} from "./tableConfig";
import {
  ClaimsTableContainer,
  ClaimsTitleContainer,
} from "./styles";
import ActionButton from "@ui/ui-lib/commonComponents/ActionButton";
import {
  GeneratesmartSearchTitleConfig,
  periodConfig,
  smartSearchConfig,
} from "../../Utils/smartSearchConfig";
import { ensureFromToFromFinancialYear } from "../../Utils/smartSearchPrefill";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { CellClickedEvent } from "ag-grid-community";
import { MANAGE_CLAIMS, TABLE_CONTROLLER_ENTITY_KEY, UPLOAD_CLAIM } from "../../constants";
import { Typography } from "@mui/material";
import ClaimsLinkPopover from "./ClaimsLinkPopover";
import { useDispatch, useSelector } from "react-redux";
import { OPEN_TAT_LABEL } from "../BusinessPerformance/tatDrilldownConfig";

/** Helpers to normalize SmartSearch payload */
const getVal = (v: any) =>
  v && typeof v === "object" ? v.value ?? v.label ?? v : v;

const normalizeFilters = (vals: any) => {
  const next: any = { ...vals };

  // Preserve single or multi TAT selections
  const tat = next.tatRange;
  const resolvedTat = getVal(tat);
  next.tatRange = Array.isArray(resolvedTat)
    ? resolvedTat.map((item) => getVal(item))
    : getVal(resolvedTat);

  // claimStatus must be uppercase (single or multi)
  const upper = (x: any) => {
    const raw = getVal(x);
    return typeof raw === "string" ? raw.toUpperCase() : raw;
  };
  const cs = next.claimStatus;
  if (Array.isArray(cs)) next.claimStatus = cs.map(upper);
  else if (cs != null) next.claimStatus = upper(cs);

  return next;
};

const ClaimsTable: React.FC = () => {
  const dispatch = useDispatch();
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFormMethods, setUploadFormMethods] =
    useState<ReturnType<typeof useForm>>();
  const location = useLocation();

  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    uploadFormMethods?.reset();
  };

  const handleUploadClaim = () => {
    const formData = uploadFormMethods?.getValues();
    const selectedTpaId = formData?.tpaId;

    if (!selectedTpaId) {
      // Show error toast if no TPA selected
      return;
    }

    // Navigate to TPA-specific claims upload page
    navigate(`/manage-claims/${selectedTpaId}/upload-claims`, {
      state: {
        navigationFrom: "/manage-claims",
        navigationLabel: "Manage Claims",
        tpaId: selectedTpaId,
      },
    });

    handleCloseUploadDialog();
  };

  const systemSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.systemDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.claimsEntity
      ]
  );
  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.claimsEntity
      ]
  );

  const defaultValues =
    userSmartSearchDefaultValues || systemSmartSearchDefaultValues || {};

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
    setSort,
    setSmartSearch,
    setColumnOrder,
    columnOrder,
  } = useTableController({
    endpoint: endPoints.allClaims,
    searchFieldName: "companyName", // align with watcher + SmartSearch
    enabled: !skipQuery,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.claimsEntity,
  });

  const columns = useMemo(() => getClaimsTableColumns(), []);
  const navigate = useNavigate();

  const prefilledFilterValues = useMemo(() => {
    if (location.state && location.state?.filters) {
      return { ...location.state.filters };
    }
  }, [location.state]);

  const { selectedValues, handleReset } = useFormWatcher({
    formMethods,
    setSearchTerm,
    searchFieldName: "companyName",
    searchDefaultValues:
      prefilledFilterValues || systemSmartSearchDefaultValues,
    // Reset must persist the true system default, not a drill-down link's
    // one-off prefilledFilterValues, or a contextual visit would overwrite
    // the user's saved Claims preference for every future normal visit.
    persistDefaultValues: systemSmartSearchDefaultValues,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.claimsEntity,
    columnOrder,
    dispatch,
  });

  useEffect(() => {
    if (formMethods && skipQuery) {
      const defValues = prefilledFilterValues || defaultValues;
      const initialValues = ensureFromToFromFinancialYear(defValues) || {};
      const shouldApplyDashboardTatFallback =
        Boolean(location.state && (location.state as any)?.formDashboard) &&
        Boolean(initialValues?.sbuId) &&
        !initialValues?.tatRange &&
        !initialValues?.openTatOnly;
      const normalizedInitialValues = shouldApplyDashboardTatFallback
        ? {
            ...initialValues,
            openTatOnly: {
              value: true,
              label: OPEN_TAT_LABEL,
            },
          }
        : initialValues;

      formMethods.reset(normalizedInitialValues);
      setSmartSearch(normalizeFilters(normalizedInitialValues));
      setSkipQuery(false); // now allow queries to fire
    }
  }, [
    formMethods,
    skipQuery,
    defaultValues,
    prefilledFilterValues,
    setSmartSearch,
    location.state,
  ]);

  const handleRun = () => {
    setSmartSearch(normalizeFilters(selectedValues));
  };

  // const CellClicked = (event: CellClickedEvent) => {
  //   if (event.colDef.field === "companyName") {
  //     navigate(`/companies/${event.data.companyId}`, {
  //       state: {
  //         from: "claims",
  //         filters: selectedValues ? selectedValues : null,
  //       },
  //     });
  //   }
  // };

  const ActionButtonRenderer = () => (
    <ActionButton
      onClick={() => {}}
      buttonText="Live Status"
      isIconVisible={false}
    />
  );

  const smartsearchConfig = useMemo(
    () => [
      ...smartSearchConfig,
      GeneratesmartSearchTitleConfig("Period"),
      ...periodConfig(false, selectedValues?.from, selectedValues?.to),
      GeneratesmartSearchTitleConfig("Claims"),
      ...claimsSearchConfig,
    ],
    [selectedValues?.from, selectedValues?.to]
  );

  return (
    <ClaimsTableContainer>
      <ClaimsTitleContainer>
        {location?.state?.formDashboard ? (
          <CommonBreadcrumb crumbs={manageClaimsBreadcrumbs} />
        ) : (
          <Typography variant="h1">{MANAGE_CLAIMS}</Typography>
        )}

        <ClaimsLinkPopover onUploadClaims={handleOpenUploadDialog} />
      </ClaimsTitleContainer>

      <CardBackground>
        <SmartSearch
          searchFormConfig={smartsearchConfig}
          searchDefaultValues={
            prefilledFilterValues || systemSmartSearchDefaultValues
          }
          searchFormMethods={setFormMethods}
          selectedValues={selectedValues}
          onReset={handleReset}
          formMethods={formMethods}
          searchFieldName="companyName"
          placeholder="search"
          enableSmartSearch
          onRunFilters={handleRun}
        />
      </CardBackground>

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
        components={{ ChipRenderer, ActionButton: ActionButtonRenderer }}
        setSort={setSort}
        title={CLAIMS_TITLE}
        subTitle={CLAIMS_SUBTITLE}
        // onCellClicked={CellClicked}
        displaySettingsButton={true}
        domLayout="autoHeight"
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.claimsEntity}
        selectedFilterValues={selectedValues}
        primaryActionLabel={UPLOAD_CLAIM}
        onPrimaryActionClick={handleOpenUploadDialog}
        primaryActionPermission={undefined}
      />

      <CustomModal
        open={uploadDialogOpen}
        handleClose={handleCloseUploadDialog}
        heading={UPLOAD_CLAIM}
        buttons={[
          {
            label:CANCEL,
            onClick: handleCloseUploadDialog,
            variant: "secondary",
          },
          {
            label:UPLOAD_CLAIM,
            onClick: handleUploadClaim,
            variant: "primary",
          },
        ]}
      >
        <DynamicForm
          formConfig={getUploadClaimsFormConfig()}
          formMethods={setUploadFormMethods}
          defaultValues={{ tpaId: "" }}
        />
      </CustomModal>
    </ClaimsTableContainer>
  );
};

export default ClaimsTable;
