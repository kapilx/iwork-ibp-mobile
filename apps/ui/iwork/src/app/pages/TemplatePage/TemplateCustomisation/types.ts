// Mirrors apps/services/notification-service/src/app/template/dto/template-override.dto.ts

export interface EffectiveTemplate {
  eventTypeId: number;
  eventTypeName: string;
  eventTypeDescription?: string;
  channelTypeId: number;
  defaultTemplateId: number;
  isOverride: boolean;
  overrideTemplateId?: number;
  subject: string;
  body: string;
  isActive: boolean;
}

export type TemplateChangeAction =
  | 'CREATED_OVERRIDE'
  | 'UPDATED_OVERRIDE'
  | 'UPDATED_DEFAULT'
  | 'DELETED_OVERRIDE';

export interface TemplateChangeLogEntry {
  action: TemplateChangeAction;
  oldSubject?: string | null;
  oldBody?: string | null;
  newSubject?: string | null;
  newBody?: string | null;
  changedBy: number;
  changedByName?: string;
  changedAt: string;
}

// Existing per-company/domain customization of a default template — one row
// per company_portal_configuration that has its own override. Powers the
// "Customise" drill-down detail view's existing-overrides list.
export interface TemplateOverrideSummary {
  configId: number;
  companyId?: number | null;
  companyName?: string | null;
  subDomain?: string | null;
  subject: string;
  updatedAt: string;
  isActive: boolean;
}

// Existing company-wide customization of a default template (iwork/
// internal-CRM event types, no domain concept) — one row per company that
// has its own override. Company-scoped equivalent of TemplateOverrideSummary.
export interface TemplateCompanyOverrideSummary {
  companyId: number;
  companyName?: string | null;
  subject: string;
  updatedAt: string;
  isActive: boolean;
}

// One of a company's domains (company_portal_configuration rows), as
// returned by GET /config-company/portal/list/:companyId — used by
// AddCustomisationDialog's domain picker step.
export interface CompanyPortalConfigListItem {
  configId: number;
  subDomain: string | null;
  fullUrl?: string | null;
}

// A row from the company search endpoint (GET /company/companyList) — only
// the fields AddCustomisationDialog actually needs.
export interface CompanySearchResult {
  id: number;
  companyName: string;
  displayName?: string | null;
}
