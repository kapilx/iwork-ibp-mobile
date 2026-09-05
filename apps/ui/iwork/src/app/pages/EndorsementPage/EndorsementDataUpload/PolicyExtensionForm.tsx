import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import {
  apiRequest,
  Button,
  colors,
  DynamicForm,
  endPoints,
  FormFieldConfig,
  HTTP_METHODS,
  setToastMessage,
  Table,
} from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";
import { useDispatch } from "react-redux";
import DownloadIcon from "../../../assets/svgs/download-icon.svg";
import { getPolicyExtensionFormConfig } from "./nonGroupConfig";

interface Props {
  policyId: number;
  iirnPolicyNumber: string | number;
  currentPolicyTo?: string | null;
  endorsementType?: string;
  osTicketNumber?: string;
  endorsementRequestReceivedDate?: string;
  endorsementId: number | null;
  isStep2Complete?: boolean;
  onSuccess: (endorsementId: number) => void;
  onCancel: () => void;
  onDetailsLoaded?: (details: { endorsementType?: string }) => void;
}

interface ExtensionDocument {
  id: number;
  fileName: string;
  uploadedAt: string;
  downloadUrl: string;
}

// Fields compared for dirty-state detection
const DIRTY_KEYS = ['extensionDate', 'premium', 'remarks'] as const;

const valuesEqual = (
  a: Record<string, any>,
  b: Record<string, any>,
): boolean =>
  DIRTY_KEYS.every(k => String(a[k] ?? '') === String(b[k] ?? ''));

export const PolicyExtensionForm: React.FC<Props> = ({
  policyId,
  iirnPolicyNumber,
  currentPolicyTo,
  endorsementType,
  osTicketNumber,
  endorsementRequestReceivedDate,
  endorsementId: initialEndorsementId,
  isStep2Complete,
  onSuccess,
  onCancel,
  onDetailsLoaded,
}) => {
  const dispatch = useDispatch();
  const formMethodsRef = useRef<any>(null);
  const watchUnsubscribeRef = useRef<(() => void) | null>(null);
  const prevIsNonFinancialRef = useRef<boolean>(false);
  const onDetailsLoadedRef = useRef(onDetailsLoaded);
  useEffect(() => { onDetailsLoadedRef.current = onDetailsLoaded; });

  const [saving, setSaving] = useState(false);

  // True once the initial save has been done (enables document upload section)
  const [extensionDone, setExtensionDone] = useState(!!initialEndorsementId);
  const [activeEndorsementId, setActiveEndorsementId] = useState<number | null>(
    initialEndorsementId,
  );

  // Last-persisted values — used to compute dirty state
  const [savedValues, setSavedValues] = useState<Record<string, any>>({});
  const savedValuesRef = useRef<Record<string, any>>({});

  // Current watched form values — triggers dirty recompute
  const [watchedValues, setWatchedValues] = useState<Record<string, any>>({});

  const [detailsLoaded, setDetailsLoaded] = useState(!initialEndorsementId);
  const [documents, setDocuments] = useState<ExtensionDocument[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const PAGE_SIZE_OPTIONS = [10, 25, 50];

  const isDirty = !valuesEqual(watchedValues, savedValuesRef.current);

  const isNonFinancial = !!(
    watchedValues.endorsementType &&
    watchedValues.endorsementType !== 'FINANCIAL_ENDORSEMENT'
  );

  const formConfig = React.useMemo(
    () => getPolicyExtensionFormConfig(currentPolicyTo, isNonFinancial),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPolicyTo, isNonFinancial],
  );

  // Prefill premium with 0 only when the user actively switches to non-financial.
  // Do NOT fire on initial load or after save (when isNonFinancial stays true).
  useEffect(() => {
    const wasNonFinancial = prevIsNonFinancialRef.current;
    prevIsNonFinancialRef.current = isNonFinancial;
    if (isNonFinancial && !wasNonFinancial) {
      formMethodsRef.current?.setValue('premium', 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNonFinancial]);

  // Keep the form's internal endorsementType in sync with the prop
  useEffect(() => {
    formMethodsRef.current?.setValue("endorsementType", endorsementType ?? "");
  }, [endorsementType]);

  // After fetching details and the form has mounted, push endorsementType into
  // the form so that showField conditions react.
  useEffect(() => {
    if (!detailsLoaded) return;
    const fetched = savedValuesRef.current.endorsementType;
    if (fetched) {
      formMethodsRef.current?.setValue("endorsementType", fetched);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailsLoaded]);

  const fetchDocuments = useCallback(
    async (eid: number, page = 1, limit = 10) => {
      try {
        const resp = await apiRequest(
          endPoints.listPolicyExtensionDocuments(policyId, eid, page, limit),
          { method: HTTP_METHODS.GET },
        );
        setDocuments(resp?.data?.data ?? []);
        setTotalDocuments(resp?.data?.total ?? 0);
      } catch {
        // silently ignore
      }
    },
    [policyId],
  );

  useEffect(() => {
    if (activeEndorsementId) {
      fetchDocuments(activeEndorsementId, currentPage, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEndorsementId, currentPage, pageSize]);

  // Fetch saved extension details when opening an existing endorsement
  useEffect(() => {
    if (!initialEndorsementId) return;
    (async () => {
      try {
        const resp = await apiRequest(
          endPoints.getExtensionDetails(policyId, initialEndorsementId),
          { method: HTTP_METHODS.GET },
        );
        const d = resp?.data;
        if (d) {
          const loaded = {
            extensionDate: d.extensionDate ?? "",
            premium: d.premium ?? "",
            remarks: d.remarks ?? "",
            endorsementType: d.endorsementType ?? "",
          };
          setSavedValues(loaded);
          savedValuesRef.current = loaded;
          setWatchedValues(loaded);
          if (d.endorsementType) {
            onDetailsLoadedRef.current?.({ endorsementType: d.endorsementType });
          }
        }
      } catch {
        // silently ignore — form stays empty
      } finally {
        setDetailsLoaded(true);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const docColumns = useMemo<ColDef[]>(
    () => [
      {
        field: "fileName",
        headerName: "File Name",
        flex: 2,
        // setSort on this table is a no-op (see below) — pagination is real
        // but sort never reaches the backend, so disable the misleading arrow.
        sortable: false,
        cellRenderer: (params: any) => {
          const doc = params.data as ExtensionDocument;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = doc.downloadUrl;
                  a.download = doc.fileName;
                  a.target = "_blank";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
              >
                <img src={DownloadIcon} alt="Download" style={{ width: 16, height: 16 }} />
              </IconButton>
              <span>{doc.fileName}</span>
            </Box>
          );
        },
      },
      {
        field: "uploadedAt",
        headerName: "Upload Time",
        flex: 1,
        sortable: false,
        valueFormatter: ({ value }) => {
          if (!value) return "--";
          const d = new Date(value);
          if (isNaN(d.getTime())) return "--";
          const datePart = new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(d);
          const timePart = d.toLocaleTimeString();
          return `${datePart}, ${timePart}`;
        },
      },
    ],
    [],
  );

  const extensionUploadConfig = useMemo<FormFieldConfig[]>(
    () => [
      {
        key: "extensionDocuments",
        name: "extensionDocuments",
        label: "",
        type: "documentupload",
        gridColumn: 9,
        hideDropdown: true,
        componentProps: {
          fullWidth: true,
          customVariant: "endorsementDoc",
          requireDocumentType: false,
          companyType: "policy",
          companyId: String(policyId),
          disabled: !extensionDone,
          hideUploadedFilesPreview: true,
          allowMultipleFiles: true,
          uploadEndpoint: endPoints.uploadPolicyExtensionDocument(
            policyId,
            activeEndorsementId ?? 0,
          ),
          onUploadSuccess: () => {
            if (activeEndorsementId) {
              setCurrentPage(1);
              fetchDocuments(activeEndorsementId, 1, pageSize);
            }
          },
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [policyId, activeEndorsementId, extensionDone],
  );

  // ── Refetch details and sync form + dirty baseline ────────────────────────
  const refetchAndSync = useCallback(async (eid: number) => {
    try {
      const resp = await apiRequest(
        endPoints.getExtensionDetails(policyId, eid),
        { method: HTTP_METHODS.GET },
      );
      const d = resp?.data;
      if (!d) return;
      const fetched = {
        extensionDate: d.extensionDate ?? "",
        premium: d.premium ?? "",
        remarks: d.remarks ?? "",
        endorsementType: d.endorsementType ?? "",
      };
      setSavedValues(fetched);
      savedValuesRef.current = fetched;
      setWatchedValues(fetched);
      // Push values directly into the form so the display updates immediately
      formMethodsRef.current?.setValue('extensionDate', fetched.extensionDate);
      formMethodsRef.current?.setValue('premium', fetched.premium);
      formMethodsRef.current?.setValue('remarks', fetched.remarks);
      formMethodsRef.current?.setValue('endorsementType', fetched.endorsementType);
    } catch {
      // silently ignore — form keeps whatever the user entered
    }
  }, [policyId]);

  // ── Save handler ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    const methods = formMethodsRef.current;
    if (!methods) return;

    const isValid = await methods.trigger();
    if (!isValid) return;

    const values = methods.getValues();
    setSaving(true);
    try {
      const resp = await apiRequest(
        endPoints.submitPolicyExtension(policyId),
        {
          method: HTTP_METHODS.POST,
          data: {
            extensionDate: values.extensionDate,
            endorsementType: endorsementType ?? null,
            premium:
              values.premium !== null &&
              values.premium !== undefined &&
              values.premium !== ""
                ? parseFloat(String(values.premium))
                : null,
            remarks: values.remarks || null,
            osTicketNumber: osTicketNumber ?? null,
            endorsementRequestReceivedDate: endorsementRequestReceivedDate ?? null,
            endorsementId: activeEndorsementId ?? null,
          },
        },
      );
      const newEndorsementId = resp?.data?.endorsementId;

      setExtensionDone(true);
      setActiveEndorsementId(newEndorsementId);
      // Refetch from the server so the form shows exactly what was persisted
      await refetchAndSync(newEndorsementId);
      dispatch(setToastMessage("Policy extension saved successfully"));
      onSuccess(newEndorsementId);
    } catch (err: any) {
      const msg = Array.isArray(err?.message)
        ? err.message[0]
        : err?.message ?? "Failed to save policy extension";
      dispatch(setToastMessage(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
      {detailsLoaded && (
        <DynamicForm
          formConfig={formConfig}
          defaultValues={{ iirnPolicyNumber, endorsementType, ...savedValues }}
          formMethods={(methods: any) => {
            formMethodsRef.current = methods;
            watchUnsubscribeRef.current?.();
            const { unsubscribe } = methods.watch((values: Record<string, any>) => {
              setWatchedValues({ ...values });
            });
            watchUnsubscribeRef.current = unsubscribe;
          }}
          sx={{ padding: 0 }}
          disableAllFields={!!isStep2Complete}
        />
      )}

      <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
        <Button
          variantType="secondary"
          onClick={onCancel}
          disabled={extensionDone || !!isStep2Complete}
        >
          Cancel
        </Button>
        <Button
          variantType="primary"
          onClick={handleSave}
          disabled={!isDirty || !!isStep2Complete || saving}
          loading={saving}
        >
          Save
        </Button>
      </Box>

      <Box
        sx={{
          mt: 2,
          opacity: extensionDone ? 1 : 0.5,
          pointerEvents: extensionDone ? "auto" : "none",
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: colors.text.primary }}>
          Upload Documents
        </Typography>
        <DynamicForm
          formConfig={extensionUploadConfig}
          sx={{ padding: 0 }}
        />

        {totalDocuments > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Uploaded Documents
            </Typography>
            <Table
              columns={docColumns}
              rowData={documents}
              totalRows={totalDocuments}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              loading={false}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              setPageSize={(size) => { setPageSize(size); setCurrentPage(1); }}
              onCellClicked={() => {}}
              setSort={() => {}}
              title=""
              domLayout="autoHeight"
              displaySettingsButton={false}
              enableSaveView={false}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PolicyExtensionForm;
