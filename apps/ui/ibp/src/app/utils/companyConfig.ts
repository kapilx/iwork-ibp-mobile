/**
 * Company Configuration Utility
 * Handles subdomain-based company configuration for multi-tenant setup
 */

import axiosInstance from "@ui/ui-lib/utils/axiosInterceptors";
import { endPoints } from "@ui/ui-lib";

// Raw, per-company config as served by the backend (null when unconfigured).
// Intentionally generic here — the concrete keys/defaults live with the consumer.
export interface DependentRelationConfig {
  relations?: Record<string, { maxCount: number }>;
  constraints?: Record<string, boolean | number>;
}

export interface CompanyConfig {
  companyId: number;
  companyName: string;
  subDomain: string;
  logoUrl?: string | null;
  databaseConfig?: {
    id: number;
    name: string;
    host: string;
    port: number;
  } | null;
  logoFileId?: number | null;
  portalDashboardConfig?: Record<string, any> | null;
  companyPolicyConfig?: Record<string, any> | null;
  dependentRelationConfig?: DependentRelationConfig | null;
  portalBrandingConfig?: {
    companyLogoFileId?: number | null;
    loginWelcomeMessage?: {
      heading?: string | null;
      bodyText?: string | null;
    } | null;
  } | null;
  passwordRules?: Array<{
    id?: number;
    name: string;
    isRequired?: boolean;
    minChars?: number;
    maxChars?: number;
    regex?: string;
    errorMessage?: string;
  }> | null;
}

const STORAGE_KEY = 'company_config';
const COMPANY_ID_KEY = 'company_id';
const COMPANY_NAME_KEY = 'company_name';
const DEV_SUBDOMAIN_KEY = 'dev_subdomain';

/**
 * Extract subdomain from the current URL. Single source of truth — every caller
 * that needs a tenant subdomain must use this rather than re-deriving it from
 * `window.location.hostname`, which is how `localhost` ended up being sent as a
 * subdomain and silently resolving tenant config to null.
 *
 *
 * On a host with no subdomain (plain `localhost`, an IP), an explicit
 * `?subdomain=<tenant>` query param is honored and remembered for the session,
 * so local dev can target a real tenant. The override is ignored whenever the
 * host itself carries a subdomain, so a deployed environment can never be
 * pointed at another tenant via the URL.
 */
export const getSubdomainFromUrl = (): string | null => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  if (parts.length > 2) {
    return parts[0];
  }

  if (parts.length === 2 && parts[1] === 'localhost') {
    return parts[0];
  }

  try {
    const fromQuery = new URLSearchParams(window.location.search).get('subdomain');
    if (fromQuery) {
      sessionStorage.setItem(DEV_SUBDOMAIN_KEY, fromQuery);
      return fromQuery;
    }
    return sessionStorage.getItem(DEV_SUBDOMAIN_KEY);
  } catch {
    return null;
  }
};

/**
 * Fetch company configuration from config-service by subdomain
 */
export const fetchCompanyConfig = async (subdomain: string): Promise<CompanyConfig> => {
  try {
    const response = await axiosInstance.get(
      endPoints.companyAuthConfigBySubdomain(subdomain)
    );

    const companyConfig = response?.data?.data?.companyConfig;

    if (!companyConfig) {
      throw new Error(`No company configuration found for subdomain: ${subdomain}`);
    }

    return companyConfig;
  } catch (error: any) {
    console.error('Error fetching company config:', error);
    throw new Error(
      error?.response?.data?.message ||
      `Failed to fetch company config for subdomain: ${subdomain}`
    );
  }
};

/**
 * Save company configuration to sessionStorage
 * Also stores company ID and name separately for quick access
 */
export const saveCompanyConfig = (config: CompanyConfig): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Store company ID separately for easy access
    sessionStorage.setItem(COMPANY_ID_KEY, config.companyId.toString());
    // Store company name separately
    sessionStorage.setItem(COMPANY_NAME_KEY, config.companyName);
    console.log(`✅ Company config saved: ${config.companyName} (ID: ${config.companyId})`);
  } catch (error) {
    console.error('Error saving company config to sessionStorage:', error);
  }
};

/**
 * Get company configuration from sessionStorage
 */
export const getCompanyConfig = (): CompanyConfig | null => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as CompanyConfig;
    }

  } catch (error) {
    console.error('Error reading company config from sessionStorage:', error);
  }
  return null;
};

/**
 * The company's configured dependent-relation config, or null when the company has
 * not configured it in iWork (the backend returns null/empty in that case).
 * Consumers apply their own default configuration when this is null.
 */
export const getDependentRelationConfig = (): DependentRelationConfig | null => {
  const configured = getCompanyConfig()?.dependentRelationConfig;
  if (
    configured &&
    configured.relations &&
    Object.keys(configured.relations).length > 0
  ) {
    return configured;
  }
  return null;
};

/**
 * Clear company configuration from sessionStorage
 */
export const clearCompanyConfig = (): void => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(COMPANY_ID_KEY);
    sessionStorage.removeItem(COMPANY_NAME_KEY);
    console.log('🗑️ Company config cleared from sessionStorage');
  } catch (error) {
    console.error('Error clearing company config from sessionStorage:', error);
  }
};

/**
 * Initialize company configuration
 * This should be called when the app starts
 * Returns the company config or null if no subdomain is present
 */
export const initializeCompanyConfig = async (): Promise<CompanyConfig | null> => {
  // Check if config already exists in storage
  const existingConfig = getCompanyConfig();
  if (existingConfig) {
    console.log('Using cached company config:', existingConfig);
    return existingConfig;
  }

  // Extract subdomain from URL
  const subdomain = getSubdomainFromUrl();
  if (!subdomain) {
    console.log('No subdomain detected, skipping company config initialization');
    return null;
  }

  // Fetch and save config
  try {
    const config = await fetchCompanyConfig(subdomain);
    saveCompanyConfig(config);
    console.log('Company config initialized:', config);
    return config;
  } catch (error) {
    console.error('Failed to initialize company config:', error);
    return null;
  }
};

/**
 * Get company ID from sessionStorage (fast access)
 * Falls back to full config if separate ID not found
 * Returns null if no configuration is available
 */
export const getCompanyId = (): number | null => {
  try {
    // Try to get from dedicated storage first (faster)
    const storedId = sessionStorage.getItem(COMPANY_ID_KEY);
    if (storedId) {
      return parseInt(storedId, 10);
    }

    // Fallback to full config
    const config = getCompanyConfig();
    if(!config){
      const companyId = JSON.parse(sessionStorage.getItem('user'))?.companyId;
      return companyId;
    }
    return config ? config.companyId : null;
  } catch (error) {
    console.error('Error getting company ID:', error);
    return null;
  }
};

/**
 * Get company name from sessionStorage (fast access)
 * Falls back to full config if separate name not found
 */
export const getCompanyName = (): string | null => {
  try {
    const storedName = sessionStorage.getItem(COMPANY_NAME_KEY);
    
    if (storedName) return storedName;

    const config = getCompanyConfig();
    if (config) return config.companyName;

    const portalConfig = JSON.parse(sessionStorage.getItem('user') || 'null');
    return portalConfig?.companyName ?? null;
  } catch (error) {
    console.error('Error getting company name:', error);
    return null;
  }
};

/**
 * Check if the app is in multi-tenant mode
 */
export const isMultiTenantMode = (): boolean => {
  return getSubdomainFromUrl() !== null;
};
