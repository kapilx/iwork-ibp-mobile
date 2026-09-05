/**
 * Document processor utility for handling different document structures
 * in step components payload generation.
 */

export interface DocumentData {
  documentId?: number;
  documentName?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  fileUpload?: {
    id: number;
    fileName?: string;
    fileKey?: string;
    companyType?: string;
    companyId?: number;
    opportunityId?: number | null;
    opportunityActivityId?: number | null;
    policyId?: number;
    claimId?: number | null;
    claimActivityId?: number;
    meetingId?: number | null;
    documentTypeLid?: number;
    fileBuffer?: string;
  };
  companyId?: number;
  policyId?: number;
  claimActivityId?: number;
  [key: string]: any;
}

export interface ProcessedDocument {
  documentId: number;
  [key: string]: any;
}

/**
 * Processes documents from different structures and returns a consistent format
 *
 * @param data - The form data object containing documents or fileUpload
 * @param dataPath - The path to the data object (e.g., 'fonlSentToInsurer', 'assessmentReport')
 * @returns Array of processed documents with consistent structure
 */
export const processDocuments = (
  data: any,
  dataPath: string
): ProcessedDocument[] => {
  const targetData = data?.[dataPath];

  if (!targetData) {
    return [];
  }

  // Case 1: Multiple documents array (documents field)
  if (targetData.documents && Array.isArray(targetData.documents)) {
    return targetData.documents
      .map((doc: DocumentData) => {
        // Handle different document structures:
        // 1. Reset condition: { documentId, documentName, uploadedAt, uploadedBy }
        if (doc.documentId && doc.documentName) {
          return {
            documentId: doc.documentId,
          };
        }

        // 2. Upload/Replace condition: { fileUpload: { id, fileName, ... }, documentName, ... }
        if (doc.fileUpload?.id) {
          return {
            documentId: doc.fileUpload.id,
          };
        }

        // 3. Direct document structure with id
        if (doc.id) {
          return {
            documentId: doc.id,
          };
        }

        // Fallback for any other structure
        return doc;
      })
      .filter((doc: any) => doc && doc.documentId); // Filter out invalid documents
  }

  // Case 2: No documents
  return [];
};

/**
 * Creates a simple documents array with only documentId for backward compatibility
 *
 * @param data - The form data object containing documents or fileUpload
 * @param dataPath - The path to the data object (e.g., 'fonlSentToInsurer', 'assessmentReport')
 * @returns Array of objects with documentId only
 */
export const processDocumentsSimple = (
  data: any,
  dataPath: string
): { documentId: number }[] => {
  const processedDocuments = processDocuments(data, dataPath);

  return processedDocuments.map((doc) => ({
    documentId: doc.documentId,
  }));
};
