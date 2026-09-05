import { useRef, useMemo, useState, useCallback } from "react";
import {
  Box, Button, CircularProgress, IconButton, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import { AlertTriangle, CheckCircle2, CornerDownRight, Download, Edit2, Pencil, Upload, X, Check } from "lucide-react";
import * as XLSX from "xlsx";
import { endPoints, useApiQuery } from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import DynamicForm from "@ui/ui-lib/commonComponents/FormComponent";
import type { FormFieldConfig } from "@ui/ui-lib/commonComponents/FormComponent/types";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { setToastMessage } from "../../redux/slice";
import { getCompanyId } from "../../utils/companyConfig";
import { PortalHeroHeader } from "../HRPortal/controls";

interface PolicyOption {
  policyId: number;
  policyName: string;
  policyNumber: string | null;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ZohoEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  dateOfBirth: string;
  gender: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  employmentStatus: string;
  ctc: string;
  // Optional — Zoho employees never set this (all such rows are implicitly
  // "Self"), so getCellValue defaults to "SELF" when absent. Populated by
  // dependent rows (e.g. from the HCL intake flow — see
  // SettingsIntegrationsTab/HclIntakeDialog.tsx's mapDependentToRow) which
  // are otherwise shaped identically to an employee row, linked to their
  // employee via a shared `employeeId`.
  relation?: string;
  // The template's "Effective Date" column — when this enrollment/addition
  // takes effect, NOT the person's date of joining their employer. Filled
  // in uniformly for every row (employee and dependent alike) from the
  // form's own "Endorsement Start Date" field at preview-build time — see
  // handlePreview. Distinct field from dateOfJoining; conflating the two
  // was a real bug (found via a downloaded error report: HCL employees'
  // real DOJ predated the policy period, so template rows had "Effective
  // Date" = DOJ and got rejected with ER0014 "must be between policy start
  // and end dates").
  effectiveDate?: string;
}

interface PreviewData {
  headers: string[];
  rows: string[][];
  sheetName: string;
  colWidths?: XLSX.ColInfo[];
  fileName: string;
}

// ─── Date helpers ─────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

const toDDMMYYYY = (dateStr: string): string => {
  if (!dateStr) return "";
  // "15-Jan-1990" — Zoho format
  const zoho = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (zoho) {
    const m = MONTH_MAP[zoho[2].toLowerCase()];
    return m ? `${zoho[1].padStart(2, "0")}/${m}/${zoho[3]}` : dateStr;
  }
  // "YYYY-MM-DD"
  const iso = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  // Try native parse
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }
  return dateStr;
}

const toDateString = (v: any): string => {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v?.format === "function") return v.format("YYYY-MM-DD");
  return String(v);
}

// ─── Header → employee field mapper ──────────────────────────────────────
// "FULL_NAME" is a virtual key that returns firstName + lastName

type FieldKey = keyof ZohoEmployee | "FULL_NAME" | "INTAKE_TYPE" | "RELATION_SELF" | "EFFECTIVE_DATE_FIELD";

// "Effective Date" is checked BEFORE the dateOfJoining pattern (order
// matters — first match wins below) and is now its own key, distinct from
// D.O.J/joining. These used to be one combined pattern mapping both header
// spellings onto dateOfJoining, which silently filled a template's
// "Effective Date" column with the person's date of joining their
// employer — wrong for enrollment purposes and the direct cause of ER0014
// rejections on real HCL data (see ZohoEmployee.effectiveDate above).
const FIELD_PATTERNS: [RegExp, FieldKey][] = [
  [/intake\s*type/i,                                          "INTAKE_TYPE"],
  [/^relation(ship)?$/i,                                      "RELATION_SELF"],
  [/emp(loyee)?\s*(id|code|no)|staffid/i,                    "employeeId"],
  [/first\s*name|firstname/i,                                "firstName"],
  [/last\s*name|lastname|surname/i,                          "lastName"],
  [/full\s*name|employee\s*name|^name$/i,                    "FULL_NAME"],
  [/e?mail/i,                                                "email"],
  [/mobile|phone|contact/i,                                  "mobile"],
  [/d\.?o\.?b|birth|date.*birth/i,                          "dateOfBirth"],
  [/gender|sex/i,                                            "gender"],
  [/designation|job\s*title|title/i,                         "designation"],
  [/dept|department/i,                                       "department"],
  [/effective\s*date/i,                                      "EFFECTIVE_DATE_FIELD"],
  [/d\.?o\.?j|joining|date.*join/i,                          "dateOfJoining"],
  [/status/i,                                                "employmentStatus"],
  [/ctc|annual.*sal|sum.*insured|salary/i,                   "ctc"],
];

const getCellValue = (header: string, emp: ZohoEmployee): string => {
  for (const [re, key] of FIELD_PATTERNS) {
    if (re.test(header.trim())) {
      if (key === "FULL_NAME") {
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.firstName || "";
      }
      if (key === "INTAKE_TYPE") return "ADDITION";
      // "SELF" only when relation was never set at all (true for every real
      // employee row). An explicit empty string (dependent rows whose real
      // relation isn't known — see HclIntakeDialog's mapDependentToRow)
      // stays blank rather than falling back to "SELF", which would
      // misrepresent a dependent as the employee.
      if (key === "RELATION_SELF") return emp.relation !== undefined ? emp.relation : "SELF";
      if (key === "EFFECTIVE_DATE_FIELD") return toDDMMYYYY(emp.effectiveDate ?? "");
      const raw = String(emp[key] ?? "");
      if (key === "dateOfBirth") return toDDMMYYYY(raw);
      if (key === "dateOfJoining") return toDDMMYYYY(raw);
      return raw;
    }
  }
  return "";
}

// ─── Rebuild xlsx blob from rows ─────────────────────────────────────────

const buildBlob = (headers: string[], rows: string[][], sheetName: string, colWidths?: XLSX.ColInfo[]): Blob => {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  if (colWidths) ws["!cols"] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

// ─── Step indicator ───────────────────────────────────────────────────────

const STEPS = ["Policy & Details", "Preview & Edit", "Done"];

const StepIndicator = ({ active }: { active: number }) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
      {STEPS.map((label, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <Box key={label} sx={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "unset" }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 90 }}>
              <Box
                sx={{
                  width: 30, height: 30, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  bgcolor: done || current ? "#4338CA" : "#E5E7EB",
                  color: done || current ? "#fff" : "#6B7280",
                }}
              >
                {done ? "✓" : i + 1}
              </Box>
              <Typography
                fontSize={12} fontWeight={current ? 700 : 400} mt={0.5}
                sx={{ color: current ? "#4338CA" : done ? "#374151" : "#9CA3AF", textAlign: "center" }}
              >
                {label}
              </Typography>
            </Box>
            {i < STEPS.length - 1 && (
              <Box sx={{ flex: 1, height: 2, mb: 2.5, mx: 0.5, bgcolor: i < active ? "#4338CA" : "#E5E7EB" }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────

const ZohoEndorsementPage = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const companyId = getCompanyId();

  const employees: ZohoEmployee[] = (location.state as any)?.employees ?? [];
  // Dependent rows (optional — Zoho never sends these; HCL does). Shaped
  // identically to an employee row, linked to their employee via a shared
  // `employeeId` and distinguished by `relation` (see ZohoEmployee.relation
  // above). Kept as a separate array from `employees` so employeeCount
  // (used in the enrollment-upload payload below) still reflects actual
  // employees only — dependentCount reflects this array's length instead.
  const dependents: ZohoEmployee[] = (location.state as any)?.dependents ?? [];

  // Per-row "linked to" info for the preview table below — purely a display
  // aid, computed from the same `employees`/`dependents` arrays used to
  // build `preview.rows` (in the same concatenated order, so index i here
  // lines up with preview.rows[i]). Never touches the actual template/xlsx
  // data. A row counts as a dependent by having `relation` set — only
  // mapDependentToRow (HclIntakeDialog.tsx) sets that field.
  const rowLinks = useMemo(() => {
    const combined = [...employees, ...dependents];
    return combined.map((p) => {
      if (!p.relation) return null; // employee row — nothing to link
      const parent = employees.find((e) => e.employeeId === p.employeeId);
      const parentName = parent
        ? [parent.firstName, parent.lastName].filter(Boolean).join(" ") || parent.employeeId
        : p.employeeId;
      return `Dependent of ${parentName}`;
    });
  }, [employees, dependents]);

  // Generic post-success hook — not Zoho-specific. Any caller that navigates
  // here (e.g. the HCL intake card in SettingsIntegrationsTab) can pass
  // these two fields to be notified once this page's own submit succeeds,
  // without this page knowing anything about who the caller is. Kept as
  // plain strings/numbers (not a callback) since react-router's navigation
  // state must be structured-cloneable.
  const sourceLabel: string | undefined = (location.state as any)?.sourceLabel;
  const sourceRecordIds: number[] = (location.state as any)?.sourceRecordIds ?? [];
  const onSubmitSuccessEndpoint: string | undefined =
    (location.state as any)?.onSubmitSuccessEndpoint;
  // When the caller already knows which policy this data belongs to (HCL —
  // resolved once at intake and enforced single-policy-per-selection in
  // HclIntakeDialog), the policy dropdown below is locked to it instead of
  // listing every policy the company has. Previously this page let an admin
  // pick ANY of the company's policies regardless of which policy the
  // employees actually came from — for Zoho that's fine (Zoho data has no
  // inherent policy), but for HCL it meant nothing stopped submitting HCL's
  // employees against an unrelated, manually-picked policy.
  const lockedPolicyId: number | undefined = (location.state as any)?.policyId ?? undefined;

  const [step, setStep]                   = useState(0);
  const [preview, setPreview]             = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError]   = useState("");
  const [submitting, setSubmitting]       = useState(false);
  const [successId, setSuccessId]         = useState<number | null>(null);
  const [successPolicyId, setSuccessPolicyId] = useState<number | null>(null);

  // Inline row editing
  const [editingRow, setEditingRow]       = useState<number | null>(null);
  const [editBuffer, setEditBuffer]       = useState<string[]>([]);

  // Preserve form values across step navigation
  const [savedFormValues, setSavedFormValues] = useState<Record<string, any>>({});
  const [formKey, setFormKey]                 = useState(0);

  // Table pagination
  const PAGE_SIZE = 10;
  const [tablePage, setTablePage] = useState(0);

  const formRHFRef = useRef<any>(null);
  const uploadRef  = useRef<HTMLInputElement>(null);

  // ── Fetch company policies ─────────────────────────────────────────────
  // Lightweight, paginated {policyId, policyName, policyNumber} endpoint —
  // replaces the "dashboard_policy_cards" report this dropdown used to pull
  // from, which computed a full dashboard's worth of aggregates (premiums,
  // sum insured, life counts, statuses) with no pagination just to populate
  // a "Select Policy" list. See policy.controller.ts's
  // getPolicyOptionsByCompanyId.
  const { data: policyOptionsResponse, isLoading: policiesLoading } = useApiQuery({
    queryKey: ["companyPolicyOptions", companyId],
    url: companyId ? endPoints.companyPolicyOptions(companyId) : "",
    enabled: Boolean(companyId),
  });
  const policyCards: PolicyOption[] = policyOptionsResponse?.data?.items ?? [];

  const policyOptions = useMemo(
    () => policyCards.map(p => ({
      value: String(p.policyId),
      label: p.policyName + (p.policyNumber ? ` — ${p.policyNumber}` : ""),
    })),
    [policyCards],
  );

  // When lockedPolicyId is set, restrict the dropdown to that single policy
  // — filtered from the fetched list (not just pre-selected) so there is no
  // option to pick a different, mismatched one.
  const effectivePolicyOptions = useMemo(
    () => lockedPolicyId != null
      ? policyOptions.filter(o => o.value === String(lockedPolicyId))
      : policyOptions,
    [policyOptions, lockedPolicyId],
  );

  // ── Form config ───────────────────────────────────────────────────────
  const formConfig: FormFieldConfig[] = useMemo(() => [
    {
      key: "policyId", name: "policyId", label: "Select Policy", type: "select",
      rules: { required: "Please select a policy" },
      options: policiesLoading ? [{ value: "", label: "Loading policies…" }] : effectivePolicyOptions,
      componentProps: { fullWidth: true, disabled: policiesLoading || lockedPolicyId != null },
      gridColumn: 6,
    },
    {
      key: "startDate", name: "startDate", label: "Endorsement Start Date", type: "date",
      rules: { required: "Start date is required" },
      componentProps: { fullWidth: true }, gridColumn: 6,
    },
    {
      key: "endDate", name: "endDate", label: "Endorsement End Date", type: "date",
      rules: { required: "End date is required" },
      componentProps: { fullWidth: true }, gridColumn: 6,
    },
    {
      key: "employeeCount", name: "employeeCount", label: "No. of Employees", type: "number",
      componentProps: { fullWidth: true }, gridColumn: 6,
    },
    {
      key: "dependentCount", name: "dependentCount", label: "No. of Dependents", type: "number",
      componentProps: { fullWidth: true }, gridColumn: 6,
    },
    {
      key: "osTicketNumber", name: "osTicketNumber", label: "OS Ticket Number", type: "text",
      componentProps: { fullWidth: true }, gridColumn: 6,
    },
    {
      key: "requestReceivedDate", name: "requestReceivedDate", label: "Request Received Date",
      type: "date", componentProps: { fullWidth: true }, gridColumn: 6,
    },
    {
      key: "isInception", name: "isInception",
      label: "Is Inception (first endorsement for this policy)",
      type: "checkbox", gridColumn: 12,
    },
  ], [policiesLoading, effectivePolicyOptions, lockedPolicyId]);

  const formDefaultValues = useMemo(() => ({
    policyId: lockedPolicyId != null ? String(lockedPolicyId) : "",
    employeeCount: employees.length, dependentCount: dependents.length,
    osTicketNumber: "", isInception: false,
    ...savedFormValues,
  }), [employees.length, dependents.length, lockedPolicyId, savedFormValues]);

  // ── Step 0 → 1: fetch template + fill ────────────────────────────────
  const handlePreview = async () => {
    const values   = formRHFRef.current?.getValues?.() ?? {};
    const policyId = Number(values.policyId);
    if (!policyId) {
      dispatch(setToastMessage({ message: "Please select a policy first.", duration: 4000 }));
      return;
    }
    setSavedFormValues(values);
    setPreviewLoading(true);
    setPreviewError("");
    setEditingRow(null);
    setStep(1);

    try {
      // 1. Template doc ID
      const tmplRes: any = await apiRequest(
        endPoints.getPolicyTemplate(String(policyId)), { method: "GET" },
      );
      const templateDocId: number =
        tmplRes?.data?.documentId ?? tmplRes?.data?.data?.documentId;
      if (!templateDocId) throw new Error("Policy has no data template configured.");

      // 2. Download via ibp-service
      const dlRes: any = await apiRequest(
        endPoints.ibpFileUploadDownloadById(templateDocId),
        { method: "GET", responseType: "arraybuffer" },
      );

      // 3. Parse Sheet 1 headers
      const workbook  = XLSX.read(dlRes.data as ArrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet     = workbook.Sheets[sheetName];
      const range     = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:Z1");

      const headers: string[] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r: 0, c })];
        headers.push(cell ? String(cell.v ?? "") : "");
      }

      // 4. Fill employee + dependent rows (dependents appended after their
      // employees, not interleaved — matches how a manually-built template
      // upload would typically be ordered; the template's own Employee ID/
      // Relation columns are what actually link each dependent to its
      // employee, not row adjacency).
      //
      // Every row — employee or dependent — gets the same effectiveDate:
      // the admin's own "Endorsement Start Date" for this submission, not
      // each person's individual dateOfJoining. Previously dependents got
      // no effective date at all (blank), and employees' "Effective Date"
      // template column was accidentally filled from dateOfJoining instead
      // (see ZohoEmployee.effectiveDate / FIELD_PATTERNS above) — both
      // confirmed, via a downloaded error report, to cause real submission
      // rejections (ER0014 wrong start date; ER0001 wrong date format).
      const effectiveDateStr = toDateString(values.startDate);
      const rows: string[][] = [...employees, ...dependents].map(emp =>
        headers.map(h => getCellValue(h, { ...emp, effectiveDate: emp.effectiveDate ?? effectiveDateStr })),
      );

      const colWidths = sheet["!cols"] as XLSX.ColInfo[] | undefined;
      const selectedPolicy = policyCards.find(p => p.policyId === policyId);
      const fileName = `endorsement-${selectedPolicy?.policyNumber ?? policyId}-employees.xlsx`;

      setPreview({
        headers, rows, sheetName,
        colWidths,
        fileName,
      });
      setTablePage(0);
    } catch (err: any) {
      setPreviewError(err?.response?.data?.message ?? err?.message ?? "Failed to prepare endorsement template.");
    } finally {
      setPreviewLoading(false);
    }
  }

  // ── Download blank template for selected policy ──────────────────────
  const [templateDownloading, setTemplateDownloading] = useState(false);

  const handleDownloadTemplate = async () => {
    const values   = formRHFRef.current?.getValues?.() ?? {};
    const policyId = Number(values.policyId);
    if (!policyId) {
      dispatch(setToastMessage({ message: "Please select a policy first.", duration: 4000 }));
      return;
    }
    setTemplateDownloading(true);
    try {
      const tmplRes: any = await apiRequest(
        endPoints.getPolicyTemplate(String(policyId)), { method: "GET" },
      );
      const templateDocId: number =
        tmplRes?.data?.documentId ?? tmplRes?.data?.data?.documentId;
      if (!templateDocId) throw new Error("No template configured for this policy.");

      const dlRes: any = await apiRequest(
        endPoints.ibpFileUploadDownloadById(templateDocId),
        { method: "GET", responseType: "arraybuffer" },
      );

      const selectedPolicy = policyCards.find(p => p.policyId === policyId);
      const fileName = `template-${selectedPolicy?.policyNumber ?? policyId}.xlsx`;
      const blob = new Blob([dlRes.data as ArrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href = url; a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      dispatch(setToastMessage({
        message: err?.response?.data?.message ?? err?.message ?? "Failed to download template.",
        duration: 5000,
      }));
    } finally {
      setTemplateDownloading(false);
    }
  }

  // ── Download current Excel ────────────────────────────────────────────
  const handleDownloadExcel = () => {
    if (!preview) return;
    const blob = buildBlob(preview.headers, preview.rows, preview.sheetName, preview.colWidths);
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = preview.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Upload modified Excel ─────────────────────────────────────────────
  const handleUploadExcel = async (file: File) => {
    try {
      const buf       = await file.arrayBuffer();
      const wb        = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const sheet     = wb.Sheets[sheetName];
      const aoa: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
      if (!aoa.length) throw new Error("File appears to be empty.");
      const [rawHeaders, ...rawRows] = aoa;
      const headers = rawHeaders.map((c: any) => String(c ?? ""));
      const rows    = rawRows.map(r => headers.map((_: any, ci: number) => String(r[ci] ?? "")));
      setPreview(prev => prev ? { ...prev, headers, rows, sheetName, colWidths: sheet["!cols"] as XLSX.ColInfo[] | undefined } : prev);
      setEditingRow(null);
      setTablePage(0);
      dispatch(setToastMessage("Excel uploaded — preview updated."));
    } catch (err: any) {
      dispatch(setToastMessage({ message: err?.message ?? "Failed to read Excel file.", duration: 5000 }));
    }
  }

  // ── Inline edit helpers ───────────────────────────────────────────────
  const startEdit = useCallback((ri: number, row: string[]) => {
    setEditingRow(ri);
    setEditBuffer([...row]);
  }, []);

  const saveEdit = useCallback(() => {
    if (editingRow === null || !preview) return;
    setPreview(prev => {
      if (!prev) return prev;
      const rows = prev.rows.map((r, i) => i === editingRow ? [...editBuffer] : r);
      return { ...prev, rows };
    });
    setEditingRow(null);
  }, [editingRow, editBuffer, preview]);

  const cancelEdit = useCallback(() => setEditingRow(null), []);

  // ── Step 1 → 2: upload + create endorsement ──────────────────────────
  const handleSubmit = async () => {
    if (!preview) return;
    const values   = formRHFRef.current?.getValues?.() ?? {};
    const policyId = Number(values.policyId);
    if (!policyId) return;

    setSubmitting(true);
    try {
      // Upload filled Excel (latest rows after any edits)
      const blob     = buildBlob(preview.headers, preview.rows, preview.sheetName, preview.colWidths);
      const formData = new FormData();
      formData.append("file", blob, preview.fileName);
      formData.append("companyType", "policy");
      formData.append("companyId", String(policyId));
      formData.append("documentTypeLid", "-1");

      const uploadResult: any = await apiRequest(endPoints.ibpFileUpload, {
        method: "POST", data: formData,
      });
      const documentId: number =
        uploadResult?.data?.id ?? uploadResult?.data?.[0]?.id ?? uploadResult?.data?.data?.id;
      if (!documentId) throw new Error("File upload did not return a document ID.");

      // Create endorsement
      const startDate           = toDateString(values.startDate);
      const endDate             = toDateString(values.endDate);
      const requestReceivedDate = toDateString(values.requestReceivedDate);

      const endorseResult: any = await apiRequest(
        endPoints.policyEnrollmentUpload(String(policyId)),
        {
          method: "POST",
          data: {
            documentId,
            documentType:      "policy_employee_data",
            intakeType:        "ADDITION",
            employeeCount:     String(values.employeeCount ?? employees.length),
            dependentCount:    String(values.dependentCount ?? "0"),
            enrollmentStartDate: startDate,
            enrollmentEndDate:   endDate,
            endorsementRequestReceivedDate: requestReceivedDate
              ? new Date(requestReceivedDate).toISOString()
              : new Date().toISOString(),
            endorsementType:   "FINANCIAL_ENDORSEMENT",
            osTicketNumber:    values.osTicketNumber ?? "",
            isInception:       Boolean(values.isInception),
          },
        },
      );

      const documentProcessingFileId: number | undefined =
        endorseResult?.data?.id ?? endorseResult?.data?.data?.id;
      const endorsementId: number | undefined =
        endorseResult?.data?.endorsementId ?? endorseResult?.data?.data?.endorsementId;

      setSuccessId(endorsementId ?? null);
      setSuccessPolicyId(policyId);

      // Generic post-success hook (see location.state destructuring above) —
      // lets a non-Zoho source (e.g. HCL intake records) find out which
      // document_processing_file/endorsement this submission produced, so
      // it can move its own source records into a "submitted" state.
      // Best-effort: a failure here must not undo the endorsement that was
      // already created, so it's logged via toast rather than thrown.
      if (onSubmitSuccessEndpoint && sourceRecordIds.length && documentProcessingFileId) {
        try {
          await apiRequest(onSubmitSuccessEndpoint, {
            method: "POST",
            data: { intakeIds: sourceRecordIds, documentProcessingFileId, endorsementId },
          });
        } catch {
          dispatch(setToastMessage({
            message: `Endorsement was created, but ${sourceLabel ?? "the source"} records could not be updated. They will remain visible for manual follow-up.`,
            duration: 8000,
          }));
        }
      }

      setStep(2);
    } catch (err: any) {
      dispatch(setToastMessage({
        message: err?.response?.data?.message ?? err?.message ?? "Endorsement creation failed.",
        duration: 6000,
      }));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Empty state guard ─────────────────────────────────────────────────
  // Checks both arrays, not just employees — HCL's "Member Only" submission
  // mode (HclIntakeDialog) deliberately sends dependents with no employees
  // (e.g. a Natural Addition to an already-enrolled employee), which is a
  // valid, non-empty submission that must not hit this guard.
  if (!employees.length && !dependents.length) {
    return (
      <Box sx={{ px: 3, py: 6, textAlign: "center" }}>
        <AlertTriangle size={40} color="#D97706" style={{ marginBottom: 12 }} />
        <Typography fontSize={16} fontWeight={600} mb={1}>No employee data found</Typography>
        <Typography fontSize={14} mb={3}>
          Please sync employees from Zoho People first before creating an endorsement.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/hr-portal/settings?tab=integrations")}
          sx={{ textTransform: "none", bgcolor: "#4338CA", "&:hover": { bgcolor: "#3730A3" } }}
        >
          Back to Integrations
        </Button>
      </Box>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ mx: -3, mt: -0.25, minHeight: "100%", background: "#F8FAFC" }}>
      <PortalHeroHeader
        title="Create Endorsement"
        subtitle={`${employees.length} employee${employees.length !== 1 ? "s" : ""}${dependents.length ? ` + ${dependents.length} dependent${dependents.length !== 1 ? "s" : ""}` : ""} ${sourceLabel ? `from ${sourceLabel}` : "synced from Zoho People"}`}
        onBack={() => navigate("/hr-portal/settings?tab=integrations")}
        noBorder={false}
      />

      <Box sx={{ px: 3, py: 3, width: "100%" }}>
        <StepIndicator active={step} />

        {/* ── Step 0: Form ── */}
        {step === 0 && (
          <Box sx={{ bgcolor: "#fff", border: "1px solid #E5E7EB", borderRadius: 2, p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
              <Typography fontWeight={700} fontSize={15}>
                Policy & Endorsement Details
              </Typography>
              {policiesLoading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "#6B7280" }}>
                  <CircularProgress size={13} />
                  <Typography fontSize={12}>Loading policies…</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{
              width: "100%",
              /* Force DynamicForm grid into a true 2-column CSS Grid.
                 DynamicForm hardcodes width:100%/flexBasis:auto on items which
                 breaks MUI Grid's responsive breakpoints. */
              "& .MuiGrid-container": {
                display: "grid !important",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px 48px",
                width: "100% !important",
                marginLeft: "0 !important",
              },
              "& .MuiGrid-container .MuiGrid-item": {
                width: "100% !important",
                maxWidth: "none !important",
                padding: "0 !important",
                flexBasis: "unset !important",
              },
              /* gridColumn:12 items (policy dropdown, checkbox) span both columns */
              "& .MuiGrid-container .MuiGrid-grid-md-12": {
                gridColumn: "1 / -1",
              },
            }}>
              <DynamicForm
                key={`zoho-form-${policyCards.length}-${formKey}`}
                formConfig={formConfig}
                defaultValues={formDefaultValues}
                variant="ibp"
                formMethods={(methods) => { formRHFRef.current = methods; }}
              />
            </Box>
          </Box>
        )}

        {/* ── Step 1: Preview & Edit ── */}
        {step === 1 && (
          <Box sx={{ bgcolor: "#fff", border: "1px solid #E5E7EB", borderRadius: 2, p: 3, mb: 3 }}>
            {/* Loading */}
            {previewLoading && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, gap: 2 }}>
                <CircularProgress size={32} sx={{ color: "#4338CA" }} />
                <Typography fontSize={13}>Downloading template and mapping employee data…</Typography>
              </Box>
            )}

            {/* Error */}
            {!previewLoading && previewError && (
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, bgcolor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 1.5, p: 2 }}>
                <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <Box>
                  <Typography fontSize={13} fontWeight={600} color="#DC2626">Failed to prepare template</Typography>
                  <Typography fontSize={12} color="#991B1B" mt={0.5}>{previewError}</Typography>
                </Box>
              </Box>
            )}

            {/* Preview table */}
            {!previewLoading && preview && (
              <>
                {/* Header bar */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
                  <Box>
                    <Typography fontWeight={700} fontSize={15}>Employee Data Preview</Typography>
                    <Typography fontSize={13} mt={0.25}>
                      {employees.length} employee{employees.length !== 1 ? "s" : ""}
                      {dependents.length > 0 && ` + ${dependents.length} dependent${dependents.length !== 1 ? "s" : ""}`}
                      {" "}· {preview.headers.length} columns
                      {editingRow !== null && (
                        <Box component="span" sx={{ ml: 1.5, px: 1, py: 0.2, borderRadius: 1, bgcolor: "#FEF9C3", color: "#92400E", fontSize: 11, fontWeight: 600 }}>
                          Editing row {editingRow + 1}
                        </Box>
                      )}
                    </Typography>
                  </Box>

                  {/* Download / Upload actions */}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Download size={14} />}
                      onClick={handleDownloadExcel}
                      sx={{ textTransform: "none", fontWeight: 600, fontSize: 12 }}
                    >
                      Download Excel
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Upload size={14} />}
                      onClick={() => uploadRef.current?.click()}
                      sx={{ textTransform: "none", fontWeight: 600, fontSize: 12 }}
                    >
                      Upload Modified
                    </Button>
                    <input
                      ref={uploadRef}
                      type="file"
                      accept=".xlsx,.xls"
                      style={{ display: "none" }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadExcel(file);
                        e.target.value = "";
                      }}
                    />
                  </Box>
                </Box>

                <Typography fontSize={12} mb={1.5} color="#6B7280">
                  Click the <Pencil size={11} style={{ verticalAlign: "middle", marginBottom: 2 }} /> edit icon on any row to correct data inline.
                  Or download the sheet, edit in Excel, then upload it back.
                </Typography>

                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{ border: "1px solid #E5E7EB", borderRadius: 1.5, maxHeight: "calc(100vh - 340px)", overflowX: "auto" }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: "#F8FAFC", fontWeight: 700, fontSize: 11, color: "#374151", minWidth: 36 }}>#</TableCell>
                        {dependents.length > 0 && (
                          <TableCell sx={{ bgcolor: "#F8FAFC", fontWeight: 700, fontSize: 11, color: "#374151", whiteSpace: "nowrap" }}>
                            Linked To
                          </TableCell>
                        )}
                        {preview.headers.map((h, i) => (
                          <TableCell key={i} sx={{ bgcolor: "#F8FAFC", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap", color: "#374151" }}>
                            {h || "—"}
                          </TableCell>
                        ))}
                        <TableCell sx={{ bgcolor: "#F8FAFC", fontWeight: 700, fontSize: 11, color: "#374151", minWidth: 72, position: "sticky", right: 0, boxShadow: "-2px 0 4px rgba(0,0,0,0.06)" }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {preview.rows.slice(tablePage * PAGE_SIZE, (tablePage + 1) * PAGE_SIZE).map((row, pageRowIdx) => {
                        const ri = tablePage * PAGE_SIZE + pageRowIdx;
                        const isEditing = editingRow === ri;
                        return (
                          <TableRow
                            key={ri}
                            sx={{
                              "&:nth-of-type(even)": { bgcolor: isEditing ? "transparent" : "#FAFAFA" },
                              bgcolor: isEditing ? "#FFFBEB" : "transparent",
                              transition: "background 0.15s",
                            }}
                          >
                            <TableCell sx={{ fontSize: 11, color: "#9CA3AF" }}>{ri + 1}</TableCell>

                            {dependents.length > 0 && (
                              <TableCell sx={{ fontSize: 11, whiteSpace: "nowrap" }}>
                                {rowLinks[ri] ? (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#7C3AED" }}>
                                    <CornerDownRight size={12} />
                                    {rowLinks[ri]}
                                  </Box>
                                ) : (
                                  <Box component="span" sx={{ color: "#D1D5DB" }}>—</Box>
                                )}
                              </TableCell>
                            )}

                            {row.map((cell, ci) =>
                              isEditing ? (
                                <TableCell key={ci} sx={{ p: 0.5 }}>
                                  <Box
                                    component="input"
                                    value={editBuffer[ci] ?? ""}
                                    onChange={e => {
                                      const next = [...editBuffer];
                                      next[ci] = e.target.value;
                                      setEditBuffer(next);
                                    }}
                                    sx={{
                                      width: "100%", minWidth: 80,
                                      border: "1px solid #A78BFA",
                                      borderRadius: "4px",
                                      px: 0.75, py: 0.5,
                                      fontSize: 12,
                                      outline: "none",
                                      bgcolor: "#fff",
                                      "&:focus": { borderColor: "#7C3AED", boxShadow: "0 0 0 2px rgba(124,58,237,0.12)" },
                                    }}
                                  />
                                </TableCell>
                              ) : (
                                <TableCell key={ci} sx={{ fontSize: 12, whiteSpace: "nowrap" }}>
                                  {cell || <span style={{ color: "#D1D5DB" }}>—</span>}
                                </TableCell>
                              )
                            )}

                            {/* Actions column */}
                            <TableCell
                              sx={{
                                position: "sticky", right: 0,
                                bgcolor: isEditing ? "#FFFBEB" : ri % 2 === 1 ? "#FAFAFA" : "#fff",
                                boxShadow: "-2px 0 4px rgba(0,0,0,0.06)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {isEditing ? (
                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                  <Tooltip title="Save">
                                    <IconButton size="small" onClick={saveEdit} sx={{ color: "#16A34A", "&:hover": { bgcolor: "#DCFCE7" } }}>
                                      <Check size={14} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Cancel">
                                    <IconButton size="small" onClick={cancelEdit} sx={{ color: "#DC2626", "&:hover": { bgcolor: "#FEE2E2" } }}>
                                      <X size={14} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              ) : (
                                <Tooltip title="Edit this row">
                                  <IconButton
                                    size="small"
                                    onClick={() => startEdit(ri, row)}
                                    sx={{ color: "#6B7280", "&:hover": { bgcolor: "#EFF6FF", color: "#2563EB" } }}
                                  >
                                    <Edit2 size={13} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {preview.rows.length > PAGE_SIZE && (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, flexWrap: "wrap", gap: 1 }}>
                    <Typography fontSize={13} color="#6B7280">
                      Showing {tablePage * PAGE_SIZE + 1}–{Math.min((tablePage + 1) * PAGE_SIZE, preview.rows.length)} of {preview.rows.length} {dependents.length > 0 ? "records" : "employees"}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={tablePage === 0}
                        onClick={() => { setTablePage(0); setEditingRow(null); }}
                        sx={{ minWidth: 36, px: 1, textTransform: "none", fontSize: 12 }}
                      >
                        «
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={tablePage === 0}
                        onClick={() => { setTablePage(p => p - 1); setEditingRow(null); }}
                        sx={{ minWidth: 36, px: 1, textTransform: "none", fontSize: 12 }}
                      >
                        ‹ Prev
                      </Button>

                      {Array.from({ length: Math.ceil(preview.rows.length / PAGE_SIZE) }, (_, i) => i)
                        .filter(i => Math.abs(i - tablePage) <= 2)
                        .map(i => (
                          <Button
                            key={i}
                            size="small"
                            variant={i === tablePage ? "contained" : "outlined"}
                            onClick={() => { setTablePage(i); setEditingRow(null); }}
                            sx={{
                              minWidth: 36, px: 1, textTransform: "none", fontSize: 12,
                              ...(i === tablePage && { bgcolor: "#4338CA", "&:hover": { bgcolor: "#3730A3" } }),
                            }}
                          >
                            {i + 1}
                          </Button>
                        ))}

                      <Button
                        size="small"
                        variant="outlined"
                        disabled={tablePage >= Math.ceil(preview.rows.length / PAGE_SIZE) - 1}
                        onClick={() => { setTablePage(p => p + 1); setEditingRow(null); }}
                        sx={{ minWidth: 36, px: 1, textTransform: "none", fontSize: 12 }}
                      >
                        Next ›
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={tablePage >= Math.ceil(preview.rows.length / PAGE_SIZE) - 1}
                        onClick={() => { setTablePage(Math.ceil(preview.rows.length / PAGE_SIZE) - 1); setEditingRow(null); }}
                        sx={{ minWidth: 36, px: 1, textTransform: "none", fontSize: 12 }}
                      >
                        »
                      </Button>
                    </Box>
                  </Box>
                )}

                <Typography fontSize={12} mt={1.5} color="#6B7280">
                  Empty cells (—) mean the template column has no matching field in Zoho employee data.
                </Typography>
              </>
            )}
          </Box>
        )}

        {/* ── Step 2: Success ── */}
        {step === 2 && (
          <Box
            sx={{
              bgcolor: "#fff", border: "1px solid #E5E7EB", borderRadius: 2, p: 4, mb: 3,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2, textAlign: "center",
            }}
          >
            <CheckCircle2 size={52} color="#16A34A" />
            <Typography fontWeight={700} fontSize={18}>Endorsement Created Successfully</Typography>
            {successId && (
              <Typography fontSize={14}>Endorsement ID: <strong>{successId}</strong></Typography>
            )}
            <Typography fontSize={14} maxWidth={400}>
              {employees.length} employee{employees.length !== 1 ? "s" : ""}
              {dependents.length > 0 && ` and ${dependents.length} dependent${dependents.length !== 1 ? "s" : ""}`}
              {" "}({preview?.rows.length} record{(preview?.rows.length ?? 0) !== 1 ? "s" : ""} total) submitted
              for endorsement processing with intake type <strong>ADDITION</strong>.
            </Typography>
            <Box sx={{
              bgcolor: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 1.5,
              px: 2, py: 1.5, maxWidth: 440,
            }}>
              <Typography fontSize={13} color="#1E3A8A">
                Processing happens in the background — it isn't instant. To check on this
                endorsement's status, please contact your CRM and share{" "}
                <strong>Endorsement ID {successId ?? "—"}</strong> and{" "}
                <strong>Policy ID {successPolicyId ?? "—"}</strong>; they can look it up directly.
              </Typography>
            </Box>
          </Box>
        )}

        {/* ── Navigation buttons ── */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, pt: 1 }}>
          {step === 0 && (
            <>
              <Button
                variant="outlined"
                onClick={() => navigate("/hr-portal/settings?tab=integrations")}
                sx={{ textTransform: "none" }}
              >
                Cancel
              </Button>
              <Button
                variant="outlined"
                onClick={handleDownloadTemplate}
                disabled={policiesLoading || templateDownloading}
                startIcon={templateDownloading ? <CircularProgress size={13} color="inherit" /> : <Download size={14} />}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                {templateDownloading ? "Downloading…" : "Download Template"}
              </Button>
              <Button
                variant="contained"
                onClick={handlePreview}
                disabled={policiesLoading}
                sx={{ bgcolor: "#4338CA", "&:hover": { bgcolor: "#3730A3" }, textTransform: "none", fontWeight: 600 }}
              >
                Preview Endorsement
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <Button
                variant="outlined"
                onClick={() => { setStep(0); setPreview(null); setPreviewError(""); setEditingRow(null); setFormKey(k => k + 1); }}
                disabled={previewLoading || submitting}
                sx={{ textTransform: "none" }}
              >
                Back
              </Button>
              {previewError && (
                <Button variant="outlined" onClick={handlePreview} sx={{ textTransform: "none" }}>
                  Retry
                </Button>
              )}
              {preview && !previewLoading && (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={submitting || editingRow !== null}
                  startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : undefined}
                  sx={{ bgcolor: "#4338CA", "&:hover": { bgcolor: "#3730A3" }, textTransform: "none", fontWeight: 600 }}
                >
                  {submitting ? "Submitting…" : "Proceed to Endorsement"}
                </Button>
              )}
            </>
          )}

          {step === 2 && (
            <Button
              variant="contained"
              onClick={() => navigate("/hr-portal/settings?tab=integrations")}
              sx={{ bgcolor: "#4338CA", "&:hover": { bgcolor: "#3730A3" }, textTransform: "none", fontWeight: 600 }}
            >
              Done
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ZohoEndorsementPage;
