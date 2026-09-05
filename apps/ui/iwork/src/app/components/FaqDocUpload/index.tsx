import React, { useState, useMemo } from "react";
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
import { useDispatch } from "react-redux";
import {
  ENDORSEMENT_TOASTS,
  FAQ_DESCRIPTION,
  FAQ_TITLE,
  GO_BACK,
  UPLOAD,
} from "../../constants";
import {
  ModalHeadingContainer,
  ModalMainHeading,
  ModalSubHeading,
  ButtonContainer,
  StyledCancelButton,
  StyledUploadButton,
  FileInfoBox,
} from "./styles";
import { FaqUploadConfig } from "./config";
import { Stack, Typography } from "@mui/material";
import {
  OptionsWrapper,
  UploadModeContainer,
  UploadModeTitle,
  WarningContainer,
  WarningImage,
  WarningText,
} from "../HospitalUpload/styles";
import OptionCard from "../../common/RadioButtonBox";
import WarningIcon from "../../assets/svgs/warning-xs.svg";

interface FaqUploadProps {
  open: boolean;
  handleClose: () => void;
  onUpload: (file: File) => void;
  policyId: number;
  onView: () => void;
  hasUploadedData?: boolean;
}

const FaqDocUpload: React.FC<FaqUploadProps> = ({
  open,
  handleClose,
  onUpload,
  policyId,
  onView,
  hasUploadedData,
  policyDetailsData,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [formMethods, setFormMethods] = useState<any>(null);
  const [selectedUploadMode, setSelectedUploadMode] = useState<string>("add");

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const dispatch = useDispatch();
  const hasRbacPermission = useHasPermission(FeatureKey.EXPORT_FAQS);
  const isDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;

  // Memoize form config with companyType and companyId
  const formConfig = useMemo(
    () =>
      FaqUploadConfig.map((field) =>
        field.key === "uploadEmployeeFile"
          ? {
              ...field,
              componentProps: {
                ...field.componentProps,
                companyType: "policy-faq",
                companyId: String(policyId),
                showDownloadIcon: isDownloadAllowed,
              },
            }
          : field
      ),
    [policyId, isDownloadAllowed]
  );

  // Watch for form changes when form methods are available
  React.useEffect(() => {
    if (formMethods) {
      const subscription = formMethods.watch((value: any) => {
        // Check for file in uploadEmployeeFile field
        if (value?.uploadEmployeeFile) {
          const fileData = value.uploadEmployeeFile;
          setSelectedFile(fileData);
        }

        // Check for documentType selection
        if (value?.documentType) {
          setDocumentType(value.documentType);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [formMethods]);

  const uploadModeOptions = [
    {
      id: "1",
      heading: "Add to Existing",
      subheading: "Append new FAQs",
      key: "add",
    },
    {
      id: "2",
      heading: "Replace All",
      subheading: "Delete all existing FAQs and upload new ones",
      key: "replace",
    },
  ];
  // Reset selectedFile when modal closes
  React.useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setSelectedUploadMode("add");
      setDocumentType("");
      // Also reset form if available
      if (formMethods) {
        formMethods.reset();
      }
    }
  }, [open, formMethods]);

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
      try {
        // Determine if replaceAll should be true based on documentType
        const replaceAll = documentType === "Replace All";

        // Make POST API call to upload FAQ document
        const response = await apiRequest(endPoints.faqFileUploads, {
          method: HTTP_METHODS.POST,
          data: {
            policyId: policyId,
            fileId: selectedFile.id,
            replaceAll: selectedUploadMode === "replace",
          },
        });

        // Show success message
        dispatch(
          setToastMessage({
            type: "success",
            message: "FAQ document uploaded successfully",
          })
        );

        onUpload(selectedFile);
        onView();
        // handleClose();
      } catch (error) {
        // Show error message
        dispatch(
          setToastMessage({
            type: "error",
            message:
              error?.message ||
              "Failed to upload FAQ document. Please try again.",
          })
        );
      }
    } else {
      handleClose();
    }
  };

  const handleDownloadTemplate = React.useCallback(async () => {
    if (!isDownloadAllowed) return;

    try {
      const response = await apiRequest(
        endPoints.downloadFaqTemplate(policyId),
        {
          method: HTTP_METHODS.GET,
          responseType: "blob",
          headers: {
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream",
          },
        }
      );

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

      let filename = "faq-template.xlsx";
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
  }, [dispatch, policyId, isDownloadAllowed]);

  const headingChildren = () => (
    <ModalHeadingContainer>
      <ModalMainHeading>{FAQ_TITLE}</ModalMainHeading>
      <ModalSubHeading>{FAQ_DESCRIPTION}</ModalSubHeading>
    </ModalHeadingContainer>
  );
  return (
    <CustomModal
      open={open}
      handleClose={handleClose}
      heading={headingChildren()}
      modalBoxStyles={{ width: "900px", padding: "24px" }}
    >
      <Stack spacing={2}>
        <DynamicForm
          formConfig={formConfig}
          onActionMap={{ downloadTemplate: handleDownloadTemplate }}
          formMethods={setFormMethods}
          sx={{ padding: 0 }}
        />
        {/* SHOW FILE NAME AND FILE SIZE AFTER SELECTION */}
        {selectedFile && (
          <FileInfoBox>
            <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1 }}>
              Selected File:
            </Typography>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2" color="text.primary">
                📄{" "}
                {selectedFile?.fileName || selectedFile?.name || "Unknown file"}
              </Typography>
              <Stack direction="column" alignItems="flex-end">
                {selectedFile?.size ? (
                  <Typography variant="caption" color="text.primary">
                    {formatFileSize(selectedFile.size)}
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
          </FileInfoBox>
        )}
        {hasUploadedData && (
          <UploadModeContainer>
            <UploadModeTitle variant="subtitle1">Upload Mode</UploadModeTitle>
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
          </UploadModeContainer>
        )}
      </Stack>
      <ButtonContainer>
        <StyledCancelButton onClick={handleClose}>{GO_BACK}</StyledCancelButton>
        <StyledUploadButton
          disabled={!selectedFile}
          onClick={handleUploadClick}
        >
          {UPLOAD}
        </StyledUploadButton>
      </ButtonContainer>
    </CustomModal>
  );
};

export default FaqDocUpload;
