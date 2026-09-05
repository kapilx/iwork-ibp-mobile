import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Box, Button } from "@mui/material";
import { useForm } from "react-hook-form";
import {
  Drawer,
  DynamicForm,
  FormFieldConfig,
  REGEX_PATTERNS,
  CustomModal,
  DELETE,
} from "@ui/ui-lib";
import { KnowledgeDocument } from "./types";
import { LookupRecord } from "@ui/ui-lib";
import { StyledButtonContainer, StyledDrawer } from "./styles";
import { DOCUMENT_DELETE_CONFIRMATION_MESSAGE, GO_BACK } from "../../constants";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: KnowledgeDocument) => void;
  categories: LookupRecord[];
  docTypes: LookupRecord[];
  initialData?: KnowledgeDocument;
  allowDelete?: boolean;
  onDelete?: () => void;
  disableCategoryField?: boolean;
}

const AddEditDocumentDrawer: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
  categories,
  docTypes,
  initialData,
  allowDelete = false,
  onDelete,
  disableCategoryField = false,
}) => {
  const dispatch = useDispatch();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const defaultValues = useMemo(
    () => ({
      title: "",
      summary: "",
      categoryId: categories[0]?.id,
      docTypeId: docTypes[0]?.id,
      tags: [],
      version: 1,
      extension: "",
      relativePath: "",
      accessCount: 0,
      createdAt: new Date().toISOString(),
      url: "",
      // Set file as an object with fileName when editing, null when adding
      file: initialData?.fileName
        ? {
            fileName: initialData.fileName,
          }
        : null,
      ...(initialData || {}),
    }),
    [initialData, categories, docTypes]
  );

  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();

  useEffect(() => {
    if (formMethods) {
      formMethods.reset(defaultValues);
    }
  }, [defaultValues, formMethods]);

  const formConfig = useMemo<FormFieldConfig[]>(
    () => [
      {
        key: "title",
        name: "title",
        label: "Document Title",
        type: "text",
        gridColumn: 5,
        rules: {
          required: { value: true, message: "Document Title is required" },
        },
        componentProps: { fullWidth: true },
      },
      {
        key: "summary",
        name: "summary",
        label: "Summary",
        type: "textarea",
        gridColumn: 5,
        componentProps: { fullWidth: true },
      },
      {
        key: "categoryId",
        name: "categoryId",
        label: "Category",
        type: "select",
        gridColumn: 5,
        options: categories.map((c) => ({ value: c.id, label: c.lookUpValue })),
        rules: { required: { value: true, message: "Category is required" } },
        componentProps: { fullWidth: true, disabled: disableCategoryField },
      },
      {
        key: "docTypeId",
        name: "docTypeId",
        label: "Type",
        type: "select",
        gridColumn: 5,
        options: docTypes.map((d) => ({ value: d.id, label: d.lookUpValue })),
        rules: { required: { value: true, message: "Type is required" } },
        componentProps: { fullWidth: true },
      },
      {
        key: "tags",
        name: "tags",
        label: "Tags",
        type: "textarea",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          helperText: "comma separated",
        },
      },
      {
        key: "url",
        name: "url",
        label: "URL*",
        type: "text",
        gridColumn: 5,
        showField: (watch) => {
          const docTypeId = watch("docTypeId");
          const selectedType = docTypes.find((d) => d.id === Number(docTypeId));
          return !!(
            selectedType &&
            ["STREAM_URL", "DOCUMENT_URL", "WEBSITE_URL"].includes(
              selectedType.lookUpValueKey
            )
          );
        },
        componentProps: { fullWidth: true, type: "url" },
        rules: {
          pattern: {
            value: REGEX_PATTERNS.URL,
            message: "Invalid website URL",
          },
        },
      },
      {
        key: "file",
        name: "file",
        label: initialData?.fileName
          ? `File: 
          (Current: ${initialData.fileName})`
          : "File",
        type: "fileupload",
        gridColumn: 5,
        componentProps: {
          fullWidth: true,
          customVariant: "primary",
          manualUpload: true,
          accept: ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png",
          variantType: "primary",
        },
        showField: (watch) => {
          const docTypeId = watch("docTypeId");
          const selectedType = docTypes.find((d) => d.id === Number(docTypeId));
          return (
            !(
              selectedType &&
              ["STREAM_URL", "DOCUMENT_URL", "WEBSITE_URL"].includes(
                selectedType.lookUpValueKey
              )
            ) || false
          );
        },
      },
    ],
    [categories, docTypes, initialData, disableCategoryField]
  );

  const submitHandler = async (data: KnowledgeDocument) => {
    onSubmit({ ...data, file: (data as any).file || null });
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    onDelete?.();
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        title={initialData ? "Edit Document" : "Add Document"}
      >
        <StyledDrawer>
          <DynamicForm
            formConfig={formConfig}
            formMethods={setFormMethods}
            defaultValues={defaultValues}
          />
          <StyledButtonContainer>
            {allowDelete && (
              <Button
                color="error"
                onClick={handleDeleteClick}
                variant="outlined"
              >
                {DELETE}
              </Button>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Button onClick={onClose}>Cancel</Button>
            <Button
              onClick={
                formMethods
                  ? formMethods.handleSubmit(submitHandler)
                  : undefined
              }
              variant="contained"
            >
              {initialData ? "Update" : "Add"}
            </Button>
          </StyledButtonContainer>
        </StyledDrawer>
      </Drawer>

      <CustomModal
        open={showDeleteModal}
        handleClose={handleDeleteCancel}
        heading="Delete Document"
        buttons={[
          {
            label: GO_BACK,
            onClick: handleDeleteCancel,
            variant: "secondary",
          },
          {
            label: DELETE,
            onClick: handleDeleteConfirm,
            variant: "primary",
          },
        ]}
      >
        <Box sx={{ padding: "16px 0" }}>
          {DOCUMENT_DELETE_CONFIRMATION_MESSAGE}
        </Box>
      </CustomModal>
    </>
  );
};

export default AddEditDocumentDrawer;
