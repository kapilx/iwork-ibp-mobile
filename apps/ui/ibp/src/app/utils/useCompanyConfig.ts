import { useState, useEffect } from 'react';
import { CompanyConfig, getCompanyConfig, initializeCompanyConfig } from './companyConfig';

/**
 * React hook for accessing company configuration
 * Automatically initializes config on mount if not already present
 */
export const useCompanyConfig = () => {
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);

        // Try to get existing config first
        let existingConfig = getCompanyConfig();

        // If no config exists, initialize it
        if (!existingConfig) {
          existingConfig = await initializeCompanyConfig();
        }

        setConfig(existingConfig);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load company config'));
        setConfig(null);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  return {
    config,
    loading,
    error,
    companyId: config?.companyId || null,
    companyName: config?.companyName || null,
    subDomain: config?.subDomain || null,
  };
};
