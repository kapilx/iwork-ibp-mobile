import { endPoints } from "../constants/endPoints";

export interface StrapiAuthResponse {
  success: boolean;
  data: {
    strapiToken: string;
    user: {
      id: number;
      orgId: number;
      permissions: any[];
      role: any;
    };
    expiresAt: string;
  };
}

export interface StrapiToken {
  token: string;
  expiresAt: Date;
  user: any;
}

export class StrapiAuthService {
  private static readonly STORAGE_KEY = "strapi_auth_token";
  private static strapiToken: StrapiToken | null = null;

  /**
   * Authenticate with Strapi using iwork JWT token
   * @param iworkToken - JWT token from iwork authentication
   * @returns Promise with Strapi authentication response
   */
  static async authenticate(iworkToken: string): Promise<StrapiAuthResponse> {
    try {
      const response = await fetch(endPoints.strapiAuthenticate, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: iworkToken }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const authData: StrapiAuthResponse = await response.json();

      if (authData.success && authData.data.strapiToken) {
        // Store the Strapi token
        this.strapiToken = {
          token: authData.data.strapiToken,
          expiresAt: new Date(authData.data.expiresAt),
          user: authData.data.user,
        };

        // Store in localStorage for persistence
        localStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(this.strapiToken),
        );

        return authData;
      } else {
        throw new Error("Authentication response invalid");
      }
    } catch (error) {
      console.error("Strapi authentication error:", error);
      throw error;
    }
  }

  /**
   * Get current Strapi token (authenticate if needed)
   * @returns Promise with valid Strapi token
   */
  static async getValidToken(): Promise<string> {
    // Check if we have a valid token in memory
    if (this.strapiToken && new Date() < this.strapiToken.expiresAt) {
      return this.strapiToken.token;
    }

    // Check localStorage for stored token
    const storedToken = localStorage.getItem(this.STORAGE_KEY);
    if (storedToken) {
      try {
        const parsedToken: StrapiToken = JSON.parse(storedToken);
        if (new Date() < new Date(parsedToken.expiresAt)) {
          this.strapiToken = parsedToken;
          return parsedToken.token;
        }
      } catch (error) {
        console.warn("Invalid stored Strapi token, clearing...");
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }

    // Token expired or doesn't exist, need to authenticate
    const iworkToken = this.getIworkToken();
    if (!iworkToken) {
      throw new Error("No iwork authentication token available");
    }

    const authResponse = await this.authenticate(iworkToken);
    return authResponse.data.strapiToken;
  }

  /**
   * Make authenticated API request to Strapi
   * @param url - API endpoint URL
   * @param options - Fetch options
   * @returns Promise with API response
   */
  static async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const strapiToken = await this.getValidToken();

    const authenticatedOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${strapiToken}`,
        "Content-Type": "application/json",
      },
    };

    const response = await fetch(url, authenticatedOptions);

    // If unauthorized, try to re-authenticate once
    if (response.status === 401) {
      console.warn("Strapi token expired, re-authenticating...");
      this.clearToken();

      const newToken = await this.getValidToken();
      authenticatedOptions.headers = {
        ...authenticatedOptions.headers,
        Authorization: `Bearer ${newToken}`,
      };

      return fetch(url, authenticatedOptions);
    }

    return response;
  }

  /**
   * Get the current user info from stored token
   */
  static getCurrentUser(): any | null {
    if (this.strapiToken) {
      return this.strapiToken.user;
    }

    const storedToken = localStorage.getItem(this.STORAGE_KEY);
    if (storedToken) {
      try {
        const parsedToken: StrapiToken = JSON.parse(storedToken);
        return parsedToken.user;
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  /**
   * Clear stored authentication token
   */
  static clearToken(): void {
    this.strapiToken = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Check if user is authenticated with Strapi
   */
  static isAuthenticated(): boolean {
    if (this.strapiToken && new Date() < this.strapiToken.expiresAt) {
      return true;
    }

    const storedToken = localStorage.getItem(this.STORAGE_KEY);
    if (storedToken) {
      try {
        const parsedToken: StrapiToken = JSON.parse(storedToken);
        return new Date() < new Date(parsedToken.expiresAt);
      } catch (error) {
        return false;
      }
    }

    return false;
  }

  /**
   * Get iwork JWT token from sessionStorage user object
   */
  private static getIworkToken(): string | null {
    try {
      const userStr = sessionStorage.getItem("user");
      if (!userStr) return null;

      const user = JSON.parse(userStr);
      return user?.accessToken?.accessToken || user?.accessToken || null;
    } catch (error) {
      console.error("Error parsing user token from sessionStorage:", error);
      return null;
    }
  }
}

export const strapiApi = {};
