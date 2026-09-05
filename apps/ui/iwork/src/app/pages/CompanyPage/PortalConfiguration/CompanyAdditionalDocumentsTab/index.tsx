import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import {
  Button,
  CustomModal,
  DocumentPreview,
  HTTP_METHODS,
  apiRequest,
  endPoints,
  setToastMessage,
} from "@ui/ui-lib";
import { useDispatch } from "react-redux";
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
  DocumentCard,
  DocumentMeta,
  DocumentName,
  DocumentTimestamp,
  ActionRow,
  FileActionIcon,
  FileActionRow,
  FileInfoRow,
  HeaderContainer,
  PendingFileCard,
  PendingFilesScrollArea,
  PreviewModalContent,
  SelectedFileIcon,
  SelectedFileLabel,
  SelectedFileMeta,
  SelectedFileName,
  SelectedFileTimestamp,
  SectionHeading,
  SectionSubheading,
  TabContainer,
  ContentGrid,
  UploadAreaContent,
  UploadAreaWrapper,
  UploadButtonRow,
  UploadHeading,
  UploadHelpText,
  RightRail,
  RightRailCard,
  RightRailHeading,
  RightRailBody,
  RightRailScrollArea,
  RightRailSectionDivider,
  UploadedDocumentsScrollArea,
  RightRailEmptyState,
} from "./styles";

type CompanyAdditionalDocumentsTabProps = {
  companyId?: string | number | null;
  isEditMode?: boolean;
};

type UploadedCompanyDocument = {
  id?: number | string;
  documentId?: number | string;
  name?: string;
  fileName?: string;
  filePath?: string;
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

const normalizeCompanyDocuments = (
  documents: unknown[]
): UploadedCompanyDocument[] =>
  documents
    .map((document) => {
      if (!document || typeof document !== "object") {
        return null;
      }

      const candidate = document as Record<string, unknown>;
      const id = Number(
        candidate.id ?? candidate.documentId ?? candidate.fileId ?? NaN
      );

      if (!Number.isFinite(id)) {
        return null;
      }

      const fileName =
        typeof candidate.fileName === "string"
          ? candidate.fileName
          : typeof candidate.name === "string"
          ? candidate.name
          : undefined;

      return {
        id,
        documentId: id,
        name: fileName,
        fileName,
        filePath:
          typeof candidate.filePath === "string"
            ? candidate.filePath
            : typeof candidate.fileKey === "string"
            ? candidate.fileKey
            : undefined,
        fileSize:
          typeof candidate.fileSize === "string"
            ? candidate.fileSize
            : candidate.fileSize != null
            ? String(candidate.fileSize)
            : undefined,
        uploadedAt:
          typeof candidate.uploadedAt === "string"
            ? candidate.uploadedAt
            : typeof candidate.createdAt === "string"
            ? candidate.createdAt
            : typeof candidate.updatedAt === "string"
            ? candidate.updatedAt
            : undefined,
        uploadedBy:
          typeof candidate.uploadedBy === "string"
            ? candidate.uploadedBy
            : undefined,
      } satisfies UploadedCompanyDocument;
    })
    .filter(
      (document): document is UploadedCompanyDocument => Boolean(document)
    );

export const CompanyAdditionalDocumentsTab: React.FC<
  CompanyAdditionalDocumentsTabProps
> = ({ companyId }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedCompanyDocument[]
  >([]);
  const [isSelectingFiles, setIsSelectingFiles] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] =
    useState<UploadedCompanyDocument | null>(null);

  const numericCompanyId = Number(companyId);

  const syncCompanyAdditionalDocuments = useCallback(
    async (documents: UploadedCompanyDocument[]) => {
      if (!Number.isFinite(numericCompanyId)) {
        return;
      }

      const response = await apiRequest(
        endPoints.companyAdditionalDocuments(numericCompanyId),
        {
          method: HTTP_METHODS.POST,
          data: documents.map((document) => ({
            id: Number(document.documentId ?? document.id),
            name: document.fileName ?? document.name,
            fileName: document.fileName ?? document.name,
            filePath: document.filePath,
            fileSize: document.fileSize,
            uploadedAt:
              document.uploadedAt ??
              document.createdAt ??
              document.updatedAt,
            uploadedBy: document.uploadedBy,
          })),
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const savedDocuments =
        response?.data?.data?.documentIds ??
        response?.data?.documentIds ??
        response?.data?.data ??
        [];
      const savedDocumentList = Array.isArray(savedDocuments)
        ? savedDocuments
        : [];

      console.log(
        "Uploaded additional document IDs:",
        savedDocumentList.map((document: UploadedCompanyDocument) =>
          Number(document.documentId ?? document.id)
        )
      );
    },
    [numericCompanyId]
  );

  const loadCompanyAdditionalDocuments = useCallback(async () => {
    if (!Number.isFinite(numericCompanyId)) {
      setUploadedDocuments([]);
      return;
    }

    const response = await apiRequest(
      endPoints.companyAdditionalDocuments(numericCompanyId),
      {
        method: HTTP_METHODS.GET,
        headers: {
          Accept: "application/json",
        },
      }
    );

    const documents =
      response?.data?.data?.documentIds ??
      response?.data?.documentIds ??
      response?.data?.data ??
      [];

    setUploadedDocuments(
      normalizeCompanyDocuments(Array.isArray(documents) ? documents : [])
    );
  }, [numericCompanyId]);

  useEffect(() => {
    void loadCompanyAdditionalDocuments().catch(() => {
      dispatch(
        setToastMessage("Failed to load additional documents for this company.")
      );
    });
  }, [dispatch, loadCompanyAdditionalDocuments]);

  const handleSelectFiles = useCallback(
    async (files?: FileList | File[] | null) => {
      setIsSelectingFiles(true);
      try {
        const nextFiles = Array.from(files ?? []);
        if (!nextFiles.length) {
          return;
        }

        const validFiles = nextFiles.filter((file) => {
          const isPdf =
            file.type === DEFAULT_ACCEPT || file.name.toLowerCase().endsWith(".pdf");
          if (!isPdf) {
            dispatch(setToastMessage("Upload PDF only (max 25 MB each)."));
            return false;
          }

          const fileSizeMB = file.size / (1024 * 1024);
          if (fileSizeMB > MAX_FILE_SIZE_MB) {
            dispatch(setToastMessage("Upload PDF only (max 25 MB each)."));
            return false;
          }

          return true;
        });

        if (!validFiles.length) {
          return;
        }

        setSelectedFiles((current) => [...current, ...validFiles]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } finally {
        setIsSelectingFiles(false);
      }
    },
    [dispatch]
  );

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    await handleSelectFiles(event.target.files);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    await handleSelectFiles(event.dataTransfer.files);
  };

  const removeSelectedFile = useCallback((index: number) => {
    setSelectedFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }, []);

  const uploadSelectedFiles = useCallback(async () => {
    if (!Number.isFinite(numericCompanyId)) {
      dispatch(setToastMessage("Company ID is not available."));
      return;
    }

    if (!selectedFiles.length) {
      dispatch(setToastMessage("Please choose one or more PDF files first."));
      return;
    }

    setIsUploadingFiles(true);

    try {
      const uploadedDocumentsBatch: UploadedCompanyDocument[] = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("companyType", "companyAdditionalDocuments");
        formData.append("companyId", String(numericCompanyId));
        formData.append("documentTypeLid", "-1");

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

        uploadedDocumentsBatch.push({
          id: documentId,
          documentId,
          fileName:
            uploadedFile?.fileName ??
            uploadedFile?.fileKey?.split("/").pop() ??
            file.name,
          fileSize: uploadedFile?.fileSize,
          uploadedAt:
            uploadedFile?.uploadedAt ??
            uploadedFile?.createdAt ??
            uploadedFile?.updatedAt,
          uploadedBy: uploadedFile?.uploadedBy,
        });
      }

      const nextUploadedDocuments = [
        ...uploadedDocumentsBatch,
        ...uploadedDocuments,
      ];
      await syncCompanyAdditionalDocuments(nextUploadedDocuments);
      setUploadedDocuments(nextUploadedDocuments);
      setSelectedFiles([]);
      dispatch(
        setToastMessage("Additional documents uploaded successfully.")
      );
    } catch (_error) {
      dispatch(setToastMessage("Failed to upload the selected documents."));
    } finally {
      setIsUploadingFiles(false);
    }
  }, [
    dispatch,
    numericCompanyId,
    selectedFiles,
    syncCompanyAdditionalDocuments,
    uploadedDocuments,
  ]);

  const handleOpenPreview = (document: UploadedCompanyDocument) => {
    setPreviewDocument(document);
    setIsPreviewOpen(true);
  };

  const handleRemoveUploadedDocument = useCallback(
    async (documentId?: number | string) => {
      try {
        const nextUploadedDocuments = uploadedDocuments.filter(
          (document) =>
            String(document.documentId ?? document.id) !== String(documentId)
        );
        await syncCompanyAdditionalDocuments(nextUploadedDocuments);
        setUploadedDocuments(nextUploadedDocuments);
      } catch (_error) {
        dispatch(
          setToastMessage("Failed to update additional documents.")
        );
      }
    },
    [dispatch, syncCompanyAdditionalDocuments, uploadedDocuments]
  );

  const previewedDocumentId = Number(
    previewDocument?.documentId ?? previewDocument?.id
  );

  return (
    <TabContainer>
      <HeaderContainer>
        <SectionHeading>Additional Documents</SectionHeading>
        <SectionSubheading>
          Upload additional PDF documents that should be available at the company level.
        </SectionSubheading>
      </HeaderContainer>

      <ContentGrid>
        <Box>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".pdf"
            multiple
            onChange={handleFileInputChange}
          />

          <UploadAreaWrapper
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <UploadAreaContent>
              <UploadIcon customVariant="endorsementDoc" src={fileUpload} />
              <UploadHeading>Drag and drop your files here, or</UploadHeading>
              <UploadButtonRow>
                <Button
                  variantType="secondary"
                  sizeType="small"
                  disabled={isSelectingFiles}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isSelectingFiles ? (
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <CircularProgress size={14} thickness={5} />
                      Choosing files...
                    </Box>
                  ) : (
                    <>
                      <DownloadIconContainer src={DocumentIcon} />
                      Choose files
                    </>
                  )}
                </Button>
              </UploadButtonRow>
              <UploadHelpText>Upload PDF only (max 25 MB each)</UploadHelpText>

              <ActionRow sx={{ mt: selectedFiles.length ? 0.5 : 1 }}>
                <Button
                  variantType="primary"
                  onClick={() => void uploadSelectedFiles()}
                  disabled={!selectedFiles.length || isUploadingFiles}
                  sx={{ minWidth: { xs: "100%", sm: "220px" } }}
                >
                  {isUploadingFiles ? "Uploading files..." : "Upload Documents"}
                </Button>
              </ActionRow>
            </UploadAreaContent>
          </UploadAreaWrapper>

        </Box>

        <RightRail>
          <RightRailCard>
            <RightRailBody>
              <RightRailScrollArea>
                <RightRailHeading>Selected files</RightRailHeading>
                {selectedFiles.length ? (
                  <PendingFilesScrollArea>
                    {selectedFiles.map((file, index) => (
                      <PendingFileCard key={`${file.name}-${index}`}>
                        <FileInfoRow>
                          <SelectedFileIcon src={DocumentIcon} alt="Selected file" />
                          <SelectedFileMeta>
                            <SelectedFileLabel>Pending upload</SelectedFileLabel>
                            <SelectedFileName variant="body2">
                              {file.name}
                            </SelectedFileName>
                            <SelectedFileTimestamp>
                              {Math.ceil(file.size / (1024 * 1024))} MB
                            </SelectedFileTimestamp>
                          </SelectedFileMeta>
                        </FileInfoRow>
                        <FileActionRow>
                          <FileActionIcon
                            src={deleteIcon}
                            alt="Remove file"
                            onClick={() => removeSelectedFile(index)}
                          />
                        </FileActionRow>
                      </PendingFileCard>
                    ))}
                  </PendingFilesScrollArea>
                ) : (
                  <RightRailEmptyState>
                    No files selected yet.
                  </RightRailEmptyState>
                )}

                <RightRailSectionDivider />

                <RightRailHeading>Uploaded documents</RightRailHeading>
                {uploadedDocuments.length ? (
                  <UploadedDocumentsScrollArea>
                    {uploadedDocuments.map((document) => (
                      <DocumentCard key={String(document.documentId ?? document.id)}>
                        <SelectedFileIcon src={DocumentIcon} alt="Uploaded file" />
                        <DocumentMeta>
                          <DocumentName variant="body2">
                            {(document.fileName ?? "Additional Document").replace(/^\d+_/, "")}
                          </DocumentName>
                          <DocumentTimestamp>
                            {[
                              formatUploadedAt(
                                document.uploadedAt ?? document.updatedAt ?? document.createdAt
                              ),
                              document.uploadedBy,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </DocumentTimestamp>
                        </DocumentMeta>
                        <FileActionRow>
                          <FileActionIcon
                            src={eyeIcon}
                            alt="Preview file"
                            onClick={() => handleOpenPreview(document)}
                          />
                          <FileActionIcon
                            src={refreshIcon}
                            alt="Re-upload file"
                            onClick={() => fileInputRef.current?.click()}
                          />
                        <FileActionIcon
                          src={deleteIcon}
                          alt="Delete file"
                          onClick={() =>
                            void handleRemoveUploadedDocument(
                              document.documentId ?? document.id
                            )
                          }
                        />
                        </FileActionRow>
                      </DocumentCard>
                    ))}
                  </UploadedDocumentsScrollArea>
                ) : (
                  <RightRailEmptyState>
                    Uploaded documents will appear here after you upload them.
                  </RightRailEmptyState>
                )}
              </RightRailScrollArea>
            </RightRailBody>
          </RightRailCard>
        </RightRail>
      </ContentGrid>

      <CustomModal
        open={isPreviewOpen}
        handleClose={() => {
          setIsPreviewOpen(false);
          setPreviewDocument(null);
        }}
        heading="Preview Document"
        modalBoxStyles={{ width: "min(1100px, 92vw)" }}
        noPadding
      >
        <PreviewModalContent>
          {previewDocument && previewedDocumentId ? (
            <DocumentPreview
              fileName={previewDocument.fileName ?? "Preview"}
              fileId={previewedDocumentId}
              showDownloadButton={false}
              showFileMeta={false}
              previewHeight="72vh"
              toolbarPlacement="top"
            />
          ) : null}
        </PreviewModalContent>
      </CustomModal>
    </TabContainer>
  );
};

export default CompanyAdditionalDocumentsTab;
