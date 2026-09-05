# Strapi CMS Service

A Strapi v5 CMS service integrated with the Insurance Wellness Hub microservices architecture.

## Features

- TypeScript support
- Strapi v5 latest version
- Hello World content type example
- Integration with API Gateway
- Shared node_modules from monorepo
- Environment configuration from parent folder

## Development

```bash
# Serve the service
nx serve strapi-cms-service

# Build the service
nx build strapi-cms-service
```

## Access Points

- Admin Panel: http://localhost:3024/cms/admin
- API: http://localhost:3024/cms/api
- Via API Gateway: http://localhost:3000/cms/api

## Content Types

### Hello World
A simple content type demonstrating Strapi functionality:
- title: string (required)
- message: text (required)
- isActive: boolean (default: true)
- createdBy: string

## Environment Variables

All environment variables are managed in `/environments/.env.dev`:

```
PORT_STRAPI_CMS_SERVICE=3024
HOST_STRAPI_CMS_SERVICE=0.0.0.0
APP_KEYS=key1,key2,key3,key4
ADMIN_JWT_SECRET=your-admin-secret
API_TOKEN_SALT=your-api-token-salt
TRANSFER_TOKEN_SALT=your-transfer-token-salt
```

## Environment Variables

### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT_STRAPI_CMS_SERVICE` | Port on which Strapi service runs | `4321` | Yes |
| `URL_STRAPI_CMS_SERVICE` | Full URL of the Strapi service | `http://localhost:4321` | Yes |
| `HOST_STRAPI_CMS_SERVICE` | Host address for Strapi server | `0.0.0.0` | No |
| `STRAPI_PUBLIC_URL` | Public-facing URL for building admin assets | `http://localhost:4321` | Yes |
| `STRAPI_PROXY_ENABLED` | Enable proxy support for reverse proxy/gateway | `false` | No |
| `URL_SERVICE_REGISTRY` | Service registry URL for registration | `http://localhost:3002` | Yes |
| `URL_API_GATEWAY` | API Gateway URL for proxy access | `http://localhost:3000` | No |

### Admin Panel Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ADMIN_PATH` | Path where admin panel is accessible | `/admin` | No |
| `SERVE_ADMIN` | Whether to serve the admin panel | `true` | No |
| `ADMIN_JWT_SECRET` | JWT secret for admin authentication | `defaultAdminSecret123` | Yes |
| `JWT_SECRET` | JWT secret for users-permissions plugin | `defaultJwtSecret123-ChangeInProduction` | Yes |
| `API_TOKEN_SALT` | Salt for API token generation | `defaultApiTokenSalt123` | Yes |
| `TRANSFER_TOKEN_SALT` | Salt for transfer token generation | `defaultTransferTokenSalt123` | Yes |
| `APP_KEYS` | Application keys for session encryption (comma-separated) | `[4 default keys]` | Yes |

### Database Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `STRAPI_DB_HOST` | PostgreSQL database host | `localhost` | Yes |
| `STRAPI_DB_PORT` | PostgreSQL database port | `5432` | Yes |
| `STRAPI_DB_NAME` | Database name | `strapi_cms` | Yes |
| `STRAPI_DB_USER` | Database username | `postgres` | Yes |
| `STRAPI_DB_PASSWORD` | Database password | `postgres` | Yes |
| `STRAPI_DB_SCHEMA` | Database schema | `public` | No |
| `STRAPI_DB_SSL` | Enable SSL for database connection | `false` | No |
| `STRAPI_DB_SSL_CA` | Path to SSL CA certificate file | - | No |
| `STRAPI_DATABASE_POOL_MIN` | Minimum database connection pool size | `2` | No |
| `STRAPI_DATABASE_POOL_MAX` | Maximum database connection pool size | `10` | No |
| `STRAPI_DATABASE_CONNECTION_TIMEOUT` | Database connection timeout (ms) | `60000` | No |

### Feature Flags

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `FLAG_NPS` | Enable NPS survey feature | `true` | No |
| `FLAG_PROMOTE_EE` | Enable Enterprise Edition promotion | `true` | No |
| `WEBHOOKS_POPULATE_RELATIONS` | Auto-populate relations in webhooks | `false` | No |

### Example Configuration

```bash
# Server
PORT_STRAPI_CMS_SERVICE=4321
URL_STRAPI_CMS_SERVICE=http://localhost:4321
HOST_STRAPI_CMS_SERVICE=0.0.0.0
STRAPI_PUBLIC_URL=http://localhost:4321
STRAPI_PROXY_ENABLED=false

# Service Discovery
URL_SERVICE_REGISTRY=http://localhost:3002
URL_API_GATEWAY=http://localhost:3000

# Admin Panel
ADMIN_PATH=/admin
SERVE_ADMIN=true
ADMIN_JWT_SECRET=your-secure-admin-secret-here
JWT_SECRET=your-secure-jwt-secret-here
API_TOKEN_SALT=your-secure-api-token-salt-here
TRANSFER_TOKEN_SALT=your-secure-transfer-token-salt-here
APP_KEYS=key1,key2,key3,key4

# Database
STRAPI_DB_HOST=localhost
STRAPI_DB_PORT=5432
STRAPI_DB_NAME=strapi2
STRAPI_DB_USER=strapi
STRAPI_DB_PASSWORD=strapi_password
STRAPI_DB_SCHEMA=public
STRAPI_DB_SSL=false

# Connection Pool
STRAPI_DATABASE_POOL_MIN=2
STRAPI_DATABASE_POOL_MAX=10
STRAPI_DATABASE_CONNECTION_TIMEOUT=60000

# Feature Flags
FLAG_NPS=true
FLAG_PROMOTE_EE=true
WEBHOOKS_POPULATE_RELATIONS=false
```

### Notes

- For production deployments, all secrets (`ADMIN_JWT_SECRET`, `JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`, `APP_KEYS`) **must** be changed to secure values
- Generate secure secrets using: `node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"`
- When using API Gateway proxy, set `STRAPI_PUBLIC_URL` to the gateway URL and rebuild the admin panel
- SSL CA certificate path should be absolute if `STRAPI_DB_SSL` is enabled
