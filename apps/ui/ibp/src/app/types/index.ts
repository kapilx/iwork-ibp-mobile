export type Choice = {
  isDefault: boolean;
  isAvailable: boolean;
  sumInsuredId: number;
  companyContribution: number;
  companyPay: number;
  employeeContribution: number;
  employeePay: number;
  sumInsured: string;
  rawSumInsured?: number;
  rawCompanyContribution?: number;
  rawEmployeeContribution?: number;
  rawPremium?: number;
  policyComponentActionType: string;
  policyComponentActionTypeId: number;
  policyComponentActionLabel: string;
  premium: number;
  parentalpolicyComponentActionTypeId?: number;
  premiumPerLife: boolean;
  showCompanyContribution: boolean;
  sumInsuredModel?: string;
  sumInsuredModelProperty?: string;
};

export type Component = {
  id: string;
  label: string;
  type: string;
  premiumPerLife: boolean;
  showCompanyContribution: boolean;
  proRationEnabled?: boolean;
  isBenefitComponent?: boolean;
  acceptRelationsFromParent?: boolean;
  // When true on a type==="base" component, it belongs in the Optional bucket
  // rather than Compulsory, and does not gate enrolment completion.
  isOptional?: boolean;
  sumInsuredOptions: {
    id: number;
    value: string;
  }[];
  sumInsuredModel?: string;
  siMultipleLabel?: string;
  siMultipleMin?: number;
  siMultipleMax?: number;
};

export type AddonChoice = {
  policyId: string;
  policyTypeKey?: string;
  choices: Choice[];
};

export type MainPolicyChoices = {
  policyId: string;
  policyTypeKey?: string;
  choices: Choice[];
};

export type PolicyOption = {
  basePolicyChoices: {
    mainPolicyChoices: MainPolicyChoices;
    addonChoices?: AddonChoice[];
  };
  parentalPolicyChoices: {
    mainPolicyChoices: MainPolicyChoices;
    addonChoices?: AddonChoice[];
  };
};

export type ResponseType = {
  components: Component[];
  availablePolicyChoices: PolicyOption;
};

export type FinalPolicy = {
  id: string;
  label: string | undefined;
  type: string | undefined;
  policyTypeKey?: string;
  policyId?: string | number;
  policyName?: string;
  group?: string;
  parentpolicyComponentActionTypeId?: number | null;
  isBenefitComponent?: boolean;
  acceptRelationsFromParent?: boolean;
  // When true on a type==="base" component, it belongs in the Optional bucket
  // rather than Compulsory, and does not gate enrolment completion.
  isOptional?: boolean;
  choices: Choice[];
};

export * from "./portalConfiguration";
