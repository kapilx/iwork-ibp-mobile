import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { CircularProgress, Typography } from "@mui/material";
import { DocumentPreview, endPoints, useApiQuery } from "@ui/ui-lib";
import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
// import previewIcon from "../../assets/svgs/preview-icon.svg";
import {
  BackArrowButton,
  DocumentPreviewWrapper,
  EmptyState,
  EmptyStateActions,
  EmptyStateMessage,
  LoadingState,
  PageWrapper,
  PreviewBody,
  PreviewCard,
  PreviewHeader,
  PreviewTitle,
  PreviewTitleGroup,
  ViewButton,
} from "./styles";

type PolicyFeatureDocument = {
  documentId: number | string;
  fileName: string;
  mimeType?: string;
  featureType?: string;
};

type NavigationPolicyInfo = {
  policyId?: string | number;
  policyName?: string;
  isEditable?: boolean;
};

type PolicyFeaturePreviewState = {
  policyInfo?: NavigationPolicyInfo | null;
  showContinueEnrollment?: boolean;
  documentPreview?: PolicyFeatureDocument | null;
};

const normalizePolicyFeatureDocument = (
  response: any,
  requestedPolicyId?: string | number,
): PolicyFeatureDocument | null => {
  if (!response) return null;

  const payload = response?.data ?? response;
  const records = Array.isArray(payload)
    ? payload
    : payload?.data?.data && Array.isArray(payload.data.data)
      ? payload.data.data
      : payload?.data && Array.isArray(payload.data)
        ? payload.data
        : payload?.data
          ? [payload.data]
          : payload
            ? [payload]
            : [];

  const normalizedPolicyId =
    requestedPolicyId != null ? String(requestedPolicyId) : "";

  const record = normalizedPolicyId
    ? records.find(
        (item: any) =>
          item?.featureType === "policy_level" &&
          String(item?.policyId ?? "") === normalizedPolicyId &&
          item?.documentId,
      )
    : records.find(
        (item: any) =>
          item?.featureType === "company_level" && item?.documentId,
      );

  if (!record) return null;

  const documentId =
    record.documentId ?? record.fileId ?? record.id ?? record?.document?.id;

  if (!documentId) return null;

  return {
    documentId,
    fileName: record.fileName ?? record.name ?? "Policy features.pdf",
    mimeType:
      record.mimeType ?? record.fileMimeType ?? record?.document?.mimeType,
    featureType: record.featureType,
  };
};

const PolicyFeaturePreview = () => {
  const { policyId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeId = userDetails?.id;
  const previewState = (location.state ?? {}) as PolicyFeaturePreviewState;
  const policyInfo = (previewState?.policyInfo ?? null) as NavigationPolicyInfo | null;
  const showContinueEnrollment = Boolean(previewState?.showContinueEnrollment);
  const routedDocumentPreview = previewState?.documentPreview ?? null;

  const { data, isLoading } = useApiQuery({
    queryKey: ["policyFeaturePreview", employeeId],
    url: employeeId ? endPoints.policyFeatureDocumentsByEmployee(employeeId) : "",
    enabled: Boolean(employeeId),
  });

  const policyDocument = useMemo(() => {
    const routedDocumentId =
      routedDocumentPreview?.documentId != null
        ? String(routedDocumentPreview.documentId)
        : "";
    if (routedDocumentId) {
      return {
        documentId: routedDocumentId,
        fileName:
          routedDocumentPreview?.fileName?.trim() || "Policy features.pdf",
        mimeType: routedDocumentPreview?.mimeType,
        featureType: routedDocumentPreview?.featureType,
      };
    }
    return normalizePolicyFeatureDocument(data, policyId || undefined);
  }, [data, policyId, routedDocumentPreview]);
  const primaryActionLabel =
    policyInfo?.isEditable === false ? "View Summary" : "Continue Enrolment";

  const handleContinue = () => {
    if (policyInfo?.isEditable === false) {
      navigate("/unified-enrollment", {
        state: {
          policyInfo,
          openSummary: true,
          isViewOnly: true,
        },
      });
      return;
    }

    navigate("/unified-enrollment", {
      state: {
        policyInfo,
      },
    });
  };

  return (
    <PageWrapper>
      <PreviewCard>
        <PreviewHeader>
          <PreviewTitleGroup>
            <BackArrowButton onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowBackIosNewIcon fontSize="small" />
            </BackArrowButton>
            <PreviewTitle>Policy Features</PreviewTitle>
          </PreviewTitleGroup>
        </PreviewHeader>

        <PreviewBody>
          {isLoading ? (
            <LoadingState>
              <CircularProgress size={24} />
              <Typography variant="body2">
                Loading policy feature document...
              </Typography>
            </LoadingState>
          ) : policyDocument?.documentId ? (
            <DocumentPreviewWrapper>
              <DocumentPreview
                fileId={policyDocument.documentId}
                fileName={policyDocument.fileName}
                mimeType={policyDocument.mimeType}
                getFileDownloadUrl={endPoints.ibpFileUploadDownloadById}
                previewSurfaceMaxHeight="calc(100vh - 200px)"
                toolbarPlacement="bottom"
                toolbarVariant="modalFooter"
                showFileMeta={false}
                showPageIndicator={true}
                showDownloadButton={true}
                defaultScale={1.75}
                primaryActionLabel={
                  showContinueEnrollment ? "Continue Enrolment" : undefined
                }
                onPrimaryAction={
                  showContinueEnrollment ? handleContinue : undefined
                }
                stylesForOuterBorder={{ 
                  border: "0px",
                  padding: "0px"
                }}
              />
            </DocumentPreviewWrapper>
          ) : (
            <EmptyState>
              <EmptyStateMessage>
                <Typography variant="body1">
                  No policy feature document available.
                </Typography>
              </EmptyStateMessage>
              <EmptyStateActions>
                <ViewButton variant="contained" onClick={handleContinue}>
                  {primaryActionLabel}
                </ViewButton>
              </EmptyStateActions>
            </EmptyState>
          )}
        </PreviewBody>
      </PreviewCard>
    </PageWrapper>
  );
};

export default PolicyFeaturePreview;
