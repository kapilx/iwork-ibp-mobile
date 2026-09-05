import React, { useMemo, useState } from "react";
import {
  apiRequest,
  CustomModal,
  DynamicForm,
  endPoints,
  HTTP_METHODS,
  setToastMessage,
} from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import {
  GO_BACK,
  POLICY_FEATURE_REPLACE_ALL_WARNING,
  REPLACE,
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
} from "../FaqDocUpload/styles";
import { PolicyFeatureUploadConfig } from "./config";
import { Stack, Typography } from "@mui/material";
import {
  UploadModeContainer,
  WarningContainer,
  WarningImage,
  WarningText,
} from "../HospitalUpload/styles";
import WarningIcon from "../../assets/svgs/warning-xs.svg";

interface PolicyFeatureUploadProps {
  open: boolean;
  handleClose: () => void;
  onUpload: (file: File) => void;
  policyId: number | string;
  onView: () => void;
  hasUploadedData: boolean;
}

const PolicyFeatureUpload: React.FC<PolicyFeatureUploadProps> = ({
  open,
  handleClose,
  onUpload,
  policyId,
  onView,
  hasUploadedData,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formMethods, setFormMethods] = useState<any>(null);
  const dispatch = useDispatch();

  const formConfig = useMemo(
    () =>
      PolicyFeatureUploadConfig.map((field) =>
        field.key === "uploadEmployeeFile"
          ? {
              ...field,
              componentProps: {
                ...field.componentProps,
                companyType: "policy-feature",
                companyId: String(policyId),
              },
            }
          : field
      ),
    [policyId]
  );

  React.useEffect(() => {
    if (formMethods) {
      const subscription = formMethods.watch((value: any) => {
        if (value?.uploadEmployeeFile) {
          setSelectedFile(value.uploadEmployeeFile);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [formMethods]);

  React.useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      if (formMethods) {
        formMethods.reset();
      }
    }
  }, [open, formMethods]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUploadClick = async () => {
    if (selectedFile?.id) {
      try {
        const response = await apiRequest(
          endPoints.portalConfigPolicyFeatureDocument(policyId),
          {
            method: HTTP_METHODS.POST,
            data: {
              documentId: selectedFile.id,
            },
          }
        );

        dispatch(
          setToastMessage({
            type: "success",
            message:
              response?.message ||
              "Policy features document uploaded successfully",
          })
        );

        onUpload(selectedFile);
        onView();
        handleClose();
      } catch (error: any) {
        dispatch(
          setToastMessage({
            type: "error",
            message:
              error?.message ||
              "Failed to upload policy features document. Please try again.",
          })
        );
      }
    } else {
      handleClose();
    }
  };

  const headingChildren = () => (
    <ModalHeadingContainer>
      <ModalMainHeading>Upload policy features</ModalMainHeading>
      <ModalSubHeading>
        Upload a PDF up to 25 MB. This document will be visible to employees.
      </ModalSubHeading>
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
          formMethods={setFormMethods}
          sx={{ padding: 0 }}
        />
        {hasUploadedData && (
          <UploadModeContainer>
            <WarningContainer shouldDisplay={true}>
              <WarningImage src={WarningIcon} alt="Warning icon" />
              <WarningText>{POLICY_FEATURE_REPLACE_ALL_WARNING}</WarningText>
            </WarningContainer>
          </UploadModeContainer>
        )}
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
                {(selectedFile?.fileName || selectedFile?.name || "Unknown file").replace(/^\d+_/, "")}
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
      </Stack>
      <ButtonContainer>
        <StyledCancelButton onClick={handleClose}>{GO_BACK}</StyledCancelButton>
        <StyledUploadButton
          disabled={!selectedFile}
          onClick={handleUploadClick}
        >
          {hasUploadedData ? REPLACE : UPLOAD}
        </StyledUploadButton>
      </ButtonContainer>
    </CustomModal>
  );
};

export default PolicyFeatureUpload;
