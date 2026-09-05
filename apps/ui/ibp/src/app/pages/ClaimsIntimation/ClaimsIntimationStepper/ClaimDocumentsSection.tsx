import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CheckCircle,
  Close as CloseIcon,
  DeleteOutlined,
  ErrorOutline,
  FileDownloadOutlined,
  FileUploadOutlined,
  RefreshOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { useMemo, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { DocumentPreview, apiRequest, endPoints } from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { setToastMessage } from "../../../redux/slice";
import { ClaimsIntimationFormValues } from "./types";

export type DocumentTypeOption = {
  value: string;
  label: string;
  required: boolean | ((form: ClaimsIntimationFormValues) => boolean);
  hasTemplate: boolean;
  templateUrl?: string;
  helpText?: string;
  maxFiles?: number;
};

export const isDocumentRequired = (
  config: DocumentTypeOption,
  formValues: ClaimsIntimationFormValues
): boolean =>
  typeof config.required === "function"
    ? config.required(formValues)
    : config.required;

// ── Reimbursement claim documents ─────────────────────────────────────────────
// required: true  → always mandatory
// required: false → never mandatory (optional upload)
// required: (f)   → conditionally mandatory based on form values
// To make a document conditional, replace `true` with a function:
//   (f) => Boolean(f?.someField)
export const REIMBURSEMENT_DOCUMENT_TYPES: DocumentTypeOption[] = [
  // ── Always mandatory ────────────────────────────────────────────────────────
  {
    value: "CLAIM_FORM_PART_A_B",
    label: "Claim Form Part A & Part B",
    required: true,
    hasTemplate: true,
    templateUrl: "/templates/claim-form-a-b.pdf",
  },
  {
    value: "FINAL_BILL",
    label: "Final Bill",
    required: true,
    hasTemplate: true,
    templateUrl: "/templates/final-bill.pdf",
  },
  {
    value: "INSURED_KYC_AADHAR_PAN",
    label: "Insured KYC (Aadhar & PAN)",
    required: false,
    hasTemplate: true,
    templateUrl: "/templates/insured-kyc.pdf",
  },
  {
    value: "CANCEL_CHEQUE_OR_BANK_STATEMENT",
    label: "Cancelled Cheque or Bank Statement",
    required: false,
    hasTemplate: true,
    templateUrl: "/templates/cancel-cheque.pdf",
  },
  {
    value: "TREATMENT_DAILY_SHEET",
    label: "Treatment Daily Sheet (Ksheet)",
    required: false,
    hasTemplate: true,
    templateUrl: "/templates/ksheet.pdf",
    maxFiles: 10,
  },
  {
    value: "INVESTIGATION_REPORTS",
    label: "Investigation Reports",
    required: false,
    hasTemplate: true,
    templateUrl: "/templates/investigation-reports.pdf",
    helpText: "Lab reports, imaging, pathology",
    maxFiles: 20,
  },
  {
    value: "DISCHARGE_SUMMARY",
    label: "Discharge Summary",
    required: false,
    hasTemplate: true,
    templateUrl: "/templates/discharge-summary.pdf",
  },
  {
    value: "PHARMACY_BILLS",
    label: "Pharmacy Bills",
    required: false,
    hasTemplate: true,
    templateUrl: "/templates/pharmacy-bills.pdf",
    maxFiles: 20,
  },
  {
    value: "DOCTORS_PRESCRIPTION",
    label: "Doctor's Prescription",
    required: false,
    hasTemplate: true,
    templateUrl: "/templates/prescription.pdf",
  },
  {
    value: "IPD_CASE_PAPERS",
    label: "IPD Case Papers",
    required: false,
    hasTemplate: true,
    templateUrl: "/templates/ipd-case-papers.pdf",
  },
  {
    value: "INDEMNITY_BOND",
    label: "Indemnity Bond",
    required: false,
    hasTemplate: true,
    templateUrl: "/templates/indemnity-bond.pdf",
  },
  {
    value: "NEFT_MANDATE",
    label: "NEFT Mandate Form",
    required: false,
    hasTemplate: true,
    templateUrl: "/templates/neft-mandate.pdf",
  },
  // // ── Conditionally mandatory ─────────────────────────────────────────────────
  // {
  //   value: "FIR_COPY",
  //   label: "FIR Copy (Accident Claims)",
  //   // Required only when an accident location is provided
  //   required: (f) => Boolean(f?.placeOfAccident?.toString().trim()),
  //   hasTemplate: true,
  //   templateUrl: "/templates/fir-copy.pdf",
  //   helpText: "Only required when an accident is reported",
  // },
];

// ── Cashless claim documents ───────────────────────────────────────────────────
export const CASHLESS_DOCUMENT_TYPES: DocumentTypeOption[] = [
  // ── Always mandatory ────────────────────────────────────────────────────────
  {
    value: "GHPL_CARD",
    label: "GHPL Card",
    required: true,
    hasTemplate: true,
    templateUrl: "/templates/ghpl-card.pdf",
  },
  {
    value: "PAN_AND_AADHAR",
    label: "PAN and Aadhar",
    required: true,
    hasTemplate: true,
    templateUrl: "/templates/pan-aadhar.pdf",
  },
  // ── Conditionally mandatory (TODO: update required to (f) => f?.admissionType === 'PLANNED'
  //    once admissionType is added to ClaimsIntimationFormValues) ───────────────
  {
    value: "PREVIOUS_HOSPITAL_DETAILS_FOR_PLANNED_ADMISSION",
    label: "Previous Hospital Details (Planned Admission)",
    required: false,
    hasTemplate: true,
    templateUrl: "/templates/prev-hospital.pdf",
    helpText: "Required for planned admissions",
  },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPT = ".pdf";

const isSupportedFile = (file: File) => {
  const name = file.name.toLowerCase();
  return file.type === "application/pdf" || /\.pdf$/.test(name);
};

const truncateFileName = (name: string, maxLen = 32): string => {
  if (name.length <= maxLen) return name;
  const dotIdx = name.lastIndexOf(".");
  const ext = dotIdx > 0 ? name.slice(dotIdx) : "";
  const keep = maxLen - ext.length - 3;
  return `${name.slice(0, keep)}...${ext}`;
};

const formatTimestamp = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = String(date.getFullYear()).slice(2);
  const h = date.getHours();
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${d}/${m}/${y} ${h % 12 || 12}:${min} ${h >= 12 ? "PM" : "AM"}`;
};

type DocEntry = {
  documentId: number;
  fileUpload: { id: number; fileName: string };
  uploadedAt?: string;
  uploadedTimestamp?: number;
};

type RowState = { status: "uploading" | "failed"; error?: string };

type ClaimDocumentsSectionProps = {
  formMethods: UseFormReturn<ClaimsIntimationFormValues>;
  claimType?: string;
  title?: string;
  // Which form fields this instance reads/writes to. Defaults to the intimation
  // stage's own fields; Step 4 (Submit Claim) passes the submission-stage fields
  // instead so the two never share state despite reusing this same component.
  documentsFieldName?: keyof ClaimsIntimationFormValues;
  documentTypesFieldName?: keyof ClaimsIntimationFormValues;
};

export const ClaimDocumentsSection = ({
  formMethods,
  claimType,
  title,
  documentsFieldName = "documentsByType",
  documentTypesFieldName = "documentTypes",
}: ClaimDocumentsSectionProps) => {
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<{ docType: string; replacingId?: number } | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const trackerRef = useRef<HTMLDivElement | null>(null);
  const abortControllers = useRef<Record<string, AbortController>>({});

  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [previewFile, setPreviewFile] = useState<{
    documentId: number;
    fileName: string;
    label: string;
  } | null>(null);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const docConfigs = useMemo(
    () =>
      claimType === "CASHLESS"
        ? CASHLESS_DOCUMENT_TYPES
        : REIMBURSEMENT_DOCUMENT_TYPES,
    [claimType]
  );

  const watchedDocumentsByType = formMethods.watch(documentsFieldName as any) as Record<string, DocEntry[]> | undefined;
  const watchedPlaceOfAccident = formMethods.watch("placeOfAccident");
  const documentsByType = (watchedDocumentsByType || {}) as Record<string, DocEntry[]>;

  const isUploaded = (key: string) => (documentsByType[key]?.length ?? 0) > 0;
  const visibleConfigs = useMemo(
    () =>
      docConfigs.filter((c) =>
        isDocumentRequired(c, {
          ...formMethods.getValues(),
          placeOfAccident: watchedPlaceOfAccident,
          documentsByType: watchedDocumentsByType,
        })
      ),
    [docConfigs, watchedPlaceOfAccident, watchedDocumentsByType, formMethods]
  );
  const uploadedRequiredCount = visibleConfigs.filter((d) => isUploaded(d.value)).length;
  const uploadedTotalCount = docConfigs.filter((d) => isUploaded(d.value)).length;
  const uploadingCount = Object.values(rowStates).filter((s) => s.status === "uploading").length;
  const progressPct = docConfigs.length
    ? Math.round((uploadedTotalCount / docConfigs.length) * 100)
    : 0;
  const allComplete = visibleConfigs.length > 0 && uploadedRequiredCount === visibleConfigs.length;

  const triggerPicker = (docType: string, replacingId?: number) => {
    pendingRef.current = { docType, replacingId };
    if (inputRef.current) {
      inputRef.current.multiple = !replacingId;
      inputRef.current.click();
    }
  };

  const setRowError = (key: string, error: string) =>
    setRowStates((s) => ({ ...s, [key]: { status: "failed", error } }));

  const clearRowState = (key: string) =>
    setRowStates((s) => {
      const { [key]: _, ...rest } = s;
      return rest;
    });

  const handleFiles = async (files: FileList | null) => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (!files || !files.length || !pending) return;
    const config = docConfigs.find((d) => d.value === pending.docType);
    if (!config) return;

    const arr = pending.replacingId
      ? Array.from(files).slice(0, 1)
      : Array.from(files);
    const tooBig = arr.find((f) => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      setRowError(config.value, `"${tooBig.name}" exceeds 5 MB limit`);
      return;
    }
    const wrongType = arr.find((f) => !isSupportedFile(f));
    if (wrongType) {
      setRowError(config.value, `"${wrongType.name}" is not a supported file type`);
      return;
    }
    const existing = documentsByType[config.value] || [];
    if (
      !pending.replacingId &&
      config.maxFiles &&
      existing.length + arr.length > config.maxFiles
    ) {
      setRowError(config.value, `Maximum ${config.maxFiles} files allowed for this document`);
      return;
    }

    abortControllers.current[config.value]?.abort();
    const controller = new AbortController();
    abortControllers.current[config.value] = controller;

    setRowStates((s) => ({ ...s, [config.value]: { status: "uploading" } }));

    const token = user?.accessToken?.accessToken;
    const companyId = user?.companyId;

    try {
      const responses = await Promise.all(
        arr.map(async (file) => {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("companyType", "company");
          fd.append("companyId", String(companyId || ""));
          const res = await apiRequest(endPoints.ibpFileUpload, {
            method: "POST",
            data: fd,
            headers: {
              "Content-Type": "multipart/form-data",
              Accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const u = (res as any)?.data?.data || (res as any)?.data || res;
          const fileId = u?.id ?? u?.fileId ?? u?.documentId;
          return {
            documentId: fileId as number,
            fileUpload: { id: fileId as number, fileName: u?.fileName || file.name },
            uploadedAt: formatTimestamp(new Date()),
            uploadedTimestamp: Date.now(),
          } as DocEntry;
        })
      );

      const latest = { ...((formMethods.getValues(documentsFieldName as any) as Record<string, DocEntry[]>) || {}) };
      const current: DocEntry[] = latest[config.value] || [];
      if (pending.replacingId) {
        latest[config.value] = current.map((d) =>
          d.documentId === pending.replacingId ? responses[0] : d
        );
      } else {
        latest[config.value] = [...current, ...responses];
      }
      formMethods.setValue(documentsFieldName as any, latest, {
        shouldValidate: true,
        shouldDirty: true,
      });

      const types = (formMethods.getValues(documentTypesFieldName as any) as string[]) || [];
      if (!types.includes(config.value)) {
        formMethods.setValue(documentTypesFieldName as any, [...types, config.value], {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      clearRowState(config.value);
      dispatch(setToastMessage("Document uploaded successfully."));

      // Guide the user to the next pending document.
      setTimeout(() => {
        const latestDocs = ((formMethods.getValues(documentsFieldName as any) as Record<string, DocEntry[]>) || {}) as Record<
          string,
          DocEntry[]
        >;
        const next = visibleConfigs.find(
          (d) => (latestDocs[d.value]?.length ?? 0) === 0
        );
        const target = next
          ? rowRefs.current[next.value]
          : trackerRef.current;
        target?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 400);
    } catch (err: any) {
      const isAbort =
        err?.name === "CanceledError" ||
        err?.name === "AbortError" ||
        err?.code === "ERR_CANCELED"
      if (isAbort) return;
      setRowError(
        config.value,
        err?.response?.data?.message || err?.message || "Upload failed. Please retry."
      );
    }
  };

  const handleDelete = (config: DocumentTypeOption, documentId: number) => {
    const latest = { ...((formMethods.getValues(documentsFieldName as any) as Record<string, DocEntry[]>) || {}) };
    const docs = (latest[config.value] || []).filter((d) => d.documentId !== documentId);
    latest[config.value] = docs;
    formMethods.setValue(documentsFieldName as any, latest, {
      shouldValidate: true,
      shouldDirty: true,
    });
    if (docs.length === 0) {
      const types = (formMethods.getValues(documentTypesFieldName as any) as string[]) || [];
      formMethods.setValue(
        documentTypesFieldName as any,
        types.filter((t) => t !== config.value),
        { shouldValidate: true, shouldDirty: true }
      );
    }
  };

  const handleTemplate = (config: DocumentTypeOption) => {
    if (!config.templateUrl) return;
    window.open(config.templateUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Box
      sx={{
        border: "2px dashed #C4C4C4",
        borderRadius: "12px",
        p: 3,
        mt: 2,
      }}
    >
      {/* Header */}
      {title && (
        <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: 16 }}>
          {title}
          {/* <Box component="span" sx={{ color: "#D32F2F", ml: 0.5 }}>
            *
          </Box> */}
        </Typography>
      )}
      <Typography sx={{ mb: 3, fontSize: 15, color: "#555" }}>
       Upload all mandatory documents to continue, Files supported are: PDF.
       <Box component="span" sx={{ color: "#D32F2F", ml: 0.5 }}>
            *
          </Box> 
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {docConfigs.map((config, idx) => (
          <DocRow
            key={config.value}
            index={idx}
            config={config}
            isRequired={isDocumentRequired(config, {
              ...formMethods.getValues(),
              placeOfAccident: watchedPlaceOfAccident,
              documentsByType: watchedDocumentsByType,
            })}
            files={documentsByType[config.value] || []}
            state={rowStates[config.value]}
            setRef={(el) => {
              rowRefs.current[config.value] = el;
            }}
            onUpload={() => triggerPicker(config.value)}
            onReplace={(id) => triggerPicker(config.value, id)}
            onDelete={(id) => handleDelete(config, id)}
            onTemplate={() => handleTemplate(config)}
            onPreview={(f) =>
              setPreviewFile({
                documentId: f.documentId,
                fileName: f.fileUpload.fileName,
                label: config.label,
              })
            }
            onDismissError={() => clearRowState(config.value)}
          />
        ))}
      </Box>

      {/* Progress tracker */}
      <Box
        ref={trackerRef}
        sx={{
          mt: 3,
          position: "sticky",
          bottom: 16,
          zIndex: 2,
          px: 2.5,
          py: 1.5,
          borderRadius: "10px",
          backgroundColor: allComplete ? "#E8F5E9" : "#F5F7FA",
          border: allComplete ? "1px solid #C8E6C9" : "1px solid #E8ECF1",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          transition: "background-color 200ms ease, border-color 200ms ease",
        }}
      >
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 500,
            color: allComplete ? "#2E7D32" : "#333",
          }}
        >
          {allComplete
            ? "All required documents uploaded. You can submit now."
            : uploadingCount > 0
              ? `Upload all required documents to continue · ${uploadingCount} uploading…`
              : "Upload all required documents to continue"}
        </Typography>
        <ProgressIndicator
          value={uploadedTotalCount}
          total={docConfigs.length}
          percent={progressPct}
          complete={allComplete}
        />
      </Box>

      <input
        ref={inputRef}
        type="file"
        style={{ display: "none" }}
        accept={ACCEPT}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <Dialog
        open={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "12px", overflow: "hidden" } } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1.5,
            px: 2.5,
            borderBottom: "1px solid #E0E0E0",
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: 16 }}>
            {previewFile?.label}
          </Typography>
          <IconButton size="small" onClick={() => setPreviewFile(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {previewFile && (
            <DocumentPreview
              fileId={previewFile.documentId}
              fileName={previewFile.fileName}
              getFileDownloadUrl={endPoints.ibpFileUploadDownloadById}
              previewHeight="70vh"
              toolbarPlacement="top"
              showDownloadButton
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// ---------- Row ----------

type DocRowProps = {
  index: number;
  config: DocumentTypeOption;
  isRequired: boolean;
  files: DocEntry[];
  state?: RowState;
  setRef: (el: HTMLDivElement | null) => void;
  onUpload: () => void;
  onReplace: (id: number) => void;
  onDelete: (id: number) => void;
  onTemplate: () => void;
  onPreview: (f: DocEntry) => void;
  onDismissError: () => void;
};

const DocRow = ({
  index,
  config,
  isRequired,
  files,
  state,
  setRef,
  onUpload,
  onReplace,
  onDelete,
  onTemplate,
  onPreview,
  onDismissError,
}: DocRowProps) => {
  const uploaded = files.length > 0;
  const uploading = state?.status === "uploading";
  const failed = state?.status === "failed";

  const border = failed
    ? "1px solid #D32F2F"
    : uploaded
      ? "1px solid #C8E6C9"
      : "1px solid #E0E0E0";
  const bg = uploaded ? "#F5FBF5" : failed ? "#FFF5F5" : "#fff";

  return (
    <Box
      ref={setRef}
      sx={{
        border,
        borderRadius: "10px",
        backgroundColor: bg,
        p: 2,
        scrollMarginTop: 16,
      }}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          [theme.breakpoints.down(768)]: {
            flexWrap: "wrap",
            alignItems: "flex-start",
          },
        })}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: uploaded ? "#2E7D32" : failed ? "#D32F2F" : "#0A3D75",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {uploaded ? <CheckCircle sx={{ fontSize: 18 }} /> : index + 1}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
            {config.label}
            {isRequired && (
              <Box component="span" sx={{ color: "#D32F2F", ml: 0.5 }}>
                *
              </Box>
            )}
          </Typography>
          {config.helpText && (
            <Typography sx={{ fontSize: 15, color: "#666", mt: 0.25 }}>
              {config.helpText}
            </Typography>
          )}
        </Box>

        <Box
          sx={(theme) => ({
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexShrink: 0,
            [theme.breakpoints.down(768)]: {
              flexBasis: `calc(100% - ${theme.spacing(5)})`,
              maxWidth: `calc(100% - ${theme.spacing(5)})`,
              flexWrap: "wrap",
              marginLeft: theme.spacing(5),
              marginTop: theme.spacing(1),
            },
          })}
        >
          {config.hasTemplate && (
            <Button
              variant="outlined"
              size="small"
              disabled
              startIcon={<FileDownloadOutlined />}
              sx={btnOutline}
            >
              Download template
            </Button>
          )}
          {uploaded && (config.maxFiles ?? 1) > files.length && (
            <Button
              variant="outlined"
              size="small"
              disabled={uploading}
              onClick={onUpload}
              startIcon={
                uploading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <FileUploadOutlined />
                )
              }
              sx={btnOutline}
            >
              Add more
            </Button>
          )}
          {!uploaded && (
            <Button
              variant={failed ? "outlined" : "contained"}
              size="small"
              disabled={uploading}
              onClick={onUpload}
              startIcon={
                uploading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : failed ? (
                  <RefreshOutlined />
                ) : (
                  <FileUploadOutlined />
                )
              }
              sx={failed ? btnOutlineDanger : btnPrimary}
            >
              {failed ? "Retry" : "Upload"}
            </Button>
          )}
          {uploaded && (
            <Button
              variant="contained"
              size="small"
              onClick={onUpload}
              startIcon={<RefreshOutlined />}
              sx={btnPrimary}
            >
              Replace
            </Button>
          )}
        </Box>
      </Box>

      {failed && state?.error && (
        <Box
          sx={{
            mt: 1,
            ml: 5,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            color: "#D32F2F",
          }}
        >
          <ErrorOutline sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: 15, flex: 1 }}>{state.error}</Typography>
          <Box
            component="button"
            onClick={onDismissError}
            sx={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#D32F2F",
              fontSize: 15,
              fontWeight: 600,
              p: 0,
            }}
          >
            Dismiss
          </Box>
        </Box>
      )}

      {uploaded &&
        files.map((f) => (
          <Box
            key={f.documentId}
            sx={(theme) => ({
              mt: 1,
              ml: 5,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              [theme.breakpoints.down(768)]: {
                flexWrap: "wrap",
                rowGap: theme.spacing(0.5),
              },
            })}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0, flexWrap: "wrap" }}>
              <Tooltip title={f.fileUpload.fileName} placement="top" arrow>
                <Box
                  component="span"
                  sx={{
                    fontSize: 15,
                    color: "#333",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minWidth: 0,
                    maxWidth: "100%",
                    flex: "0 1 auto",
                  }}
                >
                  {truncateFileName(f.fileUpload.fileName)}
                </Box>
              </Tooltip>
              {f.uploadedAt && (
                <Box
                  component="span"
                  sx={{
                    fontSize: 15,
                    color: "#777",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  · {f.uploadedAt}
                </Box>
              )}
            </Box>
            <Box
              sx={(theme) => ({
                display: "flex",
                gap: 1.5,
                flexShrink: 0,
                [theme.breakpoints.down(768)]: {
                  flexBasis: "100%",
                  flexWrap: "wrap",
                  rowGap: theme.spacing(0.5),
                  marginTop: theme.spacing(0.5),
                },
              })}
            >
              <IconLink
                icon={<VisibilityOutlined sx={{ fontSize: 18 }} />}
                label="View"
                onClick={() => onPreview(f)}
              />
              <IconLink
                icon={<RefreshOutlined sx={{ fontSize: 18 }} />}
                label="Replace"
                onClick={() => onReplace(f.documentId)}
              />
              <IconLink
                icon={<DeleteOutlined sx={{ fontSize: 18 }} />}
                label="Delete"
                onClick={() => onDelete(f.documentId)}
              />
            </Box>
          </Box>
        ))}
    </Box>
  );
};

// ---------- Progress indicator ----------

const ProgressIndicator = ({
  value,
  total,
  percent,
  complete,
}: {
  value: number;
  total: number;
  percent: number;
  complete: boolean;
}) => {
  const color = complete ? "#2E7D32" : "#0A3D75";
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0 }}>
      <Box sx={{ position: "relative", width: 32, height: 32 }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={32}
          thickness={5}
          sx={{
            color: complete ? "#C8E6C9" : "#E0E6EF",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
        <CircularProgress
          variant="determinate"
          value={percent}
          size={32}
          thickness={5}
          sx={{
            color,
            position: "absolute",
            top: 0,
            left: 0,
            "& .MuiCircularProgress-circle": { strokeLinecap: "round" },
          }}
        />
        {complete && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle sx={{ fontSize: 18, color }} />
          </Box>
        )}
      </Box>
      <Typography sx={{ fontSize: 15, fontWeight: 700, color }}>
        {value}/{total}
      </Typography>
    </Box>
  );
};

// ---------- Shared styles ----------

const btnPrimary = {
  backgroundColor: "#0A3D75",
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: 600,
  fontSize: 15,
  px: 2,
  "&:hover": { backgroundColor: "#08335F" },
  "&.Mui-disabled": { backgroundColor: "#C4C4C4", color: "#fff" },
};

const btnOutline = {
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: 600,
  fontSize: 15,
  borderColor: "#C4C4C4",
  color: "#333",
  px: 2,
};

const btnOutlineDanger = {
  ...btnOutline,
  borderColor: "#D32F2F",
  color: "#D32F2F",
};

const IconLink = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <Box
    component="button"
    onClick={onClick}
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 0.5,
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#333",
      p: 0,
      fontSize: 15,
    }}
  >
    {icon}
    <Typography sx={{ fontSize: 15 }}>{label}</Typography>
  </Box>
);
