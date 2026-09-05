# Role Permission Logout - Testing Guide

## Overview
This implementation uses **Auth Versioning + Redis Cache + Event-Driven Invalidation** to automatically log out users when their roles or role permissions are modified.

## How It Works

### Step-by-Step Flow:
1. **User logs in** → JWT token includes `authVersion: 1` 
2. **Admin modifies user role** → Database trigger fires PostgreSQL notification
3. **Event listener catches notification** → Increments user's `authVersion` to `2` 
4. **User makes next request** → AuthGuard compares token version (1) vs current version (2)
5. **Version mismatch detected** → User gets `AUTH_VERSION_MISMATCH` error and is logged out
6. **Frontend handles error** → Automatically redirects user to login page

## Testing the Implementation

### Prerequisites
1. Run database migration: `AddAuthVersionToUsers1740007000000.ts`
2. Run database migration: `CreateRolePermissionTriggers1740008000000.ts`
3. Ensure Redis is running (for auth version caching)
4. Restart auth-service to load new services

### Test Case 1: User Role Change
```sql
-- 1. User logs in (note their auth_version)
SELECT auth_version FROM users WHERE id = 123;  -- Should be 1

-- 2. Admin adds role to user
INSERT INTO user_role (user_id, role_id) VALUES (123, 456);

-- 3. Check auth_version incremented  
SELECT auth_version FROM users WHERE id = 123;  -- Should be 2

-- 4. User's next API request will fail with AUTH_VERSION_MISMATCH
```

### Test Case 2: Role Permission Change  
```sql
-- 1. Multiple users have same role
SELECT u.id, u.auth_version FROM users u 
JOIN user_role ur ON u.id = ur.user_id 
WHERE ur.role_id = 456;  -- Note their auth_versions

-- 2. Admin changes role permissions
INSERT INTO role_acl_category_action_map (role_id, acl_category_action_id) 
VALUES (456, 789);

-- 3. Check all users' auth_versions incremented
SELECT u.id, u.auth_version FROM users u 
JOIN user_role ur ON u.id = ur.user_id 
WHERE ur.role_id = 456;  -- All should be incremented
```

### Frontend Testing
1. **Login as a user** → Note network tab shows JWT with authVersion
2. **Admin modifies user's role** (different browser/session)
3. **Original user makes API call** → Should see 401 error with `AUTH_VERSION_MISMATCH`
4. **User gets redirected to login** → Must re-authenticate with new permissions

## Manual Testing Steps

### Setup
```bash
# 1. Start services
npm run serve:auth-service
npm run serve:iwork

# 2. Check Redis connection
redis-cli ping

# 3. Check database triggers
\d+ user_role  -- Should show triggers
\d+ role_acl_category_action_map  -- Should show triggers
```

### Scenario A: Single User Role Change
1. **Login as Employee** (e.g., `employee@test.com`)
2. **Check current auth version:**
   ```sql
   SELECT id, email_id, auth_version FROM users WHERE email_id = 'employee@test.com';
   ```
3. **Admin adds role to employee:**
   ```sql
   INSERT INTO user_role (user_id, role_id) 
   VALUES ((SELECT id FROM users WHERE email_id = 'employee@test.com'), 2);
   ```
4. **Employee makes API request** → Should get logged out automatically
5. **Check logs** for auth version increment

### Scenario B: Mass Role Permission Change  
1. **Multiple users login** with same role
2. **Admin updates role permissions:**
   ```sql  
   INSERT INTO role_acl_category_action_map (role_id, acl_category_action_id)
   VALUES (2, 10);
   ```
3. **All affected users** should be logged out on next request
4. **Check bulk auth version update** in database

## Expected Log Messages

### Auth Version Service Logs
```
[INFO] Auth version incremented: userId=123, newVersion=2, reason=User role added: roleId=456
[INFO] Auth versions incremented for multiple users: userCount=5, reason=Role permission added: roleId=456, permissionId=789
```

### Auth Guard Logs
```
[WARN] Auth version mismatch: userId=123, tokenVersion=1, currentVersion=2
```

### Frontend Logs
```
[ERROR] AUTH_VERSION_MISMATCH: Your session was invalidated due to role or permission changes
[INFO] User redirected to login due to auth version mismatch
```

## Troubleshooting

### Issue: Auth version not incrementing
- Check database triggers are created: `\df notify_*`
- Check event listener is running: Look for "PostgreSQL notification listener initialized" 
- Check PostgreSQL notifications: `SELECT pg_notify('test', 'hello');`

### Issue: Users not getting logged out
- Check JWT contains authVersion field
- Check AuthGuard is calling AuthVersionService
- Check Redis is caching auth versions correctly

### Issue: Performance problems
- Check Redis connection and latency
- Monitor auth version cache hit rates
- Optimize database queries for user lookup

## Architecture Benefits

✅ **Immediate logout** - No polling, users logged out on next request  
✅ **Scalable** - Uses existing Redis infrastructure  
✅ **Event-driven** - Database triggers ensure no missed changes  
✅ **Performance optimized** - Redis caching reduces database load  
✅ **Simple and reliable** - Leverages tried-and-true auth versioning pattern  

## Production Considerations

1. **Monitor auth version cache performance**
2. **Set up alerts for high auth version increment rates** 
3. **Consider batching role changes** to reduce user interruption
4. **Add user notification system** for planned role changes
5. **Implement audit logging** for all forced logouts