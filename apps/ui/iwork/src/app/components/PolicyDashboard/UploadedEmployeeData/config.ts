import { ColDef } from "ag-grid-community";
import ErrorCellRenderer from "./ErrorCellRenderer";

// Constants
const ERROR_TEXT_COLOR = "#ffcdd2";
const NO_ERROR_INDICATOR = "--";

// Interface
export interface RowData {
  employeeId: string;
  intakeType: string;
  employeeName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  mobileNumber: string;
  relation: string;
  reasonForError: string;
}

// Helper function
export const hasRowError = (rowData: RowData): boolean =>
  rowData.reasonForError && rowData.reasonForError !== NO_ERROR_INDICATOR;

// Cell style function
export const getErrorCellStyle = (params: any) =>
  hasRowError(params.data)
    ? { backgroundColor: ERROR_TEXT_COLOR, fontWeight: "500" }
    : {};

// Column definitions
export const EMPLOYEE_TABLE_COLUMNS: ColDef<RowData>[] = [
  {
    field: "employeeId",
    headerName: "Employee ID",
    headerTooltip: "Employee ID",
    tooltipField: "employeeId",
    sortable: false,
    cellStyle: getErrorCellStyle,
  },
  {
    field: "intakeType",
    headerName: "Intake type",
    headerTooltip: "Intake type",
    tooltipField: "intakeType",
    sortable: false,
    cellStyle: getErrorCellStyle,
  },
  {
    field: "employeeName",
    headerName: "Employee name",
    headerTooltip: "Employee name",
    tooltipField: "employeeName",
    sortable: false,
    cellStyle: getErrorCellStyle,
  },
  {
    field: "dateOfBirth",
    headerName: "Date of birth",
    headerTooltip: "Date of birth",
    tooltipField: "dateOfBirth",
    sortable: false,
    cellStyle: getErrorCellStyle,
  },
  {
    field: "gender",
    headerName: "Gender",
    tooltipField: "gender",
    headerTooltip: "Gender",
    sortable: false,
    cellStyle: getErrorCellStyle,
  },
  {
    field: "email",
    headerName: "Email",
    headerTooltip: "Email",
    tooltipField: "email",
    sortable: false,
    cellStyle: getErrorCellStyle,
  },
  {
    field: "mobileNumber",
    headerName: "Mobile number",
    headerTooltip: "Mobile number",
    tooltipField: "mobileNumber",
    sortable: false,
    cellStyle: getErrorCellStyle,
  },
  {
    field: "relation",
    headerName: "Relation",
    headerTooltip: "Relation",
    tooltipField: "relation",
    sortable: false,
    cellStyle: getErrorCellStyle,
  },
  {
    field: "reasonForError",
    headerName: "Reason for error",
    tooltipField: "reasonForError",
    headerTooltip: "Reason for error",
    sortable: false,
    cellRenderer: "ErrorCellRenderer",
    // cellRenderer: ErrorCellRenderer,
    cellStyle: getErrorCellStyle,
  },
  {
    field: "reasonForError",
    headerName: "Reason for error",
    tooltipField: "reasonForError",
    headerTooltip: "Reason for error",
    sortable: false,
    cellRenderer: ErrorCellRenderer,
    cellStyle: getErrorCellStyle,
  },
];

// Dummy data
export const DUMMY_EMPLOYEE_DATA: RowData[] = [
  {
    employeeId: "2024-002",
    intakeType: "Addition",
    employeeName: "Veda vyas",
    dateOfBirth: "24/12/2000",
    gender: "Male",
    email: "Veday@cog.com",
    mobileNumber: "998745678",
    relation: "self",
    reasonForError: "--",
  },
  {
    employeeId: "2024-003",
    intakeType: "Deletion",
    employeeName: "Vippin chandra",
    dateOfBirth: "12/01/1999",
    gender: "Male",
    email: "Vpinc@cog.com",
    mobileNumber: "998745678",
    relation: "self",
    reasonForError: "--",
  },
  {
    employeeId: "2024-004",
    intakeType: "Addition",
    employeeName: "Rajashekar",
    dateOfBirth: "27/12/2001",
    gender: "Male",
    email: "Rajas@cog.com",
    mobileNumber: "998745678",
    relation: "self",
    reasonForError: "--",
  },
  {
    employeeId: "2024-005",
    intakeType: "Deletion",
    employeeName: "Manikonda Rao",
    dateOfBirth: "--",
    gender: "Female",
    email: "manik@cog.com",
    mobileNumber: "998745678",
    relation: "self",
    reasonForError: "Date of birth field is empty",
  },
  {
    employeeId: "2024-006",
    intakeType: "Addition",
    employeeName: "Surya krishna",
    dateOfBirth: "30/08/2000",
    gender: "Female",
    email: "Surya@cog.com",
    mobileNumber: "998745678",
    relation: "self",
    reasonForError: "--",
  },
  {
    employeeId: "2024-007",
    intakeType: "Deletion",
    employeeName: "Rama Raju",
    dateOfBirth: "24th july,1999",
    gender: "Female",
    email: "Rama@cog.com",
    mobileNumber: "998745678",
    relation: "self",
    reasonForError: "Wrong date format",
  },
  {
    employeeId: "2024-008",
    intakeType: "Addition",
    employeeName: "Test User",
    dateOfBirth: "",
    gender: "Male",
    email: "test@cog.com",
    mobileNumber: "998745678",
    relation: "self",
    reasonForError: "Missing date of birth",
  },
  {
    employeeId: "2024-008",
    intakeType: "Addition",
    employeeName: "Test User",
    dateOfBirth: "",
    gender: "Male",
    email: "test@cog.com",
    mobileNumber: "998745678",
    relation: "self",
    reasonForError: "--",
  },
  {
    employeeId: "2024-008",
    intakeType: "Addition",
    employeeName: "Test User",
    dateOfBirth: "",
    gender: "Male",
    email: "test@cog.com",
    mobileNumber: "998745678",
    relation: "self",
    reasonForError: "--",
  },
  {
    employeeId: "2024-008",
    intakeType: "Addition",
    employeeName: "Test User",
    dateOfBirth: "",
    gender: "Male",
    email: "test@cog.com",
    mobileNumber: "998745678",
    relation: "self",
    reasonForError: "--",
  },
  {
    employeeId: "2024-008",
    intakeType: "Addition",
    employeeName: "Test User",
    dateOfBirth: "",
    gender: "Male",
    email: "test@cog.com",
    mobileNumber: "998745678",
    relation: "self",
    reasonForError: "--",
  },
  {
    employeeId: "2024-008",
    intakeType: "Addition",
    employeeName: "Test User",
    dateOfBirth: "",
    gender: "Male",
    email: "test@cog.com",
    mobileNumber: "998745678",
    relation: "self",
    reasonForError: "--",
  },
  {
    employeeId: "2024-008",
    intakeType: "Addition",
    employeeName: "Test User",
    dateOfBirth: "",
    gender: "Male",
    email: "test@cog.com",
    mobileNumber: "998745678",
    relation: "self",
    reasonForError: "--",
  },
];
