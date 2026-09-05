# IBP Environment Setup for Multi-Tenant Config

## ✅ Fixed Issues

1. **Replaced `process.env` with `import.meta.env`** (Vite requirement)
2. **Created environment configuration files**
3. **Added TypeScript declarations for env variables**

## 📝 Environment Variables

### File: `.env.local` (Created)

```bash
# Config Service URL - for fetching company configuration
VITE_CONFIG_SERVICE_URL=http://localhost:3026

# API Base URL - for your backend API calls
VITE_API_BASE_URL=http://localhost:3000
```

**Important:**
- Vite requires env variables to be prefixed with `VITE_`
- `.env.local` is gitignored by default (safe for local development)
- For production, use `.env.production`

## 🔧 How to Configure

### For Local Development:

1. **Edit `.env.local`** with your local URLs:
   ```bash
   VITE_CONFIG_SERVICE_URL=http://localhost:3026
   VITE_API_BASE_URL=http://localhost:3000
   ```

2. **Restart your dev server** after changing env variables:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   npm run dev
   # or
   nx serve ibp
   ```

### For Production:

Create `.env.production`:
```bash
VITE_CONFIG_SERVICE_URL=https://config-service.your-domain.com
VITE_API_BASE_URL=https://api.your-domain.com
```

## 🧪 Testing with divami.ibp.com

Since you've configured `divami.ibp.com`, the subdomain extraction will work!

### What Happens:

1. User accesses: `http://divami.ibp.com`
2. Subdomain extracted: `"divami"`
3. API call: `GET ${VITE_CONFIG_SERVICE_URL}/api/auth-config/company?subdomain=divami`
4. Company config + authentication methods are returned together and stored in sessionStorage

### Check in Browser Console:

After the page loads, you should see:
```
✅ Company config saved: divami (ID: 1)
🏢 Company Config Loaded: {
  companyId: 1,
  companyName: "divami",
  subDomain: "divami"
}
```

### Check sessionStorage:

Open DevTools → Application → Local Storage → `http://divami.ibp.com`

You should see:
```
company_id: "1"
company_name: "divami"
company_config: "{...full json...}"
```

## 🐛 Troubleshooting

### Error: "process is not defined"
**Solution:** Make sure you're using `import.meta.env` instead of `process.env`
- ✅ Correct: `import.meta.env.VITE_CONFIG_SERVICE_URL`
- ❌ Wrong: `process.env.NX_CONFIG_SERVICE_URL`

### Environment variables not working
1. Restart dev server (Vite doesn't hot-reload env changes)
2. Check variable names start with `VITE_`
3. Check `.env.local` is in the correct directory (`apps/ui/ibp/`)

### Config not loading
1. Check config-service is running: `http://localhost:3026/api/health`
2. Check CORS is enabled on config-service
3. Check browser console for network errors
4. Verify subdomain exists in database

### Testing without subdomain
Access: `http://localhost:4200` or `http://ibp.com`
- App will run normally without company config
- Console will show: `ℹ️ No company config (running without subdomain)`

## 🌐 URL Patterns

| URL | Subdomain Detected | Company Config Loaded |
|-----|-------------------|----------------------|
| `http://divami.ibp.com` | ✅ `divami` | ✅ Yes |
| `http://hcl.ibp.com` | ✅ `hcl` | ✅ Yes |
| `http://ibp.com` | ❌ None | ❌ No (single-tenant mode) |
| `http://localhost:4200` | ❌ None | ❌ No (single-tenant mode) |

## 📦 Files Modified/Created

1. **Modified:**
   - `src/app/utils/companyConfig.ts` - Changed to `import.meta.env`
   - `src/app/utils/apiInterceptor.ts` - Changed to `import.meta.env`

2. **Created:**
   - `.env.local` - Local environment variables
   - `src/vite-env.d.ts` - TypeScript env declarations

## 🚀 Next Steps

1. **Restart your dev server**
2. **Access your app via**: `http://divami.ibp.com`
3. **Check browser console** for config loading logs
4. **Check sessionStorage** to verify company_id is set
5. **Make API calls** - they will automatically include company ID

## 💡 Tips

- Use different `.env` files for different environments:
  - `.env.local` - Local development (gitignored)
  - `.env.development` - Development environment
  - `.env.production` - Production environment

- Access env variables in your code:
  ```typescript
  const configUrl = import.meta.env.VITE_CONFIG_SERVICE_URL;
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  ```

- All `VITE_` prefixed variables are exposed to client-side code
- Never put sensitive data in client-side env variables!
