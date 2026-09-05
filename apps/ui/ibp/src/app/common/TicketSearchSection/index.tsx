import React, { useEffect, useMemo, useState } from "react";
import { CircularProgress } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { apiRequest, endPoints } from "@ui/ui-lib";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SupportSectionHeader from "../SupportSectionHeader";
import SearchHeaderIcon from "../../../assets/svgs/support-search-icon.svg";
import {
  SearchSectionContainer,
  SearchInputWrapper,
  SearchInput,
  SearchIconWrapper,
  FilterRow,
  FilterLabel,
  ChipsRow,
  FilterChip,
  TicketsListWrapper,
  CompactTicketCard,
  CompactRow,
  CompactRowTop,
  CompactRowBottom,
  TicketIdText,
  CompactMetaText,
  CompactDate,
  StatusBadge,
  EmptyStateWrapper,
  EmptyStateText,
  ResultsCountText,
  PaginationBar,
  PaginationInfo,
  PageButtonsRow,
  PageBtn,
  DetailPanelContainer,
  DetailPanelHeader,
  DetailPanelHeaderLeft,
  DetailTicketId,
  DetailCategoryTag,
  BackButton,
  DetailPanelBody,
  DetailMetaGrid,
  DetailMetaItem,
  DetailMetaLabel,
  DetailMetaValue,
  DetailSectionLabel,
  DetailDescriptionBox,
  DetailDescriptionText,
  DetailDivider,
  NoTicketSelected,
  NoTicketIcon,
  NoTicketText,
  DocumentsRow,
  DocumentChip,
  DocumentName,
} from "./styles";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TicketDocument {
  documentId?: string;
  fileName?: string;
  name?: string;
  url?: string;
}

export interface Ticket {
  id?: string | number;
  ticketId?: string;
  category?: string;
  status?: string;
  mailId?: string;
  escalationDescription?: string;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  raisedDaysAgo?: number;
  daysToClose?: number | null;
  documents?: TicketDocument[];
  documentIds?: string[];
  [key: string]: unknown;
}

interface TicketSearchSectionProps {
  tickets: Ticket[];
  loading?: boolean;
  selectedTicketId?: string | number | null;
  onTicketSelect?: (ticket: Ticket | null) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const CATEGORY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "billing", label: "Billing" },
  { value: "claims", label: "Claims" },
  { value: "policy", label: "Policy" },
  { value: "enrollment", label: "Enrolment" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  open:        { color: "#3EA0F1", bg: "#EBF5FF", label: "Open" },
  in_progress: { color: "#F59E0B", bg: "#FFFBEB", label: "In Progress" },
  inprogress:  { color: "#F59E0B", bg: "#FFFBEB", label: "In Progress" },
  resolved:    { color: "#10B981", bg: "#ECFDF5", label: "Resolved" },
  closed:      { color: "#9CA3AF", bg: "#F3F4F6", label: "Closed" },
};

// ─── Demo data (dev only) ─────────────────────────────────────────────────────

const DEMO_TICKETS: Ticket[] = [
  {
    id: 1, ticketId: "TKT-20260001", category: "billing", status: "open",
    mailId: "srilatha.emp01@mailinator.com",
    escalationDescription: "I noticed a duplicate deduction of ₹3,240 from my April salary under 'Group Health Premium'. The payslip shows two entries for the same policy on 5th April and 6th April. Requesting a refund and a corrected payslip at the earliest.",
    createdAt: "2026-05-10T09:30:00Z", updatedAt: "2026-05-10T09:30:00Z",
    documents: [
      { documentId: "d1", fileName: "april_payslip.pdf" },
      { documentId: "d2", fileName: "bank_statement_april.pdf" },
    ],
  },
  {
    id: 2, ticketId: "TKT-20260002", category: "claims", status: "in_progress",
    mailId: "srilatha.emp01@mailinator.com",
    escalationDescription: "My cashless hospitalisation claim (Claim Ref: CLM-8821) at Apollo Hospitals, Hyderabad was submitted on 3rd May 2026 for a total of ₹78,500. It has been over 12 days with no status update on the portal. The discharge summary and all reports have already been uploaded. Please expedite the review.",
    createdAt: "2026-05-03T14:15:00Z", updatedAt: "2026-05-15T10:00:00Z",
    documents: [
      { documentId: "d3", fileName: "discharge_summary.pdf" },
      { documentId: "d4", fileName: "hospital_bill.pdf" },
      { documentId: "d5", fileName: "lab_reports.pdf" },
    ],
  },
  {
    id: 3, ticketId: "TKT-20260003", category: "policy", status: "resolved",
    mailId: "srilatha.emp01@mailinator.com",
    escalationDescription: "Requesting an updated copy of my Group Health Insurance policy document (Policy No. GHI-2024-8801) reflecting the revised sum insured of ₹5,00,000 effective 1st April 2026. The e-card on the portal still shows the old limit of ₹3,00,000.",
    createdAt: "2026-04-28T11:00:00Z", updatedAt: "2026-05-02T16:45:00Z",
    documents: [],
  },
  {
    id: 4, ticketId: "TKT-20260004", category: "enrollment", status: "closed",
    mailId: "srilatha.emp01@mailinator.com",
    escalationDescription: "During the open enrollment window (1–10 April), I attempted to add my newborn daughter (DOB: 15 March 2026) as a dependent. The portal accepted the request but did not confirm enrollment via email. I am unable to verify if she has been added to the policy. Please confirm her enrollment status.",
    createdAt: "2026-04-10T08:45:00Z", updatedAt: "2026-04-18T12:00:00Z",
    documents: [
      { documentId: "d6", fileName: "birth_certificate.pdf" },
    ],
  },
  {
    id: 5, ticketId: "TKT-20260005", category: "other", status: "open",
    mailId: "srilatha.emp01@mailinator.com",
    escalationDescription: "I am trying to claim reimbursement for an annual gym membership (₹18,000) under the wellness benefit scheme. The FAQs mention this is eligible, but the reimbursement form does not have an option for 'gym/fitness'. Requesting either a form update or manual processing guidance.",
    createdAt: "2026-05-14T16:20:00Z", updatedAt: "2026-05-14T16:20:00Z",
    documents: [
      { documentId: "d7", fileName: "gym_membership_invoice.pdf" },
      { documentId: "d8", fileName: "payment_receipt.pdf" },
    ],
  },
  {
    id: 6, ticketId: "TKT-20260006", category: "claims", status: "resolved",
    mailId: "srilatha.emp01@mailinator.com",
    escalationDescription: "Submitted a reimbursement claim for outpatient consultation at CARE Hospitals on 20th April 2026 (₹2,800). Claim was initially rejected citing 'incomplete documents'. All required documents including prescription and paid receipt have been resubmitted. Confirming status of reprocessing.",
    createdAt: "2026-04-22T10:30:00Z", updatedAt: "2026-05-05T14:00:00Z",
    documents: [
      { documentId: "d9", fileName: "doctor_prescription.pdf" },
      { documentId: "d10", fileName: "paid_receipt.pdf" },
    ],
  },
  {
    id: 7, ticketId: "TKT-20260007", category: "billing", status: "in_progress",
    mailId: "srilatha.emp01@mailinator.com",
    escalationDescription: "My voluntary top-up cover of ₹5,00,000 (opted in January 2026) has not been reflected in the premium breakdown shown on the portal. The deduction seems correct in the payslip but the portal coverage summary still shows base cover only. This is creating confusion for claim submissions.",
    createdAt: "2026-05-01T09:00:00Z", updatedAt: "2026-05-12T11:30:00Z",
    documents: [],
  },
  {
    id: 8, ticketId: "TKT-20260008", category: "policy", status: "open",
    mailId: "srilatha.emp01@mailinator.com",
    escalationDescription: "My TPA (Medi Assist) card expired on 31st March 2026. The renewal card has not been received either physically or via email as of today. Without a valid TPA card, the network hospital is refusing to initiate the cashless process for a planned surgery next week.",
    createdAt: "2026-05-13T07:50:00Z", updatedAt: "2026-05-13T07:50:00Z",
    documents: [
      { documentId: "d11", fileName: "expired_tpa_card_scan.pdf" },
    ],
  },
  {
    id: 9, ticketId: "TKT-20260009", category: "enrollment", status: "resolved",
    mailId: "srilatha.emp01@mailinator.com",
    escalationDescription: "Raised a request to add my father (age 62, diabetic) as a dependent under the parental coverage scheme on 5th March. HR confirmed eligibility but the insurer is asking for additional medical history documents not listed in the employee handbook. Need clarity on exact requirements.",
    createdAt: "2026-03-05T13:00:00Z", updatedAt: "2026-03-20T15:30:00Z",
    documents: [
      { documentId: "d12", fileName: "father_medical_history.pdf" },
      { documentId: "d13", fileName: "hr_approval_email.pdf" },
    ],
  },
  {
    id: 10, ticketId: "TKT-20260010", category: "claims", status: "closed",
    mailId: "srilatha.emp01@mailinator.com",
    escalationDescription: "Pre-authorisation for a planned knee surgery (ACL reconstruction) at Yashoda Hospital was denied citing 'waiting period not complete'. However, I have been on the group policy for 3 years. Requesting manual review and reconsideration of the pre-auth denial.",
    createdAt: "2026-02-18T11:15:00Z", updatedAt: "2026-03-01T09:45:00Z",
    documents: [
      { documentId: "d14", fileName: "preauth_denial_letter.pdf" },
      { documentId: "d15", fileName: "orthopaedic_report.pdf" },
      { documentId: "d16", fileName: "policy_tenure_proof.pdf" },
    ],
  },
  {
    id: 11, ticketId: "TKT-20260011", category: "other", status: "in_progress",
    mailId: "srilatha.emp01@mailinator.com",
    escalationDescription: "Unable to download my health insurance certificate from the portal for the past 5 days. The page shows a 500 error when clicking 'Download Certificate'. This document is urgently required for a home loan application deadline on 25th May 2026.",
    createdAt: "2026-05-16T08:00:00Z", updatedAt: "2026-05-17T10:00:00Z",
    documents: [],
  },
  {
    id: 12, ticketId: "TKT-20260012", category: "billing", status: "resolved",
    mailId: "srilatha.emp01@mailinator.com",
    escalationDescription: "An excess deduction of ₹1,560 was made in March salary under 'Critical Illness Rider'. I had declined this rider during enrollment in November 2025. Requesting reversal of the deduction and confirmation that the rider has been removed from my policy.",
    createdAt: "2026-03-10T14:00:00Z", updatedAt: "2026-03-22T16:00:00Z",
    documents: [
      { documentId: "d17", fileName: "enrollment_form_nov2025.pdf" },
      { documentId: "d18", fileName: "march_payslip.pdf" },
    ],
  },
  {
    id: 13, ticketId: "TKT-20260013", category: "policy", status: "in_progress",
    mailId: "srilatha.emp01@mailinator.com",
    escalationDescription: "After my promotion in April 2026, my grade changed from L4 to L5. The HR system was updated, but my insurance coverage has not been upgraded to the L5 bracket (₹7,00,000 sum insured vs current ₹5,00,000). Requesting an endorsement update on the policy.",
    createdAt: "2026-04-30T10:00:00Z", updatedAt: "2026-05-08T14:30:00Z",
    documents: [
      { documentId: "d19", fileName: "promotion_letter.pdf" },
    ],
  },
  {
    id: 14, ticketId: "TKT-20260014", category: "enrollment", status: "open",
    mailId: "srilatha.emp01@mailinator.com",
    escalationDescription: "My wife's name is misspelled on the group policy (shows 'Priyaa' instead of 'Priya'). This has caused the TPA to reject her cashless treatment request at a network hospital. Requesting an urgent endorsement to correct the name and reissue the TPA card.",
    createdAt: "2026-05-17T15:30:00Z", updatedAt: "2026-05-17T15:30:00Z",
    documents: [
      { documentId: "d20", fileName: "marriage_certificate.pdf" },
      { documentId: "d21", fileName: "aadhar_copy.pdf" },
      { documentId: "d22", fileName: "tpa_rejection_letter.pdf" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calendarDayDiff = (laterStr: string, earlierStr: string): number => {
  const later = new Date(laterStr);
  const earlier = new Date(earlierStr);
  const a = new Date(later.getFullYear(), later.getMonth(), later.getDate()).getTime();
  const b = new Date(earlier.getFullYear(), earlier.getMonth(), earlier.getDate()).getTime();
  return Math.round((a - b) / 86400000);
};

const computeTAT = (ticket: Ticket): { raisedDaysAgo: number; daysToClose: number | null } => {
  if (ticket.raisedDaysAgo != null) {
    return { raisedDaysAgo: ticket.raisedDaysAgo, daysToClose: ticket.daysToClose ?? null };
  }
  const now = new Date();
  const todayStr = now.toISOString();
  const createdStr = ticket.createdAt || todayStr;
  const raisedDaysAgo = calendarDayDiff(todayStr, createdStr);
  const isClosedOrResolved = ["resolved", "closed"].includes((ticket.status || "").toLowerCase());
  const closedStr = ticket.resolvedAt
    ? ticket.resolvedAt
    : isClosedOrResolved && ticket.updatedAt
    ? ticket.updatedAt
    : null;
  const daysToClose = closedStr != null ? calendarDayDiff(closedStr, createdStr) : null;
  return { raisedDaysAgo, daysToClose };
};

const getStatusConfig = (status: string) => {
  const key = (status || "").toLowerCase().replace(/[\s-]/g, "_");
  return STATUS_CONFIG[key] || STATUS_CONFIG["open"];
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "--";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "--";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "--";

const getDocumentLabel = (doc: TicketDocument, index: number) =>
  doc.fileName || doc.name || `Document ${index + 1}`;

// ─── Document download ────────────────────────────────────────────────────────

const handleDocumentDownload = async (fileId: number | string) => {
  try {
    const id = Number(fileId);
    const response = await apiRequest(endPoints.ibpFileUploadDownloadById(id), {
      method: "GET",
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = String(id);
    a.click();
    window.URL.revokeObjectURL(url);
  } catch {
    // silent fail
  }
};

// ─── TicketRow (compact, selection-based) ────────────────────────────────────

const TicketRow: React.FC<{
  ticket: Ticket;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ ticket, isSelected, onSelect }) => {
  const statusCfg = getStatusConfig(ticket.status || "open");
  const { raisedDaysAgo, daysToClose } = computeTAT(ticket);

  return (
    <CompactTicketCard statusColor={statusCfg.color} selected={isSelected} onClick={onSelect}>
      <CompactRow>
        <CompactRowTop>
          <TicketIdText>{ticket.ticketId || `#${ticket.id}`}</TicketIdText>
          <CompactMetaText>{capitalize(ticket.category || "")}</CompactMetaText>
        </CompactRowTop>
        <CompactRowBottom>
          <CompactDate>
            {formatDate(ticket.createdAt || "")}
            {daysToClose != null && (
              <span style={{ marginLeft: 6, fontSize: "14px", fontWeight: 500 }}>
                ({daysToClose === 0 ? "same day" : `TAT: ${daysToClose}d`})
              </span>
            )}
            {daysToClose == null && (
              <span style={{ marginLeft: 6, fontSize: "14px", fontWeight: 500, color: raisedDaysAgo > 7 ? "#DC2626" : "#D97706" }}>
                ({raisedDaysAgo === 0 ? "today" : `Age: ${raisedDaysAgo}d`})
              </span>
            )}
          </CompactDate>
          <StatusBadge statusColor={statusCfg.color} bgColor={statusCfg.bg}>
            {statusCfg.label}
          </StatusBadge>
          {isSelected && (
            <CheckCircleIcon sx={{ fontSize: 20, color: "#093F84", flexShrink: 0 }} />
          )}
        </CompactRowBottom>
      </CompactRow>
    </CompactTicketCard>
  );
};

// ─── TicketDetailPanel (exported for use in SupportPage right section) ────────

export const TicketDetailPanel: React.FC<{
  ticket: Ticket | null;
  onClose?: () => void;
}> = ({ ticket, onClose }) => {
  if (!ticket) {
    return (
      <DetailPanelContainer>
        <NoTicketSelected>
          <NoTicketIcon>🎫</NoTicketIcon>
          <NoTicketText>Select a ticket to view details</NoTicketText>
        </NoTicketSelected>
      </DetailPanelContainer>
    );
  }

  const statusCfg = getStatusConfig(ticket.status || "open");
  const { raisedDaysAgo, daysToClose } = computeTAT(ticket);
  const docs = ticket.documents ?? [];
  const docIds = ticket.documentIds ?? [];
  const hasDocuments = docs.length > 0 || docIds.length > 0;

  return (
    <DetailPanelContainer>
      {/* Blue selection stripe at top */}
      <div style={{ height: -10, background: "linear-gradient(90deg, #093F84, #3EA0F1)", borderRadius: "4px 4px 0 0" }} />
      <DetailPanelHeader>
        <DetailPanelHeaderLeft>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircleIcon sx={{ fontSize: 18, color: "#093F84" }} />
            <DetailTicketId>{ticket.ticketId || `#${ticket.id}`}</DetailTicketId>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DetailCategoryTag>{capitalize(ticket.category || "")}</DetailCategoryTag>
            <span style={{
              display: "inline-flex", alignItems: "center",
              padding: "2px 8px", borderRadius: 20,
              background: "#EBF4FF", color: "#093F84",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.03em",
            }}>
              Viewing
            </span>
          </div>
        </DetailPanelHeaderLeft>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <StatusBadge statusColor={statusCfg.color} bgColor={statusCfg.bg}>
            {statusCfg.label}
          </StatusBadge>
          {onClose && (
            <BackButton onClick={onClose} title="Close">
              <CloseIcon sx={{ fontSize: 18 }} />
            </BackButton>
          )}
        </div>
      </DetailPanelHeader>

      <DetailPanelBody>
        <DetailMetaGrid>
          <DetailMetaItem>
            <DetailMetaLabel>Date Raised</DetailMetaLabel>
            <DetailMetaValue>{formatDate(ticket.createdAt || "")}</DetailMetaValue>
          </DetailMetaItem>
          <DetailMetaItem>
            <DetailMetaLabel>Last Updated</DetailMetaLabel>
            <DetailMetaValue>{formatDate(ticket.updatedAt || "")}</DetailMetaValue>
          </DetailMetaItem>
          {ticket.mailId && (
            <DetailMetaItem>
              <DetailMetaLabel>Email</DetailMetaLabel>
              <DetailMetaValue sx={{ wordBreak: "break-all" }}>{ticket.mailId as string}</DetailMetaValue>
            </DetailMetaItem>
          )}
          <DetailMetaItem>
            <DetailMetaLabel>Ticket Age</DetailMetaLabel>
            <DetailMetaValue>
              {raisedDaysAgo === 0 ? "Raised today" : raisedDaysAgo === 1 ? "1 day ago" : `${raisedDaysAgo} days ago`}
            </DetailMetaValue>
          </DetailMetaItem>
          {daysToClose != null && (
            <DetailMetaItem>
              <DetailMetaLabel>Resolved In</DetailMetaLabel>
              <DetailMetaValue>
                {daysToClose === 0 ? "Same day" : daysToClose === 1 ? "1 day" : `${daysToClose} days`}
              </DetailMetaValue>
            </DetailMetaItem>
          )}
        </DetailMetaGrid>

        {ticket.escalationDescription && (
          <div>
            <DetailSectionLabel>Description</DetailSectionLabel>
            <DetailDescriptionBox>
              <DetailDescriptionText>{ticket.escalationDescription as string}</DetailDescriptionText>
            </DetailDescriptionBox>
          </div>
        )}

        {hasDocuments && (
          <div>
            <DetailSectionLabel>Attached Documents</DetailSectionLabel>
            <DocumentsRow>
              {docs.length > 0
                ? docs.map((doc, i) => (
                    <DocumentChip
                      key={doc.documentId ?? i}
                      onClick={() => doc.documentId && handleDocumentDownload(doc.documentId)}
                    >
                      <InsertDriveFileOutlinedIcon sx={{ fontSize: 18, color: "#3EA0F1", flexShrink: 0 }} />
                      <DocumentName>{getDocumentLabel(doc, i)}</DocumentName>
                      <FileDownloadOutlinedIcon sx={{ fontSize: 16, color: "#9CA3AF", flexShrink: 0 }} />
                    </DocumentChip>
                  ))
                : docIds.map((id, i) => (
                    <DocumentChip key={id} onClick={() => handleDocumentDownload(id)}>
                      <InsertDriveFileOutlinedIcon sx={{ fontSize: 18, color: "#3EA0F1", flexShrink: 0 }} />
                      <DocumentName>{`Document ${i + 1}`}</DocumentName>
                      <FileDownloadOutlinedIcon sx={{ fontSize: 16, color: "#9CA3AF", flexShrink: 0 }} />
                    </DocumentChip>
                  ))}
            </DocumentsRow>
          </div>
        )}

        <DetailDivider />
      </DetailPanelBody>
    </DetailPanelContainer>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const TicketSearchSection: React.FC<TicketSearchSectionProps> = ({
  tickets,
  loading = false,
  selectedTicketId,
  onTicketSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const displayTickets =
    tickets.length > 0 ? tickets : import.meta.env.DEV ? DEMO_TICKETS : [];

  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return displayTickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        ticket.ticketId?.toLowerCase().includes(query) ||
        ticket.category?.toLowerCase().includes(query) ||
        (ticket.escalationDescription as string | undefined)?.toLowerCase().includes(query) ||
        ticket.status?.toLowerCase().includes(query) ||
        ticket.mailId?.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "all" ||
        ticket.category?.toLowerCase() === selectedCategory;

      const ticketStatusKey = (ticket.status || "").toLowerCase().replace(/[\s-]/g, "_");
      const matchesStatus =
        selectedStatus === "all" || ticketStatusKey === selectedStatus.replace(/[\s-]/g, "_");

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [displayTickets, searchQuery, selectedCategory, selectedStatus]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus]);

  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const pageStart = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageTickets = filteredTickets.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  const handleSelect = (ticket: Ticket) => {
    const uid = ticket.id ?? ticket.ticketId ?? "";
    if (onTicketSelect) {
      onTicketSelect(uid === selectedTicketId ? null : ticket);
    }
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (currentPage > 3) pages.push("…");
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
      pages.push(p);
    }
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  return (
    <>
      <SupportSectionHeader image={SearchHeaderIcon} text="Search Tickets" />
      <SearchSectionContainer sx={{ mt: 5 }}>

        <SearchInputWrapper>
          <SearchIconWrapper>
            <SearchIcon sx={{ fontSize: 20, opacity: 0.5 }} />
          </SearchIconWrapper>
          <SearchInput
            placeholder="Search by Ticket ID, category, or description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            inputProps={{ "aria-label": "search tickets" }}
          />
          {loading && <CircularProgress size={18} sx={{ color: "#3EA0F1", flexShrink: 0 }} />}
        </SearchInputWrapper>

        <FilterRow>
          <FilterLabel>Category</FilterLabel>
          <ChipsRow>
            {CATEGORY_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                active={selectedCategory === opt.value}
                onClick={() => setSelectedCategory(opt.value)}
                clickable
              />
            ))}
          </ChipsRow>
        </FilterRow>

        <FilterRow>
          <FilterLabel>Status</FilterLabel>
          <ChipsRow>
            {STATUS_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                active={selectedStatus === opt.value}
                onClick={() => setSelectedStatus(opt.value)}
                clickable
              />
            ))}
          </ChipsRow>
        </FilterRow>

        {!loading && displayTickets.length > 0 && filteredTickets.length > 0 && (
          <ResultsCountText>
            {(filteredTickets.length === displayTickets.length)
              ? `${displayTickets.length} ticket${displayTickets.length !== 1 ? "s" : ""} found`
              : `${filteredTickets.length} of ${displayTickets.length} ticket${displayTickets.length !== 1 ? "s" : ""} match`}
          </ResultsCountText>
        )}

        {loading ? (
          <EmptyStateWrapper>
            <CircularProgress size={32} sx={{ color: "#3EA0F1" }} />
            <EmptyStateText>Loading tickets…</EmptyStateText>
          </EmptyStateWrapper>
        ) : filteredTickets.length === 0 ? (
          <EmptyStateWrapper>
            <EmptyStateText>
              {displayTickets.length === 0 ? "No tickets raised yet." : "No tickets match your search."}
            </EmptyStateText>
          </EmptyStateWrapper>
        ) : (
          <>
            <TicketsListWrapper>
              {pageTickets.map((ticket) => {
                const uid = ticket.id ?? ticket.ticketId ?? "";
                return (
                  <TicketRow
                    key={uid as string}
                    ticket={ticket}
                    isSelected={uid === selectedTicketId}
                    onSelect={() => handleSelect(ticket)}
                  />
                );
              })}
            </TicketsListWrapper>

            {totalPages > 1 && (
              <PaginationBar>
                <PaginationInfo>
                  Showing {pageStart + 1}–{Math.min(pageStart + ITEMS_PER_PAGE, filteredTickets.length)} of {filteredTickets.length}
                </PaginationInfo>
                <PageButtonsRow>
                  <PageBtn
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    ‹
                  </PageBtn>
                  {pageNumbers.map((p, i) =>
                    p === "…" ? (
                      <PageBtn key={`ellipsis-${i}`} disabled sx={{ cursor: "default" }}>…</PageBtn>
                    ) : (
                      <PageBtn
                        key={p}
                        active={p === currentPage}
                        onClick={() => setCurrentPage(p as number)}
                      >
                        {p}
                      </PageBtn>
                    )
                  )}
                  <PageBtn
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    ›
                  </PageBtn>
                </PageButtonsRow>
              </PaginationBar>
            )}
          </>
        )}
      </SearchSectionContainer>
    </>
  );
};

export default TicketSearchSection;
