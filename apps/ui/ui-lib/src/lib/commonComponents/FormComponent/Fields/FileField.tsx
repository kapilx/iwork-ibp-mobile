import { useEffect, useRef } from "react";
import {
  CHOOSE_FILE,
  CLICK_TO_UPLOAD,
  DOWNLOAD_TEMPLATE,
  DRAG_AND_DROP,
  DRAG_AND_DROP_TEXT,
  PLEASE_SELECT_DOCUMENT_TYPE,
  SUPPORTED_FORMATS,
} from "../../../constants";
import { FieldComponentProps, FileFieldProps } from "../types";
import { ControlledField } from "../utils";
import {
  DownloadIconContainer,
  DragAndDropText,
  EndorsementDocContainer,
  EndorsementDocContainerWrapper,
  StyledLinearProgress,
  StyledSpan,
  UploadDropZone,
  UploadFormControl,
  UploadIcon,
  UploadInstruction,
} from "./styles";
import fileUpload from "../../../assets/svgs/file-upload.svg";
import { useFileUpload } from "@ui/ui-lib/hooks/useFileUpload.js";
import { Box, LinearProgress } from "@mui/material";
import Button from "../../Button";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { setToastMessage } from "@ui/ui-lib/redux/slice";
import { useDispatch } from "react-redux";
import DownloadIcon from "../../../assets/svgs/download-icon.svg";
import DocumentIcon from "../../../assets/svgs/document-icon-blue.svg";

const FileField = ({
  field,
  control,
  selectedDocumentType,
  companyId,
  onUploadingChange,
  onFileUploaded,
  companyType,
  watch,
  onActionMap,
  opportunityId,
  opportunityActivityId,
  policyId,
  claimActivityId,
  endorsementId,
  uploadCategory,
}: FieldComponentProps & { selectedDocumentType?: string }) => {
  const dispatch = useDispatch();
  const { componentProps } = field;
  const accept = (componentProps as FileFieldProps)?.accept || "*";
  const multiple = (componentProps as FileFieldProps)?.multiple || false;
  const disableWhileUploading =
    (componentProps as FileFieldProps)?.disableWhileUploading ?? false;
  const requireDocumentType =
    (componentProps as FileFieldProps)?.requireDocumentType ?? true;
  const supportedFormatsMessage =
    (componentProps as FileFieldProps)?.supportedFormatsMessage;
  const downloadTemplateLabel =
    (componentProps as FileFieldProps & { downloadTemplateLabel?: string })
      ?.downloadTemplateLabel ?? DOWNLOAD_TEMPLATE;
  const showDownloadIcon =
    (componentProps as FileFieldProps)?.showDownloadIcon ?? true;
  const uploadEndpoint =
    (componentProps as FileFieldProps)?.uploadEndpoint || endPoints.fileUpload;
  const replaceEndpoint =
    (componentProps as FileFieldProps)?.replaceEndpoint;
  const replaceMethod =
    (componentProps as FileFieldProps)?.replaceMethod ?? "PUT";
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    fileUploadResponse,
    handleFileChange: rawHandleFileChange,
    loading,
    handleFileUpload,
  } = useFileUpload(
    {
      id: 0,
      fileName: "",
      fileBuffer: "",
    },
    uploadEndpoint,
    undefined,
    replaceEndpoint,
    replaceMethod
  );

  // for setting loader
  useEffect(() => {
    onUploadingChange?.(loading);
  }, [loading]);

  const docType = selectedDocumentType ?? watch?.("documentType");

  const handleFileDrop = (
    e: React.DragEvent<HTMLDivElement>,
    onChange?: (value: any) => void
  ) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const normalizedCompanyId = companyId ?? "";
      handleFileUpload(
        files[0],
        companyType,
        normalizedCompanyId,
        docType as string,
        onChange,
        opportunityId,
        opportunityActivityId,
        policyId,
        claimActivityId,
        endorsementId,
        uploadCategory
      );
    }
  };

  return (
    <ControlledField
      field={field}
      control={control}
      render={({ error, value, onChange }) => {
        const isDisabled =
          field?.componentProps?.disabled ||
          (disableWhileUploading ? loading : false);

        useEffect(() => {
          if (fileUploadResponse?.data) {
            onChange(fileUploadResponse.data);
            if (onFileUploaded) {
              onFileUploaded(fileUploadResponse.data);
            }
          }
        }, [fileUploadResponse, onChange]);

        const handleClick = () => {
          if (disableWhileUploading && loading) {
            return;
          }
          inputRef.current?.click();
        };

        const handleValidatedFileChange = (
          e: React.ChangeEvent<HTMLInputElement>
        ) => {
          if (requireDocumentType && !docType) {
            dispatch(setToastMessage(PLEASE_SELECT_DOCUMENT_TYPE));
            e.target.value = "";
            return;
          }
          const normalizedCompanyId = companyId ?? "";
          rawHandleFileChange(
            e,
            companyType,
            normalizedCompanyId,
            docType,
            onChange,
            opportunityId,
            opportunityActivityId,
            policyId,
            claimActivityId,
            endorsementId,
            uploadCategory
          );
        };

        const loaderForEndorsementDoc =
          field?.componentProps?.customVariant === "endorsementDoc" &&
          field?.name === "uploadEmployeeFile";

        return (
          <>
            {field?.componentProps?.customVariant === "endorsementDoc" ? (
              <Box data-testid="document-upload">
                {loading && loaderForEndorsementDoc && (
                  <StyledLinearProgress color="secondary" />
                )}
                <UploadFormControl
                  disabled={isDisabled}
                  fullWidth
                  error={!!error}
                >
                  <input
                    hidden
                    ref={inputRef}
                    accept={accept}
                    id={field.name}
                    type="file"
                    multiple={multiple}
                    onChange={handleValidatedFileChange}
                  />
                  <EndorsementDocContainerWrapper>
                    <EndorsementDocContainer
                      onClick={() => {
                        if (requireDocumentType && !docType) {
                          dispatch(
                            setToastMessage(PLEASE_SELECT_DOCUMENT_TYPE)
                          );
                          return;
                        }
                        handleClick();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (requireDocumentType && !docType) {
                          dispatch(
                            setToastMessage(PLEASE_SELECT_DOCUMENT_TYPE)
                          );
                          return;
                        }
                        handleFileDrop(e, onChange);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <UploadIcon
                        customVariant={field?.componentProps?.customVariant}
                        src={field.UploadIcon ?? fileUpload}
                      />
                      <DragAndDropText>{DRAG_AND_DROP_TEXT}</DragAndDropText>
                      <Box sx={{ display: "flex", gap: 3, mt: 2 }}>
                        <Button
                          variantType="secondary"
                          sizeType="small"
                          disabled={isDisabled}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClick();
                          }}
                        >
                          <DownloadIconContainer src={DocumentIcon} />
                          {CHOOSE_FILE}
                          {fileUploadResponse?.data?.fileSize ? ` (${fileUploadResponse.data.fileSize})` : <></>}
                        </Button>
                        {onActionMap?.downloadTemplate && (
                          <Button
                            variantType="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onActionMap.downloadTemplate();
                            }}
                          >
                            {showDownloadIcon && <DownloadIconContainer src={DownloadIcon} />}
                            {downloadTemplateLabel}
                          </Button>
                        )}
                      </Box>
                      {supportedFormatsMessage && (
                        <UploadInstruction style={{ textAlign: 'center' }}>
                          {supportedFormatsMessage}
                        </UploadInstruction>
                      )}
                    </EndorsementDocContainer>
                  </EndorsementDocContainerWrapper>
                </UploadFormControl>
              </Box>
            ) : (
              <Box data-testid="document-upload">
                <UploadFormControl
                  disabled={field?.componentProps?.disabled}
                  fullWidth
                  error={!!error}
                >
                  <input
                    hidden
                    ref={inputRef}
                    accept={accept}
                    id={field.name}
                    type="file"
                    multiple={multiple}
                    onChange={handleValidatedFileChange}
                  />
                  <UploadDropZone
                    onClick={() => {
                      if (requireDocumentType && !docType) {
                        dispatch(setToastMessage(PLEASE_SELECT_DOCUMENT_TYPE));
                        return;
                      }
                      handleClick();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (requireDocumentType && !docType) {
                        dispatch(setToastMessage(PLEASE_SELECT_DOCUMENT_TYPE));
                        return;
                      }
                      handleFileDrop(e, onChange);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    customVariant={field.componentProps?.customVariant}
                  >
                    <UploadIcon src={field.UploadIcon ?? fileUpload} />
                    <UploadInstruction>
                      <StyledSpan
                        customVariant={field.componentProps?.customVariant}
                      >
                        {CLICK_TO_UPLOAD}
                      </StyledSpan>{" "}
                      {DRAG_AND_DROP}
                    </UploadInstruction>
                  </UploadDropZone>
                  {supportedFormatsMessage && (
                    <UploadInstruction style={{ textAlign: 'center',paddingTop:"4px" }}>
                      {supportedFormatsMessage}
                    </UploadInstruction>
                  )}
                </UploadFormControl>
              </Box>
            )}
          </>
        );
      }}
    />
  );
};
export default FileField;
