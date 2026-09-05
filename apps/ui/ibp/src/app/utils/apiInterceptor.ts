import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getCompanyId } from './companyConfig';

/**
 * Create an axios instance that automatically adds company ID to requests
 * Use this for all API calls that need to be filtered by company
 */
export const createApiClient = (baseURL?: string): AxiosInstance => {
  const api = axios.create({
    baseURL: baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add company ID header
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      try {
        const user = JSON.parse(sessionStorage.getItem("user") ?? "{}");
        const token = user?.accessToken?.accessToken;
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      } catch {
        // no token available
        throw new Error("No access token found in session storage");
      }

      const companyId = getCompanyId();

      if (companyId) {
        // Add company ID to headers
        config.headers['X-Company-Id'] = companyId.toString();

        // Optionally add to query params
        // config.params = {
        //   ...config.params,
        //   companyId,
        // };

        console.log("🔒 API Request with Company ID: %s", companyId, config.url);
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error('Unauthorized - redirecting to login');
        // Handle unauthorized errors
        // You might want to redirect to login page here
      }
      return Promise.reject(error);
    }
  );

  return api;
};

// Default API client instance
export const apiClient = createApiClient();

/**
 * Example usage in a React Query hook:
 *
 * import { useQuery } from '@tanstack/react-query';
 * import { apiClient } from './utils/apiInterceptor';
 *
 * const usePolicies = () => {
 *   return useQuery({
 *     queryKey: ['policies'],
 *     queryFn: async () => {
 *       const { data } = await apiClient.get('/api/policies');
 *       // The request will automatically include X-Company-Id header
 *       return data;
 *     },
 *   });
 * };
 */
