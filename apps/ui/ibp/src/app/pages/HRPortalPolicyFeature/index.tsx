import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { Box, CircularProgress, Typography } from "@mui/material";
import { DocumentPreview, endPoints, useApiQuery } from "@ui/ui-lib";
import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

type HRPortalPolicyFeatureState = {
  policyTypeName?: string;
};

const HRPortalPolicyFeature = () => {
  const { policyId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as HRPortalPolicyFeatureState;
  const policyTypeName = state?.policyTypeName ?? "";

  const { data, isLoading } = useApiQuery({
    queryKey: ["hrPortalPolicyFeatureDoc", policyId],
    url: policyId ? endPoints.policyFeatureDocument(policyId) : "",
    enabled: Boolean(policyId),
  });

  const docInfo = useMemo(() => {
    const items: any[] =
      (data as any)?.data?.data ??
      (data as any)?.data ??
      [];
    const doc = items[0];
    if (doc?.documentId) {
      return {
        documentId: doc.documentId,
        fileName: doc.fileName ?? "Policy features.pdf",
        mimeType: doc.mimeType,
      };
    }
    return null;
  }, [data]);

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", bgcolor: "#EBF6FF", overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 2, py: 2.5, bgcolor: "#fff", borderBottom: "1px solid #E8E8E8", flexShrink: 0 }}>
        <Box
          onClick={() => navigate(-1)}
          sx={{ display: "flex", alignItems: "center", cursor: "pointer", color: "#093F84", p: 0, "&:hover": { opacity: 0.75 } }}
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </Box>
        <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 600, color: "primary.main", lineHeight: 1.3 }}>
          Policy Features{policyTypeName ? ` — ${policyTypeName}` : ""}
        </Typography>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {isLoading ? (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
            <CircularProgress size={28} sx={{ color: "#093F84" }} />
            <Typography variant="body2" sx={{ color: "#6B7280" }}>
              Loading policy feature document...
            </Typography>
          </Box>
        ) : docInfo?.documentId ? (
            <DocumentPreview
              fileId={docInfo.documentId}
              fileName={docInfo.fileName}
              mimeType={docInfo.mimeType}
              getFileDownloadUrl={endPoints.ibpFileUploadDownloadById}
              previewSurfaceMaxHeight="100vh"
              toolbarPlacement="bottom"
              toolbarVariant="modalFooter"
              showFileMeta={false}
              showPageIndicator={true}
              showDownloadButton={true}
              defaultScale={1.75}
              stylesForOuterBorder={{ border: "0px", padding: "0px" }}
            />
        ) : (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="body1" sx={{ color: "#6B7280" }}>
              No policy feature document available.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export { HRPortalPolicyFeature };
export default HRPortalPolicyFeature;
