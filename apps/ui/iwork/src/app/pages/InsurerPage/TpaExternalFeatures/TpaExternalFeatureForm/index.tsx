import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CommonBreadcrumb, FormSection, endPoints, apiRequest, parseCurl, ParsedCurl } from "@ui/ui-lib";
import {
  Alert, Autocomplete, Box, Button, Checkbox, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, IconButton, InputAdornment, Switch,
  Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Tooltip, Typography, Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import LockIcon from "@mui/icons-material/Lock";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeatureType { id: number; key: string; label: string; description: string | null; isActive: boolean; }
interface AppRef {
  id: number; label: string; authType: string | null; isActive: boolean;
  verificationTokenApiPayload: Record<string, any> | null;
  magicUrlApiPayload: Record<string, any> | null;
  fieldHints: Record<string, { type: "STATIC" | "DYNAMIC"; staticValue?: string; sourceType?: string; sourceField?: string }> | null;
}
interface FieldMapping {
  id?: number; externalFieldName: string;
  sourceType: string; sourceField: string | null; staticValue: string | null; isRequired: boolean; fromTemplate?: boolean;
  fieldType?: string;
  dateFormat?: string;
}

const DATE_FORMAT_OPTIONS = [
  { value: "", label: "None" },
  { value: "DD-MON-YYYY", label: "DD-MON-YYYY  (e.g. 01-JUL-2025)" },
  { value: "DD/MM/YYYY",  label: "DD/MM/YYYY   (e.g. 01/07/2025)" },
  { value: "MM/DD/YYYY",  label: "MM/DD/YYYY   (e.g. 07/01/2025)" },
  { value: "YYYY-MM-DD",  label: "YYYY-MM-DD   (e.g. 2025-07-01)" },
  { value: "__custom__",  label: "Custom…" },
];
interface DbTableSchema {
  tableName: string;
  category: "POLICY" | "EMPLOYEE" | "ENROLLMENT" | "OTHER";
  columns: { name: string; dataType: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const extractPlaceholders = (payloadObj: Record<string, any> | null): string[] => {
  if (!payloadObj) return [];
  const matches = [...JSON.stringify(payloadObj).matchAll(/\{\{(\w+)(?:\|[^}]*)?\}\}/g)];
  return [...new Set(matches.map((m) => m[1]))];
};

const buildMappingsFromRef = (ref: AppRef, existing: FieldMapping[]): FieldMapping[] => {
  const all = [...new Set([...extractPlaceholders(ref.verificationTokenApiPayload), ...extractPlaceholders(ref.magicUrlApiPayload)])];
  const hints = ref.fieldHints ?? {};
  const existingNames = new Set(existing.map((m) => m.externalFieldName));
  const newRows: FieldMapping[] = all.filter((p) => !existingNames.has(p)).map((p) => {
    const hint = hints[p];
    if (hint?.type === "STATIC") return { externalFieldName: p, sourceType: "STATIC", sourceField: null, staticValue: hint.staticValue ?? "", isRequired: true, fromTemplate: true };
    return { externalFieldName: p, sourceType: (hint?.sourceType as FieldMapping["sourceType"]) ?? "USER_INPUT", sourceField: hint?.sourceField ?? null, staticValue: null, isRequired: true, fromTemplate: true };
  });
  const updated = existing.map((m) => all.includes(m.externalFieldName) ? { ...m, fromTemplate: true } : m);
  return [...updated, ...newRows];
};

// ─── SSO (TPA Portal Login) — a completely different config shape ────────────
// Selecting "TPA Portal Login" as the Feature Type swaps out the App Ref +
// payload-based Field Mappings sections below for these instead, since this
// feature type is driven by tpa_sso_config / tpa_sso_field_mapping, not
// mstr_ext_application_ref.

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
// picked below (same schema browser as the Field Mappings section above).
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
// Same parser used for the generic API-config forms (@ui/ui-lib) — an admin can copy
// the cURL straight from the TPA's SSO doc or Postman and have URL/method/headers
// fill in automatically instead of retyping them.

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

// ─── Field Mappings table — shared by the plain path and both sides (Intimate /
// Submit) of the "Claim Submission" feature type, so this ~140-line table isn't
// duplicated per use. ──────────────────────────────────────────────────────────

const FieldMappingsSection = ({
  title,
  fieldMappings,
  dbSchema,
  disabled,
  appRefSelected,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  fieldMappings: FieldMapping[];
  dbSchema: DbTableSchema[];
  disabled: boolean;
  appRefSelected: boolean;
  onAdd: () => void;
  onUpdate: (idx: number, patch: Partial<FieldMapping>) => void;
  onRemove: (idx: number) => void;
}) => (
  <FormSection title={title}>
    <Box sx={{ width: "100%" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="caption" style={{ color: "#777" }}>
          {appRefSelected ? "Auto-loaded from API template dynamic fields. Set the DB column or static value for each." : "Select an API config above to auto-load payload fields."}
        </Typography>
        {!disabled && <Button size="small" startIcon={<AddIcon />} onClick={onAdd} sx={{ textTransform: "none" }}>Add Custom Field</Button>}
      </Box>

      {fieldMappings.length === 0 ? (
        <Box sx={{ p: 2.5, textAlign: "center", border: "1.5px dashed #d0d0d0", borderRadius: 1, bgcolor: "#fafafa" }}>
          <Typography variant="body2" style={{ color: "#888" }}>
            {appRefSelected ? "No dynamic placeholders found in the API payload." : "Select an API config to auto-populate fields, or use 'Add Custom Field'."}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, overflow: "auto", bgcolor: "#fff", "& .MuiInputBase-input": { color: "#1a1a1a !important" }, "& .MuiAutocomplete-input": { color: "#1a1a1a !important" }, "& .MuiSelect-select": { color: "#1a1a1a !important" } }}>
          <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: "22%" }}>
                  TPA Payload Field
                  <Typography variant="caption" display="block" style={{ color: "#888", fontWeight: 400 }}>auto from API template</Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: "28%" }}>Source Table</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333" }}>Column / Value</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: 110 }}>Field Type</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: 180 }}>Date Format</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: "0.73rem", color: "#333", width: 80 }}>Required</TableCell>
                {!disabled && <TableCell sx={{ width: 44 }} />}
              </TableRow>
            </TableHead>
            <TableBody>
              {fieldMappings.map((m, idx) => {
                const tableOpts = buildTableOptions(dbSchema);
                const selectedTableOpt = tableOpts.find((o) => o.value === m.sourceType) ?? null;
                const dbTable = dbSchema.find((t) => t.tableName === m.sourceType) ?? null;
                const selectedCol = dbTable?.columns.find((c) => c.name === m.sourceField) ?? null;
                return (
                  <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#fafafa" }, verticalAlign: "middle" }}>
                    <TableCell>
                      {m.fromTemplate ? (
                        <Box component="code" style={{ display: "inline-block", background: "#e8f0fe", color: "#1a237e", padding: "3px 8px", borderRadius: 4, fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600, border: "1px solid #c5cae9" }}>{m.externalFieldName || "—"}</Box>
                      ) : disabled ? (
                        <Box component="code" style={{ display: "inline-block", background: "#f5f5f5", color: "#333", padding: "3px 8px", borderRadius: 4, fontFamily: "monospace", fontSize: "0.8rem", border: "1px solid #e0e0e0" }}>{m.externalFieldName || "—"}</Box>
                      ) : (
                        <TextField size="small" placeholder="e.g. member_id" value={m.externalFieldName} onChange={(e) => onUpdate(idx, { externalFieldName: e.target.value })} sx={{ minWidth: 130 }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ minWidth: 210 }}>
                      {disabled ? (
                        <Typography variant="body2" style={{ color: "#333", fontFamily: "monospace", fontSize: "0.82rem" }}>{selectedTableOpt?.label ?? m.sourceType}</Typography>
                      ) : (
                        <Autocomplete size="small" options={tableOpts} value={selectedTableOpt}
                          onChange={(_, opt) => onUpdate(idx, { sourceType: opt?.value ?? "USER_INPUT", sourceField: null, staticValue: null })}
                          groupBy={(opt) => opt.group} getOptionLabel={(opt) => opt.label} isOptionEqualToValue={(a, b) => a.value === b.value} disableClearable
                          renderInput={(params) => <TextField {...params} size="small" placeholder="Search table…" InputProps={{ ...params.InputProps, sx: { fontSize: "0.82rem" } }} />}
                          renderOption={(props, opt) => <Box component="li" {...props} key={opt.value} sx={{ gap: 1, py: "4px !important" }}><Box component="span" style={{ width: 8, height: 8, borderRadius: "50%", background: opt.color, flexShrink: 0, display: "inline-block" }} /><span style={{ fontSize: "0.82rem", fontFamily: opt.mono ? "monospace" : "inherit", color: "#1a1a1a" }}>{opt.label}</span></Box>}
                          renderGroup={(params) => <Box key={params.key}>{params.group !== "Special" && <Typography variant="caption" sx={{ px: 1.5, py: 0.4, display: "block", fontWeight: 700, fontSize: "0.63rem", textTransform: "uppercase", letterSpacing: 1, color: tableOpts.find((o) => o.group === params.group)?.color ?? "#666", bgcolor: "#f7f7f7", borderBottom: "1px solid #eee" }}>{params.group}</Typography>}{params.children}</Box>} />
                      )}
                    </TableCell>
                    <TableCell sx={{ minWidth: 210 }}>
                      {m.sourceType === "STATIC" ? (
                        disabled ? (
                          <Typography variant="body2" style={{ color: "#333", fontSize: "0.82rem" }}>{m.staticValue || "—"}</Typography>
                        ) : (
                          <TextField size="small" placeholder="Enter fixed value" value={m.staticValue ?? ""} onChange={(e) => onUpdate(idx, { staticValue: e.target.value })} sx={{ minWidth: 180 }} />
                        )
                      ) : m.sourceType === "USER_INPUT" ? (
                        <span style={{ color: "#888", fontStyle: "italic", fontSize: "0.72rem" }}>employee fills at runtime</span>
                      ) : dbTable ? (
                        disabled ? (
                          <Typography variant="body2" style={{ color: "#333", fontFamily: "monospace", fontSize: "0.82rem" }}>{m.sourceField || "—"}</Typography>
                        ) : (
                          <Autocomplete size="small" options={dbTable.columns} value={selectedCol}
                            onChange={(_, col) => onUpdate(idx, { sourceField: col?.name ?? null })}
                            getOptionLabel={(col) => col.name} isOptionEqualToValue={(a, b) => a.name === b.name} disableClearable
                            renderInput={(params) => <TextField {...params} size="small" placeholder="Search column…" InputProps={{ ...params.InputProps, sx: { fontSize: "0.82rem", fontFamily: "monospace" } }} />}
                            renderOption={(props, col) => <Box component="li" {...props} key={col.name} sx={{ flexDirection: "column", alignItems: "flex-start !important", py: "4px !important" }}><span style={{ fontSize: "0.82rem", fontFamily: "monospace", color: "#1a1a1a" }}>{col.name}</span><span style={{ fontSize: "0.65rem", color: "#aaa" }}>{col.dataType}</span></Box>} />
                        )
                      ) : (
                        <span style={{ color: "#aaa", fontStyle: "italic", fontSize: "0.72rem" }}>select a table first</span>
                      )}
                    </TableCell>
                    <TableCell sx={{ minWidth: 110 }}>
                      {disabled ? (
                        <Typography variant="body2" style={{ color: "#333", fontSize: "0.82rem" }}>{m.fieldType || "—"}</Typography>
                      ) : (
                        <TextField select size="small" value={m.fieldType ?? ""} sx={{ minWidth: 100 }}
                          onChange={(e) => onUpdate(idx, { fieldType: e.target.value || undefined, dateFormat: e.target.value === "DATE" ? m.dateFormat : undefined })}
                          SelectProps={{ native: true }}>
                          <option value="">String</option>
                          <option value="DATE">Date</option>
                          <option value="NUMBER">Number</option>
                        </TextField>
                      )}
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      {m.fieldType !== "DATE" ? (
                        <Typography variant="body2" style={{ color: "#bbb", fontStyle: "italic", fontSize: "0.75rem" }}>—</Typography>
                      ) : (() => {
                        const knownOpt = DATE_FORMAT_OPTIONS.find((o) => o.value === m.dateFormat && o.value !== "__custom__");
                        const isCustom = m.dateFormat !== undefined && m.dateFormat !== "" && !knownOpt;
                        const selectValue = isCustom ? "__custom__" : (m.dateFormat ?? "");
                        return disabled ? (
                          <Typography variant="body2" style={{ color: "#333", fontFamily: "monospace", fontSize: "0.82rem" }}>{m.dateFormat || "—"}</Typography>
                        ) : (
                          <Box display="flex" flexDirection="column" gap={0.5}>
                            <TextField select size="small" value={selectValue} sx={{ minWidth: 160 }}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "__custom__") onUpdate(idx, { dateFormat: "" });
                                else onUpdate(idx, { dateFormat: v || undefined });
                              }}
                              SelectProps={{ native: true }}>
                              {DATE_FORMAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </TextField>
                            {isCustom && (
                              <TextField size="small" placeholder="e.g. DD.MM.YYYY" value={m.dateFormat ?? ""}
                                onChange={(e) => onUpdate(idx, { dateFormat: e.target.value })}
                                sx={{ minWidth: 160 }} inputProps={{ style: { fontFamily: "monospace", fontSize: "0.82rem" } }} />
                            )}
                          </Box>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Checkbox size="small" checked={m.isRequired} disabled={disabled} onChange={(e) => onUpdate(idx, { isRequired: e.target.checked })} />
                    </TableCell>
                    {!disabled && (
                      <TableCell>
                        <Tooltip title="Remove"><IconButton size="small" color="error" onClick={() => onRemove(idx)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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
  </FormSection>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface TpaExternalFeatureFormProps {
  viewOnly?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TpaExternalFeatureForm = ({ viewOnly = false }: TpaExternalFeatureFormProps) => {
  const { id: tpaId, configId } = useParams<{ id: string; configId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const tpaName = location.state?.entityName ?? "TPA";
  const numericTpaId = Number(tpaId);
  const isEdit = Boolean(configId) && !viewOnly;
  const isView = viewOnly && Boolean(configId);

  const [featureTypes, setFeatureTypes] = useState<FeatureType[]>([]);
  const [appRefs, setAppRefs] = useState<AppRef[]>([]);
  const [dbSchema, setDbSchema] = useState<DbTableSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testInputs, setTestInputs] = useState<Record<string, string>>({});

  const [ssoForm, setSsoForm] = useState<SsoFormState>(EMPTY_SSO_FORM);
  const [ssoConfigId, setSsoConfigId] = useState<number | null>(null);

  // ── Claim Submission — Intimate/Submit pair state ─────────────────────────
  // "Intimate Claim" reuses form.appRefId / form.fieldMappings (same generic
  // shape as any other feature); "Submit Claim" only exists when the TPA needs
  // separate APIs, tracked here so it can be a second tpa_external_feature_config
  // row without touching the generic path's state.
  const [claimFlowChoice, setClaimFlowChoice] = useState<"" | "SAME" | "DIFFERENT">("");
  const [intimateConfigId, setIntimateConfigId] = useState<number | null>(null);
  const [submitConfigId, setSubmitConfigId] = useState<number | null>(null);
  const [submitAppRefId, setSubmitAppRefId] = useState(0);
  const [submitFieldMappings, setSubmitFieldMappings] = useState<FieldMapping[]>([]);
  const [submitExecutionMode, setSubmitExecutionMode] = useState<"" | "SINGLE_CALL" | "PER_DOCUMENT">("");
  const [claimSubmissionLoaded, setClaimSubmissionLoaded] = useState(false);
  const [ssoLoaded, setSsoLoaded] = useState(false);
  const [ssoPreviewOpen, setSsoPreviewOpen] = useState(false);
  const [ssoPreviewLoading, setSsoPreviewLoading] = useState(false);
  const [ssoPreviewResult, setSsoPreviewResult] = useState<{
    redirectUrl?: string; error?: string; payload?: Record<string, string>;
    tokenShape?: string; tokenParamName?: string | null;
    deliveryMode?: string; encryptedPayload?: string; requestSent?: Record<string, unknown>;
  } | null>(null);
  const [ssoCurlOpen, setSsoCurlOpen] = useState(false);

  const [form, setForm] = useState({
    featureTypeId: 0, appRefId: 0, label: "", buttonLabel: "", displayOrder: 0, isActive: true,
    fieldMappings: [] as FieldMapping[],
  });

  // Loads this TPA's existing Intimate/Submit pair (if any) by fetching all of the
  // TPA's configs and filtering — same "load by TPA, not by this one configId"
  // pattern as loadSsoConfigForTpa, so opening either the Intimate or the Submit
  // list card lands on the same combined view of the pair.
  const loadClaimSubmissionForTpa = async (claimSubmissionFeatureTypeId: number, refs: AppRef[]) => {
    try {
      const res = await apiRequest(endPoints.tpaFeatureConfigs(numericTpaId), { method: "GET" });
      const allConfigs: any[] = res?.data ?? [];
      const pairConfigs = allConfigs.filter((c) => c.featureTypeId === claimSubmissionFeatureTypeId);
      const intimateRow = pairConfigs.find((c) => c.apiType === "INTIMATE_CLAIM");
      const submitRow = pairConfigs.find((c) => c.apiType === "SUBMIT_CLAIM");

      if (intimateRow) {
        setIntimateConfigId(intimateRow.id);
        const ref = refs.find((a) => a.id === intimateRow.appRefId);
        const fieldMappings = ref ? buildMappingsFromRef(ref, intimateRow.fieldMappings ?? []) : (intimateRow.fieldMappings ?? []);
        setForm({
          featureTypeId: claimSubmissionFeatureTypeId, appRefId: intimateRow.appRefId ?? 0,
          label: intimateRow.label, buttonLabel: intimateRow.buttonLabel,
          displayOrder: intimateRow.displayOrder, isActive: intimateRow.isActive, fieldMappings,
        });
      }
      if (submitRow) {
        setSubmitConfigId(submitRow.id);
        setSubmitAppRefId(submitRow.appRefId ?? 0);
        const ref = refs.find((a) => a.id === submitRow.appRefId);
        setSubmitFieldMappings(ref ? buildMappingsFromRef(ref, submitRow.fieldMappings ?? []) : (submitRow.fieldMappings ?? []));
        setSubmitExecutionMode(submitRow.submitExecutionMode ?? "");
      }
      setClaimFlowChoice(submitRow ? "DIFFERENT" : intimateRow ? "SAME" : "");
    } catch {
      // No existing pair for this TPA yet — normal for a first-time setup.
    } finally {
      setClaimSubmissionLoaded(true);
    }
  };

  const breadcrumbs = [
    { label: "Manage TPA", path: "/tpa" },
    { label: tpaName, path: `/tpa/${tpaId}` },
    { label: "External Features", path: `/tpa/${tpaId}/external-features` },
    { label: isView ? "View Feature" : isEdit ? "Edit Feature" : "Add Feature" },
  ];

  const backPath = `/tpa/${tpaId}/external-features`;
  const backState = { entityName: tpaName };

  const loadSsoConfigForTpa = async () => {
    try {
      const res = await apiRequest(endPoints.tpaSsoConfigByTpa(numericTpaId), { method: "GET" });
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
      } else {
        setSsoConfigId(null);
        setSsoForm({ ...EMPTY_SSO_FORM, ssoKeyEnvName: suggestSsoEnvName(tpaName, "KEY"), ssoIvEnvName: suggestSsoEnvName(tpaName, "IV") });
      }
    } catch {
      // No SSO config yet for this TPA — normal for a first-time setup.
      setSsoConfigId(null);
      setSsoForm({ ...EMPTY_SSO_FORM, ssoKeyEnvName: suggestSsoEnvName(tpaName, "KEY"), ssoIvEnvName: suggestSsoEnvName(tpaName, "IV") });
    } finally {
      setSsoLoaded(true);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [ftRes, refRes, schemaRes] = await Promise.allSettled([
          apiRequest(endPoints.tpaFeatureTypes, { method: "GET" }),
          apiRequest(endPoints.tpaFeatureAppRefs, { method: "GET" }),
          apiRequest(endPoints.tpaFeatureDbSchema, { method: "GET" }),
        ]);
        const fts = ftRes.status === "fulfilled" ? (ftRes.value?.data ?? []) : [];
        setFeatureTypes(fts);
        // /app-refs now also returns SSO configs appended in, tagged configType: "SSO" —
        // filter back to just AppRef-shaped rows so this picker's behavior is unchanged.
        const refs = refRes.status === "fulfilled" ? (refRes.value?.data ?? []) : [];
        setAppRefs(refs.filter((r: any) => r.configType !== "SSO"));
        if (schemaRes.status === "fulfilled") setDbSchema(schemaRes.value?.data ?? []);

        let loadedFeatureTypeId: number | undefined;
        if (configId) {
          const cfgRes = await apiRequest(endPoints.tpaFeatureConfigById(Number(configId)), { method: "GET" });
          const config = cfgRes?.data;
          if (config) {
            loadedFeatureTypeId = config.featureTypeId;
            const ref = refs.find((a: AppRef) => a.id === config.appRefId);
            const fieldMappings = ref ? buildMappingsFromRef(ref, config.fieldMappings ?? []) : (config.fieldMappings ?? []);
            setForm({ featureTypeId: config.featureTypeId, appRefId: config.appRefId ?? 0, label: config.label, buttonLabel: config.buttonLabel, displayOrder: config.displayOrder, isActive: config.isActive, fieldMappings });
          }
        }

        const loadedFt = fts.find((f: FeatureType) => f.id === loadedFeatureTypeId);
        if (loadedFt?.key === SSO_FEATURE_KEY) {
          await loadSsoConfigForTpa();
        }
        if (loadedFt?.key === CLAIM_SUBMISSION_FEATURE_KEY) {
          await loadClaimSubmissionForTpa(loadedFt.id, refs);
        }
      } finally { setLoading(false); }
    };
    init();
  }, [configId, numericTpaId, viewOnly]);

  const disabled = isView;
  const isSsoFeature = featureTypes.find((ft) => ft.id === form.featureTypeId)?.key === SSO_FEATURE_KEY;
  const isClaimSubmissionFeature = featureTypes.find((ft) => ft.id === form.featureTypeId)?.key === CLAIM_SUBMISSION_FEATURE_KEY;
  const [ssoAdvancedOpen, setSsoAdvancedOpen] = useState(false);

  const selectedRef = appRefs.find((a) => a.id === form.appRefId) ?? null;
  const allPlaceholders = selectedRef ? [...new Set([...extractPlaceholders(selectedRef.verificationTokenApiPayload), ...extractPlaceholders(selectedRef.magicUrlApiPayload)])] : [];
  const staticCovered = new Set(form.fieldMappings.filter((m) => m.sourceType === "STATIC" && m.staticValue).map((m) => m.externalFieldName));
  const dbCovered = new Set(form.fieldMappings.filter((m) => m.sourceType !== "STATIC" && m.sourceType !== "USER_INPUT" && m.sourceField).map((m) => m.externalFieldName));
  const anyCovered = (p: string) => staticCovered.has(p) || dbCovered.has(p);
  const dynamicInputNeeded = allPlaceholders.filter((p) => !staticCovered.has(p));

  const handleFeatureTypeChange = (ftId: number) => {
    const ft = featureTypes.find((f) => f.id === ftId);
    setForm((prev) => ({ ...prev, featureTypeId: ftId, label: prev.label || ft?.label || "", buttonLabel: prev.buttonLabel || ft?.label || "" }));
    if (ft?.key === SSO_FEATURE_KEY && !ssoLoaded) {
      loadSsoConfigForTpa();
    }
    if (ft?.key === CLAIM_SUBMISSION_FEATURE_KEY && !claimSubmissionLoaded) {
      loadClaimSubmissionForTpa(ftId, appRefs);
    }
  };

  const addSsoMapping = () => setSsoForm((prev) => ({ ...prev, fieldMappings: [...prev.fieldMappings, { externalFieldName: "", sourceType: "STATIC", sourceField: null, staticValue: null }] }));
  const removeSsoMapping = (idx: number) => setSsoForm((prev) => ({ ...prev, fieldMappings: prev.fieldMappings.filter((_, i) => i !== idx) }));
  const updateSsoMapping = (idx: number, patch: Partial<SsoFieldMappingRow>) => setSsoForm((prev) => ({ ...prev, fieldMappings: prev.fieldMappings.map((m, i) => i === idx ? { ...m, ...patch } : m) }));

  const addSsoTransformRow = () => setSsoForm((prev) => ({ ...prev, outputTransformRows: [...prev.outputTransformRows, { from: "", to: "" }] }));
  const removeSsoTransformRow = (idx: number) => setSsoForm((prev) => ({ ...prev, outputTransformRows: prev.outputTransformRows.filter((_, i) => i !== idx) }));
  const updateSsoTransformRow = (idx: number, patch: Partial<{ from: string; to: string }>) => setSsoForm((prev) => ({ ...prev, outputTransformRows: prev.outputTransformRows.map((r, i) => i === idx ? { ...r, ...patch } : r) }));

  const addRemoteHeaderRow = () => setSsoForm((prev) => ({ ...prev, remoteApiHeaderRows: [...prev.remoteApiHeaderRows, { key: "", value: "" }] }));
  const removeRemoteHeaderRow = (idx: number) => setSsoForm((prev) => ({ ...prev, remoteApiHeaderRows: prev.remoteApiHeaderRows.filter((_, i) => i !== idx) }));
  const updateRemoteHeaderRow = (idx: number, patch: Partial<{ key: string; value: string }>) => setSsoForm((prev) => ({ ...prev, remoteApiHeaderRows: prev.remoteApiHeaderRows.map((r, i) => i === idx ? { ...r, ...patch } : r) }));

  const addRemoteExtraRow = () => setSsoForm((prev) => ({ ...prev, remoteRequestExtraFieldRows: [...prev.remoteRequestExtraFieldRows, { key: "", value: "" }] }));
  const removeRemoteExtraRow = (idx: number) => setSsoForm((prev) => ({ ...prev, remoteRequestExtraFieldRows: prev.remoteRequestExtraFieldRows.filter((_, i) => i !== idx) }));
  const updateRemoteExtraRow = (idx: number, patch: Partial<{ key: string; value: string }>) => setSsoForm((prev) => ({ ...prev, remoteRequestExtraFieldRows: prev.remoteRequestExtraFieldRows.map((r, i) => i === idx ? { ...r, ...patch } : r) }));

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

  const handleAppRefChange = (newId: number) => {
    const ref = appRefs.find((a) => a.id === newId) ?? null;
    const updatedMappings = ref ? buildMappingsFromRef(ref, form.fieldMappings) : form.fieldMappings;
    setForm((prev) => ({ ...prev, appRefId: newId, fieldMappings: updatedMappings }));
    setTestResult(null); setTestInputs({});
  };

  const addMapping = () => setForm((prev) => ({ ...prev, fieldMappings: [...prev.fieldMappings, { externalFieldName: "", sourceType: "STATIC", sourceField: null, staticValue: null, isRequired: true }] }));
  const removeMapping = (idx: number) => setForm((prev) => ({ ...prev, fieldMappings: prev.fieldMappings.filter((_, i) => i !== idx) }));
  const updateMapping = (idx: number, patch: Partial<FieldMapping>) => setForm((prev) => ({ ...prev, fieldMappings: prev.fieldMappings.map((m, i) => i === idx ? { ...m, ...patch } : m) }));

  // ── Submit Claim side (only rendered when claimFlowChoice === "DIFFERENT") ──
  const handleSubmitAppRefChange = (newId: number) => {
    const ref = appRefs.find((a) => a.id === newId) ?? null;
    const updatedMappings = ref ? buildMappingsFromRef(ref, submitFieldMappings) : submitFieldMappings;
    setSubmitAppRefId(newId);
    setSubmitFieldMappings(updatedMappings);
  };
  const addSubmitMapping = () => setSubmitFieldMappings((prev) => [...prev, { externalFieldName: "", sourceType: "STATIC", sourceField: null, staticValue: null, isRequired: true }]);
  const removeSubmitMapping = (idx: number) => setSubmitFieldMappings((prev) => prev.filter((_, i) => i !== idx));
  const updateSubmitMapping = (idx: number, patch: Partial<FieldMapping>) => setSubmitFieldMappings((prev) => prev.map((m, i) => i === idx ? { ...m, ...patch } : m));

  const handleSave = async () => {
    if (!form.featureTypeId) { setFormError("Please select a Feature Type."); return; }
    if (!form.label.trim()) { setFormError("Label is required."); return; }
    if (!form.buttonLabel.trim()) { setFormError("Button Label is required."); return; }

    if (isSsoFeature) {
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
    } else if (isClaimSubmissionFeature) {
      if (!claimFlowChoice) { setFormError("Please answer whether Intimate Claim and Submit Claim use different APIs."); return; }
      for (const m of form.fieldMappings) {
        if (!m.externalFieldName.trim()) { setFormError("All Intimate Claim field mappings need a field name."); return; }
        if (m.sourceType === "STATIC" && !m.staticValue?.trim()) { setFormError(`Static value required for "${m.externalFieldName}" (Intimate Claim).`); return; }
        if (m.sourceType !== "STATIC" && m.sourceType !== "USER_INPUT" && !m.sourceField?.trim()) { setFormError(`DB column required for "${m.externalFieldName}" (Intimate Claim).`); return; }
      }
      if (claimFlowChoice === "DIFFERENT") {
        if (!submitAppRefId) { setFormError("Select an API config for Submit Claim."); return; }
        if (!submitExecutionMode) { setFormError("Select a Submission Execution Mode."); return; }
        for (const m of submitFieldMappings) {
          if (!m.externalFieldName.trim()) { setFormError("All Submit Claim field mappings need a field name."); return; }
          if (m.sourceType === "STATIC" && !m.staticValue?.trim()) { setFormError(`Static value required for "${m.externalFieldName}" (Submit Claim).`); return; }
          if (m.sourceType !== "STATIC" && m.sourceType !== "USER_INPUT" && !m.sourceField?.trim()) { setFormError(`DB column required for "${m.externalFieldName}" (Submit Claim).`); return; }
        }
      }
    } else {
      for (const m of form.fieldMappings) {
        if (!m.externalFieldName.trim()) { setFormError("All field mappings need a field name."); return; }
        if (m.sourceType === "STATIC" && !m.staticValue?.trim()) { setFormError(`Static value required for "${m.externalFieldName}".`); return; }
        if (m.sourceType !== "STATIC" && m.sourceType !== "USER_INPUT" && !m.sourceField?.trim()) { setFormError(`DB column required for "${m.externalFieldName}".`); return; }
      }
    }

    setSaving(true); setFormError(null);
    try {
      if (isSsoFeature) {
        // SSO-only: one atomic request writes the feature-config (button) and the SSO
        // crypto config together — either both land or neither does. (Previously two
        // separate requests, which could leave a feature-config row with no matching
        // SSO config if the second request failed after the first had committed.)
        const combinedPayload = {
          tpaId: numericTpaId,
          featureTypeId: form.featureTypeId,
          featureConfigId: configId ? Number(configId) : undefined,
          label: form.label.trim(),
          buttonLabel: form.buttonLabel.trim(),
          displayOrder: form.displayOrder,
          isActive: form.isActive,
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
      } else if (isClaimSubmissionFeature) {
        // Always upsert the Intimate Claim row. It's SINGLE (one combined call) unless
        // the user said Intimate/Submit are different APIs, in which case it's the
        // first of a MULTI-step pair and a second Submit Claim row is upserted too.
        const intimatePayload = {
          tpaId: numericTpaId, featureTypeId: form.featureTypeId, appRefId: form.appRefId || null,
          label: form.label.trim(), buttonLabel: form.buttonLabel.trim(),
          displayOrder: form.displayOrder, isActive: form.isActive,
          fieldMappings: form.fieldMappings.map(({ fromTemplate: _, ...m }) => m),
          apiType: "INTIMATE_CLAIM",
          claimFormType: claimFlowChoice === "DIFFERENT" ? "MULTI" : "SINGLE",
        };
        if (intimateConfigId) {
          await apiRequest(endPoints.tpaFeatureConfigById(intimateConfigId), { method: "PUT", data: intimatePayload });
        } else {
          const created = await apiRequest(endPoints.tpaFeatureAllConfigs, { method: "POST", data: intimatePayload });
          setIntimateConfigId(created?.data?.id ?? null);
        }

        if (claimFlowChoice === "DIFFERENT") {
          const submitPayload = {
            tpaId: numericTpaId, featureTypeId: form.featureTypeId, appRefId: submitAppRefId || null,
            label: `${form.label.trim()} - Submit`, buttonLabel: form.buttonLabel.trim(),
            displayOrder: form.displayOrder, isActive: form.isActive,
            fieldMappings: submitFieldMappings.map(({ fromTemplate: _, ...m }) => m),
            apiType: "SUBMIT_CLAIM",
            submitExecutionMode,
          };
          if (submitConfigId) {
            await apiRequest(endPoints.tpaFeatureConfigById(submitConfigId), { method: "PUT", data: submitPayload });
          } else {
            const created = await apiRequest(endPoints.tpaFeatureAllConfigs, { method: "POST", data: submitPayload });
            setSubmitConfigId(created?.data?.id ?? null);
          }
        } else if (submitConfigId) {
          // Switched from "different APIs" back to "same API" — remove the now-orphaned Submit Claim row.
          await apiRequest(endPoints.tpaFeatureConfigById(submitConfigId), { method: "DELETE" });
          setSubmitConfigId(null);
        }
      } else {
        const payload = {
          tpaId: numericTpaId, featureTypeId: form.featureTypeId, appRefId: form.appRefId || null,
          label: form.label.trim(), buttonLabel: form.buttonLabel.trim(),
          displayOrder: form.displayOrder, isActive: form.isActive,
          fieldMappings: form.fieldMappings.map(({ fromTemplate: _, ...m }) => m),
        };
        if (!isEdit) await apiRequest(endPoints.tpaFeatureAllConfigs, { method: "POST", data: payload });
        else await apiRequest(endPoints.tpaFeatureConfigById(Number(configId)), { method: "PUT", data: payload });
      }

      navigate(backPath, { state: backState });
    } catch (e: any) { setFormError(e?.message ?? "Failed to save."); }
    finally { setSaving(false); }
  };

  const runTest = async (step: 1 | 2) => {
    if (!selectedRef) return;
    setTestLoading(true); setTestResult(null);
    try {
      const staticValues: Record<string, string> = {};
      form.fieldMappings.forEach((m) => { if (m.sourceType === "STATIC" && m.staticValue) staticValues[m.externalFieldName] = m.staticValue; });
      const res = await apiRequest(endPoints.tpaFeatureTestApi, { method: "POST", data: { appRefId: selectedRef.id, staticValues: { ...staticValues, ...testInputs }, step } });
      setTestResult(res?.data ?? res);
    } catch (e: any) { setTestResult({ error: e?.message ?? "Test failed" }); }
    finally { setTestLoading(false); }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px"><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 5 }}>

      {/* Breadcrumb row + action buttons */}
      <Box sx={{ maxWidth: "1254px", mx: "auto" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <CommonBreadcrumb crumbs={breadcrumbs} />
          <Box display="flex" gap={1.5}>
            {isView ? (
              <Button variant="contained" startIcon={<EditIcon />}
                onClick={() => navigate(`/tpa/${tpaId}/external-features/${configId}/edit`, { state: backState })}
                sx={{ textTransform: "none", fontWeight: 600 }}>
                Edit
              </Button>
            ) : (
              <>
                <Button variant="outlined" onClick={() => navigate(backPath, { state: backState })}
                  sx={{ textTransform: "none", color: "#555", borderColor: "#ccc" }}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={handleSave} disabled={saving}
                  startIcon={saving ? <CircularProgress size={16} /> : undefined}
                  sx={{ textTransform: "none", fontWeight: 600 }}>
                  {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Feature"}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {formError && <Alert severity="error" sx={{ mb: 2, maxWidth: "1254px", mx: "auto" }}>{formError}</Alert>}

      {/* Form sections */}
      <Box sx={{ mt: 9 }}>

        {/* Feature Setup */}
        <FormSection title="Feature Setup">
          <Box sx={{ maxWidth: 400, width: "100%" }}>
            <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Feature Type *</Typography>
            <Autocomplete
              disabled={disabled}
              options={featureTypes.filter((ft) => ft.isActive)}
              value={featureTypes.find((ft) => ft.id === form.featureTypeId) ?? null}
              onChange={(_, ft) => { if (ft) handleFeatureTypeChange(ft.id); }}
              getOptionLabel={(ft) => ft.label} isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(params) => <TextField {...params} size="small" placeholder="E-card, Claims, etc." />}
              renderOption={(props, ft) => <Box component="li" {...props} key={ft.id} sx={{ flexDirection: "column", alignItems: "flex-start !important", py: "6px !important" }}><span style={{ fontSize: "0.875rem", color: "#1a1a1a" }}>{ft.label}</span>{ft.description && <span style={{ fontSize: "0.72rem", color: "#777" }}>{ft.description}</span>}</Box>}
            />
          </Box>
          {!isSsoFeature && !isClaimSubmissionFeature && (
            <Box sx={{ maxWidth: 400, width: "100%" }}>
              <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>API / Application Config</Typography>
              <Autocomplete
                disabled={disabled}
                options={appRefs}
                value={appRefs.find((a) => a.id === form.appRefId) ?? null}
                onChange={(_, ref) => handleAppRefChange(ref?.id ?? 0)}
                getOptionLabel={(a) => a.label} isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={(params) => <TextField {...params} size="small" placeholder="Select API config" />}
                renderOption={(props, a) => <Box component="li" {...props} key={a.id} sx={{ gap: 1, py: "6px !important" }}><span style={{ fontSize: "0.875rem", color: "#1a1a1a" }}>{a.label}</span>{a.authType && <Chip label={a.authType} size="small" style={{ fontSize: "0.65rem", height: 17 }} color={a.authType === "JWT" ? "primary" : a.authType === "SESSION" ? "secondary" : "default"} />}</Box>}
              />
            </Box>
          )}
          <Box sx={{ maxWidth: 400, width: "100%" }}>
            <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Label *</Typography>
            <TextField fullWidth size="small" disabled={disabled} value={form.label}
              onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
              helperText="Internal label for this config" />
          </Box>
          <Box sx={{ maxWidth: 400, width: "100%" }}>
            <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Button Label *</Typography>
            <TextField fullWidth size="small" disabled={disabled} value={form.buttonLabel}
              onChange={(e) => setForm((p) => ({ ...p, buttonLabel: e.target.value }))}
              placeholder="e.g. View E-Card, Check Claims"
              helperText="Text employees see on the button in IBP" />
          </Box>
          <Box sx={{ maxWidth: 130, width: "100%" }}>
            <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Display Order</Typography>
            <TextField fullWidth size="small" type="number" disabled={disabled} value={form.displayOrder}
              onChange={(e) => setForm((p) => ({ ...p, displayOrder: Number(e.target.value) }))}
              helperText="Lower = shown first" />
          </Box>
          <Box sx={{ maxWidth: 200, width: "100%" }}>
            <Typography variant="caption" style={{ color: "#555" }} display="block" mb={1}>Status</Typography>
            <FormControlLabel
              control={<Switch checked={form.isActive} disabled={disabled} color="primary" onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />}
              label={<Typography variant="body2">{form.isActive ? "Active (visible in IBP)" : "Inactive"}</Typography>}
            />
          </Box>
        </FormSection>

        {/* Field Mappings — plain (non-SSO, non-Claim-Submission) feature types */}
        {!isSsoFeature && !isClaimSubmissionFeature && (
          <FieldMappingsSection
            title="Field Mappings"
            fieldMappings={form.fieldMappings}
            dbSchema={dbSchema}
            disabled={disabled}
            appRefSelected={Boolean(form.appRefId)}
            onAdd={addMapping}
            onUpdate={updateMapping}
            onRemove={removeMapping}
          />
        )}

        {/* Claim Submission — ask once whether Intimate/Submit are the same API or
            different, then show one or two API config + field-mapping sections. */}
        {isClaimSubmissionFeature && (
          <>
            <FormSection title="Claim Flow">
              <Box sx={{ width: "100%" }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={1}>
                  Does this TPA use a different API to submit bills/documents than the one used to intimate the claim? *
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Button
                    variant={claimFlowChoice === "SAME" ? "contained" : "outlined"}
                    disabled={disabled}
                    onClick={() => setClaimFlowChoice("SAME")}
                    sx={{ textTransform: "none" }}
                  >
                    No — one combined API
                  </Button>
                  <Button
                    variant={claimFlowChoice === "DIFFERENT" ? "contained" : "outlined"}
                    disabled={disabled}
                    onClick={() => setClaimFlowChoice("DIFFERENT")}
                    sx={{ textTransform: "none" }}
                  >
                    Yes — separate Intimate and Submit APIs
                  </Button>
                </Box>
                <Typography variant="caption" style={{ color: "#888" }} display="block" mt={1}>
                  {claimFlowChoice === "DIFFERENT"
                    ? "e.g. FHPL, Health India — the claim is intimated with a small set of fields, then submitted later (with bills/bank details) via a separate API call."
                    : claimFlowChoice === "SAME"
                    ? "e.g. ISBS/GHPL — one API call carries everything and the claim is fully submitted immediately."
                    : "Choose one to continue."}
                </Typography>
              </Box>
            </FormSection>

            {claimFlowChoice !== "" && (
              <FormSection title={claimFlowChoice === "DIFFERENT" ? "Intimate Claim — API Config" : "API Config"}>
                <Box sx={{ maxWidth: 400, width: "100%" }}>
                  <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>API / Application Config</Typography>
                  <Autocomplete
                    disabled={disabled}
                    options={appRefs}
                    value={appRefs.find((a) => a.id === form.appRefId) ?? null}
                    onChange={(_, ref) => handleAppRefChange(ref?.id ?? 0)}
                    getOptionLabel={(a) => a.label} isOptionEqualToValue={(a, b) => a.id === b.id}
                    renderInput={(params) => <TextField {...params} size="small" placeholder="Select API config" />}
                    renderOption={(props, a) => <Box component="li" {...props} key={a.id} sx={{ gap: 1, py: "6px !important" }}><span style={{ fontSize: "0.875rem", color: "#1a1a1a" }}>{a.label}</span>{a.authType && <Chip label={a.authType} size="small" style={{ fontSize: "0.65rem", height: 17 }} color={a.authType === "JWT" ? "primary" : a.authType === "SESSION" ? "secondary" : "default"} />}</Box>}
                  />
                </Box>
              </FormSection>
            )}

            {claimFlowChoice !== "" && (
              <FieldMappingsSection
                title={claimFlowChoice === "DIFFERENT" ? "Intimate Claim — Field Mappings" : "Field Mappings"}
                fieldMappings={form.fieldMappings}
                dbSchema={dbSchema}
                disabled={disabled}
                appRefSelected={Boolean(form.appRefId)}
                onAdd={addMapping}
                onUpdate={updateMapping}
                onRemove={removeMapping}
              />
            )}

            {claimFlowChoice === "DIFFERENT" && (
              <>
                <FormSection title="Submit Claim — API Config">
                  <Box sx={{ maxWidth: 400, width: "100%" }}>
                    <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>API / Application Config</Typography>
                    <Autocomplete
                      disabled={disabled}
                      options={appRefs}
                      value={appRefs.find((a) => a.id === submitAppRefId) ?? null}
                      onChange={(_, ref) => handleSubmitAppRefChange(ref?.id ?? 0)}
                      getOptionLabel={(a) => a.label} isOptionEqualToValue={(a, b) => a.id === b.id}
                      renderInput={(params) => <TextField {...params} size="small" placeholder="Select API config" />}
                      renderOption={(props, a) => <Box component="li" {...props} key={a.id} sx={{ gap: 1, py: "6px !important" }}><span style={{ fontSize: "0.875rem", color: "#1a1a1a" }}>{a.label}</span>{a.authType && <Chip label={a.authType} size="small" style={{ fontSize: "0.65rem", height: 17 }} color={a.authType === "JWT" ? "primary" : a.authType === "SESSION" ? "secondary" : "default"} />}</Box>}
                    />
                  </Box>
                  <Box sx={{ maxWidth: 400, width: "100%" }}>
                    <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Submission Execution Mode *</Typography>
                    <TextField
                      select fullWidth size="small" disabled={disabled} value={submitExecutionMode}
                      onChange={(e) => setSubmitExecutionMode(e.target.value as any)}
                      SelectProps={{ native: true }}
                      helperText="SINGLE_CALL: all fields + every document in one request (FHPL). PER_DOCUMENT: one request per document, looped (Health India)."
                    >
                      <option value="">— Select —</option>
                      <option value="SINGLE_CALL">SINGLE_CALL — one request, all documents together</option>
                      <option value="PER_DOCUMENT">PER_DOCUMENT — one request per document</option>
                    </TextField>
                  </Box>
                </FormSection>

                <FieldMappingsSection
                  title="Submit Claim — Field Mappings"
                  fieldMappings={submitFieldMappings}
                  dbSchema={dbSchema}
                  disabled={disabled}
                  appRefSelected={Boolean(submitAppRefId)}
                  onAdd={addSubmitMapping}
                  onUpdate={updateSubmitMapping}
                  onRemove={removeSubmitMapping}
                />
              </>
            )}
          </>
        )}

        {/* SSO (TPA Portal Login) config — replaces App Ref + Field Mappings above */}
        {isSsoFeature && (
          <>
            <FormSection title="How do we get the redirect link?">
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
            </FormSection>

            {ssoForm.ssoDeliveryMode === "LOCAL_REDIRECT" && (
            <FormSection title="Portal URL">
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
            </FormSection>
            )}

            {ssoForm.ssoDeliveryMode === "LOCAL_REDIRECT" && (
            <FormSection title="How should the values be sent?">
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
            </FormSection>
            )}

            <FormSection title={ssoForm.ssoDeliveryMode === "REMOTE_API_REDIRECT" ? "Fields We Encrypt & Send to the TPA" : "Fields Sent in the SSO Link"}>
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
            </FormSection>

            <FormSection title="Encryption Key & IV">
              <Box sx={{ width: "100%" }}>
                <Typography variant="caption" sx={{ color: "#888" }}>
                  Only the environment variable <em>name</em> is stored here, never the real
                  secret — share the name below with IT along with the actual value.
                </Typography>
              </Box>
              <Box sx={{ minWidth: 280, flex: "1 1 320px" }}>
                <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>Key — env var name</Typography>
                <Tooltip title={ssoForm.ssoKeyEnvName || ""} placement="top" disableHoverListener={ssoForm.ssoKeyEnvName.length < 30}>
                  <TextField fullWidth size="small" placeholder="e.g. GHPL_WEB_SSO_KEY" disabled={disabled}
                    value={ssoForm.ssoKeyEnvName}
                    onChange={(e) => setSsoForm((p) => ({ ...p, ssoKeyEnvName: e.target.value }))}
                    inputProps={{ style: { fontFamily: "monospace", fontSize: "0.8rem" } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ fontSize: 16, color: "#7b1fa2" }} /></InputAdornment> }} />
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
                  <Typography variant="caption" style={{ color: "#555" }} display="block" mb={0.5}>IV — env var name</Typography>
                  <Tooltip title={ssoForm.ssoIvEnvName || ""} placement="top" disableHoverListener={ssoForm.ssoIvEnvName.length < 30}>
                    <TextField fullWidth size="small" placeholder="e.g. GHPL_WEB_SSO_IV" disabled={disabled}
                      value={ssoForm.ssoIvEnvName}
                      onChange={(e) => setSsoForm((p) => ({ ...p, ssoIvEnvName: e.target.value }))}
                      inputProps={{ style: { fontFamily: "monospace", fontSize: "0.8rem" } }}
                      InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ fontSize: 16, color: "#7b1fa2" }} /></InputAdornment> }} />
                  </Tooltip>
                </Box>
              )}
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
            </FormSection>

            {ssoForm.ssoDeliveryMode === "REMOTE_API_REDIRECT" && (
            <FormSection title="TPA's SSO API">
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
            </FormSection>
            )}

            <FormSection title="Preview">
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
            </FormSection>
          </>
        )}

        {/* Test API Connection */}
        {!isSsoFeature && selectedRef && (
          <FormSection title="Test API Connection">
            <Box sx={{ width: "100%" }}>
              <Typography variant="caption" sx={{ color: "#777", display: "block", mb: 2 }}>
                {!configId ? "Save this config first, then come back to test." : "Save any changes before testing to ensure results reflect the latest config."}
              </Typography>

              {allPlaceholders.length > 0 && (
                <Box mb={2}>
                  <Typography variant="caption" fontWeight={600} style={{ color: "#555", display: "block", marginBottom: 4 }}>Payload field coverage:</Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {allPlaceholders.map((p) => {
                      const covered = anyCovered(p);
                      return <Chip key={p} size="small" variant="outlined" label={`{{${p}}}`} style={{ fontSize: "0.72rem", fontFamily: "monospace", borderColor: covered ? "#2e7d32" : "#ed6c02", color: covered ? "#1b5e20" : "#bf360c", background: covered ? "#e8f5e9" : "#fff3e0" }} />;
                    })}
                  </Box>
                </Box>
              )}

              {dynamicInputNeeded.length > 0 && (
                <Box mb={2}>
                  <Typography variant="caption" fontWeight={600} style={{ color: "#555", display: "block", marginBottom: 8 }}>Test values for dynamic fields:</Typography>
                  <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, overflow: "hidden", "& .MuiInputBase-input": { color: "#1a1a1a !important" } }}>
                    <Table size="small"><TableBody>
                      {dynamicInputNeeded.map((p) => (
                        <TableRow key={p} sx={{ "&:hover": { bgcolor: "#fafafa" } }}>
                          <TableCell sx={{ width: 180, borderRight: "1px solid #e0e0e0" }}>
                            <Box component="code" style={{ background: "#fff3e0", color: "#e65100", padding: "3px 8px", borderRadius: 4, fontFamily: "monospace", fontSize: "0.8rem", border: "1px solid #ffcc80" }}>{`{{${p}}}`}</Box>
                          </TableCell>
                          <TableCell><TextField size="small" fullWidth placeholder={`Enter test value for ${p}`} value={testInputs[p] ?? ""} onChange={(e) => setTestInputs((prev) => ({ ...prev, [p]: e.target.value }))} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody></Table>
                  </Box>
                </Box>
              )}

              <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                {selectedRef.authType !== "DIRECT" && <Button size="small" variant="outlined" startIcon={testLoading ? <CircularProgress size={14} /> : <PlayArrowIcon />} disabled={testLoading || !configId} onClick={() => runTest(1)} sx={{ textTransform: "none" }}>Test Step 1 (Auth)</Button>}
                <Button size="small" variant="contained" startIcon={testLoading ? <CircularProgress size={14} /> : <PlayArrowIcon />} disabled={testLoading || !configId} onClick={() => runTest(2)} sx={{ textTransform: "none" }}>{selectedRef.authType === "DIRECT" ? "Test API" : "Test Full Flow"}</Button>
                {testResult && <Button size="small" onClick={() => setTestResult(null)} sx={{ textTransform: "none", color: "#777" }}>Clear</Button>}
              </Box>

              {testResult && (testResult.error ? <Alert severity="error" icon={<ErrorOutlineIcon />} sx={{ mt: 1 }}>{String(testResult.error)}</Alert> : (
                <Box mt={1}>
                  {(testResult.steps ?? []).map((s: any, i: number) => (
                    <Box key={i} mb={1.5}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        {s.status === "success" ? <CheckCircleOutlineIcon fontSize="small" color="success" /> : <ErrorOutlineIcon fontSize="small" color="error" />}
                        <Typography variant="caption" fontWeight={700} style={{ color: "#333" }}>Step {s.step} — {s.status === "success" ? "Success" : "Failed"}</Typography>
                      </Box>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#fafafa" }}>
                        <Typography variant="caption" fontWeight={600} style={{ color: "#555", display: "block" }}>Payload sent:</Typography>
                        <pre style={{ margin: "4px 0 8px", fontSize: "0.75rem", overflow: "auto", color: "#333" }}>{JSON.stringify(s.payload, null, 2)}</pre>
                        <Typography variant="caption" fontWeight={600} style={{ color: "#555", display: "block" }}>Response:</Typography>
                        <pre style={{ margin: "4px 0 0", fontSize: "0.75rem", overflow: "auto", color: s.status === "error" ? "#c62828" : "#1b5e20" }}>{JSON.stringify(s.response ?? s.error, null, 2)}</pre>
                      </Paper>
                    </Box>
                  ))}
                  {testResult.finalResult && <Alert severity="success" icon={<CheckCircleOutlineIcon />}><Typography variant="caption" fontWeight={700} display="block">Final result:</Typography><pre style={{ margin: "4px 0 0", fontSize: "0.75rem", wordBreak: "break-all" }}>{JSON.stringify(testResult.finalResult, null, 2)}</pre></Alert>}
                </Box>
              ))}
            </Box>
          </FormSection>
        )}

        {/* Bottom Save/Cancel */}
        {!isView && (
          <Box display="flex" justifyContent="flex-end" gap={1.5} mt={2}>
            <Button variant="outlined" onClick={() => navigate(backPath, { state: backState })}
              sx={{ textTransform: "none", color: "#555", borderColor: "#ccc" }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              startIcon={saving ? <CircularProgress size={16} /> : undefined}
              sx={{ textTransform: "none", fontWeight: 600 }}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Feature"}
            </Button>
          </Box>
        )}

      </Box>

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

export default TpaExternalFeatureForm;
