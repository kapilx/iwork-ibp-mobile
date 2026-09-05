# Strapi SSO Integration Usage

## How to Use Strapi API with SSO Authentication

The SSO integration allows your frontend to seamlessly access Strapi CMS using the same credentials from iwork.

### Import the Service

```typescript
import { StrapiAuthService } from '@ui/ui-lib';
```

### Method 1: Using the Convenience API (Recommended)

```typescript
// Component example
import React, { useEffect, useState } from 'react';

export const DashboardComponent = () => {
  const [banners, setBanners] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStrapiData = async () => {
      try {
        setLoading(true);
        
        // These calls automatically handle authentication
        const [bannersData, faqsData, contentData] = await Promise.all([
        ]);

        setBanners(bannersData.data || []);
        setFaqs(faqsData.data || []);
        setContent(contentData.data);
      } catch (error) {
        console.error('Failed to load Strapi data:', error);
        // Handle authentication or network errors
      } finally {
        setLoading(false);
      }
    };

    loadStrapiData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Render your banners, FAQs, and content */}
      <div>{banners.length} banners loaded</div>
      <div>{faqs.length} FAQs loaded</div>
      {content && <div>Content loaded: {content.title}</div>}
    </div>
  );
};
```

### Method 2: Using the Auth Service Directly

```typescript
import React, { useEffect, useState } from 'react';
import { StrapiAuthService } from '@ui/ui-lib';

export const CustomStrapiComponent = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchCustomData = async () => {
      try {
        // Make any authenticated request to Strapi
        const response = await StrapiAuthService.makeAuthenticatedRequest(
          'http://localhost:4321/api/your-custom-endpoint'
        );
        
        const responseData = await response.json();
        setData(responseData);
      } catch (error) {
        console.error('Strapi request failed:', error);
      }
    };

    fetchCustomData();
  }, []);

  return <div>{/* Render your data */}</div>;
};
```

### Method 3: Check Authentication Status

```typescript
import React, { useEffect, useState } from 'react';
import { StrapiAuthService } from '@ui/ui-lib';

export const AuthAwareComponent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is authenticated with Strapi
    const checkAuth = () => {
      const authenticated = StrapiAuthService.isAuthenticated();
      const currentUser = StrapiAuthService.getCurrentUser();
      
      setIsAuthenticated(authenticated);
      setUser(currentUser);
    };

    checkAuth();
  }, []);

  if (!isAuthenticated) {
    return <div>Authenticating with Strapi CMS...</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.id}! You have access to Strapi CMS.</p>
      <p>Your permissions: {user?.permissions?.length || 0} roles</p>
    </div>
  );
};
```

### Method 4: Manual Authentication

```typescript
import React from 'react';
import { StrapiAuthService } from '@ui/ui-lib';

export const ManualAuthComponent = () => {
  const handleAuthenticate = async () => {
    try {
      // Get iwork token (this happens automatically in normal usage)
      const iworkToken = localStorage.getItem('authToken');
      
      if (iworkToken) {
        const authResponse = await StrapiAuthService.authenticate(iworkToken);
        console.log('Strapi authentication successful:', authResponse);
        
        // Now you can make authenticated requests
        console.log('Banners:', banners);
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  return (
    <button onClick={handleAuthenticate}>
      Authenticate with Strapi
    </button>
  );
};
```

## Important Notes

1. **Automatic Authentication**: The service automatically handles authentication using your iwork JWT token.

2. **Token Management**: Strapi tokens are cached and automatically refreshed when expired.

3. **Error Handling**: The service handles 401 errors by re-authenticating automatically.

4. **iwork Token Location**: Update the `getIworkToken()` method in the service if you store your iwork JWT token in a different location.

## Configuration

Make sure your `environment.strapiUrl` is set correctly:

```typescript
// In your environment configuration
export const environment = {
  strapiUrl: 'http://localhost:4321', // Your Strapi CMS URL
  // ... other config
};
```

## Testing

You can test the integration by:

1. Login to iwork with your credentials (ramakrishna / Test@123)
2. Navigate to any component that uses Strapi data
3. The component will automatically authenticate with Strapi and load content

The authentication happens seamlessly in the background! 🎉
