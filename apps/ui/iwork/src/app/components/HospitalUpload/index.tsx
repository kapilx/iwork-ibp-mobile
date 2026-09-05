import React, { useMemo, useState } from "react";
import { Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  apiRequest,
  CustomModal,
  DynamicForm,
  endPoints,
  HTTP_METHODS,
  setToastMessage,
  useHasPermission,
  FeatureKey,
} from "@ui/ui-lib";
import { environment } from "@ui/ui-lib/environment";
import { HospitalUploadConfig } from "./config";
import { useDispatch } from "react-redux";
import {
  ENDORSEMENT_TOASTS,
  FILE_PROCESSING,
  READY_TO_UPLOAD,
  REPLACE_ALL_WARNING,
  UPLOAD_MODE,
} from "../../constants";
import {
  ModalHeadingContainer,
  ModalMainHeading,
  ModalSubHeading,
  ButtonContainer,
  StyledCancelButton,
  StyledUploadButton,
  SelectedFileContainer,
  CloseIconButton,
  FileSizeAndStatusContainer,
  FileNameTypography,
  FileHeaderContainer,
  FileIconTypography,
  FileContentContainer,
  FileSizeTypography,
  CheckTypography,
  CheckmarkIcon,
  ReadyToUploadContainer,
  UploadModeContainer,
  UploadModeTitle,
  OptionsWrapper,
  WarningContainer,
  WarningText,
  WarningImage,
} from "./styles";
import {
  NetworkHospitalUpload,
  NetworkHospitalUploadDescription,
  GO_BACK,
  UPLOAD,
} from "../../constants";
import OptionCard from "../../common/RadioButtonBox";
import WarningIcon from "../../assets/svgs/warning-xs.svg";
interface UploadedFile {
  id?: number;
  fileName?: string;
  name?: string;
  size?: number;
  fileBuffer?: string;
  [key: string]: any;
}

interface HospitalUploadProps {
  open: boolean;
  handleClose: () => void;
  onUpload: (file: File) => void;
  policyId: number;
  onView: () => void;
  hasUploadedData: boolean;
}

const uploadModeOptions = [
  {
    id: "1",
    heading: "Add to Existing",
    subheading: "Append new hospitals",
    key: "add",
  },
  {
    id: "2",
    heading: "Replace All",
    subheading: "Delete all hospitals",
    key: "replace",
  },
];

const headingChildren = () => (
  <ModalHeadingContainer>
    <ModalMainHeading>{NetworkHospitalUpload}</ModalMainHeading>
    <ModalSubHeading>{NetworkHospitalUploadDescription}</ModalSubHeading>
  </ModalHeadingContainer>
);

const HospitalUpload: React.FC<HospitalUploadProps> = ({
  open,
  handleClose,
  onUpload,
  policyId,
  onView,
  hasUploadedData,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [formMethods, setFormMethods] = useState<any>(null);
  const [selectedUploadMode, setSelectedUploadMode] = useState<string>("add");
  const [isUploading, setIsUploading] = useState(false);
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const dispatch = useDispatch();
  const hasRbacPermission = useHasPermission(FeatureKey.EXPORT_HOSPITAL_LISTING);
  const isDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;

  // Watch for form changes when form methods are available
  React.useEffect(() => {
    if (formMethods) {
      const subscription = formMethods.watch((value: any) => {
        // Check for file in uploadEmployeeFile field
        if (value?.uploadEmployeeFile) {
          const fileData = value.uploadEmployeeFile;
          setSelectedFile(fileData);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [formMethods]);

  // Reset selectedFile when modal closes
  React.useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setSelectedUploadMode("add");
      setIsUploading(false);
      // Also reset form if available
      if (formMethods) {
        formMethods.reset();
      }
    }
  }, [open, formMethods]);

  const formConfig = useMemo(
    () =>
      HospitalUploadConfig.map((field) =>
        field.key === "uploadEmployeeFile"
          ? {
              ...field,
              componentProps: {
                ...field.componentProps,
                companyType: "policy-hospital-network",
                companyId: String(policyId),
                showDownloadIcon: isDownloadAllowed,
              },
            }
          : field
      ),
    [policyId, isDownloadAllowed]
  );

  // Format file size to readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUploadClick = async () => {
    if (selectedFile) {
      setIsUploading(true);
      try {
        // Make POST API call to upload hospital network data
        const response = await apiRequest(
          endPoints.hospitalNetworkUpload(policyId),
          {
            method: HTTP_METHODS.POST,
            data: {
              fileId: selectedFile.id, // Send fileId in body
              isReplaceAll: selectedUploadMode === "replace",
            },
          }
        );

        // Show success message
        dispatch(
          setToastMessage({
            toastMessage: 7000,
            message:
              response?.message ??
              "Hospital network data uploaded successfully",
          })
        );
        onView();
        // onUpload(selectedFile);
      } catch (error) {
        // Show error message
        dispatch(
          setToastMessage({
            type: "error",
            message:
              error?.message ||
              "Failed to upload hospital network data. Please try again.",
          })
        );
        setIsUploading(false);
      }
    }
    // handleClose();
  };
  const handleDownloadTemplate = React.useCallback(async () => {
    if (!isDownloadAllowed) return;

    try {
      const response = await apiRequest(endPoints.getHospitalNetworkTemplate, {
        method: HTTP_METHODS.GET,
        responseType: "blob",
        headers: {
          Accept:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream",
        },
      });

      // The response.data should already be a Blob when responseType is 'blob'
      const blob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

      // Validate that we got a valid Excel file
      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }

      let filename = "hospital-upload-template.xlsx";
      const contentDisposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");

      if (contentDisposition) {
        const match = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, "");
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);

      dispatch(
        setToastMessage(ENDORSEMENT_TOASTS.TEMPLATE_DOWNLOADED_SUCCESSFULLY)
      );
    } catch (e) {
      console.error("Template download error:", e);
      dispatch(setToastMessage(ENDORSEMENT_TOASTS.DOWNLOAD_FAILED_TRY_AGAIN));
    }
  }, [dispatch, isDownloadAllowed]);

  return (
    <CustomModal
      open={open}
      handleClose={handleClose}
      heading={headingChildren()}
      modalBoxStyles={{ width: "900px", padding: "24px" }}
    >
      <Stack spacing={2}>
        {/* <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Bulk Upload" />
          <Tab label="Manual Entry" />
        </Tabs> */}
        {/* <Divider /> */}
        <DynamicForm
          formConfig={formConfig}
          onActionMap={{ downloadTemplate: handleDownloadTemplate }}
          formMethods={setFormMethods}
          sx={{ padding: 0 }}
        />
        {/* SHOW FILE NAME AND FILE SIZE AFTER SELECTION */}
        {selectedFile && (
          <SelectedFileContainer>
            <CloseIconButton onClick={() => setSelectedFile(null)} size="small">
              <CloseIcon fontSize="small" />
            </CloseIconButton>

            <FileContentContainer>
              <FileIconTypography>📄</FileIconTypography>
              <FileHeaderContainer>
                <FileNameTypography
                  title={
                    selectedFile?.fileName ||
                    selectedFile?.name ||
                    "Unknown file"
                  }
                >
                  {(() => {
                    const fullFileName =
                      selectedFile?.fileName ||
                      selectedFile?.name ||
                      "Unknown file";
                    const cleanFileName = fullFileName.replace(/^\d+_/, "");
                    return cleanFileName;
                  })()}
                </FileNameTypography>
                <FileSizeAndStatusContainer>
                  {(selectedFile?.size || selectedFile?.fileBuffer) && (
                    <FileSizeTypography>
                      {(() => {
                        if (selectedFile?.size) {
                          return formatFileSize(selectedFile.size);
                        } else if (selectedFile?.fileBuffer) {
                          const base64Length = selectedFile.fileBuffer.length;
                          const approximateSize = Math.round(
                            (base64Length * 3) / 4
                          );
                          return formatFileSize(approximateSize);
                        }
                        return "";
                      })()}
                    </FileSizeTypography>
                  )}

                  <ReadyToUploadContainer>
                    {!isUploading && <CheckmarkIcon />}
                    <CheckTypography>
                      {isUploading ? FILE_PROCESSING : READY_TO_UPLOAD}
                    </CheckTypography>
                  </ReadyToUploadContainer>
                </FileSizeAndStatusContainer>
              </FileHeaderContainer>
            </FileContentContainer>
          </SelectedFileContainer>
        )}
        {/* <UploadMode /> */}
        {hasUploadedData && (
          <UploadModeContainer>
            <UploadModeTitle variant="subtitle1">{UPLOAD_MODE}</UploadModeTitle>
            <OptionsWrapper>
              {uploadModeOptions.map((option) => (
                <OptionCard
                  key={option.key}
                  optionKey={option.key}
                  heading={option.heading}
                  subheading={option.subheading}
                  selected={selectedUploadMode}
                  onSelect={setSelectedUploadMode}
                  warning={option.key === "replace"}
                />
              ))}
            </OptionsWrapper>
            <WarningContainer shouldDisplay={selectedUploadMode === "replace"}>
              <WarningImage src={WarningIcon} alt="Warning icon" />
              <WarningText>{REPLACE_ALL_WARNING}</WarningText>
            </WarningContainer>
          </UploadModeContainer>
        )}
      </Stack>
      <ButtonContainer>
        <StyledCancelButton onClick={handleClose}>{GO_BACK}</StyledCancelButton>
        <StyledUploadButton
          disabled={!selectedFile || isUploading}
          onClick={handleUploadClick}
        >
          {UPLOAD}
        </StyledUploadButton>
      </ButtonContainer>
    </CustomModal>
  );
};

export default HospitalUpload;
