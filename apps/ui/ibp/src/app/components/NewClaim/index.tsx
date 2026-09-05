import { Box, Typography } from "@mui/material";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileText,
  FolderKanban,
  HeartPulse,
  IndianRupee,
  MapPin,
  PlusCircle,
  Trash2,
  Search,
  WalletCards,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { capitalizeFirst } from "../../utils";

import { SectionCard } from "../../pages/HRPortal/styles";

type Dependent = {
  label: string;
  relationship: string;
};

type Employee = {
  id: string;
  name: string;
  dependents: Dependent[];
  email: string;
  department: string;
};

const BASE_EMPLOYEES: Employee[] = [
  {
    id: "EMP-1042",
    name: "Anjali Rentala",
    dependents: [
      { label: "Anjali Rentala", relationship: "Self" },
      { label: "Rahul Rentala", relationship: "Spouse" },
    ],
    email: "anjali.rentala@corp.com",
    department: "Engineering",
  },
  {
    id: "EMP-2187",
    name: "Priya Nair",
    dependents: [
      { label: "Priya Nair", relationship: "Self" },
      { label: "Vijay Nair", relationship: "Spouse" },
    ],
    email: "priya.nair@corp.com",
    department: "HR",
  },
  {
    id: "EMP-3305",
    name: "Arun Mehta",
    dependents: [
      { label: "Arun Mehta", relationship: "Self" },
      { label: "Neha Mehta", relationship: "Spouse" },
    ],
    email: "arun.mehta@corp.com",
    department: "Sales",
  },
];

const HOSPITAL_OPTIONS = [
  "Apollo Hospital",
  "AIG Hospitals",
  "KIMS Hospitals",
  "Fortis Healthcare",
  "Manipal Hospitals",
];

const POLICY_TYPES = [
  {
    id: "gmc",
    title: "Group Mediclaim Policy",
    description: "Protection against accidental injuries and disabilities",
    icon: HeartPulse,
    bg: "#EAF3FF",
    color: "#2B76D2",
  },
  {
    id: "gpa",
    title: "Group Personal Accident Policy",
    description: "Protection against accidental injuries and disabilities",
    icon: WalletCards,
    bg: "#F4E8FF",
    color: "#8E3ADF",
  },
  {
    id: "gtl",
    title: "Group Term Life Policy",
    description: "Life coverage with annual protection benefits",
    icon: FileText,
    bg: "#E8FBEF",
    color: "#1FA55F",
  },
];

const CLAIM_TYPES = [
  {
    id: "cashless",
    title: "Cashless",
    description: "Direct billing to hospital",
    icon: FolderKanban,
    bg: "#EAF3FF",
    color: "#2B76D2",
  },
  {
    id: "reimbursement",
    title: "Reimbursement",
    description: "Pay first, get refund later",
    icon: WalletCards,
    bg: "#FFF1E8",
    color: "#F08B3E",
  },
];

const DOCUMENT_FIELDS = [
  "Claim Form Part A & Part B",
  "Insured KYC documents (Aadhar & PAN)",
  "Treatment Daily sheet (Ksheet)",
  "Investigation Reports",
  "Final Bill",
  "Discharge Summary",
];

function FieldLabel({ children }: { children: string }) {
  return (
    <Typography sx={{ fontSize: 11, color: "#2D3748", mb: 0.8 }}>
      {children}
      <Box component="span" sx={{ color: "#F17171" }}>
        {" "}
        *
      </Box>
    </Typography>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  searchable,
  leadingIcon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  searchable?: boolean;
  leadingIcon?: ReactNode;
}) {
  return (
    <Box>
      <FieldLabel>{label}</FieldLabel>
      <Box sx={{ position: "relative" }}>
        {searchable ? (
          <Search
            size={16}
            color="#7C8795"
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
        ) : leadingIcon ? (
          <Box
            sx={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#7C8795",
              display: "flex",
              pointerEvents: "none",
            }}
          >
            {leadingIcon}
          </Box>
        ) : null}
        <Box
          component="select"
          value={value}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            onChange(event.target.value)
          }
          sx={{
            width: "100%",
            height: 44,
            borderRadius: "10px",
            border: "1px solid #DDE6EF",
            pl: searchable || leadingIcon ? "42px" : "12px",
            pr: "36px",
            fontSize: 12.5,
            color: value ? "#1F2937" : "#98A2B3",
            backgroundColor: "#FFFFFF",
            appearance: "none",
            outline: "none",
          }}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Box>
        <ChevronDown
          size={16}
          color="#7C8795"
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />
      </Box>
    </Box>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  leadingIcon,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  leadingIcon?: ReactNode;
  type?: string;
}) {
  return (
    <Box>
      <FieldLabel>{label}</FieldLabel>
      <Box sx={{ position: "relative" }}>
        {leadingIcon ? (
          <Box
            sx={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#7C8795",
              display: "flex",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            {leadingIcon}
          </Box>
        ) : null}
        <Box
          component="input"
          value={value}
          type={type}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          sx={{
            width: "100%",
            height: 44,
            boxSizing: "border-box",
            borderRadius: "10px",
            border: "1px solid #DDE6EF",
            pl: leadingIcon ? "38px" : "12px",
            pr: "12px",
            fontSize: 12.5,
            color: "#1F2937",
            backgroundColor: "#FFFFFF",
            outline: "none",
            "&::placeholder": { color: "#98A2B3", opacity: 1 },
          }}
        />
      </Box>
    </Box>
  );
}

function SelectionCard({
  title,
  description,
  selected,
  onClick,
  icon: Icon,
  bg,
  color,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  icon: typeof HeartPulse;
  bg: string;
  color: string;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1.8,
        borderRadius: "10px",
        border: selected ? "1px solid #2A75D7" : "1px solid #E6EDF4",
        background: selected ? "#F7FBFF" : "#FFFFFF",
        display: "flex",
        alignItems: "center",
        gap: 1.4,
        cursor: "pointer",
        minHeight: 66,
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          color,
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#26323F" }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 10.2, color: "#8A97A4", mt: 0.25 }}>
          {description}
        </Typography>
      </Box>
      <Box
        sx={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: selected ? "none" : "1px solid #98A2B3",
          background: selected ? "#184C97" : "#FFFFFF",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected ? <CheckCircle2 size={15} color="#FFFFFF" /> : null}
      </Box>
    </Box>
  );
}

function UploadTile({
  label,
  fileName,
  onUpload,
}: {
  label: string;
  fileName?: string;
  onUpload: (fileName: string) => void;
}) {
  return (
    <Box
      sx={{
        minHeight: 96,
        borderRadius: "10px",
        border: "1px solid #2F74D6",
        display: "flex",
        flexDirection: "column",
        background: fileName ? "#F8FBFF" : "#FFFFFF",
        px: 1.4,
        py: 1,
        gap: 0.7,
      }}
    >
      <Typography sx={{ fontSize: 10.5, color: "#475467", fontWeight: 500, lineHeight: 1.3 }}>
        {label}
      </Typography>
      {fileName ? (
        <Box
          sx={{
            flex: 1,
            borderRadius: "6px",
            background: "#EEF4FB",
            px: 1.2,
            py: 0.8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.85 }}>
            <FileText size={16} color="#111827" />
            <Box>
              <Typography sx={{ fontSize: 11, color: "#2F74D6", fontWeight: 500 }}>
                {fileName}
              </Typography>
              <Typography sx={{ fontSize: 9.5, color: "#98A2B3" }}>121kb</Typography>
            </Box>
          </Box>
          <X size={15} color="#111827" />
        </Box>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1 }}>
          <Box
            component="label"
            sx={{
              px: 1.8,
              py: 0.7,
              borderRadius: "7px",
              background: "#184C97",
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <input
              hidden
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file.name);
              }}
            />
            Upload
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: 10.5, color: "#344054" }}>drag & drop</Typography>
            <Typography sx={{ fontSize: 9.5, color: "#98A2B3" }}>PDF, JPG, PNG</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export function NewClaim({ prefillEmployee, defaultEmployee }: {
  prefillEmployee?: { id: string; name: string; dependents: { label: string; relationship: string }[] };
  defaultEmployee?: { id: string; name: string };
} = {}) {
  const [employeeId, setEmployeeId] = useState(prefillEmployee?.id ?? defaultEmployee?.id ?? "");
  const [dependent, setDependent] = useState("");
  const [policyType, setPolicyType] = useState("");
  const [claimType, setClaimType] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [dischargeDate, setDischargeDate] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const [addManually, setAddManually] = useState(false);
  const [manualHospital, setManualHospital] = useState({
    name: "", location: "", state: "", city: "", pincode: "", country: "India", facilityType: "",
  });
  const hospitalInputRef = useRef<HTMLInputElement>(null);

  const employeeList = useMemo<Employee[]>(() => {
    if (!defaultEmployee) return BASE_EMPLOYEES;
    if (BASE_EMPLOYEES.some((e) => e.id === defaultEmployee.id)) return BASE_EMPLOYEES;
    return [
      {
        id: defaultEmployee.id,
        name: defaultEmployee.name,
        dependents: [{ label: defaultEmployee.name, relationship: "Self" }],
        email: "",
        department: "",
      },
      ...BASE_EMPLOYEES,
    ];
  }, [defaultEmployee]);

  const selectedEmployee = useMemo(
    () => prefillEmployee ?? employeeList.find((item) => item.id === employeeId) ?? null,
    [employeeId, prefillEmployee, employeeList]
  );

  const dependentOptions = selectedEmployee
    ? selectedEmployee.dependents.map((item) => ({
        label: `${item.label} (${capitalizeFirst(item.relationship)})`,
        value: item.label,
      }))
    : [];

  const selectedDependent =
    selectedEmployee?.dependents.find((item) => item.label === dependent) ??
    null;

  if (submitted) {
    return (
      <Box
        sx={{
          minHeight: 520,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        <style>{`
          @keyframes scaleIn {
            0%   { transform: scale(0); opacity: 0; }
            60%  { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); }
          }
          @keyframes drawCircle {
            0%   { stroke-dashoffset: 220; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes drawTick {
            0%   { stroke-dashoffset: 60; }
            100% { stroke-dashoffset: 0; }
          }
          .success-circle {
            stroke-dasharray: 220;
            stroke-dashoffset: 220;
            animation: drawCircle 0.55s cubic-bezier(0.65,0,0.45,1) 0.1s forwards;
          }
          .success-tick {
            stroke-dasharray: 60;
            stroke-dashoffset: 60;
            animation: drawTick 0.35s cubic-bezier(0.65,0,0.45,1) 0.55s forwards;
          }
          .success-wrapper {
            animation: scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
          }
        `}</style>

        <Box className="success-wrapper" sx={{ mb: 3 }}>
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
            <circle cx="48" cy="48" r="46" fill="#f0fdf4" />
            <circle
              className="success-circle"
              cx="48"
              cy="48"
              r="35"
              stroke="#22c55e"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
            <polyline
              className="success-tick"
              points="30,49 42,61 66,36"
              stroke="#22c55e"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </Box>

        <Typography sx={{ fontSize: 32, fontWeight: 600, color: "#1F2937" }}>
          Request Submitted Successfully!
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#728192", mt: 1.2 }}>
          Your Claim Intimation request has been submitted for approval
        </Typography>
        <Box
          onClick={() => {
            setSubmitted(false);
            setEmployeeId("");
            setDependent("");
            setPolicyType("");
            setClaimType("");
            setDiagnosis("");
            setHospitalName("");
            setAdmissionDate("");
            setDischargeDate("");
            setEstimatedAmount("");
            setUploadedDocs({});
          }}
          sx={{
            mt: 3,
            px: 3.2,
            py: 1.05,
            borderRadius: "6px",
            border: "1px solid #2A75D7",
            color: "#2A75D7",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            background: "#FFFFFF",
          }}
        >
          Back to Claim Intimation
        </Box>
      </Box>
    );
  }

  return (
    <SectionCard sx={{ mb: 0, p: 0, borderRadius: "10px" }}>
      <Box sx={{ px: 3, pt: 2.5, pb: 3 }}>

        {/* ── 1. Select Policy Type — always first ── */}
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#222F3D" }}>
          Select Policy Type
        </Typography>
        <Typography sx={{ fontSize: 11, color: "#7C8795", mt: 0.3 }}>
          Choose the policy type for which you want to file a claim
        </Typography>
        <Box sx={{ mt: 2.5, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          {POLICY_TYPES.map((policy) => (
            <SelectionCard
              key={policy.id}
              title={policy.title}
              description={policy.description}
              selected={policyType === policy.id}
              onClick={() => setPolicyType(policy.id)}
              icon={policy.icon}
              bg={policy.bg}
              color={policy.color}
            />
          ))}
        </Box>

        {/* ── 2. Select Employee & Dependent ── */}
        <Box sx={{ mt: 4, pt: 3.5, borderTop: "1px solid #EDF1F6" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#222F3D" }}>
            {prefillEmployee ? "Claim Details" : "Select Employee & Dependent"}
          </Typography>

          <Box
            sx={{
              mt: 2.5,
              display: "grid",
              gridTemplateColumns: prefillEmployee ? "1fr" : "1fr 1fr",
              gap: 2,
            }}
          >
            {!prefillEmployee && (
              <SelectField
                label="Select Employee"
                value={employeeId}
                onChange={setEmployeeId}
                searchable
                placeholder="Search for employees"
                options={employeeList.map((employee) => ({
                  label: employee.name,
                  value: employee.id,
                }))}
              />
            )}
            <SelectField
              label="Select Dependent"
              value={dependent}
              onChange={setDependent}
              placeholder="Select"
              options={dependentOptions}
            />
          </Box>

          {selectedEmployee && (
            <Box
              sx={{
                mt: 2.5,
                borderRadius: "14px",
                border: "1px solid #60A5FA",
                background: "#EFF6FF",
                px: 2.1,
                py: 1.75,
                display: "grid",
                gridTemplateColumns: "44px repeat(5, minmax(0, 1fr))",
                alignItems: "center",
                gap: 1.2,
                boxShadow: "0 8px 18px rgba(37, 99, 235, 0.12)",
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#184C97",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
              </Box>
              {[
                ["Employee", selectedEmployee.name],
                ["Dependent", dependent || selectedEmployee.name],
                ["Relation", capitalizeFirst(selectedDependent?.relationship) || "-"],
                ["Date of Birth", "May 15, 1990"],
                ["Enrolled Policies", "05"],
              ].map(([label, value]) => (
                <Box key={label}>
                  <Typography sx={{ fontSize: 11, color: "#667085", mb: 0.45 }}>
                    {label}
                  </Typography>
                  <Typography sx={{ fontSize: 12.4, fontWeight: 600, color: "#1F2937" }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* ── 3. Diagnosis & Claim Details ── */}
        <Box sx={{ mt: 4, pt: 3.5, borderTop: "1px solid #EDF1F6" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#222F3D" }}>
            Diagnosis & Claim Details
          </Typography>
          <Typography sx={{ fontSize: 11, color: "#7C8795", mt: 0.3 }}>
            Provide medical diagnosis and estimated claim amount
          </Typography>

          <Typography sx={{ fontSize: 11, color: "#2D3748", mt: 2.5, mb: 1.2 }}>
            Claim Type
            <Box component="span" sx={{ color: "#F17171" }}>
              {" "}
              *
            </Box>
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {CLAIM_TYPES.map((item) => (
              <SelectionCard
                key={item.id}
                title={item.title}
                description={item.description}
                selected={claimType === item.id}
                onClick={() => setClaimType(item.id)}
                icon={item.icon}
                bg={item.bg}
                color={item.color}
              />
            ))}
          </Box>

          <Box sx={{ mt: 2.5, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <InputField
              label="Diagnosis"
              value={diagnosis}
              onChange={setDiagnosis}
              placeholder="Enter diagnosis"
            />
            <InputField
              label="Date of Admission"
              value={admissionDate}
              onChange={setAdmissionDate}
              placeholder="Select date"
              leadingIcon={<CalendarDays size={14} />}
              type="date"
            />
            <InputField
              label="Proposed Discharge Date"
              value={dischargeDate}
              onChange={setDischargeDate}
              placeholder="Select date"
              leadingIcon={<CalendarDays size={14} />}
              type="date"
            />
            <InputField
              label="Estimated Claim Amount"
              value={estimatedAmount}
              onChange={setEstimatedAmount}
              placeholder="Enter amount"
              leadingIcon={<IndianRupee size={14} />}
            />
          </Box>
        </Box>

        {/* ── 4. Hospital Details ── */}
        <Box sx={{ mt: 4, pt: 3.5, borderTop: "1px solid #EDF1F6" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#222F3D" }}>
            Hospital Details
          </Typography>
          <Typography sx={{ fontSize: 11, color: "#7C8795", mt: 0.3 }}>
            Select the hospital where treatment will be provided
          </Typography>

          <Box sx={{ mt: 2.5 }}>
            <FieldLabel>Hospitals Name</FieldLabel>
            <Box sx={{ position: "relative" }}>
              <Search
                size={16}
                color="#7C8795"
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <Box
                component="input"
                ref={hospitalInputRef}
                value={hospitalSearch}
                placeholder="Search for the hospital name"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setHospitalSearch(e.target.value);
                  setHospitalName("");
                  setAddManually(false);
                  setShowHospitalDropdown(true);
                }}
                onFocus={() => setShowHospitalDropdown(true)}
                onBlur={() => setTimeout(() => setShowHospitalDropdown(false), 150)}
                sx={{
                  width: "100%",
                  height: 44,
                  boxSizing: "border-box",
                  borderRadius: "10px",
                  border: "1px solid #DDE6EF",
                  pl: "42px",
                  pr: hospitalSearch ? "36px" : "12px",
                  fontSize: 12.5,
                  color: "#1F2937",
                  backgroundColor: "#FFFFFF",
                  outline: "none",
                  "&::placeholder": { color: "#98A2B3", opacity: 1 },
                }}
              />
              {hospitalSearch && (
                <X
                  size={15}
                  color="#98A2B3"
                  style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}
                  onClick={() => { setHospitalSearch(""); setHospitalName(""); setAddManually(false); }}
                />
              )}

              {showHospitalDropdown && hospitalSearch && !hospitalName && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #DDE6EF",
                    borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                    zIndex: 50,
                    overflow: "hidden",
                  }}
                >
                  {HOSPITAL_OPTIONS.filter((h) =>
                    h.toLowerCase().includes(hospitalSearch.toLowerCase())
                  ).length > 0 ? (
                    HOSPITAL_OPTIONS.filter((h) =>
                      h.toLowerCase().includes(hospitalSearch.toLowerCase())
                    ).map((h) => (
                      <Box
                        key={h}
                        onMouseDown={() => { setHospitalName(h); setHospitalSearch(h); setShowHospitalDropdown(false); setAddManually(false); }}
                        sx={{
                          px: 2,
                          py: 1.2,
                          fontSize: 12.5,
                          color: "#1F2937",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          "&:hover": { background: "#F4F8FF" },
                          borderBottom: "1px solid #F3F4F6",
                        }}
                      >
                        <MapPin size={13} color="#7C8795" />
                        {h}
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography sx={{ fontSize: 12, color: "#98A2B3", mb: 1.2 }}>
                        No hospitals found for "{hospitalSearch}"
                      </Typography>
                      <Box
                        onMouseDown={() => {
                          setShowHospitalDropdown(false);
                          setAddManually(true);
                          setManualHospital((prev) => ({ ...prev, name: hospitalSearch }));
                        }}
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.75,
                          px: 1.6,
                          py: 0.85,
                          borderRadius: "7px",
                          background: "#EFF6FF",
                          border: "1px solid #BFDBFE",
                          color: "#1D4ED8",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          "&:hover": { background: "#DBEAFE" },
                        }}
                      >
                        <PlusCircle size={14} />
                        Add Hospital Manually
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {addManually && (
              <Box
                sx={{
                  mt: 2,
                  p: 2.5,
                  borderRadius: "12px",
                  border: "1px solid #BFDBFE",
                  background: "#F8FBFF",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>
                    Add Hospital Manually
                  </Typography>
                  <X
                    size={16}
                    color="#98A2B3"
                    style={{ cursor: "pointer" }}
                    onClick={() => { setAddManually(false); setHospitalSearch(""); }}
                  />
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  {[
                    { key: "name", label: "Hospitals Name", placeholder: "Enter the Hospitals Name" },
                    { key: "location", label: "Location", placeholder: "Mindspace road, Gachibowli, near Banjara hills" },
                    { key: "state", label: "State", placeholder: "Telangana" },
                    { key: "city", label: "City", placeholder: "Hyderabad" },
                    { key: "pincode", label: "Pincode", placeholder: "750011" },
                    { key: "country", label: "Country", placeholder: "India" },
                  ].map(({ key, label, placeholder }) => (
                    <Box key={key}>
                      <FieldLabel>{label} <Box component="span" sx={{ color: "#F17171" }}>*</Box></FieldLabel>
                      <Box
                        component="input"
                        value={manualHospital[key as keyof typeof manualHospital]}
                        placeholder={placeholder}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setManualHospital((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        sx={{
                          width: "100%",
                          height: 44,
                          boxSizing: "border-box",
                          borderRadius: "10px",
                          border: "1px solid #DDE6EF",
                          pl: "12px",
                          pr: "12px",
                          fontSize: 12.5,
                          color: "#1F2937",
                          backgroundColor: "#FFFFFF",
                          outline: "none",
                          "&::placeholder": { color: "#98A2B3", opacity: 1 },
                        }}
                      />
                    </Box>
                  ))}
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <FieldLabel>Facility Type <Box component="span" sx={{ color: "#F17171" }}>*</Box></FieldLabel>
                    <Box
                      component="input"
                      value={manualHospital.facilityType}
                      placeholder="Cardiac Surgery"
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setManualHospital((prev) => ({ ...prev, facilityType: e.target.value }))
                      }
                      sx={{
                        width: "100%",
                        height: 44,
                        boxSizing: "border-box",
                        borderRadius: "10px",
                        border: "1px solid #DDE6EF",
                        pl: "12px",
                        pr: "12px",
                        fontSize: 12.5,
                        color: "#1F2937",
                        backgroundColor: "#FFFFFF",
                        outline: "none",
                        "&::placeholder": { color: "#98A2B3", opacity: 1 },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            )}

            {hospitalName && !addManually && (
              <Box
                sx={{
                  mt: 2,
                  borderRadius: "12px",
                  border: "1px solid #60A5FA",
                  background: "#F8FBFF",
                  px: 1.8,
                  py: 1.4,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                  boxShadow: "0 8px 18px rgba(37, 99, 235, 0.12)",
                }}
              >
                <Box sx={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#98A2B3", mb: 0.45 }}>Hospital Name</Typography>
                    <Typography sx={{ fontSize: 12.4, fontWeight: 600, color: "#1F2937" }}>{hospitalName}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#98A2B3", mb: 0.45 }}>Location</Typography>
                    <Typography sx={{ fontSize: 12.4, fontWeight: 600, color: "#1F2937" }}>
                      Near banjara Hills, Hyderabad, Telangana - 500033
                    </Typography>
                  </Box>
                </Box>
                <Trash2
                  size={18}
                  color="#EF4444"
                  style={{ cursor: "pointer" }}
                  onClick={() => { setHospitalName(""); setHospitalSearch(""); }}
                />
              </Box>
            )}
          </Box>
        </Box>

        {/* ── 5. Upload Documents ── */}
        <Box sx={{ mt: 4, pt: 3.5, borderTop: "1px solid #EDF1F6" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#222F3D", mb: 2 }}>
            Upload Documents
            <Box component="span" sx={{ color: "#F17171" }}>
              {" "}
              *
            </Box>
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
            {DOCUMENT_FIELDS.map((field) => (
              <UploadTile
                key={field}
                label={field}
                fileName={uploadedDocs[field]}
                onUpload={(fileName) =>
                  setUploadedDocs((current) => ({
                    ...current,
                    [field]: fileName,
                  }))
                }
              />
            ))}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid #EDF1F6",
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            px: 2.4,
            py: 1.05,
            borderRadius: "6px",
            border: "1px solid #2A75D7",
            color: "#2A75D7",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Back
        </Box>
        <Box
          onClick={() => setSubmitted(true)}
          sx={{
            px: 2.6,
            py: 1.05,
            borderRadius: "6px",
            background: "#1D57B7",
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Submit
        </Box>
      </Box>
    </SectionCard>
  );
}

export default NewClaim;
