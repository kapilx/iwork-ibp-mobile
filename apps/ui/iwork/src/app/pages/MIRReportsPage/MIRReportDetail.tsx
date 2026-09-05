import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Box, Button, CircularProgress, Paper, Typography, Checkbox, Chip, TextField } from "@mui/material";
import {
  CommonAccordion,
  CommonBreadcrumb,
  CommonTextField,
  DynamicTable,
  TableColumn,
  Pagination,
  axiosInstance,
  endPoints,
  useApiQuery,
  setToastMessage,
} from "@ui/ui-lib";

const SECTION_PAGE_SIZE = 10;
import { MIR_SECTIONS, MirTable, MirSection } from "./mirSections";
import { mirBreadcrumbs, formatPeriodLabel } from "./config";

interface DetailState {
  company?: string;
  period?: string;
  status?: string;
  readOnly?: boolean;
  reportId?: number;
}

// Shape returned by GET /policy/mir-report/:id/sections
interface ApiSectionData {
  sectionSummary: string;
  cellData: Record<string, string | boolean>;
}
interface ApiSection {
  id: number;
  sectionKey: string;
  sectionName: string;
  displayOrder: number;
  tableRows: Record<string, (string | boolean)[][]>;
  footer?: string;
  savedData: ApiSectionData | null;
}

const MIRReportDetail: React.FC = () => {
  const location = useLocation();
  const { reportId: pathReportId } = useParams();
  const dispatch = useDispatch();
  const state = (location.state ?? {}) as DetailState;

  if (!pathReportId || Number.isNaN(Number(pathReportId))) {
    throw new Error("Report ID does not exist in the system");
  }
  const reportId = Number(pathReportId);
  const { company: stateCompany, period: statePeriod, status: stateStatus } = state;
  const currentUserId = JSON.parse(sessionStorage.getItem("user") || "{}")?.userId;

  // currentStatus drives all UI: buttons, read-only, chip — updated after each transition
  const [currentStatus, setCurrentStatus] = useState((stateStatus ?? "draft").toLowerCase());

  const [values, setValues] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [apiTableRows, setApiTableRows] = useState<Record<string, (string | boolean)[][]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    [MIR_SECTIONS[0].id]: true,
  });
  const [pageByTable, setPageByTable] = useState<Record<string, number>>({});
  const setTablePage = (tableId: string, page: number) =>
    setPageByTable((p) => ({ ...p, [tableId]: page }));
  const [submitting, setSubmitting] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [rejectComment, setRejectComment] = useState("");

  // Fetch sections + saved CRM data when a reportId is available
  const { data: sectionsResponse, isLoading: sectionsLoading } = useApiQuery({
    url: reportId ? endPoints.mirReportSections(reportId) : "",
    queryKey: ["mir-sections", reportId],
    enabled: !!reportId,
  });

  const reportMeta = sectionsResponse?.data?.report;

  const company = stateCompany
    ?? reportMeta?.company?.displayName
    ?? reportMeta?.company?.companyName
    ?? "—";
  const period = statePeriod
    ?? (reportMeta?.reportPeriod ? formatPeriodLabel(reportMeta.reportPeriod) : "—");

  // Backend-computed footers (currently just §10's Total Service Score)
  // override the static placeholder text in MIR_SECTIONS.
  const footerBySectionKey: Record<string, string> = {};
  (sectionsResponse?.data?.sections as ApiSection[] | undefined)?.forEach((sec) => {
    if (sec.footer) footerBySectionKey[sec.sectionKey] = sec.footer;
  });
  const sectionsForRender = MIR_SECTIONS.map((sec) =>
    footerBySectionKey[sec.id] ? { ...sec, footer: footerBySectionKey[sec.id] } : sec,
  );

  // Approve/Reject/Publish are single-level Lead CRM actions (BR-MIR-007) —
  // gated by identity (company.leadCrm), not a generic RBAC permission.
  const isLeadCrm = reportMeta?.company?.leadCrm === currentUserId;

  const isAssociateCrm = reportMeta?.company?.associateCrmId === currentUserId;
  const isReadOnly = currentStatus !== "draft" || !(isAssociateCrm || isLeadCrm);

  useEffect(() => {
    if (!stateStatus && reportMeta?.status) {
      setCurrentStatus(reportMeta.status.toLowerCase());
    }
  }, [reportMeta?.status, stateStatus]);

  // Overlay saved CRM data from the API into local state
  useEffect(() => {
    const apiSections: ApiSection[] = sectionsResponse?.data?.sections ?? [];
    if (!apiSections.length) return;

    const newValues: Record<string, string> = {};
    const newChecks: Record<string, boolean> = {};

    apiSections.forEach((sec) => {
      if (!sec.savedData) return;
      // Section summary
      if (sec.savedData.sectionSummary) {
        newValues[`summary-${sec.sectionKey}`] = sec.savedData.sectionSummary;
      }
      // Per-row cell values
      Object.entries(sec.savedData.cellData ?? {}).forEach(([key, val]) => {
        if (typeof val === "boolean") newChecks[key] = val;
        else newValues[key] = val;
      });
    });

    // Overall comments from the report
    const report = sectionsResponse?.data?.report;
    if (report?.overallComments) {
      newValues["overall"] = report.overallComments;
    }

    // Merge API-provided row data (non-editable columns) keyed by tableId
    const mergedTableRows: Record<string, (string | boolean)[][]> = {};
    apiSections.forEach((sec) => {
      Object.entries(sec.tableRows ?? {}).forEach(([tableId, rows]) => {
        mergedTableRows[tableId] = rows;
      });
    });
    setApiTableRows(mergedTableRows);

    setValues((prev) => ({ ...prev, ...newValues }));
    setChecks((prev) => ({ ...prev, ...newChecks }));
  }, [sectionsResponse]);

  const setVal = (key: string, v: string) => setValues((p) => ({ ...p, [key]: v }));
  const setChk = (key: string, v: boolean) => setChecks((p) => ({ ...p, [key]: v }));
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const toRows = (table: MirTable) => {
    const rows = apiTableRows[table.id] ?? table.rows;
    return rows.map((cells, r) => {
      const obj: Record<string, unknown> = { id: `${table.id}-${r}` };
      cells.forEach((v, ci) => {
        obj[String(ci)] = v;
      });
      return obj;
    });
  };

  const toColumns = (table: MirTable): TableColumn[] =>
    table.columns.map((c, ci) => ({
      field: String(ci),
      headerName: c.editable ? `${c.label} (CRM)` : c.label,
      renderCell: c.editable
        ? (value, row) => {
            // Pagination filler rows render blank — no inputs, so nothing
            // typed into them could ever be saved against a fake row id.
            if ((row as { __filler?: boolean }).__filler) {
              return " ";
            }
            const key = `${(row as { id: string }).id}-${ci}`;
            if (c.type === "checkbox") {
              return (
                <Checkbox
                  size="small"
                  disabled={isReadOnly}
                  checked={checks[key] ?? Boolean(value)}
                  onChange={(e) => setChk(key, e.target.checked)}
                />
              );
            }
            const current = values[key] ?? String(value ?? "");
            if (isReadOnly) {
              return (
                <Typography variant="body2" sx={{ color: "#000" }}>
                  {current || "—"}
                </Typography>
              );
            }
            return (
              <TextField
                variant="outlined"
                size="small"
                fullWidth
                placeholder="Enter…"
                value={current}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVal(key, e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-input": { py: 0.75, px: 1 },
                }}
              />
            );
          }
        : undefined,
    }));

  const handleTransition = async (action: string, comment?: string) => {
    if (!reportId) return;
    setTransitioning(true);
    try {
      const result = await axiosInstance.post(endPoints.mirReportTransition(reportId), { action, comment });
      const newStatus = (result.data?.data?.status ?? "") as string;
      if (newStatus) setCurrentStatus(newStatus);
      if (action === "reject") setRejectComment("");
      const labels: Record<string, string> = {
        approve: "Approved", reject: "Rejected — returned to draft",
        publish: "Published", acknowledge: "Acknowledged",
      };
      dispatch(setToastMessage({ type: "success", message: labels[action] ?? `${action} successful` }));
    } catch (err: any) {
      dispatch(setToastMessage({ type: "error", message: err?.response?.data?.message ?? `Failed to ${action}` }));
    } finally {
      setTransitioning(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!reportId) {
      dispatch(setToastMessage({ type: "error", message: "Report ID is missing" }));
      return;
    }
    setSubmitting(true);
    try {
      // Build sections payload from current values/checks state
      const sections = MIR_SECTIONS.map((sec) => {
        // Collect all cell keys belonging to this section's tables
        const cellData: Record<string, string | boolean> = {};
        sec.tables.forEach((table) => {
          // asFields tables have no backing rows — they're always a single
          // virtual row (r=0) of standalone inputs.
          const rows = table.asFields ? [table.rows[0] ?? []] : (apiTableRows[table.id] ?? table.rows);
          rows.forEach((_, r) => {
            table.columns.forEach((col, ci) => {
              if (!col.editable) return;
              const key = `${table.id}-${r}-${ci}`;
              if (col.type === "checkbox") {
                cellData[key] = checks[key] ?? false;
              } else if (values[key] !== undefined) {
                cellData[key] = values[key];
              }
            });
          });
        });
        return {
          sectionKey: sec.id,
          sectionSummary: values[`summary-${sec.id}`] ?? "",
          cellData,
        };
      });

      await axiosInstance.post(endPoints.mirReportSubmit(reportId), {
        overallComments: values["overall"] ?? "",
        sections,
      });

      dispatch(setToastMessage({ type: "success", message: "MIR submitted for approval" }));
      setCurrentStatus("submitted");
    } catch (err: any) {
      dispatch(setToastMessage({
        type: "error",
        message: err?.response?.data?.message ?? "Failed to submit MIR",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  if (sectionsLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2.5 }}>
      <CommonBreadcrumb crumbs={mirBreadcrumbs(`${company} — ${period}`)} />

      <Paper sx={{ p: 2, my: 2, borderRadius: 2, bgcolor: "action.hover" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {company} — {period}
          </Typography>
          <Chip size="small" label={currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)} color="primary" variant="outlined" />
          {isReadOnly && <Chip size="small" label="Read-only" color="default" />}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {isReadOnly ? "Viewing a generated report" : "Draft · auto-populated snapshot"}
        </Typography>
      </Paper>

      {/* BR-MIR-005: rejection comment stays visible on the form while in draft */}
      {currentStatus === "draft" && reportMeta?.rejectionComment && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: "error.50", border: "1px solid", borderColor: "error.light" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "error.dark" }}>
            Rejected by Lead CRM
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {reportMeta.rejectionComment}
          </Typography>
        </Paper>
      )}

      {sectionsForRender.map((section) => (
        <Box key={section.id} sx={{ mb: 1.5 }}>
          <CommonAccordion
            expanded={!!expanded[section.id]}
            onToggle={() => toggle(section.id)}
            title={section.title}
            summary={section.title}
            details={
              <SectionBody
                section={section}
                expanded={expanded}
                toggle={toggle}
                readOnly={isReadOnly}
                toRows={toRows}
                toColumns={toColumns}
                values={values}
                setVal={setVal}
                pageByTable={pageByTable}
                setTablePage={setTablePage}
              />
            }
          />
        </Box>
      ))}

      {/* §13 Overall Comments */}
      <Paper sx={{ p: 2.5, mt: 1.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Overall Comments
        </Typography>
        {isReadOnly ? (
          <Typography variant="body2" sx={{ color: "#000" }}>
            {values["overall"] || "—"}
          </Typography>
        ) : (
          <CommonTextField
            multiline
            minRows={3}
            fullWidth
            placeholder="CRM free-text overall comment / summary for the entire MIR"
            value={values["overall"] ?? ""}
            onChange={(e) => setVal("overall", e.target.value)}
          />
        )}
      </Paper>

      {/* Workflow action bar — buttons change based on currentStatus */}
      {currentStatus !== "acknowledged" && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
          {currentStatus === "draft" && (isAssociateCrm || isLeadCrm) && (
            <Button
              variant="contained"
              size="large"
              disabled={submitting}
              onClick={handleSubmitForApproval}
              sx={{ minWidth: 200 }}
            >
              {submitting ? "Submitting…" : "Submit For Approval"}
            </Button>
          )}

          {currentStatus === "submitted" && isLeadCrm && (
            <>
              <TextField
                variant="outlined"
                size="small"
                placeholder="Comment required to reject…"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                sx={{ minWidth: 280 }}
              />
              <Button
                variant="outlined"
                color="error"
                size="large"
                disabled={transitioning || !rejectComment.trim()}
                onClick={() => handleTransition("reject", rejectComment)}
                sx={{ minWidth: 120 }}
              >
                {transitioning ? "…" : "Reject"}
              </Button>
              <Button
                variant="contained"
                color="success"
                size="large"
                disabled={transitioning}
                onClick={() => handleTransition("approve")}
                sx={{ minWidth: 120 }}
              >
                {transitioning ? "…" : "Approve"}
              </Button>
            </>
          )}

          {currentStatus === "approved" && isLeadCrm && (
            <Button
              variant="contained"
              size="large"
              disabled={transitioning}
              onClick={() => handleTransition("publish")}
              sx={{ minWidth: 160 }}
            >
              {transitioning ? "Publishing…" : "Publish"}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

interface SectionBodyProps {
  section: MirSection;
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
  readOnly: boolean;
  toRows: (table: MirTable) => Record<string, unknown>[];
  toColumns: (table: MirTable) => TableColumn[];
  values: Record<string, string>;
  setVal: (key: string, v: string) => void;
  pageByTable: Record<string, number>;
  setTablePage: (tableId: string, page: number) => void;
}

const PaginatedTable: React.FC<{
  table: MirTable;
  toRows: (table: MirTable) => Record<string, unknown>[];
  toColumns: (table: MirTable) => TableColumn[];
  page: number;
  setPage: (page: number) => void;
}> = ({ table, toRows, toColumns, page, setPage }) => {
  const allRows = toRows(table);
  const totalRecords = allRows.length;
  const paged =
    totalRecords > SECTION_PAGE_SIZE
      ? allRows.slice((page - 1) * SECTION_PAGE_SIZE, page * SECTION_PAGE_SIZE)
      : allRows;

  // When paginating, always render a full page of rows — a short last page
  // (e.g. 2 records on page 2) is padded with blank filler rows so the table
  // height doesn't jump between pages. Fillers are flagged so editable
  // columns render them empty instead of as inputs.
  const fillerCount =
    totalRecords > SECTION_PAGE_SIZE ? SECTION_PAGE_SIZE - paged.length : 0;
  const displayRows =
    fillerCount > 0
      ? [
          ...paged,
          ...Array.from({ length: fillerCount }, (_, i) => {
            const filler: Record<string, unknown> = {
              id: `${table.id}-filler-${i}`,
              __filler: true,
            };
            table.columns.forEach((_, ci) => {
              // Non-breaking space keeps the cell one text line tall, so
              // filler rows match real rows instead of collapsing flat.
              filler[String(ci)] = " ";
            });
            return filler;
          }),
        ]
      : paged;

  return (
    <Box>
      <DynamicTable rows={displayRows} columns={toColumns(table)} />
      {totalRecords > SECTION_PAGE_SIZE && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
          <Pagination
            totalRecords={totalRecords}
            currentPage={page}
            pageSize={SECTION_PAGE_SIZE}
            onPageChange={setPage}
          />
        </Box>
      )}
    </Box>
  );
};

// Renders a table's columns as standalone labeled inputs (row 0) instead of
// a grid — for free-text CRM sections that were never really "rows" (§14
// Other Activities).
const FieldsTable: React.FC<{
  table: MirTable;
  readOnly: boolean;
  values: Record<string, string>;
  setVal: (key: string, v: string) => void;
}> = ({ table, readOnly, values, setVal }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    {table.columns.map((c, ci) => {
      const key = `${table.id}-0-${ci}`;
      const current = values[key] ?? "";
      return (
        <Box key={ci}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {c.label}
          </Typography>
          {readOnly ? (
            <Typography variant="body2" sx={{ color: "#000" }}>
              {current || "—"}
            </Typography>
          ) : (
            <CommonTextField
              multiline
              minRows={2}
              fullWidth
              placeholder="Enter…"
              value={current}
              onChange={(e) => setVal(key, e.target.value)}
            />
          )}
        </Box>
      );
    })}
  </Box>
);

const SectionBody: React.FC<SectionBodyProps> = ({
  section,
  expanded,
  toggle,
  readOnly,
  toRows,
  toColumns,
  values,
  setVal,
  pageByTable,
  setTablePage,
}) => (
  <Box>
    {section.tables.map((table) => {
      const isSubsection = table.caption?.trimStart().startsWith("§");
      const tableEl = table.asFields ? (
        <FieldsTable table={table} readOnly={readOnly} values={values} setVal={setVal} />
      ) : (
        <PaginatedTable
          table={table}
          toRows={toRows}
          toColumns={toColumns}
          page={pageByTable[table.id] ?? 1}
          setPage={(p) => setTablePage(table.id, p)}
        />
      );
      const body = (
        <Box>
          {table.caption && !isSubsection && (
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1.5, mb: 2 }}>
              {table.caption}
            </Typography>
          )}
          {tableEl}
        </Box>
      );
      return isSubsection ? (
        <Box key={table.id} sx={{ mb: 1.5 }}>
          <CommonAccordion
            expanded={!!expanded[table.id]}
            onToggle={() => toggle(table.id)}
            title={table.caption}
            summary={table.caption}
            details={tableEl}
            customStyles={{ accordion: { border: "1px solid #e0e0e0", borderRadius: 8 } }}
          />
        </Box>
      ) : (
        <React.Fragment key={table.id}>{body}</React.Fragment>
      );
    })}

    {section.footer && (
      <Typography variant="body2" sx={{ fontWeight: 600, mt: 1 }}>
        {section.footer}
      </Typography>
    )}

    {section.hasSummary && (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Section Summary
        </Typography>
        {readOnly ? (
          <Typography variant="body2" sx={{ color: "#000" }}>
            {values[`summary-${section.id}`] || "—"}
          </Typography>
        ) : (
          <CommonTextField
            multiline
            minRows={2}
            fullWidth
            placeholder="CRM free-text summary for this section"
            value={values[`summary-${section.id}`] ?? ""}
            onChange={(e) => setVal(`summary-${section.id}`, e.target.value)}
          />
        )}
      </Box>
    )}
  </Box>
);

export default MIRReportDetail;
