# IIRM-Strapi SSO Integration Guide

## Overview
This implementation provides seamless Single Sign-On (SSO) between IIRM iwork system and Strapi CMS using JWT tokens, auth-service integration, and role-based access control.

## Architecture
- **Auth Service**: `http://localhost:3003` - Handles user authentication and validation
- **Main Database**: `iirm` - Contains user authentication, roles, and permissions
- **Strapi Database**: `iirm_strapi` - Contains only CMS content data
- **Shared JWT Secret**: Used for token validation across both systems
- **Real-time Permission Mapping**: User permissions are fetched from auth-service in real-time

## Authentication Flow

### 1. User Authentication in iwork
```typescript
// User logs into iwork system via auth-service
POST /login
{
  "userName": "user@example.com",
  "password": "password"
}

// Receives response with JWT token
{
  "statusCode": 200,
  "message": "User logged in successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "user": { ... }
  }
}
```

### 2. Strapi Authentication
```typescript
// Frontend sends iwork JWT token to Strapi
POST /api/auth-integration/authenticate
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Strapi validates token via auth-service and returns Strapi-specific token
{
  "success": true,
  "statusCode": 200,
  "message": "Authentication successful",
  "data": {
    "strapiToken": "strapi_specific_token_here",
    "user": {
      "id": 123,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "orgId": 456,
      "permissions": {...},
      "role": { "name": "content_manager" }
    },
    "expiresAt": "2026-02-13T10:00:00Z"
  }
}
```

### 3. Using Strapi APIs
```typescript
// Use the Strapi token for subsequent API calls
GET /api/dashboard-contents
Authorization: Bearer strapi_specific_token_here
```

## Auth Service Integration

The SSO system integrates directly with your existing auth-service endpoints:

### Auth Service Endpoints Used:
- **GET /user-details** - Validates tokens and retrieves user information
- **Headers Required**: 
  - `Authorization: Bearer {token}`
  - `userid: {userId}`
  - `Content-Type: application/json`

### Auth Service Response Format:
```typescript
{
  "statusCode": 200,
  "message": "User details retrieved successfully",
  "data": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "orgId": 456,
    "role": {
      "id": 1,
      "name": "content_manager"
    },
    "permissions": ["CONTENT_MANAGEMENT", "CONTENT_EDIT"],
    "isActive": true
  }
}
```

## API Endpoints

### POST /api/auth-integration/authenticate
Authenticate user using iwork JWT token and get Strapi API token.

**Request:**
```json
{
  "token": "iwork_jwt_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "strapiToken": "strapi_api_token",
    "user": {
      "id": 123,
      "orgId": 456,
      "permissions": {
        "contentTypes": {
          "dashboard-content": {
            "create": true,
            "read": true,
            "update": true,
            "delete": false,
            "publish": true
          }
        }
      },
      "role": { "name": "content_manager" }
    },
    "expiresAt": "2026-02-13T10:00:00Z"
  }
}
```

### POST /api/auth-integration/validate-token
Validate JWT token without authentication.

**Request:**
```json
{
  "token": "jwt_token_to_validate"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "data": {
    "userId": 123,
    "orgId": 456,
    "iat": 1708617600,
    "exp": 1708704000
  }
}
```

### GET /api/auth-integration/user-permissions/:userId
Get user permissions from main database (requires authentication).

### POST /api/auth-integration/refresh-permissions
Refresh user permissions from main database (requires authentication).

## Role Mapping

The system maps IIRM roles to Strapi permissions:

| IIRM Role | Strapi Permissions |
|-----------|-------------------|
| `admin`, `super_admin` | Full access (CRUD + Publish) |
| `content_manager` | Create, Read, Update, Publish |
| `editor` | Read, Update |
| `viewer` | Read only |

## Permission Structure

```typescript
interface StrapiPermissions {
  contentTypes: {
    [contentType: string]: {
      create: boolean;
      read: boolean;
      update: boolean;
      delete: boolean;
      publish: boolean;
    };
  };
  admin: {
    canAccessAdmin: boolean;
    canManageUsers: boolean;
    canManageContent: boolean;
  };
}
```

## Frontend Integration

### React/Angular Integration
```typescript
// 1. Get iwork token from localStorage/sessionStorage
const iworkToken = localStorage.getItem('authToken');

// 2. Authenticate with Strapi
const response = await fetch('/api/auth-integration/authenticate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: iworkToken })
});

const { data } = await response.json();
const strapiToken = data.strapiToken;

// 3. Store Strapi token for CMS API calls
localStorage.setItem('strapiToken', strapiToken);

// 4. Use Strapi token for CMS operations
const cmsData = await fetch('/api/dashboard-contents', {
  headers: { 'Authorization': `Bearer ${strapiToken}` }
});
```

### Automatic Token Refresh
```typescript
// Set up token refresh before expiration
const tokenExpiry = new Date(data.expiresAt);
const refreshTime = tokenExpiry.getTime() - Date.now() - 300000; // 5 minutes before expiry

setTimeout(async () => {
  // Refresh permissions or re-authenticate
  const newToken = await refreshStrapiToken();
  localStorage.setItem('strapiToken', newToken);
}, refreshTime);
```

## Security Features

1. **Token Validation**: All tokens are validated using shared JWT secret
2. **Real-time Permissions**: Permissions are fetched from main database on each authentication
3. **Role-based Access**: Content access is controlled by user roles and permissions
4. **Token Expiration**: Strapi tokens expire in 24 hours for security
5. **No User Data Duplication**: User data remains only in main database

## Environment Variables

Required environment variables in `.env.dev`:

```bash
# Strapi Database (Content only)
STRAPI_DB_HOST=db.divami.com
STRAPI_DB_PORT=5432
STRAPI_DB_NAME=iirm_strapi
STRAPI_DB_USER=iirm_strapi
STRAPI_DB_PASSWORD=EZksDBWPVVKqJTTF

# Auth Service Integration
URL_AUTH_SERVICE=http://localhost:3003

# JWT Configuration (shared with auth-service)
JWT_SECRET=r97lUhAaTL
ADMIN_JWT_SECRET=r97lUhAaTL
API_TOKEN_SALT=iirm-api-token-salt-2026
TRANSFER_TOKEN_SALT=iirm-transfer-token-salt-2026

# Optional: Main IIRM Database (for fallback scenarios)
IIRM_DB_HOST=db.divami.com
IIRM_DB_PORT=5432
IIRM_DB_NAME=iirm
IIRM_DB_USER=iirm
IIRM_DB_PASSWORD=5jp1I3KyBpwCB8n
```

## Database Schema Requirements

The main database should have these tables with user role/permission information:

```sql
-- Users table
users (id, email, first_name, last_name, is_active, org_id)

-- Organizations table  
organizations (id, name)

-- Roles table
roles (id, name, hierarchy_level)

-- User roles mapping
user_roles (user_id, role_id)

-- Permissions table
permissions (id, name)

-- Role permissions mapping
role_permissions (role_id, permission_id)

-- Modules table
modules (id, name)

-- Permission modules mapping
permission_modules (permission_id, module_id)
```

## Testing

### Test Complete Authentication Flow
```bash
# 1. First, login via auth-service to get iwork token
curl -X POST http://localhost:3003/login \
  -H "Content-Type: application/json" \
  -d '{"userName": "user@example.com", "password": "password"}'

# Extract accessToken from response, then use it for Strapi authentication
curl -X POST http://localhost:4321/api/auth-integration/authenticate \
  -H "Content-Type: application/json" \
  -d '{"token": "iwork_access_token_here"}'

# Test token validation
curl -X POST http://localhost:4321/api/auth-integration/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token": "iwork_access_token_here"}'

# Test protected endpoint with Strapi token
curl -X GET http://localhost:4321/api/dashboard-contents \
  -H "Authorization: Bearer your_strapi_token_here"
```

### Test User Details from Auth Service
```bash
# Test direct auth-service user-details endpoint (used internally by Strapi)
curl -X GET http://localhost:3003/user-details \
  -H "Authorization: Bearer iwork_access_token" \
  -H "userid: 123" \
  -H "Content-Type: application/json"
```

## Troubleshooting

### Common Issues

1. **JWT Verification Failed**
   - Check JWT_SECRET matches between systems
   - Verify token hasn't expired
   - Ensure token format is correct

2. **Database Connection Failed**
   - Verify IIRM_DB_* environment variables
   - Check database connectivity
   - Ensure user has proper permissions

3. **Permission Denied**
   - Verify user exists in main database
   - Check user roles and permissions
   - Ensure user is active

### Debug Mode
Enable debug logging in Strapi configuration:
```typescript
// config/logger.ts
export default {
  level: 'debug',
  transports: [
    {
      type: 'console',
      options: {
        level: 'debug'
      }
    }
  ]
};
```

## Performance Considerations

1. **Connection Pooling**: Main database connections use connection pooling (max 2 connections)
2. **Token Caching**: Consider implementing Redis cache for frequently accessed permissions
3. **Database Queries**: Optimized queries with proper indexes on user/role/permission tables
4. **Token Expiration**: 24-hour token expiration balances security and performance

## Deployment

1. Ensure all environment variables are set
2. Run database migrations for both databases
3. Test SSO flow in staging environment
4. Monitor logs during initial deployment
5. Set up health checks for both database connections