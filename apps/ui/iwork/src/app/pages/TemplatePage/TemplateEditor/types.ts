export interface TemplateParameter {
  id: number;
  key: string;
  description: string;
}

export interface EventType {
  id: number;
  name: string;
  description: string;
  parameters: string[]; // keys of parameters
}

export interface ChannelType {
  id: number;
  key: string;
  label: string;
}

export interface TemplateFormData {
  name: string;
  description: string;
  channelType: string;
  eventType: string;
  content: string;
  subject: string;
}

export interface TemplateEditorState {
  loading: boolean;
  saving: boolean;
  formData: TemplateFormData;
  previewOpen: boolean;
  isValidated: boolean;
  validationErrors?: any[];
  hasNoEventType?: boolean; // true when template's eventTypeId is null (trigger removed)
  conflictDialog?: {
    open: boolean;
    conflictingTemplateName: string;
    channelType: string;
  };
}
