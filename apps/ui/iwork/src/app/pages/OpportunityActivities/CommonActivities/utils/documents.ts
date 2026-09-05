export type NormalizedDocument = {
  documentTypeLid: number;
  documentId: number | string;
};

export const transformDocuments = (documents: any): NormalizedDocument[] => {
  if (!documents) return [];

  let docsArray: any[] = [];

  if (Array.isArray(documents)) {
    docsArray = documents;
  } else if (Array.isArray(documents.documents)) {
    docsArray = documents.documents;
  } else {
    console.warn(
      "documents is not an array and doesn't have a 'documents' array"
    );
    return [];
  }

  const transformed = docsArray
    .map((doc) => {
      const documentId = doc?.fileUpload?.id ?? doc?.documentId;
      const documentTypeLid = Number(doc?.documentTypeLid ?? doc?.documentType);

      if (!documentId || isNaN(documentTypeLid)) {
        console.warn("Skipping document due to missing id or type:", doc);
        return null;
      }

      return {
        documentTypeLid,
        documentId,
      };
    })
    .filter(Boolean) as NormalizedDocument[];

  return transformed;
};

const resolveDocumentsForPayload = (
  documentsFromForm?: any,
  existingDocuments?: any
): NormalizedDocument[] | undefined => {
  const fromForm = transformDocuments(documentsFromForm);
  if (fromForm.length > 0) return fromForm;

  const existing = transformDocuments(existingDocuments);
  return existing.length > 0 ? existing : undefined;
};

const resolveQuoteDocumentsForPayload = (
  quoteDocumentsFromForm?: any,
  existingQuoteDocuments?: any
): NormalizedDocument[] | undefined => {
  const fromForm = transformDocuments(quoteDocumentsFromForm);
  if (fromForm.length > 0) return fromForm;

  const existing = transformDocuments(existingQuoteDocuments);
  return existing.length > 0 ? existing : undefined;
};

type BuildDocumentsPayloadOptions = {
  documentsFromForm?: any;
  quoteDocumentsFromForm?: any;
  existingDocuments?: any;
  existingQuoteDocuments?: any;
  sendEmptyArrays?: boolean;
  includeQuoteDocuments?: boolean;
};

export const buildDocumentsPayload = ({
  documentsFromForm,
  quoteDocumentsFromForm,
  existingDocuments,
  existingQuoteDocuments,
  sendEmptyArrays = true,
  includeQuoteDocuments = false,
}: BuildDocumentsPayloadOptions): Record<string, NormalizedDocument[]> => {
  const payload: Record<string, NormalizedDocument[]> = {};

  const resolvedDocuments = resolveDocumentsForPayload(
    documentsFromForm,
    existingDocuments
  );
  const resolvedQuoteDocuments = resolveQuoteDocumentsForPayload(
    quoteDocumentsFromForm,
    existingQuoteDocuments
  );

  if (resolvedDocuments) {
    payload.documents = resolvedDocuments;
  } else if (sendEmptyArrays) {
    payload.documents = [];
  }

  if (includeQuoteDocuments) {
    if (resolvedQuoteDocuments) {
      payload.quoteDocuments = resolvedQuoteDocuments;
    } else if (sendEmptyArrays) {
      payload.quoteDocuments = [];
    }
  }

  return payload;
};
