export enum WorkflowActionEnum {
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  WITHDRAW = 'withdraw',
  REVISE = 'revise'
}

export enum ApprovalStatusEnum {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum TemplateStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export interface Template {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'sms' | 'push' | 'in-app' | 'whats-app';
  approvalStatus: ApprovalStatusEnum;
  templateStatus: TemplateStatusEnum;
  status: string; // Keep for convenience or mapping if needed
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  eventTypeId?: number;
  eventTypeName?: string;
  formData?: any;
  // True iff this row is a genuine default template (configId IS NULL)
  // whose event type is company/domain-facing (the IBP allow-list) —
  // drives whether the "Customise" row action is shown. See
  // docs/IBP-Email-Notification-Company-Templates/.
  isCompanyCustomizable?: boolean;
  // null/undefined = this row IS the shared default. Set = this row is a
  // company/domain-specific override, scoped to this
  // company_portal_configuration.id. Drives the Company/Subdomain columns
  // and the Default/Customized indicator in the table.
  configId?: number | null;
  companyName?: string | null;
  subDomain?: string | null;
}

export interface TemplateCardProps {
  template: Template;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (id: string) => void;
  onHistory: (id: string) => void;
  onStatusChange: (id: string, action: WorkflowActionEnum) => void;
}

export interface TemplateDashboardState {
  templates: Template[];
  loading: boolean;
  error: string;
}