import { RouteObject } from "react-router-dom";
// import AddContacts from "../pages/ContactPage/AddContacts";
import ContactTable from "../pages/ContactPage/ContactListing";
import ContactDetails from "../pages/ContactPage/ContactDetails";
import AddContacts from "../pages/ContactPage/AddContacts/addContact";
import { PermissionGuard, FeatureKey } from "@ui/ui-lib";

export const contactRoutes: RouteObject[] = [
  {
    path: "contact",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_CONTACT}>
        <ContactTable />
      </PermissionGuard>
    ),
  },
  {
    path: "contact/:id",
    element: (
      <PermissionGuard feature={FeatureKey.VIEW_CONTACT}>
        <ContactDetails />
      </PermissionGuard>
    ),
  },
  {
    path: "contact/new",
    element: (
      <PermissionGuard feature={FeatureKey.CREATE_CONTACT}>
        <AddContacts key="new" />
      </PermissionGuard>
    ),
  },
  {
    path: "contact/:id/edit",
    element: (
      <PermissionGuard feature={FeatureKey.EDIT_CONTACT}>
        <AddContacts key="edit" />
      </PermissionGuard>
    ),
  },
];
