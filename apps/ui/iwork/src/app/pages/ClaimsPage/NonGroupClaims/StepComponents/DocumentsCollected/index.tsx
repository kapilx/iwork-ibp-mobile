import {
  endPoints,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  useApiQuery,
} from "@ui/ui-lib";
import type { DocumentTableRow } from "@ui/ui-lib/commonComponents/DocumentTableField";
import {
  Step,
  StepItem,
} from "apps/ui/iwork/src/app/components/NestedStepper/config";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { StateEnum } from "../../../../../components/NestedStepper/RenderComponent";
import StepLoader from "../StepLoader";

// Public payload shape exposed to parent
export interface DocumentsCollectedPayload {
  body: any;
  // add more typed fields as needed
}

// Methods parent can call via ref
export interface DocumentsCollectedHandle {
  getPayload: () => DocumentsCollectedPayload;
  getFormValues: () => unknown;
  validate?: () => Promise<boolean> | boolean;
  submitAll: () => any;
}

export interface CommonStepItemProps {
  config?: any;
  selectedStep?: Step;
  selectedItem?: StepItem;
  setIsPutCall: React.Dispatch<React.SetStateAction<boolean>>;
}

interface ClaimDocumentPayload {
  documentId: number | string | null;
  documentLabel: string;
  receivedDate: string | null;
  isCustom: number;
}

const normalizeUploadValue = (value: any) => {
  if (!value) return null;
  if (value.fileUpload) return value.fileUpload;
  return value;
};

const hasUploadedDocument = (
  documents: DocumentTableRow[] | undefined
): boolean => {
  if (!Array.isArray(documents)) {
    return false;
  }

  return documents.some((row) => {
    const upload = normalizeUploadValue(row?.documentupload);

    if (!upload) {
      return false;
    }

    if (typeof upload === "string") {
      return upload.trim().length > 0;
    }

    if (upload instanceof File) {
      return true;
    }

    if (typeof upload === "object") {
      const { id, file, fileBuffer, fileUrl, url, fileName, name } =
        upload as Record<string, any>;

      return Boolean(
        id ?? file ?? fileBuffer ?? fileUrl ?? url ?? fileName ?? name
      );
    }

    return Boolean(upload);
  });
};

type SubmitAllResult = Awaited<
  ReturnType<NonNullable<NestedGroupedDataCollectionHandle["submitAll"]>>
>;

const withDocumentUploadValidation = (
  submission: SubmitAllResult | undefined,
  documents: DocumentTableRow[] | undefined,
  invalidFieldKey: string
): SubmitAllResult | undefined => {
  if (!submission) {
    return submission;
  }

  if (hasUploadedDocument(documents)) {
    return submission;
  }

  const invalidFields = new Set<string>(submission.invalidFields ?? []);
  invalidFields.add(invalidFieldKey);

  return {
    ...submission,
    isAllValid: false,
    invalidFields: Array.from(invalidFields),
  };
};

const mapRowToPayload = (row: DocumentTableRow): ClaimDocumentPayload => {
  const normalizedUpload = normalizeUploadValue(row?.documentupload);
  const documentId = normalizedUpload?.id ?? null;

  const rawLabel = row?.documentName;
  const documentLabel =
    rawLabel === undefined || rawLabel === null ? "" : String(rawLabel).trim();

  const rawReceivedDate = row?.receivedDate;
  const receivedDate =
    rawReceivedDate === undefined ||
    rawReceivedDate === null ||
    rawReceivedDate === ""
      ? null
      : String(rawReceivedDate);

  return {
    documentId: documentId ?? null,
    documentLabel,
    receivedDate,
    isCustom: Number(Boolean(row?.isCustom)),
  };
};

const mapApiDocumentToRow = (document: any): DocumentTableRow => {
  const documentInfo = document?.document;
  const uploadId = documentInfo?.documentId;
  const uploadName = documentInfo?.documentName ?? "";

  const fileUpload = uploadId
    ? {
        id: uploadId,
        fileName: uploadName,
      }
    : undefined;

  return {
    documentName: document?.documentLabel ?? uploadName ?? "",
    receivedDate: document?.receivedDate ?? null,
    documentupload: fileUpload
      ? {
          // ...(documentInfo ?? {}),
          id: uploadId,
          fileName: uploadName,
          // fileUpload,
        }
      : null,
    isCustom: Boolean(document?.isCustom),
  };
};

const transformApiDataToFormValues = (data: any) => {
  const documents =
    data?.claimDocumentsCollected?.documents?.map(mapApiDocumentToRow) ?? [];

  return {
    documentsCollected: {
      claimDocuments: documents,
    },
  };
};

const transformFormValuesToPayload = (
  values: Record<string, any>
): { claimDocumentsCollected: { documents: ClaimDocumentPayload[] } } => {
  const formDocuments =
    (values?.documentsCollected?.claimDocuments as DocumentTableRow[]) ?? [];

  return {
    claimDocumentsCollected: {
      documents: formDocuments.map(mapRowToPayload),
    },
  };
};

const DocumentsCollected = forwardRef<
  DocumentsCollectedHandle,
  CommonStepItemProps
>(({ config, selectedItem, selectedStep, setIsPutCall }, ref) => {
  const innerRef = useRef<NestedGroupedDataCollectionHandle>(null);

  const payload = (): DocumentsCollectedPayload => {
    const values = innerRef.current?.getValues?.() || {};
    return {
      body: transformFormValuesToPayload(values),
    };
  };

  // Expose imperative API to parent
  useImperativeHandle(
    ref,
    () => ({
      getPayload: () => payload(),
      getFormValues: () => innerRef.current?.getValues?.(),
      validate: () => {
        return false;
      },
      submitAll: async () => {
        const submission = await innerRef.current?.submitAll?.();
        const values =
          (innerRef.current?.getValues?.() as Record<string, any>) ?? {};

        const documents = values?.documentsCollected?.claimDocuments as
          | DocumentTableRow[]
          | undefined;

        return withDocumentUploadValidation(
          submission,
          documents,
          "documentsCollected.claimDocuments"
        );
      },
    }),
    []
  );

  const { data, isLoading } = useApiQuery({
    url: endPoints.getNonGroupClaimActivityById(
      selectedItem?.claimActivityId || ""
    ),
    queryKey: ["getClaimDataByActivity", selectedItem?.claimActivityId],
    enabled: Boolean(selectedItem?.claimActivityId),
  });

  useEffect(() => {
    if (data && innerRef.current) {
      const activityData = data?.data?.data?.[0];
      const normalizedValues = transformApiDataToFormValues(activityData?.data);

      Boolean(activityData?.statusKey) &&
        innerRef.current.resetForms(normalizedValues);
      setIsPutCall(Boolean(activityData?.statusKey));
    }
  }, [data, setIsPutCall]);

  if (isLoading) {
    return <StepLoader />;
  }

  if (!config) return null;

  return (
    <NestedDynamicForm
      config={config}
      ref={innerRef}
      disableAllFormFields={selectedItem?.stepState !== StateEnum.ACTIVE}
    />
  );
});

DocumentsCollected.displayName = "DocumentsCollected";

export default DocumentsCollected;
