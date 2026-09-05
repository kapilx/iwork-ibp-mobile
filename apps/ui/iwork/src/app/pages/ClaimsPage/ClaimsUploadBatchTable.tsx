import {
  apiRequest,
  Button,
  ChipRenderer,
  CUSTOM_PAGE_SIZE,
  endPoints,
  formatCurrencyByLocalization,
  formatNumberByLocalization,
  setToastMessage,
  Table,
  theme,
  useTableController,
} from "@ui/ui-lib";
import { FC, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import {
  CREATED,
  DATA_PROCESSING_COMPLETE_NO_SUCCESS,
  DATA_PROCESSING_COMPLETE_SUCCESS,
  DATA_PROCESSING_STATUS,
  DOWNLOAD_FAILED_TRY_AGAIN,
  ENDORSEMENT_TOASTS,
  ENDORSEMENT_UPLOADED_DATA_TABLE,
  NO_FILES_PROCESSING_CURRENTLY,
  PROCESSING,
  SOURCE_FILE_DOWNLOADED_SUCCESSFULLY,
  YOUR_DATA_IS_PROCESSING,
  YOUR_DATA_IS_PROCESSING_IN_CLAIMS,
} from "../../constants/index.js";
import {
  CardsHolderContainer,
  ContentHolder,
  LabelTypography,
  RenderEndorsementRequestComponent,
  TitleTypography,
  ValueTypography,
} from "./styles.js";
import { Container } from "../CDManagement/styles.js";
import {
  RefreshContentContainer,
  RefreshControls,
  RefreshHeaderTypography,
  RefreshSpinner,
  RefreshStatusText,
  RefreshWrapper,
} from "./styles";
import RefreshIcon from "../../assets/svgs/refresh-icon.svg";
import EndorsementProcessDataCard from "../../components/EndorsementProcessDataCard/index.js";
import TextRenderer from "../../common/TextRenderer/index.js";
import { claimsBatches } from "./config.js";
import ActionButton from "@ui/ui-lib/commonComponents/ActionButton/index.js";

interface ClaimsUploadDataProps {
  policyId: number;
  endorsementId: number | null;
}

const ClaimsUploadBatchTable: FC<ClaimsUploadDataProps> = ({
  policyId,
  endorsementId,
}) => {
  const dispatch = useDispatch();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    customPathParam: `policyId=${Number(policyId)}`,
    searchFieldName: "policyName",
    defaultPageSize: CUSTOM_PAGE_SIZE,
    enabled: !!policyId,
  });

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refetch();
    setTimeout(() => setIsRefreshing(false), 2000);
  };

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
          dispatch(setToastMessage(DOWNLOAD_FAILED_TRY_AGAIN));
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
      dispatch(setToastMessage(SOURCE_FILE_DOWNLOADED_SUCCESSFULLY));
    } catch (err) {
      console.error("Download error:", err);
      dispatch(setToastMessage(DOWNLOAD_FAILED_TRY_AGAIN));
    }
  };

  const ActionButtonRenderer = (params: any) => {
    // new: use sourceFileId returned by API
    const sourceFileId = params.data?.sourceFileId;
    if (!sourceFileId) {
      return <span />;
    }
    return (
      <ActionButton
        onClick={() => handleDownload(sourceFileId)}
        buttonText={"Download source file"}
      />
    );
  };

  const refreshStatusMessage = useMemo((): string => {
    const isProcessing = rowData?.some(
      (item: any) => item?.status === CREATED || item?.status === PROCESSING
    );
    if (isProcessing) {
      return YOUR_DATA_IS_PROCESSING_IN_CLAIMS;
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

    return DATA_PROCESSING_COMPLETE_SUCCESS;
  }, [rowData, summaryRowData]);

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
        label: "Settled claim count",
        value: summaryRowData?.totalSettledClaimRecords || 0,
        color:
          (theme as any).palette.text?.success ||
          (theme as any).palette.success?.main,
        borderColor:
          (theme as any).palette.text?.success ||
          (theme as any).palette.success?.main,
      },
      {
        label: "Settled claim amount",
        value: summaryRowData?.settledClaimAmount || 0,
        color: (theme as any).palette.error?.main,
        borderColor: (theme as any).palette.error?.main,
        isCurrency: true,
      },
      {
        label: "Claim amount pending",
        value: summaryRowData?.claimAmountPendingForSettlement || 0,
        color: (theme as any).palette.error?.main,
        borderColor: (theme as any).palette.error?.main,
        isCurrency: true,
      },
    ],
    [summaryRowData]
  );

  // Only render if there's data to show
  // if (
  //   !summaryRowData ||
  //   (summaryRowData?.totalRecords === 0 && totalRows === 0)
  // ) {
  //   return (
  //     <RenderEndorsementRequestComponent>
  //       <div>No upload data available yet. Please complete step 1 first.</div>
  //     </RenderEndorsementRequestComponent>
  //   );
  // }

  return (
    <RenderEndorsementRequestComponent>
      <Container sx={{ maxWidth: "860px" }}>
        <RefreshWrapper>
          <RefreshHeaderTypography>
            {DATA_PROCESSING_STATUS}
          </RefreshHeaderTypography>
          <RefreshContentContainer>
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

        <TitleTypography>{ENDORSEMENT_UPLOADED_DATA_TABLE}</TitleTypography>

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
                  {c.isCurrency
                    ? formatCurrencyByLocalization(c.value)
                    : formatNumberByLocalization(c.value)}
                </ValueTypography>
              </ContentHolder>
            </EndorsementProcessDataCard>
          ))}
        </CardsHolderContainer>

        <Table
          columns={claimsBatches}
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
            TextRenderer,
          }}
          height={250}
        />
      </Container>
    </RenderEndorsementRequestComponent>
  );
};

export default ClaimsUploadBatchTable;
