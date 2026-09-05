import { useMemo, useRef, useState, useEffect, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Typography,
} from "@mui/material";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Eye,
  FileText,
  HeartHandshake,
  RefreshCw,
  Search,
  Share2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import endorsementCalculatorIllustration from "../../assets/pngs/endorsement-calculator-illustration.png";
import { ENROLMENT_TABS } from "./constants";
import {
  endPoints,
  formatAmountWithCurrency,
  getCurrencySymbolPrefix,
  getTaxLabel,
  LocalizationConfig,
  useApiMutation,
  useLocalization,
} from "@ui/ui-lib";
import { getCompanyId, getSubdomainFromUrl } from "../../utils/companyConfig";
import type { EnrolmentDependent, EnrolmentECard, EnrolmentRow } from "./types";
import {
  PORTAL_DATE_OPTIONS,
  PortalActionButton,
  PortalControlBar,
  PortalHeroHeader,
  PortalSearchField,
  PortalSelectControl,
  PortalTabItem,
  downloadMockFile,
} from "../HRPortal/controls";

const STATUS_STYLE_DEFAULT = { bg: "#F8FAFC", color: "#475467", border: "#D0D5DD" };

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  Enrolled:      { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" },
  Pending:       { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA" },
  "Not Enrolled":{ bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA" },
  "In Progress": { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  Active:        { bg: "#ECFDF3", color: "#16A34A", border: "#BBF7D0" },
  Inactive:      STATUS_STYLE_DEFAULT,
};

const getStatusStyle = (key: string) => statusStyles[key] ?? STATUS_STYLE_DEFAULT;


const tabIcons = {
  enrollment: HeartHandshake,
  endorsement: FileText,
  analytics: BarChart3,
} as const;

// ─── API Types & Helpers ───────────────────────────────────────────────────────

type EmpSupportKpi = {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  enrolledEmployees: number;
  notEnrolledEmployees: number;
};

type ApiDependent = {
  name: string | null;
  relationship: string | null;
  dob: string | null;
  gender: string | null;
};

type ApiEmployeeRow = {
  employeeId: number;
  companyEmployeeId: string;
  employeeName: string;
  fullName: string | null;
  gender: string | null;
  enrollStatus: string;
  sumInsured: number;
  dependentsCount: number;
  dependents: ApiDependent[] | null;
  lastLoginAt: string | null;
  email: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  totalCount: number;
};

const PAGE_SIZE = 10;

const fmtAmount = (n: number, localization?: LocalizationConfig) =>
  n >= 100000 ? `${getCurrencySymbolPrefix(localization)}${(n / 100000).toFixed(2)}L` : `${formatAmountWithCurrency(n, localization)}`;

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "--";

const enrollKeyToLabel = (key: string) => {
  if (key === "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED") return "Enroled";
  if (key === "EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED") return "Not Started";
  if (key === "EMPLOYEE_ENROLLMENT_STATUS_PENDING") return "Pending";
  return key.replace("EMPLOYEE_ENROLLMENT_STATUS_", "").replace(/_/g, " ");
};

const PLACEHOLDER_ECARD: EnrolmentECard = {
  insurer: "--",
  policyName: "--",
  employeeName: "--",
  employeeId: "--",
  dob: "--",
  gender: "--",
  policyNumber: "--",
  plan: "--",
  sumInsured: "--",
  validity: "--",
  networkHospitals: "--",
  helpline: "--",
};

const mapApiRow = (r: ApiEmployeeRow, localization?: LocalizationConfig): EnrolmentRow => ({
  id: String(r.employeeId),
  employeeName: r.fullName?.trim() || r.employeeName,
  employeeCode: r.companyEmployeeId,
  gender: r.gender ?? "--",
  dob: r.dateOfBirth ?? "--",
  age: 0,
  email: r.email ?? "--",
  mobile: r.phone ?? "--",
  enrolStatus: enrollKeyToLabel(r.enrollStatus),
  additionType: "--",
  sumInsured: r.sumInsured > 0 ? fmtAmount(r.sumInsured, localization) : "--",
  dependents: r.dependentsCount,
  eCard: "View",
  status: "--",
  lastLogin: fmtDate(r.lastLoginAt),
  dependentDetails: (r.dependents ?? []).map((d) => ({
    name: d.name ?? "--",
    relationship: d.relationship ?? "--",
    gender: d.gender ?? "--",
    dob: d.dob ?? "--",
  })),
  eCardDetails: {
    ...PLACEHOLDER_ECARD,
    employeeName: r.fullName?.trim() || r.employeeName,
    employeeId: r.companyEmployeeId,
  },
});

const endorsementSummary = [
  ["Employees at Inception", "1250"],
  ["Employees in Addition", "1250"],
  ["Employees in Deletion", "1250"],
  ["Active Employees", "1250"],
  ["Lives at Inception", "1250"],
  ["Lives in Addition", "1250"],
  ["Lives in Deletion", "1250"],
  ["Active Lives", "1250"],
];

const premiumRows = [
  ["Base Premium", "₹1.85 Cr", "#364152"],
  ["Tax Amount (GST 18%)", "₹33.30 L", "#364152"],
  ["Gross Premium", "₹2.18 Cr", "#364152"],
  ["Addition Premium", "₹24.50 L", "#16a34a"],
  ["Deletion Premium", "(₹9.85 L)", "#ef4444"],
  ["Correction Addition Premium", "₹1.20 L", "#16a34a"],
  ["Correction Deletion Premium", "(₹45,000)", "#ef4444"],
  ["Net Premium", "₹2.00 Cr", "#111827"],
  ["Net Tax Amount (GST 18%)", "₹36.07 L", "#364152"],
];

const ENDORSEMENT_EMPLOYEE_SUMMARY = [
  ["Employees at Inception", "1250"],
  ["Active Employees", "1250"],
  ["Lives at Inception", "1250"],
  ["Active Lives", "1250"],
];

const ENDORSEMENT_PREMIUM_ROWS = [
  ["Base Premium", "₹1.85 Cr", "#475467"],
  ["Tax Amount (GST 18%)", "₹33.30 L", "#475467"],
  ["Gross Premium", "₹2.18 Cr", "#111827"],
  ["Net Premium", "₹1.85 Cr", "#111827"],
  ["Net Tax Amount (GST 18%)", "₹33.30 L", "#475467"],
];

const INDIVIDUAL_ENDORSEMENTS = [
  {
    type: "Inception",
    tint: "#F4EBFF",
    color: "#7F56D9",
    date: "01 Apr 2025",
    title: "ENP - 2025-001",
    subtitle: "Policy Inception - FY 2025-26 group mediclaim commencement",
    addition: "+28",
    active: "1,208",
    netGross: "₹11.56 L",
  },
  {
    type: "Addition",
    tint: "#EFF8FF",
    color: "#2F74D6",
    date: "01 Apr 2025",
    title: "ENP - 2025-001",
    subtitle: "Mid-year roster addition - spouse and child enrolments",
    addition: "+28",
    active: "1,208",
    netGross: "₹11.56 L",
  },
  {
    type: "Deletion",
    tint: "#FEF3F2",
    color: "#F04438",
    date: "01 Apr 2025",
    title: "ENP - 2025-001",
    subtitle: "Separation and inactive member deletion update",
    addition: "+28",
    active: "1,208",
    netGross: "₹11.56 L",
  },
  {
    type: "Inception",
    tint: "#F4EBFF",
    color: "#7F56D9",
    date: "01 Apr 2025",
    title: "ENP - 2025-001",
    subtitle: "Policy inception - FY 2025-26 group mediclaim commencement",
    addition: "+28",
    active: "1,208",
    netGross: "₹11.56 L",
  },
];

// ── Endorsement doc-type mapping (mirrors iWork endorsementDocTypeMap) ──
const IBP_DOC_TYPE_MAP: Record<string, string> = {
  "Employee Data Only": "policy_employee_data",
  "Employee + Dependents Data": "policy_employee_enrollment_data",
};

const ibpEndorsementDocTypeMap: Record<
  string,
  { download: (id: number) => string; process: (id: number) => string }
> = {
  policy_employee_data: {
    download: (id) => endPoints.downloadEmployeeDataTemplate(id),
    process: (id) => endPoints.processEmployeeData(id),
  },
  policy_employee_enrollment_data: {
    download: (id) => endPoints.downloadEmployeeEnrollmentTemplate(id),
    process: (id) => endPoints.processEmployeeData(id),
  },
};

// ── Upload row type ──
interface UploadRow {
  id: number;
  submittedAt: string;
  originalFileName: string;
  totalCount: number;
  successCount: number;
  errorCount: number;
  processStatus: string;
  sourceFile: { id: number; fileName: string } | null;
  errorFile: { id: number; fileName: string } | null;
}


const STATUS_CHIP_STYLES: Record<string, { bg: string; color: string }> = {
  PROCESSING: { bg: "#FEF3C7", color: "#D97706" },
  COMPLETED: { bg: "#DCFCE7", color: "#16A34A" },
  FAILED: { bg: "#FEE2E2", color: "#EF4444" },
};

// ── EndorsementUploadSection ──
function EndorsementUploadSection({
  endorsementId,
  policyId,
  showUploadedFiles = true,
  isLocked = false,
  lockReason,
  onUploadSuccess,
}: {
  endorsementId: number | null;
  policyId: number | null;
  showUploadedFiles?: boolean;
  isLocked?: boolean;
  lockReason?: string;
  onUploadSuccess?: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const plus15 = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  })();

  const [dataType, setDataType] = useState("");
  const [enrollmentStartDate, setEnrollmentStartDate] = useState(today);
  const [enrollmentEndDate, setEnrollmentEndDate] = useState(plus15);
  const [noOfEmployees, setNoOfEmployees] = useState("");
  const [noOfDependents, setNoOfDependents] = useState("");
  const [fileError, setFileError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const uploadDisabled =
    !dataType ||
    !enrollmentStartDate ||
    !enrollmentEndDate ||
    !noOfEmployees ||
    !noOfDependents;

  const hasProcessing = uploads.some((r) => r.processStatus === "PROCESSING");

  async function fetchUploadSummary(eid: number) {
    if (!policyId) return;
    setIsSummaryLoading(true);
    try {
      const summary = await apiRequest(
        endPoints.enrollmentUploadSummaryByEndorsement(policyId, eid),
        { method: "GET" }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows: UploadRow[] = (summary?.data?.data ?? []).map((r: any) => ({
        id: r.id,
        submittedAt: r.createdAt ?? r.documentProcessingFile?.updatedAt ?? "",
        originalFileName:
          r.sourceFile?.fileName ?? r.sourceFile?.file_name ?? "",
        totalCount: r.processCount ?? r.summary?.totalRecords ?? 0,
        successCount: r.successCount ?? 0,
        errorCount: r.errorCount ?? 0,
        processStatus:
          r.documentProcessingFile?.processStatus ??
          r.process_status ??
          r.processStatus ??
          "PROCESSING",
        sourceFile: r.sourceFile
          ? {
              id: r.sourceFileUploadId ?? r.sourceFile?.id,
              fileName:
                r.sourceFile?.fileName ?? r.sourceFile?.file_name ?? "",
            }
          : null,
        errorFile: r.errorFile
          ? {
              id: r.errorFileUploadId ?? r.errorFile?.id,
              fileName:
                r.errorFile?.fileName ?? r.errorFile?.file_name ?? "",
            }
          : null,
      }));
      setUploads(rows);
      const stillProcessing = rows.some((r) => r.processStatus === "PROCESSING");
      if (stillProcessing && !pollingRef.current) {
        pollingRef.current = setInterval(() => fetchUploadSummary(eid), 5000);
      } else if (!stillProcessing && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } catch {
      // keep existing rows on error
    } finally {
      setIsSummaryLoading(false);
    }
  }

  useEffect(() => {
    if (endorsementId != null && policyId) {
      fetchUploadSummary(endorsementId);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endorsementId, policyId]);

  async function handleDownloadTemplate() {
    const docType = IBP_DOC_TYPE_MAP[dataType];
    if (!docType || !policyId) return;
    try {
      const tmpl = await apiRequest(
        ibpEndorsementDocTypeMap[docType].download(policyId),
        { method: "GET" }
      );
      const templateDocumentId = tmpl?.data?.documentId;
      const fallbackFileName = tmpl?.data?.fileName || "template.xlsx";
      const fileUrl = tmpl?.data?.url;
      if (fileUrl) {
        const a = document.createElement("a");
        a.href = fileUrl;
        a.download = fallbackFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      const blobResp = await apiRequest(
        endPoints.ibpFileUploadDownloadById(templateDocumentId),
        { method: "GET", responseType: "blob" }
      );
      const blob = blobResp.data as Blob;
      const text = await blob.slice(0, 200).text();
      if (blob.type.includes("text/html") && text.includes("<html")) {
        setFileError("Template download failed. Please try again.");
        return;
      }
      const cd =
        (blobResp.headers as Record<string, string>)?.[
          "content-disposition"
        ] ?? "";
      const match = cd.match(/filename="?([^";\n]+)"?/);
      const fileName = match?.[1] || fallbackFileName;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setFileError("Template download failed. Please try again.");
    }
  }

  async function handleFileDownload(
    fileRef: { id: number; fileName: string } | null
  ) {
    if (!fileRef) return;
    try {
      const blobResp = await apiRequest(
        endPoints.ibpFileUploadDownloadById(fileRef.id),
        { method: "GET", responseType: "blob" }
      );
      const blob = blobResp.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileRef.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setFileError("File download failed. Please try again.");
    }
  }

  async function queueUpload(documentId: number) {
    if (!policyId) return;
    const docType = IBP_DOC_TYPE_MAP[dataType];
    const resp = await apiRequest(
      ibpEndorsementDocTypeMap[docType].process(policyId),
      {
        method: "POST",
        data: {
          documentId,
          documentType: docType,
          employeeCount: Number(noOfEmployees),
          dependentCount: Number(noOfDependents),
          enrollmentStartDate,
          enrollmentEndDate,
          ...(endorsementId != null ? { endorsementId } : {}),
        },
      }
    );
    if (showUploadedFiles) {
      const resolvedId =
        typeof resp?.data === "number"
          ? resp?.data
          : resp?.data?.endorsementId ?? endorsementId;
      if (resolvedId != null) await fetchUploadSummary(resolvedId);
    }
  }

  async function handleFileUpload(file: File) {
    if (!policyId) return;
    setIsUploading(true);
    setFileError("");
    setSuccessMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("companyType", "policy");
      formData.append("companyId", String(policyId));
      formData.append("documentTypeLid", "-1");
      const uploadResult = await apiRequest(endPoints.fileUpload, {
        method: "POST",
        data: formData,
      });
      const documentId =
        uploadResult?.data?.id || uploadResult?.data?.[0]?.id;
      if (!documentId) throw new Error("No documentId from upload");
      await queueUpload(documentId);
      setSuccessMsg(`${file.name} submitted successfully.`);
      onUploadSuccess?.();
    } catch {
      setFileError("File upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setFileError("");
    setSuccessMsg("");
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "csv") {
      setFileError(
        "Unsupported file type. Please upload an .xlsx or .csv file."
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File too large. Maximum allowed size is 10 MB.");
      return;
    }
    handleFileUpload(file);
  }

  return (
    <Box
      sx={{ pt: 2, borderTop: "1px solid #E7EEF6", mt: 2 }}
      onClick={(e) => e.stopPropagation()}
    >
      <Typography
        sx={{ fontSize: 16, lineHeight: 1.7, fontWeight: 600, color: "#1F2937", mb: isLocked ? 1 : 2 }}
      >
        Upload Member Data
      </Typography>

      {isLocked && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1,
            mb: 2,
            borderRadius: 1.5,
            background: "#FFF7ED",
            border: "1px solid #FED7AA",
          }}
        >
          <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#D97706" }}>
            {lockReason ??
              "Upload is disabled — Step 2 has been completed for this endorsement in iWork."}
          </Typography>
        </Box>
      )}

      {/* Form grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "220px 1fr 1fr 1fr 1fr",
          gap: 2,
          alignItems: "end",
          mb: 2,
        }}
      >
        {/* Data Type */}
        <Box>
          <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#667085", mb: 0.75 }}>
            Data Type <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            style={{
              width: "100%",
              height: 36,
              border: "1px solid #D1D5DB",
              borderRadius: 8,
              padding: "0 10px",
              fontSize: 16, lineHeight: 1.7,
              color: dataType ? "#111827" : "#9CA3AF",
              background: "#FFFFFF",
              outline: "none",
            }}
          >
            <option value="">Select type</option>
            <option value="Employee Data Only">Employee Data Only</option>
            <option value="Employee + Dependents Data">
              Employee + Dependents Data
            </option>
          </select>
        </Box>

        {/* Enrollment Start Date */}
        <Box>
          <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#667085", mb: 0.75 }}>
            Enrollment Start Date <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <input
            type="date"
            value={enrollmentStartDate}
            onChange={(e) => setEnrollmentStartDate(e.target.value)}
            style={{
              width: "100%",
              height: 36,
              border: "1px solid #D1D5DB",
              borderRadius: 8,
              padding: "0 10px",
              fontSize: 16, lineHeight: 1.7,
              color: "#111827",
              background: "#FFFFFF",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </Box>

        {/* Enrollment End Date */}
        <Box>
          <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#667085", mb: 0.75 }}>
            Enrollment End Date <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <input
            type="date"
            value={enrollmentEndDate}
            onChange={(e) => setEnrollmentEndDate(e.target.value)}
            style={{
              width: "100%",
              height: 36,
              border: "1px solid #D1D5DB",
              borderRadius: 8,
              padding: "0 10px",
              fontSize: 16, lineHeight: 1.7,
              color: "#111827",
              background: "#FFFFFF",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </Box>

        {/* Number of Employees */}
        <Box>
          <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#667085", mb: 0.75 }}>
            No. of Employees <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <input
            type="number"
            min="0"
            value={noOfEmployees}
            onChange={(e) => setNoOfEmployees(e.target.value)}
            placeholder="0"
            style={{
              width: "100%",
              height: 36,
              border: "1px solid #D1D5DB",
              borderRadius: 8,
              padding: "0 10px",
              fontSize: 16, lineHeight: 1.7,
              color: "#111827",
              background: "#FFFFFF",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </Box>

        {/* Number of Dependents */}
        <Box>
          <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#667085", mb: 0.75 }}>
            No. of Dependents <span style={{ color: "#EF4444" }}>*</span>
          </Typography>
          <input
            type="number"
            min="0"
            value={noOfDependents}
            onChange={(e) => setNoOfDependents(e.target.value)}
            placeholder="0"
            style={{
              width: "100%",
              height: 36,
              border: "1px solid #D1D5DB",
              borderRadius: 8,
              padding: "0 10px",
              fontSize: 16, lineHeight: 1.7,
              color: "#111827",
              background: "#FFFFFF",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </Box>
      </Box>

      {/* Actions row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        {/* Download Template */}
        <Button
          disabled={!dataType || !policyId}
          onClick={handleDownloadTemplate}
          startIcon={<Download size={13} />}
          size="small"
          variant="outlined"
          sx={{
            fontSize: 16, lineHeight: 1.7,
            textTransform: "none",
            borderColor: "#D1D5DB",
            color: "#374151",
            px: 1.5,
            py: 0.75,
            "&:hover": { borderColor: "#9CA3AF", background: "#F9FAFB" },
            "&.Mui-disabled": { opacity: 0.45 },
          }}
        >
          Download Template
        </Button>

        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv"
          hidden
          onChange={onFileChange}
        />
        <Button
          disabled={uploadDisabled || isUploading || !policyId || isLocked}
          onClick={() => fileInputRef.current?.click()}
          startIcon={
            isUploading ? (
              <CircularProgress size={12} sx={{ color: "#FFFFFF" }} />
            ) : (
              <Upload size={13} />
            )
          }
          size="small"
          variant="contained"
          sx={{
            fontSize: 16, lineHeight: 1.7,
            textTransform: "none",
            background: "#2F74D6",
            color: "#FFFFFF",
            px: 1.5,
            py: 0.75,
            boxShadow: "none",
            "&:hover": { background: "#1849A9", boxShadow: "none" },
            "&.Mui-disabled": { opacity: 0.45 },
          }}
        >
          {isUploading ? "Uploading…" : "Upload File"}
        </Button>
      </Box>

      {/* Inline feedback */}
      {fileError && (
        <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#EF4444", mb: 1.5 }}>
          {fileError}
        </Typography>
      )}
      {successMsg && (
        <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#16A34A", mb: 1.5 }}>
          {successMsg}
        </Typography>
      )}

      {/* ── Uploaded files table ── */}
      {showUploadedFiles && <Box sx={{ mt: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography sx={{ fontSize: 16, lineHeight: 1.7, fontWeight: 600, color: "#1F2937" }}>
            Uploaded Files
          </Typography>
          {hasProcessing && (
            <Button
              onClick={() => endorsementId != null && fetchUploadSummary(endorsementId)}
              startIcon={<RefreshCw size={12} />}
              size="small"
              variant="text"
              sx={{
                fontSize: 16, lineHeight: 1.7,
                textTransform: "none",
                color: "#2F74D6",
                py: 0.5,
              }}
            >
              Refresh
            </Button>
          )}
        </Box>

        {isSummaryLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={20} sx={{ color: "#1C57B8" }} />
          </Box>
        ) : uploads.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Upload size={32} color="#98A2B3" />
            <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#667085", mt: 1 }}>
              No uploads yet
            </Typography>
            <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#98A2B3" }}>
              Upload a member data file using the form above.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              border: "1px solid #D9E5F2",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "140px 1fr 90px 80px 80px 80px 110px",
                px: 1.5,
                py: 1.5,
                background: "#4B6B8A",
                borderBottom: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {[
                "UPLOAD DATE",
                "FILE NAME",
                "TOTAL",
                "SUCCESS",
                "FAILED",
                "ERROR FILE",
                "STATUS",
              ].map((col) => (
                <Typography
                  key={col}
                  sx={{ fontSize: 15, lineHeight: 1.5, color: "#fff", fontWeight: 600 }}
                >
                  {col}
                </Typography>
              ))}
            </Box>

            {/* Rows */}
            {uploads.map((row, ri) => {
              const chipStyle =
                STATUS_CHIP_STYLES[row.processStatus?.toUpperCase?.()] ??
                STATUS_CHIP_STYLES.PROCESSING;
              return (
                <Box
                  key={row.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "140px 1fr 90px 80px 80px 80px 110px",
                    px: 1.5,
                    py: 1,
                    alignItems: "center",
                    borderBottom:
                      ri < uploads.length - 1
                        ? "1px solid #EEF2F6"
                        : "none",
                    background: "#FFFFFF",
                  }}
                >
                  <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#475467" }}>
                    {row.submittedAt}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      cursor: "pointer",
                    }}
                    onClick={() => handleFileDownload(row.sourceFile)}
                  >
                    <Typography
                      sx={{
                        fontSize: 16, lineHeight: 1.7,
                        color: "#175CD3",
                        textDecoration: "underline",
                      }}
                    >
                      {row.originalFileName}
                    </Typography>
                    <Download size={12} color="#175CD3" />
                  </Box>

                  <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#475467" }}>
                    {row.totalCount}
                  </Typography>
                  <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#16A34A" }}>
                    {row.successCount}
                  </Typography>
                  <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#EF4444" }}>
                    {row.errorCount}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      cursor: row.errorFile ? "pointer" : "default",
                      opacity: row.errorFile ? 1 : 0.35,
                    }}
                    onClick={() =>
                      row.errorFile && handleFileDownload(row.errorFile)
                    }
                  >
                    <Download
                      size={14}
                      color={row.errorFile ? "#175CD3" : "#98A2B3"}
                    />
                    {row.errorFile && (
                      <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#175CD3" }}>
                        Download
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: "inline-flex",
                      px: 1,
                      py: 0.35,
                      borderRadius: 999,
                      background: chipStyle.bg,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 16, lineHeight: 1.7,
                        color: chipStyle.color,
                        fontWeight: 600,
                      }}
                    >
                      {row.processStatus
                        ? row.processStatus.charAt(0) +
                          row.processStatus.slice(1).toLowerCase()
                        : "—"}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>}
    </Box>
  );
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

function EnrollmentTable({
  companyId,
  onOpenECard,
  onOpenDependents,
  onExport,
}: {
  companyId: number | null;
  onOpenECard: (row: EnrolmentRow) => void;
  onOpenDependents: (row: EnrolmentRow) => void;
  onExport: () => void;
}) {
  const navigate = useNavigate();
  const { localizationData } = useLocalization();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("All Members");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [enrollmentFilter, setEnrollmentFilter] = useState("All Enrollment");
  const [genderFilter, setGenderFilter] = useState("All Genders");
  const [additionTypeFilter, setAdditionTypeFilter] =
    useState("All Addition Type");
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [actionRow, setActionRow] = useState<EnrolmentRow | null>(null);
  const [page, setPage] = useState(1);
  const [apiRows, setApiRows] = useState<EnrolmentRow[]>([]);
  const [apiTotalCount, setApiTotalCount] = useState(0);
  const pageSize = PAGE_SIZE;

  // Debounce search → server-side
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Fetch employee listing
  const { mutate: fetchRows, isPending: apiLoading } = useApiMutation({
    config: {
      onSuccess: (res: any) => {
        const raw: ApiEmployeeRow[] = res?.data?.data ?? [];
        setApiRows(raw.map((row) => mapApiRow(row, localizationData?.data)));
        setApiTotalCount(raw[0]?.totalCount ?? raw.length);
      },
      onError: () => {
        setApiRows([]);
        setApiTotalCount(0);
      },
    },
  });

  useEffect(() => {
    if (!companyId) return;
    fetchRows({
      endpoint: endPoints.generateHRReports + "ibp_hr_employee_listing?limit=0",
      method: "POST",
      data: {
        companyId,
        search: debouncedSearch,
        gender:      genderFilter      !== "All Genders"    ? genderFilter      : "",
        enrollStatus: enrollmentFilter !== "All Enrollment" ? enrollmentFilter  : "",
        limit:  PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      },
    });
  }, [companyId, debouncedSearch, genderFilter, enrollmentFilter, page]);

  const [resetMsg, setResetMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { mutate: sendResetPassword } = useApiMutation({
    config: {
      onSuccess: () => setResetMsg({ type: "success", text: "Password reset email sent successfully." }),
      onError: () => setResetMsg({ type: "error", text: "Failed to send password reset email." }),
    },
  });

  const memberOptions = useMemo(
    () => ["All Members", "Self Only", "With Dependents"],
    []
  );
  const statusOptions = useMemo(
    () => ["All Status", ...new Set(apiRows.map((r) => r.status).filter((s) => s !== "--"))],
    [apiRows]
  );
  const enrollmentOptions = [
    "All Enrollment",
    "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED",
    "EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED",
    "EMPLOYEE_ENROLLMENT_STATUS_PENDING",
    "EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS",
  ];
  const genderOptions = ["All Genders", "Male", "Female", "Other"];
  const additionTypeOptions = useMemo(
    () => [
      "All Addition Type",
      ...new Set(apiRows.map((r) => r.additionType).filter((t) => t !== "--")),
    ],
    [apiRows]
  );

  const filteredRows = useMemo(() => {
    return apiRows.filter((row) => {
      const memberType =
        Number(row.dependents) > 0 ? "With Dependents" : "Self Only";
      return (
        (memberFilter === "All Members" || memberType === memberFilter) &&
        (statusFilter === "All Status" || row.status === statusFilter) &&
        (additionTypeFilter === "All Addition Type" ||
          row.additionType === additionTypeFilter)
      );
    });
  }, [apiRows, additionTypeFilter, memberFilter, statusFilter]);

  const actionItems = actionRow
    ? [
        actionRow.status === "Active" ? "Block Access" : "Unblock Access",
        "Tag as VIP",
        "Edit Employee",
        "Reset Password",
      ]
    : [];

  const totalPages = Math.max(1, Math.ceil(apiTotalCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = filteredRows;

  return (
    <Box
      sx={{
        background: "#FFFFFF",
        border: "1px solid #E3EDF7",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: "1px solid #E9EEF5",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <PortalSearchField
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by Emp #, Name, Email, Phone..."
            icon={<Search size={14} color="#98A2B3" />}
            width={370}
            height={32}
            borderRadius="8px"
            fontSize={11.5}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <PortalSelectControl
            value={memberFilter}
            onChange={setMemberFilter}
            options={memberOptions}
            width={113}
            height={32}
            borderRadius="8px"
            fontSize={11.5}
          />
          <PortalSelectControl
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            width={96}
            height={32}
            borderRadius="8px"
            fontSize={11.5}
          />
          <PortalSelectControl
            value={enrollmentFilter}
            onChange={(v) => { setEnrollmentFilter(v); setPage(1); }}
            options={enrollmentOptions}
            width={117}
            height={32}
            borderRadius="8px"
            fontSize={11.5}
          />
          <PortalSelectControl
            value={genderFilter}
            onChange={(v) => { setGenderFilter(v); setPage(1); }}
            options={genderOptions}
            width={108}
            height={32}
            borderRadius="8px"
            fontSize={11.5}
          />
          <PortalSelectControl
            value={additionTypeFilter}
            onChange={setAdditionTypeFilter}
            options={additionTypeOptions}
            width={144}
            height={32}
            borderRadius="8px"
            fontSize={11.5}
          />
          <Button
            onClick={onExport}
            startIcon={<Download size={14} />}
            sx={{
              textTransform: "none",
              height: 32,
              px: 1.5,
              minWidth: 92,
              borderRadius: "8px",
              background: "#1C57B8",
              color: "#FFFFFF",
              fontSize: 16, lineHeight: 1.7,
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": { background: "#184D9F", boxShadow: "none" },
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", borderBottom: "1px solid #E9EEF5" }}>
        <Box
          sx={{
            width: 240,
            flexShrink: 0,
            borderRight: "1px solid #E9EEF5",
            background: "#FFFFFF",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "90px 150px",
              px: 1.5,
              py: 1.2,
              background: "#F8FAFC",
              borderBottom: "1px solid #E9EEF5",
            }}
          >
            {["Emp ID", "Employee Name"].map((label) => (
              <Typography
                key={label}
                sx={{ color: "#6B7280", fontSize: 16, lineHeight: 1.7, fontWeight: 600 }}
              >
                {label}
              </Typography>
            ))}
          </Box>

          {apiLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={20} sx={{ color: "#2556A6" }} />
            </Box>
          ) : paginatedRows.map((row) => (
            <Box
              key={`fixed-${row.id}`}
              sx={{
                display: "grid",
                gridTemplateColumns: "90px 150px",
                px: 1.5,
                py: 1.15,
                alignItems: "center",
                borderBottom: "1px solid #F0F4F8",
                minHeight: 44,
              }}
            >
              <Typography
                sx={{
                  color: "#2F74D6",
                  fontSize: 16, lineHeight: 1.7,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate(`/hr-portal/enrollment/${row.id}`)
                }
              >
                {row.employeeCode}
              </Typography>
              <Typography sx={{ color: "#344054", fontSize: 16, lineHeight: 1.7 }}>
                {row.employeeName}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ flex: 1, overflowX: "auto" }}>
          <Box sx={{ minWidth: 1260 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "70px 92px 55px 170px 132px 110px 110px 95px 110px 80px 90px 112px 105px 68px",
                px: 1.5,
                py: 1.2,
                background: "#F8FAFC",
                borderBottom: "1px solid #E9EEF5",
              }}
            >
              {[
                "Gender",
                "DOB",
                "Age",
                "Email",
                "Mobile",
                "Enroll Status",
                "Addition Type",
                "Sum Insured",
                "Dependents",
                "E-Card",
                "Status",
                "Reminder",
                "Last Login",
                "Actions",
              ].map((label) => (
                <Typography
                  key={label}
                  sx={{ color: "#6B7280", fontSize: 16, lineHeight: 1.7, fontWeight: 600 }}
                >
                  {label}
                </Typography>
              ))}
            </Box>

            {paginatedRows.map((row) => (
              <Box
                key={row.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    "70px 92px 55px 170px 132px 110px 110px 95px 110px 80px 90px 112px 105px 68px",
                  px: 1.5,
                  py: 1.15,
                  alignItems: "center",
                  borderBottom: "1px solid #F0F4F8",
                  minHeight: 44,
                }}
              >
                <Typography sx={{ color: "#344054", fontSize: 16, lineHeight: 1.7 }}>
                  {row.gender}
                </Typography>
                <Typography sx={{ color: "#344054", fontSize: 16, lineHeight: 1.7 }}>
                  {row.dob}
                </Typography>
                <Typography sx={{ color: "#344054", fontSize: 16, lineHeight: 1.7 }}>
                  {row.age}
                </Typography>
                <Typography sx={{ color: "#344054", fontSize: 16, lineHeight: 1.7 }}>
                  {row.email}
                </Typography>
                <Typography sx={{ color: "#344054", fontSize: 16, lineHeight: 1.7 }}>
                  {row.mobile}
                </Typography>

                <Box
                  sx={{
                    width: "fit-content",
                    px: 1.1,
                    py: 0.45,
                    borderRadius: 999,
                    background: getStatusStyle(row.enrolStatus).bg,
                    color: getStatusStyle(row.enrolStatus).color,
                    border: `1px solid ${getStatusStyle(row.enrolStatus).border}`,
                    fontSize: 16, lineHeight: 1.7,
                    fontWeight: 600,
                  }}
                >
                  {row.enrolStatus}
                </Box>

                <Box
                  sx={{
                    width: "fit-content",
                    px: 1.1,
                    py: 0.45,
                    borderRadius: 999,
                    background: "#FAF5FF",
                    color: "#9333EA",
                    border: "1px solid #E9D5FF",
                    fontSize: 16, lineHeight: 1.7,
                    fontWeight: 600,
                  }}
                >
                  {row.additionType}
                </Box>

                <Typography
                  sx={{ color: "#111827", fontSize: 16, lineHeight: 1.7, fontWeight: 600 }}
                >
                  {row.sumInsured}
                </Typography>

                <Box
                  onClick={() => onOpenDependents(row)}
                  sx={{
                    width: 72,
                    height: 32,
                    px: 1,
                    borderRadius: "8px",
                    background: "#F8FAFC",
                    border: "1px solid #E5E7EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.55 }}
                  >
                    <UserRound size={12} color="#98A2B3" />
                    <Typography sx={{ color: "#111827", fontSize: 16, lineHeight: 1.7 }}>
                      {row.dependents}
                    </Typography>
                  </Box>
                  <ChevronDown size={12} color="#98A2B3" />
                </Box>

                <Box
                  onClick={() => onOpenECard(row)}
                  sx={{
                    width: "fit-content",
                    px: 0.9,
                    py: 0.35,
                    borderRadius: 999,
                    border: "1px solid #DBEAFE",
                    color: "#2563EB",
                    background: "#F8FBFF",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.45,
                    fontSize: 16, lineHeight: 1.7,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Eye size={11} />
                  {row.eCard}
                </Box>

                <Box
                  sx={{
                    width: "fit-content",
                    px: 1.1,
                    py: 0.45,
                    borderRadius: 999,
                    background: getStatusStyle(row.status).bg,
                    color: getStatusStyle(row.status).color,
                    border: `1px solid ${getStatusStyle(row.status).border}`,
                    fontSize: 16, lineHeight: 1.7,
                    fontWeight: 600,
                  }}
                >
                  {row.status}
                </Box>

                <Button
                  disabled={row.enrolStatus !== "Pending"}
                  sx={{
                    width: "fit-content",
                    minWidth: 96,
                    height: 30,
                    px: 1.25,
                    borderRadius: "8px",
                    textTransform: "none",
                    fontSize: 16, lineHeight: 1.7,
                    fontWeight: 600,
                    background:
                      row.enrolStatus === "Pending" ? "#EFF6FF" : "#F8FAFC",
                    color:
                      row.enrolStatus === "Pending" ? "#2563EB" : "#98A2B3",
                    border: `1px solid ${
                      row.enrolStatus === "Pending" ? "#BFDBFE" : "#E5E7EB"
                    }`,
                    boxShadow: "none",
                    "&:hover": {
                      background:
                        row.enrolStatus === "Pending" ? "#DBEAFE" : "#F8FAFC",
                      boxShadow: "none",
                    },
                    "&.Mui-disabled": {
                      color: "#98A2B3",
                      borderColor: "#E5E7EB",
                      background: "#F8FAFC",
                    },
                  }}
                >
                  Send Reminder
                </Button>

                <Typography sx={{ color: "#344054", fontSize: 16, lineHeight: 1.7 }}>
                  {row.lastLogin}
                </Typography>

                <Box
                  onClick={(event) => {
                    setActionAnchorEl(event.currentTarget);
                    setActionRow(row);
                  }}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#98A2B3",
                    cursor: "pointer",
                  }}
                >
                  <MoreHorizontal size={14} />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {filteredRows.length === 0 ? (
          <Box
            sx={{
              px: 3,
              py: 6,
              textAlign: "center",
              borderBottom: "1px solid #F0F4F8",
              width: "100%",
            }}
          >
            <Typography sx={{ color: "#667085", fontSize: 16, lineHeight: 1.7 }}>
              No employees match the selected filters.
            </Typography>
          </Box>
        ) : null}
      </Box>

      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid #E9EEF5",
        }}
      >
        <Typography sx={{ color: "#6B7280", fontSize: 16, lineHeight: 1.7 }}>
          Showing{" "}
          {apiTotalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
          {Math.min(currentPage * pageSize, apiTotalCount)} of{" "}
          {apiTotalCount}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {[
            {
              key: "prev",
              label: <ChevronLeft size={14} />,
              disabled: currentPage === 1,
            },
            ...Array.from({ length: totalPages }, (_, index) => ({
              key: `page-${index + 1}`,
              label: String(index + 1),
              active: currentPage === index + 1,
            })),
            {
              key: "next",
              label: <ChevronRight size={14} />,
              disabled: currentPage === totalPages,
            },
          ].map((item) => (
            <Box
              key={item.key}
              onClick={() => {
                if (item.key === "prev" && currentPage > 1) {
                  setPage(currentPage - 1);
                } else if (item.key === "next" && currentPage < totalPages) {
                  setPage(currentPage + 1);
                } else if (item.key.startsWith("page-")) {
                  setPage(Number(item.label));
                }
              }}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: item.active ? "none" : "1px solid #E5E7EB",
                background: item.active ? "#1C57B8" : "#FFFFFF",
                color: item.active ? "#FFFFFF" : "#6B7280",
                opacity: item.disabled ? 0.45 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16, lineHeight: 1.7,
                fontWeight: 600,
                cursor: item.disabled ? "default" : "pointer",
              }}
            >
              {item.label}
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ minHeight: 14 }} />

      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={() => {
          setActionAnchorEl(null);
          setActionRow(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 0.75,
            minWidth: 180,
            borderRadius: "18px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 18px 36px rgba(15, 23, 42, 0.14)",
            p: 1,
          },
        }}
      >
        {actionItems.map((item) => (
          <MenuItem
            key={item}
            onClick={() => {
              if (item === "Edit Employee" && actionRow) {
                navigate(`/hr-portal/enrollment/${actionRow.employeeCode}`);
              } else if (item === "Reset Password" && actionRow) {
                const email = actionRow.email !== "--" ? actionRow.email : null;
                if (!email) {
                  setResetMsg({ type: "error", text: "No email address on file for this employee." });
                } else {
                  sendResetPassword({
                    endpoint: endPoints.ibpSendResetMailByEmail(email, getSubdomainFromUrl() ?? undefined),
                    method: "POST",
                    data: {},
                  });
                }
              }
              setActionAnchorEl(null);
              setActionRow(null);
            }}
            sx={{
              minHeight: 40,
              borderRadius: "12px",
              fontSize: 16, lineHeight: 1.7,
              color: "#111827",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <UserRound size={14} color="#667085" />
            {item}
          </MenuItem>
        ))}
      </Menu>

      <Snackbar
        open={!!resetMsg}
        autoHideDuration={4000}
        onClose={() => setResetMsg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={resetMsg?.type ?? "info"} onClose={() => setResetMsg(null)} sx={{ width: "100%" }}>
          {resetMsg?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function ECardDialog({
  open,
  companyEmployeeId,
  companyId,
  onClose,
}: {
  open: boolean;
  companyEmployeeId: string;
  companyId: number;
  onClose: () => void;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);

  const { mutate: fetchSignedUrl, isPending: pdfLoading } = useApiMutation({
    config: {
      onSuccess: (res: any) => {
        const url = res?.data?.signedUrl ?? null;
        setPdfUrl(url);
        if (!url) setFetchError(true);
      },
      onError: () => setFetchError(true),
    },
  });

  useEffect(() => {
    if (!open || !companyEmployeeId) return;
    setPdfUrl(null);
    setFetchError(false);
    fetchSignedUrl({
      endpoint: endPoints.eCardSignedUrl,
      method: "POST",
      data: { companyId, companyEmployeeId },
    });
  }, [open, companyEmployeeId, companyId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: {
          width: 820,
          maxWidth: "calc(100vw - 32px)",
          borderRadius: "16px",
          boxShadow: "0 36px 90px rgba(15, 23, 42, 0.34)",
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ px: 4, py: 2.5, borderBottom: "1px solid #E8EEF5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: 22, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 600, color: "#111827" }}>Insurance E-Card</Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "#6B7280" }}>
          <X size={18} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0, height: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {pdfLoading && <CircularProgress sx={{ color: "#2556A6" }} />}
        {fetchError && !pdfLoading && (
          <Typography sx={{ color: "#6B7280", fontSize: 16, lineHeight: 1.7 }}>E-card not available for this employee.</Typography>
        )}
        {pdfUrl && !pdfLoading && (
          <iframe
            src={pdfUrl}
            title="Insurance E-Card"
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DependentsDialog({
  open,
  employeeName,
  dependents,
  onClose,
}: {
  open: boolean;
  employeeName: string;
  dependents: EnrolmentDependent[];
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      PaperProps={{
        sx: {
          width: 980,
          maxWidth: "calc(100vw - 32px)",
          borderRadius: "16px",
          boxShadow: "0 36px 90px rgba(15, 23, 42, 0.24)",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          px: 4,
          py: 3,
          borderBottom: "1px solid #E8EEF5",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontSize: 26, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 600, color: "#111827" }}>
          Dependents ({dependents.length})
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "#667085" }}>
          <X size={22} />
        </IconButton>
      </Box>

      <DialogContent
        sx={{ p: 3.5, display: "flex", flexDirection: "column", gap: 3 }}
      >
        {dependents.length > 0 ? (
          dependents.map((dependent) => (
            <Box
              key={`${employeeName}-${dependent.name}`}
              sx={{
                border: "1px solid #EEF2F6",
                borderRadius: "16px",
                px: 3,
                py: 3,
                background: "#FFFFFF",
                boxShadow: "0 12px 32px rgba(15, 23, 42, 0.05)",
                display: "grid",
                gridTemplateColumns: "110px 1fr",
                gap: 2,
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "#255DA8",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 30, lineHeight: 1.25, letterSpacing: "-0.4px",
                  fontWeight: 600,
                }}
              >
                {getInitials(dependent.name)}
              </Box>

              <Box>
                <Typography
                  sx={{ fontSize: 22, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 600, color: "#172033" }}
                >
                  {dependent.name}
                </Typography>
                <Box
                  sx={{
                    mt: 2,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                  }}
                >
                  {[
                    ["Relationship", dependent.relationship],
                    ["Gender", dependent.gender],
                    ["Date of Birth", dependent.dob],
                  ].map(([label, value], index) => (
                    <Box
                      key={label}
                      sx={{
                        px: index === 0 ? 0 : 3,
                        borderLeft: index === 0 ? "none" : "1px solid #E5E7EB",
                      }}
                    >
                      <Typography
                        sx={{ fontSize: 22, lineHeight: 1.4, letterSpacing: "-0.2px", color: "#667085", mb: 1.25 }}
                      >
                        {label}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 22, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 600, color: "#172033" }}
                      >
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          ))
        ) : (
          <Box
            sx={{
              minHeight: 180,
              border: "1px dashed #D8E0EA",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ fontSize: 22, lineHeight: 1.4, letterSpacing: "-0.2px", color: "#667085" }}>
              No dependents available for this employee.
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Endorsement type visual config ──
const ENDORSEMENT_TYPE_STYLE: Record<string, { tint: string; color: string }> =
  {
    INCEPTION: { tint: "#F4EBFF", color: "#7F56D9" },
    ADDITION: { tint: "#EFF8FF", color: "#2F74D6" },
    DELETION: { tint: "#FEF3F2", color: "#F04438" },
    CORRECTION: { tint: "#FFF7ED", color: "#D97706" },
  };

function endorsementTypeStyle(type: string) {
  return (
    ENDORSEMENT_TYPE_STYLE[type?.toUpperCase()] ?? ENDORSEMENT_TYPE_STYLE.INCEPTION
  );
}

export function EndorsementManagement({ policyId }: { policyId?: number | null } = {}) {
  const { localizationData } = useLocalization();
  const [expandedCard, setExpandedCard] = useState(-1);
  const companyId = getCompanyId();

  const [overviewData, setOverviewData] = useState<Record<string, unknown> | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [metricsData, setMetricsData] = useState<Record<string, unknown> | null>(null);
  const [premiumApiData, setPremiumApiData] = useState<Record<string, unknown> | null>(null);
  const [endorsementList, setEndorsementList] = useState<Record<string, unknown>[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(false);

  function refreshAll() {
    if (!companyId) return;
    const body = { companyId, policyId: policyId ?? "" };
    setOverviewLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiRequest(endPoints.generateHRReports + "endorsement_overview", { method: "POST", data: body })
      .then((res: any) => setOverviewData(res?.data?.data?.[0] ?? null))
      .finally(() => setOverviewLoading(false));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiRequest(endPoints.generateHRReports + "endorsement_employee_metrics", { method: "POST", data: body })
      .then((res: any) => setMetricsData(res?.data?.data?.[0] ?? null));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiRequest(endPoints.generateHRReports + "endorsement_premium_components", { method: "POST", data: body })
      .then((res: any) => setPremiumApiData(res?.data?.data?.[0] ?? null));
    setListLoading(true);
    setListError(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiRequest(endPoints.generateHRReports + "endorsement_list", { method: "POST", data: body })
      .then((res: any) => setEndorsementList(res?.data?.data ?? []))
      .catch(() => setListError(true))
      .finally(() => setListLoading(false));
  }

  useEffect(() => { refreshAll(); }, [companyId, policyId]); // eslint-disable-line react-hooks/exhaustive-deps

  // policyId for the new-endorsement upload form — use first real endorsement's policyId
  const topLevelPolicyId: number | null =
    endorsementList.length > 0
      ? (endorsementList[0].policyId as number) ?? null
      : null;

  // Derived overview
  const netGrossPremium = overviewData ? String(overviewData.netGrossPremium ?? "—") : "—";
  const totalEndorsementsCount = overviewData ? String(overviewData.totalEndorsements ?? "—") : "—";

  // Derived employee metrics grid
  const endorsementSummaryDisplay: [string, string][] = metricsData
    ? [
        ["Employees at Inception", String(metricsData.employeesAtInception ?? 0)],
        ["Employees in Addition", String(metricsData.employeesInAddition ?? 0)],
        ["Employees in Deletion", String(metricsData.employeesInDeletion ?? 0)],
        ["Active Employees", String(metricsData.activeEmployees ?? 0)],
        ["Lives at Inception", String(metricsData.livesAtInception ?? 0)],
        ["Lives in Addition", String(metricsData.livesInAddition ?? 0)],
        ["Lives in Deletion", String(metricsData.livesInDeletion ?? 0)],
        ["Active Lives", String(metricsData.activeLives ?? 0)],
      ]
    : (endorsementSummary as [string, string][]);

  // Derived premium rows [label, amount, color]
  const fmt = (v: unknown) => (v == null ? "—" : String(v));
  const premiumRowsDisplay: [string, string, string][] = premiumApiData
    ? [
        ["Base Premium", fmt(premiumApiData.basePremium), "#364152"],
        [`Tax Amount (${getTaxLabel(localizationData?.data)} 18%)`, fmt(premiumApiData.taxAmount), "#364152"],
        ["Gross Premium", fmt(premiumApiData.grossPremium), "#364152"],
        ["Addition Premium", fmt(premiumApiData.additionPremium), "#16a34a"],
        ["Deletion Premium", fmt(premiumApiData.deletionPremium), "#ef4444"],
        ["Correction Addition Premium", fmt(premiumApiData.correctionAdditionPremium), "#16a34a"],
        ["Correction Deletion Premium", fmt(premiumApiData.correctionDeletionPremium), "#ef4444"],
        ["Net Premium", fmt(premiumApiData.netPremium), "#111827"],
        [`Net Tax Amount (${getTaxLabel(localizationData?.data)} 18%)`, fmt(premiumApiData.netTaxAmount), "#364152"],
      ]
    : (premiumRows as [string, string, string][]);

  const netGrossPremiumRow = premiumApiData ? fmt(premiumApiData.netGrossPremium) : getCurrencySymbolPrefix(localizationData?.data) + "2.36 Cr";

  // Accordion items — real list when loaded, mock while pending
  const accordionItems = endorsementList.length > 0 ? endorsementList : INDIVIDUAL_ENDORSEMENTS;
  const isRealList = endorsementList.length > 0;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontSize: 30, lineHeight: 1.25, letterSpacing: "-0.4px", fontWeight: 600, color: "#1F2937" }}>
          Endorsement Management
        </Typography>
      </Box>

      {/* ── New Endorsement Upload ── */}
      <Box
        sx={{
          background: "#FFFFFF",
          border: "1px solid #E7EEF6",
          borderRadius: "14px",
          p: 3,
          boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.75 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              background: "#EEF4FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2F74D6",
            }}
          >
            <Upload size={17} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 16, lineHeight: 1.7, fontWeight: 600, color: "#1F2937" }}>
              New Endorsement
            </Typography>
            <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#667085" }}>
              Upload member data to create a new endorsement record
            </Typography>
          </Box>
        </Box>
        <EndorsementUploadSection
          endorsementId={null}
          policyId={topLevelPolicyId}
          showUploadedFiles={false}
          onUploadSuccess={refreshAll}
        />
      </Box>

      <Box
        sx={{
          background: "#DDECF8",
          borderRadius: "16px",
          p: 2,
        }}
      >
        <Box
          sx={{
            background: "#FFFFFF",
            border: "1px solid #E7EEF6",
            borderRadius: "14px",
            p: 3,
            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "14px",
                  background: "#EEF4FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2F74D6",
                }}
              >
                <FileText size={20} />
              </Box>
              <Box>
                <Typography
                  sx={{ fontSize: 22, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 600, color: "#1F2937" }}
                >
                  All Endorsements Overview
                </Typography>
                <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#667085", mt: 0.75 }}>
                  Cumulative summary including all inception & endorsements till
                  date
                </Typography>
              </Box>
            </Box>
            <ChevronDown size={18} color="#111827" />
          </Box>

          <Box
            sx={{
              mt: 3,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
            }}
          >
            {overviewLoading ? (
              <Box
                sx={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  justifyContent: "center",
                  py: 2,
                }}
              >
                <CircularProgress size={20} sx={{ color: "#1C57B8" }} />
              </Box>
            ) : (
              [
                ["Net Gross Premium", netGrossPremium, "#16A34A"],
                ["Total Endorsements", totalEndorsementsCount, "#111827"],
              ].map(([label, value, color]) => (
                <Box
                  key={label}
                  sx={{
                    minHeight: 68,
                    borderRadius: "10px",
                    border: "1px solid #E6EDF5",
                    px: 2.5,
                    py: 1.8,
                  }}
                >
                  <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#667085" }}>
                    {label}
                  </Typography>
                  <Typography
                    sx={{ mt: 0.6, fontSize: 22, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 600, color }}
                  >
                    {value}
                  </Typography>
                </Box>
              ))
            )}
          </Box>

          <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px solid #E7EEF6" }}>
            <Typography
              sx={{ fontSize: 16, lineHeight: 1.7, fontWeight: 600, color: "#1F2937", mb: 2.25 }}
            >
              Employee Information (All-Time Cumulative)
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                rowGap: 2,
              }}
            >
              {endorsementSummaryDisplay.map(([label, value], index) => (
                <Box
                  key={label}
                  sx={{
                    minHeight: 62,
                    px: index % 5 === 0 ? 0 : 2,
                    borderLeft: index % 5 === 0 ? "none" : "1px solid #E5E7EB",
                  }}
                >
                  <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#667085", mb: 1.1 }}>
                    {label}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 22, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 600, color: "#1F2937" }}
                  >
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              mt: 3,
              pt: 2.5,
              borderTop: "1px solid #E7EEF6",
              display: "grid",
              gridTemplateColumns: "470px 1fr",
              gap: 3,
              alignItems: "end",
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 16, lineHeight: 1.7,
                  fontWeight: 600,
                  color: "#1F2937",
                  mb: 1.5,
                }}
              >
                Premium Information (All-Time Cumulative)
              </Typography>
              <Box
                sx={{
                  border: "1px solid #D9E5F2",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 130px",
                    px: 2,
                    py: 1.2,
                    background: "#F8FAFC",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  <Typography
                    sx={{ fontSize: 16, lineHeight: 1.7, color: "#667085", fontWeight: 600 }}
                  >
                    PREMIUM COMPONENT
                  </Typography>
                  <Typography
                    sx={{ fontSize: 16, lineHeight: 1.7, color: "#667085", fontWeight: 600 }}
                  >
                    AMOUNT
                  </Typography>
                </Box>
                {premiumRowsDisplay.map(([label, amount, color], index) => (
                  <Box
                    key={label}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 130px",
                      px: 2,
                      py: 1.1,
                      borderBottom:
                        index < premiumRowsDisplay.length - 1
                          ? "1px solid #EEF2F6"
                          : "none",
                      background:
                        label === "Net Gross Premium"
                          ? "#EEF4FF"
                          : label === "Gross Premium" || label === "Net Premium"
                          ? "#F9FAFB"
                          : "#FFFFFF",
                    }}
                  >
                    <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#475467" }}>
                      {label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 16, lineHeight: 1.7,
                        color,
                        fontWeight:
                          label === "Gross Premium" ||
                          label === "Net Premium" ||
                          label === "Net Gross Premium"
                            ? 700
                            : 500,
                      }}
                    >
                      {amount}
                    </Typography>
                  </Box>
                ))}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 130px",
                    px: 2,
                    py: 1.1,
                    background: "#EAF2FF",
                  }}
                >
                  <Typography
                    sx={{ fontSize: 16, lineHeight: 1.7, color: "#1849A9", fontWeight: 600 }}
                  >
                    Net Gross Premium
                  </Typography>
                  <Typography
                    sx={{ fontSize: 16, lineHeight: 1.7, color: "#1849A9", fontWeight: 600 }}
                  >
                    {netGrossPremiumRow}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                minHeight: 300,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                pb: 1,
              }}
            >
              <Box
                component="img"
                src={endorsementCalculatorIllustration}
                alt="Endorsement illustration"
                sx={{
                  width: 320,
                  maxWidth: "100%",
                  height: "auto",
                  objectFit: "contain",
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 2.5 }}>
          <Typography
            sx={{ fontSize: 22, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 600, color: "#1F2937", mb: 1.75 }}
          >
            Individual Endorsements
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {listLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : listError ? (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1,
                    mb: 0.75,
                    borderRadius: 1.5,
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                  }}
                >
                  <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#EF4444", flex: 1 }}>
                    Live endorsement data unavailable — showing preview. Run the
                    seed scripts and retry.
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: 16, lineHeight: 1.7,
                      textTransform: "none",
                      color: "#EF4444",
                      borderColor: "#FECACA",
                      "&:hover": { borderColor: "#EF4444" },
                    }}
                    onClick={() => {
                      if (!companyId) return;
                      const body = { companyId, policyId: "" };
                      setListLoading(true);
                      setListError(false);
                      apiRequest(
                        endPoints.generateHRReports + "endorsement_list",
                        { method: "POST", data: body }
                      )
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        .then((res: any) =>
                          setEndorsementList(res?.data?.data ?? [])
                        )
                        .catch(() => setListError(true))
                        .finally(() => setListLoading(false));
                    }}
                  >
                    Retry
                  </Button>
                </Box>
                {INDIVIDUAL_ENDORSEMENTS.map(
                  (item: Record<string, unknown>, index) => {
                    const rawType = String(
                      (item as { type?: string }).type ?? ""
                    );
                    const typeLabel =
                      rawType.charAt(0).toUpperCase() +
                      rawType.slice(1).toLowerCase();
                    const typeStyle = endorsementTypeStyle(rawType);
                    const dateLabel = String(
                      (item as { date?: string }).date ?? ""
                    );
                    const titleLabel = String(
                      (item as { title?: string }).title ?? ""
                    );
                    const subtitleLabel = String(
                      (item as { subtitle?: string }).subtitle ?? ""
                    );
                    const summaryChips = (
                      item as { summaryChips?: unknown[] }
                    ).summaryChips as unknown[];
                    return (
                      <Box
                        key={`mock-${rawType}-${index}`}
                        sx={{
                          border: "1px solid #E7EEF6",
                          borderRadius: 2,
                          overflow: "hidden",
                          background: "#fff",
                        }}
                      >
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns:
                              "auto auto 1fr auto auto auto",
                            alignItems: "center",
                            gap: 1.5,
                            px: 2.5,
                            py: 1.8,
                            cursor: "pointer",
                            "&:hover": { background: "#F9FAFB" },
                          }}
                          onClick={() =>
                            setExpandedCard((current) =>
                              current === index ? -1 : index
                            )
                          }
                        >
                          <Box
                            sx={{
                              px: 1.5,
                              py: 0.4,
                              borderRadius: 999,
                              background: typeStyle.tint,
                              color: typeStyle.color,
                              fontSize: 16, lineHeight: 1.7,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {typeLabel}
                          </Box>
                          <Typography
                            sx={{
                              fontSize: 16, lineHeight: 1.7,
                              color: "#667085",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {dateLabel}
                          </Typography>
                          <Box>
                            <Typography
                              sx={{
                                fontSize: 16, lineHeight: 1.7,
                                fontWeight: 600,
                                color: "#1F2937",
                              }}
                            >
                              {titleLabel}
                            </Typography>
                            <Typography
                              sx={{ fontSize: 16, lineHeight: 1.7, color: "#667085" }}
                            >
                              {subtitleLabel}
                            </Typography>
                          </Box>
                          <Box
                            sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
                          >
                            {Array.isArray(summaryChips) &&
                              summaryChips.map(
                                (chip: unknown, chipIndex: number) => {
                                  const c = chip as {
                                    label?: string;
                                    value?: string | number;
                                    color?: string;
                                  };
                                  return (
                                    <Box
                                      key={chipIndex}
                                      sx={{
                                        px: 1.2,
                                        py: 0.3,
                                        borderRadius: 1,
                                        background: "#F1F5F9",
                                        fontSize: 16, lineHeight: 1.7,
                                        color: c.color ?? "#374151",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {c.label}: {c.value}
                                    </Box>
                                  );
                                }
                              )}
                          </Box>
                          <ChevronDown
                            size={16}
                            style={{
                              color: "#667085",
                              transform:
                                expandedCard === index
                                  ? "rotate(180deg)"
                                  : "none",
                              transition: "transform 0.2s",
                            }}
                          />
                        </Box>
                        {expandedCard === index ? (
                          <Box
                            sx={{
                              px: 2.5,
                              pb: 2.5,
                              borderTop: "1px solid #E7EEF6",
                              pt: 2,
                            }}
                          >
                            <EndorsementUploadSection
                              endorsementId={index + 1}
                              policyId={null}
                              onUploadSuccess={refreshAll}
                            />
                          </Box>
                        ) : null}
                      </Box>
                    );
                  }
                )}
              </>
            ) : accordionItems.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#667085" }}>
                  No endorsements yet.
                </Typography>
              </Box>
            ) : (
              accordionItems.map((item: Record<string, unknown>, index) => {
                const rawType = isRealList
                  ? String(item.endorsementType ?? "")
                  : String((item as { type?: string }).type ?? "");
                const typeLabel =
                  rawType.charAt(0).toUpperCase() +
                  rawType.slice(1).toLowerCase();
                const typeStyle = endorsementTypeStyle(rawType);
                const dateLabel = isRealList
                  ? String(item.createdAt ?? "")
                  : String((item as { date?: string }).date ?? "");
                const titleLabel = isRealList
                  ? String(item.policyNumber ?? "")
                  : String((item as { title?: string }).title ?? "");
                const subtitleLabel = isRealList
                  ? String(item.osTicketNumber ?? "")
                  : String((item as { subtitle?: string }).subtitle ?? "");
                const cardEndorsementId = isRealList
                  ? (item.endorsementId as number | null) ?? null
                  : null;
                const cardPolicyId = isRealList
                  ? (item.policyId as number | null) ?? null
                  : null;
                // Upload locked when iWork Step 2 is completed for this endorsement
                const step2Completed = isRealList
                  ? ["COMPLETED", "LOCKED", "APPROVED", "FINALIZED"].includes(
                      String(item.endorsementStatus ?? "").toUpperCase()
                    )
                  : false;
                const summaryChips = isRealList
                  ? [
                      [typeLabel, String(item.uploadCount ?? 0), "#16A34A"],
                      ["Success", String(item.totalSuccessCount ?? 0), "#175CD3"],
                      ["Errors", String(item.totalErrorCount ?? 0), "#EF4444"],
                    ]
                  : [
                      [typeLabel, String((item as { addition?: string }).addition ?? ""), "#16A34A"],
                      ["Active", String((item as { active?: string }).active ?? ""), "#175CD3"],
                      ["Net Gross", String((item as { netGross?: string }).netGross ?? ""), "#111827"],
                    ];

                return (
                  <Box
                    key={isRealList ? String(item.endorsementId) : `${rawType}-${index}`}
                    onClick={() =>
                      setExpandedCard((current) =>
                        current === index ? -1 : index
                      )
                    }
                    sx={{
                      background: "#FFFFFF",
                      borderRadius: "12px",
                      border: "1px solid #E7EEF6",
                      px: 2.5,
                      py: 2,
                      display: "grid",
                      gridTemplateColumns: "1fr 280px 30px",
                      alignItems: "center",
                      boxShadow: "0 8px 22px rgba(15, 23, 42, 0.04)",
                      cursor: "pointer",
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.1,
                          mb: 1,
                        }}
                      >
                        <Box
                          sx={{
                            px: 1.1,
                            py: 0.4,
                            borderRadius: 999,
                            background: typeStyle.tint,
                            color: typeStyle.color,
                            fontSize: 16, lineHeight: 1.7,
                            fontWeight: 600,
                          }}
                        >
                          {typeLabel}
                        </Box>
                        {/* <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#98A2B3" }}>
                          {dateLabel}
                        </Typography> */}
                      </Box>
                      <Typography
                        sx={{ fontSize: 16, lineHeight: 1.7, fontWeight: 600, color: "#1F2937" }}
                      >
                        {titleLabel}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 16, lineHeight: 1.7, color: "#667085", mt: 0.75 }}
                      >
                        {subtitleLabel}
                      </Typography>
                      {isRealList && (item.enrollmentStartDate || item.enrollmentEndDate) && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.75 }}>
                          <CalendarDays size={12} color="#9CA3AF" />
                          <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: "#9CA3AF" }}>
                            Enrolment:
                          </Typography>
                          <Typography sx={{ fontSize: 13, lineHeight: 1.6, fontWeight: 600, color: "#374151" }}>
                            {(String(item.enrollmentStartDate ?? "")) || "—"}
                            {" – "}
                            {(String(item.enrollmentEndDate ?? "")) || "—"}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 2,
                        justifyItems: "center",
                      }}
                    >
                      {summaryChips.map(([label, value, color]) => (
                        <Box key={label}>
                          <Typography
                            sx={{ fontSize: 16, lineHeight: 1.7, color: "#98A2B3", mb: 0.75 }}
                          >
                            {label}
                          </Typography>
                          <Typography
                            sx={{ fontSize: 16, lineHeight: 1.7, fontWeight: 600, color }}
                          >
                            {value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <ChevronDown
                      size={18}
                      color="#111827"
                      style={{
                        transform:
                          expandedCard === index
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    />

                    {expandedCard === index ? (
                      <Box
                        sx={{
                          gridColumn: "1 / -1",
                          mt: 2,
                          pt: 2,
                          borderTop: "1px solid #E7EEF6",
                          display: "flex",
                          flexDirection: "column",
                          gap: 2.25,
                        }}
                      >
                        <Box>
                          <Typography
                            sx={{
                              fontSize: 16, lineHeight: 1.7,
                              fontWeight: 600,
                              color: "#1F2937",
                              mb: 1.4,
                            }}
                          >
                            Employee Information
                          </Typography>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                            }}
                          >
                            {ENDORSEMENT_EMPLOYEE_SUMMARY.map(
                              ([label, value], summaryIndex) => (
                                <Box
                                  key={label}
                                  sx={{
                                    px: summaryIndex === 0 ? 0 : 2.2,
                                    borderLeft:
                                      summaryIndex === 0
                                        ? "none"
                                        : "1px solid #E5E7EB",
                                    minHeight: 56,
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: 16, lineHeight: 1.7,
                                      color: "#667085",
                                      mb: 0.75,
                                    }}
                                  >
                                    {label}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontSize: 16, lineHeight: 1.7,
                                      fontWeight: 600,
                                      color: "#1F2937",
                                    }}
                                  >
                                    {value}
                                  </Typography>
                                </Box>
                              )
                            )}
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            pt: 2,
                            borderTop: "1px solid #E7EEF6",
                            display: "grid",
                            gridTemplateColumns: "360px 1fr",
                            gap: 3,
                            alignItems: "end",
                          }}
                        >
                          <Box>
                            <Typography
                              sx={{
                                fontSize: 16, lineHeight: 1.7,
                                fontWeight: 600,
                                color: "#1F2937",
                                mb: 1.15,
                              }}
                            >
                              Premium Information
                            </Typography>
                            <Box
                              sx={{
                                border: "1px solid #D9E5F2",
                                borderRadius: "10px",
                                overflow: "hidden",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 110px",
                                  px: 1.5,
                                  py: 1,
                                  background: "#F8FAFC",
                                  borderBottom: "1px solid #E5E7EB",
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: 16, lineHeight: 1.7,
                                    color: "#667085",
                                    fontWeight: 600,
                                  }}
                                >
                                  PREMIUM COMPONENT
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: 16, lineHeight: 1.7,
                                    color: "#667085",
                                    fontWeight: 600,
                                  }}
                                >
                                  AMOUNT
                                </Typography>
                              </Box>
                              {ENDORSEMENT_PREMIUM_ROWS.map(
                                ([label, value, color], rowIndex) => (
                                  <Box
                                    key={label}
                                    sx={{
                                      display: "grid",
                                      gridTemplateColumns: "1fr 110px",
                                      px: 1.5,
                                      py: 0.95,
                                      borderBottom:
                                        rowIndex <
                                        ENDORSEMENT_PREMIUM_ROWS.length - 1
                                          ? "1px solid #EEF2F6"
                                          : "none",
                                      background:
                                        label === "Gross Premium" ||
                                        label === "Net Premium"
                                          ? "#F9FAFB"
                                          : "#FFFFFF",
                                    }}
                                  >
                                    <Typography
                                      sx={{ fontSize: 16, lineHeight: 1.7, color: "#475467" }}
                                    >
                                      {label}
                                    </Typography>
                                    <Typography
                                      sx={{
                                        fontSize: 16, lineHeight: 1.7,
                                        color,
                                        fontWeight:
                                          label === "Gross Premium" ||
                                          label === "Net Premium"
                                            ? 700
                                            : 500,
                                      }}
                                    >
                                      {value}
                                    </Typography>
                                  </Box>
                                )
                              )}
                              <Box
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 110px",
                                  px: 1.5,
                                  py: 0.95,
                                  background: "#EAF2FF",
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: 16, lineHeight: 1.7,
                                    color: "#1849A9",
                                    fontWeight: 600,
                                  }}
                                >
                                  Net Gross Premium
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: 16, lineHeight: 1.7,
                                    color: "#1849A9",
                                    fontWeight: 600,
                                  }}
                                >
                                  {netGrossPremiumRow}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              minHeight: 220,
                              display: "flex",
                              alignItems: "flex-end",
                              justifyContent: "center",
                              pb: 0.5,
                            }}
                          >
                            <Box
                              component="img"
                              src={endorsementCalculatorIllustration}
                              alt="Endorsement detail illustration"
                              sx={{
                                width: 260,
                                maxWidth: "100%",
                                height: "auto",
                                objectFit: "contain",
                              }}
                            />
                          </Box>
                        </Box>

                        <EndorsementUploadSection
                          endorsementId={cardEndorsementId ?? index + 1}
                          policyId={cardPolicyId}
                          isLocked={step2Completed}
                          onUploadSuccess={refreshAll}
                        />
                      </Box>
                    ) : null}
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export const HRPortalEnrolmentV2 = () => {
  const companyId = getCompanyId();
  const [activeTab, setActiveTab] = useState("enrollment");
  const [policy, setPolicy] = useState("All Policies");
  const [dateRange, setDateRange] = useState(PORTAL_DATE_OPTIONS[0]);
  const [selectedECardRow, setSelectedECardRow] = useState<EnrolmentRow | null>(
    null
  );
  const [selectedDependentsRow, setSelectedDependentsRow] =
    useState<EnrolmentRow | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const endorsementInputRef = useRef<HTMLInputElement | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [endorsementDialogView, setEndorsementDialogView] = useState<'upload' | 'uploaded'>('upload');
  const [endorsementDialogFile, setEndorsementDialogFile] = useState('');
  const [endorsementDialogDragging, setEndorsementDialogDragging] = useState(false);
  const [endorsementDialogError, setEndorsementDialogError] = useState('');

  // ── Endorsement list — drives enrollment tab content ──
  const [endorsementListForTab, setEndorsementListForTab] = useState<Record<string, unknown>[]>([]);
  const [endorsementListLoading, setEndorsementListLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    setEndorsementListLoading(true);
    apiRequest(endPoints.generateHRReports + "endorsement_list", { method: "POST", data: { companyId, policyId: "" } })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((res: any) => setEndorsementListForTab(res?.data?.data ?? []))
      .catch(() => setEndorsementListForTab([]))
      .finally(() => setEndorsementListLoading(false));
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── KPI ──
  const [kpiData, setKpiData] = useState<EmpSupportKpi | null>(null);

  const { mutate: fetchKpi, isPending: kpiLoading } = useApiMutation({
    config: {
      onSuccess: (res: any) => setKpiData(res?.data?.data?.[0] ?? null),
      onError: () => setKpiData(null),
    },
  });

  useEffect(() => {
    if (!companyId) return;
    fetchKpi({
      endpoint: endPoints.generateHRReports + "emp_support_kpi_summary",
      method: "POST",
      data: { companyId },
    });
  }, [companyId]);

  const tabs = useMemo(
    () =>
      ENROLMENT_TABS.map((tab) => ({
        ...tab,
        active: tab.id === activeTab,
      })),
    [activeTab]
  );

  return (
    <Box
      sx={{
        mx: -3,
        mt: -0.5,
        height: "100%",
        background: "#EBF6FF",
        pt: 0,
        pb: 0.5,
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >

      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 0,
          background: "#EBF6FF",
          flexShrink: 0,
        }}
      >
        <PortalHeroHeader
          title={
            activeTab === "endorsement" ? "Endorsement Management" : "Enrolment"
          }
          bleed={true}
          action={
            <PortalActionButton
              label="Bulk Upload"
              icon={<Upload size={14} />}
              variant="light"
              onClick={() => { setEndorsementDialogView('upload'); setEndorsementDialogFile(''); setEndorsementDialogError(''); setShowUploadDialog(true); }}
            />
          }
        />

        <PortalControlBar
          bleed={true}
          rightSlot={
            <>
              <PortalSelectControl
                value={policy}
                onChange={setPolicy}
                options={["All Policies", "GMC", "GPA", "GTL"]}
                width={118}
              />
              <PortalSelectControl
                value={dateRange}
                onChange={setDateRange}
                options={PORTAL_DATE_OPTIONS}
                width={246}
                minWidth={246}
                leadingIcon={<CalendarDays size={14} />}
              />
            </>
          }
        >
          {tabs.map((tab) => {
            const Icon = tabIcons[tab.id as keyof typeof tabIcons];
            return (
              <PortalTabItem
                key={tab.id}
                active={tab.active}
                onClick={() => setActiveTab(tab.id)}
                icon={Icon ? <Icon size={14} /> : undefined}
                label={tab.label}
                trailing={
                  tab.id === "analytics" ? <ChevronDown size={12} /> : undefined
                }
              />
            );
          })}
        </PortalControlBar>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {activeTab === "enrollment" ? (
          endorsementListLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", pt: 8 }}>
              <CircularProgress size={28} sx={{ color: "#1C57B8" }} />
            </Box>
          ) : endorsementListForTab.length > 0 ? (
            <Box sx={{ px: 3, py: 2.5 }}>
              <EndorsementManagement />
            </Box>
          ) : (
          <Box
            sx={{
              px: 3,
              py: 2.5,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {(() => {
              const kpiCards = [
                { id: "total",      label: "Total Employees",    value: kpiLoading ? "--" : String(kpiData?.totalEmployees ?? 0),     footer: null,                      accent: "#1f2937" },
                { id: "active",     label: "Active Employees",   value: kpiLoading ? "--" : String(kpiData?.activeEmployees ?? 0),    footer: "Portal access active",    accent: "#16a34a" },
                { id: "inactive",   label: "Inactive Employees", value: kpiLoading ? "--" : String(kpiData?.inactiveEmployees ?? 0),  footer: "Blocked / not activated",  accent: "#ef4444" },
                { id: "enrolled",   label: "Enrolled",           value: kpiLoading ? "--" : String(kpiData?.enrolledEmployees ?? 0),  footer: "Active enrolments",       accent: "#2563eb" },
                { id: "notEnrolled",label: "Not Started",       value: kpiLoading ? "--" : String(kpiData?.notEnrolledEmployees ?? 0),footer: "Pending / not logged in",  accent: "#ea580c" },
              ];
              return (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                    overflow: "hidden",
                    background: "linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)",
                    border: "1px solid #FFF",
                    borderRadius: "8px",
                    boxShadow: "0 6px 100px 0 rgba(0, 0, 0, 0.10)",
                  }}
                >
                  {kpiCards.map((card, index) => (
                    <Box
                      key={card.id}
                      sx={{
                        minHeight: 0,
                        px: 1.75,
                        py: 1.7,
                        borderLeft: index === 0 ? "none" : "1px solid #E4EAF2",
                      }}
                    >
                      <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#687686" }}>
                        {card.label}
                      </Typography>
                      <Typography
                        sx={{ mt: 0.75, fontSize: 30, lineHeight: 1.25, letterSpacing: "-0.4px", fontWeight: 600, color: card.accent }}
                      >
                        {card.value}
                      </Typography>
                      {card.footer && (
                        <Typography sx={{ mt: 0.75, fontSize: 16, lineHeight: 1.7, color: "#8d99a6" }}>
                          {card.footer}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              );
            })()}

            <EnrollmentTable
              companyId={companyId}
              onOpenECard={setSelectedECardRow}
              onOpenDependents={setSelectedDependentsRow}
              onExport={() =>
                downloadMockFile(
                  "enrolment-export.txt",
                  `Mock export for ${policy} in ${dateRange}`
                )
              }
            />
          </Box>
          )
        ) : null}

        {activeTab === "endorsement" ? (
          <Box sx={{ px: 3, py: 2.5 }}>
            <EndorsementManagement />
          </Box>
        ) : null}

        {activeTab === "analytics" ? (
          <Box
            sx={{
              mx: 3,
              my: 2.5,
              minHeight: 320,
              borderRadius: "10px",
              border: "1px solid #E3EDF7",
              background: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#8b97a4",
              fontSize: 16, lineHeight: 1.7,
              fontWeight: 500,
            }}
          >
            Employee analytics view coming next in this flow.
          </Box>
        ) : null}
      </Box>

      <ECardDialog
        open={Boolean(selectedECardRow)}
        companyEmployeeId={selectedECardRow?.employeeCode ?? ""}
        companyId={companyId}
        onClose={() => setSelectedECardRow(null)}
      />

      <DependentsDialog
        open={Boolean(selectedDependentsRow)}
        employeeName={selectedDependentsRow?.employeeName ?? ""}
        dependents={selectedDependentsRow?.dependentDetails ?? []}
        onClose={() => setSelectedDependentsRow(null)}
      />

      {/* ── Endorsement Upload Dialog ── */}
      <Dialog open={showUploadDialog} onClose={() => setShowUploadDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3.5, py: 2.5, borderBottom: '1px solid #E5E7EB' }}>
          <Typography sx={{ fontSize: 22, lineHeight: 1.4, letterSpacing: '-0.2px', fontWeight: 700, color: '#111827' }}>Upload Endorsement Data</Typography>
          <Box onClick={() => setShowUploadDialog(false)} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', '&:hover': { opacity: 0.7 } }}>
            <X size={18} color="#6B7280" />
          </Box>
        </Box>
        <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC' }}>
          <input ref={endorsementInputRef} type="file" accept=".xlsx,.csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEndorsementDialogFile(f.name); setEndorsementDialogView('uploaded'); setEndorsementDialogError(''); } }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, alignItems: 'start' }}>
            {/* Left — Guidelines */}
            <Box sx={{ background: '#fff', border: '1px solid #E3EDF7', borderRadius: '14px', p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography sx={{ fontSize: 16, lineHeight: 1.7, fontWeight: 700, color: '#667085', letterSpacing: '0.07em' }}>GUIDELINES</Typography>
              <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', px: 2, py: 1.1, bgcolor: '#F8FAFC', borderBottom: '1px solid #E5E7EB', gap: 2 }}>
                  {['COLUMN NAME', 'FORMAT', 'EXAMPLE'].map((h) => (
                    <Typography key={h} sx={{ fontSize: 16, lineHeight: 1.7, fontWeight: 700, color: '#667085', letterSpacing: '0.06em' }}>{h}</Typography>
                  ))}
                </Box>
                {[
                  { label: 'Employee Name', format: 'Text (max 100 chars)', example: 'Anjali Rentala' },
                  { label: 'Date of Birth', format: 'DD/MM/YYYY', example: '18/09/1991' },
                  // { label: 'Date of Joining', format: 'DD/MM/YYYY', example: '01/04/2022' },
                  { label: 'Gender', format: 'Male or Female', example: 'Male / Female' },
                  { label: 'Relation', format: 'Self / Spouse / Son / Daughter', example: 'Self' },
                  { label: 'Department', format: 'Text', example: 'Engineering / Finance / HR' },
                  { label: 'Designation', format: 'Text', example: 'Senior Engineer' },
                  { label: 'Change Type', format: 'Addition / Deletion / Correction', example: 'Addition' },
                  { label: 'Effective Date', format: 'DD/MM/YYYY', example: '15/04/2025' },
                  { label: 'Previous Policy Period', format: 'DD Mon YYYY – DD Mon YYYY', example: '01 Apr 2024 – 31 Mar 2025' },
                ].map((col, i, arr) => (
                  <Box key={col.label} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', px: 2, py: 1.5, gap: 2, alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none', bgcolor: '#fff' }}>
                    <Typography sx={{ fontSize: 16, lineHeight: 1.7, fontWeight: 500, color: '#111827' }}>{col.label}</Typography>
                    <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: '#667085' }}>{col.format}</Typography>
                    <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: '#94A3B8' }}>{col.example}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Right — Upload */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ background: '#fff', border: '1px solid #E3EDF7', borderRadius: '14px', p: 3 }}>
                <Typography sx={{ fontSize: 22, lineHeight: 1.4, letterSpacing: '-0.2px', fontWeight: 700, color: '#111827', mb: 0.75 }}>Upload Endorsement Data</Typography>
                <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: '#667085', mb: 2 }}>Upload your endorsement file to record mid-term changes. Data will be validated, reviewed, and applied to the active policy.</Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', px: 2, py: 1.5 }}>
                  <Typography sx={{ fontSize: 16, color: '#15803D', lineHeight: 1.7 }}><strong>Endorsement</strong> is submitted on a regular basis throughout the policy year — add new joiners, remove exits, or correct records mid-term. Each endorsement creates a versioned audit trail.</Typography>
                </Box>
              </Box>
              <Box
                sx={{ background: '#fff', border: '1px solid #E3EDF7', borderRadius: '14px', p: 3, position: 'relative' }}
                onDragOver={(e) => { e.preventDefault(); setEndorsementDialogDragging(true); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setEndorsementDialogDragging(false); }}
                onDrop={(e) => { e.preventDefault(); setEndorsementDialogDragging(false); const f = e.dataTransfer.files?.[0]; if (f) { setEndorsementDialogFile(f.name); setEndorsementDialogView('uploaded'); setEndorsementDialogError(''); } }}
              >
                {endorsementDialogView === 'uploaded' ? (
                  <Box sx={{ border: '2px solid #BBF7D0', borderRadius: '12px', py: 4, px: 3, textAlign: 'center', background: '#F0FDF4' }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '14px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                      <Download size={26} color="#16A34A" />
                    </Box>
                    <Typography sx={{ fontSize: 22, lineHeight: 1.4, letterSpacing: '-0.2px', fontWeight: 700, color: '#15803D', mb: 0.75 }}>File ready to submit</Typography>
                    <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: '#166534' }}>{endorsementDialogFile}</Typography>
                    <Box onClick={() => { setEndorsementDialogView('upload'); setEndorsementDialogFile(''); }} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1.5, cursor: 'pointer', color: '#6B7280', '&:hover': { color: '#374151' } }}>
                      <X size={13} />
                      <Typography sx={{ fontSize: 16, lineHeight: 1.7, fontWeight: 500 }}>Remove</Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box onClick={() => endorsementInputRef.current?.click()} sx={{ border: `2px dashed ${endorsementDialogDragging ? '#1C57B8' : '#CBD5E1'}`, borderRadius: '12px', py: 5, textAlign: 'center', cursor: 'pointer', background: endorsementDialogDragging ? '#EFF6FF' : '#FAFBFC', transition: 'all 0.15s', '&:hover': { borderColor: '#1C57B8', background: '#EFF6FF' } }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}><Upload size={20} color="#64748B" /></Box>
                    <Typography sx={{ fontSize: 16, lineHeight: 1.7, fontWeight: 600, color: '#334155' }}>Drag &amp; drop your file here</Typography>
                    <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: '#94A3B8', mt: 0.75 }}>or click to browse — .xlsx, .csv supported</Typography>
                  </Box>
                )}
                {endorsementDialogError && <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: '#EF4444', mt: 1 }}>{endorsementDialogError}</Typography>}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 2.5 }}>
                  <Box
                    onClick={endorsementDialogView === 'uploaded' ? () => { downloadMockFile('endorsement-submitted.txt', `Submitted: ${endorsementDialogFile}`); setShowUploadDialog(false); } : undefined}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2.5, py: 1, borderRadius: '8px', background: endorsementDialogView === 'uploaded' ? '#1C3A6E' : '#E5E7EB', cursor: endorsementDialogView === 'uploaded' ? 'pointer' : 'not-allowed', opacity: endorsementDialogView === 'uploaded' ? 1 : 0.65, transition: 'all 0.15s', '&:hover': endorsementDialogView === 'uploaded' ? { background: '#152E5A' } : {} }}
                  >
                    <Upload size={14} color={endorsementDialogView === 'uploaded' ? '#fff' : '#9CA3AF'} />
                    <Typography sx={{ fontSize: 16, lineHeight: 1.7, fontWeight: 600, color: endorsementDialogView === 'uploaded' ? '#fff' : '#9CA3AF' }}>Submit Endorsement Data</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default HRPortalEnrolmentV2;
