export enum TatScopeMetric {
  ENDORSEMENTS = "endorsements",
  CLAIMS = "claims",
  POLICY_EXPIRY_TIMELINE = "policyExpiryTimeline",
}

export enum TatOwnerScopeLevel {
  POLICY_OWNER = "policyOwner",
  COMPANY_OWNER = "companyOwner",
}

export interface TatScopeRule {
  ownerScope: TatOwnerScopeLevel;
  ownerAlias: string;
  ownerIdField: string;
  organisationField: string;
  sbuField: string;
  verticalField: string;
  departmentField: string;
  branchField: string;
  dateField: string;
}

/**
 * Single source of truth for TAT scope semantics.
 * Keep summary + drilldown aligned by always using these mappings.
 */
export const TAT_SCOPE_RULES: Record<TatScopeMetric, TatScopeRule> = {
  [TatScopeMetric.ENDORSEMENTS]: {
    ownerScope: TatOwnerScopeLevel.POLICY_OWNER,
    ownerAlias: "policyOwner",
    ownerIdField: "policy.ownerId",
    organisationField: "policy.organisationId",
    sbuField: "policy.sbuId",
    verticalField: "policy.verticalId",
    departmentField: "policy.departmentId",
    branchField: "policy.branchId",
    dateField: "endorsement.endorsementEntryDate",
  },
  [TatScopeMetric.CLAIMS]: {
    ownerScope: TatOwnerScopeLevel.COMPANY_OWNER,
    ownerAlias: "companyOwner",
    ownerIdField: "companyOwner.userId",
    organisationField: "companyOwner.organisationId",
    sbuField: "companyOwner.sbuId",
    verticalField: "companyOwner.verticalId",
    departmentField: "companyOwner.departmentId",
    branchField: "companyOwner.branchId",
    dateField: "claim.claimDate",
  },
  [TatScopeMetric.POLICY_EXPIRY_TIMELINE]: {
    ownerScope: TatOwnerScopeLevel.POLICY_OWNER,
    ownerAlias: "policyOwner",
    ownerIdField: "policyOwner.userId",
    organisationField: "policy.organisationId",
    sbuField: "policy.sbuId",
    verticalField: "policy.verticalId",
    departmentField: "policy.departmentId",
    branchField: "policy.branchId",
    dateField: "policy.policyTo",
  },
};
