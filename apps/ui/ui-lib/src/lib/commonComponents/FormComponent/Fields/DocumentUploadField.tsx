import { LinearProgress, Typography } from "@mui/material";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { useLookupIdByKey } from "@ui/ui-lib/hooks";
import { useApiMutation } from "@ui/ui-lib/hooks/useMutation";
import { setToastMessage } from "@ui/ui-lib/redux/slice";
import { useEffect, useMemo, useRef, useState } from "react";
import { FeatureKey } from "../../../rbac/permissionMap";
import useHasPermission from "../../../rbac/useHasPermission";
import { environment } from "@ui/ui-lib/environment";
import { useFormContext, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  ENDORSEMENT_DOCUMENT_REPLACED,
  FAILED_TO_DELETE_FILE,
  httpMethods,
  LookUpValues,
} from "../../../constants";
import DisplayUploadedFile from "../../DisplayUploadedFile";
import UploadedDocumentsTable from "../../DisplayUploadedFile/UploadedDocumentsTable";
import {
  CommonTypography,
  CommonTypographyForNoData,
  DisplayUploadedFileContainer,
} from "../../DisplayUploadedFile/styles";
import { FieldComponentProps, FormFieldConfig } from "../types";
import FileField from "./FileField";
import SelectField from "./SelectField";
import {
  DocumentsTypography,
  DocumentUploadSection,
  FileBox,
  MainContainer,
  StyledSelectBox,
} from "./styles";
import TextFieldComponent from "./TextField";

/**
 * Utility function to get user's full name from sessionStorage
 * @returns {string} User's full name (firstName + lastName) or empty string if not found
 */
export const getUserFullNameFromStorage = (): string => {
  try {
    const userDataStr = sessionStorage.getItem("user");
    if (!userDataStr) return "";

    const userData = JSON.parse(userDataStr);
    const firstName = userData?.firstName || "";
    const lastName = userData?.lastName || "";

    // Combine first name and last name with a space
    return `${firstName} ${lastName}`.trim();
  } catch (error) {
    console.warn("Error getting user data from sessionStorage:", error);
    return "";
  }
};

export interface UploadFieldProps extends FieldComponentProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  isFormAnArray?: boolean;
  trigger?: any;
  companyType?: string;
  customeStyles?: any; // Custom styles for the field

  // Prefilled documents when editing an activity
  documents?: any[];
  disableAllFields?: boolean; // To disable all fields in the form
  isDownloadAllowed?: boolean;
}

const DocumentUploadField = ({
  control,
  watch,
  setValue,
  isFormAnArray,
  trigger,
  field,
  companyType: propCompanyType,
  documents: propDocuments,
  disableAllFields = false, // New prop to disable all fields
  onUploadSuccess,
  onActionMap,
  isDownloadAllowed: isDownloadAllowedProp,
}: UploadFieldProps) => {
  const { hideDropdown = false, componentProps = {} } = field;
  const downloadFeatureKey =
    (componentProps.permissionFeatureKey as FeatureKey) ??
    FeatureKey.EXPORT_UPLOADED_FILES;
  const hasRbacDownloadPermission = useHasPermission(downloadFeatureKey);
  const permissionBasedDownload = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacDownloadPermission;
  const resolvedIsDownloadAllowed = isDownloadAllowedProp ?? permissionBasedDownload;
  const formFieldName = componentProps.formFieldName || "documents";
  const isDocumentTypeRequired = componentProps.isDocumentTypeRequired || false;
  const isDocumentRequired = componentProps.isDocumentRequired || false;
  const maxLimit = componentProps.maxLimit ?? 1000;
  const hideUploadedFilesPreview = componentProps.hideUploadedFilesPreview ?? false;
  const allowMultipleFiles = componentProps.allowMultipleFiles ?? false;
  const emptyStateMessage = componentProps.emptyStateMessage;
  const useIbpFileEndpoints = componentProps.useIbpFileEndpoints ?? false;
  const uploadEndpoint =
    componentProps.uploadEndpoint ??
    (useIbpFileEndpoints ? endPoints.ibpFileUpload : endPoints.fileUpload);
  const replaceEndpoint =
    componentProps.replaceEndpoint ??
    (useIbpFileEndpoints ? endPoints.ibpFileUpload : undefined);
  const replaceMethod =
    componentProps.replaceMethod ?? (useIbpFileEndpoints ? "POST" : "PUT");
  const deleteEndpoint =
    componentProps.deleteEndpoint ?? endPoints.fileUploadDelete;
  const deleteWithoutApi =
    componentProps.deleteWithoutApi ?? useIbpFileEndpoints;
  const getFileDownloadUrl =
    componentProps.getFileDownloadUrl ??
    (useIbpFileEndpoints ? endPoints.ibpFileUploadDownloadById : undefined);
  const showLatestRequirementsTable =
    field?.componentProps?.showLatestRequirementsTable ?? false;

  // Initialize with documents passed from parent if available
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const uploadedFilesRef = useRef<any[]>([]);
  uploadedFilesRef.current = uploadedFiles;
  // Used to hydrate from form value exactly once when propDocuments is absent
  // but the form was pre-filled externally (e.g. formMethods.reset on edit).
  const hydratedFromFormValue = useRef(false);

  const memoizedDocumentTypeField: FormFieldConfig = useMemo(
    () => ({
      ...field,
      key: "documentType",
      name: "documentType",
      label: isDocumentTypeRequired ? "Document type *" : "Document type",
      type: "select",
      gridColumn: 3,
      apiDependencies: {
        endPoint: endPoints.lookUpByName("DOCUMENT_TYPE"),
      },
      componentProps: {
        fullWidth: true,
        disabled: disableAllFields, // Disable if max limit reached
      },
    }),
    [field]
  );

  const fileField: FormFieldConfig = {
    ...field,
    key: "fileUpload",
    name: `fileUpload`,
    label: "Upload file",
    type: "file",
    gridColumn: 6,
    componentProps: {
      fullWidth: true,
      disabled:
        disableAllFields || (maxLimit && uploadedFiles.length >= maxLimit), // Disable if max limit reached
      ...(hideDropdown && { requireDocumentType: false }),
      ...componentProps,
      uploadEndpoint,
      replaceEndpoint,
      replaceMethod,
    },
  };

  const TextField: FormFieldConfig = {
    ...field,
    key: "documentName",
    name: `documentName`,
    label: "Enter document name",
    type: "text",
    gridColumn: 3,
    componentProps: {
      fullWidth: true,
      placeholder: "Enter document name",
      disabled:
        disableAllFields || (maxLimit && uploadedFiles.length >= maxLimit), // Disable if max limit reached
    },
  };

  const defaultDocumentType = useLookupIdByKey(
    LookUpValues.DOCUMENT_TYPE_OTHER_ACTIVITY
  );
  const defaultDocumentTypeLookupKey = componentProps.defaultDocumentTypeLookupKey;
  const preselectedDocTypeId = useLookupIdByKey(defaultDocumentTypeLookupKey);
  const dispatch = useDispatch();
  const { register, formState, clearErrors, trigger: triggerValidation } = useFormContext();

  useEffect(() => {
    register(formFieldName, {
      validate: isDocumentRequired
        ? () => {
            const docs = uploadedFilesRef.current;
            return (
              (Array.isArray(docs) &&
                docs.some((d) => d?.documentId != null)) ||
              "Please upload at least one document"
            );
          }
        : undefined,
    });
  }, [formFieldName, isDocumentRequired]);

  useEffect(() => {
    if (preselectedDocTypeId && !watch("documentType")) {
      setValue("documentType", preselectedDocTypeId);
      setSelectedDocType(preselectedDocTypeId);
    }
  }, [preselectedDocTypeId]);

  const companyId = field.companyId;
  const opportunityId = field.opportunityId;
  const opportunityActivityId = field.opportunityActivityId;
  const policyId = field.policyId;
  const claimActivityId = field.claimActivityId;
  const endorsementId = field.endorsementId;
  const uploadCategory = field.uploadCategory;
  const { mutate } = useApiMutation({});
  const customVariant = field?.componentProps?.customVariant;

  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<number | null>(null);

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name === "documentType" && type === "change") {
        setSelectedDocType(value.documentType ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch]);
  // Sync form value when prefilled documents change
  useEffect(() => {
    if (propDocuments && propDocuments.length) {
      const uniqueDocsMap = new Map<string | number, any>();

      propDocuments.forEach((doc) => {
        const docId = doc.documentId;

        // Skip if documentId is null or undefined
        if (!docId) return;

        // Skip duplicates
        if (uniqueDocsMap.has(docId)) return;

        uniqueDocsMap.set(docId, {
          documentId: docId,
          documentType: doc.documentTypeLid,
          documentName: doc.documentName ?? doc.fileName ?? "",
          fileUpload: doc.fileUpload ?? {
            id: docId,
            fileName: doc.fileName,
            fileBuffer: doc.fileBuffer,
          },
          companyType: propCompanyType,
          companyId,
          opportunityId,
          opportunityActivityId,
          policyId,
          claimActivityId,
          uploadedAt: doc.uploadedAt ?? null,
          uploadedBy: doc.uploadedBy ?? getUserFullNameFromStorage(),
        });
      });

      const mapped = Array.from(uniqueDocsMap.values());

      uploadedFilesRef.current = mapped;
      setUploadedFiles(mapped);
      setValue(formFieldName, mapped);
    }
  }, [
    propDocuments,
    field.name,
    setValue,
    propCompanyType,
    companyId,
    policyId,
    claimActivityId,
  ]);

  // Hydrate uploadedFiles from the form value when the form is pre-filled
  // externally (e.g. formMethods.reset() on edit) and propDocuments is absent.
  // Runs once on the first non-empty value so it never overwrites user edits.
  const formFieldValue = watch(formFieldName);
  useEffect(() => {
    if (hydratedFromFormValue.current) return;
    if (propDocuments?.length) return; // propDocuments effect handles this case
    if (uploadedFilesRef.current.length > 0) return;
    if (!Array.isArray(formFieldValue) || formFieldValue.length === 0) return;

    hydratedFromFormValue.current = true;

    const mapped = formFieldValue
      .filter((doc: any) => doc?.documentId != null)
      .map((doc: any) => ({
        documentId: doc.documentId,
        documentType: doc.documentTypeLid ?? null,
        documentName: doc.documentName ?? doc.fileName ?? "",
        fileUpload: doc.fileUpload ?? {
          id: doc.documentId,
          fileName: doc.documentName ?? doc.fileName ?? "",
        },
        companyType: propCompanyType,
        companyId,
        opportunityId,
        opportunityActivityId,
        policyId,
        claimActivityId,
        uploadedAt: doc.uploadedAt ?? null,
        uploadedBy: doc.uploadedBy ?? getUserFullNameFromStorage(),
      }));

    if (mapped.length > 0) {
      uploadedFilesRef.current = mapped;
      setUploadedFiles(mapped);
      // Don't call setValue — the form already has this value from reset()
    }
  }, [formFieldValue]);

  const selectedDocumentType = watch("documentType");
  const documentName = watch("documentName");

  const companyType = propCompanyType ?? field.companyType;

  const handleFileUploaded = (fileData: any) => {
    const isEndorsementVariant = customVariant === "endorsementDoc" && !allowMultipleFiles;
    const isEndorsementReplaceScenario =
      isEndorsementVariant &&
      maxLimit === 1 &&
      uploadedFiles.length >= maxLimit;

    if (!isEndorsementVariant && maxLimit && uploadedFiles.length >= maxLimit) {
      dispatch(
        setToastMessage(
          `Maximum ${maxLimit} file${maxLimit > 1 ? "s" : ""
          } allowed. Only one file can be uploaded.`
        )
      );
      return;
    }

    // Skip if there's no valid document ID
    const docId = fileData?.id;
    if (!docId) {
      console.warn("File skipped due to missing documentId:", fileData);
      return;
    }

    const newFile = {
      documentType: selectedDocumentType,
      documentId: fileData?.id,
      fileUpload: fileData,
      documentName: documentName || "",
      companyType,
      companyId,
      opportunityId,
      opportunityActivityId,
      policyId,
      claimActivityId,
      uploadedAt: fileData?.uploadedAt ?? new Date().toISOString(),
      uploadedBy: fileData?.uploadedBy ?? getUserFullNameFromStorage(),
    };

    let didAddNewFile = false;

    if (isEndorsementVariant) {
      const hadPreviousFile = uploadedFiles.length > 0;
      const updated = [newFile];
      uploadedFilesRef.current = updated;
      setUploadedFiles(updated);
      setValue(formFieldName, updated);
      clearErrors(formFieldName);

      onUploadSuccess?.();

      if (hadPreviousFile) {
        dispatch(setToastMessage(ENDORSEMENT_DOCUMENT_REPLACED));
      }

      setValue("fileUpload", undefined);
      setValue("documentName", undefined);

      return;
    }

    const uniqueDocsMap = new Map<string | number, any>();
    uploadedFiles.forEach((doc) => {
      const existingId = doc.fileUpload?.id;
      if (existingId) {
        uniqueDocsMap.set(existingId, doc);
      }
    });
    if (!uniqueDocsMap.has(docId)) {
      uniqueDocsMap.set(docId, newFile);
      didAddNewFile = true;
    }
    const updated = Array.from(uniqueDocsMap.values());
    uploadedFilesRef.current = updated;
    setUploadedFiles(updated);
    setValue(formFieldName, updated);
    clearErrors(formFieldName);

    if (didAddNewFile) {
      onUploadSuccess?.();
    }

    setValue("fileUpload", undefined);
    setValue("documentName", undefined);
  };

  // For Replacing the Existing File with the new File
  const handleReplaceFile = (oldFileId: string, newFile: any) => {
    let didReplaceFile = false;

    setUploadedFiles((prevFiles) => {
      const updated = prevFiles.map((file) => {
        if (
          String(file.fileUpload?.id ?? file.documentId) === String(oldFileId)
        ) {
          didReplaceFile = true;
          return { ...file, ...newFile };
        }
        return file;
      });
      setValue(formFieldName, updated);
      return updated;
    });

    if (didReplaceFile) {
      onUploadSuccess?.();
    }
  };

  //for deleting the file
  const handleDeleteFile = (fileId: string) => {
    const removeFileLocally = () => {
      let didRemoveFile = false;
      setUploadedFiles((prevFiles: any[]) => {
        const updated = prevFiles.filter((file: any) => {
          const currentId = file.fileUpload?.id ?? file.documentId;
          const shouldKeep = String(currentId ?? "") !== String(fileId ?? "");

          if (!shouldKeep) {
            didRemoveFile = true;
          }

          return shouldKeep;
        });
        uploadedFilesRef.current = updated;
        setValue(formFieldName, updated);
        return updated;
      });
      if (didRemoveFile) {
        triggerValidation(formFieldName);
        onUploadSuccess?.();
      }
    };

    if (deleteWithoutApi) {
      removeFileLocally();
      return;
    }

    mutate(
      {
        endpoint: `${deleteEndpoint}/${fileId}`,
        method: httpMethods.DELETE,
        data: undefined,
      },
      {
        onSuccess: () => {
          removeFileLocally();
        },
        onError: (error) => {
          dispatch(
            setToastMessage(FAILED_TO_DELETE_FILE + ": " + error.message)
          );
        },
      }
    );
  };

  const finalUploadedFiles =
    customVariant === "endorsementDoc" && maxLimit === 1
      ? uploadedFiles.length > 0
        ? [uploadedFiles[uploadedFiles.length - 1]]
        : []
      : uploadedFiles;
  const hasUploadedFiles =
    Array.isArray(finalUploadedFiles) && finalUploadedFiles.length > 0;

  return (
    <MainContainer customVariant={field?.componentProps?.customVariant}>
      <DocumentsTypography>{field?.label}{isDocumentRequired && " *"}</DocumentsTypography>
      {formState.errors[formFieldName] && (
        <Typography variant="caption" color="error">
          {String(formState.errors[formFieldName]?.message ?? "Please upload at least one document")}
        </Typography>
      )}
      {isUploading ? (
        <LinearProgress color="secondary" />
      ) : showLatestRequirementsTable ? (
        <UploadedDocumentsTable
          files={finalUploadedFiles}
          onReplace={handleReplaceFile}
          onDelete={handleDeleteFile}
          disableAllFields={disableAllFields}
          hideDropdown={hideDropdown}
          accept={componentProps.accept}
          downloadModuleKey={componentProps.downloadModuleKey}
          isDownloadAllowed={resolvedIsDownloadAllowed}
          replaceEndpoint={replaceEndpoint}
          replaceMethod={replaceMethod}
          getFileDownloadUrl={getFileDownloadUrl}
        />
      ) : (
        !hideUploadedFilesPreview &&
        finalUploadedFiles?.map(
          (file: any, index: number) =>
            file && (
              <DisplayUploadedFile
                key={file?.fileUpload?.id || index}
                file={file}
                onReplace={handleReplaceFile}
                onDelete={handleDeleteFile}
                disableAllFields={disableAllFields}
                hideDropdown={hideDropdown}
                customVariant={customVariant}
                accept={componentProps.accept}
                downloadModuleKey={componentProps.downloadModuleKey}
                isDownloadAllowed={resolvedIsDownloadAllowed}
                replaceEndpoint={replaceEndpoint}
                replaceMethod={replaceMethod}
                getFileDownloadUrl={getFileDownloadUrl}
              />
            )
        )
      )}
      <DocumentUploadSection>
        {!hideDropdown && (
          <>
            <StyledSelectBox
              onBlur={() => {
                const docType = watch("documentType");
                if (docType) {
                  setSelectedDocType(docType);
                  setValue("documentType", docType); // explicitly patch back
                }
              }}
            >
              <SelectField
                field={memoizedDocumentTypeField}
                control={control}
                watch={watch}
                setValue={setValue}
                isFormAnArray={isFormAnArray}
                trigger={trigger}
              />
            </StyledSelectBox>

            {selectedDocumentType === 407 && (
              <TextFieldComponent
                key={TextField.key}
                field={TextField}
                control={control}
                watch={watch}
                setValue={setValue}
              />
            )}
          </>
        )}
        <FileBox
          hideDropdown={hideDropdown}
          customVariant={field.componentProps?.customVariant}
        >
          <FileField
            field={fileField}
            control={control}
            watch={watch}
            setValue={setValue}
            onActionMap={onActionMap}
            selectedDocumentType={
              (watch("documentType") as string | undefined) ||
              defaultDocumentType
            }
            companyId={companyId}
            onUploadingChange={setIsUploading}
            onFileUploaded={handleFileUploaded}
            companyType={companyType}
            opportunityId={opportunityId}
            opportunityActivityId={opportunityActivityId}
            policyId={policyId}
            claimActivityId={claimActivityId}
            endorsementId={endorsementId}
            uploadCategory={uploadCategory}
          />
        </FileBox>
      </DocumentUploadSection>
    </MainContainer>
  );
};

export default DocumentUploadField;