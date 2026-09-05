import { LookupRecord } from "@ui/ui-lib";

export interface KnowledgeDocument {
  documentId: number;
  title: string;
  summary: string;
  tags: string[];
  categoryId: number; // Category ID as a string
  docTypeId: number; // e.g., "Document", "Video", "Audio"
  extension: string; // e.g., "pdf", "mp4", "mp3"
  version: number;
  accessCount: number;
  relativePath: string;
  createdAt: string; // Added for date display on DocumentCard
  url: string; // URL to the document
  fileName?: string; // Optional: for file upload
}

export interface CategoryRecord {
  id: number;
  lookUpName: string;
  lookUpKey: string;
  lookUpValueKey: string;
  lookUpValue: string;
  description: string;
  lookUpOrder: number;
  documentCount: number;
}


export interface CatalogResponse {
  categories: CategoryRecord[];
  data: Record<string, KnowledgeDocument[]>; // Key is categoryId (string)
  recentlyAdded: KnowledgeDocument[];
  mostPopular: KnowledgeDocument[];
  docTypes: LookupRecord[]; // Key is docTypeId, value is docTypeName
}
