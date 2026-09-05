export type ClaimTypeValue = "CASHLESS" | "REIMBURSEMENT" | "";

export type ClaimsIntimationFormValues = {
  policyId?: string | number | null;
  employeeId?: string | number | null;
  dependentId?: string | number | null;
  claimType?: ClaimTypeValue;
  // Required by some TPAs at intimation (e.g. Health India's benefiT_TYPE). Only shown
  // when the selected policy's TPA uses the MULTI-step (intimate + submit) claim flow.
  benefitType?: string;
  diagnosis?: string;
  estimatedClaimAmount?: string | number;
  hospitalId?: string | number | null;
  hospitalName?: string;
  hospitalLocation?: string;
  state?: string;
  city?: string;
  pincode?: string;
  country?: string;
  emailOrPhoneNumber?: string;
  hospitalEmail?: string;
  hospitalPhoneNumber?: string;
  dateOfAdmission?: string;
  proposedDischargeDate?: string;
  placeOfAccident?: string;
  documentTypes?: string[];
  // Per-document-type uploads (used by Claims Intimation Hospital step UI).
  documentsByType?: Record<string, any[]>;
  // Legacy/flat list (kept for backward compatibility with any older UI paths).
  documents?: any[];

  // Submit Claim step (4th step, MULTI-flow TPAs only — FHPL, Health India).
  dateOfDischargeActual?: string;
  finalClaimedAmount?: string | number;
  payeeName?: string;
  bankAccountNo?: string;
  accountType?: string;
  ifscCode?: string;
  // Separate bucket from documentsByType (Step 3's intimation docs) so uploading
  // bills here never touches the intimation document state. Reuses ClaimDocumentsSection
  // (same CASHLESS/REIMBURSEMENT document matrix + UI as Step 3), so entries are shaped
  // like its DocEntry: { documentId, fileUpload: { id, fileName }, uploadedAt, uploadedTimestamp }.
  submissionDocumentsByType?: Record<string, any[]>;
  submissionDocumentTypes?: string[];

  // TPA-specific fields the framework can't source from our own DB, fetched from
  // GET /claims/extra-fields/:policyId and rendered dynamically by TpaExtraFieldsSection.
  // Keyed by externalFieldName; intimateExtraFields feeds intimate-claim, submitExtraFields
  // feeds submit-claim — kept separate so Step 4 never touches Step 1-3's values.
  intimateExtraFields?: Record<string, any>;
  submitExtraFields?: Record<string, any>;
};

export type ClaimsSummaryState = {
  policyLabel: string;
  claimantName: string;
  claimantRelation: string;
  claimTypeLabel: string;
  diagnosis: string;
  dateOfAdmission: string;
  proposedDischargeDate: string;
  placeOfAccident?: string;
  estimatedClaimAmount: string;
  hospitalName: string;
  hospitalLocation: string;
  documentsCount: number;
};
