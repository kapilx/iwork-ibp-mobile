/**
 * ACL Permission Service
 * Handles checking user permissions from the auth service ACL API
 */

import { getConfig } from '../config/services';

interface AclPermissionsResponse {
    status: number;
    message: string;
    data: {
        roleId: number;
        roleName: string;
        access: {
            iWork?: {
                STRAPI_ACCESS?: {
                    parent: string;
                    STRAPI_ADMIN_001?: boolean;
                    STRAPI_READ_001?: boolean;
                };
                [key: string]: any;
            };
            [key: string]: any;
        };
    };
}

interface StrapiAccessPermissions {
    hasStrapiAdmin: boolean;
    hasStrapiRead: boolean;
    hasAnyAccess: boolean;
}

class AclPermissionService {
    private static readonly ACL_PERMISSIONS_ENDPOINT = '/iirm/auth-service/access-control-list/permissions';
    private static permissionsCache: Map<string, { permissions: StrapiAccessPermissions; timestamp: number }> = new Map();
    private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    /**
     * Get API gateway base URL from configuration
     * (ACL endpoints are accessed through the API gateway)
     */
    private static getAuthServiceUrl(): string {
        const config = getConfig();
        return config.apiGatewayUrl;
    }

    /**
     * Get token from storage (same logic as strapiSsoService)
     */
    private static getTokenFromStorage(): string | null {
        const possibleTokenKeys = [
            'authToken',
            'accessToken',
            'token',
            'jwtToken',
            'userToken',
            'authentication',
            'auth_token',
            'bearer_token',
            'iirm_token',
            'user_access_token',
        ];

        const storageOrder: Array<Storage> = [sessionStorage, localStorage];

        const extractTokenFromValue = (rawValue: string | null): string | null => {
            if (!rawValue) return null;
            if (rawValue.length > 10 && rawValue.startsWith('eyJ')) return rawValue;

            if (rawValue.startsWith('{') || rawValue.startsWith('[')) {
                try {
                    const parsed: any = JSON.parse(rawValue);
                    const token =
                        parsed?.accessToken?.accessToken ||
                        parsed?.accessToken ||
                        parsed?.token ||
                        parsed?.authToken;
                    if (typeof token === 'string' && token.length > 10) return token;
                } catch {
                    // ignore parse errors
                }
            }

            return null;
        };

        for (const key of possibleTokenKeys) {
            for (const storage of storageOrder) {
                const token = extractTokenFromValue(storage.getItem(key));
                if (token && token.length > 10) {
                    return token;
                }
            }
        }

        // Fall back: check common "user" object in storage
        for (const storage of storageOrder) {
            const token = extractTokenFromValue(storage.getItem('user'));
            if (token && token.length > 10) {
                return token;
            }
        }

        return null;
    }

    /**
     * Fetch ACL permissions from auth service
     */
    static async fetchAclPermissions(token?: string): Promise<AclPermissionsResponse> {
        const authToken = token || this.getTokenFromStorage();

        if (!authToken) {
            throw new Error('No authentication token found');
        }

        const authServiceUrl = this.getAuthServiceUrl();
        const url = `${authServiceUrl}${this.ACL_PERMISSIONS_ENDPOINT}`;

        console.log('🔍 Fetching ACL permissions from:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ACL permissions: ${response.statusText}`);
        }

        const data: AclPermissionsResponse = await response.json();
        console.log('✅ ACL permissions fetched:', {
            roleId: data.data?.roleId,
            roleName: data.data?.roleName,
            hasStrapiAccess: !!data.data?.access?.iWork?.STRAPI_ACCESS,
        });

        return data;
    }

    /**
     * Check if user has Strapi access permissions
     * @param useCache - Whether to use cached permissions (default: true)
     */
    static async checkStrapiAccess(useCache: boolean = true): Promise<StrapiAccessPermissions> {
        try {
            const token = this.getTokenFromStorage();

            if (!token) {
                console.warn('⚠️ No authentication token found');
                return {
                    hasStrapiAdmin: false,
                    hasStrapiRead: false,
                    hasAnyAccess: false,
                };
            }

            // Check cache first
            if (useCache) {
                const cached = this.permissionsCache.get(token);
                if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
                    console.log('✅ Using cached Strapi permissions');
                    return cached.permissions;
                }
            }

            // Fetch fresh permissions
            const aclData = await this.fetchAclPermissions(token);
            const strapiAccess = aclData.data?.access?.iWork?.STRAPI_ACCESS || {};

            const permissions: StrapiAccessPermissions = {
                hasStrapiAdmin: strapiAccess.STRAPI_ADMIN_001 === true,
                hasStrapiRead: strapiAccess.STRAPI_READ_001 === true,
                hasAnyAccess:
                    strapiAccess.STRAPI_ADMIN_001 === true || strapiAccess.STRAPI_READ_001 === true,
            };

            // Cache the result
            this.permissionsCache.set(token, {
                permissions,
                timestamp: Date.now(),
            });

            console.log('🔐 Strapi access permissions:', permissions);
            return permissions;
        } catch (error) {
            console.error('❌ Failed to check Strapi access:', error);
            return {
                hasStrapiAdmin: false,
                hasStrapiRead: false,
                hasAnyAccess: false,
            };
        }
    }

    /**
     * Clear the permissions cache
     */
    static clearCache(): void {
        this.permissionsCache.clear();
        console.log('🗑️ ACL permissions cache cleared');
    }

    /**
     * Get full ACL permissions for the current user
     */
    static async getFullPermissions(token?: string): Promise<AclPermissionsResponse['data'] | null> {
        try {
            const aclData = await this.fetchAclPermissions(token);
            return aclData.data;
        } catch (error) {
            console.error('❌ Failed to get full permissions:', error);
            return null;
        }
    }
}

export default AclPermissionService;
