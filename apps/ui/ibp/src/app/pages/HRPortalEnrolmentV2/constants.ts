import { EMPLOYEES } from "../../mock-data/hr-portal/employees";
import type {
  EnrolmentDependent,
  EnrolmentECard,
  EnrolmentKpi,
  EnrolmentRow,
  EnrolmentTab,
} from "./types";

export const ENROLMENT_TABS: EnrolmentTab[] = [
  { id: "enrollment", label: "Enrollment", active: true },
  { id: "endorsement", label: "Endorsement" },
];

export const ENROLMENT_KPIS: EnrolmentKpi[] = [
  { id: "lives", label: "Total Lives", value: "49", tint: "#FFFFFF" },
  { id: "employees", label: "Employees", value: "20", tint: "#FFFFFF" },
  { id: "dependents", label: "Dependents", value: "29", tint: "#FFFFFF" },
  { id: "addition", label: "Total Addition", value: "20", tint: "#FFFFFF" },
  { id: "deletion", label: "Total Deletion", value: "2", tint: "#FFFFFF" },
  { id: "enrolled", label: "Total Enrolled", value: "16", tint: "#FFFFFF" },
];

const ENROLMENT_SEED = [
  "EMP001",
  "EMP003",
  "EMP002",
  "EMP004",
  "EMP005",
  "EMP007",
  "EMP008",
  "EMP010",
  "EMP009",
  "EMP006",
  "EMP011",
  "EMP012",
  "EMP013",
  "EMP014",
  "EMP015",
];

const DISPLAY_NAMES: Record<string, string> = {
  EMP001: "Anjali Rentala",
  EMP003: "Rahul Kandula",
  EMP002: "Aaliyah Schuyler",
  EMP004: "Giovanna Tao",
  EMP010: "Kobe Stacy",
  EMP009: "Anya Hirst",
  EMP006: "Euan Lindgren",
};

const ENROL_STATUS_BY_ID: Record<string, string> = {
  EMP001: "Enrolled",
  EMP003: "Enrolled",
  EMP002: "Pending",
  EMP004: "Enrolled",
  EMP010: "Pending",
  EMP009: "Enrolled",
  EMP006: "Enrolled",
};

const STATUS_BY_ID: Record<string, string> = {
  EMP001: "Active",
  EMP003: "Active",
  EMP002: "Inactive",
  EMP004: "Active",
  EMP010: "Active",
  EMP009: "Inactive",
  EMP006: "Active",
};

const ADDITION_TYPE_BY_ID: Record<string, string> = {
  EMP001: "Inception",
  EMP003: "Addition",
  EMP002: "Correction",
  EMP004: "Addition",
  EMP010: "Deletion",
  EMP009: "Inception",
  EMP006: "Addition",
};

const DEPENDENT_DETAILS: Record<string, EnrolmentDependent[]> = {
  EMP001: [
    {
      name: "Harini Rentala",
      relationship: "Spouse",
      gender: "Female",
      dob: "18/09/1991",
    },
    {
      name: "Advik Rentala",
      relationship: "Son",
      gender: "Male",
      dob: "12/01/2018",
    },
  ],
  EMP003: [
    {
      name: "Rahul Kandula",
      relationship: "Husband",
      gender: "Male",
      dob: "29/10/1999",
    },
    {
      name: "Shreyansh Kandula",
      relationship: "Brother",
      gender: "Male",
      dob: "29/10/1999",
    },
  ],
  EMP002: [
    {
      name: "Nathan Schuyler",
      relationship: "Spouse",
      gender: "Male",
      dob: "05/11/1990",
    },
  ],
  EMP004: [
    {
      name: "Mia Tao",
      relationship: "Daughter",
      gender: "Female",
      dob: "14/02/2020",
    },
  ],
  EMP006: [
    {
      name: "Arjun Menon",
      relationship: "Spouse",
      gender: "Male",
      dob: "08/08/1992",
    },
    {
      name: "Kiara Menon",
      relationship: "Daughter",
      gender: "Female",
      dob: "10/05/2019",
    },
  ],
  EMP008: [
    {
      name: "Rishi Iyer",
      relationship: "Spouse",
      gender: "Male",
      dob: "22/07/1986",
    },
    {
      name: "Tara Iyer",
      relationship: "Daughter",
      gender: "Female",
      dob: "12/08/2015",
    },
    {
      name: "Ira Iyer",
      relationship: "Daughter",
      gender: "Female",
      dob: "19/03/2018",
    },
  ],
  EMP011: [
    {
      name: "Meera Babu",
      relationship: "Spouse",
      gender: "Female",
      dob: "14/11/1992",
    },
  ],
  EMP012: [
    {
      name: "Arav Raj",
      relationship: "Son",
      gender: "Male",
      dob: "07/09/2020",
    },
  ],
  EMP015: [
    {
      name: "Nisha Kumar",
      relationship: "Spouse",
      gender: "Female",
      dob: "09/04/1978",
    },
    {
      name: "Tej Kumar",
      relationship: "Son",
      gender: "Male",
      dob: "17/12/2008",
    },
  ],
};

const buildECardDetails = (
  id: string,
  employeeName: string,
  dob: string,
  gender: string,
  sumInsured: string
): EnrolmentECard => ({
  insurer: "NATIONAL HEALTH SHIELD",
  policyName: "Group Mediclaim Policy",
  employeeName,
  employeeId: id,
  dob,
  gender,
  policyNumber: `GHP-${id}-2526`,
  plan: "Group Health Plan A",
  sumInsured,
  validity: "01 Apr 2025 - 31 Mar 2026",
  networkHospitals: "8,500+ across India",
  helpline: "1800-XXX-XXXX",
});

export const ENROLMENT_ROWS: EnrolmentRow[] = ENROLMENT_SEED.map((id) => {
  const employee = EMPLOYEES.find((entry) => entry.id === id);
  const employeeName = DISPLAY_NAMES[id] ?? employee?.name ?? id;
  const dob = employee?.dob ?? "01 Jun 1974";
  const gender = employee?.gender ?? "Male";
  const sumInsured =
    employee?.si?.replace(" Lakh", "L").replace(" ", "") ?? "₹5.0L";
  const dependentDetails = DEPENDENT_DETAILS[id] ?? [];

  return {
    id,
    employeeName,
    employeeCode: id,
    gender,
    dob,
    age: employee?.age ?? 52,
    email: employee?.email ?? "rajesh.kumar@corp.com",
    mobile: employee?.mobile ?? "+91 98765 43210",
    enrolStatus: ENROL_STATUS_BY_ID[id] ?? employee?.enrollStatus ?? "Enrolled",
    additionType: ADDITION_TYPE_BY_ID[id] ?? employee?.addType ?? "Inception",
    sumInsured,
    dependents: String(dependentDetails.length).padStart(2, "0"),
    eCard: "View",
    status: STATUS_BY_ID[id] ?? "Active",
    lastLogin: "10 Feb 2026",
    dependentDetails,
    eCardDetails: buildECardDetails(id, employeeName, dob, gender, sumInsured),
  };
});
