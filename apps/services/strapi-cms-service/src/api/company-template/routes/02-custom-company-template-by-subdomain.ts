/**
 * Custom routes for company-template
 * PUBLIC: No authentication required
 */

export default {
    routes: [
        {
            method: 'GET',
            path: '/company-templates/subdomain/:subdomain',
            handler: 'company-template.findBySubdomain',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
    ],
};

