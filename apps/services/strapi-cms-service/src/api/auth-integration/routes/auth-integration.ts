export default {
  routes: [
    {
      method: "POST",
      path: "/auth-integration/authenticate",
      handler: "auth-integration.authenticate",
      config: {
        auth: false, // Allow public access for initial authentication
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/auth-integration/validate-token",
      handler: "auth-integration.validateToken",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/auth-integration/admin-access",
      handler: "auth-integration.adminAccess",
      config: {
        auth: false, // Allow access for SSO authentication
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/auth-integration/user-permissions/:userId",
      handler: "auth-integration.getUserPermissions",
      config: {
        middlewares: ["api::auth-integration.jwt-validator"],
      },
    },
    {
      method: "POST",
      path: "/auth-integration/refresh-permissions",
      handler: "auth-integration.refreshPermissions",
      config: {
        middlewares: ["api::auth-integration.jwt-validator"],
      },
    },
    {
      method: "POST",
      path: "/auth-integration/logout",
      handler: "auth-integration.logout",
      config: {
        auth: false, // Allow logout without strict auth check
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/auth-integration/test-session",
      handler: "auth-integration.testSession",
      config: {
        auth: false, // Allow public access for testing
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/auth-integration/test-logout",
      handler: "auth-integration.testLogout",
      config: {
        auth: false, // Allow public access for testing logout
        policies: [],
        middlewares: [],
      },
    },
  ],
};
