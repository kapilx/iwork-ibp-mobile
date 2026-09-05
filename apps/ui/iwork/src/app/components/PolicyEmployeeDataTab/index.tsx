import {
  BUTTON_VARIANTS,
  endPoints,
  useTableController,
  Table,
  NO_DATA_FOUND,
  useHasPermission,
  FeatureKey,
} from "@ui/ui-lib";
import { environment } from "@ui/ui-lib/environment";
import { Box, IconButton, MenuItem, Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
// import {
//   NoDataBox,
//   NoDataText,
// } from "@ui/ui-lib/commonComponents/CustomTabs/styles";

import { useApiQuery } from "@ui/ui-lib/hooks/useApiQuery";
import { useFileUpload } from "@ui/ui-lib/hooks/useFileUpload";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { CellClickedEvent } from "ag-grid-community";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import DownloadIcon from "../../assets/svgs/download-icon.svg";
import fileUpload from "../../assets/svgs/file-upload.svg";

import { StyledNextButton } from "../../pages/OpportunitiesPage/OpportunitiesForm/styles";
import {
  ContainerForTable,
  HiddenFileInput,
  StyledBox,
  StyledInnerStack,
  StyledLoaderContainer,
  StyledOuterStack,
  StyledUploadIconImg,
} from "./styles";
import { columns, documentTypeOptions } from "./tableConfig";
import {
  setToastMessage,
  CustomTabsNoDataBox,
  CustomTabsNoDataText,
} from "@ui/ui-lib";
import { POLICY_EMPLOYEE_DATA } from "../../constants";
import { NoDataBox } from "@ui/ui-lib/commonComponents/CardsGrid/styles";
import { NoDataText } from "@ui/ui-lib/commonComponents/FormComponent/Fields/styles";
import backgroundImage from "../../assets/webp/no-data-found-background-image.webp";
import { SelectStyles } from "@ui/ui-lib/commonComponents/Fields/styles";

// Add interface for template response
interface TemplateResponse {
  documentId: number;
  fileName: string;
}

// Add these interfaces at the top of the file
interface ProcessingFile {
  id: number;
  entityType: string;
  entityId: number;
  documentId: number;
  documentType: string;
  processStatus: string;
}

interface FileData {
  id: number;
  fileName: string;
}

interface UploadData {
  id: number;
  documentProcessingFileId: number;
  policyId: number;
  sourceFileUploadId: number;
  errorFileUploadId: number | null;
  successFileUploadId: number | null;
  successCount: number;
  errorCount: number;
  documentProcessingFile: ProcessingFile;
  sourceFile: FileData;
  errorFile: FileData | null;
  successFile: FileData | null;
}

// Mock pagination and table controls

const PolicyEmployeeDataTab: React.FC = () => {
  const { id: policyId } = useParams();
  const dispatch = useDispatch();
  const hasRbacPermission = useHasPermission(FeatureKey.EXPORT_UPLOAD_TEMPLATE);
  const isDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;

  // Use the controller but override with mock data
  const {
    currentPage,
    loading,
    setCurrentPage,
    pageSize,
    setPageSize,
    rowData,
    totalRows,
    PAGE_SIZE_OPTIONS: PAGE_OPTIONS,
    setSort,
    refetch,
  } = useTableController({
    endpoint: endPoints.getPolicyUploads(policyId || ""),
    searchFieldName: "companyName",
  });

  // Fetch template data without type argument (fixes: "Expected 0 type arguments, but got 1")
  const {
    data: templateData,
    isLoading: templateLoading,
    error: templateError,
  } = useApiQuery({
    url: endPoints.getPolicyTemplate(policyId || ""),
    queryKey: ["policyTemplate", policyId],
    enabled: !!policyId,
  });

  const {
    data: enrollementTemplateData,
    isLoading: enrollementTemplateLoading,
    error: enrollementTemplateError,
  } = useApiQuery({
    url: endPoints.getEnrollmentPolicyTemplate(policyId || ""),
    queryKey: ["policyEnrollementTemplate", policyId],
    enabled: !!policyId,
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState("");

  console.log("documentType Data:", documentType);

  const handleDownloadTemplate = async () => {
    if (!templateData?.data?.documentId) {
      return;
    }
    setIsDownloading(true);
    try {
      const response = await apiRequest(
        `${endPoints.fileUploadDownload}/${templateData.data.documentId}/download`,
        {
          method: "GET",
          responseType: "blob",
        }
      );

      // Ensure response.data is used to create the Blob
      const blob = response.data as Blob;

      // Check if the response is valid and not an error page
      const text = await blob.text();
      if (blob.type.includes("text/html") && text.includes("<html")) {
        console.error(POLICY_EMPLOYEE_DATA.RECEIVE_HTML_INSTEAD_OF_FILE, text);
        dispatch(setToastMessage(POLICY_EMPLOYEE_DATA.DOWNLOAD_FAIL));
        return;
      }

      // Extract filename from Content-Disposition header
      let filename = templateData.data.fileName || "download";
      const contentDisposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      // Create a URL for the Blob and trigger the download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(POLICY_EMPLOYEE_DATA.DOWNLOAD_ERROR, err);
      dispatch(setToastMessage(POLICY_EMPLOYEE_DATA.DOWNLOAD_FAIL_TRY_AGAIN));
    }
  };

  const handleEnrollmentDownloadTemplate = async () => {
    if (!enrollementTemplateData?.data?.documentId) {
      return;
    }
    setIsDownloading(true);
    try {
      const response = await apiRequest(
        `${endPoints.fileUploadDownload}/${enrollementTemplateData.data.documentId}/download`,
        {
          method: "GET",
          responseType: "blob",
        }
      );

      // Ensure response.data is used to create the Blob
      const blob = response.data as Blob;

      // Check if the response is valid and not an error page
      const text = await blob.text();
      if (blob.type.includes("text/html") && text.includes("<html")) {
        console.error(POLICY_EMPLOYEE_DATA.RECEIVE_HTML_INSTEAD_OF_FILE, text);
        dispatch(setToastMessage(POLICY_EMPLOYEE_DATA.DOWNLOAD_FAIL));
        return;
      }

      // Extract filename from Content-Disposition header
      let filename = enrollementTemplateData.data.fileName || "download";
      const contentDisposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      // Create a URL for the Blob and trigger the download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(POLICY_EMPLOYEE_DATA.DOWNLOAD_ERROR, err);
      dispatch(setToastMessage(POLICY_EMPLOYEE_DATA.DOWNLOAD_FAIL_TRY_AGAIN));
    }
  };

  const {
    handleFileChange: rawHandleFileChange,
    loading: uploadLoading,
    fileUploadResponse,
  } = useFileUpload(undefined, endPoints.fileUpload);
  const handleUploadError = (error: any) => {
    console.error(POLICY_EMPLOYEE_DATA.UPLOAD_ERROR, error);
    dispatch(
      setToastMessage(error?.message || POLICY_EMPLOYEE_DATA.UPLOAD_FAIL)
    );
  };

  // Update the handleUploadFile function to include error handling
  const handleUploadFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!policyId) {
      dispatch(setToastMessage(POLICY_EMPLOYEE_DATA.POLICY_ID_REQUIRED));
      return;
    }

    try {
      if (event.target.files && event.target.files[0]) {
        // Set upload loading state
        setUploading(true);

        rawHandleFileChange(
          event,
          "policy",
          policyId,
          "3299", // *** static value for documentType ***
          async (uploadedFile) => {
            try {
              // Make the enrollment upload API call with the uploaded file's ID
              const enrollmentResponse = await apiRequest(
                endPoints.policyEnrollmentUpload(policyId),
                {
                  method: "POST",
                  data: {
                    documentId: uploadedFile.id,
                    documentType: documentType || "policy_employee_data",
                  },
                }
              );

              if (enrollmentResponse?.data) {
                dispatch(
                  setToastMessage(
                    POLICY_EMPLOYEE_DATA.FILE_UPLOAD_SUCCESS_MESSAGE
                  )
                );
                // Optionally refresh the uploads data
                // refetch(); // If using React Query's refetch
                refetch(); // Use the refetch function from useTableController to refresh the uploads table
              } else {
                throw new Error(POLICY_EMPLOYEE_DATA.ENROLLMENT_FAIL);
              }
            } catch (enrollError) {
              console.error(
                POLICY_EMPLOYEE_DATA.ENROLLMENT_UPLOAD_ERROR,
                enrollError
              );
              dispatch(
                setToastMessage(POLICY_EMPLOYEE_DATA.FAIL_TO_PROCESS_TRY_AGAIN)
              );
            } finally {
              setUploading(false);
            }
          }
        );
      }
    } catch (error) {
      handleUploadError(error);
      setUploading(false);
    }
  };

  const errorFileDownload = async (documentId?: number, fileName?: string) => {
    if (!documentId) {
      dispatch(setToastMessage(POLICY_EMPLOYEE_DATA.ERROR_FILE_NOT_AVAILABLE));
      return;
    }
    setIsDownloading(true);
    try {
      const response = await apiRequest(
        `${endPoints.fileUploadDownload}/${documentId}/download`,
        {
          method: "GET",
          responseType: "blob",
        }
      );

      const blob = response.data as Blob;
      const text = await blob.text();
      if (blob.type.includes("text/html") && text.includes("<html")) {
        console.error(POLICY_EMPLOYEE_DATA.RECEIVE_HTML_INSTEAD_OF_FILE, text);
        dispatch(setToastMessage(POLICY_EMPLOYEE_DATA.DOWNLOAD_FAIL));
        return;
      }

      let filename = fileName || "error-file";
      const contentDisposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(POLICY_EMPLOYEE_DATA.DOWNLOAD_ERROR, err);
      dispatch(setToastMessage(POLICY_EMPLOYEE_DATA.DOWNLOAD_FAIL_TRY_AGAIN));
    } finally {
      setIsDownloading(false);
    }
  };

  const onCellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === "errorFile") {
      const row = event.data;
      if (row.errorFile.id) {
        errorFileDownload(row.errorFile.id, row.errorFile.fileName);
      } else {
        dispatch(
          setToastMessage(POLICY_EMPLOYEE_DATA.ERROR_FILE_NOT_AVAILABLE)
        );
      }
    }
  };

  return (
    <Box>
      {templateLoading ? (
        <StyledLoaderContainer>
          <CircularProgress />
        </StyledLoaderContainer>
      ) : templateError ? (
        <Box>
          <CustomTabsNoDataBox>
            <img src={backgroundImage} alt="" />
            <CustomTabsNoDataText>{NO_DATA_FOUND}</CustomTabsNoDataText>
          </CustomTabsNoDataBox>
        </Box>
      ) : (
        <>
          <StyledOuterStack>
            <StyledInnerStack data-testid="upload-data-template-policy-employee-data">
              <Typography variant="body1">
                {POLICY_EMPLOYEE_DATA.UPLOAD_DATA_TEMPLATE}:{" "}
                <b>{templateData?.data?.fileName || "No template available"}</b>
              </Typography>
              {isDownloadAllowed && (
                <IconButton
                  onClick={handleDownloadTemplate}
                  size="small"
                  color="primary"
                  disabled={!templateData?.data || isDownloading}
                  data-testid="upload-data-download-icon"
                >
                  <img src={DownloadIcon} alt="Download Template" />
                </IconButton>
              )}
            </StyledInnerStack>
            <StyledInnerStack data-testid="upload-data-template-policy-employee-data">
              <Typography variant="body1">
                {POLICY_EMPLOYEE_DATA.UPLOAD_DATA_TEMPLATE}:{" "}
                <b>
                  {enrollementTemplateData?.data?.fileName ||
                    "No template available"}
                </b>
              </Typography>
              {isDownloadAllowed && (
                <IconButton
                  onClick={handleEnrollmentDownloadTemplate}
                  size="small"
                  color="primary"
                  disabled={!enrollementTemplateData?.data || isDownloading}
                  data-testid="no-template-download-icon"
                >
                  <img src={DownloadIcon} alt="Download Template" />
                </IconButton>
              )}
            </StyledInnerStack>
            <HiddenFileInput
              id="employee-upload-input"
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleUploadFile}
            />
            <StyledBox>
              <Box mr={2}>
                <SelectStyles
                  value={documentType || "policy_employee_data"} // Default to "policy_employee_data"
                  onChange={(event) => setDocumentType(event.target.value)}
                  style={{
                    height: "40px",
                  }}
                  data-testid="employee-data-select"
                >
                  {documentTypeOptions.map((option, index) => (
                    <MenuItem key={index} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </SelectStyles>
              </Box>

              <StyledNextButton
                variantType={BUTTON_VARIANTS.SECONDARY}
                color="primary"
                component="span"
                onClick={() => {
                  const input = document.getElementById(
                    "employee-upload-input"
                  );
                  if (input) (input as HTMLInputElement).click();
                }}
                startIcon={
                  <StyledUploadIconImg src={fileUpload} alt="Upload Icon" />
                }
                disabled={uploading} // Use the uploading state here
                data-testid="upload-new-policy-employee-data"
              >
                {uploading
                  ? POLICY_EMPLOYEE_DATA.PROCESING
                  : POLICY_EMPLOYEE_DATA.UPLOAD_NEW}
              </StyledNextButton>
            </StyledBox>
          </StyledOuterStack>
          <ContainerForTable>
            <Table
              columns={columns}
              // rowData={transformUploadsData(uploadsData)}  // Uncomment when api is ready
              rowData={rowData} // Use mock data for now
              totalRows={totalRows}
              currentPage={currentPage}
              title={POLICY_EMPLOYEE_DATA.EMPLOYEE_DATA_UPLOAD}
              setCurrentPage={setCurrentPage}
              loading={loading}
              pageSize={pageSize}
              pageSizeOptions={PAGE_OPTIONS}
              setPageSize={setPageSize}
              onCellClicked={onCellClicked}
              components={{}}
              setSort={setSort}
            />
          </ContainerForTable>
        </>
      )}
    </Box>
  );
};

export default PolicyEmployeeDataTab;
