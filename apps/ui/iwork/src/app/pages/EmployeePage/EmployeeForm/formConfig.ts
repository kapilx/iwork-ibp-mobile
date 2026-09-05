import {
  endPoints,
  FormFieldConfig,
  requiredErrorMessage,
  textErrorMessage,
  ValidationErrors,
  REGEX_PATTERNS,
  masterDataUtilityFunction,
} from "@ui/ui-lib";
import { ApiResponse, MasterUserResponse } from "./types";

export const employeeReportingManagerUtilityFunction = (
  response: ApiResponse,
  employeeId: number
) => {
  const employees = response?.data?.data ?? [];
  // Check if employeeId exists in the list
  const isValid = employees.some((emp) => emp.employeeId === employeeId);

  // Filter only if valid employeeId is found
  const filteredEmployees = employees.filter((emp) => {
    return emp.employeeId !== employeeId; // Correct: !== excludes current employee
  });

  return filteredEmployees.map(({ employeeId, firstName }) => ({
    value: employeeId,
    label: firstName,
  }));
};

export const userListUtility = (response: MasterUserResponse) => {
  const users = response?.data?.data ?? [];
  return users.map(({ userId, firstName, branch }) => ({
    value: userId,
    label: `${firstName}, ${branch?.name}`,
  }));
};

export const initialFormState = {
  salutationLid: "",
  firstName: "",
  lastName: "",
  emailId: "",
  mobile: "",
  designationId: "",
  organisationId: "",
  verticalId: "",
  departmentId: "",
  branchId: "",
  reportingManagerEmployeeId: "",
  iirmEmpId: "",
  roles: [],
  loginName: "",
  dateOfBirth: "",
  dateOfJoining: "",
};

export const reporteeFormFields: FormFieldConfig[] = [
  {
    key: "reporteeUserId",
    name: "reporteeUserId",
    label: "Reportees",
    type: "selectFieldByApi",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.usersListInEmployee,
      utilityFunction: userListUtility,
      customParams: {
        searchBy: "firstName",
        sortBy: "firstName",
        sortOrder: "ASC",
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },
];

export const employeeFormFields = (
  employeeId: number,
  isIirmHoldingsOrganisation = false
) => [
  {
    key: "salutationLid",
    name: "salutationLid",
    label: "Salutation",
    type: "select",
    // lookUpEndPoint: endPoints.lookUpByName("SALUTATION"),
    apiDependencies: {
      endPoint: endPoints.lookUpByName("SALUTATION"),
    },
    gridColumn: 5,
  },
  {
    key: "firstName",
    name: "firstName",
    label: "First name",
    type: "text",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("First Name"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("First Name", 100),
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "lastName",
    name: "lastName",
    label: "Last name",
    type: "text",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Last Name"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("Last Name", 100),
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "iirmEmpId",
    name: "iirmEmpId",
    label: "Employee ID",
    type: "text",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: "Employee ID is required",
      },
      maxLength: {
        value: 10,
        message: textErrorMessage("Employee ID", 10),
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "emailId",
    name: "emailId",
    label: "Email",
    type: "text",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Email"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("Email", 100),
      },
      pattern: {
        value: REGEX_PATTERNS.EMAIL,
        message: ValidationErrors.EMAIL,
      },
    },
    componentProps: {
      fullWidth: true,
      type: "email",
    },
  },
  {
    key: "mobile",
    name: "mobile",
    label: "Phone number",
    type: "text",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Phone number"),
      },
      maxLength: {
        value: 20,
        message: textErrorMessage("Phone number", 20),
      },
      pattern: {
        value: REGEX_PATTERNS.PHONE,
        message: ValidationErrors.PHONE,
      },
    },
    componentProps: {
      fullWidth: true,
      type: "tel",
    },
  },
  {
    key: "organisationId",
    name: "organisationId",
    label: "Organisation",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.masterDataByName("organisation"),
      utilityFunction: masterDataUtilityFunction,
      clearFieldsOnChange: [
        "verticalId",
        "sbuId",
        "departmentId",
        "branchId",
        "designationId",
      ],
    },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Organization"),
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "sbuId",
    name: "sbuId",
    label: "SBU",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.sbuByOrg,
      dependentField: "organisationId",
      clearFieldsOnChange: ["verticalId", "departmentId"],
      utilityFunction: masterDataUtilityFunction,
    },
    rules: isIirmHoldingsOrganisation
      ? {}
      : {
          required: {
            value: true,
            message: requiredErrorMessage("SBU"),
          },
        },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "verticalId",
    name: "verticalId",
    label: "Vertical",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.verticalsBySbu,
      utilityFunction: masterDataUtilityFunction,
      dependentField: "sbuId",
      clearFieldsOnChange: ["departmentId"],
    },
    rules: isIirmHoldingsOrganisation
      ? {}
      : {
          required: {
            value: true,
            message: requiredErrorMessage("Vertical"),
          },
        },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "departmentId",
    name: "departmentId",
    label: "Department",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.departmentsByVertical,
      utilityFunction: masterDataUtilityFunction,
      dependentField: "verticalId",
    },
    rules: {
      ...(isIirmHoldingsOrganisation
        ? {}
        : {
            required: {
              value: true,
              message: requiredErrorMessage("Department"),
            },
          }),
      maxLength: {
        value: 100,
        message: textErrorMessage("Department", 100),
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "branchId",
    name: "branchId",
    label: "Branch",
    type: "select",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.branchesByOrg,
      utilityFunction: masterDataUtilityFunction,
      dependentField: "organisationId",
    },
    rules: {
      ...(isIirmHoldingsOrganisation
        ? {}
        : {
            required: {
              value: true,
              message: requiredErrorMessage("Branch"),
            },
          }),
      maxLength: {
        value: 100,
        message: textErrorMessage("Branch", 100),
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "designationId",
    name: "designationId",
    label: "Designation",
    type: "select",
    gridColumn: 5,
    // IIRM Holdings has no designations of its own, so scoping by org would
    // leave this dropdown permanently empty. Fall back to the unscoped master
    // list for Holdings only. A string endPoint (no dependentField) also keeps
    // SelectField from disabling the field.
    apiDependencies: isIirmHoldingsOrganisation
      ? {
          endPoint: endPoints.masterDataByName("org_designation"),
          utilityFunction: masterDataUtilityFunction,
        }
      : {
          endPoint: endPoints.designationsByOrg,
          utilityFunction: masterDataUtilityFunction,
          dependentField: "organisationId",
        },
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Designation"),
      },
      maxLength: {
        value: 100,
        message: textErrorMessage("Designation", 100),
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "reportingManagerEmployeeId",
    name: "reportingManagerEmployeeId",
    label: "Reporting manager",
    type: "selectFieldByApi",
    gridColumn: 5,
    apiDependencies: {
      endPoint: endPoints.employeeListOfValues,
      utilityFunction: (data) =>
        employeeReportingManagerUtilityFunction(data, employeeId),
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "loginName",
    name: "loginName",
    label: "Login name",
    type: "text",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: "Login Name is required",
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },
  {
    key: "dateOfBirth",
    name: "dateOfBirth",
    label: "Date of birth",
    type: "date",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Date of Birth"),
      },
      validate: (value: string | Date) => {
        if (!value) return true;
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Set to end of today
        return selectedDate <= today || "Date of birth cannot be in the future";
      },
    },
  },
  {
    key: "dateOfJoining",
    name: "dateOfJoining",
    label: "Date of joining",
    type: "date",
    gridColumn: 5,
    rules: {
      required: {
        value: true,
        message: requiredErrorMessage("Date of Birth"),
      },
      validate: (value: string | Date) => {
        if (!value) return true;
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Set to end of today
        return (
          selectedDate <= today || "Date of joining cannot be in the future"
        );
      },
    },
    componentProps: {
      fullWidth: true,
    },
  },
];

export const employeeFormBreadcrumbs = [
  { label: "Manage employee", path: "/employee" },
  { label: "Add employee details" },
];
