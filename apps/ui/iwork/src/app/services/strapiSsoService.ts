/**
 * Strapi SSO Service - Handles Single Sign-On integration with Strapi CMS
 * Leverages existing JWT tokens from IIRM auth service for seamless authentication
 */

import { getConfig } from '../config/services';

interface StrapiAuthResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    strapiToken: string;
    user: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      orgId: number;
      permissions: any;
      role: { name: string };
    };
    expiresAt: string;
  };
}

interface StrapiSsoOptions {
  openInNewTab?: boolean;
  redirectUrl?: string;
}

class StrapiSsoService {
  private static readonly AUTH_ENDPOINT = '/api/auth-integration/authenticate';
  private static readonly ADMIN_ACCESS_ENDPOINT = '/api/auth-integration/admin-access';
  private static readonly ADMIN_PANEL_URL = '/admin';

  /**
   * Get Strapi base URL from configuration
   */
  private static getStrapiBaseUrl(): string {
    const config = getConfig();
    return config.strapiUrl;
  }

  /**
   * Authenticates with Strapi using existing IIRM JWT token
   * @param iirmToken - JWT token from IIRM authentication
   * @returns Strapi authentication response
   */
  static async authenticateWithStrapi(iirmToken: string): Promise<StrapiAuthResponse> {
    try {
      const response = await fetch(`${this.getStrapiBaseUrl()}${this.AUTH_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: iirmToken }),
      });

      if (!response.ok) {
        throw new Error(`Strapi authentication failed: ${response.statusText}`);
      }

      const authData: StrapiAuthResponse = await response.json();
      
      if (!authData.success) {
        throw new Error(`Authentication failed: ${authData.message}`);
      }

      return authData;
    } catch (error) {
      console.error('Strapi SSO Authentication Error:', error);
      throw error;
    }
  }

  /**
   * Opens Strapi Admin Panel with automatic SSO login
   * @param options - SSO options configuration
   */
  static async openStrapiAdmin(options: StrapiSsoOptions = {}): Promise<void> {
    try {
      // Check for various possible token keys used by IIRM
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
        'user_access_token'
      ];
      
      let iirmToken: string | null = null;
      let tokenKey: string = '';
      let tokenStorage: 'sessionStorage' | 'localStorage' | '' = '';
      
      // Try to find any valid token (prefer sessionStorage, fall back to localStorage)
      const storageOrder: Array<Storage> = [sessionStorage, localStorage];

      const extractTokenFromValue = (rawValue: string | null): string | null => {
        if (!rawValue) return null;
        // Direct token string
        if (rawValue.length > 10 && rawValue.startsWith('eyJ')) return rawValue;

        // JSON blob (e.g., {"accessToken":"..." } or {"accessToken":{"accessToken":"..."}})
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
          if (token && token.length > 10) { // Basic validation - JWT tokens are long
            const storageLabel = storage === sessionStorage ? 'sessionStorage' : 'localStorage';
            iirmToken = token;
            tokenKey = key;
            tokenStorage = storageLabel;
            break;
          }
        }
        if (iirmToken) break;
      }

      // Fall back: check common "user" object in storage
      if (!iirmToken) {
        for (const storage of storageOrder) {
          const token = extractTokenFromValue(storage.getItem('user'));
          if (token && token.length > 10) {
            const storageLabel = storage === sessionStorage ? 'sessionStorage' : 'localStorage';
            console.log(`✅ Found token in ${storageLabel} under key: user (${token.substring(0, 20)}...)`);
            iirmToken = token;
            tokenKey = 'user';
            tokenStorage = storageLabel;
            break;
          }
        }
      }
      
      // If no token found, show all storage contents for debugging
      if (!iirmToken) {
        throw new Error('No IIRM authentication token found. Please login first.');
      }

      // Authenticate for admin panel access
      const adminResponse = await this.authenticateForAdminPanel(iirmToken, options.redirectUrl);
      
      // Store admin authentication data
      localStorage.setItem('strapiAdminToken', adminResponse.data.adminToken);
      localStorage.setItem('strapiAdminUser', JSON.stringify(adminResponse.data.user));
      localStorage.setItem('strapiAdminExpiry', adminResponse.data.expiresAt);

      // Create admin panel URL with SSO authentication
      const adminUrl = this.createAdminSsoUrl(adminResponse.data.adminToken, adminResponse.data.redirectTo);

      console.log('[STRAPI-SSO] Opening admin panel with SSO:', adminUrl);

      // Open Strapi Admin Panel
      if (options.openInNewTab !== false) {
        // Open in new tab (default behavior)
        window.open(adminUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Redirect in current window
        window.location.href = adminUrl;
      }

      return;
    } catch (error) {
      console.error('Failed to open Strapi Admin:', error);
      throw error;
    }
  }

  /**
   * Authenticates with Strapi admin panel using IIRM JWT token
   * @param iirmToken - JWT token from IIRM authentication
   * @param redirectTo - Optional redirect path within admin
   * @returns Admin authentication response
   */
  private static async authenticateForAdminPanel(iirmToken: string, redirectTo?: string) {
    try {
      const response = await fetch(`${this.getStrapiBaseUrl()}${this.ADMIN_ACCESS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: iirmToken, 
          redirectTo: redirectTo || '/admin'
        }),
      });

      if (!response.ok) {
        throw new Error(`Strapi admin authentication failed: ${response.statusText}`);
      }

      const adminData = await response.json();
      
      if (!adminData.success) {
        throw new Error(`Admin authentication failed: ${adminData.message}`);
      }

      return adminData;
    } catch (error) {
      console.error('Strapi Admin SSO Authentication Error:', error);
      throw error;
    }
  }

  /**
   * Sets SSO token in a cookie that Strapi middleware can read
   * @param adminToken - Admin authentication token
   */
  private static setSsoTokenCookie(adminToken: string): void {
    const isProduction = window.location.hostname !== 'localhost';
    
    // Set cookie with appropriate domain and security settings
    const cookieOptions = [
      `strapiSsoToken=${adminToken}`,
      'path=/',
      'SameSite=Lax',
    ];
    
    // In production, set for the Strapi domain
    if (isProduction) {
      // Extract domain from Strapi URL
      const strapiUrl = this.getStrapiBaseUrl();
      try {
        const url = new URL(strapiUrl);
        cookieOptions.push(`domain=${url.hostname}`);
      } catch (e) {
        console.warn('[STRAPI-SSO] Could not parse Strapi URL for cookie domain');
      }
    }
    
    // Set max age to 5 minutes (enough time for SSO flow)
    cookieOptions.push('max-age=300');
    
    document.cookie = cookieOptions.join('; ');
    console.log('[STRAPI-SSO] SSO token cookie set');
  }

  /**
   * Creates authenticated admin URL for SSO access 
   * @param adminToken - Admin authentication token
   * @param redirectPath - Admin panel redirect path
   * @returns Complete admin URL with authentication
   */
  private static createAdminSsoUrl(adminToken: string, redirectPath = '/admin'): string {
    // Both local and production use API Gateway URL
    const baseUrl = this.getStrapiBaseUrl();  // Always use gateway URL
    const isViaGateway = baseUrl.includes('/iirm/strapi-cms-service');
    
    const adminUrl = `${baseUrl}/admin`;
    const params = new URLSearchParams();
    params.set('sso', 'true');
    params.set('redirect', redirectPath);
    params.set('viaGateway', String(isViaGateway));
    
    // Pass token in URL - middleware accepts it when via gateway (production) or dev mode (local)
    params.set('ssoToken', adminToken);
    
    const finalUrl = `${adminUrl}?${params.toString()}`;
    console.log('[STRAPI-SSO] Admin panel URL (via gateway):', finalUrl);
    
    return finalUrl;
  }

  /**
   * Generates authenticated admin URL with SSO token
   * @param strapiToken - Strapi authentication token
   * @param redirectUrl - Optional redirect URL within admin
   * @returns Authenticated admin URL
   */
  private static generateAdminUrl(strapiToken: string, redirectUrl?: string): string {
    // This method is kept for backward compatibility with the general authentication flow
    const baseAdminUrl = `${this.getStrapiBaseUrl()}${this.ADMIN_PANEL_URL}`;
    
    const params = new URLSearchParams();
    params.set('ssoToken', strapiToken);
    
    if (redirectUrl) {
      params.set('redirectTo', redirectUrl);
    }

    return `${baseAdminUrl}?${params.toString()}`;
  }

  /**
   * Validates if user has permission to access Strapi
   * @param userPermissions - User permissions from IIRM
   * @returns boolean indicating access permission
   */
  static hasAdminAccess(userPermissions: string[] = []): boolean {
    const adminPermissions = [
      'CONTENT_MANAGEMENT',
      'CMS_ACCESS',
      'ADMIN',
      'SUPER_ADMIN',
      'content_manager',
      'admin'
    ];
    return userPermissions.some(permission => 
      adminPermissions.includes(permission?.toString().toUpperCase())
    );
  }

  /**
   * Validates if user has permission to access Strapi (with fallback for testing)
   * @param userPermissions - User permissions from IIRM  
   * @returns boolean indicating access permission
   */
  static hasAdminAccessWithFallback(userPermissions: string[] = []): boolean {
    // First check normal CMS permissions
    if (this.hasAdminAccess(userPermissions)) {
      return true;
    }

    // Fallback: Check for general admin permissions
    const generalAdminPermissions = [
      'USER_MANAGEMENT',
      'ORGANIZATION_MANAGEMENT', 
      'SYSTEM_ADMIN',
      'FULL_ACCESS'
    ];

    const hasGeneralAdmin = userPermissions.some(permission =>
      generalAdminPermissions.includes(permission?.toString().toUpperCase())
    );

    if (hasGeneralAdmin) {
      console.log('✅ CMS access granted via general admin permissions');
      return true;
    }

    // Development fallback - allow if user has any permissions (for testing)
    const isDevelopment = window.location.hostname === 'localhost';
    if (isDevelopment && userPermissions.length > 0) {
      console.log('🚧 Development mode: Allowing CMS access for testing');
      return true; 
    }

    console.log('❌ No CMS access permissions found');
    return false;
  }

  /**
   * Refreshes Strapi token before expiry
   */
  static async refreshStrapiToken(): Promise<void> {
    const expiryStr = localStorage.getItem('strapiTokenExpiry');
    if (!expiryStr) return;

    const expiry = new Date(expiryStr);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Refresh if expires within 5 minutes
    if (expiry <= fiveMinutesFromNow) {
      try {
        // Use the same token detection logic as openStrapiAdmin
        const possibleTokenKeys = ['authToken', 'accessToken', 'token', 'jwtToken', 'userToken'];
        let iirmToken: string | null = null;
        
        for (const key of possibleTokenKeys) {
          const token = localStorage.getItem(key);
          if (token && token.length > 10) {
            iirmToken = token;
            break;
          }
        }
        
        if (iirmToken) {
          const authResponse = await this.authenticateWithStrapi(iirmToken);
          localStorage.setItem('strapiToken', authResponse.data.strapiToken);
          localStorage.setItem('strapiTokenExpiry', authResponse.data.expiresAt);
        }
      } catch (error) {
        console.error('Failed to refresh Strapi token:', error);
        // Clear expired tokens
        localStorage.removeItem('strapiToken');
        localStorage.removeItem('strapiUser');
        localStorage.removeItem('strapiTokenExpiry');
      }
    }
  }

  /**
   * Clears Strapi authentication data
   */
  static clearStrapiAuth(): void {
    localStorage.removeItem('strapiToken');
    localStorage.removeItem('strapiUser');
    localStorage.removeItem('strapiTokenExpiry');
  }
}

export default StrapiSsoService;
export type { StrapiAuthResponse, StrapiSsoOptions };
