# Strapi CMS JWT Authentication Implementation Guide

## Overview

This document provides comprehensive implementation steps for securing Strapi CMS with JWT-based authentication that differentiates between iwork users and IBP users.

### Authentication Flow

1. **iwork users**: Full CRUD access to all content types
2. **IBP users** (userTypeKey = `USER_TYPE_COMPANY_EMPLOYEE`): Read-only access to all content types

## Implementation Steps

### 1. Authentication Service Integration

#### Modified Files:
- `/apps/services/strapi-cms-service/src/api/auth-integration/services/auth-integration.ts`

#### Key Changes Made:

**Enhanced User Type Detection:**
```typescript
// Added user type detection in processAuthServiceResponse
const isIbpUser = userData.userTypeKey === 'USER_TYPE_COMPANY_EMPLOYEE';
return {
    success: true,
    user: {
        ...userData,
        userTypeKey: userData.userTypeKey,
        isIbpUser
    },
    strapiPermissions: isIbpUser ? 
        this.mapIbpUserToStrapiPermissions(userData) : 
        this.mapIworkUserToStrapiPermissions(userData),
    token: strapiToken
};
```

**User Type-Specific Permission Mapping:**
```typescript
// iwork users get full CRUD permissions
mapIworkUserToStrapiPermissions(userData: any) {
    const permissions = userData.permissions || [];
    const role = userData.roleName?.toLowerCase();
    
    return {
        contentTypes: {
            "basic-faq": this.getFullAccessPermissions(role),
            "dashboard-banner": this.getFullAccessPermissions(role),
            "dashboard-content": this.getFullAccessPermissions(role),
            "hello-world": this.getFullAccessPermissions(role)
        },
        admin: {
            canAccessAdmin: this.determineAdminAccess(permissions, role),
            canManageUsers: permissions.includes("USER_MANAGEMENT"),
            canManageContent: true
        }
    };
}

// IBP users get read-only permissions
mapIbpUserToStrapiPermissions(userData: any) {
    return {
        contentTypes: {
            "basic-faq": this.getReadOnlyPermissions(),
            "dashboard-banner": this.getReadOnlyPermissions(),
            "dashboard-content": this.getReadOnlyPermissions(),
            "hello-world": this.getReadOnlyPermissions()
        },
        admin: {
            canAccessAdmin: false,
            canManageUsers: false,
            canManageContent: false
        }
    };
}
```

### 2. Removed Obsolete Code

#### Deleted Methods:
- `mapAuthServiceToStrapiPermissions()` - Replaced with user type-specific methods
- `getContentTypePermissions()` - Replaced with `getFullAccessPermissions()` and `getReadOnlyPermissions()`
- `hasAdminAccess()` - Replaced with `determineAdminAccess()`
- `mapRolesToStrapiPermissions()` - No longer needed with enhanced user type detection

#### Files to Remove:
- `enable-public-access.ts` - Obsolete public access setup script

### 3. Environment Configuration

#### Backend (.env.dev):
```env
# Auth Service Configuration
AUTH_SERVICE_URL=http://localhost:3003
IBP_SERVICE_URL=http://localhost:3025

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
ADMIN_JWT_SECRET=your-admin-jwt-secret
```

#### Frontend (.env.serve.development):
```env
# API Gateway URLs
VITE_API_BASE_URL=http://localhost:3000
VITE_CMS_API_URL=http://localhost:3000/cms
```

### 4. API Endpoints

#### Authentication Endpoints:
- `POST /api/auth-integration/authenticate` - Main SSO authentication endpoint
- `POST /api/auth-integration/validate-token` - Token validation endpoint

#### Usage Examples:

**iwork User Authentication:**
```bash
curl -X POST http://localhost:4321/api/auth-integration/authenticate \
  -H "Content-Type: application/json" \
  -d '{"token": "jwt-token-from-iwork-login"}'
```

**IBP User Authentication:**
```bash
curl -X POST http://localhost:4321/api/auth-integration/authenticate \
  -H "Content-Type: application/json" \
  -d '{"token": "jwt-token-from-ibp-login"}'
```

### 5. Testing the Implementation

#### Test Scripts Available:
- `test-sso-integration.sh` - Comprehensive SSO integration testing
- `test-real-sso.sh` - Real user credential testing

#### Manual Testing Steps:

1. **Start Services:**
   ```bash
   # Start auth-service (port 3003)
   npx nx serve auth-service
   
   # Start ibp-service (port 3025) 
   npx nx serve ibp-service
   
   # Start strapi-cms-service (port 4321)
   npx nx serve strapi-cms-service
   ```

2. **Test iwork User Access:**
   ```bash
   # Login to iwork
   curl -X POST http://localhost:3003/login \
     -H "Content-Type: application/json" \
     -d '{"userName": "your-username", "password": "your-password"}'
   
   # Use token for Strapi authentication
   curl -X POST http://localhost:4321/api/auth-integration/authenticate \
     -H "Content-Type: application/json" \
     -d '{"token": "access-token-from-login"}'
   ```

3. **Test IBP User Access:**
   ```bash
   # Login to IBP
   curl -X POST http://localhost:3025/company-employee/login \
     -H "Content-Type: application/json" \
     -d '{"userName": "ibp-username", "password": "password"}'
   
   # Use token for Strapi authentication
   curl -X POST http://localhost:4321/api/auth-integration/authenticate \
     -H "Content-Type: application/json" \
     -d '{"token": "access-token-from-ibp-login"}'
   ```

### 6. Verification Checklist

#### ✅ Implementation Completeness:
- [ ] User type detection based on `userTypeKey = USER_TYPE_COMPANY_EMPLOYEE`
- [ ] iwork users receive full CRUD permissions
- [ ] IBP users receive read-only permissions
- [ ] Obsolete public access methods removed
- [ ] JWT token validation working for both services
- [ ] Error handling and fallback mechanisms in place

#### ✅ Security Verification:
- [ ] Public access disabled
- [ ] JWT tokens required for all API access
- [ ] Permission-based content access enforced
- [ ] Admin access restricted appropriately
- [ ] User type validation working correctly

#### ✅ Integration Testing:
- [ ] iwork login → Strapi authentication working
- [ ] IBP login → Strapi authentication working
- [ ] Permission differentiation working correctly
- [ ] Token validation endpoints responding properly
- [ ] Error scenarios handled gracefully

## Security Model Summary

### iwork Users:
- **Access Level**: Full CRUD (Create, Read, Update, Delete)
- **Content Types**: All content types accessible
- **Admin Access**: Based on user role and permissions
- **User Management**: Available for users with `USER_MANAGEMENT` permission

### IBP Users (userTypeKey = `USER_TYPE_COMPANY_EMPLOYEE`):
- **Access Level**: Read-only
- **Content Types**: All content types viewable only
- **Admin Access**: Disabled
- **User Management**: Disabled

## Next Steps

1. **Deploy to Development Environment**
2. **Run Comprehensive Integration Tests**
3. **Update Frontend Applications** to use JWT authentication
4. **Monitor Authentication Logs** for any issues
5. **Document API Usage** for frontend developers

## Troubleshooting

### Common Issues:

1. **Token Validation Failing:**
   - Check JWT_SECRET configuration
   - Verify token format and expiration
   - Ensure services are running on correct ports

2. **Permission Denied Errors:**
   - Verify user type detection logic
   - Check permission mapping functions
   - Ensure content types are configured correctly

3. **Service Communication Issues:**
   - Verify AUTH_SERVICE_URL and IBP_SERVICE_URL
   - Check network connectivity between services
   - Review service health endpoints

### Debug Commands:
```bash
# Check service health
curl http://localhost:3003/health  # auth-service
curl http://localhost:3025/health  # ibp-service  
curl http://localhost:4321/api/health  # strapi-cms-service

# Test token validation
curl -X POST http://localhost:4321/api/auth-integration/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token": "your-jwt-token"}'
```

## Contact

For implementation support or questions, contact the development team.