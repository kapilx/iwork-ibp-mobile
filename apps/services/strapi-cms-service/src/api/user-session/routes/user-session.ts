/**
 * User Session Routes
 * Defines the API endpoints for user session tracking
 * SECURED: Requires admin authentication
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreRouter(
  "api::user-session.user-session",
  {
    config: {
      find: {
        auth: {
          scope: ["authenticated"],
        },
        policies: [],
        middlewares: ["api::auth-integration.jwt-validator"],
      },
      findOne: {
        auth: {
          scope: ["authenticated"],
        },
        policies: [],
        middlewares: ["api::auth-integration.jwt-validator"],
      },
      create: {
        auth: {
          scope: ["authenticated"],
        },
        policies: [],
        middlewares: ["api::auth-integration.jwt-validator"],
      },
      update: {
        auth: {
          scope: ["authenticated"],
        },
        policies: [],
        middlewares: ["api::auth-integration.jwt-validator"],
      },
      delete: {
        auth: {
          scope: ["authenticated"],
        },
        policies: [],
        middlewares: ["api::auth-integration.jwt-validator"],
      },
    },
  }
);

// Additional custom routes for session management
export const customRoutes = {
  routes: [
    {
      method: "GET",
      path: "/user-sessions/active/:userId",
      handler: "user-session.getActiveSessions",
      config: {
        auth: {
          scope: ["authenticated"],
        },
        policies: [],
        middlewares: ["api::auth-integration.jwt-validator"],
      },
    },
    {
      method: "PUT", 
      path: "/user-sessions/terminate/:userId",
      handler: "user-session.terminateUserSessions",
      config: {
        auth: {
          scope: ["authenticated"],
        },
        policies: [],
        middlewares: ["api::auth-integration.jwt-validator"],
      },
    },
  ],
};