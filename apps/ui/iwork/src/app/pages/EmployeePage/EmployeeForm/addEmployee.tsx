import { Box, Button, IconButton } from "@mui/material";
import React, { useEffect, useMemo, useState, KeyboardEvent } from "react";
import { SubmitHandler, UseFormReturn } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  ADD_EMPLOYEE_ACCESS_RULES,
  ADD_EMPLOYEE_FORM_KEYS,
  ADD_EMPLOYEE_FORM_LABELS,
  ADD_EMPLOYEE_FORM_TITLES,
  ALERT_MESSAGES,
} from "../../../constants";
import {
  StyledNextButton,
  StyledPageContainer,
} from "../../CompanyPage/AddCompany/styles";
import { StyledCrumbContainer } from "../../InsurerContactPage/InsurerAddContacts/styles";
import {
  employeeFormBreadcrumbs,
  employeeFormFields,
  initialFormState,
  reporteeFormFields,
} from "./formConfig";
import {
  CommonBreadcrumb,
  CustomModal,
  DynamicForm,
  FormSection,
  FormActionsContainer,
  BUTTON_LABELS,
  BUTTON_TYPE,
  BUTTON_VARIANTS,
  httpMethods,
  SUCCESS_MESSAGE,
  endPoints,
  useApiQuery,
  useApiMutation,
  setToastMessage,
  normalizePayload,
  FormFieldConfig,
  DynamicTable,
  TableColumn,
} from "@ui/ui-lib";
import { AccessWarningModalContent, TitleContainer } from "./styles";
import {
  IEmployeeForm,
  OrganisationApiResponse,
  RoleApiResponse,
} from "./types";
import RolePicker from "./RolePicker";
import DeleteIcon from "@mui/icons-material/Delete"; // Standard MUI delete icon

interface OrganisationMasterData {
  id: number;
  key?: string;
  organisationKey?: string;
}

const EmployeeForm: React.FC = () => {
  const { id: employeeId } = useParams();
  const [formMethods, setFormMethods] =
    useState<UseFormReturn<IEmployeeForm>>(); // For the main employee form
  const [reporteeSelectorFormMethods, setReporteeSelectorFormMethods] =
    useState<UseFormReturn<IEmployeeForm>>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // State for form submission loading
  const [selectedRoles, setSelectedRoles] = useState<number[]>(
    initialFormState.roles || []
  );
  const [selectedReportees, setSelectedReportees] = useState<any[]>([]);
  const [isAccessWarningModalOpen, setIsAccessWarningModalOpen] =
    useState(false);
  const [pendingSubmitData, setPendingSubmitData] =
    useState<IEmployeeForm | null>(null);

  const isEditMode = location.pathname.includes("edit");
  const dispatch = useDispatch();

  const {
    data: employeeDataResponse,
    isLoading: isEmployeeLoading,
    error: employeeFetchError,
  } = useApiQuery({
    queryKey: ["employeeById", employeeId],
    url: endPoints.employeeById(Number(employeeId)),
    enabled: !!employeeId, // Only fetch if in edit mode
  });

  const { data: reporteeListData } = useApiQuery({
    queryKey: ["reporteeListData"],
    url: endPoints.usersList,
  });
  const { data: roleListResponse } = useApiQuery({
    queryKey: ["roleList"],
    url: endPoints.employeeRoleList,
  });
  const { data: organisationListResponse } = useApiQuery({
    queryKey: ["organisationList"],
    url: endPoints.masterDataByName("organisation"),
  });
  const isReporteeListLoading = reporteeListData === undefined; // Simple check if data hasn't loaded yet
  const rolesFromApi = (roleListResponse as RoleApiResponse)?.data?.data || [];
  const organisationsFromApi =
    (organisationListResponse as OrganisationApiResponse)?.data?.data || [];
  const isSubmitInProgress = loading || isEmployeeLoading;

  const [isIirmHoldingsOrganisationSelected, setIsIirmHoldingsOrganisationSelected] =
    useState(false);

  useEffect(() => {
    if (!formMethods) return;

    const updateOrganisationFlag = (organisationId: unknown) => {
      const organisations: OrganisationMasterData[] =
        organisationListResponse?.data?.data ?? [];
      const selectedOrganisation = organisations.find(
        ({ id }) => String(id) === String(organisationId ?? "")
      );
      const orgKey = (selectedOrganisation?.organisationKey || selectedOrganisation?.key)
        ?.trim()
        .toLowerCase();
      setIsIirmHoldingsOrganisationSelected(
        orgKey === ADD_EMPLOYEE_ACCESS_RULES.IIRM_HOLDINGS_KEY
      );
    };

    // Allow name===undefined so reset() also triggers the org flag update
    const subscription = formMethods.watch((value, { name }) => {
      if (name && name !== "organisationId") return;
      updateOrganisationFlag(value?.organisationId);
    });

    updateOrganisationFlag(formMethods.getValues("organisationId"));

    return () => subscription.unsubscribe();
  }, [formMethods, organisationListResponse]);

  // Sync react-hook-form's internal rule registry whenever the IIRM Holdings flag changes.
  // Controller only registers rules on mount, so we must call register() directly to
  // override the cached required rule without remounting the form.
  useEffect(() => {
    if (!formMethods) return;
    const reg = formMethods.register as (name: string, options: object) => void;
    const iirmFields = [
      { name: "sbuId", label: "SBU" },
      { name: "verticalId", label: "Vertical" },
      { name: "departmentId", label: "Department" },
      { name: "branchId", label: "Branch" },
    ];
    if (isIirmHoldingsOrganisationSelected) {
      iirmFields.forEach(({ name }) => reg(name, { required: false }));
      (formMethods.clearErrors as (names: string[]) => void)(
        iirmFields.map((f) => f.name)
      );
    } else {
      iirmFields.forEach(({ name, label }) =>
        reg(name, { required: { value: true, message: `${label} is required` } })
      );
    }
  }, [isIirmHoldingsOrganisationSelected, formMethods]);

  useEffect(() => {
    if (employeeDataResponse?.data) {
      const { data } = employeeDataResponse;

      const transformedData = {
        salutationLid: data?.salutation?.id,
        firstName: data?.firstName,
        lastName: data?.lastName,
        emailId: data?.emailId,
        mobile: data?.mobile,
        organisationId: data?.organisation?.id,
        sbuId: data?.sbu?.id,
        verticalId: data?.vertical?.id,
        departmentId: data?.department?.id,
        designationId: data?.designation?.id,
        reportingManagerEmployeeId: data?.reportingTo?.employeeId,
        branchId: data?.branch?.id,
        iirmEmpId: data?.iirmEmpId,
        loginName: data?.loginName,
        dateOfBirth: data?.dateOfBirth,
        dateOfJoining: data?.dateOfJoining,
      };

      formMethods?.reset(transformedData);

      // Load existing reportees into the table state
      if (data?.reportees) {
        const existingReporteesMapped = data.reportees.map((reportee: any) => ({
          // Map existing reportee data structure to the one expected by the table
          userId: reportee.userId, // Assuming userId exists
          firstName: reportee.firstName || reportee.name || "N/A", // Adjust field names based on your API response
          emailId: reportee.emailId || "N/A", // Assuming reportingTo or managerName exists
          isPersisted: true, // Mark as existing, cannot be deleted via UI
        }));
        setSelectedReportees(existingReporteesMapped);
      }
      if (data?.userRoles) {
        setSelectedRoles(data.userRoles.map((r: any) => r.id));
      }
    }
  }, [employeeDataResponse, formMethods]);

  useEffect(() => {
    if (!employeeFetchError) return;
    const errorMessage = Array.isArray((employeeFetchError as any)?.message)
      ? (employeeFetchError as any).message[0]
      : (employeeFetchError as any)?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
    dispatch(setToastMessage(errorMessage));
  }, [dispatch, employeeFetchError]);

  const { mutate } = useApiMutation({
    config: {
      onSuccess: (response) => {
        dispatch(setToastMessage(response?.message || SUCCESS_MESSAGE));
        const employeeId = response?.data?.employeeId;
        setTimeout(() => navigate(`/employee/${employeeId}`), 1000);
      },
      onError: (error) => {
        setLoading(false);
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });

  const hasHighAccessRoleSelected = () =>
    selectedRoles.some((roleId) => {
      const numericRoleId = Number(roleId);
      const role = rolesFromApi.find(
        (item) => Number(item.id) === numericRoleId
      );
      const roleKey = role?.roleKey?.trim().toUpperCase() || "";
      const roleName = role?.name?.trim().toUpperCase() || "";

      return (
        roleKey === ADD_EMPLOYEE_ACCESS_RULES.ROLE_KEY_LEADERSHIP ||
        roleKey === ADD_EMPLOYEE_ACCESS_RULES.ROLE_KEY_SUPER_USER ||
        roleName.includes("LEADERSHIP") ||
        roleName.includes("SUPER USER")
      );
    });

  const isNonIirmHoldingsOrganisation = (organisationId?: string | number) => {
    if (!organisationId) return false;

    const numericOrgId = Number(organisationId);
    const selectedOrganisation = organisationsFromApi.find(
      (organisation) => Number(organisation.id) === numericOrgId
    );
    if (!selectedOrganisation) return true;

    const organisationKey = selectedOrganisation?.key?.trim().toLowerCase();
    if (!organisationKey) return true;

    return organisationKey !== ADD_EMPLOYEE_ACCESS_RULES.IIRM_HOLDINGS_KEY;
  };

  const submitEmployee: SubmitHandler<IEmployeeForm> = (data) => {
    setLoading(true);
    const endpoint = isEditMode
      ? endPoints.employeeById(Number(employeeId))
      : endPoints.allEmployees;

    let payload = normalizePayload(data);

    // Format dates to YYYY-MM-DD if they exist
    if (payload.dateOfBirth) {
      payload.dateOfBirth = new Date(payload.dateOfBirth)
        .toISOString()
        .split("T")[0];
    }
    if (payload.dateOfJoining) {
      payload.dateOfJoining = new Date(payload.dateOfJoining)
        .toISOString()
        .split("T")[0];
    }

    payload = { ...payload, roles: selectedRoles };
    payload = {
      ...payload,
      reportees: selectedReportees.map((reportee) => reportee.userId),
    };

    mutate({
      endpoint,
      method: isEditMode ? httpMethods.PUT : httpMethods.POST,
      data: payload,
    });
  };

  const onSubmit: SubmitHandler<IEmployeeForm> = (data) => {
    if (isSubmitInProgress) return;

    const shouldShowAccessWarning =
      hasHighAccessRoleSelected() &&
      isNonIirmHoldingsOrganisation(data.organisationId);

    if (shouldShowAccessWarning) {
      setPendingSubmitData(data);
      setIsAccessWarningModalOpen(true);
      return;
    }

    submitEmployee(data);
  };

  const handleAccessWarningCancel = () => {
    setPendingSubmitData(null);
    setIsAccessWarningModalOpen(false);
  };

  const handleAccessWarningSubmit = () => {
    if (!pendingSubmitData || isSubmitInProgress) return;
    setIsAccessWarningModalOpen(false);
    submitEmployee(pendingSubmitData);
    setPendingSubmitData(null);
  };

  /**
   * Memoized version of form fields to dynamically update the API endpoint
   * for the "reportingManagerEmployeeId" field based on edit mode and employeeId.
   *
   * - In edit mode: Uses the employee-specific endpoint.
   * - In add mode: Uses the default endpoint defined in the form field config.
   *
   * Dependencies: Recomputes only when `employeeId` or `isEditMode` changes.
   */
  // const memoizedFormFields = useMemo(() => {
  //   if (isEditMode && employeeId) {
  //     return employeeFormFields.map((field) => {
  //       if (field.key === "reportingManagerEmployeeId") {
  //         const updatedField = {
  //           ...field,
  //           apiDependencies: {
  //             ...field.apiDependencies,
  //             endPoint: endPoints.employeeListOfValues,
  //           },
  //         };
  //         return updatedField;
  //       }
  //       return field;
  //     });
  //   } else {
  //     return employeeFormFields;
  //   }
  // }, [employeeId, isEditMode]); // Re-run when employeeId or isEditMode changes

  const renderFormContent = () => {
    return (
      <Box>
        <FormSection title={ADD_EMPLOYEE_FORM_TITLES.EMPLOYEE_FORM}>
          <DynamicForm
            key={ADD_EMPLOYEE_FORM_KEYS.EMPLOYEE_FORM_FIELDS}
            formConfig={employeeFormFields(
              Number(employeeId),
              isIirmHoldingsOrganisationSelected
            )}
            defaultValues={initialFormState}
            formMethods={setFormMethods} // Pass setFormMethods
            isEditMode={isEditMode}
          />
        </FormSection>
      </Box>
    );
  };

  const handleAddReportee = () => {
    const selectedUserId =
      reporteeSelectorFormMethods?.getValues("reporteeUserId");

    if (!selectedUserId) {
      // No user selected in the dropdown
      return;
    }

    // Find the selected user's details from the fetched list
    const reporteeDetails = reporteeListData?.data?.data?.find(
      (u: { userId: any }) => u.userId === selectedUserId
    );

    if (!reporteeDetails) {
      console.error("Reportee details not found for userId:", selectedUserId);
      dispatch(setToastMessage(`Error: Could not retrieve reportee details.`));
      return;
    }

    // Check if the reportee is already added
    if (selectedReportees.some((r) => r.userId === reporteeDetails.userId)) {
      dispatch(
        setToastMessage(
          `Reportee "${reporteeDetails.firstName}" is already added.`
        )
      );
      return;
    }

    // Add the reportee to the state
    setSelectedReportees([
      ...selectedReportees,
      { ...reporteeDetails, isPersisted: false },
    ]); // Mark as newly added

    // Clear the select box value
    reporteeSelectorFormMethods?.setValue("reporteeUserId", "");
  };

  const handleRemoveReportee = (userIdToRemove: string) => {
    setSelectedReportees((prevReportees) =>
      prevReportees.filter((reportee) => reportee.userId !== userIdToRemove)
    );
  };

  const handleReporteeInputKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent default form submission if any
      handleAddReportee();
    }
  };

  const reporteeTableColumns = useMemo<TableColumn<any>[]>(
    () => [
      {
        field: "firstName",
        headerName: "Name",
        flex: 1,
      },
      {
        // Assuming emailId or reportingTo?.firstName holds the manager's name
        // Adjust 'field' based on the actual structure of your user data
        field: "emailId",
        headerName: "Email",
        flex: 1,
        // Optional: Use renderCell if manager's name is nested or needs formatting
        // renderCell: (value, row) => row.reportingTo?.firstName || 'N/A',
      },
      {
        field: "action", // Placeholder for delete action
        headerName: "Action",
        width: "100px", // Fixed width for the action column
        renderCell: (_value, row) => {
          // Only show delete icon for non-persisted (newly added) reportees
          if (!row.isPersisted) {
            return (
              <IconButton
                onClick={() => handleRemoveReportee(row.userId)}
                size="small"
                aria-label="delete reportee"
              >
                <DeleteIcon />
              </IconButton>
            );
          }
          return null; // No action for persisted reportees
        },
      },
    ],
    []
  );

  return (
    <StyledPageContainer>
      {/* Form Title */}
      <TitleContainer variant="h1">
        {ADD_EMPLOYEE_FORM_TITLES.EMPLOYEE_FORM}
      </TitleContainer>

      <StyledCrumbContainer>
        <CommonBreadcrumb crumbs={employeeFormBreadcrumbs} />
      </StyledCrumbContainer>

      {/* Dynamic Form */}
      {renderFormContent()}

      <FormSection title={ADD_EMPLOYEE_FORM_LABELS.ASSIGN_ROLES} showHeader>
        <RolePicker value={selectedRoles} onChange={setSelectedRoles} />
      </FormSection>

      {/* Reportees Section */}
      <FormSection title={ADD_EMPLOYEE_FORM_LABELS.REPORTEES} showHeader>
        <Box
          sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}
          onKeyDown={handleReporteeInputKeyDown}
        >
          {/* Dynamic Form for Reportee Select */}
          <Box sx={{ flexGrow: 1, minWidth: 300 }}>
            <DynamicForm
              key="reportee-select-form" // Use a specific key for this form
              formConfig={reporteeFormFields as FormFieldConfig<any>[]}
              defaultValues={{ reporteeUserId: "" }} // Ensure default value is set
              formMethods={setReporteeSelectorFormMethods} // Pass dedicated setter
              // No onChange handler needed here, state is managed by react-hook-form
            />
          </Box>
          {/* Add Reportee Button */}
          <Button
            sx={{ mt: 4, ml: 2 }} // Adjusted margin to align better with typical form field height
            variant="contained"
            onClick={handleAddReportee}
            disabled={isReporteeListLoading || isSubmitInProgress} // Disable if reportee list is loading or form is submitting
          >
            {ADD_EMPLOYEE_FORM_LABELS.ADD_REPORTEE}
          </Button>
        </Box>

        {/* Reportees Table */}
        <DynamicTable
          rows={selectedReportees}
          columns={reporteeTableColumns}
          disableRowActions={false} // Enable action column rendering
          // Add minHeight to the Paper component within DynamicTable
          sx={{ minHeight: "400px" }}
        />
      </FormSection>

      {/* Submit Button */}
      <FormActionsContainer>
        <StyledNextButton
          type={BUTTON_TYPE.BUTTON}
          variantType={BUTTON_VARIANTS.PRIMARY}
          onClick={formMethods ? formMethods.handleSubmit(onSubmit) : undefined}
          role="submit"
          data-testid="submit-button"
          loading={isSubmitInProgress}
          disabled={isSubmitInProgress} // Disable submit button while loading
          label={isSubmitInProgress ? "" : BUTTON_LABELS.SUBMIT}
        />
        {/* Add Reset button if needed */}
        {/* <StyledNextButton
          type={BUTTON_TYPE.BUTTON}
          variantType={BUTTON_VARIANTS.SECONDARY}
          onClick={() => formMethods?.reset(initialFormState)}
          label={BUTTON_LABELS.RESET}
        /> */}
      </FormActionsContainer>

      <CustomModal
        open={isAccessWarningModalOpen}
        handleClose={handleAccessWarningCancel}
        heading={ADD_EMPLOYEE_FORM_LABELS.ACCESS_WARNING_HEADING}
        buttons={[
          {
            label: BUTTON_LABELS.CANCEL,
            variant: "secondary",
            onClick: handleAccessWarningCancel,
            disabled: isSubmitInProgress,
          },
          {
            label: BUTTON_LABELS.PROCEED,
            variant: "primary",
            onClick: handleAccessWarningSubmit,
            loading: isSubmitInProgress,
            disabled: isSubmitInProgress,
          },
        ]}
        headingStyles={{
          fontWeight: 500,
          color: "#111111",
        }}
        modalBoxStyles={{
          width: "30%",
        }}
      >
        <AccessWarningModalContent>
          {ADD_EMPLOYEE_FORM_LABELS.ACCESS_WARNING_MESSAGE}
        </AccessWarningModalContent>
      </CustomModal>
    </StyledPageContainer>
  );
};

export default EmployeeForm;
