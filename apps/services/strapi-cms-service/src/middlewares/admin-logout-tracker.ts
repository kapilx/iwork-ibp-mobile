/**
 * Admin Logout Tracker Middleware
 * Intercepts admin logout calls to track user sessions
 */

// Helper function to log anonymous logout attempts
async function logAnonymousLogout(strapi, ipAddress, userAgent, ctx, reason, requestPath, requestMethod) {
  try {
    await strapi
      .service("api::auth-integration.auth-integration")
      .logUserActivityWithMetadata(
        'unknown',
        'unknown@admin.logout',
        'logout',
        `Anonymous logout attempt (${reason})`,
        {
          ipAddress,
          userAgent,
          logoutTime: new Date(),
          logoutType: 'admin_logout_anonymous',
          logoutUrl: requestPath,
          logoutMethod: requestMethod,
          reason
        }
      );
    
    strapi.log.info('[ADMIN-LOGOUT] Anonymous logout logged:', { 
      ipAddress, 
      reason, 
      url: ctx.request.url || ctx.path 
    });
  } catch (logError) {
    strapi.log.error('[ADMIN-LOGOUT] Failed to log anonymous logout:', logError);
  }
}

export default (config, { strapi }) => {
  return async (ctx, next) => {
    // Get request details - be very explicit about URL extraction
    const requestPath = ctx.path || ctx.request.path || ctx.request.url || ctx.url || '';
    const requestMethod = ctx.method || ctx.request.method || '';
    
    // BLACKLIST APPROACH - never treat these as logout requests
    const NEVER_LOGOUT_PATHS = [
      '/admin/access-token',
      '/admin/auth/login', 
      '/admin/init',
      '/admin/users/me',
      '/admin/users/me/permissions',
      '/admin/information',
      '/admin/telemetry-properties',
      '/admin/project-type'
    ];
    
    // Access token specific early return
    if (requestPath === '/admin/access-token') {
      return await next();
    }
    
    // Check if this is a blacklisted path first (NEVER treat as logout)
    const isBlacklistedPath = NEVER_LOGOUT_PATHS.includes(requestPath);
    
    // EARLY RETURN - Skip entirely if blacklisted
    if (isBlacklistedPath) {
      return await next();
    }
    
    // WHITELIST APPROACH - only these exact paths are logout requests
    const EXACT_LOGOUT_PATHS = [
      '/admin/logout',
      '/api/auth-integration/logout', 
      '/logout'
    ];
    
    // Check for EXACT logout requests only using whitelist (and ensure POST method)
    const isExactLogoutPath = EXACT_LOGOUT_PATHS.includes(requestPath);
    const isPostMethod = requestMethod === 'POST';
    const isLogoutRequest = isExactLogoutPath && isPostMethod;

    // Debug logging for problematic requests
    if (requestPath.includes('access-token')) {
      strapi.log.error('[ADMIN-LOGOUT] ⚠️ ACCESS-TOKEN SHOULD BE IGNORED:', {
        path: requestPath,
        method: requestMethod,
        isBlacklistedPath,
        isExactLogoutPath,
        isPostMethod,
        isLogoutRequest,
        'SHOULD_BE_IGNORED': true
      });
    }

    // ONLY process if it's explicitly a logout request
    if (isLogoutRequest) {
      strapi.log.info('🚪 [LOGOUT-DEBUG] ===========================================');
      strapi.log.info('🚪 [LOGOUT-DEBUG] REAL LOGOUT REQUEST DETECTED');
      strapi.log.info('🚪 [LOGOUT-DEBUG] ===========================================');
      strapi.log.info('🚪 [LOGOUT-DEBUG] Processing valid logout request:', {
        path: requestPath,
        method: requestMethod
      });

      try {
        // Get authorization header from multiple possible sources - PRIORITIZE ENHANCED ADMIN TOKEN
        let token = null;
        
        // Priority 1: Enhanced admin token from cookie (has real user mapping) 
        const enhancedAdminToken = ctx.cookies?.get('enhancedAdminToken'); // 🎯 NEW: Dedicated enhanced token cookie!
        const adminJwtCookie = ctx.cookies?.get('strapi_jwt');
        const jwtTokenCookie = ctx.cookies?.get('jwtToken');
        
        // NEW: Check standard Strapi admin cookies
        const strapiAdminJwt = ctx.cookies?.get('strapi-admin-jwt'); 
        const strapiAuthJwt = ctx.cookies?.get('strapi-auth-jwt');
        const strapiSessionJwt = ctx.cookies?.get('strapi-session-jwt');
        
        // Priority 2: Authorization header (might have enhanced token)
        const authHeaderToken = (
          ctx.request.header?.authorization || 
          ctx.request.headers?.authorization ||
          ""
        ).replace("Bearer ", "");
        
        // Priority 3: Body/query tokens
        const bodyToken = ctx.request.body?.token;
        const queryToken = ctx.request.query?.token;
        const ssoToken = ctx.request.query?.ssoToken;  // Enhanced admin token from SSO URL!

        strapi.log.info('🚪 [LOGOUT-DEBUG] Token source priority check:', {
          'strapiAdminJwt': strapiAdminJwt ? `${strapiAdminJwt.substring(0, 20)}...` : 'NONE',
          'strapiAuthJwt': strapiAuthJwt ? `${strapiAuthJwt.substring(0, 20)}...` : 'NONE',  
          'strapiSessionJwt': strapiSessionJwt ? `${strapiSessionJwt.substring(0, 20)}...` : 'NONE',
          'adminJwtCookie': adminJwtCookie ? `${adminJwtCookie.substring(0, 20)}...` : 'NONE',
          'jwtTokenCookie': jwtTokenCookie ? `${jwtTokenCookie.substring(0, 20)}...` : 'NONE',
          'authHeaderToken': authHeaderToken ? `${authHeaderToken.substring(0, 20)}...` : 'NONE',
          'bodyToken': !!bodyToken,
          'queryToken': !!queryToken
        });

        // 🔍 DEBUG: List ALL cookies to find where enhanced token is stored
        const allCookies: any = {};
        if (ctx.cookies) {
          try {
            // Try different ways to access cookies
            if (ctx.cookies.get) {
              allCookies.jwtToken = ctx.cookies.get('jwtToken');
              allCookies.strapi_jwt = ctx.cookies.get('strapi_jwt');
              allCookies.strapiAdminJwt = ctx.cookies.get('strapi-admin-jwt');
              allCookies.strapiAuthToken = ctx.cookies.get('strapi-auth-token');
            }
          } catch (e) {
            strapi.log.warn('Cookie access error:', e.message);
          }
        }
        strapi.log.info('🚪 [LOGOUT-DEBUG] ALL AVAILABLE COOKIES:', allCookies);

        // Try tokens in priority order and pick the one with real user mapping
        const tokenCandidates = [
          { source: 'enhancedAdminToken', token: enhancedAdminToken }, // 🎯 HIGHEST PRIORITY: Dedicated enhanced admin token!
          { source: 'ssoToken', token: ssoToken },  // Enhanced admin token from SSO!
          { source: 'strapiAdminJwt', token: strapiAdminJwt },
          { source: 'strapiAuthJwt', token: strapiAuthJwt },
          { source: 'strapiSessionJwt', token: strapiSessionJwt },
          { source: 'adminJwtCookie', token: adminJwtCookie },
          { source: 'jwtTokenCookie', token: jwtTokenCookie },
          { source: 'authHeader', token: authHeaderToken },
          { source: 'body', token: bodyToken },
          { source: 'query', token: queryToken }
        ].filter(candidate => candidate.token && candidate.token.length > 20);

        let selectedToken = null;
        let tokenSource = 'none';

        for (const candidate of tokenCandidates) {
          try {
            if (!candidate.token || candidate.token.length < 10) {
              strapi.log.warn(`🚪 [LOGOUT-DEBUG] Invalid/empty token from ${candidate.source}`);
              continue;
            }

            const parts = candidate.token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
              
              strapi.log.info(`🚪 [LOGOUT-DEBUG] ✅ TOKEN FOUND from ${candidate.source}:`, JSON.stringify(payload, null, 2));

              // Prioritize tokens with real user mapping
              if (payload.userMapping || payload.realUserId || payload.type === 'admin-session') {
                selectedToken = candidate.token;
                tokenSource = candidate.source;
                strapi.log.info(`🚪 [LOGOUT-DEBUG] 🎯 ENHANCED TOKEN SELECTED from: ${candidate.source}`);
                break;
              } else {
                strapi.log.warn(`🚪 [LOGOUT-DEBUG] ❌ Basic token from ${candidate.source} - type: ${payload.type}, id: ${payload.id || payload.userId}`);
              }
            }
          } catch (e) {
            strapi.log.warn(`🚪 [LOGOUT-DEBUG] ⚠️ Token decode failed from ${candidate.source}:`, e.message);
          }
        }

        // If no enhanced token found, use the first available token
        if (!selectedToken && tokenCandidates.length > 0) {
          selectedToken = tokenCandidates[0].token;
          tokenSource = tokenCandidates[0].source;
          strapi.log.warn('🚪 [LOGOUT-DEBUG] ⚠️ Using fallback token (no enhanced token found)');
        }

        token = selectedToken;

        strapi.log.info('🚪 [LOGOUT-DEBUG] Final token selection:', {
          tokenSource,
          hasToken: !!token,
          tokenLength: token?.length || 0
        });

        // Extract IP and user agent for tracking
        const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for'] || ctx.request.headers['x-real-ip'] || 'unknown';
        const userAgent = ctx.request.headers['user-agent'] || 'unknown';

        if (token && token.length > 10) {
          strapi.log.info('🚪 [LOGOUT-DEBUG] Token found, attempting decode...');
          
          try {
            // Simple token decode for logout tracking
            const jwt = require('jsonwebtoken');
            let decoded = null;
            let userId = null;
            let email = null;

            // Try multiple decode approaches
            try {
              // Method 1: Try with verification using JWT_SECRET
              const secret = process.env.JWT_SECRET || "r97lUhAaTL";
              decoded = jwt.verify(token, secret);
              strapi.log.info('🚪 [LOGOUT-DEBUG] JWT verification successful');
            } catch (verifyError) {
              // Method 2: Try simple decode without verification
              decoded = jwt.decode(token);
              strapi.log.warn('🚪 [LOGOUT-DEBUG] JWT decode without verification - error:', verifyError.message);
            }

            if (decoded) {
              strapi.log.info('🚪 [LOGOUT-DEBUG] === FULL TOKEN PAYLOAD ===');
              
              try {
                const payloadString = JSON.stringify(decoded, null, 2);
                strapi.log.info('🚪 [LOGOUT-DEBUG] Raw payload:');
                strapi.log.info(payloadString);
              } catch (stringifyError) {
                strapi.log.error('🚪 [LOGOUT-DEBUG] JSON stringify failed:', stringifyError);
                strapi.log.info('🚪 [LOGOUT-DEBUG] Payload keys:', Object.keys(decoded));
                strapi.log.info('🚪 [LOGOUT-DEBUG] Payload values:');
                for (const [key, value] of Object.entries(decoded)) {
                  strapi.log.info(`🚪 [LOGOUT-DEBUG] ${key}:`, value);
                }
              }
              
              strapi.log.info('🚪 [LOGOUT-DEBUG] ========================');
              
              strapi.log.info('🚪 [LOGOUT-DEBUG] Token structure analysis:', {
                allKeys: Object.keys(decoded),
                id: decoded.id,
                realUserId: decoded.realUserId,
                realUserEmail: decoded.realUserEmail,
                email: decoded.email,
                userMapping: decoded.userMapping ? 'EXISTS' : 'MISSING',
                userMappingKeys: decoded.userMapping ? Object.keys(decoded.userMapping) : null,
                userDetails: decoded.userDetails ? 'EXISTS' : 'MISSING',
                userDetailsKeys: decoded.userDetails ? Object.keys(decoded.userDetails) : null,
                type: decoded.type
              });

              // Extract user info from various possible structures - FIXED FOR REAL USER IDS
              // Admin token structure: { id: 5, realUserId: 123, email: "admin@x.com", realUserEmail: "user@domain.com", userMapping: {...} }
              // Auth token structure: { userDetails: { userId: 123, emailId: "user@domain.com" } }
              
              if (decoded.userMapping) {
                // New enhanced admin token with real user mapping
                userId = decoded.userMapping.realIirmUserId || decoded.realUserId || decoded.id;
                email = decoded.userMapping.realIirmEmail || decoded.realUserEmail || decoded.email;
                strapi.log.info('🚪 [LOGOUT-DEBUG] ✅ Using enhanced admin token with real user mapping:', {
                  userMapping: decoded.userMapping,
                  extractedUserId: userId,
                  extractedEmail: email
                });
              } else if (decoded.realUserId || decoded.realUserEmail) {
                // Admin token with real user fields
                userId = decoded.realUserId || decoded.id;
                email = decoded.realUserEmail || decoded.email;
                strapi.log.info('🚪 [LOGOUT-DEBUG] ✅ Using admin token with real user fields:', {
                  realUserId: decoded.realUserId,
                  realUserEmail: decoded.realUserEmail,
                  extractedUserId: userId,
                  extractedEmail: email
                });
              } else if (decoded.userDetails) {
                // Regular auth service token
                userId = decoded.userDetails.userId;
                email = decoded.userDetails.emailId || decoded.userDetails.email;
                strapi.log.info('[ADMIN-LOGOUT] Using userDetails structure:', {
                  userDetails: decoded.userDetails,
                  extractedUserId: userId,
                  extractedEmail: email
                });
              } else if (decoded.id || decoded.userId) {
                // Old admin JWT token (direct structure) - FALLBACK
                userId = decoded.id || decoded.userId;
                email = decoded.email || decoded.emailId || decoded.email;
                strapi.log.info('[ADMIN-LOGOUT] Using fallback admin token structure:', {
                  id: decoded.id,
                  userId: decoded.userId,
                  email: decoded.email,
                  extractedUserId: userId,
                  extractedEmail: email
                });
              } else if (decoded.sub) {
                // Standard JWT sub
                userId = decoded.sub;
                email = decoded.email || decoded.emailId;
                strapi.log.info('[ADMIN-LOGOUT] Using JWT sub structure');
              }
              
              // Additional validation - ensure we have both userId and email
              if (!email || email === 'unknown@domain.com') {
                // Try additional email fields from admin token
                email = decoded.email || decoded.emailId || decoded.username || 
                       (decoded.userDetails && (decoded.userDetails.email || decoded.userDetails.emailId)) ||
                       'unknown@domain.com';
              }

              strapi.log.info('[ADMIN-LOGOUT] Final extracted user info:', {
                userId,
                email,
                tokenKeys: Object.keys(decoded),
                decodedSample: {
                  id: decoded.id,
                  email: decoded.email,
                  username: decoded.username,
                  hasUserDetails: !!decoded.userDetails
                }
              });

              if (userId) {
                strapi.log.info('🚪 [LOGOUT-DEBUG] === FINAL AUDIT LOG PREPARATION ===');
                strapi.log.info('🚪 [LOGOUT-DEBUG] About to log to audit table:', {
                  finalUserId: userId,
                  finalEmail: email,
                  activity: 'logout',
                  ipAddress,
                  userAgent,
                  logoutType: 'admin_logout_real_user',
                  strapiAdminId: decoded.id || 'unknown',
                  realUserId: userId
                });

                await strapi
                  .service("api::auth-integration.auth-integration")
                  .trackUserSessionWithMetadata(
                    userId,  // Now using REAL IIRM user ID instead of Strapi admin ID
                    email || 'unknown@domain.com',
                    token,
                    'logout',
                    {
                      ipAddress,
                      userAgent,
                      logoutTime: new Date(),
                      logoutType: 'admin_logout_real_user',
                      logoutUrl: requestPath,
                      decodeMethod: 'successful',
                      strapiAdminId: decoded.id || 'unknown',  // Track both for debugging
                      realUserId: userId  // Explicitly track the real user ID
                    }
                  );

                strapi.log.info('🚪 [LOGOUT-DEBUG] Real user logout tracked successfully in database:', {
                  realUserId: userId,
                  email,
                  strapiAdminId: decoded.id || 'unknown'
                });
                strapi.log.info('🚪 [LOGOUT-DEBUG] ===========================================');
              } else {
                await logAnonymousLogout(strapi, ipAddress, userAgent, ctx, 'no_user_id_in_token', requestPath, requestMethod);
              }
            } else {
              await logAnonymousLogout(strapi, ipAddress, userAgent, ctx, 'token_decode_failed', requestPath, requestMethod);
            }
          } catch (error) {
            strapi.log.error('[ADMIN-LOGOUT] Token processing error:', error);
            await logAnonymousLogout(strapi, ipAddress, userAgent, ctx, 'token_processing_error', requestPath, requestMethod);
          }
        } else {
          strapi.log.warn('[ADMIN-LOGOUT] No valid token found in request');
          await logAnonymousLogout(strapi, ipAddress, userAgent, ctx, 'no_token', requestPath, requestMethod);
        }
      } catch (error) {
        strapi.log.error('[ADMIN-LOGOUT] Error in logout tracking:', error);
        // Don't block the logout process
      }
    }

    // Continue with normal request processing
    await next();
  };
};