import { CellClickedEvent } from "ag-grid-community";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ADD_EMPLOYEE,
  LIST_OF_EMPLOYEES,
  MANAGE_EMPLOYEES,
  TOTAL_EMPLOYEES,
  REBUILD_HIERARCHY,
  DEACTIVATE_EMPLOYEE,
  GENERIC_ERROR,
  TABLE_CONTROLLER_ENTITY_KEY,
  TOTAL_INACTIVE_EMPLOYEES,
} from "../../../constants";
import {
  CardBackground,
  SmartSearch,
  SEARCH,
  endPoints,
  useFormWatcher,
  useTableController,
  CustomModal,
  useApiMutation,
  apiRequest,
  setToastMessage,
  KPICards,
  Table,
  theme,
  getBreadcrumbsFromState,
  createBreadcrumbEntry,
  BREADCRUMB_KEYS,
  buildBreadcrumbState,
  DETAILS_KEYS,
  DETAILS_LABELS,
} from "@ui/ui-lib";
import {
  LoaderOverlay,
  EmployeeListingStyledContainer,
  TitleContainer,
} from "./styles";
import {
  getColumns,
  employeeSearchConfig,
  employeeTableSearchDefaultValues,
} from "./tableConfig";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";

const EmployeeListing = () => {
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const systemSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.systemDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.employeeEntity
      ]
  );
  const userSmartSearchDefaultValues = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.smartSearchValues?.[
        TABLE_CONTROLLER_ENTITY_KEY.employeeEntity
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
    overallData,
    setSort,
    setSmartSearch,
    setColumnOrder,
    columnOrder,
    refetch,
  } = useTableController({
    endpoint: endPoints.allEmployees,
    searchFieldName: "employeeFirstName",
    enabled: !skipQuery,
  });

  const inactiveCount = overallData?.inactiveCount ?? 0;
  const activeCount = overallData?.count ?? 0;
  const totalCount = activeCount + inactiveCount;

  const kpiData = [
    {
      title: TOTAL_EMPLOYEES,
      count: activeCount,
      percentage: totalCount > 0 ? (activeCount / totalCount) * 100 : 0,
      backgroundColor: (theme.palette as any).kpiColors?.purple ?? "#7B5EA7",
      textColor: (theme.palette as any).text?.purple ?? "#fff",
    },
    {
      title: TOTAL_INACTIVE_EMPLOYEES,
      count: inactiveCount,
      percentage: totalCount > 0 ? (inactiveCount / totalCount) * 100 : 0,
      backgroundColor: "#FFE7B7",
      textColor: "#7A4800",
    },
  ];

  useEffect(() => {
    if (formMethods) {
      const subscription = formMethods.watch((values) => {
        const searchValue = formMethods.watch("firstName") || ""; // Assuming 'search' is the input name
        setSearchTerm(searchValue); // Directly updating searchTerm
      });

      return () => subscription.unsubscribe();
    }
  }, [formMethods]);

  useEffect(() => {
    if (overallData) {
      setIsEditMode(true);
    }
  }, [overallData]);

  const { selectedValues, handleReset } = useFormWatcher({
    formMethods,
    setSearchTerm,
    searchDefaultValues: systemSmartSearchDefaultValues,
    searchFieldName: "employeeFirstName",
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.employeeEntity,
    columnOrder,
    dispatch,
  });

  const location = useLocation();
  const prefilledFilterValues = useMemo(() => {
    if (location.state && location.state?.filters) {
      return { ...location.state.filters };
    }
  }, [location.state]);

  const existingBreadcrumbs = getBreadcrumbsFromState(location.state);
  const employeeBreadcrumb =
    existingBreadcrumbs.length > 0
      ? existingBreadcrumbs
      : [
          createBreadcrumbEntry({
            label: MANAGE_EMPLOYEES,
            path: "/employee",
            key: BREADCRUMB_KEYS.EMPLOYEE,
            state: {
              filters: selectedValues ? selectedValues : null,
            },
          }),
        ];

  // Redirect on Cell click
  const onCellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === "iirmEmpId") {
      const destinationConfig = {
        label: DETAILS_LABELS.EMPLOYEE,
        path: `/employee/${event.data.employeeId}`,
        key: DETAILS_KEYS.EMPLOYEE,
      };
      const destinationState = buildBreadcrumbState({
        breadcrumbs: employeeBreadcrumb,
        crumb: destinationConfig,
        state: {
          filters: selectedValues,
        },
      });

      navigate(destinationConfig.path, {
        state: destinationState,
      });
      // navigate(`/employee/${event.data.employeeId}`, {
      //   state: {
      //     filters: selectedValues,
      //   },
      // });
    }
  };

  useEffect(() => {
    if (formMethods && skipQuery) {
      const defValues = prefilledFilterValues || defaultValues;
      formMethods.reset(defValues);
      setSmartSearch(defValues);
      setSkipQuery(false);
    }
  }, [formMethods, skipQuery, defaultValues]);

  const handleCreateEmployee = () => {
    navigate(`/employees/new`);
  };

  const handleRun = () => {
    setSmartSearch(selectedValues);
  };

  const { mutate: rebuildHierarchy, status: rebuildStatus } = useApiMutation({
    config: {
      onSuccess: () => {
        dispatch(setToastMessage(REBUILD_HIERARCHY.REBUILD_HIERARCHY_SUCCESS));
        setOpenRebuildModal(false);
        // Rebuild is synchronous on the backend (rebuildFlatHierarchy runs
        // inside the request, not fire-and-forget), so employee_hierarchy is
        // already fully up to date by the time this fires — refetch the
        // listing so the new Reporting Hierarchy column reflects it
        // immediately instead of only after a manual page reload.
        refetch();
      },
      onError: (error) => {
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? REBUILD_HIERARCHY.REBUILD_HIERARCHY_ERROR;
        dispatch(setToastMessage(errorMessage));
        setOpenRebuildModal(false);
      },
    },
  });

  const confirmRebuildHierarchy = () => {
    setOpenRebuildModal(false);
    rebuildHierarchy({
      endpoint: endPoints.employeeRebuildHierarchy,
      method: "POST",
      data: {}, // or your payload if your backend expects one
    });
  };

  const [openRebuildModal, setOpenRebuildModal] = useState(false);
  const isRebuildLoading = rebuildStatus === "pending";

  // ── Deactivation state ──────────────────────────────────────────────────────
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [deactivatePreview, setDeactivatePreview] = useState<any>(null);
  const [openDeactivateModal, setOpenDeactivateModal] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const { mutate: autoDeactivateMutate, status: autoDeactivateStatus } =
    useApiMutation({
      config: {
        onSuccess: () => {
          dispatch(setToastMessage(DEACTIVATE_EMPLOYEE.DEACTIVATE_SUCCESS));
          setOpenDeactivateModal(false);
          setSelectedEmployee(null);
          setDeactivatePreview(null);
          refetch();
        },
        onError: (error: any) => {
          const msg = Array.isArray(error?.message)
            ? error.message[0]
            : error?.message ?? DEACTIVATE_EMPLOYEE.DEACTIVATE_ERROR;
          dispatch(setToastMessage(msg));
        },
      },
    });

  const handleDeactivateClick = async (rowData: any) => {
    setSelectedEmployee(rowData);
    setIsPreviewLoading(true);
    try {
      const result = await apiRequest(
        endPoints.employeeDeactivatePreview(rowData.employeeId),
        { method: "GET" }
      );
      setDeactivatePreview(result?.data ?? result);
      setOpenDeactivateModal(true);
    } catch {
      dispatch(setToastMessage(DEACTIVATE_EMPLOYEE.DEACTIVATE_ERROR));
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleAutoDeactivate = () => {
    if (!selectedEmployee) return;
    autoDeactivateMutate({
      endpoint: endPoints.employeeAutoDeactivate(selectedEmployee.employeeId),
      method: "POST",
      data: {},
    });
  };

  const handleManualAssign = () => {
    if (!selectedEmployee) return;
    setOpenDeactivateModal(false);
    navigate(`/employee/${selectedEmployee.employeeId}/deactivate`, {
      state: {
        employee: selectedEmployee,
        preview: deactivatePreview,
        breadcrumbs: employeeBreadcrumb,
      },
    });
  };

  const isAutoDeactivating = autoDeactivateStatus === "pending";
  const hasReportingManager = deactivatePreview?.reportingUserId != null;

  // ── Activation state ────────────────────────────────────────────────────────
  const [openActivateModal, setOpenActivateModal] = useState(false);
  const [employeeToActivate, setEmployeeToActivate] = useState<any>(null);

  const { mutate: activateMutate, status: activateStatus } = useApiMutation({
    config: {
      onSuccess: () => {
        dispatch(setToastMessage(DEACTIVATE_EMPLOYEE.ACTIVATE_SUCCESS));
        setOpenActivateModal(false);
        setEmployeeToActivate(null);
        refetch();
      },
      onError: (error: any) => {
        const msg = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? DEACTIVATE_EMPLOYEE.ACTIVATE_ERROR;
        dispatch(setToastMessage(msg));
      },
    },
  });

  const handleActivateClick = (rowData: any) => {
    setEmployeeToActivate(rowData);
    setOpenActivateModal(true);
  };

  const handleConfirmActivate = () => {
    if (!employeeToActivate) return;
    activateMutate({
      endpoint: endPoints.employeeActivate(employeeToActivate.employeeId),
      method: "POST",
      data: {},
    });
  };

  const isActivating = activateStatus === "pending";

  // Memoized columns so the deactivate/activate callback references are stable
  const tableColumns = useMemo(
    () => getColumns(handleDeactivateClick, handleActivateClick),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleEmployeeHirerchyRebuild = () => {
    // add a confirmation dialog
    setOpenRebuildModal(true);
    // You can add your API call or logic here
  };

  return (
    <>
      <EmployeeListingStyledContainer>
        <TitleContainer variant="h1">{MANAGE_EMPLOYEES}</TitleContainer>
        <CardBackground>
          <SmartSearch
            searchFormConfig={employeeSearchConfig}
            searchDefaultValues={defaultValues}
            searchFormMethods={setFormMethods}
            // isEditMode={isEditMode}
            selectedValues={selectedValues}
            searchFieldName="employeeFirstName"
            placeholder={SEARCH}
            formMethods={formMethods}
            onReset={handleReset}
            enableSmartSearch={true}
            onRunFilters={handleRun}
          />
        </CardBackground>

        <KPICards data={kpiData} />

        <Table
          columns={tableColumns}
          rowData={rowData}
          totalRows={totalRows}
          currentPage={currentPage}
          loading={loading}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          setPageSize={setPageSize}
          onCellClicked={onCellClicked}
          primaryActionLabel={ADD_EMPLOYEE}
          onPrimaryActionClick={handleCreateEmployee}
          setSort={setSort}
          title={LIST_OF_EMPLOYEES}
          secondaryActionLabel={REBUILD_HIERARCHY.REBUILD_HIERARCHY}
          onSecondaryActionClick={handleEmployeeHirerchyRebuild}
          setColumnOrder={setColumnOrder}
          columnOrder={columnOrder}
          entityKey={TABLE_CONTROLLER_ENTITY_KEY.employeeEntity}
          selectedFilterValues={selectedValues}
        />
        <CustomModal
          open={openRebuildModal}
          handleClose={() => setOpenRebuildModal(false)}
          heading={REBUILD_HIERARCHY.REBUILD_MODAL_TITLE}
          disablePortal={true}
          buttons={[
            {
              label: REBUILD_HIERARCHY.REBUILD_HIERARCHY_CANCEL,
              onClick: () => setOpenRebuildModal(false),
              variant: "secondary",
            },
            {
              label: REBUILD_HIERARCHY.REBUILD_HIERARCHY_CONFIRM,
              onClick: confirmRebuildHierarchy,
              variant: "primary",
            },
          ]}
        >
          {REBUILD_HIERARCHY.REBUILD_HIERARCHY_CONFIRMATION}
        </CustomModal>
        {/* Activation confirmation modal */}
        <CustomModal
          open={openActivateModal}
          handleClose={() => {
            setOpenActivateModal(false);
            setEmployeeToActivate(null);
          }}
          heading={DEACTIVATE_EMPLOYEE.ACTIVATE_MODAL_TITLE}
          disablePortal={true}
          buttons={[
            {
              label: DEACTIVATE_EMPLOYEE.CANCEL,
              onClick: () => {
                setOpenActivateModal(false);
                setEmployeeToActivate(null);
              },
              variant: "secondary",
            },
            {
              label: DEACTIVATE_EMPLOYEE.ACTIVATE,
              onClick: handleConfirmActivate,
              variant: "primary",
              disabled: isActivating,
              loading: isActivating,
            },
          ]}
        >
          <Typography variant="body2">
            {DEACTIVATE_EMPLOYEE.ACTIVATE_CONFIRMATION}
          </Typography>
        </CustomModal>
        {/* Deactivation confirmation modal */}
        <CustomModal
          open={openDeactivateModal}
          handleClose={() => {
            setOpenDeactivateModal(false);
            setSelectedEmployee(null);
            setDeactivatePreview(null);
          }}
          heading={DEACTIVATE_EMPLOYEE.DEACTIVATE_MODAL_TITLE}
          disablePortal={true}
          buttons={[
            {
              label: DEACTIVATE_EMPLOYEE.CANCEL,
              onClick: () => {
                setOpenDeactivateModal(false);
                setSelectedEmployee(null);
                setDeactivatePreview(null);
              },
              variant: "secondary",
            },
            {
              label: DEACTIVATE_EMPLOYEE.AUTO_ASSIGN,
              onClick: handleAutoDeactivate,
              variant: "primary",
              disabled: !hasReportingManager || isAutoDeactivating,
              loading: isAutoDeactivating,
            },
            {
              label: DEACTIVATE_EMPLOYEE.MANUALLY_ASSIGN,
              onClick: handleManualAssign,
              variant: "secondary",
            },
          ]}
        >
          {deactivatePreview && (
            <Box sx={{ minWidth: 320 }}>
              {!hasReportingManager && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {DEACTIVATE_EMPLOYEE.NO_REPORTING_MANAGER_WARNING}
                </Alert>
              )}
              <Typography variant="body2" sx={{ mb: 1 }}>
                The following records are associated with{" "}
                <strong>
                  {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                </strong>
                :
              </Typography>
              <Box component="ul" sx={{ mt: 0, pl: 2 }}>
                <li>{DEACTIVATE_EMPLOYEE.COMPANIES_LEAD_CRM}: <strong>{deactivatePreview.companiesLeadCrm}</strong></li>
                <li>{DEACTIVATE_EMPLOYEE.COMPANIES_ACCOUNT_MANAGER}: <strong>{deactivatePreview.companiesAccountManager}</strong></li>
                <li>{DEACTIVATE_EMPLOYEE.OPPORTUNITIES}: <strong>{deactivatePreview.opportunities}</strong></li>
                <li>{DEACTIVATE_EMPLOYEE.POLICIES}: <strong>{deactivatePreview.policies}</strong></li>
                <li>{DEACTIVATE_EMPLOYEE.ENDORSEMENTS}: <strong>{deactivatePreview.endorsements}</strong></li>
                <li>{DEACTIVATE_EMPLOYEE.ACTIVITIES}: <strong>{deactivatePreview.activities}</strong></li>
                <li>{DEACTIVATE_EMPLOYEE.REPORTEES}: <strong>{deactivatePreview.reportees}</strong></li>
              </Box>
            </Box>
          )}
        </CustomModal>
      </EmployeeListingStyledContainer>
      {isRebuildLoading && (
        <LoaderOverlay>
          <Typography variant="h5">
            {REBUILD_HIERARCHY.REBUILD_HIERARCHY_LOADER_LABEL}
          </Typography>
          {/* <LinearProgress color="primary" sx={{width: "50%", height: "8px", borderRadius: "10px"}} /> */}
          <CircularProgress />
        </LoaderOverlay>
      )}
    </>
  );
};
export default EmployeeListing;
