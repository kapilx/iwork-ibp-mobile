import jwt from "jsonwebtoken";
import { Context } from "koa";

export default {
  /**
   * Authenticate user using JWT token from iwork
   * @param ctx - Koa context
   */
  async authenticate(ctx: Context) {
    try {
      const { token } = ctx.request.body as { token: string };

      if (!token) {
        return ctx.badRequest("JWT token is required");
      }

      // Validate JWT token using shared secret
      const decoded = await strapi
        .service("api::auth-integration.auth-integration")
        .validateJwtToken(token);

      if (!decoded) {
        return ctx.unauthorized("Invalid or expired token");
      }

      // Get user permissions from auth-service
      const userPermissions = await strapi
        .service("api::auth-integration.auth-integration")
        .getUserPermissionsFromAuthService(
          token,
          decoded.userId,
          decoded.orgId,
        );

      if (!userPermissions) {
        return ctx.forbidden("User not found or has no permissions");
      }

      // Generate Strapi API token with appropriate permissions and enhanced tracking
      const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for'] || ctx.request.headers['x-real-ip'] || 'unknown';
      const userAgent = ctx.request.headers['user-agent'] || 'unknown';
      
      const strapiToken = await strapi
        .service("api::auth-integration.auth-integration")
        .generateStrapiApiTokenWithTracking(userPermissions, {
          ipAddress,
          userAgent,
          loginTime: new Date()
        });

      ctx.body = {
        success: true,
        data: {
          strapiToken,
          user: {
            id: decoded.userId,
            orgId: decoded.orgId,
            permissions: userPermissions.permissions,
            role: userPermissions.role,
            email: userPermissions.email,
            firstName: userPermissions.firstName,
            lastName: userPermissions.lastName
          },
          sourceService: userPermissions.sourceService || 'unknown',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      };
    } catch (error) {
      strapi.log.error("Authentication error:", error);
      ctx.internalServerError("Authentication failed");
    }
  },

  /**
   * Validate JWT token and return user info
   * @param ctx - Koa context
   */
  async validateToken(ctx: Context) {
    try {
      const { token } = ctx.request.body as { token: string };

      if (!token) {
        return ctx.badRequest("JWT token is required");
      }

      const decoded = await strapi
        .service("api::auth-integration.auth-integration")
        .validateJwtToken(token);

      if (!decoded) {
        return ctx.unauthorized("Invalid or expired token");
      }

      ctx.body = {
        success: true,
        valid: true,
        data: {
          userId: decoded.userId,
          orgId: decoded.orgId,
          iat: decoded.iat,
          exp: decoded.exp,
        },
      };
    } catch (error) {
      strapi.log.error("Token validation error:", error);
      ctx.body = {
        success: false,
        valid: false,
        error: "Token validation failed",
      };
    }
  },

  /**
   * Get user permissions from main database
   * @param ctx - Koa context
   */
  async getUserPermissions(ctx: Context) {
    try {
      const { userId } = ctx.params;
      const userContext = ctx.state.user; // Set by JWT middleware

      if (userContext.userId !== parseInt(userId) && !userContext.isAdmin) {
        return ctx.forbidden("Cannot access other user permissions");
      }

      const permissions = await strapi
        .service("api::auth-integration.auth-integration")
        .getUserPermissionsFromAuthService(
          ctx.request.header.authorization.replace("Bearer ", ""),
          userId,
          userContext.orgId,
        );

      ctx.body = {
        success: true,
        data: permissions,
      };
    } catch (error) {
      strapi.log.error("Get permissions error:", error);
      ctx.internalServerError("Failed to retrieve permissions");
    }
  },

  /**
   * Refresh user permissions from main database
   * @param ctx - Koa context
   */
  async refreshPermissions(ctx: Context) {
    try {
      const userContext = ctx.state.user;

      const updatedPermissions = await strapi
        .service("api::auth-integration.auth-integration")
        .getUserPermissionsFromAuthService(
          ctx.request.header.authorization.replace("Bearer ", ""),
          userContext.userId,
          userContext.orgId,
        );

      ctx.body = {
        success: true,
        data: updatedPermissions,
      };
    } catch (error) {
      strapi.log.error("Refresh permissions error:", error);
      ctx.internalServerError("Failed to refresh permissions");
    }
  },

  /**
   * Admin Panel SSO Access - authenticate user for admin panel access
   * @param ctx - Koa context
   */
  async adminAccess(ctx: Context) {
    try {
      const { token, redirectTo } = ctx.request.body as { 
        token: string; 
        redirectTo?: string; 
      };

      if (!token) {
        return ctx.badRequest("JWT token is required");
      }

      // Validate JWT token
      const decoded = await strapi
        .service("api::auth-integration.auth-integration")
        .validateJwtToken(token);

      if (!decoded) {
        return ctx.unauthorized("Invalid or expired token");
      }
     console.log(`[ADMIN-ACCESS] Token validated for userId: ${decoded.userId}, orgId: ${decoded.orgId}`);
      // Get user permissions from auth-service
      const userPermissions = await strapi
        .service("api::auth-integration.auth-integration")
        .getUserPermissionsFromAuthService(
          token,
          decoded.userId,
          decoded.orgId,
        );

      strapi.log.info("[ADMIN-ACCESS] Permissions received:", {
        userId: decoded.userId,
        orgId: decoded.orgId,
        permissions: userPermissions ? userPermissions.permissions : null,
        fullUserPermissions: JSON.stringify(userPermissions, null, 2),
      });

      if (!userPermissions) {
        strapi.log.warn("[ADMIN-ACCESS] Denied: User not found or has no permissions", {
          userId: decoded.userId,
          orgId: decoded.orgId,
        });
        return ctx.forbidden("User not found or has no permissions");
      }

      // Check if user has admin access using ACL permissions
      const hasAdminAccess = await strapi
        .service("api::auth-integration.auth-integration")
        .checkAdminPermission(userPermissions);
      strapi.log.info("[ADMIN-ACCESS] Admin permission check:", {
        userId: decoded.userId,
        orgId: decoded.orgId,
        hasAdminAccess,
        aclData: userPermissions.aclData,
      });

      if (!hasAdminAccess) {
        strapi.log.warn("[ADMIN-ACCESS] Denied: User does not have admin panel access", {
          userId: decoded.userId,
          orgId: decoded.orgId,
          permissions: userPermissions.permissions,
        });
        return ctx.forbidden("User does not have admin panel access");
      }

      // Create or update admin user in Strapi
      const adminUser = await strapi
        .service("api::auth-integration.auth-integration")
        .createOrUpdateAdminUser(userPermissions, decoded);

      // Extract IP and user agent for tracking
      const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for'] || ctx.request.headers['x-real-ip'] || 'unknown';
      const userAgent = ctx.request.headers['user-agent'] || 'unknown';

      // Generate admin session with enhanced tracking
      const adminToken = await strapi
        .service("api::auth-integration.auth-integration")
        .generateAdminToken(adminUser, userPermissions);

      // Track admin session creation (SESSION TRACKING WITH REAL USER ID)
      await strapi
        .service("api::auth-integration.auth-integration")
        .trackUserSessionWithMetadata(
          userPermissions.userId || userPermissions.id,  // Use REAL IIRM user ID for session tracking
          userPermissions.email,                         // Use REAL IIRM user email
          adminToken,
          'login',
          {
            ipAddress,
            userAgent,
            adminUserId: adminUser.id,                   // Also track Strapi admin ID for reference
            accessMethod: 'SSO',
            sessionType: 'admin',
            timestamp: new Date(),
            realIirmUserId: userPermissions.userId || userPermissions.id,
            realIirmEmail: userPermissions.email
          }
        );

      // Track admin access activity (ACTIVITY TRACKING WITH REAL USER ID) 
      await strapi
        .service("api::auth-integration.auth-integration")
        .logUserActivityWithMetadata(
          userPermissions.userId || userPermissions.id,  // Use REAL IIRM user ID for audit logging
          userPermissions.email,                         // Use REAL IIRM user email
          'admin_access',
          'User accessed Strapi admin panel via SSO',
          {
            ipAddress,
            userAgent,
            adminUserId: adminUser.id,                   // Also track Strapi admin ID for reference
            accessMethod: 'SSO',
            timestamp: new Date(),
            realIirmUserId: userPermissions.userId || userPermissions.id,
            realIirmEmail: userPermissions.email
          }
        );

      strapi.log.info('[ADMIN-ACCESS] Admin access tracked with REAL user ID:', {
        realIirmUserId: userPermissions.userId || userPermissions.id,
        realIirmEmail: userPermissions.email,
        strapiAdminId: adminUser.id,
        ipAddress,
        timestamp: new Date()
      });

      ctx.body = {
        success: true,
        data: {
          adminToken,
          user: {
            id: adminUser.id,
            email: adminUser.email,
            firstname: adminUser.firstname,
            lastname: adminUser.lastname,
            isActive: adminUser.isActive,
            roles: adminUser.roles || [],
          },
          redirectTo: redirectTo || '/admin',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      };
    } catch (error) {
      strapi.log.error("Admin access error:", error);
      ctx.internalServerError("Admin access authentication failed");
    }
  },

  /**
   * User logout endpoint with session termination and audit logging
   * @param ctx - Koa context
   */
  async logout(ctx: Context) {
    try {
      const token = (ctx.request.header?.authorization || "").replace("Bearer ", "");
      
      if (!token) {
        return ctx.badRequest("No token provided for logout");
      }

      // Extract IP and user agent for tracking
      const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for'] || ctx.request.headers['x-real-ip'] || 'unknown';
      const userAgent = ctx.request.headers['user-agent'] || 'unknown';

      // Decode token to get user information
      const decoded = await strapi
        .service("api::auth-integration.auth-integration")
        .validateJwtToken(token);

      if (decoded) {
        // Track logout activity with enhanced metadata
        await strapi
          .service("api::auth-integration.auth-integration")
          .trackUserSessionWithMetadata(
            decoded.userId || decoded.id,
            decoded.email || decoded.emailId,
            token,
            'logout',
            {
              ipAddress,
              userAgent,
              logoutTime: new Date(),
              tokenExpired: false
            }
          );

        strapi.log.info('[LOGOUT] User logout tracked:', {
          userId: decoded.userId || decoded.id,
          email: decoded.email || decoded.emailId,
          ipAddress,
          timestamp: new Date()
        });
      }

      ctx.body = {
        success: true,
        message: "Logout successful",
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      strapi.log.error("Logout error:", error);
      
      // Still return success since logout should always work
      // but log the error for debugging
      ctx.body = {
        success: true,
        message: "Logout completed (with warnings)",
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Test logout endpoint - for debugging logout audit logging
   * @param ctx - Koa context
   */
  async testLogout(ctx: Context) {
    try {
      const { userId = "999", email = "test@logout.com" } = ctx.request.body as {
        userId?: string;
        email?: string;
      };

      // Extract IP and user agent for tracking
      const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for'] || ctx.request.headers['x-real-ip'] || 'unknown';
      const userAgent = ctx.request.headers['user-agent'] || 'unknown';

      // Simulate logout tracking
      await strapi
        .service("api::auth-integration.auth-integration")
        .trackUserSessionWithMetadata(
          userId,
          email,
          "dummy-token-for-test", 
          'logout',
          {
            ipAddress,
            userAgent,
            testMode: true,
            logoutTime: new Date(),
            tokenExpired: false
          }
        );

      strapi.log.info('[TEST-LOGOUT] Test logout activity logged:', {
        userId,
        email,
        ipAddress,
        timestamp: new Date()
      });

      ctx.body = {
        success: true,
        message: "Test logout logged successfully",
        data: { userId, email },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      strapi.log.error("Test logout error:", error);
      ctx.internalServerError("Test logout failed");
    }
  },

  /**
   * Test session insertion endpoint
   * @param ctx - Koa context
   */
  async testSession(ctx: Context) {
    try {
      const { userId, email } = ctx.request.body as { userId: number; email: string };

      console.log(`SESSION-DEBUG: Test endpoint called with userId: ${userId}, email: ${email}`);

      if (!userId || !email) {
        return ctx.badRequest("userId and email are required");
      }

      // Use our existing trackUserSession service method
      const sessionResult = await strapi
        .service("api::auth-integration.auth-integration")
        .trackUserSessionWithMetadata(
          userId,
          email,
          `test-token-${Date.now()}`,
          'login',
          {
            ipAddress: ctx.request.ip || 'test-ip',
            userAgent: ctx.request.headers['user-agent'] || 'test-agent',
            testMode: true
          }
        );

      console.log(`SESSION-DEBUG: Test session result:`, sessionResult);

      ctx.body = {
        success: true,
        message: "Test session created successfully",
        sessionResult: sessionResult,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("SESSION-DEBUG: Test session error:", error);
      strapi.log.error("Test session error:", error);
      
      ctx.body = {
        success: false,
        message: "Test session failed",
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },
};
