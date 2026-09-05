import React, { useCallback, useEffect, useRef, useState } from "react";
import { Stack } from "@mui/material";
import {
  Button,
  CustomModal,
  DocumentPreview,
  HTTP_METHODS,
  apiRequest,
  endPoints,
  setToastMessage,
  useApiQuery,
} from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import {
  DownloadIconContainer,
  UploadIcon,
} from "@ui/ui-lib/commonComponents/FormComponent/Fields/styles";
import fileUpload from "@ui/ui-lib/assets/svgs/file-upload.svg";
import DocumentIcon from "@ui/ui-lib/assets/svgs/document-icon-blue.svg";
import eyeIcon from "../../../../assets/svgs/eye-icon-sm.svg";
import refreshIcon from "@ui/ui-lib/assets/svgs/refresh-icon.svg";
import deleteIcon from "@ui/ui-lib/assets/svgs/delete-bin.svg";
import {
  ActionRow,
  FileActionIcon,
  FileActionRow,
  FileInfoRow,
  HeaderContainer,
  PreviewModalContent,
  SectionHeading,
  SectionSubheading,
  SelectedFileCard,
  SelectedFileIcon,
  SelectedFileLabel,
  SelectedFileMeta,
  SelectedFileName,
  SelectedFileTimestamp,
  TabContainer,
  UploadAreaContent,
  UploadAreaWrapper,
  UploadButtonRow,
  UploadHeading,
  UploadHelpText,
} from "./styles";

type CompanyPolicyFeatureDocumentTabProps = {
  companyId?: string | number | null;
};

type UploadedPolicyFeatureFile = {
  id?: number | string;
  documentId?: number | string;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  uploadedBy?: string;
};

const MAX_FILE_SIZE_MB = 25;
const DEFAULT_ACCEPT = "application/pdf";

const formatUploadedAt = (value?: string) => {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
  const timePart = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
  return `${datePart}, ${timePart}`;
};

export const CompanyPolicyFeatureDocumentTab: React.FC<
  CompanyPolicyFeatureDocumentTabProps
> = ({ companyId }) => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [uploadedDocument, setUploadedDocument] =
    useState<UploadedPolicyFeatureFile | null>(null);
  const [mappedDocument, setMappedDocument] =
    useState<UploadedPolicyFeatureFile | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const numericCompanyId = Number(companyId);

  const { data: existingDocumentResponse } = useApiQuery({
    url: Number.isFinite(numericCompanyId)
      ? endPoints.companyPolicyFeatureDocumentByCompanyId(numericCompanyId)
      : "",
    queryKey: ["company-policy-feature-document", numericCompanyId],
    enabled: Number.isFinite(numericCompanyId),
  });

  const existingDocument = (existingDocumentResponse?.data ??
    existingDocumentResponse) as UploadedPolicyFeatureFile | null;
  const activeDocument = uploadedDocument ?? mappedDocument ?? existingDocument ?? null;
  // The document already saved against the company (no pending upload in flight).
  // Only treat it as present when it actually carries a document id — the API
  // returns an object with documentId: null when nothing is uploaded yet.
  const savedDocumentCandidate = !uploadedDocument
    ? mappedDocument ?? existingDocument ?? null
    : null;
  const savedDocument =
    savedDocumentCandidate &&
    (savedDocumentCandidate.documentId ?? savedDocumentCandidate.id)
      ? savedDocumentCandidate
      : null;

  useEffect(() => {
    setMappedDocument(existingDocument ?? null);
  }, [existingDocument]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return null;
      });
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return objectUrl;
    });

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const resetPendingFile = useCallback(() => {
    setSelectedFile(null);
    setUploadedDocument(null);
    setIsPreviewOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleSelectFile = useCallback(
    async (file?: File | null) => {
      if (!file) return;

      if (file.type !== DEFAULT_ACCEPT && !file.name.toLowerCase().endsWith(".pdf")) {
        dispatch(setToastMessage("Upload PDF only (max 25 MB)."));
        return;
      }

      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        dispatch(setToastMessage("Upload PDF only (max 25 MB)."));
        return;
      }

      if (!Number.isFinite(numericCompanyId)) {
        dispatch(setToastMessage("Company ID is not available."));
        return;
      }

      try {
        setSelectedFile(file);
        setUploadedDocument(null);
        setIsUploadingFile(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("companyType", "policyFeature");
        formData.append("companyId", String(numericCompanyId));
        formData.append("documentTypeLid", -1);

        const uploadResponse = await apiRequest(endPoints.fileUpload, {
          method: HTTP_METHODS.POST,
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        });

        const uploadedFile =
          uploadResponse?.data?.data ??
          uploadResponse?.data ??
          uploadResponse;

        const documentId = Number(
          uploadedFile?.id ??
            uploadedFile?.documentId ??
            uploadedFile?.fileId
        );

        if (!Number.isFinite(documentId)) {
          throw new Error(
            "File upload succeeded but document ID was not returned."
          );
        }

        setUploadedDocument(uploadedFile);
      } catch (_error) {
        setUploadedDocument(null);
        dispatch(setToastMessage("Failed to upload the selected file."));
      } finally {
        setIsUploadingFile(false);
      }
    },
    [dispatch, numericCompanyId]
  );

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    await handleSelectFile(file);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    await handleSelectFile(file);
  };

  const handleSubmit = async () => {
    if (!Number.isFinite(numericCompanyId)) {
      dispatch(setToastMessage("Company ID is not available."));
      return;
    }

    const documentId = Number(
      uploadedDocument?.id ??
        uploadedDocument?.documentId ??
        uploadedDocument?.fileId
    );

    if (!Number.isFinite(documentId)) {
      dispatch(setToastMessage("Please upload a PDF file first."));
      return;
    }

    setIsSubmitting(true);
    try {
      const mappingResponse = await apiRequest(
        endPoints.companyPolicyFeatureDocument,
        {
          method: HTTP_METHODS.PUT,
          data: {
            companyId: numericCompanyId,
            documentId,
          },
        }
      );

      const mappedResponse =
        mappingResponse?.data?.data ??
        mappingResponse?.data ??
        mappingResponse;

      setMappedDocument({
        companyId: numericCompanyId,
        documentId,
        id: documentId,
        fileName: uploadedDocument?.fileName ?? selectedFile?.name,
        uploadedAt:
          mappedResponse?.uploadedAt ??
          uploadedDocument?.uploadedAt ??
          uploadedDocument?.updatedAt ??
          uploadedDocument?.createdAt,
        uploadedBy: mappedResponse?.uploadedBy ?? mappedDocument?.uploadedBy,
      } as UploadedPolicyFeatureFile);

      dispatch(
        setToastMessage("Policy feature document uploaded successfully.")
      );
      resetPendingFile();
    } catch (error: any) {
      dispatch(
        setToastMessage(
          error?.message ??
            "Failed to upload the policy feature document. Please try again."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSavedDocument = async () => {
    if (!Number.isFinite(numericCompanyId)) {
      dispatch(setToastMessage("Company ID is not available."));
      return;
    }

    setIsDeleting(true);
    try {
      await apiRequest(
        endPoints.companyPolicyFeatureDocumentByCompanyId(numericCompanyId),
        { method: HTTP_METHODS.DELETE }
      );

      setMappedDocument(null);
      setUploadedDocument(null);
      setIsDeleteConfirmOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["company-policy-feature-document", numericCompanyId],
      });
      dispatch(setToastMessage("Policy feature document deleted successfully."));
    } catch (error: any) {
      dispatch(
        setToastMessage(
          error?.message ??
            "Failed to delete the policy feature document. Please try again."
        )
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <TabContainer>
      <HeaderContainer>
        <SectionHeading>
          Policy Feature Document
        </SectionHeading>
        <SectionSubheading>
          Upload a PDF document that will be shown as the company-level
          policy feature document.
        </SectionSubheading>
      </HeaderContainer>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept=".pdf"
        onChange={handleFileInputChange}
      />

      <UploadAreaWrapper
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <UploadAreaContent>
          <UploadIcon
            customVariant="endorsementDoc"
            src={fileUpload}
          />
          <UploadHeading>
            {`Drag and drop your file here, or`}
          </UploadHeading>
          <UploadButtonRow>
            <Button
              variantType="secondary"
              sizeType="small"
              onClick={() => fileInputRef.current?.click()}
            >
              <DownloadIconContainer src={DocumentIcon} />
              Choose file
            </Button>
          </UploadButtonRow>
          <UploadHelpText>
            Upload PDF only (max 25 MB)
          </UploadHelpText>

          {activeDocument ? (
            <SelectedFileCard>
              <FileInfoRow>
                <SelectedFileIcon src={DocumentIcon} alt="Selected file" />
                <SelectedFileMeta>
                  <SelectedFileLabel>
                    Selected file
                  </SelectedFileLabel>
                  <SelectedFileName variant="body2">
                    {(activeDocument?.fileName ?? selectedFile?.name ?? "").replace(/^\d+_/, "")}
                  </SelectedFileName>
                  <SelectedFileTimestamp>
                    {uploadedDocument
                      ? uploadedDocument?.fileSize ||
                        formatUploadedAt(
                          uploadedDocument?.uploadedAt ??
                            uploadedDocument?.updatedAt ??
                            uploadedDocument?.createdAt
                        )
                      : [
                          formatUploadedAt(existingDocument?.uploadedAt),
                          existingDocument?.uploadedBy,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                  </SelectedFileTimestamp>
                </SelectedFileMeta>
                <FileActionRow>
                  <FileActionIcon
                    src={eyeIcon}
                    alt="Preview file"
                    onClick={() => setIsPreviewOpen(true)}
                  />
                  <FileActionIcon
                    src={refreshIcon}
                    alt="Re-upload file"
                    onClick={() => fileInputRef.current?.click()}
                  />
                  {uploadedDocument ? (
                    <FileActionIcon
                      src={deleteIcon}
                      alt="Delete file"
                      onClick={resetPendingFile}
                    />
                  ) : savedDocument ? (
                    <FileActionIcon
                      src={deleteIcon}
                      alt="Delete saved document"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                    />
                  ) : null}
                </FileActionRow>
              </FileInfoRow>
            </SelectedFileCard>
          ) : null}

          <ActionRow sx={{ mt: activeDocument ? 0.5 : 1 }}>
            <Button
              variantType="primary"
              onClick={handleSubmit}
              disabled={!uploadedDocument || isSubmitting || isUploadingFile}
              sx={{ minWidth: { xs: "100%", sm: "220px" } }}
            >
              {isUploadingFile
                ? "Uploading file..."
                : isSubmitting
                ? "Saving..."
                : "Upload Document"}
            </Button>
          </ActionRow>
        </UploadAreaContent>
      </UploadAreaWrapper>

      <CustomModal
        open={isPreviewOpen}
        handleClose={() => setIsPreviewOpen(false)}
        heading="Preview Document"
        modalBoxStyles={{ width: "min(1100px, 92vw)" }}
        noPadding
      >
        <PreviewModalContent>
          {selectedFile && previewUrl ? (
            <DocumentPreview
              fileName={activeDocument?.fileName ?? selectedFile?.name ?? "Preview"}
              fileUrl={previewUrl}
              mimeType={selectedFile?.type || DEFAULT_ACCEPT}
              showDownloadButton={false}
              showFileMeta={false}
              previewHeight="72vh"
              toolbarPlacement="top"
            />
          ) : activeDocument ? (
            <DocumentPreview
              fileName={activeDocument?.fileName ?? "Preview"}
              fileId={Number(activeDocument?.documentId ?? activeDocument?.id)}
              showDownloadButton={false}
              showFileMeta={false}
              previewHeight="72vh"
              toolbarPlacement="top"
            />
          ) : null}
        </PreviewModalContent>
      </CustomModal>

      <CustomModal
        open={isDeleteConfirmOpen}
        handleClose={() => !isDeleting && setIsDeleteConfirmOpen(false)}
        heading="Delete Policy Feature Document"
        modalBoxStyles={{ maxWidth: "440px", width: "100%" }}
      >
        <Stack spacing={3} sx={{ p: 1 }}>
          <SectionSubheading>
            Are you sure you want to delete this policy feature document?
            Employees will no longer be able to view it.
          </SectionSubheading>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variantType="secondary"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variantType="primary"
              onClick={handleDeleteSavedDocument}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </Stack>
        </Stack>
      </CustomModal>
    </TabContainer>
  );
};

export default CompanyPolicyFeatureDocumentTab;
