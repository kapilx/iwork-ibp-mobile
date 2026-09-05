import axios from 'axios';
import { ENV } from '../environment';
import { FilePasswordConfigData } from '../utils/password-protection.utils';

/**
 * Service to fetch file password configuration from org-service
 */
export class FilePasswordConfigClient {
    private readonly orgServiceUrl: string;

    constructor() {
        const apiGatewayUrl = ENV.URL_API_GATEWAY
            ? `${ENV.URL_API_GATEWAY}/iirm/org-service`
            : null;
        this.orgServiceUrl =
            ENV.URL_ORG_SERVICE || apiGatewayUrl || 'http://localhost:3001/api/org';
    }

    /**
     * Fetch file password configuration from org-service
     * Fetches fresh data on every call for immediate updates
     * 
     * @returns File password configuration or null if not found
     */
    async getConfiguration(countryId?: number): Promise<FilePasswordConfigData | null> {
        const url = countryId
            ? `${this.orgServiceUrl}/file-password-config?selectedCountryId=${countryId}`
            : `${this.orgServiceUrl}/file-password-config`;
        console.log('[FilePasswordConfigClient] Fetching fresh config from:', {url, countryId});

        try {
            const response = await axios.get(url, {
                timeout: 5000, // 5 second timeout
            });

            const config = response.data?.data;
            
            console.log('[FilePasswordConfigClient] Received config from API:', config);
            
            if (config) {
                return {
                    passwordType: config.passwordType || 'custom',
                    customPassword: config.customPassword || 'Secure@1234',
                    userFields: config.userFields || null,
                };
            }

            // Default configuration
            return {
                passwordType: 'custom',
                customPassword: 'Secure@1234',
                userFields: null,
            };
        } catch (error) {
            console.error('Failed to fetch file password configuration:', error.message);
            
            // Return default configuration on error
            return {
                passwordType: 'custom',
                customPassword: 'Secure@1234',
                userFields: null,
            };
        }
    }
}

// Singleton instance
let filePasswordConfigClientInstance: FilePasswordConfigClient | null = null;

/**
 * Get singleton instance of FilePasswordConfigClient
 */
export function getFilePasswordConfigClient(): FilePasswordConfigClient {
    if (!filePasswordConfigClientInstance) {
        filePasswordConfigClientInstance = new FilePasswordConfigClient();
    }
    return filePasswordConfigClientInstance;
}
