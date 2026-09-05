/**
 * Frontend Configuration for IIRM Services
 * This file contains configuration constants for various services used in the frontend
 */

import { environment } from "@ui/ui-lib";

export interface ServiceConfig {
  strapiUrl: string;
  authServiceUrl: string;
  apiGatewayUrl: string;
}

// Default configuration - derive from environment
export const defaultConfig: ServiceConfig = {
  strapiUrl: environment.strapiUrl,
  authServiceUrl: environment.authUrl,
  // Extract base URL from auth service URL (remove /iirm/auth-service path)
  apiGatewayUrl: environment.authUrl.replace(/\/iirm\/auth-service/g, ''),
};

// Production configuration - same as default (uses environment)
export const productionConfig: ServiceConfig = {
  strapiUrl: environment.strapiUrl,
  authServiceUrl: environment.authUrl,
  // Extract base URL from auth service URL (remove /iirm/auth-service path)
  apiGatewayUrl: environment.authUrl.replace(/\/iirm\/auth-service/g, ''),
};

/**
 * Get the current configuration based on environment
 */
export const getConfig = (): ServiceConfig => {
  // Check if we're in production (you can adjust this logic)
  const isProduction = window.location.hostname !== 'localhost';
  
  // Check for runtime configuration (can be set via build process or server)
  if (typeof window !== 'undefined' && (window as any).APP_CONFIG) {
    return {
      strapiUrl: (window as any).APP_CONFIG.STRAPI_URL || defaultConfig.strapiUrl,
      authServiceUrl: (window as any).APP_CONFIG.AUTH_SERVICE_URL || defaultConfig.authServiceUrl,
      apiGatewayUrl: (window as any).APP_CONFIG.API_GATEWAY_URL || defaultConfig.apiGatewayUrl,
    };
  }

  return isProduction ? productionConfig : defaultConfig;
};

/**
 * Initialize configuration - call this in your app's main entry point
 */
export const initializeConfig = (config?: Partial<ServiceConfig>) => {
  if (typeof window !== 'undefined') {
    (window as any).APP_CONFIG = {
      ...(window as any).APP_CONFIG,
      ...config,
      STRAPI_URL: config?.strapiUrl,
      AUTH_SERVICE_URL: config?.authServiceUrl,
      API_GATEWAY_URL: config?.apiGatewayUrl,
    };
  }
};