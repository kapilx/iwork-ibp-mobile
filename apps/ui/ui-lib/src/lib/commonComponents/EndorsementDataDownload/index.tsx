import { useDispatch } from "react-redux";
import { IconWrapper, MainContainer } from "./styles";
import { setToastMessage } from "@ui/ui-lib/redux";
import { apiRequest } from "@ui/ui-lib/utils";
import { useEffect, useState } from "react";
import PreviewModal from "../EndorsementDocument/PreviewModal";
import useHasPermission from "../../rbac/useHasPermission";
import { FeatureKey } from "../../rbac/permissionMap";
import { environment } from "@ui/ui-lib/environment";

interface EndorsementDataDownloadProps {
  componentKey: string;
  documentId: number;
  Icon: any;
  endPoint: {
    download: string;
    preview: string;
  };
  enableDownloadIcon: boolean;
  uniqueKey?:string;
  permissionFeatureKey?: FeatureKey;
}
const EndorsementDataDownload: React.FC<EndorsementDataDownloadProps> = ({
  documentId,
  Icon,
  endPoint,
  enableDownloadIcon,
  uniqueKey,
  permissionFeatureKey = FeatureKey.EXPORT_ENDORSEMENTS,

}) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const hasRbacPermission = useHasPermission(permissionFeatureKey);
  const isDownloadAllowed =
    !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;

  // Only make this API when key is "preview"
  useEffect(() => {
    if (!documentId && !uniqueKey) return;

    const fetchPreview = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiRequest(endPoint.preview, {
          method: "GET",
        });
        setPreviewData(response.data);
      } catch (err: Error | any) {
        setError({ message: err?.message || "Failed to fetch preview data." });
        dispatch(setToastMessage("Failed to fetch preview data."));
      } finally {
        setIsLoading(false);
      }
    };

    if (documentId && uniqueKey?.toLowerCase().includes("preview")) {
      fetchPreview();
    }
  }, [documentId, uniqueKey]);

  const handleDownload = async () => {
    try {
      if (!documentId) {
        dispatch(setToastMessage("Invalid selection."));
        return;
      }
      const response = await apiRequest(endPoint.download, {
        method: "GET",
        responseType: "blob",
      });

      const blob = response.data as Blob;

      // Check if response is an error page
      if (blob.type.includes("text/html")) {
        const text = await blob.text();
        if (text.includes("<html")) {
          dispatch(
            setToastMessage("Download failed — server returned an error page.")
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
      dispatch(setToastMessage("File downloaded successfully."));
    } catch (err) {
      console.error("Download error:", err);
      dispatch(setToastMessage("Download failed. Try again."));
    }
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  }

  return (
    <MainContainer>
      {Array.isArray(Icon)
        ? Icon.map((iconObj: any) => (
            <IconWrapper
              key={iconObj.id}
              onClick={iconObj.id === "downloadIcon" ? handleDownload : handlePreview}
              enableDownloadIcon={enableDownloadIcon}
              src={iconObj.icon}
              alt={iconObj.label}
            />
          ))
        : (
            <IconWrapper
              onClick={handleDownload}
              enableDownloadIcon={enableDownloadIcon}
              src={Icon}
              alt="Download Icon"
            />
          )}
          <PreviewModal 
            open={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            data={previewData}
            isLoading={isLoading}
            error={error}
            title={previewData?.fileName ? `${previewData.fileName} - Preview` : "Client Document - Preview"}
          />
    </MainContainer>
  );
};

export default EndorsementDataDownload;
