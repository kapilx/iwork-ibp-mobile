# Strapi Access Control List (ACL) Implementation Guide

## Overview
This implementation adds ACL-based access control for Strapi CMS, allowing fine-grained permission management through the auth service.

## Changes Made

### 1. Database Schema (SQL Script)
**File:** `strapi-access-acl.sql`

Creates:
- **Category:** `STRAPI_ACCESS` (id: 169, application_scope: iWork)
- **Actions:**
  - `STRAPI_ADMIN_001` (id: 235) - Full administrative access to Strapi
  - `STRAPI_READ_001` (id: 236) - Read-only access to Strapi
- **Mappings:** Category-Action mappings and role assignments
- **API Mappings:** strapi-admin-access endpoint with POST/GET methods

### 2. Backend Code Changes

#### A. Service Layer (`src/api/auth-integration/services/auth-integration.ts`)
**Modified Function:** `getUserPermissionsFromAuthService()`

**Flow:**
1. Fetches user details from auth service
2. **NEW:** Fetches ACL permissions from `/access-control-list/permissions`
3. **NEW:** Checks for `STRAPI_ACCESS` category permissions
4. **NEW:** Validates `STRAPI_ADMIN_001` or `STRAPI_READ_001` permissions
5. Maps ACL permissions to Strapi roles:
   - `STRAPI_ADMIN_001` → Super Admin role (full access)
   - `STRAPI_READ_001` → Editor role (read-only)
   - No permission → Access denied (throws error)
6. Returns user object with ACL data

**Key Code:**
```typescript
// Fetch ACL permissions
const aclResponse = await axios.get(`${authServiceUrl}/access-control-list/permissions`, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

// Check Strapi access permissions
const strapiAccessPermissions = aclPermissions?.access?.iWork?.STRAPI_ACCESS || {};
const hasStrapiAdmin = strapiAccessPermissions.STRAPI_ADMIN_001 === true;
const hasStrapiRead = strapiAccessPermissions.STRAPI_READ_001 === true;

// Deny access if neither permission exists
if (!hasStrapiAdmin && !hasStrapiRead) {
    throw new Error('Access denied: User does not have Strapi access permissions');
}
```

**Modified Function:** `checkAdminPermission()`

**Flow:**
1. **NEW:** First checks `aclData.hasStrapiAdmin` flag
2. If `STRAPI_ADMIN_001` = true → Grant admin access
3. If only `STRAPI_READ_001` = true → Deny admin access
4. Fallback to legacy permissions array check

#### B. Controller Layer (`src/api/auth-integration/controllers/auth-integration.ts`)
**Modified Endpoint:** `adminAccess()`

**Changes:**
- Updated to pass full `userPermissions` object to `checkAdminPermission()` instead of just the permissions array
- Logs ACL data for debugging

### 3. Role Mapping

| ACL Permission | Strapi Role | Access Level |
|---------------|-------------|--------------|
| `STRAPI_ADMIN_001` | Super Admin | Full administrative access (can manage content, users, settings) |
| `STRAPI_READ_001` | Editor | Read-only access (cannot modify) |
| None | Access Denied | Cannot access Strapi at all |

## Implementation Steps

### Step 1: Execute SQL Script
```bash
cd apps/services/strapi-cms-service

# Execute the SQL script on your database
psql "postgresql://iirm_strapi:EZksDBWPVVKqJTTF@db.divami.com:5432/iirm_strapi" -f strapi-access-acl.sql
```

**Expected Output:**
```
INSERT 0 1   -- Category inserted
INSERT 0 2   -- Actions inserted
INSERT 0 2   -- Category-Action mappings
INSERT 0 2   -- Role mappings
INSERT 0 2   -- API mappings
```

**Verification Query:**
```sql
SELECT 
    c.name as category_name,
    c.category_key,
    a.name as action_name,
    a.action_key
FROM public.acl_categories c
JOIN public.acl_category_action_map cam ON cam.acl_category_id = c.id
JOIN public.acl_actions a ON a.id = cam.acl_action_id
WHERE c.category_key = 'STRAPI_ACCESS'
ORDER BY a.action_key;
```

### Step 2: Restart Strapi Service
```bash
# Kill existing Strapi process
pkill -f strapi

# Restart Strapi
cd apps/services/strapi-cms-service
npm run develop
```

### Step 3: Verify ACL API Response

Test the ACL API to ensure the new category is returned:

```bash
curl -X GET "http://localhost:3000/iirm/auth-service/access-control-list/permissions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (excerpt):**
```json
{
    "status": 200,
    "data": {
        "roleId": 3,
        "roleName": "ISG Executive",
        "access": {
            "iWork": {
                "STRAPI_ACCESS": {
                    "parent": "STRAPI_ACCESS",
                    "STRAPI_ADMIN_001": true,
                    "STRAPI_READ_001": false
                }
            }
        }
    }
}
```

### Step 4: Test Strapi Login

#### Test Case 1: User with STRAPI_ADMIN_001
```bash
curl -X POST "http://localhost:4321/api/auth-integration/admin-access" \
  -H "Content-Type: application/json" \
  -d '{"token": "USER_JWT_TOKEN_WITH_ADMIN", "redirectTo": "/admin"}'
```

**Expected:**
- Login successful
- User assigned "Super Admin" role
- Full access to Strapi admin panel

#### Test Case 2: User with STRAPI_READ_001 only
```bash
curl -X POST "http://localhost:4321/api/auth-integration/admin-access" \
  -H "Content-Type: application/json" \
  -d '{"token": "USER_JWT_TOKEN_WITH_READ", "redirectTo": "/admin"}'
```

**Expected:**
- Login successful
- User assigned "Editor" role
- Read-only access (cannot create/edit/delete)

#### Test Case 3: User without Strapi permissions
```bash
curl -X POST "http://localhost:4321/api/auth-integration/admin-access" \
  -H "Content-Type: application/json" \
  -d '{"token": "USER_JWT_TOKEN_NO_STRAPI", "redirectTo": "/admin"}'
```

**Expected:**
- HTTP 403 Forbidden
- Error message: "Access denied: User does not have Strapi access permissions"

## Frontend Button Visibility

### Implementation Logic

The "Strapi Admin" button should only be visible to users with `STRAPI_ADMIN_001` permission.

### Option 1: Check ACL Permissions API

```typescript
// In your frontend component (React/Angular)
async function checkStrapiAccess() {
    try {
        const response = await fetch(
            'http://localhost:3000/iirm/auth-service/access-control-list/permissions',
            {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const data = await response.json();
        const strapiAccess = data.data?.access?.iWork?.STRAPI_ACCESS || {};
        
        // Show button only if user has STRAPI_ADMIN_001
        const showStrapiButton = strapiAccess.STRAPI_ADMIN_001 === true;
        
        return showStrapiButton;
    } catch (error) {
        console.error('Failed to check Strapi access:', error);
        return false; // Hide button on error
    }
}
```

### Option 2: Include in User Session

Store ACL permissions in user session after login:

```typescript
// After login, store permissions
const aclPermissions = await fetchACLPermissions(token);
sessionStorage.setItem('strapiAccess', JSON.stringify({
    hasAdmin: aclPermissions.iWork?.STRAPI_ACCESS?.STRAPI_ADMIN_001 || false,
    hasRead: aclPermissions.iWork?.STRAPI_ACCESS?.STRAPI_READ_001 || false
}));

// In your component
const strapiAccess = JSON.parse(sessionStorage.getItem('strapiAccess') || '{}');
const showStrapiButton = strapiAccess.hasAdmin === true;
```

### React Example

```tsx
import React, { useState, useEffect } from 'react';

function StrapiAccessButton() {
    const [hasAccess, setHasAccess] = useState(false);
    
    useEffect(() => {
        checkStrapiAccess().then(setHasAccess);
    }, []);
    
    if (!hasAccess) {
        return null; // Hide button if no access
    }
    
    return (
        <button onClick={() => window.location.href = '/strapi-admin'}>
            Open Strapi CMS
        </button>
    );
}
```

## Logging & Debugging

### Key Log Points

1. **ACL Permissions Fetch:**
```
[ACL-PERMISSIONS-FETCH] Successfully fetched ACL permissions: {
    userId: 2,
    roleId: 3,
    roleName: 'ISG Executive',
    hasStrapiAdmin: true,
    hasStrapiRead: false
}
```

2. **Role Assignment:**
```
[ROLE-ASSIGNMENT] User granted Super Admin role (STRAPI_ADMIN_001) {
    userId: 2,
    aclRoleName: 'ISG Executive'
}
```

3. **Access Denied:**
```
[ACL-ACCESS-DENIED] User does not have Strapi access permissions: {
    userId: 5,
    roleId: 10,
    roleName: 'Sales Rep',
    message: 'Neither STRAPI_ADMIN_001 nor STRAPI_READ_001 permission found'
}
```

## API-Level Permission Enforcement

The check happens at two levels:

### 1. Login/Entry Point (`adminAccess` endpoint)
- User must have `STRAPI_ADMIN_001` or `STRAPI_READ_001` to even log in
- If permission missing → HTTP 403 Forbidden before creating session

### 2. Role-Based Access Control (Strapi Built-in)
- Once logged in, Strapi's RBAC controls what they can do
- Super Admin → Full access
- Editor → Read-only access

## Troubleshooting

### Issue 1: User cannot access Strapi
**Check:**
1. Verify SQL script execution: `SELECT * FROM acl_categories WHERE category_key = 'STRAPI_ACCESS'`
2. Verify user has permission assigned in role_acl_category_action_map
3. Check ACL API response includes STRAPI_ACCESS category
4. Check Strapi logs for `[ACL-ACCESS-DENIED]` messages

### Issue 2: User gets Super Admin when they should get Editor
**Check:**
1. Verify ACL API returns correct permissions
2. Check role_acl_category_action_map for duplicate entries
3. Verify permission assignment logic in getUserPermissionsFromAuthService()

### Issue 3: ACL API call failing
**Check:**
1. Auth service URL configuration: `process.env.AUTH_SERVICE_URL`
2. JWT token validity
3. Network connectivity to auth service
4. Auth service logs for errors

## Security Considerations

1. **Always check permissions server-side** - Frontend button hiding is for UX only
2. **Token validation** - JWT token validated before ACL check
3. **Fail-safe access denial** - If ACL fetch fails, access is denied (not granted)
4. **Audit logging** - All access attempts logged with user ID and timestamp
5. **Role hierarchy** - Super Admin > Editor > No Access

## Future Enhancements

1. **Additional Roles:** Add more granular roles (e.g., Content Manager, Content Viewer)
2. **Collection-Level Permissions:** Control access to specific Strapi collections
3. **Time-Based Access:** Temporary Strapi access for specific users
4. **Audit Dashboard:** View who accessed Strapi and when
5. **Permission Caching:** Cache ACL permissions to reduce API calls

## Summary

✅ **SQL Script:** Creates STRAPI_ACCESS category with two actions
✅ **Backend Integration:** Fetches and validates ACL permissions
✅ **Role Mapping:** Maps ACL permissions to Strapi roles
✅ **Access Control:** Enforces permissions at login and API level
✅ **Frontend Visibility:** Button visibility controlled by STRAPI_ADMIN_001 permission
✅ **Audit Logging:** All access attempts logged
✅ **Error Handling:** Failed ACL checks deny access

**Time Estimate:** 10-15 minutes to execute and verify
