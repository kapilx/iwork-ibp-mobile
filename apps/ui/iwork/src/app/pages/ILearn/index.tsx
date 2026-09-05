import { CircularProgress } from "@mui/material";
import { apiRequest, endPoints, useApiQuery, WorkInProgress } from "@ui/ui-lib";
import React, { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { setToastMessage } from "@ui/ui-lib";
import DocumentCard from "../../components/DocumentCard";
import { FeatureKey } from "@ui/ui-lib";
import { CatalogResponse, KnowledgeDocument } from "../KnowledgeCentral/types";
import AddEditDocumentDrawer from "../KnowledgeCentral/AddEditDocumentDrawer";
import {
  CreateKnowledgeUrlDto,
  CreateKnowledgeFileDto,
} from "../../../../../../services/knowledge-service/src/app/knowledge/dto/create-knowledge-file.dto";
import { UpdateKnowledgeDto } from "../../../../services/knowledge-service/src/app/knowledge/dto/update-knowledge.dto";
import {
  ADD_DOCUMENT,
  AddEditDocumentDrawer as DrawerMessages,
} from "../../constants";
import {
  DocumentsWrapper,
  ILearnContainer,
  LoaderWrapper,
  PageDescription,
  PageHeader,
  PageHeaderWithAction,
  PageTitle,
  AddDocumentLink,
} from "./styles";

const PAGE_SIZE = 8;
const TRAINING_LOOKUP_KEY = "KNOWLEDGE_CATEGORY_TRAINING";
const TRAINING_LOOKUP_VALUE_KEY = "TRAINING";
const URL_DOC_TYPES = ["STREAM_URL", "DOCUMENT_URL", "WEBSITE_URL"];

const ILearnPage: React.FC = () => {
  const dispatch = useDispatch();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<KnowledgeDocument | undefined>(
    undefined
  );

  const {
    data: catalogData,
    isLoading,
    refetch: refetchCatalogData,
  } = useApiQuery<CatalogResponse>({
    url: endPoints.knowledgeCatalog(0, PAGE_SIZE),
    queryKey: ["knowledgeCatalog", "ilearn", PAGE_SIZE],
    enabled: true,
    config: {},
  });

  const docTypeLookup = useMemo(() => {
    const map = new Map<number, string>();
    catalogData?.docTypes?.forEach((type) => {
      map.set(type.id, type.lookUpValueKey);
    });
    return map;
  }, [catalogData?.docTypes]);

  const trainingCategory = useMemo(() => {
    return catalogData?.categories.find(
      (category) =>
        category.lookUpKey === TRAINING_LOOKUP_KEY ||
        category.lookUpValueKey === TRAINING_LOOKUP_VALUE_KEY
    );
  }, [catalogData?.categories]);

  const trainingDocuments = useMemo(() => {
    if (!catalogData || !trainingCategory) {
      return [];
    }

    const docs = catalogData.data?.[String(trainingCategory.id)] || [];
    return docs.map((doc) => ({
      ...doc,
      tags: Array.isArray(doc.tags) ? doc.tags : [],
    }));
  }, [catalogData, trainingCategory]);

  const openDocument = useCallback(
    async (doc?: KnowledgeDocument) => {
      if (!doc) {
        return;
      }

      const docTypeKey = docTypeLookup.get(doc.docTypeId);
      if (doc.url && docTypeKey && URL_DOC_TYPES.includes(docTypeKey)) {
        const normalizedUrl = doc.url.match(/^https?:\/\//i)
          ? doc.url
          : `https://${doc.url}`;
        window.open(normalizedUrl, "_blank", "noopener,noreferrer");
        return;
      }

      if (!doc.documentId) {
        dispatch(
          setToastMessage("Document ID is required to download the file.")
        );
        return;
      }

      try {
        const response = await apiRequest(
          endPoints.knowledgeDownload(doc.documentId),
          { method: "GET", responseType: "blob" }
        );
        const blob = response.data as Blob;

        const text = await blob.text();
        if (blob.type.includes("text/html") && text.includes("<html")) {
          console.error("Received HTML instead of file:", text);
          dispatch(
            setToastMessage("Download failed — server returned an error page.")
          );
          return;
        }

        let filename = doc.fileName || doc.title || "download";

        const contentDisposition =
          response.headers?.["content-disposition"] ||
          response.headers?.get?.("content-disposition");

        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^";]+)"?/);
          if (match && match[1]) {
            filename = match[1];
          }
        }

        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download error:", error);
        dispatch(setToastMessage("Download failed."));
      }
    },
    [docTypeLookup]
  );

  const handleAccess = useCallback(
    async (documentId: number) => {
      const doc = trainingDocuments.find(
        (document) => document.documentId === documentId
      );
      await openDocument(doc);
    },
    [openDocument, trainingDocuments]
  );

  const parseTags = (
    tagsInput: string | string[] | undefined
  ): string[] | undefined => {
    if (Array.isArray(tagsInput)) {
      return tagsInput.filter((t) => typeof t === "string" && t.trim() !== "");
    }
    if (typeof tagsInput === "string") {
      return tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
    }
    return undefined;
  };

  type DocumentFormData = Omit<
    KnowledgeDocument,
    "tags" | "docTypeId" | "categoryId"
  > & {
    file?: File | null;
    url?: string;
    tags?: string | string[];
    docTypeId: string | number;
    categoryId: string | number;
  };

  const renderPageHeader = () => (
    <PageHeaderWithAction>
      <PageHeader>
        <PageTitle variant="h1">Training Material</PageTitle>
        <PageDescription variant="body1">
          Access product and process training resources curated for quick
          learning.
        </PageDescription>
      </PageHeader>
      <AddDocumentLink
        onClick={() => {
          setEditDoc(undefined);
          setDrawerOpen(true);
        }}
      >
        {ADD_DOCUMENT}
      </AddDocumentLink>
    </PageHeaderWithAction>
  );

  const renderEmptyState = (message: string) => (
    <ILearnContainer>
      {renderPageHeader()}
      <WorkInProgress
        customStyles={{ marginTop: 0, height: "calc(100vh - 200px)" }}
        title={null}
        description={message}
      />
    </ILearnContainer>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <ILearnContainer>
          {renderPageHeader()}
          <LoaderWrapper>
            <CircularProgress />
          </LoaderWrapper>
        </ILearnContainer>
      );
    }

    if (!trainingCategory) {
      return renderEmptyState(
        "Training materials are not available right now."
      );
    }

    if (trainingDocuments.length === 0) {
      return renderEmptyState("No training resources found.");
    }

    return (
      <ILearnContainer>
        {renderPageHeader()}
        <DocumentsWrapper>
          {trainingDocuments.map((doc: KnowledgeDocument) => (
            <DocumentCard
              key={doc.documentId}
              doc={doc}
              onAccess={handleAccess}
              onClick={openDocument}
              canEdit={true}
              onEdit={handleEdit}
              downloadFeatureKey={FeatureKey.EXPORT_ILEARN_DOCUMENT}
            />
          ))}
        </DocumentsWrapper>
      </ILearnContainer>
    );
  };

  const handleSubmit = async (data: DocumentFormData) => {
    const parsedTags = parseTags(data.tags);

    try {
      if (editDoc && editDoc.documentId) {
        // EDIT MODE
        const documentIdToUpdate = editDoc.documentId;
        const selectedType = catalogData?.docTypes.find(
          (d) => d.id === Number(data.docTypeId)
        );
        const isUrlType =
          selectedType &&
          ["STREAM_URL", "DOCUMENT_URL", "WEBSITE_URL"].includes(
            selectedType.lookUpValueKey
          );

        if (data.file instanceof File) {
          const formData = new FormData();
          formData.append("file", data.file);
          formData.append("title", data.title);
          formData.append("docTypeId", String(Number(data.docTypeId)));
          formData.append("categoryId", String(trainingCategory!.id));
          if (data.summary) formData.append("summary", data.summary);
          if (parsedTags) {
            parsedTags.forEach((tag) => formData.append("tags", tag));
          }
          formData.append("documentId", String(documentIdToUpdate));

          const response = await apiRequest(
            endPoints.knowledgeReplaceFile(documentIdToUpdate),
            {
              method: "PUT",
              data: formData,
            }
          );
          dispatch(
            setToastMessage(
              response?.message || DrawerMessages.UPDATE_SUCCESS_MESSAGE
            )
          );
        } else if (isUrlType && data.url) {
          const urlPayload = {
            title: data.title,
            docTypeId: Number(data.docTypeId),
            categoryId: trainingCategory!.id,
            summary: data.summary,
            tags: parsedTags,
            url: data.url,
            documentId: documentIdToUpdate,
          };
          const response = await apiRequest(
            endPoints.knowledgeReplaceUrl(documentIdToUpdate),
            { method: "PUT", data: urlPayload }
          );
          dispatch(
            setToastMessage(
              response?.message || DrawerMessages.UPDATE_SUCCESS_MESSAGE
            )
          );
        } else {
          const payload: UpdateKnowledgeDto = {
            title: data.title,
            docTypeId: Number(data.docTypeId),
            categoryId: trainingCategory!.id,
            summary: data.summary,
            tags: parsedTags,
          };
          const bodyPayload = {
            ...payload,
            documentId: documentIdToUpdate,
          };
          const response = await apiRequest(
            endPoints.knowledgeUpdateMeta(documentIdToUpdate),
            { method: "PUT", data: bodyPayload }
          );
          dispatch(
            setToastMessage(
              response?.message || DrawerMessages.UPDATE_SUCCESS_MESSAGE
            )
          );
        }
      } else {
        // ADD MODE
        const selectedType = catalogData?.docTypes.find(
          (d) => d.id === Number(data.docTypeId)
        );
        const isUrlType =
          selectedType &&
          ["STREAM_URL", "DOCUMENT_URL", "WEBSITE_URL"].includes(
            selectedType.lookUpValueKey
          );

        if (data.file instanceof File) {
          const fileDto: CreateKnowledgeFileDto = {
            title: data.title,
            docTypeId: Number(data.docTypeId),
            categoryId: trainingCategory!.id,
            summary: data.summary,
            tags: parsedTags,
          };
          const formData = new FormData();

          formData.append("file", data.file);

          Object.entries(fileDto).forEach(([key, value]) => {
            if (value !== undefined) {
              if (Array.isArray(value)) {
                value.forEach((item) => formData.append(key, String(item)));
              } else {
                formData.append(key, String(value));
              }
            }
          });

          const response = await apiRequest(endPoints.knowledgeUploadFile, {
            method: "POST",
            data: formData,
          });

          dispatch(
            setToastMessage(response?.message || DrawerMessages.SUCCESS_MESSAGE)
          );
        } else if (isUrlType && data.url) {
          const urlDto: CreateKnowledgeUrlDto = {
            title: data.title,
            docTypeId: Number(data.docTypeId),
            categoryId: trainingCategory!.id,
            url: data.url,
            summary: data.summary,
            tags: parsedTags,
          };
          const response = await apiRequest(endPoints.knowledgeUploadUrl, {
            method: "POST",
            data: urlDto,
          });
          dispatch(
            setToastMessage(response?.message || DrawerMessages.SUCCESS_MESSAGE)
          );
        } else {
          console.error(
            "Cannot create document: Neither file nor URL provided."
          );
          return;
        }
      }
      await refetchCatalogData();
      setDrawerOpen(false);
    } catch (error) {
      console.error("Failed to save document", error);
      dispatch(setToastMessage(DrawerMessages.ERROR_MESSAGE));
      throw error;
    }
  };

  const handleDelete = async () => {
    if (editDoc) {
      try {
        const response = await apiRequest(
          endPoints.knowledgeDelete(editDoc.documentId),
          {
            method: "DELETE",
          }
        );
        dispatch(
          setToastMessage(
            response?.message || DrawerMessages.DELETE_SUCCESS_MESSAGE
          )
        );
        await refetchCatalogData();
      } catch (error) {
        console.error("Failed to delete document", error);
      }
    }
    setDrawerOpen(false);
  };

  const handleEdit = (d: KnowledgeDocument | undefined) => {
    if (!d) return;

    // Extract fileName from URL if not directly available
    const extractedFileName =
      d.fileName ||
      (d.url ? d.url.split("/").pop()?.split("_").slice(1).join("_") : "");

    setEditDoc({
      documentId: d.documentId,
      title: d.title,
      summary: d.summary || "",
      categoryId: d.categoryId,
      docTypeId: d.docTypeId,
      tags: d.tags,
      extension: d.extension,
      relativePath: d.relativePath,
      version: d.version,
      accessCount: d.accessCount,
      createdAt: d.createdAt,
      url: d.url || "",
      fileName: extractedFileName,
    });
    setDrawerOpen(true);
  };

  return (
    <>
      {renderContent()}
      <AddEditDocumentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
        categories={trainingCategory ? [trainingCategory] : []}
        docTypes={catalogData?.docTypes || []}
        initialData={editDoc}
        allowDelete={!!editDoc}
        disableCategoryField={true}
        onDelete={handleDelete}
      />
    </>
  );
};

export default ILearnPage;
