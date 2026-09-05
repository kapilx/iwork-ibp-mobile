export default [
  "strapi::logger",
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "https:"],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "dl.airtable.com",
            "localhost:*",
          ],
          "media-src": [
            "'self'",
            "data:",
            "blob:",
            "dl.airtable.com",
            "localhost:*",
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: "strapi::cors",
    config: {
      origin: [
        "http://localhost:3000",
        "http://localhost:4201", 
        "http://localhost:5000",  // Add iwork frontend port
        "http://localhost:5017",
        "http://bar.localhost:4201",
        "http://localhost:*",
      ],
      credentials: true,
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    },
  },
  "strapi::poweredBy",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
  // Custom middleware for admin logout tracking
  {
    name: "global::admin-logout-tracker",
    config: {
      enabled: true,
    },
  },
  // Custom middleware for admin SSO
  {
    name: "global::admin-sso",
    config: {
      enabled: true,
    },
  },
  // Custom middleware for auth integration
  {
    name: "global::auth-integration",
    config: {
      enabled: true,
    },
  },
];
