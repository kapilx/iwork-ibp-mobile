import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { endPoints } from "@ui/ui-lib";

export type CompanyTemplate = {
  id: number;
  companyId: string;
  config: {
    faqs: Array<{
      id: number;
      question: string;
      answer: string;
    }>;
    footer: any;
    contactMatrix: any;
    disclaimerNotes: Array<any>;
  };
};

export type PolicyTemplateInfoPointEntry = {
  id: number;
  text: string;
};

export type PolicyTemplateComponentInfoPoints = {
  componentId?: string | number;
  label?: string;
  infoPoints?: PolicyTemplateInfoPointEntry[];
};

export type PolicyTemplate = {
  id: number;
  companyId: string;
  policyId: string;
  config: {
    compulsory?: PolicyTemplateComponentInfoPoints[];
    optional?: PolicyTemplateComponentInfoPoints[];
    flex?: PolicyTemplateComponentInfoPoints[];
    policyFeaturesDoc: string;
    showCompanyContribution: boolean;
    autoLockEnrollmentAfterConfirm: boolean;
    requireConfirmationBeforeSubmit: boolean;
    disclaimerNotes: Array<{
      id: number;
      text: string;
    }>;
  };
};

export const useDashboardContent = (policyId?: string | number) => {
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const companyId = userDetails?.companyId; // Use companyId instead of employeeCompanyId

  // Log the values being used
  console.log('🔍 useDashboardContent - User Details:', {
    companyId: companyId,
    employeeCompanyId: userDetails?.employeeCompanyId,
    policyId: policyId,
    fullUser: userDetails
  });

  // Fetch company template
  const { data: companyData, isLoading: isCompanyLoading, error: companyError } = useQuery({
    queryKey: ["companyTemplate", companyId],
    queryFn: async () => {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      const url = endPoints.companyTemplate(companyId);
      console.log('🌐 Company Template API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch company template');
      }
      return response.json();
    },
    enabled: Boolean(companyId),
  });

  // Fetch policy template (only if policyId is provided)
  const { data: policyData, isLoading: isPolicyLoading, error: policyError } = useQuery({
    queryKey: ["policyTemplate", companyId, policyId],
    queryFn: async () => {
      if (!companyId || !policyId) {
        throw new Error('Company ID and Policy ID are required');
      }
      
      const url = endPoints.policyTemplate(companyId, policyId);
      console.log('🌐 Policy Template API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch policy template');
      }
      return response.json();
    },
    enabled: Boolean(companyId) && Boolean(policyId),
  });

  const dashboardContent: CompanyTemplate | null = useMemo(() => {
    if (!companyData) return null;
    // data is an array, get the first item
    return Array.isArray(companyData) && companyData.length > 0 ? companyData[0] : null;
  }, [companyData]);

  const policyTemplate: PolicyTemplate | null = useMemo(() => {
    if (!policyData) return null;
    // data is an array, get the first item
    return Array.isArray(policyData) && policyData.length > 0 ? policyData[0] : null;
  }, [policyData]);

  return {
    dashboardContent,
    policyTemplate,
    isLoading: isCompanyLoading || isPolicyLoading,
    error: companyError || policyError,
  };
};
