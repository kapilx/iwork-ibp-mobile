import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Check, Close, EditOutlined, ExpandMore } from "@mui/icons-material";
import {
  formatNumberByLocalization, formatAmountWithCurrency,
  type LocalizationConfig,
  useLocalization,
} from "@ui/ui-lib";

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldType = "text" | "number" | "date" | "time" | "yesno" | "select" | "textarea";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  // show this row only when a sibling field (relative key) equals the given value
  showWhen?: { key: string; value: string };
}

interface SectionConfig {
  id: string;
  title: string;
  path: string;
  fields: FieldDef[];
  isArray?: true;
  arrayRenderer?: "billsTable" | "checkboxList";
  masterList?: string[];
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getDeep(obj: unknown, path: string): unknown {
  if (obj == null || !path) return undefined;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc != null && typeof acc === "object")
      return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function setDeep(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const [head, ...rest] = path.split(".");
  if (rest.length === 0) return { ...obj, [head]: value };
  const child =
    obj[head] != null && typeof obj[head] === "object"
      ? (obj[head] as Record<string, unknown>)
      : {};
  return { ...obj, [head]: setDeep(child, rest.join("."), value) };
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, (b as unknown[])[i]));
  }
  if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object).sort();
    const kb = Object.keys(b as object).sort();
    if (ka.join() !== kb.join()) return false;
    return ka.every((k) =>
      deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])
    );
  }
  return String(a) === String(b);
}

function formatValue(val: unknown, type: FieldType, localization?: LocalizationConfig): string {
  if (val === null || val === undefined || val === "") return "—";
  if (type === "number") {
    const n = Number(val);
    return isNaN(n) ? String(val) : formatNumberByLocalization(n, localization);
  }
  return String(val);
}

// ─── Options ──────────────────────────────────────────────────────────────────

const YES_NO_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];
const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];
const OCCUPATION_OPTIONS = [
  { value: "Service", label: "Service" },
  { value: "Self Employed", label: "Self Employed" },
  { value: "Home Maker", label: "Home Maker" },
  { value: "Student", label: "Student" },
  { value: "Retired", label: "Retired" },
  { value: "Other", label: "Other" },
];
const RELATION_OPTIONS = [
  { value: "Self", label: "Self" },
  { value: "Spouse", label: "Spouse" },
  { value: "Child", label: "Child" },
  { value: "Father", label: "Father" },
  { value: "Mother", label: "Mother" },
  { value: "Other", label: "Other" },
];
const ROOM_CATEGORY_OPTIONS = [
  { value: "Day care", label: "Day care" },
  { value: "Single occupancy", label: "Single occupancy" },
  { value: "Twin sharing", label: "Twin sharing" },
  { value: "3 or more beds per room", label: "3 or more beds per room" },
];
const HOSPITAL_TYPE_OPTIONS = [
  { value: "Network", label: "Network" },
  { value: "Non-Network", label: "Non-Network" },
];
const ILLNESS_INJURY_OPTIONS = [
  { value: "Illness", label: "Illness" },
  { value: "Injury", label: "Injury" },
  { value: "Maternity", label: "Maternity" },
];
const ADMISSION_TYPE_OPTIONS = [
  { value: "Emergency", label: "Emergency" },
  { value: "Planned", label: "Planned" },
  { value: "Day Care", label: "Day Care" },
  { value: "Maternity", label: "Maternity" },
];
const STATUS_AT_DISCHARGE_OPTIONS = [
  { value: "Discharge to home", label: "Discharge to home" },
  { value: "Discharge to another hospital", label: "Discharge to another hospital" },
  { value: "Deceased", label: "Deceased" },
];
const INJURY_CAUSE_OPTIONS = [
  { value: "Self Inflicted", label: "Self Inflicted" },
  { value: "Road Traffic Accident", label: "Road Traffic Accident" },
  { value: "Substance abuse / alcohol consumption", label: "Substance abuse / alcohol consumption" },
];

// ─── Document Master Lists ────────────────────────────────────────────────────

const CLAIM_DOCS_PART_A = [
  "Claim form duly signed",
  "Copy of the claim intimation, if any",
  "Hospital Main Bill",
  "Hospital Break-up Bill",
  "Hospital Bill Payment Receipt",
  "Hospital Discharge Summary",
  "Pharmacy Bill",
  "Operation Theater Notes",
  "ECG",
  "Doctor's request for Investigation",
  "Investigation Reports (Including CT / MRI / USG / HPE)",
  "Doctor's Prescriptions",
  "Others",
];

const CLAIM_DOCS_PART_B = [
  "Claim Form duly signed",
  "Investigation reports – x-ray, scan, blood etc.",
  "Original Pre-authorization request (if applicable)",
  "CT / MRI / USG / HPE investigation reports",
  "Copy of the Pre-authorization approval letter (if applicable)",
  "Doctor's reference slip for investigation",
  "Copy of Photo ID Card of patient verified by hospital",
  "Hospital Discharge summary",
  "ECG",
  "Pharmacy bills with prescription",
  "MLC reports & Police FIR (if applicable)",
  "Operation Theatre Notes (if applicable)",
  "Hospital main bill",
  "Hospital break-up bill",
  "Any other, please specify",
];

// ─── Section Config (all 120+ fields) ────────────────────────────────────────

const SECTIONS: SectionConfig[] = [
  // ── Part A ──────────────────────────────────────────────────────────────────
  {
    id: "pA_sA",
    title: "Part A – Section A: Primary Insured",
    path: "partA.sectionA_primaryInsured",
    fields: [
      { key: "policyNumber", label: "Policy Number", type: "text" },
      { key: "slNoCertificateNo", label: "Certificate / Sl. No.", type: "text" },
      { key: "companyTpaIdNo", label: "Company / TPA ID No.", type: "text" },
      { key: "name", label: "Name", type: "text" },
      { key: "address.street", label: "Address", type: "text" },
      { key: "address.city", label: "City", type: "text" },
      { key: "address.state", label: "State", type: "text" },
      { key: "address.pinCode", label: "Pin Code", type: "text" },
      { key: "address.phoneNo", label: "Phone No.", type: "text" },
      { key: "address.emailId", label: "Email ID", type: "text" },
    ],
  },
  {
    id: "pA_sB",
    title: "Part A – Section B: Insurance History",
    path: "partA.sectionB_insuranceHistory",
    fields: [
      { key: "currentlyCoveredByOtherInsurance", label: "Currently covered under any other Mediclaim policy?", type: "yesno" },
      { key: "otherInsuranceCompanyName", label: "Name of Mediclaim Company", type: "text", showWhen: { key: "currentlyCoveredByOtherInsurance", value: "Yes" } },
      { key: "dateOfFirstInsuranceWithoutBreak", label: "Date of commencement of first insurance without break", type: "date" },
      { key: "otherInsurancePolicyNo", label: "Other Insurance Policy No.", type: "text" },
      { key: "otherInsuranceSumInsured", label: "Other Insurance Sum Insured (₹)", type: "number" },
      { key: "hospitalizedInLastFourYears", label: "Hospitalised in Last 4 Years?", type: "yesno" },
      { key: "hospitalizationDate", label: "Hospitalisation Date", type: "date" },
      { key: "hospitalizationDiagnosis", label: "Hospitalisation Diagnosis", type: "text" },
      { key: "previouslyCoveredByOtherInsurance", label: "Previously Covered by Other Insurance?", type: "yesno" },
      { key: "previousInsuranceCompanyName", label: "Previous Insurance Company", type: "text" },
    ],
  },
  {
    id: "pA_sC",
    title: "Part A – Section C: Patient Details",
    path: "partA.sectionC_patientDetails",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "gender", label: "Gender", type: "select", options: GENDER_OPTIONS },
      { key: "ageYears", label: "Age (Years)", type: "number" },
      { key: "ageMonths", label: "Age (Months)", type: "number" },
      { key: "dateOfBirth", label: "Date of Birth", type: "date" },
      { key: "relationshipToPrimaryInsured", label: "Relationship to Primary Insured", type: "select", options: RELATION_OPTIONS },
      { key: "relationshipToPrimaryInsuredOther", label: "Relationship (specify)", type: "text", showWhen: { key: "relationshipToPrimaryInsured", value: "Other" } },
      { key: "occupation", label: "Occupation", type: "select", options: OCCUPATION_OPTIONS },
      { key: "occupationOther", label: "Occupation (specify)", type: "text", showWhen: { key: "occupation", value: "Other" } },
      { key: "address.street", label: "Address", type: "text" },
      { key: "address.city", label: "City", type: "text" },
      { key: "address.state", label: "State", type: "text" },
      { key: "address.pinCode", label: "Pin Code", type: "text" },
      { key: "address.phoneNo", label: "Phone No.", type: "text" },
      { key: "address.emailId", label: "Email ID", type: "text" },
    ],
  },
  {
    id: "pA_sD",
    title: "Part A – Section D: Hospitalisation Details",
    path: "partA.sectionD_hospitalization",
    fields: [
      { key: "hospitalName", label: "Hospital Name", type: "text" },
      { key: "roomCategory", label: "Room Category", type: "select", options: ROOM_CATEGORY_OPTIONS },
      { key: "hospitalizationDueTo", label: "Hospitalisation Due To", type: "select", options: ILLNESS_INJURY_OPTIONS },
      { key: "dateOfInjuryOrDiseaseFirstDetected", label: "Date Injury / Disease First Detected", type: "date" },
      { key: "dateOfAdmission", label: "Date of Admission", type: "date" },
      { key: "timeOfAdmission", label: "Time of Admission", type: "time" },
      { key: "dateOfDischarge", label: "Date of Discharge", type: "date" },
      { key: "timeOfDischarge", label: "Time of Discharge", type: "time" },
      { key: "injuryCause", label: "Injury Cause", type: "select", options: INJURY_CAUSE_OPTIONS },
      { key: "isMedicoLegal", label: "Is Medico Legal?", type: "yesno" },
      { key: "reportedToPolice", label: "Reported to Police?", type: "yesno" },
      { key: "mlcReportAttached", label: "MLC Report Attached?", type: "yesno" },
      { key: "systemOfMedicine", label: "System of Medicine", type: "text" },
    ],
  },
  {
    id: "pA_sE",
    title: "Part A – Section E: Claim Details",
    path: "partA.sectionE_claimDetails",
    fields: [
      { key: "treatmentExpenses.preHospitalization", label: "Pre-Hospitalisation Expenses (₹)", type: "number" },
      { key: "treatmentExpenses.hospitalization", label: "Hospitalisation Expenses (₹)", type: "number" },
      { key: "treatmentExpenses.postHospitalization", label: "Post-Hospitalisation Expenses (₹)", type: "number" },
      { key: "treatmentExpenses.healthCheckup", label: "Health Check-up (₹)", type: "number" },
      { key: "treatmentExpenses.ambulance", label: "Ambulance Charges (₹)", type: "number" },
      { key: "treatmentExpenses.others", label: "Other Expenses (₹)", type: "number" },
      { key: "treatmentExpenses.total", label: "Total Treatment Expenses (₹)", type: "number" },
      { key: "treatmentExpenses.preHospitalizationDays", label: "Pre-Hospitalisation Days", type: "number" },
      { key: "treatmentExpenses.postHospitalizationDays", label: "Post-Hospitalisation Days", type: "number" },
      { key: "domiciliaryHospitalization", label: "Domiciliary Hospitalisation?", type: "yesno" },
      { key: "lumpSumBenefits.hospitalDailyCash", label: "Hospital Daily Cash (₹)", type: "number" },
      { key: "lumpSumBenefits.surgicalCash", label: "Surgical Cash (₹)", type: "number" },
      { key: "lumpSumBenefits.criticalIllness", label: "Critical Illness Benefit (₹)", type: "number" },
      { key: "lumpSumBenefits.convalescence", label: "Convalescence Benefit (₹)", type: "number" },
      { key: "lumpSumBenefits.prePostHospitalizationLumpSum", label: "Pre/Post-Hospitalisation Lump Sum (₹)", type: "number" },
      { key: "lumpSumBenefits.others", label: "Other Lump Sum Benefits (₹)", type: "number" },
      { key: "lumpSumBenefits.total", label: "Total Lump Sum Benefits (₹)", type: "number" },
    ],
  },
  {
    id: "pA_sE_docs",
    title: "Part A – Section E: Claim Documents Submitted",
    path: "partA.sectionE_claimDetails.claimDocumentsSubmitted",
    fields: [],
    isArray: true,
    arrayRenderer: "checkboxList",
    masterList: CLAIM_DOCS_PART_A,
  },
  {
    id: "pA_sF",
    title: "Part A – Section F: Bills Enclosed",
    path: "partA.sectionF_billsEnclosed",
    fields: [],
    isArray: true,
    arrayRenderer: "billsTable",
  },
  {
    id: "pA_sG",
    title: "Part A – Section G: Bank Details",
    path: "partA.sectionG_bankDetails",
    fields: [
      { key: "pan", label: "PAN", type: "text" },
      { key: "accountNumber", label: "Account Number", type: "text" },
      { key: "bankNameAndBranch", label: "Bank Name & Branch", type: "text" },
      { key: "chequeOrDDPayableDetails", label: "Cheque / DD Payable Details", type: "text" },
      { key: "ifscCode", label: "IFSC Code", type: "text" },
    ],
  },
  {
    id: "pA_sH",
    title: "Part A – Section H: Declaration",
    path: "partA.sectionH_declaration",
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "place", label: "Place", type: "text" },
      { key: "signature", label: "Signature (Name)", type: "text" },
    ],
  },

  // ── Part B ──────────────────────────────────────────────────────────────────
  {
    id: "pB_sA",
    title: "Part B – Section A: Hospital Details",
    path: "partB.sectionA_hospital",
    fields: [
      { key: "hospitalName", label: "Hospital Name", type: "text" },
      { key: "hospitalId", label: "Hospital ID", type: "text" },
      { key: "typeOfHospital", label: "Type of Hospital", type: "select", options: HOSPITAL_TYPE_OPTIONS },
      { key: "treatingDoctorName", label: "Treating Doctor Name", type: "text" },
      { key: "qualification", label: "Qualification", type: "text" },
      { key: "registrationNoWithStateCode", label: "Registration No. (with State Code)", type: "text" },
      { key: "phoneNo", label: "Phone No.", type: "text" },
    ],
  },
  {
    id: "pB_sB",
    title: "Part B – Section B: Patient Admitted",
    path: "partB.sectionB_patientAdmitted",
    fields: [
      { key: "patientName", label: "Patient Name", type: "text" },
      { key: "ipRegistrationNumber", label: "IP Registration Number", type: "text" },
      { key: "gender", label: "Gender", type: "select", options: GENDER_OPTIONS },
      { key: "ageYears", label: "Age (Years)", type: "number" },
      { key: "ageMonths", label: "Age (Months)", type: "number" },
      { key: "dateOfBirth", label: "Date of Birth", type: "date" },
      { key: "dateOfAdmission", label: "Date of Admission", type: "date" },
      { key: "timeOfAdmission", label: "Time of Admission", type: "time" },
      { key: "dateOfDischarge", label: "Date of Discharge", type: "date" },
      { key: "timeOfDischarge", label: "Time of Discharge", type: "time" },
      { key: "typeOfAdmission", label: "Type of Admission", type: "select", options: ADMISSION_TYPE_OPTIONS },
      { key: "maternityDateOfDelivery", label: "Maternity: Date of Delivery", type: "date" },
      { key: "maternityGravidaStatus", label: "Maternity: Gravida Status", type: "text" },
      { key: "statusAtDischarge", label: "Status at Discharge", type: "select", options: STATUS_AT_DISCHARGE_OPTIONS },
      { key: "totalClaimedAmount", label: "Total Claimed Amount (₹)", type: "number" },
    ],
  },
  {
    id: "pB_sC",
    title: "Part B – Section C: Ailment Diagnosed",
    path: "partB.sectionC_ailmentDiagnosed",
    fields: [
      // ICD-10
      { key: "icd10.primaryDiagnosis.code", label: "Primary Diagnosis Code (ICD-10)", type: "text" },
      { key: "icd10.primaryDiagnosis.description", label: "Primary Diagnosis Description", type: "text" },
      { key: "icd10.additionalDiagnosis.code", label: "Additional Diagnosis Code", type: "text" },
      { key: "icd10.additionalDiagnosis.description", label: "Additional Diagnosis Description", type: "text" },
      { key: "icd10.comorbidities1.code", label: "Comorbidity 1 Code", type: "text" },
      { key: "icd10.comorbidities1.description", label: "Comorbidity 1 Description", type: "text" },
      { key: "icd10.comorbidities2.code", label: "Comorbidity 2 Code", type: "text" },
      { key: "icd10.comorbidities2.description", label: "Comorbidity 2 Description", type: "text" },
      // ICD-10-PCS
      { key: "icd10Pcs.procedure1.code", label: "Procedure 1 Code (ICD-10-PCS)", type: "text" },
      { key: "icd10Pcs.procedure1.description", label: "Procedure 1 Description", type: "text" },
      { key: "icd10Pcs.procedure2.code", label: "Procedure 2 Code", type: "text" },
      { key: "icd10Pcs.procedure2.description", label: "Procedure 2 Description", type: "text" },
      { key: "icd10Pcs.procedure3.code", label: "Procedure 3 Code", type: "text" },
      { key: "icd10Pcs.procedure3.description", label: "Procedure 3 Description", type: "text" },
      { key: "icd10Pcs.procedureDetails", label: "Procedure Details", type: "textarea" },
      // Clinical flags
      { key: "preAuthorizationObtained", label: "Pre-Authorization Obtained?", type: "yesno" },
      { key: "preAuthorizationNumber", label: "Pre-Authorization Number", type: "text" },
      { key: "reasonForNoPreAuth", label: "Reason for No Pre-Auth", type: "text" },
      { key: "hospitalizationDueToInjury", label: "Hospitalisation Due to Injury?", type: "yesno" },
      { key: "injuryCause", label: "Injury Cause", type: "select", options: INJURY_CAUSE_OPTIONS },
      { key: "substanceAbuseTestConducted", label: "Substance Abuse Test Conducted?", type: "text" },
      { key: "isMedicoLegal", label: "Is Medico Legal?", type: "yesno" },
      { key: "reportedToPolice", label: "Reported to Police?", type: "yesno" },
      { key: "firNo", label: "FIR No.", type: "text" },
      { key: "reasonNotReportedToPolice", label: "Reason Not Reported to Police", type: "text" },
    ],
  },
  {
    id: "pB_sD",
    title: "Part B – Section D: Documents Checklist",
    path: "partB.sectionD_documentsChecklist",
    fields: [],
    isArray: true,
    arrayRenderer: "checkboxList",
    masterList: CLAIM_DOCS_PART_B,
  },
  {
    id: "pB_sE",
    title: "Part B – Section E: Non-Network Hospital",
    path: "partB.sectionE_nonNetworkHospital",
    fields: [
      { key: "address", label: "Address", type: "text" },
      { key: "city", label: "City", type: "text" },
      { key: "state", label: "State", type: "text" },
      { key: "pinCode", label: "Pin Code", type: "text" },
      { key: "phoneNo", label: "Phone No.", type: "text" },
      { key: "registrationNoWithStateCode", label: "Registration No. (with State Code)", type: "text" },
      { key: "hospitalPan", label: "Hospital PAN", type: "text" },
      { key: "numberOfInpatientBeds", label: "No. of Inpatient Beds", type: "number" },
      { key: "facilitiesOt", label: "OT Facility Available?", type: "yesno" },
      { key: "facilitiesIcu", label: "ICU Facility Available?", type: "yesno" },
    ],
  },
  {
    id: "pB_sF",
    title: "Part B – Section F: Declaration",
    path: "partB.sectionF_declaration",
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "place", label: "Place", type: "text" },
      { key: "signature", label: "Signature (Name)", type: "text" },
    ],
  },
];

// ─── EditInput ────────────────────────────────────────────────────────────────

function EditInput({
  type,
  value,
  onChange,
  options,
}: {
  type: FieldType;
  value: unknown;
  onChange: (v: unknown) => void;
  options?: { value: string; label: string }[];
}) {
  const strVal = value === null || value === undefined ? "" : String(value);

  if (type === "yesno" || type === "select") {
    const opts = type === "yesno" ? YES_NO_OPTIONS : (options ?? []);
    return (
      <Select
        size="small"
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        displayEmpty
        sx={{ minWidth: 110, fontSize: "0.8125rem" }}
      >
        <MenuItem value="" disabled>
          <em>Select…</em>
        </MenuItem>
        {opts.map((opt) => (
          <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "0.8125rem" }}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    );
  }

  if (type === "textarea") {
    return (
      <TextField
        size="small"
        multiline
        rows={2}
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        sx={{ minWidth: 220 }}
        inputProps={{ style: { fontSize: "0.8125rem" } }}
      />
    );
  }

  const inputType =
    type === "number" ? "number" : type === "date" ? "date" : type === "time" ? "time" : "text";

  return (
    <TextField
      size="small"
      type={inputType}
      value={type === "number" ? (value === null || value === undefined ? "" : value) : strVal}
      onChange={(e) => {
        if (type === "number") {
          onChange(e.target.value === "" ? null : Number(e.target.value));
        } else {
          onChange(e.target.value);
        }
      }}
      sx={{ minWidth: 160 }}
      inputProps={{ style: { fontSize: "0.8125rem" } }}
    />
  );
}

// ─── EditableBillsTable ───────────────────────────────────────────────────────

function EditableBillsTable({
  bills,
  onUpdate,
}: {
  bills: unknown;
  onUpdate: (newBills: unknown[]) => void;
}) {
  const { localizationData } = useLocalization();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Record<string, unknown>>({});

  const billsArr = Array.isArray(bills) ? (bills as Record<string, unknown>[]) : [];

  function startEdit(idx: number, row: Record<string, unknown>) {
    setEditingIdx(idx);
    setEditRow({ ...row });
  }

  function saveRow() {
    if (editingIdx === null) return;
    const updated = billsArr.map((b, i) => (i === editingIdx ? editRow : b));
    onUpdate(updated);
    setEditingIdx(null);
    setEditRow({});
  }

  function cancelEdit() {
    setEditingIdx(null);
    setEditRow({});
  }

  if (billsArr.length === 0) {
    return (
      <Typography variant="body2" sx={{ py: 1.5, px: 0.5 }}>
        No bills recorded
      </Typography>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow sx={{ backgroundColor: "#f5f7fa" }}>
          {["Sl.", "Bill No.", "Date", "Issued By", "Towards", `Amount (${localizationData?.data?.currencyFormat || "₹"})`, ""].map((h, i) => (
            <TableCell
              key={i}
              sx={{ fontWeight: 600, fontSize: "0.75rem", color: "#777", py: 0.75, px: 1.5 }}
            >
              {h}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {billsArr.map((bill, i) => (
          <TableRow
            key={i}
            sx={{ "&:last-child td": { borderBottom: "none" }, verticalAlign: "middle" }}
          >
            {editingIdx === i ? (
              <>
                <TableCell sx={{ py: 0.75, px: 1.5, fontSize: "0.8125rem" }}>
                  {String(bill.slNo ?? i + 1)}
                </TableCell>
                <TableCell sx={{ py: 0.5, px: 1 }}>
                  <TextField
                    size="small"
                    value={String(editRow.billNo ?? "")}
                    onChange={(e) => setEditRow((p) => ({ ...p, billNo: e.target.value }))}
                    sx={{ minWidth: 90 }}
                    inputProps={{ style: { fontSize: "0.8125rem" } }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.5, px: 1 }}>
                  <TextField
                    size="small"
                    type="date"
                    value={String(editRow.date ?? "")}
                    onChange={(e) => setEditRow((p) => ({ ...p, date: e.target.value || null }))}
                    sx={{ minWidth: 130 }}
                    inputProps={{ style: { fontSize: "0.8125rem" } }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.5, px: 1 }}>
                  <TextField
                    size="small"
                    value={String(editRow.issuedBy ?? "")}
                    onChange={(e) => setEditRow((p) => ({ ...p, issuedBy: e.target.value }))}
                    sx={{ minWidth: 120 }}
                    inputProps={{ style: { fontSize: "0.8125rem" } }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.5, px: 1 }}>
                  <TextField
                    size="small"
                    value={String(editRow.towards ?? "")}
                    onChange={(e) => setEditRow((p) => ({ ...p, towards: e.target.value }))}
                    sx={{ minWidth: 100 }}
                    inputProps={{ style: { fontSize: "0.8125rem" } }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.5, px: 1 }}>
                  <TextField
                    size="small"
                    type="number"
                    value={
                      editRow.amount === null || editRow.amount === undefined ? "" : editRow.amount
                    }
                    onChange={(e) =>
                      setEditRow((p) => ({
                        ...p,
                        amount: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                    sx={{ minWidth: 80 }}
                    inputProps={{ style: { fontSize: "0.8125rem" } }}
                  />
                </TableCell>
                <TableCell sx={{ py: 0.5, px: 1, whiteSpace: "nowrap" }}>
                  <Tooltip title="Save">
                    <IconButton
                      size="small"
                      sx={{ color: "#2e7d32", "&:hover": { backgroundColor: "#e8f5e9" } }}
                      onClick={saveRow}
                    >
                      <Check fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <IconButton
                      size="small"
                      sx={{ color: "#888", "&:hover": { backgroundColor: "#f5f5f5" } }}
                      onClick={cancelEdit}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </>
            ) : (
              <>
                <TableCell sx={{ py: 0.75, px: 1.5, fontSize: "0.8125rem" }}>
                  {String(bill.slNo ?? i + 1)}
                </TableCell>
                <TableCell sx={{ py: 0.75, px: 1.5, fontSize: "0.8125rem" }}>
                  {String(bill.billNo ?? "—")}
                </TableCell>
                <TableCell sx={{ py: 0.75, px: 1.5, fontSize: "0.8125rem" }}>
                  {String(bill.date ?? "—")}
                </TableCell>
                <TableCell sx={{ py: 0.75, px: 1.5, fontSize: "0.8125rem" }}>
                  {String(bill.issuedBy ?? "—")}
                </TableCell>
                <TableCell sx={{ py: 0.75, px: 1.5, fontSize: "0.8125rem" }}>
                  {String(bill.towards ?? "—")}
                </TableCell>
                <TableCell sx={{ py: 0.75, px: 1.5, fontSize: "0.8125rem" }}>
                  {bill.amount != null
                    ? `${formatAmountWithCurrency(Number(bill.amount), localizationData?.data)}`
                    : "—"}
                </TableCell>
                <TableCell sx={{ py: 0.75, px: 1, whiteSpace: "nowrap" }}>
                  <Tooltip title="Edit this row">
                    <IconButton
                      size="small"
                      disabled={editingIdx !== null}
                      sx={{
                        p: 0.3,
                        color: "#215daa",
                        opacity: 0.55,
                        "&:hover": { opacity: 1, backgroundColor: "#e8f0fa" },
                        "&.Mui-disabled": { opacity: 0.2 },
                      }}
                      onClick={() => startEdit(i, bill)}
                    >
                      <EditOutlined sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── EditableCheckboxList ─────────────────────────────────────────────────────

function EditableCheckboxList({
  checked,
  masterList,
  onUpdate,
}: {
  checked: unknown;
  masterList: string[];
  onUpdate: (newChecked: string[]) => void;
}) {
  const checkedSet = new Set(
    Array.isArray(checked) ? (checked as unknown[]).map(String) : []
  );

  function toggle(item: string) {
    const next = new Set(checkedSet);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    onUpdate(Array.from(next));
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, py: 0.5 }}>
      {masterList.map((item) => (
        <FormControlLabel
          key={item}
          control={
            <Checkbox
              size="small"
              checked={checkedSet.has(item)}
              onChange={() => toggle(item)}
              sx={{ py: 0.3, color: "#215daa", "&.Mui-checked": { color: "#215daa" } }}
            />
          }
          label={
            <Typography variant="body2" sx={{ fontSize: "0.8125rem", color: "#333" }}>
              {item}
            </Typography>
          }
          sx={{ ml: 0, mr: 0, alignItems: "center" }}
        />
      ))}
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface ExtractionDataReviewStepProps {
  fullData: Record<string, unknown>;
  onCorrectedDataChange: (data: Record<string, unknown>) => void;
}

export function ExtractionDataReviewStep({
  fullData,
  onCorrectedDataChange,
}: ExtractionDataReviewStepProps) {
  const { localizationData } = useLocalization();
  const currencyLabel = (label: string) =>
    label.replace("(₹)", `(${localizationData?.data?.currencyFormat || "₹"})`);
  const [correctedData, setCorrectedData] = useState<Record<string, unknown>>(
    () => JSON.parse(JSON.stringify(fullData))
  );
  const [corrections, setCorrections] = useState<Record<string, unknown>>({});

  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<unknown>(null);

  function startEdit(fullPath: string, currentVal: unknown) {
    if (editingPath !== null) return;
    setEditingPath(fullPath);
    setEditingValue(currentVal);
  }

  function saveEdit(fullPath: string) {
    const newData = setDeep(correctedData, fullPath, editingValue);
    setCorrectedData(newData);
    const originalValue = getDeep(fullData, fullPath);
    setCorrections((prev) => {
      const next = { ...prev };
      if (deepEqual(editingValue, originalValue)) {
        delete next[fullPath];
      } else {
        next[fullPath] = editingValue;
      }
      return next;
    });
    onCorrectedDataChange(newData);
    setEditingPath(null);
    setEditingValue(null);
  }

  function cancelEdit() {
    setEditingPath(null);
    setEditingValue(null);
  }

  function handleArrayUpdate(path: string, newArray: unknown) {
    const newData = setDeep(correctedData, path, newArray);
    setCorrectedData(newData);
    const originalValue = getDeep(fullData, path);
    setCorrections((prev) => {
      const next = { ...prev };
      if (deepEqual(newArray, originalValue)) {
        delete next[path];
      } else {
        next[path] = newArray;
      }
      return next;
    });
    onCorrectedDataChange(newData);
  }

  const correctionCount = Object.keys(corrections).length;

  return (
    <Box>
      {/* Summary bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          px: 0.5,
        }}
      >
        <Typography variant="body2">
          Review all extracted fields below. Click the{" "}
          <EditOutlined sx={{ fontSize: 13, verticalAlign: "middle", color: "#215daa" }} />{" "}
          icon beside any label to correct a value.
        </Typography>
        {correctionCount > 0 && (
          <Chip
            label={`${correctionCount} correction${correctionCount > 1 ? "s" : ""}`}
            size="small"
            sx={{ backgroundColor: "#e8f5e9", color: "#2e7d32", fontWeight: 600, fontSize: "0.75rem" }}
          />
        )}
      </Box>

      {/* Sections */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {SECTIONS.map((section) => {
          const sectionCorrectionCount = section.isArray
            ? section.path in corrections
              ? 1
              : 0
            : section.fields.filter((f) => `${section.path}.${f.key}` in corrections).length;

          return (
            <Accordion
              key={section.id}
              defaultExpanded={true}
              elevation={0}
              sx={{
                border: "1px solid #e3eaf4",
                borderRadius: "8px !important",
                overflow: "hidden",
                "&::before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: "#215daa" }} />}
                sx={{
                  backgroundColor: "#eef4fb",
                  minHeight: 44,
                  "& .MuiAccordionSummary-content": { margin: "8px 0", alignItems: "center", gap: 1 },
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  sx={{ color: "#215daa", fontSize: "0.85rem" }}
                >
                  {section.title}
                </Typography>
                {sectionCorrectionCount > 0 && (
                  <Chip
                    label={`${sectionCorrectionCount} edited`}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.68rem",
                      backgroundColor: "#c8e6c9",
                      color: "#1b5e20",
                    }}
                  />
                )}
              </AccordionSummary>

              <AccordionDetails sx={{ p: 0 }}>
                {section.isArray ? (
                  <Box sx={{ px: 2, py: 1.5 }}>
                    {section.arrayRenderer === "billsTable" ? (
                      <EditableBillsTable
                        bills={getDeep(correctedData, section.path)}
                        onUpdate={(newBills) => handleArrayUpdate(section.path, newBills)}
                      />
                    ) : (
                      <EditableCheckboxList
                        checked={getDeep(correctedData, section.path)}
                        masterList={section.masterList ?? []}
                        onUpdate={(newChecked) => handleArrayUpdate(section.path, newChecked)}
                      />
                    )}
                  </Box>
                ) : (
                  <Table size="small" sx={{ tableLayout: "fixed" }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                        <TableCell
                          sx={{
                            width: "42%",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            color: "#999",
                            py: 0.75,
                            px: 2,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                          }}
                        >
                          Field
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            color: "#999",
                            py: 0.75,
                            px: 2,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                          }}
                        >
                          Value
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {section.fields.map((field) => {
                        if (field.showWhen) {
                          const condPath = `${section.path}.${field.showWhen.key}`;
                          const condVal = String(getDeep(correctedData, condPath) ?? getDeep(fullData, condPath) ?? "");
                          if (condVal !== field.showWhen.value) return null;
                        }
                        const fullPath = `${section.path}.${field.key}`;
                        const aiValue = getDeep(fullData, fullPath);
                        const isCorrected = fullPath in corrections;
                        const correctedVal = corrections[fullPath];
                        const currentValue = isCorrected ? correctedVal : aiValue;
                        const isEditing = editingPath === fullPath;
                        const isNull = aiValue === null || aiValue === undefined || aiValue === "";

                        return (
                          <TableRow
                            key={field.key}
                            sx={{
                              "&:hover": { backgroundColor: "#f9fbff" },
                              borderBottom: "1px solid #f0f4fa",
                              "&:last-child td": { borderBottom: "none" },
                            }}
                          >
                            {/* Label + edit icon */}
                            <TableCell
                              sx={{ py: 1, px: 2, borderBottom: "none", verticalAlign: "middle" }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Typography
                                  variant="body2"
                                  sx={{ color: "#555", fontSize: "0.8125rem", lineHeight: 1.4 }}
                                >
                                  {currencyLabel(field.label)}
                                </Typography>
                                {!isEditing && (
                                  <Tooltip title="Edit" placement="top">
                                    <IconButton
                                      size="small"
                                      sx={{
                                        p: 0.3,
                                        color: "#215daa",
                                        opacity: 0.55,
                                        flexShrink: 0,
                                        "&:hover": { opacity: 1, backgroundColor: "#e8f0fa" },
                                      }}
                                      onClick={() => startEdit(fullPath, currentValue)}
                                    >
                                      <EditOutlined sx={{ fontSize: 13 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>

                            {/* Value cell */}
                            <TableCell
                              sx={{ py: 1, px: 2, borderBottom: "none", verticalAlign: "middle" }}
                            >
                              {isEditing ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <EditInput
                                    type={field.type}
                                    value={editingValue}
                                    onChange={setEditingValue}
                                    options={field.options}
                                  />
                                  <Tooltip title="Save">
                                    <IconButton
                                      size="small"
                                      sx={{
                                        color: "#2e7d32",
                                        "&:hover": { backgroundColor: "#e8f5e9" },
                                      }}
                                      onClick={() => saveEdit(fullPath)}
                                    >
                                      <Check fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Cancel">
                                    <IconButton
                                      size="small"
                                      sx={{
                                        color: "#888",
                                        "&:hover": { backgroundColor: "#f5f5f5" },
                                      }}
                                      onClick={cancelEdit}
                                    >
                                      <Close fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : isCorrected ? (
                                <Box>
                                  <Typography
                                    variant="body2"
                                    sx={{ color: "#2e7d32", fontWeight: 600, fontSize: "0.8125rem" }}
                                  >
                                    {formatValue(correctedVal, field.type, localizationData?.data)}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "#bbb",
                                      fontSize: "0.7rem",
                                      textDecoration: "line-through",
                                      display: "block",
                                    }}
                                  >
                                    was: {formatValue(aiValue, field.type, localizationData?.data)}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: isNull ? "#ccc" : "#222",
                                    fontSize: "0.8125rem",
                                    fontStyle: isNull ? "italic" : "normal",
                                  }}
                                >
                                  {formatValue(aiValue, field.type, localizationData?.data)}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Box>
  );
}
