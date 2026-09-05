import PofileIcon from "../../assets/svgs/profile-icon.svg";
export interface OpportunityCardProgressBarDetails {
  progress: number;
  startDate: string;
  endDate: string;
}

export interface OpportunityBreadCrumbDetails {
  label: string;
}

export interface OpportunityCardBreadcrumbsDetails {
  milestones: OpportunityBreadCrumbDetails[];
}

export interface OpportunityHeaderDetails {
  companyName: string;
  companyId?: number | string;
  expiryDate: string;
  policyType: string;
  opportunityType: string;
  premium: number;
  brokerage: number;
  crmLead: string;
  opportunityStatus: string;
  opportunityId: number;
}

export const OpportunityDateStyleMap: Record<
  string,
  {
    backgroundColor?: string;
    color?: string;
    dotColor?: string;
    imageSrc?: string;
  }
> = {
  expired: { backgroundColor: "#FFFFFF", color: "red", dotColor: "#FF0000" },
  active: { backgroundColor: "#FFFFFF", color: "#16A249", dotColor: "#34C759" },
};
export const OpportunitycrmLeadStyleMap: Record<
  string,
  {
    backgroundColor?: string;
    color?: string;
    dotColor?: string;
    imageSrc?: string;
  }
> = {
  default: { backgroundColor: "#FFF9E5", color: "black", imageSrc: PofileIcon },
};

export const OpportunityCompanyTypeStyleMap: Record<
  string,
  {
    backgroundColor?: string;
    color?: string;
    dotColor?: string;
    imageSrc?: string;
  }
> = {
  default: { backgroundColor: "#FFFFFF", color: "#4E61EC" },
};
