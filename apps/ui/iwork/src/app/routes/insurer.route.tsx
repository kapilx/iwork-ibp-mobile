import { RouteObject } from "react-router-dom";
import InsurerPage from "../pages/InsurerPage";
import InsurerContactDetails from "../pages/InsurerContactPage/InsurerContactDetails";
import InsurerDetails from "../pages/InsurerPage/InsurerDetails";
import InsurerForm from "../pages/InsurerPage/InsurerForm";
import AddInsurerBranch from "../pages/InsurerPage/AddInsurerBranch";
import InsurerAddContacts from "../pages/InsurerContactPage/InsurerAddContacts/addInsurer";
import InsurerConfig from "../pages/InsurerPage/InsurerConfig";
import TpaExternalFeatures from "../pages/InsurerPage/TpaExternalFeatures";
import TpaAppRefsPage from "../pages/TpaAppRefsPage";
import TpaAppRefForm from "../pages/TpaAppRefsPage/TpaAppRefForm";
import TpaExternalFeatureForm from "../pages/InsurerPage/TpaExternalFeatures/TpaExternalFeatureForm";
import { PermissionGuard, FeatureKey } from "@ui/ui-lib";

export const insurerRoutes: RouteObject[] = [
  {
    path: "/insurer",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_INSURER}>
        <InsurerPage title="Manage Insurer" />
      </PermissionGuard>
    ),
  },
  {
    path: "/tpa",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_TPA}>
        <InsurerPage title="Manage TPA" />
      </PermissionGuard>
    ),
  },
  {
    path: "/broker",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_BROKER}>
        <InsurerPage title="Manage Broker" />
      </PermissionGuard>
    ),
  },
  {
    path: ":entityType/:id",
    element: (
      <PermissionGuard
        feature={
          FeatureKey.VIEW_INSURER ||
          FeatureKey.VIEW_TPA ||
          FeatureKey.VIEW_BROKER
        }
      >
        <InsurerDetails />
      </PermissionGuard>
    ),
  },
  {
    path: "insurer/branch/new",
    element: (
      <PermissionGuard feature={FeatureKey.CREATE_INSURER}>
        <AddInsurerBranch />
      </PermissionGuard>
    ),
  },
  {
    path: ":entityType/new",
    element: (
      <PermissionGuard feature={FeatureKey.CREATE_INSURER}>
        <InsurerForm key="new" />
      </PermissionGuard>
    ),
  },
  {
    path: ":entityType/:id/branch/:addressId/edit",
    element: (
      <PermissionGuard feature={FeatureKey.EDIT_INSURER}>
        <AddInsurerBranch />
      </PermissionGuard>
    ),
  },
  {
    path: ":entityType/:id/edit",
    element: (
      <PermissionGuard feature={FeatureKey.EDIT_INSURER}>
        <InsurerForm key="edit" />
      </PermissionGuard>
    ),
  },
  {
    path: ":entityType/:id/config",
    element: <InsurerConfig />,
  },
  {
    path: "tpa/:id/external-features",
    element: <TpaExternalFeatures />,
  },
  {
    path: "tpa/external-api-configs",
    element: <TpaAppRefsPage />,
  },
  {
    path: "tpa/external-api-configs/new",
    element: <TpaAppRefForm />,
  },
  {
    path: "tpa/external-api-configs/:refId/edit",
    element: <TpaAppRefForm />,
  },
  {
    path: "tpa/external-api-configs/:refId/view",
    element: <TpaAppRefForm viewOnly />,
  },
  {
    path: "admin-settings/external-api-configs/new",
    element: <TpaAppRefForm />,
  },
  {
    path: "admin-settings/external-api-configs/:refId/edit",
    element: <TpaAppRefForm />,
  },
  {
    path: "admin-settings/external-api-configs/:refId/view",
    element: <TpaAppRefForm viewOnly />,
  },
  {
    path: "tpa/:id/external-features/new",
    element: <TpaExternalFeatureForm />,
  },
  {
    path: "tpa/:id/external-features/:configId/edit",
    element: <TpaExternalFeatureForm />,
  },
  {
    path: "tpa/:id/external-features/:configId/view",
    element: <TpaExternalFeatureForm viewOnly />,
  },
  {
    path: ":entityType/contact/new",
    element: (
      <PermissionGuard feature={FeatureKey.CREATE_INSURER_CONTACT}>
        <InsurerAddContacts key="new" />
      </PermissionGuard>
    ),
  },
  {
    path: ":entityType/contact/:id",
    element: <InsurerContactDetails />,
  },
  {
    path: ":entityType/contact/:id/edit",
    element: (
      <PermissionGuard feature={FeatureKey.EDIT_INSURER_CONTACT}>
        <InsurerAddContacts key="edit" />
      </PermissionGuard>
    ),
  },
];
