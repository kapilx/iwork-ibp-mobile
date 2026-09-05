import { setToastMessage } from "@ui/ui-lib/redux/slice";
import { FileName } from "../ClosedEndorsement/styles";
import { useDispatch } from "react-redux";
import { endPoints as uiLibEndpoint } from "@ui/ui-lib/constants/endPoints";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { AppDispatch } from "@insurance-wellness-hub/ui-lib";

export const handleDownload = async (
  errorFileUploadId: number,
  dispatch: AppDispatch
) => {
  try {
    if (!errorFileUploadId) {
      dispatch(setToastMessage("Invalid selection."));
      return;
    }

    const downloadUrl = `${uiLibEndpoint.fileUploadDownload}/${errorFileUploadId}/download`;
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
    dispatch(setToastMessage("Endorsement report downloaded successfully."));
  } catch (err) {
    dispatch(setToastMessage("Download failed. Try again."));
  }
};
const FileRenderer = (params: any) => {
  const dispatch = useDispatch();

  const { data } = params;
  const endorsementFile = data?.endorsementFileDetails;

  return (
    <div>
      <FileName
        onClick={() =>
          handleDownload(endorsementFile?.endorsementFileId, dispatch)
        }
      >
        {endorsementFile?.endorsementFileName}
      </FileName>
    </div>
  );
};

export default FileRenderer;
