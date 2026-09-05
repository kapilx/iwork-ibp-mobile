import {
  apiRequest,
  Button,
  ChipRenderer,
  CUSTOM_PAGE_SIZE,
  DynamicForm,
  endPoints,
  formatNumberByLocalization,
  FormFieldConfig,
  LoaderOverlay,
  setToastMessage,
  SUCCESS_MESSAGE,
  Table,
  theme,
  useApiMutation,
  useTableController,
  useHasPermission,
  FeatureKey,
  environment,
} from "@ui/ui-lib";
import {
  CardsHolderContainer,
  ContentHolder,
  LabelTypography,
  RenderEndorsementRequestComponent,
  TitleTypography,
  ValueTypography,
} from "../styles";
import EndorsementDataUploadPage from "../../EndorsementDataUpload/EndorsementDataUploadPage";
import { Container } from "../../../../components/EmployeeBatch/styles";
import EndorsementProcessDataCard from "../../../../components/EndorsementProcessDataCard";
import { employeeBatches } from "../../../../components/EmployeeBatch/config";
import ActionButton from "@ui/ui-lib/commonComponents/ActionButton";
import TextRenderer from "../../../../common/TextRenderer";
import React, {
  FC,
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import { useDispatch } from "react-redux";
import { Box, CircularProgress } from "@mui/material";
import {
  RefreshWrapper,
  RefreshStatusText,
  RefreshControls,
  RefreshSpinner,
  RefreshContentContainer,
  RefreshHeaderTypography,
  TableContainer,
  FileNameWrapper,
  DownloadIcon,
} from "./styles";
import RefreshIcon from "../../../../assets/svgs/refresh-icon.svg";
import downloadIcon from "../../../../assets/svgs/download-icon.svg";
import {
  ALERT_MESSAGES,
  CREATED,
  DATA_PROCESSING_COMPLETE_NO_SUCCESS,
  DATA_PROCESSING_COMPLETE_SUCCESS,
  DATA_PROCESSING_FAILED,
  DATA_PROCESSING_STATUS,
  DOCUMENT_TYPE_POLICY_EXTENSION,
  ENDORSEMENT_TOASTS,
  FAILED,
  PROCESSING,
  YOUR_DATA_IS_PROCESSING,
} from "../../../../constants";
import dayjs from "dayjs";
import {
  EndorsementRequestReceivedConfigDefaultValues,
  INCEPTIONRequestReceivedConfigDefaultValues,
} from "../config";
import { useLocation, useParams } from "react-router-dom";
import { CreationType } from "../creationFlowConfigs";
interface RenderEndorsementRequestComponentProps {
  config: any;
  setFormMethods: (methods: any) => void;
  uploadFormMethods: any;
  setUploadFormMethods: (methods: any) => void;
  policyId: number;
  setIsEndorsementPending: React.Dispatch<React.SetStateAction<boolean>>;
  isEndorsementPending: boolean;
  endorsementId: number | null;
  stateData?: any;
  formMethods?: any;
  setEndorsementId: React.Dispatch<React.SetStateAction<number | null>>;
  overAllData: any;
  summaryRef: React.RefObject<HTMLDivElement>;
  creationLabel: string;
  creationType?: CreationType;
  isGroupPolicyType: boolean;
  onPolicyExtended?: () => void;
}

const RenderEndorsementRequestComponentUI: FC<
  RenderEndorsementRequestComponentProps
> = ({
  config,
  setFormMethods,
  uploadFormMethods,
  setUploadFormMethods,
  policyId,
  setIsEndorsementPending,
  isEndorsementPending,
  endorsementId,
  stateData,
  formMethods,
  setEndorsementId,
  overAllData,
  summaryRef,
  creationLabel,
  creationType,
  isGroupPolicyType,
  onPolicyExtended,
}) => {
  const dispatch = useDispatch();
  const hasInceptionPermission = useHasPermission(FeatureKey.EXPORT_INCEPTION);
  const hasEndorsementPermission = useHasPermission(FeatureKey.EXPORT_ENDORSEMENTS);
  const hasRbacPermission = creationType === "inception" ? hasInceptionPermission : hasEndorsementPermission;
  const isDownloadAllowed =
    !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    policyId: policyIdParam,
    creationType: creationTypeParam,
    endorsementId: endorsementIdFromParams,
  } = useParams<{
    policyId?: string;
    creationType?: string;
    endorsementId?: string;
  }>();
  const endPoint =
    endorsementId !== null && endorsementId !== undefined
      ? endPoints.enrollmentUploadSummaryByEndorsement(
          Number(policyId),
          Number(endorsementId)
        )
      : undefined;

  const summaryCustomPathParam = isGroupPolicyType
    ? undefined
    : "usePolicyAssetEndorsement=true";

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
    endpoint: endPoint,
    searchFieldName: "policyName",
    defaultPageSize: CUSTOM_PAGE_SIZE,
    enabled: !!endPoint,
    customPathParam: summaryCustomPathParam,
  });
  const [pendingScroll, setPendingScroll] = useState(false);
  const [processingEnrollmentFileId, setProcessingEnrollmentFileId] = useState<
    number | null
  >(null);
  const processingEnrollmentFileIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Policy extension uploads are completely ignored for the Next button.
    // Next depends solely on asset enrollment upload status.
    const assetRows = rowData?.filter(
      (item: any) =>
        item?.documentProcessingFile?.documentType !== DOCUMENT_TYPE_POLICY_EXTENSION
    ) ?? [];

    const checkIsEndorsementPending = assetRows.some(
      (item: any) =>
        item?.documentProcessingFile?.processStatus === CREATED ||
        item?.documentProcessingFile?.processStatus === PROCESSING
    );

    const assetSuccessCount = assetRows.reduce(
      (sum: number, item: any) => sum + (Number(item?.successCount) || 0),
      0
    );

    setIsEndorsementPending(checkIsEndorsementPending || assetSuccessCount === 0);
  }, [rowData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refetch();
    // Fallback timeout; ideally tie to actual loading state of a refetch.
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const handleUploadSuccess = useCallback(() => {
    if (endPoint) refetch();
    setPendingScroll(true);
  }, [refetch, endPoint]);

  useEffect(() => {
    if (pendingScroll && (summaryRowData?.totalRecords > 0 || totalRows > 0)) {
      summaryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setPendingScroll(false);
    }
  }, [pendingScroll, summaryRowData, totalRows, summaryRef]);

  const moduleKey = creationType === "inception" ? "inception" : "endorsement";
  const buildDownloadUrl = (fileId: number) =>
    `${endPoints.fileUploadDownloadById(fileId)}?moduleKey=${encodeURIComponent(
      moduleKey
    )}`;

  const handleDownload = async (errorFileUploadId: number) => {
    try {
      if (!errorFileUploadId) {
        dispatch(setToastMessage(ENDORSEMENT_TOASTS.INVALID_SELECTION));
        return;
      }

      const downloadUrl = buildDownloadUrl(errorFileUploadId);
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
              ENDORSEMENT_TOASTS.DOWNLOAD_FAILED_SERVER_RETURNED_ERROR
            )
          );
          return;
        }
      }

      let filename = "error-report.xlsx"; // Default filename
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
        setToastMessage(ENDORSEMENT_TOASTS.ERROR_REPORT_DOWNLOADED_SUCCESSFULLY)
      );
    } catch (err) {
      console.error("Download error:", err);
      dispatch(setToastMessage(ENDORSEMENT_TOASTS.DOWNLOAD_FAILED_TRY_AGAIN));
    }
  };

  const handleFileDownload = async (item: any) => {
    try {
      const response = await apiRequest(
        `${endPoints.fileUploadDownload}/${item.id}/download?moduleKey=${encodeURIComponent(
          moduleKey
        )}`,
        {
          method: "GET",
          responseType: "blob",
        }
      );

      const blob = response.data as Blob;

      // Only check for HTML if the blob is actually HTML
      if (blob.type.includes("text/html")) {
        const text = await blob.text();
        console.error("Received HTML instead of file:", text);
        dispatch(
          setToastMessage("Download failed — server returned an error page.")
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

      // Create a URL for the Blob and trigger the download
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
    const sourceFile = params.data?.sourceFile;

    if (!fileName || !sourceFile?.id) {
      return <span>--</span>;
    }

    return (
      <FileNameWrapper onClick={() => handleFileDownload(sourceFile)}>
        {isDownloadAllowed && (
          <DownloadIcon
            title="Click to download file"
            src={downloadIcon}
            alt="download"
          />
        )}
        {fileName}
    </FileNameWrapper>
    );
  };

  // Create modified columns with FileNameRenderer for the fileName column
  const modifiedEmployeeBatches = useMemo(() => {
    return employeeBatches.map((col) => {
      if (col.field === "sourceFile.fileName") {
        return {
          ...col,
          cellRenderer: "FileNameRenderer",
        };
      }
      return col;
    });
  }, []);

  const ActionButtonRenderer = (params: any) => {
    const errorFileId = params.data?.errorFile?.id;
    if (!errorFileId) {
      return <span></span>;
    }
    return (
      <ActionButton
        errorFileSize={params.data?.errorFile?.fileSize}
        onClick={isDownloadAllowed ? () => handleDownload(errorFileId) : undefined}
        isIconVisible={isDownloadAllowed}
      />
    );
  };

  const {
    mutate: triggerEnrollmentProcessing,
    isPending: isEnrollmentMutationPending,
  } = useApiMutation({
    config: {
      onSuccess: async (response) => {
        dispatch(setToastMessage(response?.message || SUCCESS_MESSAGE));
        handleManualRefresh();
      },
      onError: async (error) => {
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
        handleManualRefresh();
      },
    },
  });

  const isEnrollmentProcessingActive =
    isEnrollmentMutationPending || processingEnrollmentFileId !== null;

  const handleEnrollmentProcessing = (row?: any) => {
    if (
      processingEnrollmentFileIdRef.current !== null ||
      isEnrollmentMutationPending
    ) {
      return;
    }

    const endorsementIdNum = Number(endorsementIdFromParams);
    const policyIdNum = Number(policyIdParam);
    const enrollmentFileId = row?.sourceFile?.id; // ← from the clicked row
    const documentType = row?.documentProcessingFile?.documentType; // ← get documentType from row

    if (!endorsementIdNum || !policyIdNum || !enrollmentFileId) {
      dispatch(setToastMessage("Required data missing for processing."));
      return;
    }

    // Choose endpoint based on documentType
    const endpoint =
      documentType === "policy_employee_data"
        ? endPoints.employeeEnrollmentProcess
        : endPoints.enrollmentProcess;

    const payload = {
      endorsementId: endorsementIdNum,
      policyId: policyIdNum,
      enrollmentFileId,
    };

    const employeePayload = {
      documentId: enrollmentFileId,
    };

    try {
      setProcessingEnrollmentFileId(enrollmentFileId);
      processingEnrollmentFileIdRef.current = enrollmentFileId;
      triggerEnrollmentProcessing(
        {
          endpoint: endpoint,
          method: documentType === "policy_employee_data" ? "POST" : "PUT",
          data:
            documentType === "policy_employee_data" ? employeePayload : payload,
        },
        {
          onSettled: () => {
            setProcessingEnrollmentFileId(null);
            processingEnrollmentFileIdRef.current = null;
          },
        }
      );
    } catch (err) {
      console.error("Failed to update covers:", err);
      dispatch(setToastMessage("Failed to update covers."));
      setProcessingEnrollmentFileId(null);
      processingEnrollmentFileIdRef.current = null;
    }
  };
  const ProcessEnrollmentActionButtonRenderer = (params: any) => {
    const row = params?.data;
    const status = row?.documentProcessingFile?.processStatus;
    if (status !== "CREATED") return null;

    return (
      <Button
        sizeType="small"
        onClick={() => handleEnrollmentProcessing(row)}
        disabled={isEnrollmentProcessingActive}
        variantType="secondary"
      >
        Initiate file processing
      </Button>
    );
  };

  useEffect(() => {
    if (
      formMethods &&
      (endorsementIdFromParams ||
        overAllData?.endorsementRequestReceived?.isCompleted)
    ) {
      const stateToSet = stateData?.data?.endorsementRequestReceived;
      const resetFormFields = {
        endorsementRequestReceivedDate:
          stateToSet?.endorsementRequestReceivedDate,
        ...(stateToSet?.endorsementType !== 'EXTENSION'
          ? { endorsementType: stateToSet?.endorsementType }
          : {}),
        osTicketNumber: stateToSet?.osTicketNumber,
      };
      formMethods.reset(resetFormFields || {});
    }
  }, [
    stateData,
    formMethods,
    endorsementIdFromParams,
    overAllData?.endorsementRequestReceived?.isCompleted,
  ]);

  // When the flag is off, Step-1 must stay disabled once endorsement creation
  // is complete, and the Member Data Upload option must never appear — so the
  // re-enable-on-acknowledgement behavior below only applies when it's on.
  const isMemberUploadEnabled = environment.featureFlag.FF_IWORK_MEMBER_UPLOAD;

  let disableAllFields = false;
  if (
    overAllData?.createEndorsement?.isCompleted &&
    overAllData?.createEndorsement?.stepOrder >= 2 &&
    (!isMemberUploadEnabled ||
      !overAllData?.receiveInsurerAcknowledgement?.isCompleted)
  ) {
    disableAllFields = true;
  }

  const showMemberDataUpload =
    isMemberUploadEnabled &&
    !!overAllData?.receiveInsurerAcknowledgement?.isCompleted;

  const refreshStatusMessage = useMemo((): string => {
    // If any file is still processing or created, show processing message
    const isProcessing = rowData?.some(
      (item: any) =>
        item?.documentProcessingFile?.processStatus === CREATED ||
        item?.documentProcessingFile?.processStatus === PROCESSING
    );
    if (isProcessing) {
      return YOUR_DATA_IS_PROCESSING;
    }

    // If processing is complete, check for success records
    if (summaryRowData) {
      if ((summaryRowData.successCount || 0) > 0) {
        return DATA_PROCESSING_COMPLETE_SUCCESS;
      }
      if (
        (summaryRowData.totalRecords || 0) > 0 &&
        (summaryRowData.successCount || 0) === 0
      ) {
        return DATA_PROCESSING_COMPLETE_NO_SUCCESS;
      }
    }

    // Processing finished (no CREATED/PROCESSING files) but nothing ever
    // succeeded and there's no positive totalRecords to explain it — that's
    // only possible when the file itself failed outright.
    const isFailed = rowData?.some(
      (item: any) => item?.documentProcessingFile?.processStatus === FAILED
    );
    if (isFailed) {
      return DATA_PROCESSING_FAILED;
    }

    // Default to processing message if no data
    return YOUR_DATA_IS_PROCESSING;
  }, [rowData, summaryRowData]);

  const savedEnrollmentDates = useMemo(() => {
    const stepData =
      stateData?.data?.endorsementRequestReceived ??
      overAllData?.endorsementRequestReceived?.data?.endorsementRequestReceived;
    return {
      enrollmentStartDate: stepData?.enrollmentStartDate ?? null,
      enrollmentEndDate: stepData?.enrollmentEndDate ?? null,
    };
  }, [stateData, overAllData]);

  const existingDocType = useMemo(() => {
    if (!rowData?.length) return undefined;
    const firstNonExtension = rowData.find(
      (item: any) => item?.documentProcessingFile?.documentType !== "policy_extension"
    );
    return firstNonExtension?.documentProcessingFile?.documentType as string | undefined;
  }, [rowData]);

  // Memoized card meta to avoid repetition in JSX
  const summaryCards = useMemo(
    () => [
      {
        label: "Total records",
        value: summaryRowData?.totalRecords || 0,
        color:
          (theme as any).palette.button?.secondary ||
          (theme as any).palette.secondary?.main,
        borderColor:
          (theme as any).palette.button?.secondary ||
          (theme as any).palette.secondary?.main,
      },
      {
        label: "Success",
        value: summaryRowData?.successCount || 0,
        color:
          (theme as any).palette.text?.success ||
          (theme as any).palette.success?.main,
        borderColor:
          (theme as any).palette.text?.success ||
          (theme as any).palette.success?.main,
      },
      {
        label: "Failed",
        value: summaryRowData?.failureCount || 0,
        color: (theme as any).palette.error?.main,
        borderColor: (theme as any).palette.error?.main,
      },
    ],
    [summaryRowData]
  );

  const formConfig =
    creationType === "inception"
      ? config.InceptionRequestReceivedConfig
      : config.EndorsementRequestReceivedConfig.map(
          (configParam: FormFieldConfig) => {
            if (configParam.key === "endorsementType") {
              return {
                ...configParam,
                disabled:
                  overAllData?.endorsementRequestReceived?.data
                    ?.endorsementRequestReceived?.osTicketNumber?.length, // If OS Ticket Number exists, endorsement creation done
              };
            }
            return configParam;
          }
        );

  const formdefaultValues =
    creationType === "inception"
      ? INCEPTIONRequestReceivedConfigDefaultValues
      : EndorsementRequestReceivedConfigDefaultValues;

  return (
    <RenderEndorsementRequestComponent>
      <DynamicForm
        formConfig={formConfig}
        formMethods={setFormMethods}
        defaultValues={formdefaultValues}
        disableAllFields={disableAllFields}
      />
      <EndorsementDataUploadPage
        policyId={policyId}
        methods={uploadFormMethods}
        setMethods={setUploadFormMethods}
        setEndorsementId={setEndorsementId}
        disableAllFields={disableAllFields}
        endorsementId={endorsementId}
        formMethods={formMethods}
        onUploadSuccess={handleUploadSuccess}
        creationLabel={creationLabel}
        creationType={creationType}
        isGroupPolicyType={isGroupPolicyType}
        savedEnrollmentDates={savedEnrollmentDates}
        onPolicyExtended={onPolicyExtended}
        existingDocType={existingDocType}
        showMemberDataUpload={showMemberDataUpload}
      />
      {summaryRowData &&
        (summaryRowData?.totalRecords > 0 || totalRows > 0) && (
          <Container sx={{ maxWidth: "860px" }} ref={summaryRef}>
            {
              <RefreshWrapper>
                <RefreshHeaderTypography>
                  {DATA_PROCESSING_STATUS}
                </RefreshHeaderTypography>
                <RefreshContentContainer data-testid="refresh-container">
                  <RefreshStatusText>{refreshStatusMessage}</RefreshStatusText>
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
            }
            <TitleTypography>
              {`${creationLabel} Uploaded Data Table`}
            </TitleTypography>
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
              {isEnrollmentProcessingActive && (
                <LoaderOverlay data-testid="enrollment-processing-loader">
                  <CircularProgress color="secondary" size={32} />
                </LoaderOverlay>
              )}
              <Table
                columns={modifiedEmployeeBatches}
                rowData={rowData}
                totalRows={totalRows}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                loading={loading}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                setPageSize={setPageSize}
                onCellClicked={() => {}}
                onPrimaryActionClick={() => {}}
                setSort={setSort}
                title={""}
                components={{
                  ChipRenderer,
                  ActionButton: ActionButtonRenderer,
                  ProcessEnrollmentButton:
                    ProcessEnrollmentActionButtonRenderer,
                  TextRenderer,
                  FileNameRenderer,
                }}
                height={250}
              />
            </TableContainer>
          </Container>
        )}
    </RenderEndorsementRequestComponent>
  );
};

export default RenderEndorsementRequestComponentUI;
