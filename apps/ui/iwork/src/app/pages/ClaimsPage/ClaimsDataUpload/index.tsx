import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  apiRequest,
  Button,
  ChipRenderer,
  CUSTOM_PAGE_SIZE,
  DynamicForm,
  endPoints,
  formatCurrencyByLocalization,
  formatNumberByLocalization,
  HTTP_METHODS,
  setToastMessage,
  Table,
  theme,
  useTableController,
  useHasPermission,
  FeatureKey,
} from "@ui/ui-lib";
import { environment } from "@ui/ui-lib/environment";
import { useDispatch } from "react-redux";
import { ClaimsDataUploadConfig, claimsUploadBatchColumns } from "./config";
import {
  CLAIMS_DATA_UPLOAD,
  DATA_PROCESSING_STATUS,
  ENDORSEMENT_TOASTS,
  TEMP_NUM,
  YOUR_DATA_IS_PROCESSING,
} from "../../../constants";
import {
  CardsHolderContainer,
  ContentHolder,
  LabelTypography,
  TitleTypography,
  ValueTypography,
} from "../../EndorsementPage/EndorsementDetails/styles";
import { ClaimsDataContainer, ClaimsCardWrapper } from "../styles";
import {
  RefreshWrapper,
  RefreshStatusText,
  RefreshControls,
  RefreshSpinner,
  RefreshContentContainer,
  RefreshHeaderTypography,
  TableContainer,
  FileNameWrapper,
  DownloadIcon
} from "../../EndorsementPage/EndorsementDetails/RenderEndorsementRequestStep/styles";
import EndorsementProcessDataCard from "../../../components/EndorsementProcessDataCard";
import ActionButton from "@ui/ui-lib/commonComponents/ActionButton";
import TextRenderer from "../../../common/TextRenderer";
import RefreshIcon from "../../../assets/svgs/refresh-icon.svg";
import downloadIcon from "../../../assets/svgs/download-icon.svg";
import dayjs from "dayjs";

type Props = {
  policyId?: number;
  tpaId?: number;
  setUploadFormMethods?: (m: any) => void; // parent receives DynamicForm methods
  uploadFormMethods?: any;
  setEndorsementId?: (id: number | null) => void;
  disableAllFields?: boolean;
  endorsementId?: number | null;
  onUploadSuccess?: (fileId?: number) => void;
  config?: any;
  isTpaUpload?: boolean;
  isExportEnabled?: boolean;
};

const DEFAULT_CLAIM_TEMPLATE_TYPE = "GMC";

const ClaimsDataUpload: React.FC<Props> = ({
  policyId,
  tpaId,
  setUploadFormMethods,
  uploadFormMethods,
  disableAllFields,
  onUploadSuccess,
  isTpaUpload = false,
}) => {
  const dispatch = useDispatch();
  const hasExportPermission = useHasPermission(FeatureKey.EXPORT_CLAIMS);
  // TODO: This logic is intentionally inverted as a temporary workaround to match the pattern in
  // EndorsementDataUploadPage. When FF_IWORK_DOCUMENT_DOWNLOAD is OFF, downloads are allowed by default.
  // This should be corrected to `FF && hasPermission` once the feature flag rollout is complete.
  const isDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasExportPermission;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const processedDocumentRef = useRef<number | null>(null);

  // Use tpaId if in TPA mode, otherwise use policyId
  const entityId = isTpaUpload ? tpaId : policyId;

  const {
    rowData,
    totalRows,
    currentPage,
    loading,
    setCurrentPage,
    pageSize,
    setPageSize,
    PAGE_SIZE_OPTIONS,
    setSort,
    summaryRowData,
    refetch,
  } = useTableController({
    endpoint: endPoints.getAllClaimsBatch,
    customPathParam: isTpaUpload
      ? `tpaId=${Number(entityId)}`
      : `policyId=${Number(entityId)}`,
    searchFieldName: isTpaUpload ? "tpaName" : "policyName",
    defaultPageSize: CUSTOM_PAGE_SIZE,
    enabled: !!entityId,
  });

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refetch();
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const handleUploadSuccess = useCallback(() => {
    refetch();
    onUploadSuccess?.();
  }, [refetch, onUploadSuccess]);

  // Watch for file upload completion and automatically POST to claims-upload
  useEffect(() => {
    if (!uploadFormMethods) return;

    const sub = uploadFormMethods.watch(async (vals, { name }) => {
      // Check if file was uploaded (watch for documents field which contains the file)
      if (name === "documents" || name === "fileUpload") {
        const fileUpload = vals?.documents?.[0]?.fileUpload || vals?.fileUpload;

        if (fileUpload?.id) {
          const documentId = Number(fileUpload.id);

          // Prevent duplicate processing
          if (processedDocumentRef.current === documentId) {
            return;
          }

          processedDocumentRef.current = documentId;

          try {
            // Get form values
            const claimsUploadDate = vals?.claimsUploadDate;
            const totalClaims = vals?.totalClaims;

            const claimsUploadDateIso =
              claimsUploadDate instanceof Date
                ? claimsUploadDate.toISOString()
                : typeof claimsUploadDate === "string" && claimsUploadDate
                  ? new Date(claimsUploadDate).toISOString()
                  : null;

            const payload: any = {
              fileId: documentId,
              claimsUploadDate: claimsUploadDateIso,
              totalClaims: Number(totalClaims ?? 0),
            };

            // Add policyId or tpaId based on mode
            if (isTpaUpload) {
              payload.tpaId = Number(entityId);
            } else {
              payload.policyId = Number(entityId);
            }

            await apiRequest(endPoints.claimsUpload, {
              method: HTTP_METHODS.POST,
              data: payload,
            });

            dispatch(
              setToastMessage(ENDORSEMENT_TOASTS.FILE_UPLOADED_SUCCESSFULLY),
            );

            handleUploadSuccess();
          } catch (err: any) {
            console.error("Claims upload error:", err);
            const msg = Array.isArray(err?.message)
              ? err.message[0]
              : err?.message ||
              "Something went wrong while processing the file.";
            dispatch(setToastMessage(msg));
          }
        }
      }
    });

    return () => sub.unsubscribe?.();
  }, [uploadFormMethods, handleUploadSuccess, dispatch, entityId, isTpaUpload]);

  const handleDownload = async (errorFileUploadId: number) => {
    try {
      if (!errorFileUploadId) {
        dispatch(setToastMessage(ENDORSEMENT_TOASTS.INVALID_SELECTION));
        return;
      }

      const downloadUrl = endPoints.fileUploadDownloadById(errorFileUploadId);
      const response = await apiRequest(downloadUrl, {
        method: "GET",
        responseType: "blob",
      });

      const blob = response.data as Blob;

      // Check if response is an error page
      if (blob.type.includes("text/html")) {
        const text = await blob.text();
        if (text.includes("<html")) {
          dispatch(
            setToastMessage(
              ENDORSEMENT_TOASTS.DOWNLOAD_FAILED_SERVER_RETURNED_ERROR,
            ),
          );
          return;
        }
      }

      let filename = "error-report.xlsx";
      const contentDisposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      dispatch(
        setToastMessage(
          ENDORSEMENT_TOASTS.ERROR_REPORT_DOWNLOADED_SUCCESSFULLY,
        ),
      );
    } catch (err) {
      console.error("Download error:", err);
      dispatch(setToastMessage(ENDORSEMENT_TOASTS.DOWNLOAD_FAILED_TRY_AGAIN));
    }
  };

  const handleFileDownload = async (item: any) => {
    if (!isDownloadAllowed) return; // Prevent download if not allowed

    try {
      const response = await apiRequest(
        `${endPoints.fileUploadDownload}/${item.id}/download`,
        {
          method: "GET",
          responseType: "blob",
        },
      );

      const blob = response.data as Blob;

      if (blob.type.includes("text/html")) {
        const text = await blob.text();
        console.error("Received HTML instead of file:", text);
        dispatch(
          setToastMessage("Download failed — server returned an error page."),
        );
        return;
      }

      let filename = item?.fileName || "download";

      const contentDisposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"\n]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      dispatch(setToastMessage("Download failed. Try again."));
    }
  };

  const FileNameRenderer = (params: any) => {
    const fileName = params.value;
    const sourceFileId = params.data?.sourceFileId;

    if (!fileName || !sourceFileId) {
      return <span>--</span>;
    }

    return (
      <FileNameWrapper
        onClick={isDownloadAllowed ? () => handleFileDownload({ id: sourceFileId, fileName }) : undefined}
        style={{ cursor: isDownloadAllowed ? "pointer" : "default", display: 'flex', alignItems: 'center', gap: 8 }}
      >
        {isDownloadAllowed && (
          <DownloadIcon
            title="Click to download file"
            src={downloadIcon}
            alt="download"
          />
        )}
        <span>{fileName}</span>
      </FileNameWrapper>
    );
  };

  const ActionButtonRenderer = (params: any) => {
    const errorFileId = params.data?.errorFileId;
    if (!errorFileId) {
      return <span></span>;
    }
    return (
      <ActionButton
        errorFileSize={params.data?.errorFile?.fileSize}
        onClick={isDownloadAllowed ? () => handleDownload(errorFileId) : undefined}
        isIconVisible={isDownloadAllowed}
        disabled={!isDownloadAllowed}
      />
    );
  };

  const summaryCards = useMemo(
    () => [
      {
        label: "Total records",
        value: summaryRowData?.totalClaimRecords || 0,
        color:
          (theme as any).palette.button?.secondary ||
          (theme as any).palette.secondary?.main,
        borderColor:
          (theme as any).palette.button?.secondary ||
          (theme as any).palette.secondary?.main,
      },
      {
        label: "Success",
        value: summaryRowData?.totalSuccessRecords || 0,
        color:
          (theme as any).palette.text?.success ||
          (theme as any).palette.success?.main,
        borderColor:
          (theme as any).palette.text?.success ||
          (theme as any).palette.success?.main,
      },
      {
        label: "Failed",
        value: summaryRowData?.totalFailedRecords || 0,
        color: (theme as any).palette.error?.main,
        borderColor: (theme as any).palette.error?.main,
      },
      {
        label: "Settled count",
        value: summaryRowData?.totalSettledClaimRecords || 0,
        color:
          (theme as any).palette.text?.success ||
          (theme as any).palette.success?.main,
        borderColor:
          (theme as any).palette.text?.success ||
          (theme as any).palette.success?.main,
      },
      {
        label: "Settled amount",
        value: summaryRowData?.settledClaimAmount || 0,
        color:
          (theme as any).palette.text?.success ||
          (theme as any).palette.success?.main,
        borderColor:
          (theme as any).palette.text?.success ||
          (theme as any).palette.success?.main,
        isCurrency: true,
      },
      {
        label: "Pending amount",
        value: summaryRowData?.claimAmountPendingForSettlement || 0,
        color:
          (theme as any).palette.button?.secondary ||
          (theme as any).palette.secondary?.main,
        borderColor:
          (theme as any).palette.button?.secondary ||
          (theme as any).palette.secondary?.main,
        isCurrency: true,
      },
    ],
    [summaryRowData],
  );

  const handleDownloadTemplate = useCallback(async () => {
    if (!isDownloadAllowed) return;

    try {
      const tmpl = await apiRequest(
        `${endPoints.claimsTemplateDownload}?claimType=${encodeURIComponent(
          DEFAULT_CLAIM_TEMPLATE_TYPE
        )}&${isTpaUpload ? `tpaId=${entityId}` : `policyId=${entityId}`}`,
        { method: HTTP_METHODS.GET }
      );
      const documentId = tmpl?.data?.documentId;
      const fallbackFileName = tmpl?.data?.fileName || "template.xlsx";
      if (!documentId) {
        dispatch(
          setToastMessage(ENDORSEMENT_TOASTS.TEMPLATE_GENERATION_FAILED),
        );
        return;
      }

      const resp = await apiRequest(
        `${endPoints.fileUploadDownload}/${documentId}/download`,
        { method: HTTP_METHODS.GET, responseType: "blob" },
      );

      const blob = resp.data as Blob;
      const textCheck = await blob.slice().text();
      if (blob.type.includes("text/html") && textCheck.includes("<html")) {
        dispatch(
          setToastMessage(
            ENDORSEMENT_TOASTS.DOWNLOAD_FAILED_SERVER_RETURNED_ERROR,
          ),
        );
        return;
      }

      let filename = fallbackFileName;
      const cd =
        (resp as any).headers?.["content-disposition"] ||
        (resp as any).headers?.get?.("content-disposition");
      const m = cd && String(cd).match(/filename=\"?([^\";]+)\"?/);
      if (m?.[1]) filename = m[1];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      dispatch(
        setToastMessage(ENDORSEMENT_TOASTS.TEMPLATE_DOWNLOADED_SUCCESSFULLY),
      );
    } catch (e) {
      console.error("download template error:", e);
      dispatch(setToastMessage(ENDORSEMENT_TOASTS.DOWNLOAD_FAILED_TRY_AGAIN));
    }
  }, [dispatch, isDownloadAllowed]);

  return (
    <>
      <TitleTypography>{CLAIMS_DATA_UPLOAD}</TitleTypography>
      <DynamicForm
        formConfig={ClaimsDataUploadConfig(Number(entityId), "claims", 596, isDownloadAllowed)}
        defaultValues={{
          documentType: TEMP_NUM,
          claimsUploadDate: dayjs().format("YYYY-MM-DD"),
        }}
        formMethods={setUploadFormMethods as any}
        onActionMap={{ downloadTemplate: handleDownloadTemplate }}
        disableAllFields={disableAllFields}
      />

      {/* Data Processing Status Section */}
      <ClaimsDataContainer>
        <RefreshWrapper>
          <RefreshHeaderTypography>
            {DATA_PROCESSING_STATUS}
          </RefreshHeaderTypography>
          <RefreshContentContainer data-testid="refresh-container">
            <RefreshStatusText>{YOUR_DATA_IS_PROCESSING}</RefreshStatusText>
            <RefreshControls>
              <Button
                variantType="link"
                label="Refresh"
                onClick={handleManualRefresh}
                size="small"
              />
              {isRefreshing && (
                <RefreshSpinner src={RefreshIcon} alt="Refreshing" />
              )}
            </RefreshControls>
          </RefreshContentContainer>
        </RefreshWrapper>

        <TitleTypography>Claims Uploaded Data Table</TitleTypography>

        <CardsHolderContainer>
          {summaryCards.map((c) => (
            <EndorsementProcessDataCard
              key={c.label}
              styling={{
                borderColor: c.borderColor,
                width: "100%",
                height: "110px",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ContentHolder>
                <LabelTypography>{c.label}</LabelTypography>
                <ValueTypography styling={{ color: c.color }}>
                  {formatNumberByLocalization(c.value)}
                </ValueTypography>
              </ContentHolder>
            </EndorsementProcessDataCard>
          ))}
        </CardsHolderContainer>

        <TableContainer>
          <Table
            columns={claimsUploadBatchColumns}
            rowData={rowData}
            totalRows={totalRows}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            setPageSize={setPageSize}
            onCellClicked={() => { }}
            onPrimaryActionClick={() => { }}
            setSort={setSort}
            title={""}
            components={{
              ChipRenderer,
              ActionButton: ActionButtonRenderer,
              TextRenderer,
              FileNameRenderer,
            }}
            height={250}
          />
        </TableContainer>
      </ClaimsDataContainer>
    </>
  );
};

export default ClaimsDataUpload;
