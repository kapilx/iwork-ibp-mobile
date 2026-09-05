import { Box, CircularProgress, Typography } from "@mui/material";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileText,
  FolderKanban,
  HeartPulse,
  IndianRupee,
  MapPin,
  PlusCircle,
  Search,
  Trash2,
  Upload,
  WalletCards,
  X,
} from "lucide-react";
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  endPoints,
  formatAmountWithCurrency,
  type LocalizationConfig,
  useApiMutation,
  useLocalization,
} from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { getCompanyId } from "../../utils/companyConfig";
import { capitalizeFirst } from "../../utils";
import { useHRReport } from "../../hooks/useHRReport";

/* ── Constants ───────────────────────────────────────────────────────────── */


const CLAIM_TYPES = [
  { id: "CASHLESS", title: "Cashless", description: "Direct billing to hospital", icon: FolderKanban, bg: "#EAF3FF", color: "#2B76D2" },
  { id: "REIMBURSEMENT", title: "Reimbursement", description: "Pay first, get refund later", icon: WalletCards, bg: "#FFF1E8", color: "#F08B3E" },
];

const REIMBURSEMENT_DOC_TYPES = [
  { value: "CLAIM_FORM_PART_A_B", label: "Claim Form Part A & Part B" },
  { value: "INSURED_KYC_AADHAR_PAN", label: "Insured KYC (Aadhar & PAN)" },
  { value: "CANCEL_CHEQUE_OR_BANK_STATEMENT", label: "Cancel Cheque / Bank Statement" },
  { value: "DISCHARGE_SUMMARY", label: "Discharge Summary" },
  { value: "TREATMENT_DAILY_SHEET", label: "Treatment Daily Sheet" },
  { value: "INVESTIGATION_REPORTS", label: "Investigation Reports" },
  { value: "FINAL_BILL", label: "Final Bill" },
];

const CASHLESS_DOC_TYPES = [
  { value: "GHPL_CARD", label: "GHPL Card" },
  { value: "PAN_AND_AADHAR", label: "PAN and Aadhar" },
  { value: "PREVIOUS_HOSPITAL_DETAILS_FOR_PLANNED_ADMISSION", label: "Previous Hospital Details (Planned Admission)" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

/* ── Types ────────────────────────────────────────────────────────────────── */

type EmployeePolicy = { policyId: number; policyName: string; policyTypeKey: string; sumInsured?: string | number; balance?: string | number; startDate?: string; policyNumber?: string; insurerPolicyNumber?: string };
type EmployeeDependent = { id: number; name: string; relationship?: string; dob?: string; gender?: string };
type EmployeeRow = { employeeId: number; companyEmployeeId: string; employeeName: string; fullName: string | null; enrolledPolicyId?: number | null; dependents?: EmployeeDependent[] };
type DepData = { id: string | number; name: string; relationship?: string; relation?: string; relationshipType?: string; dob?: string; dateOfBirth?: string };
type UploadedDoc = { documentId: number; fileUpload: { id: number; fileName: string } };
type StepErrors = Partial<Record<string, string>>;

/* ── Sub-components ──────────────────────────────────────────────────────── */

function FieldLabel({ children, required = true }: { children: string; required?: boolean }) {
  return (
    <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: "#374151", mb: 0.75 }}>
      {children}{required && <Box component="span" sx={{ color: "#EF4444", ml: 0.5 }}>*</Box>}
    </Typography>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#EF4444", mt: 0.75 }}>{msg}</Typography>;
}

function SelectionCard({ title, description, selected, onClick, icon: Icon, bg, color }: {
  title: string; description: string; selected: boolean; onClick: () => void;
  icon: typeof HeartPulse; bg: string; color: string;
}) {
  return (
    <Box onClick={onClick} sx={{ p: 2, borderRadius: "12px", border: selected ? "1.5px solid #2A75D7" : "1.5px solid #E5E7EB", background: selected ? "#F0F7FF" : "#FAFAFA", display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", transition: "all 0.15s ease", "&:hover": { borderColor: selected ? "#2A75D7" : "#B0BEC8", background: selected ? "#F0F7FF" : "#F4F6F9" } }}>
      <Box sx={{ width: 42, height: 42, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: bg, color, flexShrink: 0 }}>
        <Icon size={20} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#1F2937", lineHeight: 1.3 }}>{title}</Typography>
        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF", mt: 0.75 }}>{description}</Typography>
      </Box>
      <Box sx={{ width: 20, height: 20, borderRadius: "50%", border: selected ? "none" : "1.5px solid #D1D5DB", background: selected ? "#1D57B7" : "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {selected && <CheckCircle2 size={14} color="#fff" />}
      </Box>
    </Box>
  );
}

/* ── Policy visual mapping ───────────────────────────────────────────────── */

const getPolicyVisuals = (typeKey = "") => {
  const k = typeKey.toUpperCase();
  if (k.includes("GMC") && (k.includes("TOP") || k.includes("TOPUP")))
    return { icon: HeartPulse, bg: "#FFF1E8", color: "#F08B3E" };
  if (k.includes("GMC"))  return { icon: HeartPulse, bg: "#EAF3FF", color: "#2B76D2" };
  if (k.includes("GPA"))  return { icon: WalletCards, bg: "#F4E8FF", color: "#8E3ADF" };
  if (k.includes("GTL"))  return { icon: FileText, bg: "#E8FBEF", color: "#1FA55F" };
  return { icon: FolderKanban, bg: "#F3F4F6", color: "#6B7280" };
};

const getPolicyDesc = (p: EmployeePolicy, localization?: LocalizationConfig) => {
  const si = Number(p.sumInsured);
  if (si > 0) return `Sum Insured: ${formatAmountWithCurrency(si, localization)}`;
  return "Enrolled policy";
};

/* ── Main component ──────────────────────────────────────────────────────── */

export function HRPortalIntimateClaimPage({ companyId: propCompanyId }: { companyId?: number | null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { localizationData } = useLocalization();
  const companyId = propCompanyId ?? getCompanyId() ?? 0;
  const navState = location.state as { employeeId?: number; employeeName?: string } | null;

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<StepErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Step 1 */
  const [selectedPolicy, setSelectedPolicy] = useState<EmployeePolicy | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(navState?.employeeId ?? null);
  const [employeeName, setEmployeeName] = useState(navState?.employeeName ?? "");
  const [companyEmployeeId, setCompanyEmployeeId] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [debouncedEmpSearch, setDebouncedEmpSearch] = useState("");
  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);
  const [dependent, setDependent] = useState("");
  const empDropdownRef = useRef<HTMLDivElement>(null);

  /* Step 2 */
  const [claimType, setClaimType] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [dischargeDate, setDischargeDate] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [placeOfAccident, setPlaceOfAccident] = useState("");

  /* Step 3 */
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [debouncedHospitalSearch, setDebouncedHospitalSearch] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<{ id?: number | string; name: string; location: string; city?: string; state?: string; pincode?: string; address?: string; externalId?: string } | null>(null);
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const [addManually, setAddManually] = useState(false);
  const [manualHospital, setManualHospital] = useState({ name: "", location: "", city: "", state: "", pincode: "", country: "India", email: "", phone: "" });
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc[]>>({});
  const [uploadingDocs, setUploadingDocs] = useState<Set<string>>(new Set());
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  /* Dependents state — populated from employee listing row, no extra API call */
  const [dependentsData, setDependentsData] = useState<DepData[]>([]);

  /* ── API: Employee policies (fetched when employee is selected) ───────── */
  const { mutate: fetchEmployeePolicies, data: empPoliciesData, isPending: isLoadingEmpPolicies } = useApiMutation({});
  const fetchEmployeePoliciesRef = useRef(fetchEmployeePolicies);
  fetchEmployeePoliciesRef.current = fetchEmployeePolicies;

  const employeePolicies = useMemo((): EmployeePolicy[] => {
    const enrolled: EmployeePolicy[] = empPoliciesData?.data?.enrolledPolicies ?? [];
    return enrolled.filter((p) => !p.policyTypeKey?.toUpperCase().includes("GTL"));
  }, [empPoliciesData]);

  const effectivePolicyId = selectedPolicy?.policyId ?? null;
  const policyTypeKey = selectedPolicy?.policyTypeKey ?? "";
  const isGmc = policyTypeKey.toUpperCase().includes("GMC");
  const isGpa = policyTypeKey.toUpperCase().includes("GPA");

  /* ── API: Employees (filtered by company + policy) ────────────────────── */
  const { data: employeeListData, isLoading: isLoadingEmployees } = useHRReport<EmployeeRow>(
    "ibp_hr_employee_listing",
    {
      companyId,
      enrollStatus: "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED",
      search: debouncedEmpSearch,
      limit: 50,
      offset: 0,
    },
    !!companyId,
    { limit: 0 },
  );

  /* ── Debounce employee search ─────────────────────────────────────────── */
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedEmpSearch(empSearch.trim()), 400);
    return () => window.clearTimeout(t);
  }, [empSearch]);

  /* ── Auto-select when employee has exactly one policy ─────────────────── */
  useEffect(() => {
    if (employeePolicies.length === 1 && !selectedPolicy) {
      setSelectedPolicy(employeePolicies[0]);
    }
  }, [employeePolicies, selectedPolicy]);

  /* ── Debounce hospital search ─────────────────────────────────────────── */
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedHospitalSearch(hospitalSearch.trim()), 400);
    return () => window.clearTimeout(t);
  }, [hospitalSearch]);

  /* ── Fetch employee's enrolled policies when employee changes ──────────── */
  useEffect(() => {
    setSelectedPolicy(null);
    setClaimType("");
    if (!employeeId) return;
    const id = window.setTimeout(() => {
      fetchEmployeePoliciesRef.current({
        endpoint: endPoints.employeePolicies(employeeId),
        method: "GET",
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, [employeeId]);


  /* ── Hospital search ──────────────────────────────────────────────────── */
  const { mutate: fetchHospitals, data: hospitalData, isPending: isLoadingHospitals } = useApiMutation({});
  const { mutate: createHospital, isPending: isCreatingHospital } = useApiMutation({});
  const fetchHospitalsRef = useRef(fetchHospitals);
  fetchHospitalsRef.current = fetchHospitals;
  const lastHospitalRequestRef = useRef("");

  useEffect(() => {
    if (!effectivePolicyId || selectedHospital || !showHospitalDropdown) return;
    const payload: Record<string, unknown> = {
      policyIds: [effectivePolicyId],
      isNetworkHospital: claimType === "CASHLESS",
      page: 1,
      limit: 12,
    };
    if (debouncedHospitalSearch) payload.search = debouncedHospitalSearch;
    const key = JSON.stringify(payload);
    if (lastHospitalRequestRef.current === key) return;
    lastHospitalRequestRef.current = key;
    fetchHospitalsRef.current({
      endpoint: endPoints.getHospitalNetworks(),
      method: "POST",
      data: payload,
    });
  }, [debouncedHospitalSearch, effectivePolicyId, claimType, selectedHospital, showHospitalDropdown]);

  const hospitalResults = useMemo(() => {
    const data: any[] = hospitalData?.data?.data || [];
    return data.map((h: any) => {
      const addr = Array.isArray(h.addresses) ? h.addresses[0] : (h.addresses || {});
      const loc = [addr.addressLine1, addr.cityName, addr.stateName, addr.pinCode].filter(Boolean).join(", ");
      return {
        id: h.id,
        name: h.name || "",
        location: loc,
        city: addr.cityName ?? "",
        state: addr.stateName ?? "",
        pincode: addr.pinCode ?? "",
        address: addr.addressLine1 ?? "",
        externalId: h.externalHospitalId ?? "",
      };
    });
  }, [hospitalData]);

  /* ── Document types ───────────────────────────────────────────────────── */
  const docTypes = useMemo(
    () => (isGmc && claimType === "CASHLESS" ? CASHLESS_DOC_TYPES : REIMBURSEMENT_DOC_TYPES),
    [isGmc, claimType],
  );

  /* ── Dependent options ────────────────────────────────────────────────── */
  const dependentOptions = useMemo(() => [
    { value: "self", label: "Self" },
    ...dependentsData.map(d => ({
      value: String(d.id),
      label: `${d.name} (${capitalizeFirst(d.relationship || d.relation || d.relationshipType || "Dependent")})`,
    })),
  ], [dependentsData]);

  /* ── Close emp dropdown on outside click ─────────────────────────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (empDropdownRef.current && !empDropdownRef.current.contains(e.target as Node)) setEmpDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Validation ───────────────────────────────────────────────────────── */
  const validate = (s: number): StepErrors => {
    const e: StepErrors = {};
    if (s === 1) {
      if (!employeeId) e.employeeId = "Please select an employee";
      if (!selectedPolicy) e.selectedPolicy = "Please select a policy";
    }
    if (s === 2) {
      if (isGmc && !claimType) e.claimType = "Please select a claim type";
      if (!diagnosis.trim()) e.diagnosis = isGpa ? "Accident details are required" : "Diagnosis is required";
      if (!estimatedAmount.trim()) e.estimatedAmount = "Estimated claim amount is required";
      if (isGpa && !placeOfAccident.trim()) e.placeOfAccident = "Place of accident is required";
      if (isGmc && !admissionDate) e.admissionDate = "Date of admission is required";
      if (isGmc && !dischargeDate) e.dischargeDate = "Date of discharge is required";
    }
    if (s === 3) {
      if (isGmc && claimType === "CASHLESS" && !selectedHospital) e.hospital = "Please select a network hospital";
      if (isGmc && claimType === "REIMBURSEMENT" && !selectedHospital && !addManually) e.hospital = "Please select or add a hospital";
      if (isGmc && claimType === "REIMBURSEMENT" && addManually && !manualHospital.name.trim()) e.hospital = "Hospital name is required";
    }
    return e;
  };

  const handleContinue = () => {
    const errs = validate(step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    if (step < 3) { setStep(s => s + 1); return; }
    handleSubmit();
  };

  /* ── File upload ──────────────────────────────────────────────────────── */
  const handleFileUpload = useCallback(async (docTypeValue: string, files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(f => f.size <= MAX_FILE_SIZE && /\.(pdf|jpg|jpeg|png)$/i.test(f.name));
    if (!valid.length) return;
    setUploadingDocs(prev => new Set(prev).add(docTypeValue));
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      const uploaded = await Promise.all(valid.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("companyType", "company");
        fd.append("companyId", String(user?.companyId || companyId || ""));
        const res: any = await apiRequest(endPoints.ibpFileUpload, {
          method: "POST",
          data: fd,
          headers: { "Content-Type": "multipart/form-data", ...(user?.accessToken?.accessToken ? { Authorization: `Bearer ${user.accessToken.accessToken}` } : {}) },
        });
        const d = res?.data?.data || res?.data || res;
        return { documentId: d.id as number, fileUpload: { id: d.id as number, fileName: d.fileName || file.name } };
      }));
      setUploadedDocs(prev => ({ ...prev, [docTypeValue]: [...(prev[docTypeValue] || []), ...uploaded] }));
    } finally {
      setUploadingDocs(prev => { const s = new Set(prev); s.delete(docTypeValue); return s; });
    }
  }, [companyId]);

  /* ── Submit ───────────────────────────────────────────────────────────── */
  const { mutate: uploadClaims } = useApiMutation({});
  // The "Claim Intimation Confirmation" email used to be triggered from here,
  // immediately on intimateClaim's success — but intimateClaim now returns
  // success as soon as the claim is saved/queued, BEFORE the TPA has been
  // contacted (see ClaimTpaSubmissionJob/deliverIntimationJob in
  // company-employee.service.ts). It's now sent server-side from
  // deliverIntimationJob instead, only once the TPA has genuinely accepted
  // the claim — do not re-add a frontend trigger here without removing the
  // backend one, or the employee gets it twice.

  const handleSubmit = () => {
    if (!effectivePolicyId || !employeeId) return;
    setIsSubmitting(true);

    const normalizedDependentId = (() => {
      if (!dependent || dependent === "self") return null;
      const n = Number(dependent);
      return Number.isFinite(n) ? n : null;
    })();

    const hospital = addManually
      ? { name: manualHospital.name, location: [manualHospital.location, manualHospital.city, manualHospital.state, manualHospital.pincode].filter(Boolean).join(", "), id: null }
      : { name: selectedHospital?.name || "", location: selectedHospital?.location || "", id: selectedHospital?.id ? Number(selectedHospital.id) : null };

    const documentIds = Object.entries(uploadedDocs).flatMap(([docType, docs]) =>
      docs.map(d => ({ documentId: d.documentId, documentType: docType }))
    );

    const toIso = (d: string) => { const dt = new Date(d); return isNaN(dt.getTime()) ? undefined : dt.toISOString(); };

    const payload: any = {
      policyId: effectivePolicyId,
      employeeId: Number(employeeId),
      dependentId: normalizedDependentId,
      diagnosis: diagnosis.trim(),
      estimatedClaimAmount: estimatedAmount,
      hospitalName: hospital.name,
      hospitalLocation: hospital.location,
      hospitalId: hospital.id,
      documentIds,
      ...(admissionDate ? { dateOfAdmission: toIso(admissionDate) } : {}),
      ...(dischargeDate ? { proposedDischargeDate: toIso(dischargeDate) } : {}),
      ...(isGpa && placeOfAccident ? { placeOfAccident } : {}),
      ...(claimType ? { claimType } : {}),
    };

    uploadClaims(
      { endpoint: endPoints.uploadClaims, method: "POST", data: payload },
      {
        onSuccess: () => {
          setIsSubmitting(false);
          setSubmitted(true);
        },
        onError: () => setIsSubmitting(false),
      }
    );
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  const showHospitalSection = isGmc;
  const step3Label = showHospitalSection ? "Hospital & Documents" : "Claim Documents";
  const step2Label = isGpa ? "Accident Details" : "Diagnosis & Claim";

  const STEPS = [
    { id: 1, label: "Policy Details", Icon: FileText },
    { id: 2, label: step2Label, Icon: HeartPulse },
    { id: 3, label: step3Label, Icon: Building2 },
  ];

  /* ── Success screen ───────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <Box sx={{ mx: -3, height: "100%", display: "flex", flexDirection: "column", background: "#EBF6FF", alignItems: "center", justifyContent: "center" }}>
        <style>{`
          @keyframes scaleIn{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15);opacity:1}100%{transform:scale(1)}}
          @keyframes drawCircle{0%{stroke-dashoffset:220}100%{stroke-dashoffset:0}}
          @keyframes drawTick{0%{stroke-dashoffset:60}100%{stroke-dashoffset:0}}
          .sc{stroke-dasharray:220;stroke-dashoffset:220;animation:drawCircle .55s cubic-bezier(.65,0,.45,1) .1s forwards}
          .st{stroke-dasharray:60;stroke-dashoffset:60;animation:drawTick .35s cubic-bezier(.65,0,.45,1) .55s forwards}
          .sw{animation:scaleIn .4s cubic-bezier(.34,1.56,.64,1) forwards}
        `}</style>
        <Box className="sw" sx={{ mb: 3 }}>
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
            <circle cx="48" cy="48" r="46" fill="#f0fdf4" />
            <circle className="sc" cx="48" cy="48" r="35" stroke="#22c55e" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <polyline className="st" points="30,49 42,61 66,36" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </Box>
        <Typography sx={{ fontSize: 28, lineHeight: 1.25, letterSpacing: "-0.4px", fontWeight: 700, color: "#1F2937" }}>Claim Intimation Submitted!</Typography>
        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", mt: 1 }}>Your request has been submitted for approval.</Typography>
        <Box onClick={() => navigate(-1)} sx={{ mt: 3, px: 3, py: 1.1, borderRadius: "8px", border: "1.5px solid #2A75D7", color: "#2A75D7", fontSize: 15, lineHeight: 1.7, fontWeight: 600, cursor: "pointer", background: "#fff" }}>
          Go Back
        </Box>
      </Box>
    );
  }

  /* ── Page layout ──────────────────────────────────────────────────────── */
  return (
    <Box sx={{ mx: -3, height: "100%", display: "flex", flexDirection: "column", background: "#EBF6FF", overflow: "hidden" }}>

      {/* Header + stepper */}
      <Box sx={{ background: "linear-gradient(90deg, #1A4B9B 0%, #1B7DB5 100%)", flexShrink: 0, width: "calc(100% + 64px)", zIndex: 10 }}>
        <Box sx={{ height: 60, px: 4, display: "flex", alignItems: "center", gap: 2.5 }}>
          <Box onClick={() => navigate(-1)} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, height: 34, borderRadius: "8px", border: "1px solid rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: "#fff", flexShrink: 0, "&:hover": { background: "rgba(255,255,255,0.12)" } }}>
            <ArrowLeft size={13} /> Back
          </Box>
          <Typography sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 700, color: "#fff" }}>
            Claims Submission{employeeId ? ` — (Emp ID: ${companyEmployeeId})` : ""}
          </Typography>
        </Box>
        <Box sx={{ px: 5, pb: 3, display: "flex", justifyContent: "flex-start" }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0, width: "100%", maxWidth: 520 }}>
            {STEPS.map((s, idx) => {
              const completed = step > s.id;
              const active = step === s.id;
              return (
                <Box key={s.id} sx={{ display: "flex", alignItems: "flex-start", flex: idx < 2 ? 1 : "none" }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: "50%", background: completed || active ? "#22C55E" : "rgba(255,255,255,0.15)", border: active ? "3px solid rgba(255,255,255,0.7)" : completed ? "none" : "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: active ? "0 0 0 4px rgba(34,197,94,0.25)" : "none", transition: "all 0.3s ease" }}>
                      <s.Icon size={18} color="#fff" />
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.55)", lineHeight: 1 }}>{s.id}.</Typography>
                      <Typography sx={{ fontSize: 15, fontWeight: active || completed ? 700 : 500, color: active || completed ? "#fff" : "rgba(255,255,255,0.6)", whiteSpace: "nowrap", lineHeight: 1.3 }}>{s.label}</Typography>
                    </Box>
                  </Box>
                  {idx < 2 && <Box sx={{ flex: 1, height: 2, mt: "21px", mx: 1, background: completed ? "#22C55E" : "rgba(255,255,255,0.25)", transition: "background 0.3s ease" }} />}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Content + summary */}
      <Box sx={{ flex: 1, overflow: "hidden", display: "flex", gap: 2.5, p: 3, minHeight: 0 }}>

        {/* Left — form */}
        <Box sx={{ flex: 1, background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <Box sx={{ flex: 1, overflowY: "auto", p: 3, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "#D1D5DB", borderRadius: 4 } }}>

            {/* ── STEP 1 ────────────────────────────────────────────────── */}
            {step === 1 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 700, color: "#111827" }}>Policy Details</Typography>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", mt: 0.75 }}>Select the employee and their enrolled policy for this claim</Typography>
                </Box>

                {/* Employee + Dependent — shown first */}
                <Box>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827", mb: 0.75 }}>Employee Details</Typography>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", mb: 2 }}>Select the employee and dependent for this claim</Typography>

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    {/* Employee dropdown */}
                    <Box>
                      <FieldLabel>Select Employee</FieldLabel>
                      <Box ref={empDropdownRef} sx={{ position: "relative" }}>
                        <Box
                          onClick={() => setEmpDropdownOpen(o => !o)}
                          sx={{ width: "100%", height: 42, borderRadius: "10px", border: `1.5px solid ${errors.employeeId ? "#EF4444" : empDropdownOpen ? "#2A75D7" : "#E5E7EB"}`, pl: "12px", pr: "36px", fontSize: 15, lineHeight: 1.7, color: employeeId ? "#1F2937" : "#9CA3AF", bgcolor: empDropdownOpen ? "#fff" : "#FAFAFA", display: "flex", alignItems: "center", cursor: "pointer", userSelect: "none", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}
                        >
                          {employeeId ? employeeName : "Search employees…"}
                        </Box>
                        <ChevronDown size={14} color="#9CA3AF" style={{ position: "absolute", right: 10, top: "50%", transform: `translateY(-50%) rotate(${empDropdownOpen ? 180 : 0}deg)`, pointerEvents: "none", transition: "transform 0.15s" }} />
                        {empDropdownOpen && (
                          <Box sx={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, bgcolor: "#fff", borderRadius: "12px", border: "1.5px solid #E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden" }}>
                            <Box sx={{ px: 1.5, pt: 1.5, pb: 1, borderBottom: "1px solid #F3F4F6" }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.25, height: 36, borderRadius: "8px", border: "1.5px solid #E5E7EB", bgcolor: "#F9FAFB", "&:focus-within": { borderColor: "#2A75D7", bgcolor: "#fff" } }}>
                                <Search size={13} color="#9CA3AF" />
                                <Box component="input" autoFocus value={empSearch} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmpSearch(e.target.value)} placeholder="Search by name or ID…" sx={{ flex: 1, border: "none", outline: "none", bgcolor: "transparent", fontSize: 15, lineHeight: 1.7, color: "#1F2937", fontFamily: "inherit", "::placeholder": { color: "#9CA3AF" } }} />
                                {empSearch && <X size={12} color="#9CA3AF" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => setEmpSearch("")} />}
                              </Box>
                            </Box>
                            <Box sx={{ maxHeight: 220, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "#D1D5DB", borderRadius: 4 } }}>
                              {isLoadingEmployees ? (
                                <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}><CircularProgress size={20} sx={{ color: "#1C57B8" }} /></Box>
                              ) : employeeListData.length === 0 ? (
                                <Box sx={{ py: 3, textAlign: "center" }}><Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>No employees found</Typography></Box>
                              ) : employeeListData.map((e, i) => (
                                <Box
                                  key={e.employeeId}
                                  onClick={() => { setEmployeeId(e.employeeId); setEmployeeName(e.fullName?.trim() || e.employeeName); setCompanyEmployeeId(e.companyEmployeeId); setDependentsData(Array.isArray(e.dependents) ? e.dependents : []); setDependent(""); setEmpSearch(""); setEmpDropdownOpen(false); setErrors(prev => ({ ...prev, employeeId: undefined })); }}
                                  sx={{ px: 2, py: 2.25, display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", bgcolor: employeeId === e.employeeId ? "#EFF6FF" : "transparent", borderBottom: i < employeeListData.length - 1 ? "1px solid #F9FAFB" : "none", "&:hover": { bgcolor: "#F0F7FF" } }}
                                >
                                  <Box sx={{ width: 30, height: 30, borderRadius: "50%", bgcolor: "#EBF3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#2556A6" }}>
                                    {(e.fullName || e.employeeName).split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                  </Box>
                                  <Box>
                                    <Typography sx={{ fontSize: 15.5, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>{e.fullName?.trim() || e.employeeName}</Typography>
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280" }}>{e.companyEmployeeId}</Typography>
                                  </Box>
                                  {employeeId === e.employeeId && <CheckCircle2 size={14} color="#2A75D7" style={{ marginLeft: "auto" }} />}
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                      <FieldError msg={errors.employeeId} />
                    </Box>

                    {/* Dependent dropdown */}
                    <Box>
                      <FieldLabel required={false}>Select Dependent</FieldLabel>
                      <Box sx={{ position: "relative" }}>
                        <Box
                          component="select"
                          value={dependent}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => { setDependent(e.target.value); setErrors(prev => ({ ...prev, dependent: undefined })); }}
                          disabled={!employeeId}
                          sx={{ width: "100%", height: 42, borderRadius: "10px", border: `1.5px solid ${errors.dependent ? "#EF4444" : "#E5E7EB"}`, pl: "12px", pr: "32px", fontSize: 15, lineHeight: 1.7, color: dependent ? "#1F2937" : "#9CA3AF", bgcolor: "#FAFAFA", appearance: "none", outline: "none", "&:focus": { borderColor: "#2A75D7", bgcolor: "#fff" }, "&:disabled": { opacity: 0.5 } }}
                        >
                          <option value="">Select dependent</option>
                          {dependentOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </Box>
                        <ChevronDown size={14} color="#9CA3AF" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      </Box>
                      <FieldError msg={errors.dependent} />
                    </Box>
                  </Box>

                  {/* Selected employee info bar */}
                  {employeeId && (
                    <Box sx={{ mt: 2, borderRadius: "12px", border: "1px solid #BFDBFE", background: "#EFF6FF", px: 2.5, py: 1.75, display: "flex", alignItems: "center", gap: 2, boxShadow: "0 4px 12px rgba(37,99,235,0.10)" }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: "50%", background: "#1D57B7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CheckCircle2 size={16} color="#fff" />
                      </Box>
                      {[
                        ["Employee", employeeName],
                        ["ID", companyEmployeeId || "—"],
                        ["Dependent", dependent ? (dependent === "self" ? employeeName : (dependentsData.find(d => String(d.id) === dependent)?.name || "—")) : "—"],
                        ["Relation", dependent === "self" ? "Self" : capitalizeFirst(dependentsData.find(d => String(d.id) === dependent)?.relationship || dependentsData.find(d => String(d.id) === dependent)?.relation || dependentsData.find(d => String(d.id) === dependent)?.relationshipType || "—")],
                      ].map(([l, v]) => (
                        <Box key={l}>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", mb: 0.75 }}>{l}</Typography>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#1F2937" }}>{v}</Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Policies — shown below employee after selection */}
                {employeeId && (
                  <Box sx={{ pt: 2.5, borderTop: "1px solid #F3F4F6" }}>
                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: "#374151", mb: 0.75 }}>
                      Select Policy <Box component="span" sx={{ color: "#EF4444", ml: 0.5 }}>*</Box>
                    </Typography>

                    {isLoadingEmpPolicies ? (
                      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                        <CircularProgress size={22} />
                      </Box>
                    ) : employeePolicies.length === 0 ? (
                      <Box sx={{ py: 3, textAlign: "center" }}>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>No enrolled policies found for this employee</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 1 }}>
                        {employeePolicies.map(p => {
                          const { icon, bg, color } = getPolicyVisuals(p.policyTypeKey);
                          return (
                            <SelectionCard
                              key={p.policyId}
                              title={p.policyName}
                              description={getPolicyDesc(p, localizationData?.data)}
                              selected={selectedPolicy?.policyId === p.policyId}
                              onClick={() => { setSelectedPolicy(p); setErrors(prev => ({ ...prev, selectedPolicy: undefined })); }}
                              icon={icon}
                              bg={bg}
                              color={color}
                            />
                          );
                        })}
                      </Box>
                    )}

                    <FieldError msg={errors.selectedPolicy} />
                  </Box>
                )}
              </Box>
            )}

            {/* ── STEP 2 ────────────────────────────────────────────────── */}
            {step === 2 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 700, color: "#111827" }}>{step2Label}</Typography>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", mt: 0.75 }}>
                    {isGpa ? "Provide accident details and estimated claim amount" : "Provide medical diagnosis and estimated claim amount"}
                  </Typography>
                </Box>

                {/* Claim type — GMC only */}
                {isGmc && (
                  <Box>
                    <FieldLabel>Claim Type</FieldLabel>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 1 }}>
                      {CLAIM_TYPES.map(c => (
                        <SelectionCard key={c.id} title={c.title} description={c.description} selected={claimType === c.id} onClick={() => { setClaimType(c.id); setErrors(prev => ({ ...prev, claimType: undefined })); }} icon={c.icon} bg={c.bg} color={c.color} />
                      ))}
                    </Box>
                    <FieldError msg={errors.claimType} />
                  </Box>
                )}

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  {/* Diagnosis / Accident details */}
                  <Box>
                    <FieldLabel>{isGpa ? "Accident Details" : "Diagnosis"}</FieldLabel>
                    <Box component="input" value={diagnosis} placeholder={isGpa ? "Describe the accident" : "e.g. Cardiac Surgery"} onChange={(e: ChangeEvent<HTMLInputElement>) => { setDiagnosis(e.target.value); setErrors(prev => ({ ...prev, diagnosis: undefined })); }}
                      sx={{ width: "100%", height: 42, boxSizing: "border-box", borderRadius: "10px", border: `1.5px solid ${errors.diagnosis ? "#EF4444" : "#E5E7EB"}`, px: "12px", fontSize: 15, lineHeight: 1.7, color: "#1F2937", bgcolor: "#FAFAFA", outline: "none", "&::placeholder": { color: "#9CA3AF" }, "&:focus": { borderColor: "#2A75D7", bgcolor: "#fff" } }} />
                    <FieldError msg={errors.diagnosis} />
                  </Box>

                  {/* Date of admission (GMC/GTL) or date of accident (GPA) */}
                  <Box>
                    <FieldLabel required={isGmc}>{isGpa ? "Date of Accident" : "Date of Admission"}</FieldLabel>
                    <Box sx={{ position: "relative" }}>
                      <CalendarDays size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      <Box component="input" type="date" value={admissionDate} onChange={(e: ChangeEvent<HTMLInputElement>) => { setAdmissionDate(e.target.value); setErrors(prev => ({ ...prev, admissionDate: undefined })); }}
                        sx={{ width: "100%", height: 42, boxSizing: "border-box", borderRadius: "10px", border: `1.5px solid ${errors.admissionDate ? "#EF4444" : "#E5E7EB"}`, pl: "36px", pr: "12px", fontSize: 15, lineHeight: 1.7, color: admissionDate ? "#1F2937" : "#9CA3AF", bgcolor: "#FAFAFA", outline: "none", "&:focus": { borderColor: "#2A75D7", bgcolor: "#fff" } }} />
                    </Box>
                    <FieldError msg={errors.admissionDate} />
                  </Box>

                  {/* Proposed discharge — GMC/GTL only */}
                  {!isGpa && (
                    <Box>
                      <FieldLabel required={isGmc}>Proposed Discharge Date</FieldLabel>
                      <Box sx={{ position: "relative" }}>
                        <CalendarDays size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        <Box component="input" type="date" value={dischargeDate} onChange={(e: ChangeEvent<HTMLInputElement>) => { setDischargeDate(e.target.value); setErrors(prev => ({ ...prev, dischargeDate: undefined })); }}
                          sx={{ width: "100%", height: 42, boxSizing: "border-box", borderRadius: "10px", border: `1.5px solid ${errors.dischargeDate ? "#EF4444" : "#E5E7EB"}`, pl: "36px", pr: "12px", fontSize: 15, lineHeight: 1.7, color: dischargeDate ? "#1F2937" : "#9CA3AF", bgcolor: "#FAFAFA", outline: "none", "&:focus": { borderColor: "#2A75D7", bgcolor: "#fff" } }} />
                      </Box>
                      <FieldError msg={errors.dischargeDate} />
                    </Box>
                  )}

                  {/* Place of accident — GPA only */}
                  {isGpa && (
                    <Box>
                      <FieldLabel>Place of Accident</FieldLabel>
                      <Box component="input" value={placeOfAccident} placeholder="Enter location" onChange={(e: ChangeEvent<HTMLInputElement>) => { setPlaceOfAccident(e.target.value); setErrors(prev => ({ ...prev, placeOfAccident: undefined })); }}
                        sx={{ width: "100%", height: 42, boxSizing: "border-box", borderRadius: "10px", border: `1.5px solid ${errors.placeOfAccident ? "#EF4444" : "#E5E7EB"}`, px: "12px", fontSize: 15, lineHeight: 1.7, color: "#1F2937", bgcolor: "#FAFAFA", outline: "none", "&::placeholder": { color: "#9CA3AF" }, "&:focus": { borderColor: "#2A75D7", bgcolor: "#fff" } }} />
                      <FieldError msg={errors.placeOfAccident} />
                    </Box>
                  )}

                  {/* Estimated amount */}
                  <Box>
                    <FieldLabel>Estimated Claim Amount</FieldLabel>
                    <Box sx={{ position: "relative" }}>
                      <IndianRupee size={14} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      <Box component="input" value={estimatedAmount} placeholder="Enter amount" onChange={(e: ChangeEvent<HTMLInputElement>) => { setEstimatedAmount(e.target.value); setErrors(prev => ({ ...prev, estimatedAmount: undefined })); }}
                        sx={{ width: "100%", height: 42, boxSizing: "border-box", borderRadius: "10px", border: `1.5px solid ${errors.estimatedAmount ? "#EF4444" : "#E5E7EB"}`, pl: "36px", pr: "12px", fontSize: 15, lineHeight: 1.7, color: "#1F2937", bgcolor: "#FAFAFA", outline: "none", "&::placeholder": { color: "#9CA3AF" }, "&:focus": { borderColor: "#2A75D7", bgcolor: "#fff" } }} />
                    </Box>
                    <FieldError msg={errors.estimatedAmount} />
                  </Box>
                </Box>
              </Box>
            )}

            {/* ── STEP 3 ────────────────────────────────────────────────── */}
            {step === 3 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 700, color: "#111827" }}>{step3Label}</Typography>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", mt: 0.75 }}>
                    {showHospitalSection ? "Select the hospital where treatment will be provided" : "Upload required claim supporting documents"}
                  </Typography>
                </Box>

                {/* Hospital search — GMC only */}
                {showHospitalSection && (
                  <Box>
                    <FieldLabel>Hospitals Name</FieldLabel>
                    <Box sx={{ position: "relative" }}>
                      <Search size={16} color="#9CA3AF" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      <Box
                        component="input"
                        value={hospitalSearch}
                        placeholder="Search for the hospital name"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => { const v = e.target.value; setHospitalSearch(v); setSelectedHospital(null); setAddManually(false); setShowHospitalDropdown(true); if (!v) lastHospitalRequestRef.current = ""; setErrors(prev => ({ ...prev, hospital: undefined })); }}
                        onFocus={() => setShowHospitalDropdown(true)}
                        onBlur={() => setTimeout(() => setShowHospitalDropdown(false), 150)}
                        sx={{ width: "100%", height: 44, boxSizing: "border-box", borderRadius: "10px", border: `1.5px solid ${errors.hospital ? "#EF4444" : "#E5E7EB"}`, pl: "40px", pr: hospitalSearch ? "36px" : "12px", fontSize: 15, lineHeight: 1.7, color: "#1F2937", bgcolor: "#FAFAFA", outline: "none", "&::placeholder": { color: "#9CA3AF" }, "&:focus": { borderColor: "#2A75D7", bgcolor: "#fff", boxShadow: "0 0 0 3px rgba(42,117,215,0.1)" } }}
                      />
                      {hospitalSearch && !selectedHospital && (
                        <X size={14} color="#9CA3AF" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}
                          onClick={() => { setHospitalSearch(""); setSelectedHospital(null); setAddManually(false); }} />
                      )}
                      {selectedHospital && (
                        <ChevronDown size={14} color="#9CA3AF" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                      )}

                      {/* Hospital dropdown */}
                      {showHospitalDropdown && !selectedHospital && (
                        <Box sx={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: "12px", boxShadow: "0 8px 28px rgba(0,0,0,0.12)", zIndex: 50 }}>

                          {/* Scrollable results */}
                          <Box sx={{ maxHeight: 280, overflowY: "auto", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { background: "#D1D5DB", borderRadius: 4 } }}>
                            {isLoadingHospitals ? (
                              <Box sx={{ py: 3.5, display: "flex", justifyContent: "center" }}><CircularProgress size={20} sx={{ color: "#1C57B8" }} /></Box>
                            ) : hospitalResults.length > 0 ? (
                              hospitalResults.map((h, i) => {
                                const fullText = `${h.name}${h.location ? `, ${h.location}` : ""}`;
                                const idx = hospitalSearch ? fullText.toLowerCase().indexOf(hospitalSearch.toLowerCase()) : -1;
                                const before = idx >= 0 ? fullText.slice(0, idx) : fullText;
                                const match = idx >= 0 ? fullText.slice(idx, idx + hospitalSearch.length) : "";
                                const after = idx >= 0 ? fullText.slice(idx + hospitalSearch.length) : "";
                                return (
                                  <Box key={h.id ?? i}
                                    onMouseDown={() => { setSelectedHospital(h); setHospitalSearch(`${h.name}${h.location ? `, ${h.location}` : ""}`); setShowHospitalDropdown(false); }}
                                    sx={{ px: 2, py: 2.25, display: "flex", alignItems: "flex-start", gap: 1.25, cursor: "pointer", "&:hover": { background: "#F0F7FF" }, borderBottom: i < hospitalResults.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                                    <MapPin size={13} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 3 }} />
                                    <Box>
                                      <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                                        {idx >= 0 ? <>{before}<Box component="span" sx={{ color: "#2563EB" }}>{match}</Box>{after}</> : fullText}
                                      </Typography>
                                      {h.location && <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", mt: 0.2 }}>{h.location}</Typography>}
                                    </Box>
                                  </Box>
                                );
                              })
                            ) : (
                              <Box sx={{ px: 2.5, py: 2 }}>
                                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#9CA3AF" }}>
                                  {hospitalSearch
                                    ? claimType === "CASHLESS" ? `No network hospitals found for "${hospitalSearch}"` : `No hospitals found for "${hospitalSearch}"`
                                    : claimType === "CASHLESS" ? "No network hospitals available for this policy" : "No hospitals available — type to search or add manually"}
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          {/* Add Manually footer — reimbursement only */}
                          {claimType === "REIMBURSEMENT" && (
                            <Box
                              onMouseDown={() => { setShowHospitalDropdown(false); setAddManually(true); setManualHospital(p => ({ ...p, name: hospitalSearch })); }}
                              sx={{ px: 2.5, py: 2.25, borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 0.75, color: "#1D4ED8", fontSize: 15, lineHeight: 1.7, fontWeight: 600, cursor: "pointer", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px", "&:hover": { background: "#EFF6FF" } }}
                            >
                              <PlusCircle size={14} /> Add Hospital Manually
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                    <FieldError msg={errors.hospital} />

                    {/* Selected hospital card */}
                    {selectedHospital && (
                      <Box sx={{ mt: 1.5, borderRadius: "12px", border: "1.5px solid #BFDBFE", background: "#EFF6FF", px: 2.5, py: 1.75, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 12px rgba(37,99,235,0.08)" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: "9px", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Building2 size={16} color="#2563EB" />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#1F2937" }}>{selectedHospital.name}</Typography>
                            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280" }}>{selectedHospital.location}</Typography>
                          </Box>
                        </Box>
                        <Trash2 size={16} color="#EF4444" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => { setSelectedHospital(null); setHospitalSearch(""); }} />
                      </Box>
                    )}

                    {/* Manual hospital form — reimbursement only */}
                    {addManually && claimType === "REIMBURSEMENT" && (
                      <Box sx={{ mt: 2, p: 3, borderRadius: "12px", border: "1.5px solid #BFDBFE", background: "#F8FBFF" }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#1F2937" }}>Add Hospital Manually</Typography>
                          <X size={15} color="#9CA3AF" style={{ cursor: "pointer" }} onClick={() => { setAddManually(false); setHospitalSearch(""); }} />
                        </Box>
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.75 }}>
                          {[
                            { key: "name",     label: "Hospital Name",  placeholder: "Enter hospital name",  required: true  },
                            { key: "location", label: "Location",        placeholder: "Enter hospital location", required: true },
                            { key: "city",     label: "City",            placeholder: "Enter city",           required: true  },
                            { key: "state",    label: "State",           placeholder: "Enter state",          required: true  },
                            { key: "pincode",  label: "Pincode",         placeholder: "Enter pincode",        required: true  },
                            { key: "country",  label: "Country",         placeholder: "Enter country",        required: false },
                            { key: "email",    label: "Email",           placeholder: "Enter email",          required: false },
                            { key: "phone",    label: "Phone number",    placeholder: "Enter phone number",   required: false },
                          ].map(({ key, label, placeholder, required }) => (
                            <Box key={key}>
                              <FieldLabel required={required}>{label}</FieldLabel>
                              <Box component="input" value={manualHospital[key as keyof typeof manualHospital]} placeholder={placeholder}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => { setManualHospital(p => ({ ...p, [key]: e.target.value })); if (key === "name") setErrors(prev => ({ ...prev, hospital: undefined })); }}
                                sx={{ width: "100%", height: 40, boxSizing: "border-box", borderRadius: "9px", border: `1.5px solid ${key === "name" && errors.hospital ? "#EF4444" : "#E5E7EB"}`, px: "12px", fontSize: 15, lineHeight: 1.7, color: "#1F2937", bgcolor: "#fff", outline: "none", "&::placeholder": { color: "#9CA3AF" }, "&:focus": { borderColor: "#2A75D7" } }} />
                            </Box>
                          ))}
                        </Box>

                        {/* Save / Cancel */}
                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 2.5 }}>
                          <Box onClick={() => { setAddManually(false); setHospitalSearch(""); setManualHospital({ name: "", location: "", city: "", state: "", pincode: "", country: "India", email: "", phone: "" }); }}
                            sx={{ px: 2.5, py: 0.9, borderRadius: "8px", border: "1.5px solid #D1D5DB", color: "#374151", fontSize: 15, lineHeight: 1.7, fontWeight: 600, cursor: "pointer", "&:hover": { bgcolor: "rgba(0,0,0,0.04)" } }}>
                            Cancel
                          </Box>
                          <Box
                            onClick={() => {
                              if (!manualHospital.name.trim() || !effectivePolicyId) return;
                              createHospital(
                                {
                                  endpoint: endPoints.createPolicyHospital(effectivePolicyId),
                                  method: "POST",
                                  data: {
                                    hospitalName: manualHospital.name.trim(),
                                    addressLine1: manualHospital.location.trim(),
                                    city: manualHospital.city.trim(),
                                    state: manualHospital.state.trim(),
                                    country: manualHospital.country.trim() || "India",
                                    pinCode: manualHospital.pincode.trim(),
                                    ...(manualHospital.email.trim() ? { email: manualHospital.email.trim() } : {}),
                                    ...(manualHospital.phone.trim() ? { phoneNumber: manualHospital.phone.trim() } : {}),
                                    isNetworkHospital: false,
                                  },
                                },
                                {
                                  onSuccess: (res: any) => {
                                    const h = res?.data?.data || res?.data || res;
                                    const loc = [manualHospital.location, manualHospital.city, manualHospital.state, manualHospital.pincode].filter(Boolean).join(", ");
                                    setSelectedHospital({ id: h?.id ?? null, name: manualHospital.name, location: loc });
                                    setHospitalSearch(`${manualHospital.name}, ${loc}`);
                                    setAddManually(false);
                                    setManualHospital({ name: "", location: "", city: "", state: "", pincode: "", country: "India", email: "", phone: "" });
                                    setErrors(prev => ({ ...prev, hospital: undefined }));
                                  },
                                }
                              );
                            }}
                            sx={{ px: 2.5, py: 0.9, borderRadius: "8px", background: isCreatingHospital ? "#E5E7EB" : "#1D57B7", color: isCreatingHospital ? "#9CA3AF" : "#fff", fontSize: 15, lineHeight: 1.7, fontWeight: 600, cursor: isCreatingHospital ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 1, "&:hover": { background: isCreatingHospital ? "#E5E7EB" : "#1749a0" } }}
                          >
                            {isCreatingHospital && <CircularProgress size={13} sx={{ color: "#9CA3AF" }} />}
                            Save Hospital Details
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Upload Documents */}
                <Box sx={{ pt: showHospitalSection ? 2.5 : 0, borderTop: showHospitalSection ? "1px solid #F3F4F6" : "none" }}>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827", mb: 0.75 }}>
                    Upload Documents <Box component="span" sx={{ color: "#EF4444" }}>*</Box>
                  </Typography>
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", mb: 2 }}>Please upload all required documents for claim processing</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
                    {docTypes.map(({ value, label }) => {
                      const files = uploadedDocs[value] || [];
                      const isUploading = uploadingDocs.has(value);
                      return (
                        <Box key={value} sx={{ minHeight: 100, borderRadius: "10px", border: `1.5px solid ${files.length > 0 ? "#BFDBFE" : "#D1D5DB"}`, display: "flex", flexDirection: "column", background: files.length > 0 ? "#EFF6FF" : "#FAFAFA", px: 1.5, py: 2.25, gap: 0.75 }}>
                          <Typography sx={{ fontSize: 15.5, color: "#374151", fontWeight: 500, lineHeight: 1.35 }}>{label}</Typography>
                          {isUploading ? (
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: 40 }}><CircularProgress size={18} /></Box>
                          ) : (
                            <>
                              {files.map(f => (
                                <Box key={f.documentId} sx={{ borderRadius: "7px", background: "#DBEAFE", px: 1.25, py: 0.75, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                                    <FileText size={13} color="#2563EB" style={{ flexShrink: 0 }} />
                                    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#2563EB", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.fileUpload.fileName}</Typography>
                                  </Box>
                                  <X size={12} color="#6B7280" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => setUploadedDocs(prev => ({ ...prev, [value]: prev[value].filter(d => d.documentId !== f.documentId) }))} />
                                </Box>
                              ))}
                              <Box
                                component="label"
                                sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: "auto", px: 1.5, py: 0.6, borderRadius: "6px", background: "#1D57B7", color: "#fff", fontSize: 15, lineHeight: 1.7, fontWeight: 600, cursor: "pointer", width: "fit-content" }}
                              >
                                <Upload size={11} />
                                Upload
                                <input
                                  hidden
                                  type="file"
                                  multiple
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  ref={el => { fileInputRefs.current[value] = el; }}
                                  onChange={e => { handleFileUpload(value, e.target.files); e.target.value = ""; }}
                                />
                              </Box>
                            </>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right — Claim Summary */}
        <Box sx={{ width: 270, background: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", flexShrink: 0 }}>
          <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, borderBottom: "1px solid #F3F4F6" }}>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827" }}>Claim Summary</Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2, display: "flex", flexDirection: "column", gap: 0 }}>
            {(selectedPolicy || employeeName) && (
              <>
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#374151", mb: 1.25 }}>Policy Details</Typography>
                {selectedPolicy && <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#111827", mb: 0.75 }}>{selectedPolicy.policyName}</Typography>}
                {employeeName && (
                  <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#111827" }}>
                    {dependent === "self" || !dependent ? employeeName : (dependentsData.find(d => String(d.id) === dependent)?.name || employeeName)}:{" "}
                    {dependent === "self" || !dependent ? "Self" : capitalizeFirst(dependentsData.find(d => String(d.id) === dependent)?.relation || dependentsData.find(d => String(d.id) === dependent)?.relationshipType || "Dependent")}
                  </Typography>
                )}
              </>
            )}
            {(claimType || diagnosis || admissionDate || dischargeDate || placeOfAccident) && (
              <>
                <Box sx={{ my: 2, height: 1, background: "#F3F4F6" }} />
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#374151", mb: 1.25 }}>{isGpa ? "Accident Details" : "Diagnosis & Claim"}</Typography>
                {claimType && <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#111827", mb: 0.75 }}>Claim Type: {CLAIM_TYPES.find(c => c.id === claimType)?.title}</Typography>}
                {diagnosis && <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#111827", mb: 0.75 }}>{isGpa ? "Accident" : "Diagnosis"}: {diagnosis}</Typography>}
                {admissionDate && <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#111827", mb: 0.75 }}>{isGpa ? "Date of Accident" : "Date of Admission"}: {formatDate(admissionDate)}</Typography>}
                {dischargeDate && <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#111827", mb: 0.75 }}>Date of Release: {formatDate(dischargeDate)}</Typography>}
                {placeOfAccident && <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#111827", mb: 0.75 }}>Place of Accident: {placeOfAccident}</Typography>}
              </>
            )}
            {selectedHospital && (
              <>
                <Box sx={{ my: 2, height: 1, background: "#F3F4F6" }} />
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#374151", mb: 1.25 }}>Hospital</Typography>
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#111827", mb: 0.75 }}>{selectedHospital.name}</Typography>
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280" }}>{selectedHospital.location}</Typography>
              </>
            )}
            {!selectedPolicy && !employeeName && !claimType && !diagnosis && !admissionDate && !dischargeDate && !selectedHospital && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, py: 4, gap: 1.5 }}>
                <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#EAF3FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <HeartPulse size={28} color="#2B76D2" />
                </Box>
                <Typography sx={{ fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 1.6, px: 1 }}>
                  Begin the Claim process to secure your medical coverage and benefits
                </Typography>
              </Box>
            )}
          </Box>
          {estimatedAmount && (
            <Box sx={{ px: 2.5, py: 2, borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#374151" }}>Estimated Claim Amount:</Typography>
              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: "#111827" }}>{formatAmountWithCurrency(Number(estimatedAmount), localizationData?.data)}</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ flexShrink: 0, borderTop: "1px solid #E5E7EB", px: 2.5, pr: "96px", py: 2, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, width: "calc(100% + 64px)" }}>
        {step > 1 && (
          <Box onClick={() => { setStep(s => s - 1); setErrors({}); }} sx={{ px: 4, py: 2.25, borderRadius: "8px", border: "1.5px solid #D1D5DB", color: "#374151", fontSize: 15, lineHeight: 1.7, fontWeight: 600, cursor: "pointer", "&:hover": { background: "rgba(0,0,0,0.04)" } }}>
            Back
          </Box>
        )}
        <Box
          onClick={isSubmitting ? undefined : handleContinue}
          sx={{ px: 4.5, py: 2.25, borderRadius: "8px", background: isSubmitting ? "#E5E7EB" : "#1D57B7", color: isSubmitting ? "#9CA3AF" : "#fff", fontSize: 15, lineHeight: 1.7, fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer", boxShadow: isSubmitting ? "none" : "0 2px 8px rgba(29,87,183,0.3)", "&:hover": { background: isSubmitting ? "#E5E7EB" : "#1749a0" }, display: "flex", alignItems: "center", gap: 1 }}
        >
          {isSubmitting && <CircularProgress size={14} sx={{ color: "#9CA3AF" }} />}
          {step < 3 ? "Continue" : isSubmitting ? "Submitting…" : "Submit Claim"}
        </Box>
      </Box>
    </Box>
  );
}

export default HRPortalIntimateClaimPage;
