import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, CircularProgress, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";
import { CustomModal } from "@ui/ui-lib";
import DynamicForm from "@ui/ui-lib/commonComponents/FormComponent";
import type { FormFieldConfig } from "@ui/ui-lib/commonComponents/FormComponent/types";
import { useDispatch } from "react-redux";
import { setToastMessage } from "../../redux/slice";
import { apiClient } from "../../utils/apiInterceptor";
import { getCompanyId } from "../../utils/companyConfig";

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
}

interface PolicyOption {
  policyId: number;
  policyName: string;
  insurerPolicyNumber: string;
}

interface PreviewData {
  headers: string[];
  rows: string[][];
  xlsxBlob: Blob;
  fileName: string;
}

// ─── Header → ZohoEmployee field fuzzy mapper ─────────────────────────────

const FIELD_PATTERNS: [RegExp, keyof ZohoEmployee][] = [
  [/emp(loyee)?(id|code|no)|staffid/i,              "employeeId"],
  [/first\s*name|firstname|employee\s*name|^name$/i, "firstName"],
  [/last\s*name|lastname|surname/i,                 "lastName"],
  [/e?mail/i,                                       "email"],
  [/mobile|phone|contact/i,                         "mobile"],
  [/d\.?o\.?b|birth|date.*birth/i,                 "dateOfBirth"],
  [/gender|sex/i,                                   "gender"],
  [/designation|job\s*title|title/i,                "designation"],
  [/dept|department/i,                              "department"],
  [/d\.?o\.?j|joining|date.*join/i,                "dateOfJoining"],
  [/status/i,                                       "employmentStatus"],
  [/ctc|annual.*sal|sum.*insured|salary/i,          "ctc"],
];

function headerToField(header: string): keyof ZohoEmployee | null {
  for (const [re, field] of FIELD_PATTERNS) {
    if (re.test(header.trim())) return field;
  }
  return null;
}

// ─── Default form values ──────────────────────────────────────────────────

function makeDefaults(employeeCount: number) {
  const today = new Date().toISOString().split("T")[0];
  const plus15 = (() => {
    const d = new Date(); d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  })();
  return {
    policyId: "",
    startDate: today,
    endDate: plus15,
    employeeCount: String(employeeCount),
    dependentCount: "0",
    osTicketNumber: "",
    requestReceivedDate: today,
    isInception: false,
  };
}

// ─── Step indicator ───────────────────────────────────────────────────────

const STEPS = ["Policy & Details", "Preview Template", "Done"];

function StepIndicator({ active }: { active: number }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0, mb: 3 }}>
      {STEPS.map((label, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <Box key={label} sx={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "unset" }}>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 }}>
              <Box
                sx={{
                  width: 28, height: 28, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  bgcolor: done || current ? "#4338CA" : "#E5E7EB",
                  color: done || current ? "#fff" : "#6B7280",
                }}
              >
                {done ? "✓" : i + 1}
              </Box>
              <Typography
                fontSize={11}
                fontWeight={current ? 700 : 400}
                mt={0.5}
                sx={{ color: current ? "#4338CA" : done ? "#374151" : "#6B7280" }}
              >
                {label}
              </Typography>
            </Box>
            {i < STEPS.length - 1 && (
              <Box
                sx={{
                  flex: 1, height: 2, mb: 2.5, mx: 0.5,
                  bgcolor: i < active ? "#4338CA" : "#E5E7EB",
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

export function ZohoEndorsementDialog({
  open,
  onClose,
  employees,
}: {
  open: boolean;
  onClose: () => void;
  employees: ZohoEmployee[];
}) {
  const dispatch = useDispatch();
  const companyId = getCompanyId();

  const [step, setStep] = useState(0);
  const [policies, setPolicies] = useState<PolicyOption[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successEndorsementId, setSuccessEndorsementId] = useState<number | null>(null);

  // RHF methods exposed by DynamicForm
  const formRHFRef = useRef<any>(null);

  // Fetch policies when dialog opens
  useEffect(() => {
    if (!open || !companyId) return;
    setPoliciesLoading(true);
    apiClient
      .post(`/iirm/ibp-service/hr-module/generate/endorsement_list`, {
        companyId,
        policyId: "",
      })
      .then((res: any) => {
        const list: any[] = res?.data?.data ?? [];
        const seen = new Set<number>();
        const opts: PolicyOption[] = [];
        for (const item of list) {
          const pid = Number(item.policyId);
          if (!pid || seen.has(pid)) continue;
          seen.add(pid);
          opts.push({
            policyId: pid,
            policyName: String(item.policyName ?? item.policyNumber ?? `Policy ${pid}`),
            insurerPolicyNumber: String(item.policyNumber ?? item.insurerPolicyNumber ?? ""),
          });
        }
        setPolicies(opts);
      })
      .catch(() => setPolicies([]))
      .finally(() => setPoliciesLoading(false));
  }, [open, companyId]);

  const handleClose = () => {
    if (submitting || previewLoading) return;
    setStep(0);
    setPreview(null);
    setPreviewError("");
    setSuccessEndorsementId(null);
    onClose();
  };

  // ── formConfig — rebuilt when policies load ───────────────────────────────
  const formConfig: FormFieldConfig[] = useMemo(() => [
    {
      key: "policyId",
      name: "policyId",
      label: "Select Policy",
      type: "select",
      rules: { required: "Please select a policy" },
      options: policies.map(p => ({
        value: String(p.policyId),
        label: p.policyName + (p.insurerPolicyNumber ? ` — ${p.insurerPolicyNumber}` : ""),
      })),
      componentProps: {
        fullWidth: true,
        disabled: policiesLoading,
        placeholder: policiesLoading ? "Loading policies…" : "Select a policy",
      },
      gridColumn: 12,
    },
    {
      key: "startDate",
      name: "startDate",
      label: "Endorsement Start Date",
      type: "text",
      rules: { required: "Start date is required" },
      componentProps: { type: "date", fullWidth: true },
      gridColumn: 6,
    },
    {
      key: "endDate",
      name: "endDate",
      label: "Endorsement End Date",
      type: "text",
      rules: { required: "End date is required" },
      componentProps: { type: "date", fullWidth: true },
      gridColumn: 6,
    },
    {
      key: "employeeCount",
      name: "employeeCount",
      label: "No. of Employees",
      type: "text",
      componentProps: { type: "number", fullWidth: true },
      gridColumn: 6,
    },
    {
      key: "dependentCount",
      name: "dependentCount",
      label: "No. of Dependents",
      type: "text",
      componentProps: { type: "number", fullWidth: true },
      gridColumn: 6,
    },
    {
      key: "osTicketNumber",
      name: "osTicketNumber",
      label: "OS Ticket Number",
      type: "text",
      componentProps: { fullWidth: true },
      gridColumn: 6,
    },
    {
      key: "requestReceivedDate",
      name: "requestReceivedDate",
      label: "Request Received Date",
      type: "text",
      componentProps: { type: "date", fullWidth: true },
      gridColumn: 6,
    },
    {
      key: "isInception",
      name: "isInception",
      label: "Is Inception (first endorsement for this policy)",
      type: "checkbox",
      gridColumn: 12,
    },
  ], [policies, policiesLoading]);

  // ── Step 1: fetch template + fill employees ───────────────────────────────
  async function handlePreview() {
    const values = formRHFRef.current?.getValues?.() ?? {};
    const policyId = Number(values.policyId);
    if (!policyId) return;

    setPreviewLoading(true);
    setPreviewError("");
    setStep(1);

    try {
      // 1. Get template document ID
      const tmplRes: any = await apiClient.get(
        `/iirm/policy-service/policy/${policyId}/template`,
      );
      const templateDocId: number =
        tmplRes?.data?.data?.documentId ?? tmplRes?.data?.documentId;
      if (!templateDocId) throw new Error("Policy has no data template configured.");

      // 2. Download Excel template as binary
      const dlRes = await apiClient.get(
        `/iirm/org-service/file-upload/${templateDocId}/download?moduleKey=inception`,
        { responseType: "arraybuffer" },
      );

      // 3. Parse Sheet 1 headers (row 0 only — ignore dummy data rows)
      const workbook = XLSX.read(dlRes.data as ArrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1:Z1");

      const headers: string[] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r: 0, c })];
        headers.push(cell ? String(cell.v ?? "") : "");
      }

      // 4. Map headers to employee fields and build rows
      const fieldMap = headers.map(headerToField);
      const rows: string[][] = employees.map(emp =>
        headers.map((_, ci) => {
          const f = fieldMap[ci];
          return f ? String(emp[f] ?? "") : "";
        }),
      );

      // 5. Generate filled Excel (header row + employee rows, no dummy data)
      const wsData = [headers, ...rows];
      const newSheet = XLSX.utils.aoa_to_sheet(wsData);
      if (sheet["!cols"]) newSheet["!cols"] = sheet["!cols"];
      const newWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWb, newSheet, sheetName);
      const wbOut = XLSX.write(newWb, { type: "array", bookType: "xlsx" });
      const xlsxBlob = new Blob([wbOut], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const selectedPolicy = policies.find(p => p.policyId === policyId);
      const fileName = `endorsement-${selectedPolicy?.insurerPolicyNumber || policyId}-employees.xlsx`;
      setPreview({ headers, rows, xlsxBlob, fileName });
    } catch (err: any) {
      setPreviewError(
        err?.response?.data?.message ?? err?.message ?? "Failed to prepare endorsement template.",
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  // ── Step 2 → submit ───────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!preview) return;
    const values = formRHFRef.current?.getValues?.() ?? {};
    const policyId = Number(values.policyId);
    if (!policyId) return;

    setSubmitting(true);
    try {
      // 1. Upload filled Excel
      const formData = new FormData();
      formData.append("file", preview.xlsxBlob, preview.fileName);
      formData.append("companyType", "policy");
      formData.append("companyId", String(policyId));
      formData.append("documentTypeLid", "654321");

      const uploadRes: any = await apiClient.post(
        `/iirm/org-service/file-upload/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const documentId: number =
        uploadRes?.data?.id ?? uploadRes?.data?.[0]?.id ?? uploadRes?.data?.data?.id;
      if (!documentId) throw new Error("File upload did not return a document ID.");

      // 2. Create endorsement
      const today = new Date().toISOString().split("T")[0];
      const endorseRes: any = await apiClient.post(
        `/iirm/policy-service/policy/${policyId}/enrollment-upload`,
        {
          documentId,
          documentType: "policy_employee_data",
          employeeCount: String(values.employeeCount ?? employees.length),
          dependentCount: String(values.dependentCount ?? "0"),
          enrollmentStartDate: values.startDate ?? today,
          enrollmentEndDate: values.endDate ?? today,
          endorsementRequestReceivedDate: values.requestReceivedDate
            ? new Date(values.requestReceivedDate).toISOString()
            : new Date().toISOString(),
          endorsementType: "FINANCIAL_ENDORSEMENT",
          osTicketNumber: values.osTicketNumber ?? "",
          isInception: Boolean(values.isInception),
        },
      );
      setSuccessEndorsementId(
        endorseRes?.data?.endorsementId ?? endorseRes?.data?.data?.endorsementId ?? null,
      );
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

  // ── Compute buttons per step ──────────────────────────────────────────────
  const buttons = useMemo(() => {
    if (step === 0) return [
      { label: "Cancel", onClick: handleClose, variant: "secondary" as const },
      { label: "Preview Endorsement", onClick: handlePreview, variant: "primary" as const },
    ];
    if (step === 1 && !previewLoading) return [
      {
        label: "Back", onClick: () => { setStep(0); setPreview(null); setPreviewError(""); },
        variant: "secondary" as const,
      },
      ...(previewError ? [{ label: "Retry", onClick: handlePreview, variant: "secondary" as const }] : []),
      ...(preview ? [{
        label: submitting ? "Submitting…" : "Proceed to Endorsement",
        onClick: handleSubmit,
        variant: "primary" as const,
        loading: submitting,
        disabled: submitting,
      }] : []),
    ];
    if (step === 2) return [
      { label: "Done", onClick: handleClose, variant: "primary" as const },
    ];
    return [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, previewLoading, preview, previewError, submitting]);

  return (
    <CustomModal
      open={open}
      handleClose={handleClose}
      heading={`Create Endorsement — ${employees.length} employee${employees.length !== 1 ? "s" : ""} from Zoho`}
      buttons={buttons}
      modalBoxStyles={{
        width: "860px",
        maxWidth: "96vw",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      <Box sx={{ pt: 1 }}>
        <StepIndicator active={step} />

        {/* ── Step 0: Policy & Form ── */}
        {step === 0 && (
          <DynamicForm
            key={`zoho-form-${policies.length}`}
            formConfig={formConfig}
            defaultValues={makeDefaults(employees.length)}
            variant="ibp"
            formMethods={(methods) => { formRHFRef.current = methods; }}
          />
        )}

        {/* ── Step 1: Preview ── */}
        {step === 1 && (
          <Box>
            {previewLoading && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, gap: 2 }}>
                <CircularProgress size={32} sx={{ color: "#4338CA" }} />
                <Typography fontSize={13}>
                  Downloading template and preparing employee data…
                </Typography>
              </Box>
            )}

            {!previewLoading && previewError && (
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, bgcolor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 1.5, p: 2 }}>
                <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <Box>
                  <Typography fontSize={13} fontWeight={600} color="#DC2626">
                    Failed to prepare template
                  </Typography>
                  <Typography fontSize={12} color="#991B1B" mt={0.5}>{previewError}</Typography>
                </Box>
              </Box>
            )}

            {!previewLoading && preview && (
              <Box>
                <Typography fontSize={13} mb={1.5}>
                  {preview.rows.length} employee{preview.rows.length !== 1 ? "s" : ""} mapped to{" "}
                  {preview.headers.length} template columns
                </Typography>

                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{ border: "1px solid #E5E7EB", borderRadius: 1.5, maxHeight: 340, overflowX: "auto" }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: "#F8FAFC", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap", color: "#374151", minWidth: 30 }}>
                          #
                        </TableCell>
                        {preview.headers.map((h, i) => (
                          <TableCell key={i} sx={{ bgcolor: "#F8FAFC", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap", color: "#374151" }}>
                            {h || "—"}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {preview.rows.map((row, ri) => (
                        <TableRow key={ri} sx={{ "&:nth-of-type(even)": { bgcolor: "#FAFAFA" } }}>
                          <TableCell sx={{ fontSize: 11, color: "#9CA3AF" }}>{ri + 1}</TableCell>
                          {row.map((cell, ci) => (
                            <TableCell key={ci} sx={{ fontSize: 12, whiteSpace: "nowrap" }}>
                              {cell || <span style={{ color: "#D1D5DB" }}>—</span>}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography fontSize={12} mt={1}>
                  Empty cells mean the template column has no matching field in Zoho data.
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* ── Step 2: Success ── */}
        {step === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4, gap: 2 }}>
            <CheckCircle2 size={48} color="#16A34A" />
            <Typography fontWeight={700} fontSize={17}>Endorsement Created</Typography>
            {successEndorsementId && (
              <Typography fontSize={14}>
                Endorsement ID: <strong>{successEndorsementId}</strong>
              </Typography>
            )}
            <Typography fontSize={14} textAlign="center" maxWidth={360}>
              {preview?.rows.length} employee records submitted for endorsement processing.
            </Typography>
          </Box>
        )}
      </Box>
    </CustomModal>
  );
}
