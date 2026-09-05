import { useEffect, useMemo, useState } from "react";
import {
  Box, Button, Checkbox, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Tooltip, Typography,
} from "@mui/material";
import { AlertTriangle, FilePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { endPoints, useApiQuery } from "@ui/ui-lib";

// One row of hcl_employee_intake, as returned by
// GET /hr-module/hcl/company/:companyId/intake — see
// apps/services/service-lib/src/lib/entities/hcl-employee-intake.entity.ts.
export interface HclIntakeRecord {
  id: number;
  flagOperationType: string;
  ein: string;
  policyId: number | null;
  companyId: number | null;
  status: "RECEIVED" | "PROCESSING" | "PROCESSED" | "FAILED";
  failureReason: string | null;
  endorsementId: number | null;
  createdAt: string;
  parsedEmployee: {
    INSUREDNAME?: string;
    EMAIL?: string;
    MOBILE?: string;
    DOB?: string;
    DOJ?: string;
    GENDER?: string;
    GRADE?: string;
    CTC?: number;
    IS_EMPAD?: number;
  };
  parsedDependents: Array<{
    DEP_NAME?: string;
    DEP_DOB?: string;
    DEP_GENDER?: string;
    HCL_DEPREL?: number;
    HCL_DEPID?: number;
  }>;
}

const OPERATION_LABELS: Record<string, string> = {
  AD: "Activate/Deactivate",
  BI: "Bulk Insert",
  DD: "Dependent Delete",
  ED: "Employee Demise",
  ES: "Employee Separation",
  ET: "Employee Transfer",
  NA: "Natural Addition",
};

// This theme's default Checkbox color (action.active, a light gray) was
// nearly invisible in its unchecked state against the dialog's white
// background. Explicit dark border/fill so it's actually visible, both
// checked and unchecked — same brand indigo as the "Create Endorsement"
// button when checked/indeterminate.
const CHECKBOX_SX = {
  color: "#111827",
  "&.Mui-checked": { color: "#4338CA" },
  "&.MuiCheckbox-indeterminate": { color: "#4338CA" },
  "&.Mui-disabled": { color: "#D1D5DB" },
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  RECEIVED: { bg: "#F3F4F6", fg: "#374151" },
  PROCESSING: { bg: "#FEF3C7", fg: "#92400E" },
  PROCESSED: { bg: "#DCFCE7", fg: "#166534" },
  FAILED: { bg: "#FEE2E2", fg: "#991B1B" },
};

// The existing enrollment-upload pipeline needs the same ZohoEmployee shape
// ZohoEndorsementPage already consumes — reusing it end-to-end rather than
// building a second xlsx/template mechanism (TRD §6, §9). HCL doesn't carry
// a first/last name split or a department field, so those two are a
// best-effort approximation / left blank — flagged here, not silently
// invented as real data.
function mapIntakeToZohoEmployee(record: HclIntakeRecord) {
  const emp = record.parsedEmployee ?? {};
  const fullName = emp.INSUREDNAME ?? "";
  const [firstName, ...rest] = fullName.split(" ");
  const isInactive =
    record.flagOperationType === "ED" ||
    record.flagOperationType === "ES" ||
    (record.flagOperationType === "AD" && emp.IS_EMPAD === 0);

  return {
    employeeId: record.ein,
    firstName: firstName ?? "",
    lastName: rest.join(" "),
    email: emp.EMAIL ?? "",
    mobile: emp.MOBILE ?? "",
    dateOfBirth: emp.DOB ?? "",
    gender: emp.GENDER ?? "",
    // HCL has no direct "designation" field — GRADE is the closest
    // available approximation (TBD — not confirmed against real template
    // columns, see TRD §9).
    designation: emp.GRADE ?? "",
    // HCL's document has no department field at all — left blank rather
    // than invented.
    department: "",
    dateOfJoining: emp.DOJ ?? "",
    employmentStatus: isInactive ? "Inactive" : "Active",
    ctc: emp.CTC != null ? String(emp.CTC) : "",
  };
}

// Dependents were previously dropped entirely when generating an endorsement
// — only the employee row made it into the ZohoEmployee-shaped object above.
// Fixed here: each dependent becomes its own row, linked to its employee via
// the same employeeId (EIN) — that's how the template/enrollment-upload
// pipeline associates a dependent row with its employee, mirroring the
// "Relation" column convention already used for manual/Zoho uploads.
//
// HCL_DEPREL is a numeric code (e.g. 1, 4, 7, 9 in the document's own
// samples) with NO legend anywhere in HCL's interface document — there is no
// confirmed mapping from these codes to relation names (Spouse/Child/
// Parent/etc.), and guessing one would risk silently mis-classifying a
// dependent for a health policy, which affects real eligibility/sum-insured
// rules. Left blank rather than filled with a guess or a placeholder note —
// per explicit instruction, an empty Relation cell is fine; ZohoEndorsement-
// Page's getCellValue only defaults to "SELF" when `relation` is `undefined`
// (i.e. never set — true for every actual employee row), not when it's an
// empty string, so this renders as a genuinely blank cell rather than
// silently falling back to "SELF". See TRD §9's TBD on this exact gap.
function mapDependentToRow(
  dependent: HclIntakeRecord["parsedDependents"][number],
  parentEin: string,
) {
  const fullName = dependent.DEP_NAME ?? "";
  const [firstName, ...rest] = fullName.split(" ");
  return {
    employeeId: parentEin,
    firstName: firstName ?? "",
    lastName: rest.join(" "),
    email: "",
    mobile: "",
    dateOfBirth: dependent.DEP_DOB ?? "",
    gender: dependent.DEP_GENDER ?? "",
    designation: "",
    department: "",
    dateOfJoining: "",
    employmentStatus: "Active",
    ctc: "",
    relation: "",
  };
}

// What to actually carry into the endorsement for the selected records.
// "dependentsOnly" exists because of a real pipeline constraint (confirmed
// via a downloaded error report): the existing enrollment-upload path
// rejects (ER0031) a row for an employee already mapped to the policy —
// so a Natural Addition (new dependent for an already-enrolled employee)
// must submit ONLY the dependent, not resubmit the employee too.
type SubmissionMode = "both" | "employeeOnly" | "dependentsOnly";

const SUBMISSION_MODE_OPTIONS: { value: SubmissionMode; label: string }[] = [
  { value: "both", label: "Employee + Dependents" },
  { value: "employeeOnly", label: "Employee Only" },
  { value: "dependentsOnly", label: "Member Only (Dependents)" },
];

interface HclIntakeDialogProps {
  open: boolean;
  onClose: () => void;
  companyId: number;
}

const PAGE_SIZE = 10;

export function HclIntakeDialog({ open, onClose, companyId }: HclIntakeDialogProps) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submissionMode, setSubmissionMode] = useState<SubmissionMode>("both");
  // 0-indexed to match MUI's TablePagination convention; converted to the
  // 1-indexed page the API expects when building the URL below.
  const [pageIndex, setPageIndex] = useState(0);

  // Reset back to page 1 whenever the dialog is (re)opened for a company —
  // otherwise reopening it would silently resume on whatever page it was
  // left on last time.
  useEffect(() => {
    if (open) setPageIndex(0);
  }, [open, companyId]);

  const { data, isLoading, refetch } = useApiQuery({
    queryKey: ["hclIntake", companyId, pageIndex],
    url: open && companyId
      ? endPoints.hclIntakeForCompany(companyId, undefined, pageIndex + 1, PAGE_SIZE)
      : "",
    enabled: open && Boolean(companyId),
  });

  const records: HclIntakeRecord[] = data?.data?.records ?? [];
  // A company can accumulate far more intake rows than one page holds —
  // this endpoint is now paginated (page/limit), so `total` (not
  // records.length) is what drives the pagination control below.
  const total: number = data?.data?.total ?? records.length;

  const selectablePolicyId = useMemo(() => {
    // Selection is constrained to a single policy — the existing
    // enrollment-upload endpoint (and the endorsement it creates) is always
    // scoped to one policyId (TRD §8).
    const ids = new Set(
      records
        .filter((r) => selected.has(r.id))
        .map((r) => r.policyId)
        .filter((id): id is number => id != null),
    );
    return ids.size === 1 ? [...ids][0] : null;
  }, [records, selected]);

  const toggle = (id: number, eligible: boolean) => {
    if (!eligible) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // What the header "select all" checkbox can actually select on THIS page —
  // same two constraints each row's own checkbox already enforces
  // (RECEIVED/FAILED only, single policy at a time). Walks rows in order,
  // locking onto the first policyId it meets (or the already-selected one)
  // so a page spanning more than one policy doesn't get partially selected
  // across policies in one click.
  const selectableOnPage = useMemo(() => {
    let lockedPolicyId = selectablePolicyId;
    const ids: number[] = [];
    for (const r of records) {
      if (r.status !== "RECEIVED" && r.status !== "FAILED") continue;
      if (lockedPolicyId != null && r.policyId !== lockedPolicyId) continue;
      if (lockedPolicyId == null && r.policyId != null) lockedPolicyId = r.policyId;
      ids.push(r.id);
    }
    return ids;
  }, [records, selectablePolicyId]);

  const allOnPageSelected =
    selectableOnPage.length > 0 && selectableOnPage.every((id) => selected.has(id));
  const someOnPageSelected = selectableOnPage.some((id) => selected.has(id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        selectableOnPage.forEach((id) => next.delete(id));
      } else {
        selectableOnPage.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleCreateEndorsement = () => {
    const chosen = records.filter((r) => selected.has(r.id));
    if (!chosen.length) return;
    const employees =
      submissionMode === "dependentsOnly" ? [] : chosen.map(mapIntakeToZohoEmployee);
    const dependents =
      submissionMode === "employeeOnly"
        ? []
        : chosen.flatMap((r) => (r.parsedDependents ?? []).map((dep) => mapDependentToRow(dep, r.ein)));
    onClose();
    navigate("/hr-portal/zoho-endorsement", {
      state: {
        employees,
        dependents,
        // Every selected record already resolved to this exact policy at
        // intake time (resolvePolicy() in external-integration-service) —
        // selectablePolicyId enforces they can't span more than one. Passed
        // through so the next screen can't submit this data against a
        // different, manually-picked policy (see ZohoEndorsementPage's
        // lockedPolicyId handling).
        policyId: selectablePolicyId,
        sourceLabel: "HCL",
        sourceRecordIds: chosen.map((r) => r.id),
        onSubmitSuccessEndpoint: endPoints.hclIntakeMarkProcessing,
      },
    });
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography fontWeight={700} fontSize={16}>HCL Employee Sync — Received Records</Typography>
        <Typography variant="body2" mt={0.5}>
          Select RECEIVED or FAILED records for a single policy, then create an endorsement using
          the existing enrollment pipeline. Records are only marked Processed once that
          endorsement is actually created. Any dependents on a selected record are carried into
          the endorsement too — their Relation column will need manual correction in the next
          screen (HCL's relationship codes aren't mapped to names yet).
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflowX: "auto" }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : !records.length ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <AlertTriangle size={32} color="#9CA3AF" style={{ marginBottom: 8 }} />
            <Typography variant="body2">No HCL records received yet.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: "#F8FAFC", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" } }}>
                  <TableCell padding="checkbox">
                    <Tooltip title={selectableOnPage.length ? "Select all eligible rows on this page" : "No eligible rows on this page"}>
                      <span>
                        <Checkbox
                          size="small"
                          checked={allOnPageSelected}
                          indeterminate={someOnPageSelected && !allOnPageSelected}
                          disabled={!selectableOnPage.length}
                          onChange={toggleSelectAll}
                          sx={CHECKBOX_SX}
                        />
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>EIN</TableCell>
                  <TableCell>Employee / Dependent</TableCell>
                  <TableCell>Operation</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Received</TableCell>
                  <TableCell>Endorsement ID</TableCell>
                  <TableCell>Failure Info</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((r) => {
                  const eligible = r.status === "RECEIVED" || r.status === "FAILED";
                  const blockedByPolicyMismatch =
                    eligible && selectablePolicyId != null && r.policyId !== selectablePolicyId;
                  const label = r.parsedEmployee?.INSUREDNAME
                    || r.parsedDependents?.[0]?.DEP_NAME
                    || "—";
                  const colors = STATUS_COLORS[r.status] ?? STATUS_COLORS.RECEIVED;
                  const rowSelectable = eligible && !blockedByPolicyMismatch;
                  return (
                    <TableRow
                      key={r.id}
                      onClick={() => toggle(r.id, eligible)}
                      sx={{
                        "&:nth-of-type(even)": { bgcolor: "#FAFAFA" },
                        "& td": { fontSize: 12 },
                        cursor: rowSelectable ? "pointer" : "default",
                        "&:hover": rowSelectable ? { bgcolor: "#EEF2FF" } : undefined,
                      }}
                    >
                      {/* stopPropagation so clicking the checkbox itself doesn't
                          also trigger the row's own onClick and double-toggle */}
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title={
                          !eligible ? "Only RECEIVED or FAILED records can be selected"
                            : blockedByPolicyMismatch ? "Selection is limited to a single policy at a time"
                            : ""
                        }>
                          <span>
                            <Checkbox
                              size="small"
                              checked={selected.has(r.id)}
                              disabled={!eligible || blockedByPolicyMismatch}
                              onChange={() => toggle(r.id, eligible)}
                              sx={CHECKBOX_SX}
                            />
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{r.ein}</TableCell>
                      <TableCell>
                        {label}
                        {r.parsedDependents?.length > 0 && (
                          <Box component="span" sx={{ color: "#6B7280", ml: 0.5 }}>
                            {/* Explicit color — this theme's "text.secondary" token
                                renders near-invisible (white) here, same root
                                cause as the checkbox/dropdown-label fixes above. */}
                            (+{r.parsedDependents.length} dependent{r.parsedDependents.length !== 1 ? "s" : ""})
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>{OPERATION_LABELS[r.flagOperationType] ?? r.flagOperationType}</TableCell>
                      <TableCell>
                        <Box component="span" sx={{
                          px: 0.8, py: 0.2, borderRadius: 0.8, fontSize: 11, fontWeight: 600,
                          bgcolor: colors.bg, color: colors.fg,
                        }}>
                          {r.status}
                        </Box>
                      </TableCell>
                      <TableCell>{formatDate(r.createdAt)}</TableCell>
                      <TableCell>{r.endorsementId ?? "—"}</TableCell>
                      <TableCell sx={{ maxWidth: 220, whiteSpace: "normal" }}>{r.failureReason ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {!isLoading && total > 0 && (
          <TablePagination
            component="div"
            count={total}
            page={pageIndex}
            onPageChange={(_e, newPage) => setPageIndex(newPage)}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
            sx={{ borderTop: "1px solid #EEF2F7" }}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <FormControl size="small" sx={{ minWidth: 200, mr: "auto" }}>
          {/* Explicit color — this label was rendering near-invisible
              (very light/white) against the dialog's white background,
              inheriting some ambient light-on-dark label color from
              elsewhere rather than MUI's normal default. */}
          <InputLabel id="hcl-submission-mode-label" sx={{ color: "#374151", "&.Mui-focused": { color: "#4338CA" } }}>
            Include in Endorsement
          </InputLabel>
          <Select
            labelId="hcl-submission-mode-label"
            label="Include in Endorsement"
            value={submissionMode}
            onChange={(e) => setSubmissionMode(e.target.value as SubmissionMode)}
            sx={{ color: "#111827" }}
          >
            {SUBMISSION_MODE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" size="small" onClick={onClose} sx={{ textTransform: "none" }}>
          Close
        </Button>
        <Button variant="text" size="small" onClick={() => refetch()} sx={{ textTransform: "none" }}>
          Refresh
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<FilePlus size={14} />}
          disabled={!selected.size}
          onClick={handleCreateEndorsement}
          sx={{ bgcolor: "#4338CA", "&:hover": { bgcolor: "#3730A3" }, textTransform: "none", fontWeight: 600 }}
        >
          Create Endorsement ({selected.size})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
