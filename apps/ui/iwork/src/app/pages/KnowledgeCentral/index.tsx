import React, { useEffect, useMemo, useRef, useState } from "react";
import { Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useForm } from "react-hook-form";
import {
  ChipRenderer,
  SEARCH,
  SmartSearch,
  apiRequest,
  endPoints,
  setToastMessage,
  useApiQuery,
  useFormWatcher,
} from "@ui/ui-lib";
import { ADD_DOCUMENT, KNOWLEDGE_CENTRAL } from "../../constants";
import DocumentCard from "../../components/DocumentCard";
import { CatalogResponse, CategoryRecord, KnowledgeDocument } from "./types";
import {
  ChipsContainer,
  KnowledgeCentralContainer,
  DocumentsGrid,
  SectionContainer,
  CategoryChipWrapper,
  SectionHeader,
  TitleContainer,
  ViewMoreLink,
  AddDocumentLink,
  StyledHeader,
} from "./styles";
import AddEditDocumentDrawer from "./AddEditDocumentDrawer";
import { UpdateKnowledgeDto } from "../../../../services/knowledge-service/src/app/knowledge/dto/update-knowledge.dto";
import {
  CreateKnowledgeUrlDto,
  CreateKnowledgeFileDto,
} from "../../../../services/knowledge-service/src/app/knowledge/dto";
import { AddEditDocumentDrawer as DrawerMessages } from "../../constants";
import { useDispatch } from "react-redux";

const PAGE_SIZE = 8;
// Flag to toggle between using mock data and live API
// Set to true to use responseMock, false to use API
const CAN_EDIT = true;

// Training Material category identifiers (excluded from Knowledge Central)
const TRAINING_LOOKUP_KEY = "KNOWLEDGE_CATEGORY_TRAINING";
const TRAINING_LOOKUP_VALUE_KEY = "TRAINING";

const VIRTUAL_CATEGORIES: CategoryRecord[] = [
  {
    id: -1,
    lookUpName: "Recently Added",
    lookUpKey: "recentlyAdded",
    lookUpValueKey: "recentlyAdded",
    lookUpValue: "Recently Added",
    description: "",
    lookUpOrder: -1,
    documentCount: PAGE_SIZE,
  },
  {
    id: -2,
    lookUpName: "Most Popular",
    lookUpKey: "mostPopular",
    lookUpValueKey: "mostPopular",
    lookUpValue: "Most Popular",
    description: "",
    lookUpOrder: -2,
    documentCount: PAGE_SIZE,
  },
];

const KnowledgeCentralPage: React.FC = () => {
  const searchDefaultValues = useMemo(
    () => ({
      search: "",
    }),
    []
  );
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [pages, setPages] = useState<Record<number, number>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const refs = useRef<Record<number, HTMLDivElement | null>>({});
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<KnowledgeDocument | undefined>(
    undefined
  );

  const dispatch = useDispatch();
  // Define a more accurate type for data coming from the drawer
  type DocumentFormData = Omit<
    KnowledgeDocument,
    "tags" | "docTypeId" | "categoryId"
  > & {
    file?: File | null;
    url?: string;
    tags?: string | string[]; // Tags from form can be string (textarea) or already processed
    docTypeId: string | number; // Can be string from form
    categoryId: string | number; // Can be string from form
  };
  const theme = useTheme();
  const { selectedValues, handleReset } = useFormWatcher({
    formMethods,
    setSearchTerm,
    searchFieldName: "search",
    searchDefaultValues,
  });

  const getCategoryName = (categoryId: number) =>
    catalog?.categories.find((c) => c.id === categoryId)?.lookUpValue || "";

  const isTrainingDocument = (doc: KnowledgeDocument): boolean => {
    if (!catalog) return false;
    const category = catalog.categories.find((c) => c.id === doc.categoryId);
    return (
      category?.lookUpKey === TRAINING_LOOKUP_KEY ||
      category?.lookUpValueKey === TRAINING_LOOKUP_VALUE_KEY
    );
  };

  const getDocsForCategory = (id: number): KnowledgeDocument[] => {
    if (!catalog) return [];
    if (id === -1)
      return catalog.recentlyAdded
        .filter((doc) => !isTrainingDocument(doc))
        .map((doc) => ({
          ...doc,
          tags: [getCategoryName(doc.categoryId), ...(doc.tags || [])],
        }));
    if (id === -2)
      return catalog.mostPopular
        .filter((doc) => !isTrainingDocument(doc))
        .map((doc) => ({
          ...doc,
          tags: [getCategoryName(doc.categoryId), ...(doc.tags || [])],
        }));
    return catalog.data[String(id)] || [];
  };

  const { data: catalogData, refetch: refetchCatalogData } = useApiQuery({
    url: endPoints.knowledgeCatalog(0, PAGE_SIZE),
    queryKey: ["knowledgeCatalog", PAGE_SIZE],
    enabled: true,
    config: {},
  });

  // Keep catalog in sync if react-query refetches
  useEffect(() => {
    if (catalogData) {
      setCatalog(catalogData);
      const pageMap: Record<number, number> = {};
      catalogData.categories.forEach((c: CategoryRecord) => {
        pageMap[c.id] = 1;
      });
      setPages(pageMap);
    }
  }, [catalogData]);

  // For imperative refresh after add/edit/delete
  const fetchCatalogData = refetchCatalogData;

  const handleViewMore = async (categoryId: number) => {
    const next = (pages[categoryId] || 1) + 1;
    try {
      const more = await apiRequest(
        endPoints.knowledgeByCategory(categoryId, next, PAGE_SIZE)
      );
      setCatalog((prev) =>
        prev
          ? {
              ...prev,
              data: {
                ...prev.data,
                [categoryId]: [...(prev.data[categoryId] || []), ...more],
              },
            }
          : prev
      );
      setPages((p) => ({ ...p, [categoryId]: next }));
      setExpanded((e) => ({ ...e, [categoryId]: true }));
    } catch (error) {
      console.error(
        "Failed to fetch more data for category %s:",
        categoryId,
        error
      );
      // Optionally, set an error state or show a toast message
    }
  };

  const handleAccess = async (documentId: number) => {
    try {
      await handleClick({ documentId } as KnowledgeDocument);
      // Call download to increment access
    } catch (e) {
      console.error("Failed to increment access count:", e);
    }
  };

  const handleClick = async (doc: KnowledgeDocument) => {
    if (!doc?.documentId) {
      alert("Document ID is required to download the file.");
      return;
    }

    try {
      const storedUser = JSON.parse(sessionStorage.getItem("user") || "{}");
      const countryId = storedUser?.country?.id;
      const downloadUrl = countryId
        ? `${endPoints.knowledgeDownload(doc.documentId)}?countryId=${countryId}`
        : endPoints.knowledgeDownload(doc.documentId);
      const response = await apiRequest(
        downloadUrl,
        { method: "GET", responseType: "blob" }
      );
      const blob = response.data as Blob;

      const text = await blob.text();
      if (blob.type.includes("text/html") && text.includes("<html")) {
        console.error("Received HTML instead of file:", text);
        alert("Download failed — server returned an error page.");
        return;
      }
      let filename = doc.fileName || "download";

      const contentDisposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Download failed.");
    }
  };

  const scrollToCategory = (id: number) => {
    const el = refs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const filterDocs = (docs: KnowledgeDocument[]) => {
    if (!searchTerm) return docs;
    const term = searchTerm.toLowerCase();
    return docs.filter((d) => {
      return (
        d.title.toLowerCase().includes(term) ||
        (d.summary && d.summary.toLowerCase().includes(term)) ||
        (Array.isArray(d.tags) &&
          d.tags.some((t: string) => t.toLowerCase().includes(term)))
      );
    });
  };

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

  if (!catalog) return null;

  // Filter out Training Material category (it's shown in ILearn)
  const filteredCategories = catalog.categories.filter(
    (cat) =>
      cat.lookUpKey !== TRAINING_LOOKUP_KEY &&
      cat.lookUpValueKey !== TRAINING_LOOKUP_VALUE_KEY
  );

  const categories = [...VIRTUAL_CATEGORIES, ...filteredCategories];

  return (
    <>
      <KnowledgeCentralContainer>
        <StyledHeader>
          <TitleContainer variant="h1">{KNOWLEDGE_CENTRAL}</TitleContainer>
          {CAN_EDIT && (
            <AddDocumentLink
              onClick={() => {
                setEditDoc(undefined);
                setDrawerOpen(true);
              }}
            >
              {ADD_DOCUMENT}
            </AddDocumentLink>
          )}
        </StyledHeader>
        <SectionContainer style={{ marginBottom: theme.spacing(3) }}>
          <SmartSearch
            searchFormConfig={[]}
            searchDefaultValues={searchDefaultValues}
            searchFormMethods={setFormMethods}
            selectedValues={selectedValues}
            searchFieldName="search"
            placeholder={SEARCH}
            formMethods={formMethods}
            onReset={handleReset}
          />
        </SectionContainer>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
          }}
        >
          <ChipsContainer>
            {categories.map((cat) => (
              <CategoryChipWrapper key={cat.id}>
                <ChipRenderer
                  value={cat.lookUpValue}
                  variant="variable"
                  onClick={() => scrollToCategory(cat.id)}
                />
              </CategoryChipWrapper>
            ))}
          </ChipsContainer>
        </Box>
        {categories.map((cat) => {
          const docsInCategory = getDocsForCategory(cat.id);
          const filteredDocs = filterDocs(docsInCategory);
          return (
            <SectionContainer
              key={cat.id}
              ref={(el) => (refs.current[cat.id] = el)}
            >
              <SectionHeader>
                <Typography variant="h3">{cat.lookUpValue}</Typography>
              </SectionHeader>
              <DocumentsGrid>
                {filteredDocs.map((doc) => (
                  <DocumentCard
                    key={doc.documentId}
                    doc={doc}
                    onAccess={handleAccess}
                    canEdit={CAN_EDIT}
                    onEdit={(d) => {
                      setEditDoc({
                        documentId: d?.documentId,
                        title: d?.title,
                        summary: d?.summary || "",
                        categoryId: d?.categoryId,
                        docTypeId: d?.docTypeId,
                        tags: d?.tags,
                        extension: d?.extension,
                        relativePath: d?.relativePath,
                        version: d?.version,
                        accessCount: d?.accessCount,
                        createdAt: d?.createdAt,
                        url: d?.url || "",
                        fileName: d?.fileName,
                      });
                      setDrawerOpen(true);
                    }}
                  />
                ))}
              </DocumentsGrid>
              {cat.id >= 0 && cat.documentCount > pages[cat.id] * PAGE_SIZE && (
                <ViewMoreLink onClick={() => handleViewMore(cat.id)}>
                  View More
                </ViewMoreLink>
              )}
            </SectionContainer>
          );
        })}
      </KnowledgeCentralContainer>
      <AddEditDocumentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={async (data: DocumentFormData) => {
          const parsedTags = parseTags(data.tags);

          try {
            if (editDoc && editDoc.documentId) {
              // EDIT MODE
              const documentIdToUpdate = editDoc.documentId;
              const selectedType = catalog.docTypes.find(
                (d) => d.id === Number(data.docTypeId)
              );
              const isUrlType =
                selectedType &&
                ["STREAM_URL", "DOCUMENT_URL", "WEBSITE_URL"].includes(
                  selectedType.lookUpValueKey
                );

              if (data.file instanceof File) {
                // Edit with a new file
                const formData = new FormData();
                formData.append("file", data.file);
                formData.append("title", data.title);
                formData.append("docTypeId", String(Number(data.docTypeId)));
                formData.append("categoryId", String(Number(data.categoryId)));
                if (data.summary) formData.append("summary", data.summary);
                if (parsedTags) {
                  parsedTags.forEach((tag) => formData.append("tags", tag));
                }
                // The backend's replaceFile expects documentId in the body,
                // even though it's also in the path.
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
                // TODO: Show success toast: "Document and file replaced successfully!"
              } else if (isUrlType && data.url) {
                const urlPayload = {
                  title: data.title,
                  docTypeId: Number(data.docTypeId),
                  categoryId: Number(data.categoryId),
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
                // Edit metadata only (no new file/url change)
                const payload: UpdateKnowledgeDto = {
                  title: data.title,
                  docTypeId: Number(data.docTypeId),
                  categoryId: Number(data.categoryId),
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
                // TODO: Show success toast: "Document metadata updated successfully!"
              }
            } else {
              // ADD MODE
              const selectedType = catalog.docTypes.find(
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
                  categoryId: Number(data.categoryId),
                  summary: data.summary,
                  tags: parsedTags,
                };
                const formData = new FormData();
                formData.append("file", data.file);
                Object.entries(fileDto).forEach(([key, value]) => {
                  if (value !== undefined) {
                    if (Array.isArray(value)) {
                      value.forEach((item) =>
                        formData.append(key, String(item))
                      );
                    } else {
                      formData.append(key, String(value));
                    }
                  }
                });
                const response = await apiRequest(
                  endPoints.knowledgeUploadFile,
                  {
                    method: "POST",
                    data: formData,
                  }
                );
                dispatch(
                  setToastMessage(
                    response?.message || DrawerMessages.SUCCESS_MESSAGE
                  )
                );
              } else if (isUrlType && data.url) {
                const urlDto: CreateKnowledgeUrlDto = {
                  title: data.title,
                  docTypeId: Number(data.docTypeId),
                  categoryId: Number(data.categoryId),
                  url: data.url,
                  summary: data.summary,
                  tags: parsedTags,
                };
                const response = await apiRequest(
                  endPoints.knowledgeUploadUrl,
                  {
                    method: "POST",
                    data: urlDto,
                  }
                );
                dispatch(
                  setToastMessage(
                    response?.message || DrawerMessages.SUCCESS_MESSAGE
                  )
                );
              } else {
                console.error(
                  "Cannot create document: Neither file nor URL provided."
                );
                // TODO: Show error toast
                return;
              }
              // TODO: Show success toast: "Document created successfully!"
            }
            await fetchCatalogData(); // Refresh data after successful submission
            setDrawerOpen(false);
          } catch (error) {
            console.error("Failed to save document", error);
            dispatch(setToastMessage(DrawerMessages.ERROR_MESSAGE));
            throw error; // TODO: Show error toast
          }
        }}
        categories={filteredCategories}
        docTypes={catalog.docTypes || []}
        initialData={editDoc}
        allowDelete={!!editDoc}
        onDelete={async () => {
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
              await fetchCatalogData(); // Refresh data after successful deletion
            } catch (error) {
              console.error("Failed to delete document", error);
            }
          }
          setDrawerOpen(false);
        }}
      />
    </>
  );
};

export default KnowledgeCentralPage;
