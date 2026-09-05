import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Collapse, Dialog, DialogContent, Typography } from "@mui/material";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Loader2,
  MessageCircle,
  Play,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Ticket,
  UploadCloud,
  User,
  X,
} from "lucide-react";
import { PortalActionButton, PortalHeroHeader } from "../HRPortal/controls";
import { type HRTicket } from "../../mock-data/hr-portal/tickets";
import { apiRequest, endPoints, useApiMutation } from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { setToastMessage } from "../../redux/slice";
import { useHRReport } from "../../hooks/useHRReport";
import { getCompanyId } from "../../utils/companyConfig";

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const STATUS_CFG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  open:        { color: "#D97706", bg: "#FFF7ED", dot: "#F59E0B", label: "Open" },
  in_progress: { color: "#7C3AED", bg: "#F5F3FF", dot: "#8B5CF6", label: "In Progress" },
  resolved:    { color: "#059669", bg: "#ECFDF5", dot: "#10B981", label: "Resolved" },
  closed:      { color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF", label: "Closed" },
};

const NEXT_STATUSES: Record<string, string[]> = {
  open: ["in_progress", "resolved"],
  in_progress: ["resolved", "open"],
  resolved: ["closed", "open"],
  closed: ["open"],
};

const CATEGORY_LABELS: Record<string, string> = {
  billing: "Billing", claims: "Claims", policy: "Policy",
  enrollment: "Enrolment", other: "Other",
};

const getStatusCfg = (s: string) =>
  STATUS_CFG[(s || "").toLowerCase().replace(/[\s-]/g, "_")] ?? STATUS_CFG.open;

const fmt = (d: string) => {
  if (!d) return "--";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "--");

// ─── API types ────────────────────────────────────────────────────────────────

interface LiveTicket {
  id: number;
  ticketId: string;
  employeeId: number;
  companyEmployeeId?: string | null;
  employeeName: string;
  employeeEmail: string;
  designation?: string;
  raisedBy?: string;
  category: string;
  status: string;
  priority: string;
  mailId: string;
  descriptionPreview: string;
  description: string;
  createdAt: string;
  documentIds?: number[] | null;
}

type EmployeeRow = {
  employeeId: number;
  companyEmployeeId: string;
  employeeName: string;
  fullName: string | null;
  email?: string;
};

function toHRTicket(t: LiveTicket): HRTicket {
  return {
    id: t.id,
    ticketId: t.ticketId,
    employeeId: String(t.employeeId),
    companyEmployeeId: t.companyEmployeeId ?? "--",
    employeeName: t.employeeName ?? "--",
    department: t.designation ?? "--",
    category: (t.category?.toLowerCase() ?? "other") as HRTicket["category"],
    status: (t.status?.toLowerCase() ?? "open") as HRTicket["status"],
    mailId: t.mailId ?? "",
    escalationDescription: t.description ?? t.descriptionPreview ?? "",
    createdAt: t.createdAt,
    updatedAt: t.createdAt,
    raisedBy: ((t.raisedBy ?? "employee").toLowerCase()) as HRTicket["raisedBy"],
    documents: Array.isArray(t.documentIds)
      ? t.documentIds.map((id, i) => ({ documentId: String(id), fileName: `Document ${i + 1}` }))
      : [],
  };
}

const calcTat = (ticket: HRTicket): number => {
  const end =
    ticket.status === "resolved" || ticket.status === "closed"
      ? new Date(ticket.updatedAt)
      : new Date();
  return Math.max(0, Math.floor((end.getTime() - new Date(ticket.createdAt).getTime()) / 86_400_000));
};

const tatStyle = (days: number) => {
  if (days <= 3)  return { color: "#059669", bg: "#ECFDF5", label: `${days}d` };
  if (days <= 7)  return { color: "#D97706", bg: "#FFF7ED", label: `${days}d` };
  return           { color: "#DC2626", bg: "#FEF2F2", label: `${days}d` };
};

// ─── Draft / filter state ─────────────────────────────────────────────────────

interface TicketDraft {
  searchText: string;
  category:   string;
  raisedBy:   string;
  status:     string;
  raisedFrom: string;
  raisedTo:   string;
  updatedFrom: string;
  updatedTo:  string;
}

const BLANK: TicketDraft = {
  searchText: "", category: "", raisedBy: "",
  status: "", raisedFrom: "", raisedTo: "", updatedFrom: "", updatedTo: "",
};

const CHIP_LABELS: Record<keyof TicketDraft, string> = {
  searchText:  "Search",
  category:    "Category",
  raisedBy:    "Raised By",
  status:      "Status",
  raisedFrom:  "Raised From",
  raisedTo:    "Raised To",
  updatedFrom: "Updated From",
  updatedTo:   "Updated To",
};

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const cfg = getStatusCfg(status);
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, px: 1.25, py: 0.3, borderRadius: 999, bgcolor: cfg.bg, flexShrink: 0 }}>
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: cfg.dot, flexShrink: 0 }} />
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: cfg.color, lineHeight: 1.4, whiteSpace: "nowrap" }}>{cfg.label}</Typography>
    </Box>
  );
}

// pill selector used inside filter panel groups
function PillGroup({ label, options, value, onChange }: {
  label: string; options: { label: string; val: string }[];
  value: string; onChange: (v: string) => void;
}) {
  return (
    <Box>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.75 }}>{label}</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {options.map(({ label: l, val }) => {
          const active = value === val;
          return (
            <Box key={val} onClick={() => onChange(val)}
              sx={{ height: 30, px: 1.5, borderRadius: "6px", cursor: "pointer", border: active ? "1.5px solid #1C57B8" : "1.5px solid #E5E7EB", bgcolor: active ? "#EBF3FF" : "#F9FAFB", color: active ? "#1C57B8" : "#6B7280", fontSize: 13, fontWeight: active ? 700 : 500, display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none", transition: "all 0.12s", whiteSpace: "nowrap" }}>
              {l}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// date-range pair
function DateRangePair({ label, from, to, onFrom, onTo }: {
  label: string; from: string; to: string;
  onFrom: (v: string) => void; onTo: (v: string) => void;
}) {
  return (
    <Box>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.75 }}>{label}</Typography>
      <Box sx={{ display: "flex", gap: 0.75, alignItems: "flex-end" }}>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.4 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em" }}>From</Typography>
          <input type="date" value={from} onChange={(e) => onFrom(e.target.value)}
            style={{ width: "100%", height: 30, borderRadius: 6, border: "1px solid #E5E7EB", background: "#F9FAFB", padding: "0 6px", fontSize: 13, fontFamily: "inherit", color: "#111827", outline: "none", boxSizing: "border-box" }} />
        </Box>
        <Typography sx={{ fontSize: 13, color: "#9CA3AF", pb: 0.25 }}>–</Typography>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.4 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em" }}>To</Typography>
          <input type="date" value={to} onChange={(e) => onTo(e.target.value)}
            style={{ width: "100%", height: 30, borderRadius: 6, border: "1px solid #E5E7EB", background: "#F9FAFB", padding: "0 6px", fontSize: 13, fontFamily: "inherit", color: "#111827", outline: "none", boxSizing: "border-box" }} />
        </Box>
      </Box>
    </Box>
  );
}

// ─── Expanded row detail ──────────────────────────────────────────────────────

function TicketDetailPanel({ ticket, onChangeStatus }: { ticket: HRTicket; onChangeStatus?: () => void }) {
  return (
    <Box sx={{ px: 3, py: 2.5, bgcolor: "#F8FAFC", borderTop: "1px solid #E5E7EB", display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Fields grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2.5 }}>
        {[
          { label: "Employee ID",  value: ticket.companyEmployeeId ?? "--" },
          { label: "Department",   value: ticket.department },
          { label: "Mail ID",      value: ticket.mailId },
          { label: "Date Raised",  value: fmt(ticket.createdAt) },
          { label: "Last Updated", value: fmt(ticket.updatedAt) },
        ].map(({ label, value }) => (
          <Box key={label}>
            <Typography sx={{ fontSize: 15, color: "#9CA3AF", mb: 0.4 }}>{label}</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 500, color: "#111827" }}>{value}</Typography>
          </Box>
        ))}
      </Box>

      {/* Description */}
      {ticket.escalationDescription && (
        <Box>
          <Typography sx={{ fontSize: 15, color: "#9CA3AF", mb: 0.5 }}>Description</Typography>
          <Typography sx={{ fontSize: 15, color: "#374151", lineHeight: 1.7 }}>{ticket.escalationDescription}</Typography>
        </Box>
      )}

      {/* Documents */}
      {ticket.documents.length > 0 && (
        <Box>
          <Typography sx={{ fontSize: 15, color: "#9CA3AF", mb: 1 }}>Attached Documents</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {ticket.documents.map((doc) => (
              <Box key={doc.documentId}
                onClick={async () => {
                  if (!doc.documentId) return;
                  try {
                    const res = await apiRequest(endPoints.ibpFileUploadDownloadById(Number(doc.documentId)), { method: "GET", responseType: "blob" });
                    const url = window.URL.createObjectURL(res.data);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = doc.fileName || doc.documentId;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  } catch { /* silent */ }
                }}
                sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 2, py: 1, borderRadius: "8px", border: "1px solid #E5E7EB", bgcolor: "#fff", cursor: "pointer", "&:hover": { bgcolor: "#EBF5FF", borderColor: "#3EA0F1" } }}>
                <FileText size={14} color="#3EA0F1" />
                <Typography sx={{ fontSize: 15, color: "#374151", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.fileName}</Typography>
                <Download size={13} color="#9CA3AF" />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Action CTA */}
      <Box sx={{ display: "flex", justifyContent: "flex-start", gap: 1.5, pt: 1.5, borderTop: "1px solid #E5E7EB" }}>
        {(ticket.status === "open" || ticket.status === "in_progress") && (
          <>
           <Box
  onClick={() => {}}
  sx={{
    height: 34,
    px: 2,
    display: "flex",
    alignItems: "center",
    gap: 0.75,
    borderRadius: "8px",
    border: "1.5px solid #F59E0B",
    color: "#D97706",
    fontSize: 15,
    fontWeight: 600,
    cursor: "not-allowed",
    opacity: 0.5,
    pointerEvents: "none",
  }}
>
  <AlertCircle size={14} color="#D97706" />
  Escalate
</Box>

<Box
  onClick={() => {}}
  sx={{
    height: 34,
    px: 2.5,
    display: "flex",
    alignItems: "center",
    gap: 0.75,
    borderRadius: "8px",
    bgcolor: "#1C57B8",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "not-allowed",
    opacity: 0.5,
    pointerEvents: "none",
  }}
>
  <MessageCircle size={14} color="#fff" />
  Send Follow-up
</Box>
          </>
        )}
        {ticket.status !== "resolved" && (
          <Box onClick={() => onChangeStatus?.()}
            sx={{ height: 34, px: 2.5, display: "flex", alignItems: "center", gap: 0.75, borderRadius: "8px", bgcolor: "#1C57B8", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", "&:hover": { bgcolor: "#164293" }, transition: "background 0.12s" }}>
            <RotateCcw size={14} color="#fff" />
            Change Status
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── Change Status Dialog ─────────────────────────────────────────────────────

function ChangeStatusDialog({ ticket, onClose, onSuccess }: { ticket: HRTicket; onClose: () => void; onSuccess: () => void }) {
  const dispatch = useDispatch();
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { mutateAsync: updateTicketStatus } = useApiMutation({});

  const nextOptions = NEXT_STATUSES[ticket.status] ?? [];
  const isValid = !!status && comment.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await updateTicketStatus({
        endpoint: endPoints.updateTicketStatus(ticket.id),
        method: "PUT",
        data: { status, comment: comment.trim() },
      });

      // Fire status-change email (non-blocking)
      const employeeId = Number(ticket.employeeId);
      apiRequest(endPoints.supportTicketStatusChanged, {
        method: "POST",
        data: {
          ...(employeeId > 0 ? { employeeId } : {}),
          mailId: ticket.mailId,
          ticketId: ticket.ticketId,
          category: ticket.category,
          status,
          comment: comment.trim(),
        },
      }).catch(() => {});

      // Activity log (non-blocking)
      apiRequest(endPoints.getActivityLogs, {
        method: "POST",
        data: {
          activityKey: "TICKET_STATUS_CHANGED",
          activityCategory: "SUPPORT",
          referenceId: ticket.id || ticket.ticketId,
          referenceType: "TICKET",
          metadata: {
            ticketId: ticket.ticketId,
            previousStatus: ticket.status,
            newStatus: status,
            activityText: `Ticket ${ticket.ticketId} status changed from ${ticket.status} to ${status} by HR`,
          },
        },
      }).catch(() => {});

      dispatch(setToastMessage(`Ticket ${ticket.ticketId} status updated to ${getStatusCfg(status).label}.`));
      onSuccess();
    } catch {
      dispatch(setToastMessage("Failed to update ticket status. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>Change Ticket Status</Typography>
          <Box onClick={onClose} sx={{ cursor: "pointer", display: "flex" }}><X size={16} color="#9CA3AF" /></Box>
        </Box>

        <Typography sx={{ fontSize: 14, color: "#6B7280" }}>{ticket.ticketId}</Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>New Status <Box component="span" sx={{ color: "#EF4444" }}>*</Box></Typography>
          <Box component="select" value={status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
            sx={{ height: 42, borderRadius: "10px", border: `1px solid ${status ? "#1C57B8" : "#E5E7EB"}`, bgcolor: status ? "#F0F6FF" : "#fff", px: 1.5, fontSize: 15, color: status ? "#1C57B8" : "#9CA3AF", fontFamily: "inherit", outline: "none", cursor: "pointer", appearance: "none", pr: "32px", fontWeight: status ? 600 : 400, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
            <option value="" disabled>Select new status</option>
            {nextOptions.map((s) => (
              <option key={s} value={s}>{getStatusCfg(s).label}</option>
            ))}
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Comment <Box component="span" sx={{ color: "#EF4444" }}>*</Box></Typography>
          <Box component="textarea" value={comment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
            placeholder="Explain the reason for this status change…"
            rows={4}
            sx={{ borderRadius: "10px", border: `1px solid ${comment ? "#1C57B8" : "#E5E7EB"}`, p: 1.5, fontSize: 15, color: "#374151", fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.7 }} />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
          <Box onClick={onClose} sx={{ height: 38, px: 2.5, display: "flex", alignItems: "center", borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: 15, fontWeight: 600, color: "#374151", cursor: "pointer", "&:hover": { bgcolor: "#F9FAFB" } }}>
            Cancel
          </Box>
          <Box onClick={isValid && !submitting ? handleSubmit : undefined}
            sx={{ height: 38, px: 3, display: "flex", alignItems: "center", gap: 1, borderRadius: "10px", fontSize: 15, fontWeight: 600, bgcolor: isValid && !submitting ? "#184C97" : "#E5E7EB", color: isValid && !submitting ? "#fff" : "#9CA3AF", cursor: isValid && !submitting ? "pointer" : "not-allowed", "&:hover": isValid && !submitting ? { bgcolor: "#143F7D" } : {} }}>
            {submitting && <Loader2 size={14} />}
            Update Status
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ─── Raise Ticket Form ────────────────────────────────────────────────────────

function RaiseTicketView({ onBack, companyId, onRaiseSuccess }: { onBack: () => void; companyId: number; onRaiseSuccess: () => void }) {
  const dispatch = useDispatch();
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(employeeSearch.trim()), 350);
    return () => window.clearTimeout(t);
  }, [employeeSearch]);

  const { data: employeeRows, isLoading: empLoading } = useHRReport<EmployeeRow>(
    "ibp_hr_employee_listing",
    { companyId, enrollStatus: "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED", search: debouncedSearch },
    !!companyId && debouncedSearch.length >= 2,
    { limit: 0 },
  );

  const onAddFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setFiles((prev) => [...prev, ...Array.from(incoming)]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const removeFile = (idx: number) => setFiles((f) => f.filter((_, i) => i !== idx));
  const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`);

  const filteredEmployees = employeeRows;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selectEmployee = (emp: EmployeeRow) => { setSelectedEmployee(emp); setEmployeeSearch(emp.fullName ?? emp.employeeName); setShowDropdown(false); };
  const clearEmployee  = () => { setSelectedEmployee(null); setEmployeeSearch(""); };

  const handleSubmit = async () => {
    if (!selectedEmployee || !category || !description.trim()) {
      dispatch(setToastMessage("Please fill all required fields."));
      return;
    }
    setSubmitting(true);
    try {
      const userSession = sessionStorage.getItem("user");
      const userData = userSession ? JSON.parse(userSession) : null;
      const hrEmail = userData?.email || userData?.emailId || "";
      const resolvedMailId = hrEmail || selectedEmployee?.email || "";

      // Upload any attached files and collect their document IDs
      let documentIds: number[] = [];
      if (files.length > 0) {
        const uploaded = await Promise.all(
          files.map(async (file) => {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("companyType", "company");
            fd.append("companyId", String(companyId));
            const res = await apiRequest(endPoints.ibpFileUpload, {
              method: "POST",
              data: fd,
              headers: { "Content-Type": "multipart/form-data" },
            });
            const d = res?.data?.data || res?.data || res;
            return d?.id as number | undefined;
          }),
        );
        documentIds = uploaded.filter(Boolean) as number[];
      }

      // Create ticket
      const res = await apiRequest(endPoints.createRaiseTicket(selectedEmployee.employeeId), {
        method: "POST",
        data: {
          category: category.toLowerCase(),
          mailId: resolvedMailId,
          escalationDescription: description.trim(),
          documentIds,
        },
      });

      const t = res?.data?.data || res?.data;
      if (t?.ticketId) {
        // Fire confirmation email (non-blocking)
        if (hrEmail) {
          apiRequest(endPoints.supportTicketConfirmation, {
            method: "POST",
            data: {
              employeeId: selectedEmployee.employeeId,
              ticketId: t.ticketId,
              category,
              ...(description.trim() ? { description: description.trim() } : {}),
              ...(documentIds.length > 0 ? { documentIds } : {}),
            },
          }).catch(() => {});
        }

        // Activity log (non-blocking)
        apiRequest(endPoints.getActivityLogs, {
          method: "POST",
          data: {
            activityKey: "TICKET_RAISED",
            activityCategory: "SUPPORT",
            referenceId: t.id || t.ticketId,
            referenceType: "TICKET",
            metadata: {
              ticketId: t.ticketId,
              category,
              status: t.status,
              activityText: `Support ticket raised by HR - ${t.ticketId} (${category})`,
              ticketCategory: category,
            },
          },
        }).catch(() => {});

        dispatch(setToastMessage(`Ticket ${t.ticketId} raised on behalf of ${selectedEmployee.fullName ?? selectedEmployee.employeeName}.`));
        onRaiseSuccess();
        onBack();
      } else throw new Error("no ticketId");
    } catch {
      dispatch(setToastMessage("Failed to raise ticket. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = !!selectedEmployee && !!category && description.trim().length > 0;

  return (
    <Box sx={{ px: 4, py: 3 }}>
      <Box sx={{ maxWidth: 1120, display: "flex", flexDirection: "column", gap: 3 }}>

        {/* Two-column layout: form fields LEFT, upload RIGHT */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, alignItems: "stretch" }}>

        {/* LEFT column — Employee + Ticket details */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>

        {/* Employee search */}
        <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Employee <Box component="span" sx={{ color: "#EF4444" }}>*</Box></Typography>
          <Box ref={dropdownRef} sx={{ position: "relative" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, height: 42, borderRadius: "10px", border: `1px solid ${selectedEmployee ? "#1C57B8" : "#E5E7EB"}`, bgcolor: selectedEmployee ? "#F0F6FF" : "#fff", "&:focus-within": { borderColor: "#1C57B8" } }}>
              <User size={15} color={selectedEmployee ? "#1C57B8" : "#9CA3AF"} />
              <Box component="input" value={employeeSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setEmployeeSearch(e.target.value); setShowDropdown(true); setSelectedEmployee(null); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search employee by name or ID…"
                sx={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, color: "#374151", fontFamily: "inherit" }} />
              {selectedEmployee && <Box onClick={clearEmployee} sx={{ cursor: "pointer", display: "flex" }}><X size={14} color="#9CA3AF" /></Box>}
            </Box>
            {showDropdown && debouncedSearch.length >= 2 && (
              <Box sx={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, bgcolor: "#fff", border: "1px solid #E5E7EB", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", height: "300px", overflowY: "scroll" }}>
                {empLoading ? (
                  <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Loader2 size={16} color="#9CA3AF" style={{ animation: "spin 1s linear infinite" }} />
                    <Typography sx={{ ml: 1, fontSize: 14, color: "#9CA3AF" }}>Searching…</Typography>
                  </Box>
                ) : filteredEmployees.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: "center" }}>
                    <Typography sx={{ fontSize: 14, color: "#9CA3AF" }}>No employees found</Typography>
                  </Box>
                ) : filteredEmployees.map((emp) => {
                  const displayName = emp.fullName ?? emp.employeeName;
                  return (
                    <Box key={emp.employeeId} onClick={() => selectEmployee(emp)}
                      sx={{ display: "flex", alignItems: "center", gap: 2, px: 2.5, py: 1.5, cursor: "pointer", "&:hover": { bgcolor: "#F0F6FF" }, borderBottom: "1px solid #F3F4F6", "&:last-child": { borderBottom: "none" } }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "#EBF3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1C57B8" }}>{displayName.charAt(0)}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{displayName}</Typography>
                        <Typography sx={{ fontSize: 13, color: "#6B7280" }}>{emp.companyEmployeeId}</Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
          {selectedEmployee && (
            <Box sx={{ display: "flex", gap: 3, p: 2, bgcolor: "#F0F6FF", borderRadius: "8px", border: "1px solid #DBEAFE" }}>
              {[["Employee ID", selectedEmployee.companyEmployeeId], ["Name", selectedEmployee.fullName ?? selectedEmployee.employeeName]].map(([l, v]) => (
                <Box key={l}>
                  <Typography sx={{ fontSize: 15, color: "#6B7280" }}>{l}</Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#1C57B8" }}>{v}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Ticket details */}
        <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Category <Box component="span" sx={{ color: "#EF4444" }}>*</Box></Typography>
            <Box component="select" value={category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
              sx={{ height: 42, borderRadius: "10px", border: `1px solid ${category ? "#1C57B8" : "#E5E7EB"}`, bgcolor: category ? "#F0F6FF" : "#fff", px: 1.5, fontSize: 15, color: category ? "#1C57B8" : "#9CA3AF", fontFamily: "inherit", outline: "none", cursor: "pointer", appearance: "none", pr: "32px", fontWeight: category ? 600 : 400, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
              <option value="" disabled>Select category</option>
              <option value="billing">Billing</option>
              <option value="claims">Claims</option>
              <option value="policy">Policy</option>
              <option value="enrollment">Enrolment</option>
              <option value="other">Other</option>
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Description <Box component="span" sx={{ color: "#EF4444" }}>*</Box></Typography>
            <Box component="textarea" value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Describe the issue or request in detail…"
              rows={5}
              sx={{ borderRadius: "10px", border: `1px solid ${description ? "#1C57B8" : "#E5E7EB"}`, p: 1.5, fontSize: 15, color: "#374151", fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.7 }} />
            <Typography sx={{ fontSize: 15, color: "#9CA3AF", textAlign: "right" }}>{description.length} chars</Typography>
          </Box>
        </Box>

        </Box>
        {/* RIGHT column — Attachments (stretches to match left stack) */}
        <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", p: 3, display: "flex", flexDirection: "column", gap: 1.5, height: "100%" }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>
            Attach Documents <Box component="span" sx={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</Box>
          </Typography>

          <input ref={fileInputRef} type="file" multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            style={{ display: "none" }}
            onChange={(e) => onAddFiles(e.target.files)} />

          <Box onClick={() => fileInputRef.current?.click()}
            sx={{ flex: 1, minHeight: 180, border: "1.5px dashed #D1D5DB", borderRadius: "10px", py: 3, px: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.75, cursor: "pointer", bgcolor: "#FAFBFC", "&:hover": { borderColor: "#1C57B8", bgcolor: "#F0F6FF" }, transition: "all 0.12s" }}>
            <UploadCloud size={24} color="#9CA3AF" />
            <Typography sx={{ fontSize: 15, color: "#374151", fontWeight: 600 }}>Click to upload</Typography>
            <Typography sx={{ fontSize: 15, color: "#9CA3AF" }}>PDF, JPG, PNG, DOC</Typography>
          </Box>

          {files.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 0.5 }}>
              {files.map((file, idx) => (
                <Box key={`${file.name}-${idx}`}
                  sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2, py: 1.25, borderRadius: "8px", bgcolor: "#F0F6FF", border: "1px solid #DBEAFE" }}>
                  <FileText size={15} color="#1C57B8" />
                  <Typography sx={{ fontSize: 15, color: "#1C57B8", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.name}
                  </Typography>
                  <Typography sx={{ fontSize: 15, color: "#6B7280", flexShrink: 0 }}>{fmtSize(file.size)}</Typography>
                  <Box onClick={() => removeFile(idx)} sx={{ cursor: "pointer", display: "flex", flexShrink: 0, "&:hover": { color: "#DC2626" } }}>
                    <X size={14} color="#6B7280" />
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        </Box>
        {/* Actions */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
          <Box onClick={onBack} sx={{ height: 38, px: 2.5, display: "flex", alignItems: "center", borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: 15, fontWeight: 600, color: "#374151", cursor: "pointer", "&:hover": { bgcolor: "#F9FAFB" } }}>
            Cancel
          </Box>
          <Box onClick={isValid && !submitting ? handleSubmit : undefined}
            sx={{ height: 38, px: 3, display: "flex", alignItems: "center", gap: 1, borderRadius: "10px", fontSize: 15, fontWeight: 600, bgcolor: isValid && !submitting ? "#184C97" : "#E5E7EB", color: isValid && !submitting ? "#fff" : "#9CA3AF", cursor: isValid && !submitting ? "pointer" : "not-allowed", "&:hover": isValid && !submitting ? { bgcolor: "#143F7D" } : {} }}>
            {submitting && <Loader2 size={14} />}
            Raise Ticket
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HRPortalComplaints({ companyId: companyIdProp }: { companyId?: number | null } = {}) {
  const companyId = companyIdProp ?? getCompanyId() ?? 0;
  const [view, setView] = useState<"list" | "raise">("list");

  // Draft: what's currently in the filter panel
  const [draft, setDraft]         = useState<TicketDraft>(BLANK);
  // Applied: snapshot committed when Run is clicked
  const [applied, setApplied]     = useState<TicketDraft | null>(null);
  const [hasRun, setHasRun]       = useState(false);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [page, setPage]               = useState(1);
  const [statusDialogTicket, setStatusDialogTicket] = useState<HRTicket | null>(null);

  const setPatch = (patch: Partial<TicketDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const runFilter   = () => { setApplied(draft); setHasRun(true); setPage(1); setExpandedIds(new Set()); };
  const resetFilter = () => { setDraft(BLANK); setApplied(null); setHasRun(false); setPage(1); setExpandedIds(new Set()); };

  const { data: rawTickets, total: ticketTotal, isLoading: ticketsLoading, refetch: refetchTickets } =
    useHRReport<LiveTicket>(
      "hr_support_tickets",
      {
        companyId,
        status:      applied?.status    || "",
        category:    applied?.category  || "",
        search:   applied?.searchText || "",
        raisedBy: applied?.raisedBy ? applied.raisedBy.toUpperCase() : "",
      },
      hasRun && !!companyId,
      { page, limit: ITEMS_PER_PAGE },
    );

  const tickets: HRTicket[] = rawTickets.map(toHRTicket);

  const toggleExpand = (id: number) =>
    setExpandedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const draftActiveCount = Object.values(draft).filter(Boolean).length;

  // Server handles filtering + pagination — use API data directly
  const totalPages = Math.ceil((ticketTotal ?? 0) / ITEMS_PER_PAGE);
  const pageSlice  = tickets;

  const stats = [
    { label: "Total Tickets", value: ticketTotal ?? 0,                                                icon: <Ticket size={16} color="#1C57B8" />,       bg: "#EBF3FF", color: "#1C57B8" },
    { label: "Open",          value: tickets.filter((t) => t.status === "open").length,               icon: <AlertCircle size={16} color="#D97706" />,   bg: "#FFF7ED", color: "#D97706" },
    { label: "In Progress",   value: tickets.filter((t) => t.status === "in_progress").length,        icon: <Clock size={16} color="#7C3AED" />,          bg: "#F5F3FF", color: "#7C3AED" },
    { label: "Resolved",      value: tickets.filter((t) => t.status === "resolved").length,           icon: <CheckCircle2 size={16} color="#059669" />,   bg: "#ECFDF5", color: "#059669" },
  ];

  const TABLE_COLS = [180, 100, 110, 120, 100, 90, 100, 110, 65, 48];
  const TABLE_HEADS = ["Employee", "Emp ID", "Dept", "Ticket ID", "Category", "Raised By", "Date", "Status", "TAT", ""];

  const pageNums = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const ps: (number | "…")[] = [1];
    if (page > 3) ps.push("…");
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) ps.push(p);
    if (page < totalPages - 2) ps.push("…");
    ps.push(totalPages);
    return ps;
  }, [totalPages, page]);

  return (
    <Box sx={{ mx: -3, mt: -0.5, background: "#EBF6FF", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <Box sx={{ position: "sticky", top: 0, zIndex: 0, background: "#EBF6FF", flexShrink: 0 }}>
        <PortalHeroHeader
          title={view === "raise" ? "Raise New Ticket" : "Support Tickets"}
          subtitle={view === "raise" ? "Select an employee and fill in the ticket details" : "View and manage support tickets raised by employees"}
          onBack={view === "raise" ? () => setView("list") : undefined}
          action={
            view === "raise" ? null : (
              <PortalActionButton label="Raise New Ticket" icon={<Plus size={14} />} onClick={() => setView("raise")} />
            )
          }
        />
      </Box>

      {/* ── Raise Ticket view ── */}
      {view === "raise" && (
        <RaiseTicketView
          onBack={() => setView("list")}
          companyId={companyId}
          onRaiseSuccess={() => { refetchTickets(); setView("list"); }}
        />
      )}

      {/* ── List view ── */}
      {view === "list" && (
        <Box sx={{ px: 4, py: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>

          {/* Stats */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
            {stats.map(({ label, value, icon, bg, color }) => (
              <Box key={label} sx={{ p: 3, borderRadius: "14px", bgcolor: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</Box>
                <Box>
                  <Typography sx={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</Typography>
                  <Typography sx={{ fontSize: 15, color: "#9CA3AF", fontWeight: 500, mt: 0.75 }}>{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* ── Search + Filter panel (Claim Search style) ── */}
          <Box sx={{ bgcolor: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB" }}>
            {/* Header */}
            <Box sx={{ px: 3, pt: 2.5, pb: 0 }}>
              <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.01em", fontWeight: 700, color: "#111827" }}>
                Ticket Search
              </Typography>
            </Box>

            {/* Panel */}
            <Box sx={{ bgcolor: "#F3F4F6", borderRadius: "10px", m: 2.5, p: 2.5 }}>

              {/* Search bar */}
              <Box sx={{ position: "relative", mb: 2 }}>
                <Box sx={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}>
                  <Search size={16} color="#9CA3AF" />
                </Box>
                <input
                  value={draft.searchText}
                  onChange={(e) => setPatch({ searchText: e.target.value })}
                  placeholder="Search by Ticket ID, Employee Name, Employee ID, or Description…"
                  style={{ width: "100%", height: 42, borderRadius: 10, border: "1px solid #D1D5DB", background: "#fff", padding: "0 16px 0 40px", fontSize: 15, fontFamily: "inherit", color: "#111827", outline: "none", boxSizing: "border-box", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                />
              </Box>

              {/* 3-group filter grid */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1.35fr 0.75fr", gap: 2, mb: 2 }}>

                {/* Group 1: Category + Raised By + Department */}
                <Box sx={{ bgcolor: "#fff", border: "1px solid #E5E7EB", borderRadius: "10px", p: 1.75, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <PillGroup label="Category" value={draft.category} onChange={(v) => setPatch({ category: v })}
                    options={[
                      { label: "Any", val: "" }, { label: "Billing", val: "billing" },
                      { label: "Claims", val: "claims" }, { label: "Policy", val: "policy" },
                      { label: "Enrolment", val: "enrollment" }, { label: "Other", val: "other" },
                    ]} />
                  <Box sx={{ height: "1px", bgcolor: "#F3F4F6" }} />
                  <PillGroup label="Raised By" value={draft.raisedBy} onChange={(v) => setPatch({ raisedBy: v })}
                    options={[{ label: "Any", val: "" }, { label: "Employee", val: "employee" }, { label: "HR", val: "hr" }, { label: "CRM", val: "crm" }]} />
                </Box>

                {/* Group 2: Raised Date + Last Updated Date */}
                <Box sx={{ bgcolor: "#fff", border: "1px solid #E5E7EB", borderRadius: "10px", p: 1.75, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <DateRangePair label="Raised Date"
                    from={draft.raisedFrom} to={draft.raisedTo}
                    onFrom={(v) => setPatch({ raisedFrom: v })} onTo={(v) => setPatch({ raisedTo: v })} />
                  <Box sx={{ height: "1px", bgcolor: "#F3F4F6" }} />
                  <DateRangePair label="Last Updated"
                    from={draft.updatedFrom} to={draft.updatedTo}
                    onFrom={(v) => setPatch({ updatedFrom: v })} onTo={(v) => setPatch({ updatedTo: v })} />
                </Box>

                {/* Group 3: Status (vertical, like TAT) */}
                <Box sx={{ bgcolor: "#fff", border: "1px solid #E5E7EB", borderRadius: "10px", p: 1.75 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.75 }}>Status</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {[
                      { label: "Any",         val: "" },
                      { label: "Open",        val: "open" },
                      { label: "In Progress", val: "in_progress" },
                      { label: "Resolved",    val: "resolved" },
                      { label: "Closed",      val: "closed" },
                    ].map(({ label, val }) => {
                      const active = draft.status === val;
                      return (
                        <Box key={label} onClick={() => setPatch({ status: val })}
                          sx={{ height: 30, px: 1.5, borderRadius: "6px", cursor: "pointer", border: active ? "1.5px solid #1C57B8" : "1.5px solid #E5E7EB", bgcolor: active ? "#EBF3FF" : "#F9FAFB", color: active ? "#1C57B8" : "#6B7280", fontSize: 13, fontWeight: active ? 700 : 500, display: "flex", alignItems: "center", userSelect: "none", transition: "all 0.12s" }}>
                          {label}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

              </Box>

              {/* Active chips + Reset + Run */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 2, borderTop: "1px solid #E0E0E0" }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, flex: 1, minWidth: 0 }}>
                  {draftActiveCount === 0 ? (
                    <Typography sx={{ fontSize: 15, color: "#9CA3AF" }}>No filters active</Typography>
                  ) : (
                    (Object.entries(draft) as [keyof TicketDraft, string][])
                      .filter(([, v]) => Boolean(v))
                      .map(([k, v]) => (
                        <Box key={k} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.25, borderRadius: "20px", bgcolor: "#EBF3FF", border: "1px solid #BFDBFE" }}>
                          <Typography sx={{ fontSize: 15, color: "#1C57B8", fontWeight: 600, whiteSpace: "nowrap" }}>
                            {CHIP_LABELS[k]}: {v}
                          </Typography>
                          <Box onClick={() => setPatch({ [k]: "" } as Partial<TicketDraft>)} sx={{ cursor: "pointer", display: "flex", ml: 0.25 }}>
                            <X size={11} color="#1C57B8" />
                          </Box>
                        </Box>
                      ))
                  )}
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexShrink: 0, ml: 2 }}>
                  <Box onClick={resetFilter}
                    sx={{ px: 2, height: 36, borderRadius: "8px", border: "1px solid #E5E7EB", bgcolor: "#fff", display: "flex", alignItems: "center", gap: 0.75, cursor: "pointer", "&:hover": { bgcolor: "#F3F4F6" }, transition: "background 0.12s" }}>
                    <RotateCcw size={13} color="#374151" />
                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Reset</Typography>
                  </Box>
                  <Box onClick={runFilter}
                    sx={{ px: 2.5, height: 36, borderRadius: "8px", bgcolor: "#1C57B8", display: "flex", alignItems: "center", gap: 0.75, cursor: "pointer", "&:hover": { bgcolor: "#143F7D" }, transition: "background 0.12s" }}>
                    <Play size={13} color="#fff" />
                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Run</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* ── Table / empty state ── */}
            {!hasRun ? (
              <Box sx={{ px: 3, py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <SlidersHorizontal size={24} color="#9CA3AF" />
                </Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Set filters and click Run to load tickets</Typography>
              </Box>
            ) : ticketsLoading ? (
              <Box sx={{ px: 3, py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Loader2 size={28} color="#1C57B8" style={{ animation: "spin 1s linear infinite" }} />
                <Typography sx={{ fontSize: 15, color: "#6B7280" }}>Loading tickets…</Typography>
              </Box>
            ) : tickets.length === 0 ? (
              <Box sx={{ px: 3, py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ticket size={24} color="#9CA3AF" />
                </Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>No tickets match the selected filters</Typography>
              </Box>
            ) : (
              <>
                {/* Result count */}
                <Box sx={{ px: 3, pb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: 15, color: "#6B7280" }}>
                    Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, ticketTotal ?? tickets.length)} of {ticketTotal ?? tickets.length} ticket{(ticketTotal ?? tickets.length) !== 1 ? "s" : ""}
                  </Typography>
                </Box>

                {/* Table — horizontal scroll only on the table itself */}
                <Box sx={{ overflowX: "auto" }}>
                  <Box sx={{ minWidth: TABLE_COLS.reduce((a, b) => a + b, 0) }}>

                    {/* Fixed header */}
                    <Box component="table" sx={{ width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, fontSize: 15, lineHeight: 1.7 }}>
                      <Box component="colgroup">
                        {TABLE_COLS.map((w, i) => <Box key={i} component="col" sx={{ width: w }} />)}
                      </Box>
                      <Box component="thead">
                        <Box component="tr" sx={{ bgcolor: "#4B6B8A" }}>
                          {TABLE_HEADS.map((h, hi) => (
                            <Box component="th" key={hi}
                              sx={{ px: 2, py: 1.5, textAlign: "left", fontSize: 15, fontWeight: 600, color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap", bgcolor: "#4B6B8A" }}>
                              {h}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Box>

                    {/* Body — hugs content, no inner scroll */}
                    <Box>
                      <Box component="table" sx={{ width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, fontSize: 15, lineHeight: 1.7 }}>
                        <Box component="colgroup">
                          {TABLE_COLS.map((w, i) => <Box key={i} component="col" sx={{ width: w }} />)}
                        </Box>
                        <Box component="tbody">
                          {pageSlice.map((ticket, rowIdx) => {
                            const isExpanded = expandedIds.has(ticket.id);
                            const tat = calcTat(ticket);
                            const ts  = tatStyle(tat);
                            const isLast = rowIdx === pageSlice.length - 1;
                            return (
                              <React.Fragment key={ticket.id}>
                                <Box component="tr"
                                  onClick={() => toggleExpand(ticket.id)}
                                  sx={{ cursor: "pointer", bgcolor: isExpanded ? "#F0F6FF" : "transparent", "&:hover": { bgcolor: isExpanded ? "#EBF3FF" : "#F9FAFB" }, transition: "background 0.12s" }}>

                                  {/* Employee */}
                                  <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: !isLast || isExpanded ? "1px solid #F3F4F6" : "none", verticalAlign: "middle" }}>
                                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{ticket.employeeName}</Typography>
                                  </Box>
                                  <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: !isLast || isExpanded ? "1px solid #F3F4F6" : "none", verticalAlign: "middle" }}>
                                    <Typography sx={{ fontSize: 15, color: "#6B7280" }}>{ticket.companyEmployeeId ?? "--"}</Typography>
                                  </Box>
                                  <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: !isLast || isExpanded ? "1px solid #F3F4F6" : "none", verticalAlign: "middle" }}>
                                    <Typography sx={{ fontSize: 15, color: "#374151" }}>{ticket.department}</Typography>
                                  </Box>
                                  <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: !isLast || isExpanded ? "1px solid #F3F4F6" : "none", verticalAlign: "middle" }}>
                                    <Typography sx={{ fontSize: 15, fontWeight: 500, color: "#374151" }}>{ticket.ticketId}</Typography>
                                  </Box>
                                  <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: !isLast || isExpanded ? "1px solid #F3F4F6" : "none", verticalAlign: "middle" }}>
                                    <Typography sx={{ fontSize: 15, color: "#374151" }}>{CATEGORY_LABELS[ticket.category] ?? cap(ticket.category)}</Typography>
                                  </Box>
                                  <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: !isLast || isExpanded ? "1px solid #F3F4F6" : "none", verticalAlign: "middle" }}>
                                    <Typography sx={{ fontSize: 15, color: ticket.raisedBy === "hr" ? "#7C3AED" : ticket.raisedBy === "crm" ? "#2563EB" : "#6B7280", fontWeight: ticket.raisedBy === "hr" || ticket.raisedBy === "crm" ? 600 : 400 }}>
                                      {ticket.raisedBy === "hr" ? "HR" : ticket.raisedBy === "crm" ? "CRM" : "Employee"}
                                    </Typography>
                                  </Box>
                                  <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: !isLast || isExpanded ? "1px solid #F3F4F6" : "none", verticalAlign: "middle" }}>
                                    <Typography sx={{ fontSize: 15, color: "#6B7280" }}>{fmt(ticket.createdAt)}</Typography>
                                  </Box>
                                  <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: !isLast || isExpanded ? "1px solid #F3F4F6" : "none", verticalAlign: "middle" }}>
                                    <StatusDot status={ticket.status} />
                                  </Box>
                                  {/* TAT chip */}
                                  <Box component="td" sx={{ px: 2, py: 1.5, borderBottom: !isLast || isExpanded ? "1px solid #F3F4F6" : "none", verticalAlign: "middle" }}>
                                    <Box sx={{ display: "inline-flex", px: 1.25, py: 0.25, borderRadius: "6px", bgcolor: ts.bg }}>
                                      <Typography sx={{ fontSize: 15, fontWeight: 600, color: ts.color }}>{ts.label}</Typography>
                                    </Box>
                                  </Box>
                                  {/* Expand chevron */}
                                  <Box component="td" sx={{ px: 1, py: 1.5, borderBottom: !isLast || isExpanded ? "1px solid #F3F4F6" : "none", verticalAlign: "middle", textAlign: "center" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "none" }}>
                                      <ChevronRight size={16} color="#9CA3AF" />
                                    </Box>
                                  </Box>
                                </Box>

                                {/* Expanded detail row */}
                                <Box component="tr">
                                  <Box component="td" colSpan={TABLE_COLS.length}
                                    sx={{ p: 0, borderBottom: isExpanded && !isLast ? "1px solid #E5E7EB" : "none" }}>
                                    <Collapse in={isExpanded} timeout={220} unmountOnExit>
                                      <TicketDetailPanel ticket={ticket} onChangeStatus={() => setStatusDialogTicket(ticket)} />
                                    </Collapse>
                                  </Box>
                                </Box>
                              </React.Fragment>
                            );
                          })}
                        </Box>
                      </Box>
                    </Box>

                  </Box>
                </Box>

                {/* Pagination — outside horizontal scroll so it stays full-width and wraps cleanly */}
                {totalPages > 1 && (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderTop: "1px solid #F3F4F6", flexWrap: "wrap", gap: 1.5, borderRadius: "0 0 14px 14px" }}>
                    <Typography sx={{ fontSize: 15, color: "#9CA3AF" }}>
                      Page {page} of {totalPages}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                      {[
                        { label: "‹", disabled: page === 1, act: () => setPage((p) => p - 1) },
                        ...pageNums.map((p) => ({ label: String(p), disabled: p === "…", act: p !== "…" ? () => setPage(p as number) : undefined, active: p === page })),
                        { label: "›", disabled: page === totalPages, act: () => setPage((p) => p + 1) },
                      ].map((btn, i) => (
                        <Box key={i} onClick={!btn.disabled && btn.act ? btn.act : undefined}
                          sx={{ minWidth: 36, height: 36, px: 1, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: (btn as { active?: boolean }).active ? "1.5px solid #1C57B8" : "1px solid #E5E7EB", bgcolor: (btn as { active?: boolean }).active ? "#EBF3FF" : "#fff", color: (btn as { active?: boolean }).active ? "#1C57B8" : btn.disabled ? "#D1D5DB" : "#374151", fontSize: 15, fontWeight: (btn as { active?: boolean }).active ? 700 : 500, cursor: btn.disabled ? "default" : "pointer", "&:hover": !(btn as { active?: boolean }).active && !btn.disabled ? { bgcolor: "#F3F4F6" } : {} }}>
                          {btn.label}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>

        </Box>
      )}

      {statusDialogTicket && (
        <ChangeStatusDialog
          ticket={statusDialogTicket}
          onClose={() => setStatusDialogTicket(null)}
          onSuccess={() => { refetchTickets(); setStatusDialogTicket(null); }}
        />
      )}
    </Box>
  );
}

export default HRPortalComplaints;
