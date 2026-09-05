export type DocumentCategory = "Medical" | "Insurance" | "Employment" | "Other";
export type PolicyType = "GMC" | "GPA" | "GTL";
export type DocumentTabKey = "policyFeature" | "tpa" | "policyConfirmations";

export type DocumentSubTab = {
  key: string;
  label: string;
  policyId?: number | string;
  policyType?: PolicyType;
  policyName?: string;
};

export type DocumentTab = {
  tabKey: DocumentTabKey;
  label: string;
  componentKey?: string;
  sectionKey?: string;
};

export const documentTabsConfig: DocumentTab[] = [
  {
    tabKey: "policyFeature",
    label: "Policy Feature",
    componentKey: "policyFeatureDocs",
  },
  {
    tabKey: "tpa",
    label: "TPA Card",
    componentKey: "tpaDocs",
    sectionKey: "tpa",
  },
  {
    tabKey: "policyConfirmations",
    label: "Policy Confirmation Document",
    componentKey: "policyConfirmationDocs",
  },
];
