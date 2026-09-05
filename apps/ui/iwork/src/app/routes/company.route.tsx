import { RouteObject } from "react-router-dom";
import CompanyListing from "../pages/CompanyPage/CompanyListing";
import AddCompany from "../pages/CompanyPage/AddCompany/addCompany";
import CompanyDetails from "../pages/CompanyPage/CompanyDetails";
import FileUploadPage from "../pages/CompanyPage/FileUpload";
import CreateCompany from "../pages/CompanyPage/CreateCompany";
import ContactSelector from "../pages/CompanyPage/ContactSelector";
import PolicyDetails from "../pages/CompanyPage/PolicyDetails";
import { PortalConfigurationScreen } from "../pages/CompanyPage/PortalConfiguration";
import { PermissionGuard, FeatureKey, SmartAssistForm } from "@ui/ui-lib";

export const companyRoutes: RouteObject[] = [
  {
    path: "companies",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_COMPANY}>
        <CompanyListing />
      </PermissionGuard>
    ),
  },
  {
    path: "companies/new",
    element: (
      <PermissionGuard feature={FeatureKey.CREATE_COMPANY}>
        <AddCompany key="new" />
      </PermissionGuard>
    ),
  },
  {
    path: "companies/:id",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_COMPANY}>
        <CompanyDetails />
      </PermissionGuard>
    ),
  },
  {
    path: "companies/:id/edit",
    element: (
      <PermissionGuard feature={FeatureKey.EDIT_COMPANY}>
        <AddCompany key="edit" />
      </PermissionGuard>
    ),
  },
  {
    path: "companies/:id/configure-portal",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_COMPANY}>
        <PortalConfigurationScreen />
      </PermissionGuard>
    ),
  },
  {
    path: "create1",
    element: <FileUploadPage />,
  },
  {
    path: "create",
    element: <CreateCompany />,
  },
  {
    path: "create2",
    element: <ContactSelector />,
  },
  {
    path: "smart-assist-create",
    element: <SmartAssistForm />,
  },
];
