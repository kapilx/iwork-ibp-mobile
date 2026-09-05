export interface ApiBaseResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface ApiTemplate {
  id: number;
  channelType: string;
  channelTypeId: number;
  eventTypeId: number;
  eventTypeName: string;
  subject?: string;
  body: string;
  approvalStatus: string;
  status: string;
  organizationId?: number;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  updatedByName?: string;
}

export interface ApiEventType {
  id: number;
  name: string;
  description?: string;
}

export interface ApiEventVariable {
  key: string;
  description: string;
  dataType: string;
  example: string;
  required: boolean;
}

export interface ApiEventVariablesResponse {
  eventType: ApiEventType;
  variables: ApiEventVariable[];
  totalVariables: number;
  requiredVariables: number;
}

export interface ApiTemplateListResponse {
  templates: ApiTemplate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
