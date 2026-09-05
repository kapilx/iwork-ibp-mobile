import { useState, useEffect, startTransition } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CommonBreadcrumb, endPoints, apiRequest } from "@ui/ui-lib";
import {
  Alert, Autocomplete, Box, Button, Checkbox, Chip,
  CircularProgress, Collapse, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel,
  IconButton, InputAdornment,
  MenuItem, Select, Switch,
  Table, TableBody, TableCell, TableHead, TableRow,
  TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

// ─── Types ────────────────────────────────────────────────────────────────────

type PayloadFormat = "JSON" | "XML" | "FORM";
type DataType = "string" | "number" | "boolean" | "date";
type FlowType = "REDIRECT" | "DISPLAY" | "SYNC" | "DIRECT_CALL";
type TargetType = "PLACEHOLDER" | "STANDARD_KEY" | "DB_COLUMN";

interface ResponseMappingRow {
  id?: number;
  responseKey: string;
  sampleValue: string;    // display only — from auto-discover
  targetType: TargetType;
  outputKey: string;
  targetTable?: string | null;
  isAuthToken: boolean;
  isPrimaryFk: boolean;   // DB_COLUMN secondary table: inject primary table's inserted ID as FK
  displayOrder: number;
}

interface PayloadRow {
  key: string;
  valueType: "static" | "dynamic";
  dataType: DataType;
  staticValue: string;
  placeholderName: string;
  dateFormat?: string;
  secured?: boolean; // static value comes from .env at runtime — never stored in DB
}

interface FeatureType { id: number; key: string; label: string; description: string | null; isActive: boolean; }
interface Tpa { id: number; tpaName: string; }
interface DbTableSchema {
  tableName: string;
  category: "POLICY" | "EMPLOYEE" | "ENROLLMENT" | "OTHER";
  columns: { name: string; dataType: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTH_TYPES = [
  { value: "DIRECT",             label: "DIRECT",             description: "No auth — credentials go in the payload itself" },
  { value: "JWT",                label: "JWT",                description: "Generate internal JWT → Step 1 verify → get magic link" },
  { value: "SESSION",            label: "SESSION",            description: "Step 1 token endpoint (no header) → access token → Step 2 Bearer" },
  { value: "SESSION_BODY",       label: "SESSION BODY",       description: "Step 1 returns token → injected into Step 2 request body" },
  { value: "BASIC_AUTH",         label: "BASIC AUTH",         description: "Static Basic Auth credentials on every data API call" },
  { value: "HEADER_CREDENTIALS", label: "HEADER CREDENTIALS", description: "Static custom headers carry credentials on every call (no token exchange)" },
];
const FLOW_TYPES: { value: FlowType; label: string; description: string }[] = [
  { value: "REDIRECT",    label: "Redirect",         description: "API returns a URL → IBP opens it in new tab (e-card, TPA portal)" },
  { value: "DISPLAY",     label: "Display",          description: "API returns data → IBP shows it to employee (member details, balance)" },
  { value: "SYNC",        label: "Sync",             description: "API returns data → scheduler writes to our DB tables (hospital list, claims)" },
  { value: "DIRECT_CALL", label: "Direct API Call",  description: "Called on-demand by a backend service, response used immediately — no redirect, no display, no scheduled sync (claim intimation/submission)" },
];
const SYNC_SCOPES = [
  { value: "GLOBAL",     label: "Global",     description: "One call — data applies across all TPAs/policies" },
  { value: "PER_TPA",    label: "Per TPA",    description: "One call per TPA using this config" },
  { value: "PER_POLICY", label: "Per Policy", description: "One call per active policy under that TPA" },
];
const SYNC_PRESETS = [
  {
    value: "HOSPITAL_NETWORK",
    label: "Hospital Network",
    description: "mstr_hospital + mstr_hospital_address",
    tables: ["mstr_hospital", "mstr_hospital_address"],
    primaryTable: "mstr_hospital",
    dedupColumn: "external_hospital_id",
  },
  {
    value: "CLAIMS_SETTLEMENT",
    label: "Claims Settlement",
    description: "policy_claim (status_log + tpa_claim_data auto-written by parser)",
    tables: ["policy_claim"],
    primaryTable: "policy_claim",
    dedupColumn: "ref_claim_id",
  },
  {
    value: "CUSTOM",
    label: "Custom",
    description: "Choose tables manually",
    tables: [],
    primaryTable: "",
    dedupColumn: "",
  },
];
// Canonical claim dynamicFields — must match buildGenericIntimationFields() and
// submitClaim() in company-employee.service.ts exactly. This is the fixed set of
// {{placeholder}} names admins pick from (dropdown-only, no free text) so the same
// concept always gets the same name across TPA configs. Most are auto-supplied by
// the claims backend by default (USER_INPUT), but any of them can still be pointed
// at a real DB table/column in the Payload Field Mappings section below — a DB
// mapping there always overrides the backend's default for that name.
const CLAIM_CANONICAL_FIELDS: Record<string, string> = {
  // Intimate Claim stage
  policyNumber: "Policy's insurer policy number",
  memberCardId: "Patient's TPA card ID (employee or dependent)",
  employeeCode: "Employee's Company Employee ID (from their profile)",
  claimType: "CASHLESS / REIMBURSEMENT — chosen by the employee",
  benefitType: "IPD / OPD — chosen by the employee",
  estimatedClaimAmount: "Entered by the employee in the claim form",
  dateOfAdmission: "Entered by the employee in the claim form",
  diagnosis: "Entered by the employee in the claim form",
  patientName: "Patient's name (employee or dependent, whoever the claim is for)",
  patientMobile: "Employee's phone number, from their profile",
  patientEmail: "Employee's email, from their profile",
  hospitalId: "Selected hospital's internal ID",
  hospitalCode: "Selected hospital's external/TPA ID, from the hospital master",
  hospitalName: "Selected or manually entered hospital name",
  hospitalAddress: "Selected or manually entered hospital address",
  hospitalPhone: "Selected hospital's phone number, from the hospital master",
  hospitalCity: "Selected hospital's city, from the hospital master",
  hospitalState: "Selected hospital's state, from the hospital master",
  hospitalPincode: "Selected hospital's pincode, from the hospital master",
  // Submit Claim stage
  claimReferenceId: "TPA's claim reference from the Intimate response — stored in policy_claim.tpa_claim_no",
  claimReferenceExt: "Extension part of the TPA's claim reference (e.g. Health India's CCN_EXT) — also from policy_claim.tpa_claim_no",
  dateOfDischarge: "Entered by the employee in the Submit Claim form (at Intimation, this is the proposed discharge date; at Submission, the final one)",
  finalClaimedAmount: "Entered by the employee (defaults to the original estimated amount)",
  payeeName: "Entered by the employee in the Submit Claim form",
  bankAccountNo: "Entered by the employee in the Submit Claim form",
  accountType: "Entered by the employee (Savings / Current)",
  ifscCode: "Entered by the employee in the Submit Claim form",
  documentType: "Category tag the employee chose for each uploaded document",
  fileBase64: "Uploaded document's file content, base64-encoded",
  fileName: "Uploaded document's original file name",
  documents: "Array of {documentType, fileBase64, fileName} — one per uploaded document",
};

const STANDARD_KEYS = [
  "REDIRECT_URL", "DOWNLOAD_URL",
  // For TPAs that return the file itself as base64 text rather than a URL
  // (e.g. no downloadable link at all, just the PDF bytes inline in the response).
  // Read by ECardPage's resolveEcardUrl() as a fallback when no URL key is populated.
  "BASE64_PDF",
  "MEMBER_ID", "MEMBER_NAME",
  "POLICY_NUMBER", "VALID_TILL", "BALANCE", "PATIENT_NAME", "TPA_ID",
  // Claim Submission (Intimate Claim response) — the claim reference the TPA
  // returns, read by callGenericExternalApp()'s extractTpaClaimRef() and stored
  // in policy_claim.tpa_claim_no so the later Submit Claim call can use it.
  "TPA_CLAIM_REF", "TPA_CLAIM_REF_EXT",
];
const EMPTY_MAPPING_ROW = (step: 1 | 2, order: number): ResponseMappingRow => ({
  responseKey: "", sampleValue: "", targetType: step === 1 ? "PLACEHOLDER" : "STANDARD_KEY",
  outputKey: "", targetTable: null, isAuthToken: false, isPrimaryFk: false, displayOrder: order,
});
const METHODS = ["POST", "GET"];
const PAYLOAD_FORMATS: { value: PayloadFormat; label: string; hint: string }[] = [
  { value: "JSON", label: "JSON",         hint: "application/json" },
  { value: "XML",  label: "XML",          hint: "application/xml" },
  { value: "FORM", label: "Form-encoded", hint: "application/x-www-form-urlencoded" },
];
const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: "string", label: "String" }, { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" }, { value: "date", label: "Date" },
];
const EMPTY_ROW: PayloadRow = { key: "", valueType: "dynamic", dataType: "string", staticValue: "", placeholderName: "", dateFormat: "" };


const DATE_FORMAT_OPTS = [
  { value: "",            label: "Select format…" },
  { value: "DD-MON-YYYY", label: "DD-MON-YYYY  (e.g. 01-JUL-2025)" },
  { value: "DD/MM/YYYY",  label: "DD/MM/YYYY   (e.g. 01/07/2025)" },
  { value: "MM/DD/YYYY",  label: "MM/DD/YYYY   (e.g. 07/01/2025)" },
  { value: "YYYY-MM-DD",  label: "YYYY-MM-DD   (e.g. 2025-07-01)" },
  { value: "__custom__",  label: "Custom…" },
];

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  POLICY: { label: "Policy", color: "#1565c0" }, EMPLOYEE: { label: "Employee", color: "#2e7d32" },
  ENROLLMENT: { label: "Enrollment", color: "#6a1b9a" }, OTHER: { label: "Other", color: "#546e7a" },
};
interface TableSelectOpt { value: string; label: string; group: string; color: string; mono: boolean; }

const buildTableOptions = (schema: DbTableSchema[]): TableSelectOpt[] => [
  { value: "USER_INPUT", label: "User Input (runtime)", group: "Special", color: "#546e7a", mono: false },
  { value: "STATIC", label: "Static Value", group: "Special", color: "#f57c00", mono: false },
  ...schema.map((t) => ({ value: t.tableName, label: t.tableName, group: CATEGORY_META[t.category]?.label ?? "Other", color: CATEGORY_META[t.category]?.color ?? "#999", mono: true })),
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Derives a unique .env key: LABEL_STEP{N}_FIELDNAME (uppercase, non-alnum → _)
const deriveEnvKey = (configLabel: string, step: 1 | 2, fieldName: string, isHeader = false): string => {
  const norm = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").toUpperCase();
  const section = isHeader ? "_HDR" : "";
  return `${norm(configLabel)}_STEP${step}${section}_${norm(fieldName)}`;
};

const rowsToPayload = (rows: PayloadRow[], opts?: { configLabel?: string; step?: 1 | 2; isHeader?: boolean }): Record<string, any> => {
  const obj: Record<string, any> = {};
  rows.forEach((r) => {
    const k = r.key.trim(); if (!k) return;
    if (r.secured && r.valueType === "static" && opts?.configLabel && opts?.step) {
      const secretKey = deriveEnvKey(opts.configLabel, opts.step, k, opts.isHeader ?? false);
      obj[k] = `{{secret:env:TPA_SECRET_ARN:${secretKey}}}`;
    } else if (r.valueType === "dynamic") {
      const name = r.placeholderName.trim() || k;
      const fmt = r.dataType === "date" && r.dateFormat && r.dateFormat !== "__custom__" && r.dateFormat.trim() ? `|date:${r.dateFormat.trim()}` : "";
      obj[k] = `{{${name}${fmt}}}`;
    }
    else if (r.dataType === "number") obj[k] = Number(r.staticValue) || 0;
    else if (r.dataType === "boolean") obj[k] = r.staticValue === "true";
    else obj[k] = r.staticValue;
  });
  return obj;
};

const payloadToRows = (payload: Record<string, any> | null): PayloadRow[] => {
  if (!payload || Object.keys(payload).length === 0) return [];
  return Object.entries(payload).map(([key, value]) => {
    const strVal = typeof value === "string" ? value : String(value);
    // Detect secured reference — {{env:KEY}} (legacy) or {{secret:env:VAR:KEY}} (new) — show as locked row
    if (/^\{\{env:[\w_]+\}\}$/.test(strVal) || /^\{\{secret:env:[\w_]+:[^}]+\}\}$/.test(strVal)) {
      return { key, valueType: "static" as const, dataType: "string" as DataType, staticValue: "", placeholderName: key, dateFormat: "", secured: true };
    }
    const dynMatch = strVal.match(/^\{\{(\w+)(?:\|date:([^}]+))?\}\}$/);
    if (dynMatch) {
      const dateFormat = dynMatch[2] ?? "";
      return { key, valueType: "dynamic" as const, dataType: dateFormat ? "date" as DataType : "string" as DataType, staticValue: "", placeholderName: dynMatch[1], dateFormat };
    }
    const dataType: DataType = typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string";
    return { key, valueType: "static" as const, dataType, staticValue: strVal, placeholderName: key, dateFormat: "" };
  });
};

const rowsToFieldHints = (rows1: PayloadRow[], rows2: PayloadRow[], mappingDefaults: Record<string, { sourceType: string; sourceField: string | null }> = {}): Record<string, { type: "DYNAMIC"; sourceType?: string; sourceField?: string }> => {
  const hints: Record<string, { type: "DYNAMIC"; sourceType?: string; sourceField?: string }> = {};
  [...rows1, ...rows2].forEach((r) => {
    if (r.valueType === "dynamic") {
      const name = r.placeholderName.trim() || r.key.trim(); if (!name) return;
      const def = mappingDefaults[name];
      hints[name] = { type: "DYNAMIC", ...(def?.sourceType ? { sourceType: def.sourceType } : {}), ...(def?.sourceField ? { sourceField: def.sourceField } : {}) };
    }
  });
  return hints;
};

const generatePreview = (rows: PayloadRow[], format: PayloadFormat): string => {
  const validRows = rows.filter((r) => r.key.trim());
  if (validRows.length === 0) return "";
  // Secured env-var rows: replace empty staticValue with "[secured]" so preview is meaningful
  const displayRows = validRows.map((r) => r.secured ? { ...r, staticValue: "[secured]", secured: false } : r);
  if (format === "JSON") return JSON.stringify(rowsToPayload(displayRows), null, 2);
  if (format === "XML") {
    const parts = displayRows.map((r) => { const val = r.valueType === "dynamic" ? `{{${r.placeholderName.trim() || r.key.trim()}}}` : r.staticValue; return `  <${r.key.trim()}>${val}</${r.key.trim()}>`; });
    return `<request>\n${parts.join("\n")}\n</request>`;
  }
  return displayRows.map((r) => { const val = r.valueType === "dynamic" ? `{{${r.placeholderName.trim() || r.key.trim()}}}` : r.staticValue; return `${r.key.trim()}=${val}`; }).join("&\n");
};

// ─── Payload Builder ──────────────────────────────────────────────────────────

const PayloadBuilder = ({ rows, format, onChange, configLabel = "", step = 1, isHeader = false, canonicalFields }: { rows: PayloadRow[]; format: PayloadFormat; onChange: (rows: PayloadRow[]) => void; configLabel?: string; step?: 1 | 2; isHeader?: boolean; canonicalFields?: Record<string, string> }) => {
  const addRow = () => onChange([...rows, { ...EMPTY_ROW }]);
  const removeRow = (idx: number) => onChange(rows.filter((_, i) => i !== idx));
  const updateRow = (idx: number, patch: Partial<PayloadRow>) => onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const toggleSecured = (idx: number, r: PayloadRow) => {
    if (r.secured) {
      updateRow(idx, { secured: false });
    } else {
      updateRow(idx, { secured: true, valueType: "static", staticValue: "" });
    }
  };
  const preview = generatePreview(rows, format);
  const dynamicRows = rows.filter((r) => r.valueType === "dynamic" && (r.placeholderName.trim() || r.key.trim()));
  return (
    <Box sx={{ width: "100%" }}>
      {rows.length === 0 ? (
        <Box sx={{ p: 2.5, textAlign: "center", border: "1.5px dashed #d0d0d0", borderRadius: 1, bgcolor: "#fafafa", mb: 1.5 }}>
          <Typography variant="body2" sx={{ color: "#999" }}>No fields yet — click "Add Field" to build the payload.</Typography>
        </Box>
      ) : (
        <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, overflow: "auto", mb: 1.5, "& .MuiInputBase-input": { color: "#1a1a1a !important" }, "& .MuiSelect-select": { color: "#1a1a1a !important" } }}>
          <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: "22%" }}>Key (field name)</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: "14%" }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: "13%" }}>Data Type</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: "15%" }}>Date Format</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333" }}>Value / Placeholder</TableCell>
                <TableCell sx={{ width: 44 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#fafafa" }, verticalAlign: "middle" }}>
                  <TableCell>
                    <Tooltip title={r.key || ""} placement="top" disableHoverListener={r.key.length < 14}>
                      <TextField size="small" placeholder="e.g. policyNo" value={r.key}
                        onChange={(e) => { const newKey = e.target.value; updateRow(idx, { key: newKey, placeholderName: !canonicalFields && r.valueType === "dynamic" && (!r.placeholderName || r.placeholderName === r.key) ? newKey : r.placeholderName }); }}
                        sx={{ width: "100%" }} inputProps={{ style: { fontSize: "0.82rem" } }} />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <ToggleButtonGroup exclusive size="small" value={r.valueType}
                      onChange={(_, val) => {
                        if (!val) return;
                        const nextPlaceholder = val !== "dynamic" ? r.placeholderName
                          : canonicalFields ? "" : (!r.placeholderName ? r.key : r.placeholderName);
                        updateRow(idx, { valueType: val, placeholderName: nextPlaceholder });
                      }}>
                      <ToggleButton value="static" sx={{ textTransform: "none", fontSize: "0.7rem", px: 1.2, "&.Mui-selected": { bgcolor: "#e8f5e9", color: "#2e7d32" } }}>Static</ToggleButton>
                      <ToggleButton value="dynamic" sx={{ textTransform: "none", fontSize: "0.7rem", px: 1.2, "&.Mui-selected": { bgcolor: "#fff3e0", color: "#e65100" } }}>Dynamic</ToggleButton>
                    </ToggleButtonGroup>
                  </TableCell>
                  <TableCell>
                    <Autocomplete size="small" options={DATA_TYPES} disableClearable
                      value={DATA_TYPES.find((dt) => dt.value === r.dataType) ?? DATA_TYPES[0]}
                      onChange={(_, opt) => updateRow(idx, { dataType: opt.value as DataType })}
                      getOptionLabel={(o) => o.label} isOptionEqualToValue={(a, b) => a.value === b.value}
                      renderInput={(params) => <TextField {...params} size="small" />}
                      renderOption={(props, o) => <Box component="li" {...props} key={o.value}><span style={{ fontSize: "0.82rem", color: "#1a1a1a" }}>{o.label}</span></Box>} />
                  </TableCell>
                  <TableCell>
                    {r.dataType === "date" && r.valueType === "dynamic" ? (() => {
                      const knownOpt = DATE_FORMAT_OPTS.find((o) => o.value === r.dateFormat && o.value !== "__custom__" && o.value !== "");
                      const isCustom = r.dateFormat && !knownOpt;
                      const selectVal = isCustom ? "__custom__" : (r.dateFormat ?? "");
                      return (
                        <Box display="flex" flexDirection="column" gap={0.5}>
                          <TextField select size="small" value={selectVal} fullWidth
                            onChange={(e) => { const v = e.target.value; updateRow(idx, { dateFormat: v === "__custom__" ? "" : v }); }}
                            SelectProps={{ native: true }}>
                            {DATE_FORMAT_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </TextField>
                          {isCustom && (
                            <TextField size="small" placeholder="e.g. DD.MM.YYYY" value={r.dateFormat ?? ""}
                              onChange={(e) => updateRow(idx, { dateFormat: e.target.value })} fullWidth
                              inputProps={{ style: { fontFamily: "monospace", fontSize: "0.82rem" } }} />
                          )}
                        </Box>
                      );
                    })() : (
                      <Typography variant="body2" sx={{ color: "#ccc", fontSize: "0.75rem" }}>—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.valueType === "static" ? (
                      r.secured ? (
                        <Tooltip title={configLabel ? `Secret key: ${deriveEnvKey(configLabel, step as 1|2, r.key || "field", isHeader)}` : "Value stored in AWS Secrets Manager"}>
                          <Box display="flex" alignItems="center" gap={0.8} sx={{ color: "#7b1fa2", cursor: "default", userSelect: "none" }}>
                            <LockIcon sx={{ fontSize: "0.9rem" }} />
                            <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#7b1fa2", fontSize: "0.76rem" }}>secured</Typography>
                          </Box>
                        </Tooltip>
                      ) : (
                        <TextField size="small" placeholder={r.dataType === "boolean" ? "true or false" : r.dataType === "number" ? "e.g. 50000" : "Enter fixed value"}
                          value={r.staticValue} onChange={(e) => updateRow(idx, { staticValue: e.target.value })} sx={{ width: "100%" }} />
                      )
                    ) : (
                      <Box display="flex" alignItems="center" gap={1} overflow="hidden">
                        {canonicalFields ? (() => {
                          const known = r.placeholderName.trim() && !canonicalFields[r.placeholderName.trim()];
                          const options = known ? [r.placeholderName.trim(), ...Object.keys(canonicalFields)] : Object.keys(canonicalFields);
                          return (
                            <Autocomplete size="small" options={options} value={r.placeholderName || null}
                              onChange={(_, val) => updateRow(idx, { placeholderName: val ?? "" })}
                              getOptionLabel={(opt) => opt}
                              isOptionEqualToValue={(a, b) => a === b}
                              renderOption={(props, opt) => (
                                <Box component="li" {...props} key={opt} sx={{ flexDirection: "column", alignItems: "flex-start !important", py: "4px !important" }}>
                                  <span style={{ fontSize: "0.82rem", fontFamily: "monospace", color: "#1a1a1a" }}>{opt}</span>
                                  <span style={{ fontSize: "0.65rem", color: canonicalFields[opt] ? "#999" : "#c62828" }}>{canonicalFields[opt] ?? "Not in our fixed field list — call support if unsure"}</span>
                                </Box>
                              )}
                              renderInput={(params) => <TextField {...params} size="small" placeholder="Select field…" />}
                              sx={{ flex: 1, minWidth: 0 }} />
                          );
                        })() : (
                          <TextField size="small" placeholder={r.key || "e.g. policyNumber"}
                            value={r.placeholderName} onChange={(e) => updateRow(idx, { placeholderName: e.target.value })}
                            sx={{ flex: 1, minWidth: 0 }} />
                        )}
                        {(() => {
                          const name = r.placeholderName.trim() || (canonicalFields ? "" : r.key.trim() || "?");
                          const fmt = r.dataType === "date" && r.dateFormat && r.dateFormat !== "__custom__" && r.dateFormat.trim() ? `|date:${r.dateFormat.trim()}` : "";
                          const full = `{{${name}${fmt}}}`;
                          return (
                            <Tooltip title={full} placement="top">
                              <Box component="code" style={{ background: "#fff3e0", color: "#e65100", padding: "3px 7px", borderRadius: 3, fontFamily: "monospace", fontSize: "0.76rem", border: "1px solid #ffcc80", whiteSpace: "nowrap", flexShrink: 0, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", display: "block", cursor: "default" }}>
                                {full}
                              </Box>
                            </Tooltip>
                          );
                        })()}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title={r.secured ? "Unsecure — enter value directly" : "Secure — store in AWS Secrets Manager"}>
                      <IconButton size="small" onClick={() => toggleSecured(idx, r)}
                        sx={{ color: r.secured ? "#7b1fa2" : "#bdbdbd", "&:hover": { color: "#7b1fa2" } }}>
                        {r.secured ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove"><IconButton size="small" color="error" onClick={() => removeRow(idx)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
      <Button size="small" startIcon={<AddIcon />} onClick={addRow} sx={{ textTransform: "none", mb: 2 }}>Add Field</Button>
      {rows.filter((r) => r.key.trim()).length > 0 && (
        <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, overflow: "hidden" }}>
          <Box sx={{ px: 1.5, py: 0.8, bgcolor: "#f5f5f5", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: "#555" }}>Preview</Typography>
            {dynamicRows.length > 0 && (
              <Box display="flex" gap={0.5} flexWrap="wrap" alignItems="center">
                <Typography variant="caption" sx={{ color: "#888" }}>Dynamic fields:</Typography>
                {dynamicRows.map((r) => { const name = r.placeholderName.trim() || r.key.trim(); return <Box key={name} component="code" style={{ background: "#fff3e0", color: "#e65100", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace", fontSize: "0.71rem", border: "1px solid #ffcc80" }}>{`{{${name}}}`}</Box>; })}
              </Box>
            )}
          </Box>
          <pre style={{ margin: 0, padding: "10px 14px", fontSize: "0.78rem", fontFamily: "monospace", background: "#1a1a2e", color: "#a8d8a8", overflowX: "auto", minHeight: 60, lineHeight: 1.6 }}>{preview || "(empty)"}</pre>
        </Box>
      )}
    </Box>
  );
};

// cURL parsing (parseCurl / ParsedCurl) now lives in @ui/ui-lib (curlParser.util.ts) —
// shared with the SSO "Remote API" config section, which needs the same paste-a-cURL
// prefill behavior.
// ─── cURL Parser ─────────────────────────────────────────────────────────────

interface ParsedCurl {
  method: string; url: string;
  headers: Record<string, string>;
  bodyJson: Record<string, any> | null;
  bodyRaw: string;
  authType: string;
  payloadFormat: PayloadFormat;
  basicAuthUser: string;
  basicAuthPassword: string;
  queryParams: Record<string, string> | null;
  tokenHeaderPrefix: string;
}

const parseCurl = (raw: string): ParsedCurl => {
  const s = raw.replace(/\\\s*\n\s*/g, " ").trim();

  // Method — supports both -X and --request. Matches real curl's own default:
  // GET unless a body flag is present (--data/-d/--body implicitly means POST),
  // in which case fall back to POST only when no explicit method was given.
  const methodMatch = s.match(/(?:-X|--request)\s+['"]?(\w+)['"]?/i);
  const hasBodyFlag = /(?:--data(?:-raw|-binary|-urlencode)?|-d|--body)\s+/.test(s);
  const method = (methodMatch?.[1]?.toUpperCase() ?? (hasBodyFlag ? "POST" : "GET")) as string;

  // URL — first https?:// value (handles --location too)
  const urlMatch = s.match(/(https?:\/\/[^\s'"\\]+)/i);
  const fullUrl = (urlMatch?.[1] ?? "").replace(/['"]/g, "").replace(/\/$/, "");

  // Query string → separate Payload Fields (same treatment as a POST body) instead
  // of leaving them baked into a static URL string — a GET call's query params are
  // its actual inputs, and need to be editable/placeholder-able like any other field.
  const qIdx = fullUrl.indexOf("?");
  const url = qIdx >= 0 ? fullUrl.slice(0, qIdx) : fullUrl;
  let queryParams: Record<string, string> | null = null;
  if (qIdx >= 0) {
    const qs = new URLSearchParams(fullUrl.slice(qIdx + 1));
    const obj: Record<string, string> = {};
    qs.forEach((v, k) => { obj[k] = v; });
    if (Object.keys(obj).length > 0) queryParams = obj;
  }

  // Headers — supports both -H and --header
  const headers: Record<string, string> = {};
  const hRe = /(?:-H|--header)\s+(['"])(.*?)\1/g;
  let hm: RegExpExecArray | null;
  while ((hm = hRe.exec(s)) !== null) {
    const colon = hm[2].indexOf(":");
    if (colon > 0) {
      headers[hm[2].slice(0, colon).trim()] = hm[2].slice(colon + 1).trim();
    }
  }

  // Body — supports --data, --data-raw, --data-binary, --data-urlencode, -d, --body
  // (--body isn't real curl, but several TPAs' shared "postman request" docs use it in
  // place of --data/-d — must stay recognized or the body silently parses to nothing
  // while URL/Method still look fine, which reads as "half worked" not "unsupported flag")
  // Collect ALL --data-* args (FHPL sends multiple --data-urlencode lines) and join with &
  const bodyRe = /(?:--data(?:-raw|-binary|-urlencode)?|-d|--body)\s+(['"])([\s\S]*?)\1/g;
  let bm: RegExpExecArray | null;
  const bodyParts: string[] = [];
  while ((bm = bodyRe.exec(s)) !== null) {
    bodyParts.push(bm[2]);
  }
  const bodyRaw = bodyParts.join("&").replace(/\\n/g, "\n").replace(/\\'/g, "'").replace(/\\"/g, '"');
  let bodyJson: Record<string, any> | null = null;
  if (bodyRaw.trim().startsWith("{")) {
    try { bodyJson = JSON.parse(bodyRaw); } catch {}
  } else if (bodyRaw.trim() && !bodyRaw.trim().startsWith("<")) {
    // form-urlencoded: key=value&key2=value2
    try {
      const params = new URLSearchParams(bodyRaw);
      const obj: Record<string, string> = {};
      params.forEach((v, k) => { obj[k] = v; });
      if (Object.keys(obj).length > 0) bodyJson = obj;
    } catch {}
  }

  // Basic auth — supports -u and --user
  const basicMatch = s.match(/(?:-u|--user)\s+(['"]?)([^:'"\\s]+):([^'"\\s]+)\1/);

  const authHeader = headers["Authorization"] ?? headers["authorization"] ?? "";
  let authType = "DIRECT";
  let basicAuthUser = "";
  let basicAuthPassword = "";

  // -u / --user flag always means 2-step BASIC_AUTH (credentials for token endpoint)
  if (basicMatch) {
    authType = "BASIC_AUTH"; basicAuthUser = basicMatch[2]; basicAuthPassword = basicMatch[3];
  } else if (authHeader.startsWith("Basic ")) {
    // If the URL path looks like a token/JWT generation endpoint the Basic header IS the Step 1 credential.
    // Decode base64 user:pass and treat as BASIC_AUTH (2-step: this cURL is Step 1).
    // Otherwise it's a data endpoint with a static credential → DIRECT (Authorization stays as header).
    const isAuthEndpointUrl = /\/(auth|login|token|generate[_-]?token|jwt|generate.*jwt|.*jwt.*auth|get[_-]?token|oauth|credentials?|signin|sign[_-]in|validate|session|access)[^/]*/i.test(url);
    if (isAuthEndpointUrl) {
      authType = "BASIC_AUTH";
      try {
        const decoded = atob(authHeader.slice(6).trim());
        const colonIdx = decoded.indexOf(":");
        basicAuthUser = colonIdx > 0 ? decoded.slice(0, colonIdx) : decoded;
        basicAuthPassword = colonIdx > 0 ? decoded.slice(colonIdx + 1) : "";
      } catch {}
    } else {
      authType = "DIRECT"; // static header on a data endpoint — keep as-is
    }
  } else if (authHeader.startsWith("Bearer ")) {
    // Static Bearer token in a single cURL = SESSION type (Step 1 fetches the real token)
    authType = "SESSION";
  } else if (authHeader) {
    authType = "SESSION";
  }

  // Capture the actual prefix word used in the Authorization header (e.g. "Bearer",
  // "Token", "JWT") — some TPAs use a non-standard word instead of "Bearer". Only
  // meaningful for SESSION/DIRECT (Basic already has its own dedicated handling).
  const tokenHeaderPrefix = authHeader && !authHeader.startsWith("Basic ")
    ? (authHeader.split(" ")[0] || "Bearer")
    : "Bearer";

  // Heuristic: URL path looks like an auth/login endpoint AND body contains credential fields
  // → treat as SESSION (Step 1 credential-submission endpoint that returns a token)
  if (authType === "DIRECT" && url) {
    const urlHasAuthPath = /\/(auth|login|token|generate[_-]?token|jwt|generate.*jwt|.*jwt.*auth|get[_-]?token|credentials?|signin|sign[_-]in|oauth|validate|session|access)[^/]*/i.test(url);
    const bodyHasCredKeys = bodyJson != null && Object.keys(bodyJson).some((k) =>
      /^(password|passwd|username|userName|secret|encryptedKey|encrptedKey|apikey|api_key|passphrase)$/i.test(k),
    );
    if (urlHasAuthPath && bodyHasCredKeys) authType = "SESSION";
  }

  // Remove content-type (handled by payloadFormat field)
  // Keep Authorization header if DIRECT — admin needs to see it as a static header
  const ctKey = Object.keys(headers).find((k) => k.toLowerCase() === "content-type") ?? "";
  const ctVal = ctKey ? headers[ctKey] : "";
  const authKey = Object.keys(headers).find((k) => k.toLowerCase() === "authorization") ?? "";
  if (ctKey) delete headers[ctKey];
  // Only remove Authorization if we're handling it via auth config (SESSION/BASIC_AUTH)
  if (authKey && authType !== "DIRECT") delete headers[authKey];

  let payloadFormat: PayloadFormat = "JSON";
  if (ctVal.includes("xml")) payloadFormat = "XML";
  else if (ctVal.includes("form-urlencoded")) payloadFormat = "FORM";

  return { method, url, headers, bodyJson, bodyRaw, authType, payloadFormat, basicAuthUser, basicAuthPassword, queryParams, tokenHeaderPrefix };
};

// ─── Collapsible Section ──────────────────────────────────────────────────────

// Accent color per section — derived from title keywords
const getSectionAccent = (title: string): string => {
  const t = title.toLowerCase();
  if (t.includes("feature")) return "#7c4dff";
  if (t.includes("basic")) return "#1976d2";
  if (t.includes("step 1") || t.includes("auth")) return "#f57c00";
  if (t.includes("step 2") || t.includes("api call")) return "#0288d1";
  if (t.includes("field mapping") || t.includes("default field")) return "#00897b";
  if (t.includes("test")) return "#2e7d32";
  if (t.includes("response")) return "#c62828";
  return "#5c6bc0";
};

const CollapsibleSection = ({ title, children, defaultOpen = false, badge, action, open: openProp, onToggle }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode;
  action?: React.ReactNode; open?: boolean; onToggle?: () => void;
}) => {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = openProp !== undefined ? openProp : localOpen;
  const toggle = () => { if (onToggle) onToggle(); else setLocalOpen((v) => !v); };
  const accent = getSectionAccent(title);

  return (
    <Box sx={{
      borderRadius: 2.5, mb: 3, bgcolor: "#fff",
      boxShadow: open
        ? `0 4px 20px rgba(0,0,0,0.07), 0 0 0 1.5px ${accent}33`
        : "0 1px 6px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06)",
      transition: "box-shadow 0.25s ease",
      overflow: "hidden",
    }}>
      {/* Header */}
      <Box sx={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        px: 3, py: 1.8,
        background: open
          ? `linear-gradient(90deg, ${accent}12 0%, #fff 60%)`
          : "linear-gradient(90deg, #f8f9fb 0%, #fff 60%)",
        borderLeft: `4px solid ${accent}`,
        borderBottom: open ? `1px solid ${accent}22` : "none",
        transition: "background 0.2s ease",
      }}>
        <Box onClick={toggle} display="flex" alignItems="center" gap={1.5}
          sx={{ cursor: "pointer", flex: 1, userSelect: "none" }}>
          <Typography variant="subtitle1" fontWeight={700}
            sx={{ color: open ? accent : "#2d3748", fontSize: "0.92rem", transition: "color 0.2s" }}>
            {title}
          </Typography>
          {badge}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          {action}
          <Box onClick={toggle} sx={{ cursor: "pointer", display: "flex", alignItems: "center", p: 0.5, borderRadius: 1, "&:hover": { bgcolor: `${accent}14` } }}>
            <ExpandMoreIcon sx={{
              color: open ? accent : "#aaa",
              transition: "transform 0.25s, color 0.2s",
              transform: open ? "rotate(180deg)" : "none",
              fontSize: 22,
            }} />
          </Box>
        </Box>
      </Box>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ p: 4, display: "flex", flexWrap: "wrap", gap: "24px 40px", alignItems: "flex-start", alignContent: "flex-start" }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};

// ─── Inline cURL paste (per-step, compact) ────────────────────────────────────

type CurlStatus = { ok: boolean; msg: string; chips?: string[]; routedToStep1?: boolean; basicAuthDecoded?: { user: string; pass: string } } | null;

const CURL_PLACEHOLDER = `curl -X POST 'https://api.tpa.com/v1/data' \\
  -H 'Content-Type: application/json' \\
  -d '{"policyNo":"POL001"}'`;

const AUTH_URL_RE = /\/(auth|login|token|generate[_-]?token|jwt|generate.*jwt|.*jwt.*auth|get[_-]?token|credentials?|signin|sign[_-]in|oauth|validate)[^/]*/i;

const InlineCurlPaste = ({ label, onApply, onClose, step }: {
  label: string;
  onApply: (p: ParsedCurl) => void;
  onClose: () => void;
  step?: 1 | 2;
}) => {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<CurlStatus>(null);

  const tryApply = (raw: string) => {
    try {
      const p = parseCurl(raw);
      if (!p.url) { setStatus({ ok: false, msg: "No URL found — paste a complete cURL command." }); return; }
      onApply(p);
      const h = Object.keys(p.headers).length;
      const f = p.bodyJson ? Object.keys(p.bodyJson).length : 0;
      const parts: string[] = [p.method, p.authType, p.payloadFormat];
      if (h > 0) parts.push(`${h} header${h > 1 ? "s" : ""}`);
      if (f > 0) parts.push(`${f} field${f > 1 ? "s" : ""}`);
      const routedToStep1 = step === 2 && (p.authType === "SESSION" || p.authType === "BASIC_AUTH") && AUTH_URL_RE.test(p.url);
      const basicAuthDecoded = p.basicAuthUser ? { user: p.basicAuthUser, pass: p.basicAuthPassword } : undefined;
      setStatus({ ok: true, msg: p.url, chips: parts, routedToStep1, basicAuthDecoded });
    } catch (err: any) {
      setStatus({ ok: false, msg: err?.message ?? "Parse failed." });
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const raw = e.clipboardData.getData("text");
    if (!raw.trim()) return;
    e.preventDefault();
    setText(raw);
    tryApply(raw);
  };

  return (
    <Box sx={{
      width: "100%", mb: 2.5,
      borderRadius: 2,
      border: "1.5px solid",
      borderColor: status?.ok ? "#c8e6c9" : "#e8e0ff",
      bgcolor: "#fafafa",
      overflow: "hidden",
      boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#f3f0ff", borderBottom: "1px solid #ede7f6" }}>
        <Box display="flex" alignItems="center" gap={0.8}>
          <ContentPasteIcon sx={{ fontSize: 14, color: "#7e57c2" }} />
          <Typography variant="caption" fontWeight={700} sx={{ color: "#4527a0" }}>
            {label}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ p: 0.3, color: "#9e9e9e", "&:hover": { color: "#333" } }}>
          <CloseIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>

      {/* Code textarea */}
      <Box sx={{ p: 1.5 }}>
        <TextField
          multiline rows={3} fullWidth size="small"
          placeholder={CURL_PLACEHOLDER}
          value={text}
          onChange={(e) => { setText(e.target.value); setStatus(null); }}
          onPaste={handlePaste}
          sx={{
            "& .MuiOutlinedInput-root": {
              background: "#1e1e2e",
              borderRadius: 1.5,
              "& fieldset": { borderColor: "#393952" },
              "&:hover fieldset": { borderColor: "#7e57c2" },
              "&.Mui-focused fieldset": { borderColor: "#7e57c2" },
            },
            "& .MuiInputBase-input": {
              fontFamily: "'Fira Code', 'Courier New', monospace",
              fontSize: "0.76rem", color: "#cdd6f4", lineHeight: 1.8,
              "&::placeholder": { color: "#45475a", opacity: 1 },
            },
          }}
        />

        {/* Status */}
        {status && (
          <Box mt={0.8}>
            {status.ok ? (
              <>
                <Box display="flex" alignItems="center" gap={0.6} flexWrap="wrap">
                  <CheckCircleOutlineIcon sx={{ fontSize: 14, color: "#43a047" }} />
                  <Typography variant="caption" sx={{ color: "#2e7d32", fontWeight: 700, mr: 0.5 }}>Applied</Typography>
                  {(status.chips ?? []).map((c) => (
                    <Chip key={c} label={c} size="small" sx={{ fontSize: "0.66rem", height: 20, bgcolor: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9" }} />
                  ))}
                </Box>
                {status.routedToStep1 && (
                  <Box display="flex" alignItems="center" gap={0.5} mt={0.5} sx={{ bgcolor: "#fff8e1", borderRadius: 1, px: 1, py: 0.3, border: "1px solid #ffe082" }}>
                    <Typography variant="caption" sx={{ color: "#e65100", fontWeight: 700, fontSize: "0.7rem" }}>
                      Auth endpoint detected → applied to Step 1
                    </Typography>
                  </Box>
                )}
                {status.basicAuthDecoded && (
                  <Box display="flex" alignItems="center" gap={0.5} mt={0.5} sx={{ bgcolor: "#fff8e1", borderRadius: 1, px: 1, py: 0.3, border: "1px solid #ffe082" }}>
                    <Typography variant="caption" sx={{ color: "#e65100", fontWeight: 700, fontSize: "0.7rem" }}>
                      Basic Auth decoded → click 🔓 to secure as env ref
                    </Typography>
                  </Box>
                )}
                {status.msg && <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#1565c0", fontFamily: "monospace", fontSize: "0.71rem", wordBreak: "break-all" }}>{status.msg}</Typography>}
              </>
            ) : (
              <Box display="flex" alignItems="center" gap={0.8}>
                <ErrorOutlineIcon sx={{ fontSize: 14, color: "#e53935" }} />
                <Typography variant="caption" sx={{ color: "#c62828" }}>{status.msg}</Typography>
              </Box>
            )}
          </Box>
        )}
        {!status && (
          <Typography variant="caption" sx={{ display: "block", mt: 0.6, color: "#9575cd", fontSize: "0.7rem" }}>
            Paste your cURL — fields auto-fill instantly
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// ─── Smart cURL Import (side-by-side, kept for future reference) ─────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SmartCurlImport = ({ onApplyStep, onClose }: {
  onApplyStep: (p: ParsedCurl, step: 1 | 2, applyAuth?: boolean) => void;
  onClose: () => void;
}) => {
  const [step2Text, setStep2Text] = useState("");
  const [step2Status, setStep2Status] = useState<{ ok: boolean; msg: string; chips?: string[]; url?: string } | null>(null);
  const [step1Text, setStep1Text] = useState("");
  const [step1Status, setStep1Status] = useState<{ ok: boolean; msg: string; chips?: string[]; url?: string } | null>(null);

  const summarise = (p: ParsedCurl) => {
    const h = Object.keys(p.headers).length;
    const f = p.bodyJson ? Object.keys(p.bodyJson).length : 0;
    const parts: string[] = [p.method, p.authType, p.payloadFormat];
    if (h > 0) parts.push(`${h} header${h > 1 ? "s" : ""}`);
    if (f > 0) parts.push(`${f} field${f > 1 ? "s" : ""}`);
    return { chips: parts, url: p.url };
  };

  const renderStatus = (st: typeof step2Status) => {
    if (!st) return null;
    return (
      <Box mt={1}>
        {st.ok ? (
          <>
            <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
              <CheckCircleOutlineIcon sx={{ fontSize: 13, color: "#43a047" }} />
              <Typography variant="caption" sx={{ color: "#2e7d32", fontWeight: 700 }}>Applied</Typography>
              {(st.chips ?? []).map((c) => (
                <Chip key={c} label={c} size="small" sx={{ fontSize: "0.64rem", height: 19, bgcolor: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9" }} />
              ))}
            </Box>
            {st.url && <Typography variant="caption" sx={{ display: "block", mt: 0.4, color: "#1565c0", fontFamily: "monospace", fontSize: "0.7rem", wordBreak: "break-all" }}>{st.url}</Typography>}
          </>
        ) : (
          <Box display="flex" alignItems="center" gap={0.6}>
            <ErrorOutlineIcon sx={{ fontSize: 13, color: "#e53935" }} />
            <Typography variant="caption" sx={{ color: "#c62828" }}>{st.msg}</Typography>
          </Box>
        )}
      </Box>
    );
  };

  const mkPasteHandler = (step: 1 | 2) => (e: React.ClipboardEvent) => {
    const raw = e.clipboardData.getData("text");
    if (!raw.trim()) return;
    e.preventDefault();
    if (step === 2) { setStep2Text(raw); setStep2Status(null); }
    else { setStep1Text(raw); setStep1Status(null); }
    try {
      const p = parseCurl(raw);
      if (!p.url) {
        const st = { ok: false, msg: "No URL found — paste a complete cURL command.", url: undefined, chips: undefined };
        if (step === 2) setStep2Status(st); else setStep1Status(st);
        return;
      }
      onApplyStep(p, step, step === 2);
      const s = summarise(p);
      const st = { ok: true, msg: "", chips: s.chips, url: s.url };
      if (step === 2) setStep2Status(st); else setStep1Status(st);
    } catch (err: any) {
      const st = { ok: false, msg: err?.message ?? "Parse failed.", url: undefined, chips: undefined };
      if (step === 2) setStep2Status(st); else setStep1Status(st);
    }
  };

  const CODE_FIELD_SX = (accent: string, okStatus: boolean) => ({
    "& .MuiOutlinedInput-root": {
      background: "#1e1e2e", borderRadius: 1.5,
      "& fieldset": { borderColor: okStatus ? "#a5d6a7" : "#393952" },
      "&:hover fieldset": { borderColor: accent },
      "&.Mui-focused fieldset": { borderColor: accent },
    },
    "& .MuiInputBase-input": {
      fontFamily: "'Fira Code', 'Courier New', monospace",
      fontSize: "0.75rem", color: "#cdd6f4", lineHeight: 1.8,
      "&::placeholder": { color: "#45475a", opacity: 1 },
    },
  });

  return (
    <Box sx={{
      mb: 3, borderRadius: 2,
      border: "1.5px solid #ede7f6",
      bgcolor: "#fff",
      boxShadow: "0 2px 12px rgba(126,87,194,0.08)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#f3f0ff", borderBottom: "1px solid #ede7f6" }}>
        <Box display="flex" alignItems="center" gap={1}>
          <ContentPasteIcon sx={{ fontSize: 16, color: "#7e57c2" }} />
          <Typography variant="body2" fontWeight={700} sx={{ color: "#4527a0" }}>Import from cURL</Typography>
          <Typography variant="caption" sx={{ color: "#9575cd" }}>— paste in the relevant box below, fields auto-fill instantly</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9e9e9e", "&:hover": { color: "#333" } }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Two columns */}
      <Box sx={{ p: 2.5, display: "flex", gap: 2.5 }}>
        {/* Step 1 — Auth */}
        <Box sx={{ flex: 1, borderRight: "1px solid #f3e5f5", pr: 2.5 }}>
          <Box display="flex" alignItems="center" gap={0.8} mb={1}>
            <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: "#fff8e1", border: "1px solid #ffe082", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Typography variant="caption" sx={{ color: "#f57f17", fontWeight: 700, fontSize: "0.68rem" }}>1</Typography>
            </Box>
            <Typography variant="caption" fontWeight={700} sx={{ color: "#bf360c" }}>Auth Endpoint</Typography>
            <Typography variant="caption" sx={{ color: "#bdbdbd", fontSize: "0.68rem" }}>SESSION / BASIC_AUTH only</Typography>
          </Box>
          <TextField
            multiline rows={4} fullWidth size="small"
            placeholder={`curl -X POST 'https://api.tpa.com/auth/token' \\\n  -u 'client_id:secret'\n\n(skip if auth type is DIRECT)`}
            value={step1Text}
            onChange={(e) => { setStep1Text(e.target.value); setStep1Status(null); }}
            onPaste={mkPasteHandler(1)}
            sx={CODE_FIELD_SX("#f57f17", Boolean(step1Status?.ok))}
          />
          {renderStatus(step1Status)}
          {!step1Status && <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#bdbdbd", fontSize: "0.68rem" }}>Skip for DIRECT auth</Typography>}
        </Box>

        {/* Step 2 — Main API */}
        <Box sx={{ flex: 1 }}>
          <Box display="flex" alignItems="center" gap={0.8} mb={1}>
            <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: "#ede7f6", border: "1px solid #d1c4e9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Typography variant="caption" sx={{ color: "#7e57c2", fontWeight: 700, fontSize: "0.68rem" }}>2</Typography>
            </Box>
            <Typography variant="caption" fontWeight={700} sx={{ color: "#4527a0" }}>Main API</Typography>
            <Typography variant="caption" sx={{ color: "#bdbdbd", fontSize: "0.68rem" }}>always required</Typography>
          </Box>
          <TextField
            multiline rows={4} fullWidth size="small"
            placeholder={CURL_PLACEHOLDER}
            value={step2Text}
            onChange={(e) => { setStep2Text(e.target.value); setStep2Status(null); }}
            onPaste={mkPasteHandler(2)}
            sx={CODE_FIELD_SX("#7e57c2", Boolean(step2Status?.ok))}
          />
          {renderStatus(step2Status)}
          {!step2Status && <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: "#bdbdbd", fontSize: "0.68rem" }}>Auth type is auto-detected from this cURL</Typography>}
        </Box>
      </Box>
    </Box>
  );
};

// ─── SSO (TPA Portal Login) — a completely different config shape ────────────
// Selecting "TPA Portal Login" as the Feature Type swaps out every AppRef/API-call
// section below (Basic Details, Step 1, Step 2/API Call, Field Mappings, Response
// Mappings, Test) for these instead — this feature type has no API to call at all,
// it's driven by tpa_sso_config / tpa_sso_field_mapping, not mstr_ext_application_ref.
// No AppRef is created for it; only a tpa_external_feature_config + tpa_sso_config row.

// STATIC | POLICY | EMPLOYEE (fast-path, always available) | any real table name
// (resolved generically — one join hop from employee/policy, see
// generic-field-resolver.util.ts on the backend).
type SsoSourceType = string;
type SsoKeyEncoding = "utf8" | "base64";
type SsoPadding = "PKCS7" | "ISO10126";
type SsoIvMode = "FIXED" | "KEY_AS_IV" | "RANDOM_EMBEDDED";
type SsoTextEncoding = "utf8" | "utf16le";
type SsoTokenShape = "SEPARATE_FIELDS" | "COMBINED_JSON";
// LOCAL_REDIRECT — we build the whole redirect URL ourselves (GHPL, FHPL, HITPA).
// REMOTE_API_REDIRECT — we still encrypt the data ourselves, but POST it to the
// TPA's own SSO API and get the real redirect link back in their (encrypted) reply.
type SsoDeliveryMode = "LOCAL_REDIRECT" | "REMOTE_API_REDIRECT";

interface SsoFieldMappingRow {
  id?: number;
  externalFieldName: string;
  sourceType: SsoSourceType;
  sourceField: string | null;
  staticValue: string | null;
}

interface SsoFormState {
  ssoDeliveryMode: SsoDeliveryMode;
  portalUrl: string;
  ssoKeyEnvName: string;
  ssoIvEnvName: string;
  ssoKeyEncoding: SsoKeyEncoding;
  ssoPadding: SsoPadding;
  ssoIvMode: SsoIvMode;
  ssoTextEncoding: SsoTextEncoding;
  ssoTokenShape: SsoTokenShape;
  ssoTokenParamName: string;
  ssoIvEnvelopeSeparator: string;
  ssoUrlEncode: boolean;
  outputTransformRows: { from: string; to: string }[];
  fieldMappings: SsoFieldMappingRow[];
  // REMOTE_API_REDIRECT only — the TPA's own SSO API and how to read their reply.
  remoteApiUrl: string;
  remoteApiMethod: string;
  remoteApiHeaderRows: { key: string; value: string }[];
  remoteRequestPayloadKey: string;
  remoteRequestExtraFieldRows: { key: string; value: string }[];
  remoteResponseDataPath: string;
  remoteResponseDecryptKeyEnvName: string;
  remoteResponseRedirectUrlPath: string;
}

const SSO_FEATURE_KEY = "TPA_PORTAL_LOGIN";
const CLAIM_SUBMISSION_FEATURE_KEY = "CLAIM_SUBMISSION";

// Fast-path fields that need no DB round trip — already loaded for every SSO
// call. Anything else is resolved generically from the real table/column
// picked below (same schema browser as the Field Mappings section elsewhere).
const SSO_FAST_PATH_FIELDS: Record<string, { value: string; label: string }> = {
  POLICY: { value: "externalTpaPolicyId", label: "External TPA Policy ID" },
  EMPLOYEE: { value: "companyEmployeeId", label: "Company Employee ID" },
};
const buildSsoSourceOptions = (schema: DbTableSchema[]): TableSelectOpt[] => [
  { value: "STATIC", label: "Fixed value", group: "Special", color: "#f57c00", mono: false },
  { value: "POLICY", label: "Policy → External TPA Policy ID (fast)", group: "Special", color: CATEGORY_META.POLICY.color, mono: false },
  { value: "EMPLOYEE", label: "Employee → Company Employee ID (fast)", group: "Special", color: CATEGORY_META.EMPLOYEE.color, mono: false },
  ...schema.map((t) => ({ value: t.tableName, label: t.tableName, group: CATEGORY_META[t.category]?.label ?? "Other", color: CATEGORY_META[t.category]?.color ?? "#999", mono: true })),
];
const SSO_KEY_ENCODING_OPTS: { value: SsoKeyEncoding; label: string; hint: string }[] = [
  { value: "utf8", label: "Plain text (utf8)", hint: "Most TPAs — GHPL, FHPL, HITPA" },
  { value: "base64", label: "Base64-encoded", hint: "Vidal — key string is base64, decode before use" },
];
const SSO_PADDING_OPTS: { value: SsoPadding; label: string; hint: string }[] = [
  { value: "PKCS7", label: "PKCS7 (standard)", hint: "Node's default — GHPL, Vidal" },
  { value: "ISO10126", label: "ISO10126", hint: ".NET TPAs that specifically require it — FHPL, HITPA" },
];
const SSO_IV_MODE_OPTS: { value: SsoIvMode; label: string; hint: string }[] = [
  { value: "FIXED", label: "Fixed IV (own value)", hint: "TPA gave a separate, fixed IV — GHPL, HITPA" },
  { value: "KEY_AS_IV", label: "IV = Key", hint: "No separate IV — first 16 bytes of the key are reused — FHPL" },
  { value: "RANDOM_EMBEDDED", label: "Random per request", hint: "Fresh random IV each time, sent along with the ciphertext — Vidal" },
];
const SSO_TEXT_ENCODING_OPTS: { value: SsoTextEncoding; label: string; hint: string }[] = [
  { value: "utf8", label: "UTF-8", hint: "GHPL, Vidal" },
  { value: "utf16le", label: "UTF-16LE (.NET \"Unicode\")", hint: "FHPL, HITPA" },
];
// Plain-language shape choice — an admin working from a TPA's doc just needs to look at
// the URL that TPA gave them and pick whichever example this matches, no jargon required.
const SSO_TOKEN_SHAPE_CARDS: { value: SsoTokenShape; label: string; description: string; example: string }[] = [
  {
    value: "SEPARATE_FIELDS",
    label: "Each value encrypted separately",
    description: "The most common pattern — every piece of data gets its own encrypted value in the link.",
    example: "...?partnerId={A}&employeeId={B}",
  },
  {
    value: "COMBINED_JSON",
    label: "Everything combined into one value",
    description: "All the data is bundled together first, then encrypted once into a single value.",
    example: "...?token={COMBINED}",
  },
];
// Plain-language delivery-mode choice — most TPAs want the left card. The right one only
// applies when the TPA's own doc describes an API you call, not just a URL you build.
const SSO_DELIVERY_MODE_CARDS: { value: SsoDeliveryMode; label: string; description: string; example: string }[] = [
  {
    value: "LOCAL_REDIRECT",
    label: "We build the link ourselves",
    description: "The most common pattern — we encrypt the data and put it straight into the portal URL.",
    example: "https://tpa-portal.com/sso?token=ENCRYPTED",
  },
  {
    value: "REMOTE_API_REDIRECT",
    label: "We ask their API for the link",
    description: "We send the TPA our encrypted data via their API — they reply with their own encrypted answer, which we decrypt to get the real link.",
    example: "POST → TPA's API → they reply (encrypted) → we decrypt → redirectUrl",
  },
];

const EMPTY_SSO_FORM: SsoFormState = {
  ssoDeliveryMode: "LOCAL_REDIRECT",
  portalUrl: "", ssoKeyEnvName: "", ssoIvEnvName: "",
  ssoKeyEncoding: "utf8", ssoPadding: "PKCS7", ssoIvMode: "FIXED", ssoTextEncoding: "utf8",
  ssoTokenShape: "SEPARATE_FIELDS", ssoTokenParamName: "", ssoIvEnvelopeSeparator: ":",
  ssoUrlEncode: true,
  outputTransformRows: [], fieldMappings: [],
  remoteApiUrl: "", remoteApiMethod: "POST", remoteApiHeaderRows: [],
  remoteRequestPayloadKey: "payload", remoteRequestExtraFieldRows: [],
  remoteResponseDataPath: "data", remoteResponseDecryptKeyEnvName: "", remoteResponseRedirectUrlPath: "redirectUrl",
};

// Suggests an env var name from the TPA's display name — a starting point only;
// admin can shorten/edit it. Whatever ends up saved must be shared verbatim with IT.
const suggestSsoEnvName = (tpaName: string, suffix: "KEY" | "IV"): string => {
  const norm = tpaName.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").toUpperCase();
  return `${norm || "TPA"}_WEB_SSO_${suffix}`;
};
const ssoObjectToRows = (obj: Record<string, string> | null | undefined): { from: string; to: string }[] =>
  obj ? Object.entries(obj).map(([from, to]) => ({ from, to: String(to) })) : [];
const ssoRowsToObject = (rows: { from: string; to: string }[]): Record<string, string> | null => {
  const entries = rows.filter((r) => r.from.trim()).map((r) => [r.from, r.to] as const);
  return entries.length ? Object.fromEntries(entries) : null;
};

// Same shape as above, generic key/value naming — used for the remote-API headers and
// "other fields to send alongside it" tables (Vidal's constant source/subPartnerId, etc).
const kvObjectToRows = (obj: Record<string, string> | null | undefined): { key: string; value: string }[] =>
  obj ? Object.entries(obj).map(([key, value]) => ({ key, value: String(value) })) : [];
const kvRowsToObject = (rows: { key: string; value: string }[]): Record<string, string> | null => {
  const entries = rows.filter((r) => r.key.trim()).map((r) => [r.key, r.value] as const);
  return entries.length ? Object.fromEntries(entries) : null;
};

// Describes where a field's plaintext comes from, for the live "shape" preview below
// (no real values, no API call — just so the admin can see how the pieces fit together
// as they build the config, before it's even saved).
const describeSsoSource = (m: { sourceType: string; sourceField: string | null; staticValue: string | null }): string => {
  if (m.sourceType === "STATIC") return `"${m.staticValue || ""}"`;
  if (m.sourceType === "POLICY" || m.sourceType === "EMPLOYEE") {
    return SSO_FAST_PATH_FIELDS[m.sourceType]?.label ?? m.sourceType;
  }
  return `${m.sourceType}.${m.sourceField ?? "?"}`;
};

const buildSsoUrlShapePreview = (form: SsoFormState): string => {
  const base = form.portalUrl.trim() || "https://…";
  const sep = base.includes("?") ? "&" : "?";
  if (form.ssoTokenShape === "COMBINED_JSON") {
    const payloadDesc = form.fieldMappings
      .map((m) => `"${m.externalFieldName || "?"}": ${describeSsoSource(m)}`)
      .join(", ");
    return `${base}${sep}${form.ssoTokenParamName || "token"}=encrypted({ ${payloadDesc} })`;
  }
  const params = form.fieldMappings
    .map((m) => `${m.externalFieldName || "?"}=encrypted(${describeSsoSource(m)})`)
    .join("&");
  return `${base}${sep}${params}`;
};

// REMOTE_API_REDIRECT shape preview — there's no local URL to show, so this shows the
// request we'll send instead, plus how we'll read their reply.
const buildSsoRemoteApiShapePreview = (form: SsoFormState): string => {
  const payloadDesc = form.fieldMappings
    .map((m) => `"${m.externalFieldName || "?"}": ${describeSsoSource(m)}`)
    .join(", ");
  const extraDesc = form.remoteRequestExtraFieldRows
    .filter((r) => r.key.trim())
    .map((r) => `"${r.key}": "${r.value}"`)
    .join(", ");
  const bodyParts = [`"${form.remoteRequestPayloadKey.trim() || "payload"}": encrypted({ ${payloadDesc} })`, extraDesc].filter(Boolean).join(", ");
  const method = form.remoteApiMethod || "POST";
  const url = form.remoteApiUrl.trim() || "https://…";
  const dataPath = form.remoteResponseDataPath.trim() || "data";
  const redirectPath = form.remoteResponseRedirectUrlPath.trim() || "redirectUrl";
  return `${method} ${url}\nBody: { ${bodyParts} }\n\n→ decrypt their reply at "${dataPath}", then read "${redirectPath}" from it as the link`;
};

// ─── SSO Remote API — paste-a-cURL prefill ────────────────────────────────────
// Same parser used elsewhere in this file for the generic API-config cURL import —
// an admin can copy the cURL straight from the TPA's SSO doc or Postman and have
// URL/method/headers fill in automatically instead of retyping them.

const SSO_CURL_PLACEHOLDER = `curl -X POST 'https://api.tpa.com/sso-v2' \\
  -H 'Ocp-Apim-Subscription-Key: xxxxx' \\
  -H 'Content-Type: application/json' \\
  -d '{"payload":"...","source":"IWORK"}'`;

const SsoRemoteApiCurlPaste = ({ onApply, onClose }: { onApply: (p: ParsedCurl) => void; onClose: () => void }) => {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; msg: string; chips?: string[] } | null>(null);

  const tryApply = (raw: string) => {
    try {
      const p = parseCurl(raw);
      if (!p.url) { setStatus({ ok: false, msg: "No URL found — paste a complete cURL command." }); return; }
      onApply(p);
      const h = Object.keys(p.headers).length;
      const chips = [p.method];
      if (h > 0) chips.push(`${h} header${h > 1 ? "s" : ""}`);
      setStatus({ ok: true, msg: p.url, chips });
    } catch (err: any) {
      setStatus({ ok: false, msg: err?.message ?? "Parse failed." });
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const raw = e.clipboardData.getData("text");
    if (!raw.trim()) return;
    e.preventDefault();
    setText(raw);
    tryApply(raw);
  };

  return (
    <Box sx={{
      width: "100%", mb: 2, borderRadius: 2, border: "1.5px solid",
      borderColor: status?.ok ? "#c8e6c9" : "#e8e0ff", bgcolor: "#fafafa", overflow: "hidden",
      boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
    }}>
      <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#f3f0ff", borderBottom: "1px solid #ede7f6" }}>
        <Box display="flex" alignItems="center" gap={0.8}>
          <ContentPasteIcon sx={{ fontSize: 14, color: "#7e57c2" }} />
          <Typography variant="caption" fontWeight={700} sx={{ color: "#4527a0" }}>Paste the TPA's cURL</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ p: 0.3, color: "#9e9e9e", "&:hover": { color: "#333" } }}>
          <CloseIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>
      <Box sx={{ p: 1.5 }}>
        <TextField
          multiline rows={3} fullWidth size="small" placeholder={SSO_CURL_PLACEHOLDER} value={text}
          onChange={(e) => { setText(e.target.value); setStatus(null); }}
          onPaste={handlePaste}
          sx={{
            "& .MuiOutlinedInput-root": {
              background: "#1e1e2e", borderRadius: 1.5,
              "& fieldset": { borderColor: "#393952" },
              "&:hover fieldset": { borderColor: "#7e57c2" },
              "&.Mui-focused fieldset": { borderColor: "#7e57c2" },
            },
            "& .MuiInputBase-input": {
              fontFamily: "'Fira Code', 'Courier New', monospace", fontSize: "0.76rem", color: "#cdd6f4", lineHeight: 1.8,
              "&::placeholder": { color: "#45475a", opacity: 1 },
            },
          }}
        />
        {status && (
          <Box mt={0.8}>
            {status.ok ? (
              <Box display="flex" alignItems="center" gap={0.6} flexWrap="wrap">
                <CheckCircleOutlineIcon sx={{ fontSize: 14, color: "#43a047" }} />
                <Typography variant="caption" sx={{ color: "#2e7d32", fontWeight: 700, mr: 0.5 }}>Applied</Typography>
                {(status.chips ?? []).map((c) => (
                  <Chip key={c} label={c} size="small" sx={{ fontSize: "0.66rem", height: 20, bgcolor: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9" }} />
                ))}
                <Typography variant="caption" sx={{ display: "block", width: "100%", mt: 0.5, color: "#1565c0", fontFamily: "monospace", fontSize: "0.71rem", wordBreak: "break-all" }}>
                  {status.msg}
                </Typography>
              </Box>
            ) : (
              <Box display="flex" alignItems="center" gap={0.8}>
                <ErrorOutlineIcon sx={{ fontSize: 14, color: "#e53935" }} />
                <Typography variant="caption" sx={{ color: "#c62828" }}>{status.msg}</Typography>
              </Box>
            )}
          </Box>
        )}
        {!status && (
          <Typography variant="caption" sx={{ display: "block", mt: 0.6, color: "#9575cd", fontSize: "0.7rem" }}>
            Paste the cURL from the TPA's SSO API doc — URL, method, and headers auto-fill.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface TpaAppRefFormProps {
  viewOnly?: boolean;
}

// Test API responses can include large blobs (e.g. base64-encoded PDFs) — rendering
// those in full froze the tab, so long string values get truncated before display.
const MAX_DISPLAY_STRING_LENGTH = 500;
const truncateLongStrings = (value: any): any => {
  if (typeof value === "string") {
    return value.length > MAX_DISPLAY_STRING_LENGTH
      ? `${value.slice(0, MAX_DISPLAY_STRING_LENGTH)}… [truncated, ${value.length} chars total]`
      : value;
  }
  if (Array.isArray(value)) return value.map(truncateLongStrings);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, truncateLongStrings(v)]));
  }
  return value;
};

// ─── Form Component ───────────────────────────────────────────────────────────

const TpaAppRefForm = ({ viewOnly = false }: TpaAppRefFormProps) => {
  const { refId } = useParams<{ refId?: string }>();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const isAdminContext = pathname.startsWith("/admin-settings");
  const listPath = isAdminContext ? "/admin-settings?tab=external-api-configs" : "/tpa/external-api-configs";
  const isEdit = Boolean(refId) && !viewOnly;
  const isView = viewOnly && Boolean(refId);
  // ?type=sso means refId is a tpa_external_feature_config id (the "Access Portal" button
  // row), not an AppRef id — SSO configs have no AppRef at all, so this is the only way to
  // tell the two id spaces apart when opening this form from an existing saved config.
  const isSsoParam = new URLSearchParams(search).get("type") === "sso";

  const [featureTypes, setFeatureTypes] = useState<FeatureType[]>([]);
  const [tpas, setTpas] = useState<Tpa[]>([]);
  const [dbSchema, setDbSchema] = useState<DbTableSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testInputs, setTestInputs] = useState<Record<string, string>>({});
  const [showTestPaste, setShowTestPaste] = useState(false);

  const [step1Mappings, setStep1Mappings] = useState<ResponseMappingRow[]>([]);
  const [step2Mappings, setStep2Mappings] = useState<ResponseMappingRow[]>([]);
  // Available dot-notation keys discovered from last test run — used as dropdown options in responseKey fields
  const [step1FlatKeys, setStep1FlatKeys] = useState<string[]>([]);
  const [step2FlatKeys, setStep2FlatKeys] = useState<string[]>([]);
  const [step2FlattenedData, setStep2FlattenedData] = useState<Record<string, string>>({});
  const [syncTableList, setSyncTableList] = useState<string[]>([]);
  const [syncPreset, setSyncPreset] = useState<string>("");
  const [curlInlineStep, setCurlInlineStep] = useState<null | 1 | 2>(null);
  // Shared Step 1 auth — other app refs for the same TPA with Step 1 configured
  type AuthRefSuggestion = {
    id: number; label: string; authType: string; payloadFormat: string;
    verificationTokenApiUrl: string; verificationTokenApiMethod: string;
    verificationTokenApiPayload: Record<string, any> | null;
    verificationTokenApiHeaders: Record<string, any> | null;
    step1ResponseTokenKey: string; basicAuthUser: string | null;
    basicAuthPassword: string | null; expiresIn: string; iss: string | null;
  };
  const [authRefSuggestions, setAuthRefSuggestions] = useState<AuthRefSuggestion[]>([]);
  const [individualEcardOptions, setIndividualEcardOptions] = useState<{ id: number; label: string }[]>([]);
  const [authSuggestionDismissed, setAuthSuggestionDismissed] = useState(false);
  // Configs that delegate Step 1 TO this config (this is the source) — shown as warning when editing
  const [linkedByRefs, setLinkedByRefs] = useState<{ id: number; label: string }[]>([]);
  const [envDialogOpen, setEnvDialogOpen] = useState(false);
  const [envDialogContent, setEnvDialogContent] = useState("");
  // { key: AWS secret key name, label: friendly label for UI, value: user-typed value }
  const [credDialog, setCredDialog] = useState<{ open: boolean; keys: { key: string; label: string; value: string; isSet?: boolean }[]; saving: boolean; error: string; loadingStatus: boolean }>({ open: false, keys: [], saving: false, error: "", loadingStatus: false });
  // Snapshot of secured key names at load time — used on save to detect orphaned (removed/unlocked) keys
  const [prevSecuredKeys, setPrevSecuredKeys] = useState<string[]>([]);
  // Tracks the saved app ref ID for new forms (URL param refId is undefined until navigation)
  const [savedFormId, setSavedFormId] = useState<number | undefined>();

  const [ssoForm, setSsoForm] = useState<SsoFormState>(EMPTY_SSO_FORM);
  // Live "is this env var name actually set in AWS Secrets Manager" status, keyed by env var name —
  // lets the admin see at a glance whether the SSO Key/IV will resolve at runtime, without opening the dialog.
  const [ssoSecretStatus, setSsoSecretStatus] = useState<Record<string, boolean>>({});
  const [ssoSecretStatusError, setSsoSecretStatusError] = useState<string>("");
  const [ssoConfigId, setSsoConfigId] = useState<number | null>(null);
  const [ssoLoadedForTpaId, setSsoLoadedForTpaId] = useState<number | null>(null);
  const [ssoPreviewOpen, setSsoPreviewOpen] = useState(false);
  const [ssoPreviewLoading, setSsoPreviewLoading] = useState(false);
  const [ssoPreviewResult, setSsoPreviewResult] = useState<{
    redirectUrl?: string; error?: string; payload?: Record<string, string>;
    tokenShape?: string; tokenParamName?: string | null;
    deliveryMode?: string; encryptedPayload?: string; requestSent?: Record<string, unknown>;
  } | null>(null);
  const [ssoCurlOpen, setSsoCurlOpen] = useState(false);

  // Controlled section open state — lets cURL import auto-expand Step 1 when auth is detected.
  // ssoDelivery is SSO-only (delivery-mode picker); fieldMappings is reused for the SSO
  // "TPA's SSO API" section since it's otherwise unused while isSsoFeature is true.
  const [sec, setSec] = useState({
    basic: false, feature: true, step1: false, step2: true,
    fieldMappings: false, test: false, response: false, ssoDelivery: true,
  });
  const toggleSec = (key: keyof typeof sec) => setSec((p) => ({ ...p, [key]: !p[key] }));
  const expandAll  = () => setSec({ basic: true, feature: true, step1: true, step2: true, fieldMappings: true, test: true, response: true, ssoDelivery: true });
  const collapseAll = () => setSec({ basic: false, feature: false, step1: false, step2: false, fieldMappings: false, test: false, response: false, ssoDelivery: false });

  const [form, setForm] = useState({
    label: "", description: "", authType: "DIRECT", payloadFormat: "JSON" as PayloadFormat,
    verificationTokenApiUrl: "", verificationTokenApiMethod: "POST", verificationTokenApiRows: [] as PayloadRow[], step1HeaderRows: [] as PayloadRow[],
    magicUrlApiUrl: "", magicUrlApiMethod: "POST", magicUrlApiRows: [] as PayloadRow[], step2HeaderRows: [] as PayloadRow[],
    iss: "", expiresIn: "10m", step1ResponseTokenKey: "verificationToken", step2ResponseDataKey: "magicLink",
    isActive: true, mappingDefaults: {} as Record<string, { sourceType: string; sourceField: string | null }>,
    assignFeatureTypeId: 0, assignTpaId: 0, assignLabel: "", assignButtonLabel: "", assignDisplayOrder: 0, assignConfigId: null as number | null,
    // Flow type + SYNC config
    flowType: "REDIRECT" as FlowType,
    syncScope: "" as string, syncSchedule: "", syncTargetTable: "", syncDedupColumn: "", syncTtlHours: 24,
    // BASIC_AUTH credentials (stored in DB)
    basicAuthUser: "", basicAuthPassword: "",
    // Word before the token in the Authorization header — "Bearer" for most TPAs,
    // but some use a non-standard word (e.g. "Token").
    tokenHeaderPrefix: "Bearer",
    // Shared Step 1: when set, Step 1 auth is delegated to this app ref (same TPA, same credentials)
    authAppRefId: null as number | null,
    // E-card only: for TPAs with separate family/individual APIs (e.g. Health India), points from
    // this (family) config to the config used when the selected member is a dependent. NULL when
    // one API serves both via a param (Good Health) or only a family card exists (FHPL).
    individualEcardAppRefId: null as number | null,
    // E-card only: for TPAs whose single API returns ALL covered members in one array response
    // (e.g. Vidal Health). Dot-notation path to the array + the field within each element
    // holding that member's relation. Both blank for TPAs returning one card per call.
    ecardArrayResponseKey: "",
    ecardRelationMatchField: "",
    // E-card only: which of the 4 known architectures this TPA uses — drives which of the two
    // sections above are shown, so admins aren't shown irrelevant fields for every e-card config.
    ecardResponseMode: "" as string,
    // E-card only, UI-side helper (not saved to DB): Family/Individual auto-fills into Config
    // Name so two e-card configs on the same TPA don't end up with the identical auto-generated
    // name (both derive from Feature + TPA alone otherwise, with nothing to tell them apart).
    ecardCardType: "" as "" | "FAMILY" | "INDIVIDUAL",
  });
  // Tracks whether the admin has typed into Config Name themselves — once true, auto-fill
  // (from Feature/TPA/card-type selection) stops overwriting it.
  const [labelManuallyEdited, setLabelManuallyEdited] = useState(false);

  const patch = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const isSsoFeature = featureTypes.find((ft) => ft.id === form.assignFeatureTypeId)?.key === SSO_FEATURE_KEY;
  const isClaimSubmissionFeature = featureTypes.find((ft) => ft.id === form.assignFeatureTypeId)?.key === CLAIM_SUBMISSION_FEATURE_KEY;
  const isEcardFeature = /ECARD|E_CARD/.test(featureTypes.find((ft) => ft.id === form.assignFeatureTypeId)?.key?.toUpperCase() ?? "");
  // Builds the auto-generated Config Name for e-card configs, appending Family/Individual so
  // two configs on the same TPA don't end up with the identical auto-name (both would otherwise
  // derive purely from TPA + Feature Type, with nothing to tell them apart).
  const buildEcardLabel = (tpaName: string, ftLabel: string, cardType: string) =>
    cardType === "FAMILY" ? `${tpaName} ${ftLabel} - Family`
      : cardType === "INDIVIDUAL" ? `${tpaName} ${ftLabel} - Individual`
      : `${tpaName} ${ftLabel}`;

  // ── Claim Submission — this screen already builds one Application Ref (Basic
  // Details / API Call / Response Mappings above always represent "Intimate Claim").
  // Answering "different APIs" here reveals a second, parallel API Call + Response
  // Mappings section for "Submit Claim", built with its own state below — Auth Type
  // and other Basic Details stay shared, since every TPA seen so far authenticates
  // identically for both calls.
  const [claimFormTypeChoice, setClaimFormTypeChoice] = useState<"" | "SINGLE" | "MULTI">("");
  const [submitExecutionModeChoice, setSubmitExecutionModeChoice] = useState<"" | "SINGLE_CALL" | "PER_DOCUMENT">("");

  // Submit Claim side — mirrors the Intimate side's Step-2/API-Call + Response
  // Mappings state, kept separate so saving one never touches the other.
  const [submitMagicUrlApiUrl, setSubmitMagicUrlApiUrl] = useState("");
  const [submitMagicUrlApiMethod, setSubmitMagicUrlApiMethod] = useState("POST");
  const [submitMagicUrlApiRows, setSubmitMagicUrlApiRows] = useState<PayloadRow[]>([]);
  const [submitStep2HeaderRows, setSubmitStep2HeaderRows] = useState<PayloadRow[]>([]);
  const [submitStep2ResponseDataKey, setSubmitStep2ResponseDataKey] = useState("magicLink");
  const [submitStep2Mappings, setSubmitStep2Mappings] = useState<ResponseMappingRow[]>([]);
  const [submitRefId, setSubmitRefId] = useState<number | null>(null);
  const [submitAssignConfigId, setSubmitAssignConfigId] = useState<number | null>(null);
  const [curlInlineSubmitOpen, setCurlInlineSubmitOpen] = useState(false);

  // First time "different APIs" is chosen, default the Submit side's method/headers
  // to match Intimate's — same TPA usually means same auth header/content-type;
  // admin only needs to change the URL + payload fields from there.
  const handleClaimFormTypeChoice = (val: "SINGLE" | "MULTI") => {
    setClaimFormTypeChoice(val);
    if (val === "MULTI" && !submitMagicUrlApiUrl && submitStep2HeaderRows.length === 0) {
      setSubmitMagicUrlApiMethod(form.magicUrlApiMethod || "POST");
      setSubmitStep2HeaderRows(form.step2HeaderRows.map((r) => ({ ...r })));
    }
  };

  const applySubmitParsedCurl = (p: ParsedCurl) => {
    if (p.url) setSubmitMagicUrlApiUrl(p.url);
    if (p.method) setSubmitMagicUrlApiMethod(p.method);
    if (Object.keys(p.headers).length > 0) setSubmitStep2HeaderRows(payloadToRows(p.headers));
    if (p.bodyJson) setSubmitMagicUrlApiRows(payloadToRows(p.bodyJson));
    setCurlInlineSubmitOpen(false);
  };

  const loadSsoConfigForTpa = async (tpaId: number) => {
    const tpaName = tpas.find((t) => t.id === tpaId)?.tpaName ?? "TPA";
    try {
      const res = await apiRequest(endPoints.tpaSsoConfigByTpa(tpaId), { method: "GET" });
      const data = res?.data;
      if (data) {
        setSsoConfigId(data.id);
        setSsoForm({
          ssoDeliveryMode: data.ssoDeliveryMode ?? "LOCAL_REDIRECT",
          portalUrl: data.portalUrl ?? "",
          ssoKeyEnvName: data.ssoKeyEnvName ?? "",
          ssoIvEnvName: data.ssoIvEnvName ?? "",
          ssoKeyEncoding: data.ssoKeyEncoding ?? "utf8",
          ssoPadding: data.ssoPadding ?? "PKCS7",
          ssoIvMode: data.ssoIvMode ?? "FIXED",
          ssoTextEncoding: data.ssoTextEncoding ?? "utf8",
          ssoTokenShape: data.ssoTokenShape ?? "SEPARATE_FIELDS",
          ssoTokenParamName: data.ssoTokenParamName ?? "",
          ssoIvEnvelopeSeparator: data.ssoIvEnvelopeSeparator ?? ":",
          ssoUrlEncode: data.ssoUrlEncode ?? true,
          outputTransformRows: ssoObjectToRows(data.ssoOutputTransform),
          fieldMappings: (data.fieldMappings ?? []).map((m: any) => ({
            id: m.id, externalFieldName: m.externalFieldName, sourceType: m.sourceType,
            sourceField: m.sourceField, staticValue: m.staticValue,
          })),
          remoteApiUrl: data.remoteApiUrl ?? "",
          remoteApiMethod: data.remoteApiMethod ?? "POST",
          remoteApiHeaderRows: kvObjectToRows(data.remoteApiHeaders),
          remoteRequestPayloadKey: data.remoteRequestPayloadKey ?? "payload",
          remoteRequestExtraFieldRows: kvObjectToRows(data.remoteRequestExtraFields),
          remoteResponseDataPath: data.remoteResponseDataPath ?? "data",
          remoteResponseDecryptKeyEnvName: data.remoteResponseDecryptKeyEnvName ?? "",
          remoteResponseRedirectUrlPath: data.remoteResponseRedirectUrlPath ?? "redirectUrl",
        });
        // Snapshot the SSO Key/IV env names already on record — so the post-save auto-open
        // of the credentials dialog only prompts for genuinely NEW keys, same as payload fields.
        const ssoSnap = [data.ssoKeyEnvName, data.ssoIvMode === "FIXED" ? data.ssoIvEnvName : null].filter(Boolean) as string[];
        if (ssoSnap.length) setPrevSecuredKeys((prev) => [...new Set([...prev, ...ssoSnap])]);
      } else {
        setSsoConfigId(null);
        setSsoForm({ ...EMPTY_SSO_FORM, ssoKeyEnvName: suggestSsoEnvName(tpaName, "KEY"), ssoIvEnvName: suggestSsoEnvName(tpaName, "IV") });
      }
    } catch {
      // No SSO config yet for this TPA — normal for a first-time setup.
      setSsoConfigId(null);
      setSsoForm({ ...EMPTY_SSO_FORM, ssoKeyEnvName: suggestSsoEnvName(tpaName, "KEY"), ssoIvEnvName: suggestSsoEnvName(tpaName, "IV") });
    } finally {
      setSsoLoadedForTpaId(tpaId);
    }
  };

  // Whenever Feature Type = TPA Portal Login and a TPA is picked (either order), load
  // that TPA's existing SSO config, if any — reacts to both Feature Assignment fields.
  useEffect(() => {
    if (isSsoFeature && form.assignTpaId && ssoLoadedForTpaId !== form.assignTpaId) {
      loadSsoConfigForTpa(form.assignTpaId);
    }
  }, [isSsoFeature, form.assignTpaId]);

  const [ssoAdvancedOpen, setSsoAdvancedOpen] = useState(false);

  const addSsoMapping = () => setSsoForm((prev) => ({ ...prev, fieldMappings: [...prev.fieldMappings, { externalFieldName: "", sourceType: "STATIC", sourceField: null, staticValue: null }] }));
  const removeSsoMapping = (idx: number) => setSsoForm((prev) => ({ ...prev, fieldMappings: prev.fieldMappings.filter((_, i) => i !== idx) }));
  const updateSsoMapping = (idx: number, patchVal: Partial<SsoFieldMappingRow>) => setSsoForm((prev) => ({ ...prev, fieldMappings: prev.fieldMappings.map((m, i) => i === idx ? { ...m, ...patchVal } : m) }));

  const addSsoTransformRow = () => setSsoForm((prev) => ({ ...prev, outputTransformRows: [...prev.outputTransformRows, { from: "", to: "" }] }));
  const removeSsoTransformRow = (idx: number) => setSsoForm((prev) => ({ ...prev, outputTransformRows: prev.outputTransformRows.filter((_, i) => i !== idx) }));
  const updateSsoTransformRow = (idx: number, patchVal: Partial<{ from: string; to: string }>) => setSsoForm((prev) => ({ ...prev, outputTransformRows: prev.outputTransformRows.map((r, i) => i === idx ? { ...r, ...patchVal } : r) }));

  const addRemoteHeaderRow = () => setSsoForm((prev) => ({ ...prev, remoteApiHeaderRows: [...prev.remoteApiHeaderRows, { key: "", value: "" }] }));
  const removeRemoteHeaderRow = (idx: number) => setSsoForm((prev) => ({ ...prev, remoteApiHeaderRows: prev.remoteApiHeaderRows.filter((_, i) => i !== idx) }));
  const updateRemoteHeaderRow = (idx: number, patchVal: Partial<{ key: string; value: string }>) => setSsoForm((prev) => ({ ...prev, remoteApiHeaderRows: prev.remoteApiHeaderRows.map((r, i) => i === idx ? { ...r, ...patchVal } : r) }));

  const addRemoteExtraRow = () => setSsoForm((prev) => ({ ...prev, remoteRequestExtraFieldRows: [...prev.remoteRequestExtraFieldRows, { key: "", value: "" }] }));
  const removeRemoteExtraRow = (idx: number) => setSsoForm((prev) => ({ ...prev, remoteRequestExtraFieldRows: prev.remoteRequestExtraFieldRows.filter((_, i) => i !== idx) }));
  const updateRemoteExtraRow = (idx: number, patchVal: Partial<{ key: string; value: string }>) => setSsoForm((prev) => ({ ...prev, remoteRequestExtraFieldRows: prev.remoteRequestExtraFieldRows.map((r, i) => i === idx ? { ...r, ...patchVal } : r) }));

  const applySsoParsedCurl = (p: ParsedCurl) => {
    setSsoForm((prev) => ({
      ...prev,
      remoteApiUrl: p.url || prev.remoteApiUrl,
      remoteApiMethod: p.method || prev.remoteApiMethod,
      remoteApiHeaderRows: Object.keys(p.headers).length ? kvObjectToRows(p.headers) : prev.remoteApiHeaderRows,
    }));
    setSsoCurlOpen(false);
  };

  const handleSsoPreview = async () => {
    if (!ssoConfigId) { setFormError("Save the config first, then preview."); return; }
    setSsoPreviewOpen(true); setSsoPreviewLoading(true); setSsoPreviewResult(null);
    try {
      const res = await apiRequest(endPoints.tpaSsoConfigPreview(ssoConfigId), { method: "POST", data: {} });
      setSsoPreviewResult({
        redirectUrl: res?.data?.redirectUrl, payload: res?.data?.payload,
        tokenShape: res?.data?.tokenShape, tokenParamName: res?.data?.tokenParamName,
        deliveryMode: res?.data?.deliveryMode, encryptedPayload: res?.data?.encryptedPayload,
        requestSent: res?.data?.requestSent,
      });
    } catch (e: any) {
      setSsoPreviewResult({ error: e?.message ?? "Preview failed." });
    } finally {
      setSsoPreviewLoading(false);
    }
  };

  // Sync Step 1 visibility with auth type changes (including on initial load of existing config)
  useEffect(() => {
    if (form.authType !== "DIRECT") {
      setSec((p) => p.step1 ? p : { ...p, step1: true }); // open if not already open
    }
  }, [form.authType]);

  // When TPA is selected (or changed), check if other app refs for that TPA already have Step 1 configured.
  // Only show suggestion for new configs — on edit the authAppRefId is already loaded from DB.
  useEffect(() => {
    const tpaId = form.assignTpaId;
    if (!tpaId || isEdit || authSuggestionDismissed) return;
    apiRequest(endPoints.tpaFeatureAllConfigs, { method: "GET" })
      .then((res) => {
        const configs: any[] = res?.data ?? [];
        const tpaConfigs = configs.filter((c: any) => c.tpaId === tpaId);
        const seen = new Set<number>();
        const suggestions: AuthRefSuggestion[] = [];
        const currentRefId = refId ? Number(refId) : 0;
        for (const c of tpaConfigs) {
          const r = c.appRef;
          // Exclude current config (prevents source from suggesting itself) and delegates (no authAppRefId = owns Step 1)
          if (!r || !r.authType || r.authType === "DIRECT" || r.authAppRefId || seen.has(r.id) || r.id === currentRefId) continue;
          seen.add(r.id);
          suggestions.push({
            id: r.id, label: r.label, authType: r.authType,
            payloadFormat: r.payloadFormat ?? "JSON",
            verificationTokenApiUrl: r.verificationTokenApiUrl ?? "",
            verificationTokenApiMethod: r.verificationTokenApiMethod ?? "POST",
            verificationTokenApiPayload: r.verificationTokenApiPayload ?? null,
            verificationTokenApiHeaders: r.verificationTokenApiHeaders ?? null,
            step1ResponseTokenKey: r.step1ResponseTokenKey ?? "verificationToken",
            basicAuthUser: r.basicAuthUser ?? null,
            basicAuthPassword: r.basicAuthPassword ?? null,
            expiresIn: r.expiresIn ?? "10m",
            iss: r.iss ?? null,
          });
        }
        setAuthRefSuggestions(suggestions);
      })
      .catch(() => {});
  }, [form.assignTpaId]);

  // For e-card configs: list other active app-refs on the same TPA that could be the
  // "individual" counterpart to this (family) config — same-TPA scoping only, since the
  // individual/family split is always within one TPA's own two endpoints.
  useEffect(() => {
    const tpaId = form.assignTpaId;
    if (!tpaId || !/e.?card/i.test(form.label)) { setIndividualEcardOptions([]); return; }
    apiRequest(endPoints.tpaFeatureAllConfigs, { method: "GET" })
      .then((res) => {
        const configs: any[] = res?.data ?? [];
        const currentRefId = refId ? Number(refId) : 0;
        const seen = new Set<number>();
        const opts: { id: number; label: string }[] = [];
        for (const c of configs) {
          const r = c.appRef;
          if (!r || c.tpaId !== tpaId || !r.isActive || r.id === currentRefId || seen.has(r.id)) continue;
          seen.add(r.id);
          opts.push({ id: r.id, label: r.label });
        }
        setIndividualEcardOptions(opts);
        // Auto-suggest: if exactly one sibling config's label contains "individual" and this
        // config hasn't already got one picked, pre-select it instead of requiring a manual
        // pick — same auto-suggest spirit as the Step 1 auth-linking banner above. Admin can
        // still change it; this only fires when nothing's chosen yet.
        if (!form.individualEcardAppRefId) {
          const candidates = opts.filter((o) => /individual/i.test(o.label));
          if (candidates.length === 1) {
            patch("individualEcardAppRefId", candidates[0].id);
            if (!form.ecardResponseMode) patch("ecardResponseMode", "SEPARATE_APIS");
          }
        }
      })
      .catch(() => {});
  }, [form.assignTpaId, form.label, refId]);

  // Collects all secured fields across the entire form as {key, label} pairs for the global dialog.
  const collectSecuredKeys = () => {
    const items: { key: string; label: string }[] = [];
    const extractKey = (val: string) => {
      const m = val.match(/^\{\{secret:env:[\w_]+:([^}]+)\}\}$/);
      return m ? m[1] : null;
    };
    if (form.basicAuthUser) {
      const k = extractKey(form.basicAuthUser);
      if (k) items.push({ key: k, label: "Basic Auth Username" });
    }
    if (form.basicAuthPassword) {
      const k = extractKey(form.basicAuthPassword);
      if (k) items.push({ key: k, label: "Basic Auth Password" });
    }
    const scanRows = (rows: PayloadRow[], stepLabel: string, isHeader = false) => {
      const step = (stepLabel.includes("2") ? 2 : 1) as 1 | 2;
      rows.forEach((r) => {
        if (!r.secured || !r.key.trim()) return;
        const secretKey = deriveEnvKey(form.label, step, r.key.trim(), isHeader);
        items.push({ key: secretKey, label: `${stepLabel} › ${r.key}` });
      });
    };
    scanRows(form.verificationTokenApiRows, "Step 1 Payload");
    scanRows(form.step1HeaderRows, "Step 1 Header", true);
    scanRows(form.magicUrlApiRows, "Step 2 Payload");
    scanRows(form.step2HeaderRows, "Step 2 Header", true);
    if (isSsoFeature) {
      if (ssoForm.ssoKeyEnvName.trim()) {
        items.push({ key: ssoForm.ssoKeyEnvName.trim(), label: "TPA SSO — Encryption Key" });
      }
      if (ssoForm.ssoIvMode === "FIXED" && ssoForm.ssoIvEnvName.trim()) {
        items.push({ key: ssoForm.ssoIvEnvName.trim(), label: "TPA SSO — Encryption IV" });
      }
    }
    return items;
  };

  // Opens the credentials dialog and fetches live key-set status from Secrets Manager
  const openCredDialog = async (keys: { key: string; label: string }[]) => {
    if (!keys.length) return;
    setCredDialog({ open: true, keys: keys.map(k => ({ ...k, value: "", isSet: undefined })), saving: false, error: "", loadingStatus: true });
    const activeId = savedFormId ?? (refId ? Number(refId) : undefined);
    if (activeId) {
      try {
        const res = await apiRequest(endPoints.tpaFeatureCheckSecretKeys(activeId), { method: "POST", data: { keys: keys.map(k => k.key) } });
        const status: Record<string, boolean> = res?.data ?? {};
        setCredDialog(p => ({ ...p, loadingStatus: false, keys: p.keys.map(k => ({ ...k, isSet: status[k.key] ?? false })) }));
      } catch {
        setCredDialog(p => ({ ...p, loadingStatus: false }));
      }
    } else {
      setCredDialog(p => ({ ...p, loadingStatus: false }));
    }
  };

  // Keeps the inline lock indicator next to the SSO Key/IV fields in sync with what's
  // actually set in AWS Secrets Manager, so the admin can tell "will this work?" without
  // opening the credentials dialog.
  useEffect(() => {
    const activeIdForSso = savedFormId ?? (refId ? Number(refId) : undefined);
    if (!isSsoFeature || !activeIdForSso) { setSsoSecretStatus({}); setSsoSecretStatusError(""); return; }
    const keys = [
      ssoForm.ssoKeyEnvName.trim(),
      ssoForm.ssoIvMode === "FIXED" ? ssoForm.ssoIvEnvName.trim() : "",
    ].filter(Boolean);
    if (keys.length === 0) { setSsoSecretStatus({}); setSsoSecretStatusError(""); return; }
    let cancelled = false;
    setSsoSecretStatusError("");
    apiRequest(endPoints.tpaFeatureCheckSecretKeys(activeIdForSso), { method: "POST", data: { keys } })
      .then((res: any) => { if (!cancelled) setSsoSecretStatus(res?.data ?? {}); })
      .catch((err: any) => {
        if (cancelled) return;
        setSsoSecretStatus({});
        setSsoSecretStatusError(err?.response?.data?.message ?? err?.message ?? "Could not reach Secrets Manager status check");
      });
    return () => { cancelled = true; };
  }, [isSsoFeature, ssoForm.ssoKeyEnvName, ssoForm.ssoIvEnvName, ssoForm.ssoIvMode, savedFormId, refId]);

  // Derives AWS Secrets Manager reference for BASIC_AUTH credentials.
  // One shared secret (TPA_SECRET_ARN) holds all TPA credentials as a flat JSON object.
  // Key names follow the same convention as the old env vars — TPA-specific, unique per config.
  // e.g.  ADITYA_BIRLA_HEALTH_INSURANCE_E_CARD_STEP1_BASIC_USER
  const deriveBasicAuthSecretPaths = (label: string) => {
    const norm = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").toUpperCase();
    const base = norm(label || "CONFIG");
    const userKey = `${base}_STEP1_BASIC_USER`;
    const passKey = `${base}_STEP1_BASIC_PASS`;
    const envVarName = "TPA_SECRET_ARN";
    return {
      userPath:   `{{secret:env:${envVarName}:${userKey}}}`,
      passPath:   `{{secret:env:${envVarName}:${passKey}}}`,
      envVarName,
      userKey,
      passKey,
    };
  };

  // Legacy: derives {{env:KEY}} names (kept for .env guide display when values are already env refs)
  const deriveBasicAuthEnvKeys = (label: string) => {
    const norm = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").toUpperCase();
    const base = norm(label || "CONFIG");
    return { userKey: `${base}_STEP1_BASIC_USER`, passKey: `${base}_STEP1_BASIC_PASS` };
  };

  const applyParsedCurl = (parsed: ParsedCurl, targetStep: 1 | 2 = 2, applyAuthType = true) => {
    const validMethods = ["POST", "GET", "PUT", "DELETE", "PATCH"];
    // If pasting in Step 2 but URL looks like an auth endpoint (SESSION detected) → auto-route to Step 1
    const isLikelyAuthUrl = /\/(auth|login|token|generate[_-]?token|jwt|generate.*jwt|.*jwt.*auth|get[_-]?token|credentials?|signin|sign[_-]in|oauth|validate)[^/]*/i.test(parsed.url ?? "");
    const effectiveStep: 1 | 2 = (targetStep === 2 && (parsed.authType === "SESSION" || parsed.authType === "BASIC_AUTH") && isLikelyAuthUrl) ? 1 : targetStep;
    setForm((prev) => {
      const next = { ...prev };
      // For BASIC_AUTH: paste decoded values directly — user manually clicks lock to convert to {{env:KEY}}
      const applyBasicAuth = (_p: typeof prev) => {
        if (!parsed.basicAuthUser) return;
        next.basicAuthUser = parsed.basicAuthUser;
        next.basicAuthPassword = parsed.basicAuthPassword ?? "";
        next.authType = "BASIC_AUTH";
      };
      if (effectiveStep === 1) {
        if (parsed.url) next.verificationTokenApiUrl = parsed.url;
        if (validMethods.includes(parsed.method)) next.verificationTokenApiMethod = parsed.method;
        if (parsed.payloadFormat) next.payloadFormat = parsed.payloadFormat;
        if (parsed.bodyJson) next.verificationTokenApiRows = payloadToRows(parsed.bodyJson);
        else if (parsed.queryParams) next.verificationTokenApiRows = payloadToRows(parsed.queryParams);
        if (Object.keys(parsed.headers).length > 0) next.step1HeaderRows = payloadToRows(parsed.headers);
        if (applyAuthType) {
          if (parsed.basicAuthUser) applyBasicAuth(prev);
          else if (parsed.authType !== "DIRECT") next.authType = parsed.authType;
          if (parsed.tokenHeaderPrefix) next.tokenHeaderPrefix = parsed.tokenHeaderPrefix;
        }
      } else {
        if (parsed.url) next.magicUrlApiUrl = parsed.url;
        if (validMethods.includes(parsed.method)) next.magicUrlApiMethod = parsed.method;
        // payloadFormat controls Step 1 body encoding only — never overwrite from Step 2 cURL
        if (applyAuthType) {
          if (parsed.basicAuthUser) applyBasicAuth(prev);
          else if (parsed.authType !== "DIRECT") next.authType = parsed.authType;
          if (parsed.tokenHeaderPrefix) next.tokenHeaderPrefix = parsed.tokenHeaderPrefix;
        }
        if (parsed.bodyJson) next.magicUrlApiRows = payloadToRows(parsed.bodyJson);
        else if (parsed.queryParams) next.magicUrlApiRows = payloadToRows(parsed.queryParams);
        if (Object.keys(parsed.headers).length > 0) next.step2HeaderRows = payloadToRows(parsed.headers);
      }
      return next;
    });
    // Auto-expand based on effective auth type (skip step1 auto-expand if not applying auth type)
    const effectiveAuth = applyAuthType ? parsed.authType : "DIRECT";
    if (effectiveAuth !== "DIRECT") {
      setSec((p) => ({ ...p, basic: true, step1: true, step2: true }));
    } else {
      setSec((p) => ({ ...p, [effectiveStep === 1 ? "step1" : "step2"]: true }));
    }
  };

  const breadcrumbs = [
    { label: "Admin Settings", path: isAdminContext ? "/admin-settings" : undefined },
    { label: "External API Configs", path: listPath },
    { label: isView ? (isSsoFeature ? "View SSO Config" : "View API Config") : isEdit ? (isSsoFeature ? "Edit SSO Config" : "Edit API Config") : "New API Config" },
  ];

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [ftRes, tpaRes] = await Promise.allSettled([
          apiRequest(endPoints.tpaFeatureTypes, { method: "GET" }),
          apiRequest(endPoints.tpasList + "?limit=1000&page=1", { method: "GET" }),
        ]);
        if (ftRes.status === "fulfilled") setFeatureTypes(ftRes.value?.data ?? []);
        if (tpaRes.status === "fulfilled") setTpas(tpaRes.value?.data?.data ?? tpaRes.value?.data ?? []);
        // DB schema is only needed for SYNC/mapping UI — fetch lazily in background, don't block form load
        apiRequest(endPoints.tpaFeatureDbSchema, { method: "GET" })
          .then((r) => setDbSchema(r?.data ?? []))
          .catch(() => {});

        if (refId && isSsoParam) {
          // refId here is a tpa_external_feature_config id — load that directly and let
          // the existing isSsoFeature + assignTpaId reactive effect (below) pick up the
          // matching tpa_sso_config row, exactly as if a human had just picked this TPA
          // and "TPA Portal Login" from the Feature Assignment section themselves.
          try {
            const cfgRes = await apiRequest(endPoints.tpaFeatureConfigById(Number(refId)), { method: "GET" });
            const config = cfgRes?.data;
            if (config) {
              setForm((prev) => ({
                ...prev,
                assignFeatureTypeId: config.featureTypeId ?? 0,
                assignTpaId: config.tpaId ?? 0,
                assignLabel: config.label ?? "",
                assignButtonLabel: config.buttonLabel ?? "",
                assignDisplayOrder: config.displayOrder ?? 0,
                assignConfigId: config.id ?? null,
                isActive: config.isActive ?? true,
              }));
              setSec((p) => ({ ...p, basic: true, feature: true }));
            }
          } catch { /* ignore */ }
        } else if (refId) {
          const refRes = await apiRequest(endPoints.tpaFeatureAppRefById(Number(refId)), { method: "GET" });
          const ref = refRes?.data;
          if (ref) {
            const mappingDefaults: Record<string, { sourceType: string; sourceField: string | null }> = {};
            if (ref.fieldHints) {
              Object.entries(ref.fieldHints).forEach(([name, hint]: [string, any]) => {
                if (hint.type === "DYNAMIC" && hint.sourceType) mappingDefaults[name] = { sourceType: hint.sourceType, sourceField: hint.sourceField ?? null };
              });
            }
            let assignFeatureTypeId = 0, assignTpaId = 0, assignLabel = "", assignButtonLabel = "", assignDisplayOrder = 0, assignConfigId: number | null = null;
            try {
              const allConfigs = await apiRequest(endPoints.tpaFeatureAllConfigs, { method: "GET" });
              const allConfigsData: any[] = allConfigs?.data ?? [];
              const existing = allConfigsData.find((c: any) => c.appRefId === ref.id);
              if (existing) {
                assignFeatureTypeId = existing.featureTypeId ?? 0; assignTpaId = existing.tpaId ?? 0; assignLabel = existing.label ?? ""; assignButtonLabel = existing.buttonLabel ?? ""; assignDisplayOrder = existing.displayOrder ?? 0; assignConfigId = existing.id;
                setClaimFormTypeChoice((existing.claimFormType ?? "") as any);

                // This ref is the Intimate side of a MULTI pair — load its sibling
                // Submit Claim ref (own URL/payload/headers/response mappings) too,
                // so both sections are populated on this one screen.
                if (existing.apiType === "INTIMATE_CLAIM" && existing.claimFormType === "MULTI") {
                  const submitConfig = allConfigsData.find((c: any) =>
                    c.apiType === "SUBMIT_CLAIM" && c.featureTypeId === existing.featureTypeId && c.tpaId === existing.tpaId
                  );
                  if (submitConfig) {
                    setSubmitAssignConfigId(submitConfig.id);
                    setSubmitExecutionModeChoice((submitConfig.submitExecutionMode ?? "") as any);
                    if (submitConfig.appRefId) {
                      try {
                        const submitRefRes = await apiRequest(endPoints.tpaFeatureAppRefById(submitConfig.appRefId), { method: "GET" });
                        const submitRef = submitRefRes?.data;
                        if (submitRef) {
                          setSubmitRefId(submitRef.id);
                          setSubmitMagicUrlApiUrl(submitRef.magicUrlApiUrl ?? "");
                          setSubmitMagicUrlApiMethod(submitRef.magicUrlApiMethod ?? "POST");
                          setSubmitMagicUrlApiRows(payloadToRows(submitRef.magicUrlApiPayload));
                          setSubmitStep2HeaderRows(payloadToRows(submitRef.magicUrlApiHeaders));
                          setSubmitStep2ResponseDataKey(submitRef.step2ResponseDataKey ?? "magicLink");
                        }
                        const submitMappingsRes = await apiRequest((endPoints as any).tpaFeatureAppRefResponseMappings(submitConfig.appRefId), { method: "GET" });
                        const submitRows: ResponseMappingRow[] = (submitMappingsRes?.data ?? [])
                          .filter((m: any) => m.step === 2)
                          .map((m: any) => ({
                            id: m.id, responseKey: m.responseKey, sampleValue: "",
                            targetType: m.targetType as TargetType, outputKey: m.outputKey,
                            targetTable: m.targetTable ?? null, isAuthToken: false, isPrimaryFk: false,
                            displayOrder: m.displayOrder ?? 0,
                          }));
                        setSubmitStep2Mappings(submitRows);
                      } catch { /* ignore — submit side optional to load */ }
                    }
                  }
                }
              }
              // Populate suggestions list so the "linked from" banner can show the label on edit
              if (ref.authAppRefId) {
                try {
                  const linkedRes = await apiRequest(endPoints.tpaFeatureAppRefById(ref.authAppRefId), { method: "GET" });
                  const linked = linkedRes?.data;
                  if (linked) {
                    setAuthRefSuggestions([{
                      id: linked.id, label: linked.label, authType: linked.authType ?? "",
                      payloadFormat: linked.payloadFormat ?? "JSON",
                      verificationTokenApiUrl: linked.verificationTokenApiUrl ?? "",
                      verificationTokenApiMethod: linked.verificationTokenApiMethod ?? "POST",
                      verificationTokenApiPayload: linked.verificationTokenApiPayload ?? null,
                      verificationTokenApiHeaders: linked.verificationTokenApiHeaders ?? null,
                      step1ResponseTokenKey: linked.step1ResponseTokenKey ?? "verificationToken",
                      basicAuthUser: linked.basicAuthUser ?? null,
                      basicAuthPassword: linked.basicAuthPassword ?? null,
                      expiresIn: linked.expiresIn ?? "10m",
                      iss: linked.iss ?? null,
                    }]);
                  }
                } catch { /* ignore */ }
              }
            } catch { /* ignore */ }
            setForm({
              label: ref.label ?? "", description: ref.description ?? "", authType: ref.authType ?? "DIRECT",
              payloadFormat: (ref.payloadFormat as PayloadFormat) ?? "JSON",
              verificationTokenApiUrl: ref.verificationTokenApiUrl ?? "", verificationTokenApiMethod: ref.verificationTokenApiMethod ?? "POST",
              verificationTokenApiRows: payloadToRows(ref.verificationTokenApiPayload), step1HeaderRows: payloadToRows(ref.verificationTokenApiHeaders),
              magicUrlApiUrl: ref.magicUrlApiUrl ?? "", magicUrlApiMethod: ref.magicUrlApiMethod ?? "POST",
              magicUrlApiRows: payloadToRows(ref.magicUrlApiPayload), step2HeaderRows: payloadToRows(ref.magicUrlApiHeaders),
              iss: ref.iss ?? "", expiresIn: ref.expiresIn ?? "10m",
              step1ResponseTokenKey: ref.step1ResponseTokenKey ?? "verificationToken",
              step2ResponseDataKey: ref.step2ResponseDataKey ?? "magicLink",
              isActive: ref.isActive, mappingDefaults,
              assignFeatureTypeId, assignTpaId, assignLabel, assignButtonLabel, assignDisplayOrder, assignConfigId,
              flowType: (ref.flowType as FlowType) ?? "REDIRECT",
              syncScope: ref.syncScope ?? "", syncSchedule: ref.syncSchedule ?? "",
              syncTargetTable: ref.syncTargetTable ?? "", syncDedupColumn: ref.syncDedupColumn ?? "",
              syncTtlHours: ref.syncTtlHours ?? 24,
              basicAuthUser: ref.basicAuthUser ?? "", basicAuthPassword: ref.basicAuthPassword ?? "",
              tokenHeaderPrefix: (ref as any).tokenHeaderPrefix ?? "Bearer",
              authAppRefId: ref.authAppRefId ?? null,
              individualEcardAppRefId: ref.individualEcardAppRefId ?? null,
              ecardArrayResponseKey: ref.ecardArrayResponseKey ?? "",
              ecardRelationMatchField: ref.ecardRelationMatchField ?? "",
              ecardResponseMode: ref.ecardResponseMode ?? "",
            });
            // Snapshot which keys were secured at load time — used on save to detect orphans
            {
              const extractSecretKey = (val: string) => { const m = val?.match(/^\{\{secret:env:[\w_]+:([^}]+)\}\}$/); return m ? m[1] : null; };
              const snap: string[] = [];
              const k1 = extractSecretKey(ref.basicAuthUser); if (k1) snap.push(k1);
              const k2 = extractSecretKey(ref.basicAuthPassword); if (k2) snap.push(k2);
              const scanRefRows = (payload: any, label: string, isHeader = false) => {
                const step = (label.includes("2") ? 2 : 1) as 1 | 2;
                payloadToRows(payload).forEach((r: any) => {
                  if (!r.secured || !r.key?.trim()) return;
                  snap.push(deriveEnvKey(ref.label, step, r.key.trim(), isHeader));
                });
              };
              scanRefRows(ref.verificationTokenApiPayload, "Step 1 Payload");
              scanRefRows(ref.verificationTokenApiHeaders, "Step 1 Header", true);
              scanRefRows(ref.magicUrlApiPayload, "Step 2 Payload");
              scanRefRows(ref.magicUrlApiHeaders, "Step 2 Header", true);
              // Merge (not replace) — SSO config snapshot below may load independently of this one.
              setPrevSecuredKeys((prev) => [...new Set([...prev, ...snap])]);
            }
            // On edit/view: open Basic Details since config name is already filled
            setSec((p) => ({ ...p, basic: true, feature: true }));

            // Check if other configs delegate their Step 1 to this config (this is the source)
            try {
              const allRefsRes = await apiRequest(endPoints.tpaFeatureAppRefs, { method: "GET" });
              // /app-refs now also returns SSO configs appended in, tagged configType: "SSO" —
              // filter back to just AppRef-shaped rows (SSO rows have no authAppRefId anyway,
              // so this wouldn't have matched, but excluding them explicitly is clearer).
              const delegates = (allRefsRes?.data ?? [])
                .filter((r: any) => r.configType !== "SSO")
                .filter((r: any) => r.authAppRefId === ref.id && r.id !== ref.id);
              if (delegates.length > 0) setLinkedByRefs(delegates.map((r: any) => ({ id: r.id, label: r.label })));
            } catch { /* ignore */ }

            // Load existing response mappings
            try {
              const mappingsRes = await apiRequest((endPoints as any).tpaFeatureAppRefResponseMappings(ref.id), { method: "GET" });
              const rows: ResponseMappingRow[] = (mappingsRes?.data ?? []).map((m: any) => ({
                id: m.id, responseKey: m.responseKey, sampleValue: "",
                targetType: m.targetType as TargetType, outputKey: m.outputKey,
                targetTable: m.targetTable ?? null, isAuthToken: m.isAuthToken ?? false, isPrimaryFk: m.isPrimaryFk ?? false,
                displayOrder: m.displayOrder ?? 0,
              }));
              const s1 = rows.filter((r) => (mappingsRes?.data ?? []).find((m: any) => m.id === r.id)?.step === 1);
              const s2 = rows.filter((r) => (mappingsRes?.data ?? []).find((m: any) => m.id === r.id)?.step === 2);
              setStep1Mappings(s1);
              setStep2Mappings(s2);
              // Restore syncTableList: persisted list first, then fallback to mapping rows, then syncTargetTable
              const usedTables = [...new Set(s2.map((r) => r.targetTable).filter(Boolean) as string[])];
              const persistedTables: string[] = Array.isArray((ref as any).syncTables) ? (ref as any).syncTables : [];
              const merged = [...new Set([...persistedTables, ...usedTables])];
              if (merged.length > 0) setSyncTableList(merged);
              else if (ref.syncTargetTable) setSyncTableList([ref.syncTargetTable]);
              // Infer sync preset from tables
              const finalTables = merged.length > 0 ? merged : (ref.syncTargetTable ? [ref.syncTargetTable] : []);
              const inferredPreset = SYNC_PRESETS.find(
                (p) => p.tables.length > 0 && p.tables.every((t) => finalTables.includes(t)) && finalTables.every((t) => p.tables.includes(t))
              );
              setSyncPreset(inferredPreset?.value ?? (finalTables.length > 0 ? "CUSTOM" : ""));
            } catch { /* ignore — mappings optional */ }
          }
        }
      } finally { setLoading(false); }
    };
    init();
  }, [refId, viewOnly, isSsoParam]);

  const handleSave = async () => {
    setSubmitted(true);

    if (isSsoFeature) {
      if (!form.assignTpaId) { setFormError("Select a TPA."); return; }
      if (!form.assignLabel.trim()) { setFormError("Label is required."); return; }
      if (!form.assignButtonLabel.trim()) { setFormError("Button Label is required."); return; }
      if (ssoForm.ssoDeliveryMode === "LOCAL_REDIRECT") {
        if (!ssoForm.portalUrl.trim()) { setFormError("Portal URL is required."); return; }
        if (ssoForm.ssoTokenShape === "COMBINED_JSON" && !ssoForm.ssoTokenParamName.trim()) {
          setFormError("The combined value's param name is required."); return;
        }
      } else {
        if (!ssoForm.remoteApiUrl.trim()) { setFormError("The TPA's API URL is required."); return; }
        if (!ssoForm.remoteResponseDecryptKeyEnvName.trim()) {
          setFormError("The env var name for decrypting the TPA's reply is required."); return;
        }
      }
      if (!ssoForm.ssoKeyEnvName.trim()) { setFormError("The env var name for the SSO key is required."); return; }
      if (ssoForm.ssoIvMode === "FIXED" && !ssoForm.ssoIvEnvName.trim()) { setFormError("Env var name for the IV is required when IV mode is Fixed."); return; }
      if (!ssoForm.fieldMappings.length) { setFormError("Add at least one field to encrypt and send."); return; }
      for (const m of ssoForm.fieldMappings) {
        if (!m.externalFieldName.trim()) { setFormError("Every field needs an outbound param name."); return; }
        if (m.sourceType === "STATIC" && !m.staticValue?.trim()) { setFormError(`"${m.externalFieldName}" needs a static value.`); return; }
        if (m.sourceType !== "STATIC" && !m.sourceField) { setFormError(`"${m.externalFieldName}" needs a source field.`); return; }
      }

      setSaving(true); setFormError(null);
      try {
        // One atomic request writes the feature-config (button) and the SSO crypto
        // config together — either both land or neither does. (Previously two separate
        // requests, which could leave a feature-config row with no matching SSO config
        // if the second request failed after the first had already committed.)
        const combinedPayload = {
          tpaId: form.assignTpaId,
          featureTypeId: form.assignFeatureTypeId,
          featureConfigId: form.assignConfigId ?? undefined,
          label: form.assignLabel.trim(),
          buttonLabel: form.assignButtonLabel.trim(),
          displayOrder: form.assignDisplayOrder,
          isActive: true,
          // portalUrl is a legacy required column not used at all in REMOTE_API_REDIRECT
          // mode (the executor bypasses it entirely) — reuse the TPA's API URL so the
          // NOT NULL constraint is satisfied without asking for an irrelevant field.
          portalUrl: ssoForm.ssoDeliveryMode === "REMOTE_API_REDIRECT" ? (ssoForm.remoteApiUrl.trim() || "N/A") : ssoForm.portalUrl.trim(),
          ssoKeyEnvName: ssoForm.ssoKeyEnvName.trim(),
          ssoIvEnvName: ssoForm.ssoIvMode === "FIXED" ? ssoForm.ssoIvEnvName.trim() : null,
          ssoKeyEncoding: ssoForm.ssoKeyEncoding,
          ssoPadding: ssoForm.ssoPadding,
          ssoIvMode: ssoForm.ssoIvMode,
          ssoTextEncoding: ssoForm.ssoTextEncoding,
          ssoTokenShape: ssoForm.ssoTokenShape,
          ssoTokenParamName: ssoForm.ssoTokenShape === "COMBINED_JSON" ? ssoForm.ssoTokenParamName.trim() : null,
          ssoIvEnvelopeSeparator: ssoForm.ssoIvMode === "RANDOM_EMBEDDED" ? (ssoForm.ssoIvEnvelopeSeparator || ":") : ":",
          ssoUrlEncode: ssoForm.ssoUrlEncode,
          ssoOutputTransform: ssoRowsToObject(ssoForm.outputTransformRows),
          fieldMappings: ssoForm.fieldMappings.map(({ id: _id, ...m }) => m),
          ssoDeliveryMode: ssoForm.ssoDeliveryMode,
          remoteApiUrl: ssoForm.ssoDeliveryMode === "REMOTE_API_REDIRECT" ? ssoForm.remoteApiUrl.trim() : null,
          remoteApiMethod: ssoForm.remoteApiMethod || "POST",
          remoteApiHeaders: kvRowsToObject(ssoForm.remoteApiHeaderRows),
          remoteRequestPayloadKey: ssoForm.remoteRequestPayloadKey.trim() || "payload",
          remoteRequestExtraFields: kvRowsToObject(ssoForm.remoteRequestExtraFieldRows),
          remoteResponseDataPath: ssoForm.remoteResponseDataPath.trim() || "data",
          remoteResponseDecryptKeyEnvName: ssoForm.ssoDeliveryMode === "REMOTE_API_REDIRECT" ? ssoForm.remoteResponseDecryptKeyEnvName.trim() : null,
          remoteResponseRedirectUrlPath: ssoForm.remoteResponseRedirectUrlPath.trim() || "redirectUrl",
        };
        const res = await apiRequest(endPoints.tpaSsoConfigUpsertWithFeature, { method: "POST", data: combinedPayload });
        setSsoConfigId(res?.data?.ssoConfig?.id ?? ssoConfigId);
        const savedFeatureConfigId = res?.data?.featureConfig?.id ?? form.assignConfigId;
        if (savedFeatureConfigId) setSavedFormId(savedFeatureConfigId);

        // Same as ECard/Claims: only pop the credentials dialog for genuinely NEW
        // secured keys (ones not already on record before this save) — then land on
        // Add Config's next step instead of navigating away underneath the dialog.
        const newSsoSecuredKeys = collectSecuredKeys().filter(k => !prevSecuredKeys.includes(k.key));
        if (savedFeatureConfigId && newSsoSecuredKeys.length > 0) {
          openCredDialog(newSsoSecuredKeys);
        } else {
          navigate(`/tpa/${form.assignTpaId}/external-features`);
        }
      } catch (e: any) { setFormError(e?.message ?? "Failed to save."); }
      finally { setSaving(false); }
      return;
    }

    if (!form.label.trim()) {
      setFormError("Config name is required.");
      setSec((p) => ({ ...p, basic: true }));
      return;
    }
    if (!form.magicUrlApiUrl.trim()) {
      setFormError("API URL is required.");
      setSec((p) => ({ ...p, step2: true }));
      return;
    }
    if (isClaimSubmissionFeature) {
      if (!claimFormTypeChoice) { setFormError("Answer whether this TPA uses a separate API to submit bills."); setSec((p) => ({ ...p, feature: true })); return; }
      if (claimFormTypeChoice === "MULTI") {
        if (!submitMagicUrlApiUrl.trim()) { setFormError("Submit Claim API URL is required."); setSec((p) => ({ ...p, feature: true })); return; }
        if (!submitExecutionModeChoice) { setFormError("Select a Submission Execution Mode."); setSec((p) => ({ ...p, feature: true })); return; }
      }
    }
    setSaving(true); setFormError(null);
    try {
      const fieldHints = rowsToFieldHints(form.verificationTokenApiRows, form.magicUrlApiRows, form.mappingDefaults);
      const payload = {
        label: form.label.trim(), description: form.description.trim() || null, authType: form.authType, payloadFormat: form.payloadFormat,
        containerCategory: "ibp", verificationTokenApiUrl: form.verificationTokenApiUrl.trim() || null,
        verificationTokenApiMethod: form.verificationTokenApiMethod, verificationTokenApiPayload: rowsToPayload(form.verificationTokenApiRows, { configLabel: form.label, step: 1 }),
        verificationTokenApiHeaders: Object.keys(rowsToPayload(form.step1HeaderRows, { configLabel: form.label, step: 1, isHeader: true })).length ? rowsToPayload(form.step1HeaderRows, { configLabel: form.label, step: 1, isHeader: true }) : null,
        magicUrlApiUrl: form.magicUrlApiUrl.trim(), magicUrlApiMethod: form.magicUrlApiMethod, magicUrlApiPayload: rowsToPayload(form.magicUrlApiRows, { configLabel: form.label, step: 2 }),
        magicUrlApiHeaders: Object.keys(rowsToPayload(form.step2HeaderRows, { configLabel: form.label, step: 2, isHeader: true })).length ? rowsToPayload(form.step2HeaderRows, { configLabel: form.label, step: 2, isHeader: true }) : null,
        iss: form.iss.trim() || null, expiresIn: form.expiresIn.trim() || "10m",
        step1ResponseTokenKey: form.step1ResponseTokenKey.trim() || "verificationToken",
        step2ResponseDataKey: form.step2ResponseDataKey.trim() || "magicLink",
        isActive: form.isActive, fieldHints,
        flowType: form.flowType,
        syncScope: form.flowType === "SYNC" ? (form.syncScope || null) : null,
        syncSchedule: form.flowType === "SYNC" ? (form.syncSchedule.trim() || null) : null,
        syncTargetTable: form.flowType === "SYNC" ? (form.syncTargetTable.trim() || null) : null,
        syncDedupColumn: form.flowType === "SYNC" ? (form.syncDedupColumn.trim() || null) : null,
        syncTtlHours: form.flowType === "SYNC" ? (form.syncTtlHours || 24) : null,
        syncTables: form.flowType === "SYNC" && syncTableList.length > 0 ? syncTableList : null,
        basicAuthUser: form.authType === "BASIC_AUTH" ? (form.basicAuthUser.trim() || null) : null,
        basicAuthPassword: form.authType === "BASIC_AUTH" ? (form.basicAuthPassword.trim() || null) : null,
        tokenHeaderPrefix: form.tokenHeaderPrefix.trim() || "Bearer",
        authAppRefId: form.authAppRefId ?? null,
        individualEcardAppRefId: form.ecardResponseMode === "SEPARATE_APIS" ? (form.individualEcardAppRefId ?? null) : null,
        ecardArrayResponseKey: form.ecardResponseMode === "ARRAY_ALL_MEMBERS" ? (form.ecardArrayResponseKey.trim() || null) : null,
        ecardRelationMatchField: form.ecardResponseMode === "ARRAY_ALL_MEMBERS" ? (form.ecardRelationMatchField.trim() || null) : null,
        ecardResponseMode: form.ecardResponseMode || null,
      };
      let savedRefId: number | undefined = isEdit ? Number(refId) : undefined;
      if (!isEdit) { const created = await apiRequest(endPoints.tpaFeatureAppRefs, { method: "POST", data: payload }); savedRefId = created?.data?.id; if (savedRefId) setSavedFormId(savedRefId); }
      else { await apiRequest(endPoints.tpaFeatureAppRefById(Number(refId)), { method: "PUT", data: payload }); }

      // Save response mappings (upsert all — both step 1 and step 2)
      if (savedRefId) {
        const allMappings = [
          ...step1Mappings.filter((r) => r.responseKey.trim()).map((r, i) => ({
            step: 1, responseKey: r.responseKey, targetType: r.targetType,
            outputKey: r.outputKey, targetTable: r.targetTable ?? null,
            isAuthToken: r.isAuthToken, isPrimaryFk: r.isPrimaryFk ?? false, displayOrder: i,
          })),
          ...step2Mappings.filter((r) => r.responseKey.trim()).map((r, i) => ({
            step: 2, responseKey: r.responseKey, targetType: r.targetType,
            outputKey: r.outputKey, targetTable: r.targetTable ?? null,
            isAuthToken: false, displayOrder: i,
          })),
        ];
        try {
          await apiRequest((endPoints as any).tpaFeatureAppRefResponseMappings(savedRefId), { method: "POST", data: allMappings });
        } catch { /* non-blocking — main ref is saved */ }
      }

      // Claim Submission, "different APIs": build/save the Submit Claim Application Ref
      // too — shares Auth Type/credentials with the Intimate ref above (every TPA seen so
      // far authenticates identically for both calls), but has its own URL, payload,
      // headers, and response mappings.
      let submitSavedRefId: number | undefined = submitRefId ?? undefined;
      if (isClaimSubmissionFeature && claimFormTypeChoice === "MULTI") {
        const submitFieldHints = rowsToFieldHints(form.verificationTokenApiRows, submitMagicUrlApiRows, form.mappingDefaults);
        const submitPayload = {
          label: `${form.label.trim()} - Submit`, description: form.description.trim() || null, authType: form.authType, payloadFormat: form.payloadFormat,
          containerCategory: "ibp", verificationTokenApiUrl: form.verificationTokenApiUrl.trim() || null,
          verificationTokenApiMethod: form.verificationTokenApiMethod, verificationTokenApiPayload: rowsToPayload(form.verificationTokenApiRows, { configLabel: form.label, step: 1 }),
          verificationTokenApiHeaders: Object.keys(rowsToPayload(form.step1HeaderRows, { configLabel: form.label, step: 1, isHeader: true })).length ? rowsToPayload(form.step1HeaderRows, { configLabel: form.label, step: 1, isHeader: true }) : null,
          magicUrlApiUrl: submitMagicUrlApiUrl.trim(), magicUrlApiMethod: submitMagicUrlApiMethod,
          magicUrlApiPayload: rowsToPayload(submitMagicUrlApiRows, { configLabel: form.label, step: 2 }),
          magicUrlApiHeaders: Object.keys(rowsToPayload(submitStep2HeaderRows, { configLabel: form.label, step: 2, isHeader: true })).length ? rowsToPayload(submitStep2HeaderRows, { configLabel: form.label, step: 2, isHeader: true }) : null,
          iss: form.iss.trim() || null, expiresIn: form.expiresIn.trim() || "10m",
          step1ResponseTokenKey: form.step1ResponseTokenKey.trim() || "verificationToken",
          step2ResponseDataKey: submitStep2ResponseDataKey.trim() || "magicLink",
          isActive: form.isActive, fieldHints: submitFieldHints,
          flowType: "DIRECT_CALL",
          syncScope: null, syncSchedule: null, syncTargetTable: null, syncDedupColumn: null, syncTtlHours: null, syncTables: null,
          basicAuthUser: form.authType === "BASIC_AUTH" ? (form.basicAuthUser.trim() || null) : null,
          basicAuthPassword: form.authType === "BASIC_AUTH" ? (form.basicAuthPassword.trim() || null) : null,
          // Shares Step 1 token/caching with the Intimate ref for auth types that have a
          // real login step; a no-op for DIRECT/HEADER_CREDENTIALS (our two real TPAs).
          authAppRefId: savedRefId ?? null,
        };
        if (submitRefId) {
          await apiRequest(endPoints.tpaFeatureAppRefById(submitRefId), { method: "PUT", data: submitPayload });
          submitSavedRefId = submitRefId;
        } else {
          const createdSubmit = await apiRequest(endPoints.tpaFeatureAppRefs, { method: "POST", data: submitPayload });
          submitSavedRefId = createdSubmit?.data?.id;
          if (submitSavedRefId) setSubmitRefId(submitSavedRefId);
        }

        if (submitSavedRefId) {
          const submitMappings = submitStep2Mappings.filter((r) => r.responseKey.trim()).map((r, i) => ({
            step: 2, responseKey: r.responseKey, targetType: r.targetType,
            outputKey: r.outputKey, targetTable: r.targetTable ?? null,
            isAuthToken: false, displayOrder: i,
          }));
          try {
            await apiRequest((endPoints as any).tpaFeatureAppRefResponseMappings(submitSavedRefId), { method: "POST", data: submitMappings });
          } catch { /* non-blocking */ }
        }
      }

      if (form.assignFeatureTypeId && savedRefId) {
        const fieldMappings = Object.entries(form.mappingDefaults).map(([name, { sourceType, sourceField }]) => ({ externalFieldName: name, sourceType, sourceField: sourceField ?? null, staticValue: null, isRequired: true }));
        const assignPayload = {
          featureTypeId: form.assignFeatureTypeId, tpaId: form.assignTpaId || null, appRefId: savedRefId,
          label: form.assignLabel || featureTypes.find((f) => f.id === form.assignFeatureTypeId)?.label || form.label,
          buttonLabel: form.assignButtonLabel || featureTypes.find((f) => f.id === form.assignFeatureTypeId)?.label || form.label,
          displayOrder: form.assignDisplayOrder, isActive: true, fieldMappings,
          ...(isClaimSubmissionFeature ? {
            apiType: "INTIMATE_CLAIM",
            claimFormType: claimFormTypeChoice || null,
          } : {}),
        };
        if (form.assignConfigId) await apiRequest(endPoints.tpaFeatureConfigById(form.assignConfigId), { method: "PUT", data: assignPayload });
        else await apiRequest(endPoints.tpaFeatureAllConfigs, { method: "POST", data: assignPayload });
      }

      // Tie the Submit Claim ref to its own feature-config row (apiType = SUBMIT_CLAIM).
      if (isClaimSubmissionFeature && claimFormTypeChoice === "MULTI" && submitSavedRefId) {
        const submitAssignPayload = {
          featureTypeId: form.assignFeatureTypeId, tpaId: form.assignTpaId || null, appRefId: submitSavedRefId,
          label: `${form.assignLabel || form.label} - Submit`, buttonLabel: form.assignButtonLabel || form.label,
          displayOrder: form.assignDisplayOrder, isActive: true, fieldMappings: [],
          apiType: "SUBMIT_CLAIM", submitExecutionMode: submitExecutionModeChoice || null,
        };
        if (submitAssignConfigId) await apiRequest(endPoints.tpaFeatureConfigById(submitAssignConfigId), { method: "PUT", data: submitAssignPayload });
        else {
          const createdAssign = await apiRequest(endPoints.tpaFeatureAllConfigs, { method: "POST", data: submitAssignPayload });
          if (createdAssign?.data?.id) setSubmitAssignConfigId(createdAssign.data.id);
        }
      } else if (claimFormTypeChoice === "SINGLE" && submitAssignConfigId) {
        // Switched back from "different APIs" to "one API" — remove the now-orphaned
        // Submit Claim feature-config tie (the underlying app ref, if any, is left
        // alone in case the admin wants to reuse it elsewhere).
        await apiRequest(endPoints.tpaFeatureConfigById(submitAssignConfigId), { method: "DELETE" });
        setSubmitAssignConfigId(null);
      }
      // Delete orphaned secret keys — fields that were secured before but are now removed or unlocked
      const allCurrentSecuredKeys = collectSecuredKeys().map(k => k.key);
      const orphanedKeys = prevSecuredKeys.filter(k => !allCurrentSecuredKeys.includes(k));
      if (orphanedKeys.length > 0 && savedRefId) {
        try {
          await apiRequest(endPoints.tpaFeatureDeleteSecretKeys(savedRefId), { method: "DELETE", data: { keys: orphanedKeys } });
        } catch { /* non-fatal — secret cleanup failure shouldn't block navigation */ }
      }
      // Only open cred dialog for NEW secured keys (not already snapshotted from previous save)
      const newSecuredKeys = collectSecuredKeys().filter(k => !prevSecuredKeys.includes(k.key));
      if (newSecuredKeys.length > 0) {
        openCredDialog(newSecuredKeys);
      } else if (!isEdit && savedRefId) {
        // Fresh create — land on the new ref's own edit page instead of the list so
        // Test API Connection is available right away, without clicking back in.
        navigate((isAdminContext ? '/admin-settings/external-api-configs/' : '/tpa/external-api-configs/') + savedRefId + '/edit' + (isSsoParam ? '?type=sso' : ''));
      } else {
        navigate(listPath);
      }
    } catch (e: any) { setFormError(e?.message ?? "Failed to save."); }
    finally { setSaving(false); }
  };

  const exportEnvExample = () => {
    const label = form.label.trim() || "config";
    const lines: string[] = [
      `# Credentials setup for: ${label}`,
      `# Basic Auth credentials → AWS Secrets Manager (no .env needed, no restart on change).`,
      `# Payload secured fields → copy into server .env file.`,
      ``,
    ];
    const step2Secured = form.magicUrlApiRows.filter((r) => r.secured && r.key.trim());
    if (form.authAppRefId) {
      // Step 1 is owned by the linked config — its keys must be set there, not here
      const linkedLabel = authRefSuggestions.find((s) => s.id === form.authAppRefId)?.label ?? `App Ref #${form.authAppRefId}`;
      lines.push(`# Step 1 — Auth credentials`);
      lines.push(`# This config delegates Step 1 to: "${linkedLabel}"`);
      lines.push(`# Set the Step 1 .env keys on that config — they are shared at runtime.`);
      lines.push(``);
    } else {
      // BASIC_AUTH: credentials stored in AWS Secrets Manager via env-var ARN indirection
      if (form.authType === "BASIC_AUTH") {
        const { envVarName } = deriveBasicAuthSecretPaths(label);
        // Fall back to legacy env keys if the fields still use {{env:KEY}}
        const userIsEnv = (form.basicAuthUser ?? "").startsWith("{{env:");
        const passIsEnv = (form.basicAuthPassword ?? "").startsWith("{{env:");
        if (userIsEnv || passIsEnv) {
          const { userKey, passKey } = deriveBasicAuthEnvKeys(label);
          lines.push(`# Step 1 — Basic Auth credentials (legacy .env)`);
          lines.push(`${userKey}=`);
          lines.push(`${passKey}=`);
        } else {
          const { userKey, passKey, envVarName: arn } = deriveBasicAuthSecretPaths(label);
          lines.push(`# Step 1 — Basic Auth (AWS Secrets Manager)`);
          lines.push(`# Add these keys to the secret at ${arn}:`);
          lines.push(`${userKey}=`);
          lines.push(`${passKey}=`);
        }
        lines.push(``);
      }
      const step1Secured = form.verificationTokenApiRows.filter((r) => r.secured && r.key.trim());
      const step1HdrSecured = form.step1HeaderRows.filter((r) => r.secured && r.key.trim());
      if (step1Secured.length > 0 || step1HdrSecured.length > 0) {
        lines.push(`# Step 1 — Auth credentials (body)`);
        step1Secured.forEach((r) => lines.push(`${deriveEnvKey(label, 1, r.key)}=`));
        if (step1HdrSecured.length > 0) {
          lines.push(``);
          lines.push(`# Step 1 — Auth credentials (headers)`);
          step1HdrSecured.forEach((r) => lines.push(`${deriveEnvKey(label, 1, r.key, true)}=`));
        }
        lines.push(``);
      }
    }
    const step2HdrSecured = form.step2HeaderRows.filter((r) => r.secured && r.key.trim());
    if (step2Secured.length > 0 || step2HdrSecured.length > 0) {
      lines.push(`# Step 2 — Data API credentials (body)`);
      step2Secured.forEach((r) => lines.push(`${deriveEnvKey(label, 2, r.key)}=`));
      if (step2HdrSecured.length > 0) {
        lines.push(``);
        lines.push(`# Step 2 — Data API credentials (headers)`);
        step2HdrSecured.forEach((r) => lines.push(`${deriveEnvKey(label, 2, r.key, true)}=`));
      }
      lines.push(``);
    }
    const hasAnyKeys = form.authType === "BASIC_AUTH" || (!form.authAppRefId && form.verificationTokenApiRows.some((r) => r.secured && r.key.trim())) || step2Secured.length > 0;
    if (!form.authAppRefId && !hasAnyKeys) {
      lines.push(`# No secured (env-var) fields found in this config.`);
    }
    setEnvDialogContent(lines.join("\n"));
    setEnvDialogOpen(true);
  };

  const runTest = async (step: 1 | 2) => {
    if (!activeId) return;
    setTestLoading(true); setTestResult(null);
    console.log(`[runTest] start step=${step} appRefId=${activeId}`);
    try {
      console.log("[runTest] calling testApi...");
      const res = await apiRequest(endPoints.tpaFeatureTestApi, { method: "POST", data: { appRefId: activeId, staticValues: testInputs, step } });
      console.log("[runTest] testApi response received:", res);
      const result = res?.data ?? res;
      setTestResult(result);

      // Auto-discover: populate response mapping rows from flattened test response
      // Also auto-suggest outputKey and isAuthToken based on key name heuristics
      const suggestStep1 = (key: string): { outputKey: string; isAuthToken: boolean } => {
        const k = key.toLowerCase();
        if (/token|access_token|bearer|auth/.test(k)) return { outputKey: key, isAuthToken: true };
        return { outputKey: key, isAuthToken: false };
      };
      const suggestStep2 = (key: string, flowType: string): { outputKey: string } => {
        const k = key.toLowerCase();
        if (/redirect.?url|magic.?url|launch.?url|portal.?url|link/.test(k) || (flowType === "REDIRECT" && /url|link/.test(k)))
          return { outputKey: "REDIRECT_URL" };
        if (/download.?url|pdf|report/.test(k)) return { outputKey: "DOWNLOAD_URL" };
        if (/member.?id|mbr.?id|emp.?id/.test(k)) return { outputKey: "MEMBER_ID" };
        if (/member.?name|emp.?name|patient.?name/.test(k)) return { outputKey: "MEMBER_NAME" };
        if (/policy.?no|policy.?num/.test(k)) return { outputKey: "POLICY_NUMBER" };
        if (/valid.?till|expir|validity/.test(k)) return { outputKey: "VALID_TILL" };
        if (/balance|sum.?insured|cover/.test(k)) return { outputKey: "BALANCE" };
        if (/tpa.?id|insurer.?id/.test(k)) return { outputKey: "TPA_ID" };
        return { outputKey: "" };
      };

      // Try to match a response key to a column name in the given table
      const autoMatchColumn = (responseKey: string, tableName: string | null): string => {
        if (!tableName) return "";
        const table = dbSchema.find((t) => t.tableName === tableName);
        if (!table) return "";
        const norm = responseKey.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const exact = table.columns.find((c) => c.name.toLowerCase() === norm);
        if (exact) return exact.name;
        const startsWith = table.columns.find((c) => c.name.toLowerCase().startsWith(norm) || norm.startsWith(c.name.toLowerCase()));
        return startsWith?.name ?? "";
      };

      const autoDiscover = (flattened: Record<string, string> | undefined, existing: ResponseMappingRow[], stepNum: 1 | 2): ResponseMappingRow[] => {
        if (!flattened || Object.keys(flattened).length === 0) return existing;
        const existingKeys = new Set(existing.map((r) => r.responseKey));
        const newRows: ResponseMappingRow[] = Object.entries(flattened).map(([key, val], i) => {
          const suggested = stepNum === 1 ? suggestStep1(key) : suggestStep2(key, form.flowType);
          const defaultTargetType: TargetType = stepNum === 1 ? "PLACEHOLDER" : (form.flowType === "SYNC" ? "DB_COLUMN" : "STANDARD_KEY");
          const defaultTargetTable = (stepNum === 2 && form.flowType === "SYNC" && form.syncTargetTable) ? form.syncTargetTable : null;
          const autoCol = (stepNum === 2 && form.flowType === "SYNC") ? autoMatchColumn(key, defaultTargetTable) : "";
          return {
            responseKey: key, sampleValue: truncateLongStrings(val),
            targetType: defaultTargetType,
            outputKey: autoCol || suggested.outputKey,
            targetTable: defaultTargetTable,
            isAuthToken: stepNum === 1 ? (suggested as any).isAuthToken : false,
            isPrimaryFk: false,
            displayOrder: existing.length + i,
          };
        });
        // Merge: update sampleValue for existing keys, add new keys
        const merged = existing.map((r) => ({ ...r, sampleValue: truncateLongStrings(flattened[r.responseKey]) ?? r.sampleValue }));
        newRows.filter((r) => !existingKeys.has(r.responseKey)).forEach((r) => merged.push(r));
        return merged;
      };

      const steps: any[] = result?.steps ?? [];
      const s1 = steps.find((s: any) => s.step === 1);
      const s2 = steps.find((s: any) => s.step === 2);
      console.log("[runTest] steps:", steps.length, "s1.flattened keys:", Object.keys(s1?.flattened ?? {}).length, "s2.flattened keys:", Object.keys(s2?.flattened ?? {}).length);
      if (s1?.flattened) {
        setStep1FlatKeys(Object.keys(s1.flattened));
        const discovered1 = autoDiscover(s1.flattened, step1Mappings, 1);
        startTransition(() => setStep1Mappings(discovered1));
        // Auto-fill Response Token Key from the row flagged as auth token
        const authRow = discovered1.find((r) => r.isAuthToken && r.responseKey);
        if (authRow) patch("step1ResponseTokenKey", authRow.responseKey);
      }
      if (s2?.flattened) {
        setStep2FlatKeys(Object.keys(s2.flattened));
        setStep2FlattenedData(truncateLongStrings(s2.flattened));
        const discovered2 = autoDiscover(s2.flattened, step2Mappings, 2);
        startTransition(() => setStep2Mappings(discovered2));
        // Auto-fill Response Data Key from the primary output key row (REDIRECT_URL / DOWNLOAD_URL)
        const primaryRow = discovered2.find((r) => ["REDIRECT_URL", "DOWNLOAD_URL"].includes(r.outputKey) && r.responseKey);
        if (primaryRow) patch("step2ResponseDataKey", primaryRow.responseKey);
      }
      // Auto-open Response Mappings section after successful test
      if ((s1?.flattened || s2?.flattened)) {
        startTransition(() => setSec((p) => ({ ...p, response: true })));
      }
    } catch (e: any) { console.error("[runTest] error:", e); setTestResult({ error: e?.message ?? "Test failed" }); }
    finally { console.log("[runTest] finally: setTestLoading(false)"); setTestLoading(false); }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px"><CircularProgress /></Box>;

  // Includes Submit Claim's own placeholders (claimReferenceId, payeeName, bankAccountNo,
  // etc.) too, not just Intimate's — otherwise Submit's fields never got a "where does
  // this value come from" mapping at all. Names don't collide in practice (Intimate and
  // Submit use different canonical field names), so one shared table covers both.
  const allDynamic = [
    ...form.verificationTokenApiRows, ...form.magicUrlApiRows, ...form.step1HeaderRows, ...form.step2HeaderRows,
    ...submitMagicUrlApiRows, ...submitStep2HeaderRows,
  ].filter((r) => r.valueType === "dynamic").map((r) => r.placeholderName.trim() || r.key.trim()).filter(Boolean);
  const uniqueDynamic = [...new Set(allDynamic)];

  // Same fallback used by openCredDialog — URL param refId is undefined right after a
  // fresh save (no navigation to the /edit URL happens), but savedFormId already holds
  // the newly-created row's id, so Test API Connection can still work immediately.
  const activeId = savedFormId ?? (refId ? Number(refId) : undefined);

  const disabled = isView;

  return (
    <Box sx={{ p: 5, minHeight: "100vh", bgcolor: "#f4f6fb" }}>

      {/* Breadcrumb row + action buttons */}
      <Box sx={{ maxWidth: "1254px", mx: "auto" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <CommonBreadcrumb crumbs={breadcrumbs} />
          <Box display="flex" gap={1.5} alignItems="center">
            {(form.authType === "BASIC_AUTH" || [...form.verificationTokenApiRows, ...form.magicUrlApiRows].some((r) => r.secured)) && (
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportEnvExample}
                sx={{ textTransform: "none", fontSize: "0.82rem", borderColor: "#90a4ae", color: "#546e7a",
                  "&:hover": { borderColor: "#546e7a", bgcolor: "#eceff1" } }}>
                View .env Keys
              </Button>
            )}
            {isView ? (
              <Button variant="contained" startIcon={<EditIcon />}
                onClick={() => navigate(
                  (isAdminContext ? '/admin-settings/external-api-configs/' : '/tpa/external-api-configs/') + refId + '/edit' + (isSsoParam ? '?type=sso' : '')
                )}
                sx={{ textTransform: "none", fontWeight: 600 }}>
                Edit
              </Button>
            ) : (
              <>
                <Button variant="outlined" onClick={() => navigate(listPath)}
                  sx={{ textTransform: "none", color: "#555", borderColor: "#ccc" }}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={handleSave} disabled={saving}
                  startIcon={saving ? <CircularProgress size={16} /> : undefined}
                  sx={{ textTransform: "none", fontWeight: 600 }}>
                  {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Config"}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {formError && <Alert severity="error" sx={{ mb: 2, maxWidth: "1254px", mx: "auto" }}>{formError}</Alert>}
      {isEdit && !form.authAppRefId && linkedByRefs.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2, maxWidth: "1254px", mx: "auto" }}>
          <Typography variant="body2" sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
            This config's Step 1 is shared — editing Step 1 here will affect: {linkedByRefs.map((r) => `"${r.label}"`).join(", ")}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "0.77rem", color: "#7a4f00", mt: 0.3 }}>
            Those configs link to this Alankit TPA auth. Any credential or URL change here applies to all of them.
          </Typography>
        </Alert>
      )}

      {/* Form sections */}
      <Box sx={{ mt: 4, maxWidth: "1254px", mx: "auto" }}>


        {/* Expand / Collapse all + global secret manager button */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Box display="flex" gap={1}>
            {refId && (() => {
              const securedKeys = collectSecuredKeys();
              if (securedKeys.length === 0) return null;
              return (
                <Button size="small" variant="outlined" startIcon={<LockIcon sx={{ fontSize: 14 }} />}
                  onClick={() => openCredDialog(securedKeys)}
                  sx={{ textTransform: "none", fontSize: "0.75rem", borderColor: "#7b1fa2", color: "#7b1fa2", "&:hover": { borderColor: "#4a148c", bgcolor: "#f3e5f5" } }}>
                  Update Credentials in Secret Manager ({securedKeys.length})
                </Button>
              );
            })()}
          </Box>
          <Box display="flex" gap={1}>
            <Button size="small" onClick={expandAll} variant="text"
              sx={{ textTransform: "none", fontSize: "0.78rem", color: "#666" }}>
              Expand All
            </Button>
            <Button size="small" onClick={collapseAll} variant="text"
              sx={{ textTransform: "none", fontSize: "0.78rem", color: "#666" }}>
              Collapse All
            </Button>
          </Box>
        </Box>

        {/* Feature Assignment — FIRST so TPA + feature type auto-fill Basic Details */}
        <CollapsibleSection title="Feature Assignment" open={sec.feature} onToggle={() => toggleSec("feature")}
          badge={!form.assignFeatureTypeId && !disabled ? <Chip label="optional" size="small" sx={{ ml: 1, fontSize: "0.65rem", height: 18, bgcolor: "#f5f5f5", color: "#9e9e9e", border: "1px solid #e0e0e0" }} /> : undefined}>
          <Box sx={{ maxWidth: 400, width: "100%" }}>
            <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Feature Type</Typography>
            <Autocomplete
              disabled={disabled}
              options={featureTypes.filter((ft) => ft.isActive)}
              value={featureTypes.find((ft) => ft.id === form.assignFeatureTypeId) ?? null}
              onChange={(_, ft) => {
                if (!ft) { patch("assignFeatureTypeId", 0); return; }
                const key = ft.key?.toUpperCase() ?? "";
                // Auto-preset flow type + sync config based on feature type key.
                // Claim Submission (push, on-demand, one request per user action) is
                // checked first and excluded from the sync heuristic below — it isn't
                // a scheduled pull like "Claims"/"Hospital Network" even though its key
                // contains CLAIM.
                const isClaimSubmission = key === CLAIM_SUBMISSION_FEATURE_KEY;
                const isSync = !isClaimSubmission && /CLAIM|HOSPITAL|HOSPITAL_NETWORK|CLAIMS_SETTLEMENT/.test(key);
                const isEcard = /ECARD|E_CARD/.test(key);
                const isPortalLogin = /PORTAL|TPA_PORTAL|PORTAL_LOGIN|LOGIN/.test(key);
                const syncPresetKey = /CLAIM/.test(key) ? "CLAIMS_SETTLEMENT" : /HOSPITAL/.test(key) ? "HOSPITAL_NETWORK" : "";
                const syncPresetMeta = !isClaimSubmission ? SYNC_PRESETS.find((p) => p.value === syncPresetKey) : undefined;
                setForm((p) => ({
                  ...p,
                  assignFeatureTypeId: ft.id,
                  assignLabel: p.assignLabel || ft.label,
                  assignButtonLabel: p.assignButtonLabel || ft.label,
                  label: labelManuallyEdited ? p.label : (tpas.find((t) => t.id === p.assignTpaId)?.tpaName ? buildEcardLabel(tpas.find((t) => t.id === p.assignTpaId)!.tpaName, ft.label, isEcard ? p.ecardCardType : "") : ft.label),
                  description: p.description || ft.description || "",
                  // Auto-set flow type: Claim Submission → DIRECT_CALL, eCard → DISPLAY, Portal Login → REDIRECT, Sync → SYNC
                  flowType: isClaimSubmission ? "DIRECT_CALL" : isSync ? "SYNC" : (isEcard ? "DISPLAY" : (isPortalLogin ? "REDIRECT" : p.flowType)),
                  // Auto-set sync defaults when a SYNC preset is identified
                  ...(syncPresetMeta ? {
                    syncScope: "PER_POLICY",
                    syncSchedule: "0 17 * * *",
                    syncTargetTable: syncPresetMeta.primaryTable,
                    syncDedupColumn: syncPresetMeta.dedupColumn,
                    syncTtlHours: 24,
                  } : {}),
                }));
                if (syncPresetMeta) setSyncPreset(syncPresetKey);
                setSec((p) => ({ ...p, basic: true }));
              }}
              getOptionLabel={(ft) => ft.label} isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(params) => <TextField {...params} size="small" placeholder="E-card, Claims, etc." />}
              renderOption={(props, ft) => <Box component="li" {...props} key={ft.id} sx={{ flexDirection: "column", alignItems: "flex-start !important", py: "6px !important" }}><span style={{ fontSize: "0.875rem", color: "#1a1a1a" }}>{ft.label}</span>{ft.description && <span style={{ fontSize: "0.72rem", color: "#777" }}>{ft.description}</span>}</Box>}
            />
          </Box>
          <Box sx={{ maxWidth: 400, width: "100%" }}>
            <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>TPA <Typography component="span" variant="caption" sx={{ color: "#bbb" }}>(optional — assign from TPA page later)</Typography></Typography>
            <Autocomplete
              disabled={disabled}
              options={tpas} value={tpas.find((t) => t.id === form.assignTpaId) ?? null}
              onChange={(_, t) => {
                patch("assignTpaId", t?.id ?? 0);
                const ft = featureTypes.find((f) => f.id === form.assignFeatureTypeId);
                if (t && ft) {
                  const isEcard = /ECARD|E_CARD/.test(ft.key?.toUpperCase() ?? "");
                  setForm((p) => {
                    const autoName = buildEcardLabel(t.tpaName, ft.label, isEcard ? p.ecardCardType : "");
                    return labelManuallyEdited ? { ...p, assignTpaId: t.id } : { ...p, assignTpaId: t.id, label: autoName };
                  });
                  setSec((p) => ({ ...p, basic: true }));
                }
              }}
              getOptionLabel={(t) => t.tpaName} isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(params) => <TextField {...params} size="small" placeholder="Search TPA…" />}
              renderOption={(props, t) => <Box component="li" {...props} key={t.id} sx={{ py: "6px !important" }}><span style={{ fontSize: "0.875rem", color: "#1a1a1a" }}>{t.tpaName}</span></Box>}
            />
          </Box>
          {/* E-card only: drives the auto-generated Config Name so Family/Individual configs on
              the same TPA don't collide on an identical auto-name. Purely a UI naming helper —
              nothing here is saved to the backend beyond whatever ends up in Config Name itself. */}
          {isEcardFeature && (
            <Box sx={{ maxWidth: 400, width: "100%" }}>
              <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Card Type</Typography>
              <ToggleButtonGroup exclusive size="small" value={form.ecardCardType || null} disabled={disabled}
                onChange={(_, val) => {
                  const cardType = (val ?? "") as "" | "FAMILY" | "INDIVIDUAL";
                  const ft = featureTypes.find((f) => f.id === form.assignFeatureTypeId);
                  const t = tpas.find((tp) => tp.id === form.assignTpaId);
                  setForm((p) => ({
                    ...p,
                    ecardCardType: cardType,
                    label: (labelManuallyEdited || !ft || !t) ? p.label : buildEcardLabel(t.tpaName, ft.label, cardType),
                  }));
                }}>
                <ToggleButton value="FAMILY" sx={{ textTransform: "none", px: 2 }}>Family</ToggleButton>
                <ToggleButton value="INDIVIDUAL" sx={{ textTransform: "none", px: 2 }}>Individual</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}
          {form.assignFeatureTypeId ? (
            <>
              <Box sx={{ maxWidth: 400, width: "100%" }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Label</Typography>
                <TextField fullWidth size="small" disabled={disabled} value={form.assignLabel} onChange={(e) => patch("assignLabel", e.target.value)} />
              </Box>
              <Box sx={{ maxWidth: 400, width: "100%" }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Button Label</Typography>
                <TextField fullWidth size="small" disabled={disabled} value={form.assignButtonLabel} onChange={(e) => patch("assignButtonLabel", e.target.value)}
                  placeholder="e.g. View E-Card, Check Claims" />
              </Box>
              <Box sx={{ maxWidth: 130, width: "100%" }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Display Order</Typography>
                <TextField fullWidth size="small" type="number" disabled={disabled} value={form.assignDisplayOrder}
                  onChange={(e) => patch("assignDisplayOrder", Number(e.target.value))} />
              </Box>

              {/* Claim Submission — Basic Details/API Call above always represent the
                  Intimate Claim call. Answering "yes" here reveals a second, parallel
                  API Call + Response Mappings section further down for Submit Claim —
                  everything stays on this one screen, tied together on save. */}
              {isClaimSubmissionFeature && (
                <Box sx={{ width: "100%", bgcolor: "#f3f0ff", border: "1.5px solid #ded4fb", borderRadius: 2, p: 2.5, display: "flex", flexWrap: "wrap", gap: "16px 32px" }}>
                  <Box sx={{ width: "100%", maxWidth: 460 }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: "#4527a0", textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.68rem" }} display="block" mb={1}>
                      Claim Submission
                    </Typography>
                    <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>
                      Does this TPA use a different, separate API to submit bills afterward?
                    </Typography>
                    <TextField
                      select fullWidth size="small" disabled={disabled} value={claimFormTypeChoice}
                      onChange={(e) => handleClaimFormTypeChoice(e.target.value as "SINGLE" | "MULTI")}
                      SelectProps={{ native: true }}
                      helperText={claimFormTypeChoice === "MULTI" ? "Fill in the Submit Claim sections further down this page too." : "No — this Application Ref above fully submits the claim by itself."}
                    >
                      <option value="">— Select —</option>
                      <option value="SINGLE">No — one API call fully submits the claim</option>
                      <option value="MULTI">Yes — bills are submitted later via a separate API</option>
                    </TextField>
                  </Box>
                  {claimFormTypeChoice === "MULTI" && (
                    <Box sx={{ maxWidth: 400, width: "100%" }}>
                      <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Submission Execution Mode</Typography>
                      <TextField
                        select fullWidth size="small" disabled={disabled} value={submitExecutionModeChoice}
                        onChange={(e) => setSubmitExecutionModeChoice(e.target.value as any)}
                        SelectProps={{ native: true }}
                        helperText="SINGLE_CALL: all fields + every document in one request (FHPL). PER_DOCUMENT: one request per document, looped (Health India)."
                      >
                        <option value="">— Select —</option>
                        <option value="SINGLE_CALL">SINGLE_CALL — one request, all documents together</option>
                        <option value="PER_DOCUMENT">PER_DOCUMENT — one request per document</option>
                      </TextField>
                    </Box>
                  )}
                </Box>
              )}
            </>
          ) : !disabled && (
            <Typography variant="caption" style={{ color: "#aaa", fontStyle: "italic" }}>Select a Feature Type above to configure assignment details.</Typography>
          )}
          {form.assignConfigId && <Alert severity="info" sx={{ py: 0.5, width: "100%" }}>Existing assignment found — saving will update it.</Alert>}
        </CollapsibleSection>

        {/* Everything below is AppRef/API-call config — not applicable to SSO */}
        {!isSsoFeature && (
        <>
        {/* Basic Details */}
        <CollapsibleSection title="Basic Details" open={sec.basic} onToggle={() => toggleSec("basic")}>
          {/* Row 1: Config Name (wide) + Auth Type side-by-side */}
          <Box sx={{ width: "100%", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 3, alignItems: "flex-start" }}>
            <Box>
              <Typography variant="caption" style={{ color: submitted && !form.label.trim() ? "#d32f2f" : "#666" }} display="block" mb={0.5} fontWeight={600}>Config Name *</Typography>
              <TextField fullWidth size="small" disabled={disabled} value={form.label}
                onChange={(e) => { patch("label", e.target.value); setLabelManuallyEdited(true); }}
                placeholder="e.g. Dawn TPA E-card, Good Health Claims"
                error={submitted && !form.label.trim()}
                helperText={submitted && !form.label.trim() ? "Required" : "Auto-filled from Feature + TPA above"} />
            </Box>
            <Box>
              <Typography variant="caption" style={{ color: "#666" }} display="block" mb={0.5} fontWeight={600}>Auth Type</Typography>
            <Autocomplete
              disabled={disabled}
              options={AUTH_TYPES}
              value={AUTH_TYPES.find((a) => a.value === form.authType) ?? AUTH_TYPES[0]}
              onChange={(_, a) => {
                if (!a) return;
                patch("authType", a.value);
                // Auto-expand Step 1 when switching away from DIRECT
                if (a.value !== "DIRECT") setSec((p) => ({ ...p, step1: true }));
              }}
              getOptionLabel={(a) => a.label}
              isOptionEqualToValue={(a, b) => a.value === b.value}
              disableClearable
              renderInput={(params) => <TextField {...params} size="small" />}
              renderOption={(props, a) => (
                <Box component="li" {...props} key={a.value} sx={{ flexDirection: "column", alignItems: "flex-start !important", py: "6px !important" }}>
                  <span style={{ fontSize: "0.875rem", color: "#1a1a1a", fontWeight: 600 }}>{a.label}</span>
                  <span style={{ fontSize: "0.72rem", color: "#777" }}>{a.description}</span>
                </Box>
              )}
            />
            </Box>
          </Box>

          {(form.authType === "SESSION" || form.authType === "DIRECT") && (
            <Box sx={{ width: "100%", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 3, alignItems: "flex-start" }}>
              <Box />
              <Box>
                <Typography variant="caption" style={{ color: "#666" }} display="block" mb={0.5} fontWeight={600}>
                  Authorization Header Prefix
                </Typography>
                <TextField fullWidth size="small" disabled={disabled} value={form.tokenHeaderPrefix}
                  onChange={(e) => patch("tokenHeaderPrefix", e.target.value)}
                  placeholder="Bearer"
                  helperText='The word before the token, e.g. "Bearer" or "Token" — most TPAs use Bearer, some use a different word' />
              </Box>
            </Box>
          )}

          {/* Row 2: Description — full width */}
          <Box sx={{ width: "100%" }}>
            <Typography variant="caption" style={{ color: "#666" }} display="block" mb={0.5} fontWeight={600}>Description</Typography>
            <TextField fullWidth size="small" disabled={disabled} value={form.description} onChange={(e) => patch("description", e.target.value)}
              placeholder="What this integration does" />
          </Box>
          {/* Row 3: Payload Format + Status */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 4, width: "100%", flexWrap: "wrap" }}>
            <Box>
              <Typography variant="caption" style={{ color: "#666" }} display="block" mb={0.8} fontWeight={600}>Payload Format</Typography>
              <ToggleButtonGroup exclusive value={form.payloadFormat}
                onChange={(_, val) => { if (val && !disabled) patch("payloadFormat", val); }}
                sx={{ height: 36 }}>
                {PAYLOAD_FORMATS.map((f) => (
                  <ToggleButton key={f.value} value={f.value} disabled={disabled}
                    sx={{ textTransform: "none", fontSize: "0.82rem", fontWeight: 600, px: 2.5,
                      "&.Mui-selected": { bgcolor: "#e3f2fd", color: "#1565c0", borderColor: "#1976d2" } }}>
                    {f.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Typography variant="caption" sx={{ color: "#999", display: "block", mt: 0.5 }}>
                {PAYLOAD_FORMATS.find((f) => f.value === form.payloadFormat)?.hint}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" style={{ color: "#666" }} display="block" mb={0.8} fontWeight={600}>Status</Typography>
              <FormControlLabel
                control={<Switch checked={form.isActive} disabled={disabled} color="primary" onChange={(e) => patch("isActive", e.target.checked)} />}
                label={<Typography variant="body2">{form.isActive ? "Active" : "Inactive"}</Typography>}
                sx={{ ml: 0 }}
              />
            </Box>
          </Box>

          {/* Row 4: Flow Type */}
          <Box sx={{ width: "100%" }}>
            <Typography variant="caption" style={{ color: "#666" }} display="block" mb={0.8} fontWeight={600}>Flow Type</Typography>
            <ToggleButtonGroup exclusive value={form.flowType}
              onChange={(_, val) => {
                if (!val || disabled) return;
                patch("flowType", val);
                if (val === "SYNC" && syncTableList.length === 0) {
                  // Auto-detect tables from selected feature type
                  const ftLabel = (featureTypes.find((ft) => ft.id === form.assignFeatureTypeId)?.label ?? "").toLowerCase();
                  const autoPreset = SYNC_PRESETS.find((p) =>
                    p.value !== "CUSTOM" && (
                      (p.value === "HOSPITAL_NETWORK" && /hospital|network/.test(ftLabel)) ||
                      (p.value === "CLAIMS_SETTLEMENT" && /claim|settlement/.test(ftLabel))
                    )
                  );
                  if (autoPreset) {
                    setSyncPreset(autoPreset.value);
                    setSyncTableList(autoPreset.tables);
                    patch("syncTargetTable", autoPreset.primaryTable);
                    patch("syncDedupColumn", autoPreset.dedupColumn);
                  }
                  // Default scope + schedule
                  if (!form.syncScope) patch("syncScope", "PER_POLICY");
                  if (!form.syncSchedule) patch("syncSchedule", "* * * * *");
                } else if (val !== "SYNC") {
                  setSyncPreset("");
                  setSyncTableList([]);
                }
              }}>
              {FLOW_TYPES.map((f) => (
                <ToggleButton key={f.value} value={f.value} disabled={disabled}
                  sx={{
                    textTransform: "none", px: 2.5, py: 1.2, minWidth: 190, minHeight: 68,
                    alignItems: "flex-start", verticalAlign: "top",
                    "&.Mui-selected": {
                      bgcolor: f.value === "SYNC" ? "#fff3e0" : f.value === "DISPLAY" ? "#e8f5e9" : f.value === "DIRECT_CALL" ? "#f3f0ff" : "#e3f2fd",
                      color: f.value === "SYNC" ? "#e65100" : f.value === "DISPLAY" ? "#2e7d32" : f.value === "DIRECT_CALL" ? "#4527a0" : "#1565c0",
                      borderColor: "currentColor",
                    },
                  }}>
                  <Box textAlign="left">
                    <Typography variant="body2" fontWeight={700} style={{ color: "inherit", lineHeight: 1.4 }}>{f.label}</Typography>
                    <Typography variant="caption" style={{ color: "inherit", opacity: 0.72, display: "block", fontSize: "0.7rem", lineHeight: 1.35, marginTop: 2 }}>{f.description}</Typography>
                  </Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* SYNC-specific fields */}
          {form.flowType === "SYNC" && (
            <Box sx={{ width: "100%", bgcolor: "#fff8f0", border: "1.5px solid #ffe0b2", borderRadius: 2, p: 2.5, display: "flex", flexWrap: "wrap", gap: "20px 32px" }}>
              <Box sx={{ width: "100%", mb: 0.5 }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: "#e65100", textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.68rem" }}>Sync Configuration</Typography>
                {syncPreset && syncPreset !== "CUSTOM" && (
                  <Typography variant="caption" sx={{ ml: 1.5, color: "#e65100", fontSize: "0.72rem" }}>
                    Tables auto-set from feature type ({SYNC_PRESETS.find((p) => p.value === syncPreset)?.label}) — adjust manually if needed
                  </Typography>
                )}
              </Box>
              <Box sx={{ maxWidth: 260, width: "100%" }}>
                <Typography variant="caption" style={{ color: "#666" }} display="block" mb={0.5} fontWeight={600}>Sync Scope</Typography>
                {(() => {
                  const selectedScope = SYNC_SCOPES.find((s) => s.value === form.syncScope) ?? null;
                  return (
                    <Autocomplete size="small" options={SYNC_SCOPES} value={selectedScope} disabled={disabled}
                      disableClearable={!!form.syncScope}
                      onChange={(_, opt) => patch("syncScope", opt?.value ?? "")}
                      getOptionLabel={(o) => o.label} isOptionEqualToValue={(a, b) => a.value === b.value}
                      renderInput={(params) => <TextField {...params} placeholder="Select scope…" size="small" />}
                      renderOption={(props, o) => (
                        <Box component="li" {...props} key={o.value} sx={{ flexDirection: "column", alignItems: "flex-start !important", py: "4px !important" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "#1a1a1a" }}>{o.label}</span>
                          <span style={{ fontSize: "0.7rem", color: "#777" }}>{o.description}</span>
                        </Box>
                      )} />
                  );
                })()}
              </Box>
              <Box sx={{ maxWidth: 200, width: "100%" }}>
                <Typography variant="caption" style={{ color: "#666" }} display="block" mb={0.5} fontWeight={600}>Cron Schedule</Typography>
                <TextField size="small" fullWidth disabled={disabled} value={form.syncSchedule}
                  onChange={(e) => patch("syncSchedule", e.target.value)}
                  placeholder='e.g. "30 13 * * *"'
                  helperText="Daily 7 PM IST = 30 13 * * *" />
              </Box>
              <Box sx={{ minWidth: 340, width: "100%", flex: 2 }}>
                <Typography variant="caption" style={{ color: "#666" }} display="block" mb={0.5} fontWeight={600}>Tables Involved in this Sync</Typography>
                {(() => {
                  const tableOpts = buildTableOptions(dbSchema).filter((o) => o.value !== "USER_INPUT" && o.value !== "STATIC");
                  const selectedOpts = tableOpts.length > 0
                    ? tableOpts.filter((o) => syncTableList.includes(o.value))
                    : syncTableList.map((t) => ({ value: t, label: t, group: "OTHER", color: "#888" }));
                  return (
                    <Autocomplete multiple size="small" options={tableOpts} value={selectedOpts} disabled={disabled}
                      onChange={(_, opts) => {
                        const newList = opts.map((o) => o.value);
                        setSyncTableList(newList);
                        // If default target table was removed, clear it
                        if (form.syncTargetTable && !newList.includes(form.syncTargetTable)) patch("syncTargetTable", "");
                        // If only one table, auto-set as default
                        if (newList.length === 1) { patch("syncTargetTable", newList[0]); }
                      }}
                      groupBy={(o) => o.group} getOptionLabel={(o) => o.label} isOptionEqualToValue={(a, b) => a.value === b.value}
                      renderTags={(value, getTagProps) =>
                        value.map((o, index) => (
                          <Chip {...getTagProps({ index })} key={o.value} label={o.label} size="small"
                            sx={{ fontFamily: "monospace", fontSize: "0.72rem", height: 20, bgcolor: "#e8f5e9", color: "#2e7d32", "& .MuiChip-deleteIcon": { fontSize: "0.85rem" } }} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField {...params} placeholder={syncTableList.length === 0 ? "Search and add tables…" : ""} size="small"
                          helperText="Select all DB tables this sync will write to"
                          InputProps={{ ...params.InputProps, sx: { fontFamily: "monospace", fontSize: "0.82rem" } }} />
                      )}
                      renderOption={(props, o) => (
                        <Box component="li" {...props} key={o.value} sx={{ gap: 1 }}>
                          <Box component="span" style={{ width: 7, height: 7, borderRadius: "50%", background: o.color, flexShrink: 0, display: "inline-block" }} />
                          <span style={{ fontSize: "0.82rem", fontFamily: "monospace", color: "#1a1a1a" }}>{o.label}</span>
                        </Box>
                      )}
                      renderGroup={(params) => (
                        <Box key={params.key}>
                          <Typography variant="caption" sx={{ px: 1.5, py: 0.4, display: "block", fontWeight: 700, fontSize: "0.63rem", textTransform: "uppercase", letterSpacing: 1, color: tableOpts.find((o) => o.group === params.group)?.color ?? "#666", bgcolor: "#f7f7f7", borderBottom: "1px solid #eee" }}>{params.group}</Typography>
                          {params.children}
                        </Box>
                      )} />
                  );
                })()}
              </Box>

              <Box sx={{ maxWidth: 300, width: "100%" }}>
                <Typography variant="caption" style={{ color: "#666" }} display="block" mb={0.5} fontWeight={600}>Default Target Table <span style={{ color: "#bbb", fontWeight: 400 }}>(for dedup)</span></Typography>
                {(() => {
                  const tableOpts = syncTableList.length > 0
                    ? buildTableOptions(dbSchema).filter((o) => syncTableList.includes(o.value))
                    : buildTableOptions(dbSchema).filter((o) => o.value !== "USER_INPUT" && o.value !== "STATIC");
                  const selectedOpt = tableOpts.find((o) => o.value === form.syncTargetTable) ?? null;
                  return (
                    <Autocomplete size="small" options={tableOpts} value={selectedOpt} disabled={disabled}
                      onChange={(_, opt) => patch("syncTargetTable", opt?.value ?? "")}
                      groupBy={(o) => o.group} getOptionLabel={(o) => o.label} isOptionEqualToValue={(a, b) => a.value === b.value}
                      renderInput={(params) => (
                        <TextField {...params} placeholder={syncTableList.length > 0 ? "Pick from selected tables…" : "Search table…"} size="small"
                          helperText="Dedup runs against this table only"
                          InputProps={{ ...params.InputProps, sx: { fontFamily: "monospace", fontSize: "0.82rem" } }} />
                      )}
                      renderOption={(props, o) => (
                        <Box component="li" {...props} key={o.value} sx={{ gap: 1 }}>
                          <Box component="span" style={{ width: 7, height: 7, borderRadius: "50%", background: o.color, flexShrink: 0, display: "inline-block" }} />
                          <span style={{ fontSize: "0.82rem", fontFamily: "monospace", color: "#1a1a1a" }}>{o.label}</span>
                        </Box>
                      )}
                      renderGroup={(params) => (
                        <Box key={params.key}>
                          <Typography variant="caption" sx={{ px: 1.5, py: 0.4, display: "block", fontWeight: 700, fontSize: "0.63rem", textTransform: "uppercase", letterSpacing: 1, color: tableOpts.find((o) => o.group === params.group)?.color ?? "#666", bgcolor: "#f7f7f7", borderBottom: "1px solid #eee" }}>{params.group}</Typography>
                          {params.children}
                        </Box>
                      )} />
                  );
                })()}
              </Box>

              <Box sx={{ maxWidth: 300, width: "100%" }}>
                <Typography variant="caption" style={{ color: "#666" }} display="block" mb={0.5} fontWeight={600}>Dedup Column</Typography>
                {(() => {
                  const selectedTable = dbSchema.find((t) => t.tableName === form.syncTargetTable) ?? null;
                  const selectedCol = selectedTable?.columns.find((c) => c.name === form.syncDedupColumn)
                    ?? (form.syncDedupColumn ? { name: form.syncDedupColumn, dataType: "" } : null);
                  return (
                    <Autocomplete size="small"
                      options={selectedTable?.columns ?? []}
                      value={selectedCol}
                      disabled={disabled || !selectedTable}
                      onChange={(_, col) => patch("syncDedupColumn", col?.name ?? "")}
                      getOptionLabel={(col) => col.name} isOptionEqualToValue={(a, b) => a.name === b.name}
                      renderInput={(params) => (
                        <TextField {...params} size="small"
                          placeholder={selectedTable ? "Select unique ID column…" : "Pick a table first"}
                          helperText={selectedTable ? "Used for ON CONFLICT — skip if row already exists with this value" : "Select table above to see columns"}
                          InputProps={{ ...params.InputProps, sx: { fontFamily: "monospace", fontSize: "0.82rem" } }} />
                      )}
                      renderOption={(props, col) => (
                        <Box component="li" {...props} key={col.name} sx={{ flexDirection: "column", alignItems: "flex-start !important", py: "3px !important" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#1a1a1a" }}>{col.name}</span>
                          <span style={{ fontSize: "0.65rem", color: "#aaa" }}>{col.dataType}</span>
                        </Box>
                      )} />
                  );
                })()}
              </Box>
              <Box sx={{ maxWidth: 130, width: "100%" }}>
                <Typography variant="caption" style={{ color: "#666" }} display="block" mb={0.5} fontWeight={600}>TTL (hours)</Typography>
                <TextField size="small" fullWidth type="number" disabled={disabled} value={form.syncTtlHours}
                  onChange={(e) => patch("syncTtlHours", Number(e.target.value))}
                  helperText="Skip if synced within N hours" />
              </Box>
            </Box>
          )}
        </CollapsibleSection>

        {/* E-card only: explicit architecture selector — drives which of the two config
            sections below are relevant/shown, instead of always showing both for every
            e-card config regardless of whether they apply. */}
        {/e.?card/i.test(form.label) && (
          <Box sx={{ width: "100%", bgcolor: "#f3f6ff", border: "1.5px solid #d6e0ff", borderRadius: 2, p: 2.5 }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: "#3949ab", textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.68rem", display: "block", mb: 1.5 }}>
              E-card Architecture
            </Typography>
            <Box sx={{ maxWidth: 360 }}>
              {(() => {
                const modeOpts = [
                  { value: "FAMILY_ONLY", label: "Family only", description: "One API, always returns the family card (e.g. FHPL)" },
                  { value: "PARAM_DRIVEN", label: "Param-driven", description: "One API — the tpaId param picks family vs individual (e.g. Good Health)" },
                  { value: "ARRAY_ALL_MEMBERS", label: "All members at once", description: "One API call returns every covered member's card in one response (e.g. Vidal Health)" },
                  { value: "SEPARATE_APIS", label: "Separate APIs", description: "Two distinct endpoints, one for family, one for individual (e.g. Health India)" },
                ];
                const selected = modeOpts.find((o) => o.value === form.ecardResponseMode) ?? null;
                return (
                  <Autocomplete size="small" options={modeOpts} value={selected} disabled={disabled}
                    onChange={(_, opt) => patch("ecardResponseMode", opt?.value ?? "")}
                    getOptionLabel={(o) => o.label} isOptionEqualToValue={(a, b) => a.value === b.value}
                    renderInput={(params) => <TextField {...params} placeholder="Select architecture…" size="small" />}
                    renderOption={(props, o) => (
                      <Box component="li" {...props} key={o.value} sx={{ flexDirection: "column", alignItems: "flex-start !important", py: "4px !important" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "#1a1a1a" }}>{o.label}</span>
                        <span style={{ fontSize: "0.7rem", color: "#777" }}>{o.description}</span>
                      </Box>
                    )} />
                );
              })()}
            </Box>
          </Box>
        )}

        {/* Only relevant when architecture = Separate APIs (e.g. Health India). */}
        {form.ecardResponseMode === "SEPARATE_APIS" && (
          <Box sx={{ width: "100%", bgcolor: "#f3f6ff", border: "1.5px solid #d6e0ff", borderRadius: 2, p: 2.5 }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: "#3949ab", textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.68rem", display: "block", mb: 1.5 }}>
              Individual E-card App Ref
            </Typography>
            <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 1.5 }}>
              Pick the separate config used for a dependent's individual card. This config stays the "family" one, used for self.
            </Typography>
            <Box sx={{ maxWidth: 360 }}>
              {(() => {
                const selectedOpt = individualEcardOptions.find((o) => o.id === form.individualEcardAppRefId) ?? null;
                return (
                  <Autocomplete size="small" options={individualEcardOptions} value={selectedOpt} disabled={disabled}
                    onChange={(_, opt) => patch("individualEcardAppRefId", opt?.id ?? null)}
                    getOptionLabel={(o) => o.label} isOptionEqualToValue={(a, b) => a.id === b.id}
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Select the individual config…" size="small" />
                    )} />
                );
              })()}
            </Box>
          </Box>
        )}

        {/* Only relevant when architecture = All members at once (e.g. Vidal Health). */}
        {form.ecardResponseMode === "ARRAY_ALL_MEMBERS" && (
          <Box sx={{ width: "100%", bgcolor: "#f3f6ff", border: "1.5px solid #d6e0ff", borderRadius: 2, p: 2.5, display: "flex", flexWrap: "wrap", gap: "20px 32px" }}>
            <Box sx={{ width: "100%", mb: -0.5 }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: "#3949ab", textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.68rem" }}>
                Multi-Member Array Response
              </Typography>
              <Typography variant="caption" sx={{ color: "#666", display: "block", mt: 0.5 }}>
                Only set these if this TPA's API returns <strong>every covered member's card in one response</strong> (e.g. Vidal Health's <code>{"{ data: [{ relationship, ecardUrl }] }"}</code>). Leave both blank if this TPA returns one card per call.
              </Typography>
            </Box>
            {step2FlatKeys.length === 0 ? (
              <Box sx={{ width: "100%", p: 1.5, textAlign: "center", border: "1.5px dashed #d0d0d0", borderRadius: 1, bgcolor: "#fafafa" }}>
                <Typography variant="caption" style={{ color: "#999" }}>Run the Test API above first — these are picked from the real response, not typed by hand</Typography>
              </Box>
            ) : (() => {
              // Array path candidates: unique prefixes before ".0." across every flattened key —
              // same convention the scheduler's own array-path detection uses.
              const arrayPathOptions = [...new Set(
                step2FlatKeys.filter((k) => k.includes(".0.")).map((k) => k.split(".0.")[0])
              )];
              // Once an array path is picked, relation-field candidates are just the suffixes
              // after "<arrayPath>.0." for keys under that array — real field names, not guesses.
              const relationFieldOptions = form.ecardArrayResponseKey
                ? [...new Set(
                    step2FlatKeys
                      .filter((k) => k.startsWith(`${form.ecardArrayResponseKey}.0.`))
                      .map((k) => k.slice(`${form.ecardArrayResponseKey}.0.`.length))
                  )]
                : [];
              return (
                <>
                  <Box sx={{ maxWidth: 260, width: "100%" }}>
                    <Typography variant="caption" style={{ color: "#666" }} display="block" mb={0.5} fontWeight={600}>Array Response Key</Typography>
                    <Autocomplete size="small" options={arrayPathOptions} value={form.ecardArrayResponseKey || null} disabled={disabled}
                      onChange={(_, val) => { patch("ecardArrayResponseKey", val ?? ""); patch("ecardRelationMatchField", ""); }}
                      renderInput={(params) => (
                        <TextField {...params} placeholder="Select array path…" size="small"
                          helperText="Discovered from the test response — the array containing one entry per member"
                          InputProps={{ ...params.InputProps, sx: { fontFamily: "monospace", fontSize: "0.82rem" } }} />
                      )} />
                  </Box>
                  <Box sx={{ maxWidth: 260, width: "100%" }}>
                    <Typography variant="caption" style={{ color: "#666" }} display="block" mb={0.5} fontWeight={600}>Relation Field (within each element)</Typography>
                    <Autocomplete size="small" options={relationFieldOptions} value={form.ecardRelationMatchField || null} disabled={disabled || !form.ecardArrayResponseKey}
                      onChange={(_, val) => patch("ecardRelationMatchField", val ?? "")}
                      renderOption={(props, o) => (
                        <Box component="li" {...props} key={o} sx={{ flexDirection: "column", alignItems: "flex-start !important", py: "3px !important" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{o}</span>
                          {step2FlattenedData[`${form.ecardArrayResponseKey}.0.${o}`] && (
                            <span style={{ fontSize: "0.67rem", color: "#888" }}>{String(step2FlattenedData[`${form.ecardArrayResponseKey}.0.${o}`]).slice(0, 50)}</span>
                          )}
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField {...params} placeholder={form.ecardArrayResponseKey ? "Select field…" : "Pick array path first"} size="small"
                          helperText='Matched case-insensitively against "Self"/dependent relation'
                          InputProps={{ ...params.InputProps, sx: { fontFamily: "monospace", fontSize: "0.82rem" } }} />
                      )} />
                  </Box>
                </>
              );
            })()}
          </Box>
        )}

        {/* Step 1 — Authentication (only when SESSION or JWT) */}
        {!form.authAppRefId && !authSuggestionDismissed && authRefSuggestions.length > 0 && !disabled && !isEdit && (
          <Alert
            severity="info"
            icon={false}
            sx={{ borderRadius: 1, alignItems: "flex-start" }}
            action={
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mt: 0.5 }}>
                {authRefSuggestions.slice(0, 3).map((s) => (
                  <Button key={s.id} size="small" variant="outlined" sx={{ textTransform: "none", fontSize: "0.75rem" }}
                    onClick={() => {
                      setForm((p) => ({
                        ...p,
                        authAppRefId: s.id,
                        authType: s.authType,
                        payloadFormat: s.payloadFormat as PayloadFormat,
                        verificationTokenApiUrl: s.verificationTokenApiUrl,
                        verificationTokenApiMethod: s.verificationTokenApiMethod,
                        verificationTokenApiRows: payloadToRows(s.verificationTokenApiPayload ?? {}),
                        step1HeaderRows: payloadToRows(s.verificationTokenApiHeaders ?? {}),
                        step1ResponseTokenKey: s.step1ResponseTokenKey,
                        basicAuthUser: s.basicAuthUser ?? "",
                        basicAuthPassword: s.basicAuthPassword ?? "",
                        expiresIn: s.expiresIn,
                        iss: s.iss ?? "",
                      }));
                      setAuthSuggestionDismissed(true);
                      setSec((p) => ({ ...p, step1: false }));
                    }}>
                    Yes — use this auth
                  </Button>
                ))}
                <Button size="small" sx={{ textTransform: "none", fontSize: "0.75rem", color: "#666" }}
                  onClick={() => setAuthSuggestionDismissed(true)}>
                  No — set up own Step 1
                </Button>
              </Box>
            }>
            <Typography variant="body2" sx={{ fontSize: "0.82rem", fontWeight: 600, mb: 0.4 }}>
              This TPA already has Step 1 auth configured
            </Typography>
            {authRefSuggestions.slice(0, 3).map((s) => (
              <Box key={s.id} sx={{ mb: 0.3 }}>
                <Typography variant="body2" sx={{ fontSize: "0.78rem", color: "#1a3a5c" }}>
                  <strong>"{s.label}"</strong> — {s.authType} auth, calling{" "}
                  <Box component="code" sx={{ fontSize: "0.75rem", bgcolor: "#e8f0fe", px: 0.6, py: 0.1, borderRadius: 0.5 }}>
                    {s.verificationTokenApiUrl || "(URL not set)"}
                  </Box>
                </Typography>
                <Typography variant="body2" sx={{ fontSize: "0.76rem", color: "#555" }}>
                  That Step 1 is already getting auth tokens. Do you want to use the same session auth here too?
                </Typography>
              </Box>
            ))}
          </Alert>
        )}

        {form.authAppRefId && (
          <Alert severity="success" sx={{ borderRadius: 1, alignItems: "center" }}
            action={!disabled ? (
              <Button size="small" sx={{ textTransform: "none", fontSize: "0.75rem", color: "#666" }}
                onClick={() => {
                  setForm((p) => ({
                    ...p, authAppRefId: null,
                    verificationTokenApiUrl: "", verificationTokenApiMethod: "POST",
                    verificationTokenApiRows: [], step1HeaderRows: [],
                    step1ResponseTokenKey: "verificationToken", basicAuthUser: "", basicAuthPassword: "",
                  }));
                  setAuthSuggestionDismissed(false);
                  setSec((p) => ({ ...p, step1: true }));
                }}>
                Unlink — set up own Step 1
              </Button>
            ) : undefined}>
            <Typography variant="body2" sx={{ fontSize: "0.82rem" }}>
              Step 1 linked from: <strong>{authRefSuggestions.find((s) => s.id === form.authAppRefId)?.label ?? `App Ref #${form.authAppRefId}`}</strong>
              {" "}<span style={{ color: "#555", fontSize: "0.78rem" }}>
                {disabled ? "— this config uses that config's Step 1 auth." : "— fields below are pre-filled and locked. Unlink to configure your own Step 1."}
              </span>
            </Typography>
          </Alert>
        )}

        {form.authType !== "DIRECT" && form.authAppRefId && (
          <CollapsibleSection
            title={`Step 1 — ${form.authType === "JWT" ? "Authentication (get verification token)" : form.authType === "BASIC_AUTH" ? "Authentication (Basic Auth → get access token)" : "Authentication (get access token)"} — Linked (read-only)`}
            open={sec.step1} onToggle={() => toggleSec("step1")}>
            <Box sx={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end" }}>
              <Box sx={{ width: 120, flexShrink: 0 }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Method</Typography>
                <TextField size="small" fullWidth disabled value={form.verificationTokenApiMethod} inputProps={{ style: { fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 600 } }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Step 1 URL</Typography>
                <TextField fullWidth size="small" disabled value={form.verificationTokenApiUrl} inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem" } }} />
              </Box>
            </Box>
            <Box sx={{ maxWidth: 340, width: "100%" }}>
              <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Response Token Key</Typography>
              <TextField fullWidth size="small" disabled value={form.step1ResponseTokenKey} inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem" } }} />
            </Box>
            {form.authType === "BASIC_AUTH" && (
              <>
                {(["basicAuthUser", "basicAuthPassword"] as const).map((field) => {
                  const val = form[field] ?? "";
                  const envMatch = val.match(/^\{\{env:([^}]+)\}\}$/);
                  const lbl = field === "basicAuthUser" ? "Basic Auth Username" : "Basic Auth Password";
                  return (
                    <Box key={field} sx={{ maxWidth: 260, width: "100%" }}>
                      <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>{lbl}</Typography>
                      {envMatch ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, border: "1px solid #c8e6c9", borderRadius: 1, px: 1, py: 0.6, bgcolor: "#f1f8e9" }}>
                          <LockIcon sx={{ fontSize: 14, color: "#388e3c" }} />
                          <Typography variant="caption" sx={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#1b5e20", wordBreak: "break-all" }}>
                            {envMatch[1]}
                          </Typography>
                        </Box>
                      ) : (
                        <TextField fullWidth size="small" disabled value={val} type={field === "basicAuthPassword" ? "password" : "text"} />
                      )}
                    </Box>
                  );
                })}
              </>
            )}
            {form.authType === "JWT" && (
              <>
                <Box sx={{ maxWidth: 300, width: "100%" }}>
                  <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>JWT Issuer (iss)</Typography>
                  <TextField fullWidth size="small" disabled value={form.iss} />
                </Box>
                <Box sx={{ maxWidth: 130, width: "100%" }}>
                  <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Token Expiry</Typography>
                  <TextField fullWidth size="small" disabled value={form.expiresIn} />
                </Box>
              </>
            )}
            <Box sx={{ width: "100%" }}>
              <Typography variant="caption" style={{ color: "#555" }} fontWeight={600} display="block" mb={1}>Step 1 Payload Fields <span style={{ fontWeight: 400, color: "#888" }}>(locked — from linked config)</span></Typography>
              <pre style={{ fontSize: "0.78rem", fontFamily: "monospace", background: "#1a1a2e", color: "#a8d8a8", padding: "10px 14px", borderRadius: 4, overflowX: "auto" }}>{generatePreview(form.verificationTokenApiRows, form.payloadFormat as PayloadFormat) || "(empty)"}</pre>
            </Box>
            {form.step1HeaderRows.length > 0 && (
              <Box sx={{ width: "100%" }}>
                <Typography variant="caption" style={{ color: "#555" }} fontWeight={600} display="block" mb={1}>Step 1 Headers <span style={{ fontWeight: 400, color: "#888" }}>(locked)</span></Typography>
                <pre style={{ fontSize: "0.78rem", fontFamily: "monospace", background: "#1a1a2e", color: "#a8d8a8", padding: "10px 14px", borderRadius: 4, overflowX: "auto" }}>{generatePreview(form.step1HeaderRows, "JSON") || "(none)"}</pre>
              </Box>
            )}
          </CollapsibleSection>
        )}

        {form.authType !== "DIRECT" && !form.authAppRefId && (
          <CollapsibleSection
            title={`Step 1 — ${form.authType === "JWT" ? "Authentication (get verification token)" : form.authType === "BASIC_AUTH" ? "Authentication (Basic Auth → get access token)" : "Authentication (get access token)"}`}
            open={sec.step1} onToggle={() => toggleSec("step1")}
            action={!disabled ? (
              <Button size="small" variant={curlInlineStep === 1 ? "contained" : "outlined"} startIcon={<ContentPasteIcon sx={{ fontSize: 14 }} />}
                onClick={(e) => { e.stopPropagation(); setCurlInlineStep((s) => s === 1 ? null : 1); setSec((p) => ({ ...p, step1: true })); }}
                sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.4, px: 1.2,
                  ...(curlInlineStep === 1
                    ? { bgcolor: "#5e35b1", "&:hover": { bgcolor: "#4527a0" } }
                    : { borderColor: "#7c4dff55", color: "#5e35b1", "&:hover": { borderColor: "#7c4dff", bgcolor: "#f3f0ff" } }) }}>
                {curlInlineStep === 1 ? "Close" : "Paste cURL"}
              </Button>
            ) : undefined}>
            {linkedByRefs.length > 0 && (
              <Alert severity="warning" sx={{ mb: 1, py: 0.5 }}>
                <Typography variant="body2" sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
                  {linkedByRefs.length} other config{linkedByRefs.length > 1 ? "s" : ""} use this Step 1:
                  {" "}{linkedByRefs.map((r) => `"${r.label}"`).join(", ")}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: "0.77rem", color: "#7a4f00", mt: 0.3 }}>
                  Any changes to Step 1 here will affect those configs too — they share these credentials.
                </Typography>
              </Alert>
            )}
            {curlInlineStep === 1 && (
              <InlineCurlPaste
                label="Step 1 — Auth Endpoint cURL"
                onApply={(p) => applyParsedCurl(p, 1, false)}
                onClose={() => setCurlInlineStep(null)}
              />
            )}
            {/* Method + URL grouped on one row */}
            <Box sx={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end" }}>
              <Box sx={{ width: 120, flexShrink: 0 }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Method</Typography>
                <Autocomplete size="small" options={METHODS} value={form.verificationTokenApiMethod} disabled={disabled}
                  disableClearable onChange={(_, val) => patch("verificationTokenApiMethod", val ?? "POST")}
                  renderInput={(params) => <TextField {...params} size="small" />}
                  renderOption={(props, o) => <Box component="li" {...props} key={o}><span style={{ fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 600 }}>{o}</span></Box>} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Step 1 URL</Typography>
                <TextField fullWidth size="small" disabled={disabled} value={form.verificationTokenApiUrl}
                  onChange={(e) => patch("verificationTokenApiUrl", e.target.value)}
                  placeholder="https://api.tpa.com/auth/token"
                  inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem" } }} />
              </Box>
            </Box>
            <Box sx={{ maxWidth: 340, width: "100%" }}>
              <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Response Token Key</Typography>
              <TextField fullWidth size="small" disabled={disabled} value={form.step1ResponseTokenKey}
                onChange={(e) => patch("step1ResponseTokenKey", e.target.value)}
                helperText='Key in Step 1 response e.g. "verificationToken"'
                inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem" } }} />
            </Box>
            {form.authType === "BASIC_AUTH" && (() => {
              const isFieldSecured = (val: string) => {
                return !!(
                  val.match(/^\{\{secret:env:([\w_]+):([^}]+)\}\}$/) ||
                  val.match(/^\{\{secret:([^}:]+):([^}]+)\}\}$/) ||
                  val.match(/^\{\{env:([^}]+)\}\}$/)
                );
              };
              const bothSecured = isFieldSecured(form.basicAuthUser ?? "") && isFieldSecured(form.basicAuthPassword ?? "");
              return (
                <>
                  {(["basicAuthUser", "basicAuthPassword"] as const).map((field) => {
                    const val = form[field] ?? "";
                    const secretEnvMatch = val.match(/^\{\{secret:env:([\w_]+):([^}]+)\}\}$/);
                    const secretDirMatch = val.match(/^\{\{secret:([^}:]+):([^}]+)\}\}$/);
                    const envMatch = val.match(/^\{\{env:([^}]+)\}\}$/);
                    const isSecured = !!(secretEnvMatch || secretDirMatch || envMatch);
                    const securedHint = secretEnvMatch
                      ? `AWS Secret key: ${secretEnvMatch[2]}`
                      : secretDirMatch
                        ? `AWS Secret: ${secretDirMatch[1]}  key: ${secretDirMatch[2]}`
                        : envMatch ? `Env key: ${envMatch[1]}` : "";
                    const lbl = field === "basicAuthUser" ? "Basic Auth Username" : "Basic Auth Password";
                    const lockTitle = isSecured ? "Unsecure — enter value directly" : "Secure — store in AWS Secrets Manager";
                    const handleToggleLock = () => {
                      if (isSecured) {
                        patch(field, "");
                      } else {
                        const { userPath, passPath } = deriveBasicAuthSecretPaths(form.label);
                        patch(field, field === "basicAuthUser" ? userPath : passPath);
                      }
                    };
                    return (
                      <Box key={field} sx={{ maxWidth: 280, width: "100%" }}>
                        <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>{lbl}</Typography>
                        {disabled ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, border: "1px solid rgba(0,0,0,0.23)", borderRadius: 1, px: 1.4, py: 0.9, minHeight: 40 }}>
                            {isSecured ? (
                              <Tooltip title={securedHint}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: 1 }}>
                                  <LockIcon sx={{ fontSize: 14, color: "#7b1fa2" }} />
                                  <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#7b1fa2", fontSize: "0.76rem" }}>secured</Typography>
                                </Box>
                              </Tooltip>
                            ) : (
                              <Typography variant="caption" sx={{ color: "#999", fontSize: "0.82rem" }}>{val || "—"}</Typography>
                            )}
                          </Box>
                        ) : (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            {isSecured ? (
                              <Tooltip title={securedHint}>
                                <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 0.5, border: "1px solid rgba(0,0,0,0.23)", borderRadius: 1, px: 1.4, py: 0.9, minHeight: 40 }}>
                                  <LockIcon sx={{ fontSize: 14, color: "#7b1fa2" }} />
                                  <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#7b1fa2", fontSize: "0.76rem" }}>secured</Typography>
                                </Box>
                              </Tooltip>
                            ) : (
                              <TextField
                                sx={{ flex: 1 }} size="small" value={val}
                                onChange={(e) => patch(field, e.target.value)}
                                placeholder={field === "basicAuthUser" ? "username" : "password"}
                                autoComplete={field === "basicAuthUser" ? "off" : "new-password"} />
                            )}
                            <Tooltip title={lockTitle}>
                              <IconButton size="small" onClick={handleToggleLock}
                                sx={{ color: isSecured ? "#7b1fa2" : "#bdbdbd", "&:hover": { color: "#7b1fa2" }, p: 0.5 }}>
                                {isSecured ? <LockIcon sx={{ fontSize: 18 }} /> : <LockOpenIcon sx={{ fontSize: 18 }} />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </>
              );
            })()}
            {form.authType === "JWT" && (
              <>
                <Box sx={{ maxWidth: 300, width: "100%" }}>
                  <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>JWT Issuer (iss)</Typography>
                  <TextField fullWidth size="small" disabled={disabled} value={form.iss}
                    onChange={(e) => patch("iss", e.target.value)} placeholder="From TPA docs"
                    helperText="Identifier provided by TPA — not a secret" />
                </Box>
                <Box sx={{ maxWidth: 130, width: "100%" }}>
                  <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Token Expiry</Typography>
                  <TextField fullWidth size="small" disabled={disabled} value={form.expiresIn}
                    onChange={(e) => patch("expiresIn", e.target.value)} placeholder='e.g. "10m", "1h"' />
                </Box>
              </>
            )}
            <Box sx={{ width: "100%" }}>
              <Typography variant="caption" style={{ color: "#555" }} fontWeight={600} display="block" mb={1}>Step 1 Payload Fields</Typography>
              {disabled
                ? <pre style={{ fontSize: "0.78rem", fontFamily: "monospace", background: "#1a1a2e", color: "#a8d8a8", padding: "10px 14px", borderRadius: 4, overflowX: "auto" }}>{generatePreview(form.verificationTokenApiRows, form.payloadFormat) || "(empty)"}</pre>
                : <PayloadBuilder rows={form.verificationTokenApiRows} format={form.payloadFormat} onChange={(rows) => patch("verificationTokenApiRows", rows)} configLabel={form.label} step={1} canonicalFields={isClaimSubmissionFeature ? CLAIM_CANONICAL_FIELDS : undefined} />
              }
            </Box>
            <Box sx={{ width: "100%" }}>
              <Typography variant="caption" style={{ color: "#555" }} fontWeight={600} display="block" mb={1}>Step 1 Request Headers <span style={{ fontWeight: 400, color: "#888" }}>(optional — for APIs that accept params as headers)</span></Typography>
              {disabled
                ? <pre style={{ fontSize: "0.78rem", fontFamily: "monospace", background: "#1a1a2e", color: "#a8d8a8", padding: "10px 14px", borderRadius: 4, overflowX: "auto" }}>{generatePreview(form.step1HeaderRows, "JSON") || "(none)"}</pre>
                : <PayloadBuilder rows={form.step1HeaderRows} format="JSON" onChange={(rows) => patch("step1HeaderRows", rows)} configLabel={form.label} step={1} isHeader={true} canonicalFields={isClaimSubmissionFeature ? CLAIM_CANONICAL_FIELDS : undefined} />
              }
            </Box>
          </CollapsibleSection>
        )}

        {/* Step 2 — Data API */}
        <CollapsibleSection
          title={
            isClaimSubmissionFeature && claimFormTypeChoice === "MULTI"
              ? "Intimate Claim — API Call"
              : form.authType === "DIRECT" ? "API Call" : "Step 2 — Data / Magic Link"
          }
          open={sec.step2} onToggle={() => toggleSec("step2")}
          action={!disabled ? (
            <Button size="small" variant={curlInlineStep === 2 ? "contained" : "outlined"} startIcon={<ContentPasteIcon sx={{ fontSize: 14 }} />}
              onClick={(e) => { e.stopPropagation(); setCurlInlineStep((s) => s === 2 ? null : 2); setSec((p) => ({ ...p, step2: true })); }}
              sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.4, px: 1.2,
                ...(curlInlineStep === 2
                  ? { bgcolor: "#5e35b1", "&:hover": { bgcolor: "#4527a0" } }
                  : { borderColor: "#7c4dff55", color: "#5e35b1", "&:hover": { borderColor: "#7c4dff", bgcolor: "#f3f0ff" } }) }}>
              {curlInlineStep === 2 ? "Close" : "Paste cURL"}
            </Button>
          ) : undefined}>
          {curlInlineStep === 2 && (
            <InlineCurlPaste
              label="Step 2 — Main API cURL"
              step={2}
              onApply={(p) => applyParsedCurl(p, 2, true)}
              onClose={() => setCurlInlineStep(null)}
            />
          )}
          {/* Method + URL grouped on one row */}
          <Box sx={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end" }}>
            <Box sx={{ width: 120, flexShrink: 0 }}>
              <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Method</Typography>
              <Autocomplete size="small" options={METHODS} value={form.magicUrlApiMethod} disabled={disabled}
                disableClearable onChange={(_, val) => patch("magicUrlApiMethod", val ?? "POST")}
                renderInput={(params) => <TextField {...params} size="small" />}
                renderOption={(props, o) => <Box component="li" {...props} key={o}><span style={{ fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 600 }}>{o}</span></Box>} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" style={{ color: submitted && !form.magicUrlApiUrl.trim() ? "#d32f2f" : "#555" }} display="block" mb={0.5}>API URL *</Typography>
              <TextField fullWidth size="small" disabled={disabled} value={form.magicUrlApiUrl}
                onChange={(e) => patch("magicUrlApiUrl", e.target.value)}
                placeholder="https://api.tpa.com/v1/endpoint"
                inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem" } }}
                error={submitted && !form.magicUrlApiUrl.trim()}
                helperText={submitted && !form.magicUrlApiUrl.trim() ? "Required" : undefined} />
            </Box>
          </Box>
          <Box sx={{ maxWidth: 340, width: "100%" }}>
            <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Response Key</Typography>
            <TextField fullWidth size="small" disabled={disabled} value={form.step2ResponseDataKey}
              onChange={(e) => patch("step2ResponseDataKey", e.target.value)}
              helperText='Root key in the response e.g. "data", "result"'
              inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem" } }} />
          </Box>
          <Box sx={{ width: "100%" }}>
            <Typography variant="caption" style={{ color: "#555" }} fontWeight={600} display="block" mb={1}>
              Payload Fields
              {(form.magicUrlApiMethod === "GET" || form.magicUrlApiMethod === "DELETE") && (
                <span style={{ fontWeight: 400, color: "#888" }}> — sent as URL query parameters, not a JSON body, for {form.magicUrlApiMethod}</span>
              )}
            </Typography>
            {disabled
              ? <pre style={{ fontSize: "0.78rem", fontFamily: "monospace", background: "#1a1a2e", color: "#a8d8a8", padding: "10px 14px", borderRadius: 4, overflowX: "auto" }}>{generatePreview(form.magicUrlApiRows, (form.magicUrlApiMethod === "GET" || form.magicUrlApiMethod === "DELETE") ? "FORM" : form.payloadFormat) || "(empty)"}</pre>
              : <PayloadBuilder rows={form.magicUrlApiRows} format={(form.magicUrlApiMethod === "GET" || form.magicUrlApiMethod === "DELETE") ? "FORM" : form.payloadFormat} onChange={(rows) => patch("magicUrlApiRows", rows)} configLabel={form.label} step={2} canonicalFields={isClaimSubmissionFeature ? CLAIM_CANONICAL_FIELDS : undefined} />
            }
          </Box>
          <Box sx={{ width: "100%" }}>
            <Typography variant="caption" style={{ color: "#555" }} fontWeight={600} display="block" mb={1}>Request Headers <span style={{ fontWeight: 400, color: "#888" }}>(optional — for APIs that accept params as headers)</span></Typography>
            {disabled
              ? <pre style={{ fontSize: "0.78rem", fontFamily: "monospace", background: "#1a1a2e", color: "#a8d8a8", padding: "10px 14px", borderRadius: 4, overflowX: "auto" }}>{generatePreview(form.step2HeaderRows, "JSON") || "(none)"}</pre>
              : <PayloadBuilder rows={form.step2HeaderRows} format="JSON" onChange={(rows) => patch("step2HeaderRows", rows)} configLabel={form.label} step={2} isHeader={true} canonicalFields={isClaimSubmissionFeature ? CLAIM_CANONICAL_FIELDS : undefined} />
            }
          </Box>
        </CollapsibleSection>

        {/* Submit Claim — API Call (only when Claim Submission + "different APIs") */}
        {isClaimSubmissionFeature && claimFormTypeChoice === "MULTI" && (
          <CollapsibleSection
            title="Submit Claim — API Call"
            open={sec.step2} onToggle={() => toggleSec("step2")}
            action={!disabled ? (
              <Button size="small" variant={curlInlineSubmitOpen ? "contained" : "outlined"} startIcon={<ContentPasteIcon sx={{ fontSize: 14 }} />}
                onClick={(e) => { e.stopPropagation(); setCurlInlineSubmitOpen((s) => !s); }}
                sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.4, px: 1.2,
                  ...(curlInlineSubmitOpen
                    ? { bgcolor: "#5e35b1", "&:hover": { bgcolor: "#4527a0" } }
                    : { borderColor: "#7c4dff55", color: "#5e35b1", "&:hover": { borderColor: "#7c4dff", bgcolor: "#f3f0ff" } }) }}>
                {curlInlineSubmitOpen ? "Close" : "Paste cURL"}
              </Button>
            ) : undefined}>
            <Alert severity="info" sx={{ width: "100%", fontSize: "0.78rem" }}>
              Auth Type and credentials above are shared with Intimate Claim — this section is only the URL, payload, and headers for the Submit call.
            </Alert>
            {curlInlineSubmitOpen && (
              <InlineCurlPaste
                label="Submit Claim — API cURL"
                step={2}
                onApply={applySubmitParsedCurl}
                onClose={() => setCurlInlineSubmitOpen(false)}
              />
            )}
            <Box sx={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end" }}>
              <Box sx={{ width: 120, flexShrink: 0 }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Method</Typography>
                <Autocomplete size="small" options={METHODS} value={submitMagicUrlApiMethod} disabled={disabled}
                  disableClearable onChange={(_, val) => setSubmitMagicUrlApiMethod(val ?? "POST")}
                  renderInput={(params) => <TextField {...params} size="small" />}
                  renderOption={(props, o) => <Box component="li" {...props} key={o}><span style={{ fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 600 }}>{o}</span></Box>} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" style={{ color: submitted && !submitMagicUrlApiUrl.trim() ? "#d32f2f" : "#555" }} display="block" mb={0.5}>API URL *</Typography>
                <TextField fullWidth size="small" disabled={disabled} value={submitMagicUrlApiUrl}
                  onChange={(e) => setSubmitMagicUrlApiUrl(e.target.value)}
                  placeholder="https://api.tpa.com/v1/claim-submission"
                  inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem" } }}
                  error={submitted && !submitMagicUrlApiUrl.trim()}
                  helperText={submitted && !submitMagicUrlApiUrl.trim() ? "Required" : undefined} />
              </Box>
            </Box>
            <Box sx={{ maxWidth: 340, width: "100%" }}>
              <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Response Key</Typography>
              <TextField fullWidth size="small" disabled={disabled} value={submitStep2ResponseDataKey}
                onChange={(e) => setSubmitStep2ResponseDataKey(e.target.value)}
                helperText='Root key in the response e.g. "data", "result"'
                inputProps={{ style: { fontFamily: "monospace", fontSize: "0.85rem" } }} />
            </Box>
            <Box sx={{ width: "100%" }}>
              <Typography variant="caption" style={{ color: "#555" }} fontWeight={600} display="block" mb={1}>Payload Fields</Typography>
              {disabled
                ? <pre style={{ fontSize: "0.78rem", fontFamily: "monospace", background: "#1a1a2e", color: "#a8d8a8", padding: "10px 14px", borderRadius: 4, overflowX: "auto" }}>{generatePreview(submitMagicUrlApiRows, form.payloadFormat) || "(empty)"}</pre>
                : <PayloadBuilder rows={submitMagicUrlApiRows} format={form.payloadFormat} onChange={setSubmitMagicUrlApiRows} configLabel={`${form.label} - Submit`} step={2} canonicalFields={CLAIM_CANONICAL_FIELDS} />
              }
            </Box>
            <Box sx={{ width: "100%" }}>
              <Typography variant="caption" style={{ color: "#555" }} fontWeight={600} display="block" mb={1}>Request Headers <span style={{ fontWeight: 400, color: "#888" }}>(optional — for APIs that accept params as headers)</span></Typography>
              {disabled
                ? <pre style={{ fontSize: "0.78rem", fontFamily: "monospace", background: "#1a1a2e", color: "#a8d8a8", padding: "10px 14px", borderRadius: 4, overflowX: "auto" }}>{generatePreview(submitStep2HeaderRows, "JSON") || "(none)"}</pre>
                : <PayloadBuilder rows={submitStep2HeaderRows} format="JSON" onChange={setSubmitStep2HeaderRows} configLabel={`${form.label} - Submit`} step={2} isHeader={true} canonicalFields={CLAIM_CANONICAL_FIELDS} />
              }
            </Box>
          </CollapsibleSection>
        )}

        {/* Submit Claim — Response Mappings */}
        {isClaimSubmissionFeature && claimFormTypeChoice === "MULTI" && (
          <CollapsibleSection title="Submit Claim — Response Mappings" open={sec.response} onToggle={() => toggleSec("response")}>
            <Box sx={{ width: "100%" }}>
              <Alert severity="info" sx={{ mb: 2, fontSize: "0.8rem" }}>
                Type response keys manually here (the auto-discovery "Test" tool only runs against the Intimate Claim call above).
              </Alert>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="body2" fontWeight={700} style={{ color: "#1a1a1a" }}>Response Keys</Typography>
                {!disabled && (
                  <Button size="small" startIcon={<AddIcon />}
                    onClick={() => setSubmitStep2Mappings((p) => [...p, EMPTY_MAPPING_ROW(2, p.length)])}
                    sx={{ textTransform: "none", fontSize: "0.75rem" }}>Add Row</Button>
                )}
              </Box>
              {submitStep2Mappings.length === 0 ? (
                <Box sx={{ p: 2, textAlign: "center", border: "1.5px dashed #d0d0d0", borderRadius: 1, bgcolor: "#fafafa" }}>
                  <Typography variant="caption" style={{ color: "#999" }}>No keys yet — add a row (e.g. map a success/error field)</Typography>
                </Box>
              ) : (
                <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, overflow: "auto", "& .MuiInputBase-input": { color: "#1a1a1a !important" } }}>
                  <Table size="small" sx={{ tableLayout: "fixed", minWidth: 780 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: "25%" }}>Response Key (dot-notation)</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: "15%" }}>Target Type</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333" }}>Output Key</TableCell>
                        {!disabled && <TableCell sx={{ width: 44 }} />}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {submitStep2Mappings.map((row, idx) => {
                        const standardKeyOpts = STANDARD_KEYS.map((k) => ({ value: k, label: k }));
                        const selectedStandardKey = standardKeyOpts.find((o) => o.value === row.outputKey) ?? null;
                        return (
                          <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#fafafa" }, verticalAlign: "middle" }}>
                            <TableCell>
                              <TextField size="small" fullWidth disabled={disabled} value={row.responseKey}
                                placeholder="e.g. data.status"
                                onChange={(e) => setSubmitStep2Mappings((p) => p.map((r, i) => i === idx ? { ...r, responseKey: e.target.value } : r))}
                                InputProps={{ sx: { fontFamily: "monospace", fontSize: "0.82rem" } }} />
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const targetTypeOpts = [
                                  { value: "STANDARD_KEY", label: "Standard Key", color: "#1565c0" },
                                  { value: "PLACEHOLDER",  label: "Placeholder",  color: "#6a1b9a" },
                                ];
                                const selectedTT = targetTypeOpts.find((o) => o.value === row.targetType) ?? null;
                                return (
                                  <Autocomplete size="small" options={targetTypeOpts} value={selectedTT} disabled={disabled} disableClearable
                                    onChange={(_, opt) => {
                                      if (!opt) return;
                                      setSubmitStep2Mappings((p) => p.map((r, i) => i === idx ? { ...r, targetType: opt.value as TargetType, outputKey: "" } : r));
                                    }}
                                    getOptionLabel={(o) => o.label} isOptionEqualToValue={(a, b) => a.value === b.value}
                                    renderInput={(params) => (
                                      <TextField {...params} size="small"
                                        InputProps={{ ...params.InputProps, sx: { fontSize: "0.8rem", color: `${selectedTT?.color ?? "#1a1a1a"} !important`, fontWeight: 600 } }} />
                                    )}
                                    renderOption={(props, o) => (
                                      <Box component="li" {...props} key={o.value}>
                                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: o.color }}>{o.label}</span>
                                      </Box>
                                    )} />
                                );
                              })()}
                            </TableCell>
                            <TableCell>
                              {row.targetType === "STANDARD_KEY" && (
                                <Autocomplete size="small" options={standardKeyOpts} value={selectedStandardKey} disabled={disabled}
                                  onChange={(_, opt) => setSubmitStep2Mappings((p) => p.map((r, i) => i === idx ? { ...r, outputKey: opt?.value ?? "" } : r))}
                                  getOptionLabel={(o) => o.label} isOptionEqualToValue={(a, b) => a.value === b.value}
                                  renderInput={(params) => <TextField {...params} placeholder="Select key…" size="small" InputProps={{ ...params.InputProps, sx: { fontFamily: "monospace", fontSize: "0.8rem" } }} />}
                                  renderOption={(props, o) => <Box component="li" {...props} key={o.value}><span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#1565c0" }}>{o.label}</span></Box>} />
                              )}
                              {row.targetType === "PLACEHOLDER" && (
                                <TextField size="small" fullWidth disabled={disabled} value={row.outputKey}
                                  placeholder="e.g. errorMessage"
                                  onChange={(e) => setSubmitStep2Mappings((p) => p.map((r, i) => i === idx ? { ...r, outputKey: e.target.value } : r))} />
                              )}
                            </TableCell>
                            {!disabled && (
                              <TableCell>
                                <IconButton size="small" onClick={() => setSubmitStep2Mappings((p) => p.filter((_, i) => i !== idx))}>
                                  <DeleteIcon fontSize="small" sx={{ color: "#e57373" }} />
                                </IconButton>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          </CollapsibleSection>
        )}

        {/* Default Field Mappings — DB-source binding for each {{placeholder}}. Not shown for
            Claim Submission: claims fields are always either backend-supplied per claim
            (CLAIM_CANONICAL_FIELDS) or plain user input, so there's nothing here to map. */}
        {uniqueDynamic.length > 0 && !isClaimSubmissionFeature && (
          <CollapsibleSection
            title="Default Field Mappings"
            open={sec.fieldMappings} onToggle={() => toggleSec("fieldMappings")}>

            <Box sx={{ width: "100%", overflow: "auto", "& .MuiInputBase-input": { color: "#1a1a1a !important" }, "& .MuiAutocomplete-input": { color: "#1a1a1a !important" } }}>
              <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: "22%" }}>Placeholder</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: "35%" }}>Source Table</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333" }}>Column / Default</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uniqueDynamic.map((name) => {
                    const canonicalDescription = isClaimSubmissionFeature ? CLAIM_CANONICAL_FIELDS[name] : undefined;
                    const def = form.mappingDefaults[name] ?? { sourceType: "USER_INPUT", sourceField: null };
                    const tableOpts = buildTableOptions(dbSchema);
                    const selectedTableOpt = tableOpts.find((o) => o.value === def.sourceType) ?? null;
                    const dbTable = dbSchema.find((t) => t.tableName === def.sourceType) ?? null;
                    const selectedCol = dbTable?.columns.find((c) => c.name === def.sourceField) ?? null;
                    return (
                      <TableRow key={name} sx={{ "&:hover": { bgcolor: "#fafafa" }, verticalAlign: "middle", ...(canonicalDescription ? { bgcolor: "#f3f0ff" } : {}) }}>
                        <TableCell><Box component="code" style={{ display: "inline-block", background: "#fff3e0", color: "#e65100", padding: "3px 8px", borderRadius: 4, fontFamily: "monospace", fontSize: "0.8rem", border: "1px solid #ffcc80" }}>{`{{${name}}}`}</Box></TableCell>
                        {canonicalDescription ? (
                          <TableCell colSpan={2} sx={{ minWidth: 220 }}>
                            <Tooltip title="Supplied automatically by the claims backend — not DB-mappable, so this can't be misconfigured to point at the wrong value." placement="top">
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                <LockIcon sx={{ fontSize: "0.9rem", color: "#7e57c2" }} />
                                <Typography variant="caption" sx={{ color: "#4527a0", fontSize: "0.75rem" }}>{canonicalDescription}</Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>
                        ) : (
                          <>
                            <TableCell sx={{ minWidth: 220 }}>
                              <Autocomplete size="small" options={tableOpts} value={selectedTableOpt} disabled={disabled}
                                onChange={(_, opt) => patch("mappingDefaults", { ...form.mappingDefaults, [name]: { sourceType: opt?.value ?? "USER_INPUT", sourceField: null } })}
                                groupBy={(opt) => opt.group} getOptionLabel={(opt) => opt.label} isOptionEqualToValue={(a, b) => a.value === b.value} disableClearable
                                renderInput={(params) => <TextField {...params} size="small" placeholder="Search table…" InputProps={{ ...params.InputProps, sx: { fontSize: "0.82rem" } }} />}
                                renderOption={(props, opt) => <Box component="li" {...props} key={opt.value} sx={{ gap: 1, py: "4px !important" }}><Box component="span" style={{ width: 8, height: 8, borderRadius: "50%", background: opt.color, flexShrink: 0, display: "inline-block" }} /><span style={{ fontSize: "0.82rem", fontFamily: opt.mono ? "monospace" : "inherit", color: "#1a1a1a" }}>{opt.label}</span></Box>}
                                renderGroup={(params) => <Box key={params.key}>{params.group !== "Special" && <Typography variant="caption" sx={{ px: 1.5, py: 0.4, display: "block", fontWeight: 700, fontSize: "0.63rem", textTransform: "uppercase", letterSpacing: 1, color: tableOpts.find((o) => o.group === params.group)?.color ?? "#666", bgcolor: "#f7f7f7", borderBottom: "1px solid #eee" }}>{params.group}</Typography>}{params.children}</Box>} />
                            </TableCell>
                            <TableCell sx={{ minWidth: 220 }}>
                              {def.sourceType === "USER_INPUT" ? <span style={{ color: "#888", fontStyle: "italic", fontSize: "0.72rem" }}>filled at runtime by employee</span>
                                : def.sourceType === "STATIC" ? <span style={{ color: "#888", fontStyle: "italic", fontSize: "0.72rem" }}>set static value in feature config</span>
                                : dbTable ? (
                                  <Autocomplete size="small" options={dbTable.columns} value={selectedCol} disabled={disabled}
                                    onChange={(_, col) => patch("mappingDefaults", { ...form.mappingDefaults, [name]: { sourceType: def.sourceType, sourceField: col?.name ?? null } })}
                                    getOptionLabel={(col) => col.name} isOptionEqualToValue={(a, b) => a.name === b.name} disableClearable
                                    renderInput={(params) => <TextField {...params} size="small" placeholder="Search column…" InputProps={{ ...params.InputProps, sx: { fontSize: "0.82rem", fontFamily: "monospace" } }} />}
                                    renderOption={(props, col) => <Box component="li" {...props} key={col.name} sx={{ flexDirection: "column", alignItems: "flex-start !important", py: "4px !important" }}><span style={{ fontSize: "0.82rem", fontFamily: "monospace", color: "#1a1a1a" }}>{col.name}</span><span style={{ fontSize: "0.65rem", color: "#aaa" }}>{col.dataType}</span></Box>} />
                                ) : <span style={{ color: "#aaa", fontStyle: "italic", fontSize: "0.72rem" }}>select a table first</span>}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </CollapsibleSection>
        )}

        {/* Test API Connection */}
        {activeId && (
          <CollapsibleSection title="Test API Connection" open={sec.test} onToggle={() => toggleSec("test")}>
            <Box sx={{ width: "100%" }}>
              <Typography variant="caption" sx={{ color: "#777", display: "block", mb: 2 }}>
                Testing the config as last saved — save again after further changes to test those too.
              </Typography>
              {(() => {
                const dynNames = [...new Set([...form.verificationTokenApiRows, ...form.magicUrlApiRows, ...form.step1HeaderRows, ...form.step2HeaderRows].filter((r) => r.valueType === "dynamic").map((r) => r.placeholderName.trim() || r.key.trim()).filter(Boolean))];
                if (dynNames.length === 0) return null;
                return (
                  <Box mb={2}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" fontWeight={600} style={{ color: "#555" }}>Test values for dynamic fields:</Typography>
                      <Button size="small" variant="outlined" startIcon={<ContentPasteIcon sx={{ fontSize: 13 }} />}
                        onClick={() => setShowTestPaste((v) => !v)}
                        sx={{ textTransform: "none", fontSize: "0.72rem", py: 0.3, px: 1, borderColor: "#9575cd", color: "#7e57c2", "&:hover": { borderColor: "#7e57c2", bgcolor: "#f3f0ff" } }}>
                        {showTestPaste ? "Close" : "Paste JSON / cURL"}
                      </Button>
                    </Box>
                    {showTestPaste && (
                      <Box sx={{ mb: 1.5, borderRadius: 1.5, overflow: "hidden", border: "1.5px solid #ede7f6" }}>
                        <Box sx={{ px: 1.5, py: 0.8, bgcolor: "#f3f0ff", borderBottom: "1px solid #ede7f6", display: "flex", alignItems: "center", gap: 0.8 }}>
                          <ContentPasteIcon sx={{ fontSize: 13, color: "#7e57c2" }} />
                          <Typography variant="caption" fontWeight={700} sx={{ color: "#4527a0" }}>Paste JSON body or cURL — fields auto-fill instantly</Typography>
                        </Box>
                        <textarea
                          rows={3}
                          placeholder={'Paste JSON: {"policyNumber":"580000/48/2026/823",...}  or a full cURL command'}
                          style={{
                            width: "100%", boxSizing: "border-box", display: "block",
                            background: "#1e1e2e", color: "#cdd6f4", border: "none", outline: "none",
                            fontFamily: "'Fira Code','Courier New',monospace", fontSize: "0.74rem",
                            lineHeight: 1.8, padding: "10px 14px", resize: "none",
                          }}
                          onPaste={(e) => {
                            const raw = e.clipboardData.getData("text/plain") || e.clipboardData.getData("text");
                            if (!raw.trim()) return;
                            // Deliberately NOT calling preventDefault() — let the native paste land in
                            // the box too, so you can see what you pasted (and that pasting itself
                            // worked) even if the JSON/cURL parse below fails to find matching fields.
                            let json: Record<string, any> | null = null;
                            if (raw.trim().toLowerCase().startsWith("curl")) {
                              try { json = parseCurl(raw).bodyJson; } catch {}
                            } else {
                              try { json = JSON.parse(raw); } catch {}
                            }
                            if (!json) return;
                            const filled: Record<string, string> = {};
                            dynNames.forEach((name) => {
                              const val = json![name] ?? json![name.toLowerCase()];
                              if (val !== undefined) filled[name] = String(val);
                            });
                            if (Object.keys(filled).length > 0) {
                              setTestInputs((prev) => ({ ...prev, ...filled }));
                              setShowTestPaste(false);
                            }
                          }}
                        />
                      </Box>
                    )}
                    <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, overflow: "hidden", "& .MuiInputBase-input": { color: "#1a1a1a !important" } }}>
                      <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}><TableBody>
                        {dynNames.map((name) => (
                          <TableRow key={name} sx={{ "&:hover": { bgcolor: "#fafafa" } }}>
                            <TableCell sx={{ width: 200, borderRight: "1px solid #e0e0e0" }}>
                              <Tooltip title={`{{${name}}}`} placement="top">
                                <Box component="code" style={{ background: "#fff3e0", color: "#e65100", padding: "3px 8px", borderRadius: 4, fontFamily: "monospace", fontSize: "0.8rem", border: "1px solid #ffcc80", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{`{{${name}}}`}</Box>
                              </Tooltip>
                            </TableCell>
                            <TableCell><TextField size="small" fullWidth placeholder={`Enter test value for ${name}`} value={testInputs[name] ?? ""} onChange={(e) => setTestInputs((prev) => ({ ...prev, [name]: e.target.value }))} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody></Table>
                    </Box>
                  </Box>
                );
              })()}
              <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                {form.authType !== "DIRECT" && <Button size="small" variant="outlined" startIcon={testLoading ? <CircularProgress size={14} /> : <PlayArrowIcon />} disabled={testLoading} onClick={() => runTest(1)} sx={{ textTransform: "none" }}>Test Step 1 (Auth)</Button>}
                <Button size="small" variant="contained" startIcon={testLoading ? <CircularProgress size={14} /> : <PlayArrowIcon />} disabled={testLoading} onClick={() => runTest(2)} sx={{ textTransform: "none" }}>{form.authType === "DIRECT" ? "Test API" : "Test Full Flow"}</Button>
                {testResult && <Button size="small" onClick={() => setTestResult(null)} sx={{ textTransform: "none", color: "#777" }}>Clear</Button>}
              </Box>
              {testResult && testResult.preflightError && (
                <Alert severity="error" icon={<ErrorOutlineIcon />} sx={{ mt: 1 }}>
                  <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                    Test blocked — secrets not configured
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                    {testResult.message}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(testResult.unsetSecretKeys ?? []).map((k: string) => (
                      <Box key={k} sx={{ fontFamily: "monospace", fontSize: "0.68rem", bgcolor: "#ffebee", color: "#b71c1c", border: "1px solid #ef9a9a", borderRadius: 1, px: 0.8, py: 0.2 }}>{k}</Box>
                    ))}
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: "#555" }}>
                    Click "Update Credentials in Secret Manager" at the top of this form to set these values.
                  </Typography>
                </Alert>
              )}
              {testResult && !testResult.preflightError && (testResult.error ? <Alert severity="error" icon={<ErrorOutlineIcon />} sx={{ mt: 1 }}>{String(testResult.error)}</Alert> : (
                <Box mt={1}>
                  {(testResult.steps ?? []).map((s: any, i: number) => (
                    <Box key={i} mb={1.5}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        {s.status === "success" ? <CheckCircleOutlineIcon fontSize="small" color="success" /> : <ErrorOutlineIcon fontSize="small" color="error" />}
                        <Typography variant="caption" fontWeight={700} style={{ color: "#333" }}>Step {s.step} — {s.status === "success" ? "Success" : "Failed"}</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#fafafa" }}>
                        <Typography variant="caption" fontWeight={600} style={{ color: "#555", display: "block" }}>Payload sent:</Typography>
                        <pre style={{ margin: "4px 0 8px", fontSize: "0.75rem", overflow: "auto", maxHeight: 160, color: "#333" }}>{JSON.stringify(truncateLongStrings(s.payload), null, 2)}</pre>
                        <Typography variant="caption" fontWeight={600} style={{ color: "#555", display: "block" }}>Response:</Typography>
                        <pre style={{ margin: "4px 0 0", fontSize: "0.75rem", overflow: "auto", maxHeight: 400, color: s.status === "error" ? "#c62828" : "#1b5e20" }}>{JSON.stringify(truncateLongStrings(s.response ?? s.error), null, 2)}</pre>
                      </Paper>
                    </Box>
                  ))}
                  {testResult.finalResult && <Alert severity="success" icon={<CheckCircleOutlineIcon />}><Typography variant="caption" fontWeight={700} display="block">Final result:</Typography><pre style={{ margin: "4px 0 0", fontSize: "0.75rem", overflow: "auto", maxHeight: 300 }}>{JSON.stringify(truncateLongStrings(testResult.finalResult), null, 2)}</pre></Alert>}
                </Box>
              ))}
            </Box>
          </CollapsibleSection>
        )}

        {/* ── Response Mappings ─────────────────────────────────────────── */}
        <CollapsibleSection title="Response Mappings" open={sec.response} onToggle={() => toggleSec("response")}>
          <Box sx={{ width: "100%" }}>
            <Alert severity="info" sx={{ mb: 2, fontSize: "0.8rem" }}>
              Run the test above — discovered keys auto-populate here. Fill in <strong>Placeholder Name</strong> (Step 1) and <strong>Output Key</strong> (Step 2) to define how IBP reads the TPA response.
            </Alert>

            {/* Step 1 table — hidden for DIRECT (no auth step) */}
            {form.authType !== "DIRECT" && (
              <Box mb={3}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" fontWeight={700} style={{ color: "#1a1a1a" }}>Step 1 — Auth Response Keys</Typography>
                  {!disabled && (
                    <Button size="small" startIcon={<AddIcon />}
                      onClick={() => setStep1Mappings((p) => [...p, EMPTY_MAPPING_ROW(1, p.length)])}
                      sx={{ textTransform: "none", fontSize: "0.75rem" }}>Add Row</Button>
                  )}
                </Box>
                {step1Mappings.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: "center", border: "1.5px dashed #d0d0d0", borderRadius: 1, bgcolor: "#fafafa" }}>
                    <Typography variant="caption" style={{ color: "#999" }}>No keys yet — run Test Step 1 to auto-discover</Typography>
                  </Box>
                ) : (
                  <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, overflow: "auto", "& .MuiInputBase-input": { color: "#1a1a1a !important" }, "& .MuiSelect-select": { color: "#1a1a1a !important" } }}>
                    <Table size="small" sx={{ tableLayout: "fixed", minWidth: 600 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: "28%" }}>Response Key (dot-notation)</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: "20%" }}>Sample Value</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333" }}>Placeholder Name</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: 110, textAlign: "center" }}>Is Auth Token</TableCell>
                          {!disabled && <TableCell sx={{ width: 44 }} />}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {step1Mappings.map((row, idx) => (
                          <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#fafafa" }, verticalAlign: "middle" }}>
                            <TableCell>
                              <Autocomplete freeSolo size="small" disabled={disabled}
                                options={step1FlatKeys}
                                value={row.responseKey}
                                onInputChange={(_, val) => setStep1Mappings((p) => p.map((r, i) => i === idx ? { ...r, responseKey: val } : r))}
                                renderInput={(params) => (
                                  <TextField {...params} placeholder="e.g. access_token" size="small"
                                    InputProps={{ ...params.InputProps, sx: { fontFamily: "monospace", fontSize: "0.82rem" } }} />
                                )} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" style={{ color: "#555", fontFamily: "monospace", wordBreak: "break-all" }}>
                                {row.sampleValue ? truncateLongStrings(row.sampleValue) : <span style={{ color: "#bbb" }}>—</span>}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {/* freeSolo: admin can type any name or pick from existing payload {{placeholders}} */}
                              <Autocomplete freeSolo size="small" disabled={disabled}
                                options={uniqueDynamic}
                                value={row.outputKey}
                                onInputChange={(_, val) => setStep1Mappings((p) => p.map((r, i) => i === idx ? { ...r, outputKey: val } : r))}
                                renderInput={(params) => (
                                  <TextField {...params} placeholder="e.g. authToken" size="small"
                                    helperText="Used as {{placeholder}} in Step 2 payload"
                                    InputProps={{ ...params.InputProps, sx: { fontFamily: "monospace", fontSize: "0.82rem" } }} />
                                )}
                                renderOption={(props, o) => (
                                  <Box component="li" {...props} key={o}>
                                    <Box component="code" sx={{ fontSize: "0.8rem", color: "#e65100", background: "#fff3e0", px: 0.8, py: 0.2, borderRadius: 0.5 }}>{`{{${o}}}`}</Box>
                                  </Box>
                                )} />
                            </TableCell>
                            <TableCell sx={{ textAlign: "center" }}>
                              <Checkbox size="small" disabled={disabled} checked={!!row.isAuthToken}
                                onChange={(e) => {
                                  setStep1Mappings((p) => p.map((r, i) => i === idx ? { ...r, isAuthToken: e.target.checked } : r));
                                  if (e.target.checked && row.responseKey) patch("step1ResponseTokenKey", row.responseKey);
                                }} />
                            </TableCell>
                            {!disabled && (
                              <TableCell>
                                <IconButton size="small" onClick={() => setStep1Mappings((p) => p.filter((_, i) => i !== idx))}>
                                  <DeleteIcon fontSize="small" sx={{ color: "#e57373" }} />
                                </IconButton>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Box>
            )}

            {/* Step 2 — SYNC: column-centric (table columns on left, API key on right) */}
            {form.flowType === "SYNC" ? (
              <Box sx={{ width: "100%" }}>
                <Typography variant="body2" fontWeight={700} style={{ color: "#1a1a1a" }} mb={1.5}>
                  Step 2 — Map DB Columns → API Response Keys
                </Typography>
                <Alert severity="info" sx={{ mb: 2, fontSize: "0.8rem" }}>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    <li><strong>employee_tpa_id</strong> — TPA's unique ID for the employee/insured member.</li>
                    <li><strong>patient_tpa_id</strong> — TPA's unique ID for the specific patient (self or dependent) on this claim. Not the same field as employee_tpa_id, unless this TPA genuinely never distinguishes patients by ID.</li>
                    <li><strong>Dedup column (ref_claim_id)</strong> (below) — pick a field that is unique per record in the response (e.g. a claim ID) — used to detect this record already exists on re-sync, so it updates instead of duplicating.</li>
                    <li>Any ID-type column → map only to a field that is genuinely unique per record — never to a name/description/free-text field.</li>
                    <li>No matching field in this TPA's response? Leave the column unmapped — it stays NULL, which is correct. Don't map to the closest available field.</li>
                  </Box>
                </Alert>
                {syncTableList.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: "center", border: "1.5px dashed #d0d0d0", borderRadius: 1, bgcolor: "#fafafa" }}>
                    <Typography variant="caption" style={{ color: "#999" }}>Select tables in Sync Configuration above first</Typography>
                  </Box>
                ) : (
                  syncTableList.map((tableName) => {
                    const tableSchema = dbSchema.find((t) => t.tableName === tableName);
                    return (
                      <Box key={tableName} sx={{ mb: 3 }}>
                        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#2e7d32" }} />
                          <Typography fontWeight={700} fontFamily="monospace" fontSize="0.92rem" color="#2e7d32">{tableName}</Typography>
                          {tableSchema && (
                            <Typography variant="caption" color="text.secondary">{tableSchema.columns.length} columns</Typography>
                          )}
                          {!tableSchema && (
                            <Typography variant="caption" color="text.secondary" fontStyle="italic">schema loading…</Typography>
                          )}
                        </Box>
                        {!tableSchema ? (
                          <Typography variant="caption" sx={{ color: "#aaa", pl: 2 }}>
                            Run the test above to load the API response keys, then open this section.
                          </Typography>
                        ) : (
                          <Box sx={{ border: "1px solid #c8e6c9", borderRadius: 1, overflow: "auto", "& .MuiInputBase-input": { color: "#1a1a1a !important" } }}>
                            <Table size="small" sx={{ tableLayout: "fixed", minWidth: 700 }}>
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#f1f8e9" }}>
                                  <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#2e7d32", width: "35%" }}>DB Column</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#2e7d32", width: "10%" }}>Type</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#2e7d32" }}>← API Response Key</TableCell>
                                  <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#2e7d32", width: "18%" }}>Sample Value</TableCell>
                                  {!disabled && <TableCell sx={{ width: 40 }} />}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {tableSchema.columns.map((col) => {
                                  const mappingIdx = step2Mappings.findIndex((r) => r.targetTable === tableName && r.outputKey === col.name);
                                  const mapping = mappingIdx >= 0 ? step2Mappings[mappingIdx] : null;
                                  const sampleVal = mapping ? (step2FlattenedData[mapping.responseKey] ?? mapping.sampleValue ?? "") : "";
                                  const isMapped = !!mapping;
                                  return (
                                    <TableRow key={col.name} sx={{ "&:hover": { bgcolor: "#f9fbe7" }, bgcolor: isMapped ? "#f1f8e9" : "transparent", verticalAlign: "middle" }}>
                                      <TableCell>
                                        <Typography fontFamily="monospace" fontSize="0.82rem" fontWeight={isMapped ? 700 : 400} color={isMapped ? "#2e7d32" : "#555"}>{col.name}</Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="caption" color="text.secondary" fontSize="0.68rem" fontFamily="monospace">{col.dataType}</Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Autocomplete size="small" disabled={disabled}
                                          options={step2FlatKeys}
                                          value={mapping?.responseKey ?? null}
                                          onChange={(_, val) => {
                                            setStep2Mappings((p) => {
                                              const filtered = p.filter((r) => !(r.targetTable === tableName && r.outputKey === col.name));
                                              if (!val) return filtered;
                                              return [...filtered, {
                                                responseKey: val, sampleValue: step2FlattenedData[val] ?? "",
                                                targetType: "DB_COLUMN", outputKey: col.name, targetTable: tableName,
                                                isAuthToken: false, isPrimaryFk: false, displayOrder: filtered.length,
                                              }];
                                            });
                                          }}
                                          renderInput={(params) => (
                                            <TextField {...params} placeholder={step2FlatKeys.length > 0 ? "Select API field…" : "Run test above first"}
                                              size="small" InputProps={{ ...params.InputProps, sx: { fontFamily: "monospace", fontSize: "0.8rem" } }} />
                                          )}
                                          slotProps={{ popper: { style: { width: 480 } } }}
                                          renderOption={(props, o) => (
                                            <Box component="li" {...props} key={o} sx={{ flexDirection: "column", alignItems: "flex-start !important", py: "3px !important" }}>
                                              <span style={{ fontFamily: "monospace", fontSize: "0.8rem", whiteSpace: "normal", wordBreak: "break-all" }}>{o}</span>
                                              {step2FlattenedData[o] && <span style={{ fontSize: "0.67rem", color: "#888", whiteSpace: "normal", wordBreak: "break-all" }}>{String(step2FlattenedData[o]).slice(0, 50)}</span>}
                                            </Box>
                                          )} />
                                      </TableCell>
                                      <TableCell>
                                        <Typography variant="caption" sx={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#555", wordBreak: "break-all" }}>
                                          {sampleVal ? String(sampleVal).slice(0, 40) : <span style={{ color: "#ccc" }}>—</span>}
                                        </Typography>
                                      </TableCell>
                                      {!disabled && (
                                        <TableCell>
                                          {isMapped && (
                                            <IconButton size="small" onClick={() => setStep2Mappings((p) => p.filter((r) => !(r.targetTable === tableName && r.outputKey === col.name)))}>
                                              <DeleteIcon fontSize="small" sx={{ color: "#e57373" }} />
                                            </IconButton>
                                          )}
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </Box>
                        )}
                      </Box>
                    );
                  })
                )}
              </Box>
            ) : (
              /* REDIRECT / DISPLAY: key-centric view */
              <Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" fontWeight={700} style={{ color: "#1a1a1a" }}>
                    {form.authType === "DIRECT" ? "Response Keys" : "Step 2 — Data Response Keys"}
                  </Typography>
                  {!disabled && (
                    <Button size="small" startIcon={<AddIcon />}
                      onClick={() => setStep2Mappings((p) => [...p, EMPTY_MAPPING_ROW(2, p.length)])}
                      sx={{ textTransform: "none", fontSize: "0.75rem" }}>Add Row</Button>
                  )}
                </Box>
                {step2Mappings.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: "center", border: "1.5px dashed #d0d0d0", borderRadius: 1, bgcolor: "#fafafa" }}>
                    <Typography variant="caption" style={{ color: "#999" }}>No keys yet — run the test to auto-discover</Typography>
                  </Box>
                ) : (
                  <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, overflow: "auto", "& .MuiInputBase-input": { color: "#1a1a1a !important" } }}>
                    <Table size="small" sx={{ tableLayout: "fixed", minWidth: 780 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: "25%" }}>Response Key (dot-notation)</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: "13%" }}>Sample Value</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: "15%" }}>Target Type</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333" }}>Output Key</TableCell>
                          {!disabled && <TableCell sx={{ width: 44 }} />}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {step2Mappings.map((row, idx) => {
                          const standardKeyOpts = STANDARD_KEYS.map((k) => ({ value: k, label: k }));
                          const selectedStandardKey = standardKeyOpts.find((o) => o.value === row.outputKey) ?? null;
                          return (
                            <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#fafafa" }, verticalAlign: "middle" }}>
                              <TableCell>
                                {step2FlatKeys.length > 0 ? (
                                  <Autocomplete size="small" disabled={disabled}
                                    options={step2FlatKeys}
                                    value={row.responseKey || null}
                                    disableClearable={!!row.responseKey}
                                    onChange={(_, val) => setStep2Mappings((p) => p.map((r, i) => i === idx ? { ...r, responseKey: val ?? "" } : r))}
                                    renderInput={(params) => (
                                      <TextField {...params} placeholder="Select key…" size="small"
                                        InputProps={{ ...params.InputProps, sx: { fontFamily: "monospace", fontSize: "0.82rem" } }} />
                                    )}
                                    slotProps={{ popper: { style: { width: 480 } } }}
                                    renderOption={(props, o) => (
                                      <Box component="li" {...props} key={o}><span style={{ fontFamily: "monospace", fontSize: "0.8rem", whiteSpace: "normal", wordBreak: "break-all" }}>{o}</span></Box>
                                    )} />
                                ) : (
                                  <TextField size="small" fullWidth disabled={disabled} value={row.responseKey}
                                    placeholder="e.g. data.url"
                                    onChange={(e) => setStep2Mappings((p) => p.map((r, i) => i === idx ? { ...r, responseKey: e.target.value } : r))}
                                    InputProps={{ sx: { fontFamily: "monospace", fontSize: "0.82rem" } }} />
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" style={{ color: "#555", fontFamily: "monospace", wordBreak: "break-all", fontSize: "0.7rem" }}>
                                  {row.sampleValue ? truncateLongStrings(row.sampleValue) : <span style={{ color: "#ccc" }}>—</span>}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const targetTypeOpts = [
                                    { value: "STANDARD_KEY", label: "Standard Key", color: "#1565c0" },
                                    { value: "PLACEHOLDER",  label: "Placeholder",  color: "#6a1b9a" },
                                  ];
                                  const selectedTT = targetTypeOpts.find((o) => o.value === row.targetType) ?? null;
                                  return (
                                    <Autocomplete size="small" options={targetTypeOpts} value={selectedTT} disabled={disabled} disableClearable
                                      onChange={(_, opt) => {
                                        if (!opt) return;
                                        setStep2Mappings((p) => p.map((r, i) => i === idx ? { ...r, targetType: opt.value as TargetType, outputKey: "" } : r));
                                      }}
                                      getOptionLabel={(o) => o.label} isOptionEqualToValue={(a, b) => a.value === b.value}
                                      renderInput={(params) => (
                                        <TextField {...params} size="small"
                                          InputProps={{ ...params.InputProps, sx: { fontSize: "0.8rem", color: `${selectedTT?.color ?? "#1a1a1a"} !important`, fontWeight: 600 } }} />
                                      )}
                                      renderOption={(props, o) => (
                                        <Box component="li" {...props} key={o.value}>
                                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: o.color }}>{o.label}</span>
                                        </Box>
                                      )} />
                                  );
                                })()}
                              </TableCell>
                              <TableCell>
                                {row.targetType === "STANDARD_KEY" && (
                                  <Autocomplete size="small" options={standardKeyOpts} value={selectedStandardKey} disabled={disabled}
                                    onChange={(_, opt) => setStep2Mappings((p) => p.map((r, i) => i === idx ? { ...r, outputKey: opt?.value ?? "" } : r))}
                                    getOptionLabel={(o) => o.label} isOptionEqualToValue={(a, b) => a.value === b.value}
                                    renderInput={(params) => <TextField {...params} placeholder="Select key…" size="small" InputProps={{ ...params.InputProps, sx: { fontFamily: "monospace", fontSize: "0.8rem" } }} />}
                                    renderOption={(props, o) => <Box component="li" {...props} key={o.value}><span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#1565c0" }}>{o.label}</span></Box>} />
                                )}
                                {row.targetType === "PLACEHOLDER" && (
                                  <TextField size="small" fullWidth disabled={disabled} value={row.outputKey}
                                    placeholder="e.g. authToken"
                                    onChange={(e) => setStep2Mappings((p) => p.map((r, i) => i === idx ? { ...r, outputKey: e.target.value } : r))} />
                                )}
                              </TableCell>
                              {!disabled && (
                                <TableCell>
                                  <IconButton size="small" onClick={() => setStep2Mappings((p) => p.filter((_, i) => i !== idx))}>
                                    <DeleteIcon fontSize="small" sx={{ color: "#e57373" }} />
                                  </IconButton>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </CollapsibleSection>
        </>
        )}

        {/* SSO (TPA Portal Login) config — replaces everything above when selected */}
        {isSsoFeature && (
          <>
            <CollapsibleSection title="How do we get the redirect link?" open={sec.ssoDelivery} onToggle={() => toggleSec("ssoDelivery")}>
              <Box sx={{ width: "100%", display: "flex", gap: 2, flexWrap: "wrap" }}>
                {SSO_DELIVERY_MODE_CARDS.map((card) => {
                  const selected = ssoForm.ssoDeliveryMode === card.value;
                  return (
                    <Box key={card.value}
                      onClick={() => !disabled && setSsoForm((p) => ({ ...p, ssoDeliveryMode: card.value }))}
                      sx={{
                        flex: "1 1 300px", p: 2, borderRadius: 2, cursor: disabled ? "default" : "pointer",
                        border: "2px solid", borderColor: selected ? "#1976d2" : "#e0e0e0",
                        bgcolor: selected ? "#e3f2fd" : "#fff", transition: "all 0.15s",
                      }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: selected ? "#1565c0" : "#333" }}>{card.label}</Typography>
                      <Typography variant="caption" sx={{ color: "#666", display: "block", mt: 0.4 }}>{card.description}</Typography>
                      <Box component="code" sx={{ display: "block", mt: 1, fontSize: "0.7rem", color: "#999", wordBreak: "break-all" }}>{card.example}</Box>
                    </Box>
                  );
                })}
              </Box>
            </CollapsibleSection>

            {ssoForm.ssoDeliveryMode === "LOCAL_REDIRECT" && (
            <CollapsibleSection title="Portal URL" open={sec.basic} onToggle={() => toggleSec("basic")}>
              <Box sx={{ width: "100%" }}>
                <Typography variant="caption" sx={{ color: "#888", display: "block", mb: 1 }}>
                  The base link the TPA gave you. Any fixed/constant part (like a broker code)
                  can go straight in here — the fields you add below are appended automatically.
                </Typography>
                <TextField fullWidth size="small" disabled={disabled}
                  placeholder="https://tpa-portal.example.com/sso"
                  value={ssoForm.portalUrl} onChange={(e) => setSsoForm((p) => ({ ...p, portalUrl: e.target.value }))}
                  inputProps={{ style: { fontFamily: "monospace", fontSize: "0.82rem" } }} />
              </Box>
            </CollapsibleSection>
            )}

            {ssoForm.ssoDeliveryMode === "LOCAL_REDIRECT" && (
            <CollapsibleSection title="How should the values be sent?" open={sec.step1} onToggle={() => toggleSec("step1")}>
              <Box sx={{ width: "100%", display: "flex", gap: 2, flexWrap: "wrap" }}>
                {SSO_TOKEN_SHAPE_CARDS.map((card) => {
                  const selected = ssoForm.ssoTokenShape === card.value;
                  return (
                    <Box key={card.value}
                      onClick={() => !disabled && setSsoForm((p) => ({ ...p, ssoTokenShape: card.value }))}
                      sx={{
                        flex: "1 1 260px", p: 2, borderRadius: 2, cursor: disabled ? "default" : "pointer",
                        border: "2px solid", borderColor: selected ? "#1976d2" : "#e0e0e0",
                        bgcolor: selected ? "#e3f2fd" : "#fff", transition: "all 0.15s",
                      }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: selected ? "#1565c0" : "#333" }}>{card.label}</Typography>
                      <Typography variant="caption" sx={{ color: "#666", display: "block", mt: 0.4 }}>{card.description}</Typography>
                      <Box component="code" sx={{ display: "block", mt: 1, fontSize: "0.72rem", color: "#999" }}>{card.example}</Box>
                    </Box>
                  );
                })}
              </Box>
              {ssoForm.ssoTokenShape === "COMBINED_JSON" && (
                <Box sx={{ maxWidth: 280, width: "100%" }}>
                  <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>
                    Param name for the combined value in the link
                  </Typography>
                  <TextField fullWidth size="small" placeholder="e.g. token" disabled={disabled}
                    value={ssoForm.ssoTokenParamName} onChange={(e) => setSsoForm((p) => ({ ...p, ssoTokenParamName: e.target.value }))}
                    inputProps={{ style: { fontFamily: "monospace" } }} />
                </Box>
              )}
            </CollapsibleSection>
            )}

            <CollapsibleSection title={ssoForm.ssoDeliveryMode === "REMOTE_API_REDIRECT" ? "Fields We Encrypt & Send to the TPA" : "Fields Sent in the SSO Link"} open={sec.test} onToggle={() => toggleSec("test")}>
              <Box sx={{ width: "100%" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="caption" style={{ color: "#777" }}>
                    {ssoForm.ssoDeliveryMode === "REMOTE_API_REDIRECT"
                      ? "All of these are bundled together and encrypted once, then sent to the TPA's API."
                      : ssoForm.ssoTokenShape === "COMBINED_JSON"
                      ? "Everything listed here gets bundled together, then encrypted once."
                      : "Each field is encrypted on its own and appended to the Portal URL above."}
                  </Typography>
                  {!disabled && <Button size="small" startIcon={<AddIcon />} onClick={addSsoMapping} sx={{ textTransform: "none" }}>Add Field</Button>}
                </Box>

                {ssoForm.fieldMappings.length === 0 ? (
                  <Box sx={{ p: 2.5, textAlign: "center", border: "1.5px dashed #d0d0d0", borderRadius: 1, bgcolor: "#fafafa" }}>
                    <Typography variant="body2" style={{ color: "#888" }}>No fields yet{!disabled && ' — click "Add Field".'}</Typography>
                  </Box>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem" }}>
                          {ssoForm.ssoDeliveryMode === "REMOTE_API_REDIRECT" || ssoForm.ssoTokenShape === "COMBINED_JSON" ? "Key name" : "Param name in the link"}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem" }}>Source Table</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem" }}>Column / Value</TableCell>
                        {!disabled && <TableCell sx={{ width: 44 }} />}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ssoForm.fieldMappings.map((m, idx) => {
                        const sourceOpts = buildSsoSourceOptions(dbSchema);
                        const selectedSourceOpt = sourceOpts.find((o) => o.value === m.sourceType) ?? null;
                        const dbTable = dbSchema.find((t) => t.tableName === m.sourceType) ?? null;
                        const selectedCol = dbTable?.columns.find((c) => c.name === m.sourceField) ?? null;
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <TextField size="small" placeholder="e.g. partnerId" disabled={disabled} value={m.externalFieldName}
                                onChange={(e) => updateSsoMapping(idx, { externalFieldName: e.target.value })} />
                            </TableCell>
                            <TableCell sx={{ minWidth: 220 }}>
                              <Autocomplete size="small" disableClearable disabled={disabled} sx={{ minWidth: 220 }}
                                options={sourceOpts} value={selectedSourceOpt}
                                groupBy={(o) => o.group} getOptionLabel={(o) => o.label} isOptionEqualToValue={(a, b) => a.value === b.value}
                                onChange={(_, opt) => updateSsoMapping(idx, {
                                  sourceType: opt.value, staticValue: null,
                                  sourceField: opt.value === "STATIC" ? null : (SSO_FAST_PATH_FIELDS[opt.value]?.value ?? null),
                                })}
                                renderInput={(params) => <TextField {...params} size="small" placeholder="Search table…" InputProps={{ ...params.InputProps, sx: { fontSize: "0.82rem" } }} />}
                                renderOption={(props, o) => (
                                  <Box component="li" {...props} key={o.value} sx={{ gap: 1, py: "4px !important" }}>
                                    <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: o.color, display: "inline-block", flexShrink: 0 }} />
                                    <span style={{ fontSize: "0.82rem", fontFamily: o.mono ? "monospace" : "inherit" }}>{o.label}</span>
                                  </Box>
                                )}
                                renderGroup={(params) => (
                                  <Box key={params.key}>
                                    {params.group !== "Special" && (
                                      <Typography variant="caption" sx={{ px: 1.5, py: 0.4, display: "block", fontWeight: 700, fontSize: "0.63rem", textTransform: "uppercase", letterSpacing: 1, color: sourceOpts.find((o) => o.group === params.group)?.color ?? "#666", bgcolor: "#f7f7f7", borderBottom: "1px solid #eee" }}>
                                        {params.group}
                                      </Typography>
                                    )}
                                    {params.children}
                                  </Box>
                                )} />
                            </TableCell>
                            <TableCell sx={{ minWidth: 210 }}>
                              {m.sourceType === "STATIC" ? (
                                <TextField size="small" placeholder='e.g. "MAIN"' disabled={disabled} value={m.staticValue ?? ""}
                                  onChange={(e) => updateSsoMapping(idx, { staticValue: e.target.value })} />
                              ) : m.sourceType === "POLICY" || m.sourceType === "EMPLOYEE" ? (
                                <Typography variant="body2" sx={{ color: "#333", fontFamily: "monospace", fontSize: "0.8rem" }}>
                                  {SSO_FAST_PATH_FIELDS[m.sourceType]?.label}
                                </Typography>
                              ) : dbTable ? (
                                <Autocomplete size="small" disabled={disabled} options={dbTable.columns} value={selectedCol}
                                  onChange={(_, col) => updateSsoMapping(idx, { sourceField: col?.name ?? null })}
                                  getOptionLabel={(col) => col.name} isOptionEqualToValue={(a, b) => a.name === b.name} disableClearable
                                  renderInput={(params) => <TextField {...params} size="small" placeholder="Search column…" InputProps={{ ...params.InputProps, sx: { fontSize: "0.82rem", fontFamily: "monospace" } }} />}
                                  renderOption={(props, col) => (
                                    <Box component="li" {...props} key={col.name} sx={{ flexDirection: "column", alignItems: "flex-start !important", py: "4px !important" }}>
                                      <span style={{ fontSize: "0.82rem", fontFamily: "monospace", color: "#1a1a1a" }}>{col.name}</span>
                                      <span style={{ fontSize: "0.65rem", color: "#aaa" }}>{col.dataType}</span>
                                    </Box>
                                  )} />
                              ) : (
                                <span style={{ color: "#aaa", fontStyle: "italic", fontSize: "0.72rem" }}>select a table first</span>
                              )}
                            </TableCell>
                            {!disabled && (
                              <TableCell>
                                <Tooltip title="Remove"><IconButton size="small" color="error" onClick={() => removeSsoMapping(idx)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Box>
            </CollapsibleSection>

            <CollapsibleSection title="Encryption Key & IV" open={sec.step2} onToggle={() => toggleSec("step2")}>
              <Box sx={{ width: "100%" }}>
                <Typography variant="caption" sx={{ color: "#888" }}>
                  Only the environment variable <em>name</em> is stored here — the real secret value
                  is never saved to the database. Use "Update Credentials in Secret Manager" above to
                  set the actual value directly in AWS Secrets Manager, same as ECard/Claims fields.
                </Typography>
              </Box>
              {(() => {
                const renderSecretStatus = (envName: string) => {
                  const trimmed = envName.trim();
                  if (!trimmed) return null;
                  const isSet = ssoSecretStatus[trimmed];
                  const statusLoaded = isSet !== undefined;
                  const hasError = Boolean(ssoSecretStatusError) && !statusLoaded;
                  const label = hasError ? `⚠ Status check failed` : !statusLoaded ? "checking…" : isSet ? "✓ Set — will work" : "✗ Not set — won't work yet";
                  return (
                    <Tooltip title={hasError ? ssoSecretStatusError : ""} placement="top">
                      <Box sx={{
                        display: "inline-flex", alignItems: "center", gap: 0.4, px: 0.8, py: 0.1, ml: 1,
                        borderRadius: 1, fontSize: "0.65rem", fontWeight: 700,
                        bgcolor: hasError ? "#ffebee" : !statusLoaded ? "#f5f5f5" : isSet ? "#e8f5e9" : "#fff3e0",
                        color: hasError ? "#c62828" : !statusLoaded ? "#999" : isSet ? "#2e7d32" : "#e65100",
                        border: `1px solid ${hasError ? "#ef9a9a" : !statusLoaded ? "#e0e0e0" : isSet ? "#a5d6a7" : "#ffcc80"}`,
                      }}>
                        {label}
                      </Box>
                    </Tooltip>
                  );
                };
                return (
                  <>
                    <Box sx={{ minWidth: 280, flex: "1 1 320px" }}>
                      <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>
                        Key — env var name{renderSecretStatus(ssoForm.ssoKeyEnvName)}
                      </Typography>
                      <Tooltip title={ssoForm.ssoKeyEnvName || ""} placement="top" disableHoverListener={ssoForm.ssoKeyEnvName.length < 30}>
                        <TextField fullWidth size="small" placeholder="e.g. GHPL_WEB_SSO_KEY" disabled={disabled}
                          value={ssoForm.ssoKeyEnvName}
                          onChange={(e) => setSsoForm((p) => ({ ...p, ssoKeyEnvName: e.target.value }))}
                          inputProps={{ style: { fontFamily: "monospace", fontSize: "0.8rem" } }}
                          InputProps={{ startAdornment: <InputAdornment position="start">
                            <Tooltip title={disabled || !ssoForm.ssoKeyEnvName.trim() ? "" : !activeId ? "Save this config first, then set the secret value" : "Set the actual value in Secrets Manager"}>
                              <span>
                                <IconButton size="small" sx={{ p: 0.3 }} disabled={disabled || !ssoForm.ssoKeyEnvName.trim() || !activeId}
                                  onClick={() => openCredDialog([{ key: ssoForm.ssoKeyEnvName.trim(), label: "TPA SSO — Encryption Key" }])}>
                                  <LockIcon sx={{ fontSize: 16, color: ssoSecretStatus[ssoForm.ssoKeyEnvName.trim()] ? "#7b1fa2" : "#bdbdbd" }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </InputAdornment> }} />
                      </Tooltip>
                    </Box>
                    <Box sx={{ maxWidth: 220, width: "100%" }}>
                      <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Where does the IV come from?</Typography>
                      <TextField select fullWidth size="small" disabled={disabled}
                        value={ssoForm.ssoIvMode} onChange={(e) => setSsoForm((p) => ({ ...p, ssoIvMode: e.target.value as SsoIvMode }))}
                        SelectProps={{ native: true }}>
                        {SSO_IV_MODE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </TextField>
                    </Box>
                    {ssoForm.ssoIvMode === "FIXED" && (
                      <Box sx={{ minWidth: 280, flex: "1 1 320px" }}>
                        <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>
                          IV — env var name{renderSecretStatus(ssoForm.ssoIvEnvName)}
                        </Typography>
                        <Tooltip title={ssoForm.ssoIvEnvName || ""} placement="top" disableHoverListener={ssoForm.ssoIvEnvName.length < 30}>
                          <TextField fullWidth size="small" placeholder="e.g. GHPL_WEB_SSO_IV" disabled={disabled}
                            value={ssoForm.ssoIvEnvName}
                            onChange={(e) => setSsoForm((p) => ({ ...p, ssoIvEnvName: e.target.value }))}
                            inputProps={{ style: { fontFamily: "monospace", fontSize: "0.8rem" } }}
                            InputProps={{ startAdornment: <InputAdornment position="start">
                              <Tooltip title={disabled || !ssoForm.ssoIvEnvName.trim() ? "" : !activeId ? "Save this config first, then set the secret value" : "Set the actual value in Secrets Manager"}>
                                <span>
                                  <IconButton size="small" sx={{ p: 0.3 }} disabled={disabled || !ssoForm.ssoIvEnvName.trim() || !activeId}
                                    onClick={() => openCredDialog([{ key: ssoForm.ssoIvEnvName.trim(), label: "TPA SSO — Encryption IV" }])}>
                                    <LockIcon sx={{ fontSize: 16, color: ssoSecretStatus[ssoForm.ssoIvEnvName.trim()] ? "#7b1fa2" : "#bdbdbd" }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </InputAdornment> }} />
                        </Tooltip>
                      </Box>
                    )}
                  </>
                );
              })()}
              {ssoForm.ssoIvMode === "RANDOM_EMBEDDED" && (
                <Box sx={{ maxWidth: 140, width: "100%" }}>
                  <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Separator</Typography>
                  <TextField fullWidth size="small" disabled={disabled} value={ssoForm.ssoIvEnvelopeSeparator}
                    onChange={(e) => setSsoForm((p) => ({ ...p, ssoIvEnvelopeSeparator: e.target.value }))} />
                </Box>
              )}

              <Box sx={{ width: "100%" }}>
                <Button size="small" onClick={() => setSsoAdvancedOpen((v) => !v)} sx={{ textTransform: "none", color: "#666", px: 0 }}>
                  {ssoAdvancedOpen ? "Hide advanced settings" : "Advanced settings"}
                </Button>
                <Typography variant="caption" sx={{ color: "#bbb", display: "block" }}>
                  Only change these if your TPA's documentation specifically says so — the defaults work for most.
                </Typography>
              </Box>

              {ssoAdvancedOpen && (
                <>
                  <Box sx={{ maxWidth: 220, width: "100%" }}>
                    <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Key format</Typography>
                    <TextField select fullWidth size="small" disabled={disabled}
                      value={ssoForm.ssoKeyEncoding} onChange={(e) => setSsoForm((p) => ({ ...p, ssoKeyEncoding: e.target.value as SsoKeyEncoding }))}
                      SelectProps={{ native: true }}>
                      {SSO_KEY_ENCODING_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </TextField>
                  </Box>
                  <Box sx={{ maxWidth: 220, width: "100%" }}>
                    <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Padding</Typography>
                    <TextField select fullWidth size="small" disabled={disabled}
                      value={ssoForm.ssoPadding} onChange={(e) => setSsoForm((p) => ({ ...p, ssoPadding: e.target.value as SsoPadding }))}
                      SelectProps={{ native: true }}>
                      {SSO_PADDING_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </TextField>
                  </Box>
                  <Box sx={{ maxWidth: 220, width: "100%" }}>
                    <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Text format</Typography>
                    <TextField select fullWidth size="small" disabled={disabled}
                      value={ssoForm.ssoTextEncoding} onChange={(e) => setSsoForm((p) => ({ ...p, ssoTextEncoding: e.target.value as SsoTextEncoding }))}
                      SelectProps={{ native: true }}>
                      {SSO_TEXT_ENCODING_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </TextField>
                  </Box>
                  <Box sx={{ maxWidth: 280, width: "100%" }}>
                    <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>How are values put in the link?</Typography>
                    <TextField select fullWidth size="small" disabled={disabled}
                      value={ssoForm.ssoUrlEncode ? "encode" : "raw"}
                      onChange={(e) => setSsoForm((p) => ({ ...p, ssoUrlEncode: e.target.value === "encode" }))}
                      SelectProps={{ native: true }}>
                      <option value="encode">URL-encoded (standard — most TPAs)</option>
                      <option value="raw">Raw base64 (HealthIndia — server doesn't URL-decode)</option>
                    </TextField>
                    <Typography variant="caption" sx={{ color: "#999", display: "block", mt: 0.5 }}>
                      Use "Raw" only if the TPA's SSO page reads the query without decoding, so %2F/%3D would break the token.
                    </Typography>
                  </Box>
                  <Box sx={{ width: "100%" }}>
                    <Typography variant="caption" sx={{ color: "#999" }}>
                      {SSO_KEY_ENCODING_OPTS.find((o) => o.value === ssoForm.ssoKeyEncoding)?.hint} · {SSO_PADDING_OPTS.find((o) => o.value === ssoForm.ssoPadding)?.hint} · {SSO_TEXT_ENCODING_OPTS.find((o) => o.value === ssoForm.ssoTextEncoding)?.hint}
                    </Typography>
                  </Box>
                  <Box sx={{ width: "100%" }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: "#555", display: "block", mb: 0.5 }}>
                      Character replacements (optional)
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#888", display: "block", mb: 1 }}>
                      e.g. GHPL requires every "+" in the encrypted output to become "@".
                    </Typography>
                    {ssoForm.outputTransformRows.map((row, idx) => (
                      <Box key={idx} display="flex" gap={1} alignItems="center" mb={1}>
                        <TextField size="small" label="From" sx={{ width: 100 }} disabled={disabled} value={row.from} onChange={(e) => updateSsoTransformRow(idx, { from: e.target.value })} />
                        <Typography variant="body2" sx={{ color: "#999" }}>→</Typography>
                        <TextField size="small" label="To" sx={{ width: 100 }} disabled={disabled} value={row.to} onChange={(e) => updateSsoTransformRow(idx, { to: e.target.value })} />
                        {!disabled && <IconButton size="small" color="error" onClick={() => removeSsoTransformRow(idx)}><DeleteIcon fontSize="small" /></IconButton>}
                      </Box>
                    ))}
                    {!disabled && <Button size="small" startIcon={<AddIcon />} onClick={addSsoTransformRow} sx={{ textTransform: "none" }}>Add Rule</Button>}
                  </Box>
                </>
              )}
            </CollapsibleSection>

            {ssoForm.ssoDeliveryMode === "REMOTE_API_REDIRECT" && (
            <CollapsibleSection title="TPA's SSO API" open={sec.fieldMappings} onToggle={() => toggleSec("fieldMappings")}>
              <Box sx={{ width: "100%" }}>
                <Typography variant="caption" sx={{ color: "#888", display: "block", mb: 1.5 }}>
                  We'll send the encrypted data above to this API and read the real redirect link back from their reply.
                </Typography>
                {!disabled && (
                  ssoCurlOpen ? (
                    <SsoRemoteApiCurlPaste onApply={applySsoParsedCurl} onClose={() => setSsoCurlOpen(false)} />
                  ) : (
                    <Button size="small" variant="outlined" startIcon={<ContentPasteIcon sx={{ fontSize: 14 }} />}
                      onClick={() => setSsoCurlOpen(true)} sx={{ textTransform: "none", mb: 2 }}>
                      Paste a cURL to fill this in
                    </Button>
                  )
                )}
              </Box>

              <Box sx={{ maxWidth: 110, width: "100%" }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Method</Typography>
                <TextField select fullWidth size="small" disabled={disabled} value={ssoForm.remoteApiMethod}
                  onChange={(e) => setSsoForm((p) => ({ ...p, remoteApiMethod: e.target.value }))} SelectProps={{ native: true }}>
                  {["POST", "GET", "PUT", "PATCH"].map((m) => <option key={m} value={m}>{m}</option>)}
                </TextField>
              </Box>
              <Box sx={{ flex: "1 1 400px", minWidth: 280 }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>API URL *</Typography>
                <TextField fullWidth size="small" disabled={disabled} placeholder="https://api.tpa.com/sso-v2"
                  value={ssoForm.remoteApiUrl} onChange={(e) => setSsoForm((p) => ({ ...p, remoteApiUrl: e.target.value }))}
                  inputProps={{ style: { fontFamily: "monospace", fontSize: "0.82rem" } }} />
              </Box>

              <Box sx={{ width: "100%" }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: "#555", display: "block", mb: 0.5 }}>Headers</Typography>
                <Typography variant="caption" sx={{ color: "#888", display: "block", mb: 1 }}>
                  Anything the TPA's API needs in the header, e.g. an API key. Use <Box component="code" sx={{ fontSize: "0.72rem" }}>{"{{env:VAR_NAME}}"}</Box> for
                  a secret instead of typing the real value — same as the encryption key below.
                </Typography>
                {ssoForm.remoteApiHeaderRows.map((row, idx) => (
                  <Box key={idx} display="flex" gap={1} alignItems="center" mb={1}>
                    <TextField size="small" label="Header name" sx={{ width: 220 }} disabled={disabled} value={row.key}
                      onChange={(e) => updateRemoteHeaderRow(idx, { key: e.target.value })} />
                    <TextField size="small" label="Value" sx={{ flex: 1 }} disabled={disabled} value={row.value}
                      onChange={(e) => updateRemoteHeaderRow(idx, { value: e.target.value })}
                      inputProps={{ style: { fontFamily: "monospace", fontSize: "0.8rem" } }} />
                    {!disabled && <IconButton size="small" color="error" onClick={() => removeRemoteHeaderRow(idx)}><DeleteIcon fontSize="small" /></IconButton>}
                  </Box>
                ))}
                {!disabled && <Button size="small" startIcon={<AddIcon />} onClick={addRemoteHeaderRow} sx={{ textTransform: "none" }}>Add Header</Button>}
              </Box>

              <Box sx={{ maxWidth: 280, width: "100%" }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Field name for our encrypted data</Typography>
                <TextField fullWidth size="small" placeholder="e.g. payload" disabled={disabled}
                  value={ssoForm.remoteRequestPayloadKey} onChange={(e) => setSsoForm((p) => ({ ...p, remoteRequestPayloadKey: e.target.value }))}
                  helperText="The key in the request body that carries the encrypted data"
                  inputProps={{ style: { fontFamily: "monospace" } }} />
              </Box>

              <Box sx={{ width: "100%" }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: "#555", display: "block", mb: 0.5 }}>Other fields to send alongside it</Typography>
                <Typography variant="caption" sx={{ color: "#888", display: "block", mb: 1 }}>
                  Fixed values their API expects on every call, e.g. a source name or partner ID.
                </Typography>
                {ssoForm.remoteRequestExtraFieldRows.map((row, idx) => (
                  <Box key={idx} display="flex" gap={1} alignItems="center" mb={1}>
                    <TextField size="small" label="Field name" sx={{ width: 220 }} disabled={disabled} value={row.key}
                      onChange={(e) => updateRemoteExtraRow(idx, { key: e.target.value })} />
                    <TextField size="small" label="Value" sx={{ flex: 1 }} disabled={disabled} value={row.value}
                      onChange={(e) => updateRemoteExtraRow(idx, { value: e.target.value })} />
                    {!disabled && <IconButton size="small" color="error" onClick={() => removeRemoteExtraRow(idx)}><DeleteIcon fontSize="small" /></IconButton>}
                  </Box>
                ))}
                {!disabled && <Button size="small" startIcon={<AddIcon />} onClick={addRemoteExtraRow} sx={{ textTransform: "none" }}>Add Field</Button>}
              </Box>

              <Box sx={{ width: "100%", pt: 1.5, borderTop: "1px dashed #e0e0e0" }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: "#555", display: "block", mb: 0.5 }}>Reading their reply</Typography>
                <Typography variant="caption" sx={{ color: "#888", display: "block" }}>
                  Their API sends back its own encrypted answer — tell us where to find it and how to decrypt it.
                </Typography>
              </Box>

              <Box sx={{ maxWidth: 220, width: "100%" }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Where's the encrypted answer?</Typography>
                <TextField fullWidth size="small" placeholder="e.g. data" disabled={disabled}
                  value={ssoForm.remoteResponseDataPath} onChange={(e) => setSsoForm((p) => ({ ...p, remoteResponseDataPath: e.target.value }))}
                  helperText="Field name in their JSON reply" inputProps={{ style: { fontFamily: "monospace" } }} />
              </Box>

              <Box sx={{ minWidth: 280, flex: "1 1 320px" }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Key to decrypt their reply — env var name</Typography>
                <Tooltip title={ssoForm.remoteResponseDecryptKeyEnvName || ""} placement="top" disableHoverListener={ssoForm.remoteResponseDecryptKeyEnvName.length < 30}>
                  <TextField fullWidth size="small" placeholder="e.g. VIDAL_SSO_RESPONSE_KEY" disabled={disabled}
                    value={ssoForm.remoteResponseDecryptKeyEnvName}
                    onChange={(e) => setSsoForm((p) => ({ ...p, remoteResponseDecryptKeyEnvName: e.target.value }))}
                    inputProps={{ style: { fontFamily: "monospace", fontSize: "0.8rem" } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ fontSize: 16, color: "#7b1fa2" }} /></InputAdornment> }} />
                </Tooltip>
              </Box>

              <Box sx={{ maxWidth: 220, width: "100%" }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Where's the redirect link?</Typography>
                <TextField fullWidth size="small" placeholder="e.g. redirectUrl" disabled={disabled}
                  value={ssoForm.remoteResponseRedirectUrlPath} onChange={(e) => setSsoForm((p) => ({ ...p, remoteResponseRedirectUrlPath: e.target.value }))}
                  helperText="Field name once decrypted" inputProps={{ style: { fontFamily: "monospace" } }} />
              </Box>
            </CollapsibleSection>
            )}

            <CollapsibleSection title="Preview" open={sec.response} onToggle={() => toggleSec("response")}>
              <Box sx={{ width: "100%" }}>
                <Typography variant="caption" sx={{ color: "#888", display: "block", mb: 0.8 }}>
                  {ssoForm.ssoDeliveryMode === "REMOTE_API_REDIRECT"
                    ? "Roughly what we'll send and how we'll read their reply (updates as you edit above):"
                    : "Roughly how your link will be shaped (updates as you edit above — no real values yet):"}
                </Typography>
                <Box component="pre" sx={{
                  p: 1.2, bgcolor: "#f5f5f5", color: "#555", borderRadius: 1, border: "1px dashed #ddd",
                  fontSize: "0.72rem", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", m: 0, mb: 1.5,
                }}>
                  {ssoForm.ssoDeliveryMode === "REMOTE_API_REDIRECT" ? buildSsoRemoteApiShapePreview(ssoForm) : buildSsoUrlShapePreview(ssoForm)}
                </Box>
                <Button size="small" variant="outlined" startIcon={<PlayArrowIcon />} disabled={!ssoConfigId} onClick={handleSsoPreview} sx={{ textTransform: "none" }}>
                  {ssoForm.ssoDeliveryMode === "REMOTE_API_REDIRECT" ? "Call TPA API & Preview" : "Preview URL"}
                </Button>
                {ssoForm.ssoDeliveryMode === "REMOTE_API_REDIRECT" && ssoConfigId && (
                  <Typography variant="caption" sx={{ color: "#999", display: "block", mt: 0.8 }}>
                    This makes a real call to the TPA's API using sample data — same as testing any other API config.
                  </Typography>
                )}
                {!ssoConfigId && (
                  <Typography variant="caption" sx={{ color: "#999", display: "block", mt: 0.8 }}>
                    Save this config first, then come back for a real encrypted preview.
                  </Typography>
                )}
              </Box>
            </CollapsibleSection>
          </>
        )}

        {/* Bottom Save/Cancel */}
        {!isView && (
          <Box display="flex" flexDirection="column" gap={1} mt={2}>
            {linkedByRefs.length > 0 && !form.authAppRefId && (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                <Typography variant="body2" sx={{ fontSize: "0.82rem" }}>
                  Saving will update Step 1 credentials shared by: {linkedByRefs.map((r) => `"${r.label}"`).join(", ")}
                </Typography>
              </Alert>
            )}
            <Box display="flex" justifyContent="flex-end" gap={1.5}>
              <Button variant="outlined" onClick={() => navigate(listPath)}
                sx={{ textTransform: "none", color: "#555", borderColor: "#ccc" }}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={saving}
                startIcon={saving ? <CircularProgress size={16} /> : undefined}
                sx={{ textTransform: "none", fontWeight: 600 }}>
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Config"}
              </Button>
            </Box>
          </Box>
        )}

      </Box>

      {/* .env Keys Dialog */}
      {/* Credentials Dialog — values always masked, writes ALL secured keys to AWS Secrets Manager */}
      <Dialog open={credDialog.open} onClose={() => !credDialog.saving && setCredDialog(p => ({ ...p, open: false }))} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LockIcon sx={{ fontSize: 18, color: "#7b1fa2" }} />
            <Typography fontWeight={700} fontSize="0.95rem">Update Credentials in Secret Manager</Typography>
          </Box>
          <IconButton size="small" onClick={() => setCredDialog(p => ({ ...p, open: false }))} disabled={credDialog.saving}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="caption" sx={{ color: "#888", display: "block", mb: 2 }}>
            Values go directly to AWS Secrets Manager — never stored in the database. Leave blank to keep the existing value.
          </Typography>
          {credDialog.loadingStatus && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <CircularProgress size={12} />
              <Typography variant="caption" sx={{ color: "#888" }}>Checking current status in Secrets Manager…</Typography>
            </Box>
          )}
          {credDialog.keys.map((item, idx) => {
            const isSet = item.isSet;
            const statusLoaded = item.isSet !== undefined;
            const statusMessage = !statusLoaded
              ? "Checking configuration status…"
              : isSet
                ? "Already configured — enter a new value only if you want to change it."
                : "Not configured yet — please set a value below.";
            return (
              <Box key={item.key} sx={{ mb: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.4 }}>
                  <Typography variant="caption" sx={{ color: "#555", fontWeight: 600 }}>{item.label}</Typography>
                  {statusLoaded && (
                    <Box sx={{
                      display: "inline-flex", alignItems: "center", gap: 0.4, px: 0.8, py: 0.1,
                      borderRadius: 1, fontSize: "0.65rem", fontWeight: 700,
                      bgcolor: isSet ? "#e8f5e9" : "#fff3e0",
                      color: isSet ? "#2e7d32" : "#e65100",
                      border: `1px solid ${isSet ? "#a5d6a7" : "#ffcc80"}`,
                    }}>
                      {isSet ? "✓ Set" : "✗ Not set"}
                    </Box>
                  )}
                </Box>
                <Typography variant="caption" sx={{ color: "#9e9e9e", fontFamily: "monospace", fontSize: "0.7rem", display: "block", mb: 0.5 }}>{item.key}</Typography>
                <Typography variant="caption" sx={{ color: statusLoaded && !isSet ? "#e65100" : "#888", display: "block", mb: 0.5 }}>
                  {statusMessage}
                </Typography>
                <TextField
                  fullWidth size="small" type="password" autoComplete="new-password"
                  placeholder={statusLoaded && !isSet ? "Required — enter value" : "Leave blank to keep existing"}
                  inputProps={{ style: { fontFamily: "monospace" } }}
                  sx={statusLoaded && !isSet ? { "& .MuiOutlinedInput-root": { borderColor: "#e65100" }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ffcc80" } } : {}}
                  value={item.value}
                  onChange={(e) => setCredDialog(p => ({ ...p, error: "", keys: p.keys.map((k, i) => i === idx ? { ...k, value: e.target.value } : k) }))}
                  disabled={credDialog.saving} />
              </Box>
            );
          })}
          {credDialog.error && (
            <Typography variant="caption" sx={{ color: "#d32f2f", display: "block", mt: 1 }}>{credDialog.error}</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => { setCredDialog(p => ({ ...p, open: false })); navigate(isSsoFeature ? `/tpa/${form.assignTpaId}/external-features` : listPath); }} disabled={credDialog.saving} sx={{ textTransform: "none" }}>Skip for now</Button>
          <Button
            size="small" variant="contained"
            disabled={credDialog.saving || credDialog.keys.every(k => !k.value.trim())}
            sx={{ textTransform: "none", bgcolor: "#7b1fa2", "&:hover": { bgcolor: "#4a148c" } }}
            onClick={async () => {
              const activeId = savedFormId ?? (refId ? Number(refId) : undefined);
              if (!activeId) return;
              const keysToUpdate = credDialog.keys.filter(k => k.value.trim()).reduce((acc, k) => ({ ...acc, [k.key]: k.value }), {} as Record<string, string>);
              if (Object.keys(keysToUpdate).length === 0) { setCredDialog(p => ({ ...p, open: false })); return; }
              setCredDialog(p => ({ ...p, saving: true, error: "" }));
              try {
                await apiRequest(endPoints.tpaFeatureUpdateSecretKeys(activeId), {
                  method: "POST",
                  data: { keys: keysToUpdate },
                });
                setCredDialog({ open: false, keys: [], saving: false, error: "", loadingStatus: false });
                navigate(isSsoFeature ? `/tpa/${form.assignTpaId}/external-features` : listPath);
              } catch (err: any) {
                setCredDialog(p => ({ ...p, saving: false, error: err?.response?.data?.message ?? err?.message ?? "Failed to update credentials" }));
              }
            }}>
            {credDialog.saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : `Save ${credDialog.keys.filter(k => k.value.trim()).length || credDialog.keys.length} key(s) to Secret Manager`}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={envDialogOpen} onClose={() => setEnvDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Typography fontWeight={700} fontSize="1rem">.env Keys — {form.label}</Typography>
          <Box display="flex" gap={1}>
            <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />}
              onClick={() => navigator.clipboard.writeText(envDialogContent)}
              sx={{ textTransform: "none", fontSize: "0.78rem" }}>
              Copy All
            </Button>
            <IconButton size="small" onClick={() => setEnvDialogOpen(false)}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography variant="body2" sx={{ fontSize: "0.77rem", color: "#666", mb: 1.5 }}>
            Add these to your server <code>.env</code> file with the actual values.
          </Typography>
          <Box component="pre" sx={{
            fontSize: "0.82rem", fontFamily: "monospace", background: "#1a1a2e", color: "#a8d8a8",
            p: "14px 16px", borderRadius: 1, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", m: 0,
          }}>
            {envDialogContent}
          </Box>
        </DialogContent>
      </Dialog>

      {/* SSO preview dialog */}
      <Dialog open={ssoPreviewOpen} onClose={() => setSsoPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Preview SSO Redirect URL</DialogTitle>
        <DialogContent>
          {ssoPreviewLoading ? (
            <Box display="flex" justifyContent="center" py={3}><CircularProgress size={28} /></Box>
          ) : ssoPreviewResult?.error ? (
            <Alert severity="error">{ssoPreviewResult.error}</Alert>
          ) : ssoPreviewResult?.redirectUrl ? (
            <Box>
              <Typography variant="caption" sx={{ color: "#888", display: "block", mb: 1.5 }}>
                Built using auto-generated sample values (no real employee data used):
              </Typography>

              {ssoPreviewResult.deliveryMode === "REMOTE_API_REDIRECT" ? (
                <>
                  {ssoPreviewResult.requestSent && (
                    <Box mb={1.5}>
                      <Typography variant="caption" fontWeight={700} sx={{ color: "#555", display: "block", mb: 0.5 }}>
                        Request sent to the TPA's API:
                      </Typography>
                      <Box component="pre" sx={{
                        p: 1.5, bgcolor: "#1a1a2e", color: "#f0c674", borderRadius: 1,
                        fontSize: "0.75rem", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", m: 0,
                      }}>
                        {JSON.stringify(ssoPreviewResult.requestSent, null, 2)}
                      </Box>
                    </Box>
                  )}
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#555", display: "block", mb: 0.5 }}>
                    After decrypting their reply, the redirect link is:
                  </Typography>
                </>
              ) : (
                <>
                  {ssoPreviewResult.payload && (
                    <Box mb={1.5}>
                      <Typography variant="caption" fontWeight={700} sx={{ color: "#555", display: "block", mb: 0.5 }}>
                        {ssoPreviewResult.tokenShape === "COMBINED_JSON"
                          ? "This data is combined into one value and encrypted:"
                          : "Each of these is encrypted separately:"}
                      </Typography>
                      <Box component="pre" sx={{
                        p: 1.5, bgcolor: "#1a1a2e", color: "#f0c674", borderRadius: 1,
                        fontSize: "0.75rem", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", m: 0,
                      }}>
                        {JSON.stringify(ssoPreviewResult.payload, null, 2)}
                      </Box>
                      {ssoPreviewResult.tokenShape === "COMBINED_JSON" && (
                        <Typography variant="caption" sx={{ color: "#888", display: "block", mt: 0.8 }}>
                          → inserted into the link as <code>{ssoPreviewResult.tokenParamName ?? "token"}=encrypt(above)</code>
                        </Typography>
                      )}
                    </Box>
                  )}
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#555", display: "block", mb: 0.5 }}>
                    Your link will be:
                  </Typography>
                </>
              )}
              <Box component="pre" sx={{
                p: 1.5, bgcolor: "#1a1a2e", color: "#a8d8a8", borderRadius: 1,
                fontSize: "0.75rem", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", m: 0,
              }}>
                {ssoPreviewResult.redirectUrl}
              </Box>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSsoPreviewOpen(false)} sx={{ textTransform: "none" }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TpaAppRefForm;
