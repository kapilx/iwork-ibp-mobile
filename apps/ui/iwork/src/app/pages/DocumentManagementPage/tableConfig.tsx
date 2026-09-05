import { ColDef } from "ag-grid-community";
import { setToastMessage } from "@ui/ui-lib/redux/slice";
import { endPoints as uiLibEndpoint } from "@ui/ui-lib/constants/endPoints";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { AppDispatch } from "@insurance-wellness-hub/ui-lib";
import { styled } from "@mui/material/styles";

export interface DocumentRecord {
    id: number;
    fileKey: string;
    createdAt: string;
    entityType: string;
    entityId: number;
}

const fallbackFormatter = ({ value }: { value: unknown }): string =>
    value !== null && value !== undefined && value !== ""
        ? String(value)
        : "--";

// Styled component for clickable file name
const FileName = styled("span")(({ theme }) => ({
    color: theme.palette.primary.main,
    cursor: "pointer",
    textDecoration: "underline",
    "&:hover": {
        color: theme.palette.primary.dark,
    },
}));

// File download handler
export const handleDocumentDownload = async (
    documentId: number,
    dispatch: AppDispatch,
    moduleKey?: string
) => {
    try {
        if (!documentId) {
            dispatch(setToastMessage("Invalid document selection."));
            return;
        }

        const downloadUrl = moduleKey
            ? `${uiLibEndpoint.fileUploadDownloadById(documentId)}?moduleKey=${encodeURIComponent(
                  moduleKey
              )}`
            : uiLibEndpoint.fileUploadDownloadById(documentId);

        const response = await apiRequest(downloadUrl, {
            method: "GET",
            responseType: "blob",
        });

        // When responseType is blob, apiRequest returns the full response object
        const blob = response.data as Blob;

        if (!blob) {
            dispatch(setToastMessage("Failed to retrieve file data."));
            return;
        }

        // Check if response is an error page
        if (blob.type.includes("text/html")) {
            const text = await blob.text();
            if (text.includes("<html")) {
                console.error("Server returned error page:", text);
                dispatch(
                    setToastMessage("Download failed — server returned an error page.")
                );
                return;
            }
        }

        let filename = "document.pdf"; // Default filename
        const contentDisposition =
            response.headers?.["content-disposition"] ||
            response.headers?.get?.("content-disposition");

        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match && match[1]) {
                filename = decodeURIComponent(match[1]);
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
    } catch (err: any) {
        console.error("Download error:", err);
        const errorMsg = err?.message || "Download failed. Try again.";
        dispatch(setToastMessage(errorMsg));
    }
};

// File Key Renderer Component with Download
export const FileKeyRenderer = (params: any) => {
    const { data, context } = params;

    if (!data?.fileKey) {
        return <span>--</span>;
    }

    // Extract filename from fileKey path
    const fileName = data.fileKey.split("/").pop() || data.fileKey;

    const handleClick = () => {
        if (data?.id && context?.dispatch) {
            const moduleKey =
                typeof context?.getDownloadModuleKey === "function"
                    ? context.getDownloadModuleKey(data)
                    : undefined;
            handleDocumentDownload(data.id, context.dispatch, moduleKey);
        }
    };

    return (
        <FileName onClick={handleClick}>
            {fileName}
        </FileName>
    );
};

// Date formatter
const dateFormatter = ({ value }: { value: unknown }): string => {
    if (!value) return "--";
    try {
        const date = new Date(String(value));
        return new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(date);
    } catch {
        return String(value);
    }
};

// getAllFileDetails (org-service /file-upload/file-details) has no sort
// param at all — every column below is disableSort rather than showing a
// misleading, non-functional sort arrow.
export const getDocumentColumns = (dispatch: AppDispatch): ColDef[] => [
    {
        headerName: "Entity ID",
        field: "entityId",
        tooltipField: "entityId",
        headerTooltip: "Entity ID",
        valueFormatter: fallbackFormatter,
        minWidth: 120,
        pinned: "left",
        disableSort: true,
    },
    {
        headerName: "Entity Type",
        field: "entityType",
        tooltipField: "entityType",
        headerTooltip: "Entity Type",
        valueFormatter: fallbackFormatter,
        minWidth: 180,
        flex: 1,
        disableSort: true,
    },
    {
        headerName: "File Key",
        field: "fileKey",
        tooltipField: "fileKey",
        headerTooltip: "File Key",
        cellRenderer: "FileKeyRenderer",
        minWidth: 250,
        flex: 2,
        disableSort: true,
    },
    {
        headerName: "Created At",
        field: "createdAt",
        tooltipField: "createdAt",
        headerTooltip: "Created Date",
        valueFormatter: dateFormatter,
        minWidth: 150,
        disableSort: true,
    },
];


