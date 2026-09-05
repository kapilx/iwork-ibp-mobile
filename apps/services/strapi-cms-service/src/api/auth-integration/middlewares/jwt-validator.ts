import jwt from 'jsonwebtoken';

export default () => {
  return async (ctx, next) => {
    try {
      let token = null;

      // Extract token from Authorization header or query parameter
      const authHeader = ctx.request.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      } else if (ctx.query.token) {
        token = ctx.query.token;
      }

      if (!token) {
        strapi.log.error("JWT Middleware: No token provided");
        return ctx.unauthorized("Authentication token required");
      }

      strapi.log.info(`JWT Middleware: Processing token: ${token.substring(0, 50)}...`);

      // First try to decode the token to check its type
      let decoded;
      try {
        const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'r97lUhAaTL';
        strapi.log.info(`JWT Middleware: Using secret: ${secret.substring(0, 10)}...`);
        decoded = jwt.verify(token, secret) as any;
        strapi.log.info(`JWT Middleware: Token decoded successfully, type: ${decoded.type}`);
      } catch (jwtError) {
        strapi.log.error("JWT Middleware: JWT decode failed:", jwtError.message);
        return ctx.unauthorized("Invalid or expired token");
      }

      // Check if it's a Strapi API token (from our authentication endpoint)
      if (decoded.type === "strapi-api") {
        // Token is already validated and contains permissions
        strapi.log.info("JWT Middleware: Validated Strapi API token for user:", decoded.userId);
        ctx.state.user = {
          userId: decoded.userId,
          orgId: decoded.orgId,
          role: decoded.role,
          permissions: decoded.permissions,
          isAdmin: decoded.permissions?.admin?.canAccessAdmin || false,
        };
        strapi.log.info("JWT Middleware: User state set for Strapi token, proceeding...");
      } else {
        // Original iwork/IBP token - validate against auth-service
        strapi.log.info("JWT Middleware: Processing original iwork/IBP token for user:", decoded.userDetails?.userId || decoded.userId);
        
        const validatedToken = await strapi
          .service("api::auth-integration.auth-integration")
          .validateJwtToken(token);

        if (!validatedToken) {
          strapi.log.error("JWT Middleware: Token validation failed");
          return ctx.unauthorized("Invalid or expired token");
        }

        const userPermissions = await strapi
          .service("api::auth-integration.auth-integration")
          .getUserPermissionsFromAuthService(
            token,
            validatedToken.userId || validatedToken.id,
            validatedToken.orgId || validatedToken.organisationId,
          );

        if (!userPermissions || !userPermissions.isActive) {
          strapi.log.error("JWT Middleware: User permissions invalid or inactive");
          return ctx.forbidden("User not found, inactive, or no permissions");
        }

        ctx.state.user = {
          userId: userPermissions.userId,
          orgId: userPermissions.orgId,
          role: userPermissions.role,
          permissions: userPermissions.strapiPermissions,
          isAdmin:
            userPermissions.strapiPermissions?.admin?.canAccessAdmin || false,
          email: userPermissions.email,
          firstName: userPermissions.firstName,
          lastName: userPermissions.lastName,
        };
        strapi.log.info("JWT Middleware: User state set for iwork/IBP token, proceeding...");
      }

      await next();
      strapi.log.info("JWT Middleware: Request completed successfully");
    } catch (error) {
      strapi.log.error("JWT validation middleware error:", error);
      return ctx.unauthorized("Token validation failed");
    }
  };
};
