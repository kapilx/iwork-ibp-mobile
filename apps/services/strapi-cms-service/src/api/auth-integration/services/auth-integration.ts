/**
 * Auth Integration Service with session tracking
 */
import jwt from "jsonwebtoken";
import axios from "axios";

export default {
  /**
   * Validate JWT token for Strapi admin authentication
   * @param token - JWT token from iwork/ibp
   * @returns User data or null
   */
  async validateJwtToken(token: string): Promise<any> {
    try {
      const secret = process.env.JWT_SECRET || "r97lUhAaTL";
      
      // Decode and verify JWT token
      const decoded = jwt.verify(token, secret) as any;
      
      // Extract user data from the correct structure (userDetails)
      const userInfo = decoded.userDetails || decoded;
      
      return {
        userId: userInfo.userId || userInfo.id,
        orgId: userInfo.organisationId || userInfo.orgId,
        email: userInfo.emailId || userInfo.email,
        roles: userInfo.roles || [],
        ...decoded,
        userDetails: userInfo,
        sourceService: 'jwt-decode',
      };
      
    } catch (error) {
      strapi.log.error("JWT validation failed:", error.message);
      return null;
    }
  },

  /**
   * Get user permissions for Strapi admin
   * @param token - JWT token
   * @param userId - User ID 
   * @param orgId - Organization ID
   * @returns User permissions
   */
  async getUserPermissionsFromAuthService(token: string, userId: string | number, orgId: string | number): Promise<any> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "r97lUhAaTL") as any;
      const userInfo = decoded.userDetails || decoded;
      
      // Get userId from token 
      const tokenUserId = decoded.id || decoded.userId || userInfo.userId || userInfo.id || userId;
      const userEmail = decoded.email || userInfo.emailId || userInfo.email || 'unknown@domain.com';
      
      strapi.log.info('[DEBUG-TOKEN-DATA] JWT Token structure:', {
        tokenUserId,
        userEmail,
        decodedSample: { 
          id: decoded.id, 
          email: decoded.email,
          firstname: decoded.firstname,
          lastname: decoded.lastname 
        }
      });

      // Try to fetch actual user details from auth service using userId
      let actualUserDetails = null;
      try {
        // Auth service endpoint: GET /user-details with userid in headers
        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3003'; 
        const response = await axios.get(`${authServiceUrl}/user-details`, {
          timeout: 5000,
          headers: {
            'userid': String(tokenUserId), // Auth service expects userid in header
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        actualUserDetails = response.data?.data || response.data; // Handle nested data structure
        strapi.log.info('[USER-DETAILS-FETCH] Successfully fetched real user details:', {
          userId: tokenUserId,
          authServiceResponse: actualUserDetails,
          hasFirstName: !!actualUserDetails?.firstName,
          hasLastName: !!actualUserDetails?.lastName
        });
        
      } catch (fetchError) {
        strapi.log.warn('[USER-DETAILS-FETCH] Failed to fetch user details from auth service:', {
          userId: tokenUserId,
          authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3003',
          error: fetchError.message,
          willUseFallback: true
        });
      }

      // Fetch ACL permissions to check Strapi access
      let aclPermissions = null;
      let hasStrapiAdmin = false;
      let hasStrapiRead = false;
      
      try {
        // ACL endpoint is accessed through API gateway, not direct auth service
        const authServiceUrl = process.env.AUTH_SERVICE_URL;
        console.log(`🔍 Fetching ACL permissions for user ${tokenUserId} from auth service at ${authServiceUrl}...`);
        const aclResponse = await  axios.get(
          `${authServiceUrl}/access-control-list/permissions`,
          {
            timeout: 5000,
            headers: {
              'userid': String(tokenUserId),
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        console.log('✅ ACL permissions response:', aclResponse.data);
        aclPermissions = aclResponse.data?.data;
        const strapiAccessPermissions = aclPermissions?.access?.iWork?.STRAPI_ACCESS || {};
        hasStrapiAdmin = strapiAccessPermissions.STRAPI_ADMIN_001 === true;
        hasStrapiRead = strapiAccessPermissions.STRAPI_READ_001 === true;
        
        strapi.log.info('[ACL-PERMISSIONS-FETCH] Successfully fetched ACL permissions:', {
          userId: tokenUserId,
          roleId: aclPermissions?.roleId,
          roleName: aclPermissions?.roleName,
          hasStrapiAdmin,
          hasStrapiRead,
          strapiAccessPermissions
        });
        
        // Check if user has any Strapi access
        if (!hasStrapiAdmin && !hasStrapiRead) {
          strapi.log.error('[ACL-ACCESS-DENIED] User does not have Strapi access permissions:', {
            userId: tokenUserId,
            roleId: aclPermissions?.roleId,
            roleName: aclPermissions?.roleName,
            message: 'Neither STRAPI_ADMIN_001 nor STRAPI_READ_001 permission found'
          });
          throw new Error('Access denied: User does not have Strapi access permissions');
        }
        
      } catch (aclError) {
        console.log("❌ Failed to fetch ACL permissions for user %s:", tokenUserId, aclError.message);
        strapi.log.error('[ACL-PERMISSIONS-FETCH] Failed to fetch ACL permissions:', {
          userId: tokenUserId,
          apiGatewayUrl: process.env.API_GATEWAY_URL || 'http://localhost:3000',
          endpoint: '/iirm/auth-service/access-control-list/permissions',
          error: aclError.message,
          willDenyAccess: true
        });
        throw new Error(`ACL permission check failed: ${aclError.message}`);
      }

      // Use actual user details if available, otherwise fall back to token data
      let firstName, lastName, fullName;
      
      if (actualUserDetails) {
        // Use REAL user data from database
        firstName = actualUserDetails.firstName || actualUserDetails.firstname || actualUserDetails.first_name || 'Admin';
        lastName = actualUserDetails.lastName || actualUserDetails.lastname || actualUserDetails.last_name || 'User';
        fullName = actualUserDetails.fullName || actualUserDetails.displayName || `${firstName} ${lastName}`;
        
        strapi.log.info('[USER-DETAILS-SUCCESS] Using REAL names from database:', {
          source: 'auth-service-database',
          firstName,
          lastName,
          fullName,
          originalData: actualUserDetails
        });
      } else {
        // Fallback to token data (but still better than email-only)
        firstName = decoded.firstname || decoded.firstName || userInfo.firstname || userInfo.firstName || userEmail.split('@')[0] || 'Admin';
        lastName = decoded.lastname || decoded.lastName || userInfo.lastname || userInfo.lastName || 'User';
        fullName = `${firstName} ${lastName}`;
        
        strapi.log.warn('[USER-DETAILS-FALLBACK] Using token fallback names:', {
          source: 'token-fallback',
          firstName,
          lastName,
          fullName,
          message: 'Could not fetch from auth service, using token data'
        });
      }
      
      // Map ACL permissions to Strapi roles
      let strapiRole = { id: 3, name: 'Editor', hierarchyLevel: 3 };
      let permissions = [{ id: 2, name: 'editor', description: 'Read-only access' }];
      let strapiPermissions = {
        canManageContent: false,
        canManageUsers: false,
        canManageSettings: false,
        canAccessAllCollections: false,
      };
      
      if (hasStrapiAdmin) {
        strapiRole = { id: 1, name: 'Super Admin', hierarchyLevel: 1 };
        permissions = [{ id: 1, name: 'admin', description: 'Full administrative access' }];
        strapiPermissions = {
          canManageContent: true,
          canManageUsers: true,
          canManageSettings: true,
          canAccessAllCollections: true,
        };
        strapi.log.info('[ROLE-ASSIGNMENT] User granted Super Admin role (STRAPI_ADMIN_001)', {
          userId: tokenUserId,
          aclRoleName: aclPermissions?.roleName
        });
      } else if (hasStrapiRead) {
        strapiRole = { id: 2, name: 'Editor', hierarchyLevel: 2 };
        permissions = [{ id: 2, name: 'editor', description: 'Read-only access' }];
        strapiPermissions = {
          canManageContent: false,
          canManageUsers: false,
          canManageSettings: false,
          canAccessAllCollections: false,
        };
        strapi.log.info('[ROLE-ASSIGNMENT] User granted Editor role (STRAPI_READ_001)', {
          userId: tokenUserId,
          aclRoleName: aclPermissions?.roleName
        });
      }
      
      return {
        id: tokenUserId,
        userId: tokenUserId,
        orgId: userInfo.organisationId || userInfo.orgId || orgId,
        email: userEmail,
        firstName,
        lastName,
        fullName,
        displayName: fullName,
        role: strapiRole,
        permissions,
        modules: hasStrapiAdmin ? ['all'] : ['limited'],
        isActive: true,
        strapiPermissions,
        aclData: {
          roleId: aclPermissions?.roleId,
          roleName: aclPermissions?.roleName,
          hasStrapiAdmin,
          hasStrapiRead,
        },
        rawUserData: { userId, orgId },
        sourceService: 'jwt-validation-with-acl',
      };
      
    } catch (error) {
      strapi.log.error("Failed to get user permissions:", error.message);
      return null;
    }
  },

  /**
   * Generate Strapi API token with tracking
   * @param userPermissions - User permissions object
   * @param metadata - Additional metadata
   * @returns Strapi API token
   */
  async generateStrapiApiTokenWithTracking(userPermissions: any, metadata: any = {}): Promise<string> {
    try {
      const tokenPayload = {
        id: userPermissions.userId || userPermissions.id,
        email: userPermissions.email,
        orgId: userPermissions.orgId,
        permissions: userPermissions.strapiPermissions,
        roles: userPermissions.role ? [userPermissions.role] : [],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        type: 'strapi-admin'
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || "r97lUhAaTL");

      // Track login session
      await this.trackUserSessionWithMetadata(
        userPermissions.userId || userPermissions.id,
        userPermissions.email,
        token,
        'login',
        {
          ...metadata,
          loginVia: 'strapi-admin',
          strapiPermissions: userPermissions.strapiPermissions
        }
      );

      return token;
      
    } catch (error) {
      strapi.log.error("Failed to generate Strapi API token:", error.message);
      throw error;
    }
  },
  /**
   * Track user session with metadata (login/logout)
   * @param userId - User ID
   * @param email - User email  
   * @param token - JWT token
   * @param action - login or logout
   * @param metadata - Enhanced tracking metadata
   */
  async trackUserSessionWithMetadata(userId: string | number, email: string, token: string, action: 'login' | 'logout', metadata: any = {}) {
    try {
      const now = new Date();
      const sessionId = `${userId}_${Date.now()}`;
      
      if (action === 'login') {
        // REDESIGNED: user_sessions = current status only (ONE record per user)
        const existingUserSession = await strapi.db.query('api::user-session.user-session').findOne({
          where: { user_id: String(userId) }
        });

        if (existingUserSession) {
          // UPDATE existing user status record
          await strapi.db.query('api::user-session.user-session').update({
            where: { id: existingUserSession.id },
            data: {
              user_email: email,
              session_id: sessionId,
              token_hash: this.hashToken(token),
              last_activity: now,
              is_active: true,
              ip_address: metadata.ipAddress || 'unknown',
              user_agent: metadata.userAgent || 'unknown',
              session_metadata: JSON.stringify(metadata),
              updated_at: now
            }
          });

          strapi.log.info('[SESSION] User status updated (existing record):', { 
            userId, email, sessionId, recordId: existingUserSession.id
          });

        } else {
          // CREATE new user status record (first time login)
          await strapi.db.query('api::user-session.user-session').create({
            data: {
              session_id: sessionId,
              user_id: String(userId),
              user_email: email,
              token_hash: this.hashToken(token),
              start_time: now,
              last_activity: now,
              is_active: true,
              ip_address: metadata.ipAddress || 'unknown',
              user_agent: metadata.userAgent || 'unknown',
              session_metadata: JSON.stringify(metadata)
            }
          });

          strapi.log.info('[SESSION] New user status created:', { 
            userId, email, sessionId, action: 'first_login'
          });
        }

      } else if (action === 'logout') {
        // Mark user as offline in current status table
        await strapi.db.query('api::user-session.user-session').updateMany({
          where: { user_id: String(userId) },
          data: { 
            is_active: false, 
            end_time: now,
            last_activity: now,
            updated_at: now
          }
        });

        strapi.log.info('[SESSION] User marked offline:', { userId, email });
      }

      // ALWAYS log activity in audit table (full history)
      await this.logUserActivityWithMetadata(userId, email, action, `User ${action} successful`, {
        sessionId: action === 'login' ? sessionId : undefined,
        currentAction: action,
        tableDesign: 'current_status_only',
        ...metadata
      });

    } catch (error) {
      strapi.log.error('[SESSION] Failed to track user session:', error);
      strapi.log.error('[SESSION] Error details:', { userId, email, action, error: error.message });
      // Don't throw error to prevent breaking the main flow
    }
  },

  /**
   * Log user activity with enhanced metadata for audit trail
   * @param userId - User ID
   * @param email - User email
   * @param activity - Activity type
   * @param description - Activity description
   * @param metadata - Enhanced metadata including IP, user agent, etc.
   */
  async logUserActivityWithMetadata(userId: string | number, email: string, activity: string, description: string, metadata: any = {}) {
    try {
      await strapi.db.query('api::user-audit.user-audit').create({
        data: {
          user_id: String(userId),
          user_email: email,
          activity,
          description,
          metadata: JSON.stringify(metadata),
          timestamp: new Date(),
          ip_address: metadata.ipAddress || 'unknown',
          user_agent: metadata.userAgent || 'unknown',
          session_id: metadata.sessionId || null,
          success: metadata.success !== false, // Default to true unless explicitly false
          error_message: metadata.errorMessage || null
        }
      });

      strapi.log.debug('[AUDIT] Enhanced activity logged:', { 
        userId, 
        email, 
        activity, 
        description,
        ipAddress: metadata.ipAddress,
        sessionId: metadata.sessionId
      });
    } catch (error) {
      strapi.log.error('[AUDIT] Failed to log user activity with metadata:', error);
      // Don't throw error to prevent breaking the main flow
    }
  },

  /**
   * Hash token for secure storage
   * @param token - JWT token
   * @returns Hashed token
   */
  hashToken(token: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  /**
   * Check if user has admin permissions
   * @param userPermissions - User permissions object containing permissions array and ACL data
   * @returns Boolean indicating admin access
   */
  async checkAdminPermission(userPermissions: any): Promise<boolean> {
    try {
      // First priority: Check ACL data for STRAPI_ADMIN_001 permission
      if (userPermissions?.aclData?.hasStrapiAdmin === true) {
        strapi.log.info('[ADMIN-CHECK] Access granted via ACL: STRAPI_ADMIN_001 = true', {
          userId: userPermissions.userId,
          aclRoleName: userPermissions.aclData.roleName
        });
        return true;
      }

      // If ACL data says user has only read access, deny admin
      if (userPermissions?.aclData?.hasStrapiRead === true && 
          userPermissions?.aclData?.hasStrapiAdmin === false) {
        strapi.log.warn('[ADMIN-CHECK] Access denied: User has only STRAPI_READ_001 permission', {
          userId: userPermissions.userId,
          aclRoleName: userPermissions.aclData.roleName
        });
        return false;
      }

      // Fallback to permissions array check (legacy support)
      const permissions = userPermissions?.permissions || [];
      if (!Array.isArray(permissions) || permissions.length === 0) {
        strapi.log.warn('[ADMIN-CHECK] Access denied: No permissions found');
        return false;
      }

      // Check for admin-like permissions
      const adminPermissions = [
        'admin', 'super_admin', 'administrator',
        'full_access', 'manage_all', 'system_admin'
      ];

      const hasAdminPerm = permissions.some(permission => {
        if (typeof permission === 'string') {
          return adminPermissions.some(adminPerm => 
            permission.toLowerCase().includes(adminPerm)
          );
        }
        if (typeof permission === 'object' && permission.name) {
          return adminPermissions.some(adminPerm => 
            permission.name.toLowerCase().includes(adminPerm)
          );
        }
        return false;
      });

      strapi.log.debug('[ADMIN-CHECK] Fallback permission check result:', {
        permissions,
        hasAdminPerm
      });

      return hasAdminPerm;
    } catch (error) {
      strapi.log.error('[ADMIN-CHECK] Permission check failed:', error);
      return false;
    }
  },

  /**
   * Create or update admin user in Strapi
   * @param userPermissions - User permissions from auth service
   * @param decodedToken - Decoded JWT token
   * @returns Strapi admin user object
   */
  async createOrUpdateAdminUser(userPermissions: any, decodedToken: any): Promise<any> {
    try {
      const userInfo = userPermissions.userDetails || userPermissions;
      const email = userInfo.email || userInfo.emailId || decodedToken.email;
      const userId = userInfo.userId || userInfo.id || decodedToken.userId;

      // Get the Super Admin role (role ID 1 is typically Super Admin in Strapi)
      let superAdminRole = await strapi.query('admin::role').findOne({
        where: { code: 'strapi-super-admin' }
      });

      if (!superAdminRole) {
        // Fallback: get the first admin role available
        superAdminRole = await strapi.query('admin::role').findMany({ limit: 1 });
        superAdminRole = superAdminRole[0];
      }

      // Check if admin user already exists
      let adminUser = await strapi.query('admin::user').findOne({
        where: { email },
        populate: ['roles']
      });

      // Use names from userPermissions (which now has REAL names from auth service)
      const firstname = userInfo.firstName || userInfo.firstname || 
                        decodedToken.firstname || decodedToken.firstName || 
                        email.split('@')[0] || 'Admin';
                        
      const lastname = userInfo.lastName || userInfo.lastname || 
                       decodedToken.lastname || decodedToken.lastName || 'User';

      strapi.log.info('[DEBUG-ADMIN-USER-NAMES] Using names from auth service (via userPermissions):', {
        email,
        firstname,
        lastname,
        fullName: userInfo.fullName,
        displayName: userInfo.displayName,
        source: 'auth-service-via-userPermissions',
        userInfoHasFirstName: !!userInfo.firstName,
        userInfoHasLastName: !!userInfo.lastName
      });

      const userData = {
        firstname,
        lastname, 
        email,
        username: email,
        isActive: true,
        blocked: false,
        preferedLanguage: 'en',
        roles: superAdminRole ? [superAdminRole.id] : []
      };

      if (adminUser) {
        // Update existing admin user with roles
        adminUser = await strapi.query('admin::user').update({
          where: { id: adminUser.id },
          data: userData,
          populate: ['roles']
        });

        strapi.log.info('[ADMIN-USER] Updated existing admin user:', {
          id: adminUser.id,
          email,
          roles: adminUser.roles?.map(r => r.name || r.code)
        });
      } else {
        // Create new admin user with roles
        adminUser = await strapi.query('admin::user').create({
          data: userData,
          populate: ['roles']
        });

        strapi.log.info('[ADMIN-USER] Created new admin user:', {
          id: adminUser.id,
          email,
          roles: adminUser.roles?.map(r => r.name || r.code)
        });
      }

      return adminUser;
    } catch (error) {
      strapi.log.error('[ADMIN-USER] Failed to create/update admin user:', error);
      throw error;
    }
  },

  /**
   * Generate admin token for Strapi admin panel with real user ID mapping
   * @param adminUser - Strapi admin user object
   * @param realUserData - Real IIRM user data from auth service (userPermissions)
   * @returns JWT token for admin session
   */
  async generateAdminToken(adminUser: any, realUserData: any = null): Promise<string> {
    try {
      // realUserData is the userPermissions object which contains the real IIRM user data
      const realIirmUserId = realUserData?.userId || realUserData?.id || adminUser.id;
      const realIirmEmail = realUserData?.email || adminUser.email;
      
      const tokenPayload = {
        id: adminUser.id,                    // Strapi admin user ID (for admin panel)
        realUserId: realIirmUserId,          // Real IIRM user ID for audit trails
        email: adminUser.email,
        realUserEmail: realIirmEmail,        // Real IIRM user email
        firstname: adminUser.firstname,
        lastname: adminUser.lastname,
        username: adminUser.username,
        isActive: adminUser.isActive,
        roles: adminUser.roles || [],
        type: 'admin-session',
        // Store mapping for logout audit - THIS IS THE KEY FIX
        userMapping: {
          strapiAdminId: adminUser.id,
          realIirmUserId: realIirmUserId,     // Real IIRM user ID from iwork
          realIirmEmail: realIirmEmail        // Real IIRM user email from iwork
        }
      };

      const token = jwt.sign(
        tokenPayload,
        process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "r97lUhAaTL",
        { expiresIn: '24h' }
      );

      strapi.log.info('[ADMIN-TOKEN] Generated admin token with real user mapping:', {
        strapiAdminId: adminUser.id,
        realIirmUserId: realIirmUserId,
        realEmail: realIirmEmail,
        hasUserMapping: !!realUserData,
        realUserDataKeys: realUserData ? Object.keys(realUserData) : []
      });

      return token;
    } catch (error) {
      strapi.log.error('[ADMIN-TOKEN] Failed to generate admin token:', error);
      throw error;
    }
  },

  /**
   * Verify admin token for SSO authentication
   * @param token - Admin SSO token to verify
   * @returns Verified user data or null
   */
  async verifyAdminToken(token: string): Promise<any> {
    try {
      if (!token) {
        strapi.log.warn('[VERIFY-ADMIN-TOKEN] No token provided');
        return null;
      }

      // Verify the admin token using JWT
      const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "r97lUhAaTL";
      const decoded = jwt.verify(token, secret) as any;

      strapi.log.info('[VERIFY-ADMIN-TOKEN] Token verified successfully:', {
        userId: decoded.id || decoded.userId,
        email: decoded.email,
        type: decoded.type,
        exp: decoded.exp
      });

      // Check if token is for admin session
      if (decoded.type !== 'admin-session') {
        strapi.log.error('[VERIFY-ADMIN-TOKEN] Invalid token type:', decoded.type);
        return null;
      }

      // Return verified user data
      return {
        id: decoded.id || decoded.userId,
        email: decoded.email,
        firstname: decoded.firstname || 'Unknown',
        lastname: decoded.lastname || 'User', 
        username: decoded.username || decoded.email,
        isActive: decoded.isActive !== false,
        roles: decoded.roles || [],
        type: decoded.type,
        userDetails: decoded
      };

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        strapi.log.warn('[VERIFY-ADMIN-TOKEN] Token expired:', error.message);
      } else if (error.name === 'JsonWebTokenError') {
        strapi.log.warn('[VERIFY-ADMIN-TOKEN] Invalid token:', error.message);
      } else {
        strapi.log.error('[VERIFY-ADMIN-TOKEN] Token verification failed:', error.message);
      }
      return null;
    }
  }
};