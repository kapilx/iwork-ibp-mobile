export type OpportunityFormDefaultValues = {
  companyId: string;
  contactId: string;
  estimatedBrokerage: string;
  policyTypeLid: string;
  policyStatusLid: string;
  serviceLevelLid: string;
  expiryDate: string;
  sumInsured: string;
  premiumPaid: string;
  stageLid: string;
  referredBy?: string;
  sharingPercentage?: string;
  estimatedFee?: string;
  prevInsurerId?: string;
  prevInsurerLocationId?: string;
  prevInsurerBranchId?: string;
  prevTpaId?: string;
  prevTpaLocationId?: string;
  prevTpaBranchId?: string;
  remarks?: string;
};

export type ClaimExperiencesFormDefaultValues = {
  policyFrom: string;
  policyTo: string;
  natureOfLoss: string;
  premium: string;
  claimAmount: string;
  claimPercentage: string;
};

export type ChallengesFormDefaultValues = {
  challengeTypeLid: string;
  description: string;
  mitigationTypeLid: string;
  mitigationDescription: string;
};
