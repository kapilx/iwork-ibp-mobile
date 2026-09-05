import { useEffect, useState } from 'react';
import { initializeCompanyConfig, CompanyConfig } from '../utils/companyConfig';

interface CompanyConfigInitializerProps {
  children: React.ReactNode;
  onConfigLoaded?: (config: CompanyConfig | null) => void;
}

/**
 * Component to initialize company configuration before rendering the app
 * Wrap your app with this component to ensure config is loaded
 */
export const CompanyConfigInitializer: React.FC<CompanyConfigInitializerProps> = ({
  children,
  onConfigLoaded,
}) => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const config = await initializeCompanyConfig();
        onConfigLoaded?.(config);
        setInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Initialization failed'));
        // Still set initialized to true to prevent blocking the app
        setInitialized(true);
      }
    };

    init();
  }, [onConfigLoaded]);

  if (!initialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading configuration...
      </div>
    );
  }

  if (error) {
    console.warn('Company configuration error:', error);
    // Don't block the app, just log the error
  }

  return <>{children}</>;
};
