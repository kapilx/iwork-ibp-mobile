import { theme } from "@ui/ui-lib";
import faqIcon from "../../assets/svgs/iwork-faq-icon.svg";
import Hospital from "../../assets/svgs/Hospital.svg";
import policyFeatureIcon from "../../assets/svgs/policy-feature-icon.svg";
import { PortalConfigurationData } from "../../constants";

export interface PortalConfigurationItem {
  id: number;
  title: string;
  subtitle: string;
  icon?: string;
  lastUpdated?: string;
  totalRecord?: string;
  coverage?: string;
  buttonText: string;
  backgroundColor: string;
  p1: string;
  p2: string;
  p3: string;
  p1Key: string;
  p2Key: string;
  p3Key: string;
  hasUploadedData: string;
}

export const portalConfigurationItems: PortalConfigurationItem[] = [
  {
    id: 1,
    title: "Hospital Network",
    subtitle: " ",
    icon: Hospital,
    p1: PortalConfigurationData.LAST_UPDATED,
    p2: PortalConfigurationData.HOSPITAL_NETWORK,
    p3: PortalConfigurationData.EXCLUDED_HOSPITAL,
    // ✅ direct nested paths from API root
    p1Key: "hospitalNetwork.lastUploadDate",
    p2Key: "hospitalNetwork.totalNetworkHospitals",
    p3Key: "hospitalNetwork.totalExcludedHospitals",
    buttonText: "Upload File",
    backgroundColor: theme.palette.background.light,
    hasUploadedData: "hospitalNetwork.hasUploadedData",
  },
  // {
  //   id: 2,
  //   title: "FAQs",
  //   subtitle: "Help Center",
  //   icon: faqIcon,
  //   p1: "Last Updated",
  //   p2: "Total Questions",
  //   p3: "Categories",
  //   // ✅ direct nested paths from API root
  //   p1Key: "faq.lastUploadDate",
  //   p2Key: "faq.totalSuccessCount",
  //   p3Key: "faq.totalCategories",
  //   buttonText: "Upload File",
  //   backgroundColor: theme.palette.background.light,
  //   hasUploadedData: "faq.hasUploadedData",
  // },
  {
    id: 3,
    title: "Policy Features",
    subtitle: "Employee view",
    icon: policyFeatureIcon,
    p1: "Last Updated",
    p2: "Uploaded By",
    p3: "Status",
    p1Key: "policyFeature.lastUploadDate",
    p2Key: "policyFeature.uploadedByName",
    p3Key: "policyFeature.status",
    buttonText: "Upload File",
    backgroundColor: theme.palette.background.light,
    hasUploadedData: "policyFeature.hasUploadedData",
  },
   {
    id: 4,
    title: "Contact Matrix",
    subtitle: "Employee view",
    icon: policyFeatureIcon,
    p1: "Last Updated",
    p2: "Updated By",
    p3: "Status",
    p1Key: "contactMatrix.lastConfiguredAt",
    p2Key: "contactMatrix.configuredBy",
    p3Key: "",
    buttonText: "Add Contact",
    backgroundColor: theme.palette.background.light,
    hasUploadedData: "contactMatrix.configured",
  },
  // {
  //   id: 3,
  //   title: "TPA",
  //   subtitle: "Third Party Admin",
  //   icon: TpaIcon,
  //   buttonText: "Upload File",
  // },
];
