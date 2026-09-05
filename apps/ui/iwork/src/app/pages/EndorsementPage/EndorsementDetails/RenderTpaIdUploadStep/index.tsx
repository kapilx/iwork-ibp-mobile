import {
  Button,
  ChipRenderer,
  CUSTOM_PAGE_SIZE,
  DynamicForm,
  Table,
  theme,
  useTableController,
  HTTP_METHODS,
  formatNumberByLocalization,
  apiRequest,
  setToastMessage,
  endPoints,
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
import { Container } from "../../../../components/EmployeeBatch/styles";
import EndorsementProcessDataCard from "../../../../components/EndorsementProcessDataCard";
import { employeeBatches } from "../../../../components/EmployeeBatch/config";
import ActionButton from "@ui/ui-lib/commonComponents/ActionButton";
import TextRenderer from "../../../../common/TextRenderer";
import dayjs from "dayjs";
import {
  DATA_PROCESSING_STATUS,
  DATA_PROCESSING_COMPLETE_SUCCESS,
  DATA_PROCESSING_COMPLETE_NO_SUCCESS,
  YOUR_DATA_IS_PROCESSING,
  CREATED,
  PROCESSING,
  ALERT_MESSAGES,
  ENDORSEMENT_TOASTS,
  FAILED,
  PLEASE_CHECK_THE_MAPPING,
  TPA_ID_IS_REQUIRED,
} from "../../../../constants";
import RefreshIcon from "../../../../assets/svgs/refresh-icon.svg";
import downloadIcon from "../../../../assets/svgs/download-icon.svg";
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
} from "../RenderEndorsementRequestStep/styles";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import RenderEndorsementStep, { StepInterface } from "../RenderEndorsementStep";
import { Step } from "../../../../components/NestedStepper/config";

interface TpaIdUploadStepProps {
  config?: Step["config"];
  stepData: any;
  policyId: number;
  endorsementId: number | null;
  tpaId?: number;
  creationLabel: string;
  creationType?: "endorsement" | "inception";
  isGroupPolicyType: boolean;
  summaryRef: React.RefObject<HTMLDivElement>;
  setIsEndorsementPending: React.Dispatch<React.SetStateAction<boolean>>;
  formRef: React.RefObject<StepInterface>;
  stepKey: Step["key"];
}

interface TpaIdUploadFormValues {
  tpaIdUpload?: {
    tpaIdUploadDate?: string;
  };
}

const TPA_DATA_QUERY_PARAM = "tpaData=true";

const TpaUploadFormConfig = [
  {
    key: "uploadTpaFile",
    name: "uploadTpaFile",
    label: "Upload file",
    type: "file" as const,
    gridColumn: 9,
    componentProps: {
      fullWidth: true,
      customVariant: "endorsementDoc",
      accept: ".xlsx,.xls",
      requireDocumentType: false,
      maxLimit: 1,
      downloadTemplateLabel: "Download Template",
    },
    hideDropdown: true,
  },
];

interface TpaUploadSectionProps {
  policyId: number;
  endorsementId: number | null;
  tpaId?: number;
  onUploadSuccess?: (documentId: number | string) => void;
  disableAllFields: boolean;
  creationLabel: string;
  formValues: TpaIdUploadFormValues;
  creationType?: "endorsement" | "inception";
}

const TpaUploadSection = ({
  policyId,
  endorsementId,
  tpaId,
  onUploadSuccess,
  disableAllFields,
  creationLabel,
  formValues,
  creationType,
}: TpaUploadSectionProps) => {
  const dispatch = useDispatch();
  const hasInceptionPermission = useHasPermission(FeatureKey.EXPORT_INCEPTION);
  const hasEndorsementPermission = useHasPermission(FeatureKey.EXPORT_ENDORSEMENTS);
  const hasRbacPermission = creationType === "inception" ? hasInceptionPermission : hasEndorsementPermission;
  const isDownloadAllowed =
    !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;
  const [uploadMethods, setUploadMethods] = useState<any>();
  const processedDocumentRef = useRef<number | string | null>(null);

  const tpaUploadDate = formValues?.tpaIdUpload?.tpaIdUploadDate;

  const isUploadDisabled = disableAllFields || !endorsementId;

  const formConfig = useMemo(
    () =>
      TpaUploadFormConfig.map((field) =>
        field.key === "uploadTpaFile"
          ? {
              ...field,
              componentProps: {
                ...field.componentProps,
                companyType: "policy",
                companyId: String(policyId),
                disabled: isUploadDisabled,
                showDownloadIcon: isDownloadAllowed,
              },
            }
          : field
      ),
    [policyId, isUploadDisabled, isDownloadAllowed]
  );

  useEffect(() => {
    if (!uploadMethods) return;

    const subscription = uploadMethods.watch(async (values: any, info: any) => {
      if (info?.name !== "uploadTpaFile") return;

      const uploadRes = values?.uploadTpaFile;
      const documentId =
        uploadRes?.data?.id || uploadRes?.data?.[0]?.id || uploadRes?.id;

      if (!documentId || processedDocumentRef.current === documentId) {
        return;
      }

      if (!endorsementId) {
        dispatch(setToastMessage(ENDORSEMENT_TOASTS.INVALID_SELECTION));
        return;
      }
      processedDocumentRef.current = documentId;

      try {
        await apiRequest(endPoints.tpaAcknowledgement(Number(endorsementId)), {
          method: HTTP_METHODS.POST,
          data: {
            documentId,
            policyId,
            endorsementId,
            tpaId,
            tpaAcknowledgedDate: tpaUploadDate
              ? dayjs(tpaUploadDate).format("YYYY-MM-DD")
              : null,
          },
        });
        dispatch(
          setToastMessage(ENDORSEMENT_TOASTS.FILE_UPLOADED_SUCCESSFULLY)
        );
        uploadMethods.reset({ uploadTpaFile: undefined });
        processedDocumentRef.current = null;
        if (documentId !== undefined && documentId !== null) {
          onUploadSuccess?.(documentId);
        }
      } catch (error: any) {
        const message = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message || ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(message));
      }
    });

      return () => subscription.unsubscribe?.();
  }, [uploadMethods, endorsementId, dispatch, policyId, onUploadSuccess, tpaId, tpaUploadDate]);

  const handleDownloadTemplate = async () => {
    try {

      // Step 1: Prepare template and get documentId
      const templateResponse = await apiRequest(
        endPoints.downloadTPAUploadTemplate(policyId, endorsementId || undefined),
        {
          method: HTTP_METHODS.GET,
        }
      );
      
      const { documentId, fileName } = templateResponse.data || {};
            
      if (documentId === undefined || documentId === null) {
        console.error("No documentId received from template preparation API");
        dispatch(
          setToastMessage(
            ENDORSEMENT_TOASTS.DOWNLOAD_FAILED_SERVER_RETURNED_ERROR
          )
        );
        return;
      }

      // Step 2: Download file using documentId
      const downloadResponse = await apiRequest(
        endPoints.fileUploadDownloadById(documentId),
        {
          method: HTTP_METHODS.GET,
          responseType: "blob",
        }
      );

      const blob = downloadResponse.data as Blob;

      // Check if server returned an error page
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

      // Use filename from template response or default
      const downloadFilename = fileName || "TPA_Upload_Template.xlsx";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      dispatch(
        setToastMessage(ENDORSEMENT_TOASTS.TEMPLATE_DOWNLOADED_SUCCESSFULLY)
      );
    } catch (err) {
      console.error("Download template error:", err);
      dispatch(setToastMessage(ENDORSEMENT_TOASTS.DOWNLOAD_FAILED_TRY_AGAIN));
    }
  };

  return (
    <>
      <TitleTypography>{`${creationLabel} TPA ID Data Upload`}</TitleTypography>
      <DynamicForm
        formConfig={formConfig}
        formMethods={setUploadMethods}
        defaultValues={{}}
        disableAllFields={disableAllFields}
        onActionMap={{ downloadTemplate: handleDownloadTemplate }}
      />
    </>
  );
};

const RenderTpaIdUploadStep = ({
  config,
  stepData,
  policyId,
  endorsementId,
  tpaId,
  creationLabel,
  creationType,
  isGroupPolicyType,
  summaryRef,
  setIsEndorsementPending,
  formRef,
  stepKey,
}: TpaIdUploadStepProps) => {
  const dispatch = useDispatch();
  const [formValues, setFormValues] = useState<TpaIdUploadFormValues>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const internalFormRef = useRef<StepInterface | null>(null);

  const disableAllFields = !stepData?.isCurrentStep && !stepData?.isCompleted;

  const hasInceptionPermissionForTable = useHasPermission(FeatureKey.EXPORT_INCEPTION);
  const hasEndorsementPermissionForTable = useHasPermission(FeatureKey.EXPORT_ENDORSEMENTS);
  const hasRbacPermissionForTable = creationType === "inception" ? hasInceptionPermissionForTable : hasEndorsementPermissionForTable;
  const isDownloadAllowed =
    !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermissionForTable;

  const endPoint =
    endorsementId !== null && endorsementId !== undefined
      ? endPoints.enrollmentUploadSummaryByEndorsement(
          Number(policyId),
          Number(endorsementId)
        )
      : undefined;

  const summaryCustomPathParam = isGroupPolicyType
    ? TPA_DATA_QUERY_PARAM
    : undefined;

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

  useEffect(() => {
    const isTpaMandatory = stepData?.data?.tpaIdUpload?.isTpaMandatory;

    // If TPA is not mandatory, don't disable the next button
    if (!isTpaMandatory) {
      setIsEndorsementPending(false);
      return;
    }

    // If TPA is mandatory, apply validation checks
    const checkIsPending = rowData?.some(
      (item: any) =>
        item?.documentProcessingFile?.processStatus === CREATED ||
        item?.documentProcessingFile?.processStatus === PROCESSING
    );
    const successCount = summaryRowData?.successCount || 0;
    setIsEndorsementPending(checkIsPending || successCount === 0);
  }, [rowData, summaryRowData, setIsEndorsementPending, stepData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refetch();
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const handleUploadSuccess = (documentId?: number | string) => {
    refetch();
    setPendingScroll(true);
  };

  useEffect(() => {
    if (!formRef) {
      return;
    }

    formRef.current = {
      submitAll: async () => internalFormRef.current?.submitAll?.(),
      testing: () => "",
    };

    return () => {
      if (formRef) {
        formRef.current = null;
      }
    };
  }, [formRef]);

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

      let filename = "error-report.xlsx";
      const contentDisposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
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

  const ActionButtonRenderer = (params: any) => {
    const errorFileId = params.data?.errorFile?.id;
    const processStatus = params.data?.documentProcessingFile?.processStatus;

    if (!errorFileId) {
      if (processStatus === FAILED) {
        return <span>{PLEASE_CHECK_THE_MAPPING}</span>;
      }
      return <span></span>;
    }

    return <ActionButton errorFileSize={params.data?.errorFile?.fileSize} onClick={isDownloadAllowed ? () => handleDownload(errorFileId) : undefined} isIconVisible={isDownloadAllowed} />;
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

  const refreshStatusMessage = useMemo((): string => {
    const isProcessing = rowData?.some(
      (item: any) =>
        item?.documentProcessingFile?.processStatus === CREATED ||
        item?.documentProcessingFile?.processStatus === PROCESSING
    );
    if (isProcessing) {
      return YOUR_DATA_IS_PROCESSING;
    }

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

    return YOUR_DATA_IS_PROCESSING;
  }, [rowData, summaryRowData]);

  return (
    <RenderEndorsementRequestComponent>
      <RenderEndorsementStep
        config={config}
        stepName={stepKey}
        stepData={stepData}
        onValuesChange={setFormValues}
        ref={internalFormRef as any}
      />
      <TpaUploadSection
        policyId={policyId}
        endorsementId={endorsementId}
        tpaId={tpaId}
        onUploadSuccess={handleUploadSuccess}
        disableAllFields={disableAllFields}
        creationLabel={creationLabel}
        formValues={formValues}
        creationType={creationType}
      />
      {summaryRowData &&
        (summaryRowData?.totalRecords > 0 || totalRows > 0) && (
          <Container sx={{ maxWidth: "860px" }} ref={summaryRef}>
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
            <TitleTypography>{`${creationLabel} Uploaded Data Table`}</TitleTypography>
            <CardsHolderContainer>
              {summaryCards.map((card) => (
                <EndorsementProcessDataCard
                  key={card.label}
                  styling={{
                    borderColor: card.borderColor,
                    width: "100%",
                    height: "110px",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ContentHolder>
                    <LabelTypography>{card.label}</LabelTypography>
                    <ValueTypography styling={{ color: card.color }}>
                      {formatNumberByLocalization(card.value)}
                    </ValueTypography>
                  </ContentHolder>
                </EndorsementProcessDataCard>
              ))}
            </CardsHolderContainer>
            <TableContainer>
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
                title=""
                components={{
                  ChipRenderer,
                  ActionButton: ActionButtonRenderer,
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

export default RenderTpaIdUploadStep;
