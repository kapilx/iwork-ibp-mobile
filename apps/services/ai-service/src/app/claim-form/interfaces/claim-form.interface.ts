export interface ClaimFormDtoFields {
  diagnosis: string | null;
  estimatedClaimAmount: number | null;
  dateOfAdmission: string | null;
  proposedDischargeDate: string | null;
  claimType: 'CASHLESS' | 'REIMBURSEMENT' | null;
  hospitalName: string | null;
  hospitalLocation: string | null;
  placeOfAccident: string | null;
  patientName: string | null;
  patientRelation: string | null;
}

export interface ClaimFormValidationError {
  field: string;
  message: string;
}

export interface ClaimFormValidation {
  isValid: boolean;
  errors: ClaimFormValidationError[];
}

export interface ClaimFormExtractionResult {
  approach: 'gpt-vision' | 'textract-gpt';
  dtoFields: ClaimFormDtoFields;
  validation: ClaimFormValidation;
  fullData: Record<string, unknown>;
}
