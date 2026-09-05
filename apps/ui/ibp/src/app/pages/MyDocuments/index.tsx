import {
  Box,
  CircularProgress,
  Collapse,
  IconButton,
  InputBase,
  Typography,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SearchIcon from "@mui/icons-material/Search";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiRequest,
  CustomTabsNoDataBox,
  endPoints,
  useApiQuery,
} from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { MY_DOCUMENTS } from "../../constants";
import { setToastMessage } from "../../redux/slice";
import PolicyFeatureDocTab from "./PolicyFeatureDocTab";
import {
  BannerDocumentHeading,
  BannerDocumentSubHeading,
  BannerSearchBar,
  BannerWrapper,
  BottomIllustration,
  MyDocumentsContainer,
  PageRoot,
  PersonalDocumentsActionRow,
  PersonalDocumentsDropzone,
  PersonalDocumentsDropzoneIcon,
  PersonalDocumentsDropzoneSubtitle,
  PersonalDocumentsDropzoneTitle,
  PersonalDocumentsHiddenInput,
  PersonalDocumentsInlineTrigger,
  PersonalDocumentsRemoveButton,
  PersonalDocumentsSectionCard,
  PersonalDocumentsSectionDescription,
  PersonalDocumentsSectionHeader,
  PersonalDocumentsSectionTitle,
  PersonalDocumentsSelectedItem,
  PersonalDocumentsSelectedItemInfo,
  PersonalDocumentsSelectedItemMeta,
  PersonalDocumentsSelectedItemName,
  PersonalDocumentsSelectedList,
  PersonalDocumentsUploadButton,
  PersonalDocumentsUploadGrid,
  PersonalDocumentsUploadedDownload,
  PersonalDocumentsUploadedFileIcon,
  PersonalDocumentsUploadedItem,
  PersonalDocumentsUploadedList,
  PersonalDocumentsUploadedMeta,
} from "./styles";

const extractPolicyFeatureDocuments = (response: any) => {
  const payload = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(payload) ? payload : [];
};

const normalizeCompanyAdditionalDocuments = (
  response: any,
  companyId?: string | number | null,
) => {
  const payload =
    response?.data?.data?.documentIds ??
    response?.data?.documentIds ??
    response?.data?.data ??
    [];

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item: any) => ({
    id: item?.id ?? item?.documentId ?? item?.fileId,
    documentId: item?.id ?? item?.documentId ?? item?.fileId,
    fileName: item?.fileName ?? item?.name ?? "Additional Document",
    mimeType: "application/pdf",
    lastUpdated: item?.uploadedAt ?? item?.createdAt ?? item?.updatedAt ?? null,
    policyId: companyId ?? item?.companyId ?? "company-additional",
    policyName: "Additional Documents",
    featureType: "company_additional",
    lifeEventAction: undefined,
    title: item?.name ?? item?.fileName ?? "Additional Document",
    subtitle: "Company-level additional document",
    uploadedByName: item?.uploadedBy ?? null,
    itemType: "document",
    referenceId:
      item?.id != null
        ? String(item.id)
        : item?.documentId != null
          ? String(item.documentId)
          : undefined,
    referenceType: "COMPANY_ADDITIONAL_DOCUMENT",
    renderedHtml: undefined,
    hasPreview: true,
    hasDownload: true,
    documentType: "additional_document",
  }));
};

type PersonalDocumentItem = {
  id: number | string;
  fileName: string;
  uploadedAt?: string | null;
  size?: number;
};

const MAX_PERSONAL_DOCUMENT_SIZE = 10 * 1024 * 1024;

const isSupportedPersonalFile = (file: File) => {
  const fileName = file.name.toLowerCase();
  return (
    file.type === "application/pdf" ||
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    fileName.endsWith(".pdf") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png")
  );
};

const formatPersonalFileSize = (size?: number) => {
  if (!size || size <= 0) {
    return "--";
  }

  const sizeInMb = size / (1024 * 1024);
  if (sizeInMb >= 1) {
    return `${sizeInMb.toFixed(1)} MB`;
  }

  const sizeInKb = size / 1024;
  return `${sizeInKb.toFixed(0)} KB`;
};

const formatPersonalUploadedAt = (value?: string | null) => {
  if (!value) {
    return "--";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(parsedDate);

  return formatted.replace(/\b(am|pm)\b/g, (match) => match.toUpperCase());
};

const MyDocuments: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const personalUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [isPersonalDocumentsOpen, setIsPersonalDocumentsOpen] = useState(false);
  const [selectedPersonalFiles, setSelectedPersonalFiles] = useState<File[]>([]);
  const [uploadedPersonalDocumentsFromSession, setUploadedPersonalDocumentsFromSession] = useState<
    PersonalDocumentItem[]
  >([]);
  const [isPersonalUploading, setIsPersonalUploading] = useState(false);

  const userDetails = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const employeeId = userDetails?.id;
  const companyId = userDetails?.companyId ?? userDetails?.employeeCompanyId ?? null;
  const token = userDetails?.accessToken?.accessToken;

  const handleClearAll = () => {
    setSearch("");
    setCategoryFilter("all");
    setTypeFilter("all");
    setSortOrder("latest");
  };

  const {
    data: policyFeatureDocs,
    isLoading,
    isFetching,
    refetch: refetchPolicyFeatureDocs,
  } = useApiQuery({
    queryKey: [
      "policyFeatureDocs",
      employeeId,
      search,
      categoryFilter,
      typeFilter,
      sortOrder,
    ],
    url: endPoints.policyFeatureDocumentsByEmployee(employeeId, {
      search,
      category: categoryFilter,
      documentType: typeFilter,
      sortOrder,
    }),
    enabled: Boolean(employeeId),
    config: {
      placeholderData: (previousData) => previousData,
    },
  });

  const {
    data: companyAdditionalDocs,
    isFetching: isCompanyAdditionalDocsFetching,
  } = useApiQuery({
    queryKey: ["companyAdditionalDocs", companyId],
    url: endPoints.companyAdditionalDocuments(companyId ?? ""),
    enabled: Boolean(companyId),
    config: {
      placeholderData: (previousData) => previousData,
    },
  });

  const mergedDocumentsResponse = useMemo(() => {
    const policyDocuments = extractPolicyFeatureDocuments(policyFeatureDocs);
    const additionalDocuments = normalizeCompanyAdditionalDocuments(
      companyAdditionalDocs,
      companyId,
    );

    return {
      data: {
        data: [...policyDocuments, ...additionalDocuments],
      },
    };
  }, [companyAdditionalDocs, companyId, policyFeatureDocs]);

  const documentCount = useMemo(() => {
    return mergedDocumentsResponse?.data?.data?.length ?? 0;
  }, [mergedDocumentsResponse]);

  const appendUniquePersonalFiles = (incomingFiles: File[]) => {
    setSelectedPersonalFiles((previousFiles) => {
      const fileMap = new Map<string, File>();
      [...previousFiles, ...incomingFiles].forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!fileMap.has(key)) {
          fileMap.set(key, file);
        }
      });
      return Array.from(fileMap.values());
    });
  };

  const handlePersonalFileSelection = (fileList: FileList | null) => {
    if (!fileList) return;

    const files = Array.from(fileList);
    const validFiles = files.filter(
      (file) =>
        isSupportedPersonalFile(file) &&
        file.size <= MAX_PERSONAL_DOCUMENT_SIZE,
    );

    if (validFiles.length === 0) {
      dispatch(
        setToastMessage(
          "Only PDF, JPG, and PNG files are allowed.",
        ),
      );
      return;
    }

    if (validFiles.length < files.length) {
      dispatch(
        setToastMessage(
          "Some files were skipped because only PDF, JPG, and PNG files are allowed.",
        ),
      );
    }

    appendUniquePersonalFiles(validFiles);
  };

  const handleRemovePersonalFile = (fileToRemove: File) => {
    setSelectedPersonalFiles((previousFiles) =>
      previousFiles.filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          ),
      ),
    );
  };

  const handlePersonalDocumentsUpload = async () => {
    if (selectedPersonalFiles.length === 0) {
      dispatch(setToastMessage("Please select one or more files to upload."));
      return;
    }

    if (!companyId) {
      dispatch(
        setToastMessage(
          "Company information is missing. Please refresh and try again.",
        ),
      );
      return;
    }

    setIsPersonalUploading(true);

    try {
      const uploadedResponses = await Promise.all(
        selectedPersonalFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("companyType", "company");
          formData.append("companyId", String(companyId));
          formData.append("documentTypeLid", "-1");

          const response = await apiRequest(endPoints.ibpFileUpload, {
            method: "POST",
            data: formData,
            headers: {
              "Content-Type": "multipart/form-data",
              Accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });

          const uploadedFile =
            (response as any)?.data?.data || (response as any)?.data || response;

          return {
            stored: {
              id: uploadedFile?.id,
              fileKey: uploadedFile?.fileKey,
              fileName: uploadedFile?.fileName || file.name,
              companyType: uploadedFile?.companyType || "company",
              companyId: uploadedFile?.companyId ?? companyId,
              documentTypeLid: uploadedFile?.documentTypeLid ?? -1,
              fileSize: String(file.size),
            },
            local: {
              id: uploadedFile?.id,
              fileName: uploadedFile?.fileName || file.name,
              uploadedAt:
                uploadedFile?.createdAt ?? uploadedFile?.updatedAt ?? null,
              size: file.size,
            } as PersonalDocumentItem,
          };
        }),
      );

      const storedPersonalDocuments = uploadedResponses
        .map((item) => item.stored)
        .filter((document) => Boolean(document?.id));

      await apiRequest(endPoints.employeePersonalDocuments(employeeId ?? ""), {
        method: "POST",
        data: {
          documentIds: storedPersonalDocuments,
        },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      await refetchPolicyFeatureDocs?.();

      setUploadedPersonalDocumentsFromSession((previous) => [
        ...previous,
        ...uploadedResponses
          .map((item) => item.local)
          .filter((document) => Boolean(document?.id)),
      ]);
      setSelectedPersonalFiles([]);
      setIsPersonalDocumentsOpen(false);
      if (personalUploadInputRef.current) {
        personalUploadInputRef.current.value = "";
      }
      dispatch(setToastMessage("Documents uploaded successfully."));
    } catch (error: any) {
      dispatch(
        setToastMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Document upload failed. Please try again.",
        ),
      );
    } finally {
      setIsPersonalUploading(false);
    }
  };

  if (isLoading && !policyFeatureDocs) {
    return (
      <CustomTabsNoDataBox>
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={18} />
          <Typography>Loading documents...</Typography>
        </Box>
      </CustomTabsNoDataBox>
    );
  }

  return (
    <PageRoot>
      <BannerWrapper>
        <BannerDocumentHeading sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            onClick={() => navigate(-1)}
            aria-label="Go back"
            sx={{ p: 0, mr: 1, color: "inherit" }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: "inherit" }} />
          </IconButton>
          {MY_DOCUMENTS.TITLE}
        </BannerDocumentHeading>
        <BannerDocumentSubHeading>{MY_DOCUMENTS.SUB_TITLE}</BannerDocumentSubHeading>
        <BannerSearchBar>
          <InputBase
            fullWidth
            placeholder="Search by document name or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ fontSize: "0.875rem" }}
          />
          <SearchIcon sx={{ color: "text.secondary", fontSize: 22, flexShrink: 0 }} />
        </BannerSearchBar>
      </BannerWrapper>

      <MyDocumentsContainer showBottomIllustration={documentCount <= 5}>
        <PolicyFeatureDocTab
          tabKey="policyFeature"
          data={mergedDocumentsResponse}
          isLoadingDocuments={isFetching || isCompanyAdditionalDocsFetching}
          externalSearch={search}
          onExternalSearchChange={setSearch}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          onClearAll={handleClearAll}
          // filterRightAction={
          //   <PersonalDocumentsInlineTrigger
          //     onClick={() => setIsPersonalDocumentsOpen((prev) => !prev)}
          //   >
          //     Upload your personal documents
          //   </PersonalDocumentsInlineTrigger>
          // }
          filterBelowContent={
            <Collapse in={isPersonalDocumentsOpen} timeout="auto" unmountOnExit>
              <PersonalDocumentsSectionCard>
                <PersonalDocumentsSectionHeader>
                  <PersonalDocumentsSectionTitle>
                    Upload Personal Documents
                  </PersonalDocumentsSectionTitle>
                  <PersonalDocumentsSectionDescription>
                    Drag and drop multiple files or browse to upload PDF, JPG, and PNG documents.
                  </PersonalDocumentsSectionDescription>
                </PersonalDocumentsSectionHeader>

                <PersonalDocumentsUploadGrid>
                  <PersonalDocumentsDropzone
                    role="button"
                    tabIndex={0}
                    onClick={() => personalUploadInputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        personalUploadInputRef.current?.click();
                      }
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      handlePersonalFileSelection(event.dataTransfer.files);
                    }}
                  >
                    <PersonalDocumentsDropzoneIcon>
                      <UploadFileOutlinedIcon fontSize="large" />
                    </PersonalDocumentsDropzoneIcon>
                    <PersonalDocumentsDropzoneTitle>
                      Drag & Drop Personal Files Here
                    </PersonalDocumentsDropzoneTitle>
                    <PersonalDocumentsDropzoneSubtitle>
                      PDF, JPG, PNG up to 10MB each
                    </PersonalDocumentsDropzoneSubtitle>
                  </PersonalDocumentsDropzone>
                </PersonalDocumentsUploadGrid>

                <PersonalDocumentsHiddenInput
                  ref={personalUploadInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={(event) => {
                    handlePersonalFileSelection(event.target.files);
                    event.target.value = "";
                  }}
                />

                {selectedPersonalFiles.length > 0 ? (
                  <PersonalDocumentsSelectedList>
                    {selectedPersonalFiles.map((file) => (
                      <PersonalDocumentsSelectedItem
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                      >
                        <PersonalDocumentsSelectedItemInfo>
                          <PersonalDocumentsSelectedItemName>
                            {file.name}
                          </PersonalDocumentsSelectedItemName>
                          <PersonalDocumentsSelectedItemMeta>
                            {formatPersonalFileSize(file.size)}
                          </PersonalDocumentsSelectedItemMeta>
                        </PersonalDocumentsSelectedItemInfo>
                        <PersonalDocumentsRemoveButton
                          aria-label={`Remove ${file.name}`}
                          onClick={() => handleRemovePersonalFile(file)}
                        >
                          <DeleteOutlineRoundedIcon />
                        </PersonalDocumentsRemoveButton>
                      </PersonalDocumentsSelectedItem>
                    ))}
                  </PersonalDocumentsSelectedList>
                ) : null}

                <Box sx={{ mt: 1.5, mb: 0.5, px: 0.5, display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <Box component="span" sx={{ mt: "1px", flexShrink: 0, color: "#2563EB" }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                  </Box>
                  <Typography sx={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
                    By uploading, I confirm that I am sharing these documents voluntarily and of my own accord.
                  </Typography>
                </Box>

                <PersonalDocumentsActionRow>
                  <PersonalDocumentsUploadButton
                    onClick={() => void handlePersonalDocumentsUpload()}
                    disabled={
                      isPersonalUploading || selectedPersonalFiles.length === 0
                    }
                  >
                    {isPersonalUploading ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircularProgress size={16} color="inherit" />
                        Uploading...
                      </Box>
                    ) : (
                      "Upload Documents"
                    )}
                  </PersonalDocumentsUploadButton>
                </PersonalDocumentsActionRow>

                {uploadedPersonalDocumentsFromSession.length > 0 ? (
                  <PersonalDocumentsUploadedList>
                    <Typography sx={{ fontWeight: 600 }}>
                      Uploaded Personal Documents
                    </Typography>
                    {uploadedPersonalDocumentsFromSession.map((document) => (
                      <PersonalDocumentsUploadedItem key={String(document.id)}>
                        <PersonalDocumentsUploadedMeta>
                          <PersonalDocumentsUploadedFileIcon>
                            <InsertDriveFileOutlinedIcon fontSize="small" />
                          </PersonalDocumentsUploadedFileIcon>
                          <PersonalDocumentsSelectedItemInfo>
                            <PersonalDocumentsSelectedItemName>
                              {document.fileName}
                            </PersonalDocumentsSelectedItemName>
                            <PersonalDocumentsSelectedItemMeta>
                              {formatPersonalUploadedAt(document.uploadedAt)}
                            </PersonalDocumentsSelectedItemMeta>
                          </PersonalDocumentsSelectedItemInfo>
                        </PersonalDocumentsUploadedMeta>
                        <PersonalDocumentsUploadedDownload
                          href={endPoints.ibpFileUploadDownloadById(Number(document.id))}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </PersonalDocumentsUploadedDownload>
                      </PersonalDocumentsUploadedItem>
                    ))}
                  </PersonalDocumentsUploadedList>
                ) : null}
              </PersonalDocumentsSectionCard>
            </Collapse>
          }
        />

        {documentCount <= 5 && <BottomIllustration />}
      </MyDocumentsContainer>
    </PageRoot>
  );
};

export default MyDocuments;
