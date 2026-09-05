# Strapi CMS Service - Testing Guide

## Configuration Summary

### 1. Database
- **Type**: PostgreSQL (configured in `config/database.ts`)
- **Environment Variables**:
  - `DB_HOST`: Database host (default: from .env.dev)
  - `DB_PORT`: Database port (default: 5432)
  - `DB_NAME`: Database name (default: from .env.dev)
  - `DB_USER`: Database username (default: from .env.dev)
  - `DB_PASSWORD`: Database password (default: from .env.dev)

### 2. Node Modules
- Uses parent directory `node_modules` (no local installation)
- All dependencies are installed at workspace root

### 3. API Gateway Integration
- **Base URL**: `http://localhost:3000` (API Gateway)
- **CMS Routes**:
  - Admin Panel: `http://localhost:3000/cms/admin`
  - API Endpoint: `http://localhost:3000/cms/api`
  - Hello World API: `http://localhost:3000/cms/api/hello-worlds`

- **Direct Service Access** (for debugging):
  - Admin Panel: `http://localhost:3024/cms/admin`
  - API Endpoint: `http://localhost:3024/cms/api`

### 4. Service Registration
- Automatically registers with Service Registry on startup
- Re-registers every 30 seconds to maintain availability

## Testing Steps

### Step 1: Ensure Prerequisites

1. **PostgreSQL Database** is running and accessible
2. **Service Registry** is running on port 3002
3. **API Gateway** is running on port 3000

```bash
# Start Service Registry
npx nx serve service-registry

# Start API Gateway (in another terminal)
npx nx serve api-gateway
```

### Step 2: Start Strapi CMS Service

```bash
# From repository root
NODE_ENV=dev npx nx serve strapi-cms-service
```

Expected output:
```
✅ Loaded environment from: /path/to/environments/.env.dev
🚀 Starting Strapi CMS Service
📁 Environment: development
🔧 Port: 3024
🏠 Host: 0.0.0.0
...
✅ Strapi CMS Service has bootstrapped successfully!
✅ strapi-cms-service registered successfully with service registry
```

### Step 3: Verify Service Registration

```bash
# Check if service is registered
curl http://localhost:3002/iirm/service-registry/services
```

You should see `strapi-cms-service` in the list.

### Step 4: Access Admin Panel

**Via API Gateway** (Recommended):
```
http://localhost:3000/cms/admin
```

**Direct Access** (Debugging):
```
http://localhost:3024/cms/admin
```

1. Create your first administrator account
2. Login to the admin panel

### Step 5: Test Hello World API

**Create a Hello World entry:**

```bash
# Via API Gateway
curl -X POST http://localhost:3000/cms/api/hello-worlds \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "title": "My First Entry",
      "message": "Hello from Strapi CMS!",
      "isActive": true
    }
  }'
```

**Get all Hello World entries:**

```bash
# Via API Gateway
curl http://localhost:3000/cms/api/hello-worlds
```

**Direct service access:**

```bash
# Direct to service (for debugging)
curl http://localhost:3024/cms/api/hello-worlds
```

### Step 6: Verify Database Connection

Check that entries are being saved to PostgreSQL:

```sql
-- Connect to your PostgreSQL database
\c <database_name>

-- List Strapi tables
\dt

-- Check hello_worlds data
SELECT * FROM hello_worlds;
```

## Troubleshooting

### Issue: Service won't start

**Check 1: Database Connection**
```bash
# Verify PostgreSQL is running
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME> -c "SELECT 1"
```

**Check 2: Environment Variables**
```bash
# Verify .env.dev has all required variables
cat environments/.env.dev | grep -E "DB_|STRAPI"
```

### Issue: Cannot access via API Gateway

**Check 1: Service Registry**
```bash
# Verify service is registered
curl http://localhost:3002/iirm/service-registry/services | grep strapi
```

**Check 2: API Gateway Routing**
```bash
# Check API Gateway logs for routing errors
# Look for "cmsProxyRequest" in gateway logs
```

### Issue: CORS errors

**Solution**: The CORS is configured in `config/middlewares.ts` to accept requests from `localhost:3000` (API Gateway). If you're accessing from a different origin, update the CORS configuration.

### Issue: Admin panel shows blank page

**Solution**: Ensure `STRAPI_PUBLIC_URL` in `.env.dev` is set to `http://localhost:3000` (API Gateway URL).

## Environment Variables Reference

Add these to `environments/.env.dev`:

```bash
# Strapi CMS Service
PORT_STRAPI_CMS_SERVICE=3024
HOST_STRAPI_CMS_SERVICE=0.0.0.0
URL_STRAPI_CMS_SERVICE=http://localhost:3024
STRAPI_PUBLIC_URL=http://localhost:3000
APP_KEYS=strapiKey1,strapiKey2,strapiKey3,strapiKey4
ADMIN_JWT_SECRET=defaultAdminSecret123456789
API_TOKEN_SALT=defaultApiTokenSalt123456789
TRANSFER_TOKEN_SALT=defaultTransferTokenSalt123456789

# Service Registry
URL_SERVICE_REGISTRY=http://localhost:3002
```

## Next Steps

1. **Create more content types** in Strapi admin panel
2. **Configure permissions** in Settings > Users & Permissions
3. **Add API tokens** for secure API access
4. **Configure media upload** settings
5. **Set up content versioning** if needed

## Useful Commands

```bash
# Build Strapi admin panel
npm run build --workspace=@insurance-wellness-hub/strapi-cms-service

# Generate TypeScript types
npm run ts:generate-types --workspace=@insurance-wellness-hub/strapi-cms-service

# Clean build artifacts
rm -rf apps/services/strapi-cms-service/{dist,.cache,.tmp,build}

# View service logs
# (Service logs will appear in the terminal where you started it)
```
