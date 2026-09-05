import { RouteObject } from "react-router-dom";
import PolicyListing from "../pages/PolicyPage/PolicyListing";
import PolicyConfigurator from "../pages/PolicyPage/PolicyConfigurator";
import PolicyDetails from "../pages/CompanyPage/PolicyDetails";
import { environment, PermissionGuard, FeatureKey } from "@ui/ui-lib";
import AddCDDetails from "../components/AddCdDetails";
import HospitalListing from "../components/HospitalListing";
import FaqsListing from "../components/FaqsListing";
import PolicyFeatureListing from "../components/PolicyFeatureListing";

export const policyRoutes: Array<
  RouteObject & { flag?: keyof typeof environment.featureFlag }
> = [
  {
    path: "policies",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_POLICY}>
        <PolicyListing />
      </PermissionGuard>
    ),
    flag: "FF_IWORK_POLICY_LISTING",
  },
  {
    path: "policies/configure/:policyId",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_POLICY}>
        <PolicyConfigurator />
      </PermissionGuard>
    ),
    flag: "FF_IWORK_POLICY_CONFIGURATOR",
  },
  {
    path: "policies/:id",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_POLICY}>
        <PolicyDetails />
      </PermissionGuard>
    ),
  },
  {
    path: "/policies/:id/cd-balance/:cdId",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_POLICY}>
        <AddCDDetails />
      </PermissionGuard>
    ),
  },
  {
    path: "/policies/:id/hospitals",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_POLICY}>
        <HospitalListing />
      </PermissionGuard>
    ),
  },
  {
    path: "/policies/:id/faqs",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_POLICY}>
        <FaqsListing />
      </PermissionGuard>
    ),
  },
  {
    path: "/policies/:id/policy-features",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_POLICY}>
        <PolicyFeatureListing />
      </PermissionGuard>
    ),
  },
];
