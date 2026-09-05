/**
 * Custom routes for template-initializer
 * PUBLIC: No authentication required
 */

export default {
    routes: [
        {
            method: 'POST',
            path: '/initialize-templates',
            handler: 'template-initializer.initialize',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
    ],
};
