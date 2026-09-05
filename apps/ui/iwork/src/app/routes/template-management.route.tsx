import { RouteObject } from "react-router-dom";

// Lazy load the components
import { lazy, Suspense } from "react";

export const TEMPLATE_MANAGEMENT_BASE_PATH = 'template-management';

const TemplateDashboard = lazy(() => import("../pages/TemplatePage/TemplateDashboard"));
const TemplateEditor = lazy(() => import("../pages/TemplatePage/TemplateEditor"));
const TemplatePreview = lazy(() => import("../pages/TemplatePage/TemplatePreview"));
const PendingApprovals = lazy(() => import("../pages/TemplatePage/PendingApprovals"));
const TemplateHistory = lazy(() => import("../pages/TemplatePage/TemplateHistory"));
const TemplateCustomisation = lazy(() => import("../pages/TemplatePage/TemplateCustomisation"));
const NewCustomisation = lazy(() => import("../pages/TemplatePage/TemplateCustomisation/NewCustomisation"));
const NewCompanyCustomisation = lazy(() => import("../pages/TemplatePage/TemplateCustomisation/NewCompanyCustomisation"));
const CustomiseCompanyEditor = lazy(() => import("../pages/TemplatePage/TemplateCustomisation/CustomiseCompanyEditor"));

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px'
  }}>
    Loading...
  </div>
);

export const templateManagementRoutes: RouteObject[] = [
  {
    path: TEMPLATE_MANAGEMENT_BASE_PATH,
    element: (
      <Suspense fallback={<PageLoader />}>
        <TemplateDashboard />
      </Suspense>
    ),
  },
  {
    path: `${TEMPLATE_MANAGEMENT_BASE_PATH}/create`,
    element: (
      <Suspense fallback={<PageLoader />}>
        <TemplateEditor />
      </Suspense>
    ),
  },
  {
    path: `${TEMPLATE_MANAGEMENT_BASE_PATH}/edit/:id`,
    element: (
      <Suspense fallback={<PageLoader />}>
        <TemplateEditor />
      </Suspense>
    ),
  },
  {
    path: `${TEMPLATE_MANAGEMENT_BASE_PATH}/preview/:id`,
    element: (
      <Suspense fallback={<PageLoader />}>
        <TemplatePreview />
      </Suspense>
    ),
  },
  {
    // Drill-down detail view for one default template's company/domain
    // customizations — see docs/IBP-Email-Notification-Company-Templates/.
    path: `${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/:defaultTemplateId`,
    element: (
      <Suspense fallback={<PageLoader />}>
        <TemplateCustomisation />
      </Suspense>
    ),
  },
  {
    // Full-page company+domain picker for "customise for a different
    // company/domain" — not a modal, per explicit product direction.
    path: `${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/:defaultTemplateId/new`,
    element: (
      <Suspense fallback={<PageLoader />}>
        <NewCustomisation />
      </Suspense>
    ),
  },
  {
    // Company-only equivalent of the picker above, for iwork/internal-CRM
    // event types with no domain concept.
    path: `${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/:defaultTemplateId/new-company`,
    element: (
      <Suspense fallback={<PageLoader />}>
        <NewCompanyCustomisation />
      </Suspense>
    ),
  },
  {
    // Focused, standalone editor for one specific company/domain's copy —
    // header + editor + Save only, no detail-page chrome. Reached both from
    // clicking an existing customization and from completing the picker
    // above for a brand-new one.
    path: `${TEMPLATE_MANAGEMENT_BASE_PATH}/customise/:defaultTemplateId/edit`,
    element: (
      <Suspense fallback={<PageLoader />}>
        <CustomiseCompanyEditor />
      </Suspense>
    ),
  },
  {
    path: `${TEMPLATE_MANAGEMENT_BASE_PATH}/pending-approvals`,
    element: (
      <Suspense fallback={<PageLoader />}>
        <PendingApprovals />
      </Suspense>
    ),
  },
  {
    path: `${TEMPLATE_MANAGEMENT_BASE_PATH}/history`,
    element: (
      <Suspense fallback={<PageLoader />}>
        <TemplateHistory />
      </Suspense>
    ),
  },
];