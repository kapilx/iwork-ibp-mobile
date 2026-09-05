import { useCompanyConfig } from '../utils/useCompanyConfig';

/**
 * Example component showing how to use company configuration
 * You can use this pattern in any component that needs company info
 */
export const CompanyInfo: React.FC = () => {
  const { config, loading, error, companyId, companyName, subDomain } = useCompanyConfig();

  if (loading) {
    return <div>Loading company info...</div>;
  }

  if (error) {
    return <div>Error loading company info: {error.message}</div>;
  }

  if (!config) {
    return <div>Running in single-tenant mode (no subdomain)</div>;
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', margin: '20px' }}>
      <h3>Company Information</h3>
      <p><strong>Company ID:</strong> {companyId}</p>
      <p><strong>Company Name:</strong> {companyName}</p>
      <p><strong>Subdomain:</strong> {subDomain}</p>
      <p><strong>Database:</strong> {config.databaseConfig.name}</p>
      <p><strong>Database Host:</strong> {config.databaseConfig.host}:{config.databaseConfig.port}</p>
    </div>
  );
};

export default CompanyInfo;
