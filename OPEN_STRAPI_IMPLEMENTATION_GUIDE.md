# IIRM-Strapi SSO "Open Strapi" Button Implementation Guide

## Overview

This implementation provides a seamless **"Open Strapi"** button in the IIRM iwork frontend that allows authenticated users to directly access the Strapi admin panel without requiring additional login credentials. The solution leverages your existing SSO infrastructure and FDW setup.

## Architecture

```mermaid
graph LR
    A[User in iwork] --> B[Click Open Strapi]
    B --> C[Frontend SSO Service]
    C --> D[Strapi Admin Access API]
    D --> E[Auth Service Validation]
    E --> F[Create/Update Admin User]
    F --> G[Generate Admin Token]
    G --> H[Open Strapi Admin Panel]
    H --> I[Auto-Login via SSO Middleware]
```

## Components Implemented

### 1. Frontend Components

#### `StrapiSsoService` (`apps/ui/iwork/src/app/services/strapiSsoService.ts`)
- Handles SSO authentication flow
- Manages token storage and validation
- Creates secure admin panel URLs
- Implements error handling and user feedback

#### `StrapiAccessButton` (`apps/ui/iwork/src/app/components/StrapiAccessButton/index.tsx`)
- Reusable button component for "Open Strapi" functionality
- Permission-based access control
- Loading states and error notifications
- Configurable appearance and behavior

### 2. Backend Components

#### Admin Access API (`apps/services/strapi-cms-service/src/api/auth-integration/`)
- **Controller**: `adminAccess` method for admin panel authentication
- **Service**: Admin user management and token generation
- **Routes**: `/api/auth-integration/admin-access` endpoint

#### SSO Middleware (`apps/services/strapi-cms-service/src/middlewares/admin-sso.ts`)
- Intercepts admin panel requests with SSO parameters
- Validates admin tokens securely
- Creates admin sessions automatically
- Handles redirects and cleanup

### 3. Integration Points

#### User Management
- Uses existing FDW to access IIRM user data
- Creates/updates Strapi admin users automatically  
- Maps IIRM roles to Strapi admin permissions
- No data duplication - references IIRM database

#### Authentication Flow
- Leverages existing JWT tokens from IIRM auth service
- Validates tokens via auth-service integration
- Creates temporary admin tokens for Strapi access
- Secure token passing via cookies and headers

## User Flow

1. **User Authentication**: User is already logged into iwork portal
2. **Click Button**: User clicks "Open Strapi CMS" button
3. **Token Validation**: Frontend service validates IIRM JWT token
4. **Admin Authentication**: Strapi creates/updates admin user and generates admin token
5. **Secure Access**: Admin panel opens with automatic SSO login
6. **Content Management**: User can now manage content in Strapi admin

## Installation & Setup

### 1. Frontend Integration

Add the "Open Strapi" button to any component:

```tsx
import StrapiAccessButton from '../../../components/StrapiAccessButton';

// In your component render:
<StrapiAccessButton
  variant="outlined"
  size="medium"
  buttonText="Open Strapi CMS"
  tooltip="Open Strapi Content Management System in new tab"
  requiredPermissions={['CONTENT_MANAGEMENT', 'CMS_ACCESS', 'ADMIN']}
  options={{ openInNewTab: true }}
  onSuccess={() => console.log('Strapi opened successfully')}
  onError={(error) => console.error('Failed to open Strapi:', error)}
/>
```

### 2. Environment Variables

Ensure these are set in your environment configuration:

```env
# Strapi Service Configuration
URL_STRAPI_CMS_SERVICE=http://localhost:4321
STRAPI_PUBLIC_URL=http://localhost:4321

# JWT Configuration (shared between services)
JWT_SECRET=r97lUhAaTL
ADMIN_JWT_SECRET=r97lUhAaTL

# Auth Service Integration
URL_AUTH_SERVICE=http://localhost:3003
```

### 3. Permission Configuration

Add CMS permissions to your IIRM role system:

```sql
-- Add CMS permissions to your lookup tables
INSERT INTO lookups (look_up_type, look_up_key, look_up_value) 
VALUES 
  ('PERMISSION', 'CONTENT_MANAGEMENT', 'Content Management'),
  ('PERMISSION', 'CMS_ACCESS', 'CMS Access');

-- Grant permissions to appropriate roles
INSERT INTO user_role_permissions (role_id, permission_key) 
VALUES 
  (1, 'CONTENT_MANAGEMENT'),  -- Admin role
  (2, 'CMS_ACCESS');          -- Content Manager role
```

## Testing

### Automated Testing

Run the provided test script:

```bash
# Make executable (if not already)
chmod +x apps/services/strapi-cms-service/test-sso-complete.sh

# Run tests
./apps/services/strapi-cms-service/test-sso-complete.sh
```

### Manual Testing

1. **Login to iwork**: Authenticate as a user with CMS permissions
2. **Find Button**: Navigate to a page with the "Open Strapi" button
3. **Click Button**: Click the button and verify new tab opens
4. **Verify Access**: Confirm you're automatically logged into Strapi admin
5. **Test Content**: Try creating/editing content in Strapi

## Security Features

### Token Security
- Admin tokens expire in 24 hours
- Secure cookie transmission with HttpOnly and SameSite flags
- Token validation on every admin request
- Automatic token cleanup after use

### Permission Control
- Role-based access control (RBAC)
- Permission validation at multiple levels
- Real-time permission refresh from IIRM database
- Graceful degradation for unauthorized access

### Session Management
- Automatic session creation in Strapi admin
- Session cleanup on logout
- Token refresh mechanism
- Cross-service session validation

## Troubleshooting

### Common Issues

#### 1. "No IIRM authentication token found"
**Solution**: Ensure user is logged into iwork and token exists in localStorage

#### 2. "User does not have admin panel access"
**Solution**: Verify user has required permissions in IIRM database

#### 3. "Strapi authentication failed" 
**Solution**: Check JWT_SECRET configuration matches between services

#### 4. Admin panel doesn't auto-login
**Solution**: Verify middleware is registered and SSO parameters are passed

### Debug Steps

1. **Check Browser Console**: Look for JavaScript errors in browser dev tools
2. **Verify Network Requests**: Check API calls to `/auth-integration/admin-access`
3. **Review Server Logs**: Check Strapi and auth-service logs for errors
4. **Test Tokens**: Verify JWT tokens are valid using online JWT decoders
5. **Check Permissions**: Confirm user has required permissions in database

## API Reference

### Admin Access Endpoint

**POST** `/api/auth-integration/admin-access`

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "redirectTo": "/admin/content-manager"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "adminToken": "admin_jwt_token_here",
    "user": {
      "id": 123,
      "email": "user@example.com",
      "firstname": "John",
      "lastname": "Doe",
      "isActive": true,
      "roles": [...]
    },
    "redirectTo": "/admin",
    "expiresAt": "2026-02-19T10:00:00Z"
  }
}
```

## Configuration Options

### StrapiAccessButton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `string` | `'contained'` | Button variant (contained, outlined, text) |
| `size` | `string` | `'medium'` | Button size (small, medium, large) |
| `buttonText` | `string` | `'Open Strapi CMS'` | Text displayed on button |
| `tooltip` | `string` | Auto-generated | Tooltip text |
| `requiredPermissions` | `string[]` | `['CONTENT_MANAGEMENT']` | Required permissions |
| `options` | `StrapiSsoOptions` | `{ openInNewTab: true }` | SSO configuration |
| `onSuccess` | `() => void` | `undefined` | Success callback |
| `onError` | `(error: Error) => void` | `undefined` | Error callback |

### SSO Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `openInNewTab` | `boolean` | `true` | Whether to open admin panel in new tab |
| `redirectUrl` | `string` | `'/admin'` | URL to redirect to within admin panel |

## Next Steps

1. **Deploy Changes**: Deploy updated frontend and backend code
2. **User Training**: Train content managers on using the new feature
3. **Monitor Usage**: Set up logging to track SSO usage and errors
4. **Feedback Loop**: Collect user feedback and iterate on UX
5. **Security Review**: Conduct security audit of SSO implementation

## Support

For issues or questions:

1. Check the troubleshooting guide above
2. Review existing SSO documentation in `SSO_INTEGRATION_GUIDE.md`
3. Run the test script to verify integration health  
4. Contact the development team with specific error messages

---

**Implementation Status**: ✅ Complete and Ready for Testing
**Last Updated**: February 18, 2026
**Version**: 1.0.0