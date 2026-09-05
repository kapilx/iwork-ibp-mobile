import { ChannelType, TemplateParameter } from './types';

export const CHANNEL_TYPES: ChannelType[] = [
  { id: 1, key: 'in-app', label: 'In-App' },
  { id: 2, key: 'email', label: 'Email' },
  { id: 3, key: 'sms', label: 'SMS' },
  { id: 4, key: 'whats-app', label: 'WhatsApp' },
];

// Helper function to find channel type by any matching format
export const findChannelType = (value: any): ChannelType | undefined => {
  if (!value) return undefined;
  
  // If value is an object with channelType or channelTypeKey property
  const searchValue = typeof value === 'object' 
    ? (value.channelType || value.channelTypeKey || value.key || value.label || '')
    : String(value);
  
  return CHANNEL_TYPES.find(c => 
    c.key === searchValue || 
    c.label === searchValue || 
    c.id === value
  );
};

export const AVAILABLE_PARAMETERS: TemplateParameter[] = [
  { id: 1, key: 'passwordResetUrl', description: 'Password reset url' },
  { id: 2, key: 'opportunityURL', description: 'opportunity url' },
  { id: 3, key: 'companyURL', description: 'company url' },
  { id: 4, key: 'passwordResetEmail', description: 'passwordResetEmail' },
  { id: 5, key: 'passwordResetFirstName', description: 'passwordResetFirstName' },
  { id: 6, key: 'endorsementURL', description: 'endorsement url' },
  { id: 7, key: 'policyEndorsementURL', description: 'policy endorsement url' },
  { id: 8, key: 'policyNumber', description: 'The insurer policy number provided in the related d' },
  { id: 9, key: 'customerName', description: 'The name of the company related to the policy' },
  { id: 10, key: 'currentMonth', description: 'The current month of the endorsement for the poli' },
];

