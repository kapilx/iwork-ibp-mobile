import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  apiRequest,
  useTableController,
  endPoints,
  useFormWatcher,
  SEARCH,
  ChipRenderer,
  setToastMessage,
  SmartSearch,
  CardBackground,
  ADD_CD_BALANCE,
  CD_ACCOUNT_DETAILS,
  OVERVIEW_OF_ALL_CASH_DEPOSIT_ACCOUNTS,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  BREADCRUMB_KEYS,
  DETAILS_KEYS,
  buildBreadcrumbState,
  CD_DEPOSIT_STATEMENT,
  DETAILS_LABELS,
  CustomModal,
  MANAGE_CD_ACCOUNT,
} from "@ui/ui-lib";

import { useLocation, useNavigate } from "react-router-dom";
import { CellClickedEvent } from "ag-grid-community";
import ActionButton from "@ui/ui-lib/commonComponents/ActionButton";
import { useDispatch } from "react-redux";
import { Typography } from "@mui/material";
import {
  CD_MANAGEMENT_LABEL,
  TABLE_CONTROLLER_ENTITY_KEY,
  REDIRECT_TO_POLICY,
  REDIRECT_TO_POLICY_CONFIRMATION,
  NO,
  YES,
} from "../../constants";
import { smartSearchDefaultValues } from "../../Utils/smartSearchConfig";
import {
  cdManagementSearchConfig,
  cdManagementSearchDefaultValues,
  columnDefs,
} from "./tableConfig";
import { TableMainContainer } from "./styles";
import { useForm } from "react-hook-form";
import addIcon from "../../assets/svgs/add-icon.svg";

const sanitizeCdManagementFilters = <T extends Record<string, unknown>>(
  values: T
): Omit<T, "financialYear"> => {
  const { financialYear: _financialYear, ...rest } = values || ({} as T);
  return rest;
};

const CDManagementList: React.FC = () => {
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [skipQuery, setSkipQuery] = useState(true);
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    path: string;
    state: any;
  } | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const DefaultValues = useMemo(
    () =>
      sanitizeCdManagementFilters({
        ...smartSearchDefaultValues,
        ...cdManagementSearchDefaultValues,
      }),
    []
  );
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
    endpoint: endPoints.getAllCautionDeposits,
    enabled: !skipQuery,
    searchFieldName: "companyName",
    customPathParam: "viewBy=team",
  });

  const handleCreateCDAccount = () => {
    navigate("/create-cd-account");
  };

  const { selectedValues, handleReset } = useFormWatcher({
    formMethods,
    setSearchTerm,
    searchFieldName: "companyName",
    searchDefaultValues: DefaultValues,
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.cdManagementEntity,
    columnOrder,
    dispatch,
  });

  // Initial run
  useEffect(() => {
    if (formMethods && skipQuery) {
      formMethods.reset(DefaultValues);
      setSmartSearch(DefaultValues);
      setSkipQuery(false);
    }
  }, [formMethods, skipQuery]); // eslint-disable-line react-hooks/exhaustive-deps
 
  const handleRun = () => {
    setSmartSearch(sanitizeCdManagementFilters(selectedValues || {}));
  };

  const location = useLocation();
  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const cdManagementBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: CD_MANAGEMENT_LABEL,
            path: "/cd-management",
            key: BREADCRUMB_KEYS.CD_MANAGEMENT,
            state: {
              filters: selectedValues ? selectedValues : null,
            },
          }),
        ];

  const onCellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === "companyName") {
      const destinationConfig = {
        label: event.data.companyName,
        path: `/companies/${event.data.companyId}`,
        key: DETAILS_KEYS.COMPANY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: cdManagementBreadcrumb,
        crumb: destinationConfig,
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/companies/${event.data.companyId}`);
    }
    if (event.colDef.field === "cdAccount") {
      const destinationConfig = {
        label: CD_DEPOSIT_STATEMENT,
        path: `/cd-management/${event.data.cautionDepositId}`,
        key: DETAILS_KEYS.CD_MANAGEMENT,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: cdManagementBreadcrumb,
        crumb: destinationConfig,
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/cd-management/${event.data.cautionDepositId}`);
    }
    if (
      (event.colDef.field === "policyId" ||
        event.colDef.field === "policyInsurerNumber") &&
      event.data?.policyId
    ) {
      const destinationConfig = {
        label: DETAILS_LABELS.POLICY,
        path: `/policies/${event.data.policyId}`,
        key: DETAILS_KEYS.POLICY,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: cdManagementBreadcrumb,
        crumb: destinationConfig,
        state: {
          policyId: event.data.policyId,
          state: { activeTab: "cdDetails" },
        },
      });
      setPendingNavigation({
        path: destinationConfig.path,
        state: destinationState,
      });
      setRedirectModalOpen(true);
    }
  };

  const handleCdBalanceClick = (params: any) => {
    const cdId = params?.data?.cautionDepositId;
    const policyId = params?.data?.policyId;
    if (!cdId || !policyId) {
      dispatch(setToastMessage("No CD account or policy exists"));
      return;
    }
    navigate(`/policies/${policyId}/cd-balance/${cdId}`, {
      state: {
        from: "CDManagement",
        to: "AddCdDetails",
        policyId: Number(policyId),
        cdId: Number(cdId),
      },
    });
  };
  const ActionButtonRenderer = (params: any) => {
    return (
      <ActionButton
        onClick={(e: any) => {
          e?.stopPropagation?.(); // important for ag-Grid
          handleCdBalanceClick(params); // pass the row params
        }}
        buttonText={ADD_CD_BALANCE}
        imageSrc={addIcon}
        imageStyles={{ width: "20px", height: "20px" }}
        customStyles={{
          gap: "10px",
          backgroundColor: "transparent",
          border: "none",
          paddingLeft: "0px",
        }}
      />
    );
  };

  const tableColumns = React.useMemo(
    () =>
      columnDefs.map((col) => ({
        ...col,
        disableSort: true,
      })),
    []
  );

  return (
    <TableMainContainer>
      <Typography variant="h1">{CD_MANAGEMENT_LABEL}</Typography>
      <CardBackground>
        <SmartSearch
          searchFormConfig={
            [
              ...cdManagementSearchConfig,
            ]
          }
          searchDefaultValues={DefaultValues}
          searchFormMethods={setFormMethods}
          isEditMode={isEditMode}
          selectedValues={selectedValues}
          searchFieldName="companyName"
          placeholder='Search by company name or CD account number'
          formMethods={formMethods}
          onReset={handleReset}
          enableSmartSearch={true}
          onRunFilters={handleRun}
        />
      </CardBackground>
      <Table
        columns={tableColumns}
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
        title={CD_ACCOUNT_DETAILS}
        subTitle={OVERVIEW_OF_ALL_CASH_DEPOSIT_ACCOUNTS}
        height={590}
        domLayout="autoHeight"
        components={{
          ChipRenderer,
          ActionButton: ActionButtonRenderer,
        }}
        primaryActionLabel={MANAGE_CD_ACCOUNT}
        onPrimaryActionClick={handleCreateCDAccount}
        setColumnOrder={setColumnOrder}
        columnOrder={columnOrder}
        entityKey={TABLE_CONTROLLER_ENTITY_KEY.cdManagementEntity}
        selectedFilterValues={selectedValues}
      />
      <CustomModal
        open={redirectModalOpen}
        handleClose={() => {
          setRedirectModalOpen(false);
          setPendingNavigation(null);
        }}
        heading={REDIRECT_TO_POLICY}
        buttons={[
          {
            label: NO,
            variant: "secondary" as const,
            onClick: () => {
              setRedirectModalOpen(false);
              setPendingNavigation(null);
            },
          },
          {
            label: YES,
            variant: "primary" as const,
            onClick: () => {
              if (pendingNavigation) {
                navigate(pendingNavigation.path, {
                  state: pendingNavigation.state,
                });
              }
              setRedirectModalOpen(false);
              setPendingNavigation(null);
            },
          },
        ]}
        modalBoxStyles={{
          width: "30%",
        }}
      >
        <div>{REDIRECT_TO_POLICY_CONFIRMATION}</div>
      </CustomModal>
    </TableMainContainer>
  );
};

export default CDManagementList;
