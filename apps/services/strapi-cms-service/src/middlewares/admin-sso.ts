/**
 * Admin Panel SSO Middleware
 * Handles automatic authentication for Strapi admin panel when accessed via SSO
 */

module.exports = (config, { strapi }) => {
  const isSsoDebugEnabled = () => process.env.STRAPI_SSO_DEBUG === 'true';

  return async (ctx, next) => {
    if (isSsoDebugEnabled()) {
      strapi.log.info(`[ADMIN-SSO][DEBUG] Incoming URL: ${ctx.request.url}`);
    }

    // Resolve mounted admin entry path from runtime config.
    // Example: /iirm/strapi-cms-service/admin
    const adminPath = strapi.config.get('admin.path', '/admin');
    const configuredAdminUrl = strapi.config.get('admin.url');
    let adminEntryPath = adminPath;
    if (typeof configuredAdminUrl === 'string' && configuredAdminUrl.length > 0) {
      try {
        adminEntryPath = configuredAdminUrl.startsWith('http')
          ? (new URL(configuredAdminUrl).pathname || adminPath)
          : configuredAdminUrl;
      } catch {
        adminEntryPath = configuredAdminUrl;
      }
    }
    if (!adminEntryPath.startsWith('/')) {
      adminEntryPath = `/${adminEntryPath}`;
    }

    const requestPath = ctx.path || ctx.request.path || '';

    // In mounted-prefix setups, Strapi admin HTML can still request /admin/@vite...
    // Rewrite those asset URLs to the mounted admin path so Vite client assets resolve.
    const isMountedAdmin = adminEntryPath !== '/admin';
    // Rewrite only admin static asset requests. Do NOT rewrite admin API endpoints
    // such as /admin/init or /admin/project-type, otherwise admin boot flow breaks.
    const isAdminAssetRequest =
      requestPath.startsWith('/admin/@vite') ||
      requestPath.startsWith('/admin/@react-refresh') ||
      requestPath.startsWith('/admin/.strapi/') ||
      requestPath.startsWith('/admin/@fs/') ||
      requestPath.startsWith('/admin/node_modules/');
    if (isMountedAdmin && isAdminAssetRequest) {
      const rewrittenPath = `${adminEntryPath}${requestPath.slice('/admin'.length)}`;
      const querySuffix = ctx.request.querystring ? `?${ctx.request.querystring}` : '';
      const rewrittenUrl = `${rewrittenPath}${querySuffix}`;
      if (isSsoDebugEnabled()) {
        strapi.log.info(`[ADMIN-SSO][DEBUG] Rewriting admin asset URL: ${ctx.request.url} -> ${rewrittenUrl}`);
      }
      ctx.url = rewrittenUrl;
    }

    const effectivePath = ctx.path || ctx.request.path || '';
    const isAdminRequest = effectivePath.startsWith('/admin') || effectivePath.startsWith(adminEntryPath);

    // Only apply to admin panel requests
    if (!isAdminRequest) {
      if (isSsoDebugEnabled()) {
        strapi.log.info(`[ADMIN-SSO][DEBUG] Skipped non-admin URL: ${ctx.request.url}`);
      }
      return await next();
    }

    // Check for SSO parameters
    const { sso, redirect, viaGateway } = ctx.request.query;
    
    if (sso === 'true') {
      try {
        strapi.log.info('[ADMIN-SSO] SSO authentication requested for admin panel');
        
        // Try multiple methods to get the SSO token
        const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';
        
        // Allow URL param when accessed through API gateway (secure proxy)
        const isViaGateway = viaGateway === 'true' ||
                            !!ctx.request.header['x-forwarded-for'] || 
                            !!ctx.request.header['x-real-ip'] ||
                            ctx.request.url.includes('/iirm/strapi-cms-service');

        const ssoToken = 
          // Check query param (dev OR via secure gateway)
          ( ctx.request.query.ssoToken ) ||
          // Check custom header first
          ctx.request.header['x-strapi-sso-token'] || 
          // Check cookie
          ctx.cookies.get('strapiSsoToken') ||
          // Check request body if it's a POST
          (ctx.request.body && ctx.request.body.ssoToken);

        if (isSsoDebugEnabled()) {
          strapi.log.info(`[ADMIN-SSO][DEBUG] SSO token found: ${ssoToken ? 'YES' : 'NO'} (isDev: ${isDevelopment}, isViaGateway: ${isViaGateway})`);
          strapi.log.info(`[ADMIN-SSO][DEBUG] Available cookies: ${Object.keys(ctx.cookies || {}).join(', ')}`);
        }

        if (ssoToken) {
          strapi.log.info('[ADMIN-SSO] Processing SSO authentication for admin panel');
          
          // Verify the admin token
          const adminUser = await strapi
            .service('api::auth-integration.auth-integration')
            .verifyAdminToken(ssoToken);

          if (adminUser) {
            strapi.log.info(`[ADMIN-SSO] SSO authentication successful for user: ${adminUser.email}`);
            
            // Prefer Strapi v5 session manager (stable login, avoids init loop)
            try {
              const sessionManager = strapi.sessionManager;
              const configuredSecure = strapi.config.get('admin.auth.cookie.secure');
              const isProduction = process.env.NODE_ENV === 'production';
              // When via gateway, the internal connection is HTTP even if external is HTTPS
              // So we must use secure: false to allow cookies over the HTTP connection
              const isSecure = isViaGateway ? false : (typeof configuredSecure === 'boolean' ? configuredSecure : isProduction);
              const domain = strapi.config.get('admin.auth.cookie.domain') || strapi.config.get('admin.auth.domain');
              // Use root path when via gateway so cookies are sent for all gateway requests
              const path = isViaGateway ? '/' : strapi.config.get('admin.auth.cookie.path', '/admin');
              const sameSite = strapi.config.get('admin.auth.cookie.sameSite') ?? 'lax';

              if (sessionManager) {
                const crypto = require('crypto');
                const deviceId = typeof crypto.randomUUID === 'function'
                  ? crypto.randomUUID()
                  : `${Date.now()}-${Math.random()}`;

                const userId = String(adminUser.id);
                const { token: refreshToken, absoluteExpiresAt } = await sessionManager('admin')
                  .generateRefreshToken(userId, deviceId, { type: 'refresh' });

                const accessResult = await sessionManager('admin').generateAccessToken(refreshToken);
                if ('error' in accessResult) {
                  throw new Error('Failed to generate admin access token');
                }

                // Refresh cookie (httpOnly)
                const refreshExpiresAt = absoluteExpiresAt ? new Date(absoluteExpiresAt) : undefined;
                ctx.cookies.set('strapi_admin_refresh', refreshToken, {
                  httpOnly: true,
                  secure: isSecure,
                  overwrite: true,
                  domain,
                  path,
                  sameSite,
                  expires: refreshExpiresAt,
                  maxAge: refreshExpiresAt ? Math.max(0, refreshExpiresAt.getTime() - Date.now()) : undefined,
                });

                // Access cookie used by admin app
                ctx.cookies.set('jwtToken', accessResult.token, {
                  httpOnly: false,
                  secure: isSecure,
                  overwrite: true,
                  domain,
                  path,
                  sameSite,
                });
                
                // 🎯 STORE ENHANCED ADMIN TOKEN IN SEPARATE COOKIE (for logout tracking with real user ID)
                const adminJwtSecret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'dev-secret';
                const enhancedAdminPayload = {
                  id: adminUser.id,
                  realUserId: adminUser.userDetails?.realUserId || adminUser.id,
                  email: adminUser.email,
                  realUserEmail: adminUser.userDetails?.realUserEmail || adminUser.email,
                  type: 'admin-session',
                  userMapping: {
                    strapiAdminId: adminUser.id,
                    realIirmUserId: adminUser.userDetails?.realUserId || adminUser.id,
                    realIirmEmail: adminUser.userDetails?.realUserEmail || adminUser.email
                  }
                };
                const enhancedAdminToken = require('jsonwebtoken').sign(enhancedAdminPayload, adminJwtSecret, { expiresIn: '30d' });
                
                ctx.cookies.set('enhancedAdminToken', enhancedAdminToken, {
                  httpOnly: false,
                  secure: isSecure,
                  overwrite: true,
                  domain,
                  path,
                  sameSite,
                  maxAge: 30 * 24 * 60 * 60 * 1000
                });

                // Clear legacy cookie if present
                ctx.cookies.set('strapi-jwt', null, { path: '/', expires: new Date(0) });

              } else {
                strapi.log.warn('SessionManager not available, falling back to manual JWT with enhanced user mapping');
                const adminJwtSecret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'dev-secret';
                
                // Extract real user mapping from the original token if available
                const originalTokenData = adminUser.userDetails || {};
                const realUserId = originalTokenData.realUserId || originalTokenData.userMapping?.realIirmUserId || adminUser.id;
                const realUserEmail = originalTokenData.realUserEmail || originalTokenData.userMapping?.realIirmEmail || adminUser.email;
                
                const adminJwtPayload = {
                  id: adminUser.id,                    // Strapi admin ID (for admin panel functionality)
                  realUserId: realUserId,              // Real IIRM user ID (for audit logs)
                  email: adminUser.email,
                  realUserEmail: realUserEmail,        // Real IIRM user email (for audit logs) 
                  firstname: adminUser.firstname,
                  lastname: adminUser.lastname,
                  type: 'admin-session',
                  // Include user mapping for logout tracking
                  userMapping: {
                    strapiAdminId: adminUser.id,
                    realIirmUserId: realUserId,
                    realIirmEmail: realUserEmail
                  }
                };
                
                if (isSsoDebugEnabled()) {
                  strapi.log.info('[ADMIN-SSO][DEBUG] Creating enhanced JWT with real user mapping:', {
                    strapiAdminId: adminUser.id,
                    realIirmUserId: realUserId,
                    realIirmEmail: realUserEmail,
                    hasOriginalMapping: !!originalTokenData.userMapping
                  });
                }
                
                const adminJwt = require('jsonwebtoken').sign(adminJwtPayload, adminJwtSecret, {
                  expiresIn: '30d'
                });

                // Use same cookie settings as SessionManager path
                const configuredSecure = strapi.config.get('admin.auth.cookie.secure');
                const isProduction = process.env.NODE_ENV === 'production';
                const isSecure = isViaGateway ? false : (typeof configuredSecure === 'boolean' ? configuredSecure : isProduction);
                const domain = strapi.config.get('admin.auth.cookie.domain') || strapi.config.get('admin.auth.domain');
                const path = isViaGateway ? '/' : strapi.config.get('admin.auth.cookie.path', '/admin');
                const sameSite = strapi.config.get('admin.auth.cookie.sameSite') ?? 'lax';

                // Set fallback jwtToken for admin panel functionality
                ctx.cookies.set('jwtToken', adminJwt, {
                  httpOnly: false,
                  secure: isSecure,
                  overwrite: true,
                  domain,
                  path,
                  sameSite,
                  maxAge: 30 * 24 * 60 * 60 * 1000
                });
                
                // ✅ Also set enhanced admin token (same content) for consistency with SessionManager flow
                ctx.cookies.set('enhancedAdminToken', adminJwt, {
                  httpOnly: false,
                  secure: isSecure,
                  overwrite: true,
                  domain,
                  path,
                  sameSite,
                  maxAge: 30 * 24 * 60 * 60 * 1000
                });
              }
            } catch (sessionError) {
              strapi.log.error('Admin session setup failed:', sessionError);
            }
            
            // Clear the SSO token cookie after successful authentication
            ctx.cookies.set('strapiSsoToken', null, {
              path: '/',
              expires: new Date(0)
            });
            
            // Redirect to intended destination or resolved admin entry.
            // If redirect is the generic /admin, replace with actual mounted admin path.
            const isGenericAdminRedirect = !redirect || redirect === '/admin' || redirect === adminPath;
            let redirectPath = isGenericAdminRedirect ? adminEntryPath : redirect;

            // When via gateway, keep the gateway prefix so browser stays in gateway context
            if (isViaGateway && !redirectPath.startsWith('/iirm/') && !redirectPath.startsWith('http://') && !redirectPath.startsWith('https://')) {
              redirectPath = `/iirm/strapi-cms-service${redirectPath}`;
            }
            
            strapi.log.info(`[ADMIN-SSO] Redirecting to: ${redirectPath}`);
            
            ctx.redirect(redirectPath);
            return;
          } else {
            strapi.log.warn('[ADMIN-SSO] SSO token verification failed - invalid or expired token');
          }
        } else {
          strapi.log.warn('[ADMIN-SSO] SSO authentication requested but no token found');
        }
      } catch (error) {
        strapi.log.error('[ADMIN-SSO] Admin SSO authentication failed:', error);
        // Fall through to normal authentication flow
      }
    }

    // Continue with normal middleware chain
    await next();
  };
};
