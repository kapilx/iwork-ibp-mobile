export default () => {
  return async (ctx, next) => {
    // Skip auth integration for public routes
    const publicRoutes = [
      "/api/auth-integration/authenticate",
      "/api/auth-integration/validate-token",
      "/api/health/check",
      "/_health",
      "/admin",
    ];

    const isPublicRoute = publicRoutes.some((route) =>
      ctx.request.url.startsWith(route),
    );

    if (isPublicRoute) {
      return await next();
    }

    // For API routes, check for authentication
    if (ctx.request.url.startsWith("/api/")) {
      const token =
        ctx.request.headers.authorization?.replace("Bearer ", "") ||
        ctx.query.token;

      if (token) {
        try {
          // Validate token using auth-service
          const decoded = await strapi
            .service("api::auth-integration.auth-integration")
            .validateJwtToken(token);

          if (decoded && (decoded.userId || decoded.id)) {
            // For Strapi API tokens, use embedded permissions
            if (decoded.type === "strapi-api") {
              ctx.state.user = {
                id: decoded.userId,
                userId: decoded.userId,
                orgId: decoded.orgId,
                role: decoded.role,
                permissions: decoded.permissions,
                isAuthenticated: true,
              };
            } else {
              // For iwork tokens, fetch permissions from auth-service
              const userPermissions = await strapi
                .service("api::auth-integration.auth-integration")
                .getUserPermissionsFromAuthService(
                  token,
                  decoded.userId || decoded.id,
                  decoded.orgId || decoded.organisationId,
                );

              if (userPermissions && userPermissions.isActive) {
                ctx.state.user = {
                  id: userPermissions.userId,
                  userId: userPermissions.userId,
                  orgId: userPermissions.orgId,
                  role: userPermissions.role,
                  permissions: userPermissions.strapiPermissions,
                  email: userPermissions.email,
                  firstName: userPermissions.firstName,
                  lastName: userPermissions.lastName,
                  isAuthenticated: true,
                  isAdmin:
                    userPermissions.strapiPermissions?.admin?.canAccessAdmin ||
                    false,
                };
              }
            }
          }
        } catch (error) {
          strapi.log.debug(
            "Auth integration middleware - token validation failed:",
            error.message,
          );
          // Continue without authentication - let individual routes handle auth requirements
        }
      }
    }

    await next();
  };
};
