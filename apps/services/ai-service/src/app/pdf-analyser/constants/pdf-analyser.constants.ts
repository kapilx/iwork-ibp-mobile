export const ORG_KEYS = {
  IIRM_INDIA: 'iirm_india',
  IIRM_KENYA: 'iirm_kenya',
  IIRM_SRILANKA: 'iirm_srilanka',
} as const;

export type OrgKey = typeof ORG_KEYS[keyof typeof ORG_KEYS];

export const LOOKUP_KEYS = {
  POLICY_CONFIGURATION_STATUS_DRAFT: 'POLICY_CONFIGURATION_STATUS_DRAFT',
} as const;

export const ACTIVITY_NAMES = {
  PLACEMENT_SLIP_GENERATION: 'Placement Slip Generation',
} as const;

export const S3_PREFIXES = {
  COVERS: 'ai-uploads/covers/',
  POLICY_CONFIGURATOR: 'ai-uploads/policy-configurator/',
  POLICY_DETAILS: 'ai-uploads/policy-details/',
} as const;

export const AZURE_CONSTANTS = {
  STALE_INDEX_NAME: 'epi-compliance',
  DOCUMENT_MODEL_ID: 'prebuilt-layout',
} as const;

export const EXTRACTION_STATUS = {
  SUCCESS: 'SUCCESS',
  PARTIAL: 'PARTIAL',
  FAILED: 'FAILED',
  SAVED_TO_POLICY: 'SAVED_TO_POLICY',
} as const;

export const POLICY_CONFIG_REMARKS = {
  AI_EXTRACTED: 'Configuration extracted from policy document via AI',
} as const;
