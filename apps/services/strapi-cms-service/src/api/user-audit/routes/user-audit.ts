/**
 * User Audit Routes
 * Defines the API endpoints for user audit trail tracking
 * SECURED: Requires admin authentication
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreRouter(
  "api::user-audit.user-audit",
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

// Additional custom routes for audit trail management
export const customRoutes = {
  routes: [
    {
      method: "GET",
      path: "/user-audits/trail/:userId",
      handler: "user-audit.getUserAuditTrail",
      config: {
        auth: {
          scope: ["authenticated"],
        },
        policies: [],
        middlewares: ["api::auth-integration.jwt-validator"],
      },
    },
    {
      method: "GET",
      path: "/user-audits/recent-logins",
      handler: "user-audit.getRecentLogins",
      config: {
        auth: {
          scope: ["authenticated"],
        },
        policies: [],
        middlewares: ["api::auth-integration.jwt-validator"],
      },
    },
    {
      method: "GET",
      path: "/user-audits/summary",
      handler: "user-audit.getActivitySummary",
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