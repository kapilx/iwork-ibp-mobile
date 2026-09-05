import React, { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  AppDispatch,
  Button,
  CommonBreadcrumb,
  DocumentPreview,
  Drawer,
  apiRequest,
  colors,
  endPoints,
  setToastMessage,
  useApiQuery,
  useHasPermission,
  FeatureKey,
} from "@ui/ui-lib";
import { environment } from "@ui/ui-lib/environment";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import {
  ButtonContainer,
  Container,
  DrawerContent,
  DrawerContentWrapper,
  DrawerFooter,
  DrawerScrollableContent,
  DrawerSubTitle,
  DrawerTitle,
  RecordCount,
} from "./styles";
import { policyFeatureBreadcrumbs } from "./tableConfig";
import {
  Buttons,
  Cards,
  DownloadButton,
  ViewAuditButton,
} from "../HospitalListing/styles";
import { DOWNLOAD_FAILED_TRY_AGAIN, VIEW_AUDIT } from "../../constants";
import HospitalCard from "../../common/HospitalCard";

type PolicyFeatureDocument = {
  documentId: number | string;
  fileName: string;
  mimeType?: string;
};

const normalizePolicyFeatureDocument = (
  response: any
): PolicyFeatureDocument | null => {
  if (!response) return null;

  const payload = response?.data ?? response;
  const record =
    (Array.isArray(payload) && payload[0]) ||
    payload?.data?.data?.[0] ||
    payload?.data?.[0] ||
    payload?.data ||
    payload;

  if (!record) return null;

  const documentId =
    record.documentId ?? record.fileId ?? record.id ?? record?.document?.id;

  if (!documentId) return null;

  return {
    documentId,
    fileName: record.fileName ?? record.name ?? "Policy features",
    mimeType:
      record.mimeType ?? record.fileMimeType ?? record?.document?.mimeType,
  };
};

const PolicyFeatureListing: React.FC = () => {
  const { id: policyId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const hasRbacPermission = useHasPermission(FeatureKey.EXPORT_POLICIES);
  const isDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const historyPage = 1;
  const historyPageSize = 10;

  const {
    data: policyFeatureApiData,
    isLoading: isLoadingPolicyFeature,
    error: policyFeatureError,
  } = useApiQuery({
    queryKey: ["policyFeature", policyId],
    url: endPoints.portalConfigPolicyFeatureDocument(policyId ?? ""),
    enabled: !!policyId,
  });

  const policyFeatureDocument = useMemo(
    () => normalizePolicyFeatureDocument(policyFeatureApiData),
    [policyFeatureApiData]
  );

  const buildHistoryUrl = () =>
    `${endPoints.portalConfigPolicyFeatureDocumentHistory(policyId ?? "")}`;

  const {
    data: historyApiData,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useApiQuery({
    url: buildHistoryUrl(),
    queryKey: ["policyFeatureHistory", policyId, historyPage, historyPageSize],
    enabled: !!policyId && isDrawerOpen,
  });

  const historyRecords = useMemo(() => {
    if (!historyApiData) return [];

    let dataArray = [];

    if (Array.isArray(historyApiData)) {
      dataArray = historyApiData;
    } else if (
      historyApiData?.data?.data &&
      Array.isArray(historyApiData.data.data)
    ) {
      dataArray = historyApiData.data.data;
    } else if (Array.isArray(historyApiData?.data)) {
      dataArray = historyApiData.data;
    }

    return dataArray.map((item: any) => ({
      fileName: item.fileName || "Unknown File",
      uploadedBy: item.uploadedBy || "Unknown User",
      uploadedAt: item.uploadedAt || "Unknown Date",
      inclusionCount: 0,
      exclusionCount: 0,
      total: 0,
      fileId: item.documentId || item.fileId,
      errorFileId: item?.errorFileId,
      errorCount: item?.errorCount || 0,
      successCount: item?.successCount || 0,
      fileStatus: item.fileStatus || "",
    }));
  }, [historyApiData]);

  const handleFileDownload = useCallback(
    async (fileId: number | string, fileName?: string) => {
      try {
        const numericFileId = Number(fileId);

        if (!numericFileId || Number.isNaN(numericFileId)) {
          dispatch(setToastMessage("Invalid file selection."));
          return;
        }

        const downloadUrl = `${endPoints.fileUploadDownloadById(
          numericFileId
        )}?moduleKey=${encodeURIComponent("policies")}`;
        const response = await apiRequest(downloadUrl, {
          method: "GET",
          responseType: "blob",
        });

        const blob = response.data as Blob;

        if (blob.type.includes("text/html")) {
          const text = await blob.text();
          if (text.includes("<html")) {
            dispatch(setToastMessage(DOWNLOAD_FAILED_TRY_AGAIN));
            return;
          }
        }

        let filename = fileName || "policy-feature.pdf";
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
        dispatch(setToastMessage("Document downloaded successfully."));
      } catch (err) {
        dispatch(setToastMessage(DOWNLOAD_FAILED_TRY_AGAIN));
      }
    },
    [dispatch]
  );

  const handleActiveDownload = useCallback(() => {
    if (!policyFeatureDocument?.documentId) {
      dispatch(setToastMessage("No policy feature document available."));
      return;
    }

    handleFileDownload(
      policyFeatureDocument.documentId,
      policyFeatureDocument.fileName
    );
  }, [dispatch, handleFileDownload, policyFeatureDocument]);

  const handleChildren = () => (
    <DrawerContent>
      <DrawerTitle>Upload History</DrawerTitle>
      <DrawerSubTitle>
        Track all policy feature document uploads and changes
      </DrawerSubTitle>
    </DrawerContent>
  );

  const handleClosePreview = useCallback(() => {
    if (policyId) {
      navigate(`/policies/${policyId}`);
    } else {
      navigate("/policies");
    }
  }, [navigate, policyId]);

  return (
    <Container>
      <ButtonContainer>
        <CommonBreadcrumb crumbs={policyFeatureBreadcrumbs(policyId ?? "")} />
        <Buttons>
          {isDownloadAllowed && (
            <DownloadButton
              variantType="secondary"
              onClick={handleActiveDownload}
              disabled={!policyFeatureDocument?.documentId}
            >
              <FileDownloadOutlinedIcon /> Download PDF
            </DownloadButton>
          )}
          <ViewAuditButton
            variantType="secondary"
            onClick={() => setIsDrawerOpen(true)}
          >
            <HistoryOutlinedIcon /> {VIEW_AUDIT}
          </ViewAuditButton>
        </Buttons>
      </ButtonContainer>

      {isLoadingPolicyFeature ? (
        <Box display="flex" alignItems="center" gap={1} mt={3}>
          <CircularProgress size={20} />
          <Typography variant="body2">
            Loading policy feature document...
          </Typography>
        </Box>
      ) : policyFeatureError ? (
        <Typography color="error" mt={3}>
          Unable to load the policy feature document.
        </Typography>
      ) : !policyFeatureDocument?.documentId ? (
        <Typography mt={3}>
          No policy feature document is available for this policy yet.
        </Typography>
      ) : (
        <DocumentPreview
          open={!!policyFeatureDocument?.documentId}
          onClose={handleClosePreview}
          fileId={policyFeatureDocument.documentId}
          fileName={policyFeatureDocument.fileName}
          heading="Policy feature document"
          showDownloadButton={false}
        />
      )}

      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={handleChildren()}
        width="650px"
        anchor="right"
      >
        <DrawerContentWrapper>
          <DrawerScrollableContent>
            <Cards>
              {isHistoryLoading ? (
                <Typography>Loading upload history...</Typography>
              ) : historyError ? (
                <Typography color="error">
                  Failed to load policy feature upload history.
                </Typography>
              ) : historyRecords.length === 0 ? (
                <Typography>No upload records found.</Typography>
              ) : (
                historyRecords.map((audit, index) => (
                  <HospitalCard
                    key={index}
                    fileName={audit.fileName}
                    uploadedBy={audit.uploadedBy}
                    uploadedAt={audit.uploadedAt}
                    inclusionCount={audit.inclusionCount}
                    exclusionCount={audit.exclusionCount}
                    total={audit.total}
                    errorFileId={audit?.errorFileId}
                    errorCount={audit?.errorCount || 0}
                    onDownload={() =>
                      handleFileDownload(audit.fileId, audit.fileName)
                    }
                    showFooter
                    status={audit.fileStatus?.toLowerCase()}
                    isDownloadAllowed={isDownloadAllowed}
                  />
                ))
              )}
            </Cards>
          </DrawerScrollableContent>

          <DrawerFooter>
            <RecordCount>
              {historyRecords.length} upload record
              {historyRecords.length !== 1 ? "s" : ""} found
            </RecordCount>
            <Button
              variantType="outlined"
              type="button"
              sizeType="small"
              onClick={() => setIsDrawerOpen(false)}
              sx={{
                border: "2px solid",
                borderColor: colors.background.greyVariant,
              }}
            >
              Close
            </Button>
          </DrawerFooter>
        </DrawerContentWrapper>
      </Drawer>
    </Container>
  );
};

export default PolicyFeatureListing;
