/**
 * Server Configuration for Strapi CMS Service
 * Uses environment variables from parent environments folder
 */

export default ({ env }) => {
    const port = env.int('PORT_STRAPI_CMS_SERVICE', 3024);
    const publicUrl = env('STRAPI_PUBLIC_URL', 'http://localhost:4321');
    const proxyEnabled = env.bool('STRAPI_PROXY_ENABLED', false);
    return {
        host: env('HOST_STRAPI_CMS_SERVICE', '0.0.0.0'),
        port: port,
        app: {
            keys: env.array('APP_KEYS', [
                'defaultKey1',
                'defaultKey2',
                'defaultKey3',
                'defaultKey4',
            ]),
        },
        url: publicUrl,
        proxy: proxyEnabled,
        webhooks: {
            populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
        },
    };
};
