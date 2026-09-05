export default ({ env }) => {
    const adminPath = env('ADMIN_PATH', '/admin');
    const rawAdminUrl = env('STRAPI_ADMIN_URL', '');
    const normalizedAdminPath = adminPath.startsWith('/') ? adminPath : `/${adminPath}`;
    const trimmedAdminUrl = rawAdminUrl.endsWith('/')
        ? rawAdminUrl.slice(0, -1)
        : rawAdminUrl;
    const normalizedAdminUrl = rawAdminUrl
        ? (
            trimmedAdminUrl
          ).endsWith(normalizedAdminPath)
            ? trimmedAdminUrl
            : `${trimmedAdminUrl}${normalizedAdminPath}`
        : '';
    const config: any = {
        auth: {
            secret: env('ADMIN_JWT_SECRET', 'defaultAdminSecret123'),
        },
        apiToken: {
            salt: env('API_TOKEN_SALT', 'defaultApiTokenSalt123'),
        },
        transfer: {
            token: {
                salt: env('TRANSFER_TOKEN_SALT', 'defaultTransferTokenSalt123'),
            },
        },
        flags: {
            nps: env.bool('FLAG_NPS', true),
            promoteEE: env.bool('FLAG_PROMOTE_EE', true),
        },
        serveAdminPanel: env.bool('SERVE_ADMIN', true),
        path: adminPath,
    };
    
    // Only set URL if explicitly provided (for gateway access)
    // This tells the client-side where the admin is accessed from
    if (normalizedAdminUrl) {
        config.url = normalizedAdminUrl;
    }
    
    return config;
};
