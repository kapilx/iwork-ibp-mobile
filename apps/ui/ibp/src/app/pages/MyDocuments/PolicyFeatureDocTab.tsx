import React, { useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  CircularProgress,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { endPoints, formatDate } from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import PolicyDocumentCard from "../../common/PolicyDocumentCard";
import { DocumentSubTab, DocumentTabKey } from "./config";
import {
  PolicyCardsGrid,
  PolicyCardsWrapper,
  FilterBarRow,
  FilterGroup,
  SectionCard,
  SectionHeaderRow,
  SectionTitleText,
  SectionTitleGroup,
  SectionIcon,
  SectionCountBadge,
  DownloadAllButton,
  SelectAllButton,
  ListTableWrapper,
  ListTableRow,
  ListCellText,
  ListActionButton,
} from "./styles";
import { DATE_FORMATS } from "../../constants";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getMailPdfFileName } from "../../utils/mailPreview";
import noDocumentIcon from "../../assets/svgs/document-empty-icon.svg";
import policiesSectionIcon from "../../assets/svgs/colored-shield-icon.svg";
import additionalSectionIcon from "../../assets/svgs/important-documents-icon.svg";
import claimsSectionIcon from "../../assets/svgs/claim-doc-icon.svg";
import lifeEventsSectionIcon from "../../assets/svgs/policy-features-icon.svg";
import mailSectionIcon from "../../assets/svgs/envelope-simple.svg";
import defaultSectionIcon from "../../assets/svgs/file-icon-blue.svg";
import { setToastMessage } from "../../redux/slice";

// Resolve the leading icon shown before a section heading, keyed by category.
const getSectionIcon = (sectionKey: string): string => {
  if (sectionKey === "policies") return policiesSectionIcon;
  if (sectionKey === "additional_documents") return additionalSectionIcon;
  if (sectionKey === "claims") return claimsSectionIcon;
  if (sectionKey === "life_events") return lifeEventsSectionIcon;
  if (sectionKey === "mail" || sectionKey.startsWith("mail:")) return mailSectionIcon;
  return defaultSectionIcon;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type PolicyFeatureDocument = {
  id?: number | string;
  documentId: number | string | null;
  fileName: string;
  mimeType?: string;
  lastUpdated?: string | null;
  policyId?: number | string;
  policyName?: string;
  featureType?: string;
  lifeEventAction?: "ADD" | "DELETE" | string;
  title?: string;
  subtitle?: string | null;
  uploadedByName?: string | null;
  itemType?: "document" | "mail";
  referenceId?: string;
  referenceType?: string;
  renderedHtml?: string;
  hasPreview?: boolean;
  hasDownload?: boolean;
  documentType?: string | null;
};

const CLAIM_DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CLAIM_FORM_PART_A_B: "Claim Form Part A & Part B",
  INSURED_KYC_AADHAR_PAN: "Insured KYC documents (Aadhar & PAN)",
  CANCEL_CHEQUE_OR_BANK_STATEMENT: "Cancel cheque or Bank account statement",
  DISCHARGE_SUMMARY: "Discharge Summary",
  TREATMENT_DAILY_SHEET: "Treatment Daily sheet (Ksheet)",
  INVESTIGATION_REPORTS: "Investigation Reports",
  FINAL_BILL: "Final Bill",
};

// ─── Normalizer ───────────────────────────────────────────────────────────────

const normalizePolicyFeatureDocuments = (
  response: any,
): PolicyFeatureDocument[] => {
  const payload = response?.data?.data ?? response?.data ?? [];
  if (!Array.isArray(payload)) return [];

  return payload
    .filter((item: any) => item?.id != null)
    .map((item: any) => {
    const documentId =
      item?.documentId ?? item?.fileId ?? item?.id ?? item?.document?.id;

    const documentTypeKey: string | null = item?.documentType ?? null;
    const documentTypeLabel = documentTypeKey
      ? (CLAIM_DOCUMENT_TYPE_LABELS[documentTypeKey] ?? documentTypeKey)
      : null;

    // For claim_intimation items, replace the raw documentType key inside the subtitle
    // with the human-readable label while keeping the patient summary prefix.
    let subtitle = item?.subtitle ?? null;
    if (
      item?.featureType === "claim_intimation" &&
      documentTypeKey &&
      documentTypeLabel &&
      subtitle
    ) {
      subtitle = subtitle.replace(documentTypeKey, documentTypeLabel);
    } else if (item?.featureType === "claim_intimation" && documentTypeLabel && !subtitle) {
      subtitle = documentTypeLabel;
    }

    return {
      id: item?.id,
      documentId,
      fileName: item?.fileName ?? item?.name ?? "Policy features",
      mimeType:
        item?.mimeType ??
        item?.fileMimeType ??
        item?.document?.mimeType ??
        undefined,
      lastUpdated:
        item?.lastUpdated ??
        item?.updatedAt ??
        item?.uploadedAt ??
        item?.modifiedAt ??
        item?.document?.updatedAt ??
        item?.document?.uploadedAt ??
        null,
      policyId: item?.policyId ?? item?.id,
      policyName: item?.policyName ?? item?.name ?? "--",
      featureType: item?.featureType,
      lifeEventAction: item?.lifeEventAction,
      title: item?.title ?? item?.policyName ?? item?.name ?? "Document",
      subtitle,
      uploadedByName: item?.uploadedByName ?? null,
      itemType: item?.featureType === "mail" ? "mail" : "document",
      referenceId:
        item?.referenceId != null ? String(item.referenceId) : undefined,
      referenceType: item?.referenceType,
      renderedHtml:
        typeof item?.renderedHtml === "string" ? item.renderedHtml : undefined,
      hasPreview: item?.hasPreview ?? item?.featureType === "mail",
      hasDownload: item?.hasDownload ?? item?.featureType === "mail",
      documentType: documentTypeKey,
    };
  });
};

// ─── Category helpers ─────────────────────────────────────────────────────────

const SECTION_ORDER = [
  "policies",
  "additional_documents",
  "claims",
  "life_events",
  "personal_documents",
  "support_tickets",
];

const getCategoryKey = (doc: PolicyFeatureDocument): string => {
  const ft = String(doc.featureType ?? "").toLowerCase();
  if (ft === "policy_level" || ft === "company_level") return "policies";
  if (ft === "company_additional") return "additional_documents";
  if (ft === "claim_intimation") return "claims";
  if (ft === "life_event") return "life_events";
  if (ft === "personal_document") return "personal_documents";
  if (ft === "raise_ticket") return "support_tickets";
  if (ft === "mail") return `mail:${doc.title ?? "Communications"}`;
  return "other";
};

const getCategoryFilterValue = (doc: PolicyFeatureDocument): string => {
  const ft = String(doc.featureType ?? "").toLowerCase();
  if (ft === "policy_level" || ft === "company_level") return "policies";
  if (ft === "company_additional") return "additional_documents";
  if (ft === "claim_intimation") return "claims";
  if (ft === "life_event") return "life_events";
  if (ft === "personal_document") return "personal_documents";
  if (ft === "raise_ticket") return "support_tickets";
  if (ft === "mail") return "mail";
  return "other";
};

const getCategoryLabel = (key: string): string => {
  if (key === "policies") return "Policies Document";
  if (key === "additional_documents") return "Additional Documents";
  if (key === "claims") return "Claim Documents";
  if (key === "life_events") return "Life Event Documents";
  if (key === "personal_documents") return "Personal Documents";
  if (key === "support_tickets") return "Support Tickets";
  if (key === "mail") return "Communications";
  if (key.startsWith("mail:")) return key.slice(5);
  return "Other Documents";
};

const getDocumentTypeValue = (featureType?: string): string => {
  const ft = String(featureType ?? "").toLowerCase();
  if (ft === "policy_level" || ft === "company_level") return "policy_certificate";
  if (ft === "claim_intimation") return "claim_form";
  if (ft === "life_event") return "life_event_proof";
  if (ft === "personal_document") return "personal_document";
  if (ft === "raise_ticket") return "support_ticket";
  if (ft === "mail") return "communication";
  if (ft === "company_additional") return "additional_document";
  return "document";
};

const getDocumentTypeLabel = (featureType?: string): string => {
  const rawValue = String(featureType ?? "");
  if (rawValue === "additional_document") return "Additional Document";
  const typeValue = [
    "policy_certificate",
    "claim_form",
    "life_event_proof",
    "support_ticket",
    "communication",
    "document",
  ].includes(rawValue)
    ? rawValue
    : getDocumentTypeValue(featureType);
  if (typeValue === "policy_certificate") return "Policy Certificate";
  if (typeValue === "claim_form") return "Claim Form";
  if (typeValue === "life_event_proof") return "Life Event Proof";
  if (typeValue === "personal_document") return "Personal Document";
  if (typeValue === "support_ticket") return "Support Ticket";
  if (typeValue === "communication") return "Communication";
  if (typeValue === "additional_document") return "Additional Document";
  return "Document";
};

const CATEGORY_OPTIONS = [
  { key: "policies", label: getCategoryLabel("policies") },
  { key: "additional_documents", label: getCategoryLabel("additional_documents") },
  { key: "claims", label: getCategoryLabel("claims") },
  { key: "life_events", label: getCategoryLabel("life_events") },
  { key: "personal_documents", label: getCategoryLabel("personal_documents") },
  { key: "support_tickets", label: getCategoryLabel("support_tickets") },
  { key: "mail", label: getCategoryLabel("mail") },
  { key: "other", label: getCategoryLabel("other") },
];

const DOCUMENT_TYPE_OPTIONS = [
  { value: "policy_certificate", label: getDocumentTypeLabel("policy_certificate") },
  { value: "additional_document", label: getDocumentTypeLabel("additional_document") },
  { value: "claim_form", label: getDocumentTypeLabel("claim_form") },
  { value: "life_event_proof", label: getDocumentTypeLabel("life_event_proof") },
  { value: "personal_document", label: getDocumentTypeLabel("personal_document") },
  { value: "support_ticket", label: getDocumentTypeLabel("support_ticket") },
  { value: "communication", label: getDocumentTypeLabel("communication") },
  { value: "document", label: getDocumentTypeLabel("document") },
];

const getAssociatedContext = (doc: PolicyFeatureDocument): string => {
  const ft = String(doc.featureType ?? "").toLowerCase();
  if (ft === "policy_level" || ft === "company_level") {
    return doc.policyName ?? "--";
  }
  if (ft === "company_additional") {
    return doc.policyName ?? "Company";
  }
  if (ft === "claim_intimation") {
    return doc.subtitle ?? doc.title ?? "--";
  }
  if (ft === "life_event") {
    return doc.subtitle ?? "--";
  }
  if (ft === "personal_document") {
    return "Personal Documents";
  }
  if (ft === "raise_ticket") {
    return doc.subtitle ?? doc.title ?? "--";
  }
  if (ft === "mail") {
    return doc.subtitle ?? "--";
  }
  return "--";
};

// ─── Thumbnail gradients per featureType ────────────────────────────────────

const THUMBNAIL_GRADIENTS: Record<string, string> = {
  policy_level:   "linear-gradient(135deg, #E8D5C0 0%, #C9A882 100%)",
  company_level:  "linear-gradient(135deg, #D4E0CC 0%, #A0B898 100%)",
  company_additional: "linear-gradient(135deg, #D9E7F6 0%, #8AB4E6 100%)",
  claim_intimation: "linear-gradient(135deg, #F4C4A8 0%, #E89070 100%)",
  life_event:     "linear-gradient(135deg, #C4C8D8 0%, #8890AA 100%)",
  personal_document: "linear-gradient(135deg, #DDEBFF 0%, #A8C6F0 100%)",
  raise_ticket:   "linear-gradient(135deg, #FFB3BA 0%, #FF8A95 100%)",
  mail:           "linear-gradient(135deg, #B8D4F0 0%, #78AEE0 100%)",
};

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #F0E0C8 0%, #D4B090 100%)",
  "linear-gradient(135deg, #FAD0C4 0%, #EEA08C 100%)",
  "linear-gradient(135deg, #D0D4E0 0%, #A0A8C0 100%)",
  "linear-gradient(135deg, #C8E0D4 0%, #90BCA8 100%)",
];

const getThumbnailGradient = (featureType: string | undefined, index: number): string => {
  const ft = String(featureType ?? "").toLowerCase();
  return THUMBNAIL_GRADIENTS[ft] ?? FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
};

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  tabKey: DocumentTabKey;
  data: any;
  isLoadingDocuments?: boolean;
  externalSearch?: string;
  onExternalSearchChange?: (value: string) => void;
  categoryFilter?: string;
  onCategoryFilterChange?: (value: string) => void;
  typeFilter?: string;
  onTypeFilterChange?: (value: string) => void;
  sortOrder?: "latest" | "oldest";
  onSortOrderChange?: (value: "latest" | "oldest") => void;
  onClearAll?: () => void;
  filterRightAction?: React.ReactNode;
  filterBelowContent?: React.ReactNode;
};

// ─── Component ────────────────────────────────────────────────────────────────

const PolicyFeatureDocTab: React.FC<Props> = ({ tabKey: _tabKey, data, isLoadingDocuments = false, externalSearch, onExternalSearchChange, categoryFilter: externalCategoryFilter, onCategoryFilterChange, typeFilter: externalTypeFilter, onTypeFilterChange, sortOrder: externalSortOrder, onSortOrderChange, onClearAll, filterRightAction, filterBelowContent }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // UI state
  const [internalSearch, setInternalSearch] = useState("");
  const search = externalSearch !== undefined ? externalSearch : internalSearch;
  const setSearch = onExternalSearchChange ?? setInternalSearch;
  const [internalCategoryFilter, setInternalCategoryFilter] = useState("all");
  const categoryFilter =
    externalCategoryFilter !== undefined
      ? externalCategoryFilter
      : internalCategoryFilter;
  const setCategoryFilter = onCategoryFilterChange ?? setInternalCategoryFilter;
  const [internalTypeFilter, setInternalTypeFilter] = useState("all");
  const typeFilter =
    externalTypeFilter !== undefined ? externalTypeFilter : internalTypeFilter;
  const setTypeFilter = onTypeFilterChange ?? setInternalTypeFilter;
  const [internalSortOrder, setInternalSortOrder] = useState<"latest" | "oldest">("latest");
  const sortOrder =
    externalSortOrder !== undefined ? externalSortOrder : internalSortOrder;
  const setSortOrder = onSortOrderChange ?? setInternalSortOrder;
  const [viewMode] = useState<"card" | "list">("card");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // ── helpers ──────────────────────────────────────────────────────────────

  const getDocumentActivityType = (doc: PolicyFeatureDocument) => {
  const ft = String(doc.featureType ?? "").toLowerCase();
  if (ft === "claim_intimation") return "CLAIM_DOCUMENT";
  if (ft === "life_event") return "LIFE_EVENT_DOCUMENT";
  if (ft === "personal_document") return "PERSONAL_DOCUMENT";
  if (ft === "raise_ticket") return "SUPPORT_TICKET_DOCUMENT";
  if (ft === "company_additional") return "COMPANY_ADDITIONAL_DOCUMENT";
  return "POLICY_FEATURE_DOCUMENT";
  };

  const getDocumentReferenceId = (doc: PolicyFeatureDocument) => {
    const raw = doc.documentId ?? doc.referenceId ?? doc.id ?? null;
    if (raw == null) return null;
    if (typeof raw === "number") return raw;
    const n = Number(raw);
    return Number.isFinite(n) ? n : String(raw);
  };

  const createDocumentActivityLog = async (
    activityKey: "DOCUMENT_VIEWED" | "DOCUMENT_DOWNLOADED",
    policyDocument: PolicyFeatureDocument,
    policy: DocumentSubTab,
  ) => {
    const referenceId = getDocumentReferenceId(policyDocument);
    if (referenceId == null) return;

    const activityAction = activityKey === "DOCUMENT_VIEWED" ? "viewed" : "downloaded";
    const documentType = getDocumentActivityType(policyDocument);
    const activityText = `${documentType} ${activityAction} (${policy?.label ?? "--"})`;

    try {
      await apiRequest(endPoints.getActivityLogs, {
        method: "POST",
        data: {
          activityKey,
          activityCategory: "DOCUMENT",
          referenceId,
          referenceType: "DOCUMENT",
          metadata: {
            documentType,
            policyNumber: policy?.label,
            fileName: policyDocument.fileName,
            activityText,
            policyName: policy?.label ?? "--",
          },
        },
      });
    } catch (error) {
      console.error("Failed to create %s activity log", activityKey, error);
    }
  };

  const handleDownload = async (
    doc: PolicyFeatureDocument,
    documentRef: DocumentSubTab,
  ) => {
    if (!doc.documentId) {
      dispatch(setToastMessage("Document is not available for download."));
      return;
    }
    try {
      const response = await apiRequest(
        endPoints.ibpFileUploadDownloadById(Number(doc.documentId)),
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.fileName || "document";
      link.click();
      URL.revokeObjectURL(url);
      dispatch(
        setToastMessage(
          `${doc.fileName || documentRef.label || "Document"} downloaded successfully.`,
        ),
      );
      void createDocumentActivityLog("DOCUMENT_DOWNLOADED", doc, documentRef);
    } catch (error) {
      console.error("Download failed:", error);
      dispatch(
        setToastMessage(
          `Failed to download ${doc.fileName || documentRef.label || "document"}. Please try again.`,
        ),
      );
    }
  };

  const handleBulkDownload = async (
    documents: PolicyFeatureDocument[],
    zipFileName: string,
  ) => {
    const documentIds = documents
      .filter((doc) => doc.itemType !== "mail" && doc.documentId)
      .map((doc) => Number(doc.documentId))
      .filter((id) => Number.isFinite(id));

    if (!documentIds.length) {
      dispatch(setToastMessage("No downloadable documents available in this section."));
      return;
    }

    try {
      const response = await apiRequest(endPoints.ibpFileUploadBulkDownload, {
        method: "POST",
        responseType: "blob",
        data: {
          documentIds,
          zipFileName,
        },
      });
      const blob = response.data;
      const contentDisposition = response.headers?.["content-disposition"];
      const matchedFileName = contentDisposition?.match(/filename="?([^"\n]+)"?/i)?.[1];
      const downloadFileName = matchedFileName || `${zipFileName}.zip`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFileName;
      link.click();
      URL.revokeObjectURL(url);
      dispatch(
        setToastMessage(
          `${documentIds.length} document${documentIds.length > 1 ? "s" : ""} downloaded as ZIP successfully.`,
        ),
      );
    } catch (error) {
      console.error("Bulk download failed:", error);
      const errorMessage =
        (error as any)?.response?.data?.message ||
        `Bulk download failed for ${zipFileName}. Please try again.`;
      dispatch(setToastMessage(errorMessage));
    }
  };

  const handleViewDocument = (
    doc: PolicyFeatureDocument,
    documentRef: DocumentSubTab,
    index: number,
    lastUpdatedLabel: string,
  ) => {
    if (doc.itemType === "mail") {
      void createDocumentActivityLog("DOCUMENT_VIEWED", doc, documentRef);
      dispatch(
        setToastMessage(
          `Opening ${doc.title ?? documentRef.label ?? "mail preview"}.`,
        ),
      );
      navigate("/activity-log-preview", {
        state: {
          activity: {
            id: String(doc.id ?? doc.referenceId ?? index),
            date: lastUpdatedLabel,
            title: doc.title ?? "Mail Preview",
            description: doc.subtitle ?? "Email preview",
            icon: "",
            referenceId: doc.referenceId,
            referenceType: doc.referenceType,
            previewable: true,
            downloadable: true,
            downloadFileName: getMailPdfFileName(
              doc.title || doc.fileName,
              "mail-preview",
            ),
            metadata: {
              ...(doc.renderedHtml ? { renderedHtml: doc.renderedHtml } : {}),
              documentReferenceId: getDocumentReferenceId(doc),
              documentType: getDocumentActivityType(doc),
              policyNumber: documentRef.label ?? "--",
              fileName: doc.fileName,
              policyName: doc.policyName ?? documentRef.label,
            },
          },
        },
      });
      return;
    }

    if (!doc.documentId) return;

    void createDocumentActivityLog("DOCUMENT_VIEWED", doc, documentRef);
    dispatch(
      setToastMessage(
        `Opening ${doc.fileName || documentRef.label || "document"} preview.`,
      ),
    );
    navigate("/my-documents/preview", {
      state: {
        documentId: doc.documentId,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        title: documentRef.label ?? doc.title,
        documentType: getDocumentTypeLabel(doc.featureType),
        associatedContext: getAssociatedContext(doc),
        uploadedBy: doc.uploadedByName ?? "System",
        lastUpdated: lastUpdatedLabel,
      },
    });
  };

  // ── Data processing ───────────────────────────────────────────────────────

  const allDocuments = useMemo(
    () => normalizePolicyFeatureDocuments(data),
    [data],
  );

  // Filtered + sorted documents
  const filteredDocuments = useMemo(() => {
    let docs = allDocuments;

    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter((d) =>
        (d.title ?? d.fileName ?? "").toLowerCase().includes(q),
      );
    }

    if (categoryFilter !== "all") {
      docs = docs.filter((d) => getCategoryFilterValue(d) === categoryFilter);
    }

    if (typeFilter !== "all") {
      docs = docs.filter(
        (d) => getDocumentTypeValue(d.featureType) === typeFilter,
      );
    }

    return [...docs].sort((a, b) => {
      const aTime = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      const bTime = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      return sortOrder === "latest" ? bTime - aTime : aTime - bTime;
    });
  }, [allDocuments, search, categoryFilter, typeFilter, sortOrder]);

  // Grouped by category, maintaining fixed section order
  const { groupedDocs, sortedGroupKeys } = useMemo(() => {
    const groups = new Map<string, PolicyFeatureDocument[]>();
    for (const doc of filteredDocuments) {
      const key = getCategoryKey(doc);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(doc);
    }

    const sortedKeys = [...groups.keys()].sort((a, b) => {
      const ai = SECTION_ORDER.indexOf(a);
      const bi = SECTION_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });

    return { groupedDocs: groups, sortedGroupKeys: sortedKeys };
  }, [filteredDocuments]);

  const handleClearFilters = () => {
    if (onClearAll) {
      onClearAll();
      return;
    }
    setSearch("");
    setCategoryFilter("all");
    setTypeFilter("all");
    setSortOrder("latest");
  };

  // List view row checkbox helpers
  const toggleRowSelect = (key: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getDocumentRowKey = (
    doc: PolicyFeatureDocument,
    index: number,
  ): string => String(doc.id ?? doc.documentId ?? index);

  const toggleSectionSelect = (
    sectionDocs: PolicyFeatureDocument[],
    allSelected: boolean,
  ) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      sectionDocs.forEach((doc, index) => {
        const key = getDocumentRowKey(doc, index);
        if (allSelected) {
          next.delete(key);
        } else {
          next.add(key);
        }
      });
      return next;
    });
  };

  const makeDocumentRef = (
    doc: PolicyFeatureDocument,
    index: number,
  ): DocumentSubTab => ({
    key: getDocumentRowKey(doc, index),
    label: doc.title ?? doc.policyName ?? "Document",
    policyId: doc.policyId,
    policyName: doc.policyName,
  });

  const formatLastUpdated = (doc: PolicyFeatureDocument): string => {
    if (!doc.lastUpdated) return "--";
    return (
      formatDate(doc.lastUpdated, DATE_FORMATS.DAY_SHORT_MONTH_YEAR) ??
      doc.lastUpdated
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PolicyCardsWrapper>
      {isLoadingDocuments && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 2,
          }}
        >
          <CircularProgress size={18} />
          <Typography sx={{ fontSize: "0.875rem" }}>
            Updating documents...
          </Typography>
        </Box>
      )}

      {/* Filter row */}
      <FilterBarRow>
        <FilterGroup>
          {/* Category */}
          <Select
            size="small"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            displayEmpty
            sx={{ fontSize: "0.875rem", minWidth: 160 }}
          >
            <MenuItem value="all">All Documents</MenuItem>
            {CATEGORY_OPTIONS.map((opt) => (
              <MenuItem key={opt.key} value={opt.key}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>

          {/* Document type */}
          <Select
            size="small"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            displayEmpty
            sx={{ fontSize: "0.875rem", minWidth: 160 }}
          >
            <MenuItem value="all">Document type</MenuItem>
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>

          {/* Sort */}
          <Select
            size="small"
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as "latest" | "oldest")
            }
            sx={{ fontSize: "0.875rem", minWidth: 140 }}
          >
            <MenuItem value="latest">Latest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
          </Select>

          {/* Clear all – always visible */}
          <Box
            component="button"
            type="button"
            onClick={handleClearFilters}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              height: 40,
              borderRadius: "6px",
              border: "1px solid #093F84",
              padding: "10px 20px",
              cursor: "pointer",
              background: "transparent",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#093F84",
              boxSizing: "border-box",
              flexShrink: 0,
              "&:hover": { backgroundColor: "rgba(9,63,132,0.06)" },
            }}
          >
            Clear all
          </Box>
        </FilterGroup>
        {filterRightAction ? <Box>{filterRightAction}</Box> : null}
      </FilterBarRow>

      {filterBelowContent ? <Box sx={{ mb: 3 }}>{filterBelowContent}</Box> : null}

      {filteredDocuments.length === 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 10,
            gap: 2,
            backgroundColor: "background.paper",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            minHeight: 320,
          }}
        >
          <Box
            component="img"
            src={noDocumentIcon}
            alt="No documents"
            sx={{ width: 106, height: 106 }}
          />
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#222222",
              mt: 1,
            }}
          >
            {search.trim() ? "No documents found" : "No document has been uploaded"}
          </Typography>
        </Box>
      )}

      {/* ── Card View ─────────────────────────────────────────────────────── */}
      {viewMode === "card" && filteredDocuments.length > 0 && (
        <>
          {sortedGroupKeys.map((sectionKey) => {
            const sectionDocs = groupedDocs.get(sectionKey) ?? [];
            const sectionLabel = getCategoryLabel(sectionKey);
            const sectionDocKeys = sectionDocs.map((doc, index) =>
              getDocumentRowKey(doc, index),
            );
            const selectedInSectionCount = sectionDocKeys.filter((k) =>
              selectedRows.has(k),
            ).length;
            const allSectionSelected =
              sectionDocs.length > 0 &&
              selectedInSectionCount === sectionDocs.length;

            return (
              <SectionCard key={sectionKey}>
                <SectionHeaderRow>
                  <SectionTitleGroup>
                    <SectionTitleText>{sectionLabel}</SectionTitleText>
                    <SectionCountBadge>{sectionDocs.length}</SectionCountBadge>
                  </SectionTitleGroup>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      '@media (max-width: 420px) and (min-width: 360px)': {
                        gap: '8px',
                      },
                    }}
                  >
                    <SelectAllButton
                      onClick={() =>
                        toggleSectionSelect(sectionDocs, allSectionSelected)
                      }
                    >
                      {allSectionSelected ? "Deselect All" : "Select All"}
                    </SelectAllButton>
                    <DownloadAllButton
                      startIcon={<FileDownloadOutlinedIcon />}
                      disabled={selectedInSectionCount <= 1}
                      onClick={() => {
                        const selectedSectionDocs = sectionDocs.filter(
                          (doc, index) =>
                            selectedRows.has(getDocumentRowKey(doc, index)),
                        );
                        void handleBulkDownload(selectedSectionDocs, sectionLabel);
                      }}
                    >
                      Download All
                    </DownloadAllButton>
                  </Box>
                </SectionHeaderRow>

                <PolicyCardsGrid>
                  {sectionDocs.map((doc, index) => {
                    const hasDocument =
                      doc.itemType === "mail"
                        ? Boolean(doc.hasPreview)
                        : Boolean(doc.documentId);
                    const lastUpdatedLabel = hasDocument
                      ? formatLastUpdated(doc)
                      : "--";
                    const documentRef = makeDocumentRef(doc, index);

                    return (
                      <PolicyDocumentCard
                        key={documentRef.key}
                        title={documentRef.label}
                        subtitle={getDocumentTypeLabel(doc.featureType)}
                        fileName={doc.fileName}
                        lastUpdatedLabel={lastUpdatedLabel}
                        isLoading={false}
                        hasDocument={hasDocument}
                        showSecondaryAction={
                          doc.itemType !== "mail" && Boolean(doc.documentId)
                        }
                        documentId={Number(doc.documentId) || 0}
                        checked={selectedRows.has(documentRef.key)}
                        onToggleCheck={() => toggleRowSelect(documentRef.key)}
                        thumbnailGradient={getThumbnailGradient(doc.featureType, index)}
                        onViewDocument={() =>
                          handleViewDocument(
                            doc,
                            documentRef,
                            index,
                            lastUpdatedLabel,
                          )
                        }
                        onSecondaryAction={() =>
                          handleDownload(doc, documentRef)
                        }
                      />
                    );
                  })}
                </PolicyCardsGrid>
              </SectionCard>
            );
          })}
        </>
      )}

      {/* ── List View ─────────────────────────────────────────────────────── */}
      {viewMode === "list" && filteredDocuments.length > 0 && (
        <ListTableWrapper>
          {/* Header row */}
          <ListTableRow isHeader>
            <Box />
            <ListCellText isHeader>Document Name</ListCellText>
            <ListCellText isHeader>Document Type</ListCellText>
            <ListCellText isHeader>Associated Context</ListCellText>
            <ListCellText isHeader>Uploaded By</ListCellText>
            <ListCellText isHeader>Latest modify</ListCellText>
            <ListCellText isHeader>Actions</ListCellText>
          </ListTableRow>

          {/* Data rows */}
          {filteredDocuments.map((doc, index) => {
            const documentRef = makeDocumentRef(doc, index);
            const hasDocument =
              doc.itemType === "mail"
                ? Boolean(doc.hasPreview)
                : Boolean(doc.documentId);
            const lastUpdatedLabel = formatLastUpdated(doc);
            const rowKey = documentRef.key;

            return (
              <ListTableRow key={rowKey}>
                {/* Checkbox */}
                <Checkbox
                  size="small"
                  checked={selectedRows.has(rowKey)}
                  onChange={() => toggleRowSelect(rowKey)}
                  sx={{ p: 0, color: "#222222", "&.Mui-checked": { color: "#222222" } }}
                />

                {/* Document Name */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden" }}>
                  <ListCellText
                    title={documentRef.label}
                    sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {documentRef.label}
                  </ListCellText>
                </Box>

                {/* Document Type */}
                <ListCellText>{getDocumentTypeLabel(doc.featureType)}</ListCellText>

                {/* Associated Context */}
                <ListCellText
                  title={getAssociatedContext(doc)}
                  sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {getAssociatedContext(doc)}
                </ListCellText>

                {/* Uploaded By */}
                <ListCellText>{doc.uploadedByName ?? "--"}</ListCellText>

                {/* Latest modify */}
                <ListCellText>{lastUpdatedLabel}</ListCellText>

                {/* Actions */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <ListActionButton
                    disabled={!hasDocument}
                    onClick={() =>
                      handleViewDocument(
                        doc,
                        documentRef,
                        index,
                        lastUpdatedLabel,
                      )
                    }
                  >
                    View
                  </ListActionButton>
                  {doc.itemType !== "mail" && (
                    <ListActionButton
                      disabled={!doc.documentId}
                      onClick={() => handleDownload(doc, documentRef)}
                    >
                      Download
                    </ListActionButton>
                  )}
                </Box>
              </ListTableRow>
            );
          })}
        </ListTableWrapper>
      )}
    </PolicyCardsWrapper>
  );
};

export default PolicyFeatureDocTab;
