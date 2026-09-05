export interface DocumentParagraph {
  content?: string;
}

export interface DocumentPage {
  pageNumber: number;
  paragraphs?: DocumentParagraph[];
}

export interface DocumentLanguage {
  locale: string;
}

export interface DocumentSpan {
  offset: number;
  length: number;
}

export interface DocumentCell {
  rowIndex: number;
  columnIndex: number;
  spans: DocumentSpan[];
  content?: string;
}

export interface BoundingRegion {
  pageNumber: number;
}

export interface DocumentTable {
  rowCount: number;
  columnCount: number;
  cells: DocumentCell[];
  boundingRegions?: BoundingRegion[];
}

export interface AnalyzeResult {
  content?: string;
  pages?: DocumentPage[];
  languages?: DocumentLanguage[];
  tables?: DocumentTable[];
}

export interface SearchDocument {
  id: string;
  documentId: string;
  fileName: string;
  content?: string;
  pageCount: number;
  pageNumber: number;
  pageContent?: string;
  paragraphs?: string[];
  documentPath?: string;
  uploadDate: string;
  language: string;
  documentType: string;
  tables?: string[];
}

export interface AnalyzeResult {
  content?: string;
  pages?: DocumentPage[];
  languages?: DocumentLanguage[];
  tables?: DocumentTable[];
}

export interface ExtractionOptions {
  company?: boolean;
  policyDetails?: boolean;
}

export interface InsurerDetails {
  companyName: string | null;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  contactInfo?: {
    phoneNumber?: string;
    personalEmail?: string;
    workEmail?: string;
    website?: string;
  };
}
export interface InsuredDetails {
  companyName: string | null;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  contactInfo?: {
    phoneNumber?: string;
    personalEmail?: string;
    workEmail?: string;
  };
}

export interface PolicyDetails {
  policyNumber?: string;
  effectiveDate?: string;
  expirationDate?: string;
  totalSumInsured?: {
    amount?: string;
    currency?: string;
  };
  premium?: {
    amount?: string;
    frequency?: string;
  };
  coverageDetails?: string[];
  benefits?: string[];
  deductibles?: {
    description?: string;
    amount?: string;
  }[];
  exclusions?: string[];
  conditions?: string[];
  claimsProcess?: string;
}

export interface BeneficiaryDetail {
  name?: string;
  relationship?: string;
  contactInfo?: string;
}

export interface InsuranceDocumentData {
  insurerDetails: InsurerDetails;
  insuredDetails: InsuredDetails;
  policyDetails: PolicyDetails;
  beneficiaryDetails?: BeneficiaryDetail[];
}
